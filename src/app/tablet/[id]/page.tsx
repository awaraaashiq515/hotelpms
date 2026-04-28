'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Utensils, ShoppingCart, User, Table as TableIcon, 
  CheckCircle, Clock, ChevronRight, Star, 
  Menu, X, Search, Filter, ArrowLeft, Plus, Minus,
  ChefHat, ShoppingBag
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, Smartphone, Zap } from 'lucide-react';

// --- Types ---
interface TabletConfig {
  id: string;
  name: string;
  mode: 'WAITER' | 'TABLE';
  tableId?: string | null;
  propertyId: string;
  property: {
    name: string;
    code: string;
  };
  table?: {
    id: string;
    name: string;
    qrToken: string | null;
  } | null;
}

interface Product {
  id: string;
  name: string;
  sellingPrice: number;
  categoryId: string;
  image?: string;
  description?: string;
  productType?: string; // Add productType for Veg/Non-Veg indicators
  isPopular?: boolean;  // Extra feature: popular items
}

interface Category {
  id: string;
  name: string;
}

interface CartItem extends Product {
  quantity: number;
}

interface Order {
  id: string;
  orderNo: string;
  status: string;
  grandTotal: number;
  createdAt: string;
  items?: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    product: {
      name: string;
      image?: string;
    }
  }>;
}

