'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  Edit3,
  Calendar,
  User,
  Phone,
  Mail,
  IndianRupee,
  Upload,
  Trash2,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  FileText,
  CreditCard,
  BedDouble,
  Waves,
  HeartHandshake,
  Plus,
  Minus
} from 'lucide-react';
import { toast } from 'sonner';
import { parseKycFromNotes, buildNotesWithKyc, ProofDoc } from './ProofDocumentsModal';

interface EditAgentBookingModalProps {
  booking: any;
  agentCommissionRate?: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditAgentBookingModal({
  booking,
  agentCommissionRate = 10,
  onClose,
  onSuccess,
}: EditAgentBookingModalProps) {
  const [guestName, setGuestName] = useState(booking.guestName || '');
  const [guestPhone, setGuestPhone] = useState(booking.guestPhone || '');
  const [guestEmail, setGuestEmail] = useState(booking.guestEmail || '');
  const [guestNationality, setGuestNationality] = useState(booking.guestNationality || 'Indian');
  const [adults, setAdults] = useState(Number(booking.adults) || 1);
  const [children, setChildren] = useState(Number(booking.children) || 0);

  const initCheckIn = booking.checkIn ? new Date(booking.checkIn).toISOString().split('T')[0] : '';
  const initCheckOut = booking.checkOut ? new Date(booking.checkOut).toISOString().split('T')[0] : '';
  const [checkIn, setCheckIn] = useState(initCheckIn);
  const [checkOut, setCheckOut] = useState(initCheckOut);

  const [roomType, setRoomType] = useState(booking.roomType || 'Standard');
  const [totalAmount, setTotalAmount] = useState(String(booking.totalAmount || '0'));
  const [specialRequests, setSpecialRequests] = useState(booking.specialRequests || '');

  // Extract initial room count (e.g. from "2x Deluxe Room" or "(3 Rooms)")
  const initRoomMatch = booking.roomType?.match(/^(\d+)x\s*/i) || booking.roomType?.match(/\((\d+)\s*Rooms?\)/i);
  const parsedInitRooms = initRoomMatch ? Number(initRoomMatch[1]) : 1;
  const [numberOfRooms, setNumberOfRooms] = useState(parsedInitRooms || 1);

  const extractBaseRoomName = (rt: string) => {
    return rt.replace(/^\d+x\s*/i, '').replace(/\s*\(\d+\s*Rooms?\)$/i, '').trim() || 'Standard Room';
  };

  const handleRoomCountChange = (newCount: number) => {
    const validCount = Math.max(1, Math.min(25, newCount));
    const prevCount = numberOfRooms || 1;
    setNumberOfRooms(validCount);
    const baseName = extractBaseRoomName(roomType);
    const newRoomType = validCount === 1 ? baseName : `${validCount}x ${baseName} (${validCount} Rooms)`;
    setRoomType(newRoomType);

    // If total amount exists and is positive, adjust proportionally
    const curTotal = Number(totalAmount) || 0;
    if (curTotal > 0 && prevCount > 0 && validCount !== prevCount) {
      const perRoom = curTotal / prevCount;
      setTotalAmount(String(Math.round(perRoom * validCount)));
    }
  };

  const [includePoolAccess, setIncludePoolAccess] = useState(Boolean(booking.includePoolAccess));
  const [includeSpaPackage, setIncludeSpaPackage] = useState(Boolean(booking.includeSpaPackage));

  // KYC / Proof Documents
  const initialKyc = parseKycFromNotes(booking.notes);
  const [aadhaarNumber, setAadhaarNumber] = useState(initialKyc.aadhaarNumber || '');
  const [panNumber, setPanNumber] = useState(initialKyc.panNumber || '');
  const [proofDocs, setProofDocs] = useState<ProofDoc[]>(initialKyc.docs || []);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate nights
  const nights = checkIn && checkOut
    ? Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000))
    : 1;

  // Calculate live commission
  const rate = booking.agent?.commissionRate || agentCommissionRate || 10;
  const estimatedCommission = ((Number(totalAmount) || 0) * rate) / 100;

  // Upload proof document handler
  const handleUploadProof = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDoc(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/agent-portal/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (data.success && data.url) {
        setProofDocs((prev) => [
          ...prev,
          {
            label: file.name.replace(/\.[^/.]+$/, '') || 'Customer Proof',
            url: data.url,
            type: 'other',
          },
        ]);
        toast.success('Document uploaded!');
      } else {
        toast.error(data.message || 'Upload failed');
      }
    } catch {
      toast.error('Network error uploading proof');
    } finally {
      setUploadingDoc(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveDoc = (indexToRemove: number) => {
    setProofDocs((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) {
      toast.error('Guest name is required');
      return;
    }
    if (!checkIn || !checkOut) {
      toast.error('Check-in and Check-out dates are required');
      return;
    }
    if (new Date(checkOut) <= new Date(checkIn)) {
      toast.error('Check-out date must be after Check-in date');
      return;
    }

    setSubmitting(true);
    try {
      // Re-pack clean notes with KYC
      const originalCleanNotes = (booking.notes || '').replace(/\s*\[KYC VERIFIED:[^\]]+\]\s*/g, '').trim();

      const kycExtraUrls = proofDocs.map((d) => d.url);
      const updatedNotes = buildNotesWithKyc(originalCleanNotes, {
        aadhaarNumber: aadhaarNumber || undefined,
        panNumber: panNumber ? panNumber.toUpperCase() : undefined,
        extraDocs: kycExtraUrls,
      });

      const res = await fetch('/api/hotel/agent-bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: booking.id,
          isAgentEdit: true,
          requireApproval: true,
          guestName: guestName.trim(),
          guestPhone: guestPhone.trim() || null,
          guestEmail: guestEmail.trim() || null,
          guestNationality,
          adults: Number(adults),
          children: Number(children),
          checkIn,
          checkOut,
          roomType,
          totalAmount: Number(totalAmount) || 0,
          notes: updatedNotes,
          specialRequests: specialRequests.trim() || null,
          includePoolAccess,
          includeSpaPackage,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Booking updated! Sent to hotel front desk for approval.');
        onSuccess();
        onClose();
      } else {
        toast.error(data.message || 'Failed to update booking');
      }
    } catch {
      toast.error('Network error while saving changes');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-[#090f1e] border border-violet-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-lg">
              <Edit3 size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Edit Agent Booking</h3>
              <p className="text-xs text-violet-300 font-medium">
                Booking ID: <span className="font-mono text-slate-300">{booking.id.slice(-8)}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Warning Banner: Re-Approval Required */}
        <div className="px-6 py-3 bg-amber-500/10 border-b border-amber-500/25 flex items-start gap-2.5 text-xs text-amber-200">
          <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-amber-300">Approval Required:</strong> Any updates made here will reset the booking status to{' '}
            <span className="font-black underline">Pending Approval</span>. The hotel front desk will be alerted with bell sound to review and re-confirm.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Guest Personal Info */}
          <div className="bg-[#050a14] border border-slate-800/80 rounded-2xl p-4 space-y-3">
            <p className="text-[10px] font-black text-violet-400 uppercase tracking-wider flex items-center gap-1.5">
              <User size={12} /> Guest Details
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Guest Full Name *</label>
                <input
                  type="text"
                  required
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full bg-[#090f1e] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                  placeholder="e.g. Vikram Malhotra"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  className="w-full bg-[#090f1e] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                  placeholder="+91 98765 43210"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Email Address</label>
                <input
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  className="w-full bg-[#090f1e] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                  placeholder="guest@example.com"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Nationality</label>
                <input
                  type="text"
                  value={guestNationality}
                  onChange={(e) => setGuestNationality(e.target.value)}
                  className="w-full bg-[#090f1e] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                  placeholder="Indian"
                />
              </div>
            </div>
          </div>

          {/* Stay & Room Details */}
          <div className="bg-[#050a14] border border-slate-800/80 rounded-2xl p-4 space-y-3">
            <p className="text-[10px] font-black text-violet-400 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar size={12} /> Stay & Room Configuration
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Check-In *</label>
                <input
                  type="date"
                  required
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="w-full bg-[#090f1e] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Check-Out *</label>
                <input
                  type="date"
                  required
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full bg-[#090f1e] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Adults</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={adults}
                  onChange={(e) => setAdults(Number(e.target.value))}
                  className="w-full bg-[#090f1e] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Children</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={children}
                  onChange={(e) => setChildren(Number(e.target.value))}
                  className="w-full bg-[#090f1e] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>

            {/* Room Quantity Selection (1 or Multiple Rooms) */}
            <div className="pt-2 border-t border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
                  <BedDouble size={12} className="text-violet-400" />
                  <span>Rooms to Book (Single or Multiple)</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-400 font-bold">Quantity:</span>
                  <span className="px-2 py-0.5 rounded-full bg-violet-600/30 text-violet-300 font-black text-[11px] border border-violet-500/40">
                    {numberOfRooms} {numberOfRooms === 1 ? 'Room' : 'Rooms'}
                  </span>
                </div>
              </div>

              {/* Quick count buttons + Stepper */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="grid grid-cols-5 gap-1 flex-1 min-w-[200px]">
                  {[1, 2, 3, 4, 5].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => handleRoomCountChange(cnt)}
                      className={`py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                        numberOfRooms === cnt
                          ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md border border-violet-400/50'
                          : 'bg-[#090f1e] border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      {cnt} {cnt === 1 ? 'Room' : 'Rooms'}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5 bg-[#090f1e] border border-slate-800 rounded-xl px-2 py-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleRoomCountChange(numberOfRooms - 1)}
                    disabled={numberOfRooms <= 1}
                    className="w-6 h-6 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white disabled:opacity-30 flex items-center justify-center font-black transition-all"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="w-8 text-center text-xs font-black text-white">{numberOfRooms}</span>
                  <button
                    type="button"
                    onClick={() => handleRoomCountChange(numberOfRooms + 1)}
                    disabled={numberOfRooms >= 25}
                    className="w-6 h-6 rounded-lg bg-violet-600 hover:bg-violet-500 text-white flex items-center justify-center font-black transition-all"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">
                  Room Label / Category Description
                </label>
                <input
                  type="text"
                  value={roomType}
                  onChange={(e) => setRoomType(e.target.value)}
                  className="w-full bg-[#090f1e] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                  placeholder="e.g. Deluxe Room, Superior Suite"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">
                  Total Booking Amount (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">₹</span>
                  <input
                    type="number"
                    min="0"
                    required
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    className="w-full bg-[#090f1e] border border-slate-800 rounded-xl pl-7 pr-3 py-2 text-xs font-black text-white focus:outline-none focus:border-violet-500"
                  />
                </div>
                <p className="text-[10px] text-amber-400 mt-1 font-semibold">
                  Calculated Commission: ₹{estimatedCommission.toFixed(0)} (@ {rate}%)
                </p>
              </div>
            </div>
          </div>

          {/* Customer Proof Images / KYC Section */}
          <div className="bg-[#050a14] border border-slate-800/80 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black text-violet-400 uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard size={12} /> Customer ID Proof Images & Documents
              </p>
              <button
                type="button"
                disabled={uploadingDoc}
                onClick={() => fileInputRef.current?.click()}
                className="text-[10px] font-bold text-violet-300 hover:text-white bg-violet-600/30 hover:bg-violet-600/40 border border-violet-500/40 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
              >
                {uploadingDoc ? <Loader2 size={11} className="animate-spin" /> : <Upload size={11} />}
                <span>+ Upload Proof Image</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                capture="environment"
                onChange={handleUploadProof}
                className="hidden"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Aadhaar Number</label>
                <input
                  type="text"
                  maxLength={12}
                  value={aadhaarNumber}
                  onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-[#090f1e] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                  placeholder="12-digit Aadhaar"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">PAN Number</label>
                <input
                  type="text"
                  maxLength={10}
                  value={panNumber}
                  onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                  className="w-full bg-[#090f1e] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500 uppercase"
                  placeholder="e.g. ABCDE1234F"
                />
              </div>
            </div>

            {/* Proof Documents Preview List */}
            {proofDocs.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                {proofDocs.map((doc, idx) => (
                  <div
                    key={idx}
                    className="relative group rounded-xl overflow-hidden border border-slate-800 bg-[#090f1e] p-2 flex flex-col justify-between"
                  >
                    <div className="h-20 w-full rounded-lg overflow-hidden bg-black/40 mb-1.5 flex items-center justify-center">
                      <img src={doc.url} alt={doc.label} className="w-full h-full object-cover" />
                    </div>
                    <p className="text-[10px] text-slate-300 font-bold truncate">{doc.label}</p>
                    <button
                      type="button"
                      onClick={() => handleRemoveDoc(idx)}
                      className="absolute top-3 right-3 w-5 h-5 rounded-full bg-rose-600/80 text-white flex items-center justify-center hover:bg-rose-600 opacity-80 group-hover:opacity-100 transition-all cursor-pointer"
                      title="Remove image"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center border border-dashed border-slate-800 rounded-xl">
                <p className="text-[11px] text-slate-500">No proof images attached yet.</p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[10px] font-bold text-violet-400 hover:underline mt-0.5"
                >
                  Click to upload customer ID proof (Aadhaar / PAN / Photo)
                </button>
              </div>
            )}
          </div>

          {/* Special Requests & Notes */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400">Special Requests / Notes</label>
            <textarea
              rows={2}
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              className="w-full bg-[#050a14] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
              placeholder="e.g. Early check-in requested, extra bed needed"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-violet-600/30 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Submitting for Approval...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} />
                  <span>Save & Submit for Approval</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

