// "example.com" for a destination link; null for missing or malformed URLs (some legacy pins have those).
export const siteName = (url) => {
  try {
    return url ? new URL(url).hostname.replace(/^www\./, '') : null
  } catch {
    return null
  }
}
