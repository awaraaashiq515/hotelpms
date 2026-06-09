'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag, ChevronRight, AlertCircle, Search, X, Plus, Minus,
  Home, Phone, MapPin, MessageSquare, Truck, Store, CheckCircle2,
  Clock, Package, ChevronLeft, Star, Loader2, UtensilsCrossed
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface CartItem {
  id: string;
  name: string;
  sellingPrice: number;
  quantity: number;
  image?: string | null;
  variantId?: string;
  variantName?: string;
  portion?: 'FULL' | 'HALF';
}

type OrderType = 'DELIVERY' | 'TAKEAWAY';

interface GuestInfo {
  name: string;
  phone: string;
  orderType: OrderType;
  houseNo: string;
  area: string;
  landmark: string;
  deliveryAddress: string;
  deliveryInstructions: string;
}

// ─── Onboarding Screen ───────────────────────────────────────────────────────

function OnboardingScreen({
  form, setForm, onSubmit
}: {
  form: GuestInfo;
  setForm: React.Dispatch<React.SetStateAction<GuestInfo>>;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950/30 to-slate-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-purple-600/10 rounded-full blur-[80px]" />
      </div>

      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2.5rem] p-7 shadow-2xl relative z-10"
      >
        {/* Logo / Icon */}
        <div className="flex flex-col items-center gap-3 mb-7">
          <div className="w-16 h-16 bg-indigo-500/10 rounded-3xl flex items-center justify-center">
            <Home className="text-indigo-500" size={28} />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Order at Home</h1>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Fresh food, delivered to your door</p>
          </div>
        </div>

        {/* Order Type Selector */}
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-5">
          {([
            { id: 'DELIVERY', label: 'Delivery', icon: Truck },
            { id: 'TAKEAWAY', label: 'Pickup', icon: Store },
          ] as { id: OrderType; label: string; icon: any }[]).map(opt => {
            const Icon = opt.icon;
            const isActive = form.orderType === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setForm(f => ({ ...f, orderType: opt.id }))}
                className={`py-3 rounded-xl text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                  isActive
                    ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25 scale-[1.03]'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Icon size={18} />
                {opt.label}
              </button>
            );
          })}
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          {/* Name */}
          <div className="relative">
            <UtensilsCrossed size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              required
              type="text"
              placeholder="Your Full Name"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full h-13 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all"
            />
          </div>

          {/* Phone */}
          <div className="relative">
            <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              required
              type="tel"
              placeholder="Phone Number"
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              className="w-full h-13 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all"
            />
          </div>

          {/* Delivery Fields */}
          <AnimatePresence>
            {form.orderType === 'DELIVERY' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 overflow-hidden"
              >
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <MapPin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      required
                      type="text"
                      placeholder="House / Flat No."
                      value={form.houseNo}
                      onChange={e => setForm(f => ({ ...f, houseNo: e.target.value }))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-3 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>
                  <div className="relative">
                    <MapPin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      required
                      type="text"
                      placeholder="Sector / Area"
                      value={form.area}
                      onChange={e => setForm(f => ({ ...f, area: e.target.value }))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-3 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>
                <div className="relative">
                  <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Landmark (Optional)"
                    value={form.landmark}
                    onChange={e => setForm(f => ({ ...f, landmark: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all"
                  />
                </div>
                <div className="relative">
                  <MessageSquare size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Delivery Instructions (Optional)"
                    value={form.deliveryInstructions}
                    onChange={e => setForm(f => ({ ...f, deliveryInstructions: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 active:scale-[0.98] text-white rounded-2xl font-bold text-sm shadow-lg shadow-indigo-500/20 transition-all mt-2 flex items-center justify-center gap-2"
          >
            View Menu <ChevronRight size={16} />
          </button>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Active Orders Screen ─────────────────────────────────────────────────────

function OrderStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    OPEN:       { label: 'Order Placed', cls: 'bg-blue-50 text-blue-600 border-blue-100' },
    PENDING:    { label: 'Pending', cls: 'bg-blue-50 text-blue-600 border-blue-100' },
    PLACED:     { label: 'Confirmed', cls: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
    ACCEPTED:   { label: 'Accepted', cls: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
    IN_KITCHEN: { label: '👨‍🍳 Preparing', cls: 'bg-amber-50 text-amber-600 border-amber-100' },
    KOT_RUNNING:{ label: '👨‍🍳 Preparing', cls: 'bg-amber-50 text-amber-600 border-amber-100' },
    READY:      { label: '✅ Ready', cls: 'bg-teal-50 text-teal-600 border-teal-100' },
    SETTLED:    { label: '🚴 On The Way', cls: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    PAYMENT_AWAITING_APPROVAL: { label: '⏳ Payment Verifying', cls: 'bg-yellow-50 text-yellow-600 border-yellow-100' },
  };
  const s = map[status] || { label: status, cls: 'bg-slate-50 text-slate-500 border-slate-100' };
  return (
    <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${s.cls}`}>
      {s.label}
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function HomeDeliveryPage() {
  const params = useParams();
  const propertyCode = params.propertyCode as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  const [guestInfo, setGuestInfo] = useState<GuestInfo | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingForm, setOnboardingForm] = useState<GuestInfo>({
    name: '', phone: '', orderType: 'DELIVERY',
    houseNo: '', area: '', landmark: '', deliveryAddress: '', deliveryInstructions: ''
  });

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderStatus, setOrderStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'menu' | 'orders'>('menu');

  // Load guest info from sessionStorage
  useEffect(() => {
    const saved = sessionStorage.getItem('delivery_guest_info');
    if (saved) setGuestInfo(JSON.parse(saved));
  }, []);

  // Fetch menu
  const fetchData = async () => {
    try {
      const phone = guestInfo?.phone || '';
      const res = await fetch(`/api/public/menu/${propertyCode}/delivery${phone ? `?phone=${encodeURIComponent(phone)}` : ''}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        if (!activeCategory && json.data.menu?.length > 0) {
          setActiveCategory(json.data.menu[0].id);
        }
      } else {
        setError(json.message || 'Failed to load menu');
      }
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [propertyCode, guestInfo?.phone]);

  // Show onboarding if no guest
  useEffect(() => {
    if (!loading && data && !guestInfo) {
      setShowOnboarding(true);
    }
  }, [loading, data, guestInfo]);

  const cartTotal = useMemo(() => cart.reduce((s, i) => s + i.sellingPrice * i.quantity, 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((s, i) => s + i.quantity, 0), [cart]);

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { id: product.id, name: product.name, sellingPrice: product.sellingPrice, quantity: 1, image: product.image }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === productId);
      if (existing && existing.quantity > 1) return prev.map(i => i.id === productId ? { ...i, quantity: i.quantity - 1 } : i);
      return prev.filter(i => i.id !== productId);
    });
  };

  const handleOnboardingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onboardingForm.name || !onboardingForm.phone) return;
    const fullAddress = [onboardingForm.houseNo, onboardingForm.area, onboardingForm.landmark].filter(Boolean).join(', ');
    const info = { ...onboardingForm, deliveryAddress: fullAddress };
    setGuestInfo(info);
    sessionStorage.setItem('delivery_guest_info', JSON.stringify(info));
    setShowOnboarding(false);
  };

  const placeOrder = async () => {
    if (!cart.length || !guestInfo) return;
    setOrderStatus('submitting');
    try {
      const res = await fetch('/api/public/order/delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: data.property.id,
          items: cart,
          guestName: guestInfo.name,
          guestPhone: guestInfo.phone,
          deliveryAddress: guestInfo.deliveryAddress,
          deliveryInstructions: guestInfo.deliveryInstructions,
          orderType: guestInfo.orderType,
          isPrepaid: false,
        })
      });
      const json = await res.json();
      if (json.success) {
        setOrderStatus('success');
        setCart([]);
        setTimeout(() => {
          setIsCartOpen(false);
          setOrderStatus('idle');
          setActiveTab('orders');
          fetchData();
        }, 1800);
      } else {
        alert(json.message || 'Failed to place order');
        setOrderStatus('idle');
      }
    } catch {
      alert('Network error. Please try again.');
      setOrderStatus('idle');
    }
  };

  const filteredMenu = useMemo(() => {
    if (!data?.menu) return [];
    if (!searchQuery.trim()) return data.menu;
    const q = searchQuery.toLowerCase();
    return data.menu
      .map((cat: any) => ({
        ...cat,
        products: cat.products.filter((p: any) => p.name.toLowerCase().includes(q))
      }))
      .filter((cat: any) => cat.products.length > 0);
  }, [data?.menu, searchQuery]);

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Loading Menu…</p>
      </div>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center gap-4">
        <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center">
          <AlertCircle className="text-red-500" size={36} />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Something went wrong</h2>
        <p className="text-sm text-slate-500">{error}</p>
        <button onClick={() => window.location.reload()} className="px-6 py-3 bg-indigo-500 text-white rounded-2xl font-bold text-sm">
          Try Again
        </button>
      </div>
    );
  }

  const property = data?.property;
  const activeOrders = data?.activeOrders || [];

  // Check if delivery is disabled
  if (property && !property.deliveryEnabled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950/30 to-slate-950 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl text-center space-y-6 relative z-10 border border-slate-200 dark:border-slate-800">
          <div className="w-16 h-16 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto text-red-500">
            <Truck size={28} />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Ordering Closed</h1>
            <p className="text-xs text-indigo-500 font-bold uppercase tracking-widest">
              {property.brandName || property.name}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed pt-2">
              Home Delivery and Pickup orders are currently disabled. Please check back later or call the restaurant directly.
            </p>
          </div>
          {property.phone && (
            <a
              href={`tel:${property.phone}`}
              className="inline-flex items-center justify-center gap-2 w-full py-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-indigo-500/20 transition-all"
            >
              Call Restaurant
            </a>
          )}
        </div>
      </div>
    );
  }

  // ── Onboarding ──
  if (showOnboarding) {
    return <OnboardingScreen form={onboardingForm} setForm={setOnboardingForm} onSubmit={handleOnboardingSubmit} />;
  }

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-slate-950 font-sans">
      {/* Top Bar */}
      <div className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3 px-4 py-3">
          {property?.logoUrl && (
            <img src={property.logoUrl} alt="logo" className="w-9 h-9 rounded-xl object-cover shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-black text-slate-900 dark:text-white truncate uppercase tracking-tight">
              {property?.brandName || property?.name}
            </h1>
            <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
              {guestInfo?.orderType === 'DELIVERY' ? <Truck size={9} /> : <Store size={9} />}
              {guestInfo?.orderType === 'DELIVERY' ? 'Home Delivery' : 'Pickup'}
              {guestInfo?.name && <> · {guestInfo.name}</>}
            </p>
          </div>
          <button
            onClick={() => { sessionStorage.removeItem('delivery_guest_info'); setGuestInfo(null); setShowOnboarding(true); }}
            className="text-[10px] text-indigo-500 font-black uppercase tracking-widest"
          >
            Change
          </button>
        </div>

        {/* Tab Bar */}
        <div className="flex border-t border-slate-100 dark:border-slate-800">
          {[
            { id: 'menu', label: 'Menu', icon: UtensilsCrossed },
            { id: 'orders', label: `Orders${activeOrders.length > 0 ? ` (${activeOrders.length})` : ''}`, icon: Package },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'menu' | 'orders')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-[11px] font-black uppercase tracking-widest transition-all border-b-2 ${
                  isActive ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-400'
                }`}
              >
                <Icon size={13} /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search */}
        {activeTab === 'menu' && (
          <div className="px-4 py-2">
            <div className="relative">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search dishes…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm text-slate-800 dark:text-white font-medium outline-none"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* MENU TAB */}
      {activeTab === 'menu' && (
        <div className="pb-32">
          {/* Category Pills */}
          {!searchQuery && filteredMenu.length > 0 && (
            <div className="sticky top-[120px] z-20 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md py-2 px-4 overflow-x-auto no-scrollbar flex gap-2 border-b border-slate-50 dark:border-slate-900">
              {filteredMenu.map((cat: any) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat.id);
                    document.getElementById(`cat-${cat.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className={`whitespace-nowrap px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${
                    activeCategory === cat.id ? 'bg-indigo-500 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-900 text-slate-400'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}

          {/* Products */}
          <div className="px-4 pt-4 space-y-8">
            {filteredMenu.map((cat: any) => (
              <div key={cat.id} id={`cat-${cat.id}`}>
                <h2 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">{cat.name}</h2>
                <div className="space-y-2">
                  {cat.products.map((product: any) => {
                    const cartItem = cart.find(i => i.id === product.id);
                    return (
                      <div key={product.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-3.5 flex items-center gap-3 shadow-sm">
                        {product.image && (
                          <img src={product.image} alt={product.name} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            {product.isVeg !== null && (
                              <div className={`w-3 h-3 rounded-sm border ${product.isVeg ? 'border-emerald-500' : 'border-red-500'} flex items-center justify-center shrink-0`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${product.isVeg ? 'bg-emerald-500' : 'bg-red-500'}`} />
                              </div>
                            )}
                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{product.name}</p>
                          </div>
                          {product.description && (
                            <p className="text-[10px] text-slate-400 font-medium line-clamp-1">{product.description}</p>
                          )}
                          <p className="text-sm font-black text-indigo-600 dark:text-indigo-400 mt-1">₹{product.sellingPrice}</p>
                        </div>
                        <div className="shrink-0">
                          {cartItem ? (
                            <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl px-2 py-1 border border-indigo-100 dark:border-indigo-900/30">
                              <button onClick={() => removeFromCart(product.id)} className="w-6 h-6 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center text-indigo-500 shadow-sm">
                                <Minus size={12} />
                              </button>
                              <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 w-5 text-center">{cartItem.quantity}</span>
                              <button onClick={() => addToCart(product)} className="w-6 h-6 rounded-lg bg-indigo-500 flex items-center justify-center text-white shadow-sm">
                                <Plus size={12} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => addToCart(product)}
                              className="w-9 h-9 rounded-xl bg-indigo-500 hover:bg-indigo-600 active:scale-95 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 transition-all"
                            >
                              <Plus size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ORDERS TAB */}
      {activeTab === 'orders' && (
        <div className="p-4 space-y-3 pb-32">
          {activeOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                <Package size={24} className="text-slate-300" />
              </div>
              <p className="text-sm font-bold text-slate-500">No active orders</p>
              <button onClick={() => setActiveTab('menu')} className="px-5 py-2.5 bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-widest">
                Browse Menu
              </button>
            </div>
          ) : (
            activeOrders.map((order: any) => (
              <div key={order.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">#{order.orderNo}</p>
                    <p className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                      {order.orderType === 'DELIVERY' ? '🏠 Home Delivery' : '🏪 Pickup'}
                    </p>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </div>
                {order.items && order.items.length > 0 && (
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 space-y-1">
                    {order.items.map((item: any, i: number) => (
                      <div key={i} className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                        <span>{item.product?.name || item.name}</span>
                        <span className="text-indigo-500">x{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-black text-slate-900 dark:text-white">₹{Math.round(order.grandTotal || 0)}</span>
                  <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                    <Clock size={10} /> {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Floating Cart Button */}
      <AnimatePresence>
        {cart.length > 0 && activeTab === 'menu' && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-4 right-4 z-40"
          >
            <button
              onClick={() => setIsCartOpen(true)}
              className="w-full bg-slate-900 dark:bg-white rounded-[2rem] p-3 px-5 flex items-center justify-between shadow-2xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-indigo-500 rounded-2xl flex items-center justify-center relative">
                  <ShoppingBag size={18} className="text-white" />
                  <span className="absolute -top-1.5 -right-1.5 bg-white text-indigo-600 text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-900">
                    {cartCount}
                  </span>
                </div>
                <div>
                  <p className="text-[9px] font-black text-white/50 dark:text-slate-400 uppercase tracking-widest leading-none">Subtotal</p>
                  <p className="text-lg font-black text-white dark:text-slate-900">₹{cartTotal}</p>
                </div>
              </div>
              <span className="flex items-center gap-1 h-10 px-5 bg-indigo-500 text-white rounded-xl font-black text-[11px] uppercase tracking-widest shadow-lg">
                Checkout <ChevronRight size={14} />
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 rounded-t-[2.5rem] p-6 shadow-2xl max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Your Order</h3>
                <button onClick={() => setIsCartOpen(false)} className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <X size={16} className="text-slate-500" />
                </button>
              </div>

              {/* Delivery info badge */}
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 mb-4">
                {guestInfo?.orderType === 'DELIVERY' ? <Truck size={14} className="text-indigo-500 shrink-0" /> : <Store size={14} className="text-indigo-500 shrink-0" />}
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                    {guestInfo?.orderType === 'DELIVERY' ? 'Delivering to' : 'Pickup for'}
                  </p>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">
                    {guestInfo?.orderType === 'DELIVERY'
                      ? guestInfo?.deliveryAddress || `${guestInfo?.houseNo}, ${guestInfo?.area}`
                      : guestInfo?.name}
                  </p>
                </div>
              </div>

              {/* Cart items */}
              <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 rounded-2xl p-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{item.name}</p>
                      <p className="text-xs font-black text-indigo-500">₹{item.sellingPrice * item.quantity}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => removeFromCart(item.id)} className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center">
                        <Minus size={12} className="text-slate-500" />
                      </button>
                      <span className="text-sm font-black text-slate-900 dark:text-white w-5 text-center">{item.quantity}</span>
                      <button onClick={() => addToCart({ id: item.id, name: item.name, sellingPrice: item.sellingPrice })} className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center">
                        <Plus size={12} className="text-white" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total + Place Order */}
              <div className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500 font-bold">Total Amount</span>
                  <span className="text-xl font-black text-slate-900 dark:text-white">₹{cartTotal}</span>
                </div>

                {orderStatus === 'success' ? (
                  <div className="flex items-center justify-center gap-2 py-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl text-emerald-600 dark:text-emerald-400 font-black text-sm">
                    <CheckCircle2 size={20} /> Order Placed Successfully!
                  </div>
                ) : (
                  <button
                    onClick={placeOrder}
                    disabled={orderStatus === 'submitting'}
                    className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 active:scale-[0.98] text-white rounded-2xl font-black text-sm shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {orderStatus === 'submitting'
                      ? <><Loader2 size={16} className="animate-spin" /> Placing Order…</>
                      : <><Truck size={16} /> Place {guestInfo?.orderType === 'DELIVERY' ? 'Delivery' : 'Pickup'} Order</>
                    }
                  </button>
                )}

                <p className="text-center text-[10px] text-slate-400 font-medium">
                  Payment will be collected {guestInfo?.orderType === 'DELIVERY' ? 'at your door' : 'at the counter'}
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;700;800;900&display=swap');
        body { font-family: 'Outfit', sans-serif; -webkit-tap-highlight-color: transparent; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
