'use client';

import React from 'react';
import { Utensils, Package, Layers, Menu } from 'lucide-react';
import { TabType } from './types';

interface MobileBottomNavProps {
  activeTab: TabType;
  newOrdersCount: number;
  lowStockCount: number;
  pendingRequestsCount: number;
  onTabChange: (tab: TabType) => void;
  onOpenMobileMenu: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  newOrdersCount,
  lowStockCount,
  pendingRequestsCount,
  onTabChange,
  onOpenMobileMenu,
}) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#080d1a]/95 backdrop-blur-md border-t border-slate-800/80 px-3 py-2 flex items-center justify-around shadow-2xl">
      <button
        onClick={() => onTabChange('orders')}
        className={`flex flex-col items-center gap-1 relative py-1 px-3 rounded-xl transition ${activeTab === 'orders' ? 'text-indigo-400 font-black' : 'text-slate-400 font-medium'
          }`}
      >
        <Utensils size={18} />
        <span className="text-[10px]">Orders</span>
        {newOrdersCount > 0 && (
          <span className="absolute top-0 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center animate-pulse">
            {newOrdersCount}
          </span>
        )}
      </button>

      <button
        onClick={() => onTabChange('store')}
        className={`flex flex-col items-center gap-1 relative py-1 px-3 rounded-xl transition ${activeTab === 'store' ? 'text-indigo-400 font-black' : 'text-slate-400 font-medium'
          }`}
      >
        <Package size={18} />
        <span className="text-[10px]">Store Stock</span>
        {lowStockCount > 0 && (
          <span className="absolute top-0 right-1 w-2 h-2 rounded-full bg-amber-400" />
        )}
      </button>

      <button
        onClick={() => onTabChange('requests')}
        className={`flex flex-col items-center gap-1 relative py-1 px-3 rounded-xl transition ${activeTab === 'requests' ? 'text-indigo-400 font-black' : 'text-slate-400 font-medium'
          }`}
      >
        <Layers size={18} />
        <span className="text-[10px]">Refills</span>
        {pendingRequestsCount > 0 && (
          <span className="absolute top-0 right-1 w-2 h-2 rounded-full bg-indigo-400" />
        )}
      </button>

      <button
        onClick={onOpenMobileMenu}
        className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-slate-400 hover:text-white transition font-medium"
      >
        <Menu size={18} />
        <span className="text-[10px]">More</span>
      </button>
    </nav>
  );
};

