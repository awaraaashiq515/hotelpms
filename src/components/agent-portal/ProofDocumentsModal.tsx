'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  CreditCard,
  FileText,
  Upload,
  Download,
  Eye,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Loader2,
  ZoomIn,
  ShieldCheck,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';

export interface ProofDoc {
  label: string;
  url: string;
  type?: string;
}

export interface ProofData {
  aadhaarNumber?: string;
  panNumber?: string;
  docs: ProofDoc[];
}

export function parseKycFromNotes(notes?: string | null): ProofData {
  const result: ProofData = { docs: [] };
  if (!notes) return result;

  const match = notes.match(/\[KYC VERIFIED:\s*([^\]]+)\]/);
  const kycText = match ? match[1] : notes;

  const parts = kycText.split('|').map((p) => p.trim());
  parts.forEach((part) => {
    if (part.startsWith('Aadhaar:')) {
      result.aadhaarNumber = part.replace('Aadhaar:', '').trim();
    } else if (part.startsWith('PAN:')) {
      result.panNumber = part.replace('PAN:', '').trim();
    } else if (part.startsWith('AadhaarFront:')) {
      const url = part.replace('AadhaarFront:', '').trim();
      if (url) result.docs.push({ label: 'Aadhaar Card (Front)', url, type: 'aadhaarFront' });
    } else if (part.startsWith('AadhaarBack:')) {
      const url = part.replace('AadhaarBack:', '').trim();
      if (url) result.docs.push({ label: 'Aadhaar Card (Back)', url, type: 'aadhaarBack' });
    } else if (part.startsWith('PanDoc:')) {
      const url = part.replace('PanDoc:', '').trim();
      if (url) result.docs.push({ label: 'PAN Card', url, type: 'pan' });
    } else if (part.startsWith('Selfie:')) {
      const url = part.replace('Selfie:', '').trim();
      if (url) result.docs.push({ label: 'Customer Photo / Selfie', url, type: 'selfie' });
    } else if (part.startsWith('ProofDoc:') || part.startsWith('Doc:')) {
      const url = part.replace(/^(ProofDoc:|Doc:)/, '').trim();
      if (url) result.docs.push({ label: 'Customer ID Proof Document', url, type: 'other' });
    }
  });

  // Fallback: search for standalone /api/images/ links in notes
  const urlMatches = notes.match(/(\/api\/images\/[^\s\)\|]+|https?:\/\/[^\s\)\|]+\.(png|jpg|jpeg|webp|pdf))/gi);
  if (urlMatches) {
    urlMatches.forEach((url) => {
      if (!result.docs.some((d) => d.url === url)) {
        result.docs.push({ label: `Attached Document`, url, type: 'other' });
      }
    });
  }

  return result;
}

export function buildNotesWithKyc(
  originalNotes: string | null | undefined,
  kyc: {
    aadhaarNumber?: string;
    panNumber?: string;
    aadhaarFrontUrl?: string;
    aadhaarBackUrl?: string;
    panCardUrl?: string;
    selfieUrl?: string;
    extraDocs?: string[];
  }
): string {
  const cleanNotes = (originalNotes || '').replace(/\s*\[KYC VERIFIED:[^\]]+\]\s*/g, '').trim();

  const items = [
    kyc.aadhaarNumber ? `Aadhaar: ${kyc.aadhaarNumber}` : '',
    kyc.panNumber ? `PAN: ${kyc.panNumber}` : '',
    kyc.aadhaarFrontUrl ? `AadhaarFront: ${kyc.aadhaarFrontUrl}` : '',
    kyc.aadhaarBackUrl ? `AadhaarBack: ${kyc.aadhaarBackUrl}` : '',
    kyc.panCardUrl ? `PanDoc: ${kyc.panCardUrl}` : '',
    kyc.selfieUrl ? `Selfie: ${kyc.selfieUrl}` : '',
    ...(kyc.extraDocs || []).map((url) => `ProofDoc: ${url}`),
  ].filter(Boolean);

  if (items.length === 0) return cleanNotes;
  const kycBlock = `[KYC VERIFIED: ${items.join(' | ')}]`;
  return cleanNotes ? `${cleanNotes}\n${kycBlock}` : kycBlock;
}

interface ProofDocumentsModalProps {
  bookingId: string;
  guestName: string;
  notes?: string | null;
  canUpload?: boolean;
  onClose: () => void;
  onUpdated?: (updatedNotes: string) => void;
}

