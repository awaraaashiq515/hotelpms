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
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
          Driver Name
        </label>
        <input
          type="text"
          placeholder="John Driver"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className={`w-full px-4 py-3 bg-gray-50 border ${errors.name ? 'border-red-400' : 'border-transparent'} rounded-xl text-sm font-semibold focus:outline-none focus:bg-white focus:border-pos-primary/20 transition-all`}
        />
        {errors.name && <p className="text-[10px] text-red-500 font-bold uppercase ml-1">{errors.name}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
            Mobile Number
          </label>
          <input
            type="tel"
            placeholder="9876543210"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className={`w-full px-4 py-3 bg-gray-50 border ${errors.phone ? 'border-red-400' : 'border-transparent'} rounded-xl text-sm font-semibold focus:outline-none focus:bg-white focus:border-pos-primary/20 transition-all`}
          />
          {errors.phone && <p className="text-[10px] text-red-500 font-bold uppercase ml-1">{errors.phone}</p>}
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
            Vehicle Number
          </label>
          <input
            type="text"
            placeholder="ABC-1234"
            value={formData.vehicleNumber}
            onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
            className={`w-full px-4 py-3 bg-gray-50 border ${errors.vehicleNumber ? 'border-red-400' : 'border-transparent'} rounded-xl text-sm font-semibold focus:outline-none focus:bg-white focus:border-pos-primary/20 transition-all`}
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
          Vehicle Type
        </label>
        <select
          value={formData.vehicleType}
          onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
          className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl text-sm font-semibold focus:outline-none focus:bg-white focus:border-pos-primary/20 transition-all appearance-none"
        >
          <option value="CAR">Car</option>
          <option value="BUS">Bus</option>
          <option value="AUTO">Auto Rickshaw</option>
          <option value="VAN">Van</option>
          <option value="BIKE">Bike</option>
        </select>
      </div>

      <div className="flex items-center gap-2 pt-2">
        <input
          type="checkbox"
          id="isActive"
          checked={formData.isActive}
          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
          className="w-4 h-4 text-pos-primary border-gray-300 rounded focus:ring-pos-primary"
        />
        <label htmlFor="isActive" className="text-sm font-semibold text-gray-700">
          Active Driver
        </label>
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
          {initialData ? 'Update Driver' : 'Add Driver'}
        </Button>
      </div>
    </form>
  );
};
