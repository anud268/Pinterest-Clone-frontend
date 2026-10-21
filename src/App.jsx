import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { onUnauthorized } from './lib/api'
import { toast } from './lib/toast'
import { fetchSession, signedOut } from './Components/Redex/Slice/UserSlice'
import ProtectedRoute, { GuestRoute } from './Components/ProtectedRoute'
import AdminProtectedRoute from './Components/AdminProtectedRoute'
import AppLayout from './Components/Part/AppLayout'
import Home from './Components/Pages/Home'
import NotFound from './Components/NotFound'
import Toaster from './Components/UI/Toaster'
import { PageSpinner } from './Components/UI/Spinner'

// Route-level code splitting: the home feed loads first, other screens on demand
const Signin = lazy(() => import('./Components/Pages/Signin'))
const Signup = lazy(() => import('./Components/Pages/Signup'))
const Search = lazy(() => import('./Components/Pages/Search'))
const View = lazy(() => import('./Components/Part/View'))
const Saved = lazy(() => import('./Components/Part/Saved'))
const Create = lazy(() => import('./Components/Pages/Create'))
const Explore = lazy(() => import('./Components/Pages/Explore'))
const Profile = lazy(() => import('./Components/Pages/Profile'))
const Settings = lazy(() => import('./Components/Pages/Settings'))
const EditProfile = lazy(() => import('./Components/Part/EditProfile'))
const Archive = lazy(() => import('./Components/Part/Archive'))
const NotInterested = lazy(() => import('./Components/Part/NotInterested'))
const BlockedUsers = lazy(() => import('./Components/Part/BlockedUsers'))
const ShortKeys = lazy(() => import('./Components/Part/ShortKeys'))
const AdminLayout = lazy(() => import('./Components/AdminPanel/AdminLayout'))
const AdminPage = lazy(() => import('./Components/AdminPanel/AdminPage'))
const AdminUserlist = lazy(() => import('./Components/AdminPanel/AdminUserlist'))
const Viewpost = lazy(() => import('./Components/AdminPanel/Viewpost'))
const AdminExplore = lazy(() => import('./Components/AdminPanel/AdminExplore'))
const AdminTags = lazy(() => import('./Components/AdminPanel/AdminTags'))

// Restores the session once and handles expired sessions from any request.
function SessionManager() {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  useEffect(() => {
    dispatch(fetchSession())
  }, [dispatch])

  useEffect(() => {
    onUnauthorized((message) => {
      dispatch(signedOut())
      toast.error(message || 'Your session has expired. Please sign in again.')
      navigate('/signin', { replace: true })
    })
    return () => onUnauthorized(null)
  }, [dispatch, navigate])

  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <SessionManager />
      <Toaster />
      <Suspense fallback={<PageSpinner />}>
        <Routes>
          <Route path='/' element={<Navigate to='/home' replace />} />
          <Route path='/signup' element={<GuestRoute><Signup /></GuestRoute>} />
          <Route path='/signin' element={<GuestRoute><Signin /></GuestRoute>} />

          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path='/home' element={<Home />} />
            <Route path='/explore/:tag' element={<Home />} />
            <Route path='/explore' element={<Explore />} />
            <Route path='/search' element={<Search />} />
            <Route path='/post/:id' element={<View />} />
            <Route path='/saved' element={<Saved />} />
            <Route path='/create' element={<Create />} />
            <Route path='/profile/:id' element={<Profile />} />
            <Route element={<Settings />}>
              <Route path='/settings' element={<EditProfile />} />
              <Route path='/settings/profile/edit' element={<EditProfile />} />
              <Route path='/settings/archive' element={<Archive />} />
              <Route path='/notinterested' element={<NotInterested />} />
              <Route path='/settings/blockedusers' element={<BlockedUsers />} />
              <Route path='/settings/shortkeys' element={<ShortKeys />} />
            </Route>
          </Route>

          <Route element={<AdminProtectedRoute><AdminLayout /></AdminProtectedRoute>}>
            <Route path='/admin' element={<AdminPage />} />
            <Route path='/admin/userlist' element={<AdminUserlist />} />
            <Route path='/admin/explore' element={<AdminExplore />} />
            <Route path='/admin/post' element={<Viewpost />} />
            <Route path='/admin/tags' element={<AdminTags />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
