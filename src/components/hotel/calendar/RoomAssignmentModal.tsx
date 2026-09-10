'use client';

import React, { useState } from 'react';
import { X, Check, Bed, User, Loader2, Sparkles } from 'lucide-react';

interface RoomAssignmentModalProps {
  isOpen: boolean;
  unassignedBookings: any[];
  roomsList: any[];
  onClose: () => void;
  onAssigned: () => void;
}

export function RoomAssignmentModal({
  isOpen,
  unassignedBookings,
  roomsList,
  onClose,
  onAssigned,
}: RoomAssignmentModalProps) {
  const [selectedAllocations, setSelectedAllocations] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAssign = async (bookingId: string) => {
    const roomId = selectedAllocations[bookingId];
    if (!roomId) return;

    setSavingId(bookingId);
    try {
      const res = await fetch('/api/hotel/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: bookingId,
          assignedRoomId: roomId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        onAssigned();
      } else {
        alert(data.message || 'Error assigning room.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-[#0f172a] rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-800 text-white relative max-h-[85vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <Bed className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Room Assignment Console</h3>
            <p className="text-xs text-slate-400">Allocate unassigned bookings to vacant rooms</p>
          </div>
        </div>

        <div className="my-4 overflow-y-auto space-y-3 flex-1 pr-1">
          {unassignedBookings.length === 0 ? (
            <div className="p-8 text-center bg-[#1e293b]/30 rounded-xl border border-slate-800 text-slate-400 text-xs">
              <Sparkles className="w-6 h-6 text-[#00b894] mx-auto mb-2" />
              All current bookings have been allocated to rooms! No unassigned reservations.
            </div>
          ) : (
            unassignedBookings.map((b) => {
              const guestName = b.guest
                ? `${b.guest.firstName || ''} ${b.guest.lastName || ''}`.trim() || b.guest.name
                : b.guestName || 'Guest';

              return (
                <div key={b.id} className="p-3.5 rounded-xl bg-[#1e293b]/50 border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white">{guestName}</h4>
                      <span className="text-[11px] text-slate-400">
                        {b.bookingNo || b.reservationNumber} • {b.roomType?.name || 'Standard'}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      Unallocated
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <select
                      value={selectedAllocations[b.id] || ''}
                      onChange={(e) => setSelectedAllocations({ ...selectedAllocations, [b.id]: e.target.value })}
                      className="flex-1 bg-slate-900 border border-slate-700 text-xs rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#00b894]"
                    >
                      <option value="">Select clean vacant room...</option>
                      {roomsList.map((r) => (
                        <option key={r.id} value={r.id}>
                          Room {r.roomNumber} ({r.roomType?.name || 'Standard'}) - {r.housekeepingStatus || 'Clean'}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => handleAssign(b.id)}
                      disabled={!selectedAllocations[b.id] || savingId === b.id}
                      className="px-3 py-1.5 bg-[#00b894] hover:bg-[#00a884] disabled:opacity-50 text-white text-xs font-bold rounded-lg flex items-center gap-1 transition-all cursor-pointer shrink-0"
                    >
                      {savingId === b.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      Assign
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
