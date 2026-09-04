'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles, Search, X, Calendar, Bed, PlusCircle, DoorOpen, ScrollText,
  TrendingUp, Globe, BarChart3, MapPin, BrushIcon, Wrench, Cpu, Shirt,
  Package, Building2, ChefHat, Receipt, Moon, Banknote,
  IndianRupee, Users, Crown, Brain, Wifi, Shield, Settings,
  ChevronDown, Hotel, LayoutGrid, Star, Handshake, BookOpen,
} from 'lucide-react';
import { LiveClock } from '@/components/hotel/ui/LiveClock';

/* ─── Module sub-card (same as before) ─── */
function ModuleCard({ name, href, icon: Icon, iconColor, iconBg, cardBorder }: {
  name: string; href: string; icon: React.ComponentType<any>;
  iconColor: string; iconBg: string; cardBorder: string;
}) {
  return (
    <Link
      href={href}
      className={`group relative flex flex-col items-center justify-center gap-2.5 p-4 rounded-2xl bg-[#0f172a] border ${cardBorder} hover:bg-[#131f35] transition-all duration-200 text-center min-h-[100px] w-full cursor-pointer overflow-hidden`}
    >
      <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center transition-transform duration-200 group-hover:scale-110`}>
        <Icon className={`w-[18px] h-[18px] ${iconColor}`} strokeWidth={1.8} />
      </div>
      <span className="text-[11px] font-semibold text-slate-300 group-hover:text-white leading-tight px-1 transition-colors line-clamp-2">
        {name}
      </span>
    </Link>
  );
}

const DEPARTMENTS = [
  {
    name: 'Front Office & Desk',
    emoji: '🏨',
    labelColor: 'text-sky-400',
    dotColor: 'bg-sky-400',
    glowColor: 'rgba(56,189,248,0.3)',
    borderActive: 'rgba(56,189,248,0.55)',
    borderIdle: 'rgba(56,189,248,0.13)',
    gradFrom: 'rgba(56,189,248,0.13)',
    gradTo: 'rgba(56,189,248,0.04)',
    iconColor: 'text-sky-400',
    iconBg: 'bg-sky-500/15',
    cardBorder: 'border-slate-800 hover:border-sky-500/40',
    modules: [
      { name: 'Bookings Manager',   href: '/hotel/bookings',        icon: PlusCircle },
      { name: 'Agent Bookings',      href: '/hotel/agent-bookings',  icon: Handshake  },
      { name: 'Room Availability',   href: '/hotel/calendar',        icon: Calendar   },
      { name: 'Check-Out Terminal',  href: '/hotel/checkout',        icon: DoorOpen   },
      { name: 'Email Bookings',      href: '/hotel/email-bookings',  icon: ScrollText },
    ],
  },
  {
    name: 'Rooms & Housekeeping',
    emoji: '🛏️',
    labelColor: 'text-violet-400',
    dotColor: 'bg-violet-400',
    glowColor: 'rgba(167,139,250,0.3)',
    borderActive: 'rgba(167,139,250,0.55)',
    borderIdle: 'rgba(167,139,250,0.13)',
    gradFrom: 'rgba(167,139,250,0.13)',
    gradTo: 'rgba(167,139,250,0.04)',
    iconColor: 'text-violet-400',
    iconBg: 'bg-violet-500/15',
    cardBorder: 'border-slate-800 hover:border-violet-500/40',
    modules: [
      { name: 'Rooms & Types',         href: '/hotel/rooms',        icon: Bed       },
      { name: 'Housekeeping Console',  href: '/hotel/housekeeping', icon: BrushIcon },
      { name: 'Maintenance Control',   href: '/hotel/maintenance',  icon: Wrench    },
      { name: 'Lost & Found Registry', href: '/hotel/lost-found',   icon: MapPin    },
      { name: 'Laundry Service',       href: '/hotel/laundry',      icon: Shirt     },
      { name: 'Engineering Center',    href: '/hotel/engineering',  icon: Cpu       },
    ],
  },
  {
    name: 'Hospitality & Guest Services',
    emoji: '✨',
    labelColor: 'text-rose-400',
    dotColor: 'bg-rose-400',
    glowColor: 'rgba(251,113,133,0.3)',
    borderActive: 'rgba(251,113,133,0.55)',
    borderIdle: 'rgba(251,113,133,0.13)',
    gradFrom: 'rgba(251,113,133,0.13)',
    gradTo: 'rgba(251,113,133,0.04)',
    iconColor: 'text-rose-400',
    iconBg: 'bg-rose-500/15',
    cardBorder: 'border-slate-800 hover:border-rose-500/40',
    modules: [
      { name: 'Spa & Wellness',       href: '/hotel/spa',          icon: Sparkles },
      { name: 'Banquet & Events',     href: '/hotel/banquet',      icon: Calendar },
      { name: 'Live Music & Singers', href: '/hotel/singers',      icon: Sparkles },
      { name: 'Room Service Dining',  href: '/hotel/room-service', icon: ChefHat  },
      { name: 'Guest CRM Profiles',   href: '/hotel/crm',          icon: Users    },
      { name: 'Guest Directory',      href: '/hotel/guests',       icon: Users    },
      { name: 'Loyalty & Rewards',    href: '/hotel/loyalty',      icon: Crown    },
    ],
  },
  {
    name: 'Revenue & Analytics',
    emoji: '📈',
    labelColor: 'text-emerald-400',
    dotColor: 'bg-emerald-400',
    glowColor: 'rgba(52,211,153,0.3)',
    borderActive: 'rgba(52,211,153,0.55)',
    borderIdle: 'rgba(52,211,153,0.13)',
    gradFrom: 'rgba(52,211,153,0.13)',
    gradTo: 'rgba(52,211,153,0.04)',
    iconColor: 'text-emerald-400',
    iconBg: 'bg-emerald-500/15',
    cardBorder: 'border-slate-800 hover:border-emerald-500/40',
    modules: [
      { name: 'AI Revenue Advisor', href: '/hotel/revenue',         icon: TrendingUp },
      { name: 'Channel Manager',    href: '/hotel/channel-manager', icon: Globe      },
      { name: 'Analytics & BI',     href: '/hotel/analytics',       icon: BarChart3  },
      { name: 'Operations Reports', href: '/hotel/reports',         icon: ScrollText },
    ],
  },
  {
    name: 'Finance & Procurement',
    emoji: '💰',
    labelColor: 'text-amber-400',
    dotColor: 'bg-amber-400',
    glowColor: 'rgba(251,191,36,0.3)',
    borderActive: 'rgba(251,191,36,0.55)',
    borderIdle: 'rgba(251,191,36,0.13)',
    gradFrom: 'rgba(251,191,36,0.13)',
    gradTo: 'rgba(251,191,36,0.04)',
    iconColor: 'text-amber-400',
    iconBg: 'bg-amber-500/15',
    cardBorder: 'border-slate-800 hover:border-amber-500/40',
    modules: [
      { name: 'Folios & Billing',    href: '/hotel/billing',           icon: Receipt     },
      { name: 'Invoices Registry',   href: '/hotel/billing/invoices',  icon: ScrollText  },
      { name: 'Night Audit Console', href: '/hotel/night-audit',       icon: Moon        },
      { name: 'Expenses Controller', href: '/hotel/expenses',          icon: Banknote    },
      { name: 'Add New Expense',     href: '/hotel/expenses/new',      icon: PlusCircle  },
      { name: 'Payroll Structures',  href: '/hotel/payroll',           icon: IndianRupee },
      { name: 'Inventory & Stock',   href: '/hotel/inventory',         icon: Package     },
      { name: 'Vendor Directory',    href: '/hotel/vendor',            icon: Building2   },
      { name: 'Accounting Hub',      href: '/hotel/accounts',          icon: BookOpen    },
      { name: 'Cash Book',           href: '/hotel/accounts/cash-book', icon: Banknote   },
      { name: 'Day Book',            href: '/hotel/accounts/day-book',  icon: BookOpen   },
      { name: 'Ledger',              href: '/hotel/accounts/ledger',    icon: BookOpen   },
      { name: 'Vouchers',            href: '/hotel/vouchers',           icon: Receipt    },
      { name: 'New Voucher',         href: '/hotel/vouchers/new',       icon: PlusCircle },
    ],
  },
  {
    name: 'AI & Smart Hotel',
    emoji: '🤖',
    labelColor: 'text-indigo-400',
    dotColor: 'bg-indigo-400',
    glowColor: 'rgba(129,140,248,0.3)',
    borderActive: 'rgba(129,140,248,0.55)',
    borderIdle: 'rgba(129,140,248,0.13)',
    gradFrom: 'rgba(129,140,248,0.13)',
    gradTo: 'rgba(129,140,248,0.04)',
    iconColor: 'text-indigo-400',
    iconBg: 'bg-indigo-500/15',
    cardBorder: 'border-slate-800 hover:border-indigo-500/40',
    modules: [
      { name: 'AI Concierge Desk', href: '/hotel/ai-concierge',   icon: Brain },
      { name: 'Smart Hotel IoT',   href: '/hotel/smart-hotel',    icon: Wifi  },
      { name: 'Booking Engine',    href: '/hotel/booking-engine', icon: Globe },
    ],
  },
  {
    name: 'System Admin & Security',
    emoji: '🔐',
    labelColor: 'text-slate-400',
    dotColor: 'bg-slate-500',
    glowColor: 'rgba(148,163,184,0.2)',
    borderActive: 'rgba(148,163,184,0.45)',
    borderIdle: 'rgba(148,163,184,0.1)',
    gradFrom: 'rgba(148,163,184,0.1)',
    gradTo: 'rgba(148,163,184,0.03)',
    iconColor: 'text-slate-400',
    iconBg: 'bg-slate-700/40',
    cardBorder: 'border-slate-800 hover:border-slate-600/60',
    modules: [
      { name: 'Staff & Team',         href: '/hotel/staff',       icon: Users    },
      { name: 'Security Center',      href: '/hotel/security',    icon: Shield   },
      { name: 'Super Admin Settings', href: '/hotel/super-admin', icon: Crown    },
      { name: 'Hotel Settings',       href: '/hotel/settings',    icon: Settings },
    ],
  },
];

export default function HotelDashboard() {
  const [searchQuery, setSearchQuery]   = useState('');
  const [activeDept, setActiveDept]     = useState<string | null>(null);
  const [session, setSession]           = useState<any>(null);
  const [property, setProperty]         = useState<any>(null);

  useEffect(() => {
    fetch('/api/auth/session')
      .then(r => r.json())
      .then(d => { if (d.authenticated) setSession(d.user); })
      .catch(() => {});
    fetch('/api/setup/properties/current')
      .then(r => r.json())
      .then(d => { if (d.success) setProperty(d.data); })
      .catch(() => {});
  }, []);

  const isSearching = searchQuery.trim().length > 0;

  const filteredDepartments = DEPARTMENTS.map((dept) => {
    const matchingModules = dept.modules.filter((m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dept.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return { ...dept, modules: matchingModules };
  }).filter((dept) => dept.modules.length > 0);

  const toggle = (name: string) =>
    setActiveDept(prev => (prev === name ? null : name));

  // Greeting based on time
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const greetingEmoji = hour < 12 ? '🌅' : hour < 17 ? '☀️' : '🌙';

  const hotelName = property?.name || session?.organizationName || 'Your Hotel';
  const userName  = session?.fullName || session?.name || 'Admin';

  return (
    <div className="pb-12 max-w-[1500px] mx-auto select-none">

      {/* ── Premium Welcome Header ── */}
      <div className="relative mb-8 overflow-hidden rounded-3xl" style={{
        background: 'linear-gradient(135deg, #0d1117 0%, #0f172a 50%, #0d1525 100%)',
        border: '1px solid rgba(99,102,241,0.15)',
      }}>
        {/* Rich background layers */}
        <div className="pointer-events-none absolute inset-0"
          style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.18) 0%, transparent 55%, rgba(139,92,246,0.10) 100%)' }} />
        {/* Grid pattern */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg,#fff 0,#fff 1px,transparent 1px,transparent 40px),repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 1px,transparent 40px)' }} />
        {/* Glow orb top-left */}
        <div className="pointer-events-none absolute -top-16 -left-16 w-72 h-72 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.35) 0%, transparent 65%)', filter: 'blur(2px)' }} />
        {/* Glow orb bottom-right */}
        <div className="pointer-events-none absolute -bottom-12 -right-12 w-56 h-56 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.25) 0%, transparent 65%)', filter: 'blur(2px)' }} />

        {/* ── 3-column grid layout ── */}
        <div className="relative grid grid-cols-3 items-center px-7 py-6 min-h-[120px]">

          {/* COL 1 — Left: breadcrumb + date/time */}
          <div className="flex flex-col justify-center gap-2">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.25em]">
                GuestFlow &nbsp;·&nbsp; Hotel PMS
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-500 font-medium">
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
            <span className="inline-flex items-center gap-1.5 w-fit px-2.5 py-0.5 rounded-full text-[10px] font-bold text-emerald-400"
              style={{ background: 'rgba(52,211,153,0.10)', border: '1px solid rgba(52,211,153,0.20)' }}>
              <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
              <LiveClock className="tabular-nums" />
              &nbsp;Live
            </span>
          </div>

          {/* COL 2 — CENTER: greeting + hotel name */}
          <div className="flex flex-col items-center justify-center text-center gap-2">
            {/* Greeting */}
            <div className="flex items-center gap-1.5">
              <span className="text-base leading-none">{greetingEmoji}</span>
              <span className="text-sm font-semibold" style={{ color: 'rgba(165,180,252,0.85)' }}>
                {greeting}, <span className="font-black text-indigo-300">{userName}!</span>
              </span>
            </div>

            {/* Hotel Name — hero, centered */}
            <h1
              className="font-black leading-none tracking-tight"
              style={{
                fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)',
                background: 'linear-gradient(110deg, #ffffff 0%, #c7d2fe 45%, #a78bfa 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
              {hotelName}
            </h1>

            {/* Gold Premium badge */}
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black text-amber-300"
              style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.25)' }}>
              <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
              Premium Hotel
            </span>
          </div>

          {/* COL 3 — Right: search + New Booking */}
          <div className="flex items-center justify-end gap-2.5">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
              <input
                type="text"
                placeholder="Search modules..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-44 pl-9 pr-7 text-[12px] font-medium text-white placeholder-slate-600 rounded-xl outline-none transition-all duration-200"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: searchQuery ? '1px solid rgba(99,102,241,0.6)' : '1px solid rgba(255,255,255,0.09)',
                  boxShadow: searchQuery ? '0 0 0 3px rgba(99,102,241,0.15), inset 0 1px 3px rgba(0,0,0,0.3)' : 'inset 0 1px 3px rgba(0,0,0,0.2)',
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300 transition-colors"
                >
                  <X size={11} />
                </button>
              )}
            </div>

            {/* New Booking */}
            <Link
              href="/hotel/bookings"
              className="relative group h-10 flex items-center gap-2 px-5 rounded-xl text-[12px] font-black text-white overflow-hidden transition-all duration-200 active:scale-95 flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)',
                boxShadow: '0 0 0 1px rgba(99,102,241,0.4), 0 6px 24px rgba(99,102,241,0.35), inset 0 1px 0 rgba(255,255,255,0.18)',
              }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 0 0 1px rgba(99,102,241,0.6), 0 8px 32px rgba(99,102,241,0.5), inset 0 1px 0 rgba(255,255,255,0.18)')}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 0 0 1px rgba(99,102,241,0.4), 0 6px 24px rgba(99,102,241,0.35), inset 0 1px 0 rgba(255,255,255,0.18)')}
            >
              <span className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)' }} />
              <PlusCircle size={14} className="flex-shrink-0 relative z-10" />
              <span className="relative z-10 tracking-wide">New Booking</span>
            </Link>
          </div>
        </div>

        {/* Thin accent line at bottom */}
        <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, rgba(99,102,241,0.5) 0%, rgba(139,92,246,0.3) 50%, transparent 100%)' }} />
      </div>

      {/* ── Search mode: flat expanded results ── */}
      {isSearching ? (
        filteredDepartments.length === 0 ? (
          <div className="py-20 text-center rounded-2xl border border-slate-800 text-slate-500 text-sm">
            🔍 No results for &quot;{searchQuery}&quot;
            <p className="text-xs text-slate-600 mt-1">Try: bookings, rooms, billing, spa…</p>
          </div>
        ) : (
          <div className="space-y-8">
            {filteredDepartments.map((dept) => (
              <div key={dept.name}>
                <div className="flex items-center gap-2.5 mb-4">
                  <span className={`w-2 h-2 rounded-full ${dept.dotColor}`} />
                  <span className={`text-xs font-bold uppercase tracking-widest ${dept.labelColor}`}>{dept.name}</span>
                  <div className="flex-1 h-px bg-slate-800" />
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                  {dept.modules.map((mod) => (
                    <ModuleCard key={mod.name} name={mod.name} href={mod.href} icon={mod.icon}
                      iconColor={dept.iconColor} iconBg={dept.iconBg} cardBorder={dept.cardBorder} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* ── Normal mode ── */
        <div className="space-y-3">

          {/* Step 1 — 7 Category Boxes in a grid (always visible) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-2">
            {DEPARTMENTS.map((dept) => {
              const isActive = activeDept === dept.name;
              return (
                <button
                  key={dept.name}
                  onClick={() => toggle(dept.name)}
                  className="group relative flex flex-col items-center justify-center gap-2 p-4 rounded-2xl transition-all duration-300 text-center cursor-pointer active:scale-95"
                  style={{
                    background: isActive
                      ? `linear-gradient(135deg, ${dept.gradFrom} 0%, ${dept.gradTo} 100%)`
                      : 'rgba(15,23,42,0.85)',
                    border: `1px solid ${isActive ? dept.borderActive : dept.borderIdle}`,
                    boxShadow: isActive ? `0 0 24px ${dept.glowColor}` : 'none',
                  }}
                >
                  {/* Emoji */}
                  <span className="text-2xl leading-none">{dept.emoji}</span>
                  {/* Name */}
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wide leading-tight transition-colors ${isActive ? dept.labelColor : 'text-slate-500 group-hover:text-slate-300'}`}
                  >
                    {dept.name}
                  </span>
                  {/* Module count badge */}
                  <span
                    className="text-[9px] font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      background: isActive ? dept.gradFrom : 'rgba(255,255,255,0.05)',
                      color: isActive ? 'white' : 'rgb(100,116,139)',
                      border: `1px solid ${isActive ? dept.borderActive : 'rgba(255,255,255,0.07)'}`,
                    }}
                  >
                    {dept.modules.length} modules
                  </span>
                  {/* Active indicator dot */}
                  {isActive && (
                    <span
                      className={`absolute bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${dept.dotColor}`}
                      style={{ boxShadow: `0 0 6px ${dept.glowColor}` }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Step 2 — Expanded modules panel (slides open below grid) */}
          {DEPARTMENTS.map((dept) => {
            const isActive = activeDept === dept.name;
            return (
              <div
                key={dept.name}
                style={{
                  maxHeight: isActive ? '800px' : '0px',
                  overflow: 'hidden',
                  transition: 'max-height 0.4s cubic-bezier(0.4,0,0.2,1)',
                  marginTop: isActive ? '4px' : '0px',
                }}
              >
                {/* Panel header */}
                <div
                  className="rounded-2xl p-4"
                  style={{
                    background: `linear-gradient(135deg, ${dept.gradFrom} 0%, rgba(9,14,26,0.95) 100%)`,
                    border: `1px solid ${dept.borderActive}`,
                    boxShadow: `0 4px 32px ${dept.glowColor}`,
                  }}
                >
                  {/* Panel label */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`w-2 h-2 rounded-full ${dept.dotColor}`} />
                    <span className={`text-xs font-bold uppercase tracking-widest ${dept.labelColor}`}>
                      {dept.name}
                    </span>
                    <div className="flex-1 h-px" style={{ background: dept.borderActive }} />
                    <button
                      onClick={() => toggle(dept.name)}
                      className="text-slate-500 hover:text-slate-300 transition-colors p-1"
                    >
                      <ChevronDown size={13} style={{ transform: 'rotate(180deg)' }} />
                    </button>
                  </div>

                  {/* Sub-module cards grid */}
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                    {dept.modules.map((mod) => (
                      <ModuleCard
                        key={mod.name}
                        name={mod.name}
                        href={mod.href}
                        icon={mod.icon}
                        iconColor={dept.iconColor}
                        iconBg={dept.iconBg}
                        cardBorder={dept.cardBorder}
                      />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
