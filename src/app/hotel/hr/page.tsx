'use client';
import React, { useState } from 'react';
import { Users, Plus, Search, Calendar, Award } from 'lucide-react';
import { LeaveManagement, type LeaveRequest } from './components/LeaveManagement';
import { StaffKPIs, type StaffKPI } from './components/StaffKPIs';

const MOCK_LEAVES: LeaveRequest[] = [
  { id:'1', staffName:'Anita Sharma',  designation:'Head Housekeeper', leaveType:'CASUAL',    from:'2026-07-15', to:'2026-07-15', days:1, reason:'Personal work',     status:'PENDING',  appliedOn:'2026-07-13' },
  { id:'2', staffName:'Vikram Nair',   designation:'F&B Supervisor',   leaveType:'SICK',      from:'2026-07-14', to:'2026-07-16', days:3, reason:'Fever',             status:'PENDING',  appliedOn:'2026-07-13' },
  { id:'3', staffName:'Preethi Kumar', designation:'Manager',           leaveType:'EARNED',    from:'2026-07-20', to:'2026-07-25', days:6, reason:'Family vacation',   status:'APPROVED', appliedOn:'2026-07-10' },
  { id:'4', staffName:'Deepak Verma',  designation:'Security Guard',    leaveType:'EMERGENCY', from:'2026-07-13', to:'2026-07-13', days:1, reason:'Family emergency',  status:'APPROVED', appliedOn:'2026-07-13' },
  { id:'5', staffName:'Rahul Gupta',   designation:'Receptionist',      leaveType:'CASUAL',    from:'2026-07-18', to:'2026-07-18', days:1, reason:'Doctor appointment',status:'REJECTED', appliedOn:'2026-07-11' },
];

const MOCK_KPIS: StaffKPI[] = [
  { id:'1', name:'Anita Sharma',  designation:'Head Housekeeper', dept:'Housekeeping', attendancePct:96, tasksCompleted:18, avgRating:4.8, punctuality:95, performanceScore:93 },
  { id:'2', name:'Rahul Gupta',   designation:'Receptionist',     dept:'Front Office',  attendancePct:88, tasksCompleted:22, avgRating:4.5, punctuality:80, performanceScore:82 },
  { id:'3', name:'Preethi Kumar', designation:'Manager',          dept:'Front Office',  attendancePct:92, tasksCompleted:30, avgRating:4.7, punctuality:90, performanceScore:90 },
  { id:'4', name:'Arjun Singh',   designation:'Chef',             dept:'Kitchen',       attendancePct:98, tasksCompleted:25, avgRating:4.9, punctuality:98, performanceScore:96 },
  { id:'5', name:'Deepak Verma',  designation:'Security',         dept:'Security',      attendancePct:100,tasksCompleted:14, avgRating:4.2, punctuality:100,performanceScore:88 },
];

export default function HRPage() {
  const [tab, setTab] = useState<'leave'|'kpi'>('leave');
  const [leaves, setLeaves] = useState(MOCK_LEAVES);

  const pending = leaves.filter(l => l.status === 'PENDING').length;

  function approve(id: string) { setLeaves(prev => prev.map(l => l.id === id ? { ...l, status: 'APPROVED' } : l)); }
  function reject(id: string)  { setLeaves(prev => prev.map(l => l.id === id ? { ...l, status: 'REJECTED' } : l)); }

  return (
    <div className="space-y-5 pb-10 max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users size={14} className="text-blue-400" />
            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Human Resources · HR</span>
          </div>
          <h1 className="text-2xl font-black text-white">HR Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">{pending} leave requests pending approval</p>
        </div>
        <button className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-wider">
          <Plus size={12} /> Add Staff
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label:'Total Staff',    value:18, color:'text-blue-300 border-blue-500/20 bg-blue-900/20' },
          { label:'Leave Pending',  value:pending, color:'text-amber-300 border-amber-500/20 bg-amber-900/20' },
          { label:'On Leave Today', value:2,  color:'text-rose-300 border-rose-500/20 bg-rose-900/20' },
          { label:'Avg Performance',value:'89%', color:'text-emerald-300 border-emerald-500/20 bg-emerald-900/20' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl border p-4 ${s.color}`}>
            <p className="text-2xl font-black text-white">{s.value}</p>
            <p className="text-[9px] font-bold uppercase tracking-widest opacity-60 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {([['leave','Leave Requests'],['kpi','Performance KPIs']] as const).map(([v,l]) => (
          <button key={v} onClick={() => setTab(v)}
            className={`flex items-center gap-1.5 px-4 h-9 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors ${tab===v ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
            {v === 'leave' ? <Calendar size={12} /> : <Award size={12} />}{l}
          </button>
        ))}
      </div>

      {tab === 'leave' ? (
        <LeaveManagement requests={leaves} onApprove={approve} onReject={reject} />
      ) : (
        <StaffKPIs staff={MOCK_KPIS} />
      )}
    </div>
  );
}
