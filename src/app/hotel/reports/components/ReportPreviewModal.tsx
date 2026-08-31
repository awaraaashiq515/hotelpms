'use client';
import React, { useState } from 'react';
import { X, Download, Printer, Search, FileText, CheckCircle2, ChevronLeft, ChevronRight, FileDown } from 'lucide-react';
import type { GeneratedReportData } from '@/types/hotel/report.types';
import { exportHotelPDF } from '@/lib/export-utils';
import { toast } from 'sonner';

interface ReportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportData: GeneratedReportData | null;
}

export function ReportPreviewModal({
  isOpen,
  onClose,
  reportData,
}: ReportPreviewModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 12;

  if (!isOpen || !reportData) return null;

  const filteredRows = reportData.rows.filter((row) =>
    row.some((cell) => String(cell).toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const paginatedRows = filteredRows.slice((page - 1) * pageSize, page * pageSize);

  const handleDownloadPDF = () => {
    exportHotelPDF(
      reportData.headers,
      reportData.rows,
      `${reportData.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}`,
      reportData.title,
      {
        hotelName: reportData.hotelName || 'Grand Luxury Hotel & Resort',
        hotelAddress: reportData.hotelAddress || 'Executive Hotel PMS & Revenue System',
        generatedBy: reportData.generatedBy || 'Admin / General Manager',
        dateRangeFormatted: reportData.dateRangeFormatted,
        summaryCards: reportData.summaryCards?.map((s) => ({ label: s.label, value: s.value })),
      }
    );
    toast.success('PDF Report downloaded successfully!');
  };

  const handleDownloadCSV = () => {
    const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + reportData.csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${reportData.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV Report downloaded successfully!');
  };

  const handleDownloadJSON = () => {
    const jsonStr = JSON.stringify(
      {
        report: reportData.title,
        generatedAt: reportData.generatedAt,
        dateRange: reportData.dateRangeFormatted,
        headers: reportData.headers,
        data: reportData.rows.map((row) => {
          const obj: Record<string, string | number> = {};
          reportData.headers.forEach((h, idx) => {
            obj[h] = row[idx];
          });
          return obj;
        }),
      },
      null,
      2
    );
    const encodedUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(jsonStr);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${reportData.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('JSON Report downloaded!');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl rounded-3xl bg-slate-900 border border-white/10 shadow-2xl p-6 overflow-hidden max-h-[92vh] flex flex-col justify-between">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <FileText size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-white">{reportData.title}</h2>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {reportData.category}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Period: <span className="text-white font-bold">{reportData.dateRangeFormatted}</span> · {reportData.totalRecords} total entries
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="h-9 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                title="Print Report"
              >
                <Printer size={13} />
                <span className="hidden sm:inline">Print</span>
              </button>

              <button
                onClick={handleDownloadJSON}
                className="h-9 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                title="Download JSON format"
              >
                <span className="text-[10px] font-mono font-bold">JSON</span>
              </button>

              <button
                onClick={handleDownloadPDF}
                className="h-9 px-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-rose-600/30 transition-all active:scale-95"
              >
                <FileDown size={13} />
                <span>Export PDF</span>
              </button>

              <button
                onClick={handleDownloadCSV}
                className="h-9 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
              >
                <Download size={13} />
                <span>Export CSV</span>
              </button>

              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors ml-2"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Summary KPI Cards if present */}
          {reportData.summaryCards && reportData.summaryCards.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-4">
              {reportData.summaryCards.map((sc, idx) => (
                <div key={idx} className="p-3 rounded-2xl bg-slate-800/50 border border-white/5">
                  <span className="text-[9px] uppercase font-bold text-slate-400">{sc.label}</span>
                  <p className="text-base font-black text-white mt-0.5">{sc.value}</p>
                  {sc.subtext && <p className="text-[9px] text-slate-500">{sc.subtext}</p>}
                </div>
              ))}
            </div>
          )}

          {/* Search bar */}
          <div className="relative my-3">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder="Search in generated table…"
              className="w-full h-9 pl-9 pr-4 bg-slate-800/60 border border-white/10 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto flex-1 my-2 border border-white/5 rounded-2xl bg-slate-950/40">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-slate-900/80">
                {reportData.headers.map((h, i) => (
                  <th
                    key={i}
                    className="text-left px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={reportData.headers.length} className="px-4 py-8 text-center text-slate-500">
                    No matching records found
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-white/[0.02] transition-colors">
                    {row.map((cell, cellIdx) => (
                      <td
                        key={cellIdx}
                        className={`px-4 py-3 whitespace-nowrap ${
                          cellIdx === 0
                            ? 'font-black text-white'
                            : typeof cell === 'number' && cell > 500
                            ? 'font-bold text-emerald-400'
                            : 'text-slate-300'
                        }`}
                      >
                        {typeof cell === 'number' && cell > 500 && !reportData.headers[cellIdx].includes('(%)')
                          ? `₹${cell.toLocaleString('en-IN')}`
                          : String(cell)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer / Pagination */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs text-slate-400">
          <span>
            Showing <strong className="text-white">{Math.min(filteredRows.length, (page - 1) * pageSize + 1)}</strong> to{' '}
            <strong className="text-white">{Math.min(filteredRows.length, page * pageSize)}</strong> of{' '}
            <strong className="text-white">{filteredRows.length}</strong> records
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 flex items-center justify-center transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-[11px] font-bold text-white px-2">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 flex items-center justify-center transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