// --- Main Page Component ---
export default function TabletPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = React.use(params);
  const [tablet, setTablet] = useState<TabletConfig | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tables, setTables] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<string>('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isStatusVisible, setIsStatusVisible] = useState(false);
  const [showTableSelector, setShowTableSelector] = useState(false);
  const [showQRStand, setShowQRStand] = useState(false);
  
  // Professional Waiter Workflow State
  const [pax, setPax] = useState<number>(1);
  const [sessionStage, setSessionStage] = useState<'TABLE' | 'PAX' | 'MENU'>('TABLE');

  // Modals
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const { addToast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tabRes, dataRes] = await Promise.all([
          fetch(`/api/tablets/${id}`),
          fetch(`/api/tablets/${id}/data`),
        ]);
        
        const tabData = await tabRes.json();
        const data = await dataRes.json();

        if (tabData.success) {
          setTablet(tabData.data);
          if (tabData.data.tableId) {
            setSelectedTableId(tabData.data.tableId);
          }
        }
        if (data.success) {
          const { products: prodData, categories: catData, tables: tableData } = data.data;
          setProducts(prodData.map((p: Product) => ({
            ...p,
            isPopular: p.name.length % 7 === 0 
          })));
          setCategories(catData);
          setTables(tableData);
        }
      } catch (error) {
        addToast('error', 'Failed to load configuration');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // Handle Table Selection & Load Active Order
  useEffect(() => {
    if (tablet?.mode === 'WAITER' && !selectedTableId) {
      setShowTableSelector(true);
    } else {
      setShowTableSelector(false);
    }

    const fetchActiveOrder = async () => {
      if (!selectedTableId) {
        setActiveOrder(null);
        setIsStatusVisible(false);
        return;
      }
      
      try {
        const res = await fetch(`/api/pos-orders?restaurantTableId=${selectedTableId}&status=in_progress`);
        const data = await res.json();
        if (data.success && data.data && data.data.length > 0) {
          setActiveOrder(data.data[0]); // Load the most recent active order
          setIsStatusVisible(true);
          addToast('success', 'Active order re-connected');
        } else {
          setActiveOrder(null);
          setIsStatusVisible(false);
        }
      } catch (e) {
        console.error('Failed to fetch existing table order');
      }
    };

    fetchActiveOrder();
    setCart([]);
    setIsCartOpen(false);
  }, [tablet?.mode, selectedTableId]);


  // Real-time status polling for active order
  useEffect(() => {
    if (!activeOrder || activeOrder.status === 'SERVED') return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/pos-orders/${activeOrder.id}`);
        const data = await res.json();
        if (data.success) {
          const newStatus = data.data.status;
          const oldStatus = activeOrder.status;

          // Notify guest of progress
          if (newStatus !== oldStatus) {
            if (newStatus === 'IN_KITCHEN') addToast('success', 'Chef has started crafting your masterpieces!');
            else if (newStatus === 'READY') addToast('success', 'Your order is perfected and ready to serve!');
            else if (newStatus === 'SERVED') addToast('success', 'Enjoy your meal! Presentation complete.');
          }

          setActiveOrder(data.data);
          if (newStatus === 'SERVED') {
            setShowRating(true);
          }
        }
      } catch (e) {
        console.error('Status poll failed', e);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [activeOrder?.id, activeOrder?.status]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map((item: any) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    addToast('success', `${product.name} added to cart`);
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === productId);
      if (existing && existing.quantity > 1) {
        return prev.map((item: any) => item.id === productId ? { ...item, quantity: item.quantity - 1 } : item);
      }
      return prev.filter(item => item.id !== productId);
    });
  };

  const handlePlaceOrder = async () => {
    if (!selectedTableId) {
      addToast('error', 'Please select a table');
      return;
    }

    setIsPlacingOrder(true);
    try {
      const res = await fetch('/api/pos-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: tablet?.propertyId,
          outletId: 'default-pos-outlet',
          orderType: 'DINE_IN',
          restaurantTableId: selectedTableId,
          items: cart.map(i => ({
            productId: i.id,
            quantity: i.quantity,
            unitPrice: i.sellingPrice
          }))
        })
      });

      const data = await res.json();
      if (data.success) {
        addToast('success', 'Order placed successfully!');
        setActiveOrder(data.data);
        setIsStatusVisible(true);
        setCart([]);
        setIsCartOpen(false);
        
        // Wait a small moment for toast then redirect
        setTimeout(() => {
          router.push('/operations/tables');
        }, 1500);
      } else {
        addToast('error', data.message || 'Failed to place order');
      }
    } catch (error) {
      addToast('error', 'Network error');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const submitRating = async () => {
    if (!activeOrder) return;
    try {
      await fetch(`/api/orders/${activeOrder.id}/rating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comments: comment })
      });
      addToast('success', 'Thank you for your feedback!');
      setShowRating(false);
      setActiveOrder(null);
    } catch (e) {
      addToast('error', 'Failed to submit rating');
    }
  };

  const cartTotal = useMemo(() => cart.reduce((total, item) => total + (item.sellingPrice * item.quantity), 0), [cart]);

  const filteredProducts = products.filter(p => {
    const matchesCategory = activeCategory === 'all' || p.categoryId === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-white">
      <div className="relative w-24 h-24 mb-6">
        <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
      </div>
      <p className="text-gray-400 font-bold uppercase tracking-widest text-sm animate-pulse">Initializing Interface...</p>
    </div>
  );

  if (!tablet) return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-red-50 text-red-600 p-10 text-center">
      <X size={64} className="mb-4" />
      <h2 className="text-2xl font-black mb-2 uppercase">Configuration Error</h2>
      <p className="font-medium opacity-70">This tablet session is invalid or has expired.</p>
    </div>
  );

  // --- WAITER MODE: Professional Session Assignment (With PAX Stage) ---
  if (tablet.mode === 'WAITER' && sessionStage !== 'MENU') {
    return (
      <div className="h-screen w-screen bg-slate-50 flex flex-col overflow-hidden font-sans select-none animate-in fade-in duration-700">
        <header className="h-24 shrink-0 flex items-center justify-between px-20 relative bg-white border-b border-slate-100 shadow-sm z-30">
          <div className="flex items-center gap-6">
             <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center shadow-lg transform rotate-2">
                <ChefHat size={22} className="text-white" />
             </div>
             <div>
                <h1 className="text-xl font-black tracking-[-0.03em] text-black uppercase leading-tight">ASO DHA <span className="text-slate-300 font-light">POS</span></h1>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{tablet.name} • WAITER PROTOCOL</p>
             </div>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="px-5 py-1.5 bg-emerald-50 rounded-full border border-emerald-100 flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                <span className="text-[8px] font-black uppercase tracking-widest text-emerald-600">Secure Node</span>
             </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center p-10 relative z-20">
           {sessionStage === 'TABLE' ? (
             <div className="w-full flex flex-col items-center animate-in slide-in-from-bottom-8 duration-700">
                <div className="text-center mb-10">
                   <h2 className="text-2xl font-bold text-black uppercase tracking-tight mb-1">Assign Station</h2>
                   <p className="text-slate-400 font-medium uppercase tracking-[0.2em] text-[10px]">Identify your table station to initiate operations</p>
                </div>

                <div className="w-full max-w-6xl grid grid-cols-2 md:grid-cols-4 luxury-scroll gap-6 overflow-y-auto py-2">
                   {tables.map(table => (
                     <button 
                       key={table.id}
                       onClick={() => {
                         setSelectedTableId(table.id);
                         setSessionStage('PAX');
                         addToast('success', `Table ${table.name} selected`);
                       }}
                       className="relative group aspect-square rounded-[32px] bg-white border border-slate-200 flex flex-col items-center justify-center transition-all duration-500 hover:border-black hover:-translate-y-2 hover:shadow-xl"
                     >
                       <TableIcon size={20} className="text-slate-200 mb-3" />
                       <span className="text-xl font-bold text-black">{table.name}</span>
                       <div className="mt-3 px-3 py-1 bg-slate-50 rounded-full text-[8px] font-bold uppercase tracking-widest text-slate-300">Ready</div>
                     </button>
                   ))}
                </div>
             </div>
           ) : (
             <div className="w-full max-w-2xl flex flex-col items-center animate-in zoom-in-95 duration-700">
                <button 
                  onClick={() => setSessionStage('TABLE')}
                  className="mb-8 flex items-center gap-2 text-slate-400 font-black text-[9px] tracking-widest hover:text-black transition-colors"
                >
                  <ArrowLeft size={14} /> BACK TO TABLES
                </button>

                <div className="text-center mb-12 px-12 py-10 bg-white rounded-[32px] border border-slate-100 shadow-xl w-full">
                   <h2 className="text-2xl font-bold text-black uppercase tracking-tight mb-1">Guest Count (PAX)</h2>
                   <p className="text-slate-400 font-medium uppercase tracking-[0.2em] text-[9px] mb-10">Table {tables.find(t => t.id === selectedTableId)?.name}</p>
                   
                   <div className="flex items-center justify-center gap-8">
                      <button 
                        onClick={() => setPax(Math.max(1, pax - 1))}
                        className="w-16 h-16 rounded-2xl border-2 border-slate-100 flex items-center justify-center text-slate-300 hover:border-black hover:text-black transition-all"
                      >
                         <Minus size={24} />
                      </button>
                      <span className="text-6xl font-black text-black w-24 tabular-nums">{pax}</span>
                      <button 
                        onClick={() => setPax(pax + 1)}
                        className="w-16 h-16 rounded-2xl border-2 border-slate-100 flex items-center justify-center text-slate-300 hover:border-black hover:text-black transition-all"
                      >
                         <Plus size={24} />
                      </button>
                   </div>
                </div>

                <button 
                  onClick={() => {
                    setSessionStage('MENU');
                    addToast('success', `Session started for Table ${tables.find(t => t.id === selectedTableId)?.name} with ${pax} guests`);
                  }}
                  className="mt-4 w-full h-16 bg-black text-white rounded-[24px] font-bold text-sm tracking-[0.2em] uppercase shadow-lg hover:bg-slate-800 transition-all"
                >
                   Start Service Protocol
                </button>
             </div>
           )}

           <div className="mt-20 flex items-center gap-12 opacity-50">
              <div className={`flex flex-col items-center gap-2 ${sessionStage === 'TABLE' ? 'opacity-100' : 'opacity-20'}`}>
                 <div className="w-1.5 h-1.5 rounded-full bg-black" />
                 <span className="text-[9px] font-black text-black">STATION</span>
              </div>
              <div className="w-12 h-[1px] bg-slate-200" />
              <div className={`flex flex-col items-center gap-2 ${sessionStage === 'PAX' ? 'opacity-100' : 'opacity-20'}`}>
                 <div className="w-1.5 h-1.5 rounded-full bg-black" />
                 <span className="text-[9px] font-black text-black">GUESTS</span>
              </div>
              <div className="w-12 h-[1px] bg-slate-200" />
              <div className="opacity-20 flex flex-col items-center gap-2">
                 <div className="w-1 h-1 rounded-full bg-slate-300" />
                 <span className="text-[9px] font-black text-slate-400">SERVICE</span>
              </div>
           </div>
        </main>
        
        <footer className="h-16 shrink-0 flex items-center justify-center border-t border-slate-100 bg-white/50">
            <p className="text-[8px] font-bold text-slate-300 uppercase tracking-[1em]">INITIALIZING SESSION HANDLER</p>
        </footer>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-[#F8FAFC] flex overflow-hidden font-sans select-none relative animate-in fade-in duration-700">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-50 rounded-full blur-[120px] -z-10 translate-x-1/3 -translate-y-1/3 opacity-40 animate-pulse" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-rose-50 rounded-full blur-[100px] -z-10 -translate-x-1/4 translate-y-1/4 opacity-30" />

      {/* --- Header: Ultra-Premium Command Center --- */}
      <header className="fixed top-6 left-6 right-6 h-20 bg-slate-900/40 backdrop-blur-[40px] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-[32px] z-50 flex items-center justify-between px-8 group transition-all duration-700">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
            <div className="w-12 h-12 bg-gradient-to-tr from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/20 transform group-hover:rotate-6 transition-transform">
              <Utensils className="text-white w-6 h-6" />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-3">
              <h1 className="font-black text-lg tracking-[-0.03em] text-white uppercase leading-none">ASO DHA <span className="text-indigo-500 tracking-widest ml-1 font-light opacity-50 text-[10px]">PREMIUM</span></h1>
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                <span className="text-[8px] font-black text-emerald-400 tracking-widest uppercase">Live</span>
              </div>
            </div>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] leading-none">
              {tablet.name} <span className="mx-2 text-slate-700">|</span> <span className="text-indigo-400 font-bold">{tablet.mode} MODE</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Table Indicator with Glow */}
          {tablet.mode === 'WAITER' ? (
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowTableSelector(true)}
                className="flex items-center gap-3 bg-white/5 hover:bg-white/10 text-white px-5 py-2.5 rounded-2xl border border-white/5 hover:border-white/10 transition-all active:scale-95 group/btn"
              >
                <TableIcon className="w-3.5 h-3.5 text-indigo-400 group-hover/btn:rotate-12 transition-transform" />
                <span className="font-bold uppercase tracking-widest text-[10px]">
                  {selectedTableId ? (tables.find(t => t.id === selectedTableId)?.name || 'Assign') : 'Assign'}
                </span>
              </button>
              
              <button 
                onClick={() => {
                  setSessionStage('TABLE');
                  addToast('success', 'Starting new session...');
                }}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-2xl shadow-lg shadow-indigo-600/20 transition-all active:scale-95 group/new"
              >
                <Plus size={14} className="group-hover/new:rotate-90 transition-transform" />
                <span className="font-bold uppercase tracking-widest text-[10px]">New Table</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4 bg-indigo-500/10 px-6 py-3 rounded-2xl border border-indigo-500/20 shadow-inner">
              <TableIcon className="text-indigo-400 w-4 h-4 shadow-[0_0_15px_rgba(129,140,248,0.3)]" />
              <span className="font-black text-white uppercase tracking-[0.3em] text-[11px]">
                {(() => {
                  const tName = tables.find(t => t.id === selectedTableId)?.name || '...';
                  return tName.toLowerCase().includes('table') ? tName : `Table ${tName}`;
                })()}
              </span>
            </div>
          )}

          <div className="w-[1px] h-8 bg-white/5" />

          {/* QR Display Toggle */}
          {tablet.mode === 'TABLE' && (
            <button 
              onClick={() => setShowQRStand(true)}
              className="flex items-center gap-3 bg-white/5 hover:bg-white/10 text-white px-5 py-3.5 rounded-2xl border border-white/10 transition-all active:scale-95 group/qr"
            >
              <QrCode size={18} className="text-emerald-400 group-hover/qr:scale-110 transition-transform" />
              <div className="flex flex-col items-start leading-none">
                <span className="text-[10px] font-black uppercase tracking-widest">Share QR</span>
                <span className="text-[9px] font-bold text-slate-500 mt-1 uppercase tracking-tight">Scan & Order</span>
              </div>
            </button>
          )}

          <div className="w-[1px] h-8 bg-white/5" />

          {/* Active Order Summary Hub */}
          {activeOrder && (
            <button 
              onClick={() => setIsStatusVisible(true)}
              className="flex items-center gap-3 bg-white/5 hover:bg-white/10 text-white px-5 py-3.5 rounded-2xl border border-white/10 transition-all active:scale-95 group/history"
            >
              <ShoppingBag size={16} className="text-indigo-400 group-hover/history:scale-110 transition-transform" />
              <div className="flex flex-col items-start leading-none">
                <span className="text-[10px] font-black uppercase tracking-widest">My Orders</span>
                <span className="text-[9px] font-bold text-slate-500 mt-1 uppercase tracking-tight">Total: ₹{activeOrder.grandTotal.toFixed(2)}</span>
              </div>
            </button>
          )}

          {/* Cart Hub */}
          <button 
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-8 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] shadow-[0_15px_40px_rgba(79,70,229,0.3)] hover:shadow-indigo-500/40 hover:-translate-y-1 active:translate-y-0 transition-all relative group/cart overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover/cart:translate-x-[100%] transition-transform duration-1000" />
            <ShoppingCart size={16} className="group-hover/cart:scale-110 transition-transform" />
            Basket 
            {cart.length > 0 && (
              <div className="bg-rose-500 px-2 py-0.5 rounded-lg text-[9px] font-black shadow-lg animate-in zoom-in duration-300">
                {cart.reduce((s, i) => s + i.quantity, 0)}
              </div>
            )}
          </button>
        </div>
      </header>

      {/* 2. Main Layout (Refined Sidebar + Content) */}
      <main className="flex-1 pt-32 pb-6 flex overflow-hidden px-6 gap-6">
        {/* Category: The Glass Blade */}
        <aside className="w-24 lg:w-32 flex flex-col items-center py-8 gap-6 bg-slate-900/40 backdrop-blur-[40px] border border-white/5 shadow-2xl rounded-[40px] z-30">
          <button 
            onClick={() => setActiveCategory('all')}
            className={`w-16 h-16 lg:w-20 lg:h-20 rounded-[28px] flex flex-col items-center justify-center transition-all duration-500 group relative ${activeCategory === 'all' ? 'bg-indigo-600 text-white shadow-[0_0_40px_rgba(79,70,229,0.4)]' : 'text-slate-500 hover:bg-white/5 hover:text-indigo-400'}`}
          >
            <Filter size={22} className={`relative z-10 transition-transform ${activeCategory === 'all' ? 'scale-110 rotate-12' : 'opacity-40 group-hover:rotate-180'}`} />
            <span className="relative z-10 text-[9px] font-black uppercase tracking-[0.2em] mt-2 leading-none whitespace-nowrap">Explore</span>
          </button>
          
          <div className="w-12 h-[1px] bg-white/5" />
          
          <div className="flex-1 overflow-y-auto w-full flex flex-col items-center gap-6 scrollbar-hide pb-8">
            {categories.map(cat => (
              <button 
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`w-16 h-20 lg:w-20 lg:h-24 rounded-[32px] flex flex-col items-center justify-center transition-all duration-500 flex-shrink-0 group relative ${activeCategory === cat.id ? 'bg-white text-slate-900 shadow-2xl scale-105' : 'text-slate-500 hover:bg-white/5 hover:text-indigo-400'}`}
              >
                {activeCategory === cat.id && (
                    <div className="absolute left-0 w-2 h-8 bg-indigo-500 rounded-r-full animate-in slide-in-from-left duration-300 shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
                )}
                <span className="text-[10px] font-black uppercase tracking-tight text-center leading-tight px-2 group-hover:scale-105 transition-transform">{cat.name}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* --- Content: The Interactive Canvas --- */}
        <section className="flex-1 flex flex-col overflow-hidden relative">
          {/* Smart Search Bar */}
          <div className="px-4 py-4 flex justify-between items-center z-20 sticky top-0">
             <div className="relative w-full max-w-2xl group">
                <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity" />
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={20} />
                <input 
                  type="text" 
                  placeholder="Masterpiece, please. Search for a dish..."
                  className="w-full h-16 bg-slate-900/40 backdrop-blur-3xl border border-white/5 rounded-[28px] pl-16 pr-8 text-sm font-bold text-white outline-none focus:bg-slate-900/60 transition-all placeholder:text-slate-600 shadow-2xl border-b-white/10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
             </div>
             
             <div className="flex gap-4 ml-6">
                <div className="p-4 bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-2xl text-slate-500 hover:text-indigo-400 transition-colors shadow-xl">
                   <Filter size={20} />
                </div>
             </div>
          </div>

          {/* Gallery: The Culinary Display */}
          <div className="flex-1 overflow-y-auto px-6 pb-40 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8 scroll-smooth no-scrollbar animate-in fade-in slide-in-from-bottom-8 duration-1000">
            {filteredProducts.map(product => (
              <div 
                key={product.id}
                className="group relative bg-slate-900/40 backdrop-blur-3xl rounded-[40px] border border-white/5 shadow-2xl hover:bg-slate-900/60 hover:-translate-y-3 transition-all duration-700 flex flex-col overflow-hidden h-full min-h-[420px]"
              >
                {/* Visual Reveal */}
                <div className="relative w-full aspect-[4/3] overflow-hidden shrink-0">
                  <div className="absolute inset-0">
                    {product.image ? (
                      <img 
                        src={product.image} 
                        alt={product.name} 
                        className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-125 brightness-90 group-hover:brightness-110" 
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 overflow-hidden relative">
                        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/pinstripes.png')]" />
                        <Utensils size={48} strokeWidth={0.5} className="text-slate-600 animate-pulse relative z-10" />
                      </div>
                    )}
                    
                    {/* Status HUD Overlay */}
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                    
                    <div className="absolute top-5 left-5 z-20">
                      <div className={`px-2.5 py-1 rounded-full border bg-black/40 backdrop-blur-md flex items-center gap-1.5 shadow-2xl transition-all duration-500 scale-90 group-hover:scale-100 ${product.productType === 'NON_VEG' ? 'border-rose-500/50 text-rose-400' : 'border-emerald-500/50 text-emerald-400'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor] ${product.productType === 'NON_VEG' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                        <span className="text-[7px] font-black uppercase tracking-widest">{product.productType === 'NON_VEG' ? 'Meat' : 'Vegan'}</span>
                      </div>
                    </div>

                    {product.isPopular && (
                      <div className="absolute top-5 right-5 z-20">
                        <div className="bg-amber-500/90 backdrop-blur-md text-white text-[8px] font-black px-3 py-1.5 rounded-xl uppercase tracking-[0.2em] flex items-center gap-2 shadow-2xl shadow-amber-500/20 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-500">
                          <Star size={9} className="fill-white" /> Trending
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Narrative & Interaction */}
                <div className="p-7 flex-1 flex flex-col justify-between gap-6 relative">
                  <div className="space-y-2">
                    <h3 className="font-bold text-white leading-tight text-sm tracking-tight line-clamp-2 min-h-[2.4em] group-hover:text-indigo-400 transition-colors uppercase">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-3">
                       <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] border-b border-white/5 pb-1">
                          {categories.find(c => c.id === product.categoryId)?.name || 'Classic'}
                       </span>
                    </div>
                  </div>
                  
                  <div className="flex items-end justify-between">
                     <div className="flex flex-col gap-0.5">
                        <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest opacity-60">Investment</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-indigo-400 text-xs font-black">₹</span>
                          <span className="font-black text-2xl text-white tracking-tighter leading-none">{product.sellingPrice}</span>
                        </div>
                     </div>

                     <div className="flex items-center">
                        {(() => {
                          const quantity = cart.find(i => i.id === product.id)?.quantity || 0;
                          
                          if (quantity === 0) {
                            return (
                              <button 
                                onClick={() => addToCart(product)}
                                className="h-12 px-6 bg-white text-slate-900 rounded-[22px] flex items-center gap-2 hover:bg-indigo-500 hover:text-white hover:shadow-[0_10px_30px_rgba(99,102,241,0.4)] hover:scale-110 active:scale-95 transition-all shadow-2xl relative group/add"
                              >
                                <Plus size={16} strokeWidth={3} className="group-hover/add:rotate-90 transition-transform" />
                                <span className="font-black text-[9px] uppercase tracking-[0.2em]">Add to Tray</span>
                              </button>
                            );
                          }

                          return (
                            <div className="flex items-center gap-4 bg-white/5 p-1 rounded-3xl border border-white/10 animate-in zoom-in duration-500">
                               <button 
                                onClick={() => removeFromCart(product.id)}
                                className="w-10 h-10 bg-rose-500 text-white rounded-[20px] flex items-center justify-center hover:bg-rose-600 transition-all active:scale-90 shadow-xl shadow-rose-500/20"
                               >
                                 <Minus size={16} strokeWidth={3} />
                               </button>
                               <span className="w-6 text-center font-black text-sm text-white">{quantity}</span>
                               <button 
                                onClick={() => addToCart(product)}
                                className="w-10 h-10 bg-indigo-500 text-white rounded-[20px] flex items-center justify-center hover:bg-indigo-600 transition-all active:scale-90 shadow-xl shadow-indigo-500/20"
                               >
                                 <Plus size={16} strokeWidth={3} />
                               </button>
                            </div>
                          );
                        })()}
                     </div>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredProducts.length === 0 && (
              <div className="col-span-full py-32 flex flex-col items-center justify-center text-slate-500">
                <div className="w-28 h-28 rounded-[40px] bg-white/5 flex items-center justify-center mb-6 shadow-xl border border-white/5 backdrop-blur-3xl">
                  <Search size={40} strokeWidth={1} className="opacity-20" />
                </div>
                <h4 className="font-black uppercase tracking-[0.3em] text-xs text-white mb-2 underline decoration-indigo-500 decoration-4 underline-offset-8">Recipe Not Found</h4>
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mt-4">Try exploring a different category</p>
              </div>
            )}
          </div>
        </section>
      </main>


      {/* --- Sliding Basket Module: The Luxury Drawer --- */}
      <div className={`fixed inset-0 z-[100] transition-all duration-700 flex justify-end ${isCartOpen ? 'visible' : 'invisible'}`}>
        <div 
          className={`absolute inset-0 bg-slate-900/60 backdrop-blur-2xl transition-opacity duration-700 ${isCartOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setIsCartOpen(false)}
        />
        <aside className={`relative w-full max-w-md h-full bg-[#0F172A] shadow-[-40px_0_100px_rgba(0,0,0,0.5)] transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] flex flex-col border-l border-white/5 ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          {/* Basket Hero Section */}
          <div className="relative p-10 pb-8 overflow-hidden shrink-0">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-[60px]" />
            <div className="flex items-center justify-between relative z-10">
              <div className="space-y-1">
                <h2 className="font-black text-3xl text-white uppercase tracking-tighter leading-none">Your Tray</h2>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Selected Masterpieces</p>
              </div>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="w-12 h-12 rounded-[22px] bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-all hover:bg-white/10 active:scale-90"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Tray Scroll Area */}
          <div className="flex-1 overflow-y-auto px-10 py-4 space-y-8 scrollbar-hide">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                <div className="w-24 h-24 bg-white/5 rounded-[40px] mb-8 flex items-center justify-center border border-white/5 animate-pulse">
                  <ShoppingCart className="w-10 h-10 text-slate-400" strokeWidth={1} />
                </div>
                <h3 className="text-xs font-black uppercase tracking-[0.4em] text-white">Empty Selection</h3>
                <p className="text-[9px] mt-4 font-bold text-slate-600 uppercase tracking-widest leading-loose">The kitchen awaits your first command.<br/>Excellence takes a moment.</p>
              </div>
            ) : cart.map((item: any) => (
              <div key={item.id} className="flex gap-6 items-center animate-in slide-in-from-right-8 duration-500">
                <div className="w-16 h-16 rounded-2xl bg-white/5 overflow-hidden shrink-0 border border-white/10 p-0.5 shadow-2xl">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-[14px]" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-700">
                      <Utensils size={24} strokeWidth={1} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-black text-white text-sm uppercase tracking-tight line-clamp-1">{item.name}</h4>
                  <p className="text-indigo-400 font-black text-[11px] mt-1.5 opacity-70">₹{item.sellingPrice}</p>
                </div>
                <div className="flex items-center gap-4 bg-white/5 p-1.5 rounded-2xl border border-white/10">
                  <button 
                    onClick={() => removeFromCart(item.id)}
                    className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all active:scale-95"
                  >
                    <Minus size={14} strokeWidth={3} />
                  </button>
                  <span className="w-6 text-center font-black text-sm text-white">{item.quantity}</span>
                  <button 
                    onClick={() => addToCart(item)}
                    className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center hover:bg-indigo-500 hover:text-white transition-all active:scale-95"
                  >
                    <Plus size={14} strokeWidth={3} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Checkout Command Center */}
          <div className="p-10 bg-slate-900/60 backdrop-blur-3xl border-t border-white/5 flex flex-col gap-8 shadow-[0_-20px_50px_rgba(0,0,0,0.3)]">
            <div className="space-y-4">
              <div className="flex justify-between items-center text-slate-600 font-black uppercase tracking-[0.3em] text-[10px]">
                <span>Artistic Total</span>
                <span className="text-white">₹{cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-white font-black text-4xl pt-6 border-t border-white/5">
                <span className="tracking-tighter uppercase text-slate-400 text-lg">Payable</span>
                <span className="text-indigo-500 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]">₹{cartTotal.toFixed(2)}</span>
              </div>
            </div>

            <Button 
              className="w-full h-20 rounded-[32px] bg-indigo-600 hover:bg-indigo-500 text-white text-[12px] font-black uppercase tracking-[0.4em] shadow-[0_20px_40px_rgba(79,70,229,0.3)] flex items-center justify-center gap-4 transition-all duration-500 active:scale-[0.98] disabled:grayscale disabled:opacity-30 group/confirm"
              disabled={cart.length === 0 || isPlacingOrder || (tablet.mode === 'WAITER' && !selectedTableId)}
              loading={isPlacingOrder}
              onClick={handlePlaceOrder}
            >
              Dispatch Order
              <ChevronRight size={20} strokeWidth={3} className="group-hover/confirm:translate-x-2 transition-transform" />
            </Button>
            
            {tablet.mode === 'WAITER' && !selectedTableId && (
              <div className="p-4 bg-rose-500/10 rounded-2xl border border-rose-500/20 text-center animate-bounce">
                 <p className="text-rose-400 font-black text-[9px] uppercase tracking-[0.3em] flex items-center justify-center gap-3">
                    <X size={14} strokeWidth={3} /> Assignment Required
                 </p>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* --- Order Flow Tracking: Immersive View --- */}
      {activeOrder && isStatusVisible && (
        <div className="fixed inset-0 z-[150] bg-[#0F172A] flex flex-col animate-in fade-in zoom-in-95 duration-700">
           {/* Decor */}
           <div className="absolute top-[-20%] left-[-10%] w-[1000px] h-[1000px] bg-indigo-600/5 rounded-full blur-[200px]" />
           
           <div className="p-12 flex items-center justify-between relative z-10">
            <div className="flex items-center gap-6">
               <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-violet-600 rounded-[28px] flex items-center justify-center shadow-2xl shadow-indigo-500/20">
                  <ChefHat className="text-white w-8 h-8" />
               </div>
               <div className="space-y-1">
                  <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">Culinary Sync</h2>
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] opacity-60">Session {activeOrder.orderNo} • Kitchen Real-Time</p>
               </div>
            </div>
            <button 
              onClick={() => setIsStatusVisible(false)}
              className="w-16 h-16 bg-white/5 rounded-[28px] flex items-center justify-center text-slate-400 hover:text-white shadow-2xl transition-all hover:bg-white/10"
            >
              <X size={28} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-12 md:px-24 py-12 relative z-10 no-scrollbar">
            <div className="flex flex-col items-center w-full min-h-full">
            <div className="w-full max-w-6xl grid grid-cols-4 gap-12 relative pb-24">
              {/* Animated Progress Conduit */}
              <div className="absolute top-[4rem] left-[10%] right-[10%] h-1 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-rose-500 transition-all duration-[2000ms] ease-out shadow-[0_0_30px_rgba(99,102,241,1)]" 
                  style={{ 
                    width: `${(() => {
                      const stages = ['PLACED', 'IN_KITCHEN', 'READY', 'SERVED'];
                      let index = stages.indexOf(activeOrder.status);
                      if (index === -1) {
                        // Fallback: If status is PENDING/OPEN/NEW, map to PLACED (index 0)
                        if (['PENDING', 'OPEN', 'NEW'].includes(activeOrder.status)) index = 0;
                        else index = 0; 
                      }
                      return (index / 3) * 100;
                    })()}%` 
                  }}
                />
              </div>

               {[
                { key: 'PLACED', label: 'Authorized', desc: 'Securely received', icon: CheckCircle, altKeys: ['PENDING', 'OPEN', 'NEW'] },
                { key: 'IN_KITCHEN', label: 'Crafting', desc: 'Active preparation', icon: Utensils, altKeys: ['PREPARING'] },
                { key: 'READY', label: 'Perfected', desc: 'Quality inspected', icon: Star, altKeys: [] },
                { key: 'SERVED', label: 'Presented', desc: 'Final delivery', icon: ShoppingBag, altKeys: [] }
              ].map((step, idx, arr) => {
                const stepIdx = idx;
                const currentStatus = activeOrder.status;
                const stages = arr.map((s: any) => s.key);
                
                // Determine if this step is passed or current
                let currentIdx = stages.indexOf(currentStatus);
                if (currentIdx === -1) {
                  // Check aliases
                  const aliasIdx = arr.findIndex(s => (s.altKeys || []).includes(currentStatus));
                  currentIdx = aliasIdx !== -1 ? aliasIdx : 0;
                }

                const isPassed = stepIdx <= currentIdx;
                const isCurrent = stepIdx === currentIdx;

                return (
                  <div key={step.key} className="flex flex-col items-center text-center relative z-10">
                    <div className={`w-28 h-28 lg:w-32 lg:h-32 rounded-[44px] flex items-center justify-center transition-all duration-[1000ms] transform ${
                      isPassed 
                      ? 'bg-gradient-to-tr from-indigo-500 to-indigo-700 shadow-[0_20px_60px_rgba(79,70,229,0.4)] border-none' 
                      : 'bg-white/5 border border-white/5 text-slate-800'
                    } ${isCurrent ? 'animate-pulse ring-[16px] ring-indigo-500/10 scale-110' : ''}`}>
                      <step.icon size={40} className={`transition-all duration-700 ${isPassed ? 'text-white drop-shadow-lg' : 'text-slate-700 opacity-20'}`} />
                    </div>
                    <div className="mt-10 space-y-2.5">
                      <h4 className={`font-black text-[11px] uppercase tracking-[0.3em] ${isPassed ? 'text-white' : 'text-slate-600'}`}>{step.label}</h4>
                      <p className={`text-[9px] font-bold uppercase tracking-widest transition-opacity duration-1000 ${isPassed ? 'text-slate-500 opacity-100' : 'opacity-0'}`}>{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Active Items Carousel/List */}
            <div className="w-full max-w-4xl mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-bottom-12 duration-1000 delay-300">
               {activeOrder.items && activeOrder.items.length > 0 ? (
                 activeOrder.items.map((item, idx) => (
                   <div key={item.id || idx} className="bg-white/5 backdrop-blur-3xl border border-white/5 rounded-3xl p-6 flex items-center gap-6 group hover:bg-white/10 transition-all duration-500">
                      <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shrink-0 group-hover:scale-110 transition-transform">
                         {item.product?.image ? (
                           <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover rounded-2xl" />
                         ) : (
                           <Utensils size={20} className="text-indigo-400" />
                         )}
                      </div>
                      <div className="flex-1 min-w-0">
                         <div className="flex justify-between items-start">
                           <p className="text-[11px] font-black text-white uppercase tracking-wider line-clamp-1">{item.product?.name}</p>
                           <span className="text-indigo-400 font-black text-[11px]">₹{(item.unitPrice * item.quantity).toFixed(2)}</span>
                         </div>
                         <div className="flex items-center gap-3 mt-1.5">
                            <span className="bg-indigo-600 px-2 py-0.5 rounded-lg text-[9px] font-black text-white">{item.quantity}×</span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Confirmed</span>
                         </div>
                      </div>
                   </div>
                 ))
               ) : (
                 <div className="col-span-full text-center py-10 opacity-20">
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white">Initializing Item Stream...</p>
                 </div>
               )}
            </div>

            <div className="mt-16 flex flex-wrap justify-center gap-8">
              <div className="bg-white/5 backdrop-blur-3xl px-10 py-7 rounded-[40px] border border-white/5 flex items-center gap-8 shadow-2xl group hover:border-white/10 transition-all duration-500">
                <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center animate-pulse group-hover:bg-indigo-500/20 transition-colors">
                  <Clock size={32} className="text-indigo-400" />
                </div>
                <div className="text-left space-y-1">
                  <p className="text-slate-500 font-black text-[10px] uppercase tracking-[0.3em]">Temporal Estimate</p>
                  <p className="font-extrabold text-3xl text-white tracking-tighter uppercase transition-all group-hover:text-indigo-400">08 <span className="text-xs text-slate-600 tracking-[0.5em] ml-2">Mins</span></p>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-3xl px-10 py-7 rounded-[40px] border border-white/5 flex items-center gap-8 shadow-2xl group hover:border-white/10 transition-all duration-500">
                <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                  <ShoppingBag size={32} className="text-emerald-400" />
                </div>
                <div className="text-left space-y-1">
                  <p className="text-slate-500 font-black text-[10px] uppercase tracking-[0.3em]">Session Investment</p>
                  <p className="font-extrabold text-3xl text-white tracking-tighter uppercase transition-all group-hover:text-emerald-400">₹{activeOrder.grandTotal.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>



            {/* New Session Access for Staff */}
            {tablet.mode === 'WAITER' && (
              <div className="p-12 pb-24 flex justify-center w-full">
                <Button 
                  variant="secondary" 
                  className="rounded-2xl px-12 h-16 text-[10px] font-bold uppercase tracking-widest bg-indigo-600 border-none text-white hover:bg-indigo-500 shadow-xl transition-all active:scale-95 flex items-center gap-3"
                  onClick={() => {
                    setActiveOrder(null);
                    setIsStatusVisible(false);
                    setSessionStage('TABLE');
                  }}
                >
                  <Plus size={16} /> Start Next Table Order
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Insight Tracker */}
      {activeOrder && !isStatusVisible && (
        <button 
          onClick={() => setIsStatusVisible(true)}
          className="fixed bottom-12 right-12 bg-indigo-600 text-white pl-6 pr-10 py-6 rounded-[36px] font-black text-xs uppercase tracking-[0.4em] shadow-[0_30px_80px_rgba(79,70,229,0.5)] flex items-center gap-6 hover:bg-indigo-500 hover:scale-110 active:scale-95 transition-all z-40 animate-in slide-in-from-bottom-12 ring-[8px] ring-white/10 group"
        >
          <div className="relative">
             <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-20" />
             <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center group-hover:bg-white/20 transition-colors">
                <Clock size={20} className="text-white" />
             </div>
          </div>
          <div className="flex flex-col items-start gap-1">
            <span className="text-[9px] text-white/40 leading-none">Dispatching</span>
            <span className="leading-none tracking-[0.2em]">{activeOrder.status}</span>
          </div>
          <ChevronRight size={18} strokeWidth={3} className="ml-2 group-hover:translate-x-2 transition-transform" />
        </button>
      )}

      {/* Rating & Feedback: Floating Centered Overlay */}
      {showRating && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-8 animate-in fade-in duration-500">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-3xl" onClick={() => { setShowRating(false); setActiveOrder(null); }} />
           
           <div className="w-full max-w-xl bg-[#0F172A] rounded-[48px] border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.5)] overflow-hidden relative z-10 animate-in zoom-in-95 slide-in-from-bottom-12 duration-700">
              <div className="py-12 text-center px-10">
                <div className="w-24 h-24 bg-amber-500/10 rounded-[38px] flex items-center justify-center mx-auto mb-8 shadow-2xl border border-amber-500/20 group animate-bounce">
                   <Star className="text-amber-500 fill-amber-500 animate-in zoom-in duration-1000" size={48} />
                </div>
                <h3 className="text-2xl font-black text-white tracking-tighter uppercase mb-4">Culinary Verdict</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.4em] px-12 leading-loose mb-10">How was your experience tonight?</p>
                
                <div className="flex justify-center gap-3 mb-10">
                  {[1, 2, 3, 4, 5].map(num => (
                    <button
                      key={num}
                      onClick={() => setRating(num)}
                      className={`w-14 h-14 rounded-[20px] flex items-center justify-center text-lg font-black transition-all duration-500 ${
                        rating >= num ? 'bg-amber-500 text-white shadow-[0_15px_40px_rgba(245,158,11,0.4)] -translate-y-2 scale-110' : 'bg-white/5 text-slate-700 hover:bg-white/10'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>

                <div className="relative group mb-10">
                  <textarea
                    placeholder="Tell us your secrets..."
                    className="w-full bg-white/5 border border-white/5 rounded-[32px] p-6 text-sm outline-none focus:border-amber-500/50 focus:bg-white/10 transition-all font-bold text-white placeholder:text-slate-700 shadow-inner min-h-[120px] resize-none"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                </div>

                <div className="flex gap-4">
                  <Button variant="secondary" onClick={() => { setShowRating(false); setActiveOrder(null); }} className="flex-1 h-14 rounded-2xl font-black uppercase tracking-[0.3em] bg-white/5 border-white/5 text-slate-500 hover:text-white transition-all">Dismiss</Button>
                  <Button onClick={submitRating} className="flex-1 h-14 rounded-2xl font-black uppercase tracking-[0.3em] bg-indigo-600 shadow-[0_15px_40px_rgba(79,70,229,0.3)] hover:bg-indigo-500 transition-all">Submit</Button>
                </div>
              </div>
           </div>
        </div>
      )}
      {/* --- QR STAND OVERLAY: Full Screen QR for Customers --- */}
      {showQRStand && (
        <div className="fixed inset-0 z-[300] bg-[#0A0C10] flex flex-col items-center justify-center p-8 animate-in fade-in duration-700">
           {/* Dynamic Background */}
           <div className="absolute inset-0 overflow-hidden">
             <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] bg-gradient-to-br from-indigo-500/10 via-slate-950 to-emerald-500/10 opacity-50" />
             <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-600/5 rounded-full blur-[150px] animate-pulse" />
             <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-600/5 rounded-full blur-[120px]" />
           </div>

           <div className="relative z-10 flex flex-col items-center max-w-2xl w-full text-center">
              <div className="mb-12 flex flex-col items-center">
                 <div className="w-20 h-20 bg-gradient-to-tr from-emerald-400 to-indigo-600 rounded-[30px] flex items-center justify-center shadow-2xl mb-6">
                    <ChefHat className="text-white w-10 h-10" />
                 </div>
                 <h2 className="text-5xl font-black text-white uppercase tracking-tighter mb-4">Scan & Order</h2>
                 <p className="text-slate-400 font-bold uppercase tracking-[0.4em] text-sm">Experience the menu on your own phone</p>
              </div>

              <div className="bg-white p-12 rounded-[60px] shadow-[0_40px_100px_rgba(0,0,0,0.6)] mb-12 border-8 border-white/10 group transition-transform duration-700 hover:scale-[1.02]">
                 <QRCodeSVG 
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/menu/${tablet.property.code}/${tablet.table?.qrToken || tablet.table?.id || 'unknown'}`} 
                    size={320}
                    level="H"
                    includeMargin={false}
                 />
                 <div className="mt-8 flex flex-col items-center">
                    <div className="px-6 py-2 bg-slate-900 rounded-full border border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-500">
                      Table Station: <span className="text-white ml-2">{tablet.table?.name || 'N/A'}</span>
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-3 gap-8 w-full">
                 <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-indigo-400 border border-white/5">
                       <Smartphone size={24} />
                    </div>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Scan QR</span>
                 </div>
                 <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-emerald-400 border border-white/5">
                       <Zap size={24} />
                    </div>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Order Instantly</span>
                 </div>
                 <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-amber-400 border border-white/5">
                       <Star size={24} />
                    </div>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Enjoy Meal</span>
                 </div>
              </div>

              <button 
                onClick={() => setShowQRStand(false)}
                className="mt-16 px-12 py-5 bg-white text-slate-900 rounded-[24px] font-black text-xs uppercase tracking-[0.4em] shadow-2xl hover:bg-indigo-50 transition-all active:scale-95"
              >
                 Return to Tablet Menu
              </button>
           </div>
        </div>
      )}
    </div>
  );
}
