'use client';

import React, { useEffect } from 'react';
import { isValid, format } from 'date-fns';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { 
  X, Search, User, ReceiptText, 
  Printer, CreditCard, CheckCircle2,
  Banknote, QrCode, Smartphone, Star,
  MessageCircle, Gift, Tag, Save
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
    replacedFrom?: string;
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
  staffMemberId?: string;
  driverId?: string;
  guestCount?: number;
}

interface BillModalProps {
  bill: BillData | null;
  onClose: (settled?: boolean) => void;
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

  // CRM Loyalty Points & Coupon States
  const [redeemPointsInput, setRedeemPointsInput] = React.useState<number>(0);
  const [couponCodeInput, setCouponCodeInput] = React.useState('');
  const [appliedCoupon, setAppliedCoupon] = React.useState<any>(null);
  const [couponError, setCouponError] = React.useState('');
  const [isValidatingCoupon, setIsValidatingCoupon] = React.useState(false);

  // Room Charging States
  const [occupiedRooms, setOccupiedRooms] = React.useState<any[]>([]);
  const [loadingRooms, setLoadingRooms] = React.useState(false);
  const [selectedRoomIdState, setSelectedRoomIdState] = React.useState<string>('');

  React.useEffect(() => {
    if (selectedModeId === 'POST_TO_ROOM' || bill?.roomId) {
      setLoadingRooms(true);
      fetch('/api/hotel/bookings')
        .then(r => r.json())
        .then(d => {
          if (d.success && d.data) {
            const active = d.data.filter((b: any) => b.status === 'CHECKED_IN' && b.rooms?.[0]?.room);
            setOccupiedRooms(active);
          }
        })
        .catch(err => console.error(err))
        .finally(() => setLoadingRooms(false));
    }
  }, [selectedModeId, bill?.roomId]);

  React.useEffect(() => {
    if (bill?.roomId) {
      setSelectedRoomIdState(bill.roomId);
    } else {
      setSelectedRoomIdState('');
    }
  }, [bill?.roomId]);

