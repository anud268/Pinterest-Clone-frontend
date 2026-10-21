// Client-side chat state: socket connection, conversations, encrypted history,
// decryption, offline outbox and encrypted attachments. Plaintext only ever lives
// in memory on this device.
import { useSyncExternalStore } from 'react'
import { io } from 'socket.io-client'
import { api, API_URL } from '../lib/api'
import { toast } from '../lib/toast'
import CryptoEngine, { randomDeviceId } from './cryptoEngine'
import { deleteDatabase, kvDelete, kvGet, kvSet, scopedKv } from './kv'

const initialState = {
  user: null,
  connected: false,
  crypto: 'idle', // idle | loading | ready | error
  cryptoError: null,
  conversations: [],
  conversationsStatus: 'idle',
  unreadTotal: 0,
  activeId: null,
  threads: {}, // conversationId -> { items, hasMore, status }
  decrypted: {}, // messageId -> { status, content, verified, tampered, error }
  pending: {}, // conversationId -> [outgoing message]
  typing: {}, // conversationId -> expiry timestamp
  presence: {}, // userId -> true | false | null (hidden)
}

let state = initialState
const listeners = new Set()
const set = (updater) => {
  state = typeof updater === 'function' ? updater(state) : { ...state, ...updater }
  listeners.forEach((l) => l())
}
const subscribe = (l) => {
  listeners.add(l)
  return () => listeners.delete(l)
}
export const getChatState = () => state
// Selectors must return stable references; use these as fallbacks instead of new [] / {}
export const EMPTY_LIST = Object.freeze([])
export const EMPTY_THREAD = Object.freeze({ items: EMPTY_LIST, hasMore: false, status: 'idle' })
export const useChat = (selector) => useSyncExternalStore(subscribe, () => selector(state))

let socket = null
let engine = null
let enginePromise = null
let device = null // { deviceId, storeKey }
const mediaCache = new Map() // attachmentId -> Promise<objectURL>
const typingTimers = new Map()

const http = async (method, path, body, headers) => {
  try {
    const { data } = await api.request({ method, url: path, data: body, headers })
    return data
  } catch (error) {
    const wrapped = new Error(error.response?.data?.message || error.message)
    wrapped.status = error.response?.status
    wrapped.network = !error.response
    throw wrapped
  }
}

const deviceKey = (userId) => `device:${userId}`
const storeName = (userId, deviceId) => `pinclone-crypto-${userId}-${deviceId}`

const loadDevice = async (userId) => {
  let saved = await kvGet(deviceKey(userId))
  if (!saved) {
    saved = { deviceId: randomDeviceId(), storeKey: crypto.getRandomValues(new Uint8Array(32)) }
    await kvSet(deviceKey(userId), saved)
  }
  return saved
}

// Forget this browser's chat device (keys + sync state) so a fresh one is created next time
const wipeLocalDevice = async (userId) => {
  const saved = await kvGet(deviceKey(userId))
  engine?.close()
  engine = null
  enginePromise = null
  if (saved) {
    const name = storeName(userId, saved.deviceId)
    await deleteDatabase(`${name}::matrix-sdk-crypto`)
    await deleteDatabase(`${name}::matrix-sdk-crypto-meta`)
    await kvDelete(`${name}:since`)
    await kvDelete(`${name}:ack`)
  }
  await kvDelete(deviceKey(userId))
  device = null
}

const browserName = () => {
  const ua = navigator.userAgent
  const browserMatch = /(Edg|Chrome|Firefox|Safari)\//.exec(ua)?.[1]
  const os = /Windows|Mac OS|Android|iPhone|iPad|Linux/.exec(ua)?.[0] ?? 'device'
  return `${{ Edg: 'Edge' }[browserMatch] ?? browserMatch ?? 'Browser'} on ${os.replace('Mac OS', 'macOS')}`
}

