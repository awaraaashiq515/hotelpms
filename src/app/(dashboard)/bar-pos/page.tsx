'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, Search, Trash2, User as UserIcon, CreditCard,
  Minus, Grid, List, ShoppingBag, CheckCircle2,
  Save, FlaskConical, Wine, Lock, ChevronLeft
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { productsApi, Product } from '@/lib/api/products';
import { categoriesApi, Category } from '@/lib/api/categories';
import { paymentModesApi, PaymentMode } from '@/lib/api/payment-modes';
import { customersApi, Customer } from '@/lib/api/customers';
import { BillModal, BillData } from '@/components/billing/BillModal';
import { useToast } from '@/components/ui/Toast';
import { useSidebar } from '@/context/sidebar-context';
import { useTheme } from '@/components/providers/ThemeProvider';
import { ProductIcon } from '@/components/shared/product-icon';

interface CartItem extends Product { quantity: number; }

const BAR_CARD_COLORS = [
  { bg: '#3d1a00', border: '#f97316', text: '#fed7aa' },
  { bg: '#1a0d2e', border: '#a855f7', text: '#e9d5ff' },
  { bg: '#0d1f35', border: '#3b82f6', text: '#bfdbfe' },
  { bg: '#1a0a0a', border: '#ef4444', text: '#fecaca' },
  { bg: '#0f2a1a', border: '#22c55e', text: '#bbf7d0' },
  { bg: '#2a1a00', border: '#eab308', text: '#fef08a' },
  { bg: '#1a1a2e', border: '#6366f1', text: '#c7d2fe' },
  { bg: '#2d0a1a', border: '#ec4899', text: '#fbcfe8' },
];

