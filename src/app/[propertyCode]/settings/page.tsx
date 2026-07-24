'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Printer,
  ShieldCheck,
  Globe,
  Wine,
  QrCode,
  MessageSquare,
  Coffee,
  Radio,
  Building2,
  ChevronRight,
  Settings,
  ArrowLeft,
  Calendar,
  Zap,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Lock as LockIcon,
  Truck,
  Palette,
  Music2,
} from 'lucide-react';

const ALL_FEATURES = [
  { key: 'POS', label: 'Point of Sale', description: 'Billing, KOT, counter payments & receipts', icon: '🛒' },
  { key: 'BARPOS', label: 'Bar POS', description: 'Bar-specific billing terminal, liquor menus & bar display', icon: '🍺' },
  { key: 'CAFEPOS', label: 'Cafe POS', description: 'Cafe order flow, quick billing & cafe display settings', icon: '☕' },
  { key: 'INVENTORY', label: 'Inventory Control', description: 'Real-time stock tracking, recipes & alert limits', icon: '📦' },
  { key: 'ACCOUNTING', label: 'Financial Accounting', description: 'Vouchers, ledger books, cash & day books', icon: '💰' },
  { key: 'HMS', label: 'Hotel Management', description: 'Room folios, guest check-ins & occupancy maps', icon: '🏨' },
  { key: 'TABLES', label: 'Table Management', description: 'Interactive floor layouts & guest bookings', icon: '🪑' },
  { key: 'TABLETS', label: 'Tablet / Waiter App', description: 'Digital KOT entry & quick tables tray builder', icon: '📱' },
  { key: 'REPORTS', label: 'Reports & Analytics', description: 'Sales, settlements, tax registers & audits', icon: '📊' },
  { key: 'GST', label: 'GST Filing Assist', description: 'Automatic generation of GSTR-1 & return drafts', icon: '📋' },
  { key: 'STAFF', label: 'Staff Directory', description: 'Staff designations, basic profiles & salary fields', icon: '👥' },
  { key: 'DRIVERS', label: 'Driver Tracking', description: 'Hyperlocal driver rosters, incentives & logs', icon: '🚗' },
  { key: 'CRM', label: 'CRM & Memberships', description: 'Guest details, loyalty points & membership cards', icon: '👤' },
  { key: 'OFFERS', label: 'Offers & Rewards', description: 'Driver reward campaigns & gift audit trackers', icon: '🎁' },
  { key: 'B2B', label: 'B2B Marketplace', description: 'Browse bulk supplies, raise orders & manage vendors', icon: '🚛' },
  { key: 'PARKING', label: 'Parking Management', description: 'Configure parking zones & valet check-in tokens', icon: '🅿️' },
  { key: 'WASTE', label: 'Waste Management', description: 'Log kitchen waste items, reasons & audit costs', icon: '🗑️' },
  { key: 'WHATSAPP', label: 'WhatsApp Bot & Alerts', description: 'Outbound bill notifications & conversational ordering chatbot', icon: '💬' },
  { key: 'WALKIETALKIE', label: 'Staff Walkie-Talkie', description: 'Real-time PTT voice lines & team communication', icon: '📡' },
  { key: 'GEOFENCING', label: 'Geofenced Attendance', description: 'Auditing clock-in locations against geofenced coordinates', icon: '📍' },
  { key: 'TIPS', label: 'Counter Tips & Gratuity', description: 'Tip inputs on payments checkout & staff tip summaries', icon: '💵' },
];

