'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users2, 
  Search, 
  RefreshCcw, 
  ChevronRight, 
  Mail, 
  Phone, 
  Calendar, 
  History,
  TrendingUp,
  CreditCard
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/shared/page-header';

interface GuestRecord {
  id: string;
  name: string;
  mobile: string | null;
  email: string | null;
  totalVisits: number;
  totalSpend: number;
}

export default function GuestHistoryReportPage() {
  const [data, setData] = useState<GuestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchGuests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<GuestRecord[]>('/api/reports/guests');
      setData(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error('Failed to fetch guest history:', err);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGuests();
  }, [fetchGuests]);

  const filteredData = data.filter(g => 
    g.name.toLowerCase().includes(search.toLowerCase()) || 
    g.mobile?.includes(search) || 
    g.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <PageHeader
        title="Guest Spending History"
        subtitle="Visit patterns and lifetime value analysis"
        showBack
        backUrl="/reports"
        actions={
          <div className="flex items-center gap-3">
             <div className="relative group min-w-[300px]">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input 
                   type="text" 
                   placeholder="Search name, mobile or email..." 
                   value={search}
                   onChange={e => setSearch(e.target.value)}
                   className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-xs font-bold outline-none focus:border-indigo-500 transition-all"
                />
             </div>
             <Button onClick={fetchGuests} variant="secondary" className="rounded-2xl w-12 h-12 p-0">
                <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
             </Button>
          </div>
        }
      />

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {loading ? (
            Array(6).fill(0).map((_, i) => (
              <div key={i} className="h-64 bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-slate-700 animate-pulse" />
            ))
         ) : (
            filteredData.map((guest) => (
               <div key={guest.id} className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 border border-slate-100 dark:border-slate-700 hover:border-indigo-500/30 transition-all shadow-sm group">
                  <div className="flex items-start justify-between mb-6">
                     <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 font-black text-xl">
                        {guest.name.charAt(0)}
                     </div>
                     <div className="bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 rounded-xl border border-emerald-100 dark:border-emerald-800">
                        <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest text-center">Lifetime Spend</p>
                        <p className="text-lg font-black text-emerald-700 dark:text-emerald-400">₹{guest.totalSpend.toLocaleString()}</p>
                     </div>
                  </div>

                  <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mb-4 group-hover:text-indigo-600 transition-colors">
                     {guest.name}
                  </h3>

                  <div className="space-y-3 mb-6">
                     <div className="flex items-center gap-3 text-slate-500">
                        <Phone size={14} className="text-slate-400" />
                        <span className="text-xs font-bold">{guest.mobile || 'No Mobile'}</span>
                     </div>
                     <div className="flex items-center gap-3 text-slate-500">
                        <Mail size={14} className="text-slate-400" />
                        <span className="text-xs font-bold truncate max-w-[150px]">{guest.email || 'No Email'}</span>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50 dark:border-slate-700">
                     <div className="text-center">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Visits</p>
                        <div className="flex items-center justify-center gap-1.5 text-slate-700 dark:text-slate-300">
                           <History size={14} className="text-indigo-400" />
                           <span className="text-sm font-black">{guest.totalVisits}</span>
                        </div>
                     </div>
                     <div className="text-center">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                        <div className="flex items-center justify-center gap-1.5">
                           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                           <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Active</span>
                        </div>
                     </div>
                  </div>
               </div>
            ))
         )}
      </div>

      {filteredData.length === 0 && !loading && (
         <div className="bg-white dark:bg-slate-800 p-20 rounded-[3rem] border border-slate-100 dark:border-slate-700 text-center">
            <Users2 size={64} className="text-slate-100 mx-auto mb-6" />
            <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest">No matching guests found</h3>
            <p className="text-xs text-slate-500 font-bold mt-2">Try adjusting your search terms or filters</p>
         </div>
      )}
    </div>
  );
}
