'use client';
import React, { useState } from 'react';
import { X, Sparkles, Sliders, Calendar, Tag, ShieldAlert, CheckCircle2 } from 'lucide-react';
import type { DynamicPricingRule, RoomTypeRevenue } from '@/types/hotel/revenue.types';

interface DynamicPricingRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (ruleData: Partial<DynamicPricingRule> & { id?: string }) => Promise<boolean>;
  editingRule?: DynamicPricingRule | null;
  roomTypes: RoomTypeRevenue[];
}

export function DynamicPricingRuleModal({
  isOpen,
  onClose,
  onSave,
  editingRule,
  roomTypes,
}: DynamicPricingRuleModalProps) {
  if (!isOpen) return null;

  return (
    <DynamicPricingRuleForm
      key={editingRule?.id || 'new'}
      onClose={onClose}
      onSave={onSave}
      editingRule={editingRule}
      roomTypes={roomTypes}
    />
  );
}

interface DynamicPricingRuleFormProps {
  onClose: () => void;
  onSave: (ruleData: Partial<DynamicPricingRule> & { id?: string }) => Promise<boolean>;
  editingRule?: DynamicPricingRule | null;
  roomTypes: RoomTypeRevenue[];
}

function DynamicPricingRuleForm({
  onClose,
  onSave,
  editingRule,
  roomTypes,
}: DynamicPricingRuleFormProps) {
  const [name, setName] = useState(editingRule?.name || '');
  const [ruleType, setRuleType] = useState<DynamicPricingRule['ruleType']>(editingRule?.ruleType || 'OCCUPANCY');
  const [condition, setCondition] = useState(editingRule?.condition || 'Occ > 80%');
  const [adjustment, setAdjustment] = useState<number>(editingRule?.adjustment ?? 15);
  const [adjustmentType, setAdjustmentType] = useState<'PERCENTAGE' | 'FIXED'>(editingRule?.adjustmentType || 'PERCENTAGE');
  const [roomTypeId, setRoomTypeId] = useState<string>(editingRule?.roomTypeId || '');
  const [roomTypeName, setRoomTypeName] = useState<string>(editingRule?.roomTypeName || 'All');
  const [priority, setPriority] = useState<number>(editingRule?.priority || 1);
  const [description, setDescription] = useState<string>(editingRule?.description || '');
  const [isActive, setIsActive] = useState<boolean>(editingRule?.isActive ?? true);
  const [saving, setSaving] = useState(false);

  const handleRoomTypeChange = (id: string) => {
    setRoomTypeId(id);
    if (!id) {
      setRoomTypeName('All');
    } else {
      const found = roomTypes.find((r) => r.roomTypeId === id);
      setRoomTypeName(found ? found.name : 'All');
    }
  };

  const handleRuleTypePreset = (type: DynamicPricingRule['ruleType']) => {
    setRuleType(type);
    if (type === 'OCCUPANCY') {
      setCondition('Occ > 80%');
      if (!name) setName('High Occupancy Surge');
      setAdjustment(15);
    } else if (type === 'DAY_OF_WEEK') {
      setCondition('Fri, Sat, Sun');
      if (!name) setName('Weekend Premium');
      setAdjustment(20);
    } else if (type === 'LEAD_TIME') {
      setCondition('< 24 hrs');
      if (!name) setName('Last-Minute Saver');
      setAdjustment(-15);
    } else if (type === 'EVENT') {
      setCondition('Festivals / Holidays');
      if (!name) setName('Holiday Peak Surge');
      setAdjustment(30);
    } else if (type === 'SEASON') {
      setCondition('Peak Season (Oct - Mar)');
      if (!name) setName('High Season Multiplier');
      setAdjustment(25);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    const payload: Partial<DynamicPricingRule> & { id?: string } = {
      name: name.trim(),
      ruleType,
      condition,
      adjustment: Number(adjustment),
      adjustmentType,
      roomTypeId: roomTypeId || null,
      roomTypeName,
      priority: Number(priority),
      description: description.trim(),
      isActive,
    };

    if (editingRule?.id) {
      payload.id = editingRule.id;
    }

    const success = await onSave(payload);
    setSaving(false);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-white/10 shadow-2xl p-6 overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -top-24 -right-24 w-60 h-60 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">
                {editingRule ? 'Edit Dynamic Pricing Rule' : 'New Dynamic Pricing Rule'}
              </h2>
              <p className="text-xs text-slate-400">
                Automate real-time room rate adjustments based on demand & inventory
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 mt-5 relative z-10">
          {/* Rule Type Selector */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2 block">
              Rule Trigger Type
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
              {[
                { type: 'OCCUPANCY' as const, label: 'Occupancy' },
                { type: 'DAY_OF_WEEK' as const, label: 'Day of Week' },
                { type: 'LEAD_TIME' as const, label: 'Lead Time' },
                { type: 'EVENT' as const, label: 'Event / Fest' },
                { type: 'SEASON' as const, label: 'Seasonal' },
              ].map((t) => (
                <button
                  key={t.type}
                  type="button"
                  onClick={() => handleRuleTypePreset(t.type)}
                  className={`px-2 py-2 rounded-xl text-[10px] font-bold border transition-all text-center ${
                    ruleType === t.type
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                      : 'bg-slate-800/60 border-white/5 text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Rule Name */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1 block">
              Rule Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Weekend Premium, High Occupancy Surge"
              className="w-full h-10 px-3.5 rounded-xl bg-slate-800/70 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Condition & Room Type Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1 block">
                Trigger Condition *
              </label>
              <input
                type="text"
                required
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                placeholder="e.g. Occ > 80%, Fri-Sun, < 24h"
                className="w-full h-10 px-3.5 rounded-xl bg-slate-800/70 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1 block">
                Target Room Type
              </label>
              <select
                value={roomTypeId}
                onChange={(e) => handleRoomTypeChange(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-slate-800/70 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="">All Room Types</option>
                {roomTypes.map((rt) => (
                  <option key={rt.roomTypeId} value={rt.roomTypeId}>
                    {rt.name} (Base: ₹{rt.baseRate})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Rate Adjustment (Percentage vs Fixed Amount) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Rate Adjustment *
                </label>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setAdjustmentType('PERCENTAGE')}
                    className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                      adjustmentType === 'PERCENTAGE'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    %
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustmentType('FIXED')}
                    className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                      adjustmentType === 'FIXED'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    ₹ Fixed
                  </button>
                </div>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  required
                  value={adjustment}
                  onChange={(e) => setAdjustment(parseFloat(e.target.value) || 0)}
                  className={`w-full h-10 px-3.5 pr-10 rounded-xl bg-slate-800/70 border border-white/10 text-xs font-black focus:outline-none focus:border-indigo-500 transition-colors ${
                    adjustment > 0 ? 'text-emerald-400' : adjustment < 0 ? 'text-rose-400' : 'text-white'
                  }`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  {adjustmentType === 'PERCENTAGE' ? '%' : '₹'}
                </span>
              </div>
              <p className="text-[9px] text-slate-500 mt-1">
                {adjustment > 0 ? `Surge price +${adjustment}${adjustmentType === 'PERCENTAGE' ? '%' : '₹'}` : `Discount -${Math.abs(adjustment)}${adjustmentType === 'PERCENTAGE' ? '%' : '₹'}`}
              </p>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1 block">
                Rule Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
                className="w-full h-10 px-3 rounded-xl bg-slate-800/70 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value={1}>1 (Highest Priority)</option>
                <option value={2}>2 (Medium High)</option>
                <option value={3}>3 (Normal)</option>
                <option value={4}>4 (Low)</option>
                <option value={5}>5 (Lowest)</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1 block">
              Description / Internal Note
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Automatically bumps ADR by 20% on peak weekends"
              className="w-full h-10 px-3.5 rounded-xl bg-slate-800/70 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Active Status Toggle */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/40 border border-white/5">
            <div>
              <p className="text-xs font-bold text-white">Rule Status</p>
              <p className="text-[10px] text-slate-400">
                {isActive ? 'Active and influencing live dynamic pricing' : 'Paused / Inactive'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`w-12 h-6 rounded-full p-1 transition-colors flex items-center ${
                isActive ? 'bg-emerald-500 justify-end' : 'bg-slate-700 justify-start'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-md" />
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black tracking-wide shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingRule ? 'Update Rule' : 'Create Pricing Rule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
