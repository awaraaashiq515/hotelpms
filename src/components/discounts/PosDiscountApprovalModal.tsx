'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Percent, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  KeyRound, 
  Send, 
  X,
  AlertTriangle,
  Sparkles,
  Lock
} from 'lucide-react';

interface PosDiscountApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  billAmount: number;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  discountAmount: number;
  maxAllowedPercent: number;
  maxAllowedAmount: number;
  orderId?: string;
  referenceTitle?: string; // e.g. "Table 4" or "Takeaway #102"
  propertyCode?: string;
  source?: 'RESTAURANT_POS' | 'HOTEL_BOOKING' | 'HOTEL_FOLIO' | 'ROOM_SERVICE';
  onApproved: (approval: { id: string; discountAmount: number; discountValue: number; discountType: string }) => void;
}

export const PosDiscountApprovalModal: React.FC<PosDiscountApprovalModalProps> = ({
  isOpen,
  onClose,
  billAmount,
  discountType,
  discountValue,
  discountAmount,
  maxAllowedPercent,
  maxAllowedAmount,
  orderId,
  referenceTitle = 'Current Order',
  propertyCode,
  source = 'RESTAURANT_POS',
  onApproved,
}) => {
  const [selectedReason, setSelectedReason] = useState('VIP Guest / Regular Customer');
  const [customReason, setCustomReason] = useState('');
  const [mode, setMode] = useState<'REQUEST' | 'PIN'>('REQUEST');
  const [managerPin, setManagerPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Pending request state
  const [pendingApprovalId, setPendingApprovalId] = useState<string | null>(null);
  const [approvalStatus, setApprovalStatus] = useState<'IDLE' | 'WAITING' | 'APPROVED' | 'REJECTED'>('IDLE');
  
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Play audio chime on status change
  const playSound = (type: 'success' | 'alert') => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      if (ctx.state === 'suspended') ctx.resume();

      if (type === 'success') {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc2.frequency.setValueAtTime(880.0, ctx.currentTime + 0.1); // A5
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        osc1.start(ctx.currentTime);
        osc1.stop(ctx.currentTime + 0.15);
        osc2.start(ctx.currentTime + 0.1);
        osc2.stop(ctx.currentTime + 0.6);
      } else {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch (_) {}
  };

  // Poll for approval status when waiting
  useEffect(() => {
    if (!pendingApprovalId || approvalStatus !== 'WAITING') {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      return;
    }

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/discounts/approval?id=${pendingApprovalId}`);
        const data = await res.json();
        if (data.success && data.data) {
          const status = data.data.status;
          if (status === 'APPROVED') {
            setApprovalStatus('APPROVED');
            playSound('success');
            if (pollTimerRef.current) clearInterval(pollTimerRef.current);
            setTimeout(() => {
              onApproved({
                id: data.data.id,
                discountAmount: data.data.discountAmount,
                discountValue: data.data.discountValue,
                discountType: data.data.discountType,
              });
              onClose();
            }, 1200);
          } else if (status === 'REJECTED') {
            setApprovalStatus('REJECTED');
            playSound('alert');
            setErrorMessage(data.data.rejectionReason || 'Discount request was rejected by Admin.');
            if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          }
        }
      } catch (err) {
        console.error('Error polling approval status:', err);
      }
    };

    pollTimerRef.current = setInterval(checkStatus, 2500);
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [pendingApprovalId, approvalStatus, onApproved, onClose]);

  // Send request to Admin
  const handleSendRequest = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const reasonText = customReason.trim() ? customReason.trim() : selectedReason;
      const res = await fetch('/api/discounts/approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyCode,
          orderId,
          source,
          referenceTitle,
          billAmount,
          discountType,
          discountValue,
          discountAmount,
          finalAmount: Math.max(0, billAmount - discountAmount),
          reason: reasonText,
        }),
      });

      const result = await res.json();
      if (!result.success) {
        throw new Error(result.message || 'Failed to submit discount request');
      }

      setPendingApprovalId(result.data.id);
      setApprovalStatus('WAITING');
    } catch (err: any) {
      setErrorMessage(err.message || 'Error sending request');
    } finally {
      setLoading(false);
    }
  };

  // Instant approval via Manager PIN
  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managerPin || managerPin.length < 3) {
      setErrorMessage('Please enter valid Manager PIN');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    try {
      const reasonText = customReason.trim() ? customReason.trim() : selectedReason;
      const res = await fetch('/api/discounts/approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyCode,
          orderId,
          source,
          referenceTitle,
          billAmount,
          discountType,
          discountValue,
          discountAmount,
          finalAmount: Math.max(0, billAmount - discountAmount),
          reason: reasonText,
          managerPin: managerPin.trim(),
        }),
      });

      const result = await res.json();
      if (!result.success) {
        throw new Error(result.message || 'Invalid Manager PIN');
      }

      setApprovalStatus('APPROVED');
      playSound('success');
      setTimeout(() => {
        onApproved({
          id: result.data.id,
          discountAmount: result.data.discountAmount,
          discountValue: result.data.discountValue,
          discountType: result.data.discountType,
        });
        onClose();
      }, 900);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to verify PIN');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const discountPercent = billAmount > 0 ? (discountAmount / billAmount) * 100 : 0;
  const finalPayable = Math.max(0, billAmount - discountAmount);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/60 border-b border-amber-500/20 px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <ShieldAlert size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black text-amber-300 uppercase tracking-wide">
                Admin Approval Required
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                Extra discount exceeds staff allowed limit
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          
          {/* Bill & Discount Summary Card */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
              <span>Bill Subtotal:</span>
              <span className="font-mono text-slate-200 font-bold">₹{billAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-semibold text-rose-400">
              <span className="flex items-center gap-1.5">
                <Percent size={13} /> Requested Discount:
              </span>
              <span className="font-mono font-black text-sm">
                -₹{discountAmount.toLocaleString('en-IN')} ({discountPercent.toFixed(1)}%)
              </span>
            </div>
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-bold">Final Amount Payable:</span>
              <span className="font-mono font-black text-base text-emerald-400">
                ₹{finalPayable.toLocaleString('en-IN')}
              </span>
            </div>

            {/* Threshold Warning Banner */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-2 flex items-start gap-2 text-[11px] text-amber-300">
              <AlertTriangle size={14} className="shrink-0 mt-0.5 text-amber-400" />
              <span>
                Standard staff limit is <strong>{maxAllowedPercent}%</strong> (or <strong>₹{maxAllowedAmount}</strong>). This discount requires authorization.
              </span>
            </div>
          </div>

          {/* WAITING STATE */}
          {approvalStatus === 'WAITING' && (
            <div className="bg-amber-950/30 border border-amber-500/40 rounded-xl p-6 text-center space-y-3 animate-in fade-in">
              <div className="relative w-14 h-14 mx-auto flex items-center justify-center">
                <span className="absolute inset-0 rounded-full border-2 border-amber-400/30 animate-ping" />
                <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-300 animate-spin">
                  <Clock size={22} />
                </div>
              </div>
              <div>
                <h4 className="text-sm font-black text-amber-300">Waiting for Admin Approval...</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Request sent to Admin dashboard. As soon as Admin taps <strong>Approve</strong>, your screen will automatically update.
                </p>
              </div>
              <div className="pt-2 flex justify-center gap-2">
                <button
                  onClick={() => setMode('PIN')}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 flex items-center gap-1.5 border border-slate-700"
                >
                  <KeyRound size={13} className="text-amber-400" /> Enter Manager PIN Instead
                </button>
              </div>
            </div>
          )}

          {/* APPROVED STATE */}
          {approvalStatus === 'APPROVED' && (
            <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-6 text-center space-y-2 animate-in zoom-in-95">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-400">
                <CheckCircle2 size={28} />
              </div>
              <h4 className="text-base font-black text-emerald-300">Discount Approved!</h4>
              <p className="text-xs text-emerald-200/80">
                Authorized successfully. Applying discount to bill...
              </p>
            </div>
          )}

          {/* REJECTED STATE */}
          {approvalStatus === 'REJECTED' && (
            <div className="bg-rose-950/40 border border-rose-500/40 rounded-xl p-5 text-center space-y-2 animate-in zoom-in-95">
              <div className="w-10 h-10 mx-auto rounded-full bg-rose-500/20 border border-rose-400 flex items-center justify-center text-rose-400">
                <XCircle size={24} />
              </div>
              <h4 className="text-sm font-black text-rose-300">Request Rejected by Admin</h4>
              <p className="text-xs text-rose-200/80 font-medium">{errorMessage}</p>
              <button
                onClick={() => setApprovalStatus('IDLE')}
                className="mt-2 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200"
              >
                Try Different Amount / PIN
              </button>
            </div>
          )}

          {/* IDLE FORM: Choose between Online Request vs Instant Manager PIN */}
          {approvalStatus === 'IDLE' && (
            <>
              {/* Tabs: Online Request vs Manager PIN */}
              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => { setMode('REQUEST'); setErrorMessage(''); }}
                  className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    mode === 'REQUEST'
                      ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Send size={13} /> Request Admin
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('PIN'); setErrorMessage(''); }}
                  className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    mode === 'PIN'
                      ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <KeyRound size={13} /> Manager PIN
                </button>
              </div>

              {/* Mode 1: Send Request to Admin */}
              {mode === 'REQUEST' && (
                <div className="space-y-3 animate-in fade-in">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Select Discount Reason
                    </label>
                    <select
                      value={selectedReason}
                      onChange={(e) => setSelectedReason(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-medium focus:outline-none focus:border-amber-500"
                    >
                      <option value="VIP Guest / Regular Customer">VIP Guest / Regular Customer</option>
                      <option value="Food Delay / Service Complaint">Food Delay / Service Complaint</option>
                      <option value="Owner / Director Reference">Owner / Director Reference</option>
                      <option value="Birthday / Anniversary Celebration">Birthday / Anniversary Celebration</option>
                      <option value="Corporate / Bulk Order Discount">Corporate / Bulk Order Discount</option>
                      <option value="Special Courtesy Discount">Special Courtesy Discount</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Additional Note (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Table 4 guest requested by General Manager"
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {errorMessage && (
                    <div className="text-xs text-rose-400 font-medium bg-rose-500/10 border border-rose-500/20 rounded-lg p-2">
                      {errorMessage}
                    </div>
                  )}

                  <button
                    onClick={handleSendRequest}
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <Clock size={14} className="animate-spin" /> Submitting...
                      </span>
                    ) : (
                      <>
                        <Send size={14} /> Send Request to Admin 🔔
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Mode 2: Manager PIN Instant Override */}
              {mode === 'PIN' && (
                <form onSubmit={handleVerifyPin} className="space-y-3 animate-in fade-in">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Enter 4-Digit Manager PIN
                    </label>
                    <div className="relative">
                      <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="password"
                        maxLength={8}
                        autoFocus
                        placeholder="••••"
                        value={managerPin}
                        onChange={(e) => setManagerPin(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-center tracking-[0.3em] font-mono text-slate-100 font-bold focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 text-center">
                      Manager can authorize this extra discount instantly on this terminal.
                    </p>
                  </div>

                  {errorMessage && (
                    <div className="text-xs text-rose-400 font-medium bg-rose-500/10 border border-rose-500/20 rounded-lg p-2 text-center">
                      {errorMessage}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !managerPin}
                    className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <Clock size={14} className="animate-spin" /> Verifying...
                      </span>
                    ) : (
                      <>
                        <KeyRound size={14} /> Authorize Instantly ⚡
                      </>
                    )}
                  </button>
                </form>
              )}
            </>
          )}

        </div>

      </div>
    </div>
  );
};
