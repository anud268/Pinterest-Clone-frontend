
import axios from "axios";
import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Scrollbar from "react-scrollbars-custom";

export default function Viewpost() {
  const location = useLocation();
  const navigate = useNavigate()
  const post = location.state;
  const [strike,setStrike] = useState(null)
  const [block,setBlock] = useState(null)
  

  if (!post) {
    return (
      <div className="w-screen min-h-screen flex items-center justify-center text-gray-400 bg-gray-950">
        <p>No post data available.</p>
      </div>
    );
  }

  const fetchAction=async()=>{
    try {
        const {data} = await axios.get(`http://localhost:3500/fetchactions`,{params:{userId,postId:post._id}})
        console.log(data);
        
        setStrike(data.isStrike)
        setBlock(data.isBlock)
    } catch (error) {
        console.log(error);
    }
  }

  useEffect(()=>{
    fetchAction()
  },[])


  
  const userId = post.userId._id 
  const blockUser = async()=>{
    try {
        const {data} = await axios.post('http://localhost:3500/adminblock',{id:userId})
        setBlock(data.success)
    } catch (error) {
        console.log(error);
    }
  }

  const strikeImage = async(postId)=>{
    try {
        const {data} = await axios.post('http://localhost:3500/adminstrike',{postId})
        setStrike(data.success)
    } catch (error) {
        console.log(error);
    }
  }

  return (
    <Scrollbar style={{ width: "100vw", height: '100vh', background:"gray",  }}>
    <div className="w-full min-h-screen bg-gray-950 text-gray-200 flex flex-col lg:flex-row">
      
      {/* Left Side: Image */}
      <div className="w-full lg:w-2/3 bg-black flex items-start justify-center">
        <img
          src={post.postImage}
          alt="Post"
          className="w-full h-full object-contain max-h-screen"
        />
      </div>

      {/* Right Side: Details */}
      <div className="w-full lg:w-1/3 bg-gray-900 p-8 flex flex-col justify-between">
        
        {/* Top Section: User Info */}
        <div>
          <div className="flex items-center gap-3 border-b border-gray-800 pb-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-lg font-bold">
              {post.userId?.fullname?.[0] || "U"}
            </div>
            <div>
              <Link
                to={`/profile/${post.userId?._id}`}
                className="text-lg font-semibold hover:underline"
              >
                {post.userId?.fullname || "Unknown User"}
              </Link>
              <p className="text-sm text-gray-400">View profile</p>
            </div>
          </div>

          {/* Title & Description */}
          <h1 className="text-3xl font-bold mb-4 break-words">{post.postTitle}</h1>
          <p className="text-gray-300 leading-relaxed break-words">
            {post.postDescription}
          </p>
         <div className="flex flex-wrap gap-2">
            {post.tags.map((tag, i) => (
                <div 
                key={i} 
                className="bg-gray-200 px-3 py-1 text-black rounded-full text-sm whitespace-nowrap"
                >
                {tag}
                </div>
            ))}
         </div>

        </div>

        {/* Bottom Section: Buttons */}
        <div className="flex flex-wrap gap-3 pt-6 border-t border-gray-800">
          <button className="flex-1 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 transition"
                onClick={blockUser}
                >
             {block?'Unblock User':'Block User'}
          </button>
          <button className="flex-1 px-4 py-2 rounded-lg bg-yellow-600 hover:bg-yellow-700 transition"
            onClick={()=>{strikeImage(post._id)}}
          >
             {strike? 'Unstrike Image' : 'Strike Image'}
          </button>
          {/* <button className="flex-1 px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 transition">
             Report Image
          </button> */}
        </div>

      </div>
    </div>
    </Scrollbar>
  );
}
