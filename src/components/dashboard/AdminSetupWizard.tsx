'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutGrid, Tag, UtensilsCrossed, Check, Plus, Trash2, Edit2,
  X, Save, Loader2, Users, ChevronRight, ChevronLeft,
  Sparkles, RefreshCcw, AlertCircle, ArrowRight, Building2,
  CheckCircle2, Circle, MapPin, Hash, Globe
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Table { id: string; name: string; capacity: number; floorId: string; }
interface Floor { id: string; name: string; order: number; tables: Table[]; }
interface Category { id: string; name: string; description?: string; _count?: { products: number }; }
interface Product {
  id: string;
  name: string;
  sellingPrice: number;
  costPrice: number;
  categoryId: string;
  productType: string;
  isActive: boolean;
  sku?: string;
  barcode?: string;
  hsnCode?: string;
  taxRate?: number;
  image?: string;
  trackInventory: boolean;
  category: { id: string; name: string };
}
interface Outlet { id: string; name: string; }
interface Property { id: string; name: string; type: string; }

// ─── Toast helper ─────────────────────────────────────────────────────────────
function showToast(msg: string, type: 'success' | 'error' = 'success') {
  const el = document.createElement('div');
  el.className = `fixed bottom-6 right-6 z-[9999] px-5 py-3.5 rounded-2xl text-sm font-bold shadow-2xl flex items-center gap-2 transition-all duration-300 ${
    type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
  }`;
  el.innerHTML = `${type === 'success' ? '✓' : '✗'} ${msg}`;
  document.body.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 400); }, 2800);
}

// ─── Step Indicator ───────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Spaces & Tables', icon: LayoutGrid, desc: 'Define your dining areas and seating' },
  { id: 2, label: 'Categories', icon: Tag, desc: 'Organise your menu sections' },
  { id: 3, label: 'Menu Items', icon: UtensilsCrossed, desc: 'Add dishes with prices' },
];

