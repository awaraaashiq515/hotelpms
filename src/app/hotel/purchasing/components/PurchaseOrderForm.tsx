'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  X,
  Save,
  MessageCircle,
  AlertCircle,
  Sparkles,
  User,
  Search,
  Package,
  Check,
  ChevronDown
} from 'lucide-react';

export interface POFormItem {
  name: string;
  qty: number;
  unit: string;
  description?: string;
  price?: number;
  stockRequestId?: string;
  isNewProduct?: boolean;
}

export interface VendorOption {
  id: string;
  name: string;
  phone?: string;
  category?: string;
}

export interface StaffOption {
  id: string;
  name: string;
  phone?: string;
  designation?: string;
}

export interface ProductOption {
  id: string;
  name: string;
  unit?: string;
  costPrice?: number;
  itemType?: string;
  category?: string;
  currentStock?: number;
}

interface PurchaseOrderFormProps {
  vendors: VendorOption[];
  staffMembers?: StaffOption[];
  stockProducts?: ProductOption[];
  initialItems?: POFormItem[];
  initialNotes?: string;
  stockRequestIds?: string[];
  onSubmit?: (data: {
    vendorId: string;
    vendorName: string;
    vendorPhone?: string;
    expectedDate: string;
    notes: string;
    items: POFormItem[];
    totalAmount: number;
    sendWhatsAppImmediately: boolean;
    stockRequestIds?: string[];
    assignedStaffName?: string;
    assignedStaffPhone?: string;
  }) => void;
  onClose?: () => void;
}

const COMMON_UNITS = [
  'Kg',
  'Litre',
  'Pcs',
  'Packet',
  'Gram',
  'Box',
  'Bundle',
  'Dozen',
  'Tin',
  'Can',
  'Bottle',
  'Bag',
];