// --- Extracted Components ---
import { BusinessProfileForm } from '@/components/settings/BusinessProfileForm';
import { AiConfigForm } from '@/components/settings/AiConfigForm';
import { PosSecurityForm } from '@/components/settings/PosSecurityForm';
import { TabletSetupCard } from '@/components/settings/TabletSetupCard';
import { WebsiteBrandingForm } from '@/components/settings/WebsiteBrandingForm';
import { BarPosSettingsForm } from '@/components/settings/BarPosSettingsForm';
import { CafePosSettingsForm } from '@/components/settings/CafePosSettingsForm';
import { UpiPaymentForm } from '@/components/settings/UpiPaymentForm';
import { TwoFactorSection } from '@/components/settings/TwoFactorSection';
import { WhatsAppConfigForm } from '@/components/settings/WhatsAppConfigForm';
import { WalkieTalkieConfigForm } from '@/components/settings/WalkieTalkieConfigForm';
import { ChangePasswordForm } from '@/components/settings/ChangePasswordForm';
import { HomeDeliverySettingsForm } from '@/components/settings/HomeDeliverySettingsForm';
import { PosTerminalThemeForm } from '@/components/settings/PosTerminalThemeForm';
import { MusicSettingsForm } from '@/components/settings/MusicSettingsForm';

type TabId =
  | 'profile'
  | 'payments'
  | 'bar'
  | 'cafe'
  | 'delivery'
  | 'branding'
  | 'admin'
  | 'website'
  | 'printers'
  | 'whatsapp'
  | 'walkietalkie'
  | 'subscription'
  | 'theme'
  | 'music';

interface NavItem {
  id: TabId;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  activeBorder: string;
  superAdminOnly?: boolean;
}

