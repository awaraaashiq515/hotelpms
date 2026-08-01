'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Moon, CheckCircle2, AlertCircle, IndianRupee, FileText, 
  RefreshCw, Loader2, Play, BedDouble, CalendarDays, DollarSign, 
  ShieldCheck, ArrowRight, Printer, Sparkles, AlertTriangle, Users, Receipt
} from 'lucide-react';
import { toast, Toaster } from 'sonner';

function fmt(n: number) { 
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(n); 
}

interface InHouseGuest {
  checkInId: string;
  guestName: string;
  roomNumber: string;
  roomType: string;
  roomRate: number;
  folioId: string | null;
  folioNo: string;
  currentBalance: number;
  ratePostedToday: boolean;
}

interface PendingNoShow {
  id: string;
  bookingNo: string;
  guestName: string;
  roomType: string;
  arrivalDate: string;
  totalAmount: number;
}

interface AuditStep {
  id: number;
  key: string;
  label: string;
  desc: string;
  done: boolean;
  count: number;
  metric: string;
}

interface NightAuditData {
  summary: {
    totalRooms: number;
    occupiedRooms: number;
    vacantRooms: number;
    occupancyPct: number;
    activeCheckInsCount: number;
    ratesPostedTodayCount: number;
    ratesPendingPostCount: number;
    todayDebits: number;
    todayCredits: number;
    todayTax: number;
    pendingDues: number;
    pendingNoShowsCount: number;
    businessDate: string;
  };
  inHouseGuests: InHouseGuest[];
  pendingNoShows: PendingNoShow[];
  steps: AuditStep[];
}

