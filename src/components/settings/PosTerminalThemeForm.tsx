'use client';

import React, { useState, useEffect } from 'react';
import { Monitor, Check, Palette, Save, Loader2 } from 'lucide-react';

type PosTheme = 'RESTAURANT' | 'BAR' | 'CAFE' | 'TABLET_CAFE';

interface Terminal {
  key: 'billing' | 'barpos' | 'cafepos' | 'tablet';
  label: string;
  emoji: string;
  url: string;
  defaultTheme: PosTheme;
  color: string;
  borderColor: string;
}

const TERMINALS: Terminal[] = [
  {
    key: 'billing',
    label: 'Restaurant POS',
    emoji: '🍽',
    url: '/billing',
    defaultTheme: 'RESTAURANT',
    color: 'text-rose-600 dark:text-rose-400',
    borderColor: 'border-rose-200 dark:border-rose-800',
  },
  {
    key: 'barpos',
    label: 'Bar POS',
    emoji: '🍺',
    url: '/bar-pos',
    defaultTheme: 'BAR',
    color: 'text-amber-600 dark:text-amber-400',
    borderColor: 'border-amber-200 dark:border-amber-800',
  },
  {
    key: 'cafepos',
    label: 'Cafe POS',
    emoji: '☕',
    url: '/cafe-pos',
    defaultTheme: 'CAFE',
    color: 'text-yellow-700 dark:text-yellow-500',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
  },
  {
    key: 'tablet',
    label: 'Tablet / Waiter POS',
    emoji: '📱',
    url: '/tablet/[id]',
    defaultTheme: 'RESTAURANT',
    color: 'text-indigo-600 dark:text-indigo-400',
    borderColor: 'border-indigo-200 dark:border-indigo-800',
  },
];

const THEMES: {
  id: PosTheme;
  label: string;
  emoji: string;
  subtitle: string;
  activeBg: string;
  activeBorder: string;
  activeText: string;
  dot: string;
}[] = [
  {
    id: 'RESTAURANT',
    label: 'Restaurant',
    emoji: '🍽',
    subtitle: 'Classic light/dark',
    activeBg: 'bg-rose-50 dark:bg-rose-950/30',
    activeBorder: 'border-rose-400 dark:border-rose-500',
    activeText: 'text-rose-600 dark:text-rose-400',
    dot: 'bg-rose-500',
  },
  {
    id: 'BAR',
    label: 'Bar',
    emoji: '🍺',
    subtitle: 'Dark gold theme',
    activeBg: 'bg-amber-50 dark:bg-amber-950/30',
    activeBorder: 'border-amber-400 dark:border-amber-500',
    activeText: 'text-amber-600 dark:text-amber-400',
    dot: 'bg-amber-500',
  },
  {
    id: 'CAFE',
    label: 'Cafe',
    emoji: '☕',
    subtitle: 'Warm brown theme',
    activeBg: 'bg-yellow-50 dark:bg-yellow-950/30',
    activeBorder: 'border-yellow-500 dark:border-yellow-500',
    activeText: 'text-yellow-700 dark:text-yellow-400',
    dot: 'bg-yellow-500',
  },
  {
    id: 'TABLET_CAFE',
    label: 'Tablet Cafe',
    emoji: '📱☕',
    subtitle: 'Premium round card',
    activeBg: 'bg-indigo-50 dark:bg-indigo-950/30',
    activeBorder: 'border-indigo-400 dark:border-indigo-500',
    activeText: 'text-indigo-600 dark:text-indigo-400',
    dot: 'bg-indigo-500',
  },
];

