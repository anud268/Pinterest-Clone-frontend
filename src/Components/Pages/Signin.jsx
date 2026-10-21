import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useFormik } from 'formik'
import * as yup from 'yup'
import { useDispatch } from 'react-redux'
import { IoEyeOffOutline, IoEyeOutline } from 'react-icons/io5'
import { api, errorMessage } from '../../lib/api'
import { useDocumentTitle } from '../../lib/hooks'
import { addUser } from '../Redex/Slice/UserSlice'
import AuthLayout from '../Part/AuthLayout'
import OtpVerification from '../Part/OtpVerification'
import Button, { IconButton } from '../UI/Button'
import { Alert, TextField } from '../UI/Field'

const schema = yup.object({
    email: yup.string().trim().email('Enter a valid email address').required('Email is required'),
    password: yup.string().required('Password is required'),
})

export function PasswordToggle({ visible, onToggle }) {
    return (
        <IconButton label={visible ? 'Hide password' : 'Show password'} size="sm" onClick={onToggle}>
            {visible ? <IoEyeOffOutline /> : <IoEyeOutline />}
        </IconButton>
    )
}

export default function Signin() {
    const navigate = useNavigate()
    const location = useLocation()
    const dispatch = useDispatch()
    const [message, setMessage] = useState(null)
    const [verifyEmail, setVerifyEmail] = useState(null)
    const [showPassword, setShowPassword] = useState(false)
    useDocumentTitle('Sign in')

    const formik = useFormik({
        initialValues: { email: '', password: '' },
        validationSchema: schema,
        onSubmit: async (values) => {
            setMessage(null)
            try {
                const { data } = await api.post('/signin', { values }, { skipAuthHandler: true })
                dispatch(addUser(data.user))
                navigate(location.state?.from?.pathname || '/home', { replace: true })
            } catch (error) {
                if (error.response?.data?.needsVerification) setVerifyEmail(error.response.data.email)
                else setMessage(errorMessage(error))
            }
        },
    })

    if (verifyEmail) {
        return (
            <AuthLayout title="Verify your email" subtitle="One more step before you sign in.">
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
            title="Welcome back"
            subtitle="Sign in to see your feed and saved ideas."
            footer={
                <>
                    New here?{' '}
                    <Link to="/signup" className="font-bold text-ink underline-offset-4 hover:underline">
                        Create an account
                    </Link>
                </>
            }
        >
            <form onSubmit={formik.handleSubmit} noValidate className="flex flex-col gap-4">
                {message && <Alert>{message}</Alert>}
                <TextField label="Email" type="email" autoComplete="email" placeholder="you@example.com" {...fieldProps('email')} />
                <TextField
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Your password"
                    trailing={<PasswordToggle visible={showPassword} onToggle={() => setShowPassword((v) => !v)} />}
                    {...fieldProps('password')}
                />
                <Button type="submit" size="lg" loading={formik.isSubmitting} className="mt-2 w-full">
                    Sign in
                </Button>
            </form>
        </AuthLayout>
    )
}
