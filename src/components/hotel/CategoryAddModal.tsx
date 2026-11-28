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
  initialData?: any | null;
}

export default function CategoryAddModal({ onClose, onSave, initialData }: CategoryAddModalProps) {
  const [newTypeName, setNewTypeName] = useState(initialData?.name || '');
  const [newTypeCode, setNewTypeCode] = useState(initialData?.code || '');
  const [newTypeRate, setNewTypeRate] = useState(initialData?.baseRate !== undefined ? String(initialData.baseRate) : '');
  const [newTypeOccupancy, setNewTypeOccupancy] = useState(initialData?.maxOccupancy !== undefined ? String(initialData.maxOccupancy) : '2');
  const [baseOccupancy, setBaseOccupancy] = useState(initialData?.baseOccupancy !== undefined ? String(initialData.baseOccupancy) : '2');
  const [extraAdultRate, setExtraAdultRate] = useState(initialData?.extraAdultRate !== undefined ? String(initialData.extraAdultRate) : '500');
  const [extraChildRate, setExtraChildRate] = useState(initialData?.extraChildRate !== undefined ? String(initialData.extraChildRate) : '250');
  const [gstRate, setGstRate] = useState<string>(
    initialData?.gstRate !== undefined && initialData?.gstRate !== null ? String(initialData.gstRate) : ''
  );
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...(initialData?.id ? { id: initialData.id } : {}),
        name: newTypeName,
        code: newTypeCode.toUpperCase().trim(),
        baseRate: Number(newTypeRate),
        maxOccupancy: Number(newTypeOccupancy),
        baseOccupancy: Number(baseOccupancy || 2),
        extraAdultRate: Number(extraAdultRate || 0),
        extraChildRate: Number(extraChildRate || 0),
        gstRate: gstRate === '' ? null : Number(gstRate),
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
            {initialData ? 'Edit Room Category' : 'Register Room Category'}
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

          <div className="sm:col-span-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Default GST Rate (%)
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {[
                { label: 'Auto Slab', val: '' },
                { label: '0% GST', val: '0' },
                { label: '5% GST', val: '5' },
                { label: '12% GST', val: '12' },
                { label: '18% GST', val: '18' },
                { label: '28% GST', val: '28' },
              ].map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => setGstRate(opt.val)}
                  className={`py-2 px-2 rounded-xl border text-[11px] font-bold transition-all ${
                    gstRate === opt.val
                      ? 'bg-indigo-600/25 border-indigo-500 text-indigo-300 shadow-sm'
                      : 'bg-slate-955 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 mt-1.5">
              Optional: Pre-sets GST rate for this category (can also be changed or added at billing time).
            </p>
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
              initialData ? 'Update Category' : 'Create Category'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
