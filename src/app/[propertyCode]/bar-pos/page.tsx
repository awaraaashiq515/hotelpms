'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import RestaurantPosView from '@/components/pos/RestaurantPosView';

type PosTheme = 'RESTAURANT' | 'BAR' | 'CAFE';

export const dynamic = 'force-dynamic';

export default function BarPosPage() {
  const params = useParams();
  const propertyCode = params?.propertyCode as string | undefined;
  const [layout, setLayout] = useState<PosTheme | null>(null);

  useEffect(() => {
    if (!propertyCode) return;
    const key = `pos_layout_barpos_${propertyCode.toLowerCase()}`;
    const saved = localStorage.getItem(key) as PosTheme | null;
    console.log(`[POS Bar Page] Read key: ${key} = ${saved}`);
    setLayout(saved || 'BAR');
  }, [propertyCode]);

  if (!layout) {
    return (
      <div className="h-screen bg-slate-950 flex flex-col items-center justify-center gap-3 text-white">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Loading Bar POS...</span>
      </div>
    );
  }

  return <RestaurantPosView terminalMode="BAR" themeLayout={layout} />;
}