import { useCallback, useEffect, useId, useState } from 'react'
import { IoAlertCircleOutline, IoChevronDown, IoPricetagsOutline } from 'react-icons/io5'
import { api, errorMessage } from '../../lib/api'
import { useDocumentTitle } from '../../lib/hooks'
import { toast } from '../../lib/toast'
import Button from '../UI/Button'
import EmptyState from '../UI/EmptyState'
import { TextField } from '../UI/Field'
import { AdminHeader } from './AdminLayout'

const TAG_PATTERN = /^#[A-Za-z0-9_]{1,40}$/

export default function AdminTags() {
  useDocumentTitle('Admin · Categories & tags')
  const selectId = useId()

  const [categories, setCategories] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)
  const [expanded, setExpanded] = useState(null)

  const [newCategory, setNewCategory] = useState('')
  const [categoryError, setCategoryError] = useState(null)
  const [savingCategory, setSavingCategory] = useState(false)

  const [tagCategory, setTagCategory] = useState('')
  const [tag, setTag] = useState('')
  const [tagErrors, setTagErrors] = useState({})
  const [savingTag, setSavingTag] = useState(false)

  const load = useCallback(async (signal) => {
    setStatus('loading')
    try {
      const { data } = await api.get('/fetchcat', { signal })
      setCategories(data.categories)
      setStatus('ready')
    } catch (err) {
      if (signal?.aborted) return
      setError(errorMessage(err))
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal)
    return () => controller.abort()
  }, [load])

  const addCategory = async (event) => {
    event.preventDefault()
    const category = newCategory.trim()
    if (!category) return setCategoryError('Enter a category name')
    setCategoryError(null)
    setSavingCategory(true)
    try {
      const { data } = await api.post('/addcategory', { values: { category } })
      setCategories((list) => [...list, data.category].sort((a, b) => a.category.localeCompare(b.category)))
      setNewCategory('')
      setTagCategory(data.category._id)
      toast.success(`Category “${category}” added`)
    } catch (err) {
      setCategoryError(errorMessage(err, 'Could not add the category'))
    } finally {
      setSavingCategory(false)
    }
  }

  const addTag = async (event) => {
    event.preventDefault()
    const raw = tag.trim()
    const value = raw && !raw.startsWith('#') ? `#${raw}` : raw
    const errors = {
      category: tagCategory ? null : 'Choose a category',
      tag: TAG_PATTERN.test(value) ? null : "Tags start with '#' and use only letters, numbers or underscores (no spaces)",
    }
    setTagErrors(errors)
    if (errors.category || errors.tag) return

    setSavingTag(true)
    try {
      const { data } = await api.post('/settags', { tag: value, category: tagCategory })
      setCategories((list) => list.map((c) => (c._id === data.category._id ? data.category : c)))
      setTag('')
      setExpanded(data.category._id)
      toast.success(`${value} added to ${data.category.category}`)
    } catch (err) {
      setTagErrors({ tag: errorMessage(err, 'Could not add the tag') })
    } finally {
      setSavingTag(false)
    }
  }

  return (
    <>
      <AdminHeader title="Categories & tags" description="Categories group tags; Explore cards show every pin tagged with one of a category's tags." />

      <div className="mb-10 grid gap-4 lg:grid-cols-2">
        <form onSubmit={addCategory} noValidate className="rounded-3xl border border-line p-4 sm:p-6">
          <h2 className="mb-4 text-lg font-bold">New category</h2>
          <TextField
            label="Category name"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            maxLength={60}
            placeholder="e.g. Fashion"
            error={categoryError}
          />
          <div className="mt-4 flex justify-end">
            <Button type="submit" loading={savingCategory}>Add category</Button>
          </div>
        </form>

        <form onSubmit={addTag} noValidate className="rounded-3xl border border-line p-4 sm:p-6">
          <h2 className="mb-4 text-lg font-bold">Add a tag</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor={selectId} className="mb-1.5 block text-sm font-semibold">Category</label>
              <select
                id={selectId}
                value={tagCategory}
                onChange={(e) => setTagCategory(e.target.value)}
                aria-invalid={tagErrors.category ? true : undefined}
                className="h-12 w-full cursor-pointer rounded-2xl border border-line bg-white px-4 text-sm focus:border-ink focus:ring-2 focus:ring-ink/10 focus:outline-none aria-[invalid=true]:border-danger"
              >
                <option value="">Choose a category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>{c.category}</option>
                ))}
              </select>
              {tagErrors.category && <p className="mt-1.5 text-xs font-semibold text-danger">{tagErrors.category}</p>}
            </div>
            <TextField
              label="Tag"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              maxLength={41}
              placeholder="#StreetStyle"
              error={tagErrors.tag}
            />
          </div>
          <div className="mt-4 flex justify-end">
            <Button type="submit" loading={savingTag}>Add tag</Button>
          </div>
        </form>
      </div>

      <h2 className="mb-4 text-lg font-bold">
        Categories {status === 'ready' && <span className="text-ink-subtle">({categories.length})</span>}
      </h2>

      {status === 'loading' && (
        <div className="space-y-2" aria-busy="true" aria-label="Loading categories">
          {Array.from({ length: 4 }, (_, i) => <div key={i} className="skeleton h-14 rounded-2xl" />)}
        </div>
      )}
      {status === 'error' && (
        <EmptyState
          icon={<IoAlertCircleOutline />}
          title="We couldn't load categories"
          description={error}
          action={<Button variant="secondary" onClick={() => load()}>Try again</Button>}
        />
      )}
      {status === 'ready' && categories.length === 0 && (
        <EmptyState icon={<IoPricetagsOutline />} title="No categories yet" description="Add your first category above." />
      )}
      {status === 'ready' && categories.length > 0 && (
        <ul className="space-y-2">
          {categories.map((cat) => {
            const open = expanded === cat._id
            const tags = cat.tags ?? []
            return (
              <li key={cat._id} className="overflow-hidden rounded-2xl border border-line">
                <h3>
                  <button
                    type="button"
                    aria-expanded={open}
                    aria-controls={`tags-${cat._id}`}
                    onClick={() => setExpanded(open ? null : cat._id)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left font-semibold hover:bg-surface cursor-pointer"
                  >
                    <span className="truncate">{cat.category}</span>
                    <span className="flex shrink-0 items-center gap-2 text-sm text-ink-muted">
                      {tags.length} {tags.length === 1 ? 'tag' : 'tags'}
                      <IoChevronDown className={`transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
                    </span>
                  </button>
                </h3>
                {open && (
                  <div id={`tags-${cat._id}`} className="border-t border-line bg-surface/40 px-4 py-3">
                    {tags.length ? (
                      <ul className="flex flex-wrap gap-2">
                        {tags.map((t) => (
                          <li key={t} className="rounded-full bg-white px-3 py-1 text-xs font-semibold shadow-card">{t}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-ink-muted">No tags yet. Add one with the form above.</p>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
