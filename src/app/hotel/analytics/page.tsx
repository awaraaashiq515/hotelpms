'use client';
import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  IndianRupee,
  Download,
  RefreshCw,
  Sparkles,
  Calendar,
  Layers,
  Users,
  ShieldCheck,
  Building2,
  BedDouble,
  CheckCircle2,
  AlertCircle,
  Clock,
  Globe,
  FileSpreadsheet,
  ArrowUpRight,
  PieChart as PieIcon,
  Wrench,
  Sparkle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useAnalytics } from '@/hooks/hotel/useAnalytics';
import { OccupancyRing } from '@/components/hotel/ui/OccupancyRing';
import type { AnalyticsTimeRange, ReportItemMeta } from '@/types/hotel/analytics.types';
import { toast } from 'sonner';

function fmt(n: number) {
  return '₹' + Math.round(n || 0).toLocaleString('en-IN');
}

const REPORT_LIBRARY: ReportItemMeta[] = [
  {
    key: 'occupancy',
    label: 'Occupancy & ADR Report',
    desc: 'Daily, weekly, and monthly occupancy rates, ADR, and RevPAR matrix',
    category: 'Inventory',
    icon: '🏨',
  },
  {
    key: 'revenue',
    label: 'Comprehensive Revenue Report',
    desc: 'Full revenue split across Room stay, F&B room service, Spa, and Add-ons',
    category: 'Finance',
    icon: '💰',
  },
  {
    key: 'source',
    label: 'Booking Source & OTA Share',
    desc: 'Direct website vs Booking.com vs MMT vs Walk-in conversion volume',
    category: 'Distribution',
    icon: '🌐',
  },
  {
    key: 'guest',
    label: 'Guest Demographics & Nationality',
    desc: 'Guest origin distribution, corporate vs leisure splits, and ALOS',
    category: 'CRM',
    icon: '👥',
  },
  {
    key: 'housekeeping',
    label: 'Housekeeping KPI & Turnaround',
    desc: 'Room cleaning velocity, staff task completion rates, and ready status',
    category: 'Operations',
    icon: '🧹',
  },
  {
    key: 'maintenance',
    label: 'Maintenance Issues & Costs',
    desc: 'Room maintenance tickets, open issues, and resolution expenditure',
    category: 'Engineering',
    icon: '🔧',
  },
  {
    key: 'crm',
    label: 'CRM Loyalty & Guest Retention',
    desc: 'Repeat guest metrics, loyalty tier points issuance, and redemptions',
    category: 'Loyalty',
    icon: '⭐',
  },
  {
    key: 'forecast',
    label: 'AI 30-Day Predictive Forecast',
    desc: 'Machine learning demand curves, forward occupancy, and optimal pricing',
    category: 'Yield AI',
    icon: '⚡',
  },
];

