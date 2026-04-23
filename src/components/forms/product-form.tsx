'use client';

import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Product } from '@/lib/api/products';
import { categoriesApi, Category } from '@/lib/api/categories';
import { Box, Tag, DollarSign, Barcode, Layers, FileText } from 'lucide-react';

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(100),
  description: z.string().max(500).optional(),
  categoryId: z.string().min(1, 'Category is required'),
  productType: z.string().default('REVENUE'),
  costPrice: z.number().min(0, 'Cost price cannot be negative'),
  sellingPrice: z.number().min(0, 'Selling price cannot be negative'),
  sku: z.string().max(50).optional(),
  barcode: z.string().max(50).optional(),
  hsnCode: z.string().max(20).optional(),
  taxRate: z.number().min(0, 'Tax rate cannot be negative').max(100, 'Tax rate max 100').nullable().optional(),
  taxType: z.enum(['INCLUSIVE', 'EXCLUSIVE', 'EXEMPT']).default('EXCLUSIVE'),
  image: z.string().optional(),
  trackInventory: z.boolean().default(false),
  isActive: z.boolean().default(true),
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
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await categoriesApi.list();
        setCategories(data || []);
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    };
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    try {
      const validated = productSchema.parse(formData);
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
                {categories.map((cat) => (
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

      {/* Row 3: Selling Price + Cost Price */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Selling Price</label>
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

