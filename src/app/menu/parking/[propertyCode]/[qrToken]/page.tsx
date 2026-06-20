"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ChevronRight, AlertCircle, Sun, Moon, Car } from 'lucide-react';
import { Button } from '@/components/ui/Button';

// Refactored Components
import { MenuHeader } from '@/components/menu/MenuHeader';
import { ParkingOnboarding } from '@/components/menu/ParkingOnboarding';
import { ProductList } from '@/components/menu/ProductList';
import { ActiveOrders } from '@/components/menu/ActiveOrders';
import { CartDrawer } from '@/components/menu/CartDrawer';
import { BottomNav } from '@/components/menu/BottomNav';
import { FeedbackModal } from '@/components/menu/FeedbackModal';

interface Product {
  id: string;
  name: string;
  description: string | null;
  sellingPrice: number;
  image: string | null;
  categoryId: string;
  basePrice: number;
  isVeg: boolean | null;
}

interface CartItem extends Product {
  quantity: number;
  variantId?: string;
  variantName?: string;
  portion?: 'FULL' | 'HALF';
}

export default function ParkingMenuPage() {
  const params = useParams();
  const propertyCode = params.propertyCode as string;
  const qrToken = params.qrToken as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderStatus, setOrderStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  
  const [guestInfo, setGuestInfo] = useState<{ name: string; phone: string; vehicle: string; guestCount: number; serviceMode?: 'SERVE_IN_CAR' | 'PACKED' } | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingForm, setOnboardingForm] = useState({ name: '', phone: '', vehicle: '', guestCount: 1, serviceMode: 'SERVE_IN_CAR' as const });
  
  const [activeTab, setActiveTab] = useState<'menu' | 'orders' | 'profile'>('menu');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  const [rating, setRating] = useState<number>(5);
  const [comments, setComments] = useState<string>('');
  const [showFeedback, setShowFeedback] = useState(false);

  // Handle Theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  useEffect(() => {
    // We no longer load from localStorage on mount to ensure that every fresh scan 
    // asks for guest details, as requested ("har bar qr scan kare to details mange").
    // Session-based persistence is used instead for the current tab.
    const savedInfo = sessionStorage.getItem('parking_guest_info');
    if (savedInfo) {
      setGuestInfo(JSON.parse(savedInfo));
    }
  }, []);

  // Polling logic
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/public/menu/${propertyCode}/parking/${qrToken}`);
        const json = await res.json();
        if (json.success) {
          setData((prev: any) => {
            // Detect checkout/settlement: if we had active orders, and now we don't
            if (prev?.activeOrders?.length > 0 && (!json.data.activeOrders || json.data.activeOrders.length === 0)) {
              // Cashier checked out/paid the table! Reset session immediately
              setTimeout(() => {
                resetGuestSession();
              }, 500);
            }
            return json.data;
          });

          if (json.data.property?.primaryColor) {
            document.documentElement.style.setProperty('--primary-color', json.data.property.primaryColor);
          }

          if (!activeCategory && json.data.menu.length > 0) {
            setActiveCategory(json.data.menu[0].id);
          }
        } else {
          setError(json.message);
        }
      } catch (err) {
        // silent fail during polling
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [propertyCode, qrToken, activeCategory]);

  // Logic to show onboarding if no guest info
  useEffect(() => {
    if (!loading && data) {
      if (!guestInfo) {
        setShowOnboarding(true);
      } else {
        setShowOnboarding(false);
      }
    }
  }, [loading, data, guestInfo]);

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0);
  }, [cart]);

  const addToCart = (product: any, options?: { variantId?: string; variantName?: string; portion?: 'FULL' | 'HALF'; price?: number }) => {
    setCart(prev => {
      const variantId = options?.variantId || '';
      const portion = options?.portion || 'FULL';
      const itemPrice = options?.price ?? product.sellingPrice;
      
      const existing = prev.find(item => 
        item.id === product.id && 
        (item.variantId || '') === variantId && 
        (item.portion || 'FULL') === portion
      );

      if (existing) {
        return prev.map((item: any) => 
          (item.id === product.id && (item.variantId || '') === variantId && (item.portion || 'FULL') === portion)
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { 
        ...product, 
        quantity: 1, 
        variantId, 
        variantName: options?.variantName,
        portion,
        sellingPrice: itemPrice 
      }];
    });
  };

  const removeFromCart = (productId: string, options?: { variantId?: string; portion?: 'FULL' | 'HALF' }) => {
    setCart(prev => {
      const variantId = options?.variantId || '';
      const portion = options?.portion || 'FULL';

      const existing = prev.find(item => 
        item.id === productId && 
        (item.variantId || '') === variantId && 
        (item.portion || 'FULL') === portion
      );

      if (existing && existing.quantity > 1) {
        return prev.map((item: any) => 
          (item.id === productId && (item.variantId || '') === variantId && (item.portion || 'FULL') === portion)
            ? { ...item, quantity: item.quantity - 1 } 
            : item
        );
      }
      return prev.filter(item => 
        !(item.id === productId && (item.variantId || '') === variantId && (item.portion || 'FULL') === portion)
      );
    });
  };

  const handleOnboardingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onboardingForm.name || !onboardingForm.phone || !onboardingForm.vehicle) return;

    if (data?.activeOrders?.length > 0) {
      const firstOrder = data.activeOrders[0];
      const registeredName = firstOrder.guest?.firstName || '';
      const registeredPhone = firstOrder.guest?.mobile || '';
      const registeredVehicle = firstOrder.vehicleNumber || '';

      const inputName = onboardingForm.name.trim().toLowerCase();
      const inputPhone = onboardingForm.phone.replace(/\D/g, '').slice(-10);
      const inputVehicle = onboardingForm.vehicle.replace(/\s+/g, '').toLowerCase();

      const regName = registeredName.trim().toLowerCase();
      const regPhone = registeredPhone.replace(/\D/g, '').slice(-10);
      const regVehicle = registeredVehicle.replace(/\s+/g, '').toLowerCase();

      let phoneMatched = false;
      if (regPhone) {
        if (inputPhone === regPhone) {
          phoneMatched = true;
        } else {
          alert("Incorrect phone number. This parking slot has an active order registered under a different phone number.");
          return;
        }
      }

      let vehicleMatched = false;
      if (regVehicle) {
        if (inputVehicle === regVehicle) {
          vehicleMatched = true;
        } else {
          alert("Incorrect vehicle number. This parking slot has an active order registered under a different vehicle number.");
          return;
        }
      }

      if (!phoneMatched && !vehicleMatched && regName && regName !== 'guest' && inputName !== regName) {
        alert("Incorrect name. This parking slot has an active order registered under a different name.");
        return;
      }
    }

    const info = { 
      name: onboardingForm.name, 
      phone: onboardingForm.phone, 
      vehicle: onboardingForm.vehicle,
      guestCount: onboardingForm.guestCount || 1,
      serviceMode: onboardingForm.serviceMode
    };
    setGuestInfo(info);
    sessionStorage.setItem('parking_guest_info', JSON.stringify(info));
    setShowOnboarding(false);
  };

  const resetGuestSession = () => {
    sessionStorage.removeItem('parking_guest_info');
    setGuestInfo(null);
    setOnboardingForm({ name: '', phone: '', vehicle: '', guestCount: 1, serviceMode: 'SERVE_IN_CAR' });
    setShowOnboarding(true);
    setCart([]);
    setActiveTab('menu');
    setIsCartOpen(false);
    setOrderStatus('idle');
    setTimeout(() => window.location.reload(), 500);
  };

  const placeOrder = async () => {
    if (cart.length === 0 || !guestInfo) return;
    
    setOrderStatus('submitting');
    try {
      const res = await fetch('/api/public/order/parking-place', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slotId: data.slot.id,
          customerName: guestInfo.name,
          customerPhone: guestInfo.phone,
          vehicleNumber: guestInfo.vehicle,
          guestCount: guestInfo.guestCount || 1,
          serviceMode: guestInfo.serviceMode,
          items: cart.map(i => ({ id: i.id, quantity: i.quantity })),
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
        }, 1500);
      } else {
        alert(json.message);
        setOrderStatus('idle');
      }
    } catch (err) {
      alert("Something went wrong. Please try again.");
      setOrderStatus('idle');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 space-y-4">
        <div className="w-12 h-12 border-4 border-amber-500/20 rounded-full animate-spin border-t-amber-500"></div>
        <p className="text-sm font-medium text-slate-500">Loading your menu...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center space-y-4 bg-slate-50 dark:bg-slate-950">
        <div className="w-20 h-20 bg-red-50 dark:bg-red-950/30 rounded-3xl flex items-center justify-center text-red-500 shadow-sm">
          <AlertCircle size={40} />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Something went wrong</h2>
          <p className="text-sm text-slate-500">{error}</p>
        </div>
        <Button onClick={() => window.location.reload()} className="rounded-xl px-10 h-12 bg-amber-500 font-bold shadow-md">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-slate-950 font-sans selection:bg-pos-primary selection:text-white">
      <div className="fixed top-0 left-0 right-0 h-[300px] bg-gradient-to-b from-pos-primary/5 to-transparent pointer-events-none -z-10" />

      <MenuHeader 
        data={data} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab as any} 
        searchQuery={searchQuery} 
        setSearchQuery={setSearchQuery} 
      />

      <div className="pt-2" />

      {activeTab === 'menu' ? (
        <>
          {data?.activeOrders?.length > 0 && (
            <div className="mx-5 mt-2 mb-4 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100/50 dark:border-amber-900/50 flex gap-3 items-start animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-xl text-amber-600 dark:text-amber-400 shrink-0">
                <Car size={18} />
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-black text-amber-950 dark:text-amber-200 uppercase tracking-wider">
                  Active Order running
                </p>
                <p className="text-[11px] font-bold text-amber-600/90 dark:text-amber-400/90 leading-relaxed">
                  There is already an active order running on this parking slot ({data.slot.name}). Any new items you add will be added to the same bill.
                </p>
              </div>
            </div>
          )}

          {/* Category Bar */}
          {!searchQuery && data?.menu?.length > 0 && (
            <div className="sticky top-[100px] z-20 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md py-2 px-5 overflow-x-auto no-scrollbar flex gap-2 border-b border-slate-50 dark:border-slate-900">
              {data.menu.map((cat: any) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat.id);
                    document.getElementById(cat.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className={`whitespace-nowrap px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    activeCategory === cat.id 
                    ? 'bg-pos-primary text-white shadow-md' 
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-400'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}

          <ProductList 
            categories={data?.menu || []} 
            searchQuery={searchQuery} 
            cart={cart} 
            addToCart={addToCart} 
            removeFromCart={removeFromCart} 
          />
        </>
      ) : activeTab === 'orders' ? (
        <ActiveOrders 
          orders={data.activeOrders || []} 
          tableName={data.slot.name} 
          propertyId={data.property.id}
          propertyAddress={data.property.address || ''}
          upiId={data.property.upiId || ''}
          upiName={data.property.upiName || data.property.name || ''}
          setActiveTab={setActiveTab as any} 
          onPaymentSuccess={() => {
            // After payment, clear session info so next visit asks for details again
            sessionStorage.removeItem('parking_guest_info');
            setGuestInfo(null);
            setOnboardingForm({ name: '', phone: '', vehicle: '', guestCount: 1, serviceMode: 'SERVE_IN_CAR' });
            setShowFeedback(true);
          }}
        />
      ) : (
        <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Your Profile</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Guest Details</p>
          </div>
          
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 bg-pos-primary/10 rounded-3xl flex items-center justify-center text-pos-primary">
                <span className="text-3xl font-black">{guestInfo?.name?.charAt(0) || 'G'}</span>
              </div>
              <div className="text-center">
                <p className="text-lg font-black text-slate-900 dark:text-white">{guestInfo?.name || 'Guest'}</p>
                <p className="text-xs font-bold text-slate-400">{guestInfo?.phone || 'No phone provided'}</p>
                {guestInfo?.vehicle && (
                  <div className="mt-2 px-3 py-1 bg-pos-primary/10 rounded-lg border border-pos-primary/20 inline-block">
                    <p className="text-[10px] font-black text-pos-primary uppercase tracking-widest">{guestInfo.vehicle}</p>
                  </div>
                )}
              </div>
            </div>

            <Button 
              variant="secondary" 
              onClick={() => setShowOnboarding(true)}
              className="w-full h-14 rounded-2xl font-black uppercase text-xs tracking-widest"
            >
              Edit Details
            </Button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between px-2">
              <div>
                <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Appearance</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</p>
              </div>
              <button 
                onClick={toggleTheme}
                className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-700 transition-all active:scale-95"
              >
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
              </button>
            </div>
          </div>

          <div className="bg-pos-primary/5 dark:bg-pos-primary/10 border border-pos-primary/20 rounded-[2rem] p-6 text-center space-y-2">
            <p className="text-[10px] font-black text-pos-primary uppercase tracking-widest">Parking Information</p>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Slot: {data.slot.name}</p>
          </div>
        </div>
      )}

      {/* Spacing for Bottom Nav */}
      <div className="h-32" />

      {/* Bottom Nav */}
      {!isCartOpen && (
        <BottomNav 
          activeTab={activeTab as any} 
          setActiveTab={setActiveTab as any} 
          orderCount={data.activeOrders?.length || 0}
          showBar={false}
        />
      )}

      {/* Floating Cart Bar */}
      <AnimatePresence>
        {cart.length > 0 && activeTab === 'menu' && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-5 right-5 z-50"
          >
            <div className="bg-slate-900 dark:bg-white rounded-[2rem] p-3 pr-6 flex items-center justify-between shadow-2xl border border-white/10 mb-20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-pos-primary rounded-2xl flex items-center justify-center text-white relative shadow-lg">
                  <ShoppingBag size={20} />
                  <span className="absolute -top-1.5 -right-1.5 bg-white text-pos-accent text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-black border-2 border-slate-900">
                    {cart.reduce((s, i) => s + i.quantity, 0)}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] font-black text-white/50 dark:text-slate-400 uppercase tracking-widest leading-none mb-1">Subtotal</p>
                  <p className="text-xl font-black text-white dark:text-slate-900 leading-none tabular-nums">₹{cartTotal}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsCartOpen(true)}
                className="h-10 px-6 bg-pos-accent text-white rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-pos-accent/20"
              >
                Review Order <ChevronRight size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <CartDrawer 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        addToCart={addToCart}
        removeFromCart={removeFromCart}
        cartTotal={cartTotal}
        orderStatus={orderStatus}
        placeOrder={placeOrder}
        paymentMethod="COUNTER"
        setPaymentMethod={() => {}}
        showPaymentMock={false}
        setShowPaymentMock={() => {}}
      />

      <ParkingOnboarding 
        show={showOnboarding}
        form={onboardingForm}
        setForm={setOnboardingForm}
        onSubmit={handleOnboardingSubmit}
        slotName={data?.slot?.name}
        hasActiveOrder={data?.activeOrders?.length > 0}
      />

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;700;800;900&display=swap');
        body { font-family: 'Outfit', sans-serif; -webkit-tap-highlight-color: transparent; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
