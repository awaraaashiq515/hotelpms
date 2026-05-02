'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { ActionTile } from '@/components/shared/action-tile';
import { operationsGrid } from '@/lib/menu-config';
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
  FileJson
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
  const isAdmin = role === 'RESTAURANTS_ADMIN' || role === 'SUPER_ADMIN';

  const hasPermission = (perm?: string) => {
    if (!perm || isAdmin) return true;
    // For POS Staff, some things should be accessible by role if permission string is missing but role is explicitly allowed
    return session?.permissions?.some((p: string) => p.toLowerCase() === perm.toLowerCase());
  };

  const hasFeature = (feature?: string) => {
    if (role === 'SUPER_ADMIN') return true;
    if (!feature) return true;
    return session?.packageFeatures?.includes(feature);
  };

  const managementActions: DashboardAction[] = [
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
  ];

  const financialActions: DashboardAction[] = [
    { label: 'Invoices', perm: 'Invoices', icon: FileText, path: '/invoices', feature: 'POS', roles: ['POSSYSTEM', 'RESTAURANTS_ADMIN', 'SUPER_ADMIN'] },
    { label: 'Payments', perm: 'Payments', icon: CreditCard, path: '/payments', feature: 'POS', roles: ['POSSYSTEM', 'RESTAURANTS_ADMIN', 'SUPER_ADMIN'] },
    { label: 'Expenses', perm: 'Expenses', icon: TrendingDown, path: '/expenses', feature: 'ACCOUNTING', roles: ['POSSYSTEM', 'RESTAURANTS_ADMIN', 'SUPER_ADMIN'] },
    { label: 'Accounting', perm: 'Accounting', icon: BookOpen, path: '/accounts', feature: 'ACCOUNTING' },
    { label: 'Reports', perm: 'Reports', icon: PieChart, path: '/reports', feature: 'REPORTS' },
    { label: 'Day Closing', perm: 'Day Closing', icon: DayClosing, path: '/day-closing', feature: 'POS' },
    { label: 'GST Filing', perm: 'GST Filing', icon: FileJson, path: '/pos/gst-filing', feature: 'GST', roles: ['POSSYSTEM', 'RESTAURANTS_ADMIN', 'SUPER_ADMIN'] },
  ];

  const operationalActions: DashboardAction[] = [
    { label: 'POS Terminal',      perm: 'POS Terminal',    icon: Monitor,        path: '/billing',           feature: 'POS' },
    { label: 'Counter Payments',  perm: 'POS Terminal',    icon: Store,          path: '/counter-payments',  feature: 'POS' },
    { label: 'Orders Control',    perm: 'Orders Control',  icon: ShoppingBag,    path: '/orders',            feature: 'POS', roles: ['RESTAURANTS_ADMIN', 'SUPER_ADMIN'] },
    { label: 'Kitchen Display',   perm: 'Kitchen Display', icon: Eye,            path: '/kitchen-display',   feature: 'POS' },
    { label: 'KOTs List',         perm: 'KOTs',            icon: ClipboardList,  path: '/kots',              feature: 'POS' },
    { label: 'Table Bookings',    perm: 'Table Bookings',  icon: CalendarDays,   path: '/table-reservations', feature: 'TABLES', roles: ['POSSYSTEM'] },
    { label: 'Drivers',           perm: 'Drivers',         icon: CarFront,       path: '/drivers',           feature: 'DRIVERS' },
  ];

  // Configs only for Admins
  const masterConfigs: DashboardAction[] = [
    { label: 'Menu Items', perm: 'Inventory', icon: Menu, path: '/products', feature: 'POS', roles: ['POSSYSTEM'] },
    { label: 'Categories', perm: 'Inventory', icon: Layers, path: '/categories', feature: 'POS', roles: ['POSSYSTEM'] },
    { label: 'Tax Setup', perm: 'Settings', icon: ShieldCheck, path: '/settings' },
    { label: 'Discounts', perm: 'Settings', icon: Percent, path: '/settings' },
    { label: 'System Settings', perm: 'Settings', icon: Settings, path: '/settings' },
  ];

  // Configs for Everyone (Support/Utilities)
  const operatorUtilities: DashboardAction[] = [
    { label: 'Print Settings', perm: 'Settings', icon: Printer, path: '/settings' },
    { label: 'Inventory Sync', icon: RefreshCw },
    { label: 'Support Help', icon: RefreshCw },
  ];

  if (loading) return null;

  const isVisible = (a: DashboardAction) => {
    const hasCorrectRole = !a.roles || a.roles.includes(session?.role);
    if (!hasCorrectRole) return false;
    
    const hasCorrectFeature = hasFeature(a.feature);
    if (!hasCorrectFeature) return false;

    // If role is explicitly POSSYSTEM and it's in the roles array, 
    // we allow access to standard POS management tasks even if the specific permission string is missing
    if (session?.role === 'POSSYSTEM' && a.roles?.includes('POSSYSTEM')) return true;

    return hasPermission(a.perm);
  };

  // 1. Administrative Section
  const visibleManagement = managementActions.filter(isVisible);
  const showManagement = isAdmin || (visibleManagement.length > 0);

  // 2. Financial Section
  const visibleFinancial = financialActions.filter(isVisible);
  const showFinancial = isAdmin || (visibleFinancial.length > 0);

  // 3. Operational Section
  const visibleOperational = operationalActions.filter(isVisible);

  // 4. Config Section
  const visibleConfigs = masterConfigs.filter(isVisible);

  return (
    <div className="space-y-12 pb-20">
      <PageHeader
        title="Operations Command Center"
        subtitle={isAdmin ? "Centralized management for your entire business portfolio." : "Direct access to terminal controls and order management."}
      />

      {/* 1. Administrative Section */}
      {showManagement && (
        <section className="space-y-8 animate-in slide-in-from-left-4 duration-500">
          <div className="flex items-center gap-4">
            <div className="h-6 w-1 bg-pos-primary rounded-full"></div>
            <h2 className="text-sm font-black section-heading uppercase tracking-[0.2em]">Business & Team Management</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {visibleManagement.map((action) => (
              <ActionTile
                key={action.label}
                icon={action.icon}
                label={action.label}
                path={action.path}
              />
            ))}
          </div>
        </section>
      )}

      {/* 2. Financial Section */}
      {showFinancial && (
        <section className="space-y-8 animate-in slide-in-from-left-4 duration-500 delay-75">
          <div className="flex items-center gap-4">
            <div className="h-6 w-1 bg-emerald-600 rounded-full"></div>
            <h2 className="text-sm font-black section-heading uppercase tracking-[0.2em]">Financial Operations & Revenue</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {visibleFinancial.map((action) => (
              <ActionTile
                key={action.label}
                icon={action.icon}
                label={action.label}
                path={action.path}
              />
            ))}
          </div>
        </section>
      )}

      {/* 3. Operational Section */}
      <section className="space-y-8 animate-in slide-in-from-left-4 duration-500 delay-150">
        <div className="flex items-center gap-4">
          <div className="h-6 w-1 bg-pos-primary rounded-full"></div>
          <h2 className="text-sm font-black section-heading uppercase tracking-[0.2em]">{isAdmin ? 'Terminal & POS Controls' : 'Quick Actions'}</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {visibleOperational.map((action) => (
            <ActionTile
              key={action.label}
              icon={action.icon}
              label={action.label}
              path={action.path}
            />
          ))}
        </div>
      </section>

      {/* 4. Configuration Section */}
      <section className="space-y-8 animate-in slide-in-from-left-4 duration-500 delay-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-6 w-1 bg-gray-300 rounded-full"></div>
            <h2 className="text-sm font-black section-heading-muted uppercase tracking-[0.2em]">System Configuration</h2>
          </div>
          <div className="bg-gray-100 dark:bg-slate-800 px-4 py-1.5 rounded-full text-[10px] font-black text-gray-400 dark:text-slate-300 uppercase tracking-[0.2em]">
            Restaurant Setup
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-gray-100 dark:border-slate-700 rounded-[32px] p-10 shadow-sm relative overflow-hidden group hover:border-pos-primary/10 transition-colors">
          <p className="text-sm font-bold section-heading uppercase tracking-widest text-center mb-10">
            {isAdmin ? 'Master System Configuration' : 'Local Terminal Settings'}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {operatorUtilities.map((action) => (
              <ActionTile
                key={action.label}
                icon={action.icon}
                label={action.label}
                variant="config"
                path={action.path}
              />
            ))}
            {visibleConfigs.map((action) => (
              <ActionTile
                key={action.label}
                icon={action.icon}
                label={action.label}
                variant="config"
                path={action.path}
              />
            ))}
          </div>
        </div>
      </section>
      {/* Debug Footer */}
      {debug && (
        <div className="fixed bottom-0 right-0 bg-black/80 text-white p-4 m-4 rounded-xl text-[10px] font-mono z-[9999] max-w-xs ring-2 ring-pos-primary">
          <p className="font-bold text-pos-primary border-b border-white/20 pb-1 mb-2">SESSION DEBUG</p>
          <p>ROLE: {role}</p>
          <div className="mt-2 text-gray-400">
            <p className="border-b border-white/10 pb-0.5 mb-1">PERMISSIONS ({permissions.length}):</p>
            <div className="max-h-32 overflow-y-auto">
              {permissions.length > 0 ? permissions.join(', ') : 'NONE'}
            </div>
          </div>
          <button
            onClick={() => setDebug(false)}
            className="mt-3 w-full bg-white/10 hover:bg-white/20 py-1 rounded-md uppercase tracking-widest"
          >
            Close Debug
          </button>
        </div>
      )}
    </div>
  );
}
