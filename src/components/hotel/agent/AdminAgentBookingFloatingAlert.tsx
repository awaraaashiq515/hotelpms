'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
  Handshake,
  Bell,
  Clock,
  CheckCircle2,
  X,
  User,
  Phone,
  Calendar,
  IndianRupee,
  ChevronRight,
  ChevronUp,
  Minus,
  Sparkles,
  Volume2,
  VolumeX,
  ExternalLink,
  ShieldCheck,
  Waves,
  HeartHandshake
} from 'lucide-react';
import { toast } from 'sonner';
import {
  playNotificationSound,
  setupAudioUnlock,
  isSoundEnabled,
  setSoundEnabled
} from '@/lib/notification-sound';

interface AgentBooking {
  id: string;
  guestName: string;
  guestPhone?: string | null;
  guestEmail?: string | null;
  guestNationality?: string | null;
  adults: number;
  children: number;
  checkIn: string;
  checkOut: string;
  roomType: string;
  totalAmount: number;
  commission: number;
  commissionPaid: boolean;
  status: string;
  notes?: string | null;
  specialRequests?: string | null;
  includePoolAccess?: boolean;
  includeSpaPackage?: boolean;
  createdAt: string;
  agent: {
    id: string;
    name: string;
    agentCode: string;
    phone: string;
    companyName?: string | null;
    city?: string | null;
    commissionRate?: number;
  };
}

