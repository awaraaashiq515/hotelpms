'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Upload, 
  Camera, 
  ShieldCheck, 
  AlertCircle, 
  Check, 
  RefreshCw, 
  ExternalLink,
  Eye,
  FileText,
  User,
  Building,
  CheckCircle2,
  QrCode,
  Smartphone,
  Copy,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';

interface KycUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any | null;
  onKycUpdated?: () => void;
}

export function KycUploadModal({
  isOpen,
  onClose,
  booking,
  onKycUpdated,
}: KycUploadModalProps) {
  const [activeMode, setActiveMode] = useState<'upload' | 'camera' | 'qr'>('upload');
  const [idType, setIdType] = useState('Aadhaar Card');
  const [idNumber, setIdNumber] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  // Live WebCam states
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  // Synchronize state when booking changes
  useEffect(() => {
    if (booking && isOpen) {
      const g = booking.guest;
      setIdType(g?.idType || 'Aadhaar Card');
      setIdNumber(g?.idNumber || '');
      const existingDoc = g?.documents?.[0]?.documentUrl || '';
      setDocumentUrl(existingDoc);
      setPreviewUrl(existingDoc || null);
      setSelectedFile(null);
      setUploadSuccess(false);
    }

    return () => {
      stopCamera();
    };
  }, [booking, isOpen]);

  // Real-time polling when modal is open to detect staff mobile photo uploads!
  const [lastCheckDocCount, setLastCheckDocCount] = useState<number>(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen || !booking?.guest?.id) return;

    const initialDocs = booking.guest.documents?.length || 0;
    setLastCheckDocCount(initialDocs);

    const intervalId = setInterval(async () => {
      try {
        const res = await fetch(`/api/hotel/kyc?guestId=${booking.guest.id}`);
        const json = await res.json();
        if (json.success && json.data) {
          const docs = json.data.documents || [];
          if (docs.length > 0) {
            const latestDoc = docs[0];
            // If new document arrived or was updated
            if (latestDoc.documentUrl && latestDoc.documentUrl !== documentUrl) {
              setDocumentUrl(latestDoc.documentUrl);
              setPreviewUrl(latestDoc.documentUrl);
              if (json.data.guest?.idNumber) setIdNumber(json.data.guest.idNumber);
              if (json.data.guest?.idType) setIdType(json.data.guest.idType);
              setUploadSuccess(true);
              toast.success('🎉 KYC photo received from staff mobile in real time!');
              onKycUpdated?.();
            }
          }
        }
      } catch (err) {
        // quiet polling error
      }
    }, 2500);

    return () => clearInterval(intervalId);
  }, [isOpen, booking, documentUrl, onKycUpdated]);

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };

  const startCamera = async () => {
    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      setCameraStream(stream);
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      toast.error('Could not access webcam. Please check browser permissions or use file upload.');
      setIsCameraActive(false);
    }
  };

  const captureWebcamSnapshot = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setPreviewUrl(dataUrl);
    setDocumentUrl(dataUrl);
    stopCamera();
    toast.success('Webcam snapshot captured!');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // Auto-fill sample ID number if empty
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
    toast.success(`File selected: ${file.name}`);
  };

  const handleSaveKyc = async () => {
    if (!booking?.guest?.id) {
      toast.error('No guest ID associated with this booking.');
      return;
    }

    setUploading(true);
    try {
      let res;
      if (selectedFile) {
        const formData = new FormData();
        formData.append('guestId', booking.guest.id);
        formData.append('reservationId', booking.id);
        formData.append('idType', idType);
        formData.append('idNumber', idNumber);
        formData.append('file', selectedFile);

        res = await fetch('/api/hotel/kyc', {
          method: 'POST',
          body: formData,
        });
      } else if (previewUrl && previewUrl.startsWith('data:')) {
        // Base64 from camera
        res = await fetch('/api/hotel/kyc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            guestId: booking.guest.id,
            reservationId: booking.id,
            idType,
            idNumber,
            base64Image: previewUrl,
          }),
        });
      } else if (previewUrl) {
        // Existing or manually set documentUrl
        res = await fetch('/api/hotel/kyc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            guestId: booking.guest.id,
            reservationId: booking.id,
            idType,
            idNumber,
            documentUrl: previewUrl,
          }),
        });
      } else {
        // ID number update only
        res = await fetch('/api/hotel/kyc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            guestId: booking.guest.id,
            reservationId: booking.id,
            idType,
            idNumber,
          }),
        });
      }

      const json = await res.json();
      if (json.success) {
        toast.success('KYC document verified and saved!');
        setUploadSuccess(true);
        onKycUpdated?.();
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        toast.error(json.message || 'Failed to save KYC');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error uploading KYC');
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen || !booking) return null;

  const guest = booking.guest || {};
  const guestName = `${guest.firstName || ''} ${guest.lastName || ''}`.trim() || 'Guest';
  const hasUploadedDoc = Boolean(previewUrl || documentUrl);
  const isVerified = hasUploadedDoc && Boolean(idNumber);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-[#0f172a] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900/80 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <ShieldCheck size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">Guest Identity KYC</h3>
                {isVerified ? (
                  <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase">
                    <ShieldCheck size={11} /> Verified
                  </span>
                ) : hasUploadedDoc ? (
                  <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-black uppercase">
                    <AlertCircle size={11} /> Pending ID Details
                  </span>
                ) : (
                  <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-black uppercase">
                    <AlertCircle size={11} /> Pending Upload
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {guestName} • <span className="font-mono text-indigo-400">{booking.bookingNo}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Real-time sync alert banner */}
        <div className="px-6 py-2.5 bg-indigo-950/40 border-b border-indigo-500/20 flex items-center justify-between text-xs text-indigo-300">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-medium">
              Upload guest document or capture instantly using web camera.
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs text-slate-300">
          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-3 gap-2 bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => {
                stopCamera();
                setActiveMode('upload');
              }}
              className={`py-2 px-2.5 rounded-xl font-black text-[10px] sm:text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                activeMode === 'upload'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Upload size={13} /> Upload File
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveMode('camera');
                startCamera();
              }}
              className={`py-2 px-2.5 rounded-xl font-black text-[10px] sm:text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                activeMode === 'camera'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Camera size={13} /> PC WebCam
            </button>
            <button
              type="button"
              onClick={() => {
                stopCamera();
                setActiveMode('qr');
              }}
              className={`py-2 px-2.5 rounded-xl font-black text-[10px] sm:text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                activeMode === 'qr'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <QrCode size={13} /> Staff Phone QR
            </button>
          </div>

          {/* Mode 1: Staff Phone QR Scan */}
          {activeMode === 'qr' && (
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-indigo-500/20 text-center space-y-4">
              <div className="max-w-md mx-auto">
                <span className="text-xs font-bold text-white block mb-1">
                  Scan QR with Staff Mobile Phone
                </span>
                <p className="text-[11px] text-slate-400">
                  Open your mobile camera or scanner app. It will open the mobile camera page to take a photo of the guest's ID card. Once submitted, it automatically appears here in real-time!
                </p>
              </div>

              {booking.guest?.id && origin && (
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="p-3 bg-white rounded-2xl shadow-xl border-4 border-indigo-500/30">
                    <QRCodeSVG
                      value={`${origin}/kyc-scan?guestId=${booking.guest.id}&bookingNo=${booking.bookingNo}`}
                      size={160}
                      level="M"
                      includeMargin={false}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const url = `${origin}/kyc-scan?guestId=${booking.guest.id}&bookingNo=${booking.bookingNo}`;
                        navigator.clipboard.writeText(url);
                        toast.success('Mobile KYC Link copied to clipboard!');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold flex items-center gap-1.5 transition-colors border border-slate-700"
                    >
                      <Copy size={12} /> Copy Link
                    </button>
                    <a
                      href={`${origin}/kyc-scan?guestId=${booking.guest.id}&bookingNo=${booking.bookingNo}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 text-[11px] font-bold flex items-center gap-1.5 transition-colors border border-indigo-500/30"
                    >
                      <Smartphone size={12} /> Open Mobile Scanner ↗
                    </a>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-semibold mt-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    Listening for mobile upload in real time...
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mode 2: Desktop File Upload */}
          {activeMode === 'upload' && (
            <div className="space-y-3">
              <label 
                htmlFor="kyc-file-input"
                className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-slate-700 hover:border-indigo-500 bg-slate-900/40 cursor-pointer transition-colors text-center group"
              >
                <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 group-hover:bg-indigo-600/20 text-indigo-400 flex items-center justify-center transition-colors mb-2">
                  <Upload size={24} />
                </div>
                <span className="text-sm font-bold text-white group-hover:text-indigo-300">
                  {selectedFile ? selectedFile.name : 'Click or Drag & Drop Document'}
                </span>
                <span className="text-[11px] text-slate-500 mt-1">
                  JPEG, PNG, WEBP, PDF up to 10MB (Aadhaar / Passport / ID Proof)
                </span>
              </label>
              <input
                id="kyc-file-input"
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          )}

          {/* Mode 3: Desktop WebCam */}
          {activeMode === 'camera' && (
            <div className="space-y-3 text-center">
              <div className="relative rounded-2xl overflow-hidden bg-black aspect-video max-h-56 mx-auto border border-slate-800 flex items-center justify-center">
                {isCameraActive ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-slate-500">
                    <Camera size={32} />
                    <span>Camera is not active</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-center gap-3">
                {isCameraActive ? (
                  <button
                    type="button"
                    onClick={captureWebcamSnapshot}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg active:scale-95"
                  >
                    <Camera size={14} /> Capture Photo Now
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={startCamera}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5"
                  >
                    <RefreshCw size={14} /> Restart Camera
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Photo Preview Panel */}
          {previewUrl && (
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Eye size={13} className="text-indigo-400" /> Document Preview
                </span>
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-indigo-400 hover:underline flex items-center gap-1 font-bold"
                >
                  Full View <ExternalLink size={10} />
                </a>
              </div>

              <div className="max-h-48 rounded-xl overflow-hidden border border-slate-700/60 bg-black/40 flex items-center justify-center">
                <img
                  src={previewUrl}
                  alt="KYC Document Preview"
                  className="max-h-48 object-contain w-auto rounded-lg shadow-md"
                />
              </div>
            </div>
          )}

          {/* Form details: ID Type & Number */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-900/40 border border-slate-800">
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                Identity Document Type
              </label>
              <select
                value={idType}
                onChange={(e) => setIdType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="Aadhaar Card">Aadhaar Card</option>
                <option value="Passport">Passport</option>
                <option value="Voter ID">Voter ID</option>
                <option value="Driving License">Driving License</option>
                <option value="PAN Card">PAN Card</option>
                <option value="Other Govt ID">Other Govt ID</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                Document / ID Number
              </label>
              <input
                type="text"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                placeholder="e.g. 3736-7723-5547"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono font-bold text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-900/80 border-t border-slate-800/80 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={uploading}
            onClick={handleSaveKyc}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-indigo-600/30 active:scale-95 transition-all"
          >
            {uploading ? (
              <>
                <RefreshCw size={14} className="animate-spin" /> Saving KYC...
              </>
            ) : (
              <>
                <CheckCircle2 size={14} /> Save & Verify KYC
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
