'use client'

import React, { useState, useEffect, useRef } from 'react'

interface AudioPlayerProps {
  url: string
  /** If true, starts playing immediately on mount */
  autoPlay?: boolean
  /** Called when playback starts */
  onPlay?: () => void
  /** Called when playback ends */
  onEnded?: () => void
}

/**
 * AudioPlayer — standalone voice message player.
 *
 * Props:
 *  - url       : URL to the .webm audio recording
 *  - autoPlay  : set to true to auto-play when the component mounts
 *  - onPlay    : callback fired when audio starts
 *  - onEnded   : callback fired when audio finishes
 */
export default function AudioPlayer({ url, autoPlay = false, onPlay, onEnded }: AudioPlayerProps) {
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)   // 0–100
  const [duration, setDuration] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const a = new Audio(url)
    audioRef.current = a

    a.onloadedmetadata = () => setDuration(a.duration)

    a.onended = () => {
      setPlaying(false)
      setProgress(0)
      onEnded?.()
    }

    if (autoPlay) {
      a.play().then(() => {
        setPlaying(true)
        onPlay?.()
      }).catch(() => {})
    }

    return () => {
      a.pause()
      a.onended = null
      a.onloadedmetadata = null
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [url]) // eslint-disable-line react-hooks/exhaustive-deps

  // Update progress bar smoothly
  useEffect(() => {
    const tick = () => {
      const a = audioRef.current
      if (a && a.duration > 0) {
        setProgress((a.currentTime / a.duration) * 100)
      }
      if (playing) rafRef.current = requestAnimationFrame(tick)
    }
    if (playing) rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [playing])

  const toggle = () => {
    const a = audioRef.current
    if (!a) return
    if (playing) {
      a.pause()
      setPlaying(false)
    } else {
      a.play().then(() => {
        setPlaying(true)
        onPlay?.()
      }).catch(() => {})
    }
  }

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = audioRef.current
    if (!a || !a.duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const frac = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    a.currentTime = frac * a.duration
    setProgress(frac * 100)
  }

  const fmt = (s: number) => {
    if (!s || isNaN(s)) return '0:00'
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const elapsed = audioRef.current ? audioRef.current.currentTime : 0

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 180 }}>
      {/* Play / Pause button */}
      <button
        type="button"
        onClick={toggle}
        style={{
          flexShrink: 0,
          width: 30, height: 30, borderRadius: '50%',
          background: playing
            ? 'linear-gradient(135deg,#6366f1,#818cf8)'
            : 'rgba(99,102,241,0.18)',
          border: '1px solid rgba(99,102,241,0.35)',
          color: '#818cf8',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11,
          boxShadow: playing ? '0 0 10px rgba(99,102,241,0.4)' : 'none',
          transition: 'all 0.15s',
        }}
      >
        {playing ? '⏸' : '▶'}
      </button>

      {/* Progress bar + time */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Track */}
        <div
          onClick={seek}
          style={{ height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 4, cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
        >
          <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg,#6366f1,#818cf8)', borderRadius: 4, transition: 'width 0.1s linear' }} />
        </div>
        {/* Time */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 7, color: '#475569', fontFamily: 'monospace' }}>
          <span>{fmt(elapsed)}</span>
          <span>{fmt(duration)}</span>
        </div>
      </div>

      {/* Auto-play indicator */}
      {autoPlay && playing && (
        <span style={{ fontSize: 7, color: '#34d399', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', animation: 'pulse 1s infinite', flexShrink: 0 }}>
          AUTO
        </span>
      )}
    </div>
  )
}
