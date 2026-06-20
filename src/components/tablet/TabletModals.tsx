'use client';

import React, { useState } from 'react';
import { Bell, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Modal } from '@/components/ui/Modal';
import { KotSlipModal, KotSlipData } from '@/components/kots/KotSlipModal';
import { SwitchTableModal } from '@/components/tables/SwitchTableModal';
import { isValid, format } from 'date-fns';

interface TabletModalsProps {
  // Notifications
  isNotificationOpen: boolean;
  setIsNotificationOpen: (val: boolean) => void;
  notificationHistory: Array<{ id: string; message: string; timestamp: Date; type: 'success' | 'info' }>;
  setNotificationHistory: React.Dispatch<React.SetStateAction<Array<{ id: string; message: string; timestamp: Date; type: 'success' | 'info' }>>>;
  
  // KOT Slip
  kotSlip: KotSlipData | null;
  setKotSlip: (val: KotSlipData | null) => void;
  
  // QR/Payment Modal
  isQRModalOpen: boolean;
  setIsQRModalOpen: (val: boolean) => void;
  qrModalOrder: any | null;
  setQrModalOrder: (val: any | null) => void;
  activeOrder: any | null;
  cartSubtotal: number;
  cartTax: number;
  localDiscountAmount: number;
  setLocalDiscountAmount: (val: number) => void;
  tablet: any;
  
  // Switch Table
  isSwitchModalOpen: boolean;
  setIsSwitchModalOpen: (val: boolean) => void;
  sourceTableForSwitch: any | null;
  setSourceTableForSwitch: (val: any | null) => void;
  tables: any[];
  handleConfirmSwitchTable: (targetTableId: string) => Promise<void>;
  switchLoading: boolean;
  cart?: any[];
}

