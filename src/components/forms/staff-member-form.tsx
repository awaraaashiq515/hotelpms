'use client';

import React, { useState } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';

const staffMemberSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  phone: z.string().max(15).optional().or(z.literal('')),
  designation: z.string().optional().or(z.literal('')),
  salary: z.number().min(0).optional(),
  address: z.string().optional().or(z.literal('')),
  emergencyContact: z.string().optional().or(z.literal('')),
  joiningDate: z.string().optional().or(z.literal('')),
  isActive: z.boolean().default(true),
});

export interface StaffMember {
  id: string;
  name: string;
  phone?: string | null;
  designation?: string | null;
  salary?: number | null;
  address?: string | null;
  emergencyContact?: string | null;
  joiningDate?: string | null;
  isActive: boolean;
  createdAt?: string;
}

interface StaffMemberFormProps {
  initialData?: StaffMember;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const StaffMemberForm: React.FC<StaffMemberFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  loading
}) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    phone: initialData?.phone || '',
    designation: initialData?.designation || 'Waiter',
    salary: initialData?.salary || 0,
    address: initialData?.address || '',
    emergencyContact: initialData?.emergencyContact || '',
    joiningDate: initialData?.joiningDate
      ? new Date(initialData.joiningDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    isActive: initialData !== undefined ? initialData.isActive : true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    try {
      const validated = staffMemberSchema.parse({
        ...formData,
        salary: Number(formData.salary) || 0,
      });
      await onSubmit({
        name: validated.name,
        phone: validated.phone || undefined,
        designation: validated.designation || 'Waiter',
        salary: validated.salary || 0,
        address: validated.address || undefined,
        emergencyContact: validated.emergencyContact || undefined,
        joiningDate: validated.joiningDate || undefined,
        isActive: validated.isActive,
      });
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

  const inputClass = (field: string) =>
    `w-full px-4 py-3 bg-gray-50 dark:bg-slate-900/50 border ${errors[field] ? 'border-red-400' : 'border-transparent dark:border-white/5'} rounded-xl text-sm font-semibold text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-600 focus:outline-none focus:bg-white dark:focus:bg-slate-950 focus:border-pos-primary/20 transition-all`;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Section: Personal Info */}
      <div className="space-y-1.5 pb-2">
        <p className="text-[9px] font-black text-pos-primary uppercase tracking-[0.2em]">Personal Information</p>
        <div className="h-px bg-gradient-to-r from-pos-primary/30 to-transparent" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name *</label>
          <input
            type="text"
            placeholder="e.g. Raj Kumar"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={inputClass('name')}
          />
          {errors.name && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.name}</p>}
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone Number</label>
          <input
            type="tel"
            placeholder="9876543210"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className={inputClass('phone')}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Designation</label>
          <select
            value={formData.designation}
            onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
            className={`${inputClass('designation')} appearance-none`}
          >
            <option value="Waiter">Waiter</option>
            <option value="Captain">Captain</option>
            <option value="Head Waiter">Head Waiter</option>
            <option value="Steward">Steward</option>
            <option value="Cashier">Cashier</option>
            <option value="Supervisor">Supervisor</option>
            <option value="Manager">Manager</option>
            <option value="Chef">Chef</option>
            <option value="Helper">Helper</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Monthly Salary (₹)</label>
          <input
            type="number"
            placeholder="15000"
            value={formData.salary || ''}
            onChange={(e) => setFormData({ ...formData, salary: Number(e.target.value) || 0 })}
            className={inputClass('salary')}
          />
        </div>
      </div>

      {/* Section: Additional Details */}
      <div className="space-y-1.5 pb-2 pt-2">
        <p className="text-[9px] font-black text-pos-primary uppercase tracking-[0.2em]">Additional Details</p>
        <div className="h-px bg-gradient-to-r from-pos-primary/30 to-transparent" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Joining Date</label>
          <input
            type="date"
            value={formData.joiningDate}
            onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
            className={inputClass('joiningDate')}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Emergency Contact</label>
          <input
            type="tel"
            placeholder="Emergency number"
            value={formData.emergencyContact}
            onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
            className={inputClass('emergencyContact')}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Address</label>
        <textarea
          placeholder="Full address..."
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          rows={2}
          className={`${inputClass('address')} resize-none`}
        />
      </div>

      <div className="flex items-center gap-2 pt-1">
        <input
          type="checkbox"
          id="staffIsActive"
          checked={formData.isActive}
          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
          className="w-4 h-4 text-pos-primary border-gray-300 rounded focus:ring-pos-primary"
        />
        <label htmlFor="staffIsActive" className="text-sm font-semibold text-gray-700 dark:text-slate-400">
          Active Staff Member
        </label>
      </div>

      <div className="flex gap-3 pt-3">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          className="flex-1 py-3 text-xs font-bold uppercase tracking-widest bg-white dark:bg-slate-900/50 border border-gray-200 dark:border-white/5 text-gray-700 dark:text-slate-300"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          loading={loading}
          className="flex-1 py-3 text-xs font-bold uppercase tracking-widest bg-pos-primary hover:bg-red-700 text-white shadow-lg shadow-red-100"
        >
          {initialData ? 'Update Staff' : 'Add Staff Member'}
        </Button>
      </div>
    </form>
  );
};
