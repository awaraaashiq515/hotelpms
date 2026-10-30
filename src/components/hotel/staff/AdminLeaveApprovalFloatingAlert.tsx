'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { 
  Calendar, 
  Check, 
  X, 
  User, 
  ChevronRight, 
  ChevronUp,
  Minus
} from 'lucide-react';
import { toast } from 'sonner';

const ADMIN_ROLES = [
  'HOTEL_ADMIN', 
  'SUPER_ADMIN', 
  'ADMIN', 
  'HOTEL_MANAGER', 
  'HOTEL_RECEPTIONIST', 
  'RECEPTIONIST', 
  'RESTAURANTS_ADMIN', 
  'OWNER', 
  'MANAGER'
];

interface PendingLeave {
  id: string;
  leaveType: string;
  fromDate: string;
  toDate: string;
  days: number;
  reason?: string | null;
  status: string;
  appliedOn: string;
  staff?: {
    id: string;
    name: string;
    designation?: string | null;
  } | null;
}

export const AdminLeaveApprovalFloatingAlert: React.FC = () => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [pendingLeaves, setPendingLeaves] = useState<PendingLeave[]>([]);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const prevCountRef = useRef(0);
  const isFirstLoadRef = useRef(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Check user role
  useEffect(() => {
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          const role = (data.user.role || data.user.roleName || '').toUpperCase();
          if (ADMIN_ROLES.some(r => role.includes(r))) {
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

  // Play pleasant chime on new leave request arrival
  const playAlertSound = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.7);
    } catch {
      // Audio not supported
    }
  }, []);

  const fetchPending = useCallback(async () => {
    try {
      const res = await fetch('/api/leave-requests?status=PENDING');
      if (!res.ok) return;
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const list = json.data;
        if (!isFirstLoadRef.current && list.length > prevCountRef.current) {
          playAlertSound();
          setIsExpanded(true); // Auto expand when new leave request comes in
          setIsDismissed(false);
        }
        prevCountRef.current = list.length;
        isFirstLoadRef.current = false;
        setPendingLeaves(list);
      }
    } catch {
      // Ignore network errors
    }
  }, [playAlertSound]);

  useEffect(() => {
    if (isAdmin !== true) return;
    fetchPending();
    const interval = setInterval(fetchPending, 12000);
    return () => clearInterval(interval);
  }, [isAdmin, fetchPending]);

  const handleAction = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/leave-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Leave request ${status.toLowerCase()} successfully`);
        setPendingLeaves(prev => prev.filter(l => l.id !== id));
      } else {
        toast.error(data.error || `Failed to ${status.toLowerCase()} leave`);
      }
    } catch {
      toast.error('Network error. Could not update leave.');
    } finally {
      setActionLoadingId(null);
    }
  };

  if (!mounted || !isAdmin || pendingLeaves.length === 0 || isDismissed) return null;

  return createPortal(
    <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-[99999] max-w-sm w-[calc(100vw-2.5rem)] sm:w-full transition-all duration-300 pointer-events-auto">
      <div className="rounded-2xl bg-[#0b1329]/95 border border-purple-500/50 shadow-[0_12px_45px_rgba(168,85,247,0.25)] backdrop-blur-2xl overflow-hidden ring-1 ring-purple-500/30">
        
        {/* Header Strip */}
        <div 
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-4 py-3 bg-gradient-to-r from-purple-950/80 via-indigo-950/70 to-slate-900/90 flex items-center justify-between cursor-pointer border-b border-purple-500/30 hover:brightness-110 transition-all select-none"
        >
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-purple-500/25 text-purple-300 border border-purple-500/40">
              <Calendar size={15} />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-500"></span>
              </span>
            </div>
            <div>
              <div className="text-xs font-black text-white flex items-center gap-1.5">
                <span>Leave Approval Required</span>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-purple-500 text-white shadow-sm">
                  {pendingLeaves.length}
                </span>
              </div>
              <p className="text-[10px] text-purple-300/80 font-medium">
                {pendingLeaves.length === 1 ? '1 staff request waiting' : `${pendingLeaves.length} staff requests waiting`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-purple-300">
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
              className="p-1 rounded-lg hover:bg-purple-500/20 text-purple-300 transition-colors"
              title={isExpanded ? 'Minimize' : 'Expand'}
            >
              {isExpanded ? <Minus size={15} /> : <ChevronUp size={16} />}
            </button>
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); setIsDismissed(true); }}
              className="p-1 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition-colors"
              title="Close for now"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Collapsible Content */}
        {isExpanded && (
          <div className="p-3 max-h-[65vh] overflow-y-auto no-scrollbar space-y-2.5 divide-y divide-slate-800/60">
            {pendingLeaves.map((l) => {
              const staffName = l.staff?.name || 'Staff Member';
              const designation = l.staff?.designation || 'Staff';
              const fromStr = new Date(l.fromDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
              const toStr = new Date(l.toDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
              const isLoading = actionLoadingId === l.id;

              return (
                <div key={l.id} className="pt-2.5 first:pt-0 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <User size={12} className="text-purple-400" />
                        <span className="capitalize">{staffName}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          {designation}
                        </span>
                      </div>
                      <div className="text-[11px] font-semibold text-slate-300 mt-1 flex items-center gap-1.5 flex-wrap">
                        <span className="px-1.5 py-0.5 rounded bg-purple-500/20 border border-purple-500/40 text-purple-300 text-[9.5px] font-black uppercase">
                          {l.leaveType}
                        </span>
                        <span className="text-slate-200">{fromStr} → {toStr}</span>
                        <span className="text-purple-300/80 font-bold">({l.days} {l.days === 1 ? 'day' : 'days'})</span>
                      </div>
                    </div>
                  </div>

                  {l.reason && (
                    <div className="text-[11px] text-slate-300 bg-slate-900/80 border border-slate-800/80 rounded-xl p-2.5 italic leading-relaxed">
                      &ldquo;{l.reason}&rdquo;
                    </div>
                  )}

                  {/* Approve / Reject Actions */}
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => handleAction(l.id, 'REJECTED')}
                      disabled={isLoading}
                      className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-[11px] font-bold flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                    >
                      <X size={12} />
                      <span>Reject</span>
                    </button>
                    <button
                      onClick={() => handleAction(l.id, 'APPROVED')}
                      disabled={isLoading}
                      className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-[11px] font-black flex items-center gap-1.5 shadow-md shadow-emerald-900/40 transition-all active:scale-95 disabled:opacity-50"
                    >
                      <Check size={13} strokeWidth={3} />
                      <span>{isLoading ? 'Processing…' : 'Approve'}</span>
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Bottom link to HR */}
            <div className="pt-2 text-center">
              <Link
                href="/hotel/hr"
                className="inline-flex items-center gap-1 text-[10px] font-black text-purple-400 hover:text-purple-300 transition-colors uppercase tracking-wider"
              >
                <span>Open HR Leave Management</span>
                <ChevronRight size={12} />
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>,
    document.body
  );
};

