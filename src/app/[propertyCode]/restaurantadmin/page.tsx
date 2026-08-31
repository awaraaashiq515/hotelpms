'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSidebar } from '@/context/sidebar-context';
import {
  LayoutGrid, UtensilsCrossed, CheckCircle2, Clock, AlertTriangle,
  TrendingUp, ShoppingBag, Users, Bike, ParkingSquare,
  RefreshCw, ChefHat, CreditCard, Star, ArrowUpRight, UserCheck,
  UserX, MapPin, Wifi, WifiOff, Activity, IndianRupee, Timer,
  Package, Bell, CircleAlert, Flame, ThumbsUp, Languages, Building2, ChevronDown,
} from 'lucide-react';

// ──────────────────────────────────────────────────────────────────────────────
// Language strings — EN + HI
// ──────────────────────────────────────────────────────────────────────────────
const LANG = {
  en: {
    live:               'Live Operations',
    updatedAt:          (t: string) => `Updated at ${t}`,
    refresh:            'Refresh',
    attentionTitle:     'Attention Needed',
    allGood:            'All good! No issues right now.',
    liveStatus:         'Live Status Right Now',
    tableMap:           'Table Map — Which Tables Are Occupied',
    todayBusiness:      "Today's Business",
    topSelling:         'Top Selling Items Today',
    recentOrders:       'Recently Settled Orders',
    staffToday:         'Staff — Today\'s Status',
    allTimeRecord:      'All-Time Records',
    refresh30:          (t: string) => `Auto-refreshes every 30s · Last: ${t}`,
    // Live cards
    tablesOccupied:     'Tables Occupied',
    tablesVacant:       'Tables Vacant',
    kitchenKot:         'Kitchen KOTs',
    ordersInProgress:   'Orders In Progress',
    paymentPending:     'Payment Pending',
    staffPresent:       'Staff Present',
    // Sub texts
    availableNow:       'Available now',
    activeInKitchen:    'Active in kitchen',
    processingNow:      'Currently in process',
    waitingApproval:    'Waiting for approval',
    // Table status
    vacant:             '🟢 Vacant',
    occupied:           '🟣 Occupied',
    payPending:         '⏳ Pay Now',
    settleUrgent:       '🔴 Settle Urgently',
    onHold:             '⏸ On Hold',
    guests:             (n: number) => `${n} guest${n !== 1 ? 's' : ''}`,
    seats:              (n: number) => `${n} seats`,
    // Business
    todayRevenue:       "Today's Revenue",
    billsRaised:        (n: number) => `${n} bills raised`,
    totalOrders:        'Total Orders',
    today:              'Today',
    customersServed:    'Customers Served',
    totalCovers:        'Total covers',
    avgBill:            'Avg Bill Value',
    perBill:            'Per bill',
    ordersFrom:         '% of today\'s orders',
    soldToday:          'sold',
    noItemsSold:        'Nothing sold today yet',
    noSettled:          'No settled orders today',
    // Staff
    presentNow:         'Present ✅',
    clockedOut:         'Clocked Out 🔄',
    notArrived:         'Not Arrived ❌',
    tabPresent:         (n: number) => `Present (${n})`,
    tabAbsent:          (n: number) => `Not Arrived (${n})`,
    tabLocation:        (n: number) => `Location (${n})`,
    noAttendance:       'No clock-ins recorded today',
    allArrived:         'Everyone is here! 🎉',
    noLocation:         'No location data available',
    onDuty:             'On Duty',
    notClockedIn:       'Not clocked in yet',
    distFrom:           (m: number) => `${m}m from base`,
    locationNA:         'Location unavailable',
    lastSeen:           (t: string) => `Last seen: ${t}`,
    outOfRange:         'Out of range!',
    // Alerts
    alertPayPending:    (n: number) => `${n} table${n !== 1 ? 's' : ''} waiting for payment`,
    alertKitchenBusy:   (n: number) => `Kitchen has ${n} active KOTs — very busy!`,
    alertStaffMissing:  (n: number) => `${n} staff member${n !== 1 ? 's' : ''} not yet arrived`,
    alertLongWait:      (t: string) => `${t} — occupied for 60+ min`,
    // All-time
    allTimeRevenue:     'All-Time Revenue',
    allTimeCustomers:   'Total Customers (All Time)',
    // Order types
    dineIn:             'Dine In',
    takeaway:           'Takeaway',
    homeDelivery:       'Home Delivery',
    parking:            'Parking',
    orders:             'orders',
    ago:                (d: number) => d < 1 ? 'Just now' : d < 60 ? `${d}m ago` : `${Math.floor(d/60)}h ${d%60}m ago`,
  },
  hi: {
    live:               'Live Operations',
    updatedAt:          (t: string) => `${t} pe update hua`,
    refresh:            'Refresh Karo',
    attentionTitle:     'Dhyan Do',
    allGood:            'Sab theek hai! Abhi koi problem nahi.',
    liveStatus:         'Abhi Kya Ho Raha Hai',
    tableMap:           'Table Map — Kaun si Table Lagi Hai',
    todayBusiness:      'Aaj Ka Business',
    topSelling:         'Aaj Sabse Zyada Bika',
    recentOrders:       'Haal Ke Settle Orders',
    staffToday:         'Staff — Aaj Ka Haal',
    allTimeRecord:      'Sab Time Ka Record',
    refresh30:          (t: string) => `Har 30 second mein update hota hai · Aakhri: ${t}`,
    // Live cards
    tablesOccupied:     'Tables Lagi Hain',
    tablesVacant:       'Tables Khaali',
    kitchenKot:         'Kitchen Mein KOT',
    ordersInProgress:   'Orders Chal Rahe',
    paymentPending:     'Payment Baaki',
    staffPresent:       'Staff Aaya Hai',
    // Sub texts
    availableNow:       'Abhi available',
    activeInKitchen:    'Kitchen mein active',
    processingNow:      'Abhi process mein',
    waitingApproval:    'Wait kar rahe hain',
    // Table status
    vacant:             '🟢 Khaali',
    occupied:           '🟣 Lagi Hai',
    payPending:         '⏳ Pay Karen',
    settleUrgent:       '🔴 Jaldi Settle',
    onHold:             '⏸ Hold Pe',
    guests:             (n: number) => `${n} log`,
    seats:              (n: number) => `${n} seats`,
    // Business
    todayRevenue:       'Aaj Ki Kamai',
    billsRaised:        (n: number) => `${n} bill bane`,
    totalOrders:        'Kul Orders',
    today:              'Aaj',
    customersServed:    'Log Aaye',
    totalCovers:        'Total customers aaj',
    avgBill:            'Average Bill',
    perBill:            'Ek order ka',
    ordersFrom:         '% orders mein se',
    soldToday:          'bika',
    noItemsSold:        'Aaj abhi kuch nahi bika',
    noSettled:          'Abhi koi settle order nahi',
    // Staff
    presentNow:         'Aaya Hai ✅',
    clockedOut:         'Chala Gaya 🔄',
    notArrived:         'Nahi Aaya ❌',
    tabPresent:         (n: number) => `Aaya Hai (${n})`,
    tabAbsent:          (n: number) => `Nahi Aaya (${n})`,
    tabLocation:        (n: number) => `Location (${n})`,
    noAttendance:       'Aaj kisi ne abhi clock-in nahi kiya',
    allArrived:         'Sab aa gaye! Badhiya! 🎉',
    noLocation:         'Kisi ki location data nahi hai',
    onDuty:             'Duty Pe',
    notClockedIn:       'Abhi tak nahi aaya',
    distFrom:           (m: number) => `Base se ${m}m dur`,
    locationNA:         'Location nahi mil rahi',
    lastSeen:           (t: string) => `${t} dekha gaya`,
    outOfRange:         'Range se bahar hai!',
    // Alerts
    alertPayPending:    (n: number) => `${n} table pe payment ka wait hai`,
    alertKitchenBusy:   (n: number) => `Kitchen mein ${n} KOT active hain — busy hai!`,
    alertStaffMissing:  (n: number) => `${n} staff abhi tak nahi aaya`,
    alertLongWait:      (t: string) => `${t} — 60+ min se occupied hai`,
    // All-time
    allTimeRevenue:     'Total Kamai (Sab Time)',
    allTimeCustomers:   'Total Customers (Sab Time)',
    // Order types
    dineIn:             'Dine In',
    takeaway:           'Takeaway',
    homeDelivery:       'Home Delivery',
    parking:            'Parking',
    orders:             'orders',
    ago:                (d: number) => d < 1 ? 'Abhi' : d < 60 ? `${d} min pehle` : `${Math.floor(d/60)}h ${d%60}m pehle`,
  },
} as const;

