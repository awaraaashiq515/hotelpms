'use client';

import React, { useState } from 'react';
import { z } from 'zod';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Driver } from '@/lib/api/drivers';

// Known preset types
const PRESET_VEHICLE_TYPES = [
  { value: 'CAR',       label: '🚗 Car' },
  { value: 'BUS',       label: '🚌 Bus' },
  { value: 'AUTO',      label: '🛺 Auto Rickshaw' },
  { value: 'VAN',       label: '🚐 Van' },
  { value: 'BIKE',      label: '🏍️ Bike / Scooter' },
  { value: 'BICYCLE',   label: '🚲 Bicycle' },
  { value: 'TEMPO',     label: '🚛 Tempo' },
  { value: 'ERICKSHAW', label: '⚡ E-Rickshaw' },
];

const PRESET_VALUES = PRESET_VEHICLE_TYPES.map(t => t.value);

const driverSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  phone: z.string().max(15).optional().or(z.literal('')),
  vehicleNumber: z.string().max(30).optional().or(z.literal('')),
  vehicleType: z.string().min(1, 'Vehicle type is required'),
  vehicleCapacity: z.number().int().min(1).max(100).optional(),
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
  // Determine if initial vehicleType is a preset or custom
  const initType = initialData?.vehicleType || 'CAR';
  const isCustomInit = !!initType && !PRESET_VALUES.includes(initType);

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    phone: initialData?.phone || '',
    vehicleNumber: initialData?.vehicleNumber || '',
    vehicleType: isCustomInit ? 'CUSTOM' : initType,
    vehicleCapacity: initialData?.vehicleCapacity ?? null as number | null,
    isActive: initialData !== undefined ? initialData.isActive : true,
  });
  const [customType, setCustomType] = useState(isCustomInit ? initType : '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isCustom = formData.vehicleType === 'CUSTOM';
  const finalVehicleType = isCustom ? customType.trim().toUpperCase() : formData.vehicleType;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (isCustom && !customType.trim()) {
      setErrors({ vehicleType: 'Please enter a vehicle type name' });
      return;
    }

    try {
      const validated = driverSchema.parse({
        ...formData,
        vehicleType: finalVehicleType,
        vehicleCapacity: formData.vehicleCapacity ? Number(formData.vehicleCapacity) : undefined,
      });
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

  const inputClass = (field?: string) =>
    `w-full px-4 py-3 bg-gray-50 dark:bg-slate-800/50 border ${field && errors[field] ? 'border-red-400' : 'border-slate-200 dark:border-white/5'} rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-pos-primary/20 dark:focus:border-pos-primary/40 transition-all`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Driver Name */}
      <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
          Driver Name
        </label>
        <input
          type="text"
          placeholder="John Driver"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className={inputClass('name')}
        />
        {errors.name && <p className="text-[10px] text-red-500 font-bold uppercase ml-1">{errors.name}</p>}
      </div>

      {/* Phone + Vehicle Number */}
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
            className={inputClass('phone')}
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
            className={inputClass()}
          />
        </div>
      </div>

      {/* Vehicle Type + Capacity */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
            Vehicle Type
          </label>
          <select
            value={formData.vehicleType}
            onChange={(e) => {
              setFormData({ ...formData, vehicleType: e.target.value });
              if (e.target.value !== 'CUSTOM') setCustomType('');
            }}
            className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-pos-primary/20 dark:focus:border-pos-primary/40 transition-all cursor-pointer"
          >
            {PRESET_VEHICLE_TYPES.map(t => (
              <option key={t.value} value={t.value} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
                {t.label}
              </option>
            ))}
            <option value="CUSTOM" className="bg-white dark:bg-slate-900 font-bold">
              ➕ Add Custom Type...
            </option>
          </select>

          {/* Custom type input */}
          {isCustom && (
            <div className="flex items-center gap-2 mt-2">
              <div className="relative flex-1">
                <Plus size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. Tempo, E-Rickshaw, Tractor..."
                  value={customType}
                  onChange={(e) => setCustomType(e.target.value)}
                  autoFocus
                  className="w-full pl-9 pr-4 py-3 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-400 transition-all placeholder:text-slate-400"
                />
              </div>
              <button
                type="button"
                onClick={() => { setFormData({ ...formData, vehicleType: 'CAR' }); setCustomType(''); }}
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
                title="Cancel custom type"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {errors.vehicleType && <p className="text-[10px] text-red-500 font-bold uppercase ml-1">{errors.vehicleType}</p>}

          {/* Preview of final value */}
          {isCustom && customType.trim() && (
            <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold ml-1 uppercase tracking-widest">
              Will be saved as: {customType.trim().toUpperCase()}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
            Vehicle Seat Capacity
          </label>
          <input
            type="number"
            placeholder="e.g. 4"
            min={1}
            max={100}
            value={formData.vehicleCapacity ?? ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                vehicleCapacity: e.target.value ? parseInt(e.target.value) : null,
              })
            }
            className={inputClass('vehicleCapacity')}
          />
          {errors.vehicleCapacity && (
            <p className="text-[10px] text-red-500 font-bold uppercase ml-1">{errors.vehicleCapacity}</p>
          )}
          <p className="text-[9px] text-slate-400 dark:text-slate-500 ml-1">
            Maximum passengers this vehicle can carry
          </p>
        </div>
      </div>

      {/* Active Status */}
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

      {/* Actions */}
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
