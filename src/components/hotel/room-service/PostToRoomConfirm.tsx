'use client';

import React from 'react';
import { CheckCircle2, X, Receipt, Bed, User, Utensils } from 'lucide-react';
import { CartLineItem, RoomInfo, OrderType, ORDER_TYPE_CONFIG, formatCurrency } from './types';

interface PostToRoomConfirmProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
  // order details
  items: CartLineItem[];
  totals: { subtotal: number; taxAmount: number; total: number };
  roomInfo: RoomInfo | null;
  orderType: OrderType;
  postToRoom: boolean;
  specialNote: string;
}

export function PostToRoomConfirm({
  isOpen, onClose, onConfirm, isSubmitting,
  items, totals, roomInfo, orderType, postToRoom, specialNote,
}: PostToRoomConfirmProps) {
  if (!isOpen) return null;

  const typeCfg = ORDER_TYPE_CONFIG[orderType];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-[#0c0f1d] border border-white/10 rounded-3xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/8">
          <div>
            <p className="text-base font-black text-white">Order Confirm Karo</p>
            <p className="text-[10px] text-slate-500 font-bold mt-0.5">
              {postToRoom && roomInfo
                ? `Charges posted to Room ${roomInfo.roomNumber}`
                : 'Order will be placed'
              }
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all"
          >
            <X size={14} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">

          {/* Order Type + Room Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className={`p-3 rounded-2xl border ${typeCfg.bg} text-center`}>
              <p className="text-2xl mb-1">{typeCfg.emoji}</p>
              <p className={`text-[10px] font-black ${typeCfg.color}`}>{typeCfg.label}</p>
            </div>
            {postToRoom && roomInfo ? (
              <div className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-center">
                <p className="text-2xl mb-1">🏨</p>
                <p className="text-[10px] font-black text-emerald-400">Room {roomInfo.roomNumber}</p>
                <p className="text-[9px] text-slate-600">{roomInfo.guestName}</p>
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-slate-800/40 border border-slate-700/30 text-center">
                <p className="text-2xl mb-1">💳</p>
                <p className="text-[10px] font-black text-slate-400">Pay Separately</p>
              </div>
            )}
          </div>

          {/* Items List */}
          <div>
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">
              Order Items ({items.length})
            </p>
            <div className="space-y-1.5">
              {items.map(item => (
                <div key={item.menuItem.id} className="flex items-center justify-between py-1.5 border-b border-white/[0.04] last:border-0">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-sm border ${item.menuItem.isVeg ? 'border-emerald-500' : 'border-red-500'}`}>
                      <div className={`w-full h-full scale-50 rounded-full ${item.menuItem.isVeg ? 'bg-emerald-400' : 'bg-red-400'}`} />
                    </div>
                    <span className="text-xs font-bold text-white">{item.menuItem.name}</span>
                    <span className="text-[9px] text-slate-600 font-bold">×{item.qty}</span>
                  </div>
                  <span className="text-xs font-black text-amber-400">{formatCurrency(item.lineTotal)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/8 space-y-1.5">
            <div className="flex justify-between text-xs text-slate-500 font-bold">
              <span>Subtotal</span><span>{formatCurrency(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-600 font-bold">
              <span>GST</span><span>{formatCurrency(totals.taxAmount)}</span>
            </div>
            <div className="flex justify-between pt-1.5 border-t border-white/8">
              <span className="text-sm font-black text-white">Total</span>
              <span className="text-sm font-black text-amber-400">{formatCurrency(totals.total)}</span>
            </div>
          </div>

          {/* Special Note */}
          {specialNote && (
            <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
              <p className="text-[9px] text-amber-500 font-black uppercase tracking-widest mb-1">Special Note</p>
              <p className="text-xs text-white font-bold">{specialNote}</p>
            </div>
          )}

          {/* Folio posting notice */}
          {postToRoom && roomInfo && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/15">
              <Receipt size={14} className="text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-black text-indigo-400">Folio mein post hoga</p>
                <p className="text-[9px] text-slate-600">
                  {formatCurrency(totals.total)} Room {roomInfo.roomNumber} ke folio mein automatically add ho jayega.
                  Guest checkout pe yeh charge milega.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 py-3 rounded-2xl border border-white/10 text-slate-400 text-sm font-bold hover:bg-white/5 transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isSubmitting}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-white text-sm font-black transition-all shadow-xl disabled:opacity-60 ${
              postToRoom && roomInfo
                ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/40'
                : 'bg-amber-600 hover:bg-amber-500 shadow-amber-900/40'
            }`}
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <CheckCircle2 size={15} />
            )}
            {isSubmitting
              ? 'Placing…'
              : postToRoom && roomInfo
                ? `Post ₹${totals.total.toFixed(0)} to Room`
                : 'Place Order'
            }
          </button>
        </div>
      </div>
    </div>
  );
}
