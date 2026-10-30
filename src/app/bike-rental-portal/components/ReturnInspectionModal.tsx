'use client';

import React, { useState } from 'react';
import { CheckCircle2, X, Fuel, ShieldCheck, AlertTriangle, IndianRupee, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { BookingItem } from './types';

interface ReturnInspectionModalProps {
  booking: BookingItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ReturnInspectionModal: React.FC<ReturnInspectionModalProps> = ({
  booking,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [fuelStatus, setFuelStatus] = useState<'OK' | 'LOW'>('OK');
  const [damageStatus, setDamageStatus] = useState<'NONE' | 'SCRATCH' | 'MAJOR'>('NONE');
  const [fuelDeduction, setFuelDeduction] = useState('0');
  const [damageDeduction, setDamageDeduction] = useState('0');
  const [lateDeduction, setLateDeduction] = useState('0');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !booking) return null;

  const totalDeductions =
    (Number(fuelDeduction) || 0) +
    (Number(damageDeduction) || 0) +
    (Number(lateDeduction) || 0);

  const initialDeposit = Number(booking.securityDeposit) || 0;
  const netRefund = Math.max(0, initialDeposit - totalDeductions);

  const handleConfirmReturn = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/bike-rentals/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: booking.id,
          status: 'RETURNED',
          depositRefunded: true,
          notes: `${booking.notes || ''} | [Returned on ${new Date().toLocaleDateString('en-IN')}: Fuel=${fuelStatus}, Damage=${damageStatus}, Deductions=₹${totalDeductions}, NetRefund=₹${netRefund}]`,
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success(
          `Bike returned successfully! Net security deposit refunded: ₹${netRefund.toLocaleString('en-IN')}`
        );
        onSuccess();
        onClose();
      } else {
        toast.error(json.message || 'Error processing return');
      }
    } catch {
      toast.error('Network error during vehicle return check-in.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0b1120] border border-slate-700/80 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Sticky Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4 bg-[#0b1120] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-white">Vehicle Return & Deposit Refund</h2>
              <p className="text-[11px] text-slate-400">
                {booking.bike?.model} ({booking.bike?.plateNumber}) • {booking.guestName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 space-y-4 text-xs overflow-y-auto flex-1 scrollbar-none">
          {/* 1. Fuel Check */}
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider">
              1. Fuel / Battery Level Inspection
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setFuelStatus('OK');
                  setFuelDeduction('0');
                }}
                className={`py-2 px-3 rounded-xl border font-bold transition-all text-left flex items-center justify-between cursor-pointer ${
                  fuelStatus === 'OK'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <span>Same Level / Full (OK)</span>
                {fuelStatus === 'OK' && <CheckCircle2 size={13} />}
              </button>

              <button
                type="button"
                onClick={() => {
                  setFuelStatus('LOW');
                  if (fuelDeduction === '0') setFuelDeduction('200');
                }}
                className={`py-2 px-3 rounded-xl border font-bold transition-all text-left flex items-center justify-between cursor-pointer ${
                  fuelStatus === 'LOW'
                    ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <span>Low Fuel (Penalty)</span>
                {fuelStatus === 'LOW' && <AlertTriangle size={13} />}
              </button>
            </div>

            {fuelStatus === 'LOW' && (
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs text-slate-400">Fuel Refill Deduction:</span>
                <span className="text-xs text-rose-400 font-bold">₹</span>
                <input
                  type="number"
                  value={fuelDeduction}
                  onChange={(e) => setFuelDeduction(e.target.value)}
                  className="w-24 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>
            )}
          </div>

          {/* 2. Physical Inspection */}
          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider">
              2. Body Condition & Damage Check
            </label>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {(['NONE', 'SCRATCH', 'MAJOR'] as const).map((dm) => (
                <button
                  key={dm}
                  type="button"
                  onClick={() => {
                    setDamageStatus(dm);
                    if (dm === 'NONE') setDamageDeduction('0');
                    else if (dm === 'SCRATCH' && damageDeduction === '0') setDamageDeduction('300');
                    else if (dm === 'MAJOR' && damageDeduction === '0') setDamageDeduction('1000');
                  }}
                  className={`py-2 px-2 rounded-xl border font-bold transition-all text-center cursor-pointer ${
                    damageStatus === dm
                      ? dm === 'NONE'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  {dm === 'NONE' ? 'No Damage' : dm === 'SCRATCH' ? 'Scratch' : 'Major Damage'}
                </button>
              ))}
            </div>

            {damageStatus !== 'NONE' && (
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs text-slate-400">Damage Repair Deduction:</span>
                <span className="text-xs text-amber-400 font-bold">₹</span>
                <input
                  type="number"
                  value={damageDeduction}
                  onChange={(e) => setDamageDeduction(e.target.value)}
                  className="w-24 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            )}
          </div>

          {/* 3. Deposit Refund Calculation Box */}
          <div className="p-4 rounded-2xl bg-[#060a14] border border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Security Deposit Retained:</span>
              <span className="font-bold text-white">₹{initialDeposit.toLocaleString('en-IN')}</span>
            </div>

            {totalDeductions > 0 && (
              <div className="flex justify-between text-rose-400">
                <span>Total Deductions (Fuel / Damage / Fine):</span>
                <span className="font-bold">-₹{totalDeductions.toLocaleString('en-IN')}</span>
              </div>
            )}

            <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline">
              <span className="font-black text-slate-200">Net Refund to Customer:</span>
              <span className="text-xl font-black text-emerald-400">₹{netRefund.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Sticky Bottom Actions */}
          <div className="pt-2 sticky bottom-0 bg-[#0b1120] pb-1">
            <div className="flex items-center gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReturn}
                disabled={submitting}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 font-black text-white transition-all shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                <span>Complete Return</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
