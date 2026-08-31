'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Package,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  XCircle,
  Percent,
  Building2,
  ShieldCheck,
  LayoutGrid,
  Sparkles,
  Tag,
  ChevronDown,
  ChevronUp,
  Save,
  X,
  ToggleLeft,
  ToggleRight,
  Boxes,
  Zap,
  Calendar,
  CalendarX,
  ArrowRight,
  ArrowLeft,
  Eye,
  Check,
  Monitor,
} from 'lucide-react';

// ─── ALL FEATURES — complete feature registry (POS + Hotel PMS + Hotel Amenities + AI) ─
const ALL_FEATURES = [
  // ── Core POS ──
  { key: 'POS',            label: 'Point of Sale',           description: 'Billing, orders, KOT, bar POS, invoices', icon: '🛒', group: 'Core' },
  { key: 'INVENTORY',      label: 'Inventory',               description: 'Stock, warehouses, purchases, products', icon: '📦', group: 'Core' },
  { key: 'ACCOUNTING',     label: 'Accounting',              description: 'Vouchers, cash book, day book, ledger', icon: '💰', group: 'Core' },
  // ── Restaurant / F&B ──
  { key: 'TABLES',         label: 'Table Management',        description: 'Floor maps, table reservations, layout', icon: '🪑', group: 'Restaurant & F&B' },
  { key: 'TABLETS',        label: 'Tablet / Waiter App',     description: 'Tablet POS & waiter mode setup', icon: '📱', group: 'Restaurant & F&B' },
  { key: 'BARPOS',         label: 'Bar POS',                 description: 'Bar-specific billing terminal, liquor items & bar display', icon: '🍺', group: 'Restaurant & F&B' },
  { key: 'CAFEPOS',        label: 'Cafe POS',                description: 'Cafe order flow, quick billing & cafe display settings', icon: '☕', group: 'Restaurant & F&B' },
  // ── Hotel PMS — Core ──
  { key: 'HMS',            label: 'Hotel Front Desk & PMS',  description: 'Bookings, check-in/out, room folios, occupancy & calendar', icon: '🏨', group: 'Hotel PMS' },
  { key: 'HOTEL_ROOMS',    label: 'Room Status Board',       description: 'Live room matrix, key tracking, VIP/dirty/clean status', icon: '🛏️', group: 'Hotel PMS' },
  { key: 'CHANNEL_MANAGER',label: 'Channel Manager',         description: '2-Way OTA sync — Booking.com, Agoda, MakeMyTrip, Expedia', icon: '🌐', group: 'Hotel PMS' },
  { key: 'REVENUE_AI',     label: 'Revenue AI & Simulator',  description: 'AI dynamic pricing, demand rules, rate simulator & RevPAR', icon: '📈', group: 'Hotel PMS' },
  { key: 'HOTEL_REPORTS',  label: 'Hotel Analytics & BI',    description: '16 hotel operational, occupancy & financial PDF/CSV reports', icon: '📊', group: 'Hotel PMS' },
  { key: 'HOUSEKEEPING',   label: 'Housekeeping',            description: 'Room cleaning tasks, turnaround tracking & staff assignment', icon: '🧹', group: 'Hotel PMS' },
  { key: 'MAINTENANCE',    label: 'Maintenance & Engineering',description: 'Room maintenance tickets, repair work orders & scheduling', icon: '🔧', group: 'Hotel PMS' },
  { key: 'NIGHT_AUDIT',    label: 'Night Audit Console',     description: 'Day-end audit, balancing, shift closing & revenue settlement', icon: '🌙', group: 'Hotel PMS' },
  { key: 'HOTEL_CRM',      label: 'Guest CRM & Loyalty',     description: '360° guest profiles, preferences, loyalty points & history', icon: '⭐', group: 'Hotel PMS' },
  // ── Hotel Amenities & Hospitality ──
  { key: 'SPA_WELLNESS',   label: 'Spa & Wellness Center',   description: 'Spa appointments, therapist roster & treatment packages', icon: '✨', group: 'Hotel Amenities' },
  { key: 'SWIMMING_POOL',  label: 'Swimming Pool',           description: 'Pool passes, day-use visitor entry & capacity management', icon: '🏊', group: 'Hotel Amenities' },
  { key: 'BANQUET_EVENTS', label: 'Banquet & Events',        description: 'Banquet hall bookings, event packages & catering menus', icon: '🎉', group: 'Hotel Amenities' },
  { key: 'ROOM_SERVICE',   label: 'Room Service',            description: 'In-room dining orders, tray dispatch & delivery tracking', icon: '🍽️', group: 'Hotel Amenities' },
  { key: 'LIVE_MUSIC',     label: 'Live Music & Entertainment', description: 'Singer roster, performance schedule & event booking', icon: '🎵', group: 'Hotel Amenities' },
  { key: 'HOTEL_LAUNDRY',  label: 'Laundry Services',        description: 'Guest & linen laundry tracking, pickup/delivery & billing', icon: '👔', group: 'Hotel Amenities' },
  { key: 'LOST_FOUND',     label: 'Lost & Found',            description: 'Item registry, guest claim tracking & handover logs', icon: '🔍', group: 'Hotel Amenities' },
  // ── AI & Smart Hotel ──
  { key: 'AI_CONCIERGE',   label: 'AI Concierge & IoT',      description: '24/7 AI guest assistant, smart room controls & IoT integration', icon: '🤖', group: 'AI & Smart Hotel' },
  { key: 'TRAVEL_AGENTS',  label: 'Travel Agents & B2B',     description: 'Agent contracts, commission management & corporate rate plans', icon: '🤝', group: 'AI & Smart Hotel' },
  // ── Analytics ──
  { key: 'REPORTS',        label: 'Reports & Analytics',     description: 'Sales, revenue, settlements, audit logs', icon: '📋', group: 'Analytics' },
  { key: 'GST',            label: 'GST Filing',              description: 'GSTR-1, GSTR-3B filings & settings', icon: '🧾', group: 'Analytics' },
  // ── People ──
  { key: 'STAFF',          label: 'Staff Management',        description: 'Staff profiles, attendance, salaries', icon: '👥', group: 'People' },
  { key: 'DRIVERS',        label: 'Driver Management',       description: 'Drivers, gifts, offer programs', icon: '🚗', group: 'People' },
  { key: 'CRM',            label: 'CRM & Memberships',       description: 'Customers, membership plans & cards', icon: '👤', group: 'People' },
  // ── Marketing ──
  { key: 'OFFERS',         label: 'Offers & Rewards',        description: 'Driver reward campaigns & payouts', icon: '🎁', group: 'Marketing' },
  { key: 'WEBSITE',        label: 'Website CMS',             description: 'Blogs, gallery, sliders, settings', icon: '🌐', group: 'Marketing' },
  // ── Advanced ──
  { key: 'B2B',            label: 'B2B Marketplace',         description: 'Supplier ordering & B2B market', icon: '🚛', group: 'Advanced' },
  { key: 'PARKING',        label: 'Parking Management',      description: 'Parking slots, QR check-in/out', icon: '🅿️', group: 'Advanced' },
  { key: 'WASTE',          label: 'Waste Management',        description: 'Waste tracking, disposal logs', icon: '🗑️', group: 'Advanced' },
  // ── Integrations & Communication ──
  { key: 'WHATSAPP',       label: 'WhatsApp Bot & Alerts',   description: 'Outbound bill notifications & chatbot order entries', icon: '💬', group: 'Integrations' },
  { key: 'WALKIETALKIE',   label: 'Staff Walkie-Talkie',     description: 'PTT voice communication, channel creation & voice audio', icon: '📡', group: 'Integrations' },
  { key: 'GEOFENCING',     label: 'Geofenced Attendance',    description: 'GPS attendance auditing & live location tracking', icon: '📍', group: 'Integrations' },
  { key: 'TIPS',           label: 'Counter Tips & Gratuity', description: 'Staff tip logs, checkout gratuity input & tip reporting', icon: '💵', group: 'Integrations' },
];

