import { Suspense } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { HiOutlineArrowLeftStartOnRectangle } from 'react-icons/hi2'
import { MdOutlineDashboard, MdOutlineExplore } from 'react-icons/md'
import { FiTag, FiUsers } from 'react-icons/fi'
import Logo from '../Part/Logo'
import { PageSpinner } from '../UI/Spinner'

const useAdminNav = () => {
  const { pathname } = useLocation()
  return [
    { to: '/admin', label: 'Posts', icon: MdOutlineDashboard, active: pathname === '/admin' || pathname === '/admin/post' },
    { to: '/admin/userlist', label: 'Users', icon: FiUsers, active: pathname === '/admin/userlist' },
    { to: '/admin/explore', label: 'Explore cards', icon: MdOutlineExplore, active: pathname === '/admin/explore' },
    { to: '/admin/tags', label: 'Categories & tags', icon: FiTag, active: pathname === '/admin/tags' },
  ]
}

// Shell for admin pages: fixed sidebar on desktop, logo + scrollable tabs on mobile.
export default function AdminLayout() {
  const items = useAdminNav()

  return (
    <div className="min-h-dvh bg-white">
      <a
        href="#admin-main"
        className="sr-only z-50 rounded-full bg-ink px-4 py-2 font-semibold text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-line bg-white md:flex" aria-label="Admin navigation">
        <div className="flex h-16 items-center gap-3 px-5">
          <Logo showName />
        </div>
        <p className="px-6 pt-2 pb-2 text-xs font-bold tracking-widest text-ink-subtle uppercase">Admin</p>
        <nav className="flex-1 px-3">
          <ul className="flex flex-col gap-1">
            {items.map((item) => {
              const Icon = item.icon
              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end
                    aria-current={item.active ? 'page' : undefined}
                    className={`flex h-11 items-center gap-3 rounded-2xl px-4 text-sm font-semibold transition-colors ${
                      item.active ? 'bg-ink text-white' : 'text-ink hover:bg-surface'
                    }`}
                  >
                    <Icon className="text-lg" aria-hidden="true" />
                    {item.label}
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </nav>
        <div className="border-t border-line p-3">
          <NavLink
            to="/home"
            className="flex h-11 items-center gap-3 rounded-2xl px-4 text-sm font-semibold text-ink-muted hover:bg-surface hover:text-ink"
          >
            <HiOutlineArrowLeftStartOnRectangle className="text-lg" aria-hidden="true" />
            Back to app
          </NavLink>
        </div>
      </aside>

      <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur md:hidden">
        <div className="flex h-14 items-center justify-between px-3">
          <Logo />
          <span className="text-sm font-bold">Admin</span>
          <NavLink to="/home" className="rounded-full px-3 py-1.5 text-sm font-semibold text-ink-muted hover:bg-surface">
            Back to app
          </NavLink>
        </div>
        <nav aria-label="Admin navigation" className="no-scrollbar overflow-x-auto px-3 pb-2">
          <ul className="flex w-max gap-2">
            {items.map(({ to, label, active }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end
                  aria-current={active ? 'page' : undefined}
                  className={`inline-flex h-9 items-center rounded-full px-4 text-sm font-semibold whitespace-nowrap ${
                    active ? 'bg-ink text-white' : 'bg-surface text-ink'
                  }`}
                >
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main id="admin-main" tabIndex={-1} className="px-3 py-6 focus:outline-none sm:px-5 md:pl-[calc(15rem+2rem)] md:pr-8">
        <Suspense fallback={<PageSpinner />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  )
}

export function AdminHeader({ title, description, children }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-ink-muted">{description}</p>}
      </div>
      {children}
    </div>
  )
}

export function StatChip({ label, value, tone = 'neutral' }) {
  const tones = {
    neutral: 'bg-surface text-ink',
    danger: 'bg-brand-50 text-brand-700',
    success: 'bg-emerald-50 text-emerald-800',
    warning: 'bg-amber-50 text-amber-800',
  }
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${tones[tone]}`}>
      <span className="text-sm font-extrabold">{value}</span> {label}
    </span>
  )
}
