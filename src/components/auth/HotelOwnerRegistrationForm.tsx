'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2, Phone, MapPin, Hash, Tag, Users,
  Mail, Lock, Eye, EyeOff, Check, Zap, Star,
  ChevronDown, ChevronUp, Utensils, Beer, Coffee,
  Bike, Shield, Sparkles, Crown, Info, CreditCard
} from 'lucide-react';

interface Package {
  id: string;
  name: string;
  description: string;
  priceINR: number;
  priceUSD: number;
  discountPercent: number;
  color?: string;
  features: { feature: string }[];
}

const FEATURE_LABELS: Record<string, string> = {
  POS: '🛒 Point of Sale',
  INVENTORY: '📦 Inventory Control',
  ACCOUNTING: '💰 Financial Accounting',
  HMS: '🏨 Hotel Management',
  TABLES: '🪑 Table Management',
  TABLETS: '📱 Waiter / Tablet App',
  REPORTS: '📊 Reports & Analytics',
  GST: '📋 GST Filing Assist',
  STAFF: '👥 Staff Directory',
  DRIVERS: '🚗 Driver Tracking',
  CRM: '👤 CRM & Memberships',
  OFFERS: '🎁 Offers & Rewards',
  B2B: '🚛 B2B Marketplace',
  PARKING: '🅿️ Parking Management',
  WASTE: '🗑️ Waste Management',
  WHATSAPP: '💬 WhatsApp Alerts',
  WALKIETALKIE: '📡 Staff Walkie-Talkie',
  GEOFENCING: '📍 Geofenced Attendance',
  TIPS: '💵 Counter Tips',
};

const PLAN_ICONS: Record<string, React.ReactNode> = {
  'Free Trial': <Zap size={20} />,
  'Starter': <Star size={20} />,
  'Starter Plan': <Star size={20} />,
  'Professional': <Sparkles size={20} />,
  'Professional Suite': <Sparkles size={20} />,
  'Enterprise': <Crown size={20} />,
};

const PLAN_COLORS: Record<string, string> = {
  'Free Trial': '#10b981',
  'Starter': '#06b6d4',
  'Starter Plan': '#06b6d4',
  'Professional': '#f43f5e',
  'Professional Suite': '#f43f5e',
  'Enterprise': '#8b5cf6',
};

interface HotelOwnerRegistrationFormProps {
  // Section 1 — Hotel Details
  businessName: string;
  setBusinessName: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  // Section 2 — Branch Setup
  branchName: string;
  setBranchName: (v: string) => void;
  branchCode: string;
  setBranchCode: (v: string) => void;
  branchCity: string;
  setBranchCity: (v: string) => void;
  branchAddress: string;
  setBranchAddress: (v: string) => void;
  // Section 3 — Plan
  packageId: string | null;
  setPackageId: (v: string | null) => void;
  paymentReference: string;
  setPaymentReference: (v: string) => void;
  setPaymentAmount: (v: number | null) => void;
  // Section 4 — Receptionist
  posFullName: string;
  setPosFullName: (v: string) => void;
  posEmail: string;
  setPosEmail: (v: string) => void;
  posPassword: string;
  setPosPassword: (v: string) => void;
  // Section 5 — Services
  restaurantPosEnabled: boolean;
  setRestaurantPosEnabled: (v: boolean) => void;
  barPosEnabled: boolean;
  setBarPosEnabled: (v: boolean) => void;
  cafePosEnabled: boolean;
  setCafePosEnabled: (v: boolean) => void;
  deliveryEnabled: boolean;
  setDeliveryEnabled: (v: boolean) => void;
}

