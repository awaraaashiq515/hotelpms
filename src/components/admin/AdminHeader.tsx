'use client';

import React from 'react';
import { 
  Search, 
  Bell, 
  User, 
  ChevronRight,
  Menu,
  Command
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useSidebar } from '@/context/sidebar-context';

export const AdminHeader = () => {
  const pathname = usePathname();
  const { toggle } = useSidebar();
  
  // Simple breadcrumb logic
  const pathSegments = pathname.split('/').filter(Boolean);
  const breadcrumbs = pathSegments.map((segment, index) => ({
    name: segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '),
    path: '/' + pathSegments.slice(0, index + 1).join('/')
  }));

  return (
    <header className="h-16 border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 transition-colors duration-500">
      <div className="h-full px-4 md:px-8 flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-6">
          <button 
            onClick={toggle}
            className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Menu size={20} className="text-slate-600 dark:text-slate-400" />
          </button>
          
          <nav className="hidden lg:flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">

            <span className="cursor-pointer transition-colors hover:opacity-70" style={{color:'inherit'}}>Home</span>
            {breadcrumbs.map((crumb, i) => (
              <React.Fragment key={crumb.path}>
                <ChevronRight size={12} className="text-slate-300 dark:text-slate-600" />
                <span style={i === breadcrumbs.length - 1 ? {color:'#e8a0a0'} : {}} className={i !== breadcrumbs.length - 1 ? 'cursor-pointer transition-colors hover:opacity-70' : ''}>
                  {crumb.name}
                </span>
              </React.Fragment>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl group transition-all focus-within:ring-2 focus-within:ring-rose-300/30 focus-within:border-rose-300/40">
            <Search size={16} className="text-slate-400 group-focus-within:text-rose-400" />
            <input 
              type="text" 
              placeholder="Search anything..." 
              className="bg-transparent border-none outline-none text-xs font-medium text-slate-700 dark:text-slate-200 w-48 placeholder:text-slate-400"
            />
            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded text-[10px] text-slate-400 font-black">
              <Command size={10} />
              K
            </div>
          </div>

          <div className="flex items-center gap-2 ml-2 border-l border-slate-100 dark:border-slate-800 pl-4">
            <button className="relative p-2 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900" />
            </button>
            <div className="flex items-center gap-3 pl-2 cursor-pointer group">
              <div className="text-right hidden sm:block">
                <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none transition-colors">Admin User</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Super Admin</p>
              </div>
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-rose-300/30 group-hover:scale-105 transition-transform duration-300" style={{background:'linear-gradient(135deg, #e8a0a0, #c97878)'}}>
                <User size={20} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
