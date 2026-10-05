'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles, Plus, Calendar, Clock, User, Star, X, Loader2,
  RefreshCw, CheckCircle2, AlertTriangle, Edit3, Trash2,
  Phone, Users, BadgeCheck, Zap, TrendingUp, CreditCard,
  BarChart3, Settings, ChevronRight, Package, ArrowRight,
  Timer, HeartHandshake, Flame, Droplets, Leaf, Wind, Scissors,
  Key, Lock, Eye, EyeOff, QrCode, ExternalLink, Copy, Shield,
  Smartphone, Building2, Store, Laptop, DollarSign, Check
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

interface PortalCredential {
  id: string;
  portalKey: string;
  portalName: string;
  role: string;
  urlPath: string;
  username: string;
  passcode: string;
  pinCode?: string;
  isActive: number;
  notes?: string;
  updatedAt?: string;
}

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
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4">Choose a Service</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {services.map(svc => (
                  <button
                    key={svc.id}
                    onClick={() => { setSelectedService(svc); setStep(2); }}
                    className={`p-4 rounded-2xl border text-left transition-all hover:scale-[1.01] ${
                      selectedService?.id === svc.id ? 'border-pink-500 bg-pink-500/10' : 'border-white/5 bg-slate-800/40 hover:border-pink-500/30'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="w-8 h-8 rounded-xl bg-pink-500/15 flex items-center justify-center">
                        {CATEGORY_ICON[svc.category] || <Sparkles size={16} className="text-pink-400" />}
                      </div>
                      <span className="text-xs font-black text-pink-300">₹{svc.price.toLocaleString()}</span>
                    </div>
                    <p className="text-sm font-black text-white">{svc.name}</p>
                    <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{svc.description}</p>
                    <div className="flex items-center gap-1 mt-3 text-[10px] text-slate-500 font-bold">
                      <Clock size={10} /> {svc.duration} mins · {svc.category}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Schedule & Guest Details</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Guest Name *</label>
                  <input
                    value={form.guestName}
                    onChange={e => setForm(f => ({ ...f, guestName: e.target.value }))}
                    placeholder="e.g. Ramesh Sharma"
                    className="w-full h-10 px-3 rounded-xl bg-slate-800 border border-white/10 text-xs font-bold text-white focus:outline-none focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Room Number *</label>
                  <input
                    value={form.guestRoom}
                    onChange={e => setForm(f => ({ ...f, guestRoom: e.target.value }))}
                    placeholder="e.g. 204"
                    className="w-full h-10 px-3 rounded-xl bg-slate-800 border border-white/10 text-xs font-bold text-white focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Date</label>
                  <input
                    type="date"
                    value={form.bookingDate}
                    onChange={e => setForm(f => ({ ...f, bookingDate: e.target.value }))}
                    className="w-full h-10 px-3 rounded-xl bg-slate-800 border border-white/10 text-xs font-bold text-white focus:outline-none focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Time Slot</label>
                  <select
                    value={form.bookingTime}
                    onChange={e => setForm(f => ({ ...f, bookingTime: e.target.value }))}
                    className="w-full h-10 px-3 rounded-xl bg-slate-800 border border-white/10 text-xs font-bold text-white focus:outline-none focus:border-pink-500"
                  >
                    {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Preferred Therapist (Optional)</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedTherapist(null)}
                    className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all ${
                      !selectedTherapist ? 'border-pink-500 bg-pink-500/10 text-pink-300' : 'border-white/5 bg-slate-800/40 text-slate-400'
                    }`}
                  >
                    Any Available
                  </button>
                  {therapists.map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedTherapist(t)}
                      className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all ${
                        selectedTherapist?.id === t.id ? 'border-pink-500 bg-pink-500/10 text-pink-300' : 'border-white/5 bg-slate-800/40 text-slate-400'
                      }`}
                    >
                      <p className="font-black text-white truncate">{t.name}</p>
                      <p className="text-[9px] text-slate-500">{t.gender} · ★ {t.rating}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-between pt-2">
                <button onClick={() => setStep(1)} className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-bold text-slate-300">
                  Back
                </button>
                <button
                  disabled={!form.guestName || !form.guestRoom}
                  onClick={() => setStep(3)}
                  className="px-5 py-2 rounded-xl bg-pink-600 disabled:opacity-40 text-xs font-black text-white"
                >
                  Review Booking →
                </button>
              </div>
            </div>
          )}

          {step === 3 && selectedService && (
            <div className="space-y-4">
              <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Confirm Appointment</p>
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-white/5 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-black text-white">{selectedService.name}</p>
                    <p className="text-xs text-slate-400">{selectedService.duration} minutes · {selectedService.category}</p>
                  </div>
                  <span className="text-base font-black text-pink-400">₹{selectedService.price.toLocaleString()}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs border-t border-white/5 pt-3">
                  <div>
                    <span className="text-slate-500 text-[10px] block">Guest</span>
                    <span className="font-bold text-white">{form.guestName} (Room {form.guestRoom})</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Scheduled</span>
                    <span className="font-bold text-white">{form.bookingDate} at {form.bookingTime}</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-between pt-2">
                <button onClick={() => setStep(2)} className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-bold text-slate-300">
                  Back
                </button>
                <button
                  onClick={handleBook}
                  disabled={saving}
                  className="px-6 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-xs font-black text-white shadow-lg shadow-pink-600/30 flex items-center gap-2"
                >
                  {saving ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                  Confirm & Post to Folio
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Edit Service Price Modal ───────────────────────────────────────────────────
function EditServicePriceModal({
  service, onClose, onUpdated
}: {
  service: SpaService;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [name, setName] = useState(service.name);
  const [category, setCategory] = useState(service.category);
  const [price, setPrice] = useState(service.price);
  const [duration, setDuration] = useState(service.duration);
  const [description, setDescription] = useState(service.description || '');
  const [isActive, setIsActive] = useState(service.isActive);
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/hotel/spa', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: service.id,
          type: 'service',
          name,
          category,
          price: Number(price),
          duration: Number(duration),
          description,
          isActive,
        }),
      });
      if (res.ok) {
        toast.success(`Updated "${name}" — New Price: ₹${price}`);
        onUpdated();
        onClose();
      } else {
        toast.error('Failed to update service');
      }
    } catch {
      toast.error('Network error saving service');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-slate-900 border border-pink-500/30 rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <h3 className="text-sm font-black text-white flex items-center gap-2">
            <Edit3 size={15} className="text-pink-400" /> Edit Service & Price
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-3 text-xs">
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Service Name *</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Price in INR (₹) *</label>
              <input
                type="number"
                min="0"
                step="50"
                value={price}
                onChange={e => setPrice(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-pink-300 text-base font-black"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Duration (Mins) *</label>
              <input
                type="number"
                min="15"
                step="15"
                value={duration}
                onChange={e => setDuration(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
            >
              {['Massage', 'Facial', 'Body', 'Wellness', 'Beauty', 'Couple', 'Aromatherapy', 'Hydrotherapy'].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white resize-none"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="font-bold text-white text-xs">Service Status</span>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={e => setIsActive(e.target.checked)}
                className="accent-pink-500 w-4 h-4"
              />
              <span className={`text-xs font-black ${isActive ? 'text-emerald-400' : 'text-slate-500'}`}>
                {isActive ? 'ACTIVE IN GUEST APP' : 'HIDDEN'}
              </span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold shadow-md"
            >
              {saving ? 'Saving…' : 'Save Price & Details'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Edit Portal Login Credentials Modal ────────────────────────────────────────
function EditPortalLoginModal({
  portal, onClose, onUpdated
}: {
  portal: PortalCredential;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [username, setUsername] = useState(portal.username || '');
  const [passcode, setPasscode] = useState(portal.passcode || '');
  const [pinCode, setPinCode] = useState(portal.pinCode || '');
  const [notes, setNotes] = useState(portal.notes || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/hotel/portal-logins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: portal.id,
          portalKey: portal.portalKey,
          username,
          passcode,
          pinCode,
          notes,
        }),
      });
      if (res.ok) {
        toast.success(`Access credentials for "${portal.portalName}" updated!`);
        onUpdated();
        onClose();
      } else {
        toast.error('Failed to update credentials');
      }
    } catch {
      toast.error('Network error saving portal credentials');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-slate-900 border border-purple-500/30 rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Key size={15} className="text-purple-400" /> Set Portal Login Credentials
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">{portal.portalName}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-3 text-xs">
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Username / Staff ID</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Passcode / Password</label>
              <input
                type="text"
                value={passcode}
                onChange={e => setPasscode(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-purple-300 font-mono font-bold"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Quick PIN Code</label>
              <input
                type="text"
                maxLength={6}
                value={pinCode}
                onChange={e => setPinCode(e.target.value)}
                placeholder="e.g. 1122"
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-emerald-400 font-mono font-bold text-center tracking-widest text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Operational Notes / Assigned Staff</label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Morning Shift HK team only"
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
            />
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
            Staff can scan their assigned phone QR or enter this PIN directly to access the {portal.portalName}.
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-md"
            >
              {saving ? 'Updating…' : 'Update Credentials'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Portal Phone QR Code Modal ──────────────────────────────────────────────────
function PortalQRModal({
  portal, onClose
}: {
  portal: PortalCredential;
  onClose: () => void;
}) {
  const fullUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${portal.urlPath}`
    : `http://localhost:3000${portal.urlPath}`;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(fullUrl)}&margin=10`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-slate-900 border border-purple-500/30 rounded-3xl p-6 shadow-2xl text-center space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <span className="text-xs font-black uppercase text-purple-400 flex items-center gap-1.5">
            <Smartphone size={14} /> Phone Login QR
          </span>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={15} />
          </button>
        </div>

        <div>
          <h3 className="text-sm font-black text-white">{portal.portalName}</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">{portal.role}</p>
        </div>

        {/* QR Code Container */}
        <div className="p-4 bg-white rounded-2xl inline-block shadow-inner">
          <img src={qrImageUrl} alt="Portal QR Code" className="w-48 h-48 mx-auto" />
        </div>

        <div className="space-y-1 text-xs">
          <div className="text-[11px] font-mono text-slate-300 bg-slate-950 p-2 rounded-xl border border-slate-800 break-all select-all">
            {fullUrl}
          </div>
          <div className="flex items-center justify-center gap-2 pt-2">
            <span className="text-[10.5px] text-slate-400">Staff PIN:</span>
            <span className="font-mono font-black text-emerald-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
              {portal.pinCode || '1122'}
            </span>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={() => {
              navigator.clipboard.writeText(fullUrl);
              toast.success('Portal URL copied to clipboard!');
            }}
            className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5"
          >
            <Copy size={13} /> Copy Link
          </button>
          <button
            onClick={() => window.open(portal.urlPath, '_blank')}
            className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-1.5"
          >
            <ExternalLink size={13} /> Open App
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function SpaPage() {
  const [tab, setTab] = useState<'appointments' | 'services' | 'therapists' | 'settings' | 'logins'>('appointments');
  const [appointments, setAppointments] = useState<SpaAppointment[]>([]);
  const [services, setServices] = useState<SpaService[]>([]);
  const [therapists, setTherapists] = useState<SpaTherapist[]>([]);
  const [portals, setPortals] = useState<PortalCredential[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAll, setShowAll] = useState(false);

  // Spa Settings State
  const [spaSettings, setSpaSettings] = useState({
    openTime: '09:00',
    closeTime: '21:00',
    slotDuration: 60,
    taxRate: 18,
    allowRoomCharge: true,
    advanceNoticeHours: 1,
    externalSpaEnabled: false,
  });
  const [settingsSaving, setSettingsSaving] = useState(false);

  // Revealed PINs map for password viewing
  const [revealedPins, setRevealedPins] = useState<Record<string, boolean>>({});

  // Modals
  const [showBookModal, setShowBookModal] = useState(false);
  const [editingService, setEditingService] = useState<SpaService | null>(null);
  const [editingPortal, setEditingPortal] = useState<PortalCredential | null>(null);
  const [viewingQRPortal, setViewingQRPortal] = useState<PortalCredential | null>(null);
  const [showAddService, setShowAddService] = useState(false);
  const [newServiceForm, setNewServiceForm] = useState({
    name: '', category: 'Massage', price: 3500, duration: 60, description: ''
  });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [apptRes, svcRes, thrRes, setRes, portRes] = await Promise.all([
        fetch(`/api/hotel/spa?type=appointments&date=${showAll ? 'all' : selectedDate}`),
        fetch(`/api/hotel/spa?type=services`),
        fetch(`/api/hotel/spa?type=therapists`),
        fetch(`/api/hotel/spa?type=settings`),
        fetch(`/api/hotel/portal-logins`),
      ]);

      const [apptData, svcData, thrData, setData, portData] = await Promise.all([
        apptRes.json(), svcRes.json(), thrRes.json(), setRes.json(), portRes.json()
      ]);

      setAppointments(Array.isArray(apptData.data) ? apptData.data : []);
      setServices(Array.isArray(svcData.data) ? svcData.data : []);
      setTherapists(Array.isArray(thrData.data) ? thrData.data : []);
      if (setData.data) setSpaSettings(prev => ({ ...prev, ...setData.data }));
      setPortals(Array.isArray(portData.data) ? portData.data : []);
    } catch (err) {
      toast.error('Failed to load spa and portal data');
    } finally {
      setLoading(false);
    }
  }, [selectedDate, showAll]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Appointment Status Change
  const handleStatusChange = async (id: string, status: string) => {
    try {
      await fetch('/api/hotel/spa', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      toast.success(`Appointment marked as ${status}`);
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

  // Add New Service Handler
  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceForm.name) return;
    try {
      const res = await fetch('/api/hotel/spa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'service',
          ...newServiceForm,
        }),
      });
      if (res.ok) {
        toast.success(`Service "${newServiceForm.name}" created at ₹${newServiceForm.price}!`);
        setShowAddService(false);
        setNewServiceForm({ name: '', category: 'Massage', price: 3500, duration: 60, description: '' });
        fetchAll();
      }
    } catch {
      toast.error('Error adding service');
    }
  };

  // Save Operational Settings Handler
  const handleSaveSpaSettings = async () => {
    setSettingsSaving(true);
    try {
      const res = await fetch('/api/hotel/spa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'settings',
          ...spaSettings,
        }),
      });
      if (res.ok) {
        toast.success('Spa operational settings & timing saved!');
        fetchAll();
      }
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSettingsSaving(false);
    }
  };

  // Stats
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

      {editingService && (
        <EditServicePriceModal
          service={editingService}
          onClose={() => setEditingService(null)}
          onUpdated={fetchAll}
        />
      )}

      {editingPortal && (
        <EditPortalLoginModal
          portal={editingPortal}
          onClose={() => setEditingPortal(null)}
          onUpdated={fetchAll}
        />
      )}

      {viewingQRPortal && (
        <PortalQRModal
          portal={viewingQRPortal}
          onClose={() => setViewingQRPortal(null)}
        />
      )}

      <div className="space-y-6 pb-12 animate-in fade-in duration-200">
        {/* ── Top Header ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-pink-400 flex items-center gap-1.5 mb-1">
              <Sparkles size={13} /> Wellness, Spa & Access Management
            </span>
            <h1 className="text-2xl md:text-3xl font-black text-white leading-none">
              Spa & Wellness Suite
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Guest appointments, treatment prices & menu, spa operational settings, and unified staff app logins.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start flex-wrap">
            <button
              onClick={() => { fetchAll(); toast.success('Spa and login credentials refreshed'); }}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Refresh"
            >
              <RefreshCw size={14} />
            </button>

            {tab === 'services' && (
              <button
                onClick={() => setShowAddService(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-black text-xs transition-all shadow-md active:scale-95"
              >
                <Plus size={14} /> + Add Spa Service
              </button>
            )}

            <button
              onClick={() => setShowBookModal(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-black text-xs transition-all shadow-lg shadow-pink-900/40 active:scale-95"
            >
              <Plus size={14} /> + Book Appointment
            </button>
          </div>
        </div>

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Appointments', value: appointments.length, color: 'text-pink-300 border-pink-500/20 bg-pink-900/20', icon: Calendar },
            { label: 'In Progress', value: inProgress, color: 'text-amber-300 border-amber-500/20 bg-amber-900/20', icon: Timer },
            { label: 'Completed', value: completed, color: 'text-emerald-300 border-emerald-500/20 bg-emerald-900/20', icon: CheckCircle2 },
            { label: 'Revenue Earned', value: `₹${revenue.toLocaleString()}`, color: 'text-violet-300 border-violet-500/20 bg-violet-900/20', icon: TrendingUp },
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

        {/* ── Tabs Navigation ── */}
        <div className="flex gap-2 sm:gap-4 border-b border-white/10 pb-3 overflow-x-auto text-xs font-black">
          {[
            { key: 'appointments', label: `Appointments (${appointments.length})`, icon: Calendar },
            { key: 'services', label: `Services & Prices (${services.length})`, icon: Sparkles },
            { key: 'therapists', label: `Therapists (${therapists.length})`, icon: Users },
            { key: 'settings', label: `Spa Settings & Timing`, icon: Settings },
            { key: 'logins', label: `Hotel Portals & Staff Logins`, icon: Key },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
                tab === key
                  ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/30'
                  : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* TAB 1: APPOINTMENTS                                                  */}
        {/* ══════════════════════════════════════════════════════════════════════ */}
        {tab === 'appointments' && (
          loading ? (
            <div className="flex items-center justify-center py-20 gap-3 text-slate-500">
              <Loader2 size={24} className="animate-spin text-pink-400" />
              <span className="text-sm font-bold">Loading spa schedule…</span>
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-20 rounded-3xl border border-white/5 bg-slate-900/40">
              <Sparkles size={40} className="text-pink-500/30 mx-auto mb-3" />
              <p className="text-slate-400 text-sm font-bold">No appointments yet</p>
              <p className="text-slate-600 text-xs mt-1">Click "+ Book Appointment" to create one</p>
              <button onClick={() => setShowBookModal(true)} className="mt-4 px-5 py-2 rounded-xl bg-pink-600 text-white text-xs font-black">
                + Book Appointment
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {appointments.map(a => (
                <div
                  key={a.id}
                  className={`rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-pink-500/20 transition-all ${
                    a.status === 'IN_PROGRESS' ? 'bg-amber-900/10 border-amber-500/20' : 'bg-slate-900/50 border-white/5'
                  }`}
                >
                  <div className="w-16 h-16 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex flex-col items-center justify-center shrink-0">
                    <span className="text-sm font-black text-pink-300">{a.bookingTime}</span>
                    <span className="text-[9px] text-slate-500">{a.duration}m</span>
                    <span className="text-[8px] text-slate-600 text-center">{new Date(a.bookingDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                  </div>

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

                  <div className="flex sm:flex-col items-center sm:items-end gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-black text-white">₹{a.amount.toLocaleString()}</p>
                      <p className="text-[9px] text-slate-500">{a.paymentType === 'ROOM_CHARGE' ? 'Room Folio' : a.paymentType}</p>
                    </div>
                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border ${STATUS_STYLE[a.status] || STATUS_STYLE.CONFIRMED}`}>
                      {a.status}
                    </span>
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

        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* TAB 2: SPA SERVICES & PRICES CATALOGUE                                */}
        {/* ══════════════════════════════════════════════════════════════════════ */}
        {tab === 'services' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/40 p-4 rounded-2xl border border-slate-800">
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Sparkles size={16} className="text-pink-400" /> Spa Treatment Menu & Live Rates
                </h3>
                <p className="text-xs text-slate-400">
                  {services.length} services available. Prices are synced directly with the guest in-room ordering app.
                </p>
              </div>

              <button
                onClick={() => setShowAddService(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-black text-xs transition-all shadow-md active:scale-95"
              >
                <Plus size={13} /> + Add Service
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
              <div key={cat} className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-pink-500/15 flex items-center justify-center">
                    {CATEGORY_ICON[cat] || <Sparkles size={14} className="text-pink-400" />}
                  </div>
                  <span className="text-xs font-black text-slate-200 uppercase tracking-wider">{cat}</span>
                  <span className="text-[10px] text-slate-500 font-bold">({svcs.length} treatments)</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {svcs.map(svc => (
                    <div
                      key={svc.id}
                      className="rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-pink-500/30 p-4 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                            {svc.category}
                          </span>
                          <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border ${svc.isActive ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-slate-500 bg-slate-800 border-slate-700'}`}>
                            {svc.isActive ? 'ACTIVE' : 'HIDDEN'}
                          </span>
                        </div>

                        <h4 className="text-sm font-black text-white">{svc.name}</h4>
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{svc.description || 'Premium relaxation therapy'}</p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                            <Clock size={10} /> {svc.duration} mins
                          </div>
                          <div className="text-base font-black text-emerald-400">
                            ₹{svc.price.toLocaleString('en-IN')}
                          </div>
                        </div>

                        <button
                          onClick={() => setEditingService(svc)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-pink-600 text-slate-300 hover:text-white text-[10.5px] font-bold transition-all"
                        >
                          <Edit3 size={11} /> Edit Price
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* TAB 3: THERAPISTS                                                    */}
        {/* ══════════════════════════════════════════════════════════════════════ */}
        {tab === 'therapists' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400">{therapists.length} registered wellness specialists</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              {therapists.map(t => (
                <div key={t.id} className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-5 transition-all">
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
                    <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
                      <Phone size={10} className="text-slate-500" />
                      <span>{t.phone}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* TAB 4: SPA SETTINGS & TIMING                                         */}
        {/* ══════════════════════════════════════════════════════════════════════ */}
        {tab === 'settings' && (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Clock size={16} className="text-pink-400" /> Spa Working Hours & Booking Policy
                </h3>
                <p className="text-xs text-slate-400">
                  Configure operational timings, session buffers, tax rate, and in-room billing rules.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Opening Time</label>
                  <input
                    type="time"
                    value={spaSettings.openTime}
                    onChange={e => setSpaSettings(s => ({ ...s, openTime: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Closing Time</label>
                  <input
                    type="time"
                    value={spaSettings.closeTime}
                    onChange={e => setSpaSettings(s => ({ ...s, closeTime: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Slot Interval</label>
                  <select
                    value={spaSettings.slotDuration}
                    onChange={e => setSpaSettings(s => ({ ...s, slotDuration: Number(e.target.value) }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  >
                    <option value={30}>Every 30 Minutes</option>
                    <option value={45}>Every 45 Minutes</option>
                    <option value={60}>Every 60 Minutes</option>
                    <option value={90}>Every 90 Minutes</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white block">Post to Room Folio Bill</span>
                    <span className="text-[11px] text-slate-400">Allow in-room guests to charge spa treatments to checkout bill.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={spaSettings.allowRoomCharge}
                    onChange={e => setSpaSettings(s => ({ ...s, allowRoomCharge: e.target.checked }))}
                    className="accent-pink-500 w-5 h-5 cursor-pointer"
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white block">Standard Spa GST / Tax</span>
                    <span className="text-[11px] text-slate-400">Government service tax applied to treatments.</span>
                  </div>
                  <div className="font-black text-pink-400 text-sm">18% GST</div>
                </div>
              </div>

              {/* Direct Booking QR & URL */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-pink-950/30 to-purple-950/30 border border-pink-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                    <QrCode size={14} className="text-pink-400" /> Guest Room Direct Spa Booking Link
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Share or embed this URL in room tablets so guests can browse therapies and schedule appointments.
                  </p>
                  <span className="inline-block mt-2 font-mono text-[10px] text-pink-300 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
                    http://localhost:3000/room-portal/dashboard/spa
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText('http://localhost:3000/room-portal/dashboard/spa');
                      toast.success('Spa Booking URL copied!');
                    }}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5"
                  >
                    <Copy size={13} /> Copy Link
                  </button>
                  <button
                    onClick={() => window.open('/room-portal', '_blank')}
                    className="px-3.5 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs flex items-center gap-1.5"
                  >
                    <ExternalLink size={13} /> Test View
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleSaveSpaSettings}
                  disabled={settingsSaving}
                  className="px-6 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-black text-xs shadow-md"
                >
                  {settingsSaving ? 'Saving…' : 'Save Spa Settings'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* TAB 5: UNIFIED HOTEL PORTALS & STAFF LOGINS                           */}
        {/* ══════════════════════════════════════════════════════════════════════ */}
        {tab === 'logins' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gradient-to-r from-purple-950/40 via-slate-900/60 to-indigo-950/40 p-4 rounded-2xl border border-purple-500/30">
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Key size={16} className="text-purple-400" /> Unified Hotel Portals & Staff Logins
                </h3>
                <p className="text-xs text-slate-400">
                  Manage access credentials, PIN codes, phone login QR codes, and web portals for all hotel departments in one place.
                </p>
              </div>

              <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                {portals.length} Configured Portals
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4">
              {portals.map(portal => {
                const isRevealed = !!revealedPins[portal.id];
                return (
                  <div
                    key={portal.id}
                    className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-purple-500/30 transition-all flex flex-col justify-between space-y-4"
                  >
                    <div>
                      {/* Badge & Role */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
                          {portal.role}
                        </span>
                        <button
                          onClick={() => setViewingQRPortal(portal)}
                          className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                          title="View QR Code"
                        >
                          <QrCode size={13} />
                        </button>
                      </div>

                      <h4 className="text-sm font-black text-white">{portal.portalName}</h4>
                      <p className="text-[10.5px] text-slate-500 mt-0.5 line-clamp-2">{portal.notes || portal.urlPath}</p>

                      {/* Credentials Display */}
                      <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-500 uppercase font-bold">Username</span>
                          <span className="font-mono text-slate-300 text-[11px] truncate max-w-[130px]">{portal.username}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-500 uppercase font-bold">Passcode</span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-purple-300 text-[11px]">
                              {isRevealed ? portal.passcode : '••••••••'}
                            </span>
                            <button
                              onClick={() => setRevealedPins(p => ({ ...p, [portal.id]: !p[portal.id] }))}
                              className="text-slate-500 hover:text-white"
                            >
                              {isRevealed ? <EyeOff size={11} /> : <Eye size={11} />}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-900">
                          <span className="text-[10px] text-slate-500 uppercase font-bold">Quick PIN</span>
                          <span className="font-mono font-black text-emerald-400 bg-slate-900 px-2 py-0.5 rounded text-[11px]">
                            {portal.pinCode || '1122'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2">
                      <button
                        onClick={() => setEditingPortal(portal)}
                        className="flex-1 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-[10.5px] transition-all text-center flex items-center justify-center gap-1"
                      >
                        <Edit3 size={11} /> Change PIN
                      </button>

                      <button
                        onClick={() => window.open(portal.urlPath, '_blank')}
                        className="p-2 rounded-xl bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white transition-all"
                        title="Launch Portal"
                      >
                        <ExternalLink size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Add New Spa Service Modal ── */}
        {showAddService && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowAddService(false)} />
            <div className="relative w-full max-w-md bg-slate-900 border border-pink-500/30 rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Plus size={16} className="text-pink-400" /> Add Spa Treatment & Price
                </h3>
                <button onClick={() => setShowAddService(false)} className="text-slate-400 hover:text-white">
                  <X size={15} />
                </button>
              </div>

              <form onSubmit={handleCreateService} className="space-y-3 text-xs">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Service Name *</label>
                  <input
                    placeholder="e.g. Balinese Deep Muscle Therapy"
                    value={newServiceForm.name}
                    onChange={e => setNewServiceForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Rate in INR (₹) *</label>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      value={newServiceForm.price}
                      onChange={e => setNewServiceForm(f => ({ ...f, price: Number(e.target.value) }))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-emerald-400 font-black text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Duration (Mins) *</label>
                    <input
                      type="number"
                      min="15"
                      step="15"
                      value={newServiceForm.duration}
                      onChange={e => setNewServiceForm(f => ({ ...f, duration: Number(e.target.value) }))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Category</label>
                  <select
                    value={newServiceForm.category}
                    onChange={e => setNewServiceForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                  >
                    {['Massage', 'Facial', 'Body', 'Wellness', 'Beauty', 'Couple', 'Aromatherapy', 'Hydrotherapy'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Description</label>
                  <textarea
                    rows={2}
                    placeholder="Short description shown to guests..."
                    value={newServiceForm.description}
                    onChange={e => setNewServiceForm(f => ({ ...f, description: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                  <button type="button" onClick={() => setShowAddService(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold">
                    Cancel
                  </button>
                  <button type="submit" className="px-5 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold shadow-md">
                    + Save to Price List
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
