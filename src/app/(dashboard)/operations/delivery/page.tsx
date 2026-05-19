"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  RefreshCcw, Plus, Utensils, CarFront, Home,
  Clock, Phone, MapPin, Truck, Receipt, Eye, Power,
  X, ChevronLeft, ShoppingBag, ClipboardList, Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { QRModal } from '@/components/tables/QRModal';
import { KotSlipModal, KotSlipData } from '@/components/kots/KotSlipModal';
import { BillModal, BillData } from '@/components/billing/BillModal';
import { MarkWasteModal } from '@/components/modals/MarkWasteModal';
import { customersApi } from '@/lib/api/customers';

interface Order {
  id: string;
  orderNo: string;
  orderType: string;
  status: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  grandTotal: number;
  createdAt: string;
  deliveryCustomerName: string | null;
  deliveryPhone: string | null;
  deliveryAddress: string | null;
  deliveryInstructions: string | null;
  driverId: string | null;
  driver?: {
    id: string;
    name: string;
    vehicleNumber: string | null;
  } | null;
  items: any[];
}

export default function DeliveryOperationsPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [paymentModes, setPaymentModes] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [propertyData, setPropertyData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isFinalInvoice, setIsFinalInvoice] = useState(false);

  // Selected Order
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const selectedOrder = orders.find(o => o.id === selectedOrderId);

  // Modals Data
  const [kotSlip, setKotSlip] = useState<KotSlipData | null>(null);
  const [billData, setBillData] = useState<BillData | null>(null);
  const [isWasteModalOpen, setIsWasteModalOpen] = useState(false);
  const [wasteOrderData, setWasteOrderData] = useState<any | null>(null);
  const [wasteLoading, setWasteLoading] = useState(false);

  const fetchData = async () => {
    try {
      const [ordersRes, driversRes, pmRes, custRes, propRes] = await Promise.all([
        fetch('/api/pos-orders?status=in_progress'),
        fetch('/api/drivers'),
        fetch('/api/payment-modes'),
        fetch('/api/customers'),
        fetch('/api/admin/properties')
      ]);

      const oData = await ordersRes.json();
      const dData = await driversRes.json();
      const pData = await pmRes.json();
      const cData = await custRes.json();
      const prData = await propRes.json();

      if (oData.success) {
        // Filter orders only for Home Delivery type
        const activeDeliveries = (oData.data as any[]).filter(
          (o: any) => o.orderType === 'DELIVERY'
        );
        setOrders(activeDeliveries);
      }
      if (dData.success) setDrivers(dData.data);
      if (pData.success) setPaymentModes(pData.data);
      if (cData.success || Array.isArray(cData)) setCustomers(Array.isArray(cData) ? cData : cData.data || []);
      if (prData.success && prData.data.length > 0) setPropertyData(prData.data[0]);

    } catch (error) {
      console.error('Failed to fetch delivery data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      if (!billData && !kotSlip && !isWasteModalOpen) fetchData();
    }, 5000);
    return () => clearInterval(interval);
  }, [billData, kotSlip, isWasteModalOpen]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const fetchOrderPrintData = async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/print`);
      const result = await res.json();
      return result.success ? result.data : null;
    } catch (err) {
      console.error('Failed to fetch print data:', err);
      return null;
    }
  };

  const handlePrintKOT = async (orderItem: Order) => {
    const order = await fetchOrderPrintData(orderItem.id);
    if (!order || !order.kotTickets?.length) return;

    const allItems: any[] = [];
    order.kotTickets.forEach((kot: any) => {
      kot.items.forEach((item: any) => {
        const name = item.itemName || item.product?.name || 'Unknown Item';
        const existing = allItems.find(i => i.name === name);
        if (existing) {
          existing.quantity += item.quantity;
        } else {
          allItems.push({
            name: name,
            quantity: item.quantity,
            notes: item.notes
          });
        }
      });
    });

    const latestKot = order.kotTickets[order.kotTickets.length - 1];
    setKotSlip({
      kotNo: latestKot.kotNo,
      orderNo: order.orderNo,
      tableNo: `Delivery (${orderItem.deliveryCustomerName || 'Guest'})`,
      orderType: order.orderType,
      createdAt: latestKot.createdAt,
      items: allItems
    });
  };

  const handlePrintBill = async (orderItem: Order) => {
    const order = await fetchOrderPrintData(orderItem.id);
    if (!order) return;

    setIsFinalInvoice(false);
    setBillData({
      orderNo: order.orderNo,
      tableNo: `Delivery (${orderItem.deliveryCustomerName || 'Guest'})`,
      items: order.items.map((i: any) => ({
        id: i.productId || i.id,
        name: i.product.name,
        quantity: i.quantity,
        price: i.unitPrice || i.product.sellingPrice,
        hsnCode: i.product.hsnCode
      })),
      subtotal: order.subtotal,
      tax: order.taxAmount || (order.subtotal * 0.05),
      grandTotal: order.grandTotal,
      createdAt: order.createdAt,
      tableId: undefined,
      orderId: order.id
    } as any);
  };

  const handleMarkWaste = async (orderItem: Order) => {
    setWasteLoading(true);
    try {
      const order = await fetchOrderPrintData(orderItem.id);
      if (!order) return;
      setWasteOrderData(order);
      setIsWasteModalOpen(true);
    } catch (error) {
      console.error('Waste modal error:', error);
    } finally {
      setWasteLoading(false);
    }
  };

  const handleSettleOrder = async (paymentModeId: string, guestId?: string, driverId?: string) => {
    if (!billData?.orderId) return;

    try {
      const res = await fetch('/api/orders/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: billData.orderId,
          paymentModeId: paymentModeId,
          guestId: guestId,
          driverId: driverId || selectedOrder?.driverId || undefined,
          totalAmount: billData.grandTotal,
          items: billData.items.map((item: any) => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.price
          }))
        })
      });

      const result = await res.json();
      if (result.success) {
        setIsFinalInvoice(true);
        fetchData();
        setSelectedOrderId(null);
      } else {
        alert(result.message || 'Settlement failed');
      }
    } catch (error) {
      console.error('Settlement error:', error);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/pos-orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Failed to update order status:', err);
    }
  };

  const handleAssignRider = async (orderId: string, dId: string) => {
    try {
      const res = await fetch(`/api/pos-orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId: dId }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Failed to assign driver:', err);
    }
  };

  const handleResetOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to force-reset this order status?')) return;
    try {
      await fetch(`/api/pos-orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'OPEN' }),
      });
      fetchData();
      setSelectedOrderId(null);
    } catch { /* silent */ }
  };

  const getElapsedTime = (createdAtStr: string) => {
    const minDiff = Math.floor(
      (Date.now() - new Date(createdAtStr).getTime()) / 60000
    );
    if (minDiff < 1) return 'Just now';
    return `${minDiff} min${minDiff > 1 ? 's' : ''} ago`;
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'OPEN':
      case 'PENDING':
      case 'PLACED':
        return 'bg-blue-400/20 text-blue-300 border-blue-400/30';
      case 'IN_KITCHEN':
      case 'KOT_RUNNING':
        return 'bg-amber-400/20 text-amber-300 border-amber-400/30 animate-pulse';
      case 'READY':
        return 'bg-teal-400/20 text-teal-300 border-teal-400/30 shadow-[0_0_15px_rgba(45,212,191,0.2)]';
      case 'SETTLED':
        return 'bg-green-400/20 text-green-300 border-green-400/30';
      default:
        return 'bg-slate-400/20 text-slate-300 border-slate-400/30';
    }
  };

  const stats = {
    total: orders.length,
    preparing: orders.filter(o => o.status === 'IN_KITCHEN' || o.status === 'KOT_RUNNING').length,
    ready: orders.filter(o => o.status === 'READY').length,
    dispatched: orders.filter(o => o.status === 'SETTLED').length,
    revenue: orders.reduce((sum, o) => sum + (o.grandTotal || 0), 0)
  };

  return (
    <div className="flex flex-col min-h-full gap-6 p-4 rounded-3xl" style={{
      background: 'radial-gradient(circle at top right, #13141f, #050505 70%)',
      boxShadow: 'inset 0 0 100px rgba(0,0,0,0.8)'
    }}>
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/5 backdrop-blur-xl p-5 rounded-3xl border border-white/10 shadow-2xl transition-all">
        <div className="flex items-center gap-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.push('/operations')}
            className="rounded-2xl h-12 w-12 p-0 flex items-center justify-center bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          >
            <ChevronLeft size={20} />
          </Button>
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
            <Home size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight animate-pulse">Home Delivery Area</h1>
            <p className="text-[10px] font-bold text-indigo-300/70 uppercase tracking-[0.2em] mt-0.5">Real-time Guest Order Tracking</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Stats Bar */}
          <div className="flex bg-black/40 backdrop-blur-md p-1 rounded-2xl border border-white/5 shadow-inner">
            <div className="px-4 py-2 text-center border-r border-white/10">
              <p className="text-[9px] font-black text-white/40 uppercase tracking-wider">Active</p>
              <p className="text-sm font-black text-white">{stats.total}</p>
            </div>
            <div className="px-4 py-2 text-center border-r border-white/10">
              <p className="text-[9px] font-black text-amber-400/80 uppercase tracking-wider">Preparing</p>
              <p className="text-sm font-black text-amber-400">{stats.preparing}</p>
            </div>
            <div className="px-4 py-2 text-center border-r border-white/10">
              <p className="text-[9px] font-black text-teal-400/80 uppercase tracking-wider">Ready</p>
              <p className="text-sm font-black text-teal-400">{stats.ready}</p>
            </div>
            <div className="px-4 py-2 text-center border-r border-white/10">
              <p className="text-[9px] font-black text-emerald-400/80 uppercase tracking-wider">Dispatched</p>
              <p className="text-sm font-black text-emerald-400">{stats.dispatched}</p>
            </div>
            <div className="px-4 py-2 text-center">
              <p className="text-[9px] font-black text-indigo-400/80 uppercase tracking-wider">Total Value</p>
              <p className="text-sm font-black text-indigo-400">₹{Math.round(stats.revenue)}</p>
            </div>
          </div>

          <Button
            className="rounded-2xl h-12 px-6 font-black uppercase text-[10px] tracking-widest gap-2 flex items-center shadow-[0_0_20px_rgba(99,102,241,0.4)] bg-indigo-500 hover:bg-indigo-400 text-white border border-indigo-400/50 transition-all"
            onClick={() => router.push('/billing?type=DELIVERY')}
          >
            <Plus size={16} />
            New Delivery Order
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleRefresh}
            loading={refreshing}
            className="rounded-2xl h-12 w-12 p-0 flex items-center justify-center bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          >
            <RefreshCcw size={18} className={refreshing ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0 bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden transition-colors relative z-10">

        {/* Selected Slot Action Toolbar */}
        {selectedOrder && (
          <div className="px-6 py-4 bg-indigo-600 text-white flex items-center justify-between shadow-2xl animate-in slide-in-from-top duration-300 z-50">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center font-black">
                  #{selectedOrder.orderNo.slice(-4)}
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-70 leading-tight">Selected Delivery</p>
                  <p className="text-sm font-black uppercase tracking-tight leading-tight">
                    {selectedOrder.deliveryCustomerName || 'Guest'}
                  </p>
                </div>
              </div>

              <div className="h-10 w-[1px] bg-white/20" />

              {/* Status controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleUpdateStatus(selectedOrder.id, 'IN_KITCHEN')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                    selectedOrder.status === 'IN_KITCHEN' || selectedOrder.status === 'KOT_RUNNING'
                      ? 'bg-amber-500 text-white shadow-md'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  Preparing
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedOrder.id, 'READY')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                    selectedOrder.status === 'READY'
                      ? 'bg-teal-500 text-white shadow-md'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  Ready
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedOrder.id, 'SETTLED')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                    selectedOrder.status === 'SETTLED'
                      ? 'bg-emerald-500 text-white shadow-md'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  Dispatched
                </button>

                <div className="h-10 w-[1px] bg-white/20 mx-2" />

                {/* Rider Selector inside toolbar */}
                <select
                  value={selectedOrder.driverId || ''}
                  onChange={(e) => handleAssignRider(selectedOrder.id, e.target.value)}
                  className="bg-white/10 border border-white/20 text-xs font-bold rounded-xl px-3 py-1.5 text-white focus:outline-none focus:ring-2 focus:ring-pos-primary"
                >
                  <option value="" className="text-slate-900">No Rider Assigned</option>
                  {drivers.map((drv: any) => (
                    <option key={drv.id} value={drv.id} className="text-slate-900">
                      {drv.name} ({drv.vehicleNumber || 'Bike'})
                    </option>
                  ))}
                </select>

                <div className="h-10 w-[1px] bg-white/20 mx-2" />

                <button
                  onClick={() => handlePrintKOT(selectedOrder)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                >
                  <ClipboardList size={14} />
                  KOT
                </button>

                <button
                  onClick={() => handlePrintBill(selectedOrder)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-pos-primary hover:bg-red-600 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg animate-pulse"
                >
                  <Receipt size={14} />
                  Settle Bill
                </button>

                <button
                  onClick={() => router.push(`/billing?orderId=${selectedOrder.id}`)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-white text-indigo-650 hover:bg-indigo-50 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-md"
                >
                  <Eye size={14} />
                  Open POS
                </button>

                <button
                  onClick={() => handleResetOrder(selectedOrder.id)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-900/30 hover:bg-slate-900/50 rounded-xl text-xs font-black uppercase tracking-widest transition-all text-slate-300"
                >
                  <Power size={14} />
                  Reset
                </button>

                <button
                  onClick={() => handleMarkWaste(selectedOrder)}
                  disabled={wasteLoading}
                  className="flex items-center gap-1 px-3 py-1.5 bg-red-500/20 text-red-100 hover:bg-red-500 hover:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all border border-red-500/30"
                >
                  <Trash2 size={14} />
                  Waste
                </button>
              </div>
            </div>

            <button
              onClick={() => setSelectedOrderId(null)}
              className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        )}

        {/* Legend */}
        <div className="px-6 py-3 bg-[#0a0c10] flex flex-wrap gap-6 border-b border-white/5">
          {[
            { label: 'Placed / Pending', color: 'bg-blue-400 shadow-[0_0_8px_#60a5fa]' },
            { label: 'In Kitchen / Preparing', color: 'bg-amber-400 shadow-[0_0_8px_#fbbf24]' },
            { label: 'Ready to Deliver', color: 'bg-teal-400 shadow-[0_0_8px_#2dd4bf]' },
            { label: 'Dispatched / On The Way', color: 'bg-green-400 shadow-[0_0_8px_#34d399]' },
          ].map((item: any) => (
            <div key={item.label} className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${item.color}`}></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Grid View of simultaneous delivery customers */}
        <div className="flex-1 p-6 overflow-y-auto max-h-[600px] min-h-[400px]">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-48 w-full rounded-2xl animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {orders.map(order => {
                const isSelected = selectedOrderId === order.id;
                return (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrderId(isSelected ? null : order.id)}
                    className={`bg-[#0d0f14]/80 border transition-all duration-300 p-5 rounded-[2rem] flex flex-col justify-between gap-4 cursor-pointer hover:-translate-y-1 hover:shadow-xl ${
                      isSelected
                        ? 'border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.2)] bg-indigo-950/20'
                        : 'border-white/5 hover:border-white/10'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">
                          ORDER NO: #{order.orderNo.slice(-6)}
                        </span>
                        <h3 className="text-sm font-black text-white leading-tight truncate max-w-[140px]">
                          {order.deliveryCustomerName || 'Walk-in Customer'}
                        </h3>
                      </div>
                      <Badge className={`rounded-xl border px-2 py-0.5 text-[8px] font-black tracking-widest ${getStatusStyle(order.status)}`}>
                        {order.status === 'SETTLED' ? 'DISPATCHED' : order.status}
                      </Badge>
                    </div>

                    {/* Middle: Details */}
                    <div className="space-y-2.5 text-[10px] font-semibold text-slate-350">
                      {order.deliveryPhone && (
                        <div className="flex items-center gap-2">
                          <Phone size={11} className="text-indigo-400" />
                          <span className="truncate">{order.deliveryPhone}</span>
                        </div>
                      )}
                      {order.deliveryAddress && (
                        <div className="flex items-start gap-2">
                          <MapPin size={11} className="text-red-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-2 leading-relaxed">{order.deliveryAddress}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Clock size={11} className="text-amber-400" />
                        <span>Placed {getElapsedTime(order.createdAt)}</span>
                      </div>
                    </div>

                    <div className="h-px bg-white/5 w-full" />

                    {/* Footer: Rider + Total */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400">
                        <Truck size={12} className="text-indigo-400" />
                        <span className="truncate max-w-[110px]">
                          {order.driver?.name ? `${order.driver.name}` : 'Unassigned'}
                        </span>
                      </div>
                      <span className="text-xs font-black text-indigo-300">
                        ₹{Math.round(order.grandTotal || 0)}
                      </span>
                    </div>
                  </div>
                );
              })}

              {orders.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-20 text-center gap-3">
                  <ShoppingBag size={48} className="text-slate-700 animate-bounce" />
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">No active delivery orders in progress</p>
                  <Button
                    variant="secondary"
                    className="rounded-xl mt-2 h-10"
                    onClick={() => router.push('/billing?type=DELIVERY')}
                  >
                    Place a New Order
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <KotSlipModal kot={kotSlip} onClose={() => setKotSlip(null)} />
      <BillModal
        bill={billData}
        onClose={() => {
          setBillData(null);
          setIsFinalInvoice(false);
        }}
        onSettle={handleSettleOrder}
        paymentModes={paymentModes}
        customers={customers}
        onAddCustomer={async (data: { firstName: string; lastName: string; mobile: string }) => {
          const newGuest = await customersApi.create(data);
          if (newGuest) {
            fetchData();
            return newGuest;
          }
          throw new Error('Failed to add customer');
        }}
        isProforma={!isFinalInvoice}
      />
      <MarkWasteModal
        isOpen={isWasteModalOpen}
        onClose={() => {
          setIsWasteModalOpen(false);
          setWasteOrderData(null);
        }}
        order={wasteOrderData}
        table={null}
        onSuccess={() => {
          fetchData();
          setSelectedOrderId(null);
        }}
      />
    </div>
  );
}
