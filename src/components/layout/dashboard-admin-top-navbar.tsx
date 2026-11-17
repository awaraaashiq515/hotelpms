'use client';

import { useRouter, useParams } from 'next/navigation';
import { 
  Search, 
  Power, 
  Bell, 
  Menu, 
  ShieldCheck, 
  Lock, 
  AlertTriangle,
  Building2,
  ChevronDown,
  Settings,
  LogOut,
  Hotel,
  Monitor,
  CheckCheck,
  ExternalLink
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
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
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [recentNotifications, setRecentNotifications] = useState<any[]>([]);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchRecentNotifications = async () => {
    try {
      const res = await fetch('/api/notifications?status=UNREAD&take=5');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setRecentNotifications(data.data.slice(0, 5));
      }
    } catch (e) {
      console.error('Failed to load recent notifications', e);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'MARK_ALL_READ' })
      }).catch(() => {});
      setRecentNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

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

      {/* Right Action Tray: Modern App-Style Bar */}
      <div className="flex items-center gap-2 lg:gap-3">
        {/* Current Property Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-sm">
          <Building2 size={14} className="text-pos-primary shrink-0" />
          <span className="truncate max-w-[130px] font-bold">{property?.name || 'Main Property'}</span>
        </div>

        {/* Quick Hotel PMS Switcher */}
        <button
          onClick={() => {
            if (session?.role === 'SUPER_ADMIN') {
              router.push('/admin/dashboard');
            } else {
              router.push('/hotel');
            }
          }}
          title="Switch to Hotel Management"
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-all text-xs font-bold shadow-sm"
        >
          <Hotel size={14} className="text-indigo-600 dark:text-indigo-400" />
          <span>Hotel Hub</span>
        </button>

        {/* Modern Notifications Bell Popover */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => {
              const nextState = !showNotifications;
              setShowNotifications(nextState);
              if (nextState) {
                fetchRecentNotifications();
              }
            }}
            title="Notifications"
            className="relative h-9 w-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-pos-primary dark:hover:text-pos-primary hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-all border border-slate-200 dark:border-slate-700 shadow-sm"
          >
            <Bell size={17} className={unreadCount > 0 ? 'text-pos-primary' : ''} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white shadow-sm px-1 border border-white dark:border-slate-900 animate-pulse">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 pb-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[11px] font-semibold text-pos-primary hover:underline flex items-center gap-1"
                  >
                    <CheckCheck size={13} />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                {recentNotifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    <Bell size={24} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    No unread notifications
                  </div>
                ) : (
                  recentNotifications.map((notif: any) => (
                    <div
                      key={notif.id}
                      onClick={() => {
                        setShowNotifications(false);
                        router.push(`${p}/operations/notifications`);
                      }}
                      className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                    >
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug line-clamp-1">
                        {notif.title}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                        {notif.message}
                      </p>
                      <span className="text-[9px] text-slate-400 mt-1 block">
                        {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-2 px-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    router.push(`${p}/operations/notifications`);
                  }}
                  className="w-full py-1.5 text-center text-xs font-bold text-pos-primary hover:bg-pos-primary/10 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>View All Notifications</span>
                  <ExternalLink size={12} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-slate-200 dark:border-slate-800 mx-0.5" />

        {/* Modern App User Profile Dropdown */}
        <div className="relative" ref={profileMenuRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700 group cursor-pointer"
            title="User Profile & Settings"
          >
            <div className="relative">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white font-black text-xs shadow-sm shadow-indigo-500/20">
                {getInitials(session?.fullName || 'Admin')}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
            </div>

            <div className="hidden lg:flex flex-col items-start text-left leading-tight">
              <span className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-pos-primary transition-colors truncate max-w-[120px]">
                {session?.fullName || 'Administrator'}
              </span>
              <span className="text-[10px] font-semibold text-pos-primary uppercase tracking-wide">
                {session?.role?.replace(/_/g, ' ') || 'Hotel Admin'}
              </span>
            </div>

            <ChevronDown 
              size={14} 
              className={`text-slate-400 transition-transform duration-200 ${showProfileMenu ? 'rotate-180 text-pos-primary' : 'group-hover:text-slate-600 dark:group-hover:text-slate-200'}`} 
            />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Profile Card Header */}
              <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                  {session?.fullName || 'Administrator'}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {session?.email || 'admin@hotel.com'}
                </p>
                <span className="inline-block mt-1.5 px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase bg-pos-primary/10 text-pos-primary tracking-wider">
                  {session?.role?.replace(/_/g, ' ') || 'Hotel Admin'}
                </span>
              </div>

              {/* Navigation Options */}
              <div className="py-1">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    router.push('/hotel');
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Hotel size={15} className="text-indigo-500" />
                  <span>Hotel Overview</span>
                </button>

                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    router.push(p ? `${p}/operations` : '/operations');
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Monitor size={15} className="text-teal-500" />
                  <span>POS Operations</span>
                </button>
              </div>

              {/* Preferences & Security (Replacing old cluttered header buttons) */}
              <div className="py-1 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    router.push('/hotel/settings');
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Settings size={15} className="text-slate-400" />
                  <span>Settings</span>
                </button>

                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    router.push('/settings/security');
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <ShieldCheck size={15} className="text-emerald-500" />
                  <span>Security & 2FA</span>
                </button>

                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    manuallyLock();
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors"
                >
                  <Lock size={15} className="text-amber-500" />
                  <span>Lock Screen</span>
                </button>
              </div>

              {/* Sign Out */}
              <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                >
                  <LogOut size={15} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quick Logout Icon Button */}
        <button 
          onClick={handleLogout}
          className="h-9 w-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 transition-all shadow-sm border border-slate-200 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-500/30"
          title="Sign Out"
        >
          <Power size={17} />
        </button>
      </div>
      </div>
    </header>
  );
};

const getInitials = (name?: string) => {
  if (!name) return 'AD';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'AD';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};
