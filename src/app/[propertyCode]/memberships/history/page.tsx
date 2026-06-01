'use client';

import React, { useState, useEffect } from 'react';
import { Search, History, TrendingUp, Calendar, CreditCard, ChevronRight } from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { format } from 'date-fns';

interface UsageRecord {
  id: string;
  discountApplied: number;
  usedAt: string;
  membershipCard: {
    cardNumber: string;
    membershipPlan: { name: string };
    guest: { firstName: string; lastName: string } | null;
  };
}

export default function MembershipHistoryPage() {
  const { theme } = useTheme();
  const [history, setHistory] = useState<UsageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    // We'll add an API endpoint for this later or use cards API with usage include
    // For now, let's assume we have an endpoint /api/memberships/usage
    fetch('/api/memberships/usage')
      .then(res => res.json())
      .then(data => {
        if (data.success) setHistory(data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredHistory = history.filter(h => 
    h.membershipCard.cardNumber.toLowerCase().includes(search.toLowerCase()) ||
    h.membershipCard.guest?.firstName.toLowerCase().includes(search.toLowerCase())
  );

  const totalDiscount = history.reduce((acc, h) => acc + h.discountApplied, 0);

  return (
    <div className={`p-6 lg:p-10 min-h-screen ${theme === 'dark' ? 'bg-[#0f172a]' : 'bg-slate-50/50'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-5">
            <div className={`w-14 h-14 rounded-[1.25rem] flex items-center justify-center shadow-lg transition-all ${theme === 'dark' ? 'bg-indigo-500/20 text-indigo-400 shadow-indigo-500/10' : 'bg-indigo-600 text-white shadow-indigo-200'}`}>
              <History size={28} />
            </div>
            <div>
              <h1 className={`text-2xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Usage History</h1>
              <p className={`text-sm font-bold mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Monitor how memberships are being used in your POS</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <StatCard 
            label="Total Discount Given" 
            value={`₹${totalDiscount.toLocaleString()}`} 
            icon={<TrendingUp size={24} className="text-emerald-500" />} 
            theme={theme}
          />
          <StatCard 
            label="Total Transactions" 
            value={history.length.toString()} 
            icon={<CreditCard size={24} className="text-indigo-500" />} 
            theme={theme}
          />
          <StatCard 
            label="Average Discount" 
            value={`₹${history.length ? (totalDiscount / history.length).toFixed(0) : 0}`} 
            icon={<Calendar size={24} className="text-amber-500" />} 
            theme={theme}
          />
        </div>

        {/* Search */}
        <div className={`mb-8 p-4 rounded-[2rem] ${theme === 'dark' ? 'bg-slate-900/50' : 'bg-white shadow-sm'}`}>
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Filter by card number or guest..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={`w-full pl-12 pr-6 py-4 rounded-2xl border outline-none transition-all font-bold ${theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white focus:border-indigo-500' : 'bg-slate-50 border-slate-100 text-slate-900 focus:border-indigo-600 focus:bg-white'}`}
            />
          </div>
        </div>

        {/* List */}
        <div className="space-y-4">
           {loading ? (
             [1,2,3].map(i => <div key={i} className="h-20 rounded-3xl animate-pulse bg-slate-200 dark:bg-slate-800" />)
           ) : filteredHistory.length === 0 ? (
             <div className="text-center py-20 text-slate-400 font-bold uppercase tracking-widest">No usage history found</div>
           ) : filteredHistory.map((record) => (
             <div 
               key={record.id}
               className={`flex items-center justify-between p-6 rounded-[2rem] transition-all hover:translate-x-2 ${theme === 'dark' ? 'bg-slate-900 border border-slate-800 hover:border-indigo-500/30' : 'bg-white border border-slate-100 hover:border-indigo-100 shadow-sm'}`}
             >
               <div className="flex items-center gap-6">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xs ${theme === 'dark' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                     {record.membershipCard.cardNumber.slice(-4)}
                  </div>
                  <div>
                     <p className="text-sm font-black tracking-tight">{record.membershipCard.cardNumber}</p>
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{record.membershipCard.guest?.firstName || 'Walk-in Guest'} · {record.membershipCard.membershipPlan.name}</p>
                  </div>
               </div>
               <div className="flex items-center gap-12">
                  <div className="text-right">
                     <p className="text-xs font-black text-emerald-500">-₹{record.discountApplied.toFixed(0)}</p>
                     <p className="text-[10px] font-bold text-slate-500">Discount Applied</p>
                  </div>
                  <div className="text-right min-w-[100px]">
                     <p className="text-xs font-black">{format(new Date(record.usedAt), 'dd MMM, HH:mm')}</p>
                     <p className="text-[10px] font-bold text-slate-500">Usage Date</p>
                  </div>
                  <ChevronRight size={20} className="text-slate-300" />
               </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, theme }: any) {
  return (
    <div className={`p-8 rounded-[2.5rem] flex items-center justify-between transition-all ${theme === 'dark' ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-slate-100 shadow-xl shadow-slate-200/40'}`}>
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">{label}</p>
        <p className="text-3xl font-black tracking-tight">{value}</p>
      </div>
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-50'}`}>
        {icon}
      </div>
    </div>
  );
}