const FEATURE_GROUPS = [
  'Core',
  'Restaurant & F&B',
  'Hotel PMS',
  'Hotel Amenities',
  'AI & Smart Hotel',
  'Analytics',
  'People',
  'Marketing',
  'Advanced',
  'Integrations',
];

// ─── PACKAGE PRESETS — 1-click package templates ─────────────────────────────
const PACKAGE_PRESETS = [
  {
    label: '🏨 Hotel Starter',
    color: '#0ea5e9',
    description: 'Essential hotel operations — front desk, rooms, housekeeping & reports',
    features: ['HMS', 'HOTEL_ROOMS', 'HOUSEKEEPING', 'NIGHT_AUDIT', 'HOTEL_REPORTS', 'HOTEL_CRM', 'MAINTENANCE'],
    allowedHotelCount: 1,
    allowedPosCount: 1,
    allowedPropertyCount: 1,
    priceUSD: 49,
    priceINR: 3999,
  },
  {
    label: '🌟 Hotel & Resort Pro',
    color: '#8b5cf6',
    description: 'Full hotel PMS + OTA sync + AI revenue + spa, pool, banquet & room service',
    features: ['HMS', 'HOTEL_ROOMS', 'CHANNEL_MANAGER', 'REVENUE_AI', 'HOTEL_REPORTS', 'HOUSEKEEPING', 'MAINTENANCE', 'NIGHT_AUDIT', 'HOTEL_CRM', 'SPA_WELLNESS', 'SWIMMING_POOL', 'BANQUET_EVENTS', 'ROOM_SERVICE', 'HOTEL_LAUNDRY', 'LOST_FOUND', 'TRAVEL_AGENTS'],
    allowedHotelCount: 3,
    allowedPosCount: 2,
    allowedPropertyCount: 3,
    priceUSD: 149,
    priceINR: 11999,
  },
  {
    label: '👑 All-Inclusive Enterprise',
    color: '#f59e0b',
    description: 'Every feature unlocked — hotel + restaurant POS + AI concierge + integrations',
    features: ALL_FEATURES.map(f => f.key),
    allowedHotelCount: 10,
    allowedPosCount: 3,
    allowedPropertyCount: 10,
    priceUSD: 299,
    priceINR: 24999,
  },
  {
    label: '🍽️ Restaurant & Bar POS',
    color: '#f43f5e',
    description: 'Core POS, inventory, table management, bar & cafe terminals',
    features: ['POS', 'INVENTORY', 'ACCOUNTING', 'TABLES', 'TABLETS', 'BARPOS', 'CAFEPOS', 'REPORTS', 'STAFF', 'CRM'],
    allowedHotelCount: 0,
    allowedPosCount: 3,
    allowedPropertyCount: 2,
    priceUSD: 29,
    priceINR: 2499,
  },
];

// ─── ALL MODULES — every module in the API routes ────────────────────────────
const ALL_MODULES = [
  // Operations (POS)
  { module: 'orders',              actions: ['read', 'create', 'update', 'delete'], group: 'Operations',       feature: 'POS' },
  { module: 'products',            actions: ['read', 'create', 'update', 'delete'], group: 'Operations',       feature: 'POS' },
  { module: 'categories',          actions: ['read', 'create', 'update', 'delete'], group: 'Operations',       feature: 'POS' },
  { module: 'kots',                actions: ['read', 'create', 'update'],           group: 'Operations',       feature: 'POS' },
  { module: 'tables',              actions: ['read', 'create', 'update', 'delete'], group: 'Operations',       feature: 'TABLES' },
  { module: 'billing',             actions: ['read', 'create'],                     group: 'Operations',       feature: 'POS' },
  { module: 'kitchen display',     actions: ['read'],                               group: 'Operations',       feature: 'POS' },
  { module: 'tips',                actions: ['read'],                               group: 'Operations',       feature: 'TIPS' },
  // Inventory
  { module: 'inventory',           actions: ['read', 'create', 'update', 'delete'], group: 'Inventory',        feature: 'INVENTORY' },
  { module: 'purchases',           actions: ['read', 'create', 'update', 'delete'], group: 'Inventory',        feature: 'INVENTORY' },
  { module: 'waste',               actions: ['read', 'create', 'update', 'delete'], group: 'Inventory',        feature: 'WASTE' },
  // Finance
  { module: 'payments',            actions: ['read', 'create'],                     group: 'Finance',          feature: 'POS' },
  { module: 'expenses',            actions: ['read', 'create', 'update', 'delete'], group: 'Finance',          feature: 'ACCOUNTING' },
  { module: 'accounts',            actions: ['read', 'create', 'update'],           group: 'Finance',          feature: 'ACCOUNTING' },
  { module: 'vouchers',            actions: ['read', 'create', 'update', 'delete'], group: 'Finance',          feature: 'ACCOUNTING' },
  // Analytics
  { module: 'reports',             actions: ['read'],                               group: 'Analytics',        feature: 'REPORTS' },
  { module: 'gst',                 actions: ['read', 'create'],                     group: 'Analytics',        feature: 'GST' },
  // People
  { module: 'users',               actions: ['read', 'create', 'update', 'delete'], group: 'People',           feature: 'POS' },
  { module: 'staff',               actions: ['read', 'create', 'update', 'delete'], group: 'People',           feature: 'STAFF' },
  { module: 'drivers',             actions: ['read', 'create', 'update', 'delete'], group: 'People',           feature: 'DRIVERS' },
  { module: 'guests',              actions: ['read', 'create', 'update'],           group: 'People',           feature: 'CRM' },
  { module: 'customers',           actions: ['read', 'create', 'update', 'delete'], group: 'People',           feature: 'CRM' },
  { module: 'memberships',         actions: ['read', 'create', 'update', 'delete'], group: 'People',           feature: 'CRM' },
  { module: 'geofencing',          actions: ['read', 'update'],                     group: 'People',           feature: 'GEOFENCING' },
  // Restaurant & Bar
  { module: 'reservations',        actions: ['read', 'create', 'update', 'delete'], group: 'Restaurant',       feature: 'TABLES' },
  { module: 'bar-pos',             actions: ['read', 'create'],                     group: 'Restaurant',       feature: 'BARPOS' },
  { module: 'cafe-pos',            actions: ['read', 'create'],                     group: 'Restaurant',       feature: 'CAFEPOS' },
  // Hotel PMS Core
  { module: 'hotel-bookings',      actions: ['read', 'create', 'update', 'delete'], group: 'Hotel PMS',        feature: 'HMS' },
  { module: 'hotel-checkin',       actions: ['read', 'create', 'update'],           group: 'Hotel PMS',        feature: 'HMS' },
  { module: 'hotel-folio',         actions: ['read', 'create', 'update'],           group: 'Hotel PMS',        feature: 'HMS' },
  { module: 'room-board',          actions: ['read', 'update'],                     group: 'Hotel PMS',        feature: 'HOTEL_ROOMS' },
  { module: 'channel-manager',     actions: ['read', 'create', 'update', 'delete'], group: 'Hotel PMS',        feature: 'CHANNEL_MANAGER' },
  { module: 'revenue-management',  actions: ['read', 'create', 'update', 'delete'], group: 'Hotel PMS',        feature: 'REVENUE_AI' },
  { module: 'hotel-analytics',     actions: ['read'],                               group: 'Hotel PMS',        feature: 'HOTEL_REPORTS' },
  { module: 'housekeeping',        actions: ['read', 'create', 'update', 'delete'], group: 'Hotel PMS',        feature: 'HOUSEKEEPING' },
  { module: 'maintenance',         actions: ['read', 'create', 'update', 'delete'], group: 'Hotel PMS',        feature: 'MAINTENANCE' },
  { module: 'night-audit',         actions: ['read', 'create', 'update'],           group: 'Hotel PMS',        feature: 'NIGHT_AUDIT' },
  { module: 'hotel-crm',           actions: ['read', 'create', 'update', 'delete'], group: 'Hotel PMS',        feature: 'HOTEL_CRM' },
  // Hotel Amenities
  { module: 'spa',                 actions: ['read', 'create', 'update', 'delete'], group: 'Hotel Amenities',  feature: 'SPA_WELLNESS' },
  { module: 'pool',                actions: ['read', 'create', 'update', 'delete'], group: 'Hotel Amenities',  feature: 'SWIMMING_POOL' },
  { module: 'banquet',             actions: ['read', 'create', 'update', 'delete'], group: 'Hotel Amenities',  feature: 'BANQUET_EVENTS' },
  { module: 'room-service',        actions: ['read', 'create', 'update', 'delete'], group: 'Hotel Amenities',  feature: 'ROOM_SERVICE' },
  { module: 'live-music',          actions: ['read', 'create', 'update', 'delete'], group: 'Hotel Amenities',  feature: 'LIVE_MUSIC' },
  { module: 'laundry',             actions: ['read', 'create', 'update', 'delete'], group: 'Hotel Amenities',  feature: 'HOTEL_LAUNDRY' },
  { module: 'lost-found',          actions: ['read', 'create', 'update', 'delete'], group: 'Hotel Amenities',  feature: 'LOST_FOUND' },
  // AI & Smart Hotel
  { module: 'ai-concierge',        actions: ['read', 'create', 'update'],           group: 'AI & Smart Hotel', feature: 'AI_CONCIERGE' },
  { module: 'travel-agents',       actions: ['read', 'create', 'update', 'delete'], group: 'AI & Smart Hotel', feature: 'TRAVEL_AGENTS' },
  // Advanced & System
  { module: 'parking',             actions: ['read', 'create', 'update', 'delete'], group: 'Advanced',         feature: 'PARKING' },
  { module: 'b2b',                 actions: ['read', 'create', 'update', 'delete'], group: 'Advanced',         feature: 'B2B' },
  { module: 'settings',            actions: ['read', 'update'],                     group: 'System',           feature: 'POS' },
  { module: 'website',             actions: ['read', 'create', 'update', 'delete'], group: 'System',           feature: 'WEBSITE' },
  { module: 'walkie-talkie',       actions: ['read', 'create', 'update', 'delete'], group: 'System',           feature: 'WALKIETALKIE' },
  { module: 'whatsapp',            actions: ['read', 'update'],                     group: 'System',           feature: 'WHATSAPP' },
];

