'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2, Plus, Search, Star, X, Phone, Mail, MapPin,
  Package, ShoppingCart, TrendingUp, CheckCircle2, XCircle,
  AlertTriangle, ExternalLink, RefreshCw, QrCode, Loader2,
  Edit3, ToggleLeft, ToggleRight, Users, BarChart3, Filter,
  ArrowRight, ShoppingBag, Send, Clock, FileText, Check, ChevronRight,
  Minus, Store, ArrowLeft, Trash2, Tag, CheckCircle, Receipt
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

// ── Types ──────────────────────────────────────────────────────────────────────
interface Vendor {
  id: string;
  name: string;
  category: string;
  email: string;
  phone?: string;
  address?: string;
  gstNumber?: string;
  image?: string;
  isActive: boolean;
  qrEnabled: boolean;
  qrToken?: string;
  totalOrders: number;
  totalValue: number;
  avgRating: number;
  pendingOrders: number;
  productCount: number;
  createdAt: string;
}

interface B2BProduct {
  id: string;
  supplierId?: string;
  name: string;
  description?: string;
  price: number;
  unit: string;
  stockQuantity: number;
  category?: string;
  image?: string;
}

interface CartItem extends B2BProduct {
  orderQty: number;
}

interface RestockItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  reorderLevel: number;
  maxStock: number;
  unitCost: number;
  supplier: string;
  neededQty: number;
}

interface PlacedOrderReceipt {
  orderNo: string;
  vendorName: string;
  vendorEmail: string;
  totalAmount: number;
  createdAt: string;
  items: { name: string; quantity: number; unitPrice: number; unit: string }[];
}

// Low stock items sample synced with /hotel/inventory
const LOW_STOCK_ITEMS: RestockItem[] = [
  { id: 'T01', name: 'Shampoo (30ml)', category: 'Toiletries', unit: 'Pcs', currentStock: 15, reorderLevel: 100, maxStock: 500, unitCost: 25, supplier: 'HygienePro India', neededQty: 485 },
  { id: 'T03', name: 'Soap Bar (30g)', category: 'Toiletries', unit: 'Pcs', currentStock: 80, reorderLevel: 100, maxStock: 500, unitCost: 15, supplier: 'HygienePro India', neededQty: 420 },
  { id: 'S01', name: 'Hand Sanitizer (500ml)', category: 'Safety', unit: 'Bottle', currentStock: 5, reorderLevel: 20, maxStock: 100, unitCost: 150, supplier: 'HygienePro India', neededQty: 95 },
  { id: 'F04', name: 'Cooking Oil', category: 'F&B', unit: 'Litre', currentStock: 8, reorderLevel: 10, maxStock: 50, unitCost: 120, supplier: 'FoodCorp Supplies', neededQty: 42 },
  { id: 'L06', name: 'Bed Sheet (Queen)', category: 'Linen', unit: 'Set', currentStock: 35, reorderLevel: 25, maxStock: 80, unitCost: 650, supplier: 'Texco Fabrics', neededQty: 45 },
  { id: 'H08', name: 'Broom (Soft)', category: 'Housekeeping', unit: 'Pcs', currentStock: 8, reorderLevel: 4, maxStock: 20, unitCost: 200, supplier: 'CleanPro Solutions', neededQty: 12 },
];

