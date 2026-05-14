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
      <div className="mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          
          {/* LEFT: THE BILL (Visual) - 5 Cols */}
          <div className="lg:col-span-5 bg-white p-8 border border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[2.5rem] overflow-hidden relative flex flex-col" id="printable-bill">
            <div className="absolute top-6 right-6 flex gap-2 print:hidden z-20">
              <button 
                onClick={() => handleWhatsApp()} 
                className="p-2 bg-emerald-50 hover:bg-emerald-100 rounded-full transition-colors text-emerald-500 hover:text-emerald-700"
                title="Send via WhatsApp"
              >
                <MessageCircle size={16} />
              </button>
              <button 
                onClick={() => handlePrint()} 
                className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-900"
                title="Print Bill"
              >
                <Printer size={16} />
              </button>
            </div>
            
            <div className="text-center mb-10 mt-4 relative z-10">
              <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900 leading-none">
                {property?.name || 'POS RESTAURANT'}
              </h2>
              {property?.address && (
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight mt-2 max-w-[220px] mx-auto leading-relaxed">
                    {property.address}
                </p>
              )}
              <div className="w-16 h-1.5 bg-indigo-600 mx-auto mt-8 rounded-full shadow-[0_0_15px_rgba(79,70,229,0.3)]"></div>
            </div>

            <div className="grid grid-cols-1 gap-4 mb-10 relative z-10">
              <div className="flex justify-between items-end border-b border-slate-100 pb-3">
                <span className="text-slate-500 font-black uppercase text-[10px] tracking-widest">Order ID</span>
                <span className="font-black text-slate-900 text-sm tracking-tight">{bill.orderNo}</span>
              </div>
              <div className="flex justify-between items-end border-b border-slate-100 pb-3">
                <span className="text-slate-500 font-black uppercase text-[10px] tracking-widest">Table Name</span>
                <span className="font-black text-indigo-600 text-sm uppercase">{bill.tableNo ? `Table ${bill.tableNo}` : 'Walk-in'}</span>
              </div>
              <div className="flex justify-between items-end border-b border-slate-100 pb-3">
                <span className="text-slate-500 font-black uppercase text-[10px] tracking-widest">Timestamp</span>
                <span className="font-black text-slate-900 text-xs">
                  {(() => {
                    const d = bill.createdAt ? new Date(bill.createdAt) : new Date();
                    return format(isValid(d) ? d : new Date(), 'dd/MM/yyyy HH:mm');
                  })()}
                </span>
              </div>
            </div>

            <div className="mb-4 relative z-10 flex-1 flex flex-col min-h-[220px]">
              <div className="grid grid-cols-[1fr_85px_75px] gap-2 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-3 border-b-2 border-slate-100 pb-3 px-1">
                <span>Description</span>
                <span className="text-center">Qty × Price</span>
                <span className="text-right">Total</span>
              </div>
              <div className="space-y-4 overflow-y-auto no-scrollbar max-h-[350px] px-1">
                {bill.items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr_85px_75px] gap-2 items-start py-0.5 group">
                    <div className="min-w-0">
                      <p className="text-[12px] font-black text-slate-900 leading-tight uppercase group-hover:text-indigo-600 transition-colors">{item.name}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] font-bold text-slate-400 tabular-nums">{item.quantity} × {(item.price || 0).toFixed(0)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[12px] font-black text-slate-900 tabular-nums tracking-tighter">₹{(item.quantity * (item.price || 0)).toFixed(0)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-dashed border-slate-200 pt-6 space-y-2 relative z-10 mt-auto">
              <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <span>Subtotal</span>
                <span className="text-slate-900 font-black">₹{(bill.subtotal || 0).toFixed(0)}</span>
              </div>
              {bill.membershipDiscount && bill.membershipDiscount > 0 ? (
                <div className="flex justify-between text-[10px] font-black text-emerald-600 uppercase tracking-widest pb-1">
                  <span>Membership Discount</span>
                  <span className="font-black">-₹{membershipDiscount.toFixed(0)}</span>
                </div>
              ) : null}
              {bill.manualDiscount && bill.manualDiscount > 0 ? (
                <div className="flex justify-between text-[10px] font-black text-blue-600 uppercase tracking-widest pb-1">
                  <span>Discount</span>
                  <span className="font-black">-₹{(bill.manualDiscount || 0).toFixed(0)}</span>
                </div>
              ) : null}
              <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest pb-3 border-b border-slate-100">
                <span>{bill.taxLabel || 'Tax'}</span>
                <span className="text-slate-900 font-black">₹{(bill.tax || 0).toFixed(0)}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-900 text-white p-5 rounded-2xl mt-4 shadow-xl print:border-t-2 print:border-black print:bg-white print:text-black print:rounded-none">
                <div>
                    <span className="text-[7px] font-black uppercase tracking-[0.2em] opacity-40 block mb-0.5 print:text-[8px] print:font-bold">Payable</span>
                    <span className="text-2xl font-black text-white leading-none print:text-black">₹{currentGrandTotal.toFixed(0)}</span>
                </div>
                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center border border-white/5 print:hidden">
                    <ReceiptText size={18} className="text-indigo-400" />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 flex flex-col gap-5 print:hidden">
            
            {isProforma && onSettle && (
              <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden flex flex-col">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-gray-400" />
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-700">Select Customer</h4>
                  </div>
                  {!showAddCustomer && (
                    <button 
                      type="button" 
                      onClick={() => setShowAddCustomer(true)}
                      className="px-3 py-1.5 bg-white text-[9px] font-black uppercase text-indigo-600 rounded-lg border border-indigo-50 hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-95"
                    >
                      + New
                    </button>
                  )}
                </div>

                <div className="p-6">
                  {showAddCustomer ? (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-[10px] font-black uppercase text-indigo-600 tracking-widest">New Guest Profile</span>
                        <button type="button" onClick={() => setShowAddCustomer(false)} className="text-gray-300 hover:text-red-500">
                          <X size={18} />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <input 
                          placeholder="First Name" 
                          value={newCustFirst} 
                          onChange={e => setNewCustFirst(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-black outline-none focus:border-indigo-500 focus:bg-white transition-all uppercase"
                        />
                        <input 
                          placeholder="Last Name" 
                          value={newCustLast} 
                          onChange={e => setNewCustLast(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-black outline-none focus:border-indigo-500 focus:bg-white transition-all uppercase"
                        />
                      </div>
                      <input 
                        placeholder="Mobile Contact" 
                        value={newCustMobile} 
                        onChange={e => setNewCustMobile(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-black outline-none focus:border-indigo-500 focus:bg-white transition-all mb-4"
                      />
                      <Button 
                        loading={isAddingCustomer}
                        onClick={handleAddCustomer}
                        className="w-full h-12 bg-indigo-600 text-white font-black uppercase text-[10px] tracking-widest rounded-xl shadow-lg shadow-indigo-50"
                      >
                        Create Profile
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="relative group">
                        <input 
                          type="text"
                          placeholder="Find customer..."
                          value={customerSearch}
                          onChange={(e) => setCustomerSearch(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-6 py-4 text-sm font-black outline-none focus:border-indigo-500 focus:bg-white transition-all uppercase"
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
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
                            className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                              selectedGuestId === c.id 
                              ? 'border-indigo-600 bg-indigo-50/50 shadow-sm' 
                              : 'border-transparent bg-gray-50 group hover:border-indigo-100'
                            }`}
                          >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-[10px] ${
                              selectedGuestId === c.id ? 'bg-indigo-600 text-white' : 'bg-white text-gray-400 border border-gray-100'
                            }`}>
                              {c.firstName[0]}{c.lastName?.[0]}
                            </div>
                            <div className="text-left min-w-0">
                                <p className="text-[12px] font-black truncate uppercase text-gray-900 leading-none mb-1">{c.firstName} {c.lastName}</p>
                                <p className="text-[10px] font-bold text-gray-400 opacity-60">+{c.mobile}</p>
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
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                 <div className="flex items-center gap-2 mb-4">
                    <Star size={16} className="text-gray-400" />
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-700">Promo & Membership</h4>
                  </div>

                  {membershipCard ? (
                    <div 
                      className="flex items-center justify-between gap-3 rounded-xl px-4 py-3 border border-emerald-100 bg-emerald-50/50"
                      onClick={() => { setMembershipCard(null); setMembershipDiscount(0); }}
                    >
                      <div className="flex items-center gap-2.5">
                         <Star size={14} className="text-emerald-500" />
                         <div>
                           <span className="text-[11px] font-black uppercase text-emerald-600 tracking-wider block leading-none">{membershipCard.membershipPlan.name}</span>
                           <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-tighter">Card: {membershipCard.cardNumber}</span>
                         </div>
                      </div>
                      <div className="flex items-center gap-2">
                         <span className="text-[12px] font-black text-emerald-600">-{membershipCard.membershipPlan.discountValue}{membershipCard.membershipPlan.discountType === 'PERCENTAGE' ? '%' : ''}</span>
                         <X size={14} className="text-rose-400 cursor-pointer" />
                      </div>
                    </div>
                  ) : (
                    <div className="relative flex items-center gap-3 bg-gray-50 border border-gray-100 px-4 py-2.5 rounded-xl group focus-within:bg-white focus-within:border-indigo-500/30 transition-all">
                       <QrCode className="text-gray-300" size={16} />
                       <input 
                         type="text"
                         placeholder="Enter Membership ID / Phone..."
                         value={membershipSearch}
                         onChange={(e) => setMembershipSearch(e.target.value)}
                         onKeyDown={(e) => e.key === 'Enter' && membershipSearch.trim() && validateMembership(membershipSearch.trim())}
                         className="w-full bg-transparent text-[11px] font-black outline-none placeholder:text-gray-300 uppercase"
                       />
                       {isValidatingMembership && <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />}
                       {!isValidatingMembership && membershipSearch.trim() && (
                          <button onClick={() => validateMembership(membershipSearch.trim())} className="text-[10px] font-black uppercase text-indigo-600">Apply</button>
                       )}
                    </div>
                  )}
              </div>
            )}

            {isProforma && onSettle && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5 flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard size={16} className="text-gray-400" />
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-700">Payment Method</h4>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
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
                        className={`p-3 rounded-xl border transition-all flex flex-col items-center justify-center gap-2 ${
                          isSelected 
                          ? 'border-indigo-600 bg-indigo-50/30 text-indigo-600' 
                          : 'border-gray-100 bg-gray-50/50 hover:bg-gray-100 text-gray-400'
                        }`}
                      >
                        <Icon size={18} />
                        <span className="text-[9px] font-black uppercase tracking-widest">{mode.name}</span>
                      </button>
                    );
                  })}

                  <button 
                    type="button"
                    onClick={() => setSelectedModeId(selectedModeId === 'PAY_LATER' ? null : 'PAY_LATER')}
                    className={`p-3 rounded-xl border transition-all flex flex-col items-center justify-center gap-2 ${
                      selectedModeId === 'PAY_LATER'
                      ? 'border-orange-500 bg-orange-50/30 text-orange-600' 
                      : 'border-gray-100 bg-gray-50/50 hover:bg-gray-100 text-gray-400'
                    }`}
                  >
                    <span className="text-base">⏳</span>
                    <span className="text-[9px] font-black uppercase tracking-widest">Pay Later</span>
                  </button>
                </div>

                <div className="flex items-center gap-3 mb-6 bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <button 
                      type="button"
                      onClick={() => setSendWhatsApp(!sendWhatsApp)}
                      className={`relative w-10 h-5 rounded-full transition-all duration-300 ${sendWhatsApp ? 'bg-emerald-500' : 'bg-gray-300'}`}
                    >
                      <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${sendWhatsApp ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase text-gray-700 tracking-tight leading-none mb-1">WhatsApp Receipt</span>
                      <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Send automated message</span>
                    </div>
                </div>

                <div className="mt-auto">
                  <Button 
                    loading={isSettling}
                    disabled={!selectedModeId}
                    onClick={handleSettle}
                    className={`w-full h-16 text-white font-black uppercase rounded-2xl transition-all flex items-center justify-between overflow-hidden shadow-xl active:scale-[0.98] ${
                      selectedModeId 
                      ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100' 
                      : 'bg-gray-50 border border-gray-100 cursor-not-allowed opacity-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 pl-6">
                       <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${selectedModeId ? 'bg-white/20' : 'bg-gray-200'}`}>
                         <Printer size={18} className={selectedModeId ? 'text-white' : 'text-gray-400'} />
                       </div>
                       <div className="text-left">
                         <p className="text-[7px] uppercase tracking-[0.2em] opacity-60">Complete</p>
                         <p className="text-sm font-black tracking-tight">Save & Print</p>
                       </div>
                    </div>
                    <div className={`h-full flex flex-col justify-center items-end px-6 border-l transition-colors ${selectedModeId ? 'bg-black/10 border-white/10' : 'bg-gray-50 border-gray-100'}`}>
                       <span className={`text-[7px] uppercase tracking-widest ${selectedModeId ? 'text-white/40' : 'text-gray-400'}`}>Payable</span>
                       <span className={`text-xl font-black ${selectedModeId ? 'text-white' : 'text-gray-300'}`}>₹{currentGrandTotal.toFixed(0)}</span>
                    </div>
                  </Button>
                  
                  <div className="flex justify-center mt-3">
                    <button onClick={onClose} className="text-[8px] font-black uppercase tracking-[0.3em] text-gray-300 hover:text-red-500 transition-colors py-1 px-4">
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
          <div className="bg-white rounded-[3rem] w-full max-w-md p-10 shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 size={40} />
            </div>
            <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter mb-2">Order Settled!</h3>
            <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mb-8">How was the customer's experience?</p>
            
            <div className="flex gap-2 mb-8">
              {[1, 2, 3, 4, 5].map(star => (
                <button 
                  key={star} 
                  onClick={() => setRating(star)}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                    rating >= star ? 'bg-amber-400 text-white shadow-lg shadow-amber-200' : 'bg-gray-50 text-gray-300 hover:bg-gray-100'
                  }`}
                >
                  <Star size={24} fill={rating >= star ? 'currentColor' : 'none'} />
                </button>
              ))}
            </div>

            <textarea 
              placeholder="Any feedback or comments? (Optional)"
              value={ratingComments}
              onChange={e => setRatingComments(e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold text-gray-900 outline-none focus:border-indigo-500 focus:bg-white transition-all min-h-[100px] mb-8"
            />

            <div className="flex flex-col gap-3 w-full">
              <Button 
                onClick={submitRating}
                className="w-full h-14 bg-indigo-600 text-white font-black uppercase rounded-2xl shadow-xl shadow-indigo-100"
              >
                Submit & Print Bill
              </Button>
              <Button 
                onClick={handleWhatsApp}
                className="w-full h-14 bg-emerald-600 text-white font-black uppercase rounded-2xl shadow-xl shadow-emerald-100 flex items-center justify-center gap-2"
              >
                <MessageCircle size={20} />
                Send via WhatsApp
              </Button>
              <button 
                onClick={() => { handlePrint(); onClose(); }}
                className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-indigo-600 transition-colors py-2"
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
