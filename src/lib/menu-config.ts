import {
  CreditCard,
  Layers,
  BarChart2,
  Eye,
  Settings,
  RefreshCcw,
  ShoppingBag,
  Users,
  Package,
  FileText,
  CreditCard as PaymentIcon,
  Tag,
  Wallet,
  Receipt,
  BookOpen,
  TrendingDown,
  Banknote,
  CalendarDays,
  BookMarked,
  Map,
  CarFront,
  LayoutDashboard,
  ShieldCheck,
  Tablet,
  FileJson,
  Trophy,
  Wine,
  Store,
  Star,
  Trash2,
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export interface SubMenuItem {
  name: string;
  path: string;
  roles?: string[];
  feature?: string;
  target?: string;
}

export interface MenuItem {
  name: string;
  path: string;
  icon: LucideIcon;
  roles?: string[];
  perm?: string;
  feature?: string;   // Package feature key required to see this item
  target?: string;
  subItems?: SubMenuItem[];
}

export const getSidebarMenu = (role: string, organizationSlug?: string | null): MenuItem[] => {
  const isSuper = role === 'SUPER_ADMIN';
  const isAdmin = role === 'RESTAURANTS_ADMIN';

  // Build the branded dashboard path for restaurant admins
  const adminDashPath = organizationSlug
    ? `/restaurantadmin/${organizationSlug}`
    : '/dashboard';

  return [
    {
      name: 'Dashboard',
      path: isSuper ? '/admin/dashboard' : adminDashPath,
      icon: LayoutDashboard,
      roles: ['RESTAURANTS_ADMIN', 'SUPER_ADMIN'],
      // No feature key — dashboard always accessible
    },
    {
      name: 'POS Home',
      path: '/operations',
      icon: LayoutDashboard,
      roles: ['POSSYSTEM', 'RESTAURANTS_ADMIN', 'SUPER_ADMIN'],
      feature: 'POS',
    },
    {
      name: 'Businesses',
      path: isSuper ? '/admin/properties' : '/manage-properties',
      icon: Map,
      roles: ['RESTAURANTS_ADMIN', 'SUPER_ADMIN'],
    },
    { name: 'POS Terminal',       path: '/billing',           icon: CreditCard, feature: 'POS', roles: ['POSSYSTEM', 'RESTAURANTS_ADMIN', 'SUPER_ADMIN'] },
    { name: 'Counter Payments',   path: '/counter-payments',  icon: Store,      feature: 'POS', roles: ['POSSYSTEM', 'RESTAURANTS_ADMIN', 'SUPER_ADMIN'] },
    { name: '🍺 Bar POS',         path: '/bar-pos',           icon: Wine,       feature: 'POS', roles: ['POSSYSTEM', 'RESTAURANTS_ADMIN', 'SUPER_ADMIN'] },
    { name: 'All Bills',    path: '/all-bills', icon: Receipt,   feature: 'POS',       roles: ['RESTAURANTS_ADMIN', 'SUPER_ADMIN'] },
    { name: 'Invoices',    path: '/invoices',  icon: FileText,  feature: 'POS',       roles: ['RESTAURANTS_ADMIN', 'SUPER_ADMIN', 'POSSYSTEM'] },
    { name: 'Payments',    path: '/payments',  icon: PaymentIcon, feature: 'POS', roles: ['RESTAURANTS_ADMIN', 'SUPER_ADMIN', 'POSSYSTEM'] },
    { name: 'Inventory',   path: '/inventory', icon: Package,   feature: 'INVENTORY', roles: ['POSSYSTEM', 'RESTAURANTS_ADMIN', 'SUPER_ADMIN'], perm: 'Inventory' },
    { name: 'Products',    path: '/products',  icon: Tag,       feature: 'POS',       roles: ['POSSYSTEM', 'RESTAURANTS_ADMIN', 'SUPER_ADMIN'], perm: 'Inventory' },
    { name: 'Categories',  path: '/categories',icon: Layers,    feature: 'POS',       roles: ['POSSYSTEM', 'RESTAURANTS_ADMIN', 'SUPER_ADMIN'], perm: 'Inventory' },
    { name: 'KOTs',        path: '/kots',      icon: Layers,    feature: 'POS',       roles: ['POSSYSTEM', 'RESTAURANTS_ADMIN', 'SUPER_ADMIN'] },
    { name: 'Kitchen Display', path: '/kitchen-display', icon: Eye, feature: 'POS', roles: ['POSSYSTEM', 'RESTAURANTS_ADMIN', 'SUPER_ADMIN'], perm: 'Kitchen Display', target: '_blank' },
    { name: 'Day Closing', path: '/day-closing', icon: Layers,  feature: 'POS',       roles: ['POSSYSTEM', 'RESTAURANTS_ADMIN', 'SUPER_ADMIN'], perm: 'Day Closing' },
    {
      name: 'Expenses',
      path: '/expenses',
      icon: TrendingDown,
      feature: 'ACCOUNTING',
      roles: ['RESTAURANTS_ADMIN', 'SUPER_ADMIN', 'POSSYSTEM'],
      subItems: [
        { name: 'All Expenses', path: '/expenses',            feature: 'ACCOUNTING' },
        { name: 'New Expense',  path: '/expenses/new',        feature: 'ACCOUNTING' },
        { name: 'Categories',  path: '/expenses/categories',  feature: 'ACCOUNTING' },
      ],
    },
    {
      name: 'Accounting',
      path: '/accounts',
      icon: BookOpen,
      feature: 'ACCOUNTING',
      roles: ['RESTAURANTS_ADMIN', 'SUPER_ADMIN', 'POSSYSTEM'],
      subItems: [
        { name: 'New Voucher', path: '/vouchers/new',          feature: 'ACCOUNTING' },
        { name: 'Voucher List',path: '/vouchers',             feature: 'ACCOUNTING' },
        { name: 'Cash Book',   path: '/accounts/cash-book',   feature: 'ACCOUNTING' },
        { name: 'Day Book',    path: '/accounts/day-book',    feature: 'ACCOUNTING' },
        { name: 'Ledger',      path: '/accounts/ledger',      feature: 'ACCOUNTING' },
      ],
    },
    {
      name: 'Operations',
      path: '/operations',
      icon: Layers,
      subItems: [
        { name: 'Table Layout',    path: '/operations/tables',    feature: 'TABLES', roles: ['POSSYSTEM', 'RESTAURANTS_ADMIN', 'SUPER_ADMIN'] },
        { name: 'Tablet Setup',    path: '/settings/tablets',     feature: 'TABLETS', roles: ['POSSYSTEM', 'RESTAURANTS_ADMIN', 'SUPER_ADMIN'] },
        { name: 'Orders Control',  path: '/orders',               feature: 'POS' },
        { name: 'Live Occupancy',  path: '/operations/occupancy', feature: 'HMS' },
        { name: 'Table Bookings',  path: '/table-reservations',   feature: 'TABLES', roles: ['POSSYSTEM', 'RESTAURANTS_ADMIN', 'SUPER_ADMIN'] },
        { name: 'Drivers Hub',     path: '/drivers',              feature: 'DRIVERS' },
        { name: 'Customers',       path: '/customers',            feature: 'CRM', roles: ['RESTAURANTS_ADMIN', 'SUPER_ADMIN', 'POSSYSTEM'] },
        { name: 'POS Staff',       path: '/pos-staff',            feature: 'STAFF',  roles: ['RESTAURANTS_ADMIN', 'SUPER_ADMIN', 'POSSYSTEM'] },
        { name: 'Waste Management', path: '/operations/waste-management', feature: 'POS', roles: ['RESTAURANTS_ADMIN', 'SUPER_ADMIN', 'POSSYSTEM'] },
      ],
    },
    {
      name: 'Memberships',
      path: '/memberships',
      icon: Trophy,
      feature: 'CRM',
      roles: ['RESTAURANTS_ADMIN', 'SUPER_ADMIN', 'POSSYSTEM'],
      subItems: [
        { name: 'Membership Plans', path: '/memberships/plans', feature: 'CRM' },
        { name: 'Issue Cards',     path: '/memberships/cards', feature: 'CRM' },
        { name: 'Usage History',    path: '/memberships/history', feature: 'CRM' },
      ],
    },
    {
      name: 'B2B Marketplace',
      path: '/b2b/market',
      icon: ShoppingBag,
      feature: 'B2B',
      roles: ['RESTAURANTS_ADMIN', 'POSSYSTEM', 'SUPER_ADMIN'],
      subItems: [
        { name: 'Browse Market', path: '/b2b/market', feature: 'B2B' },
        { name: 'My B2B Orders',  path: '/b2b/orders', feature: 'B2B' },
        { name: 'Supplier Hub',   path: '/b2b/supplier', feature: 'B2B', roles: ['SUPER_ADMIN', 'RESTAURANTS_ADMIN'] },
      ],
    },
    {
      name: 'Reports',
      path: '/reports',
      icon: BarChart2,
      feature: 'REPORTS',
      roles: ['RESTAURANTS_ADMIN', 'SUPER_ADMIN', 'POSSYSTEM'],
      subItems: [
        { name: 'Sales Intelligence', path: '/reports/sales',       feature: 'REPORTS' },
        { name: 'Settlements',       path: '/reports/settlements', feature: 'REPORTS' },
        { name: 'Tax Report',        path: '/reports/tax',         feature: 'REPORTS' },
        { name: 'Inventory Report',  path: '/reports/inventory',   feature: 'REPORTS' },
        { name: 'Audit Logs',        path: '/reports/audit',       feature: 'REPORTS' },
        { name: 'Customer Feedback', path: '/reports/ratings',     feature: 'REPORTS' },
      ],
    },
    {
      name: 'GST Filing',
      path: '/pos/gst-filing',
      icon: FileJson,
      feature: 'GST',
      roles: ['RESTAURANTS_ADMIN', 'SUPER_ADMIN', 'POSSYSTEM'],
      perm: 'GST Filing',
      subItems: [
        { name: 'Generate Return', path: '/pos/gst-filing',    feature: 'GST' },
        { name: 'GST Settings',   path: '/pos/gst-settings',  feature: 'GST' },
      ],
    },
    {
      name: isSuper ? 'Global Access' : 'POS Access',
      path: isSuper ? '/manage-users?global=true' : '/manage-users',
      icon: Users,
      roles: ['RESTAURANTS_ADMIN', 'SUPER_ADMIN', 'POSSYSTEM'],
    },
    {
      name: 'Role Management',
      path: '/manage-roles',
      icon: ShieldCheck,
      roles: ['RESTAURANTS_ADMIN', 'SUPER_ADMIN', 'POSSYSTEM'],
    },
    {
      name: 'Settings',
      path: '/settings',
      icon: Settings,
      roles: ['RESTAURANTS_ADMIN', 'SUPER_ADMIN', 'POSSYSTEM'],
      subItems: [
        { name: 'General Settings', path: '/settings' },
        { name: 'Notification Settings', path: '/settings/notifications' },
        { name: 'Tablet Setup',     path: '/settings/tablets', feature: 'TABLETS' },
        { name: 'Data Backup',      path: '/settings/backup', roles: ['RESTAURANTS_ADMIN', 'SUPER_ADMIN'] },
      ]
    },
  ];
};

// Quick Actions Grid for Operations Page
export const operationsGrid = [
  { label: 'Table Layout', icon: Layers, path: '/operations/tables' },
  { label: 'Orders Control', icon: ShoppingBag, path: '/orders' },
  { label: 'Live Occupancy', icon: Eye, path: '/operations/occupancy' },
  { label: 'Table Bookings', icon: CalendarDays, path: '/table-reservations' },
  { label: 'Drivers', icon: CarFront, path: '/drivers' },
  { label: 'POS Staff', icon: Users, path: '/pos-staff' },
  { label: 'Customer Feedback', icon: Star, path: '/reports/ratings' },
  { label: 'Waste Management', icon: Trash2, path: '/operations/waste-management' },
];

// Legacy Export for compatibility during migration
export const sidebarMenu: MenuItem[] = []; 
