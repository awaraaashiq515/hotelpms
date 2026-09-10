'use client';

import React, { useState, useEffect } from 'react';
import { X, Check, Loader2 } from 'lucide-react';
import { ReservationItem } from './ReservationWidget';

interface QuickNotesModalProps {
  reservation: ReservationItem | null;
  onClose: () => void;
  onSaved: () => void;
}

export function QuickNotesModal({ reservation, onClose, onSaved }: QuickNotesModalProps) {
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (reservation) {
      setNotes(reservation.notes || '');
    }
  }, [reservation]);

  if (!reservation) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/hotel/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: reservation.id,
          addOnNotes: notes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        onSaved();
        onClose();
      } else {
        alert(data.message || 'Failed to update note.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error updating note.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-[#0f172a] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-800 relative text-white">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <div className="w-2.5 h-2.5 rounded-full bg-[#00b894]"></div>
          <h3 className="text-lg font-bold text-white">
            Reservation Notes
          </h3>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Guest: <strong className="text-white">{reservation.guestName}</strong> ({reservation.unitNumber}) • Res #{reservation.reservationNumber}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Guest Preference & Operational Notes
            </label>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter special requests, VIP preference, housekeeping notes..."
              className="w-full bg-[#1e293b]/60 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00b894] focus:border-transparent placeholder:text-slate-500"
            ></textarea>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-xs font-semibold bg-[#00b894] hover:bg-[#00a884] text-white rounded-xl flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Save Note
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
