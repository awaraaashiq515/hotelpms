'use client';

import React, { useState } from 'react';
import {
  UtensilsCrossed,
  Sparkles,
  Clock,
  User,
  AlertTriangle,
  CheckCircle2,
  Filter,
  ShoppingCart,
  Check,
  RefreshCw
} from 'lucide-react';

export interface KitchenRequisitionItem {
  id: string;
  itemName: string;
  requestedQty: number;
  unit: string;
  urgency: 'NORMAL' | 'URGENT' | 'CRITICAL';
  status: 'PENDING' | 'APPROVED' | 'DISPATCHED' | 'REJECTED';
  requestedBy: string;
  department: string;
  remarks?: string;
  createdAt: string;
  currentStock?: number;
}

interface KitchenRequisitionsListProps {
  requests: KitchenRequisitionItem[];
  loading: boolean;
  onRefresh: () => void;
  onConvertToPO: (selectedItems: KitchenRequisitionItem[]) => void;
}

const URGENCY_STYLES: Record<string, string> = {
  CRITICAL: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  URGENT: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  NORMAL: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
};

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  APPROVED: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
  DISPATCHED: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  REJECTED: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
};

export const KitchenRequisitionsList: React.FC<KitchenRequisitionsListProps> = ({
  requests,
  loading,
  onRefresh,
  onConvertToPO,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED'>('PENDING');

  const filtered = requests.filter((r) => {
    if (statusFilter === 'ALL') return true;
    return r.status === statusFilter;
  });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAllPending = () => {
    const pendingIds = filtered.filter((r) => r.status === 'PENDING').map((r) => r.id);
    if (selectedIds.length === pendingIds.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pendingIds);
    }
  };

  const handleCreatePOFromSelected = () => {
    const selectedItems = requests.filter((r) => selectedIds.includes(r.id));
    if (selectedItems.length > 0) {
      onConvertToPO(selectedItems);
    }
  };

  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;

  return (
    <div className="space-y-4">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
            <UtensilsCrossed size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Kitchen Indents & Raw Material Requisitions</h3>
              {pendingCount > 0 && (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                  {pendingCount} Pending
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Direct requirements logged by Chef & Kitchen Staff. Convert them directly into Vendor POs.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status filter */}
          <div className="flex bg-slate-800 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setStatusFilter('PENDING')}
              className={`px-3 py-1 rounded-lg transition ${statusFilter === 'PENDING'
                  ? 'bg-amber-500 text-black font-bold'
                  : 'text-slate-400 hover:text-white'
                }`}
            >
              Pending ({requests.filter((r) => r.status === 'PENDING').length})
            </button>
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1 rounded-lg transition ${statusFilter === 'ALL'
                  ? 'bg-cyan-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
                }`}
            >
              All History
            </button>
          </div>

          <button
            onClick={onRefresh}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition"
            title="Refresh Requisitions"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>

          {/* Convert Selected Button */}
          {selectedIds.length > 0 && (
            <button
              onClick={handleCreatePOFromSelected}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-black font-black text-xs flex items-center gap-1.5 shadow-lg shadow-orange-500/20 transition"
            >
              <ShoppingCart size={13} />
              <span>Convert {selectedIds.length} to PO</span>
            </button>
          )}
        </div>
      </div>

      {/* Requisitions Table */}
      <div className="rounded-2xl bg-slate-900/50 border border-white/5 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 bg-slate-950/40 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                <th className="px-4 py-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      filtered.filter((r) => r.status === 'PENDING').length > 0 &&
                      selectedIds.length === filtered.filter((r) => r.status === 'PENDING').length
                    }
                    onChange={selectAllPending}
                    className="rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-0 cursor-pointer"
                  />
                </th>
                <th className="px-4 py-3">Requested Item</th>
                <th className="px-4 py-3">Required Quantity</th>
                <th className="px-4 py-3">Urgency</th>
                <th className="px-4 py-3">Chef / Requester</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    Loading kitchen requests...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    No kitchen requisitions found. Everything is currently fulfilled!
                  </td>
                </tr>
              ) : (
                filtered.map((req) => {
                  const isSelected = selectedIds.includes(req.id);
                  const isPending = req.status === 'PENDING';

                  return (
                    <tr
                      key={req.id}
                      className={`hover:bg-white/[0.02] transition-colors ${isSelected ? 'bg-indigo-500/10' : ''
                        }`}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-3 text-center">
                        {isPending && (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(req.id)}
                            className="rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-0 cursor-pointer"
                          />
                        )}
                      </td>

                      {/* Item Name & Remarks */}
                      <td className="px-4 py-3">
                        <span className="font-bold text-white block">{req.itemName}</span>
                        {req.remarks && (
                          <span className="text-[10px] text-slate-400 italic">
                            &quot;{req.remarks}&quot;
                          </span>
                        )}
                      </td>

                      {/* Required Qty */}
                      <td className="px-4 py-3 font-semibold text-slate-200">
                        {req.requestedQty} {req.unit || 'units'}
                      </td>

                      {/* Urgency */}
                      <td className="px-4 py-3">
                        <span
                          className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider ${URGENCY_STYLES[req.urgency] || 'bg-slate-800 text-slate-400'
                            }`}
                        >
                          {req.urgency}
                        </span>
                      </td>

                      {/* Requested By */}
                      <td className="px-4 py-3 text-slate-300">
                        <div className="flex items-center gap-1">
                          <User size={11} className="text-slate-500" />
                          <span>{req.requestedBy}</span>
                        </div>
                        <span className="text-[10px] text-slate-500">
                          {new Date(req.createdAt).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span
                          className={`text-[9px] font-black px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${STATUS_STYLES[req.status] || 'bg-slate-800 text-slate-400'
                            }`}
                        >
                          {req.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        {isPending ? (
                          <button
                            type="button"
                            onClick={() => onConvertToPO([req])}
                            className="px-2.5 py-1 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/30 text-[11px] font-bold inline-flex items-center gap-1 transition"
                          >
                            <ShoppingCart size={11} />
                            <span>Create PO</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-emerald-400 flex items-center justify-end gap-1 font-semibold">
                            <CheckCircle2 size={12} />
                            <span>Processed</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

