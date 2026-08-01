'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Hotel, LogOut, CalendarDays, BedDouble, Loader2,
  Sparkles, Phone, Mail, ReceiptText, UtensilsCrossed, Bell, Music, Car
} from 'lucide-react';
import { Toaster } from 'sonner';

import { GuestData } from '@/components/guest-portal/types';
import BookingCard from '@/components/guest-portal/BookingCard';
import BillingTab from '@/components/guest-portal/BillingTab';
import MenuTab from '@/components/guest-portal/MenuTab';
import RequestsTab from '@/components/guest-portal/RequestsTab';
import SingersTab from '@/components/guest-portal/SingersTab';
import TransportTab from '@/components/guest-portal/TransportTab';
import SpaTab from '@/components/guest-portal/SpaTab';

export default function GuestPortalDashboard() {
  const router = useRouter();
  const [guest, setGuest] = useState<GuestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'bookings' | 'menu' | 'requests' | 'billing' | 'singers' | 'transport' | 'spa'>('bookings');

  const fetchGuestData = () => {
    const t = localStorage.getItem('guest_token') || '';
    if (!t) {
      router.replace('/guest-portal');
      return;
    }
    setToken(t);

    fetch('/api/guest-portal/me', { headers: { Authorization: `Bearer ${t}` } })
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setGuest(d.data);
        } else {
          console.error('[Dashboard]', d.message);
          setError(d.message || 'Could not load data.');
        }
      })
      .catch(err => {
        console.error('[Dashboard Fetch]', err);
        setError('Connection error.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchGuestData();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('guest_token');
    router.replace('/guest-portal');
  };

  const upcoming = guest?.reservations.filter(r => r.status === 'CONFIRMED' || r.status === 'CHECKED_IN') || [];
  const past = guest?.reservations.filter(r => r.status === 'CHECKED_OUT' || r.status === 'CANCELLED') || [];

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
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center shadow-lg shadow-indigo-600/20">
                <Hotel size={18} className="text-white" />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400">Guest Portal</p>
                <p className="text-xs font-black text-white">{guest?.firstName ? `${guest.firstName} ${guest.lastName || ''}`.trim() : 'Guest Dashboard'}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 text-xs font-bold transition-all">
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </header>

        {/* Desktop-only Tab Bar */}
        <div className="hidden sm:block relative z-10 border-b border-slate-800/60 bg-[#050a14]/60 backdrop-blur-sm">
          <div className="max-w-3xl mx-auto px-4">
            <div className="flex gap-0">
              <button onClick={() => setActiveTab('bookings')} className={`flex items-center gap-2 px-4 py-4 text-xs font-black border-b-2 transition-all ${activeTab === 'bookings' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
                <CalendarDays size={15} /> My Bookings
              </button>
              <button onClick={() => setActiveTab('billing')} className={`flex items-center gap-2 px-4 py-4 text-xs font-black border-b-2 transition-all ${activeTab === 'billing' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
                <ReceiptText size={15} /> My Bill
              </button>
              <button onClick={() => setActiveTab('menu')} className={`flex items-center gap-2 px-4 py-4 text-xs font-black border-b-2 transition-all ${activeTab === 'menu' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
                <UtensilsCrossed size={15} /> Menu
              </button>
              <button onClick={() => setActiveTab('requests')} className={`flex items-center gap-2 px-4 py-4 text-xs font-black border-b-2 transition-all ${activeTab === 'requests' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
                <Bell size={15} /> Service Desk
              </button>
              <button onClick={() => setActiveTab('transport')} className={`flex items-center gap-2 px-4 py-4 text-xs font-black border-b-2 transition-all ${activeTab === 'transport' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
                <Car size={15} /> Cab & Bus
              </button>
              <button onClick={() => setActiveTab('singers')} className={`flex items-center gap-2 px-4 py-4 text-xs font-black border-b-2 transition-all ${activeTab === 'singers' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
                <Music size={15} /> Live Music
              </button>
              <button onClick={() => setActiveTab('spa')} className={`flex items-center gap-2 px-4 py-4 text-xs font-black border-b-2 transition-all ${activeTab === 'spa' ? 'border-pink-500 text-pink-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
                <Sparkles size={15} /> Spa
              </button>
            </div>
          </div>
        </div>

        {/* Mobile App-style Bottom Navigation Bar */}
        <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#090f1e]/95 backdrop-blur-lg border-t border-slate-800/80 px-2 py-2 flex justify-around items-center shadow-2xl">
          <button onClick={() => setActiveTab('bookings')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'bookings' ? 'text-indigo-400 scale-105' : 'text-slate-500'}`}>
            <CalendarDays size={18} />
            <span className="text-[8px] font-black uppercase tracking-wider">Stays</span>
          </button>
          <button onClick={() => setActiveTab('billing')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'billing' ? 'text-indigo-400 scale-105' : 'text-slate-500'}`}>
            <ReceiptText size={18} />
            <span className="text-[8px] font-black uppercase tracking-wider">Bill</span>
          </button>
          <button onClick={() => setActiveTab('menu')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'menu' ? 'text-indigo-400 scale-105' : 'text-slate-500'}`}>
            <UtensilsCrossed size={18} />
            <span className="text-[8px] font-black uppercase tracking-wider">Food</span>
          </button>
          <button onClick={() => setActiveTab('transport')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'transport' ? 'text-indigo-400 scale-105' : 'text-slate-500'}`}>
            <Car size={18} />
            <span className="text-[8px] font-black uppercase tracking-wider">Cabs</span>
          </button>
          <button onClick={() => setActiveTab('requests')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'requests' ? 'text-indigo-400 scale-105' : 'text-slate-500'}`}>
            <Bell size={18} />
            <span className="text-[8px] font-black uppercase tracking-wider">Desk</span>
          </button>
          <button onClick={() => setActiveTab('singers')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'singers' ? 'text-indigo-400 scale-105' : 'text-slate-500'}`}>
            <Music size={18} />
            <span className="text-[8px] font-black uppercase tracking-wider">Music</span>
          </button>
          <button onClick={() => setActiveTab('spa')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'spa' ? 'text-pink-400 scale-105' : 'text-slate-500'}`}>
            <Sparkles size={18} />
            <span className="text-[8px] font-black uppercase tracking-wider">Spa</span>
          </button>
        </div>

        <main className="relative z-10 max-w-3xl mx-auto px-4 py-6 space-y-6 pb-32">
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="text-center space-y-3"><Loader2 className="animate-spin text-indigo-500 mx-auto" size={32} /><p className="text-xs text-slate-500">Loading...</p></div>
            </div>
          ) : error ? (
            <div className="h-64 flex items-center justify-center">
              <div className="text-center space-y-4 p-8 rounded-3xl bg-rose-500/5 border border-rose-500/20 max-w-md">
                <p className="text-rose-400 font-bold text-sm">{error}</p>
                <button onClick={() => { localStorage.removeItem('guest_token'); router.replace('/guest-portal'); }}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 transition-colors">
                  Back to Login
                </button>
              </div>
            </div>
          ) : activeTab === 'bookings' && guest ? (
            <>
              {/* Welcome */}
              <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-600/20 to-violet-600/10 border border-indigo-500/20">
                <div className="flex items-center gap-1.5 mb-1"><Sparkles size={12} className="text-indigo-400" /><span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Welcome Back</span></div>
                <h2 className="text-2xl font-black text-white mb-3">Hello, {guest.firstName}! 👋</h2>
                <div className="flex flex-wrap gap-4 text-xs text-slate-400">
                  {guest.mobile && <span className="flex items-center gap-1.5"><Phone size={11} /> {guest.mobile}</span>}
                  {guest.email && <span className="flex items-center gap-1.5"><Mail size={11} /> {guest.email}</span>}
                </div>
                <div className="grid grid-cols-3 gap-3 mt-4">
                  <div className="p-3 rounded-2xl bg-[#0f172a]/60 border border-slate-800/60 text-center"><p className="text-xl font-black text-indigo-400">{guest.reservations.length}</p><p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Bookings</p></div>
                  <div className="p-3 rounded-2xl bg-[#0f172a]/60 border border-slate-800/60 text-center"><p className="text-xl font-black text-emerald-400">{upcoming.length}</p><p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Active</p></div>
                  <div className="p-3 rounded-2xl bg-[#0f172a]/60 border border-slate-800/60 text-center"><p className="text-xl font-black text-slate-400">{past.length}</p><p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Past</p></div>
                </div>
              </div>
              {upcoming.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-4"><CalendarDays size={16} className="text-indigo-400" /><h3 className="font-black text-sm uppercase tracking-wider text-slate-300">Active Reservations</h3></div>
                  <div className="space-y-4">
                    {upcoming.map(r => (
                      <BookingCard
                        key={r.id}
                        reservation={r}
                        token={token}
                        onUpdate={fetchGuestData}
                      />
                    ))}
                  </div>
                </section>
              )}
              {past.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-4"><BedDouble size={16} className="text-slate-500" /><h3 className="font-black text-sm uppercase tracking-wider text-slate-400">Past Stays</h3></div>
                  <div className="space-y-4 opacity-70">
                    {past.map(r => (
                      <BookingCard
                        key={r.id}
                        reservation={r}
                        token={token}
                        onUpdate={fetchGuestData}
                      />
                    ))}
                  </div>
                </section>
              )}
              {guest.reservations.length === 0 && (
                <div className="text-center py-20 text-slate-500"><BedDouble size={40} className="mx-auto mb-3 opacity-30" /><p className="font-bold">No bookings found.</p></div>
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
          ) : null}
        </main>
      </div>
    </>
  );
}
