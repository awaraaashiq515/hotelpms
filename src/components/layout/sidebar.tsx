'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useParams } from 'next/navigation';
import { ChevronDown, ChevronRight, LogOut } from 'lucide-react';
import { getSidebarMenu } from '@/lib/menu-config';
import { useSidebar } from '@/context/sidebar-context';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const propertyCode = typeof params?.propertyCode === 'string' ? params.propertyCode : null;
  const { isOpen, isHidden } = useSidebar();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [barPosEnabled, setBarPosEnabled] = useState(false);
  const [cafePosEnabled, setCafePosEnabled] = useState(false);
  const [property, setProperty] = useState<any>(null);

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

    // Fetch barPosEnabled setting and property details
    fetch('/api/setup/properties/current')
      .then(r => r.json())
      .then(data => { 
        if (data.success) {
          setProperty(data.data);
          setBarPosEnabled(!!data.data.barPosEnabled);
          setCafePosEnabled(!!data.data.cafePosEnabled);
        }
      })
      .catch(() => {});
  }, []);

  // Filter menu based on role
  const menu = session ? getSidebarMenu(session.role, session.organizationSlug, propertyCode) : [];
  
  const filteredMenu = menu.filter(item => {
    // Hide Bar POS menu item when barPosEnabled is false
    if (item.path.includes('/bar-pos') && !barPosEnabled) return false;
    // Hide Bar Display menu item when barPosEnabled is false
    if (item.path.includes('/bar-display') && !barPosEnabled) return false;
    // Hide Cafe POS menu item when cafePosEnabled is false
    if (item.path.includes('/cafe-pos') && !cafePosEnabled) return false;

    // 1. Super admin always sees everything
    if (session.role === 'SUPER_ADMIN') return true;

    // 2. Package Feature Gating (Strict Enforcement)
    if (item.feature) {
      const hasFeature = session.packageFeatures?.includes(item.feature);
      if (!hasFeature) return false;
    }

    // 3. Role-based filtering
    if (item.roles && !item.roles.includes(session.role)) {
      return false;
    }

    // 4. Permission-based filtering
    if (item.perm && session.permissions) {
      const hasPerm = session.permissions.some(
        (p: string) => p.toLowerCase() === item.perm?.toLowerCase()
      );
      if (!hasPerm) return false;
    }

    return true;
  }).map((item: any) => {
    if (item.subItems) {
      const filteredSubs = item.subItems.filter((sub: any) => {
        if (session.role === 'SUPER_ADMIN') return true;

        // Sub-item feature gating
        if (sub.feature) {
          const hasFeature = session.packageFeatures?.includes(sub.feature);
          if (!hasFeature) return false;
        }

        if (sub.roles && !sub.roles.includes(session.role)) return false;

        return true;
      });
      return { ...item, subItems: filteredSubs };
    }
    return item;
  // ── Strict Parent Gating: hide groups where ALL sub-items are filtered out ──
  }).filter((item: any) => {
    if (item.subItems) {
      return item.subItems.length > 0;
    }
    return true;
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
      bg-pos-sidebar text-pos-sidebar-text flex flex-col sticky top-16 left-0 z-40 shadow-xl
      transition-all duration-500 ease-in-out overflow-hidden shrink-0
      dark:bg-slate-950 dark:border-r dark:border-slate-800
      ${isHidden ? 'w-0 opacity-0 pointer-events-none' : isOpen ? 'w-[260px]' : 'w-20'}
    `}>
      {/* Inner wrapper — fixed width so content doesn't squeeze during animation */}
      <div className={`${isOpen ? 'w-[260px]' : 'w-20'} flex flex-col h-full transition-all duration-500`}>
        {/* Branding Area */}
        <div className={`px-6 py-6 border-b border-white/5 bg-black/10 ${!isOpen && 'flex justify-center px-0'}`}>
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-pos-primary rounded-xl flex items-center justify-center shadow-lg shadow-pos-primary/20 overflow-hidden">
                {property?.logoUrl ? (
                  <img 
                    src={property.logoUrl} 
                    alt={property?.name || 'Logo'} 
                    className="w-full h-full object-contain p-0.5"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <span className="text-white font-black text-2xl italic">O</span>
                )}
             </div>
             {isOpen && (
                <div>
                   <p className="text-2xl font-black text-white tracking-tighter uppercase leading-none">
                     {property?.name ? (
                       <>{property.name.split(' ')[0]}<span className="text-pos-primary font-light">{property.name.split(' ').slice(1).join(' ')}</span></>
                     ) : (
                       <>Order<span className="text-pos-primary font-light">Mint</span></>
                     )}
                   </p>
                   <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">POS System</p>
                </div>
             )}
          </div>
        </div>

        {/* Nav items */}
        <div className="flex-1 overflow-y-auto no-scrollbar py-4 scroll-smooth">
          {loading ? (
            <div className="flex justify-center py-4 text-gray-500 text-xs">Loading navigation...</div>
          ) : filteredMenu.map((item) => {
            const isGroupActive = pathname === item.path || pathname.startsWith(item.path + '/');

            if (item.subItems) {
              const isGroupOpen = !!openGroups[item.name];
              return (
                <div key={item.name} className="px-3 mb-1">
                  <Link
                    href={item.path}
                    onClick={() => toggleGroup(item.name)}
                    className={`w-full flex items-center justify-between py-3 rounded-xl transition-all duration-200 group ${
                      isOpen ? 'px-4' : 'px-0 justify-center'
                    } ${
                      isGroupActive
                        ? 'bg-pos-primary text-white shadow-lg shadow-pos-primary/20'
                        : 'hover:bg-pos-sidebar-hover text-gray-400'
                    }`}
                  >
                    <div className={`flex items-center ${isOpen ? 'gap-4' : 'justify-center w-full'}`}>
                      <item.icon
                        size={20}
                        className={isGroupActive ? 'text-white' : 'text-gray-500 group-hover:text-pos-primary transition-colors'}
                      />
                      {isOpen && <span className="text-[13px] font-semibold tracking-tight uppercase">{item.name}</span>}
                    </div>
                    {isOpen && (isGroupOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
                  </Link>

                  {isOpen && isGroupOpen && (
                    <div className="mt-1 space-y-0.5 ml-9 border-l border-gray-800">
                      {item.subItems.map((sub: any) => {
                        const isSubActive = pathname === sub.path;
                        return (
                          <Link
                            key={sub.path}
                            href={sub.path}
                            target={sub.target}
                            className={`flex items-center px-4 py-2.5 text-[11px] font-bold uppercase tracking-tight transition-all rounded-md ${
                              isSubActive
                                ? 'text-pos-primary bg-pos-primary/10'
                                : 'text-gray-500 hover:text-white hover:bg-pos-sidebar-hover'
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
                  target={item.target}
                  className={`w-full flex items-center justify-between py-3 rounded-xl transition-all duration-200 group ${
                    isOpen ? 'px-4' : 'px-0 justify-center'
                  } ${
                    pathname === item.path
                      ? 'bg-pos-primary text-white shadow-lg shadow-pos-primary/20'
                      : 'hover:bg-pos-sidebar-hover text-gray-400 hover:text-white'
                  }`}
                >
                  <div className={`flex items-center ${isOpen ? 'gap-4' : 'justify-center w-full'}`}>
                    <item.icon
                      size={20}
                      className={pathname === item.path ? 'text-white' : 'text-gray-500 group-hover:text-pos-primary transition-colors'}
                    />
                    {isOpen && <span className="text-[13px] font-semibold tracking-tight uppercase">{item.name}</span>}
                  </div>
                </Link>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className={`p-4 bg-black/20 ${!isOpen && 'flex items-center justify-center'}`}>
          {isOpen && (
            <div className="space-y-2 opacity-50 border-b border-white/5 pb-4 mb-4">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                <span className="text-gray-500">Ref ID</span>
                <span>#45920-A</span>
              </div>
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-pos-primary">
                <span className="text-gray-500">Biller</span>
                <span>Ritchie POS</span>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 py-3 rounded-xl hover:bg-pos-primary text-gray-400 hover:text-white transition-all text-[13px] font-bold uppercase tracking-tight group ${
              isOpen ? 'px-4' : 'px-0 justify-center'
            }`}
          >
            <div className={`flex items-center ${isOpen ? 'gap-3' : 'justify-center w-full'}`}>
              <LogOut size={18} className="group-hover:rotate-12 transition-transform" />
              {isOpen && <span>Logout System</span>}
            </div>
          </button>
        </div>
      </div>
    </aside>
  );
};
