import { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { IoAlertCircleOutline } from 'react-icons/io5'
import { MdBlock } from 'react-icons/md'
import { api, errorMessage } from '../../lib/api'
import { toast } from '../../lib/toast'
import { useDocumentTitle } from '../../lib/hooks'
import { selectUser } from '../Redex/Slice/UserSlice'
import Avatar from '../UI/Avatar'
import Button from '../UI/Button'
import { ConfirmDialog } from '../UI/Dialog'
import EmptyState from '../UI/EmptyState'
import SettingsHeader from './SettingsHeader'

export default function BlockedUsers() {
  useDocumentTitle('Blocked accounts')
  const user = useSelector(selectUser)
  const [users, setUsers] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)
  const [pending, setPending] = useState(null)
  const [unblocking, setUnblocking] = useState(false)

  const load = useCallback(async () => {
    setStatus('loading')
    try {
      const { data } = await api.get(`/blockedusers/${user._id}`)
      setUsers(data.users)
      setStatus('ready')
    } catch (err) {
      setError(errorMessage(err, 'Could not load blocked accounts'))
      setStatus('error')
    }
  }, [user._id])

  useEffect(() => {
    load()
  }, [load])

  const unblock = async () => {
    setUnblocking(true)
    try {
      const { data } = await api.post('/userblock', { id: pending._id })
      if (data.blocked === false) {
        setUsers((list) => list.filter((u) => u._id !== pending._id))
        toast.success(`${pending.fullname} is unblocked`)
      }
      setPending(null)
    } catch (err) {
      toast.error(errorMessage(err, 'Could not unblock this account'))
    } finally {
      setUnblocking(false)
    }
  }

  let content
  if (status === 'loading') {
    content = (
      <ul aria-busy="true" aria-label="Loading blocked accounts" className="divide-y divide-line">
        {[0, 1, 2].map((i) => (
          <li key={i} className="flex items-center gap-3 py-3">
            <div className="skeleton size-10 rounded-full" />
            <div className="skeleton h-4 w-40 rounded-full" />
          </li>
        ))}
      </ul>
    )
  } else if (status === 'error') {
    content = (
      <EmptyState
        icon={<IoAlertCircleOutline />}
        title="We couldn't load blocked accounts"
        description={error}
        action={<Button variant="secondary" onClick={load}>Try again</Button>}
      />
    )
  } else if (!users.length) {
    content = (
      <EmptyState
        icon={<MdBlock />}
        title="You haven't blocked anyone"
        description="When you block someone from their profile, they'll show up here."
      />
    )
  } else {
    content = (
      <ul className="divide-y divide-line rounded-3xl border border-line">
        {users.map((blocked) => (
          <li key={blocked._id} className="flex items-center gap-3 px-4 py-3">
            <Link to={`/profile/${blocked._id}`} className="flex min-w-0 flex-1 items-center gap-3 rounded-full">
              <Avatar src={blocked.image} name={blocked.fullname} size="md" />
              <span className="truncate text-sm font-semibold text-ink hover:underline">{blocked.fullname}</span>
            </Link>
            <Button variant="secondary" size="sm" onClick={() => setPending(blocked)}>
              Unblock
            </Button>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <>
      <SettingsHeader
        title="Blocked accounts"
        description="You won't see pins from people you've blocked. Unblock someone to see their pins again."
      />
      {content}
      <ConfirmDialog
        open={Boolean(pending)}
        onClose={() => setPending(null)}
        onConfirm={unblock}
        loading={unblocking}
        tone="primary"
        confirmLabel="Unblock"
        title={pending ? `Unblock ${pending.fullname}?` : 'Unblock?'}
        description="Their pins will appear in your feed and search results again."
      />
    </>
  )
}
