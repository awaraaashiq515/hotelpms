'use client';

import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Product } from '@/lib/api/products';
import { categoriesApi, Category } from '@/lib/api/categories';
import { Box, Tag, DollarSign, Barcode, Layers, FileText, Coffee, Droplets, Trash2, PlusCircle } from 'lucide-react';
import { inventoryApi, StockItem } from '@/lib/api/inventory';

const cafeProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(100),
  description: z.string().max(500).optional(),
  categoryId: z.string().min(1, 'Category is required'),
  productType: z.string().default('REVENUE'),
  costPrice: z.number().min(0, 'Cost price cannot be negative'),
  sellingPrice: z.number().min(0).default(0),
  sku: z.string().max(50).optional(),
  barcode: z.string().max(50).optional(),
  hsnCode: z.string().max(20).optional(),
  taxRate: z.number().min(0, 'Tax rate cannot be negative').max(100, 'Tax rate max 100').nullable().optional(),
  taxType: z.enum(['INCLUSIVE', 'EXCLUSIVE', 'EXEMPT']).default('EXCLUSIVE'),
  image: z.string().optional(),
  trackInventory: z.boolean().default(false),
  isActive: z.boolean().default(true),
  mealTimes: z.string().optional(),
  menuType: z.literal('CAFE').default('CAFE'),
  bottleSize: z.number().nullable().optional(),
  bottlePrice: z.number().nullable().optional(),
  stockItemId: z.string().nullable().optional(),
  variants: z.array(z.object({
    name: z.string().min(1, 'Size name required'),
    price: z.number().min(0, 'Price required')
  })).optional(),
});

