'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import {
  Plus, Search, Trash2, User as UserIcon, CreditCard,
  Minus, Grid, List, ShoppingBag,
  Save, FlaskConical, Wine, Lock, ChevronLeft, Droplets, X
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
import { Modal } from '@/components/ui/Modal';

interface CartItem extends Product { 
  quantity: number; 
  selectedVariantName?: string;
}

// Jewel-tone accent palette — each category gets a distinct vibrant color
const ACCENTS = [
  { color: '#E8A838', bg: 'rgba(232,168,56,0.10)', border: 'rgba(232,168,56,0.22)', glow: 'rgba(232,168,56,0.16)' },
  { color: '#7C6DFA', bg: 'rgba(124,109,250,0.10)', border: 'rgba(124,109,250,0.22)', glow: 'rgba(124,109,250,0.16)' },
  { color: '#3DBFA8', bg: 'rgba(61,191,168,0.10)', border: 'rgba(61,191,168,0.22)', glow: 'rgba(61,191,168,0.16)' },
  { color: '#E8607A', bg: 'rgba(232,96,122,0.10)', border: 'rgba(232,96,122,0.22)', glow: 'rgba(232,96,122,0.16)' },
  { color: '#54C4F0', bg: 'rgba(84,196,240,0.10)', border: 'rgba(84,196,240,0.22)', glow: 'rgba(84,196,240,0.16)' },
  { color: '#B87FE8', bg: 'rgba(184,127,232,0.10)', border: 'rgba(184,127,232,0.22)', glow: 'rgba(184,127,232,0.16)' },
  { color: '#5ED4A0', bg: 'rgba(94,212,160,0.10)', border: 'rgba(94,212,160,0.22)', glow: 'rgba(94,212,160,0.16)' },
  { color: '#F0934C', bg: 'rgba(240,147,76,0.10)', border: 'rgba(240,147,76,0.22)', glow: 'rgba(240,147,76,0.16)' },
];

const WMOJI: Record<string, string> = {
  premium: '⭐', wine: '🍷', beer: '🍺', whisky: '🥃', whiskey: '🥃',
  rum: '🥤', scotch: '🥃', vodka: '🍸', gin: '🍹', liquor: '🥃',
  champagne: '🍾', cocktail: '🍹', default: '🍷',
};

const CAT_ICON_MAP: Record<string, string> = {
  premium: '⭐', wine: '🍷', beer: '🍺', whisky: '🥃', whiskey: '🥃',
  rum: '🥤', scotch: '🥃', vodka: '🍸', gin: '🍹', brandy: '🥂',
  tequila: '🌵', cocktail: '🍹', mocktail: '🧃', soft: '🥤', juice: '🍊',
  liquor: '🥃', spirits: '🥃', champagne: '🍾', cider: '🍺', bourbon: '🥃', absinthe: '🍸',
};