export function HotelOwnerRegistrationForm({
  businessName, setBusinessName,
  phone, setPhone,
  branchName, setBranchName,
  branchCode, setBranchCode,
  branchCity, setBranchCity,
  branchAddress, setBranchAddress,
  packageId, setPackageId,
  paymentReference, setPaymentReference,
  setPaymentAmount,
  posFullName, setPosFullName,
  posEmail, setPosEmail,
  posPassword, setPosPassword,
  restaurantPosEnabled, setRestaurantPosEnabled,
  barPosEnabled, setBarPosEnabled,
  cafePosEnabled, setCafePosEnabled,
  deliveryEnabled, setDeliveryEnabled,
}: HotelOwnerRegistrationFormProps) {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [selectedPkg, setSelectedPkg] = useState<Package | null>(null);
  const [showPosPassword, setShowPosPassword] = useState(false);
  const [addReceptionist, setAddReceptionist] = useState(false);
  const [branchOpen, setBranchOpen] = useState(false);

  // Fetch packages on mount
  useEffect(() => {
    fetch('/api/website/packages')
      .then(r => r.json())
      .then(json => {
        if (json.success && json.data?.length > 0) {
          setPackages(json.data);
          // Auto-select Free Trial if available
          const free = json.data.find((p: Package) =>
            p.priceINR === 0 || p.name.toLowerCase().includes('free') || p.name.toLowerCase().includes('trial')
          );
          if (free) {
            setPackageId(free.id);
            setSelectedPkg(free);
            setPaymentAmount(null);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoadingPackages(false));
  }, []);

  const handleSelectPlan = (pkg: Package) => {
    setPackageId(pkg.id);
    setSelectedPkg(pkg);
    setPaymentAmount(pkg.priceINR > 0 ? pkg.priceINR : null);
    setPaymentReference('');
  };

  const isPaidPlan = selectedPkg && selectedPkg.priceINR > 0;
  const planColor = selectedPkg ? (selectedPkg.color || PLAN_COLORS[selectedPkg.name] || '#8b5cf6') : '#8b5cf6';

  const inputCls = 'w-full px-4 py-3 bg-slate-900 border border-white/15 rounded-xl text-sm font-medium text-white placeholder-slate-500 focus:border-violet-500 outline-none transition-colors';
  const labelCls = 'block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5';

  return (
    <div className="space-y-4 text-left">

      {/* ── Section 1: Hotel / Business Details ── */}
      <div className="bg-slate-950/80 border border-white/10 p-5 rounded-2xl space-y-4">
        <div className="flex items-center gap-2 border-b border-white/10 pb-2.5">
          <Building2 size={17} className="text-violet-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">
            1. Hotel / Business Details
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>
              Hotel / Business Name <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <Building2 size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                required
                value={businessName}
                onChange={e => setBusinessName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-white/15 rounded-xl text-sm font-medium text-white placeholder-slate-500 focus:border-violet-500 outline-none"
                placeholder="e.g. Royal Crown Hotel & Resort"
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>
              Phone Number <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="tel"
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-white/15 rounded-xl text-sm font-medium text-white placeholder-slate-500 focus:border-violet-500 outline-none"
                placeholder="+91 98765 43210"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 2: Branch / Property Setup (Collapsible) ── */}
      <div className="bg-slate-950/80 border border-white/10 rounded-2xl overflow-hidden">
        <button
          type="button"
          onClick={() => setBranchOpen(v => !v)}
          className="w-full flex items-center justify-between p-5 text-left hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Tag size={17} className="text-emerald-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              2. Branch / Property Setup
            </h3>
            <span className="text-[10px] text-slate-400 font-normal normal-case tracking-normal ml-1">(Optional)</span>
          </div>
          {branchOpen
            ? <ChevronUp size={16} className="text-slate-400" />
            : <ChevronDown size={16} className="text-slate-400" />
          }
        </button>

        {branchOpen && (
          <div className="px-5 pb-5 space-y-4 border-t border-white/10 pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Branch / Property Name</label>
                <input
                  type="text"
                  value={branchName}
                  onChange={e => setBranchName(e.target.value)}
                  className={inputCls}
                  placeholder="e.g. Main Hotel"
                />
              </div>
              <div>
                <label className={labelCls}>
                  Branch Code
                  <span className="ml-1 text-slate-500 normal-case tracking-normal font-normal">(auto-generated if blank)</span>
                </label>
                <div className="relative">
                  <Hash size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={branchCode}
                    onChange={e => setBranchCode(e.target.value.toUpperCase())}
                    className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-white/15 rounded-xl text-sm font-mono font-medium text-white placeholder-slate-500 focus:border-violet-500 outline-none uppercase"
                    placeholder="e.g. HT-MAIN"
                    maxLength={12}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>City</label>
                <div className="relative">
                  <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={branchCity}
                    onChange={e => setBranchCity(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-white/15 rounded-xl text-sm font-medium text-white placeholder-slate-500 focus:border-violet-500 outline-none"
                    placeholder="e.g. Manali"
                  />
                </div>
              </div>
              <div>
                <label className={labelCls}>Full Address</label>
                <input
                  type="text"
                  value={branchAddress}
                  onChange={e => setBranchAddress(e.target.value)}
                  className={inputCls}
                  placeholder="e.g. Mall Road, Manali, HP 175131"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Section 3: Choose Your Plan ── */}
      <div className="bg-slate-950/80 border border-white/10 p-5 rounded-2xl space-y-4">
        <div className="flex items-center gap-2 border-b border-white/10 pb-2.5">
          <Sparkles size={17} className="text-amber-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">3. Choose Your Plan</h3>
        </div>

        {loadingPackages ? (
          <div className="flex items-center justify-center py-6">
            <div className="w-6 h-6 border-2 border-violet-500/30 border-t-violet-400 rounded-full animate-spin" />
            <span className="ml-3 text-sm text-slate-400">Loading plans...</span>
          </div>
        ) : packages.length === 0 ? (
          <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-sm text-emerald-300">
            <Info size={16} />
            <span>Free Trial will be activated on registration.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {packages.map(pkg => {
              const isSelected = packageId === pkg.id;
              const color = pkg.color || PLAN_COLORS[pkg.name] || '#8b5cf6';
              const isFree = pkg.priceINR === 0;
              const icon = PLAN_ICONS[pkg.name] || <Zap size={20} />;

              return (
                <button
                  key={pkg.id}
                  type="button"
                  onClick={() => handleSelectPlan(pkg)}
                  className={`relative text-left p-4 rounded-2xl border-2 transition-all ${
                    isSelected
                      ? 'border-opacity-100 bg-white/5 shadow-lg'
                      : 'border-white/10 hover:border-white/25 bg-slate-900/50'
                  }`}
                  style={isSelected ? { borderColor: color, boxShadow: `0 0 20px ${color}20` } : {}}
                >
                  {isSelected && (
                    <span
                      className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: color }}
                    >
                      <Check size={11} className="text-white font-bold" strokeWidth={3} />
                    </span>
                  )}
                  <div className="flex items-center gap-2 mb-2" style={{ color: isSelected ? color : '#94a3b8' }}>
                    {icon}
                    <span className="text-sm font-extrabold text-white">{pkg.name}</span>
                  </div>
                  <div className="text-lg font-black text-white mb-1">
                    {isFree ? (
                      <span style={{ color: color }}>Free</span>
                    ) : (
                      <>
                        <span style={{ color: color }}>₹{pkg.priceINR.toLocaleString('en-IN')}</span>
                        <span className="text-xs font-normal text-slate-400 ml-1">/year</span>
                      </>
                    )}
                  </div>
                  {pkg.description && (
                    <p className="text-[11px] text-slate-400 leading-relaxed mb-2 line-clamp-2">{pkg.description}</p>
                  )}
                  {pkg.features?.length > 0 && (
                    <div className="space-y-0.5">
                      {pkg.features.slice(0, 4).map(f => (
                        <div key={f.feature} className="flex items-center gap-1.5 text-[11px] text-slate-300">
                          <Check size={10} style={{ color: color }} strokeWidth={3} />
                          {FEATURE_LABELS[f.feature] || f.feature}
                        </div>
                      ))}
                      {pkg.features.length > 4 && (
                        <div className="text-[10px] text-slate-500 pl-4">+{pkg.features.length - 4} more features</div>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Payment Reference — only for paid plans */}
        {isPaidPlan && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/25 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
              <CreditCard size={14} />
              PAYMENT REFERENCE
            </div>
            <p className="text-[11px] text-slate-400">
              Please transfer <span className="text-amber-300 font-bold">₹{selectedPkg?.priceINR?.toLocaleString('en-IN')}</span> via UPI / Bank Transfer and enter the transaction reference below.
            </p>
            <input
              type="text"
              required={!!isPaidPlan}
              value={paymentReference}
              onChange={e => setPaymentReference(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 border border-amber-500/30 rounded-xl text-sm font-mono font-medium text-white placeholder-slate-500 focus:border-amber-500 outline-none"
              placeholder="e.g. UPI Ref: 405123456789"
            />
            <p className="text-[10px] text-slate-500 flex items-center gap-1">
              <Shield size={10} /> Your account will be activated after payment verification by admin.
            </p>
          </div>
        )}
      </div>

      {/* ── Section 4: Receptionist Account (Optional) ── */}
      <div className="bg-slate-950/80 border border-white/10 p-5 rounded-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
          <div className="flex items-center gap-2">
            <Users size={17} className="text-sky-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">4. Receptionist Account</h3>
            <span className="text-[10px] text-slate-400 font-normal normal-case tracking-normal ml-1">(Optional)</span>
          </div>
          {/* Toggle */}
          <button
            type="button"
            onClick={() => setAddReceptionist(v => !v)}
            className={`relative w-11 h-6 rounded-full transition-colors ${addReceptionist ? 'bg-sky-500' : 'bg-slate-700'}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${addReceptionist ? 'translate-x-5' : ''}`}
            />
          </button>
        </div>

        {!addReceptionist ? (
          <p className="text-xs text-slate-500">
            Toggle ON to create a front-desk receptionist account now. You can also add staff later from the dashboard.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>
                  Receptionist Full Name <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Users size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    required={addReceptionist}
                    value={posFullName}
                    onChange={e => setPosFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-white/15 rounded-xl text-sm font-medium text-white placeholder-slate-500 focus:border-sky-500 outline-none"
                    placeholder="e.g. Ramesh Kumar"
                  />
                </div>
              </div>
              <div>
                <label className={labelCls}>
                  Receptionist Email <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    required={addReceptionist}
                    value={posEmail}
                    onChange={e => setPosEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-white/15 rounded-xl text-sm font-medium text-white placeholder-slate-500 focus:border-sky-500 outline-none"
                    placeholder="reception@hotel.com"
                  />
                </div>
              </div>
            </div>
            <div>
              <label className={labelCls}>
                Receptionist Password <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPosPassword ? 'text' : 'password'}
                  required={addReceptionist}
                  value={posPassword}
                  onChange={e => setPosPassword(e.target.value)}
                  minLength={6}
                  className="w-full pl-10 pr-10 py-3 bg-slate-900 border border-white/15 rounded-xl text-sm font-medium text-white placeholder-slate-500 focus:border-sky-500 outline-none"
                  placeholder="Min. 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPosPassword(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPosPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Section 5: Services & POS Configuration ── */}
      <div className="bg-slate-950/80 border border-white/10 p-5 rounded-2xl space-y-4">
        <div className="flex items-center gap-2 border-b border-white/10 pb-2.5">
          <Utensils size={17} className="text-orange-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">5. Services & POS Configuration</h3>
        </div>

        <p className="text-xs text-slate-400">Select the services you want to enable. You can change these anytime from settings.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: 'Restaurant POS', desc: 'Billing, KOT, tables', icon: <Utensils size={18} />, color: '#f97316', value: restaurantPosEnabled, set: setRestaurantPosEnabled },
            { label: 'Bar POS', desc: 'Drinks, bar billing', icon: <Beer size={18} />, color: '#a855f7', value: barPosEnabled, set: setBarPosEnabled },
            { label: 'Café POS', desc: 'Coffee, snacks billing', icon: <Coffee size={18} />, color: '#f59e0b', value: cafePosEnabled, set: setCafePosEnabled },
            { label: 'Delivery', desc: 'Online delivery orders', icon: <Bike size={18} />, color: '#22c55e', value: deliveryEnabled, set: setDeliveryEnabled },
          ].map(item => (
            <button
              key={item.label}
              type="button"
              onClick={() => item.set(!item.value)}
              className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left ${
                item.value
                  ? 'bg-white/5 border-opacity-100'
                  : 'border-white/10 hover:border-white/20 bg-transparent'
              }`}
              style={item.value ? { borderColor: item.color, boxShadow: `0 0 16px ${item.color}15` } : {}}
            >
              <span style={{ color: item.value ? item.color : '#64748b' }}>{item.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white">{item.label}</p>
                <p className="text-[11px] text-slate-400">{item.desc}</p>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0`}
                style={item.value
                  ? { backgroundColor: item.color, borderColor: item.color }
                  : { borderColor: '#334155', backgroundColor: 'transparent' }
                }
              >
                {item.value && <Check size={11} className="text-white" strokeWidth={3} />}
              </div>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
