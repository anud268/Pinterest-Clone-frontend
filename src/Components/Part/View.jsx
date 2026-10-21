import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { GoArrowUpRight } from 'react-icons/go'
import { HiDotsHorizontal } from 'react-icons/hi'
import { IoArrowBack, IoDownloadOutline, IoExpandOutline, IoEyeOffOutline, IoImageOutline, IoLinkOutline, IoLocationOutline, IoLogoWhatsapp, IoShareSocialOutline } from 'react-icons/io5'
import { MdOutlineArchive, MdOutlineUnarchive } from 'react-icons/md'
import { FiEdit2, FiTrash2 } from 'react-icons/fi'
import { IoIosEye } from 'react-icons/io'
import { api, errorMessage } from '../../lib/api'
import { useDocumentTitle } from '../../lib/hooks'
import { imageSrcSet, imageUrl } from '../../lib/image'
import { siteName } from '../../lib/url'
import usePinActions from '../Pin/usePinActions'
import usePostList from '../Pin/usePostList'
import PinGrid from '../Pin/PinGrid'
import Avatar from '../UI/Avatar'
import Button, { IconButton } from '../UI/Button'
import Dialog, { ConfirmDialog } from '../UI/Dialog'
import EmptyState from '../UI/EmptyState'
import Menu from '../UI/Menu'
import { Alert } from '../UI/Field'

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : null

function ViewSkeleton() {
  return (
    <div className="mx-auto grid max-w-6xl overflow-hidden rounded-[2rem] border border-line md:grid-cols-2" aria-busy="true" aria-label="Loading pin">
      <div className="skeleton aspect-[4/5] w-full" />
      <div className="flex flex-col gap-4 p-6 sm:p-8">
        <div className="flex justify-between">
          <div className="skeleton h-10 w-28 rounded-full" />
          <div className="skeleton h-10 w-20 rounded-full" />
        </div>
        <div className="skeleton mt-4 h-8 w-3/4 rounded-xl" />
        <div className="skeleton h-4 w-full rounded-full" />
        <div className="skeleton h-4 w-5/6 rounded-full" />
        <div className="mt-6 flex items-center gap-3">
          <div className="skeleton size-10 rounded-full" />
          <div className="skeleton h-4 w-32 rounded-full" />
        </div>
      </div>
    </div>
  )
}

