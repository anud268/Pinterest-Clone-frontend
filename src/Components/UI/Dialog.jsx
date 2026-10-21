import { useEffect, useId, useRef } from 'react'
import { IoClose } from 'react-icons/io5'
import Button, { IconButton } from './Button'

// Built on the native <dialog> element: focus trapping, Escape and the top layer come for free.
export default function Dialog({ open, onClose, title, description, children, footer, size = 'md', className = '' }) {
  const ref = useRef(null)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-3xl', full: 'max-w-none' }

  return (
    <dialog
      ref={ref}
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => event.target === ref.current && onClose()}
      className={`m-auto w-[calc(100%-2rem)] ${widths[size]} rounded-3xl bg-white p-0 text-ink shadow-pop open:animate-pop-in ${className}`}
    >
      {open && (
        <div className="relative p-6 sm:p-7">
          {title && (
            <div className="mb-4 pr-10">
              <h2 id={titleId} className="text-xl font-bold tracking-tight">
                {title}
              </h2>
              {description && (
                <p id={descriptionId} className="mt-1 text-sm text-ink-muted">
                  {description}
                </p>
              )}
            </div>
          )}
          <IconButton label="Close" onClick={onClose} className="absolute top-4 right-4" size="sm">
            <IoClose />
          </IconButton>
          {children}
          {footer && <div className="mt-6 flex flex-wrap justify-end gap-2">{footer}</div>}
        </div>
      )}
    </dialog>
  )
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  tone = 'danger',
  loading = false,
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    />
  )
}
