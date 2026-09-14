'use client';
import React, { useState, useEffect } from 'react';
import { Users, Plus, Calendar, Award, RefreshCw, X, AlertCircle } from 'lucide-react';
import { LeaveManagement, type LeaveRequest } from './components/LeaveManagement';
import { StaffKPIs, type StaffKPI } from './components/StaffKPIs';

interface RawStaff {
  id: string;
  name: string;
  designation: string | null;
  department?: string | null;
  salary?: number | null;
  isActive?: boolean;
}

export default function HRPage() {
  const [tab, setTab]                 = useState<'leave' | 'kpi'>('leave');
  const [leaves, setLeaves]           = useState<LeaveRequest[]>([]);
  const [staffList, setStaffList]     = useState<RawStaff[]>([]);
  const [attendance, setAttendance]   = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);

  // New leave modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting]     = useState(false);
  const [newLeaveStaffId, setNewLeaveStaffId] = useState('');
  const [newLeaveType, setNewLeaveType]       = useState<'CASUAL' | 'SICK' | 'EARNED' | 'EMERGENCY'>('CASUAL');
  const [newFromDate, setNewFromDate]         = useState(new Date().toISOString().split('T')[0]);
  const [newToDate, setNewToDate]             = useState(new Date().toISOString().split('T')[0]);
  const [newReason, setNewReason]             = useState('');

  // Load all real data
  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      const [leavesRes, staffRes, attRes] = await Promise.all([
        fetch('/api/leave-requests'),
        fetch('/api/staff-members'),
        fetch('/api/staff-attendance?all=true').catch(() => null),
      ]);

      if (leavesRes.ok) {
        const json = await leavesRes.json();
        setLeaves(Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []));
      }

      let fetchedStaff: RawStaff[] = [];
      if (staffRes.ok) {
        const json = await staffRes.json();
        fetchedStaff = Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []);
        setStaffList(fetchedStaff);
        if (fetchedStaff.length > 0 && !newLeaveStaffId) {
          setNewLeaveStaffId(fetchedStaff[0].id);
        }
      }

      if (attRes && attRes.ok) {
        const json = await attRes.json();
        setAttendance(Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load HR data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Approve leave
  async function handleApprove(id: string) {
    try {
      const res = await fetch(`/api/leave-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'APPROVED' }),
      });
      if (res.ok) {
        setLeaves(prev => prev.map(l => l.id === id ? { ...l, status: 'APPROVED' } : l));
      }
    } catch (e) {
      console.error('Failed to approve leave', e);
    }
  }

  // Reject leave
  async function handleReject(id: string) {
    try {
      const res = await fetch(`/api/leave-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REJECTED' }),
      });
      if (res.ok) {
        setLeaves(prev => prev.map(l => l.id === id ? { ...l, status: 'REJECTED' } : l));
      }
    } catch (e) {
      console.error('Failed to reject leave', e);
    }
  }

  // Create new leave request
  async function handleCreateLeave(e: React.FormEvent) {
    e.preventDefault();
    if (!newLeaveStaffId) return;

    try {
      setSubmitting(true);
      const from = new Date(newFromDate);
      const to   = new Date(newToDate);
      const diffTime = Math.max(0, to.getTime() - from.getTime());
      const days = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;

      const res = await fetch('/api/leave-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffId:   newLeaveStaffId,
          leaveType: newLeaveType,
          fromDate:  newFromDate,
          toDate:    newToDate,
          days:      Math.max(1, days),
          reason:    newReason.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || 'Failed to submit leave request');
      }

      const created = await res.json();
      const newLeave = created.data || created;
      setLeaves(prev => [newLeave, ...prev]);
      setShowAddModal(false);
      setNewReason('');
    } catch (err: any) {
      alert(err.message || 'Failed to create leave request');
    } finally {
      setSubmitting(false);
    }
  }

  // Real KPI calculations based on real attendance records
  const kpis: StaffKPI[] = staffList.map(s => {
    const staffAtt = attendance.filter(a => a.staffMemberId === s.id || a.staffMember?.id === s.id);
    const presentDays = staffAtt.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length;
    // Base standard 26 working days
    const totalWorkingDays = 26;
    const attendancePct = staffAtt.length > 0
      ? Math.min(100, Math.round((presentDays / Math.max(staffAtt.length, 1)) * 100))
      : 100; // Default 100% if no absence recorded yet

    return {
      id: s.id,
      name: s.name,
      designation: s.designation || 'Staff',
      dept: (s as any).department || 'General',
      attendancePct,
      presentDays,
      totalDays: totalWorkingDays,
      performanceScore: attendancePct,
    };
  });

  const pendingCount = leaves.filter(l => l.status === 'PENDING').length;

  // On leave today calculation
  const todayStr = new Date().toISOString().split('T')[0];
  const onLeaveTodayCount = leaves.filter(l => {
    if (l.status !== 'APPROVED') return false;
    const f = new Date(l.fromDate).toISOString().split('T')[0];
    const t = new Date(l.toDate).toISOString().split('T')[0];
    return todayStr >= f && todayStr <= t;
  }).length;

  const avgPerformance = kpis.length > 0
    ? Math.round(kpis.reduce((acc, k) => acc + k.performanceScore, 0) / kpis.length)
    : 100;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw size={24} className="animate-spin text-blue-400" />
          <p className="text-sm text-slate-400">Loading HR & Staff data…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-10 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users size={14} className="text-blue-400" />
            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Human Resources · HR</span>
          </div>
          <h1 className="text-2xl font-black text-white">HR Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {pendingCount} leave request{pendingCount === 1 ? '' : 's'} pending approval
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-wider transition-colors shadow-lg shadow-blue-500/20"
          >
            <Plus size={12} /> Apply Leave
          </button>
          <a
            href="/hotel/staff-members"
            className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-black uppercase tracking-wider transition-colors border border-white/5"
          >
            Manage Staff
          </a>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-rose-900/20 border border-rose-500/30 text-rose-300 text-xs">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Real Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Staff',     value: staffList.length, color: 'text-blue-300 border-blue-500/20 bg-blue-900/20' },
          { label: 'Leave Pending',   value: pendingCount,     color: 'text-amber-300 border-amber-500/20 bg-amber-900/20' },
          { label: 'On Leave Today',  value: onLeaveTodayCount,color: 'text-rose-300 border-rose-500/20 bg-rose-900/20' },
          { label: 'Avg Attendance',  value: `${avgPerformance}%`, color: 'text-emerald-300 border-emerald-500/20 bg-emerald-900/20' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl border p-4 ${s.color}`}>
            <p className="text-2xl font-black text-white">{s.value}</p>
            <p className="text-[9px] font-bold uppercase tracking-widest opacity-60 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {([['leave', 'Leave Requests'], ['kpi', 'Performance & Attendance']] as const).map(([v, l]) => (
          <button
            key={v}
            onClick={() => setTab(v)}
            className={`flex items-center gap-1.5 px-4 h-9 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors ${
              tab === v ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {v === 'leave' ? <Calendar size={12} /> : <Award size={12} />}
            {l}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'leave' ? (
        <LeaveManagement
          requests={leaves}
          onApprove={handleApprove}
          onReject={handleReject}
          onAdd={() => setShowAddModal(true)}
        />
      ) : (
        <StaffKPIs staff={kpis} />
      )}

      {/* Apply Leave Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-blue-400" />
                <h2 className="text-sm font-black text-white uppercase tracking-wider">New Leave Request</h2>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X size={14} />
              </button>
            </div>

            {staffList.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No active staff members found. Please add staff members first.
              </div>
            ) : (
              <form onSubmit={handleCreateLeave} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Staff Member
                  </label>
                  <select
                    value={newLeaveStaffId}
                    onChange={e => setNewLeaveStaffId(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-slate-800 border border-white/10 text-white text-xs focus:outline-none focus:border-blue-500"
                    required
                  >
                    {staffList.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.designation || 'Staff'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Leave Type
                  </label>
                  <select
                    value={newLeaveType}
                    onChange={e => setNewLeaveType(e.target.value as any)}
                    className="w-full h-10 px-3 rounded-xl bg-slate-800 border border-white/10 text-white text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="CASUAL">Casual Leave</option>
                    <option value="SICK">Sick Leave</option>
                    <option value="EARNED">Earned Leave</option>
                    <option value="EMERGENCY">Emergency Leave</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      From Date
                    </label>
                    <input
                      type="date"
                      value={newFromDate}
                      onChange={e => setNewFromDate(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-slate-800 border border-white/10 text-white text-xs focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      To Date
                    </label>
                    <input
                      type="date"
                      value={newToDate}
                      min={newFromDate}
                      onChange={e => setNewToDate(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-slate-800 border border-white/10 text-white text-xs focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Reason (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={newReason}
                    onChange={e => setNewReason(e.target.value)}
                    placeholder="Reason for leave request..."
                    className="w-full p-3 rounded-xl bg-slate-800 border border-white/10 text-white text-xs focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="h-9 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="h-9 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold transition-colors shadow-lg shadow-blue-500/20"
                  >
                    {submitting ? 'Submitting…' : 'Submit Request'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
