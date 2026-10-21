import { useCallback, useEffect, useState } from 'react'
import { IoLaptopOutline, IoLockClosedOutline } from 'react-icons/io5'
import { api, errorMessage } from '../../lib/api'
import { toast } from '../../lib/toast'
import { useDocumentTitle } from '../../lib/hooks'
import { formatFingerprint } from '../../chat/cryptoEngine'
import { currentDeviceId, listServerDevices, ownDevice, removeServerDevice } from '../../chat/chatStore'
import Button from '../UI/Button'
import { ConfirmDialog } from '../UI/Dialog'
import Spinner from '../UI/Spinner'
import SettingsHeader from './SettingsHeader'

function Toggle({ id, label, description, checked, onChange, disabled }) {
  return (
    <div className="flex items-start justify-between gap-4 py-4">
      <div>
        <label htmlFor={id} className="text-sm font-semibold">
          {label}
        </label>
        <p className="mt-0.5 text-sm text-ink-muted">{description}</p>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors cursor-pointer disabled:opacity-50 ${checked ? 'bg-ink' : 'bg-surface-strong'}`}
      >
        <span className={`absolute top-1 left-1 size-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  )
}

export default function ChatSettings() {
  useDocumentTitle('Chat & privacy')
  const [settings, setSettings] = useState(null)
  const [devices, setDevices] = useState(null)
  const [mine, setMine] = useState(null)
  const [removing, setRemoving] = useState(null)
  const [busy, setBusy] = useState(false)

  const loadDevices = useCallback(async () => {
    try {
      setDevices(await listServerDevices())
    } catch (error) {
      toast.error(errorMessage(error))
      setDevices([])
    }
  }, [])

  useEffect(() => {
    api.get('/chat/settings').then(({ data }) => setSettings(data.settings)).catch(() => setSettings({ showPresence: true, sendReadReceipts: true }))
    loadDevices()
    ownDevice().then(setMine).catch(() => {})
  }, [loadDevices])

  const update = async (patch) => {
    const previous = settings
    setSettings({ ...settings, ...patch })
    try {
      const { data } = await api.patch('/chat/settings', patch)
      setSettings(data.settings)
    } catch (error) {
      setSettings(previous)
      toast.error(errorMessage(error))
    }
  }

  const current = currentDeviceId()

  return (
    <div>
      <SettingsHeader title="Chat & privacy" description="Control what others see while you chat, and manage the devices that can decrypt your messages." />

      <section className="rounded-3xl border border-line px-5" aria-label="Privacy">
        {!settings ? (
          <div className="flex justify-center py-8 text-ink-subtle">
            <Spinner />
          </div>
        ) : (
          <div className="divide-y divide-line">
            <Toggle
              id="presence"
              label="Show when I'm online"
              description="People you chat with can see when you're active."
              checked={settings.showPresence}
              onChange={(value) => update({ showPresence: value })}
            />
            <Toggle
              id="receipts"
              label="Send read receipts"
              description="Let people know when you've read their messages. Delivery is still reported."
              checked={settings.sendReadReceipts}
              onChange={(value) => update({ sendReadReceipts: value })}
            />
          </div>
        )}
      </section>

      <section className="mt-8" aria-labelledby="devices-heading">
        <h3 id="devices-heading" className="text-base font-bold">
          Encrypted chat devices
        </h3>
        <p className="mt-1 text-sm text-ink-muted">
          Each browser you use has its own encryption keys. Sign out devices you no longer use; they will stop receiving new messages.
        </p>

        {mine && (
          <div className="mt-4 rounded-2xl bg-surface p-4">
            <p className="flex items-center gap-2 text-sm font-bold">
              <IoLockClosedOutline aria-hidden="true" /> This device&apos;s fingerprint
            </p>
            <p className="mt-2 font-mono text-sm break-all">{formatFingerprint(mine.fingerprint)}</p>
            <p className="mt-1 text-xs text-ink-subtle">Share this with people who want to verify you.</p>
          </div>
        )}

        <ul className="mt-4 space-y-2">
          {!devices && (
            <li className="flex justify-center py-6 text-ink-subtle">
              <Spinner />
            </li>
          )}
          {devices?.length === 0 && <li className="text-sm text-ink-muted">No devices have set up encrypted chat yet.</li>}
          {devices?.map((device) => (
            <li key={device.deviceId} className="flex items-center gap-3 rounded-2xl border border-line px-4 py-3">
              <IoLaptopOutline className="shrink-0 text-xl text-ink-muted" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {device.displayName || 'Unnamed device'}
                  {device.deviceId === current && <span className="ml-2 rounded-full bg-ink px-2 py-0.5 text-[11px] text-white">This device</span>}
                </p>
                <p className="text-xs text-ink-subtle">
                  {device.deviceId} · last active {new Date(device.lastSeenAt).toLocaleString()}
                </p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setRemoving(device)}>
                Sign out
              </Button>
            </li>
          ))}
        </ul>
      </section>

      <ConfirmDialog
        open={Boolean(removing)}
        onClose={() => setRemoving(null)}
        loading={busy}
        title={removing?.deviceId === current ? 'Sign out this device from encrypted chat?' : 'Sign out this device?'}
        description={
          removing?.deviceId === current
            ? "This deletes this browser's chat keys. You won't be able to read past messages here; a new device will be set up next time you open Messages."
            : "That device will stop receiving new messages and won't be able to send any until it's set up again."
        }
        confirmLabel="Sign out device"
        onConfirm={async () => {
          setBusy(true)
          try {
            await removeServerDevice(removing.deviceId)
            toast.success('Device signed out')
            setRemoving(null)
            loadDevices()
          } catch (error) {
            toast.error(errorMessage(error))
          } finally {
            setBusy(false)
          }
        }}
      />
    </div>
  )
}