// ─── Crypto lifecycle ─────────────────────────────────────────────────────────
export const ensureCrypto = () => {
  if (engine) return Promise.resolve(engine)
  if (enginePromise) return enginePromise
  const user = state.user
  if (!user) return Promise.reject(new Error('Not signed in'))

  set({ crypto: 'loading', cryptoError: null })
  enginePromise = (async () => {
    // The ~8MB wasm module is only downloaded when chat is opened
    const sdk = await import('@matrix-org/matrix-sdk-crypto-wasm')
    await sdk.initAsync()
    const { serverName } = await http('GET', '/chat/config')
    device = await loadDevice(user._id)
    const name = storeName(user._id, device.deviceId)
    try {
      engine = await CryptoEngine.create({ sdk, http, kv: scopedKv(name), userId: user._id, deviceId: device.deviceId, storeName: name, storeKey: device.storeKey, serverName })
    } catch (error) {
      if (error.status !== 409) throw error
      // The server knows this device id with other keys (local data was lost): start over
      await wipeLocalDevice(user._id)
      device = await loadDevice(user._id)
      const fresh = storeName(user._id, device.deviceId)
      engine = await CryptoEngine.create({ sdk, http, kv: scopedKv(fresh), userId: user._id, deviceId: device.deviceId, storeName: fresh, storeKey: device.storeKey, serverName })
    }
    http('PATCH', `/chat/devices/${device.deviceId}`, { displayName: browserName() }).catch(() => {})
    engine.onRoomKeysUpdated(() => retryUndecrypted())
    await safeSync()
    reconnectSocket()
    set({ crypto: 'ready' })
    redecryptAll()
    flushOutbox()
    return engine
  })().catch((error) => {
    enginePromise = null
    console.error('[chat] Could not start encryption:', error)
    set({ crypto: 'error', cryptoError: "Encrypted chat couldn't start on this device. Check your connection and try again." })
    throw error
  })
  return enginePromise
}

const safeSync = async () => {
  if (!engine) return
  try {
    await engine.sync()
  } catch (error) {
    if (error.status === 410) {
      toast.error('This device was signed out of encrypted chat. Setting it up again…')
      await wipeLocalDevice(state.user._id)
      set({ crypto: 'idle', decrypted: {} })
      ensureCrypto().catch(() => {})
    }
  }
}

// ─── Decryption ───────────────────────────────────────────────────────────────
const setDecrypted = (id, value) => set((s) => ({ ...s, decrypted: { ...s.decrypted, [id]: value } }))

const decryptEvent = async (event) => {
  if (!event || event.deleted || !engine) return
  const current = state.decrypted[event._id]
  if (current?.status === 'ok') return
  try {
    const result = await engine.decrypt(event)
    setDecrypted(event._id, { status: 'ok', ...result })
  } catch (error) {
    setDecrypted(event._id, { status: error.code === 'missing_key' ? 'missing_key' : 'failed', error: error.message })
  }
}

const redecryptAll = () => {
  for (const thread of Object.values(state.threads)) thread.items.forEach(decryptEvent)
  state.conversations.forEach((c) => decryptEvent(c.lastMessage))
}

const retryUndecrypted = () => {
  const failed = new Set(Object.entries(state.decrypted).filter(([, d]) => d.status !== 'ok').map(([id]) => id))
  if (!failed.size) return
  for (const thread of Object.values(state.threads)) thread.items.filter((m) => failed.has(m._id)).forEach(decryptEvent)
  state.conversations.map((c) => c.lastMessage).filter((m) => m && failed.has(m._id)).forEach(decryptEvent)
}

// ─── Conversations & history ──────────────────────────────────────────────────
const upsertConversation = (summary) =>
  set((s) => {
    const others = s.conversations.filter((c) => c._id !== summary._id)
    const conversations = [summary, ...others].sort((a, b) => new Date(b.lastMessageAt ?? 0) - new Date(a.lastMessageAt ?? 0))
    return { ...s, conversations, unreadTotal: conversations.reduce((n, c) => n + c.unread, 0) }
  })

const patchConversation = (id, patch) =>
  set((s) => {
    const conversations = s.conversations.map((c) => (c._id === id ? { ...c, ...(typeof patch === 'function' ? patch(c) : patch) } : c))
    return { ...s, conversations, unreadTotal: conversations.reduce((n, c) => n + c.unread, 0) }
  })

