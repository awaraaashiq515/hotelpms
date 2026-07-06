'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { DueDatesCard } from './components/due-dates-card';
import { PeriodSelectCard } from './components/period-select-card';
import { SummaryPreviewCard } from './components/summary-preview-card';
import { UploadInstructionsCard } from './components/upload-instructions-card';
import { FilingHistoryCard } from './components/filing-history-card';

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
const prevMonth = currentDate.getMonth() === 0 
  ? '12' 
  : String(currentDate.getMonth()).padStart(2, '0');
const prevYear = currentDate.getMonth() === 0
  ? String(currentDate.getFullYear() - 1)
  : currentDate.getFullYear().toString();

function formatPeriod(fp: string) {
  if (!fp) return fp;
  if (fp.startsWith('D')) {
    // Daily period format: "D06072026" -> "06 Jul 2026"
    const d = fp.slice(1, 3);
    const m = fp.slice(3, 5);
    const y = fp.slice(5);
    const mo = MONTHS.find(x => x.val === m);
    const mName = mo ? mo.label.split('—')[0].trim() : m;
    return `${d} ${mName} ${y}`;
  }
  if (fp.length < 6) return fp;
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
  const [periodType, setPeriodType] = useState<'monthly' | 'daily'>('monthly');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

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

  useEffect(() => {
    loadHistory();
  }, []);

  const handleGenerate = async () => {
    if (periodType === 'monthly' && (!month || !year)) {
      showToast('error', 'Please select month and year');
      return;
    }
    if (periodType === 'daily' && !selectedDate) {
      showToast('error', 'Please select a date');
      return;
    }
    setGenerating(true);
    setSummary(null);
    setGstJson(null);
    setDetailedInvoices([]);
    setFilingId(null);
    try {
      const payload = periodType === 'daily'
        ? { date: selectedDate, returnType, saveDraft: true }
        : { month, year, returnType, saveDraft: true };

      const res = await fetch('/api/gst/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
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

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this draft filing?')) return;
    const r = await fetch(`/api/gst/filings?id=${id}`, { method: 'DELETE' });
    const d = await r.json();
    if (d.success) {
      showToast('success', 'Draft deleted successfully');
      loadHistory();
    }
  };

  const handleDownloadExcel = async () => {
    if (!gstJson) return;
    
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
      [0, "", 0, "", "0.00", "", "", "", "", "", "0.00", "0.00"],
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
      hsnData.push([row.hsn_sc, row.desc, row.uqc, row.qty, totVal, row.txval, row.iamt || 0, row.camt || 0, row.samt || 0, row.csamt || 0]);
    });
    addSheet(hsnData, "hsn", [{ wch: 15 }, { wch: 30 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 15 }]);

    // 11. docs Sheet
    const docsArr = gstJson.doc_issue?.doc_det?.[0]?.docs || [];
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
      docsData.push(["Invoices for outward supply", row.from, row.to, row.totnum, row.cancel, row.net_issue]);
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
            .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 30px; }
            .stat { background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; text-align: center; }
            .stat-label { font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; margin-bottom: 8px; }
            .stat-val { font-size: 18px; font-weight: 700; color: #0f172a; }
            .grand-total-box { margin-top: 20px; border-top: 2px solid #3b82f6; padding-top: 15px; }
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
            <div><strong>Filing Period:</strong> ${formatPeriod(summary?.period) || 'N/A'}</div>
            <div><strong>Return Type:</strong> GSTR-1 (Outward Supplies)</div>
            <div><strong>Total GST Payable:</strong> ₹${((summary?.totalCGST || 0) + (summary?.totalSGST || 0)).toLocaleString('en-IN', {minimumFractionDigits: 2})}</div>
          </div>
          
          <div class="grid">
            <div class="stat"><div class="stat-label">Total Orders/Invoices</div><div class="stat-val">${summary?.totalInvoices || 0}</div></div>
            <div class="stat"><div class="stat-label">Taxable Value</div><div class="stat-val">₹${summary?.totalTaxableValue?.toLocaleString('en-IN', {minimumFractionDigits: 2}) || 0}</div></div>
            <div class="stat"><div class="stat-label">Total CGST</div><div class="stat-val">₹${summary?.totalCGST?.toLocaleString('en-IN', {minimumFractionDigits: 2}) || 0}</div></div>
            <div class="stat"><div class="stat-label">Total SGST</div><div class="stat-val">₹${summary?.totalSGST?.toLocaleString('en-IN', {minimumFractionDigits: 2}) || 0}</div></div>
            <div class="stat" style="background: #fef2f2; border: 1px solid #fecaca;"><div class="stat-label" style="color: #ef4444;">Total GST Payable</div><div class="stat-val" style="color: #dc2626;">₹${((summary?.totalCGST || 0) + (summary?.totalSGST || 0)).toLocaleString('en-IN', {minimumFractionDigits: 2})}</div></div>
          </div>
 
          <div class="grand-total-box" style="display: flex; justify-content: space-between; align-items: flex-end;">
            <div style="text-align: left;">
              <span class="grand-total-label" style="color: #ef4444;">Total GST Payable:</span><br/>
              <span class="grand-total-val" style="color: #dc2626;">₹${((summary?.totalCGST || 0) + (summary?.totalSGST || 0)).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
            </div>
            <div style="text-align: right;">
              <span class="grand-total-label">Grand Total Value:</span><br/>
              <span class="grand-total-val">₹${summary?.totalGrandTotal?.toLocaleString('en-IN', {minimumFractionDigits: 2}) || 0}</span>
            </div>
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
                    <td>${r.qty || 0}</td>
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
        description="GST returns track karo, due dates manage karo, aur GSTR-1 JSON generate karo."
        showBack
        backUrl="/operations"
      />

      {/* ── GST Return Due Date Dashboard Component ────────────────────── */}
      <DueDatesCard
        showToast={showToast}
        formatPeriod={formatPeriod}
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

      {/* ── Step 1: Period Selection Component ────────────────────────── */}
      {step === 1 && (
        <PeriodSelectCard
          month={month}
          setMonth={setMonth}
          year={year}
          setYear={setYear}
          periodType={periodType}
          setPeriodType={setPeriodType}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          generating={generating}
          handleGenerate={handleGenerate}
          years={years}
        />
      )}

      {/* ── Step 2: Summary Preview Component ─────────────────────────── */}
      {summary && (
        <SummaryPreviewCard
          summary={summary}
          gstJson={gstJson}
          detailedInvoices={detailedInvoices}
          filingId={filingId}
          showPreview={showPreview}
          setShowPreview={setShowPreview}
          handleDownload={handleDownload}
          handleDownloadExcel={handleDownloadExcel}
          handleDownloadPDF={handleDownloadPDF}
          handleGenerate={handleGenerate}
          generating={generating}
          formatPeriod={formatPeriod}
        />
      )}

      {/* ── Step 3: Upload Instructions Component ─────────────────────── */}
      {step === 3 && (
        <UploadInstructionsCard
          filingId={filingId}
          handleMarkSubmitted={handleMarkSubmitted}
          setStep={setStep}
        />
      )}

      {/* ── Filing History Component ──────────────────────────────────── */}
      <FilingHistoryCard
        filings={filings}
        historyLoading={historyLoading}
        loadHistory={loadHistory}
        handleDownload={handleDownload}
        handleMarkSubmitted={handleMarkSubmitted}
        handleDelete={handleDelete}
        formatPeriod={formatPeriod}
      />
    </div>
  );
}
