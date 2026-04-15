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
  ClipboardList
} from 'lucide-react';

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

  const hasPermission = (permId?: string) => {
    if (isAdmin) return true;
    if (!permId) return true;
    return permissions.includes(permId.trim().toLowerCase());
  };

  const hasFeature = (feature?: string) => {
    if (role === 'SUPER_ADMIN') return true;
    if (!feature) return true;
    return session?.packageFeatures?.includes(feature);
  };

  const managementActions = [
    { label: role === 'SUPER_ADMIN' ? 'Global Businesses' : 'My Properties', perm: 'Businesses', icon: Map, path: role === 'SUPER_ADMIN' ? '/admin/properties' : '/manage-properties' },
    { label: role === 'SUPER_ADMIN' ? 'Global Access' : 'POS Access', perm: 'POS Access', icon: Users, path: '/manage-users' },
    { label: 'POS Staff', perm: 'POS Staff', icon: Users, path: '/pos-staff', feature: 'STAFF' },
    { label: 'Inventory', perm: 'Inventory', icon: Package, path: '/inventory', feature: 'INVENTORY' },
    { label: 'Menu Items', perm: 'Inventory', icon: Menu, path: '/products', feature: 'POS' },
    { label: 'Categories', perm: 'Inventory', icon: Layers, path: '/categories', feature: 'POS' },
    { label: 'Table Layout', perm: 'Table Layout', icon: Layers, path: '/operations/tables', feature: 'TABLES' },
  ];

  const financialActions = [
    { label: 'Invoices', perm: 'Invoices', icon: FileText, path: '/invoices', feature: 'HMS' },
    { label: 'Payments', perm: 'Payments', icon: CreditCard, path: '/payments', feature: 'ACCOUNTING' },
    { label: 'Expenses', perm: 'Expenses', icon: TrendingDown, path: '/expenses', feature: 'ACCOUNTING' },
    { label: 'Accounting', perm: 'Accounting', icon: BookOpen, path: '/accounts', feature: 'ACCOUNTING' },
    { label: 'Reports', perm: 'Reports', icon: PieChart, path: '/reports', feature: 'REPORTS' },
    { label: 'Day Closing', perm: 'Day Closing', icon: DayClosing, path: '/day-closing', feature: 'POS' },
  ];

  const operationalActions = [
    { label: 'POS Terminal', perm: 'POS Terminal', icon: Monitor, path: '/billing', feature: 'POS' },
    { label: 'Orders Control', perm: 'Orders Control', icon: ShoppingBag, path: '/orders', feature: 'POS' },
    { label: 'Kitchen Display', perm: 'Kitchen Display', icon: Eye, path: '/kitchen-display', feature: 'POS' },
    { label: 'KOTs List', perm: 'KOTs', icon: ClipboardList, path: '/kots', feature: 'POS' },
    { label: 'Table Bookings', perm: 'Table Bookings', icon: CalendarDays, path: '/table-reservations', feature: 'TABLES' },
    { label: 'Drivers', perm: 'Drivers', icon: CarFront, path: '/drivers', feature: 'DRIVERS' },
  ];

  // Configs only for Admins
  const masterConfigs = [
    { label: 'Menu Items', perm: 'Inventory', icon: Menu, path: '/products', feature: 'POS' },
    { label: 'Categories', perm: 'Inventory', icon: Layers, path: '/categories', feature: 'POS' },
    { label: 'Tax Setup', perm: 'Settings', icon: ShieldCheck, path: '/settings' },
    { label: 'Discounts', perm: 'Settings', icon: Percent, path: '/settings' },
    { label: 'System Settings', perm: 'Settings', icon: Settings, path: '/settings' },
  ];

  // Configs for Everyone (Support/Utilities)
  const operatorUtilities = [
    { label: 'Print Settings', perm: 'Settings', icon: Printer, path: '/settings' },
    { label: 'Inventory Sync', icon: RefreshCw },
    { label: 'Support Help', icon: RefreshCw },
  ];

  if (loading) return null;
  // 1. Administrative Section
  const visibleManagement = managementActions.filter(a => hasPermission(a.perm) && hasFeature(a.feature));
  const showManagement = isAdmin || (visibleManagement.length > 0);

  // 2. Financial Section
  const visibleFinancial = financialActions.filter(a => hasPermission(a.perm) && hasFeature(a.feature));
  const showFinancial = isAdmin || (visibleFinancial.length > 0);

  // 3. Operational Section
  const visibleOperational = operationalActions.filter(a => hasPermission(a.perm) && hasFeature(a.feature));

  // 4. Config Section
  const visibleConfigs = masterConfigs.filter(a => hasPermission(a.perm) && hasFeature(a.feature));

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
