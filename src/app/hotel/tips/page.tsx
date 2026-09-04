'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  IndianRupee, Heart, CheckCircle, XCircle, Clock,
  TrendingUp, Users, Calendar, Filter, Search,
  ChevronDown, RefreshCw, Download
} from 'lucide-react';
import { toast, Toaster } from 'sonner';

interface TipTransaction {
  id: string;
  amount: number;
  status: string;
  upiRef: string | null;
  guestName: string | null;
  guestPhone: string | null;
  note: string | null;
  createdAt: string;
  staffMember: { id: string; name: string; designation: string; upiId: string | null };
  guest: { id: string; firstName: string; lastName: string | null; mobile: string | null } | null;
}

interface StaffSummary {
  id: string;
  name: string;
  designation: string;
  totalTips: number;
  confirmedTips: number;
  tipCount: number;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  CONFIRMED: 'text-green-400 bg-green-400/10 border-green-400/20',
  FAILED: 'text-red-400 bg-red-400/10 border-red-400/20',
};

export default function AdminTipsPage() {
  const [tips, setTips] = useState<TipTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [propertyId, setPropertyId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterStaff, setFilterStaff] = useState('');
  const [search, setSearch] = useState('');
  const [totalAmount, setTotalAmount] = useState(0);
  const [confirmedAmount, setConfirmedAmount] = useState(0);
  const [tab, setTab] = useState<'transactions' | 'staff-summary'>('transactions');

  useEffect(() => {
    const stored = localStorage.getItem('propertyId') || localStorage.getItem('property_id') || '';
    setPropertyId(stored);
  }, []);

  const fetchTips = useCallback(async () => {
    if (!propertyId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ propertyId });
      if (filterStatus) params.set('status', filterStatus);
      const res = await fetch(`/api/tips?${params}`);
      const data = await res.json();
      if (data.success) {
        setTips(data.tips);
        setTotalAmount(data.totalAmount);
        setConfirmedAmount(data.confirmedAmount);
      }
    } catch {
      toast.error('Failed to load tips');
    } finally {
      setLoading(false);
    }
  }, [propertyId, filterStatus]);

  useEffect(() => { fetchTips(); }, [fetchTips]);

  async function handleUpdateStatus(id: string, status: 'CONFIRMED' | 'FAILED') {
    try {
      const res = await fetch(`/api/tips/${id}/confirm`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Tip ${status === 'CONFIRMED' ? 'confirmed' : 'rejected'}`);
        fetchTips();
      }
    } catch {
      toast.error('Failed to update tip');
    }
  }

  // Staff summary calculation
  const staffSummary: StaffSummary[] = Object.values(
    tips.reduce<Record<string, StaffSummary>>((acc, tip) => {
      const sid = tip.staffMember.id;
      if (!acc[sid]) {
        acc[sid] = { id: sid, name: tip.staffMember.name, designation: tip.staffMember.designation, totalTips: 0, confirmedTips: 0, tipCount: 0 };
      }
      if (tip.status !== 'FAILED') {
        acc[sid].totalTips += tip.amount;
        acc[sid].tipCount += 1;
      }
      if (tip.status === 'CONFIRMED') acc[sid].confirmedTips += tip.amount;
      return acc;
    }, {})
  ).sort((a, b) => b.totalTips - a.totalTips);

  const filtered = tips.filter(t => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      t.staffMember.name.toLowerCase().includes(q) ||
      (t.guestName || '').toLowerCase().includes(q) ||
      (t.guest?.firstName || '').toLowerCase().includes(q) ||
      (t.upiRef || '').includes(q)
    );
  }).filter(t => !filterStaff || t.staffMember.id === filterStaff);

  const pendingCount = tips.filter(t => t.status === 'PENDING').length;

  return (
    <>
      <Toaster richColors position="top-right" />
      <div className="min-h-screen bg-[#030712] p-4 md:p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <Heart className="w-4.5 h-4.5 text-white fill-white" size={18} />
              </div>
              <h1 className="text-xl font-black text-white">Tips Dashboard</h1>
            </div>
            <p className="text-slate-400 text-xs ml-11">Staff gratuity management</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchTips}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-700 hover:border-slate-600 text-slate-400 hover:text-white text-xs font-semibold transition-all"
            >
              <RefreshCw size={13} /> Refresh
            </button>
            <button
              onClick={() => {
                const csv = ['Date,Staff,Role,Guest,Amount,Status,UPI Ref']
                  .concat(tips.map(t => `${new Date(t.createdAt).toLocaleDateString()},${t.staffMember.name},${t.staffMember.designation},${t.guestName || t.guest?.firstName || 'Anonymous'},${t.amount},${t.status},${t.upiRef || ''}`))
                  .join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = url; a.download = 'tips_report.csv'; a.click();
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all border border-slate-700"
            >
              <Download size={13} /> Export CSV
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total Tips', value: `₹${totalAmount.toLocaleString('en-IN')}`, icon: IndianRupee, color: 'from-amber-500 to-orange-600', shadow: 'shadow-amber-500/20' },
            { label: 'Confirmed', value: `₹${confirmedAmount.toLocaleString('en-IN')}`, icon: CheckCircle, color: 'from-green-500 to-emerald-600', shadow: 'shadow-green-500/20' },
            { label: 'Pending Review', value: pendingCount.toString(), icon: Clock, color: 'from-violet-500 to-purple-600', shadow: 'shadow-violet-500/20' },
            { label: 'Staff Tipped', value: staffSummary.length.toString(), icon: Users, color: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/20' },
          ].map(({ label, value, icon: Icon, color, shadow }) => (
            <div key={label} className="bg-[#0f172a] border border-slate-800/80 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center shadow-lg ${shadow}`}>
                  <Icon size={14} className="text-white" />
                </div>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{label}</p>
              </div>
              <p className="text-2xl font-black text-white">{value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-slate-900/50 p-1 rounded-xl w-fit border border-slate-800">
          {(['transactions', 'staff-summary'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${tab === t ? 'bg-amber-500 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              {t === 'transactions' ? '📋 Transactions' : '👤 Staff Summary'}
            </button>
          ))}
        </div>

        {/* Filters */}
        {tab === 'transactions' && (
          <div className="flex gap-2 flex-wrap mb-4">
            <div className="relative flex-1 min-w-48">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text" placeholder="Search staff, guest, UPI ref..."
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-slate-900/60 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-amber-500 placeholder:text-slate-600 transition-colors"
              />
            </div>
            <div className="relative">
              <Filter size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <select
                value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                className="pl-8 pr-8 py-2.5 rounded-xl bg-slate-900/60 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-amber-500 appearance-none transition-colors"
              >
                <option value="">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="FAILED">Failed</option>
              </select>
              <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>
            <div className="relative">
              <Users size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <select
                value={filterStaff} onChange={e => setFilterStaff(e.target.value)}
                className="pl-8 pr-8 py-2.5 rounded-xl bg-slate-900/60 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-amber-500 appearance-none transition-colors"
              >
                <option value="">All Staff</option>
                {staffSummary.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>
          </div>
        )}

        {/* Transactions Table */}
        {tab === 'transactions' && (
          <div className="bg-[#0f172a] border border-slate-800/80 rounded-2xl overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <RefreshCw className="w-6 h-6 text-amber-400 animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20">
                <Heart className="w-10 h-10 text-slate-700 mx-auto mb-3 fill-slate-700" />
                <p className="text-slate-400 font-semibold">No tips yet</p>
                <p className="text-slate-600 text-xs mt-1">Enable tipping in Settings to start receiving tips</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-800/60">
                      {['Date', 'Staff', 'Guest', 'Amount', 'UPI Ref', 'Status', 'Actions'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(tip => (
                      <tr key={tip.id} className="border-b border-slate-800/40 hover:bg-slate-800/20 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={11} className="text-slate-600" />
                            <span className="text-slate-300 text-xs">{new Date(tip.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                          </div>
                          <p className="text-slate-600 text-[10px] mt-0.5">{new Date(tip.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            {(tip.staffMember as any).avatarUrl || (tip.staffMember as any).user?.avatarUrl ? (
                              <img
                                src={(tip.staffMember as any).avatarUrl || (tip.staffMember as any).user?.avatarUrl}
                                alt={tip.staffMember.name}
                                className="w-8 h-8 rounded-xl object-cover flex-shrink-0 shadow-sm border border-amber-500/30"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                                <span className="text-amber-400 text-xs font-black">{tip.staffMember.name[0]}</span>
                              </div>
                            )}
                            <div>
                              <p className="text-white font-semibold text-xs">{tip.staffMember.name}</p>
                              <p className="text-slate-500 text-[10px]">{tip.staffMember.designation}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="text-slate-300 text-xs">
                            {tip.guest ? `${tip.guest.firstName} ${tip.guest.lastName || ''}` : tip.guestName || 'Anonymous'}
                          </p>
                          {(tip.guest?.mobile || tip.guestPhone) && (
                            <p className="text-slate-600 text-[10px]">{tip.guest?.mobile || tip.guestPhone}</p>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="text-amber-400 font-black text-sm">₹{tip.amount.toLocaleString('en-IN')}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="text-slate-400 text-xs font-mono">{tip.upiRef || '—'}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${STATUS_COLORS[tip.status]}`}>
                            {tip.status === 'PENDING' && <Clock size={9} />}
                            {tip.status === 'CONFIRMED' && <CheckCircle size={9} />}
                            {tip.status === 'FAILED' && <XCircle size={9} />}
                            {tip.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          {tip.status === 'PENDING' && (
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => handleUpdateStatus(tip.id, 'CONFIRMED')}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-green-500/15 hover:bg-green-500/25 text-green-400 text-[10px] font-bold transition-colors border border-green-500/20"
                              >
                                <CheckCircle size={10} /> Confirm
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(tip.id, 'FAILED')}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-400 text-[10px] font-bold transition-colors border border-red-500/20"
                              >
                                <XCircle size={10} /> Reject
                              </button>
                            </div>
                          )}
                          {tip.status !== 'PENDING' && <span className="text-slate-600 text-xs">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Staff Summary */}
        {tab === 'staff-summary' && (
          <div className="bg-[#0f172a] border border-slate-800/80 rounded-2xl overflow-hidden">
            {staffSummary.length === 0 ? (
              <div className="text-center py-20">
                <Users className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-400 font-semibold">No tip data yet</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/60">
                {staffSummary.map((s, i) => (
                  <div key={s.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-800/20 transition-colors">
                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-500/10 text-amber-400 text-xs font-black flex-shrink-0">
                      {i + 1}
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-amber-400 font-black">{s.name[0]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-sm">{s.name}</p>
                      <p className="text-slate-400 text-xs">{s.designation} · {s.tipCount} tips</p>
                    </div>
                    <div className="text-right">
                      <p className="text-amber-400 font-black text-lg">₹{s.totalTips.toLocaleString('en-IN')}</p>
                      <p className="text-green-400 text-[10px]">₹{s.confirmedTips.toLocaleString('en-IN')} confirmed</p>
                    </div>
                    <div className="w-24 bg-slate-800 rounded-full h-1.5 ml-2">
                      <div
                        className="h-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 transition-all"
                        style={{ width: `${Math.min(100, (s.totalTips / (staffSummary[0]?.totalTips || 1)) * 100)}%` }}
                      />
                    </div>
                    <TrendingUp size={14} className="text-amber-400/50" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
