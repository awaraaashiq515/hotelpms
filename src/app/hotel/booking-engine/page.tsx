'use client';
import React, { useState } from 'react';
import { Globe, BarChart3, Tag, Package2, RefreshCw } from 'lucide-react';
import { RateConfig, type RatePlan } from './components/RateConfig';
import { PromoManager, type PromoCode } from './components/PromoManager';

const MOCK_PLANS: RatePlan[] = [
  { id:'1', name:'Best Available Rate',   code:'BAR',    type:'BAR',         rate:6500, mealPlan:'EP', minStay:1, cancellationPolicy:'Free up to 24h', isActive:true,  roomTypes:['All'] },
  { id:'2', name:'Advance Purchase 10%',  code:'AP10',   type:'PROMOTIONAL', rate:5850, mealPlan:'EP', minStay:2, cancellationPolicy:'Non-refundable',  isActive:true,  roomTypes:['All'] },
  { id:'3', name:'Weekend Getaway',       code:'WKD',    type:'PACKAGE',     rate:8000, mealPlan:'CP', minStay:2, cancellationPolicy:'Free up to 48h',  isActive:true,  roomTypes:['Deluxe','Suite'] },
  { id:'4', name:'Corporate Rate',        code:'CORP',   type:'CORPORATE',   rate:5500, mealPlan:'CP', minStay:1, cancellationPolicy:'Free up to 6h',   isActive:true,  roomTypes:['All'] },
  { id:'5', name:'Loyalty Member Rate',   code:'LOY15',  type:'LOYALTY',     rate:5525, mealPlan:'EP', minStay:1, cancellationPolicy:'Free up to 24h',  isActive:true,  roomTypes:['All'] },
  { id:'6', name:'Honeymoon Package',     code:'HONEY',  type:'PACKAGE',     rate:12000,mealPlan:'AP', minStay:3, cancellationPolicy:'Free up to 72h',  isActive:false, roomTypes:['Suite'] },
];

const MOCK_PROMOS: PromoCode[] = [
  { id:'1', code:'SUMMER20', discount:20, type:'PERCENTAGE', minStay:2, validFrom:'2026-07-01', validTo:'2026-07-31', maxUses:100, usedCount:42, isActive:true },
  { id:'2', code:'FLAT500',  discount:500, type:'FIXED',    minStay:1, validFrom:'2026-07-01', validTo:'2026-08-31', maxUses:50,  usedCount:12, isActive:true },
  { id:'3', code:'EARLY15',  discount:15, type:'PERCENTAGE', minStay:3, validFrom:'2026-06-01', validTo:'2026-09-30', maxUses:200, usedCount:89, isActive:false },
];

export default function BookingEnginePage() {
  const [tab, setTab]         = useState<'rates'|'promos'|'stats'>('rates');
  const [plans, setPlans]     = useState(MOCK_PLANS);
  const [promos, setPromos]   = useState(MOCK_PROMOS);

  return (
    <div className="space-y-5 pb-10 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Globe size={14} className="text-sky-400" />
            <span className="text-[10px] font-black text-sky-400 uppercase tracking-widest">Distribution · Booking Engine</span>
          </div>
          <h1 className="text-2xl font-black text-white">Booking Engine</h1>
          <p className="text-xs text-slate-500 mt-0.5">Direct booking website · Rate plans · Promo codes</p>
        </div>
        <a href="http://localhost:3000/book" target="_blank" rel="noreferrer"
          className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-black uppercase tracking-wider">
          <Globe size={12} /> Preview Booking Site
        </a>
      </div>

      {/* Live stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label:'Direct Bookings Today', value:14,        color:'text-sky-300 border-sky-500/20 bg-sky-900/20' },
          { label:'Conversion Rate',       value:'3.2%',    color:'text-emerald-300 border-emerald-500/20 bg-emerald-900/20' },
          { label:'Active Rate Plans',     value:plans.filter(p=>p.isActive).length,  color:'text-violet-300 border-violet-500/20 bg-violet-900/20' },
          { label:'Active Promos',         value:promos.filter(p=>p.isActive).length, color:'text-amber-300 border-amber-500/20 bg-amber-900/20' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl border p-4 ${s.color}`}>
            <p className="text-2xl font-black text-white">{s.value}</p>
            <p className="text-[9px] font-bold uppercase tracking-widest opacity-60 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {([['rates','Rate Plans'],['promos','Promo Codes'],['stats','Booking Stats']] as const).map(([v,l]) => (
          <button key={v} onClick={() => setTab(v)}
            className={`px-4 h-9 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors ${tab===v ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
            {l}
          </button>
        ))}
      </div>

      {tab === 'rates' && (
        <RateConfig plans={plans} onToggle={id => setPlans(prev => prev.map(p => p.id===id ? {...p,isActive:!p.isActive} : p))} />
      )}
      {tab === 'promos' && (
        <PromoManager promos={promos} onToggle={id => setPromos(prev => prev.map(p => p.id===id ? {...p,isActive:!p.isActive} : p))} onDelete={id => setPromos(prev => prev.filter(p => p.id!==id))} />
      )}
      {tab === 'stats' && (
        <div className="rounded-2xl bg-slate-900/50 border border-white/5 p-8 text-center">
          <BarChart3 size={32} className="text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Connect Google Analytics or Cloudflare to see real booking funnel stats</p>
        </div>
      )}
    </div>
  );
}
