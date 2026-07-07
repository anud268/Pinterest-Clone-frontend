import React from 'react'
import Sidebar from '../Part/Sidebar'
import EditProfile from '../Part/EditProfile'
import { Link} from 'react-router-dom'

export default function Settings({page}) {
  console.log(page,'>>>>>>>>>>>>>>>>>>>>>>>>>>>');
  
  return (
    <div >
        <div className='flex fixed   z-25 top-0'>
                      <Sidebar />
        </div>
        <div className='flex'>
            {/* side  */}
            <div className='text-black   h-screen w-[20%]   pt-20  border-e border-gray-300 fixed '>
                <Link to={'/settings'}> <p className={`p-5 pl-[20%] font-bold rounded-2xl text-black hover:bg-indigo-100 ${page==="edit" ? 'bg-indigo-100':''}`}>Edit Profile</p></Link>
                <Link to={'/settings/archive'}>  <p className={`p-5 pl-[20%] font-bold rounded-2xl text-black hover:bg-indigo-100 ${page==="archive" ? 'bg-indigo-100':''}`}>Archived Posts</p></Link>
                <Link to={'/notinterested'}> <p className={`p-5 pl-[20%] font-bold rounded-2xl text-black hover:bg-indigo-100 ${page==="notinte" ? 'bg-indigo-100':''}`}>Not Interested Posts</p></Link>
                <Link to={'/settings/blockedusers'}> <p className={`p-5 pl-[20%] font-bold rounded-2xl text-black hover:bg-indigo-100 ${page==="block" ? 'bg-indigo-100':''}`}>Blocked Users</p></Link>
                <Link to={'/settings/shortkeys'}> <p className={`p-5 pl-[20%] font-bold rounded-2xl text-black hover:bg-indigo-100 ${page==="shortkeys" ? 'bg-indigo-100':''}`}>Short keys</p></Link>
                <p className='p-5 pl-[20%] font-bold rounded-2xl hover:bg-indigo-100'>Activity</p>
                <p className='p-5 pl-[20%] font-bold rounded-2xl hover:bg-indigo-100'>Account management</p>
                <p className='p-5 pl-[20%] font-bold rounded-2xl hover:bg-indigo-100'>Theme</p>
                {/* <p className='p-5 pl-[20%] font-bold rounded-2xl hover:bg-indigo-100'>Edit Profile</p>
                <p className='p-5 pl-[20%] font-bold rounded-2xl hover:bg-indigo-100'>Edit Profile</p> */}
            </div>
            {/* content  */}
            {/* <div>
                <EditProfile/>
            </div> */}
        </div>
    </div>
  )
}
