'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Plus, 
  Search, 
  Trash2, 
  User as UserIcon, 
  CreditCard, 
  Percent, 
  Pause, 
  RotateCcw,
  Grid,
  List,
  ShoppingBag,
  Utensils,
  Minus,
  ChevronRight,
  Printer, 
  Save, 
  CheckCircle2,
  UserPlus
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { productsApi, Product } from '@/lib/api/products';
import { categoriesApi, Category } from '@/lib/api/categories';
import { ordersApi } from '@/lib/api/orders';
import { paymentModesApi, PaymentMode } from '@/lib/api/payment-modes';
import { customersApi, Customer } from '@/lib/api/customers';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { KotSlipModal } from '@/components/kots/KotSlipModal';
import { PrintBillModal } from '@/components/modals/print-bill-modal';
import { CustomerForm } from '@/components/forms/customer-form';
import { useToast } from '@/components/ui/Toast';

interface CartItem extends Product {
  quantity: number;
}

// Pastel colors for categories to match the reference image
const CATEGORY_COLORS: Record<number, string> = {
  0: 'bg-[#FFE4E6] text-rose-900', // Pink
  1: 'bg-[#F3E8FF] text-purple-900', // Purple
  2: 'bg-[#E0F2FE] text-sky-900', // Blue
  3: 'bg-[#DCFCE7] text-emerald-900', // Green
  4: 'bg-[#FEF9C3] text-amber-900', // Yellow
  5: 'bg-[#F1F5F9] text-slate-900', // Gray
};

