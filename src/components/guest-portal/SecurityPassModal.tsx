'use client';

import React, { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  ShieldCheck, X, CheckCircle2, BedDouble, Calendar, Users,
  Waves, Sparkles, Copy, Check, Download, AlertCircle, Clock, QrCode
} from 'lucide-react';
import { toast } from 'sonner';
import { Reservation } from './types';

interface SecurityPassModalProps {
  reservation: Reservation;
  guestName: string;
  guestPhone?: string;
  onClose: () => void;
}

export default function SecurityPassModal({
  reservation,
  guestName,
  guestPhone,
  onClose,
}: SecurityPassModalProps) {
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const room = reservation.rooms?.[0]?.room;
  const arrStr = new Date(reservation.arrivalDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const depStr = new Date(reservation.departureDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  // Verification URL encoded in QR Code
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const verifyUrl = `${origin}/security-portal/verify/${reservation.id}`;

  const isCheckedIn = reservation.status === 'CHECKED_IN';
  const isConfirmed = reservation.status === 'CONFIRMED';
  const isCheckedOut = reservation.status === 'CHECKED_OUT';
  const isCancelled = reservation.status === 'CANCELLED';

  const statusBadge = isCheckedIn
    ? {
        label: 'ACTIVE IN-HOUSE GUEST',
        color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        icon: <ShieldCheck size={14} className="text-emerald-400" />,
      }
    : isConfirmed
    ? {
        label: 'CONFIRMED RESERVATION',
        color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
        icon: <CheckCircle2 size={14} className="text-indigo-400" />,
      }
    : isCheckedOut
    ? {
        label: 'CHECKED OUT (EXPIRED)',
        color: 'bg-slate-800 text-slate-400 border-slate-700',
        icon: <Clock size={14} className="text-slate-400" />,
      }
    : {
        label: 'CANCELLED',
        color: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        icon: <AlertCircle size={14} className="text-rose-400" />,
      };

  const handleCopyLink = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(verifyUrl);
      setCopied(true);
      toast.success('Verification link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div
        ref={cardRef}
        className="w-full max-w-md bg-[#090d1a] border border-indigo-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl relative space-y-4 my-auto"
        style={{
          boxShadow: '0 0 50px rgba(99,102,241,0.18), 0 20px 40px rgba(0,0,0,0.8)',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all z-10"
        >
          <X size={16} />
        </button>

        {/* Top Header */}
        <div className="text-center space-y-1 pt-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-1">
            <ShieldCheck size={13} className="text-indigo-400" />
            Official Hotel Security Gate Pass
          </div>
          <h2 className="text-xl font-black text-white">
            {reservation.property?.name || 'Hotel Guest Pass'}
          </h2>
          <p className="text-[11px] text-slate-400">
            Present this digital QR pass to hotel security for gate & amenities entry
          </p>
        </div>

        {/* QR Code Card */}
        <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800 relative">
          <div className="p-3.5 bg-white rounded-2xl shadow-lg shadow-indigo-500/10">
            <QRCodeSVG
              value={verifyUrl}
              size={180}
              level="H"
              includeMargin={false}
              bgColor="#ffffff"
              fgColor="#0a0f1d"
            />
          </div>

          <div className="mt-3 text-center">
            <p className="text-xs font-black text-white tracking-widest uppercase">
              {reservation.bookingNo}
            </p>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
              Scan with Security Camera / Mobile
            </p>
          </div>

          {/* Status Badge */}
          <div className="mt-3">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase border ${statusBadge.color}`}
            >
              {statusBadge.icon}
              {statusBadge.label}
            </span>
          </div>
        </div>

        {/* Guest & Room Details Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">
              Primary Guest
            </p>
            <p className="font-bold text-white truncate mt-0.5">{guestName || 'Guest'}</p>
            {guestPhone && (
              <p className="text-[10px] text-slate-400 font-medium truncate">{guestPhone}</p>
            )}
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">
              Assigned Room
            </p>
            <p className="font-bold text-emerald-400 text-sm mt-0.5 flex items-center gap-1">
              <BedDouble size={14} />
              {room ? `Room ${room.roomNumber}` : 'Pending Check-In'}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <p className="text-[9px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <Calendar size={10} /> Stay Duration
            </p>
            <p className="font-bold text-slate-200 mt-0.5 text-[11px]">
              {arrStr} → {depStr}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <p className="text-[9px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <Users size={10} /> Party Size
            </p>
            <p className="font-bold text-slate-200 mt-0.5">
              {reservation.adults} Adult{reservation.adults > 1 ? 's' : ''}
              {reservation.children > 0 ? `, ${reservation.children} Child` : ''}
            </p>
          </div>
        </div>

        {/* Privileges / Amenities Access Badges */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {reservation.mealPlan && (
            <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1">
              🍽️ {reservation.mealPlan} Plan
            </span>
          )}
          {(reservation.poolAccess ||
            (reservation.poolPackage && reservation.poolPackage !== 'NONE')) && (
            <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 flex items-center gap-1">
              <Waves size={11} className="text-cyan-400" /> Pool Pass Active
            </span>
          )}
          {reservation.spaPackage && reservation.spaPackage !== 'NONE' && (
            <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-pink-500/10 text-pink-300 border border-pink-500/20 flex items-center gap-1">
              <Sparkles size={11} className="text-pink-400" /> Spa Package Active
            </span>
          )}
        </div>

        {/* Security instructions */}
        <div className="p-3 rounded-xl bg-indigo-950/20 border border-indigo-500/20 text-[11px] text-slate-300 space-y-1">
          <p className="font-bold text-indigo-300 flex items-center gap-1">
            <QrCode size={12} /> Security Guard Verification
          </p>
          <p className="text-slate-400 text-[10px] leading-relaxed">
            Hotel security guards at the gate or reception can scan this QR code with the hotel security scanner to immediately verify valid in-house guest status.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={handleCopyLink}
            className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            {copied ? 'Link Copied!' : 'Copy Verify URL'}
          </button>
          <button
            onClick={handlePrint}
            className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/20"
          >
            <Download size={14} /> Print / Save
          </button>
        </div>
      </div>
    </div>
  );
}
