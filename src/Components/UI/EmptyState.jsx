// Centered message for empty lists, errors and "nothing here yet" screens.
export default function EmptyState({ icon, title, description, action, className = '' }) {
  return (
    <div className={`mx-auto flex max-w-md flex-col items-center px-6 py-16 text-center ${className}`}>
      {icon && (
        <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-surface text-3xl text-ink-muted" aria-hidden="true">
          {icon}
        </div>
      )}
      <h2 className="text-lg font-bold tracking-tight text-ink">{title}</h2>
      {description && <p className="mt-1.5 text-sm text-ink-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
