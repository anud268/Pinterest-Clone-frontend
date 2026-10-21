import { useCallback, useEffect, useRef, useState } from 'react'
import { useFormik } from 'formik'
import * as yup from 'yup'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { IoAlertCircleOutline } from 'react-icons/io5'
import { api, errorMessage } from '../../lib/api'
import { toast } from '../../lib/toast'
import { useDocumentTitle } from '../../lib/hooks'
import { selectUser, setUserImage } from '../Redex/Slice/UserSlice'
import Avatar from '../UI/Avatar'
import Button from '../UI/Button'
import EmptyState from '../UI/EmptyState'
import { Alert, TextField } from '../UI/Field'
import SettingsHeader from './SettingsHeader'

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const BIO_MAX = 300

const schema = yup.object({
  firstname: yup.string().trim().max(50, 'First name must be 50 characters or less'),
  lastname: yup.string().trim().max(50, 'Last name must be 50 characters or less'),
  bio: yup.string().max(BIO_MAX, `Bio must be ${BIO_MAX} characters or less`),
  country: yup.string().trim().max(60, 'Country must be 60 characters or less'),
  state: yup.string().trim().max(60, 'State must be 60 characters or less'),
})

const FIELDS = ['firstname', 'lastname', 'bio', 'country', 'state']

const toValues = (profile) => Object.fromEntries(FIELDS.map((key) => [key, profile?.[key] ?? '']))

function EditProfileSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading profile" className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="skeleton size-16 rounded-full" />
        <div className="skeleton h-10 w-32 rounded-full" />
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} className="space-y-2">
          <div className="skeleton h-3 w-24 rounded-full" />
          <div className="skeleton h-12 w-full rounded-2xl" />
        </div>
      ))}
    </div>
  )
}

export default function EditProfile() {
  useDocumentTitle('Edit profile')
  const user = useSelector(selectUser)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const fileRef = useRef(null)

  const [profile, setProfile] = useState(null)
  const [status, setStatus] = useState('loading')
  const [loadError, setLoadError] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(null)

  const readOnly = Boolean(user?.adminblock)

  const load = useCallback(async () => {
    setStatus('loading')
    try {
      const { data } = await api.get(`/userprofile/${user._id}`)
      setProfile(data.profile)
      setStatus('ready')
    } catch (error) {
      setLoadError(errorMessage(error, 'Could not load your profile'))
      setStatus('error')
    }
  }, [user._id])

  useEffect(() => {
    load()
  }, [load])

  const formik = useFormik({
    initialValues: toValues(profile),
    enableReinitialize: true,
    validationSchema: schema,
    onSubmit: async (values) => {
      try {
        await api.post('/setprofile', { values })
        toast.success('Profile updated')
        navigate(`/profile/${user._id}`)
      } catch (error) {
        toast.error(errorMessage(error, 'Could not save your profile'))
      }
    },
  })

  const onPhotoChange = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) return toast.error('Please choose an image file')
    if (file.size > MAX_IMAGE_BYTES) return toast.error('Images must be 5MB or smaller')

    const form = new FormData()
    form.append('image', file)
    setUploadProgress(0)
    try {
      const { data } = await api.post('/profilepic', form, {
        onUploadProgress: (e) => e.total && setUploadProgress(Math.round((e.loaded / e.total) * 100)),
      })
      const url = data.profile?.image
      setProfile((p) => ({ ...p, image: url }))
      dispatch(setUserImage(url))
      toast.success('Profile photo updated')
    } catch (error) {
      toast.error(errorMessage(error, 'Could not upload your photo'))
    } finally {
      setUploadProgress(null)
    }
  }

  const fieldProps = (name) => ({
    name,
    value: formik.values[name],
    onChange: formik.handleChange,
    onBlur: formik.handleBlur,
    error: formik.touched[name] && formik.errors[name],
    disabled: readOnly || formik.isSubmitting,
  })

  const header = (
    <SettingsHeader
      title="Edit profile"
      description="Information you add here is visible to anyone who can view your profile."
    />
  )

  if (status === 'loading') {
    return (
      <>
        {header}
        <EditProfileSkeleton />
      </>
    )
  }

  if (status === 'error') {
    return (
      <>
        {header}
        <EmptyState
          icon={<IoAlertCircleOutline />}
          title="We couldn't load your profile"
          description={loadError}
          action={<Button variant="secondary" onClick={load}>Try again</Button>}
        />
      </>
    )
  }

  const uploading = uploadProgress !== null

  return (
    <>
      {header}
      {readOnly && (
        <Alert className="mb-6">Your account has been restricted by an administrator, so your profile can’t be changed.</Alert>
      )}

      <div className="mb-8 flex flex-wrap items-center gap-4">
        <Avatar src={profile?.image || user.image} name={profile?.fullname || user.fullname} size="lg" />
        <div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPhotoChange} tabIndex={-1} aria-hidden="true" />
          <Button variant="secondary" onClick={() => fileRef.current?.click()} disabled={readOnly} loading={uploading}>
            {uploading ? `Uploading ${uploadProgress}%` : 'Change photo'}
          </Button>
          <p className="mt-1.5 text-xs text-ink-subtle">JPG, PNG, WebP or GIF, up to 5MB</p>
        </div>
      </div>

      <form onSubmit={formik.handleSubmit} noValidate className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField label="First name" autoComplete="given-name" placeholder="Your first name" {...fieldProps('firstname')} />
          <TextField label="Last name" autoComplete="family-name" placeholder="Your last name" {...fieldProps('lastname')} />
        </div>
        <TextField
          label="Bio"
          multiline
          rows={4}
          maxLength={BIO_MAX}
          placeholder="Tell people a little about yourself"
          hint={`${formik.values.bio.length}/${BIO_MAX}`}
          {...fieldProps('bio')}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField label="Country" autoComplete="country-name" placeholder="Country" {...fieldProps('country')} />
          <TextField label="State" autoComplete="address-level1" placeholder="State or region" {...fieldProps('state')} />
        </div>
        <div className="flex flex-wrap justify-end gap-2 border-t border-line pt-5">
          <Button variant="secondary" onClick={() => formik.resetForm()} disabled={!formik.dirty || formik.isSubmitting}>
            Reset
          </Button>
          <Button type="submit" loading={formik.isSubmitting} disabled={readOnly || !formik.dirty}>
            Save changes
          </Button>
        </div>
      </form>
    </>
  )
}
