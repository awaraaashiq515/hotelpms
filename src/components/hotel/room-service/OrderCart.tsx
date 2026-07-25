'use client';

import React from 'react';
import { ShoppingCart, Trash2, Receipt } from 'lucide-react';
import { CartLineItem, OrderType, RoomInfo, formatCurrency } from './types';
import { CartItem } from './CartItem';
import { OrderTypeSelector } from './OrderTypeSelector';

interface OrderCartProps {
  items: CartLineItem[];
  totals: { subtotal: number; taxAmount: number; total: number };
  taxRate: number;
  orderType: OrderType;
  setOrderType: (t: OrderType) => void;
  postToRoom: boolean;
  setPostToRoom: (v: boolean) => void;
  roomInfo: RoomInfo | null;
  onAdd: (item: CartLineItem['menuItem']) => void;
  onDecrement: (id: string) => void;
  onRemove: (id: string) => void;
  onNoteChange: (id: string, note: string) => void;
  onClear: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
}

export function OrderCart({
  items, totals, taxRate,
  orderType, setOrderType,
  postToRoom, setPostToRoom,
  roomInfo,
  onAdd, onDecrement, onRemove, onNoteChange, onClear,
  onConfirm, isSubmitting,
}: OrderCartProps) {
  const isEmpty = items.length === 0;
  const canConfirm = !isEmpty && (orderType === 'TAKEAWAY' || !postToRoom || !!roomInfo);

  return (
    <div className="flex flex-col h-full min-h-0 gap-3">

      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center">
            <ShoppingCart size={13} className="text-emerald-400" />
          </div>
          <p className="text-xs font-black text-white uppercase tracking-wider">
            Cart {items.length > 0 && <span className="text-emerald-400">({items.reduce((s, i) => s + i.qty, 0)})</span>}
          </p>
        </div>
        {!isEmpty && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 text-[9px] font-bold text-slate-700 hover:text-red-400 transition-colors"
          >
            <Trash2 size={10} /> Clear
          </button>
        )}
      </div>

      {/* Cart Items — scrollable */}
      <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 min-h-0">
        {isEmpty ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center">
              <ShoppingCart size={22} className="text-slate-700" />
            </div>
            <p className="text-xs text-slate-700 font-bold text-center">
              Menu se items add karo
            </p>
          </div>
        ) : (
          items.map(item => (
            <CartItem
              key={item.menuItem.id}
              item={item}
              onAdd={() => onAdd(item.menuItem)}
              onDecrement={() => onDecrement(item.menuItem.id)}
              onRemove={() => onRemove(item.menuItem.id)}
              onNoteChange={note => onNoteChange(item.menuItem.id, note)}
            />
          ))
        )}
      </div>

      {/* Bottom section — fixed */}
      <div className="shrink-0 space-y-3 border-t border-white/[0.05] pt-3">

        {/* Order Type Selector */}
        <OrderTypeSelector
          selected={orderType}
          onChange={setOrderType}
          postToRoom={postToRoom}
          setPostToRoom={setPostToRoom}
          roomFound={!!roomInfo}
        />

        {/* Totals */}
        {!isEmpty && (
          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/8 space-y-1.5">
            <div className="flex justify-between text-xs text-slate-500 font-bold">
              <span>Subtotal</span>
              <span>{formatCurrency(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-600 font-bold">
              <span>GST ({taxRate}%)</span>
              <span>{formatCurrency(totals.taxAmount)}</span>
            </div>
            <div className="flex justify-between pt-1.5 border-t border-white/8">
              <span className="text-sm font-black text-white">Total</span>
              <span className="text-sm font-black text-amber-400">{formatCurrency(totals.total)}</span>
            </div>
          </div>
        )}

        {/* Room posting info */}
        {postToRoom && roomInfo && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
            <span className="text-base">🏨</span>
            <div>
              <p className="text-[10px] font-black text-emerald-400">Post to Room {roomInfo.roomNumber}</p>
              <p className="text-[9px] text-slate-700">{roomInfo.guestName}'s folio</p>
            </div>
          </div>
        )}

        {/* Missing room warning */}
        {postToRoom && !roomInfo && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/15">
            <span className="text-base">⚠️</span>
            <p className="text-[10px] font-bold text-amber-400">Room number dhundna zaroori hai folio pe post karne ke liye</p>
          </div>
        )}

        {/* Confirm Button */}
        <button
          onClick={onConfirm}
          disabled={!canConfirm || isSubmitting}
          className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-sm text-white transition-all shadow-lg disabled:opacity-40 disabled:cursor-not-allowed ${
            postToRoom && roomInfo
              ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/40'
              : 'bg-amber-600 hover:bg-amber-500 shadow-amber-900/40'
          }`}
        >
          {isSubmitting ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Receipt size={15} />
          )}
          {isSubmitting
            ? 'Placing Order…'
            : postToRoom && roomInfo
              ? `Post to Room ${roomInfo.roomNumber}`
              : 'Confirm Order'
          }
        </button>
      </div>
    </div>
  );
}
