'use client';
import React, { useState, useEffect } from 'react';
import { Brain } from 'lucide-react';
import type { DashboardData } from '@/types/hotel/dashboard.types';

function fmtCurrency(n: number) { return '₹' + Math.round(n).toLocaleString('en-IN'); }

function getRecommendations(d: DashboardData): string[] {
  const recs: string[] = [];
  if (d.occupancyPct < 50)
    recs.push(`Occupancy at ${d.occupancyPct}% — activate flash OTA discounts or last-minute rate drops to fill ${d.vacantRooms} vacant rooms.`);
  if (d.occupancyPct >= 85)
    recs.push(`High occupancy (${d.occupancyPct}%)! Enable walk-in premium pricing and upsell room upgrades now.`);
  if (d.dirtyRooms > 3)
    recs.push(`${d.dirtyRooms} dirty rooms pending — assign extra housekeeping to ensure rooms are ready before arrivals.`);
  if (d.pendingPayments.length > 0)
    recs.push(`${d.pendingPayments.length} bookings with outstanding dues — collect before checkout to protect revenue.`);
  if (d.maintenanceAlerts.length > 1)
    recs.push(`${d.maintenanceAlerts.length} open maintenance issues — resolve before guest complaints escalate.`);
  if (d.checkinsToday.length > 0)
    recs.push(`${d.checkinsToday.length} arrivals today — pre-block rooms and prepare welcome amenities now.`);
  if (d.avgRating && d.avgRating < 3.5)
    recs.push(`Guest satisfaction at ${d.avgRating}/5 — review recent feedback and schedule a service improvement meeting.`);
  if (d.revpar > 0)
    recs.push(`RevPAR is ${fmtCurrency(d.revpar)} — benchmark against your seasonal average and adjust channel rates.`);
  if (recs.length === 0) {
    recs.push('Operations are stable. Consider sending WhatsApp loyalty offers to past guests to drive repeat bookings.');
    recs.push('Review this week\'s revenue report and plan upselling initiatives for the weekend.');
  }
  return recs.slice(0, 4);
}

interface AIBannerProps { data: DashboardData; }

export function AIBanner({ data }: AIBannerProps) {
  const [idx, setIdx] = useState(0);
  const recs = getRecommendations(data);

  useEffect(() => {
    if (recs.length === 0) return;
    const t = setInterval(() => setIdx(i => (i + 1) % recs.length), 8000);
    return () => clearInterval(t);
  }, [recs.length]);

  if (recs.length === 0) return null;

  return (
    <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-r from-violet-900/30 via-indigo-900/30 to-violet-900/30 p-4 flex items-start gap-3 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-indigo-500/5 pointer-events-none" />
      <div className="w-8 h-8 rounded-xl bg-violet-500/20 flex items-center justify-center shrink-0 mt-0.5">
        <Brain size={14} className="text-violet-300" />
      </div>
      <div className="flex-1 min-w-0 relative">
        <p className="text-[9px] font-black text-violet-400 uppercase tracking-widest mb-1">AI Recommendation</p>
        <p className="text-xs text-slate-300 leading-relaxed">{recs[idx]}</p>
      </div>
      <div className="flex gap-1 shrink-0 mt-1.5">
        {recs.map((_, i) => (
          <button key={i} onClick={() => setIdx(i)}
            className={`w-1.5 h-1.5 rounded-full transition-colors ${i === idx ? 'bg-violet-400' : 'bg-slate-700 hover:bg-slate-600'}`} />
        ))}
      </div>
    </div>
  );
}
