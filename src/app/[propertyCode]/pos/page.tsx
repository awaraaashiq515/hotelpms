'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { Skeleton } from '@/components/ui/Skeleton';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { queueOfflineAction } from '@/lib/offline-db';

interface Product {
  id: string;
  name: string;
  sellingPrice: number;
  halfPrice?: number | null;
  categoryId: string;
  menuType?: string;
  variants?: {
    id: string;
    name: string;
    price: number;
  }[];
}

interface Category {
  id: string;
  name: string;
}

interface CartItem extends Product {
  quantity: number;
  size?: string;
  cartItemId: string;
}

interface PaymentMode {
  id: string;
  name: string;
}

export default function PosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentModes, setPaymentModes] = useState<PaymentMode[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedPaymentMode, setSelectedPaymentMode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const [customers, setCustomers] = useState<{ id: string, firstName: string, lastName?: string, mobile?: string }[]>([]);
  const [selectedGuestId, setSelectedGuestId] = useState('');

  const isOnline = useOnlineStatus();
  const { addToast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, catRes, payRes, guestRes] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/categories'),
          fetch('/api/payment-modes'),
          fetch('/api/customers')
        ]);
        const prodData = await prodRes.json();
        const catData = await catRes.json();
        const payData = await payRes.json();
        const guestData = await guestRes.json();

        if (prodData.success) setProducts(prodData.data);
        if (catData.success) setCategories(catData.data);
        if (guestData.success) setCustomers(guestData.data);
        if (payData.success) {
          setPaymentModes(payData.data);
          if (payData.data.length > 0) setSelectedPaymentMode(payData.data[0].id);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const addToCart = (product: Product, size: string = 'Full', price?: number) => {
    setCart(prev => {
      const cartItemId = `${product.id}-${size}`;
      const existing = prev.find(item => item.cartItemId === cartItemId);

      let itemPrice = price ?? product.sellingPrice;
      let itemName = product.name;

      if (size !== 'Full') {
        itemName = `${product.name} (${size})`;
      }

      if (existing) {
        return prev.map((item: any) => item.cartItemId === cartItemId ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, name: itemName, sellingPrice: itemPrice, cartItemId, size, quantity: 1 }];
    });
  };


  const removeFromCart = (cartItemId: string) => {
    setCart(prev => prev.filter((item: any) => item.cartItemId !== cartItemId));
  };

  const updateQuantity = (cartItemId: string, delta: number) => {
    setCart(prev => prev.map((item: any) => {
      if (item.cartItemId === cartItemId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const total = cart.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0);
  const tax = total * 0.05;
  const grandTotal = total + tax;

  const filteredProducts = products.filter((p: any) => {
    const matchesCategory = activeCategory === 'all' || p.categoryId === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCheckout = async () => {
    const payload = {
      items: cart,
      paymentModeId: selectedPaymentMode,
      totalAmount: grandTotal,
      guestId: selectedGuestId || undefined,
    };

    if (!isOnline) {
      // Offline Flow
      try {
        await queueOfflineAction({
          type: 'CREATE_ORDER',
          endpoint: '/api/orders/checkout',
          method: 'POST',
          payload: payload as any,
          timestamp: Date.now(),
        });
        addToast('success', 'Offline Mode: Order saved locally. Will sync when online.');
        setCart([]);
        setIsCheckoutOpen(false);
      } catch (err) {
        addToast('error', 'Failed to save order locally.');
      }
      return;
    }

    // Online Flow
    setIsProcessing(true);
    try {
      const res = await fetch('/api/orders/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        addToast('success', 'Order settled and Invoice generated!');
        setCart([]);
        setIsCheckoutOpen(false);
      } else {
        addToast('error', data.message || 'Checkout failed');
      }
    } catch (error) {
      addToast('error', 'Network error during checkout');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-120px)] gap-6 -mt-2">
      {/* Left: Product Catalog */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Search products (F1)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/60"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar whitespace-nowrap">
            <Button
              variant={activeCategory === 'all' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setActiveCategory('all')}
            >
              All
            </Button>
            {categories.map((cat: any) => (
              <Button
                key={cat.id}
                variant={activeCategory === cat.id ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.name}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pr-2">
          {loading ? (
            <Skeleton className="h-40 w-full" count={8} />
          ) : filteredProducts.map((product: any) => (
            <Card
              key={product.id}
              className="p-3 hover:border-pos-primary/40 transition-all group flex flex-col justify-between h-40"
            >
              <div className="cursor-pointer" onClick={() => addToCart(product, 'Full')}>
                <Badge variant="primary" className="mb-2">₹{product.sellingPrice}</Badge>
                <h3 className="font-semibold text-gray-900 group-hover:text-pos-primary transition-colors line-clamp-2">
                  {product.name}
                </h3>
              </div>

              {/* Actions Area - Absolute bottom */}
              <div className="mt-auto -mx-3 -mb-3 border-t border-gray-100 dark:border-slate-800 overflow-hidden rounded-b-xl">
                {product.variants && product.variants.length > 0 ? (
                  <div className="grid grid-cols-2">
                    {product.variants.map((v: any, idx: number) => {
                      const colors = [
                        'bg-orange-500 hover:bg-orange-600',
                        'bg-rose-400 hover:bg-rose-500',
                        'bg-amber-500 hover:bg-amber-600',
                        'bg-emerald-500 hover:bg-emerald-600'
                      ];
                      const colorClass = colors[idx % colors.length];
                      const isLastAndOdd = idx === product.variants.length - 1 && product.variants.length % 2 !== 0;

                      return (
                        <button
                          key={v.id}
                          className={`py-4 text-[10px] font-black uppercase tracking-widest text-white transition-all active:scale-95 ${colorClass} ${isLastAndOdd ? 'col-span-2' : ''} border-r border-b border-white/10`}
                          onClick={(e) => { e.stopPropagation(); addToCart(product, v.name, v.price); }}
                        >
                          {v.name}
                        </button>
                      );
                    })}
                    {/* Fallback to Full Price if variants exist but user wants original */}
                    <button
                      className="col-span-2 py-3 text-[10px] font-black uppercase tracking-widest text-white bg-slate-700 hover:bg-slate-800 transition-all active:scale-95"
                      onClick={(e) => { e.stopPropagation(); addToCart(product, 'Full'); }}
                    >
                      Base Price (Full)
                    </button>
                  </div>
                ) : product.menuType === 'RESTAURANT' ? (
                  <div className="grid grid-cols-2">
                    <button
                      className="py-5 text-[10px] font-black uppercase tracking-widest text-white bg-orange-500 hover:bg-orange-600 transition-all active:scale-95 border-r border-white/10"
                      onClick={(e) => { e.stopPropagation(); addToCart(product, 'Half', product.halfPrice || undefined); }}
                    >
                      Half
                    </button>
                    <button
                      className="py-5 text-[10px] font-black uppercase tracking-widest text-white bg-rose-400 hover:bg-rose-500 transition-all active:scale-95"
                      onClick={(e) => { e.stopPropagation(); addToCart(product, 'Full'); }}
                    >
                      Full
                    </button>
                  </div>
                ) : (
                  <div
                    className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-pos-primary bg-pos-primary/5 px-4 py-4 cursor-pointer hover:bg-pos-primary hover:text-white transition-all"
                    onClick={() => addToCart(product, 'Full')}
                  >
                    <span>Add to Order</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                )}
              </div>




            </Card>
          ))}
        </div>
      </div>

      {/* Right: Cart & Checkout */}
      <div className="w-96 flex flex-col h-full">
        <Card className="flex-1 flex flex-col p-0 overflow-hidden border-pos-primary/10 shadow-xl bg-pos-primary/5">
          <div className="p-4 border-b border-white bg-white/40 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">Active Order</h2>
            <Badge variant="primary">{cart.length} items</Badge>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <svg className="w-12 h-12 mb-2 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <p>Empty Cart</p>
              </div>
            ) : cart.map((item: any) => (
              <div key={item.cartItemId} className="flex gap-3 bg-white/60 p-3 rounded-2xl animate-in fade-in slide-in-from-right-4 transition-all hover:bg-white/80">
                <div className="flex-1">
                  <p className="font-semibold text-sm text-gray-900 line-clamp-1">{item.name}</p>
                  <p className="text-xs text-pos-primary font-bold">₹{item.sellingPrice}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQuantity(item.cartItemId, -1)} className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100">-</button>
                  <span className="w-5 text-center font-bold text-sm">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.cartItemId, 1)} className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100">+</button>
                  <button onClick={() => removeFromCart(item.cartItemId)} className="ml-1 text-gray-400 hover:text-red-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="p-6 bg-white border-t border-indigo-100 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-gray-500 text-sm">
                <span>Subtotal</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-500 text-sm">
                <span>Tax (GST 5%)</span>
                <span>₹{tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xl font-black text-pos-primary pt-2 border-t border-gray-50">
                <span>TOTAL</span>
                <span>₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button variant="secondary" className="w-full" disabled={cart.length === 0} onClick={() => addToast('info', 'Holding draft currently saves locally...')}>
                Save Draft
              </Button>
              <Button className="w-full shadow-lg shadow-pos-primary/20 bg-pos-primary hover:bg-pos-primary-dark" disabled={cart.length === 0} onClick={() => setIsCheckoutOpen(true)}>
                Checkout
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <Modal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        title="Payment Confirmation"
        footer={(
          <div className="flex space-x-3 w-full">
            <Button variant="secondary" onClick={() => setIsCheckoutOpen(false)} className="flex-1">
              Go Back
            </Button>
            <Button onClick={handleCheckout} loading={isProcessing} className="flex-1 shadow-lg shadow-pos-primary/20 italic bg-pos-primary hover:bg-pos-primary-dark">
              Complete Settlement
            </Button>
          </div>
        )}
      >
        <div className="space-y-6">
          <div className="p-6 bg-pos-primary rounded-3xl text-white text-center">
            <p className="text-white/80 uppercase text-xs font-bold tracking-widest mb-1">Payable Amount</p>
            <h2 className="text-4xl font-black tracking-tight">₹{grandTotal.toFixed(2)}</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Select
                label="Select Customer"
                options={[
                  { label: 'Walk-in Guest', value: '' },
                  ...customers.map((c: any) => ({ label: `${c.firstName} ${c.lastName || ''} (${c.mobile || 'No Mobile'})`, value: c.id }))
                ]}
                value={selectedGuestId}
                onChange={(e) => setSelectedGuestId(e.target.value)}
              />
            </div>
            <div className="col-span-2">
              <Select
                label="Select Payment Method"
                options={paymentModes.map((m: any) => ({ label: m.name, value: m.id }))}
                value={selectedPaymentMode}
                onChange={(e) => setSelectedPaymentMode(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-2xl space-y-2">
            <p className="text-xs font-bold text-gray-400 uppercase">Order Summary</p>
            {cart.map((item: any) => (
              <div key={item.cartItemId} className="flex justify-between text-sm">
                <span className="text-gray-600">{item.name} x {item.quantity}</span>
                <span className="font-semibold">₹{item.sellingPrice * item.quantity}</span>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}