'use client';

import React from 'react';
import { X, Printer } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface PrintBillModalProps {
  bill: any;
  onClose: () => void;
}

export const PrintBillModal: React.FC<PrintBillModalProps> = ({ bill, onClose }) => {
  const getSubtotal = () => {
    if (typeof bill.subtotal === 'number') return bill.subtotal;
    return (bill.items || []).reduce((s: number, i: any) => s + (Number(i.totalAmount) || (Number(i.quantity) * Number(i.unitPrice)) || 0), 0);
  };
  const getTax = () => {
    if (typeof bill.taxAmount === 'number') return bill.taxAmount;
    return getSubtotal() * 0.05;
  };
  const getGrandTotal = () => {
    if (typeof bill.grandTotal === 'number') return bill.grandTotal;
    return getSubtotal() + getTax();
  };

  const handlePrint = async () => {
    // Try Direct Serial Printing via Backend API first
    try {
      const response = await fetch('/api/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bill, property: bill.property })
      });
      const result = await response.json();
      if (result.success) {
        console.log(`Bill printed successfully via Serial Port`);
        onClose();
        return;
      } else {
        throw new Error(result.message);
      }
    } catch (e) {
      console.warn("Direct serial print failed, falling back to browser print:", e);
    }

    const printWindow = window.open('', '_blank', 'width=450,height=700');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${bill.orderNo}</title>
          <style>
            @page { size: 80mm auto; margin: 0; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              width: 80mm; 
              padding: 10mm 4mm; 
              font-family: 'Courier New', Courier, monospace; 
              font-size: 11px; 
              color: #000; 
              line-height: 1.1; 
              background: #fff;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: 900; }
            .uppercase { text-transform: uppercase; }
            .dashed-line { border-top: 1.5px dashed #000; margin: 3mm 0; width: 100%; }
            .double-line { border-top: 2.5px solid #000; margin: 4mm 0; }
            table { width: 100%; border-collapse: collapse; margin: 3mm 0; }
            th { text-align: left; border-bottom: 1.5px dashed #000; padding: 1.5mm 0; font-weight: 900; font-size: 10px; }
            td { vertical-align: top; padding: 2mm 0; font-weight: 900; }
            .total-row { display: flex; justify-content: space-between; margin-bottom: 1.5mm; }
            .grand-total { font-size: 17px; font-weight: 900; margin-top: 2mm; }
            .footer { margin-top: 15mm; font-size: 9px; opacity: 0.8; }
          </style>
        </head>
        <body onload="window.print(); setTimeout(() => window.close(), 1000);">
          <div class="text-center font-bold">
            <h1 style="font-size: 24px; margin-bottom: 1mm; letter-spacing: -0.5px;">${bill.property?.name || 'POS RESTAURANT'}</h1>
            ${bill.property?.address ? `<p style="font-size: 10px; margin-bottom: 1mm; font-weight: normal;">${bill.property.address}</p>` : '<p style="font-size: 10px; margin-bottom: 1mm; font-weight: normal;">Premium Dining Experience</p>'}
            ${bill.property?.phone ? `<p style="font-size: 11px;">PH: ${bill.property.phone}</p>` : ''}
            ${(bill.property?.gstNo || bill.property?.taxDetails) ? `<p style="font-size: 11px; border: 1px solid #000; display: inline-block; padding: 0.5mm 3mm; margin-top: 2mm;">GSTIN: ${bill.property.gstNo || bill.property.taxDetails}</p>` : ''}
          </div>

          <div class="double-line" style="margin-top: 6mm;"></div>
          <div class="text-center font-bold" style="font-size: 14px; letter-spacing: 4px;">TAX INVOICE</div>
          <div class="double-line" style="margin-bottom: 6mm;"></div>

          <div class="font-bold uppercase" style="font-size: 11px;">
            <div class="total-row"><span>BILL NO:</span> <span>${bill.orderNo}</span></div>
            <div class="total-row"><span>DATE:</span> <span>${new Date(bill.createdAt || Date.now()).toLocaleDateString('en-IN')}</span></div>
            <div class="total-row"><span>TIME:</span> <span>${new Date(bill.createdAt || Date.now()).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span></div>
            <div class="total-row"><span>TABLE:</span> <span style="font-size: 16px;">${bill.tableNo || 'WALK-IN'}</span></div>
          </div>

          <div class="dashed-line" style="margin: 5mm 0;"></div>

          <table>
            <thead>
              <tr>
                <th style="width: 15%;">QTY</th>
                <th style="width: 55%;">DESCRIPTION</th>
                <th style="width: 30%; text-align: right;">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              ${(bill.items || []).map((item: any) => `
                <tr>
                  <td>${item.quantity || 0}</td>
                  <td class="uppercase">
                    ${item.product?.name || item.itemName || 'Unknown Item'}
                    ${item.product?.hsnCode ? `<br/><span style="font-size: 8px; font-weight: normal;">HSN: ${item.product.hsnCode}</span>` : ''}
                  </td>
                  <td class="text-right">₹${(Number(item.totalAmount) || (Number(item.quantity) * Number(item.unitPrice)) || 0).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="dashed-line" style="margin: 5mm 0;"></div>

          <div class="font-bold uppercase" style="font-size: 11px;">
            <div class="total-row"><span>SUB-TOTAL:</span> <span>₹${getSubtotal().toFixed(2)}</span></div>
            <div class="total-row"><span>CGST:</span> <span>₹${(getTax()/2).toFixed(2)}</span></div>
            <div class="total-row"><span>SGST:</span> <span>₹${(getTax()/2).toFixed(2)}</span></div>
            ${bill.discountAmount > 0 ? `<div class="total-row"><span>DISCOUNT:</span> <span>-₹${bill.discountAmount?.toFixed(2)}</span></div>` : ''}
          </div>

          <div class="double-line"></div>
          <div class="grand-total font-bold" style="display: flex; justify-content: space-between;">
            <span>TOTAL AMOUNT:</span>
            <span>₹${getGrandTotal().toFixed(2)}</span>
          </div>
          <div class="double-line"></div>

          <div class="text-center font-bold footer">
            <p style="font-size: 8px; margin-bottom: 2mm;">(Prices are inclusive of taxes where applicable)</p>
            <p style="font-size: 16px; margin-bottom: 2mm; letter-spacing: 2px;">THANK YOU!</p>
            <p uppercase>VISIT AGAIN • HAVE A NICE DAY</p>
            <div style="border-top: 1px dotted #000; margin-top: 6mm; padding-top: 3mm; opacity: 0.5;">
               <p style="font-size: 8px;">POWERED BY ANTIGRAVITY POS</p>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-500">
      <div className="relative bg-[#fdfdfd] rounded-[2.5rem] w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] border border-white/20">
        <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-white/80 backdrop-blur-md">
          <div className="flex items-center gap-5">
             <div className="w-14 h-14 bg-pos-primary text-white rounded-2xl flex items-center justify-center shadow-xl shadow-pos-primary/30 rotate-3 transition-transform hover:rotate-0">
                <Printer size={28} />
             </div>
             <div>
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest leading-none">Bill Terminal</h3>
                <p className="text-[10px] text-gray-400 font-medium uppercase mt-2 tracking-tighter">80mm Professional Layout Preview</p>
             </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-gray-100 rounded-full transition-all text-gray-400 hover:text-red-500 active:scale-90">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-12 bg-gray-50 flex justify-center no-scrollbar">
          <div className="bg-white p-12 shadow-[0_10px_40px_rgba(0,0,0,0.05)] w-[80mm] min-h-[140mm] font-mono text-[11px] text-black border border-gray-100 relative">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-b from-gray-50 to-transparent" />
             
             <div className="text-center font-bold space-y-2 mb-8">
                <h1 className="text-xl tracking-tight leading-none uppercase">{bill.property?.name || 'POS RESTAURANT'}</h1>
                <p className="text-[9px] opacity-60 font-medium uppercase">{bill.property?.address || 'Premium Dining Experience'}</p>
                {bill.property?.taxDetails && (
                  <p className="text-[10px] font-bold border border-black inline-block px-2 py-0.5 mt-2 uppercase">GSTIN: {bill.property.taxDetails}</p>
                )}
                <div className="h-[2px] w-full bg-black mt-6 mb-2" />
                <p className="text-[13px] font-bold tracking-[0.4em] py-1 border-y border-black uppercase">TAX INVOICE</p>
                <div className="h-[2px] w-full bg-black mb-6 mt-2" />
             </div>

             <div className="space-y-1.5 text-[11px] font-bold uppercase mb-8">
                <div className="flex justify-between"><span>Bill No:</span> <span>{bill.orderNo}</span></div>
                <div className="flex justify-between"><span>Date:</span> <span>{new Date(bill.createdAt || Date.now()).toLocaleDateString('en-IN')}</span></div>
                <div className="flex justify-between items-center bg-black text-white px-2 py-1 mt-2">
                  <span>Table No:</span> 
                  <span className="text-base font-bold">{bill.tableNo || 'WALK-IN'}</span>
                </div>
             </div>

             <table className="w-full text-left font-bold text-[11px] mb-8">
                <thead className="border-b-2 border-black">
                   <tr>
                      <th className="py-2">QTY</th>
                      <th className="py-2 px-2">DESCRIPTION</th>
                      <th className="py-2 text-right">AMT</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                   {(bill.items || []).map((item: any) => (
                      <tr key={item.id}>
                         <td className="py-4">{item.quantity}</td>
                         <td className="py-4 px-2 uppercase leading-tight font-bold">{item.product?.name || item.itemName || 'Unknown Item'}</td>
                         <td className="py-4 text-right font-bold">₹{(Number(item.totalAmount) || (Number(item.quantity) * Number(item.unitPrice)) || 0).toFixed(2)}</td>
                      </tr>
                   ))}
                </tbody>
             </table>

             <div className="space-y-2 text-right font-bold text-[11px] uppercase pt-6 border-t-2 border-dashed border-black/20">
                <div className="flex justify-between"><span>Sub-Total</span> <span>₹{getSubtotal().toFixed(2)}</span></div>
                <div className="flex justify-between"><span>CGST</span> <span>₹{(getTax()/2).toFixed(2)}</span></div>
               <div className="flex justify-between"><span>SGST</span> <span>₹{(getTax()/2).toFixed(2)}</span></div>
                <div className="flex justify-between text-base pt-6 border-t-4 border-double border-black mt-6">
                  <span>Net Payable</span>
                  <span className="text-lg">₹{getGrandTotal().toFixed(2)}</span>
                </div>
             </div>

             <div className="text-center font-bold mt-16 pt-8 border-t border-dotted border-black/20">
                <p className="text-[9px] opacity-70 mb-4 uppercase">(Prices are inclusive of taxes where applicable)</p>
                <p className="text-base tracking-widest mb-2 uppercase">Thank You!</p>
                <p className="text-[8px] opacity-40 uppercase">Visit Again • Have a nice day</p>
             </div>
          </div>
        </div>

        <div className="p-8 bg-white border-t border-gray-100 flex gap-6">
          <Button variant="secondary" onClick={onClose} className="flex-1 py-6 rounded-3xl border-gray-200 text-gray-500 font-bold uppercase tracking-widest hover:bg-gray-50 text-[10px]">Back</Button>
          <Button onClick={handlePrint} className="flex-[2] py-6 bg-pos-primary hover:bg-red-700 text-white rounded-3xl font-bold uppercase tracking-widest gap-3 shadow-2xl shadow-pos-primary/40 active:scale-95 transition-all text-xs">
            <Printer size={20} /> Confirm Print
          </Button>
        </div>
      </div>
    </div>
  );
};




