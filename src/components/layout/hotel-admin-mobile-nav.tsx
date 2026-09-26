'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import {
  LayoutDashboard, BedDouble, CalendarDays, Sparkles, Grid,
  X, Users, CreditCard, TrendingUp, BarChart2, Coffee,
  BookOpen, Settings, ChevronRight, ShieldCheck, Hotel
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const HotelAdminMobileNav: React.FC = () => {
  const pathname = usePathname();
  const params = useParams();
  const propertyCode = (params?.propertyCode as string) || '';
  const p = propertyCode ? `/${propertyCode}` : '';

  const [menuOpen, setMenuOpen] = useState(false);

  const mainTabs = [
    {
      name: 'Overview',
      path: `${p}/hoteladmin`,
      icon: LayoutDashboard,
      exact: true,
    },
    {
      name: 'Rooms',
      path: `${p}/hoteladmin/rooms`,
      icon: BedDouble,
    },
    {
      name: 'Bookings',
      path: `${p}/hoteladmin/bookings`,
      icon: CalendarDays,
    },
    {
      name: 'Clean',
      path: `${p}/hoteladmin/housekeeping`,
      icon: Sparkles,
    },
  ];

  const moreItems = [
    { name: 'Guest Directory', path: `${p}/hoteladmin/guests`, icon: Users, desc: 'Profiles & VIP history' },
    { name: 'Billing & Folios', path: `${p}/hoteladmin/billing`, icon: CreditCard, desc: 'Invoices & dues' },
    { name: 'Revenue Analytics', path: `${p}/hoteladmin/revenue`, icon: TrendingUp, desc: 'ADR, RevPAR & sales' },
    { name: 'Daily Reports', path: `${p}/hoteladmin/reports`, icon: BarChart2, desc: 'Audit & occupancy' },
    { name: 'Restaurant & F&B', path: `${p}/hoteladmin/restaurant`, icon: Coffee, desc: 'Room service orders' },
    { name: 'Staff Attendance', path: `${p}/hoteladmin/staff`, icon: Users, desc: 'Clock-in & shift status' },
    { name: 'Accounts Ledger', path: `${p}/hoteladmin/accounts`, icon: BookOpen, desc: 'Petty cash & expenses' },
    { name: 'Property Settings', path: `${p}/hoteladmin/settings`, icon: Settings, desc: 'Policies & configuration' },
  ];

  const isMoreActive = moreItems.some((item) => pathname.startsWith(item.path));

  return (
    <>
      {/* ── Native App Bottom Navigation Bar (Mobile Only) ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#070b14]/95 backdrop-blur-xl border-t border-slate-800/80 px-2 py-1.5 shadow-[0_-8px_30px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {mainTabs.map((tab) => {
            const isActive = tab.exact ? pathname === tab.path : pathname.startsWith(tab.path);
            const Icon = tab.icon;

            return (
              <Link
                key={tab.name}
                href={tab.path}
                className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200 active:scale-90 ${
                  isActive
                    ? 'text-amber-400 font-black'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div
                  className={`p-1 rounded-xl transition-all ${
                    isActive ? 'bg-amber-500/20 text-amber-400 shadow-sm' : ''
                  }`}
                >
                  <Icon size={20} className={isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'} />
                </div>
                <span className="text-[10px] mt-0.5 tracking-tight font-bold">
                  {tab.name}
                </span>
              </Link>
            );
          })}

          {/* More / Menu Button */}
          <button
            onClick={() => setMenuOpen(true)}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200 active:scale-90 ${
              isMoreActive || menuOpen
                ? 'text-amber-400 font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div
              className={`p-1 rounded-xl transition-all ${
                isMoreActive || menuOpen ? 'bg-amber-500/20 text-amber-400' : ''
              }`}
            >
              <Grid size={20} className={isMoreActive || menuOpen ? 'stroke-[2.5]' : 'stroke-[1.8]'} />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-bold">
              Hub
            </span>
          </button>
        </div>
      </nav>

      {/* ── Native App Bottom Sheet Modal for "Hub / More" ── */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-[60]"
            />

            {/* Slide-up Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="lg:hidden fixed bottom-0 left-0 right-0 z-[70] bg-[#0c1220] border-t border-slate-800 rounded-t-[32px] p-5 pb-8 shadow-2xl max-h-[85vh] overflow-y-auto no-scrollbar"
            >
              {/* Grab handle */}
              <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-4" />

              {/* Title & Close */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                    <Hotel size={16} className="text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">Hotel Admin Modules</h3>
                    <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Owner Portal</p>
                  </div>
                </div>

                <button
                  onClick={() => setMenuOpen(false)}
                  className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Grid of options */}
              <div className="grid grid-cols-2 gap-2.5">
                {moreItems.map((item) => {
                  const isActive = pathname.startsWith(item.path);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.name}
                      href={item.path}
                      onClick={() => setMenuOpen(false)}
                      className={`p-3.5 rounded-2xl border transition-all active:scale-95 flex flex-col justify-between ${
                        isActive
                          ? 'bg-amber-500/15 border-amber-500/30 text-white'
                          : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className={`p-2 rounded-xl ${isActive ? 'bg-amber-500 text-black' : 'bg-slate-800 text-amber-400'}`}>
                          <Icon size={18} />
                        </div>
                        <ChevronRight size={14} className="text-slate-600" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-white">{item.name}</p>
                        <p className="text-[9px] text-slate-400 mt-0.5 line-clamp-1">{item.desc}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
