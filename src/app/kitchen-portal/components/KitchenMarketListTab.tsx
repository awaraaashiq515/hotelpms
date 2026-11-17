'use client';

import React, { useState, useMemo } from 'react';
import {
  ShoppingCart,
  Store,
  CheckCircle2,
  Circle,
  Plus,
  Truck,
  Building2,
  Search,
  Filter,
  Check,
  RefreshCw,
  PackagePlus,
  X,
  Phone,
  Clock,
  ChevronDown,
  ChevronRight,
  Sparkles,
  AlertCircle
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
  onRefresh: () => void;
  onToggleItemDone: (orderId: string, itemId: string, isDone: boolean) => Promise<void>;
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
  { id: 'MEAT_CHICKEN', name: 'Chicken & Meat Shop', emoji: '🍗', defaultVendor: 'Meat & Poultry Supplier' },
  { id: 'SABZI_MANDI', name: 'Vegetables & Mandi', emoji: '🥦', defaultVendor: 'Sabzi Mandi & Produce' },
  { id: 'DAIRY_STORE', name: 'Dairy & Milk Booth', emoji: '🥛', defaultVendor: 'Dairy & Milk Products' },
  { id: 'KIRANA_RATION', name: 'Dry Ration & Grocery', emoji: '🌾', defaultVendor: 'Kirana & Spices Store' },
  { id: 'BAKERY_STORE', name: 'Bakery & Bread', emoji: '🍞', defaultVendor: 'Fresh Bakery' },
  { id: 'BEVERAGE_DISTRIBUTOR', name: 'Beverages & Water', emoji: '🥤', defaultVendor: 'Beverages Agency' },
  { id: 'HOUSEKEEPING_STORE', name: 'Cleaning & Supplies', emoji: '🧹', defaultVendor: 'Sanitation Store' },
  { id: 'PACKAGING_STORE', name: 'Packaging & Disposables', emoji: '📦', defaultVendor: 'Packaging Material' },
];

