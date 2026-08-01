'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles, Plus, Calendar, Clock, User, Star, X, Loader2,
  RefreshCw, CheckCircle2, AlertTriangle, Edit3, Trash2,
  Phone, Users, BadgeCheck, Zap, TrendingUp, CreditCard,
  BarChart3, Settings, ChevronRight, Package, ArrowRight,
  Timer, HeartHandshake, Flame, Droplets, Leaf, Wind, Scissors
} from 'lucide-react';
import { toast } from 'sonner';

// ── Types ──────────────────────────────────────────────────────────────────────
interface SpaService {
  id: string;
  name: string;
  category: string;
  duration: number;
  price: number;
  description?: string;
  image?: string;
  isActive: boolean;
}

interface SpaTherapist {
  id: string;
  name: string;
  gender: string;
  specialty?: string;
  phone?: string;
  rating: number;
  isActive: boolean;
}

interface SpaAppointment {
  id: string;
  guestName: string;
  guestRoom: string;
  guestPhone?: string;
  serviceName: string;
  therapistName?: string;
  bookingDate: string;
  bookingTime: string;
  duration: number;
  amount: number;
  paymentType: string;
  status: string;
  notes?: string;
  service?: SpaService;
  therapist?: SpaTherapist;
  createdAt: string;
}

// ── Constants ──────────────────────────────────────────────────────────────────
// propertyId is resolved server-side from session — no hardcoded ID needed

const STATUS_STYLE: Record<string, string> = {
  CONFIRMED:   'text-sky-300 bg-sky-500/10 border-sky-500/20',
  IN_PROGRESS: 'text-amber-300 bg-amber-500/10 border-amber-500/20',
  COMPLETED:   'text-emerald-300 bg-emerald-500/10 border-emerald-500/20',
  CANCELLED:   'text-rose-300 bg-rose-500/10 border-rose-500/20',
  NO_SHOW:     'text-slate-300 bg-slate-800 border-slate-700',
};

const CATEGORY_ICON: Record<string, React.ReactNode> = {
  Massage:     <HeartHandshake size={18} className="text-pink-400" />,
  Facial:      <Sparkles size={18} className="text-violet-400" />,
  Body:        <Flame size={18} className="text-orange-400" />,
  Wellness:    <Leaf size={18} className="text-emerald-400" />,
  Beauty:      <Scissors size={18} className="text-rose-400" />,
  Couple:      <Users size={18} className="text-indigo-400" />,
  Hydrotherapy:<Droplets size={18} className="text-blue-400" />,
  Aromatherapy:<Wind size={18} className="text-teal-400" />,
};

const DEFAULT_SERVICES = [
  { name: 'Swedish Relaxation Massage', category: 'Massage', duration: 60, price: 3500, description: 'A gentle, relaxing full-body massage using long flowing strokes.' },
  { name: 'Deep Tissue Therapy', category: 'Massage', duration: 90, price: 5000, description: 'Intensive massage targeting deep muscle layers for pain relief.' },
  { name: 'Hot Stone Massage', category: 'Massage', duration: 90, price: 5500, description: 'Warm volcanic stones melt tension and improve circulation.' },
  { name: 'Aromatherapy Massage', category: 'Aromatherapy', duration: 75, price: 4500, description: 'Essential oils blended for ultimate relaxation and wellness.' },
  { name: 'Couple Spa Package', category: 'Couple', duration: 90, price: 8000, description: 'Shared spa experience — massage + facial for two.' },
  { name: 'Luxury Facial', category: 'Facial', duration: 60, price: 3000, description: 'Deep cleansing and hydrating facial for glowing skin.' },
  { name: 'Body Wrap & Scrub', category: 'Body', duration: 75, price: 4000, description: 'Full body exfoliation and moisturizing treatment.' },
  { name: 'Manicure & Pedicure', category: 'Beauty', duration: 60, price: 2000, description: 'Complete nail care and polish treatment.' },
  { name: 'Ayurvedic Shirodhara', category: 'Wellness', duration: 60, price: 4500, description: 'Warm medicated oil poured on forehead for deep relaxation.' },
];

