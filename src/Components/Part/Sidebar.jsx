import { NavLink } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { TbLayoutSidebarLeftCollapse, TbLayoutSidebarLeftExpand } from 'react-icons/tb'
import { selectUser } from '../Redex/Slice/UserSlice'
import Avatar from '../UI/Avatar'
import AccountMenu from './AccountMenu'
import Logo from './Logo'
import useNavItems from './useNavItems'

// Desktop navigation rail; collapses to icons only.
export default function Sidebar({ collapsed, onToggle }) {
  const user = useSelector(selectUser)
  const items = useNavItems()

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-line bg-white transition-[width] duration-200 md:flex ${
        collapsed ? 'w-[76px]' : 'w-60'
      }`}
      aria-label="Main navigation"
    >
      <div className={`flex h-16 items-center ${collapsed ? 'justify-center' : 'px-5'}`}>
        <Logo showName={!collapsed} />
      </div>

      <nav className="no-scrollbar flex-1 overflow-y-auto px-3 py-2">
        <ul className="flex flex-col gap-1">
          {items.map((item) => {
            const Icon = item.active ? item.activeIcon : item.icon
            return (
              <li key={item.label}>
                <NavLink
                  to={item.to}
                  title={collapsed ? item.label : undefined}
                  aria-current={item.active ? 'page' : undefined}
                  className={`flex h-12 items-center gap-4 rounded-2xl text-[15px] font-semibold transition-colors ${
                    collapsed ? 'justify-center' : 'px-4'
                  } ${item.active ? 'bg-ink text-white' : 'text-ink hover:bg-surface'}`}
                >
                  {item.avatar ? (
                    <Avatar src={user?.image} name={user?.fullname} size="xs" className={item.active ? 'ring-2 ring-white' : ''} />
                  ) : (
                    <Icon className="text-[22px]" aria-hidden="true" />
                  )}
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="flex flex-col gap-1 border-t border-line p-3">
        <AccountMenu placement="top" align="left" compact={collapsed} />
        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={`flex h-10 items-center gap-4 rounded-2xl text-sm font-semibold text-ink-muted hover:bg-surface hover:text-ink cursor-pointer ${
            collapsed ? 'justify-center' : 'px-4'
          }`}
        >
          {collapsed ? <TbLayoutSidebarLeftExpand className="text-xl" /> : <TbLayoutSidebarLeftCollapse className="text-xl" />}
          {!collapsed && 'Collapse'}
        </button>
      </div>
    </aside>
  )
}

// Bottom tab bar for phones.
export function MobileNav() {
  const user = useSelector(selectUser)
  const items = useNavItems().filter((item) => !item.desktopOnly)

  return (
    <nav
      aria-label="Main navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="mx-auto flex h-16 max-w-lg items-center justify-around px-2">
        {items.map((item) => {
          const Icon = item.active ? item.activeIcon : item.icon
          return (
            <li key={item.label}>
              <NavLink
                to={item.to}
                aria-label={item.label}
                aria-current={item.active ? 'page' : undefined}
                className={`flex size-12 flex-col items-center justify-center gap-0.5 rounded-2xl text-[10px] font-semibold ${
                  item.active ? 'text-ink' : 'text-ink-subtle'
                }`}
              >
                {item.avatar ? (
                  <Avatar src={user?.image} name={user?.fullname} size="xs" className={item.active ? 'ring-2 ring-ink' : ''} />
                ) : (
                  <Icon className="text-2xl" aria-hidden="true" />
                )}
                <span>{item.label}</span>
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
