'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Hotel, LogOut, CalendarDays, BedDouble, Loader2,
  Sparkles, Phone, Mail, ReceiptText, UtensilsCrossed, Bell, Music, Car,
  MoreHorizontal, X, QrCode, ShieldCheck, Heart, User
} from 'lucide-react';
import { Toaster } from 'sonner';

import { GuestData, Reservation } from '@/components/guest-portal/types';
import BookingCard from '@/components/guest-portal/BookingCard';
import SecurityPassModal from '@/components/guest-portal/SecurityPassModal';
import BillingTab from '@/components/guest-portal/BillingTab';
import MenuTab from '@/components/guest-portal/MenuTab';
import RequestsTab from '@/components/guest-portal/RequestsTab';
import SingersTab from '@/components/guest-portal/SingersTab';
import TransportTab from '@/components/guest-portal/TransportTab';
import SpaTab from '@/components/guest-portal/SpaTab';
import ProfileTab from '@/components/guest-portal/ProfileTab';

type TabType = 'bookings' | 'menu' | 'requests' | 'billing' | 'singers' | 'transport' | 'spa' | 'profile';

const ALL_MENU_ITEMS = [
  { id: 'bookings' as TabType,  label: 'Stats',   icon: CalendarDays,    glow: 'rgba(99,102,241,0.7)',  bg: 'rgba(99,102,241,0.2)',  border: 'rgba(99,102,241,0.4)' },
  { id: 'billing' as TabType,   label: 'Bill',    icon: ReceiptText,     glow: 'rgba(99,102,241,0.7)',  bg: 'rgba(99,102,241,0.2)',  border: 'rgba(99,102,241,0.4)' },
  { id: 'menu' as TabType,      label: 'Food',    icon: UtensilsCrossed, glow: 'rgba(251,146,60,0.7)',  bg: 'rgba(251,146,60,0.15)', border: 'rgba(251,146,60,0.4)' },
  { id: 'transport' as TabType, label: 'Cabs',    icon: Car,             glow: 'rgba(34,211,238,0.7)',  bg: 'rgba(34,211,238,0.15)', border: 'rgba(34,211,238,0.4)' },
  { id: 'requests' as TabType,  label: 'Desk',    icon: Bell,            glow: 'rgba(251,191,36,0.7)',  bg: 'rgba(251,191,36,0.15)', border: 'rgba(251,191,36,0.4)' },
  { id: 'singers' as TabType,   label: 'Music',   icon: Music,           glow: 'rgba(167,139,250,0.7)', bg: 'rgba(167,139,250,0.15)',border: 'rgba(167,139,250,0.4)' },
  { id: 'spa' as TabType,       label: 'Spa',     icon: Sparkles,        glow: 'rgba(236,72,153,0.7)',  bg: 'rgba(236,72,153,0.15)', border: 'rgba(236,72,153,0.4)' },
  { id: 'profile' as TabType,   label: 'Profile', icon: User,            glow: 'rgba(16,185,129,0.7)',  bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.4)' },
];

const MAIN_NAV = ALL_MENU_ITEMS.slice(0, 4);
const MORE_ITEMS = ALL_MENU_ITEMS.slice(4);

function NavButton({ item, activeTab, onClick }: { item: typeof ALL_MENU_ITEMS[0]; activeTab: TabType; onClick: () => void }) {
  const isActive = activeTab === item.id;
  return (
    <button
      onClick={onClick}
      className="relative flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl transition-all duration-300 min-w-[48px]"
      style={isActive ? {
        background: `linear-gradient(135deg, ${item.bg} 0%, rgba(0,0,0,0) 100%)`,
        boxShadow: `0 0 18px ${item.glow.replace('0.7', '0.25')}`,
        border: `1px solid ${item.border}`,
      } : {}}
    >
      <item.icon
        size={20}
        className="relative z-10 transition-all duration-300"
        style={{
          color: isActive ? 'white' : 'rgb(100,116,139)',
          filter: isActive ? `drop-shadow(0 0 7px ${item.glow})` : 'none',
        }}
      />
      <span
        className="relative z-10 text-[7px] font-black uppercase tracking-widest transition-all duration-300"
        style={{ color: isActive ? 'white' : 'rgb(71,85,105)' }}
      >
        {item.label}
      </span>
      {isActive && (
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full"
          style={{ background: 'white', boxShadow: `0 0 8px ${item.glow}` }}
        />
      )}
    </button>
  );
}

