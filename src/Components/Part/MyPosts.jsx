import { Link } from 'react-router-dom'
import { FaRegSquarePlus } from 'react-icons/fa6'
import { api } from '../../lib/api'
import PinGrid from '../Pin/PinGrid'
import usePostList from '../Pin/usePostList'
import EmptyState from '../UI/EmptyState'
import { buttonClass } from '../UI/buttonClass'

// Pins created by a user (shown on their profile)
export default function MyPosts({ id, isOwn }) {
  const list = usePostList(
    (page, signal) => api.get(`/myposts/${id}`, { signal }).then((r) => ({ posts: r.data.posts, hasMore: false })),
    id,
    { paginated: false },
  )

  return (
    <PinGrid
      {...list}
      showAuthor={false}
      empty={
        isOwn ? (
          <EmptyState
            icon={<FaRegSquarePlus />}
            title="You haven't created any pins yet"
            description="Share an idea and it will show up here."
            action={<Link to="/create" className={buttonClass()}>Create a pin</Link>}
          />
        ) : (
          <EmptyState title="No pins yet" description="When they share ideas, you'll see them here." />
        )
      }
    />
  )
}
