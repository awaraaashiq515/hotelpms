"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ChevronLeft, TrendingUp, Clock, Users, Package, BarChart2,
  RefreshCw, Truck, Star, AlertCircle, DollarSign, Zap, MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

const RANGES = [
  { key: '1d', label: 'Today' },
  { key: '7d', label: '7 Days' },
  { key: '30d', label: '30 Days' },
];

function StatCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-[#0d0f14]/80 border border-white/5 rounded-[1.75rem] p-5 flex flex-col gap-2 hover:border-white/10 transition-all">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color || 'bg-indigo-500/15 border border-indigo-500/20 text-indigo-400'}`}>
        {icon}
      </div>
      <div>
        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
        <p className="text-2xl font-black text-white leading-none mt-0.5">{value}</p>
        {sub && <p className="text-[10px] text-slate-500 font-bold mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

// Simple bar chart
function DailyBarChart({ data }: { data: { date: string; orders: number; delivered: number; revenue: number }[] }) {
  if (!data?.length) return <div className="h-32 flex items-center justify-center text-slate-600 text-xs">No data</div>;
  const maxOrders = Math.max(...data.map(d => d.orders), 1);
  return (
    <div className="flex items-end gap-1.5 h-32 w-full">
      {data.map(d => (
        <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group relative">
          <div
            className="w-full bg-indigo-500/60 hover:bg-indigo-500 rounded-t-lg transition-all cursor-pointer"
            style={{ height: `${(d.orders / maxOrders) * 100}%`, minHeight: 4 }}
          />
          <span className="text-[7px] text-slate-600 font-bold">
            {new Date(d.date).toLocaleDateString('en', { day: '2-digit', month: 'short' }).replace(' ', '')}
          </span>
          {/* Tooltip */}
          <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-10">
            <div className="bg-[#1e293b] border border-white/10 rounded-xl px-2.5 py-1.5 text-[9px] font-bold text-white whitespace-nowrap">
              📦 {d.orders} orders • ₹{Math.round(d.revenue)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DeliveryAnalyticsPage() {
  const router = useRouter();
  const params = useParams();
  const propertyCode = params?.propertyCode as string;
  const p = propertyCode ? `/${propertyCode}` : '';

  const [range, setRange] = useState('7d');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'riders' | 'items' | 'customers'>('overview');

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/delivery-analytics?range=${range}`);
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch { }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAnalytics(); }, [range]);

  const s = data?.summary;
  const maxRiderTrips = data?.riderStats?.[0]?.trips || 1;
  const maxItemQty = data?.topItems?.[0]?.qty || 1;

  return (
    <div className="flex flex-col min-h-full gap-5 p-5 rounded-3xl" style={{ background: 'radial-gradient(circle at top right, #0d0f1a, #050505 70%)' }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/5 p-4 rounded-3xl border border-white/10">
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm"
            onClick={() => router.push(`${p}/operations/delivery`)}
            className="rounded-2xl h-10 w-10 p-0 flex items-center justify-center bg-white/5 border-white/10 text-white/70 hover:bg-white/10">
            <ChevronLeft size={18} />
          </Button>
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <BarChart2 size={20} />
          </div>
          <div>
            <h1 className="text-lg font-black text-white tracking-tight">Delivery Analytics</h1>
            <p className="text-[9px] font-bold text-indigo-300/70 uppercase tracking-[0.2em]">Performance Dashboard</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Date range */}
          <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
            {RANGES.map(r => (
              <button key={r.key} onClick={() => setRange(r.key)}
                className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${range === r.key ? 'bg-indigo-500 text-white' : 'text-slate-500 hover:text-white'}`}>
                {r.label}
              </button>
            ))}
          </div>
          <Button variant="secondary" size="sm" onClick={fetchAnalytics}
            className="rounded-xl h-9 w-9 p-0 flex items-center justify-center bg-white/5 border-white/10">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex bg-black/40 p-1 rounded-2xl border border-white/5 gap-1">
        {[
          { id: 'overview', label: 'Overview', icon: <TrendingUp size={12} /> },
          { id: 'riders', label: 'Riders', icon: <Truck size={12} /> },
          { id: 'items', label: 'Top Items', icon: <Package size={12} /> },
          { id: 'customers', label: 'Customers', icon: <Users size={12} /> },
        ].map(tab => (
          <button key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-2.5 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 ${activeTab === tab.id ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-500 hover:text-white'}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 space-x-3">
          <div className="w-8 h-8 border-2 border-indigo-500/30 rounded-full animate-spin border-t-indigo-500" />
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Crunching numbers...</p>
        </div>
      ) : !data ? (
        <div className="text-center py-24 text-slate-500">No data available.</div>
      ) : (
        <>
          {/* ── OVERVIEW TAB ──────────────────────────────────────── */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* KPI Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={<Package size={18} />} label="Total Orders" value={s.totalOrders} sub={`${s.dateRange} range`} color="bg-indigo-500/15 border border-indigo-500/20 text-indigo-400" />
                <StatCard icon={<CheckCircle2 size={18} />} label="Delivered" value={s.delivered} sub={`${s.totalOrders > 0 ? Math.round((s.delivered / s.totalOrders) * 100) : 0}% success`} color="bg-emerald-500/15 border border-emerald-500/20 text-emerald-400" />
                <StatCard icon={<DollarSign size={18} />} label="Revenue" value={`₹${Math.round(s.totalRevenue)}`} sub={`Avg ₹${s.delivered > 0 ? Math.round(s.totalRevenue / s.delivered) : 0}/order`} color="bg-purple-500/15 border border-purple-500/20 text-purple-400" />
                <StatCard icon={<Clock size={18} />} label="Avg Delivery" value={`${s.avgDeliveryTime}m`} sub="Minutes per order" color="bg-amber-500/15 border border-amber-500/20 text-amber-400" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={<AlertCircle size={18} />} label="Cancellations" value={s.cancelled} sub={`${s.cancellationRate}% rate`} color="bg-red-500/15 border border-red-500/20 text-red-400" />
                <StatCard icon={<Users size={18} />} label="Customers" value={s.totalCustomers} sub={`${s.repeatCustomers} repeat`} color="bg-cyan-500/15 border border-cyan-500/20 text-cyan-400" />
                <StatCard icon={<Star size={18} />} label="Repeat Rate" value={`${s.repeatRate}%`} sub="Returning customers" color="bg-rose-500/15 border border-rose-500/20 text-rose-400" />
                <StatCard icon={<Zap size={18} />} label="Date Range" value={s.from} sub={`to ${s.to}`} color="bg-slate-500/15 border border-slate-500/20 text-slate-400" />
              </div>

              {/* Daily chart */}
              <div className="bg-[#0d0f14]/80 border border-white/5 rounded-[1.75rem] p-5 space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Daily Orders Chart</p>
                <DailyBarChart data={data.dailyStats} />
                <div className="flex items-center gap-3 text-[9px] font-bold text-slate-600 uppercase tracking-widest">
                  <span className="flex items-center gap-1"><span className="w-3 h-2 bg-indigo-500/60 rounded-sm inline-block" />Orders per day</span>
                </div>
              </div>
            </div>
          )}

          {/* ── RIDERS TAB ────────────────────────────────────────── */}
          {activeTab === 'riders' && (
            <div className="space-y-4">
              {data.riderStats?.length === 0 ? (
                <div className="text-center py-20 text-slate-500">No rider data for this period.</div>
              ) : (
                <div className="bg-[#0d0f14]/80 border border-white/5 rounded-[1.75rem] overflow-hidden">
                  <div className="grid grid-cols-4 gap-2 px-5 py-3 text-[8px] font-black uppercase tracking-widest text-slate-600 border-b border-white/5">
                    <span>Rider</span>
                    <span className="text-center">Trips</span>
                    <span className="text-center">Avg Time</span>
                    <span className="text-right">Revenue</span>
                  </div>
                  <div className="divide-y divide-white/5">
                    {data.riderStats.map((rider: any, i: number) => (
                      <div key={i} className="px-5 py-4 space-y-2 hover:bg-white/2 transition-all">
                        <div className="grid grid-cols-4 gap-2 items-center">
                          <div>
                            <p className="text-xs font-black text-white truncate">{rider.name}</p>
                            {i === 0 && <span className="text-[8px] font-black text-amber-400 uppercase tracking-widest">⭐ Top</span>}
                          </div>
                          <p className="text-center text-sm font-black text-indigo-400">{rider.trips}</p>
                          <p className="text-center text-xs font-black text-amber-400">{rider.avgTime}m</p>
                          <p className="text-right text-xs font-black text-emerald-400">₹{Math.round(rider.revenue)}</p>
                        </div>
                        <MiniBar value={rider.trips} max={maxRiderTrips} color="bg-indigo-500" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── ITEMS TAB ─────────────────────────────────────────── */}
          {activeTab === 'items' && (
            <div className="space-y-4">
              <div className="bg-[#0d0f14]/80 border border-white/5 rounded-[1.75rem] overflow-hidden">
                <div className="grid grid-cols-3 px-5 py-3 text-[8px] font-black uppercase tracking-widest text-slate-600 border-b border-white/5">
                  <span>Item</span>
                  <span className="text-center">Qty</span>
                  <span className="text-right">Revenue</span>
                </div>
                <div className="divide-y divide-white/5">
                  {data.topItems?.map((item: any, i: number) => (
                    <div key={i} className="px-5 py-4 space-y-2 hover:bg-white/2 transition-all">
                      <div className="grid grid-cols-3 items-center gap-2">
                        <div>
                          <p className="text-xs font-black text-white truncate">{item.name}</p>
                          {i === 0 && <span className="text-[8px] font-black text-rose-400 uppercase tracking-widest">🔥 Best Seller</span>}
                        </div>
                        <p className="text-center text-sm font-black text-purple-400">×{item.qty}</p>
                        <p className="text-right text-xs font-black text-emerald-400">₹{Math.round(item.revenue)}</p>
                      </div>
                      <MiniBar value={item.qty} max={maxItemQty} color="bg-purple-500" />
                    </div>
                  ))}
                  {data.topItems?.length === 0 && (
                    <div className="py-20 text-center text-slate-500 text-xs">No item data.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── CUSTOMERS TAB ─────────────────────────────────────── */}
          {activeTab === 'customers' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard icon={<Users size={18} />} label="Total Customers" value={s.totalCustomers} color="bg-cyan-500/15 border border-cyan-500/20 text-cyan-400" />
                <StatCard icon={<Star size={18} />} label="Repeat Customers" value={s.repeatCustomers} color="bg-rose-500/15 border border-rose-500/20 text-rose-400" />
                <StatCard icon={<TrendingUp size={18} />} label="Retention Rate" value={`${s.repeatRate}%`} sub="Customers who reordered" color="bg-emerald-500/15 border border-emerald-500/20 text-emerald-400" />
              </div>

              {/* Retention visual */}
              <div className="bg-[#0d0f14]/80 border border-white/5 rounded-[1.75rem] p-6 space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Retention Breakdown</p>
                <div className="space-y-3">
                  {[
                    { label: 'New Customers', value: s.totalCustomers - s.repeatCustomers, total: s.totalCustomers, color: 'bg-blue-500' },
                    { label: 'Returning Customers', value: s.repeatCustomers, total: s.totalCustomers, color: 'bg-emerald-500' },
                  ].map(row => (
                    <div key={row.label} className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-400">{row.label}</span>
                        <span className="text-xs font-black text-white">{row.value} <span className="text-slate-600 font-bold">({row.total > 0 ? Math.round((row.value / row.total) * 100) : 0}%)</span></span>
                      </div>
                      <MiniBar value={row.value} max={s.totalCustomers} color={row.color} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl px-5 py-4">
                <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">📊 Insight</p>
                <p className="text-xs text-slate-400 font-bold mt-1">
                  {s.repeatRate >= 50 ? '🎉 Excellent retention! More than half your customers reorder.' :
                   s.repeatRate >= 30 ? '✅ Good retention. Loyalty programs can push this higher.' :
                   '⚠️ Low repeat rate. Consider WhatsApp re-engagement campaigns.'}
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Helper for StatCard
function CheckCircle2({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="12" cy="12" r="10" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}
