'use client';

import { useRouter } from 'next/navigation';
import { Search, Power, Bell, Menu, ShieldCheck, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useState, useEffect } from 'react';
import { useSidebar } from '@/context/sidebar-context';
import { useTheme } from '@/components/providers/ThemeProvider';

export const DashboardAdminTopNavbar: React.FC = () => {
  const router = useRouter();
  const { toggle } = useSidebar();
  const { theme, toggleTheme } = useTheme();
  const [session, setSession] = useState<any>(null);
  const [property, setProperty] = useState<any>(null);

  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          setSession(data.user);
        }
      })
      .catch(err => console.error('Failed to fetch session', err));

    fetch('/api/setup/properties/current')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setProperty(data.data);
        }
      })
      .catch(err => console.error('Failed to fetch property branding', err));
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('Logout failed', e);
    }
    router.push('/login');
    router.refresh();
  };

  const [searchQuery, setSearchQuery] = useState('');

  const handleGlobalSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between px-6 sticky top-0 z-50 shadow-sm transition-all duration-200">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4">
          <button onClick={toggle} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors group" title="Toggle Sidebar">
            <Menu size={20} className="text-gray-500 dark:text-slate-400 group-hover:text-gray-800 dark:group-hover:text-white transition-colors" />
          </button>
          <div className="flex items-center gap-3">
             {property?.logoUrl ? (
               <div className="flex items-center gap-4 relative z-[60]">
                 <img src={property.logoUrl} alt="Logo" className="h-28 w-auto object-contain drop-shadow-2xl transition-all duration-300" />
                 <div className="hidden sm:flex flex-col leading-none">
                    <span className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tighter">Admin<span className="text-pos-primary font-light">HUB</span></span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{property.name}</span>
                 </div>
               </div>
             ) : (
               <div className="font-bold text-xl tracking-tighter text-slate-800 dark:text-white uppercase flex items-center gap-2 transition-colors">
                 <ShieldCheck className="text-pos-primary" size={24} />
                 <span>Restaurants Admin<span className="text-pos-primary font-light">HUB</span></span>
               </div>
             )}
          </div>
        </div>
        
        <div className="hidden lg:flex items-center gap-3 ml-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Global Search..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleGlobalSearch}
              className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm w-64 font-medium focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary transition-all placeholder:text-slate-400 text-slate-700 dark:text-slate-200"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center border-r border-gray-200 dark:border-slate-800 pr-4 mr-1 gap-1">
          <NavbarAction icon={<Bell size={18} />} label="Notifications" />
          <NavbarAction icon={<ShieldCheck size={18} />} label="Security" onClick={() => router.push('/settings/security')} />
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="h-9 w-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-pos-primary dark:hover:text-pos-primary transition-all border border-slate-200 dark:border-slate-700 shadow-sm"
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          <div className="hidden lg:flex flex-col items-end leading-tight">
             <span className="text-[11px] font-bold text-slate-800 dark:text-white uppercase tracking-wide transition-colors">
               {session?.fullName || 'Administrator'}
             </span>
             <span className="text-[10px] text-pos-primary font-bold uppercase">
               {session?.role?.replace('_', ' ') || 'Online'}
             </span>
          </div>
          
          <button 
            onClick={handleLogout}
            className="h-9 w-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-rose-500/10 hover:text-red-600 dark:hover:text-rose-400 transition-all shadow-sm border border-slate-200 dark:border-slate-700 hover:border-red-200 dark:hover:border-rose-500/30"
            title="Secure Logout"
          >
            <Power size={18} />
          </button>
        </div>
      </div>
    </header>
  );
};

const NavbarAction = ({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick?: () => void }) => (
  <button onClick={onClick} className="flex flex-col items-center justify-center p-2 rounded-xl hover:bg-slate-100 transition-colors group min-w-[68px]">
    <span className="text-slate-500 group-hover:text-pos-primary mb-1 transition-colors">{icon}</span>
    <span className="text-[9px] font-bold text-slate-500 group-hover:text-slate-800 uppercase tracking-tighter text-center">{label}</span>
  </button>
);
