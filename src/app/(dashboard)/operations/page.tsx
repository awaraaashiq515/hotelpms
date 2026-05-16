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
  Trash2,
  Truck
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
    { label: 'Notification Settings', perm: 'Settings', icon: Settings, path: '/settings/notifications', feature: 'POS' },
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
    { label: 'Staff Attendance',  perm: 'POS Staff',       icon: Clock,          path: '/staff/attendance',  feature: 'STAFF' },
    { label: 'KOTs List',         perm: 'KOTs',            icon: ClipboardList,  path: '/kots',              feature: 'POS' },
    { label: 'Table Bookings',    perm: 'Table Bookings',  icon: CalendarDays,   path: '/table-reservations', feature: 'TABLES', roles: ['POSSYSTEM'] },
    { label: 'Drivers',           perm: 'Drivers',         icon: CarFront,       path: '/drivers',           feature: 'DRIVERS' },
    { label: 'Waste Management',  perm: 'POS Terminal',    icon: Trash2,         path: '/operations/waste-management', feature: 'POS' },
  ];

  const b2bActions: DashboardAction[] = [
    { label: 'B2B Marketplace',   icon: ShoppingBag,    path: '/b2b/market',   roles: ['RESTAURANTS_ADMIN', 'SUPER_ADMIN', 'POSSYSTEM'] },
    { label: 'Order History',    icon: Truck,          path: '/b2b/orders',   roles: ['RESTAURANTS_ADMIN', 'SUPER_ADMIN', 'POSSYSTEM'] },
    { label: 'Supplier Hub',     icon: Store,          path: '/b2b/supplier', roles: ['RESTAURANTS_ADMIN', 'SUPER_ADMIN'] },
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

  return (
    <div className="space-y-12 pb-20">
      <PageHeader
        title="Operations Command Center"
        subtitle={isAdmin ? "Centralized management for your entire business portfolio." : "Direct access to terminal controls and order management."}
      />

      {/* B2B Marketplace Quick Access */}
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

      <section className="space-y-8">
        <div className="flex items-center gap-4">
          <div className="h-6 w-1 bg-pos-primary rounded-full"></div>
          <h2 className="text-sm font-black section-heading uppercase tracking-[0.2em]">Team & Management</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {visibleManagement.map((action) => (
            <ActionTile key={action.label} icon={action.icon} label={action.label} path={action.path} />
          ))}
        </div>
      </section>

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

      <section className="space-y-8">
        <div className="flex items-center gap-4">
          <div className="h-6 w-1 bg-indigo-600 rounded-full"></div>
          <h2 className="text-sm font-black section-heading uppercase tracking-[0.2em]">Staff Attendance Terminal</h2>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900/30 rounded-[48px] p-8 border border-slate-100 dark:border-slate-800/50">
           <AttendanceHubSection />
        </div>
      </section>
    </div>
  );
}