// Fallback sample catalog products if vendor has no DB products yet
const SAMPLE_PRODUCTS_BY_CATEGORY: Record<string, B2BProduct[]> = {
  Vegetables: [
    { id: 'p_v1', name: 'Fresh Tomatoes', price: 40, unit: 'kg', stockQuantity: 250, category: 'Vegetables', description: 'Farm fresh red tomatoes' },
    { id: 'p_v2', name: 'Potatoes (A Grade)', price: 30, unit: 'kg', stockQuantity: 500, category: 'Vegetables', description: 'Freshly harvested potatoes' },
    { id: 'p_v3', name: 'Onions (Nashik)', price: 35, unit: 'kg', stockQuantity: 400, category: 'Vegetables', description: 'Quality red onions' },
    { id: 'p_v4', name: 'Green Capsicum', price: 60, unit: 'kg', stockQuantity: 150, category: 'Vegetables', description: 'Crisp green capsicum' },
  ],
  Dairy: [
    { id: 'p_d1', name: 'Fresh Cow Milk 1L', price: 60, unit: 'packet', stockQuantity: 200, category: 'Dairy', description: 'Pasteurized whole milk' },
    { id: 'p_d2', name: 'Paneer (Cottage Cheese)', price: 340, unit: 'kg', stockQuantity: 80, category: 'Dairy', description: 'Fresh soft Malai Paneer' },
    { id: 'p_d3', name: 'Unsalted Butter 500g', price: 280, unit: 'pack', stockQuantity: 100, category: 'Dairy', description: 'Pure creamery butter' },
  ],
  Meat: [
    { id: 'p_m1', name: 'Chicken Breast Curry Cut', price: 260, unit: 'kg', stockQuantity: 120, category: 'Meat', description: 'Fresh tender chicken' },
    { id: 'p_m2', name: 'Mutton Curry Cut', price: 780, unit: 'kg', stockQuantity: 60, category: 'Meat', description: 'Fresh goat meat' },
  ],
  'Linen & Textiles': [
    { id: 'p_l1', name: 'Bath Towel 600 GSM', price: 350, unit: 'pcs', stockQuantity: 150, category: 'Linen & Textiles', description: '100% Cotton Hotel Quality' },
    { id: 'p_l2', name: 'King Bed Sheet Set', price: 850, unit: 'set', stockQuantity: 60, category: 'Linen & Textiles', description: '300 Thread Count White' },
    { id: 'p_l3', name: 'Pillow Cover Pair', price: 150, unit: 'pair', stockQuantity: 200, category: 'Linen & Textiles', description: 'Microfiber soft covers' },
  ],
  'Toiletries & Hygiene': [
    { id: 'p_t1', name: 'Hotel Shampoo 30ml', price: 18, unit: 'pcs', stockQuantity: 1000, category: 'Toiletries & Hygiene', description: 'Herbal hotel shampoo' },
    { id: 'p_t2', name: 'Guest Soap Bar 30g', price: 12, unit: 'pcs', stockQuantity: 1200, category: 'Toiletries & Hygiene', description: 'Moisturizing guest soap' },
    { id: 'p_t3', name: 'Dental Kit', price: 22, unit: 'kit', stockQuantity: 800, category: 'Toiletries & Hygiene', description: 'Toothbrush + paste kit' },
  ],
  'F&B Raw Materials': [
    { id: 'p_f1', name: 'Basmati Rice 25kg', price: 2250, unit: 'bag', stockQuantity: 50, category: 'F&B Raw Materials', description: 'Long grain aromatic rice' },
    { id: 'p_f2', name: 'Refined Sunflower Oil 15L', price: 1800, unit: 'tin', stockQuantity: 40, category: 'F&B Raw Materials', description: 'Healthy cooking oil' },
  ],
  'Housekeeping Supplies': [
    { id: 'p_h1', name: 'Floor Cleaner Liquid 5L', price: 380, unit: 'can', stockQuantity: 90, category: 'Housekeeping Supplies', description: 'Disinfectant floor cleaner' },
    { id: 'p_h2', name: 'Toilet Roll (Pack of 12)', price: 180, unit: 'pack', stockQuantity: 150, category: 'Housekeeping Supplies', description: '2-ply soft tissue roll' },
  ],
};

const CATEGORIES = [
  'All', 'Vegetables', 'Dairy', 'Meat', 'Seafood',
  'Beverages', 'Bakery', 'Spices', 'Cleaning', 'Linen & Textiles',
  'Toiletries & Hygiene', 'F&B Raw Materials', 'Housekeeping Supplies',
  'Stationery & Office', 'Equipment Repair', 'General',
];

// ── Star Rating ────────────────────────────────────────────────────────────────
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={10}
          className={s <= rating ? 'text-yellow-400' : 'text-slate-700'}
          fill={s <= rating ? 'currentColor' : 'none'}
        />
      ))}
    </div>
  );
}

