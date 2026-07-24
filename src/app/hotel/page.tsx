'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  Search, 
  X, 
  Calendar, 
  Bed, 
  PlusCircle, 
  DoorOpen, 
  ScrollText, 
  TrendingUp, 
  Globe, 
  BarChart3, 
  MapPin, 
  BrushIcon, 
  Wrench, 
  Cpu, 
  Shirt, 
  Package, 
  ShoppingCart, 
  Building2, 
  ChefHat, 
  Receipt, 
  Moon, 
  Banknote, 
  IndianRupee, 
  Users, 
  Crown, 
  Brain, 
  Wifi, 
  Shield, 
  Settings 
} from 'lucide-react';
import { LiveClock } from '@/components/hotel/ui/LiveClock';
const WaveDecoration = ({ color }: { color: string }) => {
  const gradientId = `wave-grad-${color}`;
  const stopColor1 = color === 'indigo' ? '#00b0ff' : color === 'emerald' ? '#34d399' : '#fb7185';
  const stopColor2 = color === 'indigo' ? '#0052d4' : color === 'emerald' ? '#059669' : '#e11d48';

  return (
    <svg className="absolute bottom-0 right-0 opacity-10 w-24 pointer-events-none" viewBox="0 0 200 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M0,60 C40,80 80,40 120,60 C160,80 180,50 200,60 L200,100 L0,100 Z" fill={`url(#${gradientId})`} />
      <path d="M0,80 C50,100 150,50 200,80 L200,100 L0,100 Z" fill={`url(#${gradientId})`} opacity="0.6" />
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={stopColor1} />
          <stop offset="100%" stopColor={stopColor2} />
        </linearGradient>
      </defs>
    </svg>
  );
};

interface HotelModuleCardProps {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  desc: string;
  colorScheme: 'indigo' | 'emerald' | 'rose';
}

