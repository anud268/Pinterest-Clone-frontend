// Display helpers for chat timestamps (always in the viewer's local time zone)
const sameDay = (a, b) => a.toDateString() === b.toDateString()

export const formatTime = (value) => new Date(value).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })

export const formatListTime = (value) => {
  if (!value) return ''
  const date = new Date(value)
  const now = new Date()
  if (sameDay(date, now)) return formatTime(date)
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (sameDay(date, yesterday)) return 'Yesterday'
  if (now - date < 6 * 86400000) return date.toLocaleDateString(undefined, { weekday: 'short' })
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

export const formatDayDivider = (value) => {
  const date = new Date(value)
  const now = new Date()
  if (sameDay(date, now)) return 'Today'
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (sameDay(date, yesterday)) return 'Yesterday'
  return date.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: date.getFullYear() === now.getFullYear() ? undefined : 'numeric' })
}

export const formatDuration = (ms) => {
  const total = Math.max(0, Math.round((ms ?? 0) / 1000))
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

export const formatBytes = (bytes) => {
  if (!bytes && bytes !== 0) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

// One-line preview of a decrypted message for the conversation list
export const previewText = (content) => {
  if (!content) return ''
  switch (content.msgtype) {
    case 'm.image':
      return '📷 Photo'
    case 'm.video':
      return '🎬 Video'
    case 'm.audio':
      return '🎤 Voice message'
    case 'm.file':
      return '📎 File'
    default:
      return content.body ?? ''
  }
}
