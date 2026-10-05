  'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  UtensilsCrossed, Sparkles, Wifi, Dumbbell,
  FileText, Phone, Star, LogOut, Loader2,
  Hotel, LogIn, RefreshCw,
  Bell, Lock, PhoneCall, Clock, MapPin, ChefHat, CheckCircle2,
  Sun, Moon, Sunset, Coffee, ArrowRight,
} from 'lucide-react';
import { Toaster, toast } from 'sonner';
import KioskWrapper from '@/components/room-portal/KioskWrapper';
import { RoomPortalData, RoomPortalConfig } from '@/components/room-portal/types';
import { DEFAULT_DAILY_MEAL_SPREADS, DailyMealSpread } from '@/lib/daily-menus';

interface ServiceCard {
  id: string;
  icon: React.ElementType;
  label: string;
  sublabel: string;
  href: string;
  gradient: string;
  glow: string;
  emoji: string;
  showKey: keyof RoomPortalConfig | null;
}

const SERVICE_CARDS: ServiceCard[] = [
  {
    id: 'room-service',
    icon: UtensilsCrossed,
    label: 'Room Service',
    sublabel: 'Food & in-room dining',
    href: '/room-portal/dashboard/room-service',
    gradient: 'linear-gradient(135deg, rgba(251,146,60,0.2) 0%, rgba(239,68,68,0.1) 100%)',
    glow: 'rgba(251,146,60,0.4)',
    emoji: '🍽️',
    showKey: 'showRoomService',
  },
  {
    id: 'daily-menu',
    icon: ChefHat,
    label: "Today's Menu",
    sublabel: 'Buffet & daily spreads',
    href: '/room-portal/dashboard/daily-menu',
    gradient: 'linear-gradient(135deg, rgba(245,158,11,0.2) 0%, rgba(234,88,12,0.1) 100%)',
    glow: 'rgba(245,158,11,0.4)',
    emoji: '👨‍🍳',
    showKey: null,
  },
  {
    id: 'housekeeping',
    icon: Sparkles,
    label: 'Housekeeping',
    sublabel: 'Cleaning & laundry',
    href: '/room-portal/dashboard/housekeeping',
    gradient: 'linear-gradient(135deg, rgba(34,211,238,0.2) 0%, rgba(59,130,246,0.1) 100%)',
    glow: 'rgba(34,211,238,0.4)',
    emoji: '🧹',
    showKey: 'showHousekeeping',
  },
  {
    id: 'wifi',
    icon: Wifi,
    label: 'Wi-Fi Info',
    sublabel: 'Password & details',
    href: '/room-portal/dashboard/wifi',
    gradient: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(139,92,246,0.1) 100%)',
    glow: 'rgba(99,102,241,0.4)',
    emoji: '📶',
    showKey: 'showWifi',
  },
  {
    id: 'amenities',
    icon: Dumbbell,
    label: 'Amenities',
    sublabel: 'Gym, pool & spa',
    href: '/room-portal/dashboard/amenities',
    gradient: 'linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(5,150,105,0.1) 100%)',
    glow: 'rgba(16,185,129,0.4)',
    emoji: '🏊',
    showKey: 'showAmenities',
  },
  {
    id: 'bill',
    icon: FileText,
    label: 'My Bill',
    sublabel: 'View charges',
    href: '/room-portal/dashboard/bill',
    gradient: 'linear-gradient(135deg, rgba(251,191,36,0.2) 0%, rgba(245,158,11,0.1) 100%)',
    glow: 'rgba(251,191,36,0.4)',
    emoji: '📄',
    showKey: 'showBill',
  },
  {
    id: 'contact',
    icon: Phone,
    label: 'Front Desk',
    sublabel: 'Call reception',
    href: '/room-portal/dashboard/contact',
    gradient: 'linear-gradient(135deg, rgba(236,72,153,0.2) 0%, rgba(219,39,119,0.1) 100%)',
    glow: 'rgba(236,72,153,0.4)',
    emoji: '☎️',
    showKey: 'showContact',
  },
  {
    id: 'feedback',
    icon: Star,
    label: 'Feedback',
    sublabel: 'Rate your stay',
    href: '/room-portal/dashboard/feedback',
    gradient: 'linear-gradient(135deg, rgba(167,139,250,0.2) 0%, rgba(139,92,246,0.1) 100%)',
    glow: 'rgba(167,139,250,0.4)',
    emoji: '⭐',
    showKey: 'showFeedback',
  },
  {
    id: 'checkout',
    icon: LogOut,
    label: 'Check-out',
    sublabel: 'Request checkout',
    href: '/room-portal/dashboard/checkout',
    gradient: 'linear-gradient(135deg, rgba(239,68,68,0.2) 0%, rgba(220,38,38,0.1) 100%)',
    glow: 'rgba(239,68,68,0.4)',
    emoji: '🚪',
    showKey: 'showCheckout',
  },
];

