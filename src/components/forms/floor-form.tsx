'use client';

import React, { useState } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';

// Validation schema for floor creation
const floorSchema = z.object({
  name: z.string().min(1, 'Floor name is required').max(30),
  order: z.number().min(0).optional(),
});

interface FloorFormData {
  name: string;
  order: number;
}

interface FloorFormProps {
  initialData?: Partial<FloorFormData>;
  onSubmit: (data: FloorFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const FloorForm: React.FC<FloorFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  loading
}) => {
  const [formData, setFormData] = useState<FloorFormData>({
    name: initialData?.name || '',
    order: initialData?.order ?? 0,
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
