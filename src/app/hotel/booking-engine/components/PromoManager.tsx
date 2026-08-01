import React, { useState } from 'react';
import { Tag, Plus, X, Percent, Calendar } from 'lucide-react';

export interface PromoCode {
  id: string;
  code: string;
  discount: number;
  type: 'PERCENTAGE' | 'FIXED';
  minStay?: number;
  validFrom: string;
  validTo: string;
  maxUses: number;
  usedCount: number;
  isActive: boolean;
}

interface PromoManagerProps {
  promos: PromoCode[];
  onToggle?: (id: string) => void;
  onDelete?: (id: string) => void;
  onCreate?: () => void;
}

export function PromoManager({ promos, onToggle, onDelete, onCreate }: PromoManagerProps) {
  return (
    <div className="rounded-2xl bg-slate-900/50 border border-white/5 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Tag size={13} className="text-indigo-400" />
          <span className="text-[11px] font-black text-white uppercase tracking-wider">Promo Codes</span>
        </div>
        <button onClick={onCreate}
          className="flex items-center gap-1 h-7 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[9px] font-black uppercase tracking-wider">
          <Plus size={10} /> New Code
        </button>
      </div>
      <div className="divide-y divide-white/5">
        {promos.map(p => {
          const usesPct = p.maxUses > 0 ? Math.round((p.usedCount / p.maxUses) * 100) : 0;
          return (
            <div key={p.id} className={`px-4 py-3 flex items-center gap-3 ${!p.isActive ? 'opacity-50' : ''}`}>
              <div className="w-8 h-8 rounded-lg bg-indigo-500/15 flex items-center justify-center shrink-0">
                <Percent size={13} className="text-indigo-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-black text-white font-mono tracking-wider">{p.code}</span>
                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full ${
                    p.type === 'PERCENTAGE'
                      ? 'text-emerald-300 bg-emerald-500/10'
                      : 'text-amber-300 bg-amber-500/10'
                  }`}>
                    {p.type === 'PERCENTAGE' ? `${p.discount}% OFF` : `₹${p.discount} OFF`}
                  </span>
                </div>
                <p className="text-[9px] text-slate-500">
                  {p.validFrom} → {p.validTo}
                  {p.minStay ? ` · Min ${p.minStay} nights` : ''}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${usesPct}%` }} />
                  </div>
                  <span className="text-[8px] text-slate-600">{p.usedCount}/{p.maxUses} uses</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => onToggle?.(p.id)}
                  className={`text-[9px] font-black uppercase ${p.isActive ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {p.isActive ? 'Disable' : 'Enable'}
                </button>
                <button onClick={() => onDelete?.(p.id)} className="text-slate-600 hover:text-rose-400">
                  <X size={12} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
