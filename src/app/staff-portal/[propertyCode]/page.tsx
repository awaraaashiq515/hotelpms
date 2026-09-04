'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { toast, Toaster } from 'sonner'
import { isValid, format } from 'date-fns'
import VoiceMessagesTab from '@/components/staff/walkie-talkie/VoiceMessagesTab'
import AudioPlayer from '@/components/staff/walkie-talkie/AudioPlayer'
import { useAutoPlay, globalAudioUnlocker } from '@/components/staff/walkie-talkie/useAutoPlay'
import AutoPlayNotification from '@/components/staff/walkie-talkie/AutoPlayNotification'
import StaffAttendancePanel from '@/components/staff/StaffAttendancePanel'
import StaffUpiSettingCard from '@/components/staff/StaffUpiSettingCard'
import ProfilePhotoUploader from '@/components/common/ProfilePhotoUploader'

/* ─── Types ─── */
interface StaffUser {
  id: string; fullName: string; email: string; phone: string | null; wtStatus: string
  propertyId: string | null
  avatarUrl?: string | null
  property?: { id: string; name: string; code: string; upiId?: string; upiName?: string } | null
  role?: { name: string } | null
  designation?: string | null
  staffMember?: { id?: string; name?: string; designation?: string | null; avatarUrl?: string | null; upiId?: string | null; upiName?: string | null } | null
}
interface PosOrder {
  id: string; orderNo: string; status: string; tableNo: string | null; orderType?: string;
  guestCount: number; grandTotal: number; createdAt: string;
  subtotal?: number; taxAmount?: number; discountAmount?: number;
  items: { 
    id: string; 
    quantity: number; 
    product: { name: string }; 
    variantName?: string | null; 
    portion?: string | null;
    unitPrice?: number;
  }[]
  table?: {
    id: string;
    name: string;
    floor?: {
      id: string;
      name: string;
    } | null
  } | null
}
interface Contact { id: string; name: string; designation: string; wtStatus: string }
interface Channel { id: string; name: string; type: string; isEmergency: boolean; membersCount?: number }
type Tab = 'ptt' | 'messages' | 'pos' | 'room-order' | 'attendance' | 'settings'

/* ─── Mobile Audio Unlock System ──────────────────────────────────
   Mobile browsers (iOS Safari, Chrome Android) block ALL audio 
   (AudioContext + HTMLAudioElement) until the user taps the page.
   This shared system:
   1. Creates a single global AudioContext
   2. Resumes it on first user tap/click/touchstart
   3. Plays a silent <audio> to unlock HTMLAudioElement for autoplay
   4. Exposes an `isAudioUnlocked` flag for UI to show "Tap to enable"
─────────────────────────────────────────────────────────────────── */
let _sharedAudioCtx: AudioContext | null = null
let _audioUnlocked = false
const _audioUnlockListeners: Array<(v: boolean) => void> = []

function getSharedAudioCtx(): AudioContext | null {
  if (_sharedAudioCtx) return _sharedAudioCtx
  try {
    const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext
    if (!Ctx) return null
    _sharedAudioCtx = new Ctx()
    return _sharedAudioCtx
  } catch { return null }
}

function _onAudioUnlocked() {
  if (_audioUnlocked) return
  _audioUnlocked = true
  _audioUnlockListeners.forEach(fn => fn(true))
}

/** Call this once on mount to set up unlock listeners on the document */
function setupMobileAudioUnlock() {
  if (typeof window === 'undefined') return

  const unlock = () => {
    // 1. Mark as unlocked immediately on user interaction
    _onAudioUnlocked()

    // 2. Unlock all registered audio elements (e.g., walkie-talkie autoplay element)
    try {
      globalAudioUnlocker.unlockAll()
    } catch {}

    // 3. Resume AudioContext (for chirps/sfx)
    try {
      const ctx = getSharedAudioCtx()
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(() => {})
      }
    } catch {}

    // 4. Unlock HTMLAudioElement by playing a tiny silent data-uri
    try {
      const silentAudio = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=')
      silentAudio.volume = 0.01
      silentAudio.play().then(() => {
        silentAudio.pause()
        silentAudio.remove?.()
      }).catch(() => {})
    } catch {}
  }

  // Listen for first interaction
  const events = ['touchstart', 'touchend', 'click', 'keydown']
  const handler = () => {
    unlock()
    // Keep listeners for a few more taps in case first attempt fails
    setTimeout(() => {
      events.forEach(e => document.removeEventListener(e, handler, true))
    }, 3000)
  }
  events.forEach(e => document.addEventListener(e, handler, { capture: true, passive: true }))

  // Also try immediately in case context is already allowed (desktop)
  const ctx = getSharedAudioCtx()
  if (ctx && ctx.state === 'running') {
    _onAudioUnlocked()
  }
}

function useAudioUnlocked() {
  const [unlocked, setUnlocked] = React.useState(_audioUnlocked)
  React.useEffect(() => {
    if (_audioUnlocked) { setUnlocked(true); return }
    const listener = (v: boolean) => setUnlocked(v)
    _audioUnlockListeners.push(listener)
    return () => {
      const idx = _audioUnlockListeners.indexOf(listener)
      if (idx >= 0) _audioUnlockListeners.splice(idx, 1)
    }
  }, [])
  return unlocked
}

/* ─── PTT Chirp sounds ─── */
function playChirp(type: 'start' | 'stop') {
  try {
    const ctx = getSharedAudioCtx()
    if (!ctx) return
    if (ctx.state === 'suspended') ctx.resume().catch(() => {})
    const now = ctx.currentTime
    if (type === 'start') {
      const o = ctx.createOscillator(); const g = ctx.createGain()
      o.connect(g); g.connect(ctx.destination); o.type = 'sine'
      o.frequency.setValueAtTime(880, now); o.frequency.setValueAtTime(1320, now + 0.05)
      g.gain.setValueAtTime(0.07, now); g.gain.exponentialRampToValueAtTime(0.0001, now + 0.18)
      o.start(now); o.stop(now + 0.19)
    } else {
      const o = ctx.createOscillator(); const g = ctx.createGain()
      o.connect(g); g.connect(ctx.destination); o.type = 'sawtooth'
      o.frequency.setValueAtTime(440, now); o.frequency.exponentialRampToValueAtTime(120, now + 0.1)
      g.gain.setValueAtTime(0.05, now); g.gain.exponentialRampToValueAtTime(0.0001, now + 0.12)
      o.start(now); o.stop(now + 0.13)
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.06, ctx.sampleRate)
      const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
      const noise = ctx.createBufferSource(); noise.buffer = buf
      const ng = ctx.createGain(); ng.gain.setValueAtTime(0.02, now + 0.05); ng.gain.exponentialRampToValueAtTime(0.0001, now + 0.11)
      noise.connect(ng); ng.connect(ctx.destination); noise.start(now + 0.05); noise.stop(now + 0.12)
    }
  } catch {}
}

/* ─── New Order Notification Sound ─── */
function playOrderNotificationSound() {
  try {
    const ctx = getSharedAudioCtx()
    if (!ctx) return
    if (ctx.state === 'suspended') ctx.resume().catch(() => {})
    const now = ctx.currentTime
    
    // Play two notes in quick succession (chime effect)
    // First note (E5, 659.25 Hz)
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(659.25, now)
    gain1.gain.setValueAtTime(0.08, now)
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.3)
    osc1.start(now)
    osc1.stop(now + 0.35)

    // Second note (A5, 880.00 Hz) after 0.12 seconds
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(880.00, now + 0.12)
    gain2.gain.setValueAtTime(0.08, now + 0.12)
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.42)
    osc2.start(now + 0.12)
    osc2.stop(now + 0.47)
  } catch {}
}

/* ─── Elapsed timer ─── */
function useElapsed(dateStr: string) {
  const [e, setE] = React.useState('')
  useEffect(() => {
    const up = () => {
      const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
      setE(diff < 60 ? `${diff}s` : diff < 3600 ? `${Math.floor(diff / 60)}m` : `${Math.floor(diff / 3600)}h`)
    }; up(); const id = setInterval(up, 10000); return () => clearInterval(id)
  }, [dateStr]); return e
}

