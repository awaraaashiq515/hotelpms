'use client';

import React from 'react';
import { Search } from 'lucide-react';

interface SearchToolbarProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  actions?: React.ReactNode;
}

export const SearchToolbar: React.FC<SearchToolbarProps> = ({ 
  placeholder = "Search...", 
  value, 
  onChange, 
  actions 
}) => {
  return (
    <div className="bg-white dark:bg-slate-900/50 p-4 border border-gray-100 dark:border-slate-800 rounded-xl shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
      <div className="relative flex-1 w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-lg text-sm font-medium focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-slate-600 transition-all font-mono dark:text-white dark:placeholder-slate-500"
        />
      </div>
      
      {actions && (
        <div className="flex items-center gap-3 w-full md:w-auto">
          {actions}
        </div>
      )}
    </div>
  );
};
