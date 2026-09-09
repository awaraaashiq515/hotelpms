'use client';
import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, X, Trash2, Edit2, Check, ChevronDown, ChevronUp,
  Package, Layers, Search, Loader2, BookOpen, Zap, Users,
} from 'lucide-react';
import type { StockItem } from './LowStockAlert';

/* ─── Types ─────────────────────────────────────────────── */
interface KitItem {
  id?: string;
  itemId: string;
  itemName: string;
  category?: string;
  unit?: string;
  qtyPerUse: number;
}

interface Kit {
  id: string;
  name: string;
  description?: string;
  kitType: string;
  items: KitItem[];
  usageLogs?: { usedAt: string; usedCount: number }[];
}

const KIT_TYPE_OPTS = [
  { value: 'ROOM',    label: 'Room Turnover',   color: 'bg-blue-500/15 text-blue-300 border-blue-500/30' },
  { value: 'SUITE',   label: 'Suite Kit',        color: 'bg-purple-500/15 text-purple-300 border-purple-500/30' },
  { value: 'GUEST',   label: 'Guest Welcome',    color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  { value: 'SERVICE', label: 'Service Kit',      color: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  { value: 'CUSTOM',  label: 'Custom',           color: 'bg-slate-500/15 text-slate-300 border-slate-500/30' },
];

function kitTypeInfo(type: string) {
  return KIT_TYPE_OPTS.find(k => k.value === type) ?? KIT_TYPE_OPTS[4];
}

/* ─── Item Picker Row inside Create/Edit form ─── */
function ItemPickerRow({
  allStock, row, onChange, onRemove,
}: {
  allStock: StockItem[];
  row: KitItem;
  onChange: (updated: KitItem) => void;
  onRemove: () => void;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const filtered = allStock.filter(s =>
    !query || s.name.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 10);

  const selectItem = (item: StockItem) => {
    onChange({ ...row, itemId: item.id, itemName: item.name, category: item.category, unit: item.unit });
    setQuery('');
    setOpen(false);
  };

  return (
    <div className="flex items-center gap-2 bg-slate-900/40 rounded-xl p-2.5 border border-white/6">
      {/* Item selector */}
      <div className="relative flex-1">
        <div
          onClick={() => setOpen(v => !v)}
          className="h-8 px-3 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white
                     flex items-center justify-between cursor-pointer hover:border-orange-500 transition-colors"
        >
          <span className={row.itemName ? 'text-white' : 'text-slate-500'}>
            {row.itemName || 'Select item…'}
          </span>
          <ChevronDown size={12} className="text-slate-500" />
        </div>
        {open && (
          <div className="absolute top-9 left-0 right-0 z-50 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl overflow-hidden">
            <div className="p-2 border-b border-slate-700">
              <div className="relative">
                <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  autoFocus
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search…"
                  className="w-full h-7 pl-7 pr-2 bg-slate-900 rounded-lg text-xs text-white placeholder:text-slate-600 focus:outline-none"
                />
              </div>
            </div>
            <div className="max-h-44 overflow-y-auto">
              {filtered.map(s => (
                <button
                  key={s.id}
                  onClick={() => selectItem(s)}
                  className="w-full text-left px-3 py-2 hover:bg-slate-700 text-xs text-white flex items-center justify-between"
                >
                  <span>{s.name}</span>
                  <span className="text-slate-500 text-[9px]">{s.category} · {s.unit}</span>
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="text-xs text-slate-600 text-center py-3">No items found</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Qty */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange({ ...row, qtyPerUse: Math.max(0.5, row.qtyPerUse - (row.qtyPerUse > 1 ? 1 : 0.5)) })}
          className="w-7 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-300 text-sm"
        >-</button>
        <input
          type="number"
          min={0.1}
          step={0.5}
          value={row.qtyPerUse}
          onChange={e => onChange({ ...row, qtyPerUse: parseFloat(e.target.value) || 1 })}
          className="w-14 h-8 text-center bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-orange-500"
        />
        <button
          onClick={() => onChange({ ...row, qtyPerUse: row.qtyPerUse + (row.qtyPerUse >= 1 ? 1 : 0.5) })}
          className="w-7 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-300 text-sm"
        >+</button>
        <span className="text-[9px] text-slate-500 w-8 truncate">{row.unit || 'pcs'}</span>
      </div>

      {/* Remove */}
      <button onClick={onRemove} className="w-7 h-7 flex items-center justify-center text-slate-600 hover:text-rose-400 transition-colors">
        <X size={13} />
      </button>
    </div>
  );
}

/* ─── Create / Edit Form ─── */
function KitForm({
  allStock,
  initial,
  onSave,
  onCancel,
  saving,
}: {
  allStock: StockItem[];
  initial?: Partial<Kit>;
  onSave: (data: Omit<Kit, 'id' | 'usageLogs'>) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [desc, setDesc] = useState(initial?.description ?? '');
  const [kitType, setKitType] = useState(initial?.kitType ?? 'ROOM');
  const [rows, setRows] = useState<KitItem[]>(
    initial?.items?.length
      ? initial.items
      : [{ itemId: '', itemName: '', qtyPerUse: 1 }]
  );
  const [err, setErr] = useState('');

  const addRow = () => setRows(r => [...r, { itemId: '', itemName: '', qtyPerUse: 1 }]);
  const updateRow = (i: number, updated: KitItem) => setRows(r => r.map((row, idx) => idx === i ? updated : row));
  const removeRow = (i: number) => setRows(r => r.filter((_, idx) => idx !== i));

  const handleSave = () => {
    if (!name.trim()) return setErr('Kit name is required');
    const validRows = rows.filter(r => r.itemId && r.qtyPerUse > 0);
    if (validRows.length === 0) return setErr('Add at least 1 item with quantity');
    setErr('');
    onSave({ name: name.trim(), description: desc, kitType, items: validRows });
  };

  return (
    <div className="rounded-2xl border border-orange-500/30 bg-orange-500/5 p-5 space-y-4 animate-in slide-in-from-top-2 duration-200">
      <div className="flex items-center gap-2">
        <BookOpen size={14} className="text-orange-400" />
        <span className="text-[11px] font-black text-orange-300 uppercase tracking-wider">
          {initial?.id ? 'Edit Kit Recipe' : 'Create New Kit Recipe'}
        </span>
        <button onClick={onCancel} className="ml-auto text-slate-500 hover:text-slate-300">
          <X size={13} />
        </button>
      </div>

      {/* Name + Type */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-1">Kit Name *</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Standard Room Turnover"
            className="w-full h-9 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white
                       placeholder:text-slate-600 focus:outline-none focus:border-orange-500 transition-colors"
          />
        </div>
        <div>
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-1">Kit Type</label>
          <select
            value={kitType}
            onChange={e => setKitType(e.target.value)}
            className="w-full h-9 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
          >
            {KIT_TYPE_OPTS.map(k => <option key={k.value} value={k.value}>{k.label}</option>)}
          </select>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-1">Description (optional)</label>
        <input
          value={desc}
          onChange={e => setDesc(e.target.value)}
          placeholder="Brief description…"
          className="w-full h-8 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white
                     placeholder:text-slate-600 focus:outline-none focus:border-orange-500 transition-colors"
        />
      </div>

      {/* Items */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">
            Items in this Kit *
          </label>
          <button
            onClick={addRow}
            className="flex items-center gap-1 text-[9px] font-black text-orange-400 hover:text-orange-300 uppercase tracking-wider"
          >
            <Plus size={10} /> Add Row
          </button>
        </div>
        <div className="space-y-2">
          {rows.map((row, i) => (
            <ItemPickerRow
              key={i}
              allStock={allStock}
              row={row}
              onChange={updated => updateRow(i, updated)}
              onRemove={() => removeRow(i)}
            />
          ))}
        </div>
      </div>

      {err && <p className="text-[10px] text-rose-400 font-bold">{err}</p>}

      <div className="flex gap-2 pt-1">
        <button
          onClick={onCancel}
          className="h-9 px-5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-black transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 h-9 rounded-xl bg-orange-600 hover:bg-orange-500
                     text-white text-xs font-black uppercase tracking-wider transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
          {initial?.id ? 'Save Changes' : 'Create Kit'}
        </button>
      </div>
    </div>
  );
}

/* ─── Use Kit Modal ─── */
function UseKitModal({
  kit,
  allStock,
  onConfirm,
  onClose,
}: {
  kit: Kit;
  allStock: StockItem[];
  onConfirm: (count: number, note: string) => void;
  onClose: () => void;
}) {
  const [count, setCount] = useState(1);
  const [note, setNote] = useState('');

  // Check stock coverage
  const stockMap = Object.fromEntries(allStock.map(s => [s.id, s.currentStock]));
  const rows = kit.items.map(item => {
    const available = stockMap[item.itemId] ?? 0;
    const needed = item.qtyPerUse * count;
    const canDo = available > 0 ? Math.floor(available / item.qtyPerUse) : 0;
    const ok = available >= needed;
    return { ...item, available, needed, canDo, ok };
  });
  const bottleneck = rows.reduce((m, r) => Math.min(m, r.canDo), Infinity);
  const maxPossible = isFinite(bottleneck) ? bottleneck : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl shadow-2xl
                      animate-in slide-in-from-bottom-4 duration-300 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-white/6">
          <div className="flex items-center gap-2 mb-1">
            <Zap size={14} className="text-orange-400" />
            <span className="text-[9px] font-black text-orange-400 uppercase tracking-widest">Use Kit</span>
          </div>
          <h2 className="text-lg font-black text-white">{kit.name}</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Stock can currently serve <span className="text-emerald-400 font-black">{maxPossible}</span> times
          </p>
        </div>

        {/* Count */}
        <div className="px-6 py-4 border-b border-white/6">
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-2">
            How many times to use?
          </label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCount(c => Math.max(1, c - 1))}
              className="w-10 h-10 rounded-xl bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-white text-xl font-black"
            >-</button>
            <input
              type="number" min={1} max={maxPossible || 999}
              value={count}
              onChange={e => setCount(Math.max(1, parseInt(e.target.value) || 1))}
              className="flex-1 h-10 text-center text-xl font-black bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-orange-500"
            />
            <button
              onClick={() => setCount(c => c + 1)}
              className="w-10 h-10 rounded-xl bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-white text-xl font-black"
            >+</button>
          </div>
        </div>

        {/* Stock preview */}
        <div className="px-6 py-3 space-y-2 max-h-52 overflow-y-auto">
          {rows.map((row, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span className="text-slate-300 truncate max-w-[180px]">{row.itemName}</span>
              <div className="flex items-center gap-2">
                <span className={`font-black ${row.ok ? 'text-emerald-400' : 'text-rose-400'}`}>
                  -{row.needed} {row.unit}
                </span>
                <span className="text-slate-600 text-[9px]">({row.available} avail)</span>
                {!row.ok && (
                  <span className="text-[9px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded font-black">
                    LOW
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Note */}
        <div className="px-6 pb-3">
          <input
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Note (optional, e.g. Room 101)"
            className="w-full h-9 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white
                       placeholder:text-slate-600 focus:outline-none focus:border-orange-500"
          />
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-2">
          <button onClick={onClose}
            className="h-10 px-5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-black transition-colors">
            Cancel
          </button>
          <button
            onClick={() => onConfirm(count, note)}
            className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl bg-orange-600 hover:bg-orange-500
                       text-white text-xs font-black uppercase tracking-wider transition-colors"
          >
            <Zap size={13} /> Deduct Stock ({count}×)
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Kit Card ─── */
function KitCard({
  kit, allStock, onEdit, onDelete, onUse,
}: {
  kit: Kit;
  allStock: StockItem[];
  onEdit: () => void;
  onDelete: () => void;
  onUse: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const typeInfo = kitTypeInfo(kit.kitType);

  // Capacity calc
  const stockMap = Object.fromEntries(allStock.map(s => [s.id, s.currentStock]));
  const capacities = kit.items.map(item => {
    const avail = stockMap[item.itemId] ?? 0;
    return item.qtyPerUse > 0 ? Math.floor(avail / item.qtyPerUse) : 0;
  });
  const maxCapacity = capacities.length > 0 ? Math.min(...capacities) : 0;
  const bottleneckItem = kit.items[capacities.indexOf(maxCapacity)];

  const totalUsage = (kit.usageLogs ?? []).reduce((s, l) => s + l.usedCount, 0);

  return (
    <div className="rounded-2xl border border-white/8 bg-slate-800/40 hover:border-white/15 transition-all duration-200">
      {/* Top row */}
      <div className="p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-orange-500/15 flex items-center justify-center flex-shrink-0">
          <Layers size={16} className="text-orange-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-black text-white truncate">{kit.name}</h3>
            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md border ${typeInfo.color}`}>
              {typeInfo.label}
            </span>
          </div>
          {kit.description && (
            <p className="text-[10px] text-slate-500 mt-0.5 truncate">{kit.description}</p>
          )}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="text-[10px] text-slate-500">
              <span className="font-black text-white">{kit.items.length}</span> items
            </span>
            <span className="text-[10px] text-slate-500">
              Used <span className="font-black text-white">{totalUsage}×</span>
            </span>
            <div className={`flex items-center gap-1 text-[10px] font-black ${
              maxCapacity === 0 ? 'text-rose-400' : maxCapacity < 5 ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              <Users size={9} />
              Can serve {maxCapacity} more
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={onUse}
            className="flex items-center gap-1 h-8 px-3 rounded-xl bg-orange-600 hover:bg-orange-500
                       text-white text-[10px] font-black uppercase tracking-wider transition-colors"
          >
            <Zap size={10} /> Use
          </button>
          <button onClick={onEdit}
            className="w-8 h-8 rounded-xl bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-colors">
            <Edit2 size={12} className="text-slate-300" />
          </button>
          <button onClick={onDelete}
            className="w-8 h-8 rounded-xl bg-slate-700 hover:bg-rose-900/50 flex items-center justify-center transition-colors">
            <Trash2 size={12} className="text-slate-500 hover:text-rose-400" />
          </button>
          <button onClick={() => setExpanded(v => !v)}
            className="w-8 h-8 rounded-xl bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-colors">
            {expanded ? <ChevronUp size={12} className="text-slate-400" /> : <ChevronDown size={12} className="text-slate-400" />}
          </button>
        </div>
      </div>

      {/* Expanded: Item breakdown */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-1.5">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-2">Recipe — per use:</p>
          {kit.items.map((item, i) => {
            const avail = stockMap[item.itemId] ?? 0;
            const isBottleneck = bottleneckItem?.itemId === item.itemId;
            return (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package size={9} className="text-slate-600" />
                  <span className="text-[11px] text-white">{item.itemName}</span>
                  {isBottleneck && (
                    <span className="text-[8px] bg-amber-500/20 text-amber-300 px-1 rounded font-black">BOTTLENECK</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="text-orange-300 font-black">{item.qtyPerUse} {item.unit}</span>
                  <span className="text-slate-600">/ {avail} avail</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Main Panel ─── */
export function KitMappingPanel({
  allStock,
  propertyId,
  onStockDeduct,
}: {
  allStock: StockItem[];
  propertyId: string;
  onStockDeduct: (deductions: { itemId: string; qty: number }[]) => void;
}) {
  const [kits, setKits] = useState<Kit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editKit, setEditKit] = useState<Kit | null>(null);
  const [useKit, setUseKit] = useState<Kit | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const fetchKits = useCallback(async () => {
    if (!propertyId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/inventory/kits?propertyId=${propertyId}`);
      const data = await res.json();
      if (data.data) setKits(data.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => { fetchKits(); }, [fetchKits]);

  const handleCreate = async (formData: Omit<Kit, 'id' | 'usageLogs'>) => {
    setSaving(true);
    try {
      const res = await fetch('/api/inventory/kits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, propertyId }),
      });
      const data = await res.json();
      if (data.data) {
        setKits(prev => [data.data, ...prev]);
        setShowForm(false);
        showToast(`✓ Kit "${formData.name}" created`);
      }
    } catch {
      showToast('Error creating kit');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (formData: Omit<Kit, 'id' | 'usageLogs'>) => {
    if (!editKit) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/inventory/kits/${editKit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.data) {
        setKits(prev => prev.map(k => k.id === editKit.id ? { ...data.data, usageLogs: k.usageLogs } : k));
        setEditKit(null);
        showToast(`✓ Kit "${formData.name}" updated`);
      }
    } catch {
      showToast('Error updating kit');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (kit: Kit) => {
    if (!confirm(`Delete kit "${kit.name}"?`)) return;
    try {
      await fetch(`/api/inventory/kits/${kit.id}`, { method: 'DELETE' });
      setKits(prev => prev.filter(k => k.id !== kit.id));
      showToast(`✓ Kit "${kit.name}" deleted`);
    } catch {
      showToast('Error deleting kit');
    }
  };

  const handleUseKit = async (count: number, note: string) => {
    if (!useKit) return;
    // Deduct from local stock state
    const deductions = useKit.items.map(item => ({
      itemId: item.itemId,
      qty: item.qtyPerUse * count,
    }));
    onStockDeduct(deductions);

    // Record usage in DB
    await fetch('/api/inventory/kits/use', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kitId: useKit.id, propertyId, usedCount: count, note }),
    });

    // Update local usageLogs optimistically
    setKits(prev => prev.map(k => k.id === useKit.id ? {
      ...k,
      usageLogs: [{ usedAt: new Date().toISOString(), usedCount: count }, ...(k.usageLogs ?? [])],
    } : k));

    setUseKit(null);
    showToast(`✓ Used "${useKit.name}" ×${count} — stock deducted`);
  };

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-[70] animate-in slide-in-from-top-3 duration-300
                        bg-emerald-600 text-white text-xs font-black px-5 py-3 rounded-2xl shadow-xl border border-emerald-500/40">
          {toast}
        </div>
      )}

      {/* Header + Create button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-white">Kit / Recipe Mapping</h2>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Define what items get used per room/service. Click "Use" to auto-deduct stock.
          </p>
        </div>
        {!showForm && !editKit && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-orange-600 hover:bg-orange-500
                       text-white text-xs font-black uppercase tracking-wider transition-colors shadow-lg shadow-orange-600/20"
          >
            <Plus size={13} /> New Kit
          </button>
        )}
      </div>

      {/* Create Form */}
      {showForm && (
        <KitForm
          allStock={allStock}
          saving={saving}
          onSave={handleCreate}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Edit Form */}
      {editKit && (
        <KitForm
          allStock={allStock}
          initial={editKit}
          saving={saving}
          onSave={handleUpdate}
          onCancel={() => setEditKit(null)}
        />
      )}

      {/* Kit list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={22} className="animate-spin text-orange-400" />
        </div>
      ) : kits.length === 0 && !showForm ? (
        <div className="text-center py-14 rounded-2xl border border-dashed border-white/10">
          <Layers size={28} className="text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 text-sm font-black">No kits yet</p>
          <p className="text-slate-600 text-xs mt-1">Create your first kit recipe above</p>
        </div>
      ) : (
        <div className="space-y-3">
          {kits.map(kit => (
            <KitCard
              key={kit.id}
              kit={kit}
              allStock={allStock}
              onEdit={() => { setEditKit(kit); setShowForm(false); }}
              onDelete={() => handleDelete(kit)}
              onUse={() => setUseKit(kit)}
            />
          ))}
        </div>
      )}

      {/* Use Kit Modal */}
      {useKit && (
        <UseKitModal
          kit={useKit}
          allStock={allStock}
          onConfirm={handleUseKit}
          onClose={() => setUseKit(null)}
        />
      )}
    </div>
  );
}
