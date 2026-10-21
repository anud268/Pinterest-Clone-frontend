import { Suspense } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { FiUser } from 'react-icons/fi'
import { MdBlock, MdOutlineArchive, MdOutlineKeyboard } from 'react-icons/md'
import { IoEyeOffOutline } from 'react-icons/io5'
import { PageSpinner } from '../UI/Spinner'

const ITEMS = [
  { to: '/settings', label: 'Edit profile', icon: FiUser, match: ['/settings', '/settings/profile/edit'] },
  { to: '/settings/archive', label: 'Archived pins', icon: MdOutlineArchive },
  { to: '/notinterested', label: 'Hidden pins', icon: IoEyeOffOutline },
  { to: '/settings/blockedusers', label: 'Blocked accounts', icon: MdBlock },
  { to: '/settings/shortkeys', label: 'Keyboard shortcuts', icon: MdOutlineKeyboard },
]

// Layout route for every settings screen: section nav + the active page.
export default function Settings() {
  const { pathname } = useLocation()
  const isActive = (item) => (item.match ? item.match.includes(pathname) : pathname === item.to)

  return (
    <div className="mx-auto max-w-6xl py-4 sm:py-6">
      <h1 className="mb-5 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">Settings</h1>
      <div className="flex flex-col gap-6 md:flex-row md:gap-10">
        <nav aria-label="Settings sections" className="md:w-60 md:shrink-0">
          <ul className="no-scrollbar -mx-3 flex gap-2 overflow-x-auto px-3 md:sticky md:top-20 md:mx-0 md:flex-col md:gap-1 md:overflow-visible md:px-0">
            {ITEMS.map((item) => {
              const active = isActive(item)
              const Icon = item.icon
              return (
                <li key={item.to} className="shrink-0">
                  <Link
                    to={item.to}
                    aria-current={active ? 'page' : undefined}
                    className={`flex h-10 items-center gap-3 rounded-full px-4 text-sm font-semibold whitespace-nowrap transition-colors md:h-11 md:rounded-2xl ${
                      active ? 'bg-ink text-white' : 'bg-surface text-ink hover:bg-surface-strong md:bg-transparent md:hover:bg-surface'
                    }`}
                  >
                    <Icon className="hidden text-lg md:block" aria-hidden="true" />
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
        <section className="min-w-0 flex-1 md:max-w-3xl">
          <Suspense fallback={<PageSpinner />}>
            <Outlet />
          </Suspense>
        </section>
      </div>
    </div>
  )
}
