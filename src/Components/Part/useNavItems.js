import { useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'
import { GoHome, GoHomeFill } from 'react-icons/go'
import { MdExplore, MdOutlineAdminPanelSettings, MdOutlineExplore } from 'react-icons/md'
import { FaRegSquarePlus, FaSquarePlus } from 'react-icons/fa6'
import { FaBookmark, FaRegBookmark } from 'react-icons/fa'
import { IoSettings, IoSettingsOutline } from 'react-icons/io5'
import { selectUser } from '../Redex/Slice/UserSlice'

// Main navigation entries shared by the desktop sidebar and the mobile tab bar.
export default function useNavItems() {
  const user = useSelector(selectUser)
  const { pathname } = useLocation()
  const settingsPaths = ['/settings', '/notinterested']

  return [
    { to: '/home', label: 'Home', icon: GoHome, activeIcon: GoHomeFill, active: pathname === '/home' },
    { to: '/explore', label: 'Explore', icon: MdOutlineExplore, activeIcon: MdExplore, active: pathname.startsWith('/explore') },
    { to: '/create', label: 'Create', icon: FaRegSquarePlus, activeIcon: FaSquarePlus, active: pathname === '/create' },
    { to: '/saved', label: 'Saved', icon: FaRegBookmark, activeIcon: FaBookmark, active: pathname === '/saved' },
    {
      to: `/profile/${user?._id}`,
      label: 'Profile',
      avatar: true,
      active: pathname === `/profile/${user?._id}`,
    },
    {
      to: '/settings',
      label: 'Settings',
      icon: IoSettingsOutline,
      activeIcon: IoSettings,
      active: settingsPaths.some((p) => pathname.startsWith(p)),
      desktopOnly: true,
    },
    {
      to: '/admin',
      label: 'Admin',
      icon: MdOutlineAdminPanelSettings,
      activeIcon: MdOutlineAdminPanelSettings,
      active: pathname.startsWith('/admin'),
      hidden: user?.role !== 'admin',
      desktopOnly: true,
    },
  ].filter((item) => !item.hidden)
}