export const AdminAgentBookingFloatingAlert: React.FC = () => {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [pendingBookings, setPendingBookings] = useState<AgentBooking[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [soundActive, setSoundActive] = useState(true);

  // Track known booking IDs so only genuinely newly-arrived bookings ring the bell
  const knownBookingIdsRef = useRef<Set<string>>(new Set());
  const isFirstLoadRef = useRef(true);

  useEffect(() => {
    setMounted(true);
    setupAudioUnlock();
    setSoundActive(isSoundEnabled());
  }, []);

  const handleToggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !soundActive;
    setSoundActive(next);
    setSoundEnabled(next);
    if (next) {
      playNotificationSound('agent_booking', 1.3);
      toast.success('🔊 Front Desk Agent Bell Enabled! (Chime Tested)');
    } else {
      toast.info('🔇 Front Desk Bell Muted');
    }
  };

  const fetchPendingBookings = useCallback(async () => {
    try {
      const res = await fetch('/api/hotel/agent-bookings?status=PENDING');
      if (!res.ok) return;

      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const bookings: AgentBooking[] = json.data;

        // Check for newly arrived bookings
        if (!isFirstLoadRef.current) {
          const newBookings = bookings.filter(b => !knownBookingIdsRef.current.has(b.id));

          if (newBookings.length > 0) {
            // Ring the front-desk bell
            playNotificationSound('agent_booking', 1.4);

            // Pop up and un-dismiss alert
            setIsExpanded(true);
            setIsDismissed(false);

            const latest = newBookings[0];
            const isGroup = latest.roomType?.includes('[GROUP]') || latest.notes?.includes('[GROUP');

            // High-visibility Toast
            toast.info(isGroup ? '🛎️ New Agent Group Enquiry Received!' : '🛎️ New Agent Booking Received!', {
              description: `${latest.guestName} (${latest.roomType}) from Agent ${latest.agent?.name || 'Partner'} • ₹${Number(latest.totalAmount).toLocaleString()}`,
              duration: 9000,
              action: {
                label: 'View Booking',
                onClick: () => router.push('/hotel/agent-bookings'),
              },
            });

            // Flash browser title temporarily
            const originalTitle = document.title;
            document.title = `(1) 🛎️ New Agent Booking! - Hotel PMS`;
            setTimeout(() => {
              document.title = originalTitle;
            }, 10000);
          }
        }

        // Update known IDs
        bookings.forEach(b => knownBookingIdsRef.current.add(b.id));
        setPendingBookings(bookings);
        isFirstLoadRef.current = false;
      }
    } catch (err) {
      // Silently ignore network poll failures
    }
  }, [router]);

  useEffect(() => {
    fetchPendingBookings();
    // Fast polling every 7 seconds for real-time instant alerts
    const interval = setInterval(fetchPendingBookings, 7000);
    return () => clearInterval(interval);
  }, [fetchPendingBookings]);

  // Quick confirm directly from floating alert
  const handleQuickConfirm = async (e: React.MouseEvent, bookingId: string, guestName: string) => {
    e.stopPropagation();
    setActionLoadingId(bookingId);
    try {
      const res = await fetch('/api/hotel/agent-bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: bookingId, status: 'CONFIRMED' }),
      });
      const data = await res.json();
      if (data.success) {
        playNotificationSound('success');
        toast.success(`Booking for ${guestName} confirmed!`);
        // Remove from pending list
        setPendingBookings(prev => prev.filter(b => b.id !== bookingId));
      } else {
        toast.error(data.message || 'Failed to confirm booking.');
      }
    } catch {
      toast.error('Network error confirming booking.');
    } finally {
      setActionLoadingId(null);
    }
  };

  if (!mounted || pendingBookings.length === 0 || isDismissed) {
    return null;
  }

  const latest = pendingBookings[0];
  const count = pendingBookings.length;
  const isGroup = latest.roomType?.includes('[GROUP]') || latest.notes?.includes('[GROUP');

  const checkInFmt = latest.checkIn ? new Date(latest.checkIn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '';
  const checkOutFmt = latest.checkOut ? new Date(latest.checkOut).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '';
  const nights = latest.checkIn && latest.checkOut
    ? Math.max(1, Math.round((new Date(latest.checkOut).getTime() - new Date(latest.checkIn).getTime()) / 86400000))
    : 1;

  const content = (
    <div className="fixed bottom-5 right-5 z-[9999] max-w-sm sm:max-w-md w-full animate-in fade-in slide-in-from-bottom-5 duration-300 pointer-events-auto">
      {/* ── MINIMIZED PILL ── */}
      {!isExpanded ? (
        <div
          onClick={() => setIsExpanded(true)}
          className="ml-auto w-fit flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-gradient-to-r from-violet-900/95 via-indigo-900/95 to-slate-900/95 border border-violet-500/50 shadow-2xl backdrop-blur-md cursor-pointer hover:scale-105 transition-all text-white group"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-violet-500"></span>
          </span>
          <Handshake size={15} className="text-violet-300 group-hover:rotate-12 transition-transform" />
          <span className="text-xs font-black tracking-wide">
            {count} Pending Agent {count === 1 ? 'Booking' : 'Bookings'}
          </span>
          <span className="text-[10px] bg-violet-500/30 text-violet-200 px-2 py-0.5 rounded-full font-bold">
            Review
          </span>
        </div>
      ) : (
        /* ── EXPANDED FLOATING NOTIFICATION CARD ── */
        <div className="relative rounded-2xl bg-[#090d19]/95 border-2 border-violet-500/40 shadow-[0_20px_50px_rgba(124,58,237,0.25)] backdrop-blur-xl overflow-hidden text-slate-100 ring-1 ring-white/10">
          
          {/* Top Decorative Glowing Bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-500 animate-pulse" />

          {/* Header */}
          <div className="px-4 py-3 bg-violet-950/40 border-b border-violet-500/20 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-violet-500/20 border border-violet-500/40 flex items-center justify-center text-violet-300 shrink-0">
                <Bell size={15} className="animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black uppercase tracking-wider text-violet-200">
                    {isGroup ? 'Group Enquiry' : 'Agent Booking'}
                  </span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[9px] font-bold border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">
                  {count > 1 ? `${count} bookings awaiting confirmation` : 'Requires Front Desk review'}
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1">
              {/* Sound Test / Mute Toggle */}
              <button
                type="button"
                onClick={handleToggleSound}
                title={soundActive ? 'Sound is ON (Click to mute)' : 'Sound is MUTED (Click to enable)'}
                className={`p-1.5 rounded-lg border transition-all ${
                  soundActive
                    ? 'bg-violet-500/20 border-violet-500/40 text-violet-300 hover:bg-violet-500/30'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {soundActive ? <Volume2 size={13} /> : <VolumeX size={13} />}
              </button>

              {/* Minimize */}
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                title="Minimize alert"
                className="p-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <Minus size={13} />
              </button>

              {/* Dismiss for now */}
              <button
                type="button"
                onClick={() => setIsDismissed(true)}
                title="Dismiss alert"
                className="p-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
              >
                <X size={13} />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-4 space-y-3">
            {/* Agent Info Card */}
            <div className="p-2.5 rounded-xl bg-violet-900/20 border border-violet-500/20 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-300 shrink-0">
                  <Handshake size={13} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-white truncate">
                    {latest.agent?.name || 'Travel Agent'}
                    {latest.agent?.companyName ? ` • ${latest.agent.companyName}` : ''}
                  </p>
                  <p className="text-[9px] text-violet-300 font-mono">
                    Code: {latest.agent?.agentCode || 'PORTAL'}
                    {latest.agent?.phone ? ` • Ph: ${latest.agent.phone}` : ''}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Commission</span>
                <span className="text-xs font-black text-amber-300">₹{Number(latest.commission || 0).toLocaleString()}</span>
              </div>
            </div>

            {/* Guest & Room Details */}
            <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800/80 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-sm font-black text-white leading-tight">
                    {latest.guestName}
                  </h4>
                  <p className="text-[11px] font-semibold text-violet-300 mt-0.5">
                    {latest.roomType}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[9px] text-slate-400 block font-semibold uppercase">Total Amount</span>
                  <span className="text-sm font-black text-emerald-400">₹{Number(latest.totalAmount).toLocaleString()}</span>
                </div>
              </div>

              {/* Stay Dates & Pax */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px] text-slate-300">
                <span className="flex items-center gap-1 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700/60">
                  <Calendar size={10} className="text-indigo-400" />
                  {checkInFmt} → {checkOutFmt} ({nights} {nights === 1 ? 'Night' : 'Nights'})
                </span>
                <span className="flex items-center gap-1 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700/60">
                  <User size={10} className="text-sky-400" />
                  {latest.adults} Adults {latest.children > 0 ? `+ ${latest.children} Kids` : ''}
                </span>
                {latest.includePoolAccess && (
                  <span className="flex items-center gap-1 bg-sky-500/15 text-sky-300 px-2 py-0.5 rounded-md border border-sky-500/30 font-bold">
                    <Waves size={10} /> Pool
                  </span>
                )}
                {latest.includeSpaPackage && (
                  <span className="flex items-center gap-1 bg-rose-500/15 text-rose-300 px-2 py-0.5 rounded-md border border-rose-500/30 font-bold">
                    <HeartHandshake size={10} /> Spa
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-1">
              {/* Quick Confirm */}
              <button
                type="button"
                disabled={actionLoadingId === latest.id}
                onClick={(e) => handleQuickConfirm(e, latest.id, latest.guestName)}
                className="flex-1 h-9 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/25 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
              >
                <CheckCircle2 size={14} />
                <span>{actionLoadingId === latest.id ? 'Confirming...' : 'Confirm Booking'}</span>
              </button>

              {/* Open in Full Portal */}
              <button
                type="button"
                onClick={() => {
                  router.push('/hotel/agent-bookings');
                  setIsExpanded(false);
                }}
                className="h-9 px-3.5 rounded-xl bg-violet-600/30 hover:bg-violet-600/40 border border-violet-500/40 text-violet-200 hover:text-white font-bold text-xs flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
                title="Open Agent Bookings Portal"
              >
                <span>View All</span>
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return createPortal(content, document.body);
};

