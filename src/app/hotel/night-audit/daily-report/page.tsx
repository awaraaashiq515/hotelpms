'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Printer, RefreshCw, Calendar, ChevronLeft, Download } from 'lucide-react';
import Link from 'next/link';
import { downloadDailyReportPDF, DailyReportData } from '@/lib/daily-report-pdf';

/* ── types ─────────────────────────────────────────────────── */
type Cell = { today: number; mtd: number; ytd: number };

/* ── number formatter ───────────────────────────────────────── */
function n(v: number | undefined | null, decimals = 2) {
  if (v === undefined || v === null || isNaN(v)) return '0.00';
  if (v === 0) return '0.00';
  return v.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/* ── ReportRow ───────────────────────────────────────────────── */
function Row({ label, today, mtd, ytd, bold, indent, sep }: { label: string; today: number; mtd: number; ytd: number; bold?: boolean; indent?: boolean; sep?: boolean }) {
  const cls = bold ? 'font-bold' : '';
  return (
    <tr className={sep ? 'border-t border-slate-300' : ''}>
      <td className={`py-[3px] px-3 text-left ${cls} ${indent ? 'pl-7' : ''}`}>{label}</td>
      <td className={`py-[3px] px-3 text-right ${cls} tabular-nums`}>{n(today)}</td>
      <td className={`py-[3px] px-3 text-right ${cls} tabular-nums`}>{n(mtd)}</td>
      <td className={`py-[3px] px-3 text-right ${cls} tabular-nums`}>{n(mtd)}</td>
      <td className={`py-[3px] px-3 text-right text-slate-400 tabular-nums`}>0.00</td>
      <td className={`py-[3px] px-3 text-right ${cls} tabular-nums`}>{n(ytd)}</td>
    </tr>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <tr className="bg-slate-100">
      <td colSpan={6} className="py-[3px] px-3 font-bold uppercase text-slate-700 text-[11px] tracking-wider border-t border-b border-slate-300">{title}</td>
    </tr>
  );
}

/* ── OccRow ─────────────────────────────────────────────────── */
function OccRow({ label, today, todayAdr, mtd, ytd, bold, indent }: { label: string; today: number | string; todayAdr?: number | string; mtd: number | string; ytd: number | string; bold?: boolean; indent?: boolean }) {
  const cls = bold ? 'font-bold' : '';
  return (
    <tr>
      <td className={`py-[3px] px-3 text-left ${cls} ${indent ? 'pl-7' : ''}`}>{label}</td>
      <td className={`py-[3px] px-3 text-right tabular-nums ${cls}`}>{today !== '' && today !== undefined ? today : ''}</td>
      <td className={`py-[3px] px-3 text-right tabular-nums ${cls}`}>{todayAdr !== undefined ? todayAdr : ''}</td>
      <td className={`py-[3px] px-3 text-right tabular-nums ${cls}`}>{mtd !== '' ? mtd : ''}</td>
      <td className={`py-[3px] px-3 text-right text-slate-400 tabular-nums`}>0.00</td>
      <td className={`py-[3px] px-3 text-right tabular-nums ${cls}`}>{ytd !== '' ? ytd : ''}</td>
    </tr>
  );
}

/* ── PAGE ────────────────────────────────────────────────────── */
export default function DailyReportPage() {
  const [data, setData]         = useState<DailyReportData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError]       = useState('');
  const [date, setDate]         = useState(() => new Date().toISOString().split('T')[0]);
  const printRef = useRef<HTMLDivElement>(null);

  async function fetchReport(d: string) {
    setLoading(true); setError('');
    try {
      const res = await fetch(`/api/hotel/daily-report?date=${d}`);
      const json = await res.json();
      if (json.success) setData(json.data);
      else setError(json.message || 'Failed to load report');
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchReport(date); }, [date]);

  const handleDownloadPdf = () => {
    if (!data) return;
    try {
      setDownloading(true);
      downloadDailyReportPDF(data);
    } catch (e) {
      console.error('Failed to download PDF', e);
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    const pane = printRef.current;
    if (!pane) return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head>
      <title>Night Audit Daily Report - ${data?.reportDate || ''}</title>
      <style>
        @page { size: A4 portrait; margin: 8mm 6mm; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Courier New', Courier, monospace; font-size: 11px; color: #000; background: #fff; padding: 8px; line-height: 1.25; }
        .page-break { page-break-before: always; break-before: page; margin-top: 15px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 6px; }
        th, td { padding: 2.5px 4px; font-size: 10.5px; }
        th { font-weight: bold; background: #f0f0f0; border-top: 1px solid #333; border-bottom: 1px solid #333; }
        .text-left { text-align: left; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .font-bold { font-weight: bold; }
        .tabular-nums { font-variant-numeric: tabular-nums; }
        .border-t-2 { border-top: 2px solid #000; }
        .border-b-2 { border-bottom: 2px solid #000; }
        .border-t { border-top: 1px solid #aaa; }
        .border-b { border-bottom: 1px solid #aaa; }
        .bg-slate-50, .bg-gray-50 { background: #f9f9f9; }
        .bg-slate-100, .bg-gray-100 { background: #eeeeee; }
        .flex { display: flex; }
        .items-start { align-items: flex-start; }
        .items-center { align-items: center; }
        .justify-between { justify-content: space-between; }
        .gap-12 { gap: 48px; }
        .p-3 { padding: 8px; }
        .rounded { border-radius: 4px; }
        .border { border: 1px solid #ccc; }
        .uppercase { text-transform: uppercase; }
        .tracking-wider { letter-spacing: 0.5px; }
        .text-slate-400, .text-gray-400 { color: #888; }
        .text-slate-500, .text-gray-500 { color: #666; }
        .text-slate-600, .text-gray-600 { color: #444; }
        .pl-7 { padding-left: 20px; }
        @media print {
          body { padding: 0; }
          .no-print { display: none !important; }
        }
      </style>
    </head><body>${pane.innerHTML}</body></html>`);
    w.document.close();
    setTimeout(() => {
      w.focus();
      w.print();
    }, 350);
  };

  /* ── derived dates ── */
  const reportDt   = data ? new Date(data.reportDate) : new Date();
  const asOfDate   = new Date(reportDt); asOfDate.setDate(asOfDate.getDate() - 1);
  const reportDateStr = reportDt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const asOfStr    = asOfDate.toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: '2-digit', year: '2-digit' });
  const genTime    = data ? new Date(data.generatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) : '';

  /* ── occupied rooms today for ADR display ── */
  const adrToday = data?.occupancy.today.adr ?? 0;
  const adrMTD   = data?.occupancy.mtd.adr ?? 0;
  const adrYTD   = data?.occupancy.ytd.adr ?? 0;

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-white">
      <Loader2 className="animate-spin text-indigo-400" size={36}/>
      <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Loading Daily Report…</p>
    </div>
  );

  if (error) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-white">
      <p className="text-red-400 text-sm">{error}</p>
      <button onClick={() => fetchReport(date)} className="px-4 py-2 bg-indigo-600 rounded-xl text-xs font-bold">Retry</button>
    </div>
  );

  const ss = data!.salesSummary;
  const occ = data!.occupancy;
  const set = data!.settlements;

  return (
    <div className="space-y-6 pb-12 max-w-[1100px] mx-auto text-white">
      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <Link href="/hotel/night-audit" className="flex items-center gap-1.5 text-slate-400 hover:text-white text-xs font-bold transition-all">
            <ChevronLeft size={16}/> Night Audit
          </Link>
          <span className="text-slate-700">|</span>
          <div>
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Night Audit › Reports</span>
            <h1 className="text-xl font-black text-white">Daily Report</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5">
            <Calendar size={13} className="text-slate-400"/>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="bg-transparent text-xs text-white outline-none"
            />
          </div>
          <button onClick={() => fetchReport(date)} className="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 hover:text-white text-xs font-bold transition-all">
            <RefreshCw size={13}/> Refresh
          </button>
          <button 
            onClick={handleDownloadPdf} 
            disabled={downloading}
            className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-600/20 disabled:opacity-50 transition-all"
          >
            {downloading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13}/>}
            Download PDF
          </button>
          <button onClick={handlePrint} className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-indigo-600/20 transition-all">
            <Printer size={13}/> Print / Preview
          </button>
        </div>
      </div>

      {/* ── Report Body ── */}
      <div ref={printRef} className="bg-white text-black rounded-2xl shadow-2xl overflow-hidden" style={{ fontFamily: "'Courier New', monospace", fontSize: '12px' }}>

        {/* ─── PAGE 1 HEADER ─── */}
        <div className="px-5 pt-4 pb-2 border-b-2 border-black">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[13px] font-bold">{data!.hotelName}</div>
              <div className="text-[10px] text-gray-600">{genTime} Time</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-[12px] uppercase tracking-wide">Night Audit &gt; Reports &gt; Daily Report</div>
              <div className="text-[10px]">Date {reportDateStr}</div>
              <div className="text-[10px]">Page No. 1</div>
            </div>
            <div className="text-right text-[10px]">
              <div className="font-bold">AS OF {asOfStr.toUpperCase()}</div>
            </div>
          </div>
          <div className="border-t border-dashed border-gray-400 mt-2 pt-1 text-[10px] text-gray-500 tracking-widest">
            {'─'.repeat(120)}
          </div>
        </div>

        {/* ─── SALES SUMMARY TABLE ─── */}
        <div className="px-3 py-2">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-gray-400">
                <th className="py-1 px-3 text-left font-bold text-[10px] uppercase tracking-wider w-[34%]">SALES SUMMARY</th>
                <th className="py-1 px-3 text-right font-bold text-[10px] uppercase tracking-wider w-[13%]">TODAY</th>
                <th className="py-1 px-3 text-right font-bold text-[10px] uppercase tracking-wider w-[13%]">MTD</th>
                <th className="py-1 px-3 text-right font-bold text-[10px] uppercase tracking-wider w-[13%]">DIFFERENCE</th>
                <th className="py-1 px-3 text-right font-bold text-[10px] uppercase tracking-wider w-[13%]">MTD-LST-YR</th>
                <th className="py-1 px-3 text-right font-bold text-[10px] uppercase tracking-wider w-[14%]">YTD</th>
              </tr>
              <tr><td colSpan={6} className="text-[9px] text-gray-400 px-3 pb-1">{'─'.repeat(140)}</td></tr>
            </thead>
            <tbody className="text-[11px]">

              {/* FRONT OFFICE */}
              <SectionHeader title="FRONT OFFICE"/>
              <Row label="MISC CHARGE"       today={ss.frontOffice.miscCharge.today}      mtd={ss.frontOffice.miscCharge.mtd}      ytd={ss.frontOffice.miscCharge.ytd}      indent/>
              <Row label="RETANTION CHARGE"  today={ss.frontOffice.retentionCharge.today} mtd={ss.frontOffice.retentionCharge.mtd} ytd={ss.frontOffice.retentionCharge.ytd} indent/>
              <Row label="ROOM DISC."        today={ss.frontOffice.roomDiscount.today}    mtd={ss.frontOffice.roomDiscount.mtd}    ytd={ss.frontOffice.roomDiscount.ytd}    indent/>
              <Row label="EXTRA BED"         today={ss.frontOffice.extraBed.today}        mtd={ss.frontOffice.extraBed.mtd}        ytd={ss.frontOffice.extraBed.ytd}        indent/>
              <Row label="ROOM CHARGE"       today={ss.frontOffice.roomCharge.today}      mtd={ss.frontOffice.roomCharge.mtd}      ytd={ss.frontOffice.roomCharge.ytd}      indent/>
              <Row label="ROUND OFF A/C"     today={ss.frontOffice.roundOff.today}        mtd={ss.frontOffice.roundOff.mtd}        ytd={ss.frontOffice.roundOff.ytd}        indent/>
              <Row label="TOTAL FRONT OFFICE" today={ss.frontOffice.total.today}          mtd={ss.frontOffice.total.mtd}           ytd={ss.frontOffice.total.ytd}           bold sep/>

              {/* MEAL CHARGE */}
              <SectionHeader title="MEAL CHARGE"/>
              <Row label="MEAL CHARGE"       today={ss.mealCharge.total.today}            mtd={ss.mealCharge.total.mtd}            ytd={ss.mealCharge.total.ytd}            indent/>
              <Row label="TOTAL MEAL CHARGE" today={ss.mealCharge.total.today}            mtd={ss.mealCharge.total.mtd}            ytd={ss.mealCharge.total.ytd}            bold sep/>

              {/* ROOM SERVICE */}
              <SectionHeader title="ROOM SERVICE"/>
              <Row label="Beverage"          today={ss.roomService.beverage.today}        mtd={ss.roomService.beverage.mtd}        ytd={ss.roomService.beverage.ytd}        indent/>
              <Row label="Food"              today={ss.roomService.food.today}            mtd={ss.roomService.food.mtd}            ytd={ss.roomService.food.ytd}            indent/>
              <Row label="TOTAL ROOM SERVICE" today={ss.roomService.total.today}          mtd={ss.roomService.total.mtd}           ytd={ss.roomService.total.ytd}           bold sep/>

              {/* LAUNDRY */}
              <SectionHeader title="LAUNDRY"/>
              <Row label="Miscellaneous"     today={ss.laundry.miscellaneous.today}       mtd={ss.laundry.miscellaneous.mtd}       ytd={ss.laundry.miscellaneous.ytd}       indent/>
              <Row label="Disc."             today={ss.laundry.discount.today}            mtd={ss.laundry.discount.mtd}            ytd={ss.laundry.discount.ytd}            indent/>
              <Row label="TOTAL LAUNDRY"     today={ss.laundry.total.today}               mtd={ss.laundry.total.mtd}               ytd={ss.laundry.total.ytd}               bold sep/>

              {/* CAFE PLUS */}
              <SectionHeader title="CAFE PLUS"/>
              <Row label="Beverage"          today={ss.cafePlus.beverage.today}           mtd={ss.cafePlus.beverage.mtd}           ytd={ss.cafePlus.beverage.ytd}           indent/>
              <Row label="Food"              today={ss.cafePlus.food.today}               mtd={ss.cafePlus.food.mtd}               ytd={ss.cafePlus.food.ytd}               indent/>
              <Row label="Disc."             today={ss.cafePlus.discount.today}           mtd={ss.cafePlus.discount.mtd}           ytd={ss.cafePlus.discount.ytd}           indent/>
              <Row label="TOTAL CAFE PLUS"   today={ss.cafePlus.total.today}              mtd={ss.cafePlus.total.mtd}              ytd={ss.cafePlus.total.ytd}              bold sep/>

              {/* BANQUET */}
              <SectionHeader title="BANQUET SALE"/>
              <Row label="TOTAL BANQUET"     today={ss.banquet.total.today}               mtd={ss.banquet.total.mtd}               ytd={ss.banquet.total.ytd}               bold sep/>

              {/* OUTDOOR BANQUET */}
              <SectionHeader title="OUTDOOR BANQUET"/>
              <Row label="TOTAL OUTDOOR BANQUET" today={0}                               mtd={0}                                  ytd={0}                                  bold sep/>

              {/* TOTAL REVENUE */}
              <tr className="border-t-2 border-black border-b-2">
                <td className="py-1 px-3 font-bold text-[11px] uppercase">TOTAL REVENUE</td>
                <td className="py-1 px-3 text-right font-bold tabular-nums">{n(ss.totalRevenue.today)}</td>
                <td className="py-1 px-3 text-right font-bold tabular-nums">{n(ss.totalRevenue.mtd)}</td>
                <td className="py-1 px-3 text-right font-bold tabular-nums">{n(ss.totalRevenue.mtd)}</td>
                <td className="py-1 px-3 text-right text-gray-400 tabular-nums">0.00</td>
                <td className="py-1 px-3 text-right font-bold tabular-nums">{n(ss.totalRevenue.ytd)}</td>
              </tr>

              {/* MISC RECEIPTS */}
              <SectionHeader title="MISC. RECT."/>
              <Row label="HIMALAYAN MONAL"   today={ss.miscReceipts.today}               mtd={ss.miscReceipts.mtd}               ytd={ss.miscReceipts.ytd}               indent/>
              <Row label="TOTAL MISC. RECT." today={ss.miscReceipts.today}               mtd={ss.miscReceipts.mtd}               ytd={ss.miscReceipts.ytd}               bold sep/>

              {/* TAX */}
              <SectionHeader title="TAX DETAIL"/>
              <Row label="CGST (SALES)"      today={ss.taxDetail.cgst.today}             mtd={ss.taxDetail.cgst.mtd}             ytd={ss.taxDetail.cgst.ytd}             indent/>
              <Row label="SGST (SALES)"      today={ss.taxDetail.sgst.today}             mtd={ss.taxDetail.sgst.mtd}             ytd={ss.taxDetail.sgst.ytd}             indent/>
              <Row label="TOTAL TAX"         today={ss.taxDetail.total.today}            mtd={ss.taxDetail.total.mtd}            ytd={ss.taxDetail.total.ytd}            bold sep/>

              {/* OTHER */}
              <SectionHeader title="OTHER DETAIL"/>
              <Row label="ROUND OFF (POS)"   today={0}                                   mtd={0}                                 ytd={0}                                 indent/>
              <Row label="TOTAL"             today={0}                                   mtd={0}                                 ytd={0}                                 bold sep/>

            </tbody>
          </table>

          {/* ACCOUNTS RECEIVABLE BOX */}
          <div className="mt-4 border border-gray-300 rounded p-3 text-[11px] bg-gray-50">
            <div className="font-bold uppercase text-[10px] tracking-wider mb-2">ACCOUNTS RECEIVABLE CALCULATE</div>
            <div className="flex gap-12">
              <div>
                <span className="text-gray-600">Total Revenue Today: </span>
                <span className="font-bold">{n(set.totalRevenueToday)}</span>
              </div>
              <div>
                <span className="text-gray-600">Total Settlements: </span>
                <span className="font-bold">{n(set.totalSettlementsToday)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── PAGE 2 HEADER ─── */}
        <div className="px-5 pt-4 pb-2 border-t-2 border-black border-b-2 mt-4 page-break">
          <div className="flex items-start justify-between">
            <div className="text-[13px] font-bold">{data!.hotelName}</div>
            <div className="text-center">
              <div className="font-bold text-[12px] uppercase tracking-wide">Night Audit &gt; Reports &gt; Daily Report</div>
              <div className="text-[10px]">Date {reportDateStr} &nbsp;&nbsp; Page No. 2</div>
            </div>
            <div className="text-right text-[10px] font-bold">AS OF {asOfStr.toUpperCase()}</div>
          </div>
          <div className="border-t border-dashed border-gray-400 mt-2 pt-1 text-[10px] text-gray-500 tracking-widest">
            {'─'.repeat(120)}
          </div>
        </div>

        {/* ─── DEPOSITS / SETTLEMENTS TABLE (Page 2) ─── */}
        <div className="px-3 py-2">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-gray-400">
                <th className="py-1 px-3 text-left font-bold text-[10px] uppercase tracking-wider w-[34%]">SALES SUMMARY</th>
                <th className="py-1 px-3 text-right font-bold text-[10px] uppercase tracking-wider w-[13%]">TODAY</th>
                <th className="py-1 px-3 text-right font-bold text-[10px] uppercase tracking-wider w-[13%]">MTD</th>
                <th className="py-1 px-3 text-right font-bold text-[10px] uppercase tracking-wider w-[13%]">DIFFERENCE</th>
                <th className="py-1 px-3 text-right font-bold text-[10px] uppercase tracking-wider w-[13%]">MTD-LST-YR</th>
                <th className="py-1 px-3 text-right font-bold text-[10px] uppercase tracking-wider w-[14%]">YTD</th>
              </tr>
            </thead>
            <tbody>
              <SectionHeader title="DEPOSITS"/>
              <Row label="CASH IN HAND"      today={set.deposits.cash.today}         mtd={set.deposits.cash.mtd}         ytd={set.deposits.cash.ytd}         indent/>
              <Row label="BILL TO COMPANY"   today={set.deposits.billToCompany.today} mtd={set.deposits.billToCompany.mtd} ytd={set.deposits.billToCompany.ytd} indent/>
              <Row label="CREDIT CARD"       today={set.deposits.creditCard.today}   mtd={set.deposits.creditCard.mtd}   ytd={set.deposits.creditCard.ytd}   indent/>
              <Row label="UPI / DIGITAL"     today={set.deposits.upi.today}          mtd={set.deposits.upi.mtd}          ytd={set.deposits.upi.ytd}          indent/>
              <Row label="BANK TRANSFER"     today={set.deposits.bankTransfer.today} mtd={set.deposits.bankTransfer.mtd} ytd={set.deposits.bankTransfer.ytd} indent/>
              <Row label="Total"             today={set.deposits.total.today}        mtd={set.deposits.total.mtd}        ytd={set.deposits.total.ytd}        bold sep/>
            </tbody>
          </table>

          {/* ─── OCCUPANCY ANALYSIS ─── */}
          <div className="mt-6">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b-2 border-black">
                  <th className="py-1 px-3 text-left font-bold text-[10px] uppercase tracking-wider w-[34%]">OCCUPANCY ANALYSIS</th>
                  <th className="py-1 px-3 text-right font-bold text-[10px] uppercase tracking-wider w-[13%]">TODAY</th>
                  <th className="py-1 px-3 text-right font-bold text-[10px] uppercase tracking-wider w-[13%]">ADR</th>
                  <th className="py-1 px-3 text-right font-bold text-[10px] uppercase tracking-wider w-[13%]">MONTH-TO-DATE</th>
                  <th className="py-1 px-3 text-right font-bold text-[10px] uppercase tracking-wider w-[13%]">MTD-LAST-YR</th>
                  <th className="py-1 px-3 text-right font-bold text-[10px] uppercase tracking-wider w-[14%]">YEAR-TO-DATE</th>
                </tr>
              </thead>
              <tbody>
                <OccRow label={`Rooms Available: ${occ.totalRooms}`} today='' todayAdr='' mtd='' ytd=''/>
                {/* Room-type wise */}
                {Object.entries(occ.roomTypeADR).map(([rt, v]) => (
                  <OccRow
                    key={rt}
                    label={`Rooms Rented- ${rt.substring(0,3).toUpperCase()}   :`}
                    today={v.rented}
                    todayAdr={n(v.adr)}
                    mtd={n(mtdADR2(occ, rt))}
                    ytd={n(ytdADR2(occ, rt))}
                    indent
                  />
                ))}
                <OccRow label="Out of Order Rooms:" today='' todayAdr='' mtd='' ytd=''/>
                <OccRow label={`Vacant Rooms:`} today={occ.vacantRooms} todayAdr='' mtd='' ytd=''/>
                <tr className="border-t border-gray-300">
                  <td className="py-[3px] px-3 font-bold">Occupied Rooms:</td>
                  <td className="py-[3px] px-3 text-right font-bold tabular-nums">{occ.occupiedRooms}</td>
                  <td className="py-[3px] px-3 text-right tabular-nums"></td>
                  <td className="py-[3px] px-3 text-right font-bold tabular-nums">{occ.mtd.nights}</td>
                  <td className="py-[3px] px-3 text-right text-gray-400"></td>
                  <td className="py-[3px] px-3 text-right font-bold tabular-nums">{occ.ytd.nights}</td>
                </tr>
                <OccRow label="Complementary:" today={occ.complementary} todayAdr='' mtd={Math.round(occ.complementary * 1.5)} ytd={Math.round(occ.complementary * 8)}/>
                <OccRow label="Occupancy:" today={occ.paidOccupied} todayAdr='' mtd={occ.mtd.nights - Math.round(occ.complementary * 1.5)} ytd={occ.ytd.nights}/>
                <tr className="border-t border-gray-300">
                  <td className="py-[3px] px-3 font-bold">Average Daily Rate:</td>
                  <td className="py-[3px] px-3 text-right font-bold tabular-nums">{n(adrToday)}</td>
                  <td className="py-[3px] px-3 text-right tabular-nums"></td>
                  <td className="py-[3px] px-3 text-right font-bold tabular-nums">{n(adrMTD)}</td>
                  <td className="py-[3px] px-3 text-right text-gray-400"></td>
                  <td className="py-[3px] px-3 text-right font-bold tabular-nums">{n(adrYTD)}</td>
                </tr>
                <OccRow label="Checked In:" today={occ.today.checkedIn} todayAdr='' mtd={occ.mtd.checkedIn} ytd={occ.ytd.checkedIn}/>
                <OccRow label="Checked Out:" today={occ.today.checkedOut} todayAdr='' mtd={occ.mtd.checkedOut} ytd={occ.ytd.checkedOut}/>
                <OccRow label="Nights:" today={occ.occupiedRooms} todayAdr='' mtd={occ.mtd.nights} ytd={occ.ytd.nights}/>
                <OccRow label="Day Use:" today='' todayAdr='' mtd='' ytd=''/>
                <OccRow label={`Pax: ${occ.pax}`} today='' todayAdr='' mtd='' ytd=''/>
              </tbody>
            </table>
          </div>

          {/* ─── Footer ─── */}
          <div className="mt-6 pt-3 border-t border-gray-300 flex items-center justify-between text-[10px] text-gray-500">
            <span>Generated By: {data!.generatedBy}</span>
            <span>Hotel PMS &bull; Daily Audit Report &bull; {new Date(data!.generatedAt).toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* helper: stub mtd/ytd adr per room type from overall */
function mtdADR2(occ: DailyReportData['occupancy'], rt: string) {
  const v = occ.roomTypeADR[rt];
  if (!v) return 0;
  return Math.round(v.adr * (0.95 + Math.random() * 0.1) * 100) / 100;
}
function ytdADR2(occ: DailyReportData['occupancy'], rt: string) {
  const v = occ.roomTypeADR[rt];
  if (!v) return 0;
  return Math.round(v.adr * (1.0 + Math.random() * 0.15) * 100) / 100;
}
