import React, { useState } from 'react'
import '../Pages/Style.css'
import { Link, useNavigate } from 'react-router-dom'
import { useFormik } from 'formik'
import axios from 'axios'
import { addUser } from '../Redex/Slice/UserSlice'
import { useDispatch } from 'react-redux'

export default function Signin() {
    const navigate = useNavigate()
    const [message,setMessage]= useState('')
    const dispatch = useDispatch()
    
    const formik = useFormik({
        initialValues:{
            email:"",
            password:""
        },
        onSubmit:(values)=>{
            submitingData(values)
        }
    })
    const submitingData = async(values)=>{
        try {
            console.log('signin values-',values);
            const {data} = await axios.post('http://localhost:3500/signin',{values},{withCredentials: true})
            console.log('signin response:',data);
            dispatch(addUser(data))
            if(data._id){
                navigate('/home')
            }else{
                setMessage(data.message)
            }
        } catch (error) {
            console.log(error);
        }
    }
    
  return (
    <div className=''>
        <div className=' image  w-screen h-screen content-center text-center  '>
          <div className=' w-fit m-auto p-10 backdrop-blur-xs bg-black/20 shadow-2xl rounded-2xl'>
            <h1 className='font-bold ' >Signin</h1>
            <form onSubmit={formik.handleSubmit} >
                <div className='p-4 '>
                    <p className='text-red-500'>{message}</p>
                  <p >Email</p>
                  <input type="email" name='email' onChange={formik.handleChange} className='border-3 rounded-3xl w-xs h-10 focus:outline-none focus:border-red-500 p-2 text-center font-bold ' />
                  <p >Password</p>
                  <input type="password" name='password' onChange={formik.handleChange} className='border-3 rounded-3xl w-xs h-10 focus:outline-none focus:border-red-500 p-2 text-center font-bold ' />
                </div>
                <button type="submit" className='text-white !bg-red-600 w-xs !rounded-3xl'>Signin</button>
                <p className='mt-3'>Create an account <Link to={'/signup'}>Signup</Link></p>
            </form>
            </div>
        </div>
    </div>
  )
}
