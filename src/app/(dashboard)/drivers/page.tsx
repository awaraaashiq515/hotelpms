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
  CarFront, 
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
      lightColor: 'bg-pos-primary/10',
      textColor: 'text-pos-primary',
      stat: `${stats.totalDrivers} Drivers`
    },
    {
      title: 'Driver Progress',
      description: 'Track how many customers your drivers bring and their progress in real-time.',
      icon: Zap,
      path: '/drivers/offers',
      color: 'bg-pos-primary-dark',
      lightColor: 'bg-pos-primary/10',
      textColor: 'text-pos-primary-dark',
      stat: `Track Progress`
    },
    {
      title: 'Reward Rules',
      description: 'Set rules for giving rewards (like cash or gifts) after reaching ride targets.',
      icon: Gift,
      path: '/drivers/offers', // Will link to the Slabs tab in the offers page
      query: { tab: 'slabs' },
      color: 'bg-amber-500',
      lightColor: 'bg-amber-50',
      textColor: 'text-amber-600',
      stat: `${stats.activeOffers} Active Rules`
    }
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <PageHeader 
        title="Drivers Hub" 
        subtitle="Manage all your drivers and their rewards in one place"
      />

      {/* Hero Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between group hover:shadow-md transition-all">
           <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-pos-primary/10 text-pos-primary rounded-2xl group-hover:bg-pos-primary group-hover:text-white transition-colors duration-300">
                <Users size={24} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 font-mono">DRV-00</span>
           </div>
           <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Drivers</p>
              <div className="flex items-baseline gap-2">
                 <p className="text-3xl font-black text-slate-800 tracking-tighter">{stats.totalDrivers}</p>
                 <span className="text-[10px] font-bold text-emerald-500 flex items-center bg-emerald-50 px-1.5 py-0.5 rounded-md">
                   <ArrowUpRight size={10} className="mr-0.5" /> STABLE
                 </span>
              </div>
           </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-3xl shadow-xl shadow-slate-200 flex flex-col justify-between border border-slate-800 group transition-all">
           <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-white/10 text-amber-400 rounded-2xl group-hover:bg-amber-400 group-hover:text-black transition-colors duration-300">
                <Trophy size={24} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 font-mono">WINS-00</span>
           </div>
           <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Rewards Given</p>
              <div className="flex items-baseline gap-2">
                 <p className="text-3xl font-black text-white tracking-tighter">{stats.totalWins}</p>
                 <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest ml-1">Rewards</span>
              </div>
           </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between group hover:shadow-md transition-all">
           <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                <BarChart3 size={24} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 font-mono">REF-00</span>
           </div>
           <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Referrals</p>
              <div className="flex items-baseline gap-2">
                 <p className="text-3xl font-black text-slate-800 tracking-tighter">{stats.recentReferrals}</p>
                 <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded-md">COMMUNITY</span>
              </div>
           </div>
        </div>

        <div className="bg-pos-primary p-6 rounded-3xl shadow-xl shadow-pos-primary/20 flex flex-col justify-between relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
           <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="p-3 bg-white/20 text-white rounded-2xl group-hover:bg-white group-hover:text-pos-primary transition-colors duration-300">
                <Sparkles size={24} />
              </div>
           </div>
           <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/60">System Status</p>
              <p className="text-xl font-black text-white tracking-tighter mt-1 uppercase">Running Smoothly</p>
              <p className="text-[9px] font-bold text-white/40 mt-1 uppercase tracking-widest flex items-center">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-1.5 animate-pulse"></span> ALL SYSTEMS OK
              </p>
           </div>
        </div>
      </div>

      {/* Navigation Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
        {hubCards.map((card, idx) => (
          <Link 
            key={idx} 
            href={{ pathname: card.path, query: card.query }}
            className="group flex flex-col bg-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100 hover:border-pos-primary/30 transition-all hover:shadow-[0_20px_50px_rgb(0,0,0,0.06)] hover:-translate-y-2"
          >
            <div className={`w-16 h-16 rounded-2xl ${card.lightColor} ${card.textColor} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-sm`}>
              <card.icon size={32} />
            </div>
            
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-3">
              {card.title}
            </h3>
            
            <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8 flex-1">
              {card.description}
            </p>

            <div className="flex items-center justify-between pt-6 border-t border-slate-50">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {card.stat}
              </span>
              <div className={`w-10 h-10 rounded-full ${card.lightColor} ${card.textColor} flex items-center justify-center group-hover:translate-x-2 transition-transform duration-300`}>
                <ChevronRight size={20} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions Footer */}
      <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-200 border-dashed flex flex-wrap items-center justify-between gap-6 mt-8">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 shadow-sm border border-slate-100">
              <Zap size={24} />
           </div>
           <div>
              <p className="text-sm font-black text-slate-800 uppercase tracking-tight">Want to add something?</p>
              <p className="text-xs text-slate-500 font-medium tracking-wide">Add a new driver or set a reward rule now.</p>
           </div>
        </div>
        
        <div className="flex gap-3">
           <Link href="/drivers/list?action=new">
             <Button className="bg-white hover:bg-slate-50 text-slate-600 font-black text-[10px] tracking-widest h-12 px-6 rounded-2xl border border-slate-200 shadow-sm transition-all uppercase">
                Add Driver
             </Button>
           </Link>
           <Link href="/drivers/offers?action=new-slab">
             <Button className="bg-slate-900 hover:bg-black text-white font-black text-[10px] tracking-widest h-12 px-8 rounded-2xl shadow-xl shadow-slate-200 transition-all active:scale-95 uppercase">
                <Plus size={14} className="mr-2" /> Add Reward Rule
             </Button>
           </Link>
        </div>
      </div>
    </div>
  );
}
