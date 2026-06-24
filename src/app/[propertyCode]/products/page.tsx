'use client';

import React, { useState, useEffect } from 'react';
import Tesseract from 'tesseract.js';
import { Filter, Package, Tag, Edit, Trash2, Plus, ChevronDown, Layers, Download, Sparkles, Upload, ArrowLeft, Check, AlertCircle, X, Flame, Leaf } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { SearchToolbar } from '@/components/shared/search-toolbar';
import { DataTable } from '@/components/shared/data-table';
import { Button } from '@/components/ui/Button';
import { productsApi, Product } from '@/lib/api/products';
import { Building2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { RestaurantProductForm } from '@/components/forms/restaurant-product-form';
import { BarProductForm } from '@/components/forms/bar-product-form';
import { CafeProductForm } from '@/components/forms/cafe-product-form';
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
  const [activeFormType, setActiveFormType] = useState<'RESTAURANT' | 'BAR' | 'CAFE' | 'COMBO'>('RESTAURANT');
  const [combos, setCombos] = useState<Combo[]>([]);
  const [isComboDeleteOpen, setIsComboDeleteOpen] = useState(false);
  const [selectedCombo, setSelectedCombo] = useState<Combo | null>(null);
  const [propertyDetails, setPropertyDetails] = useState<any>(null);

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

    fetch('/api/setup/properties/current')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setPropertyDetails(data.data);
          setSelectedPropertyId(data.data.id);
        }
      })
      .catch(err => console.error('Failed to fetch current property', err));
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
        <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${
          row.menuType === 'BAR' 
            ? 'bg-amber-50 text-amber-600 border-amber-100' 
            : row.menuType === 'CAFE'
              ? 'bg-orange-50 text-orange-600 border-orange-100'
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
              setActiveFormType(row.menuType ? (row.menuType.toUpperCase() as any) : 'RESTAURANT');
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
              onClick={() => setSelectedMenuTypeFilter('AI_SCAN')}
              variant="secondary"
              className={`font-black text-[9px] tracking-widest px-3 py-2 rounded-lg border flex items-center gap-1 ${
                selectedMenuTypeFilter === 'AI_SCAN'
                  ? 'bg-indigo-50 border-indigo-150 text-indigo-600 dark:bg-indigo-900/20 dark:border-indigo-850'
                  : 'border-gray-200 bg-white dark:bg-slate-800'
              }`}
            >
              <Sparkles size={10} />
              MINT AI SCAN
            </Button>

            <Button
              onClick={() => setIsBulkTaxOpen(true)}
              variant="secondary"
              className="font-black text-[9px] tracking-widest px-3 py-2 rounded-lg border border-gray-200 bg-amber-50 text-amber-600 border-amber-100"
            >
              TAX SETTINGS
            </Button>
            {propertyDetails?.restaurantPosEnabled !== false && (
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
            )}
            {propertyDetails?.barPosEnabled && (
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
            )}
            {propertyDetails?.cafePosEnabled && (
              <Button
                onClick={() => {
                  setSelectedProduct(null);
                  setActiveFormType('CAFE');
                  setIsFormOpen(true);
                }}
                className="bg-[#D2691E] hover:bg-[#B55A1A] text-white font-black text-[9px] tracking-widest px-3 py-2 rounded-lg shadow-lg shadow-orange-200"
              >
                <Plus size={14} className="mr-1.5" />
                CAFE
              </Button>
            )}
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
                All
              </button>
              {propertyDetails?.restaurantPosEnabled !== false && (
                <button
                  onClick={() => setSelectedMenuTypeFilter('RESTAURANT')}
                  className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${selectedMenuTypeFilter === 'RESTAURANT'
                    ? 'bg-white dark:bg-slate-700 text-pos-primary shadow-sm'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-slate-300'
                    }`}
                >
                  Restaurant
                </button>
              )}
              {propertyDetails?.barPosEnabled && (
                <button
                  onClick={() => setSelectedMenuTypeFilter('BAR')}
                  className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${selectedMenuTypeFilter === 'BAR'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-slate-300'
                    }`}
                >
                  Bar
                </button>
              )}
              {propertyDetails?.cafePosEnabled && (
                <button
                  onClick={() => setSelectedMenuTypeFilter('CAFE')}
                  className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${selectedMenuTypeFilter === 'CAFE'
                    ? 'bg-[#D2691E] text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-slate-300'
                    }`}
                >
                  Cafe
                </button>
              )}
              <button
                onClick={() => setSelectedMenuTypeFilter('COMBO')}
                className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${selectedMenuTypeFilter === 'COMBO'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-slate-300'
                  }`}
              >
                Combos
              </button>
              <button
                onClick={() => setSelectedMenuTypeFilter('AI_SCAN')}
                className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1 ${selectedMenuTypeFilter === 'AI_SCAN'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-slate-300'
                  }`}
              >
                <Sparkles size={10} />
                AI Scanner
              </button>
            </div>

            <Button variant="secondary" className="font-bold text-xs tracking-widest gap-2 bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 px-4 rounded-xl">
              <Filter size={16} />
              FILTERS
            </Button>
          </div>
        }
      />

      {selectedMenuTypeFilter === 'AI_SCAN' ? (
        <AiScannerPanel 
          propertyId={selectedPropertyId} 
          properties={properties}
          onImportSuccess={() => {
            setSelectedMenuTypeFilter('all');
            fetchProducts();
          }}
        />
      ) : selectedMenuTypeFilter === 'COMBO' ? (
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

      {/* Forms & Modals */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={
          activeFormType === 'COMBO'
            ? (selectedCombo ? 'Edit Combo' : 'New Combo')
            : (selectedProduct ? `Edit ${activeFormType === 'BAR' ? 'Bar' : activeFormType === 'CAFE' ? 'Cafe' : 'Restaurant'} Product` : `New ${activeFormType === 'BAR' ? 'Bar' : activeFormType === 'CAFE' ? 'Cafe' : 'Restaurant'} Product`)
        }
        maxWidth={activeFormType === 'BAR' || activeFormType === 'CAFE' || activeFormType === 'COMBO' ? "4xl" : "2xl"}
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
        ) : activeFormType === 'CAFE' ? (
          <CafeProductForm
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

interface AiScannerPanelProps {
  propertyId: string;
  properties: any[];
  onImportSuccess: () => void;
}

const AiScannerPanel: React.FC<AiScannerPanelProps> = ({ propertyId, properties, onImportSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scannedData, setScannedData] = useState<any>(null);
  const [includeTax, setIncludeTax] = useState(true);
  const [includeHsn, setIncludeHsn] = useState(true);
  const [scanMode, setScanMode] = useState<'semantic' | 'fast'>('semantic');
  const [aiMenuType, setAiMenuType] = useState<'RESTAURANT' | 'BAR' | 'CAFE'>('RESTAURANT');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [scanStatus, setScanStatus] = useState('');
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setImagePreviewUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setImagePreviewUrl(null);
    }
  }, [file]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const startScan = async () => {
    if (!file) return;
    setScanning(true);
    setScanStatus('📖 Step 1/2: Reading menu text with browser OCR...');
    setError('');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('includeTax', String(includeTax));
    formData.append('includeHsn', String(includeHsn));
    formData.append('scanMode', scanMode);

    try {
      // Always run browser OCR first - much faster and more reliable than server-side
      if (imagePreviewUrl) {
        const { data: { text } } = await Tesseract.recognize(imagePreviewUrl, 'eng+hin', {
          logger: () => {}
        });
        formData.append('rawOcrText', text);
      }

      setScanStatus('🧠 Step 2/2: AI is parsing menu items...');

      setScanStatus('🧠 Step 2/2: AI is parsing menu items (may take a few minutes)...');

      // Call local Python FastAPI backend directly to bypass Next.js 5-minute timeout!
      const res = await fetch('http://localhost:8000/api/scan-menu', {
        method: 'POST',
        body: formData,
      });
      
      if (!res.ok) {
        const errText = await res.text();
        setError(`Local scanning backend failed: ${errText}`);
        return;
      }

      const pythonData = await res.json();
      
      // Map Python backend response schema to Next.js products schema
      const mappedCategories = (pythonData.categories || []).map((category: any) => {
        const items = (category.items || []).map((item: any) => {
          const sellingPrice = item.price || 0.0;
          const halfPrice = item.half_price !== undefined && item.half_price !== null ? item.half_price : null;
          const costPrice = Math.round(sellingPrice * 0.4 * 100) / 100; // 40% estimated cost price
          const taxRate = item.gst_rate !== undefined ? item.gst_rate : (includeTax ? 5 : 0);
          const hsnCode = item.hsn_code ? item.hsn_code : (includeHsn ? "9963" : "---");
          
          // Generate high-fidelity unique SKU from category and item name
          const cleanCat = category.category_name?.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase() || 'GEN';
          const cleanName = item.name?.replace(/[^a-zA-Z]/g, '').substring(0, 8).toUpperCase() || 'ITEM';
          const randId = Math.floor(100 + Math.random() * 900);
          const sku = `${cleanCat}-${cleanName}-${randId}`;
          
          // Generate random 8 digit barcode
          const barcode = Math.floor(10000000 + Math.random() * 90000000).toString();

          return {
            name: item.name,
            sellingPrice,
            halfPrice,
            costPrice,
            hsnCode,
            taxRate,
            sku,
            barcode,
            productType: 'REVENUE_ITEM',
            trackInventory: false,
            isActive: true,
            showInMenu: true,
            description: item.description || `Delicious ${item.name}`,
            isVeg: item.is_vegetarian !== undefined ? Boolean(item.is_vegetarian) : true,
            isSpicy: item.is_spicy !== undefined ? Boolean(item.is_spicy) : false
          };
        });

        return {
          name: category.category_name,
          items
        };
      });

      setScannedData({ categories: mappedCategories });
    } catch (err: any) {
      console.error('Scan failed:', err);
      setError('Network error. Check connection and try again.');
    } finally {
      setScanning(false);
    }
  };

  const updateItemField = (catIndex: number, itemIndex: number, field: string, value: any) => {
    if (!scannedData) return;
    const updated = { ...scannedData };
    updated.categories[catIndex].items[itemIndex][field] = value;
    setScannedData(updated);
  };

  const deleteItem = (catIndex: number, itemIndex: number) => {
    if (!scannedData) return;
    const updated = { ...scannedData };
    updated.categories[catIndex].items.splice(itemIndex, 1);
    if (updated.categories[catIndex].items.length === 0) {
      updated.categories.splice(catIndex, 1);
    }
    setScannedData(updated);
  };

  const addItemToCategory = (catIndex: number) => {
    if (!scannedData) return;
    const updated = { ...scannedData };
    const randId = Math.floor(100 + Math.random() * 900);
    updated.categories[catIndex].items.push({
      name: 'New Menu Item',
      sellingPrice: 100,
      costPrice: 40,
      hsnCode: includeHsn ? '9963' : '',
      taxRate: includeTax ? 5 : 0,
      sku: `AI-NEW-${randId}`,
      barcode: Math.floor(10000000 + Math.random() * 90000000).toString(),
      productType: 'REVENUE_ITEM',
      trackInventory: false,
      isActive: true,
      showInMenu: true,
      description: 'Delicious menu item'
    });
    setScannedData(updated);
  };

  const handleSave = async () => {
    if (!scannedData) return;
    setSaving(true);
    try {
      const savePropertyId = propertyId;
      if (!savePropertyId || savePropertyId === 'all') {
        alert('Please select a specific property branch in the header first.');
        setSaving(false);
        return;
      }
      
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
        alert('Menu imported successfully!');
        onImportSuccess();
      } else {
        alert(data.error || 'Failed to save items');
      }
    } catch (err) {
      console.error(err);
      alert('Save operation encountered an error.');
    } finally {
      setSaving(false);
    }
  };

  const activePropertyName = properties.find(p => p.id === propertyId)?.name || 'Please Select Property Branch in Header';

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-6 shadow-xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-100 dark:border-slate-850 pb-5 mb-6 gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-500 animate-pulse" />
            AI Restaurant Menu Scanner
          </h2>
          <p className="text-xs text-gray-400 uppercase font-black tracking-widest mt-1">
            Target Branch: <span className="text-pos-primary">{activePropertyName}</span>
          </p>
        </div>

        <div className="flex p-1 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-inner">
          {(['RESTAURANT', 'BAR', 'CAFE'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setAiMenuType(type)}
              className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                aiMenuType === type
                  ? type === 'RESTAURANT'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : type === 'BAR'
                      ? 'bg-amber-500 text-white shadow-md'
                      : 'bg-orange-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-slate-350'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-450 rounded-2xl flex items-center gap-3 text-sm">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!scannedData && !scanning && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-50 dark:bg-slate-800/40 border border-gray-100 dark:border-slate-850 rounded-2xl p-6 space-y-6">
            <h3 className="text-xs font-black text-gray-400 dark:text-slate-450 uppercase tracking-widest">Scanner Configuration</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-xl">
                <div>
                  <p className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest">Auto-Extract GST Rates</p>
                  <p className="text-[8px] text-gray-400 font-bold uppercase tracking-tight mt-0.5">Assigns tax rates based on menu categories</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer scale-90">
                  <input
                    type="checkbox"
                    checked={includeTax}
                    onChange={(e) => setIncludeTax(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pos-primary"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-xl">
                <div>
                  <p className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest">Auto-Extract HSN Codes</p>
                  <p className="text-[8px] text-gray-400 font-bold uppercase tracking-tight mt-0.5">Applies standard HSN codes to items</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer scale-90">
                  <input
                    type="checkbox"
                    checked={includeHsn}
                    onChange={(e) => setIncludeHsn(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pos-primary"></div>
                </label>
              </div>

              <div className="flex flex-col gap-3 p-4 bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-xl">
                <div>
                  <p className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest">Scanning Mode</p>
                  <p className="text-[8px] text-gray-400 font-bold uppercase tracking-tight mt-0.5">Choose processing engine</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setScanMode('semantic')}
                    className={`flex-1 py-2 px-3 text-[10px] font-black rounded-xl uppercase tracking-wider transition-all border ${
                      scanMode === 'semantic'
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                        : 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-750'
                    }`}
                  >
                    ✨ High Accuracy (AI)
                  </button>
                  <button
                    type="button"
                    onClick={() => setScanMode('fast')}
                    className={`flex-1 py-2 px-3 text-[10px] font-black rounded-xl uppercase tracking-wider transition-all border ${
                      scanMode === 'fast'
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                        : 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-750'
                    }`}
                  >
                    ⚡ Fast Scan (Regex)
                  </button>
                </div>
              </div>
            </div>

            <div className="text-[10px] text-amber-600 dark:text-amber-500 font-bold uppercase leading-relaxed bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50 p-4 rounded-xl">
              ⚠️ Ensure you select the correct property branch from the dropdown in the top-right corner before uploading. Scanned items will be imported into that branch.
            </div>
          </div>

          <div className="flex flex-col items-center justify-center">
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-upload-input')?.click()}
              className={`w-full h-64 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all duration-300 ${
                dragActive
                  ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 scale-102'
                  : 'border-gray-200 dark:border-slate-800 hover:border-pos-primary hover:bg-gray-50/50 dark:hover:bg-slate-800/20'
              }`}
            >
              <input
                id="file-upload-input"
                type="file"
                className="hidden"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
              />
              <Upload className="h-10 w-10 text-gray-400 mb-3" />
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                {file ? file.name : 'Drag & drop your menu image here, or click to browse'}
              </p>
              <p className="text-xs text-gray-400 mt-2">Supports JPG, PNG, WEBP, and PDF files</p>
              {file && (
                <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 px-3.5 py-1.5 rounded-full font-bold uppercase tracking-wider mt-4">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </span>
              )}
            </div>

            {file && (
              <button
                onClick={startScan}
                className="mt-5 w-full bg-gradient-to-r from-indigo-600 to-rose-600 hover:from-indigo-700 hover:to-rose-700 text-white font-black text-xs uppercase tracking-widest py-4 px-6 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Sparkles size={16} />
                Start AI Menu scan
              </button>
            )}
          </div>
        </div>
      )}

      {scanning && (
        <div className="py-16 flex flex-col items-center justify-center space-y-4">
          <div className="h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider animate-pulse">
            {scanStatus || 'Processing menu...'}
          </h3>
          <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Please wait. Do not close this page.</p>
        </div>
      )}

      {scannedData && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          <div className="xl:col-span-4 space-y-4">
            <h3 className="text-xs font-black text-gray-400 dark:text-slate-450 uppercase tracking-widest">Uploaded Menu Card</h3>
            <div className="border border-gray-150 dark:border-slate-800 rounded-2xl overflow-hidden bg-gray-50 dark:bg-slate-900/50 shadow-inner max-h-[70vh] flex items-center justify-center p-2">
              {imagePreviewUrl ? (
                <img src={imagePreviewUrl} alt="Menu Preview" className="max-w-full max-h-full object-contain rounded-xl" />
              ) : (
                <div className="py-20 text-gray-400 font-bold uppercase text-[10px]">No image preview available</div>
              )}
            </div>
            <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wide bg-gray-50 dark:bg-slate-800/40 p-3 rounded-xl border border-gray-100 dark:border-slate-800">
              💡 Compare the extracted products side-by-side with your menu image. Double click any text field to edit inline.
            </div>
          </div>

          <div className="xl:col-span-8 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black text-gray-400 dark:text-slate-455 uppercase tracking-widest">Review Extracted Items</h3>
              <span className="text-[9px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-md border border-emerald-100">
                Destination: {aiMenuType}
              </span>
            </div>

            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 no-scrollbar">
              {scannedData.categories?.map((cat: any, catIdx: number) => (
                <div key={catIdx} className="border border-gray-150 dark:border-slate-800 rounded-2xl p-5 bg-gray-50/50 dark:bg-slate-800/20 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-200/50 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-5 bg-indigo-500 rounded-full" />
                      <input
                        type="text"
                        value={cat.name}
                        onChange={(e) => {
                          const updated = { ...scannedData };
                          updated.categories[catIdx].name = e.target.value;
                          setScannedData(updated);
                        }}
                        className="bg-transparent font-black text-sm uppercase text-gray-900 dark:text-white border-b border-transparent hover:border-gray-300 focus:border-indigo-500 focus:outline-none px-1 py-0.5 rounded transition-all max-w-[200px]"
                      />
                    </div>
                    <button
                      onClick={() => addItemToCategory(catIdx)}
                      className="text-[9px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-1"
                    >
                      <Plus size={12} /> Add Item
                    </button>
                  </div>

                  <div className="space-y-4">
                    {cat.items?.map((item: any, itemIdx: number) => (
                      <div key={itemIdx} className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow relative">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex-1 min-w-[200px]">
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => updateItemField(catIdx, itemIdx, 'name', e.target.value)}
                              className="w-full bg-transparent font-black text-xs uppercase text-gray-800 dark:text-slate-100 border-b border-transparent hover:border-gray-200 focus:border-indigo-500 focus:outline-none py-0.5 transition-all"
                              placeholder="Product Name"
                            />
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Full Price Input */}
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest pl-1">Full Price</span>
                              <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-[10px] font-bold">₹</span>
                                <input
                                  type="number"
                                  value={item.sellingPrice || item.price || 0}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 0;
                                    const updated = { ...scannedData };
                                    updated.categories[catIdx].items[itemIdx] = {
                                      ...updated.categories[catIdx].items[itemIdx],
                                      sellingPrice: val,
                                      price: val,
                                      costPrice: Math.round(val * 0.4 * 100) / 100
                                    };
                                    setScannedData(updated);
                                  }}
                                  className="pl-5 pr-2 py-1.5 w-20 bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-lg text-xs font-black text-gray-900 dark:text-white text-right focus:outline-none focus:border-indigo-500"
                                />
                              </div>
                            </div>

                            {/* Half Price Input */}
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest pl-1">Half Price</span>
                              <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-[10px] font-bold">₹</span>
                                <input
                                  type="number"
                                  placeholder="---"
                                  value={item.halfPrice !== null && item.halfPrice !== undefined ? item.halfPrice : ''}
                                  onChange={(e) => {
                                    const valText = e.target.value;
                                    const val = valText === '' ? null : parseFloat(valText) || 0;
                                    const updated = { ...scannedData };
                                    updated.categories[catIdx].items[itemIdx] = {
                                      ...updated.categories[catIdx].items[itemIdx],
                                      halfPrice: val
                                    };
                                    setScannedData(updated);
                                  }}
                                  className="pl-5 pr-2 py-1.5 w-20 bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-lg text-xs font-black text-gray-900 dark:text-white text-right focus:outline-none focus:border-indigo-500"
                                />
                              </div>
                            </div>

                            <button
                              onClick={() => updateItemField(catIdx, itemIdx, 'is_vegetarian', !item.is_vegetarian)}
                              className={`p-1.5 rounded-lg border transition-all ${
                                item.is_vegetarian
                                  ? 'bg-green-50 border-green-200 text-green-600 dark:bg-green-950/20 dark:border-green-900'
                                  : 'bg-gray-50 border-gray-200 text-gray-400 dark:bg-slate-800 dark:border-slate-700'
                              }`}
                              title="Vegetarian"
                            >
                              <Leaf size={14} />
                            </button>

                            <button
                              onClick={() => updateItemField(catIdx, itemIdx, 'is_spicy', !item.is_spicy)}
                              className={`p-1.5 rounded-lg border transition-all ${
                                item.is_spicy
                                  ? 'bg-red-50 border-red-200 text-red-600 dark:bg-red-950/20 dark:border-red-900'
                                  : 'bg-gray-50 border-gray-200 text-gray-400 dark:bg-slate-800 dark:border-slate-700'
                              }`}
                              title="Spicy"
                            >
                              <Flame size={14} />
                            </button>

                            <button
                              onClick={() => deleteItem(catIdx, itemIdx)}
                              className="p-1.5 rounded-lg border border-red-100 hover:bg-red-50 text-red-500 dark:border-red-950/20 dark:hover:bg-red-950/30 transition-all"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        <div className="mt-2.5">
                          <input
                            type="text"
                            value={item.description || ''}
                            onChange={(e) => updateItemField(catIdx, itemIdx, 'description', e.target.value)}
                            className="w-full bg-transparent text-[10px] text-gray-400 font-bold border-b border-transparent hover:border-gray-250 focus:border-indigo-500 focus:outline-none py-0.5"
                            placeholder="Add item description..."
                          />
                        </div>

                        <div className="flex flex-wrap gap-3 items-center mt-3 pt-3 border-t border-gray-100 dark:border-slate-800">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">HSN</span>
                            <input
                              type="text"
                              value={item.hsnCode || ''}
                              onChange={(e) => updateItemField(catIdx, itemIdx, 'hsnCode', e.target.value)}
                              className="px-2 py-0.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded text-[9px] font-bold text-gray-700 dark:text-slate-300 w-16 text-center"
                            />
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">GST</span>
                            <select
                              value={item.taxRate || 5}
                              onChange={(e) => updateItemField(catIdx, itemIdx, 'taxRate', parseFloat(e.target.value))}
                              className="px-2 py-0.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded text-[9px] font-bold text-gray-700 dark:text-slate-300 w-16 text-center focus:outline-none focus:border-indigo-500"
                            >
                              <option value="0">0%</option>
                              <option value="5">5%</option>
                              <option value="12">12%</option>
                              <option value="18">18%</option>
                              <option value="28">28%</option>
                            </select>
                          </div>

                          <span className="text-[9px] font-mono text-gray-400 ml-auto bg-gray-50 dark:bg-slate-800 px-2 py-0.5 rounded border border-gray-100 dark:border-slate-800 italic">
                            SKU: {item.sku}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-800">
              <button
                onClick={() => {
                  setScannedData(null);
                  setFile(null);
                }}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-xs font-black uppercase tracking-widest text-gray-500 dark:text-slate-350 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
              >
                Scan Again
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-200 dark:shadow-none transition-colors flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check size={14} />
                    Confirm & Save to Database
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
