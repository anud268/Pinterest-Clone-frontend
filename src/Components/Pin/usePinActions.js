import { useDispatch, useSelector } from 'react-redux'
import { api, errorMessage } from '../../lib/api'
import { toast } from '../../lib/toast'
import { postChanged, postRemoved } from '../Redex/Slice/PostSlice'
import { selectUser } from '../Redex/Slice/UserSlice'

export const postLink = (post) => `${window.location.origin}/post/${post._id}`

export const isSavedBy = (post, user) => Boolean(user && post.saved?.includes(user._id))

// Shared pin actions with optimistic UI. `onChange(patch)` / `onRemove()` update the caller's
// local list; the cached home feed is kept in sync automatically.
export default function usePinActions(post, { onChange, onRemove } = {}) {
  const dispatch = useDispatch()
  const user = useSelector(selectUser)
  const isOwner = Boolean(user && post?.userId && (post.userId._id ?? post.userId) === user._id)
  const readOnly = Boolean(user?.adminblock)

  const change = (patch) => {
    onChange?.(patch)
    dispatch(postChanged({ _id: post._id, ...patch }))
  }

  const remove = () => {
    onRemove?.()
    dispatch(postRemoved(post._id))
  }

  const toggleSave = async () => {
    if (readOnly) return toast.error('Your account is restricted, so you can’t save pins.')
    const wasSaved = isSavedBy(post, user)
    const before = post.saved ?? []
    change({ saved: wasSaved ? before.filter((id) => id !== user._id) : [...before, user._id] })
    try {
      const { data } = await api.post('/save', { postId: post._id })
      toast.success(data.saved ? 'Saved to your profile' : 'Removed from saved')
    } catch (error) {
      change({ saved: before })
      toast.error(errorMessage(error, 'Could not update saved pins'))
    }
  }

  const run = async (request, { success, removeAfter = false, patch } = {}) => {
    try {
      const { data } = await request()
      if (removeAfter) remove()
      if (patch) change(patch)
      toast.success(success ?? data?.message)
      return true
    } catch (error) {
      toast.error(errorMessage(error))
      return false
    }
  }

  return {
    user,
    isOwner,
    readOnly,
    isSaved: isSavedBy(post, user),
    toggleSave,
    hide: () => run(() => api.post('/notinterested', { postId: post._id }), { removeAfter: true, success: "Got it. We'll show fewer pins like this" }),
    unhide: () => run(() => api.post('/removenotinterest', { postId: post._id }), { removeAfter: true }),
    archive: () => run(() => api.post('/archive', { postId: post._id }), { removeAfter: true, patch: { archive: true } }),
    unarchive: () => run(() => api.post('/unarchive', { postId: post._id }), { removeAfter: true, patch: { archive: false } }),
    destroy: () => run(() => api.post('/delete', { postId: post._id }), { removeAfter: true }),
    share: async () => {
      const url = postLink(post)
      if (navigator.share) {
        try {
          await navigator.share({ title: post.postTitle, url })
          return
        } catch (error) {
          if (error?.name === 'AbortError') return
        }
      }
      try {
        await navigator.clipboard.writeText(url)
        toast.success('Link copied to clipboard')
      } catch {
        toast.error('Could not copy the link')
      }
    },
    whatsappUrl: `https://wa.me/?text=${encodeURIComponent(`${post?.postTitle ?? ''}\n${post ? postLink(post) : ''}`)}`,
    download: async () => {
      try {
        const response = await fetch(post.postImage)
        if (!response.ok) throw new Error('download failed')
        const blob = await response.blob()
        const href = URL.createObjectURL(blob)
        const link = Object.assign(document.createElement('a'), {
          href,
          download: `${(post.postTitle || 'pin').replace(/[^\w-]+/g, '-').slice(0, 60)}.${blob.type.split('/')[1] || 'jpg'}`,
        })
        link.click()
        setTimeout(() => URL.revokeObjectURL(href), 1000)
      } catch {
        // Cross-origin images without CORS: open the original instead
        window.open(post.postImage, '_blank', 'noopener')
      }
    },
  }
}
