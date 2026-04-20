'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  Image as ImageIcon,
  LogOut,
  LayoutDashboard,
  Calendar,
  Users,
  UtensilsCrossed,
  Bed,
  MapPin,
  Camera,
  MessageSquare,
  Home,
  MonitorPlay,
  Mail,
  Globe,
  Sun,
  Moon,
  Boxes,
  X
} from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { useSidebar } from '@/context/sidebar-context';

export const AdminSidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { isOpen, close } = useSidebar();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    router.push('/login');
  };

  const menuItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Users', path: '/admin/users', icon: Users },
    { name: 'Packages', path: '/admin/packages', icon: Boxes },
    { name: 'Package Assigns', path: '/admin/packages/assignments', icon: Users },
    { name: 'Properties / POS', path: '/admin/properties', icon: Home },
    { name: 'Website Settings', path: '/admin/settings', icon: Settings },
    { name: 'Notifications (SMS)', path: '/admin/settings/notifications', icon: MessageSquare },
    { name: 'Blog', path: '/admin/blogs', icon: MessageSquare },
    { name: 'Contact Enquiries', path: '/admin/enquiries', icon: Mail },
  ];

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
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside 
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 dark:bg-slate-950 flex flex-col text-slate-300 
          border-r border-slate-800 transition-all duration-300 ease-in-out lg:sticky lg:top-0 lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="p-8 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xl font-bold text-white tracking-tight uppercase">OrderMint Admin</span>
            <span className="text-[10px] font-bold tracking-widest mt-0.5" style={{color:'#e8a0a0'}}>POS · by Ritchie</span>
          </div>
          <button onClick={close} className="lg:hidden p-2 text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto no-scrollbar">
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => { if (window.innerWidth < 1024) close(); }}
                style={isActive ? { backgroundColor: '#e8a0a0' } : {}}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'text-white shadow-lg' 
                    : 'hover:bg-slate-800 hover:text-white text-slate-400'
                }`}
              >
                <item.icon size={18} />
                <span className="text-sm font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-6 mt-auto border-t border-slate-800 space-y-2 bg-slate-900/50 backdrop-blur-sm">
          <button 
            onClick={toggleTheme}
            className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl hover:bg-slate-800 transition-all text-sm group"
          >
            <div className="flex items-center gap-3">
              {theme === 'light' ? <Moon size={18} style={{color:'#e8a0a0'}} /> : <Sun size={18} className="text-amber-400" />}
              <span className="font-medium">{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
            </div>
            <div className={`w-8 h-4 rounded-full relative transition-colors duration-300 ${theme === 'dark' ? '' : 'bg-slate-700'}`} style={theme === 'dark' ? {backgroundColor:'#e8a0a0'} : {}}>
              <div className={`absolute top-1 w-2 h-2 rounded-full bg-white transition-all duration-300 ${theme === 'dark' ? 'left-5' : 'left-1'}`} />
            </div>
          </button>
          
          <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800 transition-all text-sm group">
            <Globe size={18} className="transition-colors" />
            <span className="font-medium">View Website</span>
          </Link>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-rose-500/10 text-rose-400 transition-all text-sm group"
          >
            <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

