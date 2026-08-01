import React from 'react';
import { Building2, Users, TrendingUp, Globe, CheckCircle2, AlertCircle } from 'lucide-react';

export interface Tenant {
  id: string;
  name: string;
  domain: string;
  plan: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE' | 'CUSTOM';
  rooms: number;
  activeUsers: number;
  status: 'ACTIVE' | 'SUSPENDED' | 'TRIAL' | 'CANCELLED';
  city: string;
  country: string;
  joinedAt: string;
  lastActive: string;
  mrr: number;
}

const PLAN_COLOR: Record<string, string> = {
  STARTER:      'text-slate-300 bg-slate-700',
  PROFESSIONAL: 'text-blue-300 bg-blue-500/10',
  ENTERPRISE:   'text-purple-300 bg-purple-500/10',
  CUSTOM:       'text-yellow-300 bg-yellow-500/10',
};
const STATUS_COLOR: Record<string, string> = {
  ACTIVE:    'text-emerald-300 bg-emerald-500/10 border-emerald-500/20',
  TRIAL:     'text-amber-300 bg-amber-500/10 border-amber-500/20',
  SUSPENDED: 'text-rose-300 bg-rose-500/10 border-rose-500/20',
  CANCELLED: 'text-slate-400 bg-slate-800 border-slate-700',
};

interface TenantListProps {
  tenants: Tenant[];
  onManage?: (t: Tenant) => void;
}

export function TenantList({ tenants, onManage }: TenantListProps) {
  const totalMRR = tenants.filter(t => t.status === 'ACTIVE').reduce((s, t) => s + t.mrr, 0);

  return (
    <div className="rounded-2xl bg-slate-900/50 border border-white/5 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Building2 size={13} className="text-violet-400" />
          <span className="text-[11px] font-black text-white uppercase tracking-wider">Tenants ({tenants.length})</span>
        </div>
        <span className="text-[11px] font-black text-emerald-300">MRR: ₹{(totalMRR/1000).toFixed(0)}K</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              {['Hotel', 'Domain', 'Plan', 'Rooms', 'Users', 'Status', 'MRR', 'Joined', 'Action'].map(h => (
                <th key={h} className="text-left px-4 py-2.5 text-[9px] font-black text-slate-600 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tenants.map(t => (
              <tr key={t.id} className="border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center text-[10px] font-black text-violet-300">
                      {t.name[0]}
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-white">{t.name}</p>
                      <p className="text-[8px] text-slate-600">{t.city}, {t.country}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-[9px] font-mono text-indigo-300">{t.domain}</td>
                <td className="px-4 py-3">
                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md ${PLAN_COLOR[t.plan]}`}>{t.plan}</span>
                </td>
                <td className="px-4 py-3 text-[10px] text-slate-300">{t.rooms}</td>
                <td className="px-4 py-3 text-[10px] text-slate-300">{t.activeUsers}</td>
                <td className="px-4 py-3">
                  <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border ${STATUS_COLOR[t.status]}`}>{t.status}</span>
                </td>
                <td className="px-4 py-3 text-[10px] font-black text-white">₹{t.mrr.toLocaleString('en-IN')}</td>
                <td className="px-4 py-3 text-[9px] text-slate-500">{t.joinedAt}</td>
                <td className="px-4 py-3">
                  <button onClick={() => onManage?.(t)}
                    className="text-[9px] font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-wider">Manage</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
