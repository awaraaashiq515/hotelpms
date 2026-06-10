'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  Receipt,
  Users,
  Map,
  CreditCard,
  FileText,
  ShoppingBag,
  Activity,
  Package,
  TrendingDown,
  BookOpen,
  History as DayClosing,
  Layers,
  CalendarDays,
  CarFront,
  Eye,
  PieChart,
  Wine,
  Coffee,
  Trophy,
  LayoutDashboard,
  Database,
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
  X,
  MapPin
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
  const [barPosEnabled, setBarPosEnabled] = useState(true);
  const [cafePosEnabled, setCafePosEnabled] = useState(true);
  const [unreadNotifications, setUnreadNotifications] = useState<any[]>([]);
  const [kots, setKots] = useState<any[]>([]);
  const [readyPickupLimit, setReadyPickupLimit] = useState<number>(5);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPickupLimit = localStorage.getItem('kds_ready_pickup_time');
      if (savedPickupLimit) {
        setReadyPickupLimit(parseInt(savedPickupLimit, 10));
      }
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?status=UNREAD');
      const data = await res.json();
      if (data.success) {
        setUnreadNotifications(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch unread notifications", err);
    }
  }, []);

  const fetchKots = useCallback(async () => {
    try {
      const res = await fetch('/api/kots');
      const data = await res.json();
      if (data.success) {
        setKots(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch KOTs for operations", err);
    }
  }, []);

  useEffect(() => {
    setOpen(false);
    return () => setOpen(true);
  }, [setOpen]);

  useEffect(() => {
    fetchUnreadCount();
    fetchKots();
    const interval = setInterval(() => {
      fetchUnreadCount();
      fetchKots();
    }, 8000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount, fetchKots]);

  const getBadgeForAction = (label: string) => {
    if (label === 'Live Notifications') {
      return unreadNotifications.length > 0 ? unreadNotifications.length : undefined;
    }
    
    if (label === 'Kitchen Display' || label === 'Bar Display' || label === 'KOTs List') {
      const count = unreadNotifications.filter(n => n.type === 'KITCHEN').length;
      return count > 0 ? count : undefined;
    }

    if (label === 'Live Dashboard' || label === 'Orders Control' || label === 'POS Terminal' || label === 'Table Layout') {
      const count = unreadNotifications.filter(n => n.type === 'ORDER' || n.type === 'CANCELLATION').length;
      return count > 0 ? count : undefined;
    }

    if (label === 'Counter Payments' || label === 'Payments' || label === 'Invoices' || label === 'All Bills') {
      const count = unreadNotifications.filter(n => n.type === 'PAYMENT' || n.type === 'REFUND').length;
      return count > 0 ? count : undefined;
    }

    if (label === 'Table Bookings') {
      const count = unreadNotifications.filter(n => n.type === 'RESERVATION').length;
      return count > 0 ? count : undefined;
    }

    if (label === 'Staff Portal' || label === 'POS Staff' || label === 'Staff Attendance') {
      const count = unreadNotifications.filter(n => n.type === 'STAFF').length;
      return count > 0 ? count : undefined;
    }

    if (label === 'Expenses') {
      const count = unreadNotifications.filter(n => n.type === 'EXPENSE').length;
      return count > 0 ? count : undefined;
    }

    if (label === 'Customer Feedback') {
      const count = unreadNotifications.filter(n => n.type === 'FEEDBACK').length;
      return count > 0 ? count : undefined;
    }

    if (label === 'Inventory') {
      const count = unreadNotifications.filter(n => n.type === 'INVENTORY').length;
      return count > 0 ? count : undefined;
    }

    if (label === 'Accounting') {
      const count = unreadNotifications.filter(n => n.type === 'ACCOUNTING').length;
      return count > 0 ? count : undefined;
    }

    return undefined;
  };

  const getLateStatusForAction = (label: string): 'LATE_PREP' | 'LATE_PICKUP' | null => {
    if (label !== 'Kitchen Display' && label !== 'Bar Display' && label !== 'Cafe POS') {
      return null;
    }

    const menuTypeFilter = label === 'Kitchen Display' 
      ? 'KITCHEN' 
      : label === 'Bar Display' 
      ? 'BAR' 
      : 'CAFE';

    // 1. Check for Late Preparation first (higher priority warning)
    const hasLatePrep = kots.some(kot => {
      if (kot.status !== 'NEW' && kot.status !== 'PREPARING') return false;

      const hasMatchingItems = kot.items?.some((item: any) => {
        const itemType = item.product?.menuType || 'RESTAURANT';
        if (menuTypeFilter === 'BAR') return itemType === 'BAR';
        if (menuTypeFilter === 'CAFE') return itemType === 'CAFE';
        return itemType !== 'BAR' && itemType !== 'CAFE';
      });

      if (!hasMatchingItems) return false;

      if (!kot.createdAt) return false;
      const createdTime = new Date(kot.createdAt).getTime();
      if (isNaN(createdTime)) return false;
      const waitMin = Math.max(0, Math.floor((Date.now() - createdTime) / 60000));

      const prepLimit = kot.order?.preparationTime || 15;
      return waitMin >= prepLimit;
    });

    if (hasLatePrep) return 'LATE_PREP';

    // 2. Check for Late Pickup second
    const hasLatePickup = kots.some(kot => {
      if (kot.status !== 'READY') return false;

      const hasMatchingItems = kot.items?.some((item: any) => {
        const itemType = item.product?.menuType || 'RESTAURANT';
        if (menuTypeFilter === 'BAR') return itemType === 'BAR';
        if (menuTypeFilter === 'CAFE') return itemType === 'CAFE';
        return itemType !== 'BAR' && itemType !== 'CAFE';
      });

      if (!hasMatchingItems) return false;

      if (!kot.updatedAt) return false;
      const readyTime = new Date(kot.updatedAt).getTime();
      if (isNaN(readyTime)) return false;
      const readyWaitMin = Math.max(0, Math.floor((Date.now() - readyTime) / 60000));

      return readyPickupLimit > 0 && readyWaitMin >= readyPickupLimit;
    });

    if (hasLatePickup) return 'LATE_PICKUP';

    return null;
  };

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

    // Fetch property flags for Bar/Cafe POS
    fetch('/api/admin/properties')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data?.length > 0) {
          const prop = data.data[0];
          setBarPosEnabled(prop.barPosEnabled !== false);
          setCafePosEnabled(prop.cafePosEnabled !== false);
        }
      })
      .catch(() => {});

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

  const posBillingActions: DashboardAction[] = [
    { label: 'One-Page Setup', icon: LayoutGrid, path: `${p}/setup`, roles: ['RESTAURANTS_ADMIN', 'SUPER_ADMIN', 'POSSYSTEM'] },
    { label: 'POS Terminal',      perm: 'POS Terminal',    icon: Monitor,        path: `${p}/billing`,           feature: 'POS' },
    { label: 'Counter Payments',  perm: 'POS Terminal',    icon: Store,          path: `${p}/counter-payments`,  feature: 'POS' },
    ...(barPosEnabled ? [{ label: 'Bar POS', perm: 'POS Terminal', icon: Wine, path: `${p}/bar-pos`, feature: 'POS' } as DashboardAction] : []),
    ...(cafePosEnabled ? [{ label: 'Cafe POS', perm: 'POS Terminal', icon: Coffee, path: `${p}/cafe-pos`, feature: 'POS' } as DashboardAction] : []),
  ];

  const displayActions: DashboardAction[] = [
    { label: 'Kitchen Display',   perm: 'Kitchen Display', icon: Eye,            path: `${p}/kitchen-display`,   feature: 'POS' },
    ...(barPosEnabled ? [{ label: 'Bar Display', perm: 'Kitchen Display', icon: Wine, path: `${p}/bar-display`, feature: 'POS' } as DashboardAction] : []),
    { label: 'Customer Display',  perm: 'POS Terminal',    icon: Monitor,         path: `/order-display`,         feature: 'POS' },
  ];

  const orderControlActions: DashboardAction[] = [
    { label: 'Live Dashboard',    icon: Activity,          path: `${p}/restaurantadmin`,   feature: 'POS', roles: ['POSSYSTEM', 'RESTAURANTS_ADMIN'] },
    { label: 'Orders Control',    perm: 'Orders Control',  icon: ShoppingBag,    path: `${p}/orders`,            feature: 'POS', roles: ['RESTAURANTS_ADMIN', 'SUPER_ADMIN'] },
    { label: 'KOTs List',         perm: 'KOTs',            icon: ClipboardList,  path: `${p}/kots`,              feature: 'POS' },
    { label: 'Live Notifications', icon: Bell,             path: `${p}/operations/notifications`, feature: 'POS' },
    { label: 'Table Bookings',    perm: 'Table Bookings',  icon: CalendarDays,   path: `${p}/table-reservations`, feature: 'TABLES', roles: ['POSSYSTEM'] },
    { label: 'Live Occupancy',    perm: 'Table Layout',    icon: Eye,            path: `${p}/operations/occupancy`, feature: 'HMS' },
    { label: 'Waste Management',  perm: 'POS Terminal',    icon: Trash2,         path: `${p}/operations/waste-management`, feature: 'POS' },
  ];

  const deliveryActions: DashboardAction[] = [
    { label: 'Drivers',           perm: 'Drivers',         icon: CarFront,       path: `${p}/drivers`,           feature: 'DRIVERS' },
    { label: 'Rider Portal',      perm: 'Drivers',         icon: Bike,           path: `${p}/driver-portal`,     feature: 'DRIVERS' },
    { label: 'Home Delivery Area', perm: 'Table Layout',    icon: Home,           path: `${p}/operations/delivery`,       feature: 'TABLES' },
    { label: 'Home Delivery QR',   perm: 'Table Layout',    icon: Home,           path: `${p}/operations/tables/qr-gallery?tab=delivery`, feature: 'TABLES' },
  ];

  const staffActions: DashboardAction[] = [
    { label: 'Staff Portal',      perm: 'POS Terminal',    icon: Tablet,         path: `/staff-portal${p}`,      feature: 'POS' },
    { label: 'POS Staff',         perm: 'POS Staff',       icon: Users,          path: `${p}/pos-staff`,         feature: 'STAFF' },
    { label: 'Staff Attendance',  perm: 'POS Staff',       icon: Clock,          path: `${p}/staff/attendance`,  feature: 'STAFF' },
    { label: 'Staff Locations',   perm: 'POS Staff',       icon: MapPin,         path: `${p}/staff?tab=location`, feature: 'STAFF' },
  ];

  const billingPaymentsActions: DashboardAction[] = [
    { label: 'Day Closing', perm: 'Day Closing', icon: DayClosing, path: `${p}/day-closing`, feature: 'POS' },
    { label: 'Payments', perm: 'Payments', icon: CreditCard, path: `${p}/payments`, feature: 'POS', roles: ['POSSYSTEM', 'RESTAURANTS_ADMIN', 'SUPER_ADMIN'] },
    { label: 'Invoices', perm: 'Invoices', icon: FileText, path: `${p}/invoices`, feature: 'POS', roles: ['POSSYSTEM', 'RESTAURANTS_ADMIN', 'SUPER_ADMIN'] },
    { label: 'All Bills', perm: 'Invoices', icon: Receipt, path: `${p}/all-bills`, feature: 'POS', roles: ['RESTAURANTS_ADMIN', 'SUPER_ADMIN'] },
  ];

  const accountingExpensesActions: DashboardAction[] = [
    { label: 'Expenses', perm: 'Expenses', icon: TrendingDown, path: `${p}/expenses`, feature: 'ACCOUNTING', roles: ['POSSYSTEM', 'RESTAURANTS_ADMIN', 'SUPER_ADMIN'] },
    { label: 'New Expense', perm: 'Expenses', icon: PlusCircle, path: `${p}/expenses/new`, feature: 'ACCOUNTING', roles: ['POSSYSTEM', 'RESTAURANTS_ADMIN', 'SUPER_ADMIN'] },
    { label: 'Expense Categories', perm: 'Expenses', icon: Layers, path: `${p}/expenses/categories`, feature: 'ACCOUNTING', roles: ['POSSYSTEM', 'RESTAURANTS_ADMIN', 'SUPER_ADMIN'] },
    { label: 'Accounting', perm: 'Accounting', icon: BookOpen, path: `${p}/accounts`, feature: 'ACCOUNTING' },
    { label: 'New Voucher', perm: 'Accounting', icon: PlusCircle, path: `${p}/vouchers/new`, feature: 'ACCOUNTING' },
    { label: 'Vouchers List', perm: 'Accounting', icon: FileText, path: `${p}/vouchers`, feature: 'ACCOUNTING' },
    { label: 'Cash Book', perm: 'Accounting', icon: BookOpen, path: `${p}/accounts/cash-book`, feature: 'ACCOUNTING' },
    { label: 'Day Book', perm: 'Accounting', icon: BookOpen, path: `${p}/accounts/day-book`, feature: 'ACCOUNTING' },
    { label: 'Ledger', perm: 'Accounting', icon: BookOpen, path: `${p}/accounts/ledger`, feature: 'ACCOUNTING' },
  ];

  const reportsAnalyticsActions: DashboardAction[] = [
    { label: 'Analytics Dashboard', icon: LayoutDashboard, path: session?.organizationSlug ? `/restaurantadmin/${session.organizationSlug}` : '/dashboard', roles: ['RESTAURANTS_ADMIN', 'SUPER_ADMIN'] },
    { label: 'Customer Feedback', icon: Star, path: `${p}/reports/ratings`, feature: 'REPORTS' },
    { label: 'Reports', perm: 'Reports', icon: PieChart, path: `${p}/reports`, feature: 'REPORTS' },
    { label: 'Sales Intelligence', perm: 'Reports', icon: PieChart, path: `${p}/reports/sales`, feature: 'REPORTS' },
    { label: 'Settlements Report', perm: 'Reports', icon: Receipt, path: `${p}/reports/settlements`, feature: 'REPORTS' },
    { label: 'Tax Report', perm: 'Reports', icon: FileText, path: `${p}/reports/tax`, feature: 'REPORTS' },
    { label: 'Inventory Report', perm: 'Reports', icon: Package, path: `${p}/reports/inventory`, feature: 'REPORTS' },
    { label: 'Attendance Report', perm: 'Reports', icon: Users, path: `${p}/reports/attendance`, feature: 'REPORTS' },
    { label: 'Audit Logs', perm: 'Reports', icon: ClipboardList, path: `${p}/reports/audit`, feature: 'REPORTS' },
  ];

  const menuInventoryActions: DashboardAction[] = [
    { label: 'Inventory', perm: 'Inventory', icon: Package, path: `${p}/inventory`, feature: 'INVENTORY', roles: ['POSSYSTEM', 'RESTAURANTS_ADMIN', 'SUPER_ADMIN'] },
    { label: 'Menu Items', perm: 'Inventory', icon: Menu, path: `${p}/products`, feature: 'POS', roles: ['POSSYSTEM', 'RESTAURANTS_ADMIN', 'SUPER_ADMIN'] },
    { label: 'Categories', perm: 'Inventory', icon: Layers, path: `${p}/categories`, feature: 'POS', roles: ['POSSYSTEM', 'RESTAURANTS_ADMIN', 'SUPER_ADMIN'] },
    { label: 'Table Layout', perm: 'Table Layout', icon: Layers, path: `${p}/operations/tables`, feature: 'TABLES', roles: ['POSSYSTEM', 'RESTAURANTS_ADMIN', 'SUPER_ADMIN'] },
    { label: 'QR Gallery', perm: 'Table Layout', icon: Printer, path: `${p}/operations/tables/qr-gallery`, feature: 'TABLES' },
  ];

  const systemSettingsActions: DashboardAction[] = [
    { label: 'Tablet Setup', perm: 'Settings', icon: Tablet, path: `${p}/settings/tablets`, feature: 'TABLETS', roles: ['RESTAURANTS_ADMIN', 'SUPER_ADMIN', 'POSSYSTEM'] },
    { label: role === 'SUPER_ADMIN' ? 'Global Access' : 'POS Access', perm: 'POS Access', icon: Users, path: `${p}/manage-users`, roles: ['RESTAURANTS_ADMIN', 'SUPER_ADMIN'] },
    { label: 'Role Management', perm: 'POS Access', icon: ShieldCheck, path: `${p}/manage-roles`, roles: ['RESTAURANTS_ADMIN', 'SUPER_ADMIN'] },
    { label: 'Payment Modes', perm: 'Settings', icon: CreditCard, path: `${p}/payment-modes`, roles: ['RESTAURANTS_ADMIN', 'SUPER_ADMIN', 'POSSYSTEM'] },
    { label: 'General Settings', perm: 'Settings', icon: Settings, path: `${p}/settings`, roles: ['RESTAURANTS_ADMIN', 'SUPER_ADMIN', 'POSSYSTEM'] },
    { label: 'Notification Settings', perm: 'Settings', icon: Settings, path: `${p}/settings/notifications`, feature: 'POS' },
    { label: 'Data Backup', perm: 'Settings', icon: Database, path: `${p}/settings/backup`, roles: ['RESTAURANTS_ADMIN', 'SUPER_ADMIN'] },
    { label: role === 'SUPER_ADMIN' ? 'Global Businesses' : 'My Properties', perm: 'Businesses', icon: Map, path: role === 'SUPER_ADMIN' ? '/admin/properties' : '/manage-properties', roles: ['RESTAURANTS_ADMIN', 'SUPER_ADMIN'] },
    { label: 'GST Filing', perm: 'GST Filing', icon: FileJson, path: `${p}/pos/gst-filing`, feature: 'GST', roles: ['POSSYSTEM', 'RESTAURANTS_ADMIN', 'SUPER_ADMIN'] },
    { label: 'GST Settings', perm: 'GST Filing', icon: FileJson, path: `${p}/pos/gst-settings`, feature: 'GST', roles: ['POSSYSTEM', 'RESTAURANTS_ADMIN', 'SUPER_ADMIN'] },
  ];

  const crmActions: DashboardAction[] = [
    { label: 'Customers List', icon: Contact, path: `${p}/customers`, feature: 'CRM', roles: ['RESTAURANTS_ADMIN', 'SUPER_ADMIN', 'POSSYSTEM'] },
    { label: 'Membership Plans', icon: Trophy, path: `${p}/memberships/plans`, feature: 'CRM', roles: ['RESTAURANTS_ADMIN', 'SUPER_ADMIN', 'POSSYSTEM'] },
    { label: 'Issue Cards', icon: CreditCard, path: `${p}/memberships/cards`, feature: 'CRM', roles: ['RESTAURANTS_ADMIN', 'SUPER_ADMIN', 'POSSYSTEM'] },
    { label: 'Usage History', icon: History, path: `${p}/memberships/history`, feature: 'CRM', roles: ['RESTAURANTS_ADMIN', 'SUPER_ADMIN', 'POSSYSTEM'] },
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

  const visiblePosBilling = posBillingActions.filter(isVisible);
  const visibleDisplays = displayActions.filter(isVisible);
  const visibleOrderControl = orderControlActions.filter(isVisible);
  const visibleDelivery = deliveryActions.filter(isVisible);
  const visibleStaff = staffActions.filter(isVisible);
  const visibleBillingPayments = billingPaymentsActions.filter(isVisible);
  const visibleAccountingExpenses = accountingExpensesActions.filter(isVisible);
  const visibleReportsAnalytics = reportsAnalyticsActions.filter(isVisible);
  const visibleMenuInventory = menuInventoryActions.filter(isVisible);
  const visibleSystemSettings = systemSettingsActions.filter(isVisible);
  const visibleCRM = crmActions.filter(isVisible);
  const visibleB2B = b2bActions.filter(isVisible);

  const allVisibleActions = [
    ...visiblePosBilling.map(a => ({ ...a, category: 'POS Billing' })),
    ...visibleDisplays.map(a => ({ ...a, category: 'Screen Displays' })),
    ...visibleOrderControl.map(a => ({ ...a, category: 'Orders & Table Control' })),
    ...visibleDelivery.map(a => ({ ...a, category: 'Delivery & Logistics' })),
    ...visibleStaff.map(a => ({ ...a, category: 'Staff & Attendance' })),
    ...visibleBillingPayments.map(a => ({ ...a, category: 'Billing & Payments' })),
    ...visibleAccountingExpenses.map(a => ({ ...a, category: 'Expenses & Accounting' })),
    ...visibleReportsAnalytics.map(a => ({ ...a, category: 'Reports & Analytics' })),
    ...visibleMenuInventory.map(a => ({ ...a, category: 'Inventory & Menu Setup' })),
    ...visibleSystemSettings.map(a => ({ ...a, category: 'Store Settings & Setup' })),
    ...visibleCRM.map(a => ({ ...a, category: 'CRM & Loyalty' })),
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
        if (firstAction.path.endsWith('/kitchen-display') || firstAction.path.endsWith('/bar-display') || firstAction.path.endsWith('/order-display')) {
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
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.open(`/staff-portal${p}`, '_blank')}
              className="hidden md:flex items-center gap-2 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-800/50 text-indigo-700 dark:text-indigo-400 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors shadow-sm"
            >
              <Tablet className="w-4 h-4" />
              Staff Portal
            </button>
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
                  <ActionTile icon={action.icon} label={action.label} path={action.path} badge={getBadgeForAction(action.label)} lateStatus={getLateStatusForAction(action.label)} />
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
              <p className="text-sm font-semibold text-slate-650 dark:text-slate-400">No operations found matching "{searchQuery}"</p>
              <p className="text-[11px] text-slate-400 uppercase tracking-wider">Try typing "billing", "inventory", or "report"</p>
            </div>
          )}
        </section>
      )}

      {/* Main Categories Panel - Hidden when active search query to avoid clutter */}
      {searchQuery.trim() === '' && (
        <div className="space-y-12 animate-in fade-in duration-300">
          
          {/* 1. POS Billing */}
          {visiblePosBilling.length > 0 && (
            <section className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="h-6 w-1 bg-pos-primary rounded-full"></div>
                <h2 className="text-sm font-black section-heading uppercase tracking-[0.2em]">POS Billing</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                {visiblePosBilling.map((action) => (
                  <ActionTile key={action.label} icon={action.icon} label={action.label} path={action.path} badge={getBadgeForAction(action.label)} lateStatus={getLateStatusForAction(action.label)} />
                ))}
              </div>
            </section>
          )}

          {/* 2. Screen Displays */}
          {visibleDisplays.length > 0 && (
            <section className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="h-6 w-1 bg-cyan-500 rounded-full"></div>
                <h2 className="text-sm font-black section-heading uppercase tracking-[0.2em]">Screen Displays</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                {visibleDisplays.map((action) => (
                  <ActionTile key={action.label} icon={action.icon} label={action.label} path={action.path} badge={getBadgeForAction(action.label)} lateStatus={getLateStatusForAction(action.label)} />
                ))}
              </div>
            </section>
          )}

          {/* 3. Orders & Table Control */}
          {visibleOrderControl.length > 0 && (
            <section className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="h-6 w-1 bg-blue-600 rounded-full"></div>
                <h2 className="text-sm font-black section-heading uppercase tracking-[0.2em]">Orders & Table Control</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                {visibleOrderControl.map((action) => (
                  <ActionTile key={action.label} icon={action.icon} label={action.label} path={action.path} badge={getBadgeForAction(action.label)} lateStatus={getLateStatusForAction(action.label)} />
                ))}
              </div>
            </section>
          )}

          {/* 4. Billing & Payments */}
          {visibleBillingPayments.length > 0 && (
            <section className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="h-6 w-1 bg-emerald-600 rounded-full"></div>
                <h2 className="text-sm font-black section-heading uppercase tracking-[0.2em]">Billing & Payments</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                {visibleBillingPayments.map((action) => (
                  <ActionTile key={action.label} icon={action.icon} label={action.label} path={action.path} badge={getBadgeForAction(action.label)} lateStatus={getLateStatusForAction(action.label)} />
                ))}
              </div>
            </section>
          )}

          {/* 5. Staff & Attendance */}
          {visibleStaff.length > 0 && (
            <section className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="h-6 w-1 bg-violet-600 rounded-full"></div>
                <h2 className="text-sm font-black section-heading uppercase tracking-[0.2em]">Staff & Attendance</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                {visibleStaff.map((action) => (
                  <ActionTile key={action.label} icon={action.icon} label={action.label} path={action.path} badge={getBadgeForAction(action.label)} lateStatus={getLateStatusForAction(action.label)} />
                ))}
              </div>
            </section>
          )}

          {/* 6. Inventory & Menu Setup */}
          {visibleMenuInventory.length > 0 && (
            <section className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="h-6 w-1 bg-amber-600 rounded-full"></div>
                <h2 className="text-sm font-black section-heading uppercase tracking-[0.2em]">Inventory & Menu Setup</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                {visibleMenuInventory.map((action) => (
                  <ActionTile key={action.label} icon={action.icon} label={action.label} path={action.path} badge={getBadgeForAction(action.label)} lateStatus={getLateStatusForAction(action.label)} />
                ))}
              </div>
            </section>
          )}

          {/* 7. Expenses & Accounting */}
          {visibleAccountingExpenses.length > 0 && (
            <section className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="h-6 w-1 bg-teal-600 rounded-full"></div>
                <h2 className="text-sm font-black section-heading uppercase tracking-[0.2em]">Expenses & Accounting</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                {visibleAccountingExpenses.map((action) => (
                  <ActionTile key={action.label} icon={action.icon} label={action.label} path={action.path} badge={getBadgeForAction(action.label)} lateStatus={getLateStatusForAction(action.label)} />
                ))}
              </div>
            </section>
          )}

          {/* 8. Delivery & Logistics */}
          {visibleDelivery.length > 0 && (
            <section className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="h-6 w-1 bg-orange-500 rounded-full"></div>
                <h2 className="text-sm font-black section-heading uppercase tracking-[0.2em]">Delivery & Logistics</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                {visibleDelivery.map((action) => (
                  <ActionTile key={action.label} icon={action.icon} label={action.label} path={action.path} badge={getBadgeForAction(action.label)} lateStatus={getLateStatusForAction(action.label)} />
                ))}
              </div>
            </section>
          )}

          {/* 9. Reports & Analytics */}
          {visibleReportsAnalytics.length > 0 && (
            <section className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="h-6 w-1 bg-indigo-600 rounded-full"></div>
                <h2 className="text-sm font-black section-heading uppercase tracking-[0.2em]">Reports & Analytics</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                {visibleReportsAnalytics.map((action) => (
                  <ActionTile key={action.label} icon={action.icon} label={action.label} path={action.path} badge={getBadgeForAction(action.label)} lateStatus={getLateStatusForAction(action.label)} />
                ))}
              </div>
            </section>
          )}

          {/* 10. CRM & Loyalty Section */}
          {visibleCRM.length > 0 && (
            <section className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="h-6 w-1 bg-rose-500 rounded-full"></div>
                <h2 className="text-sm font-black section-heading uppercase tracking-[0.2em]">CRM & Loyalty</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                {visibleCRM.map((action) => (
                  <ActionTile key={action.label} icon={action.icon} label={action.label} path={action.path} badge={getBadgeForAction(action.label)} lateStatus={getLateStatusForAction(action.label)} />
                ))}
              </div>
            </section>
          )}

          {/* 11. B2B Marketplace Quick Access */}
          {visibleB2B.length > 0 && (
            <section className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="h-6 w-1 bg-amber-500 rounded-full"></div>
                <h2 className="text-sm font-black section-heading uppercase tracking-[0.2em]">B2B Supply Chain</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                {visibleB2B.map((action) => (
                  <ActionTile key={action.label} icon={action.icon} label={action.label} path={action.path} badge={getBadgeForAction(action.label)} lateStatus={getLateStatusForAction(action.label)} />
                ))}
              </div>
            </section>
          )}

          {/* 12. Store Settings & Setup */}
          {visibleSystemSettings.length > 0 && (
            <section className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="h-6 w-1 bg-slate-500 rounded-full"></div>
                <h2 className="text-sm font-black section-heading uppercase tracking-[0.2em]">Store Settings & Setup</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                {visibleSystemSettings.map((action) => (
                  <ActionTile key={action.label} icon={action.icon} label={action.label} path={action.path} badge={getBadgeForAction(action.label)} lateStatus={getLateStatusForAction(action.label)} />
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
