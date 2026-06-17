'use client';

import React from 'react';
import {
  ShoppingCart,
  Utensils,
  Minus,
  Plus,
  CheckCircle,
  AlertCircle,
  Clock,
  Printer,
  CheckCircle2,
  Save,
  Pause,
  ReceiptIndianRupee
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface TabletOrderTrayProps {
  tablet: any;
  tables: any[];
  selectedTableId: string;
  waiter: any;
  pax: number;
  setPax: (val: number) => void;
  activeOrder: any;
  setIsStatusVisible: (val: boolean) => void;
  cart: any[];
  setCart: React.Dispatch<React.SetStateAction<any[]>>;
  updateQuantity: (itemId: string, delta: number) => void;
  removeFromCart: (itemId: string) => void;
  addToCart: (product: any, size?: string, customPrice?: number) => void;
  isOrderComplimentary: boolean;
  setIsOrderComplimentary: (val: boolean) => void;
  isOrderPaid: boolean;
  setIsOrderPaid: (val: boolean) => void;
  cartTax: number;
  cartTotal: number;
  setDiscountAmount: (val: number) => void;
  handlePlaceOrder: (action: 'SAVE' | 'HOLD' | 'SAVE_AND_KOT' | 'PRINT_KOT') => Promise<void>;
  isPlacingOrder: boolean;
  setIsProforma: (val: boolean) => void;
  handlePrintBill: () => void;
  settleLoading: boolean;
}

export function TabletOrderTray({
  tablet,
  tables,
  selectedTableId,
  waiter,
  pax,
  setPax,
  activeOrder,
  setIsStatusVisible,
  cart,
  setCart,
  updateQuantity,
  removeFromCart,
  addToCart,
  isOrderComplimentary,
  setIsOrderComplimentary,
  isOrderPaid,
  setIsOrderPaid,
  cartTax,
  cartTotal,
  setDiscountAmount,
  handlePlaceOrder,
  isPlacingOrder,
  setIsProforma,
  handlePrintBill,
  settleLoading,
}: TabletOrderTrayProps) {
  const activeTableName = tables.find(t => t.id === selectedTableId)?.name || 'STATION';

  return (
    <aside className="w-[420px] shrink-0 border-l border-white/[0.08] bg-slate-950/40 backdrop-blur-xl flex flex-col overflow-hidden relative">
      {/* Subtle inner shadow top */}
      <div className="absolute top-0 inset-x-0 h-4 bg-gradient-to-b from-[#090D1A]/50 to-transparent pointer-events-none z-10" />

      {/* Tray Header */}
      <div className="p-6 border-b border-white/[0.06] space-y-4 relative z-10">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tighter mb-0.5">
              Order <span className="text-indigo-400">Details</span>
            </h2>
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
              {tablet?.mode === 'WAITER' ? 'WAITER SERVICE' : 'COUNTER SERVICE'} • {activeTableName} {waiter ? `(${waiter.name})` : ''}
            </p>
          </div>
          <div className="flex items-center bg-white/[0.03] rounded-2xl p-1.5 border border-white/[0.06] shadow-inner">
            <button
              onClick={() => setPax(Math.max(1, pax - 1))}
              className="w-8 h-8 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center hover:bg-white/10 hover:text-white hover:scale-105 active:scale-95 transition-all text-slate-400"
            >
              <Minus size={14} />
            </button>
            <div className="px-3.5 flex flex-col items-center">
              <span className="text-xs font-black leading-none text-white">{pax}</span>
              <span className="text-[6px] font-black text-slate-550 uppercase mt-0.5">Pax</span>
            </div>
            <button
              onClick={() => setPax(pax + 1)}
              className="w-8 h-8 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center hover:bg-indigo-500 hover:border-indigo-500/20 hover:text-white hover:scale-105 active:scale-95 transition-all text-slate-450"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        {/* Late Warning Banner */}
        {activeOrder && (() => {
          const elapsedMins = Math.floor((Date.now() - new Date(activeOrder.createdAt).getTime()) / 60000);
          const limit = activeOrder.preparationTime || 15;
          const isLate = (activeOrder.status === 'KOT_RUNNING' || activeOrder.status === 'IN_KITCHEN') && elapsedMins >= limit;

          const readyPickupLimit = typeof window !== 'undefined' ? parseInt(localStorage.getItem('kds_ready_pickup_time') || '5', 10) : 5;
          const readyWaitMin = activeOrder.updatedAt ? Math.floor((Date.now() - new Date(activeOrder.updatedAt).getTime()) / 60000) : 0;
          const isPickupLate = activeOrder.status === 'READY' && readyPickupLimit > 0 && readyWaitMin >= readyPickupLimit;

          if (isLate) {
            return (
              <div className="w-full py-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center justify-center gap-2 text-rose-400 animate-pulse mt-4 shadow-[0_0_15px_rgba(244,63,94,0.1)]">
                <AlertCircle size={16} />
                <span className="text-[10px] font-black uppercase tracking-wider">Late In Kitchen</span>
              </div>
            );
          }
          if (isPickupLate) {
            return (
              <div className="w-full py-2.5 bg-blue-500/10 border border-blue-500/30 rounded-xl flex items-center justify-center gap-2 text-blue-400 animate-pulse mt-4 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                <Clock size={16} />
                <span className="text-[10px] font-black uppercase tracking-wider">Late For Ready To Serve</span>
              </div>
            );
          }
          return null;
        })()}
      </div>

      {/* Tray Items List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 no-scrollbar relative z-10">
        {cart.length === 0 && (!activeOrder || !activeOrder.items || activeOrder.items.length === 0) ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-20 py-20">
            <ShoppingCart size={48} strokeWidth={1} className="mb-4 text-slate-400" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-450">Tray is Empty</p>
          </div>
        ) : (
          <>
            {cart.map(item => (
              <div
                key={item.cartItemId || item.id}
                className="bg-white/[0.02] rounded-2xl p-3 flex flex-col gap-2 animate-in slide-in-from-right-2 duration-300 border border-white/[0.06] hover:bg-white/[0.04] transition-all"
              >
                <div className="flex gap-3 items-center">
                  <div className="w-9 h-9 bg-slate-950/60 rounded-xl flex items-center justify-center shrink-0 border border-white/[0.06] shadow-inner overflow-hidden">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <Utensils size={14} className="text-slate-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[10px] font-black uppercase tracking-tight text-white/95 truncate leading-tight mb-0.5">
                      {item.name}
                    </h4>
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-black text-indigo-400">₹{item.sellingPrice * item.quantity}</span>
                        <span className="text-[7.5px] font-bold text-slate-500 uppercase">/ ₹{item.sellingPrice}</span>
                      </div>
                      <div className="flex items-center gap-1 bg-black/35 p-0.5 rounded-lg border border-white/[0.06] shadow-inner">
                        <button
                          onClick={() => updateQuantity(item.cartItemId || item.id, -1)}
                          className="w-5.5 h-5.5 rounded-md flex items-center justify-center hover:bg-rose-500/10 hover:text-rose-450 transition-all text-slate-450 hover:scale-105 active:scale-95"
                        >
                          <Minus size={10} />
                        </button>
                        <span className="text-[10px] font-black w-3.5 text-center text-white">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.cartItemId || item.id, 1)}
                          className="w-5.5 h-5.5 rounded-md flex items-center justify-center hover:bg-indigo-500/10 hover:text-indigo-400 transition-all text-slate-450 hover:scale-105 active:scale-95"
                        >
                          <Plus size={10} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Variant Switch in Tray */}
                {((item.variants && item.variants.length > 0) || item.halfPrice) && (
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/[0.06]">
                    {item.variants?.map((v: any) => (
                      <button
                        key={v.id}
                        onClick={() => {
                          removeFromCart(item.cartItemId);
                          addToCart(item, v.name, v.price);
                        }}
                        className={`py-1.5 rounded-lg font-black text-[7px] uppercase tracking-widest transition-all border ${
                          item.size === v.name
                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20'
                            : 'bg-white/[0.03] border-white/10 text-slate-500 hover:bg-white/10'
                        }`}
                      >
                        {v.name}
                      </button>
                    ))}
                    {item.halfPrice && (
                      <button
                        onClick={() => {
                          removeFromCart(item.cartItemId);
                          addToCart(item, 'Half', item.halfPrice!);
                        }}
                        className={`py-1.5 rounded-lg font-black text-[7px] uppercase tracking-widest transition-all border ${
                          item.size === 'Half'
                            ? 'bg-amber-600 border-amber-500 text-white shadow-lg shadow-amber-600/20'
                            : 'bg-white/[0.03] border-white/10 text-slate-500 hover:bg-white/10'
                        }`}
                      >
                        Half
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </div>

      {/* Active Order Items (Already Sent) */}
      {activeOrder && activeOrder.items && activeOrder.items.length > 0 && (
        <div className="px-4 pb-4 space-y-3 max-h-[300px] overflow-y-auto no-scrollbar border-t border-white/[0.06] pt-4 relative z-10">
          <div className="flex items-center gap-2 mb-2 opacity-55">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-[7.5px] font-black uppercase tracking-[0.2em] text-slate-400">Already Ordered</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>
          {activeOrder.items.map((item: any) => (
            <div
              key={item.id}
              className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-3 flex items-center gap-4 opacity-75 hover:bg-white/[0.04] transition-all"
            >
              <div className="w-9 h-9 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center shrink-0">
                <CheckCircle size={16} className="text-emerald-400 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[10px] font-black uppercase tracking-tight text-white/95 truncate leading-tight mb-0.5">
                  {item.product?.name || 'Item'}
                </h4>
                <p className="text-[8px] font-bold text-slate-500">
                  {item.quantity} x ₹{item.unitPrice}
                </p>
              </div>
              <div className="text-right flex flex-col items-end">
                <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-550/20 px-2 py-0.5 rounded-lg text-[7.5px] font-black">
                  SENT
                </span>
                <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest mt-1">KITCHEN</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Totals & Actions */}
      <div className="p-4 bg-slate-900/60 backdrop-blur-xl border-t border-white/[0.08] shadow-[0_-10px_40px_rgba(0,0,0,0.4)] relative z-10">
        {/* Global Order Toggles */}
        <div className="flex items-center gap-4 px-1 pb-3">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={isOrderComplimentary}
              onChange={(e) => setIsOrderComplimentary(e.target.checked)}
              className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-indigo-500 cursor-pointer transition-colors"
            />
            <span
              className={`text-[9.5px] font-black uppercase tracking-wider transition-colors ${
                isOrderComplimentary ? 'text-indigo-400 font-extrabold' : 'text-slate-550 group-hover:text-slate-350'
              }`}
            >
              Complimentary
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={isOrderPaid}
              onChange={(e) => setIsOrderPaid(e.target.checked)}
              className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500 cursor-pointer transition-colors"
            />
            <span
              className={`text-[9.5px] font-black uppercase tracking-wider transition-colors ${
                isOrderPaid ? 'text-emerald-400 font-extrabold' : 'text-slate-550 group-hover:text-slate-350'
              }`}
            >
              It's Paid
            </span>
          </label>
        </div>

        <div className="space-y-1 mb-4">
          <div className="flex justify-between items-end">
            <div>
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1 block px-1">
                Total Payable (Incl. Taxes: ₹{cartTax.toFixed(2)})
              </span>
              <p className="text-3xl font-black text-indigo-400 tracking-tighter leading-none px-1 drop-shadow-[0_0_15px_rgba(99,102,241,0.25)]">
                ₹{cartTotal.toFixed(2)}
              </p>
            </div>
            <div className="flex flex-col items-end">
              {cart.length > 0 && (
                <button
                  onClick={() => {
                    setCart([]);
                    setDiscountAmount(0);
                  }}
                  className="text-[7.5px] font-black text-rose-500 uppercase tracking-widest hover:underline mb-1 hover:brightness-110 active:scale-95 duration-200"
                >
                  Clear Tray
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Place Order / Actions Grid */}
        <div className="flex flex-col gap-2">
          {/* Top Row: Exactly 2 Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => handlePlaceOrder('PRINT_KOT')}
              loading={isPlacingOrder}
              disabled={cart.length === 0 && !activeOrder}
              className="py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5 border bg-emerald-600 hover:bg-emerald-500 border-emerald-500/30 text-white shadow-[0_4px_16px_rgba(16,185,129,0.2)] hover:scale-[1.02] duration-200"
            >
              <Printer size={13} /> PRINT KOT
            </Button>
            <Button
              onClick={() => handlePlaceOrder('SAVE_AND_KOT')}
              loading={isPlacingOrder}
              disabled={cart.length === 0 && !activeOrder}
              className="py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5 border bg-teal-600 hover:bg-teal-500 border-teal-500/30 text-white shadow-[0_4px_16px_rgba(20,184,166,0.2)] hover:scale-[1.02] duration-200"
            >
              <CheckCircle2 size={13} /> SAVE & KOT
            </Button>
          </div>

          {/* Bottom Row: Exactly 3 Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <Button
              onClick={() => handlePlaceOrder('SAVE')}
              loading={isPlacingOrder}
              disabled={cart.length === 0 && !activeOrder}
              className="py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1 border bg-slate-800 hover:bg-slate-700 border-white/10 text-white shadow-md hover:scale-[1.02] duration-200"
            >
              <Save size={13} /> SAVE
            </Button>
            <Button
              onClick={() => handlePlaceOrder('HOLD')}
              loading={isPlacingOrder}
              disabled={cart.length === 0 && !activeOrder}
              className="py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1 border bg-amber-600 hover:bg-amber-500 border-amber-500/30 text-white shadow-[0_4px_16px_rgba(245,158,11,0.2)] hover:scale-[1.02] duration-200"
            >
              <Pause size={13} /> HOLD
            </Button>
            <Button
              onClick={() => {
                setIsProforma(true);
                handlePrintBill();
              }}
              loading={isPlacingOrder || settleLoading}
              disabled={!activeOrder}
              className="py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1 border bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-400 hover:to-teal-500 border-emerald-400/20 shadow-[0_4px_24px_rgba(16,185,129,0.35)] hover:scale-[1.02] duration-200"
            >
              <ReceiptIndianRupee size={13} /> SETTLE
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}
