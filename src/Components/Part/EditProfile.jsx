import axios from 'axios'
import { useFormik } from 'formik'
import React, { useEffect, useState } from 'react'
import Settings from '../Pages/Settings'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

export default function EditProfile() {
  const user = useSelector((state) => state.user)
  const [profileData, setProfileData] = useState([])
  const navigate = useNavigate()

  const formik = useFormik({
    initialValues: {
      firstname: profileData?.firstname,
      lastname: profileData?.lastname,
      bio: profileData?.bio,
      country: profileData?.country,
      state: profileData?.state
    },
    onSubmit: (values) => {
      submitData(values)
    }
  })

  const getProfileData = async () => {
    try {
      const userId = user._id
      console.log('user id fron get profile function', userId);

      const { data } = await axios.get(`http://localhost:3500/userprofile/${userId}`)
      console.log('response of profile pic-', data);
      setProfileData(data)
      // setImage(data.image);
    } catch (error) {
      console.log(error);
    }
  }
  useEffect(() => {
    getProfileData()
  }, [user])

  const submitData = async (values) => {
    try {
      const userId = user._id
      const { data } = await axios.post('http://localhost:3500/setprofile', { values, userId })
      console.log(data);
      navigate(`/profile/${userId}`)
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div className="flex">
      <div>
        <Settings page={'edit'} />
      </div>

      <div className="w-screen ml-[20%]">
        <div className="text-black rounded-2xl relative p-6 max-w-4xl">
          <form onSubmit={formik.handleSubmit} className="flex flex-col space-y-6">
            {/* Header */}
            <div className="mb-6">
              <h2 className="font-bold text-3xl text-neutral-800 tracking-tight mb-2">Edit Profile</h2>
              <p className="text-neutral-500 text-sm">
                Keep your personal details private. Information you add here is visible to anyone who can view your profile.
              </p>
            </div>

            {/* Name Fields */}
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="border border-gray-300 rounded-3xl p-4 focus-within:outline-2 focus-within:outline-amber-400">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstname"
                    defaultValue={profileData?.firstname || ''}
                    onChange={formik.handleChange}
                    className="w-full focus:outline-none bg-transparent"
                    placeholder="Enter your first name"
                  />
                </div>
              </div>

              <div className="flex-1">
                <div className="border border-gray-300 rounded-3xl p-4 focus-within:outline-2 focus-within:outline-amber-400">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastname"
                    defaultValue={profileData?.lastname || ''}
                    onChange={formik.handleChange}
                    className="w-full focus:outline-none bg-transparent"
                    placeholder="Enter your last name"
                  />
                </div>
              </div>
            </div>

            {/* Bio Field */}
            <div className="border border-gray-300 rounded-3xl p-4 focus-within:outline-2 focus-within:outline-amber-400">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bio
              </label>
              <textarea
                name="bio"
                rows={4}
                defaultValue={profileData?.bio || ''}
                onChange={formik.handleChange}
                className="w-full focus:outline-none bg-transparent resize-none"
                placeholder="Tell us about yourself..."
              />
            </div>

            {/* Location Fields */}
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="border border-gray-300 rounded-3xl p-4 focus-within:outline-2 focus-within:outline-amber-400">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    name="country"
                    defaultValue={profileData?.country || ''}
                    onChange={formik.handleChange}
                    className="w-full focus:outline-none bg-transparent"
                    placeholder="Enter your country"
                  />
                </div>
              </div>

              <div className="flex-1">
                <div className="border border-gray-300 rounded-3xl p-4 focus-within:outline-2 focus-within:outline-amber-400">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    name="state"
                    defaultValue={profileData?.state || ''}
                    onChange={formik.handleChange}
                    className="w-full focus:outline-none bg-transparent"
                    placeholder="Enter your state"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                className="!bg-blue-700 hover:!bg-blue-800 text-white font-medium py-3 px-8 rounded-xl transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
