'use client';

import React, { useState, useMemo } from 'react';
import {
  ShoppingCart,
  Store,
  CheckCircle2,
  Check,
  Plus,
  Truck,
  Search,
  RefreshCw,
  PackagePlus,
  X,
  Phone,
  Clock,
  Minus,
  Sparkles,
  RotateCcw,
  CheckCheck
} from 'lucide-react';
import { toast } from 'sonner';

export interface MarketItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  unitPrice?: number;
  totalPrice?: number;
  isDone: boolean;
  category: string;
  shopCategory: {
    id: string;
    name: string;
    emoji: string;
    badge: string;
  };
}

export interface MarketOrder {
  id: string;
  orderNo: string;
  status: string;
  supplierName: string;
  supplierPhone: string;
  supplierCategory: string;
  shop: {
    id: string;
    name: string;
    emoji: string;
    badge: string;
  };
  items: MarketItem[];
  totalAmount: number;
  createdAt: string;
  totalItems: number;
  doneItems: number;
  isFullyPurchased: boolean;
  isDeliveredToKitchen: boolean;
}

interface KitchenMarketListTabProps {
  propertyCode: string;
  activeStaffName: string;
  orders: MarketOrder[];
  loading: boolean;
  language?: 'hi' | 'en';
  onLanguageChange?: (lang: 'hi' | 'en') => void;
  onRefresh: () => void;
  onToggleItemDone: (orderId: string, itemId: string, isDone: boolean, actualQty?: number) => Promise<void>;
  onReceiveOrderStock: (orderId: string) => Promise<void>;
  onAddNewItem: (data: {
    shopId: string;
    itemName: string;
    quantity: number;
    unit: string;
    estimatedPrice: number;
    notes?: string;
  }) => Promise<void>;
}

const COMMON_SHOPS = [
  { id: 'MEAT_CHICKEN', name: 'Chicken & Meat', emoji: '🍗' },
  { id: 'SABZI_MANDI', name: 'Sabzi & Mandi', emoji: '🥦' },
  { id: 'DAIRY_STORE', name: 'Dairy & Milk', emoji: '🥛' },
  { id: 'KIRANA_RATION', name: 'Ration & Grocery', emoji: '🌾' },
  { id: 'BAKERY_STORE', name: 'Bakery & Breads', emoji: '🍞' },
  { id: 'BEVERAGE_DISTRIBUTOR', name: 'Drinks & Water', emoji: '🥤' },
  { id: 'HOUSEKEEPING_STORE', name: 'Cleaning & Store', emoji: '🧹' },
];