export const loadConversations = async () => {
  if (state.conversationsStatus === 'idle') set({ conversationsStatus: 'loading' })
  try {
    const { conversations } = await http('GET', '/chat/conversations')
    set((s) => ({
      ...s,
      conversations,
      conversationsStatus: 'ready',
      unreadTotal: conversations.reduce((n, c) => n + c.unread, 0),
      presence: { ...s.presence, ...Object.fromEntries(conversations.map((c) => [c.partner._id, c.partner.online])) },
    }))
    conversations.forEach((c) => decryptEvent(c.lastMessage))
  } catch {
    set({ conversationsStatus: state.conversations.length ? 'ready' : 'error' })
  }
}

export const openConversationWith = async (userId) => {
  const { conversation } = await http('POST', '/chat/conversations', { userId })
  upsertConversation(conversation)
  return conversation
}

export const getConversation = (id) => state.conversations.find((c) => c._id === id)

export const fetchConversation = async (id) => {
  const existing = getConversation(id)
  if (existing) return existing
  const { conversation } = await http('GET', `/chat/conversations/${id}`)
  upsertConversation(conversation)
  return conversation
}

const mergeMessages = (items, incoming) => {
  const byId = new Map(items.map((m) => [m._id, m]))
  incoming.forEach((m) => byId.set(m._id, m))
  return [...byId.values()].sort((a, b) => a.seq - b.seq)
}

const setThread = (id, patch) =>
  set((s) => {
    const thread = s.threads[id] ?? { items: [], hasMore: false, status: 'idle' }
    return { ...s, threads: { ...s.threads, [id]: { ...thread, ...(typeof patch === 'function' ? patch(thread) : patch) } } }
  })

export const loadMessages = async (id, { older = false } = {}) => {
  const thread = state.threads[id]
  if (older && (!thread?.hasMore || thread.status === 'loading-older')) return
  setThread(id, { status: older ? 'loading-older' : thread?.items.length ? 'refreshing' : 'loading' })
  try {
    const before = older ? thread.items[0]?.seq : undefined
    const { messages, hasMore } = await http('GET', `/chat/conversations/${id}/messages?limit=30${before ? `&before=${before}` : ''}`)
    setThread(id, (t) => ({ items: mergeMessages(t.items, messages), hasMore: older || !t.items.length ? hasMore : t.hasMore, status: 'ready' }))
    messages.forEach(decryptEvent)
    if (!older) markSeen(id)
  } catch (error) {
    setThread(id, { status: 'error', error: error.message })
  }
}

// Sends delivery and (if the thread is open and visible) read receipts
export const markSeen = (id) => {
  const conversation = getConversation(id)
  const last = state.threads[id]?.items.at(-1)
  if (!conversation || !last) return
  const visible = document.visibilityState === 'visible' && state.activeId === id
  const body = visible ? { readSeq: last.seq } : { deliveredSeq: last.seq }
  if (visible && conversation.unread) patchConversation(id, { unread: 0 })
  http('POST', `/chat/conversations/${id}/receipts`, body).catch(() => {})
}

export const setActiveConversation = (id) => {
  set({ activeId: id })
  if (id) markSeen(id)
}

// ─── Sending ──────────────────────────────────────────────────────────────────
const newClientId = () => Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(16).padStart(2, '0')).join('')

const setPending = (conversationId, clientMessageId, patch) =>
  set((s) => {
    const list = s.pending[conversationId] ?? []
    const next = patch === null ? list.filter((p) => p.clientMessageId !== clientMessageId) : list.map((p) => (p.clientMessageId === clientMessageId ? { ...p, ...patch } : p))
    return { ...s, pending: { ...s.pending, [conversationId]: next } }
  })

const addPending = (conversationId, item) =>
  set((s) => ({ ...s, pending: { ...s.pending, [conversationId]: [...(s.pending[conversationId] ?? []), item] } }))

