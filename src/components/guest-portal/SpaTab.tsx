'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles, Clock, Star, Plus, X, CheckCircle2, Loader2,
  ChevronRight, CreditCard, User, HeartHandshake, Flame,
  Leaf, Scissors, Users, Droplets, Wind, Calendar, Timer
} from 'lucide-react';
import { toast } from 'sonner';

interface SpaService {
  id: string;
  name: string;
  category: string;
  duration: number;
  price: number;
  description?: string;
}

interface SpaTherapist {
  id: string;
  name: string;
  gender: string;
  specialty?: string;
  rating: number;
}

interface SpaAppointment {
  id: string;
  serviceName: string;
  therapistName?: string;
  bookingDate: string;
  bookingTime: string;
  duration: number;
  amount: number;
  status: string;
}

const CATEGORY_ICON: Record<string, React.ReactNode> = {
  Massage:      <HeartHandshake size={18} className="text-pink-400" />,
  Facial:       <Sparkles size={18} className="text-violet-400" />,
  Body:         <Flame size={18} className="text-orange-400" />,
  Wellness:     <Leaf size={18} className="text-emerald-400" />,
  Beauty:       <Scissors size={18} className="text-rose-400" />,
  Couple:       <Users size={18} className="text-indigo-400" />,
  Hydrotherapy: <Droplets size={18} className="text-blue-400" />,
  Aromatherapy: <Wind size={18} className="text-teal-400" />,
};

const STATUS_STYLE: Record<string, string> = {
  CONFIRMED:   'text-sky-300 bg-sky-500/10 border-sky-500/20',
  IN_PROGRESS: 'text-amber-300 bg-amber-500/10 border-amber-500/20',
  COMPLETED:   'text-emerald-300 bg-emerald-500/10 border-emerald-500/20',
  CANCELLED:   'text-rose-300 bg-rose-500/10 border-rose-500/20',
};

const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '14:00', '14:30', '15:00', '15:30', '16:00',
  '16:30', '17:00', '18:00', '18:30', '19:00', '19:30', '20:00',
];

interface Props {
  token: string;
  propertyId?: string;
  guestName: string;
  guestRoom: string;
  guestPhone?: string;
}

