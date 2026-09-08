'use client';

import { useState } from 'react';
import { LogOut, Clock, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import DashboardSubpage from '@/components/room-portal/DashboardSubpage';

export default function CheckoutPage() {
  const [expectedTime, setExpectedTime] = useState('11:00');
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleSubmit = async () => {
    if (!confirmed) {
      toast.error('Please confirm you want to request checkout.');
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('room_portal_token') || '';
      const res = await fetch('/api/room-portal/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ expectedTime, instructions }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
      } else {
        toast.error(data.message || 'Failed to submit checkout request.');
      }
    } catch {
      toast.error('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Toaster richColors position="top-center" />
      <DashboardSubpage title="Request Check-out" emoji="🚪" accentColor="rgba(239,68,68,0.4)">
        {submitted ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '80px', marginBottom: '20px' }}>✅</div>
            <h2 style={{ color: 'white', fontSize: '26px', fontWeight: 900, marginBottom: '12px' }}>
              Checkout Request Submitted!
            </h2>
            <p style={{ color: 'rgb(100,116,139)', fontSize: '15px', marginBottom: '8px', lineHeight: 1.7 }}>
              Our team has been notified and will contact you shortly to assist with the checkout process.
              Please ensure all personal belongings are packed and room keys are returned.
            </p>
            <div style={{
              background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
              borderRadius: '14px', padding: '16px 24px', display: 'inline-block', marginTop: '24px',
            }}>
              <p style={{ color: 'rgb(134,239,172)', fontWeight: 700, margin: 0 }}>
                🕐 Expected checkout: {expectedTime}
              </p>
            </div>
          </div>
        ) : (
          <div style={{ maxWidth: '560px', margin: '0 auto' }}>
            {/* Warning Banner */}
            <div style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '16px', padding: '18px 20px', marginBottom: '24px',
              display: 'flex', gap: '12px', alignItems: 'flex-start',
            }}>
              <AlertTriangle size={20} color="rgb(239,68,68)" style={{ flexShrink: 0, marginTop: '1px' }} />
              <p style={{ color: 'rgb(252,165,165)', fontSize: '14px', margin: 0, lineHeight: 1.6 }}>
                Submitting this request will notify our front desk team that you wish to check out.
                Your folio will be prepared for final settlement.
              </p>
            </div>

            {/* Expected Time */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: 'rgb(100,116,139)', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '10px' }}>
                <Clock size={12} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                Expected Checkout Time
              </label>
              <input
                type="time"
                value={expectedTime}
                onChange={(e) => setExpectedTime(e.target.value)}
                style={{
                  width: '100%', padding: '16px 20px', borderRadius: '14px',
                  border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(15,23,42,0.7)',
                  color: 'white', fontSize: '24px', fontWeight: 800, outline: 'none',
                  boxSizing: 'border-box',
                  colorScheme: 'dark',
                }}
              />
              <p style={{ color: 'rgb(71,85,105)', fontSize: '12px', marginTop: '6px' }}>
                Standard checkout time is 11:00 AM. Late checkout may incur additional charges.
              </p>
            </div>

            {/* Special Instructions */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', color: 'rgb(100,116,139)', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '10px' }}>
                Special Instructions (Optional)
              </label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="e.g. Need help with luggage, early checkout, bill split..."
                rows={3}
                style={{
                  width: '100%', padding: '14px 16px', borderRadius: '14px',
                  border: '1px solid rgba(99,102,241,0.2)', background: 'rgba(15,23,42,0.7)',
                  color: 'white', fontSize: '15px', resize: 'none', outline: 'none',
                  fontFamily: 'inherit', boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Confirmation Checkbox */}
            <label style={{
              display: 'flex', alignItems: 'center', gap: '14px',
              background: confirmed ? 'rgba(34,197,94,0.1)' : 'rgba(15,23,42,0.8)',
              border: confirmed ? '1px solid rgba(34,197,94,0.4)' : '1px solid rgba(255,255,255,0.1)',
              borderRadius: '14px', padding: '16px 20px', marginBottom: '24px',
              cursor: 'pointer', transition: 'all 0.2s',
            }}>
              <div
                onClick={() => setConfirmed(!confirmed)}
                style={{
                  width: '24px', height: '24px', borderRadius: '8px', flexShrink: 0,
                  background: confirmed ? 'rgba(34,197,94,0.8)' : 'rgba(255,255,255,0.05)',
                  border: confirmed ? '2px solid rgb(34,197,94)' : '2px solid rgba(255,255,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s', cursor: 'pointer',
                }}
              >
                {confirmed && <CheckCircle2 size={16} color="white" fill="white" />}
              </div>
              <p style={{ color: confirmed ? 'rgb(134,239,172)' : 'rgb(148,163,184)', fontSize: '14px', margin: 0, lineHeight: 1.5 }}>
                I confirm that I want to request checkout and understand that my bill will be finalized.
              </p>
            </label>

            <button
              onClick={handleSubmit}
              disabled={loading || !confirmed}
              style={{
                width: '100%', padding: '18px', borderRadius: '16px', border: 'none',
                background: !confirmed ? 'rgba(239,68,68,0.3)' : loading ? 'rgba(239,68,68,0.5)' : 'linear-gradient(135deg, #ef4444, #dc2626)',
                color: 'white', fontSize: '16px', fontWeight: 800,
                cursor: !confirmed || loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                boxShadow: confirmed ? '0 8px 32px rgba(239,68,68,0.3)' : 'none',
              }}
            >
              {loading
                ? <><Loader2 size={20} className="animate-spin" /> Submitting...</>
                : <><LogOut size={20} /> Request Checkout</>}
            </button>
          </div>
        )}
      </DashboardSubpage>
    </>
  );
}
