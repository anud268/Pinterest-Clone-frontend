import React, { useEffect, useState } from 'react'
import Settings from '../Pages/Settings'
import axios from 'axios'
import { IoIosEye } from 'react-icons/io'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import Scrollbar from 'react-scrollbars-custom'

export default function NotInterested() {
    const [notInterested,setNotInterested]=useState([])
    const user = useSelector((state)=>state.user)

    const fetchNotInterested =async()=>{
        try {
            const {data} = await axios.get(`http://localhost:3500/fetchnotinterested/${user._id}`)
            console.log('fetchnotinterested---',data);
            setNotInterested(data)
            
        } catch (error) {
            console.log(error);
        }
    }
    useEffect(() => {
        if (user && user._id) {
            fetchNotInterested();
        }
    }, [user]); 

    const removeNotInterested = async(postId)=>{
        try {
            const userId = user._id
            const {data} = await axios.post('http://localhost:3500/removenotinterest',{postId,userId})
            setNotInterested(notInterested.filter((post)=>postId!=post._id))
        } catch (error) {
            console.log(error);
        }
    }


  return (
    <Scrollbar style={{ width: "100vw", height: '100vh',  }}>
    <div className='flex'>
        <div>
            <Settings page={'notinte'}/>
        </div>
        <div className='  p-2 align-center h-full ml-[20%]  '>
            <div className=" columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4 ">
                {notInterested.length>0?notInterested.map((post)=>{
                    return(
                        <div className="break-inside-avoid mb-4 rounded-xl overflow-hidden  shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group">
                            <div className='relative '  >
                                <Link to={`/post/${post._id}`} state={{interest:false}}>
                                    <img src={post.postImage} alt="" className=" brightness-75  w-full   object-cover transition duration-300"/>
                                </Link>
                                <div className="absolute  top-2 right-2  opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    <button 
                                        onClick={()=>{removeNotInterested(post._id)}}
                                         className='!bg-white text-black !font-extrabold !p-2 m-1 hover:!bg-gray-200' title='Intrested'><IoIosEye  /></button>
                                </div>
                            </div>
                        </div>
                    )
                }):
                    <div className=''>
                        <h1 className='text-gray-500 font-bold ml-10  flex justify-center'>No Posts!</h1> 
                    </div>
                }
            </div>
        </div>
    </div>
    </Scrollbar>
  )
}
