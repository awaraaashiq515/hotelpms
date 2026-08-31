'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Receipt, Search, Download, Printer, CheckCircle2,
  Clock, AlertCircle, RefreshCw, IndianRupee,
  User, Building2, Smartphone, Banknote,
  Globe, Tag, ArrowUpRight, Bed, Percent,
  Layers, Check, Sparkles, HelpCircle,
} from 'lucide-react';
import { toast, Toaster } from 'sonner';
import ReceiptModal, { FolioDetail } from '@/components/hotel/checkout/ReceiptModal';
import { exportHotelPDF } from '@/lib/export-utils';

// ─── Types ──────────────────────────────────────────────────────────────────

interface HotelInvoiceRecord {
  id: string;
  folioId: string;
  invoiceNo: string;
  folioNo: string;
  bookingNo: string;
  invoiceDate: string;
  guestId?: string;
  guestName: string;
  guestMobile: string;
  guestEmail: string;
  roomNumber: string;
  roomTypeName: string;
  arrivalDate: string;
  departureDate: string;
  isB2B: boolean;
  companyName: string | null;
  gstNumber: string | null;
  billingAddress: string | null;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  totalTax: number;
  subtotal: number;
  totalAmount: number;
  totalPaid: number;
  dueBalance: number;
  paymentStatus: 'PAID' | 'PARTIAL' | 'DUE';
  paymentMode: 'CASH' | 'ONLINE' | 'UPI' | 'CARD' | 'BANK_TRANSFER' | 'SPLIT' | 'UNPAID';
  paymentModesList: string[];
  cashPaid: number;
  onlinePaid: number;
  folioStatus: 'OPEN' | 'CLOSED';
  rawFolio: FolioDetail;
}

interface SummaryData {
  totalInvoiced: number;
  totalInvoicesCount: number;
  totalTaxCollected: number;
  totalCgstCollected: number;
  totalSgstCollected: number;
  b2b: {
    count: number;
    totalAmount: number;
    cashPaid: number;
    onlinePaid: number;
  };
  b2c: {
    count: number;
    totalAmount: number;
    cashPaid: number;
    onlinePaid: number;
  };
  cash: {
    total: number;
    onGstInvoices: number;
    onSimpleInvoices: number;
  };
  online: {
    total: number;
    onGstInvoices: number;
    onSimpleInvoices: number;
  };
  dueBalance: number;
}

export type SimpleFilterType =
  | 'ALL'
  | 'CASH_NORMAL'
  | 'CASH_GST'
  | 'ONLINE_NORMAL'
  | 'ONLINE_GST'
  | 'ALL_GST'
  | 'ALL_NORMAL'
  | 'DUE';

