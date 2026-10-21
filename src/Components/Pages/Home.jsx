import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useParams } from 'react-router-dom'
import { IoArrowBack, IoSparklesOutline } from 'react-icons/io5'
import { api, errorMessage } from '../../lib/api'
import { useDocumentTitle } from '../../lib/hooks'
import { feedLoaded, feedScrolled } from '../Redex/Slice/PostSlice'
import PinGrid from '../Pin/PinGrid'
import usePostList from '../Pin/usePostList'
import EmptyState from '../UI/EmptyState'
import { buttonClass } from '../UI/buttonClass'

const PAGE_SIZE = 30
const FEED_KEY = 'home'

// Category shortcuts from the admin-curated Explore cards
function CategoryChips({ active }) {
  const [cards, setCards] = useState([])

  useEffect(() => {
    const controller = new AbortController()
    api
      .get('/fetchcards', { signal: controller.signal })
      .then(({ data }) => setCards(data.cards))
      .catch(() => {})
    return () => controller.abort()
  }, [])

  if (!cards.length) return null
  const chip = (isActive) =>
    `inline-flex h-10 shrink-0 items-center rounded-full px-4 text-sm font-semibold transition-colors ${
      isActive ? 'bg-ink text-white' : 'bg-surface text-ink hover:bg-surface-strong'
    }`

  return (
    <nav aria-label="Categories" className="no-scrollbar -mx-3 mb-4 flex gap-2 overflow-x-auto px-3 sm:-mx-5 sm:px-5 lg:-mx-8 lg:px-8">
      <Link to="/home" className={chip(!active)} aria-current={!active ? 'page' : undefined}>
        All
      </Link>
      {cards.map((card) => (
        <Link
          key={card._id}
          to={`/explore/${encodeURIComponent(card.title)}`}
          className={chip(active === card.title)}
          aria-current={active === card.title ? 'page' : undefined}
        >
          {card.title}
        </Link>
      ))}
    </nav>
  )
}

function HomeFeed() {
  const dispatch = useDispatch()
  const feed = useSelector((state) => state.post)
  const cached = feed.key === FEED_KEY && feed.items.length > 0
  const [status, setStatus] = useState(cached ? 'ready' : 'loading')
  const [error, setError] = useState(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const restored = useRef(false)

  const load = useCallback(
    async (page) => {
      if (page === 1) setStatus('loading')
      else setLoadingMore(true)
      setError(null)
      try {
        const { data } = await api.get('/posts', { params: { page, limit: PAGE_SIZE } })
        dispatch(feedLoaded({ key: FEED_KEY, posts: data.posts, page, hasMore: data.hasMore }))
        setStatus('ready')
      } catch (err) {
        setError(errorMessage(err))
        if (page === 1) setStatus('error')
      } finally {
        setLoadingMore(false)
      }
    },
    [dispatch],
  )

  useEffect(() => {
    if (!cached) load(1)
    // only on mount: the cached feed is reused when coming back from a pin
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Restore the scroll position of a cached feed, and remember it when leaving.
  // A layout effect so the position is read before the next page replaces this one.
  useLayoutEffect(() => {
    let frame
    if (cached && !restored.current) {
      // Wait for the masonry columns to measure and render before scrolling
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(() => window.scrollTo(0, feed.scrollY))
      })
    }
    restored.current = true
    return () => {
      cancelAnimationFrame(frame)
      dispatch(feedScrolled(window.scrollY))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <PinGrid
      posts={feed.key === FEED_KEY ? feed.items : []}
      status={status}
      error={error}
      hasMore={feed.hasMore}
      loadingMore={loadingMore}
      loadMore={() => load(feed.page + 1)}
      reload={() => load(1)}
      empty={
        <EmptyState
          icon={<IoSparklesOutline />}
          title="Your feed is empty"
          description="Be the first to share an idea, or explore what's trending."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Link to="/create" className={buttonClass()}>
                Create a pin
              </Link>
              <Link to="/explore" className={buttonClass({ variant: 'secondary' })}>
                Explore
              </Link>
            </div>
          }
        />
      }
    />
  )
}

function CategoryFeed({ category }) {
  const list = usePostList(
    (page, signal) => api.post('/fetchtagsfromcard', { cat: category, page, limit: PAGE_SIZE }, { signal }).then((r) => r.data),
    category,
  )

  return (
    <>
      <div className="mb-6 flex items-center gap-3">
        <Link to="/explore" className={buttonClass({ variant: 'secondary', size: 'sm' })}>
          <IoArrowBack aria-hidden="true" /> Explore
        </Link>
      </div>
      <header className="mb-6 text-center">
        <p className="text-sm font-semibold text-ink-muted">Category</p>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{category}</h1>
      </header>
      <PinGrid
        {...list}
        empty={
          <EmptyState
            title={`No pins in ${category} yet`}
            description="Pins tagged with this category's tags will show up here."
            action={
              <Link to="/home" className={buttonClass({ variant: 'secondary' })}>
                Back to home
              </Link>
            }
          />
        }
      />
    </>
  )
}

export default function Home() {
  const { tag } = useParams()
  useDocumentTitle(tag ? tag : 'Home')

  return (
    <div className="pt-2">
      <CategoryChips active={tag} />
      {tag ? <CategoryFeed key={tag} category={tag} /> : <HomeFeed />}
    </div>
  )
}
