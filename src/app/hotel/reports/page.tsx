'use client';
import React, { useState } from 'react';
import { BarChart3, Search, Download, Sparkles } from 'lucide-react';
import { ReportCard, REPORT_CATALOG } from './components/ReportCard';

const CATEGORIES = ['All', ...Array.from(new Set(REPORT_CATALOG.map(r => r.category)))];

export default function ReportsPage() {
  const [search, setSearch]       = useState('');
  const [category, setCategory]   = useState('All');
  const [generating, setGenerating] = useState<string|null>(null);

  const filtered = REPORT_CATALOG
    .filter(r => category === 'All' || r.category === category)
    .filter(r => !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.desc.toLowerCase().includes(search.toLowerCase()));

  async function handleGenerate(id: string) {
    setGenerating(id);
    await new Promise(res => setTimeout(res, 1500 + Math.random() * 1000));
    setGenerating(null);
    const report = REPORT_CATALOG.find(r => r.id === id);
    alert(`✅ "${report?.name}" generated! In production this would download a PDF/Excel.`);
  }

  const aiCount    = REPORT_CATALOG.filter(r => r.category === 'AI').length;
  const totalCount = REPORT_CATALOG.length;

  return (
    <div className="space-y-5 pb-10 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 size={14} className="text-cyan-400" />
            <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">Intelligence · Reports</span>
          </div>
          <h1 className="text-2xl font-black text-white">Report Center</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {totalCount} reports · {aiCount} AI-powered · Export PDF, Excel, CSV
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-violet-500/20 bg-violet-900/10">
          <Sparkles size={12} className="text-violet-400" />
          <span className="text-[10px] font-black text-violet-300">{aiCount} AI Reports Available</span>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {CATEGORIES.filter(c => c !== 'All').map(cat => {
          const count = REPORT_CATALOG.filter(r => r.category === cat).length;
          const colors: Record<string, string> = {
            Financial: 'text-emerald-300 border-emerald-500/20 bg-emerald-900/20',
            Occupancy:  'text-sky-300 border-sky-500/20 bg-sky-900/20',
            Bookings:   'text-indigo-300 border-indigo-500/20 bg-indigo-900/20',
            Operations: 'text-amber-300 border-amber-500/20 bg-amber-900/20',
            HR:         'text-blue-300 border-blue-500/20 bg-blue-900/20',
            AI:         'text-violet-300 border-violet-500/20 bg-violet-900/20',
          };
          return (
            <div key={cat} className={`rounded-2xl border p-4 cursor-pointer transition-all ${category === cat ? 'ring-2 ring-offset-2 ring-offset-slate-950 ring-indigo-500' : ''} ${colors[cat] || 'text-slate-300 border-slate-700 bg-slate-800/30'}`}
              onClick={() => setCategory(cat)}>
              <p className="text-2xl font-black text-white">{count}</p>
              <p className="text-[9px] font-bold uppercase tracking-widest opacity-60 mt-1">{cat} Reports</p>
            </div>
          );
        })}
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search reports…"
            className="w-full h-9 pl-9 pr-4 bg-slate-800/60 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className={`px-3 h-9 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors ${category===c ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Report Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {filtered.map(report => (
          <ReportCard key={report.id} report={report}
            onGenerate={handleGenerate}
            generating={generating === report.id} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-slate-600 text-sm">No reports match your search</div>
      )}
    </div>
  );
}
