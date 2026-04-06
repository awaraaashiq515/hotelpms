'use client';

import React from 'react';
import { Invoice } from '@/lib/api/invoices';
import { X, Printer } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface PrintInvoiceModalProps {
  invoice: Invoice;
  onClose: () => void;
}

export const PrintInvoiceModal: React.FC<PrintInvoiceModalProps> = ({
  invoice,
  onClose
}) => {
  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=450,height=700');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${invoice.invoiceNo}</title>
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
            <h1 style="font-size: 24px; margin-bottom: 1mm; letter-spacing: -0.5px;">${invoice.property?.name || 'POS RESTAURANT'}</h1>
            ${invoice.property?.address ? `<p style="font-size: 10px; margin-bottom: 1mm; font-weight: normal;">${invoice.property.address}</p>` : '<p style="font-size: 10px; margin-bottom: 1mm; font-weight: normal;">Premium Dining Experience</p>'}
            ${invoice.property?.phone ? `<p style="font-size: 11px;">PH: ${invoice.property.phone}</p>` : ''}
            ${(invoice.property?.gstNo || invoice.property?.taxDetails) ? `<p style="font-size: 11px; border: 1px solid #000; display: inline-block; padding: 0.5mm 3mm; margin-top: 2mm;">GSTIN: ${invoice.property.gstNo || invoice.property.taxDetails}</p>` : ''}
          </div>

          <div class="double-line" style="margin-top: 6mm;"></div>
          <div class="text-center font-bold" style="font-size: 14px; letter-spacing: 4px;">TAX INVOICE</div>
          <div class="double-line" style="margin-bottom: 6mm;"></div>

          <div class="font-bold uppercase" style="font-size: 11px;">
            <div class="total-row"><span>INVOICE NO:</span> <span>${invoice.invoiceNo}</span></div>
            <div class="total-row"><span>DATE:</span> <span>${new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}</span></div>
            <div class="total-row"><span>CUSTOMER:</span> <span>${invoice.guest ? invoice.guest.firstName : 'WALK-IN'}</span></div>
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
              ${invoice.items?.map((item: any) => `
                <tr>
                  <td>${item.qty}</td>
                  <td class="uppercase">
                    ${item.product?.name || item.description}
                    ${item.product?.hsnCode || item.hsnCode ? `<br/><span style="font-size: 8px; font-weight: normal;">HSN: ${item.product?.hsnCode || item.hsnCode}</span>` : ''}
                  </td>
                  <td class="text-right">₹${item.totalAmount.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="dashed-line" style="margin: 5mm 0;"></div>

          <div class="font-bold uppercase" style="font-size: 11px;">
            <div class="total-row"><span>SUB-TOTAL:</span> <span>₹${invoice.subtotal.toFixed(2)}</span></div>
            <div class="total-row"><span>CGST (2.5%):</span> <span>₹${(invoice.taxAmount/2).toFixed(2)}</span></div>
            <div class="total-row"><span>SGST (2.5%):</span> <span>₹${(invoice.taxAmount/2).toFixed(2)}</span></div>
            ${invoice.discountAmount > 0 ? `<div class="total-row"><span>DISCOUNT:</span> <span>-₹${invoice.discountAmount.toFixed(2)}</span></div>` : ''}
          </div>

          <div class="double-line"></div>
          <div class="grand-total font-bold" style="display: flex; justify-content: space-between;">
            <span>TOTAL AMOUNT:</span>
            <span>₹${invoice.totalAmount.toFixed(2)}</span>
          </div>
          <div class="double-line"></div>

          <div class="text-center font-bold footer">
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md transition-all">
      <div className="relative bg-[#fdfdfd] rounded-[2.5rem] w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] border border-white/20 animate-in zoom-in-95 duration-200">
        <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-white/80 backdrop-blur-md">
          <div className="flex items-center gap-5">
             <div className="w-14 h-14 bg-pos-primary text-white rounded-2xl flex items-center justify-center shadow-xl shadow-pos-primary/30 rotate-3 transition-transform hover:rotate-0">
                <Printer size={28} />
             </div>
             <div>
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest leading-none">Invoice Terminal</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase mt-2 tracking-tighter">80mm Professional Layout Preview</p>
             </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-gray-100 rounded-full transition-all text-gray-400 hover:text-red-500 active:scale-90">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-12 bg-gray-50 flex justify-center no-scrollbar">
          <div className="bg-white p-12 shadow-[0_10px_40px_rgba(0,0,0,0.05)] w-[80mm] min-h-[140mm] font-mono text-[11px] text-black border border-gray-100 relative">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-b from-gray-50 to-transparent" />
             
             <div className="text-center font-black space-y-2 mb-8">
                <h1 className="text-2xl tracking-tighter leading-none">{invoice.property?.name || 'POS RESTAURANT'}</h1>
                <p className="text-[9px] opacity-60 uppercase font-bold">{invoice.property?.address || 'Premium Dining Experience'}</p>
                {(invoice.property?.taxDetails || invoice.property?.gstNo) && (
                  <p className="text-[10px] font-black border border-black inline-block px-2 py-0.5 mt-2">GSTIN: {invoice.property.taxDetails || invoice.property.gstNo}</p>
                )}
                <div className="h-[2px] w-full bg-black mt-6 mb-2" />
                <p className="text-[14px] font-black tracking-[0.5em] py-1 border-y border-black">TAX INVOICE</p>
                <div className="h-[2px] w-full bg-black mb-6 mt-2" />
             </div>

             <div className="space-y-1.5 text-[11px] font-black uppercase mb-8">
                <div className="flex justify-between"><span>Inv No:</span> <span>{invoice.invoiceNo}</span></div>
                <div className="flex justify-between"><span>Date:</span> <span>{new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}</span></div>
                <div className="flex justify-between items-center bg-black text-white px-2 py-1 mt-2">
                  <span>Guest:</span> 
                  <span className="text-sm font-black truncate max-w-[150px]">{invoice.guest ? invoice.guest.firstName : 'WALK-IN'}</span>
                </div>
             </div>

             <table className="w-full text-left font-black text-[11px] mb-8">
                <thead className="border-b-2 border-black">
                   <tr>
                      <th className="py-2">QTY</th>
                      <th className="py-2 px-2">ITEM</th>
                      <th className="py-2 text-right">AMT</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                   {invoice.items?.map((item, idx) => (
                      <tr key={idx}>
                         <td className="py-4">{item.qty}</td>
                         <td className="py-4 px-2 uppercase leading-tight font-black">{item.product?.name || item.description}</td>
                         <td className="py-4 text-right font-black">₹{item.totalAmount.toFixed(2)}</td>
                      </tr>
                   ))}
                </tbody>
             </table>

             <div className="space-y-2 text-right font-black text-[11px] uppercase pt-6 border-t-2 border-dashed border-black/20">
                <div className="flex justify-between"><span>Sub-Total</span> <span>₹{invoice.subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>GST (5%)</span> <span>₹{invoice.taxAmount.toFixed(2)}</span></div>
                <div className="flex justify-between text-lg pt-6 border-t-4 border-double border-black mt-6">
                  <span>Gross Total</span>
                  <span className="text-xl">₹{invoice.totalAmount.toFixed(2)}</span>
                </div>
             </div>

             <div className="text-center font-black mt-16 pt-8 border-t border-dotted border-black/20">
                <p className="text-lg tracking-widest mb-2">THANK YOU!</p>
                <p className="text-[8px] opacity-40">VISIT AGAIN • HAVE A NICE DAY</p>
             </div>
          </div>
        </div>

        <div className="p-8 bg-white border-t border-gray-100">
          <Button 
            onClick={handlePrint}
            className="w-full py-7 bg-pos-primary hover:bg-red-700 text-white rounded-3xl font-black uppercase tracking-[0.2em] gap-3 shadow-2xl shadow-pos-primary/40 active:scale-95 transition-all text-xs"
          >
            <Printer size={22} /> Confirm Print Invoice
          </Button>
        </div>
      </div>
    </div>
  );
};
