'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Bell,
  ChefHat,
  Sparkles,
  CheckCircle2,
  Clock,
  RefreshCw,
  Search,
  Filter,
  Check,
  X,
  Truck,
  AlertTriangle,
  ArrowRight,
  User,
  Package,
} from 'lucide-react';

interface StockRequest {
  id: string;
  propertyId: string;
  stockItemId?: string | null;
  itemName: string;
  department: string;
  requestedBy: string;
  requestedQty: number;
  unit: string;
  currentStock: number;
  urgency: 'NORMAL' | 'URGENT' | 'CRITICAL';
  status: 'PENDING' | 'APPROVED' | 'DISPATCHED' | 'REJECTED';
  remarks?: string | null;
  createdAt: string;
  resolvedAt?: string | null;
  resolvedBy?: string | null;
  stockItem?: {
    id: string;
    name: string;
    unit?: string | null;
    itemType: string;
  } | null;
}

interface StaffRequestsPanelProps {
  propertyId?: string;
  onRefreshStock?: () => void;
}

export function StaffRequestsPanel({ propertyId, onRefreshStock }: StaffRequestsPanelProps) {
  const [requests, setRequests] = useState<StockRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [deptFilter, setDeptFilter] = useState<'ALL' | 'KITCHEN' | 'HOUSEKEEPING'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'DISPATCHED' | 'REJECTED'>('ALL');
  const [search, setSearch] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const url = propertyId
        ? `/api/inventory/requests?propertyId=${propertyId}`
        : '/api/inventory/requests';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setRequests(data.data);
      }
    } catch (err) {
      console.error('Failed to load staff stock requests:', err);
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleUpdateStatus = async (
    id: string,
    newStatus: 'APPROVED' | 'DISPATCHED' | 'REJECTED',
    remarks?: string
  ) => {
    setActionLoadingId(id);
    try {
      const res = await fetch('/api/inventory/requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status: newStatus,
          remarks,
          resolvedBy: 'Admin Store Manager',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setRequests((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: newStatus, resolvedBy: 'Admin' } : r))
        );
        if (onRefreshStock) onRefreshStock();
      }
    } catch (err) {
      console.error('Failed to update request status:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const filtered = useMemo(() => {
    if (!Array.isArray(requests)) return [];
    const q = (search || '').trim().toLowerCase();
    return requests.filter((r) => {
      if (!r) return false;
      const matchesDept = deptFilter === 'ALL' ? true : r.department === deptFilter;
      const matchesStatus = statusFilter === 'ALL' ? true : r.status === statusFilter;
      const name = String(r.itemName || '').toLowerCase();
      const by = String(r.requestedBy || '').toLowerCase();
      const rem = String(r.remarks || '').toLowerCase();
      const matchesSearch = !q || name.includes(q) || by.includes(q) || rem.includes(q);
      return matchesDept && matchesStatus && matchesSearch;
    });
  }, [requests, deptFilter, statusFilter, search]);

  const counts = useMemo(() => {
    if (!Array.isArray(requests)) {
      return { total: 0, pending: 0, kitchen: 0, housekeeping: 0, critical: 0 };
    }
    return {
      total: requests.length,
      pending: requests.filter((r) => r?.status === 'PENDING').length,
      kitchen: requests.filter((r) => r?.department === 'KITCHEN').length,
      housekeeping: requests.filter((r) => r?.department === 'HOUSEKEEPING').length,
      critical: requests.filter((r) => r?.urgency === 'CRITICAL' && r?.status === 'PENDING').length,
    };
  }, [requests]);

  return (
    <div className="space-y-4">
      {/* ── Metric Summary Tiles ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Total Requests
          </span>
          <p className="text-xl font-black text-white mt-1">{counts.total}</p>
          <span className="text-[11px] text-slate-500">From all hotel departments</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-amber-500/30">
          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
            Pending Approval
          </span>
          <p className="text-xl font-black text-amber-400 mt-1">{counts.pending}</p>
          <span className="text-[11px] text-slate-500">Awaiting store dispatch</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-orange-500/30">
          <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">
            Kitchen Requests
          </span>
          <p className="text-xl font-black text-orange-400 mt-1">{counts.kitchen}</p>
          <span className="text-[11px] text-slate-500">Groceries & kitchen supplies</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-purple-500/30">
          <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">
            Housekeeping Requests
          </span>
          <p className="text-xl font-black text-purple-400 mt-1">{counts.housekeeping}</p>
          <span className="text-[11px] text-slate-500">Linen, toiletries & cleaning</span>
        </div>
      </div>

      {/* ── Filters & Search Bar ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Department Filter */}
          {(['ALL', 'KITCHEN', 'HOUSEKEEPING'] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDeptFilter(d)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${deptFilter === d
                  ? 'bg-orange-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
            >
              {d === 'KITCHEN' ? <ChefHat size={12} /> : d === 'HOUSEKEEPING' ? <Sparkles size={12} /> : null}
              <span>{d === 'ALL' ? 'All Departments' : d}</span>
            </button>
          ))}

          <div className="h-4 w-px bg-slate-700 mx-1 hidden sm:block" />

          {/* Status Filter */}
          {(['ALL', 'PENDING', 'APPROVED', 'DISPATCHED', 'REJECTED'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition ${statusFilter === s
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-48">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search items or staff…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-8 pl-8 pr-3 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
            />
          </div>
          <button
            onClick={fetchRequests}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700"
            title="Refresh Requests"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ── Requests Table / Cards ── */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-xs">
          <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-orange-400" />
          <span>Loading staff requisitions…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center bg-slate-900/40 rounded-3xl border border-slate-800">
          <CheckCircle2 size={32} className="text-emerald-500 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-200">No matching stock requests</p>
          <p className="text-xs text-slate-500 mt-1">
            Requests submitted by Kitchen or Housekeeping staff will be displayed here.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-900/80">
                  <th className="px-4 py-3">Item Requested</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Requested By</th>
                  <th className="px-4 py-3">Quantity</th>
                  <th className="px-4 py-3">Urgency</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filtered.map((req) => {
                  const isPending = req.status === 'PENDING';
                  const isApproved = req.status === 'APPROVED';
                  const isDispatched = req.status === 'DISPATCHED';
                  const isRejected = req.status === 'REJECTED';

                  return (
                    <tr
                      key={req.id}
                      className={`hover:bg-slate-850/40 transition ${req.urgency === 'CRITICAL' && isPending ? 'bg-red-950/15' : ''
                        }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center ${req.department === 'KITCHEN'
                                ? 'bg-orange-500/15 text-orange-400'
                                : 'bg-purple-500/15 text-purple-400'
                              }`}
                          >
                            {req.department === 'KITCHEN' ? <ChefHat size={14} /> : <Sparkles size={14} />}
                          </div>
                          <div>
                            <span className="font-bold text-white block">{req.itemName}</span>
                            {req.remarks && (
                              <span className="text-[10px] text-slate-400 italic block">
                                Note: {req.remarks}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase ${req.department === 'KITCHEN'
                              ? 'bg-orange-500/20 text-orange-300'
                              : 'bg-purple-500/20 text-purple-300'
                            }`}
                        >
                          {req.department}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-slate-300 font-medium">
                        {req.requestedBy}
                      </td>

                      <td className="px-4 py-3">
                        <span className="font-black text-white">
                          {req.requestedQty} {req.unit}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${req.urgency === 'CRITICAL'
                              ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse'
                              : req.urgency === 'URGENT'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                        >
                          {req.urgency}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`text-[10px] font-black px-2.5 py-0.5 rounded-md uppercase ${isPending
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                              : isApproved
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                                : isDispatched
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-red-500/10 text-red-400 border border-red-500/30'
                            }`}
                        >
                          {req.status}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-[11px] text-slate-400 whitespace-nowrap">
                        {req.createdAt ? (() => {
                          try {
                            return new Date(req.createdAt).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            });
                          } catch {
                            return '—';
                          }
                        })() : '—'}
                      </td>

                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPending && (
                            <>
                              <button
                                disabled={actionLoadingId === req.id}
                                onClick={() => handleUpdateStatus(req.id, 'APPROVED')}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 font-bold text-[11px] border border-emerald-500/30 transition flex items-center gap-1"
                                title="Approve Request"
                              >
                                <Check size={11} /> Approve
                              </button>
                              <button
                                disabled={actionLoadingId === req.id}
                                onClick={() => handleUpdateStatus(req.id, 'REJECTED')}
                                className="px-2 py-1 rounded-lg bg-red-600/15 hover:bg-red-600/25 text-red-400 font-bold text-[11px] border border-red-500/30 transition flex items-center gap-1"
                                title="Reject"
                              >
                                <X size={11} />
                              </button>
                            </>
                          )}

                          {isApproved && (
                            <button
                              disabled={actionLoadingId === req.id}
                              onClick={() => handleUpdateStatus(req.id, 'DISPATCHED')}
                              className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 font-bold text-[11px] border border-blue-500/30 transition flex items-center gap-1"
                              title="Mark Dispatched from Store"
                            >
                              <Truck size={11} /> Mark Dispatched
                            </button>
                          )}

                          {isDispatched && (
                            <span className="text-[10px] text-slate-500 italic">
                              Dispatched by {req.resolvedBy || 'Store'}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

