import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { IoArrowBack, IoCloudOfflineOutline, IoLockClosed, IoShieldCheckmark, IoShieldOutline } from 'react-icons/io5'
import {
  EMPTY_LIST,
  EMPTY_THREAD,
  deleteMessage,
  devicesOf,
  discardMessage,
  fetchConversation,
  loadMessages,
  retryMessage,
  setActiveConversation,
  useChat,
} from '../../chat/chatStore'
import { useDocumentTitle } from '../../lib/hooks'
import Avatar from '../UI/Avatar'
import Button from '../UI/Button'
import { ConfirmDialog } from '../UI/Dialog'
import EmptyState from '../UI/EmptyState'
import Spinner from '../UI/Spinner'
import Composer from './Composer'
import DevicesDialog from './DevicesDialog'
import MessageBubble from './MessageBubble'
import { formatDayDivider } from './format'

const NEAR_BOTTOM_PX = 160

const deliveryStatus = (message, conversation) => {
  if (message.seq <= (conversation.partnerReadSeq ?? 0)) return 'read'
  if (message.seq <= (conversation.partnerDeliveredSeq ?? 0)) return 'delivered'
  return 'sent'
}

export default function ConversationView({ conversationId }) {
  const conversation = useChat((s) => s.conversations.find((c) => c._id === conversationId))
  const thread = useChat((s) => s.threads[conversationId] ?? EMPTY_THREAD)
  const pending = useChat((s) => s.pending[conversationId] ?? EMPTY_LIST)
  const decrypted = useChat((s) => s.decrypted)
  const typingUntil = useChat((s) => s.typing[conversationId] ?? 0)
  const online = useChat((s) => (conversation ? s.presence[conversation.partner._id] : null))
  const connected = useChat((s) => s.connected)
  const userId = useChat((s) => s.user?._id)

  const [loadError, setLoadError] = useState(null)
  const [devicesOpen, setDevicesOpen] = useState(false)
  const [trust, setTrust] = useState('unknown')
  const [toDelete, setToDelete] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [dropped, setDropped] = useState(null)
  const scroller = useRef(null)
  const stickToBottom = useRef(true)
  const previousHeight = useRef(0)
  useDocumentTitle(conversation ? conversation.partner.fullname : 'Messages')

  useEffect(() => {
    setActiveConversation(conversationId)
    fetchConversation(conversationId)
      .then(() => loadMessages(conversationId))
      .catch(() => setLoadError('This conversation is unavailable.'))
    return () => setActiveConversation(null)
  }, [conversationId])

  const refreshTrust = useCallback(() => {
    if (!conversation) return
    devicesOf(conversation.partner._id)
      .then((devices) => setTrust(!devices.length ? 'none' : devices.every((d) => d.verified || d.blocked) ? 'verified' : 'unverified'))
      .catch(() => setTrust('unknown'))
  }, [conversation])

  useEffect(() => {
    refreshTrust()
  }, [refreshTrust])

  // Keep the view pinned to the newest message, and keep position when older ones load
  useLayoutEffect(() => {
    const el = scroller.current
    if (!el) return
    if (thread.status === 'ready' && previousHeight.current && !stickToBottom.current) {
      el.scrollTop += el.scrollHeight - previousHeight.current
    } else if (stickToBottom.current) {
      el.scrollTop = el.scrollHeight
    }
    previousHeight.current = 0
  }, [thread.items.length, pending.length, thread.status])

  const onScroll = () => {
    const el = scroller.current
    stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX
    if (el.scrollTop < 80 && thread.hasMore && thread.status === 'ready') {
      previousHeight.current = el.scrollHeight
      loadMessages(conversationId, { older: true })
    }
  }

  if (loadError) return <EmptyState className="m-auto" title="Conversation not found" description={loadError} />
  if (!conversation) {
    return (
      <div className="m-auto text-ink-subtle">
        <Spinner label="Loading conversation" />
      </div>
    )
  }

  const { partner } = conversation
  const typing = typingUntil > Date.now()
  let lastDay = null

  return (
    <div
      className="relative flex min-h-0 flex-1 flex-col"
      onDragOver={(e) => {
        if ([...e.dataTransfer.types].includes('Files')) {
          e.preventDefault()
          setDragging(true)
        }
      }}
      onDragLeave={(e) => e.currentTarget === e.target && setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        setDropped([...e.dataTransfer.files])
      }}
    >
      <header className="flex items-center gap-3 border-b border-line px-3 py-2.5 sm:px-4">
        <Link to="/messages" className="rounded-full p-2 hover:bg-surface md:hidden" aria-label="Back to conversations">
          <IoArrowBack />
        </Link>
        <Link to={`/profile/${partner._id}`} className="flex min-w-0 flex-1 items-center gap-3 rounded-full">
          <Avatar src={partner.image} name={partner.fullname} size="md" />
          <span className="min-w-0">
            <span className="block truncate font-bold">{partner.fullname}</span>
            <span className="block text-xs text-ink-subtle" aria-live="polite">
              {typing ? <span className="font-semibold text-brand-600">typing…</span> : online ? 'Online' : online === false ? 'Offline' : 'End-to-end encrypted'}
            </span>
          </span>
        </Link>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setDevicesOpen(true)}
          aria-label={trust === 'verified' ? 'Verified. View encryption details' : 'Not verified. View encryption details and verify'}
        >
          {trust === 'verified' ? <IoShieldCheckmark className="text-success" aria-hidden="true" /> : <IoShieldOutline aria-hidden="true" />}
          <span className="hidden sm:inline">{trust === 'verified' ? 'Verified' : 'Verify'}</span>
        </Button>
      </header>

      {!connected && (
        <p className="flex items-center justify-center gap-2 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800" role="status">
          <IoCloudOfflineOutline aria-hidden="true" /> You&apos;re offline. Messages will be sent when you reconnect.
        </p>
      )}

      <div ref={scroller} onScroll={onScroll} className="min-h-0 flex-1 space-y-1.5 overflow-y-auto px-3 py-4 sm:px-5" aria-label="Messages" role="log">
        {thread.status === 'loading-older' && (
          <div className="flex justify-center py-2 text-ink-subtle">
            <Spinner className="size-5" label="Loading older messages" />
          </div>
        )}
        {!thread.hasMore && thread.status !== 'loading' && (
          <p className="mx-auto mb-4 flex max-w-sm items-start gap-2 rounded-2xl bg-surface px-4 py-3 text-xs leading-relaxed text-ink-muted">
            <IoLockClosed className="mt-0.5 shrink-0" aria-hidden="true" />
            Messages and media in this chat are end-to-end encrypted. The server only stores scrambled data it can&apos;t read.
          </p>
        )}
        {thread.status === 'loading' && (
          <div className="flex justify-center py-10 text-ink-subtle">
            <Spinner label="Loading messages" />
          </div>
        )}
        {thread.status === 'error' && !thread.items.length && (
          <EmptyState title="Couldn't load messages" description={thread.error} action={<Button variant="secondary" onClick={() => loadMessages(conversationId)}>Try again</Button>} />
        )}

        {thread.items.map((message) => {
          const day = new Date(message.origin_server_ts).toDateString()
          const divider = day !== lastDay
          lastDay = day
          const mine = message.senderId === userId
          return (
            <Fragment key={message._id}>
              {divider && (
                <p className="py-3 text-center text-xs font-semibold text-ink-subtle">
                  <span className="rounded-full bg-surface px-3 py-1">{formatDayDivider(message.origin_server_ts)}</span>
                </p>
              )}
              <MessageBubble
                message={message}
                decrypted={decrypted[message._id]}
                mine={mine}
                status={mine ? deliveryStatus(message, conversation) : undefined}
                onDelete={mine ? () => setToDelete(message._id) : undefined}
              />
            </Fragment>
          )
        })}

        {pending.map((item) => (
          <MessageBubble
            key={item.clientMessageId}
            message={{ _id: item.clientMessageId, createdAt: item.createdAt, content: item.content }}
            decrypted={{ status: 'ok', content: item.content }}
            mine
            status={item.status}
            progress={item.status === 'uploading' ? item.progress : undefined}
            localUrl={item.previewUrl}
            failedReason={item.error}
            onRetry={() => retryMessage(conversationId, item.clientMessageId)}
            onDiscard={() => discardMessage(conversationId, item.clientMessageId)}
          />
        ))}
      </div>

      {trust === 'unverified' && (
        <button
          type="button"
          onClick={() => setDevicesOpen(true)}
          className="mx-3 mb-1 flex items-center justify-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-ink-muted hover:bg-surface cursor-pointer"
        >
          <IoShieldOutline aria-hidden="true" /> {partner.fullname} has devices you haven&apos;t verified. Tap to compare fingerprints.
        </button>
      )}

      <Composer conversationId={conversationId} droppedFiles={dropped} onDroppedHandled={() => setDropped(null)} />

      {dragging && (
        <div className="pointer-events-none absolute inset-2 flex items-center justify-center rounded-3xl border-2 border-dashed border-brand-600 bg-brand-50/90 text-sm font-bold text-brand-700">
          Drop photos or videos to send them encrypted
        </div>
      )}

      <DevicesDialog open={devicesOpen} onClose={() => setDevicesOpen(false)} partner={partner} onChanged={refreshTrust} />
      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        title="Delete this message for everyone?"
        description="The encrypted message is removed from the server. People may have already seen it."
        confirmLabel="Delete"
        onConfirm={() => {
          deleteMessage(conversationId, toDelete)
          setToDelete(null)
        }}
      />
    </div>
  )
}
