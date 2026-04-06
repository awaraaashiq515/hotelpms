'use client';

import React, { useState } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';

// Validation schema for table creation
const tableSchema = z.object({
  name: z.string().min(1, 'Table name/number is required').max(20),
  capacity: z.number().min(1).max(50),
});

interface TableFormData {
  name: string;
  capacity: number;
}

interface TableFormProps {
  initialData?: TableFormData;
  onSubmit: (data: TableFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const TableForm: React.FC<TableFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  loading
}) => {
  const [formData, setFormData] = useState<TableFormData>({
    name: initialData?.name || '',
    capacity: initialData?.capacity || 4,
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
          Table Name / Number
        </label>
        <input
          type="text"
          placeholder="e.g. Table 1, VIP A, T-5"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className={`w-full px-4 py-3 bg-gray-50 border ${errors.name ? 'border-red-400' : 'border-transparent'} rounded-xl text-sm font-semibold focus:outline-none focus:bg-white focus:border-pos-primary/20 transition-all`}
          autoFocus
        />
        {errors.name && <p className="text-[10px] text-red-500 font-bold uppercase ml-1">{errors.name}</p>}
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
          Seating Capacity
        </label>
        <input
          type="number"
          min="1"
          max="50"
          value={formData.capacity}
          onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })}
          className={`w-full px-4 py-3 bg-gray-50 border ${errors.capacity ? 'border-red-400' : 'border-transparent'} rounded-xl text-sm font-semibold focus:outline-none focus:bg-white focus:border-pos-primary/20 transition-all`}
        />
        {errors.capacity && <p className="text-[10px] text-red-500 font-bold uppercase ml-1">{errors.capacity}</p>}
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          className="flex-1 py-3 text-xs font-bold uppercase tracking-widest bg-white border border-gray-200 shadow-sm"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          loading={loading}
          className="flex-1 py-3 text-xs font-bold uppercase tracking-widest bg-pos-primary hover:bg-red-700 text-white shadow-lg shadow-red-100"
        >
          {initialData ? 'Update Table' : 'Create Table'}
        </Button>
      </div>
    </form>
  );
};