export default function TabletModals({
  isNotificationOpen, setIsNotificationOpen, notificationHistory, setNotificationHistory,
  kotSlip, setKotSlip,
  isQRModalOpen, setIsQRModalOpen, qrModalOrder, setQrModalOrder, activeOrder, cartSubtotal, cartTax, localDiscountAmount, setLocalDiscountAmount, tablet,
  isSwitchModalOpen, setIsSwitchModalOpen, sourceTableForSwitch, setSourceTableForSwitch, tables, handleConfirmSwitchTable, switchLoading,
  cart = []
}: TabletModalsProps) {
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any | null>(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  const currentOrder = qrModalOrder || activeOrder;
  const orderSubtotal = currentOrder?.subtotal || cartSubtotal;
  const orderTax = currentOrder?.taxAmount || cartTax;
  const orderTotal = orderSubtotal + orderTax;
  const finalPayable = Math.max(0, orderTotal - localDiscountAmount);

  const itemsToDisplay = currentOrder?.items
    ? currentOrder.items.map((item: any) => ({
        name: item.product?.name || 'Item',
        quantity: item.quantity,
        price: item.unitPrice,
      }))
    : cart?.map((item: any) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.sellingPrice,
      })) || [];

  const orderTableId = currentOrder?.restaurantTableId || currentOrder?.tableId;
  const activeTableName = tables.find((t: any) => t.id === orderTableId)?.name || currentOrder?.tableNo || tablet?.table?.name || 'Table';

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponError('');
    setCouponLoading(true);
    try {
      const res = await fetch('/api/marketing/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponCode.trim().toUpperCase(),
          guestId: (qrModalOrder || activeOrder)?.guestId || null,
          orderTotal: ((qrModalOrder || activeOrder)?.subtotal || cartSubtotal)
        })
      });
      const data = await res.json();
      if (data.success) {
        setAppliedCoupon(data.data);
        const coupon = data.data;
        const subtotal = ((qrModalOrder || activeOrder)?.subtotal || cartSubtotal);
        let calculatedDiscount = 0;
        if (coupon.discountType === 'PERCENTAGE') {
          calculatedDiscount = (subtotal * coupon.discountValue) / 100;
          if (coupon.maxDiscount) {
            calculatedDiscount = Math.min(calculatedDiscount, coupon.maxDiscount);
          }
        } else {
          calculatedDiscount = coupon.discountValue;
        }
        setLocalDiscountAmount(calculatedDiscount);
      } else {
        setCouponError(data.message || 'Invalid coupon code');
      }
    } catch (e) {
      setCouponError('Network error validating coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setLocalDiscountAmount(0);
    setCouponError('');
  };

  const handleCloseQRModal = () => {
    setIsQRModalOpen(false);
    setLocalDiscountAmount(0);
    setQrModalOrder(null);
    setCouponCode('');
    setAppliedCoupon(null);
    setCouponError('');
  };

  return (
    <>
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <Modal
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        title="Notification Center"
      >
        <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto no-scrollbar">
          {notificationHistory.length === 0 ? (
            <div className="text-center py-10 opacity-30">
              <Bell size={48} className="mx-auto mb-4" />
              <p className="text-xs font-black uppercase tracking-widest">No notifications yet</p>
            </div>
          ) : (
            notificationHistory.map(notif => (
              <div key={notif.id} className={`p-4 rounded-2xl border ${notif.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-slate-800 border-white/5 text-slate-350'} flex items-center justify-between gap-4`}>
                <div className="flex items-start gap-4 min-w-0 flex-1">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${notif.type === 'success' ? 'bg-emerald-500/20' : 'bg-white/5'}`}>
                    <Bell size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold leading-normal">{notif.message}</p>
                    <p className="text-[8px] opacity-40 font-black uppercase mt-1">
                      {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </p>
                  </div>
                </div>
                {/* Got it/Dismiss button */}
                <button
                  onClick={async () => {
                    try {
                      // Attempt to mark as read in database
                      await fetch('/api/notifications', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: notif.id, status: 'READ' })
                      });
                    } catch (e) {}
                    setNotificationHistory(prev => prev.filter(n => n.id !== notif.id));
                  }}
                  className="text-[9px] font-black uppercase tracking-wider text-rose-500 hover:text-rose-400 hover:underline pl-2 shrink-0 self-center"
                >
                  Clear
                </button>
              </div>
            ))
          )}
        </div>
      </Modal>

      {kotSlip && (
        <KotSlipModal
          kot={kotSlip}
          onClose={() => setKotSlip(null)}
        />
      )}

      <Modal
        isOpen={isQRModalOpen}
        onClose={handleCloseQRModal}
        title="Pay Bill"
        maxWidth="3xl"
        isDark={true}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-2">
          {/* Left Column: Bill Receipt/Summary */}
          <div className="bg-slate-50 text-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-lg border border-slate-200">
            <div className="text-center pb-3 border-b border-dashed border-slate-300">
              <h4 className="text-sm font-black uppercase tracking-tight text-slate-800">
                {tablet?.property?.name || 'POS RESTAURANT'}
              </h4>
              {tablet?.property?.address && (
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tight mt-1 max-w-[180px] mx-auto leading-relaxed">
                  {tablet.property.address}
                </p>
              )}
            </div>

            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[8px] font-bold uppercase tracking-wider text-slate-400">
              <div className="flex justify-between">
                <span>Order No</span>
                <span className="text-slate-800 font-extrabold">{currentOrder?.orderNo || 'New Order'}</span>
              </div>
              <div className="flex justify-between">
                <span>Table Name</span>
                <span className="text-indigo-600 font-extrabold">{activeTableName ? `Table ${activeTableName}` : 'Walk-in'}</span>
              </div>
              <div className="flex justify-between">
                <span>Timestamp</span>
                <span className="text-slate-800 font-extrabold">
                  {(() => {
                    const d = currentOrder?.createdAt ? new Date(currentOrder.createdAt) : new Date();
                    return format(isValid(d) ? d : new Date(), 'dd/MM/yyyy HH:mm');
                  })()}
                </span>
              </div>
            </div>

            {/* Items List */}
            <div className="py-3 flex-1 flex flex-col min-h-[160px]">
              <div className="grid grid-cols-[1fr_80px_70px] gap-2 text-[8px] font-black uppercase tracking-wider text-slate-400 mb-2 border-b border-slate-200 pb-1">
                <span>Description</span>
                <span className="text-center">Qty × Price</span>
                <span className="text-right">Total</span>
              </div>
              <div className="space-y-2.5 overflow-y-auto no-scrollbar max-h-[180px] pr-1">
                {itemsToDisplay.length === 0 ? (
                  <div className="text-center py-6 opacity-30">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">No items</p>
                  </div>
                ) : (
                  itemsToDisplay.map((item: any, idx: number) => (
                    <div key={idx} className="grid grid-cols-[1fr_80px_70px] gap-2 items-start py-0.5">
                      <div className="min-w-0">
                        <p className="text-[9px] font-bold text-slate-800 leading-tight uppercase truncate">{item.name}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[9px] font-medium text-slate-500 tabular-nums">{item.quantity} × {item.price.toFixed(0)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-bold text-slate-800 tabular-nums">₹{(item.quantity * item.price).toFixed(0)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Calculations */}
            <div className="border-t border-dashed border-slate-300 pt-3 space-y-1.5 mt-auto">
              <div className="flex justify-between text-[9px] font-bold text-slate-550 uppercase tracking-wider">
                <span>Subtotal</span>
                <span className="text-slate-850 font-black">₹{orderSubtotal.toFixed(0)}</span>
              </div>
              <div className="flex justify-between text-[9px] font-bold text-slate-550 uppercase tracking-wider">
                <span>Tax & Charges</span>
                <span className="text-slate-850 font-black">₹{orderTax.toFixed(0)}</span>
              </div>
              {localDiscountAmount > 0 && (
                <div className="flex justify-between text-[9px] font-black text-rose-600 uppercase tracking-wider">
                  <span>Discount</span>
                  <span>- ₹{localDiscountAmount.toFixed(0)}</span>
                </div>
              )}
              <div className="flex justify-between items-center bg-slate-900 text-white p-3 rounded-xl mt-3 shadow-md">
                <div>
                  <span className="text-[7px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">Total Payable</span>
                  <span className="text-base font-black text-white leading-none">₹{finalPayable.toFixed(0)}</span>
                </div>
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center border border-white/5">
                  <QrCode size={14} className="text-indigo-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Coupon, Discount Input and QR Code */}
          <div className="flex flex-col justify-between space-y-6">
            <div className="w-full space-y-4">
              {/* Promo / Coupon Code Input row */}
              <div className="py-3 border-b border-white/5 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-300">Promo / Coupon Code</span>
                  {appliedCoupon ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black text-emerald-450 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20 uppercase tracking-widest">
                        ✓ {appliedCoupon.code}
                      </span>
                      <button 
                        onClick={handleRemoveCoupon}
                        className="text-[9px] font-black text-rose-500 hover:text-rose-400 uppercase tracking-wider hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="ENTER CODE"
                        className="w-28 px-3 py-1.5 bg-slate-950 border border-white/10 rounded-xl text-[10px] font-bold text-white uppercase outline-none focus:border-indigo-500/50"
                      />
                      <button
                        onClick={handleApplyCoupon}
                        disabled={couponLoading || !couponCode.trim()}
                        className="px-3 py-1.5 bg-indigo-650 hover:bg-indigo-550 disabled:opacity-50 text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all"
                      >
                        {couponLoading ? '...' : 'Apply'}
                      </button>
                    </div>
                  )}
                </div>
                {couponError && (
                  <p className="text-[9px] font-bold text-rose-400 text-right leading-none">
                    ✕ {couponError}
                  </p>
                )}
              </div>

              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-300">Discount (₹)</span>
                <input
                  type="number"
                  min="0"
                  value={localDiscountAmount || ''}
                  onChange={(e) => {
                    setLocalDiscountAmount(Number(e.target.value));
                    if (appliedCoupon) {
                      setAppliedCoupon(null);
                      setCouponCode('');
                    }
                  }}
                  className="w-24 px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-right text-xs font-bold text-white focus:outline-none focus:border-indigo-500/50"
                  placeholder="0"
                />
              </div>

              <div className="pt-4 border-t border-white/10 flex justify-between items-center text-sm font-black text-white">
                <span>Final Amount</span>
                <span className="text-indigo-400 text-base font-black">₹{finalPayable.toFixed(2)}</span>
              </div>
            </div>

            {tablet?.property?.upiId ? (
              <div className="flex flex-col items-center space-y-4">
                <div className="bg-white p-3 rounded-2xl shadow-xl flex items-center justify-center">
                  <QRCodeSVG
                    value={`upi://pay?pa=${tablet.property.upiId}&pn=${encodeURIComponent(tablet.property.upiName || tablet.property.name)}&am=${finalPayable.toFixed(2)}&cu=INR&tn=Order-${currentOrder?.orderNo || 'POS'}`}
                    size={160}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-xs font-bold text-slate-300">Scan to pay <span className="text-white font-black">₹{finalPayable.toFixed(2)}</span></p>
                  <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400">
                    {tablet.property.upiId}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 opacity-50">
                <QrCode size={36} className="mx-auto mb-2 text-rose-450" />
                <p className="text-[10px] font-black uppercase tracking-widest text-rose-405">UPI Not Configured</p>
                <p className="text-[8px] font-bold mt-1">Please configure UPI in Settings.</p>
              </div>
            )}

            <button
              onClick={handleCloseQRModal}
              className="w-full py-3 bg-slate-800 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-slate-700 transition-all text-white border border-white/5 active:scale-95 duration-200"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      <SwitchTableModal
        isOpen={isSwitchModalOpen}
        onClose={() => {
          setIsSwitchModalOpen(false);
          setSourceTableForSwitch(null);
        }}
        sourceTable={sourceTableForSwitch}
        vacantTables={tables.filter(t => t.status === 'VACANT')}
        onConfirm={handleConfirmSwitchTable}
        loading={switchLoading}
      />
    </>
  );
}
