import { useDispatch, useSelector } from 'react-redux'
import { Navigate, useLocation } from 'react-router-dom'
import { IoCloudOfflineOutline } from 'react-icons/io5'
import { fetchSession, selectAuthStatus } from './Redex/Slice/UserSlice'
import { PageSpinner } from './UI/Spinner'
import EmptyState from './UI/EmptyState'
import Button from './UI/Button'

// Renders children only for signed-in users; others are sent to sign in and brought back after.
export default function ProtectedRoute({ children }) {
  const status = useSelector(selectAuthStatus)
  const dispatch = useDispatch()
  const location = useLocation()

  if (status === 'idle' || status === 'loading') return <PageSpinner label="Checking your session" />

  if (status === 'error') {
    return (
      <EmptyState
        className="min-h-dvh justify-center"
        icon={<IoCloudOfflineOutline />}
        title="Can't reach the server"
        description="Check your connection and try again."
        action={<Button onClick={() => dispatch(fetchSession())}>Try again</Button>}
      />
    )
  }

  if (status === 'guest') return <Navigate to="/signin" replace state={{ from: location }} />

  return children
}

// Sign-in / sign-up pages: already signed-in users go straight to the app.
export function GuestRoute({ children }) {
  const status = useSelector(selectAuthStatus)
  const location = useLocation()
  if (status === 'idle' || status === 'loading') return <PageSpinner />
  if (status === 'authenticated') return <Navigate to={location.state?.from?.pathname || '/home'} replace />
  return children
}
