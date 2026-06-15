'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag, ChevronRight, AlertCircle, Search, X, Plus, Minus,
  Home, Phone, MapPin, MessageSquare, Truck, Store, CheckCircle2,
  Clock, Package, ChevronLeft, Star, Loader2, UtensilsCrossed,
  Map, User, ArrowRight, Eye, ShieldAlert, Sparkles, Navigation
} from 'lucide-react';
import { MapPicker } from '@/components/menu/MapPicker';

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
  taxRate?: number | null;
  taxType?: string | null;
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
  deliveryLat?: number;
  deliveryLng?: number;
  addressType?: 'Home' | 'Work' | 'Other';
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-indigo-650/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-100px] right-[-50px] w-[350px] h-[350px] bg-pink-650/10 rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl relative z-10"
      >
        {/* Logo / Header */}
        <div className="flex flex-col items-center gap-3 mb-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Home className="text-white" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white uppercase bg-clip-text bg-gradient-to-r from-white via-slate-100 to-indigo-200">
              Home Delivery QR
            </h1>
            <p className="text-xs text-slate-400 font-semibold mt-1">Fresh food, direct to your doorstep</p>
          </div>
        </div>

        {/* Order Type Selector */}
        <div className="grid grid-cols-2 gap-2.5 p-1.5 bg-slate-950/60 border border-slate-800/80 rounded-2xl mb-6">
          {([
            { id: 'DELIVERY', label: 'Home Delivery', icon: Truck },
            { id: 'TAKEAWAY', label: 'Self Pickup', icon: Store },
          ] as { id: OrderType; label: string; icon: any }[]).map(opt => {
            const Icon = opt.icon;
            const isActive = form.orderType === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setForm(f => ({ ...f, orderType: opt.id }))}
                className={`py-3.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 scale-[1.02]'
                    : 'text-slate-400 hover:text-slate-200 bg-transparent'
                }`}
              >
                <Icon size={16} />
                {opt.label}
              </button>
            );
          })}
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Name */}
          <div className="relative">
            <User size={16} className="absolute left-4.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              required
              type="text"
              placeholder="Your Full Name"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full bg-slate-950/40 border border-slate-800 focus:border-indigo-500 rounded-2xl pl-12 pr-4 py-4 text-sm font-semibold text-white outline-none transition-all placeholder:text-slate-500"
            />
          </div>

          {/* Phone */}
          <div className="relative">
            <Phone size={16} className="absolute left-4.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              required
              type="tel"
              placeholder="Phone Number"
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              className="w-full bg-slate-950/40 border border-slate-800 focus:border-indigo-500 rounded-2xl pl-12 pr-4 py-4 text-sm font-semibold text-white outline-none transition-all placeholder:text-slate-500"
            />
          </div>

          {/* Delivery Fields */}
          <AnimatePresence initial={false}>
            {form.orderType === 'DELIVERY' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4 overflow-hidden"
              >
                {/* Google Map Picker */}
                <div className="text-slate-900 dark:text-white mb-2">
                  <MapPicker
                    initialAddress={form.deliveryAddress}
                    onAddressSelect={(address, lat, lng) => {
                      const parts = address.split(',').map(p => p.trim()).filter(Boolean);
                      const pinCodeMatch = address.match(/\b\d{6}\b/);
                      const pinCode = pinCodeMatch ? pinCodeMatch[0] : '';
                      
                      let houseNo = '';
                      let area = '';
                      let landmark = '';

                      if (parts.length > 0) {
                        houseNo = parts[0];
                      }
                      
                      if (parts.length > 1) {
                        const middleParts = parts.slice(1).filter(part => {
                          const isCountry = ['india', 'pakistan', 'bangladesh', 'nepal'].includes(part.toLowerCase());
                          const isState = ['himachal pradesh', 'delhi', 'punjab', 'haryana', 'uttar pradesh', 'maharashtra', 'uttarakhand', 'jammu and kashmir'].includes(part.toLowerCase());
                          const containsPin = part.includes(pinCode);
                          return !isCountry && !isState && !containsPin;
                        });
                        area = middleParts.join(', ');
                      }

                      if (pinCode) {
                        landmark = `PIN: ${pinCode}`;
                      }

                      setForm(f => ({
                        ...f,
                        deliveryAddress: address,
                        deliveryLat: lat,
                        deliveryLng: lng,
                        houseNo: houseNo || f.houseNo,
                        area: area || f.area,
                        landmark: landmark || f.landmark
                      }));
                    }}
                  />
                </div>

                {/* Address Type Selector */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-405">
                    Address Label
                  </label>
                  <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-950/60 border border-slate-800/80 rounded-2xl">
                    {([
                      { id: 'Home', label: '🏠 Home' },
                      { id: 'Work', label: '💼 Work' },
                      { id: 'Other', label: '📍 Other' }
                    ] as { id: 'Home' | 'Work' | 'Other'; label: string }[]).map(opt => {
                      const isActive = (form.addressType || 'Home') === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setForm(f => ({ ...f, addressType: opt.id }))}
                          className={`py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                            isActive
                              ? 'bg-indigo-650 text-white shadow-md'
                              : 'text-slate-400 hover:text-slate-205'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <MapPin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      required
                      type="text"
                      placeholder="House / Flat No."
                      value={form.houseNo}
                      onChange={e => setForm(f => ({ ...f, houseNo: e.target.value }))}
                      className="w-full bg-slate-950/40 border border-slate-800 focus:border-indigo-500 rounded-2xl pl-10 pr-3 py-3.5 text-sm font-semibold text-white outline-none transition-all placeholder:text-slate-500"
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
                      className="w-full bg-slate-950/40 border border-slate-800 focus:border-indigo-500 rounded-2xl pl-10 pr-3 py-3.5 text-sm font-semibold text-white outline-none transition-all placeholder:text-slate-500"
                    />
                  </div>
                </div>
                
                <div className="relative">
                  <MapPin size={16} className="absolute left-4.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Landmark (Optional)"
                    value={form.landmark}
                    onChange={e => setForm(f => ({ ...f, landmark: e.target.value }))}
                    className="w-full bg-slate-950/40 border border-slate-800 focus:border-indigo-500 rounded-2xl pl-12 pr-4 py-4 text-sm font-semibold text-white outline-none transition-all placeholder:text-slate-500"
                  />
                </div>

                <div className="relative">
                  <MessageSquare size={16} className="absolute left-4.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Delivery Instructions (e.g. Leave at door)"
                    value={form.deliveryInstructions}
                    onChange={e => setForm(f => ({ ...f, deliveryInstructions: e.target.value }))}
                    className="w-full bg-slate-950/40 border border-slate-800 focus:border-indigo-500 rounded-2xl pl-12 pr-4 py-4 text-sm font-semibold text-white outline-none transition-all placeholder:text-slate-500"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            className="w-full py-4.5 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-indigo-600/20 transition-all mt-4 flex items-center justify-center gap-2 cursor-pointer"
          >
            Enter Digital Storefront <ArrowRight size={14} />
          </button>
        </form>
      </motion.div>
    </div>
  );
}

// Deterministic OTP helper matching backend
function getDeliveryOtp(orderId: string): string {
  let hash = 0;
  for (let i = 0; i < orderId.length; i++) {
    hash = orderId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const otp = Math.abs(hash % 9000 + 1000);
  return otp.toString();
}

// ─── Active Orders Screen ─────────────────────────────────────────────────────

function OrderStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    OPEN:       { label: 'Order Placed', cls: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
    PENDING:    { label: 'Pending Approval', cls: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
    PLACED:     { label: 'Confirmed', cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    ACCEPTED:   { label: 'Accepted', cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    IN_KITCHEN: { label: 'Cooking', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    KOT_RUNNING:{ label: 'Cooking', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    READY:      { label: 'Ready', cls: 'bg-teal-500/10 text-teal-400 border-teal-500/20' },
    OUT_FOR_DELIVERY: { label: 'Out For Delivery', cls: 'bg-purple-500/10 text-purple-400 border-purple-500/20 animate-pulse' },
    SETTLED:    { label: 'Delivered', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    COMPLETED:  { label: 'Delivered', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    CANCELLED:  { label: 'Cancelled', cls: 'bg-red-500/10 text-red-400 border-red-500/20' },
    PAYMENT_AWAITING_APPROVAL: { label: 'Payment Verifying', cls: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  };
  const s = map[status] || { label: status, cls: 'bg-slate-500/10 text-slate-400 border-slate-500/20' };
  return (
    <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${s.cls}`}>
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
  const property = data?.property;

  const [guestInfo, setGuestInfo] = useState<GuestInfo | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingForm, setOnboardingForm] = useState<GuestInfo>({
    name: '', phone: '', orderType: 'DELIVERY',
    houseNo: '', area: '', landmark: '', deliveryAddress: '', deliveryInstructions: '',
    deliveryLat: undefined, deliveryLng: undefined,
    addressType: 'Home'
  });

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderStatus, setOrderStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'menu' | 'orders' | 'profile'>('menu');
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Synchronize onboardingForm when guestInfo changes
  useEffect(() => {
    if (guestInfo) {
      setOnboardingForm(guestInfo);
    }
  }, [guestInfo]);

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

  // Distance calculator helper
  const calcDist = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

  // Resolve active delivery zone & fee
  const { resolvedZone, resolvedDeliveryFee } = useMemo(() => {
    const isTakeaway = (guestInfo?.orderType ?? onboardingForm.orderType) === 'TAKEAWAY';
    if (isTakeaway) return { resolvedZone: null, resolvedDeliveryFee: 0 };

    const lat = guestInfo?.deliveryLat ?? onboardingForm.deliveryLat;
    const lng = guestInfo?.deliveryLng ?? onboardingForm.deliveryLng;
    const address = guestInfo?.deliveryAddress ?? onboardingForm.deliveryAddress ?? '';
    const pincodeMatch = address.match(/\b\d{6}\b/);
    const pincode = pincodeMatch ? pincodeMatch[0] : '';

    let matchedZone = null;
    const zones = data?.deliveryZones || [];

    if (zones.length > 0) {
      // 1. Match by pincode
      if (pincode) {
        matchedZone = zones.find((zone: any) => {
          if (zone.type !== 'PINCODE' || !zone.pincodes) return false;
          try {
            const codes = JSON.parse(zone.pincodes);
            return Array.isArray(codes) && codes.includes(pincode);
          } catch {
            return false;
          }
        });
      }

      // 2. Match by radius
      if (!matchedZone && lat && lng && property?.latitude && property?.longitude) {
        const dist = calcDist(
          Number(property.latitude),
          Number(property.longitude),
          Number(lat),
          Number(lng)
        );

        const radiusZones = zones
          .filter((z: any) => z.type === 'RADIUS' && z.radiusKm !== null && dist <= z.radiusKm)
          .sort((a: any, b: any) => (a.radiusKm || 0) - (b.radiusKm || 0));

        if (radiusZones.length > 0) {
          matchedZone = radiusZones[0];
        }
      }

      // 3. Fallback to first zone or default
      if (!matchedZone) {
        matchedZone = zones[0];
      }
    }

    return {
      resolvedZone: matchedZone,
      resolvedDeliveryFee: matchedZone ? (matchedZone.deliveryFee ?? 0) : 30
    };
  }, [guestInfo, onboardingForm, data?.deliveryZones, property]);

  // Tax calculations
  const { billSubtotal, billTaxAmount, billCgst, billSgst, billGrandTotal } = useMemo(() => {
    let subtotal = 0;
    let taxAmount = 0;

    cart.forEach(item => {
      const itemTotal = item.sellingPrice * item.quantity;
      const taxRate = item.taxRate ?? 5;
      const taxType = item.taxType || 'EXCLUSIVE';
      
      let itemSub = 0;
      let itemTax = 0;

      if (taxType === 'EXEMPT') {
        itemSub = itemTotal;
        itemTax = 0;
      } else if (taxType === 'INCLUSIVE') {
        itemSub = itemTotal / (1 + taxRate / 100);
        itemTax = itemTotal - itemSub;
      } else {
        itemSub = itemTotal;
        itemTax = itemTotal * (taxRate / 100);
      }

      subtotal += itemSub;
      taxAmount += itemTax;
    });

    const cgst = taxAmount / 2;
    const sgst = taxAmount / 2;
    const grandTotal = subtotal + taxAmount + resolvedDeliveryFee;

    return {
      billSubtotal: Math.round(subtotal * 100) / 100,
      billTaxAmount: Math.round(taxAmount * 100) / 100,
      billCgst: Math.round(cgst * 100) / 100,
      billSgst: Math.round(sgst * 100) / 100,
      billGrandTotal: Math.round(grandTotal)
    };
  }, [cart, resolvedDeliveryFee]);

  const { currentOrders, pastOrders } = useMemo(() => {
    const active = (data?.activeOrders || []).filter((o: any) => 
      !['SETTLED', 'COMPLETED', 'CANCELLED'].includes(o.status)
    );
    const past = (data?.activeOrders || []).filter((o: any) => 
      ['SETTLED', 'COMPLETED', 'CANCELLED'].includes(o.status)
    );
    return { currentOrders: active, pastOrders: past };
  }, [data?.activeOrders]);

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { 
        id: product.id, 
        name: product.name, 
        sellingPrice: product.sellingPrice, 
        quantity: 1, 
        image: product.image,
        taxRate: product.taxRate,
        taxType: product.taxType
      }];
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
    
    const labelPrefix = onboardingForm.addressType === 'Work' ? '💼 Work' : onboardingForm.addressType === 'Other' ? '📍 Other' : '🏠 Home';
    
    const addressParts = [
      labelPrefix + ':',
      onboardingForm.houseNo,
      onboardingForm.area,
      onboardingForm.landmark,
      onboardingForm.deliveryAddress
    ].filter(Boolean).join(', ');
    const info = { ...onboardingForm, deliveryAddress: addressParts };
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
          deliveryLat: guestInfo.deliveryLat,
          deliveryLng: guestInfo.deliveryLng,
          deliveryZoneId: resolvedZone?.id || null,
          deliveryFee: resolvedDeliveryFee,
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
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Resolving Menu…</p>
      </div>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center gap-4">
        <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-center justify-center text-red-500">
          <AlertCircle size={36} />
        </div>
        <h2 className="text-xl font-black text-white uppercase tracking-tight">Failed to load Menu</h2>
        <p className="text-xs text-slate-400 font-semibold max-w-xs leading-relaxed">{error}</p>
        <button onClick={() => window.location.reload()} className="px-6 py-3.5 bg-indigo-650 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-md">
          Retry Connection
        </button>
      </div>
    );
  }

  const activeOrders = data?.activeOrders || [];

  // Check if delivery is disabled
  if (property && !property.deliveryEnabled) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl text-center space-y-6 relative z-10">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-center justify-center mx-auto text-red-500">
            <Truck size={28} />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-black text-white uppercase tracking-tight">Ordering Suspended</h1>
            <p className="text-xs text-indigo-500 font-black uppercase tracking-widest">
              {property.brandName || property.name}
            </p>
            <p className="text-xs text-slate-400 font-medium leading-relaxed pt-2">
              Home delivery orders are currently offline. Please call the restaurant directly to place your order.
            </p>
          </div>
          {property.phone && (
            <a
              href={`tel:${property.phone}`}
              className="inline-flex items-center justify-center gap-2 w-full py-4.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-indigo-600/20 transition-all"
            >
              Call Kitchen
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
    <div className="relative min-h-screen bg-slate-950 text-slate-150 font-sans selection:bg-indigo-600 selection:text-white pb-32">
      {/* Top Banner Accent */}
      <div className="fixed top-0 left-0 right-0 h-[220px] bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none -z-10" />

      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 shadow-md">
        <div className="flex items-center justify-between gap-3 px-4 py-4.5">
          <div className="flex items-center gap-3 min-w-0">
            {property?.logoUrl ? (
              <img src={property.logoUrl} alt="logo" className="w-10 h-10 rounded-2xl object-cover border border-slate-800 shrink-0 shadow-inner" />
            ) : (
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                <Store size={18} />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-sm font-black text-white uppercase tracking-tight truncate">
                {property?.brandName || property?.name}
              </h1>
              <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                {guestInfo?.orderType === 'DELIVERY' ? <Truck size={10} /> : <Store size={10} />}
                {guestInfo?.orderType === 'DELIVERY' ? 'Home Delivery' : 'Pickup'}
                {guestInfo?.name && <span className="text-slate-400 font-semibold">· {guestInfo.name}</span>}
              </p>
            </div>
          </div>
          <button
            onClick={() => { sessionStorage.removeItem('delivery_guest_info'); setGuestInfo(null); setShowOnboarding(true); }}
            className="text-[9px] font-black text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 px-3.5 py-2 rounded-xl uppercase tracking-widest border border-indigo-500/20 transition-all cursor-pointer shrink-0"
          >
            Change Details
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-t border-slate-800/80 bg-slate-950/40">
          {[
            { id: 'menu', label: 'Order Menu', icon: UtensilsCrossed },
            { id: 'orders', label: `My Orders${currentOrders.length > 0 ? ` (${currentOrders.length})` : ''}`, icon: Clock },
            { id: 'profile', label: 'My Profile', icon: User },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'menu' | 'orders' | 'profile')}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-[10px] font-black uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
                  isActive 
                    ? 'border-indigo-500 text-indigo-400 bg-indigo-500/[0.02]' 
                    : 'border-transparent text-slate-500 hover:text-slate-350'
                }`}
              >
                <Icon size={14} /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search */}
        {activeTab === 'menu' && (
          <div className="px-4 py-3 bg-slate-950/20 border-t border-slate-800/40">
            <div className="relative">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search dishes, drinks, meals..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm font-semibold text-white outline-none focus:border-indigo-500 transition-all placeholder:text-slate-500 shadow-inner"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  <X size={15} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* MENU TAB */}
      {activeTab === 'menu' && (
        <div>
          {/* Category Pill Navigation */}
          {!searchQuery && filteredMenu.length > 0 && (
            <div className="sticky top-[152px] z-20 bg-slate-950/80 backdrop-blur-md py-3 px-4 overflow-x-auto no-scrollbar flex gap-2 border-b border-slate-900">
              {filteredMenu.map((cat: any) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat.id);
                    document.getElementById(`cat-${cat.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className={`whitespace-nowrap px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shrink-0 border cursor-pointer ${
                    activeCategory === cat.id 
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/20' 
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}

          {/* Dish List */}
          <div className="px-4 pt-5 space-y-9 max-w-md mx-auto">
            {filteredMenu.map((cat: any) => (
              <div key={cat.id} id={`cat-${cat.id}`} className="scroll-mt-52">
                <h2 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Sparkles size={12} />
                  {cat.name}
                </h2>
                <div className="space-y-3.5">
                  {cat.products.map((product: any) => {
                    const cartItem = cart.find(i => i.id === product.id);
                    return (
                      <div 
                        key={product.id} 
                        className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-4 flex items-center justify-between gap-4 transition-all hover:bg-slate-900/60"
                      >
                        {product.image && (
                          <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 border border-slate-800/60 shadow-md">
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            {product.isVeg !== null && (
                              <div className={`w-3.5 h-3.5 rounded border ${product.isVeg ? 'border-emerald-500 bg-emerald-500/10' : 'border-red-500 bg-red-500/10'} flex items-center justify-center shrink-0`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${product.isVeg ? 'bg-emerald-500' : 'bg-red-500'}`} />
                              </div>
                            )}
                            <p className="text-sm font-extrabold text-white truncate uppercase tracking-tight">{product.name}</p>
                          </div>
                          {product.description && (
                            <p className="text-[11px] text-slate-400 font-semibold leading-relaxed line-clamp-2 pr-1">{product.description}</p>
                          )}
                          <p className="text-sm font-black text-indigo-400 mt-2">₹{product.sellingPrice}</p>
                        </div>
                        <div className="shrink-0 pl-1">
                          {cartItem ? (
                            <div className="flex items-center gap-2 bg-indigo-950/40 rounded-2xl px-2 py-1.5 border border-indigo-900/40 shadow-inner">
                              <button 
                                onClick={() => removeFromCart(product.id)} 
                                className="w-7 h-7 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-indigo-400 active:scale-95 transition-transform"
                              >
                                <Minus size={11} />
                              </button>
                              <span className="text-xs font-black text-indigo-400 w-5 text-center">{cartItem.quantity}</span>
                              <button 
                                onClick={() => addToCart(product)} 
                                className="w-7 h-7 rounded-xl bg-indigo-600 flex items-center justify-center text-white active:scale-95 transition-transform shadow-md"
                              >
                                <Plus size={11} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => addToCart(product)}
                              className="w-10 h-10 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 flex items-center justify-center text-white shadow-lg shadow-indigo-600/15 border border-indigo-500/20 transition-all cursor-pointer"
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

            {filteredMenu.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center gap-4 bg-slate-900/30 border border-slate-800/60 rounded-[2rem]">
                <UtensilsCrossed size={36} className="text-slate-655" />
                <div className="space-y-1">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No matching items found</p>
                  <p className="text-[10px] text-slate-500 font-semibold">Try searching for something else or browse categories</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ORDERS TAB */}
      {activeTab === 'orders' && (
        <div className="p-4 space-y-5 max-w-md mx-auto">
          {/* Active Deliveries */}
          {currentOrders.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1.5 px-1">
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-ping" />
                Active Deliveries ({currentOrders.length})
              </h2>
              
              {currentOrders.map((order: any) => {
                // Timeline Steps Config
                const stages = [
                  { key: 'PLACED', label: 'Placed', active: true },
                  { key: 'ACCEPTED', label: 'Accepted', active: ['ACCEPTED', 'IN_KITCHEN', 'READY', 'OUT_FOR_DELIVERY', 'SETTLED', 'COMPLETED'].includes(order.status) },
                  { key: 'IN_KITCHEN', label: 'Preparing', active: ['IN_KITCHEN', 'READY', 'OUT_FOR_DELIVERY', 'SETTLED', 'COMPLETED'].includes(order.status) },
                  { key: 'READY', label: 'Ready', active: ['READY', 'OUT_FOR_DELIVERY', 'SETTLED', 'COMPLETED'].includes(order.status) },
                  { key: 'DELIVERED', label: 'Out / Delivered', active: ['OUT_FOR_DELIVERY', 'SETTLED', 'COMPLETED'].includes(order.status) },
                ];

                return (
                  <div key={order.id} className="bg-slate-900 border border-slate-800 rounded-[2rem] p-5 shadow-xl space-y-5">
                    {/* Title Bar */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block">
                          #{order.orderNo.slice(-6)} • {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <h3 className="text-sm font-extrabold text-white uppercase mt-0.5 tracking-tight">
                          {order.orderType === 'DELIVERY' ? '🏠 Home Delivery' : '🏪 Self Pickup'}
                        </h3>
                      </div>
                      <OrderStatusBadge status={order.status} />
                    </div>

                    {/* Rider / Driver Details (If Assigned) */}
                    {(order.deliveryRider || order.driver) && (
                      <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-inner">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md">
                            <User size={18} />
                          </div>
                          <div>
                            <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Assigned Rider</p>
                            <p className="text-xs font-black text-white">{order.deliveryRider?.firstName || order.driver?.firstName || 'Rider'}</p>
                            {(order.deliveryRider?.vehicleNumber || order.driver?.vehicleNumber) && (
                              <p className="text-[10px] text-slate-450 font-bold">{order.deliveryRider?.vehicleNumber || order.driver?.vehicleNumber}</p>
                            )}
                          </div>
                        </div>
                        {(order.deliveryRider?.mobile || order.driver?.mobile) && (
                          <a
                            href={`tel:${order.deliveryRider?.mobile || order.driver?.mobile}`}
                            className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-emerald-450 hover:bg-slate-900 active:scale-95 transition-all shadow-md shrink-0"
                          >
                            <Phone size={14} />
                          </a>
                        )}
                      </div>
                    )}

                    {/* Timeline Tracker */}
                    {order.status !== 'CANCELLED' && (
                      <div className="border-y border-slate-800/60 py-5 px-1 space-y-3">
                        {/* Timeline Line & Dots Row */}
                        <div className="relative flex justify-between items-center w-full px-2 h-6">
                          {/* Connecting Line Backdrop */}
                          <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-[3px] bg-slate-800 z-0" />
                          {/* Active Progress Line */}
                          <div 
                            className="absolute left-4 top-1/2 -translate-y-1/2 h-[3px] bg-gradient-to-r from-indigo-500 to-emerald-500 z-0 transition-all duration-1000"
                            style={{
                              width: `${
                                order.status === 'SETTLED' || order.status === 'COMPLETED' ? 'calc(100% - 32px)' :
                                order.status === 'OUT_FOR_DELIVERY' ? '88%' :
                                order.status === 'READY' ? '75%' :
                                order.status === 'IN_KITCHEN' || order.status === 'KOT_RUNNING' ? '50%' :
                                order.status === 'ACCEPTED' ? '25%' : '0%'
                              }`
                            }}
                          />

                          {stages.map((st, i) => (
                            <div 
                              key={i} 
                              className={`w-5 h-5 rounded-full border-4 flex items-center justify-center transition-all relative z-10 ${
                                st.active 
                                  ? 'bg-slate-950 border-indigo-500 scale-110 shadow-[0_0_8px_rgba(99,102,241,0.4)]' 
                                  : 'bg-slate-950 border-slate-800'
                              }`}
                            >
                              {st.active && i === stages.length - 1 && (
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Labels Row */}
                        <div className="flex justify-between items-start w-full text-center">
                          {stages.map((st, i) => (
                            <div key={i} className="w-14 shrink-0 flex justify-center">
                              <span className={`text-[8px] font-black uppercase tracking-wider block leading-tight ${
                                st.active ? 'text-indigo-400' : 'text-slate-500 font-semibold'
                              }`}>
                                {st.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Delivery Verification OTP */}
                    {order.status !== 'SETTLED' && order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
                      <div className="relative overflow-hidden rounded-[2rem] border border-slate-800 bg-gradient-to-br from-indigo-950/40 via-slate-900/90 to-purple-950/20 p-6 shadow-2xl backdrop-blur-xl group">
                        {/* Ambient background lights */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
                        
                        <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                          {/* Header Badge */}
                          <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/25 px-3.5 py-1 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
                            <span className="text-[9px] font-black text-indigo-300 uppercase tracking-[0.25em] font-sans">
                              Handover Verification OTP
                            </span>
                          </div>

                          {/* Beautiful Keypad Digit Boxes */}
                          <div className="flex justify-center gap-3 my-1">
                            {getDeliveryOtp(order.id).split('').map((digit, idx) => (
                              <div 
                                key={idx}
                                className="w-12 h-14 rounded-xl bg-slate-950 border border-slate-800 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] flex items-center justify-center relative overflow-hidden"
                              >
                                <span className="text-2xl font-black text-white font-mono select-all tracking-normal">
                                  {digit}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Warning / Instruction */}
                          <div className="space-y-1">
                            <p className="text-[10px] text-slate-350 font-bold uppercase tracking-wider flex items-center justify-center gap-1.5">
                              🔑 Customer PIN Code
                            </p>
                            <p className="text-[9px] text-slate-450 font-semibold leading-relaxed max-w-[280px]">
                              {order.status === 'OUT_FOR_DELIVERY' 
                                ? 'Rider is arriving soon. Share this 4-digit code to verify and receive your package.'
                                : 'Please read out this secure code to the rider only after receiving your package.'}
                            </p>
                          </div>

                          {/* Interactive Copy Code Button */}
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(getDeliveryOtp(order.id));
                              const btn = document.getElementById(`copy-otp-${order.id}`);
                              if (btn) {
                                const originalText = btn.innerHTML;
                                btn.innerHTML = `<span class="text-emerald-400 font-black">✓ Copied Code</span>`;
                                setTimeout(() => {
                                  btn.innerHTML = originalText;
                                }, 2000);
                              }
                            }}
                            id={`copy-otp-${order.id}`}
                            className="text-[9px] font-black text-indigo-400 bg-slate-950 hover:bg-slate-900 border border-slate-800/80 px-4 py-2 rounded-xl uppercase tracking-widest transition-all cursor-pointer hover:border-indigo-500/30 active:scale-95 shadow-md flex items-center gap-1.5"
                          >
                            Copy OTP
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Items List */}
                    {order.items && order.items.length > 0 && (
                      <div className="bg-slate-950/60 rounded-2xl p-4 border border-slate-800/40 space-y-2">
                        {order.items.map((item: any, i: number) => (
                          <div key={i} className="flex justify-between items-center text-xs font-bold text-slate-400">
                            <span className="truncate max-w-[180px] text-slate-300">{item.product?.name || item.name}</span>
                            <span className="text-indigo-400 font-extrabold">×{item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Grand Total */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Total Bill</span>
                        <span className="text-base font-black text-indigo-400">₹{Math.round(order.grandTotal || 0)}</span>
                      </div>
                      
                      {order.status === 'OPEN' && (
                        <span className="text-[9px] font-black text-amber-500 border border-amber-500/20 bg-amber-500/5 px-3 py-1 rounded-xl uppercase tracking-widest animate-pulse">
                          Awaiting acceptance...
                        </span>
                      )}
                      {(order.status === 'SETTLED' || order.status === 'COMPLETED') && (
                        <div className="flex items-center gap-1.5 text-[9px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/5 border border-emerald-500/10 px-3.5 py-1.5 rounded-xl">
                          <CheckCircle2 size={11} /> Order Delivered
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Order History */}
          {pastOrders.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-slate-850/60">
              <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5 px-1">
                📜 Past Orders History ({pastOrders.length})
              </h2>
              
              {pastOrders.map((order: any) => (
                <div key={order.id} className="bg-slate-900/40 border border-slate-800/80 rounded-[2.0rem] p-5 shadow-md space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">
                        #{order.orderNo.slice(-6)} • {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} • {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <h4 className="text-xs font-black text-white uppercase mt-0.5 tracking-tight">
                        {order.orderType === 'DELIVERY' ? '🏠 Home Delivery' : '🏪 Self Pickup'}
                      </h4>
                    </div>
                    <OrderStatusBadge status={order.status} />
                  </div>

                  {/* Items List */}
                  {order.items && order.items.length > 0 && (
                    <div className="bg-slate-950/40 rounded-xl p-3 border border-slate-800/40 text-[10px] font-bold text-slate-400 space-y-1">
                      {order.items.map((item: any, i: number) => (
                        <div key={i} className="flex justify-between items-center">
                          <span className="truncate max-w-[180px] text-slate-350">{item.product?.name || item.name}</span>
                          <span className="text-indigo-400 font-extrabold">×{item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-1 border-t border-slate-850/40">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Total Paid</span>
                    <span className="text-xs font-black text-indigo-400">₹{Math.round(order.grandTotal || 0)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No orders placeholder */}
          {currentOrders.length === 0 && pastOrders.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-4 bg-slate-900/30 border border-slate-800/60 rounded-[2rem]">
              <div className="w-16 h-16 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center text-slate-500 shadow-inner">
                <Package size={24} />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No Active Orders Yet</p>
                <p className="text-[10px] text-slate-500 font-semibold">Go to menu tab to place your first order</p>
              </div>
              <button 
                onClick={() => setActiveTab('menu')} 
                className="mt-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer"
              >
                Browse Menu
              </button>
            </div>
          )}
        </div>
      )}

      {/* PROFILE TAB */}
      {activeTab === 'profile' && guestInfo && (
        <div className="p-4 max-w-md mx-auto space-y-6">
          {/* Avatar Profile HUD Card */}
          <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-800 bg-gradient-to-br from-indigo-950/40 via-slate-900/90 to-purple-950/20 p-6 shadow-xl backdrop-blur-xl text-center flex flex-col items-center gap-3">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
            
            {/* Glow Avatar */}
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-2xl font-black text-white shadow-lg shadow-indigo-500/20 border border-slate-800">
              {guestInfo.name.charAt(0).toUpperCase()}
            </div>
            
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-tight leading-none">{guestInfo.name}</h3>
              <p className="text-[10px] font-mono text-indigo-400 mt-1.5">{guestInfo.phone}</p>
            </div>

            {/* Profile Statistics Banner */}
            <div className="grid grid-cols-2 gap-4 w-full bg-slate-950/50 border border-slate-850/60 rounded-2xl p-3 mt-2">
              <div>
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-wider">Total Orders</p>
                <p className="text-base font-black text-white mt-0.5">{data?.activeOrders?.length || 0}</p>
              </div>
              <div>
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-wider">Primary Mode</p>
                <p className="text-base font-black text-indigo-400 mt-0.5 uppercase">{guestInfo.orderType === 'DELIVERY' ? 'Home' : 'Pickup'}</p>
              </div>
            </div>
          </div>

          {/* Details Form / Viewer Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 shadow-lg space-y-5 text-left">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-xs font-black text-white uppercase tracking-widest">Delivery Coordinates & Info</h4>
              <button 
                onClick={() => setIsEditingProfile(!isEditingProfile)}
                className="text-[10px] font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-widest cursor-pointer"
              >
                {isEditingProfile ? 'Cancel Edit' : 'Edit Details'}
              </button>
            </div>

            {isEditingProfile ? (
              <form onSubmit={(e) => {
                e.preventDefault();
                const labelPrefix = onboardingForm.addressType === 'Work' ? '💼 Work' : onboardingForm.addressType === 'Other' ? '📍 Other' : '🏠 Home';
                const addressParts = [
                  labelPrefix + ':',
                  onboardingForm.houseNo,
                  onboardingForm.area,
                  onboardingForm.landmark,
                  onboardingForm.deliveryAddress
                ].filter(Boolean).join(', ');
                const updatedInfo = { ...onboardingForm, deliveryAddress: addressParts };
                setGuestInfo(updatedInfo);
                sessionStorage.setItem('delivery_guest_info', JSON.stringify(updatedInfo));
                setIsEditingProfile(false);
              }} className="space-y-4">
                {/* Form fields identical to onboarding form for seamless updating */}
                <div className="relative">
                  <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    required
                    type="text"
                    placeholder="Your Full Name"
                    value={onboardingForm.name}
                    onChange={e => setOnboardingForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full bg-slate-950/40 border border-slate-800 focus:border-indigo-500 rounded-xl pl-10 pr-3 py-3 text-xs font-semibold text-white outline-none"
                  />
                </div>

                <div className="relative">
                  <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    required
                    type="tel"
                    placeholder="Phone Number"
                    value={onboardingForm.phone}
                    onChange={e => setOnboardingForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full bg-slate-950/40 border border-slate-800 focus:border-indigo-500 rounded-xl pl-10 pr-3 py-3 text-xs font-semibold text-white outline-none"
                  />
                </div>

                {onboardingForm.orderType === 'DELIVERY' && (
                  <div className="space-y-3 pt-2">
                    <div className="text-slate-900 dark:text-white">
                      <MapPicker
                        initialAddress={onboardingForm.deliveryAddress}
                        onAddressSelect={(address, lat, lng) => {
                          const parts = address.split(',').map(p => p.trim()).filter(Boolean);
                          const pinCodeMatch = address.match(/\b\d{6}\b/);
                          const pinCode = pinCodeMatch ? pinCodeMatch[0] : '';
                          
                          let houseNo = '';
                          let area = '';
                          let landmark = '';

                          if (parts.length > 0) houseNo = parts[0];
                          if (parts.length > 1) {
                            const middleParts = parts.slice(1).filter(part => {
                              const isCountry = ['india', 'pakistan', 'bangladesh', 'nepal'].includes(part.toLowerCase());
                              const isState = ['himachal pradesh', 'delhi', 'punjab', 'haryana', 'uttar pradesh', 'maharashtra', 'uttarakhand', 'jammu and kashmir'].includes(part.toLowerCase());
                              const containsPin = part.includes(pinCode);
                              return !isCountry && !isState && !containsPin;
                            });
                            area = middleParts.join(', ');
                          }
                          if (pinCode) landmark = `PIN: ${pinCode}`;

                          setOnboardingForm(f => ({
                            ...f,
                            deliveryAddress: address,
                            deliveryLat: lat,
                            deliveryLng: lng,
                            houseNo: houseNo || f.houseNo,
                            area: area || f.area,
                            landmark: landmark || f.landmark
                          }));
                        }}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        required
                        type="text"
                        placeholder="House / Flat No."
                        value={onboardingForm.houseNo}
                        onChange={e => setOnboardingForm(f => ({ ...f, houseNo: e.target.value }))}
                        className="w-full bg-slate-950/40 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-3 text-xs font-semibold text-white outline-none"
                      />
                      <input
                        required
                        type="text"
                        placeholder="Sector / Area"
                        value={onboardingForm.area}
                        onChange={e => setOnboardingForm(f => ({ ...f, area: e.target.value }))}
                        className="w-full bg-slate-950/40 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-3 text-xs font-semibold text-white outline-none"
                      />
                    </div>

                    <input
                      type="text"
                      placeholder="Landmark (Optional)"
                      value={onboardingForm.landmark}
                      onChange={e => setOnboardingForm(f => ({ ...f, landmark: e.target.value }))}
                      className="w-full bg-slate-950/40 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-3 text-xs font-semibold text-white outline-none"
                    />

                    <input
                      type="text"
                      placeholder="Delivery Instructions"
                      value={onboardingForm.deliveryInstructions}
                      onChange={e => setOnboardingForm(f => ({ ...f, deliveryInstructions: e.target.value }))}
                      className="w-full bg-slate-950/40 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-3 text-xs font-semibold text-white outline-none"
                    />
                  </div>
                )}

                <button 
                  type="submit" 
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-md transition-all active:scale-95"
                >
                  Save Profile Details
                </button>
              </form>
            ) : (
              <div className="space-y-4.5 text-xs">
                {/* Visual read-only display */}
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Preferences</span>
                  <p className="text-white font-bold">{guestInfo.orderType === 'DELIVERY' ? '🚚 Home Delivery' : '🏪 Self Pickup'}</p>
                </div>
                
                {guestInfo.orderType === 'DELIVERY' && (
                  <>
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Assigned Address Label</span>
                      <p className="text-white font-bold">{guestInfo.addressType || 'Home'}</p>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">House No / Area</span>
                      <p className="text-white font-bold">
                        {guestInfo.houseNo || 'N/A'}{guestInfo.area ? `, ${guestInfo.area}` : ''}
                      </p>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Full Parsed Address</span>
                      <p className="text-slate-300 font-semibold leading-relaxed">{guestInfo.deliveryAddress}</p>
                    </div>

                    {guestInfo.landmark && (
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Landmark</span>
                        <p className="text-white font-bold">{guestInfo.landmark}</p>
                      </div>
                    )}

                    {guestInfo.deliveryInstructions && (
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Delivery Note</span>
                        <p className="text-indigo-300 font-bold">💬 {guestInfo.deliveryInstructions}</p>
                      </div>
                    )}
                  </>
                )}

                {/* Log out section */}
                <div className="pt-3 border-t border-slate-800">
                  <button 
                    onClick={() => {
                      sessionStorage.removeItem('delivery_guest_info');
                      setGuestInfo(null);
                      setShowOnboarding(true);
                    }}
                    className="w-full py-3 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer"
                  >
                    Clear Account / Log Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Cart Panel */}
      <AnimatePresence>
        {cart.length > 0 && activeTab === 'menu' && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-6 left-4 right-4 z-40 max-w-md mx-auto"
          >
            <button
              onClick={() => setIsCartOpen(true)}
              className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-3 px-5 flex items-center justify-between shadow-2xl hover:scale-[1.01] transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center relative shadow-lg">
                  <ShoppingBag size={18} className="text-white" />
                  <span className="absolute -top-1.5 -right-1.5 bg-white text-indigo-600 text-[9px] font-black w-5.5 h-5.5 rounded-full flex items-center justify-center border-2 border-slate-900 shadow-md">
                    {cartCount}
                  </span>
                </div>
                <div className="text-left">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Subtotal</p>
                  <p className="text-lg font-black text-white">₹{cartTotal}</p>
                </div>
              </div>
              <span className="flex items-center gap-1.5 h-11 px-5 bg-indigo-650 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-md">
                View Cart <ChevronRight size={14} />
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Drawer bottom-sheet */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/80 z-40 backdrop-blur-sm" 
              onClick={() => setIsCartOpen(false)} 
            />
            {/* Sliding Panel */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900 border-t border-slate-800 rounded-t-[2.5rem] p-6 shadow-2xl max-w-md mx-auto max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-black text-white uppercase tracking-wider">Shopping Basket</h3>
                <button onClick={() => setIsCartOpen(false)} className="w-8 h-8 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer">
                  <X size={15} />
                </button>
              </div>

              {/* Destination address banner */}
              <div className="flex items-center gap-3.5 px-4.5 py-3.5 rounded-2xl bg-indigo-600/5 border border-indigo-500/10 mb-4 text-left">
                {guestInfo?.orderType === 'DELIVERY' ? <Truck size={15} className="text-indigo-400 shrink-0" /> : <Store size={15} className="text-indigo-400 shrink-0" />}
                <div className="min-w-0">
                  <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-0.5">
                    {guestInfo?.orderType === 'DELIVERY' ? 'Dispatching to' : 'Self Pickup for'}
                  </p>
                  <p className="text-xs font-bold text-slate-200 truncate">
                    {guestInfo?.orderType === 'DELIVERY'
                      ? guestInfo?.deliveryAddress || `${guestInfo?.houseNo}, ${guestInfo?.area}`
                      : guestInfo?.name}
                  </p>
                </div>
              </div>

              {/* Items listing */}
              <div className="flex-1 overflow-y-auto space-y-2.5 mb-5 pr-1 no-scrollbar">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center justify-between gap-3 bg-slate-950/40 border border-slate-800/80 rounded-2xl p-3.5">
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-xs font-black text-white uppercase truncate tracking-tight">{item.name}</p>
                      <p className="text-xs font-black text-indigo-400 mt-1">₹{item.sellingPrice * item.quantity}</p>
                    </div>
                    <div className="flex items-center gap-2 bg-indigo-950/40 rounded-xl px-1.5 py-1 border border-indigo-900/40 shadow-inner shrink-0">
                      <button onClick={() => removeFromCart(item.id)} className="w-6.5 h-6.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-indigo-400 active:scale-90 transition-transform">
                        <Minus size={11} />
                      </button>
                      <span className="text-xs font-black text-indigo-400 w-4.5 text-center">{item.quantity}</span>
                      <button onClick={() => addToCart(item)} className="w-6.5 h-6.5 rounded-lg bg-indigo-600 flex items-center justify-center text-white active:scale-90 transition-transform">
                        <Plus size={11} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Details + Action */}
              <div className="space-y-3.5 border-t border-slate-800/80 pt-5">
                {/* Billing Breakdown */}
                <div className="space-y-2 text-left pb-2.5 border-b border-slate-800/40 text-xs font-bold text-slate-400">
                  <div className="flex justify-between">
                    <span>Items Subtotal</span>
                    <span className="text-slate-200">₹{billSubtotal}</span>
                  </div>
                  
                  {billTaxAmount > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span>Central GST (CGST)</span>
                        <span className="text-slate-200">₹{billCgst}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>State GST (SGST)</span>
                        <span className="text-slate-200">₹{billSgst}</span>
                      </div>
                    </>
                  )}

                  {(guestInfo?.orderType ?? onboardingForm.orderType) === 'DELIVERY' && (
                    <div className="flex justify-between">
                      <span>Delivery Charges</span>
                      <span className="text-indigo-400">
                        {resolvedDeliveryFee > 0 ? `₹${resolvedDeliveryFee}` : 'FREE'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center py-1">
                  <span className="text-xs text-slate-350 font-black uppercase tracking-widest">Total Amount</span>
                  <span className="text-xl font-black text-white">₹{billGrandTotal}</span>
                </div>

                {orderStatus === 'success' ? (
                  <div className="flex items-center justify-center gap-2 py-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 font-black text-xs uppercase tracking-widest">
                    <CheckCircle2 size={18} className="animate-bounce" /> Order Submitted successfully!
                  </div>
                ) : (
                  <button
                    onClick={placeOrder}
                    disabled={orderStatus === 'submitting'}
                    className="w-full py-4.5 bg-indigo-650 hover:bg-indigo-500 active:scale-[0.98] text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                  >
                    {orderStatus === 'submitting' ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Submitting Order...
                      </>
                    ) : (
                      <>
                        <Truck size={14} />
                        Confirm {guestInfo?.orderType === 'DELIVERY' ? 'Home Delivery' : 'Pickup'} Order
                      </>
                    )}
                  </button>
                )}

                <p className="text-center text-[9px] text-slate-500 font-semibold uppercase tracking-wider">
                  Cash on Delivery payment will be collected at checkout
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Global CSS settings */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;700;800;900&display=swap');
        body { font-family: 'Outfit', sans-serif; -webkit-tap-highlight-color: transparent; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
