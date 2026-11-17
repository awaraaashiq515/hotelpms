'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Tv, DoorOpen, PlusCircle, Calendar, Bed, Users, Handshake, Shield,
  Globe, ScrollText, TrendingUp, BarChart3, MapPin, Tablet, BrushIcon,
  Wrench, Cpu, Shirt, ShoppingCart, UtensilsCrossed, ChefHat, Package,
  Building2, Sparkles, Waves, Tent, Bike, Music, Receipt, ShieldAlert,
  Moon, Banknote, BookOpen, UserCheck, Navigation, Radio, Wine, Coffee,
  History, ClipboardList, CalendarDays, Store, Eye, Bell, Printer,
  Download, Trash2, FileText, Menu as MenuIcon, Layers, QrCode, Search,
  X, ChevronRight, Zap, ExternalLink, IndianRupee, Wifi, Brain, Tag, Monitor
} from 'lucide-react';

export interface HubPageItem {
  id: string;
  name: string;
  href: string;
  category: 'ALL' | 'DISPLAYS' | 'FRONT_OFFICE' | 'DINING_POS' | 'HOUSEKEEPING' | 'FINANCE' | 'INVENTORY' | 'STAFF' | 'REPORTS_SETTINGS';
  categoryLabel: string;
  icon: React.ComponentType<any>;
  color: string;
  bgGlow: string;
  borderColor: string;
  badge?: string;
  badgeColor?: string;
  description: string;
  isHero?: boolean;
}

