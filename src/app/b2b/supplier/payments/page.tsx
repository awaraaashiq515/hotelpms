'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight, 
  Calendar,
  Download,
  CreditCard,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';

export default function SupplierPaymentsPage() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    pendingSettlements: 0,
    completedSettlements: 0
  });

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Settlements & Payments" 
        description="Track your revenue and financial transactions"
        actions={
          <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all shadow-sm">
            <Download size={16} /> Download Report
          </button>
        }
      />

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-emerald-600 text-white relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
             <DollarSign size={80} />
           </div>
           <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-2">Total Revenue</p>
           <h3 className="text-3xl font-black mb-4">₹0.00</h3>
           <div className="flex items-center gap-1.5 text-[10px] font-bold bg-white/20 w-fit px-3 py-1 rounded-full">
             <ArrowUpRight size={12} /> +0% from last month
           </div>
        </Card>

        <Card className="p-6 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Pending Settlements</p>
           <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-4">₹0.00</h3>
           <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
             <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Processing</span>
           </div>
        </Card>

        <Card className="p-6 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Payout Method</p>
           <h3 className="text-xl font-black text-slate-900 dark:text-white mb-4 italic">Bank Transfer</h3>
           <div className="flex items-center gap-2 text-emerald-600">
             <CheckCircle2 size={14} />
             <span className="text-[10px] font-bold uppercase tracking-widest">Verified Account</span>
           </div>
        </Card>
      </div>

      {/* Transaction History */}
      <Card className="overflow-hidden border-slate-100 dark:border-slate-800">
        <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
           <h3 className="font-black text-sm uppercase tracking-tight flex items-center gap-2">
             <CreditCard size={18} className="text-emerald-500" /> Transaction History
           </h3>
           <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
             <Calendar size={14} /> Last 30 Days
           </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Order ID</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Restaurant</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Clock size={32} className="text-slate-200" />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No recent transactions found</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
