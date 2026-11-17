'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Save,
  MessageCircle,
  Truck,
  Sparkles,
  User,
  Package,
  Building2,
  Phone,
  Check,
  ChevronDown,
  Layers,
  ArrowRight,
  X,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

export interface POFormItem {
  name: string;
  category?: string;
  qty: number;
  unit: string;
  price?: number;
  description?: string;
  stockRequestId?: string;
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
  onVendorCreated?: (newVendor: VendorOption) => void;
  onSubmit?: (data: {
    vendorId: string;
    vendorName: string;
    vendorPhone?: string;
    expectedDate: string;
    notes: string;
    items: POFormItem[];
    totalAmount: number;
    sendWhatsAppImmediately: boolean;
    receiveImmediately: boolean;
    assignToKitchenRunner?: boolean;
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
  'Box',
  'Bag',
  'Bottle',
  'Tin',
  'Dozen',
  'Gram',
  'Bundle',
];

const ITEM_CATEGORIES = [
  'Kitchen & F&B',
  'Vegetables & Fruits',
  'Dairy & Bakery',
  'Grocery & Spices',
  'Meat & Poultry',
  'Beverages & Bar',
  'Linen & Bedding',
  'Toiletries & Amenities',
  'Housekeeping & Cleaning',
  'Maintenance & Engineering',
  'General Supplies',
];

export function PurchaseOrderForm({
  vendors,
  staffMembers = [],
  stockProducts = [],
  initialItems,
  initialNotes = '',
  stockRequestIds = [],
  onVendorCreated,
  onSubmit,
  onClose,
}: PurchaseOrderFormProps) {
  const [vendorList, setVendorList] = useState<VendorOption[]>(vendors);
  const [vendorId, setVendorId] = useState(vendors[0]?.id || '');
  const [vendorPhone, setVendorPhone] = useState(vendors[0]?.phone || '');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState(initialNotes);

  // Quick Vendor Creation Modal / Inline
  const [showAddVendor, setShowAddVendor] = useState(false);
  const [newVendorName, setNewVendorName] = useState('');
  const [newVendorPhone, setNewVendorPhone] = useState('');
  const [newVendorCategory, setNewVendorCategory] = useState('Grocery & Spices');
  const [savingVendor, setSavingVendor] = useState(false);

  // Assigned Staff Selection
  const [assignedStaffId, setAssignedStaffId] = useState('');
  const [assignedStaffName, setAssignedStaffName] = useState('');
  const [assignedStaffPhone, setAssignedStaffPhone] = useState('');

  // Active Dropdown state for product search
  const [activeDropdownIndex, setActiveDropdownIndex] = useState<number | null>(null);

  const [items, setItems] = useState<POFormItem[]>(
    initialItems && initialItems.length > 0
      ? initialItems
      : [
          {
            name: '',
            category: 'Kitchen & F&B',
            qty: 1,
            unit: 'Kg',
            price: 0,
            description: '',
          },
        ]
  );

  // Update vendor list if prop updates
  useEffect(() => {
    setVendorList(vendors);
    if (!vendorId && vendors.length > 0) {
      setVendorId(vendors[0].id);
      setVendorPhone(vendors[0].phone || '');
    }
  }, [vendors, vendorId]);

  // Sync vendor phone on vendor change
  useEffect(() => {
    if (vendorId) {
      const selected = vendorList.find((v) => v.id === vendorId);
      if (selected) {
        setVendorPhone(selected.phone || '');
      }
    }
  }, [vendorId, vendorList]);

  // Handle staff change
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

  const grandTotal = items.reduce(
    (sum, it) => sum + (Number(it.qty) || 0) * (Number(it.price) || 0),
    0
  );

  function addItem() {
    setItems((prev) => [
      ...prev,
      {
        name: '',
        category: 'Kitchen & F&B',
        qty: 1,
        unit: 'Kg',
        price: 0,
        description: '',
      },
    ]);
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
          category: product.itemType || product.category || item.category || 'Kitchen & F&B',
          unit: product.unit || item.unit || 'Kg',
          price: product.costPrice && product.costPrice > 0 ? product.costPrice : item.price,
        };
      })
    );
    setActiveDropdownIndex(null);
  }

  // Quick Add Vendor Handler
  const handleCreateNewVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVendorName.trim()) {
      toast.error('Vendor name is required');
      return;
    }
    setSavingVendor(true);
    try {
      const res = await fetch('/api/hotel/vendor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newVendorName.trim(),
          phone: newVendorPhone.trim() || undefined,
          category: newVendorCategory,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error || 'Failed to create vendor');
        return;
      }

      const created: VendorOption = {
        id: data.data.id,
        name: data.data.name,
        phone: data.data.phone || '',
        category: data.data.category || newVendorCategory,
      };

      setVendorList((prev) => [created, ...prev]);
      setVendorId(created.id);
      setVendorPhone(created.phone || '');
      onVendorCreated?.(created);
      setShowAddVendor(false);
      setNewVendorName('');
      setNewVendorPhone('');
      toast.success(`Vendor "${created.name}" created and selected!`);
    } catch {
      toast.error('Failed to create vendor');
    } finally {
      setSavingVendor(false);
    }
  };

  function handleFormSubmit(mode: 'RECEIVE_NOW' | 'WHATSAPP' | 'SAVE_PO' | 'ASSIGN_KITCHEN_RUNNER') {
    const selectedVendor = vendorList.find((v) => v.id === vendorId);
    const validItems = items.filter((it) => it.name.trim().length > 0);

    if (!vendorId) {
      toast.error('Please select or add a vendor.');
      return;
    }

    if (validItems.length === 0) {
      toast.error('Please add at least one item with a valid name.');
      return;
    }

    let finalNotes = notes;
    if (mode === 'ASSIGN_KITCHEN_RUNNER') {
      finalNotes = `[ASSIGNED_TO_KITCHEN_RUNNER] ${notes}`.trim();
    } else if (mode === 'WHATSAPP') {
      finalNotes = `[DIRECT_VENDOR_DISPATCH] ${notes}`.trim();
    }

    onSubmit?.({
      vendorId,
      vendorName: selectedVendor?.name || 'Vendor',
      vendorPhone,
      expectedDate: date,
      notes: finalNotes,
      items: validItems,
      totalAmount: grandTotal,
      sendWhatsAppImmediately: mode === 'WHATSAPP',
      receiveImmediately: mode === 'RECEIVE_NOW',
      assignToKitchenRunner: mode === 'ASSIGN_KITCHEN_RUNNER',
      stockRequestIds,
      assignedStaffName: mode === 'ASSIGN_KITCHEN_RUNNER' ? (assignedStaffName || 'Kitchen Staff / Runner') : (assignedStaffName || undefined),
      assignedStaffPhone: assignedStaffPhone || undefined,
    });
  }

  const inputCls =
    'w-full h-9 px-3 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors';

  return (
    <div className="space-y-4">
      {/* Banner if converting from Kitchen indents */}
      {stockRequestIds.length > 0 && (
        <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center gap-2 text-indigo-300 text-xs">
          <Sparkles size={14} className="shrink-0 text-indigo-400" />
          <span>
            Converting <b>{stockRequestIds.length} item(s)</b> from Kitchen Indents. Select vendor and review rates below.
          </span>
        </div>
      )}

      {/* Row 1: Vendor Selection & Date */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
        {/* Vendor Selector + Quick Add */}
        <div className="sm:col-span-5">
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Building2 size={11} className="text-cyan-400" />
              <span>Select Vendor *</span>
            </label>
            <button
              type="button"
              onClick={() => setShowAddVendor(!showAddVendor)}
              className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition"
            >
              <Plus size={11} /> {showAddVendor ? 'Close' : '+ New Vendor'}
            </button>
          </div>
          <select
            value={vendorId}
            onChange={(e) => setVendorId(e.target.value)}
            required
            className={inputCls + ' cursor-pointer'}
          >
            <option value="">-- Choose Vendor --</option>
            {vendorList.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} {v.category ? `(${v.category})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Vendor Mobile Number */}
        <div className="sm:col-span-4">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
            Vendor Phone (for WhatsApp)
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="e.g. 9876543210"
              value={vendorPhone}
              onChange={(e) => setVendorPhone(e.target.value)}
              className={inputCls + ' pl-8'}
            />
            <Phone size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          </div>
        </div>

        {/* Delivery / Bill Date */}
        <div className="sm:col-span-3">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
            Date / Expected Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputCls}
          />
        </div>
      </div>

      {/* Quick Add Vendor Form Drawer */}
      {showAddVendor && (
        <form
          onSubmit={handleCreateNewVendor}
          className="p-3.5 rounded-xl bg-slate-900 border border-cyan-500/30 shadow-lg space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
              <Plus size={13} /> Quick Add New Vendor
            </span>
            <button
              type="button"
              onClick={() => setShowAddVendor(false)}
              className="text-slate-400 hover:text-white"
            >
              <X size={14} />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <input
              type="text"
              placeholder="Vendor / Shop Name *"
              value={newVendorName}
              onChange={(e) => setNewVendorName(e.target.value)}
              required
              className={inputCls}
            />
            <input
              type="text"
              placeholder="Mobile / WhatsApp"
              value={newVendorPhone}
              onChange={(e) => setNewVendorPhone(e.target.value)}
              className={inputCls}
            />
            <select
              value={newVendorCategory}
              onChange={(e) => setNewVendorCategory(e.target.value)}
              className={inputCls + ' cursor-pointer'}
            >
              {ITEM_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddVendor(false)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingVendor}
              className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 transition"
            >
              {savingVendor ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
              <span>Save & Select Vendor</span>
            </button>
          </div>
        </form>
      )}

      {/* Row 2: Assigned Staff Receiver (Optional) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
        <div>
          <label className="text-[10px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-1 mb-1">
            <User size={12} />
            <span>Assigned Receiver / Runner Staff (Optional)</span>
          </label>
          <select
            value={assignedStaffId}
            onChange={(e) => handleStaffChange(e.target.value)}
            className={inputCls + ' cursor-pointer border-amber-500/30'}
          >
            <option value="">-- Hotel Staff Receiver --</option>
            {staffMembers.map((staff) => (
              <option key={staff.id} value={staff.id}>
                {staff.name} {staff.designation ? `(${staff.designation})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
            Staff Contact Number
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

      {/* Items Section: Comprehensive Grid */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Package size={12} className="text-cyan-400" />
              <span>Items Purchased & Quantities ({items.length})</span>
            </label>
            <p className="text-[10px] text-slate-500">
              Type or select item name, rate per unit & quantity. Will auto-update stock in Inventory.
            </p>
          </div>
          <button
            type="button"
            onClick={addItem}
            className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 font-bold text-xs flex items-center gap-1 transition border border-cyan-500/20"
          >
            <Plus size={12} /> Add Item Row
          </button>
        </div>

        {/* Table Header */}
        <div className="hidden sm:grid sm:grid-cols-12 gap-2 px-3 py-1.5 bg-slate-950/70 rounded-lg text-[10px] font-black uppercase tracking-wider text-slate-400 border border-slate-800">
          <div className="col-span-4">Item Name / Search</div>
          <div className="col-span-2">Category</div>
          <div className="col-span-2">Qty & Unit</div>
          <div className="col-span-2">Rate (₹)</div>
          <div className="col-span-1 text-right">Total (₹)</div>
          <div className="col-span-1 text-center">Action</div>
        </div>

        {/* Item Rows */}
        <div className="space-y-2">
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
            const lineTotal = (Number(item.qty) || 0) * (Number(item.price) || 0);

            return (
              <div
                key={i}
                className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 hover:border-slate-700 transition"
              >
                {/* 1. Item Name Search / Autocomplete */}
                <div className="col-span-12 sm:col-span-4 relative">
                  <span className="sm:hidden text-[9px] font-black uppercase text-slate-400 block mb-0.5">
                    Item Name
                  </span>
                  <div className="relative">
                    <input
                      placeholder="e.g. Milk, Onion, Tomato, Towels..."
                      value={item.name}
                      onFocus={() => setActiveDropdownIndex(i)}
                      onChange={(e) => {
                        updateItem(i, 'name', e.target.value);
                        setActiveDropdownIndex(i);
                      }}
                      className={inputCls + ' pr-7 font-medium'}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setActiveDropdownIndex(isDropdownOpen ? null : i)
                      }
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                    >
                      <ChevronDown size={13} />
                    </button>
                  </div>

                  {/* Dropdown Options */}
                  {isDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-56 overflow-y-auto rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-1 text-xs">
                      {query.length > 0 && !isExactMatch && (
                        <div
                          onMouseDown={() => setActiveDropdownIndex(null)}
                          className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 flex items-center gap-2 cursor-pointer transition border border-emerald-500/20 mb-1"
                        >
                          <Sparkles size={13} className="text-emerald-400 shrink-0" />
                          <div className="truncate">
                            <span className="font-bold">Add &quot;{item.name}&quot;</span>
                            <span className="text-[10px] text-emerald-400/80 block">
                              New Item (will be added to Stock & Catalog)
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="text-[9px] font-black uppercase tracking-wider text-slate-500 px-2 py-1">
                        From Inventory Catalog ({matchingProducts.length})
                      </div>

                      {matchingProducts.length === 0 ? (
                        <div className="px-3 py-2 text-slate-400 text-xs italic">
                          No matching stock item found. Will create new entry.
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
                                <span className="bg-slate-800 px-1 py-0.2 rounded border border-slate-700 font-mono">
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

                {/* 2. Category */}
                <div className="col-span-6 sm:col-span-2">
                  <span className="sm:hidden text-[9px] font-black uppercase text-slate-400 block mb-0.5">
                    Category
                  </span>
                  <select
                    value={item.category || 'Kitchen & F&B'}
                    onChange={(e) => updateItem(i, 'category', e.target.value)}
                    className={inputCls + ' cursor-pointer'}
                  >
                    {ITEM_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Quantity & Unit */}
                <div className="col-span-6 sm:col-span-2 grid grid-cols-2 gap-1">
                  <div>
                    <span className="sm:hidden text-[9px] font-black uppercase text-slate-400 block mb-0.5">
                      Qty
                    </span>
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
                  <div>
                    <span className="sm:hidden text-[9px] font-black uppercase text-slate-400 block mb-0.5">
                      Unit
                    </span>
                    <select
                      value={item.unit}
                      onChange={(e) => updateItem(i, 'unit', e.target.value)}
                      className={inputCls + ' cursor-pointer px-1 text-[11px]'}
                    >
                      {COMMON_UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 4. Rate per Unit (₹) */}
                <div className="col-span-6 sm:col-span-2">
                  <span className="sm:hidden text-[9px] font-black uppercase text-slate-400 block mb-0.5">
                    Rate (₹)
                  </span>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">
                      ₹
                    </span>
                    <input
                      type="number"
                      placeholder="Rate"
                      value={item.price || ''}
                      onChange={(e) =>
                        updateItem(i, 'price', Math.max(0, Number(e.target.value)))
                      }
                      className={inputCls + ' pl-6 font-mono'}
                      min={0}
                      step={1}
                    />
                  </div>
                </div>

                {/* 5. Total (₹) */}
                <div className="col-span-5 sm:col-span-1 text-right">
                  <span className="sm:hidden text-[9px] font-black uppercase text-slate-400 block mb-0.5">
                    Total
                  </span>
                  <span className="text-xs font-black text-cyan-300 font-mono">
                    ₹{lineTotal.toLocaleString('en-IN')}
                  </span>
                </div>

                {/* 6. Remove Button */}
                <div className="col-span-1 flex justify-center">
                  <button
                    type="button"
                    onClick={() => removeItem(i)}
                    disabled={items.length <= 1}
                    className="w-8 h-8 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 disabled:opacity-20 disabled:pointer-events-none flex items-center justify-center transition"
                    title="Remove item"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Special Instructions / Bill Notes */}
      <div>
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
          Purchase Notes / Bill Reference / Instructions
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className={inputCls + ' h-auto py-2 resize-none'}
          placeholder="e.g. Bill #1234, Fresh vegetables check passed, received at main store..."
        />
      </div>

      {/* Summary Banner & Action Buttons */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <span className="text-xs text-slate-400">Total Purchase Amount:</span>
            <div className="text-xl font-black text-emerald-400 font-mono">
              ₹{grandTotal.toLocaleString('en-IN')}
              <span className="text-xs font-normal text-slate-400 ml-2">
                ({items.length} items)
              </span>
            </div>
          </div>
          {assignedStaffName && (
            <div className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
              <User size={13} />
              <span>
                Receiver: <b>{assignedStaffName}</b> ({assignedStaffPhone || 'No phone'})
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto h-10 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
          >
            Cancel
          </button>

          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto flex-wrap justify-end">
            {/* Option 1: Send to Kitchen Runner */}
            <button
              type="button"
              onClick={() => handleFormSubmit('ASSIGN_KITCHEN_RUNNER')}
              className="w-full sm:w-auto h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/30 transition"
              title="Dispatches order straight to Kitchen Portal Market Buying List for runner to buy and tick done"
            >
              <span>🏃‍♂️ Send to Kitchen Runner</span>
            </button>

            {/* Option 2: Save PO and Send WhatsApp directly to Vendor */}
            <button
              type="button"
              onClick={() => handleFormSubmit('WHATSAPP')}
              className="w-full sm:w-auto h-10 px-4 rounded-xl bg-emerald-600/90 hover:bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition"
              title="Save PO & Send direct WhatsApp order to vendor for hotel delivery"
            >
              <MessageCircle size={14} />
              <span>WhatsApp to Vendor 📲</span>
            </button>

            {/* Option 3: Receive Goods & Add to Stock Now (Instant GRN) */}
            <button
              type="button"
              onClick={() => handleFormSubmit('RECEIVE_NOW')}
              className="w-full sm:w-auto h-10 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black text-xs font-black flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 transition"
              title="Immediately add items to hotel inventory stock"
            >
              <Truck size={14} />
              <span>Direct Inward 📦</span>
            </button>

            {/* Option 4: Save PO as Pending */}
            <button
              type="button"
              onClick={() => handleFormSubmit('SAVE_PO')}
              className="w-full sm:w-auto h-10 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-700 transition"
              title="Save as Purchase Order (Awaiting Delivery)"
            >
              <Save size={13} />
              <span>Save PO</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