export default function SpaTab({ token, propertyId = '', guestName, guestRoom, guestPhone = '' }: Props) {
  const [services, setServices] = useState<SpaService[]>([]);
  const [therapists, setTherapists] = useState<SpaTherapist[]>([]);
  const [myAppointments, setMyAppointments] = useState<SpaAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  // Booking flow
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0); // 0=menu, 1=service, 2=schedule, 3=confirm
  const [selectedService, setSelectedService] = useState<SpaService | null>(null);
  const [selectedTherapist, setSelectedTherapist] = useState<SpaTherapist | null>(null);
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [bookingTime, setBookingTime] = useState('10:00');
  const [paymentType, setPaymentType] = useState('ROOM_CHARGE');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const propParam = propertyId ? `&propertyId=${propertyId}` : '';
      const [svcRes, thrRes] = await Promise.all([
        fetch(`/api/hotel/spa?type=services${propParam}`),
        fetch(`/api/hotel/spa?type=therapists${propParam}`),
      ]);
      const [svcData, thrData] = await Promise.all([svcRes.json(), thrRes.json()]);
      setServices(svcData.data || []);
      setTherapists(thrData.data || []);

      // Load guest's appointments (search all dates by guestRoom)
      const apptRes = await fetch(`/api/hotel/spa?type=appointments&date=all${propParam}`);
      const apptData = await apptRes.json();
      const myAppts = (apptData.data || []).filter((a: SpaAppointment & { guestRoom: string }) =>
        a.guestRoom === guestRoom
      );
      setMyAppointments(myAppts);
    } catch {
      toast.error('Failed to load spa data');
    } finally {
      setLoading(false);
    }
  }, [guestRoom, propertyId]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleBook = async () => {
    if (!selectedService) return;
    setSaving(true);
    try {
      const res = await fetch('/api/hotel/spa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          type: 'appointment',
          propertyId: propertyId || undefined,
          serviceId: selectedService.id,
          therapistId: selectedTherapist?.id || null,
          guestName,
          guestRoom,
          guestPhone,
          serviceName: selectedService.name,
          therapistName: selectedTherapist?.name || '',
          bookingDate,
          bookingTime,
          duration: selectedService.duration,
          amount: selectedService.price,
          paymentType,
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`✨ Spa appointment confirmed! See you at ${bookingTime}`);
      setStep(0);
      setSelectedService(null);
      setSelectedTherapist(null);
      setNotes('');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Booking failed');
    } finally {
      setSaving(false);
    }
  };

  // Group services by category
  const grouped = services.reduce((acc: Record<string, SpaService[]>, svc) => {
    if (!acc[svc.category]) acc[svc.category] = [];
    acc[svc.category].push(svc);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 gap-3 text-slate-500">
        <Loader2 size={24} className="animate-spin text-pink-400" />
        <span className="text-sm">Loading spa services…</span>
      </div>
    );
  }

  // ── My Appointments ──
  if (step === 0) {
    return (
      <div className="space-y-6">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-pink-900/40 via-slate-900 to-purple-900/30 border border-pink-500/20 p-6">
          <div className="absolute top-0 right-0 w-48 h-48 bg-pink-500/5 rounded-full -translate-y-24 translate-x-16" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={14} className="text-pink-400" />
              <span className="text-[10px] font-black text-pink-400 uppercase tracking-widest">Spa & Wellness</span>
            </div>
            <h2 className="text-xl font-black text-white mb-1">Rejuvenate & Relax</h2>
            <p className="text-xs text-slate-400 mb-5">World-class treatments crafted for your wellbeing</p>
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-2 h-10 px-5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-pink-600/30 transition-all"
            >
              <Plus size={14} /> Book Spa Appointment
            </button>
          </div>
        </div>

        {/* My Appointments */}
        {myAppointments.length > 0 && (
          <div>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">My Appointments</h3>
            <div className="space-y-3">
              {myAppointments.map(a => (
                <div key={a.id} className="rounded-2xl border border-white/5 bg-slate-900/50 p-4 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex flex-col items-center justify-center shrink-0">
                    <span className="text-xs font-black text-pink-300">{a.bookingTime}</span>
                    <span className="text-[8px] text-slate-500">{a.duration}m</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-white">{a.serviceName}</p>
                    <p className="text-[9px] text-slate-500 mt-0.5">
                      {new Date(a.bookingDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                      {a.therapistName && ` · ${a.therapistName}`}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-white">₹{a.amount.toLocaleString()}</p>
                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border ${STATUS_STYLE[a.status] || STATUS_STYLE.CONFIRMED}`}>
                      {a.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Service Preview */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Our Services</h3>
          </div>
          <div className="space-y-4">
            {Object.entries(grouped).map(([cat, svcs]) => (
              <div key={cat}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-lg bg-pink-500/15 flex items-center justify-center">
                    {CATEGORY_ICON[cat] || <Sparkles size={12} className="text-pink-400" />}
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{cat}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {svcs.map(svc => (
                    <button
                      key={svc.id}
                      onClick={() => { setSelectedService(svc); setStep(2); }}
                      className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 hover:border-pink-500/30 text-left transition-all group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-xs font-black text-white group-hover:text-pink-200 transition-colors">{svc.name}</p>
                          {svc.description && <p className="text-[9px] text-slate-500 mt-0.5 line-clamp-1">{svc.description}</p>}
                        </div>
                        <ChevronRight size={13} className="text-slate-600 group-hover:text-pink-400 shrink-0 mt-0.5 transition-colors" />
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5">
                        <div className="flex items-center gap-1">
                          <Clock size={9} className="text-slate-600" />
                          <span className="text-[9px] text-slate-500">{svc.duration} min</span>
                        </div>
                        <span className="text-sm font-black text-pink-300">₹{svc.price.toLocaleString()}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Step 1: Select Service ──
  if (step === 1) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => setStep(0)} className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"><X size={14} /></button>
          <div>
            <h3 className="text-sm font-black text-white">Select a Service</h3>
            <p className="text-[9px] text-slate-500">Choose from our premium treatments</p>
          </div>
        </div>
        <div className="space-y-4">
          {Object.entries(grouped).map(([cat, svcs]) => (
            <div key={cat}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-xl bg-pink-500/15 flex items-center justify-center">
                  {CATEGORY_ICON[cat] || <Sparkles size={14} className="text-pink-400" />}
                </div>
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-wider">{cat}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {svcs.map(svc => (
                  <button
                    key={svc.id}
                    onClick={() => { setSelectedService(svc); setStep(2); }}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      selectedService?.id === svc.id ? 'border-pink-500/60 bg-pink-500/10' : 'border-white/5 bg-slate-900/50 hover:border-pink-500/20'
                    }`}
                  >
                    <p className="text-xs font-black text-white">{svc.name}</p>
                    {svc.description && <p className="text-[9px] text-slate-500 mt-0.5 line-clamp-2">{svc.description}</p>}
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5">
                      <span className="text-[9px] text-slate-500 flex items-center gap-1"><Clock size={9} />{svc.duration} min</span>
                      <span className="text-sm font-black text-pink-300">₹{svc.price.toLocaleString()}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Step 2: Date / Time / Therapist ──
  if (step === 2) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => setStep(1)} className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"><X size={14} /></button>
          <div>
            <h3 className="text-sm font-black text-white">Schedule Your Visit</h3>
            <p className="text-[9px] text-slate-500">{selectedService?.name}</p>
          </div>
        </div>

        {selectedService && (
          <div className="p-3 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-between">
            <div>
              <p className="text-xs font-black text-pink-300">{selectedService.name}</p>
              <p className="text-[9px] text-slate-400">{selectedService.duration} min · ₹{selectedService.price.toLocaleString()}</p>
            </div>
            <button onClick={() => setStep(1)} className="text-[9px] text-pink-400 underline">Change</button>
          </div>
        )}

        {/* Date & Time */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-1">Date</label>
            <input type="date" value={bookingDate} onChange={e => setBookingDate(e.target.value)} min={new Date().toISOString().split('T')[0]}
              className="w-full h-9 px-3 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-pink-500" />
          </div>
          <div>
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-1">Time</label>
            <select value={bookingTime} onChange={e => setBookingTime(e.target.value)}
              className="w-full h-9 px-3 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-pink-500">
              {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {/* Therapist */}
        <div>
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-2">Preferred Therapist</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setSelectedTherapist(null)}
              className={`p-3 rounded-2xl border text-left transition-all ${!selectedTherapist ? 'border-pink-500/60 bg-pink-500/10' : 'border-white/5 bg-slate-800/40 hover:border-slate-600'}`}
            >
              <p className="text-xs font-black text-white">No Preference</p>
              <p className="text-[9px] text-slate-500">We'll assign the best available</p>
            </button>
            {therapists.map(t => (
              <button key={t.id} onClick={() => setSelectedTherapist(t)}
                className={`p-3 rounded-2xl border text-left transition-all ${selectedTherapist?.id === t.id ? 'border-pink-500/60 bg-pink-500/10' : 'border-white/5 bg-slate-800/40 hover:border-slate-600'}`}>
                <p className="text-xs font-black text-white">{t.name}</p>
                <p className="text-[9px] text-slate-500">{t.specialty}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Star size={9} className="text-yellow-400 fill-yellow-400" />
                  <span className="text-[9px] text-slate-400">{t.rating}</span>
                  <span className="text-[9px] text-slate-600">• {t.gender}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Payment */}
        <div>
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-2">Payment</label>
          <div className="flex gap-2">
            {[
              { val: 'ROOM_CHARGE', label: 'Add to Room Bill' },
              { val: 'CASH', label: 'Cash' },
              { val: 'UPI', label: 'UPI / Card' },
            ].map(({ val, label }) => (
              <button key={val} onClick={() => setPaymentType(val)}
                className={`flex-1 py-2 rounded-xl text-[9px] font-black border transition-all ${
                  paymentType === val ? 'bg-pink-500/20 border-pink-500/40 text-pink-300' : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-600'
                }`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-1">Special Requests</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
            placeholder="Allergies, preferences, health conditions…"
            className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-pink-500 resize-none" />
        </div>

        <button onClick={() => setStep(3)}
          className="w-full h-10 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-pink-600/20">
          Continue to Confirm <ChevronRight size={13} />
        </button>
      </div>
    );
  }

  // ── Step 3: Confirm ──
  if (step === 3 && selectedService) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => setStep(2)} className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"><X size={14} /></button>
          <div>
            <h3 className="text-sm font-black text-white">Confirm Booking</h3>
            <p className="text-[9px] text-slate-500">Review your appointment details</p>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-gradient-to-br from-pink-950/40 to-slate-900 border border-pink-500/20 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-pink-500/20 flex items-center justify-center">
              <Sparkles size={22} className="text-pink-400" />
            </div>
            <div>
              <h4 className="text-sm font-black text-white">{selectedService.name}</h4>
              <p className="text-[10px] text-pink-300">{selectedService.category} · {selectedService.duration} min</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              { label: 'Guest', value: guestName },
              { label: 'Room', value: `Room ${guestRoom}` },
              { label: 'Date', value: new Date(bookingDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) },
              { label: 'Time', value: bookingTime },
              { label: 'Therapist', value: selectedTherapist?.name || 'Auto-assign' },
              { label: 'Payment', value: paymentType === 'ROOM_CHARGE' ? 'Room Bill' : paymentType },
            ].map(({ label, value }) => (
              <div key={label} className="p-3 rounded-xl bg-slate-800/60 border border-white/5">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider">{label}</p>
                <p className="font-bold text-white mt-0.5">{value}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-900/20 border border-emerald-500/20">
            <span className="text-xs font-black text-slate-300">Total Amount</span>
            <span className="text-xl font-black text-emerald-400">₹{selectedService.price.toLocaleString()}</span>
          </div>

          {paymentType === 'ROOM_CHARGE' && (
            <div className="flex items-center gap-2 text-[10px] text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
              <CreditCard size={12} />
              <span>Will be added to your Room {guestRoom} bill at checkout.</span>
            </div>
          )}
        </div>

        <button onClick={handleBook} disabled={saving}
          className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
          {saving ? 'Booking…' : 'Confirm Spa Appointment'}
        </button>
      </div>
    );
  }

  return null;
}
