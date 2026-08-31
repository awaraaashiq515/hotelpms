'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSidebar } from './SidebarContext';
import {
  LayoutDashboard,
  Calendar,
  Bed,
  Bell,
  PlusCircle,
  UserCheck,
  Receipt,
  Wrench,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Users,
  BarChart3,
  Settings,
  DoorOpen,
  BrushIcon,
  ClipboardList,
  MapPin,
  Building2,
  ChevronDown,
  ChevronUp,
  ScrollText,
  Banknote,
  Star,
  ShieldCheck,
  ChefHat,
  Globe,
  TrendingUp,
  Shirt,
  Sparkles,
  Moon,
  Package,
  Brain,
  ShoppingCart,
  IndianRupee,
  Crown,
  Cpu,
  Wifi,
  Shield,
  Key,
  Music,
  MessageCircle,
  Waves,
  Tag,
  UtensilsCrossed,
  Handshake,
} from 'lucide-react';

interface NavItem {
  name: string;
  path: string;
  icon: React.FC<{ size?: number; className?: string }>;
  badge?: string;
  badgeColor?: string;
}

interface NavGroup {
  label: string;
  emoji: string;
  color: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    emoji: '📊',
    color: 'text-indigo-400',
    items: [
      { name: 'Dashboard', path: '/hotel', icon: LayoutDashboard },
      { name: 'Notifications', path: '/hotel/notifications', icon: Bell },
    ],
  },
  {
    label: 'Front Office',
    emoji: '🏨',
    color: 'text-sky-400',
    items: [
      { name: 'Bookings',           path: '/hotel/bookings',        icon: PlusCircle },
      { name: 'Agent Bookings',     path: '/hotel/agent-bookings', icon: Handshake, badge: 'NEW', badgeColor: 'bg-violet-500/20 text-violet-300' },
      { name: 'Availability',       path: '/hotel/calendar',       icon: Calendar },
      { name: 'Check-out',          path: '/hotel/checkout',       icon: DoorOpen },
      { name: 'Email Bookings',     path: '/hotel/email-bookings', icon: ScrollText },
    ],
  },
  {
    label: 'Revenue & Distribution',
    emoji: '📈',
    color: 'text-emerald-400',
    items: [
      { name: 'Revenue Management', path: '/hotel/revenue',         icon: TrendingUp, badge: 'AI', badgeColor: 'bg-violet-500/20 text-violet-300' },
      { name: 'Channel Manager',    path: '/hotel/channel-manager', icon: Globe },
      { name: 'Analytics & BI',     path: '/hotel/analytics',       icon: BarChart3 },
      { name: 'Reports',            path: '/hotel/reports',         icon: ScrollText },
    ],
  },
  {
    label: 'Rooms',
    emoji: '🛏️',
    color: 'text-violet-400',
    items: [
      { name: 'Rooms & Types',      path: '/hotel/rooms',           icon: Bed },
      { name: 'Room Status Board',  path: '/hotel/rooms/board',     icon: MapPin },
    ],
  },
  {
    label: 'Operations',
    emoji: '⚙️',
    color: 'text-amber-400',
    items: [
      { name: 'Housekeeping',       path: '/hotel/housekeeping',    icon: BrushIcon },
      { name: 'Maintenance',        path: '/hotel/maintenance',      icon: Wrench },
      { name: 'Engineering',        path: '/hotel/engineering',      icon: Cpu },
      { name: 'Lost & Found',       path: '/hotel/lost-found',       icon: MapPin },
      { name: 'Laundry',            path: '/hotel/laundry',          icon: Shirt },
    ],
  },
  {
    label: 'Procurement',
    emoji: '🛒',
    color: 'text-orange-400',
    items: [
      { name: 'Inventory & Stock',  path: '/hotel/inventory',        icon: Package },
      { name: 'Vendor Management',  path: '/hotel/vendor',           icon: Building2 },
    ],
  },
  {
    label: 'Hospitality',
    emoji: '✨',
    color: 'text-pink-400',
    items: [
      { name: 'Spa & Wellness',     path: '/hotel/spa',             icon: Sparkles },
      { name: 'Swimming Pool',      path: '/hotel/pool',            icon: Waves, badge: 'POOL', badgeColor: 'bg-cyan-500/20 text-cyan-300' },
      { name: 'Banquet & Events',   path: '/hotel/banquet',         icon: Calendar },
      { name: 'Live Music',         path: '/hotel/singers',         icon: Music },
      { name: 'Room Service',       path: '/hotel/room-service',    icon: ChefHat },
    ],
  },
  {
    label: 'Finance',
    emoji: '💰',
    color: 'text-emerald-400',
    items: [
      { name: 'Folios & Billing',   path: '/hotel/billing',          icon: Receipt },
      { name: 'Invoices',           path: '/hotel/billing/invoices', icon: ScrollText },
      { name: 'Night Audit',        path: '/hotel/night-audit',      icon: Moon },
      { name: 'Expenses',           path: '/hotel/billing/expenses', icon: Banknote },
      { name: 'Payroll',            path: '/hotel/payroll',          icon: IndianRupee },
    ],
  },
  {
    label: 'Guests & CRM',
    emoji: '👥',
    color: 'text-rose-400',
    items: [
      { name: 'Guest CRM',          path: '/hotel/crm',             icon: Users, badge: 'CRM', badgeColor: 'bg-purple-500/20 text-purple-300' },
      { name: 'Loyalty & Rewards',  path: '/hotel/loyalty',          icon: Crown },
      { name: 'Travel Agents',      path: '/hotel/agents',           icon: Handshake, badge: 'NEW', badgeColor: 'bg-violet-500/20 text-violet-300' },
    ],
  },
  {
    label: 'AI Features',
    emoji: '🤖',
    color: 'text-violet-400',
    items: [
      { name: 'AI Concierge',       path: '/hotel/ai-concierge',     icon: Brain, badge: 'AI', badgeColor: 'bg-violet-500/20 text-violet-300' },
      { name: 'Smart Hotel IoT',    path: '/hotel/smart-hotel',      icon: Wifi },
      { name: 'Booking Engine',     path: '/hotel/booking-engine',   icon: Globe },
    ],
  },
  {
    label: 'HR & Staff',
    emoji: '👤',
    color: 'text-blue-400',
    items: [
      { name: 'Staff & Team',       path: '/hotel/staff',            icon: Users },
    ],
  },
  {
    label: 'Admin & Security',
    emoji: '🔐',
    color: 'text-slate-400',
    items: [
      { name: 'Security Center',    path: '/hotel/security',                          icon: Shield },
      { name: 'WhatsApp Settings',  path: '/hotel/super-admin/whatsapp-settings',      icon: MessageCircle, badge: 'WA', badgeColor: 'bg-green-500/20 text-green-300' },
      { name: 'Super Admin',        path: '/hotel/super-admin',                        icon: Crown, badge: 'SaaS', badgeColor: 'bg-yellow-500/20 text-yellow-300' },
    ],
  },
  {
    label: 'Settings',
    emoji: '⚙️',
    color: 'text-slate-400',
    items: [
      { name: 'My Plan / Subscription', path: '/hotel/subscription', icon: Sparkles, badge: 'PLAN', badgeColor: 'bg-violet-500/20 text-violet-300' },
      { name: 'Hotel Settings',         path: '/hotel/settings',     icon: Settings },
    ],
  },
];

