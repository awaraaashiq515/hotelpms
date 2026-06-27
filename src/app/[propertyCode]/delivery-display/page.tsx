'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import {
  Truck, ShoppingBag, Clock, CheckCircle2, XCircle, Package,
  RefreshCw, Wifi, Volume2, VolumeX, ChevronLeft, MapPin, Phone,
  User, CreditCard, Banknote, AlertTriangle, Flame, ChefHat,
  Navigation, Star, TrendingUp, DollarSign, Activity, Bell,
  Zap, Timer, Eye, Filter
} from 'lucide-react';
import Link from 'next/link';
import { useSidebar } from '@/context/sidebar-context';

const POLL_INTERVAL = 8; // seconds

// ─── Status Definitions ───────────────────────────────────────────────────────

type OrderStatus =
  | 'OPEN' | 'PENDING' | 'PLACED'
  | 'ACCEPTED' | 'KOT_RUNNING'
  | 'IN_KITCHEN' | 'READY'
  | 'OUT_FOR_DELIVERY'
  | 'SETTLED' | 'COMPLETED'
  | 'CANCELLED';

interface ColumnDef {
  id: string;
  statuses: OrderStatus[];
  label: string;
  emoji: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
  badge: string;
  glow: string;
  nextStatus: OrderStatus | null;
  nextLabel: string;
  nextBtnCls: string;
}

const COLUMNS: ColumnDef[] = [
  {
    id: 'new_accepted',
    statuses: ['OPEN', 'PENDING', 'PLACED', 'ACCEPTED', 'KOT_RUNNING'],
    label: 'New & Accepted',
    emoji: '🆕',
    icon: Flame,
    color: 'text-orange-400',
    bg: 'bg-orange-500/8',
    border: 'border-orange-500/25',
    badge: 'bg-orange-500',
    glow: 'shadow-orange-500/15',
    nextStatus: null,
    nextLabel: '',
    nextBtnCls: '',
  },
  {
    id: 'preparing',
    statuses: ['IN_KITCHEN', 'READY'],
    label: 'Preparing',
    emoji: '👨‍🍳',
    icon: ChefHat,
    color: 'text-amber-400',
    bg: 'bg-amber-500/8',
    border: 'border-amber-500/25',
    badge: 'bg-amber-500',
    glow: 'shadow-amber-500/15',
    nextStatus: null,
    nextLabel: '',
    nextBtnCls: '',
  },
  {
    id: 'out_for_delivery',
    statuses: ['OUT_FOR_DELIVERY'],
    label: 'Out for Delivery',
    emoji: '🛵',
    icon: Navigation,
    color: 'text-purple-400',
    bg: 'bg-purple-500/8',
    border: 'border-purple-500/25',
    badge: 'bg-purple-500',
    glow: 'shadow-purple-500/15',
    nextStatus: null,
    nextLabel: '',
    nextBtnCls: '',
  },
  {
    id: 'delivered',
    statuses: ['SETTLED', 'COMPLETED'],
    label: 'Delivered',
    emoji: '📦',
    icon: Package,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/8',
    border: 'border-emerald-500/25',
    badge: 'bg-emerald-600',
    glow: 'shadow-emerald-500/15',
    nextStatus: null,
    nextLabel: '',
    nextBtnCls: '',
  },
  {
    id: 'cancelled',
    statuses: ['CANCELLED'],
    label: 'Cancelled',
    emoji: '❌',
    icon: XCircle,
    color: 'text-red-400',
    bg: 'bg-red-500/5',
    border: 'border-red-500/20',
    badge: 'bg-red-600',
    glow: 'shadow-red-500/10',
    nextStatus: null,
    nextLabel: '',
    nextBtnCls: '',
  },
];

// ─── Helper functions ─────────────────────────────────────────────────────────

function getElapsedMinutes(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
}