export default function AnalyticsPage() {
  const {
    data,
    loading,
    generatingKey,
    timeRange,
    setTimeRange,
    refresh,
    generateAndDownloadReport,
    generateAndDownloadPDFReport,
  } = useAnalytics();

  const [activeTab, setActiveTab] = useState<'yield' | 'guests' | 'channels' | 'operations'>('yield');
  const [customDatePickerOpen, setCustomDatePickerOpen] = useState(false);
  const [startInput, setStartInput] = useState('');
  const [endInput, setEndInput] = useState('');

  const kpis = data?.kpis;
  const trends = data?.trends || [];
  const guestSegments = data?.guestSegments || [];
  const nationalities = data?.nationalities || [];
  const channelDistribution = data?.channelDistribution || [];
  const operations = data?.operations;
  const aiInsights = data?.aiInsights || [];

  const handleApplyCustomDates = () => {
    if (!startInput) {
      toast.error('Please select a start date');
      return;
    }
    setTimeRange('custom', startInput, endInput || startInput);
    setCustomDatePickerOpen(false);
  };

  return (
    <div className="space-y-6 pb-12 max-w-[1500px] mx-auto">
      {/* ── Top Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
            <BarChart3 size={14} className="text-indigo-400" />
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
              Business Intelligence · Deep Analytics & Reporting
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Hotel Analytics & BI
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time performance analytics, guest demographics, operational KPIs & downloadable audit reports
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Time Range Pills */}
          <div className="flex items-center bg-slate-900/80 p-1 rounded-2xl border border-white/10 shadow-inner">
            {[
              { id: 'today' as const, label: 'Today' },
              { id: '7d' as const, label: '7D' },
              { id: '30d' as const, label: '30D' },
              { id: 'month' as const, label: 'Month' },
              { id: 'year' as const, label: 'Year' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTimeRange(t.id)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition-all ${
                  timeRange === t.id
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}

            <button
              onClick={() => setCustomDatePickerOpen(!customDatePickerOpen)}
              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-black flex items-center gap-1 transition-all ${
                timeRange === 'custom'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calendar size={12} />
              <span>Custom</span>
            </button>
          </div>

          {/* Quick Export Master PDF */}
          <button
            onClick={() => generateAndDownloadPDFReport('occupancy')}
            disabled={Boolean(generatingKey)}
            className="h-10 px-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-rose-600/30 transition-all active:scale-95 disabled:opacity-50"
          >
            <Download size={14} />
            <span>Export PDF</span>
          </button>

          {/* Quick Export Master CSV */}
          <button
            onClick={() => generateAndDownloadReport('occupancy')}
            disabled={Boolean(generatingKey)}
            className="h-10 px-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all active:scale-95 disabled:opacity-50"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>

          {/* Refresh Page */}
          <button
            onClick={refresh}
            title="Refresh Analytics"
            className={`w-10 h-10 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-all ${
              loading ? 'animate-spin' : ''
            }`}
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Custom Date Range Picker */}
      {customDatePickerOpen && (
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-indigo-500/30 flex flex-wrap items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-bold">Start Date:</span>
            <input
              type="date"
              value={startInput}
              onChange={(e) => setStartInput(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 border border-white/10 text-white text-xs"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-bold">End Date:</span>
            <input
              type="date"
              value={endInput}
              onChange={(e) => setEndInput(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 border border-white/10 text-white text-xs"
            />
          </div>
          <button
            onClick={handleApplyCustomDates}
            className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-md transition-colors"
          >
            Apply Filter
          </button>
          <button
            onClick={() => setCustomDatePickerOpen(false)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-400 text-xs hover:text-white"
          >
            Cancel
          </button>
        </div>
      )}

      {/* ── KPI Summary Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {[
          {
            label: 'Occupancy Rate',
            value: `${kpis?.occupancyPct ?? 0}%`,
            subtext: `${operations?.occupiedRooms ?? 0} / ${operations?.totalRooms ?? 0} Rooms`,
            trend: '+5%',
            up: true,
            icon: BedDouble,
            color: 'from-emerald-500/20 via-emerald-900/10 to-slate-900/40',
            border: 'border-emerald-500/20',
            accent: 'text-emerald-400',
          },
          {
            label: 'Average Daily Rate',
            value: fmt(kpis?.adr ?? 0),
            subtext: 'Average revenue / sold night',
            trend: '+8%',
            up: true,
            icon: TrendingUp,
            color: 'from-indigo-500/20 via-indigo-900/10 to-slate-900/40',
            border: 'border-indigo-500/20',
            accent: 'text-indigo-400',
          },
          {
            label: 'RevPAR',
            value: fmt(kpis?.revpar ?? 0),
            subtext: 'Rev per available room',
            trend: '+12%',
            up: true,
            icon: Sparkles,
            color: 'from-sky-500/20 via-sky-900/10 to-slate-900/40',
            border: 'border-sky-500/20',
            accent: 'text-sky-400',
          },
          {
            label: 'Period Revenue',
            value: fmt(kpis?.totalRevenue ?? 0),
            subtext: `${(kpis?.growthVsPrevPeriod ?? 0) >= 0 ? '+' : ''}${kpis?.growthVsPrevPeriod ?? 0}% vs prev period`,
            trend: `${(kpis?.growthVsPrevPeriod ?? 0)}%`,
            up: (kpis?.growthVsPrevPeriod ?? 0) >= 0,
            icon: IndianRupee,
            color: 'from-violet-500/20 via-violet-900/10 to-slate-900/40',
            border: 'border-violet-500/20',
            accent: 'text-violet-400',
          },
          {
            label: 'Guest Satisfaction',
            value: `${kpis?.guestSatisfactionScore ?? 4.8} / 5.0`,
            subtext: `From ${kpis?.totalReviews ?? 64} guest reviews`,
            trend: '+0.3',
            up: true,
            icon: ShieldCheck,
            color: 'from-amber-500/20 via-amber-900/10 to-slate-900/40',
            border: 'border-amber-500/20',
            accent: 'text-amber-400',
          },
          {
            label: 'Repeat Guest Rate',
            value: `${kpis?.repeatGuestRate ?? 24}%`,
            subtext: `ALOS: ${kpis?.avgLengthOfStay ?? 1.6} Nights`,
            trend: '+4%',
            up: true,
            icon: Users,
            color: 'from-rose-500/20 via-rose-900/10 to-slate-900/40',
            border: 'border-rose-500/20',
            accent: 'text-rose-400',
          },
        ].map((s) => (
          <div
            key={s.label}
            className={`rounded-3xl bg-gradient-to-br ${s.color} border ${s.border} p-4 backdrop-blur-md shadow-lg`}
          >
            <div className="flex items-center justify-between mb-2">
              <s.icon size={15} className={s.accent} />
              <span
                className={`text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5 ${
                  s.up
                    ? 'text-emerald-300 bg-emerald-500/20 border border-emerald-500/30'
                    : 'text-rose-300 bg-rose-500/20 border border-rose-500/30'
                }`}
              >
                {s.up ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                {s.trend}
              </span>
            </div>
            <p className="text-xl sm:text-2xl font-black text-white tracking-tight">{s.value}</p>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mt-1">{s.label}</p>
            <p className="text-[9px] text-slate-500 mt-0.5">{s.subtext}</p>
          </div>
        ))}
      </div>

      {/* ── AI Automated Executive Insights ── */}
      <div className="rounded-3xl bg-slate-900/60 border border-white/10 p-5 backdrop-blur-md shadow-xl">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Sparkles size={14} />
          </div>
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-wider">
              AI Operational & Yield Intelligence
            </h3>
            <p className="text-[10px] text-slate-400">
              Automated pattern detection & actionable hotelier recommendations
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {aiInsights.map((insight) => (
            <div
              key={insight.id}
              className="p-3.5 rounded-2xl bg-slate-800/40 border border-white/5 flex flex-col justify-between hover:border-indigo-500/30 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[8px] font-black uppercase tracking-widest text-indigo-400">
                    {insight.category}
                  </span>
                  <span className="text-[8px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {insight.impact}
                  </span>
                </div>
                <h4 className="text-xs font-black text-white mb-1">{insight.title}</h4>
                <p className="text-[10px] text-slate-400 leading-relaxed">{insight.description}</p>
              </div>

              {insight.actionPrompt && (
                <div className="mt-3 pt-2 border-t border-white/5 flex items-center gap-1 text-[9px] font-bold text-indigo-300">
                  <ArrowUpRight size={10} />
                  <span className="truncate">{insight.actionPrompt}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Multi-Tab Deep Analytics Dashboard ── */}
      <div className="space-y-4">
        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-900/80 p-1 rounded-2xl border border-white/10 w-fit">
          {[
            { id: 'yield' as const, label: 'Revenue & Occupancy Yield' },
            { id: 'guests' as const, label: 'Guest Demographics' },
            { id: 'channels' as const, label: 'Channel & Acquisition' },
            { id: 'operations' as const, label: 'Operations & Maintenance' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Yield Trends */}
        {activeTab === 'yield' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            {/* Chart Area (2 Cols) */}
            <div className="xl:col-span-2 rounded-3xl bg-slate-900/60 border border-white/10 p-5 backdrop-blur-md shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">
                    Yield Curve: Revenue vs Occupancy %
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Daily trendline correlation across the selected period
                  </p>
                </div>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={trends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                    <XAxis dataKey="dayLabel" stroke="#64748B" fontSize={10} tickLine={false} />
                    <YAxis yAxisId="left" stroke="#64748B" fontSize={10} tickLine={false} unit="%" />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="#64748B"
                      fontSize={10}
                      tickLine={false}
                      tickFormatter={(v) => `₹${v >= 1000 ? Math.round(v / 1000) + 'k' : v}`}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: 16 }}
                      formatter={(v: unknown) => [typeof v === 'number' && v > 100 ? fmt(v) : `${v}%`, '']}
                    />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                    <Bar yAxisId="right" dataKey="revenue" name="Total Revenue (₹)" fill="#6366F1" radius={[6, 6, 0, 0]} opacity={0.7} />
                    <Line yAxisId="left" type="monotone" dataKey="occupancy" name="Occupancy %" stroke="#10B981" strokeWidth={3} dot={{ r: 3 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Room Status Breakdown (1 Col) */}
            <div className="rounded-3xl bg-slate-900/60 border border-white/10 p-5 backdrop-blur-md shadow-xl flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider mb-1">
                  Live Room Status Breakdown
                </h3>
                <p className="text-[10px] text-slate-400 mb-4">
                  Current property inventory condition & housekeeping readiness
                </p>

                <div className="space-y-3">
                  {[
                    { label: 'Occupied Stay', count: operations?.occupiedRooms ?? 0, color: 'bg-rose-500' },
                    { label: 'Vacant Clean (Ready)', count: operations?.vacantCleanRooms ?? 0, color: 'bg-emerald-500' },
                    { label: 'Vacant Dirty', count: operations?.vacantDirtyRooms ?? 0, color: 'bg-amber-500' },
                    { label: 'Inspection / Progress', count: operations?.inspectionPendingRooms ?? 0, color: 'bg-indigo-500' },
                    { label: 'Out of Order (OOO)', count: operations?.outOfOrderRooms ?? 0, color: 'bg-slate-600' },
                  ].map((r) => {
                    const total = operations?.totalRooms || 1;
                    const pct = Math.round((r.count / total) * 100);
                    return (
                      <div key={r.label}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-slate-400 font-bold">{r.label}</span>
                          <span className="font-black text-white">
                            {r.count} <span className="text-slate-500">({pct}%)</span>
                          </span>
                        </div>
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className={`h-full ${r.color} rounded-full`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                <span className="text-slate-400">Total Rooms:</span>
                <span className="font-black text-white">{operations?.totalRooms ?? 0} Keys</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Guest Demographics */}
        {activeTab === 'guests' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* Guest Segmentation Pie */}
            <div className="rounded-3xl bg-slate-900/60 border border-white/10 p-5 backdrop-blur-md shadow-xl">
              <h3 className="text-sm font-black text-white uppercase tracking-wider mb-1">
                Guest Persona & Segmentation
              </h3>
              <p className="text-[10px] text-slate-400 mb-4">
                Breakdown by traveler purpose & revenue contribution
              </p>

              <div className="h-60 flex flex-col sm:flex-row items-center justify-around gap-4">
                <ResponsiveContainer width="50%" height="100%">
                  <PieChart>
                    <Pie data={guestSegments} dataKey="count" nameKey="type" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3}>
                      {guestSegments.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: 16 }} />
                  </PieChart>
                </ResponsiveContainer>

                <div className="space-y-2.5 w-full sm:w-1/2 pr-2">
                  {guestSegments.map((g) => (
                    <div key={g.type} className="text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: g.color }} />
                          <span className="text-white font-bold">{g.type}</span>
                        </div>
                        <span className="font-black text-slate-300">{g.percentage}%</span>
                      </div>
                      <p className="text-[10px] text-slate-500 ml-4.5 mt-0.5">
                        {fmt(g.revenue)} revenue · {g.count} bookings
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Nationality Distribution */}
            <div className="rounded-3xl bg-slate-900/60 border border-white/10 p-5 backdrop-blur-md shadow-xl flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider mb-1">
                  Nationality & Geographic Origin
                </h3>
                <p className="text-[10px] text-slate-400 mb-4">
                  Domestic vs International guest volume distribution
                </p>

                <div className="space-y-3">
                  {nationalities.map((n) => (
                    <div key={n.code}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-300 font-bold">{n.country}</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-500 font-mono">
                            {n.code}
                          </span>
                        </div>
                        <span className="font-black text-white">
                          {n.count} <span className="text-slate-500">({n.percentage}%)</span>
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${n.percentage}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                <span className="text-slate-400">Domestic vs International Ratio:</span>
                <span className="font-black text-emerald-400">72% Domestic · 28% International</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Channels & Acquisition */}
        {activeTab === 'channels' && (
          <div className="rounded-3xl bg-slate-900/60 border border-white/10 p-5 backdrop-blur-md shadow-xl">
            <h3 className="text-sm font-black text-white uppercase tracking-wider mb-1">
              Booking Acquisition Channels & Commission Audit
            </h3>
            <p className="text-[10px] text-slate-400 mb-4">
              Channel share, average ADR, and conversion performance
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/5 bg-slate-900/40">
                    {['Channel / Source', 'Bookings', 'Share (%)', 'Period Revenue', 'Avg ADR', 'Commission Impact'].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {channelDistribution.map((c) => (
                    <tr key={c.channel} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-4 font-black text-white flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                        <span>{c.channel}</span>
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-300">{c.bookings}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${c.sharePct}%` }} />
                          </div>
                          <span className="font-bold text-white">{c.sharePct}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-black text-emerald-400">{fmt(c.revenue)}</td>
                      <td className="px-5 py-4 font-bold text-slate-300">{fmt(c.avgAdr)}</td>
                      <td className="px-5 py-4">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          c.channel.includes('Direct') || c.channel.includes('Walk')
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {c.channel.includes('Direct') || c.channel.includes('Walk') ? '0% (Direct Yield)' : '15-18% OTA Fee'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Operations & Maintenance */}
        {activeTab === 'operations' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Housekeeping Efficiency</span>
                <span className="text-xs font-black text-emerald-400">96% On-Time</span>
              </div>
              <p className="text-2xl font-black text-white">{operations?.housekeepingTasksCompleted ?? 0} Tasks</p>
              <p className="text-[10px] text-slate-500 mt-1">Average cleaning time: {operations?.housekeepingAvgMinutes ?? 28} mins</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Maintenance Resolution</span>
                <span className="text-xs font-black text-blue-400">88% Resolved</span>
              </div>
              <p className="text-2xl font-black text-white">{operations?.maintenanceTicketsResolved ?? 0} Fixed</p>
              <p className="text-[10px] text-slate-500 mt-1">{operations?.maintenanceTicketsOpen ?? 0} currently open</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Average Length of Stay</span>
                <span className="text-xs font-black text-indigo-400">ALOS</span>
              </div>
              <p className="text-2xl font-black text-white">{kpis?.avgLengthOfStay ?? 1.6} Nights</p>
              <p className="text-[10px] text-slate-500 mt-1">Across all room types</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Average Booking Value</span>
                <span className="text-xs font-black text-emerald-400">Gross</span>
              </div>
              <p className="text-2xl font-black text-white">{fmt(kpis?.avgBookingValue ?? 0)}</p>
              <p className="text-[10px] text-slate-500 mt-1">Average spend per reservation</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Report Generator Library ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <FileSpreadsheet size={15} className="text-indigo-400" />
              <h2 className="text-sm font-black text-white uppercase tracking-wider">
                Audit Report Generator Library
              </h2>
            </div>
            <p className="text-[10px] text-slate-400">
              Download formatted audit spreadsheets & CSV exports for accounting, tax & revenue management
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {REPORT_LIBRARY.map((r) => {
            const isGenerating = generatingKey === r.key;
            return (
              <div
                key={r.key}
                className="rounded-3xl bg-slate-900/60 border border-white/10 p-4.5 flex flex-col justify-between hover:border-indigo-500/40 hover:shadow-lg transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{r.icon}</span>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-lg bg-slate-800 text-slate-400 border border-white/5">
                      {r.category}
                    </span>
                  </div>
                  <h3 className="text-xs font-black text-white mb-1">{r.label}</h3>
                  <p className="text-[10px] text-slate-400 leading-relaxed mb-4">{r.desc}</p>
                </div>

                <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-white/5">
                  <button
                    onClick={() => generateAndDownloadPDFReport(r.key)}
                    disabled={isGenerating}
                    className="h-8 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 shadow-sm disabled:opacity-40"
                    title="Download PDF format"
                  >
                    <Download size={10} />
                    <span>PDF</span>
                  </button>

                  <button
                    onClick={() => generateAndDownloadReport(r.key)}
                    disabled={isGenerating}
                    className="h-8 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 shadow-md shadow-indigo-600/30 disabled:opacity-40"
                    title="Download CSV spreadsheet"
                  >
                    <Download size={10} />
                    <span>CSV</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
