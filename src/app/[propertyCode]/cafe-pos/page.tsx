'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import {
  Coffee, Plus, Search, Trash2, User as UserIcon, CreditCard,
  Minus, Grid, List, ShoppingBag,
  Save, Lock, ChevronLeft, Droplets, X, Flame, Snowflake,
  Hash, FileText, Star, Package, Bike, UtensilsCrossed
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { productsApi, Product } from '@/lib/api/products';
import { categoriesApi, Category } from '@/lib/api/categories';
import { paymentModesApi, PaymentMode } from '@/lib/api/payment-modes';
import { customersApi, Customer } from '@/lib/api/customers';
import { BillModal, BillData } from '@/components/billing/BillModal';
import { useToast } from '@/components/ui/Toast';
import { useSidebar } from '@/context/sidebar-context';
import { ProductIcon } from '@/components/shared/product-icon';
import { Modal } from '@/components/ui/Modal';

// ── Types ──────────────────────────────────────────────────────────────────
type OrderType = 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
type Temp = 'HOT' | 'COLD';

interface CartItem extends Product {
  quantity: number;
  selectedVariantName?: string;
  note?: string;
  temp?: Temp;
  replacedFrom?: string; // name of the original item before replacement
}

// ── Constants ──────────────────────────────────────────────────────────────
const ACCENTS = [
  { color: '#D4956A', bg: 'rgba(212,149,106,0.10)', border: 'rgba(212,149,106,0.22)', glow: 'rgba(212,149,106,0.14)' },
  { color: '#C8845A', bg: 'rgba(200,132,90,0.10)',  border: 'rgba(200,132,90,0.22)',  glow: 'rgba(200,132,90,0.14)'  },
  { color: '#7FC8C0', bg: 'rgba(127,200,192,0.10)', border: 'rgba(127,200,192,0.22)', glow: 'rgba(127,200,192,0.14)' },
  { color: '#E8AC6A', bg: 'rgba(232,172,106,0.10)', border: 'rgba(232,172,106,0.22)', glow: 'rgba(232,172,106,0.14)' },
  { color: '#B890E0', bg: 'rgba(184,144,224,0.10)', border: 'rgba(184,144,224,0.22)', glow: 'rgba(184,144,224,0.14)' },
  { color: '#7CC8A0', bg: 'rgba(124,200,160,0.10)', border: 'rgba(124,200,160,0.22)', glow: 'rgba(124,200,160,0.14)' },
  { color: '#E87A8C', bg: 'rgba(232,122,140,0.10)', border: 'rgba(232,122,140,0.22)', glow: 'rgba(232,122,140,0.14)' },
  { color: '#54B8D8', bg: 'rgba(84,184,216,0.10)',  border: 'rgba(84,184,216,0.22)',  glow: 'rgba(84,184,216,0.14)'  },
];

const CAT_ICON_MAP: Record<string, string> = {
  coffee: '☕', tea: '🍵', latte: '☕', espresso: '☕', mocha: '☕', cappuccino: '☕',
  shake: '🥤', smoothie: '🥤', frappe: '🥤', juice: '🧃', cold: '🧊', iced: '🧊',
  pastry: '🥐', cake: '🍰', sandwich: '🥪', snacks: '🥨', dessert: '🍨',
  hot: '🔥', beverage: '🧋', waffle: '🧇', muffin: '🧁', cookie: '🍪',
  default: '☕',
};

// Items sold most — you can make this dynamic from sales data later
const POPULAR_KEYWORDS = ['latte', 'cappuccino', 'cold brew', 'frappe', 'espresso', 'chai', 'mocha'];
const isPopular = (name: string) =>
  POPULAR_KEYWORDS.some(k => name.toLowerCase().includes(k));

// Items that can be served hot OR cold
const CAN_BE_HOT_COLD = ['latte', 'coffee', 'tea', 'espresso', 'mocha', 'cappuccino', 'macchiato', 'americano'];
const canToggleTemp = (name: string) =>
  CAN_BE_HOT_COLD.some(k => name.toLowerCase().includes(k));

// Auto token counter (resets on page load — fine for counter service)
let _tokenCounter = Math.floor(Math.random() * 20) + 1;
const nextToken = () => `T-${String(++_tokenCounter).padStart(2, '0')}`;

// ── ORDER TYPE CONFIG ──────────────────────────────────────────────────────
const ORDER_TYPES: { key: OrderType; label: string; icon: React.ReactNode; color: string }[] = [
  { key: 'DINE_IN',   label: 'Dine-In',   icon: <UtensilsCrossed size={13} />, color: '#D4956A' },
  { key: 'TAKEAWAY',  label: 'Takeaway',  icon: <ShoppingBag size={13} />,    color: '#7FC8C0' },
  { key: 'DELIVERY',  label: 'Delivery',  icon: <Bike size={13} />,           color: '#B890E0' },
];

