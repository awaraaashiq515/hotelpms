'use client';
import React from 'react';
import { BarChart3, Download, Sparkles, Clock, RefreshCw, Eye, FileText, FileDown } from 'lucide-react';
import type { ReportDefinition } from '@/types/hotel/report.types';

export const REPORT_CATALOG: ReportDefinition[] = [
  // Financial
  { id: 'r1',  category: 'Financial',  name: 'Daily Income Report',            desc: 'How much money came in today — from rooms, restaurant, spa — all in one place', icon: '💰', estTime: '< 1s', tags: ['Income', 'Daily', 'Money'] },
  { id: 'r2',  category: 'Financial',  name: 'Monthly Income & Expense Report', desc: 'Total income and total spending for the whole month — full summary', icon: '📊', estTime: '< 2s', tags: ['Monthly', 'Income', 'Expense'] },
  { id: 'r3',  category: 'Financial',  name: 'GST Tax Report',                  desc: 'GST details for every invoice — CGST, SGST breakdown — for tax filing', icon: '🧾', estTime: '< 1s', tags: ['GST', 'Tax', 'Invoice'] },
  { id: 'r4',  category: 'Financial',  name: 'Pending Payments Report',         desc: 'Which guests have not paid yet — full list of pending due amounts', icon: '💳', estTime: '< 1s', tags: ['Pending', 'Due', 'Unpaid'] },
  { id: 'r5',  category: 'Financial',  name: 'End of Day Closing Report',       desc: 'Daily closing summary — total check-ins, check-outs, and cash collected', icon: '🌙', estTime: '< 1s', tags: ['Closing', 'Daily', 'Cash'] },
  // Occupancy
  { id: 'r6',  category: 'Occupancy', name: 'Room Occupancy Report',            desc: 'How many rooms are filled and how many are empty — daily and monthly', icon: '🏨', estTime: '< 1s', tags: ['Rooms', 'Empty', 'Filled'] },
  { id: 'r7',  category: 'Occupancy', name: 'Room Rate Report',                 desc: 'Average price per room per night — and whether rates are going up or down', icon: '📈', estTime: '< 1s', tags: ['Rate', 'Room Price', 'Trend'] },
  { id: 'r8',  category: 'Occupancy', name: 'Guest Stay Length Report',         desc: 'How many nights guests stay on average — families, business guests, solo', icon: '🛏️', estTime: '< 1s', tags: ['Nights', 'Stay', 'Guests'] },
  // Bookings
  { id: 'r9',  category: 'Bookings',  name: 'Booking Source Report',            desc: 'Where bookings came from — Booking.com, MakeMyTrip, direct call, walk-in', icon: '🌐', estTime: '< 1s', tags: ['Booking', 'Source', 'OTA'] },
  { id: 'r10', category: 'Bookings',  name: 'Cancelled Bookings Report',        desc: 'Which bookings were cancelled, when, why — and how much money was lost', icon: '❌', estTime: '< 1s', tags: ['Cancelled', 'Lost', 'Refund'] },
  { id: 'r11', category: 'Bookings',  name: 'Guest Did Not Arrive Report',      desc: 'Guests who booked but never showed up — their advance and charges', icon: '⚠️', estTime: '< 1s', tags: ['No Show', 'Advance', 'Missed'] },
  // Operations
  { id: 'r12', category: 'Operations',name: 'Room Cleaning Staff Report',       desc: 'Which staff cleaned how many rooms, how fast, and quality check results', icon: '🧹', estTime: '< 1s', tags: ['Cleaning', 'Staff', 'Rooms'] },
  { id: 'r13', category: 'Operations',name: 'Repair & Maintenance Report',      desc: 'Which rooms had problems, when they were fixed, and how much it cost', icon: '🔧', estTime: '< 1s', tags: ['Repair', 'Problem', 'Cost'] },
  // HR
  { id: 'r14', category: 'HR',        name: 'Staff Attendance Report',          desc: 'How many days each staff member came to work and how many days off they took', icon: '📋', estTime: '< 1s', tags: ['Attendance', 'Leave', 'Staff'] },
  { id: 'r15', category: 'HR',        name: 'Staff Salary Report',              desc: 'How much salary each staff got, allowances and deductions — department wise', icon: '💵', estTime: '< 1s', tags: ['Salary', 'Payroll', 'Staff'] },
  // AI
  { id: 'r16', category: 'AI',        name: '🤖 Next 30 Days Forecast (AI)',    desc: 'AI predicts how many rooms will be booked in the next 30 days and best price to set', icon: '⚡', estTime: '< 2s', isAI: true, tags: ['AI', 'Future', 'Forecast'] },
  { id: 'r17', category: 'AI',        name: '🤖 Competitor Hotel Rates (AI)',   desc: 'What rates are nearby hotels charging — AI comparison to help you stay competitive', icon: '🎯', estTime: '< 2s', isAI: true, tags: ['AI', 'Competitor', 'Rates'] },
  { id: 'r18', category: 'AI',        name: '🤖 Guest Reviews Analysis (AI)',   desc: 'What guests said in reviews about cleanliness, food, staff — AI summary', icon: '✨', estTime: '< 2s', isAI: true, tags: ['AI', 'Reviews', 'Feedback'] },
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
          title="Table mein dekho"
        >
          <Eye size={11} />
          <span>Dekho</span>
        </button>

        <button
          onClick={() => onDirectDownloadPDF(report.id)}
          disabled={generating}
          className="h-8 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all shadow-sm disabled:opacity-40"
          title="PDF Download karo"
        >
          <FileDown size={11} />
          <span>PDF ↓</span>
        </button>

        <button
          onClick={() => onDirectDownloadCSV(report.id)}
          disabled={generating}
          className={`h-8 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 shadow-md disabled:opacity-40 ${
            isAI
              ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-violet-600/30'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
          }`}
          title="Excel mein download karo"
        >
          {generating ? (
            <RefreshCw size={10} className="animate-spin" />
          ) : (
            <>
              <Download size={11} />
              <span>Excel ↓</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