export const ALL_HOTEL_PAGES: HubPageItem[] = [
  // ── 📺 Live Displays & Desks ──
  {
    id: 'master-order-display',
    name: 'Master Order Display (TV)',
    href: '/master-order-display',
    category: 'DISPLAYS',
    categoryLabel: 'Live Displays',
    icon: Tv,
    color: 'text-indigo-400',
    bgGlow: 'bg-indigo-500/20',
    borderColor: 'border-indigo-500/50 hover:border-indigo-400 shadow-indigo-500/10',
    badge: 'ALL-IN-1 TV',
    badgeColor: 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white',
    description: 'Rooms, Restaurant & Bar orders in 50/50 dual screen + staff delivery tracker',
    isHero: true,
  },
  {
    id: 'kitchen-portal',
    name: 'Kitchen Staff App (KDS)',
    href: '/kitchen-portal',
    category: 'DISPLAYS',
    categoryLabel: 'Live Displays',
    icon: ChefHat,
    color: 'text-orange-400',
    bgGlow: 'bg-orange-500/20',
    borderColor: 'border-orange-500/50 hover:border-orange-400',
    badge: 'CHEF KDS',
    badgeColor: 'bg-orange-600 text-white',
    description: 'Chef kitchen ticket checklist, food orders & store inventory restocking',
    isHero: true,
  },
  {
    id: 'kitchen-display',
    name: 'Station Kitchen Display',
    href: '/hotel/pos/kitchen-display',
    category: 'DISPLAYS',
    categoryLabel: 'Live Displays',
    icon: Eye,
    color: 'text-rose-400',
    bgGlow: 'bg-rose-500/15',
    borderColor: 'border-rose-500/30 hover:border-rose-400',
    description: 'Live order pipeline: New -> Cooking -> Ready to Serve',
  },
  {
    id: 'bar-display',
    name: 'Bar Display (BDS)',
    href: '/hotel/pos/bar-display',
    category: 'DISPLAYS',
    categoryLabel: 'Live Displays',
    icon: Wine,
    color: 'text-amber-400',
    bgGlow: 'bg-amber-500/15',
    borderColor: 'border-amber-500/30 hover:border-amber-400',
    badge: 'BAR',
    badgeColor: 'bg-amber-600 text-white',
    description: 'Cocktails, beverages & liquor pouring tickets display',
  },
  {
    id: 'order-display',
    name: 'Customer Display (CDS)',
    href: '/order-display',
    category: 'DISPLAYS',
    categoryLabel: 'Live Displays',
    icon: Monitor,
    color: 'text-emerald-400',
    bgGlow: 'bg-emerald-500/15',
    borderColor: 'border-emerald-500/30 hover:border-emerald-400',
    badge: 'AUDIO CDS',
    badgeColor: 'bg-emerald-600 text-white',
    description: 'Big TV screen for guest order collection with speech voice callout',
  },
  {
    id: 'operations-dashboard',
    name: 'Live Operations Dashboard',
    href: '/hotel/operations-dashboard',
    category: 'DISPLAYS',
    categoryLabel: 'Live Displays',
    icon: LayoutGridIcon,
    color: 'text-sky-400',
    bgGlow: 'bg-sky-500/15',
    borderColor: 'border-sky-500/30 hover:border-sky-400',
    badge: 'LIVE KPI',
    badgeColor: 'bg-sky-600 text-white',
    description: 'Real-time property room occupancy, guest arrivals & flight radar',
  },
  {
    id: 'live-overview',
    name: 'POS Live Overview',
    href: '/hotel/pos/live-overview',
    category: 'DISPLAYS',
    categoryLabel: 'Live Displays',
    icon: LayoutGridIcon,
    color: 'text-teal-400',
    bgGlow: 'bg-teal-500/15',
    borderColor: 'border-teal-500/30 hover:border-teal-400',
    description: 'Table status, active deliveries, running KOTs & day revenue',
  },

  // ── 🏨 Front Office & Reservations ──
  {
    id: 'checkin',
    name: 'Check-In Terminal',
    href: '/hotel/checkin',
    category: 'FRONT_OFFICE',
    categoryLabel: 'Front Desk',
    icon: DoorOpen,
    color: 'text-emerald-400',
    bgGlow: 'bg-emerald-500/20',
    borderColor: 'border-emerald-500/50 hover:border-emerald-400',
    badge: 'ARRIVAL',
    badgeColor: 'bg-emerald-600 text-white',
    description: 'Fast guest check-in, passport/Aadhar scan & keycard allocation',
    isHero: true,
  },
  {
    id: 'checkout',
    name: 'Check-Out Terminal',
    href: '/hotel/checkout',
    category: 'FRONT_OFFICE',
    categoryLabel: 'Front Desk',
    icon: DoorOpen,
    color: 'text-rose-400',
    bgGlow: 'bg-rose-500/20',
    borderColor: 'border-rose-500/50 hover:border-rose-400',
    badge: 'DEPARTURE',
    badgeColor: 'bg-rose-600 text-white',
    description: 'Final bill settlement, room inspection release & invoice printing',
    isHero: true,
  },
  {
    id: 'bookings',
    name: 'Bookings Manager',
    href: '/hotel/bookings',
    category: 'FRONT_OFFICE',
    categoryLabel: 'Front Desk',
    icon: PlusCircle,
    color: 'text-indigo-400',
    bgGlow: 'bg-indigo-500/15',
    borderColor: 'border-indigo-500/30 hover:border-indigo-400',
    description: 'Advance reservations, walk-ins, OTA sync & room booking wizard',
  },
  {
    id: 'calendar',
    name: 'Availability Matrix',
    href: '/hotel/calendar',
    category: 'FRONT_OFFICE',
    categoryLabel: 'Front Desk',
    icon: Calendar,
    color: 'text-sky-400',
    bgGlow: 'bg-sky-500/20',
    borderColor: 'border-sky-500/50 hover:border-sky-400',
    badge: 'TIMELINE',
    badgeColor: 'bg-sky-600 text-white',
    description: 'Interactive calendar grid of vacant, reserved & occupied rooms',
    isHero: true,
  },
  {
    id: 'rooms-board',
    name: 'Room Status Board',
    href: '/hotel/rooms?tab=board',
    category: 'FRONT_OFFICE',
    categoryLabel: 'Front Desk',
    icon: MapPin,
    color: 'text-violet-400',
    bgGlow: 'bg-violet-500/15',
    borderColor: 'border-violet-500/30 hover:border-violet-400',
    description: 'Floor-wise visual occupancy board and room statuses',
  },
  {
    id: 'rooms-types',
    name: 'Rooms & Types',
    href: '/hotel/rooms',
    category: 'FRONT_OFFICE',
    categoryLabel: 'Front Desk',
    icon: Bed,
    color: 'text-violet-400',
    bgGlow: 'bg-violet-500/15',
    borderColor: 'border-violet-500/30 hover:border-violet-400',
    description: 'Room inventory, deluxe/suite categories, amenities & tariffs',
  },
  {
    id: 'room-qr-standees',
    name: 'Room Door QR Placards & Studio',
    href: '/hotel/rooms/qr-codes',
    category: 'FRONT_OFFICE',
    categoryLabel: 'Front Desk',
    icon: DoorOpen,
    color: 'text-amber-400',
    bgGlow: 'bg-amber-500/20',
    borderColor: 'border-amber-500/50 hover:border-amber-400 shadow-amber-500/10',
    badge: 'DOOR QR',
    badgeColor: 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black',
    description: 'Print separate QR placards for outside each room door with 1-tap reception call, key help & room service',
    isHero: true,
  },
  {
    id: 'guests',
    name: 'Guests & KYC Directory',
    href: '/hotel/guests',
    category: 'FRONT_OFFICE',
    categoryLabel: 'Front Desk',
    icon: Users,
    color: 'text-rose-400',
    bgGlow: 'bg-rose-500/15',
    borderColor: 'border-rose-500/30 hover:border-rose-400',
    badge: 'KYC',
    badgeColor: 'bg-rose-600 text-white',
    description: 'Guest CRM, repeat history, ID proof capture & contact profiles',
  },
  {
    id: 'agent-bookings',
    name: 'Agent Bookings Desk',
    href: '/hotel/agent-bookings',
    category: 'FRONT_OFFICE',
    categoryLabel: 'Front Desk',
    icon: Handshake,
    color: 'text-cyan-400',
    bgGlow: 'bg-cyan-500/15',
    borderColor: 'border-cyan-500/30 hover:border-cyan-400',
    badge: 'B2B',
    badgeColor: 'bg-cyan-600 text-white',
    description: 'Travel agent commissions, group bookings & corporate rates',
  },
  {
    id: 'security-portal',
    name: 'Security & Verification Portal',
    href: '/security-portal',
    category: 'FRONT_OFFICE',
    categoryLabel: 'Front Desk',
    icon: Shield,
    color: 'text-cyan-400',
    bgGlow: 'bg-cyan-500/20',
    borderColor: 'border-cyan-500/50 hover:border-cyan-400',
    badge: 'VERIFY',
    badgeColor: 'bg-cyan-600 text-white',
    description: 'Guard/gate guest ID verification, vehicle entry & face scanner',
    isHero: true,
  },
  {
    id: 'guest-portal',
    name: 'Guest Self Portal',
    href: '/guest-portal',
    category: 'FRONT_OFFICE',
    categoryLabel: 'Front Desk',
    icon: Globe,
    color: 'text-indigo-400',
    bgGlow: 'bg-indigo-500/15',
    borderColor: 'border-indigo-500/30 hover:border-indigo-400',
    badge: 'MOBILE WEB',
    badgeColor: 'bg-indigo-600 text-white',
    description: 'Guest mobile view: view bill, request room cleaning & order food',
  },
  {
    id: 'room-portal',
    name: 'In-Room Tablet Kiosk',
    href: '/room-portal',
    category: 'FRONT_OFFICE',
    categoryLabel: 'Front Desk',
    icon: Tablet,
    color: 'text-amber-400',
    bgGlow: 'bg-amber-500/15',
    borderColor: 'border-amber-500/30 hover:border-amber-400',
    badge: 'TABLET',
    badgeColor: 'bg-amber-600 text-white',
    description: 'Interactive bedside tablet app for in-room guest services',
  },
  {
    id: 'email-bookings',
    name: 'Email Bookings AI',
    href: '/hotel/email-bookings',
    category: 'FRONT_OFFICE',
    categoryLabel: 'Front Desk',
    icon: ScrollText,
    color: 'text-indigo-400',
    bgGlow: 'bg-indigo-500/15',
    borderColor: 'border-indigo-500/30 hover:border-indigo-400',
    description: 'Automatic AI email reader for reservation vouchers',
  },

  // ── 🍽️ Restaurant, Dining & POS ──
  {
    id: 'pos-billing',
    name: 'POS Billing Terminal',
    href: '/hotel/pos/billing',
    category: 'DINING_POS',
    categoryLabel: 'Food & POS',
    icon: Monitor,
    color: 'text-orange-400',
    bgGlow: 'bg-orange-500/20',
    borderColor: 'border-orange-500/50 hover:border-orange-400',
    badge: 'FAST POS',
    badgeColor: 'bg-orange-600 text-white',
    description: 'Fast restaurant dining billing, room charge & split payments',
    isHero: true,
  },
  {
    id: 'pos-room-service',
    name: 'Room Service Dining Orders',
    href: '/hotel/pos/room-service',
    category: 'DINING_POS',
    categoryLabel: 'Food & POS',
    icon: Bed,
    color: 'text-indigo-400',
    bgGlow: 'bg-indigo-500/15',
    borderColor: 'border-indigo-500/30 hover:border-indigo-400',
    badge: 'ROOM SERVICE',
    badgeColor: 'bg-indigo-600 text-white',
    description: 'Direct room service food orders, delivery slip & folio charge',
  },
  {
    id: 'pos-tables',
    name: 'Table Layout & Floors',
    href: '/hotel/pos/tables',
    category: 'DINING_POS',
    categoryLabel: 'Food & POS',
    icon: LayoutGridIcon,
    color: 'text-amber-400',
    bgGlow: 'bg-amber-500/15',
    borderColor: 'border-amber-500/30 hover:border-amber-400',
    description: 'Dine-in floor plan, active occupied tables & table transfer',
  },
  {
    id: 'pos-table-reservations',
    name: 'Table Reservations',
    href: '/hotel/pos/table-reservations',
    category: 'DINING_POS',
    categoryLabel: 'Food & POS',
    icon: CalendarDays,
    color: 'text-amber-400',
    bgGlow: 'bg-amber-500/15',
    borderColor: 'border-amber-500/30 hover:border-amber-400',
    description: 'Advance dining table reservations & guest party seating',
  },
  {
    id: 'pos-bar',
    name: 'Bar POS Terminal',
    href: '/hotel/pos/bar-pos',
    category: 'DINING_POS',
    categoryLabel: 'Food & POS',
    icon: Wine,
    color: 'text-violet-400',
    bgGlow: 'bg-violet-500/15',
    borderColor: 'border-violet-500/30 hover:border-violet-400',
    description: 'Beverages, cocktails, peg sizing & bar counter billing',
  },
  {
    id: 'pos-cafe',
    name: 'Cafe POS Terminal',
    href: '/hotel/pos/cafe-pos',
    category: 'DINING_POS',
    categoryLabel: 'Food & POS',
    icon: Coffee,
    color: 'text-amber-400',
    bgGlow: 'bg-amber-500/15',
    borderColor: 'border-amber-500/30 hover:border-amber-400',
    description: 'Coffee shop, bakery, snacks & quick service counter',
  },
  {
    id: 'pos-orders',
    name: 'Orders Control Center',
    href: '/hotel/pos/orders',
    category: 'DINING_POS',
    categoryLabel: 'Food & POS',
    icon: ShoppingCart,
    color: 'text-emerald-400',
    bgGlow: 'bg-emerald-500/15',
    borderColor: 'border-emerald-500/30 hover:border-emerald-400',
    description: 'Complete list of dine-in, delivery, takeaway & room orders',
  },
  {
    id: 'pos-kots',
    name: 'Kitchen Order Tokens (KOTs)',
    href: '/hotel/pos/kots',
    category: 'DINING_POS',
    categoryLabel: 'Food & POS',
    icon: ClipboardList,
    color: 'text-rose-400',
    bgGlow: 'bg-rose-500/15',
    borderColor: 'border-rose-500/30 hover:border-rose-400',
    description: 'Live KOT tickets queue, item notes & printing history',
  },
  {
    id: 'pos-counter-payments',
    name: 'Counter Payments Desk',
    href: '/hotel/pos/counter-payments',
    category: 'DINING_POS',
    categoryLabel: 'Food & POS',
    icon: Store,
    color: 'text-teal-400',
    bgGlow: 'bg-teal-500/15',
    borderColor: 'border-teal-500/30 hover:border-teal-400',
    description: 'Cash, Card & UPI receipt collection for restaurant bills',
  },
  {
    id: 'pos-daily-menus',
    name: "Today's Buffet Menus",
    href: '/hotel/daily-menus',
    category: 'DINING_POS',
    categoryLabel: 'Food & POS',
    icon: UtensilsCrossed,
    color: 'text-orange-400',
    bgGlow: 'bg-orange-500/15',
    borderColor: 'border-orange-500/30 hover:border-orange-400',
    badge: 'BUFFET',
    badgeColor: 'bg-orange-600 text-white',
    description: 'Set daily morning breakfast, lunch & dinner banquet spreads',
  },
  {
    id: 'pos-products',
    name: 'Menu Items Catalog',
    href: '/hotel/pos/products',
    category: 'DINING_POS',
    categoryLabel: 'Food & POS',
    icon: UtensilsCrossed,
    color: 'text-emerald-400',
    bgGlow: 'bg-emerald-500/15',
    borderColor: 'border-emerald-500/30 hover:border-emerald-400',
    description: 'Dishes, drinks, half/full pricing, taxes & stock mapping',
  },
  {
    id: 'pos-categories',
    name: 'Menu Categories',
    href: '/hotel/pos/categories',
    category: 'DINING_POS',
    categoryLabel: 'Food & POS',
    icon: Layers,
    color: 'text-indigo-400',
    bgGlow: 'bg-indigo-500/15',
    borderColor: 'border-indigo-500/30 hover:border-indigo-400',
    description: 'Organize starters, mains, breads, bar & kitchen routing',
  },
  {
    id: 'pos-parking',
    name: 'Valet Parking Desk',
    href: '/hotel/pos/parking',
    category: 'DINING_POS',
    categoryLabel: 'Food & POS',
    icon: MapPin,
    color: 'text-amber-400',
    bgGlow: 'bg-amber-500/15',
    borderColor: 'border-amber-500/30 hover:border-amber-400',
    description: 'Guest car parking slots, token numbers & vehicle retrieval',
  },
  {
    id: 'pos-waste',
    name: 'Waste Management',
    href: '/hotel/pos/waste-management',
    category: 'DINING_POS',
    categoryLabel: 'Food & POS',
    icon: Trash2,
    color: 'text-slate-400',
    bgGlow: 'bg-slate-700/40',
    borderColor: 'border-slate-800 hover:border-slate-600',
    description: 'Food wastage log, spoiled items audit & kitchen cost control',
  },
  {
    id: 'pos-day-closing',
    name: 'POS Day Closing',
    href: '/hotel/pos/day-closing',
    category: 'DINING_POS',
    categoryLabel: 'Food & POS',
    icon: History,
    color: 'text-rose-400',
    bgGlow: 'bg-rose-500/15',
    borderColor: 'border-rose-500/30 hover:border-rose-400',
    description: 'Cash drawer closing, daily sales reconciliation & EOD report',
  },

  // ── 🧹 Housekeeping & Maintenance ──
  {
    id: 'housekeeping',
    name: 'Housekeeping Console',
    href: '/hotel/housekeeping',
    category: 'HOUSEKEEPING',
    categoryLabel: 'Housekeeping',
    icon: BrushIcon,
    color: 'text-emerald-400',
    bgGlow: 'bg-emerald-500/20',
    borderColor: 'border-emerald-500/50 hover:border-emerald-400',
    badge: 'CLEANING',
    badgeColor: 'bg-emerald-600 text-white',
    description: 'Room cleaning queue, dirty/clean status & inspection release',
    isHero: true,
  },
  {
    id: 'housekeeper-portal',
    name: 'Housekeeper Staff App',
    href: '/housekeeper-portal',
    category: 'HOUSEKEEPING',
    categoryLabel: 'Housekeeping',
    icon: BrushIcon,
    color: 'text-violet-400',
    bgGlow: 'bg-violet-500/15',
    borderColor: 'border-violet-500/30 hover:border-violet-400',
    badge: 'MOBILE STAFF',
    badgeColor: 'bg-violet-600 text-white',
    description: 'Staff mobile app with push-to-talk walkie-talkie & room checklist',
  },
  {
    id: 'maintenance',
    name: 'Maintenance & Repairs',
    href: '/hotel/maintenance',
    category: 'HOUSEKEEPING',
    categoryLabel: 'Housekeeping',
    icon: Wrench,
    color: 'text-amber-400',
    bgGlow: 'bg-amber-500/15',
    borderColor: 'border-amber-500/30 hover:border-amber-400',
    description: 'Plumbing, electrical, AC repair tickets & room status hold',
  },
  {
    id: 'engineering',
    name: 'Engineering Center',
    href: '/hotel/engineering',
    category: 'HOUSEKEEPING',
    categoryLabel: 'Housekeeping',
    icon: Cpu,
    color: 'text-cyan-400',
    bgGlow: 'bg-cyan-500/15',
    borderColor: 'border-cyan-500/30 hover:border-cyan-400',
    description: 'Generators, HVAC, boiler monitoring & building equipment',
  },
  {
    id: 'lost-found',
    name: 'Lost & Found Registry',
    href: '/hotel/lost-found',
    category: 'HOUSEKEEPING',
    categoryLabel: 'Housekeeping',
    icon: MapPin,
    color: 'text-rose-400',
    bgGlow: 'bg-rose-500/15',
    borderColor: 'border-rose-500/30 hover:border-rose-400',
    description: 'Guest forgotten items tracker, storage location & claim returns',
  },
  {
    id: 'laundry',
    name: 'Laundry Service Desk',
    href: '/hotel/laundry',
    category: 'HOUSEKEEPING',
    categoryLabel: 'Housekeeping',
    icon: Shirt,
    color: 'text-sky-400',
    bgGlow: 'bg-sky-500/15',
    borderColor: 'border-sky-500/30 hover:border-sky-400',
    description: 'Bed linens, towels, guest dry cleaning & washer batch tracker',
  },

  // ── 💰 Billing, Cash & Accounts ──
  {
    id: 'billing',
    name: 'Folios & Guest Billing',
    href: '/hotel/billing',
    category: 'FINANCE',
    categoryLabel: 'Finance & Bills',
    icon: Receipt,
    color: 'text-emerald-400',
    bgGlow: 'bg-emerald-500/15',
    borderColor: 'border-emerald-500/30 hover:border-emerald-400',
    badge: 'FOLIOS',
    badgeColor: 'bg-emerald-600 text-white',
    description: 'Guest folio balance, room charges, advance deposits & final receipt',
  },
  {
    id: 'invoices',
    name: 'Invoices Registry',
    href: '/hotel/billing/invoices',
    category: 'FINANCE',
    categoryLabel: 'Finance & Bills',
    icon: ScrollText,
    color: 'text-indigo-400',
    bgGlow: 'bg-indigo-500/15',
    borderColor: 'border-indigo-500/30 hover:border-indigo-400',
    description: 'Search, view & print all GST tax invoices and settlement receipts',
  },
  {
    id: 'night-audit',
    name: 'Night Audit Console',
    href: '/hotel/night-audit',
    category: 'FINANCE',
    categoryLabel: 'Finance & Bills',
    icon: Moon,
    color: 'text-purple-400',
    bgGlow: 'bg-purple-500/20',
    borderColor: 'border-purple-500/40 hover:border-purple-400',
    badge: 'EOD AUDIT',
    badgeColor: 'bg-purple-600 text-white',
    description: 'Automated end-of-day room posting, tax tally & ledger rollover',
  },
  {
    id: 'discounts',
    name: 'Discount Approvals',
    href: '/hotel/discounts',
    category: 'FINANCE',
    categoryLabel: 'Finance & Bills',
    icon: ShieldAlert,
    color: 'text-amber-400',
    bgGlow: 'bg-amber-500/15',
    borderColor: 'border-amber-500/30 hover:border-amber-400',
    badge: 'PIN CONTROL',
    badgeColor: 'bg-amber-600 text-white',
    description: 'Real-time cashier discount approval requests & manager PIN control',
  },
  {
    id: 'expenses',
    name: 'Expenses Controller',
    href: '/hotel/expenses',
    category: 'FINANCE',
    categoryLabel: 'Finance & Bills',
    icon: Banknote,
    color: 'text-rose-400',
    bgGlow: 'bg-rose-500/15',
    borderColor: 'border-rose-500/30 hover:border-rose-400',
    description: 'Daily cash expenses, utility payments, maintenance payout records',
  },
  {
    id: 'cash-book',
    name: 'Cash Book',
    href: '/hotel/accounts/cash-book',
    category: 'FINANCE',
    categoryLabel: 'Finance & Bills',
    icon: Banknote,
    color: 'text-teal-400',
    bgGlow: 'bg-teal-500/15',
    borderColor: 'border-teal-500/30 hover:border-teal-400',
    description: 'Physical cash in/out register, cash payments & cashier drawer',
  },
  {
    id: 'day-book',
    name: 'Day Book Journal',
    href: '/hotel/accounts/day-book',
    category: 'FINANCE',
    categoryLabel: 'Finance & Bills',
    icon: BookOpen,
    color: 'text-sky-400',
    bgGlow: 'bg-sky-500/15',
    borderColor: 'border-sky-500/30 hover:border-sky-400',
    description: 'Daily accounting transaction journal across all departments',
  },
  {
    id: 'ledger',
    name: 'General Ledger',
    href: '/hotel/accounts/ledger',
    category: 'FINANCE',
    categoryLabel: 'Finance & Bills',
    icon: BookOpen,
    color: 'text-emerald-400',
    bgGlow: 'bg-emerald-500/15',
    borderColor: 'border-emerald-500/30 hover:border-emerald-400',
    description: 'Chart of accounts, debit/credit summaries & trial balances',
  },
  {
    id: 'vouchers',
    name: 'Accounting Vouchers',
    href: '/hotel/vouchers',
    category: 'FINANCE',
    categoryLabel: 'Finance & Bills',
    icon: Receipt,
    color: 'text-indigo-400',
    bgGlow: 'bg-indigo-500/15',
    borderColor: 'border-indigo-500/30 hover:border-indigo-400',
    description: 'Payment, receipt, contra & journal voucher entries',
  },

  // ── 📦 Inventory & Purchasing ──
  {
    id: 'inventory',
    name: 'Central Inventory & Stock',
    href: '/hotel/inventory',
    category: 'INVENTORY',
    categoryLabel: 'Inventory',
    icon: Package,
    color: 'text-amber-400',
    bgGlow: 'bg-amber-500/20',
    borderColor: 'border-amber-500/40 hover:border-amber-400',
    badge: 'STOCK',
    badgeColor: 'bg-amber-600 text-white',
    description: 'Ingredients, housekeeping supplies, toiletries & reorder alerts',
  },
  {
    id: 'purchasing',
    name: 'Purchase Orders (WhatsApp)',
    href: '/hotel/purchasing',
    category: 'INVENTORY',
    categoryLabel: 'Inventory',
    icon: ShoppingCart,
    color: 'text-emerald-400',
    bgGlow: 'bg-emerald-500/15',
    borderColor: 'border-emerald-500/30 hover:border-emerald-400',
    badge: 'WHATSAPP',
    badgeColor: 'bg-emerald-600 text-white',
    description: 'One-click vendor purchase orders sent instantly via WhatsApp',
  },
  {
    id: 'kitchen-indents',
    name: 'Kitchen Indents & Requisitions',
    href: '/hotel/purchasing?tab=kitchen',
    category: 'INVENTORY',
    categoryLabel: 'Inventory',
    icon: UtensilsCrossed,
    color: 'text-orange-400',
    bgGlow: 'bg-orange-500/15',
    borderColor: 'border-orange-500/30 hover:border-orange-400',
    description: 'Chef daily food restocking requests sent to storekeeper',
  },
  {
    id: 'vendor',
    name: 'Vendor Management',
    href: '/hotel/vendor',
    category: 'INVENTORY',
    categoryLabel: 'Inventory',
    icon: Building2,
    color: 'text-indigo-400',
    bgGlow: 'bg-indigo-500/15',
    borderColor: 'border-indigo-500/30 hover:border-indigo-400',
    description: 'Supplier contacts, contracts, GST numbers & outstanding balances',
  },

  // ── 👥 Staff, HR & Attendance ──
  {
    id: 'staff',
    name: 'Staff Directory & Roster',
    href: '/hotel/staff',
    category: 'STAFF',
    categoryLabel: 'Staff & HR',
    icon: Users,
    color: 'text-indigo-400',
    bgGlow: 'bg-indigo-500/15',
    borderColor: 'border-indigo-500/30 hover:border-indigo-400',
    description: 'Staff member profiles, roles, salary contracts & duty shifts',
  },
  {
    id: 'staff-attendance',
    name: 'Live GPS Attendance',
    href: '/hotel/staff/attendance',
    category: 'STAFF',
    categoryLabel: 'Staff & HR',
    icon: UserCheck,
    color: 'text-emerald-400',
    bgGlow: 'bg-emerald-500/20',
    borderColor: 'border-emerald-500/40 hover:border-emerald-400',
    badge: 'GPS CLOCK-IN',
    badgeColor: 'bg-emerald-600 text-white',
    description: 'Staff biometric/GPS check-in/out records, timings & late penalties',
  },
  {
    id: 'attendance-location',
    name: 'Punch Locations Verifier',
    href: '/hotel/staff/attendance-location',
    category: 'STAFF',
    categoryLabel: 'Staff & HR',
    icon: Navigation,
    color: 'text-teal-400',
    bgGlow: 'bg-teal-500/15',
    borderColor: 'border-teal-500/30 hover:border-teal-400',
    description: 'Verify exact staff punch-in coordinates on hotel map geofence',
  },
  {
    id: 'proximity-radar',
    name: 'Proximity Radar',
    href: '/hotel/staff/location',
    category: 'STAFF',
    categoryLabel: 'Staff & HR',
    icon: Radio,
    color: 'text-cyan-400',
    bgGlow: 'bg-cyan-500/15',
    borderColor: 'border-cyan-500/30 hover:border-cyan-400',
    badge: 'LIVE RADAR',
    badgeColor: 'bg-cyan-600 text-white',
    description: 'Real-time on-premise staff beacon location tracker',
  },
  {
    id: 'hr-leaves',
    name: 'HR & Leaves Hub',
    href: '/hotel/hr',
    category: 'STAFF',
    categoryLabel: 'Staff & HR',
    icon: Calendar,
    color: 'text-violet-400',
    bgGlow: 'bg-violet-500/15',
    borderColor: 'border-violet-500/30 hover:border-violet-400',
    description: 'Leave request applications, manager approvals & holidays',
  },
  {
    id: 'payroll',
    name: 'Hotel Payroll Structures',
    href: '/hotel/payroll',
    category: 'STAFF',
    categoryLabel: 'Staff & HR',
    icon: IndianRupee,
    color: 'text-emerald-400',
    bgGlow: 'bg-emerald-500/15',
    borderColor: 'border-emerald-500/30 hover:border-emerald-400',
    description: 'Monthly salary calculation, deductions, advance loans & payslips',
  },

  // ── 📈 Reports, AI & Settings ──
  {
    id: 'reports',
    name: 'Operations Reports',
    href: '/hotel/reports',
    category: 'REPORTS_SETTINGS',
    categoryLabel: 'Reports & Admin',
    icon: ScrollText,
    color: 'text-emerald-400',
    bgGlow: 'bg-emerald-500/15',
    borderColor: 'border-emerald-500/30 hover:border-emerald-400',
    badge: 'REPORTS',
    badgeColor: 'bg-emerald-600 text-white',
    description: 'Daily sales, tax GST reports, settlements, room audit & guest ledger',
  },
  {
    id: 'analytics',
    name: 'Analytics & BI',
    href: '/hotel/analytics',
    category: 'REPORTS_SETTINGS',
    categoryLabel: 'Reports & Admin',
    icon: BarChart3,
    color: 'text-indigo-400',
    bgGlow: 'bg-indigo-500/15',
    borderColor: 'border-indigo-500/30 hover:border-indigo-400',
    description: 'Business intelligence: RevPAR, ADR, occupancy rate & monthly profit',
  },
  {
    id: 'channel-manager',
    name: 'Channel Manager',
    href: '/hotel/channel-manager',
    category: 'REPORTS_SETTINGS',
    categoryLabel: 'Reports & Admin',
    icon: Globe,
    color: 'text-cyan-400',
    bgGlow: 'bg-cyan-500/15',
    borderColor: 'border-cyan-500/30 hover:border-cyan-400',
    badge: 'OTA SYNC',
    badgeColor: 'bg-cyan-600 text-white',
    description: 'Two-way sync with MakeMyTrip, Agoda, Booking.com & Airbnb',
  },
  {
    id: 'revenue',
    name: 'AI Revenue Advisor',
    href: '/hotel/revenue',
    category: 'REPORTS_SETTINGS',
    categoryLabel: 'Reports & Admin',
    icon: TrendingUp,
    color: 'text-violet-400',
    bgGlow: 'bg-violet-500/15',
    borderColor: 'border-violet-500/30 hover:border-violet-400',
    badge: 'AI',
    badgeColor: 'bg-violet-600 text-white',
    description: 'Dynamic tariff optimizer and occupancy prediction machine',
  },
  {
    id: 'backup',
    name: 'Data Backup & Restore',
    href: '/hotel/backup',
    category: 'REPORTS_SETTINGS',
    categoryLabel: 'Reports & Admin',
    icon: Shield,
    color: 'text-emerald-400',
    bgGlow: 'bg-emerald-500/15',
    borderColor: 'border-emerald-500/30 hover:border-emerald-400',
    badge: 'AUTO BACKUP',
    badgeColor: 'bg-emerald-600 text-white',
    description: 'One-click full system JSON backup & instant disaster restore',
  },
  {
    id: 'hotel-settings',
    name: 'Hotel Settings',
    href: '/hotel/settings',
    category: 'REPORTS_SETTINGS',
    categoryLabel: 'Reports & Admin',
    icon: Settings,
    color: 'text-slate-400',
    bgGlow: 'bg-slate-700/40',
    borderColor: 'border-slate-800 hover:border-slate-600',
    description: 'Property details, tax GSTIN, invoice prefixes, logo & timezones',
  },
  {
    id: 'printers',
    name: 'Printers & KOT Setup',
    href: '/hotel/settings/printers',
    category: 'REPORTS_SETTINGS',
    categoryLabel: 'Reports & Admin',
    icon: Printer,
    color: 'text-slate-400',
    bgGlow: 'bg-slate-700/40',
    borderColor: 'border-slate-800 hover:border-slate-600',
    description: 'Thermal receipt printers, Bluetooth & LAN IP kitchen printers',
  },
];

