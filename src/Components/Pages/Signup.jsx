import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useFormik } from 'formik'
import * as yup from 'yup'
import { api, errorMessage } from '../../lib/api'
import { useDocumentTitle } from '../../lib/hooks'
import AuthLayout from '../Part/AuthLayout'
import OtpVerification from '../Part/OtpVerification'
import Button from '../UI/Button'
import { Alert, TextField } from '../UI/Field'
import { PasswordToggle } from './Signin'

const validation = yup.object({
  fullname: yup.string().trim().min(3, 'Name must be at least 3 characters').max(50, 'Name must be 50 characters or less').required('Name is required'),
  email: yup.string().trim().email('Enter a valid email address').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
})

export default function Signup() {
  const [message, setMessage] = useState(null)
  const [verifyEmail, setVerifyEmail] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  useDocumentTitle('Sign up')

  const formik = useFormik({
    initialValues: { fullname: '', email: '', password: '' },
    validationSchema: validation,
    onSubmit: async (values) => {
      setMessage(null)
      try {
        const { data } = await api.post('/signup', { values }, { skipAuthHandler: true })
        setVerifyEmail(data.email)
      } catch (error) {
        setMessage(errorMessage(error))
      }
    },
  })

  if (verifyEmail) {
    return (
      <AuthLayout title="Check your email" subtitle="Enter the code we sent to finish creating your account.">
        <OtpVerification email={verifyEmail} onBack={() => setVerifyEmail(null)} />
      </AuthLayout>
    )
  }

  const fieldProps = (name) => ({
    name,
    value: formik.values[name],
    onChange: formik.handleChange,
    onBlur: formik.handleBlur,
    error: formik.touched[name] && formik.errors[name],
  })

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Save ideas, build collections and share what inspires you."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/signin" className="font-bold text-ink underline-offset-4 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={formik.handleSubmit} noValidate className="flex flex-col gap-4">
        {message && <Alert>{message}</Alert>}
        <TextField label="Name" autoComplete="name" placeholder="Your name" {...fieldProps('fullname')} />
        <TextField label="Email" type="email" autoComplete="email" placeholder="you@example.com" {...fieldProps('email')} />
        <TextField
          label="Password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="At least 6 characters"
          trailing={<PasswordToggle visible={showPassword} onToggle={() => setShowPassword((v) => !v)} />}
          {...fieldProps('password')}
        />
        <Button type="submit" size="lg" loading={formik.isSubmitting} className="mt-2 w-full">
          Continue
        </Button>
        <p className="text-center text-xs text-ink-subtle">We&apos;ll email you a code to confirm it&apos;s really you.</p>
      </form>
    </AuthLayout>
  )
}
