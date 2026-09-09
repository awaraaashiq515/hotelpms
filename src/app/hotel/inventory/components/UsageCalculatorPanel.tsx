'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Users, TrendingDown, Loader2, Package, AlertTriangle, ChevronDown, ChevronUp, Layers } from 'lucide-react';
import type { StockItem } from './LowStockAlert';

interface KitItem {
  itemId: string;
  itemName: string;
  unit?: string;
  qtyPerUse: number;
}
interface Kit {
  id: string;
  name: string;
  kitType: string;
  description?: string;
  items: KitItem[];
  usageLogs?: { usedAt: string; usedCount: number }[];
}

const KIT_TYPE_COLORS: Record<string, string> = {
  ROOM:    'bg-blue-500/15 text-blue-300 border-blue-500/30',
  SUITE:   'bg-purple-500/15 text-purple-300 border-purple-500/30',
  GUEST:   'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  SERVICE: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  CUSTOM:  'bg-slate-500/15 text-slate-300 border-slate-500/30',
};

export function UsageCalculatorPanel({
  allStock,
  propertyId,
}: {
  allStock: StockItem[];
  propertyId: string;
}) {
  const [kits, setKits] = useState<Kit[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const fetchKits = useCallback(async () => {
    if (!propertyId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/inventory/kits?propertyId=${propertyId}`);
      const data = await res.json();
      if (data.data) setKits(data.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => { fetchKits(); }, [fetchKits]);

  const stockMap = Object.fromEntries(allStock.map(s => [s.id, s]));

  const calcKit = (kit: Kit) => {
    const rows = kit.items.map(item => {
      const s = stockMap[item.itemId];
      const available = s?.currentStock ?? 0;
      const canDo = item.qtyPerUse > 0 ? Math.floor(available / item.qtyPerUse) : 999;
      return { ...item, available, canDo, unit: item.unit ?? s?.unit ?? 'pcs' };
    });
    const maxTimes = rows.length > 0 ? Math.min(...rows.map(r => r.canDo)) : 0;
    const bottleneck = rows.reduce((min, r) => (r.canDo < min.canDo ? r : min), rows[0]);
    const totalUsage = (kit.usageLogs ?? []).reduce((s, l) => s + l.usedCount, 0);
    return { rows, maxTimes, bottleneck, totalUsage };
  };

  const toggleExpand = (id: string) =>
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  // Grand summary
  const summaries = kits.map(k => ({ kit: k, ...calcKit(k) }));
  const totalCanServe = summaries.reduce((s, k) => s + k.maxTimes, 0);
  const criticalKits = summaries.filter(k => k.maxTimes < 3).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-base font-black text-white">Usage Calculator</h2>
        <p className="text-[10px] text-slate-500 mt-0.5">
          Based on current stock — how many times each kit can be fulfilled right now
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-white/8 bg-slate-800/40 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Layers size={13} className="text-orange-400" />
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Total Kits</span>
          </div>
          <p className="text-2xl font-black text-white">{kits.length}</p>
          <p className="text-[9px] text-slate-500 mt-0.5">Active recipes</p>
        </div>
        <div className="rounded-2xl border border-white/8 bg-slate-800/40 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users size={13} className="text-emerald-400" />
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Can Serve</span>
          </div>
          <p className="text-2xl font-black text-emerald-400">{totalCanServe}</p>
          <p className="text-[9px] text-slate-500 mt-0.5">Total across all kits</p>
        </div>
        <div className="rounded-2xl border border-white/8 bg-slate-800/40 p-4 col-span-2 sm:col-span-1">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={13} className="text-rose-400" />
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Critical Kits</span>
          </div>
          <p className="text-2xl font-black text-rose-400">{criticalKits}</p>
          <p className="text-[9px] text-slate-500 mt-0.5">Need restock soon (&lt;3 uses)</p>
        </div>
      </div>

      {/* Kit breakdown */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={22} className="animate-spin text-orange-400" />
        </div>
      ) : kits.length === 0 ? (
        <div className="text-center py-14 rounded-2xl border border-dashed border-white/10">
          <Layers size={28} className="text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 text-sm font-black">No kits defined yet</p>
          <p className="text-slate-600 text-xs mt-1">Go to Kit Mapping tab to create your first recipe</p>
        </div>
      ) : (
        <div className="space-y-3">
          {summaries.map(({ kit, rows, maxTimes, bottleneck, totalUsage }) => {
            const typeColor = KIT_TYPE_COLORS[kit.kitType] ?? KIT_TYPE_COLORS.CUSTOM;
            const isOpen = expanded.has(kit.id);
            const statusColor = maxTimes === 0 ? 'text-rose-400' : maxTimes < 5 ? 'text-amber-400' : 'text-emerald-400';
            const barColor = maxTimes === 0 ? 'bg-rose-500' : maxTimes < 5 ? 'bg-amber-500' : 'bg-emerald-500';
            const barPct = Math.min(100, (maxTimes / 20) * 100); // normalize to 20 max for visual

            return (
              <div key={kit.id} className="rounded-2xl border border-white/8 bg-slate-800/40 overflow-hidden">
                {/* Kit header row */}
                <div className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-700/60 flex items-center justify-center flex-shrink-0">
                    <TrendingDown size={15} className={statusColor} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-black text-white truncate">{kit.name}</span>
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border ${typeColor}`}>
                        {kit.kitType}
                      </span>
                    </div>
                    {/* Bar */}
                    <div className="mt-2 flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-slate-900 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                          style={{ width: `${barPct}%` }}
                        />
                      </div>
                      <span className={`text-xs font-black w-16 text-right ${statusColor}`}>
                        {maxTimes} uses
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-[9px] text-slate-500">{totalUsage}× used</span>
                    <button
                      onClick={() => toggleExpand(kit.id)}
                      className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-colors"
                    >
                      {isOpen ? <ChevronUp size={11} className="text-slate-400" /> : <ChevronDown size={11} className="text-slate-400" />}
                    </button>
                  </div>
                </div>

                {/* Expanded item breakdown */}
                {isOpen && (
                  <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-2">
                    <div className="grid grid-cols-4 text-[9px] font-black text-slate-600 uppercase tracking-wider px-1 mb-1">
                      <span>Item</span>
                      <span className="text-center">Per Use</span>
                      <span className="text-center">Available</span>
                      <span className="text-right">Can Do</span>
                    </div>
                    {rows.map((row, i) => {
                      const isBottleneck = row.itemId === bottleneck?.itemId;
                      return (
                        <div key={i} className={`grid grid-cols-4 items-center rounded-xl px-3 py-2
                          ${isBottleneck ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-slate-900/40'}`}>
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Package size={9} className="text-slate-600 flex-shrink-0" />
                            <span className="text-[10px] text-white font-semibold truncate">{row.itemName}</span>
                            {isBottleneck && (
                              <span className="text-[8px] bg-amber-500/20 text-amber-300 px-1 rounded font-black flex-shrink-0">⚠</span>
                            )}
                          </div>
                          <span className="text-[10px] text-orange-300 font-black text-center">
                            {row.qtyPerUse} {row.unit}
                          </span>
                          <span className="text-[10px] text-slate-300 text-center">{row.available} {row.unit}</span>
                          <span className={`text-[10px] font-black text-right ${
                            row.canDo === 0 ? 'text-rose-400' : row.canDo < 5 ? 'text-amber-400' : 'text-emerald-400'
                          }`}>
                            {row.canDo}×
                          </span>
                        </div>
                      );
                    })}
                    {bottleneck && maxTimes < 10 && (
                      <p className="text-[9px] text-amber-400 font-black pt-1">
                        ⚠ Bottleneck: "{bottleneck.itemName}" — restock to increase capacity
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
