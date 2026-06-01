'use client';

import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Product } from '@/lib/api/products';
import { categoriesApi, Category } from '@/lib/api/categories';
import { Box, Tag, DollarSign, Barcode, Layers, FileText, ShoppingBag, Trash2 } from 'lucide-react';
import { inventoryApi, StockItem } from '@/lib/api/inventory';

const restaurantProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(100),
  description: z.string().max(500).optional(),
  categoryId: z.string().min(1, 'Category is required'),
  productType: z.string().default('REVENUE'),
  costPrice: z.number().min(0, 'Cost price cannot be negative'),
  sellingPrice: z.number().min(0, 'Selling price cannot be negative'),
  halfPrice: z.union([z.number().min(0, 'Half price cannot be negative'), z.literal('')]).nullable().optional(),
  sku: z.string().max(50).optional(),
  barcode: z.string().max(50).optional(),
  hsnCode: z.string().max(20).optional(),
  taxRate: z.number().min(0, 'Tax rate cannot be negative').max(100, 'Tax rate max 100').nullable().optional(),
  taxType: z.enum(['INCLUSIVE', 'EXCLUSIVE', 'EXEMPT']).default('EXCLUSIVE'),
  image: z.string().optional(),
  trackInventory: z.boolean().default(false),
  isActive: z.boolean().default(true),
  isVeg: z.boolean().default(true),
  mealTimes: z.string().optional(),
  menuType: z.literal('RESTAURANT').default('RESTAURANT'),
  variants: z.array(z.object({
    name: z.string().min(1, 'Name required'),
    price: z.number().min(0, 'Price must be positive')
  })).optional(),
  unit: z.string().optional(),
  kitchenMapping: z.string().optional(),
});

