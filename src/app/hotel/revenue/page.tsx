'use client';
import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  IndianRupee,
  BarChart3,
  Percent,
  RefreshCw,
  Zap,
  Sliders,
  Plus,
  Calendar,
  Download,
  Sparkles,
  Calculator,
  Building2,
  Layers,
  Globe,
  Coffee,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  BedDouble,
  ChevronRight,
  Filter,
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
import { useRevenue } from '@/hooks/hotel/useRevenue';
import { OccupancyRing } from '@/components/hotel/ui/OccupancyRing';
import { DynamicPricingRuleModal } from '@/components/hotel/revenue/DynamicPricingRuleModal';
import { DynamicRateSimulatorModal } from '@/components/hotel/revenue/DynamicRateSimulatorModal';
import type { TimeRangeFilter, DynamicPricingRule } from '@/types/hotel/revenue.types';
import { toast } from 'sonner';

function fmt(n: number) {
  return '₹' + Math.round(n || 0).toLocaleString('en-IN');
}

function fmtCompact(n: number) {
  if (n >= 10000000) return '₹' + (n / 10000000).toFixed(1) + ' Cr';
  if (n >= 100000) return '₹' + (n / 100000).toFixed(1) + ' L';
  if (n >= 1000) return '₹' + (n / 1000).toFixed(1) + 'k';
  return '₹' + Math.round(n);
}

