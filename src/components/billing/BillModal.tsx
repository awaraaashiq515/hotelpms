'use client';

import React, { useEffect } from 'react';
import { isValid, format } from 'date-fns';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { 
  X, Search, User, ReceiptText, 
  Printer, CreditCard, CheckCircle2,
  Banknote, QrCode, Smartphone, Star,
  MessageCircle
} from 'lucide-react';
import { printerService } from '@/lib/printer-service';

export interface BillData {
  orderNo: string;
  tableNo?: string;
  roomId?: string;
  tableId?: string;
  orderId?: string;
  items: {
    id: string;
    name: string;
    quantity: number;
    price: number;
    hsnCode?: string;
  }[];
  subtotal: number;
  tax: number;
  grandTotal: number;
  createdAt: string;
  membershipDiscount?: number;
  manualDiscount?: number;
  membershipCard?: {
    cardNumber: string;
    membershipPlan: { name: string };
  };
  taxLabel?: string;
  propertyId?: string;
}

interface BillModalProps {
  bill: BillData | null;
  onClose: () => void;
  onSettle?: (paymentModeId: string, guestId?: string, driverId?: string, membershipCardId?: string | null, manualDiscount?: number) => Promise<void>;
  paymentModes?: any[];
  customers?: any[];
  onAddCustomer?: (data: { firstName: string; lastName: string; mobile: string }) => Promise<any>;
  isProforma?: boolean;
  autoPrint?: boolean;
  guestId?: string;
}

