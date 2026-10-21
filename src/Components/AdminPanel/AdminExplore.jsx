import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { IoAlertCircleOutline, IoClose, IoImageOutline, IoImagesOutline } from 'react-icons/io5'
import { FiTrash2 } from 'react-icons/fi'
import { api, errorMessage } from '../../lib/api'
import { useDocumentTitle } from '../../lib/hooks'
import { imageUrl } from '../../lib/image'
import { toast } from '../../lib/toast'
import Button, { IconButton } from '../UI/Button'
import { ConfirmDialog } from '../UI/Dialog'
import EmptyState from '../UI/EmptyState'
import { Alert, TextField } from '../UI/Field'
import { AdminHeader } from './AdminLayout'

const MAX_BYTES = 5 * 1024 * 1024
const TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']

const validateFile = (file) => {
  if (!file) return 'Please choose an image'
  if (!TYPES.includes(file.type)) return 'Use a JPEG, PNG, WebP, GIF or AVIF image'
  if (file.size > MAX_BYTES) return 'Images must be 5MB or smaller'
  return null
}

export default function AdminExplore() {
  useDocumentTitle('Admin · Explore cards')
  const selectId = useId()
  const fileInputId = useId()
  const fileRef = useRef(null)

  const [cards, setCards] = useState([])
  const [cardsStatus, setCardsStatus] = useState('loading')
  const [cardsError, setCardsError] = useState(null)
  const [categories, setCategories] = useState([])
  const [categoriesError, setCategoriesError] = useState(null)

  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [errors, setErrors] = useState({})
  const [dragging, setDragging] = useState(false)
  const [progress, setProgress] = useState(null)
  const [submitError, setSubmitError] = useState(null)

  const [removing, setRemoving] = useState(null)
  const [removeBusy, setRemoveBusy] = useState(false)

  const loadCards = useCallback(async (signal) => {
    setCardsStatus('loading')
    try {
      const { data } = await api.get('/fetchcards', { signal })
      setCards(data.cards)
      setCardsStatus('ready')
    } catch (err) {
      if (signal?.aborted) return
      setCardsError(errorMessage(err))
      setCardsStatus('error')
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    loadCards(controller.signal)
    api
      .get('/fetchcat', { signal: controller.signal })
      .then(({ data }) => setCategories(data.categories))
      .catch((err) => !controller.signal.aborted && setCategoriesError(errorMessage(err, 'Could not load categories')))
    return () => controller.abort()
  }, [loadCards])

  // Release the preview object URL when it changes or the page unmounts
  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview])

  const pickFile = (next) => {
    const message = validateFile(next)
    setErrors((e) => ({ ...e, image: message }))
    if (message) return
    setFile(next)
    setPreview(URL.createObjectURL(next))
  }

  const clearFile = () => {
    setFile(null)
    setPreview('')
    if (fileRef.current) fileRef.current.value = ''
  }

  const submit = async (event) => {
    event.preventDefault()
    const next = {
      image: validateFile(file),
      title: title ? null : 'Please choose a category',
      subtitle: subtitle.trim() ? null : 'Please add a short description',
    }
    setErrors(next)
    if (Object.values(next).some(Boolean)) return

    const form = new FormData()
    form.append('image', file)
    form.append('title', title)
    form.append('subtitle', subtitle.trim())

    setSubmitError(null)
    setProgress(0)
    try {
      const { data } = await api.post('/setexplore', form, {
        onUploadProgress: (e) => e.total && setProgress(Math.round((e.loaded / e.total) * 100)),
      })
      setCards((list) => [data.card, ...list.filter((c) => c._id !== data.card._id)])
      setCardsStatus('ready')
      clearFile()
      setTitle('')
      setSubtitle('')
      toast.success('Explore card created')
    } catch (err) {
      setSubmitError(errorMessage(err, 'Could not create the card'))
    } finally {
      setProgress(null)
    }
  }

  const removeCard = async () => {
    setRemoveBusy(true)
    try {
      await api.post('/removecards', { cardId: removing._id })
      setCards((list) => list.filter((c) => c._id !== removing._id))
      toast.success('Card removed')
      setRemoving(null)
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setRemoveBusy(false)
    }
  }

  const uploading = progress !== null

  return (
    <>
      <AdminHeader title="Explore cards" description="Cards appear on the Explore page and open pins from their category." />

      <form onSubmit={submit} noValidate className="mb-10 grid gap-6 rounded-3xl border border-line p-4 sm:p-6 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
        <div>
          <span className="mb-1.5 block text-sm font-semibold">
            Cover image <span className="text-danger" aria-hidden="true">*</span>
          </span>
          {preview ? (
            <div className="relative overflow-hidden rounded-2xl bg-surface">
              <img src={preview} alt="Selected cover preview" className="aspect-[4/3] w-full object-cover" />
              <IconButton label="Remove image" variant="overlay" size="sm" onClick={clearFile} className="absolute top-2 right-2" disabled={uploading}>
                <IoClose />
              </IconButton>
            </div>
          ) : (
            <label
              htmlFor={fileInputId}
              onDragOver={(e) => {
                e.preventDefault()
                setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDragging(false)
                pickFile(e.dataTransfer.files?.[0])
              }}
              className={`flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 text-center transition-colors ${
                dragging ? 'border-ink bg-surface' : 'border-line bg-surface/50 hover:border-ink-subtle'
              } ${errors.image ? 'border-danger' : ''}`}
            >
              <IoImageOutline className="text-3xl text-ink-subtle" aria-hidden="true" />
              <span className="text-sm font-semibold">Drag an image here or click to browse</span>
              <span className="text-xs text-ink-subtle">JPEG, PNG, WebP, GIF or AVIF, up to 5MB</span>
            </label>
          )}
          <input
            ref={fileRef}
            id={fileInputId}
            type="file"
            accept={TYPES.join(',')}
            className="sr-only"
            onChange={(e) => pickFile(e.target.files?.[0])}
            aria-invalid={errors.image ? true : undefined}
          />
          {errors.image && <p className="mt-1.5 text-xs font-semibold text-danger">{errors.image}</p>}
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label htmlFor={selectId} className="mb-1.5 block text-sm font-semibold">
              Category <span className="text-danger" aria-hidden="true">*</span>
            </label>
            <select
              id={selectId}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              aria-invalid={errors.title ? true : undefined}
              className="h-12 w-full cursor-pointer rounded-2xl border border-line bg-white px-4 text-sm focus:border-ink focus:ring-2 focus:ring-ink/10 focus:outline-none aria-[invalid=true]:border-danger"
            >
              <option value="">Choose a category</option>
              {categories.map((c) => (
                <option key={c._id} value={c.category}>
                  {c.category}
                </option>
              ))}
            </select>
            {errors.title && <p className="mt-1.5 text-xs font-semibold text-danger">{errors.title}</p>}
            {categoriesError && <p className="mt-1.5 text-xs font-semibold text-danger">{categoriesError}</p>}
            {!categoriesError && categories.length === 0 && (
              <p className="mt-1.5 text-xs text-ink-subtle">Create a category on the Categories &amp; tags page first.</p>
            )}
          </div>

          <TextField
            label="Description"
            required
            multiline
            maxLength={200}
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="A short line shown on the card"
            hint={`${subtitle.length}/200`}
            error={errors.subtitle}
          />

          {submitError && <Alert>{submitError}</Alert>}

          {uploading && (
            <div>
              <div className="h-2 overflow-hidden rounded-full bg-surface" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Upload progress">
                <div className="h-full rounded-full bg-brand-600 transition-[width]" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-1 text-xs text-ink-muted">{progress < 100 ? `Uploading… ${progress}%` : 'Processing…'}</p>
            </div>
          )}

          <div className="mt-auto flex justify-end">
            <Button type="submit" loading={uploading}>
              Create card
            </Button>
          </div>
        </div>
      </form>

      <h2 className="mb-4 text-lg font-bold">
        Current cards {cardsStatus === 'ready' && <span className="text-ink-subtle">({cards.length})</span>}
      </h2>

      {cardsStatus === 'loading' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label="Loading cards">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="skeleton aspect-[4/3] rounded-3xl" />
          ))}
        </div>
      )}
      {cardsStatus === 'error' && (
        <EmptyState
          icon={<IoAlertCircleOutline />}
          title="We couldn't load cards"
          description={cardsError}
          action={<Button variant="secondary" onClick={() => loadCards()}>Try again</Button>}
        />
      )}
      {cardsStatus === 'ready' && cards.length === 0 && (
        <EmptyState icon={<IoImagesOutline />} title="No explore cards yet" description="Create your first card with the form above." />
      )}
      {cardsStatus === 'ready' && cards.length > 0 && (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <li key={card._id} className="relative overflow-hidden rounded-3xl bg-surface">
              <img src={imageUrl(card.image, 600)} alt="" loading="lazy" className="aspect-[4/3] w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" aria-hidden="true" />
              <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                <p className="text-xs font-medium opacity-90">{card.subtitle}</p>
                <p className="text-xl font-extrabold tracking-tight">{card.title}</p>
              </div>
              <IconButton label={`Remove ${card.title} card`} variant="overlay" size="sm" onClick={() => setRemoving(card)} className="absolute top-3 right-3">
                <FiTrash2 />
              </IconButton>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(removing)}
        onClose={() => setRemoving(null)}
        onConfirm={removeCard}
        loading={removeBusy}
        title="Remove this card?"
        description={`The “${removing?.title ?? ''}” card will disappear from Explore. Pins in the category are not affected.`}
        confirmLabel="Remove"
      />
    </>
  )
}
