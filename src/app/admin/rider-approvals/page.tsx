'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle2,
  XCircle,
  Search,
  AlertCircle,
  Trash2,
  UserCheck,
  SearchCheck,
  Bike,
  Sparkles,
  Ban,
  Clock,
  MapPin,
  FileText,
} from 'lucide-react';

type Rider = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  vehicleNumber: string | null;
  vehicleType: string;
  isActive: boolean;
  propertyId: string | null;
  propertyName: string;
  createdAt: string;
};

export default function RiderApprovalsPage() {
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'ACTIVE'>('PENDING');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchRiders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/rider-approvals').then((r) => r.json());
      if (res.success) {
        setRiders(res.data);
      } else {
        showToast(res.error || 'Failed to fetch riders list', 'error');
      }
    } catch (err) {
      showToast('An unexpected error occurred while loading riders.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRiders();
  }, [fetchRiders]);

  const handleRiderAction = async (riderId: string, action: 'approve' | 'deactivate' | 'delete') => {
    if (action === 'delete' && !confirm('Are you sure you want to delete this rider account? This action cannot be undone.')) {
      return;
    }

    try {
      setProcessingId(riderId);
      const res = await fetch('/api/admin/rider-approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ riderId, action }),
      }).then((r) => r.json());

      if (res.success) {
        showToast(
          action === 'approve'
            ? 'Rider account approved and activated successfully!'
            : action === 'deactivate'
            ? 'Rider account deactivated successfully.'
            : 'Rider account deleted successfully.'
        );
        fetchRiders();
      } else {
        showToast(res.error || `Failed to ${action} rider`, 'error');
      }
    } catch (err) {
      showToast(`An error occurred while attempting to ${action} rider.`, 'error');
    } finally {
      setProcessingId(null);
    }
  };

  // Filter riders based on search and status tabs
  const filteredRiders = riders.filter((rider) => {
    const searchLower = search.toLowerCase();
    const matchesSearch =
      (rider.name && rider.name.toLowerCase().includes(searchLower)) ||
      (rider.email && rider.email.toLowerCase().includes(searchLower)) ||
      (rider.phone && rider.phone.toLowerCase().includes(searchLower)) ||
      (rider.vehicleNumber && rider.vehicleNumber.toLowerCase().includes(searchLower)) ||
      (rider.propertyName && rider.propertyName.toLowerCase().includes(searchLower));

    if (statusFilter === 'PENDING') {
      return matchesSearch && !rider.isActive;
    }
    if (statusFilter === 'ACTIVE') {
      return matchesSearch && rider.isActive;
    }
    return matchesSearch;
  });

  const pendingCount = riders.filter((r) => !r.isActive).length;
  const activeCount = riders.filter((r) => r.isActive).length;

  return (
    <div className="relative min-h-screen space-y-8" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Background glow effects */}
      <div className="absolute top-[-5%] left-[-5%] w-[35%] h-[35%] bg-indigo-500/10 rounded-full blur-[90px] -z-10 pointer-events-none" />
      <div className="absolute bottom-[-5%] right-[-5%] w-[35%] h-[35%] bg-rose-500/5 rounded-full blur-[90px] -z-10 pointer-events-none" />

      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-sm font-bold animate-slide-in-right ${
            toast.type === 'success'
              ? 'bg-emerald-600 text-white shadow-emerald-600/20'
              : 'bg-rose-600 text-white shadow-rose-600/20'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
          {toast.msg}
        </div>
      )}

      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-1.5 w-6 bg-indigo-600 rounded-full" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
              Rider Management
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Rider Approvals
            {pendingCount > 0 && (
              <span className="ml-3 text-xs font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 px-3 py-1.5 rounded-full tracking-widest border border-amber-500/25 animate-pulse">
                {pendingCount} Pending Approval
              </span>
            )}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-2 max-w-xl">
            Review delivery rider registrations, check vehicle details, assign or update restaurant outlet mapping, and toggle active status.
          </p>
        </div>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          {
            label: 'Awaiting Approval',
            count: pendingCount,
            icon: Clock,
            color: 'from-amber-500 to-orange-600',
            shadow: 'shadow-amber-500/10',
          },
          {
            label: 'Active Approved Riders',
            count: activeCount,
            icon: Sparkles,
            color: 'from-emerald-500 to-teal-600',
            shadow: 'shadow-emerald-500/10',
          },
          {
            label: 'Total Registered Riders',
            count: riders.length,
            icon: Bike,
            color: 'from-indigo-500 to-blue-600',
            shadow: 'shadow-indigo-500/10',
          },
        ].map((stat, i) => (
          <div
            key={i}
            className={`p-6 rounded-[28px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-5 ${stat.shadow}`}
          >
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center shrink-0 shadow-md`}>
              <stat.icon size={20} className="text-white" />
            </div>
            <div>
              <p className="text-3xl font-black text-slate-900 dark:text-white tabular-nums">{stat.count}</p>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
                {stat.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[36px] shadow-sm overflow-hidden">
        {/* Controls Bar */}
        <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          {/* Tab Selector */}
          <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-full md:w-auto">
            {[
              { id: 'PENDING', label: 'Pending Approvals', count: pendingCount },
              { id: 'ACTIVE', label: 'Active / Approved', count: activeCount },
              { id: 'ALL', label: 'All Riders', count: riders.length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id as any)}
                className={`flex-1 md:flex-initial py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  statusFilter === tab.id
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                {tab.label}
                <span
                  className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                    statusFilter === tab.id
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Search rider name, phone, outlet..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-indigo-600 rounded-2xl text-sm font-semibold text-slate-800 dark:text-white outline-none transition-all"
            />
          </div>
        </div>

        {/* Data Grid / Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-20 text-center flex flex-col justify-center items-center gap-4">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-slate-500 dark:text-slate-400 text-sm font-semibold">Loading riders data...</span>
            </div>
          ) : filteredRiders.length === 0 ? (
            <div className="py-20 text-center space-y-4">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800/40 rounded-full flex items-center justify-center mx-auto text-slate-400">
                <SearchCheck size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Riders Found</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto font-medium">
                We couldn't find any rider accounts matching the filter "{statusFilter}" and search query "{search}".
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-50/50 dark:bg-slate-900/30">
                  <th className="px-8 py-5">Rider details</th>
                  <th className="px-8 py-5">Vehicle details</th>
                  <th className="px-8 py-5">Assigned Outlet</th>
                  <th className="px-8 py-5">Date Registered</th>
                  <th className="px-8 py-5">Status</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
                {filteredRiders.map((rider) => {
                  const dateStr = rider.createdAt
                    ? new Date(rider.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '---';

                  return (
                    <tr key={rider.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors">
                      <td className="px-8 py-5">
                        <div className="space-y-1">
                          <span className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-tight block">
                            {rider.name || 'Unnamed Rider'}
                          </span>
                          <div className="flex flex-col gap-0.5 text-[10px] text-slate-400 dark:text-slate-500">
                            {rider.email && <span>Email: {rider.email}</span>}
                            {rider.phone && <span>Phone: {rider.phone}</span>}
                            <span className="font-mono text-[9px] opacity-70">ID: {rider.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="space-y-1">
                          <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {rider.vehicleType}
                          </span>
                          {rider.vehicleNumber ? (
                            <span className="block font-mono text-[10px] text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-100/50 dark:border-indigo-900/50 w-max">
                              {rider.vehicleNumber}
                            </span>
                          ) : (
                            <span className="block text-slate-400 font-normal italic">No vehicle plate</span>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-1.5 text-slate-900 dark:text-white">
                          <MapPin size={14} className="text-slate-400" />
                          <span className="font-bold">{rider.propertyName}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-slate-450 dark:text-slate-500 text-[11px]">
                        {dateStr}
                      </td>
                      <td className="px-8 py-5">
                        {rider.isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 border border-emerald-100 dark:border-emerald-900/50">
                            Approved / Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50 animate-pulse">
                            Pending Approval
                          </span>
                        )}
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-2.5">
                          {/* Approve/Deactivate actions */}
                          {!rider.isActive ? (
                            <button
                              type="button"
                              disabled={processingId === rider.id}
                              onClick={() => handleRiderAction(rider.id, 'approve')}
                              className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/10 hover:shadow-emerald-600/25 transition-all flex items-center gap-1.5 disabled:opacity-50"
                            >
                              {processingId === rider.id ? (
                                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              ) : (
                                <UserCheck size={12} />
                              )}
                              Approve
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={processingId === rider.id}
                              onClick={() => handleRiderAction(rider.id, 'deactivate')}
                              className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-600/10 hover:shadow-amber-600/25 transition-all flex items-center gap-1.5 disabled:opacity-50"
                            >
                              {processingId === rider.id ? (
                                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              ) : (
                                <Ban size={12} />
                              )}
                              Deactivate
                            </button>
                          )}

                          {/* Delete Action */}
                          <button
                            type="button"
                            disabled={processingId === rider.id}
                            onClick={() => handleRiderAction(rider.id, 'delete')}
                            className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-450 hover:bg-rose-600 hover:text-white transition-all disabled:opacity-50"
                            title="Delete Rider Account"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
