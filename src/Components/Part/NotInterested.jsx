import { useCallback } from 'react'
import { useSelector } from 'react-redux'
import { IoEyeOffOutline } from 'react-icons/io5'
import { api } from '../../lib/api'
import { useDocumentTitle } from '../../lib/hooks'
import { selectUser } from '../Redex/Slice/UserSlice'
import PinGrid from '../Pin/PinGrid'
import usePostList from '../Pin/usePostList'
import EmptyState from '../UI/EmptyState'
import SettingsHeader from './SettingsHeader'

export default function NotInterested() {
  useDocumentTitle('Hidden pins')
  const user = useSelector(selectUser)

  const load = useCallback(async (page, signal) => {
    const { data } = await api.get(`/fetchnotinterested/${user._id}`, { signal })
    return { posts: data.posts, hasMore: false }
  }, [user._id])

  const list = usePostList(load, user._id, { paginated: false })

  return (
    <>
      <SettingsHeader
        title="Hidden pins"
        description="Pins you marked as not interested. They won't appear in your feed until you show them again."
      />
      <PinGrid
        {...list}
        mode="hidden"
        skeletonCount={8}
        empty={
          <EmptyState
            icon={<IoEyeOffOutline />}
            title="No hidden pins"
            description="Choose “Not interested” from a pin’s menu to hide it from your feed."
          />
        }
      />
    </>
  )
}
