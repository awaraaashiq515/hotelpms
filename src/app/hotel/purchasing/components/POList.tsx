'use client';

import React from 'react';
import {
  FileText,
  Calendar,
  CheckCircle2,
  X,
  MessageCircle,
  Eye,
  Truck,
  Phone,
  Building2,
  AlertCircle,
  Package,
  Layers,
  ArrowRight
} from 'lucide-react';
import { openWhatsAppPO } from '@/lib/whatsapp-po';
import type { DetailedPO } from './PODetailsModal';

const STATUS_STYLE: Record<string, string> = {
  DRAFT: 'text-slate-300 bg-slate-800/80 border-slate-700',
  SENT: 'text-sky-300 bg-sky-500/10 border-sky-500/30',
  CONFIRMED: 'text-amber-300 bg-amber-500/10 border-amber-500/30',
  DELIVERED: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/40 font-bold',
  CANCELLED: 'text-rose-300 bg-rose-500/10 border-rose-500/30',
};

interface POListProps {
  orders: DetailedPO[];
  onSelectOrder: (order: DetailedPO) => void;
  onApprove?: (id: string) => void;
  onDeliver?: (id: string) => void;
  onCancel?: (id: string) => void;
}

export function POList({
  orders,
  onSelectOrder,
  onApprove,
  onDeliver,
  onCancel,
}: POListProps) {
  if (orders.length === 0) {
    return (
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-12 text-center shadow-xl space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-slate-400 mx-auto">
          <Package size={26} className="text-cyan-400 opacity-80" />
        </div>
        <h3 className="text-base font-bold text-white">No Purchase Orders Found</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          There are no purchase orders matching your search or filter. You can create a new purchase order or record an instant direct stock inward above.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-slate-900/70 border border-slate-800/80 overflow-hidden shadow-2xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/70 text-[10px] font-black text-slate-400 uppercase tracking-wider">
              <th className="px-4 py-3.5">PO Number & Date</th>
              <th className="px-4 py-3.5">Vendor & Contact</th>
              <th className="px-4 py-3.5">Purchased Items & Qty</th>
              <th className="px-4 py-3.5">Total Amount</th>
              <th className="px-4 py-3.5">Expected Delivery</th>
              <th className="px-4 py-3.5">Status & Stock</th>
              <th className="px-4 py-3.5 text-right">Quick Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs">
            {orders.map((po) => {
              const isSentOrDraft = po.status === 'DRAFT' || po.status === 'SENT';
              const isPendingDelivery = po.status === 'SENT' || po.status === 'CONFIRMED';
              const isDelivered = po.status === 'DELIVERED';

              const isKitchenRunner =
                Boolean(po.notes && po.notes.includes('[ASSIGNED_TO_KITCHEN_RUNNER]')) ||
                Boolean(po.assignedStaffName && po.assignedStaffName.toLowerCase().includes('kitchen'));

              let purchasedIds: string[] = [];
              if (po.notes && po.notes.includes('__PURCHASED_IDS:')) {
                try {
                  const match = po.notes.match(/__PURCHASED_IDS:(\[[^\]]*\])/);
                  if (match && match[1]) {
                    purchasedIds = JSON.parse(match[1]);
                  }
                } catch {}
              }

              const totalItems = po.items.length;
              const boughtCount = isDelivered
                ? totalItems
                : po.items.filter((it) => it.id && purchasedIds.includes(it.id)).length;
              const percent = totalItems > 0 ? Math.round((boughtCount / totalItems) * 100) : 0;

              return (
                <tr
                  key={po.id}
                  className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                  onClick={() => onSelectOrder(po)}
                >
                  {/* 1. PO Number & Date */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-cyan-400 shrink-0 group-hover:border-cyan-500/50 transition">
                        <FileText size={15} />
                      </div>
                      <div>
                        <span className="font-black text-white font-mono block tracking-tight text-xs">
                          {po.poNumber}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {po.createdAt}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* 2. Vendor & Contact */}
                  <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 font-bold text-slate-200">
                        <Building2 size={13} className="text-cyan-400 shrink-0" />
                        <span className="truncate max-w-[180px]">{po.vendor}</span>
                      </div>
                      {po.vendorPhone ? (
                        <a
                          href={`tel:${po.vendorPhone}`}
                          className="text-[11px] text-slate-400 hover:text-cyan-300 font-mono flex items-center gap-1 transition"
                        >
                          <Phone size={10} />
                          <span>{po.vendorPhone}</span>
                        </a>
                      ) : (
                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                          <AlertCircle size={9} /> No phone
                        </span>
                      )}
                      {po.assignedStaffName && (
                        <div className="text-[10px] text-amber-300/90 font-medium flex items-center gap-1 pt-0.5">
                          <span className="px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30">
                            Receiver: {po.assignedStaffName}
                          </span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* 3. Items with Quantity & Unit */}
                  <td className="px-4 py-4">
                    <div className="text-slate-300 max-w-[260px]">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white text-xs">
                          {po.items.length} item{po.items.length > 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">
                        {po.items
                          .map((i) => `${i.name} (${i.quantity} ${i.unit || 'units'})`)
                          .slice(0, 2)
                          .join(', ')}
                        {po.items.length > 2 && '...'}
                      </div>
                    </div>
                  </td>

                  {/* 4. Total Amount */}
                  <td className="px-4 py-4">
                    <span className="font-black text-white font-mono text-sm">
                      ₹{po.totalAmount.toLocaleString('en-IN')}
                    </span>
                  </td>

                  {/* 5. Expected Delivery */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1 text-slate-300">
                      <Calendar size={12} className="text-slate-500 shrink-0" />
                      <span className="text-xs font-medium">{po.expectedDate || 'Immediate / ASAP'}</span>
                    </div>
                  </td>

                  {/* 6. Status & Procurement Mode */}
                  <td className="px-4 py-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`inline-block text-[10px] font-black px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                            STATUS_STYLE[po.status] || 'text-slate-400 bg-slate-800'
                          }`}
                        >
                          {po.status}
                        </span>
                        {isDelivered ? (
                          <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                            <CheckCircle2 size={11} /> Inwarded 📦
                          </span>
                        ) : isKitchenRunner ? (
                          <span className="text-[10px] text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                            🏃‍♂️ Kitchen Runner
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                            <Truck size={10} className="text-slate-400" /> Vendor Delivery
                          </span>
                        )}
                      </div>

                      {/* Live Runner Checklist Progress */}
                      {isKitchenRunner && !isDelivered && (
                        <div className="max-w-[170px] space-y-1">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-slate-400 font-medium">Bought:</span>
                            <span
                              className={`font-mono font-bold ${
                                boughtCount === totalItems && totalItems > 0
                                  ? 'text-emerald-400'
                                  : 'text-amber-300'
                              }`}
                            >
                              {boughtCount}/{totalItems} ({percent}%)
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${
                                boughtCount === totalItems && totalItems > 0
                                  ? 'bg-emerald-500'
                                  : 'bg-gradient-to-r from-amber-500 to-emerald-500'
                              }`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* 7. Quick Actions */}
                  <td
                    className="px-4 py-4 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-2 justify-end flex-wrap">
                      {/* WhatsApp Button */}
                      <button
                        type="button"
                        onClick={() => {
                          openWhatsAppPO({
                            hotelName: po.hotelName || 'Hotel Grand',
                            poNumber: po.poNumber,
                            orderDate: po.createdAt,
                            expectedDate: po.expectedDate,
                            vendorName: po.vendor,
                            vendorPhone: po.vendorPhone,
                            items: po.items,
                            totalAmount: po.totalAmount,
                            notes: po.notes,
                            assignedStaffName: po.assignedStaffName,
                            assignedStaffPhone: po.assignedStaffPhone,
                          });
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 font-bold text-[11px] flex items-center gap-1 transition shadow-sm"
                        title="Send PO details via WhatsApp"
                      >
                        <MessageCircle size={12} className="text-emerald-400 hover:text-white" />
                        <span>WhatsApp</span>
                      </button>

                      {/* View Slip */}
                      <button
                        type="button"
                        onClick={() => onSelectOrder(po)}
                        className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
                        title="View PO Slip & Details"
                      >
                        <Eye size={14} />
                      </button>

                      {/* Status Quick Actions */}
                      {po.status === 'DRAFT' && onApprove && (
                        <button
                          type="button"
                          onClick={() => onApprove(po.id)}
                          className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500 text-amber-300 hover:text-black border border-amber-500/30 font-bold text-[11px] flex items-center gap-1 transition"
                          title="Confirm Order"
                        >
                          <CheckCircle2 size={12} />
                          <span>Confirm</span>
                        </button>
                      )}

                      {/* Prominent Receive Goods Action */}
                      {isPendingDelivery && onDeliver && (
                        <button
                          type="button"
                          onClick={() => onDeliver(po.id)}
                          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-[11px] flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition transform active:scale-95"
                          title="Receive Goods & Automatically Add Stock to Inventory"
                        >
                          <Truck size={13} />
                          <span>Receive Stock 📦</span>
                        </button>
                      )}

                      {isSentOrDraft && onCancel && (
                        <button
                          type="button"
                          onClick={() => onCancel(po.id)}
                          className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition"
                          title="Cancel Order"
                        >
                          <X size={13} />
                        </button>
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
  );
}
