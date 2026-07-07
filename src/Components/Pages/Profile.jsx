import React, { useEffect, useRef, useState } from 'react'
import Navbar from '../Part/Navbar'
import Sidebar from '../Part/Sidebar'
import { useDispatch, useSelector } from 'react-redux'
import axios from 'axios'
import { CiCamera } from 'react-icons/ci'
import MyPosts from '../Part/MyPosts'
import Saved from '../Part/Saved'
import { showSidebar } from '../Redex/Slice/navbarSlice'
import { useNavigate, useParams } from 'react-router-dom'
import { IoIosWarning } from 'react-icons/io'
import Scrollbar from 'react-scrollbars-custom'

export default function Profile() {
  const user = useSelector((state) => state.user)
  const refImage = useRef()
  const [profileData, setProfileData] = useState(null)
  const [loading, setLoading] = useState(true) // skeleton state
  const [pageSelect, setPageSelect] = useState('post')
  const [defaultImage] = useState("public/assets/a4121c3d85669215955a4723cd8ca.jpg")
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { id } = useParams()
  const [userblock, setUserblock] = useState(false)
  const [savedCount, setSavedCount] = useState(0)
  const [savedPreviews, setSavedPreviews] = useState([])

  const selectImageRef = () => {
    refImage.current.click()
  }

  const handleImageChange = async (e) => {
    try {
      const pic = e.target.files[0]
      const formImage = new FormData()
      formImage.append('image', pic)
      formImage.append('userId', user._id)

      await axios.post('http://localhost:3500/profilepic', formImage)
      getProfileData()
    } catch (error) {
      console.log(error)
    }
  }

  const getProfileData = async () => {
    try {
      setLoading(true)
      const { data } = await axios.get(`http://localhost:3500/userprofile/${id}`)
      setProfileData(data)
      setLoading(false)
    } catch (error) {
      console.log(error)
      setLoading(false)
    }
  }

  const isBlock = async () => {
    try {
      const { data } = await axios.get("http://localhost:3500/isblock", {
        params: { userId: id, blockUserId: user._id }
      })
      setUserblock(data.success)
    } catch (error) {
      console.log(error)
    }
  }

  const getSavedIdeas = async () => {
    try {
      const { data } = await axios.get(`http://localhost:3500/saved/${id}`)
      setSavedCount(data.length)
      setSavedPreviews(data.slice(0, 3))
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    if (user && user._id) {
      isBlock()
      getProfileData()
      getSavedIdeas()
    }
  }, [user, id])

  const userBlock = async (blockId) => {
    try {
      const { data } = await axios.post('http://localhost:3500/userblock', { id: blockId, userId: user._id })
      setUserblock(data.success)
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <Scrollbar style={{ width: "100vw", height: '100vh' }}>
      <div className='w-full min-h-screen bg-gray-50/50' onClick={(e) => { e.stopPropagation(); dispatch(showSidebar(false)) }}>
        <div className='flex fixed z-25 top-0'>
          <Sidebar section='profile' />
        </div>

        <div className='w-full h-full font-sans overflow-visible pl-16 sm:pl-20 pr-4 sm:pr-8 py-8'>
          {/* Header Card Grid */}
          <div className="max-w-6xl mx-auto mb-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-gradient-to-r from-neutral-200 via-gray-200 to-neutral-100 p-8 rounded-3xl shadow-sm border border-neutral-300/40">

              {/* Left Side: Profile Info */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-neutral-800">
                {/* Avatar container */}
                <div className='relative flex-shrink-0'>
                  {loading ? (
                    <div className="w-32 h-32 rounded-full bg-neutral-300 animate-pulse" />
                  ) : (
                    <>
                      {id === user._id &&
                        <form className='absolute right-1 bottom-1 z-10'>
                          <input type="file" name="image" ref={refImage} onChange={handleImageChange} className='hidden' />
                          <div
                            type="button"
                            onClick={selectImageRef}
                            className="p-2 bg-stone-900/80 hover:bg-stone-950 text-white rounded-full cursor-pointer shadow-lg transition-transform hover:scale-105 border-0"
                          >
                            <CiCamera size={20} />
                          </div>
                        </form>
                      }
                      <img
                        src={profileData?.image || defaultImage}
                        alt="Profile Avatar"
                        className='w-32 h-32 rounded-full border-4 border-white shadow-md object-cover'
                      />
                    </>
                  )}
                </div>

                {/* Profile Details */}
                <div className="flex-1 text-center sm:text-left">
                  {loading ? (
                    <div className="flex flex-col gap-2">
                      <div className="h-6 w-48 bg-neutral-300 animate-pulse rounded"></div>
                      <div className="h-4 w-32 bg-neutral-300 animate-pulse rounded"></div>
                      <div className="h-4 w-40 bg-neutral-300 animate-pulse rounded"></div>
                    </div>
                  ) : (
                    <>
                      <h1 className="text-3xl font-bold text-neutral-900 tracking-tight leading-none capitalize">
                        {profileData?.firstname || ''} {profileData?.lastname || ''}
                      </h1>

                      {profileData?.bio &&
                        <p className="text-neutral-600 text-sm mt-3 font-medium max-w-sm italic">
                          "{profileData?.bio}"
                        </p>
                      }

                      <div className="text-neutral-500 text-xs mt-4 flex flex-wrap justify-center sm:justify-start gap-2">
                        {profileData?.country &&
                          <span className="bg-white/60 border border-neutral-300/40 px-3 py-1 rounded-full font-semibold">
                            {profileData.country}
                          </span>
                        }
                        {profileData?.state &&
                          <span className="bg-white/60 border border-neutral-300/40 px-3 py-1 rounded-full font-semibold">
                            {profileData.state}
                          </span>
                        }
                      </div>

                      <div className="mt-6">
                        {id === user._id ?
                          <button
                            onClick={() => navigate('/settings/profile/edit')}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-6 rounded-full text-sm shadow-sm transition-all duration-200 hover:shadow-md cursor-pointer border-0"
                          >
                            Set Profile
                          </button>
                          :
                          !userblock ?
                            <button
                              onClick={() => userBlock(id)}
                              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-6 rounded-full text-sm shadow-sm transition-all cursor-pointer border-0"
                            >
                              Block
                            </button>
                            :
                            <button
                              onClick={() => userBlock(id)}
                              className="bg-neutral-600 hover:bg-neutral-700 text-white font-semibold py-2.5 px-6 rounded-full text-sm shadow-sm transition-all cursor-pointer border-0"
                            >
                              Unblock
                            </button>
                        }
                      </div>
                    </>
                  )}
                </div>
              </div>

              {id === user._id &&
                <>
                  {/* Right Side: Saved Ideas Card */}
                  <div className="h-full flex items-stretch">
                    <div
                      onClick={() => setPageSelect('save')}
                      className="w-full flex flex-col justify-between bg-white/50 hover:bg-white/80 border border-white/40 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group"
                    >
                      <div>
                        <h3 className="text-lg font-bold text-neutral-900 group-hover:text-blue-600 transition-colors">
                          Your saved ideas
                        </h3>
                        <p className="text-xs text-neutral-500 mt-1">
                          Ideas you've saved to explore later. Click to view all.
                        </p>
                      </div>

                      <div className="mt-6 flex items-center justify-between">
                        {savedCount > 0 ? (
                          <div className="flex items-center gap-4">
                            {/* Overlapping thumbnail collage */}
                            <div className="flex -space-x-3">
                              {savedPreviews.map((post) => (
                                <img
                                  key={post._id}
                                  src={post.postImage}
                                  alt="Saved preview"
                                  className="w-12 h-12 rounded-xl border-2 border-white object-cover shadow-sm group-hover:-translate-y-1 transition-transform duration-300"
                                />
                              ))}
                            </div>
                            <div>
                              <span className="text-sm font-semibold text-neutral-800">
                                {savedCount} {savedCount === 1 ? 'Idea' : 'Ideas'}
                              </span>
                              <span className="block text-[10px] text-neutral-400 font-medium uppercase tracking-wider">Saved</span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-4 w-full">
                            <p className="text-sm text-neutral-400 font-semibold">No saved ideas yet</p>
                            <p className="text-[11px] text-neutral-400">Pins you save will show up here.</p>
                          </div>
                        )}

                        {savedCount > 0 && (
                          <span className="text-xs font-bold text-blue-600 group-hover:underline flex items-center gap-1 transition-colors">
                            View All →
                          </span>
                        )}
                      </div>

                    </div>
                  </div>
                </>
              }
            </div>
          </div>

          {/* Tabs Section */}
          <div className="max-w-6xl mx-auto border-t border-neutral-200 pt-6">
            {id === user._id ?
              <div className="flex justify-center gap-4 mb-8">
                {['post', 'save'].map((tab) => (
                  <button
                    key={tab}
                    className={`font-semibold text-sm px-6 py-2.5 rounded-full shadow-sm hover:shadow transition-all cursor-pointer border-0 ${pageSelect === tab
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-neutral-700 hover:bg-neutral-50 border border-neutral-300/60'
                      }`}
                    onClick={() => setPageSelect(tab)}
                  >
                    {tab === 'post' ? 'Posts' : 'Saved Ideas'}
                  </button>
                ))}
              </div>
              :
              <div className="flex justify-center mb-8">
                <span className="bg-blue-600 text-white font-semibold text-sm px-6 py-2.5 rounded-full shadow-sm">
                  Posts
                </span>
              </div>
            }

            {/* Content Display */}
            <div className="w-full">
              {!userblock ? (
                pageSelect === 'post' ? <MyPosts id={id} /> : (pageSelect === 'save' && <Saved />)
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-neutral-400">
                  <IoIosWarning size={56} className="text-neutral-300 mb-3" />
                  <h2 className="text-lg font-bold">User blocked</h2>
                  <p className="text-sm">You have blocked this profile.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </Scrollbar >
  );
}
