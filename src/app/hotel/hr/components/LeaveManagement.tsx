'use client';
import React, { useState } from 'react';
import { Calendar, CheckCircle2, XCircle, Clock, Plus } from 'lucide-react';

export interface LeaveRequest {
  id: string;
  staffName: string;
  designation: string;
  leaveType: 'CASUAL' | 'SICK' | 'EARNED' | 'MATERNITY' | 'EMERGENCY';
  from: string;
  to: string;
  days: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  appliedOn: string;
}

const TYPE_COLOR: Record<string, string> = {
  CASUAL:    'text-blue-300 bg-blue-500/10',
  SICK:      'text-rose-300 bg-rose-500/10',
  EARNED:    'text-emerald-300 bg-emerald-500/10',
  MATERNITY: 'text-pink-300 bg-pink-500/10',
  EMERGENCY: 'text-amber-300 bg-amber-500/10',
};

interface LeaveManagementProps {
  requests: LeaveRequest[];
  onApprove?: (id: string) => void;
  onReject?:  (id: string) => void;
}

export function LeaveManagement({ requests, onApprove, onReject }: LeaveManagementProps) {
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');

  const filtered = filter === 'ALL' ? requests : requests.filter(r => r.status === filter);

  return (
    <div className="rounded-2xl bg-slate-900/50 border border-white/5 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <p className="text-[11px] font-black text-white uppercase tracking-wider">Leave Requests</p>
        <div className="flex gap-1">
          {(['ALL','PENDING','APPROVED','REJECTED'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-2.5 h-7 rounded-lg text-[9px] font-black uppercase tracking-wider transition-colors ${
                filter === f ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}>{f}</button>
          ))}
        </div>
      </div>
      <div className="divide-y divide-white/5">
        {filtered.length === 0 ? (
          <div className="py-8 text-center text-[10px] text-slate-600">No {filter.toLowerCase()} requests</div>
        ) : filtered.map(req => (
          <div key={req.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/2 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-[10px] font-black text-white shrink-0">
              {req.staffName.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-black text-white">{req.staffName}</p>
              <p className="text-[9px] text-slate-500">{req.designation}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md ${TYPE_COLOR[req.leaveType]}`}>
                  {req.leaveType}
                </span>
                <span className="text-[9px] text-slate-500">
                  {req.from} → {req.to} · {req.days} day{req.days > 1 ? 's' : ''}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {req.status === 'PENDING' ? (
                <>
                  <button onClick={() => onApprove?.(req.id)}
                    className="w-7 h-7 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/30 flex items-center justify-center transition-colors">
                    <CheckCircle2 size={13} className="text-emerald-400" />
                  </button>
                  <button onClick={() => onReject?.(req.id)}
                    className="w-7 h-7 rounded-lg bg-rose-500/15 hover:bg-rose-500/30 flex items-center justify-center transition-colors">
                    <XCircle size={13} className="text-rose-400" />
                  </button>
                </>
              ) : (
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                  req.status === 'APPROVED'
                    ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20'
                    : 'text-rose-300 bg-rose-500/10 border-rose-500/20'
                }`}>{req.status}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
