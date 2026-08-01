import React from 'react';
import { Shield, User, Smartphone, Globe, CheckCircle2, XCircle } from 'lucide-react';

export interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  module: string;
  resourceId?: string;
  ipAddress: string;
  device: string;
  status: 'SUCCESS' | 'FAILURE' | 'WARNING';
}

const STATUS_CONFIG: Record<string, string> = {
  SUCCESS: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20',
  FAILURE: 'text-rose-300 bg-rose-500/10 border-rose-500/20',
  WARNING: 'text-amber-300 bg-amber-500/10 border-amber-500/20',
};

interface AuditLogProps { entries: AuditEntry[] }

export function AuditLog({ entries }: AuditLogProps) {
  return (
    <div className="rounded-2xl bg-slate-900/50 border border-white/5 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
        <Shield size={13} className="text-indigo-400" />
        <span className="text-[11px] font-black text-white uppercase tracking-wider">Audit Log</span>
        <span className="ml-auto text-[9px] text-slate-500">{entries.length} events</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              {['Timestamp', 'User', 'Action', 'Module', 'IP Address', 'Device', 'Status'].map(h => (
                <th key={h} className="text-left px-4 py-2.5 text-[9px] font-black text-slate-600 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entries.map(e => (
              <tr key={e.id} className="border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors">
                <td className="px-4 py-2.5 text-[9px] text-slate-500 font-mono whitespace-nowrap">{e.timestamp}</td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-md bg-indigo-600/50 flex items-center justify-center text-[8px] font-black text-white">
                      {e.user[0]}
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-white">{e.user}</p>
                      <p className="text-[8px] text-slate-600">{e.role}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-[10px] text-slate-300 max-w-[200px] truncate">{e.action}</td>
                <td className="px-4 py-2.5 text-[9px] text-indigo-300 font-semibold">{e.module}</td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-1">
                    <Globe size={9} className="text-slate-600" />
                    <span className="text-[9px] font-mono text-slate-400">{e.ipAddress}</span>
                  </div>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-1">
                    <Smartphone size={9} className="text-slate-600" />
                    <span className="text-[9px] text-slate-500">{e.device}</span>
                  </div>
                </td>
                <td className="px-4 py-2.5">
                  <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border ${STATUS_CONFIG[e.status]}`}>
                    {e.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
