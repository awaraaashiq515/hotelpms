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
  
  // Active Order state
  const [activeOrder, setActiveOrder] = useState<any>(null);

  // Modals state
  const [isSettleOpen, setIsSettleOpen] = useState(false);
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<string>('');
  
  const [isKotOpen, setIsKotOpen] = useState(false);
  const [kotData, setKotData] = useState<any>(null);
  
  const [isBillOpen, setIsBillOpen] = useState(false);
  const [billData, setBillData] = useState<any>(null);
  
  // Customers
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedGuestId, setSelectedGuestId] = useState<string>('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerMutationLoading, setCustomerMutationLoading] = useState(false);

  const { addToast } = useToast();

  const fetchActiveOrder = async () => {
    if (!tableId) return;
    try {
      const response = await fetch(`/api/pos-orders?restaurantTableId=${tableId}&status=in_progress`);
      const result = await response.json();
      if (result.success && result.data.length > 0) {
        const order = result.data[0];
        setActiveOrder(order);
        // Sync cart with order items
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

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [pData, cData, mData, gData] = await Promise.all([
          productsApi.list(),
          categoriesApi.list(),
          paymentModesApi.list(),
          customersApi.list()
        ]);
        setProducts(pData || []);
        setCategories(cData || []);
        setPaymentModes(mData || []);
        setCustomers(gData || []);
        
        if (tableId) {
          await fetchActiveOrder();
        }
      } catch (err) {
        console.error('Fetch failed:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [tableId]);

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

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0);
  const tax = subtotal * 0.05; // 5% GST
  const grandTotal = subtotal + tax;

  const handleSaveOrder = async () => {
    if (cart.length === 0) return;
    setSaveLoading(true);
    try {
      const data = await ordersApi.save({
        items: cart,
        restaurantTableId: tableId || undefined,
        orderType: 'DINE_IN'
      });
      setKotData(data.kot);
      setIsKotOpen(true);
      addToast('success', 'Order saved and KOT generated!');
      await fetchActiveOrder(); // Refresh state
    } catch (err) {
      console.error('Save failed:', err);
      addToast('error', 'Failed to save order');
    } finally {
      setSaveLoading(false);
    }
  };

  const handlePrintBill = async () => {
    if (!activeOrder && cart.length > 0) {
      addToast('info', 'Please "Save Order" first before printing the bill.');
      return;
    }
    if (!activeOrder) return;
    setBillData(activeOrder);
    setIsBillOpen(true);
  };

  const handleSettle = async () => {
    if (!selectedPaymentMode) return;
    setSettleLoading(true);
    try {
      await ordersApi.checkout({
        paymentModeId: selectedPaymentMode,
        totalAmount: grandTotal,
        guestId: selectedGuestId || undefined,
        restaurantTableId: tableId || undefined,
        items: cart.map(item => ({
          id: item.id,
          quantity: item.quantity,
          sellingPrice: item.sellingPrice
        }))
      });
      setCart([]);
      setActiveOrder(null);
      setIsSettleOpen(false);
      addToast('success', 'Order settled and Invoice generated successfully!');
    } catch (err) {
      console.error('Settle failed:', err);
      addToast('error', 'Failed to settle order');
    } finally {
      setSettleLoading(false);
    }
  };

  const handleMarkAsDue = async () => {
    if (!selectedGuestId) {
      addToast('info', 'Please select a customer before marking as Due/Credit.');
      return;
    }
    setSettleLoading(true);
    try {
      await ordersApi.checkoutCredit({
        totalAmount: grandTotal,
        guestId: selectedGuestId,
        items: cart.map(item => ({
          id: item.id,
          quantity: item.quantity,
          sellingPrice: item.sellingPrice
        }))
      });
      setCart([]);
      setSelectedGuestId('');
      setIsSettleOpen(false);
      addToast('success', 'Credit Bill created! Check Outstanding Dues.');
    } catch (err) {
      console.error('Credit sale failed:', err);
      addToast('error', 'Failed to create credit bill');
    } finally {
      setSettleLoading(false);
    }
  };

  const handleCreateCustomer = async (data: Partial<Customer>) => {
    setCustomerMutationLoading(true);
    try {
      const newCustomer = await customersApi.create(data);
      addToast('success', 'Customer created successfully!');
      
      // Refresh customers list
      const gData = await customersApi.list();
      setCustomers(gData || []);
      
      // Auto-select the new customer
      setSelectedGuestId(newCustomer.id);
      setIsCustomerModalOpen(false);
    } catch (err) {
      console.error('Failed to create customer:', err);
      addToast('error', 'Failed to create customer');
    } finally {
      setCustomerMutationLoading(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          (p.sku || '').toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const filteredCustomers = customers.filter(c => {
    const searchLower = customerSearch.toLowerCase();
    const fullName = `${c.firstName} ${c.lastName || ''}`.toLowerCase();
    return (
      fullName.includes(searchLower) ||
      (c.mobile || '').includes(customerSearch)
    );
  });

  return (
    <div className="h-[calc(100vh-120px)] flex gap-6 overflow-hidden">
      {/* Left Area: Menu Browser */}
      <div className="flex-1 flex flex-col bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden relative">
        {/* Menu Header */}
        <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-white z-10">
          <div className="flex items-center gap-5">
            <div className="p-3 bg-pos-primary/10 text-pos-primary rounded-2xl">
              <Utensils size={28} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-gray-900 tracking-tight uppercase">Menu Terminal</h2>
                {tableName && (
                  <div className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-bold uppercase tracking-wider border border-emerald-100 animate-pulse">
                    Active: {tableName}
                  </div>
                )}
              </div>
              <p className="text-[9px] font-medium text-gray-400 uppercase tracking-widest mt-1">POS Terminal • v2.0</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-pos-primary transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search Product... (Alt + S)" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-12 pr-6 py-3 bg-gray-50 border border-transparent rounded-2xl text-sm w-72 focus:bg-white focus:border-pos-primary/20 focus:ring-4 focus:ring-pos-primary/5 transition-all font-medium outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* COMPACT CATEGORY SIDEBAR */}
          <div className="w-40 border-r border-gray-100 flex flex-col bg-gray-50/50 overflow-y-auto no-scrollbar py-4 px-2 shadow-inner">
            <button 
              onClick={() => setSelectedCategory('all')}
              className={`mb-1 flex items-center gap-2 px-3 py-2.5 rounded-xl text-[10px] font-bold tracking-tight transition-all border ${
                selectedCategory === 'all' 
                  ? 'bg-pos-primary border-pos-primary text-white shadow-md' 
                  : 'bg-white border-gray-100 text-gray-500 hover:border-pos-primary/20 hover:text-pos-primary'
              }`}
            >
              <Grid size={12} />
              <span>ALL ITEMS</span>
            </button>

            {categories.map((cat) => (
              <button 
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`mb-1 flex items-center justify-between px-3 py-2.5 rounded-xl text-[10px] font-bold tracking-tight transition-all border ${
                  selectedCategory === cat.id 
                    ? 'bg-pos-primary border-pos-primary text-white shadow-md' 
                    : 'bg-white border-gray-100 text-gray-500 hover:border-pos-primary/20 hover:text-pos-primary'
                }`}
              >
                <span className="uppercase truncate pr-1">{cat.name}</span>
              </button>
            ))}
          </div>

          {/* DENSE PRODUCT GRID */}
          <div className="flex-1 overflow-y-auto p-4 no-scrollbar bg-white">
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-3">
              {loading ? (
                Array.from({ length: 24 }).map((_, i) => (
                  <div key={i} className="h-28 bg-gray-50 animate-pulse rounded-xl border border-gray-100" />
                ))
              ) : filteredProducts.length === 0 ? (
                <div className="col-span-full py-40 flex flex-col items-center justify-center text-gray-300 gap-4">
                  <Search size={48} className="opacity-10" />
                  <p className="font-bold uppercase tracking-widest text-[10px] opacity-50">No products found</p>
                </div>
              ) : filteredProducts.map((product) => (
                <button 
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="group flex flex-col bg-white border border-gray-100 rounded-xl p-3 text-left transition-all hover:border-pos-primary/40 hover:shadow-lg hover:shadow-pos-primary/5 active:scale-95 h-28 justify-between relative"
                >
                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-all">
                    <div className="bg-pos-primary text-white rounded-lg p-1">
                      <Plus size={12} />
                    </div>
                  </div>
                  <h3 className="text-[11px] font-bold text-gray-700 leading-tight line-clamp-2 uppercase group-hover:text-pos-primary transition-colors">{product.name}</h3>
                  <div className="flex items-center justify-between border-t border-gray-50 pt-2 mt-auto">
                    <span className="text-[13px] font-black text-gray-900">₹{product.sellingPrice}</span>
                    {product.trackInventory && (
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* COMPACT ORDER SUMMARY / CART */}
      <div className="w-96 flex flex-col bg-white border-l border-gray-100 shadow-xl overflow-hidden">
        {/* Compact Customer & Search */}
        <div className="p-3 border-b border-gray-50 flex flex-col gap-3 bg-gray-50/30 relative z-[100]">
          <div className="space-y-1.5 relative">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Search Customer</label>
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-pos-primary transition-colors" size={12} />
              <input 
                type="text" 
                placeholder="Name or Mobile No..." 
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-100 rounded-xl text-[11px] focus:ring-4 focus:ring-pos-primary/5 focus:border-pos-primary/20 transition-all outline-none font-medium text-gray-700 shadow-sm"
              />
            </div>
            
            {/* AUTCOMPLETE RESULTS LIST */}
            {customerSearch.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="max-h-[300px] overflow-y-auto no-scrollbar py-2">
                  {filteredCustomers.length === 0 ? (
                    <div className="px-5 py-8 text-center text-gray-400">
                      <p className="text-[10px] font-black uppercase tracking-widest leading-loose">No Results Found<br/>for "{customerSearch}"</p>
                    </div>
                  ) : (
                    filteredCustomers.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setSelectedGuestId(c.id);
                          setCustomerSearch('');
                        }}
                        className="w-full px-5 py-3 text-left hover:bg-pos-primary/5 border-b border-gray-50 last:border-0 transition-colors group"
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[11px] font-black text-gray-900 uppercase group-hover:text-pos-primary transition-colors">
                            {c.firstName} {c.lastName || ''}
                          </span>
                          <span className="text-[9px] text-gray-400 font-bold tracking-tighter">
                            {c.mobile || 'No mobile number'}
                          </span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Select
                value={selectedGuestId}
                onChange={(e) => setSelectedGuestId(e.target.value)}
                options={[
                  { label: 'Walk-in Guest', value: '' },
                  ...customers.map(c => ({ 
                    label: `${c.firstName} ${c.lastName || ''}`, 
                    value: c.id 
                  }))
                ]}
              />
            </div>
            <button
              onClick={() => setIsCustomerModalOpen(true)}
              className="mb-0.5 h-[42px] w-[42px] min-w-[42px] flex items-center justify-center bg-pos-primary/10 text-pos-primary hover:bg-pos-primary/20 rounded-xl transition-all shadow-sm active:scale-95"
              title="Add New Customer"
            >
              <UserPlus size={20} />
            </button>
          </div>
        </div>

        {/* Dense Cart Header */}
        <div className="px-5 py-4 flex items-center justify-between bg-gray-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <ShoppingBag size={14} />
            </div>
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Order Summary</h3>
              <p className="text-[11px] font-black text-white uppercase mt-0.5">{cart.length} Items</p>
            </div>
          </div>
          <button 
            onClick={() => confirm('Clear cart?') && setCart([])}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400"
          >
            <RotateCcw size={14} />
          </button>
        </div>

        {/* Compact Cart Items */}
        <div className="flex-1 overflow-y-auto no-scrollbar bg-slate-50/20">
          {cart.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center text-gray-300 gap-3 grayscale">
                <ShoppingBag size={32} className="opacity-20" />
                <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Cart Empty</p>
             </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {cart.map((item) => (
                <div key={item.id} className="px-4 py-3 flex items-center justify-between hover:bg-white transition-all group">
                  <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                    <h4 className="text-[10px] font-bold text-gray-900 uppercase truncate">{item.name}</h4>
                    <span className="text-[9px] text-gray-400 font-bold">₹{item.sellingPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                      <button onClick={() => updateQuantity(item.id, -1)} className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-pos-primary"><Minus size={10}/></button>
                      <span className="px-2 text-[10px] font-black text-gray-900">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-pos-primary"><Plus size={10}/></button>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={12} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dense Totals & Button Matrix */}
        <div className="p-5 bg-white border-t border-gray-100 space-y-4 shadow-top">
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase">
              <span>Sub-Total</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase pb-2 border-b border-gray-50">
              <span>Taxes (5%)</span>
              <span>₹{tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-[11px] font-black text-gray-900 uppercase tracking-wider">Payable</span>
              <span className="text-xl font-bold text-pos-primary">₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* DENSE BUTTON MATRIX (3x2) */}
          <div className="grid grid-cols-2 gap-2 pb-2">
            <Button 
               onClick={handleSaveOrder}
               loading={saveLoading}
               disabled={cart.length === 0}
               className="py-2.5 rounded-lg bg-pos-primary hover:bg-pos-primary-dark text-white font-bold text-[9px] uppercase tracking-widest gap-2"
            >
              <Save size={14} /> SAVE
            </Button>
            <Button 
               onClick={handlePrintBill}
               disabled={!activeOrder}
               className="py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold text-[9px] uppercase tracking-widest gap-2"
            >
              <Printer size={14} /> PRINT BILL
            </Button>
            <Button 
               variant="secondary" 
               className="py-2.5 rounded-lg border-gray-200 text-gray-600 font-bold text-[9px] uppercase tracking-widest gap-2 bg-gray-900 text-white hover:bg-gray-800"
            >
              <Percent size={14} /> DISCOUNT
            </Button>
            <Button 
               disabled={cart.length === 0}
               onClick={() => setIsSettleOpen(true)}
               className="py-2.5 bg-pos-primary hover:bg-pos-primary/90 text-white rounded-lg flex items-center justify-center gap-2 font-bold text-[9px] uppercase tracking-widest shadow-lg shadow-pos-primary/20"
            >
               <CreditCard size={14} /> SETTLE (F1)
            </Button>
          </div>
        </div>
      </div>

      {/* Settlement Modal */}
      <Modal 
        isOpen={isSettleOpen} 
        onClose={() => setIsSettleOpen(false)} 
        title="Final Settlement"
      >
        <div className="space-y-6 p-2">
          <div className="grid grid-cols-2 gap-4">
             {paymentModes.map(mode => (
               <button
                 key={mode.id}
                 onClick={() => setSelectedPaymentMode(mode.id)}
                 className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${
                   selectedPaymentMode === mode.id 
                    ? 'border-pos-primary bg-pos-primary/5 text-pos-primary shadow-lg shadow-pos-primary/10' 
                    : 'border-gray-100 hover:border-gray-200 text-gray-500 bg-white'
                 }`}
               >
                 <div className={`p-3 rounded-2xl ${selectedPaymentMode === mode.id ? 'bg-pos-primary text-white' : 'bg-gray-100 text-gray-400'}`}>
                    <CreditCard size={24} />
                 </div>
                 <span className="text-[11px] font-black uppercase tracking-widest">{mode.name}</span>
               </button>
             ))}
          </div>

          <div className="bg-gray-900 p-8 rounded-[2rem] space-y-4 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-pos-primary/20 rounded-full -mr-16 -mt-16 blur-3xl" />
             <div className="relative z-10 flex justify-between items-center">
                <span className="text-gray-400 text-xs font-black uppercase tracking-widest">Items Count</span>
                <span className="text-white font-black">{cart.length}</span>
             </div>
             <div className="relative z-10 flex justify-between items-end pt-4 border-t border-white/5">
                <div>
                   <span className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">Grand Total</span>
                   <p className="text-4xl font-black text-white tracking-tighter mt-1">₹{grandTotal.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-black uppercase tracking-widest bg-emerald-400/10 px-3 py-1.5 rounded-full border border-emerald-400/20">
                   <CheckCircle2 size={12} />
                   Verified
                </div>
             </div>
          </div>

          <div className="flex gap-4">
             <Button 
                variant="secondary" 
                onClick={() => setIsSettleOpen(false)}
                className="flex-1 py-5 text-[11px] font-black uppercase tracking-widest bg-white border-2 border-gray-100 rounded-2xl hover:bg-gray-50"
             >
                Back
             </Button>
             <Button
                loading={settleLoading}
                disabled={!selectedPaymentMode}
                onClick={handleSettle}
                className="flex-1 py-5 text-[11px] font-black uppercase tracking-widest bg-pos-primary hover:bg-red-700 text-white rounded-2xl shadow-xl shadow-pos-primary/20 disabled:opacity-30"
             >
                Confirm Settlement
             </Button>
          </div>

          <button
            onClick={handleMarkAsDue}
            disabled={settleLoading || !selectedGuestId}
            className="w-full py-4 text-center text-orange-600 border border-orange-200 bg-orange-50 hover:bg-orange-100 rounded-[1.25rem] text-[11px] font-black uppercase tracking-widest transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            📋 {selectedGuestId ? 'Mark as Due (Credit Sale)' : 'Select a Customer to Mark as Due'}
          </button>
        </div>
      </Modal>

      {/* KOT Modal */}
      {isKotOpen && (
        <KotSlipModal 
          kot={kotData} 
          onClose={() => {
            setIsKotOpen(false);
            router.push('/operations/tables');
          }} 
        />
      )}

      {/* Print Bill Modal */}
      {isBillOpen && (
        <PrintBillModal 
          bill={billData}
          onClose={() => setIsBillOpen(false)}
        />
      )}

      {/* New Customer Modal */}
      <Modal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        title="Add New Guest"
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

