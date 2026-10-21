import { useSelector } from 'react-redux'
import { FiLogOut, FiUser } from 'react-icons/fi'
import { IoSettingsOutline } from 'react-icons/io5'
import { MdOutlineAdminPanelSettings, MdOutlineKeyboard } from 'react-icons/md'
import { HiChevronUpDown } from 'react-icons/hi2'
import { selectUser } from '../Redex/Slice/UserSlice'
import Avatar from '../UI/Avatar'
import Menu from '../UI/Menu'
import useSignOut from './useSignOut'

// Avatar button with profile, settings and sign-out actions.
export default function AccountMenu({ compact = false, placement = 'bottom', align = 'right', avatarOnly = false }) {
  const user = useSelector(selectUser)
  const signOut = useSignOut()
  if (!user) return null

  return (
    <Menu
      placement={placement}
      align={align}
      items={[
        { label: 'Your profile', icon: <FiUser />, to: `/profile/${user._id}` },
        { label: 'Settings', icon: <IoSettingsOutline />, to: '/settings' },
        { label: 'Keyboard shortcuts', icon: <MdOutlineKeyboard />, to: '/settings/shortkeys' },
        { label: 'Admin panel', icon: <MdOutlineAdminPanelSettings />, to: '/admin', hidden: user.role !== 'admin' },
        'divider',
        { label: 'Sign out', icon: <FiLogOut />, onSelect: signOut },
      ]}
      trigger={(props) =>
        avatarOnly ? (
          <button type="button" aria-label="Account menu" className="rounded-full cursor-pointer" {...props}>
            <Avatar src={user.image} name={user.fullname} size="sm" />
          </button>
        ) : (
          <button
            type="button"
            aria-label="Account menu"
            className={`flex h-14 w-full items-center gap-3 rounded-2xl text-left hover:bg-surface cursor-pointer ${compact ? 'justify-center' : 'px-3'}`}
            {...props}
          >
            <Avatar src={user.image} name={user.fullname} size="sm" />
            {!compact && (
              <>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold">{user.fullname}</span>
                  <span className="block truncate text-xs text-ink-subtle">{user.email}</span>
                </span>
                <HiChevronUpDown className="text-ink-subtle" aria-hidden="true" />
              </>
            )}
          </button>
        )
      }
    />
  )
}
