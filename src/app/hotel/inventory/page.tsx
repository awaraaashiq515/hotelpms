'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Package, Plus, Search, Layers, Calculator, RefreshCw, X, Check, Edit2, Bell, FolderPlus, Tag } from 'lucide-react';
import { StockStats } from './components/StockStats';
import { StockTable } from './components/StockTable';
import { LowStockAlert, type StockItem } from './components/LowStockAlert';
import { AddStockModal } from './components/AddStockModal';
import { KitMappingPanel } from './components/KitMappingPanel';
import { UsageCalculatorPanel } from './components/UsageCalculatorPanel';
import { StaffRequestsPanel } from './components/StaffRequestsPanel';

type Tab = 'stock' | 'requests' | 'kits' | 'calculator';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'stock',      label: 'Stock & Quantities',  icon: <Package size={13} /> },
  { id: 'requests',   label: 'Staff Stock Requests', icon: <Bell size={13} /> },
  { id: 'kits',       label: 'Kit Mapping',         icon: <Layers size={13} /> },
  { id: 'calculator', label: 'Usage Calculator',    icon: <Calculator size={13} /> },
];

const DEFAULT_CATEGORIES = ['All', 'Linen', 'Toiletries', 'F&B', 'Housekeeping', 'Safety', 'Stationery', 'Maintenance'];

