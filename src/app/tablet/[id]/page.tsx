'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Utensils, ShoppingCart, User, Table as TableIcon, 
  CheckCircle, Clock, ChevronRight, Star, 
  Menu, X, Search, Filter, ArrowLeft, Plus, Minus,
  ChefHat, ShoppingBag, Bell, CreditCard, ReceiptIndianRupee,
  Volume2, VolumeX, Smartphone, Zap, CarFront, UserPlus
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { CustomerForm } from '@/components/forms/customer-form';
import { useToast } from '@/components/ui/Toast';
import { motion, AnimatePresence } from 'framer-motion';

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
  productType?: string;
  isPopular?: boolean;
  hsnCode?: string;
  halfPrice?: number | null;
  variants?: any[];
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
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  membershipDiscount?: number;
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

// --- Constants (Matching Billing Page Aesthetics) ---
const PRODUCT_PALETTE_DARK = [
  { bg: '#c8e6c9', border: '#81c784', text: '#1b3a1c', textSub: '#2e5e30' },  // Mint Green
  { bg: '#ce93d8', border: '#ab47bc', text: '#1a0d1e', textSub: '#3d1547' },  // Lavender
  { bg: '#90caf9', border: '#42a5f5', text: '#0d1f35', textSub: '#0c3b6e' },  // Sky Blue
  { bg: '#f48fb1', border: '#e91e63', text: '#2d0016', textSub: '#6a0030' },  // Rose Pink
  { bg: '#fff59d', border: '#fdd835', text: '#2d2600', textSub: '#5e4a00' },  // Yellow
  { bg: '#80cbc4', border: '#26a69a', text: '#002926', textSub: '#00544f' },  // Teal
  { bg: '#ffcc80', border: '#ffa726', text: '#2d1500', textSub: '#5e3000' },  // Peach/Orange
  { bg: '#b0bec5', border: '#78909c', text: '#1a2125', textSub: '#2e3d45' },  // Blue Grey
];

const CATEGORY_COLORS_DARK: Record<number, string> = {
  0: 'bg-[#b8d8bc] text-[#1a3d1f]', // Soft mint green
  1: 'bg-[#c9b8d8] text-[#2e1a4a]', // Soft lavender
  2: 'bg-[#b8cfd8] text-[#1a2e3d]', // Soft sky blue
  3: 'bg-[#d8b8c2] text-[#3d1a26]', // Soft rose pink
  4: 'bg-[#d8d4b8] text-[#3d3520]', // Soft warm beige
  5: 'bg-[#b8d8d0] text-[#1a3d35]', // Soft teal
  6: 'bg-[#d8c8b8] text-[#3d2d1a]', // Soft peach
  7: 'bg-[#c8c8d8] text-[#1a1a3d]', // Soft periwinkle
};

