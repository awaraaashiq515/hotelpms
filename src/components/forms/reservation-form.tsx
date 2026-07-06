'use client';

import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { TableReservation } from '@/lib/api/reservations';
import { driversApi, Driver } from '@/lib/api/drivers';

const reservationSchema = z.object({
  customerName: z.string().min(1, 'Name is required').max(100),
  customerPhone: z.string().max(15).optional().or(z.literal('')),
  date: z.string().min(1, 'Date is required'),
  time: z.string().min(1, 'Time is required'),
  numberOfTables: z.number().min(1).max(20),
  guestCount: z.number().min(1).max(100),
  status: z.enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']),
  driverId: z.string().optional().or(z.literal('')),
  tableId: z.string().optional().or(z.literal('')),
});

interface ReservationFormProps {
  initialData?: TableReservation;
  propertyId: string;
  onSubmit: (data: Partial<TableReservation>) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const ReservationForm: React.FC<ReservationFormProps> = ({
  initialData,
  propertyId,
  onSubmit,
  onCancel,
  loading
}) => {
  const [formData, setFormData] = useState({
    customerName: initialData?.customerName || '',
    customerPhone: initialData?.customerPhone || '',
    date: initialData ? initialData.date.split('T')[0] : new Date().toISOString().split('T')[0],
    time: initialData?.time || '19:00',
    numberOfTables: initialData?.numberOfTables || 1,
    guestCount: initialData?.guestCount || 2,
    status: initialData?.status || 'PENDING',
    driverId: initialData?.driverId || '',
    tableId: initialData?.tableId || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [tables, setTables] = useState<any[]>([]);

  useEffect(() => {
    // Load drivers for the dropdown
    driversApi.list(propertyId).then((data) => {
      setDrivers(data?.filter(d => d.isActive) || []);
    }).catch(console.error);

    // Load tables for specific table assignment
    fetch('/api/floors').then(r => r.json()).then(res => {
      if (res.success && res.data) {
        const allTables = res.data.flatMap((f: any) => 
          (f.tables || []).map((t: any) => ({ ...t, floorName: f.name }))
        );
        setTables(allTables);
      }
    }).catch(console.error);
  }, [propertyId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    try {
      const validated = reservationSchema.parse(formData);
      await onSubmit({ ...validated, propertyId });
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
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
            Customer Name
          </label>
          <input
            type="text"
            placeholder="John Doe"
            value={formData.customerName}
            onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
            className={`w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border ${errors.customerName ? 'border-red-400' : 'border-transparent dark:border-slate-700'} rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-700 focus:border-pos-primary/20 transition-all shadow-sm`}
          />
          {errors.customerName && <p className="text-[10px] text-red-500 font-bold uppercase ml-1">{errors.customerName}</p>}
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
            Mobile Number
          </label>
          <input
            type="tel"
            placeholder="9876543210"
            value={formData.customerPhone}
            onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-transparent dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-700 focus:border-pos-primary/20 transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
            Date
          </label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className={`w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border ${errors.date ? 'border-red-400' : 'border-transparent dark:border-slate-700'} rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-700 focus:border-pos-primary/20 transition-all shadow-sm`}
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
            Time
          </label>
          <input
            type="time"
            value={formData.time}
            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            className={`w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border ${errors.time ? 'border-red-400' : 'border-transparent dark:border-slate-700'} rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-700 focus:border-pos-primary/20 transition-all shadow-sm`}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid grid-cols-2 gap-2">
           <div className="space-y-2">
             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
               Tables
             </label>
             <input
               type="number"
               min="1"
               value={formData.numberOfTables}
               onChange={(e) => setFormData({ ...formData, numberOfTables: parseInt(e.target.value) || 1 })}
               className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-transparent dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-700 focus:border-pos-primary/20 transition-all shadow-sm"
               placeholder="Qty"
             />
           </div>
           <div className="space-y-2">
             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
               Guests
             </label>
             <input
               type="number"
               min="1"
               value={formData.guestCount}
               onChange={(e) => setFormData({ ...formData, guestCount: parseInt(e.target.value) || 1 })}
               className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-transparent dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-700 focus:border-pos-primary/20 transition-all shadow-sm"
               placeholder="Pax"
             />
           </div>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
            Status
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
            className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-transparent dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-700 focus:border-pos-primary/20 transition-all appearance-none shadow-sm"
          >
            <option value="PENDING" className="dark:bg-slate-800">PENDING</option>
            <option value="CONFIRMED" className="dark:bg-slate-800">CONFIRMED</option>
            <option value="COMPLETED" className="dark:bg-slate-800">COMPLETED</option>
            <option value="CANCELLED" className="dark:bg-slate-800">CANCELLED</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
          Assign Specific Table (Optional)
        </label>
        <select
          value={formData.tableId}
          onChange={(e) => setFormData({ ...formData, tableId: e.target.value })}
          className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-transparent dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-700 focus:border-pos-primary/20 transition-all appearance-none shadow-sm"
        >
          <option value="" className="dark:bg-slate-800">Any Table / Unassigned</option>
          {tables.map(t => (
            <option key={t.id} value={t.id} className="dark:bg-slate-800">{t.name} ({t.floorName})</option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
          Referred By Driver (Optional)
        </label>
        <select
          value={formData.driverId}
          onChange={(e) => setFormData({ ...formData, driverId: e.target.value })}
          className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-transparent dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-700 focus:border-pos-primary/20 transition-all appearance-none shadow-sm"
        >
          <option value="" className="dark:bg-slate-800">No Driver Reference</option>
          {drivers.map((d: any) => (
            <option key={d.id} value={d.id} className="dark:bg-slate-800">{d.name} ({d.vehicleNumber || 'N/A'})</option>
          ))}
        </select>
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
          {initialData ? 'Update Booking' : 'Book Table'}
        </Button>
      </div>
    </form>
  );
};
