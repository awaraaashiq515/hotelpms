'use client';

import React, { useState, useEffect } from 'react';
import {
  Handshake, Plus, RefreshCw, Search, Users, TrendingUp,
  CheckCircle2, Clock, X, Loader2, Star, Phone, Mail, Building,
  MapPin, IndianRupee, Shield, Eye, EyeOff, ChevronDown,
  BadgeCheck, AlertCircle, CreditCard, User, Copy, Check,
  BarChart3, Wallet, Calendar, FileText,
} from 'lucide-react';
import { toast, Toaster } from 'sonner';

// ─── Types ───────────────────────────────────────────────────────────────────
interface AgentBooking {
  id: string;
  guestName: string;
  guestPhone?: string;
  checkIn: string;
  checkOut: string;
  roomType: string;
  totalAmount: number;
  commission: number;
  commissionPaid: boolean;
  status: string;
  adults: number;
  children: number;
  createdAt: string;
}

interface TravelAgent {
  id: string;
  name: string;
  agentCode: string;
  phone: string;
  email?: string;
  companyName?: string;
  city?: string;
  commissionRate: number;
  isActive: boolean;
  isBlocked?: boolean;
  totalEarnings: number;
  pinCode: string;
  bookings: AgentBooking[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  PENDING:    { label: 'Pending',    color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/30',   icon: Clock },
  CONFIRMED:  { label: 'Confirmed',  color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', icon: CheckCircle2 },
  CHECKED_IN: { label: 'Checked In', color: 'text-sky-400',     bg: 'bg-sky-500/10 border-sky-500/30',       icon: BadgeCheck },
  COMPLETED:  { label: 'Completed',  color: 'text-indigo-400',  bg: 'bg-indigo-500/10 border-indigo-500/30',  icon: Star },
  CANCELLED:  { label: 'Cancelled',  color: 'text-rose-400',    bg: 'bg-rose-500/10 border-rose-500/30',      icon: AlertCircle },
};

// ─── Component ───────────────────────────────────────────────────────────────
export default function AgentsPage() {
  const [agents, setAgents] = useState<TravelAgent[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'agents' | 'bookings' | 'commission'>('agents');
  const [search, setSearch] = useState('');
  const [bookingFilter, setBookingFilter] = useState('all');
  const [selectedAgent, setSelectedAgent] = useState<TravelAgent | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPins, setShowPins] = useState<Record<string, boolean>>({});
  const [showPwModal, setShowPwModal] = useState<{ agent: TravelAgent; pw: string } | null>(null);
  const [settingPw, setSettingPw] = useState(false);

  const [form, setForm] = useState({
    name: '', phone: '', email: '', companyName: '',
    city: '', commissionRate: '10', pinCode: '1234', notes: '',
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [agentsRes, bookingsRes] = await Promise.all([
        fetch('/api/hotel/agents'),
        fetch('/api/hotel/agent-bookings'),
      ]);
      const agentsJson = await agentsRes.json();
      const bookingsJson = await bookingsRes.json();
      if (agentsJson.success) {
        setAgents(agentsJson.data || []);
        setSummary(agentsJson.summary || {});
      }
      if (bookingsJson.success) setBookings(bookingsJson.data || []);
    } catch {
      toast.error('Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/hotel/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, commissionRate: Number(form.commissionRate) }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.message || 'Agent registered!');
        setShowAddModal(false);
        setForm({ name: '', phone: '', email: '', companyName: '', city: '', commissionRate: '10', pinCode: '1234', notes: '' });
        loadData();
      } else {
        toast.error(json.message || 'Failed to create agent.');
      }
    } catch {
      toast.error('Network error.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (agent: TravelAgent) => {
    try {
      const res = await fetch(`/api/hotel/agents/${agent.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !agent.isActive }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Agent ${agent.isActive ? 'deactivated' : 'activated'}!`);
        loadData();
      }
    } catch {
      toast.error('Failed to update agent status.');
    }
  };

  const handleToggleBlock = async (agent: TravelAgent) => {
    try {
      const newBlockedState = !agent.isBlocked;
      const res = await fetch(`/api/hotel/agents/${agent.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isBlocked: newBlockedState }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Agent ${newBlockedState ? 'Blocked from your hotel' : 'Unblocked'}!`);
        loadData();
      } else {
        toast.error(json.message || 'Failed to update block status.');
      }
    } catch {
      toast.error('Network error.');
    }
  };

  const handleUpdateCommission = async (agent: TravelAgent, currentRate: number) => {
    const input = window.prompt(`Set custom commission % for ${agent.name} at your hotel:`, String(currentRate));
    if (input === null) return;
    const rate = Number(input);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      toast.error('Please enter a valid percentage between 0 and 100.');
      return;
    }
    try {
      const res = await fetch(`/api/hotel/agents/${agent.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commissionRate: rate }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Commission rate updated to ${rate}%!`);
        loadData();
      } else {
        toast.error(json.message || 'Failed to update commission.');
      }
    } catch {
      toast.error('Network error.');
    }
  };

  const handleUpdateBookingStatus = async (bookingId: string, status: string) => {
    try {
      const res = await fetch('/api/hotel/agent-bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: bookingId, status }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Booking status updated to ${status}!`);
        loadData();
      } else {
        toast.error(json.message || 'Failed to update.');
      }
    } catch {
      toast.error('Network error.');
    }
  };

  const handleMarkCommissionPaid = async (bookingId: string) => {
    try {
      const res = await fetch('/api/hotel/agent-bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: bookingId, commissionPaid: true }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Commission marked as paid!');
        loadData();
      }
    } catch {
      toast.error('Network error.');
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  const handleSetPortalPassword = async () => {
    if (!showPwModal || showPwModal.pw.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    setSettingPw(true);
    try {
      const res = await fetch(`/api/hotel/agents/${showPwModal.agent.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portalPassword: showPwModal.pw }),
      });
      const j = await res.json();
      if (j.success) {
        toast.success(`Portal password set for ${showPwModal.agent.name}! They can now login at /agent-portal`);
        setShowPwModal(null);
      } else {
        toast.error(j.message || 'Failed to set password.');
      }
    } catch {
      toast.error('Network error.');
    } finally {
      setSettingPw(false);
    }
  };


  const filteredAgents = agents.filter(a => {
    const q = search.toLowerCase();
    return !q || a.name.toLowerCase().includes(q) || a.phone.includes(q) || a.agentCode.toLowerCase().includes(q) || (a.companyName || '').toLowerCase().includes(q);
  });

  const filteredBookings = bookings.filter(b => bookingFilter === 'all' || b.status === bookingFilter);

  const totalCommissionPending = bookings
    .filter(b => !b.commissionPaid && b.status !== 'CANCELLED')
    .reduce((s: number, b: any) => s + b.commission, 0);

  return (
    <div className="space-y-6 pb-10 max-w-[1400px] mx-auto p-6 text-white">
      <Toaster richColors position="top-right" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-5 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Handshake size={16} className="text-violet-400" />
            <span className="text-[10px] font-black text-violet-400 uppercase tracking-widest">CRM · Travel Agent Network</span>
          </div>
          <h1 className="text-2xl font-black bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Agent Management Console
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage travel agents, track referral bookings, and process commission payouts.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={loadData} className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-400 hover:text-white hover:border-slate-700 transition-all">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-xs font-black text-white shadow-lg shadow-violet-600/20 active:scale-95 transition-all"
          >
            <Plus size={14} /> Register New Agent
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Agents', value: summary.total || agents.length, icon: Users, color: 'border-violet-500/20 bg-violet-950/20 text-violet-400', sub: `${summary.active || 0} Active` },
          { label: 'Total Bookings', value: bookings.length, icon: Calendar, color: 'border-sky-500/20 bg-sky-950/20 text-sky-400', sub: `${bookings.filter(b => b.status === 'PENDING').length} Pending` },
          { label: 'Commission Earned', value: `₹${(summary.totalCommissionEarned || 0).toLocaleString('en-IN')}`, icon: IndianRupee, color: 'border-emerald-500/20 bg-emerald-950/20 text-emerald-400', sub: 'Total across all agents' },
          { label: 'Payout Pending', value: `₹${totalCommissionPending.toLocaleString('en-IN')}`, icon: Wallet, color: 'border-amber-500/20 bg-amber-950/20 text-amber-400', sub: 'Unpaid commission dues' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl border p-4 backdrop-blur-sm ${s.color}`}>
            <s.icon size={16} className="mb-2 opacity-80" />
            <p className="text-2xl font-black text-white">{s.value}</p>
            <p className="text-[10px] font-black uppercase tracking-widest mt-1 opacity-90">{s.label}</p>
            <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-3">
        {([
          { key: 'agents', label: '👤 Agent Directory', icon: Users },
          { key: 'bookings', label: '📋 Agent Bookings', icon: Calendar },
          { key: 'commission', label: '💰 Commission Ledger', icon: BarChart3 },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              tab === t.key ? 'bg-violet-600 text-white shadow-md' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ─── Tab 1: Agent Directory ─────────────────────────────── */}
      {tab === 'agents' && (
        <div className="space-y-4">
          <div className="relative w-full max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search name, phone, code, company..."
              className="w-full bg-[#050a14] border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-violet-500 placeholder-slate-600"
            />
          </div>

          {loading ? (
            <div className="h-40 flex items-center justify-center"><Loader2 className="animate-spin text-violet-500" size={32} /></div>
          ) : filteredAgents.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed border-slate-800 rounded-3xl">
              <Handshake size={40} className="mx-auto text-slate-700 mb-2" />
              <p className="text-sm font-bold text-slate-400">No Travel Agents Registered</p>
              <p className="text-xs text-slate-600 mt-1">Click "Register New Agent" to add your first travel partner.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredAgents.map(agent => {
                const agentBookings = agent.bookings || [];
                const totalEarned = agentBookings.reduce((s, b) => s + b.commission, 0);
                const totalPaid = agentBookings.filter(b => b.commissionPaid).reduce((s, b) => s + b.commission, 0);
                return (
                  <div key={agent.id} className={`rounded-2xl border p-5 space-y-3 transition-all hover:border-violet-500/30 cursor-pointer ${agent.isActive ? 'bg-[#0d1222] border-slate-800' : 'bg-slate-950/50 border-slate-900 opacity-60'}`}
                    onClick={() => setSelectedAgent(agent)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600/30 to-indigo-600/30 border border-violet-500/20 flex items-center justify-center">
                          <span className="text-xl font-black text-violet-300">{agent.name[0]}</span>
                        </div>
                        <div>
                          <p className="text-sm font-black text-white">{agent.name}</p>
                          <p className="text-[10px] text-violet-400 font-bold">{agent.agentCode}</p>
                          {agent.companyName && <p className="text-[10px] text-slate-500">{agent.companyName}</p>}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {agent.isBlocked ? (
                          <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            🚫 BLOCKED
                          </span>
                        ) : (
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${agent.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-500'}`}>
                            {agent.isActive ? '● Active' : '○ Inactive'}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-slate-900 rounded-xl p-2">
                        <p className="text-base font-black text-white">{agentBookings.length}</p>
                        <p className="text-[8px] text-slate-500 uppercase font-bold">Bookings</p>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); handleUpdateCommission(agent, agent.commissionRate); }}
                        className="bg-slate-900 hover:bg-slate-800 border border-slate-700/50 rounded-xl p-2 transition-colors group"
                        title="Click to edit commission %"
                      >
                        <p className="text-base font-black text-indigo-400 group-hover:text-indigo-300">{agent.commissionRate}% ✏️</p>
                        <p className="text-[8px] text-slate-500 uppercase font-bold">Commission</p>
                      </button>
                      <div className="bg-slate-900 rounded-xl p-2">
                        <p className="text-base font-black text-emerald-400">₹{totalEarned.toLocaleString('en-IN', { notation: 'compact' })}</p>
                        <p className="text-[8px] text-slate-500 uppercase font-bold">Earned</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span className="flex items-center gap-1"><Phone size={10} />{agent.phone}</span>
                      {agent.city && <span className="flex items-center gap-1"><MapPin size={10} />{agent.city}</span>}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-1 border-t border-slate-800">
                      <button
                        onClick={e => { e.stopPropagation(); setShowPwModal({ agent, pw: '' }); }}
                        className="py-1.5 px-2.5 rounded-xl text-[9px] font-black bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-600/40 transition-all flex items-center justify-center gap-1"
                      >
                        <Shield size={9} /> Set Password
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); handleToggleBlock(agent); }}
                        className={`flex-1 py-1.5 rounded-xl text-[9px] font-black border transition-all ${
                          agent.isBlocked
                            ? 'bg-emerald-600/20 border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/30'
                            : 'bg-rose-600/20 border-rose-500/30 text-rose-400 hover:bg-rose-600/30'
                        }`}
                      >
                        {agent.isBlocked ? '✓ Unblock Agent' : '🚫 Block Agent'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── Tab 2: Agent Bookings ──────────────────────────────── */}
      {tab === 'bookings' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {['all', 'PENDING', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED'].map(s => (
              <button
                key={s}
                onClick={() => setBookingFilter(s)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                  bookingFilter === s ? 'bg-violet-600 text-white' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {s === 'all' ? 'All Bookings' : (STATUS_CONFIG[s]?.label || s)}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="h-40 flex items-center justify-center"><Loader2 className="animate-spin text-violet-500" size={32} /></div>
          ) : filteredBookings.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-slate-800 rounded-3xl">
              <Calendar size={36} className="mx-auto text-slate-700 mb-2" />
              <p className="text-sm font-bold text-slate-400">No Agent Bookings Found</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-800 overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-slate-900/70">
                  <tr className="text-slate-400 text-[10px] font-black uppercase tracking-wider">
                    <th className="text-left p-3">Guest Details</th>
                    <th className="text-left p-3">Agent</th>
                    <th className="text-left p-3">Stay Dates</th>
                    <th className="text-left p-3">Room Type</th>
                    <th className="text-left p-3">Amount</th>
                    <th className="text-left p-3">Commission</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {filteredBookings.map((b: any) => {
                    const cfg = STATUS_CONFIG[b.status] || STATUS_CONFIG.PENDING;
                    const StatusIcon = cfg.icon;
                    return (
                      <tr key={b.id} className="hover:bg-slate-900/30 transition-colors">
                        <td className="p-3">
                          <p className="font-black text-white">{b.guestName}</p>
                          <p className="text-slate-500">{b.guestPhone || '—'}</p>
                          <p className="text-slate-600">{b.adults}A {b.children ? `${b.children}C` : ''}</p>
                        </td>
                        <td className="p-3">
                          <p className="font-bold text-violet-400">{b.agent?.name || '—'}</p>
                          <p className="text-slate-600">{b.agent?.agentCode}</p>
                        </td>
                        <td className="p-3">
                          <p className="font-bold text-white">{new Date(b.checkIn).toLocaleDateString('en-IN')}</p>
                          <p className="text-slate-500">to {new Date(b.checkOut).toLocaleDateString('en-IN')}</p>
                        </td>
                        <td className="p-3 text-slate-300">{b.roomType}</td>
                        <td className="p-3">
                          <p className="font-black text-white">₹{b.totalAmount.toLocaleString('en-IN')}</p>
                        </td>
                        <td className="p-3">
                          <p className={`font-black ${b.commissionPaid ? 'text-emerald-400' : 'text-amber-400'}`}>
                            ₹{b.commission.toLocaleString('en-IN')}
                          </p>
                          <p className="text-[9px] text-slate-600">{b.commissionPaid ? '✓ Paid' : 'Pending'}</p>
                        </td>
                        <td className="p-3">
                          <span className={`inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}>
                            <StatusIcon size={9} /> {cfg.label}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-col gap-1">
                            {b.status === 'PENDING' && (
                              <button onClick={() => handleUpdateBookingStatus(b.id, 'CONFIRMED')}
                                className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[9px] font-black">
                                Confirm
                              </button>
                            )}
                            {b.status === 'CONFIRMED' && (
                              <button onClick={() => handleUpdateBookingStatus(b.id, 'CHECKED_IN')}
                                className="px-2 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-[9px] font-black">
                                Check In
                              </button>
                            )}
                            {b.status === 'CHECKED_IN' && (
                              <button onClick={() => handleUpdateBookingStatus(b.id, 'COMPLETED')}
                                className="px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[9px] font-black">
                                Complete
                              </button>
                            )}
                            {!b.commissionPaid && b.status === 'COMPLETED' && (
                              <button onClick={() => handleMarkCommissionPaid(b.id)}
                                className="px-2 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-[9px] font-black">
                                Pay Commission
                              </button>
                            )}
                            {(b.status === 'PENDING' || b.status === 'CONFIRMED') && (
                              <button onClick={() => handleUpdateBookingStatus(b.id, 'CANCELLED')}
                                className="px-2 py-1 rounded-lg bg-rose-900/50 hover:bg-rose-600 text-rose-400 hover:text-white text-[9px] font-black border border-rose-800">
                                Cancel
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── Tab 3: Commission Ledger ───────────────────────────── */}
      {tab === 'commission' && (
        <div className="space-y-4">
          {agents.map(agent => {
            const agentBkgs = bookings.filter((b: any) => b.agent?.id === agent.id);
            const earned = agentBkgs.reduce((s: number, b: any) => s + b.commission, 0);
            const paid = agentBkgs.filter((b: any) => b.commissionPaid).reduce((s: number, b: any) => s + b.commission, 0);
            const pending = earned - paid;
            return (
              <div key={agent.id} className="rounded-2xl border border-slate-800 bg-[#0d1222] overflow-hidden">
                <div className="p-4 flex items-center justify-between bg-slate-900/50 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/20 flex items-center justify-center">
                      <span className="text-base font-black text-violet-300">{agent.name[0]}</span>
                    </div>
                    <div>
                      <p className="text-sm font-black text-white">{agent.name}</p>
                      <p className="text-[10px] text-slate-500">{agent.agentCode} · {agent.commissionRate}% Rate · {agentBkgs.length} Bookings</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <p className="text-emerald-400 font-black text-sm">₹{earned.toLocaleString('en-IN')}</p>
                      <p className="text-[9px] text-slate-500">Total Earned</p>
                    </div>
                    <div>
                      <p className="text-indigo-400 font-black text-sm">₹{paid.toLocaleString('en-IN')}</p>
                      <p className="text-[9px] text-slate-500">Paid Out</p>
                    </div>
                    <div>
                      <p className="text-amber-400 font-black text-sm">₹{pending.toLocaleString('en-IN')}</p>
                      <p className="text-[9px] text-slate-500">Pending</p>
                    </div>
                  </div>
                </div>
                {agentBkgs.length > 0 && (
                  <div className="divide-y divide-slate-900">
                    {agentBkgs.map((b: any) => (
                      <div key={b.id} className="flex items-center justify-between px-4 py-2 hover:bg-slate-900/30 text-xs">
                        <div>
                          <p className="font-bold text-white">{b.guestName}</p>
                          <p className="text-slate-500">
                            {new Date(b.checkIn).toLocaleDateString('en-IN')} → {new Date(b.checkOut).toLocaleDateString('en-IN')} · {b.roomType}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-bold text-white">₹{b.totalAmount.toLocaleString('en-IN')}</p>
                            <p className="text-slate-500 text-[9px]">Room Total</p>
                          </div>
                          <div className="text-right">
                            <p className={`font-black ${b.commissionPaid ? 'text-emerald-400' : 'text-amber-400'}`}>
                              ₹{b.commission.toLocaleString('en-IN')}
                            </p>
                            <p className="text-[9px] text-slate-600">{b.commissionPaid ? '✓ Paid' : 'Unpaid'}</p>
                          </div>
                          {!b.commissionPaid && b.status !== 'CANCELLED' && (
                            <button
                              onClick={() => handleMarkCommissionPaid(b.id)}
                              className="px-2 py-1 rounded-lg bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 text-[9px] font-black hover:bg-emerald-600 hover:text-white transition-all"
                            >
                              Mark Paid
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {agents.length === 0 && (
            <div className="py-16 text-center border-2 border-dashed border-slate-800 rounded-3xl">
              <BarChart3 size={36} className="mx-auto text-slate-700 mb-2" />
              <p className="text-sm font-bold text-slate-400">No agents to show commission for.</p>
            </div>
          )}
        </div>
      )}

      {/* ─── MODAL 1: ADD NEW AGENT ─────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-[#090f1e] border border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4 my-8 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <Handshake size={18} className="text-violet-400" /> Register New Travel Agent
              </h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white p-1"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateAgent} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Agent / Contact Name *</label>
                  <input required type="text" placeholder="e.g. Rajesh Gupta"
                    className="w-full bg-[#050a14] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                    value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Mobile Number *</label>
                  <input required type="text" placeholder="+91 9876543210"
                    className="w-full bg-[#050a14] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                    value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Email Address</label>
                  <input type="email" placeholder="agent@travelco.com"
                    className="w-full bg-[#050a14] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                    value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Company / Agency Name</label>
                  <input type="text" placeholder="e.g. Sunrise Travel Agency"
                    className="w-full bg-[#050a14] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                    value={form.companyName} onChange={e => setForm({ ...form, companyName: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">City</label>
                  <input type="text" placeholder="e.g. Delhi"
                    className="w-full bg-[#050a14] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                    value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Commission % *</label>
                  <input required type="number" min="0" max="50" placeholder="10"
                    className="w-full bg-[#050a14] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                    value={form.commissionRate} onChange={e => setForm({ ...form, commissionRate: e.target.value })} />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Portal PIN *</label>
                  <input required type="text" maxLength={6} placeholder="1234"
                    className="w-full bg-[#050a14] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                    value={form.pinCode} onChange={e => setForm({ ...form, pinCode: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Notes (optional)</label>
                <textarea rows={2} placeholder="Any special agreements or notes..."
                  className="w-full bg-[#050a14] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                  value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>
              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-800 text-xs font-black text-slate-400 hover:text-white">Cancel</button>
                <button type="submit" disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-xs font-black text-white shadow-md active:scale-95 transition-all flex items-center gap-1.5">
                  {submitting ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  {submitting ? 'Registering...' : 'Register Agent'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: AGENT DETAIL ──────────────────────────────── */}
      {selectedAgent && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setSelectedAgent(null)}>
          <div className="w-full max-w-md bg-[#090f1e] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-white" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-violet-950/50 to-indigo-950/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600/30 to-indigo-600/30 border border-violet-500/20 flex items-center justify-center">
                  <span className="text-2xl font-black text-violet-300">{selectedAgent.name[0]}</span>
                </div>
                <div>
                  <p className="text-base font-black text-white">{selectedAgent.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] font-black text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full">
                      {selectedAgent.agentCode}
                    </span>
                    <button onClick={() => copyToClipboard(selectedAgent.agentCode, selectedAgent.id)}
                      className="p-0.5 text-slate-500 hover:text-white">
                      {copiedCode === selectedAgent.id ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                    </button>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedAgent(null)} className="p-1 text-slate-400 hover:text-white"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-950 rounded-xl p-3">
                  <span className="text-[9px] text-slate-500 uppercase font-bold block mb-0.5">Mobile</span>
                  <span className="font-bold text-white flex items-center gap-1"><Phone size={10} className="text-violet-400" />{selectedAgent.phone}</span>
                </div>
                <div className="bg-slate-950 rounded-xl p-3">
                  <span className="text-[9px] text-slate-500 uppercase font-bold block mb-0.5">Commission Rate</span>
                  <span className="font-black text-indigo-400 text-base">{selectedAgent.commissionRate}%</span>
                </div>
              </div>
              {selectedAgent.companyName && (
                <div className="bg-slate-950 rounded-xl p-3">
                  <span className="text-[9px] text-slate-500 uppercase font-bold block mb-0.5">Company</span>
                  <span className="font-bold text-white flex items-center gap-1"><Building size={10} className="text-violet-400" />{selectedAgent.companyName}</span>
                </div>
              )}
              <div className="bg-slate-950 rounded-xl p-3">
                <span className="text-[9px] text-slate-500 uppercase font-bold block mb-1">Portal Login Credentials</span>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-white font-bold">Code: {selectedAgent.agentCode}</span>
                    <span className="ml-3 text-slate-400">PIN: {showPins[selectedAgent.id] ? selectedAgent.pinCode : '••••'}</span>
                  </div>
                  <button onClick={() => setShowPins(p => ({ ...p, [selectedAgent.id]: !p[selectedAgent.id] }))}
                    className="text-slate-500 hover:text-white">
                    {showPins[selectedAgent.id] ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => handleToggleActive(selectedAgent)}
                  className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${selectedAgent.isActive ? 'bg-rose-900/40 border border-rose-800 text-rose-400 hover:bg-rose-600 hover:text-white' : 'bg-emerald-900/40 border border-emerald-800 text-emerald-400 hover:bg-emerald-600 hover:text-white'}`}>
                  {selectedAgent.isActive ? 'Deactivate Agent' : 'Reactivate Agent'}
                </button>
                <button onClick={() => { setSelectedAgent(null); window.open('/agent-portal', '_blank'); }}
                  className="flex-1 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-black text-white">
                  Open Agent Portal ↗
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Set Portal Password Modal ──────────────────────────────────── */}
      {showPwModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-sm bg-[#0d1222] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center">
                  <Shield size={16} className="text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm font-black text-white">Set Portal Password</p>
                  <p className="text-[9px] text-slate-500">{showPwModal.agent.name} · {showPwModal.agent.agentCode}</p>
                </div>
              </div>
              <button onClick={() => setShowPwModal(null)} className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white">
                <X size={14} />
              </button>
            </div>

            <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-xl p-3 text-[10px] text-indigo-300 font-bold">
              💡 Agent will use <span className="text-white">{showPwModal.agent.email || 'their registered email'}</span> + this password to login at <span className="text-white">/agent-portal</span>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-wider">New Portal Password</label>
              <input
                type="text"
                placeholder="Min 6 characters (e.g. hotel@2024)"
                className="w-full bg-[#050a14] border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 placeholder-slate-600"
                value={showPwModal.pw}
                onChange={e => setShowPwModal(m => m ? { ...m, pw: e.target.value } : null)}
              />
            </div>

            <button
              onClick={handleSetPortalPassword}
              disabled={settingPw || showPwModal.pw.length < 6}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-sm font-black text-white flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {settingPw ? <><Loader2 size={14} className="animate-spin" /> Setting...</> : <><CheckCircle2 size={14} /> Set Password & Enable Portal Access</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