const DEFAULT_THERAPISTS = [
  { name: 'Anita Sharma', gender: 'Female', specialty: 'Swedish & Hot Stone', phone: '+91 98765 11111', rating: 4.9 },
  { name: 'Meera Pillai', gender: 'Female', specialty: 'Aromatherapy & Facial', phone: '+91 98765 22222', rating: 4.8 },
  { name: 'Rahul Gupta', gender: 'Male', specialty: 'Deep Tissue', phone: '+91 98765 33333', rating: 4.7 },
  { name: 'Sunita Nair', gender: 'Female', specialty: 'Ayurvedic & Body Wraps', phone: '+91 98765 44444', rating: 5.0 },
];

const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00',
  '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00',
  '19:30', '20:00',
];

// ── Book Appointment Modal ──────────────────────────────────────────────────────
function BookAppointmentModal({
  services, therapists, onClose, onBooked
}: {
  services: SpaService[];
  therapists: SpaTherapist[];
  onClose: () => void;
  onBooked: () => void;
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedService, setSelectedService] = useState<SpaService | null>(null);
  const [selectedTherapist, setSelectedTherapist] = useState<SpaTherapist | null>(null);
  const [form, setForm] = useState({
    guestName: '',
    guestRoom: '',
    guestPhone: '',
    bookingDate: new Date().toISOString().split('T')[0],
    bookingTime: '10:00',
    paymentType: 'ROOM_CHARGE',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  const handleBook = async () => {
    if (!selectedService || !form.guestName || !form.guestRoom) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/hotel/spa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'appointment',
          serviceId: selectedService.id,
          therapistId: selectedTherapist?.id || null,
          guestName: form.guestName,
          guestRoom: form.guestRoom,
          guestPhone: form.guestPhone,
          serviceName: selectedService.name,
          therapistName: selectedTherapist?.name || '',
          bookingDate: form.bookingDate,
          bookingTime: form.bookingTime,
          duration: selectedService.duration,
          amount: selectedService.price,
          paymentType: form.paymentType,
          notes: form.notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`✨ Appointment booked for ${form.guestName} — ${selectedService.name}!`);
      onBooked();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to book appointment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-slate-900 border border-pink-500/20 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-900/40 via-slate-900 to-purple-900/40 p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-pink-500/20 rounded-2xl flex items-center justify-center">
                <Sparkles size={20} className="text-pink-400" />
              </div>
              <div>
                <h2 className="text-base font-black text-white">Book Spa Appointment</h2>
                <div className="flex items-center gap-2 mt-1">
                  {[1, 2, 3].map(s => (
                    <div key={s} className={`h-1.5 rounded-full transition-all ${step >= s ? 'bg-pink-500 w-8' : 'bg-slate-700 w-4'}`} />
                  ))}
                  <span className="text-[10px] text-slate-500 font-bold">
                    Step {step}/3 — {step === 1 ? 'Service' : step === 2 ? 'Schedule & Guest' : 'Confirm'}
                  </span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white">
              <X size={14} />
            </button>
          </div>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {/* Step 1: Select Service */}
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4">Choose a Service</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {services.map(svc => (
                  <button
                    key={svc.id}
                    onClick={() => setSelectedService(svc)}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      selectedService?.id === svc.id
                        ? 'border-pink-500/60 bg-pink-500/10 shadow-lg shadow-pink-500/10'
                        : 'border-white/5 bg-slate-800/40 hover:border-pink-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 rounded-xl bg-pink-500/15 flex items-center justify-center">
                        {CATEGORY_ICON[svc.category] || <Sparkles size={16} className="text-pink-400" />}
                      </div>
                      {selectedService?.id === svc.id && (
                        <CheckCircle2 size={16} className="text-pink-400" />
                      )}
                    </div>
                    <p className="text-xs font-black text-white leading-tight">{svc.name}</p>
                    <p className="text-[10px] text-slate-500 mt-1">{svc.description}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-[10px] font-black text-pink-300 bg-pink-500/10 px-2 py-0.5 rounded-full border border-pink-500/20">
                        {svc.category}
                      </span>
                      <div className="text-right">
                        <p className="text-xs font-black text-white">₹{svc.price.toLocaleString()}</p>
                        <p className="text-[9px] text-slate-500">{svc.duration} min</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Schedule & Guest */}
          {step === 2 && (
            <div className="space-y-5">
              {/* Selected Service Summary */}
              {selectedService && (
                <div className="p-3 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black text-pink-300">{selectedService.name}</p>
                    <p className="text-[10px] text-slate-400">{selectedService.duration} min • ₹{selectedService.price.toLocaleString()}</p>
                  </div>
                  <button onClick={() => setStep(1)} className="text-[10px] text-pink-400 underline">Change</button>
                </div>
              )}

              {/* Guest Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Guest Name *</label>
                  <input type="text" required value={form.guestName} onChange={e => setForm(p => ({...p, guestName: e.target.value}))}
                    placeholder="Guest full name" className="mt-1 w-full h-9 px-3 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-pink-500" />
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Room Number *</label>
                  <input type="text" required value={form.guestRoom} onChange={e => setForm(p => ({...p, guestRoom: e.target.value}))}
                    placeholder="e.g. 307" className="mt-1 w-full h-9 px-3 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-pink-500" />
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Phone</label>
                  <input type="tel" value={form.guestPhone} onChange={e => setForm(p => ({...p, guestPhone: e.target.value}))}
                    placeholder="+91 XXXXX" className="mt-1 w-full h-9 px-3 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-pink-500" />
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Date *</label>
                  <input type="date" value={form.bookingDate} onChange={e => setForm(p => ({...p, bookingDate: e.target.value}))}
                    className="mt-1 w-full h-9 px-3 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-pink-500" />
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Time Slot *</label>
                  <select value={form.bookingTime} onChange={e => setForm(p => ({...p, bookingTime: e.target.value}))}
                    className="mt-1 w-full h-9 px-3 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-pink-500">
                    {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              {/* Therapist Selection */}
              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-2">Preferred Therapist</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSelectedTherapist(null)}
                    className={`p-3 rounded-2xl border text-left text-xs transition-all ${!selectedTherapist ? 'border-pink-500/60 bg-pink-500/10 text-pink-300' : 'border-white/5 bg-slate-800/40 text-slate-400 hover:border-slate-600'}`}
                  >
                    <p className="font-black">No Preference</p>
                    <p className="text-[9px] opacity-70">Auto-assign</p>
                  </button>
                  {therapists.map(t => (
                    <button key={t.id} onClick={() => setSelectedTherapist(t)}
                      className={`p-3 rounded-2xl border text-left transition-all ${selectedTherapist?.id === t.id ? 'border-pink-500/60 bg-pink-500/10' : 'border-white/5 bg-slate-800/40 hover:border-slate-600'}`}>
                      <p className="text-xs font-black text-white">{t.name}</p>
                      <p className="text-[9px] text-slate-500">{t.specialty}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Star size={9} className="text-yellow-400 fill-yellow-400" />
                        <span className="text-[9px] text-slate-400 font-bold">{t.rating}</span>
                        <span className="text-[9px] text-slate-600">• {t.gender}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Type */}
              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-2">Payment Method</label>
                <div className="flex gap-2">
                  {[
                    { val: 'ROOM_CHARGE', label: 'Post to Room Bill', icon: CreditCard },
                    { val: 'CASH', label: 'Cash', icon: TrendingUp },
                    { val: 'UPI', label: 'UPI / Card', icon: Zap },
                  ].map(({ val, label, icon: Icon }) => (
                    <button key={val} onClick={() => setForm(p => ({...p, paymentType: val}))}
                      className={`flex-1 py-2 rounded-xl text-[10px] font-black border transition-all flex flex-col items-center gap-1 ${
                        form.paymentType === val ? 'bg-pink-500/20 border-pink-500/40 text-pink-300' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}>
                      <Icon size={14} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Special Requests</label>
                <textarea value={form.notes} onChange={e => setForm(p => ({...p, notes: e.target.value}))} rows={2}
                  placeholder="Any special requests or health conditions…"
                  className="mt-1 w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-pink-500 resize-none" />
              </div>
            </div>
          )}

          {/* Step 3: Confirm */}
          {step === 3 && selectedService && (
            <div className="space-y-4">
              <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4">Confirm Booking Details</p>

              <div className="p-5 rounded-3xl bg-gradient-to-br from-pink-950/40 to-slate-900 border border-pink-500/20 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-pink-500/20 flex items-center justify-center">
                    <Sparkles size={24} className="text-pink-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">{selectedService.name}</h3>
                    <p className="text-[10px] text-pink-300">{selectedService.category} • {selectedService.duration} minutes</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  {[
                    { label: 'Guest', value: form.guestName },
                    { label: 'Room', value: `Room ${form.guestRoom}` },
                    { label: 'Date', value: new Date(form.bookingDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) },
                    { label: 'Time', value: form.bookingTime },
                    { label: 'Therapist', value: selectedTherapist?.name || 'Auto-assign' },
                    { label: 'Payment', value: form.paymentType === 'ROOM_CHARGE' ? 'Post to Room Bill' : form.paymentType },
                  ].map(({label, value}) => (
                    <div key={label} className="p-3 rounded-xl bg-slate-800/60 border border-white/5">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider">{label}</p>
                      <p className="font-bold text-white mt-0.5">{value}</p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-900/20 border border-emerald-500/20">
                  <span className="text-sm font-black text-slate-300">Total Amount</span>
                  <span className="text-2xl font-black text-emerald-400">₹{selectedService.price.toLocaleString()}</span>
                </div>

                {form.paymentType === 'ROOM_CHARGE' && (
                  <div className="flex items-center gap-2 text-[10px] text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
                    <CreditCard size={12} />
                    <span>Will be automatically added to Room <strong>{form.guestRoom}</strong> bill at checkout.</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-white/10 flex gap-3">
          {step > 1 && (
            <button onClick={() => setStep(s => (s - 1) as 1 | 2 | 3)} className="h-11 px-5 rounded-xl bg-slate-800 text-slate-300 text-xs font-black hover:bg-slate-700 transition-colors">
              Back
            </button>
          )}
          {step < 3 ? (
            <button
              onClick={() => {
                if (step === 1 && !selectedService) { toast.error('Please select a service'); return; }
                setStep(s => (s + 1) as 1 | 2 | 3);
              }}
              className="flex-1 h-11 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-pink-600/20"
            >
              Continue <ChevronRight size={14} />
            </button>
          ) : (
            <button
              onClick={handleBook}
              disabled={saving}
              className="flex-1 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              {saving ? 'Booking...' : 'Confirm Appointment'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Add Service Modal ──────────────────────────────────────────────────────────
function AddServiceModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [form, setForm] = useState({ name: '', category: 'Massage', duration: '60', price: '', description: '' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/hotel/spa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'service', ...form, duration: Number(form.duration), price: Number(form.price) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Service "${form.name}" added!`);
      onAdded();
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-black text-white">Add Spa Service</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"><X size={14} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Service Name *</label>
            <input required value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} placeholder="e.g. Hot Stone Massage"
              className="mt-1 w-full h-9 px-3 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-pink-500" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Category</label>
              <select value={form.category} onChange={e => setForm(p => ({...p, category: e.target.value}))}
                className="mt-1 w-full h-9 px-3 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-pink-500">
                {['Massage','Facial','Body','Wellness','Beauty','Couple','Hydrotherapy','Aromatherapy'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Duration (min)</label>
              <input type="number" required value={form.duration} onChange={e => setForm(p => ({...p, duration: e.target.value}))} min={15} step={15}
                className="mt-1 w-full h-9 px-3 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-pink-500" />
            </div>
          </div>
          <div>
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Price (₹) *</label>
            <input type="number" required value={form.price} onChange={e => setForm(p => ({...p, price: e.target.value}))} placeholder="3500"
              className="mt-1 w-full h-9 px-3 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-pink-500" />
          </div>
          <div>
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Description</label>
            <textarea value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} rows={2}
              className="mt-1 w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-pink-500 resize-none" />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 h-9 rounded-xl bg-slate-800 text-slate-400 text-xs font-black">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 h-9 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-black flex items-center justify-center gap-1">
              {saving && <Loader2 size={12} className="animate-spin" />} Add Service
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Add Therapist Modal ────────────────────────────────────────────────────────
function AddTherapistModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [form, setForm] = useState({ name: '', gender: 'Female', specialty: '', phone: '', rating: '4.9' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/hotel/spa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'therapist', ...form, rating: Number(form.rating) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Therapist "${form.name}" added!`);
      onAdded();
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-black text-white">Add Therapist</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"><X size={14} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Full Name *</label>
            <input required value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} placeholder="e.g. Anita Sharma"
              className="mt-1 w-full h-9 px-3 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-pink-500" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Gender</label>
              <select value={form.gender} onChange={e => setForm(p => ({...p, gender: e.target.value}))}
                className="mt-1 w-full h-9 px-3 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-pink-500">
                {['Female','Male','Other'].map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Rating (1-5)</label>
              <input type="number" value={form.rating} onChange={e => setForm(p => ({...p, rating: e.target.value}))} min={1} max={5} step={0.1}
                className="mt-1 w-full h-9 px-3 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-pink-500" />
            </div>
          </div>
          <div>
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Specialty</label>
            <input value={form.specialty} onChange={e => setForm(p => ({...p, specialty: e.target.value}))} placeholder="e.g. Swedish & Hot Stone"
              className="mt-1 w-full h-9 px-3 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-pink-500" />
          </div>
          <div>
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Phone</label>
            <input type="tel" value={form.phone} onChange={e => setForm(p => ({...p, phone: e.target.value}))} placeholder="+91 98765 XXXXX"
              className="mt-1 w-full h-9 px-3 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-pink-500" />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 h-9 rounded-xl bg-slate-800 text-slate-400 text-xs font-black">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black flex items-center justify-center gap-1">
              {saving && <Loader2 size={12} className="animate-spin" />} Add Therapist
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function SpaPage() {
  const [tab, setTab] = useState<'appointments' | 'services' | 'therapists'>('appointments');
  const [appointments, setAppointments] = useState<SpaAppointment[]>([]);
  const [services, setServices] = useState<SpaService[]>([]);
  const [therapists, setTherapists] = useState<SpaTherapist[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAll, setShowAll] = useState(false);

  // Modals
  const [showBookModal, setShowBookModal] = useState(false);
  const [showAddService, setShowAddService] = useState(false);
  const [showAddTherapist, setShowAddTherapist] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [apptRes, svcRes, thrRes] = await Promise.all([
        fetch(`/api/hotel/spa?type=appointments&date=${showAll ? 'all' : selectedDate}`),
        fetch(`/api/hotel/spa?type=services`),
        fetch(`/api/hotel/spa?type=therapists`),
      ]);
      const [apptData, svcData, thrData] = await Promise.all([apptRes.json(), svcRes.json(), thrRes.json()]);

      const appts = apptData.data;
      setAppointments(Array.isArray(appts) ? appts : []);

      const svcs = svcData.data;
      setServices(Array.isArray(svcs) ? svcs : []);

      const thrs = thrData.data;
      setTherapists(Array.isArray(thrs) ? thrs : []);
    } catch (err) {
      toast.error('Failed to load spa data');
    } finally {
      setLoading(false);
    }
  }, [selectedDate, showAll]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await fetch('/api/hotel/spa', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      toast.success(`Status updated to ${status}`);
      fetchAll();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleCancelAppt = async (id: string) => {
    try {
      await fetch(`/api/hotel/spa?id=${id}&type=appointment`, { method: 'DELETE' });
      toast.success('Appointment cancelled');
      fetchAll();
    } catch {
      toast.error('Failed to cancel');
    }
  };

  // Stats
  const todayAppts = appointments.filter(a => a.bookingDate === selectedDate);
  const confirmed = appointments.filter(a => a.status === 'CONFIRMED').length;
  const inProgress = appointments.filter(a => a.status === 'IN_PROGRESS').length;
  const completed = appointments.filter(a => a.status === 'COMPLETED').length;
  const revenue = appointments.filter(a => a.status === 'COMPLETED').reduce((s, a) => s + a.amount, 0);

  return (
    <>
      {showBookModal && (
        <BookAppointmentModal
          services={services}
          therapists={therapists}
          onClose={() => setShowBookModal(false)}
          onBooked={fetchAll}
        />
      )}
      {showAddService && (
        <AddServiceModal onClose={() => setShowAddService(false)} onAdded={fetchAll} />
      )}
      {showAddTherapist && (
        <AddTherapistModal onClose={() => setShowAddTherapist(false)} onAdded={fetchAll} />
      )}

      <div className="space-y-5 pb-10 max-w-[1300px] mx-auto">
        {/* ── Header ── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-pink-950/60 via-slate-900 to-purple-950/40 border border-pink-500/20 p-6 shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/5 rounded-full -translate-y-32 translate-x-20" />
          <div className="flex items-start justify-between flex-wrap gap-4 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={14} className="text-pink-400" />
                <span className="text-[10px] font-black text-pink-400 uppercase tracking-widest">Wellness · Spa & Beauty</span>
                <span className="text-[8px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  LIVE
                </span>
              </div>
              <h1 className="text-2xl font-black text-white">Spa & Wellness</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {todayAppts.length} appointments today · ₹{revenue.toLocaleString()} earned
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="h-9 px-3 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-pink-500"
              />
              <button
                onClick={fetchAll}
                className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              </button>
              <button
                onClick={() => setShowBookModal(true)}
                className="flex items-center gap-1.5 h-9 px-5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-pink-600/30"
              >
                <Plus size={12} /> Book Appointment
              </button>
            </div>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Appointments', value: appointments.length, color: 'text-pink-300 border-pink-500/20 bg-pink-900/20', icon: Calendar },
            { label: 'In Progress', value: inProgress, color: 'text-amber-300 border-amber-500/20 bg-amber-900/20', icon: Timer },
            { label: 'Completed', value: completed, color: 'text-emerald-300 border-emerald-500/20 bg-emerald-900/20', icon: CheckCircle2 },
            { label: 'Revenue Today', value: `₹${revenue.toLocaleString()}`, color: 'text-violet-300 border-violet-500/20 bg-violet-900/20', icon: TrendingUp },
          ].map(s => (
            <div key={s.label} className={`rounded-2xl border p-4 ${s.color} flex items-center justify-between`}>
              <div>
                <p className="text-xl font-black text-white">{s.value}</p>
                <p className="text-[9px] font-bold uppercase tracking-widest opacity-60 mt-1">{s.label}</p>
              </div>
              <s.icon size={22} className="opacity-25" />
            </div>
          ))}
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-2 border-b border-white/10 pb-3">
          {[
            { key: 'appointments', label: `Appointments (${appointments.length})`, icon: Calendar },
            { key: 'services', label: `Services (${services.length})`, icon: Sparkles },
            { key: 'therapists', label: `Therapists (${therapists.length})`, icon: Users },
          ].map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                tab === key ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/20' : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800'
              }`}>
              <Icon size={13} /> {label}
            </button>
          ))}
          <label className="flex items-center gap-2 ml-auto cursor-pointer text-xs text-slate-400">
            <input type="checkbox" checked={showAll} onChange={e => setShowAll(e.target.checked)} className="accent-pink-500" />
            Show All Dates
          </label>
        </div>

        {/* ── Appointments Tab ── */}
        {tab === 'appointments' && (
          loading ? (
            <div className="flex items-center justify-center py-20 gap-3 text-slate-500">
              <Loader2 size={24} className="animate-spin text-pink-400" />
              <span className="text-sm font-bold">Loading appointments…</span>
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-20 rounded-3xl border border-white/5 bg-slate-900/40">
              <Sparkles size={40} className="text-pink-500/30 mx-auto mb-3" />
              <p className="text-slate-400 text-sm font-bold">No appointments yet</p>
              <p className="text-slate-600 text-xs mt-1">Click "Book Appointment" to create one</p>
              <button onClick={() => setShowBookModal(true)} className="mt-4 px-5 py-2 rounded-xl bg-pink-600 text-white text-xs font-black">
                + Book Appointment
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {appointments.map(a => (
                <div key={a.id}
                  className={`rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-pink-500/20 transition-all ${
                    a.status === 'IN_PROGRESS' ? 'bg-amber-900/10 border-amber-500/20' : 'bg-slate-900/50 border-white/5'
                  }`}
                >
                  {/* Time Block */}
                  <div className="w-16 h-16 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex flex-col items-center justify-center shrink-0">
                    <span className="text-sm font-black text-pink-300">{a.bookingTime}</span>
                    <span className="text-[9px] text-slate-500">{a.duration}m</span>
                    <span className="text-[8px] text-slate-600 text-center">{new Date(a.bookingDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-black text-white">{a.serviceName}</p>
                      {a.status === 'IN_PROGRESS' && (
                        <span className="text-[8px] font-black text-amber-300 bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded-full animate-pulse">LIVE NOW</span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="text-[10px] text-slate-300 font-bold">{a.guestName}</span>
                      <span className="text-[9px] text-slate-500">Rm {a.guestRoom}</span>
                      {a.guestPhone && <span className="text-[9px] text-slate-600">{a.guestPhone}</span>}
                      {a.therapistName && (
                        <span className="text-[9px] text-pink-400 flex items-center gap-1">
                          <User size={9} /> {a.therapistName}
                        </span>
                      )}
                    </div>
                    {a.notes && <p className="text-[9px] text-slate-600 mt-1 italic">"{a.notes}"</p>}
                  </div>

                  {/* Amount & Status & Actions */}
                  <div className="flex sm:flex-col items-center sm:items-end gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-black text-white">₹{a.amount.toLocaleString()}</p>
                      <p className="text-[9px] text-slate-500">{a.paymentType === 'ROOM_CHARGE' ? 'Room Bill' : a.paymentType}</p>
                    </div>
                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border ${STATUS_STYLE[a.status] || STATUS_STYLE.CONFIRMED}`}>
                      {a.status}
                    </span>
                    {/* Actions */}
                    <div className="flex gap-1">
                      {a.status === 'CONFIRMED' && (
                        <button onClick={() => handleStatusChange(a.id, 'IN_PROGRESS')}
                          className="text-[9px] font-black text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-1 rounded-lg border border-amber-500/20 transition-all">
                          Start
                        </button>
                      )}
                      {a.status === 'IN_PROGRESS' && (
                        <button onClick={() => handleStatusChange(a.id, 'COMPLETED')}
                          className="text-[9px] font-black text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-1 rounded-lg border border-emerald-500/20 transition-all">
                          Complete
                        </button>
                      )}
                      {(a.status === 'CONFIRMED' || a.status === 'IN_PROGRESS') && (
                        <button onClick={() => handleCancelAppt(a.id)}
                          className="text-[9px] font-black text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 px-2 py-1 rounded-lg border border-rose-500/20 transition-all">
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* ── Services Tab ── */}
        {tab === 'services' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400">{services.length} services in catalog</p>
              <button onClick={() => setShowAddService(true)}
                className="flex items-center gap-1.5 h-8 px-4 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-[10px] font-black uppercase tracking-wider">
                <Plus size={11} /> Add Service
              </button>
            </div>

            {/* Group by category */}
            {Object.entries(
              services.reduce((acc: Record<string, SpaService[]>, svc) => {
                if (!acc[svc.category]) acc[svc.category] = [];
                acc[svc.category].push(svc);
                return acc;
              }, {})
            ).map(([cat, svcs]) => (
              <div key={cat}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-pink-500/15 flex items-center justify-center">
                    {CATEGORY_ICON[cat] || <Sparkles size={14} className="text-pink-400" />}
                  </div>
                  <span className="text-xs font-black text-slate-300 uppercase tracking-wider">{cat}</span>
                  <span className="text-[9px] text-slate-600">({svcs.length})</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 mb-4">
                  {svcs.map(svc => (
                    <div key={svc.id} className="rounded-2xl bg-slate-900/50 border border-white/5 hover:border-pink-500/20 p-4 transition-all group">
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-9 h-9 rounded-xl bg-pink-500/15 flex items-center justify-center">
                          {CATEGORY_ICON[svc.category] || <Sparkles size={16} className="text-pink-400" />}
                        </div>
                        <span className="text-[8px] font-black text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                          {svc.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </div>
                      <h3 className="text-sm font-black text-white leading-tight">{svc.name}</h3>
                      {svc.description && <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">{svc.description}</p>}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                        <div className="flex items-center gap-2">
                          <Clock size={10} className="text-slate-600" />
                          <span className="text-[10px] text-slate-400 font-bold">{svc.duration} min</span>
                        </div>
                        <span className="text-sm font-black text-pink-300">₹{svc.price.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {services.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <Sparkles size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm font-bold">No services yet</p>
              </div>
            )}
          </div>
        )}

        {/* ── Therapists Tab ── */}
        {tab === 'therapists' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400">{therapists.length} therapists on team</p>
              <button onClick={() => setShowAddTherapist(true)}
                className="flex items-center gap-1.5 h-8 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-wider">
                <Plus size={11} /> Add Therapist
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              {therapists.map(t => (
                <div key={t.id} className="rounded-2xl bg-slate-900/50 border border-white/5 hover:border-indigo-500/20 p-5 transition-all">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-700/60 to-pink-700/40 flex items-center justify-center text-white font-black text-lg">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-black text-white">{t.name}</p>
                      <p className="text-[9px] text-indigo-400 uppercase tracking-wider">{t.gender}</p>
                    </div>
                  </div>

                  {t.specialty && (
                    <p className="text-[10px] text-slate-400 mb-3">
                      <span className="font-bold text-slate-300">Specialty:</span> {t.specialty}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} size={10} className={s <= Math.round(t.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-700'} />
                      ))}
                      <span className="text-[9px] text-slate-400 ml-1 font-bold">{t.rating}</span>
                    </div>
                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border ${t.isActive ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20' : 'text-slate-400 bg-slate-800 border-slate-700'}`}>
                      {t.isActive ? 'ON DUTY' : 'OFF'}
                    </span>
                  </div>

                  {t.phone && (
                    <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-white/5">
                      <Phone size={10} className="text-slate-600" />
                      <span className="text-[9px] text-slate-500">{t.phone}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {therapists.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <Users size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm font-bold">No therapists yet</p>
              </div>
            )}
          </div>
        )}

        {/* ── Guest Booking Info Banner ── */}
        <div className="rounded-2xl border border-pink-500/10 bg-pink-950/20 p-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-pink-500/20 flex items-center justify-center shrink-0 mt-0.5">
            <Zap size={14} className="text-pink-400" />
          </div>
          <div>
            <p className="text-xs font-black text-pink-300">Guest Booking Flow</p>
            <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
              Guests can browse Spa services via the Guest Portal (Room QR scan → Spa & Wellness).
              After selecting a service & time, booking is auto-created here and the amount is posted to their room bill at checkout.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
