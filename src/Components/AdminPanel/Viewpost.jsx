import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { IoAlertCircleOutline, IoArrowBack, IoImageOutline } from 'react-icons/io5'
import { api, errorMessage } from '../../lib/api'
import { useDocumentTitle } from '../../lib/hooks'
import { imageUrl } from '../../lib/image'
import { toast } from '../../lib/toast'
import Avatar from '../UI/Avatar'
import Button from '../UI/Button'
import { buttonClass } from '../UI/buttonClass'
import { ConfirmDialog } from '../UI/Dialog'
import EmptyState from '../UI/EmptyState'
import { PageSpinner } from '../UI/Spinner'

const isObjectId = (value) => /^[a-f\d]{24}$/i.test(value || '')

const BackLink = () => (
  <Link to="/admin" className={buttonClass({ variant: 'ghost', size: 'sm', className: 'mb-4 -ml-2' })}>
    <IoArrowBack aria-hidden="true" /> All posts
  </Link>
)

export default function Viewpost() {
  const [params] = useSearchParams()
  const id = params.get('id')
  const validId = isObjectId(id)
  const navigate = useNavigate()

  const [post, setPost] = useState(null)
  const [status, setStatus] = useState(validId ? 'loading' : 'invalid')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [imageFailed, setImageFailed] = useState(false)

  useDocumentTitle(post ? `Admin · ${post.postTitle}` : 'Admin · Post')

  const load = useCallback(
    async (signal) => {
      if (!validId) return setStatus('invalid')
      setStatus('loading')
      try {
        const { data } = await api.get(`/viewpost/${id}`, { signal })
        setPost(data.post)
        setStatus('ready')
      } catch (err) {
        if (signal?.aborted) return
        setError(errorMessage(err))
        setStatus(err.response?.status === 404 ? 'missing' : 'error')
      }
    },
    [id, validId],
  )

  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal)
    return () => controller.abort()
  }, [load])

  const act = async (key, request, apply) => {
    setBusy(key)
    try {
      const { data } = await request()
      apply?.(data)
      toast.success(data.message)
      return true
    } catch (err) {
      toast.error(errorMessage(err))
      return false
    } finally {
      setBusy(null)
    }
  }

  if (status === 'loading') return <PageSpinner label="Loading post" />

  if (status !== 'ready') {
    const copy = {
      invalid: { title: 'No post selected', description: 'Open a post from the posts list to review it.' },
      missing: { title: 'Post not found', description: 'It may have been deleted.' },
      error: { title: "We couldn't load this post", description: error },
    }[status]
    return (
      <>
        <BackLink />
        <EmptyState
          icon={<IoAlertCircleOutline />}
          {...copy}
          action={status === 'error' && <Button variant="secondary" onClick={() => load()}>Try again</Button>}
        />
      </>
    )
  }

  const author = post.userId
  const badges = [
    post.archive && { label: 'Archived', className: 'bg-surface text-ink' },
    post.adminStrike && { label: 'Struck', className: 'bg-amber-50 text-amber-800' },
    author?.adminblock && { label: 'Author blocked', className: 'bg-brand-50 text-brand-700' },
  ].filter(Boolean)

  return (
    <>
      <BackLink />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-10">
        <div className="overflow-hidden rounded-3xl bg-surface">
          {imageFailed || !post.postImage ? (
            <div className="flex aspect-[4/5] flex-col items-center justify-center gap-2 text-ink-subtle">
              <IoImageOutline className="text-4xl" aria-hidden="true" />
              <span className="text-sm font-semibold">Image unavailable</span>
            </div>
          ) : (
            <img
              src={imageUrl(post.postImage, 1200)}
              alt={post.postTitle || ''}
              onError={() => setImageFailed(true)}
              className="mx-auto max-h-[80vh] w-full object-contain"
            />
          )}
        </div>

        <section aria-labelledby="admin-post-title" className="min-w-0">
          {badges.length > 0 && (
            <ul className="mb-3 flex flex-wrap gap-2" aria-label="Status">
              {badges.map((b) => (
                <li key={b.label} className={`rounded-full px-3 py-1 text-xs font-bold ${b.className}`}>
                  {b.label}
                </li>
              ))}
            </ul>
          )}
          <h1 id="admin-post-title" className="text-2xl font-extrabold tracking-tight break-words sm:text-3xl">
            {post.postTitle}
          </h1>
          {post.postDescription && <p className="mt-3 leading-relaxed break-words text-ink-muted">{post.postDescription}</p>}

          {post.tags?.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2" aria-label="Tags">
              {post.tags.map((tag) => (
                <li key={tag} className="rounded-full bg-surface px-3 py-1 text-xs font-semibold">
                  {tag}
                </li>
              ))}
            </ul>
          )}

          <dl className="mt-6 grid gap-3 rounded-2xl border border-line p-4 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-ink-muted">Author</dt>
              <dd className="min-w-0">
                {author ? (
                  <Link to={`/profile/${author._id}`} className="flex items-center gap-2 font-semibold hover:underline">
                    <Avatar src={author.image} name={author.fullname} size="xs" />
                    <span className="truncate">{author.fullname}</span>
                  </Link>
                ) : (
                  'Unknown'
                )}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-muted">Created</dt>
              <dd className="font-semibold">{post.createdAt ? new Date(post.createdAt).toLocaleString() : '—'}</dd>
            </div>
            {post.location && (
              <div className="flex justify-between gap-3">
                <dt className="text-ink-muted">Location</dt>
                <dd className="truncate font-semibold">{post.location}</dd>
              </div>
            )}
            {post.url && (
              <div className="flex justify-between gap-3">
                <dt className="text-ink-muted">Link</dt>
                <dd className="min-w-0 truncate">
                  <a href={post.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-700 hover:underline">
                    {post.url}
                  </a>
                </dd>
              </div>
            )}
          </dl>

          <div className="mt-6 flex flex-wrap gap-2">
            {author && (
              <Button
                variant={author.adminblock ? 'secondary' : 'dark'}
                loading={busy === 'block'}
                disabled={Boolean(busy)}
                onClick={() =>
                  act('block', () => api.post('/adminblock', { id: author._id }), (data) =>
                    setPost((p) => ({ ...p, userId: { ...p.userId, adminblock: data.blocked } })),
                  )
                }
              >
                {author.adminblock ? 'Unblock author' : 'Block author'}
              </Button>
            )}
            <Button
              variant={post.adminStrike ? 'secondary' : 'outline'}
              loading={busy === 'strike'}
              disabled={Boolean(busy)}
              onClick={() =>
                act('strike', () => api.post('/adminstrike', { postId: post._id }), (data) =>
                  setPost((p) => ({ ...p, adminStrike: data.striked })),
                )
              }
            >
              {post.adminStrike ? 'Remove strike' : 'Strike post'}
            </Button>
            <Button variant="danger" disabled={Boolean(busy)} onClick={() => setConfirmDelete(true)}>
              Delete post
            </Button>
          </div>
        </section>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete this post?"
        description="It will be permanently removed for everyone. This can't be undone."
        confirmLabel="Delete"
        loading={busy === 'delete'}
        onConfirm={async () => {
          const ok = await act('delete', () => api.post('/delete', { postId: post._id }))
          if (ok) {
            setConfirmDelete(false)
            navigate('/admin')
          }
        }}
      />
    </>
  )
}
