'use client';

import React, { useEffect, useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { staffApi, StaffUser, Role } from '@/lib/api/staff';
import { useToast } from '@/components/ui/Toast';

const staffSchema = z.object({
  fullName: z.string().min(2, 'Full Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  roleId: z.string().min(1, 'Role is required'),
  isActive: z.boolean().default(true),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
});

type StaffFormData = z.infer<typeof staffSchema>;

interface StaffFormProps {
  initialData?: StaffUser | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function StaffForm({ initialData, onSuccess, onCancel }: StaffFormProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<StaffFormData>({
    resolver: zodResolver(staffSchema) as any,
    defaultValues: initialData ? {
      fullName: initialData.fullName,
      email: initialData.email,
      phone: initialData.phone || '',
      roleId: initialData.roleId,
      isActive: initialData.isActive,
    } : {
      isActive: true,
      roleId: '',
    },
  });

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const data = await staffApi.roles();
        setRoles(data || []);
      } catch (err) {
        console.error('Failed to fetch roles:', err);
      }
    };
    fetchRoles();
  }, []);

  const onSubmit = async (data: StaffFormData) => {
    setLoading(true);
    try {
      if (initialData) {
        await staffApi.update(initialData.id, data);
        showToast('Staff member updated successfully', 'success');
      } else {
        if (!data.password) {
           showToast('Password is required for new staff', 'error');
           setLoading(false);
           return;
        }
        // For simplicity in this demo, we assume the user's propertyId/organizationId 
        // will be handled by the backend session or passed via hidden fields if needed.
        await staffApi.create(data);
        showToast('Staff member created successfully', 'success');
      }
      onSuccess();
    } catch (error: any) {
      showToast(error.message || 'Operation failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 py-2">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Full Name"
          placeholder="e.g. Rajesh Kumar"
          {...register('fullName')}
          error={errors.fullName?.message}
        />
        <Input
          label="Email Address"
          placeholder="rajesh@example.com"
          type="email"
          {...register('email')}
          error={errors.email?.message}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Phone Number"
          placeholder="10 digit mobile"
          {...register('phone')}
          error={errors.phone?.message}
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Role</label>
          <select 
            {...register('roleId')}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-pos-primary focus:border-transparent text-sm"
          >
            <option value="">Select Role</option>
            {roles.map(role => (
              <option key={role.id} value={role.id}>{role.name}</option>
            ))}
          </select>
          {errors.roleId && <p className="text-[10px] font-bold text-red-500 ml-1 mt-1">{errors.roleId.message}</p>}
        </div>
      </div>

      {!initialData && (
        <Input
          label="Initial Password"
          type="password"
          placeholder="Min 6 characters"
          {...register('password')}
          error={errors.password?.message}
        />
      )}

      <div className="flex items-center gap-2 ml-1">
        <input 
          type="checkbox" 
          id="isActive"
          {...register('isActive')}
          className="w-4 h-4 rounded border-gray-300 text-pos-primary focus:ring-pos-primary"
        />
        <label htmlFor="isActive" className="text-sm font-bold text-gray-600 uppercase tracking-tight">Active Account</label>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={loading} className="bg-pos-primary hover:bg-red-700 text-white">
          {initialData ? 'Update Staff Member' : 'Create Staff Member'}
        </Button>
      </div>
    </form>
  );
}
