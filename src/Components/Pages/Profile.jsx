import { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CiCamera } from 'react-icons/ci'
import { IoBanOutline, IoChatbubbleEllipsesOutline, IoLocationOutline, IoPersonOutline, IoShareSocialOutline } from 'react-icons/io5'
import { openConversationWith } from '../../chat/chatStore'
import { api, errorMessage } from '../../lib/api'
import { toast } from '../../lib/toast'
import { useDocumentTitle } from '../../lib/hooks'
import { selectUser, setUserImage } from '../Redex/Slice/UserSlice'
import MyPosts from '../Part/MyPosts'
import Saved from '../Part/Saved'
import Avatar from '../UI/Avatar'
import Button from '../UI/Button'
import { buttonClass } from '../UI/buttonClass'
import { ConfirmDialog } from '../UI/Dialog'
import EmptyState from '../UI/EmptyState'
import Spinner from '../UI/Spinner'

const MAX_BYTES = 5 * 1024 * 1024

function ProfileSkeleton() {
  return (
    <div className="flex flex-col items-center gap-3 py-6" aria-busy="true" aria-label="Loading profile">
      <div className="skeleton size-28 rounded-full sm:size-32" />
      <div className="skeleton h-8 w-56 rounded-xl" />
      <div className="skeleton h-4 w-72 max-w-full rounded-full" />
      <div className="mt-2 flex gap-2">
        <div className="skeleton h-10 w-28 rounded-full" />
        <div className="skeleton h-10 w-24 rounded-full" />
      </div>
    </div>
  )
}

function AvatarUploader({ profile, onUploaded }) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)

  const upload = async (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) return toast.error('Please choose an image file.')
    if (file.size > MAX_BYTES) return toast.error('Images must be 5MB or smaller.')
    const form = new FormData()
    form.append('image', file)
    setUploading(true)
    try {
      const { data } = await api.post('/profilepic', form)
      onUploaded(data.profile.image)
      toast.success('Profile photo updated')
    } catch (error) {
      toast.error(errorMessage(error, 'Could not update your photo'))
    } finally {
      setUploading(false)
      inputRef.current.value = ''
    }
  }

  return (
    <div className="relative">
      <Avatar src={profile.image} name={profile.fullname} size="xl" className="ring-4 ring-white shadow-card" />
      {uploading && (
        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-white">
          <Spinner label="Uploading photo" />
        </span>
      )}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        aria-label="Change profile photo"
        title="Change profile photo"
        className="absolute right-0 bottom-1 flex size-10 items-center justify-center rounded-full border-2 border-white bg-ink text-xl text-white shadow-card hover:bg-black cursor-pointer disabled:opacity-60"
      >
        <CiCamera aria-hidden="true" />
      </button>
      <input ref={inputRef} type="file" accept="image/*" className="sr-only" tabIndex={-1} onChange={(e) => upload(e.target.files?.[0])} />
    </div>
  )
}