function fmt(n: number) {
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function fmtDate(d: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function nightsBetween(a: string, b: string) {
  if (!a || !b) return 1;
  return Math.max(1, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000));
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function HotelInvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<HotelInvoiceRecord[]>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  // Modular Independent Filters
  const [gstFilter, setGstFilter] = useState<'ALL' | 'WITH_GST' | 'WITHOUT_GST'>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<'ALL' | 'CASH' | 'ONLINE' | 'SPLIT' | 'UNPAID'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'PARTIAL' | 'DUE'>('ALL');
  const [datePreset, setDatePreset] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH'>('ALL');
  const [search, setSearch] = useState('');

  // Selected Invoice for Full Receipt Modal View
  const [selectedInvoice, setSelectedInvoice] = useState<HotelInvoiceRecord | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Load Invoices
  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      if (datePreset === 'TODAY') {
        const today = new Date().toISOString().split('T')[0];
        params.set('startDate', today);
        params.set('endDate', today);
      } else if (datePreset === 'WEEK') {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        params.set('startDate', d.toISOString().split('T')[0]);
      } else if (datePreset === 'MONTH') {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        params.set('startDate', d.toISOString().split('T')[0]);
      }

      const res = await fetch(`/api/hotel/invoices?${params.toString()}`);
      const data = await res.json();
      if (data.success && data.data) {
        setInvoices(data.data.invoices || []);
        setSummary(data.data.summary || null);
      } else {
        toast.error(data.message || 'Failed to fetch invoices');
      }
    } catch {
      toast.error('Network error loading invoices');
    } finally {
      setLoading(false);
    }
  }, [datePreset]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Quick Preset Helper
  const applyQuickPreset = (preset: 'ALL' | 'CASH_NORMAL' | 'CASH_GST' | 'ONLINE_NORMAL' | 'ONLINE_GST' | 'DUE') => {
    if (preset === 'ALL') {
      setGstFilter('ALL');
      setPaymentFilter('ALL');
      setStatusFilter('ALL');
    } else if (preset === 'CASH_NORMAL') {
      setGstFilter('WITHOUT_GST');
      setPaymentFilter('CASH');
    } else if (preset === 'CASH_GST') {
      setGstFilter('WITH_GST');
      setPaymentFilter('CASH');
    } else if (preset === 'ONLINE_NORMAL') {
      setGstFilter('WITHOUT_GST');
      setPaymentFilter('ONLINE');
    } else if (preset === 'ONLINE_GST') {
      setGstFilter('WITH_GST');
      setPaymentFilter('ONLINE');
    } else if (preset === 'DUE') {
      setPaymentFilter('UNPAID');
    }
  };

  const isQuickActive = (preset: 'ALL' | 'CASH_NORMAL' | 'CASH_GST' | 'ONLINE_NORMAL' | 'ONLINE_GST' | 'DUE') => {
    if (preset === 'ALL') return gstFilter === 'ALL' && paymentFilter === 'ALL' && statusFilter === 'ALL';
    if (preset === 'CASH_NORMAL') return gstFilter === 'WITHOUT_GST' && paymentFilter === 'CASH';
    if (preset === 'CASH_GST') return gstFilter === 'WITH_GST' && paymentFilter === 'CASH';
    if (preset === 'ONLINE_NORMAL') return gstFilter === 'WITHOUT_GST' && paymentFilter === 'ONLINE';
    if (preset === 'ONLINE_GST') return gstFilter === 'WITH_GST' && paymentFilter === 'ONLINE';
    if (preset === 'DUE') return paymentFilter === 'UNPAID';
    return false;
  };

  const resetAllFilters = () => {
    setGstFilter('ALL');
    setPaymentFilter('ALL');
    setStatusFilter('ALL');
    setDatePreset('ALL');
    setSearch('');
  };

  const isAnyFilterActive =
    gstFilter !== 'ALL' ||
    paymentFilter !== 'ALL' ||
    statusFilter !== 'ALL' ||
    datePreset !== 'ALL' ||
    search.trim() !== '';

  // Client-side filtering in clear terms
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      // 1. GST Filter (Separate & Independent)
      if (gstFilter === 'WITH_GST' && !inv.isB2B) return false;
      if (gstFilter === 'WITHOUT_GST' && inv.isB2B) return false;

      // 2. Payment Mode Filter (Separate & Independent)
      if (paymentFilter === 'CASH' && inv.cashPaid <= 0) return false;
      if (paymentFilter === 'ONLINE' && inv.onlinePaid <= 0) return false;
      if (paymentFilter === 'SPLIT' && (inv.cashPaid <= 0 || inv.onlinePaid <= 0)) return false;
      if (paymentFilter === 'UNPAID' && (inv.paymentStatus !== 'DUE' && inv.dueBalance <= 0)) return false;

      // 3. Status Filter
      if (statusFilter !== 'ALL' && inv.paymentStatus !== statusFilter) return false;

      // 4. Search Filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const match =
          inv.invoiceNo.toLowerCase().includes(q) ||
          inv.folioNo.toLowerCase().includes(q) ||
          inv.bookingNo.toLowerCase().includes(q) ||
          inv.guestName.toLowerCase().includes(q) ||
          inv.guestMobile.toLowerCase().includes(q) ||
          (inv.companyName && inv.companyName.toLowerCase().includes(q)) ||
          (inv.gstNumber && inv.gstNumber.toLowerCase().includes(q)) ||
          inv.roomNumber.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [invoices, gstFilter, paymentFilter, statusFilter, search]);

  // Counts for simple badges
  const counts = useMemo(() => {
    return {
      all: invoices.length,
      cashNormal: invoices.filter((i) => !i.isB2B && i.cashPaid > 0).length,
      cashGst: invoices.filter((i) => i.isB2B && i.cashPaid > 0).length,
      onlineNormal: invoices.filter((i) => !i.isB2B && i.onlinePaid > 0).length,
      onlineGst: invoices.filter((i) => i.isB2B && i.onlinePaid > 0).length,
      allGst: invoices.filter((i) => i.isB2B).length,
      allNormal: invoices.filter((i) => !i.isB2B).length,
      due: invoices.filter((i) => i.dueBalance > 0).length,
    };
  }, [invoices]);

  // Export to CSV
  const exportToCSV = () => {
    if (filteredInvoices.length === 0) {
      toast.error('No bills to export');
      return;
    }

    const headers = [
      'Bill No',
      'Folio No',
      'Booking No',
      'Date',
      'Guest Name',
      'Mobile',
      'Room Number',
      'Bill Type',
      'GST Number (GSTIN)',
      'Company Name',
      'Payment Mode',
      'Room Stay Charges (₹)',
      'Total GST Tax (₹)',
      'Total Amount (₹)',
      'Cash Paid (₹)',
      'Online Paid (₹)',
      'Balance Due (₹)',
      'Payment Status',
    ];

    const rows = filteredInvoices.map((inv) => {
      let modeText = 'Cash';
      if (inv.isB2B && inv.cashPaid > 0) modeText = 'Cash (GST Bill)';
      else if (!inv.isB2B && inv.cashPaid > 0) modeText = 'Cash (Normal Bill)';
      else if (inv.isB2B && inv.onlinePaid > 0) modeText = 'Online (GST Bill)';
      else if (!inv.isB2B && inv.onlinePaid > 0) modeText = 'Online (Normal Bill)';
      else if (inv.dueBalance > 0) modeText = 'Unpaid / Due';

      return [
        inv.invoiceNo,
        inv.folioNo,
        inv.bookingNo,
        fmtDate(inv.invoiceDate),
        `"${inv.guestName.replace(/"/g, '""')}"`,
        inv.guestMobile,
        inv.roomNumber,
        inv.isB2B ? 'GST Bill (Tax Invoice)' : 'Normal Bill',
        inv.gstNumber || '—',
        `"${(inv.companyName || '').replace(/"/g, '""')}"`,
        modeText,
        inv.taxableAmount,
        inv.totalTax,
        inv.totalAmount,
        inv.cashPaid,
        inv.onlinePaid,
        inv.dueBalance,
        inv.paymentStatus,
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Hotel_Bills_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Bills report exported successfully (CSV)');
  };

  // Export to PDF Report
  const exportToPDF = () => {
    if (filteredInvoices.length === 0) {
      toast.error('No bills to export');
      return;
    }

    // Columns: Removed 'Bill Type' as requested
    const columns = [
      '#',
      'Invoice No',
      'Date',
      'Guest Name',
      'Room',
      'GSTIN',
      'Payment Mode',
      'Total (Rs)',
      'Status',
    ];

    const rows = filteredInvoices.map((inv, idx) => {
      let modeText = 'Cash';
      if (inv.isB2B && inv.cashPaid > 0) modeText = 'Cash (GST)';
      else if (!inv.isB2B && inv.cashPaid > 0) modeText = 'Cash';
      else if (inv.isB2B && inv.onlinePaid > 0) modeText = 'Online (GST)';
      else if (!inv.isB2B && inv.onlinePaid > 0) modeText = 'Online';
      else if (inv.dueBalance > 0) modeText = 'Due';

      return [
        idx + 1,
        inv.invoiceNo, // e.g. INV-431298-1, INV-431298-2
        fmtDate(inv.invoiceDate),
        inv.guestName,
        `Room ${inv.roomNumber}`,
        inv.gstNumber || '-',
        modeText,
        inv.totalAmount,
        inv.paymentStatus,
      ];
    });

    const summaryCards = summary
      ? [
          { label: 'Total Billed', value: `Rs. ${summary.totalInvoiced.toLocaleString()}` },
          { label: 'GST Bills Total', value: `Rs. ${summary.b2b.totalAmount.toLocaleString()}` },
          { label: 'Cash Collected', value: `Rs. ${summary.cash.total.toLocaleString()}` },
          { label: 'Online Collected', value: `Rs. ${summary.online.total.toLocaleString()}` },
          { label: 'Total GST Tax', value: `Rs. ${summary.totalTaxCollected.toLocaleString()}` },
          { label: 'Balance Due', value: `Rs. ${summary.dueBalance.toLocaleString()}` },
        ]
      : [];

    exportHotelPDF(
      columns,
      rows,
      `Hotel_Bills_Report_${new Date().toISOString().split('T')[0]}`,
      'Hotel Invoices & Billing Report',
      {
        hotelName: 'Hotel Billing & Guest Invoices',
        hotelAddress: 'Room Stay & GST Tax Billing Statement',
        subtitle: `Filter: GST (${gstFilter}) · Payment (${paymentFilter}) | Period: ${datePreset} (${filteredInvoices.length} Bills)`,
        summaryCards,
      }
    );

    toast.success('PDF report downloaded successfully');
  };

  return (
    <div className="space-y-6 pb-16">
      <Toaster position="top-right" richColors />

      {/* ── Receipt / Tax Invoice Modal ────────────────────────────────────── */}
      {showReceiptModal && selectedInvoice && (
        <ReceiptModal
          folio={selectedInvoice.rawFolio}
          nights={nightsBetween(selectedInvoice.arrivalDate, selectedInvoice.departureDate)}
          invoiceNo={selectedInvoice.invoiceNo}
          onClose={() => {
            setShowReceiptModal(false);
            setSelectedInvoice(null);
          }}
        />
      )}

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400 shadow-lg shadow-orange-950/20">
            <Receipt size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white tracking-tight">Hotel Invoices & Bills</h1>
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
                Room & Guest Billing
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Easily check who paid in Cash vs Online, and who took a GST bill vs Normal bill
            </p>
          </div>
        </div>

        {/* Action Buttons: Refresh, Export PDF, Export CSV */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            onClick={fetchInvoices}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-300 text-xs font-bold transition-all disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={exportToPDF}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 text-xs font-bold transition-all active:scale-[0.98] shadow-sm"
            title="Download report as PDF file"
          >
            <Download size={13} className="text-rose-400" /> Export PDF
          </button>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/30 transition-all active:scale-[0.98]"
            title="Export report to CSV/Excel"
          >
            <Download size={13} /> Export CSV
          </button>
        </div>
      </div>

      {/* ── Top Summary Cards (Compact & Sleek) ────────────────────────────── */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2.5">
          {/* 1. Total Bills */}
          <div
            onClick={() => resetAllFilters()}
            className={`p-2.5 px-3 rounded-xl border backdrop-blur-sm cursor-pointer transition-all ${
              !isAnyFilterActive
                ? 'bg-orange-500/15 border-orange-500/50 shadow-md ring-1 ring-orange-500/30'
                : 'bg-slate-900/70 border-slate-800/80 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between text-slate-500 mb-0.5">
              <span className="text-[9px] font-black uppercase tracking-wider">Total Billed</span>
              <Receipt size={12} className="text-orange-400" />
            </div>
            <p className="text-base font-black text-white">{fmt(summary.totalInvoiced)}</p>
            <p className="text-[9px] text-slate-500 font-medium">
              {summary.totalInvoicesCount} bookings / bills
            </p>
          </div>

          {/* 2. All GST Bills */}
          <div
            onClick={() => {
              setGstFilter('WITH_GST');
              setPaymentFilter('ALL');
            }}
            className={`p-2.5 px-3 rounded-xl border backdrop-blur-sm cursor-pointer transition-all ${
              gstFilter === 'WITH_GST' && paymentFilter === 'ALL'
                ? 'bg-amber-500/15 border-amber-500/60 shadow-md ring-1 ring-amber-500/40'
                : 'bg-slate-900/70 border-amber-500/20 hover:border-amber-500/40'
            }`}
          >
            <div className="flex items-center justify-between text-amber-400 mb-0.5">
              <span className="text-[9px] font-black uppercase tracking-wider">GST Bills</span>
              <Building2 size={12} />
            </div>
            <p className="text-base font-black text-amber-300">{fmt(summary.b2b.totalAmount)}</p>
            <p className="text-[9px] text-amber-500/80 font-medium">
              {summary.b2b.count} with GSTIN
            </p>
          </div>

          {/* 3. Cash Payments */}
          <div className="p-2.5 px-3 rounded-xl bg-slate-900/70 border border-emerald-500/20 backdrop-blur-sm">
            <div className="flex items-center justify-between text-emerald-400 mb-0.5">
              <span className="text-[9px] font-black uppercase tracking-wider">Cash Collected</span>
              <Banknote size={12} />
            </div>
            <p className="text-base font-black text-emerald-300">{fmt(summary.cash.total)}</p>
            <div className="flex items-center gap-1 mt-1">
              <button
                type="button"
                onClick={() => applyQuickPreset('CASH_GST')}
                className={`text-[8px] font-bold px-1 py-0.2 rounded transition-all ${
                  isQuickActive('CASH_GST')
                    ? 'bg-amber-500/30 text-amber-200 border border-amber-500/50'
                    : 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
                }`}
                title="Cash on GST Bill"
              >
                +GST: {fmt(summary.cash.onGstInvoices)}
              </button>
              <button
                type="button"
                onClick={() => applyQuickPreset('CASH_NORMAL')}
                className={`text-[8px] font-bold px-1 py-0.2 rounded transition-all ${
                  isQuickActive('CASH_NORMAL')
                    ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-500/50'
                    : 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20'
                }`}
                title="Cash on Normal Bill"
              >
                Norm: {fmt(summary.cash.onSimpleInvoices)}
              </button>
            </div>
          </div>

          {/* 4. Online Payments */}
          <div className="p-2.5 px-3 rounded-xl bg-slate-900/70 border border-sky-500/20 backdrop-blur-sm">
            <div className="flex items-center justify-between text-sky-400 mb-0.5">
              <span className="text-[9px] font-black uppercase tracking-wider">Online / UPI</span>
              <Smartphone size={12} />
            </div>
            <p className="text-base font-black text-sky-300">{fmt(summary.online.total)}</p>
            <div className="flex items-center gap-1 mt-1">
              <button
                type="button"
                onClick={() => applyQuickPreset('ONLINE_GST')}
                className={`text-[8px] font-bold px-1 py-0.2 rounded transition-all ${
                  isQuickActive('ONLINE_GST')
                    ? 'bg-indigo-500/30 text-indigo-200 border border-indigo-500/50'
                    : 'text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20'
                }`}
                title="Online on GST Bill"
              >
                +GST: {fmt(summary.online.onGstInvoices)}
              </button>
              <button
                type="button"
                onClick={() => applyQuickPreset('ONLINE_NORMAL')}
                className={`text-[8px] font-bold px-1 py-0.2 rounded transition-all ${
                  isQuickActive('ONLINE_NORMAL')
                    ? 'bg-sky-500/30 text-sky-200 border border-sky-500/50'
                    : 'text-sky-300 bg-sky-500/10 hover:bg-sky-500/20'
                }`}
                title="Online on Normal Bill"
              >
                Norm: {fmt(summary.online.onSimpleInvoices)}
              </button>
            </div>
          </div>

          {/* 5. Total Tax */}
          <div className="p-2.5 px-3 rounded-xl bg-slate-900/70 border border-indigo-500/20 backdrop-blur-sm">
            <div className="flex items-center justify-between text-indigo-400 mb-0.5">
              <span className="text-[9px] font-black uppercase tracking-wider">GST Tax</span>
              <Percent size={12} />
            </div>
            <p className="text-base font-black text-indigo-300">{fmt(summary.totalTaxCollected)}</p>
            <p className="text-[8px] text-slate-400 font-medium mt-1">
              C: {fmt(summary.totalCgstCollected)} · S: {fmt(summary.totalSgstCollected)}
            </p>
          </div>

          {/* 6. Pending Due */}
          <div
            onClick={() => {
              setPaymentFilter('UNPAID');
              setGstFilter('ALL');
            }}
            className={`p-2.5 px-3 rounded-xl border backdrop-blur-sm cursor-pointer transition-all ${
              paymentFilter === 'UNPAID'
                ? 'bg-rose-500/15 border-rose-500/60 shadow-md ring-1 ring-rose-500/40'
                : 'bg-slate-900/70 border-rose-500/20 hover:border-rose-500/40'
            }`}
          >
            <div className="flex items-center justify-between text-rose-400 mb-0.5">
              <span className="text-[9px] font-black uppercase tracking-wider">Pending Due</span>
              <Clock size={12} />
            </div>
            <p className="text-base font-black text-rose-400">{fmt(summary.dueBalance)}</p>
            <p className="text-[9px] text-rose-500/80 font-medium">
              {summary.dueBalance <= 0 ? 'All settled' : 'Unpaid balance'}
            </p>
          </div>
        </div>
      )}

      {/* ── Filter Bills Bar (Simple, Direct & Clean) ───────────────────────── */}
      <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800/80 space-y-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers size={13} className="text-orange-400" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-300">Filter Bills:</span>
          </div>

          {isAnyFilterActive && (
            <button
              onClick={resetAllFilters}
              className="text-[11px] font-bold text-orange-400 hover:text-orange-300 hover:underline flex items-center gap-1"
            >
              <RefreshCw size={11} /> Reset / Clear All ({invoices.length} Bills)
            </button>
          )}
        </div>

        {/* ── Separate Dedicated Filter Selectors ───────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {/* 1. Dedicated GST Filter */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
              <Building2 size={11} className="text-amber-400" /> GST Bill Filter
            </label>
            <select
              value={gstFilter}
              onChange={(e) => setGstFilter(e.target.value as any)}
              className={`w-full px-3 py-2 rounded-xl border text-xs font-bold focus:outline-none transition-all ${
                gstFilter !== 'ALL'
                  ? 'bg-amber-500/15 border-amber-500/50 text-amber-200'
                  : 'bg-slate-800/60 border-slate-700/40 text-slate-300'
              }`}
            >
              <option value="ALL">All Bills (GST + Normal)</option>
              <option value="WITH_GST">🏢 GST Bills (With GSTIN)</option>
              <option value="WITHOUT_GST">👤 Normal Bills (Without GST)</option>
            </select>
          </div>

          {/* 2. Dedicated Payment Mode Filter */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
              <Banknote size={11} className="text-emerald-400" /> Payment Mode Filter
            </label>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value as any)}
              className={`w-full px-3 py-2 rounded-xl border text-xs font-bold focus:outline-none transition-all ${
                paymentFilter !== 'ALL'
                  ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-200'
                  : 'bg-slate-800/60 border-slate-700/40 text-slate-300'
              }`}
            >
              <option value="ALL">All Payment Modes</option>
              <option value="CASH">💵 Cash Payments Only</option>
              <option value="ONLINE">📱 Online / UPI / Card Only</option>
              <option value="SPLIT">🔀 Split (Cash + Online)</option>
              <option value="UNPAID">⏳ Unpaid / Pending Due</option>
            </select>
          </div>

          {/* 3. Dedicated Payment Status Filter */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
              <CheckCircle2 size={11} className="text-sky-400" /> Payment Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className={`w-full px-3 py-2 rounded-xl border text-xs font-bold focus:outline-none transition-all ${
                statusFilter !== 'ALL'
                  ? 'bg-sky-500/15 border-sky-500/50 text-sky-200'
                  : 'bg-slate-800/60 border-slate-700/40 text-slate-300'
              }`}
            >
              <option value="ALL">All Statuses</option>
              <option value="PAID">✅ Fully Paid</option>
              <option value="PARTIAL">⚠️ Partially Paid</option>
              <option value="DUE">❌ Balance Due</option>
            </select>
          </div>

          {/* 4. Date Presets */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
              <Clock size={11} className="text-orange-400" /> Date Period
            </label>
            <div className="flex items-center bg-slate-800/60 border border-slate-700/40 rounded-xl p-0.5">
              {[
                { id: 'ALL', label: 'All' },
                { id: 'TODAY', label: 'Today' },
                { id: 'WEEK', label: '7D' },
                { id: 'MONTH', label: '30D' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setDatePreset(p.id as any)}
                  className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all ${
                    datePreset === p.id
                      ? 'bg-orange-500/25 text-orange-300 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* 5. Live Search */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
              <Search size={11} className="text-slate-400" /> Search Bills
            </label>
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Guest, Room, GSTIN, Bill #..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-7 py-2 rounded-xl bg-slate-800/60 border border-slate-700/40 text-white placeholder-slate-500 text-xs font-medium focus:outline-none focus:border-orange-500/50 transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Active Filters Bar */}
        {isAnyFilterActive && (
          <div className="pt-2 border-t border-slate-800/40 flex items-center gap-2 flex-wrap text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Active Filters:</span>
            {gstFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
                GST: {gstFilter === 'WITH_GST' ? 'GST Bills (With GSTIN)' : 'Normal Bills (No GST)'}
                <button onClick={() => setGstFilter('ALL')} className="hover:text-white">✕</button>
              </span>
            )}
            {paymentFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                Payment: {paymentFilter}
                <button onClick={() => setPaymentFilter('ALL')} className="hover:text-white">✕</button>
              </span>
            )}
            {statusFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/40 text-[10px] font-bold">
                Status: {statusFilter}
                <button onClick={() => setStatusFilter('ALL')} className="hover:text-white">✕</button>
              </span>
            )}
            {search && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-bold">
                Search: &quot;{search}&quot;
                <button onClick={() => setSearch('')} className="hover:text-white">✕</button>
              </span>
            )}
            <span className="text-[10px] font-bold text-orange-400 ml-auto">
              Showing {filteredInvoices.length} of {invoices.length} Bills
            </span>
          </div>
        )}
      </div>

      {/* ── Invoices List Table ──────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800/70 overflow-hidden shadow-xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-28 gap-3">
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 border-4 border-orange-500/20 rounded-full" />
              <div className="absolute inset-0 border-4 border-t-orange-500 rounded-full animate-spin" />
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest animate-pulse">
              Loading hotel bills…
            </p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="text-center py-24 space-y-3">
            <Receipt size={40} className="text-slate-600 mx-auto" />
            <p className="text-slate-300 font-bold text-sm">No bills found in this category</p>
            <p className="text-slate-500 text-xs max-w-sm mx-auto">
              Try switching your filter or resetting your search query.
            </p>
            <button
              onClick={resetAllFilters}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300"
            >
              Show All Bills
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[950px]">
              <thead>
                <tr className="border-b border-slate-800/80 bg-slate-950/40 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4 whitespace-nowrap min-w-[200px]"># / Bill No.</th>
                  <th className="py-3 px-4 whitespace-nowrap min-w-[180px]">Guest Details</th>
                  <th className="py-3 px-4 whitespace-nowrap min-w-[160px]">Room & Stay</th>
                  <th className="py-3 px-4 whitespace-nowrap min-w-[130px]">Bill Type</th>
                  <th className="py-3 px-4 whitespace-nowrap min-w-[160px]">Payment Method</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap min-w-[120px]">Total Amount</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap min-w-[100px]">Status</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap min-w-[120px]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-xs">
                {filteredInvoices.map((inv, index) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-slate-800/30 transition-colors group"
                  >
                    {/* Clean Sequential Bill # (1, 2, 3...) & Date */}
                    <td className="py-3.5 px-4 align-top whitespace-nowrap min-w-[200px]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center font-black text-xs text-orange-400 shrink-0 shadow-sm font-mono">
                          #{index + 1}
                        </div>
                        <div className="whitespace-nowrap">
                          <p className="font-black text-white text-xs leading-tight font-mono whitespace-nowrap">
                            {inv.invoiceNo || `INV-431298-${index + 1}`}
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium mt-0.5 whitespace-nowrap">
                            {fmtDate(inv.invoiceDate)}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Guest Name & GST Number */}
                    <td className="py-3.5 px-4 align-top">
                      <p className="font-black text-white text-sm leading-tight">
                        {inv.guestName}
                      </p>
                      {inv.guestMobile && inv.guestMobile !== '—' && (
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          📞 {inv.guestMobile}
                        </p>
                      )}

                      {/* If GST bill, show Company & GSTIN */}
                      {inv.gstNumber ? (
                        <div className="mt-1.5 space-y-0.5">
                          {inv.companyName && (
                            <p className="text-[11px] font-bold text-amber-300">
                              🏢 {inv.companyName}
                            </p>
                          )}
                          <div className="inline-flex items-center gap-1 text-[9px] font-mono font-black text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                            GSTIN: {inv.gstNumber}
                          </div>
                        </div>
                      ) : null}
                    </td>

                    {/* Room & Stay Details */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="flex items-center gap-1.5 font-bold text-white">
                        <Bed size={13} className="text-orange-400" />
                        <span>Room {inv.roomNumber}</span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          ({inv.roomTypeName})
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium mt-1">
                        {nightsBetween(inv.arrivalDate, inv.departureDate)} Night(s) Stay
                      </div>
                      <div className="text-[9px] text-slate-500 font-semibold mt-0.5">
                        {fmtDate(inv.arrivalDate)} to {fmtDate(inv.departureDate)}
                      </div>
                    </td>

                    {/* Bill Type (GST Bill vs Normal Bill) */}
                    <td className="py-3.5 px-4 align-top">
                      {inv.isB2B ? (
                        <div>
                          <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-300 bg-amber-500/15 border border-amber-500/40 px-2.5 py-1 rounded-lg">
                            <Building2 size={11} /> GST Bill
                          </span>
                          <p className="text-[9px] text-amber-400 font-bold mt-1">
                            Tax: {fmt(inv.totalTax)}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <span className="inline-flex items-center gap-1 text-[10px] font-black text-slate-300 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-lg">
                            <User size={11} className="text-slate-400" /> Normal Bill
                          </span>
                          <p className="text-[9px] text-slate-500 font-medium mt-1">
                            No GST number
                          </p>
                        </div>
                      )}
                    </td>

                    {/* Payment Method (Clear & Simple) */}
                    <td className="py-3.5 px-4 align-top">
                      {inv.isB2B && inv.cashPaid > 0 ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-300 bg-emerald-500/10 border border-amber-500/40 px-2 py-0.5 rounded-lg">
                            <Banknote size={11} className="text-emerald-400" />
                            Cash (GST Bill)
                          </span>
                          <p className="text-[10px] text-slate-300 font-bold">
                            {fmt(inv.cashPaid)} Cash
                          </p>
                        </div>
                      ) : !inv.isB2B && inv.cashPaid > 0 ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-300 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-lg">
                            <IndianRupee size={11} className="text-emerald-400" />
                            Cash (Normal Bill)
                          </span>
                          <p className="text-[10px] text-slate-300 font-bold">
                            {fmt(inv.cashPaid)} Cash
                          </p>
                        </div>
                      ) : inv.isB2B && inv.onlinePaid > 0 ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 text-[10px] font-black text-indigo-300 bg-indigo-500/15 border border-indigo-500/40 px-2 py-0.5 rounded-lg">
                            <Globe size={11} className="text-sky-400" />
                            Online (GST Bill)
                          </span>
                          <p className="text-[10px] text-slate-300 font-bold">
                            {fmt(inv.onlinePaid)} UPI/Card
                          </p>
                        </div>
                      ) : !inv.isB2B && inv.onlinePaid > 0 ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 text-[10px] font-black text-sky-300 bg-sky-500/10 border border-sky-500/25 px-2 py-0.5 rounded-lg">
                            <Smartphone size={11} className="text-sky-400" />
                            Online (Normal Bill)
                          </span>
                          <p className="text-[10px] text-slate-300 font-bold">
                            {fmt(inv.onlinePaid)} UPI/Card
                          </p>
                        </div>
                      ) : inv.dueBalance > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-lg">
                          <Clock size={10} /> Unpaid / Due
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium">
                          Settled
                        </span>
                      )}
                    </td>

                    {/* Total Amount */}
                    <td className="py-3.5 px-4 text-right align-top">
                      <div className="font-black text-sm text-white">
                        {fmt(inv.totalAmount)}
                      </div>
                      {inv.dueBalance > 0 ? (
                        <div className="text-[10px] font-bold text-rose-400 mt-1">
                          Due: {fmt(inv.dueBalance)}
                        </div>
                      ) : (
                        <div className="text-[10px] font-bold text-emerald-400 mt-1">
                          ✓ Paid
                        </div>
                      )}
                    </td>

                    {/* Status Pill */}
                    <td className="py-3.5 px-4 text-center align-top">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                          inv.paymentStatus === 'PAID'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : inv.paymentStatus === 'PARTIAL'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}
                      >
                        {inv.paymentStatus === 'PAID' && <CheckCircle2 size={10} />}
                        {inv.paymentStatus === 'PARTIAL' && <AlertCircle size={10} />}
                        {inv.paymentStatus === 'DUE' && <Clock size={10} />}
                        {inv.paymentStatus}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right align-top">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedInvoice(inv);
                            setShowReceiptModal(true);
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-bold transition-all hover:scale-105 active:scale-95 shadow-sm"
                          title="View / Print Bill"
                        >
                          <Printer size={12} />
                          <span>View Bill</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const checkInId = inv.rawFolio.reservation?.checkIns?.[0]?.id || `folio-${inv.folioId}`;
                            router.push(`/hotel/checkout/${checkInId}?folioId=${inv.folioId}`);
                          }}
                          className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
                          title="Open Folio / Checkout"
                        >
                          <ArrowUpRight size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
