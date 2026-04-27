"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ChevronRight, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

// Refactored Components
import { MenuHeader } from '@/components/menu/MenuHeader';
import { Onboarding } from '@/components/menu/Onboarding';
import { ProductList } from '@/components/menu/ProductList';
import { ActiveOrders } from '@/components/menu/ActiveOrders';
import { CartDrawer } from '@/components/menu/CartDrawer';

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
}

export default function PublicMenuPage() {
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
  
  const [guestInfo, setGuestInfo] = useState<{ name: string; phone: string } | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingForm, setOnboardingForm] = useState({ name: '', phone: '' });
  
  const [activeTab, setActiveTab] = useState<'menu' | 'orders'>('menu');

  useEffect(() => {
    const savedInfo = localStorage.getItem('guest_info');
    if (savedInfo) {
      setGuestInfo(JSON.parse(savedInfo));
    } else {
      setShowOnboarding(true);
    }

    async function fetchData() {
      try {
        const res = await fetch(`/api/public/menu/${propertyCode}/${qrToken}`);
        const json = await res.json();
        if (json.success) {
          setData(json.data);
          if (json.data.menu.length > 0 && !activeCategory) {
            setActiveCategory(json.data.menu[0].id);
          }
        } else {
          setError(json.message);
        }
      } catch (err) {
        setError("Failed to load menu. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();

    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [propertyCode, qrToken, activeCategory]);

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0);
  }, [cart]);

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === productId);
      if (existing && existing.quantity > 1) {
        return prev.map(item => 
          item.id === productId ? { ...item, quantity: item.quantity - 1 } : item
        );
      }
      return prev.filter(item => item.id !== productId);
    });
  };

  const handleOnboardingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onboardingForm.name || !onboardingForm.phone) return;
    const info = { name: onboardingForm.name, phone: onboardingForm.phone };
    setGuestInfo(info);
    localStorage.setItem('guest_info', JSON.stringify(info));
    setShowOnboarding(false);
  };

  const placeOrder = async () => {
    if (cart.length === 0) return;
    setOrderStatus('submitting');
    try {
      const res = await fetch('/api/public/order/place', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: data.property.id,
          tableId: data.table.id,
          guestName: guestInfo?.name,
          guestPhone: guestInfo?.phone,
          items: cart
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
        }, 2000);
      } else {
        alert(json.message);
        setOrderStatus('idle');
      }
    } catch (err) {
      alert("Something went wrong. Please call a waiter.");
      setOrderStatus('idle');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 space-y-4">
        <div className="w-12 h-12 border-4 border-pos-primary/20 rounded-full animate-spin border-t-pos-primary"></div>
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
        <Button onClick={() => window.location.reload()} className="rounded-xl px-10 h-12 bg-pos-primary font-bold shadow-md">
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
        setActiveTab={setActiveTab} 
        searchQuery={searchQuery} 
        setSearchQuery={setSearchQuery} 
      />

      {/* Tab Switcher */}
      <div className="sticky top-[117px] z-30 bg-white/50 dark:bg-slate-950/50 backdrop-blur-md px-5 py-3 flex gap-2">
        {(['menu', 'orders'] as const).map((tab) => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 h-10 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
              activeTab === tab 
              ? 'bg-pos-accent text-white shadow-lg shadow-pos-accent/20' 
              : 'bg-white dark:bg-slate-900 text-slate-400 border border-slate-100 dark:border-slate-800'
            }`}
          >
            {tab === 'menu' ? 'Menu' : 'Track Orders'}
          </button>
        ))}
      </div>

      {activeTab === 'menu' ? (
        <>
          {/* Category Bar */}
          {!searchQuery && (
            <div className="sticky top-[181px] z-20 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md py-2 px-5 overflow-x-auto no-scrollbar flex gap-2 border-b border-slate-50 dark:border-slate-900">
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
            categories={data.menu} 
            searchQuery={searchQuery} 
            cart={cart} 
            addToCart={addToCart} 
            removeFromCart={removeFromCart} 
          />
        </>
      ) : (
        <ActiveOrders 
          orders={data.activeOrders} 
          tableName={data.table.name} 
          setActiveTab={setActiveTab} 
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
            <div className="bg-slate-900 dark:bg-white rounded-[2rem] p-3 pr-6 flex items-center justify-between shadow-2xl border border-white/10">
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
                Checkout <ChevronRight size={14} />
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
      />

      <Onboarding 
        show={showOnboarding}
        form={onboardingForm}
        setForm={setOnboardingForm}
        onSubmit={handleOnboardingSubmit}
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
