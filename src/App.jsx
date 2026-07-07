import React from 'react'
import Signup from './Components/Pages/Signup'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Signin from './Components/Pages/Signin'
import Home from './Components/Pages/Home'
import Create from './Components/Pages/Create'
import Explore from './Components/Pages/Explore'
import Profile from './Components/Pages/Profile'
import Saved from './Components/Part/Saved'
import Settings from './Components/Pages/Settings'
import EditProfile from './Components/Part/EditProfile'
import Archive from './Components/Part/Archive'
import AdminPage from './Components/AdminPanel/AdminPage'
import AdminUserlist from './Components/AdminPanel/AdminUserlist'
import Viewpost from './Components/AdminPanel/Viewpost'
import AdminExplore from './Components/AdminPanel/AdminExplore'
import AdminTags from './Components/AdminPanel/AdminTags'
import View from './Components/Part/view'
import NotInterested from './Components/Part/NotInterested'
import BlockedUsers from './Components/Part/BlockedUsers'
import KeyboardShortcuts from './Components/KeyboardShortcuts'
import NotFound from './Components/NotFound'
import AdminProtectedRoute from './Components/AdminProtectedRoute'
import ShortKeys from './Components/Part/ShortKeys'

export default function App() {
  return (
    <BrowserRouter>
      <KeyboardShortcuts />
      <Routes>
        <Route path='/signup' element={<Signup />} />
        <Route path='/signin' element={<Signin />} />
        <Route path='/home' element={<Home />} />
        <Route path='/explore/:tag' element={<Home />} />
        <Route path='/post/:id' element={<View />} />
        <Route path='/saved' element={<Saved />} />
        <Route path='/notinterested' element={<NotInterested />} />
        <Route path='/create' element={<Create />} />
        <Route path='/explore' element={<Explore />} />
        {/* <Route path='/explore/post' element={<ExplorePosts/>} /> */}
        <Route path='/profile/:id' element={<Profile />} />
        {/* <Route path='/settings' element={<Settings/>} /> */}
        <Route path='/settings/archive' element={<Archive />} />
        <Route path='/settings/blockedusers' element={<BlockedUsers />} />
        <Route path='/settings/profile/edit' element={<EditProfile />} />
        <Route path='/settings/shortkeys' element={<ShortKeys />} />
        <Route path='/settings' element={<EditProfile />} />

        <Route path='/admin' element={<AdminProtectedRoute><AdminPage /></AdminProtectedRoute>} />
        <Route path='/admin/userlist' element={<AdminProtectedRoute><AdminUserlist /></AdminProtectedRoute>} />
        <Route path='/admin/explore' element={<AdminProtectedRoute><AdminExplore /></AdminProtectedRoute>} />
        <Route path='/admin/post' element={<AdminProtectedRoute><Viewpost /></AdminProtectedRoute>} />
        <Route path='/admin/tags' element={<AdminProtectedRoute><AdminTags /></AdminProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
