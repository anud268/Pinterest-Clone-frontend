import { useCallback, useEffect, useState } from 'react'
import { IoBanOutline, IoShieldCheckmark, IoShieldOutline } from 'react-icons/io5'
import { formatFingerprint } from '../../chat/cryptoEngine'
import { devicesOf, ownDevice, setDeviceTrust } from '../../chat/chatStore'
import { toast } from '../../lib/toast'
import Button from '../UI/Button'
import Dialog from '../UI/Dialog'
import Spinner from '../UI/Spinner'

// Manual device verification: compare fingerprints over a trusted channel (in person,
// phone call), then mark the device as verified on this device.
export default function DevicesDialog({ open, onClose, partner, onChanged }) {
  const [devices, setDevices] = useState(null)
  const [mine, setMine] = useState(null)
  const [busy, setBusy] = useState(null)

  const load = useCallback(async () => {
    setDevices(null)
    try {
      const [list, own] = await Promise.all([devicesOf(partner._id), ownDevice()])
      setDevices(list)
      setMine(own)
    } catch {
      setDevices([])
      toast.error('Could not load device keys')
    }
  }, [partner._id])

  useEffect(() => {
    if (open) load()
  }, [open, load])

  const change = async (device, trust) => {
    setBusy(device.deviceId)
    try {
      await setDeviceTrust(partner._id, device.deviceId, trust)
      await load()
      onChanged?.()
      toast.success(trust === 'verified' ? 'Device verified' : trust === 'blocked' ? 'Device blocked: it won’t receive new messages' : 'Device trust reset')
    } catch {
      toast.error('Could not update this device')
    } finally {
      setBusy(null)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      title="Encryption & devices"
      description={`Messages are end-to-end encrypted. To make sure you're talking to ${partner.fullname}, compare these fingerprints with them in person or over a call.`}
    >
      {mine && (
        <section className="mb-5 rounded-2xl bg-surface p-4">
          <h3 className="text-sm font-bold">This device (yours)</h3>
          <p className="mt-2 font-mono text-sm break-all">{formatFingerprint(mine.fingerprint)}</p>
          <p className="mt-1 text-xs text-ink-subtle">Device ID {mine.deviceId}</p>
        </section>
      )}

      <h3 className="mb-2 text-sm font-bold">{partner.fullname}&apos;s devices</h3>
      {!devices ? (
        <div className="flex justify-center py-8 text-ink-subtle">
          <Spinner label="Loading devices" />
        </div>
      ) : devices.length === 0 ? (
        <p className="py-4 text-sm text-ink-muted">{partner.fullname} hasn&apos;t opened encrypted chat yet. They&apos;ll receive your messages once they do.</p>
      ) : (
        <ul className="space-y-3">
          {devices.map((device) => (
            <li key={device.deviceId} className="rounded-2xl border border-line p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="flex items-center gap-1.5 text-sm font-bold">
                    {device.verified ? (
                      <IoShieldCheckmark className="text-success" aria-hidden="true" />
                    ) : device.blocked ? (
                      <IoBanOutline className="text-danger" aria-hidden="true" />
                    ) : (
                      <IoShieldOutline className="text-ink-subtle" aria-hidden="true" />
                    )}
                    {device.displayName || 'Unnamed device'}
                    <span className="font-normal text-ink-subtle">· {device.verified ? 'Verified' : device.blocked ? 'Blocked' : 'Not verified'}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-ink-subtle">Device ID {device.deviceId}</p>
                </div>
                <div className="flex gap-2">
                  {device.verified || device.blocked ? (
                    <Button size="sm" variant="secondary" loading={busy === device.deviceId} onClick={() => change(device, 'unset')}>
                      Reset
                    </Button>
                  ) : (
                    <>
                      <Button size="sm" variant="secondary" loading={busy === device.deviceId} onClick={() => change(device, 'blocked')}>
                        Block
                      </Button>
                      <Button size="sm" loading={busy === device.deviceId} onClick={() => change(device, 'verified')}>
                        Fingerprints match
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <p className="mt-3 rounded-xl bg-surface px-3 py-2 font-mono text-sm break-all">{formatFingerprint(device.fingerprint)}</p>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-5 text-xs leading-relaxed text-ink-subtle">
        Verification is stored on this device only. If {partner.fullname} adds a new device, it will show up here as not verified. New devices can&apos;t read
        messages sent before they were set up.
      </p>
    </Dialog>
  )
}
