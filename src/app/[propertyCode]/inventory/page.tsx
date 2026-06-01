'use client';

import React, { useState } from 'react';
import { Wine, UtensilsCrossed } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import RestaurantInventory from '@/components/inventory/restaurant-inventory';
import BarInventory from '@/components/inventory/bar-inventory';

export default function InventoryPage() {
  const [activeMode, setActiveMode] = useState<'RESTAURANT' | 'BAR'>('RESTAURANT');

  return (
    <div className="min-h-screen space-y-6 pb-20">
      {/* Header Section */}
      <div className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-[2rem] p-6 border border-gray-100 dark:border-slate-800 shadow-sm mb-2">
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 blur-[60px] rounded-full -mr-16 -mt-16 animate-pulse" />
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Inventory <span className="text-emerald-500">Control</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-xs max-w-xl">
              Precision management for your kitchen supplies and bar stock.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-200 dark:border-slate-700/50">
            <button
              onClick={() => setActiveMode('RESTAURANT')}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                activeMode === 'RESTAURANT'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <UtensilsCrossed size={14} />
              <span>Restaurant Store</span>
            </button>
            <button
              onClick={() => setActiveMode('BAR')}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                activeMode === 'BAR'
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Wine size={14} />
              <span>Bar Inventory</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic Content Area */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        {activeMode === 'RESTAURANT' ? (
          <RestaurantInventory />
        ) : (
          <BarInventory />
        ) as any}
      </div>
    </div>
  );
}
