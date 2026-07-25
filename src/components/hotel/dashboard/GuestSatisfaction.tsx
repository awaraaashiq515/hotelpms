import React from 'react';
import { Star } from 'lucide-react';
import type { DashboardData } from '@/types/hotel/dashboard.types';

interface GuestSatisfactionProps { data: DashboardData; }

export function GuestSatisfaction({ data }: GuestSatisfactionProps) {
  const rating = data.avgRating;
  const rounded = rating ? Math.round(rating) : 0;

  return (
    <div className="rounded-2xl bg-slate-900/50 border border-white/5 p-4">
      <div className="flex items-center gap-1.5 mb-3">
        <Star size={12} className="text-yellow-400" />
        <span className="text-[10px] font-black text-white uppercase tracking-wider">Guest Satisfaction</span>
      </div>
      {rating ? (
        <>
          <p className="text-4xl font-black text-white leading-none">{rating.toFixed(1)}</p>
          <div className="flex gap-0.5 mt-1.5">
            {[1, 2, 3, 4, 5].map(i => (
              <Star key={i} size={11}
                className={i <= rounded ? 'text-yellow-400' : 'text-slate-700'}
                fill={i <= rounded ? 'currentColor' : 'none'}
              />
            ))}
          </div>
          <p className="text-[9px] text-slate-500 mt-1.5">{data.totalRatings} reviews this month</p>
          {/* Mini bar chart */}
          <div className="mt-3 space-y-1">
            {[5, 4, 3, 2, 1].map(star => {
              const w = star === rounded ? 75 : star === rounded - 1 ? 50 : star === rounded + 1 ? 40 : 15;
              return (
                <div key={star} className="flex items-center gap-1.5">
                  <span className="text-[8px] text-slate-600 w-2">{star}</span>
                  <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-400/60 rounded-full" style={{ width: `${w}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <p className="text-3xl font-black text-slate-600">—</p>
          <p className="text-[9px] text-slate-600 mt-1">No reviews collected yet</p>
        </>
      )}
    </div>
  );
}
