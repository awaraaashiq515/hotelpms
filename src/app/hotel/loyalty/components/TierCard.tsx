import React from 'react';
import { Star, Crown, Gift, Award } from 'lucide-react';

export type LoyaltyTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND';

const TIER_CONFIG: Record<LoyaltyTier, {
  color: string; bg: string; border: string; icon: string;
  minPoints: number; maxPoints: number; benefits: string[];
}> = {
  BRONZE:   { color: 'text-amber-700', bg: 'from-amber-900/40', border: 'border-amber-700/30', icon: '🥉', minPoints: 0,     maxPoints: 999,   benefits: ['5% discount', 'Priority check-in'] },
  SILVER:   { color: 'text-slate-300', bg: 'from-slate-700/40', border: 'border-slate-500/30', icon: '🥈', minPoints: 1000,  maxPoints: 4999,  benefits: ['10% discount', 'Free breakfast', 'Late checkout'] },
  GOLD:     { color: 'text-yellow-400', bg: 'from-yellow-900/40', border: 'border-yellow-600/30', icon: '🥇', minPoints: 5000, maxPoints: 14999, benefits: ['15% discount', 'Room upgrade', 'Free minibar'] },
  PLATINUM: { color: 'text-violet-300', bg: 'from-violet-900/40', border: 'border-violet-500/30', icon: '💎', minPoints: 15000, maxPoints: 49999, benefits: ['20% discount', 'Suite upgrade', 'Airport transfer'] },
  DIAMOND:  { color: 'text-cyan-300', bg: 'from-cyan-900/40', border: 'border-cyan-500/30', icon: '💠', minPoints: 50000, maxPoints: 999999, benefits: ['25% discount', 'Personal butler', 'All perks included'] },
};

interface TierCardProps {
  tier: LoyaltyTier;
  currentPoints?: number;
  memberCount?: number;
  isCurrentTier?: boolean;
}

export function TierCard({ tier, currentPoints, memberCount, isCurrentTier }: TierCardProps) {
  const cfg = TIER_CONFIG[tier];
  const progress = currentPoints !== undefined
    ? Math.min(100, Math.max(0, ((currentPoints - cfg.minPoints) / (cfg.maxPoints - cfg.minPoints)) * 100))
    : null;

  return (
    <div className={`rounded-2xl bg-gradient-to-br ${cfg.bg} to-slate-900/40 border ${cfg.border} p-5 transition-all ${isCurrentTier ? 'ring-2 ring-offset-2 ring-offset-slate-900 ring-indigo-500' : ''}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl">{cfg.icon}</span>
        {isCurrentTier && (
          <span className="text-[8px] font-black text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-full border border-indigo-500/30">
            CURRENT
          </span>
        )}
      </div>
      <p className={`text-base font-black ${cfg.color}`}>{tier}</p>
      <p className="text-[9px] text-slate-500 mt-0.5">
        {cfg.minPoints.toLocaleString()} — {cfg.maxPoints === 999999 ? '∞' : cfg.maxPoints.toLocaleString()} pts
      </p>

      {progress !== null && (
        <div className="mt-3">
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-[8px] text-slate-600 mt-1">{currentPoints?.toLocaleString()} pts</p>
        </div>
      )}

      {memberCount !== undefined && (
        <p className="text-[9px] text-slate-500 mt-2">{memberCount} members</p>
      )}

      <div className="mt-3 pt-3 border-t border-white/5 space-y-1">
        {cfg.benefits.map(b => (
          <div key={b} className="flex items-center gap-1.5">
            <Gift size={8} className={cfg.color} />
            <span className="text-[9px] text-slate-400">{b}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
