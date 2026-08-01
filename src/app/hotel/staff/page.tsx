'use client';

import React, { useState, useEffect } from 'react';
import { Users, Search, Plus, Clock, CheckCircle2, XCircle, Phone, RefreshCw } from 'lucide-react';
import StaffManagement from '@/components/admin/StaffManagement';

const STATUS_COLOR: Record<string, string> = {
  PRESENT: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20',
  ABSENT:  'text-rose-300 bg-rose-500/10 border-rose-500/20',
  LATE:    'text-amber-300 bg-amber-500/10 border-amber-500/20',
  LEAVE:   'text-slate-400 bg-slate-800 border-slate-700',
};

export default function StaffPage() {
  const [search, setSearch] = useState('');
  const [dept, setDept] = useState('ALL');
  const [activeSubTab, setActiveSubTab] = useState<'attendance' | 'accounts'>('attendance');
  const [properties, setProperties] = useState<any[]>([]);
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStaffData = async () => {
    setLoading(true);
    try {
      const [staffRes, propRes] = await Promise.all([
        fetch('/api/staff-members').then(r => r.json()),
        fetch('/api/admin/properties').then(r => r.json())
      ]);
      if (staffRes.success) {
        setStaffMembers(staffRes.data || []);
      }
      if (propRes.success) {
        setProperties(propRes.data || []);
      }
    } catch (err) {
      console.error('Failed to load real staff database', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffData();
  }, []);

  // Map real database status or fallback
  const getStatus = (s: any) => {
    if (!s.isActive) return 'LEAVE';
    // Fallback status mappings or mock check-ins
    return s.isActive ? 'PRESENT' : 'ABSENT';
  };

  const getShiftHoursLabel = (hours: number | null | undefined) => {
    if (!hours) return '8h';
    const hrs = Math.floor(hours);
    const mins = Math.round((hours - hrs) * 60);
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
  };

  const departments = ['ALL', ...Array.from(new Set(staffMembers.map(s => s.designation).filter(Boolean)))];
  
  const filteredStaff = staffMembers
    .filter(s => dept === 'ALL' || s.designation === dept)
    .filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()));

  const totalCount = staffMembers.length;
  const present = staffMembers.filter(s => getStatus(s) === 'PRESENT').length;
  const absent  = staffMembers.filter(s => getStatus(s) === 'ABSENT').length;
  const leave   = staffMembers.filter(s => getStatus(s) === 'LEAVE').length;

  return (
    <div className="space-y-6 pb-10 max-w-[1400px] mx-auto">
      
      {/* Header section */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users size={14} className="text-blue-400" />
            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">HR · Staff Management</span>
          </div>
          <h1 className="text-2xl font-black text-white">Staff Portal</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage daily attendance and PMS/POS login credentials</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Housekeeper Portal quick link */}
          <a
            href="/housekeeper-portal"
            target="_blank"
            className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs font-bold transition-all"
          >
            🧹 Housekeeper Portal ↗
          </a>
          <button 
            onClick={fetchStaffData}
            className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-all"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh Data
          </button>
        </div>
      </div>

      {/* Tab selection */}
      <div className="flex gap-2 border-b border-white/5 pb-3">
        <button
          onClick={() => setActiveSubTab('attendance')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'attendance'
              ? 'bg-blue-600/20 border border-blue-500/30 text-blue-300 font-black'
              : 'bg-white/[0.02] border border-white/5 text-slate-500 hover:text-slate-300'
          }`}
        >
          📅 Daily Attendance & Roster
        </button>
        <button
          onClick={() => setActiveSubTab('accounts')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'accounts'
              ? 'bg-blue-600/20 border border-blue-500/30 text-blue-300 font-black'
              : 'bg-white/[0.02] border border-white/5 text-slate-500 hover:text-slate-300'
          }`}
        >
          🔑 Staff Credentials & PMS/POS Roles
        </button>
      </div>

      {activeSubTab === 'attendance' ? (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label:'Total Staff', value: totalCount, color:'text-blue-300 border-blue-500/20 bg-blue-900/20' },
              { label:'Active / On-Duty', value: present, color:'text-emerald-300 border-emerald-500/20 bg-emerald-900/20' },
              { label:'Inactive', value: absent, color:'text-rose-300 border-rose-500/20 bg-rose-900/20' },
              { label:'On Leave', value: leave, color:'text-slate-400 border-slate-700 bg-slate-800/40' },
            ].map(s => (
              <div key={s.label} className={`rounded-2xl border p-4 ${s.color}`}>
                <p className="text-3xl font-black text-white">{s.value}</p>
                <p className="text-[9px] font-bold uppercase tracking-widest opacity-60 mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search staff…"
                className="w-full h-9 pl-9 pr-4 bg-slate-800/60 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500" />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {departments.map(d => (
                <button key={d || 'Staff'} onClick={() => setDept(d || 'ALL')}
                  className={`px-3 h-9 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors ${dept===(d || 'ALL') ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                  {d || 'Staff'}
                </button>
              ))}
            </div>
          </div>

          {/* Staff Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <RefreshCw className="animate-spin text-blue-500" size={24} />
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Loading staff directory...</p>
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="text-center py-20 bg-white/[0.01] border border-white/5 rounded-2xl">
              <Users size={32} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">No matching staff accounts found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              {filteredStaff.map(s => {
                const status = getStatus(s);
                return (
                  <div key={s.id} className="rounded-2xl bg-slate-900/50 border border-white/5 p-4 hover:border-blue-500/30 transition-all duration-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-sm font-black text-white shrink-0">
                        {s.name.split(' ').map((n: string)=>n[0]).join('')}
                      </div>
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border ${STATUS_COLOR[status]}`}>
                        {status}
                      </span>
                    </div>
                    <p className="text-xs font-black text-white">{s.name}</p>
                    <p className="text-[9px] text-slate-500 mt-0.5">{s.designation || 'Staff Member'}</p>
                    {/* Role badge */}
                    {s.user?.role?.name && (
                      <span className="inline-block mt-1 text-[8px] font-black px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 uppercase tracking-wider">
                        👤 {s.user.role.name}
                      </span>
                    )}
                    {/* Property badge */}
                    {s.property?.name && (
                      <span className="inline-block mt-1 ml-1 text-[8px] font-black px-2 py-0.5 rounded-full bg-slate-700/60 border border-white/10 text-slate-400">
                        🏨 {s.property.name}
                      </span>
                    )}
                    <p className="text-[9px] text-slate-600 mt-1">
                      Shift: {getShiftHoursLabel(s.shiftHours)} {s.salary > 0 && `· ₹${s.salary}/mo`}
                    </p>
                    <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                      {s.user?.email ? (
                        <span className="text-[9px] text-slate-400 flex items-center gap-1">
                          <Clock size={9} className="text-slate-600" /> credentials linked
                        </span>
                      ) : (
                        <span className="text-[9px] text-slate-600">no login credentials</span>
                      )}
                      {s.phone && (
                        <a href={`tel:${s.phone}`} className="text-[9px] text-blue-400 hover:text-blue-300">
                          <Phone size={10} />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <StaffManagement properties={properties} />
      )}

    </div>
  );
}
