'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { ActionTile } from '@/components/shared/action-tile';
import { operationsGrid } from '@/lib/menu-config';
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
  Trash2
} from 'lucide-react';

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
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [debug, setDebug] = useState(false);

  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) setSession(data.user);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Check for debug mode
    if (typeof window !== 'undefined' && window.location.search.includes('debug=true')) {
      setDebug(true);
    }
  }, []);

  if (loading) return null;

  const role = session?.role;
  const permissions = (session?.permissions || []).map((p: string) => p.trim().toLowerCase());
  const isAdmin = role === 'RESTAURANTS_ADMIN' || role === 'SUPER_ADMIN' || role === 'POSSYSTEM';

  const hasPermission = (perm?: string) => {
    if (!perm || isAdmin) return true;
    return session?.permissions?.some((p: string) => p.toLowerCase() === perm.toLowerCase());
  };

  const hasFeature = (feature?: string) => {
    if (role === 'SUPER_ADMIN') return true;
    if (!feature) return true;
    return session?.packageFeatures?.includes(feature);
  };

  const managementActions: DashboardAction[] = [
    { label: 'One-Page Setup', icon: LayoutGrid, path: '/setup', roles: ['RESTAURANTS_ADMIN', 'SUPER_ADMIN', 'POSSYSTEM'] },
    { label: role === 'SUPER_ADMIN' ? 'Global Businesses' : 'My Properties', perm: 'Businesses', icon: Map, path: role === 'SUPER_ADMIN' ? '/admin/properties' : '/manage-properties', roles: ['RESTAURANTS_ADMIN', 'SUPER_ADMIN'] },
    { label: role === 'SUPER_ADMIN' ? 'Global Access' : 'POS Access', perm: 'POS Access', icon: Users, path: '/manage-users', roles: ['RESTAURANTS_ADMIN', 'SUPER_ADMIN'] },
    { label: 'POS Staff', perm: 'POS Staff', icon: Users, path: '/pos-staff', feature: 'STAFF' },
    { label: 'Payment Modes', perm: 'Settings', icon: CreditCard, path: '/payment-modes', roles: ['RESTAURANTS_ADMIN', 'SUPER_ADMIN', 'POSSYSTEM'] },
    { label: 'Inventory', perm: 'Inventory', icon: Package, path: '/inventory', feature: 'INVENTORY', roles: ['POSSYSTEM', 'RESTAURANTS_ADMIN', 'SUPER_ADMIN'] },
    { label: 'Menu Items', perm: 'Inventory', icon: Menu, path: '/products', feature: 'POS', roles: ['POSSYSTEM', 'RESTAURANTS_ADMIN', 'SUPER_ADMIN'] },
    { label: 'Categories', perm: 'Inventory', icon: Layers, path: '/categories', feature: 'POS', roles: ['POSSYSTEM', 'RESTAURANTS_ADMIN', 'SUPER_ADMIN'] },
    { label: 'Table Layout', perm: 'Table Layout', icon: Layers, path: '/operations/tables', feature: 'TABLES', roles: ['POSSYSTEM', 'RESTAURANTS_ADMIN', 'SUPER_ADMIN'] },
    { label: 'QR Gallery', perm: 'Table Layout', icon: Printer, path: '/operations/tables/qr-gallery', feature: 'TABLES' },
    { label: 'Customers', icon: Contact, path: '/customers' },
    { label: 'Customer Feedback', icon: Star, path: '/reports/ratings', feature: 'REPORTS' },
  ];

  const financialActions: DashboardAction[] = [
    { label: 'Invoices', perm: 'Invoices', icon: FileText, path: '/invoices', feature: 'POS', roles: ['POSSYSTEM', 'RESTAURANTS_ADMIN', 'SUPER_ADMIN'] },
    { label: 'Payments', perm: 'Payments', icon: CreditCard, path: '/payments', feature: 'POS', roles: ['POSSYSTEM', 'RESTAURANTS_ADMIN', 'SUPER_ADMIN'] },
    { label: 'Expenses', perm: 'Expenses', icon: TrendingDown, path: '/expenses', feature: 'ACCOUNTING', roles: ['POSSYSTEM', 'RESTAURANTS_ADMIN', 'SUPER_ADMIN'] },
    { label: 'Accounting', perm: 'Accounting', icon: BookOpen, path: '/accounts', feature: 'ACCOUNTING' },
    { label: 'Reports', perm: 'Reports', icon: PieChart, path: '/reports', feature: 'REPORTS' },
    { label: 'Attendance Report', perm: 'Reports', icon: Users, path: '/reports/attendance', feature: 'REPORTS' },
    { label: 'Day Closing', perm: 'Day Closing', icon: DayClosing, path: '/day-closing', feature: 'POS' },
    { label: 'GST Filing', perm: 'GST Filing', icon: FileJson, path: '/pos/gst-filing', feature: 'GST', roles: ['POSSYSTEM', 'RESTAURANTS_ADMIN', 'SUPER_ADMIN'] },
  ];

  const operationalActions: DashboardAction[] = [
    { label: 'POS Terminal',      perm: 'POS Terminal',    icon: Monitor,        path: '/billing',           feature: 'POS' },
    { label: 'Counter Payments',  perm: 'POS Terminal',    icon: Store,          path: '/counter-payments',  feature: 'POS' },
    { label: 'Orders Control',    perm: 'Orders Control',  icon: ShoppingBag,    path: '/orders',            feature: 'POS', roles: ['RESTAURANTS_ADMIN', 'SUPER_ADMIN'] },
    { label: 'Kitchen Display',   perm: 'Kitchen Display', icon: Eye,            path: '/kitchen-display',   feature: 'POS' },
    { label: 'Live Notifications', icon: Bell,             path: '/operations/notifications', feature: 'POS' },
    { label: 'Notification Settings', icon: Settings,      path: '/settings/notifications', feature: 'POS' },
    { label: 'Staff Attendance',  perm: 'POS Staff',       icon: Clock,          path: '/staff/attendance',  feature: 'STAFF' },
    { label: 'KOTs List',         perm: 'KOTs',            icon: ClipboardList,  path: '/kots',              feature: 'POS' },
    { label: 'Table Bookings',    perm: 'Table Bookings',  icon: CalendarDays,   path: '/table-reservations', feature: 'TABLES', roles: ['POSSYSTEM'] },
    { label: 'Drivers',           perm: 'Drivers',         icon: CarFront,       path: '/drivers',           feature: 'DRIVERS' },
    { label: 'Waste Management',  perm: 'POS Terminal',    icon: Trash2,         path: '/operations/waste-management', feature: 'POS' },
  ];

  const masterConfigs: DashboardAction[] = [
    { label: 'One-Page Setup', icon: LayoutGrid, path: '/setup', variant: 'config' },
    { label: 'Menu Items', perm: 'Inventory', icon: Menu, path: '/products', feature: 'POS', roles: ['POSSYSTEM'] },
    { label: 'Categories', perm: 'Inventory', icon: Layers, path: '/categories', feature: 'POS', roles: ['POSSYSTEM'] },
    { label: 'Tax Setup', perm: 'Settings', icon: ShieldCheck, path: '/settings' },
    { label: 'Discounts', perm: 'Settings', icon: Percent, path: '/settings' },
    { label: 'System Settings', perm: 'Settings', icon: Settings, path: '/settings' },
  ];

  const operatorUtilities: DashboardAction[] = [
    { label: 'Print Settings', perm: 'Settings', icon: Printer, path: '/settings' },
    { label: 'Inventory Sync', icon: RefreshCw },
    { label: 'Support Help', icon: RefreshCw },
  ];

  const isVisible = (a: DashboardAction) => {
    const hasCorrectRole = !a.roles || a.roles.includes(session?.role);
    if (!hasCorrectRole) return false;
    
    const hasCorrectFeature = hasFeature(a.feature);
    if (!hasCorrectFeature) return false;

    if (session?.role === 'POSSYSTEM' && a.roles?.includes('POSSYSTEM')) return true;

    return hasPermission(a.perm);
  };

  const visibleManagement = managementActions.filter(isVisible);
  const showManagement = isAdmin || (visibleManagement.length > 0);

  const visibleFinancial = financialActions.filter(isVisible);
  const showFinancial = isAdmin || (visibleFinancial.length > 0);

  const visibleOperational = operationalActions.filter(isVisible);
  const visibleConfigs = masterConfigs.filter(isVisible);

  return (
    <div className="space-y-12 pb-20">
      <PageHeader
        title="Operations Command Center"
        subtitle={isAdmin ? "Centralized management for your entire business portfolio." : "Direct access to terminal controls and order management."}
      />

      {/* Quick Setup Banner */}
      {isAdmin && (
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-indigo-950 rounded-[32px] p-8 text-white shadow-xl animate-in fade-in slide-in-from-top-6 duration-1000 group">
           <div className="absolute top-0 right-0 w-64 h-64 bg-pos-primary/10 blur-[100px] rounded-full -mr-20 -mt-20" />
           <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center md:text-left">
                 <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/10 text-[9px] font-black uppercase tracking-[0.2em]">
                    <Sparkles size={12} className="text-pos-primary" />
                    High Efficiency Setup
                 </div>
                 <h2 className="text-2xl md:text-3xl font-black tracking-tight leading-none uppercase">One-Page <span className="text-pos-primary">Setup</span></h2>
                 <p className="text-white/60 text-xs font-medium max-w-md leading-relaxed">
                    Configure your entire database — Products, Categories, Tables, and Inventory — all from a single master page.
                 </p>
              </div>
              
              <button 
                onClick={() => window.location.href = '/setup'}
                className="bg-white text-slate-950 px-8 py-4 rounded-[20px] font-black text-[10px] uppercase tracking-[0.2em] shadow-lg hover:scale-105 active:scale-95 transition-all group/btn"
              >
                Start Master Setup <ArrowRight size={16} className="ml-2 inline-block group-hover/btn:translate-x-1 transition-transform" />
              </button>
           </div>
        </div>
      )}

      {/* Sections */}
      {showManagement && (
        <section className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="h-6 w-1 bg-pos-primary rounded-full"></div>
            <h2 className="text-sm font-black section-heading uppercase tracking-[0.2em]">Business & Team Management</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {visibleManagement.map((action) => (
              <ActionTile key={action.label} icon={action.icon} label={action.label} path={action.path} />
            ))}
          </div>
        </section>
      )}

      {showFinancial && (
        <section className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="h-6 w-1 bg-emerald-600 rounded-full"></div>
            <h2 className="text-sm font-black section-heading uppercase tracking-[0.2em]">Financial Operations & Revenue</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {visibleFinancial.map((action) => (
              <ActionTile key={action.label} icon={action.icon} label={action.label} path={action.path} />
            ))}
          </div>
        </section>
      )}

      <section className="space-y-8">
        <div className="flex items-center gap-4">
          <div className="h-6 w-1 bg-pos-primary rounded-full"></div>
          <h2 className="text-sm font-black section-heading uppercase tracking-[0.2em]">{isAdmin ? 'Terminal & POS Controls' : 'Quick Actions'}</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {visibleOperational.map((action) => (
            <ActionTile key={action.label} icon={action.icon} label={action.label} path={action.path} />
          ))}
        </div>
      </section>

      {/* Integrated Attendance Hub Section */}
      <section className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-6 w-1 bg-indigo-600 rounded-full"></div>
            <h2 className="text-sm font-black section-heading uppercase tracking-[0.2em]">Staff Attendance Terminal</h2>
          </div>
          <button 
            onClick={() => window.location.href = '/staff/attendance'}
            className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
          >
            Open Full Hub
          </button>
        </div>
        
        <div className="bg-slate-50 dark:bg-slate-900/30 rounded-[48px] p-8 border border-slate-100 dark:border-slate-800/50">
           <AttendanceHubSection />
        </div>
      </section>

      {/* Debug Footer */}
      {debug && (
        <div className="fixed bottom-0 right-0 bg-black/80 text-white p-4 m-4 rounded-xl text-[10px] font-mono z-[9999] max-w-xs ring-2 ring-pos-primary">
          <p className="font-bold text-pos-primary border-b border-white/20 pb-1 mb-2">SESSION DEBUG</p>
          <p>ROLE: {role}</p>
          <button onClick={() => setDebug(false)} className="mt-3 w-full bg-white/10 hover:bg-white/20 py-1 rounded-md uppercase tracking-widest">Close Debug</button>
        </div>
      )}
    </div>
  );
}
