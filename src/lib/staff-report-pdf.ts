/**
 * GuestFlow Hotel PMS — Staff Attendance & Overtime PDF Report Generator
 * Generates an official, certified PDF statement using jsPDF and jspdf-autotable.
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const BRAND_NAVY: [number, number, number] = [15, 23, 42]; // Slate-900
const BRAND_BLUE: [number, number, number] = [37, 99, 235]; // Blue-600
const BRAND_AMBER: [number, number, number] = [217, 119, 6]; // Amber-600

export function sanitizePDFText(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return '';
  return String(val)
    .replace(/₹/g, 'Rs. ')
    .replace(/→/g, ' - ')
    .replace(/—/g, ' - ')
    .replace(/•/g, '* ')
    .replace(/⚡/g, 'OT: ')
    .replace(/[^\x00-\x7F]/g, '');
}

export interface StaffSingleReportPDFOptions {
  hotelName?: string;
  propertyCode?: string;
  staffName: string;
  designation?: string;
  periodLabel: string;
  startDateStr: string;
  endDateStr: string;
  standardShiftHours: number;
  kpis: {
    daysAttended: number;
    standardWorkingDays: number;
    attendanceRate: number;
    totalOvertimeHours: number;
    totalWorkedHours: number;
    leavesCount: number;
  };
  rows: Array<{
    date: string;
    clockIn: string;
    clockOut: string;
    duration: string;
    shift: string;
    overtime: string;
    status: string;
  }>;
}

export interface StaffAllReportPDFOptions {
  hotelName?: string;
  propertyCode?: string;
  periodLabel: string;
  startDateStr: string;
  endDateStr: string;
  totalStaffCount: number;
  kpis: {
    totalPunches: number;
    totalWorkedHours: number;
    totalOvertimeHours: number;
    totalLeavesApproved: number;
  };
  staffSummaries: Array<{
    name: string;
    designation: string;
    daysAttended: string;
    shiftHours: string;
    totalOvertime: string;
    totalWorked: string;
    leaves: string;
    rate: string;
  }>;
}

/**
 * Downloads a complete, official PDF statement for a single staff member.
 */