/* ─── Order Card ─── */
function OrderCard({ order, wtToken, onDone, onBroadcast, upiId, upiName, user }: { order: PosOrder; wtToken: string; onDone: (id: string) => void; onBroadcast: (msg: string) => void; upiId?: string; upiName?: string; user?: StaffUser | null }) {
  const elapsed = useElapsed(order.createdAt)
  const waitMins = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000)
  const isUrgent = waitMins > 15
  const [marking, setMarking] = useState(false)
  const [showAllItems, setShowAllItems] = useState(false)

  const tableName = order.table?.name || order.tableNo;
  const floorName = order.table?.floor?.name;
  
  const MAX_ITEMS_TO_SHOW = 3;
  const hasMoreItems = order.items.length > MAX_ITEMS_TO_SHOW;
  const displayedItems = showAllItems ? order.items : order.items.slice(0, MAX_ITEMS_TO_SHOW);
  const [showQr, setShowQr] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'bill' | 'qr'>('bill');
  const [tipAmount, setTipAmount] = useState(0);
  const [tipInput, setTipInput] = useState('');
  const totalWithTip = order.grandTotal + tipAmount;
  const activeUpiId = upiId || 'pay@guestflow';
  const activeUpiName = upiName || 'GuestFlow';
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`upi://pay?pa=${activeUpiId}&pn=${encodeURIComponent(activeUpiName)}&am=${totalWithTip.toFixed(2)}&cu=INR`)}`;

  return (
    <div style={{ background: isUrgent ? 'rgba(251,113,133,0.06)' : 'rgba(255,255,255,0.03)', border: `1.5px solid ${isUrgent ? 'rgba(251,113,133,0.3)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 14, padding: '16px', marginBottom: 12, position: 'relative' }}>
      {isUrgent && <div style={{ position: 'absolute', top: -1, right: 14, background: 'linear-gradient(135deg,#f43f5e,#fb7185)', borderRadius: '0 0 8px 8px', padding: '4px 10px', fontSize: 9, fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.12em', boxShadow: '0 2px 4px rgba(244,63,94,0.3)' }}>⚠ URGENT</div>}
      
      {/* Header section with Order No and Status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 800, letterSpacing: '0.11em', textTransform: 'uppercase', fontFamily: 'monospace', marginBottom: 4 }}>{order.orderNo}</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ 
              fontSize: 10, 
              fontWeight: 800, 
              padding: '3px 8px', 
              borderRadius: 6, 
              textTransform: 'uppercase',
              background: order.status === 'READY' ? 'rgba(52,211,153,0.15)' : 
                          order.status === 'IN_KITCHEN' ? 'rgba(99,102,241,0.15)' : 
                          order.status === 'SERVED' ? 'rgba(56,189,248,0.15)' : 
                          order.status === 'BILL_PRINTED' ? 'rgba(45,212,191,0.15)' : 
                          'rgba(251,191,36,0.15)',
              color: order.status === 'READY' ? '#34d399' : 
                     order.status === 'IN_KITCHEN' ? '#818cf8' : 
                     order.status === 'SERVED' ? '#38bdf8' : 
                     order.status === 'BILL_PRINTED' ? '#2dd4bf' : 
                     '#fbbf24',
              border: order.status === 'READY' ? '1px solid rgba(52,211,153,0.3)' : 
                      order.status === 'IN_KITCHEN' ? '1px solid rgba(99,102,241,0.3)' : 
                      order.status === 'SERVED' ? '1px solid rgba(56,189,248,0.3)' : 
                      order.status === 'BILL_PRINTED' ? '1px solid rgba(45,212,191,0.3)' : 
                      '1px solid rgba(251,191,36,0.3)',
            }}>
              {order.status === 'KOT_RUNNING' ? 'KOT Running' : 
               order.status === 'IN_KITCHEN' ? 'Preparing' : 
               order.status === 'BILL_PRINTED' ? 'Bill Printed' : 
               order.status.toLowerCase().replace('_', ' ')}
            </span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 9, color: '#64748b', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 2 }}>Wait Time</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: isUrgent ? '#fb7185' : '#34d399' }}>{elapsed}</div>
        </div>
      </div>

      {/* Location Details - Floor and Table prominently displayed */}
      <div style={{ background: 'linear-gradient(to right, rgba(255,255,255,0.05), rgba(255,255,255,0.01))', borderRadius: 10, padding: '12px', marginBottom: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {floorName && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', width: '50px' }}>Floor:</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#a5b4fc' }}>{floorName}</span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', width: '50px' }}>{tableName ? 'Table:' : 'Type:'}</span>
            <span style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>{tableName || order.orderType}</span>
          </div>
        </div>
      </div>
      
      {/* Pax and Items count */}
      <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
        <span style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: 20 }}>👥 {order.guestCount} Guests</span>
        <span style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: 20 }}>🛒 {order.items.length} Items</span>
      </div>

      {/* Items detail list */}
      <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 12, padding: '12px', marginBottom: 14, border: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ fontSize: 10, color: '#cbd5e1', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>📋 Order Items</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {displayedItems.map((item, idx) => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, borderBottom: idx === displayedItems.length - 1 && (!hasMoreItems || showAllItems) ? 'none' : '1px solid rgba(255,255,255,0.03)', paddingBottom: idx === displayedItems.length - 1 && (!hasMoreItems || showAllItems) ? 0 : 8 }}>
              <div style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', fontWeight: 900, borderRadius: 6, width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12 }}>
                {item.quantity}
              </div>
              <div style={{ flex: 1, paddingTop: 2 }}>
                <div style={{ color: '#f8fafc', fontWeight: 600 }}>{item.product?.name || 'Item'}</div>
                {(item.variantName || item.portion) && (
                  <div style={{ fontSize: 11, marginTop: 2, display: 'flex', gap: 6 }}>
                    {item.variantName && <span style={{ color: '#818cf8', background: 'rgba(129,140,248,0.1)', padding: '1px 6px', borderRadius: 4 }}>{item.variantName}</span>}
                    {item.portion && <span style={{ color: '#38bdf8', background: 'rgba(56,189,248,0.1)', padding: '1px 6px', borderRadius: 4 }}>Size: {item.portion}</span>}
                  </div>
                )}
              </div>
            </div>
          ))}
          {hasMoreItems && (
            <div 
              onClick={() => setShowAllItems(!showAllItems)}
              style={{ textAlign: 'center', fontSize: 11, color: '#a5b4fc', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', padding: '6px 0', marginTop: 4, background: 'rgba(165,180,252,0.1)', borderRadius: 8 }}
            >
              {showAllItems ? 'Show Less' : `+ View ${order.items.length - MAX_ITEMS_TO_SHOW} more items`}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button onClick={() => onBroadcast(`${floorName ? floorName + ', ' : ''}${tableName ? 'Table ' + tableName : order.orderType} needs attention — ${waitMins} minutes wait`)} style={{ flex: 1, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.4)', borderRadius: 10, padding: '10px 0', fontSize: 12, fontWeight: 800, color: '#a5b4fc', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em', transition: 'all 0.2s', fontFamily: 'inherit' }}>📻 Broadcast</button>
        <button onClick={async () => { 
          setMarking(true); 
          try { 
            const headers: HeadersInit = { 'Content-Type': 'application/json' };
            if (wtToken) { headers['Authorization'] = `Bearer ${wtToken}`; }
            await fetch(`/api/pos-orders/${order.id}`, {
              method: 'PUT',
              headers,
              body: JSON.stringify({
                status: 'SERVED',
                servedById: user?.id,
                staffMemberId: user?.staffMember?.id,
              })
            }); 
          } catch {}; 
          setMarking(false); 
        }} disabled={marking} style={{ flex: 1, background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.4)', borderRadius: 10, padding: '10px 0', fontSize: 12, fontWeight: 800, color: '#6ee7b7', cursor: marking ? 'not-allowed' : 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em', transition: 'all 0.2s', fontFamily: 'inherit' }}>
          {marking ? '...' : (order.status === 'SERVED' ? '✓ Served' : 'Mark Served')}
        </button>
        {/* Linked Room Folio Billing Option for Table Orders */}
        {(() => {
          const linkedRoom = (() => {
            const instructions = (order as any).deliveryInstructions;
            if (instructions) {
              const m = instructions.match(/ROOM:([^|]+)/);
              if (m) return m[1];
            }
            if (order.tableNo && order.tableNo.includes('Room')) {
              const m = order.tableNo.match(/Room\s*([A-Za-z0-9-]+)/i);
              if (m) return m[1];
            }
            return null;
          })();

          if (!linkedRoom) return null;

          return (
            <button
              onClick={async () => {
                setMarking(true);
                try {
                  const headers: HeadersInit = { 'Content-Type': 'application/json' };
                  if (wtToken) { headers['Authorization'] = `Bearer ${wtToken}`; }
                  await fetch('/api/hotel/post-to-room', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                      roomNumber: linkedRoom,
                      amount: order.grandTotal,
                      description: `Dining Table ${tableName || order.tableNo || ''} (Order #${order.orderNo})`,
                      sourceRefId: order.id
                    })
                  });
                  await fetch(`/api/pos-orders/${order.id}`, { method: 'PUT', headers, body: JSON.stringify({ status: 'COMPLETED' }) });
                  toast.success(`₹${order.grandTotal} billed to Room ${linkedRoom} Folio!`);
                  onDone(order.id);
                } catch {
                  toast.error('Failed to post bill to room.');
                };
                setMarking(false);
              }}
              disabled={marking}
              style={{
                flex: '1 1 100%',
                background: 'rgba(129,140,248,0.18)',
                border: '1px solid rgba(129,140,248,0.4)',
                borderRadius: 10,
                padding: '10px 0',
                fontSize: 11,
                fontWeight: 900,
                color: '#a5b4fc',
                cursor: marking ? 'not-allowed' : 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontFamily: 'inherit'
              }}
            >
              {marking ? '...' : `📋 Post Bill to Room ${linkedRoom}`}
            </button>
          );
        })()}

        {order.status === 'PAYMENT_AWAITING_APPROVAL' ? (
          <div style={{ flex: '1 1 100%', background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.5)', borderRadius: 10, padding: '10px 0', fontSize: 12, fontWeight: 800, color: '#fbbf24', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            ⏳ Awaiting Payment Approval
          </div>
        ) : (
          <button onClick={() => { setShowQr(!showQr); setPaymentStep('bill'); }} style={{ flex: '1 1 100%', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)', borderRadius: 10, padding: '10px 0', fontSize: 12, fontWeight: 800, color: '#fbbf24', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em', transition: 'all 0.2s', fontFamily: 'inherit' }}>
            {showQr ? 'Hide Details' : '₹ Request Payment'}
          </button>
        )}
      </div>

      {showQr && (
        <div style={{ marginTop: 12, padding: 16, background: 'rgba(0,0,0,0.3)', borderRadius: 12, textAlign: 'center', border: '1px solid rgba(245,158,11,0.3)' }}>

          {paymentStep === 'bill' ? (
            /* ── Step 1: Bill Receipt ── */
            <>
              <div style={{ background: '#f8fafc', color: '#1e293b', borderRadius: '12px', padding: '14px', marginBottom: '14px', textAlign: 'left', border: '1px solid rgba(0,0,0,0.1)' }}>
                <div style={{ textAlign: 'center', paddingBottom: '10px', borderBottom: '1px dashed #cbd5e1', marginBottom: '10px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', color: '#1e293b' }}>
                    {upiName || 'POS RESTAURANT'}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingBottom: '8px', borderBottom: '1px dashed #cbd5e1', fontSize: '9px', color: '#64748b', textTransform: 'uppercase', fontWeight: 800, fontFamily: 'monospace' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Order No</span>
                    <span style={{ color: '#0f172a', fontWeight: 900 }}>{order.orderNo}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Table</span>
                    <span style={{ color: '#4f46e5', fontWeight: 900 }}>{tableName ? `Table ${tableName}` : 'Walk-in'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Timestamp</span>
                    <span style={{ color: '#0f172a', fontWeight: 900 }}>
                      {(() => {
                        const d = order.createdAt ? new Date(order.createdAt) : new Date();
                        return format(isValid(d) ? d : new Date(), 'dd/MM/yyyy HH:mm');
                      })()}
                    </span>
                  </div>
                </div>

                {/* Itemized List */}
                <div style={{ paddingTop: '8px', paddingBottom: '8px', minHeight: '60px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 60px', fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', color: '#64748b', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', marginBottom: '6px', fontFamily: 'monospace' }}>
                    <span>Item</span>
                    <span style={{ textAlign: 'center' }}>Qty × Price</span>
                    <span style={{ textAlign: 'right' }}>Total</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {order.items.map(item => {
                      const itemPrice = item.unitPrice || 0;
                      const itemTotal = item.quantity * itemPrice;
                      return (
                        <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1fr 70px 60px', fontSize: '11px', color: '#334155', fontWeight: 700 }}>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.product?.name || 'Item'}
                            {item.variantName ? ` (${item.variantName})` : ''}
                          </span>
                          <span style={{ textAlign: 'center', color: '#64748b', fontFamily: 'monospace' }}>
                            {item.quantity} × ₹{itemPrice.toFixed(0)}
                          </span>
                          <span style={{ textAlign: 'right', fontWeight: 800, color: '#0f172a', fontFamily: 'monospace' }}>
                            ₹{itemTotal.toFixed(0)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Calculations */}
                <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 800, fontFamily: 'monospace' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Subtotal</span>
                    <span style={{ color: '#0f172a', fontWeight: 900 }}>₹{(order.subtotal || order.grandTotal).toFixed(0)}</span>
                  </div>
                  {order.taxAmount ? (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Tax & Charges</span>
                      <span style={{ color: '#0f172a', fontWeight: 900 }}>₹{order.taxAmount.toFixed(0)}</span>
                    </div>
                  ) : null}
                  {order.discountAmount ? (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e11d48' }}>
                      <span>Discount</span>
                      <span style={{ fontWeight: 900 }}>-₹{order.discountAmount.toFixed(0)}</span>
                    </div>
                  ) : null}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#4f46e5', borderTop: '1px solid #cbd5e1', paddingTop: '6px', marginTop: '2px', fontWeight: 900 }}>
                    <span>Bill Total</span>
                    <span>₹{order.grandTotal.toFixed(0)}</span>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setPaymentStep('qr')}
                style={{ width: '100%', background: '#fbbf24', border: 'none', borderRadius: 8, padding: '12px 0', fontSize: 12, fontWeight: 900, color: '#000', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em' }}
              >
                Show Payment QR ➔
              </button>
            </>
          ) : (
            /* ── Step 2: Tip & Payment QR ── */
            <>
              {/* Back Button */}
              <button 
                onClick={() => setPaymentStep('bill')}
                style={{ display: 'block', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 12px', fontSize: 10, fontWeight: 800, color: '#a5b4fc', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12, fontFamily: 'inherit' }}
              >
                ➔ Back to Bill
              </button>

              {/* ── Tip Section ── */}
              <div style={{ marginBottom: 14, textAlign: 'left' }}>
                <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>💰 Add Tip (Optional)</div>
                {/* Preset tip % buttons */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                  {[0, 10, 15, 20].map(pct => {
                    const tipVal = pct === 0 ? 0 : Math.round(order.grandTotal * pct / 100);
                    const isActive = pct === 0 ? tipAmount === 0 && tipInput === '' : tipAmount === tipVal && tipInput === String(tipVal);
                    return (
                      <button key={pct} onClick={() => { setTipAmount(tipVal); setTipInput(pct === 0 ? '' : String(tipVal)); }}
                        style={{ flex: 1, background: isActive ? 'rgba(245,158,11,0.35)' : 'rgba(255,255,255,0.05)', border: `1px solid ${isActive ? '#fbbf24' : 'rgba(255,255,255,0.1)'}`, borderRadius: 8, padding: '7px 0', fontSize: 11, fontWeight: 800, color: isActive ? '#fbbf24' : '#94a3b8', cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit' }}>
                        {pct === 0 ? 'No Tip' : `${pct}%`}
                      </button>
                    );
                  })}
                </div>
                {/* Custom tip input */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: '8px 12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <span style={{ fontSize: 14, color: '#fbbf24', fontWeight: 900 }}>₹</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="Custom tip amount"
                    value={tipInput}
                    onChange={e => {
                      const val = e.target.value;
                      setTipInput(val);
                      const num = parseFloat(val);
                      setTipAmount(isNaN(num) || num < 0 ? 0 : num);
                    }}
                    style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 14, fontWeight: 700, color: '#f1f5f9', fontFamily: 'inherit' }}
                  />
                </div>
              </div>

              {/* ── Amount breakdown ── */}
              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 14px', marginBottom: 12, textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>
                  <span>Order Total</span>
                  <span>₹{order.grandTotal.toFixed(0)}</span>
                </div>
                {tipAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#34d399', marginBottom: 4 }}>
                    <span>Tip</span>
                    <span>+ ₹{tipAmount.toFixed(0)}</span>
                  </div>
                )}
                <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '8px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 900, color: '#fbbf24' }}>
                  <span>Grand Total</span>
                  <span>₹{totalWithTip.toFixed(0)}</span>
                </div>
              </div>

              {/* ── QR Code ── */}
              <div style={{ fontSize: 11, color: '#fbbf24', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Scan to Pay ₹{totalWithTip.toFixed(0)}</div>
              <img src={qrCodeUrl} alt="UPI QR" style={{ width: 180, height: 180, margin: '0 auto', borderRadius: 10, border: '4px solid #fff', display: 'block' }} />
              <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 10, marginBottom: 14 }}>{activeUpiId}</div>

              <button onClick={async () => { 
                setMarking(true); 
                try { 
                  const headers: HeadersInit = { 'Content-Type': 'application/json' }; 
                  if (wtToken) { headers['Authorization'] = `Bearer ${wtToken}`; } 
                  // Pass tip info so counter can see it
                  const tipRef = JSON.stringify({ tip: tipAmount, staffName: typeof window !== 'undefined' ? (JSON.parse(localStorage.getItem('staff_portal_session') || '{}')?.user?.fullName || '') : '' });
                  await fetch(`/api/pos-orders/${order.id}`, { method: 'PUT', headers, body: JSON.stringify({ status: 'PAYMENT_AWAITING_APPROVAL', onlinePaymentReference: tipRef }) }); 
                  // We do NOT call onDone here because we want the order to stay on screen until counter approves
                } catch {}; 
                setMarking(false);
                setShowQr(false);
              }} disabled={marking} style={{ width: '100%', background: '#fbbf24', border: 'none', borderRadius: 8, padding: '12px 0', fontSize: 12, fontWeight: 900, color: '#000', cursor: marking ? 'not-allowed' : 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {marking ? '...' : 'Guest Paid (Send to Counter)'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}




/* ── Room Order Card Component (Clean Room Folio Billing) ── */
function RoomOrderCard({
  order,
  wtToken,
  onRefresh,
  user,
}: {
  order: any;
  wtToken: string;
  onRefresh: () => void;
  user?: StaffUser | null;
}) {
  const [marking, setMarking] = useState(false);
  const [clearing, setClearing] = useState(false);

  const statusColor = order.status === 'CONFIRMED' ? '#fbbf24' : order.status === 'SERVED' ? '#34d399' : order.status === 'COMPLETED' ? '#818cf8' : '#94a3b8';
  const statusBg = order.status === 'CONFIRMED' ? 'rgba(251,191,36,0.1)' : order.status === 'SERVED' ? 'rgba(52,211,153,0.1)' : order.status === 'COMPLETED' ? 'rgba(129,140,248,0.1)' : 'rgba(255,255,255,0.04)';

  const grandTotal = order.totalAmount || order.grandTotal || 0;

  const serverName = order.staffMember?.name || order.servedBy?.name || null;
  const serverDesignation = order.staffMember?.designation || null;

  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '14px', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', letterSpacing: '0.1em', fontFamily: 'monospace' }}>{order.orderNo}</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#f1f5f9', marginTop: 2 }}>🏨 Room {order.roomNumber || '—'}</div>
          {order.guestName && <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{order.guestName}</div>}
        </div>
        <span style={{ background: statusBg, color: statusColor, border: `1px solid ${statusColor}40`, borderRadius: 6, padding: '3px 9px', fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {order.status}
        </span>
      </div>

      {/* Itemized preview */}
      <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: '10px', marginBottom: 10 }}>
        {(order.items || []).slice(0, 4).map((item: any, idx: number) => (
          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#e2e8f0', padding: '3px 0', borderBottom: idx < Math.min((order.items || []).length, 4) - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
            <span style={{ fontWeight: 700 }}>{item.qty || item.quantity}x {item.name || item.product?.name}</span>
            <span style={{ color: '#818cf8', fontWeight: 800 }}>₹{(item.lineTotal || item.totalAmount || item.unitPrice * (item.qty || item.quantity) || 0).toFixed(0)}</span>
          </div>
        ))}
        {order.items?.length > 4 && <div style={{ fontSize: 10, color: '#475569', marginTop: 4, textAlign: 'center' }}>+{order.items.length - 4} more items</div>}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontSize: 14, fontWeight: 900, color: '#fbbf24' }}>₹{grandTotal.toFixed(0)}</div>
        <div style={{ fontSize: 10, color: '#818cf8', fontWeight: 800, background: 'rgba(129,140,248,0.12)', padding: '3px 8px', borderRadius: 6, border: '1px solid rgba(129,140,248,0.3)' }}>
          📋 Room Folio Bill
        </div>
      </div>

      {serverName && (
        <div style={{ marginBottom: 10, fontSize: 11, color: '#34d399', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 8, padding: '6px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>✓ Served by:</span>
            <strong style={{ color: '#fff' }}>{serverName}</strong>
            {serverDesignation && <span style={{ color: '#a5b4fc', fontSize: 10 }}>({serverDesignation})</span>}
          </div>
          <span style={{ fontSize: 9, color: '#6ee7b7', background: 'rgba(52,211,153,0.2)', padding: '2px 6px', borderRadius: 4, fontWeight: 800 }}>ID SAVED</span>
        </div>
      )}

      {order.specialNote && (
        <div style={{ marginBottom: 10, fontSize: 10, color: '#94a3b8', background: 'rgba(255,255,255,0.03)', borderRadius: 6, padding: '5px 8px', fontStyle: 'italic' }}>
          📝 {order.specialNote}
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
        {/* Step 1: Mark Served */}
        <button
          onClick={async () => {
            setMarking(true);
            try {
              const headers: HeadersInit = { 'Content-Type': 'application/json' };
              if (wtToken) { headers['Authorization'] = `Bearer ${wtToken}`; }
              await fetch(`/api/pos-orders/${order.id}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({
                  status: 'SERVED',
                  servedById: user?.id,
                  staffMemberId: user?.staffMember?.id,
                })
              });
              onRefresh();
            } catch {};
            setMarking(false);
          }}
          disabled={marking || order.status === 'SERVED'}
          style={{
            width: '100%',
            background: order.status === 'SERVED' ? 'rgba(52,211,153,0.08)' : 'rgba(52,211,153,0.15)',
            border: '1px solid rgba(52,211,153,0.4)',
            borderRadius: 10,
            padding: '10px 0',
            fontSize: 12,
            fontWeight: 800,
            color: '#6ee7b7',
            cursor: (marking || order.status === 'SERVED') ? 'not-allowed' : 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            fontFamily: 'inherit',
          }}
        >
          {marking ? '...' : (order.status === 'SERVED' ? '✓ Served to Room' : 'Mark Served')}
        </button>

        {/* Step 2: Billed to Room (Click to Complete & Clear Order) */}
        <button
          onClick={async () => {
            setClearing(true);
            try {
              const headers: HeadersInit = { 'Content-Type': 'application/json' };
              if (wtToken) { headers['Authorization'] = `Bearer ${wtToken}`; }
              await fetch(`/api/pos-orders/${order.id}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({
                  status: 'COMPLETED',
                  servedById: user?.id,
                  staffMemberId: user?.staffMember?.id,
                })
              });
              onRefresh();
            } catch {};
            setClearing(false);
          }}
          disabled={clearing}
          style={{
            width: '100%',
            background: 'rgba(129,140,248,0.18)',
            border: '1px solid rgba(129,140,248,0.4)',
            borderRadius: 10,
            padding: '10px 0',
            fontSize: 11,
            fontWeight: 900,
            color: '#a5b4fc',
            cursor: clearing ? 'not-allowed' : 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            fontFamily: 'inherit',
            transition: 'all 0.2s',
          }}
        >
          {clearing ? 'Clearing...' : `📋 Billed to Room ${order.roomNumber || ''} (Clear Order)`}
        </button>
      </div>
    </div>
  );
}




/* ── Location Sharing Panel ─────────────────────────────────
   Embedded in the Settings tab.
   Shows live GPS status — always ON, no toggle needed.
──────────────────────────────────────────────────────────── */
function LocationSharingPanel({
  sharing,
  status,
  lastDist,
  error,
}: {
  sharing: boolean;
  status: string;
  lastDist: string | null;
  error: string | null;
}) {
  return (
    <div style={{ marginTop: 22, marginBottom: 4 }}>
      <div style={{ fontSize: 8, fontWeight: 800, color: '#64748b', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 11 }}>📍 Location Sharing</div>
      <div style={{
        background: sharing ? 'rgba(52,211,153,0.05)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${sharing ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: 13, padding: '14px', transition: 'all 0.3s',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10, flexShrink: 0,
            background: sharing ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${sharing ? 'rgba(52,211,153,0.3)' : 'rgba(255,255,255,0.07)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
          }}>📡</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#f1f5f9', marginBottom: 3 }}>
              Share My Location
            </div>
            <div style={{ fontSize: 10, color: sharing ? '#34d399' : '#475569', lineHeight: 1.4, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              {sharing && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', animation: 'pulse 1s infinite', flexShrink: 0, display: 'inline-block' }} />}
              {status}
              {lastDist && <span style={{ color: '#64748b' }}>· {lastDist} from base</span>}
            </div>
            {error && <div style={{ fontSize: 9, color: '#f87171', marginTop: 3 }}>{error}</div>}
          </div>
          {/* Always ON indicator */}
          <div style={{
            background: sharing ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${sharing ? 'rgba(52,211,153,0.4)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 8,
            padding: '4px 10px',
            fontSize: 9,
            fontWeight: 900,
            color: sharing ? '#34d399' : '#475569',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            flexShrink: 0,
          }}>
            {sharing ? '● Active' : '◌ Starting…'}
          </div>
        </div>
        <div style={{ marginTop: 10, fontSize: 9, color: '#334155', lineHeight: 1.5 }}>
          GPS location is shared automatically with your manager. Always active while logged in.
        </div>
      </div>
    </div>
  )
}




/* ══════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════ */
export default function StaffPortalPage({ params }: { params: Promise<{ propertyCode: string }> }) {
  const [propertyCode, setPropertyCode] = useState('')
  useEffect(() => { params.then(p => setPropertyCode(p.propertyCode)) }, [params])

  const isAudioUnlocked = useAudioUnlocked()

  /* Auth */
  const [user, setUser] = useState<StaffUser | null>(null)
  const [wtToken, setWtToken] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)

  /* UI */
  const [activeTab, setActiveTab] = useState<Tab>('ptt')

  /* Keep activeTabRef in sync so socket handlers can read it */
  useEffect(() => { activeTabRef.current = activeTab }, [activeTab])

  /* Contacts & Channels */
  const [contacts, setContacts] = useState<Contact[]>([])
  const [channels, setChannels] = useState<Channel[]>([])
  const [selectedChannelId, setSelectedChannelId] = useState('')
  const [newChannelName, setNewChannelName] = useState('')
  const [isEmergency, setIsEmergency] = useState(false)

  /* PTT Mode: 'group' (broadcast) or 'direct' (person-to-person) */
  const [pttMode, setPttMode] = useState<'group' | 'direct'>('group')
  const [dmTargetId, setDmTargetId] = useState('')  // staff id selected for direct voice
  const [dmTargetName, setDmTargetName] = useState('')
  const [dmLoading, setDmLoading] = useState(false)

  /* Orders */
  const [orders, setOrders] = useState<PosOrder[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)

  /* Take Order Flow */
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [dbTables, setDbTables] = useState<any[]>([])
  const [dbProducts, setDbProducts] = useState<any[]>([])
  const [tablesLoading, setTablesLoading] = useState(false)
  const [productsLoading, setProductsLoading] = useState(false)
  const [orderTableId, setOrderTableId] = useState('')
  const [orderRoomNumber, setOrderRoomNumber] = useState('')
  const [orderCart, setOrderCart] = useState<{ [itemId: string]: { id: string; name: string; unitPrice: number; quantity: number; variantId?: string | null; variantName?: string | null; portion?: string } }>({})
  const [orderSearchQuery, setOrderSearchQuery] = useState('')
  const [orderCategory, setOrderCategory] = useState('all')
  const [placingOrder, setPlacingOrder] = useState(false)
  const [selectedProductForVariant, setSelectedProductForVariant] = useState<any | null>(null)

  /* Room Order Flow */
  const [showRoomOrderModal, setShowRoomOrderModal] = useState(false)
  const [dbRooms, setDbRooms] = useState<any[]>([])
  const [roomsLoading, setRoomsLoading] = useState(false)
  const [selectedRoomId, setSelectedRoomId] = useState('')
  const [selectedRoomNumber, setSelectedRoomNumber] = useState('')
  const [roomOrderCart, setRoomOrderCart] = useState<{ [itemId: string]: { id: string; name: string; unitPrice: number; quantity: number; variantId?: string | null; variantName?: string | null } }>({})
  const [roomOrderSearch, setRoomOrderSearch] = useState('')
  const [roomOrderCategory, setRoomOrderCategory] = useState('all')
  const [placingRoomOrder, setPlacingRoomOrder] = useState(false)
  const [roomOrderProductForVariant, setRoomOrderProductForVariant] = useState<any | null>(null)
  const [roomSpecialNote, setRoomSpecialNote] = useState('')
  const [postToFolio, setPostToFolio] = useState(true)
  const [roomServiceOrders, setRoomServiceOrders] = useState<any[]>([])
  const [roomServiceOrdersLoading, setRoomServiceOrdersLoading] = useState(false)
  const [markingRoomOrderId, setMarkingRoomOrderId] = useState<string | null>(null)

  /* Socket / PTT */
  const [socketStatus, setSocketStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isBusy, setIsBusy] = useState(false)

  /* ── Incoming voice info — speaker name + WHICH channel ── */
  const [incomingVoice, setIncomingVoice] = useState<{ name: string; channelId: string; channelName: string } | null>(null)

  const [audioLevel, setAudioLevel] = useState(0)
  const [latency, setLatency] = useState<number | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  const logEndRef = useRef<HTMLDivElement>(null)

  /* Agora */
  const AgoraRTCRef = useRef<any>(null)
  const agoraClientRef = useRef<any>(null)
  const localAudioTrackRef = useRef<any>(null)
  const [isRtcMockMode, setIsRtcMockMode] = useState(true)
  const [rtcStatus, setRtcStatus] = useState('Standby')

  /* Settings */
  const [settings, setSettings] = useState({ autoBroadcast: false, ttsEnabled: false })

  /* ── Global background auto-play hook ─────────────────────────
     Plays incoming voice messages automatically on ANY tab.
     Edit useAutoPlay.ts to change the behaviour.
  ────────────────────────────────────────────────────────────── */
  const { triggerPlay, playingInfo, stopAll } = useAutoPlay({
    wtToken: wtToken,
    autoPlayEnabled: true,
    currentUserId: user?.id || ''
  })

  const triggerPlayRef = useRef(triggerPlay)
  const contactsRef = useRef<Contact[]>([])

  /* Recording & History */
  const [talkHistory, setTalkHistory] = useState<any[]>([])
  const [allChannelHistory, setAllChannelHistory] = useState<Record<string, any[]>>({}) // channelId -> messages

  /* Unread messages badge */
  const [unreadCount, setUnreadCount] = useState(0)
  const [unreadOrdersCount, setUnreadOrdersCount] = useState(0)
  const prevOrdersRef = useRef<Record<string, string>>({})
  const isFirstLoadRef = useRef(true)
  const vibrationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const activeTabRef = useRef<Tab>('ptt')
  const activeTalkIdRef = useRef<string | null>(null)
  const mediaRecorderRef = useRef<any>(null)
  const audioChunksRef = useRef<any[]>([])

  const socketRef = useRef<Socket | null>(null)
  const isPressingRef = useRef(false)
  const channelsRef = useRef<Channel[]>([])
  const wtTokenRef = useRef('')

  const selectedChannelIdRef = useRef('')
  const userRef = useRef<any>(null)
  const pttButtonRef = useRef<HTMLDivElement>(null)

  // Keep refs in sync
  useEffect(() => { channelsRef.current = channels }, [channels])
  useEffect(() => { wtTokenRef.current = wtToken }, [wtToken])
  useEffect(() => { selectedChannelIdRef.current = selectedChannelId }, [selectedChannelId])
  useEffect(() => { userRef.current = user }, [user])
  useEffect(() => { triggerPlayRef.current = triggerPlay }, [triggerPlay])
  useEffect(() => { contactsRef.current = contacts }, [contacts])

  /* Location Sharing background tracking states */
  const [sharing, setSharing] = useState(false)
  const [sharingStatus, setSharingStatus] = useState<string>('Off')
  const [sharingLastDist, setSharingLastDist] = useState<string | null>(null)
  const [sharingError, setSharingError] = useState<string | null>(null)
  const watchIdRef = useRef<number | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastCoordsRef = useRef<{ lat: number; lng: number } | null>(null)
  const lastUpdateTimeRef = useRef<number>(0)

  const sendPing = useCallback(async (lat: number, lng: number) => {
    if (!wtTokenRef.current) return
    // autoAttendance is always true — always clock in/out automatically
    const autoAttendance = true

    try {
      const res = await fetch('/api/staff-location/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${wtTokenRef.current}` },
        body: JSON.stringify({ lat, lng, autoAttendance }),
      })
      if (res.ok) {
        const j = await res.json()
        const dist = j.ping?.distanceFromBase
        if (dist != null) {
          setSharingLastDist(dist < 1000 ? `${Math.round(dist)} m` : `${(dist / 1000).toFixed(2)} km`)
          setSharingStatus(j.ping.isOutOfRange ? '⚠ Out of range!' : '✓ Sharing')
        } else {
          setSharingStatus('✓ Sharing')
        }
      }
    } catch { /* ignore */ }
  }, [])

  const startSharing = useCallback(() => {
    setSharingError(null)
    if (!navigator.geolocation) { setSharingError('Geolocation not supported by this browser'); return }
    setSharingStatus('Getting location…')
    setSharing(true)
    lastUpdateTimeRef.current = 0

    // Save preference so page refresh keeps it on
    try { localStorage.setItem('loc_sharing', '1') } catch { }

    const getOptions = (highAccuracy: boolean) => ({
      enableHighAccuracy: highAccuracy,
      maximumAge: 30000,  // Allow cached position up to 30s for fast & reliable lock
      timeout: 30000,     // 30 seconds timeout so GPS chip has enough time to acquire lock
    })

    const updateLocation = (pos: GeolocationPosition) => {
      setSharingError(null)
      const now = Date.now()
      const timeSinceLastSuccess = lastUpdateTimeRef.current ? (now - lastUpdateTimeRef.current) : Infinity

      // Dynamic accuracy: allow wider accuracy if we haven't had updates recently
      let maxAllowedAccuracy = 300 // default accuracy allowance
      if (timeSinceLastSuccess > 300000) { // 5 minutes
        maxAllowedAccuracy = 1000
      } else if (timeSinceLastSuccess > 120000) { // 2 minutes
        maxAllowedAccuracy = 500
      }

      if (pos.coords.accuracy && pos.coords.accuracy > maxAllowedAccuracy) {
        console.warn(`[GPS] Skipping low accuracy coordinate: ${pos.coords.accuracy}m (max allowed: ${maxAllowedAccuracy}m)`)
        setSharingStatus(`Seeking GPS signal (${Math.round(pos.coords.accuracy)}m)…`)
        return
      }

      lastUpdateTimeRef.current = now
      const lat = pos.coords.latitude
      const lng = pos.coords.longitude
      lastCoordsRef.current = { lat, lng }
      setSharing(true)
      setSharingStatus(`✓ Sharing (${lat.toFixed(4)}, ${lng.toFixed(4)})`)
      sendPing(lat, lng)
    }

    const handleLocationError = (err: GeolocationPositionError) => {
      console.warn('Geolocation error:', err)
      
      // If high accuracy failed with timeout (code 3) or position unavailable (code 2), fallback silently to low accuracy (WiFi/Cell)
      if (err.code === 3 || err.code === 2) {
        setSharingError(null) // clear temporary timeout error
        setSharingStatus(`Seeking location (network fallback)…`)
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            updateLocation,
            (fallbackErr) => {
              // Only set error if even network fallback fails
              if (fallbackErr.code === 1) {
                setSharingError('Location permission denied.')
              } else {
                setSharingStatus(`Retrying location fix…`)
              }
              if (lastCoordsRef.current) {
                sendPing(lastCoordsRef.current.lat, lastCoordsRef.current.lng)
              }
            },
            getOptions(false)
          )
          return
        }
      }

      // Only turn off / show error if permission is denied (code 1)
      if (err.code === 1) {
        setSharingError(`Location permission denied. Please allow location access in browser.`)
        setSharing(false)
        setSharingStatus('Off')
        try { localStorage.removeItem('loc_sharing') } catch { }
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current)
          watchIdRef.current = null
        }
      } else {
        setSharingStatus(`Seeking GPS signal…`)
        if (lastCoordsRef.current) {
          sendPing(lastCoordsRef.current.lat, lastCoordsRef.current.lng)
        }
      }
    }

    // Start watching position
    watchIdRef.current = navigator.geolocation.watchPosition(
      updateLocation,
      handleLocationError,
      getOptions(true)
    )

    // Repeat ping fallback only if watchPosition has been silent
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      const timeSinceLastUpdate = Date.now() - lastUpdateTimeRef.current
      if (timeSinceLastUpdate > 45000) {
        console.log(`[GPS] watchPosition seems inactive (last update ${Math.round(timeSinceLastUpdate / 1000)}s ago). Fetching getCurrentPosition fallback.`)
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            updateLocation,
            handleLocationError,
            getOptions(true)
          )
        }
      }
    }, 30000)
  }, [sendPing])

  const stopSharing = useCallback(() => {
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current)
    if (intervalRef.current !== null) clearInterval(intervalRef.current)
    watchIdRef.current = null; intervalRef.current = null; lastCoordsRef.current = null
    setSharing(false); setSharingStatus('Off'); setSharingLastDist(null)
    try { localStorage.removeItem('loc_sharing') } catch { }
  }, [])

  // Auto-start GPS sharing as soon as user logs in (always ON)
  // Permission is requested once by the browser; after that it auto-starts every session
  useEffect(() => {
    if (!wtToken) return
    // Always start sharing automatically — no toggle needed
    startSharing()
  }, [wtToken, startSharing])

  // Cleanup on unmount
  useEffect(() => () => {
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current)
    if (intervalRef.current !== null) clearInterval(intervalRef.current)
  }, [])

  /* ── Logs ── */
  const addLog = useCallback((msg: string) => {
    const ts = new Date().toLocaleTimeString()
    setLogs(prev => [...prev.slice(-49), `[${ts}] ${msg}`])
  }, [])
  useEffect(() => {
    const consoleElement = logEndRef.current?.parentElement
    if (consoleElement) {
      consoleElement.scrollTop = consoleElement.scrollHeight
    }
  }, [logs])

  /* ── Load Agora SDK ── */
  useEffect(() => {
    if (typeof window === 'undefined') return
    import('agora-rtc-sdk-ng').then(m => {
      AgoraRTCRef.current = m.default
      AgoraRTCRef.current.setLogLevel(3)
      addLog('🎙️ Agora RTC SDK ready.')
    }).catch(() => addLog('⚠️ Agora SDK unavailable — mock mode active.'))
  }, [])

  /* ── Cleanup on unmount ── */
  useEffect(() => () => {
    localAudioTrackRef.current?.close()
    agoraClientRef.current?.leave().catch(() => {})
    socketRef.current?.disconnect()
  }, [])

  /* ── Restore session OR auto-login from main /login session ── */
  useEffect(() => {
    if (!propertyCode) return
    const run = async () => {
      try {
        // 1. Try existing staff portal session first
        const s = localStorage.getItem('staff_portal_session')
        if (s) {
          const p = JSON.parse(s)
          if (p.user && p.wtToken) {
            setUser(p.user)
            setWtToken(p.wtToken)
            const userPropCode = p.user.property?.code?.toLowerCase()
            if (userPropCode && propertyCode && userPropCode !== propertyCode.toLowerCase()) {
              window.location.href = `/staff-portal/${userPropCode}`
            }
            return
          }
        }

        // 2. No local session — try to auto-login using main session cookie
        const sessionRes = await fetch('/api/auth/session')
        if (!sessionRes.ok) return
        const sessionData = await sessionRes.json()
        if (!sessionData.authenticated) return

        // 3. Call staff-login API with the main session's user ID to get WT token
        const wtRes = await fetch('/api/walkie-talkie/staff-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: sessionData.user.id,
            propertyCode,
            fromMainSession: true,
          }),
        })
        if (!wtRes.ok) return
        const wtData = await wtRes.json()
        if (!wtData.user || !wtData.wtToken) return

        // 4a. Check if this user belongs to a different portal (e.g. Housekeeper)
        if (wtData.portalRedirect) {
          localStorage.setItem('hk_portal_session', JSON.stringify({ user: wtData.user, wtToken: wtData.wtToken }))
          window.location.href = wtData.portalRedirect
          return
        }

        // 4b. Normal staff — save and set session
        setUser(wtData.user)
        setWtToken(wtData.wtToken)
        localStorage.setItem('staff_portal_session', JSON.stringify({ user: wtData.user, wtToken: wtData.wtToken }))

        // Redirect if property mismatch
        const userPropCode = wtData.user.property?.code?.toLowerCase()
        if (userPropCode && propertyCode && userPropCode !== propertyCode.toLowerCase()) {
          window.location.href = `/staff-portal/${userPropCode}`
        }
      } catch {}
    }
    run()

    try {
      const st = localStorage.getItem('staff_portal_settings')
      if (st) setSettings(JSON.parse(st))
    } catch {}
  }, [propertyCode])

  /* ── On login: connect + load data ── */
  useEffect(() => {
    if (!user || !wtToken) return
    connectSocket()
    loadChannels(wtToken)
    loadContacts(wtToken)
    addLog(`✅ Welcome, ${user.fullName}!`)
  }, [user?.id, wtToken])

  /* ── Auto-refresh orders every 8 seconds in background when user is logged in ── */
  useEffect(() => {
    if (!user) return
    loadOrders(true)
    const interval = setInterval(() => loadOrders(true), 8000)
    return () => clearInterval(interval)
  }, [user?.id])

  /* ── Request Notification Permission ── */
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          console.log('[Notification Permission] Result:', permission);
        });
      }
    }
    // Setup mobile audio unlock listeners
    setupMobileAudioUnlock()
  }, []);

  /* ── Continuous Vibration Loop for Unread Orders ── */
  useEffect(() => {
    if (unreadOrdersCount > 0 && activeTab !== 'pos') {
      // Start vibration loop if not running
      if (!vibrationIntervalRef.current) {
        vibrationIntervalRef.current = setInterval(() => {
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([300, 100, 300]);
          }
        }, 5000); // Vibrate every 5 seconds
      }
    } else {
      // Stop vibration loop
      if (vibrationIntervalRef.current) {
        clearInterval(vibrationIntervalRef.current);
        vibrationIntervalRef.current = null;
      }
    }

    return () => {
      if (vibrationIntervalRef.current) {
        clearInterval(vibrationIntervalRef.current);
        vibrationIntervalRef.current = null;
      }
    };
  }, [unreadOrdersCount, activeTab]);

  /* ── Dynamic Tab Title Flashing for Unread Orders ── */
  useEffect(() => {
    const defaultTitle = user?.property?.name 
      ? `${user.property.name} - Staff Portal`
      : 'Staff Portal';

    if (unreadOrdersCount > 0 && activeTab !== 'pos') {
      let isAlternate = false;
      const interval = setInterval(() => {
        if (isAlternate) {
          document.title = defaultTitle;
        } else {
          document.title = unreadOrdersCount === 1 
            ? '⚠️ (1) New Order!' 
            : `⚠️ (${unreadOrdersCount}) New Orders!`;
        }
        isAlternate = !isAlternate;
      }, 1500);

      return () => {
        clearInterval(interval);
        document.title = defaultTitle;
      };
    } else {
      document.title = defaultTitle;
    }
  }, [unreadOrdersCount, activeTab, user]);

  /* ── Load all channel histories when Messages tab is opened ── */
  useEffect(() => {
    if (activeTab === 'messages' && user && channels.length > 0) {
      loadAllChannelHistories()
    }
  }, [activeTab, channels, user])

  /* ── Real audio level animation ── */
  useEffect(() => {
    let id: number
    const tick = () => {
      if (isSpeaking) {
        if (!isRtcMockMode && localAudioTrackRef.current) {
          try { setAudioLevel(Math.min(100, Math.floor(localAudioTrackRef.current.getVolumeLevel() * 180))) }
          catch { setAudioLevel(Math.floor(Math.random() * 50) + 30) }
        } else setAudioLevel(Math.floor(Math.random() * 55) + 35)
      } else if (incomingVoice) {
        if (!isRtcMockMode && agoraClientRef.current) {
          try {
            const lvl = agoraClientRef.current.remoteUsers?.[0]?.audioTrack?.getVolumeLevel?.() ?? 0
            setAudioLevel(Math.min(100, Math.floor(lvl * 180)) || Math.floor(Math.random() * 45) + 25)
          } catch { setAudioLevel(Math.floor(Math.random() * 45) + 25) }
        } else setAudioLevel(Math.floor(Math.random() * 45) + 25)
      } else setAudioLevel(0)
      id = requestAnimationFrame(tick)
    }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [isSpeaking, incomingVoice, isRtcMockMode])

  /* ══════════ AUTH ══════════ */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthLoading(true); setAuthError('')
    try {
      const res = await fetch('/api/walkie-talkie/staff-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email.trim(), password, propertyCode }),
      })
      const data = await res.json()
      if (!res.ok) { setAuthError(data.message || 'Login failed'); return }

      // ── Role-based portal redirect ──────────────────────────────────────
      // If backend says this user belongs to a different portal (e.g. Housekeeper),
      // save their session there and redirect — they never land on this portal.
      if (data.portalRedirect) {
        // Save session for the target portal
        localStorage.setItem('hk_portal_session', JSON.stringify({ user: data.user, wtToken: data.wtToken }))
        window.location.href = data.portalRedirect
        return
      }

      // ── Normal staff (Waiter, Captain, etc.) stays here ────────────────
      setUser(data.user); setWtToken(data.wtToken)
      localStorage.setItem('staff_portal_session', JSON.stringify({ user: data.user, wtToken: data.wtToken }))

      // Redirect if property code mismatch
      const userPropCode = data.user.property?.code?.toLowerCase()
      if (userPropCode && propertyCode && userPropCode !== propertyCode.toLowerCase()) {
        window.location.href = `/staff-portal/${userPropCode}`
      }
    } catch { setAuthError('Network error. Try again.') }
    finally { setAuthLoading(false) }
  }

  const handleLogout = async () => {
    stopSharing()
    stopAll()
    localAudioTrackRef.current?.close(); localAudioTrackRef.current = null
    agoraClientRef.current?.leave().catch(() => {}); agoraClientRef.current = null
    socketRef.current?.disconnect()
    setUser(null); setWtToken(''); setContacts([]); setChannels([]); setOrders([])
    setSocketStatus('disconnected'); setIsSpeaking(false); setIncomingVoice(null)
    prevOrdersRef.current = {}
    isFirstLoadRef.current = true
    if (vibrationIntervalRef.current) {
      clearInterval(vibrationIntervalRef.current);
      vibrationIntervalRef.current = null;
    }
    setRtcStatus('Standby'); setIsRtcMockMode(true); setLogs([])
    localStorage.removeItem('staff_portal_session')
    // Clear BOTH cookies: staff_session + main session cookie
    // Without clearing the main session, auto-login fires again → infinite spinner
    await Promise.allSettled([
      fetch('/api/auth/staff-logout', { method: 'POST' }),
      fetch('/api/auth/logout', { method: 'POST' }),
    ])
    // Redirect to main login page
    window.location.href = '/login'
  }


  /* ══════════ SOCKET.IO ══════════ */
  const connectSocket = useCallback(() => {
    socketRef.current?.disconnect()
    setSocketStatus('connecting')
    const socketUrl = typeof window !== 'undefined'
      ? (window.location.hostname.includes('guestflow.in')
          ? `${window.location.protocol}//${window.location.hostname}`
          : `${window.location.protocol}//${window.location.hostname}:5005`)
      : 'http://localhost:5005'
    const socket = io(socketUrl, {
      auth: { token: wtTokenRef.current },
      transports: ['websocket']
    })
    socketRef.current = socket

    socket.on('connect', () => {
      setSocketStatus('connected')
      addLog(`🔌 Socket connected to ${socketUrl}`)
      // Latency ping every 5s
      const pid = setInterval(() => {
        const t = Date.now()
        socket.emit('ping_ptt', {}, () => setLatency(Date.now() - t))
      }, 5000)
      socket.once('disconnect', () => {
        clearInterval(pid)
        setSocketStatus('disconnected')
        addLog(`🔌 Socket disconnected from ${socketUrl}`)
      })
    })

    socket.on('connect_error', (err: any) => {
      setSocketStatus('disconnected')
      addLog(`❌ Socket connection error: ${err.message}`)
      console.error('[Socket Connect Error]', err)
    })

    socket.on('error', (err: any) => {
      addLog(`❌ Socket error: ${err}`)
      console.error('[Socket Error]', err)
    })

    socket.on('joined_channel_success', (d: any) => {
      const ch = channelsRef.current.find(c => c.id === d.channelId)
      addLog(`✅ Joined channel: ${ch?.name || d.channelId}`)
    })

    socket.on('speaker_started', (d: any) => {
      // Find which channel the voice came on
      const ch = channelsRef.current.find(c => c.id === d.channelId)
      const chName = ch?.name || 'Unknown Channel'
      
      if (d.channelId === selectedChannelIdRef.current) {
        playChirp('start')
      }

      if (d.userId === userRef.current?.id) {
        setIsSpeaking(true); setIsBusy(false)
        activeTalkIdRef.current = d.talkId
        addLog(`🎙️ You are speaking on "${chName}"`)
      } else {
        setIsBusy(d.channelId === selectedChannelIdRef.current)
        setIncomingVoice({ name: d.name, channelId: d.channelId, channelName: chName })
        addLog(`📡 "${d.name}" speaking on "${chName}"`)
      }
    })

    socket.on('speaker_stopped', (d: any) => {
      const ch = channelsRef.current.find(c => c.id === d.channelId)
      if (d.channelId === selectedChannelIdRef.current) {
        setIsSpeaking(false); setIsBusy(false); setIncomingVoice(null)
        playChirp('stop')
      } else {
        setIncomingVoice(prev => (prev && prev.channelId === d.channelId) ? null : prev)
      }
      addLog(`🔇 Transmission ended on "${ch?.name || d.channelId}"`)

      // Trigger global background voice message autoplay
      const speakerName = contactsRef.current.find(c => c.id === d.userId)?.name || 'Someone'
      triggerPlayRef.current(d.channelId, d.userId, speakerName, d.talkId)

      // Auto-reload history after a brief delay for upload completion
      setTimeout(() => {
        loadHistory(selectedChannelIdRef.current)
        // Increment unread badge if Messages tab is not currently open
        if (activeTabRef.current !== 'messages') {
          setUnreadCount(prev => prev + 1)
        }
      }, 1500)
    })

    socket.on('speaker_busy', (d: any) => {
      const chName = channelsRef.current.find(c => c.id === d.channelId)?.name
      if (d.channelId === selectedChannelIdRef.current) {
        setIsBusy(true); setIsSpeaking(false)
        setIncomingVoice({ name: d.currentSpeakerName || 'Someone', channelId: d.channelId || '', channelName: chName || 'Channel' })
        playChirp('stop')
      } else {
        setIncomingVoice(prev => (!prev || prev.channelId === d.channelId) ? { name: d.currentSpeakerName || 'Someone', channelId: d.channelId || '', channelName: chName || 'Channel' } : prev)
      }
      addLog(`🚫 Busy: ${d.currentSpeakerName} holding mic`)
    })

    socket.on('staff_status_changed', (d: any) => {
      setContacts(prev => prev.map(c => c.id === d.userId ? { ...c, wtStatus: d.status } : c))
      addLog(`👤 ${d.name} → ${d.status}`)
    })

    socket.on('connect_error', (e: any) => {
      setSocketStatus('disconnected')
      addLog(`❌ Connection error: ${e.message}`)
    })
    socket.on('disconnect', () => {
      setSocketStatus('disconnected'); setIsSpeaking(false); setIsBusy(false); setIncomingVoice(null)
      addLog('🔌 Disconnected from server')
    })
  }, []) // stable — no deps needed, uses refs

  /* ── Join all socket rooms when connected and channels list is loaded ── */
  useEffect(() => {
    if (socketStatus === 'connected' && socketRef.current && channels.length > 0) {
      channels.forEach(ch => {
        socketRef.current?.emit('join_channel', { channelId: ch.id })
      })
    }
  }, [socketStatus, channels])

  /* ══════════ AGORA RTC ══════════ */
  const joinAgoraChannel = useCallback(async (channelId: string) => {
    if (!AgoraRTCRef.current) { setIsRtcMockMode(true); setRtcStatus('SDK not loaded'); return }

    if (!agoraClientRef.current) {
      agoraClientRef.current = AgoraRTCRef.current.createClient({ mode: 'rtc', codec: 'vp8' })

      // ── Auto-subscribe: all members in the group hear each other ──
      agoraClientRef.current.on('user-published', async (remoteUser: any, mediaType: string) => {
        if (mediaType === 'audio') {
          await agoraClientRef.current.subscribe(remoteUser, 'audio')
          remoteUser.audioTrack?.play()
          addLog(`🔊 Receiving audio from group member`)
        }
      })
      agoraClientRef.current.on('user-unpublished', () => {})
    }

    try {
      setRtcStatus('Joining group voice...')
      const res = await fetch('/api/walkie-talkie/ptt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${wtTokenRef.current}` },
        body: JSON.stringify({ channelId }),  // channelId = group ID = Agora room
      })
      const data = await res.json()
      if (!res.ok) { setIsRtcMockMode(true); setRtcStatus('Token error'); return }

      if (data.appId && data.appId !== 'mock_agora_app_id') {
        try { await agoraClientRef.current.leave() } catch {}
        // Join the Agora room using the SAME channel ID as the group
        // This means all group members share the same voice room automatically
        await agoraClientRef.current.join(data.appId, data.channelId, data.token, data.userId)
        setIsRtcMockMode(false); setRtcStatus('Group voice active ✓')
        addLog(`✅ Joined voice room for group: ${channelsRef.current.find(c => c.id === channelId)?.name || channelId}`)
      } else {
        setIsRtcMockMode(true); setRtcStatus('Mock mode (no Agora key)')
        addLog('💡 Mock mode — add AGORA_APP_ID to .env for real group voice')
      }
    } catch (err: any) {
      setIsRtcMockMode(true); setRtcStatus('Error — mock fallback')
      addLog(`⚠️ Agora error: ${err.message}`)
    }
  }, [])

  /* ── Join channel: socket room + Agora voice room ── */
  const joinChannel = useCallback(async (channelId: string) => {
    if (!channelId) return
    if (socketRef.current?.connected) {
      socketRef.current.emit('join_channel', { channelId })
    }
    // Join Agora voice room so we can RECEIVE voice from others in the group
    await joinAgoraChannel(channelId)
  }, [joinAgoraChannel])

  useEffect(() => {
    if (!selectedChannelId || !user) return
    joinChannel(selectedChannelId)
  }, [selectedChannelId])

  useEffect(() => {
    if (selectedChannelId && user) {
      loadHistory(selectedChannelId)
    }
  }, [selectedChannelId])

  /* ── Publish/unpublish mic to group ── */
  const publishMic = useCallback(async () => {
    if (isRtcMockMode || !agoraClientRef.current || !AgoraRTCRef.current) {
      addLog('🎙️ [Mock] Speaking (no real audio — add Agora key)')
      return
    }
    try {
      localAudioTrackRef.current = await AgoraRTCRef.current.createMicrophoneAudioTrack()
      await agoraClientRef.current.publish([localAudioTrackRef.current])
      setRtcStatus('Broadcasting to group...')
      addLog('🎙️ Voice published to all group members')
    } catch (e: any) { addLog(`❌ Mic error: ${e.message}`) }
  }, [isRtcMockMode])

  const unpublishMic = useCallback(async () => {
    if (isRtcMockMode || !agoraClientRef.current) return
    try {
      if (localAudioTrackRef.current) {
        await agoraClientRef.current.unpublish([localAudioTrackRef.current])
        localAudioTrackRef.current.close(); localAudioTrackRef.current = null
        setRtcStatus('Group voice active ✓')
        addLog('🔇 Voice ended')
      }
    } catch {}
  }, [isRtcMockMode])

  /* ── PTT hold/release ── */
  const loadHistory = useCallback(async (channelId: string) => {
    if (!channelId) return
    try {
      const r = await fetch(`/api/walkie-talkie/ptt?channelId=${channelId}`, {
        headers: { Authorization: `Bearer ${wtTokenRef.current || wtToken}` }
      })
      if (r.ok) {
        const d = await r.json()
        setTalkHistory(d)
      }
    } catch {}
  }, [wtToken])

  /* ── Load history for ALL channels (for grouped messages view) ── */
  const loadAllChannelHistories = useCallback(async () => {
    const token = wtTokenRef.current || wtToken
    const results: Record<string, any[]> = {}
    await Promise.all(
      channelsRef.current.map(async (ch) => {
        try {
          const r = await fetch(`/api/walkie-talkie/ptt?channelId=${ch.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (r.ok) {
            const d = await r.json()
            results[ch.id] = d
          } else {
            results[ch.id] = []
          }
        } catch {
          results[ch.id] = []
        }
      })
    )
    setAllChannelHistory(results)
  }, [wtToken])

  const handlePTTStop = useCallback(async () => {
    if (!isPressingRef.current) return
    isPressingRef.current = false
    const channelId = selectedChannelIdRef.current
    if (socketRef.current?.connected && channelId) {
      socketRef.current.emit('ptt_stop', { channelId })
    }
    await unpublishMic()

    // Stop local recording
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
  }, [unpublishMic])

  // Global release handler for mouseup and touchend to ensure PTT release is robust
  useEffect(() => {
    const handleGlobalRelease = () => {
      if (isPressingRef.current) {
        handlePTTStop()
      }
    }
    window.addEventListener('mouseup', handleGlobalRelease)
    window.addEventListener('touchend', handleGlobalRelease)
    return () => {
      window.removeEventListener('mouseup', handleGlobalRelease)
      window.removeEventListener('touchend', handleGlobalRelease)
    }
  }, [handlePTTStop])

  const handlePTTStart = useCallback(async () => {
    const channelId = selectedChannelIdRef.current
    if (!socketRef.current?.connected || !channelId) {
      addLog('⚠️ Select a channel and connect first'); return
    }
    if (isPressingRef.current || isBusy) return
    isPressingRef.current = true
    activeTalkIdRef.current = null
    socketRef.current.emit('ptt_start', { channelId })
    await publishMic()

    // Start local recording
    try {
      let stream: MediaStream
      let isMockStream = false

      if (localAudioTrackRef.current) {
        // Reuse the track already opened by Agora to avoid NotReadableError: Could not start audio source
        const track = localAudioTrackRef.current.getMediaStreamTrack()
        stream = new MediaStream([track])
      } else if (typeof window !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        isMockStream = true
      } else {
        addLog('🚫 Mic recording disabled: Secure context (HTTPS) required on non-localhost devices.')
        return
      }

      // Check if user already released the button while initializing the stream
      if (!isPressingRef.current) {
        if (isMockStream) {
          stream.getTracks().forEach(track => track.stop())
        }
        return
      }

      let options = {}
      if (typeof MediaRecorder.isTypeSupported === 'function') {
        if (MediaRecorder.isTypeSupported('audio/webm')) {
          options = { mimeType: 'audio/webm' }
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          options = { mimeType: 'audio/mp4' }
        }
      }
      const mediaRecorder = new MediaRecorder(stream, options)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const mimeType = mediaRecorder.mimeType || 'audio/webm'
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType })
        const talkId = activeTalkIdRef.current

        if (talkId) {
          const formData = new FormData()
          formData.append('talkId', talkId)
          formData.append('file', audioBlob, `${talkId}.webm`)

          try {
            addLog('📤 Uploading local voice recording...')
            const res = await fetch('/api/walkie-talkie/upload-recording', {
              method: 'POST',
              headers: { Authorization: `Bearer ${wtTokenRef.current || wtToken}` },
              body: formData
            })
            if (res.ok) {
              addLog('✅ Voice message saved locally.')
              loadHistory(selectedChannelIdRef.current)
            } else {
              addLog('❌ Upload failed.')
            }
          } catch (err: any) {
            addLog(`❌ Upload failed: ${err.message}`)
          }
        }
        // Stop stream tracks only if it was a fresh/mock stream we acquired ourselves
        if (isMockStream) {
          stream.getTracks().forEach(track => track.stop())
        }
      }

      mediaRecorder.start()
    } catch (e: any) {
      console.error('Error starting media recorder:', e)
      addLog(`❌ Recording error: ${e.message}`)
    }
  }, [publishMic, isBusy, wtToken, loadHistory])

  // Hook non-passive touch event listeners to PTT button to support preventDefault on mobile.
  useEffect(() => {
    const btn = pttButtonRef.current
    if (!btn) return

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault()
      handlePTTStart()
    }

    const onTouchEnd = (e: TouchEvent) => {
      e.preventDefault()
      handlePTTStop()
    }

    btn.addEventListener('touchstart', onTouchStart, { passive: false })
    btn.addEventListener('touchend', onTouchEnd, { passive: false })

    return () => {
      btn.removeEventListener('touchstart', onTouchStart)
      btn.removeEventListener('touchend', onTouchEnd)
    }
  }, [handlePTTStart, handlePTTStop])



  const loadContacts = async (token = wtToken) => {
    try {
      const r = await fetch('/api/walkie-talkie/contacts', { headers: { Authorization: `Bearer ${token}` } })
      if (r.ok) { const d = await r.json(); setContacts(d); addLog(`✅ Loaded ${d.length} staff contacts`) }
    } catch {}
  }
  const loadChannels = async (token = wtToken) => {
    try {
      const r = await fetch('/api/walkie-talkie/channels', { headers: { Authorization: `Bearer ${token}` } })
      if (r.ok) {
        const d: Channel[] = await r.json(); setChannels(d)
        if (d.length > 0 && !selectedChannelId) setSelectedChannelId(d[0].id)
        addLog(`✅ Loaded ${d.length} channels`)
      }
    } catch {}
  }

  const fetchTables = useCallback(async () => {
    setTablesLoading(true)
    try {
      const headers: HeadersInit = {}
      const token = wtTokenRef.current || wtToken
      if (token) headers['Authorization'] = `Bearer ${token}`
      const r = await fetch('/api/tables', { headers, cache: 'no-store' })
      if (r.ok) {
        const d = await r.json()
        setDbTables(d.data || [])
      }
    } catch (err) {
      console.error('Error fetching tables:', err)
    } finally {
      setTablesLoading(false)
    }
  }, [wtToken])

  const fetchProducts = useCallback(async () => {
    setProductsLoading(true)
    try {
      const headers: HeadersInit = {}
      const token = wtTokenRef.current || wtToken
      if (token) headers['Authorization'] = `Bearer ${token}`
      const r = await fetch('/api/products', { headers, cache: 'no-store' })
      if (r.ok) {
        const d = await r.json()
        setDbProducts(d.data || [])
      }
    } catch (err) {
      console.error('Error fetching products:', err)
    } finally {
      setProductsLoading(false)
    }
  }, [wtToken])

  useEffect(() => {
    if (showOrderModal) {
      fetchTables()
      fetchProducts()
    }
  }, [showOrderModal, fetchTables, fetchProducts])

  const fetchRooms = useCallback(async () => {
    setRoomsLoading(true)
    try {
      const headers: HeadersInit = {}
      const token = wtTokenRef.current || wtToken
      if (token) headers['Authorization'] = `Bearer ${token}`
      const r = await fetch('/api/hotel/rooms', { headers, cache: 'no-store' })
      if (r.ok) {
        const d = await r.json()
        setDbRooms(d.data || d || [])
      }
    } catch (err) {
      console.error('Error fetching rooms:', err)
    } finally {
      setRoomsLoading(false)
    }
  }, [wtToken])

  const fetchRoomServiceOrders = useCallback(async () => {
    setRoomServiceOrdersLoading(true)
    try {
      const headers: HeadersInit = {}
      const token = wtTokenRef.current || wtToken
      if (token) headers['Authorization'] = `Bearer ${token}`
      const r = await fetch('/api/hotel/room-service', { headers, cache: 'no-store' })
      if (r.ok) {
        const d = await r.json()
        setRoomServiceOrders(d.data || [])
      }
    } catch (err) {
      console.error('Error fetching room service orders:', err)
    } finally {
      setRoomServiceOrdersLoading(false)
    }
  }, [wtToken])

  useEffect(() => {
    if (showRoomOrderModal) {
      fetchRooms()
      fetchProducts()
    }
  }, [showRoomOrderModal, fetchRooms, fetchProducts])

  useEffect(() => {
    if (activeTab === 'room-order' && user) {
      fetchRoomServiceOrders()
      if (dbProducts.length === 0) fetchProducts()
    }
  }, [activeTab, user])

  const handlePlaceRoomOrder = async () => {
    if (!selectedRoomNumber) {
      toast.error('Please select a room first.')
      return
    }
    const cartItems = Object.values(roomOrderCart)
    if (cartItems.length === 0) {
      toast.error('Your cart is empty.')
      return
    }
    setPlacingRoomOrder(true)
    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' }
      const token = wtTokenRef.current || wtToken
      if (token) headers['Authorization'] = `Bearer ${token}`

      const subtotal = cartItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
      const taxAmount = Math.round(subtotal * 0.05)
      const totalAmount = subtotal + taxAmount

      // Find folio for selected room
      const room = dbRooms.find((r: any) => r.id === selectedRoomId)
      const folioId = room?.currentBooking?.folioId || room?.activeFolioId || null

      const payload = {
        roomNumber: selectedRoomNumber,
        orderType: 'ROOM_SERVICE',
        items: cartItems.map(item => ({
          productId: item.id,
          name: item.name,
          qty: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: item.unitPrice * item.quantity,
        })),
        subtotal,
        taxAmount,
        totalAmount,
        postToFolio,
        specialNote: roomSpecialNote,
        folioId,
        servedById: user?.id,
        staffMemberId: user?.staffMember?.id,
      }

      const res = await fetch('/api/hotel/room-service', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        const data = await res.json()
        toast.success(data.data?.message || 'Room service order placed! 🛎️')
        setRoomOrderCart({})
        setSelectedRoomId('')
        setSelectedRoomNumber('')
        setRoomSpecialNote('')
        setShowRoomOrderModal(false)
        fetchRoomServiceOrders()
      } else {
        const err = await res.json()
        toast.error(err.message || 'Failed to place room order.')
      }
    } catch (err) {
      console.error('Room order placement error:', err)
      toast.error('Network error. Failed to place room order.')
    } finally {
      setPlacingRoomOrder(false)
    }
  }

  const handlePlaceOrder = async () => {
    if (!orderTableId) {
      toast.error('Please select a table first.')
      return
    }
    const cartItems = Object.values(orderCart)
    if (cartItems.length === 0) {
      toast.error('Your cart is empty.')
      return
    }
    
    setPlacingOrder(true)
    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' }
      const token = wtTokenRef.current || wtToken
      if (token) headers['Authorization'] = `Bearer ${token}`
      
      const payload = {
        restaurantTableId: orderTableId,
        orderType: 'DINE_IN',
        roomNumber: orderRoomNumber || null,
        postToFolio: !!orderRoomNumber,
        items: cartItems.map(item => ({
          id: item.id,
          name: item.name,
          unitPrice: item.unitPrice,
          sellingPrice: item.unitPrice,
          quantity: item.quantity,
          variantId: item.variantId || null,
          variantName: item.variantName || null,
          portion: item.portion || 'FULL'
        }))
      }

      const res = await fetch('/api/orders/save', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        toast.success('Order placed and KOT generated! 🍳')
        setOrderCart({})
        setOrderTableId('')
        setOrderRoomNumber('')
        setShowOrderModal(false)
        loadOrders() // Refresh orders tab
      } else {
        const err = await res.json()
        toast.error(err.message || 'Failed to place order.')
      }
    } catch (err) {
      console.error('Order placement error:', err)
      toast.error('Network error. Failed to place order.')
    } finally {
      setPlacingOrder(false)
    }
  }

  const loadOrders = async (silent: boolean = false) => {
    console.log('[loadOrders] Called. User state:', user);
    if (!user?.propertyId) {
      console.log('[loadOrders] Exiting early: user or propertyId is missing');
      return
    }
    if (!silent) setOrdersLoading(true)
    try {
      console.log(`[loadOrders] Fetching /api/pos-orders?propertyId=${user.propertyId}&status=in_progress`);
      const headers: HeadersInit = {}
      const token = wtTokenRef.current || wtToken
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      const r = await fetch(`/api/pos-orders?propertyId=${user.propertyId}&status=in_progress`, { headers, cache: 'no-store' })
      console.log('[loadOrders] Response status:', r.status, 'ok:', r.ok);
      if (r.ok) {
        const d = await r.json();
        console.log('[loadOrders] Fetched orders data:', d);
        const activeOrders = (d.data || []).filter((o: any) => 
          !['COMPLETED', 'PAID', 'CANCELLED'].includes(o.status)
        );

        // Detect new orders and status updates
        const newOrders: any[] = [];
        const statusUpdatedOrders: any[] = [];

        activeOrders.forEach((o: any) => {
          const oldStatus = prevOrdersRef.current[o.id];
          if (oldStatus === undefined) {
            newOrders.push(o);
          } else if (oldStatus !== o.status) {
            statusUpdatedOrders.push({ order: o, oldStatus, newStatus: o.status });
          }
        });

        if (!isFirstLoadRef.current) {
          let triggerChime = false;
          let newActivityCount = 0;

          // 1. Handle brand new orders
          if (newOrders.length > 0) {
            triggerChime = true;
            newActivityCount += newOrders.length;
            newOrders.forEach((o: any) => {
              const tableName = o.table?.name || o.tableNo || 'Table';
              toast.info(`🛒 New Order Received: ${o.orderNo} for ${tableName}`);

              // Native System Notification
              if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                try {
                  new Notification("New Order Received! 🛒", {
                    body: `Order ${o.orderNo} for ${tableName}`,
                    tag: o.id,
                  });
                } catch {}
              }
            });
          }

          // 2. Handle order status changes (e.g. from kitchen-display)
          if (statusUpdatedOrders.length > 0) {
            triggerChime = true;
            newActivityCount += statusUpdatedOrders.length;
            statusUpdatedOrders.forEach(({ order, oldStatus, newStatus }) => {
              const tableName = order.table?.name || order.tableNo || 'Table';
              let statusText = newStatus.replace(/_/g, ' ').toLowerCase();
              if (newStatus === 'KOT_RUNNING') statusText = 'KOT Running';
              if (newStatus === 'IN_KITCHEN') statusText = 'Preparing';
              if (newStatus === 'READY') statusText = 'Ready! 🛎️';
              if (newStatus === 'SERVED') statusText = 'Served ✓';
              if (newStatus === 'BILL_PRINTED') statusText = 'Bill Printed 🖨️';
              if (newStatus === 'PAYMENT_AWAITING_APPROVAL') statusText = 'Awaiting Payment Approval ⏳';

              toast.success(`🍳 Order ${order.orderNo} (${tableName}) status changed to: ${statusText}`);

              // Native System Notification
              if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                try {
                  new Notification(`Order Status: ${statusText} 🍳`, {
                    body: `Order ${order.orderNo} (${tableName}) is now ${statusText}`,
                    tag: order.id + '_' + newStatus,
                  });
                } catch {}
              }
            });
          }

          if (triggerChime) {
            playOrderNotificationSound();
            if (activeTabRef.current !== 'pos') {
              setUnreadOrdersCount(prev => prev + newActivityCount);
            }
          }
        }

        // Store current IDs and statuses for next check
        const nextMap: Record<string, string> = {};
        activeOrders.forEach((o: any) => {
          nextMap[o.id] = o.status;
        });
        prevOrdersRef.current = nextMap;
        isFirstLoadRef.current = false;
        setOrders(activeOrders);
      } else {
        const errText = await r.text();
        console.error('[loadOrders] Fetch failed. Status text/body:', errText);
        if (r.status === 401) {
          console.warn('[loadOrders] 401 Unauthorized detected. Stale session. Logging out.');
          handleLogout();
        }
      }
    } catch (err) {
      console.error('[loadOrders] Fetch error:', err);
    }
    if (!silent) setOrdersLoading(false)
  }
  const createChannel = async () => {
    if (!newChannelName.trim()) return
    try {
      const r = await fetch('/api/walkie-talkie/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${wtToken}` },
        body: JSON.stringify({ name: newChannelName.trim(), type: 'group', isEmergency: isEmergency, memberIds: [] }),
      })
      const d = await r.json()
      if (r.ok) { addLog(`✅ Group "${d.channel?.name}" created`); setNewChannelName(''); setIsEmergency(false); loadChannels() }
      else addLog(`❌ Failed: ${d.message}`)
    } catch (e: any) { addLog(`❌ ${e.message}`) }
  }

  /* ── Get or create a private DM channel between current user and targetUserId ── */
  const getOrCreateDmChannel = async (targetUserId: string, targetName: string) => {
    setDmLoading(true)
    try {
      // Look for an existing direct channel with this person already in our list
      const existing = channels.find(ch => ch.type === 'direct' && ch.name.includes(targetName.split(' ')[0]))
      if (existing) {
        setSelectedChannelId(existing.id)
        setDmTargetId(targetUserId)
        setDmTargetName(targetName)
        await joinChannel(existing.id)
        addLog(`📲 DM channel with ${targetName} ready`)
        setDmLoading(false)
        return
      }

      // Create a new direct channel
      const r = await fetch('/api/walkie-talkie/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${wtToken}` },
        body: JSON.stringify({
          name: `DM: ${user?.fullName?.split(' ')[0]} ↔ ${targetName.split(' ')[0]}`,
          type: 'direct',
          isEmergency: false,
          memberIds: [targetUserId]
        }),
      })
      const d = await r.json()
      if (r.ok && d.channel) {
        const newCh: Channel = { id: d.channel.id, name: d.channel.name, type: 'direct', isEmergency: false, membersCount: d.channel.membersCount }
        setChannels(prev => [...prev, newCh])
        setSelectedChannelId(d.channel.id)
        setDmTargetId(targetUserId)
        setDmTargetName(targetName)
        await joinChannel(d.channel.id)
        addLog(`📲 DM channel created with ${targetName}`)
      } else {
        addLog(`❌ DM failed: ${d.message}`)
      }
    } catch (e: any) {
      addLog(`❌ DM error: ${e.message}`)
    }
    setDmLoading(false)
  }

  const broadcastTTS = (msg: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(msg); u.lang = 'en-IN'; u.rate = 0.9
      window.speechSynthesis.speak(u)
    }
  }

  const updateSettings = (key: keyof typeof settings, val: boolean) => {
    const next = { ...settings, [key]: val }; setSettings(next)
    localStorage.setItem('staff_portal_settings', JSON.stringify(next))
  }

  /* ── Derived ── */
  const activeChannel = channels.find(c => c.id === selectedChannelId)
  const statusColor = socketStatus === 'connected' ? '#34d399' : socketStatus === 'connecting' ? '#fbbf24' : '#ef4444'
  const propName = user?.property?.name || propertyCode?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Restaurant'

  /* ══════════════════════════════════════════════════════
     AUTO-AUTH LOADING — no separate login form needed
     Staff come here already authenticated from /login
  ══════════════════════════════════════════════════════ */
  if (!user) return (
    <div style={{ minHeight: '100dvh', background: '#06080f', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: '"Inter",-apple-system,sans-serif', gap: 16 }}>
      <div style={{ width: 48, height: 48, border: '3px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ fontSize: 12, fontWeight: 700, color: '#475569', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Loading Staff Portal...</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  /* ══════════════════════════════════════════════════════
     DASHBOARD — fixed viewport layout
  ══════════════════════════════════════════════════════ */
  const tabs: { key: Tab; label: string; emoji: string }[] = [
    { key: 'ptt', label: 'PTT', emoji: '📻' },
    { key: 'messages', label: 'Messages', emoji: '💬' },
    { key: 'pos', label: 'Orders', emoji: '📋' },
    { key: 'room-order', label: 'Room Svc', emoji: '🏨' },
    { key: 'attendance', label: 'Attend', emoji: '📅' },
    { key: 'settings', label: 'Settings', emoji: '⚙️' },
  ]

  /* When user opens tabs — clear corresponding unread badges */
  const handleTabChange = (key: Tab) => {
    setActiveTab(key)
    if (key === 'messages') {
      setUnreadCount(0)
    }
    if (key === 'pos') {
      setUnreadOrdersCount(0)
      loadOrders(false) // Trigger an immediate non-silent load when switching to POS/Orders tab
    }
  }

  return (
    <div style={{ height: '100dvh', maxWidth: 500, margin: '0 auto', background: '#0a0c12', fontFamily: '"Inter",-apple-system,sans-serif', color: '#f1f5f9', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Toaster richColors position="top-center" theme="dark" />

      {/* ━━━ HEADER ━━━ */}
      <header style={{ flexShrink: 0, padding: '10px 16px', background: 'rgba(255,255,255,0.025)', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backdropFilter: 'blur(16px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.fullName}
              style={{ width: 32, height: 32, borderRadius: 9, objectFit: 'cover', border: '1.5px solid rgba(99,102,241,0.4)', flexShrink: 0 }}
            />
          ) : (
            <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg,#6366f1,#818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, boxShadow: '0 0 12px rgba(99,102,241,0.3)', flexShrink: 0 }}>📻</div>
          )}
          <div>
            <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1 }}>{propName}</div>
            <div style={{ fontSize: 9, color: '#64748b', fontWeight: 700, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {user.fullName} · {user.designation || user.staffMember?.designation || (user.role?.name && !user.role.name.includes('Housekeeper') ? user.role.name : 'Waiter')}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.05)', borderRadius: 7, padding: '3px 9px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor, boxShadow: `0 0 5px ${statusColor}`, flexShrink: 0 }} />
            <span style={{ fontSize: 9, fontWeight: 800, color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              {socketStatus === 'connected' ? `${latency ?? '?'}ms` : socketStatus}
            </span>
          </div>
          <button onClick={handleLogout} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 7, padding: '6px 9px', cursor: 'pointer', color: '#f87171', fontSize: 12, lineHeight: 1 }}>⏻</button>
        </div>
      </header>

      {/* ━━━ AUDIO UNLOCKED NOTICE BANNER ━━━ */}
      {!isAudioUnlocked && (
        <div 
          onClick={() => {
            if (typeof window !== 'undefined') {
              // Dispatch click to trigger the global gesture listener immediately
              document.dispatchEvent(new MouseEvent('click'))
            }
          }}
          style={{
            flexShrink: 0,
            background: 'linear-gradient(90deg, #b91c1c, #7f1d1d)',
            borderBottom: '1px solid rgba(239,68,68,0.3)',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            cursor: 'pointer',
            animation: 'pulse 2s infinite',
          }}
        >
          <span style={{ fontSize: 16 }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 900, color: '#fecaca', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Sound is Blocked by Phone
            </div>
            <div style={{ fontSize: 9, color: '#fca5a5', fontWeight: 600 }}>
              Tap anywhere on screen to enable walkie-talkie & order sound
            </div>
          </div>
        </div>
      )}

      {/* ━━━ SYSTEM STATUS / INCOMING VOICE BANNER (FIXED HEIGHT TO PREVENT LAYOUT SHIFT) ━━━ */}
      <div style={{ 
        flexShrink: 0, 
        height: 52, 
        background: incomingVoice 
          ? (incomingVoice.channelId === selectedChannelId 
            ? 'linear-gradient(90deg,rgba(52,211,153,0.15),rgba(52,211,153,0.05))' 
            : 'linear-gradient(90deg,rgba(245,158,11,0.15),rgba(245,158,11,0.05))') 
          : 'rgba(255,255,255,0.015)', 
        borderBottom: `1px solid ${incomingVoice 
          ? (incomingVoice.channelId === selectedChannelId ? 'rgba(52,211,153,0.3)' : 'rgba(245,158,11,0.3)') 
          : 'rgba(255,255,255,0.06)'}`, 
        display: 'flex', 
        alignItems: 'center',
        transition: 'all 0.3s ease'
      }}>
        {incomingVoice ? (
          <div style={{ width: '100%', padding: '0 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ 
              width: 28, 
              height: 28, 
              borderRadius: 8, 
              background: incomingVoice.channelId === selectedChannelId ? 'rgba(52,211,153,0.2)' : 'rgba(245,158,11,0.2)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontSize: 14, 
              flexShrink: 0, 
              animation: 'pulse 1s infinite' 
            }}>
              {incomingVoice.channelId === selectedChannelId ? '🔊' : '📡'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ 
                fontSize: 8, 
                color: incomingVoice.channelId === selectedChannelId ? '#34d399' : '#fbbf24', 
                fontWeight: 800, 
                letterSpacing: '0.12em', 
                textTransform: 'uppercase', 
                marginBottom: 1 
              }}>
                {incomingVoice.channelId === selectedChannelId ? 'Live Voice' : 'Group Activity'} — <span style={{ textDecoration: 'underline' }}>#{incomingVoice.channelName}</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {incomingVoice.name} {incomingVoice.channelId !== selectedChannelId && <span style={{ fontSize: 9, color: '#64748b', fontWeight: 500 }}> (tap group to listen)</span>}
              </div>
            </div>
            {/* Mini audio visualizer */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 18, flexShrink: 0 }}>
              {incomingVoice.channelId === selectedChannelId ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} style={{ width: 3, height: `${Math.max(20, audioLevel * Math.sin((i / 7) * Math.PI) * (0.5 + Math.random() * 0.5))}%`, borderRadius: 2, background: '#34d399', transition: 'height 0.08s' }} />
                ))
              ) : (
                <span style={{ fontSize: 10, animation: 'pulse 1s infinite', color: '#fbbf24', fontWeight: 900 }}>● LIVE</span>
              )}
            </div>
          </div>
        ) : (
          <div style={{ width: '100%', padding: '0 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, flexShrink: 0 }}>🟢</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 8, color: '#475569', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 1 }}>Squelch Status</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>All Channels Secure & Silent</div>
            </div>
          </div>
        )}
      </div>

      {/* ━━━ TABS ━━━ */}
      <div style={{ flexShrink: 0, display: 'flex', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '3px 6px', gap: 3 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => handleTabChange(t.key)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '7px 4px', borderRadius: 9, border: 'none', cursor: 'pointer', transition: 'all 0.18s', background: activeTab === t.key ? 'rgba(99,102,241,0.18)' : 'transparent', color: activeTab === t.key ? '#818cf8' : '#475569', fontFamily: 'inherit', position: 'relative' }}>
            <span style={{ fontSize: 13, position: 'relative' }}>
              {t.emoji}
              {/* Unread badge — only on Messages tab */}
              {t.key === 'messages' && unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: -5,
                  right: -7,
                  minWidth: 15,
                  height: 15,
                  borderRadius: 8,
                  background: 'linear-gradient(135deg,#f43f5e,#fb7185)',
                  color: '#fff',
                  fontSize: 8,
                  fontWeight: 900,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 3px',
                  boxShadow: '0 0 8px rgba(244,63,94,0.7)',
                  animation: 'pulse 1.2s ease-in-out infinite',
                  lineHeight: 1,
                  letterSpacing: 0,
                  fontFamily: 'inherit',
                }}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
              {/* Unread badge — on Orders/POS tab */}
              {t.key === 'pos' && unreadOrdersCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: -5,
                  right: -7,
                  minWidth: 15,
                  height: 15,
                  borderRadius: 8,
                  background: 'linear-gradient(135deg,#f43f5e,#fb7185)',
                  color: '#fff',
                  fontSize: 8,
                  fontWeight: 900,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 3px',
                  boxShadow: '0 0 8px rgba(244,63,94,0.7)',
                  animation: 'pulse 1.2s ease-in-out infinite',
                  lineHeight: 1,
                  letterSpacing: 0,
                  fontFamily: 'inherit',
                }}>
                  {unreadOrdersCount > 99 ? '99+' : unreadOrdersCount}
                </span>
              )}
            </span>
            <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{t.label}</span>
            {activeTab === t.key && <div style={{ width: 16, height: 2, background: '#6366f1', borderRadius: 1 }} />}
          </button>
        ))}
      </div>

      {/* ━━━ SCROLLABLE TAB CONTENT ━━━ */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 13px 24px', WebkitOverflowScrolling: 'touch' }}>

        {/* ══════════ PTT TAB ══════════ */}
        {activeTab === 'ptt' && (
          <div>
            {/* ── MODE TOGGLE: Group vs Direct ── */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 13, padding: 4 }}>
              <button
                onClick={() => { setPttMode('group'); setDmTargetId(''); setDmTargetName('') }}
                style={{ flex: 1, padding: '9px 0', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 800, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', transition: 'all 0.18s',
                  background: pttMode === 'group' ? 'linear-gradient(135deg,rgba(99,102,241,0.35),rgba(129,140,248,0.2))' : 'transparent',
                  color: pttMode === 'group' ? '#818cf8' : '#475569',
                  boxShadow: pttMode === 'group' ? '0 0 10px rgba(99,102,241,0.2)' : 'none',
                  border: pttMode === 'group' ? '1px solid rgba(99,102,241,0.35)' : '1px solid transparent'
                }}
              >📻 Group</button>
              <button
                onClick={() => { setPttMode('direct'); setSelectedChannelId('') }}
                style={{ flex: 1, padding: '9px 0', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 800, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', transition: 'all 0.18s',
                  background: pttMode === 'direct' ? 'linear-gradient(135deg,rgba(52,211,153,0.25),rgba(52,211,153,0.1))' : 'transparent',
                  color: pttMode === 'direct' ? '#34d399' : '#475569',
                  boxShadow: pttMode === 'direct' ? '0 0 10px rgba(52,211,153,0.15)' : 'none',
                  border: pttMode === 'direct' ? '1px solid rgba(52,211,153,0.35)' : '1px solid transparent'
                }}
              >📲 Direct</button>
            </div>

            {/* ── GROUP MODE: Channel select ── */}
            {pttMode === 'group' && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 8, fontWeight: 800, color: '#64748b', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 7, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Select Group Channel</span>
                  <button onClick={() => loadChannels()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', fontSize: 11 }}>🔄</button>
                </div>
                {channels.filter(ch => ch.type !== 'direct').length === 0
                  ? <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 11, padding: '12px', fontSize: 11, color: '#334155', textAlign: 'center' }}>No groups yet — create one below ↓</div>
                  : <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {channels.filter(ch => ch.type !== 'direct').map(ch => (
                      <div key={ch.id} onClick={() => setSelectedChannelId(ch.id)} style={{ background: selectedChannelId === ch.id ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.02)', border: `1.5px solid ${selectedChannelId === ch.id ? 'rgba(99,102,241,0.45)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 11, padding: '10px 13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.15s' }}>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 800, color: '#f1f5f9' }}>{ch.isEmergency ? '🚨 ' : ''}{ch.name}</div>
                          <div style={{ fontSize: 9, color: '#64748b', marginTop: 1 }}>{ch.membersCount || 0} members</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {selectedChannelId === ch.id && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#6366f1', boxShadow: '0 0 7px #6366f1' }} />}
                          {incomingVoice?.channelId === ch.id && (
                            <span style={{ fontSize: 8, fontWeight: 900, color: '#818cf8', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 5, padding: '2px 6px', textTransform: 'uppercase', letterSpacing: '0.1em', animation: 'pulse 1s infinite' }}>● LIVE</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>}
              </div>
            )}


            {/* ── DIRECT MODE: pick a staff member ── */}
            {pttMode === 'direct' && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 8, fontWeight: 800, color: '#34d399', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 7, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>📲 Select Staff to Call</span>
                  <button onClick={() => loadContacts()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', fontSize: 11 }}>🔄</button>
                </div>
                {contacts.length === 0 ? (
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 11, padding: '14px', fontSize: 11, color: '#334155', textAlign: 'center' }}>No staff found</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto' }}>
                    {contacts.filter(c => c.id !== user?.id).map(c => {
                      const isSelected = dmTargetId === c.id
                      return (
                        <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: isSelected ? 'rgba(52,211,153,0.08)' : 'rgba(255,255,255,0.02)', border: `1.5px solid ${isSelected ? 'rgba(52,211,153,0.4)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 12, padding: '9px 12px', transition: 'all 0.15s' }}>
                          <div style={{ width: 34, height: 34, borderRadius: 10, background: isSelected ? 'rgba(52,211,153,0.2)' : 'rgba(99,102,241,0.13)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: isSelected ? '#34d399' : '#818cf8', flexShrink: 0 }}>
                            {c.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 800, color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 1 }}>
                              <div style={{ width: 5, height: 5, borderRadius: '50%', background: c.wtStatus === 'online' ? '#34d399' : c.wtStatus === 'busy' ? '#f59e0b' : '#475569', flexShrink: 0 }} />
                              <span style={{ fontSize: 8, color: c.wtStatus === 'online' ? '#34d399' : c.wtStatus === 'busy' ? '#f59e0b' : '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{c.wtStatus || 'offline'}</span>
                              <span style={{ fontSize: 8, color: '#334155' }}>· {c.designation || 'Staff'}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => getOrCreateDmChannel(c.id, c.name)}
                            disabled={dmLoading}
                            style={{ flexShrink: 0, background: isSelected ? 'rgba(52,211,153,0.25)' : 'rgba(99,102,241,0.15)', border: `1px solid ${isSelected ? 'rgba(52,211,153,0.5)' : 'rgba(99,102,241,0.3)'}`, borderRadius: 9, padding: '6px 11px', cursor: dmLoading ? 'wait' : 'pointer', color: isSelected ? '#34d399' : '#818cf8', fontSize: 9, fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'inherit', transition: 'all 0.15s' }}
                          >
                            {dmLoading && dmTargetId === c.id ? '⏳' : isSelected ? '✓ Ready' : '📲 Call'}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
                {dmTargetName && (
                  <div style={{ marginTop: 8, padding: '8px 12px', background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 10, fontSize: 10, color: '#34d399', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>📲</span>
                    <span>Hold PTT to send voice to <strong>{dmTargetName}</strong></span>
                  </div>
                )}
              </div>
            )}

            {/* Create group */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '12px 13px', marginBottom: 12 }}>
              <div style={{ fontSize: 8, fontWeight: 800, color: '#475569', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 8 }}>Create Group</div>
              <div style={{ display: 'flex', gap: 7, marginBottom: 7 }}>
                <input value={newChannelName} onChange={e => setNewChannelName(e.target.value)} onKeyDown={e => e.key === 'Enter' && createChannel()} placeholder="e.g. Kitchen Team" style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 9, padding: '8px 11px', fontSize: 12, color: '#f1f5f9', outline: 'none', fontFamily: 'inherit' }}
                  onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.5)'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                <button onClick={createChannel} style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.35)', borderRadius: 9, padding: '8px 13px', fontSize: 11, fontWeight: 800, color: '#818cf8', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>+ Add</button>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', userSelect: 'none' }}>
                <input type="checkbox" checked={isEmergency} onChange={e => setIsEmergency(e.target.checked)} style={{ accentColor: '#f43f5e', width: 14, height: 14 }} />
                <span style={{ fontSize: 9, color: '#fb7185', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>🚨 Emergency Channel</span>
              </label>
            </div>

            {/* ── WALKIE TALKIE DEVICE ── */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
              <div style={{ width: 260, background: '#141620', border: '3px solid #1c1f2e', borderRadius: 36, padding: '18px 16px', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 16px 48px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.04)' }}>
                {/* Antenna */}
                <div style={{ position: 'absolute', top: -40, left: 36, width: 7, height: 40, background: 'linear-gradient(to bottom,#4b5563,#1f2937)', borderRadius: '3px 3px 0 0' }} />
                {/* Knob */}
                <div style={{ position: 'absolute', top: -16, right: 30, width: 24, height: 16, background: '#1f2937', borderRadius: '5px 5px 0 0', border: '1px solid #374151' }} />
                {/* Brand */}
                <span style={{ fontSize: 8, letterSpacing: '0.3em', fontWeight: 900, color: '#2d3350', textTransform: 'uppercase', marginBottom: 10 }}>GUESTFLOW WT-PRO</span>

                {/* LCD */}
                <div style={{ width: '100%', background: '#0b1a10', border: '2.5px solid #080808', borderRadius: 11, padding: '11px 12px', marginBottom: 12, position: 'relative', overflow: 'hidden', boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.8)' }}>
                  <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.12) 2px,rgba(0,0,0,0.12) 4px)', pointerEvents: 'none' }} />
                  {/* LCD header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, color: 'rgba(74,222,128,0.5)', fontFamily: 'monospace', fontWeight: 700, borderBottom: '1px solid rgba(74,222,128,0.08)', paddingBottom: 5, marginBottom: 6, letterSpacing: '0.15em' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: (isSpeaking || incomingVoice) ? '#4ade80' : 'rgba(74,222,128,0.12)', display: 'inline-block', boxShadow: (isSpeaking || incomingVoice) ? '0 0 5px #4ade80' : 'none' }} />
                      {isSpeaking ? 'TX' : incomingVoice ? 'RX' : 'SQL'}
                    </span>
                    <span>BAT 99%</span>
                  </div>
                  {/* Channel on LCD */}
                  <div style={{ textAlign: 'center', marginBottom: 6 }}>
                    <div style={{ fontSize: 8, color: 'rgba(74,222,128,0.45)', letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: 'monospace', marginBottom: 2 }}>
                       {incomingVoice ? `◄ ${incomingVoice.channelName}` : pttMode === 'direct' && dmTargetName ? `► ${dmTargetName.split(' ')[0].toUpperCase()}` : activeChannel ? 'Active Group' : 'No Group'}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 900, color: '#4ade80', fontFamily: 'monospace', textShadow: '0 0 8px rgba(74,222,128,0.25)', letterSpacing: '0.04em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {pttMode === 'direct' && dmTargetName ? `▶ ${dmTargetName.toUpperCase()}` : activeChannel ? activeChannel.name.toUpperCase() : '[ NO GROUP ]'}
                    </div>
                  </div>
                  {/* Status */}
                  <div style={{ height: 28, background: 'rgba(0,0,0,0.25)', borderRadius: 5, border: '1px solid rgba(74,222,128,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontFamily: 'monospace', letterSpacing: '0.06em', overflow: 'hidden', padding: '0 4px' }}>
                    {isSpeaking
                      ? <span style={{ color: '#4ade80', fontWeight: 900, animation: 'pulse 1s infinite' }}>{pttMode === 'direct' ? `📲 CALLING ${dmTargetName.split(' ')[0].toUpperCase()}` : '🎤 TRANSMITTING TO GROUP'}</span>
                      : incomingVoice
                      ? <span style={{ color: '#fbbf24', fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📡 {incomingVoice.name.toUpperCase()}</span>
                      : <span style={{ color: 'rgba(74,222,128,0.3)' }}>STANDBY / SQUELCH ON</span>}
                  </div>
                  {/* EQ bars */}
                  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 2.5, height: 24, marginTop: 8 }}>
                    {Array.from({ length: 14 }).map((_, i) => {
                      const bell = Math.sin((i / 13) * Math.PI)
                      const h = Math.max(3, Math.floor(audioLevel * bell * (0.5 + Math.random() * 0.5)))
                      return <div key={i} style={{ width: 4.5, height: `${Math.min(100, h)}%`, borderRadius: 2, transition: 'height 0.07s', background: isSpeaking ? '#4ade80' : incomingVoice ? '#fbbf24' : 'rgba(74,222,128,0.1)' }} />
                    })}
                  </div>
                </div>

                {/* Speaker mesh */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 5, marginBottom: 14, opacity: 0.45, width: '68%' }}>
                  {Array.from({ length: 24 }).map((_, i) => <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: '#080808', border: '1px solid #1a1d2a', boxShadow: 'inset 0 1px 1px rgba(0,0,0,0.9)' }} />)}
                </div>

                {/* PTT Button */}
                <div style={{ position: 'relative', marginBottom: 14, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  {isSpeaking && <div style={{ position: 'absolute', inset: -12, borderRadius: '50%', border: '2px solid rgba(99,102,241,0.25)', animation: 'ping 1.2s ease-out infinite' }} />}
                  {isSpeaking && <div style={{ position: 'absolute', inset: -22, borderRadius: '50%', border: '1px solid rgba(99,102,241,0.1)', animation: 'ping 1.2s ease-out 0.3s infinite' }} />}
                  <div
                    ref={pttButtonRef}
                    onMouseDown={handlePTTStart} onMouseUp={handlePTTStop}
                    style={{
                      width: 108, height: 108, borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5,
                      cursor: (isBusy && !isSpeaking) ? 'not-allowed' : 'pointer',
                      userSelect: 'none', WebkitUserSelect: 'none', touchAction: 'none',
                      background: isSpeaking
                        ? 'radial-gradient(circle at 35% 35%,#818cf8,#4338ca)'
                        : isBusy ? 'radial-gradient(circle at 35% 35%,#1c1c2e,#0f0f1a)'
                        : 'radial-gradient(circle at 35% 35%,#252840,#161928)',
                      border: isSpeaking ? '3px solid rgba(99,102,241,0.85)' : isBusy ? '3px solid rgba(239,68,68,0.35)' : '3px solid rgba(255,255,255,0.07)',
                      boxShadow: isSpeaking
                        ? '0 0 0 8px rgba(99,102,241,0.12), 0 0 0 18px rgba(99,102,241,0.05), 0 8px 28px rgba(99,102,241,0.5)'
                        : '0 6px 20px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.05)',
                      transition: 'all 0.12s',
                    }}>
                    <span style={{ fontSize: 26 }}>{(isBusy && !isSpeaking) ? '🔒' : '🎙️'}</span>
                    <span style={{ fontSize: 7, fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', color: isSpeaking ? '#c7d2fe' : isBusy ? '#f87171' : '#374151' }}>
                      {isSpeaking ? 'Speaking' : isBusy ? 'Locked' : 'PTT Hold'}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '78%', fontSize: 7, color: '#2d3350', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                  <span>◀ SQL</span><span>VOL ▶</span>
                </div>
              </div>
            </div>



            {/* Staff contacts */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 8, fontWeight: 800, color: '#64748b', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 7, display: 'flex', alignItems: 'center', gap: 5 }}>
                👥 Staff ({contacts.filter(c => c.wtStatus !== 'offline').length} online / {contacts.length})
                <button onClick={() => loadContacts()} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#475569', fontSize: 11 }}>🔄</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 180, overflowY: 'auto' }}>
                {contacts.length === 0
                  ? <div style={{ fontSize: 11, color: '#1e293b', textAlign: 'center', padding: '12px 0' }}>No staff found</div>
                  : contacts.map(c => (
                    <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 9, background: 'rgba(255,255,255,0.02)', borderRadius: 10, padding: '8px 11px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: '#818cf8', flexShrink: 0 }}>{c.name.slice(0, 2).toUpperCase()}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                        <div style={{ fontSize: 9, color: '#64748b' }}>{c.designation || 'Staff'}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: c.wtStatus === 'online' ? '#34d399' : c.wtStatus === 'busy' ? '#f59e0b' : '#475569', boxShadow: c.wtStatus === 'online' ? '0 0 5px #34d399' : 'none' }} />
                        <span style={{ fontSize: 8, fontWeight: 800, color: c.wtStatus === 'online' ? '#34d399' : c.wtStatus === 'busy' ? '#f59e0b' : '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{c.wtStatus || 'off'}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>


          </div>
        )}

        {/* ══════════ MESSAGES TAB ══════════ */}
        {activeTab === 'messages' && (
          <VoiceMessagesTab
            channels={channels}
            allChannelHistory={allChannelHistory}
            selectedChannelId={selectedChannelId}
            currentUserId={user?.id || ''}
            autoPlayEnabled={true}
            onRefreshAll={loadAllChannelHistories}
            onRefreshChannel={(chId) => loadHistory(chId).then(() => loadAllChannelHistories())}
            playingId={playingInfo?.id || null}
            wtToken={wtToken}
          />
        )}

        {/* ══════════ POS TAB ══════════ */}
        {activeTab === 'pos' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9, marginBottom: 14 }}>
              <div style={{ background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 13, padding: '13px 14px' }}>
                <div style={{ fontSize: 8, fontWeight: 800, color: '#34d399', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 4 }}>Active</div>
                <div style={{ fontSize: 24, fontWeight: 900 }}>{orders.length}</div>
              </div>
              <div style={{ background: 'rgba(251,113,133,0.07)', border: '1px solid rgba(251,113,133,0.2)', borderRadius: 13, padding: '13px 14px' }}>
                <div style={{ fontSize: 8, fontWeight: 800, color: '#fb7185', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 4 }}>Urgent</div>
                <div style={{ fontSize: 24, fontWeight: 900 }}>{orders.filter(o => (Date.now() - new Date(o.createdAt).getTime()) > 15 * 60000).length}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <button onClick={() => loadOrders()} style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 11, padding: '9px', fontSize: 10, fontWeight: 800, color: '#64748b', cursor: 'pointer', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>🔄 Refresh</button>
              <button onClick={() => { setOrderTableId(''); setOrderCart({}); setShowOrderModal(true); }} style={{ flex: 1, background: 'linear-gradient(135deg, #4f46e5, #6366f1)', border: 'none', borderRadius: 11, padding: '9px', fontSize: 10, fontWeight: 800, color: '#fff', cursor: 'pointer', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, boxShadow: '0 4px 12px rgba(79,70,229,0.3)' }}>➕ Take Order</button>
            </div>
            {ordersLoading
              ? <div style={{ textAlign: 'center', padding: '36px 0' }}><div style={{ width: 24, height: 24, border: '2px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%', margin: '0 auto 10px', animation: 'spin 0.8s linear infinite' }} /><div style={{ fontSize: 11, color: '#475569' }}>Loading...</div></div>
              : orders.length === 0
              ? <div style={{ textAlign: 'center', padding: '36px 18px', background: 'rgba(255,255,255,0.02)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.05)' }}><div style={{ fontSize: 30, marginBottom: 8 }}>✅</div><div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>All Clear!</div><div style={{ fontSize: 11, color: '#475569' }}>No active orders</div></div>
              : orders.map(o => <OrderCard key={o.id} order={o} wtToken={wtToken} onDone={id => { setOrders(p => p.filter(x => x.id !== id)); fetchTables(); }} onBroadcast={broadcastTTS} upiId={user?.property?.upiId} upiName={user?.property?.upiName} user={user} />)}
          </div>
        )}



        {/* ══════════ ROOM ORDER TAB ══════════ */}
        {activeTab === 'room-order' && (
          <div>
            {/* Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9, marginBottom: 14 }}>
              <div style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 13, padding: '13px 14px' }}>
                <div style={{ fontSize: 8, fontWeight: 800, color: '#818cf8', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 4 }}>Today's Orders</div>
                <div style={{ fontSize: 24, fontWeight: 900 }}>{roomServiceOrders.length}</div>
              </div>
              <div style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 13, padding: '13px 14px' }}>
                <div style={{ fontSize: 8, fontWeight: 800, color: '#fbbf24', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 4 }}>Pending</div>
                <div style={{ fontSize: 24, fontWeight: 900 }}>{roomServiceOrders.filter((o: any) => !['COMPLETED', 'PAID', 'SERVED'].includes(o.status)).length}</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <button onClick={() => fetchRoomServiceOrders()} style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 11, padding: '9px', fontSize: 10, fontWeight: 800, color: '#64748b', cursor: 'pointer', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>🔄 Refresh</button>
              <button onClick={() => { setSelectedRoomId(''); setSelectedRoomNumber(''); setRoomOrderCart({}); setRoomSpecialNote(''); setShowRoomOrderModal(true); }} style={{ flex: 1, background: 'linear-gradient(135deg, #6366f1, #818cf8)', border: 'none', borderRadius: 11, padding: '9px', fontSize: 10, fontWeight: 800, color: '#fff', cursor: 'pointer', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, boxShadow: '0 4px 12px rgba(99,102,241,0.35)' }}>🛎️ New Room Order</button>
            </div>

            {/* Room Service Orders List */}
            {roomServiceOrdersLoading ? (
              <div style={{ textAlign: 'center', padding: '36px 0' }}><div style={{ width: 24, height: 24, border: '2px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%', margin: '0 auto 10px', animation: 'spin 0.8s linear infinite' }} /><div style={{ fontSize: 11, color: '#475569' }}>Loading...</div></div>
            ) : roomServiceOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 18px', background: 'rgba(255,255,255,0.02)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: 30, marginBottom: 8 }}>🛎️</div>
                <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>No Room Orders Today</div>
                <div style={{ fontSize: 11, color: '#475569' }}>Tap "New Room Order" to place one</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {roomServiceOrders.map((o: any) => (
                  <RoomOrderCard
                    key={o.id}
                    order={o}
                    wtToken={wtToken}
                    onRefresh={() => fetchRoomServiceOrders()}
                    user={user}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════ ATTENDANCE TAB ══════════ */}
        {activeTab === 'attendance' && user && (
          <StaffAttendancePanel user={user} wtToken={wtToken} />
        )}

        {/* ══════════ SETTINGS TAB ══════════ */}
        {activeTab === 'settings' && (
          <div>
            <div style={{ fontSize: 8, fontWeight: 800, color: '#64748b', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 13 }}>Preferences</div>
            {[{ key: 'autoBroadcast' as const, label: 'Auto-broadcast urgent orders', desc: 'Announce orders >15 minutes wait via TTS' }, { key: 'ttsEnabled' as const, label: 'Read new orders aloud', desc: 'Text-to-speech for incoming POS orders' }].map(opt => (
              <div key={opt.key} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 13, padding: '14px', marginBottom: 9, display: 'flex', alignItems: 'center', gap: 13 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#f1f5f9', marginBottom: 3 }}>{opt.label}</div>
                  <div style={{ fontSize: 10, color: '#475569', lineHeight: 1.5 }}>{opt.desc}</div>
                </div>
                <div onClick={() => updateSettings(opt.key, !settings[opt.key])} style={{ width: 42, height: 23, borderRadius: 12, cursor: 'pointer', transition: 'background 0.2s', background: settings[opt.key] ? '#6366f1' : 'rgba(255,255,255,0.1)', position: 'relative', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', top: 2, left: settings[opt.key] ? 20 : 2, width: 19, height: 19, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
                </div>
              </div>
            ))}

            {/* ── Location Sharing ── */}
            <LocationSharingPanel
              sharing={sharing}
              status={sharingStatus}
              lastDist={sharingLastDist}
              error={sharingError}
            />

            <div style={{ fontSize: 8, fontWeight: 800, color: '#64748b', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 11, marginTop: 22 }}>Profile Photo</div>

            {/* Profile Photo Uploader Card */}
            <div style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(129,140,248,0.06))', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 16, padding: '16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
              <ProfilePhotoUploader
                currentPhotoUrl={user.avatarUrl}
                name={user.fullName}
                userType="staff"
                userId={user.id}
                token={wtToken}
                size="md"
                onPhotoUploaded={newUrl => {
                  const updated = { ...user, avatarUrl: newUrl };
                  setUser(updated);
                  localStorage.setItem('wt_staff_session', JSON.stringify({ user: updated, wtToken }));
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: '#fff' }}>{user.fullName}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#818cf8', marginTop: 2 }}>{user.designation || user.staffMember?.designation || 'Staff Member'}</div>
                <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 3 }}>Tap photo to upload from camera or phone</div>
              </div>
            </div>

            <div style={{ fontSize: 8, fontWeight: 800, color: '#64748b', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 11, marginTop: 12 }}>Account</div>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 13, padding: '14px', marginBottom: 12 }}>
              {[['Name', user.fullName], ['Role', user.designation || user.staffMember?.designation || (user.role?.name && !user.role.name.includes('Housekeeper') ? user.role.name : 'Waiter')], ['Property', propName], ['Email', user.email]].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ fontSize: 11, color: '#475569', fontWeight: 700 }}>{l}</span>
                  <span style={{ fontSize: 11, color: '#94a3b8', maxWidth: '60%', textAlign: 'right', wordBreak: 'break-word' }}>{v}</span>
                </div>
              ))}
            </div>

            {/* ── UPI for Tips Section ── */}
            <StaffUpiSettingCard user={user} wtToken={wtToken} />
            <button onClick={handleLogout} style={{ width: '100%', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 13, padding: '12px', fontSize: 11, fontWeight: 800, color: '#f87171', cursor: 'pointer', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>⏻ Sign Out</button>
          </div>
        )}

      </div>{/* end scrollable content */}

      {/* ══════════ ROOM ORDER OVERLAY MODAL ══════════ */}
      {showRoomOrderModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: '#090d16', zIndex: 1000, display: 'flex', flexDirection: 'column', color: '#fff', fontFamily: 'inherit' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {selectedRoomNumber && (
                <button onClick={() => { setSelectedRoomId(''); setSelectedRoomNumber(''); }} style={{ background: 'transparent', border: 'none', color: '#818cf8', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', padding: 0 }}>➔</button>
              )}
              <span style={{ fontSize: 14, fontWeight: 800, letterSpacing: '0.05em' }}>
                {!selectedRoomNumber ? '🏨 Select Hotel Room' : `🛎️ Room ${selectedRoomNumber} — Order`}
              </span>
            </div>
            <button onClick={() => setShowRoomOrderModal(false)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', width: 28, height: 28, color: '#94a3b8', fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          </div>

          {/* Modal Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
            {!selectedRoomNumber ? (
              /* ── Step 1: Room Selector ── */
              <div>
                {roomsLoading ? (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <div style={{ width: 24, height: 24, border: '2px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%', margin: '0 auto 10px', animation: 'spin 0.8s linear infinite' }} />
                    <div style={{ fontSize: 11, color: '#475569' }}>Loading rooms...</div>
                  </div>
                ) : dbRooms.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 16px', color: '#94a3b8' }}>
                    <div style={{ fontSize: 30, marginBottom: 8 }}>🏨</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 4 }}>No Rooms Found</div>
                    <div style={{ fontSize: 11, color: '#475569', lineHeight: 1.5 }}>No hotel rooms configured. Ask your admin.</div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 800, color: '#64748b', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>Select Room for Room Service</div>
                    {(() => {
                      const roomsByFloor = dbRooms.reduce((acc: { [floor: string]: any[] }, room: any) => {
                        const floorKey = room.floor ? `Floor ${room.floor}` : 'Ground Floor';
                        if (!acc[floorKey]) acc[floorKey] = [];
                        acc[floorKey].push(room);
                        return acc;
                      }, {});

                      return Object.entries(roomsByFloor).map(([floorName, floorRooms]) => (
                        <div key={floorName} style={{ marginBottom: 20 }}>
                          <div style={{ fontSize: 11, fontWeight: 900, color: '#818cf8', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 9, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span>🏢</span> {floorName}
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                            {(floorRooms as any[]).map((room: any) => {
                              const isOccupied = room.status === 'OCCUPIED' || room.status === 'CHECKED_IN';
                              const statusColor = isOccupied ? '#fbbf24' : room.status === 'AVAILABLE' ? '#34d399' : '#94a3b8';
                              const statusBg = isOccupied ? 'rgba(251,191,36,0.08)' : room.status === 'AVAILABLE' ? 'rgba(52,211,153,0.05)' : 'rgba(255,255,255,0.02)';
                              const statusBorder = isOccupied ? 'rgba(251,191,36,0.3)' : room.status === 'AVAILABLE' ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.07)';
                              return (
                                <div
                                  key={room.id}
                                  onClick={() => { setSelectedRoomId(room.id); setSelectedRoomNumber(room.roomNumber); }}
                                  style={{
                                    background: statusBg,
                                    border: `1.5px solid ${statusBorder}`,
                                    borderRadius: 12,
                                    padding: '14px 8px',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s',
                                  }}
                                >
                                  <div style={{ fontSize: 16, fontWeight: 900, color: '#fff', marginBottom: 3 }}>{room.roomNumber}</div>
                                  <div style={{ fontSize: 8, fontWeight: 800, color: '#64748b', marginBottom: 4 }}>{room.roomType?.name || 'Room'}</div>
                                  <div style={{ fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em', color: statusColor }}>
                                    {isOccupied ? '● Occupied' : room.status === 'AVAILABLE' ? '● Vacant' : room.status?.replace('_', ' ') || 'Unknown'}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                )}
              </div>
            ) : (
              /* ── Step 2: Menu Catalog ── */
              <div>
                {/* Special Note */}
                <div style={{ marginBottom: 14, background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 12, padding: '12px' }}>
                  <div style={{ fontSize: 9, fontWeight: 800, color: '#818cf8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Special Instructions (Optional)</div>
                  <input
                    type="text"
                    placeholder="e.g. No spice, extra napkins..."
                    value={roomSpecialNote}
                    onChange={(e) => setRoomSpecialNote(e.target.value)}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 10px', color: '#fff', fontSize: 12, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                  />
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, cursor: 'pointer' }}>
                    <div
                      onClick={() => setPostToFolio(!postToFolio)}
                      style={{ width: 36, height: 20, borderRadius: 10, background: postToFolio ? '#6366f1' : 'rgba(255,255,255,0.1)', position: 'relative', flexShrink: 0, transition: 'background 0.2s', cursor: 'pointer' }}
                    >
                      <div style={{ position: 'absolute', top: 2, left: postToFolio ? 17 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: postToFolio ? '#818cf8' : '#64748b' }}>Post to Room Folio</span>
                  </label>
                </div>

                {/* Search & Filter */}
                <div style={{ marginBottom: 14 }}>
                  <input
                    type="text"
                    placeholder="Search menu items..."
                    value={roomOrderSearch}
                    onChange={(e) => setRoomOrderSearch(e.target.value)}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 12px', color: '#fff', fontSize: 12, fontFamily: 'inherit', outline: 'none', marginBottom: 8, boxSizing: 'border-box' }}
                  />
                  <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 6 }}>
                    {['all', ...Array.from(new Set(dbProducts.map((p: any) => p.category?.name).filter(Boolean)))].map((catName: any) => (
                      <button
                        key={catName}
                        onClick={() => setRoomOrderCategory(catName)}
                        style={{ background: roomOrderCategory === catName ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.02)', border: `1px solid ${roomOrderCategory === catName ? '#6366f1' : 'rgba(255,255,255,0.06)'}`, borderRadius: 8, padding: '6px 12px', color: roomOrderCategory === catName ? '#818cf8' : '#94a3b8', fontSize: 10, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit', textTransform: 'uppercase', letterSpacing: '0.04em' }}
                      >
                        {catName}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Products */}
                {productsLoading ? (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <div style={{ width: 24, height: 24, border: '2px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%', margin: '0 auto 10px', animation: 'spin 0.8s linear infinite' }} />
                    <div style={{ fontSize: 11, color: '#475569' }}>Loading menu...</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {dbProducts
                      .filter((p: any) => {
                        const matchesSearch = p.name.toLowerCase().includes(roomOrderSearch.toLowerCase())
                        const matchesCategory = roomOrderCategory === 'all' || p.category?.name === roomOrderCategory
                        return matchesSearch && matchesCategory
                      })
                      .map((p: any) => {
                        const cartItemsForProduct = Object.values(roomOrderCart).filter((item: any) => item.id === p.id);
                        const totalQty = cartItemsForProduct.reduce((sum: number, item: any) => sum + item.quantity, 0);
                        return (
                          <div key={p.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                                <span style={{ fontSize: 9, fontWeight: 900, color: p.isVeg ? '#34d399' : '#f43f5e', background: p.isVeg ? 'rgba(52,211,153,0.1)' : 'rgba(244,63,94,0.1)', padding: '2px 5px', borderRadius: 4, textTransform: 'uppercase' }}>{p.isVeg ? '🟢 Veg' : '🔴 Non-Veg'}</span>
                                <span style={{ fontSize: 9, color: '#64748b', fontWeight: 700 }}>{p.category?.name}</span>
                              </div>
                              <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{p.name}</div>
                              <div style={{ fontSize: 11, fontWeight: 700, color: '#818cf8', marginTop: 2 }}>
                                {p.variants && p.variants.length > 0 ? `From ₹${Math.min(...p.variants.map((v: any) => v.price))}` : `₹${p.sellingPrice}`}
                              </div>
                            </div>
                            <div>
                              {p.variants && p.variants.length > 0 ? (
                                <button
                                  onClick={() => setRoomOrderProductForVariant(p)}
                                  style={{ background: totalQty > 0 ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.03)', border: `1.5px solid ${totalQty > 0 ? '#6366f1' : 'rgba(255,255,255,0.08)'}`, borderRadius: 8, padding: '6px 12px', color: totalQty > 0 ? '#818cf8' : '#94a3b8', fontSize: 10, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}
                                >
                                  {totalQty > 0 ? `Selected: ${totalQty}` : 'Choose Variant'}
                                </button>
                              ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  {totalQty > 0 ? (
                                    <>
                                      <button onClick={() => setRoomOrderCart(prev => { const updated = { ...prev }; if (updated[p.id].quantity > 1) { updated[p.id].quantity -= 1; } else { delete updated[p.id]; } return updated; })} style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900 }}>-</button>
                                      <span style={{ fontSize: 13, fontWeight: 800, minWidth: 16, textAlign: 'center' }}>{totalQty}</span>
                                      <button onClick={() => setRoomOrderCart(prev => ({ ...prev, [p.id]: { id: p.id, name: p.name, unitPrice: p.sellingPrice, quantity: (prev[p.id]?.quantity || 0) + 1 } }))} style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(99,102,241,0.18)', border: 'none', color: '#818cf8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900 }}>+</button>
                                    </>
                                  ) : (
                                    <button onClick={() => setRoomOrderCart(prev => ({ ...prev, [p.id]: { id: p.id, name: p.name, unitPrice: p.sellingPrice, quantity: 1 } }))} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 14px', fontSize: 11, fontWeight: 800, color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>Add</button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sticky Bottom Cart Summary */}
          {selectedRoomNumber && Object.keys(roomOrderCart).length > 0 && (
            <div style={{ background: '#0e1524', borderTop: '1px solid rgba(255,255,255,0.07)', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div>
                <div style={{ fontSize: 10, color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Room {selectedRoomNumber}</div>
                <div style={{ fontSize: 15, fontWeight: 900 }}>
                  {Object.values(roomOrderCart).reduce((sum: number, item: any) => sum + item.quantity, 0)} Items • ₹{Object.values(roomOrderCart).reduce((sum: number, item: any) => sum + item.unitPrice * item.quantity, 0)}
                </div>
              </div>
              <button
                onClick={handlePlaceRoomOrder}
                disabled={placingRoomOrder}
                style={{ background: 'linear-gradient(135deg, #6366f1, #818cf8)', border: 'none', borderRadius: 10, padding: '10px 18px', color: '#fff', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', cursor: placingRoomOrder ? 'not-allowed' : 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 12px rgba(99,102,241,0.4)', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                {placingRoomOrder ? (
                  <><div style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />Sending...</>
                ) : '🛎️ Place Order'}
              </button>
            </div>
          )}

          {/* Variant Selector for Room Order */}
          {roomOrderProductForVariant && (
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', background: '#0b0f19', borderTop: '1px solid rgba(255,255,255,0.08)', borderTopLeftRadius: 20, borderTopRightRadius: 20, zIndex: 1020, display: 'flex', flexDirection: 'column', boxShadow: '0 -8px 32px rgba(0,0,0,0.6)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 900, color: '#fff' }}>Choose Variant</span>
                  <span style={{ fontSize: 10, color: '#64748b', fontWeight: 700, marginLeft: 8 }}>{roomOrderProductForVariant.name}</span>
                </div>
                <button onClick={() => setRoomOrderProductForVariant(null)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', width: 24, height: 24, color: '#94a3b8', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {roomOrderProductForVariant.variants.map((v: any) => {
                  const key = `${roomOrderProductForVariant.id}-${v.id}`;
                  const qty = roomOrderCart[key]?.quantity || 0;
                  return (
                    <div key={v.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>{v.name}</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#818cf8', marginTop: 1 }}>₹{v.price}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {qty > 0 ? (
                          <>
                            <button onClick={() => setRoomOrderCart(prev => { const updated = { ...prev }; if (updated[key].quantity > 1) { updated[key].quantity -= 1; } else { delete updated[key]; } return updated; })} style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900 }}>-</button>
                            <span style={{ fontSize: 12, fontWeight: 800, minWidth: 16, textAlign: 'center' }}>{qty}</span>
                            <button onClick={() => setRoomOrderCart(prev => ({ ...prev, [key]: { id: roomOrderProductForVariant.id, name: `${roomOrderProductForVariant.name} (${v.name})`, unitPrice: v.price, quantity: (prev[key]?.quantity || 0) + 1, variantId: v.id, variantName: v.name } }))} style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(99,102,241,0.15)', border: 'none', color: '#818cf8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900 }}>+</button>
                          </>
                        ) : (
                          <button onClick={() => setRoomOrderCart(prev => ({ ...prev, [key]: { id: roomOrderProductForVariant.id, name: `${roomOrderProductForVariant.name} (${v.name})`, unitPrice: v.price, quantity: 1, variantId: v.id, variantName: v.name } }))} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 14px', fontSize: 10, fontWeight: 800, color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>Add</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════ TAKE ORDER OVERLAY MODAL ══════════ */}
      {showOrderModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: '#090d16', zIndex: 1000, display: 'flex', flexDirection: 'column', color: '#fff', fontFamily: 'inherit' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {orderTableId && (
                <button onClick={() => setOrderTableId('')} style={{ background: 'transparent', border: 'none', color: '#818cf8', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', padding: 0 }}>
                  ➔
                </button>
              )}
              <span style={{ fontSize: 14, fontWeight: 800, letterSpacing: '0.05em' }}>
                {!orderTableId ? 'Select Dining Table' : `Menu: ${dbTables.find(t => t.id === orderTableId)?.name || 'Order'}`}
              </span>
            </div>
            <button onClick={() => setShowOrderModal(false)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', width: 28, height: 28, color: '#94a3b8', fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          </div>

          {/* Modal Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
            {!orderTableId ? (
              /* --- Step 1: Table Selector --- */
              <div>
                {tablesLoading ? (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <div style={{ width: 24, height: 24, border: '2px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%', margin: '0 auto 10px', animation: 'spin 0.8s linear infinite' }} />
                    <div style={{ fontSize: 11, color: '#475569' }}>Loading dining tables...</div>
                  </div>
                ) : dbTables.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 16px', color: '#94a3b8' }}>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>📋</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 4 }}>No Tables Assigned</div>
                    <div style={{ fontSize: 11, color: '#475569', lineHeight: 1.5 }}>You don't have any tables assigned. Please ask your manager to assign tables in the POS Staff dashboard.</div>
                  </div>
                ) : (
                  (() => {
                    const tablesByFloor = dbTables.reduce((acc: { [floorName: string]: any[] }, table: any) => {
                      const floorName = table.floor?.name || 'General Area';
                      if (!acc[floorName]) acc[floorName] = [];
                      acc[floorName].push(table);
                      return acc;
                    }, {});

                    return Object.entries(tablesByFloor).map(([floorName, floorTables]) => (
                      <div key={floorName} style={{ marginBottom: 20 }}>
                        <div style={{ fontSize: 11, fontWeight: 900, color: '#818cf8', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 9, paddingLeft: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>📍</span> {floorName}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                          {floorTables.map(t => {
                            const isOccupied = t.activeOrder !== null && !['COMPLETED', 'PAID', 'SETTLED', 'CANCELLED'].includes(t.activeOrder.status);
                            return (
                              <div
                                key={t.id}
                                onClick={() => setOrderTableId(t.id)}
                                style={{
                                  background: isOccupied ? 'rgba(251,191,36,0.05)' : 'rgba(255,255,255,0.02)',
                                  border: `1.5px solid ${isOccupied ? 'rgba(251,191,36,0.3)' : 'rgba(255,255,255,0.08)'}`,
                                  borderRadius: 12,
                                  padding: '16px 10px',
                                  textAlign: 'center',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s',
                                }}
                              >
                                <div style={{ fontSize: 15, fontWeight: 900, color: '#fff', marginBottom: 4 }}>{t.name}</div>
                                <div style={{ fontSize: 8, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: isOccupied ? '#fbbf24' : '#34d399' }}>
                                  {isOccupied ? `Occupied (₹${Math.round(t.activeOrder.amount)})` : 'Vacant'}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ));
                  })()
                )}
              </div>
            ) : (
              /* --- Step 2: Searchable Menu Catalog --- */
              <div>
                {/* Search & Filter */}
                <div style={{ marginBottom: 14 }}>
                  <input
                    type="text"
                    placeholder="Search menu items..."
                    value={orderSearchQuery}
                    onChange={(e) => setOrderSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 10,
                      padding: '10px 12px',
                      color: '#fff',
                      fontSize: 12,
                      fontFamily: 'inherit',
                      outline: 'none',
                      marginBottom: 8
                    }}
                  />
                  
                  {/* Category Pills (horizontal scrollable) */}
                  <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 6 }}>
                    {['all', ...Array.from(new Set(dbProducts.map(p => p.category?.name).filter(Boolean)))].map(catName => (
                      <button
                        key={catName}
                        onClick={() => setOrderCategory(catName)}
                        style={{
                          background: orderCategory === catName ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.02)',
                          border: `1px solid ${orderCategory === catName ? '#6366f1' : 'rgba(255,255,255,0.06)'}`,
                          borderRadius: 8,
                          padding: '6px 12px',
                          color: orderCategory === catName ? '#818cf8' : '#94a3b8',
                          fontSize: 10,
                          fontWeight: 700,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          fontFamily: 'inherit',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em'
                        }}
                      >
                        {catName}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Products List */}
                {productsLoading ? (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <div style={{ width: 24, height: 24, border: '2px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%', margin: '0 auto 10px', animation: 'spin 0.8s linear infinite' }} />
                    <div style={{ fontSize: 11, color: '#475569' }}>Loading menu items...</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {dbProducts
                      .filter(p => {
                        const matchesSearch = p.name.toLowerCase().includes(orderSearchQuery.toLowerCase())
                        const matchesCategory = orderCategory === 'all' || p.category?.name === orderCategory
                        return matchesSearch && matchesCategory
                      })
                      .map(p => {
                        // Find quantity for standard items or sum of variants in the cart
                        const cartItemsForProduct = Object.values(orderCart).filter(item => item.id === p.id);
                        const totalQty = cartItemsForProduct.reduce((sum, item) => sum + item.quantity, 0);

                        return (
                          <div
                            key={p.id}
                            style={{
                              background: 'rgba(255,255,255,0.02)',
                              border: '1px solid rgba(255,255,255,0.06)',
                              borderRadius: 12,
                              padding: '12px 14px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                                <span style={{ fontSize: 9, fontWeight: 900, color: p.isVeg ? '#34d399' : '#f43f5e', background: p.isVeg ? 'rgba(52,211,153,0.1)' : 'rgba(244,63,94,0.1)', padding: '2px 5px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                  {p.isVeg ? '🟢 Veg' : '🔴 Non-Veg'}
                                </span>
                                <span style={{ fontSize: 9, color: '#64748b', fontWeight: 700 }}>{p.category?.name}</span>
                              </div>
                              <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{p.name}</div>
                              <div style={{ fontSize: 11, fontWeight: 700, color: '#818cf8', marginTop: 2 }}>
                                {p.variants && p.variants.length > 0
                                  ? `From ₹${Math.min(...p.variants.map((v: any) => v.price))}`
                                  : `₹${p.sellingPrice}`}
                              </div>
                            </div>

                            {/* Stepper Logic */}
                            <div>
                              {p.variants && p.variants.length > 0 ? (
                                <button
                                  onClick={() => setSelectedProductForVariant(p)}
                                  style={{
                                    background: totalQty > 0 ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.03)',
                                    border: `1.5px solid ${totalQty > 0 ? '#6366f1' : 'rgba(255,255,255,0.08)'}`,
                                    borderRadius: 8,
                                    padding: '6px 12px',
                                    color: totalQty > 0 ? '#818cf8' : '#94a3b8',
                                    fontSize: 10,
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    fontFamily: 'inherit',
                                  }}
                                >
                                  {totalQty > 0 ? `Selected: ${totalQty}` : 'Choose Variant'}
                                </button>
                              ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  {totalQty > 0 ? (
                                    <>
                                      <button
                                        onClick={() => {
                                          setOrderCart(prev => {
                                            const updated = { ...prev }
                                            if (updated[p.id].quantity > 1) {
                                              updated[p.id].quantity -= 1
                                            } else {
                                              delete updated[p.id]
                                            }
                                            return updated
                                          })
                                        }}
                                        style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900 }}
                                      >
                                        -
                                      </button>
                                      <span style={{ fontSize: 13, fontWeight: 800, minWidth: 16, textAlign: 'center' }}>{totalQty}</span>
                                      <button
                                        onClick={() => {
                                          setOrderCart(prev => ({
                                            ...prev,
                                            [p.id]: { id: p.id, name: p.name, unitPrice: p.sellingPrice, quantity: (prev[p.id]?.quantity || 0) + 1 }
                                          }))
                                        }}
                                        style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(99,102,241,0.18)', border: 'none', color: '#818cf8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900 }}
                                      >
                                        +
                                      </button>
                                    </>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        setOrderCart(prev => ({
                                          ...prev,
                                          [p.id]: { id: p.id, name: p.name, unitPrice: p.sellingPrice, quantity: 1 }
                                        }))
                                      }}
                                      style={{
                                        background: 'rgba(255,255,255,0.03)',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        borderRadius: 8,
                                        padding: '6px 14px',
                                        fontSize: 11,
                                        fontWeight: 800,
                                        color: '#fff',
                                        cursor: 'pointer',
                                        fontFamily: 'inherit'
                                      }}
                                    >
                                      Add
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sticky Bottom Cart Summary */}
          {orderTableId && Object.keys(orderCart).length > 0 && (
            <div style={{ background: '#0e1524', borderTop: '1px solid rgba(255,255,255,0.07)', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div>
                <div style={{ fontSize: 10, color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Items in Cart</div>
                <div style={{ fontSize: 15, fontWeight: 900 }}>
                  {Object.values(orderCart).reduce((sum, item) => sum + item.quantity, 0)} Items • ₹{Object.values(orderCart).reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)}
                </div>
              </div>
              <button
                onClick={() => {
                  const check = document.getElementById('checkoutDrawer')
                  if (check) check.style.transform = 'translateY(0%)'
                }}
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  border: 'none',
                  borderRadius: 10,
                  padding: '10px 18px',
                  color: '#fff',
                  fontSize: 11,
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
                  fontFamily: 'inherit'
                }}
              >
                Review Cart ➔
              </button>
            </div>
          )}

          {/* ══════════ CHECKOUT DRAWER (OVERLAY) ══════════ */}
          <div
            id="checkoutDrawer"
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '75%',
              background: '#0a0e17',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              zIndex: 1010,
              transform: 'translateY(100%)',
              transition: 'transform 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 -8px 32px rgba(0,0,0,0.6)'
            }}
          >
            {/* Drawer Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div>
                <span style={{ fontSize: 13, fontWeight: 900, letterSpacing: '0.05em', color: '#fff' }}>Review Order</span>
                <span style={{ fontSize: 10, color: '#64748b', fontWeight: 700, marginLeft: 8 }}>Table: {dbTables.find(t => t.id === orderTableId)?.name}</span>
              </div>
              <button
                onClick={() => {
                  const check = document.getElementById('checkoutDrawer')
                  if (check) check.style.transform = 'translateY(100%)'
                }}
                style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', width: 24, height: 24, color: '#94a3b8', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                ✕
              </button>
            </div>

            {/* Cart Items List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {Object.entries(orderCart).map(([key, item]) => (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>{item.name}</div>
                      <div style={{ fontSize: 10, color: '#818cf8', fontWeight: 700, marginTop: 1 }}>₹{item.unitPrice} each</div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <button
                        onClick={() => {
                          setOrderCart(prev => {
                            const updated = { ...prev }
                            if (updated[key].quantity > 1) {
                              updated[key].quantity -= 1
                            } else {
                              delete updated[key]
                            }
                            return updated
                          })
                        }}
                        style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900 }}
                      >
                        -
                      </button>
                      <span style={{ fontSize: 12, fontWeight: 800, minWidth: 16, textAlign: 'center' }}>{item.quantity}</span>
                      <button
                        onClick={() => {
                          setOrderCart(prev => ({
                            ...prev,
                            [key]: { ...prev[key], quantity: prev[key].quantity + 1 }
                          }))
                        }}
                        style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(99,102,241,0.15)', border: 'none', color: '#818cf8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900 }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hotel Room Linking Section */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '12px', marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>🏨</span> Link In-House Guest Room (Optional)
              </div>
              <input
                type="text"
                placeholder="Room No. (e.g. 101)"
                value={orderRoomNumber}
                onChange={(e) => setOrderRoomNumber(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  padding: '8px 10px',
                  color: '#fff',
                  fontSize: 12,
                  fontFamily: 'inherit',
                  outline: 'none',
                }}
              />
            </div>

            {/* Calculations & Submit */}
            <div style={{ background: '#070a10', borderTop: '1px solid rgba(255,255,255,0.07)', padding: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', fontWeight: 700 }}>
                  <span>Subtotal</span>
                  <span>₹{Object.values(orderCart).reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', fontWeight: 700 }}>
                  <span>Taxes (approx 5% GST)</span>
                  <span>₹{Math.round(Object.values(orderCart).reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0) * 0.05)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 900, color: '#fff', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 6 }}>
                  <span>Grand Total</span>
                  <span>₹{Math.round(Object.values(orderCart).reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0) * 1.05)}</span>
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={placingOrder}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  border: 'none',
                  borderRadius: 12,
                  padding: '13px',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  cursor: placingOrder ? 'not-allowed' : 'pointer',
                  opacity: placingOrder ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  fontFamily: 'inherit',
                  boxShadow: '0 4px 16px rgba(16,185,129,0.3)'
                }}
              >
                {placingOrder ? (
                  <>
                    <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    Sending to Kitchen...
                  </>
                ) : (
                  '🔥 Send to Kitchen & Generate KOT'
                )}
              </button>
            </div>
          </div>

          {/* ══════════ VARIANT SELECTOR DRAWER (OVERLAY) ══════════ */}
          {selectedProductForVariant && (
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '50%',
                background: '#0b0f19',
                borderTop: '1px solid rgba(255,255,255,0.08)',
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                zIndex: 1020,
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 -8px 32px rgba(0,0,0,0.6)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 900, color: '#fff' }}>Choose Variant</span>
                  <span style={{ fontSize: 10, color: '#64748b', fontWeight: 700, marginLeft: 8 }}>{selectedProductForVariant.name}</span>
                </div>
                <button
                  onClick={() => setSelectedProductForVariant(null)}
                  style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', width: 24, height: 24, color: '#94a3b8', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  ✕
                </button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {selectedProductForVariant.variants.map((v: any) => {
                  const key = `${selectedProductForVariant.id}-${v.id}`;
                  const qty = orderCart[key]?.quantity || 0;

                  return (
                    <div
                      key={v.id}
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: 10,
                        padding: '12px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>{v.name}</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#818cf8', marginTop: 1 }}>₹{v.price}</div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {qty > 0 ? (
                          <>
                            <button
                              onClick={() => {
                                setOrderCart(prev => {
                                  const updated = { ...prev }
                                  if (updated[key].quantity > 1) {
                                    updated[key].quantity -= 1
                                  } else {
                                    delete updated[key]
                                  }
                                  return updated
                                })
                              }}
                              style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900 }}
                            >
                              -
                            </button>
                            <span style={{ fontSize: 12, fontWeight: 800, minWidth: 16, textAlign: 'center' }}>{qty}</span>
                            <button
                              onClick={() => {
                                setOrderCart(prev => ({
                                  ...prev,
                                  [key]: { id: selectedProductForVariant.id, name: `${selectedProductForVariant.name} (${v.name})`, unitPrice: v.price, quantity: (prev[key]?.quantity || 0) + 1, variantId: v.id, variantName: v.name }
                                }))
                              }}
                              style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(99,102,241,0.15)', border: 'none', color: '#818cf8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900 }}
                            >
                              +
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => {
                              setOrderCart(prev => ({
                                ...prev,
                                [key]: { id: selectedProductForVariant.id, name: `${selectedProductForVariant.name} (${v.name})`, unitPrice: v.price, quantity: 1, variantId: v.id, variantName: v.name }
                              }))
                            }}
                            style={{
                              background: 'rgba(255,255,255,0.03)',
                              border: '1px solid rgba(255,255,255,0.08)',
                              borderRadius: 8,
                              padding: '6px 14px',
                              fontSize: 10,
                              fontWeight: 800,
                              color: '#fff',
                              cursor: 'pointer',
                              fontFamily: 'inherit'
                            }}
                          >
                            Add
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {playingInfo && (
        <AutoPlayNotification
          speakerName={playingInfo.speakerName}
          channelId={playingInfo.channelId}
          onGoToMessages={() => handleTabChange('messages')}
        />
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes ping { 75%,100% { transform: scale(1.6); opacity: 0; } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.55; } }
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        html,body { height: 100%; margin: 0; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.07); border-radius: 2px; }
        input::placeholder { color: rgba(148,163,184,0.32); }
      `}</style>
    </div>
  )
}
