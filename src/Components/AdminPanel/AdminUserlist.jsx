import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { IoAlertCircleOutline, IoSearch } from 'react-icons/io5'
import { FiUsers } from 'react-icons/fi'
import { api, errorMessage } from '../../lib/api'
import { useDebouncedValue, useDocumentTitle } from '../../lib/hooks'
import { toast } from '../../lib/toast'
import Avatar from '../UI/Avatar'
import Button from '../UI/Button'
import { ConfirmDialog } from '../UI/Dialog'
import EmptyState from '../UI/EmptyState'
import { AdminHeader, StatChip } from './AdminLayout'

const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : '—')

const StatusBadge = ({ blocked }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
      blocked ? 'bg-brand-50 text-brand-700' : 'bg-emerald-50 text-emerald-800'
    }`}
  >
    <span className={`size-1.5 rounded-full ${blocked ? 'bg-danger' : 'bg-success'}`} aria-hidden="true" />
    {blocked ? 'Blocked' : 'Active'}
  </span>
)

export default function AdminUserlist() {
  useDocumentTitle('Admin · Users')
  const [users, setUsers] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [target, setTarget] = useState(null)
  const [saving, setSaving] = useState(false)
  const query = useDebouncedValue(search.trim().toLowerCase(), 150)

  const load = useCallback(async (signal) => {
    setStatus('loading')
    try {
      const { data } = await api.get('/userlist', { signal })
      setUsers(data.users)
      setStatus('ready')
    } catch (err) {
      if (signal?.aborted) return
      setError(errorMessage(err))
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal)
    return () => controller.abort()
  }, [load])

  const filtered = useMemo(
    () =>
      query
        ? users.filter((u) => u.fullname?.toLowerCase().includes(query) || u.email?.toLowerCase().includes(query))
        : users,
    [users, query],
  )
  const blockedCount = users.filter((u) => u.adminblock).length

  const toggleBlock = async () => {
    setSaving(true)
    try {
      const { data } = await api.post('/adminblock', { id: target._id })
      setUsers((list) => list.map((u) => (u._id === target._id ? { ...u, adminblock: data.blocked } : u)))
      toast.success(data.message)
      setTarget(null)
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const blockButton = (user) => (
    <Button size="sm" variant={user.adminblock ? 'secondary' : 'outline'} onClick={() => setTarget(user)}>
      {user.adminblock ? 'Unblock' : 'Block'}
    </Button>
  )

  return (
    <>
      <AdminHeader title="Users" description="Block accounts that break the rules. Blocked users can browse but can't post or save.">
        {status === 'ready' && (
          <div className="flex flex-wrap gap-2">
            <StatChip label="active" value={users.length - blockedCount} tone="success" />
            <StatChip label="blocked" value={blockedCount} tone="danger" />
            <StatChip label="total" value={users.length} />
          </div>
        )}
      </AdminHeader>

      <div className="mb-5 max-w-md">
        <label htmlFor="user-search" className="sr-only">
          Search users
        </label>
        <div className="flex h-11 items-center rounded-full bg-surface pl-4 focus-within:ring-2 focus-within:ring-ink/15">
          <IoSearch className="text-ink-subtle" aria-hidden="true" />
          <input
            id="user-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email"
            className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm focus:outline-none"
          />
        </div>
      </div>

      {status === 'loading' && (
        <div className="space-y-2" aria-busy="true" aria-label="Loading users">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="skeleton h-16 rounded-2xl" />
          ))}
        </div>
      )}

      {status === 'error' && (
        <EmptyState
          icon={<IoAlertCircleOutline />}
          title="We couldn't load users"
          description={error}
          action={<Button variant="secondary" onClick={() => load()}>Try again</Button>}
        />
      )}

      {status === 'ready' && filtered.length === 0 && (
        <EmptyState
          icon={<FiUsers />}
          title={query ? 'No users match your search' : 'No users yet'}
          action={query && <Button variant="secondary" onClick={() => setSearch('')}>Clear search</Button>}
        />
      )}

      {status === 'ready' && filtered.length > 0 && (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-2xl border border-line md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface text-xs font-bold tracking-wide text-ink-muted uppercase">
                <tr>
                  <th scope="col" className="px-4 py-3">User</th>
                  <th scope="col" className="px-4 py-3">Email</th>
                  <th scope="col" className="px-4 py-3">Joined</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                  <th scope="col" className="px-4 py-3 text-right"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((user) => (
                  <tr key={user._id} className="hover:bg-surface/50">
                    <th scope="row" className="px-4 py-3 font-semibold">
                      <Link to={`/profile/${user._id}`} className="flex items-center gap-3 hover:underline">
                        <Avatar name={user.fullname} size="sm" />
                        <span className="truncate">{user.fullname}</span>
                      </Link>
                    </th>
                    <td className="max-w-64 truncate px-4 py-3 text-ink-muted">{user.email}</td>
                    <td className="px-4 py-3 text-ink-muted">{formatDate(user.createdAt)}</td>
                    <td className="px-4 py-3"><StatusBadge blocked={user.adminblock} /></td>
                    <td className="px-4 py-3 text-right">{blockButton(user)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="space-y-2 md:hidden">
            {filtered.map((user) => (
              <li key={user._id} className="flex items-center gap-3 rounded-2xl border border-line p-3">
                <Avatar name={user.fullname} size="md" />
                <div className="min-w-0 flex-1">
                  <Link to={`/profile/${user._id}`} className="block truncate font-semibold hover:underline">
                    {user.fullname}
                  </Link>
                  <p className="truncate text-xs text-ink-muted">{user.email}</p>
                  <div className="mt-1.5"><StatusBadge blocked={user.adminblock} /></div>
                </div>
                {blockButton(user)}
              </li>
            ))}
          </ul>

          <p className="mt-4 text-center text-xs text-ink-subtle">
            Showing {filtered.length} of {users.length} users
          </p>
        </>
      )}

      <ConfirmDialog
        open={Boolean(target)}
        onClose={() => setTarget(null)}
        onConfirm={toggleBlock}
        loading={saving}
        tone={target?.adminblock ? 'primary' : 'danger'}
        title={target?.adminblock ? `Unblock ${target?.fullname}?` : `Block ${target?.fullname}?`}
        description={
          target?.adminblock
            ? 'They will be able to post, save and interact again, and their pins will reappear.'
            : 'Their pins will be hidden and they will no longer be able to post or save.'
        }
        confirmLabel={target?.adminblock ? 'Unblock' : 'Block'}
      />
    </>
  )
}
