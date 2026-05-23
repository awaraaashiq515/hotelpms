'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Calendar, 
  Bed, 
  PlusCircle, 
  UserCheck, 
  Receipt, 
  ArrowLeft, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  Wrench
} from 'lucide-react';

export const HotelSidebar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);

  const menuItems = [
    { name: 'Hotel Dashboard', path: '/hotel', icon: LayoutDashboard },
    { name: 'Room Calendar', path: '/hotel/calendar', icon: Calendar },
    { name: 'Rooms & Categories', path: '/hotel/rooms', icon: Bed },
    { name: 'Housekeeping / Fix', path: '/hotel/housekeeping', icon: Wrench },
    { name: 'Bookings', path: '/hotel/bookings', icon: PlusCircle },
    { name: 'KYC & Check-in', path: '/hotel/checkin', icon: UserCheck },
    { name: 'Billing / Checkout', path: '/hotel/billing', icon: Receipt },
  ];

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('Logout failed', e);
    }
    router.push('/login');
    router.refresh();
  };

  return (
    <aside className={`
      bg-[#0f172a] text-slate-200 flex flex-col sticky top-0 left-0 h-screen z-40 shadow-2xl border-r border-slate-800
      transition-all duration-300 ease-in-out shrink-0
      ${isOpen ? 'w-[260px]' : 'w-20'}
    `}>
      {/* Branding Area */}
      <div className={`px-6 py-6 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <span className="text-white font-black text-2xl italic">H</span>
          </div>
          {isOpen && (
            <div>
              <p className="text-xl font-black text-white tracking-tighter uppercase leading-none">
                Hotel<span className="text-indigo-400 font-light">Hub</span>
              </p>
              <p className="text-[9px] text-indigo-300 font-bold uppercase tracking-widest mt-1">PMS PORTAL</p>
            </div>
          )}
        </div>
        
        {isOpen && (
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {/* Expand trigger when collapsed */}
      {!isOpen && (
        <div className="flex justify-center py-4 border-b border-slate-800">
          <button 
            onClick={() => setIsOpen(true)}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Nav items */}
      <div className="flex-1 overflow-y-auto py-4 space-y-1.5 px-3">
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.name}
              href={item.path}
              className={`w-full flex items-center py-3 rounded-xl transition-all duration-200 group ${
                isOpen ? 'px-4 gap-4' : 'px-0 justify-center'
              } ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <item.icon
                size={20}
                className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400 transition-colors'}
              />
              {isOpen && <span className="text-sm font-semibold tracking-tight">{item.name}</span>}
            </Link>
          );
        })}
      </div>

      {/* Back to main operations link & Logout */}
      <div className="p-4 bg-slate-900/40 border-t border-slate-800 space-y-2">
        <Link
          href="/operations"
          className={`w-full flex items-center py-2.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-all text-xs font-bold uppercase tracking-tight group ${
            isOpen ? 'px-4 gap-3' : 'px-0 justify-center'
          }`}
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          {isOpen && <span>POS Operations</span>}
        </Link>

        <button
          onClick={handleLogout}
          className={`w-full flex items-center py-2.5 rounded-xl hover:bg-red-950/40 text-red-400 hover:text-red-300 transition-all text-xs font-bold uppercase tracking-tight group ${
            isOpen ? 'px-4 gap-3' : 'px-0 justify-center'
          }`}
        >
          <LogOut size={16} className="group-hover:rotate-12 transition-transform" />
          {isOpen && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};