const receiveMessage = (conversationId, message) => {
  setThread(conversationId, (t) => ({ items: mergeMessages(t.items, [message]) }))
  patchConversation(conversationId, (c) => ({
    lastMessage: !c.lastMessage || message.seq >= c.lastMessage.seq ? message : c.lastMessage,
    lastMessageAt: new Date(message.origin_server_ts).toISOString(),
    unread: message.senderId !== state.user?._id && state.activeId !== conversationId ? c.unread + 1 : c.unread,
  }))
}

const deliver = async (item) => {
  const conversation = getConversation(item.conversationId)
  try {
    const eng = await ensureCrypto()
    if (!item.encrypted) {
      setPending(item.conversationId, item.clientMessageId, { status: 'encrypting' })
      const encrypted = await eng.encrypt(conversation.roomId, [state.user._id, conversation.partner._id], item.content)
      item.encrypted = encrypted
    }
    setPending(item.conversationId, item.clientMessageId, { status: 'sending', encrypted: item.encrypted })
    const { message } = await http(
      'POST',
      `/chat/conversations/${item.conversationId}/messages`,
      { clientMessageId: item.clientMessageId, content: item.encrypted, attachmentIds: item.attachmentIds ?? [] },
      { 'X-Device-Id': eng.deviceId },
    )
    // We already know our own plaintext; no need to decrypt it again
    setDecrypted(message._id, { status: 'ok', content: item.content, senderDeviceId: eng.deviceId, verified: true, tampered: false })
    setPending(item.conversationId, item.clientMessageId, null)
    receiveMessage(item.conversationId, message)
  } catch (error) {
    const offline = error.network || !navigator.onLine
    setPending(item.conversationId, item.clientMessageId, { status: offline ? 'queued' : 'failed', error: offline ? null : error.message })
  }
}

const enqueue = (conversationId, content, extra = {}) => {
  const item = { conversationId, clientMessageId: newClientId(), content, status: 'queued', createdAt: Date.now(), ...extra }
  addPending(conversationId, item)
  if (state.connected && navigator.onLine) deliver(item)
  return item
}

export const sendText = (conversationId, text) => enqueue(conversationId, { msgtype: 'm.text', body: text })

export const retryMessage = (conversationId, clientMessageId) => {
  const item = state.pending[conversationId]?.find((p) => p.clientMessageId === clientMessageId)
  if (item) deliver(item)
}

export const discardMessage = (conversationId, clientMessageId) => setPending(conversationId, clientMessageId, null)

const flushOutbox = () => {
  if (!state.connected || !engine) return
  for (const list of Object.values(state.pending)) list.filter((p) => p.status === 'queued').forEach(deliver)
}

export const deleteMessage = async (conversationId, messageId) => {
  try {
    const { message } = await http('DELETE', `/chat/conversations/${conversationId}/messages/${messageId}`)
    receiveMessage(conversationId, message)
  } catch (error) {
    toast.error(error.message)
  }
}

// ─── Encrypted attachments ────────────────────────────────────────────────────
// Re-encodes still images through a canvas, which drops EXIF/GPS metadata.
const stripImageMetadata = async (file) => {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return { blob: file }
  const bitmap = await createImageBitmap(file)
  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  canvas.getContext('2d').drawImage(bitmap, 0, 0)
  bitmap.close?.()
  const type = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, type, 0.92))
  return { blob, width: canvas.width, height: canvas.height }
}

const mediaDuration = (file) =>
  new Promise((resolve) => {
    const el = document.createElement(file.type.startsWith('video') ? 'video' : 'audio')
    el.preload = 'metadata'
    el.onloadedmetadata = () => {
      const duration = Number.isFinite(el.duration) ? Math.round(el.duration * 1000) : undefined
      resolve({ duration, width: el.videoWidth || undefined, height: el.videoHeight || undefined })
      URL.revokeObjectURL(el.src)
    }
    el.onerror = () => resolve({})
    el.src = URL.createObjectURL(file)
  })

export const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024

