const VARIANTS = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-700',
  secondary: 'bg-surface text-ink hover:bg-surface-strong',
  dark: 'bg-ink text-white hover:bg-black',
  ghost: 'bg-transparent text-ink hover:bg-surface',
  outline: 'border border-line bg-white text-ink hover:bg-surface',
  danger: 'bg-danger text-white hover:bg-brand-700',
  overlay: 'bg-white/90 text-ink shadow-card backdrop-blur hover:bg-white',
}

const SIZES = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
}

export const ICON_SIZES = { sm: 'size-8 text-base', md: 'size-10 text-lg', lg: 'size-12 text-xl' }

export const BUTTON_BASE =
  'inline-flex shrink-0 items-center justify-center rounded-full font-semibold whitespace-nowrap select-none transition-colors duration-150 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50'

export const variantClass = (variant) => VARIANTS[variant]

// Button styling for links and other elements that should look like a button
export const buttonClass = ({ variant = 'primary', size = 'md', className = '' } = {}) =>
  `${BUTTON_BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`
