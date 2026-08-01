import React, { useState } from 'react';
import { Package2, Plus, Edit2 } from 'lucide-react';

export interface RatePlan {
  id: string;
  name: string;
  code: string;
  type: 'BAR' | 'CORPORATE' | 'PACKAGE' | 'PROMOTIONAL' | 'LOYALTY';
  rate: number;
  mealPlan: 'EP' | 'CP' | 'MAP' | 'AP';
  minStay: number;
  cancellationPolicy: string;
  isActive: boolean;
  roomTypes: string[];
}

const MEAL_LABELS: Record<string, string> = {
  EP: 'Room Only', CP: 'With Breakfast', MAP: 'Half Board', AP: 'Full Board',
};
const TYPE_COLOR: Record<string, string> = {
  BAR:         'text-sky-300 bg-sky-500/10',
  CORPORATE:   'text-blue-300 bg-blue-500/10',
  PACKAGE:     'text-purple-300 bg-purple-500/10',
  PROMOTIONAL: 'text-rose-300 bg-rose-500/10',
  LOYALTY:     'text-yellow-300 bg-yellow-500/10',
};

interface RateConfigProps {
  plans: RatePlan[];
  onToggle?: (id: string) => void;
  onCreate?: () => void;
}

export function RateConfig({ plans, onToggle, onCreate }: RateConfigProps) {
  return (
    <div className="rounded-2xl bg-slate-900/50 border border-white/5 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Package2 size={13} className="text-violet-400" />
          <span className="text-[11px] font-black text-white uppercase tracking-wider">Rate Plans</span>
          <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
            {plans.filter(p => p.isActive).length} Active
          </span>
        </div>
        <button onClick={onCreate}
          className="flex items-center gap-1 h-7 px-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-[9px] font-black uppercase tracking-wider">
          <Plus size={10} /> New Plan
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              {['Plan Name', 'Code', 'Type', 'Rate', 'Meal Plan', 'Min Stay', 'Cancellation', 'Status'].map(h => (
                <th key={h} className="text-left px-4 py-2.5 text-[9px] font-black text-slate-600 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {plans.map(plan => (
              <tr key={plan.id} className={`border-b border-white/5 last:border-0 hover:bg-white/2 ${!plan.isActive ? 'opacity-40' : ''}`}>
                <td className="px-4 py-3 text-[11px] font-black text-white">{plan.name}</td>
                <td className="px-4 py-3 text-[10px] font-mono text-indigo-300">{plan.code}</td>
                <td className="px-4 py-3">
                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md ${TYPE_COLOR[plan.type]}`}>{plan.type}</span>
                </td>
                <td className="px-4 py-3 text-[11px] font-black text-white">₹{plan.rate.toLocaleString('en-IN')}</td>
                <td className="px-4 py-3 text-[10px] text-slate-400">{MEAL_LABELS[plan.mealPlan]}</td>
                <td className="px-4 py-3 text-[10px] text-slate-400">{plan.minStay}N</td>
                <td className="px-4 py-3 text-[9px] text-slate-500">{plan.cancellationPolicy}</td>
                <td className="px-4 py-3">
                  <button onClick={() => onToggle?.(plan.id)}
                    className={`text-[9px] font-black uppercase ${plan.isActive ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {plan.isActive ? 'Active' : 'Inactive'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