export default function TabletPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = React.use(params);
  const [tablet, setTablet] = useState<TabletConfig | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tables, setTables] = useState<{id: string, name: string}[]>([]);
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<string>('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showTableSelector, setShowTableSelector] = useState(false);
  
  const [pax, setPax] = useState<number>(1);
  const [sessionStage, setSessionStage] = useState<'TABLE' | 'PAX' | 'MENU'>('TABLE');
  const [isStatusVisible, setIsStatusVisible] = useState(false);

  // --- Order Calculation States ---
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [discountType, setDiscountType] = useState<'FLAT' | 'PERCENT'>('FLAT');

  // --- Waiter/Search States ---
  const [searchMode, setSearchMode] = useState<'CUSTOMER' | 'DRIVER' | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [driverSearch, setDriverSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isWaitingApproval, setIsWaitingApproval] = useState(false);
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI'>('CASH');
  const [transactionLast4, setTransactionLast4] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [drivers, setDrivers] = useState<any[]>([]);

  const categoryMap = useMemo(() => {
    const map: Record<string, string> = {};
    categories.forEach(c => {
      map[c.id] = c.name;
    });
    return map;
  }, [categories]);

  const { addToast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tabRes, dataRes, custRes, drivRes] = await Promise.all([
          fetch(`/api/tablets/${id}`),
          fetch(`/api/tablets/${id}/data`),
          fetch('/api/customers'),
          fetch('/api/drivers'),
        ]);
        
        const tabData = await tabRes.json();
        const data = await dataRes.json();
        const custData = await custRes.json();
        const drivData = await drivRes.json();

        if (tabData.success) {
          setTablet(tabData.data);
          if (tabData.data.tableId) {
            setSelectedTableId(tabData.data.tableId);
            setSessionStage('MENU');
          }
        }
         if (data.success) {
           const { products: prodData, categories: catData, tables: tableData, property: propData } = data.data;
           setProducts(prodData);
           setCategories(catData);
           setTables(tableData);
           setProperty(propData);
         }
        if (custData) setCustomers(Array.isArray(custData) ? custData : custData.data || []);
        if (drivData.success) setDrivers(drivData.data);
      } catch (error) {
        addToast('error', 'Failed to load configuration');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  useEffect(() => {
    const fetchActiveOrder = async () => {
      if (!selectedTableId) return;
      try {
        const res = await fetch(`/api/pos-orders?restaurantTableId=${selectedTableId}&status=in_progress`);
        const data = await res.json();
        if (data.success && data.data && data.data.length > 0) {
          const newOrder = data.data[0];
          setActiveOrder(prev => {
            // Only update if data has actually changed to prevent re-renders
            if (prev && JSON.stringify(prev) === JSON.stringify(newOrder)) return prev;
            return newOrder;
          });
          setIsStatusVisible(true);
        } else {
          setActiveOrder(null);
          setIsStatusVisible(false);
        }
      } catch (e) {
        // Silent error for polling to avoid toast spam
        console.error('Polling error:', e);
      }
    };

    if (selectedTableId) {
      fetchActiveOrder();
      const pollInterval = isWaitingApproval ? 5000 : 10000;
      const interval = setInterval(fetchActiveOrder, pollInterval); 
      return () => clearInterval(interval);
    }
  }, [selectedTableId, isWaitingApproval]);

  // Effect to handle session reset on settlement
  useEffect(() => {
    if (activeOrder?.status === 'SETTLED') {
      addToast('success', 'Payment Approved! Thank you.');
      setActiveOrder(null);
      setCart([]);
      setIsWaitingApproval(false);
      setIsStatusVisible(false);
      setPax(1);
      // If in TABLE mode, go back to table selection
      if (tablet?.mode === 'WAITER') {
        setSessionStage('TABLE');
      }
    }
  }, [activeOrder?.status]);

  const addToCart = (product: Product | any, variantName?: string, variantPrice?: number) => {
    const finalPrice = variantPrice ?? product.sellingPrice;
    const finalName = variantName && variantName !== 'Full' ? `${product.name} (${variantName})` : product.name;
    const cartItemId = variantName ? `${product.id}-${variantName}` : product.id;

    setCart(prev => {
      const existing = prev.find(item => (item as any).cartItemId === cartItemId);
      if (existing) {
        return prev.map(item =>
          (item as any).cartItemId === cartItemId ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, name: finalName, sellingPrice: finalPrice, cartItemId, quantity: 1, size: variantName }];
    });
    addToast('success', `${finalName} added to tray`);
  };

  const updateQuantity = (cartItemId: string, delta: number) => {
    setCart(prev => {
      const existing = prev.find(item => (item as any).cartItemId === cartItemId);
      if (existing && existing.quantity === 1 && delta === -1) {
        return prev.filter(item => (item as any).cartItemId !== cartItemId);
      }
      return prev.map(item =>
        (item as any).cartItemId === cartItemId ? { ...item, quantity: item.quantity + delta } : item
      );
    });
  };

  const removeFromCart = (cartItemId: string) => {
    setCart(prev => prev.filter(item => (item as any).cartItemId !== cartItemId));
  };

  const handlePlaceOrder = async () => {
    if (!selectedTableId) return;
    if (cart.length === 0 && !activeOrder) return;

    setIsPlacingOrder(true);
    try {
      const res = await fetch('/api/pos-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: tablet?.propertyId,
          outletId: 'default-pos-outlet',
          orderType: selectedDriver ? 'DELIVERY' : 'DINE_IN',
          restaurantTableId: selectedTableId,
          guestId: selectedCustomer?.id,
          driverId: selectedDriver?.id,
          discountAmount: discountAmount || 0,
          discountType: discountType,
          items: cart.map(i => ({
            productId: i.id,
            quantity: i.quantity,
            unitPrice: i.sellingPrice,
            variantName: (i as any).size || (i as any).variantName || null
          })),
          paymentMode: paymentMode,
          transactionLast4: transactionLast4
        })
      });

      const data = await res.json();
      if (data.success) {
         addToast('success', 'Order sent to kitchen!');
         setActiveOrder(data.data);
         setIsStatusVisible(true);
         // Clear the local cart because items are now in activeOrder.items
         // But the UI will still show them and the total will reflect them.
         setCart([]); 
      } else {
        addToast('error', data.message || 'Failed to place order');
      }
    } catch (error) {
      addToast('error', 'Network error');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const cartSubtotal = useMemo(() => {
    const inCart = cart.reduce((total, item) => total + (item.sellingPrice * item.quantity), 0);
    const ordered = activeOrder?.subtotal || 0;
    return inCart + ordered;
  }, [cart, activeOrder]);

  const cartTax = useMemo(() => {
    const inCartTax = cart.reduce((total, item) => total + (item.sellingPrice * item.quantity * 0.05), 0);
    const orderedTax = activeOrder?.taxAmount || 0;
    return inCartTax + orderedTax;
  }, [cart, activeOrder]);

  const cartTotal = cartSubtotal + cartTax 
    - (discountType === 'PERCENT' ? (cartSubtotal * discountAmount / 100) : discountAmount)
    - (activeOrder?.discountAmount || 0)
    - (activeOrder?.membershipDiscount || 0);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCategory = activeCategory === 'all' || p.categoryId === activeCategory;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, activeCategory, searchQuery]);

  if (loading) return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#0F172A]">
      <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4" />
      <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">Initializing Terminal...</p>
    </div>
  );

  if (!tablet) return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-red-950/20 text-red-500 p-10 text-center">
      <X size={64} className="mb-4" />
      <h2 className="text-2xl font-black uppercase">Configuration Error</h2>
    </div>
  );

  // Waiter Station Selection
  if (tablet.mode === 'WAITER' && sessionStage !== 'MENU') {
    return (
      <div className="h-screen w-screen bg-[#0F172A] text-white flex flex-col overflow-hidden font-sans">
        <header className="h-20 shrink-0 flex items-center justify-between px-10 border-b border-white/5 bg-slate-900/50">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                 <ChefHat size={20} className="text-white" />
              </div>
              <div>
                 <h1 className="text-lg font-black tracking-tight uppercase">OrderMint <span className="text-indigo-500">Tablet</span></h1>
                 <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{tablet.name} • WAITER STATION</p>
              </div>
           </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-10">
           {sessionStage === 'TABLE' ? (
             <div className="w-full max-w-5xl">
                <div className="text-center mb-12">
                   <h2 className="text-3xl font-black uppercase tracking-tight mb-2">Select Station</h2>
                   <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Identify the table to begin service</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                   {tables.map(table => (
                     <button 
                       key={table.id}
                       onClick={() => { setSelectedTableId(table.id); setSessionStage('PAX'); }}
                       className="aspect-square rounded-[32px] bg-slate-900 border border-white/5 flex flex-col items-center justify-center transition-all hover:border-indigo-500 hover:-translate-y-2 group shadow-2xl"
                     >
                       <TableIcon size={24} className="text-slate-700 mb-3 group-hover:text-indigo-400" />
                       <span className="text-2xl font-black">{table.name}</span>
                       <div className="mt-2 px-3 py-1 bg-white/5 rounded-full text-[8px] font-black uppercase tracking-widest text-slate-500">Ready</div>
                     </button>
                   ))}
                </div>
             </div>
           ) : (
             <div className="w-full max-w-xl text-center">
                <h2 className="text-3xl font-black uppercase tracking-tight mb-12">Guest Count</h2>
                <div className="bg-slate-900 rounded-[40px] p-12 border border-white/5 shadow-2xl mb-12">
                   <div className="flex items-center justify-center gap-12">
                      <button onClick={() => setPax(Math.max(1, pax - 1))} className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white transition-all"><Minus size={32} /></button>
                      <span className="text-8xl font-black tabular-nums">{pax}</span>
                      <button onClick={() => setPax(pax + 1)} className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white transition-all"><Plus size={32} /></button>
                   </div>
                </div>
                <button onClick={() => setSessionStage('MENU')} className="w-full py-6 bg-indigo-600 rounded-[24px] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/20 hover:bg-indigo-500 transition-all">Launch Service Protocol</button>
             </div>
           )}
        </main>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-[#020617] text-white flex flex-col overflow-hidden font-sans select-none">
      {/* Top Header - Unified Terminal Header */}
      <header className="h-16 shrink-0 flex items-center justify-between px-6 bg-slate-900/80 backdrop-blur-md border-b border-white/5 z-50">
        <div className="flex items-center gap-4">
           <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Utensils size={18} />
           </div>
           <div>
              <h1 className="font-black uppercase tracking-tight text-sm">OrderMint <span className="text-indigo-500">POS</span></h1>
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                 {tablet.name} • {tables.find(t => t.id === selectedTableId)?.name || 'STATION'}
              </p>
           </div>
        </div>

        {activeOrder && (
          <div className="hidden md:flex items-center gap-3 px-3 py-1.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20 animate-in fade-in zoom-in duration-500">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
             <div className="flex flex-col">
                <span className="text-[7px] font-black uppercase text-indigo-400 tracking-widest leading-none">Active Order</span>
                <span className="text-[9px] font-black leading-tight text-white/90">#{activeOrder.orderNo}</span>
             </div>
             <button 
              onClick={() => setIsStatusVisible(true)}
              className="text-[7px] font-black uppercase bg-white/5 px-2 py-1 rounded-md hover:bg-white/10 ml-2 border border-white/5 transition-all"
             >
               Track Status
             </button>
          </div>
        )}

        <div className="flex items-center gap-4">
           <div className="relative w-64 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={14} />
              <input 
                type="text" 
                placeholder="Search Menu..."
                className="w-full h-10 bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 text-[10px] font-bold outline-none focus:border-indigo-500/50 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
           </div>

           {tablet.mode === 'WAITER' && (
             <button 
               onClick={() => setSessionStage('TABLE')}
               className="h-10 px-4 bg-white/5 border border-white/10 rounded-xl flex items-center gap-2 hover:bg-white/10 transition-all text-[9px] font-black uppercase tracking-widest"
             >
               <TableIcon size={14} className="text-indigo-400" />
               Change Table
             </button>
           )}

           <button className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-all">
              <Bell size={18} />
           </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Side: Product Grid & Categories (Billing Style) */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-950/50">
           {/* Category Bar */}
           <div className="h-20 shrink-0 border-b border-white/5 flex items-center px-4 gap-3 overflow-x-auto no-scrollbar">
              <button 
                onClick={() => setActiveCategory('all')}
                className={`flex flex-col items-center justify-center min-w-[80px] h-14 rounded-xl transition-all ${activeCategory === 'all' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white/5 text-slate-500 hover:bg-white/10'}`}
              >
                 <span className="text-[10px] font-black uppercase tracking-widest">All Items</span>
                 <span className="text-[8px] font-bold opacity-60 mt-0.5">{products.length} Items</span>
              </button>

              {categories.map((cat, idx) => {
                const colorClass = CATEGORY_COLORS_DARK[idx % 8];
                return (
                  <button 
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`flex flex-col items-center justify-center min-w-[100px] h-14 rounded-xl transition-all ${activeCategory === cat.id ? `${colorClass} shadow-lg scale-105` : 'bg-white/5 text-slate-500 hover:bg-white/10'}`}
                  >
                     <span className="text-[10px] font-black uppercase tracking-widest truncate w-full px-2 text-center">{cat.name}</span>
                     <span className="text-[8px] font-bold opacity-60 mt-0.5">Category</span>
                  </button>
                );
              })}
           </div>


           {/* High Density Product Grid */}
           <div className="flex-1 overflow-y-auto p-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-3 content-start no-scrollbar">
              {filteredProducts.map((product, idx) => {
                const palette = PRODUCT_PALETTE_DARK[idx % PRODUCT_PALETTE_DARK.length];
                const inCart = cart.find(item => item.id === product.id);
                const hasVariants = (product.variants && product.variants.length > 0) || product.halfPrice;
                
                return (
                   <div 
                     key={product.id} 
                     className="relative group transform active:scale-95 transition-transform duration-200"
                   >
                     <div 
                       onClick={() => !hasVariants && addToCart(product)}
                       className={`relative w-full rounded-[16px] p-2.5 flex flex-col justify-between transition-all hover:brightness-110 shadow-md overflow-hidden border border-black/5 ${hasVariants ? 'cursor-default' : 'cursor-pointer'}`}
                       style={{ backgroundColor: palette.bg, aspectRatio: '1/1' }}
                     >
                       <div className="flex justify-between items-start">
                          <span className="text-[8px] font-black uppercase opacity-40" style={{ color: palette.textSub }}>
                             {product.hsnCode || '2106'}
                          </span>
                          <div className="text-right">
                             <span className="block text-[6px] font-black uppercase opacity-30 leading-none mb-0.5" style={{ color: palette.textSub }}>Price</span>
                             <span className="text-[12px] font-black leading-none" style={{ color: palette.textSub }}>₹{product.sellingPrice}</span>
                          </div>
                       </div>

                       <div className="flex-1 flex items-center py-1">
                          <h3 className="text-[11px] font-black uppercase tracking-tighter leading-[1.1] line-clamp-3 w-full text-left" style={{ color: palette.text }}>
                             {product.name}
                          </h3>
                       </div>

                       {!hasVariants ? (
                         <div className="flex justify-between items-end border-t border-black/5 pt-1.5 mt-auto">
                            <div className="text-left space-y-0">
                               <span className="block text-[8px] font-black uppercase opacity-50 leading-none" style={{ color: palette.textSub }}>
                                  {categoryMap[product.categoryId] || 'Menu'}
                               </span>
                               <span className="block text-[6px] font-bold opacity-30 uppercase leading-none" style={{ color: palette.textSub }}>GST 5%</span>
                            </div>
                            
                            <div className="flex items-center">
                               {inCart ? (
                                  <div className="w-5 h-5 rounded-lg bg-black/10 flex items-center justify-center font-black text-[10px]" style={{ color: palette.text }}>
                                     {inCart.quantity}
                                  </div>
                               ) : (
                                  <div className={`w-2 h-2 rounded-full ${product.productType === 'NON_VEG' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                               )}
                            </div>
                         </div>
                       ) : (
                         <div className="absolute inset-x-0 bottom-0 flex flex-col z-10">
                            {/* Show 'Full' button ONLY if there are no variants OR if halfPrice exists without variants */}
                            {(!product.variants || product.variants.length === 0) && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); addToCart(product, 'Full', product.sellingPrice); }}
                                className="w-full py-3 bg-orange-600 text-white font-black text-[10px] uppercase tracking-widest hover:bg-orange-500 active:bg-orange-700 transition-colors border-t border-white/10"
                              >
                                Full Price
                              </button>
                            )}
                            
                            {/* Variants Grid - 2 per row */}
                            <div className="grid grid-cols-2 w-full border-t border-white/10">
                               {product.variants?.map((v: any, vIdx: number) => (
                                 <button 
                                   key={v.id}
                                   onClick={(e) => { e.stopPropagation(); addToCart(product, v.name, v.price); }}
                                   className={`py-2.5 bg-rose-600 text-white font-black text-[9px] uppercase tracking-widest hover:bg-rose-500 active:bg-rose-700 transition-colors ${vIdx % 2 === 0 ? 'border-r border-white/10' : ''} border-b border-white/5`}
                                 >
                                   {v.name}
                                 </button>
                               ))}
                               {product.halfPrice && (
                                 <button 
                                   onClick={(e) => { e.stopPropagation(); addToCart(product, 'Half', product.halfPrice!); }}
                                   className={`py-2.5 bg-amber-500 text-white font-black text-[9px] uppercase tracking-widest hover:bg-amber-400 active:bg-amber-700 transition-colors ${(product.variants?.length || 0) % 2 === 0 ? 'col-span-2' : ''} border-b border-white/5`}
                                 >
                                   Half
                                 </button>
                               )}
                            </div>
                         </div>
                       )}

                       {!hasVariants && inCart && (
                         <div className="absolute top-0 right-0 w-1.5 h-full bg-black/20" />
                       )}
                     </div>
                    </div>
                );
              })}
            </div>
         </div>

        {/* Right Side: Order Tray (Billing Style) */}
        <aside className="w-[380px] shrink-0 border-l border-white/5 bg-slate-900/30 flex flex-col overflow-hidden">
           {/* Tray Header */}
           <div className="p-6 border-b border-white/5 space-y-4">
              <div className="flex items-start justify-between">
                 <div>
                    <h2 className="text-xl font-black uppercase tracking-tighter mb-0.5">Order <span className="text-indigo-500">Details</span></h2>
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                       {tablet.mode === 'WAITER' ? 'WAITER SERVICE' : 'COUNTER SERVICE'} • {tables.find(t => t.id === selectedTableId)?.name || 'STATION'}
                    </p>
                 </div>
                 <div className="flex items-center bg-white/5 rounded-2xl p-1.5 border border-white/5">
                    <button onClick={() => setPax(Math.max(1, pax - 1))} className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all text-slate-400 hover:text-white"><Minus size={14} /></button>
                    <div className="px-3 flex flex-col items-center">
                       <span className="text-xs font-black leading-none">{pax}</span>
                       <span className="text-[6px] font-black text-slate-500 uppercase">Pax</span>
                    </div>
                    <button onClick={() => setPax(pax + 1)} className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all text-slate-400 hover:text-white"><Plus size={14} /></button>
                 </div>
              </div>

              {/* Customer/Driver Selection */}
              <div className="space-y-3">
                 {!(selectedCustomer || selectedDriver) ? (
                    <>
                       <div className="flex items-center gap-2">
                          <button 
                            onClick={() => setSearchMode('CUSTOMER')}
                            className={`flex-1 h-9 rounded-xl flex items-center justify-center gap-2 transition-all border ${searchMode === 'CUSTOMER' ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 shadow-sm' : 'bg-white/5 border-white/10 text-slate-500'}`}
                          >
                             <User size={13} />
                             <span className="text-[9px] font-black uppercase tracking-widest">Customer</span>
                          </button>
                          <button 
                            onClick={() => setSearchMode('DRIVER')}
                            className={`flex-1 h-9 rounded-xl flex items-center justify-center gap-2 transition-all border ${searchMode === 'DRIVER' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-sm' : 'bg-white/5 border-white/10 text-slate-500'}`}
                          >
                             <CarFront size={13} />
                             <span className="text-[9px] font-black uppercase tracking-widest">Driver</span>
                          </button>
                       </div>

                       {searchMode && (
                          <div className="relative animate-in slide-in-from-top-2 duration-300">
                             <div className="relative group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={13} />
                                <input 
                                  type="text"
                                  placeholder={searchMode === 'CUSTOMER' ? "Search guest..." : "Search driver..."}
                                  value={searchMode === 'CUSTOMER' ? customerSearch : driverSearch}
                                  onChange={(e) => searchMode === 'CUSTOMER' ? setCustomerSearch(e.target.value) : setDriverSearch(e.target.value)}
                                  className="w-full h-9 bg-white/5 border border-white/10 rounded-xl pl-9 pr-9 text-[9px] font-bold text-white placeholder:text-slate-500 outline-none focus:border-indigo-500/50 transition-all"
                                  autoFocus
                                />
                                {searchMode === 'CUSTOMER' && (
                                   <button onClick={() => setIsCustomerModalOpen(true)} className="absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 bg-indigo-500/20 text-indigo-400 rounded-lg flex items-center justify-center hover:bg-indigo-500/30 transition-all">
                                      <UserPlus size={12} />
                                   </button>
                                )}
                             </div>

                             {/* Search Results Dropdown */}
                             {(searchMode === 'CUSTOMER' ? customerSearch : driverSearch) && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-white/10 rounded-xl shadow-2xl z-[100] overflow-hidden max-h-40 overflow-y-auto no-scrollbar">
                                   {searchMode === 'CUSTOMER' ? (
                                      customers.filter(c => 
                                        c.firstName.toLowerCase().includes(customerSearch.toLowerCase()) || 
                                        c.lastName?.toLowerCase().includes(customerSearch.toLowerCase()) ||
                                        c.mobile?.includes(customerSearch)
                                      ).map(c => (
                                         <button key={c.id} onClick={() => { setSelectedCustomer(c); setCustomerSearch(''); setSearchMode(null); }} className="w-full px-3 py-2 flex flex-col items-start hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 text-left">
                                            <span className="text-[9px] font-bold text-white">{c.firstName} {c.lastName}</span>
                                            <span className="text-[7px] text-slate-500 uppercase font-black">{c.mobile || 'No Mobile'}</span>
                                         </button>
                                      ))
                                   ) : (
                                      drivers.filter(d => 
                                        d.name.toLowerCase().includes(driverSearch.toLowerCase()) ||
                                        d.phone?.includes(driverSearch)
                                      ).map(d => (
                                         <button key={d.id} onClick={() => { setSelectedDriver(d); setDriverSearch(''); setSearchMode(null); }} className="w-full px-3 py-2 flex flex-col items-start hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 text-left">
                                            <span className="text-[9px] font-bold text-white">{d.name}</span>
                                            <span className="text-[7px] text-slate-500 uppercase font-black">{d.phone || 'No Phone'}</span>
                                         </button>
                                      ))
                                   )}
                                </div>
                             )}
                          </div>
                       )}
                    </>
                 ) : (
                    /* Selected Entity Indicator */
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-3 flex items-center justify-between group">
                       <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${selectedCustomer ? 'bg-indigo-500/20 text-indigo-400' : 'bg-amber-500/20 text-amber-400'}`}>
                             {selectedCustomer ? <User size={18} /> : <CarFront size={18} />}
                          </div>
                          <div>
                             <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-0.5">{selectedCustomer ? 'Selected Guest' : 'Assigned Driver'}</p>
                             <p className="text-[10px] font-black text-white uppercase">{selectedCustomer ? `${selectedCustomer.firstName} ${selectedCustomer.lastName || ''}` : selectedDriver.name}</p>
                          </div>
                       </div>
                       <button 
                         onClick={() => { setSelectedCustomer(null); setSelectedDriver(null); }}
                         className="h-8 px-3 bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 text-slate-500 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all"
                       >
                          Change
                       </button>
                    </div>
                 )}
              </div>
           </div>

           {/* Tray Items List */}
           <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
              {cart.length === 0 && (!activeOrder || !activeOrder.items || activeOrder.items.length === 0) ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-20 py-20">
                   <ShoppingCart size={48} strokeWidth={1} className="mb-4" />
                   <p className="text-[10px] font-black uppercase tracking-[0.3em]">Tray is Empty</p>
                </div>
              ) : (
                 <>
                  {cart.map(item => (
                   <div key={(item as any).cartItemId || item.id} className="bg-slate-800/40 rounded-2xl p-3 flex flex-col gap-3 animate-in slide-in-from-right-2 duration-300 border border-white/5">
                      <div className="flex gap-4">
                         <div className="w-11 h-11 bg-white/5 rounded-xl flex items-center justify-center shrink-0 border border-white/5 shadow-inner">
                            {item.image ? (
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-xl" />
                            ) : (
                              <Utensils size={24} className="text-slate-600" />
                            )}
                         </div>
                         <div className="flex-1 min-w-0">
                            <h4 className="text-[10px] font-black uppercase tracking-tight text-white/90 truncate">{item.name}</h4>
                            <div className="flex items-center justify-between mt-2">
                               <div className="flex flex-col">
                                  <span className="text-[11px] font-black text-indigo-400">₹{item.sellingPrice * item.quantity}</span>
                                  <span className="text-[7px] font-bold text-slate-500 uppercase">₹{item.sellingPrice} / unit</span>
                               </div>
                               <div className="flex items-center gap-3 bg-black/20 p-1 rounded-lg border border-white/5">
                                  <button onClick={() => updateQuantity((item as any).cartItemId || item.id, -1)} className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center hover:bg-rose-500/20 hover:text-rose-400 transition-all"><Minus size={12} /></button>
                                  <span className="text-xs font-black w-4 text-center">{item.quantity}</span>
                                  <button onClick={() => updateQuantity((item as any).cartItemId || item.id, 1)} className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center hover:bg-indigo-500/20 hover:text-indigo-400 transition-all"><Plus size={12} /></button>
                               </div>
                            </div>
                         </div>
                      </div>

                      {/* Quick Variant Switch in Tray */}
                      {((item.variants && item.variants.length > 0) || item.halfPrice) && (
                         <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                            {item.variants?.map((v: any) => (
                               <button 
                                 key={v.id}
                                 onClick={() => {
                                    removeFromCart((item as any).cartItemId);
                                    addToCart(item, v.name, v.price);
                                 }}
                                 className={`py-1.5 rounded-lg font-black text-[7px] uppercase tracking-widest transition-all border ${ (item as any).size === v.name ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20' : 'bg-white/5 border-white/10 text-slate-500 hover:bg-white/10' }`}
                               >
                                  {v.name}
                               </button>
                            ))}
                            {item.halfPrice && (
                               <button 
                                 onClick={() => {
                                    removeFromCart((item as any).cartItemId);
                                    addToCart(item, 'Half', item.halfPrice!);
                                 }}
                                 className={`py-1.5 rounded-lg font-black text-[7px] uppercase tracking-widest transition-all border ${ (item as any).size === 'Half' ? 'bg-amber-600 border-amber-500 text-white shadow-lg shadow-amber-600/20' : 'bg-white/5 border-white/10 text-slate-500 hover:bg-white/10' }`}
                               >
                                  Half
                               </button>
                            )}
                         </div>
                      )}
                   </div>
                 ))}
                 </>
              )}
           </div>

           {/* Active Order Items (Already Sent) */}
           {activeOrder && activeOrder.items && activeOrder.items.length > 0 && (
              <div className="px-4 pb-4 space-y-3 max-h-[300px] overflow-y-auto no-scrollbar border-t border-white/5 pt-4">
                 <div className="flex items-center gap-2 mb-2 opacity-50">
                    <div className="h-px flex-1 bg-white/10" />
                    <span className="text-[7px] font-black uppercase tracking-[0.2em]">Already Ordered</span>
                    <div className="h-px flex-1 bg-white/10" />
                 </div>
                 {activeOrder.items.map((item: any) => (
                   <div key={item.id} className="bg-white/5 rounded-2xl p-3 flex items-center gap-4 border border-white/5 opacity-60">
                      <div className="w-9 h-9 bg-white/5 rounded-lg flex items-center justify-center shrink-0">
                         <CheckCircle size={16} className="text-emerald-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                         <h4 className="text-[9px] font-black uppercase tracking-tight text-white/80 truncate">{item.product?.name || 'Item'}</h4>
                         <p className="text-[8px] font-bold text-slate-500 mt-0.5">{item.quantity} x ₹{item.unitPrice}</p>
                      </div>
                      <div className="text-right flex flex-col items-end">
                         <span className="text-[9px] font-black text-emerald-400">ORDERED</span>
                         <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest mt-0.5">KITCHEN</span>
                      </div>
                   </div>
                 ))}
              </div>
           )}

            {/* Totals & Actions */}
            <div className="p-4 bg-slate-900 border-t border-white/10 space-y-3">
                <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                       <span>Subtotal</span>
                       <span>₹{cartSubtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                       <span>Estimated Tax (5%)</span>
                       <span>₹{cartTax.toFixed(2)}</span>
                    </div>

                   <div className="pt-1.5 border-t border-white/5 space-y-2">
                      <div className="flex items-center justify-between">
                         <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400">Discount</span>
                         <div className="flex bg-black/20 rounded-lg p-0.5 border border-white/5">
                            <button onClick={() => setDiscountType('FLAT')} className={`px-2 py-0.5 text-[7px] font-black rounded ${discountType === 'FLAT' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>₹</button>
                            <button onClick={() => setDiscountType('PERCENT')} className={`px-2 py-0.5 text-[7px] font-black rounded ${discountType === 'PERCENT' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>%</button>
                         </div>
                      </div>
                      <div className="relative">
                         <input 
                            type="number"
                            value={discountAmount || ''}
                            onChange={(e) => setDiscountAmount(Number(e.target.value))}
                            placeholder="0.00"
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] font-black outline-none focus:border-indigo-500/50"
                         />
                         <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-500">{discountType === 'PERCENT' ? '%' : '₹'}</span>
                      </div>
                   </div>

                   <div className="pt-3 border-t border-white/5 flex justify-between items-end">
                      <div className="flex flex-col">
                         <span className="text-[8px] font-black text-indigo-400 uppercase tracking-[0.3em]">Total Amount</span>
                         <span className="text-2xl font-black tracking-tighter text-white">
                            ₹{cartTotal.toFixed(2)}
                         </span>
                      </div>
                      {cart.length > 0 && (
                        <button 
                          onClick={() => { setCart([]); setDiscountAmount(0); }}
                          className="text-[7px] font-black text-rose-500 uppercase tracking-widest hover:underline mb-1"
                        >
                          Clear Tray
                        </button>
                      )}
                   </div>
                </div>

               {/* Payment Mode Selector */}
               <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => setPaymentMode('CASH')}
                    className={`h-9 rounded-xl flex items-center justify-center gap-2 border transition-all ${paymentMode === 'CASH' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-sm' : 'bg-white/5 border-white/10 text-slate-500'}`}
                  >
                     <ReceiptIndianRupee size={12} />
                     <span className="text-[9px] font-black uppercase tracking-widest">Cash</span>
                  </button>
                  <button 
                    onClick={() => setPaymentMode('UPI')}
                    className={`h-9 rounded-xl flex items-center justify-center gap-2 border transition-all ${paymentMode === 'UPI' ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 shadow-sm' : 'bg-white/5 border-white/10 text-slate-500'}`}
                  >
                     <Zap size={12} />
                     <span className="text-[9px] font-black uppercase tracking-widest">UPI QR</span>
                  </button>
               </div>

               <div className="grid grid-cols-2 gap-2.5">
                  <button className="py-2.5 bg-slate-800 rounded-xl font-black text-[8px] uppercase tracking-widest hover:bg-slate-700 transition-all border border-white/5 text-slate-400">
                     Save Draft
                  </button>
                  <button 
                    disabled={isPlacingOrder || (cart.length === 0 && !activeOrder)}
                    onClick={() => paymentMode === 'UPI' ? setIsPaymentModalOpen(true) : handlePlaceOrder()}
                    className="py-2.5 bg-indigo-600 rounded-xl font-black text-[8px] uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                     {isPlacingOrder ? 'Processing...' : 
                        (paymentMode === 'UPI' ? 
                          (cart.length > 0 ? 'Pay & Order' : 'Pay for Current Order') : 
                          (cart.length > 0 ? 'Confirm Order' : 'Order Placed')
                        )
                      }
                  </button>
               </div>

           </div>
        </aside>
      </div>

      {/* Payment Modal Overlay */}
      <AnimatePresence>
        {isPaymentModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl"
          >
             <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-md bg-slate-900 rounded-[40px] border border-white/10 shadow-3xl overflow-hidden"
             >
                <div className="p-8 border-b border-white/5 flex items-center justify-between bg-indigo-600/10">
                   <div>
                      <h2 className="text-2xl font-black uppercase tracking-tight">Scan to <span className="text-indigo-400">Pay</span></h2>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Dynamic UPI Generator</p>
                   </div>
                   <button onClick={() => setIsPaymentModalOpen(false)} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-rose-500/20 hover:text-rose-400 transition-all">
                      <X size={20} />
                   </button>
                </div>

                <div className="p-8 flex flex-col items-center gap-6">
                   {/* QR Code Container */}
                   <div className="relative p-6 bg-white rounded-[32px] shadow-2xl">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`upi://pay?pa=${property?.upiId || '7296969566@ybl'}&pn=${encodeURIComponent(property?.upiName || property?.brandName || 'OrderMint')}&am=${(cartTotal * 1.05 - (discountType === 'PERCENT' ? (cartTotal * discountAmount / 100) : discountAmount)).toFixed(2)}&cu=INR`)}`}
                        alt="Payment QR"
                        className="w-48 h-48"
                      />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
                         <Zap size={60} className="text-indigo-600" />
                      </div>
                   </div>

                   <div className="text-center">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total to Pay</span>
                      <p className="text-4xl font-black text-white">₹{(cartTotal * 1.05 - (discountType === 'PERCENT' ? (cartTotal * discountAmount / 100) : discountAmount)).toFixed(2)}</p>
                   </div>

                   <div className="w-full space-y-4">
                      <div className="space-y-2">
                         <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest ml-1">Last 4 Digits of Transaction</label>
                         <input 
                            type="text"
                            maxLength={4}
                            value={transactionLast4}
                            onChange={(e) => setTransactionLast4(e.target.value.replace(/[^0-9]/g, ''))}
                            placeholder="Ex: 5821"
                            className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-xl font-black tracking-[0.5em] text-center outline-none focus:border-indigo-500/50"
                         />
                      </div>

                      <button 
                        disabled={transactionLast4.length !== 4 || isProcessingPayment}
                        onClick={async () => {
                          setIsProcessingPayment(true);
                          // Here we would call handlePlaceOrder with payment metadata
                          // For now we just call it and it will handle the creation
                          await handlePlaceOrder();
                          setIsProcessingPayment(false);
                          setIsPaymentModalOpen(false);
                          setIsWaitingApproval(true);
                          setTransactionLast4('');
                        }}
                        className="w-full h-14 bg-indigo-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                      >
                         {isProcessingPayment ? 'Validating...' : 'Confirm & Place Order'}
                         <ChevronRight size={18} />
                      </button>
                      <p className="text-[8px] text-center text-slate-500 font-bold uppercase tracking-widest">Payment will be sent to admin for approval</p>
                   </div>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Waiting for Approval Status Popup */}
      <AnimatePresence>
        {isWaitingApproval && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[120] w-full max-w-sm"
          >
             <div className="bg-slate-900 border border-indigo-500/30 rounded-[32px] p-6 shadow-3xl shadow-indigo-500/20 backdrop-blur-xl flex items-center gap-5">
                <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center relative">
                   <div className="absolute inset-0 bg-indigo-500/20 rounded-2xl animate-ping" />
                   <Clock className="text-indigo-400 relative z-10" size={24} />
                </div>
                <div className="flex-1">
                   <h3 className="text-xs font-black uppercase tracking-widest text-white">Sent for Approval</h3>
                   <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                      Wait for counter verification.
                   </p>
                </div>
                <button 
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="h-10 px-4 bg-indigo-500/20 text-indigo-400 rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-indigo-500/30 transition-all border border-indigo-500/10"
                 >
                   Show QR
                 </button>
                <button 
                  onClick={() => setIsWaitingApproval(false)}
                  className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-rose-500/20 hover:text-rose-400 transition-all"
                >
                   <X size={18} />
                </button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <Modal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        title="New Guest Registration"
      >
        <div className="p-6">
          <CustomerForm
            onSubmit={async (data) => {
              try {
                const res = await fetch('/api/customers', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(data),
                });
                const result = await res.json();
                if (result.success) {
                  const newCustomer = result.data;
                  setCustomers(prev => [...prev, newCustomer]);
                  setSelectedCustomer(newCustomer);
                  setIsCustomerModalOpen(false);
                  addToast('success', 'Customer registered successfully');
                } else {
                  addToast('error', result.message || 'Failed to register customer');
                }
              } catch (e) {
                addToast('error', 'Network error while registering customer');
              }
            }}
            onCancel={() => setIsCustomerModalOpen(false)}
          />
        </div>
      </Modal>
    </div>
  );
}
