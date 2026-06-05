'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Trophy, 
  Zap, 
  Plus, 
  ChevronRight, 
  BarChart3, 
  UsersRound, 
  Gift, 
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/Button';

export default function DriverHubPage() {
  const [stats, setStats] = useState({
    totalDrivers: 0,
    activeOffers: 0,
    totalWins: 0,
    recentReferrals: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [driversRes, offersRes] = await Promise.all([
          fetch('/api/drivers').then(r => r.json()),
          fetch('/api/drivers/offers').then(r => r.json())
        ]);

        if (driversRes.success && offersRes.success) {
          const drivers = driversRes.data || [];
          const offers = offersRes.data || [];
          const totalWins = drivers.reduce((sum: number, d: any) => sum + (d.totalWins || 0), 0);
          
          setStats({
            totalDrivers: drivers.length,
            activeOffers: offers.length,
            totalWins: totalWins,
            recentReferrals: drivers.reduce((sum: number, d: any) => sum + (d.referralCount || 0), 0)
          });
        }
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const hubCards = [
    {
      title: 'Driver List',
      description: 'Add and manage your drivers. See their phone numbers and vehicle details.',
      icon: UsersRound,
      path: '/drivers/list',
      color: 'bg-pos-primary',
      lightColor: 'bg-pos-primary/10 dark:bg-pos-primary/20',
      textColor: 'text-pos-primary dark:text-pos-primary',
      stat: `${stats.totalDrivers} Drivers`
    },
    {
      title: 'Driver Progress',
      description: 'Track how many customers your drivers bring and their progress in real-time.',
      icon: Zap,
      path: '/drivers/offers',
      color: 'bg-pos-primary-dark',
      lightColor: 'bg-pos-primary/10 dark:bg-pos-primary/20',
      textColor: 'text-pos-primary-dark dark:text-pos-primary',
      stat: `Track Progress`
    },
    {
      title: 'Reward Rules',
      description: 'Set rules for giving rewards (like cash or gifts) after reaching ride targets.',
      icon: Gift,
      path: '/drivers/offers', 
      query: { tab: 'slabs' },
      color: 'bg-amber-500',
      lightColor: 'bg-amber-50 dark:bg-amber-500/10',
      textColor: 'text-amber-600 dark:text-amber-400',
      stat: `${stats.activeOffers} Active Rules`
    }
  ];

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      <PageHeader 
        title="Drivers Hub" 
        subtitle="Manage all your drivers and their rewards in one place"
        showBack
        backUrl="/operations"
      />

      {/* Hero Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Total Drivers */}
        <div className="bg-white dark:bg-slate-900 p-3 rounded-xl shadow-sm border border-slate-100 dark:border-white/5 flex flex-col justify-between group hover:shadow-md transition-all">
           <div className="flex justify-between items-start mb-2">
              <div className="p-1.5 bg-pos-primary/10 dark:bg-pos-primary/20 text-pos-primary rounded-lg group-hover:bg-pos-primary group-hover:text-white transition-colors duration-300">
                <Users size={16} />
              </div>
              <span className="text-[8px] font-black uppercase tracking-widest text-slate-300 dark:text-slate-700 font-mono">DRV-00</span>
           </div>
           <div>
              <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Total Drivers</p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                 <p className="text-xl font-black text-slate-800 dark:text-slate-200 tracking-tighter leading-none">{stats.totalDrivers}</p>
                 <span className="text-[8px] font-bold text-emerald-500 flex items-center bg-emerald-50 dark:bg-emerald-500/10 px-1 py-0.5 rounded-md leading-none">
                   <ArrowUpRight size={8} className="mr-0.5" /> STABLE
                 </span>
              </div>
           </div>
        </div>

        {/* Rewards Given */}
        <div className="bg-slate-950 p-3 rounded-xl shadow-xl flex flex-col justify-between border border-slate-800 dark:border-white/5 group transition-all">
           <div className="flex justify-between items-start mb-2">
              <div className="p-1.5 bg-white/10 text-amber-400 rounded-lg group-hover:bg-amber-400 group-hover:text-black transition-colors duration-300">
                <Trophy size={16} />
              </div>
              <span className="text-[8px] font-black uppercase tracking-widest text-slate-750 dark:text-slate-700 font-mono">WINS-00</span>
           </div>
           <div>
              <p className="text-[8px] font-black uppercase tracking-widest text-slate-500">Rewards Given</p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                 <p className="text-xl font-black text-white tracking-tighter leading-none">{stats.totalWins}</p>
                 <span className="text-[8px] font-bold text-amber-500 uppercase tracking-widest ml-0.5 leading-none">Rewards</span>
              </div>
           </div>
        </div>

        {/* Total Referrals */}
        <div className="bg-white dark:bg-slate-900 p-3 rounded-xl shadow-sm border border-slate-100 dark:border-white/5 flex flex-col justify-between group hover:shadow-md transition-all">
           <div className="flex justify-between items-start mb-2">
              <div className="p-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                <BarChart3 size={16} />
              </div>
              <span className="text-[8px] font-black uppercase tracking-widest text-slate-300 dark:text-slate-700 font-mono">REF-00</span>
           </div>
           <div>
              <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Total Referrals</p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                 <p className="text-xl font-black text-slate-800 dark:text-slate-200 tracking-tighter leading-none">{stats.recentReferrals}</p>
                 <span className="text-[8px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-1 py-0.5 rounded-md leading-none">COMMUNITY</span>
              </div>
           </div>
        </div>

        {/* System Status */}
        <div className="bg-pos-primary p-3 rounded-xl shadow-xl shadow-pos-primary/10 flex flex-col justify-between relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-2xl -mr-8 -mt-8"></div>
           <div className="flex justify-between items-start mb-2 relative z-10">
              <div className="p-1.5 bg-white/20 text-white rounded-lg group-hover:bg-white group-hover:text-pos-primary transition-colors duration-300">
                <Sparkles size={16} />
              </div>
           </div>
           <div className="relative z-10">
              <p className="text-[8px] font-black uppercase tracking-widest text-white/60">System Status</p>
              <p className="text-sm font-black text-white tracking-tighter mt-0.5 uppercase leading-none">Running Smoothly</p>
              <p className="text-[7.5px] font-bold text-white/40 mt-1 uppercase tracking-widest flex items-center leading-none">
                <span className="w-1 h-1 bg-emerald-400 rounded-full mr-1 animate-pulse"></span> ALL SYSTEMS OK
              </p>
           </div>
        </div>
      </div>

      {/* Navigation Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
        {hubCards.map((card, idx) => (
          <Link 
            key={idx} 
            href={{ pathname: card.path, query: card.query }}
            className="group flex flex-col bg-white dark:bg-slate-900 rounded-xl p-4.5 shadow-[0_4px_20px_rgba(0,0,0,0.01)] border border-slate-100 dark:border-white/5 hover:border-pos-primary/20 dark:hover:border-pos-primary/30 transition-all hover:shadow-md hover:-translate-y-0.5"
          >
            <div className={`w-9 h-9 rounded-lg ${card.lightColor} ${card.textColor} flex items-center justify-center mb-3 group-hover:scale-105 transition-transform duration-300 shadow-sm`}>
              <card.icon size={18} />
            </div>
            
            <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tight mb-1.5">
              {card.title}
            </h3>
            
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-normal mb-4 flex-1">
              {card.description}
            </p>

            <div className="flex items-center justify-between pt-3 border-t border-slate-50 dark:border-white/5">
              <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                {card.stat}
              </span>
              <div className={`w-6 h-6 rounded-full ${card.lightColor} ${card.textColor} flex items-center justify-center group-hover:translate-x-1 transition-transform duration-300`}>
                <ChevronRight size={12} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions Footer */}
      <div className="bg-slate-50 dark:bg-slate-900/40 p-4.5 rounded-xl border border-slate-200 dark:border-white/5 border-dashed flex flex-wrap items-center justify-between gap-4 mt-2">
        <div className="flex items-center gap-3">
           <div className="w-8 h-8 bg-white dark:bg-slate-900 rounded-lg flex items-center justify-center text-slate-400 dark:text-slate-550 shadow-sm border border-slate-100 dark:border-white/5">
              <Zap size={15} />
           </div>
           <div>
              <p className="text-[10px] font-black text-slate-850 dark:text-white uppercase tracking-tight leading-none">Want to add something?</p>
              <p className="text-[8px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wide mt-1.5 leading-none">Add a new driver or set a reward rule now.</p>
           </div>
        </div>
        
        <div className="flex gap-2">
           <Link href="/drivers/list?action=new">
             <Button className="bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-350 font-black text-[8px] tracking-widest h-8 px-4 rounded-lg border border-slate-250 dark:border-white/10 shadow-sm transition-all uppercase">
                Add Driver
             </Button>
           </Link>
           <Link href="/drivers/offers?action=new-slab">
             <Button className="bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-black text-[8px] tracking-widest h-8 px-4 rounded-lg shadow-md transition-all active:scale-95 uppercase">
                <Plus size={10} className="mr-1" /> Add Reward Rule
             </Button>
           </Link>
        </div>
      </div>
    </div>
  );
}
