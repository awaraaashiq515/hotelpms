'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { ActionTile } from '@/components/shared/action-tile';
import AttendanceHubSection from '@/components/staff/AttendanceHubSection';
import {
  Menu,
  Printer,
  ShieldCheck,
  Percent,
  Monitor,
  Settings,
  ToggleLeft,
  RefreshCw,
  PlusCircle,
  Users,
  Map,
  CreditCard,
  FileText,
  ShoppingBag,
  Package,
  TrendingDown,
  BookOpen,
  History as DayClosing,
  Layers,
  CalendarDays,
  CarFront,
  Eye,
  PieChart,
  History,
  ClipboardList,
  Contact,
  Store,
  FileJson,
  Star,
  LayoutGrid,
  Sparkles,
  ArrowRight,
  Clock,
  Bell,
  Trash2,
  Truck,
  Home,
  Bike,
  Tablet,
  Search,
  X
} from 'lucide-react';

import { useRouter, useParams } from 'next/navigation';
import { useSidebar } from '@/context/sidebar-context';

interface DashboardAction {
  label: string;
  path?: string;
  icon: any;
  perm?: string;
  feature?: string;
  roles?: string[];
  variant?: 'config' | 'default';
}

export default function OperationsPage() {
  const params = useParams();
  const propertyCode = params?.propertyCode as string;
  const p = propertyCode ? `/${propertyCode}` : '';

  const router = useRouter();
  const { setOpen } = useSidebar();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [debug, setDebug] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setOpen(false);
    return () => setOpen(true);
  }, [setOpen]);

  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          setSession(data.user);
          if (data.user.role === 'DELIVERY_RIDER') {
            router.push('/driver-portal');
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));

    if (typeof window !== 'undefined' && window.location.search.includes('debug=true')) {
      setDebug(true);
    }
  }, []);

  if (loading) return null;

  const role = session?.role;
  const isAdmin = role === 'RESTAURANTS_ADMIN' || role === 'SUPER_ADMIN' || role === 'POSSYSTEM';

  const hasPermission = (perm?: string) => {
    if (!perm || isAdmin) return true;
    return session?.permissions?.some((p: string) => p.toLowerCase() === perm.toLowerCase());
  };

  const hasFeature = (feature?: string) => {
    if (role === 'SUPER_ADMIN') return true;
    if (!feature) return true;
    const isCrmBypass = feature === 'CRM' && (role === 'RESTAURANTS_ADMIN' || role === 'POSSYSTEM');
    return isCrmBypass || session?.packageFeatures?.includes(feature);
  };

  const managementActions: DashboardAction[] = [
    { label: 'Inventory', perm: 'Inventory', icon: Package, path: `${p}/inventory`, feature: 'INVENTORY', roles: ['POSSYSTEM', 'RESTAURANTS_ADMIN', 'SUPER_ADMIN'] },
    { label: 'Menu Items', perm: 'Inventory', icon: Menu, path: `${p}/products`, feature: 'POS', roles: ['POSSYSTEM', 'RESTAURANTS_ADMIN', 'SUPER_ADMIN'] },
    { label: 'Categories', perm: 'Inventory', icon: Layers, path: `${p}/categories`, feature: 'POS', roles: ['POSSYSTEM', 'RESTAURANTS_ADMIN', 'SUPER_ADMIN'] },
    { label: 'Customers', icon: Contact, path: `${p}/customers`, feature: 'CRM' },
    { label: 'Customer Feedback', icon: Star, path: `${p}/reports/ratings`, feature: 'REPORTS' },
    { label: 'Table Layout', perm: 'Table Layout', icon: Layers, path: `${p}/operations/tables`, feature: 'TABLES', roles: ['POSSYSTEM', 'RESTAURANTS_ADMIN', 'SUPER_ADMIN'] },
    { label: 'QR Gallery', perm: 'Table Layout', icon: Printer, path: `${p}/operations/tables/qr-gallery`, feature: 'TABLES' },
    { label: 'Tablet Setup', perm: 'Settings', icon: Tablet, path: `${p}/settings/tablets`, feature: 'TABLETS', roles: ['RESTAURANTS_ADMIN', 'SUPER_ADMIN', 'POSSYSTEM'] },
    { label: 'POS Staff', perm: 'POS Staff', icon: Users, path: `${p}/pos-staff`, feature: 'STAFF' },
    { label: role === 'SUPER_ADMIN' ? 'Global Access' : 'POS Access', perm: 'POS Access', icon: Users, path: `${p}/manage-users`, roles: ['RESTAURANTS_ADMIN', 'SUPER_ADMIN'] },
    { label: 'Payment Modes', perm: 'Settings', icon: CreditCard, path: `${p}/payment-modes`, roles: ['RESTAURANTS_ADMIN', 'SUPER_ADMIN', 'POSSYSTEM'] },
    { label: 'Notification Settings', perm: 'Settings', icon: Settings, path: `${p}/settings/notifications`, feature: 'POS' },
    { label: role === 'SUPER_ADMIN' ? 'Global Businesses' : 'My Properties', perm: 'Businesses', icon: Map, path: role === 'SUPER_ADMIN' ? '/admin/properties' : '/manage-properties', roles: ['RESTAURANTS_ADMIN', 'SUPER_ADMIN'] },
  ];

  const financialActions: DashboardAction[] = [
    { label: 'Day Closing', perm: 'Day Closing', icon: DayClosing, path: `${p}/day-closing`, feature: 'POS' },
    { label: 'Payments', perm: 'Payments', icon: CreditCard, path: `${p}/payments`, feature: 'POS', roles: ['POSSYSTEM', 'RESTAURANTS_ADMIN', 'SUPER_ADMIN'] },
    { label: 'Invoices', perm: 'Invoices', icon: FileText, path: `${p}/invoices`, feature: 'POS', roles: ['POSSYSTEM', 'RESTAURANTS_ADMIN', 'SUPER_ADMIN'] },
    { label: 'Expenses', perm: 'Expenses', icon: TrendingDown, path: `${p}/expenses`, feature: 'ACCOUNTING', roles: ['POSSYSTEM', 'RESTAURANTS_ADMIN', 'SUPER_ADMIN'] },
    { label: 'Reports', perm: 'Reports', icon: PieChart, path: `${p}/reports`, feature: 'REPORTS' },
    { label: 'Attendance Report', perm: 'Reports', icon: Users, path: `${p}/reports/attendance`, feature: 'REPORTS' },
    { label: 'Accounting', perm: 'Accounting', icon: BookOpen, path: `${p}/accounts`, feature: 'ACCOUNTING' },
    { label: 'GST Filing', perm: 'GST Filing', icon: FileJson, path: `${p}/pos/gst-filing`, feature: 'GST', roles: ['POSSYSTEM', 'RESTAURANTS_ADMIN', 'SUPER_ADMIN'] },
  ];

  const operationalActions: DashboardAction[] = [
    { label: 'One-Page Setup', icon: LayoutGrid, path: `${p}/setup`, roles: ['RESTAURANTS_ADMIN', 'SUPER_ADMIN', 'POSSYSTEM'] },
    { label: 'POS Terminal',      perm: 'POS Terminal',    icon: Monitor,        path: `${p}/billing`,           feature: 'POS' },
    { label: 'Counter Payments',  perm: 'POS Terminal',    icon: Store,          path: `${p}/counter-payments`,  feature: 'POS' },
    { label: 'Customers',         icon: Contact,           path: `${p}/customers`,         feature: 'CRM',             roles: ['RESTAURANTS_ADMIN', 'SUPER_ADMIN', 'POSSYSTEM'] },
    { label: 'Orders Control',    perm: 'Orders Control',  icon: ShoppingBag,    path: `${p}/orders`,            feature: 'POS', roles: ['RESTAURANTS_ADMIN', 'SUPER_ADMIN'] },
    { label: 'KOTs List',         perm: 'KOTs',            icon: ClipboardList,  path: `${p}/kots`,              feature: 'POS' },
    { label: 'Kitchen Display',   perm: 'Kitchen Display', icon: Eye,            path: `${p}/kitchen-display`,   feature: 'POS' },
    { label: 'Live Notifications', icon: Bell,             path: `${p}/operations/notifications`, feature: 'POS' },
    { label: 'Table Bookings',    perm: 'Table Bookings',  icon: CalendarDays,   path: `${p}/table-reservations`, feature: 'TABLES', roles: ['POSSYSTEM'] },
    { label: 'Staff Attendance',  perm: 'POS Staff',       icon: Clock,          path: `${p}/staff/attendance`,  feature: 'STAFF' },
    { label: 'Drivers',           perm: 'Drivers',         icon: CarFront,       path: `${p}/drivers`,           feature: 'DRIVERS' },
    { label: 'Rider Portal',      perm: 'Drivers',         icon: Bike,           path: `${p}/driver-portal`,     feature: 'DRIVERS' },
    { label: 'Waste Management',  perm: 'POS Terminal',    icon: Trash2,         path: `${p}/operations/waste-management`, feature: 'POS' },
    { label: 'Home Delivery Area', perm: 'Table Layout',    icon: Home,           path: `${p}/operations/delivery`,       feature: 'TABLES' },
    { label: 'Home Delivery QR',   perm: 'Table Layout',    icon: Home,           path: `${p}/operations/delivery-flyer`, feature: 'TABLES' },
  ];

  const b2bActions: DashboardAction[] = [
    { label: 'B2B Marketplace',   icon: ShoppingBag,    path: `${p}/b2b/market`,   feature: 'B2B', roles: ['RESTAURANTS_ADMIN', 'SUPER_ADMIN', 'POSSYSTEM'] },
    { label: 'Order History',    icon: Truck,          path: `${p}/b2b/orders`,   feature: 'B2B', roles: ['RESTAURANTS_ADMIN', 'SUPER_ADMIN', 'POSSYSTEM'] },
    { label: 'Supplier Hub',     icon: Store,          path: `${p}/b2b/supplier`, feature: 'B2B', roles: ['RESTAURANTS_ADMIN', 'SUPER_ADMIN'] },
  ];

  const isVisible = (a: DashboardAction) => {
    const hasCorrectRole = !a.roles || a.roles.includes(session?.role);
    if (!hasCorrectRole) return false;
    const hasCorrectFeature = hasFeature(a.feature);
    if (!hasCorrectFeature) return false;
    return hasPermission(a.perm);
  };

  const visibleManagement = managementActions.filter(isVisible);
  const visibleFinancial = financialActions.filter(isVisible);
  const visibleOperational = operationalActions.filter(isVisible);
  const visibleB2B = b2bActions.filter(isVisible);

  const allVisibleActions = [
    ...visibleOperational.map(a => ({ ...a, category: 'POS Terminal & Orders' })),
    ...visibleFinancial.map(a => ({ ...a, category: 'Financial & Revenue' })),
    ...visibleManagement.map(a => ({ ...a, category: 'Team & Management' })),
    ...visibleB2B.map(a => ({ ...a, category: 'B2B Supply Chain' }))
  ];

  const filteredActions = searchQuery.trim() === ''
    ? []
    : allVisibleActions.filter(action =>
        action.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        action.category.toLowerCase().includes(searchQuery.toLowerCase())
      );

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && filteredActions.length > 0) {
      const firstAction = filteredActions[0];
      if (firstAction.path) {
        if (firstAction.path === '/kitchen-display') {
          window.open(firstAction.path, '_blank');
        } else {
          router.push(firstAction.path);
        }
      }
    } else if (e.key === 'Escape') {
      setSearchQuery('');
    }
  };

  return (
    <div className="space-y-10 pb-20">
      <PageHeader
        title="Operations Command Center"
        subtitle={isAdmin ? "Centralized management for your entire business portfolio." : "Direct access to terminal controls and order management."}
        actions={
          <div className="relative w-full md:w-72 lg:w-80 group">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 w-4 h-4 transition-colors group-focus-within:text-pos-primary" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search operations..."
                className="w-full pl-9 pr-8 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:border-slate-300 dark:hover:border-slate-700 focus:border-pos-primary dark:focus:border-pos-primary focus:ring-4 focus:ring-pos-primary/10 dark:focus:ring-pos-primary/20 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-xs font-semibold transition-all outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        }
      />

      {/* Real-time Search Results Grid */}
      {searchQuery.trim() !== '' && (
        <section className="space-y-6 bg-slate-50/50 dark:bg-slate-900/10 p-6 rounded-[32px] border border-dashed border-slate-200 dark:border-slate-850/80 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-6 w-1 bg-pos-primary rounded-full animate-pulse"></div>
              <h2 className="text-sm font-black section-heading uppercase tracking-[0.2em] text-pos-primary">Search Results ({filteredActions.length})</h2>
            </div>
            <button
              onClick={() => setSearchQuery('')}
              className="text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-pos-primary transition-colors cursor-pointer"
            >
              Clear Search
            </button>
          </div>
          {filteredActions.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 animate-in fade-in slide-in-from-top-2 duration-200">
              {filteredActions.map((action) => (
                <div key={`${action.category}-${action.label}`} className="relative group">
                  <ActionTile icon={action.icon} label={action.label} path={action.path} />
                  <span className="absolute top-2 right-2 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-slate-100/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 opacity-60 group-hover:opacity-100 transition-opacity">
                    {action.category.split(' ')[0]}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
              <div className="p-3 bg-slate-100 dark:bg-slate-800/50 rounded-2xl text-slate-400 dark:text-slate-500">
                <Search className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">No operations found matching "{searchQuery}"</p>
              <p className="text-[11px] text-slate-400 uppercase tracking-wider">Try typing "billing", "inventory", or "report"</p>
            </div>
          )}
        </section>
      )}

      {/* Main Categories Panel - Hidden when active search query to avoid clutter */}
      {searchQuery.trim() === '' && (
        <div className="space-y-12 animate-in fade-in duration-300">
          
          {/* 1. POS Terminal & Orders Section (Highest Frequency Usage) */}
          <section className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="h-6 w-1 bg-pos-primary rounded-full"></div>
              <h2 className="text-sm font-black section-heading uppercase tracking-[0.2em]">POS Terminal & Orders</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {visibleOperational.map((action) => (
                <ActionTile key={action.label} icon={action.icon} label={action.label} path={action.path} />
              ))}
            </div>
          </section>

          {/* 2. Financial & Revenue Section (Medium-High Frequency Usage) */}
          <section className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="h-6 w-1 bg-emerald-600 rounded-full"></div>
              <h2 className="text-sm font-black section-heading uppercase tracking-[0.2em]">Financial & Revenue</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {visibleFinancial.map((action) => (
                <ActionTile key={action.label} icon={action.icon} label={action.label} path={action.path} />
              ))}
            </div>
          </section>

          {/* 3. Team & Management Section (Setup & occasional configurations) */}
          <section className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="h-6 w-1 bg-indigo-600 rounded-full"></div>
              <h2 className="text-sm font-black section-heading uppercase tracking-[0.2em]">Team & Management</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {visibleManagement.map((action) => (
                <ActionTile key={action.label} icon={action.icon} label={action.label} path={action.path} />
              ))}
            </div>
          </section>

          {/* B2B Marketplace Quick Access */}
          {visibleB2B.length > 0 && (
            <section className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="h-6 w-1 bg-amber-500 rounded-full"></div>
                <h2 className="text-sm font-black section-heading uppercase tracking-[0.2em]">B2B Supply Chain</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                {visibleB2B.map((action) => (
                  <ActionTile key={action.label} icon={action.icon} label={action.label} path={action.path} />
                ))}
              </div>
            </section>
          )}

          {/* Staff Attendance Terminal */}
          <section className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="h-6 w-1 bg-pos-primary rounded-full"></div>
              <h2 className="text-sm font-black section-heading uppercase tracking-[0.2em]">Staff Attendance Terminal</h2>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/30 rounded-[48px] p-8 border border-slate-100 dark:border-slate-800/50">
               <AttendanceHubSection />
            </div>
          </section>

        </div>
      )}
    </div>
  );
}
