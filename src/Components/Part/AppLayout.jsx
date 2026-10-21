import { Suspense, useEffect, useState } from 'react'
import { Outlet, useMatch } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { startChat, stopChat } from '../../chat/chatStore'
import { selectUser } from '../Redex/Slice/UserSlice'
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
  // The messenger manages its own full-height scrolling areas
  const isChat = Boolean(useMatch('/messages/*'))
  const user = useSelector(selectUser)

  // Real-time connection for unread badges and notifications; the encryption
  // engine itself only loads when Messages is opened.
  useEffect(() => {
    if (user?._id) startChat(user)
  }, [user])
  useEffect(() => () => stopChat(), [])

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
        <main
          id="main"
          tabIndex={-1}
          className={`focus:outline-none ${isChat ? 'pb-16 md:px-5 md:pt-2 md:pb-3' : 'px-3 pt-2 pb-28 sm:px-5 md:pb-12 lg:px-8'}`}
        >
          <Suspense fallback={<PageSpinner />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
      <MobileNav />
    </div>
  )
}