const MiniThemePreview = ({ themeId }: { themeId: PosTheme }) => {
  if (themeId === 'RESTAURANT') {
    return (
      <div className="w-full aspect-[1.8/1] rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 p-1.5 flex flex-col gap-1 overflow-hidden mt-1.5 shadow-inner select-none pointer-events-none">
        {/* Mock top category pills */}
        <div className="flex gap-1 overflow-hidden shrink-0">
          <div className="px-1.5 py-0.5 rounded-[4px] bg-rose-500 text-white text-[5px] font-black uppercase tracking-wider scale-90 origin-left">All</div>
          <div className="px-1.5 py-0.5 rounded-[4px] bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[5px] font-bold scale-90 origin-left">Food</div>
          <div className="px-1.5 py-0.5 rounded-[4px] bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[5px] font-bold scale-90 origin-left">Drinks</div>
        </div>
        {/* Mock cards */}
        <div className="grid grid-cols-4 gap-1 flex-1">
          <div className="rounded-[6px] bg-[#C8E6C9] border border-[#4CAF50]/15 p-1 flex flex-col justify-between">
            <span className="text-[5px] font-black text-[#1B5E20] leading-tight uppercase truncate">Pizza</span>
            <span className="text-[5px] font-black text-[#2E7D32]">₹240</span>
          </div>
          <div className="rounded-[6px] bg-[#E1BEE7] border border-[#9C27B0]/15 p-1 flex flex-col justify-between">
            <span className="text-[5px] font-black text-[#4A148C] leading-tight uppercase truncate">Burger</span>
            <span className="text-[5px] font-black text-[#6A1B9A]">₹180</span>
          </div>
          <div className="rounded-[6px] bg-[#B3E5FC] border border-[#03A9F4]/15 p-1 flex flex-col justify-between">
            <span className="text-[5px] font-black text-[#01579B] leading-tight uppercase truncate">Salad</span>
            <span className="text-[5px] font-black text-[#0277BD]">₹150</span>
          </div>
          <div className="rounded-[6px] bg-[#F8BBD0] border border-[#E91E63]/15 p-1 flex flex-col justify-between">
            <span className="text-[5px] font-black text-[#880E4F] leading-tight uppercase truncate">Cake</span>
            <span className="text-[5px] font-black text-[#AD1457]">₹120</span>
          </div>
        </div>
      </div>
    );
  }
  if (themeId === 'BAR') {
    return (
      <div className="w-full aspect-[1.8/1] rounded-xl bg-[#080810] border border-amber-500/15 p-1.5 flex flex-col gap-1 overflow-hidden mt-1.5 shadow-inner select-none pointer-events-none">
        {/* Mock top category pills */}
        <div className="flex gap-1 overflow-hidden shrink-0">
          <div className="px-1.5 py-0.5 rounded-[4px] bg-amber-500/20 border border-amber-500/35 text-amber-500 text-[5px] font-black uppercase tracking-wider scale-90 origin-left">All</div>
          <div className="px-1.5 py-0.5 rounded-[4px] bg-white/5 text-slate-500 text-[5px] font-bold scale-90 origin-left">Whisky</div>
          <div className="px-1.5 py-0.5 rounded-[4px] bg-white/5 text-slate-500 text-[5px] font-bold scale-90 origin-left">Beer</div>
        </div>
        {/* Mock cards */}
        <div className="grid grid-cols-4 gap-1 flex-1">
          <div className="rounded-[6px] bg-white/[0.03] border border-amber-500/25 p-1 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute right-0 bottom-0 text-[8px] opacity-10 leading-none">🥃</div>
            <span className="text-[5px] font-black text-slate-300 leading-tight uppercase truncate">Scotch</span>
            <span className="text-[5px] font-black text-amber-400">₹450</span>
          </div>
          <div className="rounded-[6px] bg-white/[0.03] border border-white/5 p-1 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute right-0 bottom-0 text-[8px] opacity-10 leading-none">🍺</div>
            <span className="text-[5px] font-black text-slate-300 leading-tight uppercase truncate">Beer</span>
            <span className="text-[5px] font-black text-amber-400">₹250</span>
          </div>
          <div className="rounded-[6px] bg-white/[0.03] border border-white/5 p-1 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute right-0 bottom-0 text-[8px] opacity-10 leading-none">🍸</div>
            <span className="text-[5px] font-black text-slate-300 leading-tight uppercase truncate">Vodka</span>
            <span className="text-[5px] font-black text-amber-400">₹320</span>
          </div>
          <div className="rounded-[6px] bg-white/[0.03] border border-white/5 p-1 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute right-0 bottom-0 text-[8px] opacity-10 leading-none">🍹</div>
            <span className="text-[5px] font-black text-slate-300 leading-tight uppercase truncate">Gin</span>
            <span className="text-[5px] font-black text-amber-400">₹380</span>
          </div>
        </div>
      </div>
    );
  }
  if (themeId === 'CAFE') {
    return (
      <div className="w-full aspect-[1.8/1] rounded-xl bg-[#0E0A06] border border-[#D4956A]/15 p-1.5 flex flex-col gap-1 overflow-hidden mt-1.5 shadow-inner select-none pointer-events-none">
        {/* Mock top category pills */}
        <div className="flex gap-1 overflow-hidden shrink-0">
          <div className="px-1.5 py-0.5 rounded-[4px] bg-[#D4956A]/20 border border-[#D4956A]/35 text-[#D4956A] text-[5px] font-black uppercase tracking-wider scale-90 origin-left">All</div>
          <div className="px-1.5 py-0.5 rounded-[4px] bg-white/5 text-slate-500 text-[5px] font-bold scale-90 origin-left">Coffee</div>
          <div className="px-1.5 py-0.5 rounded-[4px] bg-white/5 text-slate-500 text-[5px] font-bold scale-90 origin-left">Tea</div>
        </div>
        {/* Mock cards */}
        <div className="grid grid-cols-4 gap-1 flex-1">
          <div className="rounded-[6px] bg-white/[0.03] border border-[#D4956A]/25 p-1 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0.5 right-0.5 bg-yellow-500/10 text-yellow-500 text-[3px] px-0.5 rounded font-black scale-75 leading-none">★</div>
            <span className="text-[5px] font-black text-slate-300 leading-tight uppercase truncate">Latte</span>
            <span className="text-[5px] font-black text-[#D4956A]">₹180</span>
          </div>
          <div className="rounded-[6px] bg-white/[0.03] border border-white/5 p-1 flex flex-col justify-between relative overflow-hidden">
            <span className="text-[5px] font-black text-slate-300 leading-tight uppercase truncate">Mocha</span>
            <span className="text-[5px] font-black text-[#D4956A]">₹200</span>
          </div>
          <div className="rounded-[6px] bg-white/[0.03] border border-white/5 p-1 flex flex-col justify-between relative overflow-hidden">
            <span className="text-[5px] font-black text-slate-300 leading-tight uppercase truncate">Tea</span>
            <span className="text-[5px] font-black text-[#D4956A]">₹90</span>
          </div>
          <div className="rounded-[6px] bg-white/[0.03] border border-white/5 p-1 flex flex-col justify-between relative overflow-hidden">
            <span className="text-[5px] font-black text-slate-300 leading-tight uppercase truncate">Crois</span>
            <span className="text-[5px] font-black text-[#D4956A]">₹140</span>
          </div>
        </div>
      </div>
    );
  }
  if (themeId === 'TABLET_CAFE') {
    return (
      <div className="w-full aspect-[1.8/1] rounded-xl bg-[#0E0A06] border border-[#D4956A]/15 p-1 flex flex-col gap-0.5 overflow-hidden mt-1.5 shadow-inner select-none pointer-events-none">
        {/* Mock top category pills */}
        <div className="flex gap-1 overflow-hidden shrink-0 pb-0.5">
          <div className="px-1 py-0.5 rounded-[4px] bg-[#D4956A]/20 border border-[#D4956A]/35 text-[#D4956A] text-[4px] font-black uppercase tracking-wider scale-90 origin-left">All</div>
          <div className="px-1 py-0.5 rounded-[4px] bg-white/5 text-slate-500 text-[4px] font-bold scale-90 origin-left">Coffee</div>
          <div className="px-1 py-0.5 rounded-[4px] bg-white/5 text-slate-500 text-[4px] font-bold scale-90 origin-left">Tea</div>
        </div>
        {/* Mock cards: 3 columns to give them enough space */}
        <div className="grid grid-cols-3 gap-1 flex-1 pb-0.5">
          <div className="rounded-[8px] bg-slate-900/80 border border-[#D4956A]/25 p-1 flex flex-col items-center justify-between relative overflow-hidden">
            <div className="absolute top-0.5 right-0.5 w-1 h-1 rounded-full bg-emerald-500" />
            <div className="w-4 h-4 rounded-full flex items-center justify-center bg-indigo-900/40 border border-white/10 scale-90">
              <span className="text-[6px]">☕</span>
            </div>
            <span className="text-[4.5px] font-black text-slate-200 mt-0.5 leading-none uppercase truncate">Latte</span>
            <div className="flex gap-0.5 mt-0.5 w-full justify-center">
              <span className="text-[3px] px-0.5 py-0.1 bg-slate-800 border border-slate-700/50 text-slate-400 rounded">S</span>
              <span className="text-[3px] px-0.5 py-0.1 bg-slate-800 border border-slate-700/50 text-slate-400 rounded">L</span>
            </div>
            <span className="text-[4.5px] font-black text-[#D4956A] mt-auto">₹180</span>
          </div>

          <div className="rounded-[8px] bg-slate-900/80 border border-white/5 p-1 flex flex-col items-center justify-between relative overflow-hidden">
            <div className="absolute top-0.5 right-0.5 w-1 h-1 rounded-full bg-emerald-500" />
            <div className="w-4 h-4 rounded-full flex items-center justify-center bg-cyan-900/40 border border-white/10 scale-90">
              <span className="text-[6px]">🥤</span>
            </div>
            <span className="text-[4.5px] font-black text-slate-200 mt-0.5 leading-none uppercase truncate">Shake</span>
            <div className="flex gap-0.5 mt-0.5 w-full justify-center">
              <span className="text-[3px] px-0.5 py-0.1 bg-slate-800 border border-slate-700/50 text-slate-400 rounded">S</span>
              <span className="text-[3px] px-0.5 py-0.1 bg-slate-800 border border-slate-700/50 text-slate-400 rounded">L</span>
            </div>
            <span className="text-[4.5px] font-black text-[#D4956A] mt-auto">₹220</span>
          </div>

          <div className="rounded-[8px] bg-slate-900/80 border border-white/5 p-1 flex flex-col items-center justify-between relative overflow-hidden">
            <div className="absolute top-0.5 right-0.5 w-1 h-1 rounded-full bg-emerald-500" />
            <div className="w-4 h-4 rounded-full flex items-center justify-center bg-amber-900/40 border border-white/10 scale-90">
              <span className="text-[6px]">☕</span>
            </div>
            <span className="text-[4.5px] font-black text-slate-200 mt-0.5 leading-none uppercase truncate">Chai</span>
            <span className="text-[4.5px] font-black text-[#D4956A] mt-auto">₹90</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

interface PosTerminalThemeFormProps {
  propertyCode?: string;
}

export const PosTerminalThemeForm = ({ propertyCode: propPropertyCode }: PosTerminalThemeFormProps = {}) => {
  const [propertyCode, setPropertyCode] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  // Each terminal's selected theme
  const [themes, setThemes] = useState<Record<string, PosTheme>>({
    billing: 'RESTAURANT',
    barpos: 'BAR',
    cafepos: 'CAFE',
    tablet: 'RESTAURANT',
  });

  const [tabletMode, setTabletMode] = useState<'unified' | 'split'>('unified');
  const [tabletThemes, setTabletThemes] = useState<Record<string, PosTheme>>({
    restaurant: 'RESTAURANT',
    bar: 'BAR',
    cafe: 'TABLET_CAFE',
  });

  const [dbCode, setDbCode] = useState<string>('');

  useEffect(() => {
    setLoading(true);
    const routeCode = propPropertyCode || '';
    setPropertyCode(routeCode);

    // Fetch the property info to resolve the database code
    fetch('/api/setup/properties/current')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data?.code) {
          const fetchedDbCode = data.data.code.toLowerCase();
          setDbCode(fetchedDbCode);

          const lowerRoute = routeCode.toLowerCase();
          
          // Load themes (checking route slug first, falling back to db code)
          const loaded: Record<string, PosTheme> = {
            billing: 'RESTAURANT',
            barpos: 'BAR',
            cafepos: 'CAFE',
            tablet: 'RESTAURANT',
          };

          TERMINALS.forEach((t) => {
            const valRoute = lowerRoute ? localStorage.getItem(`pos_layout_${t.key}_${lowerRoute}`) : null;
            const valDb = localStorage.getItem(`pos_layout_${t.key}_${fetchedDbCode}`);
            const val = valRoute || valDb;
            if (val === 'RESTAURANT' || val === 'BAR' || val === 'CAFE' || val === 'TABLET_CAFE') {
              loaded[t.key] = val as PosTheme;
            }
          });
          setThemes(loaded);

          // Load tablet mode
          const modeRoute = lowerRoute ? localStorage.getItem(`pos_layout_tablet_mode_${lowerRoute}`) : null;
          const modeDb = localStorage.getItem(`pos_layout_tablet_mode_${fetchedDbCode}`);
          const savedMode = modeRoute || modeDb;
          if (savedMode === 'unified' || savedMode === 'split') {
            setTabletMode(savedMode);
          }

          // Load tablet tab themes
          const restRoute = lowerRoute ? localStorage.getItem(`pos_layout_tablet_restaurant_${lowerRoute}`) : null;
          const restDb = localStorage.getItem(`pos_layout_tablet_restaurant_${fetchedDbCode}`);
          const rest = restRoute || restDb;

          const barRoute = lowerRoute ? localStorage.getItem(`pos_layout_tablet_bar_${lowerRoute}`) : null;
          const barDb = localStorage.getItem(`pos_layout_tablet_bar_${fetchedDbCode}`);
          const bar = barRoute || barDb;

          const cafeRoute = lowerRoute ? localStorage.getItem(`pos_layout_tablet_cafe_${lowerRoute}`) : null;
          const cafeDb = localStorage.getItem(`pos_layout_tablet_cafe_${fetchedDbCode}`);
          const cafe = cafeRoute || cafeDb;

          setTabletThemes({
            restaurant: (rest === 'RESTAURANT' || rest === 'BAR' || rest === 'CAFE' || rest === 'TABLET_CAFE') ? rest as PosTheme : 'RESTAURANT',
            bar: (bar === 'RESTAURANT' || bar === 'BAR' || bar === 'CAFE' || bar === 'TABLET_CAFE') ? bar as PosTheme : 'BAR',
            cafe: (cafe === 'RESTAURANT' || cafe === 'BAR' || cafe === 'CAFE' || cafe === 'TABLET_CAFE') ? cafe as PosTheme : 'TABLET_CAFE',
          });
        } else {
          // Fallback to loading using only route slug
          const lowerRoute = routeCode.toLowerCase();
          const loaded: Record<string, PosTheme> = {
            billing: 'RESTAURANT',
            barpos: 'BAR',
            cafepos: 'CAFE',
            tablet: 'RESTAURANT',
          };
          TERMINALS.forEach((t) => {
            const val = lowerRoute ? localStorage.getItem(`pos_layout_${t.key}_${lowerRoute}`) : null;
            if (val === 'RESTAURANT' || val === 'BAR' || val === 'CAFE' || val === 'TABLET_CAFE') {
              loaded[t.key] = val as PosTheme;
            }
          });
          setThemes(loaded);

          const savedMode = lowerRoute ? localStorage.getItem(`pos_layout_tablet_mode_${lowerRoute}`) : null;
          if (savedMode === 'unified' || savedMode === 'split') {
            setTabletMode(savedMode);
          }

          const rest = lowerRoute ? localStorage.getItem(`pos_layout_tablet_restaurant_${lowerRoute}`) : null;
          const bar = lowerRoute ? localStorage.getItem(`pos_layout_tablet_bar_${lowerRoute}`) : null;
          const cafe = lowerRoute ? localStorage.getItem(`pos_layout_tablet_cafe_${lowerRoute}`) : null;

          setTabletThemes({
            restaurant: (rest === 'RESTAURANT' || rest === 'BAR' || rest === 'CAFE' || rest === 'TABLET_CAFE') ? rest as PosTheme : 'RESTAURANT',
            bar: (bar === 'RESTAURANT' || bar === 'BAR' || bar === 'CAFE' || bar === 'TABLET_CAFE') ? bar as PosTheme : 'BAR',
            cafe: (cafe === 'RESTAURANT' || cafe === 'BAR' || cafe === 'CAFE' || cafe === 'TABLET_CAFE') ? cafe as PosTheme : 'TABLET_CAFE',
          });
        }
      })
      .catch((err) => {
        console.error('Failed to resolve property DB code:', err);
        // Fallback to loading using only route slug on error
        const lowerRoute = routeCode.toLowerCase();
        const loaded: Record<string, PosTheme> = {
          billing: 'RESTAURANT',
          barpos: 'BAR',
          cafepos: 'CAFE',
          tablet: 'RESTAURANT',
        };
        TERMINALS.forEach((t) => {
          const val = lowerRoute ? localStorage.getItem(`pos_layout_${t.key}_${lowerRoute}`) : null;
          if (val === 'RESTAURANT' || val === 'BAR' || val === 'CAFE' || val === 'TABLET_CAFE') {
            loaded[t.key] = val as PosTheme;
          }
        });
        setThemes(loaded);

        const savedMode = lowerRoute ? localStorage.getItem(`pos_layout_tablet_mode_${lowerRoute}`) : null;
        if (savedMode === 'unified' || savedMode === 'split') {
          setTabletMode(savedMode);
        }

        const rest = lowerRoute ? localStorage.getItem(`pos_layout_tablet_restaurant_${lowerRoute}`) : null;
        const bar = lowerRoute ? localStorage.getItem(`pos_layout_tablet_bar_${lowerRoute}`) : null;
        const cafe = lowerRoute ? localStorage.getItem(`pos_layout_tablet_cafe_${lowerRoute}`) : null;

        setTabletThemes({
          restaurant: (rest === 'RESTAURANT' || rest === 'BAR' || rest === 'CAFE' || rest === 'TABLET_CAFE') ? rest as PosTheme : 'RESTAURANT',
          bar: (bar === 'RESTAURANT' || bar === 'BAR' || bar === 'CAFE' || bar === 'TABLET_CAFE') ? bar as PosTheme : 'BAR',
          cafe: (cafe === 'RESTAURANT' || cafe === 'BAR' || cafe === 'CAFE' || cafe === 'TABLET_CAFE') ? cafe as PosTheme : 'TABLET_CAFE',
        });
      })
      .finally(() => setLoading(false));
  }, [propPropertyCode]);

  const handleSave = () => {
    const lowerRoute = propertyCode ? propertyCode.toLowerCase() : '';
    const lowerDb = dbCode ? dbCode.toLowerCase() : '';

    TERMINALS.forEach((t) => {
      if (lowerRoute) {
        localStorage.setItem(`pos_layout_${t.key}_${lowerRoute}`, themes[t.key]);
      }
      if (lowerDb) {
        localStorage.setItem(`pos_layout_${t.key}_${lowerDb}`, themes[t.key]);
      }
    });

    // Save tablet advanced configurations
    if (lowerRoute) {
      localStorage.setItem(`pos_layout_tablet_mode_${lowerRoute}`, tabletMode);
      localStorage.setItem(`pos_layout_tablet_restaurant_${lowerRoute}`, tabletThemes.restaurant);
      localStorage.setItem(`pos_layout_tablet_bar_${lowerRoute}`, tabletThemes.bar);
      localStorage.setItem(`pos_layout_tablet_cafe_${lowerRoute}`, tabletThemes.cafe);
    }
    if (lowerDb) {
      localStorage.setItem(`pos_layout_tablet_mode_${lowerDb}`, tabletMode);
      localStorage.setItem(`pos_layout_tablet_restaurant_${lowerDb}`, tabletThemes.restaurant);
      localStorage.setItem(`pos_layout_tablet_bar_${lowerDb}`, tabletThemes.bar);
      localStorage.setItem(`pos_layout_tablet_cafe_${lowerDb}`, tabletThemes.cafe);
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const setTerminalTheme = (terminalKey: string, theme: PosTheme) => {
    setThemes((prev) => ({ ...prev, [terminalKey]: theme }));
    const lowerRoute = propertyCode ? propertyCode.toLowerCase() : '';
    const lowerDb = dbCode ? dbCode.toLowerCase() : '';

    if (lowerRoute) {
      localStorage.setItem(`pos_layout_${terminalKey}_${lowerRoute}`, theme);
    }
    if (lowerDb) {
      localStorage.setItem(`pos_layout_${terminalKey}_${lowerDb}`, theme);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTabletModeChange = (mode: 'unified' | 'split') => {
    setTabletMode(mode);
    const lowerRoute = propertyCode ? propertyCode.toLowerCase() : '';
    const lowerDb = dbCode ? dbCode.toLowerCase() : '';

    if (lowerRoute) {
      localStorage.setItem(`pos_layout_tablet_mode_${lowerRoute}`, mode);
    }
    if (lowerDb) {
      localStorage.setItem(`pos_layout_tablet_mode_${lowerDb}`, mode);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTabletTabThemeChange = (tabKey: 'restaurant' | 'bar' | 'cafe', theme: PosTheme) => {
    setTabletThemes((prev) => ({ ...prev, [tabKey]: theme }));
    const lowerRoute = propertyCode ? propertyCode.toLowerCase() : '';
    const lowerDb = dbCode ? dbCode.toLowerCase() : '';

    if (lowerRoute) {
      localStorage.setItem(`pos_layout_tablet_${tabKey}_${lowerRoute}`, theme);
    }
    if (lowerDb) {
      localStorage.setItem(`pos_layout_tablet_${tabKey}_${lowerDb}`, theme);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm p-10 flex items-center justify-center gap-3">
        <Loader2 size={20} className="animate-spin text-indigo-500" />
        <span className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Loading...</span>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* ── Header ── */}
      <div className="flex items-center gap-4 px-6 py-5 border-b border-gray-100 dark:border-slate-800">
        <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 flex items-center justify-center flex-shrink-0">
          <Palette size={22} className="text-indigo-600 dark:text-indigo-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">
            POS Terminal Themes
          </h3>
          <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">
            Assign a design theme to each POS terminal independently
          </p>
        </div>
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/20 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
          <Monitor size={12} className="text-indigo-500" />
          <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">4 Terminals</span>
        </div>
      </div>

      {/* ── Theme legend ── */}
      <div className="px-6 pt-5 pb-2">
        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500 mb-3">Available Themes</p>
        <div className="grid grid-cols-3 gap-3">
          {THEMES.map((t) => (
            <div key={t.id} className={`flex items-center gap-2.5 p-3 rounded-xl border ${t.activeBorder} ${t.activeBg}`}>
              <span className="text-lg leading-none">{t.emoji}</span>
              <div>
                <p className={`text-[10px] font-black uppercase tracking-wide ${t.activeText}`}>{t.label}</p>
                <p className="text-[9px] font-bold text-gray-400 dark:text-slate-500 mt-0.5">{t.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Terminals ── */}
      <div className="px-6 pb-2 pt-4 space-y-4">
        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">Terminal Configuration</p>

        {TERMINALS.map((terminal) => {
          const currentTheme = themes[terminal.key];
          const themeObj = THEMES.find((t) => t.id === currentTheme)!;

          return (
            <div
              key={terminal.key}
              className={`rounded-2xl border-2 overflow-hidden transition-all duration-200 ${terminal.borderColor}`}
            >
              {/* Terminal header */}
              <div className={`flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-slate-800/50 border-b ${terminal.borderColor}`}>
                <span className="text-xl leading-none">{terminal.emoji}</span>
                <div className="flex-1">
                  <p className={`text-[11px] font-black uppercase tracking-wider ${terminal.color}`}>
                    {terminal.label}
                  </p>
                  <p className="text-[9px] font-bold text-gray-400 dark:text-slate-500 font-mono">
                    {terminal.url}
                  </p>
                </div>
                {/* Currently active theme badge */}
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${themeObj.activeBorder} ${themeObj.activeBg}`}>
                  <span className="text-xs leading-none">{themeObj.emoji}</span>
                  <span className={`text-[9px] font-black uppercase tracking-widest ${themeObj.activeText}`}>
                    {themeObj.label}
                  </span>
                </div>
              </div>

              {/* Theme selector buttons */}
              <div className="flex items-center divide-x divide-gray-100 dark:divide-slate-700/50 bg-white dark:bg-slate-900">
                {THEMES.map((theme) => {
                  const isSelected = currentTheme === theme.id;
                  return (
                    <button
                      key={theme.id}
                      onClick={() => setTerminalTheme(terminal.key, theme.id)}
                      className={`flex-1 flex flex-col items-center gap-1.5 px-3 pb-3 pt-4 transition-all duration-150 relative
                        ${isSelected
                          ? `${theme.activeBg}`
                          : 'hover:bg-gray-50 dark:hover:bg-slate-800/50'
                        }`}
                    >
                      <span className="text-xl leading-none">{theme.emoji}</span>
                      <span className={`text-[9px] font-black uppercase tracking-wider transition-colors
                        ${isSelected ? theme.activeText : 'text-gray-400 dark:text-slate-500'}`}>
                        {theme.label}
                      </span>
                      {/* Live mockup layout preview */}
                      <MiniThemePreview themeId={theme.id} />
                      {/* Active checkmark */}
                      {isSelected && (
                        <div className={`absolute top-2 right-2 w-4 h-4 rounded-full ${theme.dot} flex items-center justify-center`}>
                          <Check size={9} className="text-white" strokeWidth={3.5} />
                        </div>
                      )}
                      {/* Active bottom bar */}
                      {isSelected && (
                        <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${theme.dot}`} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Divider ── */}
      <div className="border-t border-gray-100 dark:border-slate-800/80 my-2" />

      {/* ── Tablet / Waiter POS Advanced Theme Customization ── */}
      <div className="px-6 py-5">
        <div className="flex items-center gap-3.5 mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 flex items-center justify-center flex-shrink-0">
            <Monitor size={18} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="flex-1">
            <h4 className="text-[12px] font-black text-gray-900 dark:text-white uppercase tracking-wider">
              Tablet / Waiter POS Advanced Setup
            </h4>
            <p className="text-[9px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">
              Customize if the waiter app uses one unified layout or switches dynamically by tab
            </p>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="grid grid-cols-2 gap-3 p-1 bg-gray-50 dark:bg-slate-800/40 rounded-2xl border border-gray-100 dark:border-slate-800/60 mb-5">
          <button
            onClick={() => handleTabletModeChange('unified')}
            className={`py-3.5 px-4 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2
              ${tabletMode === 'unified'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-gray-100 dark:border-slate-700'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-slate-300'
              }`}
          >
            📱 Unified layout Theme
          </button>
          <button
            onClick={() => handleTabletModeChange('split')}
            className={`py-3.5 px-4 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2
              ${tabletMode === 'split'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-gray-100 dark:border-slate-700'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-slate-300'
              }`}
          >
            🔀 Split theme by tab
          </button>
        </div>

        {/* Unified Mode Settings Note */}
        {tabletMode === 'unified' && (
          <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-100/30 dark:border-indigo-900/20 text-center">
            <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider leading-relaxed">
              Unified layout is enabled. The Tablet POS will use the theme layout selected in the "Tablet / Waiter POS" card above for all tabs.
            </p>
          </div>
        )}

        {/* Split Mode Sub-selectors */}
        {tabletMode === 'split' && (
          <div className="space-y-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">
              Configure Individual layouts
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Restaurant Tab */}
              <div className="rounded-xl border border-gray-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 overflow-hidden flex flex-col">
                <div className="px-4 py-2.5 bg-gray-50 dark:bg-slate-800/40 border-b border-gray-100 dark:border-slate-800/60 flex items-center gap-2">
                  <span className="text-sm">🍽️</span>
                  <span className="text-[10px] font-black uppercase tracking-wider text-rose-500">
                    Restaurant Tab Layout
                  </span>
                </div>
                <div className="p-3 flex flex-col gap-2 flex-1">
                  {THEMES.map((theme) => {
                    const isSel = tabletThemes.restaurant === theme.id;
                    return (
                      <button
                        key={theme.id}
                        onClick={() => handleTabletTabThemeChange('restaurant', theme.id)}
                        className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-left transition-all
                          ${isSel
                            ? 'bg-rose-50/30 dark:bg-rose-950/20 border-rose-400 text-rose-500'
                            : 'border-transparent hover:bg-gray-50 dark:hover:bg-slate-800/50 text-gray-400 dark:text-slate-500'
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs">{theme.emoji}</span>
                          <span className="text-[9px] font-black uppercase tracking-wider">{theme.label}</span>
                        </div>
                        {isSel && <Check size={10} className="text-rose-500" strokeWidth={3.5} />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bar Tab */}
              <div className="rounded-xl border border-gray-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 overflow-hidden flex flex-col">
                <div className="px-4 py-2.5 bg-gray-50 dark:bg-slate-800/40 border-b border-gray-100 dark:border-slate-800/60 flex items-center gap-2">
                  <span className="text-sm">🍺</span>
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-500">
                    Bar Tab Layout
                  </span>
                </div>
                <div className="p-3 flex flex-col gap-2 flex-1">
                  {THEMES.map((theme) => {
                    const isSel = tabletThemes.bar === theme.id;
                    return (
                      <button
                        key={theme.id}
                        onClick={() => handleTabletTabThemeChange('bar', theme.id)}
                        className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-left transition-all
                          ${isSel
                            ? 'bg-amber-50/30 dark:bg-amber-950/20 border-amber-400 text-amber-500'
                            : 'border-transparent hover:bg-gray-50 dark:hover:bg-slate-800/50 text-gray-400 dark:text-slate-500'
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs">{theme.emoji}</span>
                          <span className="text-[9px] font-black uppercase tracking-wider">{theme.label}</span>
                        </div>
                        {isSel && <Check size={10} className="text-amber-500" strokeWidth={3.5} />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cafe Tab */}
              <div className="rounded-xl border border-gray-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 overflow-hidden flex flex-col">
                <div className="px-4 py-2.5 bg-gray-50 dark:bg-slate-800/40 border-b border-gray-100 dark:border-slate-800/60 flex items-center gap-2">
                  <span className="text-sm">☕</span>
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-500">
                    Cafe Tab Layout
                  </span>
                </div>
                <div className="p-3 flex flex-col gap-2 flex-1">
                  {THEMES.map((theme) => {
                    const isSel = tabletThemes.cafe === theme.id;
                    return (
                      <button
                        key={theme.id}
                        onClick={() => handleTabletTabThemeChange('cafe', theme.id)}
                        className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-left transition-all
                          ${isSel
                            ? 'bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-400 text-emerald-500'
                            : 'border-transparent hover:bg-gray-50 dark:hover:bg-slate-800/50 text-gray-400 dark:text-slate-500'
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs">{theme.emoji}</span>
                          <span className="text-[9px] font-black uppercase tracking-wider">{theme.label}</span>
                        </div>
                        {isSel && <Check size={10} className="text-emerald-500" strokeWidth={3.5} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Save Button ── */}
      <div className="px-6 pb-6 pt-3 space-y-2">
        <button
          onClick={handleSave}
          disabled={!propertyCode}
          className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all duration-300 active:scale-[0.98]
            ${saved
              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
              : 'bg-slate-900 dark:bg-slate-700 hover:bg-black dark:hover:bg-slate-600 text-white shadow-md hover:shadow-lg'
            }`}
        >
          {saved ? (
            <>
              <Check size={15} strokeWidth={3} />
              Themes Saved Successfully!
            </>
          ) : (
            <>
              <Save size={14} />
              Save All Terminal Themes
            </>
          )}
        </button>
        <p className="text-[9px] font-bold text-center text-gray-400 dark:text-slate-500 uppercase tracking-wider">
          Changes apply immediately on next terminal open
        </p>
      </div>
    </div>
  );
};
