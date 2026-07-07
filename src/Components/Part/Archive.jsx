import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { FiMinimize } from 'react-icons/fi'
import { MdDelete, MdEdit, MdUnarchive } from 'react-icons/md'
import { useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import Settings from '../Pages/Settings'
import Scrollbar from 'react-scrollbars-custom'

export default function Archive() {
    const user = useSelector((state)=>state.user)
    const [fullScreen,setFullScreen] = useState(false)
    const [archivePost,setArchivePost] = useState([])
    const [modalPost,setModalPost] = useState([])
    const [conform, setConform] = useState(false)
    const [deleteConform, setDeleteConform] = useState(false)
    const [postId,setPostId] = useState('')
    const navigate = useNavigate()

    const fetchArchive =async()=>{
        try {
            const userId = user._id 
            const {data} = await axios.get(`http://localhost:3500/archived/${userId}`)
            console.log('fetch archive posts:',data);
            setArchivePost(data)
        } catch (error) {
            console.log(error);
        }
    }
    useEffect(() => {
        if (user && user._id) {
            fetchArchive();
        }
    }, [user]); 
    const unArchive =async(postId)=>{
        try {
            const userId = user._id
            const {data} = await axios.post('http://localhost:3500/unarchive',{postId,userId})
            console.log('unarchive :',data);
            setArchivePost(archivePost.filter((post)=>postId!=post._id))
            setConform(false)
        } catch (error) {
            console.log(error);
        }
    }
    const deletePost = async (postId) =>{
      try {
          const {data} = await axios.post('http://localhost:3500/delete',{postId})
          console.log('response of delete:', data);
          setArchivePost(archivePost.filter((post)=>postId!=post._id))
          setDeleteConform(false)
      } catch (error) {
          console.log(error);
      }
    }
  return (
    <Scrollbar style={{ width: "100vw", height: '100vh',  }}>
    <div    >
        <div>
            <Settings page={'archive'}/>
        </div>
        <div>
        {fullScreen==true?
            <div className='relative w-full '> 
              <div className=' z-45 fixed top-0   h-full w-full  bg-gray-900/50'>
                        {/* <div className='bg-white w-150 m-auto flex  rounded-xl p-2'> */}
                    <button onClick={()=>{setFullScreen(false)}} className='absolute z-50 !bg-amber-50/30  !px-3 left-2 top-2'><FiMinimize /></button>
                    <div className=' flex justify-center  bg-stone-950/90'>
                        <img src={modalPost.postImage} alt="" className='h-screen !m-auto   !z-49  ' />
                    </div>
                    </div>
                </div>
            :""}
           

    
        <div className='  p-2 align-center h-full ml-[20%]  '>
        <div className=" columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4 ">
        {archivePost.length>0?archivePost.map((post)=>{
          return(
                <div key={post._id} 
                    className="break-inside-avoid mb-4 rounded-xl overflow-hidden  shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group">
                        <div className='relative '>
                            <Link to={`/post/${post._id}`} state={{interest:true}}>
                                <img src={post.postImage} alt="" className="grayscale brightness-75  w-full   object-cover transition duration-300"/>
                            </Link>
                            <div className="absolute  top-5/12 right-3/12  opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      
                                <button className='!bg-white text-black !font-extrabold !p-2 m-1 hover:!bg-gray-200'
                                    onClick={(e) => {e.stopPropagation(), setConform(true),setPostId(post._id)}} title='Unarchive'><MdUnarchive /></button>
                                <button className='!bg-white text-black !font-extrabold !p-2 m-1 hover:!bg-gray-200'
                                    onClick={(e) => {e.stopPropagation(), setDeleteConform(true),setPostId(post._id)}} title='Delete'><MdDelete /></button>
                                <button className='!bg-white text-black !font-extrabold !p-2 m-1 hover:!bg-gray-200'
                                    onClick={(e) => {e.stopPropagation(),navigate('/create',{state:post})}} title='Edit'><MdEdit /></button>
                            </div>
                        </div>
                        
                                     
                </div>
              )
            }): <div className=''>
                  <h1 className='text-gray-500 font-bold ml-10 flex justify-center'>No Posts!</h1> 
                  </div>}
              </div>
              </div>



             {/*unarchive comform modal */}
                                     {conform==true?
                                        <div className=' z-45 fixed   pt-5 h-full w-full top-0  bg-gray-900/70'>
                                            <div className='p-5 bg-white w-fit rounded-2xl !z-50 fixed left-6/14 top-5/12'>
                                                <p className='text-black'>Are you sure to unarchive ?</p>
                                                <div className='flex justify-around p-2'>
                                                    <button onClick={()=>setConform(false)} className='!bg-black'>No</button>
                                                    <button onClick={()=>unArchive(postId)} className='!bg-blue-700'>Yes</button>
                                                </div>
                                            </div>
                                        </div>
                                     :''}
             {/* delete comform modal */}
                                     {deleteConform==true?
                                        <div className=' z-45 fixed   pt-5 h-full w-full top-0  bg-gray-900/70'>
                                            <div className='p-5 bg-white w-fit rounded-2xl !z-50 fixed left-6/14 top-5/12'>
                                                <p className='text-black'>Are you sure to Delete ?</p>
                                                <div className='flex justify-around p-2'>
                                                    <button onClick={()=>setDeleteConform(false)} className='!bg-black'>No</button>
                                                    <button onClick={()=>deletePost(postId)} className='!bg-blue-700'>Yes</button>
                                                </div>
                                            </div>
                                        </div>
                                     :''}
        </div>
        </div>

    </Scrollbar>
  )
}
