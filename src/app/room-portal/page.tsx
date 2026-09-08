'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Hotel, Smartphone, Hash, ArrowRight, Loader2, AlertCircle, CheckCircle2, ChevronRight, ShieldCheck, Unlink } from 'lucide-react';
import { toast, Toaster } from 'sonner';

type Step = 'room' | 'mobile';

export default function RoomPortalLogin() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('room');
  const [roomNumber, setRoomNumber] = useState('');
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [time, setTime] = useState(new Date());

  // Hotel Device Pairing State
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const [propertyId, setPropertyId] = useState('');
  const [propertyCode, setPropertyCode] = useState('');
  const [propertyName, setPropertyName] = useState('');

  // Live clock & property detection from URL / localStorage / staff session
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);

    const initProperty = async () => {
      if (typeof window === 'undefined') return;

      // 1. Check URL query params first (e.g. ?property=RCH001 or ?propertyId=...)
      const params = new URLSearchParams(window.location.search);
      const urlProp = params.get('property') || params.get('propertyCode') || '';
      const urlPropId = params.get('propertyId') || '';

      if (urlPropId) {
        setPropertyId(urlPropId);
        localStorage.setItem('room_portal_property_id', urlPropId);
      }
      if (urlProp) {
        setPropertyCode(urlProp);
        localStorage.setItem('room_portal_property', urlProp);
      }

      // 2. Check localStorage for already configured/paired property
      let pId = localStorage.getItem('room_portal_property_id') || urlPropId;
      let pCode = localStorage.getItem('room_portal_property') || urlProp;
      let pName = localStorage.getItem('room_portal_property_name') || '';

      if (pId || pCode) {
        setPropertyId(pId);
        setPropertyCode(pCode);
        setPropertyName(pName || pCode);
        setIsConfigured(true);
        return;
      }

      // 3. Tablet NOT yet paired! Check if hotel staff is currently logged in on this browser
      try {
        const res = await fetch('/api/auth/session');
        const sessionData = await res.json();
        if (sessionData.authenticated && (sessionData.user?.propertyId || sessionData.user?.propertyCode)) {
          // Staff is logged in! Auto-bind this tablet to their hotel!
          const staffPropId = sessionData.user.propertyId || '';
          const staffPropCode = sessionData.user.propertyCode || '';
          const staffPropName = sessionData.user.propertyName || sessionData.user.propertySlug || staffPropCode || 'Hotel';

          setPropertyId(staffPropId);
          setPropertyCode(staffPropCode);
          setPropertyName(staffPropName);

          if (staffPropId) localStorage.setItem('room_portal_property_id', staffPropId);
          if (staffPropCode) localStorage.setItem('room_portal_property', staffPropCode);
          localStorage.setItem('room_portal_property_name', staffPropName);

          setIsConfigured(true);
          toast.success(`Tablet activated for ${staffPropName} 🏨`);
          return;
        }
      } catch {}

      // 4. Tablet is NOT paired and no hotel staff logged in
      setIsConfigured(false);
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
        .then((d) => { if (d.success) router.replace('/room-portal/dashboard'); })
        .catch(() => {});
    }
  }, [router]);

  const handleRoomNext = () => {
    if (!roomNumber.trim()) {
      setError('Please enter your room number.');
      return;
    }
    setError('');
    setStep('mobile');
  };

  const handleLogin = async () => {
    if (!mobile.trim()) {
      setError('Please enter your mobile number.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/room-portal/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomNumber: roomNumber.trim(),
          mobile: mobile.trim(),
          propertyId: propertyId || undefined,
          propertyCode: propertyCode || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('room_portal_token', data.token);
        if (data.property?.id) localStorage.setItem('room_portal_property_id', data.property.id);
        if (data.property?.code) localStorage.setItem('room_portal_property', data.property.code);
        if (data.property?.name) localStorage.setItem('room_portal_property_name', data.property.name);
        toast.success(`Welcome, ${data.guest.firstName}! ✨`);
        setTimeout(() => router.push('/room-portal/dashboard'), 800);
      } else {
        setError(data.message || 'Login failed. Please check your details.');
        toast.error(data.message || 'Login failed.');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUnpairTablet = () => {
    if (confirm(`Disconnect this tablet from ${propertyName || 'this hotel'}?\n\nYou will need to log in with hotel staff credentials to reconnect it.`)) {
      localStorage.removeItem('room_portal_property_id');
      localStorage.removeItem('room_portal_property');
      localStorage.removeItem('room_portal_property_name');
      localStorage.removeItem('room_portal_token');
      setPropertyId('');
      setPropertyCode('');
      setPropertyName('');
      setIsConfigured(false);
      toast.info('Tablet disconnected.');
    }
  };

  const timeStr = time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  const dateStr = time.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  // ── 1. Loading state while verifying configuration ──
  if (isConfigured === null) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #030712 0%, #0a0f1e 50%, #030712 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px',
      }}>
        <Loader2 size={40} color="rgb(99,102,241)" className="animate-spin" />
        <p style={{ color: 'rgb(148,163,184)', fontSize: '14px', fontWeight: 600 }}>Checking tablet setup...</p>
      </div>
    );
  }

  // ── 2. Unconfigured state: Prompt hotel staff login ──
  if (isConfigured === false) {
    return (
      <>
        <Toaster richColors position="top-center" />
        <div style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #030712 0%, #0a0f1e 50%, #030712 100%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '32px 24px', position: 'relative', overflow: 'hidden',
        }}>
          {/* Background ambience */}
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
            <div style={{
              position: 'absolute', top: '-10%', left: '20%',
              width: '600px', height: '600px',
              background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
              borderRadius: '50%',
            }} />
            <div style={{
              position: 'absolute', bottom: '-5%', right: '15%',
              width: '500px', height: '500px',
              background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)',
              borderRadius: '50%',
            }} />
          </div>

          <div style={{
            width: '100%', maxWidth: '460px',
            background: 'rgba(15, 23, 42, 0.9)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: '28px',
            padding: '44px 36px',
            textAlign: 'center',
            boxShadow: '0 40px 80px rgba(0,0,0,0.5)',
            position: 'relative', zIndex: 1,
          }}>
            <div style={{
              width: '72px', height: '72px', borderRadius: '22px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px auto',
              boxShadow: '0 8px 30px rgba(99, 102, 241, 0.4)',
            }}>
              <Hotel size={36} color="white" />
            </div>
            <span style={{
              display: 'inline-block',
              padding: '5px 14px', borderRadius: '8px',
              background: 'rgba(99, 102, 241, 0.15)',
              border: '1px solid rgba(99, 102, 241, 0.35)',
              color: 'rgb(165, 180, 252)', fontSize: '12px', fontWeight: 800,
              letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '14px',
            }}>
              Tablet Setup Required
            </span>
            <h1 style={{ color: 'white', fontSize: '24px', fontWeight: 900, margin: '0 0 12px 0' }}>
              Hotel Staff Login
            </h1>
            <p style={{ color: 'rgb(148, 163, 184)', fontSize: '14px', lineHeight: 1.6, margin: '0 0 28px 0' }}>
              To connect this tablet to your hotel, please sign in with a hotel staff account. Once connected, this device will remain permanently active for your hotel.
            </p>
            <button
              onClick={() => router.push('/login?callbackUrl=/room-portal')}
              style={{
                width: '100%', padding: '18px',
                borderRadius: '16px', border: 'none',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                color: 'white', fontSize: '16px', fontWeight: 800,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: '10px',
                boxShadow: '0 8px 32px rgba(99,102,241,0.35)',
              }}
            >
              Sign In with Hotel Staff Account <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </>
    );
  }

  // ── 3. Configured state: Guest Room Login Screen ──
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
          padding: '32px 24px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background ambience */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <div style={{
            position: 'absolute', top: '-10%', left: '20%',
            width: '600px', height: '600px',
            background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
            borderRadius: '50%',
          }} />
          <div style={{
            position: 'absolute', bottom: '-5%', right: '15%',
            width: '500px', height: '500px',
            background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)',
            borderRadius: '50%',
          }} />
          {/* Decorative grid */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }} />
        </div>

        {/* Clock & Date — top section */}
        <div style={{ textAlign: 'center', marginBottom: '36px', position: 'relative', zIndex: 1 }}>
          <div style={{
            fontSize: '64px',
            fontWeight: 900,
            color: 'white',
            letterSpacing: '-2px',
            lineHeight: 1,
            marginBottom: '8px',
            textShadow: '0 0 60px rgba(99,102,241,0.3)',
          }}>
            {timeStr}
          </div>
          <div style={{ fontSize: '15px', color: 'rgb(100,116,139)', fontWeight: 500 }}>
            {dateStr}
          </div>
        </div>

        {/* Login Card */}
        <div style={{
          width: '100%',
          maxWidth: '440px',
          position: 'relative',
          zIndex: 1,
        }}>
          {/* Hotel logo / brand */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '68px', height: '68px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              boxShadow: '0 20px 60px rgba(99,102,241,0.35)',
              marginBottom: '14px',
            }}>
              <Hotel size={34} color="white" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{
                padding: '2px 8px', borderRadius: '6px',
                background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)',
                color: 'rgb(134,239,172)', fontSize: '11px', fontWeight: 800,
              }}>
                ● ONLINE
              </span>
              <h1 style={{ color: 'white', fontSize: '24px', fontWeight: 900, margin: 0 }}>
                {propertyName || 'Hotel Room Portal'}
              </h1>
            </div>
            <p style={{ color: 'rgb(100,116,139)', fontSize: '13px', margin: 0 }}>
              In-Room Guest Tablet • Enter your room &amp; mobile to begin
            </p>
          </div>

          {/* Step indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '24px',
          }}>
            <StepDot active={step === 'room'} done={step === 'mobile'} label="Room" number={1} />
            <div style={{ width: '48px', height: '2px', background: step === 'mobile' ? 'rgba(99,102,241,0.6)' : 'rgba(100,116,139,0.3)', borderRadius: '2px', transition: 'background 0.3s' }} />
            <StepDot active={step === 'mobile'} done={false} label="Mobile" number={2} />
          </div>

          {/* Card */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.9)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: '28px',
            padding: '36px',
            boxShadow: '0 40px 80px rgba(0,0,0,0.4), 0 0 0 0.5px rgba(255,255,255,0.05) inset',
          }}>
            {step === 'room' ? (
              <div>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', color: 'rgb(148,163,184)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '12px' }}>
                    <Hash size={12} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                    Room Number
                  </label>
                  <input
                    id="room-number-input"
                    type="text"
                    inputMode="numeric"
                    value={roomNumber}
                    onChange={(e) => { setRoomNumber(e.target.value); setError(''); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleRoomNext()}
                    placeholder="e.g. 101, 201, 205"
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '18px 20px',
                      borderRadius: '16px',
                      border: error ? '2px solid rgba(239,68,68,0.6)' : '1px solid rgba(99,102,241,0.3)',
                      background: 'rgba(15,23,42,0.6)',
                      color: 'white',
                      fontSize: '28px',
                      fontWeight: 900,
                      textAlign: 'center',
                      letterSpacing: '4px',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                {error && <ErrorMessage message={error} />}
                <button
                  id="room-next-btn"
                  onClick={handleRoomNext}
                  style={{
                    width: '100%',
                    padding: '18px',
                    borderRadius: '16px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    color: 'white',
                    fontSize: '16px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    boxShadow: '0 8px 32px rgba(99,102,241,0.35)',
                    transition: 'transform 0.1s, box-shadow 0.2s',
                    marginTop: '8px',
                  }}
                  onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
                  onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  Continue <ChevronRight size={20} />
                </button>
              </div>
            ) : (
              <div>
                <button
                  onClick={() => { setStep('room'); setError(''); }}
                  style={{ color: 'rgb(99,102,241)', fontSize: '13px', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  ← Back
                </button>
                <div style={{
                  background: 'rgba(99,102,241,0.1)',
                  border: '1px solid rgba(99,102,241,0.25)',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}>
                  <CheckCircle2 size={16} color="rgb(99,102,241)" />
                  <span style={{ color: 'rgb(148,163,184)', fontSize: '14px' }}>
                    Room <strong style={{ color: 'white' }}>{roomNumber}</strong> selected
                  </span>
                </div>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', color: 'rgb(148,163,184)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '12px' }}>
                    <Smartphone size={12} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                    Registered Mobile Number
                  </label>
                  <input
                    id="mobile-input"
                    type="tel"
                    inputMode="numeric"
                    value={mobile}
                    onChange={(e) => { setMobile(e.target.value); setError(''); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    placeholder="10-digit mobile number"
                    autoFocus
                    maxLength={15}
                    style={{
                      width: '100%',
                      padding: '18px 20px',
                      borderRadius: '16px',
                      border: error ? '2px solid rgba(239,68,68,0.6)' : '1px solid rgba(99,102,241,0.3)',
                      background: 'rgba(15,23,42,0.6)',
                      color: 'white',
                      fontSize: '24px',
                      fontWeight: 800,
                      textAlign: 'center',
                      letterSpacing: '3px',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      boxSizing: 'border-box',
                    }}
                  />
                  <p style={{ color: 'rgb(71,85,105)', fontSize: '12px', marginTop: '8px', textAlign: 'center' }}>
                    Use the mobile number registered during check-in
                  </p>
                </div>
                {error && <ErrorMessage message={error} />}
                <button
                  id="login-btn"
                  onClick={handleLogin}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '18px',
                    borderRadius: '16px',
                    border: 'none',
                    background: loading ? 'rgba(99,102,241,0.5)' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    color: 'white',
                    fontSize: '16px',
                    fontWeight: 800,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    boxShadow: '0 8px 32px rgba(99,102,241,0.35)',
                    transition: 'transform 0.1s, box-shadow 0.2s',
                    marginTop: '8px',
                  }}
                  onMouseDown={(e) => !loading && (e.currentTarget.style.transform = 'scale(0.98)')}
                  onMouseUp={(e) => !loading && (e.currentTarget.style.transform = 'scale(1)')}
                >
                  {loading ? (
                    <><Loader2 size={20} className="animate-spin" /> Verifying...</>
                  ) : (
                    <>Access My Room <ArrowRight size={20} /></>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Help & Device Info */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '20px', padding: '0 8px' }}>
            <span style={{ color: 'rgb(71,85,105)', fontSize: '12px' }}>
              Having trouble? Contact front desk.
            </span>
            <button
              onClick={handleUnpairTablet}
              title="Staff: Disconnect tablet from this property"
              style={{
                background: 'none', border: 'none', color: 'rgb(71,85,105)',
                fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
              }}
            >
              <Unlink size={11} /> Unlink Device
            </button>
          </div>
        </div>

        {/* Footer */}
        <p style={{
          position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
          color: 'rgb(51,65,85)', fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap',
        }}>
          Powered by <span style={{ color: 'rgb(99,102,241)' }}>GuestFlow HMS</span>
        </p>
      </div>
    </>
  );
}

