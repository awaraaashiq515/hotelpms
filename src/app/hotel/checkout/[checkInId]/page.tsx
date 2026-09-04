'use client';

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft, Loader2, User, Bed, CalendarDays, Receipt, CreditCard,
  CheckCircle2, AlertTriangle, TrendingDown, TrendingUp, Wallet,
  Printer, X, Banknote, Smartphone, Building2, Globe, DoorOpen,
  Clock, Phone, Hash, UtensilsCrossed, ShoppingBag, Sparkles,
  Percent, BadgePercent, PlusCircle,
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
  { value: 'SPLIT', label: 'Split (Cash + Online)', icon: <Wallet size={14} /> },
];

const GST_RATES = [0, 5, 12, 18, 28];

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

  // Split payment breakdown state
  const [splitCash, setSplitCash] = useState('');
  const [splitOnline, setSplitOnline] = useState('');
  const [splitOnlineMethod, setSplitOnlineMethod] = useState<'UPI' | 'CARD' | 'BANK_TRANSFER' | 'ONLINE'>('UPI');

  // GST state
  const [gstRate, setGstRate] = useState(0);
  const [addingGst, setAddingGst] = useState(false);
  const [gstPosted, setGstPosted] = useState(false);

  // Corporate / Guest GSTIN details
  const [companyName, setCompanyName] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [savingGstInfo, setSavingGstInfo] = useState(false);
  const [gstInfoSaved, setGstInfoSaved] = useState(false);

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

        // Populate GST Details if present
        const currentGst = res.data.reservation?.gstNumber || res.data.guest?.gstNumber || '';
        const currentComp = res.data.reservation?.companyName || res.data.guest?.companyName || '';
        const currentAddr = res.data.reservation?.billingAddress || res.data.guest?.billingAddress || '';
        if (currentGst) setGstNumber(currentGst);
        if (currentComp) setCompanyName(currentComp);
        if (currentAddr) setBillingAddress(currentAddr);
        if (currentGst || currentComp) setGstInfoSaved(true);

        // Check if GST already posted in this folio
        const hasGst = res.data.transactions?.some(
          (t: { sourceModule: string }) => t.sourceModule === 'GST'
        );
        if (hasGst) setGstPosted(true);
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

  // Save / Update Guest GST Details
  const handleSaveGstInfo = async () => {
    if (!folio) return;
    setSavingGstInfo(true);
    try {
      const res = await fetch('/api/hotel/folios', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folioId: folio.id,
          gstNumber: gstNumber.trim().toUpperCase(),
          companyName: companyName.trim(),
          billingAddress: billingAddress.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Guest GST details updated for B2B Invoice');
        setGstInfoSaved(true);
        // update local folio object
        setFolio((prev: any) => {
          if (!prev) return prev;
          return {
            ...prev,
            reservation: {
              ...prev.reservation,
              gstNumber: gstNumber.trim().toUpperCase(),
              companyName: companyName.trim(),
              billingAddress: billingAddress.trim(),
            },
            guest: {
              ...prev.guest,
              gstNumber: gstNumber.trim().toUpperCase(),
              companyName: companyName.trim(),
              billingAddress: billingAddress.trim(),
            }
          };
        });
      } else {
        toast.error(data.message || 'Failed to update GST info');
      }
    } catch {
      toast.error('Connection error updating GST details');
    } finally {
      setSavingGstInfo(false);
    }
  };

  // ── GST Calculations ────────────────────────────────────────────────────────
  const baseCharges = folio?.totalCharges ?? 0;
  const gstAmount = gstRate > 0 ? Math.round(baseCharges * gstRate) / 100 : 0;
  const cgst = gstAmount / 2;
  const sgst = gstAmount / 2;

  // Handle: Post GST to folio
  const handleAddGst = async () => {
    if (!folio || gstRate === 0 || gstPosted) return;
    setAddingGst(true);
    try {
      const res = await fetch('/api/hotel/folios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folioId: folio.id,
          txnType: 'DEBIT',
          description: `GST @ ${gstRate}% on Room Charges (CGST ${gstRate / 2}% + SGST ${gstRate / 2}%)`,
          amount: gstAmount,
          taxAmount: gstAmount,
          sourceModule: 'GST',
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`GST @${gstRate}% (₹${gstAmount}) added to bill`);
        setGstPosted(true);
        await loadFolio(); // re-fetch to get updated totals
      } else {
        toast.error(data.message || 'Failed to add GST');
      }
    } catch {
      toast.error('Connection error adding GST');
    } finally {
      setAddingGst(false);
    }
  };

  // Handle final checkout
  const handleCheckout = async () => {
    if (!folio || !checkInId) return;

    const isSplit = paymentMode === 'SPLIT';
    const splitCashNum = Number(splitCash || 0);
    const splitOnlineNum = Number(splitOnline || 0);
    const finalAmount = isSplit ? splitCashNum + splitOnlineNum : Number(paymentAmount || 0);

    setSubmitting(true);
    try {
      const res = await fetch('/api/hotel/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkInId, // use URL param directly — most reliable
          paymentAmount: finalAmount,
          paymentMode,
          splitPayment: isSplit ? {
            cashAmount: splitCashNum,
            onlineAmount: splitOnlineNum,
            onlineMethod: splitOnlineMethod,
          } : undefined,
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

          {/* Corporate / Guest GST (B2B Invoice) Card */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/60">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Building2 size={16} className="text-amber-400" />
                <h3 className="font-black text-white text-sm">Guest / Corporate GST Billing (B2B Tax Invoice)</h3>
              </div>
              {(gstNumber || companyName) && (
                <span className="text-[10px] font-black text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                  B2B Tax Invoice
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Add the guest&apos;s Company Name and GST Number (GSTIN) here to issue a B2B Tax Invoice under their GSTIN.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                  Company / Business Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Acme Enterprises Pvt Ltd"
                  value={companyName}
                  onChange={(e) => {
                    setCompanyName(e.target.value);
                    setGstInfoSaved(false);
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700/40 text-white font-medium text-xs focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                  Guest GSTIN (GST Number)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 07AAAAA0000A1Z5"
                  maxLength={15}
                  value={gstNumber}
                  onChange={(e) => {
                    setGstNumber(e.target.value.toUpperCase());
                    setGstInfoSaved(false);
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700/40 text-amber-300 font-mono font-bold text-xs uppercase focus:outline-none focus:border-amber-500/50"
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                Billing Address (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. 123 Business Park, New Delhi - 110001"
                value={billingAddress}
                onChange={(e) => {
                  setBillingAddress(e.target.value);
                  setGstInfoSaved(false);
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700/40 text-white font-medium text-xs focus:outline-none focus:border-amber-500/50"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-slate-500 font-medium">
                {gstNumber ? `✓ Recipient GSTIN: ${gstNumber} will be printed on the invoice` : 'Adding a GST number will generate a B2B Tax Invoice'}
              </span>
              <button
                type="button"
                onClick={handleSaveGstInfo}
                disabled={savingGstInfo || (!gstNumber && !companyName)}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {savingGstInfo ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                {savingGstInfo ? 'Saving…' : gstInfoSaved ? 'GST Details Saved' : 'Save GST Details'}
              </button>
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
                    className={`grid grid-cols-[1fr_2fr_auto_auto] gap-2 px-3 py-2 rounded-xl transition-colors ${
                      txn.sourceModule === 'GST'
                        ? 'bg-amber-500/5 border border-amber-500/10'
                        : 'hover:bg-slate-800/30'
                    }`}
                  >
                    <span className="text-[10px] text-slate-600 font-semibold">
                      {fmtDate(txn.txnDate)}
                    </span>
                    <div>
                      <p className="text-xs text-slate-300 font-semibold">{txn.description}</p>
                      <p className={`text-[9px] font-bold ${txn.sourceModule === 'GST' ? 'text-amber-500' : 'text-slate-600'}`}>
                        {txn.sourceModule}
                      </p>
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

        {/* RIGHT: Summary + GST + Payment (1 col) */}
        <div className="space-y-5">

          {/* ── GST Card ─────────────────────────────────────────────────────── */}
          {!checkedOut && (
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/60">
              <div className="flex items-center gap-2 mb-4">
                <BadgePercent size={14} className="text-amber-400" />
                <h3 className="font-black text-white text-sm">GST / Tax</h3>
                {gstPosted && (
                  <span className="ml-auto flex items-center gap-1 text-[9px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <CheckCircle2 size={8} /> Added
                  </span>
                )}
              </div>

              {/* GST Rate Selector */}
              <div className="mb-4">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">
                  GST Rate
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {GST_RATES.map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      disabled={gstPosted}
                      onClick={() => setGstRate(rate)}
                      className={`py-2 rounded-xl text-xs font-black transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                        gstRate === rate
                          ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                          : 'bg-slate-800/50 border border-slate-700/40 text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {rate}%
                    </button>
                  ))}
                </div>
              </div>

              {/* GST Breakdown Preview */}
              {gstRate > 0 && (
                <div className="mb-4 p-3 rounded-xl bg-amber-500/5 border border-amber-500/15 space-y-2">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Taxable Amount</span>
                    <span className="font-bold text-slate-300">{fmt(baseCharges)}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">CGST @ {gstRate / 2}%</span>
                    <span className="font-bold text-amber-400">{fmt(cgst)}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">SGST @ {gstRate / 2}%</span>
                    <span className="font-bold text-amber-400">{fmt(sgst)}</span>
                  </div>
                  <div className="flex justify-between text-[12px] font-black border-t border-amber-500/15 pt-2">
                    <span className="text-amber-300">Total GST</span>
                    <span className="text-amber-300">{fmt(gstAmount)}</span>
                  </div>
                </div>
              )}

              {/* Add GST Button */}
              <button
                onClick={handleAddGst}
                disabled={gstRate === 0 || gstPosted || addingGst}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-lg shadow-amber-900/20"
              >
                {addingGst ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : gstPosted ? (
                  <CheckCircle2 size={13} />
                ) : (
                  <PlusCircle size={13} />
                )}
                {addingGst ? 'Adding GST…' : gstPosted ? 'GST Added to Bill' : `Add GST @${gstRate}% to Bill`}
              </button>

              {gstRate === 0 && !gstPosted && (
                <p className="text-center text-[10px] text-slate-600 mt-2 font-bold">
                  Select a GST rate above to add tax
                </p>
              )}
            </div>
          )}

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

              {/* GST breakdown in summary (if posted) */}
              {gstPosted && folio.transactions
                .filter((t) => t.sourceModule === 'GST')
                .map((t) => (
                  <div key={t.id} className="flex items-center justify-between py-1 px-2 rounded-lg bg-amber-500/5 border border-amber-500/10">
                    <div className="flex items-center gap-1.5 text-xs text-amber-400">
                      <Percent size={10} /> GST (incl.)
                    </div>
                    <span className="text-xs font-bold text-amber-400">{fmt(t.debitAmount)}</span>
                  </div>
                ))
              }

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
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {paymentModes.map((mode) => (
                    <button
                      key={mode.value}
                      type="button"
                      onClick={() => {
                        setPaymentMode(mode.value);
                        if (mode.value === 'SPLIT' && (!splitCash && !splitOnline)) {
                          const due = dueBalance;
                          const half = Math.floor(due / 2);
                          setSplitCash(half.toString());
                          setSplitOnline((due - half).toString());
                        }
                      }}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        paymentMode === mode.value
                          ? 'bg-orange-500/20 border border-orange-500/40 text-orange-300 shadow-md shadow-orange-950/40'
                          : 'bg-slate-800/50 border border-slate-700/40 text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {mode.icon} {mode.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Standard Single Mode Amount */}
              {paymentMode !== 'SPLIT' && dueBalance > 0 && (
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

              {/* Split (Cash + Online) Section */}
              {paymentMode === 'SPLIT' && (
                <div className="mb-5 p-4 rounded-2xl bg-gradient-to-b from-orange-950/20 via-slate-900/60 to-slate-900/90 border border-orange-500/30 space-y-4">
                  <div className="flex items-center justify-between border-b border-orange-500/20 pb-2.5">
                    <span className="text-[11px] font-black uppercase tracking-wider text-orange-300 flex items-center gap-1.5">
                      <Wallet size={14} /> Split Payment (Cash + Online)
                    </span>
                    <span className="text-[9px] font-bold text-slate-400">
                      Balance Due: <strong className="text-white">{fmt(dueBalance)}</strong>
                    </span>
                  </div>

                  {/* Cash input */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[10px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1">
                        <Banknote size={12} /> Cash Received (₹)
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const currentOnline = Number(splitOnline || 0);
                          setSplitCash(Math.max(0, dueBalance - currentOnline).toString());
                        }}
                        className="text-[9px] text-amber-400 hover:text-amber-300 font-bold underline"
                      >
                        Auto-fill remaining
                      </button>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400 font-black text-xs">₹</span>
                      <input
                        type="number"
                        value={splitCash}
                        onChange={(e) => setSplitCash(e.target.value)}
                        min={0}
                        placeholder="0"
                        className="w-full pl-7 pr-3 py-2.5 rounded-xl bg-slate-950 border border-amber-500/30 text-amber-200 font-mono font-black text-base focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  {/* Online / Digital input */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1">
                        <Smartphone size={12} /> Online / Digital Received (₹)
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const currentCash = Number(splitCash || 0);
                          setSplitOnline(Math.max(0, dueBalance - currentCash).toString());
                        }}
                        className="text-[9px] text-cyan-400 hover:text-cyan-300 font-bold underline"
                      >
                        Auto-fill remaining
                      </button>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400 font-black text-xs">₹</span>
                      <input
                        type="number"
                        value={splitOnline}
                        onChange={(e) => setSplitOnline(e.target.value)}
                        min={0}
                        placeholder="0"
                        className="w-full pl-7 pr-3 py-2.5 rounded-xl bg-slate-950 border border-cyan-500/30 text-cyan-200 font-mono font-black text-base focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>

                  {/* Online Method Sub-Type */}
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Online Payment Sub-Method
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { id: 'UPI', label: 'UPI' },
                        { id: 'CARD', label: 'Card' },
                        { id: 'BANK_TRANSFER', label: 'Bank' },
                        { id: 'ONLINE', label: 'Gateway' },
                      ].map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setSplitOnlineMethod(m.id as any)}
                          className={`py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${
                            splitOnlineMethod === m.id
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                              : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-slate-700/30'
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Calculation & Validation Live Summary */}
                  {(() => {
                    const cashN = Number(splitCash || 0);
                    const onlineN = Number(splitOnline || 0);
                    const totalSplit = cashN + onlineN;
                    const diff = dueBalance - totalSplit;

                    return (
                      <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5 text-xs">
                        <div className="flex justify-between text-slate-400 text-[11px]">
                          <span>💵 Cash Collected:</span>
                          <span className="font-bold text-amber-300">₹{cashN.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between text-slate-400 text-[11px]">
                          <span>📱 {splitOnlineMethod} Collected:</span>
                          <span className="font-bold text-cyan-300">₹{onlineN.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="h-px bg-slate-800 my-1" />
                        <div className="flex justify-between text-xs font-black">
                          <span className="text-white">Total Split Collected:</span>
                          <span className="text-orange-400 font-mono">₹{totalSplit.toLocaleString('en-IN')}</span>
                        </div>

                        {/* Match Status Badge */}
                        <div className="pt-1 text-[10px]">
                          {diff === 0 && dueBalance > 0 ? (
                            <span className="inline-flex items-center gap-1 text-emerald-400 font-black">
                              <CheckCircle2 size={11} /> Exact Match with Due Balance ({fmt(dueBalance)})
                            </span>
                          ) : diff > 0 ? (
                            <span className="inline-flex items-center gap-1 text-amber-400 font-bold">
                              <AlertTriangle size={11} /> ₹{diff.toLocaleString('en-IN')} remaining balance
                            </span>
                          ) : diff < 0 ? (
                            <span className="inline-flex items-center gap-1 text-sky-400 font-bold">
                              ₹{(-diff).toLocaleString('en-IN')} excess / change to return
                            </span>
                          ) : null}
                        </div>

                        {/* Quick Presets */}
                        <div className="flex gap-1.5 pt-1.5 border-t border-slate-800/80">
                          <button
                            type="button"
                            onClick={() => {
                              const half = Math.floor(dueBalance / 2);
                              setSplitCash(half.toString());
                              setSplitOnline((dueBalance - half).toString());
                            }}
                            className="flex-1 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[9px] font-bold text-slate-300 transition-colors"
                          >
                            50% Cash / 50% Online
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSplitCash('0');
                              setSplitOnline(dueBalance.toString());
                            }}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[9px] font-bold text-cyan-300 transition-colors"
                          >
                            100% Online
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSplitCash(dueBalance.toString());
                              setSplitOnline('0');
                            }}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[9px] font-bold text-amber-300 transition-colors"
                          >
                            100% Cash
                          </button>
                        </div>
                      </div>
                    );
                  })()}
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
