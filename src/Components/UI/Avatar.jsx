import { useState } from 'react'
import { imageUrl } from '../../lib/image'

const SIZES = {
  xs: 'size-6 text-[10px]',
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-16 text-xl',
  xl: 'size-28 text-4xl sm:size-32',
}
const PIXELS = { xs: 48, sm: 64, md: 80, lg: 128, xl: 256 }

const initials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('') || '?'

// Profile photo with an initials fallback when there is no image or it fails to load.
export default function Avatar({ src, name, size = 'md', className = '' }) {
  const [failedSrc, setFailedSrc] = useState(null)
  const showImage = src && failedSrc !== src

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-strong font-bold text-ink-muted ${SIZES[size]} ${className}`}
    >
      {showImage ? (
        <img
          src={imageUrl(src, PIXELS[size])}
          alt=""
          className="size-full object-cover"
          loading="lazy"
          onError={() => setFailedSrc(src)}
        />
      ) : (
        <span aria-hidden="true">{initials(name)}</span>
      )}
    </span>
  )
}
