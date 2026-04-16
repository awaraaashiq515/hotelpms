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
  ChevronRight
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { Button } from '@/components/ui/Button';

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
  }, []);

  const setRangeType = (type: 'today' | 'yesterday' | 'week') => {
    const end = new Date();
    const start = new Date();
    
    if (type === 'yesterday') {
      start.setDate(start.getDate() - 1);
      end.setDate(end.getDate() - 1);
    } else if (type === 'week') {
      start.setDate(start.getDate() - 7);
    }
    
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
             <BarChart3 className="text-pos-primary" size={32} />
             Sales Report
          </h1>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Detailed revenue and product performance</p>
        </div>
        <div className="flex items-center gap-2">
           <Button variant="outline" size="sm" onClick={() => setRangeType('today')} className="rounded-xl border-slate-200 dark:border-slate-700">Today</Button>
           <Button variant="outline" size="sm" onClick={() => setRangeType('yesterday')} className="rounded-xl border-slate-200 dark:border-slate-700">Yesterday</Button>
           <Button variant="outline" size="sm" onClick={() => setRangeType('week')} className="rounded-xl border-slate-200 dark:border-slate-700">Last 7 Days</Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col md:flex-row items-end gap-6">
         <div className="flex-1 space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Date Range</label>
            <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900 p-1 rounded-2xl border border-slate-100 dark:border-slate-800">
               <input 
                  type="date" 
                  value={startDate} 
                  onChange={e => setStartDate(e.target.value)}
                  className="bg-transparent border-none text-xs font-black text-slate-700 dark:text-slate-300 outline-none p-3"
               />
               <span className="text-slate-300">to</span>
               <input 
                  type="date" 
                  value={endDate} 
                  onChange={e => setEndDate(e.target.value)}
                  className="bg-transparent border-none text-xs font-black text-slate-700 dark:text-slate-300 outline-none p-3"
               />
            </div>
         </div>
         <Button 
            onClick={fetchReport} 
            loading={loading}
            className="rounded-2xl h-[52px] px-8 bg-pos-primary hover:bg-pos-primary-dark shadow-lg shadow-pos-primary/20 font-black uppercase text-xs tracking-widest gap-2"
         >
            <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
            Update Report
         </Button>
      </div>

      {data ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: 'Net Sales', value: `₹${data.summary.totalSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, icon: <TrendingUp className="text-emerald-500" />, sub: 'Total Revenue Generated' },
              { label: 'Products Sold', value: data.summary.productCount, icon: <ShoppingBag className="text-blue-500" />, sub: 'Unique items sold' },
              { label: 'Categories', value: data.summary.categoryCount, icon: <Layers className="text-orange-500" />, sub: 'Department contribution' },
            ].map((stat, i) => (
              <div key={i} className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm">
                 <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
                       {stat.icon}
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                 </div>
                 <p className="text-3xl font-black text-slate-900 dark:text-white">{stat.value}</p>
                 <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-tight">{stat.sub}</p>
              </div>
            ))}
          </div>

          {/* Detailed Data */}
          <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
             {/* Tabs Header */}
             <div className="flex items-center justify-between p-6 border-b border-slate-50 dark:border-slate-700">
                <div className="flex bg-slate-50 dark:bg-slate-900 p-1 rounded-2xl">
                   <button 
                      onClick={() => setView('products')}
                      className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'products' ? 'bg-white dark:bg-slate-800 text-pos-primary shadow-sm' : 'text-slate-400'}`}
                   >
                      By Products
                   </button>
                   <button 
                      onClick={() => setView('categories')}
                      className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'categories' ? 'bg-white dark:bg-slate-800 text-pos-primary shadow-sm' : 'text-slate-400'}`}
                   >
                      By Categories
                   </button>
                </div>

                <Button variant="outline" size="sm" className="rounded-xl gap-2 font-black text-[10px] uppercase border-slate-200 dark:border-slate-700">
                    <Download size={14} /> Export CSV
                </Button>
             </div>

             {/* Table */}
             <div className="overflow-x-auto">
                <table className="w-full">
                   <thead>
                      <tr className="bg-slate-50/50 dark:bg-slate-900/50">
                         <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                         {view === 'products' && (
                            <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                         )}
                         <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Qty Sold</th>
                         <th className="px-8 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Amount</th>
                      </tr>
                   </thead>
                   <tbody>
                      {view === 'products' ? (
                        data.products.map((p) => (
                          <tr key={p.id} className="border-t border-slate-50 dark:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                             <td className="px-8 py-4 text-sm font-black text-slate-900 dark:text-white uppercase">{p.name}</td>
                             <td className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-tight">{p.category}</td>
                             <td className="px-6 py-4 text-center text-sm font-black text-slate-700 dark:text-slate-300">{p.qty}</td>
                             <td className="px-8 py-4 text-right text-sm font-black text-pos-primary">₹{p.amount.toFixed(2)}</td>
                          </tr>
                        ))
                      ) : (
                        data.categories.map((c) => (
                           <tr key={c.id} className="border-t border-slate-50 dark:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                              <td className="px-8 py-4 text-sm font-black text-slate-900 dark:text-white uppercase">{c.name}</td>
                              <td className="px-6 py-4 text-center text-sm font-black text-slate-700 dark:text-slate-300">{c.qty}</td>
                              <td className="px-8 py-4 text-right text-sm font-black text-pos-primary">₹{c.amount.toFixed(2)}</td>
                           </tr>
                        ))
                      )}
                      {data.products.length === 0 && (
                        <tr>
                           <td colSpan={4} className="px-8 py-20 text-center">
                              <div className="flex flex-col items-center opacity-30">
                                 <AlertCircle size={40} className="mb-4" />
                                 <p className="text-xs font-black uppercase tracking-widest">No sales data found for this period</p>
                              </div>
                           </td>
                        </tr>
                      )}
                   </tbody>
                </table>
             </div>
          </div>
        </>
      ) : (
        <div className="bg-white dark:bg-slate-800 p-20 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm text-center">
            <div className="animate-pulse space-y-4">
               <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-2xl mx-auto" />
               <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Select range to load data...</p>
            </div>
        </div>
      )}
    </div>
  );
}
