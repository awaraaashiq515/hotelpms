'use client';

import React from 'react';
import { CarFront, Plus, Edit2, Trash2, QrCode, Power } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ParkingSlot {
  id: string;
  name: string;
  status: string;
  activeOrder?: {
    customerName: string;
    vehicleNumber: string;
    totalAmount: number;
    elapsedTime?: number;
  };
}

interface ParkingLayoutViewProps {
  slots: ParkingSlot[];
  onNewSlot: () => void;
  onEditSlot: (slot: ParkingSlot) => void;
  onDeleteSlot: (id: string) => void;
  onResetSlot: (id: string) => void;
  onShowQR: (slot: ParkingSlot) => void;
  onBillingNavigate: (slotId: string, slotName: string) => void;
}

export const ParkingLayoutView: React.FC<ParkingLayoutViewProps> = ({
  slots,
  onNewSlot,
  onEditSlot,
  onDeleteSlot,
  onResetSlot,
  onShowQR,
  onBillingNavigate
}) => {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg">
            <CarFront size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">Parking Management</h2>
            <p className="text-[11px] font-bold text-amber-400/70 uppercase tracking-[0.2em] mt-0.5">Real-time Vehicle Orders & Slots</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-black/40 rounded-xl border border-white/5">
            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest mr-2">Total Slots:</span>
            <span className="text-sm font-black text-white">{slots.length}</span>
          </div>
          <Button
            className="rounded-2xl h-12 px-6 font-black uppercase text-xs tracking-widest gap-2 flex items-center bg-amber-500 hover:bg-amber-400 text-white border border-amber-400/50 shadow-xl transition-all"
            onClick={onNewSlot}
          >
            <Plus size={16} /> New Slot
          </Button>
        </div>
      </div>

      {slots.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4 bg-white/5 rounded-[2.5rem] border-2 border-dashed border-white/10">
          <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400/30">
            <CarFront size={40} />
          </div>
          <div className="space-y-1">
            <p className="text-lg font-black text-white/50 uppercase tracking-widest">No Parking Slots Configured</p>
            <p className="text-sm text-white/30 max-w-xs mx-auto">Add parking spaces to manage orders from customers directly at their vehicles.</p>
          </div>
          <Button
            variant="secondary"
            className="mt-4 rounded-xl px-8 font-black uppercase text-[10px] tracking-widest border-amber-500/20 text-amber-400 hover:bg-amber-500 hover:text-white"
            onClick={onNewSlot}
          >
            Add First Slot
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
          {slots.map((slot) => {
            const isOccupied = slot.status !== 'VACANT';
            const order = slot.activeOrder;
            return (
              <div
                key={slot.id}
                onClick={() => onBillingNavigate(slot.id, slot.name)}
                className={`relative group flex flex-col gap-4 p-6 rounded-[2rem] border-2 transition-all duration-300 cursor-pointer overflow-hidden ${
                  isOccupied
                    ? 'bg-red-500/5 border-red-500/20 shadow-lg shadow-red-500/5'
                    : 'bg-white/5 border-white/5 hover:border-amber-500/40 hover:bg-amber-500/5'
                }`}
              >
                {/* Animated background gradient on hover */}
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-br ${isOccupied ? 'from-red-500 to-orange-500' : 'from-amber-500 to-yellow-500'}`} />

                {/* Status Label */}
                <div className="flex items-center justify-between relative z-10">
                  <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                    isOccupied ? 'bg-red-500/20 text-red-400 border-red-500/20' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20'
                  }`}>
                    {isOccupied ? 'Occupied' : 'Available'}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); onEditSlot(slot); }}
                      className="p-1.5 text-white/20 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteSlot(slot.id); }}
                      className="p-1.5 text-white/20 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center py-2 relative z-10">
                  <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-lg transition-transform duration-500 group-hover:scale-110 ${isOccupied ? 'bg-red-500 text-white shadow-red-500/20' : 'bg-amber-500 text-white shadow-amber-500/20'}`}>
                    <CarFront size={32} />
                  </div>
                  <p className="mt-4 text-lg font-black text-white tracking-tight group-hover:text-amber-300 transition-colors">{slot.name}</p>
                </div>

                {order ? (
                  <div className="mt-2 space-y-1 relative z-10 bg-black/20 p-3 rounded-xl border border-white/5">
                    <p className="text-[10px] font-black text-white/80 uppercase tracking-tight truncate">{order.customerName}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">{order.vehicleNumber}</p>
                      <span className="text-[10px] font-black text-amber-400">₹{(order.totalAmount || 0).toFixed(0)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 pt-1 border-t border-white/5">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest">{order.elapsedTime || 0} mins active</span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 text-center relative z-10">
                    <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em]">Ready for Orders</p>
                  </div>
                )}

                {/* Action buttons appear on hover */}
                <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-gradient-to-t from-black/80 to-transparent flex items-center gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    className="flex-1 rounded-xl h-10 text-[9px] font-black uppercase tracking-widest bg-amber-500 hover:bg-amber-400"
                    onClick={(e) => { e.stopPropagation(); onBillingNavigate(slot.id, slot.name); }}
                  >
                    {isOccupied ? 'Update' : 'New Order'}
                  </Button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onShowQR(slot); }}
                    className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors border border-white/10"
                  >
                    <QrCode size={16} />
                  </button>
                  {isOccupied && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onResetSlot(slot.id); }}
                      className="w-10 h-10 rounded-xl bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white flex items-center justify-center transition-all border border-red-500/20"
                    >
                      <Power size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
