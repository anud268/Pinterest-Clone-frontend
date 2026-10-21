import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { FaRegBookmark } from 'react-icons/fa'
import { api } from '../../lib/api'
import { useDocumentTitle } from '../../lib/hooks'
import { selectUser } from '../Redex/Slice/UserSlice'
import PinGrid from '../Pin/PinGrid'
import usePostList from '../Pin/usePostList'
import EmptyState from '../UI/EmptyState'
import { buttonClass } from '../UI/buttonClass'

function SavedPins() {
  const user = useSelector(selectUser)
  const list = usePostList(
    (page, signal) => api.get(`/saved/${user._id}`, { signal }).then((r) => ({ posts: r.data.posts, hasMore: false })),
    user._id,
    { paginated: false },
  )

  return (
    <PinGrid
      {...list}
      empty={
        <EmptyState
          icon={<FaRegBookmark />}
          title="Nothing saved yet"
          description="Tap Save on any pin you love and it will be waiting for you here."
          action={<Link to="/home" className={buttonClass()}>Find ideas</Link>}
        />
      }
    />
  )
}

// Saved pins: a page at /saved, or embedded in the profile's "Saved" tab.
export default function Saved({ embedded = false }) {
  if (embedded) return <SavedPins />
  return <SavedPage />
}

function SavedPage() {
  useDocumentTitle('Saved')
  return (
    <div className="pt-2">
      <header className="mb-6 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight">Saved pins</h1>
        <p className="mt-1 text-sm text-ink-muted">Only you can see what you&apos;ve saved.</p>
      </header>
      <SavedPins />
    </div>
  )
}
