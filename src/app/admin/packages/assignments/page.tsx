'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Package,
  Building2,
  Users,
  Search,
  Mail,
  ShieldCheck,
  Calendar,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  Settings2,
  Save,
  X,
  Plus,
  Minus,
  RefreshCw,
  Loader2,
  Zap,
  BadgeCheck,
  PauseCircle,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

type OrgUser = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: { name: string };
  isActive: boolean;
};

type Organization = {
  id: string;
  name: string;
  packageStartDate: string | null;
  packageEndDate: string | null;
  subscriptionStatus?: string | null;
  users: OrgUser[];
  _count: { properties: number };
};

type PkgAssignment = {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  features: { feature: string }[];
  organizations: Organization[];
};

// ─── Constants ──────────────────────────────────────────────────────────────

const ALL_FEATURES = [
  // Core
  { key: 'POS',            label: 'Point of Sale',           icon: '🛒' },
  { key: 'INVENTORY',      label: 'Inventory Control',        icon: '📦' },
  { key: 'ACCOUNTING',     label: 'Financial Accounting',     icon: '💰' },
  // Restaurant & F&B
  { key: 'TABLES',         label: 'Table Management',         icon: '🪑' },
  { key: 'TABLETS',        label: 'Tablet / Waiter App',      icon: '📱' },
  { key: 'BARPOS',         label: 'Bar POS',                  icon: '🍺' },
  { key: 'CAFEPOS',        label: 'Cafe POS',                 icon: '☕' },
  // Hotel PMS
  { key: 'HMS',            label: 'Hotel Front Desk & PMS',   icon: '🏨' },
  { key: 'HOTEL_ROOMS',    label: 'Room Status Board',        icon: '🛏️' },
  { key: 'CHANNEL_MANAGER',label: 'Channel Manager',          icon: '🌐' },
  { key: 'REVENUE_AI',     label: 'Revenue AI & Simulator',   icon: '📈' },
  { key: 'HOTEL_REPORTS',  label: 'Hotel Analytics & BI',     icon: '📊' },
  { key: 'HOUSEKEEPING',   label: 'Housekeeping',             icon: '🧹' },
  { key: 'MAINTENANCE',    label: 'Maintenance & Engineering', icon: '🔧' },
  { key: 'NIGHT_AUDIT',    label: 'Night Audit Console',      icon: '🌙' },
  { key: 'HOTEL_CRM',      label: 'Guest CRM & Loyalty',      icon: '⭐' },
  // Hotel Amenities
  { key: 'SPA_WELLNESS',   label: 'Spa & Wellness Center',    icon: '✨' },
  { key: 'SWIMMING_POOL',  label: 'Swimming Pool',            icon: '🏊' },
  { key: 'BANQUET_EVENTS', label: 'Banquet & Events',         icon: '🎉' },
  { key: 'ROOM_SERVICE',   label: 'Room Service',             icon: '🍽️' },
  { key: 'LIVE_MUSIC',     label: 'Live Music & Entertainment',icon: '🎵' },
  { key: 'HOTEL_LAUNDRY',  label: 'Laundry Services',         icon: '👔' },
  { key: 'LOST_FOUND',     label: 'Lost & Found',             icon: '🔍' },
  // AI & Smart Hotel
  { key: 'AI_CONCIERGE',   label: 'AI Concierge & IoT',       icon: '🤖' },
  { key: 'TRAVEL_AGENTS',  label: 'Travel Agents & B2B',      icon: '🤝' },
  // Analytics
  { key: 'REPORTS',        label: 'Reports & Analytics',      icon: '📋' },
  { key: 'GST',            label: 'GST Filing Assist',        icon: '🧾' },
  // People
  { key: 'STAFF',          label: 'Staff Directory',          icon: '👥' },
  { key: 'DRIVERS',        label: 'Driver Tracking',          icon: '🚗' },
  { key: 'CRM',            label: 'CRM & Memberships',        icon: '👤' },
  // Marketing
  { key: 'OFFERS',         label: 'Offers & Rewards',         icon: '🎁' },
  { key: 'WEBSITE',        label: 'Website CMS',              icon: '🌐' },
  // Advanced
  { key: 'B2B',            label: 'B2B Marketplace',          icon: '🚛' },
  { key: 'PARKING',        label: 'Parking Management',       icon: '🅿️' },
  { key: 'WASTE',          label: 'Waste Management',         icon: '🗑️' },
  // Integrations
  { key: 'WHATSAPP',       label: 'WhatsApp Bot & Alerts',    icon: '💬' },
  { key: 'WALKIETALKIE',   label: 'Staff Walkie-Talkie',      icon: '📡' },
  { key: 'GEOFENCING',     label: 'Geofenced Attendance',     icon: '📍' },
  { key: 'TIPS',           label: 'Counter Tips & Gratuity',  icon: '💵' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getExpiryInfo(endDate: string | null) {
  if (!endDate) return { label: 'No Expiry', badge: 'no-limit', days: null };
  const expiry = new Date(endDate);
  const days = Math.ceil((expiry.getTime() - Date.now()) / 86400000);
  if (days <= 0)  return { label: 'Expired', badge: 'expired', days };
  if (days <= 7)  return { label: `${days}d left`, badge: 'critical', days };
  if (days <= 30) return { label: `${days}d left`, badge: 'warning', days };
  return { label: `${days}d left`, badge: 'active', days };
}

const BADGE_CLS: Record<string, string> = {
  'no-limit': 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
  expired:    'bg-red-50 text-red-600 border-red-100 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/40',
  critical:   'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/40',
  warning:    'bg-yellow-50 text-yellow-600 border-yellow-100 dark:bg-yellow-950/30 dark:text-yellow-500 dark:border-yellow-900/40',
  active:     'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/40',
};

const BADGE_ICON: Record<string, React.ReactNode> = {
  'no-limit': <Clock size={10} />,
  expired:    <XCircle size={10} />,
  critical:   <AlertTriangle size={10} />,
  warning:    <AlertTriangle size={10} />,
  active:     <CheckCircle2 size={10} />,
};

function toInputDate(d: string | null) {
  if (!d) return '';
  return new Date(d).toISOString().slice(0, 10);
}
function fmt(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Manage Drawer ───────────────────────────────────────────────────────────

interface ManageDrawerProps {
  org: Organization & { _pkgId?: string };
  packages: PkgAssignment[];
  onClose: () => void;
  onSaved: (updated: Partial<Organization> & { packageId?: string }) => void;
}

function ManageDrawer({ org, packages, onClose, onSaved }: ManageDrawerProps) {
  const currentPkg = packages.find(p => p.organizations.some(o => o.id === org.id));

  const [selectedPkgId, setSelectedPkgId] = useState(currentPkg?.id || '');
  const [startDate, setStartDate] = useState(toInputDate(org.packageStartDate));
  const [endDate, setEndDate] = useState(toInputDate(org.packageEndDate));
  const [status, setStatus] = useState(org.subscriptionStatus || 'ACTIVE');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const selectedPkg = packages.find(p => p.id === selectedPkgId);
  const pkgFeatures = selectedPkg?.features.map(f => f.feature) || [];

  // Extend helpers
  const addDays = (base: string, days: number) => {
    const d = base ? new Date(base) : new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/super-admin/organizations/${org.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: selectedPkgId || null,
          packageStartDate: startDate || null,
          packageEndDate: endDate || null,
          subscriptionStatus: status,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setToast('Changes saved successfully!');
        onSaved({
          packageId: selectedPkgId,
          packageStartDate: startDate || null,
          packageEndDate: endDate || null,
          subscriptionStatus: status,
        });
        setTimeout(() => { setToast(''); onClose(); }, 1200);
      } else {
        setToast('Error: ' + (data.error || 'Failed to save'));
      }
    } catch {
      setToast('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-white dark:bg-slate-900 shadow-2xl z-50 flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pos-primary/10 flex items-center justify-center">
              <Settings2 size={18} className="text-pos-primary" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{org.name}</h2>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Manage Plan & Features</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-500 hover:text-red-500 transition-all">
            <X size={15} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* Section 1: Package */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Package size={12} /> Assigned Package
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {/* No package option */}
              <button
                onClick={() => setSelectedPkgId('')}
                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${!selectedPkgId ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/20' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}
              >
                <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400 text-sm shrink-0">—</div>
                <div>
                  <p className="text-xs font-black text-slate-700 dark:text-slate-300">No Package</p>
                  <p className="text-[10px] text-slate-400">Remove subscription</p>
                </div>
                {!selectedPkgId && <CheckCircle2 size={14} className="ml-auto text-rose-500 shrink-0" />}
              </button>

              {packages.map(pkg => (
                <button
                  key={pkg.id}
                  onClick={() => setSelectedPkgId(pkg.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${selectedPkgId === pkg.id ? 'border-pos-primary bg-pos-primary/5 dark:bg-pos-primary/10' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm shrink-0 shadow-sm" style={{ background: pkg.color || '#6366f1' }}>
                    <Package size={13} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase">{pkg.name}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{pkg.features.length} features included</p>
                  </div>
                  {selectedPkgId === pkg.id && <CheckCircle2 size={14} className="ml-auto text-pos-primary shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: Features Preview */}
          {selectedPkg && (
            <div className="space-y-3">
              <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Zap size={12} /> Features in {selectedPkg.name}
              </h3>
              <div className="grid grid-cols-2 gap-1.5">
                {ALL_FEATURES.map(f => {
                  const included = pkgFeatures.includes(f.key);
                  return (
                    <div
                      key={f.key}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-[10px] font-bold ${
                        included
                          ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                          : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-600 line-through'
                      }`}
                    >
                      <span>{f.icon}</span>
                      <span className="truncate">{f.label}</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium text-center">
                To add extra features, edit the package from the <a href="/admin/packages" className="text-pos-primary underline">Packages page</a>.
              </p>
            </div>
          )}

          {/* Section 3: Dates */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Calendar size={12} /> Subscription Dates
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Expiry Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary transition-all"
                />
              </div>
            </div>

            {/* Quick Extend Buttons */}
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Quick Extend from Expiry</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: '+7 Days', days: 7 },
                  { label: '+1 Month', days: 30 },
                  { label: '+3 Months', days: 90 },
                  { label: '+6 Months', days: 180 },
                  { label: '+1 Year', days: 365 },
                ].map(opt => (
                  <button
                    key={opt.days}
                    type="button"
                    onClick={() => setEndDate(addDays(endDate, opt.days))}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/20 hover:bg-indigo-100 dark:hover:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all"
                  >
                    <Plus size={10} /> {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 4: Subscription Status */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <BadgeCheck size={12} /> Subscription Status
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'ACTIVE',    label: 'Active',    icon: <CheckCircle2 size={14} />, color: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400' },
                { value: 'TRIAL',     label: 'Trial',     icon: <Zap size={14} />,          color: 'border-blue-500 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400' },
                { value: 'SUSPENDED', label: 'Suspended', icon: <PauseCircle size={14} />,  color: 'border-red-500 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatus(opt.value)}
                  className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all text-[10px] font-black uppercase tracking-widest ${
                    status === opt.value ? opt.color : 'border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:border-slate-300'
                  }`}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 space-y-3">
          {toast && (
            <div className={`text-center text-[11px] font-bold py-2 rounded-lg ${toast.startsWith('Error') || toast.startsWith('Network') ? 'bg-red-50 dark:bg-red-950/20 text-red-500' : 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600'}`}>
              {toast}
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-[11px] font-black uppercase tracking-widest hover:border-slate-300 transition-all">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-3 rounded-xl bg-pos-primary hover:bg-pos-primary/90 text-white text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-pos-primary/20 disabled:opacity-60"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Org Card ─────────────────────────────────────────────────────────────────

function OrgCard({
  org,
  packages,
  onManage,
}: {
  org: Organization;
  packages: PkgAssignment[];
  onManage: (org: Organization) => void;
}) {
  const [open, setOpen] = useState(false);
  const expiry = getExpiryInfo(org.packageEndDate);
  const adminUser = org.users.find(u => u.role.name === 'RESTAURANTS_ADMIN') || org.users[0];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all">
      <div className="p-5 flex items-center gap-4">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
          <span className="text-lg font-black text-slate-500 dark:text-slate-400 uppercase">{org.name.charAt(0)}</span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">{org.name}</h3>
          {adminUser && (
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-0.5 truncate">{adminUser.email}</p>
          )}
          <div className="flex items-center flex-wrap gap-2 mt-2">
            <span className={`inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-widest ${BADGE_CLS[expiry.badge]}`}>
              {BADGE_ICON[expiry.badge]} {expiry.label}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 font-bold">
              <Building2 size={10} /> {org._count.properties} Props
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 font-bold">
              <Users size={10} /> {org.users.length} Users
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Manage button */}
          <button
            onClick={() => onManage(org)}
            className="flex items-center gap-1.5 px-3 py-2 bg-pos-primary hover:bg-pos-primary/90 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md shadow-pos-primary/20 active:scale-95"
          >
            <Settings2 size={12} /> Manage
          </button>

          {/* Expand users */}
          <button
            onClick={() => setOpen(v => !v)}
            className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 transition-colors"
          >
            {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Dates row */}
      <div className="px-5 pb-3 flex items-center gap-6 text-[10px] text-slate-400 dark:text-slate-500 font-bold">
        <span className="flex items-center gap-1"><Calendar size={10} /> Start: {fmt(org.packageStartDate)}</span>
        <span className="flex items-center gap-1"><Clock size={10} /> Expires: {fmt(org.packageEndDate)}</span>
        {org.subscriptionStatus && (
          <span className={`ml-auto text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-widest ${
            org.subscriptionStatus === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30' :
            org.subscriptionStatus === 'SUSPENDED' ? 'bg-red-50 text-red-600 border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30' :
            'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30'
          }`}>
            {org.subscriptionStatus}
          </span>
        )}
      </div>

      {/* Progress Bar */}
      {org.packageEndDate && expiry.days !== null && expiry.days > 0 && (
        <div className="px-5 pb-4">
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${expiry.badge === 'active' ? 'bg-emerald-500' : expiry.badge === 'warning' ? 'bg-yellow-400' : 'bg-amber-500'}`}
              style={{ width: `${Math.min(100, (expiry.days / 365) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Users Drawer */}
      {open && (
        <div className="border-t border-slate-100 dark:border-slate-800">
          {org.users.length === 0 ? (
            <p className="px-5 py-6 text-center text-[11px] text-slate-400 italic">No users linked to this organization.</p>
          ) : (
            <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {org.users.map(user => (
                <div key={user.id} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 flex items-center justify-center shrink-0">
                    <span className="text-[11px] font-black text-indigo-500 uppercase">{user.fullName.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-black text-slate-800 dark:text-slate-200 truncate">{user.fullName}</p>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1 truncate">
                      <Mail size={9} /> {user.email}
                    </p>
                  </div>
                  <span className="hidden sm:inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30 uppercase shrink-0">
                    <ShieldCheck size={9} /> {user.role.name.replace(/_/g, ' ')}
                  </span>
                  <span className={`w-2 h-2 rounded-full shrink-0 ${user.isActive ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`} />
                </div>
              ))}
            </div>
          )}
          <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/30 flex justify-end">
            <a href={`/admin/users?search=${encodeURIComponent(org.name)}`} className="inline-flex items-center gap-1.5 text-[10px] font-black text-indigo-500 hover:text-indigo-600 uppercase tracking-widest transition-colors">
              Manage Users <ArrowRight size={10} />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PackageAssignmentsPage() {
  const [data, setData] = useState<PkgAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activePkgId, setActivePkgId] = useState<string>('__all__');
  const [managingOrg, setManagingOrg] = useState<Organization | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/super-admin/package-assignments');
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const activePkg = useMemo(() => activePkgId === '__all__' ? null : data.find(p => p.id === activePkgId) || null, [data, activePkgId]);

  const orgsToShow = useMemo(() => {
    const list = activePkgId === '__all__'
      ? data.flatMap(p => p.organizations.map(o => ({ ...o, _pkgName: p.name, _pkgColor: p.color })))
      : (activePkg?.organizations.map(o => ({ ...o, _pkgName: activePkg.name, _pkgColor: activePkg.color })) || []);
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(o => o.name.toLowerCase().includes(q) || o.users.some(u => u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)));
  }, [data, activePkgId, activePkg, search]);

  const totalOrgs  = data.reduce((s, p) => s + p.organizations.length, 0);
  const totalUsers = data.reduce((s, p) => s + p.organizations.reduce((ss, o) => ss + o.users.length, 0), 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-pos-primary/30 border-t-pos-primary rounded-full animate-spin" />
        <p className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-widest animate-pulse">Loading Assignments…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0 h-full min-h-screen bg-slate-50 dark:bg-slate-950 -m-4 lg:-m-8">

      {/* Manage Drawer */}
      {managingOrg && (
        <ManageDrawer
          org={managingOrg}
          packages={data}
          onClose={() => setManagingOrg(null)}
          onSaved={() => { fetchData(); setManagingOrg(null); }}
        />
      )}

      {/* ── Top Header ── */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-0.5 w-6 bg-pos-primary rounded-full" />
            <span className="text-[9px] font-black text-pos-primary uppercase tracking-[0.3em]">Enterprise Registry</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Package Assignments</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            {totalOrgs} organizations · {totalUsers} total users · {data.length} packages
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchData} className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:text-pos-primary hover:border-pos-primary/30 transition-all">
            <RefreshCw size={14} />
          </button>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text" placeholder="Search org or user…" value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary transition-all"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={13} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">

        {/* ── LEFT: Package Tabs ── */}
        <aside className="lg:w-64 xl:w-72 shrink-0 bg-white dark:bg-slate-900 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 flex flex-row lg:flex-col overflow-x-auto lg:overflow-y-auto">
          {/* All */}
          <button
            onClick={() => setActivePkgId('__all__')}
            className={`flex items-center gap-3 px-5 py-4 text-left w-full shrink-0 border-b border-slate-100 dark:border-slate-800 transition-all border-l-4 ${activePkgId === '__all__' ? 'bg-pos-primary/5 border-l-pos-primary' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border-l-transparent'}`}
          >
            <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
              <LayoutGrid size={16} className="text-slate-500 dark:text-slate-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-black uppercase ${activePkgId === '__all__' ? 'text-pos-primary' : 'text-slate-700 dark:text-slate-300'}`}>All Packages</p>
              <p className="text-[10px] text-slate-400 font-medium">{totalOrgs} organizations</p>
            </div>
          </button>

          {data.map(pkg => {
            const isActive = activePkgId === pkg.id;
            const expiredCt = pkg.organizations.filter(o => o.packageEndDate && new Date(o.packageEndDate) < new Date()).length;
            const criticalCt = pkg.organizations.filter(o => { if (!o.packageEndDate) return false; const d = Math.ceil((new Date(o.packageEndDate).getTime() - Date.now()) / 86400000); return d > 0 && d <= 7; }).length;
            return (
              <button key={pkg.id} onClick={() => setActivePkgId(pkg.id)}
                className={`flex items-center gap-3 px-5 py-4 text-left w-full shrink-0 border-b border-slate-100 dark:border-slate-800 transition-all border-l-4 ${isActive ? 'bg-pos-primary/5 border-l-pos-primary' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border-l-transparent'}`}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm" style={{ background: pkg.color || '#6366f1' }}>
                  <Package size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-black uppercase truncate ${isActive ? 'text-pos-primary' : 'text-slate-700 dark:text-slate-300'}`}>{pkg.name}</p>
                  <p className="text-[10px] text-slate-400 font-medium">{pkg.organizations.length} orgs · {pkg.features.length} features</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {expiredCt > 0 && <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-950/30 text-red-500 border border-red-200 dark:border-red-900/30 uppercase">{expiredCt} exp</span>}
                  {criticalCt > 0 && <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/30 text-amber-500 border border-amber-200 dark:border-amber-900/30 uppercase">{criticalCt} soon</span>}
                </div>
              </button>
            );
          })}
        </aside>

        {/* ── RIGHT: Orgs ── */}
        <main className="flex-1 overflow-y-auto p-5 lg:p-6 space-y-4">
          {/* Panel Header */}
          <div className="flex items-center justify-between">
            <div>
              {activePkg ? (
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs shadow" style={{ background: activePkg.color || '#6366f1' }}><Package size={13} /></div>
                  <div>
                    <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase">{activePkg.name}</h2>
                    {activePkg.description && <p className="text-[10px] text-slate-400 italic">"{activePkg.description}"</p>}
                  </div>
                </div>
              ) : (
                <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase">All Organizations</h2>
              )}
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{orgsToShow.length} Result{orgsToShow.length !== 1 ? 's' : ''}</span>
          </div>

          {/* Stats for selected package */}
          {activePkg && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Orgs',     value: activePkg.organizations.length, icon: <Building2 size={14} className="text-indigo-500" />, bg: 'bg-indigo-50 dark:bg-indigo-950/20' },
                { label: 'Users',    value: activePkg.organizations.reduce((s, o) => s + o.users.length, 0), icon: <Users size={14} className="text-emerald-500" />, bg: 'bg-emerald-50 dark:bg-emerald-950/20' },
                { label: 'Expiring', value: activePkg.organizations.filter(o => { if (!o.packageEndDate) return false; const d = Math.ceil((new Date(o.packageEndDate).getTime() - Date.now()) / 86400000); return d > 0 && d <= 7; }).length, icon: <AlertTriangle size={14} className="text-amber-500" />, bg: 'bg-amber-50 dark:bg-amber-950/20' },
                { label: 'Expired',  value: activePkg.organizations.filter(o => o.packageEndDate && new Date(o.packageEndDate) < new Date()).length, icon: <XCircle size={14} className="text-red-500" />, bg: 'bg-red-50 dark:bg-red-950/20' },
              ].map((s, i) => (
                <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center shrink-0`}>{s.icon}</div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
                    <p className="text-lg font-black text-slate-900 dark:text-white">{s.value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Org Cards */}
          {orgsToShow.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <Search size={24} className="text-slate-300" />
              </div>
              <p className="text-sm font-black text-slate-500 uppercase">No Organizations Found</p>
              <p className="text-xs text-slate-400 mt-1">Try a different search or select another package.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(orgsToShow as any[]).map(org => (
                <div key={org.id}>
                  {activePkgId === '__all__' && (
                    <div className="flex items-center gap-2 mb-1.5 ml-1">
                      <div className="w-2 h-2 rounded-full" style={{ background: org._pkgColor || '#6366f1' }} />
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{org._pkgName}</span>
                    </div>
                  )}
                  <OrgCard org={org} packages={data} onManage={setManagingOrg} />
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
