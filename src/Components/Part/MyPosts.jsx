import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { GoArrowUpRight } from 'react-icons/go'
import { FaBookmark, FaRegBookmark } from 'react-icons/fa'
import { addPost } from '../Redex/Slice/PostSlice'

export default function MyPosts({ id }) {
  const dispatch = useDispatch()
  const user = useSelector((state) => state.user)
  const [myPosts, setMyPosts] = useState([])
  const [loading, setLoading] = useState(true) // ✅ loading state

  const fetchMyPosts = async () => {
    try {
      const userId = id
      const { data } = await axios.get(`http://localhost:3500/myposts/${userId}`)
      console.log('response of fetch my posts:', data)
      setMyPosts(data)
      setLoading(false) // ✅ stop loading after fetch
    } catch (error) {
      console.log(error)
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMyPosts()
  }, [])

  const savingPost = async (postId, userId) => {
  // Update UI instantly
  setMyPosts((prevPosts) =>
    prevPosts.map((post) => {
      if (post._id === postId) {
        let updatedSaved = [...post.saved];
        if (updatedSaved.includes(userId)) {
          updatedSaved = updatedSaved.filter((id) => id !== userId);
        } else {
          updatedSaved.push(userId);
        }
        return { ...post, saved: updatedSaved };
      }
      return post;
    })
  );

  // Then sync with backend
  try {
    await axios.post("http://localhost:3500/save", { postId, userId });
  } catch (error) {
    console.log("post not saved on server");
  }
};




  // ✅ Skeleton Card Component
  const SkeletonCard = () => (
    <div className="break-inside-avoid mb-4 rounded-xl overflow-hidden shadow-sm bg-gray-200 animate-pulse">
      <div className="w-full h-60 bg-gray-300"></div>
    </div>
  )

  return (
    <div>

      <div className="p-2 align-center h-full">
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
          {/* ✅ Skeleton while loading */}
          {loading ? (
            Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)
          ) : myPosts.length > 0 ? (
            myPosts.map((post) => {
              return (
                <div
                  key={post._id}
                  className="break-inside-avoid mb-4 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group"
                >
                  <div className="relative">
                    <Link to={`/post/${post._id}`} state={{ interest: true }}>
                    <img
                      src={post.postImage}
                      alt=""
                      className="w-full object-cover transition duration-300 group-hover:brightness-80"
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


                    {/* <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        className="!bg-red-500 !hover:bg-red-600 text-white !font-medium px-4 py-2 !rounded-full text-sm transition-colors duration-200 z-50"
                        onClick={(e) => {
                          e.stopPropagation()
                          savingPost(post._id, user._id)
                        }}
                      >
                        <p>{post.saved?.includes(user._id) ? 'Saved' : 'Save'}</p>
                      </button>
                    </div> */}
                  </div>

                  


                </div>
              )
            })
          ) : (
            <div className="">
              <h1 className="text-gray-500 font-bold flex justify-center">No Posts!</h1>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
