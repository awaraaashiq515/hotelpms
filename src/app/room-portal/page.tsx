'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Hotel,
  Hash,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Wifi,
  UtensilsCrossed,
  PhoneCall,
  Bed,
  Tv,
} from 'lucide-react';
import { toast, Toaster } from 'sonner';

export default function RoomPortalLogin() {
  const router = useRouter();
  const [roomNumber, setRoomNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeRooms, setActiveRooms] = useState<string[]>([]);
  const [time, setTime] = useState(new Date());

  // Hotel state
  const [propertyId, setPropertyId] = useState('');
  const [propertyCode, setPropertyCode] = useState('');
  const [propertyName, setPropertyName] = useState('');

  const roomInputRef = useRef<HTMLInputElement>(null);

  const fetchActiveRooms = async (pId?: string, pCode?: string) => {
    try {
      const params = new URLSearchParams();
      if (pId) params.set('propertyId', pId);
      if (pCode) params.set('propertyCode', pCode);
      const res = await fetch(`/api/room-portal/rooms?${params.toString()}`);
      const d = await res.json();
      if (d.success) {
        if (Array.isArray(d.activeRooms)) {
          setActiveRooms(d.activeRooms);
        }
        if (d.property && (!propertyName || propertyName === 'Hotel Room Portal')) {
          setPropertyName(d.property.brandName || d.property.name || 'Hotel Room Portal');
          if (d.property.id && !pId) setPropertyId(d.property.id);
          if (d.property.code && !pCode) setPropertyCode(d.property.code);
        }
      }
    } catch {}
  };

  // Live clock & auto-detect property
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);

    const initProperty = async () => {
      if (typeof window === 'undefined') return;

      const params = new URLSearchParams(window.location.search);
      const urlProp = params.get('property') || params.get('propertyCode') || '';
      const urlPropId = params.get('propertyId') || '';
      const urlRoom = params.get('room') || params.get('roomNumber') || '';

      if (urlRoom) {
        setRoomNumber(urlRoom);
        // Direct auto-open if room provided in query param!
        setTimeout(() => handleOpenPortal(urlRoom), 200);
      }

      // Check staff session
      try {
        const res = await fetch('/api/auth/session');
        const sessionData = await res.json();
        if (sessionData.authenticated && (sessionData.user?.propertyId || sessionData.user?.propertyCode)) {
          const staffPropId = sessionData.user.propertyId || '';
          const staffPropCode = sessionData.user.propertyCode || '';
          const staffPropName = sessionData.user.propertyName || sessionData.user.propertySlug || staffPropCode || 'Hotel';

          setPropertyId(staffPropId);
          setPropertyCode(staffPropCode);
          setPropertyName(staffPropName);

          fetchActiveRooms(staffPropId, staffPropCode);
          return;
        }
      } catch {}

      // Check localStorage
      const pId = localStorage.getItem('room_portal_property_id') || urlPropId;
      const pCode = localStorage.getItem('room_portal_property') || urlProp;
      const pName = localStorage.getItem('room_portal_property_name') || '';

      if (pId || pCode) {
        setPropertyId(pId);
        setPropertyCode(pCode);
        setPropertyName(pName || pCode);
        fetchActiveRooms(pId, pCode);
        return;
      }

      // Auto-load default
      fetchActiveRooms();
    };

    initProperty();

    return () => clearInterval(interval);
  }, []);

  // Redirect if already logged in as guest
  useEffect(() => {
    const token = localStorage.getItem('room_portal_token');
    if (token) {
      fetch('/api/room-portal/me', { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((d) => {
          if (d.success) router.replace('/room-portal/dashboard');
        })
        .catch(() => {});
    }
  }, [router]);

  // 1-Click Open Portal
  const handleOpenPortal = async (customRoom?: string) => {
    const targetRoom = (customRoom || roomNumber).trim();
    if (!targetRoom) {
      setError('Please enter your room number.');
      roomInputRef.current?.focus();
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/room-portal/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomNumber: targetRoom,
          propertyId: propertyId || undefined,
          propertyCode: propertyCode || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        localStorage.setItem('room_portal_token', data.token);
        if (data.guest?.mobile) {
          localStorage.setItem('room_portal_guest_mobile', data.guest.mobile);
        }
        if (data.property?.id) localStorage.setItem('room_portal_property_id', data.property.id);
        if (data.property?.code) localStorage.setItem('room_portal_property', data.property.code);
        if (data.property?.name) {
          localStorage.setItem('room_portal_property_name', data.property.name);
          setPropertyName(data.property.name);
        }

        const guestName = data.guest?.firstName || 'Guest';
        toast.success(`Welcome to Room ${targetRoom}, ${guestName}! ✨`);
        setTimeout(() => router.push('/room-portal/dashboard'), 400);
      } else {
        setError(data.message || 'Could not open room portal. Please check the room number.');
        toast.error(data.message || 'Login failed.');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const timeStr = time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  const dateStr = time.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <>
      <Toaster richColors position="top-center" />
      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #030712 0%, #0a0f1e 50%, #030712 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px 20px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Ambient background glow */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <div
            style={{
              position: 'absolute',
              top: '-15%',
              left: '15%',
              width: '650px',
              height: '650px',
              background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
              borderRadius: '50%',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '-10%',
              right: '15%',
              width: '550px',
              height: '550px',
              background: 'radial-gradient(circle, rgba(249,115,22,0.10) 0%, transparent 70%)',
              borderRadius: '50%',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage:
                'linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }}
          />
        </div>

        {/* Live Clock & Date */}
        <div style={{ textAlign: 'center', marginBottom: '26px', position: 'relative', zIndex: 1 }}>
          <div
            style={{
              fontSize: '56px',
              fontWeight: 900,
              color: 'white',
              letterSpacing: '-2px',
              lineHeight: 1,
              marginBottom: '6px',
              textShadow: '0 0 50px rgba(99,102,241,0.3)',
            }}
          >
            {timeStr}
          </div>
          <div style={{ fontSize: '14px', color: 'rgb(148,163,184)', fontWeight: 500 }}>
            {dateStr}
          </div>
        </div>

        {/* Central Card */}
        <div
          style={{
            width: '100%',
            maxWidth: '460px',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Hotel brand */}
          <div style={{ textAlign: 'center', marginBottom: '22px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '64px',
                height: '64px',
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                boxShadow: '0 16px 50px rgba(99,102,241,0.35)',
                marginBottom: '12px',
              }}
            >
              <Hotel size={32} color="white" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '4px' }}>
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background: 'rgba(34,197,94,0.15)',
                  border: '1px solid rgba(34,197,94,0.3)',
                  color: 'rgb(134,239,172)',
                  fontSize: '11px',
                  fontWeight: 800,
                }}
              >
                ● IN-ROOM TABLET
              </span>
              <h1 style={{ color: 'white', fontSize: '22px', fontWeight: 900, margin: 0 }}>
                {propertyName || 'Hotel Room Portal'}
              </h1>
            </div>
            <p style={{ color: 'rgb(148,163,184)', fontSize: '13px', margin: 0 }}>
              Enter your room number to open your in-room tablet &amp; services
            </p>
          </div>

          {/* Main Card */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.92)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(99,102,241,0.25)',
              borderRadius: '26px',
              padding: '32px 28px',
              boxShadow: '0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05) inset',
            }}
          >
            <div style={{ marginBottom: '22px' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  color: 'rgb(148,163,184)',
                  fontSize: '11px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                  marginBottom: '12px',
                }}
              >
                <span>
                  <Hash size={13} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                  Enter Room Number
                </span>
                <span style={{ color: 'rgb(99,102,241)', fontWeight: 700, fontSize: '11px' }}>
                  Press Enter to Open
                </span>
              </label>

              <input
                ref={roomInputRef}
                id="room-number-input"
                type="text"
                inputMode="numeric"
                value={roomNumber}
                onChange={(e) => {
                  setRoomNumber(e.target.value);
                  setError('');
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleOpenPortal()}
                placeholder="e.g. 101, 102, 103"
                autoFocus
                style={{
                  width: '100%',
                  padding: '18px 20px',
                  borderRadius: '18px',
                  border: error ? '2px solid rgba(239,68,68,0.6)' : '2px solid rgba(99,102,241,0.4)',
                  background: 'rgba(15,23,42,0.7)',
                  color: 'white',
                  fontSize: '32px',
                  fontWeight: 900,
                  textAlign: 'center',
                  letterSpacing: '4px',
                  outline: 'none',
                  transition: 'all 0.2s',
                  boxSizing: 'border-box',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
                }}
              />

              {/* H13: Never display a public list of occupied rooms on tablet login */}
            </div>

            {error && <ErrorMessage message={error} />}

            {/* Instant Open Button */}
            <button
              id="open-portal-btn"
              onClick={() => handleOpenPortal()}
              disabled={loading}
              style={{
                width: '100%',
                padding: '18px',
                borderRadius: '16px',
                border: 'none',
                background: loading
                  ? 'rgba(99,102,241,0.5)'
                  : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                color: 'white',
                fontSize: '16px',
                fontWeight: 900,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: '0 8px 32px rgba(99,102,241,0.4)',
                transition: 'transform 0.1s, box-shadow 0.2s',
              }}
              onMouseDown={(e) => !loading && (e.currentTarget.style.transform = 'scale(0.98)')}
              onMouseUp={(e) => !loading && (e.currentTarget.style.transform = 'scale(1)')}
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" /> Opening Room Portal...
                </>
              ) : (
                <>
                  Open In-Room Portal <ArrowRight size={20} />
                </>
              )}
            </button>

            {/* Feature preview badges */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '6px',
                marginTop: '22px',
                paddingTop: '18px',
                borderTop: '1px solid rgba(255,255,255,0.08)',
                textAlign: 'center',
              }}
            >
              <div style={{ color: 'rgb(148,163,184)', fontSize: '10px', fontWeight: 700 }}>
                <span style={{ display: 'block', fontSize: '16px', marginBottom: '4px' }}>🍽️</span>
                Room Service
              </div>
              <div style={{ color: 'rgb(148,163,184)', fontSize: '10px', fontWeight: 700 }}>
                <span style={{ display: 'block', fontSize: '16px', marginBottom: '4px' }}>📶</span>
                High-Speed Wi-Fi
              </div>
              <div style={{ color: 'rgb(148,163,184)', fontSize: '10px', fontWeight: 700 }}>
                <span style={{ display: 'block', fontSize: '16px', marginBottom: '4px' }}>🧹</span>
                Housekeeping
              </div>
              <div style={{ color: 'rgb(148,163,184)', fontSize: '10px', fontWeight: 700 }}>
                <span style={{ display: 'block', fontSize: '16px', marginBottom: '4px' }}>🛎️</span>
                Front Desk
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p
          style={{
            position: 'absolute',
            bottom: '18px',
            left: '50%',
            transform: 'translateX(-50%)',
            color: 'rgb(71,85,105)',
            fontSize: '11px',
            fontWeight: 600,
            whiteSpace: 'nowrap',
          }}
        >
          Powered by <span style={{ color: 'rgb(99,102,241)' }}>GuestFlow HMS</span>
        </p>
      </div>
    </>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'rgba(239,68,68,0.1)',
        border: '1px solid rgba(239,68,68,0.3)',
        borderRadius: '12px',
        padding: '12px 16px',
        marginBottom: '16px',
      }}
    >
      <AlertCircle size={16} color="rgb(239,68,68)" />
      <span style={{ color: 'rgb(252,165,165)', fontSize: '13px', fontWeight: 600 }}>{message}</span>
    </div>
  );
}
