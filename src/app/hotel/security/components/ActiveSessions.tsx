import React from 'react';
import { Monitor, Smartphone, Globe, LogOut, AlertTriangle } from 'lucide-react';

export interface Session {
  id: string;
  user: string;
  role: string;
  device: string;
  deviceType: 'DESKTOP' | 'MOBILE' | 'TABLET';
  browser: string;
  ipAddress: string;
  location: string;
  loginAt: string;
  lastActive: string;
  isCurrent: boolean;
}

interface ActiveSessionsProps {
  sessions: Session[];
  onRevoke?: (id: string) => void;
  onRevokeAll?: () => void;
}

export function ActiveSessions({ sessions, onRevoke, onRevokeAll }: ActiveSessionsProps) {
  return (
    <div className="rounded-2xl bg-slate-900/50 border border-white/5 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Monitor size={13} className="text-sky-400" />
          <span className="text-[11px] font-black text-white uppercase tracking-wider">Active Sessions</span>
          <span className="text-[9px] font-black text-sky-300 bg-sky-500/10 px-1.5 py-0.5 rounded-full border border-sky-500/20">{sessions.length} online</span>
        </div>
        {sessions.length > 1 && (
          <button onClick={onRevokeAll}
            className="text-[9px] font-black text-rose-400 hover:text-rose-300 uppercase tracking-wider">
            Revoke All Others
          </button>
        )}
      </div>
      <div className="divide-y divide-white/5">
        {sessions.map(s => (
          <div key={s.id} className={`flex items-center gap-3 px-4 py-3 hover:bg-white/2 transition-colors ${s.isCurrent ? 'bg-indigo-900/10' : ''}`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              s.deviceType === 'MOBILE' ? 'bg-purple-500/15' : 'bg-sky-500/15'
            }`}>
              {s.deviceType === 'MOBILE' ? <Smartphone size={14} className="text-purple-400" /> : <Monitor size={14} className="text-sky-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-[11px] font-black text-white">{s.user}</p>
                <span className="text-[8px] text-slate-600">{s.role}</span>
                {s.isCurrent && <span className="text-[7px] font-black text-indigo-300 bg-indigo-500/20 px-1 py-0.5 rounded">This Session</span>}
              </div>
              <p className="text-[9px] text-slate-500">{s.browser} · {s.device}</p>
              <div className="flex items-center gap-3 mt-0.5">
                <div className="flex items-center gap-1">
                  <Globe size={8} className="text-slate-600" />
                  <span className="text-[8px] text-slate-600 font-mono">{s.ipAddress}</span>
                </div>
                <span className="text-[8px] text-slate-600">{s.location}</span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[9px] text-slate-400">Last: {s.lastActive}</p>
              <p className="text-[8px] text-slate-600">Login: {s.loginAt}</p>
              {!s.isCurrent && (
                <button onClick={() => onRevoke?.(s.id)}
                  className="mt-1 text-[8px] font-black text-rose-400 hover:text-rose-300 flex items-center gap-0.5 ml-auto">
                  <LogOut size={9} /> Revoke
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