export default function RevenuePage() {
  const {
    metrics,
    trends,
    roomTypeBreakdown,
    channelBreakdown,
    ancillaryBreakdown,
    forecastDays,
    pricingRules,
    timeRange,
    customStartDate,
    customEndDate,
    loading,
    refresh,
    setTimeRange,
    createRule,
    updateRule,
    toggleRule,
    deleteRule,
    simulateRate,
  } = useRevenue();

  // Active tabs
  const [activeChartTab, setActiveChartTab] = useState<'revenue' | 'occupancy' | 'channels' | 'ancillary'>('revenue');
  const [forecastViewDays, setForecastViewDays] = useState<7 | 14>(7);

  // Modals state
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<DynamicPricingRule | null>(null);
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [customDatePickerOpen, setCustomDatePickerOpen] = useState(false);
  const [startInput, setStartInput] = useState('');
  const [endInput, setEndInput] = useState('');

  // Rules filtering
  const [ruleTypeFilter, setRuleTypeFilter] = useState<string>('ALL');

  const filteredRules = pricingRules.filter((r) => {
    if (ruleTypeFilter === 'ALL') return true;
    if (ruleTypeFilter === 'ACTIVE') return r.isActive;
    if (ruleTypeFilter === 'INACTIVE') return !r.isActive;
    return r.ruleType === ruleTypeFilter;
  });

  // Export CSV
  const handleExportCSV = async () => {
    if (!trends.length) {
      toast.error('No revenue data available to export');
      return;
    }
    const headers = ['Date', 'Day', 'Room Revenue (INR)', 'Ancillary Revenue (INR)', 'Total Revenue (INR)', 'Occupancy (%)', 'ADR (INR)', 'RevPAR (INR)', 'Occupied Rooms'];
    const rows = trends.map((t) => [
      t.date,
      t.dayLabel,
      t.roomRevenue,
      t.ancillaryRevenue,
      t.totalRevenue,
      `${t.occupancy}%`,
      t.adr,
      t.revpar,
      t.occupiedRooms,
    ]);

    const { exportHotelCSV } = await import('@/lib/export-utils');
    exportHotelCSV(
      headers,
      rows,
      `hotel_revenue_report_${timeRange}_${new Date().toISOString().split('T')[0]}`,
      'Hotel Revenue & Yield Management Report',
      {
        hotelName: 'Grand Luxury Hotel & Resort',
        generatedBy: 'Admin / Revenue Manager',
        dateRangeFormatted: `Period: ${timeRange.toUpperCase()}`,
        summaryCards: [
          { label: 'Period Revenue', value: fmt(metrics?.periodRevenue ?? 0) },
          { label: 'Average ADR', value: fmt(metrics?.adr ?? 0) },
          { label: 'RevPAR', value: fmt(metrics?.revpar ?? 0) },
          { label: 'Occupancy', value: `${metrics?.occupancyPct ?? 0}%` },
        ],
      }
    );
    toast.success('Revenue report CSV downloaded successfully!');
  };

  const handleExportPDF = async () => {
    if (!trends || trends.length === 0) {
      toast.error('No revenue data available to export');
      return;
    }

    const headers = ['Date', 'Day', 'Room Rev (INR)', 'Ancillary (INR)', 'Total Gross (INR)', 'Occ (%)', 'ADR (INR)', 'RevPAR (INR)'];
    const rows = trends.map((t) => [
      t.date,
      t.dayLabel,
      t.roomRevenue,
      t.ancillaryRevenue,
      t.totalRevenue,
      `${t.occupancy}%`,
      t.adr,
      t.revpar,
    ]);

    const { exportHotelPDF } = await import('@/lib/export-utils');
    exportHotelPDF(
      headers,
      rows,
      `hotel_revenue_report_${timeRange}_${new Date().toISOString().split('T')[0]}`,
      'Hotel Revenue & Yield Management Report',
      {
        hotelName: 'Grand Luxury Hotel & Resort',
        hotelAddress: 'Revenue & Yield Optimization System',
        generatedBy: 'Admin / Revenue Manager',
        dateRangeFormatted: `Period: ${timeRange.toUpperCase()}`,
        summaryCards: [
          { label: 'Period Revenue', value: fmt(metrics?.periodRevenue ?? 0) },
          { label: 'Average ADR', value: fmt(metrics?.adr ?? 0) },
          { label: 'RevPAR', value: fmt(metrics?.revpar ?? 0) },
          { label: 'Occupancy', value: `${metrics?.occupancyPct ?? 0}%` },
        ],
      }
    );
    toast.success('Revenue report PDF downloaded successfully!');
  };

  const handleApplyCustomDates = () => {
    if (!startInput) {
      toast.error('Please select a start date');
      return;
    }
    setTimeRange('custom', startInput, endInput || startInput);
    setCustomDatePickerOpen(false);
  };

  const displayedForecast = forecastDays.slice(0, forecastViewDays);

  return (
    <div className="space-y-6 pb-12 max-w-[1500px] mx-auto">
      {/* ── Top Header & Control Bar ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <TrendingUp size={14} className="text-emerald-400" />
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
              Revenue Intelligence & Dynamic Pricing Engine
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Revenue Management
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time multi-channel yields, ADR/RevPAR optimization & automated demand pricing
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Time Range Pills */}
          <div className="flex items-center bg-slate-900/80 p-1 rounded-2xl border border-white/10 shadow-inner">
            {[
              { id: 'today', label: 'Today' },
              { id: '7d', label: '7D' },
              { id: '30d', label: '30D' },
              { id: 'month', label: 'Month' },
              { id: 'year', label: 'Year' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTimeRange(t.id as TimeRangeFilter)}
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

          {/* Rate Simulator Button */}
          <button
            onClick={() => setSimulatorOpen(true)}
            className="h-10 px-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
          >
            <Calculator size={14} />
            <span>Rate Simulator</span>
          </button>

          {/* Add Rule Button */}
          <button
            onClick={() => {
              setEditingRule(null);
              setRuleModalOpen(true);
            }}
            className="h-10 px-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
          >
            <Plus size={14} />
            <span>New Pricing Rule</span>
          </button>

          {/* Export PDF Report */}
          <button
            onClick={handleExportPDF}
            title="Export PDF Report"
            className="h-10 px-3 rounded-2xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-black flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
          >
            <Download size={13} />
            <span>PDF</span>
          </button>

          {/* Export CSV Report */}
          <button
            onClick={handleExportCSV}
            title="Export CSV Report"
            className="h-10 px-3 rounded-2xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-black flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
          >
            <Download size={13} />
            <span>CSV</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={refresh}
            title="Refresh Data"
            className={`w-10 h-10 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-all ${
              loading ? 'animate-spin' : ''
            }`}
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Custom Date Range Picker Dropdown */}
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

      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {[
          {
            label: timeRange === 'today' ? 'Revenue Today' : 'Period Revenue',
            value: fmt(metrics?.periodRevenue ?? metrics?.revenueMonth ?? 0),
            subtext: `${(metrics?.growthPct ?? 0) >= 0 ? '+' : ''}${metrics?.growthPct ?? 0}% vs prev period`,
            up: (metrics?.growthPct ?? 0) >= 0,
            icon: IndianRupee,
            gradient: 'from-emerald-500/20 via-emerald-900/10 to-slate-900/40',
            accent: 'text-emerald-400',
            border: 'border-emerald-500/20',
          },
          {
            label: 'Revenue Today',
            value: fmt(metrics?.revenueToday ?? 0),
            subtext: `Yesterday: ${fmt(metrics?.revenueYesterday ?? 0)}`,
            up: (metrics?.revenueToday ?? 0) >= (metrics?.revenueYesterday ?? 0),
            icon: BarChart3,
            gradient: 'from-indigo-500/20 via-indigo-900/10 to-slate-900/40',
            accent: 'text-indigo-400',
            border: 'border-indigo-500/20',
          },
          {
            label: 'ADR (Average Daily Rate)',
            value: fmt(metrics?.adr ?? 0),
            subtext: 'Average rate per sold room',
            up: true,
            icon: TrendingUp,
            gradient: 'from-sky-500/20 via-sky-900/10 to-slate-900/40',
            accent: 'text-sky-400',
            border: 'border-sky-500/20',
          },
          {
            label: 'RevPAR',
            value: fmt(metrics?.revpar ?? 0),
            subtext: 'Revenue per available room',
            up: true,
            icon: Zap,
            gradient: 'from-violet-500/20 via-violet-900/10 to-slate-900/40',
            accent: 'text-violet-400',
            border: 'border-violet-500/20',
          },
          {
            label: 'TRevPAR',
            value: fmt(metrics?.trevpar ?? 0),
            subtext: 'Total room + ancillary yield',
            up: true,
            icon: Layers,
            gradient: 'from-amber-500/20 via-amber-900/10 to-slate-900/40',
            accent: 'text-amber-400',
            border: 'border-amber-500/20',
          },
          {
            label: 'GOPPAR',
            value: fmt(metrics?.goppar ?? 0),
            subtext: 'Gross operating profit per room',
            up: true,
            icon: Sparkles,
            gradient: 'from-rose-500/20 via-rose-900/10 to-slate-900/40',
            accent: 'text-rose-400',
            border: 'border-rose-500/20',
          },
        ].map((k) => (
          <div
            key={k.label}
            className={`rounded-3xl bg-gradient-to-br ${k.gradient} border ${k.border} p-4 relative overflow-hidden backdrop-blur-md shadow-lg group hover:scale-[1.02] transition-transform`}
          >
            <div className="flex items-center justify-between mb-2">
              <k.icon size={15} className={k.accent} />
              {k.subtext.includes('%') && (
                <span
                  className={`text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5 ${
                    k.up
                      ? 'text-emerald-300 bg-emerald-500/20 border border-emerald-500/30'
                      : 'text-rose-300 bg-rose-500/20 border border-rose-500/30'
                  }`}
                >
                  {k.up ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                  {k.subtext.split(' ')[0]}
                </span>
              )}
            </div>
            <p className="text-xl sm:text-2xl font-black text-white tracking-tight">{k.value}</p>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mt-1">{k.label}</p>
            <p className="text-[9px] text-slate-500 mt-0.5">{k.subtext}</p>
          </div>
        ))}
      </div>

      {/* ── Secondary Quick Metrics Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl bg-slate-900/60 border border-white/5 p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase text-slate-400">Current Occupancy</p>
            <p className="text-lg font-black text-white mt-0.5">{metrics?.occupancyPct ?? 0}%</p>
            <p className="text-[9px] text-slate-500">
              {metrics?.occupiedRooms ?? 0} occupied / {metrics?.totalRooms ?? 0} total
            </p>
          </div>
          <OccupancyRing pct={metrics?.occupancyPct ?? 0} size={48} strokeWidth={5} />
        </div>

        <div className="rounded-2xl bg-slate-900/60 border border-white/5 p-3.5">
          <p className="text-[10px] font-bold uppercase text-slate-400">Average Stay (ALOS)</p>
          <p className="text-lg font-black text-white mt-0.5">{metrics?.avgLengthOfStay ?? 1.5} Nights</p>
          <p className="text-[9px] text-slate-500">Across {metrics?.totalBookings ?? 0} period bookings</p>
        </div>

        <div className="rounded-2xl bg-slate-900/60 border border-white/5 p-3.5">
          <p className="text-[10px] font-bold uppercase text-slate-400">Avg Booking Value</p>
          <p className="text-lg font-black text-white mt-0.5">{fmt(metrics?.avgBookingValue ?? 0)}</p>
          <p className="text-[9px] text-slate-500">Gross revenue per reservation</p>
        </div>

        <div className="rounded-2xl bg-slate-900/60 border border-white/5 p-3.5">
          <p className="text-[10px] font-bold uppercase text-slate-400">Ancillary Revenue Share</p>
          <p className="text-lg font-black text-white mt-0.5">
            {metrics?.periodRevenue ? Math.round(((metrics.ancillaryRevenue || 0) / metrics.periodRevenue) * 100) : 15}%
          </p>
          <p className="text-[9px] text-slate-500">F&B, Room service, Spa, Pool</p>
        </div>
      </div>

      {/* ── 7-Day & 14-Day Forward Occupancy & Demand Forecast ── */}
      <div className="rounded-3xl bg-slate-900/60 border border-white/10 p-5 backdrop-blur-md shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Zap size={15} />
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-wider">
                Forward Demand & Dynamic Rate Forecast
              </h2>
              <p className="text-[10px] text-slate-400">
                Future booked occupancy with active dynamic rate multipliers
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-800 p-0.5 rounded-xl border border-white/5">
              <button
                onClick={() => setForecastViewDays(7)}
                className={`px-3 py-1 rounded-lg text-[10px] font-black transition-colors ${
                  forecastViewDays === 7 ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                7 Days
              </button>
              <button
                onClick={() => setForecastViewDays(14)}
                className={`px-3 py-1 rounded-lg text-[10px] font-black transition-colors ${
                  forecastViewDays === 14 ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                14 Days
              </button>
            </div>
          </div>
        </div>

        {/* Forecast Days Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {displayedForecast.map((day, idx) => {
            const isPeak = day.demandLevel === 'PEAK';
            const isHigh = day.demandLevel === 'HIGH';
            const isLow = day.demandLevel === 'LOW';

            const borderColor = isPeak
              ? 'border-rose-500/40 bg-rose-950/20'
              : isHigh
              ? 'border-amber-500/30 bg-amber-950/20'
              : isLow
              ? 'border-sky-500/20 bg-sky-950/10'
              : 'border-white/5 bg-slate-800/40';

            const multiplierBadge = isPeak
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
              : isHigh
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              : isLow
              ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';

            return (
              <div
                key={day.date}
                className={`p-3 rounded-2xl border ${borderColor} flex flex-col justify-between transition-all hover:scale-[1.02]`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black text-white">{day.day}</span>
                    <span className="text-[9px] text-slate-400 font-bold">{day.formattedDate}</span>
                  </div>

                  <div className="flex items-baseline gap-1 my-2">
                    <span className="text-xl font-black text-white">{day.occupancyPct}%</span>
                    <span className="text-[9px] text-slate-500">Occ</span>
                  </div>

                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full rounded-full ${
                        isPeak ? 'bg-rose-500' : isHigh ? 'bg-amber-500' : isLow ? 'bg-sky-400' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.max(5, day.occupancyPct)}%` }}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] uppercase font-bold text-slate-500">Multiplier</span>
                    <span className={`text-[9px] font-black px-1.5 py-0.2 rounded border ${multiplierBadge}`}>
                      {day.suggestedRateMultiplier > 1
                        ? `+${Math.round((day.suggestedRateMultiplier - 1) * 100)}%`
                        : day.suggestedRateMultiplier < 1
                        ? `-${Math.round((1 - day.suggestedRateMultiplier) * 100)}%`
                        : 'Base'}
                    </span>
                  </div>

                  <p className="text-[8px] text-slate-400 truncate">
                    {day.activeRulesApplied.length > 0 ? day.activeRulesApplied.join(', ') : 'Standard Dynamic Rate'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Interactive Charts & Performance Section ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Chart Area (2 Cols) */}
        <div className="xl:col-span-2 rounded-3xl bg-slate-900/60 border border-white/10 p-5 backdrop-blur-md shadow-xl flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                Yield Analytics
              </p>
              <h2 className="text-lg font-black text-white">Revenue & Yield Trends</h2>
            </div>

            {/* Chart Tab Toggles */}
            <div className="flex bg-slate-800/80 p-1 rounded-2xl border border-white/5">
              {[
                { id: 'revenue' as const, label: 'Revenue Trends' },
                { id: 'occupancy' as const, label: 'Occupancy & ADR' },
                { id: 'channels' as const, label: 'Channel Split' },
                { id: 'ancillary' as const, label: 'Ancillary Sources' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveChartTab(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-colors ${
                    activeChartTab === tab.id
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chart Rendering */}
          <div className="h-72 w-full pt-2">
            {activeChartTab === 'revenue' && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorRoom" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis dataKey="dayLabel" stroke="#64748B" fontSize={10} tickLine={false} />
                  <YAxis
                    stroke="#64748B"
                    fontSize={10}
                    tickLine={false}
                    tickFormatter={(v) => `₹${v >= 1000 ? Math.round(v / 1000) + 'k' : v}`}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: 16 }}
                    formatter={(value: unknown) => [fmt(Number(value)), '']}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                  <Area type="monotone" dataKey="totalRevenue" name="Total Revenue" stroke="#6366F1" strokeWidth={2} fillOpacity={1} fill="url(#colorTotal)" />
                  <Area type="monotone" dataKey="roomRevenue" name="Room Revenue" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorRoom)" />
                  <Area type="monotone" dataKey="ancillaryRevenue" name="Ancillary Rev" stroke="#F59E0B" strokeWidth={2} fillOpacity={0} />
                </AreaChart>
              </ResponsiveContainer>
            )}

            {activeChartTab === 'occupancy' && (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={trends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis dataKey="dayLabel" stroke="#64748B" fontSize={10} tickLine={false} />
                  <YAxis yAxisId="left" stroke="#64748B" fontSize={10} tickLine={false} unit="%" />
                  <YAxis yAxisId="right" orientation="right" stroke="#64748B" fontSize={10} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: 16 }} />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                  <Bar yAxisId="right" dataKey="adr" name="ADR (₹)" fill="#6366F1" radius={[6, 6, 0, 0]} opacity={0.7} />
                  <Line yAxisId="left" type="monotone" dataKey="occupancy" name="Occupancy %" stroke="#10B981" strokeWidth={3} dot={{ r: 3 }} />
                  <Line yAxisId="right" type="monotone" dataKey="revpar" name="RevPAR (₹)" stroke="#38BDF8" strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            )}

            {activeChartTab === 'channels' && (
              <div className="h-full flex flex-col sm:flex-row items-center justify-around gap-4">
                <ResponsiveContainer width="50%" height="100%">
                  <PieChart>
                    <Pie
                      data={channelBreakdown}
                      dataKey="revenue"
                      nameKey="channel"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={85}
                      paddingAngle={3}
                    >
                      {channelBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || '#6366F1'} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: 16 }}
                      formatter={(v: unknown) => [fmt(Number(v)), 'Revenue']}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 w-full sm:w-1/2 pr-4">
                  {channelBreakdown.map((c) => (
                    <div key={c.channel} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                        <span className="text-slate-300 font-bold">{c.channel}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-white">{fmt(c.revenue)}</span>
                        <span className="text-[10px] text-slate-500 ml-1.5">({c.pct}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeChartTab === 'ancillary' && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ancillaryBreakdown} layout="vertical" margin={{ top: 10, right: 20, left: 40, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" horizontal={false} />
                  <XAxis type="number" stroke="#64748B" fontSize={10} tickFormatter={(v) => `₹${v}`} />
                  <YAxis type="category" dataKey="category" stroke="#64748B" fontSize={10} width={130} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: 16 }}
                    formatter={(v: unknown) => [fmt(Number(v)), 'Revenue']}
                  />
                  <Bar dataKey="revenue" name="Revenue (₹)" radius={[0, 8, 8, 0]}>
                    {ancillaryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Dynamic Occupancy & Yield Gauge (1 Col) */}
        <div className="rounded-3xl bg-slate-900/60 border border-white/10 p-6 backdrop-blur-md shadow-xl flex flex-col items-center justify-between text-center">
          <div>
            <div className="flex items-center justify-center gap-2 mb-1">
              <BedDouble size={16} className="text-indigo-400" />
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                Property Inventory Health
              </span>
            </div>
            <h3 className="text-lg font-black text-white">Live Occupancy Status</h3>
          </div>

          <div className="my-4">
            <OccupancyRing pct={metrics?.occupancyPct ?? 0} size={150} strokeWidth={10} />
            <p className="text-2xl font-black text-white mt-3">{metrics?.occupancyPct ?? 0}%</p>
            <p className="text-xs text-slate-400">Current Occupancy Rate</p>
          </div>

          <div className="w-full grid grid-cols-2 gap-2 pt-3 border-t border-white/5 text-left">
            <div className="p-2.5 rounded-2xl bg-slate-800/50 border border-white/5">
              <span className="text-[9px] uppercase font-bold text-slate-400">Occupied Rooms</span>
              <p className="text-base font-black text-white">{metrics?.occupiedRooms ?? 0}</p>
            </div>
            <div className="p-2.5 rounded-2xl bg-slate-800/50 border border-white/5">
              <span className="text-[9px] uppercase font-bold text-slate-400">Available Rooms</span>
              <p className="text-base font-black text-emerald-400">{metrics?.availableRooms ?? 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Room Type Performance & Dynamic Rate Recommendations ── */}
      <div className="rounded-3xl bg-slate-900/60 border border-white/10 overflow-hidden backdrop-blur-md shadow-xl">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <Building2 size={16} className="text-indigo-400" />
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Room Types Revenue & Rate Yields
              </h3>
              <p className="text-[10px] text-slate-400">
                Inventory breakdown with dynamic rate recommendations
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5 bg-slate-900/40">
                {['Room Type', 'Base Rate', 'Inventory', 'Occupancy', 'Period Revenue', 'ADR', 'RevPAR', 'Suggested Dynamic Rate', 'Action'].map((h) => (
                  <th
                    key={h}
                    className="text-left px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {roomTypeBreakdown.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-8 text-center text-slate-500">
                    No room types configured. Add room types in Room settings.
                  </td>
                </tr>
              ) : (
                roomTypeBreakdown.map((rt) => {
                  const hasAdjustment = rt.suggestedRate !== rt.baseRate;
                  return (
                    <tr key={rt.roomTypeId} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-4 font-black text-white">
                        {rt.name}
                        <span className="text-[10px] text-slate-500 block font-normal">{rt.code}</span>
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-300">
                        {fmt(rt.baseRate)}
                      </td>
                      <td className="px-5 py-4 text-slate-300">
                        <span className="font-bold text-white">{rt.occupied}</span>
                        <span className="text-slate-500"> / {rt.rooms}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-500 rounded-full"
                              style={{ width: `${rt.occupancyPct}%` }}
                            />
                          </div>
                          <span className="font-bold text-white">{rt.occupancyPct}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-black text-emerald-400">
                        {fmt(rt.revenue)}
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-300">
                        {fmt(rt.adr)}
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-300">
                        {fmt(rt.revpar)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-white text-sm">
                            {fmt(rt.suggestedRate)}
                          </span>
                          {hasAdjustment && (
                            <span
                              className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                                rt.adjustmentPct > 0
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              }`}
                            >
                              {rt.adjustmentPct > 0 ? `+${rt.adjustmentPct}%` : `${rt.adjustmentPct}%`}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => {
                            setSimulatorOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 text-[10px] font-bold transition-colors flex items-center gap-1"
                        >
                          <Zap size={11} />
                          <span>Simulate</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Dynamic Pricing Rules Engine (Interactive CRUD) ── */}
      <div className="rounded-3xl bg-slate-900/60 border border-white/10 overflow-hidden backdrop-blur-md shadow-xl">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <Sliders size={16} className="text-indigo-400" />
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Dynamic Pricing Rules Engine
              </h3>
              <p className="text-[10px] text-slate-400">
                Automated rate surge & discount triggers based on live inventory & calendar events
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter Pills */}
            <div className="flex bg-slate-800 p-0.5 rounded-xl border border-white/5 text-[10px] font-bold">
              {['ALL', 'ACTIVE', 'OCCUPANCY', 'DAY_OF_WEEK', 'LEAD_TIME'].map((f) => (
                <button
                  key={f}
                  onClick={() => setRuleTypeFilter(f)}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    ruleTypeFilter === f ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                setEditingRule(null);
                setRuleModalOpen(true);
              }}
              className="px-3.5 h-8 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-black flex items-center gap-1 shadow-md transition-colors"
            >
              <Plus size={12} />
              <span>Add Rule</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5 bg-slate-900/40">
                {['Rule Name', 'Trigger Type', 'Condition', 'Adjustment', 'Room Type', 'Status', 'Actions'].map((h) => (
                  <th
                    key={h}
                    className="text-left px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {filteredRules.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                    No dynamic pricing rules match the filter. Click &quot;+ Add Rule&quot; to create one.
                  </td>
                </tr>
              ) : (
                filteredRules.map((rule) => {
                  const isPositive = rule.adjustment > 0;
                  return (
                    <tr key={rule.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-4 font-black text-white">
                        {rule.name}
                        {rule.description && (
                          <span className="text-[10px] text-slate-400 block font-normal">{rule.description}</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-800 border border-white/5 text-[10px] font-bold text-slate-300">
                          {rule.ruleType}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-300">
                        {rule.condition}
                      </td>
                      <td className="px-5 py-4 font-black">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            isPositive
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {isPositive ? `+${rule.adjustment}` : rule.adjustment}
                          {rule.adjustmentType === 'PERCENTAGE' ? '%' : '₹'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-400 font-bold">
                        {rule.roomTypeName || 'All'}
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => toggleRule(rule.id, !rule.isActive)}
                          className={`px-3 py-1 rounded-full text-[10px] font-black transition-all flex items-center gap-1.5 ${
                            rule.isActive
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
                              : 'bg-slate-800 text-slate-500 border border-white/5 hover:text-slate-300'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              rule.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                            }`}
                          />
                          {rule.isActive ? 'Active' : 'Paused'}
                        </button>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingRule(rule);
                              setRuleModalOpen(true);
                            }}
                            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
                            title="Edit Rule"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete "${rule.name}"?`)) {
                                deleteRule(rule.id);
                              }
                            }}
                            className="w-8 h-8 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 flex items-center justify-center transition-colors"
                            title="Delete Rule"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modals ── */}
      <DynamicPricingRuleModal
        isOpen={ruleModalOpen}
        onClose={() => {
          setRuleModalOpen(false);
          setEditingRule(null);
        }}
        onSave={async (data) => {
          if (data.id) {
            return await updateRule(data as Partial<DynamicPricingRule> & { id: string });
          } else {
            return await createRule(data);
          }
        }}
        editingRule={editingRule}
        roomTypes={roomTypeBreakdown}
      />

      <DynamicRateSimulatorModal
        isOpen={simulatorOpen}
        onClose={() => setSimulatorOpen(false)}
        roomTypes={roomTypeBreakdown}
        onSimulate={simulateRate}
      />
    </div>
  );
}
