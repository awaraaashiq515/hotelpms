'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Save, RefreshCcw, CheckCircle2, AlertCircle, Loader2,
  IndianRupee, DollarSign, ToggleLeft, ToggleRight, Sparkles,
  ShoppingCart, Package, Building2, BarChart3, Users, Megaphone,
  Boxes, Plug, ChevronDown, ChevronUp, Tag,
} from 'lucide-react';

// ── Feature Master List ───────────────────────────────────────────────────────
const ALL_FEATURES = [
  // Core
  { key: 'POS',            label: 'Point of Sale',           description: 'Billing, orders, KOT, invoices',               icon: '🛒', group: 'Core' },
  { key: 'INVENTORY',      label: 'Inventory Management',     description: 'Stock, warehouses, purchases, products',        icon: '📦', group: 'Core' },
  { key: 'ACCOUNTING',     label: 'Accounting & Finance',     description: 'Vouchers, cash book, day book, ledger',         icon: '💰', group: 'Core' },
  // Restaurant & F&B
  { key: 'TABLES',         label: 'Table Management',         description: 'Floor maps, table reservations, layout',        icon: '🪑', group: 'Restaurant & F&B' },
  { key: 'TABLETS',        label: 'Tablet / Waiter App',      description: 'Tablet POS & waiter mode setup',               icon: '📱', group: 'Restaurant & F&B' },
  { key: 'BARPOS',         label: 'Bar POS',                  description: 'Bar billing terminal & bar display',            icon: '🍺', group: 'Restaurant & F&B' },
  { key: 'CAFEPOS',        label: 'Cafe POS',                 description: 'Cafe order flow & quick billing',              icon: '☕', group: 'Restaurant & F&B' },
  // Hotel PMS
  { key: 'HMS',            label: 'Hotel Front Desk & PMS',   description: 'Bookings, check-in/out, room folios, occupancy',icon: '🏨', group: 'Hotel PMS' },
  { key: 'HOTEL_ROOMS',    label: 'Room Status Board',        description: 'Live room matrix, key tracking, VIP/dirty status',icon: '🛏️', group: 'Hotel PMS' },
  { key: 'CHANNEL_MANAGER',label: 'Channel Manager',          description: '2-Way OTA sync — Booking.com, Agoda, MakeMyTrip',icon: '🌐', group: 'Hotel PMS' },
  { key: 'REVENUE_AI',     label: 'Revenue AI & Simulator',   description: 'AI dynamic pricing, demand rules & RevPAR',    icon: '📈', group: 'Hotel PMS' },
  { key: 'HOTEL_REPORTS',  label: 'Hotel Analytics & BI',     description: '16 hotel operational & financial reports',     icon: '📊', group: 'Hotel PMS' },
  { key: 'HOUSEKEEPING',   label: 'Housekeeping',             description: 'Room cleaning tasks & turnaround tracking',    icon: '🧹', group: 'Hotel PMS' },
  { key: 'MAINTENANCE',    label: 'Maintenance & Engineering', description: 'Room maintenance tickets & work orders',       icon: '🔧', group: 'Hotel PMS' },
  { key: 'NIGHT_AUDIT',    label: 'Night Audit Console',      description: 'Day-end audit, shift closing & settlement',    icon: '🌙', group: 'Hotel PMS' },
  { key: 'HOTEL_CRM',      label: 'Guest CRM & Loyalty',      description: '360° guest profiles, loyalty points & history',icon: '⭐', group: 'Hotel PMS' },
  // Hotel Amenities
  { key: 'SPA_WELLNESS',   label: 'Spa & Wellness Center',    description: 'Spa appointments & treatment packages',        icon: '✨', group: 'Hotel Amenities' },
  { key: 'SWIMMING_POOL',  label: 'Swimming Pool',            description: 'Pool passes & visitor entry management',       icon: '🏊', group: 'Hotel Amenities' },
  { key: 'BANQUET_EVENTS', label: 'Banquet & Events',         description: 'Banquet hall bookings & event catering',       icon: '🎉', group: 'Hotel Amenities' },
  { key: 'ROOM_SERVICE',   label: 'Room Service',             description: 'In-room dining orders & tray delivery',        icon: '🍽️', group: 'Hotel Amenities' },
  { key: 'LIVE_MUSIC',     label: 'Live Music & Entertainment',description: 'Singer roster & performance schedule',        icon: '🎵', group: 'Hotel Amenities' },
  { key: 'HOTEL_LAUNDRY',  label: 'Laundry Services',         description: 'Guest & linen laundry tracking & billing',    icon: '👔', group: 'Hotel Amenities' },
  { key: 'LOST_FOUND',     label: 'Lost & Found',             description: 'Item registry & guest claim tracking',         icon: '🔍', group: 'Hotel Amenities' },
  // AI & Smart Hotel
  { key: 'AI_CONCIERGE',   label: 'AI Concierge & IoT',       description: '24/7 AI guest assistant & smart room controls',icon: '🤖', group: 'AI & Smart Hotel' },
  { key: 'TRAVEL_AGENTS',  label: 'Travel Agents & B2B',      description: 'Agent contracts & commission management',      icon: '🤝', group: 'AI & Smart Hotel' },
  // Analytics
  { key: 'REPORTS',        label: 'Reports & Analytics',      description: 'Sales, revenue, settlements, audit logs',       icon: '📋', group: 'Analytics' },
  { key: 'GST',            label: 'GST Filing',               description: 'GSTR-1, GSTR-3B filings & settings',           icon: '🧾', group: 'Analytics' },
  // People
  { key: 'STAFF',          label: 'Staff Management',         description: 'Staff profiles, attendance, salaries',          icon: '👥', group: 'People' },
  { key: 'DRIVERS',        label: 'Driver Management',        description: 'Drivers, gifts, offer programs',                icon: '🚗', group: 'People' },
  { key: 'CRM',            label: 'CRM & Memberships',        description: 'Customers, membership plans & cards',           icon: '👤', group: 'People' },
  // Marketing
  { key: 'OFFERS',         label: 'Offers & Rewards',         description: 'Driver reward campaigns & payouts',             icon: '🎁', group: 'Marketing' },
  { key: 'WEBSITE',        label: 'Website CMS',              description: 'Blogs, gallery, sliders, settings',             icon: '🌐', group: 'Marketing' },
  // Advanced
  { key: 'B2B',            label: 'B2B Marketplace',          description: 'Supplier ordering & B2B market',                icon: '🚛', group: 'Advanced' },
  { key: 'PARKING',        label: 'Parking Management',       description: 'Parking slots, QR check-in/out',                icon: '🅿️', group: 'Advanced' },
  { key: 'WASTE',          label: 'Waste Management',         description: 'Waste tracking, disposal logs',                 icon: '🗑️', group: 'Advanced' },
  // Integrations
  { key: 'WHATSAPP',       label: 'WhatsApp Bot & Alerts',    description: 'Bill notifications & chatbot orders',           icon: '💬', group: 'Integrations' },
  { key: 'WALKIETALKIE',   label: 'Staff Walkie-Talkie',      description: 'PTT voice communication & channels',            icon: '📡', group: 'Integrations' },
  { key: 'GEOFENCING',     label: 'Geofenced Attendance',     description: 'GPS attendance auditing & live location',       icon: '📍', group: 'Integrations' },
  { key: 'TIPS',           label: 'Counter Tips & Gratuity',  description: 'Staff tip logs, checkout gratuity & reporting', icon: '💵', group: 'Integrations' },
];

