'use client';
import React, { useState } from 'react';
import {
  BarChart3,
  Search,
  Download,
  Sparkles,
  Calendar,
  FileSpreadsheet,
  FileText,
  Clock,
  Filter,
  CheckCircle2,
  RefreshCw,
  FileDown,
} from 'lucide-react';
import { ReportCard, REPORT_CATALOG } from './components/ReportCard';
import { ReportPreviewModal } from './components/ReportPreviewModal';
import type { ReportCategory, GeneratedReportData } from '@/types/hotel/report.types';
import { exportHotelPDF } from '@/lib/export-utils';
import { toast } from 'sonner';

const CATEGORIES: ReportCategory[] = ['All', 'Financial', 'Occupancy', 'Bookings', 'Operations', 'HR', 'AI'];

export default function ReportsPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<ReportCategory>('All');
  const [timeRange, setTimeRange] = useState<'today' | '7d' | '30d' | 'month' | 'year' | 'custom'>('30d');
  const [customDatePickerOpen, setCustomDatePickerOpen] = useState(false);
  const [startInput, setStartInput] = useState('');
  const [endInput, setEndInput] = useState('');

  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [activeReportData, setActiveReportData] = useState<GeneratedReportData | null>(null);

  const filtered = REPORT_CATALOG
    .filter((r) => category === 'All' || r.category === category)
    .filter(
      (r) =>
        !search ||
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.desc.toLowerCase().includes(search.toLowerCase()) ||
        r.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
    );

  const handleFetchReport = async (reportId: string): Promise<GeneratedReportData | null> => {
    try {
      const res = await fetch('/api/hotel/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId,
          timeRange,
          startDate: timeRange === 'custom' ? startInput : undefined,
          endDate: timeRange === 'custom' ? endInput : undefined,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      } else {
        toast.error(json.message || 'Failed to generate report');
        return null;
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Report generation error';
      toast.error(msg);
      return null;
    }
  };

  const handlePreview = async (reportId: string) => {
    setGeneratingId(reportId);
    const data = await handleFetchReport(reportId);
    setGeneratingId(null);
    if (data) {
      setActiveReportData(data);
      setPreviewModalOpen(true);
    }
  };

  const handleDirectDownloadCSV = async (reportId: string) => {
    setGeneratingId(reportId);
    const data = await handleFetchReport(reportId);
    setGeneratingId(null);
    if (data && data.csvContent) {
      const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + data.csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute(
        'download',
        `${data.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`${data.title} CSV downloaded!`);
    }
  };

  const handleDirectDownloadPDF = async (reportId: string) => {
    setGeneratingId(reportId);
    const data = await handleFetchReport(reportId);
    setGeneratingId(null);
    if (data) {
      exportHotelPDF(
        data.headers,
        data.rows,
        `${data.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}`,
        data.title,
        {
          hotelName: data.hotelName || 'Grand Luxury Hotel & Resort',
          hotelAddress: data.hotelAddress || 'Executive Hotel PMS & Revenue System',
          generatedBy: data.generatedBy || 'Admin / General Manager',
          dateRangeFormatted: data.dateRangeFormatted,
          summaryCards: data.summaryCards?.map((s) => ({ label: s.label, value: s.value })),
        }
      );
      toast.success(`${data.title} PDF downloaded!`);
    }
  };

  const handleApplyCustomDates = () => {
    if (!startInput) {
      toast.error('Please select a start date');
      return;
    }
    setTimeRange('custom');
    setCustomDatePickerOpen(false);
    toast.success('Custom date range filter applied');
  };

  const aiCount = REPORT_CATALOG.filter((r) => r.category === 'AI').length;
  const totalCount = REPORT_CATALOG.length;

  return (
    <div className="space-y-6 pb-12 max-w-[1500px] mx-auto">
      {/* ── Top Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
            <BarChart3 size={14} className="text-cyan-400" />
            <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">
              Report Center · Audit & Export Engine
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Hotel Reports Hub
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {totalCount} downloadable audit reports · {aiCount} AI predictive models · Instant CSV, JSON & Print Export
          </p>
        </div>

        {/* Action Controls & Date Range */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Time Range Pills */}
          <div className="flex items-center bg-slate-900/80 p-1 rounded-2xl border border-white/10 shadow-inner">
            {[
              { id: 'today' as const, label: 'Today' },
              { id: '7d' as const, label: '7D' },
              { id: '30d' as const, label: '30D' },
              { id: 'month' as const, label: 'Month' },
              { id: 'year' as const, label: 'Year' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTimeRange(t.id)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition-all ${
                  timeRange === t.id
                    ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}

            <button
              onClick={() => setCustomDatePickerOpen(!customDatePickerOpen)}
              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-black flex items-center gap-1 transition-all ${
                timeRange === 'custom'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calendar size={12} />
              <span>Custom</span>
            </button>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 rounded-2xl border border-violet-500/20 bg-violet-950/20">
            <Sparkles size={13} className="text-violet-400 animate-spin" style={{ animationDuration: '6s' }} />
            <span className="text-[10px] font-black text-violet-300">{aiCount} AI Models Ready</span>
          </div>
        </div>
      </div>

      {/* Custom Date Range Picker */}
      {customDatePickerOpen && (
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-cyan-500/30 flex flex-wrap items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-bold">Start Date:</span>
            <input
              type="date"
              value={startInput}
              onChange={(e) => setStartInput(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 border border-white/10 text-white text-xs"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-bold">End Date:</span>
            <input
              type="date"
              value={endInput}
              onChange={(e) => setEndInput(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 border border-white/10 text-white text-xs"
            />
          </div>
          <button
            onClick={handleApplyCustomDates}
            className="px-4 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-black shadow-md transition-colors"
          >
            Apply Filter
          </button>
          <button
            onClick={() => setCustomDatePickerOpen(false)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-400 text-xs hover:text-white"
          >
            Cancel
          </button>
        </div>
      )}

      {/* ── Category Stat Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {CATEGORIES.filter((c) => c !== 'All').map((cat) => {
          const count = REPORT_CATALOG.filter((r) => r.category === cat).length;
          const colors: Record<string, { bg: string; border: string; text: string; icon: string }> = {
            Financial: { bg: 'bg-emerald-950/20', border: 'border-emerald-500/20', text: 'text-emerald-300', icon: '💰' },
            Occupancy: { bg: 'bg-sky-950/20', border: 'border-sky-500/20', text: 'text-sky-300', icon: '🏨' },
            Bookings: { bg: 'bg-indigo-950/20', border: 'border-indigo-500/20', text: 'text-indigo-300', icon: '🌐' },
            Operations: { bg: 'bg-amber-950/20', border: 'border-amber-500/20', text: 'text-amber-300', icon: '🧹' },
            HR: { bg: 'bg-blue-950/20', border: 'border-blue-500/20', text: 'text-blue-300', icon: '📋' },
            AI: { bg: 'bg-violet-950/20', border: 'border-violet-500/20', text: 'text-violet-300', icon: '🤖' },
          };
          const currentStyle = colors[cat] || { bg: 'bg-slate-900', border: 'border-white/5', text: 'text-white', icon: '📄' };
          const isSelected = category === cat;

          return (
            <div
              key={cat}
              onClick={() => setCategory(cat)}
              className={`rounded-3xl border p-4 cursor-pointer transition-all backdrop-blur-md ${currentStyle.bg} ${currentStyle.border} ${
                isSelected ? 'ring-2 ring-cyan-500 shadow-lg shadow-cyan-500/10 scale-[1.02]' : 'hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xl">{currentStyle.icon}</span>
                <span className="text-lg font-black text-white">{count}</span>
              </div>
              <p className={`text-[10px] font-black uppercase tracking-wider ${currentStyle.text} mt-1`}>
                {cat}
              </p>
              <p className="text-[8px] text-slate-500">Reports</p>
            </div>
          );
        })}
      </div>

      {/* ── Search & Filter Bar ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reports by keyword (e.g. GST, ADR, P&L, Night Audit, Housekeeping)…"
            className="w-full h-10 pl-10 pr-4 bg-slate-900/80 border border-white/10 rounded-2xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-colors shadow-inner"
          />
        </div>

        {/* Category Pills */}
        <div className="flex gap-1.5 flex-wrap items-center bg-slate-900/80 p-1 rounded-2xl border border-white/10">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                category === c
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* ── Reports Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filtered.map((report) => (
          <ReportCard
            key={report.id}
            report={report}
            onPreview={handlePreview}
            onDirectDownloadCSV={handleDirectDownloadCSV}
            onDirectDownloadPDF={handleDirectDownloadPDF}
            generating={generatingId === report.id}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 rounded-3xl border border-white/5 bg-slate-900/40">
          <FileText size={32} className="mx-auto text-slate-600 mb-2" />
          <p className="text-sm font-bold text-slate-400">No reports match your search criteria</p>
          <p className="text-xs text-slate-600 mt-0.5">Try searching for a different keyword or select &quot;All&quot; categories</p>
        </div>
      )}

      {/* ── Report Preview Modal ── */}
      <ReportPreviewModal
        isOpen={previewModalOpen}
        onClose={() => {
          setPreviewModalOpen(false);
          setActiveReportData(null);
        }}
        reportData={activeReportData}
      />
    </div>
  );
}
