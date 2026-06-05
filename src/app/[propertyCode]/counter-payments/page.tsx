'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Store, RefreshCcw, CheckCircle, X, Banknote, CreditCard, 
  Smartphone, User, Hash, IndianRupee, Clock, ChefHat, 
  Search, ArrowRight, TrendingUp, Activity, CheckCircle2, 
  ChevronRight, AlertCircle, Lock, Loader2
} from 'lucide-react';

const PAYMENT_METHODS = [
  { key: 'CASH',  label: 'Cash',  icon: Banknote,    color: 'bg-emerald-500', textColor: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
  { key: 'CARD',  label: 'Card',  icon: CreditCard,  color: 'bg-blue-500',    textColor: 'text-blue-600',    bg: 'bg-blue-50 dark:bg-blue-950/30' },
  { key: 'UPI',   label: 'UPI',   icon: Smartphone,  color: 'bg-violet-500',  textColor: 'text-violet-600',  bg: 'bg-violet-50 dark:bg-violet-950/30' },
];

const STATUS_LABELS: Record<string, { label: string; color: string; icon: any; bg: string }> = {
  OPEN:          { label: 'Open',         color: 'text-slate-500',   icon: Clock,     bg: 'bg-slate-100 dark:bg-slate-800' },
  PLACED:        { label: 'Placed',       color: 'text-orange-500',  icon: Clock,     bg: 'bg-orange-100 dark:bg-orange-900/20' },
  PENDING:       { label: 'Pending',      color: 'text-orange-500',  icon: Clock,     bg: 'bg-orange-100 dark:bg-orange-900/20' },
  IN_KITCHEN:    { label: 'In Kitchen',   color: 'text-blue-500',    icon: ChefHat,   bg: 'bg-blue-100 dark:bg-blue-900/20' },
  PREPARING:     { label: 'Preparing',    color: 'text-blue-500',    icon: ChefHat,   bg: 'bg-blue-100 dark:bg-blue-900/20' },
  READY:         { label: 'Ready',        color: 'text-emerald-500', icon: CheckCircle2, bg: 'bg-emerald-100 dark:bg-emerald-900/20' },
  SERVED:        { label: 'Served',       color: 'text-emerald-500', icon: CheckCircle2, bg: 'bg-emerald-100 dark:bg-emerald-900/20' },
  BILL_PRINTED:  { label: 'Bill Printed', color: 'text-indigo-500',  icon: Hash,      bg: 'bg-indigo-100 dark:bg-indigo-900/20' },
  PAYMENT_AWAITING_APPROVAL: { label: 'Approve Payment', color: 'text-amber-500', icon: Smartphone, bg: 'bg-amber-100 dark:bg-amber-900/20' },
};

export default function CounterPaymentsPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settling, setSettling] = useState<string | null>(null);
  const [settled, setSettled] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [payMethod, setPayMethod] = useState<'CASH' | 'CARD' | 'UPI'>('CASH');
  const [tipAmount, setTipAmount] = useState('');
  const [search, setSearch] = useState('');
  const [property, setProperty] = useState<any>(null);

  const [autoClearEnabled, setAutoClearEnabled] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('counter_auto_clear') === 'true';
    return true;
  });
  const [autoClearHours, setAutoClearHours] = useState(() => {
    if (typeof window !== 'undefined') return parseInt(localStorage.getItem('counter_auto_clear_hours') || '24');
    return 24;
  });
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    fetch('/api/setup/properties/current')
      .then(res => res.json())
      .then(data => { if (data.success) setProperty(data.data); })
      .catch(err => console.error('Failed to fetch property', err));
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const url = new URL('/api/pos-orders/counter-pending', window.location.origin);
      if (autoClearEnabled) {
        url.searchParams.set('thresholdHours', String(autoClearHours));
      }
      const res = await fetch(url.toString());
      const data = await res.json();
      if (data.success) {
        setOrders(data.data);
        setError(null);
      } else {
        setError(data.message || 'Failed to fetch orders');
      }
    } catch (err) {
      console.error(err);
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  }, [autoClearEnabled, autoClearHours]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  useEffect(() => {
    localStorage.setItem('counter_auto_clear', String(autoClearEnabled));
    localStorage.setItem('counter_auto_clear_hours', String(autoClearHours));
  }, [autoClearEnabled, autoClearHours]);

  const handleSettle = async () => {
    if (!selectedOrder) return;
    const orderToSettle = selectedOrder;
    const finalTip = parseFloat(tipAmount) || 0;
    
    setSettling(orderToSettle.id);
    try {
      const res = await fetch('/api/pos-orders/counter-settle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderToSettle.id,
          paymentMethod: payMethod,
          tipAmount: finalTip,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSettled(orderToSettle.id);
        setSelectedOrder(null);
        setTipAmount('');
        setPayMethod('CASH');

        fetch('/api/print', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bill: {
              orderNo: orderToSettle.orderNo,
              tableNo: orderToSettle.parkingSlot ? `Parking: ${orderToSettle.parkingSlot.name}` : orderToSettle.table?.name || orderToSettle.tableNo || 'WALK-IN',
              items: orderToSettle.items.map((i: any) => ({
                name: i.product?.name || 'Item',
                quantity: i.quantity,
                price: i.unitPrice
              })),
              subtotal: orderToSettle.subtotal,
              tax: orderToSettle.taxAmount,
              membershipDiscount: orderToSettle.membershipDiscount || 0,
              grandTotal: orderToSettle.grandTotal + finalTip
            },
            property: property
          })
        }).catch(err => console.error('Print failed', err));

        setTimeout(() => {
          setSettled(null);
          fetchOrders();
        }, 1000);
      } else {
        alert(data.message || 'Failed');
      }
    } catch (err) {
      alert('Network error');
    } finally {
      setSettling(null);
    }
  };

  const filteredOrders = useMemo(() => {
    if (!search) return orders;
    const q = search.toLowerCase();
    return orders.filter(o => 
      o.orderNo?.toLowerCase().includes(q) ||
      o.tableNo?.toLowerCase().includes(q) ||
      o.table?.name?.toLowerCase().includes(q) ||
      o.parkingSlot?.name?.toLowerCase().includes(q) ||
      o.guest?.firstName?.toLowerCase().includes(q) ||
      o.guest?.mobile?.includes(q)
    );
  }, [orders, search]);

  const sortedOrders = useMemo(() => {
    return [...filteredOrders].sort((a, b) => {
      if (a.status === 'PAYMENT_AWAITING_APPROVAL' && b.status !== 'PAYMENT_AWAITING_APPROVAL') return -1;
      if (a.status !== 'PAYMENT_AWAITING_APPROVAL' && b.status === 'PAYMENT_AWAITING_APPROVAL') return 1;
      if (a.paymentRequested && !b.paymentRequested) return -1;
      if (!a.paymentRequested && b.paymentRequested) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [filteredOrders]);

  const totalPayable = selectedOrder ? selectedOrder.grandTotal + (parseFloat(tipAmount) || 0) : 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-3 lg:p-5">
      <div className="max-w-[1600px] mx-auto space-y-4">
        
        {/* Header: Compact */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
              <Store size={20} />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Counter</h1>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{orders.length} Active</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-1 max-w-xl justify-end">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </div>
            <button onClick={() => setShowSettings(!showSettings)} className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800">
              <Clock size={16} />
            </button>
            <button onClick={() => { setLoading(true); fetchOrders(); }} className="p-2 rounded-xl bg-orange-500 text-white shadow-lg shadow-orange-500/20 hover:bg-orange-600">
              <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Stats: Super Compact */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Pending Rev', value: `₹${orders.reduce((s, o) => s + (o.grandTotal || 0), 0).toFixed(0)}`, color: 'text-orange-600' },
            { label: 'Ready', value: orders.filter(o => o.status === 'READY').length, color: 'text-emerald-600' },
            { label: 'Awaiting', value: orders.filter(o => o.status === 'PAYMENT_AWAITING_APPROVAL').length, color: 'text-amber-600' },
            { label: 'Active', value: orders.length, color: 'text-blue-600' },
          ].map(s => (
            <div key={s.label} className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</span>
              <span className={`text-sm font-black ${s.color}`}>{s.value}</span>
            </div>
          ))}
        </div>

        {/* Orders Grid: 4 Columns, Compact Cards */}
        {loading && !orders.length ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Loading...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center opacity-50">
            <Store size={40} className="mb-4 text-slate-300" />
            <p className="font-black text-slate-400 uppercase tracking-widest text-xs">No pending bills</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {sortedOrders.map(order => {
              const statusInfo = STATUS_LABELS[order.status] || STATUS_LABELS['OPEN'];
              const isHighPriority = order.status === 'PAYMENT_AWAITING_APPROVAL' || order.paymentRequested;
              
              const loc = order.parkingSlot ? `P-${order.parkingSlot.name}` : order.table ? `T-${order.table.name || order.tableNo}` : order.orderType === 'DELIVERY' ? 'Delivery' : order.orderType === 'TAKEAWAY' ? 'Takeaway' : 'Walk-in';
              const staff = order.servedBy?.fullName?.split(' ')[0] || order.staffMember?.name?.split(' ')[0];
              
              let sourceTitle = '';
              let sourceColor = '';
              if (staff) {
                sourceTitle = `Staff Portal (${staff})`;
                sourceColor = 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800/50';
              } else if (order.parkingSlot) {
                sourceTitle = `Parking QR`;
                sourceColor = 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-400 dark:border-pink-800/50';
              } else if (order.table) {
                sourceTitle = `Table QR`;
                sourceColor = 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 dark:bg-fuchsia-900/30 dark:text-fuchsia-400 dark:border-fuchsia-800/50';
              } else {
                sourceTitle = `Counter`;
                sourceColor = 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
              }

              return (
                <div
                  key={order.id}
                  onClick={() => { setSelectedOrder(order); setTipAmount(''); setPayMethod(order.status === 'PAYMENT_AWAITING_APPROVAL' ? 'UPI' : 'CASH'); }}
                  className={`bg-white dark:bg-slate-900 rounded-xl border-2 p-3 transition-all cursor-pointer hover:shadow-md ${
                    settled === order.id ? 'border-emerald-500' : isHighPriority ? 'border-orange-500/50 bg-orange-50/10' : 'border-slate-100 dark:border-slate-800'
                  }`}
                >
                  {/* Big prominent source banner at the very top */}
                  <div className={`px-3 py-2 rounded-lg mb-3 border-2 text-xs font-black uppercase tracking-widest text-center ${sourceColor}`}>
                    {sourceTitle}
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-900 dark:text-white">#{order.orderNo?.slice(-6)}</span>
                      <div className={`flex items-center px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-wider ${
                        order.parkingSlot ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400' : 
                        order.table ? 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/40 dark:text-fuchsia-400' : 
                        order.orderType === 'TAKEAWAY' ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400' :
                        order.orderType === 'DELIVERY' ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400' :
                        'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {order.parkingSlot ? 'PARKING' : order.table ? 'TABLE' : order.orderType || 'WALK-IN'}
                      </div>
                    </div>
                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-lg ${statusInfo.bg} ${statusInfo.color} border border-current/10`}>
                      <statusInfo.icon size={10} />
                      <span className="text-[8px] font-black uppercase">{statusInfo.label}</span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-400 font-bold uppercase">Location</span>
                      <span className="font-black text-slate-700 dark:text-slate-200 truncate max-w-[150px] text-right">
                        {loc}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-400 font-bold uppercase">Guest</span>
                      <span className="font-black text-slate-700 dark:text-slate-200 truncate max-w-[100px]">
                        {order.guest?.firstName || (order.vehicleNumber ? order.vehicleNumber : 'Walk-in')}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <p className="text-base font-black text-orange-600">₹{order.grandTotal?.toFixed(0)}</p>
                    <button className={`p-2 rounded-lg text-white shadow-sm transition-all active:scale-95 ${order.status === 'PAYMENT_AWAITING_APPROVAL' ? 'bg-amber-500' : 'bg-orange-500'}`}>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Settle Modal: Compact */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="bg-slate-900 p-5 flex items-center justify-between text-white">
              <div>
                <p className="text-[10px] font-black uppercase text-orange-400 tracking-widest">Settle Bill</p>
                <h2 className="text-xl font-black">#{selectedOrder.orderNo}</h2>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5 no-scrollbar">
              
              {selectedOrder.status === 'PAYMENT_AWAITING_APPROVAL' && (
                <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-2xl border border-amber-200 dark:border-amber-800/50 flex items-center gap-3">
                  <Smartphone className="text-amber-500" size={24} />
                  <div>
                    <p className="text-[10px] font-black text-amber-600 uppercase">Verify UPI Payment</p>
                    <p className="text-sm font-black text-slate-800 dark:text-white tracking-widest">Ref: ****{selectedOrder.onlinePaymentReference || '---'}</p>
                  </div>
                </div>
              )}

              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl space-y-2">
                <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                  <span>Subtotal</span><span>₹{selectedOrder.subtotal?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                  <span>Tax (GST)</span><span>₹{selectedOrder.taxAmount?.toFixed(2)}</span>
                </div>
                <div className="pt-3 mt-1 border-t border-slate-200 dark:border-slate-700 flex justify-between items-end">
                   <div>
                     <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Total</p>
                     <p className="text-3xl font-black text-orange-600 italic">₹{totalPayable.toFixed(0)}</p>
                   </div>
                   <div className="px-3 py-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase">Pending</div>
                </div>
              </div>

              {/* Tips: Smaller */}
              <div className="grid grid-cols-4 gap-2">
                {[10, 20, 50].map(t => (
                  <button key={t} onClick={() => setTipAmount(tipAmount === String(t) ? '' : String(t))}
                    className={`py-2 rounded-xl text-[10px] font-black border ${tipAmount === String(t) ? 'bg-orange-500 border-orange-500 text-white' : 'border-slate-200 dark:border-slate-800 hover:border-orange-500/50'}`}>
                    ₹{t}
                  </button>
                ))}
                <input type="number" value={tipAmount} onChange={e => setTipAmount(e.target.value)} placeholder="Tip"
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-[10px] font-black focus:outline-none" />
              </div>

              {/* Payment Methods */}
              <div className="grid grid-cols-3 gap-2">
                {PAYMENT_METHODS.map(pm => {
                  const isSelected = payMethod === pm.key;
                  const isDisabled = selectedOrder.status === 'PAYMENT_AWAITING_APPROVAL' && pm.key !== 'UPI';
                  return (
                    <button key={pm.key} onClick={() => !isDisabled && setPayMethod(pm.key as any)} disabled={isDisabled}
                      className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${isSelected ? `border-orange-500 ${pm.bg}` : isDisabled ? 'opacity-30' : 'border-slate-100 dark:border-slate-800'}`}>
                      <pm.icon size={18} className={isSelected ? 'text-orange-500' : 'text-slate-400'} />
                      <span className={`text-[9px] font-black uppercase ${isSelected ? 'text-orange-600' : 'text-slate-400'}`}>{pm.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={() => setSelectedOrder(null)} disabled={!!settling} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl font-black text-xs uppercase text-slate-500">Cancel</button>
                <button onClick={handleSettle} disabled={!!settling} className="flex-[2] py-4 bg-orange-500 text-white rounded-2xl font-black text-sm uppercase shadow-lg shadow-orange-500/20 active:scale-95 disabled:opacity-50">
                  {settling ? 'Settling...' : selectedOrder.status === 'PAYMENT_AWAITING_APPROVAL' ? 'Confirm & Print' : `Settle ₹${totalPayable.toFixed(0)}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