const GROUPS = ['Core', 'Restaurant & F&B', 'Hotel PMS', 'Hotel Amenities', 'AI & Smart Hotel', 'Analytics', 'People', 'Marketing', 'Advanced', 'Integrations'];

const GROUP_META: Record<string, { icon: React.ReactNode; color: string }> = {
  Core:              { icon: <ShoppingCart size={15} />, color: '#6366f1' },
  'Restaurant & F&B':{ icon: <Building2    size={15} />, color: '#06b6d4' },
  'Hotel PMS':       { icon: <Building2    size={15} />, color: '#f59e0b' },
  'Hotel Amenities': { icon: <Sparkles     size={15} />, color: '#10b981' },
  'AI & Smart Hotel':{ icon: <Boxes        size={15} />, color: '#8b5cf6' },
  Analytics:         { icon: <BarChart3    size={15} />, color: '#f97316' },
  People:            { icon: <Users        size={15} />, color: '#14b8a6' },
  Marketing:         { icon: <Megaphone    size={15} />, color: '#f43f5e' },
  Advanced:          { icon: <Boxes        size={15} />, color: '#84cc16' },
  Integrations:      { icon: <Plug         size={15} />, color: '#ec4899' },
};

interface FeaturePrice {
  id?: string;
  feature: string;
  label: string;
  priceINR: number;
  priceUSD: number;
  isActive: boolean;
}

