// End-to-end encryption engine built on matrix-sdk-crypto (Olm for device-to-device
// key exchange, Megolm for conversation messages). Environment-agnostic: the wasm SDK,
// HTTP transport and key-value storage are injected, so the same code runs in the
// browser and in the backend's Node integration tests.
//
// The server only ever receives public keys, Olm-encrypted room keys and Megolm
// ciphertext. Private keys stay in the OlmMachine's store on this device.

const SERVER_NAME = 'pinclone.local'

const mutex = () => {
  let tail = Promise.resolve()
  return (fn) => {
    const run = tail.then(fn, fn)
    tail = run.catch(() => {})
    return run
  }
}

export const randomDeviceId = () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = crypto.getRandomValues(new Uint8Array(12))
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('')
}

// "AbCd EfGh ..." grouping makes fingerprints easier to compare out loud
export const formatFingerprint = (key) => (key ? key.match(/.{1,4}/g).join(' ') : '')

export class DecryptError extends Error {
  constructor(code, message) {
    super(message)
    this.code = code
  }
}

export default class CryptoEngine {
  constructor({ sdk, machine, http, kv, userId, deviceId, serverName }) {
    this.sdk = sdk
    this.machine = machine
    this.http = http
    this.kv = kv
    this.userId = userId
    this.deviceId = deviceId
    this.serverName = serverName
    this.outgoingLock = mutex()
    this.syncLock = mutex()
    this.roomLocks = new Map()
    this.trackedRooms = new Set()
    this.roomKeyListeners = new Set()
    machine.registerRoomKeyUpdatedCallback(async (infos) => {
      const sessions = infos.map((i) => i.sessionId)
      infos.forEach((i) => i.free?.())
      this.roomKeyListeners.forEach((listener) => listener(sessions))
    })
  }

  /**
   * @param sdk        the matrix-sdk-crypto-wasm module (already initialised)
   * @param http       async (method, path, body, headers) => parsed JSON
   * @param kv         { get(key), set(key, value) } persistent storage for sync state
   * @param storeName  IndexedDB store name (browser); omit for an in-memory store
   * @param storeKey   32 random bytes used to encrypt the IndexedDB store
   */
  static async create({ sdk, http, kv, userId, deviceId, storeName, storeKey, serverName = SERVER_NAME }) {
    const matrixUser = new sdk.UserId(`@${userId}:${serverName}`)
    const matrixDevice = new sdk.DeviceId(deviceId)
    const machine = storeName
      ? await sdk.OlmMachine.initFromStore(matrixUser, matrixDevice, await sdk.StoreHandle.openWithKey(storeName, storeKey))
      : await sdk.OlmMachine.initialize(matrixUser, matrixDevice)
    const engine = new CryptoEngine({ sdk, machine, http, kv, userId, deviceId, serverName })
    await engine.processOutgoing()
    return engine
  }

  matrixId(userId) {
    return `@${userId}:${this.serverName}`
  }

  request(method, path, body) {
    return this.http(method, path, body, { 'X-Device-Id': this.deviceId })
  }

  // Sends every request the state machine has queued (key uploads, queries, room keys).
  processOutgoing() {
    return this.outgoingLock(async () => {
      for (let round = 0; round < 10; round++) {
        const requests = await this.machine.outgoingRequests()
        if (!requests.length) return
        for (const request of requests) await this.sendRequest(request)
      }
    })
  }

  async sendRequest(request) {
    const { RequestType } = this.sdk
    const body = request.body ? JSON.parse(request.body) : {}
    let response
    switch (request.type) {
      case RequestType.KeysUpload:
        response = await this.request('POST', '/chat/keys/upload', body)
        break
      case RequestType.KeysQuery:
        response = await this.request('POST', '/chat/keys/query', body)
        break
      case RequestType.KeysClaim:
        response = await this.request('POST', '/chat/keys/claim', body)
        break
      case RequestType.ToDevice:
        response = await this.request(
          'PUT',
          `/chat/sendToDevice/${encodeURIComponent(request.event_type)}/${encodeURIComponent(request.txn_id)}`,
          body,
        )
        break
      default:
        // Cross-signing, key backup and in-room verification are not used by this app
        response = {}
    }
    if (request.id) await this.machine.markRequestAsSent(request.id, request.type, JSON.stringify(response))
  }

  // Pulls pending to-device messages (room keys) and device-list changes from the server.
  sync() {
    return this.syncLock(async () => {
      let since = Number((await this.kv.get('since')) ?? 0)
      let ack = (await this.kv.get('ack')) ?? []
      for (let page = 0; page < 20; page++) {
        const data = await this.request('POST', '/chat/sync', { since, ack })
        const { sdk } = this
        const changed = (data.device_lists?.changed ?? []).map((id) => new sdk.UserId(id))
        await this.machine.receiveSyncChanges(
          JSON.stringify(data.to_device ?? []),
          new sdk.DeviceLists(changed, []),
          new Map(Object.entries(data.device_one_time_keys_count ?? {})),
          new Set(data.device_unused_fallback_key_types ?? []),
        )
        since = data.next_batch ?? since
        ack = data.to_device_ids ?? []
        // Persist before acknowledging so a crash can't lose room keys
        await this.kv.set('since', since)
        await this.kv.set('ack', ack)
        await this.processOutgoing()
        if (!ack.length && !data.has_more) break
      }
      if (ack.length) {
        await this.request('POST', '/chat/sync', { since, ack })
        await this.kv.set('ack', [])
      }
    })
  }

  roomLock(roomId) {
    if (!this.roomLocks.has(roomId)) this.roomLocks.set(roomId, mutex())
    return this.roomLocks.get(roomId)
  }

