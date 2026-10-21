import { IoAlertCircle, IoCheckmarkCircle, IoClose, IoInformationCircle } from 'react-icons/io5'
import { dismissToast, useToasts } from '../../lib/toast'

const ICONS = {
  success: <IoCheckmarkCircle className="text-emerald-400" />,
  error: <IoAlertCircle className="text-red-400" />,
  info: <IoInformationCircle className="text-sky-300" />,
}

export default function Toaster() {
  const toasts = useToasts()

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 md:bottom-6"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role={t.type === 'error' ? 'alert' : 'status'}
          className="pointer-events-auto flex max-w-md animate-pop-in items-center gap-3 rounded-2xl bg-ink py-3 pr-2 pl-4 text-sm font-semibold text-white shadow-pop"
        >
          <span className="text-xl" aria-hidden="true">{ICONS[t.type]}</span>
          <span className="flex-1">{t.message}</span>
          <button
            type="button"
            onClick={() => dismissToast(t.id)}
            aria-label="Dismiss notification"
            className="rounded-full p-1.5 text-white/70 hover:bg-white/10 hover:text-white cursor-pointer"
          >
            <IoClose />
          </button>
        </div>
      ))}
    </div>
  )
}
