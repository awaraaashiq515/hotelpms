'use client';

import React, { useState } from 'react';
import {
  MessageSquareQuote, Calendar, Phone, User, CheckCircle2,
  XCircle, IndianRupee, ArrowRight, ShieldCheck, Sparkles, Filter,
  Bike, ExternalLink, Volume2, Bell
} from 'lucide-react';
import { toast } from 'sonner';
import { EnquiryItem, BikeItem } from './types';
import { playNotificationSound } from '@/lib/notification-sound';

interface EnquiriesTabProps {
  enquiries: EnquiryItem[];
  availableBikes: BikeItem[];
  loading: boolean;
  onAcceptEnquiry: (enquiryId: string, bikeId: string, quotePrice?: number) => void;
  onQuoteEnquiry: (enquiryId: string, quotePrice: number) => void;
  onRejectEnquiry: (enquiryId: string, reason?: string) => void;
}

export const EnquiriesTab: React.FC<EnquiriesTabProps> = ({
  enquiries,
  availableBikes,
  loading,
  onAcceptEnquiry,
  onQuoteEnquiry,
  onRejectEnquiry,
}) => {
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'NEW' | 'QUOTED' | 'CONFIRMED' | 'CANCELLED'>('ALL');
  const [selectedEnquiry, setSelectedEnquiry] = useState<EnquiryItem | null>(null);
  const [assignBikeId, setAssignBikeId] = useState('');
  const [quoteAmount, setQuoteAmount] = useState('');
  const [modalMode, setModalMode] = useState<'ACCEPT' | 'QUOTE' | 'REJECT' | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const filteredEnquiries = enquiries.filter((e) => {
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'NEW') return e.status === 'NEW' || e.status === 'PENDING';
    return e.status === statusFilter;
  });

  const handleOpenAction = (enquiry: EnquiryItem, mode: 'ACCEPT' | 'QUOTE' | 'REJECT') => {
    setSelectedEnquiry(enquiry);
    setModalMode(mode);
    setQuoteAmount(String(enquiry.quotedPrice || enquiry.estimatedBudget || 500));
    setRejectReason('Fleet fully committed for requested dates');

    // Preselect a bike of requested category if available
    const matchedBike = availableBikes.find(
      (b) => b.category.toUpperCase() === enquiry.categoryRequested.toUpperCase()
    );
    setAssignBikeId(matchedBike ? matchedBike.id : availableBikes[0]?.id || '');
  };

  const handleConfirmAction = () => {
    if (!selectedEnquiry || !modalMode) return;

    if (modalMode === 'ACCEPT') {
      onAcceptEnquiry(selectedEnquiry.id, assignBikeId, Number(quoteAmount));
    } else if (modalMode === 'QUOTE') {
      onQuoteEnquiry(selectedEnquiry.id, Number(quoteAmount));
    } else if (modalMode === 'REJECT') {
      onRejectEnquiry(selectedEnquiry.id, rejectReason);
    }

    setModalMode(null);
    setSelectedEnquiry(null);
  };

  return (
    <div className="space-y-4">
      {/* Header & Filter Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-black text-white flex items-center gap-2">
              <MessageSquareQuote size={18} className="text-sky-400" />
              <span>Rental Requests & Enquiries ({enquiries.length})</span>
            </h2>
            <button
              onClick={() => {
                playNotificationSound('lead');
                toast.success('🔊 Enquiry bell audio tested successfully!');
              }}
              className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all flex items-center gap-1 cursor-pointer"
              title="Click to test notification chime"
            >
              <Volume2 size={11} className="animate-pulse" />
              <span>Bell Active (Test)</span>
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Incoming booking leads from Travel Agents, Hotel Reception & Online Tourists
          </p>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['ALL', 'NEW', 'QUOTED', 'CONFIRMED', 'CANCELLED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === st
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {st === 'ALL' ? 'All' : st === 'NEW' ? 'New / Pending' : st === 'QUOTED' ? 'Quoted' : st === 'CONFIRMED' ? 'Confirmed' : 'Declined'}
            </button>
          ))}
        </div>
      </div>

      {/* Enquiries List */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Loading Enquiries...</p>
        </div>
      ) : filteredEnquiries.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-slate-800 rounded-3xl bg-[#0b1120]/40 space-y-2">
          <MessageSquareQuote size={40} className="mx-auto text-slate-700" />
          <p className="text-sm font-black text-slate-300">No Rental Requests Found</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {enquiries.length === 0
              ? 'New rental leads from Travel Agents and Guests will appear here automatically.'
              : 'No enquiries match the selected filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEnquiries.map((e) => {
            const isNew = e.status === 'NEW' || e.status === 'PENDING';
            const isQuoted = e.status === 'QUOTED';
            const isConfirmed = e.status === 'CONFIRMED' || e.status === 'ACTIVE';
            const isCancelled = e.status === 'CANCELLED';

            return (
              <div
                key={e.id}
                className="p-5 rounded-3xl bg-[#0b1120] border border-slate-800/90 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
              >
                {/* Customer & Trip Details */}
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-black text-white">{e.customerName}</span>
                    <a
                      href={`tel:${e.customerPhone}`}
                      className="text-xs text-slate-400 hover:text-sky-400 font-mono flex items-center gap-1 transition-colors"
                    >
                      <Phone size={11} />
                      {e.customerPhone}
                    </a>
                    <span
                      className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                        e.source === 'AGENT_PORTAL'
                          ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                          : e.source === 'HOTEL_DESK'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {e.source.replace('_', ' ')}
                    </span>
                    <span
                      className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                        isNew
                          ? 'bg-sky-500/10 text-sky-400 border-sky-500/20 animate-pulse'
                          : isQuoted
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : isConfirmed
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-slate-800 text-slate-500 border-slate-800'
                      }`}
                    >
                      {e.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-300 flex-wrap">
                    <div className="flex items-center gap-1.5 font-bold text-white">
                      <Bike size={13} className="text-rose-400" />
                      <span>{e.categoryRequested}</span>
                      <span className="text-slate-500 font-normal">({e.quantity} Unit)</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Calendar size={13} className="text-slate-500" />
                      <span>{e.startDate} to {e.endDate}</span>
                      <span className="text-slate-500 font-bold">({e.days} Day{e.days > 1 ? 's' : ''})</span>
                    </div>

                    {e.estimatedBudget && (
                      <div className="flex items-center gap-1 text-slate-400">
                        <span>Budget:</span>
                        <strong className="text-amber-400 font-bold">₹{e.estimatedBudget.toLocaleString('en-IN')}</strong>
                      </div>
                    )}
                  </div>

                  {e.specialRequirements && (
                    <p className="text-[11px] text-slate-500 bg-slate-900/60 rounded-xl px-3 py-1.5 inline-block">
                      Note: {e.specialRequirements}
                    </p>
                  )}
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end pt-3 md:pt-0 border-t md:border-t-0 border-slate-800/80 flex-wrap">
                  {/* WhatsApp contact */}
                  <a
                    href={`https://wa.me/91${e.customerPhone.replace(/[^0-9]/g, '')}?text=Hi%20${encodeURIComponent(e.customerName)},%20this%20is%20regarding%20your%20bike%20rental%20enquiry.`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>WhatsApp</span>
                    <ExternalLink size={11} />
                  </a>

                  {/* Accept & Assign */}
                  {(isNew || isQuoted) && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => handleOpenAction(e, 'QUOTE')}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-black transition-all cursor-pointer"
                      >
                        Quote Price
                      </button>

                      <button
                        onClick={() => handleOpenAction(e, 'ACCEPT')}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer active:scale-95"
                      >
                        <CheckCircle2 size={13} />
                        <span>Accept & Assign</span>
                      </button>

                      <button
                        onClick={() => handleOpenAction(e, 'REJECT')}
                        className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Decline Enquiry"
                      >
                        <XCircle size={15} />
                      </button>
                    </div>
                  )}

                  {isConfirmed && (
                    <div className="text-right">
                      <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 justify-end">
                        <CheckCircle2 size={11} /> Confirmed & Booked
                      </span>
                      <span className="text-xs font-mono text-slate-400">Total: ₹{e.quotedPrice}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Action Modal ── */}
      {modalMode && selectedEnquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-[#0b1120] border border-slate-700 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-400">
                {modalMode === 'ACCEPT' ? 'Confirm Booking' : modalMode === 'QUOTE' ? 'Send Custom Quote' : 'Decline Request'}
              </span>
              <h3 className="text-base font-black text-white mt-0.5">
                {selectedEnquiry.customerName} ({selectedEnquiry.categoryRequested})
              </h3>
              <p className="text-xs text-slate-400">
                Trip: {selectedEnquiry.startDate} to {selectedEnquiry.endDate} ({selectedEnquiry.days} Days)
              </p>
            </div>

            {modalMode === 'ACCEPT' && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Assign Bike from Available Fleet *</label>
                  <select
                    value={assignBikeId}
                    onChange={(e) => setAssignBikeId(e.target.value)}
                    className="w-full bg-[#060a14] border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-rose-500"
                  >
                    {availableBikes.length === 0 ? (
                      <option value="">No bikes currently available</option>
                    ) : (
                      availableBikes.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.model} ({b.plateNumber}) — ₹{b.dailyRate}/day
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Confirmed Rental Price (₹) *</label>
                  <input
                    type="number"
                    value={quoteAmount}
                    onChange={(e) => setQuoteAmount(e.target.value)}
                    className="w-full bg-[#060a14] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>
            )}

            {modalMode === 'QUOTE' && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Proposed Quote Amount (₹) *</label>
                  <input
                    type="number"
                    value={quoteAmount}
                    onChange={(e) => setQuoteAmount(e.target.value)}
                    className="w-full bg-[#060a14] border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-rose-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">This price will be proposed to the customer/agent for approval.</p>
                </div>
              </div>
            )}

            {modalMode === 'REJECT' && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Reason for Declining *</label>
                  <textarea
                    rows={3}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full bg-[#060a14] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500 resize-none"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setModalMode(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={modalMode === 'ACCEPT' && !assignBikeId}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-black transition-all shadow-lg shadow-rose-600/25"
              >
                {modalMode === 'ACCEPT' ? 'Confirm Booking' : modalMode === 'QUOTE' ? 'Submit Quote' : 'Decline Lead'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