function toast(msg: string, ok = true) {
  const el = document.createElement('div');
  el.className = `fixed bottom-6 right-6 z-[9999] px-5 py-3.5 rounded-2xl text-sm font-bold shadow-2xl flex items-center gap-2 transition-all ${ok ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`;
  el.innerHTML = `${ok ? '✓' : '✗'} ${msg}`;
  document.body.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 400); }, 2800);
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function FeaturePricingPage() {
  const [prices, setPrices] = useState<Record<string, FeaturePrice>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [dirty, setDirty] = useState(false);

  // Load existing prices
  const loadPrices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/feature-pricing');
      const data = await res.json();

      // Build map from DB data, fill missing with defaults from ALL_FEATURES
      const map: Record<string, FeaturePrice> = {};
      if (data.success) {
        for (const fp of data.data) {
          map[fp.feature] = fp;
        }
      }
      // Ensure all features exist (even if not in DB yet)
      for (const f of ALL_FEATURES) {
        if (!map[f.key]) {
          map[f.key] = { feature: f.key, label: f.label, priceINR: 0, priceUSD: 0, isActive: true };
        }
      }
      setPrices(map);
    } catch {
      toast('Failed to load feature prices', false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPrices(); }, [loadPrices]);

  const updatePrice = (key: string, field: keyof FeaturePrice, value: number | boolean) => {
    setPrices(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/feature-pricing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ features: Object.values(prices) }),
      });
      const data = await res.json();
      if (data.success) {
        toast(`✅ Saved ${data.updated} feature prices`);
        setDirty(false);
      } else throw new Error(data.error);
    } catch (e: any) {
      toast(e.message || 'Save failed', false);
    } finally {
      setSaving(false);
    }
  };

  // Total potential revenue if all features selected
  const totalINR = Object.values(prices).filter(p => p.isActive).reduce((s, p) => s + p.priceINR, 0);
  const activeCount = Object.values(prices).filter(p => p.isActive).length;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Header */}
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Tag size={20} className="text-violet-400" />
              <h1 className="text-2xl font-extrabold text-white">Feature Pricing</h1>
            </div>
            <p className="text-sm text-slate-400">
              Set per-feature prices for the Custom Plan Builder. Users can pick features at signup.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={loadPrices} disabled={loading}
              className="p-2.5 rounded-xl border border-white/15 text-slate-400 hover:text-white hover:bg-white/5 transition-all">
              <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <button onClick={handleSave} disabled={saving || !dirty}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${dirty ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/25' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}>
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              {saving ? 'Saving...' : 'Save All Prices'}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Features', value: ALL_FEATURES.length, icon: <Sparkles size={16} />, color: '#8b5cf6' },
            { label: 'Active Features', value: activeCount, icon: <CheckCircle2 size={16} />, color: '#10b981' },
            { label: 'Max Custom Price', value: `₹${totalINR.toLocaleString('en-IN')}`, icon: <IndianRupee size={16} />, color: '#f59e0b' },
            { label: 'Groups', value: GROUPS.length, icon: <Tag size={16} />, color: '#06b6d4' },
          ].map(s => (
            <div key={s.label} className="bg-slate-900/80 border border-white/10 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1" style={{ color: s.color }}>
                {s.icon}
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{s.label}</span>
              </div>
              <p className="text-xl font-extrabold text-white">{s.value}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-violet-400" />
          </div>
        ) : (
          <div className="space-y-4">
            {GROUPS.map(group => {
              const groupFeatures = ALL_FEATURES.filter(f => f.group === group);
              const meta = GROUP_META[group];
              const isCollapsed = collapsed[group];
              const groupTotal = groupFeatures.reduce((s, f) => s + (prices[f.key]?.priceINR || 0), 0);

              return (
                <div key={group} className="bg-slate-900/70 border border-white/10 rounded-2xl overflow-hidden">
                  {/* Group Header */}
                  <button
                    onClick={() => setCollapsed(prev => ({ ...prev, [group]: !prev[group] }))}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${meta.color}20`, color: meta.color }}>
                        {meta.icon}
                      </div>
                      <div className="text-left">
                        <p className="font-extrabold text-white text-sm">{group}</p>
                        <p className="text-[11px] text-slate-400">{groupFeatures.length} features · ₹{groupTotal.toLocaleString('en-IN')} total</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                        style={{ backgroundColor: `${meta.color}20`, color: meta.color }}>
                        {groupFeatures.filter(f => prices[f.key]?.isActive !== false).length} active
                      </span>
                      {isCollapsed ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronUp size={16} className="text-slate-400" />}
                    </div>
                  </button>

                  {/* Feature Rows */}
                  {!isCollapsed && (
                    <div className="border-t border-white/10 divide-y divide-white/5">
                      {/* Column Headers */}
                      <div className="grid grid-cols-12 gap-3 px-5 py-2 bg-slate-950/40">
                        <div className="col-span-5 text-[10px] font-bold uppercase tracking-wider text-slate-500">Feature</div>
                        <div className="col-span-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                          <IndianRupee size={10} /> Price (INR/yr)
                        </div>
                        <div className="col-span-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                          <DollarSign size={10} /> USD/yr
                        </div>
                        <div className="col-span-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 text-center">Active</div>
                      </div>

                      {groupFeatures.map(f => {
                        const fp = prices[f.key] || { feature: f.key, label: f.label, priceINR: 0, priceUSD: 0, isActive: true };
                        const isActive = fp.isActive !== false;

                        return (
                          <div key={f.key}
                            className={`grid grid-cols-12 gap-3 items-center px-5 py-3.5 transition-all ${!isActive ? 'opacity-50' : 'hover:bg-white/3'}`}>

                            {/* Feature Info */}
                            <div className="col-span-5 flex items-center gap-3">
                              <span className="text-lg">{f.icon}</span>
                              <div>
                                <p className="text-sm font-bold text-white leading-tight">{f.label}</p>
                                <p className="text-[10px] text-slate-500 leading-tight">{f.description}</p>
                              </div>
                            </div>

                            {/* INR Price */}
                            <div className="col-span-3">
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">₹</span>
                                <input
                                  type="number"
                                  min={0}
                                  step={100}
                                  value={fp.priceINR}
                                  onChange={e => updatePrice(f.key, 'priceINR', Number(e.target.value))}
                                  className="w-full pl-7 pr-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-sm font-bold text-white focus:border-violet-500 outline-none"
                                />
                              </div>
                            </div>

                            {/* USD Price */}
                            <div className="col-span-2">
                              <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">$</span>
                                <input
                                  type="number"
                                  min={0}
                                  step={1}
                                  value={fp.priceUSD}
                                  onChange={e => updatePrice(f.key, 'priceUSD', Number(e.target.value))}
                                  className="w-full pl-6 pr-2 py-2 bg-slate-950 border border-white/10 rounded-xl text-sm font-bold text-white focus:border-violet-500 outline-none"
                                />
                              </div>
                            </div>

                            {/* Active Toggle */}
                            <div className="col-span-2 flex justify-center">
                              <button
                                type="button"
                                onClick={() => updatePrice(f.key, 'isActive', !isActive)}
                                className={`relative w-10 h-5 rounded-full transition-colors ${isActive ? 'bg-emerald-500' : 'bg-slate-700'}`}
                              >
                                <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isActive ? 'translate-x-5' : ''}`} />
                              </button>
                            </div>
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

        {/* Bottom Save Bar */}
        {dirty && (
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 border-t border-white/10 backdrop-blur-xl px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-400">
              <AlertCircle size={16} />
              <span className="text-sm font-bold">You have unsaved changes</span>
            </div>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-8 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-violet-600/30 disabled:opacity-50">
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              {saving ? 'Saving...' : 'Save All Changes'}
            </button>
          </div>
        )}

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </div>
    </div>
  );
}
