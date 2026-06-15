'use client';

import React from 'react';
import { CheckCircle2, MapPin, Package, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { HistoryOrder } from '../types';

interface OrderHistoryTabProps {
  orderHistory: HistoryOrder[];
  loadingHistory: boolean;
}

export function OrderHistoryTab({ orderHistory, loadingHistory }: OrderHistoryTabProps) {
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  if (loadingHistory) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-3">
        <div className="w-6 h-6 border-2 border-emerald-500/20 rounded-full animate-spin border-t-emerald-500" />
        <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Loading delivery history...</p>
      </div>
    );
  }

  if (orderHistory.length === 0) {
    return (
      <div className="text-center py-14 bg-[#0f172a] rounded-2xl border border-[#1e293b] p-6 space-y-3">
        <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 mx-auto border border-emerald-500/20">
          <Clock size={22} />
        </div>
        <div>
          <h4 className="font-black text-white text-xs uppercase tracking-tight">No Completed Deliveries Yet</h4>
          <p className="text-[9.5px] text-slate-500 max-w-[220px] mx-auto leading-relaxed font-bold uppercase mt-1">
            Your completed delivery history will appear here once you finish your first trip.
          </p>
        </div>
      </div>
    );
  }

  const totalEarned = orderHistory.reduce((sum, o) => sum + o.grandTotal, 0);

  return (
    <div className="space-y-3">
      {/* Summary Banner */}
      <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 rounded-2xl p-4 flex items-center justify-between">
        <div>
          <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">All Time</p>
          <p className="text-base font-black text-white mt-0.5">{orderHistory.length} Deliveries</p>
        </div>
        <div className="text-right">
          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Total Value</p>
          <p className="text-base font-black text-emerald-400 mt-0.5">₹{Math.round(totalEarned).toLocaleString()}</p>
        </div>
      </div>

      {/* History List */}
      <div className="space-y-2">
        {orderHistory.map((order, index) => {
          const isExpanded = expandedId === order.id;
          const deliveredDate = new Date(order.updatedAt).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric'
          });
          const deliveredTime = new Date(order.updatedAt).toLocaleTimeString('en-IN', {
            hour: '2-digit', minute: '2-digit'
          });

          return (
            <div
              key={order.id}
              className="bg-[#0f172a] border border-[#1e293b] rounded-2xl overflow-hidden transition-all duration-200"
            >
              {/* Main Row */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : order.id)}
                className="w-full p-3.5 flex items-center justify-between gap-3 text-left"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* Index Badge */}
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                    <span className="text-[9px] font-black text-emerald-400">#{orderHistory.length - index}</span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-white font-mono">{order.orderNo}</span>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[7.5px] font-black text-emerald-400 uppercase">
                        <CheckCircle2 size={8} /> Done
                      </span>
                    </div>
                    <p className="text-[9px] text-slate-400 font-bold truncate mt-0.5">
                      {order.deliveryCustomerName || 'Guest Customer'}
                    </p>
                    <p className="text-[8px] text-slate-600 font-bold">
                      {deliveredDate} • {deliveredTime}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-black text-emerald-400">₹{Math.round(order.grandTotal)}</span>
                  {isExpanded ? (
                    <ChevronUp size={14} className="text-slate-500" />
                  ) : (
                    <ChevronDown size={14} className="text-slate-500" />
                  )}
                </div>
              </button>

              {/* Expanded Detail */}
              {isExpanded && (
                <div className="border-t border-[#1e293b]/70 p-3.5 space-y-3">
                  {/* Address */}
                  {order.deliveryAddress && (
                    <div className="flex items-start gap-2 bg-[#070b12] rounded-xl p-2.5 border border-[#1e293b]/60">
                      <MapPin size={12} className="text-rose-400 shrink-0 mt-0.5" />
                      <p className="text-[9px] text-slate-300 font-bold leading-relaxed">{order.deliveryAddress}</p>
                    </div>
                  )}

                  {/* Items Breakdown */}
                  {order.items && order.items.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[7.5px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                        <Package size={10} /> Items Delivered ({order.items.length})
                      </p>
                      <div className="space-y-1">
                        {order.items.map(item => (
                          <div key={item.id} className="flex items-center justify-between bg-[#070b12] rounded-lg px-2.5 py-1.5 border border-[#1e293b]/50">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[8px] font-black flex items-center justify-center">
                                {item.quantity}×
                              </span>
                              <span className="text-[9.5px] font-bold text-slate-300 truncate max-w-[160px]">
                                {item.product.name}
                              </span>
                            </div>
                            <span className="text-[9px] font-black text-slate-400">₹{Math.round(item.totalAmount)}</span>
                          </div>
                        ))}
                      </div>

                      {/* Total line */}
                      <div className="flex items-center justify-between px-2.5 pt-1.5 border-t border-[#1e293b]/60">
                        <span className="text-[8px] font-black text-slate-500 uppercase">Order Total</span>
                        <span className="text-[11px] font-black text-white">₹{Math.round(order.grandTotal)}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