export const sendAttachment = async (conversationId, file, { durationMs } = {}) => {
  if (file.size > MAX_ATTACHMENT_BYTES) return toast.error('Files must be 25MB or smaller.')
  const kind = file.type.startsWith('image/') ? 'm.image' : file.type.startsWith('video/') ? 'm.video' : file.type.startsWith('audio/') ? 'm.audio' : 'm.file'
  const previewUrl = URL.createObjectURL(file)
  const item = {
    conversationId,
    clientMessageId: newClientId(),
    status: 'preparing',
    createdAt: Date.now(),
    content: { msgtype: kind, body: file.name || 'attachment' },
    previewUrl,
    progress: 0,
  }
  addPending(conversationId, item)
  try {
    const eng = await ensureCrypto()
    const prepared = kind === 'm.image' ? await stripImageMetadata(file) : { blob: file, ...(kind !== 'm.file' ? await mediaDuration(file) : {}) }
    const bytes = new Uint8Array(await prepared.blob.arrayBuffer())
    const { data, info } = eng.encryptAttachment(bytes)

    const form = new FormData()
    form.append('conversationId', conversationId)
    form.append('file', new Blob([data], { type: 'application/octet-stream' }), 'blob')
    setPending(conversationId, item.clientMessageId, { status: 'uploading' })
    const { data: uploaded } = await api.post('/chat/attachments', form, {
      onUploadProgress: (e) => e.total && setPending(conversationId, item.clientMessageId, { progress: e.loaded / e.total }),
    })

    // Original file name, type and the decryption key only travel inside the encrypted message
    const content = {
      msgtype: kind,
      body: kind === 'm.audio' ? 'Voice message' : file.name || 'attachment',
      info: {
        mimetype: prepared.blob.type || file.type,
        size: bytes.length,
        w: prepared.width,
        h: prepared.height,
        duration: durationMs ?? prepared.duration,
      },
      file: { attachmentId: uploaded.attachmentId, ...info },
    }
    mediaCache.set(uploaded.attachmentId, Promise.resolve(previewUrl))
    item.content = content
    item.attachmentIds = [uploaded.attachmentId]
    setPending(conversationId, item.clientMessageId, { content, attachmentIds: item.attachmentIds })
    await deliver(item)
  } catch (error) {
    const message = error.response?.data?.message || error.message
    setPending(conversationId, item.clientMessageId, { status: 'failed', error: message || 'Upload failed' })
  }
}

// Downloads and decrypts an attachment; results are cached as object URLs for this session.
export const attachmentUrl = (file, mimetype) => {
  if (!mediaCache.has(file.attachmentId)) {
    const promise = (async () => {
      const eng = await ensureCrypto()
      const { data } = await api.get(`/chat/attachments/${file.attachmentId}`, { responseType: 'arraybuffer' })
      const plain = eng.decryptAttachment(new Uint8Array(data), file)
      return URL.createObjectURL(new Blob([plain], { type: mimetype || 'application/octet-stream' }))
    })()
    promise.catch(() => mediaCache.delete(file.attachmentId))
    mediaCache.set(file.attachmentId, promise)
  }
  return mediaCache.get(file.attachmentId)
}

// ─── Devices & verification ───────────────────────────────────────────────────
export const devicesOf = async (userId) => (await ensureCrypto()).devicesOf(userId)
export const setDeviceTrust = async (userId, deviceId, trust) => (await ensureCrypto()).setDeviceTrust(userId, deviceId, trust)
export const ownDevice = async () => {
  const eng = await ensureCrypto()
  return { deviceId: eng.deviceId, fingerprint: eng.fingerprint }
}
export const removeServerDevice = async (deviceId) => {
  await http('DELETE', `/chat/devices/${deviceId}`)
  if (deviceId === device?.deviceId) {
    await wipeLocalDevice(state.user._id)
    set({ crypto: 'idle', decrypted: {} })
  }
}
export const listServerDevices = async () => (await http('GET', '/chat/devices')).devices
export const currentDeviceId = () => device?.deviceId ?? null

