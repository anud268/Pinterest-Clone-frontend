import { memo } from 'react'
import { HiDotsVertical } from 'react-icons/hi'
import { IoAlertCircle, IoCheckmark, IoCheckmarkDone, IoLockClosed, IoTimeOutline, IoWarning } from 'react-icons/io5'
import { FiCopy, FiTrash2 } from 'react-icons/fi'
import { toast } from '../../lib/toast'
import Menu from '../UI/Menu'
import EncryptedMedia from './EncryptedMedia'
import { formatTime } from './format'

const STATUS = {
  encrypting: { icon: IoTimeOutline, label: 'Encrypting' },
  preparing: { icon: IoTimeOutline, label: 'Preparing' },
  uploading: { icon: IoTimeOutline, label: 'Uploading' },
  sending: { icon: IoTimeOutline, label: 'Sending' },
  queued: { icon: IoTimeOutline, label: 'Waiting for connection' },
  sent: { icon: IoCheckmark, label: 'Sent' },
  delivered: { icon: IoCheckmarkDone, label: 'Delivered' },
  read: { icon: IoCheckmarkDone, label: 'Read' },
}

function StatusIcon({ status }) {
  const entry = STATUS[status]
  if (!entry) return null
  const Icon = entry.icon
  return (
    <span title={entry.label} className={status === 'read' ? 'text-sky-300' : ''}>
      <Icon aria-hidden="true" />
      <span className="sr-only">{entry.label}</span>
    </span>
  )
}

/**
 * mine: sent by the current user. status: delivery state for own messages.
 * decrypted: { status, content, verified, tampered } for stored messages.
 */
function MessageBubble({ message, decrypted, mine, status, progress, localUrl, onDelete, onRetry, onDiscard, failedReason }) {
  const time = formatTime(message.origin_server_ts ?? message.createdAt)
  const content = decrypted?.status === 'ok' ? decrypted.content : message.content?.msgtype ? message.content : null
  const isMedia = content && content.msgtype !== 'm.text'

  let body
  if (message.deleted) {
    body = <span className="italic opacity-75">This message was deleted</span>
  } else if (content) {
    body = (
      <>
        {isMedia && <EncryptedMedia content={content} localUrl={localUrl} />}
        {content.msgtype === 'm.text' && <p className="text-[15px] leading-snug whitespace-pre-wrap break-words">{content.body}</p>}
        {progress !== undefined && progress < 1 && (
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-current/20" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Upload progress">
            <div className="h-full bg-current transition-[width]" style={{ width: `${progress * 100}%` }} />
          </div>
        )}
      </>
    )
  } else if (decrypted?.status === 'missing_key' || decrypted?.status === 'failed') {
    body = (
      <span className="flex items-start gap-2 text-sm italic opacity-80">
        <IoLockClosed className="mt-0.5 shrink-0" aria-hidden="true" />
        {decrypted.status === 'missing_key' ? 'Waiting for the key to decrypt this message. Messages sent before this device was set up can’t be read here.' : 'This message could not be decrypted.'}
      </span>
    )
  } else {
    body = (
      <span className="flex items-center gap-2 text-sm opacity-75">
        <IoLockClosed aria-hidden="true" /> Decrypting…
      </span>
    )
  }

  const menuItems = [
    { label: 'Copy text', icon: <FiCopy />, hidden: content?.msgtype !== 'm.text', onSelect: () => navigator.clipboard.writeText(content.body).then(() => toast.success('Copied')) },
    { label: 'Delete for everyone', icon: <FiTrash2 />, danger: true, hidden: !mine || !onDelete || message.deleted, onSelect: onDelete },
  ]
  const hasMenu = menuItems.some((i) => !i.hidden)

  return (
    <div className={`group flex items-end gap-1 ${mine ? 'flex-row-reverse' : ''}`}>
      <div
        className={`max-w-[85%] rounded-3xl px-3.5 py-2 sm:max-w-[70%] ${
          mine ? 'rounded-br-lg bg-ink text-white' : 'rounded-bl-lg bg-surface text-ink'
        } ${isMedia ? 'p-1.5' : ''}`}
      >
        {decrypted?.tampered && (
          <p className="mb-1 flex items-center gap-1 text-xs font-bold text-amber-500">
            <IoWarning aria-hidden="true" /> The authenticity of this message can’t be guaranteed
          </p>
        )}
        {body}
        <div className={`mt-1 flex items-center justify-end gap-1 text-[11px] ${mine ? 'text-white/70' : 'text-ink-subtle'} ${isMedia ? 'px-1.5 pb-0.5' : ''}`}>
          <time dateTime={new Date(message.origin_server_ts ?? message.createdAt).toISOString()}>{time}</time>
          {mine && <StatusIcon status={status} />}
        </div>
      </div>
      {status === 'queued' && onDiscard && (
        <button type="button" onClick={onDiscard} className="text-xs text-ink-subtle underline cursor-pointer">
          Cancel
        </button>
      )}
      {status === 'failed' && (
        <div className="flex items-center gap-1 text-xs text-danger">
          <IoAlertCircle aria-hidden="true" />
          <span className="sr-only">Failed to send{failedReason ? `: ${failedReason}` : ''}</span>
          <button type="button" onClick={onRetry} className="font-bold underline cursor-pointer" title={failedReason}>
            Retry
          </button>
          <button type="button" onClick={onDiscard} className="text-ink-subtle underline cursor-pointer">
            Discard
          </button>
        </div>
      )}
      {hasMenu && (
        <Menu
          align={mine ? 'right' : 'left'}
          placement="top"
          className="opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100 pointer-coarse:opacity-100"
          items={menuItems}
          trigger={(props) => (
            <button type="button" aria-label="Message options" className="rounded-full p-1.5 text-ink-subtle hover:bg-surface hover:text-ink cursor-pointer" {...props}>
              <HiDotsVertical />
            </button>
          )}
        />
      )}
    </div>
  )
}

export default memo(MessageBubble)
