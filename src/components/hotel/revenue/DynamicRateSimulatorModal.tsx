'use client';
import React, { useState } from 'react';
import { X, Calculator, Zap, ArrowRight, CheckCircle, Sparkles, TrendingUp } from 'lucide-react';
import type { RoomTypeRevenue, DynamicRateSimulationResult } from '@/types/hotel/revenue.types';

interface DynamicRateSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomTypes: RoomTypeRevenue[];
  onSimulate: (params: {
    roomTypeId?: string;
    date?: string;
    customBaseRate?: number;
  }) => Promise<DynamicRateSimulationResult | null>;
}

export function DynamicRateSimulatorModal({
  isOpen,
  onClose,
  roomTypes,
  onSimulate,
}: DynamicRateSimulatorModalProps) {
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<string>(
    roomTypes[0]?.roomTypeId || ''
  );
  const [targetDate, setTargetDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [customBaseRate, setCustomBaseRate] = useState<string>('');
  const [calculating, setCalculating] = useState<boolean>(false);
  const [result, setResult] = useState<DynamicRateSimulationResult | null>(null);

  if (!isOpen) return null;

  const handleSimulate = async () => {
    setCalculating(true);
    const sim = await onSimulate({
      roomTypeId: selectedRoomTypeId,
      date: targetDate,
      customBaseRate: customBaseRate ? parseFloat(customBaseRate) : undefined,
    });
    setResult(sim);
    setCalculating(false);
  };

  const selectedRoomType = roomTypes.find((r) => r.roomTypeId === selectedRoomTypeId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-3xl bg-slate-900 border border-white/10 shadow-2xl p-6 overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Calculator size={18} />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Dynamic Rate Calculator</h2>
              <p className="text-xs text-slate-400">
                Simulate PMS price calculations with active rules & occupancy triggers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4 mt-5">
          {/* Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1 block">
                Select Room Type
              </label>
              <select
                value={selectedRoomTypeId}
                onChange={(e) => {
                  setSelectedRoomTypeId(e.target.value);
                  setResult(null);
                }}
                className="w-full h-10 px-3 rounded-xl bg-slate-800/70 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500 transition-colors"
              >
                {roomTypes.map((rt) => (
                  <option key={rt.roomTypeId} value={rt.roomTypeId}>
                    {rt.name} (Base: ₹{rt.baseRate})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1 block">
                Target Check-in Date
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => {
                  setTargetDate(e.target.value);
                  setResult(null);
                }}
                className="w-full h-10 px-3.5 rounded-xl bg-slate-800/70 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1 block">
              Custom Base Rate (Optional override, leave blank for standard ₹{selectedRoomType?.baseRate || 3500})
            </label>
            <input
              type="number"
              value={customBaseRate}
              onChange={(e) => {
                setCustomBaseRate(e.target.value);
                setResult(null);
              }}
              placeholder={`Default: ₹${selectedRoomType?.baseRate || 3500}`}
              className="w-full h-10 px-3.5 rounded-xl bg-slate-800/70 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <button
            onClick={handleSimulate}
            disabled={calculating}
            className="w-full h-11 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            <Zap size={14} />
            {calculating ? 'Evaluating Pricing Engine...' : 'Calculate Dynamic Rate'}
          </button>

          {/* Results Display */}
          {result && (
            <div className="p-4 rounded-2xl bg-slate-800/50 border border-emerald-500/20 space-y-3 animate-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Calculated Optimal Rate
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-2xl font-black text-white">
                      ₹{result.finalRate.toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs text-slate-500 line-through">
                      ₹{result.baseRate.toLocaleString('en-IN')}
                    </span>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        result.adjustmentPct > 0
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : result.adjustmentPct < 0
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {result.adjustmentPct > 0 ? `+${result.adjustmentPct}%` : `${result.adjustmentPct}%`}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                    Demand Status
                  </span>
                  <span
                    className={`inline-block text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-xl mt-1 ${
                      result.demandLevel === 'PEAK'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : result.demandLevel === 'HIGH'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {result.demandLevel} Demand ({result.occupancyAtDate}% Occ)
                  </span>
                </div>
              </div>

              {/* Rules Applied */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                  Rules Triggered for {result.targetDate}
                </p>
                {result.appliedRules.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">
                    No active rules triggered for this date. Base rate applies.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {result.appliedRules.map((r, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-white/5 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle size={13} className="text-emerald-400" />
                          <span className="font-bold text-white">{r.ruleName}</span>
                          <span className="text-[10px] text-slate-400">({r.reason})</span>
                        </div>
                        <span
                          className={`font-black text-xs ${
                            r.adjustment.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {r.adjustment}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
