'use client';

import React from 'react';
import { Search, RefreshCw, Utensils } from 'lucide-react';
import { MenuItem, MenuCategory } from './types';
import { MenuItemCard } from './MenuItemCard';

interface MenuBrowserProps {
  categories: MenuCategory[];
  products: MenuItem[];
  loading: boolean;
  error: string;
  selectedCategory: string;
  setSelectedCategory: (id: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  vegFilter: 'all' | 'veg' | 'nonveg';
  setVegFilter: (f: 'all' | 'veg' | 'nonveg') => void;
  getQty: (id: string) => number;
  onAdd: (item: MenuItem) => void;
  onDecrement: (id: string) => void;
  onReload: () => void;
}

export function MenuBrowser({
  categories, products, loading, error,
  selectedCategory, setSelectedCategory,
  searchQuery, setSearchQuery,
  vegFilter, setVegFilter,
  getQty, onAdd, onDecrement, onReload,
}: MenuBrowserProps) {

  return (
    <div className="flex flex-col h-full gap-3 min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-violet-500/15 flex items-center justify-center">
            <Utensils size={13} className="text-violet-400" />
          </div>
          <p className="text-xs font-black text-white uppercase tracking-wider">Menu</p>
        </div>
        <button
          onClick={onReload}
          className="p-1.5 rounded-lg bg-white/[0.03] border border-white/8 text-slate-600 hover:text-slate-400 transition-colors"
        >
          <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Search + Veg Filter */}
      <div className="flex gap-2 shrink-0">
        <div className="relative flex-1">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-600" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search dishes…"
            className="w-full pl-7 pr-3 py-2 rounded-xl bg-white/[0.03] border border-white/8 text-white text-xs font-semibold placeholder-slate-700 focus:outline-none focus:border-amber-500/40 transition-all"
          />
        </div>
        {/* Veg filter */}
        <div className="flex rounded-xl border border-white/8 bg-white/[0.03] overflow-hidden">
          {([['all', '🍽️'], ['veg', '🥦'], ['nonveg', '🍗']] as const).map(([key, emoji]) => (
            <button
              key={key}
              onClick={() => setVegFilter(key)}
              className={`px-2 py-2 text-xs transition-all ${
                vegFilter === key
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'text-slate-600 hover:text-slate-400'
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Category Tabs — horizontal scroll */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 shrink-0 no-scrollbar">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1.5 rounded-xl text-[10px] font-black whitespace-nowrap transition-all ${
            selectedCategory === 'all'
              ? 'bg-amber-500/20 border border-amber-500/30 text-amber-400'
              : 'bg-white/[0.03] border border-white/8 text-slate-500 hover:text-slate-300'
          }`}
        >
          All Items ({products.length})
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-black whitespace-nowrap transition-all ${
              selectedCategory === cat.id
                ? 'bg-amber-500/20 border border-amber-500/30 text-amber-400'
                : 'bg-white/[0.03] border border-white/8 text-slate-500 hover:text-slate-300'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Product Grid — scrollable */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="relative w-8 h-8">
              <div className="absolute inset-0 border-4 border-amber-500/20 rounded-full" />
              <div className="absolute inset-0 border-4 border-t-amber-500 rounded-full animate-spin" />
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-xs text-red-400 font-bold">{error}</p>
            <button onClick={onReload} className="text-[10px] text-amber-400 font-bold hover:text-amber-300">
              Retry
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <span className="text-3xl">🍽️</span>
            <p className="text-xs text-slate-600 font-bold">No items found</p>
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-[10px] text-amber-400 font-bold">
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-2 pb-2">
            {products.map(item => (
              <MenuItemCard
                key={item.id}
                item={item}
                qty={getQty(item.id)}
                onAdd={() => onAdd(item)}
                onDecrement={() => onDecrement(item.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
