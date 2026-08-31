'use client';
import React from 'react';
import { BarChart3, Download, Sparkles, Clock, RefreshCw, Eye, FileText, FileDown } from 'lucide-react';
import type { ReportDefinition } from '@/types/hotel/report.types';

export const REPORT_CATALOG: ReportDefinition[] = [
  // Financial
  { id: 'r1',  category: 'Financial',  name: 'Daily Revenue Report',        desc: 'Room stay, F&B, spa, and ancillary collections breakdown', icon: '💰', estTime: '< 1s', tags: ['Revenue', 'Daily', 'Audit'] },
  { id: 'r2',  category: 'Financial',  name: 'Monthly P&L Statement',       desc: 'Comprehensive departmental revenue vs operational expenses', icon: '📊', estTime: '< 2s', tags: ['P&L', 'Finance', 'GOP'] },
  { id: 'r3',  category: 'Financial',  name: 'GST Tax Filing Report',       desc: 'CGST, SGST, IGST tax breakdown with invoice numbers & B2B GSTINs', icon: '🧾', estTime: '< 1s', tags: ['GST', 'Tax', 'Invoices'] },
  { id: 'r4',  category: 'Financial',  name: 'Accounts Receivable',         desc: 'Outstanding guest dues, unsettled folios & billing ledger', icon: '💳', estTime: '< 1s', tags: ['Dues', 'Credit', 'Folio'] },
  { id: 'r5',  category: 'Financial',  name: 'Night Audit Summary',         desc: 'End-of-day trial balance, check-ins, check-outs & cashier handover', icon: '🌙', estTime: '< 1s', tags: ['Closing', 'Night Audit'] },
  // Occupancy
  { id: 'r6',  category: 'Occupancy', name: 'Occupancy & Inventory Report', desc: 'Daily/monthly room occupancy %, vacant keys, and sold room nights', icon: '🏨', estTime: '< 1s', tags: ['Occupancy', 'Keys', 'Yield'] },
  { id: 'r7',  category: 'Occupancy', name: 'ADR & RevPAR Yield Trend',     desc: 'Average Daily Rate and RevPAR growth performance over time', icon: '📈', estTime: '< 1s', tags: ['ADR', 'RevPAR', 'Yield'] },
  { id: 'r8',  category: 'Occupancy', name: 'Length of Stay Analysis',      desc: 'ALOS metrics across corporate, leisure, and group segments', icon: '🛏️', estTime: '< 1s', tags: ['ALOS', 'Stay', 'Guests'] },
  // Bookings
  { id: 'r9',  category: 'Bookings',  name: 'Booking Source & OTA Split',   desc: 'OTA channel vs Direct web vs Walk-in volume & commissions paid', icon: '🌐', estTime: '< 1s', tags: ['OTAs', 'Channels', 'Commission'] },
  { id: 'r10', category: 'Bookings',  name: 'Cancellation Audit Report',   desc: 'Cancelled reservations, lost potential revenue & root causes', icon: '❌', estTime: '< 1s', tags: ['Cancellations', 'Lost Rev'] },
  { id: 'r11', category: 'Bookings',  name: 'No-Show & Retention Audit',    desc: 'Recorded guest no-shows, retention charges & forfeited advances', icon: '⚠️', estTime: '< 1s', tags: ['No-Show', 'Retention'] },
  // Operations
  { id: 'r12', category: 'Operations',name: 'Housekeeping Productivity',    desc: 'Room cleaning velocity, average turnaround minutes & inspector pass rate', icon: '🧹', estTime: '< 1s', tags: ['Housekeeping', 'Cleanliness'] },
  { id: 'r13', category: 'Operations',name: 'Maintenance & Repair Costs',  desc: 'Equipment tickets, downtime logs, and maintenance expenditures', icon: '🔧', estTime: '< 1s', tags: ['Repairs', 'Maintenance'] },
  // HR
  { id: 'r14', category: 'HR',        name: 'Staff Attendance Register',    desc: 'Monthly employee attendance, shift hours, and leave records', icon: '📋', estTime: '< 1s', tags: ['Attendance', 'Shifts', 'HR'] },
  { id: 'r15', category: 'HR',        name: 'Payroll Disbursement Report',  desc: 'Departmental staff salary sheets, allowances & deductions', icon: '💵', estTime: '< 1s', tags: ['Payroll', 'Salaries'] },
  // AI
  { id: 'r16', category: 'AI',        name: 'AI 30-Day Demand Forecast',    desc: 'Predictive occupancy curves, demand factors & optimal dynamic ADR', icon: '⚡', estTime: '< 2s', isAI: true, tags: ['AI Forecast', 'Machine Learning'] },
  { id: 'r17', category: 'AI',        name: 'Competitor Rate CompSet',      desc: 'AI-monitored competitor benchmark pricing & market rate positioning', icon: '🎯', estTime: '< 2s', isAI: true, tags: ['CompSet', 'Competitors'] },
  { id: 'r18', category: 'AI',        name: 'Guest Sentiment & Reviews',    desc: 'NLP sentiment scoring across cleanliness, food, Wi-Fi & hospitality', icon: '✨', estTime: '< 2s', isAI: true, tags: ['Sentiment', 'Reviews'] },
];

