'use client';

import React, { useState } from 'react';
import {
  X, Printer, Send, Users, Building2, Calendar, Bed,
  CheckCircle2, Clock, Phone, FileText, Loader2, Download,
  ExternalLink, ShieldCheck, Utensils
} from 'lucide-react';
import { toast } from 'sonner';

interface AgentMasterInvoiceModalProps {
  booking: any;
  agent: any;
  onClose: () => void;
}

export function parseGroupTripData(notes?: string | null): any | null {
  if (!notes) return null;
  const match = notes.match(/\[GROUP_TRIP_DATA:\s*(\{[\s\S]+?\})\]/);
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch (err) {
    console.error('Failed to parse group trip data from notes:', err);
    return null;
  }
}

export default function AgentMasterInvoiceModal({
  booking,
  agent,
  onClose,
}: AgentMasterInvoiceModalProps) {
  const [activeTab, setActiveTab] = useState<'invoice' | 'manifest' | 'itinerary'>('invoice');
  const [sendingWa, setSendingWa] = useState(false);
  const [waSentSuccess, setWaSentSuccess] = useState(false);

  const groupData = parseGroupTripData(booking.notes);
  const hotelName = booking.property?.name || agent?.property?.name || 'Hotel Partner';

  const checkInDate = new Date(booking.checkIn).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const checkOutDate = new Date(booking.checkOut).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const nights = Math.max(
    1,
    Math.round(
      (new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) /
      (1000 * 60 * 60 * 24)
    )
  );

  const grandTotal = booking.totalAmount || groupData?.billing?.grandTotal || 0;
  const commission = booking.commission || groupData?.billing?.commissionAmount || 0;
  const netPayable = grandTotal - commission;

  const handleSendWhatsApp = async () => {
    if (!agent?.phone) {
      toast.error('Agent WhatsApp phone number not found.');
      return;
    }
    setSendingWa(true);
    try {
      const res = await fetch('/api/agent-portal/send-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentPhone: agent.phone,
          agentName: agent.name,
          companyName: agent.companyName,
          agentCode: agent.agentCode,
          hotelName,
          groupName: groupData?.groupName || booking.guestName,
          totalPax: groupData?.totalPax || booking.adults || 1,
          checkIn: checkInDate,
          checkOut: checkOutDate,
          roomsSummary: booking.roomType,
          mealPlan: groupData?.mealPlan ? `${groupData.mealPlan} Plan` : undefined,
          grandTotal,
          commission,
          netPayable,
          propertyId: booking.propertyId,
          bookingRef: booking.id?.slice(-6)?.toUpperCase(),
          itinerarySummary: groupData?.itinerary?.length
            ? `${groupData.itinerary.length} Days Itinerary Included`
            : undefined,
          transportSummary: groupData?.transport?.vehicleNumber
            ? `${groupData.transport.vehicleType} (${groupData.transport.vehicleNumber})`
            : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setWaSentSuccess(true);
        toast.success(`✅ Master Bill sent to Agent WhatsApp (+${agent.phone.slice(-10)})!`);
      } else {
        toast.error(data.message || 'Failed to dispatch WhatsApp invoice.');
      }
    } catch {
      toast.error('Error dispatching WhatsApp invoice.');
    } finally {
      setSendingWa(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#080d1a] border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Top Header */}
        <div className="bg-[#0b1329] border-b border-slate-800 p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-600/30">
              <FileText size={20} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white">Travel Agent Master Invoice & Manifest</h2>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Ref #{booking.id?.slice(-6)?.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Billed To: <span className="text-white font-bold">{agent?.name}</span> ({agent?.agentCode})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Print Invoice"
            >
              <Printer size={16} />
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* View Tabs */}
        <div className="bg-[#050a14] border-b border-slate-800/80 px-6 py-2.5 flex items-center gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('invoice')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'invoice'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
              }`}
          >
            Master Bill (Invoice)
          </button>
          {groupData?.members && groupData.members.length > 0 && (
            <button
              onClick={() => setActiveTab('manifest')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === 'manifest'
                ? 'bg-violet-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
                }`}
            >
              <Users size={13} />
              <span>Passenger Roster ({groupData.members.length} Pax)</span>
            </button>
          )}
          {groupData?.itinerary && groupData.itinerary.length > 0 && (
            <button
              onClick={() => setActiveTab('itinerary')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === 'itinerary'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
                }`}
            >
              <Clock size={13} />
              <span>Trip Schedule & Transport</span>
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: MASTER INVOICE */}
          {activeTab === 'invoice' && (
            <div className="space-y-6">
              {/* Paper Invoice Box */}
              <div className="bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 space-y-6">
                <div className="flex items-start justify-between border-b border-slate-200 pb-5 flex-wrap gap-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      Consolidated Master Tax Invoice
                    </span>
                    <h2 className="text-2xl font-black tracking-tight text-slate-900 mt-2">
                      {hotelName}
                    </h2>
                    <p className="text-xs text-slate-500">
                      Partner Property Reservation Invoice
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Invoice Number</p>
                    <p className="text-sm font-mono font-black text-slate-800">
                      #{booking.id?.slice(-8)?.toUpperCase()}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Issued: {new Date(booking.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                    <span className="inline-block mt-1 text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase">
                      {booking.status}
                    </span>
                  </div>
                </div>

                {/* Bill To & Group Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                      Billed To (Travel Agency):
                    </p>
                    <p className="text-sm font-black text-slate-900">{agent?.name}</p>
                    {agent?.companyName && (
                      <p className="text-xs font-bold text-slate-700">{agent.companyName}</p>
                    )}
                    <p className="text-xs text-slate-500 mt-0.5">
                      Agent Code: <span className="font-mono font-bold text-slate-800">{agent?.agentCode}</span>
                    </p>
                    <p className="text-xs text-slate-500">Mobile: {agent?.phone}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                      Group Booking Summary:
                    </p>
                    <p className="text-sm font-black text-slate-900">
                      {groupData?.groupName || booking.guestName}
                    </p>
                    <p className="text-xs text-slate-600">
                      Dates: <span className="font-bold">{checkInDate}</span> to <span className="font-bold">{checkOutDate}</span> ({nights} Nights)
                    </p>
                    <p className="text-xs text-slate-600">
                      Rooms: <span className="font-bold">{booking.roomType}</span>
                    </p>
                    <p className="text-xs text-slate-600">
                      Travelers: <span className="font-bold">{groupData?.totalPax || booking.adults || 1} Guests</span>
                    </p>
                  </div>
                </div>

                {/* Items Breakdown */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-bold">
                        <th className="py-2">Description</th>
                        <th className="py-2 text-center">Nights</th>
                        <th className="py-2 text-right">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      <tr>
                        <td className="py-3 font-bold text-slate-800">
                          {booking.roomType}
                        </td>
                        <td className="py-3 text-center">{nights}</td>
                        <td className="py-3 text-right font-mono font-bold">
                          ₹{Number(groupData?.billing?.roomsCost || (grandTotal * 0.85)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </td>
                      </tr>
                      {groupData?.mealPlan && groupData.mealPlan !== 'EP' && (
                        <tr>
                          <td className="py-3 font-bold text-slate-800">
                            {groupData.mealPlan} Dining Package ({groupData.totalPax} Pax)
                          </td>
                          <td className="py-3 text-center">{nights}</td>
                          <td className="py-3 text-right font-mono font-bold">
                            ₹{Number(groupData.billing?.mealsCost || 0).toLocaleString('en-IN')}
                          </td>
                        </tr>
                      )}
                      <tr>
                        <td className="py-2.5 text-slate-500">GST / Luxury Tax</td>
                        <td className="py-2.5 text-center">-</td>
                        <td className="py-2.5 text-right font-mono text-slate-700">
                          ₹{Number(groupData?.billing?.taxAmount || (grandTotal * 0.12)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div className="border-t-2 border-slate-200 pt-4 space-y-2">
                  <div className="flex justify-between text-xs text-slate-600 font-bold">
                    <span>Total Package Value:</span>
                    <span className="font-mono">₹{Number(grandTotal).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-xs text-emerald-600 font-bold bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
                    <span>Agent Commission Deducted:</span>
                    <span className="font-mono">-₹{Number(commission).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-base font-black text-slate-900 border-t border-slate-200 pt-2">
                    <span>Net Amount Payable by Agent:</span>
                    <span className="text-xl text-violet-700 font-mono">
                      ₹{Number(netPayable).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex items-center justify-end gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={handleSendWhatsApp}
                  disabled={sendingWa}
                  className={`flex items-center gap-2 px-6 h-12 rounded-2xl text-xs font-bold transition-all shadow-md ${waSentSuccess
                    ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                    }`}
                >
                  {sendingWa ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  {sendingWa
                    ? 'Dispatching...'
                    : waSentSuccess
                      ? '✓ Re-Sent to Agent WhatsApp!'
                      : 'Send Invoice to Agent WhatsApp'}
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-5 h-12 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold"
                >
                  <Printer size={16} /> Print Official Copy
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: PASSENGER MANIFEST & IDS */}
          {activeTab === 'manifest' && groupData?.members && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Users size={16} className="text-violet-400" />
                  Passenger Roster & KYC Identification ({groupData.members.length} Travelers)
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groupData.members.map((mem: any, idx: number) => (
                  <div
                    key={mem.id || idx}
                    className="bg-[#0a1024] border border-slate-800 rounded-2xl p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-violet-600/20 text-violet-300 border border-violet-500/30 flex items-center justify-center text-xs font-black">
                          #{idx + 1}
                        </span>
                        <span className="text-sm font-bold text-white">{mem.name || 'Passenger'}</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                        {mem.roomAllocated || 'Standard Room'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase">Age / Gender</span>
                        <span className="text-slate-300 font-bold">
                          {mem.age} Yrs • {mem.gender}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase">Dietary</span>
                        <span className="text-slate-300 font-bold">{mem.mealPreference}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-[10px] text-slate-500 block uppercase">ID Proof</span>
                        <span className="text-white font-mono font-bold">
                          {mem.idType}: {mem.idNumber || 'N/A'}
                        </span>
                      </div>
                    </div>

                    {/* ID Photos */}
                    {(mem.idFrontUrl || mem.idBackUrl) && (
                      <div className="pt-2 border-t border-slate-800/60 flex items-center gap-3">
                        {mem.idFrontUrl && (
                          <a
                            href={mem.idFrontUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-[11px] font-bold text-sky-400 hover:text-sky-300"
                          >
                            <ExternalLink size={12} /> View ID Front
                          </a>
                        )}
                        {mem.idBackUrl && (
                          <a
                            href={mem.idBackUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-[11px] font-bold text-sky-400 hover:text-sky-300"
                          >
                            <ExternalLink size={12} /> View ID Back
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: ITINERARY & TRANSPORT */}
          {activeTab === 'itinerary' && groupData && (
            <div className="space-y-6">
              {/* Transport Info */}
              {groupData.transport && (
                <div className="bg-[#0a1024] border border-slate-800 rounded-2xl p-5 space-y-3">
                  <h4 className="text-xs font-black text-sky-400 uppercase tracking-wider">
                    Transport & Vehicle Information
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase">Vehicle Type</span>
                      <span className="text-white font-bold">{groupData.transport.vehicleType}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase">Number Plate / Flight</span>
                      <span className="text-white font-mono font-bold">{groupData.transport.vehicleNumber || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase">Driver / Lead</span>
                      <span className="text-white font-bold">{groupData.transport.driverName || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase">Driver Phone</span>
                      <span className="text-white font-mono font-bold">{groupData.transport.driverPhone || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Day-by-Day List */}
              {groupData.itinerary && (
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-sky-400 uppercase tracking-wider">
                    Tour Schedule ({groupData.itinerary.length} Days)
                  </h4>
                  {groupData.itinerary.map((item: any) => (
                    <div
                      key={item.day}
                      className="p-4 rounded-2xl bg-[#0a1024] border border-slate-800 flex items-start gap-4"
                    >
                      <span className="w-9 h-9 rounded-xl bg-sky-600/20 text-sky-300 border border-sky-500/30 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                        D{item.day}
                      </span>
                      <div className="space-y-1">
                        <h5 className="text-sm font-black text-white">{item.title}</h5>
                        <p className="text-xs text-slate-400 leading-relaxed">{item.activities}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