export const HotelSidebar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { isOpen, toggle } = useSidebar();
  const [collapsedGroups, setCollapsedGroups] = React.useState<Set<string>>(new Set());
  const [hasRestaurant, setHasRestaurant] = React.useState(false);
  const [restaurantCode, setRestaurantCode] = React.useState<string | null>(null);

  // Detect if this org also has a restaurant property (BOTH business type)
  React.useEffect(() => {
    fetch('/api/admin/properties')
      .then(r => r.json())
      .then(d => {
        if (d.success && Array.isArray(d.data)) {
          const rst = d.data.find((p: any) => p.type !== 'HOTEL');
          if (rst) {
            setHasRestaurant(true);
            setRestaurantCode(rst.code || null);
          }
        }
      })
      .catch(() => {});
  }, []);

  const toggleGroup = (label: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const isActive = (path: string) => {
    if (path === '/hotel') return pathname === '/hotel';
    return pathname.startsWith(path);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('Logout failed', e);
    }
    router.push('/login');
    router.refresh();
  };

  return (
    <aside
      className={`
        bg-[#080d1a] text-slate-200 flex flex-col sticky top-0 left-0 h-screen z-40
        shadow-2xl border-r border-slate-800/60
        transition-all duration-300 ease-in-out shrink-0
        ${isOpen ? 'w-[260px]' : 'w-[68px]'}
      `}
    >
      {/* ── Brand ── */}
      <div className="px-4 py-5 border-b border-slate-800/60 bg-gradient-to-b from-slate-900/80 to-transparent flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
            <span className="text-white font-black text-lg italic">H</span>
          </div>
          {isOpen && (
            <div className="min-w-0">
              <p className="text-sm font-black text-white tracking-tight leading-none">
                Guest<span className="text-indigo-400 font-light">Flow</span> <span className="text-violet-400 text-xs font-black">AI</span>
              </p>
              <p className="text-[9px] text-indigo-300/70 font-bold uppercase tracking-widest mt-1">
                Hotel PMS
              </p>
            </div>
          )}
        </div>
        <button
          onClick={toggle}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors shrink-0"
        >
          {isOpen ? <ChevronLeft size={15} /> : <ChevronRight size={15} />}
        </button>
      </div>

      {/* ── Nav Groups ── */}
      <div className="flex-1 overflow-y-auto py-3 space-y-0.5 px-2 no-scrollbar">
        {NAV_GROUPS.map((group) => {
          const isCollapsed = collapsedGroups.has(group.label);
          const hasActive = group.items.some(i => isActive(i.path));

          return (
            <div key={group.label} className="mb-1">
              {/* Group Header */}
              {isOpen && (
                <button
                  onClick={() => toggleGroup(group.label)}
                  className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg transition-colors mb-0.5 group
                    ${hasActive ? 'text-white' : 'text-slate-500 hover:text-slate-300'}
                  `}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[11px]">{group.emoji}</span>
                    <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${group.color}`}>
                      {group.label}
                    </span>
                  </div>
                  {isCollapsed
                    ? <ChevronDown size={10} className="text-slate-600" />
                    : <ChevronUp size={10} className="text-slate-600" />
                  }
                </button>
              )}

              {/* Group Items */}
              {(!isCollapsed || !isOpen) && (
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const active = isActive(item.path);
                    return (
                      <Link
                        key={item.path}
                        href={item.path}
                        title={!isOpen ? item.name : undefined}
                        className={`
                          w-full flex items-center rounded-xl transition-all duration-200 group relative
                          ${isOpen ? 'px-3 py-2.5 gap-3' : 'px-0 py-2.5 justify-center'}
                          ${active
                            ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                            : 'hover:bg-slate-800/60 text-slate-500 hover:text-slate-200 border border-transparent'
                          }
                        `}
                      >
                        {/* Active indicator */}
                        {active && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-indigo-400" />
                        )}
                        <item.icon
                          size={16}
                          className={active ? 'text-indigo-400' : 'text-slate-600 group-hover:text-slate-300 transition-colors'}
                        />
                        {isOpen && (
                          <span className={`text-xs font-semibold tracking-tight ${active ? 'text-indigo-200' : ''}`}>
                            {item.name}
                          </span>
                        )}
                        {isOpen && item.badge && (
                          <span className={`ml-auto text-[9px] font-black px-1.5 py-0.5 rounded-full ${item.badgeColor || 'bg-indigo-500/20 text-indigo-400'}`}>
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* Divider between groups when open */}
              {isOpen && <div className="h-px bg-slate-800/40 mt-2 mx-1" />}
            </div>
          );
        })}
      </div>

      {/* ── Footer ── */}
      <div className="p-3 border-t border-slate-800/60 space-y-1 shrink-0 bg-slate-900/30">

        {/* Restaurant POS Switch — only shown for BOTH type (hotel + restaurant) */}
        {hasRestaurant && (
          <Link
            href={restaurantCode ? `/${restaurantCode}/billing` : '/billing'}
            title={!isOpen ? 'Restaurant POS' : undefined}
            className={`w-full flex items-center py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400 hover:text-emerald-300 transition-all text-xs font-bold group ${
              isOpen ? 'px-3 gap-2.5' : 'px-0 justify-center'
            }`}
          >
            <UtensilsCrossed size={14} className="group-hover:scale-110 transition-transform shrink-0" />
            {isOpen && (
              <span className="flex-1 truncate">Restaurant POS</span>
            )}
          </Link>
        )}

        {/* All Properties / Switch Property link (always visible) */}
        <Link
          href="/restaurantadmin"
          title={!isOpen ? 'All Properties' : undefined}
          className={`w-full flex items-center py-2 rounded-xl hover:bg-slate-800/60 text-slate-600 hover:text-slate-300 transition-all text-xs font-bold group ${isOpen ? 'px-3 gap-2.5' : 'px-0 justify-center'}`}
        >
          <Building2 size={14} className="group-hover:scale-110 transition-transform shrink-0" />
          {isOpen && <span>All Properties</span>}
        </Link>

        <button
          onClick={handleLogout}
          title={!isOpen ? 'Logout' : undefined}
          className={`w-full flex items-center py-2 rounded-xl hover:bg-red-950/40 text-slate-600 hover:text-red-400 transition-all text-xs font-bold group ${isOpen ? 'px-3 gap-2.5' : 'px-0 justify-center'}`}
        >
          <LogOut size={14} className="group-hover:rotate-12 transition-transform shrink-0" />
          {isOpen && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};
