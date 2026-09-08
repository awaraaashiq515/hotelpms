'use client';

import { useState } from 'react';
import { Loader2, CheckCircle2, Send } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import DashboardSubpage from '@/components/room-portal/DashboardSubpage';

const REQUEST_TYPES = [
  { id: 'CLEANING', emoji: '🧹', label: 'Room Cleaning', desc: 'Full room cleaning service' },
  { id: 'TOWELS', emoji: '🛁', label: 'Fresh Towels', desc: 'Replace or add towels' },
  { id: 'AMENITIES', emoji: '🧴', label: 'Toiletries', desc: 'Shampoo, soap, toothbrush...' },
  { id: 'BEDDING', emoji: '🛏️', label: 'Fresh Bedding', desc: 'Change bed sheets & pillows' },
  { id: 'LAUNDRY', emoji: '👕', label: 'Laundry', desc: 'Collect laundry for cleaning' },
  { id: 'DND', emoji: '🚫', label: 'Do Not Disturb', desc: 'Set DND for your room' },
  { id: 'WATER', emoji: '💧', label: 'Drinking Water', desc: 'Extra water bottles' },
  { id: 'OTHER', emoji: '📋', label: 'Other Request', desc: 'Custom request' },
];

export default function HousekeepingPage() {
  const [selected, setSelected] = useState<string>('');
  const [priority, setPriority] = useState<'URGENT' | 'NORMAL'>('NORMAL');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!selected) {
      toast.error('Please select a request type.');
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('room_portal_token') || '';
      const res = await fetch('/api/room-portal/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: 'HOUSEKEEPING', category: selected, notes, priority }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
        toast.success('Request submitted! Our team will be there shortly.');
      } else {
        toast.error(data.message || 'Failed to submit.');
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
      <DashboardSubpage title="Housekeeping" emoji="🧹" accentColor="rgba(34,211,238,0.4)">
        {submitted ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '72px', marginBottom: '20px' }}>✅</div>
            <h2 style={{ color: 'white', fontSize: '24px', fontWeight: 900, marginBottom: '12px' }}>Request Submitted!</h2>
            <p style={{ color: 'rgb(100,116,139)', fontSize: '16px', marginBottom: '32px' }}>
              Our housekeeping team will attend to your request shortly.
            </p>
            <button
              onClick={() => { setSubmitted(false); setSelected(''); setNotes(''); }}
              style={{
                padding: '14px 32px', borderRadius: '14px', border: 'none',
                background: 'linear-gradient(135deg, #22d3ee, #3b82f6)',
                color: 'white', fontSize: '15px', fontWeight: 800, cursor: 'pointer',
              }}
            >
              Submit Another Request
            </button>
          </div>
        ) : (
          <div>
            {/* Request type grid */}
            <p style={{ color: 'rgb(100,116,139)', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '16px' }}>
              Select Request Type
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '28px' }}>
              {REQUEST_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelected(type.id)}
                  style={{
                    background: selected === type.id
                      ? 'linear-gradient(135deg, rgba(34,211,238,0.2), rgba(59,130,246,0.1))'
                      : 'rgba(15,23,42,0.8)',
                    border: selected === type.id ? '2px solid rgba(34,211,238,0.6)' : '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '16px', padding: '20px 12px',
                    cursor: 'pointer', transition: 'all 0.2s',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                    boxShadow: selected === type.id ? '0 0 20px rgba(34,211,238,0.2)' : 'none',
                  }}
                >
                  <span style={{ fontSize: '32px' }}>{type.emoji}</span>
                  <p style={{ color: 'white', fontWeight: 800, fontSize: '13px', margin: 0, textAlign: 'center' }}>{type.label}</p>
                  <p style={{ color: 'rgb(100,116,139)', fontSize: '11px', margin: 0, textAlign: 'center' }}>{type.desc}</p>
                  {selected === type.id && <CheckCircle2 size={16} color="rgb(34,211,238)" />}
                </button>
              ))}
            </div>

            {/* Priority */}
            <div style={{ marginBottom: '20px' }}>
              <p style={{ color: 'rgb(100,116,139)', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '10px' }}>Priority</p>
              <div style={{ display: 'flex', gap: '12px' }}>
                {(['NORMAL', 'URGENT'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPriority(p)}
                    style={{
                      padding: '10px 24px', borderRadius: '12px',
                      border: priority === p
                        ? `2px solid ${p === 'URGENT' ? 'rgba(239,68,68,0.7)' : 'rgba(34,211,238,0.7)'}`
                        : '1px solid rgba(255,255,255,0.1)',
                      background: priority === p
                        ? p === 'URGENT' ? 'rgba(239,68,68,0.15)' : 'rgba(34,211,238,0.15)'
                        : 'rgba(15,23,42,0.6)',
                      color: priority === p
                        ? p === 'URGENT' ? 'rgb(252,165,165)' : 'rgb(103,232,249)'
                        : 'rgb(100,116,139)',
                      fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    {p === 'URGENT' ? '🚨 Urgent' : '✅ Normal'}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div style={{ marginBottom: '28px' }}>
              <p style={{ color: 'rgb(100,116,139)', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '10px' }}>
                Additional Notes (Optional)
              </p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any specific instructions for the housekeeping team..."
                rows={3}
                style={{
                  width: '100%', padding: '14px 16px', borderRadius: '14px',
                  border: '1px solid rgba(99,102,241,0.2)', background: 'rgba(15,23,42,0.7)',
                  color: 'white', fontSize: '15px', resize: 'none', outline: 'none',
                  fontFamily: 'inherit', boxSizing: 'border-box',
                }}
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading || !selected}
              style={{
                width: '100%', padding: '18px', borderRadius: '16px', border: 'none',
                background: !selected ? 'rgba(99,102,241,0.3)' : 'linear-gradient(135deg, #22d3ee, #3b82f6)',
                color: 'white', fontSize: '16px', fontWeight: 800, cursor: !selected ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                boxShadow: selected ? '0 8px 32px rgba(34,211,238,0.3)' : 'none',
              }}
            >
              {loading ? <><Loader2 size={20} className="animate-spin" /> Submitting...</> : <><Send size={20} /> Submit Request</>}
            </button>
          </div>
        )}
      </DashboardSubpage>
    </>
  );
}
