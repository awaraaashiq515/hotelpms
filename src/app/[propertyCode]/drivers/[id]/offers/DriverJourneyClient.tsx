'use client';

import React, { useState, useEffect, use } from 'react';
import { 
  Trophy, 
  Target, 
  History, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  Receipt, 
  TrendingUp, 
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Package,
  Wallet
} from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { format } from 'date-fns';

interface DriverData {
  id: string;
  name: string;
  phone: string;
  vehicleNumber: string;
  vehicleType: string;
  referralCount: number;
  totalRevenue: number;
  offerProgresses: any[];
  offerHistories: any[];
  rewardPayouts: any[];
  offerAuditLogs: any[];
}

export default function DriverJourneyClient({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise);
  const [data, setData] = useState<DriverData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDriverData = async () => {
    setLoading(true);
    try {
      const resp = await fetch(`/api/drivers/${params.id}/offers`);
      const result = await resp.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch journey data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDriverData();
  }, [params.id]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <div className="w-12 h-12 border-4 border-pos-primary border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-400 font-bold tracking-widest text-[10px] uppercase">Loading...</p>
    </div>
  );

  if (!data) return <div className="p-8 text-center bg-red-50 text-red-600 rounded-3xl border border-red-100 uppercase font-black tracking-widest text-xs">Driver Not Found</div>;

  const activeProgress = data.offerProgresses.find(p => p.status === 'ACTIVE') || null;
  const totalRides = data.offerHistories.reduce((acc, h) => acc + h.ridesAtCompletion, 0) + (activeProgress?.completedRides || 0);
  const totalRewards = data.rewardPayouts.reduce((acc, p) => acc + p.amount, 0);

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-700">
      <PageHeader 
        title={`${data.name}'s Progress`}
        subtitle="See driver progress, rewards, and tracking info"
        showBack
        backUrl="/drivers/offers"
      />

      {/* Driver Summary Layer */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 bg-white/60 backdrop-blur-3xl border border-white rounded-[32px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-pos-primary to-pos-primary-dark flex items-center justify-center text-white text-3xl font-black shadow-2xl shadow-pos-primary/20 mb-4 border-4 border-white">
              {data.name.substring(0,2).toUpperCase()}
            </div>
            <h3 className="text-xl font-black text-slate-800 tracking-tighter">{data.name}</h3>
            <p className="text-[11px] font-bold text-slate-400 tracking-widest uppercase mt-1">{data.phone}</p>
            
            <div className="mt-6 w-full space-y-3">
              <div className="bg-slate-50 rounded-2xl p-3 flex items-center justify-between border border-slate-100">
                 <span className="text-[10px] font-black uppercase text-slate-400">Total People Brought</span>
                 <span className="text-sm font-black text-pos-primary">{totalRides}</span>
              </div>
              <div className="bg-slate-50 rounded-2xl p-3 flex items-center justify-between border border-slate-100">
                 <span className="text-[10px] font-black uppercase text-slate-400">Referrals</span>
                 <span className="text-sm font-black text-emerald-600">{data.referralCount}</span>
              </div>
              <div className="bg-emerald-50 rounded-2xl p-3 flex items-center justify-between border border-emerald-100">
                 <span className="text-[10px] font-black uppercase text-emerald-600/60 tracking-widest">Total Earned</span>
                 <span className="text-sm font-black text-emerald-700 tracking-tighter">₹{totalRewards.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-3 space-y-6">
          {/* Active Target Journy Map */}
          <div className="bg-white/80 backdrop-blur-3xl border border-white rounded-[32px] p-8 shadow-[0_8px_40px_rgb(0,0,0,0.05)] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-pos-primary/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:scale-125 transition-transform duration-1000"></div>
            
            <div className="flex items-center justify-between mb-8 relative z-10">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-pos-primary text-white flex items-center justify-center shadow-lg shadow-pos-primary/10">
                     <Target size={20} />
                  </div>
                  <div>
                     <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Current Target</h4>
                     <h2 className="text-xl font-black text-slate-800 tracking-tight">{activeProgress ? activeProgress.offer.title : 'No Active Reward'}</h2>
                  </div>
               </div>
               {activeProgress && (
                  <div className="flex flex-col items-end">
                     <span className="text-[10px] font-black text-pos-primary tracking-widest bg-pos-primary/5 px-3 py-1 rounded-full uppercase border border-pos-primary/10">
                        {activeProgress.progressPercent.toFixed(0)}% Done
                     </span>
                  </div>
               )}
            </div>

            {activeProgress ? (
              <div className="relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <div className="p-6 rounded-[24px] bg-slate-50 border border-slate-100 flex items-center gap-6 group/item hover:bg-white transition-all shadow-inner hover:shadow-xl hover:shadow-slate-200">
                    <div className="w-14 h-14 rounded-2xl bg-white text-pos-primary flex items-center justify-center shadow-sm border border-slate-100 group-hover/item:scale-110 transition-transform">
                      <TrendingUp size={24} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">People Brought</p>
                      <p className="text-2xl font-black text-pos-primary-dark tracking-tighter mt-1">
                         {activeProgress.completedRides} <span className="text-slate-300 text-lg">/ {activeProgress.offer.targetRides}</span>
                      </p>
                    </div>
                  </div>
                  <div className="p-6 rounded-[24px] bg-slate-50 border border-slate-100 flex items-center gap-6 group/item hover:bg-white transition-all shadow-inner hover:shadow-xl hover:shadow-slate-200">
                    <div className="w-14 h-14 rounded-2xl bg-white text-emerald-600 flex items-center justify-center shadow-sm border border-slate-100 group-hover/item:scale-110 transition-transform">
                      <MapPin size={24} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Referrals</p>
                      <p className="text-2xl font-black text-emerald-700 tracking-tighter mt-1">
                         {activeProgress.completedReferrals} <span className="text-slate-300 text-lg">/ {activeProgress.offer.targetReferrals}</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-100/50 p-6 rounded-[24px] border border-slate-200/50">
                   <div className="flex justify-between items-center mb-6">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <Clock size={12} /> Target Started on {format(new Date(activeProgress.startedAt), 'PP')}
                      </p>
                      <span className="text-[10px] bg-white px-3 py-1 rounded-full text-slate-800 font-black border border-slate-200 shadow-sm">
                         Reward: {activeProgress.offer.rewardType === 'GIFT' ? activeProgress.offer.rewardItem : `₹${activeProgress.offer.rewardValue}`}
                      </span>
                   </div>
                   
                   <div className="relative pt-6 pb-2">
                      <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 -translate-y-1/2 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-pos-primary to-pos-primary-dark transition-all duration-[2s] rounded-full shadow-[0_0_10px_rgb(232,160,160,0.5)]"
                          style={{ width: `${Math.min(activeProgress.progressPercent, 100)}%` }}
                        />
                      </div>
                      
                      <div className="flex justify-between relative z-10">
                        {[0, 25, 50, 75, 100].map(step => (
                          <div key={step} className="flex flex-col items-center">
                            <div className={`w-4 h-4 rounded-full border-2 transition-all duration-1000 ${
                              activeProgress.progressPercent >= step ? 'bg-indigo-500 border-white scale-125 shadow-lg shadow-indigo-300' : 'bg-white border-slate-300'
                            }`} />
                            <span className={`text-[10px] font-bold mt-2 ${activeProgress.progressPercent >= step ? 'text-indigo-600' : 'text-slate-400'}`}>
                              {step}%
                            </span>
                          </div>
                        ))}
                      </div>
                   </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center flex flex-col items-center opacity-50 relative z-10">
                 <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
                    <Target size={32} />
                 </div>
                 <p className="font-black text-slate-400 uppercase tracking-widest text-xs">No active rewards assigned</p>
                 <Link href="/drivers/offers" className="mt-4 text-[10px] font-black text-pos-primary hover:underline tracking-widest">ADD NEW REWARD NOW <ChevronRight size={12} className="inline" /></Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* History Log */}
        <div className="space-y-4">
           <div className="flex items-center gap-3 ml-2">
              <History size={18} className="text-slate-400" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Reward History</h3>
           </div>
           
           <div className="bg-white rounded-[32px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)] overflow-hidden">
              {data.offerHistories.length === 0 ? (
                 <div className="p-12 text-center text-slate-300 italic font-medium">No completed journey history found</div>
              ) : (
                <div className="divide-y divide-slate-100">
                   {data.offerHistories.map((history, idx) => (
                      <div key={idx} className="p-6 hover:bg-slate-50 transition-colors group">
                         <div className="flex justify-between items-start mb-4">
                            <div className="flex gap-3 items-center">
                               <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                  <CheckCircle2 size={20} />
                               </div>
                               <div>
                                  <h4 className="text-sm font-black text-slate-800 uppercase group-hover:text-emerald-700 transition-colors uppercase">{history.offer.title}</h4>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">COMPLETED {format(new Date(history.completedAt), 'PPp')}</p>
                               </div>
                            </div>
                            <div className="text-right">
                               <p className="text-sm font-black text-emerald-600">
                                  {history.offer.rewardType === 'GIFT' ? history.rewardItemEarned : `₹${history.rewardEarned}`}
                               </p>
                               <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Paid Out</span>
                            </div>
                         </div>
                         <div className="flex gap-2 pl-13">
                            <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-bold">PEOPLE: {history.ridesAtCompletion}</span>
                            <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-bold">REF: {history.referralsAtCompletion}</span>
                         </div>
                      </div>
                   ))}
                </div>
              )}
           </div>
        </div>

        {/* Audit & Logs */}
        <div className="space-y-4">
           <div className="flex items-center gap-3 ml-2">
              <ShieldCheck size={18} className="text-slate-400" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">System Logs</h3>
           </div>
           
           <div className="bg-slate-900 rounded-[32px] p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl"></div>
              
              <div className="space-y-6 relative z-10">
                 {data.offerAuditLogs.length === 0 ? (
                    <div className="text-center text-slate-600 font-medium py-10">No system events logged</div>
                 ) : (
                    data.offerAuditLogs.map((log, idx) => {
                       let icon = <Clock size={16} />;
                       let colorClass = "text-slate-400 bg-slate-800";
                       
                       if (log.actionType.includes('COMPLETED')) { icon = <CheckCircle2 size={16} />; colorClass = "text-emerald-400 bg-emerald-500/10"; }
                       if (log.actionType.includes('ASSIGN')) { icon = <Package size={16} />; colorClass = "text-pos-primary bg-pos-primary/10"; }
                       if (log.actionType.includes('PAYOUT')) { icon = <Wallet size={16} />; colorClass = "text-amber-400 bg-amber-500/10"; }

                       return (
                          <div key={idx} className="flex gap-4">
                             <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                                {icon}
                             </div>
                             <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                   <h5 className="text-[11px] font-black text-slate-200 uppercase tracking-wider truncate mr-2">{log.actionType.replace(/_/g, ' ')}</h5>
                                   <span className="text-[9px] font-bold text-slate-600 whitespace-nowrap">{format(new Date(log.createdAt), 'HH:mm')}</span>
                                </div>
                                <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">{log.note || `Action logged with value ${log.newValue || '-'}`}</p>
                             </div>
                          </div>
                       );
                    })
                 )}
                 
                 <div className="pt-4 border-t border-slate-800">
                    <p className="text-[9px] text-center font-black text-slate-600 tracking-[0.2em] uppercase">End of Secure Log Feed</p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
