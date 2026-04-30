'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShieldCheck, 
  Search, 
  RefreshCcw, 
  ChevronRight, 
  Filter, 
  Activity, 
  Clock, 
  User,
  Database,
  ArrowRight
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/shared/page-header';

interface AuditLog {
  id: string;
  moduleName: string;
  actionType: string;
  recordId: string;
  createdAt: string;
  user: {
    fullName: string;
    email: string;
  } | null;
}

export default function AuditLogReportPage() {
  const [data, setData] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [module, setModule] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<AuditLog[]>('/api/reports/audit', {
        params: { module }
      });
      setData(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [module]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <PageHeader
        title="System Audit Log"
        subtitle="Real-time verification of user activities"
        showBack
        backUrl="/reports"
        actions={
          <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/5 backdrop-blur-sm">
             <select 
                value={module} 
                onChange={e => setModule(e.target.value)}
                className="bg-transparent text-white text-xs font-black uppercase tracking-widest px-4 outline-none border-none cursor-pointer"
             >
                <option value="" className="bg-slate-900 text-white">All Modules</option>
                <option value="POS" className="bg-slate-900 text-white">POS Orders</option>
                <option value="INVENTORY" className="bg-slate-900 text-white">Inventory</option>
                <option value="BILLING" className="bg-slate-900 text-white">Billing</option>
                <option value="SETUP" className="bg-slate-900 text-white">Setup</option>
             </select>
             <div className="w-px h-8 bg-white/10" />
             <Button onClick={fetchLogs} loading={loading} className="bg-pos-primary hover:bg-pos-primary-dark rounded-xl px-4 h-10 w-10 p-0 transition-transform hover:scale-110">
                <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
             </Button>
          </div>
        }
        className="bg-slate-900 p-10 rounded-[3rem] border border-white/10 shadow-2xl"
        titleClassName="text-white"
        subtitleClassName="text-slate-400"
      />

      {/* Main List */}
      <div className="space-y-4">
         {loading ? (
            Array(5).fill(0).map((_, i) => (
               <div key={i} className="h-24 bg-white dark:bg-slate-800 rounded-3xl animate-pulse border border-slate-100 dark:border-slate-700" />
            ))
         ) : (
            data.map((log) => (
               <div key={log.id} className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 hover:border-pos-primary/30 transition-all flex flex-col md:flex-row md:items-center gap-6 group hover:translate-x-2">
                  <div className="flex items-center gap-5 md:w-1/3">
                     <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400 group-hover:text-pos-primary transition-colors">
                        <Activity size={20} />
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-pos-primary uppercase tracking-[0.2em] mb-1">{log.moduleName}</p>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{log.actionType}</h4>
                     </div>
                  </div>

                  <div className="flex items-center gap-10 flex-1">
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400">
                           <User size={14} />
                        </div>
                        <div>
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Executor</p>
                           <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                              {log.user ? log.user.fullName : 'System Agent'}
                           </p>
                        </div>
                     </div>

                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400">
                           <Database size={14} />
                        </div>
                        <div>
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Object ID</p>
                           <p className="text-xs font-mono font-bold text-slate-400">{log.recordId.substring(0, 12)}...</p>
                        </div>
                     </div>
                  </div>

                  <div className="flex items-center gap-4 text-right">
                     <div className="hidden md:block">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Timestamp</p>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 justify-end">
                           <Clock size={12} className="text-slate-300" />
                           {new Date(log.createdAt).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </p>
                     </div>
                     <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl text-slate-300 group-hover:bg-pos-primary group-hover:text-white transition-all">
                        <ChevronRight size={16} />
                     </div>
                  </div>
               </div>
            ))
         )}
      </div>

      {data.length === 0 && !loading && (
         <div className="bg-white dark:bg-slate-800 p-24 rounded-[3rem] border border-slate-100 dark:border-slate-700 text-center">
            <ShieldCheck size={64} className="text-slate-100 mx-auto mb-6" />
            <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest">No audit trails detected</h3>
            <p className="text-xs text-slate-500 font-bold mt-2">All system activities are cleanly accounted for</p>
         </div>
      )}
    </div>
  );
}
