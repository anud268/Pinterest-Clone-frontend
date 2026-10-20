import axios from 'axios';
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { addUser } from '../Redex/Slice/UserSlice';
import { GoHome, GoHomeFill } from 'react-icons/go';
import { MdExplore, MdOutlineAdminPanelSettings, MdOutlineExplore } from 'react-icons/md';
import { FaRegUserCircle, FaUserCircle } from 'react-icons/fa';
import { FaRegSquarePlus, FaSquarePlus } from 'react-icons/fa6';
import { addPic } from '../Redex/Slice/picSlice';
import { ImMenu } from 'react-icons/im';
import { IoCloseSharp } from 'react-icons/io5';
import { showSidebar } from '../Redex/Slice/navbarSlice';
import { selectPage } from '../Redex/Slice/selectPageSlice';
import { addPost } from '../Redex/Slice/PostSlice';

export default function Sidebar({section}) {
    const navigate = useNavigate()
    const [page,setPage]= useState('')
    const [drpdown,setDrpdown] = useState(false)
    const dispatch = useDispatch()
    const user = useSelector((state)=>state.user)
    const pic = useSelector((state)=>state.pic)
    const sidebar = useSelector((state)=>state.sidebar)
    const select = useSelector((state)=>state.select)
    const[dark,setDark] = useState(false)
    
    const fetchUser=async()=>{
        try {
            const {data} = await axios.get('http://localhost:3500/fetchuser',{withCredentials: true})
            if(!data._id){
                navigate('/signin')
            }
            dispatch(addUser(data))
        } catch (error) {
            console.log(error);
        }
    }
    const fetchProfilePic = async (id)=>{
        try {
            
            const {data} = await axios.get(`http://localhost:3500/profilepic/${id}`)
            dispatch(addPic(data))
        } catch (error) {
            console.log(error);
        }
    }

    const fetchPosts = async () => {
      try {
        const { data } = await axios.get(`http://localhost:3500/posts/${user._id}`)
        dispatch(addPost(data))
      } catch (error) {
        console.log(error)
      }
    }


    useEffect(()=>{
        fetchUser()
    },[])

    useEffect(() => {
    if (user && user._id) {
        fetchProfilePic(user._id);
    }
}, [user]);

    const logout = async()=>{
        try {
            const {data} = await axios.post('http://localhost:3500/logout',{},{withCredentials: true})
            navigate('/signin')
        } catch (error) {
            console.log(error);
        }
    }
    
    
  return (
    <div className=''>
            <p  className='text-3xl p-4 z-41 fixed  place-items-center text-black cursor-pointer' onClick={(e)=>{e.stopPropagation(),dispatch(showSidebar(!sidebar))}} >{sidebar?<IoCloseSharp />:<ImMenu/>}</p>
    {sidebar&&
    <div className='h-screen top-0 fixed z-40 bg-white  w-16 text-center  flex flex-col justify-between  shadow-xl/50'>
        <div className='w-full text-center mt-12'>
            
            <Link to={'/home'} ><p title='Home' className='text-3xl mt-5 place-items-center text-black' onClick={fetchPosts}>{section=='home'?<GoHomeFill/>:<GoHome/>}</p></Link>
            <Link to={'/explore'}><p title='Explore' className='text-3xl mt-5 place-items-center p-3 text-black'>{section=='explore'?<MdExplore />:<MdOutlineExplore />}</p></Link>
            <Link to={'/create'}><p title='Create' className='text-3xl mt-5 place-items-center p-3 text-black' >{section=='create'?<FaSquarePlus />:<FaRegSquarePlus />}</p></Link>
            <Link to={`/profile/${user._id}`}><p title='Profile' className='text-3xl mt-5 place-items-center p-3 text-black' >{section=='profile'?<FaUserCircle />:<FaRegUserCircle />}</p></Link>
            
            {user.role=="admin"&&
                <Link to={'/admin'}><p className='text-3xl mt-5 place-items-center p-3 text-black'><MdOutlineAdminPanelSettings /></p></Link>
            }
            
        </div>
        <div>
                <div className='w-full  h-20 ' onClick={(e)=>{e.stopPropagation(),dispatch(showSidebar(true))}}>
                    <img src={pic} title={user.fullname} alt=""onClick={()=>{setDrpdown(!drpdown)}} className='rounded-full w-12 h-12 absolute bottom-10 m-2 cursor-pointer' />
                </div>
            {drpdown==true
            ?
            <div className='bg-white text-black rounded-lg w-40 absolute ml-20 bottom-15 cursor-pointer shadow-lg border-2 border-blue-50'>
                <p className='p-2 rounded bg-gray-500 '>{user.fullname}</p>
                <Link to={`/profile/${user._id}`}><p className='p-2 rounded hover:bg-gray-200 '>Profile</p> </Link>
                 <Link to={'/settings'}><p className='p-2 rounded hover:bg-gray-200 '>Settings</p></Link>
                <p onClick={logout} className='p-2 rounded hover:bg-gray-200 '>Logout</p>
            </div>
            :''
            }
        </div>
    </div>}
    </div>
  )
}