interface NavGroup {
  groupLabel: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    groupLabel: 'General',
    items: [
      {
        id: 'profile',
        label: 'Business Profile',
        description: 'Name, address, GST & bill header',
        icon: Building2,
        color: 'text-orange-600 dark:text-orange-400',
        bgColor: 'bg-orange-50/80 dark:bg-orange-950/20',
        borderColor: 'border-orange-200 dark:border-orange-900/50',
        activeBorder: 'border-l-orange-500 dark:border-l-orange-400',
      },
      {
        id: 'subscription',
        label: 'Plan & Subscription',
        description: 'View active plan, features & expiry',
        icon: Calendar,
        color: 'text-rose-600 dark:text-rose-400',
        bgColor: 'bg-rose-50/80 dark:bg-rose-950/20',
        borderColor: 'border-rose-200 dark:border-rose-900/50',
        activeBorder: 'border-l-rose-500 dark:border-l-rose-400',
      },
      {
        id: 'printers',
        label: 'Printers',
        description: 'Thermal & kitchen printer setup',
        icon: Printer,
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-50/80 dark:bg-blue-950/20',
        borderColor: 'border-blue-200 dark:border-blue-900/50',
        activeBorder: 'border-l-blue-500 dark:border-l-blue-400',
      },
      {
        id: 'payments',
        label: 'UPI Payments',
        description: 'QR code & payment gateway config',
        icon: QrCode,
        color: 'text-indigo-600 dark:text-indigo-400',
        bgColor: 'bg-indigo-50/80 dark:bg-indigo-950/20',
        borderColor: 'border-indigo-200 dark:border-indigo-900/50',
        activeBorder: 'border-l-indigo-500 dark:border-l-indigo-400',
      },
    ],
  },
  {
    groupLabel: 'Integrations',
    items: [
      {
        id: 'whatsapp',
        label: 'WhatsApp Bot',
        description: 'Automated messaging & notifications',
        icon: MessageSquare,
        color: 'text-emerald-600 dark:text-emerald-400',
        bgColor: 'bg-emerald-50/80 dark:bg-emerald-950/20',
        borderColor: 'border-emerald-200 dark:border-emerald-900/50',
        activeBorder: 'border-l-emerald-500 dark:border-l-emerald-400',
      },
      {
        id: 'walkietalkie',
        label: 'Walkie-Talkie',
        description: 'Staff voice communication setup',
        icon: Radio,
        color: 'text-violet-600 dark:text-violet-400',
        bgColor: 'bg-violet-50/80 dark:bg-violet-950/20',
        borderColor: 'border-violet-200 dark:border-violet-900/50',
        activeBorder: 'border-l-violet-500 dark:border-l-violet-400',
      },
      {
        id: 'music' as TabId,
        label: 'Music Player',
        description: 'YouTube API key & playlist settings',
        icon: Music2,
        color: 'text-purple-600 dark:text-purple-400',
        bgColor: 'bg-purple-50/80 dark:bg-purple-950/20',
        borderColor: 'border-purple-200 dark:border-purple-900/50',
        activeBorder: 'border-l-purple-500 dark:border-l-purple-400',
        superAdminOnly: true,
      },
    ],
  },
  {
    groupLabel: 'POS Modules',
    items: [
      {
        id: 'bar',
        label: 'Bar POS',
        description: 'Bar-specific settings & shortcuts',
        icon: Wine,
        color: 'text-amber-600 dark:text-amber-400',
        bgColor: 'bg-amber-50/80 dark:bg-amber-950/20',
        borderColor: 'border-amber-200 dark:border-amber-900/50',
        activeBorder: 'border-l-amber-500 dark:border-l-amber-400',
      },
      {
        id: 'cafe',
        label: 'Cafe POS',
        description: 'Cafe order flow & display options',
        icon: Coffee,
        color: 'text-yellow-700 dark:text-yellow-500',
        bgColor: 'bg-yellow-50/80 dark:bg-yellow-950/20',
        borderColor: 'border-yellow-200 dark:border-yellow-900/50',
        activeBorder: 'border-l-yellow-600 dark:border-l-yellow-500',
      },
      {
        id: 'delivery',
        label: 'Home Delivery',
        description: 'Online ordering QR & settings',
        icon: Truck,
        color: 'text-indigo-600 dark:text-indigo-400',
        bgColor: 'bg-indigo-50/80 dark:bg-indigo-950/20',
        borderColor: 'border-indigo-200 dark:border-indigo-900/50',
        activeBorder: 'border-l-indigo-500 dark:border-l-indigo-400',
      },
      {
        id: 'theme',
        label: 'POS Themes',
        description: 'Assign display themes to terminals',
        icon: Palette,
        color: 'text-violet-600 dark:text-violet-400',
        bgColor: 'bg-violet-50/80 dark:bg-violet-950/20',
        borderColor: 'border-violet-200 dark:border-violet-900/50',
        activeBorder: 'border-l-violet-500 dark:border-l-violet-400',
      },
    ],
  },
  {
    groupLabel: 'Security & Admin',
    items: [
      {
        id: 'admin',
        label: 'Admin & Security',
        description: 'PIN lock, 2FA & password change',
        icon: ShieldCheck,
        color: 'text-slate-700 dark:text-slate-300',
        bgColor: 'bg-slate-100/80 dark:bg-slate-800/40',
        borderColor: 'border-slate-200 dark:border-slate-700',
        activeBorder: 'border-l-slate-600 dark:border-l-slate-400',
      },
      {
        id: 'website',
        label: 'Website (GuestFlow)',
        description: 'Branding, logo & online ordering',
        icon: Globe,
        color: 'text-rose-600 dark:text-rose-400',
        bgColor: 'bg-rose-50/80 dark:bg-rose-950/20',
        borderColor: 'border-rose-200 dark:border-rose-900/50',
        activeBorder: 'border-l-rose-500 dark:border-l-rose-400',
        superAdminOnly: true,
      },
    ],
  },
];

