import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { addModal } from '../Redex/Slice/modalSlice';
import { FiMaximize, FiMinimize } from 'react-icons/fi';
import { IoClose } from 'react-icons/io5';
import axios from 'axios';
import { HiDotsHorizontal } from 'react-icons/hi';
import { Link, useNavigate } from 'react-router-dom';
import { addPost } from '../Redex/Slice/PostSlice';

export default function Modal({post,ownPost}) {
    const user = useSelector((state)=>state.user)
    const modal = useSelector((state)=>state.modal)
    const posts = useSelector((state)=>state.post)
    const pic = useSelector((state)=>state.pic)
    const dispatch = useDispatch()
    const [modalPost, setModalPost] = useState([])
    const [fullScreen,setFullScreen]= useState(false)
    const [editModal, setEditModal] = useState(false)
    const [dropdown,setDropdown] = useState(false)
    const options = ['Edit','Save','Archive','Delete']

    const navigate = useNavigate()

    const handlePostSelect=async(post)=>{
        try {
            setModalPost(post)
        } catch (error) {
            console.log(error);
        }
    }
  useEffect(()=>{
    handlePostSelect(post)
  },[modalPost])

    const deletePost = async (postId) =>{
      try {
          const {data} = await axios.post('http://localhost:3500/delete',{postId})
          console.log('response of delete:', data);
          dispatch(addPost(posts.filter((post)=>post._id!=postId)))
          dispatch(addModal(false))
      } catch (error) {
          console.log(error);
      }
    }
    const savingPost =async(postId,userId)=>{
    try {
      const {data}  = await axios.post('http://localhost:3500/save',{postId,userId})
      console.log('saved post:',data);
    } catch (error) {
      console.log('post not saved');
    }
  }
const archivePost =async(postId,userId)=>{
    try {
      const {data}  = await axios.post('http://localhost:3500/archive',{postId,userId})
      console.log('saved post:',data);
      dispatch(addPost(posts.filter((post)=>post._id!=postId)))
      dispatch(addModal(false))
    } catch (error) {
      console.log('post not saved');
    }
  }
  
    const handleDropdowns =async(option,post)=>{
      try {
        console.log(option);
        console.log(post._id);
        console.log(user._id);
        if(option=='Edit'){
          navigate('/create',{state:post})
          dispatch(addModal(false))
        }else if(option=='Save'){
          savingPost(post._id,user._id)
        }else if(option=='Archive'){
          archivePost(post._id,user._id)
        }else if(option=='Delete'){
          deletePost(post._id)
        }
      } catch (error) {
        
      }
    }

  return (
    <div>
      {modal&&(<>
        {fullScreen==true?
        <div className='relative w-screen '> 
        {/*   <div className=' z-45 fixed   pt-5 h-full w-full  bg-gray-900/70'> */}
                    {/* <div className='bg-white w-150 m-auto flex  rounded-xl p-2'> */}
                <button onClick={()=>{setFullScreen(false)}} className='absolute z-50 !bg-amber-50/30  !px-3 left-2 top-2'><FiMinimize /></button>
                <div className=' flex justify-center  bg-stone-950/90'>
                    <img src={modalPost.postImage} alt="" className='h-screen !m-auto   !z-49 '/>
                </div>
                {/* </div> */}
            </div>
        :""}
        {/* {editModal==true?
        <div className='fixed z-49 text-center w-full bg-stone-950/80 h-full content-center '>
          <Edit presentValue={post}/>
          <button onClick={()=>{setEditModal(false)}} className='!bg-white text-black top-3 right-4 absolute'><IoClose/></button>
        </div> 
        :''} */}
        <div className=' z-45 fixed   pt-5 h-full w-full  bg-gray-900/70'onClick={()=>{dispatch(addModal(false))}} >
                    <div className='bg-white w-150 m-auto flex  rounded-xl p-2' onClick={(e)=>{e.stopPropagation(),dispatch(addModal(true))}}>
                      <div className='w-100 h-fit relative'>
                        <img src={modalPost.postImage} alt="" />
                        <p onClick={()=>{setFullScreen(true)}} className='absolute right-3 bg-amber-50/50 p-1 rounded bottom-2'><FiMaximize className='cursor-pointer text-2xl' /></p>
                      </div>
                        <div className='pl-2 w-80 flex flex-row-reverse'>
                          <div className='relative '>
                            <button onClick={(e)=>{e.stopPropagation(),dispatch(addModal(false))} } className='!bg-gray-500 hover:!bg-gray-600 shadow-xl  absolute right-0 !px-3 !z-50 '><IoClose /></button>
                            {ownPost==true
                            ?<div className=''>
                                <button onClick={()=>{ setDropdown(!dropdown)}} className='hover:!bg-amber-500 absolute top-10 right-0 w-5 !text-center'><HiDotsHorizontal /></button>
                                
                                {dropdown ==true?
                                  <div className='absolute z-50 top-15 right-10 bg-white shadow-2xl/35  p-3 border-1 border-gray-200 rounded-2xl'>
                                    <a className=' px-3 rounded m-1 !text-black hover:bg-amber-50' href={modalPost.postImage}>Download</a>
                                    {options.map((option,i)=>{
                                      return(
                                        <div key={i}>
                                          <p onClick={()=>handleDropdowns(option,modalPost)} className='text-black px-3 rounded m-1  cursor-pointer hover:bg-amber-50'>{option}</p>
                                        </div>
                                      )
                                    })}
                                  </div>
                              :''}
                            </div>
                            :<button className='absolute right-0'>save</button>
                            }
                            
                          </div>
                          <div className='flex flex-col  !justify-start w-80 break-words font-mono'>
                            <div>
                              {/* <p className='text-black'>{user.fullname}</p> */}
                            </div>
                            <div className='flex place-items-center p-2 gap-2'>
                              {/* <img src={pic} alt="" className='w-10 h-10 rounded-full' /> */}
                              <Link to={`/profile/${modalPost.userId?._id}`}  onClick={()=>{dispatch(addModal(false))}}> <p className='text-black'>{modalPost.userId?.fullname}</p></Link>
                              {/* <p className='text-black' onClick={()=>{navigate('/profile',{state:modalPost.userId._id})}} >{modalPost.userId?.fullname}</p> */}
                            </div>
                            <h2 className='text-black text-2xl font-bold h-10 overflow-auto'>{modalPost.postTitle}</h2>
                            <p className='text-black max-h-80 overflow-auto'>{modalPost.postDescription}</p>
                          </div>
                        </div>
                    </div>
                  </div>
        </>)}
    </div>
  )
}
