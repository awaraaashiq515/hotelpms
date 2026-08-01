import React from 'react';
import { Gift, Tag, Star, Lock } from 'lucide-react';

export interface Reward {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  category: 'DISCOUNT' | 'UPGRADE' | 'FOOD' | 'SPA' | 'EXPERIENCE';
  minTier: string;
  stock: number;
  imageEmoji: string;
}

const CATEGORY_COLOR: Record<string, string> = {
  DISCOUNT:   'text-emerald-300 bg-emerald-500/10',
  UPGRADE:    'text-purple-300 bg-purple-500/10',
  FOOD:       'text-amber-300 bg-amber-500/10',
  SPA:        'text-pink-300 bg-pink-500/10',
  EXPERIENCE: 'text-blue-300 bg-blue-500/10',
};

interface RewardsListProps {
  rewards: Reward[];
  guestPoints?: number;
  onRedeem?: (id: string) => void;
}

export function RewardsList({ rewards, guestPoints = 0, onRedeem }: RewardsListProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
      {rewards.map(reward => {
        const canAfford = guestPoints >= reward.pointsCost;
        return (
          <div key={reward.id}
            className={`rounded-2xl border p-4 transition-all ${
              canAfford
                ? 'bg-slate-900/50 border-white/5 hover:border-indigo-500/30'
                : 'bg-slate-900/20 border-white/3 opacity-60'
            }`}>
            <div className="flex items-start justify-between mb-3">
              <span className="text-3xl">{reward.imageEmoji}</span>
              <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md ${CATEGORY_COLOR[reward.category]}`}>
                {reward.category}
              </span>
            </div>
            <p className="text-sm font-black text-white mb-1">{reward.name}</p>
            <p className="text-[9px] text-slate-500 mb-3">{reward.description}</p>

            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1">
                <Star size={11} className="text-yellow-400" fill="currentColor" />
                <span className="text-sm font-black text-yellow-300">{reward.pointsCost.toLocaleString()}</span>
                <span className="text-[9px] text-slate-500">pts</span>
              </div>
              <span className="text-[9px] text-slate-500">{reward.stock} left</span>
            </div>

            <button
              onClick={() => canAfford && onRedeem?.(reward.id)}
              disabled={!canAfford}
              className={`w-full h-8 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 ${
                canAfford
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  : 'bg-slate-800 text-slate-600 cursor-not-allowed'
              }`}>
              {canAfford ? <><Gift size={11} /> Redeem</> : <><Lock size={11} /> Need {(reward.pointsCost - guestPoints).toLocaleString()} more pts</>}
            </button>
          </div>
        );
      })}
    </div>
  );
}
