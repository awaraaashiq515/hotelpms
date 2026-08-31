'use client';
import React, { useState } from 'react';
import {
  X,
  Bed,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ShieldCheck,
  User,
  Phone,
  Calendar,
  IndianRupee,
  Key,
  Wrench,
  Brush,
  ArrowRight,
  DoorOpen,
} from 'lucide-react';
import type { RoomBoardItem, HousekeepingStatus, RoomOperationalStatus, MaintenanceStatus } from '@/types/hotel/room-board.types';
import Link from 'next/link';

interface RoomActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: RoomBoardItem | null;
  onUpdateStatus: (roomId: string, data: {
    housekeepingStatus?: HousekeepingStatus;
    status?: RoomOperationalStatus;
    maintenanceStatus?: MaintenanceStatus;
    isVIP?: boolean;
  }) => Promise<boolean>;
}

export function RoomActionModal({
  isOpen,
  onClose,
  room,
  onUpdateStatus,
}: RoomActionModalProps) {
  if (!isOpen || !room) return null;

  return (
    <RoomActionForm
      key={room.id}
      room={room}
      onClose={onClose}
      onUpdateStatus={onUpdateStatus}
    />
  );
}

interface RoomActionFormProps {
  room: RoomBoardItem;
  onClose: () => void;
  onUpdateStatus: (roomId: string, data: {
    housekeepingStatus?: HousekeepingStatus;
    status?: RoomOperationalStatus;
    maintenanceStatus?: MaintenanceStatus;
    isVIP?: boolean;
  }) => Promise<boolean>;
}

function RoomActionForm({
  room,
  onClose,
  onUpdateStatus,
}: RoomActionFormProps) {
  const [hkStatus, setHkStatus] = useState<HousekeepingStatus>(room.housekeepingStatus);
  const [opStatus, setOpStatus] = useState<RoomOperationalStatus>(room.status);
  const [maintStatus, setMaintStatus] = useState<MaintenanceStatus>(room.maintenanceStatus);
  const [isVIP, setIsVIP] = useState<boolean>(Boolean(room.isVIP));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const success = await onUpdateStatus(room.id, {
      housekeepingStatus: hkStatus,
      status: opStatus,
      maintenanceStatus: maintStatus,
      isVIP,
    });
    setSaving(false);
    if (success) {
      onClose();
    }
  };

  const isOccupied = room.activeGuest !== null || room.status === 'OCCUPIED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-white/10 shadow-2xl p-6 overflow-hidden max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-white font-black text-lg">
              {room.roomNumber}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white">Room {room.roomNumber}</h2>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-white/5">
                  Floor {room.floor}
                </span>
                {isVIP && (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    VIP
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {room.roomTypeName} · Base: ₹{room.baseRate?.toLocaleString('en-IN')}/night · Max {room.maxOccupancy} Guests
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body Content */}
        <div className="space-y-4 mt-4 text-xs">
          {/* Guest In-House Card if occupied */}
          {room.activeGuest ? (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-950/30 via-slate-800/60 to-slate-900 border border-rose-500/30">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <User size={14} className="text-rose-400" />
                  <span className="text-xs font-black text-white">{room.activeGuest.guestName}</span>
                </div>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Occupied Stay
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-300">
                <div>
                  <span className="text-slate-500 block">Stay Dates:</span>
                  <span className="font-bold text-white">
                    {room.activeGuest.arrivalDate} → {room.activeGuest.departureDate}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Folio Balance:</span>
                  <span className={`font-black ${room.activeGuest.dueAmount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    ₹{room.activeGuest.dueAmount.toLocaleString('en-IN')} Due / ₹{room.activeGuest.totalAmount.toLocaleString('en-IN')} Total
                  </span>
                </div>
              </div>

              {room.activeGuest.phone && (
                <div className="mt-2 text-[10px] text-slate-400 flex items-center gap-1.5">
                  <Phone size={10} />
                  <span>{room.activeGuest.phone}</span>
                </div>
              )}

              <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">Booking #{room.activeGuest.bookingNo}</span>
                <Link
                  href={`/hotel/checkout?bookingId=${room.activeGuest.reservationId}`}
                  className="px-3 py-1 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-black flex items-center gap-1 transition-colors"
                >
                  <DoorOpen size={11} />
                  <span>Check-out / Settle Folio</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-white/5 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-300">Room is Currently Vacant</span>
                <p className="text-[10px] text-slate-500">Ready for walk-in or new reservation assignment</p>
              </div>
              <Link
                href={`/hotel/bookings?roomId=${room.id}`}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black flex items-center gap-1 transition-colors shadow-md"
              >
                <span>New Check-in</span>
                <ArrowRight size={11} />
              </Link>
            </div>
          )}

          {/* Housekeeping Status Quick Selector */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <Brush size={12} className="text-indigo-400" />
              <span>Housekeeping Readiness</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'CLEAN' as const, label: 'Clean (Ready)', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
                { id: 'DIRTY' as const, label: 'Vacant Dirty', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
                { id: 'IN_PROGRESS' as const, label: 'In Cleaning', color: 'bg-sky-500/20 text-sky-300 border-sky-500/40' },
                { id: 'INSPECTION_PENDING' as const, label: 'Inspection', color: 'bg-violet-500/20 text-violet-300 border-violet-500/40' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setHkStatus(opt.id)}
                  className={`py-2 px-2 rounded-xl text-[10px] font-bold border transition-all text-center ${
                    hkStatus === opt.id
                      ? `${opt.color} ring-2 ring-indigo-500 shadow-md`
                      : 'bg-slate-800/60 border-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Operational Status */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <Key size={12} className="text-sky-400" />
              <span>Operational State</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'AVAILABLE' as const, label: 'Available' },
                { id: 'OCCUPIED' as const, label: 'Occupied' },
                { id: 'OUT_OF_ORDER' as const, label: 'Out of Order (OOO)' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setOpStatus(opt.id)}
                  className={`py-2 rounded-xl text-[10px] font-bold border transition-all ${
                    opStatus === opt.id
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                      : 'bg-slate-800/60 border-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Maintenance Status & VIP Toggle */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                <Wrench size={11} />
                <span>Maintenance</span>
              </label>
              <select
                value={maintStatus}
                onChange={(e) => setMaintStatus(e.target.value as MaintenanceStatus)}
                className="w-full h-9 px-2.5 rounded-xl bg-slate-800 border border-white/10 text-white text-xs"
              >
                <option value="OK">OK / Normal</option>
                <option value="UNDER_MAINTENANCE">Under Maintenance</option>
              </select>
            </div>

            <div className="flex flex-col justify-end">
              <button
                type="button"
                onClick={() => setIsVIP(!isVIP)}
                className={`w-full h-9 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                  isVIP
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                    : 'bg-slate-800 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles size={12} />
                <span>{isVIP ? 'VIP Room: Active' : 'Mark as VIP'}</span>
              </button>
            </div>
          </div>

          {room.assignedStaffName && (
            <div className="p-2.5 rounded-xl bg-slate-800/30 border border-white/5 flex items-center justify-between text-[10px]">
              <span className="text-slate-400">Assigned Attendant:</span>
              <span className="font-bold text-white">{room.assignedStaffName}</span>
            </div>
          )}
        </div>

        {/* Actions Footer */}
        <div className="flex items-center justify-end gap-2.5 pt-4 mt-4 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            {saving ? 'Updating…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
