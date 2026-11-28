'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Handshake, Search, RefreshCw, Loader2, Phone,
  IndianRupee, Clock, CheckCircle2, X, UserCheck, Star,
  BadgeCheck, AlertCircle, Calendar, Users,
  ArrowUpRight, Sparkles, TrendingUp, Wallet,
  ChevronDown, Building2, Volume2, VolumeX, Bell, CreditCard,
  Shield, Check, BedDouble,
} from 'lucide-react';
import { toast, Toaster } from 'sonner';
import Link from 'next/link';
import { setupAudioUnlock, playNotificationSound, isSoundEnabled, setSoundEnabled } from '@/lib/notification-sound';
import ProofDocumentsModal, { parseKycFromNotes } from '@/components/agent-portal/ProofDocumentsModal';

interface AgentBooking {
  id: string;
  guestName: string;
  guestPhone?: string;
  guestEmail?: string;
  guestNationality?: string;
  adults: number;
  children: number;
  checkIn: string;
  checkOut: string;
  roomType: string;
  totalAmount: number;
  commission: number;
  commissionPaid: boolean;
  status: string;
  notes?: string;
  specialRequests?: string;
  includePoolAccess?: boolean;
  includeSpaPackage?: boolean;
  reservationId?: string | null;
  bookingNo?: string | null;
  assignedRoomId?: string | null;
  assignedRoomIds?: string[];
  assignedRoom?: {
    id: string;
    roomNumber: string;
    floor?: string | number | null;
    roomType?: { id: string; name: string } | null;
  } | null;
  assignedRooms?: Array<{
    id: string;
    roomNumber: string;
    floor?: string | number | null;
    roomType?: { id: string; name: string } | null;
  }>;
  createdAt: string;
  agent: {
    id: string;
    name: string;
    agentCode: string;
    phone: string;
    commissionRate: number;
    companyName?: string;
    city?: string;
  };
}

