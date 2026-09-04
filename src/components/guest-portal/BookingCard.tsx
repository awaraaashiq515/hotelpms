import React, { useState } from 'react';
import {
  BedDouble, CheckCircle2, ShieldCheck, Clock,
  AlertCircle, Wifi, X, Loader2, Waves, Sparkles, QrCode, Shield
} from 'lucide-react';
import { toast } from 'sonner';
import { Reservation } from './types';
import SecurityPassModal from './SecurityPassModal';

interface BookingCardProps {
  reservation: Reservation;
  token: string;
  guestName?: string;
  guestPhone?: string;
  onUpdate?: () => void;
}

export default function BookingCard({ reservation, token, guestName = '', guestPhone = '', onUpdate }: BookingCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [securityModalOpen, setSecurityModalOpen] = useState(false);
  const [cleanliness, setCleanliness] = useState(5);
  const [food, setFood] = useState(5);
  const [service, setService] = useState(5);
  const [comments, setComments] = useState('');
  const [submittingCheckout, setSubmittingCheckout] = useState(false);

  const arrStr = new Date(reservation.arrivalDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const depStr = new Date(reservation.departureDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const nights = Math.max(1, Math.round((new Date(reservation.departureDate).getTime() - new Date(reservation.arrivalDate).getTime()) / 86400000));
  const room = reservation.rooms?.[0]?.room;
  
  const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    CONFIRMED: { label: 'Confirmed', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20', icon: <CheckCircle2 size={12} /> },
    CHECKED_IN: { label: 'Checked In', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: <ShieldCheck size={12} /> },
    CHECKED_OUT: { label: 'Checked Out', color: 'text-slate-400 bg-slate-800 border-slate-700', icon: <Clock size={12} /> },
    CANCELLED: { label: 'Cancelled', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20', icon: <AlertCircle size={12} /> },
  };
  const status = statusConfig[reservation.status] || statusConfig.CONFIRMED;

  const hasWiFi = true;
  const showWiFi = reservation.status === 'CHECKED_IN' && reservation.wifiStatus !== 'EXPIRED' && reservation.wifiStatus !== 'SUSPENDED';

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingCheckout(true);
    try {
      const res = await fetch('/api/guest-portal/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ cleanliness, food, service, comments }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setCheckoutModalOpen(false);
        if (onUpdate) onUpdate();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error('Checkout request failed. Please try again.');
    } finally {
      setSubmittingCheckout(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-800/80 bg-[#0f172a]/60 backdrop-blur-sm overflow-hidden shadow-xl space-y-4 pb-5">
      {/* Header Info */}
      <div className="p-5 pb-0 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="text-indigo-400 font-black text-sm tracking-wider">{reservation.bookingNo}</span>
            <span className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${status.color}`}>{status.icon} {status.label}</span>
            {reservation.mealPlan && (
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border border-indigo-500/25 bg-indigo-500/10 text-indigo-400">
                🍽️ {reservation.mealPlan} Plan
              </span>
            )}
            {reservation.checkoutRequested && (
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border border-amber-500/25 bg-amber-500/10 text-amber-400">
                ⏳ Checkout Requested
              </span>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-xl font-black text-white">₹{reservation.totalAmount.toLocaleString()}</div>
          <div className="text-[10px] text-slate-500 font-semibold">Total Amount</div>
        </div>
      </div>

      {/* Stay Dates */}
      <div className="mx-5 mb-0 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/60 grid grid-cols-3 gap-2 text-center">
        <div><p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Check-In</p><p className="text-xs font-bold text-slate-200">{arrStr}</p></div>
        <div className="flex flex-col items-center justify-center"><BedDouble size={14} className="text-indigo-400" /><p className="text-[10px] font-black text-indigo-400 mt-0.5">{nights}N</p></div>
        <div><p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Check-Out</p><p className="text-xs font-bold text-slate-200">{depStr}</p></div>
      </div>

      {/* Main Reservation Info Grid */}
      <div className="px-5 grid grid-cols-2 gap-2 text-xs">
        <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/50"><p className="text-[9px] font-black uppercase text-slate-500 mb-0.5">Room Type</p><p className="font-bold text-slate-200">{reservation.roomType.name}</p></div>
        <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/50"><p className="text-[9px] font-black uppercase text-slate-500 mb-0.5">Room</p><p className="font-bold text-emerald-400">{room ? `Room ${room.roomNumber}` : 'TBA'}</p></div>
        <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/50"><p className="text-[9px] font-black uppercase text-slate-500 mb-0.5">Guests</p><p className="font-bold text-slate-200">{reservation.adults}A{reservation.children > 0 ? ` + ${reservation.children}C` : ''}</p></div>
        <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/50"><p className="text-[9px] font-black uppercase text-slate-500 mb-0.5">Balance Due</p><p className={`font-extrabold ${reservation.dueAmount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>₹{reservation.dueAmount.toLocaleString()}</p></div>
      </div>

      {/* 🛡️ Digital Security Gate Pass (QR Code for Security Guards) */}
      <div className="mx-5 p-4 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-violet-950/30 to-slate-900/40 border border-indigo-500/30 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-600/10 shrink-0">
            <QrCode size={22} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400">Security Checkpoint</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-xs font-black text-white mt-0.5">Digital Gate Pass & QR</p>
            <p className="text-[10px] text-slate-400">Show to hotel security guards at entry / gate</p>
          </div>
        </div>
        <button
          onClick={() => setSecurityModalOpen(true)}
          className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-[11px] font-black uppercase tracking-wider transition-all shadow-md shadow-indigo-600/20 shrink-0 flex items-center gap-1.5"
        >
          <QrCode size={13} /> View QR
        </button>
      </div>

      {/* 🏊 Swimming Pool Access Pass Card */}
      {(reservation.poolAccess || (reservation.poolPackage && reservation.poolPackage !== 'NONE')) && (
        <div className="mx-5 p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/25 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest text-cyan-400 flex items-center gap-1.5">
              <Waves size={14} /> Swimming Pool Access & Pass
            </p>
            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
              Active Pass
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-[9px] text-slate-500 uppercase font-black">Pass Category</p>
              <p className="font-bold text-white mt-0.5">{reservation.poolPackage || 'Standard Swimming Pool Pass'}</p>
            </div>
            <div>
              <p className="text-[9px] text-slate-500 uppercase font-black">Pass Rate</p>
              <p className="font-bold text-cyan-300 mt-0.5">₹{(reservation.poolPassCost || 0).toLocaleString()}</p>
            </div>
          </div>

          <div className="pt-1.5 border-t border-cyan-500/15 flex flex-wrap gap-1.5">
            <span className="text-[9px] font-bold text-cyan-300 bg-cyan-950/60 border border-cyan-500/20 px-2 py-0.5 rounded-lg flex items-center gap-1">
              <CheckCircle2 size={10} className="text-cyan-400" /> Pool Loungers & Towels Included
            </span>
            <span className="text-[9px] font-bold text-cyan-300 bg-cyan-950/60 border border-cyan-500/20 px-2 py-0.5 rounded-lg flex items-center gap-1">
              <CheckCircle2 size={10} className="text-cyan-400" /> Locker Room Access
            </span>
          </div>
        </div>
      )}

      {/* 💆 Spa & Wellness Package Card */}
      {reservation.spaPackage && reservation.spaPackage !== 'NONE' && (
        <div className="mx-5 p-4 rounded-2xl bg-pink-950/20 border border-pink-500/25 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest text-pink-400 flex items-center gap-1.5">
              <Sparkles size={14} /> Spa & Wellness Package
            </p>
            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-pink-500/10 text-pink-300 border border-pink-500/20">
              Reserved
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-[9px] text-slate-500 uppercase font-black">Selected Therapy</p>
              <p className="font-bold text-white mt-0.5">{reservation.spaPackage}</p>
            </div>
            <div>
              <p className="text-[9px] text-slate-500 uppercase font-black">Therapy Charge</p>
              <p className="font-bold text-pink-300 mt-0.5">₹{(reservation.spaPackageCost || 0).toLocaleString()}</p>
            </div>
          </div>

          {reservation.addOnNotes && (
            <div className="pt-1.5 border-t border-pink-500/15">
              <p className="text-[9px] text-slate-500 uppercase font-black">Preferred Slot / Notes</p>
              <p className="text-[11px] font-medium text-slate-300 mt-0.5">{reservation.addOnNotes}</p>
            </div>
          )}
        </div>
      )}

      {/* WiFi Card (Dynamic - shown if guest is checked in) */}
      {showWiFi && (
        <div className="mx-5 p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 flex items-center gap-1.5">
            <Wifi size={12} /> Complimentary Room WiFi
          </p>
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div>
              <p className="text-[9px] text-slate-500 uppercase font-black">Room No</p>
              <p className="font-bold text-white select-all">{room?.roomNumber || "TBA"}</p>
            </div>
            <div>
              <p className="text-[9px] text-slate-500 uppercase font-black">WiFi Network</p>
              <p className="font-bold text-white select-all">{reservation.property?.hotelWifiName || "Hotel-Free-WiFi"}</p>
            </div>
            <div>
              <p className="text-[9px] text-slate-500 uppercase font-black">Password</p>
              <p className="font-bold text-white select-all">{reservation.wifiPassword || reservation.property?.hotelWifiPassword || "welcome123"}</p>
            </div>
          </div>
        </div>
      )}

      {/* WiFi Card Expired State (if stay checked out or wifi status is expired) */}
      {hasWiFi && (reservation.status === 'CHECKED_OUT' || reservation.wifiStatus === 'EXPIRED' || reservation.wifiStatus === 'SUSPENDED') && (
        <div className="mx-5 p-4 rounded-2xl bg-rose-950/10 border border-rose-500/25 space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-rose-400 flex items-center gap-1.5">
            <Wifi size={12} /> Wi-Fi Access Suspended
          </p>
          <p className="text-[11px] text-slate-500 leading-normal">
            Your complimentary room Wi-Fi has been deactivated automatically upon checkout/expiry of your stay.
          </p>
        </div>
      )}

      {/* House Rules & Timings Card */}
      <div className="mx-5 p-4 rounded-2xl bg-slate-950/40 border border-slate-850 space-y-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">🕒 Hotel Rules & Timings</p>
        <div className="grid grid-cols-2 gap-3 text-xs leading-normal">
          <div>
            <p className="text-[9px] text-slate-500 uppercase font-black">🍳 Breakfast</p>
            <p className="font-bold text-slate-300">{reservation.property?.breakfastTimings || "08:00 AM - 10:30 AM"}</p>
          </div>
          <div>
            <p className="text-[9px] text-slate-500 uppercase font-black">🏊 Pool & Gym</p>
            <p className="font-bold text-slate-300">{reservation.property?.poolTimings || "07:00 AM - 08:00 PM"}</p>
          </div>
          <div className="col-span-2">
            <p className="text-[9px] text-slate-500 uppercase font-black">🔑 Checkout Policy</p>
            <p className="font-medium text-slate-400 text-[11px] leading-relaxed">
              {reservation.property?.checkoutPolicy || "Standard checkout time is 11:00 AM. Late checkouts may incur additional charges."}
            </p>
          </div>
        </div>
      </div>

      {/* Express Checkout Action Button */}
      {reservation.status === 'CHECKED_IN' && (
        <div className="px-5">
          {reservation.checkoutRequested ? (
            <div className="w-full text-center py-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-black uppercase tracking-wider rounded-2xl">
              🕒 Checkout Request Pending Staff Approval
            </div>
          ) : (
            <button
              onClick={() => setCheckoutModalOpen(true)}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-rose-600/15"
            >
              🔑 Request Express Check-out
            </button>
          )}
        </div>
      )}

      <div className="h-4" />

      {/* Express Checkout & Feedback Modal */}
      {checkoutModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0a0f1e] border border-slate-800 rounded-3xl p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setCheckoutModalOpen(false)}
              className="absolute right-4 top-4 text-slate-500 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <h3 className="font-black text-white text-lg flex items-center gap-2">
              🔑 Express Check-out Request
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              We hope you enjoyed your stay! Please share your feedback to request checkout. Staff will verify your room and finalize the bill.
            </p>

            <form onSubmit={handleCheckoutSubmit} className="space-y-4 pt-2">
              {/* Ratings */}
              <div className="space-y-3">
                {[
                  { label: '🧹 Cleanliness', val: cleanliness, set: setCleanliness },
                  { label: '🏨 Service & Staff', val: service, set: setService },
                  { label: '🍳 Food Quality', val: food, set: setFood },
                ].map(r => (
                  <div key={r.label} className="flex justify-between items-center bg-slate-900/40 p-3 rounded-2xl border border-slate-850">
                    <span className="text-xs font-bold text-slate-300">{r.label}</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => r.set(star)}
                          className={`text-sm transition-all hover:scale-110 ${star <= r.val ? 'text-amber-400' : 'text-slate-700'}`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Comments */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Comments (Optional)</label>
                <textarea
                  value={comments}
                  onChange={e => setComments(e.target.value)}
                  placeholder="Share your stay experience or remarks..."
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border border-slate-850 bg-slate-950/70 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-700 resize-none font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={submittingCheckout}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs uppercase tracking-wider transition-all disabled:opacity-50"
              >
                {submittingCheckout ? <><Loader2 size={14} className="animate-spin" /> Submitting Request...</> : 'Submit Checkout Request'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Security Gate Pass Modal */}
      {securityModalOpen && (
        <SecurityPassModal
          reservation={reservation}
          guestName={guestName}
          guestPhone={guestPhone}
          onClose={() => setSecurityModalOpen(false)}
        />
      )}
    </div>
  );
}