export default function ProofDocumentsModal({
  bookingId,
  guestName,
  notes,
  canUpload = true,
  onClose,
  onUpdated,
}: ProofDocumentsModalProps) {
  const [currentNotes, setCurrentNotes] = useState(notes || '');
  const [activePreview, setActivePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const proofData = parseKycFromNotes(currentNotes);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/agent-portal/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (!data.success || !data.url) {
        toast.error('Failed to upload proof document');
        return;
      }

      const uploadedUrl = data.url;

      // Append new proof doc to booking notes
      const existingExtra = proofData.docs.map((d) => d.url);
      const newExtra = [...existingExtra, uploadedUrl];

      const newNotes = buildNotesWithKyc(currentNotes, {
        aadhaarNumber: proofData.aadhaarNumber,
        panNumber: proofData.panNumber,
        extraDocs: newExtra,
      });

      // Update booking via PATCH and set status to PENDING for hotel approval
      const patchRes = await fetch('/api/hotel/agent-bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: bookingId,
          notes: newNotes,
          isAgentEdit: true,
          requireApproval: true,
        }),
      });

      const patchData = await patchRes.json();
      if (patchData.success) {
        setCurrentNotes(newNotes);
        toast.success('Customer proof image uploaded! Sent for hotel approval.');
        if (onUpdated) onUpdated(newNotes);
      } else {
        toast.error(patchData.message || 'Failed to update booking notes.');
      }
    } catch (err) {
      toast.error('Network error uploading proof document.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-[#090f1e] border border-violet-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600/30 to-indigo-600/30 border border-violet-500/30 flex items-center justify-center text-violet-300">
              <CreditCard size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Customer ID Proof & Documents</h3>
              <p className="text-xs text-slate-400 font-medium">{guestName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Notice Banner */}
        <div className="px-6 py-2.5 bg-violet-950/30 border-b border-violet-500/20 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-violet-300">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span className="font-semibold">KYC Verification for Hotel Front Office Check-In</span>
          </div>
          {proofData.docs.length > 0 && (
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {proofData.docs.length} Document{proofData.docs.length === 1 ? '' : 's'}
            </span>
          )}
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Numbers Info */}
          {(proofData.aadhaarNumber || proofData.panNumber) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {proofData.aadhaarNumber && (
                <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Aadhaar Number</p>
                    <p className="text-xs font-mono font-black text-white mt-0.5">
                      XXXX XXXX {proofData.aadhaarNumber.slice(-4)}
                    </p>
                  </div>
                  <CheckCircle2 size={16} className="text-emerald-400" />
                </div>
              )}
              {proofData.panNumber && (
                <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">PAN Number</p>
                    <p className="text-xs font-mono font-black text-amber-300 mt-0.5">
                      {proofData.panNumber}
                    </p>
                  </div>
                  <CheckCircle2 size={16} className="text-emerald-400" />
                </div>
              )}
            </div>
          )}

          {/* Document Images Gallery */}
          {proofData.docs.length > 0 ? (
            <div className="space-y-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Uploaded Images</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {proofData.docs.map((doc, idx) => (
                  <div
                    key={idx}
                    className="relative group rounded-2xl overflow-hidden border border-slate-800 bg-slate-900/60 p-2.5 flex flex-col justify-between hover:border-violet-500/40 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-slate-200 truncate">{doc.label}</span>
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                        title="Open image in new tab"
                      >
                        <ExternalLink size={12} />
                      </a>
                    </div>

                    {/* Image Preview Container */}
                    <div
                      onClick={() => setActivePreview(doc.url)}
                      className="relative h-44 rounded-xl overflow-hidden bg-black/40 border border-slate-800 cursor-pointer flex items-center justify-center group-hover:scale-[1.01] transition-transform"
                    >
                      <img
                        src={doc.url}
                        alt={doc.label}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <span className="px-3 py-1.5 rounded-xl bg-violet-600/90 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg">
                          <ZoomIn size={14} /> Full View
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-10 text-center border-2 border-dashed border-slate-800 rounded-3xl space-y-2">
              <FileText size={36} className="mx-auto text-slate-700" />
              <p className="text-sm font-black text-slate-300">No Proof Documents Attached</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Customer ID proof (Aadhaar, PAN, Passport, Driving License) has not been uploaded for this booking yet.
              </p>
            </div>
          )}

          {/* Upload New Document Section */}
          {canUpload && (
            <div className="pt-2 border-t border-slate-800/80">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                capture="environment"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-violet-600/20 to-indigo-600/20 hover:from-violet-600/30 hover:to-indigo-600/30 border border-violet-500/30 text-violet-300 hover:text-white font-black text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
              >
                {uploading ? (
                  <>
                    <Loader2 size={15} className="animate-spin text-violet-400" />
                    <span>Uploading Customer Document & Updating Booking...</span>
                  </>
                ) : (
                  <>
                    <Upload size={15} />
                    <span>Upload Customer Proof Image (Camera / Gallery)</span>
                  </>
                )}
              </button>
              <p className="text-[10px] text-slate-500 text-center mt-1.5">
                Note: Uploading a new proof image will send the booking for Hotel Front Desk verification.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Full-Screen Lightbox Preview */}
      {activePreview && (
        <div
          className="fixed inset-0 z-[60] bg-black/95 flex flex-col items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setActivePreview(null)}
        >
          <div className="absolute top-4 right-4 flex items-center gap-3">
            <a
              href={activePreview}
              download="customer-id-proof"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <Download size={13} /> Download
            </a>
            <button
              onClick={() => setActivePreview(null)}
              className="w-9 h-9 rounded-xl bg-slate-800 text-white flex items-center justify-center hover:bg-slate-700 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
          <img
            src={activePreview}
            alt="Customer Proof"
            className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

