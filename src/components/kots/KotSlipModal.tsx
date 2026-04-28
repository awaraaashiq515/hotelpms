'use client';

import React, { useRef } from 'react';
import { Utensils, X, Printer, ChefHat, Clock, CheckCircle } from 'lucide-react';

interface KotSlipItem {
  name: string;
  quantity: number;
  notes?: string;
}

export interface KotSlipData {
  kotNo: string;
  orderNo?: string;
  tableNo?: string;
  roomId?: string;
  orderType?: string;
  createdAt: string;
  items: KotSlipItem[];
  staffName?: string;
}


interface KotSlipModalProps {
  kot: KotSlipData | null;
  onClose: () => void;
}

export function KotSlipModal({ kot, onClose }: KotSlipModalProps) {
  // Property Branding State
  const [property, setProperty] = React.useState<any>(null);

  React.useEffect(() => {
    fetch('/api/setup/properties/current')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setProperty(data.data);
        }
      })
      .catch(err => console.error('Failed to fetch property branding:', err));
  }, []);

  if (!kot) return null;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=450,height=700');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>KOT - ${kot.kotNo}</title>
          <style>
            @page { size: 80mm auto; margin: 0; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              width: 80mm; 
              padding: 8mm 4mm; 
              font-family: 'Courier New', Courier, monospace; 
              font-size: 13px; 
              color: #000; 
              line-height: 1.1; 
              background: #fff;
            }
            .text-center { text-align: center; }
            .font-black { font-weight: 900; }
            .uppercase { text-transform: uppercase; }
            .dashed-line { border-top: 2px dashed #000; margin: 4mm 0; width: 100%; }
            .double-line { border-top: 3px solid #000; margin: 5mm 0; }
            table { width: 100%; border-collapse: collapse; margin: 4mm 0; }
            th { text-align: left; border-bottom: 2px solid #000; padding: 2mm 0; font-weight: 900; font-size: 14px; }
            td { vertical-align: top; padding: 3mm 0; font-weight: 900; }
            .qty { font-size: 24px; font-weight: 900; padding-right: 4mm; }
            .item-name { font-size: 16px; font-weight: 900; text-transform: uppercase; }
            .notes { font-size: 12px; font-style: italic; color: #000; background: #eee; padding: 1mm 2mm; margin-top: 1mm; display: inline-block; }
            .header-info { display: flex; justify-content: space-between; margin-bottom: 1.5mm; font-weight: 900; font-size: 13px; }
          </style>
        </head>
        <body onload="window.print(); setTimeout(() => window.close(), 1000);">
          <div class="text-center font-black">
            <h1 style="font-size: 14px; margin-bottom: 1mm; opacity: 0.8;">${property?.name || 'POS RESTAURANT'}</h1>
            <h2 style="font-size: 28px; margin-bottom: 1mm;">KITCHEN ORDER</h2>
            <p style="font-size: 10px; letter-spacing: 2px;">KOT TICKET</p>
          </div>

          <div class="double-line"></div>

          <div class="header-info"><span>KOT NO:</span> <span style="font-size: 20px;">${kot.kotNo}</span></div>
          <div class="header-info"><span>TIME:</span> <span>${new Date(kot.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span></div>
          <div class="header-info"><span>TABLE:</span> <span style="font-size: 18px;">${kot.tableNo || 'WALK-IN'}</span></div>
          <div class="header-info"><span>ORDER:</span> <span>#${kot.orderNo || '—'}</span></div>

          <div class="double-line" style="margin-top: 6mm;"></div>

          <table>
            <thead>
              <tr>
                <th style="width: 25%;">QTY</th>
                <th style="width: 75%;">ITEM DESCRIPTION</th>
              </tr>
            </thead>
            <tbody>
              ${kot.items.map((item: any) => `
                <tr>
                  <td class="qty">${item.quantity}</td>
                  <td class="item-name">
                    ${(item as any).name || (item as any).itemName}
                    ${item.notes ? `<br/><span class="notes">⚠ ${item.notes}</span>` : ''}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="double-line" style="margin-top: 10mm;"></div>
          <div class="text-center font-black" style="font-size: 10px; margin-top: 4mm; opacity: 0.5;">
            *** END OF TICKET ***
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const source = kot.tableNo
    ? `Table: ${kot.tableNo}`
    : kot.roomId
      ? `Room: ${kot.roomId}`
      : 'Takeaway';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 bg-white rounded-[2rem] shadow-2xl w-full max-w-sm mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-pos-primary">
                <ChefHat size={20} />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400">{property?.name || 'KITCHEN TICKET READY'}</p>
                <h2 className="text-xl font-black tracking-tight">{kot.kotNo}</h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors text-gray-400"
            >
              <X size={18} />
            </button>
          </div>

          {/* Quick Info Row */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Source', value: source },
              { label: 'Type', value: kot.orderType || '—' },
              { label: 'Time', value: new Date(kot.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
              ...(kot.staffName ? [{ label: 'Staff', value: kot.staffName }] : [])
            ].map(({ label, value }) => (
              <div key={label} className="bg-white/10 rounded-xl p-3 text-center">
                <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-1">{label}</p>
                <p className="text-xs font-black truncate">{value}</p>
              </div>
            ))}
          </div>

        </div>

        {/* Items List */}
        <div className="p-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
            <Utensils size={12} />
            Items to Prepare
          </p>
          <div className="space-y-3 max-h-[260px] overflow-y-auto no-scrollbar">
            {kot.items.map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-lg font-black text-gray-900 w-8 shrink-0">{item.quantity}×</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-gray-900 uppercase leading-tight">{(item as any).name || (item as any).itemName}</p>
                  {item.notes && (
                    <p className="text-[10px] text-orange-500 font-bold italic mt-0.5">⚠ {item.notes}</p>
                  )}
                </div>
                <CheckCircle size={16} className="text-emerald-400 shrink-0 mt-0.5" />
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 pb-6 grid grid-cols-2 gap-3">
          <button
            onClick={onClose}
            className="py-4 rounded-2xl border-2 border-gray-100 text-gray-500 font-black text-[11px] uppercase tracking-widest hover:bg-gray-50 transition-all"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="py-4 rounded-2xl bg-gray-900 text-white font-black text-[11px] uppercase tracking-widest hover:bg-gray-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-gray-900/20"
          >
            <Printer size={16} />
            Print KOT
          </button>
        </div>
      </div>
    </div>
  );
}
