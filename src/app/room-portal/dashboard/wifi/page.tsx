'use client';

import { useState, useEffect } from 'react';
import { Wifi, Copy, Eye, EyeOff, CheckCircle2, Loader2 } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import DashboardSubpage from '@/components/room-portal/DashboardSubpage';

export default function WifiPage() {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('room_portal_token') || '';
    fetch('/api/room-portal/config', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { if (d.success) setConfig(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(`${label} copied to clipboard!`);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error('Could not copy. Please note it manually.');
    }
  };

  return (
    <>
      <Toaster richColors position="top-center" />
      <DashboardSubpage title="Wi-Fi Information" emoji="📶" accentColor="rgba(99,102,241,0.4)">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
            <Loader2 size={32} color="rgb(99,102,241)" className="animate-spin" />
          </div>
        ) : (
          <div style={{ maxWidth: '560px', margin: '0 auto' }}>
            {/* WiFi Icon */}
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <div style={{
                width: '96px', height: '96px', borderRadius: '28px', margin: '0 auto 16px',
                background: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.15))',
                border: '2px solid rgba(99,102,241,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 40px rgba(99,102,241,0.2)',
              }}>
                <Wifi size={48} color="rgb(99,102,241)" />
              </div>
              <p style={{ color: 'rgb(148,163,184)', fontSize: '15px' }}>
                Connect your device to the hotel Wi-Fi
              </p>
            </div>

            {/* WiFi Network Name */}
            <WifiInfoCard
              label="Network Name (SSID)"
              value={config?.wifiName || 'Hotel-Free-WiFi'}
              onCopy={() => handleCopy(config?.wifiName || 'Hotel-Free-WiFi', 'Network name')}
              copied={false}
            />

            {/* WiFi Password */}
            <div style={{
              background: 'rgba(15,23,42,0.85)', border: '1px solid rgba(99,102,241,0.25)',
              borderRadius: '18px', padding: '24px', marginBottom: '16px',
            }}>
              <p style={{ color: 'rgb(100,116,139)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 12px 0' }}>
                Password
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  flex: 1, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
                  borderRadius: '12px', padding: '16px',
                }}>
                  <p style={{
                    color: 'white', fontSize: '24px', fontWeight: 900, letterSpacing: showPassword ? '4px' : '8px',
                    fontFamily: 'monospace', margin: 0,
                  }}>
                    {showPassword ? (config?.wifiPassword || 'welcome123') : '•'.repeat((config?.wifiPassword || 'welcome123').length)}
                  </p>
                </div>
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    width: '48px', height: '48px', borderRadius: '12px',
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: 'rgb(148,163,184)', flexShrink: 0,
                  }}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
                <button
                  onClick={() => handleCopy(config?.wifiPassword || 'welcome123', 'Password')}
                  style={{
                    width: '48px', height: '48px', borderRadius: '12px',
                    background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(99,102,241,0.15)',
                    border: copied ? '1px solid rgba(34,197,94,0.4)' : '1px solid rgba(99,102,241,0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: copied ? 'rgb(34,197,94)' : 'rgb(99,102,241)', flexShrink: 0,
                  }}
                >
                  {copied ? <CheckCircle2 size={20} /> : <Copy size={20} />}
                </button>
              </div>
            </div>

            {/* Tips */}
            <div style={{
              background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: '14px', padding: '16px 20px',
            }}>
              <p style={{ color: 'rgb(99,102,241)', fontSize: '12px', fontWeight: 800, margin: '0 0 8px 0' }}>💡 Connection Tips</p>
              <ul style={{ color: 'rgb(100,116,139)', fontSize: '13px', margin: 0, paddingLeft: '16px', lineHeight: 1.8 }}>
                <li>Select the Wi-Fi network from your device settings</li>
                <li>Enter the password exactly as shown above</li>
                <li>For issues, please contact the front desk</li>
              </ul>
            </div>
          </div>
        )}
      </DashboardSubpage>
    </>
  );
}

function WifiInfoCard({ label, value, onCopy, copied }: { label: string; value: string; onCopy: () => void; copied: boolean }) {
  return (
    <div style={{
      background: 'rgba(15,23,42,0.85)', border: '1px solid rgba(99,102,241,0.25)',
      borderRadius: '18px', padding: '24px', marginBottom: '16px',
    }}>
      <p style={{ color: 'rgb(100,116,139)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 12px 0' }}>
        {label}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <p style={{ color: 'white', fontSize: '22px', fontWeight: 900, margin: 0, letterSpacing: '1px' }}>{value}</p>
        <button
          onClick={onCopy}
          style={{
            padding: '10px 16px', borderRadius: '12px',
            background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.35)',
            color: 'rgb(99,102,241)', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}
        >
          <Copy size={14} /> Copy
        </button>
      </div>
    </div>
  );
}
