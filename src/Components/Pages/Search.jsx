import { Link, useSearchParams } from 'react-router-dom'
import { IoSearch } from 'react-icons/io5'
import { api } from '../../lib/api'
import { useDocumentTitle } from '../../lib/hooks'
import PinGrid from '../Pin/PinGrid'
import usePostList from '../Pin/usePostList'
import EmptyState from '../UI/EmptyState'
import { buttonClass } from '../UI/buttonClass'
import { SEARCH_TYPES } from '../../lib/constants'

const POST_TYPES = SEARCH_TYPES.filter((t) => t !== 'User')

export default function Search() {
  const [params, setParams] = useSearchParams()
  const q = (params.get('q') ?? '').trim()
  const type = POST_TYPES.includes(params.get('type')) ? params.get('type') : 'Title'
  useDocumentTitle(q ? `“${q}”` : 'Search')

  const list = usePostList(
    (page, signal) => api.post('/finalsearch', { searchValue: q, select: type, page, limit: 30 }, { signal }).then((r) => r.data),
    `${type}:${q}`,
    { enabled: Boolean(q) },
  )

  if (!q) {
    return (
      <EmptyState
        icon={<IoSearch />}
        title="Search for ideas"
        description="Use the search bar to find pins by title, tag or location, or to find people."
      />
    )
  }

  return (
    <div className="pt-2">
      <header className="mb-6 flex flex-col items-center gap-4 text-center">
        <div>
          <p className="text-sm font-semibold text-ink-muted">Results for</p>
          <h1 className="text-2xl font-extrabold tracking-tight break-words sm:text-3xl">{q}</h1>
        </div>
        <div role="group" aria-label="Search in" className="flex flex-wrap justify-center gap-2">
          {POST_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={t === type}
              onClick={() => setParams({ q, type: t })}
              className={`h-9 rounded-full px-4 text-sm font-semibold transition-colors cursor-pointer ${
                t === type ? 'bg-ink text-white' : 'bg-surface text-ink hover:bg-surface-strong'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </header>
      <PinGrid
        {...list}
        empty={
          <EmptyState
            icon={<IoSearch />}
            title={`No pins found for “${q}”`}
            description={`Try a different word, or search by ${POST_TYPES.filter((t) => t !== type).join(' or ').toLowerCase()} instead.`}
            action={
              <Link to="/explore" className={buttonClass({ variant: 'secondary' })}>
                Browse Explore
              </Link>
            }
          />
        }
      />
    </div>
  )
}
