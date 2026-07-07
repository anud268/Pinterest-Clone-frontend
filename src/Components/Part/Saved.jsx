import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useLocation } from 'react-router-dom'
import Modal from './Modal'
import { addModal } from '../Redex/Slice/modalSlice'
import { GoArrowUpRight } from 'react-icons/go'
import { FaBookmark, FaRegBookmark } from 'react-icons/fa'

export default function Saved({postId}) {
  // const location = useLocation()
  // const postId = location.state._id
  const dispatch = useDispatch()
  const user = useSelector((state)=>state.user)
  const modal = useSelector((state)=>state.modal)
  const userId = user._id
  const [saved,setSaved] = useState([])
  const [modalPost, setModalPost] = useState([])
  const [own,setOwn] = useState(false)

  

  const fetchSavedPosts = async()=>{
    try {
      const {data} = await axios.get(`http://localhost:3500/saved/${userId}`)
      console.log('fetch saved posts:',data);
      setSaved(data)
    } catch (error) {
     console.log(error);
    }
  }
  useEffect(()=>{
    fetchSavedPosts()
  },[])
  

  const savingPost = async (postId, userId) => {
    // Update UI instantly
    setSaved((prevPosts) =>
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

  return (
    <div className=''>

            <div className='  p-2 align-center h-full '>
            <div className=" columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 2xl:columns-6 gap-4 space-y-4">
    {saved.length>0?saved.map((post)=>{
      return(
            <div key={post._id} 
              className="break-inside-avoid mb-4 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group"
            >
              <div className='relative'>
              <Link to={`/post/${post._id}`} state={{ interest: true }}>
                <img src={post.postImage} alt="" className="w-full object-cover transition duration-300 group-hover:brightness-80" />
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
          )
        }): <div className=''>
              <h1 className='text-gray-500 font-bold  flex justify-center'>No Posts!</h1> 
              </div>}
          </div>
          </div>
    </div>
    
  )
}
