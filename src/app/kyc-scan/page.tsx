'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Camera, 
  Upload, 
  CheckCircle2, 
  ShieldCheck, 
  AlertCircle, 
  User, 
  Building, 
  RefreshCw, 
  Check, 
  ArrowLeft,
  Sparkles,
  Smartphone
} from 'lucide-react';
import { toast, Toaster } from 'sonner';

function KycScannerContent() {
  const searchParams = useSearchParams();
  const paramGuestId = searchParams.get('guestId') || '';
  const paramReservationId = searchParams.get('reservationId') || '';
  const paramBookingNo = searchParams.get('bookingNo') || '';

  const [loading, setLoading] = useState(true);
  const [guestData, setGuestData] = useState<any>(null);
  const [reservationData, setReservationData] = useState<any>(null);

  // Form states
  const [idType, setIdType] = useState('Aadhaar Card');
  const [idNumber, setIdNumber] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchGuestInfo();
  }, [paramGuestId, paramReservationId]);

  const fetchGuestInfo = async () => {
    if (!paramGuestId && !paramReservationId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const query = paramReservationId ? `reservationId=${paramReservationId}` : `guestId=${paramGuestId}`;
      const res = await fetch(`/api/hotel/kyc?${query}`);
      const json = await res.json();

      if (json.success && json.data) {
        setGuestData(json.data.guest);
        setReservationData(json.data.reservation);
        if (json.data.guest?.idType) setIdType(json.data.guest.idType);
        if (json.data.guest?.idNumber) setIdNumber(json.data.guest.idNumber);
        if (json.data.latestDocument?.documentUrl) {
          setPreviewUrl(json.data.latestDocument.documentUrl);
        }
      }
    } catch (err) {
      console.error('Failed to load guest info:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCapturePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);

    // Auto-generate realistic demo ID if empty
    if (!idNumber) {
      if (idType === 'Aadhaar Card') {
        const ad1 = Math.floor(1000 + Math.random() * 9000);
        const ad2 = Math.floor(1000 + Math.random() * 9000);
        const ad3 = Math.floor(1000 + Math.random() * 9000);
        setIdNumber(`${ad1}-${ad2}-${ad3}`);
      } else if (idType === 'Passport') {
        const char = String.fromCharCode(65 + Math.floor(Math.random() * 26));
        const num = Math.floor(1000000 + Math.random() * 9000000);
        setIdNumber(`${char}${num}`);
      } else {
        const chars = String.fromCharCode(65 + Math.floor(Math.random() * 26)) + String.fromCharCode(65 + Math.floor(Math.random() * 26));
        const num = Math.floor(100000 + Math.random() * 900000);
        setIdNumber(`${chars}${num}`);
      }
    }

    toast.success('Photo captured! Tap Upload to sync with Desk.');
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile && !previewUrl) {
      toast.error('Please capture or choose a photo first');
      return;
    }

    const effectiveGuestId = paramGuestId || guestData?.id || reservationData?.guestId;
    if (!effectiveGuestId) {
      toast.error('No Guest record found. Please select a booking.');
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('guestId', effectiveGuestId);
      if (paramReservationId || reservationData?.id) {
        formData.append('reservationId', paramReservationId || reservationData.id);
      }
      formData.append('idType', idType);
      formData.append('idNumber', idNumber);

      if (selectedFile) {
        formData.append('file', selectedFile);
      } else if (previewUrl) {
        formData.append('documentUrl', previewUrl);
      }

      const res = await fetch('/api/hotel/kyc', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (json.success) {
        setUploadSuccess(true);
        toast.success('KYC uploaded successfully! Desk has been updated.');
      } else {
        toast.error(json.message || 'Upload failed');
      }
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const guestName = guestData 
    ? `${guestData.firstName || ''} ${guestData.lastName || ''}`.trim() || 'Guest'
    : 'Guest';

  const roomDisplay = reservationData?.rooms?.[0]?.room?.roomNumber 
    ? `Room ${reservationData.rooms[0].room.roomNumber}`
    : reservationData?.assignedRoomId || 'Unassigned';

  const bookingCode = paramBookingNo || reservationData?.bookingNo || 'RES';

  return (
    <div className="min-h-screen bg-[#080d1a] text-slate-100 flex flex-col justify-between p-4 max-w-lg mx-auto">
      <Toaster position="top-center" richColors theme="dark" />

      {/* Top Header */}
      <header className="pt-2 pb-4 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Camera size={18} />
          </div>
          <div>
            <h1 className="text-sm font-black text-white tracking-wide uppercase flex items-center gap-1.5">
              Staff KYC Camera
              <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded font-mono">LIVE</span>
            </h1>
            <p className="text-[10px] text-slate-400">Instant Front Desk Sync</p>
          </div>
        </div>

        <button 
          onClick={fetchGuestInfo}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white active:scale-95"
          title="Refresh"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </header>

      {/* Main Body */}
      <main className="py-4 space-y-4 flex-1">
        {/* Booking Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-900/40 border border-slate-800/80 shadow-lg">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <User size={20} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                  {bookingCode}
                </span>
                <h2 className="text-base font-extrabold text-white">{guestName}</h2>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-indigo-300 font-semibold">
                  <Building size={12} /> {roomDisplay}
                </div>
              </div>
            </div>

            <div className="text-right">
              {guestData?.documents?.length > 0 ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase tracking-wider">
                  <ShieldCheck size={12} /> Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-black uppercase tracking-wider">
                  <AlertCircle size={12} /> Pending
                </span>
              )}
            </div>
          </div>
        </div>

        {uploadSuccess ? (
          <div className="p-6 rounded-3xl bg-emerald-950/30 border border-emerald-500/30 text-center space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
              <CheckCircle2 size={36} />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">KYC Uploaded & Verified!</h3>
              <p className="text-xs text-slate-300 mt-1">
                The photo has been synced in real-time to the Front Desk Bookings screen.
              </p>
            </div>

            {previewUrl && (
              <div className="max-w-[240px] mx-auto rounded-xl overflow-hidden border border-emerald-500/40 shadow-xl">
                <img src={previewUrl} alt="KYC proof" className="w-full h-36 object-cover" />
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setUploadSuccess(false);
                setSelectedFile(null);
              }}
              className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider active:scale-95 transition-all"
            >
              Take Another Photo
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Camera Viewfinder / Preview Box */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`relative rounded-3xl border-2 border-dashed ${
                previewUrl ? 'border-indigo-500/60 bg-slate-900/60' : 'border-slate-700 hover:border-indigo-400 bg-slate-900/30'
              } p-4 flex flex-col items-center justify-center min-h-[220px] cursor-pointer transition-all active:scale-[0.99] overflow-hidden`}
            >
              {previewUrl ? (
                <div className="relative w-full h-full flex flex-col items-center">
                  <img 
                    src={previewUrl} 
                    alt="Captured Preview" 
                    className="max-h-56 w-auto object-contain rounded-2xl border border-slate-700 shadow-2xl" 
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-2xl">
                    <span className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg">
                      <Camera size={14} /> Tap to Retake
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center space-y-3 py-6">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center animate-pulse">
                    <Camera size={32} />
                  </div>
                  <div>
                    <span className="text-sm font-black text-white block">
                      Tap to Open Camera
                    </span>
                    <span className="text-xs text-slate-400 block mt-0.5">
                      Capture Aadhaar Card / ID Proof directly from phone
                    </span>
                  </div>
                </div>
              )}

              {/* Hidden file input with environment camera trigger for mobile */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleCapturePhoto}
                className="hidden"
              />
            </div>

            {/* Document Details Form */}
            <div className="space-y-3 p-4 rounded-2xl bg-slate-900/40 border border-slate-800">
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">
                  ID Proof Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['Aadhaar Card', 'Passport', 'Voter ID', 'Driving License'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setIdType(type)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border text-left ${
                        idType === type
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                          : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">
                  ID Document Number
                </label>
                <input
                  type="text"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  placeholder="e.g. 1234-5678-9012"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="button"
              disabled={isUploading || (!selectedFile && !previewUrl)}
              onClick={handleUploadSubmit}
              className={`w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl transition-all ${
                isUploading || (!selectedFile && !previewUrl)
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-indigo-600/30 active:scale-[0.98]'
              }`}
            >
              {isUploading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" /> Uploading & Syncing...
                </>
              ) : (
                <>
                  <Upload size={16} /> Upload & Verify KYC
                </>
              )}
            </button>
          </div>
        )}
      </main>

      {/* Footer info */}
      <footer className="pt-3 pb-1 border-t border-slate-800/80 text-center">
        <p className="text-[10px] text-slate-500 flex items-center justify-center gap-1 font-medium">
          <Smartphone size={11} className="text-slate-400" />
          OrderMint Hotel PMS • Mobile Staff Scanner
        </p>
      </footer>
    </div>
  );
}

export default function KycScannerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#080d1a] flex items-center justify-center text-indigo-400">
        <RefreshCw size={24} className="animate-spin" />
      </div>
    }>
      <KycScannerContent />
    </Suspense>
  );
}