export const KitchenMarketListTab: React.FC<KitchenMarketListTabProps> = ({
  propertyCode,
  activeStaffName,
  orders,
  loading,
  language = 'hi',
  onLanguageChange,
  onRefresh,
  onToggleItemDone,
  onReceiveOrderStock,
  onAddNewItem,
}) => {
  // 2-Option Language State (Hindi / English)
  const [internalLang, setInternalLang] = useState<'hi' | 'en'>(language);
  const currentLang = onLanguageChange ? language : internalLang;

  const handleLangToggle = (selected: 'hi' | 'en') => {
    setInternalLang(selected);
    if (onLanguageChange) {
      onLanguageChange(selected);
    }
  };

  // Simple View Filter: 'ALL' | 'PENDING' | 'DONE'
  const [viewFilter, setViewFilter] = useState<'ALL' | 'PENDING' | 'DONE'>('ALL');
  const [selectedShopFilter, setSelectedShopFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Per-item "Kitna Liya" custom quantity state
  const [quantitiesTaken, setQuantitiesTaken] = useState<Record<string, number>>({});
  const [savingItemId, setSavingItemId] = useState<string | null>(null);

  // New item modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newShopId, setNewShopId] = useState('SABZI_MANDI');
  const [newItemName, setNewItemName] = useState('');
  const [newQty, setNewQty] = useState(2);
  const [newUnit, setNewUnit] = useState('Kg');
  const [submittingAdd, setSubmittingAdd] = useState(false);

  // Stock Inward loading
  const [receivingOrderId, setReceivingOrderId] = useState<string | null>(null);

  // Flatten all items across orders for simple, clear listing
  const allItemsWithOrder = useMemo(() => {
    const list: (MarketItem & {
      orderId: string;
      orderNo: string;
      supplierName: string;
      supplierPhone: string;
      isOrderDelivered: boolean;
    })[] = [];

    orders.forEach((o) => {
      o.items.forEach((it) => {
        list.push({
          ...it,
          orderId: o.id,
          orderNo: o.orderNo,
          supplierName: o.supplierName,
          supplierPhone: o.supplierPhone,
          isOrderDelivered: o.isDeliveredToKitchen,
        });
      });
    });

    return list;
  }, [orders]);

  // Overall counts
  const totalItemsCount = allItemsWithOrder.length;
  const totalDoneCount = allItemsWithOrder.filter((i) => i.isDone).length;
  const totalPendingCount = totalItemsCount - totalDoneCount;
  const progressPercent = totalItemsCount > 0 ? Math.round((totalDoneCount / totalItemsCount) * 100) : 0;

  // Filtered items
  const filteredItems = useMemo(() => {
    return allItemsWithOrder.filter((item) => {
      // 1. View Filter (All, Pending, Done)
      if (viewFilter === 'PENDING' && item.isDone) return false;
      if (viewFilter === 'DONE' && !item.isDone) return false;

      // 2. Shop Category Filter
      if (selectedShopFilter !== 'ALL' && item.shopCategory?.id !== selectedShopFilter) {
        return false;
      }

      // 3. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = item.name.toLowerCase().includes(q);
        const matchCategory = item.category?.toLowerCase().includes(q);
        const matchSupplier = item.supplierName?.toLowerCase().includes(q);
        if (!matchName && !matchCategory && !matchSupplier) return false;
      }

      return true;
    });
  }, [allItemsWithOrder, viewFilter, selectedShopFilter, searchQuery]);

  // Helper to get or set active quantity for an item
  const getItemQty = (itemId: string, defaultQty: number) => {
    if (quantitiesTaken[itemId] !== undefined) {
      return quantitiesTaken[itemId];
    }
    return defaultQty || 1;
  };

  const handleQtyChange = (itemId: string, val: number) => {
    const safeVal = Math.max(0.5, Math.round(val * 10) / 10);
    setQuantitiesTaken((prev) => ({ ...prev, [itemId]: safeVal }));
  };

  // ── "Le Liya" Confirmation Action ──
  const handleMarkLeLiya = async (orderId: string, itemId: string, defaultQty: number) => {
    setSavingItemId(itemId);
    const qtyTaken = getItemQty(itemId, defaultQty);
    try {
      await onToggleItemDone(orderId, itemId, true, qtyTaken);
      toast.success(`✅ Le Liya: ${qtyTaken} mark ho gaya!`);
    } catch {
      toast.error('Failed to update');
    } finally {
      setSavingItemId(null);
    }
  };

  // ── Undo / "Wapas Badlein" Action ──
  const handleUndoLeLiya = async (orderId: string, itemId: string) => {
    setSavingItemId(itemId);
    try {
      await onToggleItemDone(orderId, itemId, false);
      toast.info('Item wapas pending mein daal diya');
    } catch {
      toast.error('Failed to undo');
    } finally {
      setSavingItemId(null);
    }
  };

  // Add Item to Buy
  const handleAddItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) {
      toast.error('Item ka naam likhein');
      return;
    }

    setSubmittingAdd(true);
    try {
      await onAddNewItem({
        shopId: newShopId,
        itemName: newItemName.trim(),
        quantity: newQty,
        unit: newUnit,
        estimatedPrice: 0,
      });

      toast.success(`"${newItemName.trim()}" list mein add ho gaya!`);
      setNewItemName('');
      setNewQty(2);
      setShowAddModal(false);
    } catch {
      toast.error('Failed to add item');
    } finally {
      setSubmittingAdd(false);
    }
  };

  // Inward all to kitchen store
  const handleInwardAllDelivered = async () => {
    if (orders.length === 0) return;
    const pendingOrders = orders.filter((o) => !o.isDeliveredToKitchen);
    if (pendingOrders.length === 0) {
      toast.info('Sabhi samaan pehle se kitchen store mein jama hai.');
      return;
    }

    setReceivingOrderId('ALL');
    try {
      for (const order of pendingOrders) {
        await onReceiveOrderStock(order.id);
      }
      toast.success('📦 Sabhi samaan Kitchen Inventory Stock mein jama ho gaya!');
    } catch {
      toast.error('Failed to inward stock');
    } finally {
      setReceivingOrderId(null);
    }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-24 text-slate-100">
      
      {/* ━━━ 1. SIMPLE CLEAN HEADER & SUMMARY BANNER ━━━ */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <ShoppingCart size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-white">
                  {currentLang === 'hi' ? 'Market Buying List (क्या-क्या लाना है)' : 'Market Procurement List'}
                </h2>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  {currentLang === 'hi'
                    ? `${totalDoneCount} of ${totalItemsCount} Le Liye`
                    : `${totalDoneCount} of ${totalItemsCount} Bought`}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {currentLang === 'hi'
                  ? 'Market ya dukaan se jo samaan le liya ho, uske aage "Le Liya" dabayein aur kitna liya woh select karein.'
                  : 'Check off items as you buy them. Adjust quantity taken and tap "Mark Bought".'}
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* 2-Option Language Switcher (Hindi / English) */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-700 shadow-inner">
              <button
                type="button"
                onClick={() => handleLangToggle('hi')}
                className={`px-2.5 py-1 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1 ${
                  currentLang === 'hi'
                    ? 'bg-amber-500 text-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>🇮🇳</span>
                <span>हिंदी</span>
              </button>
              <button
                type="button"
                onClick={() => handleLangToggle('en')}
                className={`px-2.5 py-1 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1 ${
                  currentLang === 'en'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>🇬🇧</span>
                <span>English</span>
              </button>
            </div>

            <button
              onClick={onRefresh}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
              title="Refresh List"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin text-amber-400' : ''} />
            </button>

            {/* + Add Item Button */}
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black uppercase tracking-wider shadow-md shadow-amber-500/20 active:scale-95 transition cursor-pointer whitespace-nowrap"
            >
              <Plus size={16} className="stroke-[3]" />
              <span>{currentLang === 'hi' ? '+ Naya Samaan Jodein' : '+ Add New Item'}</span>
            </button>
          </div>
        </div>

        {/* Progress bar */}
        {totalItemsCount > 0 && (
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400">
              <span>{currentLang === 'hi' ? 'Khareedari Progress' : 'Procurement Progress'}</span>
              <span className="text-emerald-400 font-mono">
                {progressPercent}% {currentLang === 'hi' ? 'Poora Hua' : 'Completed'} ({totalDoneCount}/{totalItemsCount})
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Inward Button when items are bought */}
        {totalDoneCount > 0 && (
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-3 flex-wrap">
            <span className="text-xs text-emerald-400 font-bold flex items-center gap-1.5">
              <CheckCircle2 size={15} />
              <span>
                {currentLang === 'hi'
                  ? `${totalDoneCount} items le liye gaye hain.`
                  : `${totalDoneCount} items marked bought.`}
              </span>
            </span>

            <button
              onClick={handleInwardAllDelivered}
              disabled={receivingOrderId === 'ALL'}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-700/30 transition cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Truck size={14} />
              <span>
                {receivingOrderId === 'ALL'
                  ? (currentLang === 'hi' ? 'Stock Jama Ho Raha Hai...' : 'Inwarding...')
                  : (currentLang === 'hi' ? '📦 Kitchen Store Mein Stock Jama Karein' : '📦 Inward to Kitchen Store Stock')}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* ━━━ 2. SIMPLE FILTER TABS: All / Pending / Le Liye ━━━ */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
          <button
            type="button"
            onClick={() => setViewFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              viewFilter === 'ALL'
                ? 'bg-amber-500 text-black shadow-sm font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {currentLang === 'hi' ? `Sabhi Samaan (${totalItemsCount})` : `All Items (${totalItemsCount})`}
          </button>

          <button
            type="button"
            onClick={() => setViewFilter('PENDING')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              viewFilter === 'PENDING'
                ? 'bg-amber-500 text-black shadow-sm font-black'
                : 'text-amber-400/90 hover:text-white'
            }`}
          >
            <span>{currentLang === 'hi' ? 'Bache Hue (To Buy)' : 'To Buy (Pending)'}</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/20 text-[10px]">
              {totalPendingCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setViewFilter('DONE')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              viewFilter === 'DONE'
                ? 'bg-emerald-500 text-black shadow-sm font-black'
                : 'text-emerald-400/90 hover:text-white'
            }`}
          >
            <span>{currentLang === 'hi' ? '✓ Le Liye (Bought)' : '✓ Bought (Completed)'}</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/20 text-[10px]">
              {totalDoneCount}
            </span>
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search item to buy..."
            className="w-full h-9 pl-9 pr-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* ━━━ 3. SHOP FILTER SHORTCUTS (Simple horizontal scroll) ━━━ */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        <button
          type="button"
          onClick={() => setSelectedShopFilter('ALL')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
            selectedShopFilter === 'ALL'
              ? 'bg-slate-700 text-white'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          {currentLang === 'hi' ? 'Sabhi Dukaanein (All Shops)' : 'All Stores'}
        </button>

        {COMMON_SHOPS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSelectedShopFilter(s.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              selectedShopFilter === s.id
                ? 'bg-amber-500 text-black shadow'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <span>{s.emoji}</span>
            <span>{s.name}</span>
          </button>
        ))}
      </div>

      {/* ━━━ 4. ADD ITEM MODAL ━━━ */}
      {showAddModal && (
        <form
          onSubmit={handleAddItemSubmit}
          className="p-5 rounded-2xl bg-slate-900 border border-amber-500/50 shadow-2xl space-y-4 animate-in fade-in"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <PackagePlus size={18} className="text-amber-400" />
              <h3 className="text-sm font-black text-white">
                {currentLang === 'hi'
                  ? 'Add Item to Market List (मार्केट से क्या लाना है?)'
                  : 'Add Item to Market List'}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Shop Category */}
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                {currentLang === 'hi' ? 'Shop / Category (दुकान) *' : 'Store / Category *'}
              </label>
              <select
                value={newShopId}
                onChange={(e) => setNewShopId(e.target.value)}
                className="w-full h-10 px-3 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                {COMMON_SHOPS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.emoji} {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Item Name */}
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                {currentLang === 'hi' ? 'Item Name (समान का नाम) *' : 'Item Name *'}
              </label>
              <input
                type="text"
                required
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder={currentLang === 'hi' ? 'e.g. Aloo, Chicken, Paneer, Milk...' : 'e.g. Potatoes, Chicken, Milk...'}
                className="w-full h-10 px-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Quantity & Unit */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  {currentLang === 'hi' ? 'Quantity (मात्रा) *' : 'Quantity *'}
                </label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  required
                  value={newQty}
                  onChange={(e) => setNewQty(Number(e.target.value) || 1)}
                  className="w-full h-10 px-2 text-center bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono font-bold text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  {currentLang === 'hi' ? 'Unit (इकाई)' : 'Unit'}
                </label>
                <select
                  value={newUnit}
                  onChange={(e) => setNewUnit(e.target.value)}
                  className="w-full h-10 px-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  {['Kg', 'Litre', 'Pcs', 'Packet', 'Box', 'Tray', 'Dozen'].map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingAdd}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow transition disabled:opacity-50 cursor-pointer"
            >
              {submittingAdd ? <RefreshCw size={13} className="animate-spin" /> : <Plus size={14} />}
              <span>{currentLang === 'hi' ? 'List Mein Jodein' : 'Add to List'}</span>
            </button>
          </div>
        </form>
      )}

      {/* ━━━ 5. THE SIMPLE ITEM LIST (With "Le Liya" & "Kitna Liya" Option) ━━━ */}
      {loading && allItemsWithOrder.length === 0 ? (
        <div className="p-16 text-center rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col items-center gap-2">
          <RefreshCw className="w-6 h-6 text-amber-400 animate-spin" />
          <span className="text-xs font-bold text-slate-400">Loading shopping list...</span>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800/80 text-amber-400 flex items-center justify-center mx-auto text-2xl">
            🛒
          </div>
          <h3 className="text-sm font-bold text-white">
            {currentLang === 'hi' ? 'Koi samaan baaki nahi hai' : 'No items remaining'}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {viewFilter === 'PENDING'
              ? (currentLang === 'hi'
                  ? 'Badiya! Sabhi samaan khareed liye gaye hain.'
                  : 'Great! All items have been purchased.')
              : (currentLang === 'hi'
                  ? 'Market list mein abhi koi item nahi hai. Upar "+ Naya Samaan Jodein" daba kar add karein.'
                  : 'No items in market list. Click "+ Add New Item" above to add.')}
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5 shadow cursor-pointer"
          >
            <Plus size={14} />
            <span>{currentLang === 'hi' ? '+ Naya Samaan Jodein' : '+ Add Item to Buy'}</span>
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredItems.map((item) => {
            const isSaving = savingItemId === item.id;
            const currentQty = getItemQty(item.id, item.quantity);

            return (
              <div
                key={item.id}
                className={`p-3.5 sm:p-4 rounded-2xl border transition shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 ${
                  item.isDone
                    ? 'bg-slate-950/70 border-emerald-500/40 text-slate-300'
                    : 'bg-slate-900 border-slate-800 text-white hover:border-slate-700'
                }`}
              >
                {/* Left: Emoji, Item Name & Shop Info */}
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                      item.isDone ? 'bg-emerald-500/15 border border-emerald-500/30' : 'bg-slate-800 border border-slate-700'
                    }`}
                  >
                    {item.isDone ? <Check size={20} className="text-emerald-400 stroke-[3]" /> : item.shopCategory?.emoji || '🛒'}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4
                        className={`text-sm sm:text-base font-bold leading-tight ${
                          item.isDone ? 'line-through text-slate-400' : 'text-white'
                        }`}
                      >
                        {item.name}
                      </h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-medium">
                        {item.shopCategory?.name || item.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                      <span>
                        {currentLang === 'hi' ? 'Lana Tha:' : 'Required:'}{' '}
                        <strong className="text-amber-300 font-mono">{item.quantity} {item.unit}</strong>
                      </span>
                      {item.supplierName && (
                        <span>• {currentLang === 'hi' ? 'Dukaan:' : 'Store:'} <span className="text-slate-300">{item.supplierName}</span></span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: "Le Liya" + "Kitna Liya" Action Box */}
                <div className="flex items-center gap-2.5 justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">
                  {!item.isDone ? (
                    /* ── NOT BOUGHT YET: SHOW "KITNA LIYA" STEPPER + "LE LIYA" BUTTON ── */
                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                      {/* Kitna Liya Quantity Stepper */}
                      <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-700">
                        <span className="text-[10px] font-bold text-slate-400 px-1 uppercase tracking-wider">
                          {currentLang === 'hi' ? 'Kitna Liya?' : 'Qty Taken:'}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleQtyChange(item.id, currentQty - 1)}
                          className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-200 font-bold transition active:scale-95 cursor-pointer"
                        >
                          <Minus size={12} />
                        </button>

                        <div className="flex items-baseline gap-0.5 px-2 font-mono font-black text-amber-300 text-sm">
                          <input
                            type="number"
                            min="0.5"
                            step="0.5"
                            value={currentQty}
                            onChange={(e) => handleQtyChange(item.id, Number(e.target.value) || 1)}
                            className="w-12 bg-transparent text-center font-bold text-amber-300 focus:outline-none"
                          />
                          <span className="text-xs text-slate-400 font-normal">{item.unit}</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleQtyChange(item.id, currentQty + 1)}
                          className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-200 font-bold transition active:scale-95 cursor-pointer"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      {/* Prominent "Le Liya" Button */}
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => handleMarkLeLiya(item.orderId, item.id, item.quantity)}
                        className="h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-emerald-700/30 active:scale-95 transition cursor-pointer disabled:opacity-50"
                      >
                        {isSaving ? (
                          <RefreshCw size={13} className="animate-spin" />
                        ) : (
                          <Check size={14} className="stroke-[3]" />
                        )}
                        <span>{currentLang === 'hi' ? 'Le Liya ✅' : 'Mark Bought ✅'}</span>
                      </button>
                    </div>
                  ) : (
                    /* ── ALREADY BOUGHT: SHOW GREEN BADGE + "WAPAS BADLEIN" ── */
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-bold text-xs">
                        <CheckCheck size={15} className="text-emerald-400" />
                        <span>
                          {currentLang === 'hi'
                            ? `✓ ${currentQty} ${item.unit} Le Liya`
                            : `✓ ${currentQty} ${item.unit} Bought`}
                        </span>
                      </div>

                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => handleUndoLeLiya(item.orderId, item.id)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
                        title={currentLang === 'hi' ? 'Wapas Badle (Undo)' : 'Undo'}
                      >
                        {isSaving ? <RefreshCw size={13} className="animate-spin" /> : <RotateCcw size={13} />}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