export const KitchenMarketListTab: React.FC<KitchenMarketListTabProps> = ({
  propertyCode,
  activeStaffName,
  orders,
  loading,
  onRefresh,
  onToggleItemDone,
  onReceiveOrderStock,
  onAddNewItem,
}) => {
  const [selectedShopFilter, setSelectedShopFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [receivingOrderId, setReceivingOrderId] = useState<string | null>(null);

  // Add Item Modal Form state
  const [newItemName, setNewItemName] = useState('');
  const [newShopId, setNewShopId] = useState('SABZI_MANDI');
  const [newQty, setNewQty] = useState<number>(2);
  const [newUnit, setNewUnit] = useState('Kg');
  const [newPrice, setNewPrice] = useState<number>(0);
  const [newNotes, setNewNotes] = useState('');
  const [submittingAdd, setSubmittingAdd] = useState(false);

  // Group items by shop across all active orders
  const shopGroups = useMemo(() => {
    const groups: Record<
      string,
      {
        shop: { id: string; name: string; emoji: string; badge: string };
        orderIds: Set<string>;
        orders: MarketOrder[];
        items: (MarketItem & { orderId: string })[];
        totalItems: number;
        doneItems: number;
        isFullyDone: boolean;
      }
    > = {};

    orders.forEach((o) => {
      o.items.forEach((it) => {
        const shop = it.shopCategory || o.shop;
        const shopId = shop.id || 'GENERAL_STORE';

        if (!groups[shopId]) {
          groups[shopId] = {
            shop,
            orderIds: new Set(),
            orders: [],
            items: [],
            totalItems: 0,
            doneItems: 0,
            isFullyDone: false,
          };
        }

        groups[shopId].orderIds.add(o.id);
        if (!groups[shopId].orders.some((ord) => ord.id === o.id)) {
          groups[shopId].orders.push(o);
        }
        groups[shopId].items.push({ ...it, orderId: o.id });
        groups[shopId].totalItems += 1;
        if (it.isDone) groups[shopId].doneItems += 1;
      });
    });

    Object.values(groups).forEach((g) => {
      g.isFullyDone = g.totalItems > 0 && g.doneItems === g.totalItems;
    });

    return groups;
  }, [orders]);

  // Overall Statistics
  const totalItemsCount = useMemo(() => {
    return orders.reduce((sum, o) => sum + o.totalItems, 0);
  }, [orders]);

  const totalDoneCount = useMemo(() => {
    return orders.reduce((sum, o) => sum + o.doneItems, 0);
  }, [orders]);

  const progressPercent = totalItemsCount > 0 ? Math.round((totalDoneCount / totalItemsCount) * 100) : 0;

  // Filtered Shop Groups based on filter & search
  const filteredShopGroups = useMemo(() => {
    return Object.entries(shopGroups).filter(([shopId, group]) => {
      if (selectedShopFilter !== 'ALL' && shopId !== selectedShopFilter) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchShop = group.shop.name.toLowerCase().includes(q);
        const matchItem = group.items.some((i) => i.name.toLowerCase().includes(q));
        if (!matchShop && !matchItem) return false;
      }

      return true;
    });
  }, [shopGroups, selectedShopFilter, searchQuery]);

  // Handle Submit New Item Form
  const handleFormSubmitNewItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) {
      toast.error('Please enter an item name');
      return;
    }

    setSubmittingAdd(true);
    try {
      await onAddNewItem({
        shopId: newShopId,
        itemName: newItemName.trim(),
        quantity: newQty,
        unit: newUnit,
        estimatedPrice: newPrice,
        notes: newNotes.trim() || undefined,
      });

      toast.success(`"${newItemName.trim()}" added to market list!`);
      setNewItemName('');
      setNewPrice(0);
      setNewQty(2);
      setNewNotes('');
      setShowAddModal(false);
    } catch {
      toast.error('Failed to add item to market list');
    } finally {
      setSubmittingAdd(false);
    }
  };

  // Handle Receive Entire Shop Order & Add to Stock
  const handleReceiveShop = async (orderId: string, shopName: string) => {
    setReceivingOrderId(orderId);
    try {
      await onReceiveOrderStock(orderId);
      toast.success(`${shopName} goods received! Stock added directly to Kitchen Inventory. 📦`);
    } catch {
      toast.error('Failed to inward stock');
    } finally {
      setReceivingOrderId(null);
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* ━━━ TOP PROGRESS & SUMMARY BANNER ━━━ */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-indigo-950/40 border border-slate-800 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <ShoppingCart size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-black text-white">
                  Daily Market Buying List (क्या-क्या लाना है)
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  {totalDoneCount} of {totalItemsCount} Bought
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Items to buy from local shops. Tap <b>&quot;✓ Done&quot;</b> as you purchase each item at the shop.
              </p>
            </div>
          </div>

          {/* Action Buttons: Add Item & Refresh */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onRefresh}
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition"
              title="Refresh Market List"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin text-amber-400' : ''} />
            </button>

            {/* Prominent + Add Item to Buy Button */}
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 h-8 px-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black text-xs font-black uppercase tracking-wider shadow-md shadow-amber-500/20 active:scale-95 transition"
            >
              <PackagePlus size={14} />
              <span>+ Add Item to Buy</span>
            </button>
          </div>
        </div>

        {/* Live Progress Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold">
            <span>Market Buying Progress</span>
            <span className="font-mono text-emerald-400">{progressPercent}% Completed</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* ━━━ SHOP FILTER PILLS & SEARCH BAR ━━━ */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Shop Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedShopFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap shrink-0 ${
              selectedShopFilter === 'ALL'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <span>All Shops ({totalItemsCount})</span>
          </button>

          {COMMON_SHOPS.map((s) => {
            const group = shopGroups[s.id];
            const count = group?.totalItems || 0;
            const isSelected = selectedShopFilter === s.id;

            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedShopFilter(s.id)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap shrink-0 ${
                  isSelected
                    ? 'bg-amber-500 text-black shadow-sm'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <span>{s.emoji}</span>
                <span>{s.name}</span>
                {count > 0 && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                      isSelected ? 'bg-black text-amber-300' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-60 shrink-0">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search item to buy..."
            className="w-full h-8 pl-8 pr-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* ━━━ INLINE ADD ITEM MODAL ━━━ */}
      {showAddModal && (
        <form
          onSubmit={handleFormSubmitNewItem}
          className="p-4 rounded-2xl bg-slate-900 border border-amber-500/40 shadow-2xl space-y-3 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <PackagePlus size={16} className="text-amber-400" />
              <h3 className="text-xs sm:text-sm font-black text-white">
                Add Item to Market Buying List (और तो कुछ नहीं लाना?)
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="text-slate-400 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {/* Shop Category */}
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                Shop / Vendor Store *
              </label>
              <select
                value={newShopId}
                onChange={(e) => setNewShopId(e.target.value)}
                className="w-full h-8 px-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-amber-500 cursor-pointer"
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
                Item Name *
              </label>
              <input
                type="text"
                required
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="e.g. Kasuri Methi, Desi Chicken, Malai Paneer..."
                className="w-full h-8 px-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Quantity & Unit */}
            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Quantity *
                </label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  required
                  value={newQty}
                  onChange={(e) => setNewQty(Number(e.target.value) || 1)}
                  className="w-full h-8 px-2 text-center bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono font-bold text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Unit
                </label>
                <select
                  value={newUnit}
                  onChange={(e) => setNewUnit(e.target.value)}
                  className="w-full h-8 px-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  {['Kg', 'Litre', 'Pcs', 'Packet', 'Box', 'Tray', 'Dozen', 'Bundle'].map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Estimated Rate */}
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                Approx Rate (₹ per {newUnit})
              </label>
              <input
                type="number"
                min="0"
                value={newPrice || ''}
                onChange={(e) => setNewPrice(Number(e.target.value) || 0)}
                placeholder="Optional"
                className="w-full h-8 px-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold font-mono text-emerald-400 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <span className="text-[11px] text-slate-400">
              Added by: <b className="text-white">{activeStaffName}</b>
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-bold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingAdd}
                className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black uppercase tracking-wider flex items-center gap-1 shadow transition disabled:opacity-50"
              >
                {submittingAdd ? <RefreshCw size={12} className="animate-spin" /> : <Plus size={13} />}
                <span>Add to Shopping List</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ━━━ SHOP-BY-SHOP BUYING LIST (App-like Interface) ━━━ */}
      {loading && orders.length === 0 ? (
        <div className="p-16 text-center rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col items-center gap-2">
          <RefreshCw className="w-6 h-6 text-amber-400 animate-spin" />
          <span className="text-xs font-bold text-slate-400">Loading market shopping list...</span>
        </div>
      ) : filteredShopGroups.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800/80 text-amber-400 flex items-center justify-center mx-auto text-2xl">
            🛒
          </div>
          <h3 className="text-sm font-bold text-white">No Items in Market Buying List</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            All shopping orders are completed, or no items match your search. Tap &quot;+ Add Item to Buy&quot; above to add any goods needed from the market!
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5 shadow"
          >
            <Plus size={14} />
            <span>+ Add First Item to Buy</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredShopGroups.map(([shopId, group]) => {
            const hasPendingItems = group.doneItems < group.totalItems;
            const primaryOrder = group.orders[0];

            return (
              <div
                key={shopId}
                className={`rounded-2xl border transition overflow-hidden shadow-lg ${
                  group.isFullyDone
                    ? 'bg-slate-950/70 border-emerald-500/30'
                    : 'bg-slate-900/90 border-slate-800'
                }`}
              >
                {/* Shop Header Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 sm:p-3.5 bg-slate-950/80 border-b border-slate-800/80">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-lg shrink-0">
                      {group.shop.emoji}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-xs sm:text-sm font-black text-white">
                          {group.shop.name}
                        </h3>
                        <span
                          className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                            group.isFullyDone
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          }`}
                        >
                          {group.doneItems} / {group.totalItems} Bought
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Vendor: <b className="text-slate-300">{primaryOrder?.supplierName || group.shop.name}</b>
                        {primaryOrder?.supplierPhone ? ` • 📞 ${primaryOrder.supplierPhone}` : ''}
                      </p>
                    </div>
                  </div>

                  {/* Actions for this Shop */}
                  <div className="flex items-center gap-2">
                    {/* Direct Inward Stock Button when all items are done or partially done */}
                    {primaryOrder && !primaryOrder.isDeliveredToKitchen && (
                      <button
                        type="button"
                        disabled={receivingOrderId === primaryOrder.id}
                        onClick={() => handleReceiveShop(primaryOrder.id, group.shop.name)}
                        className={`h-7 px-2.5 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                          group.isFullyDone
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm animate-pulse'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                        title="Mark received & add items directly to kitchen inventory stock"
                      >
                        {receivingOrderId === primaryOrder.id ? (
                          <RefreshCw size={12} className="animate-spin" />
                        ) : (
                          <Truck size={12} />
                        )}
                        <span>Inward to Stock 📦</span>
                      </button>
                    )}

                    {primaryOrder?.isDeliveredToKitchen && (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Check size={11} /> In Stock
                      </span>
                    )}
                  </div>
                </div>

                {/* Items in this Shop (Tappable Checklist) */}
                <div className="divide-y divide-slate-800/60 p-2 sm:p-2.5 space-y-1">
                  {group.items.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => onToggleItemDone(item.orderId, item.id, !item.isDone)}
                      className={`flex items-center justify-between p-2.5 rounded-xl transition cursor-pointer select-none active:scale-[0.99] ${
                        item.isDone
                          ? 'bg-emerald-950/20 text-slate-300 border border-emerald-500/20'
                          : 'bg-slate-950/40 hover:bg-slate-800/50 text-white border border-slate-800/60'
                      }`}
                    >
                      {/* Left: Checkbox Icon + Item Details */}
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center transition shrink-0 ${
                            item.isDone
                              ? 'bg-emerald-500 text-black font-black'
                              : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-amber-400'
                          }`}
                        >
                          {item.isDone ? <Check size={14} className="stroke-[3]" /> : <Circle size={10} />}
                        </div>

                        <div>
                          <span
                            className={`text-xs font-bold block leading-tight ${
                              item.isDone ? 'line-through text-slate-400' : 'text-white'
                            }`}
                          >
                            {item.name}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Category: {item.category}
                          </span>
                        </div>
                      </div>

                      {/* Right: Quantity + Done Status Pill */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono text-xs font-black text-amber-300 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                          {item.quantity} {item.unit}
                        </span>

                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-lg border transition ${
                            item.isDone
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                          }`}
                        >
                          {item.isDone ? '✓ BOUGHT' : 'TAP IF DONE'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
