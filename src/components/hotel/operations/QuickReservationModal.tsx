'use client';

import React, { useState } from 'react';
import { X, Plus, User, Phone, Loader2 } from 'lucide-react';

interface RoomOption {
  id: string;
  roomNumber: string;
  roomTypeName: string;
  roomTypeId: string;
  baseRate: number;
}

interface QuickReservationModalProps {
  isOpen: boolean;
  roomsList: RoomOption[];
  onClose: () => void;
  onCreated: () => void;
}

export function QuickReservationModal({
  isOpen,
  roomsList,
  onClose,
  onCreated,
}: QuickReservationModalProps) {
  const [guestFirstName, setGuestFirstName] = useState('');
  const [guestLastName, setGuestLastName] = useState('');
  const [guestMobile, setGuestMobile] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState(roomsList[0]?.id || '');
  const [arrivalDate, setArrivalDate] = useState(new Date().toISOString().split('T')[0]);
  const [departureDate, setDepartureDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestFirstName.trim()) return;

    setSubmitting(true);
    try {
      const selectedRoom = roomsList.find((r) => r.id === selectedRoomId) || roomsList[0];
      const nights = Math.max(
        1,
        Math.round(
          (new Date(departureDate).getTime() - new Date(arrivalDate).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      );
      const totalAmount = (selectedRoom?.baseRate || 3500) * nights;

      const res = await fetch('/api/hotel/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestFirstName,
          guestLastName,
          guestMobile,
          assignedRoomId: selectedRoom?.id,
          roomTypeId: selectedRoom?.roomTypeId,
          arrivalDate,
          departureDate,
          adults: 1,
          children: 0,
          totalAmount,
          advanceAmount: 0,
          addOnNotes: notes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        onCreated();
        onClose();
        setGuestFirstName('');
        setGuestLastName('');
        setGuestMobile('');
        setNotes('');
      } else {
        alert(data.message || 'Error creating reservation');
      }
    } catch (err) {
      console.error(err);
      alert('Network error creating reservation.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-[#0f172a] rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-800 relative text-white">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <div className="w-3 h-3 rounded-full bg-[#00b894]"></div>
          <h3 className="text-lg font-bold text-white">
            Create Real Reservation
          </h3>
        </div>
        <p className="text-xs text-slate-400 mb-5">
          Record a live front desk booking directly into your hotel system.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                First Name *
              </label>
              <input
                type="text"
                required
                value={guestFirstName}
                onChange={(e) => setGuestFirstName(e.target.value)}
                placeholder="e.g. Rahul"
                className="w-full bg-[#1e293b]/60 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00b894] placeholder:text-slate-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Last Name
              </label>
              <input
                type="text"
                value={guestLastName}
                onChange={(e) => setGuestLastName(e.target.value)}
                placeholder="e.g. Sharma"
                className="w-full bg-[#1e293b]/60 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00b894] placeholder:text-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Mobile Number
            </label>
            <input
              type="tel"
              value={guestMobile}
              onChange={(e) => setGuestMobile(e.target.value)}
              placeholder="e.g. +91 9876543210"
              className="w-full bg-[#1e293b]/60 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00b894] placeholder:text-slate-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Select Hotel Room
            </label>
            <select
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              className="w-full bg-[#1e293b]/60 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00b894]"
            >
              {roomsList.map((r) => (
                <option key={r.id} value={r.id} className="bg-slate-900 text-white">
                  Room {r.roomNumber} ({r.roomTypeName}) - ₹{r.baseRate}/night
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Check-In Date
              </label>
              <input
                type="date"
                value={arrivalDate}
                onChange={(e) => setArrivalDate(e.target.value)}
                className="w-full bg-[#1e293b]/60 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00b894]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Check-Out Date
              </label>
              <input
                type="date"
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
                className="w-full bg-[#1e293b]/60 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00b894]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Guest Notes / Special Requests
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. VIP guest, high floor, extra pillows..."
              className="w-full bg-[#1e293b]/60 border border-slate-700 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00b894] placeholder:text-slate-500"
            ></textarea>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 text-xs font-semibold bg-[#00b894] hover:bg-[#00a884] text-white rounded-xl flex items-center gap-1.5 shadow-lg shadow-[#00b894]/20 transition-all cursor-pointer"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Save Real Booking
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