interface RestaurantProductFormProps {
  initialData?: Product;
  onSubmit: (data: Partial<Product>) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const RestaurantProductForm: React.FC<RestaurantProductFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  loading
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: (initialData as any)?.description || '',
    categoryId: initialData?.categoryId || '',
    productType: initialData?.productType || 'REVENUE',
    costPrice: initialData?.costPrice || 0,
    sellingPrice: initialData?.sellingPrice || 0,
    halfPrice: (initialData as any)?.halfPrice || '',
    sku: initialData?.sku || '',
    barcode: initialData?.barcode || '',
    hsnCode: initialData?.hsnCode || '',
    taxRate: initialData?.taxRate ?? null,
    taxType: initialData?.taxType || 'EXCLUSIVE',
    image: initialData?.image || '',
    trackInventory: initialData?.trackInventory ?? false,
    isActive: initialData?.isActive ?? true,
    isVeg: initialData?.isVeg ?? true,
    mealTimes: initialData?.mealTimes ?? '',
    menuType: 'RESTAURANT' as const,
    unit: (initialData as any)?.unit || '',
    kitchenMapping: (initialData as any)?.kitchenMapping || '',
    variants: (initialData as any)?.variants?.map((v: any) => ({ name: v.name, price: v.price })) || [] as { name: string, price: number }[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    categoriesApi.list().then(cats => {
      setCategories(cats?.filter(c => c.menuType === 'RESTAURANT' || !c.menuType) || []);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const validated = restaurantProductSchema.parse(formData);
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-slate-800">
        <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600">
           <ShoppingBag size={20} />
        </div>
        <div>
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Restaurant Product</h3>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Add items to your main food menu</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Product Name</label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><Box size={16} /></div>
            <input
              type="text" placeholder="e.g. Classic Burger"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-slate-800 border ${errors.name ? 'border-red-400' : 'border-transparent dark:border-slate-700'} rounded-2xl text-sm font-bold dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-700 transition-all shadow-sm`}
            />
          </div>
          {errors.name && <p className="text-[10px] text-red-500 font-bold uppercase ml-1">{errors.name}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Description <span className="normal-case font-normal text-gray-300">(optional)</span></label>
          <textarea
            rows={2} placeholder="e.g. Crispy golden-fried chicken with special sauce..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-transparent dark:border-slate-700 rounded-2xl text-sm font-semibold dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-700 transition-all resize-none shadow-sm"
          />
        </div>

        <div className="flex gap-4">
          <div className="flex-shrink-0">
             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 block mb-1.5">Image</label>
             <div className="relative w-20 h-20 bg-gray-50 dark:bg-slate-800 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-2xl flex items-center justify-center overflow-hidden cursor-pointer hover:border-pos-primary/40 transition-colors shadow-sm">
                {formData.image ? (
                  <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center text-gray-300">
                    <Box size={24} />
                    <span className="text-[8px] font-black uppercase mt-1">Upload</span>
                  </div>
                )}
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
             </div>
          </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Category</label>
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              className={`w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border ${errors.categoryId ? 'border-red-400' : 'border-transparent dark:border-slate-700'} rounded-2xl text-sm font-bold dark:text-white focus:outline-none appearance-none shadow-sm`}
            >
              <option value="">Select Category</option>
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Unit</label>
            <select
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-transparent dark:border-slate-700 rounded-2xl text-sm font-bold dark:text-white focus:outline-none appearance-none shadow-sm"
            >
              <option value="">e.g. Plate, KG</option>
              <option value="PLATE">Plate</option>
              <option value="PCS">PCS (Pieces)</option>
              <option value="PORTION">Portion</option>
              <option value="KG">KG</option>
              <option value="LTR">LTR</option>
              <option value="BTL">Bottle</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Product Type</label>
            <select
              value={formData.productType}
              onChange={(e) => setFormData({ ...formData, productType: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-transparent dark:border-slate-700 rounded-2xl text-sm font-bold dark:text-white focus:outline-none appearance-none shadow-sm"
            >
              <option value="REVENUE">Revenue Item</option>
              <option value="COMPLIMENTARY">Complimentary</option>
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Dietary Preference</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setFormData({ ...formData, isVeg: true })}
            className={`flex items-center justify-center gap-2.5 py-3 rounded-2xl border-2 transition-all ${
              formData.isVeg
                ? 'border-emerald-500 bg-emerald-500/5 text-emerald-600 shadow-sm'
                : 'border-gray-100 dark:border-slate-800 text-gray-400 grayscale hover:grayscale-0'
            }`}
          >
            <div className="w-3.5 h-3.5 border-2 border-emerald-600 rounded-sm flex items-center justify-center bg-white shrink-0">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">VEG (Vegetarian)</span>
          </button>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, isVeg: false })}
            className={`flex items-center justify-center gap-2.5 py-3 rounded-2xl border-2 transition-all ${
              !formData.isVeg
                ? 'border-rose-500 bg-rose-500/5 text-rose-600 shadow-sm'
                : 'border-gray-100 dark:border-slate-800 text-gray-400 grayscale hover:grayscale-0'
            }`}
          >
            <div className="w-3.5 h-3.5 border-2 border-rose-600 rounded-sm flex items-center justify-center bg-white shrink-0">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-600" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">NON-VEG (Non-Vegetarian)</span>
          </button>
        </div>
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

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Selling Price</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</div>
              <input
                type="number" step="0.01" value={formData.sellingPrice}
                onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })}
                className="w-full pl-8 pr-3 py-3 bg-gray-50 dark:bg-slate-800 border border-transparent dark:border-slate-700 rounded-2xl text-sm font-bold dark:text-white shadow-sm focus:bg-white dark:focus:bg-slate-700 transition-all"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Half Price</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</div>
              <input
                type="number" step="0.01" value={formData.halfPrice}
                onChange={(e) => setFormData({ ...formData, halfPrice: e.target.value ? parseFloat(e.target.value) : '' })}
                className="w-full pl-8 pr-3 py-3 bg-gray-50 dark:bg-slate-800 border border-transparent dark:border-slate-700 rounded-2xl text-sm font-bold dark:text-white shadow-sm focus:bg-white dark:focus:bg-slate-700 transition-all"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Cost Price</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</div>
              <input
                type="number" step="0.01" value={formData.costPrice}
                onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
                className="w-full pl-8 pr-3 py-3 bg-gray-50 dark:bg-slate-800 border border-transparent dark:border-slate-700 rounded-2xl text-sm font-bold dark:text-white shadow-sm focus:bg-white dark:focus:bg-slate-700 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Identification & Taxation */}
        <div className="p-6 bg-slate-50/50 dark:bg-slate-800/30 rounded-3xl border border-slate-100 dark:border-slate-700/50 space-y-6">
           <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">SKU</label>
                <input
                  type="text" placeholder="e.g. FD-BK-01"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-transparent dark:border-slate-700 rounded-2xl text-sm font-bold dark:text-white shadow-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Barcode (Scanner ID)</label>
                <input
                  type="text" placeholder="Scanner ID"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-transparent dark:border-slate-700 rounded-2xl text-sm font-bold dark:text-white shadow-sm"
                />
              </div>
           </div>

           <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">HSN Code</label>
                <input
                  type="text" placeholder="e.g. 8517"
                  value={formData.hsnCode}
                  onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-transparent dark:border-slate-700 rounded-2xl text-sm font-bold dark:text-white shadow-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tax Rate (%)</label>
                <div className="relative">
                  <input
                    type="number" step="0.1" placeholder="e.g. 5"
                    value={formData.taxRate ?? ''}
                    onChange={(e) => setFormData({ ...formData, taxRate: e.target.value ? parseFloat(e.target.value) : null })}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-transparent dark:border-slate-700 rounded-2xl text-sm font-bold dark:text-white shadow-sm"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-300">%</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tax Type</label>
                <select
                  value={formData.taxType}
                  onChange={(e) => setFormData({ ...formData, taxType: e.target.value as any })}
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-transparent dark:border-slate-700 rounded-2xl text-sm font-bold dark:text-white shadow-sm appearance-none"
                >
                  <option value="EXCLUSIVE">Exclusive</option>
                  <option value="INCLUSIVE">Inclusive</option>
                  <option value="EXEMPT">Exempt</option>
                </select>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
           <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl shadow-sm border border-transparent dark:border-slate-700">
             <div>
               <h4 className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest leading-none">Inventory</h4>
               <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter mt-1">Track stock</p>
             </div>
             <button
               type="button" onClick={() => setFormData({ ...formData, trackInventory: !formData.trackInventory })}
               className={`w-10 h-5 rounded-full p-0.5 transition-colors ${formData.trackInventory ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-slate-700'}`}
             >
               <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow ${formData.trackInventory ? 'translate-x-5' : 'translate-x-0'}`} />
             </button>
           </div>
           <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl shadow-sm border border-transparent dark:border-slate-700">
             <div>
               <h4 className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest leading-none">Active</h4>
               <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter mt-1">Show in menu</p>
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

      {/* Product Variants Section */}
      <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-800/30 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers size={14} className="text-indigo-600" />
            <h4 className="text-[10px] font-black text-indigo-900 dark:text-indigo-400 uppercase tracking-widest">Product Variants (Sizes)</h4>
          </div>
          <button
            type="button"
            onClick={() => setFormData({ 
              ...formData, 
              variants: [...formData.variants, { name: '', price: 0 }] 
            })}
            className="text-[9px] font-black uppercase text-indigo-600 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
          >
            + Add Variant
          </button>
        </div>

        {formData.variants.length === 0 ? (
          <p className="text-[9px] text-gray-400 font-medium italic text-center py-2">
            No custom sizes added. Standard price will be used.
          </p>
        ) : (
          <div className="space-y-3">
            {formData.variants.map((variant: any, index: number) => (
              <div key={index} className="grid grid-cols-12 gap-3 items-center animate-in fade-in slide-in-from-top-2">
                <div className="col-span-6">
                  <input
                    type="text" placeholder="Size (e.g. Small)"
                    value={variant.name}
                    onChange={(e) => {
                      const newVariants = [...formData.variants];
                      newVariants[index].name = e.target.value;
                      setFormData({ ...formData, variants: newVariants });
                    }}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-400 transition-all dark:text-white"
                  />
                </div>
                <div className="col-span-4 relative">
                  <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400">₹</div>
                  <input
                    type="number" placeholder="Price"
                    value={variant.price || ''}
                    onChange={(e) => {
                      const newVariants = [...formData.variants];
                      newVariants[index].price = parseFloat(e.target.value) || 0;
                      setFormData({ ...formData, variants: newVariants });
                    }}
                    className="w-full pl-6 pr-3 py-2 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-400 transition-all dark:text-white"
                  />
                </div>
                <div className="col-span-2 flex justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      const newVariants = formData.variants.filter((_: any, i: number) => i !== index);
                      setFormData({ ...formData, variants: newVariants });
                    }}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px]">Cancel</Button>
        <Button type="submit" disabled={loading} className="flex-[2] py-4 bg-pos-primary hover:bg-red-700 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-pos-primary/20">{loading ? 'Saving...' : initialData ? 'Update Product' : 'Create Product'}</Button>
      </div>
    </form>
  );
};
