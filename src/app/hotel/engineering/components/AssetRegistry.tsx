import React from 'react';
import { Cpu, AlertCircle, CheckCircle2, Wrench } from 'lucide-react';

export interface Asset {
  id: string;
  name: string;
  assetCode: string;
  category: string;
  location: string;
  brand?: string;
  model?: string;
  purchaseDate?: string;
  warrantyExpiry?: string;
  status: 'OPERATIONAL' | 'UNDER_MAINTENANCE' | 'FAULTY' | 'DECOMMISSIONED';
  lastServiced?: string;
  nextService?: string;
  purchaseCost?: number;
}

const STATUS_CONFIG: Record<string, { color: string; dot: string }> = {
  OPERATIONAL:       { color: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20', dot: 'bg-emerald-400' },
  UNDER_MAINTENANCE: { color: 'text-amber-300 bg-amber-500/10 border-amber-500/20',       dot: 'bg-amber-400 animate-pulse' },
  FAULTY:            { color: 'text-rose-300 bg-rose-500/10 border-rose-500/20',           dot: 'bg-rose-400' },
  DECOMMISSIONED:    { color: 'text-slate-400 bg-slate-800 border-slate-700',             dot: 'bg-slate-600' },
};

interface AssetRegistryProps { assets: Asset[] }

export function AssetRegistry({ assets }: AssetRegistryProps) {
  const operational = assets.filter(a => a.status === 'OPERATIONAL').length;
  const faulty      = assets.filter(a => a.status === 'FAULTY').length;

  return (
    <div className="rounded-2xl bg-slate-900/50 border border-white/5 overflow-hidden">
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu size={13} className="text-cyan-400" />
          <span className="text-[11px] font-black text-white uppercase tracking-wider">Asset Registry</span>
        </div>
        <div className="flex gap-3">
          <span className="text-[9px] text-emerald-400">{operational} OK</span>
          {faulty > 0 && <span className="text-[9px] text-rose-400">{faulty} Faulty</span>}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              {['Asset', 'Code', 'Category', 'Location', 'Brand/Model', 'Last Serviced', 'Next Service', 'Status'].map(h => (
                <th key={h} className="text-left px-4 py-2.5 text-[9px] font-black text-slate-600 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {assets.map(asset => {
              const cfg = STATUS_CONFIG[asset.status];
              return (
                <tr key={asset.id} className="border-b border-white/5 last:border-0 hover:bg-white/2">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
                      <span className="text-[11px] font-black text-white">{asset.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[9px] font-mono text-indigo-300">{asset.assetCode}</td>
                  <td className="px-4 py-3 text-[10px] text-slate-400">{asset.category}</td>
                  <td className="px-4 py-3 text-[10px] text-slate-400">{asset.location}</td>
                  <td className="px-4 py-3 text-[9px] text-slate-500">{asset.brand} {asset.model}</td>
                  <td className="px-4 py-3 text-[9px] text-slate-500">{asset.lastServiced || '—'}</td>
                  <td className="px-4 py-3 text-[9px] text-slate-300">{asset.nextService || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border ${cfg.color}`}>
                      {asset.status.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
