"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  RefreshCcw, Plus, Home,
  Clock, Phone, MapPin, Truck, Receipt, Eye, Power,
  X, ChevronLeft, ShoppingBag, ClipboardList, Trash2,
  Zap, Map, AlertTriangle, DollarSign, CheckCircle2,
  Navigation, Activity, ChevronDown, ChevronUp, Wifi, Users
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { useSidebar } from '@/context/sidebar-context';
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
  updatedAt: string;
  deliveryCustomerName: string | null;
  deliveryPhone: string | null;
  deliveryAddress: string | null;
  deliveryInstructions: string | null;
  deliveryLat: number | null;
  deliveryLng: number | null;
  driverId: string | null;
  deliveryRiderId?: string | null;
  driver?: { id: string; name: string; vehicleNumber: string | null; } | null;
  deliveryRider?: { id: string; fullName: string; phone: string | null; deliveryLat?: number | null; deliveryLng?: number | null; } | null;
  items: any[];
}

// ─── Status Config ─────────────────────────────────────────────────────────────
const STATUS_STEPS = [
  { key: 'PLACED',           label: 'Placed',          color: 'bg-blue-500',    text: 'text-blue-300',    bg: 'bg-blue-400/20 border-blue-400/30' },
  { key: 'ACCEPTED',         label: 'Accepted',         color: 'bg-indigo-500',  text: 'text-indigo-300',  bg: 'bg-indigo-400/20 border-indigo-400/30' },
  { key: 'IN_KITCHEN',       label: 'In Kitchen',       color: 'bg-amber-500',   text: 'text-amber-300',   bg: 'bg-amber-400/20 border-amber-400/30 animate-pulse' },
  { key: 'READY',            label: 'Ready',            color: 'bg-teal-500',    text: 'text-teal-300',    bg: 'bg-teal-400/20 border-teal-400/30 shadow-[0_0_15px_rgba(45,212,191,0.2)]' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', color: 'bg-purple-500',  text: 'text-purple-300',  bg: 'bg-purple-400/20 border-purple-400/30 animate-pulse' },
  { key: 'SETTLED',          label: 'Delivered',        color: 'bg-emerald-500', text: 'text-emerald-300', bg: 'bg-emerald-400/20 border-emerald-400/30' },
];

function getStatusConfig(status: string) {
  return STATUS_STEPS.find(s => s.key === status) || STATUS_STEPS[0];
}

function getElapsedMinutes(dateStr: string) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
}

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
  } catch { return dateStr; }
}

