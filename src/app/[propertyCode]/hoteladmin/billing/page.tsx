'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  CreditCard, Search, RefreshCw, CheckCircle2, Clock,
  ArrowLeft, User, IndianRupee, FileText, Download,
  Filter, Calendar
} from 'lucide-react';

interface Invoice {
  id: string;
  invoiceNumber: string;
  guestName?: string;
  roomNumber?: string;
  totalAmount: number;
  paidAmount?: number;
  status: string; // 'PAID' | 'PENDING' | 'PARTIAL' | 'VOID'
  paymentMethod?: string;
  createdAt: string;
}

function HotelAdminBillingContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const propertyCode = (params?.propertyCode as string) || '';
  const initialStatus = searchParams?.get('status') || 'ALL';

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/hotel/invoices`);
      const data = await res.json();
      if (data && data.success && Array.isArray(data.data)) {
        setInvoices(data.data);
      } else if (Array.isArray(data)) {
        setInvoices(data);
      }
    } catch (e) {
      console.error('Failed to load invoices', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const filteredInvoices = invoices.filter((inv) => {
    const q = (searchQuery || '').toLowerCase();
    const invNum = (inv.invoiceNumber || '').toLowerCase();
    const guest = (inv.guestName || '').toLowerCase();
    const room = (inv.roomNumber || '').toLowerCase();

    const matchesSearch =
      !q ||
      invNum.includes(q) ||
      guest.includes(q) ||
      room.includes(q);

    const matchesStatus =
      statusFilter === 'ALL' || (inv.status && inv.status.toUpperCase() === statusFilter);

    return matchesSearch && matchesStatus;
  });

  const totalInvoiced = invoices.reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0);
  const paidTotal = invoices
    .filter((inv) => inv.status === 'PAID')
    .reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0);
  const pendingTotal = invoices
    .filter((inv) => inv.status === 'PENDING' || inv.status === 'PARTIAL')
    .reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0);
  const pendingCount = invoices.filter((inv) => inv.status === 'PENDING' || inv.status === 'PARTIAL').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href={`/${propertyCode}/hoteladmin`}
              className="text-xs font-bold text-slate-500 hover:text-amber-500 flex items-center gap-1 transition-colors"
            >
              <ArrowLeft size={14} /> Back to Dashboard
            </Link>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <CreditCard className="text-amber-500" size={26} />
            Billing & Invoices Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Review guest folios, settlement balances, payments, and generated invoices
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchInvoices}
            className="flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Total Billed</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">₹{totalInvoiced.toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-slate-400 mt-1">{invoices.length} total invoices</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-500/20 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wider text-emerald-500">Settled (Paid)</p>
          <p className="text-2xl font-black text-emerald-500 mt-1">₹{paidTotal.toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-slate-400 mt-1">Collected revenue</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-rose-500/20 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wider text-rose-500">Pending Dues</p>
          <p className="text-2xl font-black text-rose-500 mt-1">₹{pendingTotal.toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-slate-400 mt-1">{pendingCount} unpaid folios</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-purple-500/20 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wider text-purple-500">Avg Invoice Value</p>
          <p className="text-2xl font-black text-purple-500 mt-1">
            ₹{invoices.length > 0 ? Math.round(totalInvoiced / invoices.length).toLocaleString('en-IN') : 0}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Per guest checkout</p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {[
            { id: 'ALL', label: 'All Invoices' },
            { id: 'PAID', label: '🟢 Paid' },
            { id: 'PENDING', label: '⏳ Pending' },
            { id: 'PARTIAL', label: '🟡 Partial' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === tab.id
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search invoice #, guest, room..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-transparent focus:border-amber-500 outline-none transition-all dark:text-white"
          />
        </div>
      </div>

      {/* Invoices Table */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <RefreshCw className="animate-spin text-amber-500 mb-3" size={32} />
          <p className="text-xs font-bold uppercase tracking-wider">Loading Billing Records...</p>
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
          <FileText className="mx-auto text-slate-400 mb-3" size={40} />
          <p className="font-bold text-slate-700 dark:text-slate-300">No invoices match your filter</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Guest</th>
                  <th className="py-3 px-4">Room</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {inv.invoiceNumber}
                    </td>

                    <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">
                      {inv.guestName || 'Walk-in Guest'}
                    </td>

                    <td className="py-3 px-4">
                      {inv.roomNumber ? `Room ${inv.roomNumber}` : '—'}
                    </td>

                    <td className="py-3 px-4 text-slate-500">
                      {inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : '—'}
                    </td>

                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {inv.paymentMethod || 'UPI / Cash'}
                    </td>

                    <td className="py-3 px-4 text-right font-black text-slate-900 dark:text-white text-xs">
                      ₹{Number(inv.totalAmount || 0).toLocaleString('en-IN')}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <span
                        className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          inv.status === 'PAID'
                            ? 'bg-emerald-500/15 text-emerald-500'
                            : inv.status === 'PARTIAL'
                            ? 'bg-amber-500/15 text-amber-500'
                            : 'bg-rose-500/15 text-rose-500'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function HotelAdminBillingPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <RefreshCw className="animate-spin text-amber-500 mb-3" size={32} />
          <p className="text-xs font-bold uppercase tracking-wider">Loading Billing Records...</p>
        </div>
      }
    >
      <HotelAdminBillingContent />
    </Suspense>
  );
}
