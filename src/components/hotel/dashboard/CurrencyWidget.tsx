import React from 'react';
import { DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import type { CurrencyRate } from '@/types/hotel/dashboard.types';

function getMockCurrencies(): CurrencyRate[] {
  return [
    { code: 'USD', rate: 83.62, flag: '🇺🇸', change: 0.12 },
    { code: 'EUR', rate: 91.45, flag: '🇪🇺', change: -0.08 },
    { code: 'GBP', rate: 107.2, flag: '🇬🇧', change: 0.31 },
    { code: 'AED', rate: 22.76, flag: '🇦🇪', change: 0.04 },
    { code: 'SGD', rate: 61.83, flag: '🇸🇬', change: -0.15 },
    { code: 'JPY', rate: 0.543, flag: '🇯🇵', change: 0.02 },
  ];
}

export function CurrencyWidget() {
  const currencies = getMockCurrencies();
  return (
    <div className="rounded-2xl bg-slate-900/50 border border-white/5 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
        <DollarSign size={13} className="text-green-400" />
        <span className="text-[11px] font-black text-white uppercase tracking-wider">Currency Exchange</span>
      </div>
      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
        {currencies.map(c => (
          <div key={c.code} className="rounded-xl bg-white/3 border border-white/5 p-3 hover:bg-white/5 transition-colors">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm">{c.flag}</span>
              <span className={`text-[8px] font-black flex items-center gap-0.5 ${c.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {c.change >= 0 ? <ArrowUpRight size={8} /> : <ArrowDownRight size={8} />}
                {Math.abs(c.change)}
              </span>
            </div>
            <p className="text-[11px] font-black text-white">₹{c.rate.toFixed(c.rate < 1 ? 3 : 2)}</p>
            <p className="text-[8px] text-slate-500 font-bold">{c.code} / INR</p>
          </div>
        ))}
      </div>
      <p className="text-[8px] text-slate-700 px-4 pb-2">* Integrate RBI/Forex API for live rates</p>
    </div>
  );
}
