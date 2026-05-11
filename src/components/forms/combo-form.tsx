'use client';

import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { productsApi, Product } from '@/lib/api/products';
import { combosApi, Combo, ComboItem } from '@/lib/api/combos';
import { Box, Tag, DollarSign, Package, ShoppingBag, Trash2, Search, Plus, Minus } from 'lucide-react';

const comboSchema = z.object({
  name: z.string().min(1, 'Combo name is required').max(100),
  description: z.string().max(500).optional(),
  price: z.number().min(0, 'Price cannot be negative'),
  image: z.string().optional(),
  isActive: z.boolean().default(true),
  items: z.array(z.object({
    productId: z.string().min(1, 'Product is required'),
    quantity: z.number().min(1, 'Quantity must be at least 1')
  })).min(1, 'At least one product is required in a combo'),
});

interface ComboFormProps {
  initialData?: Combo;
  onSubmit: (data: Partial<Combo>) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const ComboForm: React.FC<ComboFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  loading
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    price: initialData?.price || 0,
    image: initialData?.image || '',
    isActive: initialData?.isActive ?? true,
    items: initialData?.items?.map(item => ({
      productId: item.productId,
      quantity: item.quantity
    })) || [] as { productId: string, quantity: number }[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    productsApi.list().then(data => setProducts(data || []));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const validated = comboSchema.parse(formData);
      await onSubmit(validated as any);
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        err.issues.forEach((issue) => {
          if (issue.path[0]) fieldErrors[issue.path[0] as string] = issue.message;
        });
        setErrors(fieldErrors);
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formDataUpload });
      const data = await res.json();
      if (data.success) setFormData({ ...formData, image: data.url });
    } catch (err) { console.error(err); } finally { setUploading(false); }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) &&
    !formData.items.some(item => item.productId === p.id)
  );

  const addProductToCombo = (product: Product) => {
    setFormData({
      ...formData,
      items: [...formData.items, { productId: product.id, quantity: 1 }]
    });
    setSearch('');
  };

  const removeProductFromCombo = (productId: string) => {
    setFormData({
      ...formData,
      items: formData.items.filter(item => item.productId !== productId)
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setFormData({
      ...formData,
      items: formData.items.map(item => 
        item.productId === productId 
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      )
    });
  };

  const getProductName = (id: string) => products.find(p => p.id === id)?.name || 'Unknown Product';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-slate-800">
        <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/30 rounded-xl flex items-center justify-center text-orange-600">
           <Package size={20} />
        </div>
        <div>
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Product Combo</h3>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Create a bundle of multiple items</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Combo Name</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><ShoppingBag size={16} /></div>
              <input
                type="text" placeholder="e.g. Family Feast Combo"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-slate-800 border ${errors.name ? 'border-red-400' : 'border-transparent dark:border-slate-700'} rounded-2xl text-sm font-bold dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-700 transition-all shadow-sm`}
              />
            </div>
            {errors.name && <p className="text-[10px] text-red-500 font-bold uppercase ml-1">{errors.name}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Combo Price</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><DollarSign size={16} /></div>
              <input
                type="number" step="0.01" placeholder="0.00"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                className={`w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-slate-800 border ${errors.price ? 'border-red-400' : 'border-transparent dark:border-slate-700'} rounded-2xl text-sm font-bold dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-700 transition-all shadow-sm`}
              />
            </div>
            {errors.price && <p className="text-[10px] text-red-500 font-bold uppercase ml-1">{errors.price}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Description</label>
            <textarea
              rows={3} placeholder="What's included in this combo?"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-transparent dark:border-slate-700 rounded-2xl text-sm font-semibold dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-700 transition-all resize-none shadow-sm"
            />
          </div>

          <div className="space-y-1.5">
             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 block mb-1.5">Combo Image</label>
             <div className="relative w-full h-32 bg-gray-50 dark:bg-slate-800 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-2xl flex items-center justify-center overflow-hidden cursor-pointer hover:border-orange-400/40 transition-colors shadow-sm">
                {formData.image ? (
                  <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center text-gray-300">
                    <Box size={32} />
                    <span className="text-[10px] font-black uppercase mt-1">Upload Combo Image</span>
                  </div>
                )}
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
             </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Add Products to Combo</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><Search size={16} /></div>
              <input
                type="text" placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-slate-800 border border-transparent dark:border-slate-700 rounded-2xl text-sm font-bold dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-700 transition-all shadow-sm"
              />
              {search && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl shadow-xl z-50 max-h-48 overflow-y-auto no-scrollbar">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => addProductToCombo(p)}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-orange-50 dark:hover:bg-orange-900/20 text-left transition-colors border-b border-gray-50 dark:border-slate-700/50 last:border-0"
                      >
                        <span className="text-sm font-bold text-gray-700 dark:text-slate-200">{p.name}</span>
                        <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest">₹{p.sellingPrice}</span>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">No products found</div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Selected Items</label>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1 no-scrollbar">
              {formData.items.length > 0 ? (
                formData.items.map((item, index) => (
                  <div key={item.productId} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl shadow-sm animate-in slide-in-from-right-2">
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-gray-800 dark:text-slate-200 uppercase tracking-tight">{getProductName(item.productId)}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-800 p-1 rounded-xl border border-gray-100 dark:border-slate-700">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, -1)}
                          className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-gray-400 hover:text-orange-600 transition-all shadow-sm"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="text-xs font-black w-6 text-center text-gray-700 dark:text-slate-200">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, 1)}
                          className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-gray-400 hover:text-orange-600 transition-all shadow-sm"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeProductFromCombo(item.productId)}
                        className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-slate-700">
                  <Package className="mx-auto text-gray-300 mb-2" size={24} />
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No products selected</p>
                </div>
              )}
            </div>
            {errors.items && <p className="text-[10px] text-red-500 font-bold uppercase ml-1">{errors.items}</p>}
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-6 border-t border-gray-100 dark:border-slate-800">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px]">Cancel</Button>
        <Button 
          type="submit" 
          disabled={loading} 
          className="flex-[2] py-4 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-orange-200 dark:shadow-none"
        >
          {loading ? 'Saving...' : initialData ? 'Update Combo' : 'Create Combo'}
        </Button>
      </div>
    </form>
  );
};
