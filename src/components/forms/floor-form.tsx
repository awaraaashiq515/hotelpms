'use client';

import React, { useState } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';

// Validation schema for floor creation
const floorSchema = z.object({
  name: z.string().min(1, 'Floor name is required').max(30),
  order: z.number().min(0).optional(),
  menuType: z.enum(['RESTAURANT', 'BAR', 'CAFE']).default('RESTAURANT'),
  outletId: z.string().optional().nullable(),
});

interface FloorFormData {
  name: string;
  order: number;
  menuType: 'RESTAURANT' | 'BAR' | 'CAFE';
  outletId?: string | null;
}

interface FloorFormProps {
  initialData?: Partial<FloorFormData>;
  outlets?: any[];
  onSubmit: (data: FloorFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  barPosEnabled?: boolean;
  cafePosEnabled?: boolean;
}

export const FloorForm: React.FC<FloorFormProps> = ({
  initialData,
  outlets = [],
  onSubmit,
  onCancel,
  loading,
  barPosEnabled = true,
  cafePosEnabled = true
}) => {
  const [formData, setFormData] = useState<FloorFormData>({
    name: initialData?.name || '',
    order: initialData?.order ?? 0,
    menuType: initialData?.menuType || 'RESTAURANT',
    outletId: initialData?.outletId || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    try {
      const validated = floorSchema.parse(formData);
      await onSubmit(validated as FloorFormData);
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
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      <div className="space-y-4 bg-gray-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-gray-100 dark:border-slate-700">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">
            Floor Name
          </label>
          <input
            type="text"
            placeholder="e.g. Second Floor, Terrace, Garden"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={`w-full px-4 py-3 bg-white dark:bg-slate-900 border ${errors.name ? 'border-red-400' : 'border-transparent dark:border-slate-700'} rounded-xl text-sm font-semibold text-slate-800 dark:text-white focus:outline-none shadow-sm transition-all placeholder:text-gray-300 dark:placeholder:text-slate-600`}
            autoFocus
          />
          {errors.name && <p className="text-[10px] text-red-500 font-bold uppercase ml-1">{errors.name}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">
            Display Order
          </label>
          <input
            type="number"
            min="0"
            value={formData.order}
            onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
            className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-transparent dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-800 dark:text-white focus:outline-none shadow-sm transition-all"
            placeholder="0"
          />
          <p className="text-[9px] text-gray-400 font-medium ml-1">Higher numbers appear later in the list.</p>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">
            Floor Type (Default Menu)
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Restaurant 🍽️', value: 'RESTAURANT', enabled: true },
              { label: 'Bar 🍺', value: 'BAR', enabled: barPosEnabled },
              { label: 'Cafe ☕', value: 'CAFE', enabled: cafePosEnabled }
            ].filter(o => o.enabled).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFormData({ ...formData, menuType: option.value as any })}
                className={`py-2.5 px-3 text-xs font-black uppercase tracking-wider rounded-xl border transition-all ${
                  formData.menuType === option.value
                    ? 'bg-pos-primary border-pos-primary text-white shadow-md shadow-pos-primary/10'
                    : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 text-slate-500 hover:bg-gray-50 dark:hover:bg-slate-800'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">
            Assign to Outlet (Optional)
          </label>
          <select
            value={formData.outletId || ''}
            onChange={(e) => setFormData({ ...formData, outletId: e.target.value || null })}
            className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-transparent dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-800 dark:text-white focus:outline-none shadow-sm transition-all appearance-none cursor-pointer"
          >
            <option value="">-- No Specific Outlet --</option>
            {outlets.map((outlet) => (
              <option key={outlet.id} value={outlet.id}>
                {outlet.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          className="flex-1 py-3 text-xs font-black uppercase tracking-widest bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm rounded-xl"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          loading={loading}
          className="flex-1 py-3 text-xs font-black uppercase tracking-widest bg-pos-primary hover:bg-red-700 text-white shadow-lg shadow-red-100 dark:shadow-none rounded-xl"
        >
          {initialData?.name ? 'Update Floor' : 'Create Floor'}
        </Button>
      </div>
    </form>
  );
};
