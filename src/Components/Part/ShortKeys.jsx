import { useDocumentTitle } from '../../lib/hooks'
import { SHORTCUTS } from '../../lib/constants'
import { Alert } from '../UI/Field'
import SettingsHeader from './SettingsHeader'

export default function ShortKeys() {
  useDocumentTitle('Keyboard shortcuts')

  return (
    <>
      <SettingsHeader title="Keyboard shortcuts" description="Move around faster without leaving the keyboard." />
      <dl className="divide-y divide-line rounded-3xl border border-line">
        {SHORTCUTS.map((shortcut) => (
          <div key={shortcut.key} className="flex items-center justify-between gap-4 px-5 py-3.5">
            <dt className="text-sm font-medium text-ink">{shortcut.description}</dt>
            <dd className="flex shrink-0 items-center gap-1">
              {shortcut.key.split(' + ').map((part, i) => (
                <span key={part} className="flex items-center gap-1">
                  {i > 0 && <span className="text-xs text-ink-subtle" aria-hidden="true">+</span>}
                  <kbd className="inline-flex h-7 min-w-7 items-center justify-center rounded-lg border border-line bg-surface px-2 font-mono text-xs font-bold text-ink">
                    {part}
                  </kbd>
                </span>
              ))}
            </dd>
          </div>
        ))}
      </dl>
      <Alert tone="info" className="mt-6">
        Shortcuts are ignored while you’re typing in a text field, and when a dialog is open.
      </Alert>
    </>
  )
}
