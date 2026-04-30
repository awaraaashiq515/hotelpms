'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  BarChart3, 
  Calendar, 
  RefreshCcw, 
  TrendingUp, 
  ShoppingBag, 
  Layers, 
  Download,
  AlertCircle,
  ChevronRight,
  Trophy,
  PieChart,
  ArrowUpRight,
  Search,
  Filter
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/shared/page-header';
import { motion, AnimatePresence } from 'framer-motion';

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface SalesSummary {
  totalSales: number;
  productCount: number;
  categoryCount: number;
}

interface ProductSale {
  id: string;
  name: string;
  qty: number;
  amount: number;
  category: string;
}

interface CategorySale {
  id: string;
  name: string;
  qty: number;
  amount: number;
}

interface SalesReportData {
  summary: SalesSummary;
  products: ProductSale[];
  categories: CategorySale[];
}

export default function SalesReportPage() {
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SalesReportData | null>(null);
  const [view, setView] = useState<'products' | 'categories'>('products');
  const [rankingType, setRankingType] = useState<'amount' | 'qty'>('amount');

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<SalesReportData>('/api/reports/sales', {
        params: { startDate, endDate }
      });
      setData(res);
    } catch (err) {
      console.error('Failed to fetch sales report:', err);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const downloadCSV = () => {
    if (!data) return;
    const items = view === 'products' ? data.products : data.categories;
    const headers = view === 'products' ? ['Name', 'Category', 'Qty', 'Amount'] : ['Category', 'Qty', 'Amount'];
    
    const csvContent = [
      headers.join(','),
      ...items.map((item: any) => {
        if (view === 'products') {
          return `"${item.name}","${(item as any).category}",${item.qty},${item.amount}`;
        }
        return `"${item.name}",${item.qty},${item.amount}`;
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `sales_report_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadPDF = () => {
    if (!data) return;
    const doc = new jsPDF();
    const title = `Sales Intelligence Report (${startDate} to ${endDate})`;
    
    doc.setFontSize(18);
    doc.text(title, 14, 22);
    
    doc.setFontSize(11);
    doc.text(`Total Revenue: INR ${data.summary.totalSales.toLocaleString()}`, 14, 32);
    doc.text(`Total Items Sold: ${data.products.reduce((acc, p) => acc + p.qty, 0)}`, 14, 38);
    
    const tableData = (view === 'products' ? data.products : data.categories).map((item: any) => [
      (item as any).name,
      view === 'products' ? (item as any).category : '-',
      item.qty.toString(),
      `INR ${item.amount.toLocaleString()}`
    ]);

    autoTable(doc, {
      startY: 45,
      head: [['Description', 'Group', 'Qty', 'Amount (INR)']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] } // Emerald color
    });

    doc.save(`sales_report_${startDate}_to_${endDate}.pdf`);
  };

  const setRangeType = (type: 'today' | 'yesterday' | 'week' | 'month') => {
    const end = new Date();
    const start = new Date();
    
    if (type === 'yesterday') {
      start.setDate(start.getDate() - 1);
      end.setDate(end.getDate() - 1);
    } else if (type === 'week') {
      start.setDate(start.getDate() - 7);
    } else if (type === 'month') {
      start.setDate(1);
    }
    
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  const topProducts = data?.products
    ? [...data.products]
        .sort((a, b) => b[rankingType] - a[rankingType])
        .slice(0, 5)
    : [];

  const maxVal = topProducts.length > 0 ? Math.max(...topProducts.map(p => p[rankingType])) : 1;

  return (
    <div className="space-y-4 pb-8 animate-in fade-in duration-500">
      {/* Ultra-Compact Header */}
      <PageHeader
        title="Sales Intelligence"
        subtitle="Performance Diagnostics"
        showBack
        backUrl="/reports"
        actions={
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            {['today', 'yesterday', 'week', 'month'].map((t) => (
              <Button 
                key={t}
                variant="ghost" 
                size="sm" 
                onClick={() => setRangeType(t as any)} 
                className="rounded-lg text-[9px] font-black uppercase tracking-widest h-7 px-3"
              >
                {t === 'week' ? '7D' : t}
              </Button>
            ))}
          </div>
        }
      />

      {/* Compact Filter Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-9 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
           <div className="flex-1 flex items-center gap-3 bg-slate-50 dark:bg-slate-950 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800">
              <Calendar size={14} className="text-emerald-500" />
              <div className="flex items-center gap-3 flex-1">
                <input 
                   type="date" 
                   value={startDate} 
                   onChange={e => setStartDate(e.target.value)}
                   className="bg-transparent border-none text-[11px] font-bold text-slate-700 dark:text-slate-200 outline-none w-full"
                />
                <span className="text-slate-300">/</span>
                <input 
                   type="date" 
                   value={endDate} 
                   onChange={e => setEndDate(e.target.value)}
                   className="bg-transparent border-none text-[11px] font-bold text-slate-700 dark:text-slate-200 outline-none w-full"
                />
              </div>
           </div>
           <Button 
              onClick={fetchReport} 
              loading={loading}
              className="rounded-xl h-10 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold uppercase text-[10px] tracking-widest gap-2"
           >
              <RefreshCcw size={14} className={loading ? 'animate-spin' : ''} />
              Update
           </Button>
        </div>

        <div className="lg:col-span-3 flex gap-2">
           <Button 
              onClick={downloadPDF}
              variant="outline" 
              className="flex-1 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-[9px] font-bold uppercase tracking-widest h-10"
           >
              <Download size={14} className="mr-2" /> PDF
           </Button>
           <Button 
              onClick={downloadCSV}
              variant="outline" 
              className="flex-1 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-[9px] font-bold uppercase tracking-widest h-10"
           >
              <Download size={14} className="mr-2" /> CSV
           </Button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {data ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {/* Compact KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: 'Revenue', value: `₹${data.summary.totalSales.toLocaleString('en-IN')}`, icon: <TrendingUp size={18} />, color: 'emerald' },
                { label: 'Orders', value: data.products.reduce((acc, p) => acc + p.qty, 0), icon: <ShoppingBag size={18} />, color: 'blue' },
                { label: 'Average', value: `₹${(data.summary.totalSales / (data.products.length || 1)).toFixed(0)}`, icon: <Layers size={18} />, color: 'amber' },
              ].map((stat, i) => (
                <div key={i} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between group">
                   <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                      <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">{stat.value}</h2>
                   </div>
                   <div className={`w-10 h-10 rounded-xl bg-${stat.color}-500/10 text-${stat.color}-500 flex items-center justify-center`}>
                      {stat.icon}
                   </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
               {/* Top Performers (Compact) */}
               <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                     <h3 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">Top Performers</h3>
                     <div className="flex bg-slate-50 dark:bg-slate-950 p-1 rounded-lg border">
                        <button onClick={() => setRankingType('amount')} className={`px-3 py-1 rounded-md text-[8px] font-bold ${rankingType === 'amount' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-400'}`}>Value</button>
                        <button onClick={() => setRankingType('qty')} className={`px-3 py-1 rounded-md text-[8px] font-bold ${rankingType === 'qty' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-400'}`}>Qty</button>
                     </div>
                  </div>

                  <div className="space-y-4">
                     {topProducts.map((p, idx) => (
                        <div key={p.id} className="space-y-1.5">
                           <div className="flex justify-between text-[10px] font-bold">
                              <span className="text-slate-500 dark:text-slate-400 uppercase truncate pr-4">{p.name}</span>
                              <span className="text-emerald-500">
                                 {rankingType === 'amount' ? `₹${p.amount.toLocaleString()}` : `${p.qty}`}
                              </span>
                           </div>
                           <div className="h-1.5 w-full bg-slate-50 dark:bg-slate-950 rounded-full overflow-hidden">
                              <div 
                                 className="h-full bg-emerald-500"
                                 style={{ width: `${(p[rankingType] / maxVal) * 100}%` }}
                              />
                           </div>
                        </div>
                     ))}
                  </div>
               </div>

               {/* Department (Compact) */}
               <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                  <h3 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-6">Department Share</h3>
                  <div className="space-y-3">
                     {data.categories.slice(0, 6).map((c, idx) => (
                        <div key={c.id} className="flex items-center justify-between text-[10px] font-bold border-b border-slate-50 dark:border-slate-800/50 pb-2 last:border-0">
                           <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <span className="text-slate-500 uppercase">{c.name}</span>
                           </div>
                           <span className="text-slate-900 dark:text-white">₹{c.amount.toLocaleString()}</span>
                        </div>
                     ))}
                  </div>
               </div>
            </div>

            {/* Dense Ledger Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
               <div className="px-5 py-3 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
                  <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Diagnostic Ledger</h3>
                  <div className="flex bg-white dark:bg-slate-900 p-0.5 rounded-lg border">
                     <button onClick={() => setView('products')} className={`px-3 py-1 rounded-md text-[8px] font-bold ${view === 'products' ? 'bg-emerald-500 text-white' : 'text-slate-400'}`}>Items</button>
                     <button onClick={() => setView('categories')} className={`px-3 py-1 rounded-md text-[8px] font-bold ${view === 'categories' ? 'bg-emerald-500 text-white' : 'text-slate-400'}`}>Groups</button>
                  </div>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead>
                        <tr className="bg-slate-50/50 dark:bg-slate-950/50">
                           <th className="px-5 py-2 text-[8px] font-black text-slate-400 uppercase tracking-widest border-b">Description</th>
                           <th className="px-5 py-2 text-center text-[8px] font-black text-slate-400 uppercase tracking-widest border-b">Qty</th>
                           <th className="px-5 py-2 text-right text-[8px] font-black text-slate-400 uppercase tracking-widest border-b">Total (INR)</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                        {(view === 'products' ? data.products : data.categories).map((item) => (
                           <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-950 transition-colors">
                              <td className="px-5 py-2.5">
                                 <p className="text-[10px] font-bold text-slate-700 dark:text-slate-200 uppercase">{(item as any).name}</p>
                              </td>
                              <td className="px-5 py-2.5 text-center text-[10px] font-bold tabular-nums text-slate-500">{item.qty}</td>
                              <td className="px-5 py-2.5 text-right text-[10px] font-black tabular-nums text-emerald-600 dark:text-emerald-400">₹{item.amount.toLocaleString()}</td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
          </motion.div>
        ) : (
          <div className="bg-white dark:bg-slate-900 p-20 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm text-center">
              <div className="flex flex-col items-center opacity-50">
                 <BarChart3 className="text-emerald-500 mb-4" size={32} />
                 <h3 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">Signal Awaiting</h3>
                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Select a range to begin diagnostics</p>
              </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
