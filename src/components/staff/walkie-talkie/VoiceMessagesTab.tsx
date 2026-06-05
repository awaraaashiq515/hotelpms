'use client'

/**
 * VoiceMessagesTab — Grouped voice message history for the Staff Portal.
 *
 * Features:
 *  • Messages grouped by channel / group
 *  • Auto-play NEW incoming voice messages (from other people)
 *    — Old messages already loaded on mount are NOT auto-played
 *  • Per-group refresh button
 *  • "Refresh All" header button
 *
 * To edit the look/feel of the Messages tab, modify this file.
 */

import React from 'react'
import AudioPlayer from './AudioPlayer'
import type { Channel, TalkMessage } from './types'

interface VoiceMessagesTabProps {
  channels: Channel[]
  allChannelHistory: Record<string, TalkMessage[]>
  selectedChannelId: string
  currentUserId: string
  autoPlayEnabled: boolean
  onRefreshAll: () => void
  onRefreshChannel: (channelId: string) => void
  playingId?: string | null
}

/**
 * Auto-play logic (browser-safe):
 *
 * Background auto-play is handled globally by useAutoPlay.ts in page.tsx
 * so it works regardless of which active tab is selected. VoiceMessagesTab
 * receives the currently playing message ID to show active status and highlight it.
 */
