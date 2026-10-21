import { useEffect, useId, useRef, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { IoClose, IoSearch } from 'react-icons/io5'
import { FiUser } from 'react-icons/fi'
import { api } from '../../lib/api'
import { useDebouncedValue, useDismiss } from '../../lib/hooks'
import AccountMenu from './AccountMenu'
import Logo from './Logo'
import Spinner from '../UI/Spinner'
import { SEARCH_TYPES } from '../../lib/constants'

function SearchBox() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [params] = useSearchParams()
  const onSearchPage = pathname === '/search'

  const [query, setQuery] = useState(onSearchPage ? params.get('q') ?? '' : '')
  const [type, setType] = useState(onSearchPage && SEARCH_TYPES.includes(params.get('type')) ? params.get('type') : 'Title')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)

  const debounced = useDebouncedValue(query.trim(), 250)
  const wrapperRef = useRef(null)
  const inputRef = useRef(null)
  const listId = useId()

  useDismiss(open, () => setOpen(false), [wrapperRef])

  // Keep the box in sync when the URL changes (back/forward between searches)
  useEffect(() => {
    if (!onSearchPage) return
    setQuery(params.get('q') ?? '')
    if (SEARCH_TYPES.includes(params.get('type'))) setType(params.get('type'))
  }, [onSearchPage, params])

  useEffect(() => {
    if (!debounced) {
      setResults([])
      setLoading(false)
      return
    }
    const controller = new AbortController()
    setLoading(true)
    api
      .get('/searchterms', { params: { searchValue: debounced, select: type }, signal: controller.signal })
      .then(({ data }) => {
        setResults(data.results)
        setActive(-1)
      })
      .catch(() => !controller.signal.aborted && setResults([]))
      .finally(() => !controller.signal.aborted && setLoading(false))
    return () => controller.abort()
  }, [debounced, type])

  const runSearch = (value) => {
    const q = value.trim()
    if (!q) return
    setOpen(false)
    inputRef.current?.blur()
    navigate(`/search?q=${encodeURIComponent(q)}&type=${type}`)
  }

  const choose = (result) => {
    if (type === 'User') {
      setOpen(false)
      setQuery('')
      navigate(`/profile/${result._id}`)
    } else {
      setQuery(result)
      runSearch(result)
    }
  }

  const onKeyDown = (event) => {
    if (event.key === 'ArrowDown' && results.length) {
      event.preventDefault()
      setOpen(true)
      setActive((i) => (i + 1) % results.length)
    } else if (event.key === 'ArrowUp' && results.length) {
      event.preventDefault()
      setActive((i) => (i <= 0 ? results.length - 1 : i - 1))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      if (open && active >= 0 && results[active]) choose(results[active])
      else if (type !== 'User') runSearch(query)
    } else if (event.key === 'Escape') {
      setOpen(false)
    }
  }

  const showList = open && debounced && (results.length > 0 || !loading)
  const optionLabel = (result) => (type === 'User' ? result.fullname : result)

  return (
    <div ref={wrapperRef} className="relative w-full max-w-3xl" role="search">
      <div className="flex h-11 items-center rounded-full bg-surface pl-4 transition-colors focus-within:bg-white focus-within:ring-2 focus-within:ring-ink/15 hover:bg-surface-strong focus-within:hover:bg-white">
        <IoSearch className="shrink-0 text-lg text-ink-subtle" aria-hidden="true" />
        <input
          ref={inputRef}
          id="search"
          type="text"
          role="combobox"
          aria-expanded={Boolean(showList)}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          aria-label={`Search pins by ${type.toLowerCase()}`}
          autoComplete="off"
          enterKeyHint="search"
          placeholder={type === 'User' ? 'Search people' : `Search by ${type.toLowerCase()}`}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className="h-full min-w-0 flex-1 bg-transparent px-3 text-[15px] text-ink placeholder:text-ink-subtle focus:outline-none"
        />
        {loading && <Spinner className="mr-1 size-4 text-ink-subtle" />}
        {query && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setQuery('')
              setResults([])
              inputRef.current?.focus()
            }}
            className="mr-1 rounded-full p-1.5 text-ink-subtle hover:bg-surface-strong hover:text-ink cursor-pointer"
          >
            <IoClose />
          </button>
        )}
        <label className="sr-only" htmlFor={`${listId}-type`}>
          Search by
        </label>
        <select
          id={`${listId}-type`}
          value={type}
          onChange={(e) => {
            setType(e.target.value)
            inputRef.current?.focus()
          }}
          className="h-full shrink-0 cursor-pointer rounded-r-full border-l border-line bg-transparent pr-3 pl-3 text-sm font-semibold text-ink-muted focus:outline-none sm:pr-4"
        >
          {SEARCH_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {showList && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Search suggestions"
          className="absolute inset-x-0 top-full z-50 mt-2 max-h-96 animate-pop-in overflow-y-auto rounded-3xl border border-line bg-white p-2 shadow-pop"
        >
          {results.length === 0 ? (
            <li className="px-4 py-3 text-sm text-ink-muted">
              No {type === 'User' ? 'people' : `${type.toLowerCase()}s`} match “{debounced}”
            </li>
          ) : (
            results.map((result, i) => (
              <li
                key={type === 'User' ? result._id : result}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={active === i}
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => choose(result)}
                onMouseEnter={() => setActive(i)}
                className={`flex cursor-pointer items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-semibold ${
                  active === i ? 'bg-surface' : ''
                }`}
              >
                {type === 'User' ? <FiUser className="text-ink-subtle" aria-hidden="true" /> : <IoSearch className="text-ink-subtle" aria-hidden="true" />}
                <span className="truncate">{optionLabel(result)}</span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}

export default function Navbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-transparent bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="flex h-16 items-center gap-3 px-3 sm:px-5 lg:px-8">
        <div className="md:hidden">
          <Logo />
        </div>
        <div className="flex flex-1 justify-center">
          <SearchBox />
        </div>
        <div className="md:hidden">
          <AccountMenu avatarOnly />
        </div>
      </div>
    </header>
  )
}
