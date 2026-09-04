'use client';

import { useState, useEffect, use } from 'react';
import { Heart, IndianRupee, CheckCircle, ChevronRight, Loader2, Copy, QrCode, ArrowLeft, Phone, User, Star, Smartphone, ExternalLink } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast, Toaster } from 'sonner';

interface StaffMember {
  id: string;
  name: string;
  designation: string;
  upiId: string | null;
  upiName: string | null;
  avatarUrl?: string | null;
}

type Step = 'select-staff' | 'select-amount' | 'pay' | 'confirm' | 'success';

export default function PublicTipPage({ params }: { params: Promise<{ propertyCode: string }> }) {
  const { propertyCode } = use(params);

  const [step, setStep] = useState<Step>('select-staff');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [propertyId, setPropertyId] = useState('');
  const [propertyName, setPropertyName] = useState('');
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [presets, setPresets] = useState<number[]>([10, 20, 50, 100]);

  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [amount, setAmount] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [upiRef, setUpiRef] = useState('');
  const [tipId, setTipId] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        // First get propertyId from propertyCode
        const propRes = await fetch(`/api/property/by-code?code=${propertyCode}`);
        const propData = await propRes.json();
        if (!propData.success) {
          toast.error('Hotel not found');
          setLoading(false);
          return;
        }
        const pId = propData.property.id;
        setPropertyId(pId);

        // Then get staff
        const staffRes = await fetch(`/api/tips/staff?propertyId=${pId}`);
        const staffData = await staffRes.json();
        if (!staffData.success) {
          toast.error(staffData.message || 'Tipping not available');
          setLoading(false);
          return;
        }
        setStaff(staffData.staff);
        setPresets(staffData.presets);
        setPropertyName(staffData.propertyName);
      } catch {
        toast.error('Connection error');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [propertyCode]);

  async function handleSubmitTip() {
    setSubmitting(true);
    try {
      const res = await fetch('/api/tips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          staffMemberId: selectedStaff!.id,
          guestName: guestName || null,
          guestPhone: guestPhone || null,
          amount: parseFloat(amount),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTipId(data.tip.id);
        setStep('pay');
      } else {
        toast.error(data.message || 'Failed to record tip');
      }
    } catch {
      toast.error('Connection error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmPaid() {
    if (upiRef.trim()) {
      // Update tip with UPI ref
      await fetch(`/api/tips/${tipId}/confirm`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CONFIRMED', upiRef }),
      });
    }
    setStep('success');
  }

  const finalAmount = parseFloat(customAmount) || parseFloat(amount) || 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050a14] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-amber-400 animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (staff.length === 0 && !loading) {
    return (
      <div className="min-h-screen bg-[#050a14] flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-slate-500" />
          </div>
          <h2 className="text-white font-bold text-xl mb-2">Tipping Unavailable</h2>
          <p className="text-slate-400 text-sm">Tipping feature is not enabled for this hotel.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster richColors position="top-center" />
      <div className="min-h-screen bg-[#050a14] flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Ambient glows */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-[-10%] left-[20%] w-96 h-96 bg-amber-600/8 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-5%] right-[10%] w-80 h-80 bg-orange-600/8 rounded-full blur-[80px]" />
        </div>

        <div className="relative w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-2xl shadow-amber-500/30 mb-3">
              <Heart className="w-7 h-7 text-white fill-white" />
            </div>
            <h1 className="text-2xl font-black text-white">Tip Our Staff</h1>
            <p className="text-slate-400 text-sm mt-1">{propertyName}</p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {(['select-staff', 'select-amount', 'pay', 'success'] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full transition-all ${
                  step === s ? 'w-6 bg-amber-400' :
                  ['success', 'pay', 'confirm'].indexOf(step) > ['select-staff', 'select-amount', 'pay', 'success'].indexOf(s)
                    ? 'bg-amber-400/40' : 'bg-slate-700'
                }`} />
              </div>
            ))}
          </div>

          {/* Card */}
          <div className="bg-[#0f172a]/90 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 shadow-2xl">

            {/* STEP 1: Select Staff */}
            {step === 'select-staff' && (
              <div>
                <h2 className="text-white font-bold text-lg mb-1">Who do you want to tip?</h2>
                <p className="text-slate-400 text-xs mb-4">Select a staff member</p>
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {staff.map(s => (
                    <button
                      key={s.id}
                      onClick={() => { setSelectedStaff(s); setStep('select-amount'); }}
                      className="w-full flex items-center gap-3 p-3.5 rounded-2xl border border-slate-700 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all group text-left"
                    >
                      {s.avatarUrl ? (
                        <img
                          src={s.avatarUrl}
                          alt={s.name}
                          className="w-10 h-10 rounded-xl object-cover flex-shrink-0 shadow-md border border-amber-500/30"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-amber-400 font-black text-sm">{s.name[0]}</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold text-sm">{s.name}</p>
                        <p className="text-slate-400 text-xs">{s.designation}</p>
                      </div>
                      {s.upiId ? (
                        <span className="text-[10px] text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full font-bold">UPI</span>
                      ) : null}
                      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-amber-400 transition-colors" />
                    </button>
                  ))}
                </div>

                {/* Guest Info (optional) */}
                <div className="mt-4 pt-4 border-t border-slate-800/60">
                  <p className="text-slate-500 text-xs mb-3">Your details (optional)</p>
                  <div className="space-y-2">
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                      <input
                        type="text" placeholder="Your name" value={guestName}
                        onChange={e => setGuestName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900/60 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-amber-500 placeholder:text-slate-600 transition-colors"
                      />
                    </div>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                      <input
                        type="tel" placeholder="Phone number" value={guestPhone}
                        onChange={e => setGuestPhone(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900/60 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-amber-500 placeholder:text-slate-600 transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Select Amount */}
            {step === 'select-amount' && selectedStaff && (
              <div>
                <button onClick={() => setStep('select-staff')} className="flex items-center gap-1.5 text-slate-400 hover:text-white text-xs mb-4 transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>

                <div className="flex items-center gap-3 mb-5 p-3 bg-amber-500/8 border border-amber-500/20 rounded-2xl">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-black text-sm">{selectedStaff.name[0]}</span>
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">{selectedStaff.name}</p>
                    <p className="text-amber-400/70 text-xs">{selectedStaff.designation}</p>
                  </div>
                </div>

                <h2 className="text-white font-bold text-lg mb-1">Choose tip amount</h2>
                <p className="text-slate-400 text-xs mb-4">Your appreciation means a lot 🙏</p>

                {/* Preset amounts */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {presets.map(p => (
                    <button
                      key={p}
                      onClick={() => { setAmount(p.toString()); setCustomAmount(''); }}
                      className={`py-3 rounded-xl font-bold text-sm border transition-all ${
                        amount === p.toString() && !customAmount
                          ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/30'
                          : 'bg-slate-900/60 border-slate-700 text-slate-300 hover:border-amber-500/40'
                      }`}
                    >
                      ₹{p}
                    </button>
                  ))}
                </div>

                {/* Custom amount */}
                <div className="relative mb-5">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="number" min="1" placeholder="Custom amount"
                    value={customAmount}
                    onChange={e => { setCustomAmount(e.target.value); setAmount(''); }}
                    className="w-full pl-9 pr-4 py-3 rounded-xl bg-slate-900/60 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-amber-500 placeholder:text-slate-600 transition-colors"
                  />
                </div>

                <button
                  onClick={handleSubmitTip}
                  disabled={(!amount && !customAmount) || submitting || finalAmount <= 0}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-extrabold text-sm uppercase tracking-wider transition-all shadow-xl shadow-amber-500/25 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : <>Continue — ₹{finalAmount || '0'}</>}
                </button>
              </div>
            )}

            {/* STEP 3: Pay via UPI */}
            {step === 'pay' && selectedStaff && (
              <div className="text-center">
                <button onClick={() => setStep('select-amount')} className="flex items-center gap-1.5 text-slate-400 hover:text-white text-xs mb-4 transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>

                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto mb-3">
                  <QrCode className="w-7 h-7 text-white" />
                </div>

                <h2 className="text-white font-bold text-lg mb-1">Pay ₹{finalAmount} via UPI</h2>
                <p className="text-slate-400 text-xs mb-5">Send tip to {selectedStaff.name}'s UPI ID</p>

                {selectedStaff.upiId ? (
                  <>
                    {/* Primary Button: Pay with Google Pay (GPay) */}
                    <button
                      type="button"
                      onClick={() => {
                        const note = `Tip for ${selectedStaff.name} · ${propertyName}`;
                        const isAndroid = typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);
                        const cleanUpi = selectedStaff.upiId || '';
                        const cleanName = selectedStaff.upiName || selectedStaff.name;

                        if (isAndroid) {
                          const androidGpayIntent = `intent://pay?pa=${encodeURIComponent(cleanUpi)}&pn=${encodeURIComponent(cleanName)}&am=${finalAmount}&cu=INR&tn=${encodeURIComponent(note)}#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end`;
                          window.location.href = androidGpayIntent;
                        } else {
                          const tezUri = `tez://upi/pay?pa=${encodeURIComponent(cleanUpi)}&pn=${encodeURIComponent(cleanName)}&am=${finalAmount}&cu=INR&tn=${encodeURIComponent(note)}`;
                          window.location.href = tezUri;
                        }

                        // Universal UPI fallback
                        setTimeout(() => {
                          const upiFallback = `upi://pay?pa=${encodeURIComponent(cleanUpi)}&pn=${encodeURIComponent(cleanName)}&am=${finalAmount}&cu=INR&tn=${encodeURIComponent(note)}`;
                          window.location.href = upiFallback;
                        }, 1200);
                      }}
                      className="w-full flex items-center justify-center gap-3 py-4 px-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white font-black text-sm uppercase tracking-wider transition-all shadow-xl shadow-blue-600/30 mb-3 active:scale-98 border border-white/20"
                    >
                      <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shrink-0">
                        <span className="text-[11px] font-black text-blue-600">G</span>
                      </div>
                      <span>Pay ₹{finalAmount} with Google Pay</span>
                      <ExternalLink size={15} className="text-white/80 ml-auto" />
                    </button>

                    {/* Secondary App Buttons: PhonePe, Paytm, Other UPI */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {/* PhonePe */}
                      <a
                        href={`phonepe://pay?pa=${encodeURIComponent(selectedStaff.upiId)}&pn=${encodeURIComponent(selectedStaff.upiName || selectedStaff.name)}&am=${finalAmount}&cu=INR&tn=${encodeURIComponent(`Tip for ${selectedStaff.name}`)}`}
                        className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-[#5f259f]/30 hover:bg-[#5f259f]/50 border border-[#5f259f]/50 text-white transition-all active:scale-95"
                      >
                        <span className="text-xs font-black text-[#a855f7]">PhonePe</span>
                        <span className="text-[9px] text-slate-400">Open app</span>
                      </a>

                      {/* Paytm */}
                      <a
                        href={`paytmmp://pay?pa=${encodeURIComponent(selectedStaff.upiId)}&pn=${encodeURIComponent(selectedStaff.upiName || selectedStaff.name)}&am=${finalAmount}&cu=INR&tn=${encodeURIComponent(`Tip for ${selectedStaff.name}`)}`}
                        className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-[#00b9f5]/20 hover:bg-[#00b9f5]/35 border border-[#00b9f5]/40 text-white transition-all active:scale-95"
                      >
                        <span className="text-xs font-black text-[#38bdf8]">Paytm</span>
                        <span className="text-[9px] text-slate-400">Open app</span>
                      </a>

                      {/* Any UPI */}
                      <a
                        href={`upi://pay?pa=${encodeURIComponent(selectedStaff.upiId)}&pn=${encodeURIComponent(selectedStaff.upiName || selectedStaff.name)}&am=${finalAmount}&cu=INR&tn=${encodeURIComponent(`Tip for ${selectedStaff.name}`)}`}
                        className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-white transition-all active:scale-95"
                      >
                        <span className="text-xs font-black text-emerald-400">Any UPI</span>
                        <span className="text-[9px] text-slate-400">BHIM/Cred</span>
                      </a>
                    </div>

                    {/* DYNAMIC QR CODE CARD: Scan with Google Pay */}
                    <div className="bg-slate-900/95 border border-slate-700/80 rounded-2xl p-5 mb-4 shadow-xl text-center">
                      <div className="flex items-center justify-center gap-1.5 mb-2">
                        <Smartphone size={13} className="text-amber-400" />
                        <p className="text-[11px] font-bold text-slate-300">
                          Or Scan with <strong className="text-white">Google Pay</strong> / Any App
                        </p>
                      </div>

                      {/* QR Code Container */}
                      <div className="inline-block p-3.5 bg-white rounded-2xl shadow-2xl mx-auto my-2 border-2 border-slate-200">
                        <QRCodeSVG
                          value={`upi://pay?pa=${encodeURIComponent(selectedStaff.upiId)}&pn=${encodeURIComponent(selectedStaff.upiName || selectedStaff.name)}&am=${finalAmount}&cu=INR&tn=${encodeURIComponent(`Tip for ${selectedStaff.name} · ${propertyName}`)}`}
                          size={170}
                          level="M"
                        />
                      </div>

                      <p className="text-[10px] text-slate-400 mt-1">
                        Amount <strong className="text-amber-400">₹{finalAmount}</strong> and <strong className="text-white">{selectedStaff.name.trim()}</strong> are pre-filled
                      </p>
                    </div>

                    {/* UPI ID Display */}
                    <div className="bg-slate-900/60 border border-slate-700 rounded-2xl p-3.5 mb-4 text-left">
                      <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">UPI ID (VPA)</p>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-emerald-400 font-mono font-bold text-sm select-all truncate">{selectedStaff.upiId}</p>
                        <button
                          type="button"
                          onClick={() => { navigator.clipboard.writeText(selectedStaff.upiId!); toast.success('UPI ID copied!'); }}
                          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors shrink-0 flex items-center gap-1"
                        >
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                          <span>Copy</span>
                        </button>
                      </div>
                      {selectedStaff.upiName && <p className="text-amber-400/70 text-xs mt-1">{selectedStaff.upiName}</p>}
                    </div>
                  </>
                ) : (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 mb-4">
                    <p className="text-amber-400 text-sm font-medium">Staff UPI not set up yet.</p>
                    <p className="text-slate-400 text-xs mt-1">Please pay cash and inform the staff member.</p>
                  </div>
                )}

                {/* UPI Reference Input */}
                <div className="mb-4">
                  <label className="block text-slate-400 text-xs mb-2 text-left">UPI Transaction ID (optional)</label>
                  <input
                    type="text" placeholder="e.g. 12345678901"
                    value={upiRef} onChange={e => setUpiRef(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-green-500 placeholder:text-slate-600 transition-colors"
                  />
                </div>

                <button
                  onClick={handleConfirmPaid}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-extrabold text-sm uppercase tracking-wider transition-all shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" /> I've Paid — Done!
                </button>
              </div>
            )}

            {/* STEP 4: Success */}
            {step === 'success' && selectedStaff && (
              <div className="text-center py-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-amber-500/40">
                  <Heart className="w-10 h-10 text-white fill-white" />
                </div>

                <div className="flex items-center justify-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
                  ))}
                </div>

                <h2 className="text-white font-black text-2xl mb-2">Thank You! 🙏</h2>
                <p className="text-slate-400 text-sm mb-1">
                  Your tip of <span className="text-amber-400 font-bold">₹{finalAmount}</span> for
                </p>
                <p className="text-white font-bold text-lg mb-4">{selectedStaff.name}</p>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Your generosity makes a huge difference.<br />
                  {selectedStaff.name} will be grateful for your kindness!
                </p>

                <button
                  onClick={() => { setStep('select-staff'); setSelectedStaff(null); setAmount(''); setCustomAmount(''); setUpiRef(''); }}
                  className="mt-6 px-6 py-3 rounded-xl border border-slate-700 hover:border-amber-500/40 text-slate-300 hover:text-white text-sm font-semibold transition-all"
                >
                  Tip Someone Else
                </button>
              </div>
            )}
          </div>

          <p className="text-center text-[10px] text-slate-600 mt-5">
            Powered by <span className="text-amber-500 font-bold">GuestFlow HMS</span>
          </p>
        </div>
      </div>
    </>
  );
}
