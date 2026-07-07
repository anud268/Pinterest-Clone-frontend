import axios from 'axios'
import Navbar from '../Part/Navbar'
import Sidebar from '../Part/Sidebar'
import { useDispatch, useSelector } from 'react-redux'
import { addPost } from '../Redex/Slice/PostSlice'
import { useEffect, useState } from 'react'
import { MdNotInterested, MdOutlineArchive, MdOutlineReport } from 'react-icons/md'
import { GoArrowUpRight } from 'react-icons/go'
import { FaBookmark, FaRegBookmark } from 'react-icons/fa'
import { showSidebar } from '../Redex/Slice/navbarSlice'
import { IoDownloadOutline } from 'react-icons/io5'
import { FiShare2 } from 'react-icons/fi'
import { SlOptionsVertical } from 'react-icons/sl'
import { Link, useLocation, useParams } from 'react-router-dom'
import Scrollbar from 'react-scrollbars-custom'

// 🔹 Skeleton component
const PostSkeleton = () => {
  // random height between 150–350px
  const randomHeight = Math.floor(Math.random() * (450 - 150 + 1)) + 150;

  return (
    <div className=' '>
    <div className="break-inside-avoid  rounded-xl shadow-sm bg-gray-200 animate-pulse">
      <div
        className="w-full bg-gray-300 rounded-xl"
        style={{ height: `${randomHeight}px` }}
      ></div>
    </div>
    </div>
  );
};