function formatElapsed(minutes: number): string {
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

function getUrgency(minutes: number, status: string): 'low' | 'medium' | 'high' {
  if (['SETTLED', 'COMPLETED', 'CANCELLED'].includes(status)) return 'low';
  if (minutes >= 45) return 'high';
  if (minutes >= 20) return 'medium';
  return 'low';
}

function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

const getStatusStyles = (status: OrderStatus) => {
  if (['OPEN', 'PENDING', 'PLACED'].includes(status)) {
    return {
      color: 'text-orange-400',
      bg: 'bg-orange-500/8',
      border: 'border-orange-500/25',
      glow: 'shadow-orange-500/15',
    };
  }
  if (['ACCEPTED', 'KOT_RUNNING'].includes(status)) {
    return {
      color: 'text-blue-400',
      bg: 'bg-blue-500/8',
      border: 'border-blue-500/25',
      glow: 'shadow-blue-500/15',
    };
  }
  if (['IN_KITCHEN', 'READY'].includes(status)) {
    return {
      color: 'text-amber-400',
      bg: 'bg-amber-500/8',
      border: 'border-amber-500/25',
      glow: 'shadow-amber-500/15',
    };
  }
  if (status === 'OUT_FOR_DELIVERY') {
    return {
      color: 'text-purple-400',
      bg: 'bg-purple-500/8',
      border: 'border-purple-500/25',
      glow: 'shadow-purple-500/15',
    };
  }
  if (['SETTLED', 'COMPLETED'].includes(status)) {
    return {
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/8',
      border: 'border-emerald-500/25',
      glow: 'shadow-emerald-500/15',
    };
  }
  return {
    color: 'text-red-400',
    bg: 'bg-red-500/5',
    border: 'border-red-500/20',
    glow: 'shadow-red-500/10',
  };
};

// ─── Order Card ───────────────────────────────────────────────────────────────

function OrderCard({
  order,
  column,
  onStatusUpdate,
  updating,
}: {
  order: any;
  column: ColumnDef;
  onStatusUpdate: (orderId: string, status: OrderStatus) => void;
  updating: boolean;
}) {
  const [elapsed, setElapsed] = useState(getElapsedMinutes(order.createdAt));

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(getElapsedMinutes(order.createdAt));
    }, 30000);
    return () => clearInterval(interval);
  }, [order.createdAt]);

  const urgency = getUrgency(elapsed, order.status);
  const isPrepaid = order.isPrepaid;
  const isCOD = !isPrepaid && (order.deliveryPaymentMethod === 'CASH' || !order.deliveryPaymentMethod);
  const isOnline = !isPrepaid && order.deliveryPaymentMethod && order.deliveryPaymentMethod !== 'CASH';

  const status = order.status as OrderStatus;
  const styles = getStatusStyles(status);

  // Dynamic next action based on actual status
  let nextStatus: OrderStatus | null = null;
  let nextLabel = '';
  let nextBtnCls = '';

  if (['OPEN', 'PENDING', 'PLACED'].includes(status)) {
    nextStatus = 'ACCEPTED';
    nextLabel = 'Accept Order';
    nextBtnCls = 'bg-orange-500 hover:bg-orange-400 shadow-orange-500/30';
  } else if (['ACCEPTED', 'KOT_RUNNING'].includes(status)) {
    nextStatus = 'IN_KITCHEN';
    nextLabel = 'Start Preparing';
    nextBtnCls = 'bg-blue-500 hover:bg-blue-400 shadow-blue-500/30';
  } else if (['IN_KITCHEN', 'READY'].includes(status)) {
    nextStatus = 'OUT_FOR_DELIVERY';
    nextLabel = 'Out for Delivery';
    nextBtnCls = 'bg-amber-500 hover:bg-amber-400 shadow-amber-500/30';
  } else if (status === 'OUT_FOR_DELIVERY') {
    nextStatus = 'SETTLED';
    nextLabel = 'Mark Delivered';
    nextBtnCls = 'bg-purple-500 hover:bg-purple-400 shadow-purple-500/30';
  }

  return (
    <div
      className={`relative rounded-xl border ${styles.border} ${styles.bg} border-l-4 ${
        urgency === 'high' ? 'border-l-red-500' : urgency === 'medium' ? 'border-l-amber-400' : styles.border.replace('border-', 'border-l-')
      } p-3 flex flex-col gap-2 transition-all hover:scale-[1.01] shadow-sm ${styles.glow}`}
    >
      {/* Order Header */}
      <div className="flex items-start justify-between gap-1.5">
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className={`text-[9px] font-black uppercase tracking-widest ${styles.color} opacity-70`}>
            {order.orderNo}
          </span>
          <span className="text-white font-black text-sm leading-tight truncate">
            {order.deliveryCustomerName || 'Customer'}
          </span>
          {order.deliveryPhone && (
            <a
              href={`tel:${order.deliveryPhone}`}
              className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white transition-colors font-semibold"
            >
              <Phone size={9} />
              {order.deliveryPhone}
            </a>
          )}
        </div>

        {/* Timer */}
        <div
          className={`flex flex-col items-end gap-1 shrink-0 px-1.5 py-1 rounded-lg border text-right ${
            urgency === 'high'
              ? 'bg-red-500/15 border-red-500/30 text-red-400'
              : urgency === 'medium'
              ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
              : 'bg-slate-800/60 border-slate-700/50 text-slate-400'
          }`}
        >
          <Timer size={9} />
          <span className="text-[9px] font-black tabular-nums leading-none">{formatElapsed(elapsed)}</span>
        </div>
      </div>

      {/* Address */}
      {order.deliveryAddress && order.orderType === 'DELIVERY' && (
        <div className="flex items-start gap-1 bg-slate-900/50 rounded-lg px-2 py-1">
          <MapPin size={10} className="text-slate-500 mt-0.5 shrink-0" />
          <span className="text-[9px] text-slate-400 font-medium leading-relaxed line-clamp-2">
            {order.deliveryAddress}
          </span>
        </div>
      )}
      {order.orderType === 'TAKEAWAY' && (
        <div className="flex items-center gap-1 bg-slate-900/50 rounded-lg px-2 py-1">
          <ShoppingBag size={10} className="text-blue-400 shrink-0" />
          <span className="text-[9px] text-blue-400 font-black uppercase tracking-wider">Self Pickup</span>
        </div>
      )}

      {/* Items */}
      <div className="space-y-1">
        {order.items?.slice(0, 4).map((item: any, idx: number) => (
          <div key={idx} className="flex items-center justify-between gap-2">
            <span className="text-[10px] text-slate-300 font-semibold truncate flex-1">
              {item.product?.name || 'Item'}
            </span>
            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-lg ${styles.bg} ${styles.color} border ${styles.border}`}>
              ×{item.quantity}
            </span>
          </div>
        ))}
        {order.items?.length > 4 && (
          <p className={`text-[9px] font-black uppercase ${styles.color} opacity-70`}>
            +{order.items.length - 4} more items
          </p>
        )}
      </div>

      {/* Footer: Total + Payment */}
      <div className="flex items-center justify-between pt-1 border-t border-white/5 mt-auto">
        <div className="flex items-center gap-1">
          {isPrepaid ? (
            <span className="inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
              <CreditCard size={8} />
              Prepaid
            </span>
          ) : isCOD ? (
            <span className="inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25">
              <Banknote size={8} />
              COD
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/25">
              <CreditCard size={8} />
              Online
            </span>
          )}
          {urgency === 'high' && (
            <span className="inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/25 animate-pulse">
              <AlertTriangle size={8} />
              Urgent
            </span>
          )}
        </div>
        <span className="text-white font-black text-sm">
          {formatCurrency(order.grandTotal || 0)}
        </span>
      </div>

      {/* Action Button */}
      {nextStatus && (
        <button
          onClick={() => onStatusUpdate(order.id, nextStatus!)}
          disabled={updating}
          className={`w-full py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest text-white transition-all shadow-md ${nextBtnCls} disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer`}
        >
          {updating ? (
            <RefreshCw size={11} className="animate-spin" />
          ) : (
            <>
              <Zap size={10} />
              {nextLabel}
            </>
          )}
        </button>
      )}
    </div>
  );
}



// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DeliveryDisplayPage() {
  const params = useParams();
  const propertyCode = params?.propertyCode as string;
  const p = propertyCode ? `/${propertyCode}` : '';

  const { setHidden, setOpen } = useSidebar();

  useEffect(() => {
    setOpen(false);
    setHidden(true);
    return () => { setOpen(true); setHidden(false); };
  }, [setOpen, setHidden]);

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(POLL_INTERVAL);
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const prevOrderIdsRef = useRef<Set<string>>(new Set());
  const initialLoadRef = useRef(true);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const voiceEnabledRef = useRef(false);

  useEffect(() => {
    voiceEnabledRef.current = voiceEnabled;
  }, [voiceEnabled]);

  // Load system voices
  useEffect(() => {
    const loadVoices = () => {
      const v = window.speechSynthesis.getVoices();
      setVoices(v);
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  const playVoice = useCallback((text: string) => {
    if (!voiceEnabledRef.current) return;
    if (!('speechSynthesis' in window)) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-IN';
    utterance.rate = 0.9;
    const enVoice = voices.find(v => v.lang.startsWith('en'));
    if (enVoice) utterance.voice = enVoice;
    const w = window as any;
    w._utterances = w._utterances || [];
    w._utterances.push(utterance);
    utterance.onend = () => {
      const idx = w._utterances.indexOf(utterance);
      if (idx > -1) w._utterances.splice(idx, 1);
    };
    window.speechSynthesis.speak(utterance);
  }, [voices]);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/delivery-display');
      const json = await res.json();
      if (json.success) {
        const newOrders: any[] = json.data.orders || [];

        // Voice: announce new orders
        if (!initialLoadRef.current) {
          newOrders.forEach((order: any) => {
            if (!prevOrderIdsRef.current.has(order.id)) {
              playVoice(`New delivery order from ${order.deliveryCustomerName || 'a customer'}`);
            }
          });
        }

        prevOrderIdsRef.current = new Set(newOrders.map((o: any) => o.id));
        initialLoadRef.current = false;
        setData(json.data);
      }
    } catch (err) {
      console.error('[Delivery Display] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [playVoice]);

  const startCountdown = useCallback(() => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setCountdown(POLL_INTERVAL);
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchData();
          return POLL_INTERVAL;
        }
        return prev - 1;
      });
    }, 1000);
  }, [fetchData]);

  useEffect(() => {
    setMounted(true);
    fetchData();
    startCountdown();
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const handleStatusUpdate = useCallback(async (orderId: string, status: OrderStatus) => {
    if (updatingIds.has(orderId)) return;
    setUpdatingIds((prev) => new Set(prev).add(orderId));
    try {
      const res = await fetch('/api/delivery-display', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status }),
      });
      const json = await res.json();
      if (json.success) {
        await fetchData();
      }
    } catch (err) {
      console.error('[Delivery Display] Update error:', err);
    } finally {
      setUpdatingIds((prev) => {
        const s = new Set(prev);
        s.delete(orderId);
        return s;
      });
    }
  }, [updatingIds, fetchData]);

  const orders: any[] = data?.orders || [];
  const stats = data?.stats || {};
  const property = data?.property;

  const getColOrders = (col: ColumnDef) => {
    const list = orders.filter((o) => col.statuses.includes(o.status as OrderStatus));
    if (col.id === 'new_accepted') {
      return list.sort((a, b) => {
        const aNew = ['OPEN', 'PENDING', 'PLACED'].includes(a.status);
        const bNew = ['OPEN', 'PENDING', 'PLACED'].includes(b.status);
        if (aNew && !bNew) return -1;
        if (!aNew && bNew) return 1;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
    }
    return list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  };

  if (!mounted || loading) {
    return (
      <div className="h-screen w-screen bg-[#030a14] flex flex-col items-center justify-center gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-teal-500/20 border-t-teal-500 animate-spin" />
          <div className="absolute inset-2 rounded-full border-4 border-blue-500/10 border-b-blue-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">
          Loading Delivery Hub…
        </p>
      </div>
    );
  }

  return (
    <div className="h-full bg-[#030a14] text-white flex flex-col overflow-hidden select-none font-sans">

      {/* ── TOP BAR ──────────────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center justify-between px-4 py-1.5 border-b border-slate-800/80 bg-[#060e1c]/90 backdrop-blur-md z-30">

        {/* Left: Back + Logo + Title + Inline Stats */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href={`${p}/operations`}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 text-slate-400 hover:text-white transition-all"
            >
              <ChevronLeft size={14} />
            </Link>

            {/* Property Logo from settings */}
            {property?.logoUrl ? (
              <img
                src={property.logoUrl}
                alt={property.brandName || property.name}
                className="w-8 h-8 rounded-lg object-cover border border-slate-700 shadow-lg shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center shadow-lg shrink-0">
                <Truck size={14} className="text-white" />
              </div>
            )}

            <div>
              <h1 className="text-xs font-black uppercase tracking-[0.12em] leading-none text-white md:text-sm">
                Online Order Portal
              </h1>
              <p className="text-[8px] font-bold text-teal-400 uppercase tracking-[0.2em] mt-0.5">
                {property?.brandName || property?.name || 'Your Restaurant'} · Home Delivery
              </p>
            </div>
          </div>

          {/* Compact Inline Stats */}
          <div className="flex items-center gap-1 bg-[#0b1528] px-2 py-1 rounded-lg border border-slate-800/80 shrink-0">
            <div className="flex items-center gap-1 px-1.5">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Sales</span>
              <span className="text-xs font-black text-teal-400">{formatCurrency(stats.todaySales || 0)}</span>
            </div>
            <div className="w-[1px] h-3 bg-slate-800" />
            <div className="flex items-center gap-1 px-1.5">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total</span>
              <span className="text-xs font-black text-blue-400">{stats.totalOrders || 0}</span>
            </div>
            <div className="w-[1px] h-3 bg-slate-800" />
            <div className="flex items-center gap-1 px-1.5">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">New</span>
              <span className="text-xs font-black text-orange-400">{stats.newOrders || 0}</span>
            </div>
            <div className="w-[1px] h-3 bg-slate-800" />
            <div className="flex items-center gap-1 px-1.5">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Prep</span>
              <span className="text-xs font-black text-amber-400">{stats.preparingOrders || 0}</span>
            </div>
            <div className="w-[1px] h-3 bg-slate-800" />
            <div className="flex items-center gap-1 px-1.5">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Out</span>
              <span className="text-xs font-black text-purple-400">{stats.outForDelivery || 0}</span>
            </div>
            <div className="w-[1px] h-3 bg-slate-800" />
            <div className="flex items-center gap-1 px-1.5">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Delivered</span>
              <span className="text-xs font-black text-emerald-400">{stats.deliveredOrders || 0}</span>
            </div>
            <div className="w-[1px] h-3 bg-slate-800" />
            <div className="flex items-center gap-1 px-1.5">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Cancel</span>
              <span className="text-xs font-black text-red-400">{stats.cancelledOrders || 0}</span>
            </div>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-2">

          {/* Active Orders Pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-teal-500/10 border border-teal-500/25 rounded-lg">
            <Activity size={10} className="text-teal-400" />
            <span className="text-[8px] font-black text-teal-400 uppercase tracking-widest">
              {stats.activeOrders || 0} Active
            </span>
          </div>

          {/* Voice Toggle */}
          <button
            onClick={() => setVoiceEnabled((v) => !v)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border transition-all ${
              voiceEnabled
                ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400'
                : 'bg-slate-800/60 border-slate-700 text-slate-500 hover:text-slate-300'
            }`}
          >
            {voiceEnabled ? <Volume2 size={11} /> : <VolumeX size={11} />}
            <span className="text-[8px] font-black uppercase tracking-widest hidden sm:block">
              {voiceEnabled ? 'Sound On' : 'Sound Off'}
            </span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={() => { fetchData(); startCountdown(); }}
            className="p-1.5 bg-slate-800/60 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-400 hover:text-white transition-all"
          >
            <RefreshCw size={11} />
          </button>

          {/* Countdown ring */}
          <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-800/60 rounded-lg border border-slate-700">
            <div className="relative w-4 h-4">
              <svg viewBox="0 0 24 24" className="w-4 h-4 -rotate-90">
                <circle cx="12" cy="12" r="10" fill="none" stroke="#1e293b" strokeWidth="3" />
                <circle
                  cx="12" cy="12" r="10"
                  fill="none" stroke="#2dd4bf" strokeWidth="3"
                  strokeDasharray={62.83}
                  strokeDashoffset={62.83 * (1 - countdown / POLL_INTERVAL)}
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <span className="text-[8px] font-black text-slate-400 tabular-nums w-4">{countdown}s</span>
          </div>

          {/* Live indicator */}
          <div className="flex items-center gap-1 px-2 py-1 bg-slate-800/60 rounded-lg border border-slate-700">
            <Wifi size={10} className="text-emerald-400" />
            <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Live</span>
          </div>

          {/* Time */}
          {mounted && (
            <div className="text-right hidden md:block pl-1">
              <div className="text-xs font-black tabular-nums text-white">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          )}
        </div>
      </div>



      {/* ── 5-COLUMN KANBAN ──────────────────────────────────────────────── */}
      <div className="flex-1 flex gap-3 p-4 overflow-hidden">
        {COLUMNS.map((col) => {
          const colOrders = getColOrders(col);
          const Icon = col.icon;

          return (
            <div
              key={col.id}
              className={`flex flex-col ${col.id === 'new_accepted' ? 'flex-[1.6]' : 'flex-1'} min-w-0 rounded-2xl border ${col.border} ${col.bg} overflow-hidden shadow-lg ${col.glow}`}
            >
              {/* Column Header */}
              <div className={`shrink-0 flex items-center justify-between px-4 py-3 border-b ${col.border} bg-black/20`}>
                <div className="flex items-center gap-2">
                  <Icon size={14} className={col.color} />
                  <h2 className={`text-[10px] font-black uppercase tracking-widest ${col.color}`}>
                    {col.label}
                  </h2>
                </div>
                <div className={`w-6 h-6 rounded-full ${col.badge} flex items-center justify-center`}>
                  <span className="text-[9px] font-black text-white">{colOrders.length}</span>
                </div>
              </div>

              {/* Cards */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3 no-scrollbar">
                {colOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    column={col}
                    onStatusUpdate={handleStatusUpdate}
                    updating={updatingIds.has(order.id)}
                  />
                ))}

                {colOrders.length === 0 && (
                  <div className="h-full min-h-[120px] flex flex-col items-center justify-center opacity-20 gap-2 py-8">
                    <Icon size={36} className={col.color} />
                    <p className={`text-[10px] font-black uppercase tracking-widest ${col.color}`}>
                      No Orders
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center justify-between px-5 py-2.5 bg-teal-600/90 backdrop-blur-md border-t border-teal-500/30">
        <div className="flex items-center gap-2">
          <Truck size={14} className="text-white/70" />
          <p className="text-white text-[10px] font-black uppercase tracking-[0.3em]">
            Home Delivery Operations — Live View
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-white/60 text-[9px] font-bold uppercase tracking-widest">
            {property?.brandName || property?.name}
          </span>
          {stats.codPending > 0 && (
            <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
              <Banknote size={9} />
              {stats.codPending} COD Pending
            </span>
          )}
        </div>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes pulse-subtle {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.85; }
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
