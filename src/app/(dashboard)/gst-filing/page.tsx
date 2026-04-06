'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  FileJson, Download, Eye, Save, CheckCircle2, AlertCircle,
  Loader2, CalendarDays, BarChart3, Receipt, ChevronRight,
  RefreshCw, Trash2, BadgeCheck, Clock, FileText
} from 'lucide-react';

const MONTHS = [
  { val: '01', label: 'January — Jan' },
  { val: '02', label: 'February — Feb' },
  { val: '03', label: 'March — Mar' },
  { val: '04', label: 'April — Apr' },
  { val: '05', label: 'May — May' },
  { val: '06', label: 'June — Jun' },
  { val: '07', label: 'July — Jul' },
  { val: '08', label: 'August — Aug' },
  { val: '09', label: 'September — Sep' },
  { val: '10', label: 'October — Oct' },
  { val: '11', label: 'November — Nov' },
  { val: '12', label: 'December — Dec' },
];

const currentDate = new Date();
const currentYear = currentDate.getFullYear().toString();
const currentMonth = String(currentDate.getMonth() + 1).padStart(2, '0');
// Filing is for previous month
const prevMonth = String(currentDate.getMonth()).padStart(2, '0') || '12';
const prevYear = currentDate.getMonth() === 0
  ? String(currentDate.getFullYear() - 1)
  : currentYear;

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

function formatPeriod(fp: string) {
  const m = fp.slice(0, 2);
  const y = fp.slice(2);
  const mo = MONTHS.find(x => x.val === m);
  return `${mo?.label.split('—')[0].trim()} ${y}`;
}