function PinDetail({ post, setPost }) {
  const navigate = useNavigate()
  const actions = usePinActions(post, { onChange: (patch) => setPost((p) => ({ ...p, ...patch })) })
  const [lightbox, setLightbox] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [busy, setBusy] = useState(false)
  const [imageFailed, setImageFailed] = useState(false)

  const author = post.userId
  const hidden = Boolean(actions.user && post.interested?.includes(actions.user._id))
  const tags = post.tags ?? []
  const site = siteName(post.url)

  const setHidden = (value) =>
    setPost((p) => ({
      ...p,
      interested: value ? [...(p.interested ?? []), actions.user._id] : (p.interested ?? []).filter((id) => id !== actions.user._id),
    }))

  const archive = async () => (await actions.archive()) && setPost((p) => ({ ...p, archive: true }))
  const restore = async () => (await actions.unarchive()) && setPost((p) => ({ ...p, archive: false }))
  const hide = async () => (await actions.hide()) && setHidden(true)
  const unhide = async () => (await actions.unhide()) && setHidden(false)

  const menuItems = [
    { label: 'Download image', icon: <IoDownloadOutline />, onSelect: actions.download },
    { label: 'Copy link', icon: <IoLinkOutline />, onSelect: actions.share },
    { label: 'Share on WhatsApp', icon: <IoLogoWhatsapp />, href: actions.whatsappUrl },
    'divider',
    { label: 'Edit pin', icon: <FiEdit2 />, to: `/create?edit=${post._id}`, hidden: !actions.isOwner || actions.readOnly },
    { label: 'Archive', icon: <MdOutlineArchive />, onSelect: archive, hidden: !actions.isOwner || post.archive },
    { label: 'Restore from archive', icon: <MdOutlineUnarchive />, onSelect: restore, hidden: !actions.isOwner || !post.archive },
    { label: 'Not interested', icon: <IoEyeOffOutline />, onSelect: hide, hidden: actions.isOwner || hidden },
    { label: 'Show in my feed again', icon: <IoIosEye />, onSelect: unhide, hidden: actions.isOwner || !hidden },
    { label: 'Delete pin', icon: <FiTrash2 />, onSelect: () => setConfirmDelete(true), danger: true, hidden: !actions.isOwner },
  ]

  return (
    <article className="mx-auto grid max-w-6xl overflow-hidden rounded-[2rem] border border-line bg-white shadow-card md:grid-cols-2">
      <div className="relative flex items-center justify-center bg-surface">
        {imageFailed || !post.postImage ? (
          <div className="flex aspect-[4/5] w-full flex-col items-center justify-center gap-2 text-ink-subtle">
            <IoImageOutline className="text-4xl" aria-hidden="true" />
            <span className="text-sm font-semibold">Image unavailable</span>
          </div>
        ) : (
          <button type="button" onClick={() => setLightbox(true)} className="group block w-full cursor-zoom-in" aria-label="View image full size">
            <img
              src={imageUrl(post.postImage, 1080)}
              srcSet={imageSrcSet(post.postImage, [600, 900, 1200])}
              sizes="(max-width: 768px) 100vw, 576px"
              alt={post.postTitle || 'Pin image'}
              onError={() => setImageFailed(true)}
              className="mx-auto max-h-[80vh] w-full object-contain"
              style={post.imageWidth ? { aspectRatio: `${post.imageWidth} / ${post.imageHeight}` } : undefined}
            />
            <span className="absolute right-3 bottom-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold opacity-0 shadow-card transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
              <IoExpandOutline aria-hidden="true" /> Expand
            </span>
          </button>
        )}
      </div>

      <div className="flex min-w-0 flex-col p-5 sm:p-8">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <Menu
              align="left"
              items={menuItems}
              trigger={(props) => (
                <IconButton label="More options" {...props}>
                  <HiDotsHorizontal />
                </IconButton>
              )}
            />
            <IconButton label="Share" onClick={actions.share}>
              <IoShareSocialOutline />
            </IconButton>
            <IconButton label="Download image" onClick={actions.download}>
              <IoDownloadOutline />
            </IconButton>
          </div>
          <Button
            size="lg"
            variant={actions.isSaved ? 'dark' : 'primary'}
            onClick={actions.toggleSave}
            aria-pressed={actions.isSaved}
            disabled={actions.readOnly}
          >
            {actions.isSaved ? 'Saved' : 'Save'}
          </Button>
        </div>

        <div className="mt-4 space-y-2">
          {post.archive && (
            <Alert tone="info">
              This pin is archived, so only you can see it.{' '}
              <button type="button" className="font-bold text-ink underline cursor-pointer" onClick={restore}>
                Restore it
              </button>
            </Alert>
          )}
          {post.adminStrike && <Alert>An administrator removed this pin from public view.</Alert>}
          {hidden && (
            <Alert tone="info">
              You marked this pin as not interested.{' '}
              <button type="button" className="font-bold text-ink underline cursor-pointer" onClick={unhide}>
                Undo
              </button>
            </Alert>
          )}
        </div>

        {site && (
          <a
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex w-fit max-w-full items-center gap-1.5 text-sm font-semibold text-ink-muted underline-offset-4 hover:text-ink hover:underline"
          >
            <GoArrowUpRight className="shrink-0" aria-hidden="true" />
            <span className="truncate">{site}</span>
          </a>
        )}

        <h1 className="mt-3 text-2xl leading-tight font-extrabold tracking-tight break-words sm:text-3xl">{post.postTitle}</h1>
        {post.postDescription && <p className="mt-3 leading-relaxed whitespace-pre-line text-ink-muted break-words">{post.postDescription}</p>}

        {(tags.length > 0 || post.location) && (
          <div className="mt-5 flex flex-wrap gap-2">
            {post.location && (
              <Link
                to={`/search?q=${encodeURIComponent(post.location)}&type=Location`}
                className="inline-flex items-center gap-1 rounded-full bg-surface px-3 py-1.5 text-xs font-semibold hover:bg-surface-strong"
              >
                <IoLocationOutline aria-hidden="true" /> {post.location}
              </Link>
            )}
            {tags.map((tag) => (
              <Link
                key={tag}
                to={`/search?q=${encodeURIComponent(tag)}&type=Tag`}
                className="rounded-full bg-surface px-3 py-1.5 text-xs font-semibold hover:bg-surface-strong"
              >
                {tag}
              </Link>
            ))}
          </div>
        )}

        <div className="mt-auto pt-8">
          {author && (
            <Link to={`/profile/${author._id}`} className="flex w-fit items-center gap-3 rounded-full pr-3 hover:bg-surface">
              <Avatar src={author.image} name={author.fullname} size="md" />
              <span>
                <span className="block text-sm font-bold">{author.fullname}</span>
                <span className="block text-xs text-ink-subtle">View profile</span>
              </span>
            </Link>
          )}
          {post.createdAt && <p className="mt-4 text-xs text-ink-subtle">Posted {formatDate(post.createdAt)}</p>}
        </div>
      </div>

      <Dialog open={lightbox} onClose={() => setLightbox(false)} size="full" className="h-[calc(100%-2rem)] bg-black">
        <img src={post.postImage} alt={post.postTitle || 'Pin image'} className="mx-auto max-h-[calc(100dvh-7rem)] w-auto object-contain" />
      </Dialog>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete this pin?"
        description="This permanently removes the pin for everyone. You can't undo this."
        confirmLabel="Delete"
        loading={busy}
        onConfirm={async () => {
          setBusy(true)
          const ok = await actions.destroy()
          setBusy(false)
          if (ok) navigate(`/profile/${actions.user._id}`, { replace: true })
        }}
      />
    </article>
  )
}

