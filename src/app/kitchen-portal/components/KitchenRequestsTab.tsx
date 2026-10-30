'use client';

import React from 'react';
import { Plus, RefreshCw, CheckCircle2 } from 'lucide-react';
import { StockRequest } from './types';

interface KitchenRequestsTabProps {
  requests: StockRequest[];
  requestsLoading: boolean;
  onOpenRequestModal: () => void;
}

export const KitchenRequestsTab: React.FC<KitchenRequestsTabProps> = ({
  requests,
  requestsLoading,
  onOpenRequestModal,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white">Kitchen Stock Requisitions</h3>
          <p className="text-xs text-slate-400">
            Track requests submitted to the Hotel Main Store and Admin
          </p>
        </div>

        <button
          onClick={onOpenRequestModal}
          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition"
        >
          <Plus size={14} />
          <span>New Request</span>
        </button>
      </div>

      {requestsLoading ? (
        <div className="py-16 text-center text-slate-400 text-xs">
          <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-indigo-400" />
          <span>Loading requests...</span>
        </div>
      ) : requests.length === 0 ? (
        <div className="py-16 text-center bg-[#0d1322] rounded-3xl border border-slate-800">
          <CheckCircle2 size={28} className="text-emerald-500 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-300">No pending stock requests</p>
          <p className="text-xs text-slate-500 mt-1">
            Everything requested by the kitchen is either fulfilled or no new request is pending.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {requests.map((req) => {
            const isPending = req.status === 'PENDING';
            const isApproved = req.status === 'APPROVED';
            const isDispatched = req.status === 'DISPATCHED';
            const isRejected = req.status === 'REJECTED';

            return (
              <div
                key={req.id}
                className="p-4 rounded-2xl bg-[#0e1629] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white">{req.itemName}</h4>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${req.urgency === 'CRITICAL'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : req.urgency === 'URGENT'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                        }`}
                    >
                      {req.urgency}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 mt-1">
                    Requested: <span className="font-bold text-white">{req.requestedQty} {req.unit}</span> by{' '}
                    <span className="text-slate-300 font-semibold">{req.requestedBy}</span> •{' '}
                    {new Date(req.createdAt).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>

                  {req.remarks && (
                    <p className="text-[11px] text-slate-400 italic mt-1">
                      Note: &quot;{req.remarks}&quot;
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span
                    className={`text-xs font-black px-3 py-1 rounded-xl uppercase tracking-wider ${isPending
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : isApproved
                          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                          : isDispatched
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      }`}
                  >
                    {req.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

