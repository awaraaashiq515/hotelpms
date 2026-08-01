'use client';
import React, { useState } from 'react';
import { Shield, Key, Monitor, AlertTriangle } from 'lucide-react';
import { AuditLog, type AuditEntry } from './components/AuditLog';
import { ActiveSessions, type Session } from './components/ActiveSessions';

const MOCK_AUDIT: AuditEntry[] = [
  { id:'1', timestamp:'2026-07-14 10:48:22', user:'Preethi Kumar', role:'Manager',      action:'Modified room rate for Room 204', module:'Revenue',      ipAddress:'192.168.1.12', device:'Chrome/Windows', status:'SUCCESS' },
  { id:'2', timestamp:'2026-07-14 10:45:11', user:'Rahul Gupta',   role:'Receptionist', action:'Checked in guest John Smith',     module:'Front Office', ipAddress:'192.168.1.15', device:'Chrome/Mac',     status:'SUCCESS' },
  { id:'3', timestamp:'2026-07-14 10:30:08', user:'Unknown',       role:'Guest',        action:'Failed login attempt (3x)',        module:'Auth',         ipAddress:'45.123.22.88', device:'Firefox/Linux',  status:'FAILURE' },
  { id:'4', timestamp:'2026-07-14 10:22:45', user:'Anita Sharma',  role:'Housekeeper',  action:'Updated housekeeping task #HK-22', module:'Housekeeping', ipAddress:'192.168.1.20', device:'Mobile/Android', status:'SUCCESS' },
  { id:'5', timestamp:'2026-07-14 09:55:33', user:'Preethi Kumar', role:'Manager',      action:'Exported payroll report',          module:'Payroll',      ipAddress:'192.168.1.12', device:'Chrome/Windows', status:'WARNING' },
  { id:'6', timestamp:'2026-07-14 09:30:00', user:'System',        role:'CRON',         action:'Night audit auto-run',             module:'Night Audit',  ipAddress:'127.0.0.1',    device:'Server',         status:'SUCCESS' },
];

const MOCK_SESSIONS: Session[] = [
  { id:'1', user:'Preethi Kumar', role:'Manager',      device:'MacBook Pro',      deviceType:'DESKTOP', browser:'Chrome 126', ipAddress:'192.168.1.12', location:'Mumbai, IN', loginAt:'08:30 AM', lastActive:'Now',     isCurrent:true },
  { id:'2', user:'Rahul Gupta',   role:'Receptionist', device:'HP Desktop',       deviceType:'DESKTOP', browser:'Edge 125',   ipAddress:'192.168.1.15', location:'Mumbai, IN', loginAt:'09:00 AM', lastActive:'2m ago',  isCurrent:false },
  { id:'3', user:'Anita Sharma',  role:'Housekeeper',  device:'Samsung Galaxy',   deviceType:'MOBILE',  browser:'Chrome App', ipAddress:'192.168.1.20', location:'Mumbai, IN', loginAt:'07:00 AM', lastActive:'15m ago', isCurrent:false },
];

const SECURITY_STATS = [
  { label:'Failed Logins Today', value:3,   color:'text-rose-300 border-rose-500/20 bg-rose-900/20',     alert:true },
  { label:'Active Sessions',     value:3,   color:'text-sky-300 border-sky-500/20 bg-sky-900/20' },
  { label:'Audit Events Today',  value:128, color:'text-indigo-300 border-indigo-500/20 bg-indigo-900/20' },
  { label:'Security Score',      value:'A+',color:'text-emerald-300 border-emerald-500/20 bg-emerald-900/20' },
];

export default function SecurityPage() {
  const [tab, setTab] = useState<'audit'|'sessions'|'config'>('audit');
  const [sessions, setSessions] = useState(MOCK_SESSIONS);

  return (
    <div className="space-y-5 pb-10 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield size={14} className="text-indigo-400" />
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Admin · Security Center</span>
          </div>
          <h1 className="text-2xl font-black text-white">Security Center</h1>
          <p className="text-xs text-slate-500 mt-0.5">Audit logs · Active sessions · Access control · Compliance</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {SECURITY_STATS.map(s => (
          <div key={s.label} className={`rounded-2xl border p-4 ${s.color}`}>
            {(s as any).alert && <AlertTriangle size={13} className="text-rose-400 mb-1 animate-pulse" />}
            <p className="text-2xl font-black text-white">{s.value}</p>
            <p className="text-[9px] font-bold uppercase tracking-widest opacity-60 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Compliance badges */}
      <div className="flex flex-wrap gap-2">
        {['GDPR Compliant','PCI DSS Ready','SOC2 Type II','ISO 27001','OWASP Top10 Protected','256-bit AES Encryption'].map(b => (
          <span key={b} className="text-[9px] font-black text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
            ✓ {b}
          </span>
        ))}
      </div>

      <div className="flex gap-2">
        {([['audit','Audit Log'],['sessions','Active Sessions'],['config','Access Config']] as const).map(([v,l]) => (
          <button key={v} onClick={() => setTab(v)}
            className={`px-4 h-9 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors ${tab===v ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
            {l}
          </button>
        ))}
      </div>

      {tab === 'audit'    && <AuditLog entries={MOCK_AUDIT} />}
      {tab === 'sessions' && (
        <ActiveSessions sessions={sessions}
          onRevoke={id => setSessions(prev => prev.filter(s => s.id !== id))}
          onRevokeAll={() => setSessions(prev => prev.filter(s => s.isCurrent))} />
      )}
      {tab === 'config' && (
        <div className="rounded-2xl bg-slate-900/50 border border-white/5 p-6">
          <p className="text-[11px] font-black text-white uppercase tracking-wider mb-4">Access Configuration</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label:'Two-Factor Authentication', value:'Enabled — All users', active:true },
              { label:'Single Sign-On (SSO)',       value:'Google Workspace connected', active:true },
              { label:'IP Allowlist',               value:'3 IPs whitelisted', active:true },
              { label:'Session Timeout',            value:'8 hours inactivity', active:true },
              { label:'Device Management',          value:'4 trusted devices', active:true },
              { label:'API Rate Limiting',          value:'1000 req/min/key', active:true },
            ].map(c => (
              <div key={c.label} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-white/5">
                <div>
                  <p className="text-[11px] font-black text-white">{c.label}</p>
                  <p className="text-[9px] text-slate-500 mt-0.5">{c.value}</p>
                </div>
                <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border ${c.active ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20' : 'text-slate-500 bg-slate-800 border-slate-700'}`}>
                  {c.active ? 'ON' : 'OFF'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
