'use client';

import { useRouter, useParams } from 'next/navigation';
import { Search, Power, Bell, Menu, ShieldCheck, Sun, Moon, Lock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useState, useEffect } from 'react';
import { useSidebar } from '@/context/sidebar-context';
import { useTheme } from '@/components/providers/ThemeProvider';
import { usePOSSecurity } from '@/components/providers/POSSecurityProvider';

export const DashboardAdminTopNavbar: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const router = useRouter();
  const params = useParams();
  const propertyCode = (params?.propertyCode as string) || session?.propertyCode || 'MB01';
  const p = propertyCode ? `/${propertyCode}` : '';
  const { toggle } = useSidebar();
  const { theme, toggleTheme } = useTheme();
  const { manuallyLock } = usePOSSecurity();
  const [property, setProperty] = useState<any>(null);
  const [websiteSettings, setWebsiteSettings] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = () => {
      fetch('/api/notifications?status=UNREAD')
        .then(res => res.json())
        .then(data => {
          if (data.success && Array.isArray(data.data)) {
            setUnreadCount(data.data.length);
          }
        })
        .catch(err => console.error('Failed to fetch unread notification count', err));
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 8000);
    return () => clearInterval(interval);
  }, []);

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

    fetch('/api/website/settings')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setWebsiteSettings(data.data);
        }
      })
      .catch(err => console.error('Failed to fetch website settings', err));
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

  // Expiry calculation
  const packageEndDate = session?.packageEndDate;
  let daysRemaining = 0;
  let isNearExpiry = false;
  if (packageEndDate) {
    const expiry = new Date(packageEndDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    isNearExpiry = daysRemaining > 0 && daysRemaining <= 10;
  }

  return (
    <header className="flex flex-col sticky top-0 z-[60] shadow-sm border-b border-gray-200 dark:border-slate-800 transition-all duration-200">
      {/* Expiry Warning Banner */}
      {isNearExpiry && (
        <div className="w-full bg-gradient-to-r from-amber-500/25 to-orange-500/25 dark:from-amber-500/10 dark:to-orange-500/10 border-b border-amber-500/20 py-2.5 px-4 flex items-center justify-center gap-2.5 text-center text-amber-800 dark:text-amber-300 text-[11px] font-black uppercase tracking-wide">
          <AlertTriangle size={14} className="text-amber-600 dark:text-amber-400 shrink-0 animate-bounce" />
          <span>Plan Ending Soon: Only {daysRemaining} days left! Please contact support to renew and keep features active.</span>
          <button 
            onClick={() => router.push(`/${session?.propertyCode || 'MB01'}/settings`)} 
            className="ml-4 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95 shrink-0"
          >
            Manage Plan
          </button>
        </div>
      )}

      {/* Main Navbar row */}
      <div className="h-16 lg:h-20 bg-white dark:bg-slate-900 flex items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-2 lg:gap-6">
        <div className="flex items-center gap-2 lg:gap-4">
          <button 
            onClick={toggle} 
            className="p-2 lg:p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors group" 
            title="Toggle Sidebar"
          >
            <Menu size={22} className="text-gray-500 dark:text-slate-400 group-hover:text-gray-800 dark:group-hover:text-white transition-colors" />
          </button>
          
          <div 
            className="flex items-center gap-2.5 group cursor-pointer" 
            onClick={() => {
              if (session?.role === 'SUPER_ADMIN') {
                router.push('/admin/dashboard');
              } else if (session?.role === 'RESTAURANTS_ADMIN') {
                const slug = session?.organizationSlug;
                router.push(slug ? `/restaurantadmin/${slug}` : '/dashboard');
              } else {
                router.push('/dashboard');
              }
            }}
          >
            {(() => {
              const displayLogo = property?.logoUrl || (theme === 'dark' 
                ? (websiteSettings?.logoUrl || websiteSettings?.logoScrolledUrl) 
                : (websiteSettings?.logoScrolledUrl || websiteSettings?.logoUrl));

              if (displayLogo) {
                return (
                  <div className="relative flex items-center h-10 md:h-12 max-w-[250px] overflow-hidden">
                    <img 
                      src={displayLogo} 
                      alt={property?.name || 'Logo'} 
                      className="h-full w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                );
              }

              return (
                <>
                  <div className="relative">
                    <div className="w-10 h-10 bg-pos-primary rounded-xl flex items-center justify-center shadow-lg shadow-pos-primary/20 rotate-3 group-hover:rotate-0 transition-transform duration-300 overflow-hidden">
                      {session?.role === 'SUPER_ADMIN' && property?.logoUrl ? (
                        <img 
                          src={property.logoUrl} 
                          alt={property?.name || 'Logo'} 
                          className="w-full h-full object-contain p-0.5"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : (
                        <span className="text-white font-black text-xl italic">O</span>
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-slate-900 dark:bg-white rounded-md flex items-center justify-center shadow-sm">
                       <div className="w-1.5 h-1.5 bg-pos-primary rounded-full animate-pulse" />
                    </div>
                  </div>
                  <div className="flex flex-col leading-none">
                    <span className="text-xl font-black text-slate-800 dark:text-white tracking-tighter uppercase">
                      {session?.role === 'SUPER_ADMIN' && property?.name ? (
                        <>{property.name.split(' ')[0]}<span className="text-pos-primary font-light">{property.name.split(' ').slice(1).join(' ')}</span></>
                      ) : (
                        <>Order<span className="text-pos-primary font-light">Mint</span></>
                      )}
                    </span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.3em]">Management Hub</span>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
        
        <div className="hidden xl:flex items-center gap-3 ml-8">
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

      <div className="flex items-center gap-2 lg:gap-4">
        <div className="flex items-center border-r border-gray-200 dark:border-slate-800 pr-2 lg:pr-4 mr-1 gap-1">
          <NavbarAction 
            icon={<Bell size={18} className={unreadCount > 0 ? 'animate-bounce text-pos-primary' : ''} />} 
            label="Alerts" 
            onClick={() => router.push(`${p}/operations/notifications`)} 
            badge={unreadCount} 
          />
          <NavbarAction icon={<Lock size={18} />} label="Lock" onClick={manuallyLock} />
          <div className="hidden md:flex">
            <NavbarAction icon={<ShieldCheck size={18} />} label="Security" onClick={() => router.push('/settings/security')} />
          </div>
        </div>
        
        <div className="flex items-center gap-2 lg:gap-4">
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
      </div>
    </header>
  );
};

const NavbarAction = ({ icon, label, onClick, badge }: { icon: React.ReactNode, label: string, onClick?: () => void, badge?: number }) => (
  <button onClick={onClick} className="relative flex flex-col items-center justify-center p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group min-w-[40px] lg:min-w-[68px]">
    {badge !== undefined && badge > 0 && (
      <span className="absolute top-1 right-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 text-[8px] font-black text-white shadow-[0_0_8px_rgba(244,63,94,0.6)] border border-white dark:border-slate-900 animate-pulse px-1">
        {badge}
      </span>
    )}
    <span className="text-slate-500 group-hover:text-pos-primary mb-0.5 lg:mb-1 transition-colors">{icon}</span>
    <span className="hidden lg:block text-[9px] font-bold text-slate-500 group-hover:text-slate-800 dark:group-hover:text-white uppercase tracking-tighter text-center">{label}</span>
  </button>
);
