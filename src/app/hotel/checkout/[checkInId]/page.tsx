'use client';

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft, Loader2, User, Bed, CalendarDays, Receipt, CreditCard,
  CheckCircle2, AlertTriangle, TrendingDown, TrendingUp, Wallet,
  Printer, X, Banknote, Smartphone, Building2, Globe, DoorOpen,
  Clock, Phone, Hash, UtensilsCrossed, ShoppingBag, Sparkles,
} from 'lucide-react';
import { toast, Toaster } from 'sonner';

// ─── Modular Component Imports ──────────────────────────────────────────────
import ReceiptModal, { FolioDetail } from '@/components/hotel/checkout/ReceiptModal';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function nightsBetween(a: string, b: string) {
  return Math.max(1, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000));
}

const paymentModes = [
  { value: 'CASH', label: 'Cash', icon: <Banknote size={14} /> },
  { value: 'CARD', label: 'Card', icon: <CreditCard size={14} /> },
  { value: 'UPI', label: 'UPI', icon: <Smartphone size={14} /> },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer', icon: <Building2 size={14} /> },
  { value: 'ONLINE', label: 'Online', icon: <Globe size={14} /> },
];

// ─── Main Checkout Detail Page ────────────────────────────────────────────────

function CheckoutDetailContent() {
  const { checkInId } = useParams<{ checkInId: string }>();
  const searchParams = useSearchParams();
  const folioId = searchParams.get('folioId'); // passed from the list page
  const router = useRouter();

  const [folio, setFolio] = useState<FolioDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [checkedOut, setCheckedOut] = useState(false);

  // Payment form state
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('CASH');

  // Load folio directly by folioId (passed as query param from list page)
  const loadFolio = useCallback(async () => {
    if (!folioId) {
      toast.error('Folio ID missing — please go back and try again.');
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // Direct fetch by folioId — no unreliable matching needed
      const res = await fetch(`/api/hotel/folios?folioId=${folioId}`).then((r) => r.json());
      if (res.success && res.data) {
        setFolio(res.data);
        const due = Math.max(0, res.data.closingBalance);
        setPaymentAmount(due > 0 ? due.toString() : '');
      } else {
        toast.error(res.message || 'Folio not found');
      }
    } catch {
      toast.error('Error loading checkout details');
    } finally {
      setLoading(false);
    }
  }, [folioId]);

  useEffect(() => {
    loadFolio();
  }, [loadFolio]);

  // Handle final checkout
  const handleCheckout = async () => {
    if (!folio || !checkInId) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/hotel/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkInId, // use URL param directly — most reliable
          paymentAmount: Number(paymentAmount || 0),
          paymentMode,
        }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success('Guest checked out successfully! Room released.');
        setCheckedOut(true);
        // Don't re-fetch folio (it's now CLOSED and won't appear in open folios)
        // Just show receipt with current folio data
        setShowReceipt(true);
      } else {
        toast.error(data.message || 'Checkout failed');
      }
    } catch {
      toast.error('Connection error during checkout');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Derived values ──────────────────────────────────────────────────────────
  const room = folio?.reservation?.rooms?.[0]?.room;
  const nights =
    folio?.reservation
      ? nightsBetween(folio.reservation.arrivalDate, folio.reservation.departureDate)
      : 0;
  const dueBalance = folio ? Math.max(0, folio.closingBalance) : 0;
  const isSettled = dueBalance <= 0;
  const activeCheckIn = folio?.reservation?.checkIns?.[0];

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-4 border-orange-500/20 rounded-full" />
          <div className="absolute inset-0 border-4 border-t-orange-500 rounded-full animate-spin" />
        </div>
        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest animate-pulse">
          Loading folio…
        </p>
      </div>
    );
  }

  if (!folio) {
    return (
      <div className="text-center py-24">
        <AlertTriangle size={40} className="text-red-500 mx-auto mb-3" />
        <p className="text-red-400 font-bold">Folio not found for this check-in</p>
        <button
          onClick={() => router.push('/hotel/checkout')}
          className="mt-4 px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold"
        >
          ← Back to Checkouts
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <Toaster position="top-right" richColors />

      {/* Receipt Modal */}
      {showReceipt && (
        <ReceiptModal
          folio={folio}
          nights={nights}
          onClose={() => {
            setShowReceipt(false);
            router.push('/hotel/checkout');
          }}
        />
      )}

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/hotel/checkout')}
          className="w-9 h-9 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center text-slate-400 hover:text-white transition-all"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <DoorOpen className="text-orange-400" size={20} />
            <h1 className="text-xl font-black text-white tracking-tight">Guest Checkout</h1>
            {checkedOut && (
              <span className="flex items-center gap-1 text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                <CheckCircle2 size={10} /> CHECKED OUT
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 font-bold mt-0.5">
            Folio {folio.folioNo} · Booking #{folio.reservation.bookingNo}
          </p>
        </div>
      </div>

      {/* ── Main Grid ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* LEFT: Folio Ledger (2 cols) */}
        <div className="xl:col-span-2 space-y-5">
          {/* Guest + Stay Summary Card */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/60">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-orange-500/15 flex items-center justify-center font-black text-xl text-orange-400">
                  {(folio.guest.firstName || 'G')[0]}
                </div>
                <div>
                  <p className="font-black text-white text-base">
                    {folio.guest.firstName} {folio.guest.lastName}
                  </p>
                  {folio.guest.mobile && (
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Phone size={10} /> {folio.guest.mobile}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 font-bold">
                  <Hash size={8} className="inline" /> {folio.reservation.bookingNo}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/30 text-center">
                <Bed size={14} className="text-slate-500 mx-auto mb-1" />
                <p className="text-lg font-black text-white">{room?.roomNumber || '—'}</p>
                <p className="text-[9px] text-slate-600 font-bold">Room</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/30 text-center">
                <CalendarDays size={14} className="text-slate-500 mx-auto mb-1" />
                <p className="text-lg font-black text-white">{nights}</p>
                <p className="text-[9px] text-slate-600 font-bold">Night{nights !== 1 ? 's' : ''}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/30 text-center">
                <Clock size={14} className="text-slate-500 mx-auto mb-1" />
                <p className="text-xs font-black text-white">{fmtDate(folio.reservation.arrivalDate)}</p>
                <p className="text-[9px] text-slate-600 font-bold">Check-in</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/30 text-center">
                <DoorOpen size={14} className="text-slate-500 mx-auto mb-1" />
                <p className="text-xs font-black text-white">{fmtDate(folio.reservation.departureDate)}</p>
                <p className="text-[9px] text-slate-600 font-bold">Check-out</p>
              </div>
            </div>
          </div>

          {/* Folio Transactions Table */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/60">
            <div className="flex items-center gap-2 mb-4">
              <Receipt size={14} className="text-orange-400" />
              <h3 className="font-black text-white text-sm">Folio Ledger</h3>
              <span className="ml-auto text-[10px] text-slate-600 font-bold">
                {folio.transactions.length} entries
              </span>
            </div>

            {folio.transactions.length === 0 ? (
              <p className="text-slate-500 text-xs text-center py-6">No transactions recorded</p>
            ) : (
              <div className="space-y-1">
                {/* Header */}
                <div className="grid grid-cols-[1fr_2fr_auto_auto] gap-2 px-3 py-1.5 text-[10px] font-black text-slate-600 uppercase tracking-wider">
                  <span>Date</span>
                  <span>Description</span>
                  <span className="text-right">Charges</span>
                  <span className="text-right">Payments</span>
                </div>
                {/* Rows */}
                {folio.transactions.map((txn) => (
                  <div
                    key={txn.id}
                    className="grid grid-cols-[1fr_2fr_auto_auto] gap-2 px-3 py-2 rounded-xl hover:bg-slate-800/30 transition-colors"
                  >
                    <span className="text-[10px] text-slate-600 font-semibold">
                      {fmtDate(txn.txnDate)}
                    </span>
                    <div>
                      <p className="text-xs text-slate-300 font-semibold">{txn.description}</p>
                      <p className="text-[9px] text-slate-600">{txn.sourceModule}</p>
                    </div>
                    <span className="text-xs font-bold text-right text-red-400">
                      {txn.debitAmount > 0 ? fmt(txn.debitAmount) : '—'}
                    </span>
                    <span className="text-xs font-bold text-right text-emerald-400">
                      {txn.creditAmount > 0 ? fmt(txn.creditAmount) : '—'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* POS Orders if any */}
            {folio.posOrders && folio.posOrders.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-800/50">
                <div className="flex items-center gap-2 mb-3">
                  <UtensilsCrossed size={12} className="text-indigo-400" />
                  <p className="text-xs font-black text-slate-400">Linked POS Orders</p>
                </div>
                <div className="space-y-2">
                  {folio.posOrders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-800/30 border border-slate-700/20"
                    >
                      <div className="flex items-center gap-2">
                        <ShoppingBag size={12} className="text-slate-500" />
                        <div>
                          <p className="text-xs font-bold text-slate-300">
                            #{order.orderNo} — {order.outlet?.name || 'Outlet'}
                          </p>
                          <p className="text-[9px] text-slate-600">
                            {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-black text-red-400">{fmt(order.grandTotal)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Summary + Payment (1 col) */}
        <div className="space-y-5">
          {/* Balance Summary Card */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/60">
            <div className="flex items-center gap-2 mb-4">
              <Wallet size={14} className="text-orange-400" />
              <h3 className="font-black text-white text-sm">Bill Summary</h3>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between py-2 border-b border-slate-800/50">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <TrendingUp size={11} className="text-red-400" /> Total Charges
                </div>
                <span className="text-sm font-black text-red-400">{fmt(folio.totalCharges)}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-800/50">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <TrendingDown size={11} className="text-emerald-400" /> Total Paid
                </div>
                <span className="text-sm font-black text-emerald-400">{fmt(folio.totalPayments)}</span>
              </div>
              <div
                className={`flex items-center justify-between py-3 px-3 rounded-xl ${
                  isSettled
                    ? 'bg-emerald-950/30 border border-emerald-500/20'
                    : 'bg-red-950/30 border border-red-500/20'
                }`}
              >
                <span className="text-xs font-black text-slate-300">Balance Due</span>
                <span
                  className={`text-xl font-black ${isSettled ? 'text-emerald-400' : 'text-red-400'}`}
                >
                  {fmt(dueBalance)}
                </span>
              </div>
            </div>

            {isSettled && (
              <div className="flex items-center justify-center gap-2 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-black text-emerald-400">
                <CheckCircle2 size={12} /> Fully Paid
              </div>
            )}
          </div>

          {/* Payment Settlement Form */}
          {!checkedOut && (
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/60">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard size={14} className="text-orange-400" />
                <h3 className="font-black text-white text-sm">Settle & Checkout</h3>
              </div>

              {/* Payment Mode */}
              <div className="mb-4">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">
                  Payment Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {paymentModes.map((mode) => (
                    <button
                      key={mode.value}
                      type="button"
                      onClick={() => setPaymentMode(mode.value)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                        paymentMode === mode.value
                          ? 'bg-orange-500/20 border border-orange-500/40 text-orange-300'
                          : 'bg-slate-800/50 border border-slate-700/40 text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {mode.icon} {mode.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount */}
              {dueBalance > 0 && (
                <div className="mb-5">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">
                    Amount to Collect (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-400 font-black text-sm">₹</span>
                    <input
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      min={0}
                      className="w-full pl-7 pr-3 py-3 rounded-xl bg-slate-800/60 border border-slate-700/40 text-white font-black text-lg focus:outline-none focus:border-orange-500/50 transition-all"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setPaymentAmount(dueBalance.toString())}
                    className="mt-1.5 text-[10px] text-orange-400 font-bold hover:underline"
                  >
                    Set full balance: {fmt(dueBalance)}
                  </button>
                </div>
              )}

              {/* Checkout Button */}
              <button
                onClick={handleCheckout}
                disabled={submitting || !activeCheckIn}
                className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-black text-white transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                  dueBalance > 0
                    ? 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 shadow-red-900/30'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-900/30'
                }`}
              >
                {submitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : dueBalance > 0 ? (
                  <CreditCard size={16} />
                ) : (
                  <CheckCircle2 size={16} />
                )}
                {submitting
                  ? 'Processing…'
                  : dueBalance > 0
                  ? 'Collect & Checkout'
                  : 'Express Checkout'}
              </button>

              {!activeCheckIn && (
                <p className="text-center text-[10px] text-red-400 mt-2 font-bold">
                  ⚠ No active check-in record found
                </p>
              )}
            </div>
          )}

          {/* Already checked out */}
          {checkedOut && (
            <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/25 text-center space-y-3">
              <CheckCircle2 size={32} className="text-emerald-400 mx-auto" />
              <p className="text-emerald-400 font-black text-sm">Guest Checked Out</p>
              <p className="text-slate-500 text-xs">Room released · Folio closed</p>
              <button
                onClick={() => setShowReceipt(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all"
              >
                <Printer size={12} /> View / Print Receipt
              </button>
              <button
                onClick={() => router.push('/hotel/checkout')}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-900/60 text-slate-400 text-xs font-bold hover:text-white transition-all"
              >
                <ArrowLeft size={12} /> Back to Checkouts
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CheckoutDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-32">
          <Loader2 className="animate-spin text-orange-400" size={32} />
        </div>
      }
    >
      <CheckoutDetailContent />
    </Suspense>
  );
}
