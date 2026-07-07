import axios from 'axios'
import { useFormik } from 'formik'
import React, { useEffect, useState } from 'react'
import { FaChevronDown, FaPlus, FaSortDown } from 'react-icons/fa'
import { GoHomeFill } from 'react-icons/go'
import { HiOutlineArrowLeftStartOnRectangle } from 'react-icons/hi2'
import { IoClose } from 'react-icons/io5'
import { Link } from 'react-router-dom'
import Scrollbar from 'react-scrollbars-custom'

export default function AdminTags() {
    const [showTags,setShowTags] =useState (false)
    const [category,setCategory] = useState([])
    const [addCategory,setaddCategory] = useState(false)
    const [showCategory , setshowCategory] = useState(false)
    const [select,setSelect] = useState([])
    const [isperfect,setIsperfect] = useState('')

    const formik = useFormik({initialValues:{category:''},onSubmit:async(values)=>{
        try {
            const {data} = await axios.post('http://localhost:3500/addcategory',{values})
            console.log('add category ',data);
            setCategory((prev)=>[...prev.filter((cat)=>cat._id!==data._id),data])
            formik.values.category='';
            setaddCategory(false)

        } catch (error) {
            console.log(error);
        }
    }})
    const fetchCategories = async()=>{
        try {
            const {data} = await axios.get(`http://localhost:3500/fetchcat`)
            console.log('fetch categories',data);
            setCategory(data)
        } catch (error) {
            console.log(error);
        }
    }
    
    const tagformik = useFormik({initialValues:{tag:'#'},onSubmit:(values)=>{
        addTags(values)
    }})
    const addTags = async(values)=>{
        try {
          const perfectTag = values.tag.split('')
          console.log('perfect tag:',perfectTag.length);

          if(perfectTag[0]!="#" || perfectTag.includes(' ') || perfectTag.length <= 1){ 
            setIsperfect("Tag must start with '#' and contain only letters, numbers, or underscores (no spaces)")
          }else{
            const formData = {tag:values.tag,category:select._id}
            const {data} = await axios.post('http://localhost:3500/settags',formData)
            setIsperfect('')
            console.log('set push tags',data);
            tagformik.values.tag='#'
            setSelect({ ...select, category: '' });

          }
          
        } catch (error) {
            console.log(error);
        }
    }

    useEffect(()=>{
        fetchCategories()
    },[])

  return (
    <Scrollbar style={{ width: "100vw", height: '100vh', background:"gray",  }}>
    <div className='w-full flex bg-neutral-950'>
        {/* left */}
      <div className=" text-xl bg-stone-950 min-h-screen h-100vh w-100 pt-10 border-r border-white/20">
        <div className="fixed w-79">
          <Link to={"/home"}><p className="pl-20  p-5 font-bold hover:bg-blue-200/10 cursor-pointer flex items-center text-white"><HiOutlineArrowLeftStartOnRectangle className='mr-3'/> Home</p></Link>
          <Link to={"/admin"}><p className="pl-20  p-5 font-bold hover:bg-blue-200/10 cursor-pointer text-white ">Posts</p></Link>
          <Link to={"/admin/userlist"}><p className="pl-20  p-5 font-bold hover:bg-blue-200/10 cursor-pointer text-white ">User List</p></Link>
          <Link to={"/admin/explore"}><p className="pl-20  p-5 font-bold hover:bg-blue-200/10 cursor-pointer text-white ">Explore</p></Link>
          <Link to={"/admin/tags"}><p className="pl-20 p-5 font-bold bg-blue-200/20 cursor-pointer text-white">Tags</p></Link>
        </div>
      </div>
      {/* right  */}
        <div className="w-full  place-items-center  m-auto gap-10 p-6">

  {/* Tag Section */}
  {addCategory&&
  <section className="w-full lg:w-1/2 bg-gray-300 p-6 mb-5 rounded-3xl shadow-md relative">
  <p onClick={()=>{setaddCategory(false)}} className='absolute top-2 right-3 text-2xl text-black cursor-pointer'><IoClose /></p>
    <h2 className="text-3xl font-bold text-center text-black mb-6">Add Category</h2>
    <form onSubmit={formik.handleSubmit}>
    <div className="flex gap-4">
      <input
        type="text"
        name='category'
        value={formik.values.category}
        onChange={formik.handleChange}
        placeholder="Enter new category name"
        className="w-full h-10 px-3 rounded-2xl border border-gray-500 text-black focus:outline-none focus:ring-1 focus:ring-blue-400"
      />
      <button
      type='submit'
      className="!bg-blue-700 text-white px-5 py-2 !rounded-2xl hover:!bg-blue-800">
        Add
      </button>
    </div>
    </form>
  </section>
}

  {/* Tag Dropdown & Creator */}
  <section className="w-full lg:w-1/2 bg-gray-300 p-6 rounded-3xl shadow-md relative">
    <h2 className="text-3xl font-bold text-center text-black mb-6"> Add Tags</h2>
    <form onSubmit={tagformik.handleSubmit}>
    <div className="mb-6 ">
      <div className='flex justify-between'>
        <p className="text-black font-semibold mb-2">Choose Category</p>
        <p
            onClick={()=>{setaddCategory(true)}}
            className="text-white text-xs  mb-2  bg-black rounded-lg px-2 py-1 cursor-pointer flex items-center"><FaPlus />Add New Category</p>
      </div>
      <div
        onClick={() => setshowCategory(!showCategory)}
        className="cursor-pointer bg-white border border-gray-500 rounded-2xl h-10 px-4 flex justify-between items-center text-black"
      >
       
        <input 
            type="text"
            name='category'
            value={select.category}
            className="   text-black w-full   focus:outline-none"
            />
        <FaChevronDown />
      </div>

      {showCategory && 
        <div className="absolute z-10 bg-white border border-gray-300 rounded-2xl mt-1 max-h-60 overflow-y-auto w-9/10 shadow-md">
            {category.map((t, i) => (
            <div key={i}>
                <p
                onClick={() => {
                    setSelect(t);
                    setshowCategory(false);
                }}
                className="p-2 hover:bg-indigo-100 cursor-pointer text-black w-full border-b border-gray-200 focus:outline-none"
                >
                {t.category}
                </p>
            </div>
            ))}
        </div>
      }

    </div>

    <div>
      <p className="text-black font-semibold mb-2">Create New Tag</p>
      
      <input
        type="text"
        defaultValue="#"
        name='tag'
        value={tagformik.values.tag}
        onChange={tagformik.handleChange}
        className="w-full h-10 px-3 rounded-2xl border border-gray-500 text-black focus:outline-none focus:ring-1 focus:ring-blue-400"
      />
      <p className='text-red-700'>{isperfect}</p>
      <button type='submit'  className="mt-4 !bg-indigo-600 text-white px-5 py-2 !rounded-2xl hover:!bg-indigo-700">
        Create Tag
      </button>
    </div>
      </form>
  </section>
  <section className='mt-20 p-4 w-full'>
    
        <div className="space-y-4">
          {category.map((cat, i) => (
            <div key={i} className="bg-white rounded-xl shadow-md border border-gray-200">
              <button
                onClick={() => setShowTags((prev) => (prev === i ? null : i))}
                className="w-full flex items-center justify-between px-4 py-3 text-left font-semibold !bg-blue-200 text-black hover:bg-indigo-50 rounded-t-xl"
              >
                <div className="flex items-center gap-2">
                  <FaSortDown className="text-indigo-600" />
                  {cat.category}
                </div>
                <span className="text-sm text-gray-500">({cat.tags.length})</span>
              </button>

              {showTags === i && (
                <div className="bg-gray-50 px-4 py-2 rounded-b-xl">
                  {cat.tags.map((t, j) => (
                    <p
                      key={j}
                      className="px-3 py-2 my-1 text-sm text-gray-800 bg-white rounded-lg hover:bg-indigo-100 cursor-pointer transition"
                    >
                      {t}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>


    
  </section>
</div>

    </div>
    </Scrollbar>
  )
}
