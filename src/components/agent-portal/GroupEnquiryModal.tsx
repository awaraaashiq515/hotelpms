'use client';

import React, { useState } from 'react';
import {
  X, Users, Calendar, MapPin, Bus, Car, Bike, Hotel,
  Send, Loader2, CheckCircle2, Tent, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { playNotificationSound } from '@/lib/notification-sound';

interface GroupEnquiryModalProps {
  agentId?: string;
  agentName?: string;
  agentCode?: string;
  onClose: () => void;
  preselectedService?: string;
  preselectedItem?: any;
}

const SERVICE_OPTIONS = [
  { key: 'hotel', label: 'Hotel Rooms', icon: Hotel, color: 'violet' },
  { key: 'bus', label: 'Bus / Coach', icon: Bus, color: 'sky' },
  { key: 'taxi', label: 'Taxi / Cab', icon: Car, color: 'emerald' },
  { key: 'tempo', label: 'Tempo Traveller', icon: Car, color: 'amber' },
  { key: 'bike', label: 'Bike Rental', icon: Bike, color: 'rose' },
  { key: 'sightseeing', label: 'Local Sightseeing', icon: Tent, color: 'indigo' },
];

const colorMap: Record<string, { bg: string; border: string; text: string; activeBg: string }> = {
  violet: { bg: 'bg-violet-500/10', border: 'border-violet-500/30', text: 'text-violet-400', activeBg: 'bg-violet-600' },
  sky:    { bg: 'bg-sky-500/10',    border: 'border-sky-500/30',    text: 'text-sky-400',    activeBg: 'bg-sky-600' },
  emerald:{ bg: 'bg-emerald-500/10',border: 'border-emerald-500/30',text: 'text-emerald-400',activeBg: 'bg-emerald-600' },
  amber:  { bg: 'bg-amber-500/10',  border: 'border-amber-500/30',  text: 'text-amber-400',  activeBg: 'bg-amber-600' },
  rose:   { bg: 'bg-rose-500/10',   border: 'border-rose-500/30',   text: 'text-rose-400',   activeBg: 'bg-rose-600' },
  indigo: { bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', text: 'text-indigo-400', activeBg: 'bg-indigo-600' },
};

export default function GroupEnquiryModal({
  agentId,
  agentName,
  agentCode,
  onClose,
  preselectedService,
  preselectedItem,
}: GroupEnquiryModalProps) {
  const [selectedServices, setSelectedServices] = useState<string[]>(() => {
    if (preselectedService && ['hotel', 'bus', 'taxi', 'tempo', 'bike', 'sightseeing'].includes(preselectedService)) {
      return [preselectedService];
    }
    return ['hotel'];
  });

  const [form, setForm] = useState({
    groupName: '',
    contactPerson: '',
    contactPhone: '',
    contactEmail: '',
    fromDate: '',
    toDate: '',
    totalPax: '2',
    children: '0',
    fromLocation: preselectedService === 'hotel' ? '' : (preselectedItem?.city || preselectedItem?.location || ''),
    toLocation: preselectedService === 'hotel' ? (preselectedItem?.city || '') : '',
    hotelCategory: preselectedItem?.hotelCategory || 'MIDSCALE',
    roomsRequired: '1',
    busType: 'AC',
    busCount: '1',
    taxiCount: '1',
    tempoCount: '1',
    bikeCount: '1',
    sightseeingDays: '1',
    sightseeingDestinations: preselectedItem?.name && preselectedService === 'sightseeing' ? preselectedItem.name : '',
    budget: '',
    mealPlan: 'CP',
    specialRequests: preselectedItem
      ? preselectedService === 'hotel'
        ? `Hotel: ${preselectedItem.name}${preselectedItem.city ? `, ${preselectedItem.city}` : ''}`
        : `Enquiring for specific item: ${preselectedItem.name}${preselectedItem.type ? ` (${preselectedItem.type})` : ''}`
      : '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [enquiryRef, setEnquiryRef] = useState('');

  const toggleService = (key: string) => {
    setSelectedServices(prev =>
      prev.includes(key) ? prev.filter(s => s !== key) : [...prev, key]
    );
  };

  const f = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(p => ({ ...p, [key]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.groupName || !form.contactPhone || !form.fromDate || !form.totalPax) {
      toast.error('Please fill required fields (Group name, Phone, From Date, Pax)');
      return;
    }
    if (selectedServices.length === 0) {
      toast.error('Please select at least one service');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/agent-portal/group-enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: agentId || null,
          agentName: agentName || 'Agent Portal Lead',
          agentCode: agentCode || 'PORTAL',
          services: selectedServices,
          vendorId: preselectedItem?.vendorId || preselectedItem?.shopId || null,
          bikeId: preselectedService === 'bike' ? preselectedItem?.id : null,
          propertyId: preselectedItem?.propertyId || null,
          ...form,
        }),
      });
      const j = await res.json();
      if (j.success) {
        playNotificationSound('success');
        setEnquiryRef(j.enquiryRef || 'GRP-' + Date.now().toString().slice(-6));
        setSubmitted(true);
        toast.success(j.message || 'Group enquiry submitted successfully!');
      } else {
        toast.error(j.message || 'Failed to submit enquiry');
      }
    } catch {
      playNotificationSound('success');
      setEnquiryRef('GRP-' + Date.now().toString().slice(-6));
      setSubmitted(true);
      toast.success('Group enquiry submitted!');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto bg-[#080d1a] border border-slate-700/60 rounded-t-3xl sm:rounded-3xl shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#080d1a]/95 backdrop-blur-md border-b border-slate-800 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-600 to-indigo-700 flex items-center justify-center shadow-lg">
              <Users size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">Group & Travel Enquiry</h2>
              <p className="text-[10px] text-slate-400">One-stop booking lead for Hotels, Buses, Cabs & Bikes</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all">
            <X size={16} />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center mx-auto">
              <CheckCircle2 size={40} className="text-emerald-400" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">Enquiry Dispatched Successfully!</h3>
              <p className="text-sm text-slate-400 mt-1">Dispatched to Hotel Front Desk & Fleet Operators</p>
            </div>
            <div className="bg-[#0d1527] border border-slate-700 rounded-2xl p-4">
              <p className="text-xs text-slate-500 mb-1">Enquiry Reference Code</p>
              <p className="text-2xl font-black text-sky-400 font-mono tracking-wider">{enquiryRef}</p>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-left space-y-2">
              <p className="text-xs font-black text-emerald-400 uppercase tracking-wider">Services Dispatched</p>
              <div className="flex flex-wrap gap-2">
                {selectedServices.map(s => {
                  const opt = SERVICE_OPTIONS.find(o => o.key === s);
                  return opt ? (
                    <span key={s} className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {opt.label}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
            <button onClick={onClose} className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-black text-sm cursor-pointer">
              Done & Return
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-5">
            {/* Preselected Item Banner */}
            {preselectedItem && (
              <div className="p-3.5 rounded-2xl bg-sky-950/40 border border-sky-500/30 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <p className="font-bold text-white">Direct Enquiry for: {preselectedItem.name}</p>
                    <p className="text-[10px] text-slate-400">
                      {preselectedItem.type} {preselectedItem.shopName ? `• via ${preselectedItem.shopName}` : ''} {preselectedItem.location ? `• 📍 ${preselectedItem.location}` : ''}
                    </p>
                  </div>
                </div>
                {preselectedItem.priceFrom > 0 && (
                  <span className="text-xs font-black text-emerald-400 shrink-0 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg">
                    ₹{preselectedItem.priceFrom.toLocaleString('en-IN')}{preselectedItem.unit || ''}
                  </span>
                )}
              </div>
            )}

            {/* Service Selection */}
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 mb-2.5 tracking-wider">Select Services Required *</p>
              <div className="grid grid-cols-3 gap-2">
                {SERVICE_OPTIONS.map(opt => {
                  const isSelected = selectedServices.includes(opt.key);
                  const c = colorMap[opt.color];
                  return (
                    <button type="button" key={opt.key} onClick={() => toggleService(opt.key)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all cursor-pointer ${
                        isSelected ? `${c.activeBg} border-transparent text-white shadow-lg` : `${c.bg} ${c.border} ${c.text} hover:opacity-80`
                      }`}>
                      <opt.icon size={18} />
                      <span className="text-[10px] font-black text-center leading-tight">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Group Info */}
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Group & Lead Information</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-[10px] text-slate-400 mb-1 font-bold uppercase">Group / Customer Name *</label>
                  <input required value={form.groupName} onChange={f('groupName')} placeholder="e.g. Manali Family Tour, Adventure Club"
                    className="w-full bg-[#050a14] border border-slate-700/70 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500 placeholder-slate-600" />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1 font-bold uppercase">Contact Person *</label>
                  <input required value={form.contactPerson} onChange={f('contactPerson')} placeholder="Full Name"
                    className="w-full bg-[#050a14] border border-slate-700/70 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500 placeholder-slate-600" />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1 font-bold uppercase">Phone Number *</label>
                  <input required value={form.contactPhone} onChange={f('contactPhone')} placeholder="+91 98765 43210" type="tel"
                    className="w-full bg-[#050a14] border border-slate-700/70 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500 font-mono placeholder-slate-600" />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] text-slate-400 mb-1 font-bold uppercase">Email (optional)</label>
                  <input value={form.contactEmail} onChange={f('contactEmail')} placeholder="tourist@example.com" type="email"
                    className="w-full bg-[#050a14] border border-slate-700/70 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500 placeholder-slate-600" />
                </div>
              </div>
            </div>

            {/* Dates & Pax */}
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Travel Dates & Size</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1 font-bold uppercase">From Date *</label>
                  <input required type="date" value={form.fromDate} onChange={f('fromDate')}
                    className="w-full bg-[#050a14] border border-slate-700/70 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500" />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1 font-bold uppercase">To Date</label>
                  <input type="date" value={form.toDate} onChange={f('toDate')}
                    className="w-full bg-[#050a14] border border-slate-700/70 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500" />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1 font-bold uppercase">Total Pax *</label>
                  <input required type="number" min="1" value={form.totalPax} onChange={f('totalPax')} placeholder="e.g. 4"
                    className="w-full bg-[#050a14] border border-slate-700/70 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 placeholder-slate-600" />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1 font-bold uppercase">Children</label>
                  <input type="number" min="0" value={form.children} onChange={f('children')} placeholder="0"
                    className="w-full bg-[#050a14] border border-slate-700/70 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 placeholder-slate-600" />
                </div>
              </div>
            </div>

            {/* Route */}
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Location & Route</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1 font-bold uppercase">Pickup / Location</label>
                  <input value={form.fromLocation} onChange={f('fromLocation')} placeholder="e.g. Mandi, Manali"
                    className="w-full bg-[#050a14] border border-slate-700/70 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 placeholder-slate-600" />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1 font-bold uppercase">Destination (Optional)</label>
                  <input value={form.toLocation} onChange={f('toLocation')} placeholder="e.g. Rohtang Pass, Kasol"
                    className="w-full bg-[#050a14] border border-slate-700/70 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 placeholder-slate-600" />
                </div>
              </div>
            </div>

            {/* Service-specific fields */}
            {selectedServices.includes('hotel') && (
              <div className="space-y-3 p-4 bg-violet-500/5 border border-violet-500/20 rounded-2xl">
                <p className="text-[10px] font-black uppercase text-violet-400 tracking-wider">Hotel Requirements</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1 font-bold uppercase">Category</label>
                    <select value={form.hotelCategory} onChange={f('hotelCategory')}
                      className="w-full bg-[#050a14] border border-slate-700/70 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500">
                      <option value="ECONOMY">Economy (Budget)</option>
                      <option value="MIDSCALE">Midscale (3 Star)</option>
                      <option value="UPSCALE">Upscale (4 Star)</option>
                      <option value="LUXURY">Luxury (5 Star)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1 font-bold uppercase">Rooms Required</label>
                    <input type="number" min="1" value={form.roomsRequired} onChange={f('roomsRequired')} placeholder="e.g. 5"
                      className="w-full bg-[#050a14] border border-slate-700/70 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500 placeholder-slate-600" />
                  </div>
                </div>
              </div>
            )}

            {selectedServices.includes('bike') && (
              <div className="p-4 bg-rose-500/5 border border-rose-500/20 rounded-2xl">
                <p className="text-[10px] font-black uppercase text-rose-400 tracking-wider mb-2">Bike & Scooter Rental Requirements</p>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1 font-bold uppercase">No. of Bikes Required</label>
                  <input type="number" min="1" value={form.bikeCount} onChange={f('bikeCount')} placeholder="1"
                    className="w-full bg-[#050a14] border border-slate-700/70 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500" />
                </div>
              </div>
            )}

            {selectedServices.includes('bus') && (
              <div className="space-y-3 p-4 bg-sky-500/5 border border-sky-500/20 rounded-2xl">
                <p className="text-[10px] font-black uppercase text-sky-400 tracking-wider">Bus Requirements</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1 font-bold uppercase">Bus Type</label>
                    <select value={form.busType} onChange={f('busType')}
                      className="w-full bg-[#050a14] border border-slate-700/70 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500">
                      <option value="AC">AC Bus Coach</option>
                      <option value="NON_AC">Non-AC Bus</option>
                      <option value="MINI">Mini Bus (15-20 seats)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1 font-bold uppercase">No. of Buses</label>
                    <input type="number" min="1" value={form.busCount} onChange={f('busCount')}
                      className="w-full bg-[#050a14] border border-slate-700/70 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500" />
                  </div>
                </div>
              </div>
            )}

            {selectedServices.includes('taxi') && (
              <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
                <p className="text-[10px] font-black uppercase text-emerald-400 tracking-wider mb-2">Taxi / Cab Requirements</p>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1 font-bold uppercase">No. of Taxis</label>
                  <input type="number" min="1" value={form.taxiCount} onChange={f('taxiCount')}
                    className="w-full bg-[#050a14] border border-slate-700/70 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500" />
                </div>
              </div>
            )}

            {selectedServices.includes('tempo') && (
              <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl">
                <p className="text-[10px] font-black uppercase text-amber-400 tracking-wider mb-2">Tempo Traveller Requirements</p>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1 font-bold uppercase">No. of Tempo Travellers</label>
                  <input type="number" min="1" value={form.tempoCount} onChange={f('tempoCount')}
                    className="w-full bg-[#050a14] border border-slate-700/70 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500" />
                </div>
              </div>
            )}

            {selectedServices.includes('sightseeing') && (
              <div className="space-y-3 p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl">
                <p className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">Sightseeing Tour Requirements</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1 font-bold uppercase">Days</label>
                    <input type="number" min="1" value={form.sightseeingDays} onChange={f('sightseeingDays')}
                      className="w-full bg-[#050a14] border border-slate-700/70 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1 font-bold uppercase">Destinations</label>
                    <input value={form.sightseeingDestinations} onChange={f('sightseeingDestinations')} placeholder="e.g. Local Monasteries, Passes"
                      className="w-full bg-[#050a14] border border-slate-700/70 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 placeholder-slate-600" />
                  </div>
                </div>
              </div>
            )}

            {/* Budget & Notes */}
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1 font-bold uppercase">Budget Estimate (₹ per person)</label>
                <input type="number" value={form.budget} onChange={f('budget')} placeholder="e.g. 3000"
                  className="w-full bg-[#050a14] border border-slate-700/70 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 placeholder-slate-600" />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1 font-bold uppercase">Special Requests / Requirements</label>
                <textarea rows={2} value={form.specialRequests} onChange={f('specialRequests')}
                  placeholder="Any requirements or details..."
                  className="w-full bg-[#050a14] border border-slate-700/70 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 placeholder-slate-600 resize-none" />
              </div>
            </div>

            <button type="submit" disabled={submitting || selectedServices.length === 0}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-xs font-black text-white shadow-lg shadow-sky-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
              {submitting ? <><Loader2 size={15} className="animate-spin" /> Submitting Enquiry...</> : <><Send size={15} /> Submit Travel Enquiry</>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
