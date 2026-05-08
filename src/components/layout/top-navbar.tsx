'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus, Power, Monitor, Clock, History, Bell, Menu, Phone, Sun, Moon, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useSidebar } from '@/context/sidebar-context';
import { useTheme } from '@/components/providers/ThemeProvider';
import { usePOSSecurity } from '@/components/providers/POSSecurityProvider';
import { GlobalSearch } from './global-search';

export const TopNavbar: React.FC = () => {
  const router = useRouter();
  const { toggle } = useSidebar();
  const { theme, toggleTheme } = useTheme();
  const { manuallyLock } = usePOSSecurity();
  const [session, setSession] = useState<any>(null);
  const [property, setProperty] = useState<any>(null);

  // Notifications State
  const [unreadCount, setUnreadCount] = useState(0);
  const lastIdRef = useRef<string | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(false);

  useEffect(() => {
    const unlockAudio = () => {
      setAudioEnabled(true);
      // Play a silent sound to unlock audio context
      const silentAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=');
      silentAudio.play().catch(() => {});
      window.removeEventListener('click', unlockAudio);
    };
    window.addEventListener('click', unlockAudio);
    return () => window.removeEventListener('click', unlockAudio);
  }, []);

  const playNotificationSound = (message: string) => {
    console.log("🔔 Triggering sound for:", message);
    try {
      // 1. Play Modern Beep Sound
      const audio = new Audio('https://cdn.pixabay.com/audio/2022/03/15/audio_78383a7589.mp3'); // Clear notification sound
      audio.volume = 1.0;
      audio.play().catch(e => {
        console.warn('Audio play blocked. Click anywhere on page.', e);
      });

      // 2. Voice Announcement (with delay so it doesn't overlap with beep)
      setTimeout(() => {
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(message);
          utterance.rate = 0.9; utterance.pitch = 1; utterance.volume = 1;
          window.speechSynthesis.speak(utterance);
        }
      }, 500);
    } catch (e) {
      console.error('Notification sound error:', e);
    }
  };

  const [activeToast, setActiveToast] = useState<string | null>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/pos-orders/notifications');
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        const latest = data.data[0];
        const latestKey = `${latest.id}-${latest.type}`;
        
        console.log("📡 Notification Check:", latestKey, "vs Last:", lastIdRef.current);

        if (lastIdRef.current && latestKey !== lastIdRef.current) {
          console.log("✨ NEW ALERT DETECTED!");
          playNotificationSound(latest.message);
          setUnreadCount(prev => prev + 1);
          
          // Show visual toast
          setActiveToast(latest.message);
          setTimeout(() => setActiveToast(null), 5000);
        }
        
        lastIdRef.current = latestKey;
      }
    } catch (err) {
      console.error('Failed to fetch notifications');
    }
  };

  useEffect(() => {
    // Set initial baseline
    fetchNotifications();

    const interval = setInterval(fetchNotifications, 5000); // Check every 5s
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
  }, []);

  const [showDisplayMenu, setShowDisplayMenu] = useState(false);
  const [showLiveOrderMenu, setShowLiveOrderMenu] = useState(false);
  
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('Logout failed', e);
    }
    router.push('/login');
    router.refresh();
  };

  // Close dropdown on click outside
  useEffect(() => {
    if (!showDisplayMenu && !showLiveOrderMenu) return;
    const handleClick = () => {
      setShowDisplayMenu(false);
      setShowLiveOrderMenu(false);
    };
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [showDisplayMenu, showLiveOrderMenu]);

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-pos-border dark:border-slate-800 flex items-center justify-between px-3 md:px-6 sticky top-0 z-50 shadow-sm transition-all duration-200">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4">
          <button onClick={toggle} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors group" title="Toggle Sidebar">
            <Menu size={20} className="text-gray-500 dark:text-slate-400 group-hover:text-gray-800 dark:group-hover:text-white transition-colors" />
          </button>
          <div 
            className="flex items-center gap-2.5 group cursor-pointer" 
            onClick={() => router.push('/operations')}
          >
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
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.3em]">POS Terminal</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5 md:gap-2 ml-2 md:ml-4">
          <Button 
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-10 w-10 md:w-auto px-0 md:px-4 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none transition-all uppercase tracking-tighter text-[11px] flex items-center justify-center"
            onClick={() => router.push('/operations/tables')}
            title="Dine In"
          >
            <Monitor size={16} className="md:mr-2" />
            <span className="hidden md:inline">Dine In</span>
          </Button>

          <Button 
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 w-10 md:w-auto px-0 md:px-4 rounded-xl shadow-lg shadow-emerald-200 dark:shadow-none transition-all uppercase tracking-tighter text-[11px] flex items-center justify-center"
            onClick={() => router.push('/billing')}
            title="Take Away"
          >
            <Plus size={16} className="md:mr-2" />
            <span className="hidden md:inline">Take Away</span>
          </Button>

          {/* ── Live Order Dropdown (Delivery / Pick Up) ── */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <Button 
              className={`font-bold h-10 w-10 md:w-auto px-0 md:px-4 rounded-xl shadow-lg transition-all uppercase tracking-tighter text-[11px] flex items-center justify-center gap-2 
                ${showLiveOrderMenu 
                  ? 'bg-violet-700 text-white' 
                  : 'bg-violet-600 text-white hover:bg-violet-700 shadow-violet-200 dark:shadow-none'}`}
              onClick={() => setShowLiveOrderMenu(!showLiveOrderMenu)}
              title="Live Order"
            >
              <Plus size={16} />
              <span className="hidden md:inline">Live Order</span>
            </Button>

            {showLiveOrderMenu && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl shadow-2xl py-2 z-[60] animate-in fade-in slide-in-from-top-2 duration-300">
                <button 
                  onClick={() => {
                    router.push('/billing?type=DELIVERY');
                    setShowLiveOrderMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-emerald-500 transition-all"
                >
                  <div className="w-8 h-8 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
                    <Plus size={14} />
                  </div>
                  🏍️ Delivery
                </button>
                <button 
                  onClick={() => {
                    router.push('/billing?type=PICKUP');
                    setShowLiveOrderMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-orange-500 transition-all border-t border-gray-50 dark:border-white/5"
                >
                  <div className="w-8 h-8 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-500">
                    <Plus size={14} />
                  </div>
                  🛍️ Pick Up
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-3 ml-4 flex-1 max-w-[220px]">
          <GlobalSearch />
        </div>
      </div>

      <div className="flex items-center gap-1 md:gap-2">
        <div className="flex items-center border-r border-gray-100 dark:border-slate-800 pr-2 md:pr-3 mr-2 md:mr-3 gap-0">
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setShowDisplayMenu(!showDisplayMenu)}
              className={`flex flex-col items-center justify-center p-1.5 md:p-2 rounded-xl transition-all group min-w-[36px] md:min-w-[60px] ${
                showDisplayMenu ? 'bg-pos-primary/10 text-pos-primary shadow-inner' : 'hover:bg-gray-50'
              }`}
            >
              <span className={`text-gray-400 group-hover:text-pos-primary md:mb-1 transition-colors flex items-center gap-0.5 ${showDisplayMenu ? 'text-pos-primary' : ''}`}>
                <Monitor size={18} className={showDisplayMenu ? 'animate-pulse' : ''} />
              </span>
              <span className={`hidden md:block text-[9px] font-bold uppercase tracking-tighter text-center ${showDisplayMenu ? 'text-pos-primary' : 'text-gray-400 group-hover:text-gray-900'}`}>Displays</span>
            </button>
            
            {showDisplayMenu && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.15)] py-1.5 z-[60] animate-in fade-in slide-in-from-top-2 duration-200">
                <button 
                  onClick={() => {
                    router.push('/kitchen-display');
                    setShowDisplayMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-pos-primary transition-colors"
                >
                  <div className="w-7 h-7 bg-pos-primary/10 rounded-lg flex items-center justify-center text-pos-primary">
                    <Monitor size={14} />
                  </div>
                  Kitchen Display (KDS)
                </button>
                <button 
                  onClick={() => {
                    window.open('/order-display', '_blank');
                    setShowDisplayMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-pos-primary transition-colors border-t border-gray-50 dark:border-slate-800/50"
                >
                  <div className="w-7 h-7 bg-cyan-500/10 rounded-lg flex items-center justify-center text-cyan-500">
                    <Monitor size={14} />
                  </div>
                  Customer Display
                </button>
              </div>
            )}
          </div>
          <NavbarAction icon={<Lock size={18} />} label="Lock" onClick={manuallyLock} />
          <NavbarAction 
            icon={
              <div className="relative">
                <Bell size={18} className={unreadCount > 0 ? 'animate-bounce text-pos-primary' : ''} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-pos-primary text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-slate-950">
                    {unreadCount}
                  </span>
                )}
              </div>
            } 
            label="Alerts" 
            onClick={() => {
              setUnreadCount(0);
              router.push('/operations/notifications');
            }}
          />
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
               <p className="text-xs font-bold text-pos-primary tracking-tight">+91 86798 00074</p>
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
      {/* Global Notification Toast */}
      {activeToast && (
        <div className="fixed top-20 right-6 z-[999] animate-in slide-in-from-right-10 duration-300">
          <div className="bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-4">
            <div className="w-10 h-10 bg-pos-primary rounded-xl flex items-center justify-center animate-bounce">
              <Bell size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-pos-primary uppercase tracking-widest">New Alert</p>
              <p className="text-sm font-bold">{activeToast}</p>
            </div>
            <button onClick={() => setActiveToast(null)} className="ml-4 text-slate-500 hover:text-white">
              <Plus className="rotate-45" size={20} />
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

const NavbarAction = ({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick?: () => void }) => (
  <button onClick={onClick} title={label} className="flex flex-col items-center justify-center p-1.5 md:p-2 rounded-xl hover:bg-gray-50 transition-colors group min-w-[36px] md:min-w-[60px]">
    <span className="text-gray-400 group-hover:text-pos-primary md:mb-1 transition-colors">{icon}</span>
    <span className="hidden md:block text-[9px] font-bold text-gray-400 group-hover:text-gray-900 uppercase tracking-tighter text-center">{label}</span>
  </button>
);
