'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { IndianRupee, Heart, CheckCircle2, AlertCircle, Copy, Check, Sparkles, Loader2, QrCode } from 'lucide-react';
import { toast } from 'sonner';

interface StaffUpiSettingCardProps {
  user?: any;
  wtToken?: string;
  theme?: 'dark' | 'glass';
}

const COMMON_UPI_HANDLES = [
  '@okhdfcbank',
  '@oksbi',
  '@okaxis',
  '@paytm',
  '@ybl',
  '@ibl',
];

export default function StaffUpiSettingCard({ user, wtToken, theme = 'dark' }: StaffUpiSettingCardProps) {
  const [upiId, setUpiId] = useState('');
  const [upiName, setUpiName] = useState('');
  const [initialUpiId, setInitialUpiId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [tipsSummary, setTipsSummary] = useState<{ totalAmount: number; confirmedAmount: number; totalCount: number } | null>(null);

  const fetchUpiDetails = useCallback(async () => {
    setLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (wtToken) {
        headers['Authorization'] = `Bearer ${wtToken}`;
      }

      const query = user?.id ? `?userId=${encodeURIComponent(user.id)}` : '';
      const res = await fetch(`/api/staff-portal/upi${query}`, { headers });
      const data = await res.json();

      if (data.success && data.staffMember) {
        setUpiId(data.staffMember.upiId || '');
        setInitialUpiId(data.staffMember.upiId || '');
        setUpiName(data.staffMember.upiName || user?.fullName || '');
      } else if (user?.fullName) {
        setUpiName(user.fullName);
      }

      if (data.tipsSummary) {
        setTipsSummary(data.tipsSummary);
      }
    } catch (err) {
      console.error('Failed to fetch UPI details:', err);
    } finally {
      setLoading(false);
    }
  }, [wtToken, user?.id, user?.fullName]);

  useEffect(() => {
    fetchUpiDetails();
  }, [fetchUpiDetails]);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = upiId.trim();

    if (clean && !clean.includes('@')) {
      toast.error('Invalid UPI format. Must contain "@" (e.g., yourname@oksbi)');
      return;
    }

    setSaving(true);
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (wtToken) {
        headers['Authorization'] = `Bearer ${wtToken}`;
      }

      const res = await fetch('/api/staff-portal/upi', {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          upiId: clean,
          upiName: upiName.trim() || user?.fullName || '',
          userId: user?.id,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setInitialUpiId(clean);
        toast.success(data.message || 'UPI details saved successfully!');
      } else {
        toast.error(data.message || 'Failed to update UPI ID');
      }
    } catch {
      toast.error('Network error. Could not save UPI details.');
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = () => {
    if (!upiId) return;
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    toast.success('UPI ID copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const appendHandle = (handle: string) => {
    if (!upiId) {
      setUpiId(handle);
    } else if (upiId.includes('@')) {
      const prefix = upiId.split('@')[0];
      setUpiId(prefix + handle);
    } else {
      setUpiId(upiId + handle);
    }
  };

  const isConfigured = Boolean(initialUpiId);

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(217, 119, 6, 0.03) 50%, rgba(15, 23, 42, 0.6) 100%)',
      border: '1px solid rgba(245, 158, 11, 0.25)',
      borderRadius: 18,
      padding: '18px 16px',
      margin: '14px 0',
      boxShadow: '0 8px 32px -4px rgba(245, 158, 11, 0.08)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Ambient background glow */}
      <div style={{
        position: 'absolute',
        top: -20,
        right: -20,
        width: 120,
        height: 120,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(245, 158, 11, 0.15) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
            color: '#fff',
          }}>
            <Heart size={18} fill="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 900, color: '#f8fafc', letterSpacing: '0.02em' }}>
                UPI ID for Guest Tips
              </span>
              <span style={{
                fontSize: 9,
                fontWeight: 900,
                padding: '2px 7px',
                borderRadius: 99,
                background: isConfigured ? 'rgba(34, 197, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                color: isConfigured ? '#4ade80' : '#fbbf24',
                border: `1px solid ${isConfigured ? 'rgba(34, 197, 94, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                display: 'flex',
                alignItems: 'center',
                gap: 3,
              }}>
                {isConfigured ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
                {isConfigured ? 'Active' : 'Setup Required'}
              </span>
            </div>
            <p style={{ fontSize: 10, color: '#94a3b8', margin: '2px 0 0' }}>
              Guests can tip you directly on your personal UPI
            </p>
          </div>
        </div>
      </div>

      {/* Tips statistics banner if any */}
      {tipsSummary && tipsSummary.totalCount > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.2)',
          borderRadius: 12,
          padding: '10px 14px',
          marginBottom: 14,
        }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', color: '#fbbf24', letterSpacing: '0.05em' }}>
              Total Tips Earned
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#fef3c7', display: 'flex', alignItems: 'center', gap: 2 }}>
              <span>₹{tipsSummary.totalAmount}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#a3e635', marginLeft: 6 }}>
                ({tipsSummary.totalCount} tips)
              </span>
            </div>
          </div>
          <div style={{
            fontSize: 10,
            color: '#cbd5e1',
            background: 'rgba(0,0,0,0.3)',
            padding: '5px 10px',
            borderRadius: 8,
          }}>
            Confirmed: <strong style={{ color: '#4ade80' }}>₹{tipsSummary.confirmedAmount}</strong>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 0', gap: 8, color: '#fbbf24', fontSize: 12 }}>
          <Loader2 size={16} className="animate-spin" />
          <span>Loading UPI details...</span>
        </div>
      ) : (
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* UPI ID Field */}
          <div>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
              Your UPI ID (VPA) <span style={{ color: '#f43f5e' }}>*</span>
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type="text"
                value={upiId}
                onChange={e => setUpiId(e.target.value.toLowerCase().replace(/\s/g, ''))}
                placeholder="e.g. 9876543210@paytm or name@oksbi"
                required
                style={{
                  width: '100%',
                  padding: '11px 40px 11px 12px',
                  borderRadius: 11,
                  background: 'rgba(0, 0, 0, 0.35)',
                  border: '1.5px solid rgba(245, 158, 11, 0.35)',
                  color: '#ffffff',
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              {upiId && (
                <button
                  type="button"
                  onClick={handleCopy}
                  title="Copy UPI ID"
                  style={{
                    position: 'absolute',
                    right: 8,
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: 'none',
                    borderRadius: 6,
                    padding: '6px',
                    color: copied ? '#4ade80' : '#cbd5e1',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
              )}
            </div>

            {/* Quick Handle Suggestions */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
              {COMMON_UPI_HANDLES.map(handle => (
                <button
                  key={handle}
                  type="button"
                  onClick={() => appendHandle(handle)}
                  style={{
                    fontSize: 9,
                    fontWeight: 800,
                    padding: '3px 7px',
                    borderRadius: 6,
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#e2e8f0',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(245, 158, 11, 0.2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)')}
                >
                  {handle}
                </button>
              ))}
            </div>
          </div>

          {/* Account Holder Name */}
          <div>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
              Account Holder Name (as in bank)
            </label>
            <input
              type="text"
              value={upiName}
              onChange={e => setUpiName(e.target.value)}
              placeholder="e.g. Ramesh Kumar"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 11,
                background: 'rgba(0, 0, 0, 0.35)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#ffffff',
                fontSize: 12,
                fontWeight: 600,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Save Action */}
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: 11,
                background: saving
                  ? 'rgba(245, 158, 11, 0.5)'
                  : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                border: 'none',
                color: '#ffffff',
                fontSize: 12,
                fontWeight: 900,
                cursor: saving ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 14px rgba(245, 158, 11, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              {saving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Saving UPI ID...</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  <span>{isConfigured ? 'Update UPI ID' : 'Save UPI ID'}</span>
                </>
              )}
            </button>

            {isConfigured && (
              <button
                type="button"
                onClick={() => {
                  setUpiId('');
                  setUpiName('');
                  handleSave();
                }}
                disabled={saving}
                style={{
                  padding: '10px 14px',
                  borderRadius: 11,
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  color: '#f87171',
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                Clear
              </button>
            )}
          </div>
        </form>
      )}

      {/* Info notice */}
      <div style={{
        marginTop: 12,
        padding: '8px 10px',
        borderRadius: 8,
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 9,
        color: '#94a3b8',
      }}>
        <span>💡</span>
        <span>
          When hotel guests scan the tip QR code or use the guest portal, they will be able to tip your UPI ID directly.
        </span>
      </div>
    </div>
  );
}
