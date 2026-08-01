'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings, Building2, Clock, Star, Percent, Utensils,
  XCircle, MessageSquare, Phone, Globe, Users, Shield,
  Save, ChevronDown, ChevronUp, CheckCircle2, RefreshCw, Hotel, ExternalLink, Key, Lock,
} from 'lucide-react';

interface SettingSection {
  id: string;
  emoji: string;
  title: string;
  desc: string;
  color: string;
}

const SECTIONS: SettingSection[] = [
  { id: 'property',      emoji: '🏨', title: 'Property Info',        desc: 'Name, address, star rating, category',     color: 'text-indigo-400' },
  { id: 'timing',        emoji: '⏰', title: 'Check-in / Check-out', desc: 'Standard times, early/late policy',         color: 'text-sky-400' },
  { id: 'rates',         emoji: '💰', title: 'Rate Settings',        desc: 'Base rates, seasonal pricing, weekend',     color: 'text-emerald-400' },
  { id: 'taxes',         emoji: '📋', title: 'Tax Configuration',    desc: 'GST %, service charge, inclusive/exclusive',color: 'text-amber-400' },
  { id: 'meals',         emoji: '🍽️', title: 'Meal Plans',           desc: 'EP, CP, MAP, AP — rates per person',        color: 'text-orange-400' },
  { id: 'cancellation',  emoji: '❌', title: 'Cancellation Policy',  desc: 'Refund rules based on days before arrival', color: 'text-rose-400' },
  { id: 'communication', emoji: '💬', title: 'Communication',        desc: 'SMS, Email, WhatsApp templates',            color: 'text-violet-400' },
  { id: 'users',         emoji: '👥', title: 'User Management',      desc: 'Staff roles: Receptionist, HK, Manager',   color: 'text-pink-400' },
  { id: 'ota',           emoji: '🌐', title: 'OTA & Channels',       desc: 'Booking.com, MakeMyTrip, OYO labels',      color: 'text-cyan-400' },
  { id: 'audit',         emoji: '🔐', title: 'Audit Log',            desc: 'Who did what and when',                    color: 'text-slate-400' },
  { id: 'guestportal',   emoji: '🛎️', title: 'Guest Portal Settings', desc: 'Self-service portal for guests to view bookings', color: 'text-emerald-400' },
  { id: 'wifirules',     emoji: '📶', title: 'WiFi & House Rules',    desc: 'WiFi network name, password, and stay timings shown to guests', color: 'text-indigo-400' },
  { id: 'roomcharging',  emoji: '🏨', title: 'Restaurant Room Billing', desc: 'Allow restaurant guests to charge food bill to their hotel room', color: 'text-violet-400' },
];

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative w-10 h-5 rounded-full transition-colors duration-300 ${value ? 'bg-indigo-500' : 'bg-slate-700'}`}
    >
      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${value ? 'left-5' : 'left-0.5'}`} />
    </button>
  );
}

