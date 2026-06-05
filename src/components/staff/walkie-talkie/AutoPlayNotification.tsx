'use client'

/**
 * AutoPlayNotification — Floating "Now Playing" toast for Staff Portal.
 *
 * Shows up on ANY tab when a voice message is being auto-played in the background.
 * Tap it to go to the Messages tab (optional — handled by onGoToMessages prop).
 *
 * To edit the look of this notification, modify this file.
 */

import React from 'react'

interface AutoPlayNotificationProps {
  speakerName: string
  channelId: string
  onGoToMessages?: () => void
}

export default function AutoPlayNotification({ speakerName, onGoToMessages }: AutoPlayNotificationProps) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 80,           // sits above the tab bar
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        minWidth: 230,
        maxWidth: 320,
        background: 'linear-gradient(135deg, rgba(15,17,28,0.97), rgba(20,22,36,0.97))',
        border: '1.5px solid rgba(52,211,153,0.4)',
        borderRadius: 16,
        padding: '11px 15px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 20px rgba(52,211,153,0.15)',
        backdropFilter: 'blur(16px)',
        animation: 'slideUp 0.25s ease-out',
        cursor: onGoToMessages ? 'pointer' : 'default',
      }}
      onClick={onGoToMessages}
    >
      {/* Animated speaker icon */}
      <div style={{
        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
        background: 'rgba(52,211,153,0.15)',
        border: '1.5px solid rgba(52,211,153,0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 16,
        animation: 'pulse 1s ease-in-out infinite',
      }}>
        🔊
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 8, color: '#34d399', fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 2 }}>
          ▶ Auto-playing Voice
        </div>
        <div style={{ fontSize: 12, fontWeight: 800, color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {speakerName}
        </div>
        {onGoToMessages && (
          <div style={{ fontSize: 8, color: '#475569', marginTop: 1 }}>Tap to open Messages →</div>
        )}
      </div>

      {/* EQ bars animation */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 18, flexShrink: 0 }}>
        {[1, 0.5, 0.8, 0.3, 0.9, 0.6].map((h, i) => (
          <div
            key={i}
            style={{
              width: 3,
              borderRadius: 2,
              background: '#34d399',
              height: `${h * 100}%`,
              animation: `eqBar${i % 3} 0.${5 + i}s ease-in-out infinite alternate`,
              opacity: 0.8,
            }}
          />
        ))}
      </div>

      {/* Inline keyframes for EQ bars */}
      <style>{`
        @keyframes slideUp {
          from { transform: translateX(-50%) translateY(20px); opacity: 0; }
          to   { transform: translateX(-50%) translateY(0);   opacity: 1; }
        }
        @keyframes eqBar0 { from { height: 20% } to { height: 100% } }
        @keyframes eqBar1 { from { height: 60% } to { height: 30%  } }
        @keyframes eqBar2 { from { height: 40% } to { height: 90%  } }
      `}</style>
    </div>
  )
}