export default function Home() {
  const dispatch = useDispatch()
  const [showOption, setShowOption] = useState(false)
  const [options, setOptions] = useState(['Download', 'Share', 'Not Interested', 'Report', 'Archive'])
  const [loading, setLoading] = useState(true) // 🔹 loading state
  const posts = useSelector((state) => state.post)
  const user = useSelector((state) => state.user)
  const params = useParams()

  // Fetch posts
  const fetchPosts = async () => {
    try {
      setLoading(true)
      const { data } = await axios.get(`http://localhost:3500/posts/${user._id}`)
      dispatch(addPost(data)); 

    } catch (error) {
      console.log(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!user || !user._id) return
    if (!params?.tag) {
      fetchPosts();
    } else {
      fetchTagsFromCard(params.tag)
    }
  }, [user, params?.tag])

  const fetchTagsFromCard = async (cat) => {
    try {
      setLoading(true)
      const { data } = await axios.post('http://localhost:3500/fetchtagsfromcard', { cat })
      dispatch(addPost(data))
    } catch (error) {
      console.log(error)
    } finally {
      setLoading(false)
    }
  }

  // Save/Unsave post
  const savingPost = async (postId, userId) => {
    dispatch(
      addPost(
        posts.map((post) => {
          if (post._id === postId) {
            let updatedSaved = [...post.saved]
            if (updatedSaved.includes(userId)) {
              updatedSaved = updatedSaved.filter((id) => id !== userId)
            } else {
              updatedSaved.push(userId)
            }
            return { ...post, saved: updatedSaved }
          }
          return post
        })
      )
    )
    try {
      await axios.post('http://localhost:3500/save', { postId, userId })
    } catch (error) {
      console.log('post not saved on server')
    }
  }

  // const ownPost = async (userId) => {
  //   setOwn(userId === user._id)
  // }

  const archivePost = async (postId) => {
    try {
      const userId = user._id
      await axios.post('http://localhost:3500/archive', { postId, userId })
      setShowOption(false)
      dispatch(addPost(posts.filter((post) => postId !== post._id)))
    } catch (error) {
      console.log('post not archived')
    }
  }

  const notInterestedPost = async (postId) => {
    try {
      const userId = user._id
      const { data } = await axios.post('http://localhost:3500/notinterested', { userId, postId })
      dispatch(addPost(posts.filter((p) => p._id !== postId)))
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <Scrollbar style={{ width: "100vw", height: '100vh',  }}>
    <div onClick={(e) => { e.stopPropagation(); dispatch(showSidebar(false)) }}>
      

      <div className='flex fixed z-25 top-0'>
        <Navbar />
      </div>
      <div className='flex fixed z-26 top-0'>
        <Sidebar section='home' />
      </div>

      <div className='mt-18 p-2 align-center h-full'>
        
          
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 2xl:columns-6 gap-4 space-y-4">
          {loading
            ? Array.from({ length: 12  }).map((_, i) => <PostSkeleton key={i} />) // 🔹 show skeletons
            : posts?.map((post, i) => (
              <div
                key={i}
                className="break-inside-avoid mb-4 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group"
              >
                {/* Options Button */}
                <div onMouseLeave={() => { setShowOption(false) }} className="absolute z-20 m-2 flex opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    className={`!bg-white text-black !font-extrabold !p-2 ${user.adminblock && 'opacity-50 cursor-not-allowed pointer-events-none'}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowOption(!showOption)
                    }}
                    title='Options'
                  >
                    <SlOptionsVertical />
                  </button>

                  {showOption && (
                    <div className='bg-white rounded-2xl text-black overflow-auto h-fit font-semibold py-2 w-40 ml-8 absolute shadow-lg !z-50'>
                      {options.map((option, idx) => (
                        <div key={idx}>
                          <p className='pl-2 hover:bg-indigo-100'>
                            {option === 'Download' && <a href={post.postImage}><p className='flex place-items-center gap-2 text-black'><IoDownloadOutline />Download</p></a>}
                            {post.userId._id === user._id ? (
                              option === 'Archive' &&
                              <p className='flex place-items-center gap-2' onClick={() => { archivePost(post._id) }}><MdOutlineArchive />Archive</p>
                            ) : (
                              <>
                                {option === 'Not Interested' && <p onClick={() => { notInterestedPost(post._id) }} className='flex place-items-center gap-2'><MdNotInterested />Not Interested</p>}
                                {option === 'Report' && <p className='flex place-items-center gap-2'><MdOutlineReport />Report</p>}
                              </>
                            )}
                          </p>
                        </div>
                      ))}
                      <p
                        onClick={() => {
                          const shareText = `Check out this post: ${post.postTitle}\n\n${post.postDescription}\n\n${window.location.origin}/post/${post._id}`
                          const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`
                          window.open(url, "_blank")
                        }}
                        className="flex place-items-center gap-2 pl-2 hover:bg-indigo-100"
                      >
                        <FiShare2 />  Share to WhatsApp
                      </p>
                    </div>
                  )}
                </div>

                {/* Post Image */}
                <div className="relative">
                  <Link to={`/post/${post._id}`} state={{ interest: true }}>
                    <img
                      src={post.postImage}
                      alt={post.postTitle}
                      className="w-full object-cover transition duration-300 group-hover:brightness-80"
                      loading="lazy"
                    />
                  </Link>

                  {/* URL Button */}
                  {post.url && (
                    <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button className={`!bg-white text-black !p-2 ${user.adminblock && 'opacity-50 cursor-not-allowed pointer-events-none'}`}>
                        <a href={post.url} className='!visited:text-black'>
                          <div className='flex text-black'><GoArrowUpRight className='m-1' /> Visit Site</div>
                        </a>
                      </button>
                    </div>
                  )}

                  {/* Save Button */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      className={`!bg-white hover:!bg-gray-200 shadow text-black !font-medium !px-2 !py-2 !rounded-full text-sm transition-colors duration-200 ${user.adminblock && 'opacity-50 cursor-not-allowed pointer-events-none'}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        savingPost(post._id, user._id)
                      }}
                    >
                      {post.saved.includes(user._id) ? <FaBookmark title='Saved' /> : <FaRegBookmark title='Save' />}
                    </button>
                  </div>
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
    </Scrollbar>
  )
}
