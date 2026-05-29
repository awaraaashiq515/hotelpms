'use client';

import React, { useState } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Customer } from '@/lib/api/customers';

const customerSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().max(50).optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  mobile: z.string().min(10, 'Mobile must be at least 10 digits').max(15).optional().or(z.literal('')),
  address: z.string().max(200).optional(),
  gender: z.string().optional(),
  birthDate: z.string().optional().or(z.literal('')),
  referredByCode: z.string().optional().or(z.literal('')),
});

interface CustomerFormProps {
  initialData?: Customer & { birthDate?: string };
  onSubmit: (data: Partial<Customer & { birthDate?: string | null; referredByCode?: string }>) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const CustomerForm: React.FC<CustomerFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  loading
}) => {
  const [formData, setFormData] = useState({
    firstName: initialData?.firstName || '',
    lastName: initialData?.lastName || '',
    email: initialData?.email || '',
    mobile: initialData?.mobile || '',
    address: initialData?.address || '',
    gender: initialData?.gender || 'not_specified',
    birthDate: initialData?.birthDate ? new Date(initialData.birthDate).toISOString().split('T')[0] : '',
    referredByCode: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    try {
      const validated = customerSchema.parse(formData);
      await onSubmit({
        ...validated,
        birthDate: validated.birthDate ? new Date(validated.birthDate).toISOString() : null,
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest ml-1">
            First Name
          </label>
          <input
            type="text"
            placeholder="John"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            className={`w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 dark:text-white border ${errors.firstName ? 'border-red-400' : 'border-transparent dark:border-slate-600'} rounded-xl text-sm font-semibold focus:outline-none focus:bg-white dark:focus:bg-slate-700 focus:border-pos-primary/20 transition-all`}
          />
          {errors.firstName && <p className="text-[10px] text-red-500 font-bold uppercase ml-1">{errors.firstName}</p>}
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest ml-1">
            Last Name
          </label>
          <input
            type="text"
            placeholder="Doe"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 dark:text-white border border-transparent dark:border-slate-600 rounded-xl text-sm font-semibold focus:outline-none focus:bg-white dark:focus:bg-slate-700 focus:border-pos-primary/20 transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest ml-1">
            Mobile Number
          </label>
          <input
            type="tel"
            placeholder="9876543210"
            value={formData.mobile}
            onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
            className={`w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 dark:text-white border ${errors.mobile ? 'border-red-400' : 'border-transparent dark:border-slate-600'} rounded-xl text-sm font-semibold focus:outline-none focus:bg-white dark:focus:bg-slate-700 focus:border-pos-primary/20 transition-all`}
          />
          {errors.mobile && <p className="text-[10px] text-red-500 font-bold uppercase ml-1">{errors.mobile}</p>}
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest ml-1">
            Email Address
          </label>
          <input
            type="email"
            placeholder="john@example.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className={`w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 dark:text-white border ${errors.email ? 'border-red-400' : 'border-transparent dark:border-slate-600'} rounded-xl text-sm font-semibold focus:outline-none focus:bg-white dark:focus:bg-slate-700 focus:border-pos-primary/20 transition-all`}
          />
          {errors.email && <p className="text-[10px] text-red-500 font-bold uppercase ml-1">{errors.email}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest ml-1">
            Gender
          </label>
          <select
            value={formData.gender}
            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 dark:text-white border border-transparent dark:border-slate-600 rounded-xl text-sm font-semibold focus:outline-none focus:bg-white dark:focus:bg-slate-700 focus:border-pos-primary/20 transition-all cursor-pointer"
          >
            <option value="not_specified">Not Specified</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest ml-1">
            Birth Date
          </label>
          <input
            type="date"
            value={formData.birthDate}
            onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 dark:text-white border border-transparent dark:border-slate-600 rounded-xl text-sm font-semibold focus:outline-none focus:bg-white dark:focus:bg-slate-700 focus:border-pos-primary/20 transition-all cursor-pointer"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
          Address
        </label>
        <textarea
          placeholder="Complete address"
          rows={2}
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 dark:text-white border border-transparent dark:border-slate-600 rounded-xl text-sm font-semibold focus:outline-none focus:bg-white dark:focus:bg-slate-700 focus:border-pos-primary/20 transition-all resize-none"
        />
      </div>

      {!initialData && (
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
            Referral Code (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. REF-ABCDEF"
            value={formData.referredByCode}
            onChange={(e) => setFormData({ ...formData, referredByCode: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 dark:text-white border border-transparent dark:border-slate-600 rounded-xl text-sm font-semibold focus:outline-none focus:bg-white dark:focus:bg-slate-700 focus:border-pos-primary/20 transition-all"
          />
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          className="flex-1 py-3 text-xs font-bold uppercase tracking-widest bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 dark:text-slate-300"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          loading={loading}
          className="flex-1 py-3 text-xs font-bold uppercase tracking-widest bg-pos-primary hover:bg-red-700 text-white shadow-lg shadow-red-100"
        >
          {initialData ? 'Update Customer' : 'Add Customer'}
        </Button>
      </div>
    </form>
  );
};