// ── COMPONENT ──────────────────────────────────────────────────────────────
export default function CafePosPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const propertyCode = params?.propertyCode;
  const p = propertyCode ? `/${propertyCode}` : '';
  const tableId = searchParams.get('tableId') || '';
  const tableNo = searchParams.get('tableNo') || searchParams.get('tableName') || '';
  const { setHidden, isOpen, setOpen } = useSidebar();
  const { addToast } = useToast();

  const [cafeEnabled,     setCafeEnabled]     = useState<boolean | null>(null);
  const [propertyId,      setPropertyId]      = useState<string | null>(null);
  const [products,        setProducts]        = useState<Product[]>([]);
  const [categories,      setCategories]      = useState<any[]>([]);
  const [paymentModes,    setPaymentModes]    = useState<any[]>([]);
  const [customers,       setCustomers]       = useState<any[]>([]);
  const [selectedCategory,    setSelectedCategory]    = useState<string>('all');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [search,          setSearch]          = useState('');
  const [cart,            setCart]            = useState<CartItem[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [viewMode,        setViewMode]        = useState<'grid' | 'list'>('grid');
  const [settleLoading,   setSettleLoading]   = useState(false);
  const [saveLoading,     setSaveLoading]     = useState(false);
  const [isBillOpen,      setIsBillOpen]      = useState(false);
  const [billData,        setBillData]        = useState<BillData | null>(null);
  const [selectedGuestId, setSelectedGuestId] = useState('');
  const [customerSearch,  setCustomerSearch]  = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [orderType,       setOrderType]       = useState<OrderType>('DINE_IN');
  const [currentToken,    setCurrentToken]    = useState(() => nextToken());
  const [variantProduct,  setVariantProduct]  = useState<Product | null>(null);
  const [noteTarget,      setNoteTarget]      = useState<{ id: string; variantName?: string } | null>(null);
  const [noteDraft,       setNoteDraft]       = useState('');
  const [replaceTarget,   setReplaceTarget]   = useState<CartItem | null>(null);
  const [replaceSearch,   setReplaceSearch]   = useState('');

  // Sidebar control
  useEffect(() => {
    if (!isOpen) setHidden(true);
    else setHidden(false);
  }, [isOpen, setHidden]);

  useEffect(() => {
    setOpen(false);
    setHidden(true);
    return () => { setOpen(true); setHidden(false); };
  }, [setOpen, setHidden]);

  // Data fetch
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const propRes  = await fetch('/api/setup/properties/current');
        const propData = await propRes.json();
        if (propData.success) {
          setCafeEnabled(!!propData.data.cafePosEnabled);
          setPropertyId(propData.data.id);
          if (!propData.data.cafePosEnabled) { setLoading(false); return; }
        }
        const [pData, cData, pmData, custData] = await Promise.all([
          productsApi.list(), categoriesApi.list(), paymentModesApi.list(), customersApi.list(),
        ]);
        setProducts((pData || []).filter((p: any) => p.menuType === 'CAFE'));
        setCategories((cData || []).filter((c: any) => c.menuType === 'CAFE'));
        setPaymentModes(pmData || []);
        setCustomers(custData || []);
      } catch { addToast('error', 'Failed to load Cafe POS data'); }
      finally { setLoading(false); }
    })();
  }, []);

  // ── Cart helpers ────────────────────────────────────────────────────────
  const addToCart = (product: Product, selectedVariant?: any) => {
    const variants = (product as any).variants || [];
    if (variants.length > 0 && !selectedVariant) {
      setVariantProduct(product);
      return;
    }
    const priceToUse   = selectedVariant ? selectedVariant.price : product.sellingPrice;
    const nameToUse    = selectedVariant ? `${product.name} (${selectedVariant.name})` : product.name;
    const defaultTemp: Temp = canToggleTemp(product.name) ? 'HOT' : 'HOT';

    setCart(prev => {
      const match = (i: CartItem) => selectedVariant
        ? i.id === product.id && i.selectedVariantName === selectedVariant.name
        : i.id === product.id && !i.selectedVariantName;
      const existing = prev.find(match);
      if (existing) return prev.map(i => match(i) ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, {
        ...product,
        name: nameToUse,
        sellingPrice: priceToUse,
        selectedVariantName: selectedVariant?.name,
        quantity: 1,
        temp: defaultTemp,
      }];
    });
    setVariantProduct(null);
  };

  const updateQuantity = (id: string, variantName: string | undefined, delta: number) => {
    setCart(prev => {
      const item = prev.find(i => i.id === id && i.selectedVariantName === variantName);
      if (!item) return prev;
      if (item.quantity + delta <= 0) return prev.filter(i => !(i.id === id && i.selectedVariantName === variantName));
      return prev.map(i => (i.id === id && i.selectedVariantName === variantName) ? { ...i, quantity: i.quantity + delta } : i);
    });
  };

  const toggleTemp = (id: string, variantName: string | undefined) => {
    setCart(prev => prev.map(i => (i.id === id && i.selectedVariantName === variantName)
      ? { ...i, temp: i.temp === 'HOT' ? 'COLD' : 'HOT' }
      : i
    ));
  };

  const saveNote = () => {
    if (!noteTarget) return;
    setCart(prev => prev.map(i =>
      (i.id === noteTarget.id && i.selectedVariantName === noteTarget.variantName)
        ? { ...i, note: noteDraft }
        : i
    ));
    setNoteTarget(null);
    setNoteDraft('');
  };

  const removeItem = (id: string, variantName: string | undefined) =>
    setCart(prev => prev.filter(i => !(i.id === id && i.selectedVariantName === variantName)));

  const replaceCartItem = (oldItem: CartItem, newProduct: Product, selectedVariant?: any) => {
    const priceToUse = selectedVariant ? selectedVariant.price : newProduct.sellingPrice;
    const nameToUse  = selectedVariant ? `${newProduct.name} (${selectedVariant.name})` : newProduct.name;
    const defaultTemp: Temp = canToggleTemp(newProduct.name) ? 'HOT' : 'HOT';
    const oldName = oldItem.name; // capture original name

    // Auto-log to waste management
    fetch('/api/waste', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: oldItem.id,
        productName: oldName,
        quantity: oldItem.quantity,
        reason: 'Customer Return',
        notes: `Replaced with ${nameToUse}`,
      })
    }).catch(err => console.error('Failed to log waste:', err));

    setCart(prev => {
      const match = (i: CartItem) => i.id === oldItem.id && i.selectedVariantName === oldItem.selectedVariantName;
      // Check if new product already exists in cart
      const newMatch = (i: CartItem) => selectedVariant
        ? i.id === newProduct.id && i.selectedVariantName === selectedVariant.name
        : i.id === newProduct.id && !i.selectedVariantName;
      const existingNew = prev.find(newMatch);
      if (existingNew) {
        // Merge qty into existing, remove old
        return prev
          .map(i => newMatch(i) ? { ...i, quantity: i.quantity + oldItem.quantity } : i)
          .filter(i => !match(i));
      }
      return prev.map(i => match(i) ? {
        ...newProduct,
        name: nameToUse,
        sellingPrice: priceToUse,
        selectedVariantName: selectedVariant?.name,
        quantity: oldItem.quantity,
        temp: defaultTemp,
        note: oldItem.note,
        replacedFrom: oldName, // store original name
      } : i);
    });
    setReplaceTarget(null);
    setReplaceSearch('');
  };

  const clearCart = () => {
    setCart([]);
    setCurrentToken(nextToken());
    setSelectedGuestId('');
  };

  // ── Category helpers ────────────────────────────────────────────────────
  const mainCategories      = categories.filter(c => !c.parentId);
  const currentSubCategories = selectedCategory !== 'all'
    ? categories.filter(c => c.parentId === selectedCategory)
    : [];

  const filteredProducts = products.filter(p => {
    let matchesCat = false;
    if (selectedCategory === 'all') {
      matchesCat = true;
    } else if (selectedCategory === 'breakfast') {
      matchesCat = !!(p.mealTimes && p.mealTimes.split(',').includes('BREAKFAST'));
    } else if (selectedCategory === 'lunch') {
      matchesCat = !!(p.mealTimes && p.mealTimes.split(',').includes('LUNCH'));
    } else if (selectedCategory === 'dinner') {
      matchesCat = !!(p.mealTimes && p.mealTimes.split(',').includes('DINNER'));
    } else if (selectedSubCategory && selectedSubCategory !== 'all') {
      matchesCat = p.categoryId === selectedSubCategory;
    } else {
      const pCat    = categories.find(c => c.id === p.categoryId);
      const parentId = pCat?.parentId;
      matchesCat = p.categoryId === selectedCategory || parentId === selectedCategory;
    }
    return matchesCat && p.name.toLowerCase().includes(search.toLowerCase());
  });

  // ── Totals ───────────────────────────────────────────────────────────────
  const subtotal   = cart.reduce((acc, i) => acc + i.sellingPrice * i.quantity, 0);
  const tax        = cart.reduce((acc, item) => {
    const rate = (item.taxRate ?? 5) / 100;
    return item.taxType === 'INCLUSIVE' ? acc : acc + item.sellingPrice * item.quantity * rate;
  }, 0);
  const grandTotal = subtotal + tax;

  // ── Save order ────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (cart.length === 0) return;
    setSaveLoading(true);
    try {
      const items = cart.map(item => ({
        productId: item.id,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.sellingPrice,
        variantName: item.selectedVariantName || null,
        notes: item.note || null,
        temp: item.temp || 'HOT',
        discountAmount: 0,
        taxAmount: item.sellingPrice * item.quantity * ((item.taxRate ?? 5) / 100),
      }));
      const res  = await fetch('/api/pos-orders', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          orderType, 
          tokenNo: currentToken, 
          items, 
          guestId: selectedGuestId || null,
          restaurantTableId: tableId || undefined
        }),
      });
      const data = await res.json();
      if (data.success) {
        addToast('success', `Cafe order saved! Token: ${currentToken}`);
        clearCart();
        if (tableId) {
          router.push(`${p}/operations/tables`);
        }
      } else addToast('error', data.message || 'Save failed');
    } catch { addToast('error', 'Failed to save order'); }
    finally { setSaveLoading(false); }
  };

  // ── Settle ────────────────────────────────────────────────────────────────
  const handleSettle = () => {
    if (cart.length === 0) return;
    const items = cart.map(item => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      price: item.sellingPrice,
      taxRate: item.taxRate ?? 5,
      taxType: item.taxType || 'EXCLUSIVE',
      taxAmount: item.sellingPrice * item.quantity * ((item.taxRate ?? 5) / 100),
      totalAmount: item.sellingPrice * item.quantity,
      discountAmount: 0,
      note: item.note || null,
      temp: item.temp || 'HOT',
    }));
    setBillData({
      orderNo: currentToken,
      orderType,
      items,
      subtotal,
      tax,
      grandTotal,
      createdAt: new Date().toISOString(),
      guestId: selectedGuestId || null,
      guestName: customers.find(c => c.id === selectedGuestId)?.firstName || '',
      tableId: tableId || undefined
    } as any);
    setIsBillOpen(true);
  };

  const handleSettleNew = async (payload: any) => {
    setSettleLoading(true);
    try {
      const res  = await fetch('/api/orders/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, tokenNo: currentToken, orderType }),
      });
      const data = await res.json();
      if (data.success) {
        addToast('success', `Order settled! Token ${currentToken} done ✓`);
        clearCart();
        setIsBillOpen(false);
      } else addToast('error', data.message || 'Settlement failed');
    } catch { addToast('error', 'Settlement failed'); }
    finally { setSettleLoading(false); }
  };

  // ── LOADING ───────────────────────────────────────────────────────────────
  if (loading || cafeEnabled === null) return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '18px', background: '#0E0A06' }}>
      <style>{`@keyframes spin-slow { to { transform: rotate(360deg); } }`}</style>
      <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'rgba(212,149,106,0.12)', border: '1px solid rgba(212,149,106,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 40px rgba(212,149,106,0.15)', animation: 'spin-slow 3s linear infinite' }}>
        <Coffee size={28} color="#D4956A" />
      </div>
      <p style={{ fontSize: '11px', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.25)', fontWeight: 600, textTransform: 'uppercase' }}>Brewing Cafe POS…</p>
    </div>
  );

  // ── DISABLED ──────────────────────────────────────────────────────────────
  if (!cafeEnabled) return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '28px', background: '#0E0A06' }}>
      <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'rgba(232,96,122,0.08)', border: '1px solid rgba(232,96,122,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 40px rgba(232,96,122,0.1)' }}>
        <Lock size={32} color="#E8607A" />
      </div>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#FFFFFF', marginBottom: '10px', letterSpacing: '-0.02em' }}>Cafe POS Disabled</h2>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', maxWidth: '340px', lineHeight: 1.7 }}>
          Cafe POS module is currently turned off. Enable it from Settings.
        </p>
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={() => router.push(`${p}/settings`)} style={{ padding: '11px 24px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #D4956A, #E8AC6A)', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
          Go to Settings
        </button>
        <button onClick={() => router.push(`${p}/billing`)} style={{ padding: '11px 24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
          Restaurant POS
        </button>
      </div>
    </div>
  );

  // ── MAIN ──────────────────────────────────────────────────────────────────
  const selectedOrderType = ORDER_TYPES.find(o => o.key === orderType)!;

  return (
    <div style={{
      display: 'flex', height: '100%', overflow: 'hidden',
      backgroundColor: '#0E0A06',
      backgroundImage: 'radial-gradient(ellipse at 10% 0%, rgba(212,149,106,0.07) 0%, transparent 50%), radial-gradient(ellipse at 90% 100%, rgba(200,132,90,0.05) 0%, transparent 50%)',
      fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      color: '#FFFFFF',
    }}>

      {/* ═══ LEFT — PRODUCTS ═══ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* TOP BAR */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', background: 'rgba(255,255,255,0.025)', borderBottom: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(24px)', flexShrink: 0 }}>

          <button onClick={() => router.push(`${p}/operations`)} style={{ width: '34px', height: '34px', borderRadius: '10px', flexShrink: 0, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', transition: 'all 0.15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.09)'; (e.currentTarget as HTMLElement).style.color = '#fff'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.35)'; }}
          >
            <ChevronLeft size={16} />
          </button>

          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px', flexShrink: 0 }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(212,149,106,0.14)', border: '1px solid rgba(212,149,106,0.32)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 18px rgba(212,149,106,0.14)' }}>
              <Coffee size={16} color="#D4956A" />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#D4956A', letterSpacing: '0.06em', lineHeight: 1 }}>CAFE POS</div>
              <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: '2px' }}>Specialty Coffee</div>
            </div>
          </div>

          {/* Search */}
          <div style={{ flex: 1, maxWidth: '400px', position: 'relative' }}>
            <Search size={13} color="rgba(255,255,255,0.18)" style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input
              type="text" placeholder="Search drinks, snacks…"
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '8px 12px 8px 33px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.05)', color: '#FFFFFF', fontSize: '12px', outline: 'none', transition: 'border-color 0.15s' }}
              onFocus={e => (e.target.style.borderColor = 'rgba(212,149,106,0.4)')}
              onBlur={e  => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
            />
          </div>

          {/* View Toggle */}
          <div style={{ display: 'flex', borderRadius: '10px', overflow: 'hidden', flexShrink: 0, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
            {(['grid', 'list'] as const).map(mode => (
              <button key={mode} onClick={() => setViewMode(mode)} style={{ width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', transition: 'all 0.15s', background: viewMode === mode ? 'rgba(212,149,106,0.18)' : 'transparent', color: viewMode === mode ? '#D4956A' : 'rgba(255,255,255,0.22)' }}>
                {mode === 'grid' ? <Grid size={14} /> : <List size={14} />}
              </button>
            ))}
          </div>

          <button onClick={() => router.push(`${p}/billing`)} style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '7px 15px', borderRadius: '10px', flexShrink: 0, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.04em', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.75)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.4)'; }}
          >
            <span style={{ fontSize: '14px' }}>🍽</span>
            <span>Restaurant POS</span>
          </button>
        </div>

        {/* CATEGORY PILLS */}
        <div style={{ display: 'flex', gap: '7px', padding: '9px 16px', overflowX: 'auto', flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.015)', scrollbarWidth: 'none' }}>
          <button onClick={() => { setSelectedCategory('all'); setSelectedSubCategory(null); }} style={{ flexShrink: 0, padding: '5px 16px', borderRadius: '999px', border: selectedCategory === 'all' ? '1px solid rgba(212,149,106,0.45)' : '1px solid rgba(255,255,255,0.08)', background: selectedCategory === 'all' ? 'rgba(212,149,106,0.14)' : 'rgba(255,255,255,0.03)', color: selectedCategory === 'all' ? '#D4956A' : 'rgba(255,255,255,0.35)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s', boxShadow: selectedCategory === 'all' ? '0 0 14px rgba(212,149,106,0.1)' : 'none' }}>
            ☕ All Items
          </button>

          <button onClick={() => { setSelectedCategory('breakfast'); setSelectedSubCategory(null); }} style={{ flexShrink: 0, padding: '5px 16px', borderRadius: '999px', border: selectedCategory === 'breakfast' ? '1px solid rgba(212,149,106,0.45)' : '1px solid rgba(255,255,255,0.08)', background: selectedCategory === 'breakfast' ? 'rgba(212,149,106,0.14)' : 'rgba(255,255,255,0.03)', color: selectedCategory === 'breakfast' ? '#D4956A' : 'rgba(255,255,255,0.35)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s', boxShadow: selectedCategory === 'breakfast' ? '0 0 14px rgba(212,149,106,0.1)' : 'none' }}>
            🍳 Breakfast
          </button>

          <button onClick={() => { setSelectedCategory('lunch'); setSelectedSubCategory(null); }} style={{ flexShrink: 0, padding: '5px 16px', borderRadius: '999px', border: selectedCategory === 'lunch' ? '1px solid rgba(212,149,106,0.45)' : '1px solid rgba(255,255,255,0.08)', background: selectedCategory === 'lunch' ? 'rgba(212,149,106,0.14)' : 'rgba(255,255,255,0.03)', color: selectedCategory === 'lunch' ? '#D4956A' : 'rgba(255,255,255,0.35)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s', boxShadow: selectedCategory === 'lunch' ? '0 0 14px rgba(212,149,106,0.1)' : 'none' }}>
            🍲 Lunch
          </button>

          <button onClick={() => { setSelectedCategory('dinner'); setSelectedSubCategory(null); }} style={{ flexShrink: 0, padding: '5px 16px', borderRadius: '999px', border: selectedCategory === 'dinner' ? '1px solid rgba(212,149,106,0.45)' : '1px solid rgba(255,255,255,0.08)', background: selectedCategory === 'dinner' ? 'rgba(212,149,106,0.14)' : 'rgba(255,255,255,0.03)', color: selectedCategory === 'dinner' ? '#D4956A' : 'rgba(255,255,255,0.35)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s', boxShadow: selectedCategory === 'dinner' ? '0 0 14px rgba(212,149,106,0.1)' : 'none' }}>
            🕯️ Dinner
          </button>

          {mainCategories.map((cat: any, idx: number) => {
            const catLower = cat.name.toLowerCase();
            const iconKey  = Object.keys(CAT_ICON_MAP).find(k => catLower.includes(k)) || 'default';
            const emoji    = CAT_ICON_MAP[iconKey];
            const isSelected = selectedCategory === cat.id;
            const accent     = ACCENTS[idx % ACCENTS.length];
            return (
              <button key={cat.id} onClick={() => { setSelectedCategory(cat.id); setSelectedSubCategory(null); }} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 16px', borderRadius: '999px', border: isSelected ? `1px solid ${accent.border}` : '1px solid rgba(255,255,255,0.08)', background: isSelected ? accent.bg : 'rgba(255,255,255,0.03)', color: isSelected ? accent.color : 'rgba(255,255,255,0.35)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s', boxShadow: isSelected ? `0 0 14px ${accent.glow}` : 'none' }}>
                <span style={{ fontSize: '12px' }}>{emoji}</span>
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>

        {/* SUBCATEGORY */}
        {currentSubCategories.length > 0 && (
          <div style={{ display: 'flex', gap: '7px', padding: '6px 16px', overflowX: 'auto', flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.15)', scrollbarWidth: 'none' }}>
            <button onClick={() => setSelectedSubCategory('all')} style={{ flexShrink: 0, padding: '4px 14px', borderRadius: '999px', border: !selectedSubCategory || selectedSubCategory === 'all' ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.05)', background: !selectedSubCategory || selectedSubCategory === 'all' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.02)', color: !selectedSubCategory || selectedSubCategory === 'all' ? '#FFFFFF' : 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s' }}>
              All {categories.find(c => c.id === selectedCategory)?.name}
            </button>
            {currentSubCategories.map((subCat: any) => {
              const isSelected = selectedSubCategory === subCat.id;
              return (
                <button key={subCat.id} onClick={() => setSelectedSubCategory(subCat.id)} style={{ flexShrink: 0, padding: '4px 14px', borderRadius: '999px', border: isSelected ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.05)', background: isSelected ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.02)', color: isSelected ? '#FFFFFF' : 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s' }}>
                  {subCat.name}
                </button>
              );
            })}
          </div>
        )}

        {/* PRODUCTS GRID / LIST */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.05) transparent' }}>
          {filteredProducts.length === 0 ? (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '14px', opacity: 0.2 }}>
              <Coffee size={44} color="rgba(255,255,255,0.4)" />
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>No Cafe Items Found</p>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)' }}>Add products with "Cafe Menu" type in Products page</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' }}>
              {filteredProducts.map((product: any, idx: number) => {
                const accent      = ACCENTS[idx % ACCENTS.length];
                const isInCart    = cart.some(i => i.id === product.id);
                const cartQty     = cart.reduce((a, i) => i.id === product.id ? a + i.quantity : a, 0);
                const stock       = product.stock ?? product.stockQuantity ?? null;
                const isOutOfStock = stock !== null && stock <= 0;
                const catName     = categories.find(c => c.id === product.categoryId)?.name || '';
                const popular     = isPopular(product.name);
                const hasVariants = (product.variants?.length || 0) > 0;

                return (
                  <button
                    key={product.id}
                    onClick={() => !isOutOfStock && addToCart(product)}
                    disabled={isOutOfStock}
                    style={{ position: 'relative', overflow: 'hidden', borderRadius: '16px', padding: 0, display: 'flex', flexDirection: 'column', textAlign: 'left', cursor: isOutOfStock ? 'not-allowed' : 'pointer', minHeight: '138px', background: isInCart ? `linear-gradient(145deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))` : `linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))`, border: isInCart ? `1px solid ${accent.color}55` : `1px solid rgba(255,255,255,0.08)`, opacity: isOutOfStock ? 0.35 : 1, transition: 'all 0.2s ease', boxShadow: isInCart ? `0 4px 24px ${accent.glow}, inset 0 1px 0 rgba(255,255,255,0.08)` : 'inset 0 1px 0 rgba(255,255,255,0.05)' }}
                    onMouseEnter={e => { if (!isOutOfStock) { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(-4px) scale(1.02)'; el.style.border = `1px solid ${accent.color}77`; el.style.boxShadow = `0 14px 40px ${accent.glow}, inset 0 1px 0 rgba(255,255,255,0.1)`; } }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(0) scale(1)'; el.style.border = isInCart ? `1px solid ${accent.color}55` : `1px solid rgba(255,255,255,0.08)`; el.style.boxShadow = isInCart ? `0 4px 24px ${accent.glow}, inset 0 1px 0 rgba(255,255,255,0.08)` : 'inset 0 1px 0 rgba(255,255,255,0.05)'; }}
                  >
                    {/* Accent top bar */}
                    <div style={{ height: '2px', background: `linear-gradient(90deg, ${accent.color}CC, transparent)`, borderRadius: '16px 16px 0 0', flexShrink: 0 }} />

                    {/* Popular badge */}
                    {popular && (
                      <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', alignItems: 'center', gap: '3px', background: 'rgba(255,193,7,0.18)', border: '1px solid rgba(255,193,7,0.35)', borderRadius: '999px', padding: '2px 7px', fontSize: '8px', fontWeight: 700, color: '#FFC107', letterSpacing: '0.04em' }}>
                        <Star size={8} fill="#FFC107" /> BEST
                      </div>
                    )}

                    <div style={{ flex: 1, padding: '8px 10px 10px', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '9px', fontWeight: 700, color: accent.color, letterSpacing: '0.08em', textTransform: 'uppercase', background: accent.bg, padding: '2px 8px', borderRadius: '999px', border: `1px solid ${accent.border}` }}>
                          {catName || 'Cafe'}
                        </span>
                        {isOutOfStock ? (
                          <span style={{ fontSize: '9px', fontWeight: 700, color: '#E8607A', background: 'rgba(232,96,122,0.12)', padding: '2px 7px', borderRadius: '999px', border: '1px solid rgba(232,96,122,0.25)' }}>OUT</span>
                        ) : cartQty > 0 ? (
                          <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: accent.color, color: '#0E0A06', fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{cartQty}</span>
                        ) : null}
                      </div>

                      <h3 style={{ fontSize: '12px', fontWeight: 600, color: '#FFFFFF', lineHeight: 1.35, marginBottom: '2px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {product.name}
                      </h3>

                      {hasVariants && (
                        <p style={{ fontSize: '9px', color: '#D4956A', fontWeight: 700, textTransform: 'uppercase', marginTop: '3px' }}>
                          {product.variants.length} Sizes ▾
                        </p>
                      )}

                      <p style={{ fontSize: '16px', fontWeight: 800, color: accent.color, marginTop: 'auto', letterSpacing: '-0.02em', paddingTop: '6px' }}>
                        ₹{product.sellingPrice.toFixed(0)}
                        {hasVariants && <span style={{ fontSize: '9px', fontWeight: 400, opacity: 0.4, marginLeft: '4px' }}>from</span>}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            /* LIST VIEW */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {filteredProducts.map((product: any, idx: number) => {
                const accent   = ACCENTS[idx % ACCENTS.length];
                const isInCart = cart.some(i => i.id === product.id);
                const popular  = isPopular(product.name);
                return (
                  <button key={product.id} onClick={() => addToCart(product)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 14px', borderRadius: '13px', background: isInCart ? accent.bg : 'rgba(255,255,255,0.03)', border: `1px solid ${isInCart ? accent.border : 'rgba(255,255,255,0.07)'}`, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '11px', flexShrink: 0, background: accent.bg, border: `1px solid ${accent.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ProductIcon productName={product.name} size={18} style={{ color: accent.color }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF', marginBottom: '2px' }}>{product.name}</h3>
                        {popular && <span style={{ fontSize: '8px', fontWeight: 700, color: '#FFC107', background: 'rgba(255,193,7,0.15)', padding: '1px 6px', borderRadius: '999px', border: '1px solid rgba(255,193,7,0.3)' }}>★ BEST</span>}
                      </div>
                      <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)' }}>{(product.variants?.length || 0)} size options</p>
                    </div>
                    <p style={{ fontSize: '15px', fontWeight: 700, color: accent.color, flexShrink: 0 }}>₹{product.sellingPrice.toFixed(0)}</p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ═══ RIGHT — CART ═══ */}
      <div style={{ width: '400px', flexShrink: 0, display: 'flex', flexDirection: 'column', borderLeft: '1px solid rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.22)', backdropFilter: 'blur(24px)' }}>

        {/* Cart Header — Token + Order Type */}
        <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>

          {/* Token Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: 'rgba(212,149,106,0.14)', border: '1px solid rgba(212,149,106,0.32)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Hash size={14} color="#D4956A" />
              </div>
              <div>
                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.22)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  {tableId ? 'Table' : 'Token No.'}
                </div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#D4956A', letterSpacing: '-0.01em', lineHeight: 1.1 }}>
                  {tableId ? tableNo : currentToken}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {cart.length > 0 && (
                <div style={{ padding: '4px 10px', borderRadius: '999px', background: 'rgba(212,149,106,0.12)', border: '1px solid rgba(212,149,106,0.25)', fontSize: '11px', fontWeight: 700, color: '#D4956A' }}>
                  {cart.reduce((s, i) => s + i.quantity, 0)} items
                </div>
              )}
              {cart.length > 0 && (
                <button onClick={clearCart} style={{ width: '28px', height: '28px', borderRadius: '8px', border: '1px solid rgba(232,96,122,0.25)', background: 'rgba(232,96,122,0.07)', color: 'rgba(232,96,122,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s', fontSize: '11px' }}
                  title="Clear cart"
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(232,96,122,0.15)'; (e.currentTarget as HTMLElement).style.color = '#E87A8C'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(232,96,122,0.07)'; (e.currentTarget as HTMLElement).style.color = 'rgba(232,96,122,0.6)'; }}
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* ORDER TYPE TABS */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
            {ORDER_TYPES.map(ot => {
              const isActive = orderType === ot.key;
              return (
                <button
                  key={ot.key}
                  onClick={() => setOrderType(ot.key)}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', padding: '8px 4px', borderRadius: '10px', border: isActive ? `1px solid ${ot.color}55` : '1px solid rgba(255,255,255,0.07)', background: isActive ? `rgba(${hexToRgb(ot.color)},0.12)` : 'rgba(255,255,255,0.03)', color: isActive ? ot.color : 'rgba(255,255,255,0.3)', fontSize: '11px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s', letterSpacing: '0.01em', boxShadow: isActive ? `0 4px 16px rgba(${hexToRgb(ot.color)},0.12)` : 'none' }}
                >
                  {ot.icon}
                  {ot.label}
                </button>
              );
            })}
          </div>

          {/* Customer Selector */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowCustomerDropdown(!showCustomerDropdown)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '9px', padding: '9px 13px', borderRadius: '11px', border: selectedGuestId ? '1px solid rgba(212,149,106,0.3)' : '1px solid rgba(255,255,255,0.08)', background: selectedGuestId ? 'rgba(212,149,106,0.07)' : 'rgba(255,255,255,0.04)', color: selectedGuestId ? '#D4956A' : 'rgba(255,255,255,0.3)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
            >
              <UserIcon size={13} />
              <span style={{ flex: 1, textAlign: 'left' }}>
                {selectedGuestId ? (customers.find(c => c.id === selectedGuestId)?.firstName || 'Guest') : 'Add customer (optional)'}
              </span>
              {selectedGuestId && (
                <span onClick={e => { e.stopPropagation(); setSelectedGuestId(''); }} style={{ fontSize: '13px', opacity: 0.45, cursor: 'pointer' }}>✕</span>
              )}
            </button>

            {showCustomerDropdown && !selectedGuestId && (
              <div style={{ position: 'absolute', top: 'calc(100% + 5px)', left: 0, right: 0, borderRadius: '13px', zIndex: 50, overflow: 'hidden', background: '#1A1208', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 16px 48px rgba(0,0,0,0.7)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '9px 13px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  <Search size={13} color="rgba(255,255,255,0.2)" />
                  <input autoFocus type="text" placeholder="Search customers…"
                    value={customerSearch} onChange={e => setCustomerSearch(e.target.value)}
                    style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: '12px', color: '#FFFFFF', flex: 1 }}
                  />
                </div>
                <div style={{ maxHeight: '168px', overflowY: 'auto' }}>
                  {customers.filter((c: any) => !customerSearch || c.firstName?.toLowerCase().includes(customerSearch.toLowerCase())).map((c: any) => (
                    <button key={c.id}
                      onMouseDown={() => { setSelectedGuestId(c.id); setShowCustomerDropdown(false); }}
                      style={{ width: '100%', padding: '10px 13px', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 500, color: 'rgba(255,255,255,0.6)', borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.1s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                    >
                      {c.firstName} {c.lastName || ''} — {c.mobile || 'No phone'}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {tableId && (
            <div style={{
              marginTop: '10px',
              padding: '9px 13px',
              borderRadius: '11px',
              background: 'rgba(212,149,106,0.1)',
              border: '1px solid rgba(212,149,106,0.22)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '9px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px' }}>☕</span>
                <div>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#D4956A', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
                    Linked to Table
                  </span>
                  <span style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#FFFFFF' }}>
                    Table {tableNo}
                  </span>
                </div>
              </div>
              <button
                onClick={() => router.push(window.location.pathname)}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.5)',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '10px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(232,96,122,0.15)'; e.currentTarget.style.color = '#E87A8C'; e.currentTarget.style.borderColor = 'rgba(232,96,122,0.25)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
              >
                Unlink
              </button>
            </div>
          )}
        </div>

        {/* CART ITEMS */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px', scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.05) transparent' }}>
          {cart.length === 0 ? (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', opacity: 0.18 }}>
              <Coffee size={40} color="rgba(255,255,255,0.6)" />
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>No items yet</p>
              <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>Tap a drink or snack to add</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {cart.map((item: any, idx: number) => {
                const accent       = ACCENTS[idx % ACCENTS.length];
                const canTemp      = canToggleTemp(item.name);

                return (
                  <div key={`${item.id}-${item.selectedVariantName}`} style={{ borderRadius: '12px', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', boxShadow: `0 2px 12px ${accent.glow}` }}>
                    
                    {/* Row 1: Name + Total */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <div style={{ flex: 1, minWidth: 0, marginRight: '8px' }}>
                        <h4 style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
                          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.28)', fontWeight: 500 }}>₹{item.sellingPrice.toFixed(0)} each</span>
                          {item.replacedFrom && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '9px', fontWeight: 700, color: '#54B8D8', background: 'rgba(84,184,216,0.1)', border: '1px solid rgba(84,184,216,0.25)', borderRadius: '999px', padding: '1px 7px', letterSpacing: '0.02em' }}>
                              ↩ Replaced: {item.replacedFrom}
                            </span>
                          )}
                        </div>
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: accent.color, flexShrink: 0 }}>₹{(item.sellingPrice * item.quantity).toFixed(0)}</span>
                    </div>

                    {/* Row 2: Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>

                      {/* Hot/Cold toggle (only for applicable items) */}
                      {canTemp && (
                        <button
                          onClick={() => toggleTemp(item.id, item.selectedVariantName)}
                          title={item.temp === 'HOT' ? 'Switch to Iced' : 'Switch to Hot'}
                          style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 9px', borderRadius: '7px', border: item.temp === 'HOT' ? '1px solid rgba(255,140,50,0.35)' : '1px solid rgba(84,184,216,0.35)', background: item.temp === 'HOT' ? 'rgba(255,140,50,0.1)' : 'rgba(84,184,216,0.1)', color: item.temp === 'HOT' ? '#FF9040' : '#54B8D8', fontSize: '10px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0 }}
                        >
                          {item.temp === 'HOT' ? <Flame size={10} /> : <Snowflake size={10} />}
                          {item.temp === 'HOT' ? 'Hot' : 'Iced'}
                        </button>
                      )}

                      {/* Note button */}
                      <button
                        onClick={() => { setNoteTarget({ id: item.id, variantName: item.selectedVariantName }); setNoteDraft(item.note || ''); }}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 9px', borderRadius: '7px', border: item.note ? '1px solid rgba(212,149,106,0.35)' : '1px solid rgba(255,255,255,0.1)', background: item.note ? 'rgba(212,149,106,0.1)' : 'rgba(255,255,255,0.04)', color: item.note ? '#D4956A' : 'rgba(255,255,255,0.35)', fontSize: '10px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0 }}
                        title="Add special instructions"
                      >
                        <FileText size={10} />
                        {item.note ? 'Note ✓' : 'Note'}
                      </button>

                      {/* Spacer */}
                      <div style={{ flex: 1 }} />

                      {/* Qty controls */}
                      <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '2px', border: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
                        <button onClick={() => updateQuantity(item.id, item.selectedVariantName, -1)} style={{ width: '22px', height: '22px', borderRadius: '6px', border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#E87A8C'}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.5)'}
                        ><Minus size={10} strokeWidth={2.5} /></button>
                        <span style={{ width: '20px', textAlign: 'center', fontSize: '12px', fontWeight: 700, color: '#FFFFFF' }}>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.selectedVariantName, 1)} style={{ width: '22px', height: '22px', borderRadius: '6px', border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#7CC8A0'}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.5)'}
                        ><Plus size={10} strokeWidth={2.5} /></button>
                      </div>

                      {/* Delete */}
                      <button onClick={() => removeItem(item.id, item.selectedVariantName)} style={{ width: '26px', height: '26px', borderRadius: '7px', border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(232,122,140,0.55)', transition: 'all 0.15s' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(232,122,140,0.1)'; (e.currentTarget as HTMLElement).style.color = '#E87A8C'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(232,122,140,0.55)'; }}
                      ><Trash2 size={12} /></button>

                      {/* Replace */}
                      <button
                        onClick={() => { setReplaceTarget(item); setReplaceSearch(''); }}
                        title="Replace item"
                        style={{ width: '26px', height: '26px', borderRadius: '7px', border: '1px solid rgba(84,184,216,0.28)', background: 'rgba(84,184,216,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(84,184,216,0.7)', transition: 'all 0.15s', flexShrink: 0 }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(84,184,216,0.18)'; (e.currentTarget as HTMLElement).style.color = '#54B8D8'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(84,184,216,0.07)'; (e.currentTarget as HTMLElement).style.color = 'rgba(84,184,216,0.7)'; }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 4v6h6"/><path d="M23 20v-6h-6"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15"/></svg>
                      </button>
                    </div>

                    {/* Note preview */}
                    {item.note && (
                      <div style={{ marginTop: '6px', padding: '5px 9px', borderRadius: '7px', background: 'rgba(212,149,106,0.07)', border: '1px solid rgba(212,149,106,0.15)', fontSize: '10px', color: 'rgba(212,149,106,0.75)', fontStyle: 'italic' }}>
                        💬 {item.note}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* TOTALS + ACTIONS */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.3)', padding: '14px 18px', flexShrink: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.28)', fontWeight: 500 }}>Subtotal</span>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)', fontWeight: 600 }}>₹{subtotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.28)', fontWeight: 500 }}>GST / Taxes</span>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)', fontWeight: 600 }}>₹{tax.toFixed(2)}</span>
            </div>
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)', margin: '4px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.22)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, marginBottom: '3px' }}>Total Payable</p>
                <p style={{ fontSize: '28px', fontWeight: 800, color: '#D4956A', letterSpacing: '-0.03em', lineHeight: 1 }}>₹{grandTotal.toFixed(2)}</p>
              </div>
              {/* Order type pill */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '8px', background: `rgba(${hexToRgb(selectedOrderType.color)},0.12)`, border: `1px solid rgba(${hexToRgb(selectedOrderType.color)},0.3)`, color: selectedOrderType.color, fontSize: '11px', fontWeight: 700 }}>
                  {selectedOrderType.icon}
                  {selectedOrderType.label}
                </div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', fontWeight: 600 }}>Token: {currentToken}</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '9px' }}>
            <Button loading={saveLoading} disabled={cart.length === 0} onClick={handleSave}
              style={{ padding: '12px 0', borderRadius: '12px', border: '1px solid rgba(212,149,106,0.25)', background: 'rgba(212,149,106,0.08)', color: cart.length === 0 ? 'rgba(212,149,106,0.25)' : '#D4956A', fontSize: '12px', fontWeight: 700, letterSpacing: '0.03em', cursor: cart.length === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', opacity: cart.length === 0 ? 0.45 : 1, transition: 'all 0.15s' } as any}
            >
              <Save size={14} /> Save KOT
            </Button>

            <Button disabled={cart.length === 0} onClick={handleSettle}
              style={{ padding: '12px 0', borderRadius: '12px', border: 'none', background: cart.length === 0 ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, #C8845A, #E8AC6A)', color: cart.length === 0 ? 'rgba(255,255,255,0.18)' : '#0E0A06', fontSize: '12px', fontWeight: 800, letterSpacing: '0.03em', cursor: cart.length === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', opacity: cart.length === 0 ? 0.45 : 1, boxShadow: cart.length === 0 ? 'none' : '0 6px 22px rgba(212,149,106,0.32)', transition: 'all 0.15s' } as any}
            >
              <CreditCard size={14} /> Bill & Pay
            </Button>
          </div>
        </div>
      </div>

      {/* ═══ SIZE / VARIANT MODAL ═══ */}
      <Modal isOpen={!!variantProduct} onClose={() => setVariantProduct(null)} title="Choose Size" maxWidth="md">
        <div style={{ padding: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '24px', padding: '16px', background: 'rgba(212,149,106,0.06)', borderRadius: '20px', border: '1px solid rgba(212,149,106,0.15)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(212,149,106,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Coffee size={24} color="#D4956A" />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.01em' }}>{variantProduct?.name}</h3>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '2px' }}>Choose your cup size</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
            {(variantProduct as any)?.variants?.map((v: any, i: number) => (
              <button key={i} onClick={() => addToCart(variantProduct!, v)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderRadius: '18px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(212,149,106,0.1)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(212,149,106,0.3)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '16px' }}>{i === 0 ? '🥤' : i === 1 ? '☕' : '🍵'}</span>
                  </div>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}>{v.name}</span>
                </div>
                <span style={{ fontSize: '18px', fontWeight: 800, color: '#D4956A' }}>₹{v.price}</span>
              </button>
            ))}
          </div>

          <button onClick={() => setVariantProduct(null)}
            style={{ width: '100%', marginTop: '20px', padding: '14px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.4)', fontSize: '12px', fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em' }}
          >
            Cancel
          </button>
        </div>
      </Modal>

      {/* ═══ ITEM NOTE MODAL ═══ */}
      <Modal isOpen={!!noteTarget} onClose={() => setNoteTarget(null)} title="Special Instructions" maxWidth="sm">
        <div style={{ padding: '8px' }}>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginBottom: '16px', lineHeight: 1.6 }}>
            Add preparation notes like "less sugar", "extra shot", "no ice", "extra hot"…
          </p>
          <textarea
            autoFocus
            placeholder="e.g. Less sugar, extra milk foam…"
            value={noteDraft}
            onChange={e => setNoteDraft(e.target.value)}
            rows={3}
            style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid rgba(212,149,106,0.3)', background: 'rgba(212,149,106,0.05)', color: '#FFFFFF', fontSize: '13px', outline: 'none', resize: 'none', fontFamily: 'inherit', lineHeight: 1.6, boxSizing: 'border-box' }}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '9px', marginTop: '14px' }}>
            {noteDraft && (
              <button onClick={() => setNoteDraft('')} style={{ padding: '11px', borderRadius: '12px', border: '1px solid rgba(232,122,140,0.25)', background: 'rgba(232,122,140,0.07)', color: '#E87A8C', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                Clear Note
              </button>
            )}
            <button onClick={saveNote} style={{ padding: '11px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #C8845A, #E8AC6A)', color: '#0E0A06', fontSize: '12px', fontWeight: 800, cursor: 'pointer', gridColumn: noteDraft ? 'auto' : '1 / -1' }}>
              Save Note ✓
            </button>
          </div>
        </div>
      </Modal>

      <BillModal
        bill={billData}
        onClose={(settled) => { 
          setIsBillOpen(false); 
          setBillData(null); 
          if (settled) {
            clearCart();
            if (tableId) {
              router.push(`${p}/operations/tables`);
            }
          }
        }}
        onSettle={handleSettleNew}
        paymentModes={paymentModes}
        customers={customers}
        guestId={selectedGuestId}
        onAddCustomer={async (data) => {
          const newGuest = await customersApi.create(data);
          if (newGuest) { setCustomers(p => [...p, newGuest]); return newGuest; }
          throw new Error('Failed');
        }}
        isProforma={true}
        autoPrint={false}
      />

      {/* ═══ REPLACE ITEM MODAL ═══ */}
      <Modal isOpen={!!replaceTarget} onClose={() => { setReplaceTarget(null); setReplaceSearch(''); }} title={`Replace: ${replaceTarget?.name?.split('(')[0].trim() || ''}`} maxWidth="md">
        {replaceTarget && (
          <div style={{ padding: '8px' }}>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginBottom: '14px', lineHeight: 1.6 }}>
              Pick a product to replace this item — qty ({replaceTarget.quantity}) will be kept.
            </p>
            {/* Search */}
            <div style={{ position: 'relative', marginBottom: '12px' }}>
              <Search size={13} color="rgba(255,255,255,0.2)" style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                autoFocus
                type="text"
                placeholder="Search product…"
                value={replaceSearch}
                onChange={e => setReplaceSearch(e.target.value)}
                style={{ width: '100%', padding: '9px 12px 9px 34px', borderRadius: '12px', border: '1px solid rgba(84,184,216,0.3)', background: 'rgba(84,184,216,0.05)', color: '#FFFFFF', fontSize: '12px', outline: 'none', transition: 'border-color 0.15s', boxSizing: 'border-box' }}
                onFocus={e => (e.target.style.borderColor = 'rgba(84,184,216,0.6)')}
                onBlur={e  => (e.target.style.borderColor = 'rgba(84,184,216,0.3)')}
              />
            </div>
            {/* Product list */}
            <div style={{ maxHeight: '340px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.05) transparent' }}>
              {products
                .filter(p => p.name.toLowerCase().includes(replaceSearch.toLowerCase()))
                .slice(0, 40)
                .map((p, idx) => {
                  const accent = ACCENTS[idx % ACCENTS.length];
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        const variants = (p as any).variants || [];
                        if (variants.length > 0) {
                          // Show variant selector inline — for now pick first variant or full
                          replaceCartItem(replaceTarget, p);
                        } else {
                          replaceCartItem(replaceTarget, p);
                        }
                      }}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', borderRadius: '13px', background: 'rgba(255,255,255,0.03)', border: `1px solid rgba(255,255,255,0.08)`, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}
                      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = accent.bg; el.style.borderColor = accent.border; }}
                      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(255,255,255,0.03)'; el.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</p>
                        <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '1px' }}>{categories.find(c => c.id === (p as any).categoryId)?.name || 'Cafe'}</p>
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: 800, color: accent.color, marginLeft: '12px', flexShrink: 0 }}>₹{p.sellingPrice.toFixed(0)}</span>
                    </button>
                  );
                })}
              {products.filter(p => p.name.toLowerCase().includes(replaceSearch.toLowerCase())).length === 0 && (
                <p style={{ textAlign: 'center', fontSize: '11px', color: 'rgba(255,255,255,0.2)', padding: '24px 0' }}>No products found</p>
              )}
            </div>
            <button
              onClick={() => { setReplaceTarget(null); setReplaceSearch(''); }}
              style={{ width: '100%', marginTop: '16px', padding: '12px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.4)', fontSize: '12px', fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em' }}
            >
              Cancel
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ── Utility: hex color to "r,g,b" string for rgba() ──
function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}