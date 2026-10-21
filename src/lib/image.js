const isImageKit = (url) => {
  try {
    return new URL(url).hostname === 'ik.imagekit.io'
  } catch {
    return false
  }
}

// ImageKit can resize on the fly, so grids download thumbnails instead of full-size originals.
export const imageUrl = (url, width) => {
  if (!url || !width || !isImageKit(url)) return url || ''
  const resized = new URL(url)
  resized.searchParams.set('tr', `w-${width},q-80`)
  return resized.toString()
}

export const imageSrcSet = (url, widths = [236, 474, 736]) =>
  isImageKit(url) ? widths.map((w) => `${imageUrl(url, w)} ${w}w`).join(', ') : undefined

// Height / width, falling back to a typical portrait pin when dimensions are unknown.
export const aspectRatio = (post) =>
  post?.imageWidth && post?.imageHeight ? post.imageHeight / post.imageWidth : null

export const DEFAULT_AVATAR = '/assets/a4121c3d85669215955a4723cd8ca.jpg'
