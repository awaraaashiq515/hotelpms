'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Filter, ChevronRight, 
  Layers, Clock, MapPin, 
  CheckCircle2, AlertCircle, Eye, Settings, Trash2, X
} from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { kotsApi, KotTicket } from '@/lib/api/kots';
import { format } from 'date-fns';
import { PageHeader } from '@/components/shared/page-header';
import { useToast } from '@/components/ui/Toast';

import { useSearchParams } from 'next/navigation';

export default function KotsPage() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [kots, setKots] = useState<KotTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialSearch);
  const [filterType, setFilterType] = useState<'ALL' | 'RESTAURANT' | 'BAR' | 'CAFE'>('ALL');
  const [restaurantPosEnabled, setRestaurantPosEnabled] = useState(true);
  const [barPosEnabled, setBarPosEnabled] = useState(false);
  const [cafePosEnabled, setCafePosEnabled] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [autoClearEnabled, setAutoClearEnabled] = useState(false);
  const [autoClearHours, setAutoClearHours] = useState(24);
  const { addToast } = useToast();

  useEffect(() => {
    fetch('/api/setup/properties/current')
      .then(r => r.json())
      .then(data => { 
        if (data.success) {
          setRestaurantPosEnabled(data.data.restaurantPosEnabled !== false);
          setBarPosEnabled(!!data.data.barPosEnabled);
          setCafePosEnabled(!!data.data.cafePosEnabled);
        }
      })
      .catch(() => {});
  }, []);

  const enabledTypes = useMemo(() => {
    const types: ('ALL' | 'RESTAURANT' | 'BAR' | 'CAFE')[] = ['ALL'];
    if (restaurantPosEnabled) types.push('RESTAURANT');
    if (barPosEnabled) types.push('BAR');
    if (cafePosEnabled) types.push('CAFE');
    return types;
  }, [restaurantPosEnabled, barPosEnabled, cafePosEnabled]);

  useEffect(() => {
    const savedEnabled = localStorage.getItem('kot_auto_clear_enabled') === 'true';
    const savedHours = parseInt(localStorage.getItem('kot_auto_clear_hours') || '24');
    setAutoClearEnabled(savedEnabled);
    setAutoClearHours(savedHours);
  }, []);

  const saveSettings = () => {
    localStorage.setItem('kot_auto_clear_enabled', autoClearEnabled.toString());
    localStorage.setItem('kot_auto_clear_hours', autoClearHours.toString());
    setIsSettingsOpen(false);
    addToast('success', 'KOT auto-clear settings updated.');
  };

  const handleResetAll = async () => {
    if (!confirm('Are you sure you want to delete ALL KOTs? This cannot be undone.')) return;
    try {
      await kotsApi.cleanup({ all: true });
      addToast('success', 'All KOTs have been cleared.');
      fetchKots();
    } catch (error) {
      addToast('error', 'Failed to clear KOTs.');
    }
  };

  const handleCleanup = async (hours: number) => {
    try {
      await kotsApi.cleanup({ hours });
      fetchKots();
    } catch (error) {
      console.error('Auto-cleanup failed:', error);
    }
  };

  useEffect(() => {
    if (initialSearch) {
      setSearch(initialSearch);
    }
  }, [initialSearch]);

  const fetchKots = async () => {
    try {
      const data = await kotsApi.list();
      setKots(data || []);
    } catch (error) {
      console.error('Failed to fetch KOTs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKots();
    const interval = setInterval(() => {
      fetchKots();
      
      // Auto-cleanup check
      const savedEnabled = localStorage.getItem('kot_auto_clear_enabled') === 'true';
      if (savedEnabled) {
        const hours = parseInt(localStorage.getItem('kot_auto_clear_hours') || '24');
        handleCleanup(hours);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const getKotType = (kot: KotTicket): 'RESTAURANT' | 'BAR' | 'CAFE' => {
    if (!kot.items || kot.items.length === 0) return 'RESTAURANT';
    const hasBar = kot.items.some(item => item.product?.menuType === 'BAR');
    if (hasBar) return 'BAR';
    const hasCafe = kot.items.some(item => item.product?.menuType === 'CAFE');
    if (hasCafe) return 'CAFE';
    return 'RESTAURANT';
  };

  const getKotBadge = (type: 'RESTAURANT' | 'BAR' | 'CAFE') => {
    switch (type) {
      case 'BAR':
        return (
          <span className="text-[9px] bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/30 font-black px-1.5 py-0.5 rounded uppercase tracking-wider flex items-center gap-0.5">
            🍺 Bar
          </span>
        );
      case 'CAFE':
        return (
          <span className="text-[9px] bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/30 font-black px-1.5 py-0.5 rounded uppercase tracking-wider flex items-center gap-0.5">
            ☕ Cafe
          </span>
        );
      default:
        return (
          <span className="text-[9px] bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/30 font-black px-1.5 py-0.5 rounded uppercase tracking-wider flex items-center gap-0.5">
            🍽️ Restaurant
          </span>
        );
    }
  };

  const filteredKots = useMemo(() => {
    let list = kots;
    if (search) {
      list = list.filter(row => 
        row.kotNo.toLowerCase().includes(search.toLowerCase()) || 
        (row.tableNo?.toLowerCase() || row.restaurantTableId?.toLowerCase() || '').includes(search.toLowerCase())
      );
    }
    if (filterType !== 'ALL') {
      list = list.filter(row => getKotType(row) === filterType);
    }
    return list;
  }, [search, kots, filterType]);

  const getStatusVariant = (status: string): 'info' | 'warning' | 'success' | 'error' | 'neutral' => {
    switch (status) {
      case 'NEW': return 'info';
      case 'PREPARING': return 'warning';
      case 'READY': return 'success';
      case 'SERVED': return 'success';
      case 'CANCELLED': return 'error';
      default: return 'neutral';
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="KOTs Control"
        subtitle="Kitchen Order Tickets History"
        showBack
        backUrl="/operations"
        actions={
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" size={18} />
              <input 
                type="text" 
                placeholder="Search Table/Room..." 
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-pos-primary/20"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button 
              variant="secondary" 
              onClick={() => setIsSettingsOpen(true)}
              className="rounded-xl flex items-center gap-2"
            >
              <Settings size={18} />
              <span className="hidden md:inline">Settings</span>
            </Button>
          </div>
        }
      />

      {/* KOT Type Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 select-none">
        {enabledTypes.map((type) => {
          const count = kots.filter(row => type === 'ALL' ? true : getKotType(row) === type).length;
          const isActive = filterType === type;
          const label = type === 'ALL' ? 'All KOTs' : type === 'RESTAURANT' ? 'Restaurant' : type === 'BAR' ? 'Bar' : 'Cafe';
          const icon = type === 'ALL' ? <Layers size={14} /> : type === 'RESTAURANT' ? '🍽️' : type === 'BAR' ? '🍺' : '☕';
          
          return (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer whitespace-nowrap shadow-sm ${
                isActive 
                  ? 'bg-pos-primary border-pos-primary text-white scale-[1.02]' 
                  : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-650 dark:text-slate-400 hover:border-gray-300 dark:hover:border-slate-700'
              }`}
            >
              <span className="flex items-center">{icon}</span>
              <span>{label}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                isActive 
                  ? 'bg-white/20 text-white' 
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-700">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-400">KOT Info</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-400">Source</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-400">Items</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-400">Time</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-400">Status</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
              {loading ? (
                [1,2,3,4,5].map(i => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-12" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                    <td className="px-6 py-4 text-right"><Skeleton className="h-8 w-8 rounded-lg ml-auto" /></td>
                  </tr>
                ))
              ) : filteredKots.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400 dark:text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                    No KOTs found
                  </td>
                </tr>
              ) : (
                filteredKots.map((row, index) => {
                  const seqNum = filteredKots.length - index;
                  return (
                  <tr key={row.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-black section-heading tracking-tight">
                            {format(new Date(row.createdAt), 'dd/MM/yyyy')}
                          </span>
                          <span className="text-[10px] bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-black px-1.5 py-0.5 rounded uppercase tracking-widest">
                            KOT No. {seqNum}
                          </span>
                          {getKotBadge(getKotType(row))}
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest leading-none">
                          {row.kotNo} • {row.order?.orderNo || 'POS-ORDER'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-pos-primary/10 flex items-center justify-center text-pos-primary">
                          <Layers size={14} />
                        </div>
                         <span className="text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-tight">
                            {row.tableNo ? `Table: ${row.tableNo}` : row.roomId ? `Room: ${row.roomId}` : 'Takeaway'}
                         </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-black text-gray-600 dark:text-slate-300">
                        {row.items?.length || 0} Items
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-700 dark:text-slate-300">
                          {format(new Date(row.createdAt), 'hh:mm a')}
                        </span>
                        <span className="text-[9px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">
                          {format(new Date(row.createdAt), 'dd MMM')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={getStatusVariant(row.status)}>
                        {row.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/kots/${row.id}`}>
                        <Button variant="secondary" size="sm" className="h-8 w-8 p-0 rounded-lg">
                          <Eye size={14} />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden border border-gray-100 dark:border-slate-800">
              <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-gray-50/50 dark:bg-slate-800/50">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-pos-primary/10 flex items-center justify-center text-pos-primary">
                       <Settings size={20} />
                    </div>
                    <div>
                       <h2 className="text-lg font-black section-heading tracking-tight">KOT Settings</h2>
                       <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Configure auto-cleanup</p>
                    </div>
                 </div>
                 <button onClick={() => setIsSettingsOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors">
                    <X size={20} className="text-gray-400" />
                 </button>
              </div>

              <div className="p-6 space-y-6">
                 {/* Auto Clear Toggle */}
                 <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700">
                    <div>
                       <h4 className="text-sm font-black text-gray-800 dark:text-white uppercase tracking-tight">Auto-Clear KOTs</h4>
                       <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Remove old tickets automatically</p>
                    </div>
                    <button 
                       onClick={() => setAutoClearEnabled(!autoClearEnabled)}
                       className={`w-12 h-6 rounded-full transition-colors relative ${autoClearEnabled ? 'bg-pos-primary' : 'bg-gray-200 dark:bg-slate-700'}`}
                    >
                       <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${autoClearEnabled ? 'translate-x-6' : ''}`} />
                    </button>
                 </div>

                 {/* Hours Input */}
                 {autoClearEnabled && (
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Clear tickets older than (Hours)</label>
                       <input 
                          type="number" 
                          value={autoClearHours}
                          onChange={(e) => setAutoClearHours(parseInt(e.target.value) || 1)}
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-pos-primary/20"
                       />
                    </div>
                 )}

                 {/* Reset All Button */}
                 <div className="pt-4 border-t border-gray-100 dark:border-slate-800">
                    <Button 
                       variant="danger" 
                       onClick={handleResetAll}
                       className="w-full rounded-2xl flex items-center justify-center gap-2 h-12"
                    >
                       <Trash2 size={18} />
                       RESET ALL KOTS NOW
                    </Button>
                 </div>
              </div>

              <div className="p-6 bg-gray-50/50 dark:bg-slate-800/50 border-t border-gray-100 dark:border-slate-800 flex gap-3">
                 <Button variant="secondary" onClick={() => setIsSettingsOpen(false)} className="flex-1 rounded-xl">Cancel</Button>
                 <Button variant="primary" onClick={saveSettings} className="flex-1 rounded-xl">Save Settings</Button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
