'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Tag,
  Plus,
  Package,
  Search,
  Loader2,
  RefreshCw,
  X,
  Edit3,
  Trash2,
  TrendingUp,
  Boxes,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Utensils,
  Coffee,
  Shirt,
  DollarSign,
  Barcode,
  Layers,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';

interface ProductItem {
  id: string;
  name: string;
  sku?: string | null;
  barcode?: string | null;
  productType: string;
  costPrice: number;
  sellingPrice: number;
  unit?: string | null;
  hsnCode?: string | null;
  description?: string | null;
  isVeg: boolean;
  isActive: boolean;
  category?: {
    id: string;
    name: string;
  } | null;
}

const TYPE_BADGES: Record<string, { bg: string; text: string; border: string; icon: React.ReactNode }> = {
  LINEN:        { bg: 'bg-indigo-500/10',  text: 'text-indigo-400',  border: 'border-indigo-500/20',  icon: <Shirt size={14} /> },
  TOILETRIES:   { bg: 'bg-cyan-500/10',    text: 'text-cyan-400',    border: 'border-cyan-500/20',    icon: <Sparkles size={14} /> },
  BEVERAGE:     { bg: 'bg-sky-500/10',     text: 'text-sky-400',     border: 'border-sky-500/20',     icon: <Coffee size={14} /> },
  SNACKS:       { bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/20',   icon: <Package size={14} /> },
  FOOD:         { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', icon: <Utensils size={14} /> },
  HOUSEKEEPING: { bg: 'bg-purple-500/10',  text: 'text-purple-400',  border: 'border-purple-500/20',  icon: <Boxes size={14} /> },
  STATIONERY:   { bg: 'bg-rose-500/10',    text: 'text-rose-400',    border: 'border-rose-500/20',    icon: <Layers size={14} /> },
};

const DEFAULT_PRODUCTS: ProductItem[] = [
  {
    id: 'p-1',
    name: 'Bath Towel (Large Luxury 600 GSM)',
    sku: 'LNN-TOWEL-01',
    barcode: '8901001001',
    productType: 'LINEN',
    costPrice: 350,
    sellingPrice: 850,
    unit: 'Pcs',
    hsnCode: '6302',
    description: 'White combed cotton luxury hotel bath towel',
    isVeg: true,
    isActive: true,
    category: { id: 'c1', name: 'Linen & Fabrics' }
  },
  {
    id: 'p-2',
    name: 'King Size Premium Bed Sheet Set',
    sku: 'LNN-SHEET-02',
    barcode: '8901001002',
    productType: 'LINEN',
    costPrice: 750,
    sellingPrice: 1800,
    unit: 'Set',
    hsnCode: '6302',
    description: '300 TC Satin stripe king size fitted sheet',
    isVeg: true,
    isActive: true,
    category: { id: 'c1', name: 'Linen & Fabrics' }
  },
  {
    id: 'p-3',
    name: 'Herbal Body Wash & Shampoo (30ml)',
    sku: 'TLT-SHAMPOO-01',
    barcode: '8901002001',
    productType: 'TOILETRIES',
    costPrice: 18,
    sellingPrice: 50,
    unit: 'Bottle',
    hsnCode: '3401',
    description: 'Eco-friendly organic herbal hotel shampoo sachet',
    isVeg: true,
    isActive: true,
    category: { id: 'c2', name: 'Toiletries & Amenities' }
  },
  {
    id: 'p-4',
    name: 'Premium Basmati Mineral Water (1L)',
    sku: 'FNB-WATER-01',
    barcode: '8901003001',
    productType: 'BEVERAGE',
    costPrice: 12,
    sellingPrice: 40,
    unit: 'Bottle',
    hsnCode: '2201',
    description: 'Natural mountain spring water in glass bottle',
    isVeg: true,
    isActive: true,
    category: { id: 'c3', name: 'Food & Beverage' }
  },
  {
    id: 'p-5',
    name: 'Roasted Almonds & Cashew Gourmet Pack',
    sku: 'MNB-NUTS-01',
    barcode: '8901004001',
    productType: 'SNACKS',
    costPrice: 65,
    sellingPrice: 180,
    unit: 'Pack',
    hsnCode: '2008',
    description: 'Salted dry roasted mixed nuts for room minibar',
    isVeg: true,
    isActive: true,
    category: { id: 'c4', name: 'Minibar & Snacks' }
  },
  {
    id: 'p-6',
    name: 'Multi-Surface Disinfectant Floor Cleaner (5L)',
    sku: 'HKP-CLEANER-01',
    barcode: '8901005001',
    productType: 'HOUSEKEEPING',
    costPrice: 130,
    sellingPrice: 320,
    unit: 'Can',
    hsnCode: '3402',
    description: 'Concentrated citrus lavender surface sanitizer',
    isVeg: true,
    isActive: true,
    category: { id: 'c5', name: 'Housekeeping & Cleaning' }
  },
];

export default function HotelProductsPage() {
  const [products, setProducts] = useState<ProductItem[]>(DEFAULT_PRODUCTS);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedType, setSelectedType] = useState('All');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [categoryName, setCategoryName] = useState('General Products');
  const [productType, setProductType] = useState('GENERAL');
  const [sellingPrice, setSellingPrice] = useState('100');
  const [costPrice, setCostPrice] = useState('40');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [unit, setUnit] = useState('Pcs');
  const [hsnCode, setHsnCode] = useState('');
  const [description, setDescription] = useState('');
  const [isVeg, setIsVeg] = useState(true);
  const [isActive, setIsActive] = useState(true);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hotel/products');
      const data = await res.json();
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        setProducts(data.data);
      } else {
        setProducts(DEFAULT_PRODUCTS);
      }
    } catch {
      setProducts(DEFAULT_PRODUCTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openCreateModal = () => {
    setEditingProduct(null);
    setName('');
    setCategoryName('General Products');
    setProductType('GENERAL');
    setSellingPrice('100');
    setCostPrice('40');
    setSku(`SKU-${Date.now().toString().slice(-5)}`);
    setBarcode('');
    setUnit('Pcs');
    setHsnCode('');
    setDescription('');
    setIsVeg(true);
    setIsActive(true);
    setShowModal(true);
  };

  const openEditModal = (prod: ProductItem) => {
    setEditingProduct(prod);
    setName(prod.name);
    setCategoryName(prod.category?.name || 'General Products');
    setProductType(prod.productType || 'GENERAL');
    setSellingPrice(prod.sellingPrice.toString());
    setCostPrice(prod.costPrice.toString());
    setSku(prod.sku || '');
    setBarcode(prod.barcode || '');
    setUnit(prod.unit || 'Pcs');
    setHsnCode(prod.hsnCode || '');
    setDescription(prod.description || '');
    setIsVeg(prod.isVeg);
    setIsActive(prod.isActive);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || sellingPrice === undefined) {
      toast.error('Product Name and Selling Price are required.');
      return;
    }

    setSaving(true);
    try {
      const isEdit = !!editingProduct;
      const method = isEdit ? 'PATCH' : 'POST';
      const payload = {
        ...(isEdit ? { id: editingProduct.id } : {}),
        name,
        categoryName,
        productType,
        sellingPrice: Number(sellingPrice),
        costPrice: Number(costPrice),
        sku,
        barcode,
        unit,
        hsnCode,
        description,
        isVeg,
        isActive,
      };

      const res = await fetch('/api/hotel/products', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(isEdit ? 'Product updated successfully!' : 'New product created successfully!');
        setShowModal(false);
        fetchProducts();
      } else {
        toast.error(data.message || 'Failed to save product.');
      }
    } catch {
      toast.error('Connection error saving product.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, prodName: string) => {
    if (!confirm(`Are you sure you want to delete "${prodName}"?`)) return;
    try {
      const res = await fetch(`/api/hotel/products?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success(`"${prodName}" deleted successfully.`);
        fetchProducts();
      } else {
        toast.error(data.message || 'Failed to delete product.');
      }
    } catch {
      toast.error('Error deleting product.');
    }
  };

  const toggleStatus = async (prod: ProductItem) => {
    try {
      const res = await fetch('/api/hotel/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: prod.id, isActive: !prod.isActive }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Product status updated.`);
        fetchProducts();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error('Failed to update status.');
    }
  };

  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = p.name.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q)) || (p.hsnCode && p.hsnCode.includes(q));
    const matchesCat = selectedCategory === 'All' || (p.category && p.category.name === selectedCategory);
    const matchesType = selectedType === 'All' || p.productType === selectedType;
    return matchesSearch && matchesCat && matchesType;
  });

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category?.name).filter(Boolean) as string[]))];
  const productTypes = ['All', 'LINEN', 'TOILETRIES', 'BEVERAGE', 'SNACKS', 'FOOD', 'HOUSEKEEPING', 'STATIONERY'];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-black uppercase tracking-widest">
            <Tag size={16} /> Product Master & Catalog
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight mt-1">Products Catalog</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure master products, cost prices, selling rates, SKUs, units, and inventory categories.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={fetchProducts}
            className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            title="Refresh Catalog"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          
          <Link
            href="/hotel/inventory"
            className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 font-bold text-xs transition-all flex items-center gap-1.5"
          >
            <Package size={16} /> Inventory Stock Board
          </Link>

          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-955 font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer"
          >
            <Plus size={16} /> Add Product
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-[#0f172a]/50 border border-emerald-500/20 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400">
            <Tag size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Catalog Products</p>
            <h3 className="text-xl font-black text-emerald-300 mt-0.5">{products.length} Products</h3>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-[#0f172a]/50 border border-indigo-500/20 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active In Stock</p>
            <h3 className="text-xl font-black text-indigo-300 mt-0.5">{products.filter(p => p.isActive).length} Active</h3>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-[#0f172a]/50 border border-amber-500/20 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Profit Margin</p>
            <h3 className="text-xl font-black text-amber-300 mt-0.5">
              +{Math.round(products.reduce((acc, p) => acc + ((p.sellingPrice - p.costPrice) / (p.costPrice || 1)) * 100, 0) / (products.length || 1))}%
            </h3>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-[#0f172a]/50 border border-purple-500/20 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400">
            <Boxes size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Product Categories</p>
            <h3 className="text-xl font-black text-purple-300 mt-0.5">{categories.length - 1} Categories</h3>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#0f172a]/40 p-4 rounded-3xl border border-slate-800/80">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3.5 top-3.5 text-slate-500" size={16} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Product name, SKU, or HSN Code..."
            className="w-full pl-11 pr-4 py-2.5 rounded-2xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-800 bg-slate-950 text-slate-200 text-xs focus:outline-none"
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>
            ))}
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-800 bg-slate-950 text-slate-200 text-xs focus:outline-none"
          >
            {productTypes.map((t) => (
              <option key={t} value={t}>{t === 'All' ? 'All Product Types' : t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Products Grid */}
      {loading ? (
        <div className="h-[30vh] flex items-center justify-center">
          <div className="text-center space-y-2">
            <Loader2 className="animate-spin text-emerald-400 mx-auto" size={32} />
            <p className="text-xs text-slate-500">Loading catalog products...</p>
          </div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[#0f172a]/30 border border-slate-800/80 space-y-3">
          <Tag className="text-slate-600 mx-auto" size={40} />
          <h3 className="text-base font-bold text-slate-300">No Products Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Click "Add Product" above to create your first catalog item.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((prod) => {
            const badgeStyle = TYPE_BADGES[prod.productType] || TYPE_BADGES.LINEN;
            const marginPct = prod.costPrice > 0 ? Math.round(((prod.sellingPrice - prod.costPrice) / prod.costPrice) * 100) : 100;

            return (
              <div
                key={prod.id}
                className={`p-6 rounded-3xl bg-[#0f172a]/60 border transition-all hover:border-slate-700 flex flex-col justify-between space-y-5 relative overflow-hidden ${
                  prod.isActive ? 'border-slate-800/80' : 'border-slate-800/40 opacity-60'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}>
                      {badgeStyle.icon} {prod.productType}
                    </span>

                    <button
                      onClick={() => toggleStatus(prod)}
                      className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider cursor-pointer border transition-all ${
                        prod.isActive 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' 
                          : 'bg-slate-800 text-slate-500 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {prod.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </div>

                  <div>
                    <h3 className="text-base font-black text-white tracking-tight">{prod.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{prod.category?.name || 'General Products'}</p>
                  </div>

                  {/* Pricing Details */}
                  <div className="p-4 rounded-2xl bg-slate-955 border border-slate-800/80 grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Cost Price</p>
                      <p className="text-sm font-black text-slate-300 mt-0.5">₹{prod.costPrice.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Selling Rate</p>
                      <p className="text-sm font-black text-emerald-400 mt-0.5">₹{prod.sellingPrice.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Specifications Badges */}
                  <div className="flex flex-wrap gap-2 text-[10px] font-bold">
                    {prod.sku && (
                      <span className="px-2.5 py-1 rounded-xl bg-slate-900 text-slate-400 border border-slate-800 flex items-center gap-1">
                        <Barcode size={12} className="text-slate-500" /> {prod.sku}
                      </span>
                    )}
                    <span className="px-2.5 py-1 rounded-xl bg-slate-900 text-slate-400 border border-slate-800">
                      Unit: {prod.unit || 'Pcs'}
                    </span>
                    <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      +{marginPct}% Margin
                    </span>
                  </div>

                  {prod.description && (
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{prod.description}</p>
                  )}
                </div>

                {/* Footer Action Buttons */}
                <div className="flex items-center justify-between border-t border-slate-800/60 pt-4 mt-2">
                  <span className="text-[9px] text-slate-500 font-mono">HSN: {prod.hsnCode || 'N/A'}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(prod)}
                      className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white transition-all text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 size={13} /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(prod.id, prod.name)}
                      className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Add / Edit Product Modal ────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/90 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
          <div className="relative bg-[#0f172a] border border-slate-700/60 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/60">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <Tag size={18} />
                </span>
                <h3 className="font-black text-white text-sm uppercase tracking-wider">
                  {editingProduct ? 'Edit Catalog Product' : 'Add New Product'}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-800/60 flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Product Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Bath Towel 600 GSM, Mineral Water 1L"
                  className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-955 text-slate-100 text-xs focus:outline-none focus:border-emerald-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Category Name</label>
                  <input
                    type="text"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    placeholder="Linen, Toiletries, F&B, Minibar"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-955 text-slate-100 text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Product Type</label>
                  <select
                    value={productType}
                    onChange={(e) => setProductType(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-800 bg-slate-955 text-slate-100 text-xs focus:outline-none font-semibold"
                  >
                    <option value="GENERAL">General Product</option>
                    <option value="LINEN">Linen & Fabrics</option>
                    <option value="TOILETRIES">Toiletries & Amenities</option>
                    <option value="BEVERAGE">Beverages</option>
                    <option value="SNACKS">Minibar Snacks</option>
                    <option value="FOOD">Food & Kitchen</option>
                    <option value="HOUSEKEEPING">Housekeeping Supplies</option>
                    <option value="STATIONERY">Office & Stationery</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Cost Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-955 text-slate-100 font-mono text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Selling Price (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-955 text-emerald-400 font-mono font-bold text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">SKU Code</label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="LNN-001"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-800 bg-slate-955 text-slate-100 text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Measurement Unit</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-800 bg-slate-955 text-slate-100 text-xs focus:outline-none"
                  >
                    <option value="Pcs">Pcs</option>
                    <option value="Set">Set</option>
                    <option value="Bottle">Bottle</option>
                    <option value="Pack">Pack</option>
                    <option value="Kg">Kg</option>
                    <option value="Litre">Litre</option>
                    <option value="Can">Can</option>
                    <option value="Ream">Ream</option>
                    <option value="Box">Box</option>
                    <option value="Kit">Kit</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">HSN Code</label>
                  <input
                    type="text"
                    value={hsnCode}
                    onChange={(e) => setHsnCode(e.target.value)}
                    placeholder="6302"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-800 bg-slate-955 text-slate-100 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Product Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed specifications, material, or usage instructions..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-955 text-slate-100 text-xs focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-xs font-bold text-slate-300">Active Catalog Item</span>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer ${
                    isActive ? 'bg-emerald-500 text-slate-955' : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {isActive ? 'Active' : 'Inactive'}
                </button>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-955 font-black transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {saving ? <Loader2 className="animate-spin" size={14} /> : editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
