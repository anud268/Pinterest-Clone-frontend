import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addModal } from "../Redex/Slice/modalSlice";
import { SlOptionsVertical } from "react-icons/sl";
import { IoDownloadOutline } from "react-icons/io5";
import { FiShare2 } from "react-icons/fi";
import {
  MdNotInterested,
  MdOutlineArchive,
  MdOutlineReport,
} from "react-icons/md";
import { GoArrowUpRight, GoHomeFill } from "react-icons/go";
import { FaBookmark, FaRegBookmark } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { HiOutlineArrowLeftStartOnRectangle } from "react-icons/hi2";
import Scrollbar from "react-scrollbars-custom";

export default function AdminPage() {
  // const [page,setPage] = useState('post')
  // const posts = useSelector((state)=>state.post)
  const [posts, setPosts] = useState([]);
  const dispatch = useDispatch();
  const [modalPost, setModalPost] = useState([]);
  const [save, setSave] = useState(false);
  const [own, setOwn] = useState(false);
  const [showOption, setShowOption] = useState(false);
  const [options, setOptions] = useState([
    "Download",
    "Share",
    "Not Interested",
    "Report",
    "Archive",
  ]);
  const modal = useSelector((state) => state.modal);
  const user = useSelector((state) => state.user);
  const navigate = useNavigate();

  const fetchPosts = async () => {
    try {
      const { data } = await axios.get("http://localhost:3500/allposts");
      console.log('all posts',data);
      
      setPosts(data);
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <Scrollbar style={{ width: "100vw", height: '100vh', background:"gray",  }}>
    <div className="flex bg-amber-400 ">
      {/* left */}
      <div className=" text-xl bg-stone-950 min-h-screen h-100vh w-100 pt-10 border-r border-white/20">
        <div className="fixed w-79 ">
          <Link to={"/home"}><p className="pl-20  p-5 font-bold hover:bg-blue-200/10 cursor-pointer flex items-center text-white "><HiOutlineArrowLeftStartOnRectangle className="mr-3"/> Home</p></Link>
          <Link to={"/admin"}><p className="pl-20 p-5 font-bold bg-blue-200/20 cursor-pointer text-white">Posts</p></Link>
          <Link to={"/admin/userlist"}><p className="pl-20  p-5 font-bold hover:bg-blue-200/10 cursor-pointer text-white ">User List</p></Link>
          <Link to={"/admin/explore"}><p className="pl-20  p-5 font-bold hover:bg-blue-200/10 cursor-pointer text-white ">Explore</p></Link>
          <Link to={"/admin/tags"}><p className="pl-20  p-5 font-bold hover:bg-blue-200/10 cursor-pointer text-white ">Tags</p></Link>
        </div>
      </div>
      {/* right */}
      
      <div className="bg-neutral-900 p-3 w-full">
        <div className=" columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
          {posts?.map((post, i) => (
            <div
              key={i}
              className="break-inside-avoid mb-4 rounded-xl overflow-hidden  shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group"
            >
              <div className="relative">
                <img
                  src={post.postImage}
                  alt={post.postTitle}
                  onClick={() => navigate("post" ,{state:post})}  
                  title={post.userId.fullname}
                  // title={post.userId.fullname}
                  className={` w-full object-cover transition duration-300 group-hover:brightness-80 ${post.archive&&'grayscale brightness-30'} `}

                  loading="lazy"
                />
                {post.archive && <p className="absolute text-black font-bold text-xs !z-50 top-1 left-1 px-2 py-1 bg-white shadow rounded-xl">Archived</p>}
                {post.userId.adminblock==true>0&&<p className="absolute !z-50 top-1 right-1 text-xs text-red-600 font-bold  px-2 py-1 bg-white shadow rounded-xl ">Blocked User</p>}
                {post.adminStrike==true>0&&<p className="absolute !z-50 bottom-1 right-1 text-xs text-blue-600 font-bold  px-2 py-1 bg-white shadow rounded-xl ">Image Striked</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
      </Scrollbar>
    
  );
}