export default function BarPosView({
  terminalMode = 'BAR',
}: {
  terminalMode?: 'RESTAURANT' | 'BAR' | 'CAFE';
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const propertyCode = params?.propertyCode as string | undefined;
  const p = propertyCode ? `/${propertyCode}` : '';
  const tableId = searchParams.get('tableId') || '';
  const tableNo = searchParams.get('tableNo') || searchParams.get('tableName') || '';
  const { setOpen } = useSidebar();
  const { addToast } = useToast();

  const [barEnabled, setBarEnabled] = useState<boolean | null>(null);
  const [cafePosEnabled, setCafePosEnabled] = useState(false);
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

  // Variant selection state
  const [variantProduct, setVariantProduct] = useState<Product | null>(null);

  useEffect(() => { setOpen(false); return () => setOpen(true); }, [setOpen]);

  // Sidebar effect

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const propRes = await fetch('/api/setup/properties/current');
        const propData = await propRes.json();
        if (propData.success) {
          setBarEnabled(!!propData.data.barPosEnabled);
          setCafePosEnabled(!!propData.data.cafePosEnabled);
          setPropertyId(propData.data.id);
          if (!propData.data.barPosEnabled) { setLoading(false); return; }
        }
        const [pData, cData, pmData, custData] = await Promise.all([
          productsApi.list(), categoriesApi.list(), paymentModesApi.list(), customersApi.list(),
        ]);
        setProducts((pData || []).filter((p: any) => p.menuType === terminalMode || (terminalMode === 'RESTAURANT' && !p.menuType)));
        setCategories((cData || []).filter((c: any) => c.menuType === terminalMode || (terminalMode === 'RESTAURANT' && !c.menuType)));
        setPaymentModes(pmData || []);
        setCustomers(custData || []);
      } catch { addToast('error', `Failed to load ${terminalMode === 'RESTAURANT' ? 'Restaurant' : terminalMode === 'CAFE' ? 'Cafe' : 'Bar'} POS data`); }
      finally { setLoading(false); }
    })();
  }, []);

  const addToCart = (product: Product, selectedVariant?: any) => {
    const variants = (product as any).variants || [];
    
    // If product has multiple variants and none is selected yet, show selector
    if (variants.length > 0 && !selectedVariant) {
      setVariantProduct(product);
      return;
    }

    const priceToUse = selectedVariant ? selectedVariant.price : product.sellingPrice;
    const nameToUse = selectedVariant ? `${product.name} (${selectedVariant.name})` : product.name;
    const variantId = selectedVariant ? `${product.id}-${selectedVariant.name}` : product.id;

    setCart(prev => {
      const existing = prev.find(i => (selectedVariant ? i.id === product.id && i.selectedVariantName === selectedVariant.name : i.id === product.id));
      if (existing) {
        return prev.map(i => (selectedVariant ? (i.id === product.id && i.selectedVariantName === selectedVariant.name) : i.id === product.id) 
          ? { ...i, quantity: i.quantity + 1 } 
          : i
        );
      }
      return [...prev, { 
        ...product, 
        name: nameToUse,
        sellingPrice: priceToUse,
        selectedVariantName: selectedVariant?.name,
        quantity: 1 
      }];
    });

    setVariantProduct(null);
  };

  const updateQuantity = (cartId: string, variantName: string | undefined, delta: number) => {
    setCart(prev => {
      const item = prev.find(i => i.id === cartId && i.selectedVariantName === variantName);
      if (!item) return prev;
      if (item.quantity + delta <= 0) return prev.filter(i => !(i.id === cartId && i.selectedVariantName === variantName));
      return prev.map(i => (i.id === cartId && i.selectedVariantName === variantName) ? { ...i, quantity: i.quantity + delta } : i);
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
        name: item.name,
        quantity: item.quantity, 
        unitPrice: item.sellingPrice,
        variantName: item.selectedVariantName || null,
        discountAmount: 0, 
        taxAmount: item.sellingPrice * item.quantity * ((item.taxRate ?? 5) / 100),
      }));
      const res = await fetch('/api/pos-orders', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          orderType: 'DINE_IN', 
          items, 
          guestId: selectedGuestId || null,
          restaurantTableId: tableId || undefined
        }),
      });
      const data = await res.json();
      if (data.success) { 
        addToast('success', `${terminalMode === 'RESTAURANT' ? 'Restaurant' : terminalMode === 'CAFE' ? 'Cafe' : 'Bar'} order saved!`); 
        setCart([]); 
        if (tableId) {
          router.push(`${p}/operations/tables`);
        }
      }
      else addToast('error', data.message || 'Save failed');
    } catch { addToast('error', 'Failed to save order'); }
    finally { setSaveLoading(false); }
  };

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
    }));
    setBillData({ 
      orderNo: `BAR-${Date.now()}`, 
      orderType: 'DINE_IN', 
      items, 
      subtotal, 
      tax: tax, 
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
      const res = await fetch('/api/orders/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) { addToast('success', `${terminalMode === 'RESTAURANT' ? 'Restaurant' : terminalMode === 'CAFE' ? 'Cafe' : 'Bar'} order settled!`); setCart([]); setIsBillOpen(false); }
      else addToast('error', data.message || 'Settlement failed');
    } catch { addToast('error', 'Settlement failed'); }
    finally { setSettleLoading(false); }
  };

  // ── LOADING STATE ──
  if (loading || barEnabled === null) return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: '18px',
      background: '#080810',
    }}>
      <style>{`@keyframes spin-slow { to { transform: rotate(360deg); } }`}</style>
      <div style={{
        width: '64px', height: '64px', borderRadius: '20px',
        background: 'linear-gradient(135deg, rgba(232,168,56,0.15), rgba(232,168,56,0.05))',
        border: '1px solid rgba(232,168,56,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 0 40px rgba(232,168,56,0.12)',
        animation: 'spin-slow 3s linear infinite',
      }}>
        <Wine size={28} color="#E8A838" />
      </div>
      <p style={{ fontSize: '11px', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.2)', fontWeight: 600, textTransform: 'uppercase' }}>
        Loading {terminalMode === 'RESTAURANT' ? 'Restaurant' : terminalMode === 'CAFE' ? 'Cafe' : 'Bar'} POS
      </p>
    </div>
  );

  // ── DISABLED STATE ──
  if (!barEnabled) return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: '28px',
      background: '#080810',
    }}>
      <div style={{
        width: '80px', height: '80px', borderRadius: '24px',
        background: 'rgba(232,96,122,0.08)',
        border: '1px solid rgba(232,96,122,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 0 40px rgba(232,96,122,0.1)',
      }}>
        <Lock size={32} color="#E8607A" />
      </div>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#FFFFFF', marginBottom: '10px', letterSpacing: '-0.02em' }}>
          {terminalMode === 'RESTAURANT' ? 'Restaurant' : terminalMode === 'CAFE' ? 'Cafe' : 'Bar'} POS Disabled
        </h2>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', maxWidth: '340px', lineHeight: 1.7 }}>
          {terminalMode === 'RESTAURANT' ? 'Restaurant' : terminalMode === 'CAFE' ? 'Cafe' : 'Bar'} POS module is currently turned off. Enable it from Settings.
        </p>
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={() => router.push(`${p}/settings`)} style={{
          padding: '11px 24px', borderRadius: '12px', border: 'none',
          background: 'linear-gradient(135deg, #7C6DFA, #A090FF)',
          color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
          boxShadow: '0 8px 24px rgba(124,109,250,0.3)',
        }}>
          Go to Settings
        </button>
        <button onClick={() => router.push(`${p}/billing`)} style={{
          padding: '11px 24px', borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(255,255,255,0.04)',
          color: 'rgba(255,255,255,0.5)', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
        }}>
          Restaurant POS
        </button>
      </div>
    </div>
  );

  // ── MAIN BAR POS ──
  return (
    <div style={{
      display: 'flex', height: '100vh', overflow: 'hidden',
      background: '#080810',
      fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      color: '#FFFFFF',
    }}>

      {/* ═══════════ LEFT — PRODUCTS ═══════════ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* TOP BAR */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '10px 16px',
          background: 'rgba(255,255,255,0.025)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          backdropFilter: 'blur(24px)',
          flexShrink: 0,
          zIndex: 10,
        }}>

          {/* Back */}
          <button onClick={() => router.push(`${p}/operations`)} style={{
            width: '34px', height: '34px', borderRadius: '10px', flexShrink: 0,
            border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'rgba(255,255,255,0.35)', transition: 'all 0.15s',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.09)'; (e.currentTarget as HTMLElement).style.color = '#fff'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.35)'; }}
          >
            <ChevronLeft size={16} />
          </button>

          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px', flexShrink: 0 }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '10px',
              background: 'rgba(232,168,56,0.12)', border: '1px solid rgba(232,168,56,0.28)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 18px rgba(232,168,56,0.12)',
            }}>
              <Wine size={16} color="#E8A838" />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#E8A838', letterSpacing: '0.06em', lineHeight: 1 }}>
                {terminalMode === 'RESTAURANT' ? 'RESTAURANT POS' : terminalMode === 'CAFE' ? 'CAFE POS' : 'BAR POS'}
              </div>
              <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: '2px' }}>
                {terminalMode === 'RESTAURANT' ? 'Classic Dining' : terminalMode === 'CAFE' ? 'Quick Bites & Coffee' : 'Premium Bar'}
              </div>
            </div>
          </div>

          {/* Search */}
          <div style={{ flex: 1, maxWidth: '400px', position: 'relative' }}>
            <Search size={13} color="rgba(255,255,255,0.18)" style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input
              type="text" placeholder={terminalMode === 'RESTAURANT' ? 'Search menu items...' : terminalMode === 'CAFE' ? 'Search drinks, snacks...' : 'Search drinks, spirits...'}
              value={search} onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '8px 12px 8px 33px',
                borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.05)', color: '#FFFFFF',
                fontSize: '12px', outline: 'none', transition: 'border-color 0.15s',
              }}
              onFocus={e => (e.target.style.borderColor = 'rgba(232,168,56,0.35)')}
              onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
            />
          </div>

          {/* View Toggle */}
          <div style={{
            display: 'flex', borderRadius: '10px', overflow: 'hidden', flexShrink: 0,
            border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)',
          }}>
            {(['grid', 'list'] as const).map(mode => (
              <button key={mode} onClick={() => setViewMode(mode)} style={{
                width: '34px', height: '34px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                background: viewMode === mode ? 'rgba(232,168,56,0.18)' : 'transparent',
                color: viewMode === mode ? '#E8A838' : 'rgba(255,255,255,0.22)',
              }}>
                {mode === 'grid' ? <Grid size={14} /> : <List size={14} />}
              </button>
            ))}
          </div>

          {/* ── POS MODE SWITCHER ── */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px',
            padding: '3px',
          }}>
            {/* Restaurant POS */}
            <button
              onClick={terminalMode !== 'RESTAURANT' ? () => router.push(`${p}/billing`) : undefined}
              title={terminalMode === 'RESTAURANT' ? "Restaurant POS (Active)" : "Switch to Restaurant POS"}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 13px', borderRadius: '9px',
                border: terminalMode === 'RESTAURANT' ? '1px solid rgba(255,255,255,0.45)' : 'none',
                background: terminalMode === 'RESTAURANT' ? 'linear-gradient(135deg, rgba(255,255,255,0.22), rgba(255,255,255,0.1))' : 'transparent',
                color: terminalMode === 'RESTAURANT' ? '#FFFFFF' : 'rgba(255,255,255,0.35)',
                fontSize: '11px', fontWeight: terminalMode === 'RESTAURANT' ? 700 : 600,
                letterSpacing: '0.03em', cursor: terminalMode === 'RESTAURANT' ? 'default' : 'pointer',
                whiteSpace: 'nowrap', transition: 'all 0.18s',
              }}
              onMouseEnter={terminalMode !== 'RESTAURANT' ? e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.7)'; } : undefined}
              onMouseLeave={terminalMode !== 'RESTAURANT' ? e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.35)'; } : undefined}
            >
              <span style={{ fontSize: '14px', lineHeight: 1 }}>🍽</span>
              <span>Restaurant</span>
            </button>

            {/* Bar POS */}
            <button
              onClick={terminalMode !== 'BAR' ? () => router.push(`${p}/bar-pos`) : undefined}
              title={terminalMode === 'BAR' ? "Bar POS (Active)" : "Switch to Bar POS"}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 13px', borderRadius: '9px',
                border: terminalMode === 'BAR' ? '1px solid rgba(232,168,56,0.45)' : 'none',
                background: terminalMode === 'BAR' ? 'linear-gradient(135deg, rgba(232,168,56,0.22), rgba(232,168,56,0.1))' : 'transparent',
                color: terminalMode === 'BAR' ? '#E8A838' : 'rgba(255,255,255,0.35)',
                fontSize: '11px', fontWeight: terminalMode === 'BAR' ? 700 : 600,
                letterSpacing: '0.03em', cursor: terminalMode === 'BAR' ? 'default' : 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: terminalMode === 'BAR' ? '0 2px 12px rgba(232,168,56,0.18)' : 'none',
                transition: 'all 0.18s',
              }}
              onMouseEnter={terminalMode !== 'BAR' ? e => { (e.currentTarget as HTMLElement).style.background = 'rgba(232,168,56,0.1)'; (e.currentTarget as HTMLElement).style.color = '#E8A838'; } : undefined}
              onMouseLeave={terminalMode !== 'BAR' ? e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.35)'; } : undefined}
            >
              <span style={{ fontSize: '14px', lineHeight: 1 }}>🍺</span>
              <span>Bar POS</span>
            </button>

            {/* Cafe POS — only if cafePosEnabled */}
            {cafePosEnabled && (
              <button
                onClick={terminalMode !== 'CAFE' ? () => router.push(`${p}/cafe-pos`) : undefined}
                title={terminalMode === 'CAFE' ? "Cafe POS (Active)" : "Switch to Cafe POS"}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '6px 13px', borderRadius: '9px',
                  border: terminalMode === 'CAFE' ? '1px solid rgba(212,149,106,0.45)' : 'none',
                  background: terminalMode === 'CAFE' ? 'linear-gradient(135deg, rgba(212,149,106,0.22), rgba(212,149,106,0.1))' : 'transparent',
                  color: terminalMode === 'CAFE' ? '#D4956A' : 'rgba(255,255,255,0.35)',
                  fontSize: '11px', fontWeight: terminalMode === 'CAFE' ? 700 : 600,
                  letterSpacing: '0.03em', cursor: terminalMode === 'CAFE' ? 'default' : 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: terminalMode === 'CAFE' ? '0 2px 12px rgba(212,149,106,0.18)' : 'none',
                  transition: 'all 0.18s',
                }}
                onMouseEnter={terminalMode !== 'CAFE' ? e => { (e.currentTarget as HTMLElement).style.background = 'rgba(212,149,106,0.1)'; (e.currentTarget as HTMLElement).style.color = '#D4956A'; } : undefined}
                onMouseLeave={terminalMode !== 'CAFE' ? e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.35)'; } : undefined}
              >
                <span style={{ fontSize: '14px', lineHeight: 1 }}>☕</span>
                <span>Cafe POS</span>
              </button>
            )}
          </div>
        </div>

        {/* CATEGORY PILLS */}
        <div style={{
          display: 'flex', gap: '7px', padding: '9px 16px',
          overflowX: 'auto', flexShrink: 0,
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          background: 'rgba(255,255,255,0.015)',
          scrollbarWidth: 'none',
        }}>
          <button onClick={() => setSelectedCategory('all')} style={{
            flexShrink: 0, padding: '5px 16px', borderRadius: '999px',
            border: selectedCategory === 'all' ? '1px solid rgba(232,168,56,0.45)' : '1px solid rgba(255,255,255,0.08)',
            background: selectedCategory === 'all' ? 'rgba(232,168,56,0.14)' : 'rgba(255,255,255,0.03)',
            color: selectedCategory === 'all' ? '#E8A838' : 'rgba(255,255,255,0.35)',
            fontSize: '12px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s',
            boxShadow: selectedCategory === 'all' ? '0 0 14px rgba(232,168,56,0.1)' : 'none',
          }}>
            All Items
          </button>

          {categories.map((cat: any, idx: number) => {
            const catLower = cat.name.toLowerCase();
            const iconKey = Object.keys(CAT_ICON_MAP).find(k => catLower.includes(k)) || 'default';
            const emoji = CAT_ICON_MAP[iconKey] || '🍾';
            const isSelected = selectedCategory === cat.id;
            const accent = ACCENTS[idx % ACCENTS.length];
            return (
              <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} style={{
                flexShrink: 0, display: 'flex', alignItems: 'center', gap: '6px',
                padding: '5px 16px', borderRadius: '999px',
                border: isSelected ? `1px solid ${accent.border}` : '1px solid rgba(255,255,255,0.08)',
                background: isSelected ? accent.bg : 'rgba(255,255,255,0.03)',
                color: isSelected ? accent.color : 'rgba(255,255,255,0.35)',
                fontSize: '12px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s',
                boxShadow: isSelected ? `0 0 14px ${accent.glow}` : 'none',
              }}>
                <span style={{ fontSize: '12px' }}>{emoji}</span>
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>

        {/* PRODUCTS */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.05) transparent' }}>

          {filteredProducts.length === 0 ? (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '14px', opacity: 0.2 }}>
              <FlaskConical size={44} color="rgba(255,255,255,0.4)" />
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>No Bar Items Found</p>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)' }}>Add products with "Bar Menu" type in Products page</p>
            </div>

          ) : viewMode === 'grid' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))', gap: '12px' }}>
              {filteredProducts.map((product: any, idx: number) => {
                const accent = ACCENTS[idx % ACCENTS.length];
                const isInCart = cart.some(i => i.id === product.id);
                const pegSize = (product as any).pegSize || (product as any).volume;
                const stock = (product as any).stock ?? (product as any).stockQuantity ?? null;
                const isOutOfStock = stock !== null && stock <= 0;
                const catName = categories.find(c => c.id === product.categoryId)?.name || '';
                const wKey = Object.keys(WMOJI).find(k => catName.toLowerCase().includes(k)) || 'default';
                const watermark = WMOJI[wKey];
                const cartQty = cart.reduce((acc, i) => i.id === product.id ? acc + i.quantity : acc, 0);

                return (
                  <button
                    key={product.id}
                    onClick={() => !isOutOfStock && addToCart(product)}
                    disabled={isOutOfStock}
                    style={{
                      position: 'relative', overflow: 'hidden', borderRadius: '16px', padding: 0,
                      display: 'flex', flexDirection: 'column', textAlign: 'left',
                      cursor: isOutOfStock ? 'not-allowed' : 'pointer', minHeight: '158px',
                      background: isInCart
                        ? `linear-gradient(145deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))`
                        : `linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))`,
                      border: isInCart ? `1px solid ${accent.color}55` : `1px solid rgba(255,255,255,0.08)`,
                      opacity: isOutOfStock ? 0.35 : 1,
                      transition: 'all 0.2s ease',
                      boxShadow: isInCart
                        ? `0 4px 24px ${accent.glow}, inset 0 1px 0 rgba(255,255,255,0.08)`
                        : 'inset 0 1px 0 rgba(255,255,255,0.05)',
                    }}
                    onMouseEnter={e => {
                      if (!isOutOfStock) {
                        const el = e.currentTarget as HTMLElement;
                        el.style.transform = 'translateY(-3px)';
                        el.style.border = `1px solid ${accent.color}44`;
                        el.style.boxShadow = `0 10px 30px ${accent.glow}`;
                      }
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.transform = 'translateY(0)';
                      el.style.border = isInCart ? `1px solid ${accent.color}55` : `1px solid rgba(255,255,255,0.08)`;
                      el.style.boxShadow = isInCart ? `0 4px 24px ${accent.glow}, inset 0 1px 0 rgba(255,255,255,0.08)` : 'inset 0 1px 0 rgba(255,255,255,0.05)';
                    }}
                  >
                    {/* Accent top bar */}
                    <div style={{ height: '2px', background: `linear-gradient(90deg, ${accent.color}CC, transparent)`, borderRadius: '16px 16px 0 0' }} />

                    {/* Watermark */}
                    <div style={{ position: 'absolute', right: '-6px', bottom: '-6px', fontSize: '64px', opacity: 0.05, pointerEvents: 'none', lineHeight: 1, userSelect: 'none', filter: 'blur(2px)' }}>
                      {watermark}
                    </div>

                    <div style={{ flex: 1, padding: '11px 13px 13px', display: 'flex', flexDirection: 'column' }}>
                      {/* Header */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <span style={{
                          fontSize: '9px', fontWeight: 700, color: accent.color,
                          letterSpacing: '0.08em', textTransform: 'uppercase',
                          background: accent.bg, padding: '2px 8px', borderRadius: '999px',
                          border: `1px solid ${accent.border}`,
                        }}>
                          {catName || 'Bar'}
                        </span>

                        {isOutOfStock ? (
                          <span style={{ fontSize: '9px', fontWeight: 700, color: '#E8607A', background: 'rgba(232,96,122,0.12)', padding: '2px 7px', borderRadius: '999px', border: '1px solid rgba(232,96,122,0.25)' }}>OUT</span>
                        ) : stock !== null ? (
                          <span style={{ fontSize: '9px', fontWeight: 600, color: '#5ED4A0', background: 'rgba(94,212,160,0.1)', padding: '2px 7px', borderRadius: '999px', border: '1px solid rgba(94,212,160,0.2)' }}>
                            {stock > 99 ? '99+' : stock}
                          </span>
                        ) : cartQty > 0 ? (
                          <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: accent.color, color: '#080810', fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {cartQty}
                          </span>
                        ) : null}
                      </div>

                      {/* Name */}
                      <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF', lineHeight: 1.35, marginBottom: '3px', letterSpacing: '-0.01em', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {product.name}
                      </h3>

                      {/* Variants indicator */}
                      {(product as any).variants?.length > 0 && (
                        <p style={{ fontSize: '9px', color: '#E8A838', fontWeight: 700, textTransform: 'uppercase', marginTop: '4px' }}>
                          {(product as any).variants.length} Sizes Available
                        </p>
                      )}

                      {/* Price */}
                      <p style={{ fontSize: '18px', fontWeight: 800, color: accent.color, marginTop: 'auto', letterSpacing: '-0.02em', paddingTop: '10px' }}>
                        ₹{product.sellingPrice.toFixed(0)}
                        <span style={{ fontSize: '10px', fontWeight: 400, opacity: 0.4, marginLeft: '4px' }}>starting</span>
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
                const accent = ACCENTS[idx % ACCENTS.length];
                const isInCart = cart.some(i => i.id === product.id);
                return (
                  <button key={product.id} onClick={() => addToCart(product)} style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '11px 14px', borderRadius: '13px',
                    background: isInCart ? accent.bg : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isInCart ? accent.border : 'rgba(255,255,255,0.07)'}`,
                    cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                  }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '11px', flexShrink: 0, background: accent.bg, border: `1px solid ${accent.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ProductIcon productName={product.name} size={18} style={{ color: accent.color }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF', marginBottom: '3px' }}>{product.name}</h3>
                      <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)' }}>{(product as any).variants?.length || 0} peg sizes</p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontSize: '15px', fontWeight: 700, color: accent.color }}>₹{product.sellingPrice.toFixed(0)}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ═══════════ RIGHT — CART ═══════════ */}
      <div style={{
        width: '348px', flexShrink: 0, display: 'flex', flexDirection: 'column',
        borderLeft: '1px solid rgba(255,255,255,0.07)',
        background: 'rgba(255,255,255,0.022)',
        backdropFilter: 'blur(24px)',
      }}>

        {/* Header */}
        <div style={{ padding: '16px 18px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
                {terminalMode === 'RESTAURANT' ? 'Restaurant Order' : terminalMode === 'CAFE' ? 'Cafe Order' : 'Bar Order'}
              </h2>
              <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.22)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '3px' }}>
                {tableId ? `Table ${tableNo}` : 'Counter Service'}
              </p>
            </div>
            {cart.length > 0 && (
              <div style={{ padding: '4px 12px', borderRadius: '999px', background: 'rgba(232,168,56,0.12)', border: '1px solid rgba(232,168,56,0.25)', fontSize: '11px', fontWeight: 700, color: '#E8A838' }}>
                {cart.reduce((s, i) => s + i.quantity, 0)} items
              </div>
            )}
          </div>

          {/* Customer selector */}
          <div style={{ marginTop: '12px', position: 'relative' }}>
            <button
              onClick={() => setShowCustomerDropdown(!showCustomerDropdown)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '9px',
                padding: '9px 13px', borderRadius: '11px',
                border: selectedGuestId ? '1px solid rgba(232,168,56,0.3)' : '1px solid rgba(255,255,255,0.08)',
                background: selectedGuestId ? 'rgba(232,168,56,0.07)' : 'rgba(255,255,255,0.04)',
                color: selectedGuestId ? '#E8A838' : 'rgba(255,255,255,0.3)',
                fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              <UserIcon size={13} />
              <span style={{ flex: 1, textAlign: 'left' }}>
                {selectedGuestId ? (customers.find(c => c.id === selectedGuestId)?.firstName || 'Guest') : 'Add customer'}
              </span>
              {selectedGuestId && (
                <span onClick={e => { e.stopPropagation(); setSelectedGuestId(''); }} style={{ fontSize: '13px', opacity: 0.45, cursor: 'pointer' }}>✕</span>
              )}
            </button>

            {showCustomerDropdown && !selectedGuestId && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 5px)', left: 0, right: 0,
                borderRadius: '13px', zIndex: 50, overflow: 'hidden',
                background: '#12121E', border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '9px 13px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  <Search size={13} color="rgba(255,255,255,0.2)" />
                  <input autoFocus type="text" placeholder="Search customers..."
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
              background: 'rgba(232,168,56,0.1)',
              border: '1px solid rgba(232,168,56,0.22)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '9px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px' }}>🍺</span>
                <div>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#E8A838', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
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
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(232,96,122,0.15)'; e.currentTarget.style.color = '#E8607A'; e.currentTarget.style.borderColor = 'rgba(232,96,122,0.25)'; }}
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
              <ShoppingBag size={40} color="rgba(255,255,255,0.6)" />
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>Empty cart</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
              {cart.map((item: any, idx: number) => {
                const accent = ACCENTS[idx % ACCENTS.length];
                return (
                  <div key={`${item.id}-${item.selectedVariantName}`} style={{
                    borderRadius: '13px', padding: '10px 11px',
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex', alignItems: 'center', gap: '9px',
                  }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0, background: accent.bg, border: `1px solid ${accent.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ProductIcon productName={item.name} size={16} style={{ color: accent.color }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{ fontSize: '12px', fontWeight: 600, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '3px' }}>{item.name}</h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: accent.color }}>₹{(item.sellingPrice * item.quantity).toFixed(0)}</span>
                        <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.18)' }}>Qty: {item.quantity}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.35)', borderRadius: '9px', padding: '3px', border: '1px solid rgba(255,255,255,0.07)', gap: '1px' }}>
                        <button onClick={() => updateQuantity(item.id, item.selectedVariantName, -1)} style={{ width: '24px', height: '24px', borderRadius: '7px', border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.1s' }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#E8607A'}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.35)'}
                        ><Minus size={10} strokeWidth={2.5} /></button>
                        <span style={{ width: '20px', textAlign: 'center', fontSize: '12px', fontWeight: 700, color: '#FFFFFF' }}>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.selectedVariantName, 1)} style={{ width: '24px', height: '24px', borderRadius: '7px', border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.1s' }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#5ED4A0'}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.35)'}
                        ><Plus size={10} strokeWidth={2.5} /></button>
                      </div>
                      <button onClick={() => setCart(p => p.filter(i => !(i.id === item.id && i.selectedVariantName === item.selectedVariantName)))} style={{ width: '26px', height: '26px', borderRadius: '8px', border: '1px solid rgba(232,96,122,0.2)', background: 'rgba(232,96,122,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#E8607A', transition: 'background 0.15s' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(232,96,122,0.2)'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(232,96,122,0.08)'}
                      ><Trash2 size={11} /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* TOTALS + ACTIONS */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.3)', padding: '14px 18px', flexShrink: 0 }}>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.28)', fontWeight: 500 }}>Subtotal</span>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)', fontWeight: 600 }}>₹{subtotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.28)', fontWeight: 500 }}>Taxes</span>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)', fontWeight: 600 }}>₹{tax.toFixed(2)}</span>
            </div>
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)', margin: '4px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.22)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, marginBottom: '3px' }}>Total Payable</p>
                <p style={{ fontSize: '28px', fontWeight: 800, color: '#E8A838', letterSpacing: '-0.03em', lineHeight: 1 }}>₹{grandTotal.toFixed(2)}</p>
              </div>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(232,168,56,0.07)', border: '1px solid rgba(232,168,56,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShoppingBag size={20} color="rgba(232,168,56,0.45)" />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '9px' }}>
            <Button loading={saveLoading} disabled={cart.length === 0} onClick={handleSave}
              style={{
                padding: '12px 0', borderRadius: '12px',
                border: '1px solid rgba(94,212,160,0.2)',
                background: 'rgba(94,212,160,0.07)',
                color: cart.length === 0 ? 'rgba(94,212,160,0.25)' : '#5ED4A0',
                fontSize: '12px', fontWeight: 700, letterSpacing: '0.03em',
                cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                opacity: cart.length === 0 ? 0.45 : 1, transition: 'all 0.15s',
              } as any}
            >
              <Save size={14} /> Save Order
            </Button>

            <Button disabled={cart.length === 0} onClick={handleSettle}
              style={{
                padding: '12px 0', borderRadius: '12px', border: 'none',
                background: cart.length === 0 ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, #D4941A, #E8B840)',
                color: cart.length === 0 ? 'rgba(255,255,255,0.18)' : '#080810',
                fontSize: '12px', fontWeight: 800, letterSpacing: '0.03em',
                cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                opacity: cart.length === 0 ? 0.45 : 1,
                boxShadow: cart.length === 0 ? 'none' : '0 6px 22px rgba(232,168,56,0.32)',
                transition: 'all 0.15s',
              } as any}
            >
              <CreditCard size={14} /> Settle
            </Button>
          </div>
        </div>
      </div>

      {/* PEGS SIZE SELECTOR MODAL */}
      <Modal
        isOpen={!!variantProduct}
        onClose={() => setVariantProduct(null)}
        title="Select Peg Size"
        maxWidth="md"
      >
        <div style={{ padding: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '24px', padding: '16px', background: 'rgba(232,168,56,0.05)', borderRadius: '20px', border: '1px solid rgba(232,168,56,0.1)' }}>
             <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(232,168,56,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Wine size={24} color="#E8A838" />
             </div>
             <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.01em' }}>{variantProduct?.name}</h3>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '2px' }}>Choose your serving size</p>
             </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
            {(variantProduct as any)?.variants?.map((v: any, i: number) => (
              <button
                key={i}
                onClick={() => addToCart(variantProduct!, v)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '16px 20px', borderRadius: '18px',
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                  cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left'
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(232,168,56,0.1)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(232,168,56,0.3)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                   <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Droplets size={14} color="#E8A838" />
                   </div>
                   <span style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}>{v.name}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                   <span style={{ fontSize: '18px', fontWeight: 800, color: '#E8A838' }}>₹{v.price}</span>
                </div>
              </button>
            ))}
            
            {/* Option for Full Bottle if configured */}
            {(variantProduct as any)?.bottlePrice > 0 && (
              <button
                onClick={() => addToCart(variantProduct!, { name: `Full Bottle ${(variantProduct as any).bottleSize}ml`, price: (variantProduct as any).bottlePrice })}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '16px 20px', borderRadius: '18px',
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                  cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left'
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(232,168,56,0.1)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(232,168,56,0.3)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                   <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FlaskConical size={14} color="#E8A838" />
                   </div>
                   <span style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}>Full Bottle ({(variantProduct as any).bottleSize}ml)</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                   <span style={{ fontSize: '18px', fontWeight: 800, color: '#E8A838' }}>₹{(variantProduct as any).bottlePrice}</span>
                </div>
              </button>
            )}
          </div>

          <button
            onClick={() => setVariantProduct(null)}
            style={{ width: '100%', marginTop: '20px', padding: '14px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.4)', fontSize: '12px', fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em' }}
          >
            Cancel
          </button>
        </div>
      </Modal>

      <BillModal
        bill={billData}
        onClose={(settled) => { 
          setIsBillOpen(false); 
          setBillData(null); 
          if (settled) {
            setCart([]);
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
    </div>
  );
}