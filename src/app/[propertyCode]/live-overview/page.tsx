'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSidebar } from '@/context/sidebar-context';
import {
  LayoutGrid, ChefHat, Clock, CreditCard, UserCheck,
  Bike, ParkingSquare, Users, UserX, RefreshCw,
  IndianRupee, TrendingUp, Flame, CircleAlert,
  UtensilsCrossed, ShoppingBag, Zap, CheckCircle2,
  AlertTriangle, Timer, Coffee, Star, ArrowUp,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface TableData {
  id: string; name: string; status: string; capacity: number;
  activeOrder: {
    orderNo: string; grandTotal: number; guestCount: number;
    status: string; elapsedMinutes: number;
  } | null;
}
interface DashboardData {
  live: {
    totalTables: number; occupiedTables: number; vacantTables: number;
    activeKotCount: number; inProgressOrderCount: number; paymentPendingCount: number;
    tables: TableData[];
    activeDeliveries: {
      id: string; orderNo: string; grandTotal: number; orderType: string;
      tableNo: string | null; updatedAt: string; createdAt: string; status: string;
      deliveryCustomerName: string | null; deliveryAddress: string | null; deliveryPhone: string | null;
    }[];
  };
  today: {
    totalSales: number; invoiceCount: number; orderCount: number;
    totalCustomers: number; avgOrderValue: number;
    orderTypes: Record<string, { count: number; revenue: number }>;
    topItems: { productId: string; name: string; qty: number; revenue: number }[];
    recentSettled: {
      id: string; orderNo: string; grandTotal: number; orderType: string;
      tableNo: string | null; updatedAt: string; createdAt: string; status: string;
      deliveryCustomerName?: string | null; deliveryAddress?: string | null; deliveryPhone?: string | null;
    }[];
  };
  allTime: { totalCustomers: number; totalRevenue: number };
  staff: {
    totalActive: number; presentNow: number; notArrivedCount: number;
    attendanceToday: { id: string; name: string; designation: string; clockIn: string; clockOut: string | null; hoursWorked: number; stillPresent: boolean; type: string }[];
    notArrivedToday: { id: string; name: string; designation: string; type: string }[];
    locations: any[];
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (v: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);
const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
const fmtElapsed = (min: number) =>
  min >= 60 ? `${Math.floor(min / 60)}h ${min % 60}m` : `${min}m`;
const nowTime = () =>
  new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

const getKitchenStatusDetails = (status: string) => {
  switch (status) {
    case 'PENDING':
    case 'PLACED':
      return {
        label: '📥 Placed',
        color: '#a855f7', // purple
        icon: <Clock size={16} />,
      };
    case 'ACCEPTED':
      return {
        label: '🤝 Accepted',
        color: '#3b82f6', // blue
        icon: <Zap size={16} />,
      };
    case 'KOT_RUNNING':
      return {
        label: '🔴 KOT Running',
        color: '#f43f5e', // rose
        icon: <Flame size={16} />,
      };
    case 'IN_KITCHEN':
    case 'PREPARING':
      return {
        label: '🍳 In Kitchen',
        color: '#fbbf24', // amber
        icon: <ChefHat size={16} />,
      };
    case 'READY':
    case 'READY_TO_SERVE':
      return {
        label: '🍽️ Ready to Serve',
        color: '#10b981', // emerald
        icon: <UtensilsCrossed size={16} />,
      };
    case 'SERVED':
      return {
        label: '✅ Served',
        color: '#22c55e', // green
        icon: <CheckCircle2 size={16} />,
      };
    case 'BILL_PRINTED':
      return {
        label: '🧾 Bill Printed',
        color: '#fb923c', // orange
        icon: <CreditCard size={16} />,
      };
    default:
      return {
        label: status,
        color: '#94a3b8', // slate
        icon: <Coffee size={16} />,
      };
  }
};

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function LiveOverviewPage() {
  const router    = useRouter();
  const params    = useParams();
  const propertyCode = params?.propertyCode as string;
  const { setOpen } = useSidebar();

  const [data,         setData]         = useState<DashboardData | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [lastUpdated,  setLastUpdated]  = useState<Date | null>(null);
  const [authChecked,  setAuthChecked]  = useState(false);
  const [currentTime,  setCurrentTime]  = useState(nowTime());

  // Pagination states
  const [tablesPage,   setTablesPage]   = useState(1);
  const [kitchenPage,  setKitchenPage]  = useState(1);
  const [parkingPage,  setParkingPage]  = useState(1);
  const [deliveryPage, setDeliveryPage] = useState(1);
  const [staffPage,    setStaffPage]    = useState(1);

  const [kitchenTab, setKitchenTab] = useState<'ALL' | 'PLACED' | 'PREPARING' | 'READY' | 'SERVED'>('ALL');

  useEffect(() => { setOpen(false); }, [setOpen]);

  // Live clock
  useEffect(() => {
    const iv = setInterval(() => setCurrentTime(nowTime()), 1000);
    return () => clearInterval(iv);
  }, []);

  // Auth
  useEffect(() => {
    fetch('/api/auth/session').then(r => r.json()).then(d => {
      if (!d.authenticated) { router.push('/login'); return; }
      const role = d.user?.role;
      if (role !== 'POSSYSTEM' && role !== 'RESTAURANTS_ADMIN' && role !== 'SUPER_ADMIN') {
        router.push(`/${propertyCode}/operations`); return;
      }
      setAuthChecked(true);
    }).catch(() => router.push('/login'));
  }, [router, propertyCode]);

  const fetchData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res  = await fetch('/api/restaurant-dashboard');
      const json = await res.json();
      if (json.success) { setData(json.data); setLastUpdated(new Date()); }
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => {
    if (!authChecked) return;
    fetchData();
    const iv = setInterval(() => fetchData(), 30000);
    return () => clearInterval(iv);
  }, [authChecked, fetchData]);

  // ── Derived & Paginated Data ────────────────────────────────────────────────
  const kitchenTables  = (data?.live.tables ?? []).filter(t => t.activeOrder &&
    ['PENDING', 'PLACED', 'ACCEPTED', 'KOT_RUNNING', 'IN_KITCHEN', 'PREPARING', 'READY', 'READY_TO_SERVE', 'SERVED', 'BILL_PRINTED'].includes(t.activeOrder.status));
  const allParkingOrders = (data?.today.recentSettled ?? []).filter(o => o.orderType === 'PARKING');
  
  const activeDeliveries = data?.live.activeDeliveries ?? [];
  const settledDeliveries = (data?.today.recentSettled ?? []).filter(o => o.orderType === 'DELIVERY');
  const allDeliveryOrders = [...activeDeliveries, ...settledDeliveries];

  const presentStaff   = (data?.staff.attendanceToday ?? []).filter(r => r.stillPresent);

  // Category counts
  const countPlaced = kitchenTables.filter(t => ['PENDING', 'PLACED', 'ACCEPTED'].includes(t.activeOrder!.status)).length;
  const countPreparing = kitchenTables.filter(t => ['KOT_RUNNING', 'IN_KITCHEN', 'PREPARING'].includes(t.activeOrder!.status)).length;
  const countReady = kitchenTables.filter(t => ['READY', 'READY_TO_SERVE'].includes(t.activeOrder!.status)).length;
  const countServed = kitchenTables.filter(t => ['SERVED', 'BILL_PRINTED'].includes(t.activeOrder!.status)).length;

  const filteredKitchenTables = kitchenTables.filter(t => {
    if (kitchenTab === 'ALL') return true;
    if (kitchenTab === 'PLACED') return ['PENDING', 'PLACED', 'ACCEPTED'].includes(t.activeOrder!.status);
    if (kitchenTab === 'PREPARING') return ['KOT_RUNNING', 'IN_KITCHEN', 'PREPARING'].includes(t.activeOrder!.status);
    if (kitchenTab === 'READY') return ['READY', 'READY_TO_SERVE'].includes(t.activeOrder!.status);
    if (kitchenTab === 'SERVED') return ['SERVED', 'BILL_PRINTED'].includes(t.activeOrder!.status);
    return true;
  });

  // Pagination Configuration & Slicing
  const TABLES_PER_PAGE = 12;
  const KITCHEN_PER_PAGE = 4;
  const PARKING_PER_PAGE = 4;
  const DELIVERY_PER_PAGE = 2;
  const STAFF_PER_PAGE = 4;

  const totalTablesPages = Math.ceil((data?.live.tables ?? []).length / TABLES_PER_PAGE);
  const currentTablesPage = Math.min(tablesPage, Math.max(1, totalTablesPages));
  const displayedTables = (data?.live.tables ?? []).slice((currentTablesPage - 1) * TABLES_PER_PAGE, currentTablesPage * TABLES_PER_PAGE);

  const totalKitchenPages = Math.ceil(filteredKitchenTables.length / KITCHEN_PER_PAGE);
  const currentKitchenPage = Math.min(kitchenPage, Math.max(1, totalKitchenPages));
  const displayedKitchen = filteredKitchenTables.slice((currentKitchenPage - 1) * KITCHEN_PER_PAGE, currentKitchenPage * KITCHEN_PER_PAGE);

  const totalParkingPages = Math.ceil(allParkingOrders.length / PARKING_PER_PAGE);
  const currentParkingPage = Math.min(parkingPage, Math.max(1, totalParkingPages));
  const displayedParking = allParkingOrders.slice((currentParkingPage - 1) * PARKING_PER_PAGE, currentParkingPage * PARKING_PER_PAGE);

  const totalDeliveryPages = Math.ceil(allDeliveryOrders.length / DELIVERY_PER_PAGE);
  const currentDeliveryPage = Math.min(deliveryPage, Math.max(1, totalDeliveryPages));
  const displayedDelivery = allDeliveryOrders.slice((currentDeliveryPage - 1) * DELIVERY_PER_PAGE, currentDeliveryPage * DELIVERY_PER_PAGE);

  const totalStaffPages = Math.ceil(presentStaff.length / STAFF_PER_PAGE);
  const currentStaffPage = Math.min(staffPage, Math.max(1, totalStaffPages));
  const displayedStaff = presentStaff.slice((currentStaffPage - 1) * STAFF_PER_PAGE, currentStaffPage * STAFF_PER_PAGE);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (!authChecked || loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#080b12' }}>
      <div className="flex flex-col items-center gap-6">
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 rounded-full border-[3px] border-orange-500/15 border-t-orange-500 animate-spin" />
          <div className="absolute inset-3 rounded-full border-[2px] border-amber-400/10 border-t-amber-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <Zap size={22} className="text-orange-400" />
          </div>
        </div>
        <div className="text-center">
          <p className="text-white font-black text-sm">Loading Live Data</p>
          <p className="text-slate-600 text-[10px] font-bold uppercase tracking-[0.3em] mt-1">POS Live Overview</p>
        </div>
      </div>
    </div>
  );

  if (!data) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#080b12' }}>
      <div className="text-center space-y-4">
        <CircleAlert size={48} className="mx-auto text-rose-500 opacity-80" />
        <p className="text-rose-400 font-bold">Could not load data</p>
        <button onClick={() => fetchData(true)} className="px-6 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-sm font-bold hover:bg-rose-500/20 transition-all">
          Try Again
        </button>
      </div>
    </div>
  );

  const { live, today, staff } = data;
  const totalOrders  = Object.values(today.orderTypes).reduce((s, v) => s + v.count, 0);
  const parkingCount = today.orderTypes['PARKING']?.count ?? 0;
  const deliveryCount= today.orderTypes['DELIVERY']?.count ?? 0;
  const tableOccPct  = live.totalTables > 0 ? Math.round((live.occupiedTables / live.totalTables) * 100) : 0;

  return (
    <div className="min-h-screen text-white" style={{ background: 'linear-gradient(160deg, #080b12 0%, #0c0a14 50%, #080d12 100%)' }}>

      {/* ── Ambient atmosphere ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-1/4 w-[600px] h-[600px] rounded-full blur-[200px] opacity-40"
          style={{ background: 'radial-gradient(circle, rgba(251,146,60,0.08) 0%, transparent 70%)' }} />
        <div className="absolute top-1/2 -right-20 w-[400px] h-[400px] rounded-full blur-[160px] opacity-50"
          style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.06) 0%, transparent 70%)' }} />
        <div className="absolute -bottom-20 left-1/3 w-[500px] h-[500px] rounded-full blur-[180px] opacity-30"
          style={{ background: 'radial-gradient(circle, rgba(244,114,182,0.07) 0%, transparent 70%)' }} />
      </div>

      <div className="relative z-10 max-w-[1560px] mx-auto px-4 sm:px-6 py-3 space-y-3">

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* HEADER                                                           */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              {/* Live pill */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: 'rgba(251,146,60,0.1)', border: '1px solid rgba(251,146,60,0.2)' }}>
                <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" style={{ boxShadow: '0 0 8px rgba(251,146,60,0.8)' }} />
                <span className="text-[9px] font-black text-orange-400 uppercase tracking-[0.3em]">Live</span>
              </div>
              {/* Clock */}
              <span className="text-[13px] font-black text-slate-400 tabular-nums">{currentTime}</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight leading-none">
              <span style={{ background: 'linear-gradient(135deg, #fff 30%, #fb923c 80%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                POS Live Overview
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="hidden sm:block text-[10px] text-slate-700 font-bold">
                Last sync: {fmtTime(lastUpdated.toISOString())}
              </span>
            )}
            <button onClick={() => fetchData(true)} disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-bold transition-all disabled:opacity-40"
              style={{ background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.18)', color: refreshing ? '#fb923c' : '#94a3b8' }}>
              <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* TOP KPI BAR                                                      */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {[
            {
              label: 'Tables Occupied',
              value: `${live.occupiedTables}`,
              sub: `of ${live.totalTables} total`,
              icon: <LayoutGrid size={16} />,
              accent: '#fb923c',
              pct: tableOccPct,
            },
            {
              label: 'Kitchen KOTs',
              value: `${live.activeKotCount}`,
              sub: live.activeKotCount >= 5 ? '🔥 Very Busy!' : live.activeKotCount > 0 ? 'Active' : 'Clear',
              icon: <ChefHat size={16} />,
              accent: live.activeKotCount >= 5 ? '#f43f5e' : '#fbbf24',
              urgent: live.activeKotCount >= 5,
            },
            {
              label: 'In Progress',
              value: `${live.inProgressOrderCount}`,
              sub: 'Orders running',
              icon: <Clock size={16} />,
              accent: '#22d3ee',
            },
            {
              label: 'Pay Pending',
              value: `${live.paymentPendingCount}`,
              sub: live.paymentPendingCount > 0 ? '⚠️ Needs action' : 'All clear',
              icon: <CreditCard size={16} />,
              accent: live.paymentPendingCount > 0 ? '#fbbf24' : '#475569',
            },
            {
              label: 'Staff Present',
              value: `${staff.presentNow}`,
              sub: `${staff.notArrivedCount} not arrived`,
              icon: <UserCheck size={16} />,
              accent: '#34d399',
            },
            {
              label: "Today's Revenue",
              value: fmt(today.totalSales),
              sub: `${today.invoiceCount} bills raised`,
              icon: <IndianRupee size={16} />,
              accent: '#a78bfa',
              isText: true,
            },
          ].map((kpi, i) => (
            <div key={i}
              className={`relative rounded-2xl p-3 flex flex-col gap-1.5 overflow-hidden transition-all ${kpi.urgent ? 'animate-pulse' : ''}`}
              style={{ background: `linear-gradient(135deg, ${kpi.accent}10 0%, ${kpi.accent}04 100%)`, border: `1px solid ${kpi.accent}${kpi.urgent ? '40' : '18'}` }}>
              {/* Icon */}
              <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ background: `${kpi.accent}15`, color: kpi.accent }}>
                {kpi.icon}
              </div>
              {/* Value */}
              <p className={`font-black text-white leading-none ${kpi.isText ? 'text-sm' : 'text-xl'}`}>{kpi.value}</p>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: `${kpi.accent}90` }}>{kpi.label}</p>
                <p className="text-[9px] font-bold text-slate-600 mt-0.5">{kpi.sub}</p>
              </div>
              {/* Progress bar for tables */}
              {kpi.pct !== undefined && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <div className="h-full transition-all duration-700" style={{ width: `${kpi.pct}%`, background: kpi.accent }} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* 6 BIG BOXES                                                      */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">

          {/* ════ BOX 1 — TABLES ═══════════════════════════════════════════ */}
          <PosBox num="01" title="Tables" icon={<LayoutGrid size={17} />} accent="#fb923c"
            badge={`${live.occupiedTables} / ${live.totalTables}`}
            badgeLabel="Occupied"
            subtitle={`${live.vacantTables} vacant · ${live.paymentPendingCount} pay pending`}>

            {(data?.live.tables ?? []).length === 0
              ? <EmptyBox icon={<LayoutGrid size={28} />} text="No tables configured" accent="#fb923c" />
              : <>
                  {/* Occupancy strip */}
                  <div className="flex items-center gap-2 mb-3 p-2.5 rounded-xl" style={{ background: 'rgba(251,146,60,0.06)', border: '1px solid rgba(251,146,60,0.12)' }}>
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${tableOccPct}%`, background: 'linear-gradient(90deg, #fb923c, #f97316)' }} />
                    </div>
                    <span className="text-[10px] font-black text-orange-400 shrink-0">{tableOccPct}% Full</span>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                    {displayedTables.map(table => {
                      const o         = table.activeOrder;
                      const isVacant  = table.status === 'VACANT';
                      const isPending = o?.status === 'PAYMENT_AWAITING_APPROVAL';
                      const isLong    = (o?.elapsedMinutes || 0) > 60;
                      const isHold    = table.status === 'HOLD';
                      const accent    = isPending ? '#fbbf24' : isLong ? '#f43f5e' : isHold ? '#64748b' : !isVacant ? '#fb923c' : '#34d399';
                      return (
                        <div key={table.id} className="rounded-xl p-2 flex flex-col gap-1 transition-all duration-300"
                          style={{ background: `${accent}08`, border: `1px solid ${accent}28` }}>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-white">{table.name}</span>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: accent, boxShadow: !isVacant ? `0 0 4px ${accent}` : 'none' }} />
                          </div>
                          {!isVacant && o ? (
                            <>
                              <p className="text-[11px] font-black text-white">{fmt(o.grandTotal)}</p>
                              <div className="flex items-center justify-between">
                                <span className="text-[8px] text-slate-600 font-bold">{o.guestCount}p</span>
                                <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full"
                                  style={{ background: isLong ? 'rgba(244,63,94,0.2)' : 'rgba(255,255,255,0.05)', color: isLong ? '#f43f5e' : '#64748b' }}>
                                  {fmtElapsed(o.elapsedMinutes)}
                                </span>
                              </div>
                            </>
                          ) : (
                            <p className="text-[9px] font-bold text-slate-700">
                              {isHold ? '⏸ Hold' : `${table.capacity} seats`}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <Pagination
                    currentPage={currentTablesPage}
                    totalPages={totalTablesPages}
                    onPageChange={setTablesPage}
                    accent="#fb923c"
                  />

                  <div className="flex flex-wrap gap-3 mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    {[['#34d399','Vacant'],['#fb923c','Occupied'],['#fbbf24','Pay Pending'],['#f43f5e','Long Wait (60m+)']].map(([c,l]) => (
                      <div key={l} className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ background: c }} />
                        <span className="text-[9px] font-bold text-slate-600">{l}</span>
                      </div>
                    ))}
                  </div>
                </>
            }
          </PosBox>

          {/* ════ BOX 2 — KITCHEN ══════════════════════════════════════════ */}
          <PosBox num="02" title="Kitchen" icon={<ChefHat size={17} />}
            accent={live.activeKotCount >= 5 ? '#f43f5e' : '#fbbf24'}
            badge={`${live.activeKotCount}`}
            badgeLabel="KOTs Active"
            subtitle={`${live.inProgressOrderCount} orders in progress`}
            urgent={live.activeKotCount >= 5}>

            {kitchenTables.length === 0
              ? <EmptyBox icon={<Coffee size={28} />} text="Kitchen is clear — no active orders" accent="#fbbf24" />
              : <div className="flex flex-col h-full gap-3">
                  {/* Status Group Tabs */}
                  <div className="grid grid-cols-5 gap-1 p-1 bg-white/[0.03] rounded-xl border border-white/5">
                    {([
                      { key: 'ALL', label: 'All', count: kitchenTables.length, color: '#fbbf24' },
                      { key: 'PLACED', label: 'Placed', count: countPlaced, color: '#a855f7' },
                      { key: 'PREPARING', label: 'Prep', count: countPreparing, color: '#f43f5e' },
                      { key: 'READY', label: 'Ready', count: countReady, color: '#10b981' },
                      { key: 'SERVED', label: 'Served', count: countServed, color: '#22c55e' }
                    ] as const).map(tab => {
                      const isActive = kitchenTab === tab.key;
                      return (
                        <button
                          key={tab.key}
                          onClick={() => {
                            setKitchenTab(tab.key);
                            setKitchenPage(1);
                          }}
                          className={`py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${
                            isActive
                              ? 'bg-white/10 text-white shadow-sm'
                              : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.01]'
                          }`}
                          style={{
                            border: isActive ? `1px solid rgba(255, 255, 255, 0.1)` : '1px solid transparent'
                          }}
                        >
                          <span className="truncate">{tab.label}</span>
                          <span
                            className="px-1.5 py-0.5 rounded-full text-[8px] font-black shrink-0"
                            style={{
                              background: isActive ? `${tab.color}25` : 'rgba(255,255,255,0.05)',
                              color: tab.color
                            }}
                          >
                            {tab.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {filteredKitchenTables.length === 0 ? (
                    <div className="py-8 text-center bg-white/[0.01] rounded-2xl border border-white/5">
                      <Coffee size={20} className="mx-auto text-slate-700 mb-1.5" />
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">No orders in this category</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {displayedKitchen.map(table => {
                        const o = table.activeOrder!;
                        const statusDetails = getKitchenStatusDetails(o.status);
                        const accent = statusDetails.color;
                        const label = statusDetails.label;
                        const isUrgent  = o.elapsedMinutes > 30;
                        return (
                          <div key={table.id} className="rounded-xl p-2.5 flex items-center gap-2.5 transition-all"
                            style={{ background: `${accent}08`, border: `1px solid ${accent}${isUrgent ? '40' : '20'}` }}>
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                              style={{ background: `${accent}15`, color: accent }}>
                              {statusDetails.icon}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="text-[12px] font-black text-white">Table {table.name}</p>
                                <span className="text-[8px] font-black px-2 py-0.5 rounded-full" style={{ background: `${accent}15`, color: accent }}>
                                  {label}
                                </span>
                              </div>
                              <p className="text-[9px] text-slate-500 font-bold">#{o.orderNo} · {o.guestCount} guests</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-sm font-black text-white">{fmt(o.grandTotal)}</p>
                              <p className="text-[9px] font-black" style={{ color: isUrgent ? '#f43f5e' : '#64748b' }}>
                                {isUrgent && '⚠️ '}{fmtElapsed(o.elapsedMinutes)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <Pagination
                    currentPage={currentKitchenPage}
                    totalPages={totalKitchenPages}
                    onPageChange={setKitchenPage}
                    accent={live.activeKotCount >= 5 ? '#f43f5e' : '#fbbf24'}
                  />

                  {/* Status Legend */}
                  <div className="flex flex-wrap gap-2 mt-1 pt-2.5" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    {[
                      { label: 'Placed', color: '#a855f7' },
                      { label: 'Accepted', color: '#3b82f6' },
                      { label: 'KOT Running', color: '#f43f5e' },
                      { label: 'In Kitchen', color: '#fbbf24' },
                      { label: 'Ready', color: '#10b981' }
                    ].map(leg => (
                      <div key={leg.label} className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: leg.color }} />
                        <span className="text-[8px] font-bold text-slate-600">{leg.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
            }

            <div className="mt-3 pt-3 grid grid-cols-3 gap-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              {[['KOTs', live.activeKotCount, '#fbbf24'], ['Orders', live.inProgressOrderCount, '#22d3ee'], ['Pay Due', live.paymentPendingCount, '#f43f5e']].map(([l,v,c]) => (
                <div key={String(l)} className="rounded-xl p-2 text-center" style={{ background: `${c}06`, border: `1px solid ${c}15` }}>
                  <p className="text-xl font-black" style={{ color: String(c) }}>{String(v)}</p>
                  <p className="text-[8px] font-black uppercase tracking-widest text-slate-600 mt-0.5">{String(l)}</p>
                </div>
              ))}
            </div>
          </PosBox>

          {/* ════ BOX 3 — PARKING ══════════════════════════════════════════ */}
          <PosBox num="03" title="Parking Orders" icon={<ParkingSquare size={17} />} accent="#34d399"
            badge={`${parkingCount}`}
            badgeLabel="Today"
            subtitle={`Revenue: ${fmt(today.orderTypes['PARKING']?.revenue ?? 0)}`}>

            {allParkingOrders.length === 0
              ? <EmptyBox icon={<ParkingSquare size={28} />} text="No parking orders today" accent="#34d399" />
              : <div className="space-y-2">
                  {displayedParking.map(order => (
                    <div key={order.id} className="flex items-center justify-between p-3 rounded-xl"
                      style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.18)' }}>
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: 'rgba(52,211,153,0.14)', color: '#34d399' }}>
                          <ParkingSquare size={14} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-black text-white">Order #{order.orderNo}</p>
                          <p className="text-[9px] text-slate-600 font-bold">
                            {order.tableNo ? `Spot ${order.tableNo}` : 'Parking Area'} · {fmtTime(order.updatedAt)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <p className="text-[12px] font-black" style={{ color: '#34d399' }}>{fmt(order.grandTotal)}</p>
                        <span className="text-[8px] font-black px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399' }}>Settled</span>
                      </div>
                    </div>
                  ))}

                  <Pagination
                    currentPage={currentParkingPage}
                    totalPages={totalParkingPages}
                    onPageChange={setParkingPage}
                    accent="#34d399"
                  />
                </div>
            }

            <div className="mt-2 pt-2 flex items-center justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <div>
                <p className="text-[8px] font-black uppercase tracking-widest text-slate-600">Total Revenue</p>
                <p className="text-xl font-black" style={{ color: '#34d399' }}>{fmt(today.orderTypes['PARKING']?.revenue ?? 0)}</p>
              </div>
              <div className="text-right">
                <p className="text-[8px] font-black uppercase tracking-widest text-slate-600">Orders Today</p>
                <p className="text-xl font-black text-white">{parkingCount}</p>
              </div>
            </div>
          </PosBox>

          {/* ════ BOX 4 — DELIVERY ═════════════════════════════════════════ */}
          <PosBox num="04" title="Home Delivery" icon={<Bike size={17} />} accent="#22d3ee"
            badge={`${deliveryCount}`}
            badgeLabel="Delivered"
            subtitle={`Revenue: ${fmt(today.orderTypes['DELIVERY']?.revenue ?? 0)}`}>

            {allDeliveryOrders.length === 0
              ? <EmptyBox icon={<Bike size={28} />} text="No deliveries today" accent="#22d3ee" />
              : <div className="space-y-2">
                  {displayedDelivery.map((order, idx) => {
                    const isActive = ['PENDING', 'PLACED', 'ACCEPTED', 'KOT_RUNNING', 'IN_KITCHEN', 'PREPARING', 'READY', 'READY_TO_SERVE', 'OUT_FOR_DELIVERY'].includes(order.status || '');
                    
                    // Style color scheme based on status
                    let statusColor = '#22d3ee'; // cyan
                    let statusBg = 'rgba(34,211,238,0.12)';
                    let statusLabel = '✓ Done';
                    
                    if (isActive) {
                      if (['PENDING', 'PLACED'].includes(order.status || '')) {
                        statusColor = '#a855f7'; // purple
                        statusLabel = '📥 Placed';
                      } else if (order.status === 'ACCEPTED') {
                        statusColor = '#3b82f6'; // blue
                        statusLabel = '🤝 Accepted';
                      } else if (['KOT_RUNNING', 'IN_KITCHEN', 'PREPARING'].includes(order.status || '')) {
                        statusColor = '#f43f5e'; // rose/red
                        statusLabel = '🍳 Prep';
                      } else if (['READY', 'READY_TO_SERVE'].includes(order.status || '')) {
                        statusColor = '#10b981'; // emerald
                        statusLabel = '🍽️ Ready';
                      } else if (order.status === 'OUT_FOR_DELIVERY') {
                        statusColor = '#fbbf24'; // amber
                        statusLabel = '🛵 Out';
                      }
                      statusBg = `${statusColor}15`;
                    } else {
                      statusColor = '#10b981'; // emerald for settled/done
                      statusBg = 'rgba(16,185,129,0.1)';
                    }

                    return (
                      <div key={order.id} className="flex flex-col gap-2 p-3 rounded-xl transition-all"
                        style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${isActive ? statusColor : 'rgba(255,255,255,0.05)'}22` }}>
                        
                        {/* Top row: Order Number, Status, Price */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-slate-400">#{order.orderNo.slice(-6)}</span>
                            <span className="text-[8px] font-black px-2 py-0.5 rounded-full animate-pulse" style={{ background: statusBg, color: statusColor }}>
                              {statusLabel}
                            </span>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-[11px] font-black text-white">{fmt(order.grandTotal)}</p>
                          </div>
                        </div>

                        {/* Customer details row */}
                        <div className="flex flex-col gap-1 min-w-0">
                          {order.deliveryCustomerName ? (
                            <p className="text-[11px] font-black text-slate-100 truncate">
                              👤 {order.deliveryCustomerName}
                            </p>
                          ) : (
                            <p className="text-[10px] font-bold text-slate-500">👤 Guest Customer</p>
                          )}
                          
                          {order.deliveryAddress ? (
                            <p className="text-[9px] text-slate-400 font-bold leading-tight line-clamp-2">
                              📍 {order.deliveryAddress}
                            </p>
                          ) : (
                            <p className="text-[9px] text-slate-600 font-bold italic">📍 Address not specified</p>
                          )}
                          
                          {order.deliveryPhone && (
                            <p className="text-[9px] text-slate-500 font-mono mt-0.5">
                              📞 {order.deliveryPhone}
                            </p>
                          )}
                        </div>

                        {/* Bottom row: Time stamp */}
                        <div className="flex items-center justify-between mt-1 text-[8px] text-slate-600 font-bold">
                          <span>{fmtTime(order.updatedAt || order.createdAt)}</span>
                          {isActive && (
                            <span className="text-slate-500">Active</span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  <Pagination
                    currentPage={currentDeliveryPage}
                    totalPages={totalDeliveryPages}
                    onPageChange={setDeliveryPage}
                    accent="#22d3ee"
                  />
                </div>
            }

            <div className="mt-2 pt-2 flex items-center justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <div>
                <p className="text-[8px] font-black uppercase tracking-widest text-slate-600">Total Revenue</p>
                <p className="text-xl font-black" style={{ color: '#22d3ee' }}>{fmt(today.orderTypes['DELIVERY']?.revenue ?? 0)}</p>
              </div>
              <div className="text-right">
                <p className="text-[8px] font-black uppercase tracking-widest text-slate-600">Orders Today</p>
                <p className="text-xl font-black text-white">{deliveryCount}</p>
              </div>
            </div>
          </PosBox>

          {/* ════ BOX 5 — STAFF ════════════════════════════════════════════ */}
          <PosBox num="05" title="Staff on Duty" icon={<Users size={17} />} accent="#a78bfa"
            badge={`${staff.presentNow} / ${staff.totalActive}`}
            badgeLabel="Present"
            subtitle={`${staff.notArrivedCount} not arrived · ${staff.attendanceToday.filter(r => !r.stillPresent).length} clocked out`}>

            <div className="grid grid-cols-3 gap-1.5 mb-2">
              {[
                { label: 'Present', val: staff.presentNow, c: '#34d399', icon: '✅' },
                { label: 'Left', val: staff.attendanceToday.filter(r => !r.stillPresent).length, c: '#fbbf24', icon: '🔄' },
                { label: 'Absent', val: staff.notArrivedCount, c: '#f43f5e', icon: '❌' },
              ].map(s => (
                <div key={s.label} className="rounded-xl p-2 text-center" style={{ background: `${s.c}08`, border: `1px solid ${s.c}20` }}>
                  <p className="text-lg font-black" style={{ color: s.c }}>{s.val}</p>
                  <p className="text-[8px] font-bold text-slate-600 mt-0.5">{s.icon} {s.label}</p>
                </div>
              ))}
            </div>

            {staff.totalActive > 0 && (
              <div className="mb-2 p-2 rounded-xl" style={{ background: 'rgba(167,139,250,0.05)', border: '1px solid rgba(167,139,250,0.1)' }}>
                <div className="flex justify-between text-[8px] font-black text-slate-600 mb-1 uppercase tracking-widest">
                  <span>Attendance Today</span>
                  <span style={{ color: '#a78bfa' }}>{Math.round((staff.presentNow / staff.totalActive) * 100)}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <div className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${(staff.presentNow / staff.totalActive) * 100}%`, background: 'linear-gradient(90deg, #a78bfa, #8b5cf6)' }} />
                </div>
              </div>
            )}

            <div className="space-y-1">
              {displayedStaff.length === 0
                ? <EmptyBox icon={<UserCheck size={18} />} text="No staff clocked in yet" accent="#a78bfa" />
                : displayedStaff.map(rec => (
                    <div key={rec.id} className="flex items-center gap-2 p-2 rounded-xl transition-all"
                      style={{ background: 'rgba(167,139,250,0.05)', border: '1px solid rgba(167,139,250,0.12)' }}>
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0"
                        style={{ background: 'rgba(167,139,250,0.15)', color: '#a78bfa' }}>
                        {rec.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold text-slate-200 truncate">{rec.name}</p>
                        <p className="text-[8px] text-slate-600 font-bold truncate">{rec.designation || rec.type}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[9px] font-black" style={{ color: '#a78bfa' }}>{fmtTime(rec.clockIn)}</p>
                        <p className="text-[8px] text-slate-700 font-bold">{rec.hoursWorked}h</p>
                      </div>
                    </div>
                  ))
              }

              <Pagination
                currentPage={currentStaffPage}
                totalPages={totalStaffPages}
                onPageChange={setStaffPage}
                accent="#a78bfa"
              />
            </div>

            {staff.notArrivedToday.length > 0 && (
              <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <p className="text-[8px] font-black uppercase tracking-widest mb-2 flex items-center gap-1" style={{ color: '#f43f5e' }}>
                  <UserX size={9} /> Not Arrived Yet
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {staff.notArrivedToday.slice(0, 5).map(s => (
                    <span key={s.id} className="text-[9px] font-bold px-2.5 py-1 rounded-full"
                      style={{ background: 'rgba(244,63,94,0.08)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.2)' }}>
                      {s.name}
                    </span>
                  ))}
                  {staff.notArrivedCount > 5 && (
                    <span className="text-[9px] font-bold px-2.5 py-1 rounded-full text-slate-600"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      +{staff.notArrivedCount - 5} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </PosBox>

          {/* ════ BOX 6 — TODAY'S BUSINESS ═════════════════════════════════ */}
          <PosBox num="06" title="Today's Business" icon={<TrendingUp size={17} />} accent="#f472b6"
            badge={fmt(today.totalSales)}
            badgeLabel="Revenue"
            subtitle={`${today.invoiceCount} bills · ${today.totalCustomers} guests`}>

            {/* Revenue card */}
            <div className="rounded-xl p-3 mb-3"
              style={{ background: 'linear-gradient(135deg, rgba(244,114,182,0.12) 0%, rgba(167,139,250,0.06) 100%)', border: '1px solid rgba(244,114,182,0.2)' }}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[8px] font-black uppercase tracking-widest mb-1" style={{ color: 'rgba(244,114,182,0.7)' }}>💰 Today's Revenue</p>
                  <p className="text-2xl font-black text-white leading-none">{fmt(today.totalSales)}</p>
                  <p className="text-[9px] font-bold mt-1 text-slate-500">
                    Avg: <span className="text-white font-black">{fmt(today.avgOrderValue)}</span>
                  </p>
                </div>
                <div className="p-1.5 rounded-xl" style={{ background: 'rgba(244,114,182,0.12)', color: '#f472b6' }}>
                  <ArrowUp size={14} />
                </div>
              </div>
              <div className="mt-2 pt-2 grid grid-cols-2 gap-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div>
                  <p className="text-[8px] font-black uppercase tracking-widest text-slate-600">Bills</p>
                  <p className="text-lg font-black text-white">{today.invoiceCount}</p>
                </div>
                <div>
                  <p className="text-[8px] font-black uppercase tracking-widest text-slate-600">Guests</p>
                  <p className="text-lg font-black text-white">{today.totalCustomers}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2 mb-2">
              {[
                { key: 'DINE_IN',  label: 'Dine In',      icon: <UtensilsCrossed size={10}/>, c: '#fb923c' },
                { key: 'TAKEAWAY', label: 'Takeaway',      icon: <ShoppingBag size={10}/>,    c: '#fbbf24' },
                { key: 'DELIVERY', label: 'Delivery',      icon: <Bike size={10}/>,           c: '#22d3ee' },
                { key: 'PARKING',  label: 'Parking',       icon: <ParkingSquare size={10}/>,  c: '#34d399' },
              ].map(({ key, label, icon, c }) => {
                const d   = today.orderTypes[key] || { count: 0, revenue: 0 };
                const pct = totalOrders > 0 ? Math.round((d.count / totalOrders) * 100) : 0;
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span style={{ color: c }}>{icon}</span>
                        <span className="text-[10px] font-black text-slate-300">{label}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[9px] font-black" style={{ color: c }}>{d.count} orders</span>
                        <span className="text-[9px] font-bold text-slate-600">{fmt(d.revenue)}</span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                      <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, background: c }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Top items */}
            {today.topItems.length > 0 && (
              <div className="pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <p className="text-[8px] font-black uppercase tracking-widest text-slate-600 mb-2 flex items-center gap-1">
                  <Star size={8} /> Top Selling Today
                </p>
                <div className="space-y-2">
                  {today.topItems.slice(0, 3).map((item, i) => {
                    const pct = Math.round((item.qty / (today.topItems[0]?.qty || 1)) * 100);
                    return (
                      <div key={item.productId}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[8px] font-black text-slate-700 shrink-0">#{i+1}</span>
                            <span className="text-[10px] font-bold text-slate-300 truncate">{item.name}</span>
                          </div>
                          <span className="text-[9px] font-black shrink-0 ml-2" style={{ color: '#f472b6' }}>{item.qty} sold</span>
                        </div>
                        <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #f472b6, #a78bfa)' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </PosBox>

        </div>

        {/* Footer */}
        <p className="text-center text-[9px] text-slate-800 font-bold pb-3 tracking-widest uppercase">
          POS Live Overview · Auto-refresh every 30s · {lastUpdated ? `Last: ${fmtTime(lastUpdated.toISOString())}` : 'Loading…'}
        </p>
      </div>
    </div>
  );
}

// ─── PosBox ───────────────────────────────────────────────────────────────────
function PosBox({ num, title, icon, accent, badge, badgeLabel, subtitle, urgent, children }: {
  num: string; title: string; icon: React.ReactNode;
  accent: string; badge?: string; badgeLabel?: string;
  subtitle?: string; urgent?: boolean; children: React.ReactNode;
}) {
  return (
    <div className="relative rounded-3xl flex flex-col overflow-hidden transition-all duration-300 hover:translate-y-[-2px]"
      style={{
        background: `linear-gradient(150deg, ${accent}07 0%, rgba(10,10,18,0.8) 100%)`,
        border: `1px solid ${accent}${urgent ? '35' : '14'}`,
        boxShadow: urgent
          ? `0 0 40px ${accent}18, 0 0 0 1px ${accent}10`
          : `0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 ${accent}08`,
      }}>

      {/* Urgent shimmer */}
      {urgent && (
        <div className="absolute inset-0 rounded-3xl pointer-events-none animate-ping opacity-[0.04]"
          style={{ background: accent }} />
      )}

      {/* Big number watermark */}
      <span className="absolute top-3 right-4 text-[56px] font-black leading-none select-none pointer-events-none"
        style={{ color: `${accent}0c` }}>
        {num}
      </span>

      {/* Header */}
      <div className="px-4 pt-4 pb-2.5 space-y-2">
        <div className="flex items-center justify-between">
          <div className="p-2.5 rounded-2xl" style={{ background: `${accent}12`, color: accent }}>
            {icon}
          </div>
          {badge && (
            <div className="text-right">
              <p className="text-lg font-black" style={{ color: accent }}>{badge}</p>
              {badgeLabel && <p className="text-[8px] font-black uppercase tracking-widest text-slate-600 -mt-0.5">{badgeLabel}</p>}
            </div>
          )}
        </div>
        <div>
          <h2 className="text-[15px] font-black text-white leading-none">{title}</h2>
          {subtitle && <p className="text-[9px] font-bold text-slate-600 mt-1">{subtitle}</p>}
        </div>
      </div>

      {/* Separator */}
      <div className="h-px mx-4" style={{ background: `linear-gradient(90deg, transparent, ${accent}18, transparent)` }} />

      {/* Body */}
      <div className="flex-1 p-4 pt-3">{children}</div>
    </div>
  );
}

// ─── EmptyBox ─────────────────────────────────────────────────────────────────
function EmptyBox({ icon, text, accent }: { icon: React.ReactNode; text: string; accent: string }) {
  return (
    <div className="py-5 flex flex-col items-center gap-2">
      <div style={{ color: `${accent}25` }}>{icon}</div>
      <p className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ color: `${accent}35` }}>{text}</p>
    </div>
  );
}

// ─── Pagination ──────────────────────────────────────────────────────────────
function Pagination({ currentPage, totalPages, onPageChange, accent }: {
  currentPage: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  accent: string;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-1.5 mt-3 pt-2.5 animate-fadeIn" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
        const isActive = page === currentPage;
        return (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className="w-6 h-6 rounded-lg text-[10px] font-black transition-all flex items-center justify-center hover:scale-105 active:scale-95"
            style={{
              background: isActive ? accent : 'rgba(255,255,255,0.03)',
              color: isActive ? '#080b12' : 'rgba(255,255,255,0.6)',
              border: `1px solid ${isActive ? accent : 'rgba(255,255,255,0.08)'}`,
              boxShadow: isActive ? `0 0 10px ${accent}40` : 'none',
            }}
          >
            {page}
          </button>
        );
      })}
    </div>
  );
}
