'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  ShoppingCart,
  AlertCircle,
  Store,
  Star,
  ArrowRight,
  Package,
  X,
  Plus,
  Minus,
  ChevronRight,
  ClipboardList,
  CheckCircle2,
  Zap
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { toast } from 'sonner';

export default function B2BMarketPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [session, setSession] = useState<any>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isListOpen, setIsListOpen] = useState(false);

  const categories = ['All', 'Vegetables', 'Dairy', 'Meat', 'Grocery', 'Poultry'];

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const sessionRes = await fetch('/api/auth/session');
      const sessionData = await sessionRes.json();
      if (sessionData.authenticated) {
        setSession(sessionData.user);
        fetchLowStock(sessionData.user.propertyId);
      }
      fetchSuppliers();
    } catch (error) {
      console.error('Error in initial fetch:', error);
    }
  };

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/b2b/suppliers');
      const data = await res.json();
      setSuppliers(data);
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  const fetchLowStock = async (propertyId: string) => {
    try {
      const res = await fetch(`/api/inventory/stock-items?lowStock=true`);
      const data = await res.json();
      setLowStockItems(data.data || []);
    } catch (error) {
      console.error('Low stock error:', error);
    }
  };

  const fetchSupplierProducts = async (supplierId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/b2b/products?supplierId=${supplierId}`);
      const data = await res.json();
      setProducts(data);
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      toast.success(`Added ${product.name}`);
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const placeOrder = async () => {
    if (cart.length === 0 || !session?.propertyId) return;
    try {
      const res = await fetch('/api/b2b/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: session.propertyId,
          supplierId: selectedSupplier.id,
          items: cart.map(item => ({
            productId: item.id,
            quantity: item.quantity,
            unitPrice: item.price
          })),
          totalAmount
        })
      });
      if (res.ok) {
        toast.success('Order placed successfully!');
        setCart([]);
        setIsCartOpen(false);
        setSelectedSupplier(null);
      }
    } catch (error) {
      toast.error('Failed to place order');
    }
  };

  const filteredSuppliers = suppliers.filter(s => 
    (activeCategory === 'All' || s.category === activeCategory) &&
    (s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     s.category?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 lg:p-8">
      {/* Header & Filters */}
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Marketplace</h1>
            <p className="text-slate-500 text-[11px] font-bold uppercase tracking-[0.2em] opacity-80">Sourcing & Inventory Hub</p>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                   type="text" placeholder="Search..." 
                   className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none focus:ring-2 focus:ring-pos-primary/20 transition-all text-sm font-medium"
                   value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                />
             </div>
             
             <Button 
                variant="outline" 
                onClick={() => setIsListOpen(true)}
                className="h-11 px-5 border-amber-200 bg-amber-50 dark:bg-amber-950/20 text-amber-600 rounded-xl relative"
             >
                <ClipboardList size={20} className="mr-2" />
                <span className="font-bold">Restock List</span>
                {lowStockItems.length > 0 && (
                   <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-slate-950">
                      {lowStockItems.length}
                   </span>
                )}
             </Button>

             <Button onClick={() => setIsCartOpen(true)} className="relative h-11 px-6 bg-pos-primary hover:bg-pos-primary/90 rounded-xl shadow-lg shadow-pos-primary/20">
                <ShoppingCart size={20} className="mr-2" />
                <span className="font-bold">₹{totalAmount.toFixed(0)}</span>
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-slate-950">
                    {cart.length}
                  </span>
                )}
             </Button>
          </div>
        </div>

        {/* Categories Horizontal */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
           {categories.map(cat => (
              <button
                 key={cat} onClick={() => setActiveCategory(cat)}
                 className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                    activeCategory === cat 
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md' 
                    : 'bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                 }`}
              >
                 {cat}
              </button>
           ))}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
           <AnimatePresence mode="popLayout">
              {!selectedSupplier ? (
                 filteredSuppliers.map((supplier) => (
                    <motion.div
                       key={supplier.id}
                       layout
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       exit={{ opacity: 0, scale: 0.95 }}
                    >
                       <Card 
                          onClick={() => { setSelectedSupplier(supplier); fetchSupplierProducts(supplier.id); }}
                          className="p-6 cursor-pointer border-none shadow-sm hover:shadow-xl transition-all rounded-3xl bg-white dark:bg-slate-900 group"
                       >
                          <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-pos-primary/10 group-hover:text-pos-primary transition-all mb-4">
                             <Store size={28} />
                          </div>
                          <Badge className="bg-emerald-50 dark:bg-emerald-950 text-emerald-600 border-none px-2.5 py-1 h-5 rounded-full text-[8px] font-black uppercase tracking-widest mb-2.5">
                             {supplier.category}
                          </Badge>
                          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">{supplier.name}</h3>
                          <p className="text-[11px] text-slate-500 font-medium line-clamp-1">{supplier.address}</p>
                          
                          <div className="mt-6 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
                             <span className="flex items-center gap-1"><Star size={12} className="text-amber-500 fill-amber-500" /> 4.9</span>
                             <div className="flex items-center gap-1 group-hover:text-pos-primary transition-colors">
                                View Products <ChevronRight size={14} />
                             </div>
                          </div>
                       </Card>
                    </motion.div>
                 ))
              ) : (
                 <div className="col-span-full space-y-6">
                    <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm">
                       <div className="flex items-center gap-4">
                          <Button variant="ghost" onClick={() => { setSelectedSupplier(null); setProducts([]); }} className="h-10 w-10 p-0 rounded-full bg-slate-50 dark:bg-slate-800">
                             <X size={20} />
                          </Button>
                          <div>
                             <h2 className="text-xl font-black uppercase tracking-tight">{selectedSupplier.name}</h2>
                             <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Premium Partner Supplier</p>
                          </div>
                       </div>
                       <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-600 border-none px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">
                          Min. Order ₹500
                       </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                       {products.map(product => (
                          <motion.div key={product.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                             <Card className="flex flex-col h-full rounded-3xl bg-white dark:bg-slate-900 border-none shadow-sm hover:shadow-lg transition-all overflow-hidden group">
                                <div className="aspect-square bg-slate-50 dark:bg-slate-800 flex items-center justify-center relative overflow-hidden">
                                   {product.image ? (
                                      <img src={product.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                   ) : (
                                      <Package size={40} className="text-slate-200" />
                                   )}
                                   <div className="absolute inset-0 bg-pos-primary/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                      <Button onClick={() => addToCart(product)} className="bg-white text-pos-primary hover:bg-slate-50 px-6 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl">
                                         Quick Add
                                      </Button>
                                   </div>
                                </div>
                                <div className="p-5 flex-1 flex flex-col">
                                   <div className="flex items-center justify-between mb-2">
                                      <Badge className="bg-slate-50 dark:bg-slate-800 text-slate-500 border-none text-[8px] font-black uppercase tracking-widest px-2 h-5">
                                         {product.category || 'General'}
                                      </Badge>
                                      <span className="text-lg font-black text-emerald-600">₹{product.price}</span>
                                   </div>
                                   <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 uppercase tracking-tight mb-4">{product.name}</h4>
                                   
                                   <div className="mt-auto flex items-center gap-2">
                                      <Button onClick={() => addToCart(product)} className="flex-1 bg-slate-900 dark:bg-slate-800 hover:bg-pos-primary text-white h-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                                         Add to Cart
                                      </Button>
                                   </div>
                                </div>
                             </Card>
                          </motion.div>
                       ))}
                    </div>
                 </div>
              )}
           </AnimatePresence>
        </div>
      </div>

      {/* RESTOCK LIST MODAL */}
      <AnimatePresence>
         {isListOpen && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
               <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
                  onClick={() => setIsListOpen(false)}
               />
               <motion.div 
                  initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
                  className="relative w-full max-w-2xl bg-white dark:bg-slate-950 rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
               >
                  <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-amber-50/50 dark:bg-amber-950/10">
                     <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/20">
                           <ClipboardList size={28} />
                        </div>
                        <div>
                           <h2 className="text-2xl font-black uppercase tracking-tight">Needs Ordering</h2>
                           <p className="text-xs font-bold text-amber-600 uppercase tracking-[0.2em]">Inventory items below minimum stock level</p>
                        </div>
                     </div>
                     <Button variant="ghost" onClick={() => setIsListOpen(false)} className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:bg-slate-200 dark:hover:bg-slate-800"><X size={24} /></Button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-8 space-y-4 no-scrollbar">
                     {lowStockItems.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-30 py-20">
                           <CheckCircle2 size={64} className="mb-4 text-emerald-500" />
                           <p className="text-sm font-black uppercase tracking-widest">Inventory is all good!</p>
                        </div>
                     ) : (
                        lowStockItems.map((item: any) => (
                           <div key={item.id} className="flex items-center gap-6 p-5 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 group hover:border-amber-200 transition-all">
                              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center shrink-0">
                                 <AlertCircle size={24} />
                              </div>
                              <div className="flex-1">
                                 <h4 className="text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white mb-1">{item.name}</h4>
                                 <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Current: <b className="text-rose-500">{item.currentStock}</b></span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Min: <b>{item.minStock}</b></span>
                                 </div>
                              </div>
                              <Button 
                                 onClick={() => {
                                    setSearchQuery(item.name);
                                    setIsListOpen(false);
                                    toast.info(`Searching for ${item.name}...`);
                                 }}
                                 className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 hover:bg-pos-primary hover:text-white hover:border-pos-primary h-11 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm transition-all"
                              >
                                 Find Supplier <ArrowRight size={14} className="ml-2" />
                              </Button>
                           </div>
                        ))
                     )}
                  </div>
                  
                  <div className="p-8 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
                     <p className="text-[10px] text-center font-bold text-slate-400 uppercase tracking-[0.2em]">Items are automatically added here based on your inventory levels.</p>
                  </div>
               </motion.div>
            </div>
         )}
      </AnimatePresence>

      {/* Cart Sidebar Modal */}
      <AnimatePresence>
        {isCartOpen && (
           <div className="fixed inset-0 z-[120] flex justify-end">
              <motion.div 
                 initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                 className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
                 onClick={() => setIsCartOpen(false)}
              />
              <motion.div 
                 initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                 className="relative w-full max-w-md bg-white dark:bg-slate-950 h-full shadow-2xl flex flex-col p-6 lg:p-8"
              >
                 <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                       <div className="w-12 h-12 rounded-2xl bg-pos-primary/10 text-pos-primary flex items-center justify-center"><ShoppingCart size={24} /></div>
                       <h2 className="text-2xl font-black uppercase tracking-tight">Your Cart</h2>
                    </div>
                    <Button variant="ghost" onClick={() => setIsCartOpen(false)} className="h-10 w-10 p-0 rounded-full bg-slate-50 dark:bg-slate-800"><X size={24} /></Button>
                 </div>

                 <div className="flex-1 overflow-y-auto no-scrollbar space-y-6">
                    {cart.length === 0 ? (
                       <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                          <Package size={64} className="mb-4" />
                          <p className="text-sm font-black uppercase tracking-widest">Cart is empty</p>
                       </div>
                    ) : (
                       cart.map(item => (
                          <div key={item.id} className="flex items-center gap-4 p-4 rounded-3xl bg-slate-50 dark:bg-slate-900 shadow-sm group">
                             <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 overflow-hidden shrink-0 shadow-sm">
                                {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <Package size={24} className="w-full h-full p-5 text-slate-300" />}
                             </div>
                             <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate uppercase mb-1">{item.name}</h4>
                                <p className="text-xs font-black text-emerald-600">₹{item.price}</p>
                             </div>
                             <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-pos-primary transition-colors bg-slate-50 dark:bg-slate-900 rounded-xl"><Minus size={16} /></button>
                                <span className="w-6 text-center text-xs font-black">{item.quantity}</span>
                                <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-pos-primary transition-colors bg-slate-50 dark:bg-slate-900 rounded-xl"><Plus size={16} /></button>
                             </div>
                          </div>
                       ))
                    )}
                 </div>

                 <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 space-y-4">
                    <div className="flex justify-between items-center px-2">
                       <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Grand Total</span>
                       <span className="text-3xl font-black text-slate-900 dark:text-white">₹{totalAmount.toFixed(2)}</span>
                    </div>
                    <Button onClick={placeOrder} disabled={cart.length === 0} className="w-full bg-pos-primary hover:bg-pos-primary/90 h-16 rounded-[24px] font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-pos-primary/20 transition-all">
                       Complete Order
                    </Button>
                 </div>
              </motion.div>
           </div>
        )}
      </AnimatePresence>
    </div>
  );
}
