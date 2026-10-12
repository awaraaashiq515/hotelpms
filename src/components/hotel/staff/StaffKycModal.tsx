'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Camera,
  Upload,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  Search,
  User,
  Building,
  RefreshCw,
  FileText,
  Sparkles,
  Smartphone,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';

export interface StaffKycModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialReservationId?: string;
  initialGuestId?: string;
  initialRoomNumber?: string;
  initialGuestName?: string;
  propertyCode?: string;
  onSuccess?: () => void;
}

export function StaffKycModal({
  isOpen,
  onClose,
  initialReservationId,
  initialGuestId,
  initialRoomNumber,
  initialGuestName,
  propertyCode,
  onSuccess,
}: StaffKycModalProps) {
  const [loadingList, setLoadingList] = useState(false);
  const [activeGuests, setActiveGuests] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Selected target
  const [selectedGuest, setSelectedGuest] = useState<any | null>(null);

  // Form states
  const [idType, setIdType] = useState('Aadhaar Card');
  const [idNumber, setIdNumber] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Live WebCam states (for desktops/laptops)
  const [showWebCam, setShowWebCam] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Initialize or fetch list
  useEffect(() => {
    if (!isOpen) {
      stopWebCam();
      setIsSuccess(false);
      return;
    }

    if (initialReservationId || initialGuestId) {
      setSelectedGuest({
        reservationId: initialReservationId || '',
        guestId: initialGuestId || '',
        roomNumber: initialRoomNumber || 'In-House Room',
        guestName: initialGuestName || 'Guest',
      });
    } else {
      loadActiveList();
    }
  }, [isOpen, initialReservationId, initialGuestId, initialRoomNumber, initialGuestName]);

  const loadActiveList = async () => {
    try {
      setLoadingList(true);
      const url = propertyCode
        ? `/api/hotel/kyc?list=true&propertyCode=${encodeURIComponent(propertyCode)}`
        : `/api/hotel/kyc?list=true`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setActiveGuests(json.data);
      }
    } catch (err) {
      console.error('Failed to load active guests for KYC:', err);
    } finally {
      setLoadingList(false);
    }
  };

  const handleSelectTarget = (g: any) => {
    setSelectedGuest(g);
    setIdType(g.idType || 'Aadhaar Card');
    setIdNumber(g.idNumber || '');
    if (g.documentUrl) {
      setPreviewUrl(g.documentUrl);
    } else {
      setPreviewUrl(null);
      setSelectedFile(null);
      setBase64Image(null);
    }
  };

  // Handle mobile camera or file select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      toast.error('File size exceeds 8MB limit');
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    const reader = new FileReader();
    reader.onloadend = () => {
      setBase64Image(reader.result as string);
    };
    reader.readAsDataURL(file);

    toast.success('📸 Photo attached! Ready to complete KYC.');
  };

  // WebCam controls
  const startWebCam = async () => {
    try {
      setShowWebCam(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error('Webcam error:', err);
      toast.error('Could not access camera. Try file/photo upload.');
      setShowWebCam(false);
    }
  };

  const captureWebCam = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUri = canvas.toDataURL('image/jpeg', 0.85);
      setPreviewUrl(dataUri);
      setBase64Image(dataUri);
      stopWebCam();
      toast.success('📸 Photo captured from camera!');
    }
  };

  const stopWebCam = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((t) => t.stop());
      setCameraStream(null);
    }
    setShowWebCam(false);
  };

  // Submit KYC
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedGuest?.guestId && !selectedGuest?.reservationId) {
      toast.error('Please select a guest or room first.');
      return;
    }

    if (!base64Image && !selectedFile && !previewUrl) {
      toast.error('Please attach a photo or scan of the ID document.');
      return;
    }

    try {
      setIsSubmitting(true);

      let res;
      if (selectedFile) {
        const formData = new FormData();
        if (selectedGuest.guestId) formData.append('guestId', selectedGuest.guestId);
        if (selectedGuest.reservationId) formData.append('reservationId', selectedGuest.reservationId);
        formData.append('idType', idType);
        formData.append('idNumber', idNumber.trim());
        formData.append('file', selectedFile);

        res = await fetch('/api/hotel/kyc', {
          method: 'POST',
          body: formData,
        });
      } else {
        res = await fetch('/api/hotel/kyc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            guestId: selectedGuest.guestId,
            reservationId: selectedGuest.reservationId,
            idType,
            idNumber: idNumber.trim(),
            base64Image: base64Image || previewUrl,
          }),
        });
      }

      const json = await res.json();
      if (json.success) {
        setIsSuccess(true);
        toast.success('🎉 Guest KYC Completed & Verified Successfully!');
        onSuccess?.();
      } else {
        toast.error(json.message || 'Failed to save KYC');
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Network error saving KYC verification');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const filteredList = activeGuests.filter((g) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      g.roomNumber?.toLowerCase().includes(q) ||
      g.guestName?.toLowerCase().includes(q) ||
      g.phone?.toLowerCase().includes(q) ||
      g.bookingNo?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-[#0b1120] border border-slate-700/80 rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col text-slate-100">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-[#0b1120]/95 backdrop-blur z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Camera size={20} />
            </div>
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                Attach Photo / Scan (KYC)
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                  Staff Tool
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Snap or upload guest ID proof to complete KYC instantly
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopWebCam();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-4 flex-1">
          {isSuccess ? (
            <div className="text-center py-6 space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 size={36} />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">KYC Verification Completed!</h3>
                <p className="text-xs text-slate-300 mt-1">
                  ID photo and details for{' '}
                  <strong className="text-white">
                    {selectedGuest?.guestName || 'Guest'} (Room {selectedGuest?.roomNumber || ''})
                  </strong>{' '}
                  are now saved and verified across all hotel staff terminals.
                </p>
              </div>

              {previewUrl && (
                <div className="max-w-[220px] mx-auto rounded-xl overflow-hidden border border-emerald-500/40 shadow-xl">
                  <img src={previewUrl} alt="KYC proof" className="w-full h-32 object-cover" />
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsSuccess(false);
                    setPreviewUrl(null);
                    setSelectedFile(null);
                    setBase64Image(null);
                    if (!initialReservationId) setSelectedGuest(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs"
                >
                  Scan Another Guest
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Target Room/Guest Selector if not pre-locked */}
              {!initialReservationId && !initialGuestId && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    1. Select In-House Guest / Room
                  </label>
                  <div className="relative">
                    <Search
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                    />
                    <input
                      type="text"
                      placeholder="Search room number, guest name, mobile..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {loadingList ? (
                    <div className="p-3 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                      <RefreshCw size={14} className="animate-spin text-indigo-400" />
                      Loading in-house rooms...
                    </div>
                  ) : (
                    <div className="max-h-36 overflow-y-auto space-y-1.5 p-1 bg-slate-950/50 rounded-xl border border-slate-800">
                      {filteredList.length === 0 ? (
                        <p className="p-2 text-center text-xs text-slate-500">No matching rooms found</p>
                      ) : (
                        filteredList.map((g) => {
                          const isSel = selectedGuest?.reservationId === g.reservationId;
                          return (
                            <button
                              key={g.reservationId || g.guestId}
                              type="button"
                              onClick={() => handleSelectTarget(g)}
                              className={`w-full p-2 rounded-lg text-left flex items-center justify-between text-xs transition-colors ${
                                isSel
                                  ? 'bg-indigo-600/30 border border-indigo-500 text-white'
                                  : 'hover:bg-slate-900 text-slate-300 border border-transparent'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-black text-amber-300 font-mono">
                                  Room {g.roomNumber}
                                </span>
                                <span className="font-semibold text-white">{g.guestName}</span>
                                {g.phone && <span className="text-[10px] text-slate-400">({g.phone})</span>}
                              </div>
                              <div>
                                {g.isVerified ? (
                                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                                    <Check size={11} /> KYC Done
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-amber-400 font-bold">Pending</span>
                                )}
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Selected Target Badge */}
              {selectedGuest && (
                <div className="p-3 bg-gradient-to-r from-indigo-500/10 via-slate-900 to-indigo-500/10 border border-indigo-500/30 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold font-mono text-xs">
                      {selectedGuest.roomNumber ? `R-${selectedGuest.roomNumber}` : 'GST'}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>{selectedGuest.guestName}</span>
                        <span className="text-[10px] text-indigo-400 font-mono">
                          Room {selectedGuest.roomNumber}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        {selectedGuest.phone || 'Ready for ID capture'}
                      </p>
                    </div>
                  </div>
                  {!initialReservationId && (
                    <button
                      type="button"
                      onClick={() => setSelectedGuest(null)}
                      className="text-[10px] text-slate-400 hover:text-white underline"
                    >
                      Change
                    </button>
                  )}
                </div>
              )}

              {/* ID Type & ID Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Document / ID Type
                  </label>
                  <select
                    value={idType}
                    onChange={(e) => setIdType(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Aadhaar Card">Aadhaar Card</option>
                    <option value="Passport">Passport</option>
                    <option value="Driving License">Driving License</option>
                    <option value="Voter ID">Voter ID</option>
                    <option value="Government ID">Other Government ID</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    ID Number (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 5432 1098 7654"
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Photo / Scan Capture Options */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-slate-300 flex items-center justify-between">
                  <span>Attach Photo / Scan (ID Proof)</span>
                  {previewUrl && (
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                      <Check size={11} /> Photo Loaded
                    </span>
                  )}
                </label>

                {/* Hidden input for mobile camera */}
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {/* Hidden input for file/gallery */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {/* WebCam Viewfinder if active */}
                {showWebCam && (
                  <div className="relative rounded-2xl overflow-hidden bg-black border border-indigo-500/50">
                    <video ref={videoRef} className="w-full h-48 object-cover" playsInline />
                    <div className="absolute inset-x-0 bottom-2 flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={captureWebCam}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow-lg active:scale-95 transition-transform"
                      >
                        <Camera size={14} /> Snap Photo
                      </button>
                      <button
                        type="button"
                        onClick={stopWebCam}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Photo Preview if loaded */}
                {previewUrl && !showWebCam && (
                  <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-950 p-2 flex items-center gap-3">
                    <img
                      src={previewUrl}
                      alt="ID Preview"
                      className="w-16 h-16 object-cover rounded-lg border border-slate-800"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">
                        {selectedFile?.name || 'Captured ID Photo'}
                      </p>
                      <p className="text-[10px] text-slate-400">Ready to save to guest record</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewUrl(null);
                        setSelectedFile(null);
                        setBase64Image(null);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-300 text-[11px] font-bold"
                    >
                      Retake
                    </button>
                  </div>
                )}

                {/* Action Buttons to Capture */}
                {!showWebCam && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {/* Mobile rear camera / instant snap */}
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="p-3 bg-gradient-to-b from-indigo-600/20 to-indigo-900/30 hover:from-indigo-600/30 hover:to-indigo-900/40 border border-indigo-500/40 rounded-xl flex flex-col items-center justify-center gap-1.5 text-center group transition-colors cursor-pointer"
                    >
                      <Camera size={18} className="text-indigo-400 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-bold text-white">Camera Snap</span>
                      <span className="text-[9px] text-indigo-300">Take Live Photo</span>
                    </button>

                    {/* Desktop webcam */}
                    <button
                      type="button"
                      onClick={startWebCam}
                      className="p-3 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl flex flex-col items-center justify-center gap-1.5 text-center group transition-colors cursor-pointer"
                    >
                      <Smartphone size={18} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-bold text-white">WebCam</span>
                      <span className="text-[9px] text-slate-400">Desktop View</span>
                    </button>

                    {/* File / Gallery upload */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="col-span-2 sm:col-span-1 p-3 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl flex flex-col items-center justify-center gap-1.5 text-center group transition-colors cursor-pointer"
                    >
                      <Upload size={18} className="text-cyan-400 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-bold text-white">Upload File</span>
                      <span className="text-[9px] text-slate-400">Gallery / PDF</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedGuest || (!previewUrl && !selectedFile)}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      Saving KYC Proof...
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={16} />
                      Complete & Verify Guest KYC
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
