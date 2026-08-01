'use client';
import React, { useState } from 'react';
import { TrendingUp, IndianRupee, BarChart3, Percent, RefreshCw, Zap } from 'lucide-react';
import { useRevenue } from '@/hooks/hotel/useRevenue';
import { OccupancyRing } from '@/components/hotel/ui/OccupancyRing';

function fmt(n: number) { return '₹' + Math.round(n).toLocaleString('en-IN'); }

const FORECAST_DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const OCC_MOCK = [68, 72, 65, 80, 85, 92, 78];

export default function RevenuePage() {
  const { metrics, loading, refresh } = useRevenue();

  return (
    <div className="space-y-6 pb-10 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={14} className="text-emerald-400" />
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Revenue Intelligence</span>
          </div>
          <h1 className="text-2xl font-black text-white">Revenue Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">AI-powered pricing · Dynamic rates · Demand forecasting</p>
        </div>
        <button onClick={refresh}
          className={`w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors ${loading ? 'animate-spin' : ''}`}>
          <RefreshCw size={14} />
        </button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {[
          { label: 'Revenue Today',  value: fmt(metrics?.revenueToday ?? 0), icon: IndianRupee, color: 'from-emerald-900/40' },
          { label: 'Revenue Month',  value: fmt(metrics?.revenueMonth ?? 0), icon: BarChart3,   color: 'from-indigo-900/40' },
          { label: 'ADR',            value: fmt(metrics?.adr ?? 0),           icon: TrendingUp,  color: 'from-sky-900/40' },
          { label: 'RevPAR',         value: fmt(metrics?.revpar ?? 0),        icon: Zap,         color: 'from-violet-900/40' },
          { label: 'TRevPAR',        value: fmt(metrics?.trevpar ?? 0),       icon: BarChart3,   color: 'from-amber-900/40' },
          { label: 'GOPPAR',         value: fmt(metrics?.goppar ?? 0),        icon: IndianRupee, color: 'from-rose-900/40' },
        ].map(k => (
          <div key={k.label} className={`rounded-2xl bg-gradient-to-br ${k.color} to-slate-900/40 border border-white/5 p-4`}>
            <k.icon size={14} className="text-white/40 mb-2" />
            <p className="text-xl font-black text-white">{k.value}</p>
            <p className="text-[9px] font-bold uppercase tracking-widest text-white/40 mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Occupancy + Forecast */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Occupancy Gauge */}
        <div className="rounded-2xl bg-slate-900/50 border border-white/5 p-6 flex flex-col items-center justify-center gap-4">
          <OccupancyRing pct={metrics?.occupancyPct ?? 0} size={120} strokeWidth={8} />
          <div className="text-center">
            <p className="text-sm font-black text-white">{metrics?.occupancyPct ?? 0}% Occupancy</p>
            <p className="text-xs text-slate-500 mt-1">Current property occupancy rate</p>
          </div>
        </div>

        {/* 7-Day Forecast */}
        <div className="xl:col-span-2 rounded-2xl bg-slate-900/50 border border-white/5 p-5">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">7-Day Occupancy Forecast</p>
          <div className="flex items-end gap-2 h-28">
            {OCC_MOCK.map((occ, i) => {
              const color = occ >= 80 ? 'bg-emerald-500' : occ >= 60 ? 'bg-indigo-500' : 'bg-amber-500';
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[8px] text-slate-500">{occ}%</span>
                  <div className={`w-full rounded-t-lg ${color}/60 hover:${color} transition-colors`} style={{ height: `${occ}%` }} title={`${FORECAST_DAYS[i]}: ${occ}%`} />
                </div>
              );
            })}
          </div>
          <div className="flex gap-2 mt-2">
            {FORECAST_DAYS.map(d => (
              <div key={d} className="flex-1 text-center text-[8px] text-slate-600 font-bold">{d}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Dynamic Pricing Rules */}
      <div className="rounded-2xl bg-slate-900/50 border border-white/5 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
          <p className="text-[11px] font-black text-white uppercase tracking-wider">Dynamic Pricing Rules</p>
          <button className="text-[10px] font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-wider">
            + Add Rule
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {['Rule Name','Type','Condition','Adjustment','Room Type','Status'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-[9px] font-black text-slate-600 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Weekend Premium',   type: 'DAY_OF_WEEK', cond: 'Fri-Sun',        adj: '+25%', room: 'All',        active: true },
                { name: 'Festival Season',   type: 'EVENT',       cond: 'Diwali / Holi',  adj: '+40%', room: 'All',        active: true },
                { name: 'High Occupancy',    type: 'OCCUPANCY',   cond: 'Occ > 80%',      adj: '+15%', room: 'Deluxe',     active: true },
                { name: 'Low Season Fill',   type: 'OCCUPANCY',   cond: 'Occ < 40%',      adj: '-10%', room: 'Standard',   active: false },
                { name: 'Last Minute',       type: 'DATE_RANGE',  cond: '< 24 hrs',       adj: '-20%', room: 'All',        active: true },
              ].map((r, i) => (
                <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/2">
                  <td className="px-4 py-3 text-[11px] font-black text-white">{r.name}</td>
                  <td className="px-4 py-3 text-[10px] text-slate-400">{r.type}</td>
                  <td className="px-4 py-3 text-[10px] text-slate-400">{r.cond}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-black ${r.adj.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}`}>{r.adj}</span>
                  </td>
                  <td className="px-4 py-3 text-[10px] text-slate-400">{r.room}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${r.active ? 'text-emerald-300 bg-emerald-500/10 border border-emerald-500/20' : 'text-slate-500 bg-slate-800'}`}>
                      {r.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
