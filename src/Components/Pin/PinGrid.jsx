import { useCallback } from 'react'
import { IoAlertCircleOutline } from 'react-icons/io5'
import { useInView } from '../../lib/hooks'
import Button from '../UI/Button'
import EmptyState from '../UI/EmptyState'
import Spinner from '../UI/Spinner'
import MasonryGrid, { MasonrySkeleton } from './MasonryGrid'
import PinCard from './PinCard'

/**
 * Masonry grid of pins with loading, error, empty and infinite-scroll states.
 * Accepts the object returned by usePostList (or the same shape).
 */
export default function PinGrid({
  posts,
  status,
  error,
  hasMore = false,
  loadingMore = false,
  loadMore,
  reload,
  updatePost,
  removePost,
  empty,
  mode = 'feed',
  showAuthor = true,
  skeletonCount = 16,
}) {
  // Stops auto-loading after an error so a failing request isn't retried in a loop
  const sentinel = useInView(() => loadMore?.(), { enabled: status === 'ready' && hasMore && !loadingMore && !error })

  const renderItem = useCallback(
    (post) => (
      <PinCard key={post._id} post={post} mode={mode} showAuthor={showAuthor} onChange={updatePost} onRemove={removePost} />
    ),
    [mode, showAuthor, updatePost, removePost],
  )

  if (status === 'loading') return <MasonrySkeleton count={skeletonCount} />

  if (status === 'error') {
    return (
      <EmptyState
        icon={<IoAlertCircleOutline />}
        title="We couldn't load these pins"
        description={error}
        action={reload && <Button variant="secondary" onClick={reload}>Try again</Button>}
      />
    )
  }

  if (!posts.length) return empty ?? <EmptyState title="Nothing here yet" />

  return (
    <>
      <MasonryGrid items={posts} renderItem={renderItem} />
      <div ref={sentinel} className="flex h-24 items-center justify-center text-ink-subtle">
        {loadingMore && <Spinner label="Loading more pins" />}
        {!loadingMore && error && (
          <Button variant="secondary" size="sm" onClick={() => loadMore?.()}>
            Couldn&apos;t load more. Retry
          </Button>
        )}
      </div>
    </>
  )
}