const MODULE_GROUPS = ['Operations', 'Inventory', 'Finance', 'Analytics', 'People', 'Restaurant', 'Hotel PMS', 'Hotel Amenities', 'AI & Smart Hotel', 'Advanced', 'System'];

const ACCENT_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
  '#10b981', '#0ea5e9', '#ef4444', '#14b8a6',
  '#f97316', '#84cc16',
];

type Feature = { id: string; feature: string };
type Permission = { id: string; module: string; action: string };
type Pkg = {
  id: string;
  name: string;
  description: string | null;
  discountPercent: number;
  priceUSD: number;
  priceINR: number;
  isActive: boolean;
  color: string | null;
  allowedPosCount: number;
  allowedPropertyCount: number;
  allowedHotelCount: number;
  features: Feature[];
  permissions: Permission[];
  _count: { organizations: number };
  createdAt: string;
};

const emptyForm = () => ({
  name: '',
  description: '',
  discountPercent: 0,
  priceUSD: 0,
  priceINR: 0,
  isActive: true,
  color: '#6366f1',
  allowedPosCount: 1,
  allowedPropertyCount: 1,
  allowedHotelCount: 0,
  features: [] as string[],
  permissions: [] as { module: string; action: string }[],
});

// ─── Package Card ─────────────────────────────────────────────────────────────
function PackageCard({
  pkg,
  onEdit,
  onDelete,
  onToggleActive,
}: {
  pkg: Pkg;
  onEdit: (p: Pkg) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, v: boolean) => void;
}) {
  const color = pkg.color || '#6366f1';
  const featureKeys = pkg.features.map((f) => f.feature);
  const totalPerms = pkg.permissions.length;

  return (
    <div
      className="relative rounded-3xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group"
      style={{ borderTop: `4px solid ${color}` }}
    >
      {/* Active badge */}
      <div className="absolute top-4 right-4">
        {pkg.isActive ? (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-100 dark:border-emerald-800">
            <CheckCircle2 size={10} /> Active
          </span>
        ) : (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-black uppercase tracking-widest">
            <XCircle size={10} /> Inactive
          </span>
        )}
      </div>

      <div className="p-7">
        {/* Icon + Name */}
        <div className="flex items-center gap-4 mb-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shrink-0"
            style={{ background: `linear-gradient(135deg, ${color}dd, ${color}88)` }}
          >
            <Boxes className="text-white" size={22} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">{pkg.name}</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 line-clamp-1">{pkg.description || 'No description'}</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-3 text-center">
            <p className="text-2xl font-black text-slate-900 dark:text-white">{pkg.discountPercent}%</p>
            <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">Discount</p>
          </div>
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-3 text-center">
            <p className="text-2xl font-black text-slate-900 dark:text-white">{featureKeys.length}</p>
            <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">Modules</p>
          </div>
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-3 text-center">
            <p className="text-2xl font-black text-slate-900 dark:text-white">{pkg._count.organizations}</p>
            <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">Orgs</p>
          </div>
        </div>

        {/* Pricing */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100/30 dark:border-indigo-900/30 p-2.5 text-center">
            <p className="text-lg font-black text-indigo-600 dark:text-indigo-400">${pkg.priceUSD ?? 0}</p>
            <p className="text-[9px] font-bold text-indigo-400/80 uppercase tracking-wider mt-0.5">Price (USD)</p>
          </div>
          <div className="rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100/30 dark:border-emerald-900/30 p-2.5 text-center">
            <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">₹{pkg.priceINR ?? 0}</p>
            <p className="text-[9px] font-bold text-emerald-400/80 uppercase tracking-wider mt-0.5">Price (INR)</p>
          </div>
        </div>

        {/* POS Limit */}
        <div className="flex items-center gap-2 mb-2 p-2.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/30 dark:border-indigo-900/30">
          <Monitor size={13} className="text-indigo-500 shrink-0" />
          <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
            POS Limit: {pkg.allowedPosCount ?? 1} Terminal{(pkg.allowedPosCount ?? 1) !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Property Limit */}
        <div className="flex items-center gap-2 mb-2 p-2.5 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100/30 dark:border-purple-900/30">
          <Building2 size={13} className="text-purple-500 shrink-0" />
          <p className="text-xs font-bold text-purple-600 dark:text-purple-400">
            Property Limit: {pkg.allowedPropertyCount ?? 1} Venue{(pkg.allowedPropertyCount ?? 1) !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Hotel Limit — only show if HMS feature is in the package */}
        {(featureKeys.includes('HMS') || (pkg.allowedHotelCount ?? 0) > 0) && (
          <div className="flex items-center gap-2 mb-4 p-2.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100/30 dark:border-amber-900/30">
            <span className="text-sm shrink-0">🏨</span>
            <p className="text-xs font-bold text-amber-600 dark:text-amber-400">
              Hotel Limit: {pkg.allowedHotelCount ?? 0} Hotel{(pkg.allowedHotelCount ?? 0) !== 1 ? 's' : ''}
              {(pkg.allowedHotelCount ?? 0) === 0 && <span className="ml-1 text-amber-400/70">(Not included)</span>}
            </p>
          </div>
        )}

        {/* Permission count */}
        {totalPerms > 0 && (
          <div className="flex items-center gap-2 mb-4 p-2.5 rounded-xl bg-violet-50/50 dark:bg-violet-950/20 border border-violet-100/30 dark:border-violet-900/30">
            <ShieldCheck size={13} className="text-violet-500 shrink-0" />
            <p className="text-xs font-bold text-violet-600 dark:text-violet-400">{totalPerms} permission{totalPerms !== 1 ? 's' : ''} granted</p>
          </div>
        )}

        {/* Feature chips */}
        <div className="flex flex-wrap gap-1.5 mb-6 min-h-[28px]">
          {featureKeys.slice(0, 5).map((f) => {
            const def = ALL_FEATURES.find((x) => x.key === f);
            return (
              <span
                key={f}
                className="px-2 py-0.5 rounded-full text-[10px] font-bold border"
                style={{ background: `${color}18`, borderColor: `${color}40`, color }}
              >
                {def?.icon} {def?.label || f}
              </span>
            );
          })}
          {featureKeys.length > 5 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
              +{featureKeys.length - 5} more
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => onEdit(pkg)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-all"
          >
            <Edit3 size={13} /> Edit
          </button>
          <button
            onClick={() => onToggleActive(pkg.id, !pkg.isActive)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all border"
            style={{ borderColor: `${color}40`, color, background: `${color}10` }}
          >
            {pkg.isActive ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
            {pkg.isActive ? 'Deactivate' : 'Activate'}
          </button>
          <button
            onClick={() => onDelete(pkg.id)}
            className="p-2.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 border border-slate-200 dark:border-slate-700 transition-all"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Step Indicator ───────────────────────────────────────────────────────────
const STEPS = ['Basic Info', 'Module Access', 'Permissions', 'Review'];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 w-full">
      {STEPS.map((s, i) => (
        <React.Fragment key={s}>
          <div className="flex flex-col items-center gap-1 flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300 ${
                i < current
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200'
                  : i === current
                  ? 'bg-pos-primary text-white shadow-lg shadow-pos-primary/30 scale-110'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
              }`}
            >
              {i < current ? <Check size={14} /> : i + 1}
            </div>
            <span className={`text-[9px] font-bold uppercase tracking-wider hidden md:block ${i === current ? 'text-pos-primary' : 'text-slate-400'}`}>
              {s}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`flex-1 h-0.5 mb-4 mx-1 rounded-full transition-all duration-500 ${i < current ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-slate-700'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── Package Form Modal ───────────────────────────────────────────────────────
function PackageFormModal({
  isOpen,
  onClose,
  onSave,
  editing,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ReturnType<typeof emptyForm>) => Promise<void>;
  editing: Pkg | null;
}) {
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(0);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [expandedModuleGroup, setExpandedModuleGroup] = useState<string | null>(null);

  useEffect(() => {
    if (editing) {
      setForm({
        name: editing.name,
        description: editing.description || '',
        discountPercent: editing.discountPercent,
        priceUSD: editing.priceUSD || 0,
        priceINR: editing.priceINR || 0,
        isActive: editing.isActive,
        color: editing.color || '#6366f1',
        allowedPosCount: editing.allowedPosCount ?? 1,
        allowedPropertyCount: editing.allowedPropertyCount ?? 1,
        allowedHotelCount: editing.allowedHotelCount ?? 0,
        features: editing.features.map((f) => f.feature),
        permissions: editing.permissions.map((p) => ({ module: p.module, action: p.action })),
      });
    } else {
      setForm(emptyForm());
    }
    setStep(0);
  }, [editing, isOpen]);

  const toggleFeature = (key: string) => {
    setForm((f) => ({
      ...f,
      features: f.features.includes(key) ? f.features.filter((x) => x !== key) : [...f.features, key],
    }));
  };

  const toggleGroupFeatures = (group: string) => {
    const groupKeys = ALL_FEATURES.filter((f) => f.group === group).map((f) => f.key);
    const allSelected = groupKeys.every((k) => form.features.includes(k));
    if (allSelected) {
      setForm((f) => ({ ...f, features: f.features.filter((x) => !groupKeys.includes(x)) }));
    } else {
      setForm((f) => ({ ...f, features: [...new Set([...f.features, ...groupKeys])] }));
    }
  };

  const togglePermission = (module: string, action: string) => {
    const exists = form.permissions.some((p) => p.module === module && p.action === action);
    setForm((f) => ({
      ...f,
      permissions: exists
        ? f.permissions.filter((p) => !(p.module === module && p.action === action))
        : [...f.permissions, { module, action }],
    }));
  };

  const toggleModuleAll = (mod: typeof ALL_MODULES[0]) => {
    const allChecked = mod.actions.every((a) => form.permissions.some((p) => p.module === mod.module && p.action === a));
    const newPerms = form.permissions.filter((p) => p.module !== mod.module);
    if (!allChecked) {
      mod.actions.forEach((a) => newPerms.push({ module: mod.module, action: a }));
    }
    setForm({ ...form, permissions: newPerms });
  };

  const toggleGroupModules = (group: string) => {
    const groupMods = ALL_MODULES.filter((m) => m.group === group && form.features.includes(m.feature));
    const allChecked = groupMods.every((mod) =>
      mod.actions.every((a) => form.permissions.some((p) => p.module === mod.module && p.action === a))
    );
    let newPerms = form.permissions.filter((p) => !groupMods.some((m) => m.module === p.module));
    if (!allChecked) {
      groupMods.forEach((mod) => mod.actions.forEach((a) => newPerms.push({ module: mod.module, action: a })));
    }
    setForm({ ...form, permissions: newPerms });
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const sanitizedPermissions = form.permissions.filter((p) => {
        const mod = ALL_MODULES.find((m) => m.module === p.module);
        return mod ? form.features.includes(mod.feature) : false;
      });
      await onSave({
        ...form,
        permissions: sanitizedPermissions,
      });
    } finally {
      setSaving(false);
    }
  };

  const canNext = step === 0 ? form.name.trim().length > 0 : true;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
        
        {/* Header */}
        <div className="shrink-0 bg-white dark:bg-slate-900 px-8 pt-8 pb-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${form.color}dd, ${form.color}88)` }}
              >
                <Package className="text-white" size={18} />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  {editing ? 'Edit Package' : 'Create New Package'}
                </h2>
                <p className="text-xs text-slate-400 font-medium">
                  Step {step + 1} of {STEPS.length} — {STEPS[step]}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500">
              <X size={18} />
            </button>
          </div>
          <StepIndicator current={step} />
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
          
          {/* ── STEP 0: Basic Info ─────────────────────────────── */}
          {step === 0 && (
            <div className="space-y-5">

              {/* 1-Click Presets */}
              {!editing && (
                <div className="rounded-2xl border-2 border-dashed border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/40 dark:bg-indigo-950/20 p-4">
                  <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <Sparkles size={11} /> 1-Click Package Presets
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {PACKAGE_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setForm({
                          name: preset.label.replace(/^[^\s]+\s/, ''), // strip emoji
                          description: preset.description,
                          color: preset.color,
                          features: preset.features,
                          allowedHotelCount: preset.allowedHotelCount,
                          allowedPosCount: preset.allowedPosCount,
                          allowedPropertyCount: preset.allowedPropertyCount,
                          priceUSD: preset.priceUSD,
                          priceINR: preset.priceINR,
                          discountPercent: 0,
                          isActive: true,
                          permissions: [],
                        })}
                        className="flex items-start gap-2 p-3 rounded-xl border-2 text-left transition-all hover:scale-[1.02] active:scale-100"
                        style={{ borderColor: `${preset.color}50`, background: `${preset.color}10` }}
                      >
                        <span className="text-lg leading-none mt-0.5">{preset.label.split(' ')[0]}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-black truncate" style={{ color: preset.color }}>
                            {preset.label.replace(/^[^\s]+\s/, '')}
                          </p>
                          <p className="text-[9px] text-slate-400 mt-0.5 line-clamp-1">{preset.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] font-black" style={{ color: preset.color }}>${preset.priceUSD}/mo</span>
                            <span className="text-[9px] text-slate-400">{preset.features.length} features</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                  <p className="text-[9px] text-slate-400 mt-2 italic">Preset apply karne ke baad aap koi bhi field edit kar sakte hain</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Package Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Starter, Pro, Enterprise"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Brief description of this package..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Price (USD $) *</label>
                  <input
                    type="number" min={0}
                    value={form.priceUSD}
                    onChange={(e) => setForm({ ...form, priceUSD: Number(e.target.value) })}
                    placeholder="e.g. 29"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Price (INR ₹) *</label>
                  <input
                    type="number" min={0}
                    value={form.priceINR}
                    onChange={(e) => setForm({ ...form, priceINR: Number(e.target.value) })}
                    placeholder="e.g. 2499"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    <Percent size={13} className="inline mr-1" />Discount %
                  </label>
                  <input
                    type="number" min={0} max={100}
                    value={form.discountPercent}
                    onChange={(e) => setForm({ ...form, discountPercent: Number(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Accent Color</label>
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    {ACCENT_COLORS.map((c) => (
                      <button
                        key={c} type="button"
                        onClick={() => setForm({ ...form, color: c })}
                        className="w-6 h-6 rounded-full border-2 transition-all"
                        style={{
                          background: c,
                          borderColor: form.color === c ? '#fff' : c,
                          boxShadow: form.color === c ? `0 0 0 3px ${c}` : 'none',
                          transform: form.color === c ? 'scale(1.25)' : 'scale(1)',
                        }}
                      />
                    ))}
                    <input
                      type="color" value={form.color}
                      onChange={(e) => setForm({ ...form, color: e.target.value })}
                      className="w-6 h-6 rounded-full cursor-pointer border-2 border-slate-200"
                      title="Custom color"
                    />
                  </div>
                </div>
              </div>

              {/* POS Terminal limit selection */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Allowed POS Terminals Limit *
                </label>
                <select
                  value={form.allowedPosCount}
                  onChange={(e) => setForm({ ...form, allowedPosCount: Number(e.target.value) })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all font-bold"
                >
                  <option value={1}>1 POS Terminal (Select any 1 of Restaurant, Cafe, Bar)</option>
                  <option value={2}>2 POS Terminals (Select any 2 of Restaurant, Cafe, Bar)</option>
                  <option value={3}>3 POS Terminals (Access all Restaurant, Cafe, Bar)</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1 font-medium">Limits the number of POS terminals properties under this plan can simultaneously activate.</p>
              </div>

              {/* Properties limit selection */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Allowed Properties Limit *
                </label>
                <input
                  type="number" min={1}
                  value={form.allowedPropertyCount}
                  onChange={(e) => setForm({ ...form, allowedPropertyCount: Math.max(1, Number(e.target.value)) })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all font-bold"
                />
                <p className="text-[10px] text-slate-400 mt-1 font-medium">Limits the number of business properties/venues this organization can create under this plan.</p>
              </div>

              {/* Hotel (HMS) Properties limit */}
              <div className="p-4 rounded-2xl border-2 border-dashed border-amber-200 dark:border-amber-900/40 bg-amber-50/30 dark:bg-amber-950/10">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">🏨</span>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Hotel (HMS) Properties Limit
                    </label>
                    <p className="text-[10px] text-slate-400 font-medium">0 = Hotel module NOT included. Set ≥ 1 to allow hotel properties.</p>
                  </div>
                </div>
                <input
                  type="number" min={0}
                  value={form.allowedHotelCount}
                  onChange={(e) => setForm({ ...form, allowedHotelCount: Math.max(0, Number(e.target.value)) })}
                  className="w-full px-4 py-3 rounded-xl border border-amber-200 dark:border-amber-800/50 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all font-bold"
                  placeholder="0 = Not included"
                />
                {form.allowedHotelCount > 0 && !form.features.includes('HMS') && (
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-2 font-bold">
                    ⚠️ HMS feature bhi ON karo — Step 2 mein "Hotel Management" toggle karo
                  </p>
                )}
                {form.allowedHotelCount > 0 && form.features.includes('HMS') && (
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-2 font-bold">
                    ✅ HMS feature active hai — {form.allowedHotelCount} hotel{form.allowedHotelCount !== 1 ? 's' : ''} allowed
                  </p>
                )}
              </div>

              {/* Active toggle */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Active Status</p>
                  <p className="text-xs text-slate-400 mt-0.5">Inactive packages cannot be assigned to organizations</p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, isActive: !form.isActive })}
                  className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${form.isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${form.isActive ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 1: Module Access ──────────────────────────── */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <LayoutGrid size={12} /> Module Access
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-pos-primary">{form.features.length} / {ALL_FEATURES.length}</span>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, features: form.features.length === ALL_FEATURES.length ? [] : ALL_FEATURES.map(f => f.key) })}
                    className="text-[10px] font-black px-2 py-1 rounded-lg border border-pos-primary/30 text-pos-primary hover:bg-pos-primary/10 transition-all"
                  >
                    {form.features.length === ALL_FEATURES.length ? 'Clear All' : 'Select All'}
                  </button>
                </div>
              </div>

              {FEATURE_GROUPS.map((group) => {
                const groupFeats = ALL_FEATURES.filter((f) => f.group === group);
                const selectedCount = groupFeats.filter((f) => form.features.includes(f.key)).length;
                const allSelected = selectedCount === groupFeats.length;

                return (
                  <div key={group}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{group}</span>
                        {selectedCount > 0 && (
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-pos-primary/10 text-pos-primary">
                            {selectedCount}/{groupFeats.length}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleGroupFeatures(group)}
                        className="text-[9px] font-black px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:border-pos-primary/40 hover:text-pos-primary transition-all"
                      >
                        {allSelected ? 'Deselect' : 'Select'} All
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {groupFeats.map((feat) => {
                        const checked = form.features.includes(feat.key);
                        return (
                          <button
                            key={feat.key}
                            type="button"
                            onClick={() => toggleFeature(feat.key)}
                            className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 text-left transition-all duration-200 ${
                              checked
                                ? 'bg-pos-primary/10 border-pos-primary dark:bg-pos-primary/20 dark:border-pos-primary/60'
                                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800/50'
                            }`}
                          >
                            <span className="text-xl leading-none">{feat.icon}</span>
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-bold truncate ${checked ? 'text-pos-primary dark:text-pos-primary-light' : 'text-slate-700 dark:text-slate-300'}`}>
                                {feat.label}
                              </p>
                              <p className="text-[10px] text-slate-400 truncate">{feat.description}</p>
                            </div>
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${checked ? 'bg-pos-primary border-pos-primary' : 'border-slate-300 dark:border-slate-600'}`}>
                              {checked && <div className="w-2 h-2 rounded-full bg-white" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── STEP 2: Permissions ───────────────────────────── */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <ShieldCheck size={12} /> Granular Permissions
                </p>
                <span className="text-xs font-bold text-pos-primary">{form.permissions.length} granted</span>
              </div>

              {MODULE_GROUPS.map((group) => {
                const groupMods = ALL_MODULES.filter((m) => m.group === group && form.features.includes(m.feature));
                if (groupMods.length === 0) return null;
                const totalPerms = groupMods.reduce((s, m) => s + m.actions.length, 0);
                const grantedPerms = groupMods.reduce(
                  (s, m) => s + m.actions.filter((a) => form.permissions.some((p) => p.module === m.module && p.action === a)).length,
                  0
                );
                const isGroupExpanded = expandedModuleGroup === group;

                return (
                  <div key={group} className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                    {/* Group Header */}
                    <button
                      type="button"
                      onClick={() => setExpandedModuleGroup(isGroupExpanded ? null : group)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          onClick={(e) => { e.stopPropagation(); toggleGroupModules(group); }}
                          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center cursor-pointer transition-colors ${
                            grantedPerms === totalPerms ? 'bg-indigo-500 border-indigo-500' : grantedPerms > 0 ? 'bg-indigo-200 border-indigo-400' : 'border-slate-300 dark:border-slate-600'
                          }`}
                        >
                          {grantedPerms === totalPerms && <div className="w-2.5 h-0.5 bg-white rounded" />}
                          {grantedPerms > 0 && grantedPerms < totalPerms && <div className="w-2 h-0.5 rounded bg-indigo-600" />}
                        </div>
                        <span className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-wide">{group}</span>
                        {grantedPerms > 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400">
                            {grantedPerms}/{totalPerms}
                          </span>
                        )}
                      </div>
                      {isGroupExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                    </button>

                    {/* Modules inside group */}
                    {isGroupExpanded && (
                      <div className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                        {groupMods.map((mod) => {
                          const modPerms = form.permissions.filter((p) => p.module === mod.module);
                          const allChecked = mod.actions.every((a) => modPerms.some((p) => p.action === a));
                          const isModExpanded = expandedModule === mod.module;

                          return (
                            <div key={mod.module}>
                              <button
                                type="button"
                                onClick={() => setExpandedModule(isModExpanded ? null : mod.module)}
                                className="w-full flex items-center justify-between px-5 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <div
                                    onClick={(e) => { e.stopPropagation(); toggleModuleAll(mod); }}
                                    className={`w-4 h-4 rounded border-2 flex items-center justify-center cursor-pointer transition-colors ${
                                      allChecked ? 'bg-indigo-500 border-indigo-500' : modPerms.length > 0 ? 'bg-indigo-200 border-indigo-400' : 'border-slate-300 dark:border-slate-600'
                                    }`}
                                  >
                                    {allChecked && <div className="w-2 h-0.5 bg-white rounded" />}
                                    {!allChecked && modPerms.length > 0 && <div className="w-1.5 h-0.5 rounded bg-indigo-600" />}
                                  </div>
                                  <span className="text-sm font-bold text-slate-600 dark:text-slate-400 capitalize">{mod.module}</span>
                                  {modPerms.length > 0 && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-900/30 text-rose-500">
                                      {modPerms.length}/{mod.actions.length}
                                    </span>
                                  )}
                                </div>
                                {isModExpanded ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                              </button>
                              {isModExpanded && (
                                <div className="px-12 py-2.5 flex flex-wrap gap-2 bg-slate-50/50 dark:bg-slate-800/30">
                                  {mod.actions.map((action) => {
                                    const checked = form.permissions.some((p) => p.module === mod.module && p.action === action);
                                    return (
                                      <button
                                        key={action} type="button"
                                        onClick={() => togglePermission(mod.module, action)}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all ${
                                          checked
                                            ? 'text-white bg-pos-primary border-pos-primary'
                                            : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-pos-primary/40'
                                        }`}
                                      >
                                        {action}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── STEP 3: Review ────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-5">
              {/* Package preview */}
              <div
                className="p-5 rounded-2xl border-2"
                style={{ borderColor: `${form.color}40`, background: `${form.color}08` }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${form.color}dd, ${form.color}88)` }}
                  >
                    <Boxes className="text-white" size={18} />
                  </div>
                  <div>
                    <p className="font-black text-slate-900 dark:text-white">{form.name || 'Unnamed Package'}</p>
                    <p className="text-xs text-slate-400">{form.description || 'No description'}</p>
                  </div>
                  <div className="ml-auto">
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${form.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {form.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-white/60 dark:bg-slate-800/60 rounded-xl p-3 text-center">
                    <p className="text-lg font-black text-indigo-600">${form.priceUSD}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">USD</p>
                  </div>
                  <div className="bg-white/60 dark:bg-slate-800/60 rounded-xl p-3 text-center">
                    <p className="text-lg font-black text-emerald-600">₹{form.priceINR}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">INR</p>
                  </div>
                  <div className="bg-white/60 dark:bg-slate-800/60 rounded-xl p-3 text-center">
                    <p className="text-lg font-black text-amber-600">{form.discountPercent}%</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Discount</p>
                  </div>
                </div>
              </div>

              {/* Selected Modules */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
                  <p className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <LayoutGrid size={12} /> Module Access
                  </p>
                  <span className="text-xs font-bold text-pos-primary">{form.features.length} selected</span>
                </div>
                <div className="p-4">
                  {form.features.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No modules selected</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {form.features.map((f) => {
                        const def = ALL_FEATURES.find((x) => x.key === f);
                        return (
                          <span
                            key={f}
                            className="px-2.5 py-1 rounded-full text-[11px] font-bold border"
                            style={{ background: `${form.color}15`, borderColor: `${form.color}40`, color: form.color }}
                          >
                            {def?.icon} {def?.label || f}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Permissions Summary */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
                  <p className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <ShieldCheck size={12} /> Permissions
                  </p>
                  <span className="text-xs font-bold text-violet-500">{form.permissions.length} granted</span>
                </div>
                <div className="p-4">
                  {form.permissions.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No permissions granted</p>
                  ) : (
                    <div className="space-y-2">
                      {MODULE_GROUPS.map((group) => {
                        const groupPerms = form.permissions.filter((p) =>
                          ALL_MODULES.filter((m) => m.group === group && form.features.includes(m.feature)).some((m) => m.module === p.module)
                        );
                        if (groupPerms.length === 0) return null;
                        return (
                          <div key={group}>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{group}</p>
                            <div className="flex flex-wrap gap-1.5">
                              {groupPerms.map((p) => (
                                <span key={`${p.module}-${p.action}`} className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-900/40">
                                  {p.module}:{p.action}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Nav */}
        <div className="shrink-0 px-8 py-5 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex gap-3">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            >
              <ArrowLeft size={14} /> Back
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            >
              Cancel
            </button>
          )}

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              disabled={!canNext}
              onClick={() => setStep(step + 1)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
              style={{ backgroundColor: form.color, boxShadow: `0 4px 14px ${form.color}40` }}
            >
              Next <ArrowRight size={14} />
            </button>
          ) : (
            <button
              type="button"
              disabled={saving}
              onClick={handleSubmit}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white shadow-lg transition-all disabled:opacity-60"
              style={{ backgroundColor: form.color, boxShadow: `0 4px 14px ${form.color}40` }}
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save size={14} />
              )}
              {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Package'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Assign Package Modal ─────────────────────────────────────────────────────
function AssignPackageModal({
  packages,
  onClose,
}: {
  packages: Pkg[];
  onClose: () => void;
}) {
  const [orgs, setOrgs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/super-admin/organizations')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setOrgs(d.data);
        setLoading(false);
      });
  }, []);

  const assignPackage = async (orgId: string, pkgId: string | null, startDate?: string | null, endDate?: string | null) => {
    setAssigning(orgId);
    await fetch(`/api/super-admin/organizations/${orgId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        packageId: pkgId,
        packageStartDate: startDate,
        packageEndDate: endDate,
      }),
    });
    setAssigning(null);
    const d = await fetch('/api/super-admin/organizations').then((r) => r.json());
    if (d.success) setOrgs(d.data);
  };

  const getExpiryStatus = (dateStr?: string) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return { label: 'Expired', color: 'text-red-500 bg-red-50 dark:bg-red-900/20' };
    if (days === 0) return { label: 'Expires Today', color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' };
    if (days < 7) return { label: `Expires in ${days}d`, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' };
    return { label: `${days}d left`, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' };
  };

  const setRelativeExpiry = (org: any, months: number) => {
    const start = org.packageStartDate ? new Date(org.packageStartDate) : new Date();
    const end = new Date(start);
    end.setMonth(end.getMonth() + months);
    assignPackage(org.id, org.packageId, start.toISOString(), end.toISOString());
  };

  const filtered = orgs.filter((o) => o.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="px-8 pt-8 pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Assign Packages & Subscriptions</h2>
              <p className="text-xs text-slate-400 mt-0.5">Manage access duration for each organization</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500">
              <X size={18} />
            </button>
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search organizations..."
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pos-primary/30"
          />
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <p className="text-center text-slate-400 py-8 text-sm italic">Loading organizations...</p>
          ) : filtered.length === 0 ? (
            <p className="text-center text-slate-400 py-8 text-sm">No organizations found.</p>
          ) : (
            filtered.map((org: any) => {
              const packageId = org.packageId || '';
              const startDate = org.packageStartDate ? new Date(org.packageStartDate).toISOString().split('T')[0] : '';
              const endDate = org.packageEndDate ? new Date(org.packageEndDate).toISOString().split('T')[0] : '';
              const status = getExpiryStatus(org.packageEndDate);

              return (
                <div key={org.id} className="p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/40 shadow-sm space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center shrink-0">
                        <Building2 size={18} style={{ color: '#e8a0a0' }} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{org.name}</p>
                        {status && (
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full mt-1 inline-block ${status.color}`}>
                            {status.label}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="relative">
                      <select
                        value={packageId}
                        onChange={(e) => assignPackage(org.id, e.target.value || null, startDate, endDate)}
                        disabled={assigning === org.id}
                        className="pl-3 pr-8 py-2.5 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-black text-slate-700 dark:text-slate-200 focus:outline-none"
                      >
                        <option value="">No Package</option>
                        {packages.filter((p) => p.isActive).map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      {assigning === org.id && (
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#e8a0a0 transparent transparent transparent' }} />
                      )}
                    </div>
                  </div>

                  {packageId && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-50 dark:border-slate-800/50">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                          <Calendar size={10} /> Start Date
                        </label>
                        <input
                          type="date" value={startDate}
                          onChange={(e) => assignPackage(org.id, packageId, e.target.value, endDate)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                          <CalendarX size={10} /> Expiry Date
                        </label>
                        <div className="space-y-2">
                          <input
                            type="date" value={endDate}
                            onChange={(e) => assignPackage(org.id, packageId, startDate, e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                          />
                          <div className="flex gap-1.5">
                            {[{ l: '+1M', m: 1 }, { l: '+3M', m: 3 }, { l: '+6M', m: 6 }, { l: '+1Y', m: 12 }].map((btn) => (
                              <button
                                key={btn.l}
                                onClick={() => setRelativeExpiry(org, btn.m)}
                                className="flex-1 py-1 rounded-lg bg-rose-50 dark:bg-rose-900/30 text-[10px] font-black transition-all"
                                style={{ color: '#e8a0a0' }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e8a0a0'; e.currentTarget.style.color = 'white'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = '#e8a0a0'; }}
                              >
                                {btn.l}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PackagesPage() {
  const [packages, setPackages] = useState<Pkg[]>([]);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState<Pkg | null>(null);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [previewPkg, setPreviewPkg] = useState<Pkg | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchPackages = useCallback(async () => {
    setLoading(true);
    setUnauthorized(false);
    const res = await fetch('/api/admin/packages').then((r) => r.json());
    if (res.success) {
      setPackages(res.data);
    } else if (res.error === 'Unauthorized') {
      setUnauthorized(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  // ── Unauthorized Screen ───────────────────────────────────────────────────────
  if (!loading && unauthorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <div className="w-24 h-24 rounded-3xl bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center mb-6 shadow-xl">
          <ShieldCheck size={40} className="text-rose-400" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Access Denied</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mb-6">
          Aapke paas yeh page dekhne ki permission nahi hai.<br />
          <strong className="text-slate-700 dark:text-slate-300">Super Admin</strong> account se login karein.
        </p>
        <a href="/login"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-white text-sm font-bold shadow-lg"
          style={{ backgroundColor: '#e8a0a0', boxShadow: '0 4px 14px #e8a0a040' }}>
          Login as Super Admin
        </a>
      </div>
    );
  }

  const handleSave = async (form: ReturnType<typeof emptyForm>) => {
    const isEdit = !!editingPkg;
    const res = await fetch('/api/admin/packages', {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(isEdit ? { id: editingPkg!.id, ...form } : form),
    }).then((r) => r.json());

    if (res.success) {
      setIsFormOpen(false);
      setEditingPkg(null);
      showToast(isEdit ? 'Package updated successfully!' : 'Package created successfully!');
      fetchPackages();
    } else {
      showToast(res.error || 'Something went wrong', 'error');
      throw new Error(res.error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this package? It will be unassigned from all organizations.')) return;
    const res = await fetch(`/api/admin/packages?id=${id}`, { method: 'DELETE' }).then((r) => r.json());
    if (res.success) {
      showToast('Package deleted.');
      fetchPackages();
    } else {
      showToast(res.error || 'Failed to delete', 'error');
    }
  };

  const handleToggleActive = async (id: string, value: boolean) => {
    const pkg = packages.find((p) => p.id === id);
    if (!pkg) return;
    await fetch('/api/admin/packages', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        name: pkg.name,
        description: pkg.description,
        discountPercent: pkg.discountPercent,
        priceUSD: pkg.priceUSD,
        priceINR: pkg.priceINR,
        color: pkg.color,
        isActive: value,
        features: pkg.features.map((f) => f.feature),
        permissions: pkg.permissions.map((p) => ({ module: p.module, action: p.action })),
      }),
    });
    showToast(value ? 'Package activated.' : 'Package deactivated.');
    fetchPackages();
  };

  const openEdit = (pkg: Pkg) => {
    setEditingPkg(pkg);
    setIsFormOpen(true);
  };

  const activeCount = packages.filter((p) => p.isActive).length;
  const totalOrgs = packages.reduce((sum, p) => sum + p._count.organizations, 0);
  const filteredPackages = packages.filter((p) =>
    filter === 'all' ? true : filter === 'active' ? p.isActive : !p.isActive
  );

  return (
    <div className="relative min-h-screen space-y-8">
      {/* Background glows */}
      <div className="absolute top-[-5%] left-[-5%] w-[35%] h-[35%] bg-rose-200/20 dark:bg-rose-500/10 rounded-full blur-[80px] -z-10 pointer-events-none" />
      <div className="absolute bottom-[-5%] right-[-5%] w-[35%] h-[35%] bg-indigo-200/20 dark:bg-indigo-500/10 rounded-full blur-[80px] -z-10 pointer-events-none" />

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-bold animate-slide-in-right ${
          toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-1 w-8 rounded-full" style={{ backgroundColor: '#e8a0a0' }} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: '#e8a0a0' }}>Subscription Control</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Packages
            <span className="ml-3 text-xs font-bold bg-rose-50 dark:bg-rose-900/30 px-3 py-1 rounded-full tracking-widest border border-rose-100 dark:border-rose-800" style={{ color: '#e8a0a0' }}>
              {packages.length} total
            </span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-2 max-w-lg">
            Create and manage subscription packages with {ALL_FEATURES.length} modules and {ALL_MODULES.length} permission groups.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAssignOpen(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl border bg-rose-50 dark:bg-rose-900/30 hover:opacity-80 transition-all text-sm font-bold"
            style={{ borderColor: '#e8a0a080', color: '#e8a0a0' }}
          >
            <Building2 size={15} /> Assign to Orgs
          </button>
          <button
            onClick={() => { setEditingPkg(null); setIsFormOpen(true); }}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl text-white text-sm font-bold shadow-lg transition-all"
            style={{ backgroundColor: '#e8a0a0', boxShadow: '0 4px 14px #e8a0a040' }}
          >
            <Plus size={15} /> New Package
          </button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Packages', value: packages.length, icon: Boxes, color: 'from-rose-400 to-rose-500' },
          { label: 'Active Packages', value: activeCount, icon: Zap, color: 'from-emerald-500 to-teal-600' },
          { label: 'Orgs on Plans', value: totalOrgs, icon: Building2, color: 'from-indigo-400 to-indigo-600' },
          {
            label: 'Avg. Discount',
            value: packages.length ? `${(packages.reduce((s, p) => s + p.discountPercent, 0) / packages.length).toFixed(1)}%` : '0%',
            icon: Percent,
            color: 'from-amber-500 to-orange-600',
          },
        ].map((s, i) => (
          <div key={i} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shrink-0 shadow-md`}>
              <s.icon size={18} className="text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">{s.value}</p>
              <p className="text-[10px] font-bold text-slate-400 tracking-wider">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Info strip */}
      <div className="flex flex-wrap items-center gap-3 p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/30">
        <div className="flex items-center gap-2">
          <LayoutGrid size={14} className="text-indigo-500" />
          <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400">{ALL_FEATURES.length} Feature Modules</span>
        </div>
        <div className="w-1 h-1 rounded-full bg-indigo-300" />
        <div className="flex items-center gap-2">
          <ShieldCheck size={14} className="text-indigo-500" />
          <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400">{ALL_MODULES.length} Permission Modules</span>
        </div>
        <div className="w-1 h-1 rounded-full bg-indigo-300" />
        <div className="flex items-center gap-2">
          <Eye size={14} className="text-indigo-500" />
          <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400">
            {ALL_MODULES.reduce((s, m) => s + m.actions.length, 0)} Total Actions
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(['all', 'active', 'inactive'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              filter === f
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300'
            }`}
          >
            {f} ({f === 'all' ? packages.length : f === 'active' ? activeCount : packages.length - activeCount})
          </button>
        ))}
      </div>

      {/* Package grid */}
      {loading ? (
        <div className="flex items-center justify-center py-32">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-rose-100 dark:border-rose-900 rounded-full" />
            <div className="absolute inset-0 border-4 rounded-full border-t-transparent animate-spin" style={{ borderColor: '#e8a0a0 transparent transparent transparent' }} />
          </div>
        </div>
      ) : filteredPackages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <div className="w-24 h-24 rounded-3xl bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center mb-6 shadow-xl">
            <Sparkles size={40} style={{ color: '#e8a0a0' }} />
          </div>
          <h3 className="text-xl font-black text-slate-700 dark:text-slate-300">
            {filter === 'all' ? 'No Packages Yet' : `No ${filter} packages`}
          </h3>
          <p className="text-slate-400 text-sm mt-2 mb-8 max-w-sm">
            {filter === 'all'
              ? 'Create your first package to start controlling what each organization can access.'
              : `Switch to "all" to see all packages.`}
          </p>
          {filter === 'all' && (
            <button
              onClick={() => { setEditingPkg(null); setIsFormOpen(true); }}
              className="flex items-center gap-2 px-6 py-3.5 rounded-2xl text-white text-sm font-bold shadow-lg transition-all"
              style={{ backgroundColor: '#e8a0a0', boxShadow: '0 4px 14px #e8a0a040' }}
            >
              <Plus size={15} /> Create First Package
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredPackages.map((pkg) => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              onEdit={openEdit}
              onDelete={handleDelete}
              onToggleActive={handleToggleActive}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <PackageFormModal
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setEditingPkg(null); }}
        onSave={handleSave}
        editing={editingPkg}
      />
      {isAssignOpen && (
        <AssignPackageModal
          packages={packages}
          onClose={() => { setIsAssignOpen(false); fetchPackages(); }}
        />
      )}
    </div>
  );
}
