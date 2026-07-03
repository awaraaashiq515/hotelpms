'use client';

import React from 'react';
import { X, Calendar, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface InvoiceFiltersProps {
  onClose: () => void;
  filters: {
    startDate: string;
    endDate: string;
    guestId: string;
  };
  setFilters: (filters: any) => void;
  onApply: () => void;
  onReset: () => void;
}

export const InvoiceFilters: React.FC<InvoiceFiltersProps> = ({
  onClose,
  filters,
  setFilters,
  onApply,
  onReset
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 p-6 animate-in slide-in-from-top-4 duration-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
           <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg">
             <Calendar size={16} />
           </div>
           <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">Advanced Filters</h4>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-gray-50 dark:hover:bg-slate-850 rounded-full text-gray-400">
          <X size={16} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Date Range</label>
          <div className="flex items-center gap-2">
            <input 
              type="date" 
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="flex-1 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-slate-100 border-0 rounded-xl px-4 py-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-indigo-500/40 outline-none"
            />
            <span className="text-gray-300 dark:text-slate-650">to</span>
            <input 
              type="date" 
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="flex-1 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-slate-100 border-0 rounded-xl px-4 py-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-indigo-500/40 outline-none"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Customer Search</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input 
              type="text" 
              placeholder="Search by ID or name..."
              value={filters.guestId}
              onChange={(e) => setFilters({ ...filters, guestId: e.target.value })}
              className="w-full bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-slate-100 border-0 rounded-xl pl-9 pr-4 py-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-indigo-500/40 outline-none"
            />
          </div>
        </div>

        <div className="flex items-end gap-3">
          <Button 
            onClick={onApply}
            className="flex-1 py-2 bg-pos-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-red-100 dark:shadow-none"
          >
            Apply Filters
          </Button>
          <Button 
            variant="secondary"
            onClick={onReset}
            className="flex-1 py-2 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 border-0 text-[10px] font-black uppercase tracking-widest rounded-xl text-gray-900 dark:text-slate-200"
          >
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
};
