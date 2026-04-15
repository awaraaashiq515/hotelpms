'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Clock,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowDownCircle,
  ArrowUpCircle,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  FileText,
  Printer,
  Lock,
  Unlock,
  CreditCard,
  Smartphone,
  Banknote,
  MoreHorizontal,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { apiClient } from '@/lib/api/client';

interface Shift {
  id: string;
  shiftNo: string;
  cashierName: string;
  openedAt: string;
  closedAt?: string;
  openingCash: number;
  status: string;
  notes?: string;
  withdrawals: CashEntry[];
  topUps: CashEntry[];
}

interface CashEntry {
  id: string;
  amount: number;
  reason?: string;
  approvedBy?: string;
  source?: string;
  withdrawnAt?: string;
  addedAt?: string;
}

interface DayClosing {
  id: string;
  closingDate: string;
  totalSales: number;
  cashSales: number;
  cardSales: number;
  upiSales: number;
  otherSales: number;
  expectedCash: number;
  actualCash: number;
  varianceAmount: number;
  invoiceCount: number;
  withdrawalAmount: number;
  topUpAmount: number;
  openingCash: number;
  closedBy?: string;
  notes?: string;
  shift?: { shiftNo: string; cashierName: string; openedAt: string };
}

type Tab = 'current' | 'withdrawal' | 'topup' | 'history';