export default function BillingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tableId = searchParams.get('tableId');
  const tableName = searchParams.get('tableName');

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentModes, setPaymentModes] = useState<PaymentMode[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [settleLoading, setSettleLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [isSettleOpen, setIsSettleOpen] = useState(false);
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<string>('');
  const [isKotOpen, setIsKotOpen] = useState(false);
  const [kotData, setKotData] = useState<any>(null);
  const [isBillOpen, setIsBillOpen] = useState(false);
  const [billData, setBillData] = useState<any>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedGuestId, setSelectedGuestId] = useState<string>('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerMutationLoading, setCustomerMutationLoading] = useState(false);

  const { addToast } = useToast();

  useEffect(() => {
    loadData();
    if (tableId) fetchActiveOrder();
  }, [tableId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pData, cData, pmData, custData] = await Promise.all([
        productsApi.getAll(),
        categoriesApi.getAll(),
        paymentModesApi.getAll(),
        customersApi.getAll()
      ]);
      setProducts(pData);
      setCategories(cData);
      setPaymentModes(pmData);
      setCustomers(custData);
    } catch (err) {
      addToast('Error loading POS data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveOrder = async () => {
    if (!tableId) return;
    try {
      const response = await fetch(`/api/pos-orders?restaurantTableId=${tableId}&status=in_progress`);
      const result = await response.json();
      if (result.success && result.data.length > 0) {
        const order = result.data[0];
        setActiveOrder(order);
        const orderItems = order.items.map((i: any) => ({
          ...i.product,
          quantity: i.quantity,
          sellingPrice: i.unitPrice
        }));
        setCart(orderItems);
      }
    } catch (err) {
      console.error('Failed to fetch active order:', err);
    }
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const handleSaveOrder = async () => {
    if (cart.length === 0) return;
    setSaveLoading(true);
    try {
      const payload = {
        restaurantTableId: tableId,
        items: cart.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          unitPrice: item.sellingPrice
        })),
        guestId: selectedGuestId || null
      };

      const response = await fetch('/api/pos-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (result.success) {
        addToast('Order saved successfully', 'success');
        setKotData(result.data);
        setIsKotOpen(true);
      }
    } catch (err) {
      addToast('Failed to save order', 'error');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleSettle = async () => {
    if (!selectedPaymentMode) return;
    setSettleLoading(true);
    try {
      const payload = {
        restaurantTableId: tableId,
        paymentModeId: selectedPaymentMode,
        guestId: selectedGuestId || null,
        items: cart.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          unitPrice: item.sellingPrice
        }))
      };

      const response = await fetch('/api/pos-orders/settle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (result.success) {
        addToast('Order settled successfully', 'success');
        setBillData(result.data);
        setIsBillOpen(true);
        setCart([]);
        setActiveOrder(null);
        setIsSettleOpen(false);
      }
    } catch (err) {
      addToast('Failed to settle order', 'error');
    } finally {
      setSettleLoading(false);
    }
  };

  const handlePrintBill = async () => {
    if (!activeOrder) return;
    setBillData(activeOrder);
    setIsBillOpen(true);
  };

  const handleCreateCustomer = async (data: any) => {
    setCustomerMutationLoading(true);
    try {
      const result = await customersApi.create(data);
      setCustomers(prev => [...prev, result]);
      setSelectedGuestId(result.id);
      setIsCustomerModalOpen(false);
      addToast('Customer added', 'success');
    } catch (err) {
      addToast('Failed to add customer', 'error');
    } finally {
      setCustomerMutationLoading(false);
    }
  };

  const handleMarkAsDue = async () => {
    if (!selectedGuestId || cart.length === 0) return;
    setSettleLoading(true);
    try {
      const payload = {
        restaurantTableId: tableId,
        guestId: selectedGuestId,
        items: cart.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          unitPrice: item.sellingPrice
        })),
        isDue: true
      };

      const response = await fetch('/api/pos-orders/settle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (result.success) {
        addToast('Order marked as Due successfully', 'success');
        setCart([]);
        setActiveOrder(null);
        setIsSettleOpen(false);
      }
    } catch (err) {
      addToast('Failed to mark as due', 'error');
    } finally {
      setSettleLoading(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const subtotal = cart.reduce((acc, item) => acc + (item.sellingPrice * item.quantity), 0);
  const tax = subtotal * 0.05;
  const grandTotal = subtotal + tax;

  if (loading) return <div className="h-screen bg-slate-950 flex items-center justify-center text-white">Loading POS...</div>;

  return (
    <div className="flex h-screen bg-[#111111] text-slate-200 overflow-hidden font-sans selection:bg-pos-primary/30">
      {/* LEFT SIDEBAR - Categories (Dark & Sleek) */}
      <div className="w-20 md:w-24 bg-[#1a1a1a] border-r border-white/5 flex flex-col items-center py-6 gap-6 z-20">
         <div className="w-12 h-12 bg-pos-primary/10 rounded-2xl flex items-center justify-center text-pos-primary mb-4">
            <ShoppingBag size={24} />
         </div>
         <nav className="flex flex-col gap-4 overflow-y-auto no-scrollbar pb-6 w-full px-2">
            <button 
              onClick={() => setSelectedCategory('all')}
              className={`w-full aspect-square rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all transition-all duration-300 ${selectedCategory === 'all' ? 'bg-pos-primary text-white shadow-lg shadow-pos-primary/20 scale-105' : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'}`}
            >
               <Grid size={20} />
               <span className="text-[10px] font-black uppercase tracking-tighter">All</span>
            </button>
            {categories.map((cat, idx) => (
               <button 
                 key={cat.id}
                 onClick={() => setSelectedCategory(cat.id)}
                 className={`w-full aspect-square rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all duration-300 ${selectedCategory === cat.id ? 'bg-pos-primary text-white shadow-lg shadow-pos-primary/20 scale-105' : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'}`}
               >
                  <Utensils size={20} />
                  <span className="text-[10px] font-black uppercase tracking-tighter truncate w-full text-center px-1">{cat.name}</span>
               </button>
            ))}
         </nav>
      </div>

      {/* CENTER - Product Grid (Premium Dark Theme) */}
      <div className="flex-1 flex flex-col h-full bg-[#111111] overflow-hidden">
        {/* Header/Search Bar */}
        <div className="p-6 pb-2 flex items-center justify-between gap-6">
           <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-pos-primary transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search menu items..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-white/5 focus:border-pos-primary/50 text-slate-200 pl-12 pr-6 py-4 rounded-[1.25rem] outline-none transition-all placeholder:text-slate-600 font-bold"
              />
           </div>
           <div className="flex items-center gap-3">
              <div className="bg-[#1a1a1a] py-1 px-1 rounded-2xl flex border border-white/5">
                 <button onClick={() => setViewMode('grid')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-pos-primary text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}><Grid size={20}/></button>
                 <button onClick={() => setViewMode('list')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-pos-primary text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}><List size={20}/></button>
              </div>
           </div>
        </div>

        {/* Category Pastel Tiles - Inspired by Reference Image */}
        <div className="px-6 py-4 overflow-x-auto no-scrollbar flex gap-4">
           {categories.slice(0, 6).map((cat, idx) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex-none min-w-[140px] p-5 rounded-[2rem] transition-all hover:scale-105 active:scale-95 ${CATEGORY_COLORS[idx % 6]} flex flex-col gap-3 shadow-xl ${selectedCategory === cat.id ? 'ring-4 ring-pos-primary/30 ring-offset-2 ring-offset-[#111111]' : ''}`}
              >
                 <div className="w-10 h-10 bg-white/40 rounded-xl flex items-center justify-center"><Utensils size={20}/></div>
                 <div>
                    <h3 className="font-black text-sm tracking-tight">{cat.name}</h3>
                    <p className="text-[10px] font-bold opacity-60">Items loading...</p>
                 </div>
              </button>
           ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 pt-2 scroll-smooth no-scrollbar">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
              {filteredProducts.map(product => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="group relative bg-[#1a1a1a] hover:bg-[#222222] border border-white/5 hover:border-pos-primary/30 rounded-[2.5rem] p-4 flex flex-col gap-4 transition-all duration-300 hover:-translate-y-2 active:scale-95 text-left overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-pos-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative aspect-square rounded-[1.5rem] overflow-hidden bg-slate-900 border border-white/5">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-700 bg-slate-900"><Utensils size={32} /></div>
                    )}
                    <div className="absolute top-2 right-2 bg-pos-primary shadow-lg text-white text-[10px] font-black px-2.5 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      ₹{product.sellingPrice}
                    </div>
                  </div>
                  <div className="space-y-1 relative">
                    <h3 className="font-black text-[13px] text-slate-100 group-hover:text-pos-primary transition-colors truncate">{product.name}</h3>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">₹ {product.sellingPrice.toFixed(2)}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredProducts.map(product => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="w-full bg-[#1a1a1a] hover:bg-[#222222] border border-white/5 p-4 rounded-2xl flex items-center gap-4 transition-all hover:scale-[1.01] active:scale-[0.99] text-left"
                >
                  <div className="w-16 h-16 rounded-xl bg-slate-900 overflow-hidden border border-white/5 flex-shrink-0">
                    {product.imageUrl ? <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" /> : <Utensils className="m-auto text-slate-700" />}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-100 text-sm">{product.name}</h3>
                    <p className="text-xs text-slate-500">{product.category?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-pos-primary text-lg">₹{product.sellingPrice.toFixed(2)}</p>
                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">In Stock</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SIDEBAR - Cart & Checkout (Dark/Sleek) */}
      <div className="w-[400px] bg-[#1a1a1a] border-l border-white/5 flex flex-col h-full shadow-2xl z-10 transition-all duration-300">
        {/* Cart Header */}
        <div className="p-6 pb-4 flex flex-col gap-4">
           <div className="flex items-center justify-between">
              <div>
                 <h2 className="text-xl font-black text-slate-100 tracking-tight">Order Details</h2>
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{tableName || 'Counter Service'}</p>
              </div>
              <button 
                onClick={() => setCart([])} 
                className="p-3 bg-white/5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all active:scale-95"
              >
                <Trash2 size={20} />
              </button>
           </div>
           
           <div className="flex items-center gap-3 bg-[#111111] p-2 rounded-2xl border border-white/5">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
                <input 
                  type="text" 
                  placeholder="Select customer..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="w-full bg-transparent text-[11px] font-bold text-slate-300 pl-9 pr-4 py-2 outline-none"
                />
              </div>
              <button 
                onClick={() => setIsCustomerModalOpen(true)}
                className="p-2 bg-pos-primary text-white rounded-xl shadow-lg shadow-pos-primary/20 hover:scale-105 active:scale-95 transition-all"
              >
                 <UserPlus size={16} />
              </button>
           </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto px-6 py-2 no-scrollbar">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-30 gap-4 mt-[-40px]">
              <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center"><ShoppingBag size={48}/></div>
              <p className="font-black text-xs uppercase tracking-[0.2em]">Cart is Empty</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map(item => (
                <div key={item.id} className="group bg-[#111111] rounded-3xl p-4 border border-white/5 hover:border-pos-primary/20 transition-all flex items-center justify-between gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-900 border border-white/5 overflow-hidden flex-shrink-0">
                     {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-700"><Utensils size={18} /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[12px] font-black text-slate-200 truncate">{item.name}</h4>
                    <span className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">₹{item.sellingPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center bg-[#1a1a1a] border border-white/5 rounded-xl p-1">
                      <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-pos-primary transition-colors"><Minus size={12}/></button>
                      <span className="px-3 text-[11px] font-black text-slate-200">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-pos-primary transition-colors"><Plus size={12}/></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Totals & Checkout Button */}
        <div className="p-8 bg-[#111111] border-t border-white/5 space-y-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center text-[11px] font-black text-slate-500 uppercase tracking-widest">
              <span>Sub-Total</span>
              <span className="text-slate-200">₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-[11px] font-black text-slate-500 uppercase tracking-widest">
              <span>Taxes (5%)</span>
              <span className="text-slate-200">₹{tax.toFixed(2)}</span>
            </div>
            <div className="h-px bg-white/5 my-2" />
            <div className="flex justify-between items-center pt-2">
              <div>
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Payable Amount</span>
                 <p className="text-3xl font-black text-pos-primary tracking-tighter">₹{grandTotal.toFixed(2)}</p>
              </div>
              <div className="relative">
                 <div className="absolute inset-0 bg-emerald-500/20 blur-xl animate-pulse" />
                 <ShoppingBag className="relative text-emerald-500" size={32} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button 
               onClick={handleSaveOrder}
               loading={saveLoading}
               disabled={cart.length === 0}
               className="py-5 rounded-3xl bg-[#1a1a1a] hover:bg-pos-primary text-slate-200 hover:text-white border border-white/10 font-black text-[10px] uppercase tracking-[0.2em] transition-all hover:shadow-2xl hover:shadow-pos-primary/20 active:scale-95"
            >
              <Save size={18} /> SAVE
            </Button>
            <Button 
               onClick={handlePrintBill}
               disabled={!activeOrder}
               className="py-5 rounded-3xl bg-orange-500/10 hover:bg-orange-500 text-orange-500 hover:text-white border border-orange-500/20 font-black text-[10px] uppercase tracking-[0.2em] transition-all active:scale-95"
            >
              <Printer size={18} /> BILL
            </Button>
            <Button 
               disabled={cart.length === 0}
               onClick={() => setIsSettleOpen(true)}
               className="col-span-2 py-6 bg-pos-primary hover:bg-pos-primary/90 text-white rounded-[2rem] flex items-center justify-center gap-3 font-black text-[11px] uppercase tracking-[0.3em] shadow-[0_20px_40px_-10px_rgba(244,63,94,0.3)] transition-all hover:-translate-y-1 active:scale-95"
            >
               <CreditCard size={20} /> SETTLE (F1)
            </Button>
          </div>
        </div>
      </div>

      {/* MODALS - DARK THEME */}
      {/* (Settlement Modal, Customer Modal etc. inherit dark theme from globals or need specific overrides) */}
      <Modal 
        isOpen={isSettleOpen} 
        onClose={() => setIsSettleOpen(false)} 
        title="Final Settlement"
      >
        <div className="space-y-6 p-2 bg-[#1a1a1a] rounded-3xl">
          <div className="grid grid-cols-2 gap-4">
             {paymentModes.map(mode => (
               <button
                 key={mode.id}
                 onClick={() => setSelectedPaymentMode(mode.id)}
                 className={`p-6 rounded-[2.5rem] border-2 transition-all flex flex-col items-center gap-3 ${
                   selectedPaymentMode === mode.id 
                    ? 'border-pos-primary bg-pos-primary/10 text-pos-primary shadow-2xl shadow-pos-primary/20' 
                    : 'border-white/5 hover:border-white/10 text-slate-500 bg-[#111111]'
                 }`}
               >
                 <div className={`p-4 rounded-2xl ${selectedPaymentMode === mode.id ? 'bg-pos-primary text-white' : 'bg-[#1a1a1a] text-slate-600'}`}>
                    <CreditCard size={28} />
                 </div>
                 <span className="text-[11px] font-black uppercase tracking-[0.2em]">{mode.name}</span>
               </button>
             ))}
          </div>

          <div className="bg-[#111111] p-10 rounded-[3rem] border border-white/5 relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-48 h-48 bg-pos-primary/20 rounded-full -mr-24 -mt-24 blur-[80px] group-hover:bg-pos-primary/30 transition-all duration-700" />
             <div className="relative z-10 flex justify-between items-center mb-6">
                <span className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">Items In Cart</span>
                <span className="text-slate-200 font-black text-lg">{cart.length}</span>
             </div>
             <div className="relative z-10 flex justify-between items-end pt-6 border-t border-white/10">
                <div>
                   <span className="text-pos-primary text-[10px] font-black uppercase tracking-[0.3em]">Total Payable</span>
                   <p className="text-5xl font-black text-white tracking-tighter mt-2">₹{grandTotal.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-black uppercase tracking-widest bg-emerald-400/10 px-4 py-2 rounded-full border border-emerald-400/20">
                   <div className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
                   Verified
                </div>
             </div>
          </div>

          <div className="flex gap-4">
             <Button 
                variant="secondary" 
                onClick={() => setIsSettleOpen(false)}
                className="flex-1 py-5 text-[11px] font-black uppercase tracking-widest bg-transparent border-2 border-white/5 text-slate-400 rounded-2xl hover:bg-white/5"
             >
                Cancel
             </Button>
             <Button
                loading={settleLoading}
                disabled={!selectedPaymentMode}
                onClick={handleSettle}
                className="flex-1 py-5 text-[11px] font-black uppercase tracking-widest bg-pos-primary hover:bg-pos-primary/90 text-white rounded-2xl shadow-2xl shadow-pos-primary/20"
             >
                Confirm (F2)
             </Button>
          </div>

          <button
            onClick={handleMarkAsDue}
            disabled={settleLoading || !selectedGuestId}
            className="w-full py-5 text-center text-orange-400 border border-orange-400/20 bg-orange-400/5 hover:bg-orange-400/10 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.25em] transition-all disabled:opacity-30 active:scale-[0.98]"
          >
            {selectedGuestId ? '💳 Mark as Due (Credit Sale)' : '👤 Select Customer to Mark as Due'}
          </button>
        </div>
      </Modal>

      {/* KotSlipModal & PrintBillModal will inherit styles or need manual dark theme updates */}
      {isKotOpen && (
        <KotSlipModal 
          kot={kotData} 
          onClose={() => {
            setIsKotOpen(false);
            router.push('/operations/tables');
          }} 
        />
      )}

      {isBillOpen && (
        <PrintBillModal 
          bill={billData}
          onClose={() => setIsBillOpen(false)}
        />
      )}

      <Modal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        title="New Guest Registration"
      >
        <CustomerForm 
          onSubmit={handleCreateCustomer}
          onCancel={() => setIsCustomerModalOpen(false)}
          loading={customerMutationLoading}
        />
      </Modal>
    </div>
  );
}
