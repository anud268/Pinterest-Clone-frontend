// Title + description shown at the top of each settings page.
export default function SettingsHeader({ title, description }) {
  return (
    <header className="mb-6">
      <h2 className="text-xl font-bold tracking-tight text-ink">{title}</h2>
      {description && <p className="mt-1 text-sm text-ink-muted">{description}</p>}
    </header>
  )
}
