'use client';

import React from 'react';
import { Zap, Gift } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { OfferForm, OfferRule } from '../types';

interface AddRuleModalProps {
  isOpen: boolean;
  editingOfferId: string | null;
  offerForm: OfferForm;
  offersList: OfferRule[];
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onChange: (form: OfferForm) => void;
}

export default function AddRuleModal({
  isOpen,
  editingOfferId,
  offerForm,
  offersList,
  onClose,
  onSubmit,
  onChange,
}: AddRuleModalProps) {
  const set = (partial: Partial<OfferForm>) => onChange({ ...offerForm, ...partial });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingOfferId ? 'Edit Reward Rule' : 'Add New Reward Rule'}
      isDark
    >
      <form onSubmit={onSubmit} className="space-y-5 pt-2">

        {/* Level Name */}
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-1.5">Level Name</label>
          <input
            required
            type="text"
            className="w-full border border-slate-600 rounded-xl px-4 py-3 text-sm bg-slate-800 text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
            value={offerForm.title}
            onChange={e => set({ title: e.target.value })}
            placeholder="e.g. Bronze, Level 1 – Starter"
          />
        </div>

        {/* Target & Level Number */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1.5">Customers Required</label>
            <input
              required
              type="number"
              min="1"
              className="w-full border border-slate-600 rounded-xl px-4 py-3 text-sm bg-slate-800 text-white outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
              value={offerForm.targetRides}
              onChange={e => set({ targetRides: parseInt(e.target.value) || 0 })}
              placeholder="e.g. 50"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1.5">Level Number</label>
            <input
              type="number"
              min="1"
              className="w-full border border-slate-600 rounded-xl px-4 py-3 text-sm bg-slate-800 text-white outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
              value={offerForm.priority}
              onChange={e => set({ priority: parseInt(e.target.value) || 1 })}
            />
          </div>
        </div>

        {/* Reward Type */}
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-2">Reward Type</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => set({ rewardType: 'CASH' })}
              className={`flex-1 py-3 rounded-xl text-sm font-semibold border transition-all flex items-center justify-center gap-2 ${offerForm.rewardType === 'CASH' ? 'bg-emerald-900/40 border-emerald-600 text-emerald-300' : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-500'}`}
            >
              💵 Cash Reward
            </button>
            <button
              type="button"
              onClick={() => set({ rewardType: 'GIFT' })}
              className={`flex-1 py-3 rounded-xl text-sm font-semibold border transition-all flex items-center justify-center gap-2 ${offerForm.rewardType === 'GIFT' ? 'bg-amber-900/40 border-amber-600 text-amber-300' : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-500'}`}
            >
              🎁 Gift Item
            </button>
          </div>
        </div>

        {/* Reward Value */}
        <div>
          {offerForm.rewardType === 'CASH' ? (
            <>
              <label className="block text-sm font-semibold text-slate-300 mb-1.5">Cash Amount (₹)</label>
              <input
                required
                type="number"
                min="0"
                className="w-full border border-slate-600 rounded-xl px-4 py-3 text-sm bg-slate-800 text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
                value={offerForm.rewardValue}
                onChange={e => set({ rewardValue: parseFloat(e.target.value) || 0 })}
                placeholder="e.g. 500"
              />
            </>
          ) : (
            <>
              <label className="block text-sm font-semibold text-slate-300 mb-1.5">Gift Item Name</label>
              <input
                required
                type="text"
                className="w-full border border-slate-600 rounded-xl px-4 py-3 text-sm bg-slate-800 text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
                placeholder="e.g. Helmet, T-Shirt, Water Bottle"
                value={offerForm.rewardItem}
                onChange={e => set({ rewardItem: e.target.value })}
              />
            </>
          )}
        </div>

        {/* ── Auto Level-Up Section ── */}
        <div className="rounded-xl border border-indigo-700/50 bg-indigo-950/30 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap size={15} className="text-indigo-400" />
              <span className="text-sm font-bold text-indigo-300">Auto Level-Up</span>
            </div>
            <button
              type="button"
              onClick={() => set({
                resetType: offerForm.resetType === 'NEXT_OFFER' ? 'SAME_OFFER' : 'NEXT_OFFER',
                nextOfferId: offerForm.resetType === 'NEXT_OFFER' ? '' : offerForm.nextOfferId,
              })}
              className={`relative w-11 h-6 rounded-full transition-all ${offerForm.resetType === 'NEXT_OFFER' ? 'bg-indigo-600' : 'bg-slate-600'}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${offerForm.resetType === 'NEXT_OFFER' ? 'left-6' : 'left-1'}`} />
            </button>
          </div>

          {offerForm.resetType === 'NEXT_OFFER' ? (
            <>
              <p className="text-xs text-indigo-400 leading-relaxed">
                ✅ When a driver completes <strong className="text-indigo-300">{offerForm.targetRides} customers</strong>, they will <strong className="text-indigo-300">automatically move to the selected next level</strong>.
              </p>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Which level comes next?</label>
                <select
                  required
                  className="w-full border border-slate-600 rounded-xl px-4 py-3 text-sm bg-slate-800 text-white outline-none focus:ring-2 focus:ring-indigo-500/40"
                  value={offerForm.nextOfferId}
                  onChange={e => set({ nextOfferId: e.target.value })}
                >
                  <option value="" className="bg-slate-800">-- Select next level --</option>
                  {offersList
                    .filter(o => o.id !== editingOfferId)
                    .sort((a, b) => a.priority - b.priority)
                    .map(offer => (
                      <option key={offer.id} value={offer.id} className="bg-slate-800">
                        {offer.title} (Level {offer.priority})
                      </option>
                    ))}
                </select>
              </div>
            </>
          ) : (
            <p className="text-xs text-slate-500">Auto Level-Up is off. Choose what happens after the target is reached below.</p>
          )}
        </div>

        {/* After Completion (when not auto-level-up) */}
        {offerForm.resetType !== 'NEXT_OFFER' && (
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1.5">After target is reached?</label>
            <select
              className="w-full border border-slate-600 rounded-xl px-4 py-3 text-sm bg-slate-800 text-white outline-none focus:ring-2 focus:ring-indigo-500/40"
              value={offerForm.resetType}
              onChange={e => set({ resetType: e.target.value })}
            >
              <option value="SAME_OFFER" className="bg-slate-800">🔁 Repeat same level</option>
              <option value="CAMPAIGN_RESET" className="bg-slate-800">✅ Stop after giving reward</option>
            </select>
          </div>
        )}

        {/* Active toggle */}
        <div className="flex items-center justify-between px-1">
          <div>
            <p className="text-sm font-semibold text-slate-300">Rule Status</p>
            <p className="text-xs text-slate-500">Inactive rules won't be assigned to new drivers</p>
          </div>
          <button
            type="button"
            onClick={() => set({ isActive: !offerForm.isActive })}
            className={`relative w-11 h-6 rounded-full transition-all ${offerForm.isActive ? 'bg-emerald-600' : 'bg-slate-600'}`}
          >
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${offerForm.isActive ? 'left-6' : 'left-1'}`} />
          </button>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-2 border-t border-slate-700">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-11 rounded-xl border border-slate-600 text-sm font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all"
          >
            {editingOfferId ? 'Save Changes' : 'Create Rule'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
