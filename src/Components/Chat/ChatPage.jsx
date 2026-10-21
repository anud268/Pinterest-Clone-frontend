import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { IoChatbubblesOutline, IoLockClosedOutline } from 'react-icons/io5'
import { ensureCrypto, loadConversations, useChat } from '../../chat/chatStore'
import { useDocumentTitle } from '../../lib/hooks'
import Button from '../UI/Button'
import EmptyState from '../UI/EmptyState'
import Spinner from '../UI/Spinner'
import ConversationList from './ConversationList'
import ConversationView from './ConversationView'

// Two-pane messenger on larger screens; list or conversation on phones.
export default function ChatPage() {
  const { conversationId } = useParams()
  const cryptoStatus = useChat((s) => s.crypto)
  const cryptoError = useChat((s) => s.cryptoError)
  useDocumentTitle('Messages')

  useEffect(() => {
    ensureCrypto().catch(() => {})
    loadConversations()
  }, [])

  return (
    <div className="flex h-[calc(100dvh-8rem)] overflow-hidden border-t border-line bg-white md:h-[calc(100dvh-5.25rem)] md:rounded-3xl md:border">
      <aside
        className={`w-full shrink-0 flex-col border-line md:flex md:w-80 md:border-r lg:w-96 ${conversationId ? 'hidden' : 'flex'}`}
        aria-label="Conversations"
      >
        <ConversationList activeId={conversationId} />
      </aside>
      <section className={`min-w-0 flex-1 flex-col ${conversationId ? 'flex' : 'hidden md:flex'}`}>
        {cryptoStatus === 'error' ? (
          <EmptyState
            className="m-auto"
            icon={<IoLockClosedOutline />}
            title="Encrypted chat couldn't start"
            description={cryptoError}
            action={<Button onClick={() => ensureCrypto().catch(() => {})}>Try again</Button>}
          />
        ) : cryptoStatus !== 'ready' ? (
          <div className="m-auto flex flex-col items-center gap-3 text-center text-sm text-ink-muted">
            <Spinner className="size-7" />
            <span>Setting up end-to-end encryption on this device…</span>
          </div>
        ) : conversationId ? (
          <ConversationView key={conversationId} conversationId={conversationId} />
        ) : (
          <EmptyState
            className="m-auto"
            icon={<IoChatbubblesOutline />}
            title="Your messages"
            description="Pick a conversation or start a new one. Messages are end-to-end encrypted: only you and the person you're talking to can read them."
          />
        )}
      </section>
    </div>
  )
}
