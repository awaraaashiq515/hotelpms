'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Package, 
  RefreshCcw, 
  AlertTriangle, 
  ArrowDownWideNarrow, 
  ArrowUpWideNarrow, 
  Search,
  Download,
  Filter,
  CheckCircle2
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface StockItem {
  id: string;
  name: string;
  sku: string | null;
  unit: string | null;
  currentStock: number;
  reorderLevel: number;
  costPrice: number;
  isLow: boolean;
}

export default function InventoryReportPage() {
  const [data, setData] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterLow, setFilterLow] = useState(false);

  const fetchStock = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<StockItem[]>('/api/inventory/stock-items');
      setData(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error('Failed to fetch inventory:', err);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStock();
  }, [fetchStock]);

  const filteredData = data.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                          (item.sku?.toLowerCase().includes(search.toLowerCase()));
    const matchesLow = filterLow ? item.isLow : true;
    return matchesSearch && matchesLow;
  });

  const stats = {
    totalItems: data.length,
    lowStock: data.filter(i => i.isLow).length,
    outOfStock: data.filter(i => i.currentStock <= 0).length,
    totalValuation: data.reduce((sum, i) => sum + (i.currentStock * i.costPrice), 0)
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
             <Package className="text-pos-primary" size={32} />
             Inventory Status
          </h1>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Real-time stock levels & valuation</p>
        </div>
        <div className="flex items-center gap-3">
           <Button 
                variant="outline" 
                size="sm" 
                className="rounded-xl border-slate-200 dark:border-slate-700 gap-2"
                onClick={() => setFilterLow(!filterLow)}
            >
                <Filter size={14} className={filterLow ? 'text-pos-primary' : ''} />
                {filterLow ? 'Showing Low Stock' : 'Filter Low Stock'}
           </Button>
           <Button onClick={fetchStock} variant="secondary" size="sm" className="rounded-xl w-10 h-10 p-0">
                <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
           </Button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         {[
            { label: 'Total Stock Items', value: stats.totalItems, icon: <Package className="text-blue-500" /> },
            { label: 'Low Stock Alert', value: stats.lowStock, icon: <AlertTriangle className="text-orange-500" />, color: stats.lowStock > 0 ? 'text-orange-600' : '' },
            { label: 'Out of Stock', value: stats.outOfStock, icon: <ArrowDownWideNarrow className="text-rose-500" />, color: stats.outOfStock > 0 ? 'text-rose-600' : '' },
            { label: 'Estimated Valuation', value: `₹${stats.totalValuation.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, icon: <ArrowUpWideNarrow className="text-emerald-500" /> },
         ].map((s, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-16 h-16 bg-pos-primary/5 rounded-full -mr-8 -mt-8" />
               <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-xl">{s.icon}</div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
               </div>
               <p className={`text-xl font-black ${s.color || 'text-slate-900 dark:text-white'}`}>{s.value}</p>
            </div>
         ))}
      </div>

      {/* Main Table Card */}
      <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
         {/* Table Header / Action Bar */}
         <div className="p-6 border-b border-slate-50 dark:border-slate-700 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-96 group">
               <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-pos-primary transition-colors" />
               <input 
                  type="text" 
                  placeholder="Search by Item Name or SKU..." 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-xs font-bold outline-none focus:border-pos-primary focus:bg-white dark:focus:bg-slate-800/50 transition-all"
               />
            </div>
            <Button variant="outline" size="sm" className="rounded-xl gap-2 font-black text-[10px] uppercase border-slate-200 dark:border-slate-700 h-[46px] px-6">
                <Download size={14} /> Download Report
            </Button>
         </div>

         {/* Table */}
         <div className="overflow-x-auto">
            <table className="w-full">
               <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-900/50">
                     <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Stock Item</th>
                     <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">SKU / Code</th>
                     <th className="px-6 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Reorder Level</th>
                     <th className="px-6 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Stock</th>
                     <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Cost Value</th>
                     <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  </tr>
               </thead>
               <tbody>
                  {filteredData.map((item) => (
                     <tr key={item.id} className="border-t border-slate-50 dark:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                        <td className="px-8 py-5">
                            <p className="text-sm font-black text-slate-900 dark:text-white uppercase leading-tight">{item.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 mt-0.5">{item.unit || 'Units'}</p>
                        </td>
                        <td className="px-6 py-5">
                            <span className="text-xs font-mono font-bold text-slate-500 uppercase">{item.sku || '—'}</span>
                        </td>
                        <td className="px-6 py-5 text-center text-xs font-black text-slate-400 uppercase">
                            {item.reorderLevel}
                        </td>
                        <td className="px-6 py-5 text-center">
                            <span className={`text-sm font-black ${item.isLow ? 'text-orange-600' : 'text-slate-700 dark:text-slate-300'}`}>
                                {item.currentStock}
                            </span>
                        </td>
                        <td className="px-8 py-5 text-right">
                           <p className="text-xs font-black text-slate-900 dark:text-white">₹{item.costPrice.toFixed(2)}</p>
                           <p className="text-[9px] font-bold text-slate-400 uppercase">Per {item.unit || 'Unit'}</p>
                        </td>
                        <td className="px-8 py-5 text-right">
                           {item.currentStock <= 0 ? (
                              <Badge variant="error" className="uppercase text-[9px] font-black tracking-widest px-3 py-1">Out of Stock</Badge>
                           ) : item.isLow ? (
                              <Badge variant="warning" className="uppercase text-[9px] font-black tracking-widest px-3 py-1">Low Stock</Badge>
                           ) : (
                              <Badge variant="success" className="uppercase text-[9px] font-black tracking-widest px-3 py-1">In Stock</Badge>
                           )}
                        </td>
                     </tr>
                  ))}
                  {filteredData.length === 0 && (
                     <tr>
                        <td colSpan={6} className="px-8 py-24 text-center">
                           <div className="flex flex-col items-center opacity-30">
                              <CheckCircle2 size={48} className="text-slate-200 mb-4" />
                              <p className="text-sm font-black uppercase tracking-widest">No stock items found</p>
                           </div>
                        </td>
                     </tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}
