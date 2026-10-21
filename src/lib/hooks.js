import { useCallback, useEffect, useRef, useState } from 'react'

export const useDebouncedValue = (value, delay = 250) => {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

// Calls `onVisible` whenever the returned ref's element scrolls near the viewport.
export const useInView = (onVisible, { enabled = true, rootMargin = '800px' } = {}) => {
  const ref = useRef(null)
  const callback = useRef(onVisible)
  useEffect(() => {
    callback.current = onVisible
  })

  useEffect(() => {
    const node = ref.current
    if (!node || !enabled) return
    const observer = new IntersectionObserver(
      (entries) => entries.some((e) => e.isIntersecting) && callback.current(),
      { rootMargin },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [enabled, rootMargin])

  return ref
}

// Width of an element, kept up to date with ResizeObserver.
export const useElementWidth = () => {
  const [width, setWidth] = useState(0)
  const observer = useRef(null)
  const ref = useCallback((node) => {
    observer.current?.disconnect()
    if (!node) return
    setWidth(node.getBoundingClientRect().width)
    observer.current = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    observer.current.observe(node)
  }, [])
  useEffect(() => () => observer.current?.disconnect(), [])
  return [ref, width]
}

// Closes something (menu, popover) on outside pointer-down or Escape.
export const useDismiss = (open, onClose, refs) => {
  const close = useRef(onClose)
  useEffect(() => {
    close.current = onClose
  })
  useEffect(() => {
    if (!open) return
    const onPointer = (event) => {
      if (refs.every((r) => !r.current?.contains(event.target))) close.current()
    }
    const onKey = (event) => event.key === 'Escape' && close.current({ viaKeyboard: true })
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
    // refs are stable ref objects
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])
}

export const useDocumentTitle = (title) => {
  useEffect(() => {
    document.title = title ? `${title} · Pinterest Clone` : 'Pinterest Clone'
  }, [title])
}
