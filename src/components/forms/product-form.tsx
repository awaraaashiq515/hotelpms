'use client';

import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Product } from '@/lib/api/products';
import { categoriesApi, Category } from '@/lib/api/categories';
import { Box, Tag, DollarSign, Barcode, Layers, FileText } from 'lucide-react';

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(100),
  categoryId: z.string().min(1, 'Category is required'),
  productType: z.string().default('REVENUE'),
  costPrice: z.number().min(0, 'Cost price cannot be negative'),
  sellingPrice: z.number().min(0, 'Selling price cannot be negative'),
  sku: z.string().max(50).optional(),
  barcode: z.string().max(50).optional(),
  hsnCode: z.string().max(20).optional(),
  taxRate: z.number().min(0, 'Tax rate cannot be negative').max(100, 'Tax rate max 100').nullable().optional(),
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
    categoryId: initialData?.categoryId || '',
    productType: initialData?.productType || 'REVENUE',
    costPrice: initialData?.costPrice || 0,
    sellingPrice: initialData?.sellingPrice || 0,
    sku: initialData?.sku || '',
    barcode: initialData?.barcode || '',
    hsnCode: initialData?.hsnCode || '',
    taxRate: initialData?.taxRate ?? null,
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
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Basic Info */}
      <div className="space-y-2">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
          Product Name
        </label>
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            <Box size={16} />
          </div>
          <input
            type="text"
            placeholder="e.g. Classic Burger"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={`w-full pl-11 pr-4 py-3 bg-gray-50 border ${errors.name ? 'border-red-400' : 'border-transparent'} rounded-xl text-sm font-semibold focus:outline-none focus:bg-white focus:border-pos-primary/20 transition-all`}
          />
        </div>
        {errors.name && <p className="text-[10px] text-red-500 font-bold uppercase ml-1">{errors.name}</p>}
      </div>

      {/* Image Upload */}
      <div className="space-y-3">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
          Product Image
        </label>
        <div className="flex items-center gap-6 p-4 bg-gray-50/50 border-2 border-dashed border-gray-200 rounded-[24px] hover:border-pos-primary/30 transition-colors">
          <div className="relative w-24 h-24 bg-white rounded-2xl border border-gray-100 flex items-center justify-center overflow-hidden shadow-sm">
            {formData.image ? (
              <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center text-gray-300">
                <Box size={24} />
                <span className="text-[8px] font-black uppercase mt-1">No Image</span>
              </div>
            )}
            {uploading && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-pos-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          
          <div className="flex-1 space-y-2">
            <p className="text-[11px] font-bold text-gray-500">
              {formData.image ? 'Change product image' : 'Upload a product image'}
            </p>
            <p className="text-[9px] text-gray-400 uppercase tracking-widest">
              JPG, PNG or WEBP. Max 2MB.
            </p>
            <div className="flex items-center gap-2">
              <label className="cursor-pointer px-4 py-2 bg-white border border-gray-200 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-colors shadow-sm">
                {uploading ? 'Uploading...' : formData.image ? 'Change Image' : 'Select File'}
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
              </label>
              {formData.image && (
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, image: '' })}
                  className="text-[9px] font-black uppercase text-red-500 hover:text-red-700 tracking-widest ml-2"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
            Category
          </label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <Tag size={16} />
            </div>
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              className={`w-full pl-11 pr-4 py-3 bg-gray-50 border ${errors.categoryId ? 'border-red-400' : 'border-transparent'} rounded-xl text-sm font-semibold focus:outline-none focus:bg-white focus:border-pos-primary/20 transition-all appearance-none`}
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          {errors.categoryId && <p className="text-[10px] text-red-500 font-bold uppercase ml-1">{errors.categoryId}</p>}
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
            Product Type
          </label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <Layers size={16} />
            </div>
            <select
              value={formData.productType}
              onChange={(e) => setFormData({ ...formData, productType: e.target.value })}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-transparent rounded-xl text-sm font-semibold focus:outline-none focus:bg-white focus:border-pos-primary/20 transition-all appearance-none"
            >
              <option value="REVENUE">Revenue Item</option>
              <option value="COMPLIMENTARY">Complimentary</option>
              <option value="VOID">Void</option>
            </select>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
            Selling Price
          </label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <DollarSign size={16} />
            </div>
            <input
              type="number"
              step="0.01"
              value={formData.sellingPrice}
              onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })}
              className={`w-full pl-11 pr-4 py-3 bg-gray-50 border ${errors.sellingPrice ? 'border-red-400' : 'border-transparent'} rounded-xl text-sm font-semibold focus:outline-none focus:bg-white focus:border-pos-primary/20 transition-all`}
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
            Cost Price
          </label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <DollarSign size={16} />
            </div>
            <input
              type="number"
              step="0.01"
              value={formData.costPrice}
              onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-transparent rounded-xl text-sm font-semibold focus:outline-none focus:bg-white focus:border-pos-primary/20 transition-all"
            />
          </div>
        </div>
      </div>

      {/* SKU & Barcode */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
            SKU
          </label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <Barcode size={16} />
            </div>
            <input
              type="text"
              placeholder="e.g. FD-BK-01"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-transparent rounded-xl text-sm font-semibold focus:outline-none focus:bg-white focus:border-pos-primary/20 transition-all"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
            Barcode
          </label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <Barcode size={16} />
            </div>
            <input
              type="text"
              placeholder="Scanner ID"
              value={formData.barcode}
              onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-transparent rounded-xl text-sm font-semibold focus:outline-none focus:bg-white focus:border-pos-primary/20 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Tax & HSN */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
            HSN Code
          </label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <FileText size={16} />
            </div>
            <input
              type="text"
              placeholder="e.g. 8517"
              value={formData.hsnCode}
              onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value })}
              className={`w-full pl-11 pr-4 py-3 bg-gray-50 border ${errors.hsnCode ? 'border-red-400' : 'border-transparent'} rounded-xl text-sm font-semibold focus:outline-none focus:bg-white focus:border-pos-primary/20 transition-all`}
            />
          </div>
          {errors.hsnCode && <p className="text-[10px] text-red-500 font-bold uppercase ml-1">{errors.hsnCode}</p>}
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
            Tax Rate (%)
          </label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <DollarSign size={16} />
            </div>
            <input
              type="number"
              step="0.01"
              placeholder="e.g. 5"
              value={formData.taxRate !== null && formData.taxRate !== undefined ? formData.taxRate : ''}
              onChange={(e) => setFormData({ ...formData, taxRate: e.target.value ? parseFloat(e.target.value) : null })}
              className={`w-full pl-11 pr-4 py-3 bg-gray-50 border ${errors.taxRate ? 'border-red-400' : 'border-transparent'} rounded-xl text-sm font-semibold focus:outline-none focus:bg-white focus:border-pos-primary/20 transition-all`}
            />
          </div>
          {errors.taxRate && <p className="text-[10px] text-red-500 font-bold uppercase ml-1">{errors.taxRate}</p>}
        </div>
      </div>

      {/* Toggles */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
          <div>
            <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest leading-none">Inventory</h4>
            <p className="text-[9px] text-gray-400 font-medium">Track stock</p>
          </div>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, trackInventory: !formData.trackInventory })}
            className={`w-10 h-5 rounded-full p-1 transition-colors ${formData.trackInventory ? 'bg-emerald-500' : 'bg-gray-300'}`}
          >
            <div className={`w-3 h-3 bg-white rounded-full transition-transform ${formData.trackInventory ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
          <div>
            <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest leading-none">Active</h4>
            <p className="text-[9px] text-gray-400 font-medium">Show in menu</p>
          </div>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
            className={`w-10 h-5 rounded-full p-1 transition-colors ${formData.isActive ? 'bg-emerald-500' : 'bg-gray-300'}`}
          >
            <div className={`w-3 h-3 bg-white rounded-full transition-transform ${formData.isActive ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          className="flex-1 py-3 text-xs font-bold uppercase tracking-widest bg-white border border-gray-200"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          loading={loading}
          className="flex-1 py-3 text-xs font-bold uppercase tracking-widest bg-pos-primary hover:bg-red-700 text-white shadow-lg shadow-red-100"
        >
          {initialData ? 'Update Product' : 'Create Product'}
        </Button>
      </div>
    </form>
  );
};
