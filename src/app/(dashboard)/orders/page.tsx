'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search, ReceiptText, IndianRupee, TrendingUp,
  Calculator, ChevronDown, ChevronUp, Calendar,
  Filter, Package, User, Truck, Hash, Clock
} from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  product: { id: string; name: string; sku?: string };
}

interface Bill {
  id: string;
  orderNo: string;
  orderType: string;
  tableNo?: string;
  status: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  grandTotal: number;
  createdAt: string;
  items: OrderItem[];
  staffMember?: { id: string; name: string };
  driver?: { id: string; name: string };
}

interface BillSummary {
  totalOrders: number;
  totalSubtotal: number;
  totalTax: number;
  totalDiscount: number;
  totalGrand: number;
  averageOrder: number;
}

type DatePreset = 'today' | 'yesterday' | 'week' | 'month' | 'all' | 'custom';

import { useSearchParams } from 'next/navigation';

export default function OrdersPage() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [bills, setBills] = useState<Bill[]>([]);
  const [summary, setSummary] = useState<BillSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialSearch);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [datePreset, setDatePreset] = useState<DatePreset>('today');
  const [customDate, setCustomDate] = useState('');

  // Auto-fill from URL on mount or param change
  useEffect(() => {
    if (initialSearch) {
      setSearch(initialSearch);
      // Optional: switch date preset to 'all' if searching, so we find it regardless of date
      setDatePreset('all');
    }
  }, [initialSearch]);

  const fetchBills = async () => {
    setLoading(true);
    try {
      let url = '/api/bills';
      const params = new URLSearchParams();

      if (datePreset === 'today') {
        params.set('date', new Date().toISOString().split('T')[0]);
      } else if (datePreset === 'yesterday') {
        const y = new Date();
        y.setDate(y.getDate() - 1);
        params.set('date', y.toISOString().split('T')[0]);
      } else if (datePreset === 'week') {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 7);
        params.set('startDate', start.toISOString().split('T')[0]);
        params.set('endDate', end.toISOString().split('T')[0]);
      } else if (datePreset === 'month') {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 30);
        params.set('startDate', start.toISOString().split('T')[0]);
        params.set('endDate', end.toISOString().split('T')[0]);
      } else if (datePreset === 'custom' && customDate) {
        params.set('date', customDate);
      }

      const qs = params.toString();
      if (qs) url += '?' + qs;

      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setBills(json.data.orders || []);
        setSummary(json.data.summary || null);
      }
    } catch (err) {
      console.error('Failed to fetch bills:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, [datePreset, customDate]);

  const filteredBills = useMemo(() => {
    if (!search) return bills;
    const q = search.toLowerCase();
    return bills.filter(
      (b) =>
        b.orderNo.toLowerCase().includes(q) ||
        b.tableNo?.toLowerCase().includes(q) ||
        b.staffMember?.name?.toLowerCase().includes(q) ||
        b.driver?.name?.toLowerCase().includes(q)
    );
  }, [bills, search]);

  // Compute filtered totals
  const filteredTotal = useMemo(() => {
    return filteredBills.reduce((sum, b) => sum + b.grandTotal, 0);
  }, [filteredBills]);

  const summaryCards = [
    {
      label: 'Total Bills',
      value: summary?.totalOrders?.toString() || '0',
      icon: ReceiptText,
      color: 'from-pos-primary to-pos-primary-dark',
      bg: 'bg-pos-primary/10',
      text: 'text-pos-primary',
    },
    {
      label: 'Total Revenue',
      value: `₹${(summary?.totalGrand || 0).toFixed(2)}`,
      icon: IndianRupee,
      color: 'from-emerald-500 to-teal-600',
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
    },
    {
      label: 'Total Tax',
      value: `₹${(summary?.totalTax || 0).toFixed(2)}`,
      icon: Calculator,
      color: 'from-amber-500 to-orange-600',
      bg: 'bg-amber-50',
      text: 'text-amber-600',
    },
    {
      label: 'Avg Order',
      value: `₹${(summary?.averageOrder || 0).toFixed(2)}`,
      icon: TrendingUp,
      color: 'from-rose-500 to-pink-600',
      bg: 'bg-rose-50',
      text: 'text-rose-600',
    },
  ];

  const datePresets: { key: DatePreset; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: 'yesterday', label: 'Yesterday' },
    { key: 'week', label: '7 Days' },
    { key: 'month', label: '30 Days' },
    { key: 'all', label: 'All' },
    { key: 'custom', label: 'Pick Date' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="All Bills"
        subtitle="Complete list of all settled bills with totals"
        showBack
      />

      {/* ── Summary Cards ──────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${card.bg} dark:bg-slate-800 flex items-center justify-center ${card.text} group-hover:scale-110 transition-transform`}>
                <card.icon size={18} />
              </div>
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">{card.value}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* ── Filters Bar ────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-50 dark:border-slate-800 bg-gray-50/30 dark:bg-slate-800/30 flex flex-wrap items-center justify-between gap-3">
          {/* Search */}
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" size={16} />
            <input
              type="text"
              placeholder="Search by order no, table, staff..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs w-full focus:ring-2 focus:ring-pos-primary/20 transition-all font-medium text-gray-900 dark:text-white outline-none"
            />
          </div>

          {/* Date Presets */}
          <div className="flex items-center gap-2">
            <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-xl">
              {datePresets.map((dp) => (
                <button
                  key={dp.key}
                  onClick={() => setDatePreset(dp.key)}
                  className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                    datePreset === dp.key
                    ? 'bg-white dark:bg-slate-700 text-pos-primary shadow-sm'
                      : 'text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300'
                  }`}
                >
                  {dp.label}
                </button>
              ))}
            </div>
            {datePreset === 'custom' && (
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-medium bg-white dark:bg-slate-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-pos-primary/20"
              />
            )}
          </div>
        </div>

        {/* ── Bills Table ────────────────────────────────────── */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800">
                <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-slate-400 w-8"></th>
                <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-slate-400">Bill No</th>
                <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-slate-400">Date & Time</th>
                <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-slate-400">Type</th>
                <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-slate-400">Table</th>
                <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-slate-400">Items</th>
                <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-slate-400">Staff</th>
                <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-slate-400 text-right">Subtotal</th>
                <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-slate-400 text-right">Tax</th>
                <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-slate-400 text-right">Grand Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 10 }).map((_, j) => (
                      <td key={j} className="px-5 py-5">
                        <div className="h-4 bg-gray-100 dark:bg-slate-800 rounded w-full"></div>
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3 text-gray-300 dark:text-slate-700">
                      <ReceiptText size={48} />
                      <p className="text-xs font-bold uppercase tracking-widest">No bills found</p>
                      <p className="text-[10px] font-medium text-gray-400 dark:text-slate-600">Try changing the date filter or search term</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredBills.map((bill) => (
                  <React.Fragment key={bill.id}>
                    {/* Main Row */}
                    <tr
                      className="hover:bg-pos-primary/5 dark:hover:bg-pos-primary/10 transition-colors cursor-pointer group"
                      onClick={() => setExpandedId(expandedId === bill.id ? null : bill.id)}
                    >
                      <td className="px-5 py-4">
                        <button className="w-6 h-6 rounded-lg bg-gray-100 dark:bg-slate-800 group-hover:bg-pos-primary/10 flex items-center justify-center text-gray-400 group-hover:text-pos-primary transition-all">
                          {expandedId === bill.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-pos-primary/10 flex items-center justify-center text-pos-primary">
                            <Hash size={13} />
                          </div>
                          <span className="text-xs font-bold text-gray-900 dark:text-white tracking-tight">{bill.orderNo}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-gray-800 dark:text-slate-200">
                            {new Date(bill.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                          <span className="text-[10px] text-gray-400 dark:text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                            <Clock size={9} />
                            {new Date(bill.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${
                          bill.orderType === 'DINE_IN' ? 'bg-pos-primary/10 text-pos-primary'
                            : bill.orderType === 'DELIVERY' ? 'bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400'
                            : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {bill.orderType.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs font-bold text-gray-700 dark:text-slate-300">{bill.tableNo || '—'}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs font-bold text-gray-800 dark:text-slate-200 bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                          {bill.items?.length || 0}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          {bill.staffMember ? (
                            <>
                              <User size={11} className="text-gray-400 dark:text-slate-500" />
                              <span className="text-xs font-bold text-gray-600 dark:text-slate-400 capitalize">{bill.staffMember.name}</span>
                            </>
                          ) : bill.driver ? (
                            <>
                              <Truck size={11} className="text-gray-400 dark:text-slate-500" />
                              <span className="text-xs font-bold text-gray-600 dark:text-slate-400 capitalize">{bill.driver.name}</span>
                            </>
                          ) : (
                            <span className="text-xs text-gray-300 dark:text-slate-700 font-medium">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="text-xs font-bold text-gray-700 dark:text-slate-300">₹{bill.subtotal.toFixed(2)}</span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400">₹{bill.taxAmount.toFixed(2)}</span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="text-sm font-bold text-gray-900 dark:text-white">₹{bill.grandTotal.toFixed(2)}</span>
                      </td>
                    </tr>

                    {/* Expanded Items Row */}
                    {expandedId === bill.id && (
                      <tr className="bg-gray-50/60">
                        <td colSpan={10} className="px-8 py-4">
                          <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
                            <div className="px-4 py-2.5 bg-pos-primary/5 dark:bg-pos-primary/10 border-b border-pos-primary/10 dark:border-pos-primary/20 flex items-center gap-2">
                              <Package size={12} className="text-pos-primary" />
                              <span className="text-[10px] font-bold uppercase tracking-widest text-pos-primary">
                                Order Items — {bill.orderNo}
                              </span>
                            </div>
                            <table className="w-full">
                              <thead>
                                <tr className="border-b border-gray-100 dark:border-slate-800">
                                  <th className="px-4 py-2.5 text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500 text-left">#</th>
                                  <th className="px-4 py-2.5 text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500 text-left">Item Name</th>
                                  <th className="px-4 py-2.5 text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500 text-center">Qty</th>
                                  <th className="px-4 py-2.5 text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500 text-right">Rate</th>
                                  <th className="px-4 py-2.5 text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500 text-right">Amount</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                                {bill.items?.map((item, idx) => (
                                  <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50">
                                    <td className="px-4 py-2.5 text-[11px] font-bold text-gray-400 dark:text-slate-500">{idx + 1}</td>
                                    <td className="px-4 py-2.5 text-[11px] font-bold text-gray-800 dark:text-slate-200">{item.product?.name || 'Unknown'}</td>
                                    <td className="px-4 py-2.5 text-[11px] font-bold text-gray-900 dark:text-white text-center">{item.quantity}</td>
                                    <td className="px-4 py-2.5 text-[11px] font-bold text-gray-600 dark:text-slate-400 text-right">₹{item.unitPrice.toFixed(2)}</td>
                                    <td className="px-4 py-2.5 text-[11px] font-bold text-gray-900 dark:text-white text-right">₹{item.totalAmount.toFixed(2)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>

            {/* ── Grand Total Footer ──────────────────────────── */}
            {!loading && filteredBills.length > 0 && (
              <tfoot>
                <tr className="bg-gray-900 dark:bg-black text-white">
                  <td colSpan={7} className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                        <Calculator size={14} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Grand Total</p>
                        <p className="text-[10px] font-medium text-gray-500">{filteredBills.length} bill(s)</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className="text-xs font-bold text-gray-300">
                      ₹{filteredBills.reduce((s, b) => s + b.subtotal, 0).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className="text-xs font-bold text-amber-400">
                      ₹{filteredBills.reduce((s, b) => s + b.taxAmount, 0).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className="text-lg font-bold text-white">
                      ₹{filteredTotal.toFixed(2)}
                    </span>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
