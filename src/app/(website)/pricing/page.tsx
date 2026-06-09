'use client';

import React, { useState, useEffect } from 'react';
import { 
  Check, 
  ArrowRight, 
  Zap, 
  ShieldCheck, 
  Lock,
  Sparkles,
  HelpCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  X,
  Info
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

// All possible modules in the system (excluding WEBSITE CMS since it is super-admin only)
const ALL_FEATURES = [
  // Core POS
  { key: 'POS', label: 'Point of Sale', description: 'Billing, orders, KOT, bar POS, invoices', icon: '🛒', group: 'Core' },
  { key: 'INVENTORY', label: 'Inventory Control', description: 'Stock, recipes, purchases, low-stock alerts', icon: '📦', group: 'Core' },
  { key: 'ACCOUNTING', label: 'Financial Accounting', description: 'Vouchers, ledger, cash & day book', icon: '💰', group: 'Core' },
  // Hospitality
  { key: 'HMS', label: 'Hotel Management', description: 'Rooms, check-ins, folios, occupancy', icon: '🏨', group: 'Hospitality' },
  { key: 'TABLES', label: 'Table Management', description: 'Floor maps, reservations, table layouts', icon: '🪑', group: 'Hospitality' },
  { key: 'TABLETS', label: 'Tablet / Waiter App', description: 'Tablet POS, waiter mode, digital KOT', icon: '📱', group: 'Hospitality' },
  // Analytics
  { key: 'REPORTS', label: 'Reports & Analytics', description: 'Sales, revenue, settlements, audit logs', icon: '📊', group: 'Analytics' },
  { key: 'GST', label: 'GST Filing Assist', description: 'GSTR-1, GSTR-3B filings & settings', icon: '📋', group: 'Analytics' },
  // People & CRM
  { key: 'STAFF', label: 'Staff Directory', description: 'Staff profiles, shift attendance, salaries', icon: '👥', group: 'People & CRM' },
  { key: 'DRIVERS', label: 'Driver Tracking', description: 'Driver ledger, incentives, gift programs', icon: '🚗', group: 'People & CRM' },
  { key: 'CRM', label: 'CRM & Memberships', description: 'Customers, loyalty points, membership cards', icon: '👤', group: 'People & CRM' },
  { key: 'OFFERS', label: 'Offers & Rewards', description: 'Driver campaigns, reward schemes & payouts', icon: '🎁', group: 'People & CRM' },
  // Advanced Operations
  { key: 'B2B', label: 'B2B Marketplace', description: 'Supplier catalog, bulk orders, inventory link', icon: '🚛', group: 'Advanced' },
  { key: 'PARKING', label: 'Parking Management', description: 'Parking slots, valet logging, QR tokens', icon: '🅿️', group: 'Advanced' },
  { key: 'WASTE', label: 'Waste Management', description: 'Food wastage logging, disposal logs & audits', icon: '🗑️', group: 'Advanced' },
  // Integrations & Communication
  { key: 'WHATSAPP', label: 'WhatsApp Bot & Alerts', description: 'Outbound bill notifications & conversational chatbot order entries', icon: '💬', group: 'Integrations' },
  { key: 'WALKIETALKIE', label: 'Staff Walkie-Talkie', description: 'PTT voice communication, channel creation & voice audio', icon: '📡', group: 'Integrations' },
  { key: 'GEOFENCING', label: 'Geofenced Attendance', description: 'GPS attendance auditing & live location tracking', icon: '📍', group: 'Integrations' },
  { key: 'TIPS', label: 'Counter Tips & Gratuity', description: 'Staff tip logs, checkout gratuity input & tip reporting', icon: '💵', group: 'Integrations' },
];

const FEATURE_GROUPS = ['Core', 'Hospitality', 'Analytics', 'People & CRM', 'Advanced', 'Integrations'];

// Fallback plans if none are loaded from the database
const FALLBACK_PACKAGES = [
  {
    id: 'starter',
    name: 'Starter Plan',
    description: 'Perfect for small cafes, bakeries, and standalone food outlets.',
    discountPercent: 10,
    priceUSD: 290,
    priceINR: 24000,
    isActive: true,
    color: '#06b6d4', // Cyan
    features: [
      { feature: 'POS' },
      { feature: 'TABLES' },
      { feature: 'REPORTS' }
    ]
  },
  {
    id: 'pro',
    name: 'Professional Suite',
    description: 'Complete billing, operations, staff, and table management for dine-in restaurants.',
    discountPercent: 20,
    priceUSD: 790,
    priceINR: 64000,
    isActive: true,
    color: '#f43f5e', // Coral / Pink
    features: [
      { feature: 'POS' },
      { feature: 'TABLES' },
      { feature: 'INVENTORY' },
      { feature: 'REPORTS' },
      { feature: 'STAFF' },
      { feature: 'TABLETS' },
      { feature: 'CRM' },
      { feature: 'WASTE' },
      { feature: 'TIPS' },
      { feature: 'WHATSAPP' }
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise Suite',
    description: 'Uncapped power for premium hotel chains, luxury resorts, and high-volume franchises.',
    discountPercent: 30,
    priceUSD: 1490,
    priceINR: 120000,
    isActive: true,
    color: '#a855f7', // Purple
    features: [
      { feature: 'POS' },
      { feature: 'HMS' },
      { feature: 'INVENTORY' },
      { feature: 'REPORTS' },
      { feature: 'DRIVERS' },
      { feature: 'STAFF' },
      { feature: 'GST' },
      { feature: 'OFFERS' },
      { feature: 'ACCOUNTING' },
      { feature: 'TABLES' },
      { feature: 'TABLETS' },
      { feature: 'CRM' },
      { feature: 'B2B' },
      { feature: 'PARKING' },
      { feature: 'WASTE' },
      { feature: 'WHATSAPP' },
      { feature: 'WALKIETALKIE' },
      { feature: 'GEOFENCING' },
      { feature: 'TIPS' }
    ]
  }
];

export default function PricingPage() {
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLaunchOffer, setIsLaunchOffer] = useState(true); // Default to launch program (free)
  const [currency, setCurrency] = useState<'USD' | 'INR'>('USD');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await fetch('/api/website/packages');
        const json = await res.json();
        if (json.success && json.data && json.data.length > 0) {
          // Filter out WEBSITE feature from packages loaded from DB
          const sanitized = json.data.map((pkg: any) => ({
            ...pkg,
            features: pkg.features?.filter((f: any) => f.feature !== 'WEBSITE') || []
          }));
          setPackages(sanitized);
        } else {
          setPackages(FALLBACK_PACKAGES);
        }
      } catch (err) {
        console.error('Failed to load pricing packages:', err);
        setPackages(FALLBACK_PACKAGES);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const getBasePrice = (featuresCount: number) => {
    if (featuresCount <= 3) return 29;
    if (featuresCount <= 6) return 79;
    if (featuresCount <= 9) return 149;
    return 249;
  };

  const getPriceDetails = (pkg: any) => {
    const featuresCount = pkg.features?.length || 0;
    
    let baseYearly = 0;
    if (currency === 'USD') {
      baseYearly = pkg.priceUSD ?? (getBasePrice(featuresCount) * 10);
    } else {
      baseYearly = pkg.priceINR ?? (getBasePrice(featuresCount) * 80 * 10);
    }
    
    let yearlyOriginal = baseYearly;
    let yearlyDiscounted = baseYearly * (1 - pkg.discountPercent / 100);

    const symbol = currency === 'USD' ? '$' : '₹';

    return {
      symbol,
      originalPrice: pkg.discountPercent > 0 ? yearlyOriginal.toFixed(0) : null,
      price: yearlyDiscounted.toFixed(0),
      billedText: `Billed annually`,
      discountText: pkg.discountPercent > 0 ? `${pkg.discountPercent}% Off` : null
    };
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white overflow-hidden font-sans relative">
      {/* Background Glow Meshes */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-rose-500/10 rounded-full blur-[150px] pointer-events-none -z-10 animate-pulse duration-[10s]" />
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[160px] pointer-events-none -z-10 animate-pulse duration-[8s]" />
      <div className="absolute bottom-10 left-1/3 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[180px] pointer-events-none -z-10" />

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-25 pointer-events-none -z-20" />

      {/* Hero Section */}
      <section className="pt-40 pb-16 text-center px-6 max-w-7xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-500/10 to-indigo-500/10 border border-rose-500/20 rounded-full text-rose-300 text-xs font-black uppercase tracking-[0.2em] mb-8 shadow-inner shadow-rose-950/20"
        >
          <Sparkles size={14} className="text-rose-400 animate-pulse" /> Local Launch Program
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] max-w-5xl mx-auto"
        >
          Power Your Business With <br />
          <span className="bg-gradient-to-r from-rose-300 via-purple-300 to-indigo-300 bg-clip-text text-transparent">
            Flexible, Feature-Rich Plans
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-base md:text-lg text-slate-400 max-w-2xl mx-auto mt-6 leading-relaxed"
        >
          A unified operations suite for restaurants, hotels, and retail franchises. Choose a plan tailored to your business scale. Currently 100% free under our local launch offer!
        </motion.p>

        {/* Toggles */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-12 flex flex-col items-center gap-6"
        >
          {/* Controls Box */}
          <div className="flex flex-col sm:flex-row items-center gap-4 p-2 bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-3xl shadow-2xl">
            {/* Currency Switcher */}
            <div className="flex items-center bg-slate-950 rounded-2xl p-1 relative border border-slate-900">
              <button
                onClick={() => setCurrency('USD')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 relative z-10 ${
                  currency === 'USD' ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {currency === 'USD' && (
                  <motion.div 
                    layoutId="activeCurrency" 
                    className="absolute inset-0 bg-indigo-600 rounded-xl -z-10 shadow-lg shadow-indigo-500/25"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                🇺🇸 USD ($)
              </button>
              <button
                onClick={() => setCurrency('INR')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 relative z-10 ${
                  currency === 'INR' ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {currency === 'INR' && (
                  <motion.div 
                    layoutId="activeCurrency" 
                    className="absolute inset-0 bg-emerald-600 rounded-xl -z-10 shadow-lg shadow-emerald-500/25"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                🇮🇳 INR (₹)
              </button>
            </div>

            <div className="hidden sm:block w-px h-6 bg-slate-800" />

            {/* Launch Offer Toggle */}
            <div className="flex items-center bg-slate-950 rounded-2xl p-1 relative border border-slate-900">
              <button
                onClick={() => setIsLaunchOffer(true)}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all duration-300 relative z-10 flex items-center gap-1 ${
                  isLaunchOffer ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {isLaunchOffer && (
                  <motion.div 
                    layoutId="activeOffer" 
                    className="absolute inset-0 bg-gradient-to-r from-rose-500 to-indigo-600 rounded-xl -z-10 shadow-lg"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                🚀 Launch Deal (Free)
              </button>
              <button
                onClick={() => setIsLaunchOffer(false)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 relative z-10 ${
                  !isLaunchOffer ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {!isLaunchOffer && (
                  <motion.div 
                    layoutId="activeOffer" 
                    className="absolute inset-0 bg-slate-800 rounded-xl -z-10 shadow-lg"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                Standard Rates
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-black bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 px-4.5 py-2 rounded-full shadow-inner shadow-indigo-950/40">
            📅 All Premium Packages Include Annual Billing & Updates
          </div>
        </motion.div>
      </section>

      {/* Grid of Plans */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[580px] rounded-[2.5rem] bg-slate-900/40 border border-slate-800/80 animate-pulse p-8 space-y-8">
                <div className="w-1/3 h-6 bg-slate-800 rounded-full" />
                <div className="w-2/3 h-10 bg-slate-800 rounded-full" />
                <div className="h-40 bg-slate-800 rounded-2xl" />
                <div className="space-y-4 pt-6">
                  {[1, 2, 3, 4].map((x) => (
                    <div key={x} className="w-full h-4 bg-slate-800 rounded-full" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch pt-6">
            {packages.map((pkg, idx) => {
              const color = pkg.color || '#f43f5e';
              const pDetails = getPriceDetails(pkg);
              const isPopular = pkg.name.toLowerCase().includes('pro') || pkg.name.toLowerCase().includes('popular') || idx === 1;
              const packageFeatures = pkg.features?.map((f: any) => f.feature) || [];
              const visibleFeaturesCount = ALL_FEATURES.filter(feat => packageFeatures.includes(feat.key)).length;

              return (
                <motion.div
                  key={pkg.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: idx * 0.15 }}
                  whileHover={{ y: -8, scale: 1.01 }}
                  className="flex flex-col relative rounded-[2.5rem] p-8 md:p-10 bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 transition-all duration-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] group overflow-hidden"
                  style={{ 
                    borderColor: isPopular ? `${color}bb` : 'rgba(30, 41, 59, 0.7)',
                    boxShadow: isPopular ? `0 10px 40px -10px ${color}15` : 'none'
                  }}
                >
                  {/* Glowing corner overlay */}
                  <div 
                    className="absolute top-0 right-0 w-36 h-36 blur-[70px] rounded-full opacity-10 transition-opacity duration-300 group-hover:opacity-25" 
                    style={{ backgroundColor: color }}
                  />

                  {isPopular && (
                    <div 
                      className="absolute -top-4 -right-12 rotate-45 px-12 py-5 text-[10px] font-black uppercase tracking-widest text-slate-950 shadow-lg"
                      style={{ backgroundColor: color, color: '#090d16' }}
                    >
                      Most Popular
                    </div>
                  )}

                  {/* Header */}
                  <div className="mb-6">
                    <span 
                      className="text-xs font-black uppercase tracking-[0.25em] px-4 py-1.5 rounded-full inline-block mb-4 border"
                      style={{ 
                        color, 
                        borderColor: `${color}30`,
                        backgroundColor: `${color}10` 
                      }}
                    >
                      {pkg.name}
                    </span>
                    <p className="text-slate-400 text-sm font-medium leading-relaxed min-h-[48px] mt-2">
                      {pkg.description || 'Custom tailored subscription plan designed to cater to modern business specifications.'}
                    </p>
                  </div>

                  {/* Price Block */}
                  <div className="mb-8 p-6 rounded-3xl bg-slate-950/80 border border-slate-900/80 flex flex-col justify-center min-h-[140px] relative shadow-inner">
                    {isLaunchOffer ? (
                      <div className="text-left space-y-2">
                        <div className="flex items-center gap-2">
                          {Number(pDetails.price) > 0 && (
                            <span className="text-sm font-bold text-slate-500 line-through mr-1">{pDetails.symbol}{pDetails.price}/yr</span>
                          )}
                          <span className="bg-gradient-to-r from-rose-500/20 to-indigo-500/20 text-rose-300 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase border border-rose-500/20 animate-pulse">Launch Special</span>
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-5xl md:text-6xl font-black text-rose-300 tracking-tight">{pDetails.symbol}0</span>
                          <span className="text-slate-400 font-bold text-xs">/ year</span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1 flex items-center gap-1">
                          <Zap size={10} className="text-yellow-500" /> 100% Free Trial for Early Registrations
                        </p>
                      </div>
                    ) : (
                      <div className="text-left space-y-2">
                        {pDetails.originalPrice && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-500 line-through">{pDetails.symbol}{pDetails.originalPrice}/yr</span>
                            <span className="bg-rose-500/20 text-rose-400 text-[10px] font-black px-2 py-0.5 rounded-full uppercase border border-rose-500/20">
                              {pDetails.discountText}
                            </span>
                          </div>
                        )}
                        <div className="flex items-baseline gap-1">
                          <span className="text-5xl md:text-6xl font-black text-white tracking-tight">{pDetails.symbol}{pDetails.price}</span>
                          <span className="text-slate-400 font-bold text-xs">/ year</span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">{pDetails.billedText}</p>
                      </div>
                    )}
                  </div>

                  {/* Highlights Features List (Only shows included features to prevent card bloat) */}
                  <div className="flex-grow mb-8">
                    <h4 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-4">
                      Included Modules ({visibleFeaturesCount})
                    </h4>
                    
                    <div className="space-y-3">
                      {ALL_FEATURES.map((feat) => {
                        const isIncluded = packageFeatures.includes(feat.key);
                        if (!isIncluded) return null; // Do not render locked ones here; table handles that
                        return (
                          <div 
                            key={feat.key} 
                            className="flex items-center gap-3 text-slate-200"
                          >
                            <div className="flex-shrink-0">
                              <div 
                                className="w-5 h-5 rounded-full flex items-center justify-center border text-white"
                                style={{ 
                                  backgroundColor: `${color}20`, 
                                  borderColor: `${color}40`
                                }}
                              >
                                <Check size={11} style={{ color }} />
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm leading-none">{feat.icon}</span>
                              <p className="text-xs font-semibold tracking-wide leading-none">{feat.label}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* CTA Button */}
                  <Link 
                    href={`/signup?packageId=${pkg.id}`}
                    className="w-full py-4.5 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-300 shadow-xl group/btn"
                    style={{ 
                      backgroundColor: isPopular ? color : 'transparent',
                      color: isPopular ? '#0c0f16' : '#fff',
                      border: `2px solid ${color}`,
                      boxShadow: isPopular ? `0 10px 25px -5px ${color}30` : 'none'
                    }}
                    onMouseEnter={(e) => {
                      if (!isPopular) {
                        e.currentTarget.style.backgroundColor = color;
                        e.currentTarget.style.color = '#0c0f16';
                        e.currentTarget.style.boxShadow = `0 10px 25px -5px ${color}30`;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isPopular) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#fff';
                        e.currentTarget.style.boxShadow = 'none';
                      }
                    }}
                  >
                    Select Plan & Setup 
                    <ArrowRight size={14} className="transition-transform duration-300 group-hover/btn:translate-x-1" />
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* Feature Comparison Section */}
      <section className="py-24 border-t border-slate-900/80 bg-slate-950/40 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight">Compare Plan Features</h2>
            <p className="text-slate-400 text-sm mt-3 font-medium">Detailed comparison mapping of all 15 operational feature modules</p>
          </div>

          <div className="w-full overflow-x-auto border border-slate-800/80 rounded-3xl bg-slate-900/20 backdrop-blur-md shadow-2xl">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-800/80 bg-slate-900/40">
                  <th className="py-6 px-6 text-xs font-black uppercase tracking-widest text-slate-400">Features</th>
                  {packages.map((pkg) => (
                    <th key={pkg.id} className="py-6 px-6 text-center w-[18%]">
                      <span className="text-xs font-black uppercase tracking-widest inline-block px-3 py-1 rounded-full border"
                        style={{ 
                          color: pkg.color || '#fff', 
                          borderColor: `${pkg.color || '#fff'}20`, 
                          backgroundColor: `${pkg.color || '#fff'}08`
                        }}
                      >
                        {pkg.name}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {FEATURE_GROUPS.map((groupName) => {
                  const groupFeatures = ALL_FEATURES.filter((f) => f.group === groupName);
                  if (groupFeatures.length === 0) return null;

                  return (
                    <React.Fragment key={groupName}>
                      {/* Group Header Row */}
                      <tr className="bg-slate-950/60 border-t border-b border-slate-800/60">
                        <td colSpan={packages.length + 1} className="py-3.5 px-6">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                            {groupName} Modules
                          </span>
                        </td>
                      </tr>

                      {/* Feature Rows */}
                      {groupFeatures.map((feat) => (
                        <tr 
                          key={feat.key} 
                          className="hover:bg-slate-900/30 transition-colors"
                        >
                          <td className="py-5 px-6">
                            <div className="flex items-start gap-3">
                              <span className="text-lg mt-0.5" role="img" aria-label={feat.label}>{feat.icon}</span>
                              <div>
                                <p className="text-xs font-bold text-slate-200 tracking-wide">{feat.label}</p>
                                <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">{feat.description}</p>
                              </div>
                            </div>
                          </td>

                          {packages.map((pkg) => {
                            const isIncluded = pkg.features?.some((f: any) => f.feature === feat.key);
                            const color = pkg.color || '#f43f5e';
                            return (
                              <td key={pkg.id} className="py-5 px-6 text-center">
                                <div className="flex justify-center">
                                  {isIncluded ? (
                                    <div 
                                      className="w-6 h-6 rounded-full flex items-center justify-center border"
                                      style={{ 
                                        backgroundColor: `${color}15`, 
                                        borderColor: `${color}40`
                                      }}
                                    >
                                      <Check size={12} style={{ color }} />
                                    </div>
                                  ) : (
                                    <div className="w-6 h-6 rounded-full flex items-center justify-center border border-slate-900 bg-slate-950/50 text-slate-700">
                                      <Lock size={10} className="opacity-40" />
                                    </div>
                                  )}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Accordion FAQ Section */}
      <section className="py-24 border-t border-slate-900 bg-slate-950/60 relative">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight">Frequently Asked Questions</h2>
            <p className="text-slate-400 text-sm mt-3 font-medium">Clear answers about plans, local launch offer, and module capabilities</p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "What features are included in each pricing module?",
                a: "Our suite consists of 15 robust modules grouped under Core POS, Hospitality (Hotel HMS/Tables/Tablets), Analytics & GST, CRM & Staffing, and Advanced Operations (B2B/Parking/Waste). You can customize and select features exactly matching your outlet needs from the Super Admin dashboard."
              },
              {
                q: "What is the early local launch program?",
                a: "To help local dining outlets and merchants digitalize, OrderMint is waiving standard yearly subscription charges. Any package created or registered under our current rollout phase gets a 100% discount, making operational access completely free."
              },
              {
                q: "Can I manage and customize modules dynamically?",
                a: "Yes. All system modules and granular permissions can be managed directly in the Super Admin panel under the Packages screen. You can edit names, discount splits, color styling, and exact backend permissions on the fly."
              },
              {
                q: "What happens when I pick a package & sign up?",
                a: "Upon selecting a plan, you are taken to a 4-step onboarding script. This setup assistant guides you through configuring your outlets, rooms, tables, floors, and uploading your products using our AI Menu OCR scanner."
              },
              {
                q: "Can I upgrade or customize the package later?",
                a: "Absolutely. Super Admins can adjust package assignments or grant custom exceptions and granular module permissions to specific tenants at any time without database disruptions."
              }
            ].map((faq, i) => {
              const isOpen = openFaq === i;
              return (
                <div 
                  key={i} 
                  className="rounded-3xl border border-slate-800 bg-slate-900/20 backdrop-blur-md overflow-hidden transition-all duration-300 hover:border-slate-700/60"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="w-full flex items-center justify-between p-6 md:p-8 text-left focus:outline-none"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                        <HelpCircle size={18} />
                      </div>
                      <h4 className="text-sm md:text-base font-bold text-white leading-tight">{faq.q}</h4>
                    </div>
                    <motion.div
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-slate-400 ml-4 shrink-0"
                    >
                      <ChevronDown size={18} />
                    </motion.div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="px-6 pb-6 md:px-8 md:pb-8 pt-0 border-t border-slate-900/60 text-xs md:text-sm text-slate-400 leading-relaxed font-medium">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Enterprise Custom CTA Banner */}
      <section className="pb-32 pt-12 px-6">
        <div className="max-w-5xl mx-auto rounded-[3rem] bg-gradient-to-r from-slate-900 via-slate-900/90 to-indigo-950/20 border border-slate-800/80 p-8 md:p-14 relative overflow-hidden text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none -z-10" />
          
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-black uppercase tracking-widest rounded-full">
              <Zap size={10} className="text-indigo-400" /> Enterprise Custom
            </div>
            <h3 className="text-2xl md:text-4xl font-black tracking-tight text-white leading-tight">
              Looking for a custom multi-property franchise setup?
            </h3>
            <p className="text-slate-400 text-xs md:text-sm font-medium leading-relaxed">
              We design specialized packages with custom integrations, designated database servers, and multi-tenant management dashboards for global hospitality chains.
            </p>
          </div>

          <Link
            href="/contact"
            className="px-8 py-4 bg-white hover:bg-slate-200 text-slate-950 text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl transition-all hover:scale-105 shrink-0 flex items-center gap-2"
          >
            Talk to Experts <ArrowRight size={14} />
          </Link>
        </div>
      </section>
    </main>
  );
}
