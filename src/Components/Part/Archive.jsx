import { useCallback } from 'react'
import { useSelector } from 'react-redux'
import { MdOutlineArchive } from 'react-icons/md'
import { api } from '../../lib/api'
import { useDocumentTitle } from '../../lib/hooks'
import { selectUser } from '../Redex/Slice/UserSlice'
import PinGrid from '../Pin/PinGrid'
import usePostList from '../Pin/usePostList'
import EmptyState from '../UI/EmptyState'
import SettingsHeader from './SettingsHeader'

export default function Archive() {
  useDocumentTitle('Archived pins')
  const user = useSelector(selectUser)

  const load = useCallback(async (page, signal) => {
    const { data } = await api.get(`/archived/${user._id}`, { signal })
    return { posts: data.posts, hasMore: false }
  }, [user._id])

  const list = usePostList(load, user._id, { paginated: false })

  return (
    <>
      <SettingsHeader title="Archived pins" description="Only you can see these. Restore a pin to show it on your profile again." />
      <PinGrid
        {...list}
        mode="archived"
        showAuthor={false}
        skeletonCount={8}
        empty={
          <EmptyState
            icon={<MdOutlineArchive />}
            title="No archived pins"
            description="Archive a pin from its menu to hide it from your profile without deleting it."
          />
        }
      />
    </>
  )
}
