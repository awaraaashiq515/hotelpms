'use client';

import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { OfferRule, getLevelStyle } from '../types';

interface AssignLevelModalProps {
  isOpen: boolean;
  sortedOffers: OfferRule[];
  selectedOfferId: string;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onSelect: (offerId: string) => void;
}

export default function AssignLevelModal({
  isOpen,
  sortedOffers,
  selectedOfferId,
  onClose,
  onSubmit,
  onSelect,
}: AssignLevelModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Assign / Change Driver Level"
      isDark
    >
      <form onSubmit={onSubmit} className="space-y-5 pt-2">
        <div className="bg-amber-900/20 border border-amber-800/40 rounded-xl p-4 text-sm text-amber-300 flex items-start gap-2">
          <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
          <span>Changing the level will reset this driver's current progress to zero.</span>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-2">Select Reward Level</label>
          <div className="space-y-2">
            {sortedOffers.map(offer => {
              const style = getLevelStyle(offer.priority);
              const isSelected = selectedOfferId === offer.id;
              return (
                <label
                  key={offer.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected ? 'border-indigo-600 bg-indigo-900/30' : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="offerId"
                    value={offer.id}
                    checked={isSelected}
                    onChange={() => onSelect(offer.id)}
                    className="sr-only"
                  />
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${style.bg} ${style.border} flex-shrink-0`}>
                    <span>{style.icon}</span>
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-semibold ${isSelected ? 'text-indigo-200' : 'text-slate-200'}`}>{offer.title}</p>
                    <p className="text-xs text-slate-400">
                      {offer.targetRides} customers · {offer.rewardType === 'CASH' ? `₹${offer.rewardValue}` : offer.rewardItem}
                    </p>
                  </div>
                  {isSelected && <CheckCircle2 size={16} className="text-indigo-400 flex-shrink-0" />}
                </label>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3 border-t border-slate-700 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-11 rounded-xl border border-slate-600 text-sm font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!selectedOfferId}
            className="flex-1 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm font-semibold transition-all"
          >
            Assign Level
          </button>
        </div>
      </form>
    </Modal>
  );
}
