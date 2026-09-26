'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useSidebar } from '@/context/sidebar-context';
import {
  BedDouble, Users, TrendingUp, Sparkles, CreditCard,
  LogIn, LogOut, RefreshCw, Bell, ChevronRight, Hotel,
  UtensilsCrossed, CircleAlert, ArrowUpRight,
  Activity, IndianRupee, CheckCircle2,
  UserCheck, UserX, Building2, Languages,
  Settings, BarChart3, X, Plus, Calendar,
  Phone, User, Loader2, Check, Clock, AlertCircle, ChevronDown,
  Package, ShoppingCart, AlertTriangle, Minus, Search as SearchIcon,
} from 'lucide-react';
import { AdminBookRoomModal } from '@/components/hotel/AdminBookRoomModal';

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────
interface RoomData {
  id: string; roomNumber: string; type: string; price: number;
  status: string; housekeepingStatus: string; guestName: string | null; roomTypeId?: string;
}
interface BookingData {
  id: string; bookingNo: string; guestName: string; phone?: string;
  roomType: string; status: string; arrivalDate: string; departureDate: string;
}
interface TableData {
  id: string; name: string; status: string; capacity: number;
  activeOrder: { orderNo: string; grandTotal: number; guestCount: number; status: string; elapsedMinutes: number } | null;
}
interface DashboardData {
  property?: { id: string; name: string; code: string; type: string; city?: string; hmsEnabled?: boolean };
  hotel?: {
    isHotel: boolean; totalRooms: number; occupiedRooms: number; availableRooms: number;
    dirtyRooms: number; maintenanceRooms: number; todayCheckIns: number; todayCheckOuts: number;
    todayDepartures?: number; todayRoomRevenue: number; rooms: RoomData[]; recentBookings: BookingData[];
  };
  live: {
    totalTables: number; occupiedTables: number; vacantTables: number;
    activeKotCount: number; inProgressOrderCount: number; paymentPendingCount: number; tables: TableData[];
  };
  today: {
    totalSales: number; fnbSales?: number; roomSales?: number;
    invoiceCount: number; orderCount: number; totalCustomers: number; avgOrderValue: number;
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
interface RoomTypeItem { id: string; name: string; baseRate: number; maxOccupancy: number; }
interface AvailableRoom { id: string; roomNumber: string; type: string; price: number; roomTypeId: string; }
interface InventoryItem {
  id: string; name: string; sku?: string; unit?: string;
  currentQuantity: number; minThreshold: number; costPrice: number;
  stockStatus: 'OK' | 'LOW' | 'CRITICAL';
}
interface PosProduct { id: string; name: string; sellingPrice: number; categoryName?: string; }
interface FoodOrderItem { productId: string; name: string; price: number; qty: number; }

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────
const fmt = (val: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
const today8 = () => new Date().toISOString().split('T')[0];
const tomorrow8 = () => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]; };


// ──────────────────────────────────────────────────────────────────────────────
// BOOKING MODAL (shared between mobile + desktop)
// ──────────────────────────────────────────────────────────────────────────────
function QuickBookingModal({ onClose, propertyId, availableRooms, roomTypes }: {
  onClose: () => void; propertyId: string;
  availableRooms: AvailableRoom[]; roomTypes: RoomTypeItem[];
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState({
    firstName: '', lastName: '', mobile: '', email: '',
    arrivalDate: today8(), departureDate: tomorrow8(),
    adults: 1, children: 0,
    roomTypeId: '', assignedRoomId: '',
    mealPlan: 'RO', advanceAmount: 0,
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const nights = Math.max(1, Math.ceil(
    (new Date(form.departureDate).getTime() - new Date(form.arrivalDate).getTime()) / 86400000
  ));
  const selectedRoom = availableRooms.find(r => r.id === form.assignedRoomId);
  const selectedType = roomTypes.find(rt => rt.id === form.roomTypeId);
  const ratePerNight = selectedRoom?.price || selectedType?.baseRate || 0;
  const total = ratePerNight * nights;
  const filteredRooms = form.roomTypeId
    ? availableRooms.filter(r => r.roomTypeId === form.roomTypeId)
    : availableRooms;

  const upd = (k: string, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async () => {
    setSubmitting(true); setError(null);
    try {
      const res = await fetch('/api/hotel/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          guestData: { firstName: form.firstName, lastName: form.lastName, mobile: form.mobile, email: form.email },
          arrivalDate: new Date(form.arrivalDate).toISOString(),
          departureDate: new Date(form.departureDate).toISOString(),
          adults: form.adults, children: form.children,
          roomTypeId: form.roomTypeId || undefined,
          assignedRoomId: form.assignedRoomId || undefined,
          mealPlan: form.mealPlan, totalAmount: total, advanceAmount: form.advanceAmount,
        }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || 'Booking failed');
      setSuccess(`#${json.data?.bookingNo || json.data?.id?.slice(-6).toUpperCase()}`);
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end lg:items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full lg:max-w-lg bg-[#0c0e1a] lg:rounded-3xl rounded-t-3xl border border-white/10 overflow-hidden flex flex-col max-h-[90dvh] lg:max-h-[85vh]">
        {/* Handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 shrink-0 lg:hidden">
          <div className="w-10 h-1 bg-white/20 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-4 border-b border-white/[0.06] shrink-0">
          <div>
            <h2 className="text-base font-black text-white">Quick Room Booking</h2>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {step === 1 ? 'Step 1: Guest Details' : step === 2 ? 'Step 2: Room & Dates' : 'Step 3: Confirm'}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-white">
            <X size={16} />
          </button>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-1 px-5 py-3 shrink-0">
          {[1, 2, 3].map(s => (
            <React.Fragment key={s}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 transition-all ${
                step > s ? 'bg-emerald-500 text-white' : step === s ? 'bg-amber-500 text-black' : 'bg-white/10 text-slate-500'
              }`}>
                {step > s ? <Check size={13} /> : s}
              </div>
              {s < 3 && <div className="flex-1 h-px bg-white/10" />}
            </React.Fragment>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-5 pb-5">

          {success ? (
            <div className="py-10 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 border-2 border-emerald-500/30 flex items-center justify-center mx-auto">
                <CheckCircle2 size={32} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-white font-black text-lg">Booking Confirmed!</p>
                <p className="text-emerald-400 font-bold text-sm mt-1">Booking {success}</p>
                <p className="text-slate-500 text-xs mt-2">
                  {form.firstName} {form.lastName} · {nights} night{nights !== 1 ? 's' : ''} · {fmt(total)}
                </p>
              </div>
              <button onClick={onClose} className="w-full py-3 bg-amber-500 text-black font-black rounded-2xl">Done</button>
            </div>
          ) : (
            <>
              {/* STEP 1 */}
              {step === 1 && (
                <div className="space-y-3 pt-2">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { k: 'firstName', ph: 'Rahul', label: 'First Name *' },
                      { k: 'lastName', ph: 'Sharma', label: 'Last Name' },
                    ].map(f => (
                      <div key={f.k}>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">{f.label}</label>
                        <input value={(form as any)[f.k]} onChange={e => upd(f.k, e.target.value)} placeholder={f.ph}
                          className="w-full px-3 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-semibold placeholder-slate-600 focus:outline-none focus:border-amber-500/50 transition-all" />
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Mobile Number *</label>
                    <div className="relative">
                      <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input value={form.mobile} onChange={e => upd('mobile', e.target.value)} placeholder="+91 98765 43210" type="tel"
                        className="w-full pl-9 pr-3 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-semibold placeholder-slate-600 focus:outline-none focus:border-amber-500/50 transition-all" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Email (Optional)</label>
                    <input value={form.email} onChange={e => upd('email', e.target.value)} placeholder="guest@email.com" type="email"
                      className="w-full px-3 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-semibold placeholder-slate-600 focus:outline-none focus:border-amber-500/50 transition-all" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[{ k: 'adults', label: 'Adults', min: 1 }, { k: 'children', label: 'Children', min: 0 }].map(f => (
                      <div key={f.k}>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">{f.label}</label>
                        <div className="flex items-center gap-2 p-1 rounded-xl bg-white/5 border border-white/10">
                          <button onClick={() => upd(f.k, Math.max(f.min, (form as any)[f.k] - 1))} className="w-8 h-8 rounded-lg bg-white/10 text-white font-black flex items-center justify-center">-</button>
                          <span className="flex-1 text-center text-white font-black text-sm">{(form as any)[f.k]}</span>
                          <button onClick={() => upd(f.k, (form as any)[f.k] + 1)} className="w-8 h-8 rounded-lg bg-white/10 text-white font-black flex items-center justify-center">+</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button disabled={!form.firstName || !form.mobile} onClick={() => setStep(2)}
                    className="w-full py-3.5 bg-amber-500 text-black font-black rounded-2xl text-sm disabled:opacity-40 mt-2">
                    Next: Choose Room →
                  </button>
                </div>
              )}

              {/* STEP 2 */}
              {step === 2 && (
                <div className="space-y-3 pt-2">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { k: 'arrivalDate', label: 'Check-In *', min: today8() },
                      { k: 'departureDate', label: 'Check-Out *', min: form.arrivalDate },
                    ].map(f => (
                      <div key={f.k}>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">{f.label}</label>
                        <input type="date" value={(form as any)[f.k]} min={f.min}
                          onChange={e => {
                            upd(f.k, e.target.value);
                            if (f.k === 'arrivalDate' && e.target.value >= form.departureDate) {
                              const d = new Date(e.target.value); d.setDate(d.getDate() + 1);
                              upd('departureDate', d.toISOString().split('T')[0]);
                            }
                          }}
                          className="w-full px-3 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500/50 transition-all [color-scheme:dark]" />
                      </div>
                    ))}
                  </div>
                  <div className="p-2.5 rounded-xl bg-amber-500/8 border border-amber-500/15 text-center">
                    <p className="text-amber-400 font-black text-sm">{nights} Night{nights !== 1 ? 's' : ''}</p>
                  </div>

                  {roomTypes.length > 0 && (
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Room Type</label>
                      <div className="relative">
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                        <select value={form.roomTypeId} onChange={e => { upd('roomTypeId', e.target.value); upd('assignedRoomId', ''); }}
                          className="w-full px-3 pr-8 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-semibold focus:outline-none focus:border-amber-500/50 transition-all appearance-none [color-scheme:dark]">
                          <option value="">-- Any Room Type --</option>
                          {roomTypes.map(rt => <option key={rt.id} value={rt.id}>{rt.name} · {fmt(rt.baseRate)}/night</option>)}
                        </select>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">
                      Assign Room {filteredRooms.length > 0 ? `(${filteredRooms.length} available)` : ''}
                    </label>
                    {filteredRooms.length === 0 ? (
                      <div className="p-3 rounded-xl bg-rose-500/8 border border-rose-500/20 text-rose-400 text-xs font-bold text-center">No available rooms</div>
                    ) : (
                      <div className="grid grid-cols-4 gap-2 max-h-36 overflow-y-auto pr-1">
                        {filteredRooms.map(room => (
                          <button key={room.id} onClick={() => upd('assignedRoomId', room.id)}
                            className={`p-2 rounded-xl border text-center transition-all ${form.assignedRoomId === room.id ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' : 'bg-white/5 border-white/10 text-slate-300 hover:border-white/20'}`}>
                            <p className="text-sm font-black">#{room.roomNumber}</p>
                            <p className="text-[8px] text-slate-500 truncate">{room.type}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Meal Plan</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[['RO', 'Room Only'], ['CP', 'Breakfast'], ['MAP', 'Half Board'], ['AP', 'Full Board']].map(([val, label]) => (
                        <button key={val} onClick={() => upd('mealPlan', val)}
                          className={`py-2 rounded-xl text-[10px] font-black border transition-all ${form.mealPlan === val ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'}`}>
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button onClick={() => setStep(1)} className="flex-1 py-3.5 bg-white/5 border border-white/10 text-slate-300 font-black rounded-2xl text-sm">← Back</button>
                    <button disabled={filteredRooms.length === 0} onClick={() => setStep(3)} className="flex-[2] py-3.5 bg-amber-500 text-black font-black rounded-2xl text-sm disabled:opacity-40">Review →</button>
                  </div>
                </div>
              )}

              {/* STEP 3 */}
              {step === 3 && (
                <div className="space-y-3 pt-2">
                  <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
                    <div className="px-4 py-3 bg-amber-500/8 border-b border-white/[0.06]">
                      <p className="text-[10px] font-black text-amber-400 uppercase tracking-wider">Booking Summary</p>
                    </div>
                    <div className="divide-y divide-white/[0.05]">
                      {[
                        { label: 'Guest', value: `${form.firstName} ${form.lastName}` },
                        { label: 'Mobile', value: form.mobile },
                        { label: 'Room', value: selectedRoom ? `#${selectedRoom.roomNumber} — ${selectedRoom.type}` : 'Auto-assign' },
                        { label: 'Dates', value: `${form.arrivalDate} → ${form.departureDate} (${nights}N)` },
                        { label: 'Guests', value: `${form.adults} Adult${form.adults !== 1 ? 's' : ''}${form.children > 0 ? `, ${form.children} Children` : ''}` },
                        { label: 'Meal Plan', value: form.mealPlan },
                        { label: 'Rate', value: `${fmt(ratePerNight)}/night` },
                      ].map(row => (
                        <div key={row.label} className="flex items-center justify-between px-4 py-2.5">
                          <p className="text-[10px] text-slate-500 font-bold">{row.label}</p>
                          <p className="text-[11px] text-white font-semibold text-right max-w-[60%]">{row.value}</p>
                        </div>
                      ))}
                      <div className="flex items-center justify-between px-4 py-3 bg-amber-500/8">
                        <p className="text-sm font-black text-amber-400">Total</p>
                        <p className="text-lg font-black text-white">{fmt(total)}</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Advance Collected (₹)</label>
                    <input type="number" value={form.advanceAmount || ''} onChange={e => upd('advanceAmount', Number(e.target.value))} placeholder="0"
                      className="w-full px-3 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-semibold placeholder-slate-600 focus:outline-none focus:border-amber-500/50 transition-all" />
                  </div>
                  {error && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs font-bold">
                      <AlertCircle size={14} className="shrink-0" />{error}
                    </div>
                  )}
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => setStep(2)} className="flex-1 py-3.5 bg-white/5 border border-white/10 text-slate-300 font-black rounded-2xl text-sm">← Back</button>
                    <button onClick={handleSubmit} disabled={submitting}
                      className="flex-[2] py-3.5 bg-gradient-to-r from-amber-500 to-amber-400 text-black font-black rounded-2xl text-sm disabled:opacity-60 flex items-center justify-center gap-2">
                      {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                      {submitting ? 'Creating...' : 'Confirm Booking'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// MAIN DASHBOARD
// ──────────────────────────────────────────────────────────────────────────────
export default function HotelAdminDashboard() {
  const router = useRouter();
  const params = useParams();
  const propertyCode = (params?.propertyCode as string) || '';

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [roleChecked, setRoleChecked] = useState(false);
  const [userRole, setUserRole] = useState<string>('');
  const [showBookRoomModal, setShowBookRoomModal] = useState(false);
  const [preselectedRoom, setPreselectedRoom] = useState<{ id: string; roomNumber: string; roomTypeId: string } | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [properties, setProperties] = useState<{ id: string; name: string; code: string; type?: string; city?: string }[]>([]);
  const [availableRooms, setAvailableRooms] = useState<AvailableRoom[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomTypeItem[]>([]);
  // Inventory state
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [inventorySummary, setInventorySummary] = useState({ total: 0, critical: 0, low: 0, ok: 0 });
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [stockOrderItems, setStockOrderItems] = useState<{id:string;name:string;unit?:string;requestedQty:number}[]>([]);
  const [stockOrderNote, setStockOrderNote] = useState('');
  const [stockOrderSubmitting, setStockOrderSubmitting] = useState(false);
  // Food order state
  const [posProducts, setPosProducts] = useState<PosProduct[]>([]);
  const [showFoodOrderModal, setShowFoodOrderModal] = useState(false);
  const [foodOrderItems, setFoodOrderItems] = useState<FoodOrderItem[]>([]);
  const [foodGuestName, setFoodGuestName] = useState('');
  const [foodRoomNo, setFoodRoomNo] = useState('');
  const [foodOrderNote, setFoodOrderNote] = useState('');
  const [foodOrderSubmitting, setFoodOrderSubmitting] = useState(false);
  const [foodProductSearch, setFoodProductSearch] = useState('');
  const { setOpen } = useSidebar();

  useEffect(() => { setOpen(false); }, [setOpen]);

  useEffect(() => {
    fetch('/api/auth/session')
      .then(r => r.json())
      .then(d => {
        if (!d.authenticated) { router.replace('/login'); return; }
        const role = d.user?.role;
        setUserRole(role || '');
        if (role !== 'RESTAURANTS_ADMIN' && role !== 'SUPER_ADMIN' && role !== 'HOTEL_ADMIN') {
          const pCode = d.user?.propertyCode || propertyCode;
          router.replace(pCode ? `/${pCode}/operations` : '/operations');
          return;
        }
        fetch('/api/admin/properties')
          .then(r => r.json())
          .then(pData => {
            if (pData.success && pData.data?.length > 0) {
              setProperties(pData.data);
              const current = pData.data.find((p: any) => p.code?.toLowerCase() === propertyCode?.toLowerCase());
              setSelectedPropertyId(current ? current.id : pData.data[0].id);
            }
          })
          .catch(() => {})
          .finally(() => setRoleChecked(true));
      })
      .catch(() => router.replace('/login'));
  }, [router, propertyCode]);

  useEffect(() => {
    if (!selectedPropertyId) return;
    Promise.all([
      fetch(`/api/hotel/room-types?propertyId=${selectedPropertyId}`).then(r => r.json()),
      fetch(`/api/hotel/rooms?propertyId=${selectedPropertyId}`).then(r => r.json()),
    ]).then(([rtData, roomData]) => {
      if (rtData.success) setRoomTypes((rtData.data || []).map((rt: any) => ({
            id: rt.id, name: rt.name,
            baseRate: rt.baseRate || rt.basePrice || 0,
            maxOccupancy: rt.maxOccupancy || 0,
          })));
      const rooms = (roomData.success ? roomData.data : roomData) || [];
      setAvailableRooms(
        rooms.filter((r: any) => r.status === 'VACANT' || r.status === 'AVAILABLE')
          .map((r: any) => ({
          id: r.id, roomNumber: r.roomNumber,
            type: r.roomType?.name || r.type || '',
            price: r.customRate || r.roomType?.baseRate || r.roomType?.basePrice || r.price || 0,
            roomTypeId: r.roomTypeId || r.roomType?.id || '',
          }))
      );
    }).catch(() => {});

    // Fetch inventory summary
    fetch(`/api/hotel/inventory-summary?propertyId=${selectedPropertyId}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setInventoryItems(d.data.items || []);
          setInventorySummary(d.data.summary || { total: 0, critical: 0, low: 0, ok: 0 });
        }
      }).catch(() => {});

    // Fetch POS products for food order modal
    fetch(`/api/products?propertyId=${selectedPropertyId}&limit=200`)
      .then(r => r.json())
      .then(d => {
        const list = (d.success ? d.data : d) || [];
        setPosProducts(list.map((p: any) => ({
          id: p.id,
          name: p.name,
          sellingPrice: p.sellingPrice || 0,
          categoryName: p.category?.name || p.categoryName || '',
        })));
      }).catch(() => {});
  }, [selectedPropertyId]);

  const fetchData = useCallback(async (isManual = false, overridePropId?: string) => {
    if (isManual) setRefreshing(true);
    try {
      const pid = overridePropId || selectedPropertyId;
      const url = pid ? `/api/restaurant-dashboard?propertyId=${pid}` : '/api/restaurant-dashboard';
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error('API error');
      const json = await res.json();
      if (json.success) { setData(json.data); setLastUpdated(new Date()); }
    } catch { /* keep stale */ }
    finally { setLoading(false); if (isManual) setRefreshing(false); }
  }, [selectedPropertyId]);

  useEffect(() => {
    if (!roleChecked || !selectedPropertyId) return;
    setLoading(true);
    fetchData(false, selectedPropertyId);
    const iv = setInterval(() => fetchData(false, selectedPropertyId), 30000);
    return () => clearInterval(iv);
  }, [roleChecked, selectedPropertyId]); // eslint-disable-line

  const selectedProperty = properties.find(p => p.id === selectedPropertyId);
  const p = `/${propertyCode}`;

  if (!roleChecked || loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-5">
        <div className="relative">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
            <Hotel size={24} className="text-amber-400" />
          </div>
          <div className="absolute -inset-2 rounded-3xl border-2 border-amber-500/20 border-t-amber-400 animate-spin" />
        </div>
        <p className="text-slate-500 text-xs font-bold">Loading Hotel Admin...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <CircleAlert size={40} className="text-rose-500" />
        <p className="text-white font-black">Failed to load data</p>
        <button onClick={() => fetchData(true)} className="px-5 py-2.5 bg-amber-500 text-black font-black text-sm rounded-xl">Retry</button>
      </div>
    );
  }

  const { live, today, allTime, staff, hotel } = data;
  const occupancyPct = hotel ? (hotel.totalRooms > 0 ? Math.round((hotel.occupiedRooms / hotel.totalRooms) * 100) : 0) : 0;
  const alerts: { msg: string; icon: React.ReactNode; color: string }[] = [];
  if (hotel?.dirtyRooms > 0) alerts.push({ msg: `${hotel.dirtyRooms} room${hotel.dirtyRooms !== 1 ? 's' : ''} need housekeeping`, icon: <Sparkles size={14} />, color: 'amber' });
  if ((hotel?.todayDepartures ?? 0) > 0) alerts.push({ msg: `${hotel.todayDepartures} departure${hotel.todayDepartures !== 1 ? 's' : ''} scheduled today`, icon: <LogOut size={14} />, color: 'sky' });
  if (live.paymentPendingCount > 0) alerts.push({ msg: `${live.paymentPendingCount} tables waiting for payment`, icon: <CreditCard size={14} />, color: 'amber' });
  if (staff.notArrivedCount > 0) alerts.push({ msg: `${staff.notArrivedCount} staff not yet arrived`, icon: <UserX size={14} />, color: 'rose' });

  // ──────────────────────────────────────────────────────────────────────────
  // SHARED SECTIONS (rendered on desktop always, mobile only in matching tab)
  // ──────────────────────────────────────────────────────────────────────────

  const HeroSection = () => (
    <div className="relative overflow-hidden rounded-3xl p-5 lg:p-6 bg-gradient-to-br from-amber-500/15 via-[#0f1120] to-[#090b14] border border-amber-500/20">
      <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/8 rounded-full blur-3xl pointer-events-none" />
      <div className="flex flex-col sm:flex-row sm:items-start gap-4 relative z-10">
        {/* Left: Occupancy ring */}
        <div className="flex items-center gap-5">
          <div className="relative w-24 h-24 shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
              <circle cx="50" cy="50" r="40" fill="none" stroke="url(#occ-g)" strokeWidth="10" strokeLinecap="round"
                strokeDasharray={`${251.2 * occupancyPct / 100} 251.2`} />
              <defs>
                <linearGradient id="occ-g" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f59e0b" /><stop offset="100%" stopColor="#fbbf24" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-white">{occupancyPct}%</span>
              <span className="text-[9px] text-slate-500 font-bold">OCC</span>
            </div>
          </div>
          <div className="space-y-1.5 flex-1 min-w-0">
            <p className="text-[11px] font-black text-amber-400/80 uppercase tracking-[0.15em]">Live Occupancy</p>
            <div className="flex justify-between">
              <div>
                <p className="text-[10px] text-slate-500 font-bold">Occupied</p>
                <p className="text-2xl font-black text-white">{hotel?.occupiedRooms ?? 0}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-500 font-bold">Vacant</p>
                <p className="text-2xl font-black text-emerald-400">{hotel?.availableRooms ?? 0}</p>
              </div>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full" style={{ width: `${occupancyPct}%` }} />
            </div>
            <div className="flex justify-between text-[10px] text-slate-600">
              <span>Total: {hotel?.totalRooms ?? 0}</span>
              <span>Dirty: {hotel?.dirtyRooms ?? 0}</span>
            </div>
          </div>
        </div>

        {/* Right: Revenue + button (desktop) */}
        <div className="sm:ml-auto flex sm:flex-col items-center sm:items-end gap-3 sm:gap-2 sm:text-right">
          <div>
            <p className="text-[10px] text-slate-500 font-bold">Today's Room Revenue</p>
            <p className="text-xl font-black text-amber-300">{fmt(hotel?.todayRoomRevenue ?? 0)}</p>
          </div>
          <Link href="/hotel/bookings"
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-black hover:bg-amber-500/25 transition-all active:scale-95 whitespace-nowrap">
            <Plus size={14} /> New Booking
          </Link>
        </div>
      </div>
    </div>
  );

  const KpiGrid = () => (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {[
        { label: "Check-ins Today", value: hotel?.todayCheckIns ?? 0, icon: LogIn, color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20' },
        { label: "Check-outs Today", value: hotel?.todayCheckOuts ?? 0, icon: LogOut, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
        { label: 'Dirty Rooms', value: hotel?.dirtyRooms ?? 0, icon: Sparkles, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
        { label: 'Staff Present', value: `${staff.presentNow}/${staff.totalActive}`, icon: Users, color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
      ].map(kpi => {
        const Icon = kpi.icon;
        return (
          <div key={kpi.label} className={`p-4 rounded-2xl ${kpi.bg} border ${kpi.border}`}>
            <Icon size={18} className={`${kpi.color} mb-2`} />
            <p className="text-2xl font-black text-white">{kpi.value}</p>
            <p className="text-[10px] text-slate-500 font-bold mt-0.5 uppercase tracking-wider">{kpi.label}</p>
          </div>
        );
      })}
    </div>
  );

  const AlertsSection = () => alerts.length > 0 ? (
    <div className="space-y-2">
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">⚠️ Attention</p>
      {alerts.map((a, i) => (
        <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-2xl border text-xs font-semibold ${
          a.color === 'amber' ? 'bg-amber-500/10 border-amber-500/25 text-amber-300' :
          a.color === 'sky' ? 'bg-sky-500/10 border-sky-500/25 text-sky-300' :
          'bg-rose-500/10 border-rose-500/25 text-rose-300'
        }`}>
          <span className="shrink-0">{a.icon}</span><span>{a.msg}</span>
        </div>
      ))}
    </div>
  ) : null;

  const RevenueCard = () => (
    <div className="rounded-3xl overflow-hidden border border-white/[0.06] bg-[#0c0e1a]">
      <div className="px-5 py-4 border-b border-white/[0.06]">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Today's Total Business</p>
        <p className="text-2xl font-black text-white mt-1">{fmt(today.totalSales)}</p>
        <div className="flex gap-3 mt-1.5 text-[10px] text-slate-500 font-bold">
          <span>🏨 Rooms: {fmt(today.roomSales || 0)}</span><span>·</span><span>🍽️ F&B: {fmt(today.fnbSales || 0)}</span>
        </div>
      </div>
      <div className="grid grid-cols-3 divide-x divide-white/[0.06]">
        {[
          { label: 'Invoices', value: today.invoiceCount },
          { label: 'Guests', value: today.totalCustomers },
          { label: 'Avg Bill', value: fmt(today.avgOrderValue) },
        ].map(s => (
          <div key={s.label} className="px-4 py-3 text-center">
            <p className="text-base font-black text-white">{s.value}</p>
            <p className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const QuickAccessGrid = () => (
    <div>
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] mb-3">Quick Access</p>
      {/* Primary actions */}
      <div className="grid grid-cols-2 gap-2 mb-2.5">
        <button
          type="button"
          onClick={() => { setPreselectedRoom(null); setShowBookRoomModal(true); }}
          className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-500/20 to-amber-500/5 border border-amber-500/30 hover:from-amber-500/30 transition-all active:scale-95 text-left w-full cursor-pointer">
          <Hotel size={18} className="text-amber-400 shrink-0" />
          <div>
            <p className="text-sm font-black text-amber-300">Book Room</p>
            <p className="text-[10px] text-slate-500">Direct owner reservation</p>
          </div>
        </button>
        <Link href="/hotel/pos/tables"
          className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-orange-500/20 to-orange-500/5 border border-orange-500/30 hover:from-orange-500/30 transition-all active:scale-95">
          <UtensilsCrossed size={18} className="text-orange-400 shrink-0" />
          <div>
            <p className="text-sm font-black text-orange-300">F&B / POS Order</p>
            <p className="text-[10px] text-slate-500">Restaurant ordering</p>
          </div>
        </Link>
      </div>
      <div className="grid grid-cols-4 lg:grid-cols-8 gap-2">
        {[
          { label: 'Rooms', path: `${p}/hoteladmin/rooms`, icon: BedDouble, color: 'text-amber-400', bg: 'from-amber-500/15 to-amber-500/5', border: 'border-amber-500/20' },
          { label: 'Bookings', path: `${p}/hoteladmin/bookings`, icon: Hotel, color: 'text-emerald-400', bg: 'from-emerald-500/15 to-emerald-500/5', border: 'border-emerald-500/20' },
          { label: 'Guests', path: `${p}/hoteladmin/guests`, icon: UserCheck, color: 'text-purple-400', bg: 'from-purple-500/15 to-purple-500/5', border: 'border-purple-500/20' },
          { label: 'Housekeeping', path: `${p}/hoteladmin/housekeeping`, icon: Sparkles, color: 'text-sky-400', bg: 'from-sky-500/15 to-sky-500/5', border: 'border-sky-500/20' },
          { label: 'Billing', path: `${p}/hoteladmin/billing`, icon: CreditCard, color: 'text-orange-400', bg: 'from-orange-500/15 to-orange-500/5', border: 'border-orange-500/20' },
          { label: 'Revenue', path: `${p}/hoteladmin/revenue`, icon: TrendingUp, color: 'text-teal-400', bg: 'from-teal-500/15 to-teal-500/5', border: 'border-teal-500/20' },
          { label: 'F&B Hub', path: `${p}/hoteladmin/restaurant`, icon: UtensilsCrossed, color: 'text-rose-400', bg: 'from-rose-500/15 to-rose-500/5', border: 'border-rose-500/20' },
          { label: 'Staff', path: `${p}/hoteladmin/staff`, icon: Users, color: 'text-violet-400', bg: 'from-violet-500/15 to-violet-500/5', border: 'border-violet-500/20' },
        ].map(item => {
          const Icon = item.icon;
          return (
            <Link key={item.label} href={item.path}
              className={`p-3 rounded-2xl bg-gradient-to-br ${item.bg} border ${item.border} flex flex-col items-center gap-2 active:scale-95 transition-all hover:brightness-110`}>
              <Icon size={20} className={item.color} />
              <span className="text-[10px] font-black text-slate-300 text-center leading-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );

  const RoomsGrid = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">Room Status</p>
          <p className="text-base font-black text-white">Live Room Grid · {hotel?.totalRooms ?? 0} rooms</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => { setPreselectedRoom(null); setShowBookRoomModal(true); }}
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-400 text-black text-[11px] font-black rounded-xl transition-colors cursor-pointer">
            <Plus size={13} /> Book
          </button>
          <Link href={`${p}/hoteladmin/rooms`}
            className="px-3 py-2 border border-white/10 text-slate-300 text-[11px] font-black rounded-xl hover:border-white/20 transition-all">
            Manage →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-4 lg:grid-cols-4 gap-2">
        {[
          { label: 'Occupied', value: hotel?.occupiedRooms ?? 0, color: 'text-violet-400 bg-violet-500/10 border-violet-500/20' },
          { label: 'Vacant', value: hotel?.availableRooms ?? 0, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
          { label: 'Dirty', value: hotel?.dirtyRooms ?? 0, color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
          { label: 'Maint.', value: hotel?.maintenanceRooms ?? 0, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
        ].map(s => (
          <div key={s.label} className={`${s.color} border rounded-2xl p-3 text-center`}>
            <p className="text-xl font-black">{s.value}</p>
            <p className="text-[9px] font-black uppercase mt-0.5 opacity-70">{s.label}</p>
          </div>
        ))}
      </div>

      {hotel?.rooms && hotel.rooms.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {hotel.rooms.map(room => {
            const isOccupied = room.status === 'OCCUPIED';
            const isDirty = room.housekeepingStatus === 'DIRTY';
            const isMaintenance = room.status === 'MAINTENANCE';
            let sc = 'border-emerald-500/25 bg-emerald-500/5', sl = 'Available', scolor = 'text-emerald-400';
            if (isOccupied) { sc = 'border-violet-500/30 bg-violet-500/8'; sl = 'Occupied'; scolor = 'text-violet-400'; }
            else if (isMaintenance) { sc = 'border-rose-500/30 bg-rose-500/8'; sl = 'Maint.'; scolor = 'text-rose-400'; }
            else if (isDirty) { sc = 'border-amber-500/30 bg-amber-500/8'; sl = 'Dirty'; scolor = 'text-amber-400'; }
            return (
              <div
                key={room.id}
                onClick={() => {
                  if (!isOccupied && !isMaintenance) {
                    setPreselectedRoom({ id: room.id, roomNumber: room.roomNumber, roomTypeId: room.roomTypeId || '' });
                    setShowBookRoomModal(true);
                  }
                }}
                className={`p-4 rounded-2xl border ${sc} transition-all ${!isOccupied && !isMaintenance ? 'cursor-pointer hover:border-amber-400/50 hover:bg-amber-500/5' : ''}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-lg font-black text-white">#{room.roomNumber}</span>
                  <span className={`text-[9px] font-black ${scolor}`}>{sl}</span>
                </div>
                <p className="text-[11px] text-slate-400 font-bold truncate">{room.type}</p>
                {room.guestName ? (
                  <p className="text-[10px] text-amber-300 mt-1.5 font-semibold flex items-center gap-1">
                    <UserCheck size={10} /> {room.guestName}
                  </p>
                ) : (
                  <div className="flex items-center justify-between mt-1.5">
                    <p className="text-[10px] text-slate-600">{fmt(room.price)}/night</p>
                    {!isOccupied && !isMaintenance && (
                      <span className="text-[9px] text-amber-400 font-bold">Book →</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-12 text-center">
          <BedDouble size={40} className="mx-auto text-slate-700 mb-3" />
          <p className="text-slate-500 font-bold text-sm">No rooms configured</p>
        </div>
      )}
    </div>
  );

  const BookingsSection = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">Reservations</p>
          <p className="text-base font-black text-white">Recent Bookings</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/hotel/bookings"
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 text-black text-[11px] font-black rounded-xl shadow-lg shadow-amber-500/20">
            <Plus size={14} /> New Booking
          </Link>
          <Link href={`${p}/hoteladmin/bookings`}
            className="px-3 py-2 border border-white/10 text-slate-300 text-[11px] font-black rounded-xl hover:border-amber-500/30 transition-all">
            All →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Today's Check-ins", value: hotel?.todayCheckIns ?? 0, icon: LogIn, cls: 'bg-sky-500/10 border-sky-500/20 text-sky-400' },
          { label: "Today's Check-outs", value: hotel?.todayCheckOuts ?? 0, icon: LogOut, cls: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' },
        ].map(item => {
          const Icon = item.icon;
          return (
            <div key={item.label} className={`p-4 rounded-2xl ${item.cls} border flex items-center gap-3`}>
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                <Icon size={18} />
              </div>
              <div>
                <p className="text-xl font-black text-white">{item.value}</p>
                <p className="text-[9px] font-bold uppercase mt-0.5 opacity-70">{item.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {hotel?.recentBookings && hotel.recentBookings.length > 0 ? (
        <div className="space-y-2">
          {hotel.recentBookings.map(bk => (
            <div key={bk.id} className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#0c0e1a] border border-white/[0.06] hover:border-white/10 transition-all">
              <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                <Hotel size={16} className="text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-white truncate">{bk.guestName}</p>
                <p className="text-[10px] text-slate-500">{bk.roomType} · #{bk.bookingNo}</p>
                <div className="flex items-center gap-1.5 mt-0.5 text-[9px] text-slate-600">
                  <span>{new Date(bk.arrivalDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                  <ChevronRight size={9} />
                  <span>{new Date(bk.departureDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                </div>
              </div>
              <span className={`text-[9px] font-black px-2 py-1 rounded-lg whitespace-nowrap ${
                bk.status === 'CHECKED_IN' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' :
                bk.status === 'CONFIRMED' ? 'bg-sky-500/15 text-sky-400 border border-sky-500/25' :
                'bg-slate-800 text-slate-500'
              }`}>
                {bk.status.replace(/_/g, ' ')}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center">
          <Hotel size={32} className="mx-auto text-slate-700 mb-2" />
          <p className="text-slate-500 text-sm font-bold">No recent bookings</p>
          <Link href="/hotel/bookings" className="mt-2 text-amber-400 text-xs font-black">+ Create First Booking</Link>
        </div>
      )}
    </div>
  );

  const StaffSection = () => (
    <div className="space-y-4">
      <div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">Staff Status</p>
        <p className="text-base font-black text-white">Who's on duty today</p>
      </div>

      <div className="p-4 rounded-3xl bg-gradient-to-r from-violet-500/10 to-indigo-500/10 border border-violet-500/15">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-2xl font-black text-emerald-400">{staff.presentNow}</p>
            <p className="text-[9px] text-slate-500 font-black uppercase mt-0.5">On Duty</p>
          </div>
          <div>
            <p className="text-2xl font-black text-rose-400">{staff.notArrivedCount}</p>
            <p className="text-[9px] text-slate-500 font-black uppercase mt-0.5">Absent</p>
          </div>
          <div>
            <p className="text-2xl font-black text-white">{staff.totalActive}</p>
            <p className="text-[9px] text-slate-500 font-black uppercase mt-0.5">Total</p>
          </div>
        </div>
        <div className="mt-3 h-2 bg-white/5 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all"
            style={{ width: `${staff.totalActive > 0 ? (staff.presentNow / staff.totalActive) * 100 : 0}%` }} />
        </div>
        <p className="text-[10px] text-slate-500 text-center mt-1.5">
          {staff.totalActive > 0 ? Math.round((staff.presentNow / staff.totalActive) * 100) : 0}% attendance today
        </p>
      </div>

      {/* ON DUTY */}
      {staff.attendanceToday.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full" />
            <p className="text-[11px] font-black text-emerald-400 uppercase tracking-wider">On Duty ({staff.presentNow})</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            {staff.attendanceToday.map(member => (
              <div key={member.id} className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#0c0e1a] border border-white/[0.06]">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-black text-sm ${member.stillPresent ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-white truncate">{member.name}</p>
                  <p className="text-[10px] text-slate-500">{member.designation}</p>
                  <div className="flex items-center gap-2 mt-0.5 text-[9px] text-slate-600">
                    <span>In: {fmtTime(member.clockIn)}</span>
                    {member.clockOut && <span>· Out: {fmtTime(member.clockOut)}</span>}
                    {member.hoursWorked > 0 && <span>· {member.hoursWorked.toFixed(1)}h</span>}
                  </div>
                </div>
                <span className={`text-[9px] font-black px-2 py-1 rounded-lg whitespace-nowrap ${member.stillPresent ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' : 'bg-slate-800 text-slate-500'}`}>
                  {member.stillPresent ? '● On Duty' : '✓ Done'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ABSENT */}
      {staff.notArrivedToday.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
            <p className="text-[11px] font-black text-rose-400 uppercase tracking-wider">Not Arrived ({staff.notArrivedCount})</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            {staff.notArrivedToday.map(member => (
              <div key={member.id} className="flex items-center gap-3 p-3.5 rounded-2xl bg-rose-500/5 border border-rose-500/15">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center shrink-0 font-black text-sm text-rose-400">
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-black text-white">{member.name}</p>
                  <p className="text-[10px] text-slate-500">{member.designation}</p>
                </div>
                <span className="text-[9px] font-black px-2 py-1 rounded-lg bg-rose-500/15 text-rose-400 border border-rose-500/25 whitespace-nowrap">
                  ✗ Absent
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {staff.notArrivedCount === 0 && staff.presentNow > 0 && (
        <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-emerald-500/8 border border-emerald-500/15">
          <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
          <p className="text-emerald-400 font-black text-sm">Everyone is here! 🎉</p>
        </div>
      )}

      <Link href={`${p}/hoteladmin/staff`}
        className="flex items-center justify-center gap-2 py-3 rounded-2xl border border-white/10 text-slate-400 text-sm font-black hover:border-violet-500/30 transition-all">
        Full Staff Management <ChevronRight size={15} />
      </Link>
    </div>
  );

  // ────────────────────────────────────────────────────────────────────────────
  // Order submit handlers
  const submitFoodOrder = async () => {
    if (!foodOrderItems.length || !foodGuestName.trim()) return;
    setFoodOrderSubmitting(true);
    try {
      const res = await fetch('/api/hotel/admin-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'FOOD', propertyId: selectedPropertyId,
          items: foodOrderItems, guestName: foodGuestName,
          roomNo: foodRoomNo, note: foodOrderNote,
        }),
      });
      const d = await res.json();
      if (d.success) {
        alert(`✅ Order placed! Order No: ${d.data?.orderNo}\nReceptionist has been notified.`);
        setShowFoodOrderModal(false);
        setFoodOrderItems([]); setFoodGuestName(''); setFoodRoomNo(''); setFoodOrderNote('');
      } else { alert('❌ ' + (d.message || 'Order failed')); }
    } catch { alert('❌ Network error'); }
    finally { setFoodOrderSubmitting(false); }
  };

  const submitStockOrder = async () => {
    if (!stockOrderItems.length) return;
    setStockOrderSubmitting(true);
    try {
      const res = await fetch('/api/hotel/admin-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'STOCK', propertyId: selectedPropertyId,
          items: stockOrderItems, note: stockOrderNote,
        }),
      });
      const d = await res.json();
      if (d.success) {
        alert(`✅ Purchase order sent! PO No: ${d.data?.poNo}\nReceptionist has been notified.`);
        setShowInventoryModal(false);
        setStockOrderItems([]); setStockOrderNote('');
      } else { alert('❌ ' + (d.message || 'Failed')); }
    } catch { alert('❌ Network error'); }
    finally { setStockOrderSubmitting(false); }
  };

  // Inventory Section component
  const InventorySection = () => {
    const criticalItems = inventoryItems.filter(i => i.stockStatus === 'CRITICAL');
    const lowItems = inventoryItems.filter(i => i.stockStatus === 'LOW');
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">Inventory & Stock</p>
            <p className="text-base font-black text-white">Stock Overview · {inventorySummary.total} items</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowFoodOrderModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-300 text-[11px] font-black hover:bg-orange-500/25 transition-all">
              <UtensilsCrossed size={13} /> F&B Order
            </button>
            <button onClick={() => setShowInventoryModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 text-black text-[11px] font-black">
              <ShoppingCart size={13} /> Purchase Order
            </button>
          </div>
        </div>

        {/* Summary Pills */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Critical', value: inventorySummary.critical, color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
            { label: 'Low Stock', value: inventorySummary.low, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
            { label: 'OK', value: inventorySummary.ok, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
          ].map(s => (
            <div key={s.label} className={`${s.color} border rounded-2xl p-3 text-center`}>
              <p className="text-2xl font-black">{s.value}</p>
              <p className="text-[9px] font-black uppercase mt-0.5 opacity-70">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Critical alerts */}
        {criticalItems.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-black text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle size={11} /> Critical — Out of Stock / Below Min
            </p>
            {criticalItems.slice(0, 4).map(item => (
              <div key={item.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-rose-500/8 border border-rose-500/15">
                <div className="flex items-center gap-2.5">
                  <Package size={14} className="text-rose-400 shrink-0" />
                  <div>
                    <p className="text-xs font-black text-white">{item.name}</p>
                    <p className="text-[10px] text-slate-500">{item.currentQuantity} {item.unit || 'pcs'} left · Min: {item.minThreshold}</p>
                  </div>
                </div>
                <button onClick={() => {
                  const already = stockOrderItems.find(x => x.id === item.id);
                  if (!already) setStockOrderItems(prev => [...prev, { id: item.id, name: item.name, unit: item.unit, requestedQty: item.minThreshold * 2 || 10 }]);
                  setShowInventoryModal(true);
                }} className="text-[10px] font-black px-2 py-1 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/25 hover:bg-rose-500/30 whitespace-nowrap">
                  + Reorder
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Low stock */}
        {lowItems.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle size={11} /> Low Stock Warning
            </p>
            {lowItems.slice(0, 3).map(item => (
              <div key={item.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-amber-500/8 border border-amber-500/15">
                <div className="flex items-center gap-2.5">
                  <Package size={14} className="text-amber-400 shrink-0" />
                  <div>
                    <p className="text-xs font-black text-white">{item.name}</p>
                    <p className="text-[10px] text-slate-500">{item.currentQuantity} {item.unit || 'pcs'} · Min: {item.minThreshold}</p>
                  </div>
                </div>
                <button onClick={() => {
                  const already = stockOrderItems.find(x => x.id === item.id);
                  if (!already) setStockOrderItems(prev => [...prev, { id: item.id, name: item.name, unit: item.unit, requestedQty: item.minThreshold * 2 || 10 }]);
                  setShowInventoryModal(true);
                }} className="text-[10px] font-black px-2 py-1 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/25 hover:bg-amber-500/30 whitespace-nowrap">
                  + Reorder
                </button>
              </div>
            ))}
          </div>
        )}

        {inventorySummary.total === 0 && (
          <div className="py-6 text-center">
            <Package size={28} className="mx-auto text-slate-700 mb-2" />
            <p className="text-slate-500 text-sm">No inventory items found</p>
            <Link href="/hotel/inventory" className="mt-2 text-amber-400 text-xs font-black block">Set up inventory →</Link>
          </div>
        )}

        <Link href="/hotel/inventory"
          className="flex items-center justify-center gap-2 py-3 rounded-2xl border border-white/10 text-slate-400 text-sm font-black hover:border-amber-500/30 transition-all">
          Full Inventory Management <ChevronRight size={15} />
        </Link>
      </div>
    );
  };

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div className="text-white" style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>

      {/* ── FOOD ORDER MODAL ── */}
      {showFoodOrderModal && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-[#0c0e1a] border border-white/10 rounded-3xl shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-500/15 flex items-center justify-center">
                  <UtensilsCrossed size={18} className="text-orange-400" />
                </div>
                <div>
                  <p className="font-black text-white text-sm">F&B Room Order</p>
                  <p className="text-[10px] text-slate-500">Select items from menu</p>
                </div>
              </div>
              <button onClick={() => setShowFoodOrderModal(false)} className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-5 space-y-4">
              {/* Guest info */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1.5">Guest Name *</label>
                  <input value={foodGuestName} onChange={e => setFoodGuestName(e.target.value)} placeholder="e.g. Rahul Sharma"
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500/50 placeholder-slate-600" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1.5">Room No.</label>
                  <input value={foodRoomNo} onChange={e => setFoodRoomNo(e.target.value)} placeholder="e.g. 101"
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500/50 placeholder-slate-600" />
                </div>
              </div>

              {/* Product search */}
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1.5">Search Menu Items</label>
                <div className="relative">
                  <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input value={foodProductSearch} onChange={e => setFoodProductSearch(e.target.value)} placeholder="Search dishes..."
                    className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500/50 placeholder-slate-600" />
                </div>
              </div>

              {/* Product list */}
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {posProducts
                  .filter(p => !foodProductSearch || p.name.toLowerCase().includes(foodProductSearch.toLowerCase()))
                  .slice(0, 30)
                  .map(product => {
                    const inCart = foodOrderItems.find(i => i.productId === product.id);
                    return (
                      <div key={product.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-all">
                        <div>
                          <p className="text-sm font-bold text-white">{product.name}</p>
                          <p className="text-[10px] text-slate-500">{product.categoryName} · {fmt(product.sellingPrice)}</p>
                        </div>
                        {inCart ? (
                          <div className="flex items-center gap-2">
                            <button onClick={() => setFoodOrderItems(prev => prev.map(i => i.productId === product.id ? { ...i, qty: Math.max(1, i.qty - 1) } : i))}
                              className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-white text-sm font-black"><Minus size={12} /></button>
                            <span className="text-sm font-black text-amber-400 w-4 text-center">{inCart.qty}</span>
                            <button onClick={() => setFoodOrderItems(prev => prev.map(i => i.productId === product.id ? { ...i, qty: i.qty + 1 } : i))}
                              className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 text-sm font-black"><Plus size={12} /></button>
                            <button onClick={() => setFoodOrderItems(prev => prev.filter(i => i.productId !== product.id))}
                              className="w-6 h-6 rounded-lg bg-rose-500/15 flex items-center justify-center text-rose-400"><X size={10} /></button>
                          </div>
                        ) : (
                          <button onClick={() => setFoodOrderItems(prev => [...prev, { productId: product.id, name: product.name, price: product.sellingPrice, qty: 1 }])}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/15 text-amber-400 text-[11px] font-black border border-amber-500/25 hover:bg-amber-500/25">
                            <Plus size={11} /> Add
                          </button>
                        )}
                      </div>
                    );
                  })}
                {posProducts.length === 0 && <p className="text-slate-500 text-sm text-center py-4">No menu items available</p>}
              </div>

              {/* Cart summary */}
              {foodOrderItems.length > 0 && (
                <div className="p-3 rounded-2xl bg-amber-500/8 border border-amber-500/20">
                  <p className="text-[10px] font-black text-amber-400 uppercase mb-2">Order Summary ({foodOrderItems.length} items)</p>
                  {foodOrderItems.map(i => (
                    <div key={i.productId} className="flex justify-between text-xs text-slate-300 py-0.5">
                      <span>{i.name} × {i.qty}</span><span className="font-bold">{fmt(i.price * i.qty)}</span>
                    </div>
                  ))}
                  <div className="border-t border-amber-500/20 mt-2 pt-2 flex justify-between font-black text-amber-300 text-sm">
                    <span>Total</span>
                    <span>{fmt(foodOrderItems.reduce((s, i) => s + i.price * i.qty, 0))}</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1.5">Note (optional)</label>
                <input value={foodOrderNote} onChange={e => setFoodOrderNote(e.target.value)} placeholder="Special instructions..."
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500/50 placeholder-slate-600" />
              </div>
            </div>

            <div className="px-5 py-4 border-t border-white/[0.06] flex gap-3">
              <button onClick={() => setShowFoodOrderModal(false)} className="flex-1 py-3 rounded-xl border border-white/10 text-slate-400 text-sm font-black">Cancel</button>
              <button onClick={submitFoodOrder} disabled={foodOrderSubmitting || !foodOrderItems.length || !foodGuestName.trim()}
                className="flex-1 py-3 rounded-xl bg-orange-500 text-white font-black text-sm disabled:opacity-40 flex items-center justify-center gap-2">
                {foodOrderSubmitting ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                Place Order & Notify Receptionist
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── STOCK PURCHASE ORDER MODAL ── */}
      {showInventoryModal && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-[#0c0e1a] border border-white/10 rounded-3xl shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center">
                  <ShoppingCart size={18} className="text-amber-400" />
                </div>
                <div>
                  <p className="font-black text-white text-sm">Purchase Order Request</p>
                  <p className="text-[10px] text-slate-500">Send reorder to receptionist</p>
                </div>
              </div>
              <button onClick={() => setShowInventoryModal(false)} className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-5 space-y-4">
              {/* Add from low/critical items */}
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase mb-2">Add Items to Order</p>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {inventoryItems.filter(i => i.stockStatus !== 'OK').map(item => {
                    const inOrder = stockOrderItems.find(x => x.id === item.id);
                    return (
                      <div key={item.id} className={`flex items-center justify-between px-3 py-2 rounded-xl border ${item.stockStatus === 'CRITICAL' ? 'bg-rose-500/8 border-rose-500/15' : 'bg-amber-500/8 border-amber-500/15'}`}>
                        <div>
                          <p className="text-xs font-black text-white">{item.name}</p>
                          <p className="text-[10px] text-slate-500">{item.currentQuantity} {item.unit} · Min: {item.minThreshold}</p>
                        </div>
                        {inOrder ? (
                          <span className="text-[10px] text-emerald-400 font-black">✓ Added</span>
                        ) : (
                          <button onClick={() => setStockOrderItems(prev => [...prev, { id: item.id, name: item.name, unit: item.unit, requestedQty: Math.max(item.minThreshold * 2, 10) }])}
                            className="text-[10px] px-2 py-1 rounded-lg bg-white/10 text-slate-300 font-black hover:bg-white/20">+ Add</button>
                        )}
                      </div>
                    );
                  })}
                  {inventoryItems.filter(i => i.stockStatus !== 'OK').length === 0 && (
                    <p className="text-slate-500 text-sm text-center py-3">All stock levels OK ✅</p>
                  )}
                </div>
              </div>

              {/* Selected items with qty */}
              {stockOrderItems.length > 0 && (
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase mb-2">Order Items ({stockOrderItems.length})</p>
                  <div className="space-y-2">
                    {stockOrderItems.map(item => (
                      <div key={item.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                        <Package size={14} className="text-amber-400 shrink-0" />
                        <span className="flex-1 text-xs font-bold text-white truncate">{item.name}</span>
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => setStockOrderItems(prev => prev.map(x => x.id === item.id ? { ...x, requestedQty: Math.max(1, x.requestedQty - 1) } : x))}
                            className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-white"><Minus size={11} /></button>
                          <span className="text-sm font-black text-amber-400 w-6 text-center">{item.requestedQty}</span>
                          <button onClick={() => setStockOrderItems(prev => prev.map(x => x.id === item.id ? { ...x, requestedQty: x.requestedQty + 1 } : x))}
                            className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400"><Plus size={11} /></button>
                          <span className="text-[10px] text-slate-500">{item.unit}</span>
                          <button onClick={() => setStockOrderItems(prev => prev.filter(x => x.id !== item.id))}
                            className="w-6 h-6 rounded-lg bg-rose-500/15 flex items-center justify-center text-rose-400"><X size={10} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1.5">Note for Receptionist</label>
                <input value={stockOrderNote} onChange={e => setStockOrderNote(e.target.value)} placeholder="Urgent, preferred supplier, etc."
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500/50 placeholder-slate-600" />
              </div>
            </div>

            <div className="px-5 py-4 border-t border-white/[0.06] flex gap-3">
              <button onClick={() => setShowInventoryModal(false)} className="flex-1 py-3 rounded-xl border border-white/10 text-slate-400 text-sm font-black">Cancel</button>
              <button onClick={submitStockOrder} disabled={stockOrderSubmitting || !stockOrderItems.length}
                className="flex-1 py-3 rounded-xl bg-amber-500 text-black font-black text-sm disabled:opacity-40 flex items-center justify-center gap-2">
                {stockOrderSubmitting ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                Send Purchase Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ADMIN DIRECT BOOK ROOM MODAL ── */}
      <AdminBookRoomModal
        isOpen={showBookRoomModal}
        onClose={() => {
          setShowBookRoomModal(false);
          setPreselectedRoom(null);
        }}
        propertyId={selectedPropertyId}
        propertyCode={propertyCode}
        roomTypes={roomTypes}
        availableRooms={availableRooms}
        preselectedRoom={preselectedRoom}
        onBookingSuccess={() => {
          fetchData(true);
          if (selectedPropertyId) {
            fetch(`/api/hotel/rooms?propertyId=${selectedPropertyId}`)
              .then(r => r.json())
              .then(roomData => {
                const rooms = (roomData.success ? roomData.data : roomData) || [];
                setAvailableRooms(
                  rooms.filter((r: any) => r.status === 'VACANT' || r.status === 'AVAILABLE')
                    .map((r: any) => ({
                      id: r.id, roomNumber: r.roomNumber,
                      type: r.roomType?.name || r.type || '',
                      price: r.customRate || r.roomType?.baseRate || r.roomType?.basePrice || r.price || 0,
                      roomTypeId: r.roomTypeId || r.roomType?.id || '',
                    }))
                );
              }).catch(() => {});
          }
        }}
      />

      {/* ──────────────────────────────────────────────────────
          MOBILE LAYOUT  (< lg)
          Small strip header + tabbed content + HotelAdminMobileNav (from shell)
      ────────────────────────────────────────────────────── */}
      <div className="lg:hidden">
        {/* Mobile mini-header: just the Book Room + refresh buttons */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-[#07080f]/80 sticky top-0 z-20 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-[10px] text-emerald-400 font-black">LIVE</span>
            {lastUpdated && <span className="text-[10px] text-slate-500">· {fmtTime(lastUpdated.toISOString())}</span>}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { setPreselectedRoom(null); setShowBookRoomModal(true); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-[11px] font-black shadow-lg shadow-amber-500/20 active:scale-95 cursor-pointer">
              <Plus size={13} /> Book Room
            </button>
            <button onClick={() => fetchData(true)} disabled={refreshing}
              className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 disabled:opacity-40">
              <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            </button>
            {alerts.length > 0 && (
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-400 relative">
                <Bell size={15} />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full text-[9px] font-black text-white flex items-center justify-center">
                  {alerts.length}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Mobile single-scroll content */}
        <div className="px-4 pb-24 pt-4 space-y-5">
          <HeroSection />
          <KpiGrid />
          <AlertsSection />
          <RevenueCard />
          <QuickAccessGrid />
          {hotel?.recentBookings && hotel.recentBookings.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">Recent Bookings</p>
                <Link href={`${p}/hoteladmin/bookings`} className="text-[10px] text-amber-400 font-black flex items-center gap-1">
                  See All <ChevronRight size={11} />
                </Link>
              </div>
              <div className="space-y-2">
                {hotel.recentBookings.slice(0, 3).map(bk => (
                  <div key={bk.id} className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#0c0e1a] border border-white/[0.06]">
                    <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                      <Hotel size={16} className="text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-white truncate">{bk.guestName}</p>
                      <p className="text-[10px] text-slate-500">{bk.roomType} · #{bk.bookingNo}</p>
                    </div>
                    <span className={`text-[9px] font-black px-2 py-1 rounded-lg ${
                      bk.status === 'CHECKED_IN' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' :
                      bk.status === 'CONFIRMED' ? 'bg-sky-500/15 text-sky-400 border border-sky-500/25' :
                      'bg-slate-800 text-slate-500'
                    }`}>{bk.status.replace(/_/g, ' ')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <StaffSection />
          <InventorySection />
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────
          DESKTOP LAYOUT  (≥ lg)
          Proper multi-column layout, no custom header/bottom nav
          The shell's TopNavbar + HotelAdminSidebar handle the chrome
      ────────────────────────────────────────────────────── */}
      <div className="hidden lg:block space-y-6">

        {/* Desktop page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white">{selectedProperty?.name || 'Hotel Admin'}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-xs text-emerald-400 font-bold">LIVE</span>
              {lastUpdated && <span className="text-xs text-slate-500">· Updated {fmtTime(lastUpdated.toISOString())}</span>}
              {selectedProperty?.city && <span className="text-xs text-slate-500">· {selectedProperty.city}</span>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {alerts.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs font-bold">
                <Bell size={14} />
                <span>{alerts.length} alert{alerts.length !== 1 ? 's' : ''}</span>
              </div>
            )}
            <button onClick={() => fetchData(true)} disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm font-bold hover:border-white/20 transition-all disabled:opacity-40">
              <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
            <Link href="/hotel/pos/tables"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-300 font-black text-sm hover:bg-orange-500/25 transition-all active:scale-95">
              <UtensilsCrossed size={15} /> F&B Order
            </Link>
            <button
              type="button"
              onClick={() => { setPreselectedRoom(null); setShowBookRoomModal(true); }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-sm shadow-lg shadow-amber-500/25 transition-all active:scale-95 cursor-pointer">
              <Plus size={16} /> Book Room
            </button>
          </div>
        </div>

        {/* Desktop layout: 2 columns */}
        <div className="grid grid-cols-3 gap-6">

          {/* LEFT COLUMN (2/3) */}
          <div className="col-span-2 space-y-6">
            <HeroSection />
            <KpiGrid />
            <AlertsSection />
            <RevenueCard />
            <QuickAccessGrid />
            <RoomsGrid />
            <InventorySection />
          </div>

          {/* RIGHT COLUMN (1/3) */}
          <div className="col-span-1 space-y-6">
            <BookingsSection />
            <StaffSection />

            {/* All-time record */}
            <div className="p-5 rounded-3xl bg-gradient-to-r from-indigo-500/8 to-purple-500/8 border border-indigo-500/15">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] mb-4">All-Time Records</p>
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] text-slate-500 font-bold">Total Revenue</p>
                  <p className="text-xl font-black text-white">{fmt(allTime.totalRevenue)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-bold">Total Guests Served</p>
                  <p className="text-xl font-black text-white">{allTime.totalCustomers.toLocaleString('en-IN')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
