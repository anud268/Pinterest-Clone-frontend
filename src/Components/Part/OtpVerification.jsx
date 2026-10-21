import { useEffect, useRef, useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { api, errorMessage } from '../../lib/api'
import { toast } from '../../lib/toast'
import { addUser } from '../Redex/Slice/UserSlice'
import Button from '../UI/Button'
import { Alert, TextField } from '../UI/Field'

const RESEND_COOLDOWN = 30

// Second step of sign-up (or sign-in for unverified accounts): the code is checked by the server.
export default function OtpVerification({ email, onBack }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN)
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  const verify = async (event) => {
    event.preventDefault()
    if (!/^\d{6}$/.test(code)) return setError('Enter the 6-digit code from your email.')
    setSubmitting(true)
    setError(null)
    try {
      const { data } = await api.post('/verifyotp', { email, otp: code }, { skipAuthHandler: true })
      dispatch(addUser(data.user))
      toast.success(`Welcome, ${data.user.fullname}!`)
      navigate('/home', { replace: true })
    } catch (err) {
      setError(errorMessage(err))
      setCode('')
      inputRef.current?.focus()
    } finally {
      setSubmitting(false)
    }
  }

  const resend = async () => {
    try {
      await api.post('/resendotp', { email }, { skipAuthHandler: true })
      setCooldown(RESEND_COOLDOWN)
      setError(null)
      toast.success('A new code is on its way')
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  return (
    <form onSubmit={verify} noValidate className="flex flex-col gap-5">
      <p className="text-sm text-ink-muted">
        We sent a 6-digit code to <strong className="text-ink">{email}</strong>. It expires in 10 minutes.
      </p>
      {error && <Alert>{error}</Alert>}
      <TextField
        ref={inputRef}
        label="Verification code"
        name="otp"
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        placeholder="••••••"
        className="[&_input]:text-center [&_input]:text-2xl [&_input]:font-bold [&_input]:tracking-[0.5em]"
      />
      <Button type="submit" size="lg" loading={submitting} className="w-full">
        Verify and continue
      </Button>
      <div className="flex items-center justify-between text-sm">
        <button type="button" onClick={onBack} className="font-semibold text-ink-muted hover:text-ink cursor-pointer">
          Use a different email
        </button>
        <button
          type="button"
          onClick={resend}
          disabled={cooldown > 0}
          className="font-semibold text-brand-600 hover:text-brand-700 disabled:text-ink-subtle cursor-pointer disabled:cursor-not-allowed"
        >
          {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
        </button>
      </div>
    </form>
  )
}
