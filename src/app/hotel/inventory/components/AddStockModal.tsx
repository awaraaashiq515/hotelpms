'use client';
import React, { useState, useMemo } from 'react';
import {
  X, Search, Package, CheckCircle2, ChevronRight,
  Plus, Minus, ShoppingCart, ArrowLeft, Sparkles,
  PlusCircle, Tag, Hash, Layers, IndianRupee, Truck,
} from 'lucide-react';
import type { StockItem } from './LowStockAlert';

/* ─── Category colour map ─── */
const CAT_COLORS: Record<string, string> = {
  'Linen':        'bg-indigo-500/15 text-indigo-300 border-indigo-500/25',
  'Toiletries':   'bg-purple-500/15 text-purple-300 border-purple-500/25',
  'F&B':          'bg-amber-500/15  text-amber-300  border-amber-500/25',
  'Stationery':   'bg-sky-500/15    text-sky-300    border-sky-500/25',
  'Housekeeping': 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
  'Safety':       'bg-rose-500/15   text-rose-300   border-rose-500/25',
  'Electronics':  'bg-cyan-500/15   text-cyan-300   border-cyan-500/25',
  'Furniture':    'bg-orange-500/15 text-orange-300 border-orange-500/25',
  'Kitchen':      'bg-yellow-500/15 text-yellow-300 border-yellow-500/25',
  'Maintenance':  'bg-gray-500/15   text-gray-300   border-gray-500/25',
};

const ALL_CATEGORIES = Object.keys(CAT_COLORS);
const ALL_UNITS = ['Pcs', 'Set', 'Kg', 'Litre', 'Bottle', 'Roll', 'Ream', 'Box', 'Pair', 'Packet', 'Can', 'Bag', 'Strip', 'Dozen'];

interface QtyEntry { item: StockItem; qty: number }

interface AddStockModalProps {
  allItems: StockItem[];
  onClose: () => void;
  onConfirm: (entries: QtyEntry[], newItems: StockItem[]) => void;
}

