'use client';

import React from 'react';
import {
  X,
  Printer,
  Calendar,
  Building2,
  Clock,
  FileText,
  CheckCircle2,
  Truck,
  MessageCircle,
  ExternalLink,
  Phone,
  Mail,
  MapPin,
  AlertCircle,
  User
} from 'lucide-react';
import { openWhatsAppPO } from '@/lib/whatsapp-po';

export interface POItemDetail {
  id?: string;
  name: string;
  quantity: number;
  unit?: string;
  description?: string;
  unitPrice: number;
  totalPrice?: number;
}

export interface DetailedPO {
  id: string;
  poNumber: string;
  vendorId?: string;
  vendor: string;
  vendorPhone?: string;
  vendorEmail?: string;
  vendorCategory?: string;
  vendorAddress?: string;
  items: POItemDetail[];
  totalAmount: number;
  status: 'DRAFT' | 'SENT' | 'CONFIRMED' | 'DELIVERED' | 'CANCELLED';
  createdAt: string;
  expectedDate?: string;
  notes?: string;
  hotelName?: string;
  hotelPhone?: string;
  hotelAddress?: string;
  assignedStaffName?: string;
  assignedStaffPhone?: string;
}

interface PODetailsModalProps {
  order: DetailedPO | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: (id: string, newStatus: string) => Promise<void>;
}

const STATUS_BADGE: Record<string, string> = {
  DRAFT: 'text-slate-300 bg-slate-800 border-slate-700',
  SENT: 'text-sky-300 bg-sky-500/10 border-sky-500/30',
  CONFIRMED: 'text-amber-300 bg-amber-500/10 border-amber-500/30',
  DELIVERED: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30',
  CANCELLED: 'text-rose-300 bg-rose-500/10 border-rose-500/30',
};

