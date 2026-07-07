import axios from "axios";
import React, { useEffect, useState } from "react";
import { IoArrowBackOutline, IoDownloadOutline } from "react-icons/io5";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import Sidebar from "./Sidebar";
import { HiDotsHorizontal } from "react-icons/hi";
import { addPost } from "../Redex/Slice/PostSlice";
import { MdNotInterested, MdOutlineArchive } from "react-icons/md";
import { FiShare2 } from "react-icons/fi";
import { FaBookmark, FaRegBookmark } from "react-icons/fa";
import { IoIosEye } from "react-icons/io";
import { GoArrowUpRight } from "react-icons/go";
import Scrollbar from "react-scrollbars-custom";

export default function View() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const { id } = useParams();

  const interest = location.state.interest;
  console.log("==========", interest);

  const [post, setPost] = useState(null);
  const [dropdown, setDropdown] = useState(false);
  const [save, setSave] = useState();

  const user = useSelector((state) => state.user);
  const posts = useSelector((state) => state.post);

  // ✅ fetch single post
  const getViewPost = async () => {
    try {
      const { data } = await axios.get(`http://localhost:3500/viewpost/${id}`);
      setPost(data);

      // derive ownership & saved state from backend
      setSave(data.saved?.includes(user._id) ?? false);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getViewPost();
  }, [id]);

  // ✅ delete
  const deletePost = async (postId) => {
    try {
      const { data } = await axios.post("http://localhost:3500/delete", {
        postId,
      });
      if (data.success) {
        dispatch(addPost(posts.filter((p) => p._id !== postId)));
        navigate(-1);
      }
    } catch (error) {
      console.log(error);
    }
  };

  // ✅ save/unsave
  const savingPost = async (postId, userId) => {
    try {
      const { data } = await axios.post("http://localhost:3500/save", {
        postId,
        userId,
      });
      if (data.success !== undefined) {
        setSave(!save);
        console.log(data.message);
      }
    } catch (error) {
      console.log("post not saved", error);
    }
  };

  // ✅ archive
  const archivePost = async (postId) => {
    try {
      const userId = user._id;
      const { data } = await axios.post("http://localhost:3500/archive", {
        postId,
        userId,
      });
      navigate(-1);
      if (data.success) {
        dispatch(addPost(posts.filter((p) => p._id !== postId)));
        console.log(data);
      }
    } catch (error) {
      console.log("archive failed", error);
    }
  };

  // ✅ dropdown handler
  const handleDropdowns = (option, post) => {
    switch (option) {
      case "Edit":
        navigate("/create", { state: post });
        break;
      case "Save":
        savingPost(post._id, user._id);
        break;
      case "Archive":
        archivePost(post._id);
        break;
      case "Delete":
        deletePost(post._id);
        break;
      default:
        break;
    }
  };

  const notInterestedPost = async (postId) => {
    try {
      const userId = user._id;
      const { data } = await axios.post("http://localhost:3500/notinterested", {
        userId,
        postId,
      });
      console.log("notintersted----", data);
      dispatch(addPost(posts.filter((p) => p._id !== postId)));
      navigate(-1);
    } catch (error) {
      console.log(error);
    }
  };

  const removeNotInterested = async (postId) => {
    try {
      const userId = user._id;
      const { data } = await axios.post(
        "http://localhost:3500/removenotinterest",
        { postId, userId }
      );
      // setNotInterested(notInterested.filter((post)=>postId!=post._id))
      navigate(-1);
    } catch (error) {
      console.log(error);
    }
  };

  const unArchive = async (postId) => {
    try {
      const userId = user._id;
      const { data } = await axios.post("http://localhost:3500/unarchive", {
        postId,
        userId,
      });
      console.log("unarchive :", data);
      navigate(-1);
      // setArchivePost(archivePost.filter((post)=>postId!=post._id))
      // setConform(false)
    } catch (error) {
      console.log(error);
    }
  };
  const ViewSkeleton = () => {
    return (
      <div className="w-screen min-h-screen bg-gray-50 flex relative flex-col lg:flex-row animate-pulse">
        {/* Left side skeleton */}
        <div className="w-full lg:w-2/3 flex items-start justify-center bg-gray-200">
          <div className="w-full h-[80vh] bg-gray-300"></div>
        </div>

        {/* Right side skeleton */}
        <div className="w-full lg:w-1/3 bg-gray-100 p-8 flex flex-col justify-between">
          {/* User info */}
          <div className="flex justify-between items-center gap-3 border-b border-gray-300 pb-4 mb-6">
            <div className="flex gap-3">
              <div className="w-12 h-12 rounded-full bg-gray-300"></div>
              <div>
                <div className="h-4 w-32 bg-gray-300 rounded mb-2"></div>
                <div className="h-3 w-20 bg-gray-200 rounded"></div>
              </div>
            </div>
            <div className="w-6 h-6 bg-gray-300 rounded"></div>
          </div>

          {/* Title & Description */}
          <div>
            <div className="h-6 bg-gray-300 rounded w-3/4 mb-4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-300 rounded w-full"></div>
              <div className="h-4 bg-gray-300 rounded w-5/6"></div>
              <div className="h-4 bg-gray-300 rounded w-2/3"></div>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mt-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="w-16 h-6 bg-gray-300 rounded-full"></div>
            ))}
          </div>

          {/* Bottom buttons */}
          <div className="flex flex-wrap gap-4 pt-6 border-t border-gray-300 mt-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="w-20 h-20 bg-gray-300 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Scrollbar style={{ width: "100vw", height: '100vh',  }}>
      {!post ? (
        <ViewSkeleton />
      ) : (
        <div className="w-full min-h-screen bg-gray-50 text-gray-200 flex relative flex-col lg:flex-row">
          {/* <Sidebar /> */}
          {/* Back Button */}
          <p
            className="absolute left-2 top-2 bg-black/60 hover:bg-black/70 rounded-2xl p-2 cursor-pointer"
            onClick={() => {
              navigate(-1);
            }}
          >
            <IoArrowBackOutline />
          </p>

          {/* Left Side: Image */}
          <div className="w-full lg:w-2/3 flex items-start justify-center">
            <img
              src={post.postImage}
              alt="Post"
              className="w-full h-full object-contain max-h-screen"
            />
          </div>

          {/* Right Side: Details */}
          <div className="w-full lg:w-1/3 bg-gray-100 p-8 flex flex-col justify-between">
            {/* Top Section: User Info */}
            <div>
              <div className="flex justify-between items-center gap-3 border-b border-gray-800 pb-4 mb-6">
                <div className="flex gap-3">
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

                <div>
                  {post.userId?._id === user._id ? (
                    <div>
                      <button
                        onClick={() => {
                          setDropdown(!dropdown);
                        }}
                        className="!bg-amber-500/0 text-black   absolute top-10 right-10 w-5 !text-center"
                      >
                        <HiDotsHorizontal size={25} />
                      </button>

                      {dropdown && (
                        <div className="absolute z-50 top-20 right-10 bg-white shadow-2xl/35 p-3 border-1 border-gray-200 rounded-2xl">
                          <a
                            className="px-3 rounded m-1 !text-black hover:bg-amber-50"
                            href={post.postImage}
                            download
                          >
                            Download
                          </a>
                          <p
                            onClick={() => handleDropdowns("Save", post)}
                            className="px-3 rounded m-1 !text-black hover:bg-amber-50 cursor-pointer"
                          >
                            {save ? "Saved" : "Save"}
                          </p>
                          {["Edit", "Delete"].map((option, i) => (
                            <p
                              key={i}
                              onClick={() => handleDropdowns(option, post)}
                              className="text-black px-3 rounded m-1 cursor-pointer hover:bg-amber-50"
                            >
                              {option}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : // <button onClick={() => handleDropdowns("Save", post)}>
                  //   {save ? "Saved" : "Save"}
                  // </button>
                  interest ? (
                    <button
                      className={`!bg-white hover:!bg-gray-200 shadow text-black !font-medium !px-2 !py-2 !rounded-full text-sm transition-colors duration-200 ${
                        user.adminblock &&
                        "opacity-50 cursor-not-allowed pointer-events-none"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        savingPost(post._id, user._id);
                      }}
                    >
                      {save ? (
                        <FaBookmark title="Saved" />
                      ) : (
                        <FaRegBookmark title="Save" />
                      )}
                    </button>
                  ) : (
                    ""
                  )}
                </div>
              </div>

              {/* Title & Description */}
              <h1 className="text-3xl text-gray-900 font-bold mb-4 break-words">
                {post.postTitle}
              </h1>
              <p className="text-gray-800 leading-relaxed break-words">
                {post.postDescription}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mt-4">
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
            <div className="flex flex-wrap gap-4 pt-6 border-t border-gray-800">
              {/* Visit Site */}
              {post?.url && (
                <a
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-2xl !text-stone-800 !visited:text-stone-800 
        ${
          user.adminblock && "opacity-50 cursor-not-allowed pointer-events-none"
        }`}
                >
                  <GoArrowUpRight
                    size={40}
                    className="p-2 bg-stone-700 text-white rounded-full"
                  />
                  <span className="text-sm font-medium">Visit Site</span>
                </a>
              )}

              {/* Share to WhatsApp */}
              <button
                onClick={() => {
                  const shareText = `Check out this post: ${post.postTitle}\n\n${post.postDescription}\n\n${window.location.origin}/post/${post._id}`;
                  const url = `https://wa.me/?text=${encodeURIComponent(
                    shareText
                  )}`;
                  window.open(url, "_blank");
                }}
                className="flex flex-col items-center gap-1 px-3 py-2 rounded-2xl text-stone-800 !bg-transparent"
              >
                <FiShare2
                  size={40}
                  className="p-2 bg-stone-700 text-white rounded-full"
                />
                <span className="text-sm font-medium">Share</span>
              </button>

              {/* Archive or Interest Toggle */}
              {post.userId?._id === user._id ? (
                post.archive ? (
                  <button
                    onClick={() => unArchive(post._id)}
                    className="flex flex-col items-center gap-1 px-3 py-2 rounded-2xl text-stone-800 !bg-transparent"
                  >
                    <MdOutlineArchive
                      size={40}
                      className="p-2 bg-stone-700 text-white rounded-full"
                    />
                    <span className="text-sm font-medium">Unarchive</span>
                  </button>
                ) : (
                  <button
                    onClick={() => archivePost(post._id)}
                    className="flex flex-col items-center gap-1 px-3 py-2 rounded-2xl text-stone-800 !bg-transparent"
                  >
                    <MdOutlineArchive
                      size={40}
                      className="p-2 bg-stone-700 text-white rounded-full"
                    />
                    <span className="text-sm font-medium">Archive</span>
                  </button>
                )
              ) : interest ? (
                <button
                  onClick={() => notInterestedPost(post._id)}
                  className="flex flex-col items-center gap-1 px-3 py-2 rounded-2xl text-stone-800 !bg-transparent"
                >
                  <MdNotInterested
                    size={40}
                    className="p-2 bg-stone-700 text-white rounded-full"
                  />
                  <span className="text-sm font-medium">Not Interested</span>
                </button>
              ) : (
                <button
                  onClick={() => removeNotInterested(post._id)}
                  className="flex flex-col items-center gap-1 px-3 py-2 rounded-2xl text-stone-800 !bg-transparent"
                >
                  <IoIosEye
                    size={40}
                    className="p-2 bg-stone-700 text-white rounded-full"
                  />
                  <span className="text-sm font-medium">Interested</span>
                </button>
              )}

              {/* Download */}
              <a
                href={post.postImage}
                download
                className="flex flex-col items-center gap-1 px-3 py-2 rounded-2xl !text-stone-800 !visited:text-stone-800"
              >
                <IoDownloadOutline
                  size={40}
                  className="p-2 bg-stone-700 text-white rounded-full"
                />
                <span className="text-sm font-medium">Download</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </Scrollbar>
  );
}
