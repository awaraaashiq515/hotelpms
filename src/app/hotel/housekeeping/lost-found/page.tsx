'use client';
import React, { useState } from 'react';
import { ClipboardList, Plus, Search, X, CheckCircle2 } from 'lucide-react';

interface LostItem {
  id: string;
  itemName: string;
  foundLocation: string;
  foundDate: string;
  foundBy: string;
  status: 'FOUND' | 'CLAIMED' | 'DISPOSED';
  description?: string;
}

const MOCK_ITEMS: LostItem[] = [
  { id: '1', itemName: 'iPhone 14 Pro', foundLocation: 'Room 201', foundDate: new Date().toISOString(), foundBy: 'Priya (HK)', status: 'FOUND', description: 'Found in bathroom' },
  { id: '2', itemName: 'Black Wallet', foundLocation: 'Lobby', foundDate: new Date(Date.now() - 86400000).toISOString(), foundBy: 'Ramesh (FD)', status: 'CLAIMED' },
  { id: '3', itemName: 'Charger Cable', foundLocation: 'Room 305', foundDate: new Date(Date.now() - 172800000).toISOString(), foundBy: 'Sunita (HK)', status: 'FOUND' },
];

const STATUS_CFG = {
  FOUND:    { label: 'Found',    color: 'text-sky-400',     bg: 'bg-sky-500/15 border-sky-500/30' },
  CLAIMED:  { label: 'Claimed',  color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/30' },
  DISPOSED: { label: 'Disposed', color: 'text-slate-400',   bg: 'bg-slate-700/40 border-slate-600/30' },
};

export default function LostAndFoundPage() {
  const [items, setItems] = useState<LostItem[]>(MOCK_ITEMS);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ itemName: '', foundLocation: '', foundBy: '', description: '' });

  const filtered = items.filter(i =>
    !search || i.itemName.toLowerCase().includes(search.toLowerCase()) || i.foundLocation.toLowerCase().includes(search.toLowerCase())
  );

  const addItem = () => {
    if (!form.itemName || !form.foundLocation) return;
    setItems(p => [{ id: Date.now().toString(), ...form, foundDate: new Date().toISOString(), status: 'FOUND' }, ...p]);
    setForm({ itemName: '', foundLocation: '', foundBy: '', description: '' });
    setShowForm(false);
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2"><ClipboardList className="text-amber-400" size={24} /> Lost & Found</h1>
          <p className="text-xs text-slate-500 font-bold mt-1">{items.filter(i => i.status === 'FOUND').length} unclaimed items</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-xs font-bold text-white transition-all shadow-lg shadow-amber-900/40">
          <Plus size={13} /> Log Item
        </button>
      </div>

      <div className="relative max-w-xs">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items…" className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/40 text-white text-xs font-semibold placeholder-slate-600 focus:outline-none focus:border-amber-500/50 transition-all" />
      </div>

      <div className="space-y-3">
        {filtered.map(item => {
          const cfg = STATUS_CFG[item.status];
          return (
            <div key={item.id} className="flex items-start gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/60 hover:border-slate-700/60 transition-all">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-lg shrink-0">📦</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-white">{item.itemName}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Found at: {item.foundLocation} · By: {item.foundBy}</p>
                <p className="text-[10px] text-slate-700">{new Date(item.foundDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                {item.description && <p className="text-[10px] text-slate-600 mt-1 italic">{item.description}</p>}
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                {item.status === 'FOUND' && (
                  <button onClick={() => setItems(p => p.map(i => i.id === item.id ? { ...i, status: 'CLAIMED' as const } : i))}
                    className="text-[9px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors">
                    Mark Claimed
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0d0d1a] border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/8">
              <p className="text-base font-black text-white">Log Found Item</p>
              <button onClick={() => setShowForm(false)} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400"><X size={13} /></button>
            </div>
            <div className="px-6 py-5 space-y-3">
              {[
                { label: 'Item Name *', key: 'itemName', placeholder: 'e.g. Black iPhone' },
                { label: 'Found Location *', key: 'foundLocation', placeholder: 'e.g. Room 201' },
                { label: 'Found By', key: 'foundBy', placeholder: 'e.g. Priya (Housekeeping)' },
                { label: 'Description', key: 'description', placeholder: 'Any extra notes…' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5">{f.label}</label>
                  <input value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-semibold placeholder-slate-600 focus:outline-none focus:border-amber-500/50 transition-all" />
                </div>
              ))}
            </div>
            <div className="flex gap-2 px-6 pb-6">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 text-sm font-bold hover:bg-white/5 transition-all">Cancel</button>
              <button onClick={addItem} className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold transition-all">Log Item</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
