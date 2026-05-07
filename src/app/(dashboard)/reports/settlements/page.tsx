'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  CreditCard, 
  Calendar, 
  RefreshCcw, 
  ArrowUpRight, 
  Wallet, 
  Banknote, 
  ChevronRight,
  Download,
  Search,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/shared/page-header';
import { exportToExcel, exportToPDF, exportToCSV } from '@/lib/export-utils';

interface Settlement {
  id: string;
  settlementNo: string;
  settlementDate: string;
  grossAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: string;
  paymentModeId: string | null;
}

interface Summary {
  totalGross: number;
  totalPaid: number;
  totalBalance: number;
  count: number;
}

interface ModeSummary {
  name: string;
  count: number;
  total: number;
}

interface SettlementReportData {
  summary: Summary;
  byMode: ModeSummary[];
  settlements: Settlement[];
}

export default function SettlementsReportPage() {
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SettlementReportData | null>(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<SettlementReportData>('/api/reports/settlements', {
        params: { startDate, endDate }
      });
      setData(res);
    } catch (err) {
      console.error('Failed to fetch settlements:', err);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchReport();
  }, []);

  const handleExcelExport = () => {
    if (!data) return;
    exportToExcel(
      data.settlements.map(s => ({
        'Settlement No': s.settlementNo,
        'Date': new Date(s.settlementDate).toLocaleString('en-IN'),
        'Gross Amount (₹)': s.grossAmount.toFixed(2),
        'Paid Amount (₹)': s.paidAmount.toFixed(2),
        'Balance (₹)': s.balanceAmount.toFixed(2),
        'Status': s.status,
      })),
      `settlements-${startDate}-to-${endDate}`,
      'Settlements'
    );
  };

  const handlePDFExport = () => {
    if (!data) return;
    exportToPDF(
      ['Settlement No', 'Date', 'Gross (₹)', 'Paid (₹)', 'Balance (₹)', 'Status'],
      data.settlements.map(s => [
        s.settlementNo,
        new Date(s.settlementDate).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
        `₹${s.grossAmount.toFixed(2)}`,
        `₹${s.paidAmount.toFixed(2)}`,
        `₹${s.balanceAmount.toFixed(2)}`,
        s.status,
      ]),
      `settlements-${startDate}-to-${endDate}`,
      'Settlement Report',
      `Period: ${startDate} → ${endDate}`
    );
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <PageHeader
        title="Settlement Report"
        subtitle="Payment mode breakdown and closing analysis"
        showBack
        backUrl="/reports"
        actions={
          <div className="flex bg-slate-50 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-800">
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
          {/* Top Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
             {[
                { label: 'Settlements', value: data.summary.count, icon: <ArrowUpRight />, color: 'text-blue-500' },
                { label: 'Gross Amount', value: `₹${data.summary.totalGross.toLocaleString()}`, icon: <Wallet />, color: 'text-slate-900 dark:text-white font-black' },
                { label: 'Paid Amount', value: `₹${data.summary.totalPaid.toLocaleString()}`, icon: <Banknote />, color: 'text-emerald-600 font-black' },
                { label: 'Balance Ref.', value: `₹${data.summary.totalBalance.toLocaleString()}`, icon: <ChevronRight />, color: data.summary.totalBalance > 0 ? 'text-rose-500 font-black' : 'text-slate-400 font-black' },
             ].map((s, i) => (
                <div key={i} className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm transition-transform hover:-translate-y-1">
                   <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl text-slate-400">{s.icon}</div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
                   </div>
                   <p className={`text-2xl ${s.color}`}>{s.value}</p>
                </div>
             ))}
          </div>

          {/* Mode Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             {data.byMode.map((m, i) => (
                <div key={i} className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border-l-4 border-l-emerald-500 border border-slate-100 dark:border-slate-700 shadow-sm">
                   <div className="flex justify-between items-start mb-2">
                      <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{m.name}</h4>
                      <Badge variant="success" className="text-[9px] uppercase px-2 py-0.5">{m.count} TRNS</Badge>
                   </div>
                   <p className="text-2xl font-black text-emerald-600">₹{m.total.toLocaleString()}</p>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Successfully Settled</p>
                </div>
             ))}
          </div>

          {/* Main Table */}
          <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
             <div className="p-6 border-b border-slate-50 dark:border-slate-700 flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Historical Ledger</h3>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={handleExcelExport}
                    disabled={!data}
                    className="rounded-xl gap-2 font-black text-[10px] uppercase h-10 px-4 border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400"
                  >
                    <FileSpreadsheet size={14} /> Excel
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handlePDFExport}
                    disabled={!data}
                    className="rounded-xl gap-2 font-black text-[10px] uppercase h-10 px-4 border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-400"
                  >
                    <FileText size={14} /> PDF
                  </Button>
                </div>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full">
                   <thead>
                      <tr className="bg-slate-50/50 dark:bg-slate-900/50">
                         <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Date / Time</th>
                         <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Settlement #</th>
                         <th className="px-6 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Gross</th>
                         <th className="px-6 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest text-emerald-600">Paid</th>
                         <th className="px-6 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest text-rose-500">Balance</th>
                         <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                      </tr>
                   </thead>
                   <tbody>
                      {data.settlements.map((s) => (
                         <tr key={s.id} className="border-t border-slate-50 dark:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                            <td className="px-8 py-5 text-xs font-bold text-slate-600 dark:text-slate-400">
                               {new Date(s.settlementDate).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="px-6 py-5 text-sm font-black text-slate-900 dark:text-white font-mono">{s.settlementNo}</td>
                            <td className="px-6 py-5 text-right text-xs font-bold text-slate-600 dark:text-slate-400">₹{s.grossAmount.toFixed(2)}</td>
                            <td className="px-6 py-5 text-right text-sm font-black text-emerald-600">₹{s.paidAmount.toFixed(2)}</td>
                            <td className="px-6 py-5 text-right text-sm font-black text-rose-500">₹{s.balanceAmount.toFixed(2)}</td>
                            <td className="px-8 py-5 text-right">
                               <Badge variant={s.status === 'SETTLED' ? 'success' : 'warning'} className="uppercase text-[9px] font-black px-3 py-1">
                                  {s.status}
                               </Badge>
                            </td>
                         </tr>
                      ))}
                      {data.settlements.length === 0 && (
                         <tr>
                            <td colSpan={6} className="px-8 py-24 text-center">
                               <div className="flex flex-col items-center opacity-30">
                                  <Search size={48} className="text-slate-200 mb-4" />
                                  <p className="text-sm font-black uppercase tracking-widest">No settlement traces found</p>
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
            <div className="animate-pulse flex flex-col items-center gap-4">
               <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-2xl" />
               <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Awaiting synchronization...</p>
            </div>
        </div>
      )}
    </div>
  );
}
