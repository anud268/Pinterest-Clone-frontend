import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { api, errorMessage } from '../../lib/api'
import { toast } from '../../lib/toast'
import { signedOut } from '../Redex/Slice/UserSlice'
import { feedReset } from '../Redex/Slice/PostSlice'

// Ends the session on the server, clears local state and returns to sign in.
export default function useSignOut() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  return async () => {
    try {
      await api.post('/logout')
    } catch (error) {
      return toast.error(errorMessage(error, 'Could not sign out. Please try again.'))
    }
    dispatch(signedOut())
    dispatch(feedReset())
    navigate('/signin', { replace: true })
    toast.success('You have signed out')
  }
}
