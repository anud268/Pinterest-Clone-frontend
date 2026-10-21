import { memo, useState } from 'react'
import { Link } from 'react-router-dom'
import { GoArrowUpRight } from 'react-icons/go'
import { HiDotsHorizontal } from 'react-icons/hi'
import { IoDownloadOutline, IoEyeOffOutline, IoImageOutline, IoLinkOutline, IoLogoWhatsapp } from 'react-icons/io5'
import { MdOutlineArchive, MdOutlineUnarchive } from 'react-icons/md'
import { FiEdit2, FiTrash2 } from 'react-icons/fi'
import { IoIosEye } from 'react-icons/io'
import { FaBookmark, FaRegBookmark } from 'react-icons/fa'
import Avatar from '../UI/Avatar'
import Button, { IconButton } from '../UI/Button'
import Menu from '../UI/Menu'
import { ConfirmDialog } from '../UI/Dialog'
import { aspectRatio, imageSrcSet, imageUrl } from '../../lib/image'
import { siteName } from '../../lib/url'
import usePinActions from './usePinActions'

/**
 * A pin in a masonry grid.
 * mode: 'feed' (default) | 'archived' | 'hidden' changes which quick actions are offered.
 * onChange(id, patch) / onRemove(id) take the pin id so parents can pass stable callbacks.
 */
function PinCard({ post, onChange, onRemove, mode = 'feed', showAuthor = true }) {
  const actions = usePinActions(post, {
    onChange: onChange && ((patch) => onChange(post._id, patch)),
    onRemove: onRemove && (() => onRemove(post._id)),
  })
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const ratio = aspectRatio(post)
  const author = post.userId && typeof post.userId === 'object' ? post.userId : null
  const site = siteName(post.url)
  const isFeed = mode === 'feed'

  const menuItems = [
    {
      label: actions.isSaved ? 'Remove from saved' : 'Save',
      icon: actions.isSaved ? <FaBookmark /> : <FaRegBookmark />,
      onSelect: actions.toggleSave,
      hidden: !isFeed || actions.readOnly,
    },
    { label: 'Download image', icon: <IoDownloadOutline />, onSelect: actions.download },
    { label: 'Copy link', icon: <IoLinkOutline />, onSelect: actions.share },
    { label: 'Share on WhatsApp', icon: <IoLogoWhatsapp />, href: actions.whatsappUrl },
    'divider',
    { label: 'Not interested', icon: <IoEyeOffOutline />, onSelect: actions.hide, hidden: !isFeed || actions.isOwner },
    { label: 'Show in my feed again', icon: <IoIosEye />, onSelect: actions.unhide, hidden: mode !== 'hidden' },
    { label: 'Edit pin', icon: <FiEdit2 />, to: `/create?edit=${post._id}`, hidden: !actions.isOwner || actions.readOnly },
    { label: 'Archive', icon: <MdOutlineArchive />, onSelect: actions.archive, hidden: !actions.isOwner || mode === 'archived' },
    { label: 'Restore from archive', icon: <MdOutlineUnarchive />, onSelect: actions.unarchive, hidden: mode !== 'archived' },
    { label: 'Delete', icon: <FiTrash2 />, onSelect: () => setConfirmDelete(true), danger: true, hidden: !actions.isOwner },
  ]

  return (
    <article className={`group relative ${menuOpen ? 'z-20' : ''}`}>
      <div className="relative">
        <Link
          to={`/post/${post._id}`}
          className="relative block overflow-hidden rounded-2xl bg-surface focus-visible:outline-offset-4"
          style={ratio ? { aspectRatio: `1 / ${ratio}` } : undefined}
          aria-label={post.postTitle || 'Open pin'}
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
              onLoad={() => setLoaded(true)}
              onError={() => setFailed(true)}
              className={`block w-full object-cover transition-opacity duration-300 ${ratio ? 'h-full' : 'min-h-24'} ${
                loaded ? 'opacity-100' : 'opacity-0'
              } ${mode === 'archived' ? 'grayscale-[60%]' : ''}`}
            />
          )}
          {!loaded && !failed && post.postImage && <span className="skeleton absolute inset-0" aria-hidden="true" />}
          <span className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-200 group-hover:bg-black/30" aria-hidden="true" />
          {post.adminStrike && (
            <span className="absolute top-2 left-2 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-danger shadow-card">
              Removed by admin
            </span>
          )}
        </Link>

        {/* Quick actions: revealed on hover/focus on pointer devices, always visible on touch */}
        <div
          className={`pointer-events-none absolute inset-0 flex flex-col justify-between p-2.5 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100 pointer-coarse:opacity-100 ${
            menuOpen ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="flex justify-end">
            {isFeed && (
              <Button
                size="md"
                variant={actions.isSaved ? 'dark' : 'primary'}
                onClick={actions.toggleSave}
                aria-pressed={actions.isSaved}
                disabled={actions.readOnly}
                className="pointer-events-auto pointer-coarse:hidden"
              >
                {actions.isSaved ? 'Saved' : 'Save'}
              </Button>
            )}
          </div>
          <div className="flex items-end justify-between gap-2">
            {site ? (
              <a
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                className="pointer-events-auto inline-flex min-w-0 items-center gap-1 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-ink shadow-card backdrop-blur hover:bg-white pointer-coarse:hidden"
              >
                <GoArrowUpRight className="shrink-0" aria-hidden="true" />
                <span className="truncate">{site}</span>
              </a>
            ) : (
              <span />
            )}
            <Menu
              align="right"
              onOpenChange={setMenuOpen}
              className="pointer-events-auto"
              items={menuItems}
              trigger={(props) => (
                <IconButton label="More options" variant="overlay" size="sm" {...props}>
                  <HiDotsHorizontal />
                </IconButton>
              )}
            />
          </div>
        </div>
      </div>

      {(post.postTitle || (showAuthor && author)) && (
        <div className="px-1 pt-2">
          {post.postTitle && (
            <Link to={`/post/${post._id}`} tabIndex={-1} className="line-clamp-2 text-sm leading-snug font-semibold text-ink">
              {post.postTitle}
            </Link>
          )}
          {showAuthor && author && (
            <Link to={`/profile/${author._id}`} className="mt-1.5 flex w-fit max-w-full items-center gap-2 rounded-full text-xs text-ink-muted hover:text-ink">
              <Avatar src={author.image} name={author.fullname} size="xs" />
              <span className="truncate">{author.fullname}</span>
            </Link>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete this pin?"
        description="This permanently removes the pin for everyone. You can't undo this."
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={async () => {
          setDeleting(true)
          const ok = await actions.destroy()
          setDeleting(false)
          if (ok) setConfirmDelete(false)
        }}
      />
    </article>
  )
}

export default memo(PinCard)
