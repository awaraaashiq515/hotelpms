'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  DoorOpen, Calendar, PlusCircle, Bed, Receipt, Moon, LayoutGrid, ChefHat,
  BrushIcon, Wrench, Sparkles, TrendingUp, BarChart3, Users, Settings,
  Monitor, ShoppingCart, Bike, IndianRupee, Package, Brain, Wifi,
  Star, Check, Plus, X, Search, RotateCcw, Pin, ExternalLink,
  SlidersHorizontal, ChevronRight, Handshake, ScrollText, Shirt, Cpu,
  MapPin, Crown, Globe, Banknote, BookOpen, UserCheck, Navigation,
  Radio, Wine, Coffee, History, ClipboardList, CalendarDays, Store,
  Eye, Bell, Printer, Download, Trash2, FileText, Tablet, UtensilsCrossed, Layers
} from 'lucide-react';

export interface ShortcutItem {
  id: string;
  name: string;
  href: string;
  category: string;
  icon: React.ComponentType<any>;
  color: string; // e.g. 'sky', 'indigo', 'amber', 'rose', 'emerald', 'orange', 'violet'
  bgGlow: string;
  borderColor: string;
  badge?: string;
  description?: string;
}

export const ALL_SHORTCUTS_CATALOG: ShortcutItem[] = [
  // Front Office & Desk
  {
    id: '/hotel/checkin',
    name: 'Check-In Terminal',
    href: '/hotel/checkin',
    category: 'Front Office',
    icon: DoorOpen,
    color: 'text-sky-400',
    bgGlow: 'bg-sky-500/15',
    borderColor: 'border-sky-500/30 hover:border-sky-400',
    badge: 'Front Desk',
    description: 'Fast guest arrival & room assignment',
  },
  {
    id: '/hotel/checkout',
    name: 'Check-Out Terminal',
    href: '/hotel/checkout',
    category: 'Front Office',
    icon: DoorOpen,
    color: 'text-rose-400',
    bgGlow: 'bg-rose-500/15',
    borderColor: 'border-rose-500/30 hover:border-rose-400',
    badge: 'Billing',
    description: 'Guest departure & final folio settlement',
  },
  {
    id: '/hotel/bookings',
    name: 'Bookings Manager',
    href: '/hotel/bookings',
    category: 'Front Office',
    icon: PlusCircle,
    color: 'text-indigo-400',
    bgGlow: 'bg-indigo-500/15',
    borderColor: 'border-indigo-500/30 hover:border-indigo-400',
    badge: 'Reservations',
    description: 'All guest reservations & new booking',
  },
  {
    id: '/hotel/calendar',
    name: 'Room Availability Matrix',
    href: '/hotel/calendar',
    category: 'Front Office',
    icon: Calendar,
    color: 'text-sky-400',
    bgGlow: 'bg-sky-500/15',
    borderColor: 'border-sky-500/30 hover:border-sky-400',
    badge: 'Live Grid',
    description: 'Timeline room grid & vacant slots',
  },
  {
    id: '/hotel/operations-dashboard',
    name: 'Operations Dashboard',
    href: '/hotel/operations-dashboard',
    category: 'Front Office',
    icon: LayoutGrid,
    color: 'text-blue-400',
    bgGlow: 'bg-blue-500/15',
    borderColor: 'border-blue-500/30 hover:border-blue-400',
    description: 'Daily KPI metrics, flight & arrivals radar',
  },
  {
    id: '/hotel/agent-bookings',
    name: 'Agent Bookings',
    href: '/hotel/agent-bookings',
    category: 'Front Office',
    icon: Handshake,
    color: 'text-cyan-400',
    bgGlow: 'bg-cyan-500/15',
    borderColor: 'border-cyan-500/30 hover:border-cyan-400',
    description: 'Travel agents & OTA reservations',
  },
  {
    id: '/hotel/email-bookings',
    name: 'Email Bookings AI',
    href: '/hotel/email-bookings',
    category: 'Front Office',
    icon: ScrollText,
    color: 'text-indigo-400',
    bgGlow: 'bg-indigo-500/15',
    borderColor: 'border-indigo-500/30 hover:border-indigo-400',
    description: 'Email parser & automated reservation entries',
  },

  // Rooms & Housekeeping
  {
    id: '/hotel/rooms',
    name: 'Rooms & Types Registry',
    href: '/hotel/rooms',
    category: 'Rooms & HK',
    icon: Bed,
    color: 'text-violet-400',
    bgGlow: 'bg-violet-500/15',
    borderColor: 'border-violet-500/30 hover:border-violet-400',
    badge: 'Rooms',
    description: 'Room inventory, pricing & statuses',
  },
  {
    id: '/hotel/housekeeping',
    name: 'Housekeeping Console',
    href: '/hotel/housekeeping',
    category: 'Rooms & HK',
    icon: BrushIcon,
    color: 'text-emerald-400',
    bgGlow: 'bg-emerald-500/15',
    borderColor: 'border-emerald-500/30 hover:border-emerald-400',
    badge: 'Cleaning',
    description: 'Room cleaning roster & dirty/clean status',
  },
  {
    id: '/hotel/maintenance',
    name: 'Maintenance & Repairs',
    href: '/hotel/maintenance',
    category: 'Rooms & HK',
    icon: Wrench,
    color: 'text-amber-400',
    bgGlow: 'bg-amber-500/15',
    borderColor: 'border-amber-500/30 hover:border-amber-400',
    description: 'Work tickets, room issues & repairs',
  },
  {
    id: '/hotel/lost-found',
    name: 'Lost & Found',
    href: '/hotel/lost-found',
    category: 'Rooms & HK',
    icon: MapPin,
    color: 'text-rose-400',
    bgGlow: 'bg-rose-500/15',
    borderColor: 'border-rose-500/30 hover:border-rose-400',
    description: 'Guest forgotten items log & tracking',
  },
  {
    id: '/hotel/laundry',
    name: 'Laundry Management',
    href: '/hotel/laundry',
    category: 'Rooms & HK',
    icon: Shirt,
    color: 'text-teal-400',
    bgGlow: 'bg-teal-500/15',
    borderColor: 'border-teal-500/30 hover:border-teal-400',
    description: 'Linen inventory & guest laundry billing',
  },

  // Finance & Billing
  {
    id: '/hotel/billing',
    name: 'Folios & Billing',
    href: '/hotel/billing',
    category: 'Finance',
    icon: Receipt,
    color: 'text-amber-400',
    bgGlow: 'bg-amber-500/15',
    borderColor: 'border-amber-500/30 hover:border-amber-400',
    badge: 'Finance',
    description: 'Guest invoices, room folios & payments',
  },
  {
    id: '/hotel/night-audit',
    name: 'Night Audit Console',
    href: '/hotel/night-audit',
    category: 'Finance',
    icon: Moon,
    color: 'text-indigo-400',
    bgGlow: 'bg-indigo-500/15',
    borderColor: 'border-indigo-500/30 hover:border-indigo-400',
    badge: 'Audit',
    description: 'Daily close, room charges rollover & report',
  },
  {
    id: '/hotel/invoices',
    name: 'Invoices Registry',
    href: '/hotel/invoices',
    category: 'Finance',
    icon: FileText,
    color: 'text-amber-300',
    bgGlow: 'bg-amber-500/15',
    borderColor: 'border-amber-500/30 hover:border-amber-400',
    description: 'GST tax invoices & print receipts',
  },
  {
    id: '/hotel/expenses',
    name: 'Expenses Controller',
    href: '/hotel/expenses',
    category: 'Finance',
    icon: Banknote,
    color: 'text-rose-400',
    bgGlow: 'bg-rose-500/15',
    borderColor: 'border-rose-500/30 hover:border-rose-400',
    description: 'Petty cash & operational hotel expenses',
  },
  {
    id: '/hotel/inventory',
    name: 'Inventory & Stock',
    href: '/hotel/inventory',
    category: 'Finance',
    icon: Package,
    color: 'text-sky-400',
    bgGlow: 'bg-sky-500/15',
    borderColor: 'border-sky-500/30 hover:border-sky-400',
    description: 'Amenity stock, mini-bar & supplies',
  },
  {
    id: '/hotel/accounts',
    name: 'Accounting Hub',
    href: '/hotel/accounts',
    category: 'Finance',
    icon: BookOpen,
    color: 'text-amber-400',
    bgGlow: 'bg-amber-500/15',
    borderColor: 'border-amber-500/30 hover:border-amber-400',
    description: 'Ledger, Day Book & financial summaries',
  },

  // Restaurant & POS
  {
    id: '/hotel/pos/billing',
    name: 'POS Billing Terminal',
    href: '/hotel/pos/billing',
    category: 'POS & Dining',
    icon: Monitor,
    color: 'text-orange-400',
    bgGlow: 'bg-orange-500/15',
    borderColor: 'border-orange-500/30 hover:border-orange-400',
    badge: 'Fast POS',
    description: 'Quick restaurant dining & counter orders',
  },
  {
    id: '/hotel/pos/tables',
    name: 'Table Layout & Floors',
    href: '/hotel/pos/tables',
    category: 'POS & Dining',
    icon: LayoutGrid,
    color: 'text-amber-400',
    bgGlow: 'bg-amber-500/15',
    borderColor: 'border-amber-500/30 hover:border-amber-400',
    badge: 'Floor',
    description: 'Seating plan, live occupied tables & orders',
  },
  {
    id: '/hotel/pos/kitchen-display',
    name: 'Kitchen Display (KDS)',
    href: '/hotel/pos/kitchen-display',
    category: 'POS & Dining',
    icon: ChefHat,
    color: 'text-rose-400',
    bgGlow: 'bg-rose-500/15',
    borderColor: 'border-rose-500/30 hover:border-rose-400',
    badge: 'Chef',
    description: 'Live chef orders queue & preparation timer',
  },
  {
    id: '/hotel/pos/room-orders',
    name: 'Room Orders (POS)',
    href: '/hotel/pos/room-orders',
    category: 'POS & Dining',
    icon: Bed,
    color: 'text-indigo-400',
    bgGlow: 'bg-indigo-500/15',
    borderColor: 'border-indigo-500/30 hover:border-indigo-400',
    badge: 'Room Svc',
    description: 'Direct room service ordering & folio bill',
  },
  {
    id: '/hotel/daily-menus',
    name: "Today's Buffet Menus",
    href: '/hotel/daily-menus',
    category: 'POS & Dining',
    icon: UtensilsCrossed,
    color: 'text-orange-400',
    bgGlow: 'bg-orange-500/15',
    borderColor: 'border-orange-500/30 hover:border-orange-400',
    badge: 'Buffet',
    description: 'Breakfast, Lunch & Dinner daily spreads',
  },
  {
    id: '/hotel/pos/kots',
    name: 'KOTs List',
    href: '/hotel/pos/kots',
    category: 'POS & Dining',
    icon: ClipboardList,
    color: 'text-rose-400',
    bgGlow: 'bg-rose-500/15',
    borderColor: 'border-rose-500/30 hover:border-rose-400',
    description: 'Kitchen order tokens and statuses',
  },
  {
    id: '/hotel/pos/day-closing',
    name: 'POS Day Closing',
    href: '/hotel/pos/day-closing',
    category: 'POS & Dining',
    icon: History,
    color: 'text-emerald-400',
    bgGlow: 'bg-emerald-500/15',
    borderColor: 'border-emerald-500/30 hover:border-emerald-400',
    description: 'POS cash register & shift tally',
  },
  {
    id: '/hotel/pos/delivery',
    name: 'Delivery Dispatch Hub',
    href: '/hotel/pos/delivery',
    category: 'POS & Dining',
    icon: Bike,
    color: 'text-emerald-400',
    bgGlow: 'bg-emerald-500/15',
    borderColor: 'border-emerald-500/30 hover:border-emerald-400',
    description: 'Online delivery orders & parcel dispatch',
  },

  // Hospitality & Guests
  {
    id: '/hotel/crm',
    name: 'Guest CRM & VIPs',
    href: '/hotel/crm',
    category: 'Hospitality',
    icon: Users,
    color: 'text-rose-400',
    bgGlow: 'bg-rose-500/15',
    borderColor: 'border-rose-500/30 hover:border-rose-400',
    description: 'Guest preferences, VIP records & stay history',
  },
  {
    id: '/hotel/guests',
    name: 'Guest Directory',
    href: '/hotel/guests',
    category: 'Hospitality',
    icon: Users,
    color: 'text-sky-400',
    bgGlow: 'bg-sky-500/15',
    borderColor: 'border-sky-500/30 hover:border-sky-400',
    description: 'ID proof records, phone & search directory',
  },
  {
    id: '/hotel/spa',
    name: 'Spa & Wellness',
    href: '/hotel/spa',
    category: 'Hospitality',
    icon: Sparkles,
    color: 'text-pink-400',
    bgGlow: 'bg-pink-500/15',
    borderColor: 'border-pink-500/30 hover:border-pink-400',
    description: 'Spa appointments, massage therapists & billing',
  },
  {
    id: '/hotel/banquet',
    name: 'Banquet & Events',
    href: '/hotel/banquet',
    category: 'Hospitality',
    icon: Calendar,
    color: 'text-amber-400',
    bgGlow: 'bg-amber-500/15',
    borderColor: 'border-amber-500/30 hover:border-amber-400',
    description: 'Halls, weddings, conferences & catering',
  },

  // Staff & GPS
  {
    id: '/hotel/staff',
    name: 'Staff & Team Directory',
    href: '/hotel/staff',
    category: 'Staff & Ops',
    icon: Users,
    color: 'text-emerald-400',
    bgGlow: 'bg-emerald-500/15',
    borderColor: 'border-emerald-500/30 hover:border-emerald-400',
    description: 'Hotel employees, roles & shifts',
  },
  {
    id: '/hotel/staff/attendance',
    name: 'Staff Attendance Hub',
    href: '/hotel/staff/attendance',
    category: 'Staff & Ops',
    icon: UserCheck,
    color: 'text-teal-400',
    bgGlow: 'bg-teal-500/15',
    borderColor: 'border-teal-500/30 hover:border-teal-400',
    description: 'Biometric, selfie & GPS punch logs',
  },
  {
    id: '/hotel/staff/location',
    name: 'Live GPS Staff Tracking',
    href: '/hotel/staff/location',
    category: 'Staff & Ops',
    icon: Navigation,
    color: 'text-cyan-400',
    bgGlow: 'bg-cyan-500/15',
    borderColor: 'border-cyan-500/30 hover:border-cyan-400',
    description: 'Real-time on-duty staff map radar',
  },

  // Analytics & Reports
  {
    id: '/hotel/analytics',
    name: 'Analytics & BI Insights',
    href: '/hotel/analytics',
    category: 'Analytics',
    icon: BarChart3,
    color: 'text-emerald-400',
    bgGlow: 'bg-emerald-500/15',
    borderColor: 'border-emerald-500/30 hover:border-emerald-400',
    description: 'Revenue graphs, occupancy trends & ADR/RevPAR',
  },
  {
    id: '/hotel/reports',
    name: 'Operations Reports',
    href: '/hotel/reports',
    category: 'Analytics',
    icon: ScrollText,
    color: 'text-indigo-400',
    bgGlow: 'bg-indigo-500/15',
    borderColor: 'border-indigo-500/30 hover:border-indigo-400',
    description: 'Daily collection, tax & guest summary reports',
  },

  // Settings & System
  {
    id: '/hotel/settings',
    name: 'Hotel Settings',
    href: '/hotel/settings',
    category: 'Settings',
    icon: Settings,
    color: 'text-slate-400',
    bgGlow: 'bg-slate-700/30',
    borderColor: 'border-slate-700 hover:border-slate-500',
    description: 'Tax GST rates, hotel profile & general config',
  },
  {
    id: '/hotel/settings/printers',
    name: 'Thermal Printers Setup',
    href: '/hotel/settings/printers',
    category: 'Settings',
    icon: Printer,
    color: 'text-slate-400',
    bgGlow: 'bg-slate-700/30',
    borderColor: 'border-slate-700 hover:border-slate-500',
    description: 'Thermal receipt & KOT printer configuration',
  },
  {
    id: '/hotel/room-portal-admin',
    name: 'Room Tablet Admin',
    href: '/hotel/room-portal-admin',
    category: 'Settings',
    icon: Tablet,
    color: 'text-indigo-400',
    bgGlow: 'bg-indigo-500/15',
    borderColor: 'border-indigo-500/30 hover:border-indigo-400',
    description: 'Guest room tablet devices control',
  },
];

