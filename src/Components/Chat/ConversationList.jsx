import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiEdit } from 'react-icons/fi'
import { IoLockClosed, IoSearch } from 'react-icons/io5'
import { api, errorMessage } from '../../lib/api'
import { useDebouncedValue } from '../../lib/hooks'
import { toast } from '../../lib/toast'
import { openConversationWith, useChat } from '../../chat/chatStore'
import Avatar from '../UI/Avatar'
import { IconButton } from '../UI/Button'
import Dialog from '../UI/Dialog'
import Spinner from '../UI/Spinner'
import { formatListTime, previewText } from './format'

export function PresenceDot({ online, className = '' }) {
  if (!online) return null
  return <span className={`block size-3 rounded-full border-2 border-white bg-emerald-500 ${className}`} aria-label="Online" />
}

function NewChatDialog({ open, onClose }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [opening, setOpening] = useState(null)
  const debounced = useDebouncedValue(query.trim(), 250)

  useEffect(() => {
    if (!debounced) return setResults([])
    const controller = new AbortController()
    setLoading(true)
    api
      .get('/searchterms', { params: { searchValue: debounced, select: 'User' }, signal: controller.signal })
      .then(({ data }) => setResults(data.results))
      .catch(() => {})
      .finally(() => !controller.signal.aborted && setLoading(false))
    return () => controller.abort()
  }, [debounced])

  const start = async (person) => {
    setOpening(person._id)
    try {
      const conversation = await openConversationWith(person._id)
      onClose()
      navigate(`/messages/${conversation._id}`)
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setOpening(null)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="New message" description="Find someone to start an encrypted conversation with.">
      <label className="sr-only" htmlFor="new-chat-search">
        Search people
      </label>
      <input
        id="new-chat-search"
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name"
        className="h-12 w-full rounded-2xl border border-line px-4 text-sm focus:border-ink focus:ring-2 focus:ring-ink/10 focus:outline-none"
      />
      <ul className="mt-3 max-h-80 overflow-y-auto" aria-live="polite">
        {loading && (
          <li className="flex justify-center py-6 text-ink-subtle">
            <Spinner />
          </li>
        )}
        {!loading && debounced && results.length === 0 && <li className="py-6 text-center text-sm text-ink-muted">No one matches “{debounced}”</li>}
        {results.map((person) => (
          <li key={person._id}>
            <button
              type="button"
              onClick={() => start(person)}
              disabled={opening === person._id}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left hover:bg-surface cursor-pointer disabled:opacity-60"
            >
              <Avatar name={person.fullname} size="md" />
              <span className="flex-1 truncate text-sm font-semibold">{person.fullname}</span>
              {opening === person._id && <Spinner className="size-4" />}
            </button>
          </li>
        ))}
      </ul>
    </Dialog>
  )
}

export default function ConversationList({ activeId }) {
  const conversations = useChat((s) => s.conversations)
  const status = useChat((s) => s.conversationsStatus)
  const decrypted = useChat((s) => s.decrypted)
  const presence = useChat((s) => s.presence)
  const typing = useChat((s) => s.typing)
  const userId = useChat((s) => s.user?._id)
  const [filter, setFilter] = useState('')
  const [newChat, setNewChat] = useState(false)

  const visible = useMemo(
    () => conversations.filter((c) => c.partner.fullname.toLowerCase().includes(filter.trim().toLowerCase())),
    [conversations, filter],
  )

  const preview = (conversation) => {
    if (typing[conversation._id] > Date.now()) return <span className="font-semibold text-brand-600">typing…</span>
    const last = conversation.lastMessage
    if (!last) return <span className="italic">No messages yet</span>
    if (last.deleted) return <span className="italic">Message deleted</span>
    const d = decrypted[last._id]
    const mine = last.senderId === userId ? 'You: ' : ''
    if (d?.status === 'ok') return `${mine}${previewText(d.content)}`
    return (
      <span className="inline-flex items-center gap-1">
        <IoLockClosed className="text-xs" aria-hidden="true" /> {mine}Encrypted message
      </span>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between gap-2 px-4 pt-4 pb-3">
        <h1 className="text-xl font-extrabold tracking-tight">Messages</h1>
        <IconButton label="New message" onClick={() => setNewChat(true)} variant="secondary">
          <FiEdit />
        </IconButton>
      </div>
      <div className="px-4 pb-3">
        <div className="flex h-10 items-center gap-2 rounded-full bg-surface px-3">
          <IoSearch className="text-ink-subtle" aria-hidden="true" />
          <label htmlFor="conversation-filter" className="sr-only">
            Search conversations
          </label>
          <input
            id="conversation-filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search conversations"
            className="h-full min-w-0 flex-1 bg-transparent text-sm focus:outline-none"
          />
        </div>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-2 pb-3" aria-label="Conversation list">
        {status === 'loading' && !conversations.length && (
          <ul aria-busy="true" aria-label="Loading conversations">
            {Array.from({ length: 6 }, (_, i) => (
              <li key={i} className="flex items-center gap-3 px-2 py-3">
                <div className="skeleton size-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-3.5 w-1/2 rounded-full" />
                  <div className="skeleton h-3 w-3/4 rounded-full" />
                </div>
              </li>
            ))}
          </ul>
        )}
        {status === 'error' && <p className="px-4 py-6 text-center text-sm text-ink-muted">Couldn&apos;t load conversations. Check your connection.</p>}
        {status === 'ready' && conversations.length === 0 && (
          <div className="px-4 py-10 text-center">
            <p className="text-sm font-semibold">No conversations yet</p>
            <p className="mt-1 text-sm text-ink-muted">Start one from someone&apos;s profile or with the new message button.</p>
          </div>
        )}
        {status === 'ready' && conversations.length > 0 && visible.length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-ink-muted">No conversations match “{filter}”</p>
        )}
        <ul>
          {visible.map((conversation) => {
            const active = conversation._id === activeId
            return (
              <li key={conversation._id}>
                <Link
                  to={`/messages/${conversation._id}`}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center gap-3 rounded-2xl px-2 py-2.5 transition-colors ${active ? 'bg-surface' : 'hover:bg-surface'}`}
                >
                  <span className="relative">
                    <Avatar src={conversation.partner.image} name={conversation.partner.fullname} size="lg" className="!size-12" />
                    <PresenceDot online={presence[conversation.partner._id]} className="absolute right-0 bottom-0" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className={`truncate text-[15px] ${conversation.unread ? 'font-extrabold' : 'font-semibold'}`}>{conversation.partner.fullname}</span>
                      <span className="shrink-0 text-xs text-ink-subtle">{formatListTime(conversation.lastMessageAt)}</span>
                    </span>
                    <span className="mt-0.5 flex items-center justify-between gap-2">
                      <span className={`truncate text-sm ${conversation.unread ? 'font-semibold text-ink' : 'text-ink-muted'}`}>{preview(conversation)}</span>
                      {conversation.unread > 0 && (
                        <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-brand-600 px-1.5 text-[11px] font-bold text-white">
                          <span className="sr-only">Unread messages: </span>
                          {conversation.unread > 99 ? '99+' : conversation.unread}
                        </span>
                      )}
                    </span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
      <NewChatDialog open={newChat} onClose={() => setNewChat(false)} />
    </>
  )
}
