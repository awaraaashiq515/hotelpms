import React from 'react';
import { ArrowUpRight, ArrowDownRight, Star } from 'lucide-react';

export interface PointsEntry {
  id: string;
  date: string;
  description: string;
  points: number;
  type: 'EARN' | 'REDEEM' | 'EXPIRE' | 'ADJUST';
  balance: number;
  reservationNo?: string;
}

interface PointsHistoryProps { entries: PointsEntry[] }

const TYPE_CONFIG: Record<string, { color: string; sign: string; icon: React.ElementType }> = {
  EARN:   { color: 'text-emerald-400', sign: '+', icon: ArrowUpRight },
  REDEEM: { color: 'text-rose-400',    sign: '-', icon: ArrowDownRight },
  EXPIRE: { color: 'text-slate-500',   sign: '-', icon: ArrowDownRight },
  ADJUST: { color: 'text-blue-400',    sign: '±', icon: Star },
};

export function PointsHistory({ entries }: PointsHistoryProps) {
  return (
    <div className="rounded-2xl bg-slate-900/50 border border-white/5 overflow-hidden">
      <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
        <Star size={13} className="text-yellow-400" />
        <span className="text-[11px] font-black text-white uppercase tracking-wider">Points History</span>
      </div>
      <div className="divide-y divide-white/5">
        {entries.length === 0 ? (
          <div className="py-8 text-center text-[10px] text-slate-600">No transactions yet</div>
        ) : entries.map(entry => {
          const cfg = TYPE_CONFIG[entry.type];
          return (
            <div key={entry.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/2 transition-colors">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                entry.type === 'EARN' ? 'bg-emerald-500/15'
                : entry.type === 'REDEEM' ? 'bg-rose-500/15'
                : 'bg-slate-800'
              }`}>
                <cfg.icon size={13} className={cfg.color} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-black text-white truncate">{entry.description}</p>
                <p className="text-[9px] text-slate-500">
                  {entry.date}
                  {entry.reservationNo ? ` · ${entry.reservationNo}` : ''}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className={`text-sm font-black ${cfg.color}`}>
                  {cfg.sign}{Math.abs(entry.points).toLocaleString()}
                </p>
                <p className="text-[9px] text-slate-600">Bal: {entry.balance.toLocaleString()}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