export default function RoomPortalDashboard() {
  const router = useRouter();
  const [data, setData] = useState<RoomPortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [time, setTime] = useState(new Date());
  const [token, setToken] = useState('');

  // Live clock
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = useCallback(() => {
    const t = localStorage.getItem('room_portal_token') || '';
    if (!t) { router.replace('/room-portal'); return; }
    setToken(t);
    fetch(`/api/room-portal/me?_t=${Date.now()}`, {
      headers: { Authorization: `Bearer ${t}`, 'Cache-Control': 'no-cache' },
      cache: 'no-store',
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setData(d.data);
          setError('');
        } else {
          setError(d.message || 'Session expired.');
          localStorage.removeItem('room_portal_token');
          setTimeout(() => router.replace('/room-portal'), 2000);
        }
      })
      .catch(() => setError('Connection error.'))
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    fetchData();

    // 1. Instant cross-tab sync via BroadcastChannel
    let channel: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      channel = new BroadcastChannel('room_portal_sync');
      channel.onmessage = (event) => {
        const payload = event.data;
        if (payload?.type === 'LOCK_TOGGLED') {
          // Instantly update lock state in memory
          setData((prev: any) => {
            if (!prev) return prev;
            return { ...prev, kioskLocked: Boolean(payload.kioskLocked) };
          });
          // Also fetch full fresh data immediately
          fetchData();
        }
      };
    }

    // 2. Storage event listener fallback (same browser cross-tab)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'room_portal_sync_event' && e.newValue) {
        try {
          const payload = JSON.parse(e.newValue);
          if (payload?.type === 'LOCK_TOGGLED') {
            setData((prev: any) => {
              if (!prev) return prev;
              return { ...prev, kioskLocked: Boolean(payload.kioskLocked) };
            });
            fetchData();
          }
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);

    // 3. Fallback background poll (every 1 second for instant sync)
    const interval = setInterval(() => {
      const t = localStorage.getItem('room_portal_token') || '';
      if (!t) return;
      fetch(`/api/room-portal/me?_t=${Date.now()}`, {
        headers: { Authorization: `Bearer ${t}`, 'Cache-Control': 'no-cache' },
        cache: 'no-store',
      })
        .then((r) => r.json())
        .then((d) => {
          if (d.success && d.data) {
            setData((prev: any) => prev ? {
              ...prev,
              kioskLocked: d.data.kioskLocked,
              config: d.data.config,
            } : d.data);
          }
        })
        .catch(() => {});
    }, 1000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorage);
      if (channel) channel.close();
    };
  }, [fetchData]);

  const handleLogout = async () => {
    const t = localStorage.getItem('room_portal_token');
    if (t) {
      await fetch('/api/room-portal/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}` },
      }).catch(() => {});
    }
    localStorage.removeItem('room_portal_token');
    router.replace('/room-portal');
  };

  const timeStr = time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  const dateStr = time.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  const visibleCards = data?.config
    ? SERVICE_CARDS.filter((card) => {
        if (!card.showKey) return true;
        return (data.config as RoomPortalConfig)[card.showKey as keyof RoomPortalConfig] !== false;
      })
    : SERVICE_CARDS;

  const sessionTimeoutMin = data?.config?.sessionTimeoutMin ?? 30;
  const kioskExitPin = '1234'; // Will come from config in production

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: '#030712',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px',
      }}>
        <Loader2 size={40} color="rgb(99,102,241)" className="animate-spin" />
        <p style={{ color: 'rgb(100,116,139)', fontSize: '14px', fontWeight: 600 }}>Loading your room portal...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{
        minHeight: '100vh', background: '#030712',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
      }}>
        <div style={{
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: '24px', padding: '40px', textAlign: 'center', maxWidth: '360px',
        }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚠️</div>
          <p style={{ color: 'rgb(252,165,165)', fontWeight: 700, marginBottom: '16px' }}>{error || 'Session expired'}</p>
          <button
            onClick={() => router.replace('/room-portal')}
            style={{
              padding: '12px 28px', borderRadius: '12px', border: 'none',
              background: 'rgba(99,102,241,0.8)', color: 'white', fontWeight: 700, cursor: 'pointer',
            }}
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  const { guest, room, reservation } = data;
  const propertyName = reservation.property.brandName || reservation.property.name;
  const nights = Math.ceil(
    (new Date(reservation.departureDate).getTime() - new Date(reservation.arrivalDate).getTime()) / (1000 * 60 * 60 * 24)
  );
  const checkoutDate = new Date(reservation.departureDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  // ── Offer Resolution (Guest Booking Offer has 1st priority, then Hotel-Wide Promo) ──
  const guestSpecialOffer = reservation.specialOffer;
  const guestOfferCode = reservation.offerCode;
  const hotelPromoTitle = data.config?.showPromotionalOffer !== false ? data.config?.promotionalOfferTitle : null;
  const hotelPromoDesc = data.config?.showPromotionalOffer !== false ? data.config?.promotionalOfferDesc : null;
  const hotelPromoCode = data.config?.showPromotionalOffer !== false ? data.config?.promotionalOfferCode : null;

  const activeOfferTitle = guestSpecialOffer || hotelPromoTitle;
  const activeOfferDesc = guestSpecialOffer ? '' : (hotelPromoDesc || '');
  const activeOfferCode = guestOfferCode || hotelPromoCode;
  const isGuestSpecific = Boolean(guestSpecialOffer);

  return (
    <>
      <Toaster richColors position="top-center" />
      <KioskWrapper sessionTimeoutMin={sessionTimeoutMin} exitPin={kioskExitPin} kioskLocked={Boolean(data?.kioskLocked)}>

        <div style={{ minHeight: '100vh', background: '#030712', display: 'flex', flexDirection: 'column' }}>

          {/* Ambient background */}
          <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
            <div style={{ position: 'absolute', top: '-20%', left: '10%', width: '700px', height: '700px', background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 65%)', borderRadius: '50%' }} />
            <div style={{ position: 'absolute', bottom: '10%', right: '5%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 65%)', borderRadius: '50%' }} />
          </div>

          {/* Header */}
          <header style={{
            position: 'relative', zIndex: 10,
            background: 'rgba(5,10,20,0.85)', backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(99,102,241,0.15)',
            padding: '0 28px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '72px', maxWidth: '1100px', margin: '0 auto' }}>
              {/* Hotel info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  data-kiosk-logo
                  style={{
                    width: '44px', height: '44px', borderRadius: '14px',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 16px rgba(99,102,241,0.3)',
                    cursor: 'pointer', flexShrink: 0,
                    userSelect: 'none',
                  }}
                  title="Hold for 5 seconds to access admin exit"
                >
                  <Hotel size={22} color="white" />
                </div>
                <div>
                  <p style={{ color: 'rgb(99,102,241)', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', margin: 0 }}>
                    {propertyName}
                  </p>
                  <p style={{ color: 'white', fontSize: '14px', fontWeight: 900, margin: 0 }}>
                    Room {room.roomNumber}
                    {room.floor && <span style={{ color: 'rgb(100,116,139)', fontWeight: 500, fontSize: '13px' }}> · Floor {room.floor}</span>}
                  </p>
                </div>
              </div>

              {/* Center: Clock */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: 'white', fontSize: '20px', fontWeight: 900, letterSpacing: '-0.5px' }}>{timeStr}</div>
                <div style={{ color: 'rgb(100,116,139)', fontSize: '11px' }}>{dateStr}</div>
              </div>

              {/* Right: Guest info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ color: 'rgb(148,163,184)', fontSize: '11px', margin: 0 }}>Welcome</p>
                  <p style={{ color: 'white', fontSize: '14px', fontWeight: 800, margin: 0 }}>
                    {guest.firstName} {guest.lastName || ''}
                  </p>
                </div>
                <div style={{
                  display: 'flex', gap: '8px',
                }}>
                  <button
                    onClick={fetchData}
                    title="Refresh"
                    style={{
                      width: '40px', height: '40px', borderRadius: '12px',
                      background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                      color: 'rgb(99,102,241)',
                    }}
                  >
                    <RefreshCw size={16} />
                  </button>
                  <button
                    onClick={handleLogout}
                    title="Sign Out"
                    style={{
                      width: '40px', height: '40px', borderRadius: '12px',
                      background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                      color: 'rgb(239,68,68)',
                    }}
                  >
                    <LogIn size={16} style={{ transform: 'rotate(180deg)' }} />
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main style={{ flex: 1, position: 'relative', zIndex: 1, padding: '28px', maxWidth: '1100px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>

            {/* Welcome banner */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.08) 100%)',
              border: '1px solid rgba(99,102,241,0.25)',
              borderRadius: '20px',
              padding: '20px 24px',
              marginBottom: activeOfferTitle ? '16px' : '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}>
              <div>
                <p style={{ color: 'rgb(99,102,241)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 4px 0' }}>
                  ✨ {data.config?.welcomeTitle || 'Welcome to Your Stay'}
                </p>
                <h2 style={{ color: 'white', fontSize: '22px', fontWeight: 900, margin: 0 }}>
                  Good {time.getHours() < 12 ? 'Morning' : time.getHours() < 17 ? 'Afternoon' : 'Evening'}, {guest.firstName}! 👋
                </h2>
                <p style={{ color: 'rgb(100,116,139)', fontSize: '13px', margin: '4px 0 0 0' }}>
                  {data.config?.welcomeSubtitle || 'How can we make your stay more comfortable?'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                <InfoBadge icon="🏨" label="Check-out" value={checkoutDate} />
                <InfoBadge icon="🌙" label="Nights" value={`${nights} nights`} />
                <InfoBadge
                  icon="🍽️"
                  label="Meal Plan"
                  value={
                    (reservation.mealPlan || 'EP').toUpperCase() === 'CP'
                      ? 'CP (Breakfast Inc.)'
                      : (reservation.mealPlan || 'EP').toUpperCase() === 'MAP'
                      ? 'MAP (Bfast + Dinner)'
                      : (reservation.mealPlan || 'EP').toUpperCase() === 'AP'
                      ? 'AP (All Meals Inc.)'
                      : 'EP (Room Only)'
                  }
                />
                {activeOfferTitle && (
                  <div
                    onClick={() => {
                      if (activeOfferCode) {
                        navigator.clipboard?.writeText(activeOfferCode);
                        toast.success(`Promo Code "${activeOfferCode}" copied! 🎉`);
                      }
                    }}
                    style={{
                      background: 'linear-gradient(135deg, rgba(245,158,11,0.25), rgba(234,88,12,0.18))',
                      border: '1px solid rgba(245,158,11,0.5)',
                      borderRadius: '12px',
                      padding: '8px 14px',
                      cursor: activeOfferCode ? 'pointer' : 'default',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 14px rgba(245,158,11,0.2)',
                    }}
                    title={activeOfferCode ? 'Click to copy promo code' : undefined}
                  >
                    <span style={{ fontSize: '18px' }}>🎁</span>
                    <div>
                      <span style={{ display: 'block', fontSize: '9px', color: '#fcd34d', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                        {isGuestSpecific ? 'Guest Deal' : 'Hot Offer'}
                      </span>
                      <span style={{ display: 'block', fontSize: '12px', color: '#fff', fontWeight: 800 }}>
                        {activeOfferCode ? `CODE: ${activeOfferCode}` : 'VIP Deal'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ━━━ 🎁 Luxury Featured Offer Showcase Banner ━━━ */}
            {activeOfferTitle && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.18) 0%, rgba(234, 88, 12, 0.12) 40%, rgba(99, 102, 241, 0.08) 100%)',
                border: '1.5px solid rgba(245, 158, 11, 0.45)',
                borderRadius: '20px',
                padding: '18px 24px',
                marginBottom: '26px',
                boxShadow: '0 10px 32px rgba(245, 158, 11, 0.18)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
                position: 'relative',
                overflow: 'hidden',
              }}>
                {/* Decorative glow background element */}
                <div style={{
                  position: 'absolute', top: '-50px', right: '-50px', width: '160px', height: '160px',
                  background: 'radial-gradient(circle, rgba(245, 158, 11, 0.3) 0%, transparent 70%)',
                  borderRadius: '50%', pointerEvents: 'none',
                }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: '1 1 320px', zIndex: 1 }}>
                  <div style={{
                    width: '54px', height: '54px', borderRadius: '16px',
                    background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 6px 20px rgba(245, 158, 11, 0.4)',
                    flexShrink: 0, fontSize: '26px',
                  }}>
                    🎁
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{
                        padding: '3px 8px', borderRadius: '6px',
                        background: 'rgba(245, 158, 11, 0.25)', border: '1px solid rgba(245, 158, 11, 0.4)',
                        color: '#fde68a', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px',
                      }}>
                        {isGuestSpecific ? `EXCLUSIVE GUEST DEAL · ROOM ${room.roomNumber}` : 'TODAY’S HOTEL SPECIAL'}
                      </span>
                      {activeOfferCode && (
                        <span style={{
                          padding: '3px 8px', borderRadius: '6px',
                          background: 'rgba(15, 23, 42, 0.85)', border: '1px solid rgba(245, 158, 11, 0.35)',
                          color: '#fbbf24', fontSize: '11px', fontFamily: 'monospace', fontWeight: 800,
                        }}>
                          PROMO: {activeOfferCode}
                        </span>
                      )}
                    </div>

                    <h3 style={{ color: 'white', fontSize: '17px', fontWeight: 900, margin: '0 0 2px 0', lineHeight: 1.3 }}>
                      {activeOfferTitle}
                    </h3>
                    {activeOfferDesc && (
                      <p style={{ color: '#cbd5e1', fontSize: '12px', margin: 0, lineHeight: 1.4 }}>
                        {activeOfferDesc}
                      </p>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', zIndex: 1 }}>
                  {activeOfferCode && (
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(activeOfferCode);
                        toast.success(`Promo Code "${activeOfferCode}" copied to clipboard! 📋`);
                      }}
                      style={{
                        padding: '10px 16px', borderRadius: '12px',
                        background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.2)',
                        color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '6px',
                      }}
                    >
                      📋 Copy Code
                    </button>
                  )}

                  <button
                    onClick={() => {
                      const lower = (activeOfferTitle + ' ' + (activeOfferDesc || '')).toLowerCase();
                      if (lower.includes('spa') || lower.includes('massage')) {
                        router.push('/room-portal/dashboard/amenities');
                      } else if (lower.includes('food') || lower.includes('dining') || lower.includes('cocktail') || lower.includes('drink') || lower.includes('room service')) {
                        router.push('/room-portal/dashboard/room-service');
                      } else {
                        router.push('/room-portal/dashboard/contact');
                      }
                    }}
                    style={{
                      padding: '10px 20px', borderRadius: '12px', border: 'none',
                      background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
                      color: 'white', fontSize: '13px', fontWeight: 800, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '6px',
                      boxShadow: '0 4px 16px rgba(245, 158, 11, 0.35)',
                    }}
                  >
                    <span>Claim Offer</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            )}

            {/* ━━━ 🛎️ Our Services — Main Action Center ━━━ */}
            <div style={{ marginBottom: '28px' }}>
              <p style={{ color: 'rgb(100,116,139)', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 16px 0' }}>
                🛎️ Our Services — Tap to access
              </p>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '16px',
              }}>
                {visibleCards.map((card) => (
                  <ServiceCardButton key={card.id} card={card} router={router} />
                ))}
              </div>
            </div>



            {/* Quick notification banner if checkout requested */}
            {reservation.checkoutRequested && (
              <div style={{
                background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
                borderRadius: '14px', padding: '14px 20px',
                display: 'flex', alignItems: 'center', gap: '12px', marginTop: '16px',
              }}>
                <Bell size={18} color="rgb(34,197,94)" />
                <p style={{ color: 'rgb(134,239,172)', fontSize: '13px', fontWeight: 600, margin: 0 }}>
                  ✓ Checkout request submitted — our team will be with you shortly!
                </p>
              </div>
            )}
          </main>

          {/* Footer hint */}
          <div style={{
            position: 'relative', zIndex: 1,
            padding: '12px 28px',
            borderTop: '1px solid rgba(255,255,255,0.04)',
            textAlign: 'center',
          }}>
            <p style={{ color: 'rgb(51,65,85)', fontSize: '11px', margin: 0 }}>
              Hold the hotel logo for 5 seconds to access admin exit • Powered by{' '}
              <span style={{ color: 'rgb(99,102,241)' }}>GuestFlow HMS</span>
            </p>
          </div>
        </div>
      </KioskWrapper>
    </>
  );
}