  const handleApplyCoupon = async () => {
    if (!couponCodeInput) return;
    setIsValidatingCoupon(true);
    setCouponError('');
    try {
      const res = await fetch('/api/marketing/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponCodeInput.trim().toUpperCase(),
          guestId: selectedGuestId || undefined,
          orderTotal: bill?.subtotal || 0
        })
      });
      const result = await res.json();
      if (result.success) {
        setAppliedCoupon(result.data);
      } else {
        setCouponError(result.message || 'Invalid coupon code');
      }
    } catch (err) {
      console.error(err);
      setCouponError('Error validating coupon');
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCodeInput('');
    setCouponError('');
  };

  // Reset coupon & loyalty inputs when active guest changes
  React.useEffect(() => {
    setRedeemPointsInput(0);
    setAppliedCoupon(null);
    setCouponCodeInput('');
    setCouponError('');
  }, [selectedGuestId]);

  const [membershipSearch, setMembershipSearch] = React.useState('');
  const [isValidatingMembership, setIsValidatingMembership] = React.useState(false);
  const [membershipCard, setMembershipCard] = React.useState<any>(bill?.membershipCard || null);
  const [membershipDiscount, setMembershipDiscount] = React.useState(bill?.membershipDiscount || 0);

  const [property, setProperty] = React.useState<any>(null);
  const [printers, setPrinters] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (property?.id) {
      fetch(`/api/settings/printers?propertyId=${property.id}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setPrinters(data);
          }
        })
        .catch(err => console.error('Failed to fetch printers:', err));
    }
  }, [property?.id]);

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

  // Reset all modal/settlement states and synchronize customer data whenever the modal opens or the active bill changes
  React.useEffect(() => {
    if (bill) {
      // 1. Settlement Rating states
      setShowRating(false);
      setRating(0);
      setRatingComments('');
      setSettledInvoiceId(null);
      
      // 2. Payment modes & active flags
      setSelectedModeId(null);
      setIsSettling(false);
      setSendWhatsApp(true);
      
      // 3. Customer states
      setShowAddCustomer(false);
      setNewCustFirst('');
      setNewCustLast('');
      setNewCustMobile('');
      setIsAddingCustomer(false);
      
      const activeGuestId = guestId || '';
      setSelectedGuestId(activeGuestId);
      if (activeGuestId) {
        const guest = customers.find(c => c.id === activeGuestId);
        if (guest) {
          setCustomerSearch(`${guest.firstName} ${guest.lastName || ''}`);
          if (guest.mobile && !membershipCard) {
            validateMembership(null, guest.mobile);
          }
        } else {
          setCustomerSearch('');
        }
      } else {
        setCustomerSearch('');
      }
      
      // 4. CRM & Membership states
      setRedeemPointsInput(0);
      setCouponCodeInput('');
      setAppliedCoupon(null);
      setCouponError('');
      setIsValidatingCoupon(false);
      setMembershipSearch('');
      setIsValidatingMembership(false);
      setMembershipCard(bill?.membershipCard || null);
      setMembershipDiscount(bill?.membershipDiscount || 0);
    }
  }, [bill?.orderId, bill?.orderNo, guestId, customers]);

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
      onClose(!!settledInvoiceId);
    }
  }, [autoPrint, property, !!bill]);

  React.useEffect(() => {
    if (!bill) {
      setSettledInvoiceId(null);
      setShowRating(false);
      setRating(0);
      setRatingComments('');
      setSelectedModeId(null);
      setRedeemPointsInput(0);
      setCouponCodeInput('');
      setAppliedCoupon(null);
      setMembershipCard(null);
      setMembershipDiscount(0);
    } else {
      setSelectedGuestId(guestId || '');
    }
  }, [bill, guestId]);

  const filteredCustomers = React.useMemo(() => {
    if (!customerSearch) return customers.slice(0, 5);
    const s = customerSearch.toLowerCase();
    return customers.filter(c => 
        (c.firstName + ' ' + c.lastName).toLowerCase().includes(s) || 
        c.mobile?.includes(s)
    ).slice(0, 10);
  }, [customers, customerSearch]);

  const couponDiscount = React.useMemo(() => {
    if (!bill || !appliedCoupon) return 0;
    if (appliedCoupon.discountType === 'PERCENTAGE') {
      let disc = (bill.subtotal * appliedCoupon.discountValue) / 100;
      if (appliedCoupon.maxDiscount) {
        disc = Math.min(disc, appliedCoupon.maxDiscount);
      }
      return disc;
    }
    return appliedCoupon.discountValue;
  }, [appliedCoupon, bill?.subtotal]);

  if (!bill) return null;

  const loyaltyDiscount = Number(redeemPointsInput || 0) * 1.0;

  const currentGrandTotal = Math.max(0, bill.subtotal - membershipDiscount - (bill.manualDiscount || 0) - couponDiscount - loyaltyDiscount + bill.tax);

  const handleSettle = async () => {
    if (!onSettle || !selectedModeId) return;
    setIsSettling(true);
    try {
      let activePaymentModeId = selectedModeId;
      if (selectedModeId === 'POST_TO_ROOM') {
        const selectedRoom = occupiedRooms.find((b: any) => b.rooms?.[0]?.room?.id === selectedRoomIdState);
        const roomNo = selectedRoom ? selectedRoom.rooms[0].room.roomNumber : (bill.tableNo ? bill.tableNo.replace('Room ', '').trim() : '');
        const postResponse = await fetch('/api/hotel/post-to-room', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomNumber: roomNo,
            amount: currentGrandTotal,
            description: `Room Service Order ${bill.orderNo}`,
            sourceRefId: bill.orderId || null,
            propertyId: bill.propertyId || undefined
          })
        });
        const postResult = await postResponse.json();
        if (!postResult.success) {
          throw new Error(postResult.message || 'Failed to post charges to the room bill.');
        }
        // Mark as PAY_LATER on the restaurant order since hotel folio now holds the charge
        activePaymentModeId = 'PAY_LATER';
      }

      const response = await fetch('/api/orders/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              orderId: (bill as any).orderId,
              restaurantTableId: (bill as any).tableId,
              parkingSlotId: (bill as any).parkingSlotId,
              roomId: selectedRoomIdState || (bill as any).roomId || undefined,
              folioId: (bill as any).folioId || undefined,
              roomServiceRoomNo: bill.tableNo && bill.tableNo.includes('Room') ? bill.tableNo.replace('Room ', '').trim() : undefined,
              orderType: (bill as any).orderType || 'DINE_IN',
              paymentModeId: activePaymentModeId,
              guestId: selectedGuestId || undefined,
              totalAmount: currentGrandTotal,
              membershipCardId: membershipCard?.id || null,
              membershipDiscount: membershipDiscount,
              manualDiscount: bill.manualDiscount || 0,
              couponCode: appliedCoupon?.code || undefined,
              loyaltyPointsRedeemed: redeemPointsInput || undefined,
              items: bill.items.map(i => ({ 
                id: i.id, 
                name: i.name, 
                quantity: i.quantity, 
                sellingPrice: i.price,
                isCombo: (i as any).isCombo || false
              })),
              sendWhatsApp: sendWhatsApp,
              staffMemberId: bill.staffMemberId || undefined,
              driverId: (bill as any).driverId || undefined,
              guestCount: bill.guestCount || 1
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
        if (selectedModeId !== 'POST_TO_ROOM') {
          handlePrint();
        }
        onClose(true);
    } catch (err) {
        console.error('Rating failed', err);
        if (selectedModeId !== 'POST_TO_ROOM') {
          handlePrint();
        }
        onClose(true);
    }
  };

  const handlePrint = async () => {
    if (property?.enableDirectPrinting) {
      try {
        const billingPrinter = printers.find(p => p.isEnabled && p.isBilling);
        
        if (billingPrinter && ['SYSTEM', 'USB', 'BLUETOOTH'].includes(billingPrinter.connectionType)) {
          const nameToUse = billingPrinter.ipAddress || billingPrinter.name;
          const rawData = printerService.formatBill(bill, property);
          await printerService.printRaw(nameToUse, rawData);
          toast.success(`✅ Bill printed successfully via QZ Tray on ${nameToUse}!`);
          return;
        } else {
          const response = await fetch('/api/print', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              bill, 
              property, 
              printerId: billingPrinter?.id 
            })
          });
          const result = await response.json();
          if (result.success) {
            toast.success('✅ Bill printed successfully!');
            return;
          } else {
            throw new Error(result.message || 'Direct printing failed');
          }
        }
      } catch (e: any) {
        console.warn("Direct serial print failed, falling back to browser print:", e);
        toast.error(`❌ Direct print failed: ${e.message}. Falling back to browser print.`);
      }
    }

    const printWindow = window.open('', '_blank', 'width=450,height=700');
    if (!printWindow) return;

    const subtotalAmt = bill.subtotal || 0;
    const membershipDiscountAmt = membershipDiscount || 0;
    const manualDiscountAmt = bill.manualDiscount || 0;
    const couponDiscountAmt = couponDiscount || 0;
    const loyaltyDiscountAmt = loyaltyDiscount || 0;
    const taxAmt = bill.tax || 0;
    const grandTotalAmt = Math.max(0, subtotalAmt - membershipDiscountAmt - manualDiscountAmt - couponDiscountAmt - loyaltyDiscountAmt + taxAmt);

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
                    ${item.replacedFrom ? `<br/><span style="font-size: 8px; color: #555;">(Replaced from: ${item.replacedFrom})</span>` : ''}
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
            ${couponDiscountAmt > 0 ? `<div class="total-row" style="color: #000;"><span>COUPON (${appliedCoupon?.code}):</span> <span>-₹${couponDiscountAmt.toFixed(2)}</span></div>` : ''}
            ${loyaltyDiscountAmt > 0 ? `<div class="total-row" style="color: #000;"><span>LOYALTY DISCOUNT (${redeemPointsInput} PTS):</span> <span>-₹${loyaltyDiscountAmt.toFixed(2)}</span></div>` : ''}
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
    <Modal isOpen={!!bill} onClose={() => onClose(!!settledInvoiceId)} title={isProforma ? "Order Settlement" : "Bill Details"} maxWidth="4xl">
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
                      {item.replacedFrom && (
                        <p className="text-[9px] font-medium text-slate-400 dark:text-slate-500 mt-0.5">↩ Replaced: {item.replacedFrom}</p>
                      )}
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
              {membershipDiscount > 0 ? (
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
              {couponDiscount > 0 ? (
                <div className="flex justify-between text-xs font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wider animate-in fade-in duration-300">
                  <span>Coupon ({appliedCoupon?.code})</span>
                  <span className="font-semibold">-₹{couponDiscount.toFixed(0)}</span>
                </div>
              ) : null}
              {loyaltyDiscount > 0 ? (
                <div className="flex justify-between text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider animate-in fade-in duration-300">
                  <span>Points Redeemed ({redeemPointsInput} PTS)</span>
                  <span className="font-semibold">-₹{loyaltyDiscount.toFixed(0)}</span>
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

                  {/* Loyalty Points Section */}
                  {selectedGuestId && (() => {
                    const guest = customers.find(c => c.id === selectedGuestId);
                    if (!guest) return null;
                    return (
                      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                        <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800">
                          <div>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Points Balance</p>
                            <p className="text-[11px] font-black text-slate-700 dark:text-slate-350 uppercase tracking-wider">{guest.loyaltyPoints || 0} Points</p>
                          </div>
                          {guest.loyaltyPoints > 0 ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="0"
                                max={guest.loyaltyPoints}
                                value={redeemPointsInput || ''}
                                onChange={(e) => {
                                  const val = Math.min(guest.loyaltyPoints, Math.max(0, parseInt(e.target.value) || 0));
                                  setRedeemPointsInput(val);
                                }}
                                placeholder="Redeem"
                                className="w-20 px-2.5 py-1.5 text-center bg-white dark:bg-slate-900 dark:text-white border border-slate-200 dark:border-slate-750 rounded-lg text-xs font-bold outline-none"
                              />
                              <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">₹{redeemPointsInput * 1.0} off</span>
                            </div>
                          ) : (
                            <span className="text-[9px] font-black text-slate-450 dark:text-slate-550 uppercase tracking-wider">No points to redeem</span>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Coupon Code Section */}
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Promo / Coupon Code</p>
                    {appliedCoupon ? (
                      <div className="flex justify-between items-center bg-emerald-500/10 dark:bg-emerald-950/20 border border-emerald-250/20 dark:border-emerald-800/40 p-3 rounded-xl">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Tag size={13} className="text-emerald-600 dark:text-emerald-450" />
                          <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider truncate">
                            Code: {appliedCoupon.code} ({appliedCoupon.discountType === 'PERCENTAGE' ? `${appliedCoupon.discountValue}%` : `₹${appliedCoupon.discountValue}`} Off)
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveCoupon}
                          className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase hover:underline tracking-wider"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="ENTER COUPON CODE"
                            value={couponCodeInput}
                            onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                            className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-950/40 dark:text-white border border-slate-200/60 dark:border-slate-800 rounded-xl text-xs font-bold outline-none uppercase tracking-wider placeholder:text-slate-400 focus:border-indigo-500/30"
                          />
                          <button
                            type="button"
                            onClick={handleApplyCoupon}
                            disabled={!couponCodeInput || isValidatingCoupon}
                            className="bg-indigo-600 text-white text-xs font-bold uppercase px-4 rounded-xl hover:bg-indigo-700 disabled:opacity-50 tracking-wider transition-colors"
                          >
                            {isValidatingCoupon ? '...' : 'APPLY'}
                          </button>
                        </div>
                        {couponError && (
                          <p className="text-[9px] font-bold text-rose-500 uppercase tracking-wider ml-1 mt-1">{couponError}</p>
                        )}
                      </div>
                    )}
                  </div>
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

                  <button 
                    type="button"
                    onClick={() => setSelectedModeId(selectedModeId === 'POST_TO_ROOM' ? null : 'POST_TO_ROOM')}
                    className={`p-2 rounded-xl border transition-all flex flex-col items-center justify-center gap-1.5 ${
                      selectedModeId === 'POST_TO_ROOM'
                      ? 'border-indigo-500 dark:border-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/20 text-indigo-650 dark:text-indigo-400 shadow-sm font-bold animate-pulse' 
                      : 'border-slate-200/60 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 hover:bg-slate-100 dark:hover:bg-slate-850/80 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <span className="text-xs">🏨</span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider">Post to Room</span>
                  </button>
                </div>

                {selectedModeId === 'POST_TO_ROOM' && (
                  <div className="mb-4 p-3 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 space-y-2">
                    <label className="block text-[10px] font-bold text-indigo-400 uppercase tracking-wide">Charge to Room Folio</label>
                    {loadingRooms ? (
                      <p className="text-[10px] text-slate-500 italic">Loading active stays...</p>
                    ) : (
                      <select
                        value={selectedRoomIdState}
                        onChange={(e) => setSelectedRoomIdState(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200/60 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-100 text-xs font-bold focus:outline-none focus:border-indigo-500"
                      >
                        <option value="">-- SELECT GUEST ROOM --</option>
                        {occupiedRooms.map((b: any) => {
                          const roomNo = b.rooms?.[0]?.room?.roomNumber || 'N/A';
                          const guestName = `${b.guest.firstName} ${b.guest.lastName || ''}`;
                          return (
                            <option key={b.id} value={b.rooms[0].room.id}>
                              Room {roomNo} - {guestName}
                            </option>
                          );
                        })}
                      </select>
                    )}
                  </div>
                )}

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
                    disabled={!selectedModeId || isSettling || (selectedModeId === 'POST_TO_ROOM' && !selectedRoomIdState)}
                    onClick={handleSettle}
                    className={`w-full h-13 rounded-xl transition-all flex items-center justify-between border shadow-sm active:scale-[0.98] ${
                      selectedModeId 
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white font-semibold border-indigo-700/20 cursor-pointer' 
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 font-semibold border-slate-200 dark:border-slate-800/60 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 pl-4">
                       {isSettling ? (
                          <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                       ) : selectedModeId === 'POST_TO_ROOM' ? (
                          <Save size={16} />
                       ) : (
                          <Printer size={16} />
                       )}
                       <span className="text-xs font-bold tracking-wider uppercase">
                         {selectedModeId === 'POST_TO_ROOM' ? 'Save & Charge to Room' : 'Save & Print Bill'}
                       </span>
                    </div>
                    <div className="pr-4 flex items-center gap-1.5">
                       <span className="text-[9px] uppercase tracking-wider opacity-60">Payable:</span>
                       <span className="text-sm font-bold">₹{currentGrandTotal.toFixed(0)}</span>
                    </div>
                  </button>
                  
                  <div className="flex justify-center mt-3">
                    <button onClick={() => onClose(!!settledInvoiceId)} className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 transition-colors py-1">
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
                {selectedModeId === 'POST_TO_ROOM' ? 'Submit & Complete' : 'Submit & Print Bill'}
              </Button>
              <Button 
                onClick={handleWhatsApp}
                className="w-full h-11 bg-emerald-600 text-white font-semibold text-xs tracking-wider rounded-xl shadow-md flex items-center justify-center gap-2"
              >
                <MessageCircle size={16} />
                Send via WhatsApp
              </Button>
              <button 
                onClick={() => { 
                  if (selectedModeId !== 'POST_TO_ROOM') {
                    handlePrint(); 
                  }
                  onClose(true); 
                }}
                className="text-xs font-semibold text-slate-400 dark:text-slate-505 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors py-1"
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