function HotelModuleCard({ name, href, icon: Icon, desc, colorScheme }: HotelModuleCardProps) {
  const colorMap = {
    indigo: {
      card: 'from-[#06244f] via-[#021633] to-[#000a1c] hover:border-[#00b0ff]/40 hover:shadow-[#00b0ff]/10',
      outerCircle: 'bg-[#00b0ff]/20 border-[#00b0ff]/30 shadow-[0_0_10px_rgba(0,176,255,0.3)]',
      innerCircle: 'from-[#00d0ff] to-[#0062ff] border-[#00d0ff]/50',
      line: 'bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.4)]',
      text: 'text-cyan-100/70',
      glow: 'bg-[#00b0ff]/5'
    },
    emerald: {
      card: 'from-[#023c2a] via-[#01281c] to-[#001710] hover:border-emerald-400/40 hover:shadow-emerald-950/20',
      outerCircle: 'bg-emerald-500/20 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.3)]',
      innerCircle: 'from-emerald-400 to-teal-600 border-emerald-300/40',
      line: 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.4)]',
      text: 'text-emerald-100/70',
      glow: 'bg-emerald-500/5'
    },
    rose: {
      card: 'from-[#4c0519] via-[#31000b] to-[#1c0004] hover:border-rose-400/40 hover:shadow-rose-950/20',
      outerCircle: 'bg-rose-500/20 border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.3)]',
      innerCircle: 'from-rose-400 to-purple-600 border-rose-300/40',
      line: 'bg-rose-400 shadow-[0_0_6px_rgba(251,113,133,0.4)]',
      text: 'text-rose-100/70',
      glow: 'bg-rose-500/5'
    }
  };

  const c = colorMap[colorScheme];

  return (
    <Link
      href={href}
      className={`group relative flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-gradient-to-br ${c.card} border border-white/10 hover:border-white/20 shadow-2xl overflow-hidden hover:scale-[1.015] active:scale-[0.99] transition-all duration-305 text-center min-h-[105px] w-full cursor-pointer select-none`}
    >
      {/* Decorative Dot Grid */}
      <div className="absolute top-2.5 right-2.5 grid grid-cols-5 gap-0.5 opacity-10">
        {Array.from({ length: 15 }).map((_, i) => (
          <div key={i} className="w-0.5 h-0.5 rounded-full bg-white" />
        ))}
      </div>

      {/* Decorative Waves */}
      <WaveDecoration color={colorScheme} />
      <div className={`absolute -bottom-10 -right-10 w-24 h-16 ${c.glow} rounded-full blur-xl transform rotate-12 transition-transform group-hover:scale-110`} />

      {/* Top: Glowing Icon Circle */}
      <div className="relative shrink-0">
        <div className={`w-11 h-11 rounded-full ${c.outerCircle} flex items-center justify-center border transition-all duration-300 group-hover:scale-105`}>
          <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${c.innerCircle} flex items-center justify-center border shadow-inner`}>
            <Icon className="text-white w-3.5 h-3.5 drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.35)]" />
          </div>
        </div>
      </div>

      {/* Bottom: Title Label */}
      <span className="text-[10px] font-black text-white group-hover:text-cyan-400 leading-tight px-1 uppercase tracking-tight truncate w-full relative z-10">
        {name}
      </span>
    </Link>
  );
}

const DEPARTMENTS = [
  {
    name: 'Front Office & Desk',
    emoji: '🏨',
    accent: 'text-sky-400',
    iconBg: 'bg-sky-500/10 text-sky-400 border border-sky-500/20',
    modules: [
      { name: 'Bookings Manager', href: '/hotel/bookings', icon: PlusCircle, desc: 'Manage reservations, planners, calendars & guest check-ins.' },
      { name: 'Room Availability', href: '/hotel/calendar', icon: Calendar, desc: 'Visual timeline of room availability & booking scheduler.' },
      { name: 'Check-Out Terminal', href: '/hotel/checkout', icon: DoorOpen, desc: 'Process checkout key returns & clear guest billing.' },
      { name: 'Email Bookings', href: '/hotel/email-bookings', icon: ScrollText, desc: 'Inspect and parse reservation emails automatically.' }
    ]
  },
  {
    name: 'Rooms & Housekeeping Operations',
    emoji: '🛏️',
    accent: 'text-violet-400',
    iconBg: 'bg-violet-500/10 text-violet-400 border border-violet-500/20',
    modules: [
      { name: 'Rooms & Types', href: '/hotel/rooms', icon: Bed, desc: 'Configure inventory, bed setups & pricing brackets.' },
      { name: 'Room Status Board', href: '/hotel/rooms/board', icon: MapPin, desc: 'Interactive room grid map and live occupancy status.' },
      { name: 'Housekeeping Console', href: '/hotel/housekeeping', icon: BrushIcon, desc: 'Cleanliness tracking, staff duties & cleaner tasks.' },
      { name: 'Maintenance Control', href: '/hotel/maintenance', icon: Wrench, desc: 'File repair tickets, track logs & block rooms for service.' },
      { name: 'Lost & Found Registry', href: '/hotel/lost-found', icon: MapPin, desc: 'Log found items, register guest claims & archive statuses.' },
      { name: 'Laundry Service', href: '/hotel/laundry', icon: Shirt, desc: 'Linen counts, dry cleaning logs & chemical tracking.' },
      { name: 'Engineering Center', href: '/hotel/engineering', icon: Cpu, desc: 'Diagnostics logs, utility runs & facility settings.' }
    ]
  },
  {
    name: 'Hospitality & Guest Services',
    emoji: '✨',
    accent: 'text-pink-400',
    iconBg: 'bg-pink-500/10 text-pink-400 border border-pink-500/20',
    modules: [
      { name: 'Spa & Wellness', href: '/hotel/spa', icon: Sparkles, desc: 'Spa services schedules, massages booking & therapist logs.' },
      { name: 'Banquet & Events', href: '/hotel/banquet', icon: Calendar, desc: 'Convention hall bookings, layout planning & menus.' },
      { name: 'Live Music & Singers', href: '/hotel/singers', icon: Sparkles, desc: 'Manage hotel singers profile, posts, videos, and performance schedules.' },
      { name: 'Room Service Dining', href: '/hotel/room-service', icon: ChefHat, desc: 'F&B room service logs, dining orders & delivery tracking.' },
      { name: 'Guest CRM Profiles', href: '/hotel/crm', icon: Users, desc: '360° guest records, preferences & booking history.' },
      { name: 'Guest Directory', href: '/hotel/guests', icon: Users, desc: 'Unified registrations database, ID documents & contacts.' },
      { name: 'Loyalty & Rewards', href: '/hotel/loyalty', icon: Crown, desc: 'Tier rules, loyalty points & gift claims configuration.' }
    ]
  },
  {
    name: 'Revenue & Analytics',
    emoji: '📈',
    accent: 'text-emerald-400',
    iconBg: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    modules: [
      { name: 'AI Revenue Advisor', href: '/hotel/revenue', icon: TrendingUp, desc: 'AI dynamic pricing suggestions, occupancy forecasts & RevPAR.' },
      { name: 'Channel Manager', href: '/hotel/channel-manager', icon: Globe, desc: 'Real-time synchronization of rates & rooms to Booking/OTAs.' },
      { name: 'Analytics & BI', href: '/hotel/analytics', icon: BarChart3, desc: 'ADR, RevPAR, average occupancy statistics & reports.' },
      { name: 'Operations Reports', href: '/hotel/reports', icon: ScrollText, desc: 'Export financial logs, night audits & tax summaries.' }
    ]
  },
  {
    name: 'Finance & Procurement',
    emoji: '💰',
    accent: 'text-amber-400',
    iconBg: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    modules: [
      { name: 'Folios & Billing', href: '/hotel/billing', icon: Receipt, desc: 'Split billing, guest folios & room charges posting.' },
      { name: 'Invoices Registry', href: '/hotel/billing/invoices', icon: ScrollText, desc: 'GST invoice logs, tax audits & print records.' },
      { name: 'Night Audit Console', href: '/hotel/night-audit', icon: Moon, desc: 'End-of-day closing checkups & PMS system reconciliation.' },
      { name: 'Expenses Controller', href: '/hotel/billing/expenses', icon: Banknote, desc: 'Track operating expenses, vendor bills & petty cash.' },
      { name: 'Payroll Structures', href: '/hotel/payroll', icon: IndianRupee, desc: 'Calculate crew pay rates, allowances & payouts.' },
      { name: 'Inventory Supplies', href: '/hotel/inventory', icon: Package, desc: 'Supplies store stocks logs, restocking alerts & chemical lists.' },
      { name: 'Purchase Orders', href: '/hotel/purchasing', icon: ShoppingCart, desc: 'Create PO workflows, supplier lists & billing checks.' },
      { name: 'Vendor Directory', href: '/hotel/vendor', icon: Building2, desc: 'Database of hotel suppliers & contract catalogs.' }
    ]
  },
  {
    name: 'AI Integration & Smart Hotel',
    emoji: '🤖',
    accent: 'text-indigo-400',
    iconBg: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
    modules: [
      { name: 'AI Concierge Desk', href: '/hotel/ai-concierge', icon: Brain, desc: 'Automated guest chat triggers, portal rules & Q&A.' },
      { name: 'Smart Hotel IoT', href: '/hotel/smart-hotel', icon: Wifi, desc: 'Smart room logs, IoT door locks & utility automation.' },
      { name: 'Booking Engine', href: '/hotel/booking-engine', icon: Globe, desc: 'Configure pricing rules for direct website engines.' }
    ]
  },
  {
    name: 'System Admin & Security',
    emoji: '🔐',
    accent: 'text-slate-400',
    iconBg: 'bg-slate-500/10 text-slate-400 border border-slate-500/20',
    modules: [
      { name: 'Staff Management', href: '/hotel/staff', icon: Users, desc: 'Roster setups, shift schedules & task assignments.' },
      { name: 'HR Management', href: '/hotel/hr', icon: Users, desc: 'Crew contracts registry, attendance & document storage.' },
      { name: 'Security Center', href: '/hotel/security', icon: Shield, desc: 'User logs auditing, permissions configurations & logins.' },
      { name: 'Super Admin Settings', href: '/hotel/super-admin', icon: Crown, desc: 'SaaS multi-property subscription & database controls.' },
      { name: 'Hotel Settings', href: '/hotel/settings', icon: Settings, desc: 'Property branding settings, tax codes & layouts.' }
    ]
  }
];

export default function HotelDashboard() {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter departments and modules based on the search query
  const filteredDepartments = DEPARTMENTS.map((dept) => {
    const matchingModules = dept.modules.filter((m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dept.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return { ...dept, modules: matchingModules };
  }).filter((dept) => dept.modules.length > 0);

  return (
    <div className="space-y-6 pb-12 max-w-[1600px] mx-auto select-none">
      
      {/* Top Header Row */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">
              Live Console · GuestFlow AI
            </span>
          </div>
          <h1 className="text-lg font-black text-white">
            Property Management System
          </h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        
        {/* Right Action Tray: Clock, Search & New Booking Button */}
        <div className="flex items-center gap-3 flex-wrap">
          <LiveClock className="text-xs text-indigo-300 font-bold mr-2" />
          
          {/* Compact Quick-Search Bar */}
          <div className="relative w-64 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-3.5 h-3.5" />
            <input
              type="text"
              placeholder="Search pages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-8 py-1.5 bg-[#0f172a]/60 border border-slate-800 focus:border-indigo-500 focus:outline-none text-white text-xs font-semibold placeholder-slate-600 rounded-xl transition-all shadow-inner focus:ring-1 focus:ring-indigo-500/20"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors cursor-pointer"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <Link href="/hotel/bookings"
            className="flex items-center gap-1.5 h-8.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 shadow-md shadow-indigo-950/40">
            + New Booking
          </Link>
        </div>
      </div>

      {/* Department & Modules Grid */}
      <div className="space-y-10">
        {filteredDepartments.length === 0 ? (
          <div className="py-20 text-center rounded-3xl bg-[#0c1020]/40 border border-slate-800/80 text-slate-500 text-sm font-semibold max-w-md mx-auto">
            🔍 No modules match "{searchQuery}"
            <p className="text-[10px] text-slate-600 font-bold mt-1 uppercase tracking-wider">Try typing front, desk, bills, room or spa</p>
          </div>
        ) : (
          filteredDepartments.map((dept) => (
            <div key={dept.name} className="space-y-6">
              {/* Department Heading */}
              <div className="flex items-center gap-3">
                <div className="h-5 w-1 rounded-full bg-indigo-500" />
                <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest">
                  {dept.name}
                </h3>
              </div>

              {/* Modules Launch Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                {dept.modules.map((mod) => (
                  <HotelModuleCard
                    key={mod.name}
                    name={mod.name}
                    href={mod.href}
                    icon={mod.icon}
                    desc={mod.desc}
                    colorScheme="indigo"
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
