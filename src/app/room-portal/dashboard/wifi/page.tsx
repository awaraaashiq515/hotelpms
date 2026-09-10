'use client';

import { useState, useEffect } from 'react';
import { Wifi, Copy, Eye, EyeOff, CheckCircle2, Loader2, ShieldCheck, Clock, KeyRound, Smartphone, Radio } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import DashboardSubpage from '@/components/room-portal/DashboardSubpage';
import { QRCodeSVG } from 'qrcode.react';

export default function WifiPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);
  const [copiedSsid, setCopiedSsid] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('room_portal_token') || '';
    
    // First try /api/room-portal/me to get guest-specific dynamic voucher & checkout expiry
    fetch('/api/room-portal/me', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data) {
          setData(d.data);
        } else {
          // Fallback to property config
          return fetch('/api/room-portal/config', { headers: { Authorization: `Bearer ${token}` } })
            .then((r) => r.json())
            .then((conf) => {
              if (conf.success) setData({ config: conf.data });
            });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const wifiName = data?.wifiName || data?.config?.wifiName || 'Hotel-Free-WiFi';
  const wifiPassword = data?.wifiPassword || data?.reservation?.wifiPassword || data?.config?.wifiPassword || 'welcome123';
  const roomNumber = data?.room?.roomNumber;
  const departureDate = data?.reservation?.departureDate;
  const wifiStatus = data?.wifiStatus || data?.reservation?.wifiStatus || 'ACTIVE';
  const isCheckedIn = data?.reservation?.status === 'CHECKED_IN';

  const formattedExpiry = departureDate
    ? new Date(departureDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'At Checkout';

  const handleCopy = async (text: string, type: 'ssid' | 'pass') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'pass') {
        setCopiedPass(true);
        setTimeout(() => setCopiedPass(false), 2500);
      } else {
        setCopiedSsid(true);
        setTimeout(() => setCopiedSsid(false), 2500);
      }
      toast.success('Copied to clipboard!');
    } catch {
      toast.error('Could not copy. Please note it manually.');
    }
  };

  return (
    <>
      <Toaster richColors position="top-center" />
      <DashboardSubpage title="High-Speed Wi-Fi" emoji="📶" accentColor="rgba(99,102,241,0.4)">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
            <Loader2 size={32} color="rgb(99,102,241)" className="animate-spin" />
          </div>
        ) : (
          <div style={{ maxWidth: '580px', margin: '0 auto' }}>
            {/* Header / Status Banner */}
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <div
                style={{
                  width: '88px',
                  height: '88px',
                  borderRadius: '26px',
                  margin: '0 auto 16px',
                  background: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.15))',
                  border: '2px solid rgba(99,102,241,0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 40px rgba(99,102,241,0.2)',
                }}
              >
                <Wifi size={44} color="rgb(129,140,248)" />
              </div>

              {/* Dynamic Voucher Active Badge */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(34,197,94,0.12)',
                  border: '1px solid rgba(34,197,94,0.3)',
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  marginBottom: '10px',
                }}
              >
                <ShieldCheck size={14} color="rgb(34,197,94)" />
                <span style={{ color: 'rgb(74,222,128)', fontSize: '12px', fontWeight: 700, letterSpacing: '0.5px' }}>
                  {wifiStatus === 'ACTIVE' ? 'Personal Guest Access Active' : 'Access Expired'}
                </span>
              </div>

              {departureDate && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: 'rgb(148,163,184)', fontSize: '13px' }}>
                  <Clock size={13} />
                  <span>Valid until checkout: <strong style={{ color: 'white' }}>{formattedExpiry}</strong></span>
                </div>
              )}
            </div>

            {/* Network Name (SSID) */}
            <div
              style={{
                background: 'rgba(15,23,42,0.85)',
                border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'rgb(148,163,184)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Radio size={13} color="rgb(99,102,241)" /> Hotel Wi-Fi Network (SSID)
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <span style={{ color: 'white', fontSize: '20px', fontWeight: 800, letterSpacing: '0.5px' }}>
                  {wifiName}
                </span>
                <button
                  onClick={() => handleCopy(wifiName, 'ssid')}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '10px',
                    background: copiedSsid ? 'rgba(34,197,94,0.15)' : 'rgba(99,102,241,0.15)',
                    border: copiedSsid ? '1px solid rgba(34,197,94,0.4)' : '1px solid rgba(99,102,241,0.3)',
                    color: copiedSsid ? 'rgb(34,197,94)' : 'rgb(129,140,248)',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {copiedSsid ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                  {copiedSsid ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Wi-Fi Password / Voucher PIN */}
            <div
              style={{
                background: 'rgba(15,23,42,0.85)',
                border: '1px solid rgba(99,102,241,0.25)',
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '18px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'rgb(148,163,184)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <KeyRound size={13} color="rgb(99,102,241)" /> Your Unique Passcode / PIN
                </span>
                {roomNumber && (
                  <span style={{ color: 'rgb(99,102,241)', fontSize: '11px', fontWeight: 700, background: 'rgba(99,102,241,0.12)', padding: '2px 8px', borderRadius: '6px' }}>
                    Room {roomNumber}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    flex: 1,
                    background: 'rgba(99,102,241,0.08)',
                    border: '1px solid rgba(99,102,241,0.25)',
                    borderRadius: '12px',
                    padding: '14px 16px',
                  }}
                >
                  <p
                    style={{
                      color: 'white',
                      fontSize: '22px',
                      fontWeight: 900,
                      letterSpacing: showPassword ? '2px' : '6px',
                      fontFamily: 'monospace',
                      margin: 0,
                    }}
                  >
                    {showPassword ? wifiPassword : '•'.repeat(Math.min(10, wifiPassword.length))}
                  </p>
                </div>

                <button
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'rgb(148,163,184)',
                    flexShrink: 0,
                  }}
                  title={showPassword ? 'Hide' : 'Show'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>

                <button
                  onClick={() => handleCopy(wifiPassword, 'pass')}
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '12px',
                    background: copiedPass ? 'rgba(34,197,94,0.15)' : 'rgba(99,102,241,0.15)',
                    border: copiedPass ? '1px solid rgba(34,197,94,0.4)' : '1px solid rgba(99,102,241,0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: copiedPass ? 'rgb(34,197,94)' : 'rgb(129,140,248)',
                    flexShrink: 0,
                  }}
                  title="Copy password"
                >
                  {copiedPass ? <CheckCircle2 size={18} /> : <Copy size={18} />}
                </button>
              </div>
            </div>

            {/* Instant Camera QR Code */}
            <div
              style={{
                background: 'linear-gradient(180deg, rgba(15,23,42,0.9) 0%, rgba(30,27,75,0.4) 100%)',
                border: '1px solid rgba(99,102,241,0.3)',
                borderRadius: '20px',
                padding: '24px',
                marginBottom: '18px',
                textAlign: 'center',
                boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
              }}
            >
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <Smartphone size={16} color="rgb(129,140,248)" />
                <span style={{ color: 'white', fontSize: '15px', fontWeight: 800 }}>
                  Scan to Connect Automatically
                </span>
              </div>
              <p style={{ color: 'rgb(148,163,184)', fontSize: '13px', margin: '0 0 16px 0', lineHeight: 1.5 }}>
                Open your smartphone camera and point it at this QR code to connect instantly without typing.
              </p>

              <div
                style={{
                  display: 'inline-block',
                  background: 'white',
                  padding: '16px',
                  borderRadius: '18px',
                  boxShadow: '0 12px 36px rgba(0,0,0,0.6)',
                }}
              >
                <QRCodeSVG
                  value={`WIFI:T:WPA;S:${wifiName};P:${wifiPassword};;`}
                  size={190}
                  level="M"
                />
              </div>

              <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <span style={{ color: 'rgb(34,197,94)', fontSize: '12px', fontWeight: 700 }}>
                  ✓ Instant 1-Tap Connect on iPhone &amp; Android
                </span>
              </div>
            </div>

            {/* Hotspot / Captive Portal Sign-In Instructions */}
            <div
              style={{
                background: 'rgba(15,23,42,0.7)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '16px',
                padding: '18px 20px',
                marginBottom: '14px',
              }}
            >
              <p style={{ color: 'rgb(226,232,240)', fontSize: '13px', fontWeight: 800, margin: '0 0 8px 0' }}>
                🌐 Captive Portal / Sign-In Screen Prompt?
              </p>
              <p style={{ color: 'rgb(148,163,184)', fontSize: '12px', lineHeight: 1.6, margin: '0 0 12px 0' }}>
                If your device shows a &ldquo;Sign in to Wi-Fi network&rdquo; web browser popup:
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <p style={{ color: 'rgb(148,163,184)', fontSize: '11px', margin: 0, fontWeight: 700 }}>ROOM NUMBER</p>
                  <p style={{ color: 'white', fontSize: '15px', fontWeight: 800, margin: '4px 0 0 0' }}>{roomNumber || 'Your Room'}</p>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <p style={{ color: 'rgb(148,163,184)', fontSize: '11px', margin: 0, fontWeight: 700 }}>PASSCODE / PIN</p>
                  <p style={{ color: 'rgb(129,140,248)', fontSize: '15px', fontWeight: 800, margin: '4px 0 0 0', fontFamily: 'monospace' }}>{wifiPassword}</p>
                </div>
              </div>
            </div>

            {/* Expiry Notice */}
            <div
              style={{
                background: 'rgba(99,102,241,0.06)',
                border: '1px solid rgba(99,102,241,0.18)',
                borderRadius: '14px',
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
              }}
            >
              <ShieldCheck size={16} color="rgb(129,140,248)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <p style={{ color: 'rgb(148,163,184)', fontSize: '12px', margin: 0, lineHeight: 1.6 }}>
                <strong>Privacy &amp; Security:</strong> This credential is uniquely generated for your room and automatically expires at check-out. If you need any assistance, contact Front Desk.
              </p>
            </div>
          </div>
        )}
      </DashboardSubpage>
    </>
  );
}
