'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, LogOut, ShieldCheck, X } from 'lucide-react';
import { getSidebarMenu } from '@/lib/menu-config';
import { useSidebar } from '@/context/sidebar-context';

export const DashboardAdminSidebar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { isOpen, close } = useSidebar();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          setSession(data.user);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Filter menu based on role and dynamic paths
  const menu = session ? getSidebarMenu(session.role) : [];

  const filteredMenu = menu.filter(item => {
    // 1. Super admin always sees everything
    if (session.role === 'SUPER_ADMIN') return true;

    // 2. Package Feature Gating (Admins see all for now)
    if (item.feature && session.role !== 'RESTAURANTS_ADMIN') {
      const hasFeature = session.packageFeatures?.includes(item.feature);
      if (!hasFeature) return false;
    }

    // 3. Admin always sees items that list their role
    if (session.role === 'RESTAURANTS_ADMIN') {
      const isRoleListed = item.roles?.includes('RESTAURANTS_ADMIN');
      if (isRoleListed) return true;
      // If no roles specified, show it
      if (!item.roles) return true;
      return false;
    }

    // 3. Other roles: Determine if the role is hardcoded in the item
    const isRoleListed = item.roles?.includes(session.role);

    // 4. Check for specific module permission
    if (session.permissions) {
      const requiredPerm = (item.perm || item.name).toLowerCase();
      const hasPerm = session.permissions.some((p: string) => p.toLowerCase() === requiredPerm);

      if (hasPerm) return true;
      if (!isRoleListed) return false;
      if (session.role !== 'RESTAURANTS_ADMIN') return false;
    }

    if (item.roles && !isRoleListed) return false;
    return true;
  }).map((item: any) => {
    if (item.subItems) {
      return {
        ...item,
        subItems: item.subItems.filter((sub: any) => {
          if (session.role === 'SUPER_ADMIN') return true;

          // Sub-item feature gating (Admins see all for now)
          if (sub.feature && session.role !== 'RESTAURANTS_ADMIN') {
            const hasFeature = session.packageFeatures?.includes(sub.feature);
            if (!hasFeature) return false;
          }

          // ADMIN & POSSYSTEM see all sub-items of permitted parents
          if (session.role === 'RESTAURANTS_ADMIN' || session.role === 'POSSYSTEM') {
            if (!sub.roles) return true;
            return sub.roles.includes(session.role);
          }
          const isRoleListed = sub.roles?.includes(session.role);

          if (session.permissions) {
            const hasSpecificPerm = session.permissions.some((p: string) => p.toLowerCase() === sub.name.toLowerCase());
            if (hasSpecificPerm) return true;

            const parentPerm = (item.perm || item.name).toLowerCase();
            const hasParentPerm = session.permissions.some((p: string) => p.toLowerCase() === parentPerm);
            if (hasParentPerm && !sub.roles) return true;

            if (!isRoleListed) return false;
            return false;
          }

          if (sub.roles && !isRoleListed) return false;
          return true;
        })
      };
    }
    return item;
  });

  // Track which grouped menus are open
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    filteredMenu.forEach(item => {
      if (item.subItems) {
        initial[item.name] = pathname.startsWith(item.path);
      }
    });
    return initial;
  });

  const toggleGroup = (name: string) => {
    setOpenGroups(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('Logout failed', e);
    }
    router.push('/login');
    router.refresh();
  };

  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 1024 : false;

  return (
    <>
      {/* Backdrop for Mobile */}
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
          bg-slate-900 text-slate-300 flex flex-col z-50 shadow-2xl
          transition-all duration-500 ease-in-out overflow-hidden shrink-0
          border-r border-slate-800 dark:bg-slate-950 dark:border-slate-800/50
          fixed inset-y-0 left-0 lg:sticky lg:top-16
          ${isOpen ? 'w-[280px] translate-x-0' : 'w-0 -translate-x-full lg:w-20 lg:translate-x-0'}
        `}
      >
        <div className={`${isOpen ? 'w-[280px]' : 'w-20'} flex flex-col h-full transition-all duration-500 relative`}>
          {/* Close button for mobile */}
          <button 
            onClick={close}
            className="absolute right-4 top-5 p-2 rounded-xl bg-slate-800/50 text-slate-400 lg:hidden"
          >
            <X size={18} />
          </button>

          {/* Admin Branding Area */}
          <div className={`px-6 py-5 border-b border-slate-800/60 bg-slate-950/30 ${!isOpen && 'flex justify-center px-0'}`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 bg-pos-primary/10 rounded-lg ${!isOpen && 'p-1.5'}`}>
                <ShieldCheck className="text-pos-primary" size={isOpen ? 24 : 20} />
              </div>
              {isOpen && (
                <div>
                  <p className="text-sm font-black text-white tracking-wide uppercase">Order<span className="text-pos-primary font-light">Mint</span></p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{session?.role?.replace('_', ' ') || 'Management'}</p>
                </div>
              )}
            </div>
          </div>

          {/* Nav items */}
          <div className="flex-1 overflow-y-auto no-scrollbar py-4 scroll-smooth">
            {loading ? (
              <div className="flex justify-center py-8 text-slate-500 text-xs text-center px-4">
                {isOpen ? 'Loading Admin Navigation...' : '...'}
              </div>
            ) : filteredMenu.map((item) => {
              const isGroupActive = pathname === item.path || pathname.startsWith(item.path + '/');

              if (item.subItems) {
                const isGroupOpen = !!openGroups[item.name];
                return (
                  <div key={item.name} className="px-3 mb-1">
                    <div
                      onClick={() => toggleGroup(item.name)}
                      className={`w-full flex items-center justify-between py-3 rounded-xl transition-all duration-200 group cursor-pointer ${
                        isOpen ? 'px-4' : 'px-0 justify-center'
                      } ${isGroupActive
                          ? 'bg-pos-primary/10 text-pos-primary shadow-sm'
                          : 'hover:bg-slate-800/60 text-slate-400'
                        }`}
                    >
                      <div className={`flex items-center ${isOpen ? 'gap-4' : 'w-full justify-center'}`}>
                        <item.icon
                          size={20}
                          className={isGroupActive ? 'text-pos-primary' : 'text-slate-500 group-hover:text-pos-primary transition-colors'}
                        />
                        {isOpen && <span className="text-[13px] font-semibold tracking-tight uppercase">{item.name}</span>}
                      </div>
                      {isOpen && (isGroupOpen ? <ChevronDown size={14} className="text-slate-500" /> : <ChevronRight size={14} className="text-slate-600" />)}
                    </div>

                    {isOpen && isGroupOpen && (
                      <div className="mt-1 space-y-0.5 ml-9 border-l border-slate-800/80">
                        {item.subItems.map((sub: any) => {
                          const isSubActive = pathname === sub.path;
                          return (
                            <Link
                              key={sub.path}
                              href={sub.path}
                              onClick={() => {
                                if (window.innerWidth < 1024) close();
                              }}
                              className={`flex items-center px-4 py-2.5 text-[11px] font-bold uppercase tracking-tight transition-all rounded-r-md ${isSubActive
                                  ? 'text-pos-primary bg-pos-primary/5 border-l border-pos-primary -ml-[1px]'
                                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/40'
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

              return (
                <div key={item.name} className="px-3 mb-1">
                  <Link
                    href={item.path}
                    onClick={() => {
                      if (window.innerWidth < 1024) close();
                    }}
                    className={`w-full flex items-center justify-between py-3 rounded-xl transition-all duration-200 group ${
                      isOpen ? 'px-4' : 'px-0 justify-center'
                    } ${pathname === item.path
                        ? 'bg-pos-primary/10 text-pos-primary shadow-sm'
                        : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-300'
                      }`}
                  >
                    <div className={`flex items-center ${isOpen ? 'gap-4' : 'w-full justify-center'}`}>
                      <item.icon
                        size={20}
                        className={pathname === item.path ? 'text-pos-primary' : 'text-slate-500 group-hover:text-pos-primary transition-colors'}
                      />
                      {isOpen && <span className="text-[13px] font-semibold tracking-tight uppercase">{item.name}</span>}
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className={`p-6 bg-slate-950/50 mt-auto ${!isOpen && 'px-2 py-4 flex justify-center'}`}>
            {isOpen && (
              <div className="space-y-2 opacity-60 border-b border-slate-800 pb-4 mb-4">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                  <span className="text-slate-500">Workspace</span>
                  <span className="text-slate-300">Admin Area</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                  <span className="text-slate-500">Session ID</span>
                  <span className="text-pos-primary">#AD-409</span>
                </div>
              </div>
            )}

            <button
              onClick={handleLogout}
              className={`w-full flex items-center gap-3 py-3 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-all text-[13px] font-bold uppercase tracking-tight group border border-slate-700/50 ${
                isOpen ? 'px-4' : 'px-0 justify-center border-none hover:bg-transparent'
              }`}
            >
              <div className={`flex items-center ${isOpen ? 'gap-3' : 'justify-center w-full'}`}>
                <LogOut size={isOpen ? 18 : 20} className="group-hover:rotate-12 transition-transform text-red-400" />
                {isOpen && <span className="text-red-400">End Session</span>}
              </div>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
