import { Link } from 'react-router-dom'

export default function Logo({ showName = false, to = '/home', className = '' }) {
  return (
    <Link to={to} className={`inline-flex items-center gap-2.5 rounded-full ${className}`} aria-label="Pinterest Clone home">
      <img src="/assets/white & blue pinterest icon.png" alt="" className="size-9 object-contain" width="36" height="36" />
      {showName && <span className="text-lg font-extrabold tracking-tight text-brand-600">pinclone</span>}
    </Link>
  )
}
