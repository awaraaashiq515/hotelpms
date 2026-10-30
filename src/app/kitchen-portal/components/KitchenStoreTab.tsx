'use client';

import React from 'react';
import { Search, AlertTriangle, Plus, Package, RefreshCw, Send } from 'lucide-react';
import { StockItem } from './types';

interface KitchenStoreTabProps {
  stockItems: StockItem[];
  filteredStock: StockItem[];
  stockMetrics: {
    total: number;
    outOfStock: number;
    lowStock: number;
    healthy: number;
  };
  stockSearch: string;
  stockCategoryFilter: string;
  categories: string[];
  lowStockOnly: boolean;
  stockLoading: boolean;
  quickRefillLoadingId: string | null;
  onSetStockSearch: (val: string) => void;
  onSetStockCategoryFilter: (cat: string) => void;
  onToggleLowStockOnly: () => void;
  onOpenRequestModal: (item?: StockItem) => void;
  onQuickRefill: (item: StockItem, qty: number) => void;
  onQuickOutOfStock: (item: StockItem) => void;
}

export const KitchenStoreTab: React.FC<KitchenStoreTabProps> = ({
  filteredStock,
  stockMetrics,
  stockSearch,
  stockCategoryFilter,
  categories,
  lowStockOnly,
  stockLoading,
  quickRefillLoadingId,
  onSetStockSearch,
  onSetStockCategoryFilter,
  onToggleLowStockOnly,
  onOpenRequestModal,
  onQuickRefill,
  onQuickOutOfStock,
}) => {
  return (
    <div className="space-y-4">
      {/* Quick Metrics Bar (Hotel Indigo/Slate theme) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3.5 rounded-2xl bg-[#0d1322] border border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Total Items Tracked
          </span>
          <p className="text-xl font-black text-white mt-1">{stockMetrics.total}</p>
        </div>
        <div className="p-3.5 rounded-2xl bg-rose-950/25 border border-rose-500/30">
          <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">
            Out of Stock
          </span>
          <p className="text-xl font-black text-rose-400 mt-1">{stockMetrics.outOfStock}</p>
        </div>
        <div className="p-3.5 rounded-2xl bg-amber-950/25 border border-amber-500/30">
          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
            Low Stock Warning
          </span>
          <p className="text-xl font-black text-amber-400 mt-1">{stockMetrics.lowStock}</p>
        </div>
        <div className="p-3.5 rounded-2xl bg-indigo-950/25 border border-indigo-500/30">
          <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">
            Healthy Balance
          </span>
          <p className="text-xl font-black text-indigo-300 mt-1">{stockMetrics.healthy}</p>
        </div>
      </div>

      {/* Search, Category & Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0d1322] p-3 rounded-2xl border border-slate-800">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search grocery, vegetables, spices, oil, dairy..."
            value={stockSearch}
            onChange={(e) => onSetStockSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onToggleLowStockOnly}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${lowStockOnly
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
          >
            <AlertTriangle size={13} />
            <span>Low Only</span>
          </button>

          <button
            onClick={() => onOpenRequestModal()}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/25 transition whitespace-nowrap"
          >
            <Plus size={14} />
            <span>Request Custom Item</span>
          </button>
        </div>
      </div>

      {/* Category Filter Pills */}
      {categories.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => onSetStockCategoryFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${stockCategoryFilter === 'ALL'
                ? 'bg-indigo-600 text-white border border-indigo-500'
                : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
              }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => onSetStockCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${stockCategoryFilter === cat
                  ? 'bg-indigo-600 text-white border border-indigo-500'
                  : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Stock Items Cards Grid */}
      {stockLoading ? (
        <div className="py-16 text-center text-slate-400 text-xs">
          <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-indigo-400" />
          <span>Syncing store items...</span>
        </div>
      ) : filteredStock.length === 0 ? (
        <div className="py-16 text-center bg-[#0d1322] rounded-3xl border border-slate-800">
          <Package size={28} className="text-slate-500 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-300">No matching stock items</p>
          <p className="text-xs text-slate-500 mt-1">Try another search or request a new ingredient.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredStock.map((item) => {
            const isZero = item.currentStock <= 0;
            const isLow = item.isLow;
            const unit = item.unit || 'units';
            const isRefilling = quickRefillLoadingId === item.id;

            return (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border transition flex flex-col justify-between shadow-lg ${isZero
                    ? 'bg-rose-950/20 border-rose-500/50 ring-1 ring-rose-500/30'
                    : isLow
                      ? 'bg-amber-950/20 border-amber-500/50'
                      : 'bg-[#0e1629] border-slate-800 hover:border-slate-700'
                  }`}
              >
                <div>
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-white tracking-wide">{item.name}</h4>
                      <span className="text-[10px] text-slate-400 font-mono">
                        SKU: {item.sku || 'N/A'} • {item.itemType}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${isZero
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : isLow
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        }`}
                    >
                      {isZero ? 'Out of Stock' : isLow ? 'Low' : 'In Stock'}
                    </span>
                  </div>

                  {/* Current Quantity Remaining */}
                  <div className="mt-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-medium">Store Balance:</span>
                    <span
                      className={`text-lg font-black tracking-tight ${isZero
                          ? 'text-rose-400'
                          : isLow
                            ? 'text-amber-400'
                            : 'text-indigo-300'
                        }`}
                    >
                      {item.currentStock.toFixed(1)} {unit}
                    </span>
                  </div>

                  {/* Reorder Level Info */}
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Min: {item.minimumStock} {unit}</span>
                    <span>Reorder at: {item.reorderLevel} {unit}</span>
                  </div>
                </div>

                {/* Fast 1-Click Refill Action Buttons */}
                <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>⚡ Fast Refill</span>
                    {isRefilling && <span className="text-indigo-400 animate-pulse">Sending...</span>}
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      disabled={isRefilling}
                      onClick={() => onQuickRefill(item, 5)}
                      className="py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-bold transition active:scale-95 disabled:opacity-50"
                      title={`Request 5 ${unit} from store`}
                    >
                      +5 {unit}
                    </button>
                    <button
                      type="button"
                      disabled={isRefilling}
                      onClick={() => onQuickRefill(item, 10)}
                      className="py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-bold transition active:scale-95 disabled:opacity-50"
                      title={`Request 10 ${unit} from store`}
                    >
                      +10 {unit}
                    </button>
                    <button
                      type="button"
                      disabled={isRefilling}
                      onClick={() => onQuickRefill(item, 25)}
                      className="py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-bold transition active:scale-95 disabled:opacity-50"
                      title={`Request 25 ${unit} from store`}
                    >
                      +25 {unit}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    <button
                      type="button"
                      disabled={isRefilling}
                      onClick={() => onQuickOutOfStock(item)}
                      className="py-1.5 px-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] font-black transition flex items-center justify-center gap-1 active:scale-95 disabled:opacity-50"
                    >
                      <AlertTriangle size={12} />
                      <span>🚨 Out of Stock</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenRequestModal(item)}
                      className="py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[11px] font-bold transition flex items-center justify-center gap-1 active:scale-95"
                    >
                      <Send size={11} />
                      <span>Custom Qty...</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