export const PODetailsModal: React.FC<PODetailsModalProps> = ({
  order,
  isOpen,
  onClose,
  onStatusChange,
}) => {
  if (!isOpen || !order) return null;

  const handleWhatsApp = () => {
    openWhatsAppPO({
      hotelName: order.hotelName || 'Grand Hotel PMS',
      poNumber: order.poNumber,
      orderDate: order.createdAt,
      expectedDate: order.expectedDate,
      vendorName: order.vendor,
      vendorPhone: order.vendorPhone,
      items: order.items,
      totalAmount: order.totalAmount,
      notes: order.notes,
      assignedStaffName: order.assignedStaffName,
      assignedStaffPhone: order.assignedStaffPhone,
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden my-auto print:m-0 print:border-none print:shadow-none print:bg-white print:text-black">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <FileText size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-wide">Purchase Order Slip</h3>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${STATUS_BADGE[order.status] || 'bg-slate-800'}`}>
                  {order.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">{order.poNumber}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              type="button"
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition"
              title="Print Order Slip"
            >
              <Printer size={13} />
              <span className="hidden sm:inline">Print Slip</span>
            </button>

            <button
              onClick={handleWhatsApp}
              type="button"
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition"
              title="Send to Vendor via WhatsApp"
            >
              <MessageCircle size={14} />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={onClose}
              type="button"
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Slip Body - Printable Format */}
        <div className="p-5 sm:p-7 space-y-6 print:p-0 text-slate-200 print:text-black">
          {/* Top Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-5 border-b border-slate-800 print:border-black/20">
            <div>
              <p className="text-[10px] uppercase font-black text-cyan-400 print:text-slate-600 tracking-wider">Hotel / Buyer</p>
              <h2 className="text-lg font-black text-white print:text-black mt-0.5">
                {order.hotelName || 'Hotel Property'}
              </h2>
              {order.hotelPhone && (
                <p className="text-xs text-slate-400 print:text-slate-700 mt-1 flex items-center gap-1">
                  <Phone size={11} /> {order.hotelPhone}
                </p>
              )}
              {order.hotelAddress && (
                <p className="text-xs text-slate-400 print:text-slate-700 mt-0.5 flex items-center gap-1">
                  <MapPin size={11} /> {order.hotelAddress}
                </p>
              )}
            </div>

            <div className="sm:text-right">
              <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider">PO Reference</p>
              <p className="text-base font-black font-mono text-cyan-400 print:text-black">{order.poNumber}</p>
              <p className="text-xs text-slate-400 print:text-slate-600 mt-1">
                Order Date: <span className="font-semibold text-slate-300 print:text-black">{order.createdAt}</span>
              </p>
              {order.expectedDate && (
                <p className="text-xs text-amber-400 print:text-slate-800 font-medium mt-0.5">
                  Expected Delivery: <span className="font-bold">{order.expectedDate}</span>
                </p>
              )}
            </div>
          </div>

          {/* Vendor Details Card */}
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 print:bg-white print:border-black/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[9px] font-black uppercase text-indigo-400 print:text-slate-600 tracking-wider">Vendor Details</span>
              <h4 className="text-sm font-bold text-white print:text-black mt-0.5 flex items-center gap-2">
                <Building2 size={14} className="text-indigo-400 print:text-black" />
                {order.vendor}
                {order.vendorCategory && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 print:border-black/20 print:text-black">
                    {order.vendorCategory}
                  </span>
                )}
              </h4>
              <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-400 print:text-slate-700">
                {order.vendorPhone ? (
                  <a
                    href={`tel:${order.vendorPhone}`}
                    className="flex items-center gap-1 hover:text-cyan-400 font-mono transition"
                  >
                    <Phone size={11} /> {order.vendorPhone}
                  </a>
                ) : (
                  <span className="text-amber-400/80 text-[11px] flex items-center gap-1">
                    <AlertCircle size={10} /> No phone recorded
                  </span>
                )}
                {order.vendorEmail && (
                  <span className="flex items-center gap-1">
                    <Mail size={11} /> {order.vendorEmail}
                  </span>
                )}
                {order.vendorAddress && (
                  <span className="flex items-center gap-1">
                    <MapPin size={11} /> {order.vendorAddress}
                  </span>
                )}
              </div>
            </div>

            <div className="print:hidden flex items-center gap-2">
              <button
                onClick={handleWhatsApp}
                type="button"
                className="px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 transition"
              >
                <MessageCircle size={14} className="text-emerald-400" />
                <span>Open WhatsApp</span>
              </button>
            </div>
          </div>

          {/* Assigned Staff (Runner / Receiver) */}
          {order.assignedStaffName && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 print:bg-white print:border-black/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                  <User size={13} />
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase text-amber-400 print:text-black tracking-wider block">
                    Assigned Staff (Pickup / Receiving)
                  </span>
                  <span className="text-xs font-bold text-white print:text-black">
                    {order.assignedStaffName}
                  </span>
                </div>
              </div>

              {order.assignedStaffPhone && (
                <div className="text-xs text-slate-300 print:text-black flex items-center gap-1.5 sm:ml-auto">
                  <span className="text-slate-400">Contact:</span>
                  <a
                    href={`tel:${order.assignedStaffPhone}`}
                    className="font-mono text-cyan-400 print:text-black font-semibold hover:underline"
                  >
                    {order.assignedStaffPhone}
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Items Table */}
          <div className="rounded-xl border border-slate-800 print:border-black/20 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-800/60 print:bg-slate-100 text-[10px] font-black uppercase text-slate-400 print:text-black border-b border-slate-800 print:border-black/20">
                  <th className="py-2.5 px-3 w-12 text-center">#</th>
                  <th className="py-2.5 px-3">Item Description</th>
                  <th className="py-2.5 px-3 text-right">Quantity</th>
                  <th className="py-2.5 px-3 text-right">Unit Rate (₹)</th>
                  <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 print:divide-black/10 text-xs">
                {order.items.map((item, idx) => {
                  const lineTotal = item.totalPrice || item.quantity * item.unitPrice;
                  return (
                    <tr key={idx} className="hover:bg-slate-800/20 print:hover:bg-transparent">
                      <td className="py-2.5 px-3 text-center text-slate-500 print:text-slate-600 font-mono">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-semibold text-white print:text-black">
                        <div>{item.name}</div>
                        {item.description && (
                          <div className="text-[10px] text-cyan-400/90 print:text-slate-600 italic font-normal">
                            Specs: {item.description}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium text-slate-300 print:text-black">
                        {item.quantity} {item.unit || 'units'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-400 print:text-black">
                        {item.unitPrice && item.unitPrice > 0 ? `₹${item.unitPrice.toLocaleString('en-IN')}` : 'Market Rate'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold font-mono text-cyan-300 print:text-black">
                        {lineTotal && lineTotal > 0 ? `₹${lineTotal.toLocaleString('en-IN')}` : 'On Bill'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Calculations & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start pt-2">
            <div>
              {order.notes ? (
                <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-700/40 print:border-black/20">
                  <p className="text-[10px] uppercase font-black text-slate-400 print:text-black tracking-wider">Instructions & Remarks</p>
                  <p className="text-xs text-slate-300 print:text-slate-800 mt-1 italic">&quot;{order.notes}&quot;</p>
                </div>
              ) : (
                <div className="text-xs text-slate-500 print:text-slate-400 italic">
                  Standard hotel procurement terms apply. Please supply fresh stock as per standard grade.
                </div>
              )}
            </div>

            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 print:bg-transparent print:border-black/20 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 print:text-black">
                <span>Total Items:</span>
                <span className="font-semibold text-slate-200 print:text-black">{order.items.length}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400 print:text-black">
                <span>Subtotal:</span>
                <span className="font-mono text-slate-200 print:text-black">₹{order.totalAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="pt-2 border-t border-slate-700 print:border-black/20 flex items-center justify-between">
                <span className="text-sm font-black text-white print:text-black">Grand Total:</span>
                <span className="text-base font-black font-mono text-cyan-400 print:text-black">
                  ₹{order.totalAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-slate-800 bg-slate-950/80 print:hidden flex-wrap gap-3">
          <div className="flex items-center gap-2">
            {order.status === 'DRAFT' && onStatusChange && (
              <button
                type="button"
                onClick={() => onStatusChange(order.id, 'ACCEPTED')}
                className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5 transition"
              >
                <CheckCircle2 size={13} />
                <span>Confirm PO</span>
              </button>
            )}

            {(order.status === 'SENT' || order.status === 'CONFIRMED') && onStatusChange && (
              <button
                type="button"
                onClick={() => onStatusChange(order.id, 'DELIVERED')}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition"
              >
                <Truck size={13} />
                <span>Mark Delivered & Receive Stock</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={handleWhatsApp}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition"
            >
              <MessageCircle size={14} />
              <span>Send WhatsApp to Vendor</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

