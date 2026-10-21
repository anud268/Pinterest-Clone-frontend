import { forwardRef, useId } from 'react'

const CONTROL =
  'w-full rounded-2xl border border-line bg-white px-4 text-sm text-ink placeholder:text-ink-subtle transition-colors hover:border-ink-subtle focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10 disabled:cursor-not-allowed disabled:bg-surface disabled:text-ink-subtle aria-[invalid=true]:border-danger'

// Labelled input with optional hint and error, wired up with aria attributes.
export const TextField = forwardRef(function TextField(
  { label, hint, error, multiline = false, className = '', trailing, required, ...props },
  ref,
) {
  const id = useId()
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined
  const Control = multiline ? 'textarea' : 'input'

  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-ink">
          {label}
          {required && <span className="text-danger" aria-hidden="true"> *</span>}
        </label>
      )}
      <div className="relative">
        <Control
          ref={ref}
          id={id}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`${CONTROL} ${multiline ? 'min-h-28 resize-y py-3 leading-relaxed' : 'h-12'} ${trailing ? 'pr-12' : ''}`}
          {...props}
        />
        {trailing && <div className="absolute inset-y-0 right-2 flex items-center">{trailing}</div>}
      </div>
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-ink-subtle">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs font-semibold text-danger">
          {error}
        </p>
      )}
    </div>
  )
})

export function Alert({ tone = 'error', children, className = '' }) {
  const tones = {
    error: 'bg-brand-50 text-brand-700 border-brand-100',
    info: 'bg-surface text-ink-muted border-line',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-100',
  }
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`rounded-2xl border px-4 py-3 text-sm font-medium ${tones[tone]} ${className}`}>
      {children}
    </div>
  )
}
