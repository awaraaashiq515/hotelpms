'use client';
import React, { useState } from 'react';
import { BarChart3, TrendingUp, TrendingDown, IndianRupee, Download, RefreshCw } from 'lucide-react';
import { useDashboard } from '@/hooks/hotel/useDashboard';

function fmt(n: number) { return '₹' + Math.round(n).toLocaleString('en-IN'); }

const REPORT_TYPES = [
  { label:'Occupancy Report',   desc:'Daily/weekly/monthly occupancy trends',   key:'occupancy' },
  { label:'Revenue Report',     desc:'Detailed revenue by source and room type', key:'revenue' },
  { label:'Booking Source',     desc:'OTA vs Direct vs Walk-in breakdown',       key:'source' },
  { label:'Guest Analytics',    desc:'Demographics, nationality, segment',       key:'guest' },
  { label:'Housekeeping',       desc:'Task completion rates and staff KPIs',     key:'housekeeping' },
  { label:'Maintenance',        desc:'Issue resolution time and costs',          key:'maintenance' },
  { label:'CRM Loyalty',        desc:'Loyalty points, tiers, and redemptions',   key:'crm' },
  { label:'Forecast Report',    desc:'AI-powered 30-60-90 day predictions',      key:'forecast' },
];

export default function AnalyticsPage() {
  const { data, loading, refresh } = useDashboard();
  const [generating, setGenerating] = useState<string|null>(null);

  async function generateReport(key: string) {
    setGenerating(key);
    await new Promise(r => setTimeout(r, 1500));
    setGenerating(null);
    alert(`${key} report generated! (Connect BI tool for real export)`);
  }

  return (
    <div className="space-y-6 pb-10 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 size={14} className="text-indigo-400" />
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Intelligence · Analytics</span>
          </div>
          <h1 className="text-2xl font-black text-white">Business Intelligence</h1>
          <p className="text-xs text-slate-500 mt-0.5">Real-time analytics · AI insights · Export reports</p>
        </div>
        <button onClick={refresh} className={`w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors ${loading?'animate-spin':''}`}>
          <RefreshCw size={14} />
        </button>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-6 gap-3">
        {[
          { label:'Occupancy',    value: data ? `${data.occupancyPct}%`  : '—', trend:'+5%',  up:true,  icon:TrendingUp },
          { label:'ADR',          value: data ? fmt(data.adr)             : '—', trend:'+8%',  up:true,  icon:TrendingUp },
          { label:'RevPAR',       value: data ? fmt(data.revpar)          : '—', trend:'+12%', up:true,  icon:TrendingUp },
          { label:'Rev Today',    value: data ? fmt(data.revenueToday)    : '—', trend:'+3%',  up:true,  icon:IndianRupee },
          { label:'Rev Month',    value: data ? fmt(data.revenueMonth)    : '—', trend:'-2%',  up:false, icon:TrendingDown },
          { label:'Satisfaction', value: data?.avgRating ? `${data.avgRating}/5`:'—', trend:'+0.2', up:true, icon:TrendingUp },
        ].map(k => (
          <div key={k.label} className="rounded-2xl bg-slate-900/50 border border-white/5 p-4">
            <k.icon size={13} className={`mb-2 ${k.up ? 'text-emerald-400' : 'text-rose-400'}`} />
            <p className="text-lg font-black text-white">{k.value}</p>
            <p className="text-[8px] font-bold uppercase tracking-widest text-slate-500 mt-0.5">{k.label}</p>
            <p className={`text-[8px] font-black mt-1 ${k.up ? 'text-emerald-400' : 'text-rose-400'}`}>{k.trend} vs last month</p>
          </div>
        ))}
      </div>

      {/* Revenue Breakdown */}
      {data && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* Room Status Breakdown */}
          <div className="rounded-2xl bg-slate-900/50 border border-white/5 p-5">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Room Status Breakdown</p>
            <div className="space-y-3">
              {[
                { label:'Occupied', value: data.occupiedRooms, total: data.totalRooms, color:'bg-rose-400' },
                { label:'Vacant',   value: data.vacantRooms,   total: data.totalRooms, color:'bg-emerald-400' },
                { label:'Dirty',    value: data.dirtyRooms,    total: data.totalRooms, color:'bg-amber-400' },
                { label:'OOO',      value: data.outOfOrder,    total: data.totalRooms, color:'bg-slate-600' },
              ].map(r => {
                const pct = data.totalRooms > 0 ? Math.round((r.value / data.totalRooms) * 100) : 0;
                return (
                  <div key={r.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-slate-400">{r.label}</span>
                      <span className="text-[10px] text-white font-black">{r.value} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full ${r.color} rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {/* Bookings Pipeline */}
          <div className="rounded-2xl bg-slate-900/50 border border-white/5 p-5">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Booking Pipeline Today</p>
            <div className="space-y-4">
              {[
                { label:'Arrivals Today',   value: data.checkinsToday.length,   color:'text-sky-400',    bg:'bg-sky-400' },
                { label:'Departures Today', value: data.checkoutsToday.length,  color:'text-orange-400', bg:'bg-orange-400' },
                { label:'In-House',         value: data.inHouse.length,         color:'text-indigo-400', bg:'bg-indigo-400' },
                { label:'Pending Payments', value: data.pendingPayments.length, color:'text-amber-400',  bg:'bg-amber-400' },
              ].map(b => (
                <div key={b.label} className="flex items-center gap-3">
                  <div className="w-24 text-right"><span className="text-[9px] text-slate-500">{b.label}</span></div>
                  <div className="flex-1 h-6 bg-slate-800 rounded-lg overflow-hidden relative">
                    <div className={`h-full ${b.bg}/30 rounded-lg`} style={{ width: `${Math.min(100, b.value * 10)}%` }} />
                    <span className={`absolute inset-0 flex items-center px-2 text-[10px] font-black ${b.color}`}>{b.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Report Library */}
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Report Library</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {REPORT_TYPES.map(r => (
            <div key={r.key} className="rounded-2xl bg-slate-900/50 border border-white/5 p-4 hover:border-indigo-500/30 transition-colors">
              <p className="text-xs font-black text-white mb-1">{r.label}</p>
              <p className="text-[9px] text-slate-500 mb-3">{r.desc}</p>
              <button
                onClick={() => generateReport(r.key)}
                disabled={generating === r.key}
                className={`w-full h-8 rounded-xl text-[9px] font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 ${
                  generating === r.key ? 'bg-indigo-600/50 text-indigo-300 cursor-wait' : 'bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300'
                }`}>
                <Download size={10} />
                {generating === r.key ? 'Generating…' : 'Generate'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
