'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Store, RefreshCcw, CheckCircle, X, Banknote, CreditCard, Smartphone, User, Hash, IndianRupee, Clock, ChefHat, Loader2, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

const PAYMENT_METHODS = [
  { key: 'CASH',  label: 'Cash',  icon: Banknote,    color: 'bg-emerald-500', ring: 'ring-emerald-400', textColor: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-900/50' },
  { key: 'CARD',  label: 'Card',  icon: CreditCard,  color: 'bg-blue-500',    ring: 'ring-blue-400',    textColor: 'text-blue-600',    bg: 'bg-blue-50 dark:bg-blue-950/30',       border: 'border-blue-200 dark:border-blue-900/50' },
  { key: 'UPI',   label: 'UPI',   icon: Smartphone,  color: 'bg-violet-500',  ring: 'ring-violet-400',  textColor: 'text-violet-600',  bg: 'bg-violet-50 dark:bg-violet-950/30',   border: 'border-violet-200 dark:border-violet-900/50' },
];

const STATUS_LABELS: Record<string, { label: string; color: string; icon: any }> = {
  OPEN:          { label: 'Open',         color: 'text-slate-500',   icon: Clock },
  PLACED:        { label: 'Placed',       color: 'text-orange-500',  icon: Clock },
  PENDING:       { label: 'Pending',      color: 'text-orange-500',  icon: Clock },
  IN_KITCHEN:    { label: 'In Kitchen',   color: 'text-blue-500',    icon: ChefHat },
  PREPARING:     { label: 'Preparing',    color: 'text-blue-500',    icon: ChefHat },
  READY:         { label: 'Ready',        color: 'text-emerald-500', icon: CheckCircle },
  SERVED:        { label: 'Served',       color: 'text-emerald-500', icon: CheckCircle },
  BILL_PRINTED:  { label: 'Bill Printed', color: 'text-indigo-500',  icon: Hash },
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
  
  // Auto-clear settings
  const [autoClearEnabled, setAutoClearEnabled] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('counter_auto_clear') === 'true';
    return true;
  });
  const [autoClearHours, setAutoClearHours] = useState(() => {
    if (typeof window !== 'undefined') return parseInt(localStorage.getItem('counter_auto_clear_hours') || '24');
    return 24;
  });
  const [showSettings, setShowSettings] = useState(false);

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
      setError('Connection error. Please check your network.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 15000);
    return () => clearInterval(interval);
  }, [fetchOrders, autoClearEnabled, autoClearHours]);

  useEffect(() => {
    localStorage.setItem('counter_auto_clear', String(autoClearEnabled));
    localStorage.setItem('counter_auto_clear_hours', String(autoClearHours));
  }, [autoClearEnabled, autoClearHours]);

  const handleSettle = async () => {
    if (!selectedOrder) return;
    setSettling(selectedOrder.id);
    try {
      const res = await fetch('/api/pos-orders/counter-settle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          paymentMethod: payMethod,
          tipAmount: parseFloat(tipAmount) || 0,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSettled(selectedOrder.id);
        setSelectedOrder(null);
        setTipAmount('');
        setPayMethod('CASH');
        setTimeout(() => {
          setSettled(null);
          fetchOrders();
        }, 2000);
      } else {
        alert(data.message || 'Settlement failed');
      }
    } catch (err) {
      alert('Network error');
    } finally {
      setSettling(null);
    }
  };

  const filteredOrders = orders.filter(o => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      o.orderNo?.toLowerCase().includes(q) ||
      o.tableNo?.toLowerCase().includes(q) ||
      o.table?.name?.toLowerCase().includes(q) ||
      o.guest?.firstName?.toLowerCase().includes(q) ||
      o.guest?.lastName?.toLowerCase().includes(q) ||
      o.guest?.mobile?.includes(q)
    );
  });

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (a.paymentRequested && !b.paymentRequested) return -1;
    if (!a.paymentRequested && b.paymentRequested) return 1;
    return 0;
  });

  const tip = parseFloat(tipAmount) || 0;
  const totalPayable = selectedOrder ? selectedOrder.grandTotal + tip : 0;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center shadow-xl shadow-orange-200 dark:shadow-none">
            <Store size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Counter Payments</h1>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
              {orders.length} Active Orders • Auto-refreshes every 15s
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 relative">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2.5 rounded-xl border transition-all flex items-center gap-2 ${showSettings ? 'bg-orange-500 border-orange-500 text-white shadow-lg' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'}`}
          >
            <Clock size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">Auto-Clear</span>
          </button>

          {showSettings && (
            <div className="absolute top-full right-0 mt-3 w-64 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Auto-Clear Settings</p>
                <button onClick={() => setShowSettings(false)}><X size={14} className="text-slate-400" /></button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Enable Timer</span>
                  <button 
                    onClick={() => setAutoClearEnabled(!autoClearEnabled)}
                    className={`w-10 h-5 rounded-full transition-colors relative ${autoClearEnabled ? 'bg-orange-500' : 'bg-slate-300'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${autoClearEnabled ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>

                {autoClearEnabled && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Clear Orders older than</p>
                    <select 
                      value={autoClearHours}
                      onChange={(e) => setAutoClearHours(parseInt(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-orange-400"
                    >
                      <option value="1">1 Hour</option>
                      <option value="4">4 Hours</option>
                      <option value="12">12 Hours</option>
                      <option value="24">24 Hours</option>
                      <option value="48">48 Hours</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search..."
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-400 w-40 md:w-56"
          />
          <button
            onClick={() => { setLoading(true); fetchOrders(); }}
            className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 hover:text-orange-500 transition-colors"
          >
            <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Orders', value: orders.length, color: 'text-slate-900 dark:text-white' },
          { label: 'Total Revenue', value: `₹${orders.reduce((s, o) => s + (o.grandTotal || 0), 0).toFixed(2)}`, color: 'text-orange-600' },
          { label: 'Ready to Serve', value: orders.filter(o => o.status === 'READY').length, color: 'text-emerald-600' },
          { label: 'In Kitchen', value: orders.filter(o => ['IN_KITCHEN','PREPARING'].includes(o.status)).length, color: 'text-blue-600' },
        ].map(s => (
          <Card key={s.label} className="p-5 border-none shadow-sm bg-white dark:bg-slate-900">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Orders Grid */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 p-6 rounded-2xl flex items-center gap-4 text-red-600 dark:text-red-400">
          <AlertCircle size={24} />
          <div>
            <p className="text-sm font-black uppercase tracking-widest">Error Loading Orders</p>
            <p className="text-xs font-bold opacity-80">{error}</p>
          </div>
          <button onClick={() => { setLoading(true); fetchOrders(); }} className="ml-auto px-4 py-2 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Retry</button>
        </div>
      )}

      {loading && !orders.length ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <div className="w-12 h-12 border-4 border-orange-500/20 rounded-full animate-spin border-t-orange-500"></div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Syncing Orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
            <Store size={32} className="text-slate-300" />
          </div>
          <p className="font-black text-slate-400 uppercase tracking-widest text-sm">No Pending Orders</p>
          <p className="text-xs text-slate-400">All bills are settled or no orders placed yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {sortedOrders.map(order => {
            const statusInfo = STATUS_LABELS[order.status] || STATUS_LABELS['OPEN'];
            const StatusIcon = statusInfo.icon;
            const isJustSettled = settled === order.id;
            return (
              <Card
                key={order.id}
                className={`p-0 overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300 group cursor-pointer ${isJustSettled ? 'ring-2 ring-emerald-400' : ''}`}
                onClick={() => { setSelectedOrder(order); setTipAmount(''); setPayMethod('CASH'); }}
              >
                {/* Card Top Bar */}
                <div className="h-2 bg-gradient-to-r from-orange-400 via-orange-500 to-amber-400" />

                <div className="p-5 space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Order No</p>
                      <p className="text-base font-black text-slate-900 dark:text-white tracking-tight">{order.orderNo}</p>
                    </div>
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${statusInfo.color} bg-current/10`} style={{ backgroundColor: 'transparent' }}>
                      <StatusIcon size={12} className={statusInfo.color} />
                      <span className={`text-[9px] font-black uppercase tracking-widest ${statusInfo.color}`}>{statusInfo.label}</span>
                    </div>
                  </div>

                  {order.paymentRequested && (
                    <div className="bg-orange-500 text-white px-3 py-1.5 rounded-xl flex items-center gap-2 animate-pulse shadow-lg shadow-orange-200">
                      <Store size={14} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Customer Waiting at Counter</span>
                    </div>
                  )}

                  {/* Table & Guest */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Table</p>
                      <p className="text-sm font-black text-slate-800 dark:text-white">
                        {order.table?.name || order.tableNo || '—'}
                      </p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Guest</p>
                      <p className="text-sm font-black text-slate-800 dark:text-white truncate">
                        {order.guest ? `${order.guest.firstName || ''} ${order.guest.lastName || ''}`.trim() || 'Walk-in' : 'Walk-in'}
                      </p>
                    </div>
                  </div>

                  {/* Items Summary */}
                  <div className="space-y-1.5">
                    {order.items?.slice(0, 3).map((item: any) => (
                      <div key={item.id} className="flex justify-between text-xs">
                        <span className="text-slate-600 dark:text-slate-300 font-medium truncate max-w-[60%]">{item.product?.name || 'Item'} × {item.quantity}</span>
                        <span className="font-bold text-slate-800 dark:text-white">₹{item.totalAmount?.toFixed(2)}</span>
                      </div>
                    ))}
                    {order.items?.length > 3 && (
                      <p className="text-[9px] text-slate-400 font-bold">+{order.items.length - 3} more items</p>
                    )}
                  </div>

                  {/* Bill Amount */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Bill Amount</p>
                      <p className="text-xl font-black text-orange-600 dark:text-orange-400">₹{order.grandTotal?.toFixed(2)}</p>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); setSelectedOrder(order); setTipAmount(''); setPayMethod('CASH'); }}
                      className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-orange-200 dark:shadow-none transition-all active:scale-95"
                    >
                      Collect
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Settle Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-md" onClick={() => setSelectedOrder(null)} />
          <div className="relative z-[101] w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-[10px] font-black uppercase tracking-widest">Counter Settlement</p>
                  <h2 className="text-2xl font-black text-white mt-1">{selectedOrder.orderNo}</h2>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white hover:bg-white/30 transition-colors">
                  <X size={20} />
                </button>
              </div>
              {/* Table & Guest pills */}
              <div className="flex gap-2 mt-4">
                <div className="flex items-center gap-1.5 bg-white/20 rounded-lg px-3 py-1">
                  <Hash size={12} className="text-orange-100" />
                  <span className="text-[10px] font-black text-white uppercase">
                    {selectedOrder.table?.name || selectedOrder.tableNo || 'Table'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/20 rounded-lg px-3 py-1">
                  <User size={12} className="text-orange-100" />
                  <span className="text-[10px] font-black text-white uppercase">
                    {selectedOrder.guest ? `${selectedOrder.guest.firstName || ''} ${selectedOrder.guest.lastName || ''}`.trim() || 'Walk-in' : 'Walk-in'}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Bill Summary */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Bill Summary</p>
                {selectedOrder.items?.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-xs">
                    <span className="text-slate-600 dark:text-slate-300">{item.product?.name} × {item.quantity}</span>
                    <span className="font-bold text-slate-800 dark:text-white">₹{item.totalAmount?.toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t border-slate-200 dark:border-slate-700 pt-2 mt-2 space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                    <span>Subtotal</span><span>₹{selectedOrder.subtotal?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                    <span>Tax</span><span>₹{selectedOrder.taxAmount?.toFixed(2)}</span>
                  </div>
                  {tip > 0 && (
                    <div className="flex justify-between text-[10px] text-amber-500 font-black">
                      <span>Tip</span><span>₹{tip.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-black text-slate-900 dark:text-white pt-1">
                    <span>Total Payable</span>
                    <span className="text-orange-600">₹{totalPayable.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Tip */}
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Add Tip (Optional)</p>
                <div className="flex gap-2">
                  {[10, 20, 50].map(t => (
                    <button key={t} onClick={() => setTipAmount(tipAmount === String(t) ? '' : String(t))}
                      className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${tipAmount === String(t) ? 'bg-amber-500 text-white border-amber-500' : 'bg-white dark:bg-slate-800 text-amber-600 border-amber-200 dark:border-amber-800'}`}>
                      ₹{t}
                    </button>
                  ))}
                  <div className="relative flex-1">
                    <IndianRupee size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-amber-400" />
                    <input type="number" value={tipAmount} onChange={e => setTipAmount(e.target.value)} placeholder="Custom"
                      className="w-full pl-7 pr-2 py-2 rounded-xl border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-800 text-[11px] font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-300" />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Payment Method *</p>
                <div className="grid grid-cols-3 gap-3">
                  {PAYMENT_METHODS.map(pm => {
                    const PmIcon = pm.icon;
                    const isSelected = payMethod === pm.key;
                    return (
                      <button key={pm.key} onClick={() => setPayMethod(pm.key as any)}
                        className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${isSelected ? `${pm.bg} ${pm.border} ring-2 ${pm.ring}` : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700'}`}>
                        <div className={`w-10 h-10 rounded-xl ${isSelected ? pm.color : 'bg-slate-100 dark:bg-slate-700'} flex items-center justify-center transition-all`}>
                          <PmIcon size={18} className={isSelected ? 'text-white' : 'text-slate-400'} />
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-widest ${isSelected ? pm.textColor : 'text-slate-400'}`}>{pm.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setSelectedOrder(null)}
                  className="flex-1 h-12 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-200 transition-colors">
                  Cancel
                </button>
                <button onClick={handleSettle} disabled={!!settling}
                  className="flex-[2] h-12 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-orange-200 dark:shadow-none flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60">
                  {settling ? <><Loader2 size={16} className="animate-spin" /> Processing...</> : <><CheckCircle size={16} /> Collect ₹{totalPayable.toFixed(2)}</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
