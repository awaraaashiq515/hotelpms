'use client';

import React, { useState } from 'react';
import { TrendingUp, Clock } from 'lucide-react';
import { Driver, HistoryOrder } from '../types';
import { OrderHistoryTab } from './OrderHistoryTab';

interface EarningsTabProps {
  t: any;
  earnings: any;
  codCollectedOrders: Set<string>;
  handoverHistory: { id: string; date: string; amount: number; status: string }[];
  handleInitiateHandover: () => void;
  upiId: string;
  setUpiId: (val: string) => void;
  selectedDriver: Driver;
  tipsLog: { [orderNo: string]: number };
  handleAddTip: (e: React.FormEvent) => void;
  tipTargetOrder: string | null;
  setTipTargetOrder: (val: string | null) => void;
  tipInputVal: string;
  setTipInputVal: (val: string) => void;
  totalTipsLogged: number;
  orderHistory: HistoryOrder[];
  loadingHistory: boolean;
}

export function EarningsTab({
  t,
  earnings,
  codCollectedOrders,
  handoverHistory,
  handleInitiateHandover,
  upiId,
  setUpiId,
  selectedDriver,
  tipsLog,
  handleAddTip,
  tipTargetOrder,
  setTipTargetOrder,
  tipInputVal,
  setTipInputVal,
  totalTipsLogged,
  orderHistory,
  loadingHistory
}: EarningsTabProps) {
  const [earningsView, setEarningsView] = useState<'TODAY' | 'HISTORY'>('TODAY');

  return (
    <div className="space-y-4">
      {/* Sub-Tab Switcher: Today | History */}
      <div className="flex gap-1.5 p-1 bg-[#0f172a] rounded-2xl border border-[#1e293b]">
        <button
          onClick={() => setEarningsView('TODAY')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
            earningsView === 'TODAY'
              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <TrendingUp size={11} /> Today&apos;s Earnings
        </button>
        <button
          onClick={() => setEarningsView('HISTORY')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
            earningsView === 'HISTORY'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Clock size={11} /> Order History
        </button>
      </div>

      {/* ── TODAY VIEW ─────────────────────────────────────────────────── */}
      {earningsView === 'TODAY' && (
        <>
          {/* Earnings card summary */}
          <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/25 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <TrendingUp size={20} />
              </div>
              <div>
                <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest leading-none">Today&apos;s Summary</p>
                <p className="text-[9.5px] font-bold text-slate-400 mt-1">{earnings?.date || 'Today'}</p>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-1.5">
              <div className="bg-black/30 rounded-xl p-2.5 border border-white/5 text-center">
                <p className="text-[7.5px] font-black text-slate-500 uppercase tracking-widest">Trips</p>
                <p className="text-xs font-black text-white mt-0.5">{earnings?.totalTrips ?? 0}</p>
              </div>
              <div className="bg-black/30 rounded-xl p-2.5 border border-white/5 text-center">
                <p className="text-[7.5px] font-black text-slate-500 uppercase tracking-widest">Base Payout</p>
                <p className="text-xs font-black text-emerald-400 mt-0.5">₹{earnings ? Math.round(earnings.totalValue) : 0}</p>
              </div>
              <div className="bg-black/30 rounded-xl p-2.5 border border-white/5 text-center">
                <p className="text-[7.5px] font-black text-slate-500 uppercase tracking-widest">Cash Coll.</p>
                <p className="text-xs font-black text-amber-400 mt-0.5">₹{earnings?.totalCashCollected ?? 0}</p>
              </div>
              <div className="bg-black/30 rounded-xl p-2.5 border border-white/5 text-center">
                <p className="text-[7.5px] font-black text-slate-500 uppercase tracking-widest">UPI Coll.</p>
                <p className="text-xs font-black text-indigo-400 mt-0.5">₹{earnings?.totalUpiCollected ?? 0}</p>
              </div>
              <div className="bg-black/30 rounded-xl p-2.5 border border-white/5 text-center">
                <p className="text-[7.5px] font-black text-slate-500 uppercase tracking-widest">Tips</p>
                <p className="text-xs font-black text-rose-400 mt-0.5">₹{earnings?.totalTipsLogged ?? totalTipsLogged}</p>
              </div>
            </div>
          </div>

          {/* UPI Payout configurations */}
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-4 space-y-3">
            <div>
              <h4 className="text-xs font-black text-white uppercase tracking-tight">UPI Payout Settings</h4>
              <p className="text-[8.5px] text-slate-500 font-bold uppercase mt-0.5">Configure your withdrawal account</p>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. rider@okaxis"
                value={upiId}
                onChange={e => setUpiId(e.target.value)}
                className="flex-1 h-9 px-3 rounded-lg bg-[#070b12] border border-[#1e293b] text-white placeholder-slate-700 outline-none text-[11px] font-mono"
              />
              <button
                onClick={() => {
                  if (upiId.trim() && selectedDriver) {
                    localStorage.setItem(`driver_upi_${selectedDriver.id}`, upiId.trim());
                    alert("UPI payout settings saved.");
                  }
                }}
                className="px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[8px] font-black uppercase tracking-wider transition-all"
              >
                Save
              </button>
            </div>
          </div>

          {/* Cash Handover details */}
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-4 space-y-3">
            <div>
              <h4 className="text-xs font-black text-white uppercase tracking-tight">Cash Handover Panel</h4>
              <p className="text-[8.5px] text-slate-500 font-bold uppercase mt-0.5">Outstanding Cash collected from COD</p>
            </div>

            {(() => {
              const pendingAmt = earnings?.outstandingCash ?? 0;

              return (
                <div className="space-y-3">
                  <div className="bg-[#070b12] border border-[#1e293b]/70 p-3 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">COLLECTED CASH TOTAL</span>
                      <p className="text-xl font-black text-amber-500 mt-1">₹{pendingAmt.toFixed(0)}</p>
                    </div>

                    <button
                      onClick={handleInitiateHandover}
                      disabled={pendingAmt <= 0}
                      className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-xl text-[8.5px] font-black uppercase tracking-widest shadow-md transition-all shrink-0"
                    >
                      Handover Cash
                    </button>
                  </div>

                  {/* Handover Requests log list */}
                  {handoverHistory.length > 0 && (
                    <div className="space-y-2 border-t border-[#1e293b]/60 pt-3">
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">Previous Handover Logs</p>

                      <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
                        {handoverHistory.map(req => (
                          <div key={req.id} className="bg-[#070b12] border border-[#1e293b]/60 px-3 py-2 rounded-xl flex items-center justify-between text-[10px] uppercase font-bold">
                            <div>
                              <p className="font-bold text-slate-350">{req.date}</p>
                              <p className="text-[8px] text-indigo-400 font-black mt-0.5">₹{req.amount} Handoff</p>
                            </div>
                            <span className={`text-[7.5px] font-black px-2 py-0.5 rounded-md ${
                              req.status === 'PENDING_APPROVAL'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}>
                              {req.status === 'PENDING_APPROVAL' ? 'PENDING' : 'APPROVED'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Tip adding setup */}
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-4 space-y-3">
            <div>
              <h4 className="text-xs font-black text-white uppercase tracking-tight">Manual Tips Tracker</h4>
              <p className="text-[8.5px] text-slate-500 font-bold uppercase mt-0.5">Log tips received in cash/online</p>
            </div>

            {earnings?.trips && earnings.trips.length > 0 ? (
              <form onSubmit={handleAddTip} className="flex gap-2">
                <select
                  value={tipTargetOrder || ''}
                  onChange={e => setTipTargetOrder(e.target.value)}
                  className="flex-1 h-9 px-2 rounded-lg bg-[#070b12] border border-[#1e293b] text-white text-[10px] focus:outline-none"
                  required
                >
                  <option value="">Select Trip</option>
                  {earnings.trips.map((tr: any) => (
                    <option key={tr.id} value={tr.orderNo}>{tr.orderNo} (₹{Math.round(tr.grandTotal)})</option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Tip ₹"
                  value={tipInputVal}
                  onChange={e => setTipInputVal(e.target.value)}
                  className="w-20 h-9 px-2.5 rounded-lg bg-[#070b12] border border-[#1e293b] text-white placeholder-slate-700 outline-none text-[10px]"
                  required
                />
                <button
                  type="submit"
                  className="px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[8px] font-black uppercase tracking-wider"
                >
                  Add
                </button>
              </form>
            ) : (
              <p className="text-[9px] text-slate-500 uppercase font-bold text-center py-2">No trips completed today to log tips.</p>
            )}
          </div>
        </>
      )}

      {/* ── HISTORY VIEW ─────────────────────────────────────────────────── */}
      {earningsView === 'HISTORY' && (
        <OrderHistoryTab orderHistory={orderHistory} loadingHistory={loadingHistory} />
      )}
    </div>
  );
}
