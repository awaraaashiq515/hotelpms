import React, { useState } from 'react';
import { FileText, Plus, Calendar, CheckCircle2, Clock, X } from 'lucide-react';

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendor: string;
  items: number;
  totalAmount: number;
  status: 'DRAFT' | 'SENT' | 'CONFIRMED' | 'DELIVERED' | 'CANCELLED';
  createdAt: string;
  expectedDate: string;
  approvedBy?: string;
}

const STATUS_STYLE: Record<string, string> = {
  DRAFT:     'text-slate-400 bg-slate-800 border-slate-700',
  SENT:      'text-blue-300 bg-blue-500/10 border-blue-500/20',
  CONFIRMED: 'text-amber-300 bg-amber-500/10 border-amber-500/20',
  DELIVERED: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20',
  CANCELLED: 'text-rose-300 bg-rose-500/10 border-rose-500/20',
};

interface POListProps {
  orders: PurchaseOrder[];
  onApprove?: (id: string) => void;
  onCancel?: (id: string) => void;
}

export function POList({ orders, onApprove, onCancel }: POListProps) {
  return (
    <div className="rounded-2xl bg-slate-900/50 border border-white/5 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              {['PO Number', 'Vendor', 'Items', 'Amount', 'Expected', 'Status', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-[9px] font-black text-slate-600 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-[10px] text-slate-600">No purchase orders found</td></tr>
            ) : orders.map(po => (
              <tr key={po.id} className="border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <FileText size={12} className="text-indigo-400 shrink-0" />
                    <span className="text-[11px] font-black text-white font-mono">{po.poNumber}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-[10px] text-slate-300">{po.vendor}</td>
                <td className="px-4 py-3 text-[10px] text-slate-400">{po.items} items</td>
                <td className="px-4 py-3 text-[11px] font-black text-white">
                  ₹{po.totalAmount.toLocaleString('en-IN')}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <Calendar size={10} className="text-slate-600" />
                    <span className="text-[9px] text-slate-400">{po.expectedDate}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${STATUS_STYLE[po.status]}`}>
                    {po.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {po.status === 'DRAFT' && (
                      <button onClick={() => onApprove?.(po.id)}
                        className="text-[9px] font-black text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
                        <CheckCircle2 size={10} /> Approve
                      </button>
                    )}
                    {(po.status === 'DRAFT' || po.status === 'SENT') && (
                      <button onClick={() => onCancel?.(po.id)}
                        className="text-[9px] font-black text-rose-400 hover:text-rose-300">
                        <X size={10} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
