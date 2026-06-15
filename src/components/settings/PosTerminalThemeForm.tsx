'use client';

import React, { useState, useEffect } from 'react';
import { Monitor, Check, Palette, Save, Loader2 } from 'lucide-react';

type PosTheme = 'RESTAURANT' | 'BAR' | 'CAFE';

interface Terminal {
  key: 'billing' | 'barpos' | 'cafepos';
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
  });

  useEffect(() => {
    setLoading(true);
    const code = propPropertyCode || '';
    if (code) {
      setPropertyCode(code);

      // Load saved themes from localStorage
      const loaded: Record<string, PosTheme> = {
        billing: 'RESTAURANT',
        barpos: 'BAR',
        cafepos: 'CAFE',
      };
      const lowerCode = code.toLowerCase();
      TERMINALS.forEach((t) => {
        const val = localStorage.getItem(`pos_layout_${t.key}_${lowerCode}`);
        if (val === 'RESTAURANT' || val === 'BAR' || val === 'CAFE') {
          loaded[t.key] = val as PosTheme;
        }
      });
      setThemes(loaded);
      setLoading(false);
    } else {
      fetch('/api/setup/properties/current')
        .then((r) => r.json())
        .then((data) => {
          if (data.success && data.data?.code) {
            const fetchedCode = data.data.code;
            setPropertyCode(fetchedCode);

            // Load saved themes from localStorage
            const loaded: Record<string, PosTheme> = {
              billing: 'RESTAURANT',
              barpos: 'BAR',
              cafepos: 'CAFE',
            };
            const lowerCode = fetchedCode.toLowerCase();
            TERMINALS.forEach((t) => {
              const val = localStorage.getItem(`pos_layout_${t.key}_${lowerCode}`);
              if (val === 'RESTAURANT' || val === 'BAR' || val === 'CAFE') {
                loaded[t.key] = val as PosTheme;
              }
            });
            setThemes(loaded);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [propPropertyCode]);

  const handleSave = () => {
    if (!propertyCode) return;
    const lowerCode = propertyCode.toLowerCase();
    TERMINALS.forEach((t) => {
      localStorage.setItem(`pos_layout_${t.key}_${lowerCode}`, themes[t.key]);
      console.log(`[POS Themes] Manually saved key: pos_layout_${t.key}_${lowerCode} = ${themes[t.key]}`);
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const setTerminalTheme = (terminalKey: string, theme: PosTheme) => {
    setThemes((prev) => ({ ...prev, [terminalKey]: theme }));
    if (propertyCode) {
      const lowerCode = propertyCode.toLowerCase();
      const key = `pos_layout_${terminalKey}_${lowerCode}`;
      localStorage.setItem(key, theme);
      console.log(`[POS Themes] Auto-saved key: ${key} = ${theme}`);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
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
          <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">3 Terminals</span>
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
