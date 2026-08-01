import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, ShoppingCart, UtensilsCrossed, Minus,
  Plus, Trash2, X, Loader2, ChefHat
} from 'lucide-react';
import { toast } from 'sonner';
import { Category, Product, Variant, CartItem } from './types';

// ─── Product Card ────────────────────────────────────────────────────────────
function ProductCard({ product, onAdd }: { product: Product; onAdd: (p: Product, variant?: Variant) => void }) {
  return (
    <div className="rounded-2xl bg-[#0f172a]/70 border border-slate-800/70 overflow-hidden hover:border-slate-700/70 transition-all group flex flex-col justify-between">
      {product.image && (
        <div className="h-36 overflow-hidden">
          <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        </div>
      )}
      <div className="p-4 flex items-center justify-between gap-4 flex-1">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <div className={`w-3 h-3 rounded-sm border-2 flex items-center justify-center shrink-0 ${product.isVeg ? 'border-emerald-500' : 'border-rose-500'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${product.isVeg ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            </div>
            <span className="font-black text-sm text-white leading-tight">{product.name}</span>
          </div>
          {product.description && <p className="text-[10px] text-slate-500 mb-2 line-clamp-2 leading-tight">{product.description}</p>}
          <div>
            <span className="text-base font-black text-emerald-400">₹{product.sellingPrice}</span>
            {product.taxRate && <span className="text-[9px] text-slate-600 ml-1">+{product.taxRate}% GST</span>}
          </div>
        </div>

        <div className="shrink-0 flex items-center justify-end">
          {product.availabilityStatus ? (
            product.variants.length > 0 ? (
              <div className="flex flex-row flex-wrap gap-1.5 justify-end max-w-[180px]">
                {product.variants.map(v => (
                  <button key={v.id} onClick={() => onAdd(product, v)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 text-[9px] font-black hover:bg-indigo-600/40 transition-colors whitespace-nowrap">
                    <Plus size={8} /> {v.name} ₹{v.price}
                  </button>
                ))}
              </div>
            ) : (
              <button onClick={() => onAdd(product)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-black hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/20">
                <Plus size={14} /> Add
              </button>
            )
          ) : (
            <span className="text-[10px] text-slate-600 font-bold">Unavailable</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Cart Sidebar ────────────────────────────────────────────────────────────
function CartSidebar({
  cart,
  tables,
  roomNumber,
  onUpdateQty,
  onRemove,
  onPlaceOrder,
  placing,
  onClose
}: {
  cart: CartItem[];
  tables: any[];
  roomNumber: string | null;
  onUpdateQty: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onPlaceOrder: (config: {
    diningOption: 'ROOM_SERVICE' | 'DINE_IN';
    serveOption: 'NOW' | 'SCHEDULED';
    scheduledTime: string;
    tableId: string;
    tableName: string;
    notes: string;
  }) => void;
  placing: boolean;
  onClose: () => void;
}) {
  const [diningOption, setDiningOption] = useState<'ROOM_SERVICE' | 'DINE_IN'>('ROOM_SERVICE');
  const [serveOption, setServeOption] = useState<'NOW' | 'SCHEDULED'>('NOW');
  const [scheduledTime, setScheduledTime] = useState('In 30 Mins');
  const [customTime, setCustomTime] = useState('');
  const [selectedTableId, setSelectedTableId] = useState('');
  const [selectedTableName, setSelectedTableName] = useState('');
  const [notes, setNotes] = useState('');

  const total = cart.reduce((s, i) => s + i.unitPrice * i.qty, 0);
  const tax = cart.reduce((s, i) => s + (i.taxRate ? i.unitPrice * i.qty * i.taxRate / 100 : 0), 0);

  const handleConfirm = () => {
    const finalTime = serveOption === 'SCHEDULED' ? (customTime || scheduledTime) : 'ASAP';
    onPlaceOrder({
      diningOption,
      serveOption,
      scheduledTime: finalTime,
      tableId: selectedTableId,
      tableName: selectedTableName,
      notes,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-md bg-[#0a0f1e] border-l border-slate-800 flex flex-col h-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 shrink-0 bg-[#070b16]">
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} className="text-indigo-400" />
            <h3 className="font-black text-white text-sm">Review & Schedule Order</h3>
            <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-black">{cart.reduce((s, i) => s + i.qty, 0)}</span>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-1"><X size={20} /></button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Cart Items List */}
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Order Items</p>
            {cart.map(item => (
              <div key={item.productId + (item.variantId || '')} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-900/70 border border-slate-800/80">
                <div className={`w-2.5 h-2.5 rounded-sm border-2 shrink-0 ${item.isVeg ? 'border-emerald-500' : 'border-rose-500'}`}>
                  <div className={`w-1 h-1 rounded-full mx-auto mt-0.5 ${item.isVeg ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate">{item.name}</p>
                  {item.variantName && <p className="text-[9px] text-slate-500">{item.variantName}</p>}
                  <p className="text-[10px] text-emerald-400 font-bold">₹{item.unitPrice} × {item.qty}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => onUpdateQty(item.productId + (item.variantId || ''), -1)} className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 flex items-center justify-center transition-colors"><Minus size={10} /></button>
                  <span className="text-xs font-black text-white w-4 text-center">{item.qty}</span>
                  <button onClick={() => onUpdateQty(item.productId + (item.variantId || ''), 1)} className="w-6 h-6 rounded-lg bg-indigo-600/30 text-indigo-400 hover:bg-indigo-600/50 flex items-center justify-center transition-colors"><Plus size={10} /></button>
                  <button onClick={() => onRemove(item.productId + (item.variantId || ''))} className="w-6 h-6 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 flex items-center justify-center transition-colors ml-1"><Trash2 size={10} /></button>
                </div>
              </div>
            ))}
          </div>

          {/* 1. Dining Option Selector (Room Service vs Restaurant Table) */}
          <div className="p-3.5 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 space-y-2.5">
            <label className="block text-[10px] font-black text-indigo-300 uppercase tracking-wider">
              1. Where would you like to eat?
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDiningOption('ROOM_SERVICE')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all text-left flex items-center gap-2 ${diningOption === 'ROOM_SERVICE' ? 'bg-indigo-600 border-indigo-500 text-white shadow-md' : 'bg-slate-900/60 border-slate-800 text-slate-400'}`}
              >
                <span className="text-base">🛎️</span>
                <div>
                  <div>Room Service</div>
                  <div className="text-[9px] opacity-70 font-normal">Room {roomNumber || '—'}</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDiningOption('DINE_IN')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all text-left flex items-center gap-2 ${diningOption === 'DINE_IN' ? 'bg-indigo-600 border-indigo-500 text-white shadow-md' : 'bg-slate-900/60 border-slate-800 text-slate-400'}`}
              >
                <span className="text-base">🍽️</span>
                <div>
                  <div>Restaurant Table</div>
                  <div className="text-[9px] opacity-70 font-normal">Dine in Restaurant</div>
                </div>
              </button>
            </div>

            {/* Table Selection Dropdown if DINE_IN */}
            {diningOption === 'DINE_IN' && tables.length > 0 && (
              <div className="pt-2 border-t border-indigo-500/20">
                <label className="block text-[9px] font-bold text-slate-400 mb-1.5">
                  Select Table Preference (Optional):
                </label>
                <select
                  value={selectedTableId}
                  onChange={(e) => {
                    const tid = e.target.value;
                    setSelectedTableId(tid);
                    const t = tables.find(x => x.id === tid);
                    setSelectedTableName(t ? t.name : '');
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs font-bold focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Any Available Restaurant Table</option>
                  {tables.map((t: any) => (
                    <option key={t.id} value={t.id}>
                      {t.name} {t.floor?.name ? `(${t.floor.name})` : ''} — {t.capacity} Seats
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* 2. Serving Time Scheduling */}
          <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2.5">
            <label className="block text-[10px] font-black text-slate-300 uppercase tracking-wider">
              2. When should we prepare your food?
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setServeOption('NOW')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${serveOption === 'NOW' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900/60 border-slate-800 text-slate-400'}`}
              >
                <span>⚡</span> Serve ASAP
              </button>
              <button
                type="button"
                onClick={() => setServeOption('SCHEDULED')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${serveOption === 'SCHEDULED' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900/60 border-slate-800 text-slate-400'}`}
              >
                <span>⏰</span> Pre-Order / Schedule
              </button>
            </div>

            {/* Quick Time Chips if SCHEDULED */}
            {serveOption === 'SCHEDULED' && (
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <p className="text-[9px] font-bold text-slate-400">Select Scheduled Serving Time:</p>
                <div className="flex flex-wrap gap-1.5">
                  {['In 30 Mins', 'In 45 Mins', 'In 1 Hour', '7:30 PM', '8:30 PM', '9:30 PM'].map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => { setScheduledTime(t); setCustomTime(''); }}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${scheduledTime === t && !customTime ? 'bg-indigo-500/30 border-indigo-400 text-indigo-300' : 'bg-slate-800/60 border-slate-700/60 text-slate-400'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[10px] text-slate-500 font-bold">Or pick custom time:</span>
                  <input
                    type="time"
                    value={customTime}
                    onChange={(e) => setCustomTime(e.target.value)}
                    className="py-1 px-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 3. Special Instructions */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Special Instructions / Dietary Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Less spicy, extra cutlery, no onions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 placeholder:text-slate-600"
            />
          </div>
        </div>

        {/* Footer Summary & Submit */}
        <div className="p-4 border-t border-slate-800 space-y-3 shrink-0 bg-[#070b16]">
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-slate-400"><span>Subtotal</span><span>₹{total.toFixed(0)}</span></div>
            {tax > 0 && <div className="flex justify-between text-indigo-400"><span>GST</span><span>+₹{tax.toFixed(0)}</span></div>}
            <div className="flex justify-between font-black text-white text-sm pt-1 border-t border-slate-800/60"><span>Total Bill</span><span>₹{(total + tax).toFixed(0)}</span></div>
          </div>
          <button
            onClick={handleConfirm}
            disabled={placing || cart.length === 0}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black text-sm transition-all shadow-xl shadow-indigo-600/25 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {placing ? <><Loader2 size={16} className="animate-spin" /> Placing Pre-Order...</> : <><ChefHat size={16} /> Confirm {diningOption === 'DINE_IN' ? 'Table Pre-Order' : 'Room Service Order'}</>}
          </button>
          <p className="text-[9px] text-slate-500 text-center">
            📋 Charges will automatically post to Room {roomNumber || 'folio'} bill. Pay at checkout.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Menu Tab ────────────────────────────────────────────────────────────────
export default function MenuTab({ token }: { token: string }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [roomNumber, setRoomNumber] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    fetch('/api/guest-portal/menu', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setCategories(d.data.categories || []);
          setTables(d.data.tables || []);
          setRoomNumber(d.data.roomNumber || null);
        } else {
          setError(d.message);
        }
      })
      .catch(() => setError('Could not load menu'))
      .finally(() => setLoading(false));
  }, [token]);

  const addToCart = useCallback((product: Product, variant?: Variant) => {
    const key = product.id + (variant?.id || '');
    setCart(prev => {
      const existing = prev.find(i => i.productId + (i.variantId || '') === key);
      if (existing) return prev.map(i => i.productId + (i.variantId || '') === key ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { productId: product.id, name: product.name, qty: 1, unitPrice: variant?.price ?? product.sellingPrice, taxRate: product.taxRate, variantId: variant?.id, variantName: variant?.name, isVeg: product.isVeg }];
    });
    toast.success(`${product.name} added to cart`);
  }, []);

  const updateQty = useCallback((key: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.productId + (i.variantId || '') !== key) return i;
      return { ...i, qty: Math.max(0, i.qty + delta) };
    }).filter(i => i.qty > 0));
  }, []);

  const removeItem = useCallback((key: string) => {
    setCart(prev => prev.filter(i => i.productId + (i.variantId || '') !== key));
  }, []);

  const placeOrder = async (config: {
    diningOption: 'ROOM_SERVICE' | 'DINE_IN';
    serveOption: 'NOW' | 'SCHEDULED';
    scheduledTime: string;
    tableId: string;
    tableName: string;
    notes: string;
  }) => {
    if (cart.length === 0) return;
    setPlacing(true);
    try {
      const res = await fetch('/api/guest-portal/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          items: cart,
          ...config
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || `🎉 Order ${data.data.orderNo} placed successfully!`);
        setCart([]);
        setCartOpen(false);
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error('Failed to place order. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const allProducts = categories.flatMap(c => c.products);
  const filtered = (activeCategory === 'all' ? allProducts : categories.find(c => c.id === activeCategory)?.products || [])
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()));

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center space-y-3"><Loader2 className="animate-spin text-indigo-500 mx-auto" size={28} /><p className="text-xs text-slate-500">Loading menu...</p></div>
    </div>
  );
  if (error) return (
    <div className="text-center py-20 text-slate-500">
      <UtensilsCrossed size={40} className="mx-auto mb-3 opacity-30" />
      <p className="font-bold">{error}</p>
    </div>
  );

  return (
    <div className="relative">
      {/* Search + Cart Button */}
      <div className="flex gap-3 mb-5 sticky top-0 z-10 bg-[#050a14]/90 backdrop-blur-md py-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input type="text" placeholder="Search dishes..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900/70 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600" />
        </div>
        <button onClick={() => setCartOpen(true)} className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-black text-sm hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/25">
          <ShoppingCart size={16} />
          {cartCount > 0 && <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 rounded-full text-[10px] font-black flex items-center justify-center">{cartCount}</span>}
        </button>
      </div>

      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-none">
        <button onClick={() => setActiveCategory('all')} className={`shrink-0 px-4 py-2 rounded-full text-xs font-black border transition-all ${activeCategory === 'all' ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'}`}>
          All Items
        </button>
        {categories.map(c => (
          <button key={c.id} onClick={() => setActiveCategory(c.id)} className={`shrink-0 px-4 py-2 rounded-full text-xs font-black border transition-all whitespace-nowrap ${activeCategory === c.id ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'}`}>
            {c.name} <span className="opacity-60">({c.products.length})</span>
          </button>
        ))}
      </div>

      {/* Products Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <UtensilsCrossed size={36} className="mx-auto mb-3 opacity-30" />
          <p className="font-bold">No items found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map(p => <ProductCard key={p.id} product={p} onAdd={addToCart} />)}
        </div>
      )}

      {/* Floating Cart Button (when cart has items but sidebar is closed) */}
      {cartCount > 0 && !cartOpen && (
        <div className="fixed bottom-20 sm:bottom-6 left-0 right-0 flex justify-center z-40 px-4">
          <button onClick={() => setCartOpen(true)} className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-indigo-600 text-white font-black shadow-2xl shadow-indigo-600/40 hover:bg-indigo-500 transition-all text-sm">
            <ShoppingCart size={18} />
            {cartCount} item{cartCount > 1 ? 's' : ''} in cart
            <span className="ml-1 text-indigo-200">· View Order →</span>
          </button>
        </div>
      )}

      {/* Cart Sidebar */}
      {cartOpen && (
        <CartSidebar
          cart={cart}
          tables={tables}
          roomNumber={roomNumber}
          onUpdateQty={updateQty}
          onRemove={removeItem}
          onPlaceOrder={placeOrder}
          placing={placing}
          onClose={() => setCartOpen(false)}
        />
      )}
    </div>
  );
}
