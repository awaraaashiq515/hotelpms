'use client';
import React, { useState } from 'react';
import { X, Layers, Building2, Check, AlertOctagon, ShieldAlert, Percent, Save } from 'lucide-react';
import type { ChannelItem, ChannelRoomMappingItem } from '@/types/hotel/channel.types';
import { toast } from 'sonner';

export interface RoomTypeItem {
  id: string;
  name: string;
  code: string;
  baseRate: number;
  maxOccupancy: number;
  rooms?: { id: string }[];
}

interface ChannelMappingModalProps {
  isOpen: boolean;
  onClose: () => void;
  channel: ChannelItem | null;
  roomTypes: RoomTypeItem[];
  onSaveMapping: (mappingData: {
    channelId: string;
    roomTypeId: string;
    otaRoomName: string;
    allocatedRooms: number;
    priceMarkupPct: number;
    stopSell: boolean;
  }) => Promise<boolean>;
}

export function ChannelMappingModal({
  isOpen,
  onClose,
  channel,
  roomTypes,
  onSaveMapping,
}: ChannelMappingModalProps) {
  const [mappings, setMappings] = useState<Record<string, {
    otaRoomName: string;
    allocatedRooms: number;
    priceMarkupPct: number;
    stopSell: boolean;
  }>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  if (!isOpen || !channel) return null;

  const handleFieldChange = (roomTypeId: string, field: 'otaRoomName' | 'allocatedRooms' | 'priceMarkupPct' | 'stopSell', value: string | number | boolean) => {
    const existing = mappings[roomTypeId] || getInitialForRoom(roomTypeId);
    setMappings((prev) => ({
      ...prev,
      [roomTypeId]: {
        ...existing,
        [field]: value,
      },
    }));
  };

  const getInitialForRoom = (roomTypeId: string) => {
    const rt = roomTypes.find((r) => r.id === roomTypeId);
    const existing = channel.roomMappings?.find((m) => m.roomTypeId === roomTypeId);
    return {
      otaRoomName: existing?.otaRoomName || (rt ? `${rt.name} (${channel.name})` : ''),
      allocatedRooms: existing?.allocatedRooms ?? (rt?.rooms?.length || 5),
      priceMarkupPct: existing?.priceMarkupPct ?? Math.round((channel.rateMultiplier - 1) * 100),
      stopSell: existing?.stopSell ?? false,
    };
  };

  const handleSaveSingle = async (roomTypeId: string) => {
    setSavingId(roomTypeId);
    const data = mappings[roomTypeId] || getInitialForRoom(roomTypeId);
    const success = await onSaveMapping({
      channelId: channel.id,
      roomTypeId,
      otaRoomName: data.otaRoomName,
      allocatedRooms: data.allocatedRooms,
      priceMarkupPct: data.priceMarkupPct,
      stopSell: data.stopSell,
    });
    setSavingId(null);
    if (success) {
      toast.success('Room type mapping synchronized!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-3xl bg-slate-900 border border-white/10 shadow-2xl p-6 overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-xl">
              {channel.logo}
            </div>
            <div>
              <h2 className="text-lg font-black text-white">
                {channel.name} Room Mapping & Inventory
              </h2>
              <p className="text-xs text-slate-400">
                Map PMS room categories, set OTA allocations, rate markups & stop-sell rules
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

        {/* Room Types Mapping List */}
        <div className="space-y-4 mt-5">
          {roomTypes.length === 0 ? (
            <p className="text-center text-slate-500 py-8">
              No PMS room types found. Please create room types in Room settings first.
            </p>
          ) : (
            roomTypes.map((rt) => {
              const current = mappings[rt.id] || getInitialForRoom(rt.id);
              const basePrice = rt.baseRate || 3500;
              const calculatedRate = Math.round(basePrice * (1 + current.priceMarkupPct / 100));

              return (
                <div
                  key={rt.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    current.stopSell
                      ? 'bg-rose-950/20 border-rose-500/30'
                      : 'bg-slate-800/40 border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-white">{rt.name}</h4>
                        <span className="text-[10px] text-slate-400 font-bold px-2 py-0.5 rounded-lg bg-slate-800 border border-white/5">
                          Base: ₹{basePrice.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Code: <span className="text-white font-mono">{rt.code}</span> · Max Occupancy: {rt.maxOccupancy} guests
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Stop Sell Toggle */}
                      <button
                        type="button"
                        onClick={() => handleFieldChange(rt.id, 'stopSell', !current.stopSell)}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                          current.stopSell
                            ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <AlertOctagon size={12} />
                        {current.stopSell ? 'Stop-Sell Active' : 'Allow Booking'}
                      </button>

                      {/* Save Row Button */}
                      <button
                        type="button"
                        disabled={savingId === rt.id}
                        onClick={() => handleSaveSingle(rt.id)}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md transition-colors disabled:opacity-50"
                      >
                        <Save size={12} />
                        {savingId === rt.id ? 'Syncing...' : 'Save'}
                      </button>
                    </div>
                  </div>

                  {/* Form fields for this room */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2 border-t border-white/5">
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 mb-1 block">
                        OTA Category Name
                      </label>
                      <input
                        type="text"
                        value={current.otaRoomName}
                        onChange={(e) => handleFieldChange(rt.id, 'otaRoomName', e.target.value)}
                        placeholder="e.g. Deluxe Room with View"
                        className="w-full h-8 px-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] font-bold text-slate-400 mb-1 block">
                        Max Room Allocation
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={current.allocatedRooms}
                        onChange={(e) => handleFieldChange(rt.id, 'allocatedRooms', parseInt(e.target.value) || 0)}
                        className="w-full h-8 px-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] font-bold text-slate-400 mb-1 block">
                        Rate Markup (%) → ₹{calculatedRate.toLocaleString()}
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={current.priceMarkupPct}
                          onChange={(e) => handleFieldChange(rt.id, 'priceMarkupPct', parseFloat(e.target.value) || 0)}
                          className="w-full h-8 px-2.5 pr-6 rounded-xl bg-slate-900 border border-white/10 text-emerald-400 font-bold text-xs focus:outline-none focus:border-blue-500"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 text-[10px]">%</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-4 mt-4 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-5 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-black transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
