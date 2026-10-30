'use client';

import React from 'react';
import { Package, X, Send } from 'lucide-react';
import { StockItem } from './types';

interface StockRequestModalProps {
  isOpen: boolean;
  selectedStockItem: StockItem | null;
  customItemName: string;
  requestQty: number;
  requestUnit: string;
  requestUrgency: 'NORMAL' | 'URGENT' | 'CRITICAL';
  requestRemarks: string;
  submittingRequest: boolean;
  onClose: () => void;
  onSetCustomItemName: (name: string) => void;
  onSetRequestQty: (qty: number) => void;
  onSetRequestUnit: (unit: string) => void;
  onSetRequestUrgency: (urgency: 'NORMAL' | 'URGENT' | 'CRITICAL') => void;
  onSetRequestRemarks: (remarks: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const StockRequestModal: React.FC<StockRequestModalProps> = ({
  isOpen,
  selectedStockItem,
  customItemName,
  requestQty,
  requestUnit,
  requestUrgency,
  requestRemarks,
  submittingRequest,
  onClose,
  onSetCustomItemName,
  onSetRequestQty,
  onSetRequestUnit,
  onSetRequestUrgency,
  onSetRequestRemarks,
  onSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0e1629] border border-slate-700/80 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl animate-in fade-in-50 zoom-in-95">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center">
              <Package size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Stock Refill Requisition</h3>
              <p className="text-[10px] text-slate-400">Reports out-of-stock &amp; alerts Hotel Central Store</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3.5">
          {/* Item Name */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Item / Ingredient Name
            </label>
            {selectedStockItem ? (
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-750 text-xs font-bold text-white flex items-center justify-between">
                <span>{selectedStockItem.name}</span>
                <span className="text-[10px] text-indigo-300 font-mono">
                  Balance: {selectedStockItem.currentStock} {selectedStockItem.unit}
                </span>
              </div>
            ) : (
              <input
                type="text"
                required
                placeholder="e.g. Tomatoes, Basmati Rice, Cooking Oil..."
                value={customItemName}
                onChange={(e) => onSetCustomItemName(e.target.value)}
                className="w-full h-10 px-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            )}
          </div>

          {/* Quantity and Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Quantity Needed
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                required
                value={requestQty}
                onChange={(e) => onSetRequestQty(parseFloat(e.target.value) || 1)}
                className="w-full h-10 px-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Unit
              </label>
              <select
                value={requestUnit}
                onChange={(e) => onSetRequestUnit(e.target.value)}
                className="w-full h-10 px-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="kg">kg (Kilograms)</option>
                <option value="ltr">ltr (Liters)</option>
                <option value="pcs">pcs (Pieces)</option>
                <option value="packet">packet (Packets)</option>
                <option value="box">box (Boxes)</option>
                <option value="gm">gm (Grams)</option>
              </select>
            </div>
          </div>

          {/* Urgency */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Urgency Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['NORMAL', 'URGENT', 'CRITICAL'] as const).map((urg) => (
                <button
                  type="button"
                  key={urg}
                  onClick={() => onSetRequestUrgency(urg)}
                  className={`py-2 rounded-xl text-xs font-bold border transition ${requestUrgency === urg
                      ? urg === 'CRITICAL'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500'
                        : urg === 'URGENT'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500'
                          : 'bg-indigo-600/30 text-indigo-300 border-indigo-500'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                >
                  {urg}
                </button>
              ))}
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Notes / Reason
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Needed for evening dinner shift, running very low..."
              value={requestRemarks}
              onChange={(e) => onSetRequestRemarks(e.target.value)}
              className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Submit Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingRequest}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/25 transition disabled:opacity-50"
            >
              <Send size={13} />
              <span>{submittingRequest ? 'Sending Alert...' : 'Submit Request'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

