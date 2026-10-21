import { useEffect, useRef, useState } from 'react'
import { IoAttach, IoClose, IoHappyOutline, IoMicOutline, IoSend } from 'react-icons/io5'
import { MAX_ATTACHMENT_BYTES, sendAttachment, sendText, sendTyping } from '../../chat/chatStore'
import { toast } from '../../lib/toast'
import { useDismiss } from '../../lib/hooks'
import { IconButton } from '../UI/Button'
import VoiceRecorder from './VoiceRecorder'
import { formatBytes } from './format'

const EMOJIS = '😀 😂 🥹 😊 😍 🥰 😘 😎 🤩 🤔 🙃 😅 😭 😡 🥳 😴 🤗 🙄 😬 😇 👍 👎 👏 🙌 🙏 💪 👋 🤝 ✌️ 👌 ❤️ 🧡 💛 💚 💙 💜 🖤 💔 ✨ 🔥 🎉 🎂 🌸 🌈 ☀️ 🌙 ⭐ 🍕 ☕ 🍷 📌 📷 🎵 ✅ ❌ 💯 👀 💡'.split(' ')
const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime'

function EmojiPicker({ onPick }) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef(null)
  const panelRef = useRef(null)
  useDismiss(open, () => setOpen(false), [triggerRef, panelRef])

  return (
    <div className="relative">
      <IconButton ref={triggerRef} label="Insert emoji" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <IoHappyOutline />
      </IconButton>
      {open && (
        <div ref={panelRef} role="dialog" aria-label="Emoji picker" className="absolute bottom-full left-0 z-30 mb-2 grid w-72 animate-pop-in grid-cols-8 gap-1 rounded-2xl border border-line bg-white p-2 shadow-pop">
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => onPick(emoji)}
              aria-label={`Insert ${emoji}`}
              className="flex size-8 items-center justify-center rounded-lg text-xl hover:bg-surface cursor-pointer"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Composer({ conversationId, disabled, droppedFiles, onDroppedHandled }) {
  const [text, setText] = useState('')
  const [files, setFiles] = useState([])
  const [recording, setRecording] = useState(false)
  const textRef = useRef(null)
  const fileRef = useRef(null)

  const addFiles = (list) => {
    const accepted = []
    for (const file of list) {
      if (!/^(image|video)\//.test(file.type)) toast.error(`${file.name}: only photos and videos can be attached`)
      else if (file.size > MAX_ATTACHMENT_BYTES) toast.error(`${file.name} is larger than 25MB`)
      else accepted.push({ file, url: URL.createObjectURL(file), id: `${file.name}-${file.size}-${Math.random()}` })
    }
    setFiles((f) => [...f, ...accepted].slice(0, 10))
  }

  useEffect(() => {
    if (droppedFiles?.length) {
      addFiles(droppedFiles)
      onDroppedHandled()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [droppedFiles])

  // Auto-grow the textarea up to a few lines
  useEffect(() => {
    const el = textRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [text])

  const removeFile = (id) =>
    setFiles((list) => {
      const item = list.find((f) => f.id === id)
      if (item) URL.revokeObjectURL(item.url)
      return list.filter((f) => f.id !== id)
    })

  const submit = () => {
    const body = text.trim()
    if (!body && !files.length) return
    files.forEach(({ file, url }) => {
      sendAttachment(conversationId, file)
      URL.revokeObjectURL(url)
    })
    if (body) sendText(conversationId, body)
    setText('')
    setFiles([])
    sendTyping(conversationId, false)
    textRef.current?.focus()
  }

  if (recording) {
    return (
      <div className="border-t border-line p-3">
        <VoiceRecorder
          onCancel={() => setRecording(false)}
          onSend={(file, durationMs) => {
            sendAttachment(conversationId, file, { durationMs })
            setRecording(false)
          }}
        />
      </div>
    )
  }

  return (
    <div className="border-t border-line p-3">
      {files.length > 0 && (
        <ul className="no-scrollbar mb-2 flex gap-2 overflow-x-auto" aria-label="Attachments to send">
          {files.map(({ file, url, id }) => (
            <li key={id} className="relative shrink-0">
              {file.type.startsWith('video') ? (
                <video src={url} className="size-20 rounded-xl bg-black object-cover" muted aria-label={file.name} />
              ) : (
                <img src={url} alt={file.name} className="size-20 rounded-xl object-cover" />
              )}
              <span className="absolute inset-x-1 bottom-1 truncate rounded bg-black/60 px-1 text-[10px] text-white">{formatBytes(file.size)}</span>
              <button
                type="button"
                onClick={() => removeFile(id)}
                aria-label={`Remove ${file.name}`}
                className="absolute -top-1.5 -right-1.5 flex size-6 items-center justify-center rounded-full bg-ink text-white shadow-card cursor-pointer"
              >
                <IoClose className="text-sm" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
        className="flex items-end gap-1"
      >
        <EmojiPicker
          onPick={(emoji) => {
            setText((t) => t + emoji)
            textRef.current?.focus()
          }}
        />
        <IconButton label="Attach photos or videos" onClick={() => fileRef.current?.click()} disabled={disabled}>
          <IoAttach />
        </IconButton>
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => {
            addFiles([...e.target.files])
            e.target.value = ''
          }}
        />
        <label htmlFor="chat-message" className="sr-only">
          Message
        </label>
        <textarea
          id="chat-message"
          ref={textRef}
          rows={1}
          value={text}
          disabled={disabled}
          maxLength={8000}
          onChange={(e) => {
            setText(e.target.value)
            sendTyping(conversationId, e.target.value.length > 0)
          }}
          onBlur={() => sendTyping(conversationId, false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault()
              submit()
            }
          }}
          placeholder={disabled ? 'You can’t send messages in this conversation' : 'Write an encrypted message'}
          className="max-h-40 min-h-10 min-w-0 flex-1 resize-none rounded-3xl bg-surface px-4 py-2.5 text-[15px] leading-snug placeholder:text-ink-subtle focus:bg-white focus:ring-2 focus:ring-ink/15 focus:outline-none disabled:opacity-60"
        />
        {text.trim() || files.length ? (
          <IconButton label="Send message" type="submit" variant="primary" disabled={disabled}>
            <IoSend />
          </IconButton>
        ) : (
          <IconButton label="Record a voice message" onClick={() => setRecording(true)} disabled={disabled}>
            <IoMicOutline />
          </IconButton>
        )}
      </form>
    </div>
  )
}
