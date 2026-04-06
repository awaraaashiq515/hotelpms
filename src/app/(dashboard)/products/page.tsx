'use client';

import React, { useState, useEffect } from 'react';
import { Filter, Package, Tag, Edit, Trash2, Plus } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { SearchToolbar } from '@/components/shared/search-toolbar';
import { DataTable } from '@/components/shared/data-table';
import { Button } from '@/components/ui/Button';
import { productsApi, Product } from '@/lib/api/products';
import { Modal } from '@/components/ui/Modal';
import { ProductForm } from '@/components/forms/product-form';
import { ConfirmDeleteModal } from '@/components/modals/confirm-delete-modal';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [mutationLoading, setMutationLoading] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await productsApi.list();
      setProducts(data || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

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

  const filteredProducts = (products || []).filter((p: Product) => {
    const searchLower = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(searchLower) ||
      (p.sku || '').toLowerCase().includes(searchLower) ||
      (p.category?.name || '').toLowerCase().includes(searchLower)
    );
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
               <Package size={16} className="opacity-40" />
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
            </div>
          </div>
        </div>
      ),
      width: '350px'
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
      header: 'Status', 
      cell: (row: Product) => (
        <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${
          row.isActive !== false ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-400'
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

  // AI Modal states
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scannedData, setScannedData] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);

  const handleAiScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setScanning(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

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
        body: JSON.stringify({ categories: scannedData.categories }),
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
        actions={
          <div className="flex gap-2">
            <Button 
              onClick={() => setIsAiModalOpen(true)}
              variant="secondary"
              className="font-bold text-xs tracking-widest px-4 py-3 rounded-lg border border-gray-200"
            >
               AI SCAN MENU
            </Button>
            <Button 
              onClick={() => {
                setSelectedProduct(null);
                setIsFormOpen(true);
              }}
              className="bg-pos-primary hover:bg-red-700 text-white font-bold text-xs tracking-widest px-6 py-3 rounded-lg shadow-lg shadow-red-200"
            >
               <Plus size={16} className="mr-2" />
               ADD NEW PRODUCT
            </Button>
          </div>
        }
      />

      <SearchToolbar 
        value={search}
        onChange={setSearch}
        placeholder="Search by name, SKU or category..."
        actions={
           <Button variant="secondary" className="font-bold text-xs tracking-widest gap-2 bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 px-4">
            <Filter size={16} />
            FILTERS
          </Button>
        }
      />

      <DataTable 
        columns={columns} 
        data={filteredProducts} 
        loading={loading}
      />

      {/* AI Scan Modal */}
      {isAiModalOpen && (
        <Modal 
          isOpen={isAiModalOpen} 
          onClose={() => { if(!mutationLoading) setIsAiModalOpen(false); }} 
          title="Scan Menu using Gemini AI"
        >
          {!scannedData ? (
             <form onSubmit={handleAiScan} className="space-y-4 p-2">
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
               <div className="flex justify-end gap-3 pt-4">
                  <Button variant="secondary" onClick={() => setIsAiModalOpen(false)} type="button">Cancel</Button>
                  <Button type="submit" isLoading={scanning} disabled={!file}>Start AI Scan</Button>
               </div>
             </form>
          ) : (
            <div className="space-y-4 p-2 max-h-[60vh] overflow-y-auto no-scrollbar">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Review scanned items from AI:</p>
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

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <Button variant="secondary" onClick={() => setScannedData(null)} disabled={mutationLoading}>Back / Scan Again</Button>
                <Button onClick={handleSaveScannedData} isLoading={mutationLoading}>Confirm & Save to DB</Button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* Forms & Modals */}
      <Modal 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        title={selectedProduct ? 'Edit Product' : 'New Product'}
      >
        <ProductForm 
          initialData={selectedProduct || undefined}
          onSubmit={handleCreateOrUpdate}
          onCancel={() => setIsFormOpen(false)}
          loading={mutationLoading}
        />
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
    </div>
  );
}
