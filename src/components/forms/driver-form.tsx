'use client';

import React, { useState } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Driver } from '@/lib/api/drivers';

const driverSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  phone: z.string().max(15).optional().or(z.literal('')),
  vehicleNumber: z.string().max(30).optional().or(z.literal('')),
  vehicleType: z.enum(['CAR', 'BUS', 'AUTO', 'VAN', 'BIKE']).default('CAR'),
  isActive: z.boolean().default(true),
});

interface DriverFormProps {
  initialData?: Driver;
  onSubmit: (data: Partial<Driver>) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const DriverForm: React.FC<DriverFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  loading
}) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    phone: initialData?.phone || '',
    vehicleNumber: initialData?.vehicleNumber || '',
    vehicleType: initialData?.vehicleType || 'CAR',
    isActive: initialData !== undefined ? initialData.isActive : true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    try {
      const validated = driverSchema.parse(formData);
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
        <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
          Driver Name
        </label>
        <input
          type="text"
          placeholder="John Driver"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className={`w-full px-4 py-3 bg-gray-50 dark:bg-slate-800/50 border ${errors.name ? 'border-red-400' : 'border-slate-200 dark:border-white/5'} rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-pos-primary/20 dark:focus:border-pos-primary/40 transition-all`}
        />
        {errors.name && <p className="text-[10px] text-red-500 font-bold uppercase ml-1">{errors.name}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
            Mobile Number
          </label>
          <input
            type="tel"
            placeholder="9876543210"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className={`w-full px-4 py-3 bg-gray-50 dark:bg-slate-800/50 border ${errors.phone ? 'border-red-400' : 'border-slate-200 dark:border-white/5'} rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-pos-primary/20 dark:focus:border-pos-primary/40 transition-all`}
          />
          {errors.phone && <p className="text-[10px] text-red-500 font-bold uppercase ml-1">{errors.phone}</p>}
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
            Vehicle Number
          </label>
          <input
            type="text"
            placeholder="ABC-1234"
            value={formData.vehicleNumber}
            onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
            className={`w-full px-4 py-3 bg-gray-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-pos-primary/20 dark:focus:border-pos-primary/40 transition-all`}
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
          Vehicle Type
        </label>
        <select
          value={formData.vehicleType}
          onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
          className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-pos-primary/20 dark:focus:border-pos-primary/40 transition-all cursor-pointer"
        >
          <option value="CAR" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Car</option>
          <option value="BUS" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Bus</option>
          <option value="AUTO" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Auto Rickshaw</option>
          <option value="VAN" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Van</option>
          <option value="BIKE" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Bike</option>
        </select>
      </div>

      <div className="flex items-center gap-2 pt-2">
        <input
          type="checkbox"
          id="isActive"
          checked={formData.isActive}
          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
          className="w-4 h-4 text-pos-primary border-gray-300 rounded focus:ring-pos-primary dark:bg-slate-800 dark:border-white/10"
        />
        <label htmlFor="isActive" className="text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
          Active Driver
        </label>
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          className="flex-1 py-3 text-xs font-bold uppercase tracking-widest bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          loading={loading}
          className="flex-1 py-3 text-xs font-bold uppercase tracking-widest bg-pos-primary hover:bg-red-700 text-white shadow-lg shadow-red-100 dark:shadow-none"
        >
          {initialData ? 'Update Driver' : 'Add Driver'}
        </Button>
      </div>
    </form>
  );
};
