'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Store,
  Package,
  ChevronRight,
  Phone,
  User,
  Building2,
  ArrowLeft,
  X,
  Loader2,
  BadgeCheck,
} from 'lucide-react';
import { toast, Toaster } from 'sonner';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  unit: string;
  stockQuantity: number;
  discount: number;
  gstRate: number;
  image?: string;
  category?: string;
}

interface Supplier {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  image?: string;
  category?: string;
  products: Product[];
}

interface CartItem extends Product {
  quantity: number;
}

type PageState = 'catalog' | 'cart' | 'checkout' | 'success';

export default function PublicOrderPage({ params }: { params: { token: string } }) {
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [pageState, setPageState] = useState<PageState>('catalog');
  const [activeCategory, setActiveCategory] = useState('All');
  const [orderNo, setOrderNo] = useState('');
  const [placing, setPlacing] = useState(false);

  // Checkout form state
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerRestaurant, setBuyerRestaurant] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/b2b/qr/${params.token}`);
        if (!res.ok) {
          const err = await res.json();
          setError(err.message || 'Invalid QR code');
          return;
        }
        const data = await res.json();
        setSupplier(data.data);
      } catch {
        setError('Failed to load supplier catalog');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [params.token]);

  const categories = ['All', ...Array.from(new Set(supplier?.products.map(p => p.category || 'General').filter(Boolean)))];

  const filteredProducts = supplier?.products.filter(p =>
    activeCategory === 'All' || (p.category || 'General') === activeCategory
  ) || [];

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(i => i.id !== productId));
  };

  const updateQty = (productId: string, delta: number) => {
    setCart(prev => {
      return prev.map(i => {
        if (i.id === productId) {
          const newQty = i.quantity + delta;
          if (newQty <= 0) return null as any;
          return { ...i, quantity: newQty };
        }
        return i;
      }).filter(Boolean);
    });
  };

  const getCartQty = (productId: string) => cart.find(i => i.id === productId)?.quantity || 0;

  const getDiscountedPrice = (p: Product) => p.price * (1 - (p.discount || 0) / 100);

  const totalAmount = cart.reduce((sum, item) => sum + getDiscountedPrice(item) * item.quantity, 0);

  const handlePlaceOrder = async () => {
    if (!buyerName.trim() || !buyerPhone.trim()) {
      toast.error('Please fill in your name and phone number');
      return;
    }
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    setPlacing(true);
    try {
      const res = await fetch(`/api/b2b/qr/${params.token}/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerName,
          buyerPhone,
          buyerRestaurant,
          items: cart.map(item => ({
            productId: item.id,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setOrderNo(data.data.order.orderNo);
        setCart([]);
        setPageState('success');
      } else {
        toast.error(data.message || 'Failed to place order');
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  // ─── Loading State ───────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Loading Catalog...</p>
        </div>
      </div>
    );
  }

  // ─── Error State ─────────────────────────────────────────────────
  if (error || !supplier) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-20 h-20 rounded-full bg-rose-100 flex items-center justify-center mx-auto">
            <X size={36} className="text-rose-500" />
          </div>
          <h1 className="text-xl font-black uppercase tracking-tight text-slate-900">Invalid QR Code</h1>
          <p className="text-sm text-slate-500">{error || 'This supplier could not be found.'}</p>
        </div>
      </div>
    );
  }

  // ─── Success State ────────────────────────────────────────────────
  if (pageState === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-slate-50 flex items-center justify-center p-6">
        <Toaster richColors position="top-center" />
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-6 max-w-sm"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2, stiffness: 200 }}
            className="w-24 h-24 rounded-full bg-emerald-500 flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/30"
          >
            <BadgeCheck size={48} className="text-white" />
          </motion.div>

          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">Order Placed!</h1>
            <p className="text-sm text-slate-500 mt-2">Your order has been sent to {supplier.name}</p>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-3">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Order Number</p>
            <p className="text-2xl font-black text-emerald-600 tracking-tight">{orderNo}</p>
            <p className="text-[10px] text-slate-400 font-bold">
              The supplier will contact you at <span className="text-slate-700">{buyerPhone}</span> to confirm delivery.
            </p>
          </div>

          <button
            onClick={() => { setPageState('catalog'); setBuyerName(''); setBuyerPhone(''); setBuyerRestaurant(''); }}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest"
          >
            Place Another Order
          </button>
        </motion.div>
      </div>
    );
  }

  // ─── Checkout State ───────────────────────────────────────────────
  if (pageState === 'checkout') {
    return (
      <div className="min-h-screen bg-slate-50">
        <Toaster richColors position="top-center" />
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-4 py-4 flex items-center gap-3">
          <button onClick={() => setPageState('cart')} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-sm font-black uppercase tracking-tight">Checkout</h1>
            <p className="text-[10px] text-slate-400 font-bold">{cart.length} items · ₹{totalAmount.toFixed(0)}</p>
          </div>
        </div>

        <div className="max-w-lg mx-auto p-4 space-y-6 pb-32">
          {/* Order Summary */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Order Summary</h3>
            <div className="space-y-3">
              {cart.map(item => (
                <div key={item.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-black uppercase">{item.name}</p>
                    <p className="text-[9px] text-slate-400 font-bold">{item.quantity} × ₹{getDiscountedPrice(item).toFixed(0)}/{item.unit}</p>
                  </div>
                  <p className="text-sm font-black text-emerald-600">₹{(getDiscountedPrice(item) * item.quantity).toFixed(0)}</p>
                </div>
              ))}
              <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                <p className="text-[11px] font-black uppercase">Total</p>
                <p className="text-lg font-black text-emerald-600">₹{totalAmount.toFixed(0)}</p>
              </div>
            </div>
          </div>

          {/* Buyer Info Form */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 space-y-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Your Details</h3>

            <div className="space-y-3">
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Full Name *</label>
                <div className="flex items-center gap-3 bg-slate-50 rounded-2xl px-4 py-3 border border-slate-100">
                  <User size={16} className="text-slate-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Your full name"
                    value={buyerName}
                    onChange={e => setBuyerName(e.target.value)}
                    className="flex-1 bg-transparent text-sm font-bold text-slate-700 outline-none placeholder:text-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Phone Number *</label>
                <div className="flex items-center gap-3 bg-slate-50 rounded-2xl px-4 py-3 border border-slate-100">
                  <Phone size={16} className="text-slate-400 shrink-0" />
                  <input
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={buyerPhone}
                    onChange={e => setBuyerPhone(e.target.value)}
                    className="flex-1 bg-transparent text-sm font-bold text-slate-700 outline-none placeholder:text-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Restaurant / Hotel Name</label>
                <div className="flex items-center gap-3 bg-slate-50 rounded-2xl px-4 py-3 border border-slate-100">
                  <Building2 size={16} className="text-slate-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Your restaurant name (optional)"
                    value={buyerRestaurant}
                    onChange={e => setBuyerRestaurant(e.target.value)}
                    className="flex-1 bg-transparent text-sm font-bold text-slate-700 outline-none placeholder:text-slate-300"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Place Order Button */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-4">
          <button
            onClick={handlePlaceOrder}
            disabled={placing}
            className="w-full max-w-lg mx-auto block py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {placing ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
            {placing ? 'Placing Order...' : `Confirm Order · ₹${totalAmount.toFixed(0)}`}
          </button>
        </div>
      </div>
    );
  }

  // ─── Cart State ───────────────────────────────────────────────────
  if (pageState === 'cart') {
    return (
      <div className="min-h-screen bg-slate-50">
        <Toaster richColors position="top-center" />
        <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-4 py-4 flex items-center gap-3">
          <button onClick={() => setPageState('catalog')} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-sm font-black uppercase tracking-tight">Your Cart</h1>
            <p className="text-[10px] text-slate-400 font-bold">{supplier.name}</p>
          </div>
        </div>

        <div className="max-w-lg mx-auto p-4 space-y-3 pb-32">
          {cart.length === 0 ? (
            <div className="text-center py-20 opacity-40">
              <ShoppingCart size={48} className="mx-auto mb-3 text-slate-400" />
              <p className="text-sm font-black uppercase tracking-widest">Cart is empty</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                  {item.image ? (
                    <img src={item.image} className="w-full h-full object-cover rounded-xl" alt={item.name} />
                  ) : (
                    <Package size={22} className="text-slate-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-black uppercase tracking-tight truncate">{item.name}</p>
                  <p className="text-[10px] text-emerald-600 font-black">₹{getDiscountedPrice(item).toFixed(0)}/{item.unit}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQty(item.id, -1)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                    <Minus size={14} />
                  </button>
                  <span className="text-sm font-black w-6 text-center">{item.quantity}</span>
                  <button onClick={() => updateQty(item.id, 1)} className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Plus size={14} />
                  </button>
                  <button onClick={() => removeFromCart(item.id)} className="w-8 h-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center ml-1">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-4">
            <div className="max-w-lg mx-auto">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-black text-slate-500 uppercase">Total</p>
                <p className="text-xl font-black text-emerald-600">₹{totalAmount.toFixed(0)}</p>
              </div>
              <button
                onClick={() => setPageState('checkout')}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
              >
                Proceed to Checkout <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── Catalog State (default) ──────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster richColors position="top-center" />

      {/* Supplier Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Store size={20} />
            </div>
            <div>
              <h1 className="text-sm font-black uppercase tracking-tight">{supplier.name}</h1>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{supplier.category || 'Supplier'}</p>
            </div>
          </div>

          {/* Cart Button */}
          <button
            onClick={() => setPageState('cart')}
            className="relative flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20"
          >
            <ShoppingCart size={15} />
            Cart
            {cart.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-white">
                {cart.length}
              </span>
            )}
          </button>
        </div>

        {/* Category Filter */}
        <div className="max-w-2xl mx-auto px-4 pb-3 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeCategory === cat ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <div className="max-w-2xl mx-auto px-4 py-4 pb-32">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 opacity-40">
            <Package size={48} className="mx-auto mb-3 text-slate-300" />
            <p className="text-sm font-black uppercase">No products available</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredProducts.map(product => {
              const qty = getCartQty(product.id);
              const discPrice = getDiscountedPrice(product);
              return (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100"
                >
                  {/* Product Image */}
                  <div className="aspect-square bg-slate-50 flex items-center justify-center relative">
                    {product.image ? (
                      <img src={product.image} className="w-full h-full object-cover" alt={product.name} />
                    ) : (
                      <Package size={36} className="text-slate-200" />
                    )}
                    {product.discount > 0 && (
                      <div className="absolute top-2 left-2 bg-rose-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full">
                        {product.discount}% OFF
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <p className="text-[11px] font-black uppercase tracking-tight line-clamp-2 mb-1">{product.name}</p>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-base font-black text-emerald-600">₹{discPrice.toFixed(0)}</p>
                        <p className="text-[8px] text-slate-400 font-bold">per {product.unit}</p>
                      </div>
                      {product.discount > 0 && (
                        <p className="text-[9px] text-slate-400 line-through font-bold">₹{product.price}</p>
                      )}
                    </div>

                    {/* Add/Qty Control */}
                    {qty === 0 ? (
                      <button
                        onClick={() => addToCart(product)}
                        className="w-full py-2.5 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                      >
                        <Plus size={12} /> Add
                      </button>
                    ) : (
                      <div className="flex items-center justify-between bg-emerald-50 rounded-xl px-2 py-1.5">
                        <button onClick={() => updateQty(product.id, -1)} className="w-7 h-7 rounded-lg bg-white flex items-center justify-center shadow-sm">
                          <Minus size={12} />
                        </button>
                        <span className="text-sm font-black text-emerald-700">{qty}</span>
                        <button onClick={() => updateQty(product.id, 1)} className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                          <Plus size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Cart CTA */}
      {cart.length > 0 && pageState === 'catalog' && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-4 left-4 right-4 max-w-2xl mx-auto z-50"
        >
          <button
            onClick={() => setPageState('cart')}
            className="w-full py-4 bg-slate-900 text-white rounded-3xl shadow-2xl flex items-center justify-between px-6"
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[10px] font-black">{cart.reduce((s, i) => s + i.quantity, 0)}</div>
              <span className="text-[11px] font-black uppercase tracking-widest">View Cart</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-emerald-400">₹{totalAmount.toFixed(0)}</span>
              <ChevronRight size={16} />
            </div>
          </button>
        </motion.div>
      )}
    </div>
  );
}
