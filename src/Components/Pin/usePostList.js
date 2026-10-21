import { useCallback, useEffect, useRef, useState } from 'react'
import { errorMessage } from '../../lib/api'

/**
 * Loads a list of pins with pagination, cancellation and local edits.
 * `load(page, signal)` must resolve to `{ posts, hasMore }`; pass `paginated: false`
 * for endpoints that return everything at once. Changing `key` reloads from page 1.
 */
export default function usePostList(load, key, { paginated = true, enabled = true } = {}) {
  const [state, setState] = useState({ posts: [], status: 'loading', error: null, page: 0, hasMore: false })
  const [loadingMore, setLoadingMore] = useState(false)
  const loadRef = useRef(load)
  const controller = useRef(null)

  useEffect(() => {
    loadRef.current = load
  })

  const fetchPage = useCallback(async (page) => {
    controller.current?.abort()
    controller.current = new AbortController()
    const { signal } = controller.current
    if (page === 1) setState((s) => ({ ...s, status: 'loading', error: null }))
    else {
      setLoadingMore(true)
      setState((s) => ({ ...s, error: null }))
    }

    try {
      const result = await loadRef.current(page, signal)
      if (signal.aborted) return
      setState((s) => {
        const seen = new Set(page === 1 ? [] : s.posts.map((p) => p._id))
        const posts = page === 1 ? result.posts : [...s.posts, ...result.posts.filter((p) => !seen.has(p._id))]
        return { posts, status: 'ready', error: null, page, hasMore: paginated && Boolean(result.hasMore) }
      })
    } catch (error) {
      if (signal.aborted) return
      const message = errorMessage(error)
      // A failed later page keeps `hasMore` so the grid can offer a retry
      setState((s) => (page === 1 ? { ...s, status: 'error', error: message } : { ...s, error: message }))
    } finally {
      if (!signal.aborted) setLoadingMore(false)
    }
  }, [paginated])

  useEffect(() => {
    if (!enabled) return
    fetchPage(1)
    return () => controller.current?.abort()
  }, [key, enabled, fetchPage])

  const loadMore = useCallback(() => {
    if (state.status === 'ready' && state.hasMore && !loadingMore) fetchPage(state.page + 1)
  }, [state.status, state.hasMore, state.page, loadingMore, fetchPage])

  const updatePost = useCallback((id, patch) => {
    setState((s) => ({ ...s, posts: s.posts.map((p) => (p._id === id ? { ...p, ...patch } : p)) }))
  }, [])

  const removePost = useCallback((id) => {
    setState((s) => ({ ...s, posts: s.posts.filter((p) => p._id !== id) }))
  }, [])

  return { ...state, loadingMore, loadMore, reload: () => fetchPage(1), updatePost, removePost }
}