export default function Profile() {
  const { id } = useParams()
  const dispatch = useDispatch()
  const user = useSelector(selectUser)
  const isOwn = id === user?._id

  const [profile, setProfile] = useState(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)
  const [blocked, setBlocked] = useState(false)
  const [tab, setTab] = useState('created')
  const [confirmBlock, setConfirmBlock] = useState(false)
  const [blocking, setBlocking] = useState(false)
  const [openingChat, setOpeningChat] = useState(false)
  const navigate = useNavigate()

  const displayName = profile ? [profile.firstname, profile.lastname].filter(Boolean).join(' ') || profile.fullname : ''
  useDocumentTitle(displayName || 'Profile')

  useEffect(() => {
    const controller = new AbortController()
    setStatus('loading')
    setTab('created')
    const requests = [api.get(`/userprofile/${id}`, { signal: controller.signal })]
    if (!isOwn) requests.push(api.get('/isblock', { params: { userId: id }, signal: controller.signal }))

    Promise.all(requests)
      .then(([profileRes, blockRes]) => {
        setProfile(profileRes.data.profile)
        setBlocked(Boolean(blockRes?.data.blocked))
        setStatus('ready')
      })
      .catch((err) => {
        if (controller.signal.aborted) return
        const missing = [400, 404].includes(err.response?.status)
        setError(missing ? 'not-found' : errorMessage(err))
        setStatus('error')
      })
    return () => controller.abort()
  }, [id, isOwn])

  const toggleBlock = async () => {
    setBlocking(true)
    try {
      const { data } = await api.post('/userblock', { id })
      setBlocked(data.blocked)
      toast.success(data.message)
      setConfirmBlock(false)
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBlocking(false)
    }
  }

  const startChat = async () => {
    setOpeningChat(true)
    try {
      const conversation = await openConversationWith(id)
      navigate(`/messages/${conversation._id}`)
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setOpeningChat(false)
    }
  }

  const shareProfile = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/profile/${id}`)
      toast.success('Profile link copied')
    } catch {
      toast.error('Could not copy the link')
    }
  }

  if (status === 'loading') return <ProfileSkeleton />
  if (status === 'error') {
    return error === 'not-found' ? (
      <EmptyState icon={<IoPersonOutline />} title="This profile isn't available" description="The account may not exist or has been restricted." />
    ) : (
      <EmptyState title="We couldn't load this profile" description={error} />
    )
  }

  const place = [profile.state, profile.country].filter(Boolean).join(', ')
  const joined = profile.createdAt ? new Date(profile.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : null
  const tabs = isOwn ? [{ id: 'created', label: 'Created' }, { id: 'saved', label: 'Saved' }] : [{ id: 'created', label: 'Created' }]

  return (
    <div className="pt-4">
      <header className="mx-auto flex max-w-2xl flex-col items-center text-center">
        {isOwn ? (
          <AvatarUploader
            profile={profile}
            onUploaded={(image) => {
              setProfile((p) => ({ ...p, image }))
              dispatch(setUserImage(image))
            }}
          />
        ) : (
          <Avatar src={profile.image} name={profile.fullname} size="xl" className="ring-4 ring-white shadow-card" />
        )}

        <h1 className="mt-4 text-3xl font-extrabold tracking-tight break-words sm:text-4xl">{displayName}</h1>
        {displayName !== profile.fullname && <p className="mt-1 text-sm font-semibold text-ink-muted">{profile.fullname}</p>}
        {profile.bio && <p className="mt-3 max-w-lg leading-relaxed break-words text-ink-muted">{profile.bio}</p>}

        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-ink-subtle">
          {place && (
            <span className="inline-flex items-center gap-1">
              <IoLocationOutline aria-hidden="true" /> {place}
            </span>
          )}
          {joined && <span>Joined {joined}</span>}
        </div>

        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Button variant="secondary" onClick={shareProfile}>
            <IoShareSocialOutline aria-hidden="true" /> Share
          </Button>
          {isOwn ? (
            <Link to="/settings/profile/edit" className={buttonClass({ variant: 'secondary' })}>
              Edit profile
            </Link>
          ) : (
            <>
              {!blocked && (
                <Button onClick={startChat} loading={openingChat}>
                  <IoChatbubbleEllipsesOutline aria-hidden="true" /> Message
                </Button>
              )}
              <Button variant={blocked ? 'secondary' : 'outline'} onClick={() => setConfirmBlock(true)}>
                <IoBanOutline aria-hidden="true" /> {blocked ? 'Unblock' : 'Block'}
              </Button>
            </>
          )}
        </div>
      </header>

      {blocked ? (
        <EmptyState
          className="mt-6"
          icon={<IoBanOutline />}
          title={`You blocked ${profile.fullname}`}
          description="You won't see their pins in your feed or on their profile."
          action={<Button variant="secondary" onClick={() => setConfirmBlock(true)}>Unblock</Button>}
        />
      ) : (
        <section className="mt-8">
          <div role="tablist" aria-label="Profile pins" className="mb-6 flex justify-center gap-2">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                id={`tab-${t.id}`}
                aria-selected={tab === t.id}
                aria-controls={`panel-${t.id}`}
                onClick={() => setTab(t.id)}
                className={`relative h-10 px-4 text-[15px] font-bold transition-colors cursor-pointer ${
                  tab === t.id ? 'text-ink' : 'text-ink-subtle hover:text-ink'
                }`}
              >
                {t.label}
                {tab === t.id && <span className="absolute inset-x-3 -bottom-0.5 h-[3px] rounded-full bg-ink" aria-hidden="true" />}
              </button>
            ))}
          </div>
          <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
            {tab === 'created' ? <MyPosts id={id} isOwn={isOwn} /> : <Saved embedded />}
          </div>
        </section>
      )}

      <ConfirmDialog
        open={confirmBlock}
        onClose={() => setConfirmBlock(false)}
        onConfirm={toggleBlock}
        loading={blocking}
        tone={blocked ? 'primary' : 'danger'}
        title={blocked ? `Unblock ${profile.fullname}?` : `Block ${profile.fullname}?`}
        description={
          blocked
            ? 'Their pins will appear in your feed and search again.'
            : "You won't see their pins in your feed, search or on their profile. They won't be notified."
        }
        confirmLabel={blocked ? 'Unblock' : 'Block'}
      />
    </div>
  )
}