function SectionCard({ section, children }: { section: SettingSection; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`rounded-2xl bg-slate-900/60 border border-slate-800/60 overflow-hidden transition-all duration-200 ${open ? 'border-slate-700/60' : 'hover:border-slate-700/40'}`}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-4 p-5 text-left group"
      >
        <div className="text-2xl shrink-0">{section.emoji}</div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-black ${section.color} leading-tight`}>{section.title}</p>
          <p className="text-[10px] text-slate-600 font-bold mt-0.5">{section.desc}</p>
        </div>
        <div className="shrink-0 text-slate-600">
          {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </div>
      </button>
      {open && (
        <div className="border-t border-slate-800/40 px-5 py-5">
          {children}
        </div>
      )}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-400 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-[9px] text-slate-700 mt-1">{hint}</p>}
    </div>
  );
}

const inputClass = "w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-semibold placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all";

export default function HotelSettingsPage() {
  const [saved, setSaved] = useState(false);
  const [propertyId, setPropertyId] = useState('');

  // Property
  const [propertyName, setPropertyName] = useState('');
  const [address, setAddress] = useState('');
  const [starRating, setStarRating] = useState('3');
  const [category, setCategory] = useState('MIDSCALE');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');

  // Timing
  const [checkIn, setCheckIn] = useState('14:00');
  const [checkOut, setCheckOut] = useState('11:00');
  const [earlyCheckIn, setEarlyCheckIn] = useState(false);
  const [lateCheckOut, setLateCheckOut] = useState(false);
  const [earlyCharge, setEarlyCharge] = useState('500');
  const [lateCharge, setLateCharge] = useState('500');

  // WiFi & House Rules Timings
  const [hotelWifiName, setHotelWifiName] = useState('');
  const [hotelWifiPassword, setHotelWifiPassword] = useState('');
  const [breakfastTimings, setBreakfastTimings] = useState('');
  const [poolTimings, setPoolTimings] = useState('');
  const [gymTimings, setGymTimings] = useState('');
  const [checkoutPolicy, setCheckoutPolicy] = useState('');

  // Taxes
  const [gstPercent, setGstPercent] = useState('12');
  const [serviceCharge, setServiceCharge] = useState('0');
  const [taxType, setTaxType] = useState('EXCLUSIVE');

  // Meal Plans
  const [epEnabled, setEpEnabled] = useState(true);
  const [cpEnabled, setCpEnabled] = useState(true);
  const [mapEnabled, setMapEnabled] = useState(false);
  const [apEnabled, setApEnabled] = useState(false);
  const [cpRate, setCpRate] = useState('150');
  const [mapRate, setMapRate] = useState('350');
  const [apRate, setApRate] = useState('600');

  // Cancellation
  const [freeCancelDays, setFreeCancelDays] = useState('3');
  const [cancelCharge, setCancelCharge] = useState('1000');

  // Communication
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(true);

  // Guest Portal
  const [guestPortalEnabled, setGuestPortalEnabled] = useState(true);
  const [guestPortalPasswordMode, setGuestPortalPasswordMode] = useState<'PHONE' | 'CUSTOM'>('PHONE');
  const [guestPortalDefaultPassword, setGuestPortalDefaultPassword] = useState('welcome@123');

  // Restaurant Room Billing
  const [restaurantRoomChargingEnabled, setRestaurantRoomChargingEnabled] = useState(false);

  // Fetch settings on mount
  useEffect(() => {
    fetch('/api/setup/properties/current')
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data) {
          const p = d.data;
          setPropertyId(p.id || '');
          setPropertyName(p.name || '');
          setAddress(p.address || '');
          setPhone(p.phone || '');
          setEmail(p.email || '');
          setWebsite(p.website || '');
          setStarRating(String(p.starRating || '3'));
          setCategory(p.hotelCategory || 'MIDSCALE');
          setCheckIn(p.checkInTime || '14:00');
          setCheckOut(p.checkOutTime || '11:00');

          // Load guest portal settings
          setGuestPortalEnabled(p.guestPortalEnabled !== false);
          setGuestPortalPasswordMode(p.guestPortalPasswordMode || 'PHONE');
          setGuestPortalDefaultPassword(p.guestPortalDefaultPassword || 'welcome@123');

          // Load WiFi & House Rules Timings
          setHotelWifiName(p.hotelWifiName || '');
          setHotelWifiPassword(p.hotelWifiPassword || '');
          setBreakfastTimings(p.breakfastTimings || '');
          setPoolTimings(p.poolTimings || '');
          setGymTimings(p.gymTimings || '');
          setCheckoutPolicy(p.checkoutPolicy || '');

          // Load Restaurant Room Billing
          setRestaurantRoomChargingEnabled(p.restaurantRoomChargingEnabled === true);
        }
      })
      .catch(err => console.error('Error fetching settings:', err));
  }, []);

  const handleSave = async () => {
    if (!propertyId) return;
    try {
      const res = await fetch(`/api/setup/properties/${propertyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: propertyName,
          address,
          phone,
          email,
          website,
          starRating: Number(starRating),
          hotelCategory: category,
          checkInTime: checkIn,
          checkOutTime: checkOut,
          guestPortalEnabled,
          guestPortalPasswordMode,
          guestPortalDefaultPassword,
          hotelWifiName,
          hotelWifiPassword,
          breakfastTimings,
          poolTimings,
          gymTimings,
          checkoutPolicy,
          restaurantRoomChargingEnabled,
        })
      });
      const data = await res.json();
      if (data.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      } else {
        alert(data.message || 'Failed to save settings.');
      }
    } catch (err) {
      console.error('Save settings error:', err);
      alert('Failed to save settings.');
    }
  };

  return (
    <div className="space-y-6 pb-10 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Settings className="text-slate-400" size={24} /> Hotel Settings
          </h1>
          <p className="text-xs text-slate-500 font-bold mt-1">Configure your property's behaviour and policies</p>
        </div>
        <button
          onClick={handleSave}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all shadow-lg ${
            saved ? 'bg-emerald-600 shadow-emerald-900/40' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/40'
          }`}
        >
          {saved ? <><CheckCircle2 size={14} /> Saved!</> : <><Save size={14} /> Save Changes</>}
        </button>
      </div>

      <div className="space-y-3">

        {/* Property Info */}
        <SectionCard section={SECTIONS[0]}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Hotel Name"><input value={propertyName} onChange={e => setPropertyName(e.target.value)} placeholder="e.g. Hotel Paradise" className={inputClass} /></Field>
            <Field label="Phone"><input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 9876543210" className={inputClass} /></Field>
            <Field label="Email"><input value={email} onChange={e => setEmail(e.target.value)} placeholder="hotel@example.com" className={inputClass} /></Field>
            <Field label="Website"><input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://..." className={inputClass} /></Field>
            <Field label="Star Rating">
              <select value={starRating} onChange={e => setStarRating(e.target.value)} className={inputClass}>
                {[1,2,3,4,5].map(n => <option key={n} value={n}>{'⭐'.repeat(n)} {n} Star</option>)}
              </select>
            </Field>
            <Field label="Category">
              <select value={category} onChange={e => setCategory(e.target.value)} className={inputClass}>
                <option value="BUDGET">🏠 Budget</option>
                <option value="MIDSCALE">🏨 Midscale</option>
                <option value="LUXURY">🌟 Luxury</option>
                <option value="BOUTIQUE">💎 Boutique</option>
              </select>
            </Field>
            <div className="col-span-full">
              <Field label="Address"><textarea value={address} onChange={e => setAddress(e.target.value)} rows={2} placeholder="Full address…" className={`${inputClass} resize-none`} /></Field>
            </div>
          </div>
        </SectionCard>

        {/* Check-in / Check-out Timing */}
        <SectionCard section={SECTIONS[1]}>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Field label="Standard Check-in Time"><input type="time" value={checkIn} onChange={e => setCheckIn(e.target.value)} className={inputClass} /></Field>
            <Field label="Standard Check-out Time"><input type="time" value={checkOut} onChange={e => setCheckOut(e.target.value)} className={inputClass} /></Field>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5">
              <div>
                <p className="text-xs font-bold text-white">Early Check-in Available</p>
                <p className="text-[9px] text-slate-600">Allow guests to check-in before standard time</p>
              </div>
              <Toggle value={earlyCheckIn} onChange={setEarlyCheckIn} />
            </div>
            {earlyCheckIn && <Field label="Early Check-in Charge (₹/hour)"><input type="number" value={earlyCharge} onChange={e => setEarlyCharge(e.target.value)} placeholder="500" className={inputClass} /></Field>}
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5">
              <div>
                <p className="text-xs font-bold text-white">Late Check-out Available</p>
                <p className="text-[9px] text-slate-600">Allow guests to extend stay after standard checkout</p>
              </div>
              <Toggle value={lateCheckOut} onChange={setLateCheckOut} />
            </div>
            {lateCheckOut && <Field label="Late Check-out Charge (₹/hour)"><input type="number" value={lateCharge} onChange={e => setLateCharge(e.target.value)} placeholder="500" className={inputClass} /></Field>}
          </div>
        </SectionCard>

        {/* Tax Configuration */}
        <SectionCard section={SECTIONS[3]}>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Field label="GST %" hint="Applicable GST percentage on room tariff">
              <input type="number" value={gstPercent} onChange={e => setGstPercent(e.target.value)} placeholder="12" className={inputClass} />
            </Field>
            <Field label="Service Charge %" hint="0% if not applicable">
              <input type="number" value={serviceCharge} onChange={e => setServiceCharge(e.target.value)} placeholder="0" className={inputClass} />
            </Field>
          </div>
          <Field label="Tax Display">
            <div className="flex gap-2">
              {['EXCLUSIVE', 'INCLUSIVE'].map(t => (
                <button key={t} onClick={() => setTaxType(t)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${taxType === t ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' : 'bg-white/[0.02] border-white/8 text-slate-500 hover:text-slate-300'}`}>
                  {t === 'EXCLUSIVE' ? '+ Tax on top' : 'Tax included'}
                </button>
              ))}
            </div>
          </Field>
        </SectionCard>

        {/* Meal Plans */}
        <SectionCard section={SECTIONS[4]}>
          <div className="space-y-3">
            {[
              { key: 'EP', label: 'EP — European Plan', desc: 'Room only, no meals', enabled: epEnabled, setEnabled: setEpEnabled, rate: null },
              { key: 'CP', label: 'CP — Continental Plan', desc: 'Room + Breakfast', enabled: cpEnabled, setEnabled: setCpEnabled, rate: cpRate, setRate: setCpRate },
              { key: 'MAP', label: 'MAP — Modified American', desc: 'Room + Breakfast + Dinner', enabled: mapEnabled, setEnabled: setMapEnabled, rate: mapRate, setRate: setMapRate },
              { key: 'AP', label: 'AP — American Plan', desc: 'Room + All 3 meals', enabled: apEnabled, setEnabled: setApEnabled, rate: apRate, setRate: setApRate },
            ].map(plan => (
              <div key={plan.key} className="p-3 rounded-xl bg-white/[0.03] border border-white/8">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-xs font-bold text-white">{plan.label}</p>
                    <p className="text-[9px] text-slate-600">{plan.desc}</p>
                  </div>
                  <Toggle value={plan.enabled} onChange={plan.setEnabled} />
                </div>
                {plan.enabled && plan.rate !== null && plan.setRate && (
                  <Field label="Extra charge per person (₹)">
                    <input type="number" value={plan.rate} onChange={e => plan.setRate!(e.target.value)} placeholder="150" className={inputClass} />
                  </Field>
                )}
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Cancellation Policy */}
        <SectionCard section={SECTIONS[5]}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Free Cancellation Window" hint="Number of days before arrival for free cancel">
              <input type="number" value={freeCancelDays} onChange={e => setFreeCancelDays(e.target.value)} placeholder="3" className={inputClass} />
            </Field>
            <Field label="Cancellation Charge (₹)" hint="Charge if cancelled within the window">
              <input type="number" value={cancelCharge} onChange={e => setCancelCharge(e.target.value)} placeholder="1000" className={inputClass} />
            </Field>
          </div>
        </SectionCard>

        {/* Communication */}
        <SectionCard section={SECTIONS[6]}>
          <div className="space-y-3">
            {[
              { label: 'WhatsApp Notifications', desc: 'Send booking confirmations via WhatsApp', value: whatsappEnabled, set: setWhatsappEnabled },
              { label: 'SMS Notifications', desc: 'Send SMS alerts to guests', value: smsEnabled, set: setSmsEnabled },
              { label: 'Email Notifications', desc: 'Send emails for bookings, invoices', value: emailEnabled, set: setEmailEnabled },
            ].map(n => (
              <div key={n.label} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/8">
                <div>
                  <p className="text-xs font-bold text-white">{n.label}</p>
                  <p className="text-[9px] text-slate-600">{n.desc}</p>
                </div>
                <Toggle value={n.value} onChange={n.set} />
              </div>
            ))}
          </div>
        </SectionCard>

        {/* OTA Channels */}
        <SectionCard section={SECTIONS[8]}>
          <div className="space-y-2">
            <p className="text-xs text-slate-500 mb-3">Label bookings from each channel for reporting</p>
            {['Booking.com', 'MakeMyTrip', 'OYO', 'Airbnb', 'Goibibo', 'Direct Website', 'Phone / Walk-in'].map(ota => (
              <div key={ota} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center">
                  <Globe size={12} className="text-slate-600" />
                </div>
                <p className="text-xs text-slate-400 font-bold flex-1">{ota}</p>
                <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/15">Active</span>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Guest Portal Settings */}
        <SectionCard section={SECTIONS[10]}>
          <div className="space-y-5">
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/8">
              <div>
                <p className="text-xs font-bold text-white">Enable Guest Self-Service Portal</p>
                <p className="text-[9px] text-slate-600 mt-0.5">When enabled, guests receive login credentials automatically upon booking confirmation</p>
              </div>
              <Toggle value={guestPortalEnabled} onChange={setGuestPortalEnabled} />
            </div>

            {guestPortalEnabled && (
              <>
                {/* Portal URL */}
                <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                  <p className="text-[10px] font-black uppercase tracking-wider text-emerald-400 mb-1">Guest Portal URL</p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs text-emerald-300 font-mono flex-1">
                      {typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/guest-portal
                    </code>
                    <a
                      href="/guest-portal"
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                    >
                      <ExternalLink size={11} /> Open Portal
                    </a>
                  </div>
                </div>

                {/* Password Mode */}
                <Field label="Guest Password Mode" hint="How is the guest's login password determined?">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setGuestPortalPasswordMode('PHONE')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        guestPortalPasswordMode === 'PHONE'
                          ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-300'
                          : 'border-white/8 bg-white/[0.02] text-slate-400 hover:border-white/15'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Phone size={13} />
                        <span className="text-xs font-black">Phone Number</span>
                      </div>
                      <p className="text-[9px] opacity-70">Guest's mobile number becomes their password (e.g. 9876543210)</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setGuestPortalPasswordMode('CUSTOM')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        guestPortalPasswordMode === 'CUSTOM'
                          ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-300'
                          : 'border-white/8 bg-white/[0.02] text-slate-400 hover:border-white/15'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Key size={13} />
                        <span className="text-xs font-black">Custom Password</span>
                      </div>
                      <p className="text-[9px] opacity-70">All guests get the same default password you set below</p>
                    </button>
                  </div>
                </Field>

                {guestPortalPasswordMode === 'CUSTOM' && (
                  <Field label="Default Password" hint="This password will be sent to all new guests">
                    <div className="relative">
                      <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="text"
                        value={guestPortalDefaultPassword}
                        onChange={(e) => setGuestPortalDefaultPassword(e.target.value)}
                        placeholder="e.g. welcome@123"
                        className={`${inputClass} pl-9`}
                      />
                    </div>
                  </Field>
                )}

                <div className="p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/15 text-[10px] text-slate-400 leading-relaxed">
                  <span className="text-indigo-400 font-black">ℹ️ How it works: </span>
                  When a booking is confirmed, the system automatically sends the guest a WhatsApp/Email message with their login credentials. The guest can then log in to the portal to view their booking details, billing breakdown, and stay information.
                </div>
              </>
            )}
          </div>
        </SectionCard>

        {/* Restaurant Room Billing */}
        <SectionCard section={SECTIONS[12]}>
          <div className="space-y-5">
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/8">
              <div>
                <p className="text-xs font-bold text-white">Enable Restaurant → Room Billing</p>
                <p className="text-[9px] text-slate-600 mt-0.5">
                  When ON, staff can select a guest's room when opening a table in the restaurant,
                  so the food bill is directly posted to the room folio.
                </p>
              </div>
              <Toggle value={restaurantRoomChargingEnabled} onChange={setRestaurantRoomChargingEnabled} />
            </div>

            {restaurantRoomChargingEnabled && (
              <>
                <div className="p-4 rounded-xl bg-violet-500/5 border border-violet-500/15">
                  <p className="text-[10px] font-black uppercase tracking-wider text-violet-400 mb-2">✅ Feature is Active</p>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    When a staff member clicks a <span className="text-white font-bold">vacant table</span> in the restaurant, a popup will appear asking:
                  </p>
                  <ul className="mt-2 space-y-1 text-[10px] text-slate-500">
                    <li className="flex items-start gap-2">
                      <span className="text-violet-400 mt-0.5">🏨</span>
                      <span><span className="text-white font-bold">Hotel Guest</span> — Select the guest's room; the entire food bill will be charged to their room folio automatically.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-slate-500 mt-0.5">🚶</span>
                      <span><span className="text-white font-bold">Walk-in Guest</span> — Proceed normally to the billing screen with cash/card payment.</span>
                    </li>
                  </ul>
                </div>

                <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/15 text-[10px] text-slate-400 leading-relaxed">
                  <span className="text-amber-400 font-black">⚠️ Requires HMS: </span>
                  This feature only works when Hotel Management System (HMS) is active and guests are checked in. Make sure rooms have active check-ins with open folios.
                </div>
              </>
            )}

            {!restaurantRoomChargingEnabled && (
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-[10px] text-slate-600 leading-relaxed">
                <span className="text-slate-400 font-bold">When disabled: </span>
                The table opening flow will work normally — staff will be taken directly to the billing/POS screen without any room selection prompt.
              </div>
            )}
          </div>
        </SectionCard>

        {/* WiFi & House Rules Settings Card */}
        <SectionCard section={SECTIONS[11]}>
          <div className="space-y-5">
            <div>
              <p className="text-xs font-bold text-white mb-1">📶 Complimentary WiFi Details</p>
              <p className="text-[9px] text-slate-500 leading-tight">These details are shown on the Guest Portal to checked-in guests if their assigned room has the "WiFi" amenity.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="WiFi Network Name"><input value={hotelWifiName} onChange={e => setHotelWifiName(e.target.value)} placeholder="e.g. Paradise-Free-WiFi" className={inputClass} /></Field>
              <Field label="WiFi Password"><input value={hotelWifiPassword} onChange={e => setHotelWifiPassword(e.target.value)} placeholder="e.g. welcome123" className={inputClass} /></Field>
            </div>

            <div className="pt-4 border-t border-slate-800/60">
              <p className="text-xs font-bold text-white mb-1">🕒 Timings & Stay Policies</p>
              <p className="text-[9px] text-slate-500 leading-tight">These timings are shown to the guests in the Rules & Timings section of the Guest Portal.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Breakfast Timings"><input value={breakfastTimings} onChange={e => setBreakfastTimings(e.target.value)} placeholder="e.g. 08:00 AM - 10:30 AM" className={inputClass} /></Field>
              <Field label="Pool & Gym Timings"><input value={poolTimings} onChange={e => setPoolTimings(e.target.value)} placeholder="e.g. 07:00 AM - 08:00 PM" className={inputClass} /></Field>
              <div className="col-span-full">
                <Field label="Checkout Policy"><textarea value={checkoutPolicy} onChange={e => setCheckoutPolicy(e.target.value)} rows={2} placeholder="e.g. Standard checkout time is 11:00 AM. Late checkouts may incur additional charges." className={`${inputClass} resize-none`} /></Field>
              </div>
            </div>
          </div>
        </SectionCard>

      </div>

      {/* Save Footer */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button onClick={handleSave} className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-black text-white transition-all shadow-xl ${saved ? 'bg-emerald-600 shadow-emerald-900/40' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/40'}`}>
          {saved ? <><CheckCircle2 size={16} /> All Settings Saved!</> : <><Save size={16} /> Save All Settings</>}
        </button>
      </div>
    </div>
  );
}
