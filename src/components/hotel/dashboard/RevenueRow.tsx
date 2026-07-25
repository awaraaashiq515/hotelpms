import React from 'react';
import { StatCard } from '@/components/hotel/ui/StatCard';
import { OccupancyRing } from '@/components/hotel/ui/OccupancyRing';
import { IndianRupee, BarChart3, TrendingUp, PiggyBank } from 'lucide-react';
import type { DashboardData } from '@/types/hotel/dashboard.types';

function fmt(n: number) { return '₹' + Math.round(n).toLocaleString('en-IN'); }

interface RevenueRowProps { data: DashboardData; }

export function RevenueRow({ data }: RevenueRowProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-5 gap-3">
      <StatCard
        label="Revenue Today" value={fmt(data.revenueToday)} sub="Collected today"
        icon={IndianRupee} color="border-emerald-500/30 bg-gradient-to-br from-emerald-900/40 to-slate-900/40 text-emerald-300"
      />
      <StatCard
        label="Revenue This Month" value={fmt(data.revenueMonth)} sub="Month to date"
        icon={BarChart3} color="border-indigo-500/30 bg-gradient-to-br from-indigo-900/40 to-slate-900/40 text-indigo-300"
        href="/hotel/revenue"
      />
      <StatCard
        label="ADR" value={fmt(data.adr)} sub="Avg Daily Rate"
        icon={TrendingUp} color="border-sky-500/30 bg-gradient-to-br from-sky-900/40 to-slate-900/40 text-sky-300"
        href="/hotel/revenue"
      />
      <StatCard
        label="RevPAR" value={fmt(data.revpar)} sub="Revenue per Avail Room"
        icon={PiggyBank} color="border-violet-500/30 bg-gradient-to-br from-violet-900/40 to-slate-900/40 text-violet-300"
        href="/hotel/revenue"
      />
      {/* Occupancy Ring Card */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Occupancy %</p>
          <p className="text-xs text-slate-400">{data.occupiedRooms} / {data.totalRooms} rooms</p>
          <p className="text-[9px] text-slate-600 mt-1">{data.vacantRooms} vacant · {data.outOfOrder} OOO</p>
        </div>
        <OccupancyRing pct={data.occupancyPct} />
      </div>
    </div>
  );
}
