import { ErrorMessage, Field, useFormik } from 'formik'
import '../Pages/Style.css'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import * as yup from 'yup'
import { useState } from 'react'
import {useDispatch} from 'react-redux'
import {addUser} from '../Redex/Slice/UserSlice'

export default function Signup() {
  const [otpModal,setOtpModal] = useState(false)
  const [resendOtpModal,setResendOtpModal] = useState(false)
  const [otps,setOtp] = useState('')
  const [existMail,setExistMail] = useState('')
  const [userData,setUserData] = useState([])
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const validation = yup.object({
    email: yup.string().email('Invalid email').required('email is required'),
    fullname: yup.string().min(3, 'Username must be at least 3 characters').required('Username is required'),
    password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required')
  })

  const formik = useFormik({
    initialValues:{
      email:"",
      fullname:"",
      password:""
    },
    validationSchema : validation,

    onSubmit:(values)=>{
      submitingData(values)
      
    }
  })

  const submitingData = async(values)=>{
    try {
      const {data} = await axios.post('http://localhost:3500/signup',{values},{withCredentials: true})
      console.log(data.user.user);
      
      dispatch(addUser(data.user.user))
      setOtpModal(data.success)
      setOtp(data.setOtp)
      setExistMail(data.message)
    } catch (error) {
      console.log(error);
    }
  }
  const otpFormik = useFormik({
    initialValues:{
      otp:""
    },
    onSubmit:(values)=>{
      submitOtp(values)
    }
  })
  const submitOtp =async (values)=>{
    try {
      if(otps.otp==values.otp){
        removeOtp()
        
        navigate('/home')
      }else{
        setOtpModal(false)
        setResendOtpModal(true)
      }
    } catch (error) {
      console.log(error);
    }
  }
  const removeOtp = async()=>{
    try {
      const otpId = otps._id
       const {data} = await axios.post('http://localhost:3500/removeotp',{otpId})
    } catch (error) {
      console.log(error);
    }
  }
  const resendOtp = async()=>{
    try {
      const email = otps.email
      await removeOtp()
      const {data} = await axios.post('http://localhost:3500/resendotp',{email})
      setResendOtpModal(false)
      setOtpModal(data.success)
      setOtp(data.setOtp)
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <div className=''>
        <div className=' image  w-screen h-screen content-center text-center  '>
            {otpModal==true
            ?<div className='z-50 flex  justify-center absolute w-full h-110 '>
              <div className=' w-fit p-10 content-center backdrop-blur-xs bg-black/50 shadow-2xl rounded-2xl'>
              <p className='text-2xl absolute z-40 right-4 top-2 cursor-pointer ' onClick={()=>{setOtpModal(false),setResendOtpModal(true)}}>&#10799;</p>
                <h1 className=''>Verification Code</h1>
                <p>We have to send the varification code to your email address</p>
                  <form  onSubmit={otpFormik.handleSubmit} className=''>
                    <input type="text" name='otp' onChange={otpFormik.handleChange} className='border w-35 text-center mt-7 text-3xl p-3 focus:outline-none ' maxLength={6} /><br />
                    <button  className='w-30 mt-7'>Confirm</button>
                  </form>
              </div>
            </div>
            :''
            }
          <div className=' w-fit m-auto p-10 backdrop-blur-xs bg-black/20 shadow-2xl rounded-2xl'>
            <h1 className='font-bold' >Signup</h1>
            <form onSubmit={formik.handleSubmit}>
                <div className='p-4 '>
                  <p className='text-red-500'>{existMail}</p>
                  <p >Email</p>
                  <input type="text" name='email' onChange={formik.handleChange} className='border-3 rounded-3xl w-xs h-10 focus:outline-none focus:border-red-500 p-2 text-center font-bold ' />
                  {formik.touched.email && formik.errors.email && (
                    <div className="text-red-500 text-sm">{formik.errors.email}</div>
                  )}
                  <p >Username</p>
                  <input type="text" name='fullname' onChange={formik.handleChange} className='border-3 rounded-3xl w-xs h-10 focus:outline-none focus:border-red-500 p-2 text-center font-bold ' />
                  {formik.touched.fullname && formik.errors.fullname && (
                    <div className="text-red-500 text-sm">{formik.errors.fullname}</div>
                  )}
                  <p >Password</p>
                  <input type="password" name='password' onChange={formik.handleChange} className='border-3 rounded-3xl w-xs h-10 focus:outline-none focus:border-red-500 p-2 text-center font-bold ' />
                  {formik.touched.password && formik.errors.password && (
                    <div className="text-red-500 text-sm">{formik.errors.password}</div>
                  )}
                </div>
                <button type="submit" className='text-white !bg-red-600 w-xs !rounded-3xl'>Continue</button>
                <p className='mt-3'>Create an account <Link to={'/signin'}>Signin</Link></p>
                {resendOtpModal==true
                ?<div>
                  <p onClick={resendOtp} className='mt-4'>Resend OTP</p>

                </div>
                :''
              }
            </form>
            </div>
        </div>
    </div>
  )
}
