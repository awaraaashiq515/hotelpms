'use client';
import React, { useState } from 'react';
import { Crown, Building2, IndianRupee, TrendingUp, Plus, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { TenantList, type Tenant } from './components/TenantList';
import { SubscriptionPlans } from './components/SubscriptionPlans';

const MOCK_TENANTS: Tenant[] = [
  { id:'1', name:'Taj Lake Palace',         domain:'tajlakepalace.guestflow.ai',      plan:'ENTERPRISE',    rooms:90,  activeUsers:45, status:'ACTIVE', city:'Udaipur',   country:'IN', joinedAt:'2024-01-15', lastActive:'Just now', mrr:19999 },
  { id:'2', name:'The Leela Goa',           domain:'leela-goa.guestflow.ai',          plan:'ENTERPRISE',    rooms:180, activeUsers:85, status:'ACTIVE', city:'Goa',       country:'IN', joinedAt:'2024-02-20', lastActive:'5m ago',   mrr:19999 },
  { id:'3', name:'Zostel Mumbai',           domain:'zostel-mumbai.guestflow.ai',      plan:'STARTER',       rooms:20,  activeUsers:4,  status:'ACTIVE', city:'Mumbai',    country:'IN', joinedAt:'2025-06-01', lastActive:'1h ago',   mrr:2999 },
  { id:'4', name:'Ritz Carlton Dubai',      domain:'ritzcarlton-dubai.guestflow.ai',  plan:'CUSTOM',        rooms:350, activeUsers:180,status:'ACTIVE', city:'Dubai',     country:'AE', joinedAt:'2023-11-01', lastActive:'2m ago',   mrr:75000 },
  { id:'5', name:'Budget Inn Jaipur',       domain:'budgetinn-jaipur.guestflow.ai',   plan:'PROFESSIONAL',  rooms:45,  activeUsers:12, status:'TRIAL',  city:'Jaipur',    country:'IN', joinedAt:'2026-07-01', lastActive:'3h ago',   mrr:0 },
  { id:'6', name:'Himalayan Eco Resort',    domain:'himalayan-eco.guestflow.ai',      plan:'PROFESSIONAL',  rooms:30,  activeUsers:8,  status:'ACTIVE', city:'Manali',    country:'IN', joinedAt:'2025-09-15', lastActive:'1d ago',   mrr:7999 },
  { id:'7', name:'Old Grand Hotel Paris',   domain:'oldgrand-paris.guestflow.ai',     plan:'ENTERPRISE',    rooms:120, activeUsers:60, status:'SUSPENDED',city:'Paris',   country:'FR', joinedAt:'2024-08-01', lastActive:'5d ago',   mrr:0 },
];

export default function SuperAdminPage() {
  const [tab, setTab] = useState<'tenants'|'plans'|'metrics'|'whatsapp'>('tenants');

  const activeTenants  = MOCK_TENANTS.filter(t => t.status === 'ACTIVE');
  const totalMRR       = activeTenants.reduce((s, t) => s + t.mrr, 0);
  const totalRooms     = MOCK_TENANTS.reduce((s, t) => s + t.rooms, 0);
  const totalUsers     = MOCK_TENANTS.reduce((s, t) => s + t.activeUsers, 0);

  return (
    <div className="space-y-5 pb-10 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Crown size={14} className="text-yellow-400" />
            <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">GuestFlow AI · Super Admin</span>
          </div>
          <h1 className="text-2xl font-black text-white">Super Admin — SaaS Control Panel</h1>
          <p className="text-xs text-slate-500 mt-0.5">{MOCK_TENANTS.length} tenants · ₹{(totalMRR/1000).toFixed(0)}K MRR</p>
        </div>
        <button className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-yellow-600 hover:bg-yellow-500 text-white text-xs font-black uppercase tracking-wider">
          <Plus size={12} /> Add Tenant
        </button>
      </div>

      {/* SaaS Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label:'Total Tenants',  value:MOCK_TENANTS.length,     color:'text-violet-300 border-violet-500/20 bg-violet-900/20' },
          { label:'Active Hotels',  value:activeTenants.length,    color:'text-emerald-300 border-emerald-500/20 bg-emerald-900/20' },
          { label:'Monthly Revenue',value:`₹${(totalMRR/1000).toFixed(0)}K`, color:'text-yellow-300 border-yellow-500/20 bg-yellow-900/20' },
          { label:'Total Rooms Managed',value:totalRooms,         color:'text-sky-300 border-sky-500/20 bg-sky-900/20' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl border p-4 ${s.color}`}>
            <p className="text-2xl font-black text-white">{s.value}</p>
            <p className="text-[9px] font-bold uppercase tracking-widest opacity-60 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {([['tenants','Tenant Management'],['plans','Subscription Plans'],['metrics','Platform Metrics']] as const).map(([v,l]) => (
          <button key={v} onClick={() => setTab(v)}
            className={`px-4 h-9 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors ${tab===v ? 'bg-yellow-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
            {l}
          </button>
        ))}
        <Link
          href="/hotel/super-admin/whatsapp-settings"
          className="flex items-center gap-1.5 px-4 h-9 rounded-xl text-[10px] font-black uppercase tracking-wider bg-green-900/40 text-green-400 border border-green-500/30 hover:bg-green-900/60 transition-colors"
        >
          <MessageCircle size={11} />
          WhatsApp Settings
        </Link>
      </div>

      {tab === 'tenants' && <TenantList tenants={MOCK_TENANTS} onManage={t => alert(`Managing ${t.name}`)} />}
      {tab === 'plans'   && <SubscriptionPlans />}
      {tab === 'metrics' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label:'API Calls Today',    value:'2.4M',   trend:'+12%', icon:'⚡' },
            { label:'Avg Uptime (30d)',   value:'99.97%', trend:'↑',    icon:'🟢' },
            { label:'Data Processed',     value:'48 GB',  trend:'Today',icon:'💾' },
            { label:'Support Tickets',    value:12,       trend:'Open', icon:'🎫' },
            { label:'Pending Payments',   value:3,        trend:'Overdue',icon:'💳' },
            { label:'New Signups (30d)',   value:8,        trend:'+60%', icon:'🚀' },
          ].map(m => (
            <div key={m.label} className="rounded-2xl bg-slate-900/50 border border-white/5 p-4 flex items-center gap-4">
              <span className="text-3xl">{m.icon}</span>
              <div>
                <p className="text-xl font-black text-white">{m.value}</p>
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mt-0.5">{m.label}</p>
                <p className="text-[9px] text-emerald-400 mt-0.5">{m.trend}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
