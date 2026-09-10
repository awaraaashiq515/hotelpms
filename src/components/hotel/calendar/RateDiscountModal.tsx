'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Tag,
  Percent,
  Coins,
  Check,
  Building2,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Trash2
} from 'lucide-react';

interface RoomTypeItem {
  id: string;
  name: string;
  baseRate: number;
}

interface RoomItem {
  id: string;
  roomNumber: string;
  roomTypeId: string;
  roomType?: {
    id: string;
    name: string;
    baseRate: number;
  };
  customRate?: number | null;
  discount?: number | null;
}

interface RateDiscountModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomTypes: RoomTypeItem[];
  rooms: RoomItem[];
  preselectedTypeId?: string;
  preselectedRoomId?: string;
  currency?: string;
  onUpdated: () => void;
}

export function RateDiscountModal({
  isOpen,
  onClose,
  roomTypes,
  rooms,
  preselectedTypeId,
  preselectedRoomId,
  currency = '₹',
  onUpdated,
}: RateDiscountModalProps) {
  const [targetType, setTargetType] = useState<'CATEGORY' | 'ROOM'>('CATEGORY');
  const [selectedTypeId, setSelectedTypeId] = useState<string>('');
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');

  const [baseRate, setBaseRate] = useState<number>(3500);
  const [discountType, setDiscountType] = useState<'PERCENT' | 'FLAT' | 'OVERRIDE'>('PERCENT');
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [overrideRate, setOverrideRate] = useState<number>(3000);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (preselectedRoomId) {
      setTargetType('ROOM');
      setSelectedRoomId(preselectedRoomId);
      const r = rooms.find((rm) => rm.id === preselectedRoomId);
      if (r) {
        setSelectedTypeId(r.roomTypeId);
        setBaseRate(r.roomType?.baseRate || 3500);
        if (r.discount) {
          setDiscountType('PERCENT');
          setDiscountValue(r.discount);
        } else if (r.customRate) {
          setDiscountType('OVERRIDE');
          setOverrideRate(r.customRate);
        }
      }
    } else if (preselectedTypeId) {
      setTargetType('CATEGORY');
      setSelectedTypeId(preselectedTypeId);
      const t = roomTypes.find((rt) => rt.id === preselectedTypeId);
      if (t) setBaseRate(t.baseRate);
    } else if (roomTypes.length > 0) {
      setSelectedTypeId(roomTypes[0].id);
      setBaseRate(roomTypes[0].baseRate);
    }
  }, [preselectedTypeId, preselectedRoomId, roomTypes, rooms, isOpen]);

  // When room type changes, update base rate
  const handleTypeChange = (typeId: string) => {
    setSelectedTypeId(typeId);
    const t = roomTypes.find((rt) => rt.id === typeId);
    if (t) setBaseRate(t.baseRate);
  };

  // When specific room changes
  const handleRoomChange = (roomId: string) => {
    setSelectedRoomId(roomId);
    const r = rooms.find((rm) => rm.id === roomId);
    if (r) {
      setSelectedTypeId(r.roomTypeId);
      setBaseRate(r.roomType?.baseRate || 3500);
      if (r.discount) {
        setDiscountType('PERCENT');
        setDiscountValue(r.discount);
      } else if (r.customRate) {
        setDiscountType('OVERRIDE');
        setOverrideRate(r.customRate);
      }
    }
  };

  // Calculate final effective price
  let finalPrice = baseRate;
  let savings = 0;
  let discountDisplay = '';

  if (discountType === 'PERCENT') {
    const pct = Math.min(100, Math.max(0, discountValue || 0));
    savings = Math.round((baseRate * pct) / 100);
    finalPrice = Math.max(0, baseRate - savings);
    discountDisplay = `${pct}% OFF`;
  } else if (discountType === 'FLAT') {
    savings = Math.min(baseRate, Math.max(0, discountValue || 0));
    finalPrice = Math.max(0, baseRate - savings);
    discountDisplay = `${currency} ${savings} OFF`;
  } else if (discountType === 'OVERRIDE') {
    finalPrice = Math.max(0, overrideRate || 0);
    savings = Math.max(0, baseRate - finalPrice);
    const pct = baseRate > 0 ? Math.round((savings / baseRate) * 100) : 0;
    discountDisplay = pct > 0 ? `Special Rate (${pct}% OFF)` : 'Custom Rate';
  }

  // Preset percentage buttons
  const presets = [5, 10, 15, 20, 25, 30];

  const handleApplyDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMsg(null);

    try {
      if (targetType === 'CATEGORY') {
        // Update all rooms in this category with the discount/custom rate
        const matchingRooms = rooms.filter((r) => r.roomTypeId === selectedTypeId);

        // Calculate discount percentage to store
        const discPercent =
          discountType === 'PERCENT'
            ? discountValue
            : baseRate > 0
            ? Math.round((savings / baseRate) * 100)
            : 0;

        await Promise.all(
          matchingRooms.map((rm) =>
            fetch('/api/hotel/rooms', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: rm.id,
                customRate: finalPrice,
                discount: discPercent,
              }),
            })
          )
        );

        setSuccessMsg(`✓ Discount of ${discountDisplay} applied to all ${matchingRooms.length} rooms in category!`);
      } else {
        // Update single room
        const discPercent =
          discountType === 'PERCENT'
            ? discountValue
            : baseRate > 0
            ? Math.round((savings / baseRate) * 100)
            : 0;

        await fetch('/api/hotel/rooms', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: selectedRoomId,
            customRate: finalPrice,
            discount: discPercent,
          }),
        });

        const r = rooms.find((rm) => rm.id === selectedRoomId);
        setSuccessMsg(`✓ Discount applied to Room ${r?.roomNumber || ''}! Effective rate: ${currency} ${finalPrice.toLocaleString('en-IN')}`);
      }

      onUpdated();
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1200);
    } catch (err) {
      console.error(err);
      alert('Error updating rate and discount.');
    } finally {
      setSubmitting(false);
    }
  };

  // Remove discount (reset to original base rate)
  const handleClearDiscount = async () => {
    setSubmitting(true);
    try {
      if (targetType === 'CATEGORY') {
        const matchingRooms = rooms.filter((r) => r.roomTypeId === selectedTypeId);
        await Promise.all(
          matchingRooms.map((rm) =>
            fetch('/api/hotel/rooms', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: rm.id,
                customRate: null,
                discount: null,
              }),
            })
          )
        );
        setSuccessMsg('✓ Discounts cleared. Reverted to standard base rate.');
      } else {
        await fetch('/api/hotel/rooms', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: selectedRoomId,
            customRate: null,
            discount: null,
          }),
        });
        setSuccessMsg('✓ Room discount cleared. Reverted to category rate.');
      }

      onUpdated();
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1000);
    } catch (err) {
      console.error(err);
      alert('Error clearing discount.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
      <div className="bg-[#0f172a] rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-800 text-white relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2.5 mb-1.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Tag className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Room Rate & Discount Manager
            </h3>
            <p className="text-xs text-slate-400">
              Apply promotional discounts and set daily rates directly on the tape chart.
            </p>
          </div>
        </div>

        {successMsg && (
          <div className="mt-3 p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleApplyDiscount} className="space-y-4 mt-4">
          {/* Target Scope Switch: Entire Category vs Specific Room */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
              Apply Discount To:
            </label>
            <div className="grid grid-cols-2 gap-2 bg-[#1e293b]/60 p-1 rounded-xl border border-slate-700/70">
              <button
                type="button"
                onClick={() => setTargetType('CATEGORY')}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  targetType === 'CATEGORY'
                    ? 'bg-[#00b894] text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All Rooms in Category
              </button>
              <button
                type="button"
                onClick={() => setTargetType('ROOM')}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  targetType === 'ROOM'
                    ? 'bg-[#00b894] text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Specific Room Unit
              </button>
            </div>
          </div>

          {/* Select Category or Room */}
          {targetType === 'CATEGORY' ? (
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Room Category:
              </label>
              <select
                value={selectedTypeId}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="w-full bg-[#1e293b]/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#00b894]"
              >
                {roomTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} (Base Rate: {currency} {t.baseRate.toLocaleString('en-IN')})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Select Room Unit:
              </label>
              <select
                value={selectedRoomId}
                onChange={(e) => handleRoomChange(e.target.value)}
                className="w-full bg-[#1e293b]/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#00b894]"
              >
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    Room {r.roomNumber} ({r.roomType?.name || 'Standard'}) — Current: {currency} {(r.customRate || r.roomType?.baseRate || 3500).toLocaleString('en-IN')} {r.discount ? `(${r.discount}% OFF)` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Discount Type Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
              Discount Mode:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDiscountType('PERCENT')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  discountType === 'PERCENT'
                    ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400'
                    : 'border-slate-700/80 bg-[#1e293b]/40 text-slate-400 hover:text-white'
                }`}
              >
                <Percent className="w-3.5 h-3.5" />
                <span>Percentage (%)</span>
              </button>

              <button
                type="button"
                onClick={() => setDiscountType('FLAT')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  discountType === 'FLAT'
                    ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400'
                    : 'border-slate-700/80 bg-[#1e293b]/40 text-slate-400 hover:text-white'
                }`}
              >
                <Coins className="w-3.5 h-3.5" />
                <span>Flat Amount</span>
              </button>

              <button
                type="button"
                onClick={() => setDiscountType('OVERRIDE')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  discountType === 'OVERRIDE'
                    ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400'
                    : 'border-slate-700/80 bg-[#1e293b]/40 text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Special Rate</span>
              </button>
            </div>
          </div>

          {/* Input based on discount type */}
          {discountType === 'PERCENT' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-slate-300">
                  Discount Percentage:
                </label>
                <span className="text-xs font-extrabold text-emerald-400">{discountValue}%</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(Number(e.target.value))}
                  className="w-24 bg-[#1e293b]/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#00b894]"
                />
                {/* Quick preset buttons */}
                <div className="flex items-center gap-1 flex-wrap">
                  {presets.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setDiscountValue(p)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                        discountValue === p
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      {p}%
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {discountType === 'FLAT' && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Discount Amount ({currency}):
              </label>
              <input
                type="number"
                min="0"
                value={discountValue}
                onChange={(e) => setDiscountValue(Number(e.target.value))}
                placeholder="e.g. 500"
                className="w-full bg-[#1e293b]/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#00b894]"
              />
            </div>
          )}

          {discountType === 'OVERRIDE' && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                New Special Rate Per Night ({currency}):
              </label>
              <input
                type="number"
                min="0"
                value={overrideRate}
                onChange={(e) => setOverrideRate(Number(e.target.value))}
                placeholder="e.g. 2999"
                className="w-full bg-[#1e293b]/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#00b894]"
              />
            </div>
          )}

          {/* Live Price Calculation Summary Card */}
          <div className="bg-[#1e293b]/80 border border-emerald-500/30 rounded-xl p-3.5 flex items-center justify-between shadow-inner">
            <div>
              <span className="text-[11px] text-slate-400 block">Standard Rate</span>
              <span className="line-through text-slate-400 text-xs font-semibold">
                {currency} {baseRate.toLocaleString('en-IN')}
              </span>
              {savings > 0 && (
                <span className="text-[10px] text-emerald-400 block font-medium mt-0.5">
                  Save {currency} {savings.toLocaleString('en-IN')} ({discountDisplay})
                </span>
              )}
            </div>

            <ArrowRight className="w-4 h-4 text-slate-500" />

            <div className="text-right">
              <span className="text-[11px] text-slate-400 block">Final Rate</span>
              <span className="text-xl font-extrabold text-emerald-400 tracking-tight leading-none">
                {currency} {finalPrice.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">per night</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-2.5 pt-2">
            <button
              type="button"
              onClick={handleClearDiscount}
              disabled={submitting}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset Rate</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#00b894] hover:bg-[#00a884] active:scale-[0.98] transition-all shadow-md shadow-[#00b894]/20 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Apply Discount</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