export default function DayClosingPage() {
  const [tab, setTab] = useState<Tab>('current');
  const [shift, setShift] = useState<Shift | null>(null);
  const [history, setHistory] = useState<DayClosing[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Shift open form
  const [isOpenShiftOpen, setIsOpenShiftOpen] = useState(false);
  const [openingCash, setOpeningCash] = useState('');
  const [cashierName, setCashierName] = useState('');
  const [shiftNotes, setShiftNotes] = useState('');
  const [openingShift, setOpeningShift] = useState(false);

  // Shift close form
  const [isCloseShiftOpen, setIsCloseShiftOpen] = useState(false);
  const [actualCash, setActualCash] = useState('');
  const [closeNotes, setCloseNotes] = useState('');
  const [closingShift, setClosingShift] = useState(false);
  const [closeResult, setCloseResult] = useState<DayClosing | null>(null);

  // Withdrawal form
  const [wdAmount, setWdAmount] = useState('');
  const [wdReason, setWdReason] = useState('');
  const [wdApprover, setWdApprover] = useState('');
  const [wdLoading, setWdLoading] = useState(false);
  const [wdSuccess, setWdSuccess] = useState(false);

  // Top-up form
  const [tuAmount, setTuAmount] = useState('');
  const [tuReason, setTuReason] = useState('');
  const [tuSource, setTuSource] = useState('');
  const [tuLoading, setTuLoading] = useState(false);
  const [tuSuccess, setTuSuccess] = useState(false);

  const fetchShift = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.get<Shift | null>('/api/day-closing/shift');
      if (data && data.id) {
        setShift({
          ...data,
          withdrawals: data.withdrawals || [],
          topUps: data.topUps || [],
        });
      } else {
        setShift(null);
      }
    } catch {
      setShift(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const data = await apiClient.get<DayClosing[]>('/api/day-closing/history');
      setHistory(data || []);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShift();
  }, [fetchShift]);

  useEffect(() => {
    if (tab === 'history') fetchHistory();
  }, [tab, fetchHistory]);

  // Computed values from current shift
  const totalWithdrawals = (shift?.withdrawals ?? []).reduce((s, w) => s + w.amount, 0);
  const totalTopUps = (shift?.topUps ?? []).reduce((s, t) => s + t.amount, 0);

  const handleOpenShift = async () => {
    setOpeningShift(true);
    try {
      const data = await apiClient.post<Shift>('/api/day-closing/shift', {
        openingCash: Number(openingCash || 0),
        cashierName,
        notes: shiftNotes,
      });
      setShift({
        ...data,
        withdrawals: data.withdrawals || [],
        topUps: data.topUps || [],
      });
      setIsOpenShiftOpen(false);
      setOpeningCash('');
      setCashierName('');
      setShiftNotes('');
    } catch (err: any) {
      alert(err.message || 'Failed to open shift');
    } finally {
      setOpeningShift(false);
    }
  };

  const handleCloseShift = async () => {
    if (!shift) return;
    setClosingShift(true);
    try {
      const data = await apiClient.post<{ dayClosing: DayClosing }>(
        `/api/day-closing/shift/${shift.id}`,
        { actualCash: Number(actualCash || 0), notes: closeNotes }
      );
      setCloseResult(data.dayClosing);
      setShift(null);
      setIsCloseShiftOpen(false);
      setActualCash('');
      setCloseNotes('');
      // Auto-navigate to history tab and reload
      setTab('history');
      fetchHistory();
    } catch (err: any) {
      alert(err.message || 'Failed to close shift');
    } finally {
      setClosingShift(false);
    }
  };

  const handleWithdrawal = async () => {
    if (!shift || !wdAmount) return;
    setWdLoading(true);
    setWdSuccess(false);
    try {
      await apiClient.post('/api/day-closing/withdrawal', {
        shiftId: shift.id,
        amount: Number(wdAmount),
        reason: wdReason,
        approvedBy: wdApprover,
      });
      setWdSuccess(true);
      setWdAmount('');
      setWdReason('');
      setWdApprover('');
      fetchShift();
    } catch (err: any) {
      alert(err.message || 'Withdrawal failed');
    } finally {
      setWdLoading(false);
    }
  };

  const handleTopUp = async () => {
    if (!shift || !tuAmount) return;
    setTuLoading(true);
    setTuSuccess(false);
    try {
      await apiClient.post('/api/day-closing/topup', {
        shiftId: shift.id,
        amount: Number(tuAmount),
        reason: tuReason,
        source: tuSource,
      });
      setTuSuccess(true);
      setTuAmount('');
      setTuReason('');
      setTuSource('');
      fetchShift();
    } catch (err: any) {
      alert(err.message || 'Top-up failed');
    } finally {
      setTuLoading(false);
    }
  };

  const tabs = [
    { id: 'current', label: 'Current Shift', icon: Clock },
    { id: 'withdrawal', label: 'Cash Withdrawal', icon: ArrowDownCircle },
    { id: 'topup', label: 'Cash Top-Up', icon: ArrowUpCircle },
    { id: 'history', label: 'Closing History', icon: FileText },
  ] as const;

  const inputCls = 'w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl text-sm font-bold dark:text-white focus:border-pos-primary/40 focus:bg-white dark:focus:bg-slate-700 outline-none transition-all';
  const labelCls = 'block text-[10px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-1.5';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black section-heading uppercase tracking-tight">Day Closing</h1>
          <p className="text-xs font-bold text-gray-400 dark:text-slate-400 uppercase tracking-widest mt-0.5">
            Cash control · Shift management · Closing reports
          </p>
        </div>
        {!shift && !loading && (
          <Button
            onClick={() => setIsOpenShiftOpen(true)}
            className="flex items-center gap-2 bg-pos-primary hover:bg-pos-primary-dark text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-pos-primary/10"
          >
            <Unlock size={16} />
            Open New Shift
          </Button>
        )}
      </div>

      {/* Close Result Banner */}
      {closeResult && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle size={24} className="text-green-600" />
            <div>
              <h3 className="font-black text-green-800 uppercase tracking-tight">Shift Closed Successfully</h3>
              <p className="text-xs text-green-600 font-bold mt-0.5">{new Date(closeResult.closingDate).toLocaleString('en-IN')}</p>
            </div>
            <button onClick={() => setCloseResult(null)} className="ml-auto text-green-400 hover:text-green-600"><X size={18} /></button>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Total Sales', value: `₹${closeResult.totalSales.toFixed(2)}`, color: 'text-gray-900' },
              { label: 'Expected Cash', value: `₹${closeResult.expectedCash.toFixed(2)}`, color: 'text-blue-700' },
              { label: 'Actual Cash', value: `₹${closeResult.actualCash.toFixed(2)}`, color: 'text-gray-900' },
              { label: 'Variance', value: `${closeResult.varianceAmount >= 0 ? '+' : ''}₹${closeResult.varianceAmount.toFixed(2)}`, color: closeResult.varianceAmount === 0 ? 'text-green-600' : closeResult.varianceAmount > 0 ? 'text-pos-primary' : 'text-red-600' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white rounded-xl p-4 shadow-sm">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
                <p className={`text-xl font-black mt-1 ${color}`}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status Bar */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 p-8 text-center text-xs font-bold text-gray-300 dark:text-slate-500 uppercase">Loading shift...</div>
      ) : shift ? (
        <div className="bg-gradient-to-r from-pos-primary to-pos-primary-dark rounded-2xl p-6 text-white shadow-xl shadow-pos-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                <Unlock size={22} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Active Shift</p>
                <h2 className="text-xl font-black">{shift.shiftNo}</h2>
                <p className="text-xs font-bold opacity-60 mt-0.5">
                  {shift.cashierName} · Opened {new Date(shift.openedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Opening Cash</p>
                <p className="text-2xl font-black">₹{shift.openingCash.toLocaleString('en-IN')}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Withdrawals</p>
                <p className="text-xl font-black text-red-300">-₹{totalWithdrawals.toLocaleString('en-IN')}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Top-Ups</p>
                <p className="text-xl font-black text-green-300">+₹{totalTopUps.toLocaleString('en-IN')}</p>
              </div>
              <Button
                onClick={() => setIsCloseShiftOpen(true)}
                className="bg-white text-pos-primary hover:bg-pos-primary/10 px-5 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg"
              >
                <Lock size={14} />
                Close Shift
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 dark:bg-slate-900 border border-dashed border-gray-200 dark:border-slate-700 rounded-2xl p-10 flex flex-col items-center justify-center gap-4 text-gray-400 dark:text-slate-500">
          <Lock size={40} className="opacity-30" />
          <div className="text-center">
            <p className="font-black text-sm uppercase tracking-widest">No Active Shift</p>
            <p className="text-xs font-bold mt-1 opacity-60">Open a shift to start tracking cash and sales</p>
          </div>
          <Button
            onClick={() => setIsOpenShiftOpen(true)}
            className="bg-pos-primary hover:bg-pos-primary-dark text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-pos-primary/10"
          >
            <Unlock size={14} />
            Open Shift
          </Button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-100 dark:border-slate-700 overflow-x-auto no-scrollbar">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id as Tab)}
            className={`flex items-center gap-2 px-5 py-3 text-[11px] font-black uppercase tracking-widest whitespace-nowrap border-b-2 transition-all ${
              tab === id ? 'border-pos-primary text-pos-primary' : 'border-transparent text-gray-400 dark:text-slate-400 hover:text-gray-700 dark:hover:text-white'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* CURRENT SHIFT TAB */}
      {tab === 'current' && (
        <div className="space-y-4">
          {!shift ? (
            <div className="text-center text-xs font-bold text-gray-400 dark:text-slate-500 uppercase py-10">Open a shift to see live data</div>
          ) : (
            <>
              {/* Withdrawal & Top-up log */}
              <div className="grid grid-cols-2 gap-4">
                {/* Withdrawals */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-gray-50 dark:border-slate-700 flex items-center gap-3">
                    <div className="p-2 bg-red-50 dark:bg-red-950 rounded-xl"><ArrowDownCircle size={18} className="text-red-500" /></div>
                    <div>
                      <h3 className="font-black text-sm section-heading">Cash Withdrawals</h3>
                      <p className="text-[10px] text-gray-400 dark:text-slate-400 font-bold uppercase tracking-widest">
                        Total: <span className="text-red-500">-₹{totalWithdrawals.toLocaleString('en-IN')}</span>
                      </p>
                    </div>
                  </div>
                  {shift.withdrawals.length === 0 ? (
                    <div className="p-8 text-center text-xs font-bold text-gray-300 dark:text-slate-500 uppercase">No withdrawals</div>
                  ) : (
                    <div className="divide-y divide-gray-50 dark:divide-slate-700">
                      {shift.withdrawals.map(w => (
                        <div key={w.id} className="px-5 py-3 flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-gray-900 dark:text-white">₹{w.amount.toLocaleString('en-IN')}</p>
                            <p className="text-[10px] text-gray-400 dark:text-slate-500 font-medium">{w.reason || 'No reason'}</p>
                          </div>
                          <p className="text-[9px] text-gray-400 dark:text-slate-500 font-bold">
                            {new Date(w.withdrawnAt!).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Top-ups */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-gray-50 dark:border-slate-700 flex items-center gap-3">
                    <div className="p-2 bg-green-50 dark:bg-green-950 rounded-xl"><ArrowUpCircle size={18} className="text-green-500" /></div>
                    <div>
                      <h3 className="font-black text-sm section-heading">Cash Top-Ups</h3>
                      <p className="text-[10px] text-gray-400 dark:text-slate-400 font-bold uppercase tracking-widest">
                        Total: <span className="text-green-600">+₹{totalTopUps.toLocaleString('en-IN')}</span>
                      </p>
                    </div>
                  </div>
                  {shift.topUps.length === 0 ? (
                    <div className="p-8 text-center text-xs font-bold text-gray-300 dark:text-slate-500 uppercase">No top-ups</div>
                  ) : (
                    <div className="divide-y divide-gray-50 dark:divide-slate-700">
                      {shift.topUps.map(t => (
                        <div key={t.id} className="px-5 py-3 flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-gray-900 dark:text-white">₹{t.amount.toLocaleString('en-IN')}</p>
                            <p className="text-[10px] text-gray-400 dark:text-slate-500 font-medium">{t.reason || 'No reason'}</p>
                          </div>
                          <p className="text-[9px] text-gray-400 dark:text-slate-500 font-bold">
                            {new Date(t.addedAt!).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Quick actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setTab('withdrawal')}
                  className="flex items-center gap-2 px-5 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-black uppercase tracking-widest transition-colors border border-red-100"
                >
                  <ArrowDownCircle size={16} /> Record Withdrawal
                </button>
                <button
                  onClick={() => setTab('topup')}
                  className="flex items-center gap-2 px-5 py-3 bg-green-50 hover:bg-green-100 text-green-600 rounded-xl text-xs font-black uppercase tracking-widest transition-colors border border-green-100"
                >
                  <ArrowUpCircle size={16} /> Add Top-Up
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* CASH WITHDRAWAL TAB */}
      {tab === 'withdrawal' && (
        <div className="max-w-md">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-8 space-y-5">
            <div>
              <h3 className="font-black text-lg section-heading uppercase tracking-tight">Cash Withdrawal</h3>
              <p className="text-xs text-gray-400 dark:text-slate-400 font-bold uppercase tracking-widest mt-1">Record cash taken out of the till</p>
            </div>
            {!shift && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-amber-700 text-xs font-black uppercase flex items-center gap-2">
                <AlertTriangle size={16} /> No active shift. Open a shift first.
              </div>
            )}
            {wdSuccess && (
              <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-green-700 text-xs font-black uppercase flex items-center gap-2">
                <CheckCircle size={16} /> Withdrawal recorded!
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Amount (₹) *</label>
                <input type="number" min="1" placeholder="0.00" value={wdAmount} onChange={e => setWdAmount(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Reason</label>
                <input type="text" placeholder="e.g. Payment to supplier, petty cash..." value={wdReason} onChange={e => setWdReason(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Approved By</label>
                <input type="text" placeholder="Manager name" value={wdApprover} onChange={e => setWdApprover(e.target.value)} className={inputCls} />
              </div>
              <Button
                loading={wdLoading}
                disabled={!shift || !wdAmount}
                onClick={handleWithdrawal}
                className="w-full py-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-red-100 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <ArrowDownCircle size={16} /> Record Withdrawal
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* CASH TOP-UP TAB */}
      {tab === 'topup' && (
        <div className="max-w-md">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-8 space-y-5">
            <div>
              <h3 className="font-black text-lg section-heading uppercase tracking-tight">Cash Top-Up</h3>
              <p className="text-xs text-gray-400 dark:text-slate-400 font-bold uppercase tracking-widest mt-1">Add extra cash to the till</p>
            </div>
            {!shift && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-amber-700 text-xs font-black uppercase flex items-center gap-2">
                <AlertTriangle size={16} /> No active shift. Open a shift first.
              </div>
            )}
            {tuSuccess && (
              <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-green-700 text-xs font-black uppercase flex items-center gap-2">
                <CheckCircle size={16} /> Top-up recorded!
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Amount (₹) *</label>
                <input type="number" min="1" placeholder="0.00" value={tuAmount} onChange={e => setTuAmount(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Source</label>
                <input type="text" placeholder="e.g. Owner, Bank, Safe..." value={tuSource} onChange={e => setTuSource(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Reason</label>
                <input type="text" placeholder="e.g. Change for large bills..." value={tuReason} onChange={e => setTuReason(e.target.value)} className={inputCls} />
              </div>
              <Button
                loading={tuLoading}
                disabled={!shift || !tuAmount}
                onClick={handleTopUp}
                className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-green-100 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <ArrowUpCircle size={16} /> Add Top-Up
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* HISTORY TAB */}
      {tab === 'history' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-50 dark:border-slate-700 flex items-center justify-between">
            <div>
              <h3 className="font-black text-sm section-heading uppercase">Closing History</h3>
              <p className="text-[10px] text-gray-400 dark:text-slate-400 font-bold uppercase tracking-widest">Last 30 day closings</p>
            </div>
            <button onClick={fetchHistory} className="p-2.5 text-gray-400 dark:text-slate-400 hover:text-pos-primary hover:bg-pos-primary/10 rounded-xl transition-colors">
              <RefreshCw size={16} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50">
                  {['Date', 'Shift', 'Cashier', 'Invoices', 'Total Sales', 'Cash', 'Card', 'UPI', 'Expected', 'Actual', 'Variance'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[9px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-[0.12em] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {historyLoading ? (
                  <tr><td colSpan={11} className="py-16 text-center text-xs font-bold text-gray-300 dark:text-slate-500 uppercase">Loading...</td></tr>
                ) : history.length === 0 ? (
                  <tr><td colSpan={11} className="py-16 text-center text-xs font-bold text-gray-300 dark:text-slate-500 uppercase">No closing records yet</td></tr>
                ) : history.map(c => (
                  <tr key={c.id} className="border-b border-gray-50 dark:border-slate-700 hover:bg-gray-50/30 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3.5 text-xs font-bold text-gray-900 dark:text-white whitespace-nowrap">
                      {new Date(c.closingDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-600 dark:text-slate-400 font-bold">{c.shift?.shiftNo || '—'}</td>
                    <td className="px-4 py-3.5 text-xs text-gray-500 dark:text-slate-400">{c.shift?.cashierName || c.closedBy || '—'}</td>
                    <td className="px-4 py-3.5 text-xs font-bold text-gray-700 dark:text-slate-300">{c.invoiceCount}</td>
                    <td className="px-4 py-3.5 text-sm font-black text-gray-900 dark:text-white">₹{c.totalSales.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3.5 text-xs font-bold text-gray-700 dark:text-slate-300 flex items-center gap-1"><Banknote size={11} className="text-emerald-500" />₹{c.cashSales.toFixed(0)}</td>
                    <td className="px-4 py-3.5 text-xs font-bold text-gray-700 dark:text-slate-300"><CreditCard size={11} className="inline text-blue-500 mr-1" />₹{c.cardSales.toFixed(0)}</td>
                    <td className="px-4 py-3.5 text-xs font-bold text-gray-700 dark:text-slate-300"><Smartphone size={11} className="inline text-purple-500 mr-1" />₹{c.upiSales.toFixed(0)}</td>
                    <td className="px-4 py-3.5 text-xs font-bold text-blue-700 dark:text-blue-400">₹{c.expectedCash.toFixed(2)}</td>
                    <td className="px-4 py-3.5 text-xs font-bold text-gray-900 dark:text-white">₹{c.actualCash.toFixed(2)}</td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs font-black ${c.varianceAmount === 0 ? 'text-gray-400 dark:text-slate-500' : c.varianceAmount > 0 ? 'text-pos-primary' : 'text-red-500'}`}>
                        {c.varianceAmount >= 0 ? '+' : ''}₹{c.varianceAmount.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Open Shift Modal */}
      <Modal isOpen={isOpenShiftOpen} onClose={() => setIsOpenShiftOpen(false)} title="Open New Shift">
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Cashier Name *</label>
            <input type="text" placeholder="Your name" value={cashierName} onChange={e => setCashierName(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Opening Cash (₹)</label>
            <input type="number" min="0" placeholder="Opening cash in drawer" value={openingCash} onChange={e => setOpeningCash(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Notes</label>
            <input type="text" placeholder="Optional notes for this shift" value={shiftNotes} onChange={e => setShiftNotes(e.target.value)} className={inputCls} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setIsOpenShiftOpen(false)} className="flex-1 py-3 border border-gray-200 bg-white text-xs font-bold uppercase tracking-widest">Cancel</Button>
            <Button loading={openingShift} disabled={!cashierName} onClick={handleOpenShift} className="flex-1 py-3 bg-pos-primary hover:bg-pos-primary-dark text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-pos-primary/10">
              <Unlock size={14} className="inline mr-2" />Open Shift
            </Button>
          </div>
        </div>
      </Modal>

      {/* Close Shift Modal */}
      <Modal isOpen={isCloseShiftOpen} onClose={() => setIsCloseShiftOpen(false)} title="Close Shift & Day Closing">
        <div className="space-y-5">
          {shift && (
            <div className="bg-pos-primary/10 border border-pos-primary/20 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-black text-pos-primary uppercase tracking-widest">Shift</span>
                <span className="font-black text-gray-900">{shift.shiftNo}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="font-black text-pos-primary uppercase tracking-widest">Opening Cash</span>
                <span className="font-black text-gray-900">₹{shift.openingCash.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="font-black text-pos-primary uppercase tracking-widest">Withdrawals</span>
                <span className="font-black text-red-500">-₹{totalWithdrawals.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="font-black text-pos-primary uppercase tracking-widest">Total Top-Ups</span>
                <span className="font-black text-green-600">+₹{totalTopUps.toLocaleString('en-IN')}</span>
              </div>
            </div>
          )}
          <div>
            <label className={labelCls}>Actual Cash in Drawer (₹) *</label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Count and enter actual cash"
              value={actualCash}
              onChange={e => setActualCash(e.target.value)}
              className={inputCls}
            />
            <p className="text-[10px] text-gray-400 font-bold mt-1.5">System will auto-calculate variance from expected cash</p>
          </div>
          <div>
            <label className={labelCls}>Closing Notes</label>
            <input type="text" placeholder="Any remarks for this closing" value={closeNotes} onChange={e => setCloseNotes(e.target.value)} className={inputCls} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setIsCloseShiftOpen(false)} className="flex-1 py-3 border border-gray-200 bg-white text-xs font-bold uppercase tracking-widest">Cancel</Button>
            <Button
              loading={closingShift}
              disabled={!actualCash}
              onClick={handleCloseShift}
              className="flex-1 py-3 bg-pos-primary hover:bg-pos-primary-dark text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-pos-primary/10 disabled:opacity-50"
            >
              <Lock size={14} className="inline mr-2" />Close Shift
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
