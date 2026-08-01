import React from 'react';
import { BarChart3, Download, Sparkles, Clock, RefreshCw } from 'lucide-react';

export const REPORT_CATALOG = [
  // Financial
  { id: 'r1',  category: 'Financial',  name: 'Daily Revenue Report',        desc: 'All revenue streams for the day',          est: '< 1 min' },
  { id: 'r2',  category: 'Financial',  name: 'Monthly P&L Statement',       desc: 'Income vs expenses for the month',         est: '< 2 min' },
  { id: 'r3',  category: 'Financial',  name: 'GST Filing Report',           desc: 'CGST, SGST, IGST summary',                 est: '< 2 min' },
  { id: 'r4',  category: 'Financial',  name: 'Accounts Receivable',         desc: 'Outstanding guest dues',                   est: '< 1 min' },
  { id: 'r5',  category: 'Financial',  name: 'Night Audit Summary',         desc: 'Daily closing financial summary',          est: '< 1 min' },
  // Occupancy
  { id: 'r6',  category: 'Occupancy', name: 'Occupancy Report',             desc: 'Room-wise occupancy by date range',        est: '< 1 min' },
  { id: 'r7',  category: 'Occupancy', name: 'ADR & RevPAR Trend',           desc: 'Rate performance over time',              est: '< 1 min' },
  { id: 'r8',  category: 'Occupancy', name: 'Length of Stay Analysis',      desc: 'Average LOS by segment',                  est: '< 2 min' },
  // Bookings
  { id: 'r9',  category: 'Bookings',  name: 'Booking Source Report',        desc: 'OTA vs Direct vs Walk-in',                est: '< 1 min' },
  { id: 'r10', category: 'Bookings',  name: 'Cancellation Analysis',        desc: 'Cancellation rates and reasons',           est: '< 1 min' },
  { id: 'r11', category: 'Bookings',  name: 'No-Show Report',               desc: 'No-shows with forecasted revenue impact',  est: '< 1 min' },
  // Housekeeping
  { id: 'r12', category: 'Operations',name: 'Housekeeping Productivity',    desc: 'Rooms cleaned per staff hour',             est: '< 1 min' },
  { id: 'r13', category: 'Operations',name: 'Maintenance Cost Report',      desc: 'Repair costs and downtime analysis',       est: '< 2 min' },
  // HR
  { id: 'r14', category: 'HR',        name: 'Attendance Register',          desc: 'Full month staff attendance',              est: '< 1 min' },
  { id: 'r15', category: 'HR',        name: 'Payroll Summary',              desc: 'Department-wise salary disbursement',      est: '< 2 min' },
  // AI
  { id: 'r16', category: 'AI',        name: 'AI Demand Forecast',           desc: '30-day AI occupancy prediction',           est: '< 3 min' },
  { id: 'r17', category: 'AI',        name: 'Competitor Rate Analysis',     desc: 'AI-scraped competitor pricing',            est: '< 5 min' },
  { id: 'r18', category: 'AI',        name: 'Guest Sentiment Analysis',     desc: 'AI-analyzed reviews and feedback',         est: '< 3 min' },
];

const CATEGORIES = ['All', ...Array.from(new Set(REPORT_CATALOG.map(r => r.category)))];
const CATEGORY_COLOR: Record<string, string> = {
  Financial:  'text-emerald-300 bg-emerald-500/10',
  Occupancy:  'text-sky-300 bg-sky-500/10',
  Bookings:   'text-indigo-300 bg-indigo-500/10',
  Operations: 'text-amber-300 bg-amber-500/10',
  HR:         'text-blue-300 bg-blue-500/10',
  AI:         'text-violet-300 bg-violet-500/10',
};

interface ReportCardProps {
  report: typeof REPORT_CATALOG[number];
  onGenerate?: (id: string) => void;
  generating?: boolean;
}

export function ReportCard({ report, onGenerate, generating }: ReportCardProps) {
  const isAI = report.category === 'AI';
  return (
    <div className={`rounded-2xl border p-4 transition-all hover:border-indigo-500/20 ${isAI ? 'bg-violet-900/10 border-violet-500/10' : 'bg-slate-900/50 border-white/5'}`}>
      <div className="flex items-start justify-between mb-2">
        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md ${CATEGORY_COLOR[report.category] || 'text-slate-300 bg-slate-700'}`}>
          {isAI && '🤖 '}{report.category}
        </span>
        <div className="flex items-center gap-1 text-[8px] text-slate-600">
          <Clock size={8} /> {report.est}
        </div>
      </div>
      <p className="text-[11px] font-black text-white mt-2 mb-1">{report.name}</p>
      <p className="text-[9px] text-slate-500 mb-3">{report.desc}</p>
      <button onClick={() => onGenerate?.(report.id)} disabled={generating}
        className={`w-full h-8 rounded-xl text-[9px] font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 ${
          generating
            ? 'bg-indigo-500/30 text-indigo-400 cursor-wait'
            : isAI
            ? 'bg-violet-600/20 hover:bg-violet-600/40 text-violet-300'
            : 'bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300'
        }`}>
        {generating
          ? <><RefreshCw size={10} className="animate-spin" /> Generating…</>
          : isAI
          ? <><Sparkles size={10} /> Generate AI Report</>
          : <><Download size={10} /> Generate</>
        }
      </button>
    </div>
  );
}
