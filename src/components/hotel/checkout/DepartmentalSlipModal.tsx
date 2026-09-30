'use client';

import React, { useRef } from 'react';
import {
  X,
  Printer,
  UtensilsCrossed,
  Sparkles,
  Shirt,
  Calendar,
  Clock,
  User,
  Bed,
  CheckCircle2,
  Receipt,
  Building2,
} from 'lucide-react';
import { toast } from 'sonner';

export type SlipType = 'POS' | 'LAUNDRY' | 'SPA';

export interface DepartmentalSlipData {
  type: SlipType;
  title: string;
  hotelName?: string;
  roomNumber?: string;
  guestName?: string;
  referenceNo: string;
  date: string;
  status?: string;
  // POS Specific
  outletName?: string;
  items?: {
    name: string;
    quantity: number;
    unitPrice: number;
    totalAmount: number;
    isVeg?: boolean;
  }[];
  // Spa Specific
  serviceName?: string;
  therapistName?: string;
  duration?: number;
  spaName?: string;
  // Laundry Specific
  itemsCount?: number;
  itemsDetail?: string;
  collectedAt?: string;
  deliveredAt?: string;
  // Financials
  subtotal: number;
  taxAmount?: number;
  grandTotal: number;
  notes?: string;
}

interface DepartmentalSlipModalProps {
  isOpen: boolean;
  data: DepartmentalSlipData | null;
  onClose: () => void;
}