/* ─────────────────────────────────────────────
   Add New Item inline form
───────────────────────────────────────────── */
function AddNewItemForm({
  onAdd,
  onCancel,
  existingCategories,
}: {
  onAdd: (item: StockItem) => void;
  onCancel: () => void;
  existingCategories: string[];
}) {
  const [form, setForm] = useState({
    name: '', category: existingCategories[0] ?? 'Linen', unit: 'Pcs',
    currentStock: '', maxStock: '', reorderLevel: '', unitCost: '', supplier: '',
  });
  const [err, setErr] = useState('');

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleAdd = () => {
    if (!form.name.trim())       return setErr('Product name is required');
    if (!form.maxStock)          return setErr('Max stock is required');
    if (!form.unitCost)          return setErr('Unit cost is required');
    setErr('');
    const item: StockItem = {
      id: `new_${Date.now()}`,
      name:         form.name.trim(),
      category:     form.category,
      unit:         form.unit,
      currentStock: parseInt(form.currentStock) || 0,
      maxStock:     parseInt(form.maxStock) || 100,
      reorderLevel: parseInt(form.reorderLevel) || Math.floor((parseInt(form.maxStock) || 100) * 0.2),
      unitCost:     parseFloat(form.unitCost) || 0,
      supplier:     form.supplier.trim() || undefined,
    };
    onAdd(item);
  };

  const cats = [...new Set([...ALL_CATEGORIES, ...existingCategories])];

  return (
    <div className="rounded-2xl border-2 border-orange-500/40 bg-orange-500/5 p-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
      <div className="flex items-center gap-2 mb-1">
        <PlusCircle size={14} className="text-orange-400" />
        <span className="text-[11px] font-black text-orange-300 uppercase tracking-wider">Add New Product</span>
        <button onClick={onCancel} className="ml-auto text-slate-500 hover:text-slate-300">
          <X size={13} />
        </button>
      </div>

      {/* Row 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-1">
            <Tag size={9} /> Product Name *
          </label>
          <input value={form.name} onChange={e => set('name', e.target.value)}
            placeholder="e.g. Mineral Water 500ml"
            className="w-full h-8 px-3 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white
                       placeholder:text-slate-600 focus:outline-none focus:border-orange-500 transition-colors" />
        </div>
        <div>
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-1">
            <Layers size={9} /> Category
          </label>
          <select value={form.category} onChange={e => set('category', e.target.value)}
            className="w-full h-8 px-3 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-orange-500">
            {cats.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-1">
            <Hash size={9} /> Unit
          </label>
          <select value={form.unit} onChange={e => set('unit', e.target.value)}
            className="w-full h-8 px-3 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-orange-500">
            {ALL_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1 block">Max Stock *</label>
          <input type="number" value={form.maxStock} onChange={e => set('maxStock', e.target.value)}
            placeholder="100"
            className="w-full h-8 px-3 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white
                       placeholder:text-slate-600 focus:outline-none focus:border-orange-500 transition-colors" />
        </div>
        <div>
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1 block">Reorder At</label>
          <input type="number" value={form.reorderLevel} onChange={e => set('reorderLevel', e.target.value)}
            placeholder="20"
            className="w-full h-8 px-3 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white
                       placeholder:text-slate-600 focus:outline-none focus:border-orange-500 transition-colors" />
        </div>
      </div>

      {/* Row 3 */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-1">
            <IndianRupee size={9} /> Unit Cost (₹) *
          </label>
          <input type="number" value={form.unitCost} onChange={e => set('unitCost', e.target.value)}
            placeholder="0.00"
            className="w-full h-8 px-3 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white
                       placeholder:text-slate-600 focus:outline-none focus:border-orange-500 transition-colors" />
        </div>
        <div>
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-1">
            <Truck size={9} /> Supplier
          </label>
          <input value={form.supplier} onChange={e => set('supplier', e.target.value)}
            placeholder="Supplier name"
            className="w-full h-8 px-3 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white
                       placeholder:text-slate-600 focus:outline-none focus:border-orange-500 transition-colors" />
        </div>
      </div>

      {err && <p className="text-[10px] text-rose-400 font-bold">{err}</p>}

      <div className="flex gap-2 pt-1">
        <button onClick={onCancel}
          className="h-8 px-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-black transition-colors">
          Cancel
        </button>
        <button onClick={handleAdd}
          className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-xl
                     bg-orange-600 hover:bg-orange-500 text-white text-xs font-black transition-colors">
          <Plus size={12} /> Add & Select
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Step 1: Product picker
───────────────────────────────────────────── */
function ProductPicker({
  allItems,
  selected,
  onToggle,
  onNext,
  onNewItemAdded,
}: {
  allItems: StockItem[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onNext: () => void;
  onNewItemAdded: (item: StockItem) => void;
}) {
  const [search,      setSearch]      = useState('');
  const [cat,         setCat]         = useState('All');
  const [showAddForm, setShowAddForm] = useState(false);

  const cats = ['All', ...Array.from(new Set(allItems.map(i => i.category)))];

  const visible = useMemo(() =>
    allItems
      .filter(i => cat === 'All' || i.category === cat)
      .filter(i => !search || i.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name)),
    [allItems, cat, search]
  );

  const handleNewItem = (item: StockItem) => {
    onNewItemAdded(item);
    onToggle(item.id);          // auto-select
    setShowAddForm(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-white/5">
        <p className="text-[9px] font-black text-orange-400 uppercase tracking-widest mb-1">
          Step 1 of 2 · Select Products
        </p>
        <h2 className="text-xl font-black text-white">Choose Items to Restock</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Select products below — or create a new one on the spot
        </p>
      </div>

      {/* Search + Filter */}
      <div className="px-6 py-3 flex flex-col gap-2 border-b border-white/5">
        <div className="relative">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products…"
            className="w-full h-9 pl-8 pr-3 bg-slate-800/60 border border-slate-700 rounded-xl
                       text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500 transition-colors"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {cats.map(c => (
            <button key={c} onClick={() => setCat(c)}
              className={`px-3 h-7 rounded-lg text-[9px] font-black uppercase tracking-wider transition-colors
                ${cat === c ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Product list */}
      <div className="flex-1 overflow-y-auto px-6 py-3 space-y-2">

        {/* ── Add New Item card / form ── */}
        {!showAddForm ? (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full flex items-center gap-3 rounded-2xl border border-dashed border-orange-500/40
                       bg-orange-500/5 hover:bg-orange-500/10 hover:border-orange-500/70
                       p-3 transition-all duration-200 group"
          >
            <div className="w-9 h-9 rounded-xl bg-orange-500/20 flex items-center justify-center flex-shrink-0">
              <Plus size={16} className="text-orange-400" />
            </div>
            <div className="text-left">
              <p className="text-[11px] font-black text-orange-300">+ Add New Item</p>
              <p className="text-[9px] text-slate-500">Create a new product & add to inventory</p>
            </div>
          </button>
        ) : (
          <AddNewItemForm
            onAdd={handleNewItem}
            onCancel={() => setShowAddForm(false)}
            existingCategories={Array.from(new Set(allItems.map(i => i.category)))}
          />
        )}

        {/* ── Existing products ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {visible.map(item => {
            const isSelected = selected.has(item.id);
            const isLow = item.currentStock <= item.reorderLevel;
            const catColor = CAT_COLORS[item.category] ?? 'bg-slate-700/40 text-slate-300 border-slate-600/30';

            return (
              <button
                key={item.id}
                onClick={() => onToggle(item.id)}
                className={`relative text-left rounded-2xl border p-3 transition-all duration-200
                  ${isSelected
                    ? 'border-orange-500/60 bg-orange-500/8 shadow-lg shadow-orange-500/10'
                    : 'border-white/6 bg-slate-800/40 hover:border-white/15 hover:bg-slate-800/70'
                  }`}
              >
                {/* Tick */}
                <div className={`absolute top-3 right-3 transition-all duration-200
                  ${isSelected ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
                  <CheckCircle2 size={16} className="text-orange-400" />
                </div>

                <div className="flex items-start gap-2.5 pr-5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
                    ${isSelected ? 'bg-orange-500/20' : 'bg-slate-700/60'}`}>
                    <Package size={14} className={isSelected ? 'text-orange-300' : 'text-slate-400'} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-black text-white leading-tight truncate">{item.name}</p>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md border ${catColor}`}>
                        {item.category}
                      </span>
                      {isLow && (
                        <span className="text-[8px] font-black px-1.5 py-0.5 rounded-md bg-rose-500/15 text-rose-300 border border-rose-500/25">
                          LOW STOCK
                        </span>
                      )}
                    </div>
                    <p className="text-[9px] text-slate-500 mt-1.5">
                      Stock: <span className={`font-bold ${isLow ? 'text-rose-400' : 'text-slate-300'}`}>
                        {item.currentStock} {item.unit}
                      </span>
                      <span className="mx-1 text-slate-700">·</span>
                      Max: {item.maxStock}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}

          {visible.length === 0 && !showAddForm && (
            <div className="col-span-2 text-center py-8 text-slate-600 text-xs">
              No products match · Try adding a new one above
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between">
        <span className="text-xs text-slate-500">
          {selected.size > 0
            ? <span className="text-orange-300 font-black">{selected.size} item{selected.size > 1 ? 's' : ''} selected</span>
            : 'Select at least 1 item'}
        </span>
        <button
          disabled={selected.size === 0}
          onClick={onNext}
          className="flex items-center gap-2 h-9 px-5 rounded-xl bg-orange-600 hover:bg-orange-500
                     text-white text-xs font-black uppercase tracking-wider transition-all
                     disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Set Quantity <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Step 2: Quantity setter
───────────────────────────────────────────── */
function QuantitySetter({
  entries,
  onChange,
  onBack,
  onConfirm,
}: {
  entries: QtyEntry[];
  onChange: (id: string, qty: number) => void;
  onBack: () => void;
  onConfirm: () => void;
}) {
  const totalItems = entries.reduce((s, e) => s + e.qty, 0);
  const totalCost  = entries.reduce((s, e) => s + e.qty * e.item.unitCost, 0);
  const allValid   = entries.every(e => e.qty > 0);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-white/5">
        <p className="text-[9px] font-black text-orange-400 uppercase tracking-widest mb-1">
          Step 2 of 2 · Set Quantity
        </p>
        <h2 className="text-xl font-black text-white">How Many to Add?</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          {entries.length} product{entries.length > 1 ? 's' : ''} · Set restock qty for each
        </p>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {entries.map(({ item, qty }) => {
          const isLow     = item.currentStock <= item.reorderLevel;
          const afterStock = item.currentStock + qty;
          const overMax   = afterStock > item.maxStock;
          const catColor  = CAT_COLORS[item.category] ?? 'bg-slate-700/40 text-slate-300 border-slate-600/30';

          return (
            <div key={item.id} className="rounded-2xl border border-white/8 bg-slate-800/40 p-4">
              {/* Info */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                  ${isLow ? 'bg-rose-500/15' : 'bg-slate-700/60'}`}>
                  <Package size={15} className={isLow ? 'text-rose-300' : 'text-slate-400'} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-black text-white truncate">{item.name}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md border ${catColor}`}>
                      {item.category}
                    </span>
                    <span className="text-[9px] text-slate-500">
                      Stock: <span className={isLow ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                        {item.currentStock}
                      </span> / {item.maxStock} {item.unit}
                    </span>
                  </div>
                </div>
              </div>

              {/* Qty control */}
              <div className="flex items-center gap-3">
                <button onClick={() => onChange(item.id, Math.max(0, qty - 1))}
                  className="w-9 h-9 rounded-xl bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-colors">
                  <Minus size={13} className="text-slate-300" />
                </button>
                <input
                  type="number" min={0}
                  value={qty === 0 ? '' : qty}
                  placeholder="0"
                  onChange={e => onChange(item.id, Math.max(0, parseInt(e.target.value) || 0))}
                  className="flex-1 h-9 text-center bg-slate-900/60 border border-slate-700 rounded-xl
                             text-sm font-black text-white focus:outline-none focus:border-orange-500 transition-colors"
                />
                <button onClick={() => onChange(item.id, qty + 1)}
                  className="w-9 h-9 rounded-xl bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-colors">
                  <Plus size={13} className="text-slate-300" />
                </button>
                <span className="text-[10px] text-slate-500 w-10 text-right">{item.unit}</span>
              </div>

              {/* After preview */}
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[9px] text-slate-600">After restock:</span>
                <span className={`text-[10px] font-black ${
                  overMax ? 'text-amber-400' : qty > 0 ? 'text-emerald-400' : 'text-slate-500'
                }`}>
                  {afterStock} {item.unit}
                  {overMax && <span className="text-[8px] ml-1 text-amber-500">(exceeds max)</span>}
                </span>
              </div>
              <div className="mt-2 w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    overMax ? 'bg-amber-500' : qty > 0 ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${Math.min(100, (afterStock / item.maxStock) * 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-white/5 space-y-3">
        <div className="rounded-xl bg-slate-900/60 border border-white/6 p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart size={13} className="text-orange-400" />
            <span className="text-[10px] text-slate-400">
              <span className="font-black text-white">{totalItems}</span> units ·{' '}
              <span className="font-black text-white">{entries.length}</span> items
            </span>
          </div>
          <span className="text-[10px] font-black text-emerald-300">
            ₹{totalCost.toLocaleString('en-IN')} est.
          </span>
        </div>
        <div className="flex gap-2">
          <button onClick={onBack}
            className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-slate-700 hover:bg-slate-600
                       text-white text-xs font-black transition-colors">
            <ArrowLeft size={12} /> Back
          </button>
          <button
            disabled={!allValid || totalItems === 0}
            onClick={onConfirm}
            className="flex-1 flex items-center justify-center gap-2 h-9 rounded-xl bg-orange-600
                       hover:bg-orange-500 text-white text-xs font-black uppercase tracking-wider
                       transition-all disabled:opacity-30 disabled:cursor-not-allowed">
            <Sparkles size={12} /> Confirm & Add Stock
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main Modal
───────────────────────────────────────────── */
export function AddStockModal({ allItems: initialItems, onClose, onConfirm }: AddStockModalProps) {
  const [step,      setStep]      = useState<1 | 2>(1);
  const [selected,  setSelected]  = useState<Set<string>>(new Set());
  const [qtys,      setQtys]      = useState<Record<string, number>>({});
  const [localList, setLocalList] = useState<StockItem[]>(initialItems);
  const [newItems,  setNewItems]  = useState<StockItem[]>([]);

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleNewItemAdded = (item: StockItem) => {
    setLocalList(prev => [...prev, item]);
    setNewItems(prev => [...prev, item]);
  };

  const goToStep2 = () => {
    setQtys(prev => {
      const next = { ...prev };
      selected.forEach(id => { if (!next[id]) next[id] = 1; });
      return next;
    });
    setStep(2);
  };

  const entries: QtyEntry[] = localList
    .filter(i => selected.has(i.id))
    .map(i => ({ item: i, qty: qtys[i.id] ?? 1 }));

  const handleQtyChange = (id: string, qty: number) =>
    setQtys(prev => ({ ...prev, [id]: qty }));

  const handleConfirm = () => {
    onConfirm(entries, newItems);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full sm:max-w-2xl sm:rounded-3xl rounded-t-3xl
                      bg-slate-900 border border-white/8 shadow-2xl
                      flex flex-col h-[92vh] sm:h-[88vh]
                      animate-in slide-in-from-bottom-4 duration-300">

        {/* Close */}
        <button onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700
                     flex items-center justify-center transition-colors">
          <X size={14} className="text-slate-400" />
        </button>

        {/* Step dots */}
        <div className="absolute top-5 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {[1, 2].map(s => (
            <div key={s} className={`h-1 rounded-full transition-all duration-300
              ${s === step ? 'w-6 bg-orange-500' : s < step ? 'w-3 bg-orange-500/50' : 'w-3 bg-slate-700'}`} />
          ))}
        </div>

        {step === 1 ? (
          <ProductPicker
            allItems={localList}
            selected={selected}
            onToggle={toggle}
            onNext={goToStep2}
            onNewItemAdded={handleNewItemAdded}
          />
        ) : (
          <QuantitySetter
            entries={entries}
            onChange={handleQtyChange}
            onBack={() => setStep(1)}
            onConfirm={handleConfirm}
          />
        )}
      </div>
    </div>
  );
}
