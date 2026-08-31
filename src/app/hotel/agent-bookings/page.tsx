'use client';

import React, { useState, useEffect } from 'react';
import {
  Handshake, Search, RefreshCw, Loader2, Phone,
  IndianRupee, Clock, CheckCircle2, X, UserCheck, Star,
  BadgeCheck, AlertCircle, Calendar, Users,
  ArrowUpRight, Sparkles, TrendingUp, Wallet,
  ChevronDown, Building2,
} from 'lucide-react';
import { toast, Toaster } from 'sonner';
import Link from 'next/link';

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
  PENDING:    { label: 'Pending Review', color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/30',   dot: 'bg-amber-400',   icon: Clock },
  CONFIRMED:  { label: 'Confirmed',      color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', dot: 'bg-emerald-400', icon: CheckCircle2 },
  CHECKED_IN: { label: 'Checked In',     color: 'text-sky-400',     bg: 'bg-sky-500/10',     border: 'border-sky-500/30',     dot: 'bg-sky-400',     icon: BadgeCheck },
  COMPLETED:  { label: 'Completed',      color: 'text-indigo-400',  bg: 'bg-indigo-500/10',  border: 'border-indigo-500/30',  dot: 'bg-indigo-400',  icon: Star },
  CANCELLED:  { label: 'Cancelled',      color: 'text-rose-400',    bg: 'bg-rose-500/10',    border: 'border-rose-500/30',    dot: 'bg-rose-400',    icon: AlertCircle },
};

function fmtDate(d: string) { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
function fmtShort(d: string) { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }); }
function nights(ci: string, co: string) { return Math.max(1, Math.round((new Date(co).getTime() - new Date(ci).getTime()) / 86400000)); }

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

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hotel/agent-bookings');
      const data = await res.json();
      if (data.success) setBookings(data.data || []);
      else toast.error('Failed to load agent bookings.');
    } catch { toast.error('Network error.'); }
    finally { setLoading(false); }
  };

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    try {
      const res = await fetch('/api/hotel/agent-bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json();
      if (data.success) {
        const msgs: Record<string, string> = {
          CONFIRMED: 'Booking confirmed successfully!',
          CANCELLED: 'Booking rejected.',
          CHECKED_IN: 'Guest checked in!',
          COMPLETED: 'Stay marked as completed!',
        };
        toast.success(msgs[status] || 'Updated.');
        load();
      } else toast.error(data.message || 'Update failed.');
    } catch { toast.error('Connection error.'); }
    finally { setUpdating(null); }
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

  const pending   = bookings.filter(b => b.status === 'PENDING').length;
  const confirmed = bookings.filter(b => b.status === 'CONFIRMED').length;
  const checkedIn = bookings.filter(b => b.status === 'CHECKED_IN').length;
  const totalComm = bookings.reduce((s, b) => s + b.commission, 0);
  const commPaid  = bookings.filter(b => b.commissionPaid).reduce((s, b) => s + b.commission, 0);
  const totalRev  = bookings.reduce((s, b) => s + b.totalAmount, 0);

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
        <div className="flex items-center gap-2 self-start">
          <button onClick={load} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-xs font-bold transition-all">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <Link href="/hotel/agents" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all shadow-lg shadow-violet-900/30">
            <Users size={13} /> Manage Agents <ArrowUpRight size={11} />
          </Link>
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
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                  statusFilter === s
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
                        {b.commissionPaid && (
                          <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">COMM PAID</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-3 mt-1 text-[11px] text-slate-400">
                        {b.guestPhone && <span className="flex items-center gap-1"><Phone size={9} /> {b.guestPhone}</span>}
                        <span className="flex items-center gap-1"><Calendar size={9} /> {fmtShort(b.checkIn)} → {fmtShort(b.checkOut)} <span className="text-slate-600">({n}N)</span></span>
                        <span className="flex items-center gap-1"><Users size={9} /> {b.adults}A{b.children > 0 ? `+${b.children}C` : ''}</span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-[9px] font-bold text-slate-300">{b.roomType}</span>
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
                        <Row label="Agent"     val={b.agent?.name} />
                        <Row label="Code"      val={b.agent?.agentCode} />
                        <Row label="Phone"     val={b.agent?.phone} />
                        {b.agent?.companyName && <Row label="Company" val={b.agent.companyName} />}
                        <Row label="Commission" val={`₹${b.commission.toLocaleString()} @ ${b.agent?.commissionRate}%`} />
                        <Row label="Comm Status" val={b.commissionPaid ? '✓ Paid' : '⏳ Pending'} highlight={b.commissionPaid} />
                      </div>
                      {b.notes && (
                        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400">
                          <span className="font-bold text-slate-300">Note: </span>{b.notes}
                        </div>
                      )}
                      {b.specialRequests && (
                        <div className="p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-[11px] text-amber-400">
                          <span className="font-bold">Special Request: </span>{b.specialRequests}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Actions</p>
                      {b.status === 'PENDING' && (
                        <>
                          <button id={`confirm-${b.id}`} onClick={() => updateStatus(b.id, 'CONFIRMED')} disabled={!!busy}
                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-black transition-all">
                            {busy ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />} Confirm Booking ✓
                          </button>
                          <button id={`reject-${b.id}`} onClick={() => updateStatus(b.id, 'CANCELLED')} disabled={!!busy}
                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-rose-700/40 bg-rose-900/20 hover:bg-rose-800/40 disabled:opacity-50 text-rose-400 text-xs font-bold transition-all">
                            <X size={12} /> Reject Booking
                          </button>
                        </>
                      )}
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
    </div>
  );
}
