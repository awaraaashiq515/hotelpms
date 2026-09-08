'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import DashboardSubpage from '@/components/room-portal/DashboardSubpage';

const AMENITIES = [
  { emoji: '🏋️', label: 'Fitness Center', timeKey: 'gymTimings', desc: 'State-of-the-art equipment, cardio & weights', color: 'rgba(251,146,60,0.3)', border: 'rgba(251,146,60,0.4)' },
  { emoji: '🏊', label: 'Swimming Pool', timeKey: 'poolTimings', desc: 'Heated outdoor pool with poolside service', color: 'rgba(34,211,238,0.2)', border: 'rgba(34,211,238,0.4)' },
  { emoji: '💆', label: 'Spa & Wellness', timeKey: 'spaTimings', desc: 'Massages, treatments & relaxation therapies', color: 'rgba(236,72,153,0.2)', border: 'rgba(236,72,153,0.4)' },
  { emoji: '🍳', label: 'Breakfast Buffet', timeKey: 'breakfastTimings', desc: 'Continental & Indian breakfast spreads', color: 'rgba(251,191,36,0.2)', border: 'rgba(251,191,36,0.4)' },
  { emoji: '🍽️', label: 'Restaurant', timeKey: 'restaurantTimings', desc: 'Multi-cuisine dining experience', color: 'rgba(16,185,129,0.2)', border: 'rgba(16,185,129,0.4)' },
];

export default function AmenitiesPage() {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('room_portal_token') || '';
    fetch('/api/room-portal/config', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { if (d.success) setConfig(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardSubpage title="Hotel Amenities" emoji="🏨" accentColor="rgba(16,185,129,0.4)">
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <Loader2 size={32} color="rgb(99,102,241)" className="animate-spin" />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '700px', margin: '0 auto' }}>
          {AMENITIES.map((a) => (
            <div
              key={a.label}
              style={{
                background: a.color, border: `1px solid ${a.border}`,
                borderRadius: '20px', padding: '24px 28px',
                display: 'flex', alignItems: 'center', gap: '20px',
              }}
            >
              <div style={{
                width: '64px', height: '64px', borderRadius: '18px',
                background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '32px', flexShrink: 0,
              }}>
                {a.emoji}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ color: 'white', fontSize: '18px', fontWeight: 900, margin: '0 0 4px 0' }}>{a.label}</h3>
                <p style={{ color: 'rgb(148,163,184)', fontSize: '13px', margin: '0 0 10px 0' }}>{a.desc}</p>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '6px 12px',
                }}>
                  <span style={{ color: 'rgb(34,197,94)', fontSize: '12px' }}>🕐</span>
                  <span style={{ color: 'rgb(148,163,184)', fontSize: '13px', fontWeight: 700 }}>
                    {config?.[a.timeKey] || 'Contact front desk for timings'}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {/* Note */}
          <div style={{
            background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: '14px', padding: '16px 20px', marginTop: '8px',
          }}>
            <p style={{ color: 'rgb(148,163,184)', fontSize: '13px', margin: 0, lineHeight: 1.6 }}>
              📌 <strong style={{ color: 'white' }}>Note:</strong> Timings may vary on weekends and holidays.
              For reservations at the Spa or Restaurant, please contact the Front Desk.
            </p>
          </div>
        </div>
      )}
    </DashboardSubpage>
  );
}
