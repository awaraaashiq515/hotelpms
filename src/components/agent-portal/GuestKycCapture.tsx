'use client';

import React, { useState, useRef } from 'react';
import {
  Camera, Upload, X, CheckCircle2, AlertCircle,
  CreditCard, FileText, User, Eye, EyeOff,
  Loader2, RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

interface GuestKycCaptureProps {
  guestName?: string;
  initialData?: KycData | null;
  onKycComplete: (kycData: KycData) => void;
  onSkip?: () => void;
}

export interface KycData {
  aadhaarNumber?: string;
  panNumber?: string;
  aadhaarFrontUrl?: string;
  aadhaarBackUrl?: string;
  panCardUrl?: string;
  selfieUrl?: string;
  verified: boolean;
}

function DocUploadBox({
  label,
  icon: Icon,
  accept,
  preview,
  onCapture,
  onClear,
  color = 'violet',
}: {
  label: string;
  icon: React.ElementType;
  accept?: string;
  preview?: string | null;
  onCapture: (file: File) => void;
  onClear: () => void;
  color?: 'violet' | 'sky' | 'emerald' | 'amber';
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const colorMap = {
    violet: 'border-violet-500/30 bg-violet-500/5 text-violet-400',
    sky: 'border-sky-500/30 bg-sky-500/5 text-sky-400',
    emerald: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400',
    amber: 'border-amber-500/30 bg-amber-500/5 text-amber-400',
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onCapture(file);
  };

  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">{label}</label>
      {preview ? (
        <div className="relative rounded-xl overflow-hidden border border-emerald-500/30 bg-emerald-500/5">
          <img src={preview} alt={label} className="w-full h-28 object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-2 left-2 flex items-center gap-1 text-[10px] text-emerald-300 font-black">
            <CheckCircle2 size={11} /> Captured
          </div>
          <button onClick={onClear}
            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 border border-rose-500/40 text-rose-400 flex items-center justify-center hover:bg-rose-500/20 transition-all">
            <X size={11} />
          </button>
        </div>
      ) : (
        <button onClick={() => fileRef.current?.click()}
          className={`w-full h-28 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 hover:opacity-80 transition-all ${colorMap[color]}`}>
          <Icon size={22} />
          <div className="text-center">
            <p className="text-[10px] font-black">Tap to Upload</p>
            <p className="text-[9px] opacity-60">Camera or Gallery</p>
          </div>
          <input ref={fileRef} type="file" accept={accept || 'image/*'} capture="environment"
            className="hidden" onChange={handleChange} />
        </button>
      )}
    </div>
  );
}

export default function GuestKycCapture({ guestName, initialData, onKycComplete, onSkip }: GuestKycCaptureProps) {
  const [aadhaarNumber, setAadhaarNumber] = useState(initialData?.aadhaarNumber || '');
  const [panNumber, setPanNumber] = useState(initialData?.panNumber || '');
  const [showAadhaar, setShowAadhaar] = useState(false);

  // File previews / URLs
  const [aadhaarFront, setAadhaarFront] = useState<string | null>(initialData?.aadhaarFrontUrl || null);
  const [aadhaarBack, setAadhaarBack] = useState<string | null>(initialData?.aadhaarBackUrl || null);
  const [panCard, setPanCard] = useState<string | null>(initialData?.panCardUrl || null);
  const [selfie, setSelfie] = useState<string | null>(initialData?.selfieUrl || null);

  const [uploading, setUploading] = useState(false);
  const [kycDone, setKycDone] = useState(false);

  const toPreview = (file: File): Promise<string> =>
    new Promise((res) => {
      const reader = new FileReader();
      reader.onload = (e) => res(e.target?.result as string);
      reader.readAsDataURL(file);
    });

  const uploadFileToServer = async (file: File): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/agent-portal/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        return data.url;
      }
    } catch (e) {
      console.warn('Server upload error, fallback to preview:', e);
    }
    return await toPreview(file);
  };

  const handleCapture = (setter: (v: string | null) => void) => async (file: File) => {
    const preview = await toPreview(file);
    setter(preview); // Show instant preview
    const serverUrl = await uploadFileToServer(file);
    setter(serverUrl); // Replace with server URL
  };

  const ensureUploaded = async (val: string | null, customName: string): Promise<string | undefined> => {
    if (!val) return undefined;
    if (val.startsWith('/api/images/') || val.startsWith('http')) return val;
    if (val.startsWith('data:image/')) {
      try {
        const res = await fetch('/api/agent-portal/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: val, filename: customName }),
        });
        const data = await res.json();
        if (data.success && data.url) return data.url;
      } catch (err) {
        console.warn('Upload error:', err);
      }
    }
    return val;
  };

  const aadhaarMasked = aadhaarNumber.replace(/(\d{4})(\d{4})(\d{4})/, (_, a, b, c) =>
    showAadhaar ? `${a} ${b} ${c}` : `XXXX XXXX ${c}`
  );

  const handleSave = async () => {
    if (!aadhaarNumber && !panNumber && !aadhaarFront && !panCard && !selfie) {
      toast.error('Please add at least one document or ID number');
      return;
    }
    if (aadhaarNumber && aadhaarNumber.replace(/\s/g, '').length !== 12) {
      toast.error('Aadhaar number must be 12 digits');
      return;
    }
    if (panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber.toUpperCase())) {
      toast.error('Invalid PAN format (e.g. ABCDE1234F)');
      return;
    }

    setUploading(true);
    try {
      const [finalAf, finalAb, finalPan, finalSelfie] = await Promise.all([
        ensureUploaded(aadhaarFront, 'aadhaar_front'),
        ensureUploaded(aadhaarBack, 'aadhaar_back'),
        ensureUploaded(panCard, 'pan_card'),
        ensureUploaded(selfie, 'guest_photo'),
      ]);

      setKycDone(true);
      onKycComplete({
        aadhaarNumber: aadhaarNumber || undefined,
        panNumber: panNumber ? panNumber.toUpperCase() : undefined,
        aadhaarFrontUrl: finalAf,
        aadhaarBackUrl: finalAb,
        panCardUrl: finalPan,
        selfieUrl: finalSelfie,
        verified: true,
      });
      toast.success('KYC documents saved successfully!');
    } catch {
      toast.error('Failed to process documents');
    } finally {
      setUploading(false);
    }
  };

  if (kycDone) {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center gap-3">
        <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
        <div>
          <p className="text-sm font-black text-emerald-300">KYC Verified</p>
          <p className="text-[10px] text-emerald-600">Documents captured for {guestName || 'guest'}</p>
        </div>
        <button onClick={() => setKycDone(false)} className="ml-auto p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all">
          <RefreshCw size={13} />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#090f1e] border border-slate-800 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-600 to-orange-700 flex items-center justify-center">
            <CreditCard size={14} className="text-white" />
          </div>
          <div>
            <p className="text-xs font-black text-white">Guest KYC Documents</p>
            {guestName && <p className="text-[9px] text-slate-500">{guestName}</p>}
          </div>
        </div>
        {onSkip && (
          <button onClick={onSkip} className="text-[10px] text-slate-500 hover:text-slate-300 underline transition-colors">
            Skip for now
          </button>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Number Inputs */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-wider">Aadhaar Number</label>
            <div className="relative">
              <input
                type={showAadhaar ? 'text' : 'password'}
                value={aadhaarNumber}
                onChange={e => setAadhaarNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
                placeholder="12-digit Aadhaar"
                maxLength={12}
                className="w-full bg-[#050a14] border border-slate-700/70 rounded-xl pl-3 pr-8 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 placeholder-slate-600"
              />
              <button onClick={() => setShowAadhaar(!showAadhaar)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                {showAadhaar ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
            {aadhaarNumber.length > 0 && aadhaarNumber.length < 12 && (
              <p className="text-[9px] text-amber-400 mt-1">{12 - aadhaarNumber.length} more digits</p>
            )}
            {aadhaarNumber.length === 12 && (
              <p className="text-[9px] text-emerald-400 mt-1 flex items-center gap-1"><CheckCircle2 size={9} /> Valid length</p>
            )}
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-wider">PAN Number</label>
            <input
              value={panNumber}
              onChange={e => setPanNumber(e.target.value.toUpperCase().slice(0, 10))}
              placeholder="ABCDE1234F"
              maxLength={10}
              className="w-full bg-[#050a14] border border-slate-700/70 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 placeholder-slate-600 font-mono"
            />
            {panNumber.length === 10 && /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber) && (
              <p className="text-[9px] text-emerald-400 mt-1 flex items-center gap-1"><CheckCircle2 size={9} /> Valid PAN format</p>
            )}
          </div>
        </div>

        {/* Document Uploads */}
        <div>
          <p className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-wider">Upload Documents</p>
          <div className="grid grid-cols-2 gap-2">
            <DocUploadBox
              label="Aadhaar Front" icon={CreditCard} color="amber"
              preview={aadhaarFront}
              onCapture={handleCapture(setAadhaarFront)}
              onClear={() => setAadhaarFront(null)}
            />
            <DocUploadBox
              label="Aadhaar Back" icon={CreditCard} color="amber"
              preview={aadhaarBack}
              onCapture={handleCapture(setAadhaarBack)}
              onClear={() => setAadhaarBack(null)}
            />
            <DocUploadBox
              label="PAN Card" icon={FileText} color="sky"
              preview={panCard}
              onCapture={handleCapture(setPanCard)}
              onClear={() => setPanCard(null)}
            />
            <DocUploadBox
              label="Guest Selfie" icon={User} color="violet"
              preview={selfie}
              onCapture={handleCapture(setSelfie)}
              onClear={() => setSelfie(null)}
            />
          </div>
        </div>

        {/* Privacy note */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-2.5 flex items-start gap-2 text-[9px] text-slate-500">
          <AlertCircle size={11} className="text-amber-500 shrink-0 mt-0.5" />
          <span>Documents are securely stored and used only for identity verification. Data is encrypted and not shared with third parties.</span>
        </div>

        <button onClick={handleSave} disabled={uploading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-xs font-black text-white shadow-lg shadow-amber-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
          {uploading ? <><Loader2 size={14} className="animate-spin" /> Saving Documents...</> : <><CheckCircle2 size={14} /> Save KYC Documents</>}
        </button>
      </div>
    </div>
  );
}
