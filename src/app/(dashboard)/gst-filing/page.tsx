'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  FileJson, Download, Eye, Save, CheckCircle2, AlertCircle,
  Loader2, CalendarDays, BarChart3, Receipt, ChevronRight,
  RefreshCw, Trash2, BadgeCheck, Clock, FileText, FileSpreadsheet, Printer
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
const prevMonth = currentDate.getMonth() === 0 
  ? '12' 
  : String(currentDate.getMonth()).padStart(2, '0');
const prevYear = currentDate.getMonth() === 0
  ? String(currentDate.getFullYear() - 1)
  : currentYear;

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

function formatPeriod(fp: string) {
  if (!fp || fp.length < 6) return fp;
  const m = fp.slice(0, 2);
  const y = fp.slice(2);
  const mo = MONTHS.find(x => x.val === m);
  if (!mo) return `${m}/${y}`;
  return `${mo.label.split('—')[0].trim()} ${y}`;
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
  const [detailedInvoices, setDetailedInvoices] = useState<any[]>([]);
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
    setDetailedInvoices([]);
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
        setDetailedInvoices(d.data.detailedInvoices || []);
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

  const handleDownloadExcel = async () => {
    if (!gstJson) return;
    
    // Dynamically load the 'xlsx' library if not present
    if (!(window as any).XLSX) {
      setGenerating(true);
      try {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
        document.head.appendChild(script);
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
        });
      } catch (err) {
        showToast('error', 'Failed to load Excel library.');
        setGenerating(false);
        return;
      }
      setGenerating(false);
    }

    const XLSX = (window as any).XLSX;
    const wb = XLSX.utils.book_new();

    const addSheet = (data: any[], name: string, cols: any[]) => {
      const ws = XLSX.utils.aoa_to_sheet(data);
      if (cols.length) ws['!cols'] = cols;
      XLSX.utils.book_append_sheet(wb, ws, name);
    };

    // 1. b2b Sheet
    const b2bData = [
      ["Summary For B2B"],
      ["No. of Recipients", "", "No. of Invoices", "", "Total Invoice Value", "", "", "", "", "", "Total Taxable Value", "Total Cess"],
      [0, "", 0, "", "0.00", "", "", "", "", "", "0.00", "0.00"],
      ["GSTIN/UIN of Recipient", "Receiver Name", "Invoice Number", "Invoice date", "Invoice Value", "Place Of Supply", "Reverse Charge", "Applicable % of Tax Rate", "Invoice Type", "E-Commerce GSTIN", "Rate", "Taxable Value", "Cess Amount"]
    ];
    addSheet(b2bData, "b2b", [{ wch: 25 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 20 }, { wch: 10 }, { wch: 15 }, { wch: 15 }]);

    // 2. b2cl Sheet
    const b2clData = [
      ["Summary For B2CL(5)"],
      ["No. of Invoices", "", "Total Invoice Value", "", "", "", "Total Taxable Value", "Total Cess"],
      [0, "", "0.00", "", "", "", "0.00", "0.00"],
      ["Invoice Number", "Invoice date", "Invoice Value", "Place Of Supply", "Applicable % of Tax Rate", "Rate", "Taxable Value", "Cess Amount", "E-Commerce GSTIN"]
    ];
    addSheet(b2clData, "b2cl", []);

    // 3. b2cs Sheet
    const b2csTotalTax = (gstJson.b2cs || []).reduce((acc: number, val: any) => acc + (val.txval || 0), 0).toFixed(2);
    const b2csTotalCess = (gstJson.b2cs || []).reduce((acc: number, val: any) => acc + (val.csamt || 0), 0).toFixed(2);
    const b2csData = [
      ["Summary For B2CS(7)"],
      ["Total Taxable Value", "", "", "", "", "", "Total Cess"],
      [b2csTotalTax, "", "", "", "", "", b2csTotalCess],
      ["Type", "Place Of Supply", "Applicable % of Tax Rate", "Rate", "Taxable Value", "Cess Amount", "E-Commerce GSTIN"]
    ];
    (gstJson.b2cs || []).forEach((row: any) => {
      b2csData.push([row.sply_ty || 'OE', row.pos, "", row.rt, row.txval, row.csamt || 0, row.etin || ""]);
    });
    addSheet(b2csData, "b2cs", [{ wch: 10 }, { wch: 20 }, { wch: 25 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 20 }]);

    // 4. cdnr Sheet
    const cdnrData = [
      ["Summary For CDNR(9B)"],
      ["No. of Recipients", "", "No. of Notes/Vouchers", "", "", "", "", "", "", "", "", "Total Taxable Value", "Total Cess"],
      [0, "", 0, "", "", "", "", "", "", "", "", "0.00", "0.00"],
      ["GSTIN/UIN of Recipient", "Receiver Name", "Note/Refund Voucher Number", "Note/Refund Voucher date", "Document Type", "Place Of Supply", "Reverse Charge", "Note/Refund Voucher Value", "Applicable % of Tax Rate", "Rate", "Taxable Value", "Cess Amount"]
    ];
    addSheet(cdnrData, "cdnr", []);

    // 5. cdnur Sheet
    const cdnurData = [
      ["Summary For CDNUR(9B)"],
      ["No. of Notes/Vouchers", "", "", "", "", "", "", "", "Total Taxable Value", "Total Cess"],
      [0, "", "", "", "", "", "", "", "0.00", "0.00"],
      ["UR Type", "Note/Refund Voucher Number", "Note/Refund Voucher date", "Document Type", "Place Of Supply", "Note/Refund Voucher Value", "Applicable % of Tax Rate", "Rate", "Taxable Value", "Cess Amount"]
    ];
    addSheet(cdnurData, "cdnur", []);

    // 6. exp Sheet
    const expData = [
      ["Summary For EXP(6)"],
      ["No. of Invoices", "", "", "", "", "", "", "Total Taxable Value"],
      [0, "", "", "", "", "", "", "0.00"],
      ["Export Type", "Invoice Number", "Invoice date", "Invoice Value", "Port Code", "Shipping Bill Number", "Shipping Bill Date", "Applicable % of Tax Rate", "Rate", "Taxable Value"]
    ];
    addSheet(expData, "exp", []);

    // 7. at Sheet
    const atData = [
      ["Summary For Advance Received(11B)"],
      ["Total Taxable Value", "", "Total Cess"],
      ["0.00", "", "0.00"],
      ["Place Of Supply", "Applicable % of Tax Rate", "Rate", "Gross Advance Received", "Cess Amount"]
    ];
    addSheet(atData, "at", []);

    // 8. atadj Sheet
    const atadjData = [
      ["Summary For Advance Adjusted(11B)"],
      ["Total Taxable Value", "", "Total Cess"],
      ["0.00", "", "0.00"],
      ["Place Of Supply", "Applicable % of Tax Rate", "Rate", "Gross Advance Adjusted", "Cess Amount"]
    ];
    addSheet(atadjData, "atadj", []);

    // 9. exemp Sheet
    const exempData = [
      ["Summary For Nil rated, exempted and non GST outward supplies (8)"],
      ["Total Nil Rated Supplies", "Total Exempted Supplies", "Total Non-GST Supplies"],
      ["0.00", "0.00", "0.00"],
      ["Description", "Nil Rated Supplies", "Exempted (other than nil rated/non GST supply)", "Non-GST Supplies"]
    ];
    addSheet(exempData, "exemp", []);

    // 10. hsn Sheet
    const hsnTotalVal = (gstJson.hsn?.data || []).reduce((acc: number, val: any) => acc + ((val.txval || 0) + (val.camt || 0) + (val.samt || 0)), 0).toFixed(2);
    const hsnTotalTax = (gstJson.hsn?.data || []).reduce((acc: number, val: any) => acc + (val.txval || 0), 0).toFixed(2);
    const hsnTotalI = (gstJson.hsn?.data || []).reduce((acc: number, val: any) => acc + (val.iamt || 0), 0).toFixed(2);
    const hsnTotalC = (gstJson.hsn?.data || []).reduce((acc: number, val: any) => acc + (val.camt || 0), 0).toFixed(2);
    const hsnTotalS = (gstJson.hsn?.data || []).reduce((acc: number, val: any) => acc + (val.samt || 0), 0).toFixed(2);
    
    const hsnData = [
      ["Summary For HSN(12)"],
      ["No. of HSN", "", "", "", "Total Value", "Total Taxable Value", "Total Integrated Tax", "Total Central Tax", "Total State/UT Tax", "Total Cess"],
      [(gstJson.hsn?.data || []).length, "", "", "", hsnTotalVal, hsnTotalTax, hsnTotalI, hsnTotalC, hsnTotalS, "0.00"],
      ["HSN", "Description", "UQC", "Total Quantity", "Total Value", "Taxable Value", "Integrated Tax Amount", "Central Tax Amount", "State/UT Tax Amount", "Cess Amount"]
    ];
    (gstJson.hsn?.data || []).forEach((row: any) => {
      const totVal = (row.txval + row.camt + row.samt).toFixed(2);
      hsnData.push([row.hsn_sc, row.desc, row.uqc, row.cnt, totVal, row.txval, row.iamt || 0, row.camt || 0, row.samt || 0, row.csamt || 0]);
    });
    addSheet(hsnData, "hsn", [{ wch: 15 }, { wch: 30 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 15 }]);

    // 11. docs Sheet
    const docsArr = gstJson.docs?.[0]?.doc_det?.[0]?.docs || [];
    const docTotal = docsArr.reduce((acc: number, val: any) => acc + (val.totnum || 0), 0);
    const docCancel = docsArr.reduce((acc: number, val: any) => acc + (val.cancel || 0), 0);
    const docNet = docsArr.reduce((acc: number, val: any) => acc + (val.net_issue || 0), 0);
    
    const docsData = [
      ["Summary of Documents(13)"],
      ["Total Number", "", "Total Cancelled", "Net Issued"],
      [docTotal, "", docCancel, docNet],
      ["Nature of Document", "Sr. No. From", "Sr. No. To", "Total Number", "Cancelled", "Net issued"]
    ];
    docsArr.forEach((row: any) => {
      docsData.push(["Invoices for outward supply", row.num, row.to, row.totnum, row.cancel, row.net_issue]);
    });
    addSheet(docsData, "docs", [{ wch: 35 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }]);

    // CA Extra: Invoice Register Sheet
    if (detailedInvoices && detailedInvoices.length > 0) {
      const invData = [
        ["Invoice Register (Detailed Orders)"],
        [],
        ["Invoice No", "Date", "Status", "Taxable Value", "CGST", "SGST", "Total Amount"]
      ];
      detailedInvoices.forEach((inv: any) => {
        const invDate = inv.date ? new Date(inv.date).toLocaleDateString('en-IN') : '';
        invData.push([inv.orderNo, invDate, inv.status, inv.taxable, inv.cgst, inv.sgst, inv.total]);
      });
      addSheet(invData, "Detailed Invoices", [{ wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }]);
    }

    // Write file natively
    XLSX.writeFile(wb, `GSTR-1_Report_${summary?.period || ''}.xlsx`);
    showToast('success', 'Govt Template Excel downloaded!');
  };

  const handleDownloadPDF = () => {
    if (!gstJson) return;
    
    const printWindow = window.open('', '', 'width=900,height=700');
    if (!printWindow) return;
    
    let htmlContent = `
      <html>
        <head>
          <title>GST Return - ${summary?.period}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
            body { font-family: 'Inter', system-ui, sans-serif; color: #1e293b; line-height: 1.6; padding: 40px; background: white; }
            h1 { font-size: 28px; font-weight: 700; margin-bottom: 24px; color: #0f172a; border-left: 4px solid #3b82f6; padding-left: 15px; }
            h2 { font-size: 20px; font-weight: 600; margin-top: 40px; margin-bottom: 15px; color: #334155; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }
            .header-info { margin-bottom: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 14px; }
            .header-info div { padding: 5px 0; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 13px; box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1); border-radius: 8px; overflow: hidden; }
            th, td { border: 1px solid #e2e8f0; padding: 12px; text-align: left; }
            th { background-color: #f8fafc; font-weight: 600; color: #475569; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em; }
            tbody tr:nth-child(even) { background-color: #fcfdfe; }
            .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
            .stat { background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; text-align: center; }
            .stat-label { font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; margin-bottom: 8px; }
            .stat-val { font-size: 18px; font-weight: 700; color: #0f172a; }
            .grand-total-box { margin-top: 20px; text-align: right; border-top: 2px solid #3b82f6; padding-top: 15px; }
            .grand-total-label { font-size: 14px; color: #64748b; font-weight: 600; }
            .grand-total-val { font-size: 24px; font-weight: 800; color: #3b82f6; }
            .page-break { page-break-before: always; height: 1px; margin-top: 30px; }
            @media print {
              body { padding: 20px; }
              .stat { border: 1px solid #eee; }
              .page-break { page-break-before: always; }
            }
          </style>
        </head>
        <body>
          <div style="text-align: right; color: #64748b; font-size: 12px; margin-bottom: 20px;">Generated on: ${new Date().toLocaleString()}</div>
          <h1>GST GSTR-1 Summary Report</h1>
          
          <div class="header-info">
            <div><strong>GSTIN:</strong> ${summary?.gstin || 'N/A'}</div>
            <div><strong>Filing Period:</strong> ${summary?.period || 'N/A'}</div>
            <div><strong>Return Type:</strong> GSTR-1 (Outward Supplies)</div>
            <div><strong>Status:</strong> Generated - Ready for CA Review</div>
          </div>
          
          <div class="grid">
            <div class="stat"><div class="stat-label">Total Orders</div><div class="stat-val">${summary?.totalInvoices || 0}</div></div>
            <div class="stat"><div class="stat-label">Taxable Value</div><div class="stat-val">₹${summary?.totalTaxableValue?.toLocaleString('en-IN', {minimumFractionDigits: 2}) || 0}</div></div>
            <div class="stat"><div class="stat-label">Total CGST (2.5%)</div><div class="stat-val">₹${summary?.totalCGST?.toLocaleString('en-IN', {minimumFractionDigits: 2}) || 0}</div></div>
            <div class="stat"><div class="stat-label">Total SGST (2.5%)</div><div class="stat-val">₹${summary?.totalSGST?.toLocaleString('en-IN', {minimumFractionDigits: 2}) || 0}</div></div>
          </div>

          <div class="grand-total-box">
            <span class="grand-total-label">Grand Total Value:</span><br/>
            <span class="grand-total-val">₹${summary?.totalGrandTotal?.toLocaleString('en-IN', {minimumFractionDigits: 2}) || 0}</span>
          </div>

          <div class="page-break"></div>
          
          ${gstJson.b2cs && gstJson.b2cs.length > 0 ? `
            <h2>B2CS (Intra-State Retail Supplies)</h2>
            <table>
              <thead>
                <tr>
                  <th>State Code</th>
                  <th>Supply Type</th>
                  <th>GSTR Rate</th>
                  <th>Taxable Value</th>
                  <th>Central Tax (CGST)</th>
                  <th>State Tax (SGST)</th>
                </tr>
              </thead>
              <tbody>
                ${gstJson.b2cs.map((r: any) => `
                  <tr>
                    <td>${r.pos || ''}</td>
                    <td>${r.sply_ty || 'OE'}</td>
                    <td>${r.rt || 0}%</td>
                    <td>₹${(r.txval||0).toFixed(2)}</td>
                    <td>₹${(r.camt||0).toFixed(2)}</td>
                    <td>₹${(r.samt||0).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : ''}

          ${gstJson.hsn?.data && gstJson.hsn.data.length > 0 ? `
            <div class="page-break"></div>
            <h2>HSN/SAC Code Summary</h2>
            <table>
              <thead>
                <tr>
                  <th>HSN/SAC</th>
                  <th>Description</th>
                  <th>Unit</th>
                  <th>Qty</th>
                  <th>Rate</th>
                  <th>Taxable Value</th>
                  <th>CGST</th>
                  <th>SGST</th>
                </tr>
              </thead>
              <tbody>
                ${gstJson.hsn.data.map((r: any) => `
                  <tr>
                    <td>${r.hsn_sc || ''}</td>
                    <td>${r.desc || ''}</td>
                    <td>${r.uqc || ''}</td>
                    <td>${r.cnt || 0}</td>
                    <td>${r.rt || 0}%</td>
                    <td>₹${(r.txval||0).toFixed(2)}</td>
                    <td>₹${(r.camt||0).toFixed(2)}</td>
                    <td>₹${(r.samt||0).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : ''}

          ${detailedInvoices && detailedInvoices.length > 0 ? `
            <div class="page-break"></div>
            <h2>Detailed Invoice Register</h2>
            <table>
              <thead>
                <tr>
                  <th>Order No</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Taxable Val</th>
                  <th>CGST</th>
                  <th>SGST</th>
                  <th>Grand Total</th>
                </tr>
              </thead>
              <tbody>
                ${detailedInvoices.map((inv: any) => `
                  <tr>
                    <td>${inv.orderNo}</td>
                    <td>${inv.date ? new Date(inv.date).toLocaleDateString('en-IN') : ''}</td>
                    <td><span style="font-size: 10px; background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">${inv.status}</span></td>
                    <td>₹${(inv.taxable||0).toFixed(2)}</td>
                    <td>₹${(inv.cgst||0).toFixed(2)}</td>
                    <td>₹${(inv.sgst||0).toFixed(2)}</td>
                    <td><strong>₹${(inv.total||0).toFixed(2)}</strong></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : ''}

          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    showToast('success', 'Professional PDF Report Generated!');
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
                  ? 'bg-pos-primary text-white shadow-lg shadow-red-200 dark:shadow-none'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500'
              }`}>
                {step > s.n ? <CheckCircle2 size={16} /> : s.n}
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest ${
                step === s.n ? 'text-pos-primary' : step > s.n ? 'text-emerald-500' : 'text-gray-400'
              }`}>{s.label}</span>
            </div>
            {i < arr.length - 1 && (
              <div className={`flex-1 h-[2px] mx-3 rounded transition-all ${step > s.n ? 'bg-emerald-400' : 'bg-gray-200 dark:bg-slate-800'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* ── Step 1: Period Selection ──────────────────────────────────── */}
      <Card className="p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-pos-primary/10 p-3 rounded-xl"><CalendarDays className="text-pos-primary" size={22} /></div>
          <div>
            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Select Filing Period</h2>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-tight">Sales data for the selected period will be compiled for filing</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Month</label>
            <select
              id="gst-month-select"
              value={month}
              onChange={e => setMonth(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary dark:text-slate-100 dark:placeholder:text-slate-600"
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
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary dark:text-slate-100 dark:placeholder:text-slate-600"
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Return Type</label>
            <div className="px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 text-sm font-bold text-gray-600 dark:text-slate-300 uppercase tracking-tight">
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
                <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Sales Summary Preview</h2>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-tight">
                  {(MONTHS.find(m => m.val === month)?.label || 'Selected Period')?.split('—')[0].trim()} {year} — {summary.totalInvoices} Orders
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
            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">JSON Downloaded! Now Upload to GST Portal</h2>
          </div>
          <ol className="space-y-2 text-[12px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">
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
            <div className="bg-gray-100 dark:bg-slate-800 p-3 rounded-xl"><FileText className="text-gray-500 dark:text-slate-400" size={22} /></div>
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Filing History</h2>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-tight">Track all your past GST filings</p>
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
                <tr className="border-b border-gray-100 dark:border-slate-800">
                  {['Period', 'Type', 'Invoices', 'Total Amount', 'Status', 'Generated', 'Actions'].map(h => (
                    <th key={h} className="text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pb-3 pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filings.map((f) => (
                  <tr key={f.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors border-b border-slate-50 dark:border-slate-800/50">
                    <td className="py-3 pr-4 text-sm font-bold text-slate-800 dark:text-slate-200">{formatPeriod(f.filingMonth)}</td>
                    <td className="py-3 pr-4">
                      <span className="px-2 py-1 bg-pos-primary/10 text-pos-primary rounded text-[10px] font-black uppercase">{f.returnType}</span>
                    </td>
                    <td className="py-3 pr-4 text-sm text-slate-600 dark:text-slate-400 font-bold">{f.invoiceCount}</td>
                    <td className="py-3 pr-4 text-sm font-bold text-slate-800 dark:text-slate-200">₹{fmt(f.totalAmount)}</td>
                    <td className="py-3 pr-4">
                      <span className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-black uppercase w-fit ${
                        f.status === 'SUBMITTED'
                          ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      }`}>
                        {f.status === 'SUBMITTED' ? <BadgeCheck size={11} /> : <Clock size={11} />}
                        {f.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-[11px] text-slate-400 dark:text-slate-500 font-bold">
                      {new Date(f.generatedAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDownload(f.id)}
                          className="p-2 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-pos-primary hover:text-white transition-all text-gray-500 dark:text-slate-400"
                          title="Download JSON"
                        >
                          <Download size={13} />
                        </button>
                        {f.status === 'DRAFT' && (
                          <>
                            <button
                              onClick={() => handleMarkSubmitted(f.id)}
                              className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-500 hover:text-white transition-all text-emerald-600 dark:text-emerald-400"
                              title="Mark as Submitted"
                            >
                              <BadgeCheck size={13} />
                            </button>
                            <button
                              onClick={() => handleDelete(f.id)}
                              className="p-2 rounded-lg bg-red-50 dark:bg-red-500/10 hover:bg-red-500 hover:text-white transition-all text-red-400 dark:text-red-400"
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