/* ─── Add Category Modal ─── */
function AddCategoryModal({
  onClose,
  onSave,
  saving,
}: {
  onClose: () => void;
  onSave: (name: string, description?: string) => Promise<void>;
  saving: boolean;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Category name is required');
      return;
    }
    setError('');
    await onSave(name.trim(), description.trim());
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4 animate-in fade-in-50 zoom-in-95">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center">
              <FolderPlus size={14} />
            </div>
            <h3 className="text-sm font-black text-white">Add Inventory Category</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {error && (
            <div className="p-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-xs text-red-400 font-bold">
              {error}
            </div>
          )}

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Category Name *
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Bakery, Beverages, Crockery, Cleaning Chemicals..."
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full h-10 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Department / Description
            </label>
            <input
              type="text"
              placeholder="e.g. Kitchen Store, Housekeeping, Guest Amenities..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full h-10 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
              Quick Suggestions
            </label>
            <div className="flex flex-wrap gap-1.5">
              {['Bakery', 'Dairy', 'Beverages', 'Spices & Oils', 'Crockery', 'Cleaning Chemicals', 'Bar Consumables', 'Packaging'].map(preset => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => setName(preset)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700/60 text-[10px] font-semibold text-slate-300 transition"
                >
                  + {preset}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 h-9 rounded-xl bg-orange-600 hover:bg-orange-500 text-xs font-black uppercase tracking-wider text-white transition-colors flex items-center gap-1.5 shadow-lg shadow-orange-600/20 disabled:opacity-50"
            >
              {saving ? <RefreshCw size={13} className="animate-spin" /> : <Check size={13} />}
              Create Category
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Edit Stock Modal ─── */
function EditStockModal({
  item,
  categories = [],
  onClose,
  onSave,
  saving,
}: {
  item: StockItem;
  categories?: string[];
  onClose: () => void;
  onSave: (updated: StockItem) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<StockItem>({ ...item });

  return (
    <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4 animate-in fade-in-50 zoom-in-95">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center">
              <Edit2 size={13} />
            </div>
            <h3 className="text-sm font-black text-white">Edit Stock Item</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Item Name</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              className="w-full h-9 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Category</label>
              <input
                type="text"
                list="inventory-categories-list"
                value={form.category}
                onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                className="w-full h-9 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
              />
              <datalist id="inventory-categories-list">
                {categories.filter(c => c !== 'All').map(c => <option key={c} value={c} />)}
              </datalist>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Unit</label>
              <input
                type="text"
                value={form.unit}
                onChange={e => setForm(p => ({ ...p, unit: e.target.value }))}
                className="w-full h-9 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Current Stock</label>
              <input
                type="number"
                min="0"
                value={form.currentStock}
                onChange={e => setForm(p => ({ ...p, currentStock: Number(e.target.value) || 0 }))}
                className="w-full h-9 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white font-bold focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Min Reorder</label>
              <input
                type="number"
                min="0"
                value={form.reorderLevel}
                onChange={e => setForm(p => ({ ...p, reorderLevel: Number(e.target.value) || 0 }))}
                className="w-full h-9 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white font-bold focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Cost Price (₹)</label>
              <input
                type="number"
                min="0"
                value={form.unitCost}
                onChange={e => setForm(p => ({ ...p, unitCost: Number(e.target.value) || 0 }))}
                className="w-full h-9 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white font-bold focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-4 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={saving}
            className="px-5 h-9 rounded-xl bg-orange-600 hover:bg-orange-500 text-xs font-black uppercase tracking-wider text-white transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            {saving ? <RefreshCw size={13} className="animate-spin" /> : <Check size={13} />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

export default function InventoryPage() {
  const [stock, setStock] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [showAddCatModal, setShowAddCatModal] = useState(false);
  const [addingCat, setAddingCat] = useState(false);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [editItem, setEditItem] = useState<StockItem | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('stock');
  const [propertyId, setPropertyId] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // Load custom categories from local storage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem('inventory_custom_categories');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const names = parsed
            .map((c: any) => (typeof c === 'string' ? c : c?.name))
            .filter((n: any): n is string => typeof n === 'string' && Boolean(n.trim()));
          setCustomCategories(names);
        }
      }
    } catch {
      // silent
    }
  }, []);

  // Fetch categories from DB
  const fetchDbCategories = useCallback(async (pid?: string) => {
    try {
      const url = pid ? `/api/categories?propertyId=${pid}` : '/api/categories';
      const res = await fetch(url);
      const data = await res.json();
      if (data?.success && Array.isArray(data?.data)) {
        const names = data.data
          .map((c: any) => (typeof c === 'string' ? c : c?.name))
          .filter((n: any): n is string => typeof n === 'string' && Boolean(n.trim()));
        setCustomCategories(prev => Array.from(new Set([...prev, ...names])));
      }
    } catch {
      // silent
    }
  }, []);

  // Fetch propertyId from session
  const fetchPropertyId = useCallback(async () => {
    try {
      const sessionRes = await fetch('/api/auth/session');
      const sessionData = await sessionRes.json();
      if (!sessionData.authenticated) return;

      const propRes = await fetch('/api/setup/properties');
      const propData = await propRes.json();
      if (propData.success && Array.isArray(propData.data) && propData.data.length > 0) {
        const current =
          propData.data.find((p: { id: string }) => p.id === sessionData.user?.propertyId)
          ?? propData.data[0];
        if (current?.id) {
          setPropertyId(current.id);
          fetchDbCategories(current.id);
        }
      }
    } catch {
      // silent
    }
  }, [fetchDbCategories]);

  // Load real inventory from DB
  const fetchInventory = useCallback(async (pid?: string) => {
    setLoading(true);
    try {
      const url = pid ? `/api/hotel/inventory-summary?propertyId=${pid}` : '/api/hotel/inventory-summary';
      const res = await fetch(url);
      const d = await res.json();
      if (d.success && d.data?.items?.length > 0) {
        const mapped: StockItem[] = d.data.items.map((item: any) => ({
          id: item.id,
          name: item.name,
          category: item.category || item.sku || 'General',
          unit: item.unit || 'Pcs',
          currentStock: item.currentQuantity ?? 0,
          reorderLevel: item.minThreshold ?? 0,
          maxStock: item.maxStock ?? (item.minThreshold ? item.minThreshold * 4 : 100),
          unitCost: item.costPrice ?? 0,
          supplier: item.supplier || 'Texco / HygienePro',
        }));
        setStock(mapped);
      } else {
        setStock([]);
      }
    } catch {
      setStock([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPropertyId();
  }, [fetchPropertyId]);

  useEffect(() => {
    fetchInventory(propertyId || undefined);
  }, [propertyId, fetchInventory]);

  // Handle adding a new category
  const handleCreateCategory = async (name: string, description?: string) => {
    setAddingCat(true);
    try {
      // 1. Post to API
      await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: description || 'Inventory Category',
          propertyId,
          menuType: 'INVENTORY',
        }),
      });

      // 2. Update state and local storage
      setCustomCategories(prev => {
        const next = Array.from(new Set([...prev, name]));
        try {
          localStorage.setItem('inventory_custom_categories', JSON.stringify(next));
        } catch {
          // silent
        }
        return next;
      });

      setCat(name);
      setShowAddCatModal(false);
      showToast(`✓ Category "${name}" added successfully`);
    } catch {
      showToast(`Added "${name}" locally`);
      setShowAddCatModal(false);
    } finally {
      setAddingCat(false);
    }
  };

  // Dynamic Categories from real stock + custom categories (strictly strings only)
  const categories = useMemo(() => {
    const fromStock = (stock || [])
      .map(s => s?.category)
      .filter((c): c is string => typeof c === 'string' && Boolean(c.trim()));
    const validCustom = (customCategories || [])
      .map(c => (typeof c === 'string' ? c : (c as any)?.name))
      .filter((c): c is string => typeof c === 'string' && Boolean(c.trim()));
    const merged = Array.from(new Set([...DEFAULT_CATEGORIES, ...validCustom, ...fromStock]));
    return merged;
  }, [stock, customCategories]);

  const items = useMemo(() => {
    if (!Array.isArray(stock)) return [];
    const targetCat = String(cat || 'All').trim().toLowerCase();
    const query = String(search || '').trim().toLowerCase();

    return stock
      .filter(i => {
        if (!i) return false;
        if (targetCat === 'all') return true;
        const itemCat = String(i.category || '').trim().toLowerCase();
        return itemCat === targetCat;
      })
      .filter(i => {
        if (!query) return true;
        const itemName = String(i.name || '').trim().toLowerCase();
        return itemName.includes(query);
      });
  }, [stock, cat, search]);

  const handleAddStock = async (entries: { item: StockItem; qty: number }[], newItems: StockItem[]) => {
    // 1. Optimistic update
    setStock(prev => {
      let next = [...prev];
      newItems.forEach(ni => {
        if (!next.find(s => s.id === ni.id)) next = [...next, ni];
      });
      return next.map(s => {
        const entry = entries.find(e => e.item.id === s.id);
        if (!entry) return s;
        return { ...s, currentStock: Math.min(s.maxStock, s.currentStock + entry.qty) };
      });
    });

    const totalQty = entries.reduce((s, e) => s + e.qty, 0);
    const msg = entries.length === 1
      ? `✓ ${entries[0].item.name} restocked +${entries[0].qty} ${entries[0].item.unit}`
      : `✓ ${entries.length} items restocked · ${totalQty} units added`;
    showToast(msg);

    // 2. Persist to API
    try {
      if (entries.length > 0) {
        await fetch('/api/hotel/inventory-summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'RESTOCK',
            propertyId,
            entries: entries.map(e => ({ id: e.item.id, qty: e.qty })),
          }),
        });
      }
      for (const ni of newItems) {
        await fetch('/api/hotel/inventory-summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'ADD_ITEM',
            propertyId,
            newItem: ni,
          }),
        });
      }
      fetchInventory(propertyId || undefined);
    } catch (err) {
      console.error('Failed to persist stock additions', err);
    }
  };

  const handleSaveEdit = async (updated: StockItem) => {
    setEditSaving(true);
    try {
      const res = await fetch('/api/hotel/inventory-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_ITEM',
          propertyId,
          updatedItem: updated,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStock(prev => prev.map(s => (s.id === updated.id ? updated : s)));
        showToast(`✓ Updated ${updated.name}`);
        setEditItem(null);
      } else {
        showToast(`Error: ${data.message || 'Could not update item'}`);
      }
    } catch {
      showToast('Error updating item');
    } finally {
      setEditSaving(false);
    }
  };

  // Kit usage → deduct from stock
  const handleStockDeduct = async (deductions: { itemId: string; qty: number }[]) => {
    setStock(prev =>
      prev.map(s => {
        const d = deductions.find(x => x.itemId === s.id);
        if (!d) return s;
        return { ...s, currentStock: Math.max(0, s.currentStock - d.qty) };
      })
    );

    try {
      for (const d of deductions) {
        await fetch('/api/hotel/inventory-summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'ADJUST_QTY',
            propertyId,
            itemId: d.itemId,
            quantityDelta: -d.qty,
            note: 'Kit usage deduction',
          }),
        });
      }
    } catch (err) {
      console.error('Failed to log kit deduction', err);
    }
  };

  return (
    <div className="space-y-5 pb-10 max-w-[1400px] mx-auto">
      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-[80] animate-in slide-in-from-top-3 duration-300 bg-emerald-600 text-white text-xs font-black px-5 py-3 rounded-2xl shadow-xl border border-emerald-500/40">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Package size={14} className="text-orange-400" />
            <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest">
              Operations · Inventory & Stock
            </span>
          </div>
          <h1 className="text-2xl font-black text-white">Inventory Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {stock.length} items tracked · Real-time stock levels & low stock alerts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchInventory(propertyId || undefined)}
            className="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-colors"
            title="Refresh Stock Data"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          {activeTab === 'stock' && (
            <>
              <button
                onClick={() => setShowAddCatModal(true)}
                className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-orange-400 hover:text-orange-300 text-xs font-bold transition-colors shrink-0 whitespace-nowrap cursor-pointer"
                title="Create a new Inventory Category"
              >
                <FolderPlus size={14} /> Add Category
              </button>
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-black uppercase tracking-wider transition-colors shadow-lg shadow-orange-600/20 shrink-0 whitespace-nowrap cursor-pointer"
              >
                <Plus size={14} /> Add Stock / Restock
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1.5 border-b border-white/6 pb-0">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 h-9 px-4 rounded-t-xl text-xs font-black uppercase tracking-wider transition-all
              ${activeTab === tab.id
                ? 'bg-orange-600 text-white border-b-2 border-orange-400'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Stock Tab ── */}
      {activeTab === 'stock' && (
        <>
          <StockStats items={stock} />
          <LowStockAlert items={stock} />

          {/* Search + Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search items by name…"
                className="w-full h-9 pl-9 pr-4 bg-slate-800/60 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500"
              />
            </div>
            <div className="flex gap-1.5 flex-wrap items-center">
              {categories.map(c => (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  className={`px-3 h-9 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors
                    ${cat === c ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                >
                  {c}
                </button>
              ))}
              <button
                onClick={() => setShowAddCatModal(true)}
                className="px-3 h-9 rounded-xl text-[10px] font-black uppercase tracking-wider bg-orange-600/15 hover:bg-orange-600/25 text-orange-400 border border-orange-500/30 flex items-center gap-1 transition-colors cursor-pointer"
                title="Add New Inventory Category"
              >
                <Plus size={12} /> Add Category
              </button>
            </div>
          </div>

          <StockTable items={items} onEdit={item => setEditItem(item)} />
        </>
      )}

      {/* ── Kit Mapping Tab ── */}
      {activeTab === 'kits' && (
        <KitMappingPanel
          allStock={stock}
          propertyId={propertyId}
          onStockDeduct={handleStockDeduct}
        />
      )}

      {/* ── Usage Calculator Tab ── */}
      {activeTab === 'calculator' && (
        <UsageCalculatorPanel
          allStock={stock}
          propertyId={propertyId}
        />
      )}

      {/* ── Staff Requests Tab ── */}
      {activeTab === 'requests' && (
        <StaffRequestsPanel
          propertyId={propertyId}
          onRefreshStock={() => fetchInventory(propertyId || undefined)}
        />
      )}

      {/* Add Stock Modal */}
      {showModal && (
        <AddStockModal
          allItems={stock}
          existingCategories={categories.filter(c => c !== 'All')}
          onClose={() => setShowModal(false)}
          onConfirm={handleAddStock}
        />
      )}

      {/* Add Category Modal */}
      {showAddCatModal && (
        <AddCategoryModal
          onClose={() => setShowAddCatModal(false)}
          onSave={handleCreateCategory}
          saving={addingCat}
        />
      )}

      {/* Edit Item Modal */}
      {editItem && (
        <EditStockModal
          item={editItem}
          categories={categories}
          onClose={() => setEditItem(null)}
          onSave={handleSaveEdit}
          saving={editSaving}
        />
      )}
    </div>
  );
}