export default function VoiceMessagesTab({
  channels,
  allChannelHistory,
  selectedChannelId,
  currentUserId,
  autoPlayEnabled,
  onRefreshAll,
  onRefreshChannel,
  playingId = null,
}: VoiceMessagesTabProps) {

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ fontSize: 8, fontWeight: 800, color: '#64748b', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
          💬 Voice Messages History
        </div>
        <button
          onClick={onRefreshAll}
          style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 8, padding: '5px 11px', cursor: 'pointer', color: '#818cf8', fontSize: 10, fontWeight: 800, fontFamily: 'inherit', letterSpacing: '0.06em' }}
        >
          🔄 Refresh All
        </button>
      </div>

      {/* ── Auto-play status banner ── */}
      <div style={{
        marginBottom: 10, padding: '7px 12px',
        background: autoPlayEnabled ? 'rgba(52,211,153,0.07)' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${autoPlayEnabled ? 'rgba(52,211,153,0.25)' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: 10,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ fontSize: 13 }}>{autoPlayEnabled ? '🔊' : '🔇'}</span>
        <span style={{ fontSize: 9, color: autoPlayEnabled ? '#34d399' : '#475569', fontWeight: 700 }}>
          {autoPlayEnabled
            ? 'Auto-play ON — new incoming voice messages will play automatically'
            : 'Auto-play OFF — turn on in ⚙️ Settings'}
        </span>
        {playingId && (
          <span style={{ marginLeft: 'auto', fontSize: 8, color: '#34d399', fontWeight: 900, animation: 'pulse 1s infinite', letterSpacing: '0.1em' }}>
            ▶ PLAYING
          </span>
        )}
      </div>

      {/* ── No channels state ── */}
      {channels.length === 0 && (
        <div style={{ fontSize: 11, color: '#475569', textAlign: 'center', padding: '36px 0', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 14 }}>
          No groups yet. Create a group from the PTT tab first.
        </div>
      )}

      {/* ── One card per channel/group ── */}
      {channels.map((ch) => {
        const msgs: TalkMessage[] = allChannelHistory[ch.id] || []
        const isDirect = ch.type === 'direct'

        return (
          <div
            key={ch.id}
            style={{
              marginBottom: 14,
              background: 'rgba(255,255,255,0.015)',
              border: `1.5px solid ${ch.isEmergency ? 'rgba(251,113,133,0.25)' : isDirect ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.07)'}`,
              borderRadius: 16,
              overflow: 'hidden',
            }}
          >
            {/* Group Header */}
            <div style={{
              padding: '11px 14px',
              background: ch.isEmergency ? 'rgba(251,113,133,0.07)' : isDirect ? 'rgba(52,211,153,0.04)' : 'rgba(255,255,255,0.02)',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 8,
                  background: ch.isEmergency ? 'rgba(251,113,133,0.18)' : isDirect ? 'rgba(52,211,153,0.15)' : 'rgba(99,102,241,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0,
                }}>
                  {ch.isEmergency ? '🚨' : isDirect ? '📲' : '📻'}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 900, color: '#f1f5f9', lineHeight: 1.2 }}>{ch.name}</div>
                  <div style={{ fontSize: 8, color: '#475569', fontWeight: 700, marginTop: 1, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    {msgs.length} message{msgs.length !== 1 ? 's' : ''} · {isDirect ? 'Direct' : `${ch.membersCount || 0} members`}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                {ch.id === selectedChannelId && (
                  <span style={{ fontSize: 7, fontWeight: 900, color: '#6366f1', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 5, padding: '2px 7px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Active
                  </span>
                )}
                <button
                  onClick={() => onRefreshChannel(ch.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', fontSize: 12, lineHeight: 1, padding: 4 }}
                  title="Refresh this group"
                >
                  🔄
                </button>
              </div>
            </div>

            {/* Messages list */}
            <div style={{ padding: '10px 13px 12px 13px', paddingRight: 10, display: 'flex', flexDirection: 'column', gap: 9, maxHeight: 340, overflowY: 'auto' }}>
              {msgs.length === 0 ? (
                <div style={{ fontSize: 10, color: '#334155', textAlign: 'center', padding: '14px 0', fontStyle: 'italic' }}>
                  No recordings in this group yet
                </div>
              ) : (
                msgs.map((msg) => {
                  const isSelf = msg.speakerId === currentUserId
                  const timeStr = new Date(msg.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  const isCurrentlyPlaying = playingId === msg.id

                  return (
                    <div
                      key={msg.id}
                      style={{ display: 'flex', flexDirection: 'column', alignItems: isSelf ? 'flex-end' : 'flex-start', width: '100%' }}
                    >
                      <div style={{
                        maxWidth: '88%',
                        background: isCurrentlyPlaying
                          ? 'rgba(52,211,153,0.1)'
                          : isSelf ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${isCurrentlyPlaying ? 'rgba(52,211,153,0.5)' : isSelf ? 'rgba(99,102,241,0.35)' : 'rgba(255,255,255,0.07)'}`,
                        borderRadius: isSelf ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                        padding: '8px 10px',
                        transition: 'all 0.2s',
                        boxShadow: isCurrentlyPlaying ? '0 0 12px rgba(52,211,153,0.2)' : 'none',
                      }}>
                        {/* Speaker name + playing indicator */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <span style={{ fontSize: 9, fontWeight: 900, color: isCurrentlyPlaying ? '#34d399' : isSelf ? '#818cf8' : '#e2e8f0' }}>
                            {isSelf ? 'You' : msg.speaker?.fullName}
                          </span>
                          <span style={{ fontSize: 7, color: '#475569', fontWeight: 600, textTransform: 'uppercase' }}>
                            {msg.speaker?.designation || 'Staff'}
                          </span>
                          {isCurrentlyPlaying && (
                            <span style={{ fontSize: 7, color: '#34d399', fontWeight: 900, letterSpacing: '0.1em', animation: 'pulse 0.8s infinite' }}>
                              ▶ AUTO
                            </span>
                          )}
                        </div>

                        {/* Audio player — manual play only, auto-play handled by queue above */}
                        {msg.recordingUrl ? (
                          <AudioPlayer url={msg.recordingUrl} />
                        ) : (
                          <span style={{ fontSize: 10, color: '#475569', fontStyle: 'italic' }}>🎙️ Live talk only (not recorded)</span>
                        )}

                        {/* Timestamp */}
                        <div style={{ fontSize: 7, color: '#475569', textAlign: 'right', marginTop: 4, fontFamily: 'monospace' }}>
                          {timeStr}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
