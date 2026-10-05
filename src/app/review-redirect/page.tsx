'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Star, Check, Copy, ExternalLink, Sparkles, MapPin, Hotel, ThumbsUp } from 'lucide-react';
import { Toaster, toast } from 'sonner';

function ReviewRedirectContent() {
  const searchParams = useSearchParams();
  const hotelName = searchParams.get('hotel') || 'Our Hotel';
  const initialText = searchParams.get('text') || 'Had a fantastic stay! Clean rooms, courteous staff, and wonderful hospitality. Highly recommended!';
  const customGoogleUrl = searchParams.get('googleUrl') || '';
  const placeId = searchParams.get('placeId') || '';

  const [reviewText, setReviewText] = useState(initialText);
  const [copied, setCopied] = useState(false);
  const [opened, setOpened] = useState(false);

  // Compute final Google Review URL
  const googleReviewUrl = customGoogleUrl
    ? customGoogleUrl
    : placeId
    ? `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}`
    : `https://www.google.com/search?q=${encodeURIComponent(`${hotelName} reviews`)}`;

  const handleCopyAndOpen = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(reviewText);
        setCopied(true);
        toast.success('Review copied to clipboard! Opening Google...');
      }
    } catch {
      // Fallback copy
      try {
        const textarea = document.createElement('textarea');
        textarea.value = reviewText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setCopied(true);
        toast.success('Review copied to clipboard!');
      } catch {}
    }

    setOpened(true);
    // Open Google review in new tab / app
    setTimeout(() => {
      window.location.href = googleReviewUrl;
    }, 600);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at 50% 10%, #0f172a 0%, #030712 100%)',
      color: '#fff',
      padding: '24px 16px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      boxSizing: 'border-box',
    }}>
      <Toaster richColors position="top-center" />

      <div style={{
        maxWidth: '480px',
        width: '100%',
        background: 'rgba(15, 23, 42, 0.95)',
        border: '1.5px solid rgba(251, 191, 36, 0.3)',
        borderRadius: '24px',
        padding: '24px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.6), 0 0 40px rgba(251, 191, 36, 0.1)',
        backdropFilter: 'blur(20px)',
      }}>
        {/* Top Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '18px',
            background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(245, 158, 11, 0.4)',
            marginBottom: '12px',
          }}>
            <Hotel size={28} color="#fff" />
          </div>

          <h1 style={{ margin: '0 0 6px 0', fontSize: '20px', fontWeight: 900, color: '#fff' }}>
            {hotelName}
          </h1>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginBottom: '8px' }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} size={20} fill="#f59e0b" color="#f59e0b" />
            ))}
          </div>

          <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>
            Thank you for rating us 5 stars! Share your review on Google in 1 tap.
          </p>
        </div>

        {/* Review Preview Box */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.35)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '16px',
          marginBottom: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: '#f59e0b' }}>
              ✨ Your Prepared Review
            </span>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(reviewText);
                setCopied(true);
                toast.success('Copied text!');
              }}
              style={{
                background: 'none', border: 'none', color: copied ? '#10b981' : '#94a3b8',
                fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
              }}
            >
              {copied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}
            </button>
          </div>

          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            rows={4}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              color: '#f8fafc',
              fontSize: '14px',
              lineHeight: 1.6,
              resize: 'none',
              outline: 'none',
              fontFamily: 'inherit',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* 3 Step Instruction Pill */}
        <div style={{
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1px dashed rgba(245, 158, 11, 0.3)',
          borderRadius: '14px',
          padding: '12px 14px',
          marginBottom: '20px',
          fontSize: '12px',
          color: '#cbd5e1',
          lineHeight: 1.5,
        }}>
          <div style={{ fontWeight: 800, color: '#fcd34d', marginBottom: '4px' }}>
            💡 Easy 2-Step Posting:
          </div>
          <div>1. Tap the big button below (we copy the text automatically)</div>
          <div>2. On Google, simply <b>Paste</b> and tap <b>Post</b>!</div>
        </div>

        {/* Big Action Button */}
        <button
          onClick={handleCopyAndOpen}
          style={{
            width: '100%',
            padding: '18px 24px',
            borderRadius: '16px',
            border: 'none',
            background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
            color: '#fff',
            fontSize: '16px',
            fontWeight: 900,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            boxShadow: '0 8px 30px rgba(245, 158, 11, 0.4)',
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
        >
          {copied ? <Check size={20} /> : <Sparkles size={20} />}
          <span>1-Tap Copy &amp; Open Google</span>
          <ExternalLink size={18} />
        </button>

        {opened && (
          <p style={{ textAlign: 'center', fontSize: '11px', color: '#64748b', marginTop: '12px', margin: '12px 0 0' }}>
            Didn't open automatically? <a href={googleReviewUrl} style={{ color: '#f59e0b', textDecoration: 'underline' }}>Click here to open directly</a>
          </p>
        )}
      </div>

      <p style={{ color: '#475569', fontSize: '11px', marginTop: '24px', textAlign: 'center' }}>
        Powered by GuestFlow Hotel Reputation Engine
      </p>
    </div>
  );
}

export default function ReviewRedirectPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#030712', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>Loading...</div>}>
      <ReviewRedirectContent />
    </Suspense>
  );
}
