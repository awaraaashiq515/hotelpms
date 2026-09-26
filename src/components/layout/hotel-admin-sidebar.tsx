'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LogOut, X, Hotel, LayoutDashboard, BedDouble, Users, CalendarDays,
  ClipboardList, TrendingUp, Settings, ChevronDown, ChevronRight,
  Sparkles, CreditCard, PackageSearch, BarChart2, UserCheck,
  BookOpen, Wrench, Coffee, ShieldCheck, Bell, Building2, Receipt,
  DoorOpen, Moon
} from 'lucide-react';
import { useSidebar } from '@/context/sidebar-context';

interface HotelNavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  badge?: number;
  subItems?: { name: string; path: string }[];
}

export const HotelAdminSidebar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const { isOpen, close } = useSidebar();
  const [session, setSession] = useState<any>(null);
  const [property, setProperty] = useState<any>(null);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const propertyCode = (params?.propertyCode as string) || '';

  React.useEffect(() => {
    fetch('/api/auth/session')
      .then(r => r.json())
      .then(d => { if (d.authenticated) setSession(d.user); })
      .catch(() => {});

    fetch('/api/setup/properties/current')
      .then(r => r.json())
      .then(d => { if (d.success) setProperty(d.data); })
      .catch(() => {});
  }, []);

  const toggleGroup = (name: string) =>
    setOpenGroups(prev => ({ ...prev, [name]: !prev[name] }));

  const handleLogout = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST' }); } catch {}
    router.push('/login');
    router.refresh();
  };

  // ── Hotel Admin Navigation Menu ──────────────────────────────────────────────
  const p = propertyCode ? `/${propertyCode}` : '';
  const hotelMenu: HotelNavItem[] = [
    // ── Live Command Center ──
    {
      name: 'Live Dashboard',
      path: `${p}/hoteladmin`,
      icon: LayoutDashboard,
    },
    // ── Rooms & Inventory ──
    {
      name: 'Rooms & Occupancy',
      path: `${p}/hoteladmin/rooms`,
      icon: BedDouble,
      subItems: [
        { name: 'All Rooms', path: `${p}/hoteladmin/rooms` },
        { name: 'Occupancy Board', path: `${p}/hoteladmin/rooms?view=board` },
      ],
    },
    // ── Reservations & Bookings ──
    {
      name: 'Reservations',
      path: `${p}/hoteladmin/bookings`,
      icon: CalendarDays,
      subItems: [
        { name: 'All Bookings', path: `${p}/hoteladmin/bookings` },
        { name: 'In-House (Checked In)', path: `${p}/hoteladmin/bookings?status=CHECKED_IN` },
        { name: 'Upcoming (Confirmed)', path: `${p}/hoteladmin/bookings?status=CONFIRMED` },
        { name: 'Completed Check-outs', path: `${p}/hoteladmin/bookings?status=CHECKED_OUT` },
      ],
    },
    // ── Guest Directory ──
    {
      name: 'Guest Directory',
      path: `${p}/hoteladmin/guests`,
      icon: UserCheck,
      subItems: [
        { name: 'All Guests', path: `${p}/hoteladmin/guests` },
        { name: 'VIP Guests', path: `${p}/hoteladmin/guests?filter=vip` },
      ],
    },
    // ── Housekeeping ──
    {
      name: 'Housekeeping',
      path: `${p}/hoteladmin/housekeeping`,
      icon: Sparkles,
      subItems: [
        { name: 'Cleaning Status', path: `${p}/hoteladmin/housekeeping` },
        { name: 'Dirty Rooms Queue', path: `${p}/hoteladmin/housekeeping?status=DIRTY` },
      ],
    },
    // ── Billing & Invoices ──
    {
      name: 'Billing & Folios',
      path: `${p}/hoteladmin/billing`,
      icon: CreditCard,
      subItems: [
        { name: 'All Invoices', path: `${p}/hoteladmin/billing` },
        { name: 'Pending Payments', path: `${p}/hoteladmin/billing?status=PENDING` },
      ],
    },
    // ── Revenue Analytics ──
    {
      name: 'Revenue & Finance',
      path: `${p}/hoteladmin/revenue`,
      icon: TrendingUp,
      subItems: [
        { name: 'Revenue Overview', path: `${p}/hoteladmin/revenue` },
        { name: 'RevPAR & ADR', path: `${p}/hoteladmin/revenue?tab=kpis` },
      ],
    },
    // ── Reports ──
    {
      name: 'Reports & Audit',
      path: `${p}/hoteladmin/reports`,
      icon: BarChart2,
      subItems: [
        { name: 'Daily Business Report', path: `${p}/hoteladmin/reports` },
        { name: 'Occupancy History', path: `${p}/hoteladmin/reports?tab=occupancy` },
      ],
    },
    // ── F&B / Restaurant & Room Service ──
    {
      name: 'Restaurant & Service',
      path: `${p}/hoteladmin/restaurant`,
      icon: Coffee,
      subItems: [
        { name: 'Room Service & F&B', path: `${p}/hoteladmin/restaurant` },
        { name: 'Restaurant Orders', path: `${p}/hoteladmin/restaurant?tab=orders` },
      ],
    },
    // ── Staff Management ──
    {
      name: 'Staff & Attendance',
      path: `${p}/hoteladmin/staff`,
      icon: Users,
      subItems: [
        { name: 'Staff Directory', path: `${p}/hoteladmin/staff` },
        { name: 'Live Attendance', path: `${p}/hoteladmin/staff?tab=attendance` },
      ],
    },
    // ── Accounts & Expenses ──
    {
      name: 'Accounts & Expenses',
      path: `${p}/hoteladmin/accounts`,
      icon: BookOpen,
      subItems: [
        { name: 'Accounts Ledger', path: `${p}/hoteladmin/accounts` },
        { name: 'Hotel Expenses', path: `${p}/hoteladmin/accounts?tab=expenses` },
      ],
    },
    // ── Settings ──
    {
      name: 'Property Settings',
      path: `${p}/hoteladmin/settings`,
      icon: Settings,
    },
  ];

  const isLiveDashboard = pathname.endsWith('/hoteladmin') || pathname.endsWith('/hoteladmin/');

  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside
        className={`
          bg-[#050912] text-slate-300 flex flex-col z-50 shadow-2xl
          transition-all duration-300 ease-in-out overflow-hidden shrink-0
          border-slate-800/60
          fixed inset-y-0 left-0 lg:sticky lg:top-16
          ${isOpen
            ? 'w-[260px] translate-x-0 border-r'
            : 'w-0 -translate-x-full lg:w-20 lg:translate-x-0 border-r'
          }
        `}
      >
        <div className={`${isOpen ? 'w-[260px]' : 'w-20'} flex flex-col h-full transition-all duration-300 relative`}>
          {/* Close button (mobile) */}
          <button
            onClick={close}
            className="absolute right-4 top-5 p-2 rounded-xl bg-slate-800/50 text-slate-400 lg:hidden"
          >
            <X size={18} />
          </button>

          {/* Branding */}
          <div className={`px-5 py-5 border-b border-slate-800/60 bg-amber-500/5 ${!isOpen && 'flex justify-center px-0'}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center overflow-hidden shrink-0">
                {property?.logoUrl ? (
                  <img
                    src={property.logoUrl}
                    alt={property?.name || 'Hotel'}
                    className="w-full h-full object-contain p-0.5"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <Hotel size={20} className="text-amber-400" />
                )}
              </div>
              {isOpen && (
                <div className="min-w-0">
                  <p className="text-sm font-black text-white truncate">
                    {property?.name || 'Hotel Admin'}
                  </p>
                  <p className="text-[10px] text-amber-400 font-bold uppercase tracking-widest">
                    🏨 Hotel Admin Portal
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto no-scrollbar py-3 scroll-smooth">
            {hotelMenu.map((item) => {
              const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
              const isGroupOpen = !!openGroups[item.name];

              if (item.subItems) {
                return (
                  <div key={item.name} className="px-3 mb-0.5">
                    <div
                      onClick={() => toggleGroup(item.name)}
                      className={`w-full flex items-center justify-between py-2.5 rounded-xl transition-all duration-200 cursor-pointer ${
                        isOpen ? 'px-3' : 'px-0 justify-center'
                      } ${isActive
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/25'
                          : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-200'
                        }`}
                    >
                      <div className={`flex items-center ${isOpen ? 'gap-3' : 'w-full justify-center'}`}>
                        {isOpen ? (
                          <>
                            <item.icon
                              size={18}
                              className={isActive ? 'text-amber-400' : 'text-slate-500 group-hover:text-amber-400'}
                            />
                            <span className="text-[12px] font-bold tracking-tight">{item.name}</span>
                          </>
                        ) : (
                          <item.icon
                            size={20}
                            className={isActive ? 'text-amber-400' : 'text-slate-500'}
                          />
                        )}
                      </div>
                      {isOpen && (isGroupOpen
                        ? <ChevronDown size={13} className="text-slate-500 shrink-0" />
                        : <ChevronRight size={13} className="text-slate-600 shrink-0" />
                      )}
                    </div>

                    {isOpen && isGroupOpen && (
                      <div className="mt-1 space-y-0.5 ml-8 border-l border-slate-800/60 pl-2">
                        {item.subItems.map((sub) => {
                          const isSubActive = pathname === sub.path;
                          return (
                            <Link
                              key={sub.path}
                              href={sub.path}
                              onClick={() => { if (window.innerWidth < 1024) close(); }}
                              className={`flex items-center px-3 py-2 text-[11px] font-semibold transition-all rounded-lg ${isSubActive
                                  ? 'text-amber-300 bg-amber-500/10 border-l-2 border-amber-400 -ml-[2px]'
                                  : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800/40'
                                }`}
                            >
                              {sub.name}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              // Flat menu item
              return (
                <div key={item.name} className="px-3 mb-0.5">
                  <Link
                    href={item.path}
                    onClick={() => { if (window.innerWidth < 1024) close(); }}
                    className={`w-full flex items-center justify-between py-2.5 rounded-xl transition-all duration-200 ${
                      isOpen ? 'px-3' : 'px-0 justify-center'
                    } ${isActive
                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/25'
                        : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-200'
                      }`}
                  >
                    <div className={`flex items-center ${isOpen ? 'gap-3' : 'w-full justify-center'}`}>
                      {isOpen ? (
                        <>
                          <item.icon
                            size={18}
                            className={isActive ? 'text-amber-400' : 'text-slate-500'}
                          />
                          <span className="text-[12px] font-bold tracking-tight">{item.name}</span>
                        </>
                      ) : (
                        <item.icon size={20} className={isActive ? 'text-amber-400' : 'text-slate-500'} />
                      )}
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className={`p-4 bg-black/20 border-t border-slate-800/60 mt-auto ${!isOpen && 'px-2 py-4 flex justify-center'}`}>
            {isOpen && session && (
              <div className="mb-3 px-1 space-y-1">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Logged in as</p>
                <p className="text-xs font-black text-white truncate">{session.fullName || session.name || 'Hotel Admin'}</p>
                <p className="text-[10px] text-amber-400 font-semibold">Hotel Admin</p>
              </div>
            )}
            <button
              onClick={handleLogout}
              className={`w-full flex items-center gap-3 py-2.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-all text-[12px] font-bold group ${
                isOpen ? 'px-3 border border-slate-700/40' : 'px-0 justify-center border-none'
              }`}
            >
              <div className={`flex items-center ${isOpen ? 'gap-3' : 'justify-center w-full'}`}>
                <LogOut size={isOpen ? 16 : 20} className="group-hover:rotate-12 transition-transform text-red-400" />
                {isOpen && <span className="text-red-400">Logout</span>}
              </div>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
