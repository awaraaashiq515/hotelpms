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

import { useRef, useState, useCallback, useEffect } from 'react'

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

  // Initialize a single reusable Audio element on mount to bypass aggressive mobile autoplay blocking
  useEffect(() => {
    if (typeof window !== 'undefined') {
      currentAudioRef.current = new Audio()
    }
    return () => {
      isMountedRef.current = false
      if (currentAudioRef.current) {
        currentAudioRef.current.onended = null
        currentAudioRef.current.onerror = null
        try {
          currentAudioRef.current.pause()
        } catch (e) {}
        currentAudioRef.current = null
      }
    }
  }, [])

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

    let audio = currentAudioRef.current
    if (!audio) {
      audio = new Audio()
      currentAudioRef.current = audio
    }

    // Decouple previous listeners to prevent old callback execution when src is updated
    audio.onended = null
    audio.onerror = null

    try {
      audio.pause()
    } catch (e) {}

    // Define advance function
    const advance = () => {
      if (!isMountedRef.current) return
      setPlayingInfo(null)
      drainQueue()
    }

    // Set new url and load
    audio.src = next.url
    try {
      audio.load()
    } catch (e) {}

    // Attach new event handlers AFTER loading the new source
    audio.onended = advance
    audio.onerror = (e) => {
      console.error('[WT Autoplay] Audio playback error:', e)
      advance()
    }

    audio.play().catch((err) => {
      console.warn('[WT Autoplay] Blocked by browser autoplay policy:', err)
      advance()
    })
  }, [])

  /**
   * triggerPlay — call this from the speaker_stopped socket event.
   *
   * @param channelId   The channel where the talk ended
   * @param speakerId   The user who was speaking (skip if it's the current user)
   * @param speakerName Display name of the speaker
   * @param talkId      The specific talk record ID to play (optional)
   */
  const triggerPlay = useCallback((
    channelId: string,
    speakerId: string,
    speakerName: string,
    talkId?: string
  ) => {
    if (!autoPlayEnabled) return
    if (speakerId === currentUserId) return  // don't play your own voice back
    if (!wtToken) return

    let attempts = 0
    const maxAttempts = 10
    const pollInterval = 600 // ms

    const poll = async () => {
      if (!isMountedRef.current) return
      try {
        // Fetch the latest recording for this channel
        const res = await fetch(`/api/walkie-talkie/ptt?channelId=${channelId}`, {
          headers: { Authorization: `Bearer ${wtToken}` }
        })
        if (!res.ok) return

        const history: any[] = await res.json()

        // Find the recording by talkId or fallback to a very recent attempt from this speaker
        let targetRecord = null
        if (talkId) {
          targetRecord = history.find(h => h.id === talkId)
        } else {
          const latestAttempt = history
            .filter(h => h.speakerId === speakerId)
            .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())[0]
          
          if (latestAttempt) {
            const isRecent = (Date.now() - new Date(latestAttempt.startedAt).getTime()) < 20000 // 20 seconds
            if (isRecent) {
              targetRecord = latestAttempt
            }
          }
        }

        if (targetRecord && targetRecord.recordingUrl) {
          // Add authenticated token query parameter
          const playbackUrl = targetRecord.recordingUrl.includes('?') 
            ? `${targetRecord.recordingUrl}&token=${wtToken}`
            : `${targetRecord.recordingUrl}?token=${wtToken}`
          
          // Prevent queueing the same record multiple times
          if (!queueRef.current.some(q => q.id === targetRecord.id)) {
            queueRef.current.push({ id: targetRecord.id, url: playbackUrl, channelId, speakerName })
            if (!isPlayingRef.current) {
              drainQueue()
            }
          }
        } else if (attempts < maxAttempts) {
          // Keep polling until the record exists AND the upload completes
          attempts++
          setTimeout(poll, pollInterval)
        }
      } catch (error) {
        console.error('[WT Autoplay Poll] Error:', error)
      }
    }

    // Start polling immediately
    poll()
  }, [autoPlayEnabled, currentUserId, wtToken, drainQueue])

  /** Stop current playback and clear queue */
  const stopAll = useCallback(() => {
    queueRef.current = []
    if (currentAudioRef.current) {
      currentAudioRef.current.onended = null
      currentAudioRef.current.onerror = null
      try {
        currentAudioRef.current.pause()
      } catch (e) {}
    }
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