const STATUS: Record<string, { label: string; color: string; bg: string; border: string; dot: string; icon: React.ElementType }> = {
  PENDING: { label: 'Pending Review', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', dot: 'bg-amber-400', icon: Clock },
  CONFIRMED: { label: 'Confirmed', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', dot: 'bg-emerald-400', icon: CheckCircle2 },
  CHECKED_IN: { label: 'Checked In', color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/30', dot: 'bg-sky-400', icon: BadgeCheck },
  COMPLETED: { label: 'Completed', color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', dot: 'bg-indigo-400', icon: Star },
  CANCELLED: { label: 'Cancelled', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30', dot: 'bg-rose-400', icon: AlertCircle },
};

function fmtDate(d: string) { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
function fmtShort(d: string) { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }); }
function nights(ci: string, co: string) { return Math.max(1, Math.round((new Date(co).getTime() - new Date(ci).getTime()) / 86400000)); }

function extractRequestedRoomCount(roomType: string, notes?: string): number {
  if (!roomType) return 1;
  const mParen = roomType.match(/\((\d+)\s*Rooms?\)/i);
  if (mParen) return Math.max(1, parseInt(mParen[1], 10));
  const mX = roomType.match(/^(\d+)x\s+/i);
  if (mX) return Math.max(1, parseInt(mX[1], 10));
  const mNotes = notes?.match(/\[ROOMS:\s*(\d+)x/i) || notes?.match(/\[ROOM_COUNT:\s*(\d+)\]/i);
  if (mNotes) return Math.max(1, parseInt(mNotes[1], 10));
  return 1;
}

function Row({ label, val, highlight }: { label: string; val?: string | number; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-start gap-2">
      <span className="text-slate-500 shrink-0">{label}:</span>
      <span className={`font-semibold text-right ${highlight ? 'text-emerald-400' : 'text-slate-200'}`}>{val ?? '—'}</span>
    </div>
  );
}

export default function AgentBookingsPage() {
  const [bookings, setBookings] = useState<AgentBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [updating, setUpdating] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabledState] = useState(true);
  const [selectedBookingForProof, setSelectedBookingForProof] = useState<AgentBooking | null>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedRoomIds, setSelectedRoomIds] = useState<Record<string, string[]>>({});

  const getBookingSelectedRooms = (b: AgentBooking): string[] => {
    if (selectedRoomIds[b.id] !== undefined) {
      return selectedRoomIds[b.id];
    }
    if (b.assignedRooms && b.assignedRooms.length > 0) {
      return b.assignedRooms.map((r) => r.id);
    }
    if (b.assignedRoomIds && b.assignedRoomIds.length > 0) {
      return b.assignedRoomIds;
    }
    if (b.assignedRoomId) {
      return [b.assignedRoomId];
    }
    return [];
  };

  // Room Calendar Visibility Permission
  const [showVisibilityModal, setShowVisibilityModal] = useState(false);
  const [hotelVisibilityDays, setHotelVisibilityDays] = useState(30);
  const [savingVisibility, setSavingVisibility] = useState(false);

  const isInitialLoadRef = useRef(true);
  const prevCountRef = useRef(0);

  useEffect(() => {
    setupAudioUnlock();
    setSoundEnabledState(isSoundEnabled());
    load();
    loadRooms();
    loadVisibility();

    // Auto-polling every 12 seconds so new agent & group bookings ring the front desk bell in real-time
    const interval = setInterval(() => {
      load(true);
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  const loadRooms = async () => {
    try {
      const res = await fetch('/api/hotel/rooms');
      const j = await res.json();
      if (j.success && Array.isArray(j.data)) {
        setRooms(j.data);
      } else if (Array.isArray(j.rooms)) {
        setRooms(j.rooms);
      }
    } catch (_) {}
  };

  const loadVisibility = async () => {
    try {
      const res = await fetch('/api/hotel/agent-visibility');
      const j = await res.json();
      if (j.success && j.agentVisibilityDays) {
        setHotelVisibilityDays(j.agentVisibilityDays);
      }
    } catch (_) { }
  };

  const handleQuickChangeVisibility = async (newDays: number) => {
    setHotelVisibilityDays(newDays);
    setSavingVisibility(true);
    try {
      const res = await fetch('/api/hotel/agent-visibility', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days: newDays }),
      });
      const j = await res.json();
      if (j.success) {
        toast.success(`Agent calendar visibility permission set to ${newDays} days!`);
      } else {
        toast.error(j.message || 'Failed to update visibility permission.');
      }
    } catch {
      toast.error('Network error.');
    } finally {
      setSavingVisibility(false);
    }
  };

  const load = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await fetch('/api/hotel/agent-bookings');
      const data = await res.json();
      if (data.success) {
        const newBookings: AgentBooking[] = data.data || [];
        setBookings(newBookings);

        // Sound alert if new booking/group enquiry arrived
        if (!isInitialLoadRef.current && newBookings.length > prevCountRef.current) {
          const latest = newBookings[0];
          playNotificationSound('booking');
          const isGroup = latest?.roomType?.includes('[GROUP]') || latest?.notes?.includes('[GROUP');
          toast.info(isGroup ? `🔔 New Agent Group Booking Received!` : `🔔 New Agent Booking Received!`, {
            description: `${latest?.guestName || 'Agent Lead'} — ${latest?.roomType || 'Booking'}`,
            duration: 8000,
          });
        }
        prevCountRef.current = newBookings.length;
        isInitialLoadRef.current = false;
      } else {
        if (!isSilent) toast.error('Failed to load agent bookings.');
      }
    } catch {
      if (!isSilent) toast.error('Network error.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabledState(next);
    setSoundEnabled(next);
    if (next) {
      playNotificationSound('booking');
      toast.success('🔊 Front Desk Chime Enabled! (Bell tested)');
    } else {
      toast.info('🔇 Front Desk Chime Muted');
    }
  };

  const updateStatus = async (id: string, status: string, roomIds?: string[]) => {
    setUpdating(id);
    try {
      const res = await fetch('/api/hotel/agent-bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status,
          ...(roomIds && roomIds.length > 0 ? { assignedRoomIds: roomIds, assignedRoomId: roomIds[0] } : {}),
        }),
      });
      const data = await res.json();
      if (data.success) {
        playNotificationSound('success');
        const msgs: Record<string, string> = {
          CONFIRMED: roomIds && roomIds.length > 0
            ? `Booking confirmed & ${roomIds.length} room(s) allotted!`
            : 'Booking confirmed successfully!',
          CANCELLED: 'Booking rejected.',
          CHECKED_IN: 'Guest checked in!',
          COMPLETED: 'Stay marked as completed!',
        };
        toast.success(msgs[status] || 'Updated.');
        load(true);
      } else toast.error(data.message || 'Update failed.');
    } catch { toast.error('Connection error.'); }
    finally { setUpdating(null); }
  };

  const allotRooms = async (id: string, roomIds: string[]) => {
    if (!roomIds || roomIds.length === 0) {
      toast.error('Please select at least one room number first.');
      return;
    }
    setUpdating(id + '_r');
    try {
      const res = await fetch('/api/hotel/agent-bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, assignedRoomIds: roomIds, assignedRoomId: roomIds[0] }),
      });
      const data = await res.json();
      if (data.success) {
        playNotificationSound('success');
        toast.success(`${roomIds.length} room(s) allotted successfully!`);
        load(true);
      } else {
        toast.error(data.message || 'Failed to allot room.');
      }
    } catch {
      toast.error('Connection error.');
    } finally {
      setUpdating(null);
    }
  };

  const handleAutoAllot = (b: AgentBooking, requestedCount: number) => {
    const matchingAvailable = rooms.filter((r) => {
      const isAvail = r.status === 'AVAILABLE' || !r.status;
      const matchesType = r.roomType?.name && b.roomType.toLowerCase().includes(r.roomType.name.toLowerCase());
      return isAvail && matchesType;
    });

    const otherAvailable = rooms.filter((r) => {
      const isAvail = r.status === 'AVAILABLE' || !r.status;
      const matchesType = r.roomType?.name && b.roomType.toLowerCase().includes(r.roomType.name.toLowerCase());
      return isAvail && !matchesType;
    });

    const candidateRooms = [...matchingAvailable, ...otherAvailable];
    const chosen = candidateRooms.slice(0, requestedCount);
    const chosenIds = chosen.map((r) => r.id);

    if (chosenIds.length === 0) {
      toast.error('No available rooms found to auto-allot.');
      return;
    }

    setSelectedRoomIds((prev) => ({ ...prev, [b.id]: chosenIds }));
    toast.success(`Selected ${chosenIds.length} free room(s): #${chosen.map((r) => r.roomNumber).join(', #')}`);
  };

  const markCommPaid = async (id: string) => {
    setUpdating(id + '_c');
    try {
      const res = await fetch('/api/hotel/agent-bookings', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, commissionPaid: true }),
      });
      const data = await res.json();
      if (data.success) { toast.success('Commission marked as paid!'); load(); }
      else toast.error(data.message || 'Failed.');
    } catch { toast.error('Error.'); }
    finally { setUpdating(null); }
  };

  const pending = bookings.filter(b => b.status === 'PENDING').length;
  const confirmed = bookings.filter(b => b.status === 'CONFIRMED').length;
  const checkedIn = bookings.filter(b => b.status === 'CHECKED_IN').length;
  // H11: Exclude cancelled bookings from Total Revenue and Commission Due
  const activeBookings = bookings.filter(b => b.status !== 'CANCELLED');
  const totalComm = activeBookings.reduce((s, b) => s + b.commission, 0);
  const commPaid = activeBookings.filter(b => b.commissionPaid).reduce((s, b) => s + b.commission, 0);
  const totalRev = activeBookings.reduce((s, b) => s + b.totalAmount, 0);

  const filtered = bookings.filter(b => {
    const q = search.toLowerCase();
    const ok = !q || b.guestName.toLowerCase().includes(q) || b.agent?.name?.toLowerCase().includes(q) || b.agent?.agentCode?.toLowerCase().includes(q) || b.roomType.toLowerCase().includes(q);
    return ok && (statusFilter === 'ALL' || b.status === statusFilter);
  });

  return (
    <div className="space-y-7 pb-10">
      <Toaster position="top-right" richColors />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="space-y-1">
          <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-violet-400">
            <Handshake size={12} /> Front Office
          </span>
          <h1 className="text-2xl md:text-3xl font-black text-white leading-none">Agent Bookings</h1>
          <p className="text-xs text-slate-500 font-medium">Bookings submitted by travel agents — review, confirm & manage</p>
        </div>
        <div className="flex items-center gap-2 self-start flex-wrap">
          <button
            onClick={toggleSound}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${soundEnabled
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 shadow-sm'
              : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
            title={soundEnabled ? 'Front Desk Chime Active (Click to mute/test)' : 'Sound Muted (Click to enable)'}
          >
            {soundEnabled ? <Volume2 size={14} className="text-emerald-400 animate-pulse" /> : <VolumeX size={14} />}
            <span>{soundEnabled ? 'Chime ON' : 'Chime Muted'}</span>
          </button>
          <button
            onClick={() => setShowVisibilityModal(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-violet-950/60 hover:bg-violet-900/80 border border-violet-500/30 text-violet-300 hover:text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
            title="Configure how many days ahead agents can view & book room calendar"
          >
            <Shield size={13} className="text-violet-400" />
            <span>Room Visibility: <b className="text-white">{hotelVisibilityDays} Days</b></span>
          </button>
          <button onClick={() => load(false)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-xs font-bold transition-all">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <Link href="/hotel/agents" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all shadow-lg shadow-violet-900/30">
            <Users size={13} /> Manage Agents <ArrowUpRight size={11} />
          </Link>
        </div>
      </div>

      {/* Room Calendar Visibility Permission Bar */}
      <div className="bg-gradient-to-r from-violet-950/50 via-slate-900 to-indigo-950/40 border border-violet-500/30 rounded-2xl p-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 shrink-0">
            <Calendar size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-white">Room Calendar Visibility Permission</span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                {hotelVisibilityDays} Days Active
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Control how many days ahead travel agents can view vacant rooms and book dates on <span className="text-violet-300 font-bold">/agent-portal</span>.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="text-[11px] text-slate-400 font-bold hidden sm:inline">Permission:</span>
          <select
            value={hotelVisibilityDays}
            onChange={(e) => handleQuickChangeVisibility(parseInt(e.target.value, 10))}
            disabled={savingVisibility}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-violet-500 cursor-pointer shadow-sm"
          >
            <option value="7">7 Days (1 Week Forward)</option>
            <option value="15">15 Days (2 Weeks Forward)</option>
            <option value="30">30 Days (1 Month Forward - Standard)</option>
            <option value="60">60 Days (2 Months Forward)</option>
            <option value="90">90 Days (3 Months Forward)</option>
          </select>
          <button
            onClick={() => setShowVisibilityModal(true)}
            className="px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            Settings
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Pending Review', val: pending, sub: 'Need your action', color: 'text-amber-400', bg: 'bg-amber-500/5 border-amber-500/20', icon: Clock, pulse: pending > 0 },
          { label: 'Active', val: confirmed + checkedIn, sub: `${checkedIn} checked in`, color: 'text-emerald-400', bg: 'bg-emerald-500/5 border-emerald-500/20', icon: CheckCircle2, pulse: false },
          { label: 'Total Revenue', val: `₹${(totalRev / 1000).toFixed(1)}K`, sub: `${bookings.length} total bookings`, color: 'text-sky-400', bg: 'bg-sky-500/5 border-sky-500/20', icon: TrendingUp, pulse: false },
          { label: 'Commission Due', val: `₹${(totalComm - commPaid).toLocaleString()}`, sub: `₹${commPaid.toLocaleString()} paid`, color: 'text-violet-400', bg: 'bg-violet-500/5 border-violet-500/20', icon: Wallet, pulse: false },
        ].map(({ label, val, sub, color, bg, icon: Icon, pulse }) => (
          <div key={label} className={`relative flex flex-col gap-2 px-5 py-4 rounded-2xl border shadow-lg ${bg} overflow-hidden`}>
            {pulse && (
              <span className="absolute top-3 right-3 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400" />
              </span>
            )}
            <Icon size={20} className={`${color} opacity-80`} />
            <div>
              <div className={`text-2xl font-black ${color}`}>{val}</div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">{label}</div>
              <div className="text-[10px] text-slate-600 mt-0.5">{sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 text-slate-500" size={14} />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search guest, agent, room…"
              className="pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900/60 text-slate-100 text-xs focus:outline-none focus:border-violet-500 w-64 transition-colors"
            />
          </div>
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800/80">
            {['ALL', 'PENDING', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED'].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${statusFilter === s
                  ? s === 'ALL' ? 'bg-slate-700 text-white' : `${STATUS[s]?.bg} ${STATUS[s]?.color} border ${STATUS[s]?.border}`
                  : 'text-slate-500 hover:text-slate-300'
                  }`}
              >
                {s === 'ALL' ? 'All' : STATUS[s]?.label.split(' ')[0]}
                {s === 'PENDING' && pending > 0 && (
                  <span className="ml-1.5 bg-amber-500 text-black text-[8px] font-black px-1.5 py-0.5 rounded-full">{pending}</span>
                )}
              </button>
            ))}
          </div>
        </div>
        <span className="text-xs text-slate-500">Showing <span className="text-white font-bold">{filtered.length}</span> of {bookings.length}</span>
      </div>

      {/* List */}
      {loading ? (
        <div className="h-60 flex items-center justify-center">
          <div className="text-center space-y-3">
            <Loader2 className="animate-spin text-violet-500 mx-auto" size={32} />
            <p className="text-xs text-slate-500">Loading agent bookings…</p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-slate-800/80 bg-slate-900/20 py-20 text-center">
          <Handshake size={44} className="mx-auto text-slate-700 mb-4" />
          <p className="text-slate-400 font-bold">No agent bookings found</p>
          <p className="text-slate-600 text-xs mt-1 mb-5">
            {search || statusFilter !== 'ALL' ? 'Try changing your search or filter' : 'Agent bookings will appear here once submitted'}
          </p>
          <Link href="/agent-portal" target="_blank" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all">
            <ArrowUpRight size={13} /> Open Agent Portal
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(b => {
            const st = STATUS[b.status] || STATUS.PENDING;
            const Icon = st.icon;
            const n = nights(b.checkIn, b.checkOut);
            const expanded = expandedId === b.id;
            const busy = updating === b.id || updating === b.id + '_c';

            return (
              <div key={b.id} className={`rounded-2xl border bg-[#0f172a]/60 backdrop-blur-sm transition-all ${st.border}`}>
                {/* Card top */}
                <div
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 cursor-pointer"
                  onClick={() => setExpandedId(expanded ? null : b.id)}
                >
                  <div className="flex items-start gap-3">
                    <span className={`mt-1.5 flex-shrink-0 w-2 h-2 rounded-full ${st.dot} ${b.status === 'PENDING' ? 'animate-pulse' : ''}`} />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-white text-base">{b.guestName}</span>
                        <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${st.bg} ${st.color} ${st.border}`}>
                          <Icon size={8} /> {st.label}
                        </span>
                        {(b.roomType.includes('[GROUP]') || b.notes?.includes('[GROUP ENQUIRY')) && (
                          <span className="text-[9px] font-black text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Users size={9} /> GROUP BOOKING
                          </span>
                        )}
                        {b.commissionPaid && (
                          <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">COMM PAID</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-3 mt-1 text-[11px] text-slate-400">
                        {b.guestPhone && <span className="flex items-center gap-1"><Phone size={9} /> {b.guestPhone}</span>}
                        <span className="flex items-center gap-1"><Calendar size={9} /> {fmtShort(b.checkIn)} → {fmtShort(b.checkOut)} <span className="text-slate-600">({n}N)</span></span>
                        <span className="flex items-center gap-1"><Users size={9} /> {b.adults}A{b.children > 0 ? `+${b.children}C` : ''}</span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-[9px] font-bold text-slate-300">{b.roomType}</span>
                        {b.assignedRooms && b.assignedRooms.length > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-[9px] font-black text-emerald-300">
                            <BedDouble size={9} />
                            {b.assignedRooms.length === 1
                              ? `Room #${b.assignedRooms[0].roomNumber}`
                              : `${b.assignedRooms.length} Rooms: #${b.assignedRooms.map((r) => r.roomNumber).join(', #')}`}
                          </span>
                        ) : b.assignedRoom ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-[9px] font-black text-emerald-300">
                            <BedDouble size={9} /> Room #{b.assignedRoom.roomNumber}
                          </span>
                        ) : b.status !== 'CANCELLED' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/25 text-[9px] font-bold text-amber-300">
                            <BedDouble size={9} /> Room Not Allotted
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-1">
                    <div className="flex items-center gap-0.5 text-emerald-400 font-black text-lg"><IndianRupee size={13} />{b.totalAmount.toLocaleString()}</div>
                    <div className="text-[10px] text-violet-400 font-bold flex items-center gap-1"><Star size={9} /> ₹{b.commission.toLocaleString()} comm</div>
                    <div className="flex items-center gap-1.5 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-lg">
                      <Handshake size={10} className="text-violet-400" />
                      <span className="text-[10px] font-bold text-violet-300">{b.agent?.name}</span>
                      <span className="text-[9px] text-slate-500 font-mono">{b.agent?.agentCode}</span>
                    </div>
                    <ChevronDown size={14} className={`text-slate-600 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {/* Expanded */}
                {expanded && (
                  <div className="border-t border-slate-800/60 px-5 py-5 grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Booking Details */}
                    <div className="space-y-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Booking Details</p>
                      <div className="space-y-1.5 text-xs">
                        <Row label="Check-in"    val={fmtDate(b.checkIn)} />
                        <Row label="Check-out"   val={fmtDate(b.checkOut)} />
                        <Row label="Nights"      val={`${n}N`} />
                        <Row label="Room Type"   val={b.roomType} />
                        <Row
                          label={extractRequestedRoomCount(b.roomType, b.notes) > 1 ? "Allotted Rooms" : "Allotted Room"}
                          val={
                            b.assignedRooms && b.assignedRooms.length > 0
                              ? `#${b.assignedRooms.map((r) => r.roomNumber).join(', #')}`
                              : b.assignedRoom
                              ? `#${b.assignedRoom.roomNumber} (${b.assignedRoom.roomType?.name || 'Room'})`
                              : 'Not Allotted Yet'
                          }
                          highlight={Boolean(b.assignedRooms?.length || b.assignedRoom)}
                        />
                        <Row label="Guests"      val={`${b.adults}A${b.children > 0 ? ` + ${b.children}C` : ''}`} />
                        {b.guestNationality && <Row label="Nationality" val={b.guestNationality} />}
                        {b.includePoolAccess && <Row label="Pool" val="✓ Included" highlight />}
                        {b.includeSpaPackage && <Row label="Spa" val="✓ Included" highlight />}
                      </div>
                    </div>

                    {/* Agent & Notes */}
                    <div className="space-y-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Agent & Notes</p>
                      <div className="space-y-1.5 text-xs">
                        <Row label="Agent" val={b.agent?.name} />
                        <Row label="Code" val={b.agent?.agentCode} />
                        <Row label="Phone" val={b.agent?.phone} />
                        {b.agent?.companyName && <Row label="Company" val={b.agent.companyName} />}
                        <Row label="Commission" val={`₹${b.commission.toLocaleString()} @ ${b.agent?.commissionRate}%`} />
                        <Row label="Comm Status" val={b.commissionPaid ? '✓ Paid' : '⏳ Pending'} highlight={b.commissionPaid} />
                      </div>
                      {b.notes && b.notes.includes('[KYC VERIFIED:') ? (
                        <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-[11px] text-emerald-300 space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                            <CheckCircle2 size={12} />
                            <span>Guest KYC Verified (Aadhaar / PAN)</span>
                          </div>
                          <p className="text-[10px] text-emerald-200/80 break-words font-mono">
                            {b.notes.split('[KYC VERIFIED:')[1]?.replace(']', '') || b.notes}
                          </p>
                        </div>
                      ) : b.notes ? (
                        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 whitespace-pre-line">
                          <span className="font-bold text-slate-300 block mb-1">Enquiry Notes:</span>
                          {b.notes}
                        </div>
                      ) : null}
                      {b.specialRequests && (
                        <div className="p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-[11px] text-amber-400">
                          <span className="font-bold">Special Request: </span>{b.specialRequests}
                        </div>
                      )}

                      {/* Customer ID Proof Documents Button */}
                      {(() => {
                        const kyc = parseKycFromNotes(b.notes);
                        const count = kyc.docs.length;
                        return (
                          <button
                            type="button"
                            onClick={() => setSelectedBookingForProof(b)}
                            className="w-full py-2 px-3 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/40 text-violet-300 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm"
                          >
                            <CreditCard size={13} className="text-violet-400" />
                            <span>Customer ID Proof Documents ({count})</span>
                          </button>
                        );
                      })()}
                    </div>

                    {/* Actions */}
                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Room Allotment & Actions</p>

                      {b.status !== 'CANCELLED' && b.status !== 'COMPLETED' && (() => {
                        const requestedCount = extractRequestedRoomCount(b.roomType, b.notes);
                        const curSelectedIds = getBookingSelectedRooms(b);
                        const selectedRoomsData = curSelectedIds
                          .map((id) => rooms.find((r) => r.id === id) || (b.assignedRooms?.find((r) => r.id === id)))
                          .filter(Boolean);

                        const sortedRooms = [...rooms].sort((a, r2) => {
                          const aMatch = b.roomType.toLowerCase().includes((a.roomType?.name || '').toLowerCase()) ? 0 : 1;
                          const bMatch = b.roomType.toLowerCase().includes((r2.roomType?.name || '').toLowerCase()) ? 0 : 1;
                          if (aMatch !== bMatch) return aMatch - bMatch;
                          return String(a.roomNumber).localeCompare(String(r2.roomNumber), undefined, { numeric: true });
                        });

                        const isAllotmentComplete = curSelectedIds.length >= requestedCount;
                        const initialAllottedIds = b.assignedRooms?.map((r) => r.id) || (b.assignedRoomId ? [b.assignedRoomId] : []);
                        const hasChanges = JSON.stringify([...curSelectedIds].sort()) !== JSON.stringify([...initialAllottedIds].sort());

                        return (
                          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                            {/* Header */}
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                                <BedDouble size={13} className="text-emerald-400" />
                                <span>Room Allotment ({curSelectedIds.length}/{requestedCount})</span>
                              </label>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border ${
                                isAllotmentComplete
                                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                  : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                              }`}>
                                {requestedCount} {requestedCount === 1 ? 'Room' : 'Rooms'} Requested
                              </span>
                            </div>

                            {/* Quick Action Buttons */}
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleAutoAllot(b, requestedCount)}
                                className="flex-1 py-1.5 px-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/35 border border-indigo-500/30 text-indigo-300 text-[10px] font-black flex items-center justify-center gap-1 transition-all cursor-pointer"
                              >
                                <Sparkles size={11} className="text-indigo-400" />
                                <span>Auto-Select {requestedCount} Free</span>
                              </button>
                              {curSelectedIds.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedRoomIds((prev) => ({ ...prev, [b.id]: [] }))}
                                  className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-rose-900/30 text-slate-400 hover:text-rose-300 text-[10px] font-bold border border-slate-700 transition-all cursor-pointer"
                                >
                                  Clear
                                </button>
                              )}
                            </div>

                            {/* Selected Rooms Chips */}
                            {curSelectedIds.length > 0 && (
                              <div className="space-y-1.5 bg-[#090f1e] p-2.5 rounded-lg border border-slate-800">
                                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                                  <span>Selected Rooms ({curSelectedIds.length}):</span>
                                  {isAllotmentComplete ? (
                                    <span className="text-emerald-400 font-black">✓ Ready</span>
                                  ) : (
                                    <span className="text-amber-400">Need {requestedCount - curSelectedIds.length} more</span>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {selectedRoomsData.map((rm: any, idx) => (
                                    <span
                                      key={rm.id || idx}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-[10px] font-black"
                                    >
                                      <span>#{rm.roomNumber}</span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSelectedRoomIds((prev) => ({
                                            ...prev,
                                            [b.id]: (prev[b.id] ?? curSelectedIds).filter((id) => id !== rm.id),
                                          }));
                                        }}
                                        className="text-emerald-400 hover:text-rose-400 font-bold ml-0.5 cursor-pointer"
                                        title="Remove room"
                                      >
                                        ×
                                      </button>
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Dropdown to add / choose room */}
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                                <span>{requestedCount > 1 ? '+ Add / Select Room Number' : 'Select Room'}</span>
                                <span className={isAllotmentComplete ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                                  {curSelectedIds.length} / {requestedCount} Allotted
                                </span>
                              </label>
                              <select
                                value=""
                                disabled={curSelectedIds.length >= requestedCount && requestedCount > 1}
                                onChange={(e) => {
                                  const rId = e.target.value;
                                  if (!rId) return;
                                  const curr = selectedRoomIds[b.id] ?? curSelectedIds;
                                  if (requestedCount === 1) {
                                    setSelectedRoomIds((prev) => ({ ...prev, [b.id]: [rId] }));
                                    return;
                                  }
                                  if (curr.includes(rId)) return;
                                  if (curr.length >= requestedCount) {
                                    toast.error(`Agent requested exactly ${requestedCount} room(s). You cannot select more.`);
                                    return;
                                  }
                                  setSelectedRoomIds((prev) => ({ ...prev, [b.id]: [...curr, rId] }));
                                }}
                                className="w-full px-2.5 py-2 rounded-lg bg-[#090f1e] border border-slate-700 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <option value="">
                                  {curSelectedIds.length >= requestedCount && requestedCount > 1
                                    ? `✓ All ${requestedCount} of ${requestedCount} Rooms Selected`
                                    : `-- Choose Room Number to Add (${curSelectedIds.length}/${requestedCount}) --`}
                                </option>
                                {sortedRooms.map((rm) => {
                                  const isSelected = curSelectedIds.includes(rm.id);
                                  const isMatch = rm.roomType?.name && b.roomType.toLowerCase().includes(rm.roomType.name.toLowerCase());
                                  return (
                                    <option key={rm.id} value={rm.id} disabled={isSelected}>
                                      {isSelected ? '✓ ' : isMatch ? '★ ' : ''}Room #{rm.roomNumber} — {rm.roomType?.name || 'Room'} ({rm.status})
                                    </option>
                                  );
                                })}
                              </select>
                            </div>

                            {/* Quick Click Room Chips (Available / Matching Rooms) */}
                            <div className="space-y-1 pt-1">
                              <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-slate-500">
                                <span>Quick Pick Free Rooms:</span>
                                {curSelectedIds.length >= requestedCount && (
                                  <span className="text-emerald-400 font-bold">✓ Target Reached ({requestedCount})</span>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto no-scrollbar p-1 rounded bg-[#090f1e]/60 border border-slate-800/80">
                                {sortedRooms.map((rm) => {
                                  const isSelected = curSelectedIds.includes(rm.id);
                                  const isOccupied = rm.status === 'OCCUPIED';
                                  const isMatch = rm.roomType?.name && b.roomType.toLowerCase().includes(rm.roomType.name.toLowerCase());
                                  const isFull = curSelectedIds.length >= requestedCount && !isSelected;
                                  return (
                                    <button
                                      key={rm.id}
                                      type="button"
                                      disabled={isOccupied || isFull}
                                      onClick={() => {
                                        const curr = selectedRoomIds[b.id] ?? curSelectedIds;
                                        if (requestedCount === 1) {
                                          setSelectedRoomIds((prev) => ({ ...prev, [b.id]: isSelected ? [] : [rm.id] }));
                                          return;
                                        }
                                        if (isSelected) {
                                          setSelectedRoomIds((prev) => ({ ...prev, [b.id]: curr.filter((id) => id !== rm.id) }));
                                        } else {
                                          if (curr.length >= requestedCount) {
                                            toast.error(`Limit reached! Agent requested exactly ${requestedCount} rooms.`);
                                            return;
                                          }
                                          setSelectedRoomIds((prev) => ({ ...prev, [b.id]: [...curr, rm.id] }));
                                        }
                                      }}
                                      className={`px-2 py-1 rounded text-[10px] font-black transition-all cursor-pointer ${
                                        isSelected
                                          ? 'bg-emerald-500 text-black shadow-sm'
                                          : isOccupied
                                          ? 'bg-slate-900/40 text-slate-600 border border-slate-800 line-through cursor-not-allowed'
                                          : isFull
                                          ? 'bg-slate-900/50 text-slate-600 border border-slate-800 opacity-40 cursor-not-allowed'
                                          : isMatch
                                          ? 'bg-indigo-950/40 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-700/50'
                                          : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700'
                                      }`}
                                      title={
                                        isFull
                                          ? `Target reached (${requestedCount} rooms selected)`
                                          : `Room #${rm.roomNumber} - ${rm.roomType?.name || 'Room'} (${rm.status})`
                                      }
                                    >
                                      #{rm.roomNumber}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Update Button for confirmed/in-house bookings */}
                            {b.status !== 'PENDING' && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (curSelectedIds.length !== requestedCount) {
                                    toast.error(`Agent requested exactly ${requestedCount} rooms. You have selected ${curSelectedIds.length}.`);
                                    return;
                                  }
                                  allotRooms(b.id, curSelectedIds);
                                }}
                                disabled={!!busy || curSelectedIds.length !== requestedCount || !hasChanges}
                                className="w-full py-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/35 border border-emerald-500/40 disabled:opacity-40 text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                              >
                                <BedDouble size={12} />
                                <span>{curSelectedIds.length > 0 ? `Update Allotted Rooms (${curSelectedIds.length}/${requestedCount})` : 'Allot Rooms'}</span>
                              </button>
                            )}
                          </div>
                        );
                      })()}

                      {b.status === 'PENDING' && (() => {
                        const curSelectedIds = getBookingSelectedRooms(b);
                        const requestedCount = extractRequestedRoomCount(b.roomType, b.notes);
                        const isExact = curSelectedIds.length === requestedCount;
                        return (
                          <>
                            <button
                              id={`confirm-${b.id}`}
                              onClick={() => {
                                if (curSelectedIds.length === 0) {
                                  toast.error(`Please allot all ${requestedCount} requested room(s) before confirming.`);
                                  return;
                                }
                                if (curSelectedIds.length < requestedCount) {
                                  toast.error(`Agent requested ${requestedCount} rooms, but only ${curSelectedIds.length} are selected. Please select ${requestedCount - curSelectedIds.length} more.`);
                                  return;
                                }
                                if (curSelectedIds.length > requestedCount) {
                                  toast.error(`Agent requested ${requestedCount} rooms, but ${curSelectedIds.length} are selected. Please remove ${curSelectedIds.length - requestedCount}.`);
                                  return;
                                }
                                updateStatus(b.id, 'CONFIRMED', curSelectedIds);
                              }}
                              disabled={!!busy}
                              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-xs font-black transition-all cursor-pointer shadow-lg ${
                                isExact
                                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/30 ring-2 ring-emerald-400/30'
                                  : 'bg-slate-700 hover:bg-slate-600 opacity-90'
                              }`}
                            >
                              {busy ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                              <span>
                                {isExact
                                  ? `Confirm & Allot Exactly ${requestedCount} ${requestedCount === 1 ? 'Room' : 'Rooms'} ✓`
                                  : curSelectedIds.length > 0
                                  ? `Confirm Booking (${curSelectedIds.length}/${requestedCount} Rooms Selected)`
                                  : `Confirm Booking (Needs ${requestedCount} Rooms)`}
                              </span>
                            </button>
                            <button
                              id={`reject-${b.id}`}
                              onClick={() => updateStatus(b.id, 'CANCELLED')}
                              disabled={!!busy}
                              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-rose-700/40 bg-rose-900/20 hover:bg-rose-800/40 disabled:opacity-50 text-rose-400 text-xs font-bold transition-all cursor-pointer"
                            >
                              <X size={12} /> Reject Booking
                            </button>
                          </>
                        );
                      })()}
                      {b.status === 'CONFIRMED' && (
                        <button id={`checkin-${b.id}`} onClick={() => updateStatus(b.id, 'CHECKED_IN')} disabled={!!busy}
                          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-black transition-all">
                          {busy ? <Loader2 size={12} className="animate-spin" /> : <UserCheck size={12} />} Mark Checked In
                        </button>
                      )}
                      {b.status === 'CHECKED_IN' && (
                        <button id={`complete-${b.id}`} onClick={() => updateStatus(b.id, 'COMPLETED')} disabled={!!busy}
                          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-black transition-all">
                          {busy ? <Loader2 size={12} className="animate-spin" /> : <BadgeCheck size={12} />} Mark Completed
                        </button>
                      )}
                      {!b.commissionPaid && (b.status === 'COMPLETED' || b.status === 'CHECKED_IN') && (
                        <button id={`comm-${b.id}`} onClick={() => markCommPaid(b.id)} disabled={!!busy}
                          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-bold transition-all">
                          {busy ? <Loader2 size={12} className="animate-spin" /> : <Wallet size={12} />} Pay Commission ₹{b.commission.toLocaleString()}
                        </button>
                      )}
                      {b.status === 'CANCELLED' && (
                        <div className="text-center text-xs text-slate-600 italic py-2">Booking was rejected</div>
                      )}
                      {b.status === 'COMPLETED' && b.commissionPaid && (
                        <div className="text-center text-xs text-slate-600 italic py-2">✓ All done</div>
                      )}
                      <div className="text-[10px] text-slate-600 text-center pt-1">
                        Submitted {fmtDate(b.createdAt)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Customer Proof Documents Modal */}
      {selectedBookingForProof && (
        <ProofDocumentsModal
          bookingId={selectedBookingForProof.id}
          guestName={selectedBookingForProof.guestName}
          notes={selectedBookingForProof.notes}
          canUpload={true}
          onClose={() => setSelectedBookingForProof(null)}
          onUpdated={() => {
            load(true);
          }}
        />
      )}

      {/* Room Calendar Visibility Permission Modal */}
      {showVisibilityModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#090f1e] border border-violet-500/30 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-violet-950/40 to-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
                  <Calendar size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Agent Calendar Visibility Permission</h3>
                  <p className="text-[10px] text-slate-400">Control forward room booking window</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowVisibilityModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 text-xs">
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                <span className="text-[10px] font-black uppercase text-violet-400 tracking-wider flex items-center gap-1.5">
                  <Shield size={12} /> Hotel Permission Policy
                </span>
                <p className="text-slate-300 text-xs leading-relaxed">
                  How many days of forward room availability can travel agents view and book in their portal (<code>/agent-portal</code>)?
                </p>

                <div className="pt-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">
                    Permitted Forward Days Ahead:
                  </label>
                  <select
                    value={hotelVisibilityDays}
                    onChange={(e) => setHotelVisibilityDays(parseInt(e.target.value, 10))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-violet-500 cursor-pointer"
                  >
                    <option value="7">7 Days (1 Week Forward)</option>
                    <option value="15">15 Days (2 Weeks Forward)</option>
                    <option value="30">30 Days (1 Month Forward - Standard)</option>
                    <option value="60">60 Days (2 Months Forward)</option>
                    <option value="90">90 Days (3 Months Forward)</option>
                  </select>
                </div>
              </div>

              <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-xl p-3 text-[11px] text-indigo-300 leading-relaxed">
                💡 <b>Policy Effect:</b> Agents logged in at <b>/agent-portal</b> will only see room vacancy and be allowed to make bookings within this selected window. Dates further ahead are blocked/hidden.
              </div>

              <button
                type="button"
                onClick={() => handleQuickChangeVisibility(hotelVisibilityDays).then(() => setShowVisibilityModal(false))}
                disabled={savingVisibility}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-violet-900/30 transition-all cursor-pointer disabled:opacity-50"
              >
                {savingVisibility ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                <span>Save & Apply ({hotelVisibilityDays} Days)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