export default function SettingsPage() {
  const router = useRouter();
  const params = useParams();
  const propertyCode = params?.propertyCode as string | undefined;
  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const [session, setSession] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) setSession(data.user);
      })
      .catch((err) => console.error('Failed to fetch session', err));
  }, []);

  const isSuperAdmin = session?.role === 'SUPER_ADMIN';

  const activeItem = navGroups
    .flatMap((g) => g.items)
    .find((i) => i.id === activeTab);

  const handleTabChange = (id: TabId) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
  };

  const filteredGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => !item.superAdminOnly || isSuperAdmin
      ),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="h-[calc(100vh-96px)] lg:h-[calc(100vh-140px)] flex flex-col gap-5 overflow-hidden">
      {/* ── Page Title Bar ── */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <button
          onClick={() => router.push('/operations')}
          className="p-2 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-white flex items-center justify-center active:scale-95"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white tracking-tight uppercase flex items-center gap-2">
            <Settings size={20} className="text-gray-400 dark:text-slate-500" />
            Settings
          </h1>
          <p className="text-[10px] md:text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">
            Configure restaurant profile, rules & systems
          </p>
        </div>
      </div>

      {/* ── Mobile: Active Tab Header + Menu Toggle ── */}
      <div className="lg:hidden flex-shrink-0">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border ${activeItem?.borderColor ?? 'border-gray-200 dark:border-slate-800'} ${activeItem?.bgColor ?? 'bg-white dark:bg-slate-900'} shadow-sm`}
        >
          <div className="flex items-center gap-3">
            {activeItem && (
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${activeItem.bgColor}`}>
                <activeItem.icon size={16} className={activeItem.color} />
              </div>
            )}
            <div className="text-left">
              <p className={`text-xs font-black ${activeItem?.color ?? 'text-gray-900 dark:text-white'} uppercase tracking-wide`}>
                {activeItem?.label}
              </p>
              <p className="text-[10px] text-gray-400 dark:text-slate-500">{activeItem?.description}</p>
            </div>
          </div>
          <ChevronRight
            size={18}
            className={`text-gray-400 transition-transform ${mobileMenuOpen ? 'rotate-90' : ''}`}
          />
        </button>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="absolute left-4 right-4 mt-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden z-50 max-h-[60vh] overflow-y-auto">
            {filteredGroups.map((group) => (
              <div key={group.groupLabel}>
                <p className="px-4 pt-3 pb-1 text-[9px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">
                  {group.groupLabel}
                </p>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabChange(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors ${
                        isActive
                          ? `${item.bgColor} ${item.color}`
                          : 'text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${isActive ? item.bgColor : 'bg-gray-100 dark:bg-slate-800'}`}>
                        <Icon size={14} className={isActive ? item.color : 'text-gray-500 dark:text-slate-400'} />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-black uppercase tracking-wide">{item.label}</p>
                        <p className="text-[10px] text-gray-400 dark:text-slate-500">{item.description}</p>
                      </div>
                      {isActive && <ChevronRight size={14} className="ml-auto" />}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Main Layout: Sidebar + Content ── */}
      <div className="flex-1 flex gap-6 items-stretch overflow-hidden min-h-0">
        {/* ── LEFT SIDEBAR (desktop only) ── */}
        <aside className="hidden lg:flex flex-col w-64 xl:w-72 flex-shrink-0 overflow-y-auto no-scrollbar border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl p-2 shadow-sm">
          {filteredGroups.map((group, gi) => (
            <div key={group.groupLabel} className="space-y-1">
              {gi > 0 && <div className="h-px bg-gray-100 dark:bg-slate-800 mx-2 my-2" />}
              <div className="px-3 pt-2 pb-1">
                <p className="text-[9px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">
                  {group.groupLabel}
                </p>
              </div>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-200 group relative overflow-hidden border-l-4 ${
                      isActive
                        ? `${item.bgColor} ${item.activeBorder}`
                        : 'border-l-transparent hover:bg-gray-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    {/* Icon box */}
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                        isActive
                          ? 'bg-white dark:bg-slate-800 shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                          : 'bg-gray-100 dark:bg-slate-800 group-hover:bg-gray-200 dark:group-hover:bg-slate-700'
                      }`}
                    >
                      <Icon
                        size={16}
                        className={isActive ? item.color : 'text-gray-400 dark:text-slate-500 group-hover:text-gray-600 dark:group-hover:text-slate-300'}
                      />
                    </div>

                    {/* Label + description */}
                    <div className="text-left flex-1 min-w-0">
                      <p
                        className={`text-xs font-black uppercase tracking-wide truncate ${
                          isActive
                            ? item.color
                            : 'text-gray-700 dark:text-slate-200 group-hover:text-gray-900 dark:group-hover:text-white'
                        }`}
                      >
                        {item.label}
                      </p>
                      <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 truncate">
                        {item.description}
                      </p>
                    </div>

                    {/* Active indicator */}
                    {isActive && (
                      <ChevronRight size={14} className={`${item.color} flex-shrink-0`} />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </aside>

        {/* ── RIGHT CONTENT AREA ── */}
        <main className="flex-1 h-full overflow-y-auto no-scrollbar pb-10 pr-1 flex flex-col gap-3">
          {/* Breadcrumb */}
          <div className="hidden lg:flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500 flex-shrink-0">
            <span>Settings</span>
            <ChevronRight size={12} className="text-gray-300 dark:text-slate-700" />
            <span className={`font-black tracking-widest ${activeItem?.color ?? 'text-gray-700 dark:text-white'}`}>
              {activeItem?.label}
            </span>
          </div>

          {/* Content panels */}
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex-1" key={activeTab}>
            {activeTab === 'profile' && <BusinessProfileForm />}

            {activeTab === 'subscription' && (
              <SubscriptionPanel session={session} />
            )}

            {activeTab === 'printers' && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-gray-100 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center">
                    <Printer size={24} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Printer Management</h2>
                    <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">
                      Configure thermal & kitchen printers
                    </p>
                  </div>
                </div>
                <p className="text-gray-500 dark:text-slate-400 mb-6 text-xs font-medium leading-relaxed">
                  Manage your thermal printers for billing and kitchen orders. Configure IP addresses, paper sizes, and roles.
                </p>
                <button
                  onClick={() => (window.location.href = '/settings/printers')}
                  className="flex items-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest rounded-2xl transition-all shadow-md hover:shadow-lg active:scale-[0.98] text-[10px]"
                >
                  <Printer size={16} />
                  Go to Printer Settings
                  <ChevronRight size={16} />
                </button>
              </div>
            )}

            {activeTab === 'payments' && <UpiPaymentForm />}

            {activeTab === 'whatsapp' && <WhatsAppConfigForm />}

            {activeTab === 'walkietalkie' && <WalkieTalkieConfigForm />}

            {activeTab === 'bar' && <BarPosSettingsForm />}

            {activeTab === 'cafe' && <CafePosSettingsForm />}

            {activeTab === 'delivery' && <HomeDeliverySettingsForm />}

            {activeTab === 'theme' && <PosTerminalThemeForm propertyCode={propertyCode} />}

            {activeTab === 'music' && isSuperAdmin && <MusicSettingsForm />}

            {activeTab === 'admin' && (
              <div className="flex flex-col gap-6">
                {isSuperAdmin && <AiConfigForm />}
                <PosSecurityForm />
                <TabletSetupCard />
                <TwoFactorSection />
                <ChangePasswordForm email={session?.email} />
              </div>
            )}

            {activeTab === 'website' && isSuperAdmin && <WebsiteBrandingForm />}
          </div>
        </main>
      </div>
    </div>
  );
}

function SubscriptionPanel({ session }: { session: any }) {
  if (!session) {
    return (
      <div className="flex items-center justify-center p-12 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl shadow-sm text-xs font-bold text-gray-400 uppercase tracking-wider">
        Loading subscription details...
      </div>
    );
  }

  const packageEndDate = session.packageEndDate;
  const subscriptionStatus = session.subscriptionStatus || 'TRIAL';
  const packageName = session.packageName || 'Standard Corporate Plan';
  const packageFeatures = session.packageFeatures || [];

  let daysRemaining = 0;
  let expiryDateString = 'N/A';
  let isNearExpiry = false;
  let isExpired = false;

  if (packageEndDate) {
    const expiry = new Date(packageEndDate);
    expiryDateString = expiry.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    isNearExpiry = daysRemaining > 0 && daysRemaining <= 10;
    isExpired = daysRemaining <= 0;
  }

  let statusColor = 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/50';
  let barColor = 'bg-emerald-500';
  if (isExpired) {
    statusColor = 'text-red-600 bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/50';
    barColor = 'bg-red-500';
  } else if (isNearExpiry) {
    statusColor = 'text-amber-600 bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/50';
    barColor = 'bg-amber-500';
  }

  const totalDays = subscriptionStatus === 'TRIAL' ? 30 : 365;
  const progressPercent = isExpired ? 0 : Math.min(100, Math.max(0, (daysRemaining / totalDays) * 100));

  return (
    <div className="space-y-6 animate-in fade-in duration-350">
      {/* Alarm Banner */}
      {isNearExpiry && (
        <div className="p-5 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-semibold flex items-center gap-4">
          <div className="w-9 h-9 bg-amber-500/20 rounded-xl flex items-center justify-center shrink-0 text-amber-600 dark:text-amber-400">
            <AlertTriangle size={18} className="animate-bounce" />
          </div>
          <div>
            <p className="font-black uppercase tracking-wider">Subscription Ending Soon!</p>
            <p className="text-gray-500 dark:text-slate-400 font-bold mt-0.5">Your plan expires in {daysRemaining} days. Please contact your system admin to renew and avoid downtime.</p>
          </div>
        </div>
      )}

      {isExpired && (
        <div className="p-5 rounded-3xl bg-red-500/10 border border-red-500/20 text-red-800 dark:text-red-300 text-xs font-semibold flex items-center gap-4">
          <div className="w-9 h-9 bg-red-500/20 rounded-xl flex items-center justify-center shrink-0 text-red-600 dark:text-red-400">
            <XCircle size={18} className="animate-pulse" />
          </div>
          <div>
            <p className="font-black uppercase tracking-wider">Subscription Expired!</p>
            <p className="text-gray-500 dark:text-slate-400 font-bold mt-0.5">Operational access was restricted on {expiryDateString}. Please contact support to renew.</p>
          </div>
        </div>
      )}

      {/* Main card */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center shadow-sm">
              <Zap size={24} />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">{packageName}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${statusColor}`}>
                  {subscriptionStatus}
                </span>
                <span className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                  Status: Active
                </span>
              </div>
            </div>
          </div>

          <div className="text-left md:text-right shrink-0">
            <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Expiration Date</p>
            <p className="text-sm font-black text-gray-900 dark:text-white mt-0.5">{expiryDateString}</p>
          </div>
        </div>

        {packageEndDate && (
          <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-slate-800">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500 dark:text-slate-400 font-bold uppercase tracking-wider">Time Remaining</span>
              <span className="font-black text-gray-900 dark:text-white">
                {isExpired ? '0 Days Left' : `${daysRemaining} Days Remaining`}
              </span>
            </div>
            <div className="w-full h-3.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
              <div 
                className={`h-full transition-all duration-700 rounded-full ${barColor}`} 
                style={{ width: `${progressPercent}%` }} 
              />
            </div>
            <p className="text-[9px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-wider">
              {isExpired ? 'Expired' : `${daysRemaining} days left of standard ${totalDays}-day cycle.`}
            </p>
          </div>
        )}
      </div>

      {/* Feature list detail */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm">
        <div className="mb-6">
          <h3 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight">Active Plan Features</h3>
          <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">
            Feature permissions verified in your active package
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ALL_FEATURES.map((feat) => {
            const hasAccess = packageFeatures.includes(feat.key);
            return (
              <div 
                key={feat.key} 
                className={`p-4 rounded-2xl border transition-all duration-300 ${
                  hasAccess 
                    ? 'bg-slate-50/50 dark:bg-slate-800/10 border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200' 
                    : 'bg-slate-100/10 dark:bg-slate-900/10 border-slate-100/30 dark:border-slate-900/30 text-slate-400/40 opacity-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl shrink-0 mt-0.5">{feat.icon}</span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-black uppercase tracking-wide leading-none">{feat.label}</p>
                      {hasAccess ? (
                        <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                      ) : (
                        <LockIcon size={10} className="text-slate-400 dark:text-slate-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 leading-normal">
                      {hasAccess ? feat.description : 'Locked in your current package'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
