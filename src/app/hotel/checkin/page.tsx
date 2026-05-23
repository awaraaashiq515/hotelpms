'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Sparkles, 
  Loader2, 
  UserCheck, 
  FileText, 
  Upload, 
  Bed,
  CreditCard,
  Camera,
  Image as ImageIcon
} from 'lucide-react';
import { toast, Toaster } from 'sonner';

function CheckInContent() {
  const searchParams = useSearchParams();
  const resId = searchParams.get('resId') || '';
  const router = useRouter();

  const [reservation, setReservation] = useState<any>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Check-In Form State
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [expectedCheckout, setExpectedCheckout] = useState('');
  const [idType, setIdType] = useState('Aadhaar Card');
  const [idNumber, setIdNumber] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  // Walk-in States (in case no reservation is selected)
  const [isWalkIn, setIsWalkIn] = useState(!resId);
  const [guestsList, setGuestsList] = useState<any[]>([]);
  const [selectedGuestId, setSelectedGuestId] = useState('');
  const [walkInRate, setWalkInRate] = useState('1500');
  const [advanceAmount, setAdvanceAmount] = useState('0');

  useEffect(() => {
    // Load physical rooms and guests (for walk-in)
    Promise.all([
      fetch('/api/hotel/rooms').then((res) => res.json()),
      fetch('/api/guests').then((res) => res.json()).catch(() => ({ success: true, data: [] })), // fallback if route doesn't exist
    ])
      .then(([roomsRes, guestsRes]) => {
        if (roomsRes.success) setRooms(roomsRes.data);
        if (guestsRes.success) setGuestsList(guestsRes.data);
        
        // If a reservation ID is passed, fetch it
        if (resId) {
          fetch('/api/hotel/bookings')
            .then((res) => res.json())
            .then((bookingsRes) => {
              if (bookingsRes.success) {
                const found = bookingsRes.data.find((b: any) => b.id === resId);
                if (found) {
                  setReservation(found);
                  setSelectedGuestId(found.guestId);
                  setExpectedCheckout(found.departureDate.split('T')[0]);
                  
                  // Pre-select room if already assigned in booking
                  if (found.assignedRoomId) {
                    setSelectedRoomId(found.assignedRoomId);
                  } else {
                    // Try to find first available room of correct room type
                    const matchingRoom = roomsRes.data.find(
                      (r: any) => r.roomTypeId === found.roomTypeId && r.status === 'AVAILABLE'
                    );
                    if (matchingRoom) setSelectedRoomId(matchingRoom.id);
                  }
                }
              }
              setLoading(false);
            })
            .catch(() => setLoading(false));
        } else {
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Error loading check-in details:', err);
        setLoading(false);
      });
  }, [resId]);

  const handleMockUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    // Mock upload server delay
    setTimeout(() => {
      setDocumentUrl(`/uploads/kyc/${file.name}`);
      setUploading(false);
      toast.success('KYC Document uploaded and scanned!');
    }, 1500);
  };

  const handleCheckInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGuestId || !selectedRoomId || !expectedCheckout) {
      toast.error('Please complete all required fields.');
      return;
    }

    try {
      const payload = {
        reservationId: isWalkIn ? null : reservation?.id,
        guestId: selectedGuestId,
        roomId: selectedRoomId,
        expectedCheckoutAt: expectedCheckout,
        kycData: {
          idType,
          idNumber,
          documentType: idType,
          documentUrl: documentUrl || null,
        },
        walkInData: isWalkIn ? {
          ratePerNight: Number(walkInRate),
          advanceAmount: Number(advanceAmount),
          adults: 1,
          children: 0,
        } : null,
      };

      const res = await fetch('/api/hotel/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Guest Checked-in and room locked!');
        setTimeout(() => {
          router.push('/hotel');
        }, 1500);
      } else {
        toast.error(data.message || 'Check-in failed.');
      }
    } catch (err) {
      toast.error('Error during check-in submission.');
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  // Filter available rooms
  const availableRooms = rooms.filter(
    (r) => r.status === 'AVAILABLE' && r.housekeepingStatus === 'CLEAN'
  );

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="space-y-1">
        <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-indigo-400">
          <Sparkles size={12} /> Front Desk checkin
        </span>
        <h1 className="text-2xl md:text-3xl font-black text-white leading-none">
          Guest Check-in & KYC
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Check-In Details Form (Left Column) */}
        <form onSubmit={handleCheckInSubmit} className="md:col-span-2 space-y-6">
          <div className="p-6 rounded-3xl bg-[#0f172a] border border-slate-800 space-y-5">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-300">
              {isWalkIn ? 'Walk-in Check-In Details' : 'Check-In for Reservation'}
            </h3>

            {/* Guest Selection */}
            {isWalkIn ? (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Select Guest Profile *</label>
                <select
                  required
                  value={selectedGuestId}
                  onChange={(e) => setSelectedGuestId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="">Choose Profile</option>
                  {guestsList.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.firstName} {g.lastName || ''} ({g.mobile || 'No mobile'})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  Don't see the guest? Register them in the <Link href="/customers" className="text-indigo-400 font-bold hover:underline">Customers Screen</Link> first.
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Reservation Guest</p>
                  <p className="font-bold text-white mt-0.5">
                    {reservation?.guest?.firstName} {reservation?.guest?.lastName}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Booking Ref: {reservation?.bookingNo}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Reserved Category</p>
                  <p className="font-bold text-indigo-400 mt-0.5">{reservation?.roomType?.name}</p>
                </div>
              </div>
            )}

            {/* Stay Configuration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Assign Room Number *</label>
                <select
                  required
                  value={selectedRoomId}
                  onChange={(e) => setSelectedRoomId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="">Select Clean Room</option>
                  {isWalkIn 
                    ? availableRooms.map((r) => (
                        <option key={r.id} value={r.id}>Room {r.roomNumber} ({r.roomType.code})</option>
                      ))
                    : rooms
                        .filter((r) => r.roomTypeId === reservation?.roomTypeId)
                        .map((r) => {
                          const isAvailable = r.status === 'AVAILABLE' && r.housekeepingStatus === 'CLEAN';
                          const isAssigned = r.id === reservation?.assignedRoomId;
                          return (
                            <option key={r.id} value={r.id} disabled={!isAvailable && !isAssigned}>
                              Room {r.roomNumber} {!isAvailable && !isAssigned ? '(Occupied/Dirty)' : isAssigned ? '(Assigned)' : '(Clean)'}
                            </option>
                          );
                        })
                  }
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Expected Checkout Date *</label>
                <input
                  type="date"
                  required
                  value={expectedCheckout}
                  onChange={(e) => setExpectedCheckout(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            {/* Walk-in Pricing Detail */}
            {isWalkIn && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-800/60">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Walk-in Rate (₹ / Night)</label>
                  <input
                    type="number"
                    value={walkInRate}
                    onChange={(e) => setWalkInRate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-indigo-400 font-bold text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Advance Deposit Received (₹)</label>
                  <input
                    type="number"
                    value={advanceAmount}
                    onChange={(e) => setAdvanceAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-emerald-400 font-bold text-sm focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2"
            >
              <UserCheck size={14} /> Complete Guest Check-In
            </button>
          </div>
        </form>

        {/* KYC Document scan panel (Right Column) */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-[#0f172a] border border-slate-800 space-y-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-300 flex items-center gap-2">
              <FileText size={16} className="text-indigo-400" /> Identity KYC Verification
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Document ID Type</label>
                <select
                  value={idType}
                  onChange={(e) => setIdType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 text-sm focus:outline-none"
                >
                  <option>Aadhaar Card</option>
                  <option>Passport</option>
                  <option>Driving License</option>
                  <option>Voter ID Card</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Document / ID Number</label>
                <input
                  type="text"
                  placeholder="ID Card Number"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 text-sm focus:outline-none"
                />
              </div>

              {/* Upload Panel */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Upload ID Document Image</label>
                <div className="relative border-2 border-dashed border-slate-800 rounded-2xl p-6 hover:border-indigo-500/40 transition-colors flex flex-col items-center justify-center text-center cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleMockUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  {uploading ? (
                    <div className="space-y-2">
                      <Loader2 className="animate-spin text-indigo-400 mx-auto" size={24} />
                      <p className="text-[10px] text-slate-400">Scanning ID Proof...</p>
                    </div>
                  ) : documentUrl ? (
                    <div className="space-y-2">
                      <ImageIcon className="text-emerald-400 mx-auto animate-bounce" size={24} />
                      <p className="text-[10px] text-emerald-400 font-bold">Scanned Successfully!</p>
                      <p className="text-[9px] text-slate-500 font-mono truncate max-w-[150px]">{documentUrl}</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="text-slate-500 mx-auto" size={24} />
                      <p className="text-[10px] font-bold text-slate-300">Click or Drag photo</p>
                      <p className="text-[9px] text-slate-500">Supports JPG, PNG, PDF</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckInPage() {
  return (
    <Suspense fallback={
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    }>
      <CheckInContent />
      <Toaster position="top-right" richColors />
    </Suspense>
  );
}
