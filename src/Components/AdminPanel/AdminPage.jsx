import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { IoAlertCircleOutline, IoImageOutline, IoImagesOutline } from 'react-icons/io5'
import { api, errorMessage } from '../../lib/api'
import { useDocumentTitle } from '../../lib/hooks'
import { aspectRatio, imageSrcSet, imageUrl } from '../../lib/image'
import MasonryGrid, { MasonrySkeleton } from '../Pin/MasonryGrid'
import Avatar from '../UI/Avatar'
import Button from '../UI/Button'
import EmptyState from '../UI/EmptyState'
import { AdminHeader, StatChip } from './AdminLayout'

const FILTERS = [
  { key: 'all', label: 'All', test: () => true },
  { key: 'archived', label: 'Archived', test: (p) => p.archive },
  { key: 'struck', label: 'Struck', test: (p) => p.adminStrike },
  { key: 'blocked', label: 'Blocked authors', test: (p) => p.userId?.adminblock },
]

function AdminPostCard({ post }) {
  const [failed, setFailed] = useState(false)
  const ratio = aspectRatio(post)
  const author = post.userId

  return (
    <article>
      <Link
        to={`/admin/post?id=${post._id}`}
        className="group relative block overflow-hidden rounded-2xl bg-surface"
        style={ratio ? { aspectRatio: `1 / ${ratio}` } : undefined}
        aria-label={`Review ${post.postTitle || 'post'}`}
      >
        {failed || !post.postImage ? (
          <div className="flex aspect-[4/5] w-full flex-col items-center justify-center gap-2 text-ink-subtle">
            <IoImageOutline className="text-3xl" aria-hidden="true" />
            <span className="text-xs font-semibold">Image unavailable</span>
          </div>
        ) : (
          <img
            src={imageUrl(post.postImage, 474)}
            srcSet={imageSrcSet(post.postImage)}
            sizes="(max-width: 640px) 50vw, 252px"
            alt={post.postTitle || ''}
            loading="lazy"
            decoding="async"
            onError={() => setFailed(true)}
            className={`block w-full object-cover transition duration-200 group-hover:brightness-90 ${ratio ? 'h-full' : ''} ${
              post.archive ? 'grayscale' : ''
            }`}
          />
        )}
        <span className="absolute top-2 left-2 flex flex-wrap gap-1">
          {post.archive && <span className="rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-bold text-ink shadow-card">Archived</span>}
          {post.adminStrike && <span className="rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-bold text-amber-700 shadow-card">Struck</span>}
          {author?.adminblock && <span className="rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-bold text-danger shadow-card">Blocked user</span>}
        </span>
      </Link>
      <div className="px-1 pt-2">
        {post.postTitle && <p className="line-clamp-2 text-sm leading-snug font-semibold">{post.postTitle}</p>}
        {author && (
          <p className="mt-1.5 flex items-center gap-2 text-xs text-ink-muted">
            <Avatar src={author.image} name={author.fullname} size="xs" />
            <span className="truncate">{author.fullname}</span>
          </p>
        )}
      </div>
    </article>
  )
}

export default function AdminPage() {
  useDocumentTitle('Admin · Posts')
  const [posts, setPosts] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')

  const load = useCallback(async (signal) => {
    setStatus('loading')
    try {
      const { data } = await api.get('/allposts', { signal })
      setPosts(data.posts)
      setStatus('ready')
    } catch (err) {
      if (signal?.aborted) return
      setError(errorMessage(err))
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal)
    return () => controller.abort()
  }, [load])

  const counts = useMemo(
    () => Object.fromEntries(FILTERS.map((f) => [f.key, posts.filter(f.test).length])),
    [posts],
  )
  const visible = useMemo(() => posts.filter(FILTERS.find((f) => f.key === filter).test), [posts, filter])
  const renderItem = useCallback((post) => <AdminPostCard key={post._id} post={post} />, [])

  return (
    <>
      <AdminHeader title="Posts" description="Review every pin, including archived and struck ones.">
        {status === 'ready' && (
          <div className="flex flex-wrap gap-2">
            <StatChip label="total" value={counts.all} />
            <StatChip label="archived" value={counts.archived} />
            <StatChip label="struck" value={counts.struck} tone="warning" />
            <StatChip label="from blocked users" value={counts.blocked} tone="danger" />
          </div>
        )}
      </AdminHeader>

      <div className="no-scrollbar mb-6 overflow-x-auto" role="group" aria-label="Filter posts">
        <div className="flex w-max gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              aria-pressed={filter === f.key}
              onClick={() => setFilter(f.key)}
              className={`h-9 rounded-full px-4 text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                filter === f.key ? 'bg-ink text-white' : 'bg-surface text-ink hover:bg-surface-strong'
              }`}
            >
              {f.label}
              {status === 'ready' && <span className="ml-1.5 opacity-70">{counts[f.key]}</span>}
            </button>
          ))}
        </div>
      </div>

      {status === 'loading' && <MasonrySkeleton />}
      {status === 'error' && (
        <EmptyState
          icon={<IoAlertCircleOutline />}
          title="We couldn't load posts"
          description={error}
          action={<Button variant="secondary" onClick={() => load()}>Try again</Button>}
        />
      )}
      {status === 'ready' &&
        (visible.length ? (
          <MasonryGrid items={visible} renderItem={renderItem} />
        ) : (
          <EmptyState icon={<IoImagesOutline />} title="No posts here" description="Nothing matches this filter right now." />
        ))}
    </>
  )
}