  // Makes sure every current device of every member has this conversation's room key.
  async prepareRoom(roomId, memberIds) {
    const { sdk } = this
    const users = () => memberIds.map((id) => new sdk.UserId(this.matrixId(id)))
    if (!this.trackedRooms.has(roomId)) {
      await this.machine.updateTrackedUsers(users())
      this.trackedRooms.add(roomId)
    }
    await this.processOutgoing()
    const claim = await this.outgoingLock(() => this.machine.getMissingSessions(users()))
    if (claim) await this.outgoingLock(() => this.sendRequest(claim))
    const settings = new sdk.EncryptionSettings()
    settings.sharingStrategy = sdk.CollectStrategy.allDevices()
    const shares = await this.machine.shareRoomKey(new sdk.RoomId(roomId), users(), settings)
    for (const share of shares) await this.outgoingLock(() => this.sendRequest(share))
  }

  // Encrypts a message content object for everyone in the conversation.
  encrypt(roomId, memberIds, content) {
    return this.roomLock(roomId)(async () => {
      await this.prepareRoom(roomId, memberIds)
      const encrypted = await this.machine.encryptRoomEvent(new this.sdk.RoomId(roomId), 'm.room.message', JSON.stringify(content))
      return JSON.parse(encrypted)
    })
  }

  // Decrypts a stored message event. Throws DecryptError with a code on failure.
  async decrypt(event) {
    const { sdk } = this
    const roomEvent = {
      type: 'm.room.encrypted',
      event_id: event.event_id,
      sender: event.sender,
      origin_server_ts: event.origin_server_ts,
      room_id: event.room_id,
      content: event.content,
    }
    let decrypted
    try {
      decrypted = await this.machine.decryptRoomEvent(
        JSON.stringify(roomEvent),
        new sdk.RoomId(event.room_id),
        new sdk.DecryptionSettings(sdk.TrustRequirement.Untrusted),
      )
    } catch (error) {
      const missing = [sdk.DecryptionErrorCode.MissingRoomKey, sdk.DecryptionErrorCode.UnknownMessageIndex].includes(error?.code)
      throw new DecryptError(
        missing ? 'missing_key' : 'failed',
        missing ? "This device doesn't have the key for this message yet" : 'This message could not be decrypted',
      )
    }
    const payload = JSON.parse(decrypted.event)
    const senderDevice = decrypted.senderDevice?.toString()
    const shield = decrypted.shieldState(false)
    const device = senderDevice ? await this.machine.getDevice(new sdk.UserId(event.sender), new sdk.DeviceId(senderDevice)) : undefined
    const result = {
      content: payload.content,
      senderDeviceId: senderDevice,
      verified: Boolean(device?.isVerified()),
      // Only a mismatch between claimed and actual sender is a hard warning; unverified devices are shown separately
      tampered: shield.code === sdk.ShieldStateCode.MismatchedSender || shield.code === sdk.ShieldStateCode.AuthenticityNotGuaranteed,
    }
    // The encrypted payload is bound to its conversation; a replay into another one is rejected
    if (payload.room_id && payload.room_id !== event.room_id) result.tampered = true
    device?.free?.()
    decrypted.free?.()
    return result
  }

  onRoomKeysUpdated(listener) {
    this.roomKeyListeners.add(listener)
    return () => this.roomKeyListeners.delete(listener)
  }

  get fingerprint() {
    return this.machine.identityKeys.ed25519.toBase64()
  }

  // Devices of a user with their fingerprints and local trust state.
  async devicesOf(userId) {
    const { sdk } = this
    await this.machine.updateTrackedUsers([new sdk.UserId(this.matrixId(userId))])
    await this.processOutgoing()
    const devices = await this.machine.getUserDevices(new sdk.UserId(this.matrixId(userId)), 5)
    const list = devices.devices().map((d) => ({
      userId,
      deviceId: d.deviceId.toString(),
      displayName: d.displayName ?? null,
      fingerprint: d.ed25519Key?.toBase64() ?? '',
      verified: d.isVerified(),
      blocked: d.isBlacklisted(),
      isCurrent: userId === this.userId && d.deviceId.toString() === this.deviceId,
    }))
    devices.free?.()
    return list
  }

  async setDeviceTrust(userId, deviceId, trust) {
    const { sdk } = this
    const device = await this.machine.getDevice(new sdk.UserId(this.matrixId(userId)), new sdk.DeviceId(deviceId))
    if (!device) throw new Error('Unknown device')
    const level = { verified: sdk.LocalTrust.Verified, blocked: sdk.LocalTrust.BlackListed, unset: sdk.LocalTrust.Unset }[trust]
    await device.setLocalTrust(level)
    device.free?.()
    // Blocking or unblocking changes who should receive future room keys
    if (trust !== 'verified') for (const roomId of this.trackedRooms) await this.machine.invalidateGroupSession(new sdk.RoomId(roomId))
  }

  // Per-file AES-CTR key + SHA-256 hash (Matrix encrypted attachment format).
  encryptAttachment(bytes) {
    const encrypted = this.sdk.Attachment.encrypt(bytes)
    const info = JSON.parse(encrypted.mediaEncryptionInfo)
    const data = encrypted.encryptedData
    encrypted.free?.()
    return { data, info }
  }

  decryptAttachment(bytes, info) {
    const attachment = new this.sdk.EncryptedAttachment(bytes, JSON.stringify(info))
    try {
      return this.sdk.Attachment.decrypt(attachment)
    } catch {
      throw new DecryptError('failed', 'This file could not be decrypted or was modified')
    }
  }

  close() {
    this.machine.close()
  }
}
