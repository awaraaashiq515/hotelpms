'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  ShieldAlert, 
  Check, 
  X, 
  Clock, 
  User 
} from 'lucide-react';

const ADMIN_ROLES = ['HOTEL_ADMIN', 'SUPER_ADMIN', 'ADMIN', 'HOTEL_MANAGER', 'RESTAURANTS_ADMIN'];

export const AdminDiscountApprovalFloatingAlert: React.FC = () => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const prevCountRef = useRef(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if current logged-in user is an authorized Hotel Admin or Manager
  useEffect(() => {
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          const role = data.user.role || data.user.roleName || '';
          if (ADMIN_ROLES.includes(role)) {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
        } else {
          setIsAdmin(false);
        }
      })
      .catch(() => setIsAdmin(false));
  }, []);

  // Play audio chime when new discount request arrives
  const playAlertSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      if (ctx.state === 'suspended') ctx.resume();

      // Dual-tone Ding-Dong Bell
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'triangle';
      osc2.type = 'sine';

      // First Ding (880 Hz - A5)
      osc1.frequency.setValueAtTime(880, ctx.currentTime);
      osc2.frequency.setValueAtTime(880, ctx.currentTime);

      // Second Dong (1318.51 Hz - E6)
      osc1.frequency.setValueAtTime(1318.51, ctx.currentTime + 0.15);
      osc2.frequency.setValueAtTime(1318.51, ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(ctx.currentTime);
      osc2.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.8);
      osc2.stop(ctx.currentTime + 0.8);
    } catch (_) {}
  };

  const fetchPending = async () => {
    try {
      const res = await fetch('/api/discounts/approval?status=PENDING&limit=10');
      const data = await res.json();
      if (data.success && data.data?.approvals) {
        const list = data.data.approvals;
        if (list.length > prevCountRef.current) {
          playAlertSound();
          setIsExpanded(true); // Auto-expand when a new request arrives!
        }
        prevCountRef.current = list.length;
        setPendingApprovals(list);
      }
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    fetchPending();
    const interval = setInterval(fetchPending, 3500);
    return () => clearInterval(interval);
  }, [isAdmin]);

  const handleAction = async (id: string, action: 'APPROVE' | 'REJECT') => {
    setActionLoadingId(id);
    try {
      const res = await fetch('/api/discounts/approval', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      const data = await res.json();
      if (data.success) {
        setPendingApprovals((prev) => prev.filter((item) => item.id !== id));
        prevCountRef.current = Math.max(0, prevCountRef.current - 1);
      }
    } catch (err) {
      console.error('Error updating discount approval:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  if (!mounted || !isAdmin || pendingApprovals.length === 0) {
    return null;
  }

  const latest = pendingApprovals[0];

  return createPortal(
    <div className="fixed top-16 right-4 z-[9999] max-w-sm w-full animate-in slide-in-from-top-3 duration-300">
      <div className="bg-slate-900/95 border-2 border-amber-500/70 rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden text-slate-100">
        
        {/* Banner Bar */}
        <div 
          onClick={() => setIsExpanded(!isExpanded)}
          className="bg-gradient-to-r from-amber-600 to-amber-700 px-4 py-2.5 flex items-center justify-between cursor-pointer select-none"
        >
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-slate-950 flex items-center gap-1.5">
              <ShieldAlert size={15} /> Extra Discount Request ({pendingApprovals.length})
            </span>
          </div>
          <span className="text-[11px] font-bold text-slate-900 bg-amber-400/60 px-2 py-0.5 rounded-full">
            {isExpanded ? 'Hide' : 'Review'}
          </span>
        </div>

        {/* Expanded View */}
        {isExpanded && (
          <div className="p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                  {latest.referenceTitle || 'Order / Booking'}
                </span>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                  <User size={12} className="text-slate-500" /> By: <strong className="text-slate-200">{latest.requestedByName}</strong>
                </p>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-400 font-semibold block">Bill Subtotal</span>
                <span className="font-mono text-xs font-bold text-slate-200">
                  ₹{latest.billAmount?.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Discount Callout Box */}
            <div className="bg-slate-950 border border-amber-500/30 rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-rose-400 font-bold block">
                  Requested Discount:
                </span>
                <span className="text-base font-black font-mono text-rose-400">
                  -₹{latest.discountAmount?.toLocaleString('en-IN')}
                  <span className="text-xs font-normal text-slate-400 ml-1">
                    ({latest.discountType === 'PERCENTAGE' ? `${latest.discountValue}%` : 'Flat'})
                  </span>
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-400 font-bold block">Final Bill</span>
                <span className="text-sm font-black font-mono text-emerald-400">
                  ₹{latest.finalAmount?.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Reason */}
            {latest.reason && (
              <p className="text-xs text-slate-300 bg-slate-950/60 border border-slate-800 rounded-lg p-2 italic">
                &ldquo;{latest.reason}&rdquo;
              </p>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => handleAction(latest.id, 'REJECT')}
                disabled={actionLoadingId === latest.id}
                className="py-2 rounded-xl bg-slate-800 hover:bg-rose-950/80 text-rose-400 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 text-xs font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
              >
                <X size={14} /> Reject
              </button>
              <button
                onClick={() => handleAction(latest.id, 'APPROVE')}
                disabled={actionLoadingId === latest.id}
                className="py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                {actionLoadingId === latest.id ? (
                  <Clock size={14} className="animate-spin" />
                ) : (
                  <>
                    <Check size={14} strokeWidth={3} /> Approve Discount
                  </>
                )}
              </button>
            </div>

            {pendingApprovals.length > 1 && (
              <div className="text-[11px] text-center text-slate-400 pt-1 font-semibold">
                +{pendingApprovals.length - 1} more pending requests
              </div>
            )}
          </div>
        )}

      </div>
    </div>,
    document.body
  );
};
