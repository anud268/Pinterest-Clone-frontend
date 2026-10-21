import { Suspense, useState } from 'react'
import { Outlet } from 'react-router-dom'
import KeyboardShortcuts from '../KeyboardShortcuts'
import { PageSpinner } from '../UI/Spinner'
import Navbar from './Navbar'
import Sidebar, { MobileNav } from './Sidebar'

const STORAGE_KEY = 'sidebar-collapsed'

const readCollapsed = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

// Shell for signed-in pages: sidebar (desktop), header with search, bottom tabs (mobile).
export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(readCollapsed)

  const toggle = () => {
    setCollapsed((value) => {
      try {
        localStorage.setItem(STORAGE_KEY, value ? '0' : '1')
      } catch {
        // storage unavailable (private mode): keep the in-memory value only
      }
      return !value
    })
  }

  return (
    <div className="min-h-dvh">
      <a
        href="#main"
        className="sr-only z-50 rounded-full bg-ink px-4 py-2 font-semibold text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <KeyboardShortcuts />
      <Sidebar collapsed={collapsed} onToggle={toggle} />
      <div className={`transition-[padding] duration-200 ${collapsed ? 'md:pl-[76px]' : 'md:pl-60'}`}>
        <Navbar />
        <main id="main" tabIndex={-1} className="px-3 pt-2 pb-28 focus:outline-none sm:px-5 md:pb-12 lg:px-8">
          <Suspense fallback={<PageSpinner />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
      <MobileNav />
    </div>
  )
}
