'use client';

import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Product } from '@/lib/api/products';
import { categoriesApi, Category } from '@/lib/api/categories';
import { Box, Tag, DollarSign, Barcode, Layers, FileText, FlaskConical, Droplets, ShoppingBag } from 'lucide-react';
import { inventoryApi, StockItem } from '@/lib/api/inventory';

const productSchema = z.object({
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
  menuType: z.enum(['RESTAURANT', 'BAR']).default('RESTAURANT'),
  pegSize: z.number().nullable().optional(),
  pegUnit: z.string().optional(),
  bottleSize: z.number().nullable().optional(),
  bottlePrice: z.number().nullable().optional(),
  pegPrice: z.number().nullable().optional(),
  stockItemId: z.string().nullable().optional(),
  isVeg: z.boolean().default(true),
  mealTimes: z.string().optional(),
  variants: z.array(z.object({
    name: z.string().min(1, 'Name required'),
    price: z.number().min(0, 'Price must be positive')
  })).optional(),
});

interface ProductFormProps {
  initialData?: Product;
  onSubmit: (data: Partial<Product>) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const ProductForm: React.FC<ProductFormProps> = ({
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
    halfPrice: (initialData as any)?.halfPrice || '',
    sku: initialData?.sku || '',
    barcode: initialData?.barcode || '',
    hsnCode: initialData?.hsnCode || '',
    taxRate: initialData?.taxRate ?? null,
    taxType: initialData?.taxType || 'EXCLUSIVE',
    image: initialData?.image || '',
    trackInventory: initialData?.trackInventory ?? false,
    isActive: initialData?.isActive ?? true,
    menuType: initialData?.menuType || 'RESTAURANT',
    pegSize: (initialData as any)?.pegSize ?? null,
    pegUnit: (initialData as any)?.pegUnit || 'ml',
    bottleSize: (initialData as any)?.bottleSize ?? null,
    bottlePrice: (initialData as any)?.bottlePrice ?? null,
    pegPrice: (initialData as any)?.pegPrice ?? null,
    stockItemId: (initialData as any)?.stockItemId || '',
    isVeg: initialData?.isVeg ?? true,
    mealTimes: initialData?.mealTimes ?? '',
    variants: (initialData as any)?.variants?.map((v: any) => ({ name: v.name, price: v.price })) || [] as { name: string, price: number }[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cats, stocks] = await Promise.all([
          categoriesApi.list(),
          inventoryApi.listStockItems()
        ]);
        setCategories(cats || []);
        setStockItems(stocks || []);
      } catch (err) {
        console.error('Failed to load form data', err);
      }
    };
    fetchData();
  }, []);

  // Sync selling price with peg price for bar items if selling price is 0
  useEffect(() => {
    if (formData.menuType === 'BAR' && formData.pegPrice && formData.sellingPrice === 0) {
      setFormData(prev => ({ ...prev, sellingPrice: prev.pegPrice || 0 }));
    }
  }, [formData.pegPrice, formData.menuType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    try {
      const validated = productSchema.parse(formData);
      await onSubmit(validated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        err.issues.forEach((issue: any) => {
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
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      });
      const data = await res.json();
      if (data.success) {
        setFormData({ ...formData, image: data.url });
      } else {
        alert(data.error || 'Upload failed');
      }
    } catch (err) {
      console.error('Upload error', err);
      alert('An error occurred during upload');
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* Row 0: Menu Category — TOP PRIORITY */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Menu Category</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setFormData({ ...formData, menuType: 'RESTAURANT', categoryId: '' })}
            className={`flex items-center justify-center gap-2 p-3 rounded-2xl border-2 transition-all ${
              formData.menuType === 'RESTAURANT'
                ? 'border-pos-primary bg-pos-primary/5 text-pos-primary shadow-sm'
                : 'border-gray-100 dark:border-slate-800 text-gray-400 grayscale hover:grayscale-0'
            }`}
          >
            <Layers size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">Restaurant</span>
          </button>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, menuType: 'BAR', categoryId: '' })}
            className={`flex items-center justify-center gap-2 p-3 rounded-2xl border-2 transition-all ${
              formData.menuType === 'BAR'
                ? 'border-amber-500 bg-amber-500/5 text-amber-600 shadow-sm'
                : 'border-gray-100 dark:border-slate-800 text-gray-400 grayscale hover:grayscale-0'
            }`}
          >
            <FlaskConical size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">Bar Menu</span>
          </button>
        </div>
      </div>

      {/* Row 1: Product Name (full width) */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Product Name</label>
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><Box size={15} /></div>
          <input
            type="text"
            placeholder="e.g. Classic Burger"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={`w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-800 border ${errors.name ? 'border-red-400' : 'border-transparent dark:border-slate-700'} rounded-xl text-sm font-semibold dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-700 transition-all`}
          />
        </div>
        {errors.name && <p className="text-[10px] text-red-500 font-bold uppercase ml-1">{errors.name}</p>}
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Description <span className="normal-case font-normal text-gray-300">(optional)</span></label>
        <div className="relative">
          <div className="absolute left-3 top-3 text-gray-400"><FileText size={14} /></div>
          <textarea
            rows={2}
            placeholder="e.g. Crispy golden-fried chicken with special sauce..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-transparent dark:border-slate-700 rounded-xl text-sm font-semibold dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-700 transition-all resize-none"
            maxLength={500}
          />
        </div>
        <p className="text-[9px] text-gray-300 ml-1">{formData.description.length}/500 characters</p>
      </div>

      {/* Row 2: Category + Product Type + Image (compact) */}
      <div className="flex gap-3 items-start">
        {/* Image upload — small compact box */}
        <div className="flex-shrink-0">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 block mb-1.5">Image</label>
          <div className="relative w-16 h-16 bg-gray-50 dark:bg-slate-800 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-xl flex items-center justify-center overflow-hidden cursor-pointer hover:border-pos-primary/40 transition-colors">
            {formData.image ? (
              <img src={formData.image} alt="Preview" className="w-full h-full object-cover rounded-xl" />
            ) : (
              <div className="flex flex-col items-center text-gray-300">
                <Box size={18} />
                <span className="text-[7px] font-black uppercase mt-0.5">Upload</span>
              </div>
            )}
            {uploading && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-xl">
                <div className="w-4 h-4 border-2 border-pos-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
          </div>
          {formData.image && (
            <button type="button" onClick={() => setFormData({ ...formData, image: '' })} className="text-[8px] font-black uppercase text-red-400 hover:text-red-600 mt-1 ml-1">
              Remove
            </button>
          )}
        </div>

        {/* Category + Product Type */}
        <div className="flex-1 grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Category</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Tag size={14} /></div>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className={`w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-slate-800 border ${errors.categoryId ? 'border-red-400' : 'border-transparent dark:border-slate-700'} rounded-xl text-sm font-semibold dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-700 transition-all appearance-none`}
              >
                <option value="">Select Category</option>
                {categories
                  .filter((cat: any) => !cat.menuType || cat.menuType === formData.menuType)
                  .map((cat: any) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
              </select>
            </div>
            {errors.categoryId && <p className="text-[10px] text-red-500 font-bold uppercase ml-1">{errors.categoryId}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Product Type</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Layers size={14} /></div>
              <select
                value={formData.productType}
                onChange={(e) => setFormData({ ...formData, productType: e.target.value })}
                className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-transparent dark:border-slate-700 rounded-xl text-sm font-semibold dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-700 transition-all appearance-none"
              >
                <option value="REVENUE">Revenue Item</option>
                <option value="COMPLIMENTARY">Complimentary</option>
                <option value="VOID">Void</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {formData.menuType === 'RESTAURANT' && (
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
      )}

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

      {/* Row 3: Prices */}
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
            {formData.menuType === 'BAR' ? 'Default / Base Price' : 'Selling Price'}
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><DollarSign size={14} /></div>
            <input
              type="number" step="0.01"
              value={formData.sellingPrice}
              onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })}
              className={`w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-slate-800 border ${errors.sellingPrice ? 'border-red-400' : 'border-transparent dark:border-slate-700'} rounded-xl text-sm font-semibold dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-700 transition-all`}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Half Price</label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><DollarSign size={14} /></div>
            <input
              type="number" step="0.01" placeholder="Auto 50%"
              value={formData.halfPrice}
              onChange={(e) => setFormData({ ...formData, halfPrice: e.target.value ? parseFloat(e.target.value) : '' })}
              className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-transparent dark:border-slate-700 rounded-xl text-sm font-semibold dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-700 transition-all"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Cost Price</label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><DollarSign size={14} /></div>
            <input
              type="number" step="0.01"
              value={formData.costPrice}
              onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
              className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-transparent dark:border-slate-700 rounded-xl text-sm font-semibold dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-700 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Row 4: SKU + Barcode */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">SKU</label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Barcode size={14} /></div>
            <input
              type="text" placeholder="e.g. FD-BK-01"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-transparent dark:border-slate-700 rounded-xl text-sm font-semibold dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-700 transition-all"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Barcode</label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Barcode size={14} /></div>
            <input
              type="text" placeholder="Scanner ID"
              value={formData.barcode}
              onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
              className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-transparent dark:border-slate-700 rounded-xl text-sm font-semibold dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-700 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Row 5: HSN Code + Tax Rate + Tax Type in a 3-column row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">HSN Code</label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><FileText size={14} /></div>
            <input
              type="text" placeholder="e.g. 8517"
              value={formData.hsnCode}
              onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value })}
              className={`w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-slate-800 border ${errors.hsnCode ? 'border-red-400' : 'border-transparent dark:border-slate-700'} rounded-xl text-sm font-semibold dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-700 transition-all`}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tax Rate (%)</label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><DollarSign size={14} /></div>
            <input
              type="number" step="0.01" placeholder="e.g. 5"
              value={formData.taxRate !== null && formData.taxRate !== undefined ? formData.taxRate : ''}
              onChange={(e) => setFormData({ ...formData, taxRate: e.target.value ? parseFloat(e.target.value) : null })}
              className={`w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-slate-800 border ${errors.taxRate ? 'border-red-400' : 'border-transparent dark:border-slate-700'} rounded-xl text-sm font-semibold dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-700 transition-all`}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tax Type</label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><FileText size={14} /></div>
            <select
              value={formData.taxType}
              onChange={(e) => setFormData({ ...formData, taxType: e.target.value as 'INCLUSIVE' | 'EXCLUSIVE' | 'EXEMPT' })}
              className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-transparent dark:border-slate-700 rounded-xl text-sm font-semibold dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-700 transition-all appearance-none"
            >
              <option value="EXCLUSIVE">Exclusive</option>
              <option value="INCLUSIVE">Inclusive</option>
              <option value="EXEMPT">Exempt (0%)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Row 6: Toggles */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-2xl">
          <div>
            <h4 className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest leading-none">Inventory</h4>
            <p className="text-[9px] text-gray-400 font-medium">Track stock</p>
          </div>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, trackInventory: !formData.trackInventory })}
            className={`w-10 h-5 rounded-full p-0.5 transition-colors ${formData.trackInventory ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-slate-700'}`}
          >
            <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow ${formData.trackInventory ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-2xl">
          <div>
            <h4 className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest leading-none">Active</h4>
            <p className="text-[9px] text-gray-400 font-medium">Show in menu</p>
          </div>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
            className={`w-10 h-5 rounded-full p-0.5 transition-colors ${formData.isActive ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-slate-700'}`}
          >
            <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow ${formData.isActive ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>



      {/* Bar Specific Section */}
      {formData.menuType === 'BAR' && (
        <div className="p-5 bg-amber-50/50 dark:bg-amber-950/20 rounded-[2rem] border border-amber-100 dark:border-amber-900/50 space-y-6 shadow-sm animate-in fade-in zoom-in-95 duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/50 rounded-full flex items-center justify-center">
                <FlaskConical size={16} className="text-amber-600" />
              </div>
              <div>
                <h4 className="text-[11px] font-black text-amber-900 dark:text-amber-400 uppercase tracking-widest leading-none">Bar Inventory & Pricing</h4>
                <p className="text-[9px] text-amber-700/60 dark:text-amber-500/50 font-bold uppercase tracking-tighter mt-1">Configure serving sizes and rates</p>
              </div>
            </div>
            <div className="px-3 py-1 bg-amber-100 dark:bg-amber-900/50 rounded-full">
               <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Bar Mode</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-5">
            {/* Bottle Configuration */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-amber-800/60 dark:text-amber-400/60 uppercase ml-1 tracking-widest">Bottle Volume</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-400 transition-transform group-focus-within:scale-110"><Droplets size={14} /></div>
                  <input
                    type="number"
                    placeholder="e.g. 750"
                    value={formData.bottleSize || ''}
                    onChange={(e) => setFormData({ ...formData, bottleSize: e.target.value ? Number(e.target.value) : null })}
                    className="w-full pl-10 pr-12 py-3 bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/50 rounded-2xl text-sm font-bold focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-400/5 transition-all dark:text-white"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-amber-600 uppercase">ml</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-amber-800/60 dark:text-amber-400/60 uppercase ml-1 tracking-widest">Bottle Price</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-400 transition-transform group-focus-within:scale-110"><DollarSign size={14} /></div>
                  <input
                    type="number"
                    placeholder="Full bottle rate"
                    value={formData.bottlePrice || ''}
                    onChange={(e) => setFormData({ ...formData, bottlePrice: e.target.value ? Number(e.target.value) : null })}
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/50 rounded-2xl text-sm font-bold focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-400/5 transition-all dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Peg Configuration */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-amber-800/60 dark:text-amber-400/60 uppercase ml-1 tracking-widest">Peg Size</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-400 transition-transform group-focus-within:scale-110"><FlaskConical size={14} /></div>
                  <input
                    type="number"
                    placeholder="e.g. 30"
                    value={formData.pegSize || ''}
                    onChange={(e) => setFormData({ ...formData, pegSize: e.target.value ? Number(e.target.value) : null })}
                    className="w-full pl-10 pr-12 py-3 bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/50 rounded-2xl text-sm font-bold focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-400/5 transition-all dark:text-white"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-amber-600 uppercase">ml</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-amber-800/60 dark:text-amber-400/60 uppercase ml-1 tracking-widest">Peg Price</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-400 transition-transform group-focus-within:scale-110"><DollarSign size={14} /></div>
                  <input
                    type="number"
                    placeholder="Standard peg rate"
                    value={formData.pegPrice || ''}
                    onChange={(e) => setFormData({ ...formData, pegPrice: e.target.value ? Number(e.target.value) : null })}
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/50 rounded-2xl text-sm font-bold focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-400/5 transition-all dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-1.5 pt-2">
            <label className="text-[10px] font-black text-amber-800/60 dark:text-amber-400/60 uppercase ml-1 tracking-widest">Map to Inventory (Stock Item)</label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-400 transition-transform group-focus-within:scale-110"><Box size={14} /></div>
              <select
                value={formData.stockItemId || ''}
                onChange={(e) => setFormData({ ...formData, stockItemId: e.target.value })}
                className="w-full pl-10 pr-10 py-3 bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/50 rounded-2xl text-sm font-bold focus:outline-none focus:border-amber-400 transition-all appearance-none dark:text-white"
              >
                <option value="">Select Bottle Item from Inventory</option>
                {stockItems.map((item: any) => (
                  <option key={item.id} value={item.id}>{item.name} ({item.unit})</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-amber-400"><Layers size={14} /></div>
            </div>
          </div>

          <div className="bg-amber-100/50 dark:bg-amber-900/30 p-3 rounded-xl border border-amber-200/50 dark:border-amber-800/30">
            <p className="text-[9px] text-amber-800 dark:text-amber-300 font-bold uppercase tracking-widest text-center leading-relaxed">
              Deducts <span className="text-amber-600 underline">{formData.pegSize || 'XX'}ml</span> from <span className="text-amber-600 underline">"{stockItems.find(s => s.id === formData.stockItemId)?.name || 'Bottle'}"</span> on each serving
            </p>
          </div>
        </div>
      )}

      {/* Product Variants Section */}
      <div className="p-4 bg-pos-primary/5 dark:bg-pos-primary/10 rounded-2xl border border-pos-primary/10 dark:border-pos-primary/30 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers size={14} className="text-pos-primary" />
            <h4 className="text-[10px] font-black text-pos-primary uppercase tracking-widest">Product Variants (Sizes)</h4>
          </div>
          <button
            type="button"
            onClick={() => setFormData({ 
              ...formData, 
              variants: [...formData.variants, { name: '', price: 0 }] 
            })}
            className="text-[9px] font-black uppercase text-pos-primary bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-pos-primary/20 hover:bg-pos-primary hover:text-white transition-all shadow-sm"
          >
            + Add Variant
          </button>
        </div>

        {formData.variants.length === 0 ? (
          <p className="text-[9px] text-gray-400 font-medium italic text-center py-2">
            No custom sizes added. Default price will be used.
          </p>
        ) : (
          <div className="space-y-3">
            {formData.variants.map((variant: any, index: number) => (
              <div key={index} className="grid grid-cols-12 gap-3 items-center animate-in fade-in slide-in-from-top-2">
                <div className="col-span-6">
                  <input
                    type="text"
                    placeholder="Size (e.g. Small)"
                    value={variant.name}
                    onChange={(e) => {
                      const newVariants = [...formData.variants];
                      newVariants[index].name = e.target.value;
                      setFormData({ ...formData, variants: newVariants });
                    }}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-pos-primary transition-all dark:text-white"
                  />
                </div>
                <div className="col-span-4 relative">
                  <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400">₹</div>
                  <input
                    type="number"
                    placeholder="Price"
                    value={variant.price || ''}
                    onChange={(e) => {
                      const newVariants = [...formData.variants];
                      newVariants[index].price = parseFloat(e.target.value) || 0;
                      setFormData({ ...formData, variants: newVariants });
                    }}
                    className="w-full pl-6 pr-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-pos-primary transition-all dark:text-white"
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
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          className="flex-1 py-3 rounded-2xl border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 font-black uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-slate-700 text-[10px]"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="flex-[2] py-3 bg-pos-primary hover:bg-red-700 text-white rounded-2xl font-black uppercase tracking-widest gap-2 shadow-xl shadow-pos-primary/30 active:scale-95 transition-all text-[10px] disabled:opacity-50"
        >
          {loading ? 'Saving...' : initialData ? 'Update Product' : 'Create Product'}
        </Button>
      </div>
    </form>
  );
};