export default function GstFilingPage() {
  // Step state
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form
  const [month, setMonth] = useState(prevMonth || '01');
  const [year, setYear] = useState(prevYear);
  const [returnType] = useState('GSTR-1');

  // Results
  const [generating, setGenerating] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [gstJson, setGstJson] = useState<any>(null);
  const [filingId, setFilingId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // History
  const [filings, setFilings] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const r = await fetch('/api/gst/filings');
      const d = await r.json();
      if (d.success) setFilings(d.data || []);
    } catch {}
    setHistoryLoading(false);
  };

  useEffect(() => { loadHistory(); }, []);

  const handleGenerate = async () => {
    if (!month || !year) {
      showToast('error', 'Please select month and year');
      return;
    }
    setGenerating(true);
    setSummary(null);
    setGstJson(null);
    setFilingId(null);
    try {
      const res = await fetch('/api/gst/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month, year, returnType, saveDraft: true })
      });
      const d = await res.json();
      if (d.success && d.data) {
        setSummary(d.data.summary);
        setGstJson(d.data.json);
        setFilingId(d.data.filingId);
        setStep(2);
        loadHistory();
      } else {
        showToast('error', d.message || 'Failed to generate data');
      }
    } catch {
      showToast('error', 'Network error. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = (id: string) => {
    window.open(`/api/gst/download/${id}`, '_blank');
    showToast('success', 'JSON file is downloading!');
    setStep(3);
  };

  const handleMarkSubmitted = async (id: string) => {
    const r = await fetch('/api/gst/filings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    const d = await r.json();
    if (d.success) {
      showToast('success', 'Filing marked as SUBMITTED!');
      loadHistory();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this draft filing?')) return;
    const r = await fetch(`/api/gst/filings?id=${id}`, { method: 'DELETE' });
    const d = await r.json();
    if (d.success) {
      showToast('success', 'Draft deleted successfully');
      loadHistory();
    }
  };

  const years = Array.from({ length: 5 }, (_, i) => String(currentDate.getFullYear() - i));

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-white font-bold text-sm animate-in slide-in-from-top-3 duration-300 ${
          toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {toast.msg}
        </div>
      )}

      <PageHeader
        title="GST Filing"
        description="Generate monthly GSTR-1 JSON and upload it to the GST portal."
      />

      {/* ── Step Wizard Bar ───────────────────────────────────────────── */}
      <div className="flex items-center gap-0">
        {[
          { n: 1, label: 'Period Select' },
          { n: 2, label: 'Preview & Save' },
          { n: 3, label: 'Download' },
        ].map((s, i, arr) => (
          <React.Fragment key={s.n}>
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                step > s.n
                  ? 'bg-emerald-500 text-white'
                  : step === s.n
                  ? 'bg-pos-primary text-white shadow-lg shadow-red-200'
                  : 'bg-gray-100 text-gray-400'
              }`}>
                {step > s.n ? <CheckCircle2 size={16} /> : s.n}
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest ${
                step === s.n ? 'text-pos-primary' : step > s.n ? 'text-emerald-500' : 'text-gray-400'
              }`}>{s.label}</span>
            </div>
            {i < arr.length - 1 && (
              <div className={`flex-1 h-[2px] mx-3 rounded transition-all ${step > s.n ? 'bg-emerald-400' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* ── Step 1: Period Selection ──────────────────────────────────── */}
      <Card className="p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-pos-primary/10 p-3 rounded-xl"><CalendarDays className="text-pos-primary" size={22} /></div>
          <div>
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">Select Filing Period</h2>
            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-tight">Sales data for the selected period will be compiled for filing</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Month</label>
            <select
              id="gst-month-select"
              value={month}
              onChange={e => setMonth(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
            >
              {MONTHS.map(m => (
                <option key={m.val} value={m.val}>{m.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Year</label>
            <select
              id="gst-year-select"
              value={year}
              onChange={e => setYear(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Return Type</label>
            <div className="px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-bold text-gray-600 uppercase tracking-tight">
              GSTR-1 (Outward Supplies)
            </div>
          </div>
        </div>

        <div className="mt-6">
          <Button
            id="generate-gst-btn"
            onClick={handleGenerate}
            disabled={generating}
            className="bg-pos-primary hover:bg-red-700 text-white font-black tracking-widest px-8 py-4 rounded-xl shadow-lg shadow-red-100 flex items-center gap-2"
          >
            {generating
              ? <><Loader2 size={18} className="animate-spin" /> Generating JSON...</>
              : <><FileJson size={18} /> Generate GSTR-1 JSON</>
            }
          </Button>
        </div>
      </Card>

      {/* ── Step 2: Summary Preview ───────────────────────────────────── */}
      {summary && (
        <Card className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-50 p-3 rounded-xl"><BarChart3 className="text-emerald-500" size={22} /></div>
              <div>
                <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">Sales Summary Preview</h2>
                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-tight">
                  {MONTHS.find(m => m.val === month)?.label.split('—')[0].trim()} {year} — {summary.totalInvoices} Orders
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
              <div key={i} className={`p-4 rounded-xl bg-${stat.color}-50 border border-${stat.color}-100`}>
                <p className={`text-[10px] font-black text-${stat.color}-500 uppercase tracking-widest mb-1`}>{stat.label}</p>
                <p className={`text-lg font-black text-${stat.color}-700`}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* GSTN Info */}
          {summary.gstin && (
            <div className="flex items-center gap-2 mb-6 text-[11px] font-bold text-gray-500 uppercase tracking-tight">
              <Receipt size={14} />
              GSTIN: <span className="font-mono text-gray-800">{summary.gstin}</span>
              &nbsp;|&nbsp; Period: <span className="font-mono text-gray-800">{summary.period}</span>
              &nbsp;|&nbsp; Invoices: <span className="text-gray-800">{summary.totalInvoices}</span>
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
                Download JSON for Portal
              </Button>
            )}
            <Button
              id="refresh-gst-btn"
              onClick={handleGenerate}
              disabled={generating}
              className="border border-gray-200 hover:bg-gray-50 text-gray-600 font-black tracking-widest px-6 py-3 rounded-xl flex items-center gap-2 text-sm bg-white"
            >
              <RefreshCw size={15} />
              Re-Generate
            </Button>
          </div>
        </Card>
      )}

      {/* ── Step 3: Upload Instructions ──────────────────────────────── */}
      {step === 3 && (
        <Card className="p-8 border-l-4 border-l-emerald-400">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle2 className="text-emerald-500" size={24} />
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">JSON Downloaded! Now Upload to GST Portal</h2>
          </div>
          <ol className="space-y-2 text-[12px] font-bold text-gray-600 uppercase tracking-tight">
            <li className="flex items-start gap-2"><span className="text-pos-primary font-black">1.</span> Login to gst.gov.in</li>
            <li className="flex items-start gap-2"><span className="text-pos-primary font-black">2.</span> Go to Services → Returns → Returns Dashboard</li>
            <li className="flex items-start gap-2"><span className="text-pos-primary font-black">3.</span> Under GSTR-1, click "Upload JSON"</li>
            <li className="flex items-start gap-2"><span className="text-pos-primary font-black">4.</span> Select the downloaded file and submit</li>
            <li className="flex items-start gap-2"><span className="text-pos-primary font-black">5.</span> After successful upload, click "Mark as Submitted" below</li>
          </ol>
          {filingId && (
            <Button
              id="mark-submitted-btn"
              onClick={() => { handleMarkSubmitted(filingId); setStep(1); }}
              className="mt-5 bg-emerald-500 hover:bg-emerald-600 text-white font-black tracking-widest px-6 py-3 rounded-xl flex items-center gap-2"
            >
              <BadgeCheck size={16} />
              Mark as Submitted
            </Button>
          )}
        </Card>
      )}

      {/* ── Filing History ────────────────────────────────────────────── */}
      <Card className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-gray-100 p-3 rounded-xl"><FileText className="text-gray-500" size={22} /></div>
            <div>
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">Filing History</h2>
              <p className="text-[11px] text-gray-400 font-bold uppercase tracking-tight">Track all your past GST filings</p>
            </div>
          </div>
          <button onClick={loadHistory} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <RefreshCw size={15} className="text-gray-400" />
          </button>
        </div>

        {historyLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="animate-spin text-gray-400" size={24} />
          </div>
        ) : filings.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <FileJson size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-[11px] font-black uppercase tracking-widest">No filings found yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Period', 'Type', 'Invoices', 'Total Amount', 'Status', 'Generated', 'Actions'].map(h => (
                    <th key={h} className="text-left text-[10px] font-black text-gray-400 uppercase tracking-widest pb-3 pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filings.map((f) => (
                  <tr key={f.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 pr-4 text-sm font-bold text-gray-800">{formatPeriod(f.filingMonth)}</td>
                    <td className="py-3 pr-4">
                      <span className="px-2 py-1 bg-pos-primary/10 text-pos-primary rounded text-[10px] font-black uppercase">{f.returnType}</span>
                    </td>
                    <td className="py-3 pr-4 text-sm text-gray-600 font-bold">{f.invoiceCount}</td>
                    <td className="py-3 pr-4 text-sm font-bold text-gray-800">₹{fmt(f.totalAmount)}</td>
                    <td className="py-3 pr-4">
                      <span className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-black uppercase w-fit ${
                        f.status === 'SUBMITTED'
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-amber-50 text-amber-600'
                      }`}>
                        {f.status === 'SUBMITTED' ? <BadgeCheck size={11} /> : <Clock size={11} />}
                        {f.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-[11px] text-gray-400 font-bold">
                      {new Date(f.generatedAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDownload(f.id)}
                          className="p-2 rounded-lg bg-gray-100 hover:bg-pos-primary hover:text-white transition-all text-gray-500"
                          title="Download JSON"
                        >
                          <Download size={13} />
                        </button>
                        {f.status === 'DRAFT' && (
                          <>
                            <button
                              onClick={() => handleMarkSubmitted(f.id)}
                              className="p-2 rounded-lg bg-emerald-50 hover:bg-emerald-500 hover:text-white transition-all text-emerald-600"
                              title="Mark as Submitted"
                            >
                              <BadgeCheck size={13} />
                            </button>
                            <button
                              onClick={() => handleDelete(f.id)}
                              className="p-2 rounded-lg bg-red-50 hover:bg-red-500 hover:text-white transition-all text-red-400"
                              title="Delete Draft"
                            >
                              <Trash2 size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
