'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  BarChart3, Receipt, Eye, ChevronRight,
  Download, FileSpreadsheet, Printer, RefreshCw, Loader2
} from 'lucide-react';

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

interface SummaryPreviewCardProps {
  summary: any;
  gstJson: any;
  detailedInvoices: any[];
  filingId: string | null;
  showPreview: boolean;
  setShowPreview: (v: boolean) => void;
  handleDownload: (id: string) => void;
  handleDownloadExcel: () => void;
  handleDownloadPDF: () => void;
  handleGenerate: () => Promise<void>;
  generating: boolean;
  formatPeriod: (fp: string) => string;
}

export function SummaryPreviewCard({
  summary,
  gstJson,
  detailedInvoices,
  filingId,
  showPreview,
  setShowPreview,
  handleDownload,
  handleDownloadExcel,
  handleDownloadPDF,
  handleGenerate,
  generating,
  formatPeriod,
}: SummaryPreviewCardProps) {
  return (
    <Card className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-50 p-3 rounded-xl">
            <BarChart3 className="text-emerald-500" size={22} />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Sales Summary Preview</h2>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-tight">
              {formatPeriod(summary.period)} — {summary.totalInvoices} Invoices / Orders
            </p>
          </div>
        </div>
        <span className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
          ✓ GSTN Ready
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Taxable Value', value: `₹${fmt(summary.totalTaxableValue)}`, color: 'blue' },
          { label: 'CGST', value: `₹${fmt(summary.totalCGST)}`, color: 'purple' },
          { label: 'SGST', value: `₹${fmt(summary.totalSGST)}`, color: 'orange' },
          { label: 'Grand Total', value: `₹${fmt(summary.totalGrandTotal)}`, color: 'emerald' },
        ].map((stat, i) => (
          <div key={i} className={`p-4 rounded-xl bg-${stat.color}-50 dark:bg-${stat.color}-500/10 border border-${stat.color}-100 dark:border-${stat.color}-500/20`}>
            <p className={`text-[10px] font-black text-${stat.color}-500 dark:text-${stat.color}-400 uppercase tracking-widest mb-1`}>{stat.label}</p>
            <p className={`text-lg font-black text-${stat.color}-700 dark:text-${stat.color}-300`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* GSTN Info */}
      {summary.gstin && (
        <div className="flex items-center gap-2 mb-6 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">
          <Receipt size={14} />
          GSTIN: <span className="font-mono text-slate-800 dark:text-slate-200">{summary.gstin}</span>
          &nbsp;|&nbsp; Period: <span className="font-mono text-slate-800 dark:text-slate-200">{summary.period}</span>
          &nbsp;|&nbsp; Invoices: <span className="text-slate-800 dark:text-slate-200">{summary.totalInvoices}</span>
        </div>
      )}

      {/* JSON Preview Toggle */}
      <button
        id="preview-json-btn"
        onClick={() => setShowPreview(!showPreview)}
        className="flex items-center gap-2 text-[11px] font-black text-gray-500 uppercase tracking-widest hover:text-pos-primary transition-colors mb-4"
      >
        <Eye size={14} />
        {showPreview ? 'Close JSON Preview' : 'View JSON Preview'}
        <ChevronRight size={12} className={`transition-transform ${showPreview ? 'rotate-90' : ''}`} />
      </button>

      {showPreview && gstJson && (
        <div className="bg-gray-950 rounded-2xl p-5 mb-5 overflow-auto max-h-64">
          <pre className="text-[11px] text-green-400 font-mono leading-relaxed">
            {JSON.stringify(gstJson, null, 2)}
          </pre>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        {filingId && (
          <Button
            id="download-json-btn"
            onClick={() => handleDownload(filingId)}
            className="bg-pos-primary hover:bg-red-700 text-white font-black tracking-widest px-6 py-3 rounded-xl shadow-md flex items-center gap-2"
          >
            <Download size={16} />
            Download JSON (Portal)
          </Button>
        )}

        {gstJson && (
          <>
            <Button
              onClick={handleDownloadExcel}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black tracking-widest px-6 py-3 rounded-xl shadow-md flex items-center gap-2"
            >
              <FileSpreadsheet size={16} />
              Download Excel
            </Button>

            <Button
              onClick={handleDownloadPDF}
              className="bg-blue-600 hover:bg-blue-700 text-white font-black tracking-widest px-6 py-3 rounded-xl shadow-md flex items-center gap-2"
            >
              <Printer size={16} />
              Print PDF
            </Button>
          </>
        )}

        <Button
          id="refresh-gst-btn"
          onClick={handleGenerate}
          disabled={generating}
          className="border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-600 dark:text-slate-400 font-black tracking-widest px-6 py-3 rounded-xl flex items-center gap-2 text-sm bg-white dark:bg-slate-900"
        >
          {generating ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
          Re-Generate
        </Button>
      </div>
    </Card>
  );
}