export default function GuestPortalDashboard() {
  const router = useRouter();
  const [guest, setGuest] = useState<GuestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string>('');
  const [activeTab, setActiveTab] = useState<TabType>('bookings');
  const [showMore, setShowMore] = useState(false);
  const [selectedSecurityReservation, setSelectedSecurityReservation] = useState<Reservation | null>(null);
  const [tippingEnabled, setTippingEnabled] = useState(false);

  const fetchGuestData = () => {
    const t = localStorage.getItem('guest_token') || '';
    if (!t) { router.replace('/guest-portal'); return; }
    setToken(t);
    fetch('/api/guest-portal/me', { headers: { Authorization: `Bearer ${t}` } })
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setGuest(d.data);
          // Check tipping enabled for this property
          const propId = d.data?.reservations?.[0]?.property?.id;
          if (propId) {
            fetch(`/api/tips/staff?propertyId=${propId}`)
              .then(r => r.json())
              .then(td => { if (td.success) setTippingEnabled(true); })
              .catch(() => {});
          }
        } else { console.error('[Dashboard]', d.message); setError(d.message || 'Could not load data.'); }
      })
      .catch(err => { console.error('[Dashboard Fetch]', err); setError('Connection error.'); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchGuestData(); }, [router]);

  const handleLogout = () => { localStorage.removeItem('guest_token'); router.replace('/guest-portal'); };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setShowMore(false);
  };

  const upcoming = guest?.reservations.filter(r => r.status === 'CONFIRMED' || r.status === 'CHECKED_IN') || [];
  const past = guest?.reservations.filter(r => r.status === 'CHECKED_OUT' || r.status === 'CANCELLED') || [];
  const moreIsActive = MORE_ITEMS.some(i => i.id === activeTab);

  return (
    <>
      <Toaster richColors position="top-center" />
      <div className="min-h-screen bg-[#050a14] relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-15%] left-[20%] w-[500px] h-[500px] bg-indigo-700/8 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-[10%] w-[400px] h-[400px] bg-violet-700/6 rounded-full blur-[100px]" />
        </div>

        {/* Header */}
        <header className="relative z-10 border-b border-slate-800/80 bg-[#050a14]/80 backdrop-blur-md">
          <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {guest?.avatarUrl ? (
                <img
                  src={guest.avatarUrl}
                  alt={guest.firstName}
                  className="w-9 h-9 rounded-xl object-cover shadow-lg border border-white/20"
                />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center shadow-lg shadow-indigo-600/20">
                  <Hotel size={18} className="text-white" />
                </div>
              )}
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400">Guest Portal</p>
                <p className="text-xs font-black text-white">{guest?.firstName ? `${guest.firstName} ${guest.lastName || ''}`.trim() : 'Guest Dashboard'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleTabChange('profile')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
                  activeTab === 'profile'
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                    : 'border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 bg-slate-900/40'
                }`}
              >
                <User size={14} className="text-emerald-400" />
                <span className="hidden sm:inline">Profile</span>
              </button>
              <button onClick={handleLogout} className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 text-xs font-bold transition-all">
                <LogOut size={14} /> <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </header>

        {/* Desktop Tab Bar */}
        <div className="hidden sm:block relative z-10 border-b border-slate-800/60 bg-[#050a14]/60 backdrop-blur-sm">
          <div className="max-w-3xl mx-auto px-4">
            <div className="flex gap-0">
              {ALL_MENU_ITEMS.map(item => (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`flex items-center gap-2 px-4 py-4 text-xs font-black border-b-2 transition-all ${
                    activeTab === item.id ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <item.icon size={15} /> {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* More Drawer Backdrop */}
        {showMore && (
          <div
            className="fixed inset-0 z-40 bg-black/55 backdrop-blur-sm sm:hidden"
            onClick={() => setShowMore(false)}
          />
        )}

        {/* More Drawer — slides up from above bottom nav */}
        <div
          className="fixed left-0 right-0 z-50 sm:hidden"
          style={{
            bottom: showMore ? '80px' : '-120%',
            opacity: showMore ? 1 : 0,
            transition: 'bottom 0.35s cubic-bezier(0.32,0.72,0,1), opacity 0.25s ease',
            pointerEvents: showMore ? 'auto' : 'none',
          }}
        >
          <div
            className="mx-3 rounded-2xl overflow-hidden"
            style={{
              background: 'rgba(9, 14, 28, 0.97)',
              backdropFilter: 'blur(32px)',
              WebkitBackdropFilter: 'blur(32px)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              boxShadow: '0 -8px 60px rgba(99,102,241,0.18), 0 0 0 0.5px rgba(255,255,255,0.06) inset',
            }}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400">Quick Access</p>
                <p className="text-xs font-black text-white mt-0.5">All Services</p>
              </div>
              <button
                onClick={() => setShowMore(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center transition-all hover:bg-white/10"
                style={{ border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <X size={13} className="text-slate-400" />
              </button>
            </div>
            <div className="mx-5 h-px bg-slate-800/80 mb-3" />

            {/* 4-column grid — all 7 items */}
            <div className="grid grid-cols-4 gap-2 px-4 pb-5">
              {ALL_MENU_ITEMS.map(item => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    className="flex flex-col items-center gap-2 p-3 rounded-2xl transition-all duration-300 active:scale-95"
                    style={{
                      background: isActive ? `linear-gradient(135deg, ${item.bg}, rgba(0,0,0,0))` : 'rgba(255,255,255,0.03)',
                      border: isActive ? `1px solid ${item.border}` : '1px solid rgba(255,255,255,0.06)',
                      boxShadow: isActive ? `0 0 20px ${item.glow.replace('0.7', '0.2')}` : 'none',
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{
                        background: isActive ? item.bg : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${isActive ? item.border : 'rgba(255,255,255,0.08)'}`,
                      }}
                    >
                      <item.icon
                        size={20}
                        style={{
                          color: isActive ? 'white' : 'rgb(100,116,139)',
                          filter: isActive ? `drop-shadow(0 0 8px ${item.glow})` : 'none',
                        }}
                      />
                    </div>
                    <span
                      className="text-[8px] font-black uppercase tracking-widest"
                      style={{ color: isActive ? 'white' : 'rgb(71,85,105)' }}
                    >
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Premium Bottom Navigation Bar — 5 items (Mobile Only) */}
        <div className="fixed bottom-0 left-0 right-0 z-40 sm:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-[#050a14]/95 to-transparent" />
          <div
            className="relative mx-3 mb-3 rounded-2xl"
            style={{
              background: 'rgba(12, 18, 35, 0.88)',
              backdropFilter: 'blur(28px)',
              WebkitBackdropFilter: 'blur(28px)',
              border: '1px solid rgba(99, 102, 241, 0.16)',
              boxShadow: '0 -4px 40px rgba(99,102,241,0.1), 0 0 0 0.5px rgba(255,255,255,0.05) inset',
            }}
          >
            <div className="flex items-center justify-around px-2 py-2">
              {MAIN_NAV.map(item => (
                <NavButton key={item.id} item={item} activeTab={activeTab} onClick={() => handleTabChange(item.id)} />
              ))}

              {/* MORE button */}
              <button
                onClick={() => setShowMore(prev => !prev)}
                className="relative flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl transition-all duration-300 min-w-[48px]"
                style={(showMore || moreIsActive) ? {
                  background: 'linear-gradient(135deg, rgba(139,92,246,0.25) 0%, rgba(0,0,0,0) 100%)',
                  boxShadow: '0 0 18px rgba(139,92,246,0.25)',
                  border: '1px solid rgba(139,92,246,0.4)',
                } : {}}
              >
                <MoreHorizontal
                  size={20}
                  style={{
                    color: (showMore || moreIsActive) ? 'white' : 'rgb(100,116,139)',
                    filter: (showMore || moreIsActive) ? 'drop-shadow(0 0 7px rgba(139,92,246,0.8))' : 'none',
                    transition: 'all 0.3s',
                    transform: showMore ? 'rotate(90deg)' : 'rotate(0deg)',
                  }}
                />
                <span
                  className="text-[7px] font-black uppercase tracking-widest transition-all duration-300"
                  style={{ color: (showMore || moreIsActive) ? 'white' : 'rgb(71,85,105)' }}
                >
                  More
                </span>
                {moreIsActive && !showMore && (
                  <div
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-violet-400"
                    style={{ boxShadow: '0 0 8px rgba(139,92,246,0.8)' }}
                  />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <main className="relative max-w-3xl mx-auto px-4 py-6 space-y-6 pb-28 sm:pb-12">
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="text-center space-y-3">
                <Loader2 className="animate-spin text-indigo-500 mx-auto" size={32} />
                <p className="text-xs text-slate-500">Loading...</p>
              </div>
            </div>
          ) : error ? (
            <div className="h-64 flex items-center justify-center">
              <div className="text-center space-y-4 p-8 rounded-3xl bg-rose-500/5 border border-rose-500/20 max-w-md">
                <p className="text-rose-400 font-bold text-sm">{error}</p>
                <button
                  onClick={() => { localStorage.removeItem('guest_token'); router.replace('/guest-portal'); }}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 transition-colors"
                >
                  Back to Login
                </button>
              </div>
            </div>
          ) : activeTab === 'bookings' && guest ? (
            <>
              <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-600/20 to-violet-600/10 border border-indigo-500/20">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <Sparkles size={12} className="text-indigo-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Welcome Back</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTabChange('profile')}
                      className="px-3 py-1.5 rounded-full bg-emerald-600/20 hover:bg-emerald-600/35 border border-emerald-500/40 text-emerald-300 text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                    >
                      <User size={12} className="text-emerald-400" />
                      Profile
                    </button>
                    {upcoming.length > 0 && (
                      <button
                        onClick={() => setSelectedSecurityReservation(upcoming[0])}
                        className="px-3.5 py-1.5 rounded-full bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-300 text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                      >
                        <QrCode size={13} className="text-indigo-400" />
                        🛡️ Gate Pass QR
                      </button>
                    )}
                  </div>
                </div>
                <h2 className="text-2xl font-black text-white mb-3">Hello, {guest.firstName}! 👋</h2>
                <div className="flex flex-wrap gap-4 text-xs text-slate-400">
                  {guest.mobile && <span className="flex items-center gap-1.5"><Phone size={11} /> {guest.mobile}</span>}
                  {guest.email && <span className="flex items-center gap-1.5"><Mail size={11} /> {guest.email}</span>}
                </div>
                <div className="grid grid-cols-3 gap-3 mt-4">
                  <div className="p-3 rounded-2xl bg-[#0f172a]/60 border border-slate-800/60 text-center">
                    <p className="text-xl font-black text-indigo-400">{guest.reservations.length}</p>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Bookings</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#0f172a]/60 border border-slate-800/60 text-center">
                    <p className="text-xl font-black text-emerald-400">{upcoming.length}</p>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Active</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#0f172a]/60 border border-slate-800/60 text-center">
                    <p className="text-xl font-black text-slate-400">{past.length}</p>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Past</p>
                  </div>
                </div>
              </div>

              {/* Tip Staff Quick Action */}
              {tippingEnabled && (
                <button
                  onClick={() => router.push('/guest-portal/dashboard/tip')}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl border border-amber-500/25 bg-gradient-to-r from-amber-500/10 to-orange-600/5 hover:from-amber-500/20 hover:to-orange-600/10 hover:border-amber-500/40 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20 flex-shrink-0">
                    <Heart className="w-5 h-5 text-white fill-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-white font-bold text-sm">Tip Our Staff 💝</p>
                    <p className="text-amber-400/70 text-xs">Show appreciation via UPI</p>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full">UPI</span>
                </button>
              )}

              {upcoming.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <CalendarDays size={16} className="text-indigo-400" />
                    <h3 className="font-black text-sm uppercase tracking-wider text-slate-300">Active Reservations</h3>
                  </div>
                  <div className="space-y-4">
                    {upcoming.map(r => (
                      <BookingCard
                        key={r.id}
                        reservation={r}
                        token={token}
                        guestName={`${guest.firstName} ${guest.lastName || ''}`.trim()}
                        guestPhone={guest.mobile || ''}
                        onUpdate={fetchGuestData}
                      />
                    ))}
                  </div>
                </section>
              )}
              {past.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <BedDouble size={16} className="text-slate-500" />
                    <h3 className="font-black text-sm uppercase tracking-wider text-slate-400">Past Stays</h3>
                  </div>
                  <div className="space-y-4 opacity-70">
                    {past.map(r => (
                      <BookingCard
                        key={r.id}
                        reservation={r}
                        token={token}
                        guestName={`${guest.firstName} ${guest.lastName || ''}`.trim()}
                        guestPhone={guest.mobile || ''}
                        onUpdate={fetchGuestData}
                      />
                    ))}
                  </div>
                </section>
              )}
              {guest.reservations.length === 0 && (
                <div className="text-center py-20 text-slate-500">
                  <BedDouble size={40} className="mx-auto mb-3 opacity-30" />
                  <p className="font-bold">No bookings found.</p>
                </div>
              )}
            </>
          ) : activeTab === 'billing' && guest ? (
            <BillingTab guest={guest} token={token} />
          ) : activeTab === 'menu' && token ? (
            <MenuTab token={token} />
          ) : activeTab === 'requests' && token ? (
            <RequestsTab token={token} />
          ) : activeTab === 'transport' && token ? (
            <TransportTab
              token={token}
              guestName={guest?.firstName ? `${guest.firstName} ${guest.lastName || ''}`.trim() : ''}
              guestPhone={guest?.mobile || ''}
              guestRoom={upcoming[0]?.rooms?.[0]?.room?.roomNumber || ''}
            />
          ) : activeTab === 'singers' && token ? (
            <SingersTab token={token} propertyId={upcoming[0]?.property?.id || guest?.reservations[0]?.property?.id} />
          ) : activeTab === 'spa' && token ? (
            <SpaTab
              token={token}
              propertyId={upcoming[0]?.property?.id || guest?.reservations[0]?.property?.id || ''}
              guestName={guest ? `${guest.firstName} ${guest.lastName || ''}`.trim() : ''}
              guestRoom={upcoming[0]?.rooms?.[0]?.room?.roomNumber || ''}
              guestPhone={guest?.mobile || ''}
            />
          ) : activeTab === 'profile' && guest && token ? (
            <ProfileTab guest={guest} token={token} onUpdate={fetchGuestData} />
          ) : null}
        </main>

        {/* Quick Gate Pass Security Modal */}
        {selectedSecurityReservation && (
          <SecurityPassModal
            reservation={selectedSecurityReservation}
            guestName={guest?.firstName ? `${guest.firstName} ${guest.lastName || ''}`.trim() : ''}
            guestPhone={guest?.mobile || ''}
            onClose={() => setSelectedSecurityReservation(null)}
          />
        )}
      </div>
    </>
  );
}
