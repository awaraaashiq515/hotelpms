'use client';

import React, { useEffect, useState } from 'react';
import { invoicesApi, Invoice } from '@/lib/api/invoices';
import { Printer, X, Download, AlertCircle, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface InvoiceDetailModalProps {
  invoiceId: string;
  onClose: () => void;
}

export function InvoiceDetailModal({ invoiceId, onClose }: InvoiceDetailModalProps) {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

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

  const handlePrint = () => {
    const iframe = iframeRef.current;
    if (!invoice || !iframe) return;

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${invoice.invoiceNo}</title>
          <style>
            @page { size: 80mm auto; margin: 0; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              width: 80mm; padding: 6mm 4mm; 
              font-family: 'Courier New', Courier, monospace; 
              font-size: 11px; color: #000; line-height: 1.1; 
              background: #fff;
            }
            .center { text-align: center; }
            .right { text-align: right; }
            .font-bold { font-weight: 900; }
            .uppercase { text-transform: uppercase; }
            .dashed-line { border-top: 1.5px dashed #000; margin: 2mm 0; }
            .double-line { border-top: 2.5px solid #000; margin: 3mm 0; }
            table { width: 100%; border-collapse: collapse; margin: 2mm 0; }
            th { text-align: left; border-bottom: 1px dashed #000; padding: 1mm 0; font-weight: 900; }
            td { vertical-align: top; padding: 1.5mm 0; font-weight: 900; }
            .total-row { display: flex; justify-content: space-between; margin-bottom: 1mm; }
            .footer { margin-top: 8mm; font-size: 9px; opacity: 0.6; }
          </style>
        </head>
        <body>
          <div class="center font-bold">
            <h1 style="font-size: 18px; margin-bottom: 1mm;">${invoice.property?.name || 'ORDERMINT POS'}</h1>
            <p style="font-size: 9px;">${invoice.property?.address || 'Premium Hospitality Solutions'}</p>
            ${invoice.property?.phone ? `<p style="font-size: 10px;">PH: ${invoice.property.phone}</p>` : ''}
            ${invoice.property?.gstNo ? `<p style="font-size: 10px;">GSTIN: ${invoice.property.gstNo}</p>` : ''}
          </div>

          <div class="double-line"></div>
          <div class="center font-bold" style="letter-spacing: 2px;">TAX INVOICE (COPY)</div>
          <div class="dashed-line"></div>

          <div class="font-bold uppercase" style="font-size: 10px;">
            <div class="total-row"><span>INV NO:</span> <span>${invoice.invoiceNo}</span></div>
            <div class="total-row"><span>DATE:</span> <span>${new Date(invoice.invoiceDate).toLocaleDateString()} ${new Date(invoice.invoiceDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
            <div class="total-row"><span>GUEST:</span> <span>${invoice.guest ? `${invoice.guest.firstName} ${invoice.guest.lastName || ''}` : 'REGULAR CUSTOMER'}</span></div>
          </div>

          <div class="dashed-line"></div>

          <table>
            <thead>
              <tr>
                <th style="width: 15%;">QTY</th>
                <th style="width: 55%;">DESCRIPTION</th>
                <th style="width: 30%; text-align: right;">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items?.map(item => `
                <tr>
                  <td>${item.qty}</td>
                  <td class="uppercase">${item.product?.name || item.description}</td>
                  <td class="right">₹${item.totalAmount.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="dashed-line"></div>

          <div class="font-bold uppercase" style="font-size: 10px;">
            <div class="total-row"><span>SUBTOTAL:</span> <span>₹${invoice.subtotal.toFixed(2)}</span></div>
            <div class="total-row"><span>GST (5%):</span> <span>₹${invoice.taxAmount.toFixed(2)}</span></div>
            ${invoice.discountAmount > 0 ? `<div class="total-row"><span>DISCOUNT:</span> <span>-₹${invoice.discountAmount.toFixed(2)}</span></div>` : ''}
          </div>

          <div class="double-line"></div>
          <div class="font-bold" style="display: flex; justify-content: space-between; font-size: 14px;">
            <span>NET AMOUNT:</span>
            <span>₹${invoice.totalAmount.toFixed(2)}</span>
          </div>
          <div class="double-line"></div>

          <div class="center font-bold footer">
            <p style="font-size: 12px; margin-bottom: 2mm;">THANK YOU!</p>
            <p>VISIT AGAIN FOR PREMIUM EXPERIENCE</p>
          </div>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    }, 500);
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
    <div className="space-y-8 py-4">
      {/* Header Info */}
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-1">Invoice Generated By</p>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">{invoice.property?.name || 'OrderMint POS'}</h2>
          <p className="text-xs font-bold text-gray-400 tracking-widest uppercase">
            {new Date(invoice.invoiceDate).toLocaleDateString()} at {new Date(invoice.invoiceDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className={`px-4 py-2 rounded-xl text-xs font-black tracking-widest uppercase shadow-sm ${
            invoice.paymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'
          }`}>
            {invoice.paymentStatus}
          </div>
          <span className="text-sm font-black text-gray-900 uppercase tracking-tighter">{invoice.invoiceNo}</span>
        </div>
      </div>

      {/* Addresses */}
      <div className="grid grid-cols-2 gap-8 border-y border-gray-100 py-6">
        <div className="space-y-3">
          <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Customer</p>
          <div className="space-y-1">
            <p className="text-sm font-black text-gray-900 uppercase">{invoice.guest ? `${invoice.guest.firstName} ${invoice.guest.lastName || ''}` : 'Walk-in Guest'}</p>
            <p className="text-xs text-gray-500 font-bold">{invoice.guest?.mobile || 'No Mobile Number'}</p>
          </div>
        </div>
        <div className="space-y-3">
          <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Status</p>
          <div className="space-y-1">
            <p className="text-sm font-black text-gray-900 uppercase tracking-tighter">{invoice.invoiceStatus}</p>
            <p className="text-xs text-gray-400 font-bold">Managed at Front Desk</p>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="space-y-4">
        <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Transaction Items</p>
        <div className="border border-gray-100 rounded-2xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Item</th>
                <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Qty</th>
                <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Price</th>
                <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {invoice.items?.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50/30 transition-colors">
                  <td className="px-5 py-4">
                    <p className="text-sm font-bold text-gray-900 uppercase tracking-tight">{item.product?.name || item.description || 'Custom Item'}</p>
                    {item.hsnCode && <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest mt-0.5">HSN: {item.hsnCode}</p>}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className="text-xs font-black text-gray-600">x{item.qty}</span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className="text-xs font-medium text-gray-500">₹{item.unitPrice.toFixed(2)}</span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className="text-sm font-black text-gray-900">₹{item.totalAmount.toFixed(2)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals */}
      <div className="flex flex-col md:flex-row gap-6 justify-between pt-4">
        <div className="flex-1 space-y-4">
           <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Financial Breakdown</p>
           <div className="grid grid-cols-2 gap-4">
              <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/50">
                 <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest mb-1">Total Paid</p>
                 <p className="text-xl font-black text-emerald-600">₹{invoice.paidAmount?.toFixed(2) || '0.00'}</p>
              </div>
              <div className={`${invoice.dueAmount && invoice.dueAmount > 0 ? 'bg-orange-50/50 border-orange-100/50 text-orange-600' : 'bg-gray-50 text-gray-400 border-gray-100'} p-4 rounded-2xl border`}>
                 <p className="text-[10px] font-black uppercase tracking-widest mb-1">Balance Due</p>
                 <p className="text-xl font-black">₹{invoice.dueAmount?.toFixed(2) || '0.00'}</p>
              </div>
           </div>
        </div>

        <div className="w-full md:w-72 space-y-3 bg-gray-50 p-6 rounded-3xl border border-gray-100">
          <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
            <span>Subtotal</span>
            <span>₹{invoice.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
            <span>Tax (GST 5%)</span>
            <span>₹{invoice.taxAmount.toFixed(2)}</span>
          </div>
          {invoice.discountAmount > 0 && (
            <div className="flex justify-between text-xs font-bold text-emerald-500 uppercase tracking-widest">
              <span>Discount</span>
              <span>-₹{invoice.discountAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="border-t border-gray-200 pt-3 flex justify-between">
            <span className="text-sm font-black text-gray-900 uppercase tracking-wider">Net Amount</span>
            <span className="text-lg font-black text-pos-primary">₹{invoice.totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Settlement History */}
      {invoice.settlements && invoice.settlements.length > 0 && (
        <div className="space-y-4 pt-4">
          <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Settlement History</p>
          <div className="space-y-2">
            {invoice.settlements.map((st, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <DollarSign size={14} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-gray-900 uppercase tracking-tight">Payment Received</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">{new Date(st.settlementDate).toLocaleDateString()} {new Date(st.settlementDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-emerald-600">₹{st.paidAmount.toFixed(2)}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{st.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex gap-4 pt-6 border-t border-gray-100">
        <iframe ref={iframeRef} className="hidden" title="print-frame" />
        <Button 
          onClick={handlePrint}
          className="flex-1 bg-pos-primary hover:bg-red-700 text-white font-bold tracking-widest gap-2"
        >
          <Printer size={16} />
          PRINT INVOICE
        </Button>
        <Button variant="secondary" className="flex-1 font-bold tracking-widest gap-2">
          <Download size={16} />
          DOWNLOAD PDF
        </Button>
      </div>
    </div>
  );
}
