'use client';

import { useState, useEffect } from 'react';
import {
  Heart, IndianRupee, CheckCircle, ChevronRight, Loader2, Copy,
  ArrowLeft, Star, QrCode, Utensils, BedDouble, Check, Sparkles, MessageSquare,
  Smartphone, ExternalLink
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useRouter } from 'next/navigation';
import { toast, Toaster } from 'sonner';

interface StaffMember {
  id: string;
  name: string;
  designation: string;
  upiId: string | null;
  upiName: string | null;
  avatarUrl?: string | null;
}

interface GuestOrder {
  id: string;
  orderNo: string;
  grandTotal: number;
  createdAt: string;
  itemsSummary: string;
  staffMember: {
    id: string;
    name: string;
    designation?: string;
    avatarUrl?: string | null;
    upiId?: string | null;
    upiName?: string | null;
  } | null;
  servedBy: { id: string; name: string } | null;
}

type Step = 'select-staff' | 'select-amount' | 'pay' | 'success';

export default function GuestTipPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<Step>('select-staff');
  const [showAllStaff, setShowAllStaff] = useState(false);

  const [propertyId, setPropertyId] = useState('');
  const [propertyName, setPropertyName] = useState('');
  const [guestId, setGuestId] = useState('');
  const [guestName, setGuestName] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [recentOrders, setRecentOrders] = useState<GuestOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<GuestOrder | null>(null);
  const [presets, setPresets] = useState<number[]>([10, 20, 50, 100]);

  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [amount, setAmount] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [tipNote, setTipNote] = useState('');
  const [upiRef, setUpiRef] = useState('');
  const [tipId, setTipId] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function init() {
      const token = localStorage.getItem('guest_token');
      if (!token) {
        router.push('/guest-portal');
        return;
      }

      try {
        let extractedGuestId = '';
        try {
          const decoded = JSON.parse(atob(token.split('.')[1]));
          extractedGuestId = decoded.guestId || '';
          setGuestId(extractedGuestId);
        } catch {}

        // Fetch tippable staff and orders for this guest
        const query = extractedGuestId ? `?guestId=${encodeURIComponent(extractedGuestId)}` : '';
        const res = await fetch(`/api/tips/staff${query}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();

        if (data.success) {
          setStaff(data.staff || []);
          setPresets(data.presets || [10, 20, 50, 100]);
          setPropertyId(data.propertyId || '');
          setPropertyName(data.propertyName || 'Hotel Property');
          setRoomNumber(data.roomNumber || data.guestInfo?.roomNumber || '');
          setGuestName(data.guestInfo?.name || '');

          if (data.recentOrders && data.recentOrders.length > 0) {
            setRecentOrders(data.recentOrders);
            const firstOrder = data.recentOrders[0];
            setSelectedOrder(firstOrder);

            // Pre-select order server if available
            const server = firstOrder.staffMember || data.orderServer;
            if (server) {
              const matched = (data.staff || []).find((s: StaffMember) => s.id === server.id) || {
                id: server.id,
                name: server.name,
                designation: server.designation || 'Server',
                upiId: server.upiId || null,
                upiName: server.upiName || null,
                avatarUrl: server.avatarUrl || null,
              };
              setSelectedStaff(matched);
            }
          } else if (data.orderServer) {
            setSelectedStaff(data.orderServer);
          }
        } else {
          toast.error(data.message || 'Could not load staff list');
        }
      } catch (err) {
        console.error('Failed to initialize tip page:', err);
        toast.error('Connection error. Please refresh.');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [router]);

  const finalAmount = parseFloat(customAmount) || parseFloat(amount) || 0;

  async function handleSubmitTip() {
    if (!selectedStaff || finalAmount <= 0) return;
    setSubmitting(true);
    try {
      const noteParts = [
        selectedOrder ? `Order #${selectedOrder.orderNo}` : null,
        roomNumber ? `Room ${roomNumber}` : null,
        tipNote.trim() || null,
      ].filter(Boolean);

      const res = await fetch('/api/tips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          staffMemberId: selectedStaff.id,
          guestId,
          guestName,
          orderNo: selectedOrder?.orderNo,
          amount: finalAmount,
          note: noteParts.join(' · '),
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
    if (upiRef.trim() && tipId) {
      await fetch(`/api/tips/${tipId}/confirm`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CONFIRMED', upiRef }),
      });
    }
    setStep('success');
  }

  const handleCopyUpi = () => {
    if (!selectedStaff?.upiId) return;
    navigator.clipboard.writeText(selectedStaff.upiId);
    setCopied(true);
    toast.success('UPI ID copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050a14] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-9 h-9 text-amber-400 animate-spin" />
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Loading your order & staff...</p>
      </div>
    );
  }

  return (
    <>
      <Toaster richColors position="top-center" />
      <div className="min-h-screen bg-[#050a14] flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[20%] w-96 h-96 bg-amber-600/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-5%] right-[10%] w-80 h-80 bg-orange-600/10 rounded-full blur-[80px]" />
        </div>

        <div className="relative w-full max-w-md">
          {/* Back to dashboard */}
          <button
            onClick={() => router.push('/guest-portal/dashboard')}
            className="flex items-center gap-2 text-slate-400 hover:text-white text-xs font-bold mb-4 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> Back to Dashboard
          </button>

          {/* Header */}
          <div className="text-center mb-5">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-2xl shadow-amber-500/30 mb-2.5">
              <Heart className="w-7 h-7 text-white fill-white" />
            </div>
            <h1 className="text-2xl font-black text-white">Tip Our Staff</h1>
            <p className="text-slate-400 text-xs">
              Show your appreciation directly via UPI 🙏
            </p>
          </div>

          {/* ── Context Card: Guest Stay & Order Info ── */}
          <div className="mb-4 rounded-2xl bg-slate-900/80 border border-amber-500/20 p-4 shadow-xl backdrop-blur-xl">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5">
                <span className="text-sm">🏨</span>
                <span className="text-xs font-black text-white">{propertyName}</span>
              </div>
              {roomNumber && (
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Room {roomNumber}
                </span>
              )}
            </div>

            {/* If guest has recent orders */}
            {recentOrders.length > 0 ? (
              <div className="space-y-2 mt-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold">
                    <Utensils size={13} />
                    <span>Your Order:</span>
                  </div>
                  {recentOrders.length > 1 && (
                    <span className="text-[10px] text-slate-400">
                      ({recentOrders.length} orders found)
                    </span>
                  )}
                </div>

                {/* Selected or Active Order */}
                {selectedOrder && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-black text-white">
                            #{selectedOrder.orderNo}
                          </span>
                          <span className="text-[10px] font-bold text-amber-400 bg-amber-400/15 px-2 py-0.5 rounded-md">
                            ₹{selectedOrder.grandTotal}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 truncate mt-0.5">
                          {selectedOrder.itemsSummary}
                        </p>
                      </div>
                    </div>
                    {selectedOrder.staffMember && (
                      <div className="flex items-center gap-1.5 mt-2 pt-1.5 border-t border-amber-500/20 text-[10px] text-amber-300 font-medium">
                        <span>🛎️ Served to Room by:</span>
                        <strong className="text-white font-bold">{selectedOrder.staffMember.name}</strong>
                        {selectedOrder.staffMember.designation && (
                          <span className="text-slate-400">({selectedOrder.staffMember.designation})</span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Multiple orders pill selector if > 1 */}
                {recentOrders.length > 1 && (
                  <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                    {recentOrders.map(order => (
                      <button
                        key={order.id}
                        type="button"
                        onClick={() => {
                          setSelectedOrder(order);
                          if (order.staffMember) {
                            const matched = staff.find(s => s.id === order.staffMember?.id) || {
                              id: order.staffMember.id,
                              name: order.staffMember.name,
                              designation: order.staffMember.designation || 'Server',
                              upiId: order.staffMember.upiId || null,
                              upiName: order.staffMember.upiName || null,
                              avatarUrl: order.staffMember.avatarUrl || null,
                            };
                            setSelectedStaff(matched);
                            setShowAllStaff(false);
                          }
                        }}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border whitespace-nowrap transition-all ${
                          selectedOrder?.id === order.id
                            ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                            : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-white'
                        }`}
                      >
                        #{order.orderNo} (₹{order.grandTotal})
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="pt-2 border-t border-slate-800 flex items-center gap-2 text-xs text-slate-400">
                <BedDouble size={13} className="text-indigo-400" />
                <span>Guest: <strong>{guestName || 'Valued Guest'}</strong></span>
              </div>
            )}
          </div>

          <div className="bg-[#0f172a]/90 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 shadow-2xl">

            {/* STEP 1: Select Staff */}
            {step === 'select-staff' && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-white font-bold text-base">
                      {selectedOrder?.staffMember && !showAllStaff ? 'Room Order Server' : 'Who served you well?'}
                    </h2>
                    <p className="text-slate-400 text-xs">
                      {selectedOrder?.staffMember && !showAllStaff
                        ? `Staff member who served Room ${roomNumber || ''} · Order #${selectedOrder.orderNo}`
                        : 'Select staff member to tip directly'}
                    </p>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg bg-slate-800 text-slate-300">
                    Step 1 of 3
                  </span>
                </div>

                {/* If the current order has a specific staff member who served it and guest hasn't expanded to all staff */}
                {selectedOrder?.staffMember && !showAllStaff ? (
                  <div className="space-y-3">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-slate-900 border-2 border-amber-500/40 shadow-xl shadow-amber-500/10">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 bg-amber-500/20 px-2.5 py-1 rounded-full border border-amber-500/35 flex items-center gap-1">
                          <Star size={10} fill="currentColor" /> Delivered Room Order
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-700">
                          #{selectedOrder.orderNo}
                        </span>
                      </div>

                      <div className="flex items-center gap-3.5 mb-4">
                        {selectedOrder.staffMember.avatarUrl ? (
                          <img
                            src={selectedOrder.staffMember.avatarUrl}
                            alt={selectedOrder.staffMember.name}
                            className="w-14 h-14 rounded-2xl object-cover shadow-lg border-2 border-amber-400 shrink-0"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-amber-500/30 shrink-0">
                            {selectedOrder.staffMember.name.trim()[0]?.toUpperCase() || 'S'}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-black text-base truncate">
                            {selectedOrder.staffMember.name.trim()}
                          </h3>
                          <p className="text-amber-400/90 text-xs font-semibold">
                            {selectedOrder.staffMember.designation || 'Room Server'}
                          </p>
                          <p className="text-slate-400 text-[11px] mt-0.5">
                            Marked & served your room service order
                          </p>
                        </div>
                        {selectedOrder.staffMember.upiId && (
                          <span className="text-[9px] text-emerald-400 bg-emerald-500/15 border border-emerald-500/25 px-2 py-1 rounded-full font-bold shrink-0">
                            UPI Ready
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const matched = staff.find(s => s.id === selectedOrder.staffMember?.id) || {
                            id: selectedOrder.staffMember!.id,
                            name: selectedOrder.staffMember!.name,
                            designation: selectedOrder.staffMember!.designation || 'Server',
                            upiId: selectedOrder.staffMember!.upiId || null,
                            upiName: selectedOrder.staffMember!.upiName || null,
                            avatarUrl: selectedOrder.staffMember!.avatarUrl || null,
                          };
                          setSelectedStaff(matched);
                          setStep('select-amount');
                        }}
                        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 active:scale-[0.98] transition-all"
                      >
                        <span>Tip {selectedOrder.staffMember.name.split(' ')[0]} Directly</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>

                    {staff.length > 1 && (
                      <div className="text-center pt-2">
                        <button
                          type="button"
                          onClick={() => setShowAllStaff(true)}
                          className="text-slate-400 hover:text-white text-xs font-medium underline underline-offset-4 transition-colors"
                        >
                          Want to tip someone else? View all hotel staff ({staff.length})
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    {selectedOrder?.staffMember && showAllStaff && (
                      <div className="mb-3 flex justify-between items-center bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                        <span className="text-xs text-slate-300">All Hotel Staff:</span>
                        <button
                          type="button"
                          onClick={() => setShowAllStaff(false)}
                          className="text-[11px] text-amber-400 hover:underline font-semibold"
                        >
                          ← Show only room server ({selectedOrder.staffMember.name})
                        </button>
                      </div>
                    )}

                    {staff.length === 0 ? (
                      <div className="text-center py-8">
                        <Heart className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-400 text-sm font-semibold">No staff listed yet</p>
                        <p className="text-slate-600 text-xs mt-1">Please ask hotel reception for direct tipping</p>
                      </div>
                    ) : (
                      <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                        {staff.map(s => {
                          const isOrderServer = selectedOrder?.staffMember?.id === s.id;
                          return (
                            <button
                              key={s.id}
                              onClick={() => {
                                setSelectedStaff(s);
                                setStep('select-amount');
                              }}
                              className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all group ${
                                isOrderServer
                                  ? 'border-amber-500/60 bg-amber-500/10 shadow-lg shadow-amber-500/10'
                                  : 'border-slate-800 hover:border-amber-500/40 hover:bg-slate-800/50'
                              }`}
                            >
                              {s.avatarUrl ? (
                                <img
                                  src={s.avatarUrl}
                                  alt={s.name}
                                  className="w-11 h-11 rounded-xl object-cover flex-shrink-0 shadow-md border border-amber-500/30"
                                />
                              ) : (
                                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0 text-white font-black text-base shadow-md shadow-amber-500/20">
                                  {s.name.trim()[0]?.toUpperCase() || 'S'}
                                </div>
                              )}

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-white font-bold text-sm truncate">{s.name.trim()}</p>
                                  {isOrderServer && (
                                    <span className="text-[9px] font-black uppercase tracking-wider text-amber-300 bg-amber-500/25 px-2 py-0.5 rounded-full border border-amber-500/40 flex items-center gap-1">
                                      <Star size={9} fill="currentColor" /> Served Order
                                    </span>
                                  )}
                                </div>
                                <p className="text-slate-400 text-xs truncate mt-0.5">{s.designation}</p>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {s.upiId ? (
                                  <span className="text-[9px] text-emerald-400 bg-emerald-500/15 border border-emerald-500/25 px-2 py-1 rounded-full font-bold">
                                    UPI Ready
                                  </span>
                                ) : (
                                  <span className="text-[9px] text-slate-500 bg-slate-800 px-2 py-1 rounded-full font-medium">
                                    Cash/Desk
                                  </span>
                                )}
                                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: Select Amount */}
            {step === 'select-amount' && selectedStaff && (
              <div>
                <button
                  onClick={() => setStep('select-staff')}
                  className="flex items-center gap-1.5 text-slate-400 hover:text-white text-xs font-bold mb-4 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Change staff member
                </button>

                {/* Selected Staff Pill */}
                <div className="flex items-center gap-3 mb-5 p-3.5 bg-gradient-to-r from-amber-500/15 to-orange-500/5 border border-amber-500/30 rounded-2xl">
                  {selectedStaff.avatarUrl ? (
                    <img
                      src={selectedStaff.avatarUrl}
                      alt={selectedStaff.name}
                      className="w-11 h-11 rounded-xl object-cover flex-shrink-0 shadow-md border border-amber-500/40"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-black text-base shadow-md shadow-amber-500/20 shrink-0">
                      {selectedStaff.name.trim()[0]?.toUpperCase() || 'S'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-black text-sm truncate">{selectedStaff.name.trim()}</p>
                    <p className="text-amber-400/80 text-xs">{selectedStaff.designation}</p>
                  </div>
                  {selectedOrder && (
                    <span className="text-[9px] font-mono text-slate-300 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-700 shrink-0">
                      #{selectedOrder.orderNo}
                    </span>
                  )}
                </div>

                <h3 className="text-white font-bold text-sm mb-3">Choose tip amount</h3>

                {/* Presets */}
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {presets.map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        setAmount(p.toString());
                        setCustomAmount('');
                      }}
                      className={`py-3 rounded-xl font-black text-sm border transition-all ${
                        amount === p.toString() && !customAmount
                          ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/30 scale-105'
                          : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:border-amber-500/50'
                      }`}
                    >
                      ₹{p}
                    </button>
                  ))}
                </div>

                {/* Custom Amount */}
                <div className="relative mb-4">
                  <IndianRupee className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="number"
                    min="1"
                    placeholder="Enter custom amount"
                    value={customAmount}
                    onChange={e => {
                      setCustomAmount(e.target.value);
                      setAmount('');
                    }}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-100 text-sm font-semibold focus:outline-none focus:border-amber-500 placeholder:text-slate-600 transition-colors"
                  />
                </div>

                {/* Optional Message */}
                <div className="relative mb-5">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold mb-1.5">
                    <MessageSquare size={12} />
                    <span>Appreciation Note (Optional)</span>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. Great food and fast delivery!"
                    value={tipNote}
                    onChange={e => setTipNote(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-amber-500 placeholder:text-slate-600 transition-colors"
                  />
                </div>

                {/* Continue */}
                <button
                  onClick={handleSubmitTip}
                  disabled={finalAmount <= 0 || submitting}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 text-white font-black text-sm uppercase tracking-wider transition-all shadow-xl shadow-amber-500/25 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-98"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                    </>
                  ) : (
                    <>Continue — Pay ₹{finalAmount || 0}</>
                  )}
                </button>
              </div>
            )}

            {/* STEP 3: Pay via UPI */}
            {step === 'pay' && selectedStaff && (
              <div className="text-center">
                {/* Staff Details Header */}
                <div className="flex items-center justify-center gap-3 mb-4 p-3 bg-slate-900/80 rounded-2xl border border-slate-800/80">
                  {selectedStaff.avatarUrl ? (
                    <img
                      src={selectedStaff.avatarUrl}
                      alt={selectedStaff.name}
                      className="w-12 h-12 rounded-xl object-cover shadow-lg border-2 border-emerald-500/40 shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white font-black text-lg shadow-lg shrink-0">
                      {selectedStaff.name.trim()[0]?.toUpperCase() || 'S'}
                    </div>
                  )}
                  <div className="text-left min-w-0">
                    <p className="text-white font-black text-sm truncate">{selectedStaff.name.trim()}</p>
                    <p className="text-emerald-400 text-xs truncate">{selectedStaff.designation}</p>
                    {selectedStaff.upiName && <p className="text-slate-400 text-[10px] truncate">UPI: {selectedStaff.upiName}</p>}
                  </div>
                </div>

                <h2 className="text-white font-black text-xl mb-0.5">
                  Pay ₹{finalAmount} via UPI
                </h2>
                <p className="text-slate-400 text-xs mb-4">
                  Direct transfer to staff's UPI account
                </p>

                {selectedStaff.upiId ? (
                  <>
                    {/* Primary Button: Pay with Google Pay (GPay) */}
                    <button
                      type="button"
                      onClick={() => {
                        const note = `Tip for ${selectedOrder ? 'Order #' + selectedOrder.orderNo : (propertyName || 'Hotel Staff')}`;
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
                        href={`phonepe://pay?pa=${encodeURIComponent(selectedStaff.upiId)}&pn=${encodeURIComponent(selectedStaff.upiName || selectedStaff.name)}&am=${finalAmount}&cu=INR&tn=${encodeURIComponent(`Tip for ${selectedOrder ? 'Order #' + selectedOrder.orderNo : 'Hotel Staff'}`)}`}
                        className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-[#5f259f]/30 hover:bg-[#5f259f]/50 border border-[#5f259f]/50 text-white transition-all active:scale-95"
                      >
                        <span className="text-xs font-black text-[#a855f7]">PhonePe</span>
                        <span className="text-[9px] text-slate-400">Open app</span>
                      </a>

                      {/* Paytm */}
                      <a
                        href={`paytmmp://pay?pa=${encodeURIComponent(selectedStaff.upiId)}&pn=${encodeURIComponent(selectedStaff.upiName || selectedStaff.name)}&am=${finalAmount}&cu=INR&tn=${encodeURIComponent(`Tip for ${selectedOrder ? 'Order #' + selectedOrder.orderNo : 'Hotel Staff'}`)}`}
                        className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-[#00b9f5]/20 hover:bg-[#00b9f5]/35 border border-[#00b9f5]/40 text-white transition-all active:scale-95"
                      >
                        <span className="text-xs font-black text-[#38bdf8]">Paytm</span>
                        <span className="text-[9px] text-slate-400">Open app</span>
                      </a>

                      {/* Any UPI */}
                      <a
                        href={`upi://pay?pa=${encodeURIComponent(selectedStaff.upiId)}&pn=${encodeURIComponent(selectedStaff.upiName || selectedStaff.name)}&am=${finalAmount}&cu=INR&tn=${encodeURIComponent(`Tip for ${selectedOrder ? 'Order #' + selectedOrder.orderNo : 'Hotel Staff'}`)}`}
                        className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-white transition-all active:scale-95"
                      >
                        <span className="text-xs font-black text-emerald-400">Any UPI</span>
                        <span className="text-[9px] text-slate-400">BHIM/Cred</span>
                      </a>
                    </div>

                    {/* DYNAMIC QR CODE CARD: Scan with Google Pay */}
                    <div className="bg-slate-900/95 border border-slate-700/80 rounded-2xl p-5 mb-4 shadow-xl">
                      <div className="flex items-center justify-center gap-1.5 mb-2">
                        <Smartphone size={13} className="text-amber-400" />
                        <p className="text-[11px] font-bold text-slate-300">
                          Or Scan with <strong className="text-white">Google Pay</strong> / Any App
                        </p>
                      </div>

                      {/* QR Code Container */}
                      <div className="inline-block p-3.5 bg-white rounded-2xl shadow-2xl mx-auto my-2 border-2 border-slate-200">
                        <QRCodeSVG
                          value={`upi://pay?pa=${encodeURIComponent(selectedStaff.upiId)}&pn=${encodeURIComponent(selectedStaff.upiName || selectedStaff.name)}&am=${finalAmount}&cu=INR&tn=${encodeURIComponent(`Tip for ${selectedOrder ? 'Order #' + selectedOrder.orderNo : 'Hotel Staff'}`)}`}
                          size={170}
                          level="M"
                        />
                      </div>

                      <p className="text-[10px] text-slate-400 mt-1">
                        Amount <strong className="text-amber-400">₹{finalAmount}</strong> and <strong className="text-white">{selectedStaff.name.trim()}</strong> are pre-filled
                      </p>
                    </div>

                    {/* Staff UPI ID with 1-click Copy */}
                    <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-3.5 mb-4 text-left shadow-inner">
                      <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">
                        Staff UPI ID (VPA)
                      </p>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-emerald-400 font-mono font-bold text-sm select-all truncate">
                          {selectedStaff.upiId}
                        </p>
                        <button
                          type="button"
                          onClick={handleCopyUpi}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors shrink-0"
                        >
                          {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                          <span>{copied ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-4 mb-4 text-left">
                    <p className="text-amber-400 text-xs font-bold mb-1">⚠️ UPI Not Configured</p>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      Staff UPI ID is not registered yet. You can hand over the tip directly or ask front desk to add it to your room folio.
                    </p>
                  </div>
                )}

                <div className="mb-4 text-left">
                  <label className="block text-slate-400 text-xs font-bold mb-1.5">
                    UPI UTR / Reference No. (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 123456789012"
                    value={upiRef}
                    onChange={e => setUpiRef(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-100 text-xs font-mono focus:outline-none focus:border-emerald-500 placeholder:text-slate-600 transition-colors"
                  />
                </div>

                <button
                  onClick={handleConfirmPaid}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-extrabold text-sm uppercase tracking-wider transition-all shadow-xl shadow-emerald-600/25 flex items-center justify-center gap-2 active:scale-98"
                >
                  <CheckCircle className="w-4 h-4 text-white" /> I've Paid ₹{finalAmount} — Done!
                </button>
              </div>
            )}

            {/* STEP 4: Success */}
            {step === 'success' && selectedStaff && (
              <div className="text-center py-4">
                <div className="relative inline-block mx-auto mb-4">
                  {selectedStaff.avatarUrl ? (
                    <img
                      src={selectedStaff.avatarUrl}
                      alt={selectedStaff.name}
                      className="w-20 h-20 rounded-full object-cover shadow-2xl border-4 border-amber-400"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-2xl shadow-amber-500/40">
                      <Heart className="w-10 h-10 text-white fill-white" />
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg border-2 border-[#0f172a]">
                    <Heart className="w-3.5 h-3.5 text-white fill-white" />
                  </div>
                </div>
                <div className="flex items-center justify-center gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <h2 className="text-white font-black text-2xl mb-1">Thank You! 🙏</h2>
                <p className="text-slate-400 text-sm mb-1">
                  ₹<span className="text-amber-400 font-bold text-lg">{finalAmount}</span> tip sent to
                </p>
                <p className="text-white font-black text-lg mb-2">{selectedStaff.name.trim()}</p>
                {selectedOrder && (
                  <p className="text-slate-400 text-xs mb-4">
                    For Order #{selectedOrder.orderNo}
                  </p>
                )}
                <p className="text-slate-500 text-xs">
                  Your generosity brings a huge smile to our team!
                </p>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      setStep('select-staff');
                      setSelectedStaff(null);
                      setAmount('');
                      setCustomAmount('');
                      setTipNote('');
                      setUpiRef('');
                    }}
                    className="flex-1 py-3 rounded-xl border border-slate-700 hover:border-amber-500/40 text-slate-300 hover:text-white text-xs font-bold transition-all"
                  >
                    Tip Another Staff
                  </button>
                  <button
                    onClick={() => router.push('/guest-portal/dashboard')}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20"
                  >
                    Dashboard
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
