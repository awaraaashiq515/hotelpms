'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Trophy, 
  RefreshCw, 
  Plus, 
  Percent, 
  Gift, 
  Compass, 
  Zap, 
  Edit, 
  Trash2, 
  Activity,
  Award,
  ChevronRight,
  TrendingUp,
  Search,
  LayoutDashboard,
  Users,
  Target,
  Rocket,
  ShieldCheck,
  CalendarDays,
  Flame,
  ArrowUpRight
} from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { SearchToolbar } from '@/components/shared/search-toolbar';
import { DataTable } from '@/components/shared/data-table';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import Link from 'next/link';

// Types
export interface DriverProgress {
  id: string;
  name: string;
  phone: string;
  status: string;
  activeOffer: string;
  offerLevel: string;
  completedRides: number;
  referredCustomers: number;
  progressPercent: number;
  completedOffersCount: number;
}

function DriverOffersContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tracker' | 'catalog'>(
    (searchParams.get('tab') as any) || 'dashboard'
  );
  
  const [data, setData] = useState<DriverProgress[]>([]);
  const [offersList, setOffersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [propertyId, setPropertyId] = useState<string | null>(null);
  
  // Modal states
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(searchParams.get('action') === 'new-slab');
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);
  
  // Form states
  const [offerForm, setOfferForm] = useState({ 
    title: '', 
    offerType: 'RIDES', 
    targetRides: 0, 
    targetReferrals: 0, 
    rewardValue: 0, 
    rewardType: 'CASH', 
    rewardItem: '', 
    resetType: 'SAME_OFFER',
    priority: 1,
    nextOfferId: ''
  });
  const [assignForm, setAssignForm] = useState({ offerId: '' });

  const fetchProgress = async (pid?: string) => {
    const activePid = pid || propertyId;
    setLoading(true);
    try {
      const respOffers = await fetch(`/api/drivers/offers${activePid ? `?propertyId=${activePid}` : ''}`);
      if (respOffers.status === 401) return;
      
      const resultOffers = await respOffers.json();
      if (resultOffers.success) {
        setOffersList(resultOffers.data);
      }

      const progressUrl = `/api/drivers/offers/progress${activePid ? `?propertyId=${activePid}` : ''}`;
      const response = await fetch(progressUrl);
      if (response.status === 401) return;
      
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch tracking data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const sessionResponse = await fetch('/api/auth/session').then(res => res.json());
        const role = sessionResponse.user?.role;
        const orgId = sessionResponse.user?.organizationId;
        let currentPid = sessionResponse.user?.propertyId;

        if (!currentPid && (role === 'RESTAURANTS_ADMIN' || role === 'SUPER_ADMIN') && orgId) {
          const propResp = await fetch(`/api/setup/properties?organizationId=${orgId}`).then(res => res.json());
          if (propResp.success && propResp.data.length > 0) {
            currentPid = propResp.data[0].id;
          }
        }

        if (currentPid) {
          setPropertyId(currentPid);
          fetchProgress(currentPid);
        } else {
          fetchProgress();
        }
      } catch (err) {
        console.error('Session init failed:', err);
        fetchProgress();
      }
    };
    init();
  }, []);

  const handleCreateOrUpdateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingOfferId ? `/api/drivers/offers/${editingOfferId}` : '/api/drivers/offers';
      const method = editingOfferId ? 'PATCH' : 'POST';
      
      await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...offerForm, propertyId })
      });
      setIsOfferModalOpen(false);
      setEditingOfferId(null);
      setOfferForm({ title: '', offerType: 'RIDES', targetRides: 0, targetReferrals: 0, rewardValue: 0, rewardType: 'CASH', rewardItem: '', resetType: 'SAME_OFFER', priority: 1, nextOfferId: '' });
      fetchProgress();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteOffer = async (id: string) => {
    if (!confirm('Are you sure you want to delete this incentive slab?')) return;
    try {
      await fetch(`/api/drivers/offers/${id}`, { method: 'DELETE' });
      fetchProgress();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriverId || !assignForm.offerId) return;
    try {
      await fetch('/api/drivers/offers/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId: selectedDriverId, offerId: assignForm.offerId, propertyId })
      });
      setIsAssignModalOpen(false);
      fetchProgress();
    } catch (err) {
      console.error(err);
    }
  };

  const [syncing, setSyncing] = useState(false);

  const handleReSync = async () => {
    setSyncing(true);
    try {
      // 1. Call the backend repair/sync logic
      await fetch('/api/drivers/offers/re-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId })
      });
      
      // 2. Refresh the UI data
      await fetchProgress();
      alert('Engine Synchronized: All driver progressions have been repaired and updated.');
    } catch (err) {
      console.error('Sync failed:', err);
      alert('Sync failed. Check console for details.');
    } finally {
      setSyncing(false);
    }
  };

  const filteredData = data.filter(d => {
    const s = search.toLowerCase();
    return d.name.toLowerCase().includes(s) || (d.phone || '').includes(s);
  });

  const columns = [
    {
      header: 'Driver Identity',
      cell: (row: DriverProgress) => (
        <div className="flex items-center gap-4 py-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pos-primary/10 to-white dark:from-pos-primary/20 dark:to-slate-900 border-2 border-pos-primary/20 dark:border-pos-primary/30 flex items-center justify-center text-pos-primary dark:text-pos-primary/80 shadow-sm uppercase font-black tracking-widest text-[10px] flex-shrink-0 animate-in fade-in zoom-in duration-500">
             {row.name.substring(0,2)}
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">{row.name}</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold tracking-widest flex items-center gap-1.5">
               <ShieldCheck size={10} className="text-emerald-500" /> {row.phone || 'No phone'}
            </span>
          </div>
        </div>
      ),
      width: '280px'
    },
    {
      header: 'Progression Level',
      cell: (row: DriverProgress) => (
        <div className="flex flex-col gap-1.5 items-start">
          <div className="flex items-center gap-2">
             <span className="text-[9px] font-black px-2.5 py-1 rounded-full tracking-widest bg-slate-900 dark:bg-pos-primary text-white uppercase shadow-sm flex items-center border-t border-white/20">
                <Target size={10} className="mr-1.5 fill-white" /> {row.activeOffer}
             </span>
             {row.offerLevel !== 'N/A' && (
                <span className="text-[9px] font-black text-indigo-400 dark:text-indigo-300 uppercase tracking-[0.2em] bg-indigo-50/50 dark:bg-indigo-900/30 px-2 rounded-md py-0.5 border border-indigo-100 dark:border-indigo-800">
                   LVL {row.offerLevel}
                </span>
             )}
          </div>
        </div>
      ),
      width: '240px'
    },
    {
      header: 'Engine Status',
      cell: (row: DriverProgress) => {
        const isNear = row.progressPercent >= 80 && row.progressPercent < 100;
        const isDone = row.progressPercent >= 100;
        return (
          <div className="flex flex-col gap-2 w-full max-w-[240px] pr-8 group">
             <div className="flex justify-between items-end text-[9px] uppercase font-black tracking-widest text-slate-400 dark:text-slate-500">
                <span className="flex items-center gap-1.5"><CalendarDays size={10} /> Completed: {row.completedRides}</span>
                <span className="text-indigo-600 dark:text-indigo-400">Goal: {Math.max(1, Math.round(row.completedRides / (row.progressPercent/100 || 1)))}</span>
             </div>
             
             <div className="w-full bg-slate-100/80 dark:bg-slate-800/80 rounded-full h-3 overflow-hidden border border-slate-200/50 dark:border-slate-700/50 p-0.5 shadow-inner">
               <div 
                 className={`h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden shadow-sm
                   ${isDone ? 'bg-emerald-500 shadow-emerald-200' : 'bg-gradient-to-r from-pos-primary via-pos-primary to-pos-primary-dark'}
                 `} 
                 style={{ width: `${Math.min(row.progressPercent, 100)}%` }}
               >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
               </div>
             </div>
             <div className="flex justify-between items-center px-1">
                <span className={`text-[9px] font-black tracking-widest ${isDone ? 'text-emerald-500' : isNear ? 'text-orange-500 animate-pulse' : 'text-slate-400'}`}>
                   {isDone ? 'COMPLETED' : isNear ? 'SO CLOSE!' : 'MOVING UP'}
                </span>
                <span className="text-[10px] font-black text-indigo-700 tracking-tighter">
                   {row.progressPercent.toFixed(0)}%
                </span>
             </div>
          </div>
        );
      },
      width: '280px'
    },
    {
      header: 'Wins',
      cell: (row: DriverProgress) => (
         <div className="flex flex-col items-center justify-center min-w-[70px]">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 hover:rotate-6
               ${row.completedOffersCount > 0 ? 'bg-gradient-to-br from-amber-300 to-amber-500 text-white shadow-lg shadow-amber-200 border-t border-white/40' : 'bg-white text-slate-200 border border-slate-100'}
            `}>
               <Trophy size={20} className={row.completedOffersCount > 0 ? "drop-shadow-md" : ""} />
            </div>
            <span className="font-black text-[10px] text-slate-400 mt-2 uppercase tracking-widest">{row.completedOffersCount} WINS</span>
         </div>
      ),
      width: '100px'
    }
  ];

  const nearCompletionCount = data.filter(d => d.progressPercent > 75 && d.progressPercent < 100).length;
  const topWinsCount = data.reduce((acc, d) => acc + d.completedOffersCount, 0);
  const totalRidesAchieved = data.reduce((acc, d) => acc + d.completedRides, 0);

  return (
    <div className="space-y-6 pb-20">
      <PageHeader 
        title="Driver Hub" 
        subtitle="Track driver progress and rewards in real-time"
        actions={
          <div className="flex items-center gap-3">
            <Button 
              disabled={syncing}
              variant="secondary"
              className={`bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl h-11 px-5 text-[10px] font-black tracking-[0.2em] text-slate-500 dark:text-slate-400 transition-all uppercase shadow-sm ${syncing ? 'opacity-70 cursor-not-allowed' : ''}`}
              onClick={handleReSync}
            >
               <RefreshCw size={14} className={`mr-2 ${syncing ? 'animate-spin text-indigo-500' : ''}`} /> 
               {syncing ? 'UPDATING...' : 'REFRESH ALL PROGRESS'}
            </Button>
            <Button 
              className="bg-gradient-to-r from-pos-primary to-pos-primary-dark hover:from-pos-primary-dark hover:to-pos-primary-dark text-white font-black text-[10px] tracking-[0.2em] h-11 px-6 rounded-2xl shadow-xl shadow-pos-primary/20 transition-all active:scale-95 uppercase border-t border-white/20"
              onClick={() => setIsOfferModalOpen(true)}
            >
               <Plus size={14} className="mr-1.5" /> ADD NEW LEVEL
            </Button>
          </div>
        }
      />

      {/* ASAN NAVIGATION BAR */}
      <div className="bg-white/70 backdrop-blur-md sticky top-0 z-40 -mx-8 px-8 py-4 border-b border-slate-200/60 mb-8 mt-2 shadow-sm">
         <div className="max-w-screen-xl mx-auto flex items-center justify-center">
            <div className="flex p-1.5 bg-slate-100 rounded-3xl border border-slate-200 shadow-inner w-full max-w-lg">
               <button 
                  onClick={() => setActiveTab('dashboard')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all
                     ${activeTab === 'dashboard' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
               >
                  <LayoutDashboard size={14} /> Dashboard
               </button>
               <button 
                  onClick={() => setActiveTab('tracker')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all
                     ${activeTab === 'tracker' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
               >
                  <Activity size={14} /> Live Tracking
               </button>
               <button 
                  onClick={() => setActiveTab('catalog')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all
                     ${activeTab === 'catalog' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
               >
                  <Compass size={14} /> Reward Rules
               </button>
            </div>
         </div>
      </div>

      <div className="max-w-screen-xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
         
         {/* TAB 1: DASHBOARD OVERVIEW */}
         {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-in zoom-in-95 duration-500">
               <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="group bg-gradient-to-br from-pos-primary to-pos-primary-dark p-8 rounded-[2.5rem] text-white shadow-2xl shadow-pos-primary/10 border-t border-white/20 relative overflow-hidden transition-all hover:scale-[1.02]">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                     <div className="relative z-10">
                        <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-4 transition-all group-hover:bg-white/20"><Rocket size={24} /></div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200">Total Rides Achieved</p>
                        <p className="text-4xl font-black mt-2 tracking-tighter">{totalRidesAchieved}</p>
                        <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-indigo-100 bg-white/10 w-fit px-3 py-1 rounded-full border border-white/5">
                           <ArrowUpRight size={12} /> +12% Efficiency
                        </div>
                     </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900/40 p-7 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between transition-all hover:shadow-xl hover:shadow-indigo-50/50">
                     <div className="flex justify-between items-start">
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/20 text-amber-500 dark:text-amber-400 flex items-center justify-center shadow-inner"><Trophy size={24} /></div>
                        <span className="text-[8px] font-black bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-md uppercase tracking-widest">Global Record</span>
                     </div>
                     <div className="mt-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Total Wins</p>
                        <p className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter mt-1">{topWinsCount}</p>
                     </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900/40 p-7 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between transition-all hover:shadow-xl hover:shadow-indigo-50/50">
                     <div className="flex justify-between items-start">
                        <div className="w-12 h-12 rounded-2xl bg-pos-primary/10 dark:bg-pos-primary/20 text-pos-primary flex items-center justify-center shadow-inner"><Zap size={24} /></div>
                        <span className="text-[8px] font-black bg-pos-primary/20 dark:bg-pos-primary/30 text-pos-primary-dark px-2 py-0.5 rounded-md uppercase tracking-widest text-nowrap">High Heat</span>
                     </div>
                     <div className="mt-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Near Completed</p>
                        <p className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter mt-1">{nearCompletionCount}</p>
                     </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900/40 p-7 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between transition-all hover:shadow-xl hover:shadow-indigo-50/50">
                     <div className="flex justify-between items-start">
                        <div className="w-12 h-12 rounded-2xl bg-violet-50 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400 flex items-center justify-center shadow-inner"><Award size={24} /></div>
                        <span className="text-[8px] font-black bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 px-2 py-0.5 rounded-md uppercase tracking-widest">Active Engine</span>
                     </div>
                     <div className="mt-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Active Rules</p>
                        <p className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter mt-1">{offersList.length}</p>
                     </div>
                  </div>
               </div>

               {/* Activity Bar Chart Mockup (SVG) - "proper" look */}
               <div className="bg-white dark:bg-slate-900/40 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden h-[300px] flex flex-col transition-all hover:shadow-xl hover:shadow-indigo-50/50">
                  <div className="flex justify-between items-center mb-6">
                     <div>
                        <h4 className="text-[11px] font-black text-slate-800 dark:text-white uppercase tracking-widest">Program Velocity Analysis</h4>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium tracking-wide">Aggregate daily ride completion trends</p>
                     </div>
                     <Select className="h-8 rounded-xl text-[9px] font-black bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-300" />
                  </div>
                  <div className="flex-1 flex items-end justify-between gap-3 pt-4">
                     {[40, 70, 45, 90, 65, 80, 55, 30, 85, 60, 45, 30].map((h, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                           <div 
                              className="w-full bg-slate-100 dark:bg-slate-800 rounded-full relative overflow-hidden transition-all duration-700 hover:bg-indigo-100 dark:hover:bg-indigo-900" 
                              style={{ height: `${h}%` }}
                           >
                              <div className="absolute inset-0 bg-gradient-to-t from-pos-primary to-pos-primary-dark opacity-0 group-hover:opacity-100 transition-opacity rounded-full shadow-[0_0_15px_rgba(232,160,160,0.3)]" />
                           </div>
                           <span className="text-[8px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-tighter group-hover:text-pos-primary dark:group-hover:text-pos-primary/80">Day {i+1}</span>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
         )}

         {/* TAB 2: LIVE LEADERBOARD (TRACKER) */}
         {activeTab === 'tracker' && (
            <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
               <div className="bg-pos-primary p-8 rounded-[2.5rem] text-white flex justify-between items-center shadow-xl shadow-pos-primary/10 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                  <div className="z-10">
                     <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                        <Activity size={24} className="animate-pulse" /> Live Tracking
                     </h3>
                     <p className="text-indigo-100 text-xs mt-1 font-medium opacity-80 tracking-wide">Check how many bookings your drivers have done today</p>
                  </div>
                  <div className="z-10 bg-white/10 px-6 py-3 rounded-2xl border border-white/20 backdrop-blur-sm">
                     <p className="text-[9px] font-black text-indigo-200 uppercase tracking-widest">Total Drivers</p>
                     <p className="text-2xl font-black leading-tight mt-0.5">{data.length}</p>
                  </div>
               </div>

               <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-2 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                  <SearchToolbar  
                    value={search}
                    onChange={setSearch}
                    placeholder="Identify driver via registry name or phone signature..."
                  />
               </div>

               <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl dark:shadow-none overflow-hidden group">
                  <DataTable 
                    columns={columns} 
                    data={filteredData} 
                    loading={loading}
                  />
                  {filteredData.length === 0 && !loading && (
                    <div className="p-20 text-center flex flex-col items-center gap-4">
                       <Compass size={40} className="text-slate-200 dark:text-slate-800" />
                       <div>
                          <p className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">Zero Registry Hits</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium tracking-wide mt-1">No drivers are currently engaged in active incentive missions.</p>
                       </div>
                       <Button className="bg-slate-900 dark:bg-blue-600 h-10 px-8 rounded-xl font-black text-[10px] tracking-widest uppercase mt-4">Manual Slab Assignment</Button>
                    </div>
                  )}
               </div>
            </div>
         )}

         {/* TAB 3: THE CATALOG (REWARD RULES) */}
         {activeTab === 'catalog' && (
            <div className="space-y-8 animate-in slide-in-from-left-8 duration-500">
               <div className="flex items-center justify-between">
                  <div>
                     <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter flex items-center gap-3">
                        <Award className="text-pos-primary" size={28} /> Global Reward Matrix
                     </h3>
                     <p className="text-xs text-slate-400 dark:text-slate-500 font-medium tracking-wide ml-1 mt-1">Configure automated triggers and sequential progression levels</p>
                  </div>
                  <Button 
                    className="bg-slate-900 dark:bg-blue-600 border-0 h-11 px-6 rounded-2xl text-[10px] font-black tracking-widest flex items-center gap-2 shadow-lg active:scale-95 transition-all text-white"
                    onClick={() => setIsOfferModalOpen(true)}
                  >
                     <Plus size={16} /> ADD NEW TIER
                  </Button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {offersList.map(offer => (
                    <div key={offer.id} className="group bg-white dark:bg-slate-900/40 rounded-[3rem] border border-slate-200 dark:border-slate-800 p-8 shadow-[0_15px_40px_rgb(0,0,0,0.03)] dark:shadow-none transition-all hover:border-indigo-400 hover:shadow-2xl hover:shadow-indigo-50/20 relative overflow-hidden">
                       <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 dark:bg-indigo-900/20 rounded-full -mr-16 -mt-16 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 transition-all opacity-40" />
                       {!offer.isActive && <div className="absolute top-6 right-6 text-[8px] font-black text-slate-400 dark:text-slate-500 tracking-[0.2em] uppercase bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">Inactive</div>}
                       
                       <div className={`w-14 h-14 rounded-[1.25rem] flex items-center justify-center mb-6 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-lg shadow-indigo-100/50 
                          ${offer.priority <= 2 ? 'bg-gradient-to-br from-amber-200 to-amber-500 text-white' : 
                            offer.priority <= 5 ? 'bg-gradient-to-br from-slate-200 to-slate-500 text-white' : 
                            'bg-gradient-to-br from-indigo-500 to-violet-600 text-white'}
                       `}>
                          <Award size={24} className="drop-shadow-md" />
                       </div>

                       <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight mb-2 pr-10">{offer.title}</h3>
                       
                       <div className="flex flex-wrap gap-2 mb-6">
                          <span className="text-[9px] font-black bg-pos-primary text-white px-2.5 py-1 rounded-lg uppercase tracking-widest shadow-md">Level {offer.priority || 1}</span>
                          <span className="text-[9px] font-black bg-slate-800 text-white px-2.5 py-1 rounded-lg uppercase tracking-widest shadow-md">{offer.offerType} Mission</span>
                          {offer.resetType === 'NEXT_OFFER' && (
                             <span className="text-[9px] font-black bg-amber-500 text-white px-2.5 py-1 rounded-lg uppercase tracking-widest flex items-center gap-1.5 shadow-md">
                                Sequence <ChevronRight size={10} strokeWidth={3} />
                             </span>
                          )}
                       </div>

                       <div className="space-y-4 pt-4 border-t border-slate-50 dark:border-slate-800">
                          <div className="flex justify-between items-center">
                             <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Requirement</span>
                             <span className="text-xs font-black text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-lg border border-slate-100 dark:border-slate-700">{offer.targetRides} RIDES</span>
                          </div>
                          <div className="flex justify-between items-center">
                             <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-nowrap mr-4">Total Payout</span>
                             <span className="text-xs font-black text-indigo-900 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/30 px-3 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800 uppercase tracking-widest shadow-sm">
                                {offer.rewardType === 'CASH' ? `₹${offer.rewardValue} Instant` : offer.rewardItem}
                             </span>
                          </div>
                       </div>

                       <div className="flex items-center gap-3 mt-8 pt-6 border-t border-slate-50 transition-all">
                          <Button 
                            className="flex-1 h-11 rounded-[1.25rem] text-[10px] font-black tracking-widest uppercase bg-pos-primary text-white shadow-lg shadow-pos-primary/10 hover:bg-pos-primary-dark transition-all active:scale-95 border-t border-white/20"
                            onClick={() => {
                              setEditingOfferId(offer.id);
                              setOfferForm({...offer, rewardItem: offer.rewardItem || ''});
                              setIsOfferModalOpen(true);
                            }}
                          >
                             <Edit size={14} className="mr-2" /> Modify Slab
                          </Button>
                          <Button 
                            variant="secondary"
                            className="w-14 h-11 p-0 rounded-[1.25rem] border border-red-200 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all hover:scale-105 active:scale-95 shadow-lg shadow-red-100 flex items-center justify-center border-t border-white/40"
                            onClick={() => handleDeleteOffer(offer.id)}
                          >
                             <Trash2 size={18} strokeWidth={2.5} />
                          </Button>
                       </div>
                    </div>
                  ))}

                  {offersList.length === 0 && (
                    <button 
                      onClick={() => setIsOfferModalOpen(true)}
                      className="group flex flex-col items-center justify-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200 border-spacing-4 p-12 min-h-[220px] transition-all hover:bg-indigo-50 hover:border-indigo-300 shadow-inner"
                    >
                       <div className="w-16 h-16 rounded-[1.5rem] bg-white flex items-center justify-center text-slate-300 shadow-sm border border-slate-200 mb-4 group-hover:scale-110 group-hover:text-indigo-500 group-hover:border-indigo-500 transition-all duration-500 group-hover:rotate-12">
                          <Plus size={32} />
                       </div>
                       <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest group-hover:text-indigo-600">Unified Reward Matrix is Empty</p>
                       <p className="text-[9px] text-slate-300 uppercase mt-2">Initialize your first reward slab tier</p>
                    </button>
                  )}
               </div>
            </div>
         )}

      </div>

      {/* Modals & Forms */}
      <Modal isOpen={isOfferModalOpen} onClose={() => { setIsOfferModalOpen(false); setEditingOfferId(null); }} title={editingOfferId ? "Update Reward Slab Tier" : "Initialize Incentive Tier"}>
         <form onSubmit={handleCreateOrUpdateOffer} className="p-2 space-y-7">
            <div className="bg-gradient-to-br from-indigo-50 to-white dark:from-slate-900 dark:to-slate-950 -m-6 p-8 mb-8 border-b border-indigo-100/50 dark:border-slate-800 shadow-[inset_0_-2px_10px_rgba(0,0,0,0.02)]">
               <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 tracking-[0.2em] uppercase mb-1 flex items-center gap-2">
                  <Flame size={12} className="fill-indigo-600 dark:fill-indigo-400" /> Reward Tier Configuration Menu
               </p>
               <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">Fine-tune reward payouts, ride thresholds, and automated follow-up sequences for this level.</p>
            </div>

            <div className="space-y-5">
               <div>
                  <label className="block text-[10px] font-black text-slate-800 dark:text-slate-200 mb-2.5 tracking-widest uppercase ml-1">Level Name</label>
                  <input required type="text" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-indigo-500 font-bold text-slate-900 dark:text-white transition-all outline-none" value={offerForm.title} onChange={e => setOfferForm({...offerForm, title: e.target.value})} placeholder="e.g. Iron Tier 1 - New Recruits" />
               </div>
               
               <div className="grid grid-cols-2 gap-5">
                  <div>
                     <label className="block text-[10px] font-black text-slate-800 dark:text-slate-200 mb-2.5 tracking-widest uppercase ml-1">Mission Strategy</label>
                     <select className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700 dark:text-slate-200 outline-none" value={offerForm.offerType} onChange={e => setOfferForm({...offerForm, offerType: e.target.value})}>
                        <option value="RIDES">Rides Velocity</option>
                        <option value="REFERRALS">Referral Volume</option>
                     </select>
                  </div>
                  <div>
                     <label className="block text-[10px] font-black text-slate-800 dark:text-slate-200 mb-2.5 tracking-widest uppercase ml-1">Automation Flow</label>
                     <div className="flex gap-2">
                        <div className="w-20">
                           <input type="number" title="Slab Priority/Level" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm rounded-2xl px-4 py-4 text-sm focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700 dark:text-slate-200 outline-none text-center" value={offerForm.priority} onChange={e => setOfferForm({...offerForm, priority: parseInt(e.target.value) || 1})} placeholder="Lvl" />
                        </div>
                        <select className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700 dark:text-slate-200 outline-none" value={offerForm.resetType} onChange={e => setOfferForm({...offerForm, resetType: e.target.value})}>
                           <option value="SAME_OFFER">Endless Loop</option>
                           <option value="NEXT_OFFER">Sequential Up</option>
                           <option value="CAMPAIGN_RESET">Expire on Hit</option>
                        </select>
                     </div>
                  </div>
               </div>

               {offerForm.resetType === 'NEXT_OFFER' && (
                  <div className="animate-in slide-in-from-top-4 duration-500">
                     <label className="block text-[10px] font-black text-indigo-600 mb-2.5 tracking-widest uppercase ml-1">Next Objective (Level Up Destination)</label>
                     <select required className="w-full bg-indigo-50/50 border border-indigo-100 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-indigo-500 font-bold text-indigo-700" value={offerForm.nextOfferId} onChange={e => setOfferForm({...offerForm, nextOfferId: e.target.value})}>
                        <option value="">-- Identify Next Level --</option>
                        {offersList.filter(o => o.id !== editingOfferId).map(offer => (
                           <option key={offer.id} value={offer.id}>{offer.title} (Lvl {offer.priority})</option>
                        ))}
                     </select>
                  </div>
               )}

               <div className="bg-white dark:bg-slate-900 p-7 rounded-[2rem] border border-indigo-100 dark:border-slate-800 shadow-sm space-y-5">
                  <div className="flex items-center justify-between border-b border-indigo-50 dark:border-slate-800 pb-4">
                     <label className="text-[10px] font-black text-indigo-800 dark:text-indigo-400 tracking-[0.2em] uppercase">Reward Payload</label>
                     <div className="flex gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                        <button 
                           type="button"
                           onClick={() => setOfferForm({...offerForm, rewardType: 'CASH'})}
                           className={`px-5 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${offerForm.rewardType === 'CASH' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-md' : 'text-slate-400'}`}
                        >CASH</button>
                        <button 
                           type="button"
                           onClick={() => setOfferForm({...offerForm, rewardType: 'GIFT'})}
                           className={`px-5 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${offerForm.rewardType === 'GIFT' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-md' : 'text-slate-400'}`}
                        >GIFT</button>
                     </div>
                  </div>
                  <div className="flex flex-col md:flex-row gap-5">
                     <div className="flex-1">
                        <label className="block text-[9px] font-black text-slate-400 mb-1.5 tracking-widest uppercase ml-1">Requirement Threshold</label>
                        <div className="relative">
                           <input required type="number" min="1" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl px-5 py-3 text-lg focus:ring-2 focus:ring-indigo-500 font-black text-slate-900 dark:text-white shadow-sm" value={offerForm.targetRides} onChange={e => setOfferForm({...offerForm, targetRides: parseInt(e.target.value) || 0})} />
                           <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">Rides</span>
                        </div>
                     </div>
                     <div className="flex-1">
                        {offerForm.rewardType === 'CASH' ? (
                           <>
                              <label className="block text-[9px] font-black text-slate-400 mb-1.5 tracking-widest uppercase ml-1">Payout Value (₹)</label>
                              <div className="relative">
                                 <input required type="number" min="0" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl px-5 py-3 text-lg focus:ring-2 focus:ring-emerald-500 font-black text-emerald-600 dark:text-emerald-400 shadow-sm" value={offerForm.rewardValue} onChange={e => setOfferForm({...offerForm, rewardValue: parseFloat(e.target.value) || 0})} />
                                 <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[9px] font-black text-emerald-200 dark:text-emerald-900 uppercase tracking-widest">INR</span>
                              </div>
                           </>
                        ) : (
                           <>
                              <label className="block text-[9px] font-black text-slate-400 mb-1.5 tracking-widest uppercase ml-1">Physical Gift Badge</label>
                              <div className="relative">
                                 <input required type="text" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl px-5 py-3 text-sm focus:ring-2 focus:ring-amber-500 font-black text-amber-600 dark:text-amber-400 shadow-sm" placeholder="e.g. Professional Helmet" value={offerForm.rewardItem} onChange={e => setOfferForm({...offerForm, rewardItem: e.target.value})} />
                                 <Gift className="absolute right-5 top-1/2 -translate-y-1/2 text-amber-300 dark:text-amber-800" size={18} />
                              </div>
                           </>
                        )}
                     </div>
                  </div>
               </div>
            </div>

            <div className="pt-10 flex justify-end gap-4 border-t border-slate-100 dark:border-slate-800 -mx-2">
               <button type="button" className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-8 transition-all hover:text-slate-600 dark:hover:text-slate-300" onClick={() => { setIsOfferModalOpen(false); setEditingOfferId(null); }}>CANCEL</button>
               <Button type="submit" className="h-14 px-10 rounded-[1.75rem] bg-slate-900 dark:bg-pos-primary text-white font-black text-[12px] tracking-[0.2em] shadow-2xl dark:shadow-none hover:bg-black dark:hover:bg-pos-primary-dark transition-all active:scale-95 border-t border-white/20">
                  {editingOfferId ? "SYNC CHANGES" : "START MISSION"}
               </Button>
            </div>
         </form>
      </Modal>

      <Modal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} title="Operational Oversight Override">
         <form onSubmit={handleAssignOffer} className="space-y-7 pt-2">
            <div className="bg-amber-50 p-6 rounded-[2rem] border border-amber-100 flex gap-5 shadow-sm">
               <div className="w-14 h-14 rounded-2xl bg-white text-amber-500 flex items-center justify-center shadow-md flex-shrink-0 border border-amber-100"><Zap size={28} /></div>
               <div>
                  <p className="text-xs font-black text-amber-900 uppercase tracking-[0.15em]">Manual State Hijack Warning</p>
                  <p className="text-[11px] text-amber-700/80 font-medium leading-relaxed mt-2">Force-assigning this slab will **vaporize** current mission progress for this specific driver. Use only for correction protocols.</p>
               </div>
            </div>

            <div className="space-y-4">
               <label className="block text-[10px] font-black text-slate-800 tracking-widest uppercase ml-1">Mission Selection</label>
               <select required className="w-full bg-slate-50 border border-slate-200 shadow-sm rounded-2xl px-6 py-5 text-sm focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800 outline-none" value={assignForm.offerId} onChange={e => setAssignForm({offerId: e.target.value})}>
                  <option value="" disabled>-- Available Incentive Mission Protocols --</option>
                  {offersList.map(offer => (
                     <option key={offer.id} value={offer.id}>{offer.title} [Goal: {offer.targetRides} RIDES]</option>
                  ))}
               </select>
            </div>
            
            <div className="flex gap-4 pt-6 border-t border-slate-50 dark:border-slate-800 -mx-2">
               <Button type="button" variant="secondary" className="flex-1 h-14 rounded-[1.75rem] text-[10px] font-black tracking-widest uppercase border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" onClick={() => setIsAssignModalOpen(false)}>ABORT</Button>
               <Button type="submit" className="flex-1 h-14 rounded-[1.75rem] bg-gradient-to-r from-red-600 to-rose-600 text-white font-black text-[11px] tracking-widest uppercase shadow-xl hover:from-red-700 transition-all border-t border-white/20">CONFIRM HIJACK</Button>
            </div>
         </form>
      </Modal>
    </div>
  );
}

function Select({ className, ...props }: any) {
  return (
    <select className={`bg-white border rounded-md px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-500 ${className}`} {...props}>
      <option>Last 7 Cycles</option>
      <option>Last 30 Cycles</option>
      <option>Lifetime Performance</option>
    </select>
  );
}

export default function DriverOffersClient() {
  return (
    <Suspense fallback={
       <div className="p-20 text-center flex flex-col items-center gap-6 animate-pulse">
          <div className="w-20 h-20 rounded-3xl bg-indigo-100 flex items-center justify-center text-indigo-500">
             <Rocket size={40} />
          </div>
          <div className="space-y-2">
             <p className="text-sm font-black text-indigo-900 uppercase tracking-widest">Booting Command Center...</p>
             <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-tighter">Preparing Fleet Surveillance Protocols</p>
          </div>
       </div>
    }>
       <DriverOffersContent />
    </Suspense>
  );
}
