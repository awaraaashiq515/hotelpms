'use client';

import React, { useEffect, useState } from 'react';
import { invoicesApi, Invoice } from '@/lib/api/invoices';
import { Printer, X, Download, AlertCircle, DollarSign, RefreshCw, Star } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface InvoiceDetailModalProps {
  invoiceId: string;
  onClose: () => void;
}

export function InvoiceDetailModal({ invoiceId, onClose }: InvoiceDetailModalProps) {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const data = await invoicesApi.get(invoiceId);
        setInvoice(data);
      } catch (err) {
        console.error('Failed to fetch invoice detail:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [invoiceId]);

  const handleExchange = async (itemId: string) => {
    try {
      await invoicesApi.replaceItem(itemId, { reason: 'Customer disliked original item' });
      // Refresh invoice data
      const data = await invoicesApi.get(invoiceId);
      setInvoice(data);
    } catch (err) {
      console.error('Exchange failed:', err);
      alert('Failed to process exchange');
    }
  };

  const handlePrint = () => {
    if (!invoice) return;

    const printWindow = window.open('', '_blank', 'width=450,height=700');
    if (!printWindow) {
      alert("Please allow popups to print the invoice.");
      return;
    }

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
            <h1 style="font-size: 24px; margin-bottom: 1mm; letter-spacing: -0.5px;">${invoice.property?.name || 'ORDERMINT POS'}</h1>
            ${invoice.property?.address ? `<p style="font-size: 10px; margin-bottom: 1mm; font-weight: normal;">${invoice.property.address}</p>` : '<p style="font-size: 10px; margin-bottom: 1mm; font-weight: normal;">Premium Hospitality Solutions</p>'}
            ${invoice.property?.phone ? `<p style="font-size: 11px;">PH: ${invoice.property.phone}</p>` : ''}
            ${invoice.property?.gstNo ? `<p style="font-size: 11px; border: 1px solid #000; display: inline-block; padding: 0.5mm 3mm; margin-top: 2mm;">GSTIN: ${invoice.property.gstNo}</p>` : ''}
          </div>

          <div class="double-line" style="margin-top: 6mm;"></div>
          <div class="text-center font-bold" style="font-size: 14px; letter-spacing: 4px;">TAX INVOICE (COPY)</div>
          <div class="double-line" style="margin-bottom: 6mm;"></div>

          <div class="font-bold uppercase" style="font-size: 11px;">
            <div class="total-row"><span>INV NO:</span> <span>${invoice.invoiceNo}</span></div>
            <div class="total-row"><span>DATE:</span> <span>${new Date(invoice.invoiceDate).toLocaleDateString()}</span></div>
            <div class="total-row"><span>TIME:</span> <span>${new Date(invoice.invoiceDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
            <div class="total-row"><span>GUEST:</span> <span style="font-size: 14px;">${invoice.guest ? `${invoice.guest.firstName} ${invoice.guest.lastName || ''}` : 'WALK-IN'}</span></div>
            ${invoice.guest?.mobile ? `<div class="total-row"><span>MOB:</span> <span>${invoice.guest.mobile}</span></div>` : ''}
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
                    ${item.hsnCode ? `<br/><span style="font-size: 8px; font-weight: normal;">HSN: ${item.hsnCode}</span>` : ''}
                  </td>
                  <td class="text-right">₹${item.totalAmount.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="dashed-line" style="margin: 5mm 0;"></div>

          <div class="font-bold uppercase" style="font-size: 11px;">
            <div class="total-row"><span>SUBTOTAL:</span> <span>₹${invoice.subtotal.toFixed(2)}</span></div>
            <div class="total-row"><span>GST (5%):</span> <span>₹${invoice.taxAmount.toFixed(2)}</span></div>
            ${invoice.discountAmount > 0 ? `<div class="total-row"><span>DISCOUNT:</span> <span>-₹${invoice.discountAmount.toFixed(2)}</span></div>` : ''}
          </div>

          <div class="double-line"></div>
          <div class="grand-total font-bold" style="display: flex; justify-content: space-between;">
            <span>NET AMOUNT:</span>
            <span>₹${invoice.totalAmount.toFixed(2)}</span>
          </div>
          <div class="double-line"></div>

          <div class="text-center font-bold footer">
            <p style="font-size: 16px; margin-bottom: 2mm; letter-spacing: 2px;">THANK YOU!</p>
            <p>VISIT AGAIN FOR PREMIUM EXPERIENCE</p>
            <div style="border-top: 1px dotted #000; margin-top: 6mm; padding-top: 3mm; opacity: 0.5;">
               <p style="font-size: 8px;">POWERED BY ANTIGRAVITY POS</p>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading) return (
    <div className="flex items-center justify-center p-20">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pos-primary"></div>
    </div>
  );

  if (!invoice) return (
    <div className="p-10 text-center space-y-4">
      <AlertCircle className="mx-auto text-red-400" size={48} />
      <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Invoice Not Found</p>
      <Button onClick={onClose} variant="secondary">Close</Button>
    </div>
  );

  return (
    <div className="space-y-6 py-4">
      {/* Header Info */}
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em] mb-1">Invoice Generated By</p>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight uppercase">{invoice.property?.name || 'OrderMint POS'}</h2>
          <p className="text-xs font-bold text-gray-400 dark:text-slate-400 tracking-widest uppercase">
            {new Date(invoice.invoiceDate).toLocaleDateString()} at {new Date(invoice.invoiceDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className={`px-4 py-2 rounded-xl text-xs font-black tracking-widest uppercase shadow-sm ${
            invoice.paymentStatus === 'PAID' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 
            invoice.paymentStatus === 'REFUNDED' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400' :
            'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400'
          }`}>
            {invoice.paymentStatus}
          </div>
          <div className="flex items-center gap-2">
            {invoice.rating && (
              <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-500/10 px-2 py-1 rounded-lg text-amber-500">
                <Star size={12} fill="currentColor" />
                <span className="text-xs font-black">{invoice.rating}</span>
              </div>
            )}
            <span className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tighter">{invoice.invoiceNo}</span>
          </div>
        </div>
      </div>

      {/* Addresses */}
      <div className="grid grid-cols-2 gap-8 border-y border-gray-100 dark:border-slate-800 py-5">
        <div className="space-y-3">
          <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em]">Customer</p>
          <div className="space-y-1">
            <p className="text-sm font-black text-gray-900 dark:text-white uppercase">{invoice.guest ? `${invoice.guest.firstName} ${invoice.guest.lastName || ''}` : 'Walk-in Guest'}</p>
            <p className="text-xs text-gray-500 dark:text-slate-400 font-bold">{invoice.guest?.mobile || 'No Mobile Number'}</p>
          </div>
        </div>
        <div className="space-y-3">
          <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em]">Status</p>
          <div className="space-y-1">
            <p className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tighter">{invoice.invoiceStatus}</p>
            <p className="text-xs text-gray-400 dark:text-slate-500 font-bold">Managed at Front Desk</p>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="space-y-3">
        <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em]">Transaction Items</p>
        <div className="border border-gray-100 dark:border-slate-800 rounded-2xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-slate-800/50">
                <th className="px-5 py-3 text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest">Item</th>
                <th className="px-5 py-3 text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest text-center">Qty</th>
                <th className="px-5 py-3 text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest text-right">Price</th>
                <th className="px-5 py-3 text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-800/50">
              {invoice.items?.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50/30 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-3">
                    <p className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-tight">{item.product?.name || item.description || 'Custom Item'}</p>
                    {item.hsnCode && <p className="text-[9px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mt-0.5">HSN: {item.hsnCode}</p>}
                    {item.status !== 'NORMAL' && (
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full mt-1 inline-block ${
                        item.status === 'RETURNED' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-500'
                      }`}>
                        {item.status}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className="text-xs font-black text-gray-600 dark:text-slate-300">x{item.qty}</span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className="text-xs font-medium text-gray-500 dark:text-slate-400">₹{item.unitPrice.toFixed(2)}</span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <span className="text-sm font-black text-gray-900 dark:text-white">₹{item.totalAmount.toFixed(2)}</span>
                       {item.status === 'NORMAL' && invoice.invoiceStatus === 'SETTLED' && (
                         <button 
                           onClick={() => {
                             if (confirm('Exchange this item? It will be marked as replaced.')) {
                               handleExchange(item.id);
                             }
                           }}
                           className="p-1.5 hover:bg-amber-50 text-gray-300 hover:text-amber-500 rounded-lg transition-all"
                           title="Replace/Exchange Item"
                         >
                           <RefreshCw size={12} />
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

      {/* Totals */}
      <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-slate-800">
        <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em]">Financial Breakdown</p>
        
        <div className="grid grid-cols-2 gap-4">
           {/* Left side: Total Paid and Balance Due stacked */}
           <div className="flex flex-col gap-4">
              <div className="bg-emerald-50/50 dark:bg-emerald-500/10 p-4 rounded-2xl border border-emerald-100/50 dark:border-emerald-500/20 flex-1 flex flex-col justify-center">
                 <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-black uppercase tracking-widest mb-1">Total Paid</p>
                 <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">₹{invoice.paidAmount?.toFixed(2) || '0.00'}</p>
              </div>
              <div className={`${invoice.dueAmount && invoice.dueAmount > 0 ? 'bg-orange-50/50 dark:bg-orange-500/10 border-orange-100/50 dark:border-orange-500/20 text-orange-600 dark:text-orange-400' : 'bg-gray-50 dark:bg-slate-800/50 text-gray-400 dark:text-slate-400 border-gray-100 dark:border-slate-700'} p-4 rounded-2xl border flex-1 flex flex-col justify-center`}>
                 <p className="text-[10px] font-black uppercase tracking-widest mb-1">Balance Due</p>
                 <p className="text-xl font-black">₹{invoice.dueAmount?.toFixed(2) || '0.00'}</p>
              </div>
           </div>

           {/* Right side: Subtotal, Tax, Net Amount */}
           <div className="bg-gray-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-gray-100 dark:border-slate-700 flex flex-col justify-center space-y-3">
              <div className="flex justify-between text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">
                <span>Subtotal</span>
                <span>₹{invoice.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">
                <span>Tax (GST 5%)</span>
                <span>₹{invoice.taxAmount.toFixed(2)}</span>
              </div>
              {invoice.discountAmount > 0 && (
                <div className="flex justify-between text-xs font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-widest">
                  <span>Discount</span>
                  <span>-₹{invoice.discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-gray-200 dark:border-slate-700 pt-4 flex justify-between mt-auto">
                <span className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">Net Amount</span>
                <span className="text-lg font-black text-pos-primary">₹{invoice.totalAmount.toFixed(2)}</span>
              </div>
           </div>
        </div>
      </div>

      {/* Settlement History */}
      {invoice.settlements && invoice.settlements.length > 0 && (
        <div className="space-y-4 pt-4">
          <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em]">Settlement History</p>
          <div className="space-y-2">
            {invoice.settlements.map((st, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-emerald-50/50 dark:bg-emerald-500/10 rounded-2xl border border-emerald-100/50 dark:border-emerald-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <DollarSign size={14} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tight">Payment Received</p>
                    <p className="text-[10px] text-gray-500 dark:text-slate-400 font-bold uppercase">{new Date(st.settlementDate).toLocaleDateString()} {new Date(st.settlementDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">₹{st.paidAmount.toFixed(2)}</p>
                  <p className="text-[10px] text-gray-500 dark:text-slate-400 font-bold uppercase tracking-widest">{st.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex gap-4 pt-6 border-t border-gray-100 dark:border-slate-800">
        <Button 
          onClick={handlePrint}
          className="flex-1 bg-pos-primary hover:bg-red-700 text-white font-bold tracking-widest gap-2"
        >
          <Printer size={16} />
          PRINT INVOICE
        </Button>
        <Button variant="secondary" onClick={onClose} className="flex-1 font-bold tracking-widest gap-2">
          CLOSE
        </Button>
      </div>
    </div>
  );
}