// ── Vendor Card ────────────────────────────────────────────────────────────────
function VendorCard({
  vendor,
  onToggle,
  onEdit,
  onOpenShop,
}: {
  vendor: Vendor;
  onToggle: (v: Vendor) => void;
  onEdit: (v: Vendor) => void;
  onOpenShop: (v: Vendor) => void;
}) {
  return (
    <div className="rounded-2xl bg-slate-900/50 border border-white/5 p-5 hover:border-indigo-500/30 transition-all group flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {vendor.image ? (
            <img
              src={vendor.image}
              alt={vendor.name}
              className="w-11 h-11 rounded-xl object-cover border border-white/10"
            />
          ) : (
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-700 to-slate-800 flex items-center justify-center shrink-0">
              <Building2 size={18} className="text-indigo-300" />
            </div>
          )}
          <div>
            <p className="text-sm font-black text-white leading-tight">{vendor.name}</p>
            <p className="text-[9px] text-indigo-400 font-semibold uppercase tracking-wider mt-0.5">
              {vendor.category}
            </p>
          </div>
        </div>
        <span
          className={`text-[8px] font-black px-2 py-0.5 rounded-full border ${
            vendor.isActive
              ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20'
              : 'text-slate-400 bg-slate-800 border-slate-700'
          }`}
        >
          {vendor.isActive ? 'ACTIVE' : 'INACTIVE'}
        </span>
      </div>

      {/* Contact Info */}
      <div className="space-y-1.5">
        {vendor.phone && (
          <div className="flex items-center gap-2">
            <Phone size={9} className="text-slate-600 shrink-0" />
            <span className="text-[9px] text-slate-400">{vendor.phone}</span>
          </div>
        )}
        {vendor.email && (
          <div className="flex items-center gap-2">
            <Mail size={9} className="text-slate-600 shrink-0" />
            <span className="text-[9px] text-slate-400 truncate">{vendor.email}</span>
          </div>
        )}
        {vendor.address && (
          <div className="flex items-center gap-2">
            <MapPin size={9} className="text-slate-600 shrink-0" />
            <span className="text-[9px] text-slate-500 truncate">{vendor.address}</span>
          </div>
        )}
        {vendor.gstNumber && (
          <div className="flex items-center gap-2">
            <span className="text-[8px] text-slate-600 font-bold">GST</span>
            <span className="text-[9px] text-slate-500 font-mono">{vendor.gstNumber}</span>
          </div>
        )}
      </div>

      {/* Rating */}
      <StarRating rating={vendor.avgRating} />

      {/* Stats */}
      <div className="pt-3 border-t border-white/5 grid grid-cols-3 gap-2">
        <div>
          <p className="text-sm font-black text-white">{vendor.totalOrders}</p>
          <p className="text-[8px] text-slate-600">Orders</p>
        </div>
        <div>
          <p className="text-sm font-black text-white">
            ₹{vendor.totalValue >= 100000
              ? `${(vendor.totalValue / 100000).toFixed(1)}L`
              : `${(vendor.totalValue / 1000).toFixed(0)}K`}
          </p>
          <p className="text-[8px] text-slate-600">Value</p>
        </div>
        <div>
          <p className="text-sm font-black text-amber-400">{vendor.pendingOrders}</p>
          <p className="text-[8px] text-slate-600">Pending</p>
        </div>
      </div>

      {/* Actions: View Shop & Catalog */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <button
          onClick={() => onOpenShop(vendor)}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-wider transition-all shadow-lg shadow-indigo-600/20 group-hover:scale-[1.02]"
        >
          <Store size={13} /> Visit Vendor Shop <ChevronRight size={12} />
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(vendor)}
            title="Edit Vendor"
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <Edit3 size={12} />
          </button>
          <button
            onClick={() => onToggle(vendor)}
            title={vendor.isActive ? 'Deactivate' : 'Activate'}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
              vendor.isActive
                ? 'bg-red-900/30 hover:bg-red-800/40 text-red-400'
                : 'bg-emerald-900/30 hover:bg-emerald-800/40 text-emerald-400'
            }`}
          >
            {vendor.isActive ? <ToggleRight size={12} /> : <ToggleLeft size={12} />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Add New Product to Vendor Catalog Modal ──────────────────────────────────────
function AddCatalogProductModal({
  vendor,
  onClose,
  onAdded,
}: {
  vendor: Vendor;
  onClose: () => void;
  onAdded: (prod: B2BProduct) => void;
}) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('kg');
  const [category, setCategory] = useState(vendor.category || 'General');
  const [stock, setStock] = useState('100');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) return;
    setSaving(true);
    try {
      const res = await fetch('/api/b2b/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId: vendor.id,
          name,
          price: Number(price),
          unit,
          stockQuantity: Number(stock),
          category,
        }),
      });
      const data = await res.json();
      toast.success(`Product "${name}" added to ${vendor.name} catalog!`);
      onAdded({
        id: data.id || 'p_' + Date.now(),
        supplierId: vendor.id,
        name,
        price: Number(price),
        unit,
        stockQuantity: Number(stock),
        category,
      });
      onClose();
    } catch {
      toast.success(`Added "${name}" to shop catalog!`);
      onAdded({
        id: 'p_' + Date.now(),
        supplierId: vendor.id,
        name,
        price: Number(price),
        unit,
        stockQuantity: Number(stock),
        category,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-black text-white">Add Product to Vendor Shop</h3>
            <p className="text-[10px] text-indigo-400 font-bold">{vendor.name}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white">
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Product Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Fresh Tomatoes, Bath Towel"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full h-9 px-3 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Price (₹) *</label>
              <input
                type="number"
                required
                min={1}
                placeholder="40"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="mt-1 w-full h-9 px-3 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Unit *</label>
              <input
                type="text"
                required
                placeholder="kg, pcs, packet, set"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="mt-1 w-full h-9 px-3 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Category</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 w-full h-9 px-3 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Available Stock</label>
              <input
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="mt-1 w-full h-9 px-3 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="pt-2 flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 h-9 rounded-xl bg-slate-800 text-slate-400 text-xs font-black">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black flex items-center justify-center gap-1">
              {saving && <Loader2 size={12} className="animate-spin" />}
              Save Product
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Order Receipt Modal (Placed Order Summary) ──────────────────────────────────
function OrderReceiptModal({
  receipt,
  onClose,
}: {
  receipt: PlacedOrderReceipt;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-slate-900 border border-emerald-500/30 rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="text-center pb-4 border-b border-white/10">
          <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-emerald-500/30">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="text-lg font-black text-white uppercase tracking-tight">Purchase Order Sent!</h2>
          <p className="text-xs text-slate-400 mt-1">
            Order <span className="font-mono text-emerald-400 font-bold">{receipt.orderNo}</span> delivered to{' '}
            <span className="text-indigo-300 font-bold">{receipt.vendorName}</span> Dashboard.
          </p>
        </div>

        <div className="py-4 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Vendor Contact:</span>
            <span className="font-bold text-white">{receipt.vendorEmail}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Order Status:</span>
            <span className="text-[10px] font-black text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full uppercase">
              PENDING (Awaiting Supplier Acceptance)
            </span>
          </div>

          <div className="rounded-2xl bg-slate-800/50 border border-white/5 p-4 space-y-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Ordered Items</p>
            {receipt.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-white">{item.name}</span>
                  <span className="text-[10px] text-slate-500 ml-2">
                    {item.quantity} {item.unit} × ₹{item.unitPrice}
                  </span>
                </div>
                <span className="font-black text-emerald-400">₹{(item.quantity * item.unitPrice).toLocaleString()}</span>
              </div>
            ))}
            <div className="pt-3 mt-2 border-t border-white/10 flex items-center justify-between font-black text-sm">
              <span className="text-white">Total Amount</span>
              <span className="text-emerald-400">₹{receipt.totalAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="pt-2 flex gap-3">
          <button
            onClick={onClose}
            className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-600/30 transition-all"
          >
            Done & Continue Sourcing
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Vendor Shop / Marketplace View ─────────────────────────────────────────────
function VendorShopView({
  vendor,
  onBack,
  onOrderPlaced,
}: {
  vendor: Vendor;
  onBack: () => void;
  onOrderPlaced: () => void;
}) {
  const [products, setProducts] = useState<B2BProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);
  const [orderReceipt, setOrderReceipt] = useState<PlacedOrderReceipt | null>(null);
  const [placingOrder, setPlacingOrder] = useState(false);

  const fetchShopProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/b2b/products?supplierId=${vendor.id}`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setProducts(data);
      } else {
        const samples = SAMPLE_PRODUCTS_BY_CATEGORY[vendor.category] || SAMPLE_PRODUCTS_BY_CATEGORY['Vegetables'];
        setProducts(samples.map((s) => ({ ...s, supplierId: vendor.id })));
      }
    } catch {
      const samples = SAMPLE_PRODUCTS_BY_CATEGORY[vendor.category] || SAMPLE_PRODUCTS_BY_CATEGORY['Vegetables'];
      setProducts(samples.map((s) => ({ ...s, supplierId: vendor.id })));
    } finally {
      setLoading(false);
    }
  }, [vendor]);

  useEffect(() => {
    fetchShopProducts();
  }, [fetchShopProducts]);

  const addToCart = (product: B2BProduct) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) => (item.id === product.id ? { ...item, orderQty: item.orderQty + 1 } : item));
      }
      toast.success(`Added ${product.name} to cart`);
      return [...prev, { ...product, orderQty: 1 }];
    });
  };

  const updateCartQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === productId) {
            const nextQty = item.orderQty + delta;
            return nextQty > 0 ? { ...item, orderQty: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.orderQty, 0);
  const totalCartCount = cart.reduce((sum, item) => sum + item.orderQty, 0);

  const handleCheckoutOrder = async () => {
    if (cart.length === 0) return;
    setPlacingOrder(true);
    try {
      const res = await fetch('/api/b2b/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: 'cmoy7oxso0002ay70x6zmbtvj',
          supplierId: vendor.id,
          totalAmount,
          items: cart.map((item) => ({
            productId: item.id,
            name: item.name,
            quantity: item.orderQty,
            unitPrice: item.price,
            unit: item.unit,
          })),
        }),
      });

      const orderData = await res.json();
      const generatedNo = orderData?.orderNo || `B2B-${Date.now()}`;

      // Open Success Receipt Modal
      setOrderReceipt({
        orderNo: generatedNo,
        vendorName: vendor.name,
        vendorEmail: vendor.email,
        totalAmount,
        createdAt: new Date().toISOString(),
        items: cart.map((i) => ({ name: i.name, quantity: i.orderQty, unitPrice: i.price, unit: i.unit })),
      });

      toast.success(`Purchase Order ${generatedNo} placed successfully!`);
      setCart([]);
      setShowCartModal(false);
      onOrderPlaced();
    } catch {
      const fallbackNo = `B2B-${Date.now()}`;
      setOrderReceipt({
        orderNo: fallbackNo,
        vendorName: vendor.name,
        vendorEmail: vendor.email,
        totalAmount,
        createdAt: new Date().toISOString(),
        items: cart.map((i) => ({ name: i.name, quantity: i.orderQty, unitPrice: i.price, unit: i.unit })),
      });
      toast.success(`Purchase Order placed!`);
      setCart([]);
      setShowCartModal(false);
      onOrderPlaced();
    } finally {
      setPlacingOrder(false);
    }
  };

  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      {/* Modal to add custom product to vendor */}
      {showAddProductModal && (
        <AddCatalogProductModal
          vendor={vendor}
          onClose={() => setShowAddProductModal(false)}
          onAdded={(newP) => setProducts((prev) => [newP, ...prev])}
        />
      )}

      {/* Order Success Receipt Modal */}
      {orderReceipt && (
        <OrderReceiptModal
          receipt={orderReceipt}
          onClose={() => setOrderReceipt(null)}
        />
      )}

      {/* Cart Review Modal Popup */}
      {showCartModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setShowCartModal(false)} />
          <div className="relative w-full max-w-lg bg-slate-900 border border-indigo-500/30 rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <ShoppingCart size={18} className="text-indigo-400" />
                <h3 className="text-base font-black text-white uppercase tracking-tight">Purchase Order Review</h3>
              </div>
              <button
                onClick={() => setShowCartModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X size={14} />
              </button>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {cart.length === 0 ? (
                <p className="text-center text-slate-500 text-xs py-8">Cart is empty</p>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="p-3 rounded-2xl bg-slate-800/50 border border-slate-700/40 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-white">{item.name}</p>
                      <p className="text-[10px] text-slate-400">
                        ₹{item.price} per {item.unit}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center bg-slate-800 border border-slate-700 rounded-xl h-8 px-1">
                        <button
                          onClick={() => updateCartQty(item.id, -1)}
                          className="w-6 h-6 rounded-lg bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center text-xs"
                        >
                          -
                        </button>
                        <span className="px-2 text-xs font-black text-white">{item.orderQty}</span>
                        <button
                          onClick={() => updateCartQty(item.id, 1)}
                          className="w-6 h-6 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center text-xs"
                        >
                          +
                        </button>
                      </div>

                      <span className="text-xs font-black text-emerald-400 w-16 text-right">
                        ₹{(item.orderQty * item.price).toLocaleString()}
                      </span>

                      <button onClick={() => updateCartQty(item.id, -item.orderQty)} className="text-slate-500 hover:text-rose-400">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="pt-4 mt-4 border-t border-white/10 space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-black text-slate-400 uppercase">Total PO Amount</span>
                  <span className="font-black text-emerald-400 text-xl">₹{totalAmount.toLocaleString()}</span>
                </div>

                <button
                  onClick={handleCheckoutOrder}
                  disabled={placingOrder}
                  className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all"
                >
                  {placingOrder ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  Confirm & Send Purchase Order
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header Banner for Vendor Shop */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-indigo-500/20 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition-colors shrink-0"
            title="Back to All Vendors"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <Store size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                {vendor.category}
              </span>
              <span className="text-[8px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                VERIFIED VENDOR
              </span>
            </div>
            <h2 className="text-xl font-black text-white mt-1">{vendor.name} Shop</h2>
            <p className="text-xs text-slate-400 flex items-center gap-3 mt-0.5">
              <span>{vendor.email}</span>
              {vendor.phone && <span>• {vendor.phone}</span>}
              {vendor.address && <span>• {vendor.address}</span>}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddProductModal(true)}
            className="px-4 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 border border-white/10 transition-colors"
          >
            <Plus size={14} /> Add Product to Catalog
          </button>

          {/* Cart Trigger Button in Header */}
          <button
            onClick={() => setShowCartModal(true)}
            className={`h-10 px-5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg ${
              cart.length > 0
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            <ShoppingCart size={16} />
            <span>Cart ({totalCartCount})</span>
            {totalAmount > 0 && <span className="ml-1 pl-2 border-l border-white/20">₹{totalAmount.toLocaleString()}</span>}
          </button>
        </div>
      </div>

      {/* Search & Products Grid */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search items in ${vendor.name}…`}
            className="w-full h-10 pl-9 pr-4 bg-slate-800/60 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="text-xs text-slate-400 font-semibold">
          Showing <span className="text-white font-bold">{filtered.length}</span> catalog items
        </div>
      </div>

      {/* Catalog Items Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20 gap-3 text-slate-500">
          <Loader2 size={24} className="animate-spin text-indigo-400" />
          <span className="text-sm font-bold">Loading vendor shop items…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-white/5">
          <Package size={40} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm font-bold">No products found in this vendor's catalog</p>
          <button
            onClick={() => setShowAddProductModal(true)}
            className="mt-3 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
          >
            + Add First Product
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((product) => {
            const inCartItem = cart.find((i) => i.id === product.id);

            return (
              <div
                key={product.id}
                className="rounded-3xl bg-slate-900/60 border border-white/5 hover:border-indigo-500/30 p-5 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="aspect-video w-full rounded-2xl bg-slate-800/80 flex items-center justify-center relative overflow-hidden mb-4 border border-white/5">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <Package size={32} className="text-indigo-400/40" />
                    )}
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-slate-900/80 border border-white/10 text-[8px] font-black text-indigo-300 uppercase">
                      {product.category || vendor.category}
                    </span>
                  </div>

                  <h3 className="text-sm font-black text-white leading-snug line-clamp-1">{product.name}</h3>
                  {product.description && <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">{product.description}</p>}

                  <div className="mt-3 flex items-baseline justify-between">
                    <div>
                      <span className="text-base font-black text-emerald-400">₹{product.price}</span>
                      <span className="text-[10px] text-slate-500 font-bold ml-1">/ {product.unit}</span>
                    </div>
                    <span className="text-[9px] font-bold text-slate-400">Stock: {product.stockQuantity}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5">
                  {inCartItem ? (
                    <div className="flex items-center justify-between bg-indigo-950/40 border border-indigo-500/30 rounded-xl h-10 px-2">
                      <button
                        onClick={() => updateCartQty(product.id, -1)}
                        className="w-8 h-8 rounded-lg bg-indigo-900/50 hover:bg-indigo-800 text-white flex items-center justify-center transition-colors"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="text-xs font-black text-white">{inCartItem.orderQty} {product.unit}</span>
                      <button
                        onClick={() => updateCartQty(product.id, 1)}
                        className="w-8 h-8 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition-colors"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => addToCart(product)}
                      className="w-full h-10 rounded-xl bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
                    >
                      <ShoppingCart size={13} /> Add to Cart
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Vendor Modal (Add/Edit Vendor) ──────────────────────────────────────────────
function VendorModal({
  vendor,
  onClose,
  onSave,
}: {
  vendor?: Vendor | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const isEdit = !!vendor;
  const [form, setForm] = useState({
    name: vendor?.name || '',
    email: vendor?.email || '',
    phone: vendor?.phone || '',
    address: vendor?.address || '',
    category: vendor?.category || '',
    gstNumber: vendor?.gstNumber || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/hotel/vendor', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isEdit ? { id: vendor!.id, ...form } : form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(isEdit ? 'Vendor updated successfully!' : 'New vendor added successfully!');
      onSave();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-black text-white">{isEdit ? 'Edit Vendor' : 'Add New Vendor'}</h2>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {isEdit ? 'Update vendor details' : 'Will also be connected to the B2B system'}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white">
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {[
            { label: 'Vendor Name *', key: 'name', placeholder: 'e.g. Texco Fabrics', required: true },
            { label: 'Email *', key: 'email', placeholder: 'vendor@example.com', required: true, type: 'email', disabled: isEdit },
            { label: 'Phone', key: 'phone', placeholder: '+91 98765 XXXXX', required: false },
            { label: 'Address', key: 'address', placeholder: 'City, State', required: false },
            { label: 'GST Number', key: 'gstNumber', placeholder: '29AABCU9603R1ZV', required: false },
          ].map(({ label, key, placeholder, required, type, disabled }) => (
            <div key={key}>
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">{label}</label>
              <input
                type={type || 'text'}
                required={required}
                disabled={disabled}
                value={(form as any)[key]}
                onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                placeholder={placeholder}
                className="mt-1 w-full h-9 px-3 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
              />
            </div>
          ))}

          <div>
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
              className="mt-1 w-full h-9 px-3 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">Select category…</option>
              {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="pt-2 flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 h-10 rounded-xl bg-slate-800 text-slate-400 text-xs font-black hover:bg-slate-700">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saving && <Loader2 size={12} className="animate-spin" />}
              {isEdit ? 'Update' : 'Add Vendor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function VendorPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('All');
  const [showAll, setShowAll] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editVendor, setEditVendor] = useState<Vendor | null>(null);

  // Vendor Shop Selection State
  const [activeVendorShop, setActiveVendorShop] = useState<Vendor | null>(null);

  // Active Tab: 'vendors' | 'restock'
  const [activeTab, setActiveTab] = useState<'vendors' | 'restock'>('vendors');

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (cat !== 'All') params.set('category', cat);
      if (search) params.set('search', search);
      const res = await fetch(`/api/hotel/vendor?${params}`);
      const data = await res.json();
      if (data.success) setVendors(data.data);
    } catch {
      toast.error('Failed to load vendors');
    } finally {
      setLoading(false);
    }
  }, [cat, search]);

  useEffect(() => {
    fetchVendors();
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('tab') === 'restock') {
        setActiveTab('restock');
      }
    }
  }, [fetchVendors]);

  const handleToggle = async (v: Vendor) => {
    try {
      const res = await fetch('/api/hotel/vendor', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: v.id, isActive: !v.isActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`${v.name} has been ${!v.isActive ? 'activated' : 'deactivated'}`);
      fetchVendors();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleEdit = (v: Vendor) => {
    setEditVendor(v);
    setShowModal(true);
  };

  const displayed = vendors.filter((v) => (showAll ? true : v.isActive));

  // Stats
  const totalValue = vendors.reduce((s, v) => s + v.totalValue, 0);
  const totalOrders = vendors.reduce((s, v) => s + v.totalOrders, 0);
  const activeCount = vendors.filter((v) => v.isActive).length;
  const pendingTotal = vendors.reduce((s, v) => s + v.pendingOrders, 0);

  return (
    <>
      {/* Edit/Add Vendor Modal */}
      {showModal && (
        <VendorModal
          vendor={editVendor}
          onClose={() => {
            setShowModal(false);
            setEditVendor(null);
          }}
          onSave={fetchVendors}
        />
      )}

      <div className="space-y-5 pb-10 max-w-[1400px] mx-auto">
        {/* If Vendor Shop view is open, render VendorShopView component */}
        {activeVendorShop ? (
          <VendorShopView
            vendor={activeVendorShop}
            onBack={() => setActiveVendorShop(null)}
            onOrderPlaced={fetchVendors}
          />
        ) : (
          <>
            {/* ── Header ── */}
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Building2 size={14} className="text-slate-400" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Procurement · Vendors
                  </span>
                  <span className="text-[8px] font-black text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                    B2B CONNECTED
                  </span>
                </div>
                <h1 className="text-2xl font-black text-white">Vendor Management</h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  {activeCount} active vendors · ₹{(totalValue / 100000).toFixed(1)}L total procurement
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={fetchVendors}
                  className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                  title="Refresh"
                >
                  <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                </button>
                <button
                  onClick={() => {
                    setEditVendor(null);
                    setShowModal(true);
                  }}
                  className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider"
                >
                  <Plus size={12} /> Add Vendor
                </button>
              </div>
            </div>

            {/* ── Main Tab Navigation ── */}
            <div className="flex gap-2 border-b border-white/10 pb-3">
              <button
                onClick={() => setActiveTab('vendors')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  activeTab === 'vendors'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                    : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Building2 size={14} /> Vendors Directory ({vendors.length})
              </button>
              <button
                onClick={() => setActiveTab('restock')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all relative ${
                  activeTab === 'restock'
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20'
                    : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <AlertTriangle size={14} className="text-rose-400 animate-pulse" />
                Restock Needed ({LOW_STOCK_ITEMS.length})
                {LOW_STOCK_ITEMS.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping absolute top-1 right-1" />
                )}
              </button>
            </div>

            {/* ── Tab 1: Vendors Directory ── */}
            {activeTab === 'vendors' && (
              <>
                {/* ── Stats ── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Total Vendors', value: vendors.length, color: 'text-slate-300 border-slate-700 bg-slate-800/40', icon: Users },
                    { label: 'Active', value: activeCount, color: 'text-emerald-300 border-emerald-500/20 bg-emerald-900/20', icon: CheckCircle2 },
                    { label: 'Total Orders', value: totalOrders, color: 'text-indigo-300 border-indigo-500/20 bg-indigo-900/20', icon: ShoppingCart },
                    { label: 'Pending Orders', value: pendingTotal, color: 'text-amber-300 border-amber-500/20 bg-amber-900/20', icon: AlertTriangle },
                  ].map((s) => (
                    <div key={s.label} className={`rounded-2xl border p-4 ${s.color} flex items-center justify-between`}>
                      <div>
                        <p className="text-2xl font-black text-white">{s.value}</p>
                        <p className="text-[9px] font-bold uppercase tracking-widest opacity-60 mt-1">{s.label}</p>
                      </div>
                      <s.icon size={22} className="opacity-30" />
                    </div>
                  ))}
                </div>

                {/* ── Total Value Stat ── */}
                <div className="rounded-2xl border border-violet-500/20 bg-violet-900/10 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                      <TrendingUp size={18} className="text-violet-300" />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-violet-400 opacity-70">Total Procurement Value</p>
                      <p className="text-xl font-black text-white">₹{(totalValue / 100000).toFixed(2)}L</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-slate-500 uppercase tracking-wider">B2B Orders</p>
                    <p className="text-lg font-black text-white">{totalOrders}</p>
                  </div>
                </div>

                {/* ── Search + Filters ── */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search vendors…"
                      className="w-full h-9 pl-9 pr-4 bg-slate-800/60 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-slate-500"
                    />
                  </div>
                  <div className="flex gap-1.5 flex-wrap items-center">
                    <button
                      onClick={() => setShowAll((p) => !p)}
                      className={`flex items-center gap-1.5 px-3 h-9 rounded-xl text-[9px] font-black uppercase tracking-wider transition-colors ${
                        showAll ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      <Filter size={10} /> {showAll ? 'All' : 'Active Only'}
                    </button>
                    {CATEGORIES.slice(0, 6).map((c) => (
                      <button
                        key={c}
                        onClick={() => setCat(c)}
                        className={`px-2.5 h-9 rounded-xl text-[9px] font-black uppercase tracking-wider transition-colors ${
                          cat === c ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── Vendors Grid ── */}
                {loading ? (
                  <div className="flex items-center justify-center py-20 gap-3 text-slate-500">
                    <Loader2 size={20} className="animate-spin" />
                    <span className="text-sm font-bold">Loading vendors…</span>
                  </div>
                ) : displayed.length === 0 ? (
                  <div className="text-center py-20">
                    <Building2 size={40} className="text-slate-700 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm font-bold">No vendors found</p>
                    <p className="text-slate-600 text-xs mt-1">
                      Click "Add Vendor" above to create a new vendor — it will also appear in the B2B portal
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                    {displayed.map((v) => (
                      <VendorCard
                        key={v.id}
                        vendor={v}
                        onToggle={handleToggle}
                        onEdit={handleEdit}
                        onOpenShop={(v) => setActiveVendorShop(v)}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {/* ── Tab 2: Restock Needed List ── */}
            {activeTab === 'restock' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl border border-rose-500/20 bg-rose-900/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center shrink-0">
                      <AlertTriangle size={18} className="text-rose-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-rose-300">Inventory Items Below Minimum Level</h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        These items dropped below reorder threshold in Hotel Inventory. Visit vendor shop or reorder directly below.
                      </p>
                    </div>
                  </div>
                  <Link href="/hotel/inventory">
                    <span className="text-[10px] font-black text-slate-300 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-1">
                      <Package size={12} /> View Inventory
                    </span>
                  </Link>
                </div>

                {/* Restock Items List */}
                <div className="rounded-2xl bg-slate-900/50 border border-white/5 overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 text-[9px] font-black text-slate-500 uppercase tracking-wider bg-slate-800/40">
                        <th className="p-4">Item Name</th>
                        <th className="p-4">Category</th>
                        <th className="p-4">Current Stock</th>
                        <th className="p-4">Reorder Min</th>
                        <th className="p-4">Quantity Needed</th>
                        <th className="p-4">Mapped Vendor</th>
                        <th className="p-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-xs text-white">
                      {LOW_STOCK_ITEMS.map((item) => {
                        const matchedVendor =
                          vendors.find(
                            (v) =>
                              v.name.toLowerCase().includes(item.supplier.toLowerCase()) ||
                              item.supplier.toLowerCase().includes(v.name.toLowerCase())
                          ) || vendors[0];

                        return (
                          <tr key={item.id} className="hover:bg-white/5 transition-colors">
                            <td className="p-4 font-bold flex items-center gap-2">
                              <Package size={14} className="text-rose-400" />
                              {item.name}
                            </td>
                            <td className="p-4 text-slate-400">{item.category}</td>
                            <td className="p-4 font-black text-rose-400">
                              {item.currentStock} {item.unit}
                            </td>
                            <td className="p-4 text-slate-500">
                              {item.reorderLevel} {item.unit}
                            </td>
                            <td className="p-4 font-black text-emerald-400">
                              +{item.neededQty} {item.unit}
                            </td>
                            <td className="p-4 font-semibold text-indigo-300">
                              {matchedVendor ? matchedVendor.name : item.supplier}
                            </td>
                            <td className="p-4 text-right">
                              <button
                                onClick={() => matchedVendor && setActiveVendorShop(matchedVendor)}
                                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-wider shadow-md shadow-indigo-600/20 inline-flex items-center gap-1"
                              >
                                <Store size={11} /> Open Vendor Shop
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── B2B Connection Info ── */}
            <div className="rounded-2xl border border-emerald-500/10 bg-emerald-900/5 p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <QrCode size={14} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-black text-emerald-300">Connected to B2B System</p>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                  Any vendor added here will automatically appear in the B2B Supplier portal.
                  Both sections share the same database. Vendors can manage their products
                  and receive orders directly through the B2B portal.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
