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
  AlertCircle
} from 'lucide-react';
import { openWhatsAppPO } from '@/lib/whatsapp-po';
import type { DetailedPO } from './PODetailsModal';

const STATUS_STYLE: Record<string, string> = {
  DRAFT: 'text-slate-400 bg-slate-800 border-slate-700',
  SENT: 'text-sky-300 bg-sky-500/10 border-sky-500/20',
  CONFIRMED: 'text-amber-300 bg-amber-500/10 border-amber-500/20',
  DELIVERED: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20',
  CANCELLED: 'text-rose-300 bg-rose-500/10 border-rose-500/20',
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
  return (
    <div className="rounded-2xl bg-slate-900/50 border border-white/5 overflow-hidden shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/5 bg-slate-950/40">
              {[
                'PO Number',
                'Vendor & Contact',
                'Items Purchased',
                'Total Amount',
                'Expected Date',
                'Status',
                'WhatsApp / Actions',
              ].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-xs">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-slate-500 text-xs">
                  No purchase orders found matching your search.
                </td>
              </tr>
            ) : (
              orders.map((po) => {
                const isSentOrDraft = po.status === 'DRAFT' || po.status === 'SENT';
                const isPendingDelivery = po.status === 'SENT' || po.status === 'CONFIRMED';

                return (
                  <tr
                    key={po.id}
                    className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                    onClick={() => onSelectOrder(po)}
                  >
                    {/* PO Number */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-cyan-400 shrink-0" />
                        <div>
                          <span className="font-black text-white font-mono block">
                            {po.poNumber}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {po.createdAt}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Vendor & Contact */}
                    <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <div>
                        <div className="flex items-center gap-1.5 font-bold text-slate-200">
                          <Building2 size={12} className="text-indigo-400" />
                          <span>{po.vendor}</span>
                        </div>
                        {po.vendorPhone ? (
                          <a
                            href={`tel:${po.vendorPhone}`}
                            className="text-[11px] text-slate-400 hover:text-cyan-300 font-mono flex items-center gap-1 mt-0.5"
                          >
                            <Phone size={10} />
                            <span>{po.vendorPhone}</span>
                          </a>
                        ) : (
                          <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <AlertCircle size={9} /> No phone
                          </span>
                        )}
                        {po.assignedStaffName && (
                          <div className="text-[10px] text-amber-300/90 font-medium flex items-center gap-1 mt-1">
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">
                              Runner: {po.assignedStaffName}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Items */}
                    <td className="px-4 py-3.5">
                      <div className="text-slate-300">
                        <span className="font-bold text-white">
                          {po.items.length} items
                        </span>
                        <div className="text-[10px] text-slate-400 truncate max-w-[180px]">
                          {po.items.map((i) => i.name).slice(0, 2).join(', ')}
                          {po.items.length > 2 && '...'}
                        </div>
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="px-4 py-3.5 font-black text-white font-mono text-sm">
                      ₹{po.totalAmount.toLocaleString('en-IN')}
                    </td>

                    {/* Expected Date */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1 text-slate-300">
                        <Calendar size={11} className="text-slate-500" />
                        <span className="text-[11px]">{po.expectedDate || 'ASAP'}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <span
                        className={`text-[10px] font-black px-2.5 py-1 rounded-full border uppercase tracking-wider ${
                          STATUS_STYLE[po.status] || 'text-slate-400 bg-slate-800'
                        }`}
                      >
                        {po.status}
                      </span>
                    </td>

                    {/* Actions & WhatsApp */}
                    <td
                      className="px-4 py-3.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-1.5 flex-wrap">
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
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 font-bold text-[11px] flex items-center gap-1 transition"
                          title="Send PO details via WhatsApp"
                        >
                          <MessageCircle size={12} className="text-emerald-400 hover:text-white" />
                          <span>WhatsApp</span>
                        </button>

                        {/* View Slip */}
                        <button
                          type="button"
                          onClick={() => onSelectOrder(po)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                          title="View PO Slip"
                        >
                          <Eye size={13} />
                        </button>

                        {/* Status Quick Actions */}
                        {po.status === 'DRAFT' && onApprove && (
                          <button
                            type="button"
                            onClick={() => onApprove(po.id)}
                            className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 transition"
                            title="Confirm Order"
                          >
                            <CheckCircle2 size={13} />
                          </button>
                        )}

                        {isPendingDelivery && onDeliver && (
                          <button
                            type="button"
                            onClick={() => onDeliver(po.id)}
                            className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition"
                            title="Mark Delivered & Add Stock"
                          >
                            <Truck size={13} />
                          </button>
                        )}

                        {isSentOrDraft && onCancel && (
                          <button
                            type="button"
                            onClick={() => onCancel(po.id)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                            title="Cancel Order"
                          >
                            <X size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