const CATEGORY_STYLES: Record<string, string> = {
  Financial:  'text-emerald-300 bg-emerald-500/10 border-emerald-500/20',
  Occupancy:  'text-sky-300 bg-sky-500/10 border-sky-500/20',
  Bookings:   'text-indigo-300 bg-indigo-500/10 border-indigo-500/20',
  Operations: 'text-amber-300 bg-amber-500/10 border-amber-500/20',
  HR:         'text-blue-300 bg-blue-500/10 border-blue-500/20',
  AI:         'text-violet-300 bg-violet-500/10 border-violet-500/20',
};

interface ReportCardProps {
  report: ReportDefinition;
  onPreview: (id: string) => void;
  onDirectDownloadCSV: (id: string) => void;
  onDirectDownloadPDF: (id: string) => void;
  generating?: boolean;
}

export function ReportCard({
  report,
  onPreview,
  onDirectDownloadCSV,
  onDirectDownloadPDF,
  generating,
}: ReportCardProps) {
  const isAI = report.isAI || report.category === 'AI';

  return (
    <div
      className={`rounded-3xl border p-4.5 transition-all backdrop-blur-md flex flex-col justify-between hover:scale-[1.01] hover:shadow-xl ${
        isAI
          ? 'bg-gradient-to-br from-violet-950/30 via-slate-900/60 to-slate-900/60 border-violet-500/20 hover:border-violet-500/40'
          : 'bg-slate-900/60 border-white/10 hover:border-indigo-500/30'
      }`}
    >
      <div>
        {/* Top meta */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{report.icon}</span>
            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${CATEGORY_STYLES[report.category] || 'text-slate-300 bg-slate-800'}`}>
              {isAI && '🤖 '}{report.category}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[9px] text-slate-500 font-bold">
            <Clock size={10} />
            <span>{report.estTime}</span>
          </div>
        </div>

        {/* Title & Desc */}
        <h3 className="text-xs font-black text-white mb-1 tracking-tight">
          {report.name}
        </h3>
        <p className="text-[10px] text-slate-400 leading-relaxed mb-3">
          {report.desc}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-4">
          {report.tags.map((t) => (
            <span key={t} className="text-[8px] font-bold px-1.5 py-0.2 rounded bg-slate-800/80 text-slate-400 border border-white/5">
              #{t}
            </span>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-white/5">
        <button
          onClick={() => onPreview(report.id)}
          disabled={generating}
          className="h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-colors disabled:opacity-40"
          title="Preview table"
        >
          <Eye size={11} />
          <span>View</span>
        </button>

        <button
          onClick={() => onDirectDownloadPDF(report.id)}
          disabled={generating}
          className="h-8 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all shadow-sm disabled:opacity-40"
          title="Download PDF"
        >
          <FileDown size={11} />
          <span>PDF</span>
        </button>

        <button
          onClick={() => onDirectDownloadCSV(report.id)}
          disabled={generating}
          className={`h-8 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 shadow-md disabled:opacity-40 ${
            isAI
              ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-violet-600/30'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
          }`}
          title="Download CSV spreadsheet"
        >
          {generating ? (
            <RefreshCw size={10} className="animate-spin" />
          ) : (
            <>
              <Download size={11} />
              <span>CSV</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