function StepIndicator({ current, data }: {
  current: number;
  data: { floors: Floor[]; categories: Category[]; products: Product[] };
}) {
  const counts = [
    data.floors.reduce((s, f) => s + f.tables.length, 0),
    data.categories.length,
    data.products.length,
  ];

  return (
    <div className="flex items-center justify-between w-full max-w-3xl mx-auto px-2 lg:px-4 relative">
      {/* Connecting Line */}
      <div className="absolute top-6 lg:top-1/2 left-0 w-full h-[2px] bg-slate-200 dark:bg-slate-800 -translate-y-1/2 z-0 transition-colors" />
      <div 
        className="absolute top-6 lg:top-1/2 left-0 h-[2px] bg-pos-primary -translate-y-1/2 z-0 transition-all duration-700 ease-out" 
        style={{ width: `${((current - 1) / (STEPS.length - 1)) * 100}%` }}
      />
      
      {STEPS.map((step, idx) => {
        const isActive = step.id === current;
        const isDone = step.id < current;
        const Icon = step.icon;
        
        return (
          <div key={step.id} className="relative z-10 flex flex-col items-center">
            <div className={`
              w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl flex items-center justify-center transition-all duration-500
              ${isActive 
                ? 'bg-pos-primary shadow-lg scale-110 border-2 border-pos-primary/50' 
                : isDone 
                  ? 'bg-emerald-500 shadow-md' 
                  : 'bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500'}
            `}>
              {isDone ? (
                <Check size={18} className="text-white" />
              ) : (
                <Icon size={18} className={isActive ? 'text-white' : 'text-slate-500'} />
              )}
            </div>
            
            <div className="mt-2 flex flex-col items-center">
              <span className={`text-[8px] lg:text-[10px] font-black uppercase tracking-widest transition-colors duration-300 text-center ${
                isActive ? 'text-pos-primary font-black' : isDone ? 'text-emerald-500' : 'text-slate-500'
              }`}>
                {step.label}
              </span>
              {counts[idx] > 0 && (
                <span className={`hidden md:inline-block text-[9px] font-bold mt-0.5 px-2 py-0.5 rounded-full ${
                  isActive ? 'bg-pos-primary/10 text-pos-primary' : isDone ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                }`}>
                  {counts[idx]} {idx === 0 ? 'tables' : idx === 1 ? 'cats' : 'items'}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Step 1: Spaces & Tables ──────────────────────────────────────────────────
function SpacesStep({
  floors, propertyId, reload
}: {
  floors: Floor[]; outlets: Outlet[]; propertyId: string | null; reload: () => void;
}) {
  const [newFloorName, setNewFloorName] = useState('');
  const [savingFloor, setSavingFloor] = useState(false);
  const [editFloor, setEditFloor] = useState<{ id: string; name: string } | null>(null);
  const [addingTable, setAddingTable] = useState<{ floorId: string; name: string; cap: number } | null>(null);
  const [savingTable, setSavingTable] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const addFloor = async () => {
    if (!newFloorName.trim() || !propertyId) return;
    setSavingFloor(true);
    const r = await fetch('/api/floors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newFloorName.trim(), order: floors.length + 1, propertyId }),
    });
    setSavingFloor(false);
    if (r.ok) { showToast('Space added!'); setNewFloorName(''); reload(); }
    else { const d = await r.json(); showToast(d.message || 'Failed', 'error'); }
  };

  const updateFloor = async () => {
    if (!editFloor || !editFloor.name.trim()) return;
    const r = await fetch(`/api/floors/${editFloor.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editFloor.name }),
    });
    if (r.ok) { showToast('Updated!'); setEditFloor(null); reload(); }
    else { const d = await r.json(); showToast(d.message || 'Failed', 'error'); }
  };

  const deleteFloor = async (id: string, tableCount: number) => {
    if (tableCount > 0) { showToast(`Remove all ${tableCount} tables first`, 'error'); return; }
    if (!confirm('Delete this space?')) return;
    setDeletingId(id);
    const r = await fetch(`/api/floors/${id}`, { method: 'DELETE' });
    setDeletingId(null);
    if (r.ok) { showToast('Space deleted!'); reload(); }
    else { const d = await r.json(); showToast(d.message || 'Failed', 'error'); }
  };

  const addTable = async () => {
    if (!addingTable || !addingTable.name.trim()) return;
    setSavingTable(true);
    const r = await fetch('/api/tables', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: addingTable.name.trim(), floorId: addingTable.floorId, capacity: addingTable.cap }),
    });
    setSavingTable(false);
    if (r.ok) { showToast('Table added! Live in POS ✓'); setAddingTable(null); reload(); }
    else { const d = await r.json(); showToast(d.message || 'Failed', 'error'); }
  };

  const deleteTable = async (id: string) => {
    if (!confirm('Delete table?')) return;
    setDeletingId(id);
    const r = await fetch(`/api/tables/${id}`, { method: 'DELETE' });
    setDeletingId(null);
    if (r.ok) { showToast('Table removed from POS'); reload(); }
    else { const d = await r.json(); showToast(d.message || 'Failed', 'error'); }
  };

  if (!propertyId) {
    return (
      <div className="flex items-center gap-4 p-6 bg-amber-500/10 border border-amber-500/20 rounded-3xl animate-in fade-in slide-in-from-top-4 duration-500">
        <AlertCircle size={24} className="text-amber-500 flex-shrink-0" />
        <p className="text-sm font-bold text-amber-200">Property not linked. Please create or select a property above.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Information Bar */}
      <div className="flex items-center gap-4 p-5 bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/10 dark:border-indigo-500/20 rounded-2xl glass-morphism transition-colors">
        <div className="w-10 h-10 bg-pos-primary/20 rounded-xl flex items-center justify-center shrink-0 transition-colors">
          <Sparkles size={18} className="text-pos-primary" />
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-pos-primary leading-none mb-1 transition-colors">Spatial Mapping</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium transition-colors">Add your dining floors and map your tables. Everything syncs with the POS floor plan.</p>
        </div>
      </div>

      {/* Add Space Input */}
      <div className="flex flex-col sm:flex-row items-stretch gap-3">
        <div className="flex-1 relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-pos-primary transition-colors">
            <LayoutGrid size={18} />
          </div>
          <input
            className="w-full pl-12 pr-4 py-3 lg:py-4 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold outline-none focus:border-pos-primary focus:ring-4 focus:ring-pos-primary/5 transition-all shadow-sm placeholder:text-slate-400 dark:placeholder:text-slate-600 text-slate-900 dark:text-white"
            placeholder="New Space Name — e.g. Rooftop"
            value={newFloorName}
            onChange={e => setNewFloorName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addFloor()}
          />
        </div>
        <button
          onClick={addFloor}
          disabled={savingFloor || !newFloorName.trim()}
          className="px-8 py-3 lg:py-4 bg-pos-primary hover:bg-pos-primary-dark disabled:bg-slate-100 disabled:text-slate-400 text-white text-sm font-black rounded-2xl transition-all shadow-lg shadow-pos-primary/20 active:scale-95 flex items-center justify-center gap-2"
        >
          {savingFloor ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
          Add Space
        </button>
      </div>

      {/* Floors List */}
      {floors.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem] bg-slate-50/50 dark:bg-slate-900/20 transition-colors">
          <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 flex items-center justify-center mx-auto mb-4 shadow-sm transition-colors">
            <LayoutGrid size={32} className="text-slate-200 dark:text-slate-700" />
          </div>
          <p className="font-black text-slate-300 dark:text-slate-600 text-sm uppercase tracking-widest transition-colors">No spaces added yet</p>
          <p className="text-slate-400 dark:text-slate-500 text-xs mt-1 transition-colors">Start by adding your first dining area above</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {floors.map((floor) => (
            <div key={floor.id} className="bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-md transition-all group/floor">
              {/* Floor Header */}
              <div className="flex items-center justify-between px-6 py-5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 transition-colors">
                {editFloor?.id === floor.id ? (
                  <div className="flex-1 flex items-center gap-3 mr-4">
                    <input
                      autoFocus
                      className="flex-1 border-2 border-pos-primary rounded-xl px-4 py-2 text-sm font-bold outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white transition-colors"
                      value={editFloor.name}
                      onChange={e => setEditFloor({ ...editFloor, name: e.target.value })}
                      onKeyDown={e => { if (e.key === 'Enter') updateFloor(); if (e.key === 'Escape') setEditFloor(null); }}
                    />
                    <button onClick={updateFloor} className="p-2.5 bg-pos-primary text-white rounded-xl shadow-lg shadow-pos-primary/10"><Save size={16} /></button>
                    <button onClick={() => setEditFloor(null)} className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400"><X size={16} /></button>
                  </div>
                ) : (
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2 transition-colors">
                      {floor.name}
                      <span className="text-[10px] bg-pos-primary/10 text-pos-primary px-2 py-0.5 rounded-full uppercase tracking-widest">Active</span>
                    </h3>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-0.5 transition-colors">{floor.tables.length} mapped tables</p>
                  </div>
                )}
                
                <div className="flex items-center gap-2 opacity-0 group-hover/floor:opacity-100 transition-opacity">
                  <button onClick={() => setEditFloor({ id: floor.id, name: floor.name })} className="p-2 text-slate-400 hover:text-pos-primary hover:bg-pos-primary/5 rounded-xl transition-all" title="Rename Space">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => deleteFloor(floor.id, floor.tables.length)} disabled={deletingId === floor.id} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" title="Delete Space">
                    {deletingId === floor.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  </button>
                </div>
              </div>

              {/* Tables Grid */}
              <div className="p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {floor.tables.map((table, idx) => (
                    <div 
                      key={table.id} 
                      className="group relative bg-white dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50 rounded-2xl p-4 hover:border-pos-primary/30 hover:shadow-lg hover:shadow-pos-primary/5 transition-all text-center hover-lift animate-in fade-in zoom-in-95 duration-500 fill-mode-both"
                      style={{ animationDelay: `${idx * 40}ms` }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-8 h-8 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-700 transition-colors">
                          <Hash size={14} className="text-slate-400 dark:text-slate-500" />
                        </div>
                        <button
                          onClick={() => deleteTable(table.id)}
                          disabled={deletingId === table.id}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-500 transition-all"
                        >
                          {deletingId === table.id ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                        </button>
                      </div>
                      <span className="block font-black text-slate-900 dark:text-white text-sm mb-1 transition-colors">{table.name}</span>
                      <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase overflow-hidden transition-colors">
                        <Users size={12} className="text-pos-primary" /> {table.capacity} Seats
                      </div>
                    </div>
                  ))}

                  {/* Add Table Component */}
                  {addingTable?.floorId === floor.id ? (
                    <div className="border-2 border-pos-primary bg-pos-primary/5 dark:bg-pos-primary/10 rounded-2xl p-4 col-span-2 animate-in zoom-in-95 duration-200">
                      <div className="flex flex-col gap-3">
                        <input
                          autoFocus
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:border-pos-primary text-slate-900 dark:text-white transition-colors"
                          placeholder="Table # (e.g. T-10)"
                          value={addingTable.name}
                          onChange={e => setAddingTable({ ...addingTable, name: e.target.value })}
                          onKeyDown={e => { if (e.key === 'Enter') addTable(); if (e.key === 'Escape') setAddingTable(null); }}
                        />
                        <div className="flex items-center gap-3">
                          <div className="flex-1 flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 transition-colors">
                            <Users size={14} className="text-slate-400 dark:text-slate-500" />
                            <input
                              type="number" min={1} max={50}
                              className="flex-1 bg-transparent text-sm font-bold outline-none text-slate-900 dark:text-white"
                              value={addingTable.cap}
                              onChange={e => setAddingTable({ ...addingTable, cap: Number(e.target.value) })}
                            />
                          </div>
                          <div className="flex gap-2">
                            <button onClick={addTable} disabled={savingTable} className="p-2.5 bg-pos-primary text-white rounded-xl shadow-lg shadow-pos-primary/10">
                              {savingTable ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            </button>
                            <button onClick={() => setAddingTable(null)} className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400"><X size={16} /></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddingTable({ floorId: floor.id, name: '', cap: 4 })}
                      className="border-2 border-dashed border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 text-slate-300 hover:border-pos-primary hover:text-pos-primary hover:bg-pos-primary/5 transition-all min-h-[100px] group"
                    >
                      <Plus size={24} className="group-hover:scale-125 transition-transform" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Add Table</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Step 2: Categories ───────────────────────────────────────────────────────
function CategoriesStep({ categories, reload }: { categories: Category[]; reload: () => void }) {
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const add = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    const r = await fetch('/api/categories', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim() }),
    });
    setSaving(false);
    if (r.ok) { showToast('Category added — live in POS ✓'); setNewName(''); reload(); }
    else { const d = await r.json(); showToast(d.message || 'Failed', 'error'); }
  };

  const update = async (id: string) => {
    const r = await fetch(`/api/categories/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName }),
    });
    if (r.ok) { showToast('Updated!'); setEditId(null); reload(); }
    else { const d = await r.json(); showToast(d.message || 'Failed', 'error'); }
  };

  const remove = async (id: string, count: number) => {
    if (count > 0) { showToast(`Move ${count} items from this category first`, 'error'); return; }
    if (!confirm('Delete category?')) return;
    setDeletingId(id);
    const r = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
    setDeletingId(null);
    if (r.ok) { showToast('Category removed!'); reload(); }
    else { const d = await r.json(); showToast(d.message || 'Failed', 'error'); }
  };

  const COLORS = [
    'from-pos-primary to-pos-primary-dark', 
    'from-emerald-400 to-emerald-600', 
    'from-amber-400 to-amber-600', 
    'from-rose-400 to-rose-600', 
    'from-violet-400 to-violet-600', 
    'from-cyan-400 to-cyan-600', 
    'from-pink-400 to-pink-600', 
    'from-orange-400 to-orange-600'
  ];

  const SUGGESTIONS = ['Starters', 'Main Course', 'Breads', 'Rice & Biryani', 'Salads', 'Desserts', 'Beverages', 'Specials'];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Information Bar */}
      <div className="flex items-center gap-4 p-5 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/10 dark:border-amber-500/20 rounded-2xl glass-morphism transition-colors">
        <div className="w-10 h-10 bg-pos-primary/20 rounded-xl flex items-center justify-center shrink-0 transition-colors">
          <Tag size={18} className="text-pos-primary" />
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-pos-primary leading-none mb-1 transition-colors">Menu Organization</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium transition-colors">Group your items into logical sections. These appear as navigation tabs on your POS terminal.</p>
        </div>
      </div>

      {/* Quick Suggestions */}
      {categories.length === 0 && (
        <div className="space-y-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Quick Add Suggestions</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map(s => (
              <button 
                key={s} 
                onClick={() => setNewName(s)} 
                className="px-4 py-2 bg-white dark:bg-slate-900 hover:bg-pos-primary hover:text-white text-slate-600 dark:text-slate-400 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 hover:border-pos-primary transition-all premium-shadow"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Add Category Input */}
      <div className="flex flex-col sm:flex-row items-stretch gap-3">
        <div className="flex-1 relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-pos-primary transition-colors">
            <Tag size={18} />
          </div>
          <input
            className="w-full pl-12 pr-4 py-3 lg:py-4 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold outline-none focus:border-pos-primary focus:ring-4 focus:ring-pos-primary/5 transition-all shadow-sm placeholder:text-slate-400 dark:placeholder:text-slate-600 text-slate-900 dark:text-white"
            placeholder="New Category — e.g. Pizza"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && add()}
          />
        </div>
        <button
          onClick={add}
          disabled={saving || !newName.trim()}
          className="px-8 py-3 lg:py-4 bg-pos-primary hover:bg-pos-primary-dark disabled:bg-slate-100 disabled:text-slate-400 text-white text-sm font-black rounded-2xl transition-all shadow-lg shadow-pos-primary/10 active:scale-95 flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
          Add Category
        </button>
      </div>

      {/* Categories Grid */}
      {categories.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem] bg-slate-50/50 dark:bg-slate-900/20 transition-colors">
          <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 flex items-center justify-center mx-auto mb-4 shadow-sm transition-colors">
            <Tag size={32} className="text-slate-200 dark:text-slate-700" />
          </div>
          <p className="font-black text-slate-300 dark:text-slate-600 text-sm uppercase tracking-widest transition-colors">No categories yet</p>
          <p className="text-slate-400 dark:text-slate-500 text-xs mt-1 transition-colors">Start by adding your first menu section above</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat, i) => (
            <div 
              key={cat.id} 
              className="group relative bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 hover:border-pos-primary/30 hover:shadow-xl hover:shadow-pos-primary/5 transition-all hover-lift animate-in fade-in zoom-in-95 duration-500 fill-mode-both"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${COLORS[i % COLORS.length]} flex items-center justify-center text-white font-black text-xl shadow-lg shrink-0`}>
                  {cat.name[0]}
                </div>
                
                {editId === cat.id ? (
                  <div className="flex-1 flex flex-col gap-2">
                    <input 
                      autoFocus 
                      className="w-full border-2 border-pos-primary rounded-xl px-3 py-1.5 text-sm font-bold outline-none" 
                      value={editName} 
                      onChange={e => setEditName(e.target.value)} 
                      onKeyDown={e => { if (e.key === 'Enter') update(cat.id); if (e.key === 'Escape') setEditId(null); }} 
                    />
                    <div className="flex gap-2">
                      <button onClick={() => update(cat.id)} className="flex-1 py-1.5 bg-pos-primary text-white rounded-lg text-xs font-bold">Save</button>
                      <button onClick={() => setEditId(null)} className="flex-1 py-1.5 bg-slate-100 text-slate-500 rounded-lg text-xs font-bold">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-slate-900 dark:text-white text-[15px] truncate leading-tight group-hover:text-pos-primary transition-colors">{cat.name}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-1 flex items-center gap-1.5 transition-colors">
                      <LayoutGrid size={10} className="text-amber-400" /> {cat._count?.products ?? 0} Items linked
                    </p>
                  </div>
                )}
                
                {editId !== cat.id && (
                  <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditId(cat.id); setEditName(cat.name); }} className="p-2 text-slate-300 hover:text-pos-primary hover:bg-pos-primary/5 rounded-xl transition-all"><Edit2 size={16} /></button>
                    <button onClick={() => remove(cat.id, cat._count?.products ?? 0)} disabled={deletingId === cat.id} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                      {deletingId === cat.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={16} />}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Step 3: Menu Items ───────────────────────────────────────────────────────
function MenuStep({ products, categories, reload }: { products: Product[]; categories: Category[]; reload: () => void }) {
  const [filterCat, setFilterCat] = useState('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const emptyForm = {
    name: '',
    sellingPrice: '',
    costPrice: '',
    categoryId: categories[0]?.id || '',
    productType: 'REVENUE',
    sku: '',
    barcode: '',
    hsnCode: '',
    taxRate: '',
    image: '',
    trackInventory: false,
    isActive: true,
  };
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);

  const resetForm = useCallback(() => {
    setForm({
      ...emptyForm,
      categoryId: categories[0]?.id || '',
    });
  }, [categories]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.url) setForm(f => ({ ...f, image: data.url }));
    } catch {
      showToast('Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!form.name.trim() || !form.sellingPrice || !form.categoryId) {
      showToast('Name, Price and Category are required', 'error'); return;
    }
    setSaving(true);
    const body = {
      name: form.name.trim(),
      sellingPrice: Number(form.sellingPrice),
      costPrice: Number(form.costPrice || 0),
      categoryId: form.categoryId,
      productType: form.productType,
      sku: form.sku,
      barcode: form.barcode,
      hsnCode: form.hsnCode,
      taxRate: form.taxRate ? Number(form.taxRate) : null,
      image: form.image,
      trackInventory: form.trackInventory,
      isActive: form.isActive,
    };

    if (editingId) {
      const r = await fetch(`/api/products/${editingId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      setSaving(false);
      if (r.ok) { showToast('Item updated!'); setEditingId(null); setShowForm(false); reload(); }
      else { const d = await r.json(); showToast(d.message || 'Failed', 'error'); }
    } else {
      const r = await fetch('/api/products', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, isActive: true }),
      });
      setSaving(false);
      if (r.ok) { showToast('Item added to menu!'); setShowForm(false); resetForm(); reload(); }
      else { const d = await r.json(); showToast(d.message || 'Failed', 'error'); }
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this item? (Cannot delete if it has order history)')) return;
    setDeletingId(id);
    const r = await fetch(`/api/products/${id}`, { method: 'DELETE' });
    setDeletingId(null);
    if (r.ok) { showToast('Item removed from POS'); reload(); }
    else { const d = await r.json(); showToast(d.message || 'Failed', 'error'); }
  };

  const toggle = async (id: string, val: boolean) => {
    const r = await fetch(`/api/products/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !val }),
    });
    if (r.ok) { showToast(`Item ${!val ? 'enabled' : 'hidden'} in POS`); reload(); }
  };

  const TYPE_OPTIONS = [
    { v: 'REVENUE', emoji: '🍽️', label: 'Revenue Item', color: 'border-pos-primary/40 bg-pos-primary/5 text-pos-primary' },
    { v: 'COMPLIMENTARY', emoji: '🎁', label: 'Complimentary', color: 'border-emerald-400 bg-emerald-50 text-emerald-700' },
    { v: 'VOID', emoji: '🚫', label: 'Void Item', color: 'border-red-400 bg-red-50 text-red-700' },
  ];
  const TYPE_MAP: Record<string, { emoji: string; color: string }> = {
    REVENUE: { emoji: '🍽️', color: 'bg-pos-primary/10 text-pos-primary' },
    COMPLIMENTARY: { emoji: '🎁', color: 'bg-emerald-100 text-emerald-700' },
    VOID: { emoji: '🚫', color: 'bg-red-100 text-red-700' },
  };

  const filtered = filterCat === 'all' ? products : products.filter(p => p.categoryId === filterCat);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Information Bar */}
      <div className="flex items-center gap-4 p-5 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/10 dark:border-emerald-500/20 rounded-2xl glass-morphism transition-colors">
        <div className="w-10 h-10 bg-emerald-600/20 rounded-xl flex items-center justify-center shrink-0 transition-colors">
          <UtensilsCrossed size={18} className="text-emerald-400" />
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-emerald-300 leading-none mb-1 transition-colors">Menu Inventory</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium transition-colors">Add dishes with detailed pricing and images. Every addition goes live in your POS system instantly.</p>
        </div>
      </div>

      {categories.length === 0 && (
        <div className="flex items-center gap-4 p-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
          <AlertCircle size={20} className="text-amber-500" />
          <p className="text-sm font-bold text-amber-200">Wait! You need to add Categories in Step 2 before adding items.</p>
        </div>
      )}

      {/* Filter + Add Toolbar */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between bg-white/5 dark:bg-slate-900/40 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 glass-morphism transition-colors">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 w-full lg:w-auto scrollbar-hide">
          <button 
            onClick={() => setFilterCat('all')} 
            className={`px-5 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl border transition-all shrink-0 ${
              filterCat === 'all' 
                ? 'bg-pos-primary text-white border-pos-primary shadow-lg shadow-pos-primary/20' 
                : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            All Items ({products.length})
          </button>
          {categories.map(c => (
            <button 
              key={c.id} 
              onClick={() => setFilterCat(c.id)} 
              className={`px-5 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl border transition-all shrink-0 ${
                filterCat === c.id 
                  ? 'bg-pos-primary text-white border-pos-primary shadow-lg shadow-pos-primary/20' 
                  : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); resetForm(); }}
          disabled={categories.length === 0}
          className="w-full lg:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-100 disabled:text-slate-400 text-white text-sm font-black rounded-xl transition-all shadow-lg shadow-emerald-200 active:scale-95"
        >
          <Plus size={18} /> Add New Item
        </button>
      </div>

      {/* Product Form Editor */}
      {showForm && (
        <div className="border border-indigo-100 dark:border-slate-800 rounded-[2.5rem] p-8 bg-white dark:bg-slate-900 shadow-2xl space-y-8 animate-in zoom-in-95 duration-300 relative overflow-hidden transition-colors">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-pos-primary via-white dark:via-slate-800 to-pos-primary" />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-pos-primary/10 rounded-2xl flex items-center justify-center transition-colors">
                <Sparkles size={24} className="text-pos-primary" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white leading-none transition-colors">
                  {editingId ? 'Edit Product' : 'Create New Menu Item'}
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-1 transition-colors">Product Details & Pricing</p>
              </div>
            </div>
            <button onClick={() => { setShowForm(false); setEditingId(null); }} className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all">
              <X size={24} />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Left: General Info */}
            <div className="lg:col-span-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1 transition-colors">Product Name *</label>
                <div className="relative group/input">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600 group-focus-within/input:text-pos-primary transition-colors">
                    <UtensilsCrossed size={18} />
                  </div>
                  <input
                    autoFocus
                    className="w-full pl-14 pr-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl text-sm font-bold outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-pos-primary focus:ring-4 focus:ring-pos-primary/5 transition-all text-slate-900 dark:text-white"
                    placeholder="e.g. Double Cheese Margherita, Cold Brew..."
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1 transition-colors">Category *</label>
                  <div className="relative">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600 pointer-events-none transition-colors">
                      <Tag size={18} />
                    </div>
                    <select
                      className="w-full pl-14 pr-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl text-sm font-bold outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-pos-primary transition-all appearance-none text-slate-900 dark:text-white"
                      value={form.categoryId}
                      onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
                    >
                      {categories.map(c => <option key={c.id} value={c.id} className="dark:bg-slate-900">{c.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1 transition-colors">Behavior Mode</label>
                  <div className="relative">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600 pointer-events-none transition-colors">
                      <LayoutGrid size={18} />
                    </div>
                    <select
                      className="w-full pl-14 pr-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl text-sm font-bold outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-pos-primary transition-all appearance-none text-slate-900 dark:text-white"
                      value={form.productType}
                      onChange={e => setForm(f => ({ ...f, productType: e.target.value }))}
                    >
                      {TYPE_OPTIONS.map(t => <option key={t.v} value={t.v} className="dark:bg-slate-900">{t.emoji} {t.label}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-4 border-t border-slate-100">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Selling Price (₹) *</label>
                  <div className="relative group/price">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 font-black">₹</div>
                    <input
                      type="number"
                      className="w-full pl-10 pr-4 py-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-base font-black outline-none focus:bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/5 transition-all"
                      placeholder="0.00"
                      value={form.sellingPrice}
                      onChange={e => setForm(f => ({ ...f, sellingPrice: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2 text-slate-400">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] ml-1">Cost Price (₹)</label>
                  <input
                    type="number"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-base font-black outline-none focus:bg-white focus:border-slate-300 transition-all text-slate-600"
                    placeholder="0.00"
                    value={form.costPrice}
                    onChange={e => setForm(f => ({ ...f, costPrice: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-pos-primary/70 uppercase tracking-[0.2em] ml-1 text-glow">Tax Rate (%)</label>
                  <input
                    type="number"
                    className="w-full px-5 py-4 bg-pos-primary/5 border border-pos-primary/20 rounded-2xl text-base font-black outline-none focus:bg-white focus:border-pos-primary transition-all text-pos-primary shadow-inner shadow-pos-primary/5"
                    placeholder="e.g. 5"
                    value={form.taxRate}
                    onChange={e => setForm(f => ({ ...f, taxRate: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Right: Media & Visibility */}
            <div className="lg:col-span-4 space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Product Media</label>
                <div className="flex flex-col items-center gap-5 p-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] hover:border-indigo-400 transition-all group/upload relative overflow-hidden">
                  <div className="relative w-40 h-40 bg-white rounded-[2rem] border border-slate-100 flex items-center justify-center overflow-hidden premium-shadow group-hover/upload:scale-105 transition-all duration-500">
                    {form.image ? (
                      <img src={form.image} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <UtensilsCrossed size={48} className="text-slate-100" />
                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">No Image</span>
                      </div>
                    )}
                    {uploading && (
                      <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center gap-3">
                        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-[9px] font-black text-indigo-600 uppercase">Uploading...</span>
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <label className="cursor-pointer px-6 py-3 bg-white text-slate-950 text-[10px] font-black uppercase tracking-[0.1em] rounded-xl border border-slate-200 hover:border-indigo-600 hover:text-indigo-600 transition-all premium-shadow inline-block">
                      {form.image ? 'Change High-Res' : 'Upload Texture/Photo'}
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                    </label>
                    {form.image && (
                      <button onClick={() => setForm(f=>({...f, image: ''}))} className="block mt-4 mx-auto text-[9px] font-black text-red-500 uppercase tracking-widest hover:underline">Revoke Image</button>
                    )}
                  </div>
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between p-5 bg-slate-50 rounded-3xl border border-transparent hover:border-indigo-100 transition-all group/toggle">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                      <LayoutGrid size={18} />
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-wider leading-none">Stock Control</h4>
                      <p className="text-[9px] text-slate-400 mt-1 font-bold">Track items in real-time</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setForm({ ...form, trackInventory: !form.trackInventory })}
                    className={`w-12 h-6 rounded-full p-1.5 transition-all duration-300 ${form.trackInventory ? 'bg-indigo-600 shadow-[0_0_10px_rgba(99,102,241,0.3)]' : 'bg-slate-200'}`}
                  >
                    <div className={`w-3 h-3 bg-white rounded-full transition-all duration-300 ${form.trackInventory ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>
                
                <div className="flex items-center justify-between p-5 bg-slate-50 rounded-3xl border border-transparent hover:border-indigo-100 transition-all group/toggle">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                      <Check size={18} />
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-wider leading-none">POS Visibility</h4>
                      <p className="text-[9px] text-slate-400 mt-1 font-bold">Show/Hide in terminal</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setForm({ ...form, isActive: !form.isActive })}
                    className={`w-12 h-6 rounded-full p-1.5 transition-all duration-300 ${form.isActive ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-slate-200'}`}
                  >
                    <div className={`w-3 h-3 bg-white rounded-full transition-all duration-300 ${form.isActive ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-10 border-t border-slate-100">
            <button 
              onClick={save} 
              disabled={saving || uploading} 
              className="flex-1 flex items-center justify-center gap-3 py-5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm uppercase tracking-widest rounded-[2rem] transition-all shadow-2xl shadow-indigo-200 hover-lift active:scale-95"
            >
              {saving ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} />}
              {editingId ? 'Push Updates to POS' : 'Confirm & Deploy to POS'}
            </button>
            <button 
              onClick={() => { setShowForm(false); setEditingId(null); }} 
              className="px-10 py-5 bg-slate-100 text-slate-500 font-black text-xs uppercase tracking-widest rounded-[2rem] hover:bg-slate-200 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Items Grid View */}
      {filtered.length === 0 && !showForm ? (
        <div className="text-center py-24 border-2 border-dashed border-slate-200 rounded-[3rem] bg-slate-50/50">
          <div className="w-24 h-24 bg-white rounded-[2rem] border border-slate-100 flex items-center justify-center mx-auto mb-6 shadow-sm">
            <UtensilsCrossed size={48} className="text-slate-100" />
          </div>
          <p className="font-black text-slate-300 text-base uppercase tracking-widest">Your menu is empty</p>
          <p className="text-slate-400 text-sm mt-1">Start building your menu by adding your first dish above</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((p, idx) => {
            const tm = TYPE_MAP[p.productType] || { emoji: '🍽️', color: 'bg-slate-100 text-slate-500' };
            return (
              <div 
                key={p.id} 
                className={`group relative bg-white border rounded-[2rem] p-5 flex items-center gap-5 transition-all hover-lift animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both ${p.isActive ? 'border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-200' : 'border-slate-50 bg-slate-50/50 opacity-60'}`}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                {/* Product Media Avatar */}
                <div className="w-20 h-20 rounded-[1.5rem] bg-slate-100 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0 shadow-inner group-hover:scale-105 transition-transform duration-500">
                  {p.image ? (
                    <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl filter grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 transition-all">{tm.emoji}</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <p className="font-black text-slate-900 text-base truncate leading-none group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{p.name}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{p.category?.name}</span>
                        <div className="w-1 h-1 bg-slate-200 rounded-full" />
                        <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest ${tm.color} border border-current opacity-70`}>{p.productType?.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] leading-none mb-1">Selling Price</span>
                      <span className="font-black text-slate-900 text-lg">₹{p.sellingPrice.toLocaleString('en-IN')}</span>
                    </div>
                    
                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                      <button 
                        onClick={() => { setEditingId(p.id); setShowForm(true); setForm({ name: p.name, sellingPrice: String(p.sellingPrice), costPrice: String(p.costPrice || 0), categoryId: p.categoryId, productType: p.productType, sku: p.sku || '', barcode: p.barcode || '', hsnCode: p.hsnCode || '', taxRate: String(p.taxRate || ''), image: p.image || '', trackInventory: p.trackInventory, isActive: p.isActive }); }} 
                        className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                        title="Quick Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => toggle(p.id, p.isActive)} 
                        className={`p-2.5 rounded-xl border transition-all ${p.isActive ? 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-500 hover:text-white' : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-500 hover:text-white'}`} 
                        title={p.isActive ? 'Suspend Item' : 'Restore Item'}
                      >
                        {p.isActive ? <X size={16} /> : <Check size={16} />}
                      </button>
                      <button 
                        onClick={() => remove(p.id)} 
                        disabled={deletingId === p.id} 
                        className="p-2.5 bg-red-50 text-red-600 rounded-xl border border-red-100 hover:bg-red-500 hover:text-white transition-all"
                        title="Delete Product"
                      >
                        {deletingId === p.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


// ─── Create Property Panel ────────────────────────────────────────────────────
function CreatePropertyPanel({
  organizationId,
  onCreated,
}: {
  organizationId: string;
  onCreated: (propertyId: string) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    type: 'RESTAURANT',
    address: '',
    city: '',
    state: '',
    country: 'India',
    pinCode: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Restaurant name is required';
    if (!form.city.trim()) e.city = 'City is required';
    if (!form.state.trim()) e.state = 'State is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      // 1. Create property
      const code = `PROP-${Date.now()}`;
      const r = await fetch('/api/setup/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, organizationId, code }),
      });
      const j = await r.json();
      if (!r.ok) { showToast(j.message || 'Failed to create property', 'error'); setSaving(false); return; }

      const newPropertyId = j.data.id;

      // 2. Create default outlet for the property
      await fetch('/api/setup/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId: newPropertyId, name: 'Main Outlet', type: 'RESTAURANT' }),
      }).catch(() => null); // Non-blocking

      // 3. Select this property in session
      const r2 = await fetch('/api/setup/properties/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId: newPropertyId }),
      });
      if (!r2.ok) { showToast('Property created but session update failed. Refresh the page.', 'error'); setSaving(false); return; }

      showToast(`"${form.name}" created successfully!`);
      onCreated(newPropertyId);
    } catch {
      showToast('Network error', 'error');
    } finally {
      setSaving(false);
    }
  };

  const BUSINESS_TYPES = [
    { v: 'RESTAURANT', label: '🍽️ Restaurant' },
    { v: 'CAFE', label: '☕ Café' },
    { v: 'HOTEL', label: '🏨 Hotel' },
    { v: 'DHABA', label: '🫕 Dhaba' },
    { v: 'BAKERY', label: '🥐 Bakery' },
    { v: 'FOOD_COURT', label: '🏬 Food Court' },
  ];

  const inp = (field: keyof typeof form, icon: React.ReactNode, placeholder: string, required = false) => (
    <div>
      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">
        {placeholder} {required && <span className="text-red-400">*</span>}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>
        <input
          className={`w-full pl-9 pr-4 py-2.5 border-2 rounded-xl text-sm font-semibold outline-none transition-all ${
            errors[field] ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-indigo-400 bg-white'
          }`}
          placeholder={placeholder}
          value={form[field]}
          onChange={e => { setForm(f => ({ ...f, [field]: e.target.value })); setErrors(er => ({ ...er, [field]: '' })); }}
        />
      </div>
      {errors[field] && <p className="text-xs text-red-500 mt-1 font-semibold">{errors[field]}</p>}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Hero callout */}
      <div className="flex items-start gap-4 p-5 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0">
          <Building2 size={20} className="text-white" />
        </div>
        <div>
          <p className="font-black text-gray-800 text-sm">First, let's set up your restaurant</p>
          <p className="text-xs text-gray-500 mt-0.5">Fill in basic details. You can update everything later from Settings.</p>
        </div>
      </div>

      {/* Business Type */}
      <div>
        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Business Type</label>
        <div className="flex flex-wrap gap-2">
          {BUSINESS_TYPES.map(t => (
            <button
              key={t.v} type="button"
              onClick={() => setForm(f => ({ ...f, type: t.v }))}
              className={`px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                form.type === t.v
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                  : 'border-gray-200 text-gray-500 bg-white hover:border-indigo-300 hover:text-indigo-600'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Restaurant Name */}
      {inp('name', <Building2 size={14} />, 'Restaurant / Business Name', true)}

      {/* Location */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {inp('address', <MapPin size={14} />, 'Address (optional)')}
        {inp('city', <MapPin size={14} />, 'City', true)}
        {inp('state', <Globe size={14} />, 'State', true)}
        {inp('pinCode', <Hash size={14} />, 'PIN Code (optional)')}
      </div>

      {/* Submit */}
      <button
        onClick={submit}
        disabled={saving}
        className="w-full flex items-center justify-center gap-3 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-2xl transition-all shadow-lg disabled:opacity-60"
      >
        {saving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
        {saving ? 'Creating your restaurant...' : 'Create Restaurant & Start Setup'}
      </button>
    </div>
  );
}

// ─── Main Wizard ──────────────────────────────────────────────────────────────
interface AdminSetupWizardProps {
  onDismiss?: () => void;
}

export default function AdminSetupWizard({ onDismiss }: AdminSetupWizardProps) {
  const [step, setStep] = useState(1);
  const [showCreateProperty, setShowCreateProperty] = useState(false);
  const [data, setData] = useState<{
    floors: Floor[]; categories: Category[]; products: Product[];
    outlets: Outlet[]; properties: Property[]; selectedPropertyId: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [sessionOrganizationId, setSessionOrganizationId] = useState<string>('');

  const fetchData = useCallback(async (propId?: string | null) => {
    setLoading(true);
    setError(null);
    try {
      const pid = propId !== undefined ? propId : selectedPropertyId;
      const url = pid ? `/api/admin/setup-data?propertyId=${pid}` : '/api/admin/setup-data';
      const r = await fetch(url);
      const json = await r.json();
      if (json.success) {
        setData(json.data);
        // Auto-select first property if none selected and we got properties
        if (!pid && json.data.properties?.length > 0) {
          const firstId = json.data.properties[0].id;
          setSelectedPropertyId(firstId);
          // Re-fetch with proper property ID
          const r2 = await fetch(`/api/admin/setup-data?propertyId=${firstId}`);
          const j2 = await r2.json();
          if (j2.success) setData(j2.data);
        } else if (!pid && (!json.data.properties || json.data.properties.length === 0)) {
          // No properties at all — show creation panel
          setShowCreateProperty(true);
        }
      } else {
        setError(json.message || 'Failed to load');
      }
    } catch {
      setError('Network error. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, [selectedPropertyId]);

  // Also fetch session to get organizationId
  useEffect(() => {
    fetchData();
    fetch('/api/auth/session')
      .then(r => r.json())
      .then(j => { if (j.authenticated) setSessionOrganizationId(j.user.organizationId || ''); })
      .catch(() => null);
  }, []);

  const reload = () => fetchData(selectedPropertyId);

  const handlePropertyChange = (id: string) => {
    setSelectedPropertyId(id);
    setShowCreateProperty(false);
    fetchData(id);
  };

  const handlePropertyCreated = (newPropertyId: string) => {
    setSelectedPropertyId(newPropertyId);
    setShowCreateProperty(false);
    fetchData(newPropertyId);
  };

  const totalTables = data?.floors.reduce((s, f) => s + f.tables.length, 0) ?? 0;

  const stepComplete = [
    totalTables > 0,
    (data?.categories.length ?? 0) > 0,
    (data?.products.length ?? 0) > 0,
  ];

  const handleDone = async () => {
    try {
      const r = await fetch('/api/admin/complete-onboarding', { method: 'POST' });
      if (r.ok) {
        showToast('Setup completed! Welcome to your dashboard.');
        if (onDismiss) onDismiss();
      } else {
        showToast('Failed to mark setup as complete.', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    }
  };

  return (
    <div className="glass-morphism rounded-[2.5rem] premium-shadow overflow-hidden border-0">
      {/* ── Header ── */}
      <div className="relative bg-slate-950 px-8 py-10 overflow-hidden">
        {/* Animated Background Mesh */}
        <div className="absolute inset-0 z-0">
          <div className="absolute -left-1/4 -top-1/4 w-1/2 h-1/2 bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute -right-1/4 -bottom-1/4 w-1/2 h-1/2 bg-emerald-600/10 rounded-full blur-[120px] animate-pulse delay-1000" />
          <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-20 mix-blend-overlay" />
        </div>

        <div className="relative z-10 flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-[10px] font-black uppercase tracking-[0.2em] glass-morphism">
                <Sparkles size={10} className="animate-spin-slow" /> Setup Progress: {Math.round((stepComplete.filter(Boolean).length / STEPS.length) * 100)}%
              </span>
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight leading-none">
              Restaurant <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-indigo-200">Setup Wizard</span>
            </h2>
            <p className="text-slate-400 mt-2 text-sm max-w-md">
              Configure your system in minutes. Changes reflect <span className="text-indigo-400 font-bold underline decoration-indigo-400/30 underline-offset-4">instantly</span> in your POS terminal.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={reload} 
              className="p-3 bg-slate-900/50 text-slate-400 hover:text-white hover:bg-slate-800 rounded-2xl transition-all border border-slate-800 glass-morphism"
              title="Refresh data"
            >
              <RefreshCcw size={18} />
            </button>
            {onDismiss && (
              <button 
                onClick={onDismiss} 
                className="flex items-center gap-2 px-5 py-3 bg-white text-slate-950 text-xs font-black rounded-2xl hover:bg-indigo-50 transition-all premium-shadow group"
              >
                Dashboard <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
            )}
          </div>
        </div>

        {/* Improved Property Selector */}
        <div className="relative z-10 mb-12 flex items-center gap-4">
          {data?.properties && data.properties.length > 0 && (
            <div className="flex items-center gap-3 bg-slate-900/50 border border-slate-800 rounded-2xl px-4 py-2.5 glass-morphism">
              <Building2 size={16} className="text-indigo-400" />
              <select
                className="bg-transparent border-none text-white text-sm font-bold outline-none cursor-pointer pr-4"
                value={selectedPropertyId || ''}
                onChange={e => handlePropertyChange(e.target.value)}
              >
                {data.properties.map(p => <option key={p.id} value={p.id} className="text-slate-950 bg-white font-bold">{p.name}</option>)}
              </select>
            </div>
          )}
          
          <button
            onClick={() => setShowCreateProperty(v => !v)}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest border transition-all ${
              showCreateProperty
                ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                : 'bg-slate-900/50 text-slate-400 border-slate-800 hover:bg-slate-800'
            }`}
          >
            <Plus size={14} /> {showCreateProperty ? 'Close Panel' : 'New Property'}
          </button>
        </div>

        {/* Step Progress Container */}
        <div className="relative z-10 flex items-center justify-center pt-2 pb-6">
          {!loading && data && <StepIndicator current={step} data={data} />}
        </div>
      </div>

      {/* ── Overall Progress ── */}
      <div className="flex items-center gap-6 px-7 py-3 bg-gray-50 border-b border-gray-200">
        {STEPS.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setStep(s.id)}
            className={`flex items-center gap-2 text-xs font-bold transition-all ${step === s.id ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            {stepComplete[i]
              ? <CheckCircle2 size={14} className="text-emerald-500" />
              : <Circle size={14} className={step === s.id ? 'text-indigo-400' : 'text-gray-300'} />}
            {s.label}
          </button>
        ))}
        <div className="ml-auto text-[10px] font-black text-gray-300 uppercase tracking-widest">
          {stepComplete.filter(Boolean).length}/{STEPS.length} complete
        </div>
      </div>

      {/* ── Step Content ── */}
      <div className="p-7 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 440px)', minHeight: 300 }}>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-black uppercase tracking-widest text-gray-400">Loading your restaurant data...</p>
          </div>
        ) : error ? (
          <div className="flex items-center gap-3 p-5 bg-red-50 border border-red-200 rounded-2xl">
            <AlertCircle size={20} className="text-red-500" />
            <div className="flex-1">
              <p className="font-bold text-red-600 text-sm">{error}</p>
            </div>
            <button onClick={reload} className="text-xs font-black text-red-500 uppercase tracking-wide underline">Retry</button>
          </div>
        ) : showCreateProperty ? (
          /* ── Create Property Panel ── */
          <>
            <div className="mb-5">
              <h3 className="text-base font-black text-gray-800">Create New Property</h3>
              <p className="text-xs text-gray-400 mt-0.5">Add a new restaurant / outlet to your account</p>
            </div>
            <CreatePropertyPanel
              organizationId={sessionOrganizationId}
              onCreated={handlePropertyCreated}
            />
          </>
        ) : (
          <>
            <div className="mb-4">
              <h3 className="text-base font-black text-gray-800">{STEPS[step - 1].label}</h3>
              <p className="text-xs text-gray-400 mt-0.5">{STEPS[step - 1].desc}</p>
            </div>

            {step === 1 && <SpacesStep floors={data?.floors || []} outlets={data?.outlets || []} propertyId={selectedPropertyId || data?.selectedPropertyId || null} reload={reload} />}
            {step === 2 && <CategoriesStep categories={data?.categories || []} reload={reload} />}
            {step === 3 && <MenuStep products={data?.products || []} categories={data?.categories || []} reload={reload} />}
          </>
        )}
      </div>

      {/* ── Navigation Footer ── */}
      <div className="flex items-center justify-between px-7 py-4 border-t border-gray-100 bg-gray-50">
        <button
          onClick={() => setStep(s => Math.max(1, s - 1))}
          disabled={step === 1}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl hover:bg-gray-200 transition-all"
        >
          <ChevronLeft size={16} /> Previous
        </button>

        <div className="flex items-center gap-2">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i + 1)}
              className={`w-2 h-2 rounded-full transition-all ${step === i + 1 ? 'bg-indigo-600 w-6' : stepComplete[i] ? 'bg-emerald-400' : 'bg-gray-300'}`}
            />
          ))}
        </div>

        {step < 3 ? (
          <button
            onClick={() => setStep(s => Math.min(3, s + 1))}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all shadow-md"
          >
            Next Step <ChevronRight size={16} />
          </button>
        ) : (
          <button
            onClick={handleDone}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-all shadow-md"
          >
            <Check size={16} /> Done! Go to Dashboard
          </button>
        )}
      </div>
    </div>
  );
}