type LangKey = keyof typeof LANG;

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────
interface TableData {
  id: string; name: string; status: string; capacity: number;
  activeOrder: { orderNo: string; grandTotal: number; guestCount: number; status: string; elapsedMinutes: number } | null;
}

interface DashboardData {
  live: {
    totalTables: number; occupiedTables: number; vacantTables: number;
    activeKotCount: number; inProgressOrderCount: number; paymentPendingCount: number;
    tables: TableData[];
  };
  today: {
    totalSales: number; invoiceCount: number; orderCount: number;
    totalCustomers: number; avgOrderValue: number;
    orderTypes: Record<string, { count: number; revenue: number }>;
    topItems: { productId: string; name: string; qty: number; revenue: number }[];
    recentSettled: { id: string; orderNo: string; grandTotal: number; orderType: string; tableNo: string | null; updatedAt: string }[];
  };
  allTime: { totalCustomers: number; totalRevenue: number };
  staff: {
    totalActive: number; presentNow: number; notArrivedCount: number;
    attendanceToday: { id: string; name: string; designation: string; clockIn: string; clockOut: string | null; hoursWorked: number; stillPresent: boolean; type: string }[];
    notArrivedToday: { id: string; name: string; designation: string; type: string }[];
    locations: { userId: string; fullName: string; designation: string; wtStatus: string; lastSeen: string | null; isTracking: boolean; isOutOfRange: boolean; distanceFromBase: number | null; lat: number | null; lng: number | null }[];
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────
const fmt = (val: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

const fmtElapsed = (min: number) =>
  min >= 60 ? `${Math.floor(min / 60)}h ${min % 60}m` : `${min}m`;

const fmtRelativeDiff = (iso: string) =>
  Math.floor((Date.now() - new Date(iso).getTime()) / 60000);

const getOrderTypeMeta = (l: typeof LANG[LangKey]) => ({
  DINE_IN:  { label: l.dineIn,       icon: <UtensilsCrossed size={15} />, color: 'text-violet-400',  bg: 'bg-violet-500/10 border-violet-500/20' },
  TAKEAWAY: { label: l.takeaway,     icon: <ShoppingBag size={15} />,     color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20'   },
  DELIVERY: { label: l.homeDelivery, icon: <Bike size={15} />,            color: 'text-sky-400',     bg: 'bg-sky-500/10 border-sky-500/20'       },
  PARKING:  { label: l.parking,      icon: <ParkingSquare size={15} />,   color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20'},
});

// ──────────────────────────────────────────────────────────────────────────────
// Main Page
// ──────────────────────────────────────────────────────────────────────────────
export default function RestaurantLiveDashboard() {
  const router = useRouter();
  const params = useParams();
  const propertyCode = params?.propertyCode as string;

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeStaffTab, setActiveStaffTab] = useState<'present' | 'absent' | 'location'>('present');
  const [lang, setLang] = useState<LangKey>('en');
  const [roleChecked, setRoleChecked] = useState(false);
  // Property selector for restaurant admin multi-property support
  const [properties, setProperties] = useState<{ id: string; name: string; code: string; city?: string }[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [showPropertyDropdown, setShowPropertyDropdown] = useState(false);
  const { setOpen } = useSidebar();
  const l = LANG[lang];

  useEffect(() => { setOpen(false); }, [setOpen]);

  // ── Role Guard: POSSYSTEM must NOT access this page ──────────────────────
  // This page is exclusively for RESTAURANTS_ADMIN and SUPER_ADMIN.
  // POSSYSTEM users are redirected to the POS live-overview (6-box page).
  useEffect(() => {
    fetch('/api/auth/session')
      .then(r => r.json())
      .then(d => {
        if (!d.authenticated) { router.push('/login'); return; }
        const role = d.user?.role;
        if (role === 'POSSYSTEM') {
          router.replace(`/${propertyCode}/live-overview`);
          return;
        }
        if (role !== 'RESTAURANTS_ADMIN' && role !== 'SUPER_ADMIN' && role !== 'HOTEL_ADMIN') {
          router.replace(`/${propertyCode}/operations`);
          return;
        }
        // Fetch all properties for this admin
        fetch('/api/admin/properties')
          .then(r => r.json())
          .then(pData => {
            if (pData.success && pData.data?.length > 0) {
              setProperties(pData.data);
              // Default: use the current propertyCode match or first property
              const matched = pData.data.find((p: any) => p.code === propertyCode);
              setSelectedPropertyId(matched?.id || pData.data[0].id);
            }
          })
          .catch(console.error)
          .finally(() => setRoleChecked(true));
      })
      .catch(() => router.push('/login'));
  }, [router, propertyCode]);

  const fetchData = useCallback(async (isManual = false, propId?: string) => {
    if (isManual) setRefreshing(true);
    try {
      const pid = propId || selectedPropertyId;
      const url = pid ? `/api/restaurant-dashboard?propertyId=${pid}` : '/api/restaurant-dashboard';
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) { setData(json.data); setLastUpdated(new Date()); }
      else { setData(null); }
    } catch (e) { console.error(e); setData(null); }
    finally { setLoading(false); setRefreshing(false); }
  }, [selectedPropertyId]);

  // Re-fetch when selectedPropertyId or roleChecked changes
  useEffect(() => {
    if (!roleChecked || !selectedPropertyId) return;
    setLoading(true);
    fetchData(false, selectedPropertyId);
    const iv = setInterval(() => fetchData(false, selectedPropertyId), 30000);
    return () => clearInterval(iv);
  }, [roleChecked, selectedPropertyId]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedProperty = properties.find(p => p.id === selectedPropertyId);

  if (!roleChecked || loading) {
    return (
      <div className="min-h-screen bg-[#09090e] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-full border-4 border-violet-500/20 border-t-violet-500 animate-spin" />
          <p className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Loading live data...</p>
        </div>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="min-h-screen bg-[#09090e] flex items-center justify-center">
        <div className="text-center">
          <CircleAlert size={40} className="mx-auto mb-3 text-rose-500" />
          <p className="text-rose-400 text-sm font-bold">Failed to load. Please refresh.</p>
        </div>
      </div>
    );
  }

  const { live, today, allTime, staff } = data;
  const orderTypeMeta = getOrderTypeMeta(l);
  const totalOrdersToday = Object.values(today.orderTypes).reduce((s, v) => s + v.count, 0);
  const longWaitTables = live.tables?.filter(t => t.activeOrder && t.activeOrder.elapsedMinutes > 60) || [];

  const alerts: { msg: string; color: string; icon: React.ReactNode }[] = [];
  if (live.paymentPendingCount > 0)
    alerts.push({ msg: l.alertPayPending(live.paymentPendingCount), color: 'bg-amber-500/15 border-amber-500/30 text-amber-300', icon: <CreditCard size={14} /> });
  if (live.activeKotCount >= 5)
    alerts.push({ msg: l.alertKitchenBusy(live.activeKotCount), color: 'bg-rose-500/15 border-rose-500/30 text-rose-300', icon: <Flame size={14} /> });
  if (staff.notArrivedCount > 0)
    alerts.push({ msg: l.alertStaffMissing(staff.notArrivedCount), color: 'bg-orange-500/15 border-orange-500/30 text-orange-300', icon: <UserX size={14} /> });
  if (longWaitTables.length > 0)
    alerts.push({ msg: l.alertLongWait(longWaitTables.map(t => t.name).join(', ')), color: 'bg-rose-500/15 border-rose-500/30 text-rose-300', icon: <Timer size={14} /> });

  return (
    <div className="min-h-screen bg-[#09090e] text-white">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-violet-700/8 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-sky-700/6 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-4 py-5 space-y-6">

        {/* ── HEADER ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">{l.live}</span>
              {lastUpdated && (
                <span className="text-[10px] text-slate-600 font-bold">· {l.updatedAt(fmtTime(lastUpdated.toISOString()))}</span>
              )}
            </div>
            <h1 className="text-xl font-black text-white tracking-tight">Restaurant Dashboard</h1>
            {selectedProperty && (
              <p className="text-[10px] text-slate-500 font-bold mt-0.5 flex items-center gap-1">
                <Building2 size={9} className="text-violet-400" />
                {selectedProperty.name}{selectedProperty.city ? ` · ${selectedProperty.city}` : ''}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">

            {/* ── Property Selector (only if multiple properties) ── */}
            {properties.length > 1 && (
              <div className="relative">
                <button
                  onClick={() => setShowPropertyDropdown(prev => !prev)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl border border-violet-500/30 bg-violet-500/10 text-[11px] font-black text-violet-300 hover:bg-violet-500/20 transition-all max-w-[200px]"
                >
                  <Building2 size={12} className="text-violet-400 shrink-0" />
                  <span className="truncate">{selectedProperty?.name || 'Select Property'}</span>
                  <ChevronDown size={11} className={`shrink-0 transition-transform ${showPropertyDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showPropertyDropdown && (
                  <div className="absolute right-0 top-full mt-2 z-50 min-w-[220px] bg-[#0f0f1a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                    <div className="p-2 border-b border-white/5">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-2">Select Property</p>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {properties.map(prop => (
                        <button
                          key={prop.id}
                          onClick={() => {
                            setSelectedPropertyId(prop.id);
                            setShowPropertyDropdown(false);
                          }}
                          className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-all ${
                            prop.id === selectedPropertyId ? 'bg-violet-500/10' : ''
                          }`}
                        >
                          <div className={`w-2 h-2 rounded-full shrink-0 ${
                            prop.id === selectedPropertyId ? 'bg-violet-400' : 'bg-slate-700'
                          }`} />
                          <div className="min-w-0">
                            <p className={`text-xs font-bold truncate ${
                              prop.id === selectedPropertyId ? 'text-violet-300' : 'text-slate-300'
                            }`}>{prop.name}</p>
                            <p className="text-[9px] text-slate-600 font-bold">{prop.code}{prop.city ? ` · ${prop.city}` : ''}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Language Toggle */}
            <button
              onClick={() => setLang(prev => prev === 'en' ? 'hi' : 'en')}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-[11px] font-black tracking-widest hover:bg-white/10 transition-all"
              title="Toggle language"
            >
              <Languages size={13} className="text-violet-400" />
              <span className={lang === 'en' ? 'text-white' : 'text-slate-500'}>EN</span>
              <span className="text-slate-700">|</span>
              <span className={lang === 'hi' ? 'text-white' : 'text-slate-500'}>हि</span>
            </button>

            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[11px] font-bold text-slate-400 hover:bg-white/10 hover:text-white transition-all disabled:opacity-40"
            >
              <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
              {l.refresh}
            </button>
          </div>
        </div>

        {/* Click outside to close dropdown */}
        {showPropertyDropdown && (
          <div className="fixed inset-0 z-40" onClick={() => setShowPropertyDropdown(false)} />
        )}

        {/* ── ALERTS ── */}
        {alerts.length > 0 ? (
          <div className="space-y-2">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <Bell size={11} /> {l.attentionTitle}
            </p>
            {alerts.map((a, i) => (
              <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-2xl border text-sm font-bold ${a.color}`}>
                {a.icon} <span>{a.msg}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-sm font-bold">
            <ThumbsUp size={14} /> <span>{l.allGood}</span>
          </div>
        )}

        {/* ── LIVE STATUS ── */}
        <div>
          <SectionLabel icon={<Activity size={12} />} text={l.liveStatus} />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <LiveCard label={l.tablesOccupied} value={`${live.occupiedTables}`} sub={`${live.vacantTables} ${l.tablesVacant.toLowerCase()} · ${live.totalTables} total`} icon={<LayoutGrid size={18} />} color="violet" pulse={live.occupiedTables > 0} />
            <LiveCard label={l.tablesVacant}   value={`${live.vacantTables}`}   sub={l.availableNow}    icon={<CheckCircle2 size={18} />} color="emerald" />
            <LiveCard label={l.kitchenKot}      value={`${live.activeKotCount}`} sub={l.activeInKitchen} icon={<ChefHat size={18} />}     color={live.activeKotCount >= 5 ? 'rose' : live.activeKotCount > 0 ? 'amber' : 'slate'} pulse={live.activeKotCount > 0} />
            <LiveCard label={l.ordersInProgress} value={`${live.inProgressOrderCount}`} sub={l.processingNow} icon={<Clock size={18} />}   color="sky" pulse={live.inProgressOrderCount > 0} />
            <LiveCard label={l.paymentPending}  value={`${live.paymentPendingCount}`} sub={l.waitingApproval} icon={<CreditCard size={18} />} color={live.paymentPendingCount > 0 ? 'amber' : 'slate'} pulse={live.paymentPendingCount > 0} />
            <LiveCard label={l.staffPresent}    value={`${staff.presentNow}`}    sub={`${staff.notArrivedCount} ${lang === 'en' ? 'not arrived' : 'nahi aaya'} · ${staff.totalActive} total`} icon={<UserCheck size={18} />} color={staff.notArrivedCount > 0 ? 'orange' : 'teal'} pulse />
          </div>
        </div>

        {/* ── TABLE MAP ── */}
        {live.tables && live.tables.length > 0 && (
          <div>
            <SectionLabel icon={<LayoutGrid size={12} />} text={l.tableMap} />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2.5">
              {live.tables.map((table) => {
                const order    = table.activeOrder;
                const isVacant  = table.status === 'VACANT';
                const isHold    = table.status === 'HOLD';
                const isPending = order?.status === 'PAYMENT_AWAITING_APPROVAL';
                const isLong    = (order?.elapsedMinutes || 0) > 60;
                const isOccupied = !isVacant;

                const cardStyle =
                  isPending  ? 'border-amber-500/50 bg-amber-500/10' :
                  isLong     ? 'border-rose-500/50 bg-rose-500/10'   :
                  isHold     ? 'border-slate-500/30 bg-slate-500/5'  :
                  isOccupied ? 'border-violet-500/40 bg-violet-500/8':
                  'border-white/5 bg-white/[0.02]';

                const dot =
                  isPending  ? 'bg-amber-400 animate-pulse'  :
                  isLong     ? 'bg-rose-400 animate-pulse'   :
                  isHold     ? 'bg-slate-500'                :
                  isOccupied ? 'bg-violet-400 animate-pulse' :
                  'bg-emerald-500';

                const statusText =
                  isPending  ? l.payPending     :
                  isLong     ? l.settleUrgent   :
                  isHold     ? l.onHold         :
                  isOccupied ? l.occupied       :
                  l.vacant;

                const statusColor =
                  isPending  ? 'text-amber-400'  :
                  isLong     ? 'text-rose-400'   :
                  isHold     ? 'text-slate-400'  :
                  isOccupied ? 'text-violet-400' :
                  'text-emerald-400';

                return (
                  <div key={table.id} className={`rounded-2xl border ${cardStyle} p-3 flex flex-col gap-1.5 transition-all duration-300`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-white">{table.name}</span>
                      <span className={`w-2 h-2 rounded-full ${dot}`} />
                    </div>
                    <p className={`text-[9px] font-black uppercase tracking-widest ${statusColor}`}>{statusText}</p>
                    {isOccupied && order ? (
                      <div className="space-y-1">
                        <p className="text-[11px] font-black text-white">{fmt(order.grandTotal)}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] text-slate-500 font-bold">{l.guests(order.guestCount)}</span>
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${isLong ? 'bg-rose-500/20 text-rose-400' : 'bg-white/5 text-slate-400'}`}>
                            {fmtElapsed(order.elapsedMinutes)}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[9px] text-slate-600 font-bold">{l.seats(table.capacity)}</p>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-4 mt-3 px-1">
              {[
                { dot: 'bg-emerald-500', txt: l.vacant.replace(/^[^ ]+ /, '') },
                { dot: 'bg-violet-400',  txt: l.occupied.replace(/^[^ ]+ /, '') },
                { dot: 'bg-amber-400',   txt: l.payPending.replace(/^[^ ]+ /, '') },
                { dot: 'bg-rose-400',    txt: l.settleUrgent.replace(/^[^ ]+ /, '') },
                { dot: 'bg-slate-500',   txt: l.onHold.replace(/^[^ ]+ /, '') },
              ].map(leg => (
                <div key={leg.txt} className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${leg.dot} shrink-0`} />
                  <span className="text-[9px] font-bold text-slate-500">{leg.txt}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TODAY'S BUSINESS ── */}
        <div>
          <SectionLabel icon={<TrendingUp size={12} />} text={l.todayBusiness} />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="col-span-2 md:col-span-1 rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-600/20 to-violet-900/5 p-5">
              <p className="text-[10px] font-black text-violet-400 uppercase tracking-widest mb-2">💰 {l.todayRevenue}</p>
              <p className="text-3xl font-black text-white tracking-tight">{fmt(today.totalSales)}</p>
              <p className="text-[10px] text-violet-300/50 font-bold mt-1">{l.billsRaised(today.invoiceCount)}</p>
            </div>
            <InfoCard label={l.totalOrders}     value={today.orderCount.toString()}     sub={l.today}       icon={<ShoppingBag size={16} />}  color="text-amber-400" />
            <InfoCard label={l.customersServed} value={today.totalCustomers.toString()} sub={l.totalCovers} icon={<Users size={16} />}         color="text-sky-400"   />
            <InfoCard label={l.avgBill}         value={fmt(today.avgOrderValue)}        sub={l.perBill}     icon={<ArrowUpRight size={16} />}  color="text-emerald-400" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {Object.entries(orderTypeMeta).map(([key, meta]) => {
              const typeData = today.orderTypes[key] || { count: 0, revenue: 0 };
              const pct = totalOrdersToday > 0 ? Math.round((typeData.count / totalOrdersToday) * 100) : 0;
              return (
                <div key={key} className={`rounded-2xl border ${meta.bg} p-4`}>
                  <div className={`flex items-center gap-2 ${meta.color} mb-3`}>
                    {meta.icon}
                    <span className="text-[10px] font-black uppercase tracking-widest">{meta.label}</span>
                  </div>
                  <p className="text-xl font-black text-white">{typeData.count} <span className="text-sm font-bold text-slate-500">{l.orders}</span></p>
                  <p className={`text-xs font-bold ${meta.color} mt-0.5`}>{fmt(typeData.revenue)}</p>
                  <div className="mt-3 w-full h-1.5 bg-black/20 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ${
                      key === 'DINE_IN' ? 'bg-violet-500' : key === 'TAKEAWAY' ? 'bg-amber-500' : key === 'DELIVERY' ? 'bg-sky-500' : 'bg-emerald-500'
                    }`} style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-[9px] text-slate-600 font-bold mt-1">{pct}% {l.ordersFrom}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── TOP ITEMS + RECENT ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
            <SectionLabel icon={<Star size={12} />} text={l.topSelling} />
            {today.topItems.length > 0 ? (
              <div className="space-y-4">
                {today.topItems.map((item, i) => {
                  const pct = Math.min(100, (item.qty / (today.topItems[0]?.qty || 1)) * 100);
                  return (
                    <div key={item.productId}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[9px] font-black text-slate-600 w-4 shrink-0">#{i + 1}</span>
                          <span className="text-xs font-bold text-slate-200 truncate">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 ml-2">
                          <span className="text-[10px] font-black text-violet-400">{item.qty} {l.soldToday}</span>
                          <span className="text-[10px] text-slate-500 font-bold">{fmt(item.revenue)}</span>
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-violet-500 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-10 text-center">
                <Package size={24} className="mx-auto mb-2 text-slate-700" />
                <p className="text-[10px] font-bold text-slate-600">{l.noItemsSold}</p>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
            <SectionLabel icon={<CheckCircle2 size={12} />} text={l.recentOrders} />
            {today.recentSettled.length > 0 ? (
              <div className="space-y-1">
                {today.recentSettled.map((order) => {
                  const meta = orderTypeMeta[order.orderType as keyof typeof orderTypeMeta] || orderTypeMeta.DINE_IN;
                  const diff = fmtRelativeDiff(order.updatedAt);
                  return (
                    <div key={order.id} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`p-1.5 rounded-lg bg-white/5 ${meta.color}`}>{meta.icon}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-200">#{order.orderNo}</p>
                          <p className="text-[9px] text-slate-600 font-bold">{meta.label}{order.tableNo ? ` · Table ${order.tableNo}` : ''}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <p className="text-xs font-black text-emerald-400">{fmt(order.grandTotal)}</p>
                        <p className="text-[9px] text-slate-600 font-bold">{l.ago(diff)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-10 text-center">
                <CheckCircle2 size={24} className="mx-auto mb-2 text-slate-700" />
                <p className="text-[10px] font-bold text-slate-600">{l.noSettled}</p>
              </div>
            )}
          </div>
        </div>

        {/* ── STAFF ── */}
        <div>
          <SectionLabel icon={<Users size={12} />} text={l.staffToday} />
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-center">
              <p className="text-3xl font-black text-emerald-400">{staff.presentNow}</p>
              <p className="text-[9px] font-black text-emerald-400/60 uppercase tracking-widest mt-1">{l.presentNow}</p>
            </div>
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-center">
              <p className="text-3xl font-black text-amber-400">{staff.attendanceToday.filter(r => !r.stillPresent).length}</p>
              <p className="text-[9px] font-black text-amber-400/60 uppercase tracking-widest mt-1">{l.clockedOut}</p>
            </div>
            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 text-center">
              <p className="text-3xl font-black text-rose-400">{staff.notArrivedCount}</p>
              <p className="text-[9px] font-black text-rose-400/60 uppercase tracking-widest mt-1">{l.notArrived}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-white/[0.03] rounded-xl border border-white/5 mb-4 w-fit">
            {([
              { key: 'present',  label: l.tabPresent(staff.presentNow) },
              { key: 'absent',   label: l.tabAbsent(staff.notArrivedCount) },
              { key: 'location', label: l.tabLocation(staff.locations.filter(loc => loc.isTracking).length) },
            ] as const).map(tab => (
              <button key={tab.key} onClick={() => setActiveStaffTab(tab.key as any)}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeStaffTab === tab.key ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/50' : 'text-slate-500 hover:text-slate-300'
                }`}>{tab.label}</button>
            ))}
          </div>

          {/* Present */}
          {activeStaffTab === 'present' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {staff.attendanceToday.length === 0 ? (
                <div className="col-span-full py-10 text-center">
                  <UserCheck size={28} className="mx-auto mb-3 text-slate-700" />
                  <p className="text-[10px] font-black text-slate-600">{l.noAttendance}</p>
                </div>
              ) : staff.attendanceToday.map(rec => (
                <div key={rec.id} className={`rounded-2xl border p-4 flex items-center gap-3 ${rec.stillPresent ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-white/5 bg-white/[0.02]'}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black shrink-0 ${rec.stillPresent ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-slate-400'}`}>
                    {rec.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-200 truncate">{rec.name}</p>
                    <p className="text-[9px] text-slate-500 font-bold truncate">{rec.designation || rec.type}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[9px] text-slate-500 font-bold flex items-center gap-1"><Clock size={8} /> {fmtTime(rec.clockIn)}</span>
                      {rec.clockOut ? <span className="text-[9px] text-slate-600 font-bold">→ {fmtTime(rec.clockOut)}</span>
                                    : <span className="text-[9px] font-black text-emerald-400">{l.onDuty}</span>}
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${rec.stillPresent ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-slate-500'}`}>{rec.hoursWorked}h</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Absent */}
          {activeStaffTab === 'absent' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {staff.notArrivedToday.length === 0 ? (
                <div className="col-span-full py-10 text-center">
                  <ThumbsUp size={28} className="mx-auto mb-3 text-emerald-600" />
                  <p className="text-[10px] font-black text-emerald-600">{l.allArrived}</p>
                </div>
              ) : staff.notArrivedToday.map(s => (
                <div key={s.id} className="rounded-2xl border border-rose-500/15 bg-rose-500/5 p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/15 flex items-center justify-center text-sm font-black text-rose-400 shrink-0">
                    {s.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-300 truncate">{s.name}</p>
                    <p className="text-[9px] text-slate-500 font-bold">{s.designation || s.type}</p>
                    <span className="text-[9px] font-black text-rose-400 flex items-center gap-1 mt-1"><UserX size={9} /> {l.notClockedIn}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Location */}
          {activeStaffTab === 'location' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {staff.locations.length === 0 ? (
                <div className="col-span-full py-10 text-center">
                  <MapPin size={28} className="mx-auto mb-3 text-slate-700" />
                  <p className="text-[10px] font-black text-slate-600">{l.noLocation}</p>
                </div>
              ) : staff.locations.map(loc => (
                <div key={loc.userId} className={`rounded-2xl border p-4 flex items-start gap-3 ${
                  loc.isOutOfRange ? 'border-rose-500/20 bg-rose-500/5' : loc.isTracking ? 'border-sky-500/20 bg-sky-500/5' : 'border-white/5 bg-white/[0.02]'
                }`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black shrink-0 ${
                    loc.isOutOfRange ? 'bg-rose-500/20 text-rose-400' : loc.isTracking ? 'bg-sky-500/20 text-sky-400' : 'bg-white/5 text-slate-500'
                  }`}>{loc.fullName.charAt(0).toUpperCase()}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-200 truncate">{loc.fullName}</p>
                      {loc.wtStatus === 'online' ? <Wifi size={10} className="text-emerald-400 shrink-0 ml-1" /> : <WifiOff size={10} className="text-slate-600 shrink-0 ml-1" />}
                    </div>
                    <p className="text-[9px] text-slate-500 font-bold truncate">{loc.designation || 'Staff'}</p>
                    <div className="mt-2 space-y-1">
                      {loc.isTracking ? (
                        <>
                          <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400">
                            <MapPin size={9} className={loc.isOutOfRange ? 'text-rose-400' : 'text-sky-400'} />
                            {loc.distanceFromBase !== null ? l.distFrom(Math.round(loc.distanceFromBase)) : l.locationNA}
                          </div>
                          {loc.lastSeen && <p className="text-[9px] text-slate-600 font-bold flex items-center gap-1"><Timer size={9} /> {l.lastSeen(l.ago(fmtRelativeDiff(loc.lastSeen)))}</p>}
                          {loc.isOutOfRange && <p className="text-[9px] font-black text-rose-400 flex items-center gap-1"><AlertTriangle size={9} /> {l.outOfRange}</p>}
                        </>
                      ) : (
                        <p className="text-[9px] font-black text-slate-600">{l.locationNA}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── ALL TIME ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-violet-500/10 text-violet-400 shrink-0"><IndianRupee size={20} /></div>
            <div>
              <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{l.allTimeRevenue}</p>
              <p className="text-2xl font-black text-white mt-0.5">{fmt(allTime.totalRevenue)}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-sky-500/10 text-sky-400 shrink-0"><Users size={20} /></div>
            <div>
              <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{l.allTimeCustomers}</p>
              <p className="text-2xl font-black text-white mt-0.5">{allTime.totalCustomers.toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>

        <p className="text-center text-[9px] text-slate-700 font-bold pb-4">
          {lastUpdated ? l.refresh30(fmtTime(lastUpdated.toISOString())) : ''}
        </p>
      </div>
    </div>
  );
}

// ── Reusable components ──────────────────────────────────────────────────────

function SectionLabel({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-slate-500">{icon}</span>
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{text}</span>
      <div className="flex-1 h-px bg-white/5" />
    </div>
  );
}

const colorMap: Record<string, { border: string; bg: string; icon: string; dot: string }> = {
  violet:  { border: 'border-violet-500/20',  bg: 'bg-violet-500/5',  icon: 'text-violet-400',  dot: 'bg-violet-400'  },
  emerald: { border: 'border-emerald-500/20', bg: 'bg-emerald-500/5', icon: 'text-emerald-400', dot: 'bg-emerald-400' },
  amber:   { border: 'border-amber-500/20',   bg: 'bg-amber-500/5',   icon: 'text-amber-400',   dot: 'bg-amber-400'   },
  sky:     { border: 'border-sky-500/20',     bg: 'bg-sky-500/5',     icon: 'text-sky-400',     dot: 'bg-sky-400'     },
  rose:    { border: 'border-rose-500/20',    bg: 'bg-rose-500/5',    icon: 'text-rose-400',    dot: 'bg-rose-400'    },
  teal:    { border: 'border-teal-500/20',    bg: 'bg-teal-500/5',    icon: 'text-teal-400',    dot: 'bg-teal-400'    },
  orange:  { border: 'border-orange-500/20',  bg: 'bg-orange-500/5',  icon: 'text-orange-400',  dot: 'bg-orange-400'  },
  slate:   { border: 'border-white/5',        bg: 'bg-white/[0.02]',  icon: 'text-slate-500',   dot: 'bg-slate-600'   },
};

function LiveCard({ label, value, sub, icon, color, pulse }: {
  label: string; value: string; sub?: string; icon: React.ReactNode; color: string; pulse?: boolean;
}) {
  const c = colorMap[color] || colorMap.slate;
  return (
    <div className={`rounded-2xl border ${c.border} ${c.bg} p-4 flex flex-col gap-3`}>
      <div className="flex items-center justify-between">
        <span className={`p-2 rounded-xl bg-black/10 ${c.icon}`}>{icon}</span>
        {pulse && <span className={`w-2 h-2 rounded-full ${c.dot} animate-pulse`} />}
      </div>
      <div>
        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">{label}</p>
        <p className="text-2xl font-black text-white">{value}</p>
        {sub && <p className="text-[9px] text-slate-600 font-bold mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function InfoCard({ label, value, sub, icon, color }: {
  label: string; value: string; sub?: string; icon: React.ReactNode; color: string;
}) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 flex flex-col gap-2">
      <span className={color}>{icon}</span>
      <div>
        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">{label}</p>
        <p className="text-xl font-black text-white">{value}</p>
        {sub && <p className="text-[9px] text-slate-600 font-bold">{sub}</p>}
      </div>
    </div>
  );
}
