'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ShoppingCart, Plus, Search, RefreshCw, Loader2, FileText, CheckCircle2, X } from 'lucide-react';
import { POList, type PurchaseOrder } from './components/POList';
import { PurchaseOrderForm } from './components/PurchaseOrderForm';
import { toast } from 'sonner';

export default function PurchasingPage() {
  const [showForm, setShowForm] = useState(false);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [vendors, setVendors] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Fetch real B2B orders & vendors from database
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [ordersRes, vendorsRes] = await Promise.all([
        fetch('/api/b2b/orders'),
        fetch('/api/hotel/vendor'),
      ]);

      const ordersData = await ordersRes.json();
      const vendorsData = await vendorsRes.json();

      if (Array.isArray(vendorsData.data)) {
        setVendors(vendorsData.data.map((v: any) => ({ id: v.id, name: v.name })));
      }

      if (Array.isArray(ordersData)) {
        const mappedOrders: PurchaseOrder[] = ordersData.map((o: any) => {
          let mappedStatus: 'DRAFT' | 'SENT' | 'CONFIRMED' | 'DELIVERED' | 'CANCELLED' = 'SENT';
          if (o.status === 'PENDING') mappedStatus = 'SENT';
          else if (o.status === 'ACCEPTED' || o.status === 'PROCESSING' || o.status === 'CONFIRMED') mappedStatus = 'CONFIRMED';
          else if (o.status === 'DELIVERED') mappedStatus = 'DELIVERED';
          else if (o.status === 'CANCELLED') mappedStatus = 'CANCELLED';
          else if (o.status === 'DRAFT') mappedStatus = 'DRAFT';

          const createdDateStr = o.createdAt ? new Date(o.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

          return {
            id: o.id,
            poNumber: o.orderNo || `PO-${o.id.substring(0, 6)}`,
            vendor: o.supplier?.name || o.buyerRestaurant || 'Vendor',
            items: o.items?.length || 1,
            totalAmount: o.totalAmount || 0,
            status: mappedStatus,
            createdAt: createdDateStr,
            expectedDate: o.deliveryDate ? new Date(o.deliveryDate).toISOString().split('T')[0] : createdDateStr,
          };
        });
        setOrders(mappedOrders);
      }
    } catch (err) {
      console.error('Purchasing data fetch error:', err);
      toast.error('Failed to load purchase orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = orders.filter(
    (o) => !search || o.vendor.toLowerCase().includes(search.toLowerCase()) || o.poNumber.toLowerCase().includes(search.toLowerCase())
  );

  const totalPending = orders
    .filter((o) => o.status === 'DRAFT' || o.status === 'SENT')
    .reduce((s, o) => s + o.totalAmount, 0);

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch('/api/b2b/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: id, status: 'ACCEPTED', note: 'PO Confirmed by Manager' }),
      });
      if (res.ok) {
        toast.success('Purchase Order Confirmed!');
        setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: 'CONFIRMED' } : o)));
      }
    } catch {
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: 'CONFIRMED' } : o)));
    }
  };

  const handleCancel = async (id: string) => {
    try {
      const res = await fetch('/api/b2b/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: id, status: 'CANCELLED', note: 'PO Cancelled by Manager' }),
      });
      if (res.ok) {
        toast.success('Purchase Order Cancelled');
        setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: 'CANCELLED' } : o)));
      }
    } catch {
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: 'CANCELLED' } : o)));
    }
  };

  const handleCreatePO = async (data: any) => {
    try {
      const targetVendor = vendors.find((v) => v.id === data.vendor);
      const supplierId = targetVendor ? targetVendor.id : vendors[0]?.id || 'default-supplier';
      const vendorName = targetVendor ? targetVendor.name : data.vendor || 'Vendor';

      const res = await fetch('/api/b2b/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: 'cmoy7oxso0002ay70x6zmbtvj',
          supplierId,
          totalAmount: data.totalAmount,
          items: data.items.map((i: any) => ({
            name: i.name,
            quantity: i.qty,
            unitPrice: i.price,
            unit: i.unit,
          })),
        }),
      });

      const newOrderData = await res.json();
      toast.success(`Purchase Order created & sent to ${vendorName}!`);
      setShowForm(false);
      fetchData();
    } catch (err: any) {
      toast.error('Failed to create PO');
    }
  };

  return (
    <div className="space-y-5 pb-10 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShoppingCart size={14} className="text-cyan-400" />
            <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">Procurement · Purchasing</span>
            <span className="text-[8px] font-black text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">
              REAL-TIME SYNCED
            </span>
          </div>
          <h1 className="text-2xl font-black text-white">Purchase Orders</h1>
          <p className="text-xs text-slate-500 mt-0.5">₹{totalPending.toLocaleString('en-IN')} pending approval</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            title="Refresh Orders"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-cyan-600/20"
          >
            <Plus size={12} /> New PO
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {(['DRAFT', 'SENT', 'CONFIRMED', 'DELIVERED', 'CANCELLED'] as const).map((s) => {
          const count = orders.filter((o) => o.status === s).length;
          const colors: Record<string, string> = {
            DRAFT: 'text-slate-300 border-slate-700 bg-slate-800/40',
            SENT: 'text-blue-300 border-blue-500/20 bg-blue-900/20',
            CONFIRMED: 'text-amber-300 border-amber-500/20 bg-amber-900/20',
            DELIVERED: 'text-emerald-300 border-emerald-500/20 bg-emerald-900/20',
            CANCELLED: 'text-rose-300 border-rose-500/20 bg-rose-900/20',
          };
          return (
            <div key={s} className={`rounded-2xl border p-4 ${colors[s]}`}>
              <p className="text-2xl font-black text-white">{count}</p>
              <p className="text-[9px] font-bold uppercase tracking-widest opacity-60 mt-1">{s}</p>
            </div>
          );
        })}
      </div>

      {/* Form */}
      {showForm && (
        <div className="rounded-2xl bg-slate-900/50 border border-white/5 p-5">
          <p className="text-sm font-black text-white mb-4">Create Purchase Order</p>
          <PurchaseOrderForm vendors={vendors.length > 0 ? vendors : [{ id: 'v1', name: 'Fresh Veggies Co.' }]} onClose={() => setShowForm(false)} onSubmit={handleCreatePO} />
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search PO or vendor…"
          className="w-full h-9 pl-9 pr-4 bg-slate-800/60 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20 gap-3 text-slate-500">
          <Loader2 size={20} className="animate-spin text-cyan-400" />
          <span className="text-sm font-bold">Loading purchase orders…</span>
        </div>
      ) : (
        <POList orders={filtered} onApprove={handleApprove} onCancel={handleCancel} />
      )}
    </div>
  );
}