function fmt(n: number) {
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default function DepartmentalSlipModal({
  isOpen,
  data,
  onClose,
}: DepartmentalSlipModalProps) {
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !data) return null;

  const handlePrint = () => {
    const printContent = printAreaRef.current?.innerHTML;
    if (!printContent) return;

    const printWin = window.open('', '_blank', 'width=450,height=700');
    if (!printWin) {
      toast.error('Please allow popups to print receipt');
      return;
    }

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${data.title} - ${data.referenceNo}</title>
          <style>
            @page {
              size: 80mm auto;
              margin: 4mm;
            }
            body {
              font-family: 'Courier New', Courier, monospace;
              color: #000;
              background: #fff;
              width: 72mm;
              margin: 0 auto;
              padding: 5px;
              font-size: 11px;
              line-height: 1.35;
            }
            .center { text-align: center; }
            .right { text-align: right; }
            .bold { font-weight: bold; }
            .divider { border-top: 1px dashed #000; margin: 6px 0; }
            .double-divider { border-top: 2px solid #000; margin: 6px 0; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; }
            th, td { padding: 2px 0; }
            .tag { display: inline-block; padding: 1px 4px; border: 1px solid #000; font-size: 9px; }
            @media print {
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          ${printContent}
          <script>
            window.onload = function() {
              window.focus();
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#090f1e] border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2">
            {data.type === 'POS' ? (
              <UtensilsCrossed size={16} className="text-amber-400" />
            ) : data.type === 'SPA' ? (
              <Sparkles size={16} className="text-purple-400" />
            ) : (
              <Shirt size={16} className="text-sky-400" />
            )}
            <div>
              <p className="text-xs font-black text-white">{data.title}</p>
              <p className="text-[10px] text-slate-400 font-mono">Ref #{data.referenceNo}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-bold text-white shadow-md active:scale-95 transition-all"
            >
              <Printer size={13} /> Print Slip
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Slip Preview (Thermal receipt style on paper canvas) */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-950/70">
          <div
            ref={printAreaRef}
            className="bg-white text-slate-900 rounded-2xl p-6 shadow-xl border border-slate-200 font-mono text-xs max-w-sm mx-auto"
          >
            {/* Header */}
            <div className="text-center pb-2 border-b border-dashed border-slate-300">
              <h2 className="font-black text-sm uppercase tracking-wider text-slate-900">
                {data.hotelName || 'HOTEL & RESORT'}
              </h2>
              <p className="text-[11px] font-bold text-slate-600 mt-0.5">
                {data.outletName || (data.type === 'POS' ? 'RESTAURANT & IN-ROOM DINING' : data.type === 'SPA' ? 'SPA & WELLNESS' : 'LAUNDRY SERVICE')}
              </p>
              <div className="mt-1.5 inline-block px-2 py-0.5 rounded border border-slate-400 text-[10px] font-bold">
                {data.type === 'POS' ? 'RESTAURANT BILL / KOT' : data.type === 'SPA' ? 'SPA SERVICE RECEIPT' : 'LAUNDRY CHARGE SLIP'}
              </div>
            </div>

            {/* Meta info */}
            <div className="py-2.5 space-y-1 text-[11px] border-b border-dashed border-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">Bill/Ref No:</span>
                <span className="font-bold text-slate-900">#{data.referenceNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date & Time:</span>
                <span className="font-medium text-slate-800">{data.date}</span>
              </div>
              {data.roomNumber && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Charged to Room:</span>
                  <span className="font-black text-slate-900">Room {data.roomNumber}</span>
                </div>
              )}
              {data.guestName && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Guest Name:</span>
                  <span className="font-bold text-slate-900">{data.guestName}</span>
                </div>
              )}
              {data.status && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <span className="font-bold uppercase text-slate-900">{data.status}</span>
                </div>
              )}
            </div>

            {/* Content: POS Items */}
            {data.type === 'POS' && data.items && data.items.length > 0 && (
              <div className="py-2.5 border-b border-dashed border-slate-300">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-300 text-[10px] font-bold text-slate-500">
                      <th className="pb-1">ITEM</th>
                      <th className="pb-1 text-center">QTY</th>
                      <th className="pb-1 text-right">RATE</th>
                      <th className="pb-1 text-right">AMT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.items.map((item, idx) => (
                      <tr key={idx} className="text-[11px]">
                        <td className="py-1 pr-1 font-bold text-slate-900">
                          {item.isVeg !== undefined && (
                            <span className={item.isVeg ? 'text-emerald-600 mr-1' : 'text-rose-600 mr-1'}>
                              {item.isVeg ? '●' : '▲'}
                            </span>
                          )}
                          {item.name}
                        </td>
                        <td className="py-1 text-center font-bold">{item.quantity}</td>
                        <td className="py-1 text-right text-slate-600">{fmt(item.unitPrice)}</td>
                        <td className="py-1 text-right font-black text-slate-900">{fmt(item.totalAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Content: Spa Details */}
            {data.type === 'SPA' && (
              <div className="py-2.5 space-y-1.5 border-b border-dashed border-slate-300 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Service:</span>
                  <span className="font-black text-slate-900">{data.serviceName || 'Spa Treatment'}</span>
                </div>
                {data.duration && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Duration:</span>
                    <span className="font-bold text-slate-800">{data.duration} Minutes</span>
                  </div>
                )}
                {data.therapistName && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Therapist:</span>
                    <span className="font-bold text-slate-800">{data.therapistName}</span>
                  </div>
                )}
                {data.spaName && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Spa Center:</span>
                    <span className="font-bold text-slate-800">{data.spaName}</span>
                  </div>
                )}
              </div>
            )}

            {/* Content: Laundry Details */}
            {data.type === 'LAUNDRY' && (
              <div className="py-2.5 space-y-1.5 border-b border-dashed border-slate-300 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Pieces:</span>
                  <span className="font-black text-slate-900">{data.itemsCount || 1} piece(s)</span>
                </div>
                {data.itemsDetail && (
                  <div className="pt-1">
                    <span className="text-slate-500 block text-[10px] mb-0.5">Garment Details:</span>
                    <div className="p-2 bg-slate-50 rounded border border-slate-200 text-slate-800 text-[10px]">
                      {data.itemsDetail}
                    </div>
                  </div>
                )}
                {data.collectedAt && (
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-500">Collected:</span>
                    <span className="text-slate-700">{new Date(data.collectedAt).toLocaleDateString('en-GB')}</span>
                  </div>
                )}
                {data.deliveredAt && (
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-500">Delivered:</span>
                    <span className="text-slate-700">{new Date(data.deliveredAt).toLocaleDateString('en-GB')}</span>
                  </div>
                )}
              </div>
            )}

            {/* Financial Totals */}
            <div className="py-2.5 space-y-1 text-[11px]">
              {data.taxAmount !== undefined && data.taxAmount > 0 && (
                <>
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span>{fmt(data.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>GST / Taxes:</span>
                    <span>{fmt(data.taxAmount)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between font-black text-sm text-slate-900 pt-1 border-t-2 border-slate-900">
                <span>TOTAL AMOUNT:</span>
                <span>{fmt(data.grandTotal)}</span>
              </div>
              <div className="text-[10px] text-slate-500 text-right font-medium">
                (Charged to Room Folio)
              </div>
            </div>

            {/* Footer */}
            <div className="text-center pt-3 border-t border-dashed border-slate-300 text-[10px] text-slate-500">
              <p>Thank you for choosing our services!</p>
              <p className="mt-1 text-[9px]">Guest Signature: _____________________</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
