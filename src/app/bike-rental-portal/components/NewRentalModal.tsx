'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, X, User, Phone, ShieldCheck, Calendar, IndianRupee, Bike, Loader2, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { BikeItem } from './types';

interface NewRentalModalProps {
  vendorId: string;
  isOpen: boolean;
  onClose: () => void;
  availableBikes: BikeItem[];
  preselectedBike: BikeItem | null;
  onSuccess: () => void;
}

export const NewRentalModal: React.FC<NewRentalModalProps> = ({
  vendorId,
  isOpen,
  onClose,
  availableBikes,
  preselectedBike,
  onSuccess,
}) => {
  const [selectedBikeId, setSelectedBikeId] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [totalAmount, setTotalAmount] = useState('500');
  const [securityDeposit, setSecurityDeposit] = useState('1000');
  const [depositMode, setDepositMode] = useState('UPI');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Set initial selected bike
  useEffect(() => {
    if (preselectedBike) {
      setSelectedBikeId(preselectedBike.id);
      setSecurityDeposit(String(preselectedBike.securityDeposit));
      calculateRental(preselectedBike.dailyRate, startDate, endDate);
    } else if (availableBikes.length > 0 && !selectedBikeId) {
      setSelectedBikeId(availableBikes[0].id);
      setSecurityDeposit(String(availableBikes[0].securityDeposit));
      calculateRental(availableBikes[0].dailyRate, startDate, endDate);
    }
  }, [preselectedBike, availableBikes]);

  const calculateRental = (rate: number, start: string, end: string) => {
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    const days = Math.max(1, Math.round((e - s) / (1000 * 60 * 60 * 24)) || 1);
    setTotalAmount(String(days * rate));
  };

  const handleBikeChange = (id: string) => {
    setSelectedBikeId(id);
    const b = availableBikes.find((x) => x.id === id);
    if (b) {
      setSecurityDeposit(String(b.securityDeposit));
      calculateRental(b.dailyRate, startDate, endDate);
    }
  };

  const handleDatesChange = (newStart: string, newEnd: string) => {
    setStartDate(newStart);
    setEndDate(newEnd);
    const b = availableBikes.find((x) => x.id === selectedBikeId) || preselectedBike;
    if (b) {
      calculateRental(b.dailyRate, newStart, newEnd);
    }
  };

  if (!isOpen) return null;

  const currentSelectedBike = availableBikes.find((b) => b.id === selectedBikeId) || preselectedBike;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBikeId || !guestName || !guestPhone) {
      toast.error('Please fill required guest name, phone and bike');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/bike-rentals/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId,
          bikeId: selectedBikeId,
          guestName,
          guestPhone,
          licenseNumber: licenseNumber.toUpperCase().trim() || null,
          aadhaarNumber: aadhaarNumber.trim() || null,
          startDate,
          endDate,
          totalAmount: Number(totalAmount),
          securityDeposit: Number(securityDeposit),
          notes: `[WALK_IN] Deposit via ${depositMode}. ${notes ? `Note: ${notes}` : ''}`,
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success('Rental issued! Bike is now ON_RENT.');
        onSuccess();
        onClose();
      } else {
        toast.error(json.message || 'Failed to issue rental');
      }
    } catch {
      toast.error('Network error during rental creation.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0b1120] border border-slate-700/80 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Sticky Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4 bg-[#0b1120] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-white">Issue Bike Rental (Walk-in / Desk)</h2>
              <p className="text-[11px] text-slate-400">Hand over keys, verify Driving License & record deposit</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs overflow-y-auto flex-1 scrollbar-none">
          
          {/* Select Vehicle */}
          <div>
            <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1">
              Select Available Bike / Scooter <span className="text-rose-400">*</span>
            </label>
            <select
              value={selectedBikeId}
              onChange={(e) => handleBikeChange(e.target.value)}
              className="w-full bg-[#060a14] border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-medium focus:outline-none focus:border-rose-500 cursor-pointer"
            >
              {availableBikes.length === 0 ? (
                <option value="">No bikes available in fleet</option>
              ) : (
                availableBikes.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.model} ({b.plateNumber}) — ₹{b.dailyRate}/day (Deposit: ₹{b.securityDeposit})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Selected Vehicle Visual Card */}
          {currentSelectedBike && (
            <div className="p-3 rounded-2xl bg-[#060a14] border border-slate-800 flex items-center gap-3">
              {currentSelectedBike.photoUrl ? (
                <img
                  src={currentSelectedBike.photoUrl}
                  alt={currentSelectedBike.model}
                  className="w-16 h-14 rounded-xl object-cover shrink-0 border border-slate-700"
                />
              ) : (
                <div className="w-16 h-14 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-rose-400 shrink-0">
                  <Bike size={24} />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black text-white truncate">{currentSelectedBike.model}</p>
                <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-900 text-slate-300 border border-slate-800 font-bold">
                    {currentSelectedBike.plateNumber}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    {currentSelectedBike.category}
                  </span>
                  <span className="text-[10px] text-rose-400 font-bold">
                    ₹{currentSelectedBike.dailyRate}/day
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Guest Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                Guest / Tourist Name <span className="text-rose-400">*</span>
              </label>
              <input
                required
                type="text"
                placeholder="e.g. Rahul Verma"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full bg-[#060a14] border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                Mobile Number <span className="text-rose-400">*</span>
              </label>
              <input
                required
                type="tel"
                placeholder="e.g. 9876543210"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                className="w-full bg-[#060a14] border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono placeholder-slate-600 focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          {/* KYC: Driving License & Aadhaar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                Driving License (DL) No.
              </label>
              <input
                type="text"
                placeholder="e.g. HP0120220001234"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                className="w-full bg-[#060a14] border border-slate-800 rounded-xl px-3.5 py-2.5 text-white uppercase font-mono placeholder-slate-600 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                Aadhaar / ID Number
              </label>
              <input
                type="text"
                placeholder="e.g. 1234 5678 9012"
                value={aadhaarNumber}
                onChange={(e) => setAadhaarNumber(e.target.value)}
                className="w-full bg-[#060a14] border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono placeholder-slate-600 focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          {/* Rental Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                Pickup Date <span className="text-rose-400">*</span>
              </label>
              <input
                required
                type="date"
                value={startDate}
                onChange={(e) => handleDatesChange(e.target.value, endDate)}
                className="w-full bg-[#060a14] border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                Return Due Date <span className="text-rose-400">*</span>
              </label>
              <input
                required
                type="date"
                value={endDate}
                onChange={(e) => handleDatesChange(startDate, e.target.value)}
                className="w-full bg-[#060a14] border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          {/* Pricing & Deposit */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-[#060a14] border border-slate-800">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Rental Rent (₹)
              </label>
              <input
                type="number"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-black text-sm focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Deposit (₹)
              </label>
              <input
                type="number"
                value={securityDeposit}
                onChange={(e) => setSecurityDeposit(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-amber-400 font-black text-sm focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          {/* Deposit Mode */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Deposit Mode:</span>
            {['UPI', 'CASH', 'ORIGINAL_ID'].map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setDepositMode(mode)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  depositMode === mode
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {mode === 'ORIGINAL_ID' ? 'Retained Physical ID' : mode}
              </button>
            ))}
          </div>

          {/* Sticky Bottom Actions */}
          <div className="pt-2 sticky bottom-0 bg-[#0b1120] pb-1">
            <div className="flex items-center gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || availableBikes.length === 0}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:opacity-90 font-black text-white transition-all shadow-lg shadow-rose-600/25 flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                <span>Issue Rental Now</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
