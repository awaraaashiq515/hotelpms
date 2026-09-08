'use client';

import { useState, useEffect } from 'react';
import { Phone, MessageSquare, AlertTriangle, Loader2 } from 'lucide-react';
import DashboardSubpage from '@/components/room-portal/DashboardSubpage';

export default function ContactPage() {
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

  const frontDeskPhone = config?.frontDeskPhone || '+91-000-000-0000';
  const emergencyPhone = config?.emergencyPhone || '+91-000-000-0001';

  return (
    <DashboardSubpage title="Contact Front Desk" emoji="☎️" accentColor="rgba(236,72,153,0.4)">
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <Loader2 size={32} color="rgb(99,102,241)" className="animate-spin" />
        </div>
      ) : (
        <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Main Call Card */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(236,72,153,0.15), rgba(219,39,119,0.08))',
            border: '1px solid rgba(236,72,153,0.35)', borderRadius: '24px', padding: '32px',
            textAlign: 'center',
          }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '24px', margin: '0 auto 20px',
              background: 'linear-gradient(135deg, rgba(236,72,153,0.3), rgba(219,39,119,0.2))',
              border: '2px solid rgba(236,72,153,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 40px rgba(236,72,153,0.2)',
            }}>
              <Phone size={40} color="rgb(236,72,153)" />
            </div>
            <h2 style={{ color: 'white', fontSize: '22px', fontWeight: 900, margin: '0 0 8px 0' }}>Front Desk</h2>
            <p style={{ color: 'rgb(148,163,184)', fontSize: '14px', margin: '0 0 24px 0' }}>
              Available 24/7 to assist you
            </p>
            <div style={{
              background: 'rgba(0,0,0,0.3)', borderRadius: '14px', padding: '16px',
              marginBottom: '20px',
            }}>
              <p style={{ color: 'rgb(236,72,153)', fontSize: '28px', fontWeight: 900, letterSpacing: '2px', margin: 0 }}>
                {frontDeskPhone}
              </p>
            </div>
            <a
              href={`tel:${frontDeskPhone.replace(/\s/g, '')}`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '10px',
                padding: '16px 40px', borderRadius: '14px', border: 'none',
                background: 'linear-gradient(135deg, #ec4899, #db2777)',
                color: 'white', fontSize: '16px', fontWeight: 800,
                textDecoration: 'none', boxShadow: '0 8px 32px rgba(236,72,153,0.35)',
              }}
            >
              <Phone size={20} /> Call Now
            </a>
          </div>

          {/* Emergency Contact */}
          <div style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '20px', padding: '24px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <AlertTriangle size={20} color="rgb(239,68,68)" />
              <h3 style={{ color: 'white', fontSize: '16px', fontWeight: 800, margin: 0 }}>Emergency Contact</h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ color: 'rgb(252,165,165)', fontSize: '20px', fontWeight: 900, margin: 0 }}>
                {emergencyPhone}
              </p>
              <a
                href={`tel:${emergencyPhone.replace(/\s/g, '')}`}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  padding: '10px 20px', borderRadius: '12px',
                  background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)',
                  color: 'rgb(252,165,165)', fontSize: '14px', fontWeight: 700, textDecoration: 'none',
                }}
              >
                <Phone size={16} /> Call
              </a>
            </div>
          </div>

          {/* Services list */}
          <div style={{
            background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: '20px', padding: '24px',
          }}>
            <p style={{ color: 'rgb(100,116,139)', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 16px 0' }}>
              We can help with
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {[
                '🔑 Room key replacement',
                '🧳 Luggage assistance',
                '🚕 Taxi & transport',
                '🏥 Medical assistance',
                '📦 Parcel & courier',
                '🗺️ Local information',
                '💳 Payment queries',
                '🍽️ Restaurant booking',
              ].map((item) => (
                <div key={item} style={{
                  background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.12)',
                  borderRadius: '10px', padding: '10px 14px',
                  color: 'rgb(148,163,184)', fontSize: '13px', fontWeight: 500,
                }}>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </DashboardSubpage>
  );
}
