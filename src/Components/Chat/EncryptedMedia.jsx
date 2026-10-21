import { useEffect, useRef, useState } from 'react'
import { IoAlertCircleOutline, IoDocumentOutline, IoDownloadOutline, IoPause, IoPlay } from 'react-icons/io5'
import { attachmentUrl } from '../../chat/chatStore'
import { useInView } from '../../lib/hooks'
import Dialog from '../UI/Dialog'
import Spinner from '../UI/Spinner'
import { formatBytes, formatDuration } from './format'

// Downloads + decrypts an attachment once it scrolls into view.
const useDecryptedUrl = (file, mimetype, localUrl) => {
  const [url, setUrl] = useState(localUrl ?? null)
  const [error, setError] = useState(null)
  const [visible, setVisible] = useState(Boolean(localUrl))
  const ref = useInView(() => setVisible(true), { enabled: !visible, rootMargin: '300px' })

  useEffect(() => {
    if (!visible || url || !file?.attachmentId) return
    let cancelled = false
    attachmentUrl(file, mimetype)
      .then((u) => !cancelled && setUrl(u))
      .catch(() => !cancelled && setError("This file couldn't be decrypted"))
    return () => {
      cancelled = true
    }
  }, [visible, url, file, mimetype])

  return { ref, url, error }
}

const Placeholder = ({ children, style }) => (
  <div className="flex min-h-32 w-64 max-w-full items-center justify-center rounded-2xl bg-black/5 text-ink-subtle" style={style}>
    {children}
  </div>
)

function AudioPlayer({ url, duration }) {
  const audio = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [position, setPosition] = useState(0)
  const [speed, setSpeed] = useState(1)

  const toggle = () => {
    if (!audio.current) return
    if (audio.current.paused) audio.current.play()
    else audio.current.pause()
  }
  const total = duration || (audio.current?.duration ? audio.current.duration * 1000 : 0)
  const nextSpeed = { 1: 1.5, 1.5: 2, 2: 1 }[speed]

  return (
    <div className="flex w-64 max-w-full items-center gap-2">
      <audio
        ref={audio}
        src={url}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false)
          setPosition(0)
        }}
        onTimeUpdate={(e) => setPosition(e.currentTarget.currentTime * 1000)}
      />
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? 'Pause voice message' : 'Play voice message'}
        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-current/10 cursor-pointer"
      >
        {playing ? <IoPause /> : <IoPlay className="translate-x-px" />}
      </button>
      <input
        type="range"
        min={0}
        max={total || 1}
        value={Math.min(position, total || 1)}
        onChange={(e) => {
          if (audio.current) audio.current.currentTime = Number(e.target.value) / 1000
        }}
        aria-label="Playback position"
        className="h-1 min-w-0 flex-1 cursor-pointer accent-current"
      />
      <span className="w-10 shrink-0 text-right text-xs tabular-nums opacity-80">{formatDuration(playing || position ? position : total)}</span>
      <button
        type="button"
        onClick={() => {
          setSpeed(nextSpeed)
          if (audio.current) audio.current.playbackRate = nextSpeed
        }}
        aria-label={`Playback speed ${speed}x. Change to ${nextSpeed}x`}
        className="shrink-0 rounded-full bg-current/10 px-2 py-1 text-[11px] font-bold cursor-pointer"
      >
        {speed}×
      </button>
    </div>
  )
}

export default function EncryptedMedia({ content, localUrl }) {
  const { info = {}, file } = content
  const { ref, url, error } = useDecryptedUrl(file, info.mimetype, localUrl)
  const [open, setOpen] = useState(false)
  const ratio = info.w && info.h ? { aspectRatio: `${info.w} / ${info.h}`, width: Math.min(280, info.w) } : undefined

  if (error) {
    return (
      <Placeholder>
        <span className="flex items-center gap-2 text-sm">
          <IoAlertCircleOutline aria-hidden="true" /> {error}
        </span>
      </Placeholder>
    )
  }

  if (content.msgtype === 'm.image') {
    return (
      <div ref={ref}>
        {url ? (
          <>
            <button type="button" onClick={() => setOpen(true)} className="block cursor-zoom-in overflow-hidden rounded-2xl" aria-label="Open photo">
              <img src={url} alt={content.body || 'Photo'} className="max-h-80 w-auto max-w-full object-cover" style={ratio} />
            </button>
            <Dialog open={open} onClose={() => setOpen(false)} size="full" className="bg-black">
              <img src={url} alt={content.body || 'Photo'} className="mx-auto max-h-[calc(100dvh-8rem)] w-auto object-contain" />
              <a href={url} download={content.body || 'photo'} className="mx-auto mt-4 flex w-fit items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink">
                <IoDownloadOutline aria-hidden="true" /> Download
              </a>
            </Dialog>
          </>
        ) : (
          <Placeholder style={ratio}>
            <Spinner label="Decrypting photo" />
          </Placeholder>
        )}
      </div>
    )
  }

  if (content.msgtype === 'm.video') {
    return (
      <div ref={ref}>
        {url ? (
          <video src={url} controls preload="metadata" className="max-h-80 w-72 max-w-full rounded-2xl bg-black" aria-label={content.body || 'Video'} />
        ) : (
          <Placeholder style={ratio}>
            <span className="flex flex-col items-center gap-2 text-xs">
              <Spinner label="Decrypting video" />
              {info.duration ? formatDuration(info.duration) : null}
            </span>
          </Placeholder>
        )}
      </div>
    )
  }

  if (content.msgtype === 'm.audio') {
    return <div ref={ref}>{url ? <AudioPlayer url={url} duration={info.duration} /> : <div className="flex h-10 w-64 items-center gap-2 text-sm opacity-80"><Spinner className="size-4" /> Decrypting…</div>}</div>
  }

  return (
    <div ref={ref} className="flex w-64 max-w-full items-center gap-3">
      <IoDocumentOutline className="shrink-0 text-2xl" aria-hidden="true" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{content.body}</span>
        <span className="block text-xs opacity-75">{formatBytes(info.size)}</span>
      </span>
      {url ? (
        <a href={url} download={content.body} aria-label={`Download ${content.body}`} className="rounded-full p-2 hover:bg-black/10">
          <IoDownloadOutline />
        </a>
      ) : (
        <Spinner className="size-4" />
      )}
    </div>
  )
}
