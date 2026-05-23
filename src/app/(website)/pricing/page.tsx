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
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

// All possible modules in the system
const ALL_FEATURES = [
  { key: 'POS', label: 'Point of Sale', description: 'Billing, orders, KOT', icon: '🛒' },
  { key: 'HMS', label: 'Hotel Management', description: 'Rooms, check-ins, folios', icon: '🏨' },
  { key: 'INVENTORY', label: 'Inventory Control', description: 'Stock, warehouses, purchases', icon: '📦' },
  { key: 'REPORTS', label: 'Reports & Analytics', description: 'Sales, revenue, charts', icon: '📊' },
  { key: 'DRIVERS', label: 'Driver Tracking', description: 'Drivers, gifts, offers', icon: '🚗' },
  { key: 'STAFF', label: 'Staff Directory', description: 'Staff profiles, salaries', icon: '👥' },
  { key: 'WEBSITE', label: 'Website CMS', description: 'Blogs, gallery, sliders', icon: '🌐' },
  { key: 'GST', label: 'GST Filing Assist', description: 'GSTR-1, GSTR-3B filings', icon: '📋' },
  { key: 'OFFERS', label: 'Offers & Rewards', description: 'Driver reward campaigns', icon: '🎁' },
  { key: 'ACCOUNTING', label: 'Financial Accounting', description: 'Vouchers, receipts, cash', icon: '💰' },
  { key: 'TABLES', label: 'Table Layouts', description: 'Floor maps, table booking', icon: '🪑' },
  { key: 'TABLETS', label: 'Tablet / Waiter App', description: 'Tablet POS & waiter mode', icon: '📱' },
];

