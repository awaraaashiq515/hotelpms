'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { ActionTile } from '@/components/shared/action-tile';

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

  Bell,
  Trash2,
  Truck,
  Home,
  Bike,
  Tablet,
  Search,
  X,

  Download,
  BedDouble,
  Building2
} from 'lucide-react';

import { useRouter } from 'next/navigation';

interface DashboardAction {
  label: string;
  path?: string;
  icon: any;
  perm?: string;
  feature?: string;
  roles?: string[];
  variant?: 'config' | 'default';
}

export default function RestaurantPosPage() {
  // Hotel route – no property code in URL; all paths are absolute
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [property, setProperty] = useState<any>(null);
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
    
    if (label === 'Kitchen Display') {
      const count = unreadNotifications.filter(n => {
        if (n.type !== 'KITCHEN') return false;
        try {
          const meta = JSON.parse(n.metadata);
          return meta.hasKitchenItems !== false; // Default to true if not present
        } catch {
          return true;
        }
      }).length;
      return count > 0 ? count : undefined;
    }

    if (label === 'Bar Display') {
      const count = unreadNotifications.filter(n => {
        if (n.type !== 'KITCHEN') return false;
        try {
          const meta = JSON.parse(n.metadata);
          return meta.hasBarItems === true; // Only show if explicitly has bar items
        } catch {
          return false; // Old KOT notifications didn't have this, default to false for Bar
        }
      }).length;
      return count > 0 ? count : undefined;
    }

    if (label === 'KOTs List') {
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
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Fetch property flags for Bar/Cafe POS
    fetch('/api/admin/properties')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data?.length > 0) {
          // Find the restaurant/POS property (non-HOTEL type), fallback to first
          const prop = data.data.find((p: any) => p.type !== 'HOTEL') || data.data[0];
          setProperty(prop);
          setBarPosEnabled(prop.barPosEnabled !== false);
          setCafePosEnabled(prop.cafePosEnabled !== false);
        }
      })
      .catch(() => {});

    fetch('/api/setup/properties/current')
      .then(r => r.json())
      .then(d => { if (d.success && d.data) setProperty((prev: any) => prev || d.data); })
      .catch(() => {});

    if (typeof window !== 'undefined' && window.location.search.includes('debug=true')) {
      setDebug(true);
    }
  }, []);

  if (loading) return null;

  const role = session?.role;
  const isAdmin = role === 'RESTAURANTS_ADMIN' || role === 'SUPER_ADMIN' || role === 'POSSYSTEM' || role === 'HOTEL_ADMIN' || role === 'HOTEL_MANAGER';

  // If businessType is BOTH (Hotel + Restaurant Attached), hide Store Settings tiles —
  // settings are managed centrally from the hotel portal, not duplicated here.
  const isAttached = session?.businessType === 'BOTH' || (session?.isMultiProperty === true && session?.businessType !== 'BOTH_SEPARATE');

  const hasPermission = (perm?: string) => {
    if (!perm || isAdmin) return true;
    return session?.permissions?.some((p: string) => p.toLowerCase() === perm.toLowerCase());
  };

  const hasFeature = (feature?: string) => {
    if (role === 'SUPER_ADMIN') return true;
    if (!feature) return true;
    const isCrmBypass = feature === 'CRM' && (role === 'RESTAURANTS_ADMIN' || role === 'POSSYSTEM' || role === 'HOTEL_ADMIN');
    return isCrmBypass || session?.packageFeatures?.includes(feature);
  };

  // ── Hotel POS: All action paths remain internal to the Hotel PMS ──
  const pc = '';
  const posBillingActions: DashboardAction[] = [
    { label: 'One-Page Setup', icon: LayoutGrid, path: `/hotel/settings`, roles: ['RESTAURANTS_ADMIN', 'SUPER_ADMIN', 'POSSYSTEM', 'HOTEL_ADMIN', 'HOTEL_MANAGER'] },
    { label: 'POS Terminal',      perm: 'POS Terminal',    icon: Monitor,        path: `/hotel/pos/billing`,           feature: 'POS' },
    { label: 'Counter Payments',  perm: 'POS Terminal',    icon: Store,          path: `/hotel/pos/counter-payments`,  feature: 'POS' },
    ...(barPosEnabled ? [{ label: 'Bar POS', perm: 'POS Terminal', icon: Wine, path: `/hotel/pos/bar-pos`, feature: 'BARPOS' } as DashboardAction] : []),
    ...(cafePosEnabled ? [{ label: 'Cafe POS', perm: 'POS Terminal', icon: Coffee, path: `/hotel/pos/cafe-pos`, feature: 'CAFEPOS' } as DashboardAction] : []),
  ];

  const displayActions: DashboardAction[] = [
    { label: 'Kitchen Display',   perm: 'Kitchen Display', icon: Eye,            path: `/hotel/pos/kitchen-display`,   feature: 'POS' },
    ...(barPosEnabled ? [{ label: 'Bar Display', perm: 'Kitchen Display', icon: Wine, path: `/hotel/pos/bar-display`, feature: 'BARPOS' } as DashboardAction] : []),
    { label: 'Customer Display',  perm: 'POS Terminal',    icon: Monitor,         path: `/order-display`,         feature: 'POS' },
  ];

  const orderControlActions: DashboardAction[] = [
    { label: 'Live Overview',     icon: LayoutGrid,        path: `/hotel/pos/live-overview`,     feature: 'POS', roles: ['POSSYSTEM', 'HOTEL_ADMIN', 'HOTEL_MANAGER'] },
    { label: 'Live Dashboard',    icon: Activity,          path: `/hotel/operations-dashboard`,   feature: 'POS', roles: ['RESTAURANTS_ADMIN', 'HOTEL_ADMIN', 'HOTEL_MANAGER'] },
    { label: 'Orders Control',    perm: 'Orders Control',  icon: ShoppingBag,    path: `/hotel/pos/orders`,            feature: 'POS', roles: ['RESTAURANTS_ADMIN', 'SUPER_ADMIN', 'HOTEL_ADMIN', 'HOTEL_MANAGER'] },
    { label: 'KOTs List',         perm: 'KOTs',            icon: ClipboardList,  path: `/hotel/pos/kots`,              feature: 'POS' },
    { label: 'Room Orders',       perm: 'POS Terminal',    icon: BedDouble,      path: `/hotel/pos/room-orders`, feature: 'POS' },
    { label: 'Live Notifications', icon: Bell,             path: `/hotel/pos/notifications`, feature: 'POS' },
    { label: 'Table Bookings',    perm: 'Table Bookings',  icon: CalendarDays,   path: `/hotel/pos/table-reservations`, feature: 'TABLES', roles: ['POSSYSTEM', 'HOTEL_ADMIN', 'HOTEL_MANAGER'] },
    { label: 'Live Occupancy',    perm: 'Table Layout',    icon: Eye,            path: `/hotel/pos/occupancy`, feature: 'HMS' },
    { label: 'Waste Management',  perm: 'POS Terminal',    icon: Trash2,         path: `/hotel/pos/waste-management`, feature: 'POS' },
  ];

  const deliveryActions: DashboardAction[] = [
    { label: 'Delivery Dispatch', perm: 'POS Terminal', icon: Bike, path: `/hotel/pos/delivery`, feature: 'POS' },
    { label: 'Delivery Flyer', perm: 'POS Terminal', icon: FileText, path: `/hotel/pos/delivery-flyer`, feature: 'POS' },
  ];

  const staffActions: DashboardAction[] = [
    { label: 'Staff Portal',      perm: 'POS Terminal',    icon: Tablet,         path: `/staff-portal`,      feature: 'POS' },
    { label: 'POS Staff',         perm: 'POS Staff',       icon: Users,          path: `/hotel/staff`,         feature: 'STAFF' },
  ];

  const billingPaymentsActions: DashboardAction[] = [
    { label: 'Day Closing', perm: 'Day Closing', icon: DayClosing, path: `/hotel/pos/day-closing`, feature: 'POS' },
    { label: 'Payments', perm: 'Payments', icon: CreditCard, path: `/hotel/billing`, feature: 'POS', roles: ['POSSYSTEM', 'RESTAURANTS_ADMIN', 'SUPER_ADMIN', 'HOTEL_ADMIN', 'HOTEL_MANAGER'] },
    { label: 'Invoices', perm: 'Invoices', icon: FileText, path: `/hotel/invoices`, feature: 'POS', roles: ['POSSYSTEM', 'RESTAURANTS_ADMIN', 'SUPER_ADMIN', 'HOTEL_ADMIN', 'HOTEL_MANAGER'] },
  ];

  const accountingExpensesActions: DashboardAction[] = [
    { label: 'Expenses', perm: 'Expenses', icon: TrendingDown, path: `/hotel/expenses`, feature: 'ACCOUNTING', roles: ['POSSYSTEM', 'RESTAURANTS_ADMIN', 'SUPER_ADMIN', 'HOTEL_ADMIN', 'HOTEL_MANAGER'] },
    { label: 'New Expense', perm: 'Expenses', icon: PlusCircle, path: `/hotel/expenses`, feature: 'ACCOUNTING', roles: ['POSSYSTEM', 'RESTAURANTS_ADMIN', 'SUPER_ADMIN', 'HOTEL_ADMIN', 'HOTEL_MANAGER'] },
    { label: 'Expense Categories', perm: 'Expenses', icon: Layers, path: `/hotel/expenses`, feature: 'ACCOUNTING', roles: ['POSSYSTEM', 'RESTAURANTS_ADMIN', 'SUPER_ADMIN', 'HOTEL_ADMIN', 'HOTEL_MANAGER'] },
    { label: 'Accounting', perm: 'Accounting', icon: BookOpen, path: `/hotel/accounts`, feature: 'ACCOUNTING' },
    { label: 'New Voucher', perm: 'Accounting', icon: PlusCircle, path: `/hotel/vouchers`, feature: 'ACCOUNTING' },
    { label: 'Vouchers List', perm: 'Accounting', icon: FileText, path: `/hotel/vouchers`, feature: 'ACCOUNTING' },
    { label: 'Cash Book', perm: 'Accounting', icon: BookOpen, path: `/hotel/accounts`, feature: 'ACCOUNTING' },
    { label: 'Day Book', perm: 'Accounting', icon: BookOpen, path: `/hotel/accounts`, feature: 'ACCOUNTING' },
    { label: 'Ledger', perm: 'Accounting', icon: BookOpen, path: `/hotel/accounts`, feature: 'ACCOUNTING' },
  ];

  const reportsAnalyticsActions: DashboardAction[] = [
    { label: 'Analytics Dashboard', icon: LayoutDashboard, path: `/hotel/analytics`, roles: ['RESTAURANTS_ADMIN', 'SUPER_ADMIN', 'HOTEL_ADMIN', 'HOTEL_MANAGER'] },
    { label: 'Customer Feedback', icon: Star, path: `/hotel/guests`, feature: 'REPORTS' },
    { label: 'Reports', perm: 'Reports', icon: PieChart, path: `/hotel/reports`, feature: 'REPORTS' },
    { label: 'Sales Intelligence', perm: 'Reports', icon: PieChart, path: `/hotel/revenue`, feature: 'REPORTS' },
    { label: 'Settlements Report', perm: 'Reports', icon: Receipt, path: `/hotel/reports`, feature: 'REPORTS' },
    { label: 'Tax Report', perm: 'Reports', icon: FileText, path: `/hotel/reports`, feature: 'REPORTS' },
    { label: 'Inventory Report', perm: 'Reports', icon: Package, path: `/hotel/inventory`, feature: 'REPORTS' },
    { label: 'Audit Logs', perm: 'Reports', icon: ClipboardList, path: `/hotel/reports`, feature: 'REPORTS' },
  ];

  const menuInventoryActions: DashboardAction[] = [
    { label: 'Inventory', perm: 'Inventory', icon: Package, path: `/hotel/inventory`, feature: 'INVENTORY', roles: ['POSSYSTEM', 'RESTAURANTS_ADMIN', 'SUPER_ADMIN', 'HOTEL_ADMIN', 'HOTEL_MANAGER'] },
    { label: 'Menu Items', perm: 'Inventory', icon: Menu, path: `/hotel/pos/products`, feature: 'POS', roles: ['POSSYSTEM', 'RESTAURANTS_ADMIN', 'SUPER_ADMIN', 'HOTEL_ADMIN', 'HOTEL_MANAGER'] },
    { label: 'Categories', perm: 'Inventory', icon: Layers, path: `/hotel/pos/categories`, feature: 'POS', roles: ['POSSYSTEM', 'RESTAURANTS_ADMIN', 'SUPER_ADMIN', 'HOTEL_ADMIN', 'HOTEL_MANAGER'] },
    { label: 'Table Layout', perm: 'Table Layout', icon: Layers, path: `/hotel/pos/tables`, feature: 'TABLES', roles: ['POSSYSTEM', 'RESTAURANTS_ADMIN', 'SUPER_ADMIN', 'HOTEL_ADMIN', 'HOTEL_MANAGER'] },
    { label: 'QR Gallery', perm: 'Table Layout', icon: Printer, path: `/hotel/pos/tables/qr-gallery`, feature: 'TABLES' },
    { label: 'QR Downloads', perm: 'Table Layout', icon: Download, path: `/hotel/pos/qr-download`, feature: 'TABLES' },
  ];

  // Store Settings tiles — hidden entirely for BOTH (Hotel + Restaurant Attached) users.
  // For BOTH users, settings are managed from the central Hotel portal (/hotel/settings).
  const systemSettingsActions: DashboardAction[] = isAttached ? [] : [
    { label: 'Tablet Setup', perm: 'Settings', icon: Tablet, path: `/hotel/settings`, feature: 'TABLETS', roles: ['RESTAURANTS_ADMIN', 'SUPER_ADMIN', 'POSSYSTEM', 'HOTEL_ADMIN', 'HOTEL_MANAGER'] },
    { label: role === 'SUPER_ADMIN' ? 'Global Access' : 'POS Access', perm: 'POS Access', icon: Users, path: `/hotel/staff`, roles: ['RESTAURANTS_ADMIN', 'SUPER_ADMIN', 'HOTEL_ADMIN', 'HOTEL_MANAGER'] },
    { label: 'Role Management', perm: 'POS Access', icon: ShieldCheck, path: `/hotel/staff`, roles: ['RESTAURANTS_ADMIN', 'SUPER_ADMIN', 'HOTEL_ADMIN', 'HOTEL_MANAGER'] },
    { label: 'Payment Modes', perm: 'Settings', icon: CreditCard, path: `/hotel/settings`, roles: ['RESTAURANTS_ADMIN', 'SUPER_ADMIN', 'POSSYSTEM', 'HOTEL_ADMIN', 'HOTEL_MANAGER'] },
    { label: 'General Settings', perm: 'Settings', icon: Settings, path: `/hotel/settings`, roles: ['RESTAURANTS_ADMIN', 'SUPER_ADMIN', 'POSSYSTEM', 'HOTEL_ADMIN', 'HOTEL_MANAGER'] },
    { label: 'Notification Settings', perm: 'Settings', icon: Settings, path: `/hotel/settings`, feature: 'POS' },
    { label: 'Data Backup', perm: 'Settings', icon: Database, path: `/hotel/settings`, roles: ['RESTAURANTS_ADMIN', 'SUPER_ADMIN', 'HOTEL_ADMIN', 'HOTEL_MANAGER'] },
    { label: role === 'SUPER_ADMIN' ? 'Global Businesses' : 'My Properties', perm: 'Businesses', icon: Map, path: '/hotel/settings', roles: ['RESTAURANTS_ADMIN', 'SUPER_ADMIN', 'HOTEL_ADMIN', 'HOTEL_MANAGER'] },
    { label: 'GST Filing', perm: 'GST Filing', icon: FileJson, path: `/hotel/accounts`, feature: 'GST', roles: ['POSSYSTEM', 'RESTAURANTS_ADMIN', 'SUPER_ADMIN', 'HOTEL_ADMIN', 'HOTEL_MANAGER'] },
    { label: 'GST Settings', perm: 'GST Filing', icon: FileJson, path: `/hotel/settings`, feature: 'GST', roles: ['POSSYSTEM', 'RESTAURANTS_ADMIN', 'SUPER_ADMIN', 'HOTEL_ADMIN', 'HOTEL_MANAGER'] },
  ];

  const crmActions: DashboardAction[] = [
    { label: 'Customers List', icon: Contact, path: `/hotel/guests`, feature: 'CRM', roles: ['RESTAURANTS_ADMIN', 'SUPER_ADMIN', 'POSSYSTEM', 'HOTEL_ADMIN', 'HOTEL_MANAGER'] },
  ];

  const b2bActions: DashboardAction[] = [
    { label: 'B2B Marketplace',   icon: ShoppingBag,    path: `/hotel/inventory`,   feature: 'B2B', roles: ['RESTAURANTS_ADMIN', 'SUPER_ADMIN', 'POSSYSTEM', 'HOTEL_ADMIN', 'HOTEL_MANAGER'] },
    { label: 'Order History',    icon: Truck,          path: `/hotel/pos/orders`,   feature: 'B2B', roles: ['RESTAURANTS_ADMIN', 'SUPER_ADMIN', 'POSSYSTEM', 'HOTEL_ADMIN', 'HOTEL_MANAGER'] },
    { label: 'Supplier Hub',     icon: Store,          path: `/hotel/vendor`, feature: 'B2B', roles: ['RESTAURANTS_ADMIN', 'SUPER_ADMIN', 'HOTEL_ADMIN', 'HOTEL_MANAGER'] },
  ];

  const isVisible = (a: DashboardAction) => {
    const isHotelAdmin = session?.role === 'HOTEL_ADMIN' || session?.role === 'HOTEL_MANAGER';
    const hasCorrectRole = !a.roles || a.roles.includes(session?.role) || (isHotelAdmin && (a.roles.includes('RESTAURANTS_ADMIN') || a.roles.includes('POSSYSTEM')));
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
              onClick={() => window.open('/staff-portal', '_blank')}
              className="hidden md:flex items-center gap-2 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-800/50 text-indigo-700 dark:text-indigo-400 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 transition-all cursor-pointer"
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
                  <ActionTile
                    icon={action.icon}
                    label={action.label}
                    path={action.path}
                    badge={getBadgeForAction(action.label)}
                    lateStatus={getLateStatusForAction(action.label)}
                  />
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
              <p className="text-sm font-semibold text-slate-650 dark:text-slate-400">No operations found matching &quot;{searchQuery}&quot;</p>
              <p className="text-[11px] text-slate-400 uppercase tracking-wider">Try typing &quot;billing&quot;, &quot;inventory&quot;, or &quot;report&quot;</p>
            </div>
          )}
        </section>
      )}

      {/* Main Categories Panel */}
      {searchQuery.trim() === '' && (
        <div className="space-y-12 animate-in fade-in duration-300">
          
          {/* 1. POS Billing */}
          <OperationsCategorySection
            configKey="posBilling"
            actions={visiblePosBilling}
            getBadgeForAction={getBadgeForAction}
            getLateStatusForAction={getLateStatusForAction}
            propertyCodePrefix={pc}
          />

          {/* 2. Screen Displays */}
          <OperationsCategorySection
            configKey="displays"
            actions={visibleDisplays}
            getBadgeForAction={getBadgeForAction}
            getLateStatusForAction={getLateStatusForAction}
            propertyCodePrefix={pc}
          />

          {/* 3. Orders & Table Control */}
          <OperationsCategorySection
            configKey="orderControl"
            actions={visibleOrderControl}
            getBadgeForAction={getBadgeForAction}
            getLateStatusForAction={getLateStatusForAction}
            propertyCodePrefix={pc}
          />

          {/* 4. Billing & Payments */}
          <OperationsCategorySection
            configKey="billingPayments"
            actions={visibleBillingPayments}
            getBadgeForAction={getBadgeForAction}
            getLateStatusForAction={getLateStatusForAction}
            propertyCodePrefix={pc}
          />

          {/* 5. Staff & Attendance */}
          <OperationsCategorySection
            configKey="staff"
            actions={visibleStaff}
            getBadgeForAction={getBadgeForAction}
            getLateStatusForAction={getLateStatusForAction}
            propertyCodePrefix={pc}
          />

          {/* 6. Inventory & Menu Setup */}
          <OperationsCategorySection
            configKey="menuInventory"
            actions={visibleMenuInventory}
            getBadgeForAction={getBadgeForAction}
            getLateStatusForAction={getLateStatusForAction}
            propertyCodePrefix={pc}
          />

          {/* 7. Delivery & Logistics */}
          <OperationsCategorySection
            configKey="delivery"
            actions={visibleDelivery}
            getBadgeForAction={getBadgeForAction}
            getLateStatusForAction={getLateStatusForAction}
            propertyCodePrefix={pc}
          />

          {/* 9. Reports & Analytics */}
          <OperationsCategorySection
            configKey="reportsAnalytics"
            actions={visibleReportsAnalytics}
            getBadgeForAction={getBadgeForAction}
            getLateStatusForAction={getLateStatusForAction}
            propertyCodePrefix={pc}
          />

          {/* 10. CRM & Loyalty */}
          <OperationsCategorySection
            configKey="crm"
            actions={visibleCRM}
            getBadgeForAction={getBadgeForAction}
            getLateStatusForAction={getLateStatusForAction}
            propertyCodePrefix={pc}
          />

          {/* 11. B2B Supply Chain */}
          <OperationsCategorySection
            configKey="b2b"
            actions={visibleB2B}
            getBadgeForAction={getBadgeForAction}
            getLateStatusForAction={getLateStatusForAction}
            propertyCodePrefix={pc}
          />

          {/* 12. Store Settings & Setup */}
          <OperationsCategorySection
            configKey="systemSettings"
            actions={visibleSystemSettings}
            getBadgeForAction={getBadgeForAction}
            getLateStatusForAction={getLateStatusForAction}
            propertyCodePrefix={pc}
          />



        </div>
      )}
    </div>
  );
}

