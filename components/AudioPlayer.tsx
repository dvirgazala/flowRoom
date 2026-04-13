'use client'
import { useState, useRef, useEffect, useId } from 'react'
import { Play, Pause, Volume2 } from 'lucide-react'

const AUDIO_EVENT = 'flowroom:audio-play'

interface Props {
  url: string
  duration?: string
  compact?: boolean
}

export default function AudioPlayer({ url, duration, compact = false }: Props) {
  const instanceId = useId()
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState('0:00')
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onTime = () => {
      setProgress((audio.currentTime / (audio.duration || 1)) * 100)
      const m = Math.floor(audio.currentTime / 60)
      const s = Math.floor(audio.currentTime % 60).toString().padStart(2, '0')
      setCurrentTime(`${m}:${s}`)
    }
    const onEnd = () => { setPlaying(false); setProgress(0); setCurrentTime('0:00') }

    // Stop this player when another one starts
    const onOtherPlay = (e: Event) => {
      if ((e as CustomEvent).detail !== instanceId) {
        audio.pause()
        setPlaying(false)
      }
    }

    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('ended', onEnd)
    window.addEventListener(AUDIO_EVENT, onOtherPlay)
    return () => {
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('ended', onEnd)
      window.removeEventListener(AUDIO_EVENT, onOtherPlay)
    }
  }, [instanceId])

  const toggle = () => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
      setPlaying(false)
    } else {
      window.dispatchEvent(new CustomEvent(AUDIO_EVENT, { detail: instanceId }))
      audio.play().catch(() => {})
      setPlaying(true)
    }
  }

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    if (!audio) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    audio.currentTime = ratio * (audio.duration || 0)
  }

  if (compact) return (
    <div className="flex items-center gap-2">
      <audio ref={audioRef} src={url} preload="none" />
      <button onClick={toggle}
        className="w-8 h-8 rounded-full bg-brand-gradient flex items-center justify-center flex-shrink-0 hover:opacity-85 active:scale-95 transition-all shadow-glow-sm">
        {playing ? <Pause size={12} fill="white" /> : <Play size={12} fill="white" />}
      </button>
      <div className="flex-1 h-1.5 bg-bg3 rounded-full cursor-pointer overflow-hidden group" onClick={seek}>
        <div className="h-full bg-purple rounded-full transition-all group-hover:bg-pink" style={{ width: `${progress}%` }} />
      </div>
      <span className="text-xs text-text-muted tabular-nums w-10 text-left">{playing ? currentTime : duration || '—'}</span>
    </div>
  )

  return (
    <div className="bg-bg3 rounded-xl p-3 flex items-center gap-3">
      <audio ref={audioRef} src={url} preload="none" />
      <button onClick={toggle}
        className="w-10 h-10 rounded-full bg-brand-gradient flex items-center justify-center flex-shrink-0 shadow-glow-sm hover:opacity-85 active:scale-95 transition-all">
        {playing ? <Pause size={16} fill="white" /> : <Play size={16} fill="white" />}
      </button>

      {/* Waveform */}
      <div className="flex items-center gap-0.5 h-8 flex-1 cursor-pointer" onClick={seek}>
        {Array.from({ length: 48 }, (_, i) => {
          const h = [30,50,80,60,90,70,40,95,65,50,75,40,85,60,30,70,50,90,40,60,80,50,70,30,90,60,40,75,50,85,40,60,95,50,70,30,80,60,45,70,35,55,80,65,90,45,70,55][i % 48]
          const active = (i / 48) * 100 < progress
          return (
            <div key={i}
              className={`w-1 rounded-full transition-colors ${playing ? 'wave-bar' : ''} ${active ? 'bg-purple' : 'bg-bg0/60'}`}
              style={{ height: `${h}%`, animationDelay: `${(i % 5) * 0.1}s` }}
            />
          )
        })}
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        <Volume2 size={14} className="text-text-muted" />
        <span className="text-xs text-text-muted tabular-nums">{playing ? currentTime : duration || '—'}</span>
      </div>
    </div>
  )
}
