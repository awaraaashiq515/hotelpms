'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search, ReceiptText, IndianRupee, TrendingUp,
  Calculator, ChevronDown, ChevronUp, Clock,
  Hash, Package, User, Truck, Printer, Building2
} from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { PrintBillModal } from '@/components/modals/print-bill-modal';
import { useSearchParams } from 'next/navigation';

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
  property?: any;
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

export default function AllBillsPage() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [bills, setBills] = useState<Bill[]>([]);
  const [summary, setSummary] = useState<BillSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialSearch);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [datePreset, setDatePreset] = useState<DatePreset>('today');
  const [customDate, setCustomDate] = useState('');
  
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('all');
  const [properties, setProperties] = useState<any[]>([]);

  // Print Modal State
  const [printingBill, setPrintingBill] = useState<Bill | null>(null);

  useEffect(() => {
    if (initialSearch) {
      setSearch(initialSearch);
      setDatePreset('all');
    }
    fetchProperties();
  }, [initialSearch]);

  const fetchProperties = async () => {
    try {
      const res = await fetch('/api/admin/properties');
      const data = await res.json();
      if (data.success) setProperties(data.data);
    } catch (err) {
      console.error('Failed to fetch properties:', err);
    }
  };

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

      // Add property filter
      if (selectedPropertyId && selectedPropertyId !== 'all') {
        url += (url.includes('?') ? '&' : '?') + `propertyId=${selectedPropertyId}`;
      }

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
  }, [datePreset, customDate, selectedPropertyId]);

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

  const filteredTotal = useMemo(() => {
    return filteredBills.reduce((sum, b) => sum + b.grandTotal, 0);
  }, [filteredBills]);

  const summaryCards = [
    {
      label: 'Collected Revenue',
      value: `₹${(summary?.totalGrand || 0).toFixed(2)}`,
      icon: IndianRupee,
      color: 'from-emerald-500 to-teal-600',
      bg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    },
    {
      label: 'Generated Bills',
      value: summary?.totalOrders?.toString() || '0',
      icon: ReceiptText,
      color: 'from-pos-primary to-pos-primary-dark',
      bg: 'bg-pos-primary/10 text-pos-primary border-pos-primary/20',
    },
    {
      label: 'Taxes Collected',
      value: `₹${(summary?.totalTax || 0).toFixed(2)}`,
      icon: Calculator,
      color: 'from-amber-500 to-orange-600',
      bg: 'bg-amber-50 text-amber-600 border-amber-100',
    },
    {
      label: 'Avg. Order Value',
      value: `₹${(summary?.averageOrder || 0).toFixed(2)}`,
      icon: TrendingUp,
      color: 'from-rose-500 to-pink-600',
      bg: 'bg-rose-50 text-rose-600 border-rose-100',
    },
  ];

  const datePresets: { key: DatePreset; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: 'yesterday', label: 'Yesterday' },
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
    { key: 'all', label: 'All Time' },
    { key: 'custom', label: 'Custom' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3 transition-colors">
            <ReceiptText className="text-pos-primary" size={32} />
            All Bills Archive
          </h1>
          <p className="text-sm font-medium text-gray-500 dark:text-slate-400 mt-1 uppercase tracking-widest transition-colors">
            Comprehensive overview of all generated receipts
          </p>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="bg-white dark:bg-slate-900/50 rounded-[24px] border border-gray-100 dark:border-slate-800 p-6 shadow-sm hover:shadow-xl hover:shadow-pos-primary/5 transition-all group overflow-hidden relative"
          >
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${card.color} opacity-5 rounded-bl-[100px] transition-transform group-hover:scale-110`}></div>
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className={`w-12 h-12 rounded-2xl ${card.bg} dark:bg-slate-800 dark:border-slate-700 border flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm`}>
                <card.icon size={22} />
              </div>
            </div>
            <p className="text-3xl font-black text-gray-900 dark:text-white tracking-tight relative z-10 mb-1 transition-colors">{card.value}</p>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500 dark:text-slate-400 relative z-10 transition-colors">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="bg-white dark:bg-slate-900/40 rounded-[32px] border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col transition-colors">
        {/* Toolbar */}
        <div className="p-4 md:p-6 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Search bill no, table, staff..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 pr-4 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl text-sm w-full focus:ring-4 focus:ring-pos-primary/10 focus:border-pos-primary transition-all font-semibold outline-none shadow-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
            />
          </div>

          {properties.length > 0 && (
            <div className="relative w-full md:w-64">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" size={18} />
              <select
                value={selectedPropertyId}
                onChange={(e) => setSelectedPropertyId(e.target.value)}
                className="pl-12 pr-4 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl text-sm w-full focus:ring-4 focus:ring-pos-primary/10 focus:border-pos-primary transition-all font-semibold outline-none shadow-sm text-slate-900 dark:text-white appearance-none"
              >
                <option value="all">All Properties</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
            <div className="flex bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-1.5 rounded-2xl shadow-sm transition-colors">
              {datePresets.map((dp) => (
                <button
                  key={dp.key}
                  onClick={() => setDatePreset(dp.key)}
                  className={`px-4 py-2 text-xs font-black rounded-xl transition-all whitespace-nowrap ${
                    datePreset === dp.key
                      ? 'bg-pos-primary text-white shadow-md shadow-pos-primary/20'
                      : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-700'
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
                className="px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-black text-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-pos-primary/20 shadow-sm transition-colors"
              />
            )}
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800 transition-colors">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-slate-500 w-12"></th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-slate-500">Bill Details</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-slate-500">Property</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-slate-500">Order Info</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-slate-500">Staff/Table</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-slate-500 text-right">Totals</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-slate-500 text-right w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-6"><div className="w-6 h-6 bg-gray-100 dark:bg-slate-800 rounded-lg"></div></td>
                    <td className="px-6 py-6"><div className="w-24 h-4 bg-gray-100 dark:bg-slate-800 rounded mb-2"></div><div className="w-16 h-3 bg-gray-50 dark:bg-slate-900 rounded"></div></td>
                    <td className="px-6 py-6"><div className="w-20 h-4 bg-gray-100 dark:bg-slate-800 rounded mb-2"></div><div className="w-12 h-3 bg-gray-50 dark:bg-slate-900 rounded"></div></td>
                    <td className="px-6 py-6"><div className="w-20 h-4 bg-gray-100 dark:bg-slate-800 rounded mb-2"></div><div className="w-12 h-3 bg-gray-50 dark:bg-slate-900 rounded"></div></td>
                    <td className="px-6 py-6 text-right"><div className="w-20 h-4 bg-gray-100 dark:bg-slate-800 rounded ml-auto mb-2"></div><div className="w-12 h-3 bg-gray-50 dark:bg-slate-900 rounded ml-auto"></div></td>
                    <td className="px-6 py-6"><div className="w-10 h-10 bg-gray-100 dark:bg-slate-800 rounded-xl ml-auto"></div></td>
                  </tr>
                ))
              ) : filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center gap-4 text-gray-300 dark:text-slate-700 transition-colors">
                      <div className="w-24 h-24 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center">
                        <ReceiptText size={48} className="text-gray-300 dark:text-slate-600" />
                      </div>
                      <div>
                        <p className="text-sm font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">No bills found</p>
                        <p className="text-[11px] font-bold text-gray-400 dark:text-slate-500 mt-1">Adjust your filters to see results</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredBills.map((bill) => (
                  <React.Fragment key={bill.id}>
                    <tr className={`transition-colors group ${expandedId === bill.id ? 'bg-pos-primary/5 dark:bg-pos-primary/10' : 'hover:bg-gray-50 dark:hover:bg-slate-800/30'}`}>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => setExpandedId(expandedId === bill.id ? null : bill.id)}
                          className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                            expandedId === bill.id ? 'bg-pos-primary/20 text-pos-primary' : 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500 group-hover:bg-gray-200 dark:group-hover:bg-slate-700 group-hover:text-gray-600 dark:group-hover:text-slate-300'
                          }`}
                        >
                          {expandedId === bill.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-500 dark:text-slate-400 border border-gray-200 dark:border-slate-700 transition-colors">
                            <Hash size={16} />
                          </div>
                          <div>
                            <p className="text-sm font-black text-gray-900 dark:text-white tracking-tight transition-colors">{bill.orderNo}</p>
                            <div className="flex items-center gap-1.5 mt-1 text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest transition-colors">
                              <Clock size={10} />
                              {new Date(bill.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-pos-primary uppercase tracking-widest bg-pos-primary/5 dark:bg-pos-primary/20 px-2 py-1 rounded-md border border-pos-primary/10 dark:border-pos-primary/30 inline-block w-fit transition-colors">
                            {bill.property?.name || 'Main Branch'}
                          </span>
                          <span className="text-[9px] text-gray-400 dark:text-slate-500 font-bold uppercase mt-1 transition-colors">{bill.property?.city}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                          bill.orderType === 'DINE_IN' ? 'bg-pos-primary/10 text-pos-primary border border-pos-primary/20'
                            : bill.orderType === 'DELIVERY' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-800'
                            : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800'
                        }`}>
                          {bill.orderType.replace('_', ' ')}
                        </span>
                        <p className="text-[11px] font-bold text-gray-500 dark:text-slate-400 mt-1.5 transition-colors">{new Date(bill.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {bill.tableNo && (
                            <p className="text-xs font-black text-gray-800 dark:text-slate-200 transition-colors">Table: {bill.tableNo}</p>
                          )}
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase transition-colors">
                            {bill.staffMember ? (
                              <><User size={12} /> {bill.staffMember.name}</>
                            ) : bill.driver ? (
                              <><Truck size={12} /> {bill.driver.name}</>
                            ) : (
                              '—'
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-lg font-black text-gray-900 dark:text-white tracking-tight transition-colors">₹{bill.grandTotal.toFixed(2)}</span>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500 mt-0.5 transition-colors">
                            Tax: ₹{bill.taxAmount.toFixed(2)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setPrintingBill(bill)}
                          className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 flex items-center justify-center hover:bg-pos-primary/10 hover:text-pos-primary hover:border-pos-primary/20 transition-all shadow-sm ml-auto"
                          title="Print Receipt"
                        >
                          <Printer size={18} />
                        </button>
                      </td>
                    </tr>

                    {/* Expandable Order Items Row */}
                    {expandedId === bill.id && (
                      <tr className="bg-gray-50/50 dark:bg-slate-800/20 transition-colors">
                        <td colSpan={6} className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 shadow-inner">
                          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-4 ml-14 max-w-3xl shadow-sm transition-colors">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-slate-500 mb-3 flex items-center gap-2">
                              <Package size={12} /> Order Items
                            </h4>
                            <div className="space-y-2">
                              {bill.items?.map((item, idx) => (
                                <div key={item.id} className="flex items-center justify-between text-xs py-1.5 border-b border-gray-50 dark:border-slate-800/50 last:border-0 transition-colors">
                                  <div className="flex items-center gap-3">
                                    <span className="text-gray-400 dark:text-slate-600 font-bold w-4">{idx + 1}.</span>
                                    <span className="font-bold text-gray-800 dark:text-slate-200">{item.product?.name || 'Unknown Item'}</span>
                                  </div>
                                  <div className="flex items-center gap-8">
                                    <span className="text-gray-500 dark:text-slate-400 font-medium">{item.quantity} x ₹{item.unitPrice.toFixed(2)}</span>
                                    <span className="font-black text-gray-900 dark:text-white w-16 text-right">₹{item.totalAmount.toFixed(2)}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-800 flex justify-end transition-colors">
                              <button
                                onClick={() => setPrintingBill(bill)}
                                className="px-4 py-2 bg-pos-primary/10 text-pos-primary hover:bg-pos-primary hover:text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2"
                              >
                                <Printer size={14} /> Full Print
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
            {/* Table Footer TotalRow */}
            {!loading && filteredBills.length > 0 && (
              <tfoot>
                <tr className="bg-gray-900">
                  <td colSpan={4} className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                        <Calculator size={18} className="text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-white uppercase tracking-widest">Consolidated Totals</p>
                        <p className="text-[11px] font-medium text-gray-400">Total {filteredBills.length} matched bills</p>
                      </div>
                    </div>
                  </td>
                  <td colSpan={2} className="px-6 py-5 text-right">
                    <div className="flex flex-col items-end">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-pos-primary/70 mb-1">Total Found Revenue</p>
                      <span className="text-2xl font-black text-white">₹{filteredTotal.toFixed(2)}</span>
                    </div>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Render Print Modal when a bill is selected to print */}
      {printingBill && (
        <PrintBillModal bill={printingBill} onClose={() => setPrintingBill(null)} />
      )}
    </div>
  );
}
