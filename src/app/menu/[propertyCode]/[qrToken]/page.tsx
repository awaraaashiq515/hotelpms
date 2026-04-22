"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { 
  ShoppingBag, 
  Search, 
  Plus, 
  Minus, 
  ChevronRight, 
  Clock, 
  Info,
  AlertCircle,
  X,
  User,
  Phone,
  History,
  CheckCircle,
  UtensilsCrossed,
  Star,
  MapPin,
  ChevronDown
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string | null;
  sellingPrice: number;
  image: string | null;
  categoryId: string;
}

interface Category {
  id: string;
  name: string;
  products: Product[];
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
  
  // Guest Info State
  const [guestInfo, setGuestInfo] = useState<{ name: string; phone: string } | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingForm, setOnboardingForm] = useState({ name: '', phone: '' });
  
  const [activeTab, setActiveTab] = useState<'menu' | 'orders'>('menu');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedInfo = localStorage.getItem('guest_info');
    if (savedInfo) {
      setGuestInfo(JSON.parse(savedInfo));
    } else {
      setShowOnboarding(true);
    }

    async function fetchMenu() {
      try {
        const res = await fetch(`/api/public/menu/${propertyCode}/${qrToken}`);
        const json = await res.json();
        if (json.success) {
          setData(json.data);
          if (json.data.menu.length > 0) {
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
    fetchMenu();

    const interval = setInterval(fetchMenu, 15000);
    return () => clearInterval(interval);
  }, [propertyCode, qrToken]);

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0);
  }, [cart]);

  const addToCart = (product: Product) => {
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
        <Button 
          onClick={() => window.location.reload()}
          className="rounded-xl px-10 h-12 bg-pos-primary font-bold shadow-md"
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="relative pb-32 min-h-screen bg-slate-50 dark:bg-slate-950 font-sans">
      <div className="fixed top-0 left-0 right-0 h-[300px] bg-gradient-to-b from-pos-primary/5 to-transparent pointer-events-none -z-10" />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-900 px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {data.property.logoUrl ? (
              <img src={data.property.logoUrl} alt="Logo" className="w-10 h-10 rounded-xl object-cover border border-slate-100 dark:border-slate-800 shadow-sm" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-pos-primary/10 flex items-center justify-center text-pos-primary">
                <UtensilsCrossed size={18} />
              </div>
            )}
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{data.property.name}</h1>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[11px] text-slate-400 font-medium">Table: {data.table.name}</span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => setActiveTab('orders')}
            className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 relative"
          >
            <History size={18} />
            {data?.activeOrders?.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-pos-primary rounded-full border-2 border-white dark:border-slate-950"></span>
            )}
          </button>
        </div>

        {activeTab === 'menu' && (
          <div className="mt-4 relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search dishes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 bg-slate-100/50 dark:bg-slate-900/50 border-none rounded-xl pl-11 pr-4 text-sm font-medium text-slate-800 dark:text-white outline-none focus:bg-white dark:focus:bg-slate-900 transition-all placeholder:text-slate-400"
            />
          </div>
        )}
      </header>

      {/* Tabs */}
      <div className="sticky top-[117px] z-30 bg-white/50 dark:bg-slate-950/50 backdrop-blur-md px-5 py-3 flex gap-2">
        <button 
          onClick={() => setActiveTab('menu')}
          className={`flex-1 h-10 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'menu' 
            ? 'bg-pos-accent text-white shadow-md' 
            : 'bg-white dark:bg-slate-900 text-slate-400 border border-slate-100 dark:border-slate-800'
          }`}
        >
          Menu
        </button>
        <button 
          onClick={() => setActiveTab('orders')}
          className={`flex-1 h-10 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'orders' 
            ? 'bg-pos-accent text-white shadow-md' 
            : 'bg-white dark:bg-slate-900 text-slate-400 border border-slate-100 dark:border-slate-800'
          }`}
        >
          Track Orders
        </button>
      </div>

      {/* Menu View */}
      {activeTab === 'menu' && (
        <div className="space-y-4">
          {!searchQuery && (
            <div className="sticky top-[181px] z-20 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md py-2 px-5 overflow-x-auto no-scrollbar flex gap-2 border-b border-slate-50 dark:border-slate-900">
              {data.menu.map((cat: Category) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat.id);
                    document.getElementById(cat.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className={`whitespace-nowrap px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeCategory === cat.id 
                    ? 'bg-pos-primary text-white' 
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-400'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}

          <main className="p-5 pt-8 space-y-10">
            {data.menu.map((cat: Category) => (
              <section key={cat.id} id={cat.id} className="scroll-mt-36">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  {cat.name}
                  <span className="text-[11px] font-medium text-slate-400 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md">{cat.products.length}</span>
                </h2>

                <div className="grid gap-5">
                  {cat.products
                    .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((product) => (
                    <motion.div 
                      key={product.id}
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      className="bg-white dark:bg-slate-900 rounded-3xl p-3 flex gap-4 border border-slate-100 dark:border-slate-800 shadow-sm"
                    >
                      <div className="relative w-24 h-24 flex-shrink-0">
                        <img 
                          src={product.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=200'} 
                          className="w-full h-full object-cover rounded-2xl" 
                          alt={product.name} 
                        />
                      </div>

                      <div className="flex flex-col justify-between flex-grow py-1">
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">{product.name}</h3>
                          {product.description && (
                            <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 font-medium">
                              {product.description}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-base font-bold text-slate-900 dark:text-white">₹{product.sellingPrice}</span>
                          
                          {cart.find(c => c.id === product.id) ? (
                            <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 rounded-xl p-1 border border-slate-100 dark:border-slate-700">
                              <button onClick={() => removeFromCart(product.id)} className="w-7 h-7 flex items-center justify-center text-slate-500"><Minus size={14} /></button>
                              <span className="font-bold text-xs">{cart.find(c => c.id === product.id)?.quantity}</span>
                              <button onClick={() => addToCart(product)} className="w-7 h-7 flex items-center justify-center text-pos-accent"><Plus size={14} /></button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => addToCart(product)}
                              className="h-8 px-6 bg-pos-accent text-white rounded-xl text-[11px] font-bold shadow-sm"
                            >
                              Add
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            ))}
          </main>
        </div>
      )}

      {/* Track Orders View */}
      {activeTab === 'orders' && (
        <main className="p-5 pt-10 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="text-center py-4">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Active Orders</h2>
            <p className="text-sm text-slate-400 font-medium mt-1">Tracking items for Table: {data.table.name}</p>
          </div>

          {data.activeOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <History size={48} className="text-slate-200" />
              <div className="space-y-1">
                <h3 className="font-bold text-slate-800 dark:text-white">No orders yet</h3>
                <p className="text-xs text-slate-400 max-w-[200px]">Once you place an order, it will appear here.</p>
              </div>
              <Button onClick={() => setActiveTab('menu')} className="rounded-xl h-11 px-8">View Menu</Button>
            </div>
          ) : (
            data.activeOrders.map((order: any) => (
              <div key={order.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-3">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold">Order No</p>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{order.orderNo}</p>
                  </div>
                  <div className="px-3 py-1 bg-pos-primary/10 rounded-full">
                    <p className="text-[10px] font-bold text-pos-primary">{order.status}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {order.items.map((item: any) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="relative w-12 h-12 flex-shrink-0">
                        <img src={item.product.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=100'} className="w-full h-full object-cover rounded-xl" />
                        <span className="absolute -top-1.5 -right-1.5 bg-pos-primary text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold border-2 border-white dark:border-slate-900">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex-grow">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">{item.product.name}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          {item.kotItems?.some((ki: any) => ki.status === 'READY') ? (
                            <span className="text-[10px] font-bold text-green-500">Ready</span>
                          ) : item.kotItems?.some((ki: any) => ki.status === 'IN_KITCHEN') ? (
                            <span className="text-[10px] font-bold text-pos-primary">Cooking...</span>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400">Placed</span>
                          )}
                        </div>
                      </div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">₹{item.totalAmount}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-400">Grand Total</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">₹{order.grandTotal}</p>
                </div>
              </div>
            ))
          )}
        </main>
      )}

      {/* Floating Cart Bar */}
      <AnimatePresence>
        {cart.length > 0 && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-6 left-5 right-5 z-50"
          >
            <div className="bg-slate-900 dark:bg-white rounded-2xl p-2.5 pr-5 flex items-center justify-between shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-pos-primary rounded-xl flex items-center justify-center text-white relative">
                  <ShoppingBag size={20} />
                  <span className="absolute -top-1 -right-1 bg-white text-pos-accent text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold border-2 border-slate-900">
                    {cart.reduce((s, i) => s + i.quantity, 0)}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-white/50 dark:text-slate-400 leading-none mb-1">Subtotal</p>
                  <p className="text-lg font-bold text-white dark:text-slate-900 leading-none">₹{cartTotal}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsCartOpen(true)}
                className="h-10 px-6 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl font-bold text-xs flex items-center gap-2"
              >
                Checkout <ChevronRight size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Checkout Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[60]"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-[2rem] z-[70] max-h-[90vh] flex flex-col shadow-2xl border-t border-white/10"
            >
              <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto my-6" />
              
              <div className="px-6 flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Your Order</h2>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400"
                >
                  <X size={20} />
                </button>
              </div>

              {orderStatus === 'success' ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex-grow flex flex-col items-center justify-center p-12 text-center space-y-4"
                >
                  <div className="w-20 h-20 bg-green-50 dark:bg-green-950/30 text-green-500 rounded-3xl flex items-center justify-center shadow-xl">
                    <CheckCircle size={40} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Order Sent!</h3>
                    <p className="text-sm text-slate-500 font-medium">Your meal is being prepared.</p>
                  </div>
                </motion.div>
              ) : (
                <>
                  <div className="flex-grow overflow-y-auto px-6 space-y-5 pb-8 no-scrollbar">
                    {cart.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 py-2">
                        <img 
                          src={item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=100'} 
                          className="w-16 h-16 rounded-xl object-cover shadow-sm" 
                        />
                        <div className="flex-grow">
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm">{item.name}</h4>
                          <p className="text-xs font-bold text-pos-primary mt-0.5">₹{item.sellingPrice}</p>
                        </div>
                        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-1.5 border border-slate-100 dark:border-slate-700">
                          <button onClick={() => removeFromCart(item.id)} className="text-slate-400"><Minus size={14} /></button>
                          <span className="font-bold text-xs w-4 text-center">{item.quantity}</span>
                          <button onClick={() => addToCart(item)} className="text-pos-accent"><Plus size={14} /></button>
                        </div>
                      </div>
                    ))}
                    
                    <div className="pt-6 border-t border-slate-50 dark:border-slate-800 space-y-2">
                      <div className="flex justify-between text-xs text-slate-400 font-bold">
                        <span>Subtotal</span>
                        <span className="text-slate-900 dark:text-white">₹{cartTotal}</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-400 font-bold">
                        <span>GST (5%)</span>
                        <span className="text-slate-900 dark:text-white">₹{(cartTotal * 0.05).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center pt-3">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">Total</span>
                        <span className="text-2xl font-bold text-pos-accent">₹{(cartTotal * 1.05).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 pt-0">
                    <button 
                      disabled={orderStatus === 'submitting'}
                      onClick={placeOrder}
                      className="w-full h-14 bg-pos-accent text-white rounded-2xl font-bold text-sm shadow-lg shadow-pos-accent/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      {orderStatus === 'submitting' ? 'Sending...' : 'Place Order'}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Onboarding */}
      <AnimatePresence>
        {showOnboarding && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-slate-950 flex items-center justify-center p-6">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-[-5%] left-[-5%] w-[300px] h-[300px] bg-pos-primary/10 rounded-full blur-[80px]" />
              <div className="absolute bottom-[-5%] right-[-5%] w-[300px] h-[300px] bg-pos-accent/10 rounded-full blur-[80px]" />
            </div>

            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2.5rem] p-8 relative shadow-2xl"
            >
              <div className="text-center space-y-2 mb-8">
                <div className="w-16 h-16 bg-pos-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <UtensilsCrossed className="text-pos-primary" size={28} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome</h2>
                <p className="text-xs text-slate-400 font-medium">Please enter your details to view the menu</p>
              </div>

              <form onSubmit={handleOnboardingSubmit} className="space-y-5">
                <div className="relative">
                  <User size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    required
                    type="text"
                    placeholder="Full Name"
                    value={onboardingForm.name}
                    onChange={(e) => setOnboardingForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full h-14 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl pl-14 pr-6 text-sm font-bold text-slate-900 dark:text-white outline-none focus:bg-white dark:focus:bg-slate-800 transition-all"
                  />
                </div>
                <div className="relative">
                  <Phone size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    required
                    type="tel"
                    placeholder="Phone Number"
                    value={onboardingForm.phone}
                    onChange={(e) => setOnboardingForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full h-14 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl pl-14 pr-6 text-sm font-bold text-slate-900 dark:text-white outline-none focus:bg-white dark:focus:bg-slate-800 transition-all"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full h-14 bg-pos-accent text-white rounded-2xl font-bold text-sm shadow-lg shadow-pos-accent/20 active:scale-95 transition-all mt-4"
                >
                  View Menu
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;700;800&display=swap');
        
        body {
          font-family: 'Outfit', sans-serif;
          -webkit-tap-highlight-color: transparent;
        }

        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .h-18 { height: 4.5rem; }

        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }

        @media print {
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}

const RefreshCw = ({ className, size = 16 }: { className?: string, size?: number }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="3" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M3 21v-5h5" />
  </svg>
);
