'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles, Search, X, Calendar, Bed, PlusCircle, DoorOpen, ScrollText,
  TrendingUp, Globe, BarChart3, MapPin, BrushIcon, Wrench, Cpu, Shirt,
  Package, Building2, ChefHat, Receipt, Moon, Banknote,
  IndianRupee, Users, Crown, Brain, Wifi, Settings,
  ChevronDown, Hotel, LayoutGrid, Star, Handshake, BookOpen, Tablet,
  UserCheck, Radio, Navigation, UtensilsCrossed, Monitor, Bell,
  Trash2, Download, Eye, Printer, ShoppingCart, Tag, Bike, FileText,
  Phone, Music2, Lock, ArrowUpRight, Plus,
} from 'lucide-react';
import { LiveClock } from '@/components/hotel/ui/LiveClock';

/* ─── Module sub-card (same as before) ─── */
function ModuleCard({ name, href, icon: Icon, iconColor, iconBg, cardBorder }: {
  name: string; href: string; icon: React.ComponentType<any>;
  iconColor: string; iconBg: string; cardBorder: string;
}) {
  return (
    <Link
      href={href}
      className={`group relative flex flex-col items-center justify-center gap-2.5 p-4 rounded-2xl bg-[#0f172a] border ${cardBorder} hover:bg-[#131f35] transition-all duration-200 text-center min-h-[100px] w-full cursor-pointer overflow-hidden`}
    >
      <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center transition-transform duration-200 group-hover:scale-110`}>
        <Icon className={`w-[18px] h-[18px] ${iconColor}`} strokeWidth={1.8} />
      </div>
      <span className="text-[11px] font-semibold text-slate-300 group-hover:text-white leading-tight px-1 transition-colors line-clamp-2">
        {name}
      </span>
    </Link>
  );
}

/* ─── POS Quick Action Topbar inside Restaurant & POS panel ─── */
function RestaurantPosHeaderBar({ restaurantCode }: { restaurantCode: string | null }) {
  const router = useRouter();
  const [showLiveOrder, setShowLiveOrder] = useState(false);
  const [showDisplays, setShowDisplays] = useState(false);
  const p = '/hotel/pos';

  return (
    <div className="w-full flex flex-wrap items-center justify-between gap-2.5 p-2.5 px-3 rounded-2xl bg-[#0b1120]/95 border border-orange-500/25 shadow-xl mb-4 backdrop-blur-sm">
      {/* Left: Quick Action Buttons & Search */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
        {/* Dine In */}
        <Link
          href="/hotel/pos/tables"
          className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[11px] uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-indigo-600/25 active:scale-95 transition-all shrink-0"
          title="Dine In (Table Layout)"
        >
          <Monitor size={15} />
          <span>Dine In</span>
        </Link>

        {/* Take Away */}
        <Link
          href="/hotel/pos/billing"
          className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[11px] uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-indigo-600/25 active:scale-95 transition-all shrink-0"
          title="Take Away POS Billing"
        >
          <Plus size={15} />
          <span>Take Away</span>
        </Link>

        {/* Live Order with Dropdown */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setShowLiveOrder(!showLiveOrder)}
            className="h-9 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-black text-[11px] uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-violet-600/25 active:scale-95 transition-all"
            title="Live Orders (Delivery / Pick Up / Room Service)"
          >
            <Plus size={15} />
            <span>Live Order</span>
          </button>
          {showLiveOrder && (
            <div className="absolute left-0 top-full mt-2 w-52 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <Link
                href="/hotel/pos/billing?type=DELIVERY"
                onClick={() => setShowLiveOrder(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-800 hover:text-emerald-400 transition-colors"
              >
                <span className="text-base">🏍️</span> Delivery
              </Link>
              <Link
                href="/hotel/pos/billing?type=PICKUP"
                onClick={() => setShowLiveOrder(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-800 hover:text-orange-400 transition-colors border-t border-slate-800/80"
              >
                <span className="text-base">🛍️</span> Pick Up
              </Link>
              <Link
                href="/hotel/pos/billing?type=ROOM_SERVICE"
                onClick={() => setShowLiveOrder(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-800 hover:text-indigo-400 transition-colors border-t border-slate-800/80"
              >
                <span className="text-base">🏨</span> Room Service
              </Link>
            </div>
          )}
        </div>

        {/* Search Bills input */}
        <div className="relative hidden md:flex items-center shrink-0">
          <Search size={14} className="absolute left-3 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search Bills..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const q = (e.target as HTMLInputElement).value;
                router.push(`/hotel/invoices${q ? `?q=${encodeURIComponent(q)}` : ''}`);
              }
            }}
            className="h-9 w-44 pl-8 pr-12 text-xs font-medium text-slate-200 bg-slate-900/90 border border-slate-800 rounded-xl focus:border-indigo-500/60 focus:outline-none placeholder:text-slate-500"
          />
          <kbd className="absolute right-2 px-1.5 py-0.5 text-[9px] font-bold text-slate-500 bg-slate-800 rounded border border-slate-700">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right: Displays, Lock, Alerts, Support, Full POS */}
      <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
        {/* Displays Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowDisplays(!showDisplays)}
            className="flex flex-col items-center justify-center h-9 px-3 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="Kitchen, Bar, & Customer Displays"
          >
            <Monitor size={15} />
            <span className="text-[8px] font-black uppercase tracking-wider mt-0.5">Displays</span>
          </button>
          {showDisplays && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <Link
                href="/hotel/pos/kitchen-display"
                onClick={() => setShowDisplays(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                🍳 Kitchen Display (KDS)
              </Link>
              <Link
                href="/hotel/pos/bar-display"
                onClick={() => setShowDisplays(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white border-t border-slate-800"
              >
                🍸 Bar Display (BDS)
              </Link>
              <Link
                href="/order-display"
                onClick={() => setShowDisplays(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white border-t border-slate-800"
              >
                📺 Customer Display (CDS)
              </Link>
            </div>
          )}
        </div>

        {/* Lock */}
        <Link
          href="/hotel/pos"
          className="flex flex-col items-center justify-center h-9 px-2.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          title="POS Operations Hub"
        >
          <Lock size={15} />
          <span className="text-[8px] font-black uppercase tracking-wider mt-0.5">POS Hub</span>
        </Link>

        {/* Alerts */}
        <Link
          href="/hotel/notifications"
          className="flex flex-col items-center justify-center h-9 px-2.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          title="Live Alerts & Notifications"
        >
          <Bell size={15} />
          <span className="text-[8px] font-black uppercase tracking-wider mt-0.5">Alerts</span>
        </Link>

        {/* Support Phone */}
        <a
          href="tel:+918679800074"
          className="hidden xl:flex items-center gap-2 h-9 px-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all text-xs font-bold shrink-0"
        >
          <Phone size={13} className="text-emerald-400" />
          <div className="flex flex-col text-left">
            <span className="text-[7px] uppercase font-black tracking-widest text-slate-500 leading-none">Support</span>
            <span className="text-[10px] font-black text-indigo-300 leading-none mt-0.5">+91 86798 00074</span>
          </div>
        </a>

        {/* Full POS Portal button */}
        <Link
          href="/hotel/pos"
          className="h-9 px-3.5 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 text-orange-300 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm shrink-0 active:scale-95"
          title="Open Integrated Hotel POS Hub"
        >
          <span>Full POS</span>
          <ArrowUpRight size={14} />
        </Link>
      </div>
    </div>
  );
}

const DEPARTMENTS = [
  {
    name: 'Front Office & Desk',
    emoji: '🏨',
    labelColor: 'text-sky-400',
    dotColor: 'bg-sky-400',
    glowColor: 'rgba(56,189,248,0.3)',
    borderActive: 'rgba(56,189,248,0.55)',
    borderIdle: 'rgba(56,189,248,0.13)',
    gradFrom: 'rgba(56,189,248,0.13)',
    gradTo: 'rgba(56,189,248,0.04)',
    iconColor: 'text-sky-400',
    iconBg: 'bg-sky-500/15',
    cardBorder: 'border-slate-800 hover:border-sky-500/40',
    modules: [
      { name: 'Operations Dashboard', href: '/hotel/operations-dashboard', icon: LayoutGrid },
      { name: 'Bookings Manager',   href: '/hotel/bookings',        icon: PlusCircle },
      { name: 'Agent Bookings',      href: '/hotel/agent-bookings',  icon: Handshake  },
      { name: 'Room Availability',   href: '/hotel/calendar',        icon: Calendar   },
      { name: 'Check-Out Terminal',  href: '/hotel/checkout',        icon: DoorOpen   },
      { name: 'Email Bookings',      href: '/hotel/email-bookings',  icon: ScrollText },
    ],
  },
  {
    name: 'Rooms & Housekeeping',
    emoji: '🛏️',
    labelColor: 'text-violet-400',
    dotColor: 'bg-violet-400',
    glowColor: 'rgba(167,139,250,0.3)',
    borderActive: 'rgba(167,139,250,0.55)',
    borderIdle: 'rgba(167,139,250,0.13)',
    gradFrom: 'rgba(167,139,250,0.13)',
    gradTo: 'rgba(167,139,250,0.04)',
    iconColor: 'text-violet-400',
    iconBg: 'bg-violet-500/15',
    cardBorder: 'border-slate-800 hover:border-violet-500/40',
    modules: [
      { name: 'Rooms & Types',         href: '/hotel/rooms',        icon: Bed       },
      { name: 'Housekeeping Console',  href: '/hotel/housekeeping', icon: BrushIcon },
      { name: 'Maintenance Control',   href: '/hotel/maintenance',  icon: Wrench    },
      { name: 'Lost & Found Registry', href: '/hotel/lost-found',   icon: MapPin    },
      { name: 'Laundry Service',       href: '/hotel/laundry',      icon: Shirt     },
      { name: 'Engineering Center',    href: '/hotel/engineering',  icon: Cpu       },
    ],
  },
  {
    name: 'Hospitality & Guest Services',
    emoji: '✨',
    labelColor: 'text-rose-400',
    dotColor: 'bg-rose-400',
    glowColor: 'rgba(251,113,133,0.3)',
    borderActive: 'rgba(251,113,133,0.55)',
    borderIdle: 'rgba(251,113,133,0.13)',
    gradFrom: 'rgba(251,113,133,0.13)',
    gradTo: 'rgba(251,113,133,0.04)',
    iconColor: 'text-rose-400',
    iconBg: 'bg-rose-500/15',
    cardBorder: 'border-slate-800 hover:border-rose-500/40',
    modules: [
      { name: 'Spa & Wellness',       href: '/hotel/spa',          icon: Sparkles },
      { name: 'Banquet & Events',     href: '/hotel/banquet',      icon: Calendar },
      { name: 'Live Music & Singers', href: '/hotel/singers',      icon: Sparkles },
      { name: 'Room Service Dining',  href: '/hotel/room-service', icon: ChefHat  },
      { name: 'Guest CRM Profiles',   href: '/hotel/crm',          icon: Users    },
      { name: 'Guest Directory',      href: '/hotel/guests',       icon: Users    },
      { name: 'Loyalty & Rewards',    href: '/hotel/loyalty',      icon: Crown    },
    ],
  },
  {
    name: 'Revenue & Analytics',
    emoji: '📈',
    labelColor: 'text-emerald-400',
    dotColor: 'bg-emerald-400',
    glowColor: 'rgba(52,211,153,0.3)',
    borderActive: 'rgba(52,211,153,0.55)',
    borderIdle: 'rgba(52,211,153,0.13)',
    gradFrom: 'rgba(52,211,153,0.13)',
    gradTo: 'rgba(52,211,153,0.04)',
    iconColor: 'text-emerald-400',
    iconBg: 'bg-emerald-500/15',
    cardBorder: 'border-slate-800 hover:border-emerald-500/40',
    modules: [
      { name: 'AI Revenue Advisor', href: '/hotel/revenue',         icon: TrendingUp },
      { name: 'Channel Manager',    href: '/hotel/channel-manager', icon: Globe      },
      { name: 'Analytics & BI',     href: '/hotel/analytics',       icon: BarChart3  },
      { name: 'Operations Reports', href: '/hotel/reports',         icon: ScrollText },
    ],
  },
  {
    name: 'Finance & Procurement',
    emoji: '💰',
    labelColor: 'text-amber-400',
    dotColor: 'bg-amber-400',
    glowColor: 'rgba(251,191,36,0.3)',
    borderActive: 'rgba(251,191,36,0.55)',
    borderIdle: 'rgba(251,191,36,0.13)',
    gradFrom: 'rgba(251,191,36,0.13)',
    gradTo: 'rgba(251,191,36,0.04)',
    iconColor: 'text-amber-400',
    iconBg: 'bg-amber-500/15',
    cardBorder: 'border-slate-800 hover:border-amber-500/40',
    modules: [
      { name: 'Folios & Billing',    href: '/hotel/billing',           icon: Receipt     },
      { name: 'Invoices Registry',   href: '/hotel/billing/invoices',  icon: ScrollText  },
      { name: 'Night Audit Console', href: '/hotel/night-audit',       icon: Moon        },
      { name: 'Expenses Controller', href: '/hotel/expenses',          icon: Banknote    },
      { name: 'Add New Expense',     href: '/hotel/expenses/new',      icon: PlusCircle  },
      { name: 'Payroll Structures',  href: '/hotel/payroll',           icon: IndianRupee },
      { name: 'Inventory & Stock',   href: '/hotel/inventory',         icon: Package     },
      { name: 'Vendor Directory',    href: '/hotel/vendor',            icon: Building2   },
      { name: 'Accounting Hub',      href: '/hotel/accounts',          icon: BookOpen    },
      { name: 'Cash Book',           href: '/hotel/accounts/cash-book', icon: Banknote   },
      { name: 'Day Book',            href: '/hotel/accounts/day-book',  icon: BookOpen   },
      { name: 'Ledger',              href: '/hotel/accounts/ledger',    icon: BookOpen   },
      { name: 'Vouchers',            href: '/hotel/vouchers',           icon: Receipt    },
      { name: 'New Voucher',         href: '/hotel/vouchers/new',       icon: PlusCircle },
    ],
  },
  {
    name: 'AI & Smart Hotel',
    emoji: '🤖',
    labelColor: 'text-indigo-400',
    dotColor: 'bg-indigo-400',
    glowColor: 'rgba(129,140,248,0.3)',
    borderActive: 'rgba(129,140,248,0.55)',
    borderIdle: 'rgba(129,140,248,0.13)',
    gradFrom: 'rgba(129,140,248,0.13)',
    gradTo: 'rgba(129,140,248,0.04)',
    iconColor: 'text-indigo-400',
    iconBg: 'bg-indigo-500/15',
    cardBorder: 'border-slate-800 hover:border-indigo-500/40',
    modules: [
      { name: 'AI Concierge Desk', href: '/hotel/ai-concierge',   icon: Brain },
      { name: 'Room Tablet Portal', href: '/hotel/room-portal-admin', icon: Tablet },
      { name: 'Smart Hotel IoT',   href: '/hotel/smart-hotel',    icon: Wifi  },
      { name: 'Booking Engine',    href: '/hotel/booking-engine', icon: Globe },
    ],
  },
  {
    name: 'Staff & GPS Attendance',
    emoji: '📍',
    labelColor: 'text-emerald-400',
    dotColor: 'bg-emerald-400',
    glowColor: 'rgba(52,211,153,0.3)',
    borderActive: 'rgba(52,211,153,0.55)',
    borderIdle: 'rgba(52,211,153,0.13)',
    gradFrom: 'rgba(52,211,153,0.13)',
    gradTo: 'rgba(52,211,153,0.04)',
    iconColor: 'text-emerald-400',
    iconBg: 'bg-emerald-500/15',
    cardBorder: 'border-slate-800 hover:border-emerald-500/40',
    modules: [
      { name: 'Live GPS Tracking',        href: '/hotel/staff?tab=location',        icon: MapPin       },
      { name: 'Staff Attendance Hub',     href: '/hotel/staff/attendance',          icon: UserCheck    },
      { name: 'Punch Locations Verifier', href: '/hotel/staff/attendance-location', icon: Navigation   },
      { name: 'Live Proximity Radar',     href: '/hotel/staff/location',            icon: Radio        },
      { name: 'Staff Directory & Roster', href: '/hotel/staff',                     icon: Users        },
      { name: 'Attendance Reports',       href: '/hotel/reports/attendance',        icon: ScrollText   },
      { name: 'HR & Leaves Hub',          href: '/hotel/hr',                        icon: Calendar     },
      { name: 'Payroll Structures',       href: '/hotel/payroll',                   icon: IndianRupee  },
    ],
  },
  {
    name: 'Restaurant & POS',
    emoji: '🍽️',
    labelColor: 'text-orange-400',
    dotColor: 'bg-orange-400',
    glowColor: 'rgba(251,146,60,0.3)',
    borderActive: 'rgba(251,146,60,0.55)',
    borderIdle: 'rgba(251,146,60,0.15)',
    gradFrom: 'rgba(251,146,60,0.13)',
    gradTo: 'rgba(251,146,60,0.04)',
    iconColor: 'text-orange-400',
    iconBg: 'bg-orange-500/15',
    cardBorder: 'border-slate-800 hover:border-orange-500/40',
    modules: [
      { name: 'Restaurant Operations', href: '/hotel/pos',                     icon: UtensilsCrossed },
      { name: 'Live Notifications',    href: '/hotel/pos/notifications',        icon: Bell            },
      { name: 'Room Orders',           href: '/hotel/pos/room-service',         icon: ChefHat         },
      { name: 'Live Occupancy',        href: '/hotel/pos/occupancy',            icon: Eye             },
      { name: 'Table Layout',          href: '/hotel/pos/tables',               icon: LayoutGrid      },
      { name: 'QR Gallery',            href: '/hotel/pos/tables/qr-gallery',    icon: Printer         },
      { name: 'QR Downloads',          href: '/hotel/pos/qr-download',          icon: Download        },
      { name: 'Waste Management',      href: '/hotel/pos/waste-management',     icon: Trash2          },
      { name: 'Parking Management',    href: '/hotel/pos/parking',              icon: MapPin          },
      { name: 'Delivery Management',   href: '/hotel/pos/delivery',             icon: Bike            },
      { name: 'Delivery Analytics',    href: '/hotel/pos/delivery/analytics',   icon: BarChart3       },
      { name: 'Delivery Riders',       href: '/hotel/pos/delivery/riders',      icon: Users           },
      { name: 'Delivery Zones',        href: '/hotel/pos/delivery/zones',       icon: MapPin          },
      { name: 'Delivery Flyer',        href: '/hotel/pos/delivery-flyer',       icon: FileText        },
    ],
  },
  {
    name: 'System Admin & Security',
    emoji: '🔐',
    labelColor: 'text-slate-400',
    dotColor: 'bg-slate-500',
    glowColor: 'rgba(148,163,184,0.2)',
    borderActive: 'rgba(148,163,184,0.45)',
    borderIdle: 'rgba(148,163,184,0.1)',
    gradFrom: 'rgba(148,163,184,0.1)',
    gradTo: 'rgba(148,163,184,0.03)',
    iconColor: 'text-slate-400',
    iconBg: 'bg-slate-700/40',
    cardBorder: 'border-slate-800 hover:border-slate-600/60',
    modules: [
      { name: 'Staff & Team',         href: '/hotel/staff',       icon: Users    },
      { name: 'Hotel Settings',       href: '/hotel/settings',          icon: Settings },
      { name: 'Printer Settings',     href: '/hotel/settings/printers', icon: Printer  },
    ],
  },
];

export default function HotelDashboard() {
  const [searchQuery, setSearchQuery]   = useState('');
  const [activeDept, setActiveDept]     = useState<string | null>(null);
  const [session, setSession]           = useState<any>(null);
  const [property, setProperty]         = useState<any>(null);

  // Demo Data Management
  const [hasDemoData, setHasDemoData]   = useState(false);
  const [demoInfo, setDemoInfo]         = useState<any>(null);
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearMode, setClearMode]       = useState<'bookings' | 'all'>('bookings');
  const [clearing, setClearing]         = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const checkDemoData = () => {
    fetch('/api/hotel/demo-data')
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data?.hasDemoData) {
          setHasDemoData(true);
          setDemoInfo(d.data);
        } else {
          setHasDemoData(false);
          setDemoInfo(null);
        }
      })
      .catch(() => {});
  };

  const [restaurantCode, setRestaurantCode] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/auth/session')
      .then(r => r.json())
      .then(d => {
        if (d.authenticated) {
          setSession(d.user);
          const isAttached = d.user?.businessType === 'BOTH' || (d.user?.isMultiProperty === true && d.user?.businessType !== 'BOTH_SEPARATE');
          if (isAttached) {
            fetch('/api/admin/properties')
              .then(r => r.json())
              .then(data => {
                if (data.success && Array.isArray(data.data)) {
                  const rst = data.data.find((p: any) => p.type !== 'HOTEL');
                  if (rst?.code) setRestaurantCode(rst.code);
                }
              })
              .catch(() => {});
          }
        }
      })
      .catch(() => {});
    fetch('/api/setup/properties/current')
      .then(r => r.json())
      .then(d => { if (d.success) setProperty(d.data); })
      .catch(() => {});
    checkDemoData();
  }, []);

  const handleClearDemoData = async () => {
    setClearing(true);
    try {
      const res = await fetch(`/api/hotel/demo-data?mode=${clearMode}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setHasDemoData(false);
        setShowClearModal(false);
        setToastMessage(data.message || 'Demo data removed successfully!');
        setTimeout(() => setToastMessage(null), 5000);
      } else {
        alert(data.error || 'Failed to remove demo data');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to remove demo data');
    } finally {
      setClearing(false);
    }
  };

  const isSearching = searchQuery.trim().length > 0;

  const isAttached = session?.businessType === 'BOTH' || (session?.isMultiProperty === true && session?.businessType !== 'BOTH_SEPARATE');

  const visibleDepartments = DEPARTMENTS.filter(dept => {
    if (dept.name === 'Restaurant & POS') {
      return isAttached && !!restaurantCode;
    }
    return true;
  });

  const departmentsWithRestaurant = visibleDepartments.map((dept) => {
    if (dept.name === 'Restaurant & POS' && restaurantCode) {
      return {
        ...dept,
        modules: [
          { name: 'Restaurant POS Hub', href: `/hotel/pos`, icon: UtensilsCrossed },
          { name: 'POS Billing Terminal', href: `/hotel/pos/billing`, icon: Monitor },
          { name: 'Table Layout', href: `/hotel/pos/tables`, icon: LayoutGrid },
          { name: 'Kitchen Display', href: `/hotel/pos/kitchen-display`, icon: Eye },
          ...dept.modules.filter(m => m.name !== 'Restaurant Operations' && m.name !== 'Restaurant POS Hub'),
        ],
      };
    }
    return dept;
  });

  const filteredDepartments = departmentsWithRestaurant.map((dept) => {
    const matchingModules = dept.modules.filter((m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dept.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return { ...dept, modules: matchingModules };
  }).filter((dept) => dept.modules.length > 0);

  const toggle = (name: string) =>
    setActiveDept(prev => (prev === name ? null : name));

  useEffect(() => {
    if (activeDept && !departmentsWithRestaurant.some(d => d.name === activeDept)) {
      setActiveDept(null);
    }
  }, [departmentsWithRestaurant, activeDept]);

  // Greeting based on time
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const greetingEmoji = hour < 12 ? '🌅' : hour < 17 ? '☀️' : '🌙';

  const hotelName = property?.name || session?.organizationName || 'Your Hotel';
  const userName  = session?.fullName || session?.name || 'Admin';

  return (
    <div className="pb-12 max-w-[1500px] mx-auto select-none">

      {/* ── Premium Welcome Header ── */}
      <div className="relative mb-8 overflow-hidden rounded-3xl" style={{
        background: 'linear-gradient(135deg, #0d1117 0%, #0f172a 50%, #0d1525 100%)',
        border: '1px solid rgba(99,102,241,0.15)',
      }}>
        {/* Rich background layers */}
        <div className="pointer-events-none absolute inset-0"
          style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.18) 0%, transparent 55%, rgba(139,92,246,0.10) 100%)' }} />
        {/* Grid pattern */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg,#fff 0,#fff 1px,transparent 1px,transparent 40px),repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 1px,transparent 40px)' }} />
        {/* Glow orb top-left */}
        <div className="pointer-events-none absolute -top-16 -left-16 w-72 h-72 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.35) 0%, transparent 65%)', filter: 'blur(2px)' }} />
        {/* Glow orb bottom-right */}
        <div className="pointer-events-none absolute -bottom-12 -right-12 w-56 h-56 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.25) 0%, transparent 65%)', filter: 'blur(2px)' }} />

        {/* ── 3-column grid layout ── */}
        <div className="relative grid grid-cols-3 items-center px-7 py-6 min-h-[120px]">

          {/* COL 1 — Left: breadcrumb + date/time */}
          <div className="flex flex-col justify-center gap-2">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.25em]">
                GuestFlow &nbsp;·&nbsp; Hotel PMS
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-500 font-medium">
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
            <span className="inline-flex items-center gap-1.5 w-fit px-2.5 py-0.5 rounded-full text-[10px] font-bold text-emerald-400"
              style={{ background: 'rgba(52,211,153,0.10)', border: '1px solid rgba(52,211,153,0.20)' }}>
              <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
              <LiveClock className="tabular-nums" />
              &nbsp;Live
            </span>
          </div>

          {/* COL 2 — CENTER: greeting + hotel name */}
          <div className="flex flex-col items-center justify-center text-center gap-2">
            {/* Greeting */}
            <div className="flex items-center gap-1.5">
              <span className="text-base leading-none">{greetingEmoji}</span>
              <span className="text-sm font-semibold" style={{ color: 'rgba(165,180,252,0.85)' }}>
                {greeting}, <span className="font-black text-indigo-300">{userName}!</span>
              </span>
            </div>

            {/* Hotel Name — hero, centered */}
            <h1
              className="font-black leading-none tracking-tight"
              style={{
                fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)',
                background: 'linear-gradient(110deg, #ffffff 0%, #c7d2fe 45%, #a78bfa 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
              {hotelName}
            </h1>

            {/* Gold Premium badge */}
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black text-amber-300"
              style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.25)' }}>
              <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
              Premium Hotel
            </span>
          </div>

          {/* COL 3 — Right: search + New Booking */}
          <div className="flex items-center justify-end gap-2.5">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
              <input
                type="text"
                placeholder="Search modules..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-44 pl-9 pr-7 text-[12px] font-medium text-white placeholder-slate-600 rounded-xl outline-none transition-all duration-200"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: searchQuery ? '1px solid rgba(99,102,241,0.6)' : '1px solid rgba(255,255,255,0.09)',
                  boxShadow: searchQuery ? '0 0 0 3px rgba(99,102,241,0.15), inset 0 1px 3px rgba(0,0,0,0.3)' : 'inset 0 1px 3px rgba(0,0,0,0.2)',
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300 transition-colors"
                >
                  <X size={11} />
                </button>
              )}
            </div>

            {/* New Booking */}
            <Link
              href="/hotel/bookings"
              className="relative group h-10 flex items-center gap-2 px-5 rounded-xl text-[12px] font-black text-white overflow-hidden transition-all duration-200 active:scale-95 flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)',
                boxShadow: '0 0 0 1px rgba(99,102,241,0.4), 0 6px 24px rgba(99,102,241,0.35), inset 0 1px 0 rgba(255,255,255,0.18)',
              }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 0 0 1px rgba(99,102,241,0.6), 0 8px 32px rgba(99,102,241,0.5), inset 0 1px 0 rgba(255,255,255,0.18)')}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 0 0 1px rgba(99,102,241,0.4), 0 6px 24px rgba(99,102,241,0.35), inset 0 1px 0 rgba(255,255,255,0.18)')}
            >
              <span className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)' }} />
              <PlusCircle size={14} className="flex-shrink-0 relative z-10" />
              <span className="relative z-10 tracking-wide">New Booking</span>
            </Link>
          </div>
        </div>

        {/* Thin accent line at bottom */}
        <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, rgba(99,102,241,0.5) 0%, rgba(139,92,246,0.3) 50%, transparent 100%)' }} />
      </div>

      {/* ── Demo Data Active Banner ── */}
      {hasDemoData && (
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-2">
                Sample Demo Data Loaded
                {demoInfo && (
                  <span className="text-[10px] font-semibold text-slate-400 normal-case">
                    ({demoInfo.demoReservationsCount} Bookings, {demoInfo.demoGuestsCount} Guests, {demoInfo.demoRoomsCount} Rooms)
                  </span>
                )}
              </p>
              <p className="text-xs text-slate-300 mt-0.5">
                Your dashboard currently has demo bookings (Tarun Sharma, Priya Patel). You can remove demo data anytime to start clean.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowClearModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1.5 shrink-0"
          >
            <span>🗑️</span> Remove Demo Data
          </button>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="mb-4 p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2 shadow-lg animate-fade-in">
          <span>✅</span> {toastMessage}
        </div>
      )}

      {/* ── Search mode: flat expanded results ── */}
      {isSearching ? (
        filteredDepartments.length === 0 ? (
          <div className="py-20 text-center rounded-2xl border border-slate-800 text-slate-500 text-sm">
            🔍 No results for &quot;{searchQuery}&quot;
            <p className="text-xs text-slate-600 mt-1">Try: bookings, rooms, billing, spa…</p>
          </div>
        ) : (
          <div className="space-y-8">
            {filteredDepartments.map((dept) => (
              <div key={dept.name}>
                <div className="flex items-center gap-2.5 mb-4">
                  <span className={`w-2 h-2 rounded-full ${dept.dotColor}`} />
                  <span className={`text-xs font-bold uppercase tracking-widest ${dept.labelColor}`}>{dept.name}</span>
                  <div className="flex-1 h-px bg-slate-800" />
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                  {dept.modules.map((mod) => (
                    <ModuleCard key={mod.name} name={mod.name} href={mod.href} icon={mod.icon}
                      iconColor={dept.iconColor} iconBg={dept.iconBg} cardBorder={dept.cardBorder} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* ── Normal mode ── */
        <div className="space-y-3">

          {/* Step 1 — Category Boxes in a grid (always visible) */}
          <div className={`grid grid-cols-2 sm:grid-cols-4 ${departmentsWithRestaurant.length > 8 ? 'lg:grid-cols-9' : 'lg:grid-cols-8'} gap-3 mb-2`}>
            {departmentsWithRestaurant.map((dept) => {
              const isActive = activeDept === dept.name;
              return (
                <button
                  key={dept.name}
                  onClick={() => toggle(dept.name)}
                  className="group relative flex flex-col items-center justify-center gap-2 p-4 rounded-2xl transition-all duration-300 text-center cursor-pointer active:scale-95"
                  style={{
                    background: isActive
                      ? `linear-gradient(135deg, ${dept.gradFrom} 0%, ${dept.gradTo} 100%)`
                      : 'rgba(15,23,42,0.85)',
                    border: `1px solid ${isActive ? dept.borderActive : dept.borderIdle}`,
                    boxShadow: isActive ? `0 0 24px ${dept.glowColor}` : 'none',
                  }}
                >
                  {/* Emoji */}
                  <span className="text-2xl leading-none">{dept.emoji}</span>
                  {/* Name */}
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wide leading-tight transition-colors ${isActive ? dept.labelColor : 'text-slate-500 group-hover:text-slate-300'}`}
                  >
                    {dept.name}
                  </span>
                  {/* Module count badge */}
                  <span
                    className="text-[9px] font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      background: isActive ? dept.gradFrom : 'rgba(255,255,255,0.05)',
                      color: isActive ? 'white' : 'rgb(100,116,139)',
                      border: `1px solid ${isActive ? dept.borderActive : 'rgba(255,255,255,0.07)'}`,
                    }}
                  >
                    {dept.modules.length} modules
                  </span>
                  {/* Active indicator dot */}
                  {isActive && (
                    <span
                      className={`absolute bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${dept.dotColor}`}
                      style={{ boxShadow: `0 0 6px ${dept.glowColor}` }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Step 2 — Expanded modules panel (slides open below grid) */}
          {departmentsWithRestaurant.map((dept) => {
            const isActive = activeDept === dept.name;
            return (
              <div
                key={dept.name}
                style={{
                  maxHeight: isActive ? '1200px' : '0px',
                  overflow: 'hidden',
                  transition: 'max-height 0.4s cubic-bezier(0.4,0,0.2,1)',
                  marginTop: isActive ? '4px' : '0px',
                }}
              >
                {/* Panel header */}
                <div
                  className="rounded-2xl p-4"
                  style={{
                    background: `linear-gradient(135deg, ${dept.gradFrom} 0%, rgba(9,14,26,0.95) 100%)`,
                    border: `1px solid ${dept.borderActive}`,
                    boxShadow: `0 4px 32px ${dept.glowColor}`,
                  }}
                >
                  {/* Panel label */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`w-2 h-2 rounded-full ${dept.dotColor}`} />
                    <span className={`text-xs font-bold uppercase tracking-widest ${dept.labelColor}`}>
                      {dept.name}
                    </span>
                    <div className="flex-1 h-px" style={{ background: dept.borderActive }} />
                    <button
                      onClick={() => toggle(dept.name)}
                      className="text-slate-500 hover:text-slate-300 transition-colors p-1"
                    >
                      <ChevronDown size={13} style={{ transform: 'rotate(180deg)' }} />
                    </button>
                  </div>

                  {/* POS Quick Actions Topbar (Dine In, Take Away, Live Order, Displays, Music, Search, Support) */}
                  {dept.name === 'Restaurant & POS' && (
                    <RestaurantPosHeaderBar restaurantCode={restaurantCode} />
                  )}

                  {/* Sub-module cards grid */}
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                    {dept.modules.map((mod) => (
                      <ModuleCard
                        key={mod.name}
                        name={mod.name}
                        href={mod.href}
                        icon={mod.icon}
                        iconColor={dept.iconColor}
                        iconBg={dept.iconBg}
                        cardBorder={dept.cardBorder}
                      />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Remove Demo Data Confirmation Modal ── */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#0f172a] border border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 text-xl">
                🗑️
              </div>
              <div>
                <h3 className="text-base font-black text-white">Remove Demo Data</h3>
                <p className="text-xs text-slate-400">Clean up sample data from your hotel account</p>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <label className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${clearMode === 'bookings' ? 'bg-indigo-500/10 border-indigo-500/50' : 'bg-slate-900 border-slate-800'}`}>
                <input
                  type="radio"
                  name="clearMode"
                  checked={clearMode === 'bookings'}
                  onChange={() => setClearMode('bookings')}
                  className="mt-1 accent-indigo-500"
                />
                <div>
                  <p className="text-xs font-bold text-white">Remove Demo Bookings & Guests Only (Recommended)</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Deletes sample bookings for Tarun & Priya and folios. Keeps your Room Types and Rooms (101-203) and sets them to Available.
                  </p>
                </div>
              </label>

              <label className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${clearMode === 'all' ? 'bg-rose-500/10 border-rose-500/50' : 'bg-slate-900 border-slate-800'}`}>
                <input
                  type="radio"
                  name="clearMode"
                  checked={clearMode === 'all'}
                  onChange={() => setClearMode('all')}
                  className="mt-1 accent-rose-500"
                />
                <div>
                  <p className="text-xs font-bold text-rose-300">Remove All Demo Data (Complete Reset)</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Deletes demo bookings, sample guests, AND sample rooms & room types. Start 100% blank.
                  </p>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={clearing}
                onClick={() => setShowClearModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={clearing}
                onClick={handleClearDemoData}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
              >
                {clearing ? 'Removing...' : 'Confirm & Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
