'use client'

/**
 * useAutoPlay — Global background auto-play hook for Staff Portal.
 *
 * How it works:
 *  - Listens for new voice messages via socket event trigger (called externally with triggerPlay)
 *  - When triggered, fetches the latest recording for that channel after a short delay
 *    (to allow upload to complete) and plays it automatically
 *  - Works regardless of which tab is open — no need to open Messages tab
 *  - Respects the autoPlayEnabled setting toggle
 *  - Plays messages in a sequential queue (one at a time)
 *
 * Usage in page.tsx:
 *   const { triggerPlay, playingInfo } = useAutoPlay({ wtToken, autoPlayEnabled, currentUserId })
 *
 *   // Call this from the speaker_stopped socket handler:
 *   triggerPlay(channelId, speakerId)
 *
 * To edit auto-play behaviour, modify this file.
 */

import { useRef, useState, useCallback } from 'react'

interface AutoPlayOptions {
  wtToken: string
  autoPlayEnabled: boolean
  currentUserId: string
}

interface PlayingInfo {
  id: string
  channelId: string
  speakerName: string
  url: string
}

export function useAutoPlay({ wtToken, autoPlayEnabled, currentUserId }: AutoPlayOptions) {
  // Currently playing info — used to show notification in UI
  const [playingInfo, setPlayingInfo] = useState<PlayingInfo | null>(null)

  // Queue of { id, url, channelId, speakerName }
  const queueRef = useRef<{ id: string; url: string; channelId: string; speakerName: string }[]>([])
  const isPlayingRef = useRef(false)
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)
  const isMountedRef = useRef(true)

  // Drain the queue sequentially
  const drainQueue = useCallback(() => {
    if (!isMountedRef.current) return

    const next = queueRef.current.shift()
    if (!next) {
      isPlayingRef.current = false
      setPlayingInfo(null)
      return
    }

    isPlayingRef.current = true
    setPlayingInfo({ id: next.id, channelId: next.channelId, speakerName: next.speakerName, url: next.url })

    const audio = new Audio(next.url)
    currentAudioRef.current = audio

    const advance = () => {
      if (!isMountedRef.current) return
      setPlayingInfo(null)
      drainQueue()
    }

    audio.onended = advance
    audio.onerror = advance
    audio.play().catch(advance)  // silently skip if browser blocks
  }, [])

  /**
   * triggerPlay — call this from the speaker_stopped socket event.
   *
   * @param channelId   The channel where the talk ended
   * @param speakerId   The user who was speaking (skip if it's the current user)
   * @param speakerName Display name of the speaker
   * @param delayMs     How long to wait before fetching (to allow upload to finish). Default 2000ms.
   */
  const triggerPlay = useCallback((
    channelId: string,
    speakerId: string,
    speakerName: string,
    delayMs = 2000
  ) => {
    if (!autoPlayEnabled) return
    if (speakerId === currentUserId) return  // don't play your own voice back
    if (!wtToken) return

    setTimeout(async () => {
      if (!isMountedRef.current) return
      try {
        // Fetch the latest recording for this channel
        const res = await fetch(`/api/walkie-talkie/ptt?channelId=${channelId}`, {
          headers: { Authorization: `Bearer ${wtToken}` }
        })
        if (!res.ok) return

        const history: any[] = await res.json()

        // Find the most recent recording that has a URL and was from this speaker
        const latest = history
          .filter(h => h.recordingUrl && h.speakerId === speakerId)
          .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())[0]

        if (!latest?.recordingUrl) return

        // Add to queue
        queueRef.current.push({ id: latest.id, url: latest.recordingUrl, channelId, speakerName })

        // Start playback if not already playing
        if (!isPlayingRef.current) {
          drainQueue()
        }
      } catch {
        // Silently fail — auto-play is best-effort
      }
    }, delayMs)
  }, [autoPlayEnabled, currentUserId, wtToken, drainQueue])

  /** Stop current playback and clear queue */
  const stopAll = useCallback(() => {
    queueRef.current = []
    currentAudioRef.current?.pause()
    currentAudioRef.current = null
    isPlayingRef.current = false
    setPlayingInfo(null)
  }, [])

  /** Call this on component unmount */
  const destroy = useCallback(() => {
    isMountedRef.current = false
    stopAll()
  }, [stopAll])

  return { triggerPlay, playingInfo, stopAll, destroy }
}