export function downloadStaffSinglePDF(opts: StaffSingleReportPDFOptions) {
  const doc = new jsPDF({ orientation: 'portrait' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const hotelTitle = sanitizePDFText(opts.hotelName || 'GuestFlow Luxury Hotel & Resort');
  const propCode = opts.propertyCode ? `[${sanitizePDFText(opts.propertyCode)}]` : '';
  const empName = sanitizePDFText(opts.staffName);
  const empRole = sanitizePDFText(opts.designation || 'Staff Personnel');
  const periodText = sanitizePDFText(opts.periodLabel);

  // 1. Top Brand Header
  doc.setFillColor(...BRAND_BLUE);
  doc.rect(0, 0, pageWidth, 24, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text(`${hotelTitle.toUpperCase()} ${propCode}`, 14, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(224, 231, 255);
  doc.text('OFFICIAL STAFF ATTENDANCE & OVERTIME STATEMENT', 14, 18);

  const genDate = new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.setFontSize(8);
  doc.text(`Generated: ${genDate}`, pageWidth - 14, 14, { align: 'right' });

  // 2. Employee Info Banner
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 28, pageWidth - 28, 20, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...BRAND_NAVY);
  doc.text(empName, 18, 37);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Designation: ${empRole}  |  Standard Daily Shift: ${opts.standardShiftHours}.0 Hours`, 18, 43);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...BRAND_BLUE);
  doc.text(`Period: ${periodText}`, pageWidth - 18, 37, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`${opts.startDateStr} to ${opts.endDateStr}`, pageWidth - 18, 43, { align: 'right' });

  // 3. Metric KPI Cards (4 cards)
  const cardY = 52;
  const cards = [
    { label: 'DAYS ATTENDED', value: `${opts.kpis.daysAttended} / ${opts.kpis.standardWorkingDays}d (${opts.kpis.attendanceRate}%)` },
    { label: 'DAILY SHIFT', value: `${opts.standardShiftHours}.0 Hrs / Day` },
    { label: 'TOTAL OVERTIME', value: `+${opts.kpis.totalOvertimeHours} Hrs` },
    { label: 'TOTAL WORKED', value: `${opts.kpis.totalWorkedHours} Hrs (${opts.kpis.leavesCount} leaves)` },
  ];

  const cardGap = 4;
  const cardWidth = (pageWidth - 28 - (cards.length - 1) * cardGap) / cards.length;

  cards.forEach((c, idx) => {
    const x = 14 + idx * (cardWidth + cardGap);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, cardY, cardWidth, 14, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(idx === 2 ? BRAND_AMBER[0] : 100, idx === 2 ? BRAND_AMBER[1] : 116, idx === 2 ? BRAND_AMBER[2] : 139);
    doc.text(c.label, x + 3, cardY + 5);

    doc.setFontSize(8.5);
    doc.setTextColor(...BRAND_NAVY);
    doc.text(sanitizePDFText(c.value), x + 3, cardY + 10.5);
  });

  // 4. Itemized Attendance Table
  const tableColumns = ['DATE', 'CLOCK IN', 'CLOCK OUT', 'DURATION', 'SHIFT', 'OVERTIME', 'STATUS'];
  const tableRows = opts.rows.map((r) => [
    sanitizePDFText(r.date),
    sanitizePDFText(r.clockIn),
    sanitizePDFText(r.clockOut),
    sanitizePDFText(r.duration),
    sanitizePDFText(r.shift),
    sanitizePDFText(r.overtime),
    sanitizePDFText(r.status),
  ]);

  autoTable(doc, {
    startY: cardY + 18,
    head: [tableColumns],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: BRAND_NAVY,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 3,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
      cellPadding: 2.5,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    didDrawPage: (data) => {
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text(`Official Document · ${hotelTitle} · Page ${data.pageNumber} of ${pageCount}`, 14, pageHeight - 8);
    },
  });

  // 5. Signatures Block at the end of table
  const docWithAutoTable = doc as unknown as { lastAutoTable?: { finalY: number } };
  const finalY = docWithAutoTable.lastAutoTable?.finalY || cardY + 100;
  if (finalY + 30 < pageHeight - 15) {
    const sigY = finalY + 12;
    doc.setDrawColor(203, 213, 225);
    doc.setLineDashPattern([2, 2], 0);

    // Employee Signature Line
    doc.line(18, sigY + 14, 80, sigY + 14);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...BRAND_NAVY);
    doc.text(`Employee Signature (${empName})`, 18, sigY + 18);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text('I confirm the above punch timings are correct.', 18, sigY + 22);

    // Manager Signature Line
    doc.line(pageWidth - 80, sigY + 14, pageWidth - 18, sigY + 14);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...BRAND_NAVY);
    doc.text('Authorized Hotel / HR Manager', pageWidth - 80, sigY + 18);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Approved & Certified for Payroll Processing.', pageWidth - 80, sigY + 22);
  }

  const safeFilename = `${empName.replace(/\s+/g, '_')}_Attendance_${periodText.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  doc.save(safeFilename);
}

/**
 * Downloads a complete organization/hotel-wide PDF report of all staff members.
 */
export function downloadStaffAllSummaryPDF(opts: StaffAllReportPDFOptions) {
  const doc = new jsPDF({ orientation: 'landscape' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const hotelTitle = sanitizePDFText(opts.hotelName || 'GuestFlow Hotel PMS');
  const propCode = opts.propertyCode ? `[${sanitizePDFText(opts.propertyCode)}]` : '';
  const periodText = sanitizePDFText(opts.periodLabel);

  // 1. Top Brand Header
  doc.setFillColor(...BRAND_BLUE);
  doc.rect(0, 0, pageWidth, 22, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text(`${hotelTitle.toUpperCase()} ${propCode} — STAFF ATTENDANCE & OVERTIME MASTER REPORT`, 14, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(224, 231, 255);
  doc.text(`Period: ${periodText} (${opts.startDateStr} to ${opts.endDateStr})  |  Total Staff: ${opts.totalStaffCount}`, 14, 17);

  const genDate = new Date().toLocaleString('en-IN');
  doc.setFontSize(8);
  doc.text(`Generated: ${genDate}`, pageWidth - 14, 14, { align: 'right' });

  // 2. Metric KPI Cards (4 cards)
  const cardY = 26;
  const cards = [
    { label: 'TOTAL STAFF', value: `${opts.totalStaffCount} Personnel` },
    { label: 'TOTAL ATTENDANCE PUNCHES', value: `${opts.kpis.totalPunches} Logs` },
    { label: 'TOTAL OVERTIME HOURS', value: `+${opts.kpis.totalOvertimeHours} Hrs` },
    { label: 'TOTAL WORKED HOURS', value: `${opts.kpis.totalWorkedHours} Hrs` },
  ];

  const cardGap = 4;
  const cardWidth = (pageWidth - 28 - (cards.length - 1) * cardGap) / cards.length;

  cards.forEach((c, idx) => {
    const x = 14 + idx * (cardWidth + cardGap);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, cardY, cardWidth, 12, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(idx === 2 ? BRAND_AMBER[0] : 100, idx === 2 ? BRAND_AMBER[1] : 116, idx === 2 ? BRAND_AMBER[2] : 139);
    doc.text(c.label, x + 3, cardY + 4.5);

    doc.setFontSize(8.5);
    doc.setTextColor(...BRAND_NAVY);
    doc.text(sanitizePDFText(c.value), x + 3, cardY + 9.5);
  });

  // 3. Staff Summary Table
  const tableColumns = ['STAFF MEMBER', 'DESIGNATION', 'DAYS ATTENDED', 'DAILY SHIFT', 'TOTAL OVERTIME', 'TOTAL WORKED', 'APPROVED LEAVES', 'RATE'];
  const tableRows = opts.staffSummaries.map((s) => [
    sanitizePDFText(s.name),
    sanitizePDFText(s.designation),
    sanitizePDFText(s.daysAttended),
    sanitizePDFText(s.shiftHours),
    sanitizePDFText(s.totalOvertime),
    sanitizePDFText(s.totalWorked),
    sanitizePDFText(s.leaves),
    sanitizePDFText(s.rate),
  ]);

  autoTable(doc, {
    startY: cardY + 16,
    head: [tableColumns],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: BRAND_NAVY,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 3,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
      cellPadding: 2.5,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    didDrawPage: (data) => {
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text(`Confidential Master Report · ${hotelTitle} · Page ${data.pageNumber} of ${pageCount}`, 14, pageHeight - 8);
    },
  });

  const safeFilename = `Hotel_Staff_Attendance_Master_${periodText.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  doc.save(safeFilename);
}
