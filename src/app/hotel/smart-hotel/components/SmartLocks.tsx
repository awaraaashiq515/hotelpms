import React from 'react';
import { Lock, Unlock, Key, Smartphone, Wifi, WifiOff } from 'lucide-react';

export interface SmartLock {
  id: string;
  roomNumber: string;
  floor: string;
  status: 'LOCKED' | 'UNLOCKED' | 'OFFLINE' | 'LOW_BATTERY';
  battery: number;
  lastAccess?: string;
  accessMethod?: 'NFC' | 'PIN' | 'APP' | 'STAFF';
  guestName?: string;
}

interface SmartLocksProps { locks: SmartLock[] }

const STATUS_CONFIG: Record<string, { color: string; icon: React.ElementType; label: string }> = {
  LOCKED:      { color: 'text-emerald-400', icon: Lock,    label: 'Secured' },
  UNLOCKED:    { color: 'text-amber-400',   icon: Unlock,  label: 'Open' },
  OFFLINE:     { color: 'text-rose-400',    icon: WifiOff, label: 'Offline' },
  LOW_BATTERY: { color: 'text-orange-400',  icon: Lock,    label: 'Low Battery' },
};

function BatteryBar({ pct }: { pct: number }) {
  const color = pct > 50 ? 'bg-emerald-500' : pct > 20 ? 'bg-amber-500' : 'bg-rose-500';
  return (
    <div className="flex items-center gap-1">
      <div className="w-8 h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[8px] text-slate-500">{pct}%</span>
    </div>
  );
}

export function SmartLocks({ locks }: SmartLocksProps) {
  const offline  = locks.filter(l => l.status === 'OFFLINE').length;
  const lowBatt  = locks.filter(l => l.status === 'LOW_BATTERY' || l.battery < 20).length;

  return (
    <div className="rounded-2xl bg-slate-900/50 border border-white/5 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Key size={13} className="text-emerald-400" />
          <span className="text-[11px] font-black text-white uppercase tracking-wider">Smart Locks</span>
        </div>
        <div className="flex gap-3">
          {offline > 0 && <span className="text-[9px] text-rose-400 font-black">{offline} Offline</span>}
          {lowBatt > 0 && <span className="text-[9px] text-amber-400 font-black">{lowBatt} Low Battery</span>}
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 p-4">
        {locks.map(lock => {
          const cfg = STATUS_CONFIG[lock.status];
          return (
            <div key={lock.id}
              className={`rounded-xl p-3 border transition-colors ${
                lock.status === 'LOCKED'      ? 'bg-emerald-900/10 border-emerald-500/20'
                : lock.status === 'UNLOCKED'  ? 'bg-amber-900/10 border-amber-500/20'
                : lock.status === 'OFFLINE'   ? 'bg-rose-900/10 border-rose-500/20'
                : 'bg-orange-900/10 border-orange-500/20'
              }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-white">Rm {lock.roomNumber}</span>
                <cfg.icon size={14} className={cfg.color} />
              </div>
              <p className="text-[8px] text-slate-500 mb-2">Floor {lock.floor}</p>
              <BatteryBar pct={lock.battery} />
              <p className={`text-[9px] font-black mt-2 ${cfg.color}`}>{cfg.label}</p>
              {lock.lastAccess && (
                <p className="text-[8px] text-slate-600 mt-0.5">{lock.lastAccess} · {lock.accessMethod}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
