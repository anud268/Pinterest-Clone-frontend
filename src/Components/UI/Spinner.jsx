export default function Spinner({ className = 'size-6', label }) {
  return (
    <span role={label ? 'status' : undefined} className="inline-flex items-center gap-2">
      <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
        <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
      {label && <span className="sr-only">{label}</span>}
    </span>
  )
}

export function PageSpinner({ label = 'Loading' }) {
  return (
    <div className="flex min-h-[50vh] w-full items-center justify-center text-ink-subtle">
      <Spinner className="size-8" label={label} />
    </div>
  )
}
