'use client';

import React from 'react';
import { ChefHat, User, Volume2, VolumeX, RefreshCw, Menu, Utensils, Package, Layers } from 'lucide-react';
import { TabType } from './types';

interface KitchenHeaderProps {
  propertyCode: string;
  activeStaffName: string;
  soundOn: boolean;
  activeTab: TabType;
  loading: boolean;
  orderCounts: {
    all: number;
    new: number;
    preparing: number;
    ready: number;
    rooms: number;
  };
  lowStockCount: number;
  pendingRequestsCount: number;
  onToggleSound: () => void;
  onOpenStaffModal: () => void;
  onOpenMobileMenu: () => void;
  onRefresh: () => void;
  onTabChange: (tab: TabType) => void;
}

export const KitchenHeader: React.FC<KitchenHeaderProps> = ({
  propertyCode,
  activeStaffName,
  soundOn,
  activeTab,
  loading,
  orderCounts,
  lowStockCount,
  pendingRequestsCount,
  onToggleSound,
  onOpenStaffModal,
  onOpenMobileMenu,
  onRefresh,
  onTabChange,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#080d1a]/95 backdrop-blur-md border-b border-slate-800/80 px-3.5 sm:px-6 py-2.5 sm:py-3 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand & Property */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 shrink-0">
            <ChefHat size={20} className="stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-black text-sm sm:text-base tracking-wide text-white">
                KITCHEN PORTAL
              </span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
                {propertyCode.toUpperCase()}
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium hidden xs:block">
              Hotel &amp; Restaurant Food Orders &amp; Store Inventory
            </p>
          </div>
        </div>

        {/* Action Header Items */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Active Staff Button */}
          <button
            onClick={onOpenStaffModal}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 transition"
            title="Change Active Kitchen Staff"
          >
            <User size={13} className="text-indigo-400 shrink-0" />
            <span className="max-w-[90px] sm:max-w-[130px] truncate">{activeStaffName}</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            className={`p-2 rounded-xl border transition ${soundOn
                ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/25'
                : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'
              }`}
            title={soundOn ? 'Order Chime Enabled' : 'Muted'}
          >
            {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition"
            title="Refresh Data"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin text-indigo-400' : ''} />
          </button>

          {/* Mobile Drawer Toggle */}
          <button
            onClick={onOpenMobileMenu}
            className="md:hidden p-2 rounded-xl bg-indigo-600/15 hover:bg-indigo-600/25 border border-indigo-500/30 text-indigo-300 transition"
            title="Open Menu"
          >
            <Menu size={17} />
          </button>
        </div>
      </div>

      {/* ─── Desktop Navigation Tabs (Hotel Indigo Theme) ─── */}
      <div className="max-w-7xl mx-auto mt-2.5 hidden md:flex items-center gap-2 border-t border-slate-800/80 pt-2.5">
        <button
          onClick={() => onTabChange('orders')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${activeTab === 'orders'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
        >
          <Utensils size={14} />
          <span>Live Orders (KDS)</span>
          {orderCounts.new > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-rose-500 text-white font-black animate-pulse">
              {orderCounts.new} NEW
            </span>
          )}
          {orderCounts.rooms > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">
              🛏️ {orderCounts.rooms} Rooms
            </span>
          )}
        </button>

        <button
          onClick={() => onTabChange('store')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${activeTab === 'store'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
        >
          <Package size={14} />
          <span>Kitchen Store Stock</span>
          {lowStockCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
              {lowStockCount} Low
            </span>
          )}
        </button>

        <button
          onClick={() => onTabChange('requests')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${activeTab === 'requests'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
        >
          <Layers size={14} />
          <span>Restock Requests</span>
          {pendingRequestsCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-slate-800 text-indigo-300 border border-indigo-500/30 font-bold">
              {pendingRequestsCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};

