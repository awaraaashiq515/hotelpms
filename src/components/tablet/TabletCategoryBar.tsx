'use client';

import React from 'react';
import { Search } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  menuType?: string;
}

interface TabletCategoryBarProps {
  menuType: 'RESTAURANT' | 'BAR' | 'CAFE';
  activeCategory: string;
  setActiveCategory: (val: string) => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  filteredProductsForMenuType: any[];
  filteredCategories: Category[];
}

const CATEGORY_COLORS_DARK: Record<number, string> = {
  0: 'bg-[#b8d8bc] text-[#1a3d1f]', // Soft mint green
  1: 'bg-[#c9b8d8] text-[#2e1a4a]', // Soft lavender
  2: 'bg-[#b8cfd8] text-[#1a2e3d]', // Soft sky blue
  3: 'bg-[#d8b8c2] text-[#3d1a26]', // Soft rose pink
  4: 'bg-[#d8d4b8] text-[#3d3520]', // Soft warm beige
  5: 'bg-[#b8d8d0] text-[#1a3d35]', // Soft teal
  6: 'bg-[#d8c8b8] text-[#3d2d1a]', // Soft peach
  7: 'bg-[#c8c8d8] text-[#1a1a3d]', // Soft periwinkle
};

const BAR_ACCENTS = [
  { color: '#E8A838', bg: 'rgba(232,168,56,0.10)', border: 'rgba(232,168,56,0.22)', glow: 'rgba(232,168,56,0.16)' },
  { color: '#7C6DFA', bg: 'rgba(124,109,250,0.10)', border: 'rgba(124,109,250,0.22)', glow: 'rgba(124,109,250,0.16)' },
  { color: '#3DBFA8', bg: 'rgba(61,191,168,0.10)', border: 'rgba(61,191,168,0.22)', glow: 'rgba(61,191,168,0.16)' },
  { color: '#E8607A', bg: 'rgba(232,96,122,0.10)', border: 'rgba(232,96,122,0.22)', glow: 'rgba(232,96,122,0.16)' },
  { color: '#54C4F0', bg: 'rgba(84,196,240,0.10)', border: 'rgba(84,196,240,0.22)', glow: 'rgba(84,196,240,0.16)' },
  { color: '#B87FE8', bg: 'rgba(184,127,232,0.10)', border: 'rgba(184,127,232,0.22)', glow: 'rgba(184,127,232,0.16)' },
  { color: '#5ED4A0', bg: 'rgba(94,212,160,0.10)', border: 'rgba(94,212,160,0.22)', glow: 'rgba(94,212,160,0.16)' },
  { color: '#F0934C', bg: 'rgba(240,147,76,0.10)', border: 'rgba(240,147,76,0.22)', glow: 'rgba(240,147,76,0.16)' },
];

const BAR_CAT_ICON_MAP: Record<string, string> = {
  premium: '⭐', wine: '🍷', beer: '🍺', whisky: '🥃', whiskey: '🥃',
  rum: '🥤', scotch: '🥃', vodka: '🍸', gin: '🍹', brandy: '🥂',
  tequila: '🌵', cocktail: '🍹', mocktail: '🧃', soft: '🥤', juice: '🍊',
  liquor: '🥃', spirits: '🥃', champagne: '🍾', cider: '🍺', bourbon: '🥃', absinthe: '🍸',
};

export function TabletCategoryBar({
  menuType,
  activeCategory,
  setActiveCategory,
  searchQuery,
  setSearchQuery,
  filteredProductsForMenuType,
  filteredCategories,
}: TabletCategoryBarProps) {
  return (
    <div className="h-20 shrink-0 border-b border-white/[0.06] flex items-center px-6 gap-3 overflow-x-auto no-scrollbar bg-slate-950/20">
      {/* Inline Search Bar */}
      <div className="relative shrink-0 w-48 group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={14} />
        <input
          type="text"
          placeholder="Search items..."
          className="w-full h-14 bg-slate-950/40 border border-white/10 rounded-xl pl-9 pr-4 text-[11px] font-bold outline-none focus:border-indigo-500/55 focus:ring-1 focus:ring-indigo-500/50 transition-all text-white placeholder:text-slate-500"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {menuType === 'BAR' ? (
        <>
          <button
            onClick={() => setActiveCategory('all')}
            className={`flex flex-col items-center justify-center min-w-[90px] h-14 rounded-xl transition-all border ${
              activeCategory === 'all'
                ? 'border-[#E8A838]/45 bg-[#E8A838]/14 text-[#E8A838] shadow-[0_0_14px_rgba(232,168,56,0.1)]'
                : 'bg-white/[0.03] border border-white/[0.06] text-slate-400 hover:bg-white/[0.06] hover:text-white'
            }`}
          >
            <span className="text-[10px] font-black uppercase tracking-widest">🍹 All Items</span>
            <span className="text-[8px] font-bold opacity-60 mt-0.5">{filteredProductsForMenuType.length} Items</span>
          </button>

          {filteredCategories.map((cat, idx) => {
            const accent = BAR_ACCENTS[idx % BAR_ACCENTS.length];
            const isActive = activeCategory === cat.id;
            const catLower = cat.name.toLowerCase();
            const iconKey = Object.keys(BAR_CAT_ICON_MAP).find(k => catLower.includes(k)) || 'default';
            const emoji = BAR_CAT_ICON_MAP[iconKey] || '🍷';

            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className="flex flex-col items-center justify-center min-w-[110px] h-14 rounded-xl transition-all border"
                style={{
                  borderColor: isActive ? accent.border : 'rgba(255,255,255,0.06)',
                  backgroundColor: isActive ? accent.bg : 'rgba(255,255,255,0.03)',
                  color: isActive ? accent.color : 'rgba(255,255,255,0.4)',
                  boxShadow: isActive ? `0 0 14px ${accent.glow}` : 'none',
                }}
              >
                <span className="text-[10px] font-black uppercase tracking-widest truncate w-full px-2 text-center">
                  {emoji} {cat.name}
                </span>
                <span className="text-[8px] font-bold opacity-65 mt-0.5">Category</span>
              </button>
            );
          })}
        </>
      ) : (
        <>
          <button
            onClick={() => setActiveCategory('all')}
            className={`flex flex-col items-center justify-center min-w-[90px] h-14 rounded-xl transition-all border ${
              activeCategory === 'all'
                ? 'bg-gradient-to-br from-indigo-600 to-indigo-500 text-white border-indigo-400/20 shadow-lg shadow-indigo-600/20'
                : 'bg-white/[0.03] border border-white/[0.06] text-slate-400 hover:bg-white/[0.06] hover:text-white'
            }`}
          >
            <span className="text-[10px] font-black uppercase tracking-widest">All Items</span>
            <span className="text-[8px] font-bold opacity-60 mt-0.5">{filteredProductsForMenuType.length} Items</span>
          </button>

          {filteredCategories.map((cat, idx) => {
            const colorClass = CATEGORY_COLORS_DARK[idx % 8];
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex flex-col items-center justify-center min-w-[110px] h-14 rounded-xl transition-all border ${
                  isActive ? `${colorClass} shadow-lg scale-105 border-current/20` : 'bg-white/[0.03] border border-white/[0.06] text-slate-400 hover:bg-white/[0.06] hover:text-white'
                }`}
              >
                <span className="text-[10px] font-black uppercase tracking-widest truncate w-full px-2 text-center">{cat.name}</span>
                <span className="text-[8px] font-bold opacity-60 mt-0.5">Category</span>
              </button>
            );
          })}
        </>
      )}
    </div>
  );
}