// ─── Typing ───────────────────────────────────────────────────────────────────
let lastTypingSent = 0
export const sendTyping = (conversationId, typing) => {
  if (!socket?.connected) return
  const now = Date.now()
  if (typing && now - lastTypingSent < 3000) return
  lastTypingSent = typing ? now : 0
  socket.emit('typing', { conversationId, typing })
}

// ─── Socket ───────────────────────────────────────────────────────────────────
const bindSocket = (s) => {
  s.on('connect', () => {
    set({ connected: true })
    loadConversations()
    s.emit('presence:query', (presence) => set((st) => ({ ...st, presence: { ...st.presence, ...presence } })))
    if (state.activeId) loadMessages(state.activeId)
    safeSync().then(flushOutbox)
  })
  s.on('disconnect', () => set({ connected: false }))
  s.on('message:new', ({ conversationId, message }) => {
    if (!getConversation(conversationId)) {
      fetchConversation(conversationId).catch(() => {})
    }
    receiveMessage(conversationId, message)
    decryptEvent(message)
    if (message.senderId !== state.user?._id) {
      markSeen(conversationId)
      if (state.activeId !== conversationId) {
        const name = getConversation(conversationId)?.partner.fullname
        toast.info(name ? `New message from ${name}` : 'New message')
      }
    }
  })
  s.on('message:deleted', ({ conversationId, message }) => receiveMessage(conversationId, message))
  s.on('todevice', () => safeSync())
  s.on('keys:changed', () => safeSync())
  s.on('device:removed', () => safeSync())
  s.on('receipt', ({ conversationId, userId, readSeq, deliveredSeq }) => {
    if (userId === state.user?._id) {
      if (readSeq !== undefined) patchConversation(conversationId, { unread: 0 })
      return
    }
    patchConversation(conversationId, (c) => ({
      partnerReadSeq: Math.max(c.partnerReadSeq ?? 0, readSeq ?? 0),
      partnerDeliveredSeq: Math.max(c.partnerDeliveredSeq ?? 0, deliveredSeq ?? 0, readSeq ?? 0),
    }))
  })
  s.on('typing', ({ conversationId, typing }) => {
    clearTimeout(typingTimers.get(conversationId))
    set((st) => ({ ...st, typing: { ...st.typing, [conversationId]: typing ? Date.now() + 5000 : 0 } }))
    if (typing) {
      typingTimers.set(conversationId, setTimeout(() => set((st) => ({ ...st, typing: { ...st.typing, [conversationId]: 0 } })), 5000))
    }
  })
  s.on('presence', ({ userId, online }) => set((st) => ({ ...st, presence: { ...st.presence, [userId]: online } })))
}

const connectSocket = () => {
  socket?.removeAllListeners()
  socket?.disconnect()
  socket = io(API_URL, { withCredentials: true, auth: { deviceId: device?.deviceId }, transports: ['websocket', 'polling'] })
  bindSocket(socket)
}

const reconnectSocket = () => {
  // Re-authenticate with the device id so this device receives key notifications
  if (socket?.auth?.deviceId !== device?.deviceId) connectSocket()
}

// Called by the app shell when the signed-in user changes.
export const startChat = async (user) => {
  if (state.user?._id === user._id) return
  stopChat()
  set({ ...initialState, user })
  device = (await kvGet(deviceKey(user._id))) ?? null
  connectSocket()
}

export const stopChat = () => {
  socket?.removeAllListeners()
  socket?.disconnect()
  socket = null
  engine?.close()
  engine = null
  enginePromise = null
  device = null
  for (const url of mediaCache.values()) url.then((u) => URL.revokeObjectURL(u)).catch(() => {})
  mediaCache.clear()
  set(initialState)
}

if (typeof window !== 'undefined') {
  // The socket only notices a dead network after its ping timeout (~45s); the browser knows sooner
  window.addEventListener('offline', () => set({ connected: false }))
  window.addEventListener('online', () => {
    if (!socket) return
    if (socket.connected) {
      set({ connected: true })
      flushOutbox()
    } else socket.connect()
  })
  document.addEventListener('visibilitychange', () => state.activeId && document.visibilityState === 'visible' && markSeen(state.activeId))
}
