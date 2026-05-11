'use client';

import React, { useState, useEffect } from 'react';
import { Filter, Package, Tag, Edit, Trash2, Plus, ChevronDown, Layers } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { SearchToolbar } from '@/components/shared/search-toolbar';
import { DataTable } from '@/components/shared/data-table';
import { Button } from '@/components/ui/Button';
import { productsApi, Product } from '@/lib/api/products';
import { Building2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { RestaurantProductForm } from '@/components/forms/restaurant-product-form';
import { BarProductForm } from '@/components/forms/bar-product-form';
import { ComboForm } from '@/components/forms/combo-form';
import { combosApi, Combo } from '@/lib/api/combos';
import { ConfirmDeleteModal } from '@/components/modals/confirm-delete-modal';
import { ProductIcon } from '@/components/shared/product-icon';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [mutationLoading, setMutationLoading] = useState(false);
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('all');
  const [session, setSession] = useState<any>(null);
  const [isBulkTaxOpen, setIsBulkTaxOpen] = useState(false);
  const [selectedTaxType, setSelectedTaxType] = useState('EXCLUSIVE');
  const [selectedMenuTypeFilter, setSelectedMenuTypeFilter] = useState('all');
  const [activeFormType, setActiveFormType] = useState<'RESTAURANT' | 'BAR' | 'COMBO'>('RESTAURANT');
  const [combos, setCombos] = useState<Combo[]>([]);
  const [isComboDeleteOpen, setIsComboDeleteOpen] = useState(false);
  const [selectedCombo, setSelectedCombo] = useState<Combo | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await productsApi.list(selectedPropertyId === 'all' ? undefined : selectedPropertyId);
      setProducts(data || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCombos = async () => {
    try {
      const data = await combosApi.list(selectedPropertyId === 'all' ? undefined : selectedPropertyId);
      setCombos(data || []);
    } catch (error) {
      console.error('Failed to fetch combos:', error);
    }
  };

  const fetchProperties = async () => {
    try {
      const res = await fetch('/api/admin/properties');
      const data = await res.json();
      if (data.success) setProperties(data.data);
    } catch (err) {
      console.error('Failed to fetch properties:', err);
    }
  };

  useEffect(() => {
    fetchProperties();
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) setSession(data.user);
      })
      .catch(err => console.error('Failed to fetch session', err));
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchCombos();
  }, [selectedPropertyId]);

  const handleCreateOrUpdate = async (data: Partial<Product>) => {
    setMutationLoading(true);
    try {
      if (selectedProduct) {
        await productsApi.update(selectedProduct.id, data);
      } else {
        await productsApi.create(data);
      }
      setIsFormOpen(false);
      fetchProducts();
    } catch (error) {
      console.error('Operation failed:', error);
    } finally {
      setMutationLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedProduct) return;
    setMutationLoading(true);
    try {
      await productsApi.delete(selectedProduct.id);
      setIsDeleteOpen(false);
      fetchProducts();
    } catch (error: any) {
      console.error('Delete failed:', error);
      alert(error.message || 'Failed to delete product. It might have sales history.');
    } finally {
      setMutationLoading(false);
    }
  };

  const handleCreateOrUpdateCombo = async (data: Partial<Combo>) => {
    setMutationLoading(true);
    try {
      if (selectedCombo) {
        await combosApi.update(selectedCombo.id, data);
      } else {
        await combosApi.create(data);
      }
      setIsFormOpen(false);
      fetchCombos();
    } catch (error) {
      console.error('Combo operation failed:', error);
    } finally {
      setMutationLoading(false);
    }
  };

  const handleComboDelete = async () => {
    if (!selectedCombo) return;
    setMutationLoading(true);
    try {
      await combosApi.delete(selectedCombo.id);
      setIsComboDeleteOpen(false);
      fetchCombos();
    } catch (error: any) {
      console.error('Combo delete failed:', error);
      alert('Failed to delete combo');
    } finally {
      setMutationLoading(false);
    }
  };


  const handleBulkTaxUpdate = async () => {
    if (!confirm('This will update the tax type for ALL products in this property. This action cannot be undone. Proceed?')) return;

    setMutationLoading(true);
    try {
      await productsApi.bulkUpdateTaxType(selectedTaxType);
      setIsBulkTaxOpen(false);
      fetchProducts();
      alert('All products updated successfully');
    } catch (error) {
      console.error('Bulk update failed:', error);
      alert('Failed to update products');
    } finally {
      setMutationLoading(false);
    }
  };

  const filteredProducts = (products || []).filter((p: Product) => {
    const searchLower = search.toLowerCase();
    return (
      (p.name.toLowerCase().includes(searchLower) ||
        (p.sku || '').toLowerCase().includes(searchLower) ||
        (p.category?.name || '').toLowerCase().includes(searchLower)) &&
      (selectedMenuTypeFilter === 'all' || p.menuType === selectedMenuTypeFilter)
    );
  });

  const filteredCombos = (combos || []).filter((c: Combo) => {
    return c.name.toLowerCase().includes(search.toLowerCase());
  });


  const columns = [
    {
      header: 'Code/SKU',
      cell: (row: Product) => (
        <span className="font-mono text-[10px] font-black text-gray-400">
          {row.sku ? `#${row.sku}` : '---'}
        </span>
      ),
      width: '120px'
    },
    {
      header: 'Product Detail',
      cell: (row: Product) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700 flex items-center justify-center overflow-hidden text-orange-600">
            {row.image ? (
              <img src={row.image} alt={row.name} className="w-full h-full object-cover" />
            ) : (
              <ProductIcon productName={row.name} categoryName={row.category?.name} size={16} className="opacity-40" />
            )}
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-tight">
              {row.name}
            </span>
            <div className="flex items-center gap-1.5 grayscale opacity-50">
              <Tag size={10} />
              <span className="text-[10px] font-bold uppercase tracking-widest">{row.category?.name || 'Uncategorized'}</span>
              {row.hsnCode && (
                <>
                  <span className="mx-1 text-gray-300">•</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-pos-primary">HSN: {row.hsnCode}</span>
                </>
              )}
              {row.taxRate !== null && row.taxRate !== undefined && (
                <>
                  <span className="mx-1 text-gray-300">•</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-orange-600">GST: {row.taxRate}%</span>
                </>
              )}
              {row.taxType && (
                <>
                  <span className="mx-1 text-gray-300">•</span>
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${row.taxType === 'INCLUSIVE' ? 'bg-indigo-50 text-indigo-600' :
                    row.taxType === 'EXCLUSIVE' ? 'bg-blue-50 text-blue-600' :
                      'bg-slate-100 text-slate-500'
                    }`}>
                    {row.taxType}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      ),
      width: '350px'
    },
    {
      header: 'Property',
      cell: (row: any) => (
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-pos-primary uppercase tracking-widest bg-pos-primary/5 dark:bg-pos-primary/20 px-2 py-1 rounded-md border border-pos-primary/10 dark:border-pos-primary/30 inline-block w-fit">
            {row.property?.name || 'Main Branch'}
          </span>
          <span className="text-[9px] text-gray-400 dark:text-slate-500 font-bold uppercase mt-1">{row.property?.city}</span>
        </div>
      ),
      width: '180px'
    },
    {
      header: 'Pricing',
      cell: (row: Product) => (
        <div className="flex flex-col">
          <span className="text-sm font-black text-gray-900 dark:text-white">₹{row.sellingPrice.toFixed(2)}</span>
          {row.costPrice > 0 && (
            <span className="text-[10px] text-gray-400 font-medium">Cost: ₹{row.costPrice.toFixed(2)}</span>
          )}
        </div>
      ),
      width: '150px'
    },
    {
      header: 'Menu Type',
      cell: (row: Product) => (
        <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${row.menuType === 'BAR'
          ? 'bg-amber-50 text-amber-600 border-amber-100'
          : 'bg-indigo-50 text-indigo-600 border-indigo-100'
          }`}>
          {row.menuType || 'RESTAURANT'}
        </span>
      ),
      width: '120px'
    },
    {
      header: 'Status',
      cell: (row: Product) => (
        <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${row.isActive !== false ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-400'
          }`}>
          {row.isActive !== false ? 'Active' : 'Inactive'}
        </span>
      ),
      width: '120px'
    },
    {
      header: 'Actions',
      cell: (row: Product) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSelectedProduct(row);
              setActiveFormType(row.menuType === 'BAR' ? 'BAR' : 'RESTAURANT');
              setIsFormOpen(true);
            }}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg text-gray-400 hover:text-pos-primary dark:hover:text-pos-primary/70 transition-colors"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => {
              setSelectedProduct(row);
              setIsDeleteOpen(true);
            }}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
      width: '100px'
    },
  ];

  const comboColumns = [
    {
      header: 'Combo Detail',
      cell: (row: Combo) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/30 flex items-center justify-center overflow-hidden text-orange-600">
            {row.image ? (
              <img src={row.image} alt={row.name} className="w-full h-full object-cover" />
            ) : (
              <Package size={20} />
            )}
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-tight">
              {row.name}
            </span>
            <div className="flex items-center gap-1.5 opacity-60">
              <span className="text-[10px] font-bold uppercase tracking-widest text-orange-600">
                {row.items?.length || 0} PRODUCTS INCLUDED
              </span>
            </div>
          </div>
        </div>
      ),
      width: '400px'
    },
    {
      header: 'Price',
      cell: (row: Combo) => (
        <span className="text-sm font-black text-gray-900 dark:text-white">₹{row.price.toFixed(2)}</span>
      ),
      width: '150px'
    },
    {
      header: 'Status',
      cell: (row: Combo) => (
        <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${row.isActive !== false ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-400'
          }`}>
          {row.isActive !== false ? 'Active' : 'Inactive'}
        </span>
      ),
      width: '120px'
    },
    {
      header: 'Actions',
      cell: (row: Combo) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSelectedCombo(row);
              setActiveFormType('COMBO');
              setIsFormOpen(true);
            }}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg text-gray-400 hover:text-orange-600 transition-colors"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => {
              setSelectedCombo(row);
              setIsComboDeleteOpen(true);
            }}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg text-gray-400 hover:text-red-600 transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
      width: '100px'
    },
  ];


  // AI Modal states
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scannedData, setScannedData] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [includeTax, setIncludeTax] = useState(true);
  const [includeHsn, setIncludeHsn] = useState(true);
  const [aiMenuType, setAiMenuType] = useState<'RESTAURANT' | 'BAR'>('RESTAURANT');

  const handleAiScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setScanning(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('includeTax', String(includeTax));
      formData.append('includeHsn', String(includeHsn));

      const res = await fetch('/api/ai/scan-menu', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setScannedData(data.data);
      } else {
        alert(data.error || 'Failed to scan menu');
      }
    } catch (error) {
      console.error('Scan failed:', error);
      alert('An error occurred during scanning');
    } finally {
      setScanning(false);
    }
  };

  const handleSaveScannedData = async () => {
    if (!scannedData) return;
    setMutationLoading(true);
    try {
      const res = await fetch('/api/ai/scan-menu/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categories: scannedData.categories,
          menuType: aiMenuType
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsAiModalOpen(false);
        setScannedData(null);
        setFile(null);
        fetchProducts(); // Refresh list
      } else {
        alert(data.error || 'Failed to save items');
      }
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setMutationLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Products"
        subtitle="Manage your restaurant menu items"
        showBack
        backUrl="/operations"
        actions={
          <div className="flex gap-2">
            <Button
              onClick={() => setIsAiModalOpen(true)}
              variant="secondary"
              className="font-black text-[9px] tracking-widest px-3 py-2 rounded-lg border border-gray-200"
            >
              MINT AI SCAN
            </Button>
            <Button
              onClick={() => setIsBulkTaxOpen(true)}
              variant="secondary"
              className="font-black text-[9px] tracking-widest px-3 py-2 rounded-lg border border-gray-200 bg-amber-50 text-amber-600 border-amber-100"
            >
              TAX SETTINGS
            </Button>
            <Button
              onClick={() => {
                setSelectedProduct(null);
                setActiveFormType('RESTAURANT');
                setIsFormOpen(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[9px] tracking-widest px-3 py-2 rounded-lg shadow-lg shadow-indigo-200"
            >
              <Plus size={14} className="mr-1.5" />
              RESTAURANT
            </Button>
            <Button
              onClick={() => {
                setSelectedProduct(null);
                setActiveFormType('BAR');
                setIsFormOpen(true);
              }}
              className="bg-amber-500 hover:bg-amber-600 text-white font-black text-[9px] tracking-widest px-3 py-2 rounded-lg shadow-lg shadow-amber-200"
            >
              <Plus size={14} className="mr-1.5" />
              BAR
            </Button>
            <Button
              onClick={() => {
                setSelectedCombo(null);
                setActiveFormType('COMBO');
                setIsFormOpen(true);
              }}
              className="bg-orange-600 hover:bg-orange-700 text-white font-black text-[9px] tracking-widest px-3 py-2 rounded-lg shadow-lg shadow-orange-200"
            >
              <Plus size={14} className="mr-1.5" />
              COMBO
            </Button>
          </div>

        }
      />

      <SearchToolbar
        value={search}
        onChange={setSearch}
        placeholder="Search by name, SKU or category..."
        actions={
          <div className="flex gap-2">
            {['SUPER_ADMIN', 'RESTAURANTS_ADMIN'].includes(session?.role) && properties.length > 0 && (
              <div className="relative group">
                <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-pos-primary transition-colors z-10" />
                <select
                  value={selectedPropertyId}
                  onChange={(e) => setSelectedPropertyId(e.target.value)}
                  className="pl-10 pr-8 py-2.5 bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold uppercase tracking-widest text-gray-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary transition-all appearance-none cursor-pointer min-w-[200px]"
                >
                  <option value="all">All Properties</option>
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none transition-transform group-hover:translate-y-[-40%]" />
              </div>
            )}
            <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-slate-800/50 rounded-xl border border-gray-200 dark:border-slate-700">
              <button
                onClick={() => setSelectedMenuTypeFilter('all')}
                className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${selectedMenuTypeFilter === 'all'
                  ? 'bg-white dark:bg-slate-700 text-pos-primary shadow-sm'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-slate-300'
                  }`}
              >

              </button>
              <button
                onClick={() => setSelectedMenuTypeFilter('RESTAURANT')}
                className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${selectedMenuTypeFilter === 'RESTAURANT'
                  ? 'bg-white dark:bg-slate-700 text-pos-primary shadow-sm'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-slate-300'
                  }`}
              >
                Restaurant
              </button>
              <button
                onClick={() => setSelectedMenuTypeFilter('BAR')}
                className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${selectedMenuTypeFilter === 'BAR'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-slate-300'
                  }`}
              >
                Bar
              </button>
              <button
                onClick={() => setSelectedMenuTypeFilter('COMBO')}
                className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${selectedMenuTypeFilter === 'COMBO'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-slate-300'
                  }`}
              >
                Combos
              </button>
            </div>

            <Button variant="secondary" className="font-bold text-xs tracking-widest gap-2 bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 px-4 rounded-xl">
              <Filter size={16} />
              FILTERS
            </Button>
          </div>
        }
      />

      {selectedMenuTypeFilter === 'COMBO' ? (
        <DataTable
          columns={comboColumns}
          data={filteredCombos}
          loading={loading}
        />
      ) : (
        <DataTable
          columns={columns}
          data={filteredProducts}
          loading={loading}
        />
      )}


      {/* Bulk Tax Update Modal */}
      {isBulkTaxOpen && (
        <Modal
          isOpen={isBulkTaxOpen}
          onClose={() => !mutationLoading && setIsBulkTaxOpen(false)}
          title="Global Tax Settings"
        >
          <div className="space-y-6 p-2">
            <p className="text-sm text-gray-500">
              Apply a specific tax type to <strong>ALL products</strong> in this property simultaneously.
            </p>

            <div className="grid grid-cols-1 gap-4">
              {[
                { id: 'EXCLUSIVE', label: 'Exclusive', desc: 'Tax added on top of selling price' },
                { id: 'INCLUSIVE', label: 'Inclusive', desc: 'Tax included in selling price' },
                { id: 'EXEMPT', label: 'Exempt (0%)', desc: 'No tax applied' }
              ].map((type) => (
                <label
                  key={type.id}
                  className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer ${selectedTaxType === type.id
                    ? 'border-pos-primary bg-pos-primary/5 shadow-sm'
                    : 'border-gray-100 dark:border-slate-800 hover:border-gray-200'
                    }`}
                >
                  <input
                    type="radio"
                    name="taxType"
                    value={type.id}
                    checked={selectedTaxType === type.id}
                    onChange={(e) => setSelectedTaxType(e.target.value)}
                    className="w-5 h-5 text-pos-primary focus:ring-pos-primary border-gray-300"
                  />
                  <div>
                    <p className="font-bold text-sm text-gray-900 dark:text-white uppercase tracking-tight">{type.label}</p>
                    <p className="text-[10px] text-gray-500 font-medium">{type.desc}</p>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-800 mt-6">
              <Button variant="secondary" onClick={() => setIsBulkTaxOpen(false)} disabled={mutationLoading}>Cancel</Button>
              <Button
                onClick={handleBulkTaxUpdate}
                isLoading={mutationLoading}
                className="bg-pos-primary hover:bg-red-700 text-white font-bold"
              >
                Apply to All Products
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* AI Scan Modal */}
      {isAiModalOpen && (
        <Modal
          isOpen={isAiModalOpen}
          onClose={() => { if (!mutationLoading) setIsAiModalOpen(false); }}
          title="Scan Menu using Mint AI"
        >
          <div className="p-2 space-y-6">
            {/* Unified Menu Destination Toggle - Always Visible */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${aiMenuType === 'RESTAURANT'
              ? 'bg-indigo-50/50 border-indigo-100 dark:bg-indigo-900/10 dark:border-indigo-800/30'
              : 'bg-amber-50/50 border-amber-100 dark:bg-amber-900/10 dark:border-amber-800/30'
              }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${aiMenuType === 'RESTAURANT' ? 'bg-indigo-100 text-indigo-600' : 'bg-amber-100 text-amber-600'
                  }`}>
                  <Layers size={18} />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-white">Save Scanned Items To</p>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">Current Selection: {aiMenuType}</p>
                </div>
              </div>

              <div className="flex p-1 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
                <button
                  type="button"
                  onClick={() => setAiMenuType('RESTAURANT')}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${aiMenuType === 'RESTAURANT'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none'
                    : 'text-gray-400 hover:text-gray-600'
                    }`}
                >
                  Restaurant
                </button>
                <button
                  type="button"
                  onClick={() => setAiMenuType('BAR')}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${aiMenuType === 'BAR'
                    ? 'bg-amber-500 text-white shadow-lg shadow-amber-200 dark:shadow-none'
                    : 'text-gray-400 hover:text-gray-600'
                    }`}
                >
                  Bar
                </button>
              </div>
            </div>

            {!scannedData ? (
              <form onSubmit={handleAiScan} className="space-y-4">
                <p className="text-sm text-gray-500">Upload an image of your menu card to automatically extract and create products & categories.</p>
                <div className="border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-xl p-8 text-center cursor-pointer hover:border-pos-primary transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="menuImage"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                  <label htmlFor="menuImage" className="cursor-pointer flex flex-col items-center">
                    <Package size={32} className="text-gray-400 mb-2" />
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{file ? file.name : 'Select Image Click to Browse'}</span>
                    <span className="text-xs text-gray-400 mt-1">Supports JPEG, PNG</span>
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 bg-gray-50 dark:bg-slate-800/80 p-4 rounded-xl border border-gray-100 dark:border-slate-700/50">
                    <div className="flex-1">
                      <p className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest mb-0.5">Extract GST</p>
                      <p className="text-[8px] text-gray-400 font-bold uppercase tracking-tighter">Auto-apply rates</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer scale-75">
                      <input
                        type="checkbox"
                        checked={includeTax}
                        onChange={(e) => setIncludeTax(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pos-primary"></div>
                    </label>
                  </div>

                  <div className="flex items-center gap-3 bg-gray-50 dark:bg-slate-800/80 p-4 rounded-xl border border-gray-100 dark:border-slate-700/50">
                    <div className="flex-1">
                      <p className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest mb-0.5">Extract HSN</p>
                      <p className="text-[8px] text-gray-400 font-bold uppercase tracking-tighter">Auto-apply codes</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer scale-75">
                      <input
                        type="checkbox"
                        checked={includeHsn}
                        onChange={(e) => setIncludeHsn(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pos-primary"></div>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="secondary" onClick={() => setIsAiModalOpen(false)} type="button">Cancel</Button>
                  <Button type="submit" isLoading={scanning} disabled={!file} className="px-8">Start AI Scan</Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">Review Scanned Items</p>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md border ${aiMenuType === 'BAR'
                    ? 'bg-amber-50 text-amber-600 border-amber-100'
                    : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                    }`}>
                    Destination: {aiMenuType}
                  </span>
                </div>
                <div className="max-h-[50vh] overflow-y-auto no-scrollbar space-y-4">
                  {scannedData.categories?.map((cat: any, i: number) => (
                    <div key={i} className="border border-gray-100 dark:border-slate-800 rounded-xl p-6 bg-white dark:bg-slate-800/50 shadow-sm space-y-4 mb-4">
                      <div className="flex items-center gap-2 border-b border-gray-50 dark:border-slate-800 pb-3">
                        <div className="w-2 h-6 bg-pos-primary rounded-full" />
                        <h4 className="font-black text-sm uppercase tracking-widest text-slate-900 dark:text-white">{cat.name}</h4>
                      </div>
                      <div className="divide-y divide-gray-50 dark:divide-slate-800">
                        {cat.items?.map((item: any, j: number) => (
                          <div key={j} className="py-4 last:pb-0 transition-opacity">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex flex-col">
                                <span className="font-black text-sm text-gray-900 dark:text-white uppercase tracking-tight">{item.name}</span>
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{item.productType?.replace('_', ' ')}</span>
                              </div>
                              <div className="text-right">
                                <span className="font-black text-lg text-pos-primary block leading-none">₹{item.sellingPrice || item.price}</span>
                                {item.costPrice > 0 && (
                                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-1 block">Cost: ₹{item.costPrice}</span>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 mt-3">
                              <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded-lg">
                                <span className="text-[8px] font-black uppercase text-gray-400">SKU</span>
                                <span className="text-[10px] font-bold text-gray-700 dark:text-slate-200">{item.sku}</span>
                              </div>
                              <div className="flex items-center gap-1.5 bg-pos-primary/5 dark:bg-pos-primary/10 px-2 py-1 rounded-lg border border-pos-primary/20 dark:border-pos-primary/30">
                                <span className="text-[8px] font-black uppercase text-pos-primary/60">HSN</span>
                                <span className="text-[10px] font-bold text-pos-primary/80 dark:text-pos-primary/90">{item.hsnCode}</span>
                              </div>
                              <div className="flex items-center gap-1.5 bg-orange-50 dark:bg-orange-900/30 px-2 py-1 rounded-lg border border-orange-100 dark:border-orange-800">
                                <span className="text-[8px] font-black uppercase text-orange-400">GST</span>
                                <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400">{item.taxRate}%</span>
                              </div>
                              {item.barcode && (
                                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded-lg border border-slate-100 dark:border-slate-800">
                                  <span className="text-[8px] font-black uppercase text-slate-400">SCAN ID</span>
                                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-500 font-mono italic">{item.barcode}</span>
                                </div>
                              )}
                              {item.trackInventory && (
                                <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-lg border border-emerald-100 dark:border-emerald-800">
                                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                  <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">STOCK TRACK</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <Button variant="secondary" onClick={() => setScannedData(null)} disabled={mutationLoading}>Back / Scan Again</Button>
                  <Button onClick={handleSaveScannedData} isLoading={mutationLoading}>Confirm & Save to DB</Button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Forms & Modals */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={
          activeFormType === 'COMBO'
            ? (selectedCombo ? 'Edit Combo' : 'New Combo')
            : (selectedProduct ? `Edit ${activeFormType === 'BAR' ? 'Bar' : 'Restaurant'} Product` : `New ${activeFormType === 'BAR' ? 'Bar' : 'Restaurant'} Product`)
        }
        maxWidth={activeFormType === 'BAR' || activeFormType === 'COMBO' ? "4xl" : "2xl"}
      >
        {activeFormType === 'RESTAURANT' ? (
          <RestaurantProductForm
            initialData={selectedProduct || undefined}
            onSubmit={handleCreateOrUpdate}
            onCancel={() => setIsFormOpen(false)}
            loading={mutationLoading}
          />
        ) : activeFormType === 'BAR' ? (
          <BarProductForm
            initialData={selectedProduct || undefined}
            onSubmit={handleCreateOrUpdate}
            onCancel={() => setIsFormOpen(false)}
            loading={mutationLoading}
          />
        ) : (
          <ComboForm
            initialData={selectedCombo || undefined}
            onSubmit={handleCreateOrUpdateCombo}
            onCancel={() => setIsFormOpen(false)}
            loading={mutationLoading}
          />
        )}
      </Modal>


      {isDeleteOpen && (
        <ConfirmDeleteModal
          title="Delete Product"
          message={`Are you sure you want to delete "${selectedProduct?.name}"? This will remove it from the menu.`}
          onConfirm={handleDelete}
          onCancel={() => setIsDeleteOpen(false)}
          loading={mutationLoading}
        />
      )}

      {isComboDeleteOpen && (
        <ConfirmDeleteModal
          title="Delete Combo"
          message={`Are you sure you want to delete "${selectedCombo?.name}"? This action cannot be undone.`}
          onConfirm={handleComboDelete}
          onCancel={() => setIsComboDeleteOpen(false)}
          loading={mutationLoading}
        />
      )}

    </div>
  );
}
