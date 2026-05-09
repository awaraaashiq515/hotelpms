"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { ShoppingBag, ChevronRight, AlertCircle, Car } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CartItem {
  id: string;
  name: string;
  sellingPrice: number;
  quantity: number;
}

export default function ParkingMenuPage() {
  const params = useParams();
  const propertyCode = params.propertyCode as string;
  const qrToken = params.qrToken as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderStatus, setOrderStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [form, setForm] = useState({ name: '', phone: '', vehicle: '' });
  const [guestInfo, setGuestInfo] = useState<{ name: string; phone: string; vehicle: string } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('parking_guest_info');
    if (saved) {
      setGuestInfo(JSON.parse(saved));
      setShowOnboarding(false);
    }
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/public/menu/${propertyCode}/parking/${qrToken}`);
        const json = await res.json();
        if (json.success) {
          setData(json.data);
          if (!activeCategory && json.data.menu?.length > 0) {
            setActiveCategory(json.data.menu[0].id);
          }
        } else {
          setError(json.message);
        }
      } catch {
        setError('Failed to load menu');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, [propertyCode, qrToken]);

  const cartTotal = useMemo(() => cart.reduce((s, i) => s + i.sellingPrice * i.quantity, 0), [cart]);

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { id: product.id, name: product.name, sellingPrice: product.sellingPrice, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === id);
      if (existing && existing.quantity > 1) return prev.map(i => i.id === id ? { ...i, quantity: i.quantity - 1 } : i);
      return prev.filter(i => i.id !== id);
    });
  };

  const handleOnboardingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.vehicle) return;
    const info = { name: form.name, phone: form.phone, vehicle: form.vehicle };
    setGuestInfo(info);
    localStorage.setItem('parking_guest_info', JSON.stringify(info));
    setShowOnboarding(false);
  };

  const placeOrder = async () => {
    if (!cart.length || !guestInfo) return;
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
          items: cart.map(i => ({ id: i.id, quantity: i.quantity })),
        }),
      });
      const json = await res.json();
      if (json.success) {
        setOrderStatus('success');
        setCart([]);
        setTimeout(() => { setIsCartOpen(false); setOrderStatus('idle'); }, 2000);
      } else {
        alert(json.message);
        setOrderStatus('idle');
      }
    } catch {
      alert('Something went wrong. Please try again.');
      setOrderStatus('idle');
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-amber-50 gap-4">
      <div className="w-12 h-12 border-4 border-amber-200 rounded-full animate-spin border-t-amber-500" />
      <p className="text-sm font-bold text-amber-600">Loading parking menu...</p>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-slate-50 gap-4">
      <AlertCircle size={48} className="text-red-400" />
      <h2 className="text-xl font-bold text-slate-800">Something went wrong</h2>
      <p className="text-sm text-slate-500">{error}</p>
      <button onClick={() => window.location.reload()} className="px-8 py-3 bg-amber-500 text-white rounded-2xl font-bold">Try Again</button>
    </div>
  );

  const primaryColor = '#f59e0b';

  return (
    <div className="min-h-screen bg-slate-50 font-sans" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;900&display=swap'); .no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}`}</style>

      {/* Onboarding Modal */}
      {showOnboarding && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end">
          <motion.div initial={{ y: 300 }} animate={{ y: 0 }} className="w-full bg-white rounded-t-[2.5rem] p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center">
                <Car size={24} className="text-amber-500" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900">Parking Order</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{data?.slot?.name}</p>
              </div>
            </div>
            <form onSubmit={handleOnboardingSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1 block">Customer Name *</label>
                <input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Enter your name" className="w-full h-14 px-5 rounded-2xl bg-slate-100 border-2 border-transparent focus:border-amber-400 outline-none font-semibold text-slate-800 transition-colors" />
              </div>
              <div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1 block">Phone Number *</label>
                <input required type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="Enter phone number" className="w-full h-14 px-5 rounded-2xl bg-slate-100 border-2 border-transparent focus:border-amber-400 outline-none font-semibold text-slate-800 transition-colors" />
              </div>
              <div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1 block">Vehicle Number *</label>
                <input required value={form.vehicle} onChange={e => setForm(p => ({ ...p, vehicle: e.target.value.toUpperCase() }))} placeholder="e.g. MH 01 AB 1234" className="w-full h-14 px-5 rounded-2xl bg-slate-100 border-2 border-transparent focus:border-amber-400 outline-none font-bold text-slate-800 tracking-widest transition-colors" />
              </div>
              <button type="submit" className="w-full h-14 bg-amber-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-amber-200 active:scale-95 transition-transform">
                Continue to Menu →
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md shadow-sm">
        <div className="px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {data?.property?.logoUrl ? (
              <img src={data.property.logoUrl} alt="logo" className="w-10 h-10 rounded-xl object-cover" />
            ) : (
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <Car size={18} className="text-amber-500" />
              </div>
            )}
            <div>
              <p className="font-black text-slate-900 text-base leading-tight">{data?.property?.brandName || data?.property?.name}</p>
              <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">{data?.slot?.name}</p>
            </div>
          </div>
          {guestInfo && (
            <div className="text-right">
              <p className="text-xs font-black text-slate-700">{guestInfo.name}</p>
              <p className="text-[10px] font-bold text-amber-500 tracking-widest">{guestInfo.vehicle}</p>
            </div>
          )}
        </div>

        {/* Category tabs */}
        {data?.menu?.length > 0 && (
          <div className="flex gap-2 px-5 pb-3 overflow-x-auto no-scrollbar">
            {data.menu.map((cat: any) => (
              <button key={cat.id} onClick={() => { setActiveCategory(cat.id); document.getElementById(cat.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
                className={`whitespace-nowrap px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeCategory === cat.id ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Menu */}
      <div className="px-5 py-4 space-y-8 pb-40">
        {data?.menu?.map((cat: any) => (
          <div key={cat.id} id={cat.id}>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 px-1">{cat.name}</h3>
            <div className="space-y-3">
              {cat.products.map((product: any) => {
                const cartItem = cart.find(i => i.id === product.id);
                return (
                  <div key={product.id} className="bg-white rounded-[1.5rem] p-4 flex items-center gap-4 shadow-sm border border-slate-100">
                    {product.image && <img src={product.image} alt={product.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 text-sm leading-tight truncate">{product.name}</p>
                      {product.description && <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{product.description}</p>}
                      <p className="font-black text-amber-600 text-base mt-1">₹{product.sellingPrice}</p>
                    </div>
                    <div className="flex-shrink-0">
                      {cartItem ? (
                        <div className="flex items-center gap-2">
                          <button onClick={() => removeFromCart(product.id)} className="w-8 h-8 bg-amber-100 text-amber-600 rounded-xl font-black text-lg flex items-center justify-center active:scale-90 transition-transform">−</button>
                          <span className="font-black text-slate-900 w-5 text-center">{cartItem.quantity}</span>
                          <button onClick={() => addToCart(product)} className="w-8 h-8 bg-amber-500 text-white rounded-xl font-black text-lg flex items-center justify-center active:scale-90 transition-transform">+</button>
                        </div>
                      ) : (
                        <button onClick={() => addToCart(product)} className="w-10 h-10 bg-amber-500 text-white rounded-xl font-black text-xl flex items-center justify-center active:scale-90 transition-transform shadow-md shadow-amber-200">+</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Cart bar */}
      <AnimatePresence>
        {cart.length > 0 && (
          <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="fixed bottom-0 left-0 right-0 p-4 z-40">
            <div className="bg-slate-900 rounded-[2rem] p-3 pr-5 flex items-center justify-between shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center relative">
                  <ShoppingBag size={20} className="text-white" />
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-white text-amber-600 text-[10px] font-black rounded-full flex items-center justify-center">{cart.reduce((s, i) => s + i.quantity, 0)}</span>
                </div>
                <div>
                  <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest">Total</p>
                  <p className="text-xl font-black text-white">₹{cartTotal}</p>
                </div>
              </div>
              <button onClick={() => setIsCartOpen(true)} className="h-10 px-6 bg-amber-500 text-white rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2">
                Review <ChevronRight size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end">
            <motion.div initial={{ y: 400 }} animate={{ y: 0 }} exit={{ y: 400 }} className="w-full bg-white rounded-t-[2.5rem] max-h-[90vh] flex flex-col">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xl font-black text-slate-900">Your Order</h3>
                <button onClick={() => setIsCartOpen(false)} className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 font-bold">✕</button>
              </div>

              {/* Customer info summary */}
              {guestInfo && (
                <div className="mx-6 mt-4 p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-3">
                  <Car size={20} className="text-amber-500 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-black text-slate-800">{guestInfo.name} • {guestInfo.phone}</p>
                    <p className="font-bold text-amber-600 tracking-widest">{guestInfo.vehicle}</p>
                  </div>
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-bold text-slate-800 text-sm">{item.name}</p>
                      <p className="text-xs text-amber-600 font-black">₹{item.sellingPrice} each</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => removeFromCart(item.id)} className="w-8 h-8 bg-slate-100 rounded-xl font-black text-slate-700 flex items-center justify-center">−</button>
                      <span className="font-black text-slate-900 w-6 text-center">{item.quantity}</span>
                      <button onClick={() => addToCart(item)} className="w-8 h-8 bg-amber-500 rounded-xl font-black text-white flex items-center justify-center">+</button>
                    </div>
                    <p className="font-black text-slate-900 w-20 text-right">₹{item.sellingPrice * item.quantity}</p>
                  </div>
                ))}
              </div>

              <div className="p-6 border-t border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-slate-500 text-sm">Total Amount</p>
                  <p className="font-black text-2xl text-slate-900">₹{cartTotal}</p>
                </div>
                <button
                  onClick={placeOrder}
                  disabled={orderStatus === 'submitting' || orderStatus === 'success'}
                  className={`w-full h-14 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${orderStatus === 'success' ? 'bg-emerald-500 text-white' : orderStatus === 'submitting' ? 'bg-amber-300 text-white animate-pulse' : 'bg-amber-500 text-white shadow-lg shadow-amber-200 active:scale-95'}`}
                >
                  {orderStatus === 'success' ? '✓ Order Placed!' : orderStatus === 'submitting' ? 'Placing Order...' : 'Place Order →'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
