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
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export interface SubMenuItem {
  name: string;
  path: string;
  roles?: string[];
  feature?: string;
}

export interface MenuItem {
  name: string;
  path: string;
  icon: LucideIcon;
  roles?: string[];
  perm?: string;
  feature?: string;   // Package feature key required to see this item
  subItems?: SubMenuItem[];
}

export const getSidebarMenu = (role: string): MenuItem[] => {
  const isSuper = role === 'SUPER_ADMIN';
  const isAdmin = role === 'RESTAURANTS_ADMIN';

  return [
    {
      name: 'Dashboard',
      path: isSuper ? '/admin/dashboard' : '/dashboard',
      icon: LayoutDashboard,
      roles: ['RESTAURANTS_ADMIN', 'SUPER_ADMIN'],
      // No feature key — dashboard always accessible
    },
    {
      name: 'POS Home',
      path: '/operations',
      icon: LayoutDashboard,
      roles: ['POSSYSTEM'],
      feature: 'POS',
    },
    {
      name: 'Businesses',
      path: isSuper ? '/admin/properties' : '/manage-properties',
      icon: Map,
      roles: ['RESTAURANTS_ADMIN', 'SUPER_ADMIN'],
    },
    { name: 'POS Terminal',       path: '/billing',           icon: CreditCard, feature: 'POS', roles: ['POSSYSTEM'] },
    { name: 'Counter Payments',   path: '/counter-payments',  icon: Store,      feature: 'POS', roles: ['POSSYSTEM'] },
    { name: '🍺 Bar POS',         path: '/bar-pos',           icon: Wine,       feature: 'POS', roles: ['POSSYSTEM'] },
    { name: 'All Bills',    path: '/all-bills', icon: Receipt,   feature: 'POS',       roles: ['RESTAURANTS_ADMIN', 'SUPER_ADMIN'] },
    { name: 'Invoices',    path: '/invoices',  icon: FileText,  feature: 'POS',       roles: ['RESTAURANTS_ADMIN', 'SUPER_ADMIN', 'POSSYSTEM'] },
    { name: 'Payments',    path: '/payments',  icon: PaymentIcon, feature: 'POS', roles: ['RESTAURANTS_ADMIN', 'SUPER_ADMIN', 'POSSYSTEM'] },
    { name: 'Inventory',   path: '/inventory', icon: Package,   feature: 'INVENTORY', roles: ['POSSYSTEM'], perm: 'Inventory' },
    { name: 'Products',    path: '/products',  icon: Tag,       feature: 'POS',       roles: ['POSSYSTEM'], perm: 'Inventory' },
    { name: 'Categories',  path: '/categories',icon: Layers,    feature: 'POS',       roles: ['POSSYSTEM'], perm: 'Inventory' },
    { name: 'KOTs',        path: '/kots',      icon: Layers,    feature: 'POS',       roles: ['POSSYSTEM'] },
    { name: 'Kitchen Display', path: '/kitchen-display', icon: Eye, feature: 'POS', roles: ['POSSYSTEM'] },
    { name: 'Day Closing', path: '/day-closing', icon: Layers,  feature: 'POS',       roles: ['POSSYSTEM'], perm: 'Day Closing' },
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
        { name: 'Table Layout',    path: '/operations/tables',    feature: 'TABLES', roles: ['POSSYSTEM'] },
        { name: 'Tablet Setup',    path: '/settings/tablets',     feature: 'TABLETS', roles: ['POSSYSTEM'] },
        { name: 'Orders Control',  path: '/orders',               feature: 'POS' },
        { name: 'Live Occupancy',  path: '/operations/occupancy', feature: 'HMS' },
        { name: 'Table Bookings',  path: '/table-reservations',   feature: 'TABLES', roles: ['POSSYSTEM'] },
        { name: 'Drivers Hub',     path: '/drivers',              feature: 'DRIVERS' },
        { name: 'Customers',       path: '/customers',            feature: 'CRM', roles: ['RESTAURANTS_ADMIN', 'SUPER_ADMIN', 'POSSYSTEM'] },
        { name: 'POS Staff',       path: '/pos-staff',            feature: 'STAFF',  roles: ['RESTAURANTS_ADMIN', 'SUPER_ADMIN', 'POSSYSTEM'] },
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
];

// Legacy Export for compatibility during migration
export const sidebarMenu: MenuItem[] = []; 