export function PurchaseOrderForm({
  vendors,
  staffMembers = [],
  stockProducts = [],
  initialItems,
  initialNotes = '',
  stockRequestIds = [],
  onSubmit,
  onClose,
}: PurchaseOrderFormProps) {
  const [vendorId, setVendorId] = useState(vendors[0]?.id || '');
  const [vendorPhone, setVendorPhone] = useState(vendors[0]?.phone || '');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState(initialNotes);

  // Assigned Staff Selection
  const [assignedStaffId, setAssignedStaffId] = useState('');
  const [assignedStaffName, setAssignedStaffName] = useState('');
  const [assignedStaffPhone, setAssignedStaffPhone] = useState('');

  // Active Dropdown state for product search combobox
  const [activeDropdownIndex, setActiveDropdownIndex] = useState<number | null>(null);

  const [items, setItems] = useState<POFormItem[]>(
    initialItems && initialItems.length > 0
      ? initialItems
      : [{ name: '', qty: 1, unit: 'Kg', price: 0 }]
  );

  // Sync vendor phone on vendor change
  useEffect(() => {
    if (vendorId) {
      const selected = vendors.find((v) => v.id === vendorId);
      if (selected && selected.phone) {
        setVendorPhone(selected.phone);
      }
    }
  }, [vendorId, vendors]);

  // Sync assigned staff details on staff change
  const handleStaffChange = (staffId: string) => {
    setAssignedStaffId(staffId);
    if (!staffId) {
      setAssignedStaffName('');
      setAssignedStaffPhone('');
      return;
    }
    const staff = staffMembers.find((s) => s.id === staffId);
    if (staff) {
      setAssignedStaffName(staff.name);
      setAssignedStaffPhone(staff.phone || '');
    }
  };

  const total = items.reduce(
    (s, i) => s + (Number(i.qty) || 0) * (Number(i.price) || 0),
    0
  );

  function addItem() {
    setItems((prev) => [...prev, { name: '', qty: 1, unit: 'Kg', price: 0 }]);
  }

  function removeItem(idx: number) {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateItem(idx: number, field: keyof POFormItem, val: any) {
    setItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: val } : item))
    );
  }

  function selectExistingProduct(idx: number, product: ProductOption) {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item;
        return {
          ...item,
          name: product.name,
          unit: product.unit || item.unit || 'Kg',
          price: product.costPrice && product.costPrice > 0 ? product.costPrice : item.price,
          isNewProduct: false,
        };
      })
    );
    setActiveDropdownIndex(null);
  }

  function handleSave(sendWhatsAppImmediately: boolean) {
    const selectedVendor = vendors.find((v) => v.id === vendorId);
    const validItems = items.filter((it) => it.name.trim().length > 0);

    if (validItems.length === 0) {
      alert('Please add at least one item with a valid name.');
      return;
    }

    onSubmit?.({
      vendorId,
      vendorName: selectedVendor?.name || 'Vendor',
      vendorPhone,
      expectedDate: date,
      notes,
      items: validItems,
      totalAmount: total,
      sendWhatsAppImmediately,
      stockRequestIds,
      assignedStaffName: assignedStaffName || undefined,
      assignedStaffPhone: assignedStaffPhone || undefined,
    });
  }

  const inputCls =
    'w-full h-9 px-3 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-colors';

  return (
    <div className="space-y-4">
      {stockRequestIds.length > 0 && (
        <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center gap-2 text-indigo-300 text-xs">
          <Sparkles size={14} className="shrink-0 text-indigo-400" />
          <span>
            Converting <b>{stockRequestIds.length} item(s)</b> from Kitchen Indents. Vendor, staff, and prices can be configured below.
          </span>
        </div>
      )}

      {/* Row 1: Vendor & Date */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Vendor Selection */}
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
            Select Vendor *
          </label>
          <select
            value={vendorId}
            onChange={(e) => setVendorId(e.target.value)}
            required
            className={inputCls + ' cursor-pointer'}
          >
            <option value="">Select a vendor...</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} {v.category ? `(${v.category})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Vendor Phone (For WhatsApp) */}
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
            Vendor WhatsApp / Mobile
          </label>
          <input
            type="text"
            placeholder="e.g. 9876543210"
            value={vendorPhone}
            onChange={(e) => setVendorPhone(e.target.value)}
            className={inputCls}
          />
        </div>

        {/* Expected Delivery Date */}
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
            Expected Delivery Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputCls}
          />
        </div>
      </div>

      {/* Row 2: Assigned Staff Member (Pickup / Receiving) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
        <div>
          <label className="text-[10px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-1 mb-1">
            <User size={12} />
            <span>Assigned Staff (Pickup / Receiving Staff)</span>
          </label>
          <select
            value={assignedStaffId}
            onChange={(e) => handleStaffChange(e.target.value)}
            className={inputCls + ' cursor-pointer border-amber-500/30'}
          >
            <option value="">Select hotel staff member...</option>
            {staffMembers.map((staff) => (
              <option key={staff.id} value={staff.id}>
                {staff.name} {staff.designation ? `(${staff.designation})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
            Assigned Staff Contact Number
          </label>
          <input
            type="text"
            placeholder="Staff Phone (e.g. 9876543210)"
            value={assignedStaffPhone}
            onChange={(e) => setAssignedStaffPhone(e.target.value)}
            className={inputCls}
          />
        </div>
      </div>

      {/* Items Section with Search & Auto-complete */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
              Items to Purchase ({items.length})
            </label>
            <p className="text-[10px] text-slate-500">
              Select an existing product from inventory or type a new product name (auto-saves to catalog).
            </p>
          </div>
          <button
            type="button"
            onClick={addItem}
            className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition"
          >
            <Plus size={12} /> Add Item Row
          </button>
        </div>

        <div className="space-y-2.5">
          {items.map((item, i) => {
            const query = (item.name || '').trim().toLowerCase();
            const matchingProducts = query
              ? stockProducts
                  .filter((p) => p.name.toLowerCase().includes(query))
                  .slice(0, 8)
              : stockProducts.slice(0, 8);

            const isExactMatch = stockProducts.some(
              (p) => p.name.toLowerCase().trim() === query
            );
            const isDropdownOpen = activeDropdownIndex === i;

            return (
              <div
                key={i}
                className="relative grid grid-cols-12 gap-2 items-center bg-slate-900/60 p-2.5 rounded-xl border border-slate-800"
              >
                {/* Searchable Product Input */}
                <div className="col-span-12 sm:col-span-4 relative">
                  <div className="relative">
                    <input
                      placeholder="Type or select product name..."
                      value={item.name}
                      onFocus={() => setActiveDropdownIndex(i)}
                      onChange={(e) => {
                        updateItem(i, 'name', e.target.value);
                        setActiveDropdownIndex(i);
                      }}
                      className={inputCls + ' pr-8'}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setActiveDropdownIndex(isDropdownOpen ? null : i)
                      }
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>

                  {/* Autocomplete Dropdown */}
                  {isDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-56 overflow-y-auto rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-1 text-xs">
                      {/* New Product Option */}
                      {query.length > 0 && !isExactMatch && (
                        <div
                          onMouseDown={() => {
                            updateItem(i, 'isNewProduct', true);
                            setActiveDropdownIndex(null);
                          }}
                          className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 flex items-center gap-2 cursor-pointer transition border border-emerald-500/20 mb-1"
                        >
                          <Sparkles size={13} className="text-emerald-400 shrink-0" />
                          <div className="truncate">
                            <span className="font-bold">Add &quot;{item.name}&quot;</span>
                            <span className="text-[10px] text-emerald-400 block opacity-80">
                              New Product (Will auto-save to catalog)
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Matching existing products */}
                      <div className="text-[9px] font-black uppercase tracking-wider text-slate-500 px-2 py-1">
                        Existing Products ({matchingProducts.length})
                      </div>

                      {matchingProducts.length === 0 ? (
                        <div className="px-3 py-2 text-slate-400 text-xs italic">
                          No matching stock item. Will save as new product on submit.
                        </div>
                      ) : (
                        matchingProducts.map((p) => (
                          <div
                            key={p.id}
                            onMouseDown={() => selectExistingProduct(i, p)}
                            className="p-2 rounded-lg hover:bg-slate-800 flex items-center justify-between cursor-pointer transition"
                          >
                            <div className="truncate">
                              <span className="font-semibold text-white block truncate">
                                {p.name}
                              </span>
                              <span className="text-[10px] text-slate-400 flex items-center gap-1.5">
                                <span className="bg-slate-800 px-1.5 py-0.2 rounded border border-slate-700 font-mono">
                                  {p.unit || 'unit'}
                                </span>
                                {p.costPrice ? `₹${p.costPrice}` : ''}
                                {p.itemType ? `• ${p.itemType}` : ''}
                              </span>
                            </div>
                            {item.name.toLowerCase().trim() === p.name.toLowerCase().trim() && (
                              <Check size={14} className="text-cyan-400 shrink-0 ml-2" />
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Quantity */}
                <div className="col-span-6 sm:col-span-2">
                  <input
                    type="number"
                    placeholder="Qty"
                    value={item.qty || ''}
                    onChange={(e) =>
                      updateItem(i, 'qty', Math.max(0.1, Number(e.target.value)))
                    }
                    className={inputCls}
                    min={0.1}
                    step={0.5}
                  />
                </div>

                {/* Unit */}
                <div className="col-span-6 sm:col-span-2">
                  <select
                    value={item.unit}
                    onChange={(e) => updateItem(i, 'unit', e.target.value)}
                    className={inputCls + ' cursor-pointer'}
                  >
                    {COMMON_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Item Description / Specifications (Replaces hardcoded Rate) */}
                <div className="col-span-11 sm:col-span-3">
                  <input
                    type="text"
                    placeholder="Specs / Quality / Brand"
                    value={item.description || ''}
                    onChange={(e) =>
                      updateItem(i, 'description', e.target.value)
                    }
                    className={inputCls}
                  />
                </div>

                {/* Remove */}
                <div className="col-span-1 flex justify-center">
                  <button
                    type="button"
                    onClick={() => removeItem(i)}
                    disabled={items.length <= 1}
                    className="w-8 h-8 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center transition"
                    title="Remove Item"
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Special Instructions */}
      <div>
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
          Special Notes & Instructions for Vendor
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className={inputCls + ' h-auto py-2 resize-none'}
          placeholder="e.g. Fresh stock required, delivery required before 8 AM at Hotel Kitchen gate..."
        />
      </div>

      {/* Summary and Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-slate-800 gap-3">
        <div>
          <span className="text-xs text-slate-400">Billing / Rates: </span>
          <span className="text-sm font-bold text-cyan-400 font-mono">
            {total > 0
              ? `Est. ₹${total.toLocaleString('en-IN')}`
              : 'As per Vendor Daily Market Rate / Invoice'}
          </span>
          {assignedStaffName && (
            <p className="text-[10px] text-amber-400 mt-0.5">
              Assigned Runner: <b>{assignedStaffName}</b> ({assignedStaffPhone || 'No phone'})
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => handleSave(false)}
            className="h-9 px-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold flex items-center gap-1.5 transition"
          >
            <Save size={13} />
            <span>Save PO</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave(true)}
            className="h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition"
          >
            <MessageCircle size={14} />
            <span>Save & WhatsApp Vendor</span>
          </button>
        </div>
      </div>
    </div>
  );
}
