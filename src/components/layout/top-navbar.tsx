'use client';

import { useRouter } from 'next/navigation';
import { Search, Plus, Power, Monitor, Clock, History, Bell, Menu, Phone, Sun, Moon, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useState, useEffect } from 'react';
import { useSidebar } from '@/context/sidebar-context';
import { useTheme } from '@/components/providers/ThemeProvider';
import { usePOSSecurity } from '@/components/providers/POSSecurityProvider';

export const TopNavbar: React.FC = () => {
  const router = useRouter();
  const { toggle } = useSidebar();
  const { theme, toggleTheme } = useTheme();
  const { manuallyLock } = usePOSSecurity();
  const [property, setProperty] = useState<any>(null);

  useEffect(() => {
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

  const [searchBill, setSearchBill] = useState('');
  const [searchKot, setSearchKot] = useState('');

  const handleBillSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchBill.trim()) {
      router.push(`/orders?search=${encodeURIComponent(searchBill.trim())}`);
      setSearchBill('');
    }
  };

  const handleKotSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchKot.trim()) {
      router.push(`/kots?search=${encodeURIComponent(searchKot.trim())}`);
      setSearchKot('');
    }
  };

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-pos-border dark:border-slate-800 flex items-center justify-between px-6 sticky top-0 z-50 shadow-sm transition-all duration-200">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4">
          <button onClick={toggle} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors group" title="Toggle Sidebar">
            <Menu size={20} className="text-gray-500 dark:text-slate-400 group-hover:text-gray-800 dark:group-hover:text-white transition-colors" />
          </button>
          <div className="flex items-center gap-3 relative z-[60]">
             {property?.logoUrl ? (
               <img 
                 src={property.logoUrl} 
                 alt="Logo" 
                 className="h-32 w-auto object-contain drop-shadow-2xl transition-all duration-300" 
               />
             ) : (
               <div className="font-bold text-2xl tracking-tighter text-gray-900 dark:text-white uppercase transition-colors">
                 POS<span className="text-pos-primary">MASTER</span>
               </div>
             )}
          </div>
        </div>
        
        <Button 
          className="bg-pos-primary hover:bg-red-700 text-white font-bold h-10 px-5 rounded-lg shadow-lg shadow-red-200 dark:shadow-none transition-all uppercase tracking-tighter text-sm ml-4"
          onClick={() => router.push('/operations/tables')}
        >
          <Plus size={18} className="mr-2" />
          New Order
        </Button>

        <div className="hidden lg:flex items-center gap-3 ml-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input 
              type="text" 
              placeholder="Search Bill No" 
              value={searchBill}
              onChange={(e) => setSearchBill(e.target.value)}
              onKeyDown={handleBillSearch}
              className="pl-9 pr-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-md text-xs w-48 font-medium focus:outline-none focus:ring-1 focus:ring-pos-primary transition-all text-slate-800 dark:text-slate-200"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center border-r border-gray-100 dark:border-slate-800 pr-3 mr-3 gap-0.5">
          <NavbarAction icon={<Power size={18} />} label="Item On/Off" onClick={() => router.push('/day-closing')} />
          <NavbarAction icon={<Monitor size={18} />} label="Live View" onClick={() => router.push('/kitchen-display')} />
          <NavbarAction icon={<History size={18} />} label="Recent" onClick={() => router.push('/invoices')} />
          <NavbarAction icon={<Lock size={18} />} label="Lock" onClick={manuallyLock} />
          <NavbarAction icon={<Bell size={18} />} label="Alerts" />
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="h-9 w-9 flex items-center justify-center rounded-lg bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all border border-gray-100 dark:border-slate-700"
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          <div className="flex items-center gap-2.5 px-3 py-1.5 border border-pos-primary/10 rounded-lg bg-pos-primary/5 hidden lg:flex group hover:bg-pos-primary/10 transition-colors cursor-pointer">
             <div className="p-1 bg-pos-primary rounded text-white group-hover:scale-110 transition-transform">
               <Phone size={12} />
             </div>
             <div className="flex flex-col leading-none">
               <p className="text-[9px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Support</p>
               <p className="text-xs font-bold text-pos-primary tracking-tight">+91 000 000 0000</p>
             </div>
          </div>
          
          <button 
            onClick={handleLogout}
            className="h-9 w-9 flex items-center justify-center rounded-lg bg-gray-50 dark:bg-slate-800 text-gray-400 dark:text-slate-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm border border-gray-100 dark:border-slate-700"
            title="Logout"
          >
            <Power size={18} />
          </button>
        </div>
      </div>
    </header>
  );
};

const NavbarAction = ({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick?: () => void }) => (
  <button onClick={onClick} className="flex flex-col items-center justify-center p-2 rounded-xl hover:bg-gray-50 transition-colors group min-w-[68px]">
    <span className="text-gray-400 group-hover:text-pos-primary mb-1 transition-colors">{icon}</span>
    <span className="text-[9px] font-bold text-gray-400 group-hover:text-gray-900 uppercase tracking-tighter text-center">{label}</span>
  </button>
);
