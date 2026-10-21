import { forwardRef } from 'react'
import Spinner from './Spinner'
import { BUTTON_BASE, buttonClass, ICON_SIZES, variantClass } from './buttonClass'

const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', loading = false, disabled, className = '', children, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClass({ variant, size, className })}
      {...props}
    >
      {loading && <Spinner className="size-4" />}
      {children}
    </button>
  )
})

// Icon-only button: `label` is required so screen readers and tooltips have text.
export const IconButton = forwardRef(function IconButton(
  { label, variant = 'ghost', size = 'md', className = '', children, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={`${BUTTON_BASE} ${variantClass(variant)} ${ICON_SIZES[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
})

export default Button