function RelatedPins({ postId }) {
  const list = usePostList(
    (page, signal) => api.get(`/related/${postId}`, { signal }).then((r) => ({ posts: r.data.posts, hasMore: false })),
    postId,
    { paginated: false },
  )
  if (list.status === 'ready' && list.posts.length === 0) return null

  return (
    <section className="mx-auto mt-12 max-w-[1800px]" aria-labelledby="related-heading">
      <h2 id="related-heading" className="mb-5 text-center text-xl font-bold tracking-tight">
        More like this
      </h2>
      <PinGrid {...list} skeletonCount={8} />
    </section>
  )
}

export default function View() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [post, setPost] = useState(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)
  useDocumentTitle(post?.postTitle)

  useEffect(() => {
    const controller = new AbortController()
    setStatus('loading')
    api
      .get(`/viewpost/${id}`, { signal: controller.signal })
      .then(({ data }) => {
        setPost(data.post)
        setStatus('ready')
      })
      .catch((err) => {
        if (controller.signal.aborted) return
        setError(err.response?.status === 404 || err.response?.status === 400 ? 'not-found' : errorMessage(err))
        setStatus('error')
      })
    window.scrollTo(0, 0)
    return () => controller.abort()
  }, [id])

  const goBack = () => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/home'))

  return (
    <div className="pt-2">
      <div className="mx-auto mb-4 max-w-6xl">
        <Button variant="ghost" size="sm" onClick={goBack}>
          <IoArrowBack aria-hidden="true" /> Back
        </Button>
      </div>

      {status === 'loading' && <ViewSkeleton />}
      {status === 'error' &&
        (error === 'not-found' ? (
          <EmptyState
            icon={<IoImageOutline />}
            title="This pin is unavailable"
            description="It may have been deleted, archived or removed."
            action={<Button onClick={() => navigate('/home')}>Back to home</Button>}
          />
        ) : (
          <EmptyState title="We couldn't load this pin" description={error} action={<Button variant="secondary" onClick={() => navigate(0)}>Try again</Button>} />
        ))}
      {status === 'ready' && post && (
        <>
          <PinDetail key={post._id} post={post} setPost={setPost} />
          <RelatedPins postId={post._id} />
        </>
      )}
    </div>
  )
}
