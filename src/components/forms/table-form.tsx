'use client';

import React, { useState } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';

// Validation schema for table creation
const tableSchema = z.object({
  name: z.string().min(1, 'Table name/number is required').max(20),
  capacity: z.number().min(1).max(50),
  floorId: z.string().min(1, 'Please select a floor'),
});

interface Floor {
  id: string;
  name: string;
}

interface TableFormData {
  name: string;
  capacity: number;
  floorId: string;
}

interface TableFormProps {
  initialData?: Partial<TableFormData>;
  floors: Floor[];
  onSubmit: (data: TableFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const TableForm: React.FC<TableFormProps> = ({
  initialData,
  floors,
  onSubmit,
  onCancel,
  loading
}) => {
  const [formData, setFormData] = useState<TableFormData>({
    name: initialData?.name || '',
    capacity: initialData?.capacity || 4,
    floorId: initialData?.floorId || (floors.length > 0 ? floors[0].id : ''),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    try {
      const validated = tableSchema.parse(formData);
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
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      <div className="space-y-4 bg-gray-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-gray-100 dark:border-slate-700">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">
            Floor Location
          </label>
          <select
            value={formData.floorId}
            onChange={(e) => setFormData({ ...formData, floorId: e.target.value })}
            className={`w-full px-4 py-3 bg-white dark:bg-slate-900 border ${errors.floorId ? 'border-red-400' : 'border-transparent dark:border-slate-700'} rounded-xl text-sm font-semibold text-slate-800 dark:text-white focus:outline-none shadow-sm transition-all`}
          >
            {floors.length === 0 && <option value="">No floors available</option>}
            {floors.map(floor => (
              <option key={floor.id} value={floor.id}>
                {floor.name}
              </option>
            ))}
          </select>
          {errors.floorId && <p className="text-[10px] text-red-500 font-bold uppercase ml-1">{errors.floorId}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">
              Table Name
            </label>
            <input
              type="text"
              placeholder="e.g. T1"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-4 py-3 bg-white dark:bg-slate-900 border ${errors.name ? 'border-red-400' : 'border-transparent dark:border-slate-700'} rounded-xl text-sm font-semibold text-slate-800 dark:text-white focus:outline-none shadow-sm transition-all placeholder:text-gray-300 dark:placeholder:text-slate-600`}
              autoFocus
            />
            {errors.name && <p className="text-[10px] text-red-500 font-bold uppercase ml-1">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">
              Capacity
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })}
              className={`w-full px-4 py-3 bg-white dark:bg-slate-900 border ${errors.capacity ? 'border-red-400' : 'border-transparent dark:border-slate-700'} rounded-xl text-sm font-semibold text-slate-800 dark:text-white focus:outline-none shadow-sm transition-all`}
            />
            {errors.capacity && <p className="text-[10px] text-red-500 font-bold uppercase ml-1">{errors.capacity}</p>}
          </div>
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
          {initialData?.name ? 'Update Table' : 'Create Table'}
        </Button>
      </div>
    </form>
  );
};
