import { useEffect, useRef, useState } from 'react'
import { IoPause, IoPlay, IoSend, IoStop, IoTrashOutline } from 'react-icons/io5'
import { IconButton } from '../UI/Button'
import { formatDuration } from './format'

const MAX_MS = 5 * 60 * 1000
const preferredType = () =>
  ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/mp4', 'audio/webm'].find((t) => window.MediaRecorder?.isTypeSupported?.(t)) ?? ''

// Records a voice message in the browser. Nothing leaves the device until Send,
// and then only the encrypted recording is uploaded.
export default function VoiceRecorder({ onSend, onCancel }) {
  const [phase, setPhase] = useState('starting') // starting | recording | paused | review | error
  const [elapsed, setElapsed] = useState(0)
  const [error, setError] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const recorder = useRef(null)
  const chunks = useRef([])
  const stream = useRef(null)
  const blob = useRef(null)
  const timer = useRef(null)
  const startedAt = useRef(0)
  const accumulated = useRef(0)

  const stopTimer = () => clearInterval(timer.current)
  const startTimer = () => {
    startedAt.current = Date.now()
    timer.current = setInterval(() => {
      const total = accumulated.current + Date.now() - startedAt.current
      setElapsed(total)
      if (total >= MAX_MS) recorder.current?.stop()
    }, 200)
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
        setError("Your browser doesn't support voice recording.")
        return setPhase('error')
      }
      try {
        stream.current = await navigator.mediaDevices.getUserMedia({ audio: true })
      } catch {
        setError('Microphone access was blocked. Allow it in your browser settings to record.')
        return setPhase('error')
      }
      if (cancelled) return
      const type = preferredType()
      recorder.current = new MediaRecorder(stream.current, type ? { mimeType: type } : undefined)
      recorder.current.ondataavailable = (e) => e.data.size && chunks.current.push(e.data)
      recorder.current.onstop = () => {
        stopTimer()
        accumulated.current += startedAt.current ? Date.now() - startedAt.current : 0
        startedAt.current = 0
        blob.current = new Blob(chunks.current, { type: recorder.current.mimeType || type || 'audio/webm' })
        setPreviewUrl(URL.createObjectURL(blob.current))
        setElapsed(accumulated.current)
        stream.current?.getTracks().forEach((t) => t.stop())
        setPhase('review')
      }
      recorder.current.start(250)
      startTimer()
      setPhase('recording')
    })()
    return () => {
      cancelled = true
      stopTimer()
      if (recorder.current?.state !== 'inactive') recorder.current?.stop()
      stream.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  useEffect(() => () => previewUrl && URL.revokeObjectURL(previewUrl), [previewUrl])

  const pause = () => {
    recorder.current.pause()
    stopTimer()
    accumulated.current += Date.now() - startedAt.current
    startedAt.current = 0
    setPhase('paused')
  }
  const resume = () => {
    recorder.current.resume()
    startTimer()
    setPhase('recording')
  }

  const send = () => {
    const extension = blob.current.type.includes('mp4') ? 'm4a' : blob.current.type.includes('ogg') ? 'ogg' : 'webm'
    onSend(new File([blob.current], `voice-message.${extension}`, { type: blob.current.type }), accumulated.current)
  }

  if (phase === 'error') {
    return (
      <div className="flex items-center gap-3 rounded-3xl bg-brand-50 px-4 py-3 text-sm text-brand-700" role="alert">
        <span className="flex-1">{error}</span>
        <button type="button" onClick={onCancel} className="font-bold underline cursor-pointer">
          Close
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 rounded-3xl bg-surface px-2 py-2" aria-live="polite">
      <IconButton label="Delete recording" onClick={onCancel}>
        <IoTrashOutline />
      </IconButton>
      {phase === 'review' ? (
        <audio src={previewUrl} controls className="h-10 min-w-0 flex-1" aria-label="Preview voice message" />
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-2 px-2 text-sm font-semibold">
          <span className={`size-2.5 rounded-full bg-brand-600 ${phase === 'recording' ? 'animate-pulse' : 'opacity-40'}`} aria-hidden="true" />
          <span className="tabular-nums">{formatDuration(elapsed)}</span>
          <span className="truncate text-ink-muted">{phase === 'paused' ? 'Paused' : phase === 'starting' ? 'Starting microphone…' : 'Recording'}</span>
        </div>
      )}
      {phase === 'recording' && (
        <IconButton label="Pause recording" onClick={pause}>
          <IoPause />
        </IconButton>
      )}
      {phase === 'paused' && (
        <IconButton label="Resume recording" onClick={resume}>
          <IoPlay />
        </IconButton>
      )}
      {(phase === 'recording' || phase === 'paused') && (
        <IconButton label="Stop and review" onClick={() => recorder.current.stop()} variant="dark">
          <IoStop />
        </IconButton>
      )}
      {phase === 'review' && (
        <IconButton label="Send voice message" onClick={send} variant="primary">
          <IoSend />
        </IconButton>
      )}
    </div>
  )
}
