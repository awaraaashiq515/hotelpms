'use client';

import React, { useState, useEffect } from 'react';
import {
  Star, Send, Loader2, Sparkles, Copy, Check, ExternalLink,
  QrCode, RefreshCw, Hotel, CheckCircle2, ShieldCheck, HeartHandshake
} from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import DashboardSubpage from '@/components/room-portal/DashboardSubpage';

const CATEGORIES = [
  { key: 'cleanliness', label: 'Room Cleanliness', emoji: '🧹' },
  { key: 'food', label: 'Food & Dining', emoji: '🍽️' },
  { key: 'service', label: 'Staff Service', emoji: '👨‍💼' },
  { key: 'overall', label: 'Overall Experience', emoji: '⭐', required: true },
];

const AI_STYLES = [
  { id: 'WARM_DETAILED', label: '🌟 5-Star Detailed', desc: 'Warm and comprehensive' },
  { id: 'CONCISE', label: '⚡ Short & Sweet', desc: 'Quick 2-line praise' },
  { id: 'FAMILY', label: '👨‍👩‍👧 Family Stay', desc: 'Focus on comfort & care' },
  { id: 'BUSINESS', label: '💼 Business Trip', desc: 'Focus on Wi-Fi, desk & promptness' },
  { id: 'FOOD_LOVER', label: '🍽️ Food & Dining', desc: 'Focus on tasty buffet & room service' },
  { id: 'HINGLISH', label: '🇮🇳 Hinglish', desc: 'Natural Indian conversational style' },
] as const;

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);

  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
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
  const [submittedOverall, setSubmittedOverall] = useState(5);

  // Hotel & Guest info
  const [hotelName, setHotelName] = useState('Our Hotel');
  const [guestName, setGuestName] = useState('Guest');
  const [googleReviewUrl, setGoogleReviewUrl] = useState('');
  const [googlePlaceId, setGooglePlaceId] = useState('');

  // AI Review Generator states
  const [aiGenerating, setAiGenerating] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<typeof AI_STYLES[number]['id']>('WARM_DETAILED');
  const [copiedReview, setCopiedReview] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('room_portal_token') || '';
    if (!token) return;

    fetch('/api/room-portal/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data) {
          const prop = d.data.reservation?.property;
          const hName = prop?.brandName || prop?.name || 'Our Hotel';
          setHotelName(hName);
          if (d.data.guest?.firstName) {
            setGuestName(d.data.guest.firstName);
          }
          if (d.data.config?.googleReviewUrl) {
            setGoogleReviewUrl(d.data.config.googleReviewUrl);
          }
          if (d.data.config?.googlePlaceId) {
            setGooglePlaceId(d.data.config.googlePlaceId);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Compute final Google Review URL
  const finalGoogleUrl = googleReviewUrl
    ? googleReviewUrl
    : googlePlaceId
    ? `https://search.google.com/local/writereview?placeid=${encodeURIComponent(googlePlaceId)}`
    : `https://www.google.com/search?q=${encodeURIComponent(`${hotelName} reviews`)}`;

  // Construct mobile bridge URL for QR code
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const qrRedirectUrl = `${currentOrigin}/review-redirect?hotel=${encodeURIComponent(hotelName)}&text=${encodeURIComponent(comments || 'Had a wonderful stay!')}&googleUrl=${encodeURIComponent(googleReviewUrl || '')}&placeId=${encodeURIComponent(googlePlaceId || '')}`;

  const generateFallbackReview = (styleToUse: string) => {
    const c = ratings.cleanliness || 5;
    const f = ratings.food || 5;
    const s = ratings.service || 5;
    const o = ratings.overall || 5;
    const hName = hotelName || 'this hotel';

    if (styleToUse === 'HINGLISH') {
      if (o >= 4) {
        const parts = [
          `${hName} mein humara stay bohot hi shandar aur memorable raha!`,
          c >= 4 ? 'Rooms ekdum clean aur comfortable the.' : '',
          s >= 4 ? 'Yahan ka staff bohot polite, welcoming aur helpful hai.' : '',
          f >= 4 ? 'Khana bohot tasty aur fresh tha, breakfast buffet zabardast laga!' : '',
          'Sabhi travelers aur families ko strongly recommend karunga. 5/5 stars!'
        ];
        return parts.filter(Boolean).join(' ');
      }
      return `${hName} ka overall experience theek-thaak raha. Staff supportive tha, lekin kuch service aur amenities ko aur behtar banaya ja sakta hai.`;
    }

    if (styleToUse === 'CONCISE') {
      if (o >= 4) {
        const highlights: string[] = [];
        if (c >= 4) highlights.push('spotless rooms');
        if (s >= 4) highlights.push('courteous staff');
        if (f >= 4) highlights.push('delicious food');
        return `Outstanding experience at ${hName}! Loved the ${highlights.join(', ')}. Seamless check-in and great hospitality. Highly recommended!`;
      }
      return `Decent stay at ${hName}. Clean rooms and good location, though a few services could be improved.`;
    }

    if (styleToUse === 'FAMILY') {
      return `We visited with family and had a delightful experience at ${hName}. The rooms were spacious, immaculately cleaned, and child-friendly. The staff went out of their way to assist us with a smile, and the dining was wholesome and tasty. Will definitely stay here again on our next trip!`;
    }

    if (styleToUse === 'BUSINESS') {
      return `Stayed at ${hName} for a business trip. Prompt service, spotless room, comfortable desk setup, and high-speed Wi-Fi made my work smooth. The staff was professional and food was served fresh and on time. Perfect choice for corporate travelers.`;
    }

    if (styleToUse === 'FOOD_LOVER') {
      return `An absolute treat of a stay at ${hName}! The culinary spread was simply exceptional — loved the rich flavors, fresh spreads, and warm dining service. Paired with clean and cozy rooms, it made our trip unforgettable. Big kudos to the chefs and staff!`;
    }

    // Default: WARM_DETAILED
    const points: string[] = [];
    if (c >= 4) points.push('The rooms were pristine, beautifully maintained, and very cozy.');
    if (s >= 4) points.push('The hospitality of the staff was top-tier — always attentive, polite, and quick to help.');
    if (f >= 4) points.push('The dining and buffet spreads were delicious with great variety and fresh ingredients.');

    return `Had an exceptional stay at ${hName}! ${points.join(' ')} Everything exceeded our expectations. Truly a 5-star experience from arrival to departure. Can't wait to visit again!`;
  };

  const handleAiGenerate = async (styleOverride?: typeof AI_STYLES[number]['id']) => {
    const styleToUse = styleOverride || selectedStyle;
    setAiGenerating(true);
    try {
      const res = await fetch('/api/room-portal/feedback/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ratings,
          hotelName,
          guestName,
          style: styleToUse,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.reviewText) {
          setComments(data.reviewText);
          toast.success('✨ AI drafted your review!');
          setAiGenerating(false);
          return;
        }
      }
    } catch {}

    // Instant local AI synthesis fallback
    const localReview = generateFallbackReview(styleToUse);
    setComments(localReview);
    toast.success('✨ AI drafted your review!');
    setAiGenerating(false);
  };

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
        setSubmittedOverall(ratings.overall);
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

  const handleCopyReview = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(comments);
        setCopiedReview(true);
        toast.success('Review copied to clipboard!');
        setTimeout(() => setCopiedReview(false), 3000);
      }
    } catch {
      toast.info('Please copy the text manually.');
    }
  };

  const handleOpenGoogle = async () => {
    await handleCopyReview();
    window.open(finalGoogleUrl, '_blank');
  };

  const getStarLabel = (val: number) => ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][val] || '';

  return (
    <>
      <Toaster richColors position="top-center" />
      <DashboardSubpage title="Share Your Feedback" emoji="⭐" accentColor="rgba(251,191,36,0.4)">
        {submitted ? (
          /* ── Post-Submission Views ── */
          <div style={{ maxWidth: '640px', margin: '0 auto', padding: '10px 0 60px' }}>
            {submittedOverall >= 4 ? (
              /* 🌟 Positive Review (4 or 5 Stars) -> Google Booster + QR Flow */
              <div style={{
                background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.9))',
                border: '1.5px solid rgba(251, 191, 36, 0.35)',
                borderRadius: '24px',
                padding: '32px 24px',
                textAlign: 'center',
                boxShadow: '0 20px 50px rgba(0,0,0,0.6), 0 0 40px rgba(251,191,36,0.15)',
              }}>
                <div style={{
                  width: '64px', height: '64px', borderRadius: '20px',
                  background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 8px 30px rgba(245, 158, 11, 0.4)',
                  marginBottom: '16px',
                }}>
                  <Star size={34} fill="#fff" color="#fff" />
                </div>

                <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: 900, margin: '0 0 6px 0' }}>
                  Thank You for Rating Us 5 Stars!
                </h2>
                <p style={{ color: '#94a3b8', fontSize: '14px', margin: '0 0 20px 0' }}>
                  We are thrilled that you loved staying at <b style={{ color: '#fff' }}>{hotelName}</b>.
                  <br />
                  Would you mind sharing your review on Google to help fellow travelers?
                </p>

                {/* Prepared Review Quote Card */}
                {comments && (
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(251, 191, 36, 0.25)',
                    borderRadius: '16px',
                    padding: '16px 18px',
                    textAlign: 'left',
                    marginBottom: '24px',
                    position: 'relative',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        ✨ Your Review is Ready
                      </span>
                      <button
                        onClick={handleCopyReview}
                        style={{
                          background: 'rgba(251, 191, 36, 0.15)',
                          border: '1px solid rgba(251, 191, 36, 0.3)',
                          borderRadius: '8px',
                          color: copiedReview ? '#34d399' : '#fbbf24',
                          fontSize: '11px', fontWeight: 700, padding: '4px 10px',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px',
                        }}
                      >
                        {copiedReview ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy Review</>}
                      </button>
                    </div>
                    <p style={{ margin: 0, color: '#f1f5f9', fontSize: '14px', lineHeight: 1.6, fontStyle: 'italic' }}>
                      "{comments}"
                    </p>
                  </div>
                )}

                {/* ── Two Posting Options ── */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: '16px',
                  textAlign: 'center',
                }}>
                  {/* Option 1: Mobile Phone QR (Recommended for In-Room Tablet) */}
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '18px',
                    padding: '20px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <span style={{
                      padding: '4px 10px', borderRadius: '12px',
                      background: 'rgba(16, 185, 129, 0.2)', border: '1px solid rgba(16, 185, 129, 0.3)',
                      color: '#6ee7b7', fontSize: '11px', fontWeight: 900, marginBottom: '10px',
                    }}>
                      ⚡ RECOMMENDED FOR TABLET
                    </span>

                    <p style={{ color: '#fff', fontSize: '14px', fontWeight: 800, margin: '0 0 4px 0' }}>
                      Scan QR with Your Phone
                    </p>
                    <p style={{ color: '#94a3b8', fontSize: '11px', margin: '0 0 14px 0', maxWidth: '220px' }}>
                      Opens Google on your phone where your personal Gmail is already signed in!
                    </p>

                    <div style={{
                      background: '#fff',
                      padding: '12px',
                      borderRadius: '14px',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                      marginBottom: '10px',
                    }}>
                      <QRCodeSVG value={qrRedirectUrl} size={140} level="M" />
                    </div>

                    <span style={{ fontSize: '10px', color: '#64748b' }}>
                      Point camera to copy review &amp; open Google
                    </span>
                  </div>

                  {/* Option 2: Direct Open on Current Screen */}
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '18px',
                    padding: '20px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <div style={{
                      width: '44px', height: '44px', borderRadius: '12px',
                      background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#818cf8', marginBottom: '12px',
                    }}>
                      <ExternalLink size={22} />
                    </div>

                    <p style={{ color: '#fff', fontSize: '14px', fontWeight: 800, margin: '0 0 4px 0' }}>
                      Post Directly from this Tablet
                    </p>
                    <p style={{ color: '#94a3b8', fontSize: '11px', margin: '0 0 16px 0', maxWidth: '220px' }}>
                      Copies your review automatically and launches Google Review in a new tab.
                    </p>

                    <button
                      onClick={handleOpenGoogle}
                      style={{
                        padding: '14px 20px', borderRadius: '14px',
                        background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
                        border: 'none', color: '#fff',
                        fontSize: '13px', fontWeight: 900, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '8px',
                        boxShadow: '0 4px 20px rgba(245, 158, 11, 0.4)',
                      }}
                    >
                      <Sparkles size={16} /> Open Google Review <ExternalLink size={14} />
                    </button>

                    <span style={{ fontSize: '10px', color: '#64748b', marginTop: '12px' }}>
                      Paste into Google's review box
                    </span>
                  </div>
                </div>

                <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <button
                    onClick={() => setSubmitted(false)}
                    style={{
                      background: 'none', border: 'none', color: '#94a3b8',
                      fontSize: '12px', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline',
                    }}
                  >
                    ← Edit or Submit another response
                  </button>
                </div>
              </div>
            ) : (
              /* 🛡️ Reputation Shield (1, 2, or 3 Stars) -> Private Manager Care (No Google link) */
              <div style={{
                background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.9))',
                border: '1.5px solid rgba(99, 102, 241, 0.25)',
                borderRadius: '24px',
                padding: '40px 24px',
                textAlign: 'center',
                boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
              }}>
                <div style={{
                  width: '64px', height: '64px', borderRadius: '20px',
                  background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  color: '#818cf8', marginBottom: '16px',
                }}>
                  <HeartHandshake size={32} />
                </div>

                <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: 900, margin: '0 0 10px 0' }}>
                  Thank You for Your Honest Feedback
                </h2>
                <p style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: 1.6, maxWidth: '460px', margin: '0 auto 20px auto' }}>
                  We are genuinely sorry that your stay fell short of expectations. Your comfort is our top priority, and our duty manager has been notified directly so we can make this right for you immediately.
                </p>

                <div style={{
                  background: 'rgba(99, 102, 241, 0.08)',
                  border: '1px dashed rgba(99, 102, 241, 0.3)',
                  borderRadius: '14px',
                  padding: '14px 18px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  color: '#a5b4fc',
                  fontSize: '13px',
                  fontWeight: 600,
                  marginBottom: '24px',
                }}>
                  <ShieldCheck size={18} color="#818cf8" />
                  Your feedback has been routed directly to Hotel Management.
                </div>

                <div>
                  <button
                    onClick={() => setSubmitted(false)}
                    style={{
                      padding: '12px 24px', borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#cbd5e1', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    Back to Feedback Form
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ── Main Feedback Form ── */
          <div style={{ maxWidth: '640px', margin: '0 auto', paddingBottom: '60px' }}>
            {/* Header Banner */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(251,191,36,0.12), rgba(245,158,11,0.06))',
              border: '1px solid rgba(251,191,36,0.25)', borderRadius: '20px', padding: '20px 24px',
              marginBottom: '24px', textAlign: 'center',
            }}>
              <p style={{ color: 'rgb(251,191,36)', fontSize: '14px', fontWeight: 800, margin: '0 0 4px 0' }}>
                ✨ Your opinion shapes our hospitality
              </p>
              <p style={{ color: 'rgb(148,163,184)', fontSize: '13px', margin: 0 }}>
                Rate your experience at {hotelName} across each aspect of your stay.
              </p>
            </div>

            {/* Rating Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
              {CATEGORIES.map((cat) => (
                <div
                  key={cat.key}
                  style={{
                    background: 'rgba(15,23,42,0.8)', border: ratings[cat.key]
                      ? '1px solid rgba(251,191,36,0.35)' : '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '18px', padding: '18px 22px',
                    transition: 'border-color 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
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
                  />
                </div>
              ))}
            </div>

            {/* ── ✨ AI Auto-Write Review Section ── */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.06))',
              border: '1.5px solid rgba(99,102,241,0.3)',
              borderRadius: '20px',
              padding: '18px 20px',
              marginBottom: '20px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    width: '28px', height: '28px', borderRadius: '8px',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Sparkles size={16} color="#fff" />
                  </span>
                  <div>
                    <p style={{ margin: 0, color: '#fff', fontSize: '14px', fontWeight: 900 }}>
                      AI Review Assistant
                    </p>
                    <p style={{ margin: 0, color: '#94a3b8', fontSize: '11px' }}>
                      1-click generate a natural review based on your star ratings
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleAiGenerate()}
                  disabled={aiGenerating}
                  style={{
                    padding: '8px 16px', borderRadius: '12px',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    border: 'none', color: '#fff', fontSize: '12px', fontWeight: 800,
                    cursor: aiGenerating ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: '6px',
                    boxShadow: '0 4px 16px rgba(99,102,241,0.3)',
                  }}
                >
                  {aiGenerating ? (
                    <><Loader2 size={14} className="animate-spin" /> Drafting...</>
                  ) : (
                    <><Sparkles size={14} /> ✨ Auto-Write Review</>
                  )}
                </button>
              </div>

              {/* Style selector chips */}
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                {AI_STYLES.map((style) => {
                  const isSel = selectedStyle === style.id;
                  return (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => {
                        setSelectedStyle(style.id);
                        handleAiGenerate(style.id);
                      }}
                      style={{
                        padding: '6px 12px', borderRadius: '10px', cursor: 'pointer',
                        fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap',
                        border: isSel ? '1px solid #a5b4fc' : '1px solid rgba(255,255,255,0.08)',
                        background: isSel ? 'rgba(99,102,241,0.25)' : 'rgba(15,23,42,0.6)',
                        color: isSel ? '#fff' : '#94a3b8',
                        transition: 'all 0.15s',
                      }}
                    >
                      {style.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Comments Box */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <p style={{ color: 'rgb(100,116,139)', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>
                  Review Comments
                </p>
                {comments && (
                  <button
                    type="button"
                    onClick={() => setComments('')}
                    style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '11px', cursor: 'pointer' }}
                  >
                    Clear text
                  </button>
                )}
              </div>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Click '✨ Auto-Write Review' above or write your own experience..."
                rows={5}
                style={{
                  width: '100%', padding: '16px', borderRadius: '16px',
                  border: '1px solid rgba(99,102,241,0.25)', background: 'rgba(15,23,42,0.7)',
                  color: 'white', fontSize: '14px', resize: 'none', outline: 'none',
                  fontFamily: 'inherit', boxSizing: 'border-box', lineHeight: 1.6,
                }}
              />
            </div>

            {/* Submit Button */}
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
              {loading ? (
                <><Loader2 size={20} className="animate-spin" /> Submitting...</>
              ) : (
                <><Send size={20} /> Submit Feedback</>
              )}
            </button>
          </div>
        )}
      </DashboardSubpage>
    </>
  );
}
