'use client';

import React, { useState, useEffect } from 'react';
import RestaurantPosView from '@/components/pos/RestaurantPosView';

type PosTheme = 'RESTAURANT' | 'BAR' | 'CAFE' | 'TABLET_CAFE';

export const dynamic = 'force-dynamic';

export default function HotelBarPosPage() {
  const [layout, setLayout] = useState<PosTheme | null>(null);

  useEffect(() => {
    const key = `pos_layout_barpos_hotel`;
    const saved = localStorage.getItem(key) as PosTheme | null;
    setLayout(saved || 'BAR');
  }, []);

  if (!layout) {
    return (
      <div className="min-h-[70vh] bg-slate-950 flex flex-col items-center justify-center gap-3 text-white rounded-2xl">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Loading Bar POS...</span>
      </div>
    );
  }

  return <RestaurantPosView terminalMode="BAR" themeLayout={layout} />;
}
