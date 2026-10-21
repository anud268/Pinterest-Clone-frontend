import { useSyncExternalStore } from 'react'

// Tiny global toast store, usable from components and plain modules (e.g. the API client).
let toasts = []
const listeners = new Set()
let nextId = 1

const emit = () => listeners.forEach((listener) => listener())

export const dismissToast = (id) => {
  toasts = toasts.filter((t) => t.id !== id)
  emit()
}

const show = (type, message, { duration = 4000 } = {}) => {
  if (!message) return
  const id = nextId++
  toasts = [...toasts.filter((t) => t.message !== message), { id, type, message }].slice(-3)
  emit()
  setTimeout(() => dismissToast(id), duration)
  return id
}

export const toast = {
  success: (message, opts) => show('success', message, opts),
  error: (message, opts) => show('error', message, { duration: 6000, ...opts }),
  info: (message, opts) => show('info', message, opts),
}

const subscribe = (listener) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const useToasts = () => useSyncExternalStore(subscribe, () => toasts)