interface CafeProductFormProps {
  initialData?: Product;
  onSubmit: (data: Partial<Product>) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const CafeProductForm: React.FC<CafeProductFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  loading
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: (initialData as any)?.description || '',
    categoryId: initialData?.categoryId || '',
    productType: initialData?.productType || 'REVENUE',
    costPrice: initialData?.costPrice || 0,
    sellingPrice: initialData?.sellingPrice || 0,
    sku: initialData?.sku || '',
    barcode: initialData?.barcode || '',
    hsnCode: initialData?.hsnCode || '',
    taxRate: initialData?.taxRate ?? null,
    taxType: initialData?.taxType || 'EXCLUSIVE',
    image: initialData?.image || '',
    trackInventory: initialData?.trackInventory ?? false,
    isActive: initialData?.isActive ?? true,
    mealTimes: initialData?.mealTimes ?? '',
    menuType: 'CAFE' as const,
    bottleSize: (initialData as any)?.bottleSize ?? 250,
    bottlePrice: (initialData as any)?.bottlePrice ?? 0,
    stockItemId: (initialData as any)?.stockItemId || '',
    variants: (initialData as any)?.variants?.map((v: any) => ({ name: v.name, price: v.price })) || [{ name: 'Regular', price: 0 }] as { name: string, price: number }[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const [cats, stocks] = await Promise.all([
        categoriesApi.list(),
        inventoryApi.listStockItems()
      ]);
      setCategories(cats?.filter(c => c.menuType === 'CAFE') || []);
      setStockItems(stocks || []);
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const finalFormData = { ...formData };
      if (formData.variants.length > 0) {
        finalFormData.sellingPrice = formData.variants[0].price;
      }
      
      const validated = cafeProductSchema.parse(finalFormData);
      await onSubmit(validated);
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

  const addVariant = () => {
    setFormData({
      ...formData,
      variants: [...formData.variants, { name: '', price: 0 }]
    });
  };

  const removeVariant = (index: number) => {
    setFormData({
      ...formData,
      variants: formData.variants.filter((_: any, i: number) => i !== index)
    });
  };

  const updateVariant = (index: number, field: 'name' | 'price', value: string | number) => {
    const newVariants = [...formData.variants];
    (newVariants[index] as any)[field] = value;
    setFormData({ ...formData, variants: newVariants });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-slate-800">
        <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/30 rounded-xl flex items-center justify-center text-orange-600">
           <Coffee size={20} />
        </div>
        <div>
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Cafe Menu Product</h3>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Manage beverages, cup sizes and beans</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
         <div className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Product Name</label>
              <input
                type="text" placeholder="e.g. Espresso"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border ${errors.name ? 'border-red-400' : 'border-transparent dark:border-slate-700'} rounded-2xl text-sm font-bold dark:text-white focus:outline-none shadow-sm transition-all focus:bg-white dark:focus:bg-slate-700`}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Category</label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-transparent dark:border-slate-700 rounded-2xl text-sm font-bold dark:text-white focus:outline-none appearance-none shadow-sm"
                >
                  <option value="">Select Category</option>
                  {categories.map((cat: any) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Cost Price</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</div>
                  <input
                    type="number" step="0.01" value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-7 pr-3 py-3 bg-gray-50 dark:bg-slate-800 border border-transparent dark:border-slate-700 rounded-2xl text-sm font-bold dark:text-white shadow-sm"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Description</label>
                <textarea
                  rows={2} placeholder="Optional details..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-transparent dark:border-slate-700 rounded-2xl text-sm font-semibold dark:text-white focus:outline-none shadow-sm resize-none"
                />
            </div>

            {/* Meal Sessions */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 block mb-1">Meal Sessions</label>
              <div className="grid grid-cols-3 gap-2">
                {['BREAKFAST', 'LUNCH', 'DINNER'].map((meal) => {
                  const currentMeals = formData.mealTimes ? formData.mealTimes.split(',') : [];
                  const isSelected = currentMeals.includes(meal);
                  const label = meal === 'BREAKFAST' ? 'Breakfast 🍳' : meal === 'LUNCH' ? 'Lunch 🍲' : 'Dinner 🕯️';
                  
                  const handleToggle = () => {
                    let updated: string[];
                    if (isSelected) {
                      updated = currentMeals.filter(m => m !== meal);
                    } else {
                      updated = [...currentMeals, meal];
                    }
                    setFormData({ ...formData, mealTimes: updated.join(',') });
                  };

                  return (
                    <button
                      key={meal}
                      type="button"
                      onClick={handleToggle}
                      className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border transition-all text-[11px] font-bold ${
                        isSelected
                          ? 'border-pos-primary bg-pos-primary/5 text-pos-primary shadow-sm font-black'
                          : 'border-gray-200 dark:border-slate-800 text-gray-400 hover:border-gray-300 dark:hover:border-slate-700'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-5 bg-gray-50 dark:bg-slate-800/50 rounded-3xl border border-gray-100 dark:border-slate-700/50 space-y-4">
               <div className="flex items-center gap-2">
                  <Barcode size={14} className="text-gray-400" />
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Inventory & Codes</h4>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-tight ml-1">SKU</label>
                    <input type="text" value={formData.sku} onChange={(e) => setFormData({...formData, sku: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-transparent dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-tight ml-1">HSN CODE</label>
                    <input type="text" value={formData.hsnCode} onChange={(e) => setFormData({...formData, hsnCode: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-transparent dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white" />
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-tight ml-1">Tax Rate (%)</label>
                    <input type="number" step="0.1" value={formData.taxRate ?? ''} onChange={(e) => setFormData({...formData, taxRate: e.target.value ? parseFloat(e.target.value) : null})} className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-transparent dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-tight ml-1">Tax Type</label>
                    <select value={formData.taxType} onChange={(e) => setFormData({...formData, taxType: e.target.value as any})} className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-transparent dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white appearance-none">
                      <option value="EXCLUSIVE">Exclusive</option>
                      <option value="INCLUSIVE">Inclusive</option>
                      <option value="EXEMPT">Exempt</option>
                    </select>
                  </div>
               </div>
               <div className="flex items-center justify-between pt-2">
                 <span className="text-[10px] font-black text-gray-500 uppercase">Track Inventory</span>
                 <button type="button" onClick={() => setFormData({...formData, trackInventory: !formData.trackInventory})} className={`w-8 h-4 rounded-full transition-colors ${formData.trackInventory ? 'bg-emerald-500' : 'bg-gray-300'}`}><div className={`w-3 h-3 bg-white rounded-full transition-transform ${formData.trackInventory ? 'translate-x-4' : 'translate-x-0.5'}`} /></button>
               </div>
            </div>
         </div>

         <div className="space-y-6">
            <div className="p-6 bg-orange-50/50 dark:bg-orange-950/20 rounded-[2.5rem] border border-orange-100 dark:border-orange-900/50 space-y-6 shadow-sm">
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2">
                   <Coffee size={16} className="text-orange-600" />
                   <h4 className="text-[11px] font-black text-orange-900 dark:text-orange-400 uppercase tracking-widest">Cup Sizes & Pricing</h4>
                 </div>
                 <button 
                   type="button" 
                   onClick={addVariant}
                   className="flex items-center gap-1.5 px-3 py-1.5 bg-[#D2691E] hover:bg-[#B55A1A] text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-md shadow-orange-200"
                 >
                   <PlusCircle size={12} />
                   Add Size
                 </button>
               </div>

               <div className="space-y-3">
                 {formData.variants.map((variant: any, index: number) => (
                   <div key={index} className="flex gap-3 items-center group animate-in fade-in slide-in-from-right-2">
                     <div className="flex-1 relative">
                       <input
                         type="text" placeholder="Size (e.g. Regular, Large)"
                         value={variant.name}
                         onChange={(e) => updateVariant(index, 'name', e.target.value)}
                         className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-orange-200 dark:border-orange-800/50 rounded-2xl text-xs font-bold dark:text-white focus:ring-2 focus:ring-orange-400/20 outline-none"
                       />
                     </div>
                     <div className="w-32 relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-600/50 font-bold text-[10px]">₹</div>
                        <input
                          type="number" placeholder="Price"
                          value={variant.price || ''}
                          onChange={(e) => updateVariant(index, 'price', parseFloat(e.target.value) || 0)}
                          className="w-full pl-7 pr-3 py-2.5 bg-white dark:bg-slate-900 border border-orange-200 dark:border-orange-800/50 rounded-2xl text-xs font-black dark:text-white focus:ring-2 focus:ring-orange-400/20 outline-none text-right"
                        />
                     </div>
                     {formData.variants.length > 1 && (
                       <button 
                         type="button" 
                         onClick={() => removeVariant(index)}
                         className="p-2 text-orange-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                       >
                         <Trash2 size={14} />
                       </button>
                     )}
                   </div>
                 ))}
               </div>

               <div className="pt-4 border-t border-orange-100 dark:border-orange-900/30 space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Coffee size={14} className="text-orange-600" />
                    <h4 className="text-[10px] font-black text-orange-800 dark:text-orange-500 uppercase tracking-widest">Bulk Inventory Mapping</h4>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-orange-800/60 uppercase ml-1">Bulk Size (g/ml)</label>
                      <div className="relative">
                        <input type="number" value={formData.bottleSize || ''} onChange={(e) => setFormData({...formData, bottleSize: Number(e.target.value)})} className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-orange-200 dark:border-orange-800/50 rounded-2xl text-xs font-bold dark:text-white focus:ring-2 focus:ring-orange-400/20 outline-none" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-orange-800/60 uppercase ml-1">Bulk Selling Price</label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-600/50 font-bold text-[10px]">₹</div>
                        <input type="number" value={formData.bottlePrice || ''} onChange={(e) => setFormData({...formData, bottlePrice: Number(e.target.value)})} className="w-full pl-7 pr-3 py-2.5 bg-white dark:bg-slate-900 border border-orange-200 dark:border-orange-800/50 rounded-2xl text-xs font-bold dark:text-white focus:ring-2 focus:ring-orange-400/20 outline-none text-right" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-orange-800/60 uppercase ml-1">Inventory Item (Deduction)</label>
                    <select
                      value={formData.stockItemId || ''}
                      onChange={(e) => setFormData({ ...formData, stockItemId: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-orange-200 dark:border-orange-800/50 rounded-2xl text-xs font-bold dark:text-white appearance-none focus:ring-2 focus:ring-orange-400/20 outline-none"
                    >
                      <option value="">Select Bulk Item from Stock</option>
                      {stockItems.map((item: any) => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </select>
                  </div>
               </div>
            </div>

            <div className="flex items-center justify-between p-5 bg-gray-50 dark:bg-slate-800/50 rounded-3xl border border-gray-100 dark:border-slate-700/50">
               <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${formData.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                  <div>
                    <h4 className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest leading-none">Product Status</h4>
                    <p className="text-[9px] text-gray-400 font-bold uppercase mt-1">Visible in Cafe POS</p>
                  </div>
               </div>
               <button
                 type="button" onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                 className={`w-10 h-5 rounded-full p-0.5 transition-colors ${formData.isActive ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-slate-700'}`}
               >
                 <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow ${formData.isActive ? 'translate-x-5' : 'translate-x-0'}`} />
               </button>
            </div>
         </div>
      </div>

      <div className="flex gap-4 pt-8 border-t border-gray-100 dark:border-slate-800 mt-8">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] border-2">Cancel</Button>
        <Button type="submit" disabled={loading} className="flex-[2] py-4 bg-[#D2691E] hover:bg-[#B55A1A] text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-orange-200/40">{loading ? 'Saving...' : initialData ? 'Update Cafe Product' : 'Create Cafe Product'}</Button>
      </div>
    </form>
  );
};