// Fallback plans if none are loaded from the database
const FALLBACK_PACKAGES = [
  {
    id: 'starter',
    name: 'Starter Plan',
    description: 'Perfect for small cafes, bakeries, and standalone street food outlets.',
    discountPercent: 10,
    isActive: true,
    color: '#3b82f6',
    features: [
      { feature: 'POS' },
      { feature: 'TABLES' },
      { feature: 'REPORTS' }
    ]
  },
  {
    id: 'pro',
    name: 'Professional Suite',
    description: 'Complete billing, operations, and staff management for dine-in restaurants.',
    discountPercent: 20,
    isActive: true,
    color: '#e8a0a0',
    features: [
      { feature: 'POS' },
      { feature: 'TABLES' },
      { feature: 'INVENTORY' },
      { feature: 'REPORTS' },
      { feature: 'STAFF' },
      { feature: 'TABLETS' }
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise Suite',
    description: 'Uncapped power for premium hotel chains, luxury resorts, and high-volume franchises.',
    discountPercent: 30,
    isActive: true,
    color: '#8b5cf6',
    features: [
      { feature: 'POS' },
      { feature: 'HMS' },
      { feature: 'INVENTORY' },
      { feature: 'REPORTS' },
      { feature: 'DRIVERS' },
      { feature: 'STAFF' },
      { feature: 'WEBSITE' },
      { feature: 'GST' },
      { feature: 'ACCOUNTING' },
      { feature: 'TABLES' },
      { feature: 'TABLETS' }
    ]
  }
];

export default function PricingPage() {
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isYearly, setIsYearly] = useState(false);
  const [isLaunchOffer, setIsLaunchOffer] = useState(false); // Default to standard pricing
  const [currency, setCurrency] = useState<'USD' | 'INR'>('USD');

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await fetch('/api/website/packages');
        const json = await res.json();
        if (json.success && json.data && json.data.length > 0) {
          setPackages(json.data);
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

  // Determine pricing based on number of enabled features
  const getBasePrice = (featuresCount: number) => {
    if (featuresCount <= 3) return 29;
    if (featuresCount <= 6) return 79;
    if (featuresCount <= 9) return 149;
    return 249;
  };

  const getPriceDetails = (pkg: any) => {
    const featuresCount = pkg.features?.length || 0;
    
    // Read priceUSD or priceINR if defined, otherwise calculate fallback base price
    let baseYearly = 0;
    if (currency === 'USD') {
      baseYearly = pkg.priceUSD ?? (getBasePrice(featuresCount) * 10); // Fallback to 10x monthly
    } else {
      baseYearly = pkg.priceINR ?? (getBasePrice(featuresCount) * 80 * 10); // Fallback: 1 USD = 80 INR
    }
    
    // Yearly calculation
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
      {/* Background Orbs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-rose-500/10 rounded-full blur-[150px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[180px] pointer-events-none -z-10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900/50 via-slate-950 to-slate-950 -z-20 pointer-events-none" />

      {/* Hero Section */}
      <section className="pt-52 pb-16 text-center px-6 max-w-7xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-rose-500/10 border border-rose-500/30 rounded-full text-rose-300 text-xs font-black uppercase tracking-[0.2em] mb-8"
        >
          <Sparkles size={14} className="animate-pulse" /> Limited Launch Campaign
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight leading-tight max-w-5xl mx-auto"
        >
          Power Your Business With <br />
          <span className="bg-gradient-to-r from-rose-300 via-indigo-300 to-rose-400 bg-clip-text text-transparent">
            Flexible, Scalable Plans
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-base md:text-lg text-slate-400 max-w-2xl mx-auto mt-6 leading-relaxed"
        >
          Manage plans from the Super Admin dashboard and adapt access for any size hospitality business. 
          Currently 100% free under our local launch program!
        </motion.p>

        {/* Toggles */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-12 flex flex-col items-center gap-6"
        >
          {/* Currency Switcher */}
          <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-1.5 shadow-2xl">
            <button
              onClick={() => setCurrency('USD')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                currency === 'USD' 
                  ? 'bg-indigo-500 text-white shadow-lg' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🇺🇸 USD ($)
            </button>
            <button
              onClick={() => setCurrency('INR')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                currency === 'INR' 
                  ? 'bg-emerald-500 text-white shadow-lg' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🇮🇳 INR (₹)
            </button>
          </div>



          {/* Yearly subscription only notice */}
          <div className="flex items-center gap-2 text-xs font-black bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 px-4 py-2 rounded-2xl">
            📅 All Plans Billed Annually
          </div>
        </motion.div>
      </section>

      {/* Grid of Plans */}
      <section className="max-w-7xl mx-auto px-6 pb-32">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[600px] rounded-[2.5rem] bg-slate-900/50 border border-slate-800 animate-pulse relative overflow-hidden p-8 space-y-8">
                <div className="w-1/3 h-6 bg-slate-800 rounded-full" />
                <div className="w-2/3 h-10 bg-slate-800 rounded-full" />
                <div className="h-40 bg-slate-800 rounded-2xl" />
                <div className="space-y-4 pt-6">
                  {[1, 2, 3, 4, 5].map((x) => (
                    <div key={x} className="w-full h-4 bg-slate-800 rounded-full" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch pt-12">
            {packages.map((pkg, idx) => {
              const color = pkg.color || '#e8a0a0';
              const pDetails = getPriceDetails(pkg);
              const isPopular = pkg.name.toLowerCase().includes('pro') || pkg.name.toLowerCase().includes('popular') || idx === 1;
              const packageFeatures = pkg.features?.map((f: any) => f.feature) || [];

              return (
                <motion.div
                  key={pkg.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: idx * 0.15 }}
                  className="flex flex-col relative rounded-[3rem] p-8 md:p-10 bg-slate-900/40 backdrop-blur-xl border transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(0,0,0,0.4)] group overflow-hidden"
                  style={{ 
                    borderColor: isPopular ? `${color}dd` : 'rgba(30, 41, 59, 0.6)',
                    boxShadow: isPopular ? `0 10px 40px -10px ${color}20` : 'none'
                  }}
                >
                  {/* Decorative corner glow */}
                  <div 
                    className="absolute top-0 right-0 w-32 h-32 blur-[60px] rounded-full opacity-20 transition-opacity group-hover:opacity-40" 
                    style={{ backgroundColor: color }}
                  />

                  {isPopular && (
                    <div 
                      className="absolute -top-4 -right-12 rotate-45 px-12 py-5 text-[10px] font-black uppercase tracking-widest text-white shadow-md"
                      style={{ backgroundColor: color }}
                    >
                      Most Popular
                    </div>
                  )}

                  {/* Header */}
                  <div className="mb-8">
                    <span 
                      className="text-xs font-black uppercase tracking-[0.25em] px-3.5 py-1.5 rounded-full inline-block mb-4 border"
                      style={{ 
                        color, 
                        borderColor: `${color}40`,
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
                  <div className="mb-10 p-6 rounded-3xl bg-slate-950/60 border border-slate-900 flex flex-col justify-center min-h-[140px] relative">
                    {/* Launch Offer Overlay */}
                    {isLaunchOffer ? (
                      <div className="text-left space-y-2">
                        <div className="flex items-center gap-2">
                          {Number(pDetails.price) > 0 && (
                            <span className="text-sm font-bold text-slate-500 line-through mr-1">{pDetails.symbol}{pDetails.price}/yr</span>
                          )}
                          <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">Launch Deal</span>
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-5xl md:text-6xl font-black text-rose-300 tracking-tight">{pDetails.symbol}0</span>
                          <span className="text-slate-400 font-bold text-xs">/ year</span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">100% Free during current rollout</p>
                      </div>
                    ) : (
                      <div className="text-left space-y-2">
                        {pDetails.originalPrice && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-500 line-through">{pDetails.symbol}{pDetails.originalPrice}/yr</span>
                            <span className="bg-rose-500/20 text-rose-400 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
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

                  {/* Features List */}
                  <div className="flex-1 space-y-4 mb-10">
                    <h4 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-6">
                      Plan Access Details ({pkg.features?.length || 0} features)
                    </h4>
                    
                    <div className="space-y-3.5">
                      {ALL_FEATURES.map((feat) => {
                        const isIncluded = packageFeatures.includes(feat.key);
                        return (
                          <div 
                            key={feat.key} 
                            className={`flex items-start gap-3 transition-colors ${
                              isIncluded ? 'text-slate-200' : 'text-slate-600'
                            }`}
                          >
                            <div className="mt-0.5 flex-shrink-0">
                              {isIncluded ? (
                                <div 
                                  className="w-5 h-5 rounded-full flex items-center justify-center border text-white"
                                  style={{ 
                                    backgroundColor: `${color}20`, 
                                    borderColor: `${color}50`
                                  }}
                                >
                                  <Check size={12} style={{ color }} />
                                </div>
                              ) : (
                                <div className="w-5 h-5 rounded-full flex items-center justify-center border border-slate-800 bg-slate-950 text-slate-700">
                                  <Lock size={10} />
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs leading-none">{feat.icon}</span>
                                <p className="text-xs font-bold tracking-wide leading-none">{feat.label}</p>
                              </div>
                              {isIncluded && (
                                <p className="text-[10px] text-slate-500 mt-1 leading-normal">{feat.description}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* CTA Button */}
                  <Link 
                    href={`/signup?packageId=${pkg.id}`}
                    className="w-full py-5 rounded-[2rem] text-xs font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all duration-300 shadow-xl"
                    style={{ 
                      backgroundColor: isPopular ? color : 'transparent',
                      color: isPopular ? '#0c0f16' : '#fff',
                      border: `2px solid ${color}`,
                      boxShadow: isPopular ? `0 10px 25px -5px ${color}40` : 'none'
                    }}
                    onMouseEnter={(e) => {
                      if (!isPopular) {
                        e.currentTarget.style.backgroundColor = color;
                        e.currentTarget.style.color = '#0c0f16';
                        e.currentTarget.style.boxShadow = `0 10px 25px -5px ${color}40`;
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
                    Select Plan & Setup <ArrowRight size={16} />
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* Feature Map / Comparison Accordion */}
      <section className="py-24 border-t border-slate-900 bg-slate-950/60 relative">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight">Frequently Asked Questions</h2>
            <p className="text-slate-400 text-sm mt-3 font-medium">Clear answers about pricing and super admin subscriptions</p>
          </div>

          <div className="space-y-6">
            {[
              {
                q: "How are standard prices calculated?",
                a: "Our standard pricing scales dynamically based on the complexity and scope of features. The starter modules (up to 3 features) are $29/mo, standard dine-in modules are $79/mo, and all-inclusive franchise suites are $149/mo."
              },
              {
                q: "What is the launch offer?",
                a: "OrderMint is supporting local merchants by waiving subscription fees. Any plan selected during registration is 100% free with unlimited access while we scale."
              },
              {
                q: "How can I edit features or add a new plan?",
                a: "Plans/Packages are securely managed inside the Super Admin dashboard under the 'Packages' tab. Super admins can activate, deactivate, assign custom accent colors, set custom discount percentages, and configure module access for each plan."
              },
              {
                q: "What happens when I select a plan?",
                a: "Clicking 'Select Plan' redirects you to our automated 4-step Onboarding wizard. It pre-selects the plan and helps you populate your properties, floors, products, and tables within minutes."
              }
            ].map((faq, i) => (
              <div 
                key={i} 
                className="p-6 md:p-8 rounded-[2rem] border border-slate-800 bg-slate-900/30 backdrop-blur-md flex gap-4 transition-all duration-300 hover:border-slate-700/60"
              >
                <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0 text-rose-400">
                  <HelpCircle size={18} />
                </div>
                <div>
                  <h4 className="text-base md:text-lg font-bold text-white mb-2 leading-tight">{faq.q}</h4>
                  <p className="text-slate-400 text-xs md:text-sm leading-relaxed font-medium">{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