export default function NightAuditPage() {
  const [data, setData] = useState<NightAuditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [runningStepId, setRunningStepId] = useState<number | null>(null);
  const [runningAll, setRunningAll] = useState(false);
  const [activeTab, setActiveTab] = useState<'checklist' | 'inhouse' | 'noshows' | 'logs'>('checklist');
  const [auditLogs, setAuditLogs] = useState<string[]>([]);
  const [auditCompleted, setAuditCompleted] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  
  const reportPrintRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAuditData();
  }, []);

  const fetchAuditData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hotel/night-audit');
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      } else {
        toast.error(result.message || 'Failed to load night audit data.');
      }
    } catch {
      toast.error('Failed to connect to server.');
    } finally {
      setLoading(false);
    }
  };

  const handleRunStep = async (step: AuditStep) => {
    setRunningStepId(step.id);
    try {
      const res = await fetch('/api/hotel/night-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RUN_STEP', stepKey: step.key })
      });
      const result = await res.json();
      if (result.success) {
        toast.success(`${step.label} completed successfully!`);
        if (result.data?.logs) {
          setAuditLogs(prev => [...result.data.logs, ...prev]);
        }
        await fetchAuditData();
      } else {
        toast.error(result.message || 'Error completing audit step.');
      }
    } catch {
      toast.error('Network error during audit step execution.');
    } finally {
      setRunningStepId(null);
    }
  };

  const handleRunAllSteps = async () => {
    setRunningAll(true);
    try {
      const res = await fetch('/api/hotel/night-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RUN_ALL' })
      });
      const result = await res.json();
      if (result.success) {
        toast.success('Night Audit Automated Process Completed!');
        if (result.data?.logs) {
          setAuditLogs(result.data.logs);
        }
        setAuditCompleted(true);
        await fetchAuditData();
      } else {
        toast.error(result.message || 'Night Audit execution failed.');
      }
    } catch {
      toast.error('Network error during automated night audit.');
    } finally {
      setRunningAll(false);
    }
  };

  const handlePostSingleRoomRate = async (guest: InHouseGuest) => {
    if (!guest.folioId) {
      toast.error('No open folio found for this guest.');
      return;
    }
    try {
      const tax = Math.round(guest.roomRate * 0.12);
      const res = await fetch('/api/hotel/folios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folioId: guest.folioId,
          txnType: 'DEBIT',
          sourceModule: 'ROOM_RENT',
          description: `Daily Room Charge - Room ${guest.roomNumber} (${guest.guestName})`,
          amount: guest.roomRate,
          taxAmount: tax
        })
      });
      const result = await res.json();
      if (result.success) {
        toast.success(`Room rate ${fmt(guest.roomRate)} posted to Room ${guest.roomNumber}`);
        fetchAuditData();
      } else {
        toast.error(result.message || 'Failed to post rate.');
      }
    } catch {
      toast.error('Error posting room rate.');
    }
  };

  const handlePrintReport = () => {
    if (!reportPrintRef.current) return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`
      <html>
        <head>
          <title>Night Audit Daily Report - ${new Date().toLocaleDateString('en-IN')}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #111; line-height: 1.5; }
            .header { border-bottom: 2px solid #333; padding-bottom: 12px; margin-bottom: 20px; }
            .title { font-size: 22px; font-weight: bold; text-transform: uppercase; color: #4f46e5; }
            .subtitle { font-size: 12px; color: #666; margin-top: 4px; }
            .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
            .box { border: 1px solid #ddd; padding: 12px; border-radius: 8px; background: #f9fafb; }
            .box-val { font-size: 18px; font-weight: bold; color: #111; }
            .box-lbl { font-size: 10px; color: #666; text-transform: uppercase; margin-top: 2px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
            th, td { border: 1px solid #e5e7eb; padding: 8px 12px; text-align: left; }
            th { background: #f3f4f6; text-transform: uppercase; font-size: 10px; }
            .footer { margin-top: 30px; font-size: 11px; border-top: 1px solid #ddd; padding-top: 12px; display: flex; justify-content: space-between; color: #666; }
          </style>
        </head>
        <body>
          ${reportPrintRef.current.innerHTML}
        </body>
      </html>
    `);
    w.document.close();
    w.print();
  };

  const stepsList = data?.steps || [];
  const completedStepsCount = stepsList.filter(s => s.done).length;
  const auditProgressPct = stepsList.length > 0 ? Math.round((completedStepsCount / stepsList.length) * 100) : 0;
  const isFullyComplete = completedStepsCount === stepsList.length || auditCompleted;

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
        <p className="text-xs text-slate-400 font-bold tracking-wider uppercase">Loading Live Audit Data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 max-w-[1100px] mx-auto text-white">
      <Toaster richColors position="top-right" />

      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Moon size={14} className="text-indigo-400 animate-pulse" />
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Accounting · Night Audit Console</span>
          </div>
          <h1 className="text-2xl font-black bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Night Audit & Day-End Closing
          </h1>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
            <CalendarDays size={12} className="text-slate-500" />
            <span>Business Date: <strong className="text-white">{new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}</strong></span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={fetchAuditData}
            className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-xs font-bold transition-all"
          >
            <RefreshCw size={13} /> Refresh
          </button>

          {!isFullyComplete && (
            <button 
              onClick={handleRunAllSteps} 
              disabled={runningAll}
              className="flex items-center gap-2 h-9 px-5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-700 hover:from-indigo-500 hover:to-violet-600 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-indigo-600/25 active:scale-95 disabled:opacity-50 transition-all"
            >
              {runningAll ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              Run Full Automated Audit
            </button>
          )}

          {isFullyComplete && (
            <button 
              onClick={() => setShowReportModal(true)}
              className="flex items-center gap-2 h-9 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-600/20 transition-all"
            >
              <FileText size={14} /> View Audit Report
            </button>
          )}
        </div>
      </div>

      {/* Live Financial & Operational KPI Widgets */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Total Day Revenue</p>
              <IndianRupee size={16} className="text-emerald-400 opacity-60" />
            </div>
            <p className="text-2xl font-black text-white mt-1.5">{fmt(data.summary.todayDebits)}</p>
            <p className="text-[10px] text-slate-400 mt-1">₹{data.summary.todayTax.toLocaleString('en-IN')} Tax Included</p>
          </div>

          <div className="rounded-2xl border border-sky-500/20 bg-sky-950/20 p-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <p className="text-[9px] font-black uppercase tracking-widest text-sky-400">Occupancy & Rooms</p>
              <BedDouble size={16} className="text-sky-400 opacity-60" />
            </div>
            <p className="text-2xl font-black text-white mt-1.5">{data.summary.occupancyPct}%</p>
            <p className="text-[10px] text-slate-400 mt-1">{data.summary.occupiedRooms} Occupied / {data.summary.totalRooms} Total</p>
          </div>

          <div className="rounded-2xl border border-amber-500/20 bg-amber-950/20 p-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <p className="text-[9px] font-black uppercase tracking-widest text-amber-400">Rate Posting Status</p>
              <Receipt size={16} className="text-amber-400 opacity-60" />
            </div>
            <p className="text-2xl font-black text-white mt-1.5">
              {data.summary.ratesPostedTodayCount} / {data.summary.activeCheckInsCount}
            </p>
            <p className="text-[10px] text-slate-400 mt-1">
              {data.summary.ratesPendingPostCount > 0 ? `${data.summary.ratesPendingPostCount} Pending Room Charges` : 'All Room Charges Posted'}
            </p>
          </div>

          <div className="rounded-2xl border border-indigo-500/20 bg-indigo-950/20 p-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400">Outstanding Dues</p>
              <Users size={16} className="text-indigo-400 opacity-60" />
            </div>
            <p className="text-2xl font-black text-white mt-1.5">{fmt(data.summary.pendingDues)}</p>
            <p className="text-[10px] text-slate-400 mt-1">Across In-House Guest Folios</p>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('checklist')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
            activeTab === 'checklist' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <ShieldCheck size={14} /> Audit Checklist ({completedStepsCount}/{stepsList.length})
        </button>

        <button
          onClick={() => setActiveTab('inhouse')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
            activeTab === 'inhouse' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users size={14} /> In-House Guests ({data?.inHouseGuests.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('noshows')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
            activeTab === 'noshows' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <AlertTriangle size={14} /> No-Show Reservations ({data?.pendingNoShows.length || 0})
        </button>

        {auditLogs.length > 0 && (
          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === 'logs' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText size={14} /> Audit Logs ({auditLogs.length})
          </button>
        )}
      </div>

      {/* TAB 1: AUDIT CHECKLIST */}
      {activeTab === 'checklist' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-[#090f1e]/80 border border-slate-800 overflow-hidden shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80">
              <div>
                <h3 className="text-sm font-black text-white">Daily Audit Workflow Steps</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Automated validation & posting sequence for day-end reconciliation</p>
              </div>
              <div className="w-48 text-right">
                <div className="flex justify-between text-[10px] font-black text-slate-400 mb-1">
                  <span>Progress</span>
                  <span className="text-indigo-400">{auditProgressPct}%</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${auditProgressPct}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="divide-y divide-slate-800/60">
              {stepsList.map((step, i) => {
                const isNext = !step.done && stepsList.slice(0, i).every(s => s.done);
                const isRunning = runningStepId === step.id;

                return (
                  <div 
                    key={step.id} 
                    className={`flex items-center gap-4 px-6 py-4 transition-colors ${
                      isNext ? 'bg-indigo-950/20' : ''
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                      step.done 
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                        : isNext 
                          ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400 animate-pulse' 
                          : 'bg-slate-900 border-slate-800 text-slate-500'
                    }`}>
                      {step.done ? <CheckCircle2 size={16} /> : <span className="text-xs font-black">{step.id}</span>}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-xs font-black ${step.done ? 'text-slate-400 line-through' : 'text-white'}`}>
                          {step.label}
                        </p>
                        <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[9px] font-bold text-slate-400">
                          {step.metric}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">{step.desc}</p>
                    </div>

                    <div className="shrink-0">
                      {step.done ? (
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black uppercase text-emerald-400">
                          Verified
                        </span>
                      ) : (
                        <button
                          onClick={() => handleRunStep(step)}
                          disabled={isRunning || runningAll}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-wider shadow-md disabled:opacity-50 transition-all"
                        >
                          {isRunning ? <Loader2 size={11} className="animate-spin" /> : <Play size={11} />}
                          Run Step
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Completion Banner */}
          {isFullyComplete && (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-6 flex items-center justify-between flex-wrap gap-4 shadow-xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={24} className="text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Night Audit & Day Close Completed!</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    All room charges posted, folios reconciled, and daily revenue ledger finalized.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowReportModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-600/30 transition-all"
              >
                <FileText size={14} /> Open Audit Summary Report
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: IN-HOUSE GUESTS & RATE POSTING */}
      {activeTab === 'inhouse' && data && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-[#090f1e]/80 border border-slate-800 overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-white">In-House Guest Folio Rate Posting</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Live status of daily room charges for occupied rooms</p>
              </div>
              <span className="text-xs font-black text-indigo-400">
                {data.summary.ratesPostedTodayCount} of {data.summary.activeCheckInsCount} Posted
              </span>
            </div>

            {data.inHouseGuests.length === 0 ? (
              <div className="py-16 text-center text-slate-500">
                <BedDouble size={36} className="mx-auto mb-2 opacity-40" />
                <p className="text-xs font-bold">No active in-house guests found.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/60">
                <div className="grid grid-cols-6 px-6 py-2.5 text-[9px] font-black uppercase tracking-wider text-slate-500 bg-slate-900/40">
                  <span>Room</span>
                  <span className="col-span-2">Guest & Folio</span>
                  <span>Daily Rate</span>
                  <span>Current Balance</span>
                  <span className="text-right">Action / Status</span>
                </div>

                {data.inHouseGuests.map(g => (
                  <div key={g.checkInId} className="grid grid-cols-6 px-6 py-3.5 items-center text-xs">
                    <div>
                      <span className="font-black text-white">Room {g.roomNumber}</span>
                      <p className="text-[9px] text-indigo-400 mt-0.5">{g.roomType}</p>
                    </div>

                    <div className="col-span-2">
                      <p className="font-black text-white">{g.guestName}</p>
                      <p className="text-[9px] text-slate-500">Folio: {g.folioNo}</p>
                    </div>

                    <div>
                      <p className="font-black text-slate-200">{fmt(g.roomRate)}</p>
                      <p className="text-[9px] text-slate-500">+12% GST</p>
                    </div>

                    <div>
                      <p className="font-black text-white">{fmt(g.currentBalance)}</p>
                    </div>

                    <div className="text-right">
                      {g.ratePostedToday ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black uppercase text-emerald-400">
                          <CheckCircle2 size={10} /> Posted Today
                        </span>
                      ) : (
                        <button
                          onClick={() => handlePostSingleRoomRate(g)}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-wider transition-all"
                        >
                          Post Rate Now
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: NO-SHOW RESERVATIONS */}
      {activeTab === 'noshows' && data && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-[#090f1e]/80 border border-slate-800 overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-slate-800">
              <h3 className="text-sm font-black text-white">Overdue & No-Show Reservations</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Reservations past arrival date without check-in completion</p>
            </div>

            {data.pendingNoShows.length === 0 ? (
              <div className="py-16 text-center text-slate-500">
                <CheckCircle2 size={36} className="mx-auto mb-2 text-emerald-500/40" />
                <p className="text-xs font-bold text-slate-400">No overdue no-show reservations detected.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/60">
                {data.pendingNoShows.map(ns => (
                  <div key={ns.id} className="flex items-center justify-between px-6 py-4">
                    <div>
                      <span className="font-black text-white text-xs">{ns.guestName}</span>
                      <span className="ml-2 text-[10px] text-slate-500">#{ns.bookingNo}</span>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {ns.roomType} · Arrival: {new Date(ns.arrivalDate).toLocaleDateString('en-IN')}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-black text-xs text-white">{fmt(ns.totalAmount)}</span>
                      <button
                        onClick={() => handleRunStep({ id: 3, key: 'NO_SHOW', label: 'No-Show', desc: '', done: false, count: 1, metric: '' })}
                        className="px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-400 text-[10px] font-black uppercase tracking-wider transition-all"
                      >
                        Process No-Show
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT LOGS */}
      {activeTab === 'logs' && (
        <div className="rounded-2xl bg-[#090f1e]/80 border border-slate-800 p-5 space-y-3 shadow-xl">
          <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400">Audit System Activity Logs</h3>
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px] space-y-2 text-slate-300 max-h-96 overflow-y-auto">
            {auditLogs.map((log, i) => (
              <p key={i} className="flex items-center gap-2">
                <span className="text-slate-600">[{i + 1}]</span>
                <span>{log}</span>
              </p>
            ))}
          </div>
        </div>
      )}

      {/* REPORT MODAL */}
      {showReportModal && data && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#090f1e] border border-slate-800 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-[#090f1e]/95 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex items-center justify-between rounded-t-3xl z-10">
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Official Report</span>
                <h2 className="text-lg font-black text-white">Night Audit & Day-End Closing Summary</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintReport}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider transition-all"
                >
                  <Printer size={13} /> Print Report
                </button>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white text-xs font-bold transition-all"
                >
                  ✕
                </button>
              </div>
            </div>

            <div ref={reportPrintRef} className="p-6 space-y-6">
              <div className="header">
                <div className="title">GuestFlow PMS - Night Audit Daily Closing Summary</div>
                <div className="subtitle">
                  Business Date: {new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' })} | Report Generated: {new Date().toLocaleTimeString('en-IN')}
                </div>
              </div>

              <div className="grid">
                <div className="box">
                  <div className="box-val">{fmt(data.summary.todayDebits)}</div>
                  <div className="box-lbl">Total Day Revenue</div>
                </div>
                <div className="box">
                  <div className="box-val">{data.summary.occupancyPct}%</div>
                  <div className="box-lbl">Occupancy Rate</div>
                </div>
                <div className="box">
                  <div className="box-val">{data.summary.occupiedRooms} / {data.summary.totalRooms}</div>
                  <div className="box-lbl">Occupied Rooms</div>
                </div>
                <div className="box">
                  <div className="box-val">{fmt(data.summary.todayCredits)}</div>
                  <div className="box-lbl">Payments Collected</div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-sm mb-2 text-white">Audit Step Verification Status</h4>
                <table>
                  <thead>
                    <tr>
                      <th>Step</th>
                      <th>Audit Task</th>
                      <th>Metric / Count</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stepsList.map(s => (
                      <tr key={s.id}>
                        <td>Step {s.id}</td>
                        <td>{s.label}</td>
                        <td>{s.metric}</td>
                        <td style={{ color: 'green', fontWeight: 'bold' }}>PASSED & VERIFIED</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <h4 className="font-bold text-sm mb-2 text-white">In-House Guest Folios Summary</h4>
                <table>
                  <thead>
                    <tr>
                      <th>Room</th>
                      <th>Guest Name</th>
                      <th>Folio No</th>
                      <th>Room Rate</th>
                      <th>Folio Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.inHouseGuests.map(g => (
                      <tr key={g.checkInId}>
                        <td>Room {g.roomNumber}</td>
                        <td>{g.guestName}</td>
                        <td>{g.folioNo}</td>
                        <td>{fmt(g.roomRate)}</td>
                        <td>{fmt(g.currentBalance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="footer">
                <span>Audited By: System Administrator</span>
                <span>GuestFlow Hospitality PMS v2.4</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