function LayoutGridIcon(props: any) {
  return <LayoutGrid {...props} />;
}
import { LayoutGrid, Settings } from 'lucide-react';

interface HotelAllPagesHubProps {
  propertyCode?: string;
}

export const HotelAllPagesHub: React.FC<HotelAllPagesHubProps> = ({ propertyCode }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const CATEGORY_TABS = [
    { id: 'ALL', label: 'All Pages', count: ALL_HOTEL_PAGES.length },
    { id: 'DISPLAYS', label: '📺 Live Displays', count: ALL_HOTEL_PAGES.filter(p => p.category === 'DISPLAYS').length },
    { id: 'FRONT_OFFICE', label: '🏨 Front Desk', count: ALL_HOTEL_PAGES.filter(p => p.category === 'FRONT_OFFICE').length },
    { id: 'DINING_POS', label: '🍽️ Food & POS', count: ALL_HOTEL_PAGES.filter(p => p.category === 'DINING_POS').length },
    { id: 'HOUSEKEEPING', label: '🧹 Housekeeping', count: ALL_HOTEL_PAGES.filter(p => p.category === 'HOUSEKEEPING').length },
    { id: 'FINANCE', label: '💰 Billing & Accounts', count: ALL_HOTEL_PAGES.filter(p => p.category === 'FINANCE').length },
    { id: 'INVENTORY', label: '📦 Inventory', count: ALL_HOTEL_PAGES.filter(p => p.category === 'INVENTORY').length },
    { id: 'STAFF', label: '👥 Staff & HR', count: ALL_HOTEL_PAGES.filter(p => p.category === 'STAFF').length },
    { id: 'REPORTS_SETTINGS', label: '📈 Reports & Config', count: ALL_HOTEL_PAGES.filter(p => p.category === 'REPORTS_SETTINGS').length },
  ];

  // Hero Top Pages
  const heroPages = useMemo(() => ALL_HOTEL_PAGES.filter(p => p.isHero), []);

  // Filtered pages
  const filteredPages = useMemo(() => {
    return ALL_HOTEL_PAGES.filter((item) => {
      const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.categoryLabel.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.href.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <section className="mb-4 space-y-3">
      {/* ── TOP HERO BAR: FAST COMMAND LAUNCHPAD ── */}
      <div className="p-3.5 rounded-3xl bg-[#090d18] border border-slate-800 shadow-xl space-y-3">
        {/* Title & Instant Search */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
              <Zap size={16} />
            </div>
            <div>
              <h2 className="text-sm font-black text-white tracking-wide uppercase flex items-center gap-2">
                <span>Operations Launchpad</span>
                <span className="text-[10px] px-2 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">
                  All {ALL_HOTEL_PAGES.length} Pages
                </span>
              </h2>
              <p className="text-[11px] text-slate-400 font-medium">
                Quick access to every hotel module, live display, and POS screen in 1 click
              </p>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Quick search any page, display, KOT..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* ── HERO TOP 8 FREQUENT ACTIONS (WHEN NOT SEARCHING) ── */}
        {!searchQuery && selectedCategory === 'ALL' && (
          <div className="space-y-1.5 pt-1 border-t border-slate-800/80">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-1 block">
              ⚡ Top Daily Workstations
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
              {heroPages.map((page) => {
                const PageIcon = page.icon;
                return (
                  <Link
                    key={page.id}
                    href={page.href}
                    className={`p-2.5 rounded-2xl bg-[#0c1222] border ${page.borderColor} hover:scale-[1.02] active:scale-95 transition-all text-center flex flex-col items-center justify-center gap-1.5 min-h-[82px] shadow-lg group`}
                  >
                    <div className={`w-8 h-8 rounded-xl ${page.bgGlow} flex items-center justify-center ${page.color} group-hover:scale-110 transition-transform`}>
                      <PageIcon size={16} />
                    </div>
                    <span className="text-[11px] font-black text-slate-200 group-hover:text-white leading-tight line-clamp-1">
                      {page.name.replace(' (TV)', '').replace(' (KDS)', '')}
                    </span>
                    {page.badge && (
                      <span className={`text-[8.5px] font-black uppercase px-1.5 py-0.2 rounded-full ${page.badgeColor || 'bg-slate-800 text-slate-300'}`}>
                        {page.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* ── CATEGORY FILTER TABS ── */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 border-t border-slate-800/80">
          {CATEGORY_TABS.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                  isSelected
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <span>{cat.label}</span>
                <span className="px-1.5 py-0.2 rounded-md bg-black/40 text-[10px] font-black">
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── ALL PAGES EXPANDED GRID ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1 text-xs text-slate-400">
          <span className="font-bold">
            Showing {filteredPages.length} {filteredPages.length === 1 ? 'Page' : 'Pages'}
            {selectedCategory !== 'ALL' && ` in ${CATEGORY_TABS.find(c => c.id === selectedCategory)?.label}`}
            {searchQuery && ` matching "${searchQuery}"`}
          </span>
          <span className="text-[11px] text-slate-500">Tap any card to open directly</span>
        </div>

        {filteredPages.length === 0 ? (
          <div className="py-14 text-center rounded-3xl bg-[#090d18] border border-slate-800 text-slate-400">
            <Search size={28} className="mx-auto text-slate-600 mb-2" />
            <p className="text-sm font-bold text-slate-300">No pages found matching &quot;{searchQuery}&quot;</p>
            <p className="text-xs text-slate-500 mt-1">Try searching for: master display, checkin, kots, rooms, bar, billing</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-2.5">
            {filteredPages.map((item) => {
              const ItemIcon = item.icon;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`p-3 rounded-2xl bg-[#0a0f1d] border ${item.borderColor} hover:bg-[#0f172a] hover:scale-[1.02] active:scale-95 transition-all flex flex-col justify-between min-h-[110px] group shadow-lg`}
                >
                  {/* Top: Icon + Badge */}
                  <div className="flex items-start justify-between gap-1 mb-2">
                    <div className={`w-8 h-8 rounded-xl ${item.bgGlow} flex items-center justify-center ${item.color} group-hover:scale-110 transition-transform shrink-0`}>
                      <ItemIcon size={16} />
                    </div>
                    {item.badge && (
                      <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full shrink-0 ${item.badgeColor || 'bg-slate-800 text-slate-300 border border-slate-700'}`}>
                        {item.badge}
                      </span>
                    )}
                  </div>

                  {/* Middle: Name */}
                  <div>
                    <h3 className="text-xs font-black text-slate-200 group-hover:text-white leading-snug line-clamp-2">
                      {item.name}
                    </h3>
                    <p className="text-[9.5px] text-slate-400 font-medium line-clamp-2 mt-0.5">
                      {item.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
