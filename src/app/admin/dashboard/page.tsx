'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { 
  Building2, 
  Store, 
  Users, 
  IndianRupee, 
  Activity,
  ArrowUpRight,
  Monitor
} from 'lucide-react';

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    // Super Admin explicitly requests GLOBAL stats
    fetch('/api/admin/dashboard?global=true')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStats(data.data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
    return () => clearInterval(timer);
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 border-4 border-rose-100 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-rose-300 rounded-full border-t-transparent animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center font-bold text-[10px] tracking-widest uppercase" style={{color:'#e8a0a0'}}>Mint</div>
      </div>
    </div>
  );

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const statCards = [
    { 
      label: 'Total Organizations', 
      value: stats?.stats?.properties || 0, 
      icon: Building2, 
      color: 'from-rose-300 to-rose-500', 
      trend: '+12%',
      shadow: 'shadow-rose-200'
    },
    { 
      label: 'Total POS Outlets', 
      value: stats?.stats?.outlets || 0, 
      icon: Store, 
      color: 'from-rose-400 to-pink-500', 
      trend: '+5%',
      shadow: 'shadow-rose-200'
    },
    { 
      label: 'Total Users', 
      value: stats?.stats?.users || 0, 
      icon: Users, 
      color: 'from-rose-300 to-rose-400', 
      trend: '+8%',
      shadow: 'shadow-rose-100'
    },
    { 
      label: 'Gross Revenue', 
      value: `₹${(stats?.stats?.totalSales || 0).toLocaleString()}`, 
      icon: IndianRupee, 
      color: 'from-rose-400 to-rose-600', 
      trend: '+15%',
      shadow: 'shadow-rose-200'
    },
  ];

  return (
    <div className="relative min-h-screen p-2 md:p-0 isolate overflow-hidden dark:bg-slate-950">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-rose-200/20 dark:bg-rose-500/10 rounded-full blur-[60px] -z-10" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-rose-200/20 dark:bg-rose-500/10 rounded-full blur-[60px] -z-10" />
      
        <div className="space-y-6 md:space-y-10 relative z-10">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-1 w-8 rounded-full" style={{backgroundColor:'#e8a0a0'}} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{color:'#e8a0a0'}}>{getGreeting()}</span>
          </div>
          <h1 className="text-2xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex flex-wrap items-baseline gap-2 md:gap-3 transition-colors">
            System Dashboard
            <span className="text-[10px] md:text-sm font-bold bg-rose-50 dark:bg-rose-900/30 px-3 py-1 rounded-full uppercase tracking-widest border border-rose-100 dark:border-rose-800" style={{color:'#e8a0a0'}}>Live</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm font-medium mt-2 max-w-md leading-relaxed">
            Manage global operations, track system-wide revenue, and monitor network health across all organizations.
          </p>
          {/* Branding tag */}
          <div className="flex items-center gap-2 mt-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-pos-primary/40 dark:border-pos-primary/20 bg-pos-primary/10 dark:bg-pos-primary/5">
              <span className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.18em] text-pos-primary">OrderMint POS</span>
              <span className="w-1 h-1 rounded-full bg-pos-primary" />
              <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">by Ritchie</span>
            </div>
          </div>
        </div>
        <div className="w-full lg:w-auto px-6 py-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm rounded-3xl flex flex-col items-start lg:items-end transition-all hover:shadow-md">
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
            <Activity size={14} className="text-emerald-500 animate-pulse" />
            Network Reliability: 99.9%
          </div>
          <span className="text-xs font-black text-slate-800 dark:text-slate-200">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {statCards.map((card, i) => (
          <Card key={i} className={`p-0 border-none shadow-xl ${card.shadow} dark:shadow-none hover:shadow-2xl hover:-translate-y-1 transform-gpu transition-shadow,transform duration-200 group overflow-hidden relative isolate dark:bg-slate-900/50 dark:border dark:border-slate-800`}>
            <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-[0.03] dark:opacity-[0.1] group-hover:opacity-[0.06] dark:group-hover:opacity-[0.15] transition-opacity duration-200 -z-10`} />
            <div className="p-6 md:p-8">
              <div className="flex justify-between items-start mb-4 md:mb-6 font-sans">
                <div className={`p-3 md:p-4 bg-gradient-to-br ${card.color} rounded-2xl shadow-lg ring-4 ring-white dark:ring-slate-800 transform-gpu`}>
                  <card.icon className="text-white" size={20} />
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[9px] md:text-[10px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400 px-2 py-1 rounded-lg flex items-center gap-1 border border-emerald-100 dark:border-emerald-800 transition-colors">
                    {card.trend} <ArrowUpRight size={10} />
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">{card.label}</p>
                <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight tabular-nums transition-colors">{card.value}</h3>
              </div>
            </div>
            {/* Decorative element */}
            <div className={`absolute -bottom-6 -right-6 w-20 md:w-24 h-20 md:h-24 bg-gradient-to-br ${card.color} opacity-[0.05] dark:opacity-[0.1] rounded-full blur-2xl group-hover:scale-150 transform-gpu transition-transform duration-500`} />
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <Card className="lg:col-span-2 p-6 md:p-10 border-none shadow-xl shadow-slate-100 dark:shadow-none dark:bg-slate-900/50 dark:border dark:border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
            <Activity size={200} className="text-slate-900 dark:text-white" />
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 md:mb-10 relative z-10">
            <div>
              <h3 className="text-base md:text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3 transition-colors">
                <div className="h-2 w-2 rounded-full animate-ping" style={{backgroundColor:'#e8a0a0'}} />
                Live Network Health
              </h3>
              <p className="text-[10px] md:text-xs text-slate-400 font-medium mt-1">Real-time request distribution across clusters</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 md:gap-4">
              <div className="flex items-center gap-1.5 md:gap-2">
                <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full" style={{backgroundColor:'#e8a0a0'}} />
                <span className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase">Traffic</span>
              </div>
              <div className="flex items-center gap-1.5 md:gap-2">
                <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-slate-200 dark:bg-slate-700" />
                <span className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase">Baseline</span>
              </div>
              <button className="px-3 md:px-4 py-1.5 md:py-2 border border-rose-100 dark:border-rose-800 rounded-xl text-[9px] md:text-[10px] font-bold hover:bg-rose-50 dark:hover:bg-rose-900/20 uppercase tracking-widest transition-colors text-pos-primary">
                Diagnostics
              </button>
            </div>
          </div>
          <div className="h-[200px] md:h-[280px] w-full flex items-end justify-between gap-1 pt-4 relative z-10 transition-colors">
            {/* Simple Dynamic SVG Mock Visual */}
            <svg className="w-full h-full overflow-visible" viewBox="0 0 800 240" preserveAspectRatio="none">
              <defs>
                <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#e8a0a0" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#e8a0a0" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path 
                d="M0,180 Q50,160 100,190 T200,140 T300,170 T400,120 T500,150 T600,100 T700,130 T800,90 L800,240 L0,240 Z" 
                fill="url(#gradient)" 
              />
              <path 
                d="M0,180 Q50,160 100,190 T200,140 T300,170 T400,120 T500,150 T600,100 T700,130 T800,90" 
                fill="none" 
                stroke="#e8a0a0" 
                strokeWidth="4" 
                strokeLinecap="round" 
              />
              {/* Data Points */}
              <circle cx="200" cy="140" r="4" fill="white" stroke="#e8a0a0" strokeWidth="3" />
              <circle cx="400" cy="120" r="4" fill="white" stroke="#e8a0a0" strokeWidth="3" />
              <circle cx="500" cy="150" r="4" fill="white" stroke="#e8a0a0" strokeWidth="3" />
              <circle cx="800" cy="90" r="5" fill="#e8a0a0" />
            </svg>
          </div>
        </Card>

        <Card className="p-6 md:p-10 border-none shadow-xl shadow-slate-100 dark:shadow-none flex flex-col h-full overflow-hidden bg-white dark:bg-slate-900 text-slate-900 dark:text-white relative transition-colors duration-500">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-50 to-slate-50 dark:from-rose-950 dark:to-slate-950 -z-10 opacity-50" />
          <div className="flex justify-between items-start mb-6 md:mb-8">
            <h3 className="text-[10px] md:text-sm font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Live Stream</h3>
            <div className="flex items-center gap-2 px-3 py-1 bg-rose-50 dark:bg-white/10 rounded-full border border-rose-100 dark:border-white/5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[8px] md:text-[9px] font-black uppercase tracking-tighter text-emerald-600 dark:text-emerald-400">Active</span>
            </div>
          </div>
          <div className="space-y-6 md:space-y-8 flex-1 overflow-y-auto no-scrollbar pr-2">
            {(stats?.recentOrders || []).map((order: any, idx: number) => (
              <div key={order.id} className="flex items-center gap-4 md:gap-5 group">
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center text-xs md:text-sm font-black text-white shrink-0 shadow-lg rotate-3 group-hover:rotate-0 transition-all ${
                  ['bg-rose-400', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-600'][idx % 4]
                }`}>
                  {order.property.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] md:text-xs font-black truncate uppercase tracking-tighter group-hover:text-rose-400 transition-colors">{order.property.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-white/20" />
                    <p className="text-[8px] md:text-[9px] text-slate-500 font-bold uppercase truncate tracking-widest leading-none">{order.servedBy?.fullName || 'POS Staff'}</p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <p className="text-[11px] md:text-xs font-black text-slate-900 dark:text-white transition-colors">₹{order.grandTotal}</p>
                  <span className="text-[7px] md:text-[8px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-800/30">Captured</span>
                </div>
              </div>
            ))}
            {(!stats?.recentOrders || stats.recentOrders.length === 0) && (
              <div className="flex flex-col items-center justify-center py-10 md:py-20 text-center opacity-40">
                <Activity size={24} className="mb-4 animate-spin-slow md:w-8 md:h-8" />
                <p className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest leading-loose text-slate-500 dark:text-white/60">Awaiting Signal...<br/>Monitoring Global Sync</p>
              </div>
            )}
          </div>
          <button className="mt-6 md:mt-8 py-3 md:py-4 w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] hover:bg-slate-100 dark:hover:bg-white/10 transition-colors hover:text-slate-900 dark:hover:text-white group">
            <span className="group-hover:tracking-[0.3em] md:group-hover:tracking-[0.4em] transition-all">Access Full Logs</span>
          </button>
        </Card>
      </div>
    </div>

    </div>
  );
}