const CATEGORY_CONFIGS: Record<string, {
  name: string;
  emoji: string;
  labelColor: string;
  dotColor: string;
  iconColor: string;
  iconBg: string;
  cardBorder: string;
  glowColor: 'sky' | 'cyan' | 'indigo' | 'emerald' | 'violet' | 'amber' | 'teal' | 'orange' | 'rose' | 'slate';
}> = {
  posBilling: {
    name: 'POS Billing',
    emoji: '💳',
    labelColor: 'text-sky-400',
    dotColor: 'bg-sky-400',
    iconColor: 'text-sky-400',
    iconBg: 'bg-sky-500/15',
    cardBorder: 'border-slate-800 hover:border-sky-500/40',
    glowColor: 'sky',
  },
  displays: {
    name: 'Screen Displays',
    emoji: '🖥️',
    labelColor: 'text-cyan-400',
    dotColor: 'bg-cyan-400',
    iconColor: 'text-cyan-400',
    iconBg: 'bg-cyan-500/15',
    cardBorder: 'border-slate-800 hover:border-cyan-500/40',
    glowColor: 'cyan',
  },
  orderControl: {
    name: 'Orders & Table Control',
    emoji: '🍽️',
    labelColor: 'text-indigo-400',
    dotColor: 'bg-indigo-400',
    iconColor: 'text-indigo-400',
    iconBg: 'bg-indigo-500/15',
    cardBorder: 'border-slate-800 hover:border-indigo-500/40',
    glowColor: 'indigo',
  },
  billingPayments: {
    name: 'Billing & Payments',
    emoji: '🧾',
    labelColor: 'text-emerald-400',
    dotColor: 'bg-emerald-400',
    iconColor: 'text-emerald-400',
    iconBg: 'bg-emerald-500/15',
    cardBorder: 'border-slate-800 hover:border-emerald-500/40',
    glowColor: 'emerald',
  },
  staff: {
    name: 'Staff & Attendance',
    emoji: '👥',
    labelColor: 'text-violet-400',
    dotColor: 'bg-violet-400',
    iconColor: 'text-violet-400',
    iconBg: 'bg-violet-500/15',
    cardBorder: 'border-slate-800 hover:border-violet-500/40',
    glowColor: 'violet',
  },
  menuInventory: {
    name: 'Inventory & Menu Setup',
    emoji: '📦',
    labelColor: 'text-amber-400',
    dotColor: 'bg-amber-400',
    iconColor: 'text-amber-400',
    iconBg: 'bg-amber-500/15',
    cardBorder: 'border-slate-800 hover:border-amber-500/40',
    glowColor: 'amber',
  },
  accountingExpenses: {
    name: 'Expenses & Accounting',
    emoji: '💰',
    labelColor: 'text-teal-400',
    dotColor: 'bg-teal-400',
    iconColor: 'text-teal-400',
    iconBg: 'bg-teal-500/15',
    cardBorder: 'border-slate-800 hover:border-teal-500/40',
    glowColor: 'teal',
  },
  delivery: {
    name: 'Delivery & Logistics',
    emoji: '🛵',
    labelColor: 'text-orange-400',
    dotColor: 'bg-orange-400',
    iconColor: 'text-orange-400',
    iconBg: 'bg-orange-500/15',
    cardBorder: 'border-slate-800 hover:border-orange-500/40',
    glowColor: 'orange',
  },
  reportsAnalytics: {
    name: 'Reports & Analytics',
    emoji: '📈',
    labelColor: 'text-indigo-400',
    dotColor: 'bg-indigo-400',
    iconColor: 'text-indigo-400',
    iconBg: 'bg-indigo-500/15',
    cardBorder: 'border-slate-800 hover:border-indigo-500/40',
    glowColor: 'indigo',
  },
  crm: {
    name: 'CRM & Loyalty',
    emoji: '⭐',
    labelColor: 'text-rose-400',
    dotColor: 'bg-rose-400',
    iconColor: 'text-rose-400',
    iconBg: 'bg-rose-500/15',
    cardBorder: 'border-slate-800 hover:border-rose-500/40',
    glowColor: 'rose',
  },
  b2b: {
    name: 'B2B Supply Chain',
    emoji: '🏭',
    labelColor: 'text-amber-400',
    dotColor: 'bg-amber-400',
    iconColor: 'text-amber-400',
    iconBg: 'bg-amber-500/15',
    cardBorder: 'border-slate-800 hover:border-amber-500/40',
    glowColor: 'amber',
  },
  systemSettings: {
    name: 'Store Settings & Setup',
    emoji: '⚙️',
    labelColor: 'text-slate-400',
    dotColor: 'bg-slate-400',
    iconColor: 'text-slate-400',
    iconBg: 'bg-slate-500/15',
    cardBorder: 'border-slate-800 hover:border-slate-500/40',
    glowColor: 'slate',
  },
  'POS Billing': {
    name: 'POS Billing',
    emoji: '💳',
    labelColor: 'text-sky-400',
    dotColor: 'bg-sky-400',
    iconColor: 'text-sky-400',
    iconBg: 'bg-sky-500/15',
    cardBorder: 'border-slate-800 hover:border-sky-500/40',
    glowColor: 'sky',
  },
  'Screen Displays': {
    name: 'Screen Displays',
    emoji: '🖥️',
    labelColor: 'text-cyan-400',
    dotColor: 'bg-cyan-400',
    iconColor: 'text-cyan-400',
    iconBg: 'bg-cyan-500/15',
    cardBorder: 'border-slate-800 hover:border-cyan-500/40',
    glowColor: 'cyan',
  },
  'Orders & Table Control': {
    name: 'Orders & Table Control',
    emoji: '🍽️',
    labelColor: 'text-indigo-400',
    dotColor: 'bg-indigo-400',
    iconColor: 'text-indigo-400',
    iconBg: 'bg-indigo-500/15',
    cardBorder: 'border-slate-800 hover:border-indigo-500/40',
    glowColor: 'indigo',
  },
  'Billing & Payments': {
    name: 'Billing & Payments',
    emoji: '🧾',
    labelColor: 'text-emerald-400',
    dotColor: 'bg-emerald-400',
    iconColor: 'text-emerald-400',
    iconBg: 'bg-emerald-500/15',
    cardBorder: 'border-slate-800 hover:border-emerald-500/40',
    glowColor: 'emerald',
  },
  'Staff & Attendance': {
    name: 'Staff & Attendance',
    emoji: '👥',
    labelColor: 'text-violet-400',
    dotColor: 'bg-violet-400',
    iconColor: 'text-violet-400',
    iconBg: 'bg-violet-500/15',
    cardBorder: 'border-slate-800 hover:border-violet-500/40',
    glowColor: 'violet',
  },
  'Inventory & Menu Setup': {
    name: 'Inventory & Menu Setup',
    emoji: '📦',
    labelColor: 'text-amber-400',
    dotColor: 'bg-amber-400',
    iconColor: 'text-amber-400',
    iconBg: 'bg-amber-500/15',
    cardBorder: 'border-slate-800 hover:border-amber-500/40',
    glowColor: 'amber',
  },
  'Expenses & Accounting': {
    name: 'Expenses & Accounting',
    emoji: '💰',
    labelColor: 'text-teal-400',
    dotColor: 'bg-teal-400',
    iconColor: 'text-teal-400',
    iconBg: 'bg-teal-500/15',
    cardBorder: 'border-slate-800 hover:border-teal-500/40',
    glowColor: 'teal',
  },
  'Delivery & Logistics': {
    name: 'Delivery & Logistics',
    emoji: '🛵',
    labelColor: 'text-orange-400',
    dotColor: 'bg-orange-400',
    iconColor: 'text-orange-400',
    iconBg: 'bg-orange-500/15',
    cardBorder: 'border-slate-800 hover:border-orange-500/40',
    glowColor: 'orange',
  },
  'Reports & Analytics': {
    name: 'Reports & Analytics',
    emoji: '📈',
    labelColor: 'text-indigo-400',
    dotColor: 'bg-indigo-400',
    iconColor: 'text-indigo-400',
    iconBg: 'bg-indigo-500/15',
    cardBorder: 'border-slate-800 hover:border-indigo-500/40',
    glowColor: 'indigo',
  },
  'CRM & Loyalty': {
    name: 'CRM & Loyalty',
    emoji: '⭐',
    labelColor: 'text-rose-400',
    dotColor: 'bg-rose-400',
    iconColor: 'text-rose-400',
    iconBg: 'bg-rose-500/15',
    cardBorder: 'border-slate-800 hover:border-rose-500/40',
    glowColor: 'rose',
  },
  'B2B Supply Chain': {
    name: 'B2B Supply Chain',
    emoji: '🏭',
    labelColor: 'text-amber-400',
    dotColor: 'bg-amber-400',
    iconColor: 'text-amber-400',
    iconBg: 'bg-amber-500/15',
    cardBorder: 'border-slate-800 hover:border-amber-500/40',
    glowColor: 'amber',
  },
  'Store Settings & Setup': {
    name: 'Store Settings & Setup',
    emoji: '⚙️',
    labelColor: 'text-slate-400',
    dotColor: 'bg-slate-400',
    iconColor: 'text-slate-400',
    iconBg: 'bg-slate-500/15',
    cardBorder: 'border-slate-800 hover:border-slate-500/40',
    glowColor: 'slate',
  },
};

function OperationsCategorySection({
  configKey,
  actions,
  getBadgeForAction,
  getLateStatusForAction,
  propertyCodePrefix,
}: {
  configKey: string;
  actions: DashboardAction[];
  getBadgeForAction: (label: string) => number | undefined;
  getLateStatusForAction: (label: string) => 'LATE_PREP' | 'LATE_PICKUP' | null;
  propertyCodePrefix?: string; // e.g. '/RCH002' — tiles with this prefix open in new tab
}) {
  const config = CATEGORY_CONFIGS[configKey];
  if (!config || actions.length === 0) return null;

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-4">
        <div className={`h-6 w-1 ${config.dotColor} rounded-full`}></div>
        <h2 className={`text-sm font-black section-heading uppercase tracking-[0.2em] ${config.labelColor}`}>{config.name}</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {actions.map((action) => (
          <ActionTile
            key={action.label}
            icon={action.icon}
            label={action.label}
            path={action.path}
            badge={getBadgeForAction(action.label)}
            lateStatus={getLateStatusForAction(action.label)}
            iconColor={config.iconColor}
            iconBg={config.iconBg}
            cardBorder={config.cardBorder}
            glowColor={config.glowColor}
          />
        ))}
      </div>
    </section>
  );
}
