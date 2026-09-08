'use client';

import { useState } from 'react';
import { Star, Send, Loader2 } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import DashboardSubpage from '@/components/room-portal/DashboardSubpage';

const CATEGORIES = [
  { key: 'cleanliness', label: 'Room Cleanliness', emoji: '🧹' },
  { key: 'food', label: 'Food & Dining', emoji: '🍽️' },
  { key: 'service', label: 'Staff Service', emoji: '👨‍💼' },
  { key: 'overall', label: 'Overall Experience', emoji: '⭐', required: true },
];

function StarRating({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  const [hovered, setHovered] = useState(0);

  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
            transform: (hovered || value) >= star ? 'scale(1.15)' : 'scale(1)',
            transition: 'transform 0.1s',
          }}
        >
          <Star
            size={36}
            fill={(hovered || value) >= star ? 'rgb(251,191,36)' : 'none'}
            color={(hovered || value) >= star ? 'rgb(251,191,36)' : 'rgb(71,85,105)'}
          />
        </button>
      ))}
    </div>
  );
}

export default function FeedbackPage() {
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!ratings.overall) {
      toast.error('Please provide an overall rating.');
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('room_portal_token') || '';
      const res = await fetch('/api/room-portal/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          cleanliness: ratings.cleanliness,
          food: ratings.food,
          service: ratings.service,
          overall: ratings.overall,
          comments,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
      } else {
        toast.error(data.message || 'Failed to submit feedback.');
      }
    } catch {
      toast.error('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStarLabel = (val: number) => ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][val] || '';

  return (
    <>
      <Toaster richColors position="top-center" />
      <DashboardSubpage title="Share Your Feedback" emoji="⭐" accentColor="rgba(251,191,36,0.4)">
        {submitted ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '80px', marginBottom: '20px' }}>🙏</div>
            <h2 style={{ color: 'white', fontSize: '28px', fontWeight: 900, marginBottom: '12px' }}>Thank You!</h2>
            <p style={{ color: 'rgb(100,116,139)', fontSize: '16px', marginBottom: '8px' }}>
              Your feedback means a lot to us.
            </p>
            <p style={{ color: 'rgb(100,116,139)', fontSize: '14px' }}>
              We're constantly working to make your stay better.
            </p>
          </div>
        ) : (
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(251,191,36,0.12), rgba(245,158,11,0.06))',
              border: '1px solid rgba(251,191,36,0.25)', borderRadius: '20px', padding: '24px',
              marginBottom: '24px', textAlign: 'center',
            }}>
              <p style={{ color: 'rgb(251,191,36)', fontSize: '14px', fontWeight: 700, margin: '0 0 6px 0' }}>
                ✨ Your opinion matters
              </p>
              <p style={{ color: 'rgb(148,163,184)', fontSize: '14px', margin: 0 }}>
                Rate your experience across different aspects of your stay
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              {CATEGORIES.map((cat) => (
                <div
                  key={cat.key}
                  style={{
                    background: 'rgba(15,23,42,0.8)', border: ratings[cat.key]
                      ? '1px solid rgba(251,191,36,0.35)' : '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '18px', padding: '20px 24px',
                    transition: 'border-color 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '22px' }}>{cat.emoji}</span>
                      <p style={{ color: 'white', fontWeight: 800, fontSize: '15px', margin: 0 }}>
                        {cat.label}
                        {cat.required && <span style={{ color: 'rgb(239,68,68)', marginLeft: '4px' }}>*</span>}
                      </p>
                    </div>
                    {ratings[cat.key] > 0 && (
                      <span style={{
                        color: 'rgb(251,191,36)', fontSize: '12px', fontWeight: 700,
                        background: 'rgba(251,191,36,0.12)', padding: '4px 10px', borderRadius: '8px',
                      }}>
                        {getStarLabel(ratings[cat.key])}
                      </span>
                    )}
                  </div>
                  <StarRating
                    value={ratings[cat.key] || 0}
                    onChange={(v) => setRatings((prev) => ({ ...prev, [cat.key]: v }))}
                    label={cat.label}
                  />
                </div>
              ))}
            </div>

            {/* Comments */}
            <div style={{ marginBottom: '24px' }}>
              <p style={{ color: 'rgb(100,116,139)', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '10px' }}>
                Additional Comments (Optional)
              </p>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Tell us about your experience, suggestions, or anything else..."
                rows={4}
                style={{
                  width: '100%', padding: '16px', borderRadius: '14px',
                  border: '1px solid rgba(99,102,241,0.2)', background: 'rgba(15,23,42,0.7)',
                  color: 'white', fontSize: '15px', resize: 'none', outline: 'none',
                  fontFamily: 'inherit', boxSizing: 'border-box', lineHeight: 1.6,
                }}
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                width: '100%', padding: '18px', borderRadius: '16px', border: 'none',
                background: loading ? 'rgba(251,191,36,0.4)' : 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: 'white', fontSize: '16px', fontWeight: 800,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                boxShadow: '0 8px 32px rgba(251,191,36,0.25)',
              }}
            >
              {loading ? <><Loader2 size={20} className="animate-spin" /> Submitting...</> : <><Send size={20} /> Submit Feedback</>}
            </button>
          </div>
        )}
      </DashboardSubpage>
    </>
  );
}