function StepDot({ active, done, label, number }: { active: boolean; done: boolean; label: string; number: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
      <div style={{
        width: '32px', height: '32px', borderRadius: '50%',
        background: done ? 'rgba(34,197,94,0.2)' : active ? 'rgba(99,102,241,0.25)' : 'rgba(100,116,139,0.15)',
        border: done ? '2px solid rgba(34,197,94,0.6)' : active ? '2px solid rgba(99,102,241,0.7)' : '2px solid rgba(100,116,139,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.3s',
        color: done ? 'rgb(34,197,94)' : active ? 'rgb(99,102,241)' : 'rgb(100,116,139)',
        fontSize: '13px', fontWeight: 900,
      }}>
        {done ? '✓' : number}
      </div>
      <span style={{ fontSize: '10px', fontWeight: 700, color: active ? 'rgb(148,163,184)' : 'rgb(71,85,105)', textTransform: 'uppercase', letterSpacing: '1px' }}>
        {label}
      </span>
    </div>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '8px',
      background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
      borderRadius: '12px', padding: '12px 16px', marginBottom: '16px',
    }}>
      <AlertCircle size={16} color="rgb(239,68,68)" />
      <span style={{ color: 'rgb(252,165,165)', fontSize: '13px', fontWeight: 600 }}>{message}</span>
    </div>
  );
}
