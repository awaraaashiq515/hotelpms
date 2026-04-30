'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Building2, 
  Calendar, 
  RefreshCcw, 
  Calculator, 
  FileText, 
  Download,
  Percent,
  TrendingDown,
  ChevronRight
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/shared/page-header';

interface TaxSummary {
  totalTaxable: number;
  totalTax: number;
  combinedTotal: number;
}

interface TaxRecord {
  orderNo?: string;
  invoiceNo?: string;
  subtotal: number;
  taxAmount: number;
  grandTotal?: number;
  totalAmount?: number;
  createdAt?: string;
  invoiceDate?: string;
}

interface TaxReportData {
  summary: TaxSummary;
  posOrders: TaxRecord[];
  invoices: TaxRecord[];
}

export default function TaxReportPage() {
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TaxReportData | null>(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<TaxReportData>('/api/reports/tax', {
        params: { startDate, endDate }
      });
      setData(res);
    } catch (err) {
      console.error('Failed to fetch tax report:', err);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchReport();
  }, []);

  return (
    <div className="space-y-8 pb-10">
      <PageHeader
        title="Tax & Statutory Report"
        subtitle="GST and other tax computations for filing"
        showBack
        backUrl="/reports"
        actions={
          <div className="flex bg-white dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm shadow-slate-100">
             <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent text-xs font-black text-slate-700 dark:text-slate-300 outline-none p-2" />
             <span className="p-2 text-slate-300">→</span>
             <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent text-xs font-black text-slate-700 dark:text-slate-300 outline-none p-2" />
             <Button onClick={fetchReport} loading={loading} className="bg-pos-primary rounded-xl px-4 py-2 ml-2">
                <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
             </Button>
          </div>
        }
      />

      {data ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-all" />
               <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl text-blue-500"><Calculator size={20} /></div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Taxable Amount</p>
               </div>
               <p className="text-3xl font-black text-slate-900 dark:text-white">₹{data.summary.totalTaxable.toLocaleString()}</p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-all" />
               <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl text-emerald-500"><Percent size={20} /></div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Tax (GST)</p>
               </div>
               <p className="text-3xl font-black text-emerald-600">₹{data.summary.totalTax.toLocaleString()}</p>
            </div>

            <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 shadow-xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-24 h-24 bg-pos-primary/10 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-all" />
               <div className="flex items-center gap-3 mb-6 relative z-10">
                  <div className="p-3 bg-white/5 rounded-2xl text-pos-primary"><TrendingDown size={20} /></div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Gross Combined</p>
               </div>
               <p className="text-3xl font-black text-white relative z-10">₹{data.summary.combinedTotal.toLocaleString()}</p>
            </div>
          </div>

          {/* Records Table */}
          <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
             <div className="p-8 border-b border-slate-50 dark:border-slate-700 flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Statutory Ledger</h3>
                <Button variant="outline" className="rounded-xl gap-2 font-black text-[10px] uppercase h-[46px] px-6 border-slate-200 dark:border-slate-700">
                    <Download size={14} /> Export statutory Excel
                </Button>
             </div>
             
             <div className="overflow-x-auto">
                <table className="w-full">
                   <thead>
                      <tr className="bg-slate-50/50 dark:bg-slate-900/50">
                         <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Type / Date</th>
                         <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Ref No.</th>
                         <th className="px-6 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Taxable</th>
                         <th className="px-6 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest text-emerald-500">Tax</th>
                         <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest text-pos-primary">Total</th>
                      </tr>
                   </thead>
                   <tbody>
                      {/* POS Orders */}
                      {data.posOrders.map((o, i) => (
                         <tr key={`pos-${i}`} className="border-t border-slate-50 dark:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                            <td className="px-8 py-5">
                               <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">POS Order</p>
                               <p className="text-[10px] font-bold text-slate-400 mt-0.5">{new Date(o.createdAt!).toLocaleDateString('en-IN')}</p>
                            </td>
                            <td className="px-6 py-5 text-xs font-black text-slate-700 dark:text-white font-mono">{o.orderNo}</td>
                            <td className="px-6 py-5 text-right text-sm font-bold text-slate-400">₹{o.subtotal.toFixed(2)}</td>
                            <td className="px-6 py-5 text-right text-sm font-black text-emerald-600">₹{o.taxAmount.toFixed(2)}</td>
                            <td className="px-8 py-5 text-right text-sm font-black text-pos-primary">₹{(o.grandTotal || 0).toFixed(2)}</td>
                         </tr>
                      ))}

                      {/* Regular Invoices */}
                      {data.invoices.map((v, i) => (
                         <tr key={`inv-${i}`} className="border-t border-slate-50 dark:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                            <td className="px-8 py-5">
                               <p className="text-[10px] font-black text-violet-500 uppercase tracking-widest">Invoice</p>
                               <p className="text-[10px] font-bold text-slate-400 mt-0.5">{new Date(v.invoiceDate!).toLocaleDateString('en-IN')}</p>
                            </td>
                            <td className="px-6 py-5 text-xs font-black text-slate-700 dark:text-white font-mono">{v.invoiceNo}</td>
                            <td className="px-6 py-5 text-right text-sm font-bold text-slate-400">₹{v.subtotal.toFixed(2)}</td>
                            <td className="px-6 py-5 text-right text-sm font-black text-emerald-600">₹{v.taxAmount.toFixed(2)}</td>
                            <td className="px-8 py-5 text-right text-sm font-black text-pos-primary">₹{(v.totalAmount || 0).toFixed(2)}</td>
                         </tr>
                      ))}

                      {data.posOrders.length === 0 && data.invoices.length === 0 && (
                        <tr>
                           <td colSpan={5} className="px-8 py-24 text-center">
                              <div className="flex flex-col items-center opacity-30">
                                 <FileText size={48} className="text-slate-200 mb-4" />
                                 <p className="text-sm font-black uppercase tracking-widest">No taxable records found for this period</p>
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
               <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Synchronizing statutory data...</p>
            </div>
        </div>
      )}
    </div>
  );
}
