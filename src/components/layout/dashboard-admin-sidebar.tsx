'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronDown, ChevronRight, LogOut, ShieldCheck } from 'lucide-react';
import { getSidebarMenu } from '@/lib/menu-config';
import { useSidebar } from '@/context/sidebar-context';

export const DashboardAdminSidebar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { isOpen } = useSidebar();
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

    // 2. Package Feature Gating (Strict Enforcement)
    if (item.feature) {
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
  }).map(item => {
    if (item.subItems) {
      return {
        ...item,
        subItems: item.subItems.filter(sub => {
          if (session.role === 'SUPER_ADMIN') return true;
          
          // Sub-item feature gating
          if (sub.feature) {
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

  return (
    <aside className={`
      bg-slate-900 text-slate-300 flex flex-col sticky top-16 left-0 z-40 shadow-xl
      transition-all duration-500 ease-in-out overflow-hidden shrink-0
      border-r border-slate-800 dark:bg-slate-950 dark:border-slate-800/50
      ${isOpen ? 'w-[260px]' : 'w-0'}
    `}>
      <div className="w-[260px] flex flex-col h-full">
        {/* Admin Branding Area */}
        <div className="px-6 py-5 border-b border-slate-800/60 bg-slate-950/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <ShieldCheck className="text-blue-400" size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-white tracking-wide uppercase">Admin Hub</p>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">{session?.role?.replace('_', ' ') || 'Manager'}</p>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <div className="flex-1 overflow-y-auto no-scrollbar py-4 scroll-smooth">
          {loading ? (
            <div className="flex justify-center py-8 text-slate-500 text-xs text-center px-4">Loading Admin Navigation...</div>
          ) : filteredMenu.map((item) => {
            const isGroupActive = pathname === item.path || pathname.startsWith(item.path + '/');

            if (item.subItems) {
              const isGroupOpen = !!openGroups[item.name];
              return (
                <div key={item.name} className="px-3 mb-1">
                  <Link
                    href={item.path}
                    onClick={() => toggleGroup(item.name)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
                      isGroupActive
                        ? 'bg-blue-600/10 text-blue-400 shadow-sm'
                        : 'hover:bg-slate-800/60 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <item.icon
                        size={20}
                        className={isGroupActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-blue-400 transition-colors'}
                      />
                      <span className="text-[13px] font-semibold tracking-tight uppercase">{item.name}</span>
                    </div>
                    {isGroupOpen ? <ChevronDown size={14} className="text-slate-500" /> : <ChevronRight size={14} className="text-slate-600" />}
                  </Link>

                  {isGroupOpen && (
                    <div className="mt-1 space-y-0.5 ml-9 border-l border-slate-800/80">
                      {item.subItems.map((sub) => {
                        const isSubActive = pathname === sub.path;
                        return (
                          <Link
                            key={sub.path}
                            href={sub.path}
                            className={`flex items-center px-4 py-2.5 text-[11px] font-bold uppercase tracking-tight transition-all rounded-r-md ${
                              isSubActive
                                ? 'text-blue-400 bg-blue-500/5 border-l border-blue-500 -ml-[1px]'
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
                  className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group ${
                    pathname === item.path
                      ? 'bg-blue-600/10 text-blue-400 shadow-sm'
                      : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-300'
                  }`}
                >
                  <item.icon
                    size={20}
                    className={pathname === item.path ? 'text-blue-400' : 'text-slate-500 group-hover:text-blue-400 transition-colors'}
                  />
                  <span className="text-[13px] font-semibold tracking-tight uppercase">{item.name}</span>
                </Link>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-950/50 mt-auto">
          <div className="space-y-2 opacity-60 border-b border-slate-800 pb-4 mb-4">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
              <span className="text-slate-500">Workspace</span>
              <span className="text-slate-300">Admin Area</span>
            </div>
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
              <span className="text-slate-500">Session ID</span>
              <span className="text-blue-400">#AD-409</span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-all text-[13px] font-bold uppercase tracking-tight group border border-slate-700/50"
          >
            <LogOut size={18} className="group-hover:rotate-12 transition-transform text-red-400" />
            <span className="text-red-400">End Session</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