export default function BarPosPage() {
  const router = useRouter();
  const { setOpen } = useSidebar();
  const { addToast } = useToast();

  const [barEnabled, setBarEnabled] = useState<boolean | null>(null); // null = loading
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentModes, setPaymentModes] = useState<PaymentMode[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [settleLoading, setSettleLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [isBillOpen, setIsBillOpen] = useState(false);
  const [billData, setBillData] = useState<BillData | null>(null);
  const [selectedGuestId, setSelectedGuestId] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  useEffect(() => { setOpen(false); return () => setOpen(true); }, [setOpen]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        // First check if Bar POS is enabled for this property
        const propRes = await fetch('/api/setup/properties/current');
        const propData = await propRes.json();
        if (propData.success) {
          setBarEnabled(!!propData.data.barPosEnabled);
          setPropertyId(propData.data.id);
          if (!propData.data.barPosEnabled) {
            setLoading(false);
            return; // Don't load bar data if disabled
          }
        }
        // Load bar data
        const [pData, cData, pmData, custData] = await Promise.all([
          productsApi.list(),
          categoriesApi.list(),
          paymentModesApi.list(),
          customersApi.list(),
        ]);
        setProducts((pData || []).filter((p: any) => p.menuType === 'BAR'));
        setCategories((cData || []).filter((c: any) => c.menuType === 'BAR'));
        setPaymentModes(pmData || []);
        setCustomers(custData || []);
      } catch {
        addToast('error', 'Failed to load Bar POS data');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => {
      const item = prev.find(i => i.id === id);
      if (!item) return prev;
      if (item.quantity + delta <= 0) return prev.filter(i => i.id !== id);
      return prev.map(i => i.id === id ? { ...i, quantity: i.quantity + delta } : i);
    });
  };

  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCategory === 'all' || p.categoryId === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const subtotal = cart.reduce((acc, i) => acc + i.sellingPrice * i.quantity, 0);
  const tax = cart.reduce((acc, item) => {
    const rate = (item.taxRate ?? 5) / 100;
    const type = item.taxType || 'EXCLUSIVE';
    if (type === 'EXCLUSIVE') return acc + item.sellingPrice * item.quantity * rate;
    return acc;
  }, 0);
  const grandTotal = subtotal + tax;

  const handleSave = async () => {
    if (cart.length === 0) return;
    setSaveLoading(true);
    try {
      const items = cart.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        unitPrice: item.sellingPrice,
        discountAmount: 0,
        taxAmount: item.sellingPrice * item.quantity * ((item.taxRate ?? 5) / 100),
      }));
      const res = await fetch('/api/pos-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderType: 'DINE_IN', items, guestId: selectedGuestId || null }),
      });
      const data = await res.json();
      if (data.success) {
        addToast('success', 'Bar order saved & inventory updated!');
        setCart([]);
      } else {
        addToast('error', data.message || 'Save failed');
      }
    } catch {
      addToast('error', 'Failed to save order');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleSettle = () => {
    if (cart.length === 0) return;
    const items = cart.map(item => ({
      productId: item.id,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.sellingPrice,
      taxRate: item.taxRate ?? 5,
      taxType: item.taxType || 'EXCLUSIVE',
      taxAmount: item.sellingPrice * item.quantity * ((item.taxRate ?? 5) / 100),
      totalAmount: item.sellingPrice * item.quantity,
      discountAmount: 0,
    }));
    setBillData({ orderNo: `BAR-${Date.now()}`, orderType: 'DINE_IN', items, subtotal, taxAmount: tax, grandTotal, guestId: selectedGuestId || null, guestName: customers.find(c => c.id === selectedGuestId)?.firstName || '' } as any);
    setIsBillOpen(true);
  };

  const handleSettleNew = async (payload: any) => {
    setSettleLoading(true);
    try {
      const res = await fetch('/api/orders/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) { addToast('success', 'Bar order settled!'); setCart([]); setIsBillOpen(false); }
      else addToast('error', data.message || 'Settlement failed');
    } catch { addToast('error', 'Settlement failed'); }
    finally { setSettleLoading(false); }
  };

  // ── LOADING STATE ──
  if (loading || barEnabled === null) return (
    <div className="h-screen flex items-center justify-center" style={{ background: '#0a0a0a' }}>
      <Wine size={40} className="text-amber-500 animate-pulse" />
    </div>
  );

  // ── BAR POS DISABLED STATE ──
  if (!barEnabled) return (
    <div className="h-screen flex flex-col items-center justify-center gap-6" style={{ background: '#0a0a0a' }}>
      <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ background: '#1a0f00', border: '2px solid #f9731640' }}>
        <Lock size={36} className="text-amber-600" />
      </div>
      <div className="text-center">
        <h2 className="font-black text-2xl text-amber-400 uppercase tracking-tight">Bar POS is Disabled</h2>
        <p className="text-sm text-amber-800 font-bold mt-2 max-w-sm">
          Bar POS module is currently turned off. Enable it from Settings to use the bar billing system.
        </p>
      </div>
      <div className="flex gap-3 mt-2">
        <button
          onClick={() => router.push('/settings')}
          className="px-6 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all"
          style={{ background: '#f97316', color: 'white' }}
        >
          Go to Settings → Enable
        </button>
        <button
          onClick={() => router.push('/billing')}
          className="px-6 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all"
          style={{ background: '#1a0f00', border: '1px solid #3d1f00', color: '#f97316' }}
        >
          Back to Restaurant POS
        </button>
      </div>
    </div>
  );

  // ── BAR POS ACTIVE ──
  return (
    <div className="flex h-screen overflow-hidden font-sans" style={{ background: '#0d0d0d', color: '#f5e6d0' }}>

      {/* CENTER — Products */}
      <div className="flex-1 flex flex-col h-full overflow-hidden" style={{ background: '#0d0d0d' }}>

        {/* Top Bar */}
        <div className="px-4 py-2.5 flex items-center gap-4 border-b" style={{ borderColor: '#2a1500', background: '#111' }}>
          <button
            onClick={() => router.push('/operations')}
            className="p-2 hover:bg-amber-500/10 rounded-xl transition-all text-amber-600 hover:text-amber-400"
            title="Back to Operations"
          >
            <ChevronLeft size={20} />
          </button>
          
          <div className="flex items-center gap-2">
            <Wine size={20} className="text-amber-500" />
            <span className="font-black text-lg text-amber-400 tracking-tight">BAR POS</span>
          </div>

          <div className="flex-1 relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-600" size={15} />
            <input
              type="text"
              placeholder="Search bar items..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 rounded-xl text-sm font-bold outline-none"
              style={{ background: '#1a0f00', border: '1px solid #3d1f00', color: '#fed7aa' }}
            />
          </div>

          <div className="flex items-center gap-1 p-0.5 rounded-xl" style={{ background: '#1a0f00', border: '1px solid #3d1f00' }}>
            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-amber-500 text-white' : 'text-amber-700'}`}><Grid size={15} /></button>
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-amber-500 text-white' : 'text-amber-700'}`}><List size={15} /></button>
          </div>

          <button
            onClick={() => router.push('/billing')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex-shrink-0"
            style={{ background: '#1a0f00', border: '1px solid #3d1f00', color: '#f97316' }}
          >
            🍽️ Restaurant POS
          </button>
        </div>

        {/* Category Tiles */}
        <div className="px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar" style={{ background: '#111' }}>
          <button
            onClick={() => setSelectedCategory('all')}
            className="flex-none px-4 py-2 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all"
            style={{ background: selectedCategory === 'all' ? '#f97316' : '#1a0f00', border: '1px solid #3d1f00', color: selectedCategory === 'all' ? 'black' : '#f97316', boxShadow: selectedCategory === 'all' ? '0 4px 12px #f9731640' : 'none' }}
          >
            All Items
          </button>
          {categories.map((cat, idx) => {
            const color = BAR_CARD_COLORS[idx % BAR_CARD_COLORS.length];
            const isSelected = selectedCategory === cat.id;
            const itemCount = products.filter(p => p.categoryId === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className="flex-none min-w-[110px] p-3 rounded-2xl transition-all hover:scale-105 active:scale-95 flex flex-col items-center gap-1"
                style={{ background: color.bg, border: `2px solid ${isSelected ? color.border : color.bg}`, boxShadow: isSelected ? `0 0 16px ${color.border}50` : 'none', color: color.text }}
              >
                <Wine size={16} />
                <span className="font-black text-[11px] leading-tight text-center">{cat.name}</span>
                <span className="text-[9px] opacity-70">{itemCount} items</span>
              </button>
            );
          })}
        </div>

        {/* Products */}
        <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
          {filteredProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 opacity-30">
              <FlaskConical size={48} className="text-amber-700" />
              <p className="font-black text-sm uppercase tracking-widest text-amber-700">No Bar Items Found</p>
              <p className="text-xs text-amber-800">Add products with "Bar Menu" type in Products page</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {filteredProducts.map((product, idx) => {
                const color = BAR_CARD_COLORS[idx % BAR_CARD_COLORS.length];
                const isInCart = cart.some(i => i.id === product.id);
                const pegSize = (product as any).pegSize;
                return (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="group relative rounded-[1.25rem] p-4 flex flex-col items-center justify-between text-center hover:scale-[1.03] active:scale-[0.97] min-h-[130px] transition-all duration-300"
                    style={{ background: color.bg, border: `2px solid ${isInCart ? color.border : 'transparent'}`, boxShadow: isInCart ? `0 0 20px ${color.border}40` : '0 2px 8px rgba(0,0,0,0.4)', color: color.text }}
                  >
                    <div className="absolute top-2.5 left-2.5 text-[11px] font-black">₹{product.sellingPrice.toFixed(0)}</div>
                    {pegSize && (
                      <div className="absolute top-2.5 right-2.5 text-[8px] font-black px-1.5 py-0.5 rounded-lg" style={{ background: color.border + '40', color: color.border }}>
                        {pegSize}ml
                      </div>
                    )}
                    <div className="mt-4 w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: color.border + '25' }}>
                      <Wine size={20} style={{ color: color.border }} />
                    </div>
                    <div className="w-full mt-2">
                      <h3 className="font-black text-[12px] leading-tight line-clamp-2">{product.name}</h3>
                    </div>
                    {isInCart && (
                      <div className="absolute top-2 right-2 p-1 rounded-full" style={{ background: color.border }}>
                        <CheckCircle2 size={10} className="text-black" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredProducts.map(product => {
                const isInCart = cart.some(i => i.id === product.id);
                const pegSize = (product as any).pegSize;
                return (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="w-full flex items-center gap-4 p-3 rounded-2xl transition-all text-left"
                    style={{ background: '#1a0f00', border: `1px solid ${isInCart ? '#f97316' : '#3d1f00'}` }}
                  >
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#2a1500' }}>
                      <ProductIcon productName={product.name} size={22} className="text-amber-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-black text-sm text-amber-200">{product.name}</h3>
                      {pegSize && <p className="text-[10px] text-amber-600 font-bold">{pegSize}ml peg</p>}
                    </div>
                    <div className="text-right">
                      <p className="font-black text-lg text-amber-400">₹{product.sellingPrice.toFixed(0)}</p>
                      <p className="text-[9px] text-amber-700 font-bold">GST {product.taxRate || 5}%</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SIDEBAR */}
      <div className="w-[380px] flex flex-col h-full border-l" style={{ background: '#111', borderColor: '#2a1500' }}>
        <div className="p-4 border-b" style={{ borderColor: '#2a1500' }}>
          <h2 className="text-xl font-black text-amber-400 tracking-tight">Bar Order</h2>
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-800 mt-0.5">Counter Service</p>

          {/* Customer */}
          <div className="mt-3 relative">
            <button
              onClick={() => setShowCustomerDropdown(!showCustomerDropdown)}
              className="w-full flex items-center gap-2 py-2 px-3 rounded-2xl border transition-all text-[10px] font-black uppercase"
              style={{ background: selectedGuestId ? '#f97316' : '#1a0f00', border: selectedGuestId ? '1px solid #f97316' : '1px solid #3d1f00', color: selectedGuestId ? 'white' : '#f97316' }}
            >
              <UserIcon size={12} />
              {selectedGuestId ? (customers.find(c => c.id === selectedGuestId)?.firstName || 'Guest') : 'Add Customer'}
              {selectedGuestId && (
                <span onClick={e => { e.stopPropagation(); setSelectedGuestId(''); }} className="ml-auto">✕</span>
              )}
            </button>
            {showCustomerDropdown && !selectedGuestId && (
              <div className="absolute top-full left-0 right-0 mt-1 rounded-2xl shadow-2xl z-50 overflow-hidden" style={{ background: '#1a0f00', border: '1px solid #3d1f00' }}>
                <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ borderColor: '#3d1f00' }}>
                  <Search size={13} className="text-amber-700" />
                  <input autoFocus type="text" placeholder="Search..." value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} className="bg-transparent text-[11px] font-bold outline-none flex-1 text-amber-200" />
                </div>
                <div className="max-h-40 overflow-y-auto">
                  {customers.filter(c => !customerSearch || c.firstName?.toLowerCase().includes(customerSearch.toLowerCase())).map(c => (
                    <button key={c.id} onMouseDown={() => { setSelectedGuestId(c.id); setShowCustomerDropdown(false); }} className="w-full px-4 py-2.5 text-left text-xs font-bold text-amber-300 hover:bg-amber-500/20 transition-colors">
                      {c.firstName} {c.lastName || ''} — {c.mobile || 'No phone'}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-4 py-3 no-scrollbar">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-20 gap-4">
              <ShoppingBag size={40} className="text-amber-700" />
              <p className="font-black text-[10px] uppercase tracking-widest text-amber-700">Empty Bar Cart</p>
            </div>
          ) : (
            <div className="space-y-2">
              {cart.map(item => {
                const pegSize = (item as any).pegSize;
                return (
                  <div key={item.id} className="rounded-2xl p-2.5 border" style={{ background: '#1a0f00', border: '1px solid #3d1f00' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#2a1500' }}>
                        <ProductIcon productName={item.name} size={16} className="text-amber-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[12px] font-black text-amber-200 truncate">{item.name}</h4>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-amber-500 font-black">₹{(item.sellingPrice * item.quantity).toFixed(0)}</span>
                          {pegSize && <span className="text-[8px] text-amber-700 font-bold">{pegSize}ml × {item.quantity}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="flex items-center gap-0.5 rounded-xl p-0.5" style={{ background: '#0d0d0d' }}>
                          <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 flex items-center justify-center text-amber-600 hover:text-red-400 rounded-lg"><Minus size={11} strokeWidth={3} /></button>
                          <span className="w-5 text-center text-[11px] font-black text-amber-200">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 flex items-center justify-center text-amber-600 hover:text-amber-400 rounded-lg"><Plus size={11} strokeWidth={3} /></button>
                        </div>
                        <button onClick={() => setCart(p => p.filter(i => i.id !== item.id))} className="w-6 h-6 rounded-lg flex items-center justify-center text-red-700 hover:text-red-400 hover:bg-red-500/10"><Trash2 size={11} /></button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Totals & Actions */}
        <div className="p-4 border-t space-y-3" style={{ background: '#0d0d0d', borderColor: '#2a1500' }}>
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] font-black uppercase tracking-widest" style={{ color: '#92400e' }}>
              <span>Subtotal</span><span className="text-amber-300">₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[11px] font-black uppercase tracking-widest" style={{ color: '#92400e' }}>
              <span>Taxes</span><span className="text-amber-300">₹{tax.toFixed(2)}</span>
            </div>
            <div className="h-px my-1" style={{ background: '#2a1500' }} />
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-amber-800">Total Payable</p>
                <p className="text-4xl font-black text-amber-400 tracking-tighter">₹{grandTotal.toFixed(2)}</p>
              </div>
              <ShoppingBag size={32} className="text-amber-800" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button loading={saveLoading} disabled={cart.length === 0} onClick={handleSave}
              className="py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-40"
              style={{ background: '#1a3d2a', border: '1px solid #22c55e40', color: '#22c55e' }}>
              <Save size={15} /> Save Order
            </Button>
            <Button disabled={cart.length === 0} onClick={handleSettle}
              className="py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-40"
              style={{ background: '#3d1a00', border: '1px solid #f9731640', color: '#f97316' }}>
              <CreditCard size={15} /> Settle
            </Button>
          </div>
        </div>
      </div>

      <BillModal
        bill={billData}
        onClose={() => { setIsBillOpen(false); setBillData(null); }}
        onSettle={handleSettleNew}
        paymentModes={paymentModes}
        customers={customers}
        guestId={selectedGuestId}
        onAddCustomer={async (data) => {
          const newGuest = await customersApi.create(data);
          if (newGuest) { setCustomers(p => [...p, newGuest]); return newGuest; }
          throw new Error('Failed');
        }}
        isProforma={false}
        autoPrint={false}
      />
    </div>
  );
}