export const DEFAULT_SHORTCUT_IDS = [
  '/hotel/checkin',
  '/hotel/checkout',
  '/hotel/bookings',
  '/hotel/calendar',
  '/hotel/rooms',
  '/hotel/housekeeping',
  '/hotel/billing',
  '/hotel/night-audit',
];

const STORAGE_KEY = 'guestflow_hotel_daily_shortcuts';

interface DailyShortcutsSectionProps {
  propertyCode?: string;
}

export function DailyShortcutsSection({ propertyCode }: DailyShortcutsSectionProps) {
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [toastText, setToastText] = useState<string | null>(null);

  const storageKey = propertyCode ? `${STORAGE_KEY}_${propertyCode}` : STORAGE_KEY;

  // Load from localStorage
  useEffect(() => {
    setIsClient(true);
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPinnedIds(parsed);
          return;
        }
      }
      // If nothing saved, default to recommended set
      setPinnedIds(DEFAULT_SHORTCUT_IDS);
      localStorage.setItem(storageKey, JSON.stringify(DEFAULT_SHORTCUT_IDS));
    } catch {
      setPinnedIds(DEFAULT_SHORTCUT_IDS);
    }
  }, [storageKey]);

  // Persist to localStorage
  const savePinnedIds = (newIds: string[], showFeedback = false) => {
    setPinnedIds(newIds);
    try {
      localStorage.setItem(storageKey, JSON.stringify(newIds));
    } catch (e) {
      console.error('Failed to save daily shortcuts to localStorage', e);
    }
    if (showFeedback) {
      setToastText(`Updated: ${newIds.length} daily shortcuts saved`);
      setTimeout(() => setToastText(null), 3000);
    }
  };

  const togglePin = (id: string) => {
    let next: string[];
    if (pinnedIds.includes(id)) {
      next = pinnedIds.filter((p) => p !== id);
    } else {
      next = [...pinnedIds, id];
    }
    savePinnedIds(next, true);
  };

  const removePin = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = pinnedIds.filter((p) => p !== id);
    savePinnedIds(next, true);
  };

  const resetToDefaults = () => {
    savePinnedIds(DEFAULT_SHORTCUT_IDS, true);
  };

  const clearAll = () => {
    savePinnedIds([], true);
  };

  // Pinned items resolved in order
  const pinnedItems = useMemo(() => {
    const map = new Map(ALL_SHORTCUTS_CATALOG.map((item) => [item.id, item]));
    return pinnedIds.map((id) => map.get(id)).filter(Boolean) as ShortcutItem[];
  }, [pinnedIds]);

  // Categories list for modal filter
  const categories = useMemo(() => {
    const cats = Array.from(new Set(ALL_SHORTCUTS_CATALOG.map((i) => i.category)));
    return ['ALL', ...cats];
  }, []);

  // Filtered items in modal
  const modalCatalogItems = useMemo(() => {
    return ALL_SHORTCUTS_CATALOG.filter((item) => {
      const matchesCat = selectedCategory === 'ALL' || item.category === selectedCategory;
      const matchesSearch =
        !searchFilter.trim() ||
        item.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        item.category.toLowerCase().includes(searchFilter.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchFilter.toLowerCase()));
      return matchesCat && matchesSearch;
    });
  }, [selectedCategory, searchFilter]);

  if (!isClient) return null;

  return (
    <div className="mb-2.5">
      {/* ── SECTION HEADER ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2 px-1">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center shadow-md">
            <Star className="w-4 h-4 text-indigo-400 fill-indigo-400/40" />
          </div>
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-black uppercase tracking-wider text-white">
              Daily Shortcuts &amp; Quick Access
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {pinnedItems.length} Pinned
            </span>
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              · Direct 1-click access
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {pinnedItems.length > 0 && (
            <button
              type="button"
              onClick={() => setIsEditMode(!isEditMode)}
              className={`h-7 px-2.5 rounded-lg text-[10.5px] font-bold transition-all flex items-center gap-1 cursor-pointer border ${
                isEditMode
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                  : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
              title={isEditMode ? 'Done removing shortcuts' : 'Remove shortcuts directly'}
            >
              <span>{isEditMode ? '✓ Done' : '✕ Remove'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="h-7 px-3 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-[10.5px] font-bold shadow-md shadow-indigo-600/25 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <SlidersHorizontal size={12} />
            <span>Customize</span>
          </button>
        </div>
      </div>

      {/* Toast Alert */}
      {toastText && (
        <div className="mb-2 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold flex items-center gap-1.5 animate-fade-in w-fit">
          <span>✅</span>
          <span>{toastText}</span>
        </div>
      )}

      {/* ── SHORTCUTS TILES GRID ── */}
      {pinnedItems.length === 0 ? (
        <div className="p-5 rounded-xl bg-[#0a101d]/90 border border-dashed border-slate-800 text-center flex flex-col items-center justify-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Star size={18} className="stroke-[1.5]" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white">No Daily Pages Pinned Yet</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Choose the pages you use every day to keep them right here outside the department boxes.
            </p>
          </div>
          <div className="flex items-center gap-2 pt-0.5">
            <button
              type="button"
              onClick={resetToDefaults}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold transition-all shadow-md active:scale-95 cursor-pointer"
            >
              Restore Defaults
            </button>
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold transition-all cursor-pointer"
            >
              Pick Pages
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-2.5">
          {pinnedItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.id} className="relative group">
                <Link
                  href={item.href}
                  className={`relative flex flex-col justify-between p-2.5 rounded-xl bg-[#0b1220]/95 border ${item.borderColor} hover:bg-[#101b30] hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-200 active:scale-[0.98] min-h-[72px] w-full block`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <div
                      className={`w-7 h-7 rounded-lg ${item.bgGlow} flex items-center justify-center group-hover:scale-110 transition-transform shrink-0`}
                    >
                      <Icon className={`w-4 h-4 ${item.color}`} strokeWidth={1.8} />
                    </div>

                    <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 group-hover:text-slate-300 truncate">
                      {item.badge || item.category}
                    </span>
                  </div>

                  <div className="mt-1.5">
                    <h3 className="text-[11px] font-bold text-slate-200 group-hover:text-white leading-tight transition-colors line-clamp-1">
                      {item.name}
                    </h3>
                  </div>
                </Link>

                {/* Inline Quick Delete Button */}
                <button
                  type="button"
                  onClick={(e) => removePin(item.id, e)}
                  className={`absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-slate-900 border border-slate-700 text-slate-400 hover:text-rose-400 hover:border-rose-500 hover:bg-rose-500/20 flex items-center justify-center text-[9px] font-black transition-all shadow-md z-10 ${
                    isEditMode ? 'opacity-100 scale-100' : 'opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100'
                  }`}
                  title="Remove from Daily Shortcuts"
                >
                  ✕
                </button>
              </div>
            );
          })}

          {/* Plus button card to add more */}
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl border border-dashed border-slate-800 hover:border-indigo-400 hover:bg-indigo-500/10 transition-all duration-200 text-slate-400 hover:text-indigo-300 min-h-[72px] cursor-pointer group active:scale-95"
          >
            <div className="w-6 h-6 rounded-md bg-slate-900 group-hover:bg-indigo-500/20 border border-slate-800 group-hover:border-indigo-500/40 flex items-center justify-center transition-all">
              <Plus size={14} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider">
              + Add
            </span>
          </button>
        </div>
      )}

      {/* ── CUSTOMIZE PAGES MODAL ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-3 sm:p-6 animate-fade-in">
          <div className="bg-[#0b1220] border border-slate-700/80 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 bg-[#080d18] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                  <Star size={20} className="fill-indigo-400/30" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    Customize Daily Pages
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {pinnedIds.length} Selected
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Click any page below to add or remove it from your daily quick-access row.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={resetToDefaults}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Reset to 8 standard hotel daily shortcuts"
                >
                  <RotateCcw size={12} />
                  <span>Defaults</span>
                </button>
                {pinnedIds.length > 0 && (
                  <button
                    type="button"
                    onClick={clearAll}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 text-rose-300 text-xs font-bold transition-all cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Filter & Search Toolbar */}
            <div className="p-4 border-b border-slate-800/80 bg-[#090e1b] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                {categories.map((cat) => {
                  const isActive = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`h-7 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider shrink-0 transition-all cursor-pointer flex items-center gap-1 ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                          : 'bg-slate-900/90 text-slate-400 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>

              {/* Search Box */}
              <div className="relative shrink-0">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Search pages (e.g. checkin, kds)..."
                  className="h-8 w-full sm:w-60 pl-8 pr-7 text-xs font-medium text-slate-200 bg-slate-900 border border-slate-800 rounded-xl focus:border-indigo-500 focus:outline-none placeholder:text-slate-500"
                />
                {searchFilter && (
                  <button
                    type="button"
                    onClick={() => setSearchFilter('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Catalog Grid (Scrollable) */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                {modalCatalogItems.map((item) => {
                  const isPinned = pinnedIds.includes(item.id);
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => togglePin(item.id)}
                      className={`flex items-start gap-3 p-3 rounded-2xl border text-left transition-all duration-150 cursor-pointer relative group ${
                        isPinned
                          ? 'bg-indigo-950/40 border-indigo-500/70 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/50'
                          : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      {/* Icon */}
                      <div
                        className={`w-9 h-9 rounded-xl ${item.bgGlow} flex items-center justify-center shrink-0 mt-0.5`}
                      >
                        <Icon className={`w-4 h-4 ${item.color}`} strokeWidth={1.8} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pr-6">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                            {item.category}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-white truncate mt-0.5">
                          {item.name}
                        </h4>
                        {item.description && (
                          <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                            {item.description}
                          </p>
                        )}
                      </div>

                      {/* Checkbox / Pin state */}
                      <div
                        className={`absolute top-3 right-3 w-5 h-5 rounded-lg flex items-center justify-center text-[10px] transition-all ${
                          isPinned
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/40 font-black'
                            : 'bg-slate-800 border border-slate-700 text-transparent group-hover:text-slate-500'
                        }`}
                      >
                        {isPinned ? <Check size={12} strokeWidth={3} /> : <Plus size={11} />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {modalCatalogItems.length === 0 && (
                <div className="py-12 text-center text-slate-500 text-xs">
                  No pages found matching &quot;{searchFilter}&quot;.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-[#080d18] flex items-center justify-between gap-3 shrink-0">
              <span className="text-xs text-slate-400">
                {pinnedIds.length} pages will appear on your dashboard.
              </span>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <span>Save &amp; View Dashboard</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
