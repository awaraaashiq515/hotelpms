'use client';

import React, { useState } from 'react';
import { 
  Coins, 
  X, 
  Loader2
} from 'lucide-react';

interface CategoryAddModalProps {
  onClose: () => void;
  onSave: (payload: any) => Promise<void>;
}

export default function CategoryAddModal({ onClose, onSave }: CategoryAddModalProps) {
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeCode, setNewTypeCode] = useState('');
  const [newTypeRate, setNewTypeRate] = useState('');
  const [newTypeOccupancy, setNewTypeOccupancy] = useState('2');
  const [baseOccupancy, setBaseOccupancy] = useState('2');
  const [extraAdultRate, setExtraAdultRate] = useState('500');
  const [extraChildRate, setExtraChildRate] = useState('250');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        name: newTypeName,
        code: newTypeCode.toUpperCase().trim(),
        baseRate: Number(newTypeRate),
        maxOccupancy: Number(newTypeOccupancy),
        baseOccupancy: Number(baseOccupancy || 2),
        extraAdultRate: Number(extraAdultRate || 0),
        extraChildRate: Number(extraChildRate || 0),
      };
      await onSave(payload);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/80 backdrop-blur-sm animate-in fade-in duration-200">
      <form 
        onSubmit={handleSubmit}
        className="w-full max-w-lg bg-[#0f172a] border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative"
      >
        <button 
          type="button" 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 font-bold p-2 text-2xl leading-none"
        >
          &times;
        </button>

        <div className="space-y-1">
          <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-indigo-400">
            <Coins size={12} /> Rate Management
          </span>
          <h2 className="text-xl font-black text-white leading-none">
            Register Room Category
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Category Name *</label>
            <input
              type="text"
              required
              value={newTypeName}
              onChange={(e) => setNewTypeName(e.target.value)}
              placeholder="e.g. Deluxe Room"
              className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-955 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">System Code *</label>
            <input
              type="text"
              required
              value={newTypeCode}
              onChange={(e) => setNewTypeCode(e.target.value)}
              placeholder="e.g. DLX"
              className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-955 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Base Price (INR) *</label>
            <input
              type="number"
              required
              value={newTypeRate}
              onChange={(e) => setNewTypeRate(e.target.value)}
              placeholder="e.g. 3500"
              className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-955 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Max Occupants *</label>
            <select
              value={newTypeOccupancy}
              onChange={(e) => setNewTypeOccupancy(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-955 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
            >
              <option value="1">1 Guest</option>
              <option value="2">2 Guests</option>
              <option value="3">3 Guests</option>
              <option value="4">4 Guests</option>
              <option value="5">5 Guests</option>
              <option value="6">6 Guests</option>
            </select>
          </div>
        </div>

        {/* Extra Person & Shared Room Surcharges */}
        <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
              👥 Extra Person &amp; Sharing Policy
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Auto-charged for extra friends/guests</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Included Guests (Base)
              </label>
              <select
                value={baseOccupancy}
                onChange={(e) => setBaseOccupancy(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
              >
                <option value="1">1 Guest included</option>
                <option value="2">2 Guests included</option>
                <option value="3">3 Guests included</option>
                <option value="4">4 Guests included</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Extra Adult Rate / Nt (₹)
              </label>
              <input
                type="number"
                min="0"
                value={extraAdultRate}
                onChange={(e) => setExtraAdultRate(e.target.value)}
                placeholder="e.g. 500"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Extra Child Rate / Nt (₹)
              </label>
              <input
                type="number"
                min="0"
                value={extraChildRate}
                onChange={(e) => setExtraChildRate(e.target.value)}
                placeholder="e.g. 250"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
          <p className="text-[10px] text-slate-400 italic">
            When friends or extra adults share this room beyond base occupancy, this surcharge is automatically calculated in the reservation form and folio.
          </p>
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors shadow-lg shadow-indigo-600/10 flex items-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="animate-spin" size={12} /> Saving Category
              </>
            ) : (
              'Create Category'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
