'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Receipt, Search, Filter, Download, Printer,
  CheckCircle2, Clock, XCircle, AlertCircle, Eye, TrendingUp,
  TrendingDown, DollarSign, FileText, Calendar, ChevronDown,
  Loader2, RefreshCw, IndianRupee, CreditCard, Wallet, User
} from 'lucide-react';
import { toast, Toaster } from 'sonner';

interface InvoiceItem {
  id: string;
  description: string | null;
  qty: number;
  unitPrice: number;
  taxAmount: number;
  totalAmount: number;
}

interface Invoice {
  id: string;
  invoiceNo: string;
  invoiceDate: string;
  paymentStatus: 'PAID' | 'UNPAID' | 'PARTIAL';
  invoiceStatus: 'ACTIVE' | 'CANCELLED' | 'VOID';
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  tableNo: string | null;
  orderType: string | null;
  cancelReason: string | null;
  guest: { id: string; name: string; email: string | null } | null;
  items: InvoiceItem[];
}

type StatusFilter = 'ALL' | 'PAID' | 'UNPAID' | 'PARTIAL';
type InvoiceStatusFilter = 'ALL' | 'ACTIVE' | 'CANCELLED';

const STATUS_CONFIG = {
  PAID: { label: 'Paid', icon: <CheckCircle2 size={11} />, cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  UNPAID: { label: 'Unpaid', icon: <Clock size={11} />, cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  PARTIAL: { label: 'Partial', icon: <AlertCircle size={11} />, cls: 'bg-sky-500/10 text-sky-400 border-sky-500/20' },
};

function fmt(amount: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);
}

function StatCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string; sub?: string; color: string }) {
  return (
    <div className={`bg-[#090f1e]/80 border rounded-2xl p-5 flex items-start gap-4 ${color}`}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-current/10 shrink-0 opacity-80">
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</p>
        <p className="text-xl font-black text-white mt-0.5">{value}</p>
        {sub && <p className="text-[10px] text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<InvoiceStatusFilter>('ACTIVE');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchInvoices(); }, [statusFilter, invoiceStatusFilter]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      const res = await fetch(`/api/invoices?${params.toString()}`);
      const data = await res.json();
      if (data.success) setInvoices(data.data || []);
      else toast.error('Failed to load invoices');
    } catch {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (!printRef.current) return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<html><head><title>Invoice ${selectedInvoice?.invoiceNo}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
        .header { display: flex; justify-content: space-between; margin-bottom: 24px; }
        .title { font-size: 24px; font-weight: 900; color: #4f46e5; }
        .info { font-size: 11px; color: #555; line-height: 1.6; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background: #f3f4f6; padding: 8px 12px; text-align: left; font-size: 11px; text-transform: uppercase; }
        td { padding: 10px 12px; font-size: 12px; border-bottom: 1px solid #e5e7eb; }
        .totals { margin-top: 16px; text-align: right; }
        .total-row { display: flex; justify-content: flex-end; gap: 40px; font-size: 12px; margin-top: 6px; }
        .grand { font-size: 16px; font-weight: 900; color: #4f46e5; margin-top: 10px; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 99px; font-size: 10px; font-weight: bold; }
        .paid { background: #d1fae5; color: #065f46; }
        .unpaid { background: #fef3c7; color: #92400e; }
        .partial { background: #dbeafe; color: #1e40af; }
      </style></head><body>${printRef.current.innerHTML}</body></html>`);
    w.document.close();
    w.print();
  };

  // Filtering
  const filtered = invoices.filter(inv => {
    const matchSearch = search === '' ||
      inv.invoiceNo.toLowerCase().includes(search.toLowerCase()) ||
      (inv.guest?.name || '').toLowerCase().includes(search.toLowerCase());
    const matchInvStatus = invoiceStatusFilter === 'ALL' || inv.invoiceStatus === invoiceStatusFilter;
    return matchSearch && matchInvStatus;
  });

  // Stats
  const totalRevenue = invoices.filter(i => i.paymentStatus === 'PAID' && i.invoiceStatus === 'ACTIVE').reduce((s, i) => s + i.totalAmount, 0);
  const totalUnpaid = invoices.filter(i => i.paymentStatus === 'UNPAID' && i.invoiceStatus === 'ACTIVE').reduce((s, i) => s + i.totalAmount, 0);
  const totalTax = invoices.filter(i => i.invoiceStatus === 'ACTIVE').reduce((s, i) => s + i.taxAmount, 0);
  const totalCount = invoices.filter(i => i.invoiceStatus === 'ACTIVE').length;

  return (
    <div className="min-h-screen bg-[#020617] text-white p-4 sm:p-6 space-y-6">
      <Toaster richColors position="top-right" />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <Link href="/hotel/billing" className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-all">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Receipt className="text-indigo-400" size={13} />
              <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Hotel Billing</span>
            </div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Invoice Management
            </h1>
          </div>
        </div>
        <button
          onClick={fetchInvoices}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 text-xs font-bold transition-all"
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={<IndianRupee size={18} className="text-emerald-400" />}
          label="Total Collected"
          value={fmt(totalRevenue)}
          sub={`${invoices.filter(i => i.paymentStatus === 'PAID').length} paid invoices`}
          color="border-emerald-500/20"
        />
        <StatCard
          icon={<Clock size={18} className="text-amber-400" />}
          label="Outstanding"
          value={fmt(totalUnpaid)}
          sub={`${invoices.filter(i => i.paymentStatus === 'UNPAID').length} pending`}
          color="border-amber-500/20"
        />
        <StatCard
          icon={<FileText size={18} className="text-indigo-400" />}
          label="Total Invoices"
          value={totalCount.toString()}
          sub="Active invoices"
          color="border-indigo-500/20"
        />
        <StatCard
          icon={<CreditCard size={18} className="text-violet-400" />}
          label="Tax Collected"
          value={fmt(totalTax)}
          sub="GST / tax amount"
          color="border-violet-500/20"
        />
      </div>

      {/* Filters & Search */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search invoice no, guest name..."
            className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-all"
          />
        </div>

        {/* Payment Status Filter */}
        <div className="flex gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800/80">
          {(['ALL', 'PAID', 'UNPAID', 'PARTIAL'] as StatusFilter[]).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                statusFilter === s ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              {s === 'ALL' ? 'All Status' : s}
            </button>
          ))}
        </div>

        {/* Invoice Status Filter */}
        <div className="flex gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800/80">
          {(['ACTIVE', 'CANCELLED', 'ALL'] as InvoiceStatusFilter[]).map(s => (
            <button
              key={s}
              onClick={() => setInvoiceStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                invoiceStatusFilter === s ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-3">
          <Loader2 className="animate-spin text-indigo-500" size={28} />
          <p className="text-xs text-slate-500 font-bold">Loading invoices...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 flex flex-col items-center gap-3 border-2 border-dashed border-slate-800 rounded-2xl text-slate-500">
          <Receipt size={40} className="text-slate-700" />
          <p className="font-bold text-sm">No invoices found</p>
          <p className="text-xs text-slate-600">Try adjusting your filters or search query</p>
        </div>
      ) : (
        <div className="bg-[#090f1e]/60 border border-slate-800 rounded-2xl overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 border-b border-slate-800 text-[9px] font-black uppercase tracking-widest text-slate-500">
            <span>Invoice / Guest</span>
            <span>Date</span>
            <span>Amount</span>
            <span>Payment</span>
            <span>Status</span>
            <span>Action</span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-slate-800/60">
            {filtered.map(inv => {
              const pc = STATUS_CONFIG[inv.paymentStatus] || STATUS_CONFIG.UNPAID;
              return (
                <div
                  key={inv.id}
                  className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_auto] gap-4 px-5 py-4 items-center hover:bg-slate-800/20 transition-all group"
                >
                  {/* Invoice / Guest */}
                  <div>
                    <p className="text-xs font-black text-white">{inv.invoiceNo}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                      <User size={9} />
                      {inv.guest?.name || 'Walk-in Guest'}
                    </p>
                    {inv.tableNo && <p className="text-[9px] text-indigo-400 mt-0.5">Table {inv.tableNo}</p>}
                  </div>

                  {/* Date */}
                  <div>
                    <p className="text-xs text-slate-300">
                      {new Date(inv.invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                    <p className="text-[9px] text-slate-500 mt-0.5">
                      {new Date(inv.invoiceDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  {/* Amount */}
                  <div>
                    <p className="text-xs font-black text-white">{fmt(inv.totalAmount)}</p>
                    {inv.taxAmount > 0 && (
                      <p className="text-[9px] text-slate-500 mt-0.5">+{fmt(inv.taxAmount)} tax</p>
                    )}
                  </div>

                  {/* Payment Status */}
                  <div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${pc.cls}`}>
                      {pc.icon} {pc.label}
                    </span>
                  </div>

                  {/* Invoice Status */}
                  <div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                      inv.invoiceStatus === 'ACTIVE'
                        ? 'bg-slate-800/60 text-slate-300 border-slate-700'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}>
                      {inv.invoiceStatus}
                    </span>
                  </div>

                  {/* Action */}
                  <button
                    onClick={() => { setSelectedInvoice(inv); setShowDetail(true); }}
                    className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-indigo-400 hover:border-indigo-500/30 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Eye size={13} />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-slate-800 text-[10px] text-slate-500 flex items-center justify-between">
            <span>{filtered.length} of {invoices.length} invoices shown</span>
            <span className="font-bold text-slate-400">
              Total: <span className="text-white">{fmt(filtered.reduce((s, i) => s + i.totalAmount, 0))}</span>
            </span>
          </div>
        </div>
      )}

      {/* Invoice Detail Modal */}
      {showDetail && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#090f1e] border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl shadow-indigo-900/20">
            {/* Modal Header */}
            <div className="sticky top-0 bg-[#090f1e]/95 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex items-center justify-between rounded-t-3xl z-10">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400">Invoice Detail</p>
                <h2 className="text-lg font-black text-white">{selectedInvoice.invoiceNo}</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all"
                >
                  <Printer size={13} /> Print
                </button>
                <button
                  onClick={() => setShowDetail(false)}
                  className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-all"
                >
                  <XCircle size={16} />
                </button>
              </div>
            </div>

            {/* Printable Content */}
            <div ref={printRef} className="p-6 space-y-5">
              {/* Invoice Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/50 rounded-2xl p-4 border border-slate-800">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">Invoice Info</p>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Invoice No</span>
                      <span className="font-black text-white">{selectedInvoice.invoiceNo}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Date</span>
                      <span className="text-slate-300">
                        {new Date(selectedInvoice.invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Payment</span>
                      <span className={`font-black ${
                        selectedInvoice.paymentStatus === 'PAID' ? 'text-emerald-400' :
                        selectedInvoice.paymentStatus === 'PARTIAL' ? 'text-sky-400' : 'text-amber-400'
                      }`}>{selectedInvoice.paymentStatus}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Status</span>
                      <span className={selectedInvoice.invoiceStatus === 'ACTIVE' ? 'text-slate-300' : 'text-rose-400'}>
                        {selectedInvoice.invoiceStatus}
                      </span>
                    </div>
                    {selectedInvoice.tableNo && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Table</span>
                        <span className="text-indigo-400 font-bold">{selectedInvoice.tableNo}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-slate-900/50 rounded-2xl p-4 border border-slate-800">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">Guest Info</p>
                  {selectedInvoice.guest ? (
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Name</span>
                        <span className="font-black text-white">{selectedInvoice.guest.name}</span>
                      </div>
                      {selectedInvoice.guest.email && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Email</span>
                          <span className="text-slate-300 truncate max-w-32">{selectedInvoice.guest.email}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">Walk-in Guest</p>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <div className="bg-slate-900/40 rounded-2xl border border-slate-800 overflow-hidden">
                <div className="px-4 py-2.5 border-b border-slate-800 grid grid-cols-[3fr_1fr_1fr_1fr] gap-3 text-[9px] font-black uppercase tracking-wider text-slate-500">
                  <span>Description</span>
                  <span className="text-right">Qty</span>
                  <span className="text-right">Price</span>
                  <span className="text-right">Total</span>
                </div>
                <div className="divide-y divide-slate-800/50">
                  {selectedInvoice.items.map(item => (
                    <div key={item.id} className="px-4 py-3 grid grid-cols-[3fr_1fr_1fr_1fr] gap-3 text-xs">
                      <span className="text-slate-300">{item.description || 'Item'}</span>
                      <span className="text-right text-slate-400">{item.qty}</span>
                      <span className="text-right text-slate-400">{fmt(item.unitPrice)}</span>
                      <span className="text-right font-bold text-white">{fmt(item.totalAmount)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="bg-slate-900/40 rounded-2xl border border-slate-800 p-4 space-y-2">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Subtotal</span>
                  <span>{fmt(selectedInvoice.subtotal)}</span>
                </div>
                {selectedInvoice.discountAmount > 0 && (
                  <div className="flex justify-between text-xs text-emerald-400">
                    <span>Discount</span>
                    <span>- {fmt(selectedInvoice.discountAmount)}</span>
                  </div>
                )}
                {selectedInvoice.taxAmount > 0 && (
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Tax / GST</span>
                    <span>{fmt(selectedInvoice.taxAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black text-white border-t border-slate-700 pt-2 mt-2">
                  <span>Total</span>
                  <span className="text-indigo-400">{fmt(selectedInvoice.totalAmount)}</span>
                </div>
              </div>

              {/* Cancel Reason */}
              {selectedInvoice.cancelReason && (
                <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-3 flex gap-2 items-start">
                  <XCircle size={13} className="text-rose-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-rose-300"><span className="font-black">Cancel Reason:</span> {selectedInvoice.cancelReason}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