// ─── Live Rider Map (Leaflet) ─────────────────────────────────────────────────
function LiveRiderMap({ riders, orders }: { riders: any[]; orders: Order[] }) {
  const mapId = 'live-delivery-map';
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if ((window as any).L) { setLoaded(true); return; }
    if (!document.getElementById('leaflet-css')) {
      const l = document.createElement('link');
      l.id = 'leaflet-css'; l.rel = 'stylesheet';
      l.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(l);
    }
    const existing = document.getElementById('leaflet-js');
    if (!existing) {
      const s = document.createElement('script');
      s.id = 'leaflet-js';
      s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      s.onload = () => setLoaded(true);
      document.head.appendChild(s);
    } else {
      const ci = setInterval(() => { if ((window as any).L) { setLoaded(true); clearInterval(ci); } }, 100);
      return () => clearInterval(ci);
    }
  }, []);

  useEffect(() => {
    if (!loaded || !(window as any).L) return;
    const el = document.getElementById(mapId);
    if (!el) return;

    const L = (window as any).L;

    if (!mapRef.current) {
      const defaultLat = riders.find(r => r.deliveryLat)?.deliveryLat || 28.6139;
      const defaultLng = riders.find(r => r.deliveryLng)?.deliveryLng || 77.2090;
      mapRef.current = L.map(mapId, { zoomControl: true, attributionControl: false }).setView([defaultLat, defaultLng], 13);
      L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', { maxZoom: 20 }).addTo(mapRef.current);
    }

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Add rider markers (🛵)
    riders.forEach(rider => {
      if (!rider.deliveryLat || !rider.deliveryLng) return;
      const icon = L.divIcon({
        className: '',
        html: `<div style="background:#a855f7;border:3px solid white;border-radius:50%;width:38px;height:38px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(168,85,247,.6);font-size:18px;position:relative;">
          🛵
          <div style="position:absolute;inset:-6px;border-radius:50%;border:2px solid #a855f7;opacity:0.4;animation:ping 1s infinite;"></div>
        </div>`,
        iconSize: [38, 38], iconAnchor: [19, 19]
      });
      const m = L.marker([rider.deliveryLat, rider.deliveryLng], { icon })
        .addTo(mapRef.current)
        .bindPopup(`<b>🛵 ${rider.fullName || rider.name}</b><br/><small>${rider.vehicleNumber || 'Bike'}</small>`);
      markersRef.current.push(m);
    });

    // Add customer delivery pins (📍)
    orders
      .filter(o => o.deliveryLat && o.deliveryLng && o.status !== 'SETTLED')
      .forEach(order => {
        const cfg = getStatusConfig(order.status);
        const icon = L.divIcon({
          className: '',
          html: `<div style="background:#3b82f6;border:3px solid white;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(59,130,246,.5);font-size:16px;">🏠</div>`,
          iconSize: [34, 34], iconAnchor: [17, 17]
        });
        const m = L.marker([order.deliveryLat!, order.deliveryLng!], { icon })
          .addTo(mapRef.current)
          .bindPopup(`<b>#${order.orderNo}</b><br/>${order.deliveryCustomerName || 'Customer'}<br/><small>${order.deliveryAddress || ''}</small>`);
        markersRef.current.push(m);
      });

    setTimeout(() => mapRef.current?.invalidateSize(), 200);
  }, [loaded, riders, orders]);

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden">
      <div id={mapId} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function DeliveryOperationsPage() {
  const router = useRouter();
  const params = useParams();
  const propertyCode = params?.propertyCode as string;
  const p = propertyCode ? `/${propertyCode}` : '';
  const { setOpen } = useSidebar();

  useEffect(() => {
    setOpen(false);
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [setOpen]);

  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [paymentModes, setPaymentModes] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [propertyData, setPropertyData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isFinalInvoice, setIsFinalInvoice] = useState(false);
  const [showMap, setShowMap] = useState(true);
  const [autoAssigning, setAutoAssigning] = useState<string | null>(null);

  // Selected Order
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const selectedOrder = orders.find(o => o.id === selectedOrderId);

  // Modals
  const [kotSlip, setKotSlip] = useState<KotSlipData | null>(null);
  const [billData, setBillData] = useState<BillData | null>(null);
  const [isWasteModalOpen, setIsWasteModalOpen] = useState(false);
  const [wasteOrderData, setWasteOrderData] = useState<any | null>(null);
  const [wasteLoading, setWasteLoading] = useState(false);

  // Filter
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const fetchData = useCallback(async () => {
    try {
      const [ordersRes, driversRes, pmRes, custRes, propRes] = await Promise.all([
        fetch('/api/pos-orders?status=in_progress'),
        fetch('/api/public/driver?action=list-drivers'),
        fetch('/api/payment-modes'),
        fetch('/api/customers'),
        fetch('/api/admin/properties')
      ]);

      const [oData, dData, pData, cData, prData] = await Promise.all([
        ordersRes.json(), driversRes.json(), pmRes.json(), custRes.json(), propRes.json()
      ]);

      if (oData.success) {
        const deliveries = (oData.data as any[]).filter((o: any) => o.orderType === 'DELIVERY');
        setOrders(deliveries);
      }
      if (dData.success) setDrivers(dData.data);
      if (pData.success) setPaymentModes(pData.data);
      if (cData.success || Array.isArray(cData)) setCustomers(Array.isArray(cData) ? cData : cData.data || []);
      if (prData.success && prData.data.length > 0) {
        const slugifyInline = (str: string) => str.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
        const activeProp = prData.data.find((p: any) => 
          p.code === propertyCode || 
          slugifyInline(p.name) === propertyCode || 
          p.id === propertyCode
        );
        setPropertyData(activeProp || prData.data[0]);
      }
    } catch (error) {
      console.error('Failed to fetch delivery data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [propertyCode]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      if (!billData && !kotSlip && !isWasteModalOpen) fetchData();
    }, 15000); // 15s refresh for live updates
    return () => clearInterval(interval);
  }, [billData, kotSlip, isWasteModalOpen, fetchData]);

  // Auto-assign nearest available rider to an order
  const handleAutoAssign = async (orderId: string) => {
    setAutoAssigning(orderId);
    try {
      // Find riders with fewest active deliveries
      const riderOrderCounts: Record<string, number> = {};
      drivers.forEach(d => { riderOrderCounts[d.id] = 0; });
      orders.filter(o => o.status !== 'SETTLED').forEach(o => {
        const rid = o.deliveryRiderId || o.driverId;
        if (rid && riderOrderCounts[rid] !== undefined) riderOrderCounts[rid]++;
      });
      const bestRider = drivers
        .filter(d => d.isActive)
        .sort((a, b) => (riderOrderCounts[a.id] || 0) - (riderOrderCounts[b.id] || 0))[0];

      if (!bestRider) { alert('No available riders found.'); return; }

      const res = await fetch(`/api/pos-orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId: bestRider.id })
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error('Auto-assign error:', err);
    } finally {
      setAutoAssigning(null);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/pos-orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) fetchData();
    } catch (err) { console.error('Status update error:', err); }
  };

  const handleAssignRider = async (orderId: string, dId: string) => {
    try {
      const res = await fetch(`/api/pos-orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId: dId }),
      });
      if (res.ok) fetchData();
    } catch (err) { console.error('Assign rider error:', err); }
  };

  const fetchOrderPrintData = async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/print`);
      const result = await res.json();
      return result.success ? result.data : null;
    } catch { return null; }
  };

  const handlePrintKOT = async (orderItem: Order) => {
    const order = await fetchOrderPrintData(orderItem.id);
    if (!order || !order.kotTickets?.length) return;
    const allItems: any[] = [];
    order.kotTickets.forEach((kot: any) => {
      kot.items.forEach((item: any) => {
        const name = item.itemName || item.product?.name || 'Unknown Item';
        const existing = allItems.find(i => i.name === name);
        if (existing) { existing.quantity += item.quantity; }
        else { allItems.push({ name, quantity: item.quantity, notes: item.notes }); }
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
      orderId: order.id,
      driverId: order.driverId || order.deliveryRiderId || undefined,
      staffMemberId: order.staffMemberId || undefined,
      guestCount: order.guestCount || 1
    } as any);
  };

  const handleMarkWaste = async (orderItem: Order) => {
    setWasteLoading(true);
    try {
      const order = await fetchOrderPrintData(orderItem.id);
      if (!order) return;
      setWasteOrderData(order);
      setIsWasteModalOpen(true);
    } finally { setWasteLoading(false); }
  };

  const handleSettleOrder = async (paymentModeId: string, guestId?: string, driverId?: string) => {
    if (!billData?.orderId) return;
    try {
      const res = await fetch('/api/orders/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: billData.orderId,
          paymentModeId,
          guestId,
          driverId: driverId || selectedOrder?.driverId || undefined,
          totalAmount: billData.grandTotal,
          items: billData.items.map((item: any) => ({
            id: item.id, name: item.name, quantity: item.quantity, unitPrice: item.price
          }))
        })
      });
      const result = await res.json();
      if (result.success) {
        setIsFinalInvoice(true);
        fetchData();
        setSelectedOrderId(null);
      } else { alert(result.message || 'Settlement failed'); }
    } catch (error) { console.error('Settlement error:', error); }
  };

  const handleResetOrder = async (orderId: string) => {
    if (!confirm('Force-reset this order status to OPEN?')) return;
    try {
      await fetch(`/api/pos-orders/${orderId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'OPEN' }),
      });
      fetchData();
      setSelectedOrderId(null);
    } catch { }
  };

  // Stats
  const stats = {
    total: orders.length,
    preparing: orders.filter(o => ['IN_KITCHEN', 'KOT_RUNNING', 'ACCEPTED'].includes(o.status)).length,
    ready: orders.filter(o => o.status === 'READY').length,
    outForDelivery: orders.filter(o => o.status === 'OUT_FOR_DELIVERY').length,
    delivered: orders.filter(o => o.status === 'SETTLED').length,
    revenue: orders.reduce((sum, o) => sum + (o.grandTotal || 0), 0),
    delayed: orders.filter(o => {
      const elapsed = getElapsedMinutes(o.updatedAt || o.createdAt);
      return elapsed > 30 && o.status !== 'SETTLED';
    }).length,
    unassigned: orders.filter(o => !o.deliveryRiderId && !o.driverId && o.status !== 'SETTLED').length,
  };

  // Active riders (those with current GPS data)
  const activeRiders = drivers.filter(d => d.deliveryLat && d.deliveryLng);

  // Filtered orders
  const filteredOrders = statusFilter === 'ALL' ? orders : orders.filter(o => o.status === statusFilter);

  return (
    <div className="w-full h-full flex flex-col gap-4 p-4 overflow-hidden" style={{
      background: 'radial-gradient(circle at top right, #0d0f1a, #050505 70%)',
    }}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 bg-slate-900/60 backdrop-blur-xl py-2 px-4 rounded-xl border border-slate-800/80 shadow-2xl">
        <div className="flex items-center gap-3">
          <Button
            variant="secondary" size="sm"
            onClick={() => router.push(`${p}/operations`)}
            className="rounded-xl h-9 w-9 p-0 flex items-center justify-center bg-slate-950/40 border-slate-800 text-white/70 hover:bg-slate-800/80 hover:text-white"
          >
            <ChevronLeft size={18} />
          </Button>
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Home size={18} />
          </div>
          <div>
            <h1 className="text-base font-black text-white tracking-tight flex items-center gap-1.5 leading-none">
              Delivery Operations
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </h1>
            <p className="text-[9px] font-bold text-indigo-300/60 uppercase tracking-[0.2em] mt-0.5 leading-none">Live Fleet Control</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Stats pills */}
          <div className="flex bg-slate-950/60 p-1 rounded-xl border border-slate-800/80 gap-1 flex-wrap md:flex-nowrap">
            {[
              { label: 'Active', value: stats.total, color: 'text-white', bg: 'bg-white/5 border-white/10' },
              { label: 'Cooking', value: stats.preparing, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
              { label: 'Ready', value: stats.ready, color: 'text-teal-400', bg: 'bg-teal-500/10 border-teal-500/20' },
              { label: 'On Way', value: stats.outForDelivery, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
              { label: 'Done', value: stats.delivered, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
              { label: 'Revenue', value: `₹${Math.round(stats.revenue)}`, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20' },
            ].map(s => (
              <div key={s.label} className={`px-2 py-1 rounded-lg border text-center ${s.bg}`}>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wide leading-tight">{s.label}</p>
                <p className={`text-xs font-extrabold ${s.color} mt-0.5 leading-none`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Alert badges */}
          {stats.delayed > 0 && (
            <div className="flex items-center gap-1 bg-red-500/10 border border-red-500/20 px-2.5 py-1.5 rounded-lg animate-pulse">
              <AlertTriangle size={11} className="text-red-400" />
              <span className="text-[9px] font-bold text-red-400 uppercase tracking-wider">{stats.delayed} Delayed</span>
            </div>
          )}
          {stats.unassigned > 0 && (
            <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5 rounded-lg">
              <Truck size={11} className="text-amber-400" />
              <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider">{stats.unassigned} Unassigned</span>
            </div>
          )}

          <button
            onClick={() => setShowMap(v => !v)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all border ${showMap ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/25' : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/60'}`}
          >
            <Map size={11} /> {showMap ? 'Hide' : 'Show'} Map
          </button>

          <button
            onClick={() => router.push(`${p}/operations/delivery/zones`)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all border border-slate-800 bg-slate-950/40 text-slate-300 hover:bg-slate-800/60 hover:text-white"
          >
            <MapPin size={11} className="text-purple-400" /> Zones
          </button>

          <button
            onClick={() => router.push(`${p}/operations/delivery/analytics`)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all border border-slate-800 bg-slate-950/40 text-slate-300 hover:bg-slate-800/60 hover:text-white"
          >
            <Activity size={11} className="text-emerald-400" /> Analytics
          </button>

          <button
            onClick={() => router.push(`${p}/operations/delivery/riders`)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all border border-slate-800 bg-slate-950/40 text-slate-300 hover:bg-slate-800/60 hover:text-white"
          >
            <Users size={11} className="text-rose-400" /> Riders
          </button>

          <Button
            className="rounded-lg h-8 px-3 font-bold uppercase text-[9px] tracking-wider gap-1.5 flex items-center bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500/30 shadow-[0_0_12px_rgba(99,102,241,0.2)]"
            onClick={() => router.push(`${p}/billing?type=DELIVERY`)}
          >
            <Plus size={12} /> New Order
          </Button>

          <Button
            variant="secondary" size="sm"
            onClick={() => { setRefreshing(true); fetchData(); }}
            loading={refreshing}
            className="rounded-lg h-8 w-8 p-0 flex items-center justify-center bg-slate-950/40 border-slate-800 text-slate-400 hover:text-white"
          >
            <RefreshCcw size={14} className={refreshing ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>

      {/* ── Live Rider Map ────────────────────────────────────────────────── */}
      {showMap && (
        <div className="rounded-2xl overflow-hidden border border-slate-800 bg-black/40 relative" style={{ height: 180 }}>
          <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-2 bg-black/85 backdrop-blur-md border border-slate-800 rounded-lg px-2 py-1">
            <Wifi size={11} className="text-green-400 animate-pulse" />
            <span className="text-[9px] font-bold text-white/70 uppercase tracking-wider">Live Map • Updates every 15s</span>
            <span className="ml-2 px-1.5 py-0.5 bg-purple-500/20 text-purple-300 text-[9px] font-bold rounded border border-purple-500/30">
              {activeRiders.length} riders tracked
            </span>
          </div>
          <LiveRiderMap riders={drivers} orders={orders} />
        </div>
      )}

      {/* ── Selected Order Toolbar ──────────────────────────────────────── */}
      {selectedOrder && (
        <div className="px-5 py-3 bg-indigo-600 text-white flex flex-wrap items-center justify-between gap-3 rounded-2xl shadow-2xl animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center font-black text-sm">
                #{selectedOrder.orderNo.slice(-4)}
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest opacity-70">Selected</p>
                <p className="text-sm font-black leading-tight">{selectedOrder.deliveryCustomerName || 'Guest'}</p>
              </div>
            </div>

            <div className="h-8 w-px bg-white/20" />

            {/* Status pipeline buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {['ACCEPTED', 'IN_KITCHEN', 'READY', 'OUT_FOR_DELIVERY', 'SETTLED'].map(s => {
                const cfg = getStatusConfig(s);
                const isActive = selectedOrder.status === s;
                return (
                  <button
                    key={s}
                    onClick={() => handleUpdateStatus(selectedOrder.id, s)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wide transition-all ${isActive ? `${cfg.color} text-white shadow-md` : 'bg-white/10 hover:bg-white/20'}`}
                  >
                    {cfg.label}
                  </button>
                );
              })}

              <div className="h-8 w-px bg-white/20 mx-1" />

              {/* Rider selector */}
              <select
                value={selectedOrder.deliveryRiderId || selectedOrder.driverId || ''}
                onChange={e => handleAssignRider(selectedOrder.id, e.target.value)}
                className="bg-white/10 border border-white/20 text-[10px] font-bold rounded-xl px-3 py-1.5 text-white focus:outline-none"
              >
                <option value="" className="text-slate-900">No Rider</option>
                {drivers.map((drv: any) => (
                  <option key={drv.id} value={drv.id} className="text-slate-900">
                    {drv.name} ({drv.vehicleNumber || 'Bike'})
                  </option>
                ))}
              </select>

              <div className="h-8 w-px bg-white/20 mx-1" />

              <button onClick={() => handlePrintKOT(selectedOrder)} className="flex items-center gap-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-wide">
                <ClipboardList size={12} /> KOT
              </button>
              <button onClick={() => handlePrintBill(selectedOrder)} className="flex items-center gap-1 px-3 py-1.5 bg-pos-primary hover:bg-red-600 rounded-xl text-[10px] font-black uppercase tracking-wide shadow-lg animate-pulse">
                <Receipt size={12} /> Settle
              </button>
              <button onClick={() => router.push(`${p}/billing?orderId=${selectedOrder.id}`)} className="flex items-center gap-1 px-3 py-1.5 bg-white text-indigo-700 hover:bg-indigo-50 rounded-xl text-[10px] font-black uppercase tracking-wide">
                <Eye size={12} /> POS
              </button>
              <button onClick={() => handleResetOrder(selectedOrder.id)} className="flex items-center gap-1 px-3 py-1.5 bg-slate-800/50 hover:bg-slate-800 rounded-xl text-[10px] font-black uppercase tracking-wide text-slate-300">
                <Power size={12} /> Reset
              </button>
              <button
                onClick={() => handleMarkWaste(selectedOrder)}
                disabled={wasteLoading}
                className="flex items-center gap-1 px-3 py-1.5 bg-red-500/20 text-red-200 hover:bg-red-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wide border border-red-500/30"
              >
                <Trash2 size={12} /> Waste
              </button>
            </div>
          </div>

          <button onClick={() => setSelectedOrderId(null)} className="w-9 h-9 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
      )}

      {/* ── Status Filter Bar ──────────────────────────────────────────── */}
      <div className="flex gap-2 flex-wrap bg-slate-950/40 p-1 rounded-2xl border border-slate-800/80 w-fit">
        {[{ key: 'ALL', label: `All (${orders.length})` }, ...STATUS_STEPS.map(s => ({ key: s.key, label: `${s.label} (${orders.filter(o => o.status === s.key).length})` }))].map(f => {
          const isActive = statusFilter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${isActive ? 'bg-indigo-600 text-white shadow-[0_0_12px_rgba(99,102,241,0.3)]' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* ── Order Grid ────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-0 bg-slate-900/60 backdrop-blur-2xl rounded-[2rem] border border-slate-800/80 shadow-xl overflow-hidden">
        <div className="flex-1 p-5 overflow-y-auto">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-52 w-full rounded-2xl bg-slate-800/40" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredOrders.map(order => {
                const isSelected = selectedOrderId === order.id;
                const cfg = getStatusConfig(order.status);
                const elapsed = getElapsedMinutes(order.updatedAt || order.createdAt);
                const isDelayed = elapsed > 30 && order.status !== 'SETTLED';
                const isUnassigned = !order.deliveryRiderId && !order.driverId;

                return (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrderId(isSelected ? null : order.id)}
                    className={`bg-slate-900/40 backdrop-blur-md border transition-all duration-300 p-4 rounded-2xl flex flex-col justify-between gap-3.5 cursor-pointer hover:-translate-y-0.5 hover:shadow-2xl relative overflow-hidden ${
                      isSelected ? 'border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.15)] bg-indigo-950/25'
                      : isDelayed ? 'border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.05)] bg-red-950/5'
                      : 'border-slate-800/80 hover:border-slate-700/80'
                    }`}
                  >
                    {/* Delayed accent line */}
                    {isDelayed && (
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-orange-500 animate-pulse" />
                    )}

                    {/* OUT_FOR_DELIVERY accent line */}
                    {order.status === 'OUT_FOR_DELIVERY' && (
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-indigo-500 animate-pulse" />
                    )}

                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          {isDelayed && (
                            <span className="relative flex h-1.5 w-1.5 shrink-0">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                            </span>
                          )}
                          {order.status === 'OUT_FOR_DELIVERY' && (
                            <span className="relative flex h-1.5 w-1.5 shrink-0">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-purple-500"></span>
                            </span>
                          )}
                          {order.status === 'READY' && (
                            <span className="relative flex h-1.5 w-1.5 shrink-0">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-500"></span>
                            </span>
                          )}
                          {['IN_KITCHEN', 'ACCEPTED'].includes(order.status) && (
                            <span className="relative flex h-1.5 w-1.5 shrink-0">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
                            </span>
                          )}
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
                            #{order.orderNo.slice(-6)}
                          </span>
                        </div>
                        <h3 className="text-sm font-black text-white leading-tight truncate max-w-[140px] mt-0.5">
                          {order.deliveryCustomerName || 'Walk-in'}
                        </h3>
                      </div>
                      <Badge className={`rounded-xl border px-2 py-0.5 text-[8px] font-black tracking-widest shrink-0 ${cfg.bg}`}>
                        {cfg.label}
                      </Badge>
                    </div>

                    <div className="space-y-1.5 text-[10px] font-bold text-slate-400">
                      {order.deliveryPhone && (
                        <div className="flex items-center gap-2">
                          <Phone size={11} className="text-slate-500 shrink-0" />
                          <span className="font-mono text-slate-300">{order.deliveryPhone}</span>
                        </div>
                      )}
                      {order.deliveryAddress && (
                        <div className="flex items-start gap-2">
                          <MapPin size={11} className="text-slate-500 shrink-0 mt-0.5" />
                          <span className="line-clamp-2 leading-relaxed text-slate-300">{order.deliveryAddress}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center gap-1.5">
                          <Clock size={11} className="text-slate-500 shrink-0" />
                          <span className="text-slate-400">{formatDate(order.createdAt)}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold border ${isDelayed ? 'bg-red-500/10 border-red-500/20 text-red-400 animate-pulse' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                          {elapsed < 1 ? 'Just now' : `${elapsed}m ago`}
                        </span>
                      </div>
                    </div>

                    {/* Items */}
                    {order.items?.length > 0 && (
                      <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/80 space-y-1 max-h-20 overflow-y-auto no-scrollbar">
                        {order.items.slice(0, 3).map((item: any, i: number) => (
                          <div key={i} className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                            <span className="truncate max-w-[130px] text-slate-300">{item.product?.name || item.name}</span>
                            <span className="text-indigo-400 font-mono">×{item.quantity}</span>
                          </div>
                        ))}
                        {order.items.length > 3 && (
                          <p className="text-[9px] text-slate-500 font-bold text-center mt-1 border-t border-slate-800/40 pt-1">
                            +{order.items.length - 3} more items
                          </p>
                        )}
                      </div>
                    )}

                    {/* Quick Accept */}
                    {(order.status === 'OPEN' || order.status === 'PENDING' || order.status === 'PLACED') && (
                      <button
                        onClick={e => { e.stopPropagation(); handleUpdateStatus(order.id, 'ACCEPTED'); }}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-black uppercase tracking-widest text-[9px] rounded-xl shadow flex items-center justify-center gap-1.5 animate-pulse transition-all"
                      >
                        ✓ Accept Order
                      </button>
                    )}

                    {/* Auto-assign if unassigned and order is accepted+ */}
                    {isUnassigned && !['OPEN', 'PENDING', 'PLACED', 'SETTLED'].includes(order.status) && (
                      <button
                        onClick={e => { e.stopPropagation(); handleAutoAssign(order.id); }}
                        disabled={autoAssigning === order.id}
                        className="w-full py-2.5 bg-amber-500/15 hover:bg-amber-500 border border-amber-500/20 text-amber-400 hover:text-white font-black uppercase tracking-widest text-[9px] rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95"
                      >
                        {autoAssigning === order.id ? (
                          <span className="animate-spin">⟳</span>
                        ) : <><Zap size={10} /> Auto-Assign Rider</>}
                      </button>
                    )}

                    <div className="h-px bg-slate-800/60 w-full" />

                    <div className="flex items-center justify-between mt-1 bg-slate-950/20 px-2.5 py-1.5 rounded-xl border border-slate-800/40">
                      <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400">
                        <Truck size={11} className="text-indigo-400" />
                        <span className="truncate max-w-[110px] text-slate-300">
                          {order.deliveryRider?.fullName || order.driver?.name || (
                            <span className="text-amber-500 font-bold">Unassigned</span>
                          )}
                        </span>
                      </div>
                      <span className="text-xs font-black text-indigo-400 font-mono">₹{Math.round(order.grandTotal || 0)}</span>
                    </div>
                  </div>
                );
              })}

              {filteredOrders.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-20 text-center gap-3">
                  <ShoppingBag size={48} className="text-slate-700 animate-bounce" />
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    {statusFilter === 'ALL' ? 'No active delivery orders' : `No orders with status: ${statusFilter}`}
                  </p>
                  <Button variant="secondary" className="rounded-xl mt-2 h-10" onClick={() => router.push(`${p}/billing?type=DELIVERY`)}>
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
        onClose={() => { setBillData(null); setIsFinalInvoice(false); }}
        onSettle={handleSettleOrder}
        paymentModes={paymentModes}
        customers={customers}
        onAddCustomer={async (data) => {
          const newGuest = await customersApi.create(data);
          if (newGuest) { fetchData(); return newGuest; }
          throw new Error('Failed to add customer');
        }}
        isProforma={!isFinalInvoice}
      />
      <MarkWasteModal
        isOpen={isWasteModalOpen}
        onClose={() => { setIsWasteModalOpen(false); setWasteOrderData(null); }}
        order={wasteOrderData}
        table={null}
        onSuccess={() => { fetchData(); setSelectedOrderId(null); }}
      />
    </div>
  );
}