export const BillModal: React.FC<BillModalProps> = ({ bill, onClose, isProforma = true, onSettle, paymentModes, customers = [], onAddCustomer, autoPrint = false, guestId }) => {
  const [isSettling, setIsSettling] = React.useState(false);
  const [selectedModeId, setSelectedModeId] = React.useState<string | null>(null);
  const [customerSearch, setCustomerSearch] = React.useState('');
  const [showAddCustomer, setShowAddCustomer] = React.useState(false);
  const [selectedGuestId, setSelectedGuestId] = React.useState<string>(guestId || '');

  const [showRating, setShowRating] = React.useState(false);
  const [rating, setRating] = React.useState(0);
  const [ratingComments, setRatingComments] = React.useState('');
  const [settledInvoiceId, setSettledInvoiceId] = React.useState<string | null>(null);
  const [sendWhatsApp, setSendWhatsApp] = React.useState(true);

  const [newCustFirst, setNewCustFirst] = React.useState('');
  const [newCustLast, setNewCustLast] = React.useState('');
  const [newCustMobile, setNewCustMobile] = React.useState('');
  const [isAddingCustomer, setIsAddingCustomer] = React.useState(false);

  const [membershipSearch, setMembershipSearch] = React.useState('');
  const [isValidatingMembership, setIsValidatingMembership] = React.useState(false);
  const [membershipCard, setMembershipCard] = React.useState<any>(bill?.membershipCard || null);
  const [membershipDiscount, setMembershipDiscount] = React.useState(bill?.membershipDiscount || 0);

  const [property, setProperty] = React.useState<any>(null);

  React.useEffect(() => {
    if (guestId) {
      setSelectedGuestId(guestId);
      const guest = customers.find(c => c.id === guestId);
      if (guest) {
        setCustomerSearch(`${guest.firstName} ${guest.lastName || ''}`);
        if (guest.mobile && !membershipCard) {
          validateMembership(null, guest.mobile);
        }
      }
    }
  }, [guestId, customers]);

  const validateMembership = async (cardNumber: string | null, mobile?: string) => {
    setIsValidatingMembership(true);
    try {
      const res = await fetch('/api/memberships/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardNumber, mobile }),
      });
      const data = await res.json();
      if (data.success) {
        setMembershipCard(data.data);
        setMembershipSearch('');
      } else if (cardNumber) {
        alert(data.message || 'Invalid membership card');
      }
    } catch (err) {
      console.error('Membership validation error:', err);
    } finally {
      setIsValidatingMembership(false);
    }
  };

  React.useEffect(() => {
    if (membershipCard && bill) {
      const { discountType, discountValue, minOrderValue } = membershipCard.membershipPlan;
      if (bill.subtotal >= minOrderValue) {
        if (discountType === 'PERCENTAGE') {
          setMembershipDiscount((bill.subtotal * discountValue) / 100);
        } else {
          setMembershipDiscount(discountValue);
        }
      } else {
        setMembershipDiscount(0);
      }
    } else {
      setMembershipDiscount(bill?.membershipDiscount || 0);
    }
  }, [membershipCard, bill?.subtotal]);

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

  React.useEffect(() => {
    if (autoPrint && property && bill) {
      handlePrint();
      onClose();
    }
  }, [autoPrint, property, !!bill]);

  const filteredCustomers = React.useMemo(() => {
    if (!customerSearch) return customers.slice(0, 5);
    const s = customerSearch.toLowerCase();
    return customers.filter(c => 
        (c.firstName + ' ' + c.lastName).toLowerCase().includes(s) || 
        c.mobile?.includes(s)
    ).slice(0, 10);
  }, [customers, customerSearch]);

  if (!bill) return null;

  const currentGrandTotal = bill.grandTotal || (bill.subtotal - membershipDiscount - (bill.manualDiscount || 0) + bill.tax);

  const handleSettle = async () => {
    if (!onSettle || !selectedModeId) return;
    setIsSettling(true);
    try {
      const response = await fetch('/api/orders/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              orderId: (bill as any).orderId,
              restaurantTableId: (bill as any).tableId,
              parkingSlotId: (bill as any).parkingSlotId,
              orderType: (bill as any).orderType || 'DINE_IN',
              paymentModeId: selectedModeId,
              guestId: selectedGuestId || undefined,
              totalAmount: currentGrandTotal,
              membershipCardId: membershipCard?.id || null,
              membershipDiscount: membershipDiscount,
              manualDiscount: bill.manualDiscount || 0,
              items: bill.items.map(i => ({ 
                id: i.id, 
                name: i.name, 
                quantity: i.quantity, 
                sellingPrice: i.price,
                isCombo: (i as any).isCombo || false
              })),
              sendWhatsApp: sendWhatsApp
          })
      });
      const result = await response.json();
      
      if (result.success) {
          setSettledInvoiceId(result.data.invoice.id);
          setShowRating(true);
      } else {
          alert(result.message || 'Settlement failed');
      }
    } catch (err) {
      console.error('Settlement failed', err);
    } finally {
      setIsSettling(false);
    }
  };

  const submitRating = async () => {
    if (!settledInvoiceId) return;
    try {
        await fetch(`/api/invoices/${settledInvoiceId}/rate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rating, comments: ratingComments })
        });
        handlePrint();
        onClose();
    } catch (err) {
        console.error('Rating failed', err);
        handlePrint();
        onClose();
    }
  };

  const handlePrint = async () => {
    if (property?.enableDirectPrinting) {
      try {
        const response = await fetch('/api/print', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bill, property })
        });
        const result = await response.json();
        if (result.success) {
          console.log(`Bill printed successfully via Serial Port`);
          return;
        } else {
          throw new Error(result.message);
        }
      } catch (e) {
        console.warn("Direct serial print failed, falling back to browser print:", e);
      }
    }

    const printWindow = window.open('', '_blank', 'width=450,height=700');
    if (!printWindow) return;

    const subtotalAmt = bill.subtotal || 0;
    const membershipDiscountAmt = bill.membershipDiscount || 0;
    const manualDiscountAmt = bill.manualDiscount || 0;
    const taxAmt = bill.tax || 0;
    const grandTotalAmt = bill.grandTotal || (subtotalAmt - membershipDiscountAmt - manualDiscountAmt + taxAmt);

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
              padding: 8mm 4mm; 
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
            .dashed-line { border-top: 1.5px dashed #000; margin: 2mm 0; width: 100%; height: 0; }
            .double-line { border-top: 2.5px solid #000; margin: 3mm 0; }
            table { width: 100%; border-collapse: collapse; margin: 2mm 0; }
            th { text-align: left; border-bottom: 1.5px dashed #000; padding: 1mm 0; font-weight: 900; font-size: 10px; }
            td { vertical-align: top; padding: 1.5mm 0; font-weight: 900; }
            .item-name { display: block; font-size: 10px; margin-bottom: 0.5mm; }
            .hsn { font-size: 8px; font-weight: normal; opacity: 0.8; }
            .total-row { display: flex; justify-content: space-between; margin-bottom: 1mm; font-weight: 900; font-size: 11px; }
            .grand-total { font-size: 16px; font-weight: 900; margin-top: 2mm; }
            .footer { margin-top: 10mm; font-size: 9px; opacity: 0.8; }
          </style>
        </head>
        <body onload="window.print(); setTimeout(() => window.close(), 1000);">
          <div class="text-center font-bold">
            <h1 style="font-size: 20px; margin-bottom: 1mm;">${property?.name || 'POS RESTAURANT'}</h1>
            ${property?.address ? `<p style="font-size: 9px; font-weight: normal; margin-bottom: 0.5mm;">${property.address}</p>` : ''}
            ${property?.phone ? `<p style="font-size: 9px; font-weight: normal; margin-bottom: 0.5mm;">PH: ${property.phone}</p>` : ''}
            ${property?.taxDetails ? `<p style="font-size: 9px; font-weight: 900; margin-bottom: 1mm;">GSTIN: ${property.taxDetails}</p>` : ''}
            <p style="font-size: 10px; margin-top: 1mm;">${(() => {
              const d = bill.createdAt ? new Date(bill.createdAt) : new Date();
              return format(isValid(d) ? d : new Date(), 'dd/MM/yyyy HH:mm');
            })()}</p>
          </div>

          <div class="double-line" style="margin-top: 4mm;"></div>
          <div class="text-center font-bold" style="font-size: 13px; letter-spacing: 2px;">${isProforma ? 'PROFORMA INVOICE' : 'TAX INVOICE'}</div>
          <div class="double-line" style="margin-bottom: 4mm;"></div>

          <div class="font-bold uppercase" style="font-size: 10px;">
            <div class="total-row"><span>BILL NO:</span> <span>${bill.orderNo}</span></div>
            <div class="total-row"><span>TABLE:</span> <span style="font-size: 14px;">${bill.tableNo || 'WALK-IN'}</span></div>
          </div>

          <div class="dashed-line" style="margin: 3mm 0;"></div>

          <table>
            <thead>
              <tr>
                <th style="width: 15%;">QTY</th>
                <th style="width: 55%;">DESCRIPTION</th>
                <th style="width: 30%; text-align: right;">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              ${bill.items.map((item: any) => `
                <tr>
                  <td>${item.quantity}</td>
                  <td class="uppercase">
                    ${item.name}
                    ${item.hsnCode ? `<br/><span class="hsn">HSN: ${item.hsnCode}</span>` : ''}
                  </td>
                  <td class="text-right">₹${(item.quantity * (item.price || 0)).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="dashed-line" style="margin: 3mm 0;"></div>

          <div class="font-bold uppercase" style="font-size: 10px;">
            <div class="total-row"><span>SUB-TOTAL:</span> <span>₹${subtotalAmt.toFixed(2)}</span></div>
            ${membershipDiscountAmt > 0 ? `<div class="total-row" style="color: #000;"><span>MEMBERSHIP DISCOUNT:</span> <span>-₹${membershipDiscountAmt.toFixed(2)}</span></div>` : ''}
            ${manualDiscountAmt > 0 ? `<div class="total-row" style="color: #000;"><span>DISCOUNT:</span> <span>-₹${manualDiscountAmt.toFixed(2)}</span></div>` : ''}
            <div class="total-row"><span>${bill.taxLabel || 'TAX'}:</span> <span>₹${taxAmt.toFixed(2)}</span></div>
            <div class="total-row" style="font-size: 8px; opacity: 0.6;"><span>(GST Breakdown)</span></div>
          </div>

          <div class="double-line"></div>
          <div class="grand-total font-bold" style="display: flex; justify-content: space-between;">
            <span>TOTAL PAYABLE:</span>
            <span>₹${grandTotalAmt.toFixed(2)}</span>
          </div>
          <div class="double-line"></div>

          <div class="text-center font-bold footer">
            <p style="font-size: 13px; margin-bottom: 2mm;">THANK YOU!</p>
            <p uppercase>VISIT AGAIN • HAVE A NICE DAY</p>
            <div style="border-top: 1px dotted #000; margin-top: 4mm; padding-top: 2mm; opacity: 0.5;">
               <p style="font-size: 8px;">POWERED BY ANTIGRAVITY POS</p>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleWhatsApp = () => {
    const guest = customers.find(c => c.id === selectedGuestId);
    let mobile = guest?.mobile || '';

    if (!mobile) {
      const input = window.prompt('Please enter WhatsApp number (with country code, e.g., 91...):');
      if (!input) return;
      mobile = input.replace(/\\D/g, ''); 
    }

    if (mobile.length === 10) mobile = '91' + mobile;

    const itemsText = bill.items.map(item => `${item.name} x ${item.quantity} = ₹${(item.quantity * (item.price || 0)).toFixed(0)}`).join('\\n');
    const message = `*Receipt from ${property?.name || 'POS'}*
Order No: ${bill.orderNo}
Table: ${bill.tableNo || 'Walk-in'}
---
${itemsText}
---
Subtotal: ₹${(bill.subtotal || 0).toFixed(0)}
Tax: ₹${(bill.tax || 0).toFixed(0)}
*Total: ₹${(bill.grandTotal || 0).toFixed(0)}*
---
Thank you! Visit again.`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${mobile}?text=${encodedMessage}`, '_blank');
  };

  const handleAddCustomer = async () => {
    if (!onAddCustomer) return;
    if (!newCustFirst || !newCustMobile) {
        alert('Please fill First Name and Mobile');
        return;
    }
    setIsAddingCustomer(true);
    try {
        const newGuest = await onAddCustomer({
            firstName: newCustFirst,
            lastName: newCustLast,
            mobile: newCustMobile
        });
        setSelectedGuestId(newGuest.id);
        setCustomerSearch(`${newGuest.firstName} ${newGuest.lastName || ''}`);
        setShowAddCustomer(false);
        setNewCustFirst('');
        setNewCustLast('');
        setNewCustMobile('');
    } catch (err: any) {
        alert(err.message);
    } finally {
        setIsAddingCustomer(false);
    }
  };

  return (
    <Modal isOpen={!!bill} onClose={onClose} title={isProforma ? "Order Settlement" : "Bill Details"} maxWidth="4xl">
      <div className="mx-auto text-slate-900 dark:text-slate-100">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          
          {/* LEFT: THE BILL (Visual) - 5 Cols */}
          <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-900/60 p-6 border border-slate-200/60 dark:border-slate-800 rounded-2xl overflow-hidden relative flex flex-col" id="printable-bill">
            <div className="absolute top-5 right-5 flex gap-2 print:hidden z-20">
              <button 
                onClick={() => handleWhatsApp()} 
                className="p-2 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-full transition-colors text-emerald-600 dark:text-emerald-400"
                title="Send via WhatsApp"
              >
                <MessageCircle size={15} />
              </button>
              <button 
                onClick={() => handlePrint()} 
                className="p-2 bg-slate-200/50 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-705 rounded-full transition-colors text-slate-600 dark:text-slate-400"
                title="Print Bill"
              >
                <Printer size={15} />
              </button>
            </div>
            
            <div className="text-center mb-6 mt-2 relative z-10">
              <h2 className="text-xl font-bold uppercase tracking-tight text-slate-800 dark:text-slate-100 leading-none">
                {property?.name || 'POS RESTAURANT'}
              </h2>
              {property?.address && (
                <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-tight mt-1.5 max-w-[200px] mx-auto leading-relaxed">
                    {property.address}
                </p>
              )}
              <div className="w-12 h-1 bg-indigo-600 dark:bg-indigo-500/80 mx-auto mt-4 rounded-full"></div>
            </div>

            <div className="grid grid-cols-1 gap-2.5 mb-6 relative z-10">
              <div className="flex justify-between items-end border-b border-slate-200/60 dark:border-slate-800/80 pb-2">
                <span className="text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider">Order ID</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">{bill.orderNo}</span>
              </div>
              <div className="flex justify-between items-end border-b border-slate-200/60 dark:border-slate-800/80 pb-2">
                <span className="text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider">Table Name</span>
                <span className="font-semibold text-indigo-600 dark:text-indigo-400 text-xs uppercase">{bill.tableNo ? `Table ${bill.tableNo}` : 'Walk-in'}</span>
              </div>
              <div className="flex justify-between items-end border-b border-slate-200/60 dark:border-slate-800/80 pb-2">
                <span className="text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider">Timestamp</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                  {(() => {
                    const d = bill.createdAt ? new Date(bill.createdAt) : new Date();
                    return format(isValid(d) ? d : new Date(), 'dd/MM/yyyy HH:mm');
                  })()}
                </span>
              </div>
            </div>

            <div className="mb-4 relative z-10 flex-1 flex flex-col min-h-[220px]">
              <div className="grid grid-cols-[1fr_80px_70px] gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2.5 border-b border-slate-200/60 dark:border-slate-800/85 pb-2 px-1">
                <span>Description</span>
                <span className="text-center">Qty × Price</span>
                <span className="text-right">Total</span>
              </div>
              <div className="space-y-3 overflow-y-auto no-scrollbar max-h-[350px] px-1">
                {bill.items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr_80px_70px] gap-2 items-start py-0.5 group">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-350 leading-tight uppercase group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{item.name}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-450 tabular-nums">{item.quantity} × {(item.price || 0).toFixed(0)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 tabular-nums">₹{(item.quantity * (item.price || 0)).toFixed(0)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-dashed border-slate-200 dark:border-slate-800 pt-4 space-y-1.5 relative z-10 mt-auto">
              <div className="flex justify-between text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <span>Subtotal</span>
                <span className="text-slate-800 dark:text-slate-200 font-semibold">₹{(bill.subtotal || 0).toFixed(0)}</span>
              </div>
              {bill.membershipDiscount && bill.membershipDiscount > 0 ? (
                <div className="flex justify-between text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  <span>Membership Discount</span>
                  <span className="font-semibold">-₹{membershipDiscount.toFixed(0)}</span>
                </div>
              ) : null}
              {bill.manualDiscount && bill.manualDiscount > 0 ? (
                <div className="flex justify-between text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  <span>Discount</span>
                  <span className="font-semibold">-₹{(bill.manualDiscount || 0).toFixed(0)}</span>
                </div>
              ) : null}
              <div className="flex justify-between text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-200/60 dark:border-slate-800/80">
                <span>{bill.taxLabel || 'Tax'}</span>
                <span className="text-slate-800 dark:text-slate-200 font-semibold">₹{(bill.tax || 0).toFixed(0)}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-900 dark:bg-slate-950/80 text-white p-4 rounded-xl mt-3 shadow-md print:border-t-2 print:border-black print:bg-white print:text-black print:rounded-none">
                <div>
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-0.5 print:text-[8px] print:font-bold">Payable</span>
                    <span className="text-xl font-bold text-white leading-none print:text-black">₹{currentGrandTotal.toFixed(0)}</span>
                </div>
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center border border-white/5 print:hidden">
                    <ReceiptText size={16} className="text-indigo-400" />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 flex flex-col gap-5 print:hidden">
            
            {isProforma && onSettle && (
              <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm overflow-hidden flex flex-col">
                <div className="p-3.5 border-b border-slate-100 dark:border-slate-800/80 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/20">
                  <div className="flex items-center gap-2">
                    <User size={15} className="text-slate-400 dark:text-slate-500" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Select Customer</h4>
                  </div>
                  {!showAddCustomer && (
                    <button 
                      type="button" 
                      onClick={() => setShowAddCustomer(true)}
                      className="px-2.5 py-1 bg-white dark:bg-slate-900 text-[10px] font-bold uppercase text-indigo-600 dark:text-indigo-400 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-all shadow-sm active:scale-95"
                    >
                      + New
                    </button>
                  )}
                </div>

                <div className="p-5">
                  {showAddCustomer ? (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">New Guest Profile</span>
                        <button type="button" onClick={() => setShowAddCustomer(false)} className="text-slate-400 hover:text-rose-500">
                          <X size={16} />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <input 
                          placeholder="First Name" 
                          value={newCustFirst} 
                          onChange={e => setNewCustFirst(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/85 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500/50 dark:focus:border-indigo-500/50 focus:bg-white dark:focus:bg-slate-950 transition-all uppercase"
                        />
                        <input 
                          placeholder="Last Name" 
                          value={newCustLast} 
                          onChange={e => setNewCustLast(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/85 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500/50 dark:focus:border-indigo-500/50 focus:bg-white dark:focus:bg-slate-950 transition-all uppercase"
                        />
                      </div>
                      <input 
                        placeholder="Mobile Contact" 
                        value={newCustMobile} 
                        onChange={e => setNewCustMobile(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/85 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500/50 dark:focus:border-indigo-500/50 focus:bg-white dark:focus:bg-slate-950 transition-all mb-3"
                      />
                      <Button 
                        loading={isAddingCustomer}
                        onClick={handleAddCustomer}
                        className="w-full h-10 bg-indigo-600 text-white font-semibold uppercase text-xs tracking-wider rounded-xl shadow-md"
                      >
                        Create Profile
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="relative group">
                        <input 
                          type="text"
                          placeholder="Find customer..."
                          value={customerSearch}
                          onChange={(e) => setCustomerSearch(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200/65 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs font-medium text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500/50 dark:focus:border-indigo-500/50 focus:bg-white dark:focus:bg-slate-950 transition-all uppercase"
                        />
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[160px] overflow-y-auto no-scrollbar">
                        {filteredCustomers.map(c => (
                          <button 
                            key={c.id} 
                            type="button"
                            onClick={() => {
                              setSelectedGuestId(selectedGuestId === c.id ? '' : c.id);
                              setCustomerSearch(selectedGuestId === c.id ? '' : `${c.firstName} ${c.lastName || ''}`);
                            }}
                            className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                              selectedGuestId === c.id 
                              ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 shadow-sm' 
                              : 'border-transparent bg-slate-50 dark:bg-slate-950/40 hover:border-slate-200 dark:hover:border-slate-800'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                              selectedGuestId === c.id ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-slate-800'
                            }`}>
                              {c.firstName[0]}{c.lastName?.[0]}
                            </div>
                            <div className="text-left min-w-0">
                                <p className="text-xs font-semibold truncate uppercase text-slate-800 dark:text-slate-200 leading-none mb-1">{c.firstName} {c.lastName}</p>
                                <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500">+{c.mobile}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {isProforma && onSettle && (
              <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 p-4">
                 <div className="flex items-center gap-2 mb-3">
                    <Star size={15} className="text-slate-400 dark:text-slate-505" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Promo & Membership</h4>
                  </div>

                  {membershipCard ? (
                    <div 
                      className="flex items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-950/20"
                      onClick={() => { setMembershipCard(null); setMembershipDiscount(0); }}
                    >
                      <div className="flex items-center gap-2.5">
                         <Star size={14} className="text-emerald-500" />
                         <div>
                           <span className="text-xs font-bold uppercase text-emerald-700 dark:text-emerald-400 tracking-wide block leading-none">{membershipCard.membershipPlan.name}</span>
                           <span className="text-[9px] font-semibold text-emerald-550 dark:text-emerald-500 uppercase tracking-tighter mt-1 block">Card: {membershipCard.cardNumber}</span>
                         </div>
                      </div>
                      <div className="flex items-center gap-2">
                         <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">-{membershipCard.membershipPlan.discountValue}{membershipCard.membershipPlan.discountType === 'PERCENTAGE' ? '%' : ''}</span>
                         <X size={14} className="text-rose-450 cursor-pointer" />
                      </div>
                    </div>
                  ) : (
                    <div className="relative flex items-center gap-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800 rounded-xl px-3 py-2 group focus-within:bg-white dark:focus-within:bg-slate-955 focus-within:border-indigo-500/30 transition-all">
                       <QrCode className="text-slate-400 dark:text-slate-500" size={14} />
                       <input 
                         type="text"
                         placeholder="Enter Membership ID / Phone..."
                         value={membershipSearch}
                         onChange={(e) => setMembershipSearch(e.target.value)}
                         onKeyDown={(e) => e.key === 'Enter' && membershipSearch.trim() && validateMembership(membershipSearch.trim())}
                         className="w-full bg-transparent text-xs font-medium outline-none placeholder:text-slate-400 text-slate-800 dark:text-slate-200 uppercase"
                       />
                       {isValidatingMembership && <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />}
                       {!isValidatingMembership && membershipSearch.trim() && (
                          <button onClick={() => validateMembership(membershipSearch.trim())} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700">Apply</button>
                       )}
                    </div>
                  )}
              </div>
            )}


            {isProforma && onSettle && (
              <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 p-4 flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <CreditCard size={15} className="text-slate-400 dark:text-slate-500" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Payment Method</h4>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                  {paymentModes?.map(mode => {
                    const isSelected = selectedModeId === mode.id;
                    let Icon = Banknote;
                    if (mode.name.toLowerCase().includes('card')) Icon = CreditCard;
                    if (mode.name.toLowerCase().includes('upi') || mode.name.toLowerCase().includes('qr')) Icon = QrCode;
                    if (mode.name.toLowerCase().includes('wallet')) Icon = Smartphone;

                    return (
                      <button 
                        key={mode.id} 
                        type="button"
                        onClick={() => setSelectedModeId(isSelected ? null : mode.id)}
                        className={`p-2 rounded-xl border transition-all flex flex-col items-center justify-center gap-1.5 ${
                          isSelected 
                          ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                          : 'border-slate-200/60 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 hover:bg-slate-100 dark:hover:bg-slate-850/80 text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        <Icon size={16} />
                        <span className="text-[10px] font-semibold uppercase tracking-wider">{mode.name}</span>
                      </button>
                    );
                  })}

                  <button 
                    type="button"
                    onClick={() => setSelectedModeId(selectedModeId === 'PAY_LATER' ? null : 'PAY_LATER')}
                    className={`p-2 rounded-xl border transition-all flex flex-col items-center justify-center gap-1.5 ${
                      selectedModeId === 'PAY_LATER'
                      ? 'border-orange-500 dark:border-orange-500/80 bg-orange-50/30 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 shadow-sm' 
                      : 'border-slate-200/60 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 hover:bg-slate-100 dark:hover:bg-slate-850/80 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <span className="text-xs">⏳</span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider">Pay Later</span>
                  </button>
                </div>

                <div className="flex items-center gap-3 mb-4 bg-slate-50 dark:bg-slate-950/45 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/80">
                    <button 
                      type="button"
                      onClick={() => setSendWhatsApp(!sendWhatsApp)}
                      className={`relative w-9 h-5 rounded-full transition-all duration-300 ${sendWhatsApp ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                    >
                      <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${sendWhatsApp ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-slate-750 dark:text-slate-300 tracking-wide mb-0.5">WhatsApp Receipt</span>
                      <span className="text-[9px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">Send automated message</span>
                    </div>
                </div>

                <div className="mt-auto">
                  <button 
                    disabled={!selectedModeId || isSettling}
                    onClick={handleSettle}
                    className={`w-full h-13 rounded-xl transition-all flex items-center justify-between border shadow-sm active:scale-[0.98] ${
                      selectedModeId 
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white font-semibold border-indigo-700/20 cursor-pointer' 
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 font-semibold border-slate-200 dark:border-slate-800/60 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 pl-4">
                       {isSettling ? (
                          <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2500/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                       ) : (
                          <Printer size={16} />
                       )}
                       <span className="text-xs font-bold tracking-wider uppercase">Save & Print Bill</span>
                    </div>
                    <div className="pr-4 flex items-center gap-1.5">
                       <span className="text-[9px] uppercase tracking-wider opacity-60">Payable:</span>
                       <span className="text-sm font-bold">₹{currentGrandTotal.toFixed(0)}</span>
                    </div>
                  </button>
                  
                  <div className="flex justify-center mt-3">
                    <button onClick={onClose} className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 transition-colors py-1">
                        Cancel & Return
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showRating && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6 border border-slate-200/60 dark:border-slate-800 shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
            <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 size={30} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tight mb-1">Order Settled!</h3>
            <p className="text-slate-400 dark:text-slate-500 font-medium text-xs mb-6">How was the customer's experience?</p>
            
            <div className="flex gap-2 mb-6">
              {[1, 2, 3, 4, 5].map(star => (
                <button 
                  key={star} 
                  onClick={() => setRating(star)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                    rating >= star ? 'bg-amber-400 text-white shadow-md shadow-amber-200' : 'bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Star size={20} fill={rating >= star ? 'currentColor' : 'none'} />
                </button>
              ))}
            </div>

            <textarea 
              placeholder="Any feedback or comments? (Optional)"
              value={ratingComments}
              onChange={e => setRatingComments(e.target.value)}
              className="w-full bg-slate-55 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800 rounded-xl px-4 py-3 text-xs font-medium text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500/50 dark:focus:border-indigo-500/50 focus:bg-white dark:focus:bg-slate-950 transition-all min-h-[80px] mb-6"
            />

            <div className="flex flex-col gap-2.5 w-full">
              <Button 
                onClick={submitRating}
                className="w-full h-11 bg-indigo-600 text-white font-semibold text-xs tracking-wider rounded-xl shadow-md"
              >
                Submit & Print Bill
              </Button>
              <Button 
                onClick={handleWhatsApp}
                className="w-full h-11 bg-emerald-600 text-white font-semibold text-xs tracking-wider rounded-xl shadow-md flex items-center justify-center gap-2"
              >
                <MessageCircle size={16} />
                Send via WhatsApp
              </Button>
              <button 
                onClick={() => { handlePrint(); onClose(); }}
                className="text-xs font-semibold text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors py-1"
              >
                Skip Rating
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};
