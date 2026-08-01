import React, { useState } from 'react';
import { Plus, X, Save } from 'lucide-react';

interface POItem {
  name: string;
  qty: number;
  unit: string;
  price: number;
}

interface PurchaseOrderFormProps {
  vendors: { id: string; name: string }[];
  onSubmit?: (data: any) => void;
  onClose?: () => void;
}

export function PurchaseOrderForm({ vendors, onSubmit, onClose }: PurchaseOrderFormProps) {
  const [vendor, setVendor]   = useState('');
  const [date, setDate]       = useState('');
  const [notes, setNotes]     = useState('');
  const [items, setItems]     = useState<POItem[]>([{ name: '', qty: 1, unit: 'Kg', price: 0 }]);

  const total = items.reduce((s, i) => s + i.qty * i.price, 0);

  function addItem() { setItems(prev => [...prev, { name: '', qty: 1, unit: 'Kg', price: 0 }]); }
  function removeItem(idx: number) { setItems(prev => prev.filter((_, i) => i !== idx)); }
  function updateItem(idx: number, field: keyof POItem, val: any) {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: val } : item));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit?.({ vendor, expectedDate: date, notes, items, totalAmount: total });
  }

  const inputCls = 'w-full h-9 px-3 bg-slate-800/60 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Vendor *</label>
          <select value={vendor} onChange={e => setVendor(e.target.value)} required
            className={inputCls + ' cursor-pointer'}>
            <option value="">Select vendor…</option>
            {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Expected Delivery</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputCls} />
        </div>
      </div>

      {/* Items */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Items</label>
          <button type="button" onClick={addItem}
            className="text-[9px] font-black text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
            <Plus size={10} /> Add Item
          </button>
        </div>
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-center">
              <input placeholder="Item name" value={item.name} onChange={e => updateItem(i, 'name', e.target.value)}
                className={inputCls + ' col-span-4'} />
              <input type="number" placeholder="Qty" value={item.qty} onChange={e => updateItem(i, 'qty', +e.target.value)}
                className={inputCls + ' col-span-2'} min={1} />
              <input placeholder="Unit" value={item.unit} onChange={e => updateItem(i, 'unit', e.target.value)}
                className={inputCls + ' col-span-2'} />
              <input type="number" placeholder="Price" value={item.price} onChange={e => updateItem(i, 'price', +e.target.value)}
                className={inputCls + ' col-span-3'} min={0} />
              <button type="button" onClick={() => removeItem(i)} className="col-span-1 text-rose-400 hover:text-rose-300">
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Notes</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
          className={inputCls + ' h-auto py-2 resize-none'} placeholder="Special instructions…" />
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-white/5">
        <p className="text-sm font-black text-white">Total: ₹{total.toLocaleString('en-IN')}</p>
        <div className="flex gap-2">
          <button type="button" onClick={onClose}
            className="h-9 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-black uppercase tracking-wider">
            Cancel
          </button>
          <button type="submit"
            className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
            <Save size={12} /> Create PO
          </button>
        </div>
      </div>
    </form>
  );
}