function InfoBadge({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div style={{
      background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(99,102,241,0.2)',
      borderRadius: '12px', padding: '10px 14px', minWidth: '90px',
    }}>
      <p style={{ color: 'rgb(100,116,139)', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 2px 0', letterSpacing: '1px' }}>
        {icon} {label}
      </p>
      <p style={{ color: 'white', fontSize: '14px', fontWeight: 800, margin: 0 }}>{value}</p>
    </div>
  );
}

function ServiceCardButton({ card, router }: { card: ServiceCard; router: ReturnType<typeof useRouter> }) {
  const [pressed, setPressed] = useState(false);

  return (
    <button
      id={`service-card-${card.id}`}
      onClick={() => router.push(card.href)}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      style={{
        background: pressed ? card.gradient.replace('0.2', '0.35').replace('0.1', '0.2') : card.gradient,
        border: `1px solid ${card.glow.replace('0.4', '0.35')}`,
        borderRadius: '20px',
        padding: '24px 20px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
        transition: 'transform 0.1s, box-shadow 0.2s',
        transform: pressed ? 'scale(0.96)' : 'scale(1)',
        boxShadow: pressed
          ? `0 0 0 2px ${card.glow}, 0 8px 32px ${card.glow.replace('0.4', '0.2')}`
          : `0 0 0 0 transparent, 0 4px 16px ${card.glow.replace('0.4', '0.1')}`,
        minHeight: '140px',
      }}
    >
      <div style={{
        width: '56px', height: '56px', borderRadius: '18px',
        background: `${card.glow.replace('0.4', '0.15')}`,
        border: `1px solid ${card.glow.replace('0.4', '0.4')}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '28px',
        boxShadow: `0 0 20px ${card.glow.replace('0.4', '0.2')}`,
      }}>
        {card.emoji}
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: 'white', fontSize: '15px', fontWeight: 800, margin: '0 0 3px 0' }}>{card.label}</p>
        <p style={{ color: 'rgb(148,163,184)', fontSize: '11px', fontWeight: 500, margin: 0 }}>{card.sublabel}</p>
      </div>
    </button>
  );
}
