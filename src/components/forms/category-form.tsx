'use client';

import React, { useState } from 'react';
import { Layers, ShoppingBag } from 'lucide-react';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Category } from '@/lib/api/categories';

const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(50),
  description: z.string().max(200).optional(),
  isActive: z.boolean().default(true),
  menuType: z.enum(['RESTAURANT', 'BAR', 'CAFE']).default('RESTAURANT'),
  parentId: z.string().optional().nullable(),
});

interface CategoryFormProps {
  initialData?: Category;
  parentCategories?: Category[];
  onSubmit: (data: Partial<Category>) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const CategoryForm: React.FC<CategoryFormProps> = ({
  initialData,
  parentCategories = [],
  onSubmit,
  onCancel,
  loading
}) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    isActive: initialData?.isActive !== false,
    menuType: initialData?.menuType || 'RESTAURANT',
    parentId: initialData?.parentId || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    try {
      const validated = categorySchema.parse(formData);
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
          Category Name
        </label>
        <input
          type="text"
          placeholder="e.g. Main Course"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className={`w-full px-4 py-3 bg-gray-50 dark:bg-slate-800/50 border ${errors.name ? 'border-red-400' : 'border-transparent dark:border-slate-700'} rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-pos-primary/20 transition-all placeholder:text-gray-400 dark:placeholder:text-slate-500`}
        />
        {errors.name && <p className="text-[10px] text-red-500 font-bold uppercase ml-1">{errors.name}</p>}
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
          Description
        </label>
        <textarea
          placeholder="Optional description"
          rows={3}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800/50 border border-transparent dark:border-slate-700 rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-pos-primary/20 transition-all resize-none placeholder:text-gray-400 dark:placeholder:text-slate-500"
        />
      </div>

      {parentCategories.length > 0 && (
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
            Parent Category (Optional)
          </label>
          <select
            value={formData.parentId || ''}
            onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
            className={`w-full px-4 py-3 bg-gray-50 dark:bg-slate-800/50 border border-transparent dark:border-slate-700 rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-pos-primary/20 transition-all`}
          >
            <option value="">-- No Parent (Top Level) --</option>
            {parentCategories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <p className="text-[10px] text-gray-400 font-medium ml-1">Select a parent category to make this a subcategory.</p>
        </div>
      )}

      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-transparent dark:border-slate-700">
        <div>
          <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-widest">Active Status</h4>
          <p className="text-[10px] text-gray-400 dark:text-slate-400 font-medium">Show or hide this category in the menu</p>
        </div>
        <button
          type="button"
          onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
          className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${
            formData.isActive ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-slate-700'
          }`}
        >
          <div
            className={`w-4 h-4 bg-white rounded-full transition-transform duration-200 transform ${
              formData.isActive ? 'translate-x-6' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
      <div className="space-y-1.5">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Menu Category</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setFormData({ ...formData, menuType: 'RESTAURANT' as any })}
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
            onClick={() => setFormData({ ...formData, menuType: 'BAR' as any })}
            className={`flex items-center justify-center gap-2 p-3 rounded-2xl border-2 transition-all ${
              formData.menuType === 'BAR'
                ? 'border-pos-primary bg-pos-primary/5 text-pos-primary shadow-sm'
                : 'border-gray-100 dark:border-slate-800 text-gray-400 grayscale hover:grayscale-0'
            }`}
          >
            <ShoppingBag size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">Bar Menu</span>
          </button>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, menuType: 'CAFE' as any })}
            className={`flex items-center justify-center gap-2 p-3 rounded-2xl border-2 transition-all col-span-2 ${
              formData.menuType === 'CAFE'
                ? 'border-pos-primary bg-pos-primary/5 text-pos-primary shadow-sm'
                : 'border-gray-100 dark:border-slate-800 text-gray-400 grayscale hover:grayscale-0'
            }`}
          >
            <ShoppingBag size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">Cafe Menu</span>
          </button>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          className="flex-1 py-3 text-xs font-bold uppercase tracking-widest bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          loading={loading}
          className="flex-1 py-3 text-xs font-bold uppercase tracking-widest bg-pos-primary hover:bg-red-700 text-white shadow-lg shadow-red-100"
        >
          {initialData ? 'Update Category' : 'Create Category'}
        </Button>
      </div>
    </form>
  );
};
