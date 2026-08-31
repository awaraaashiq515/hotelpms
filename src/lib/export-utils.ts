/**
 * GuestFlow POS & Hotel PMS — Export Utilities
 * Universal Excel (XLSX), CSV + PDF export for all hotel report & analytics pages.
 */

import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─── Brand color for PDF headers ──────────────────────────────
const POS_RED: [number, number, number] = [220, 38, 38];
const POS_DARK: [number, number, number] = [15, 23, 42];
const HOTEL_INDIGO: [number, number, number] = [79, 70, 229];

export function sanitizePDFString(str: string | number | null | undefined): string {
  if (str === null || str === undefined) return '';
  const s = String(str);
  return s
    .replace(/₹/g, 'Rs. ')
    .replace(/→/g, ' to ')
    .replace(/➔/g, ' to ')
    .replace(/—/g, ' - ')
    .replace(/•/g, '* ')
    .replace(/[^\x00-\x7F]/g, ''); // strip non-ascii to avoid font glitches
}

/**
 * Export data as an Excel (.xlsx) file.
 */
export function exportToExcel(
  rows: Record<string, string | number | null | undefined>[],
  filename: string,
  sheetName = 'Report'
) {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

/**
 * Basic POS PDF export
 */
export function exportToPDF(
  columns: string[],
  rows: (string | number)[][],
  filename: string,
  title: string,
  subtitle?: string
) {
  const doc = new jsPDF({ orientation: columns.length > 6 ? 'landscape' : 'portrait' });

  const cleanTitle = sanitizePDFString(title);
  const cleanSubtitle = subtitle ? sanitizePDFString(subtitle) : undefined;
  const cleanColumns = columns.map((c) => sanitizePDFString(c));
  const cleanRows = rows.map((r) => r.map((cell) => sanitizePDFString(cell)));

  doc.setFillColor(...POS_RED);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 18, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('GuestFlow POS', 14, 12);

  doc.setTextColor(...POS_DARK);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(cleanTitle, 14, 30);

  if (cleanSubtitle) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(cleanSubtitle, 14, 37);
  }

  const generatedAt = `Generated: ${new Date().toLocaleString('en-IN')}`;
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(generatedAt, doc.internal.pageSize.getWidth() - 14, 12, { align: 'right' });

  autoTable(doc, {
    startY: cleanSubtitle ? 44 : 38,
    head: [cleanColumns],
    body: cleanRows,
    theme: 'grid',
    headStyles: {
      fillColor: POS_RED,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    styles: { cellPadding: 3 },
  });

  doc.save(`${filename}.pdf`);
}

export interface HotelExportOptions {
  hotelName?: string;
  hotelAddress?: string;
  generatedBy?: string;
  subtitle?: string;
  dateRangeFormatted?: string;
  summaryCards?: { label: string; value: string; subtext?: string }[];
  footerText?: string;
}

/**
 * Enterprise Branded Hotel PMS PDF Exporter
 */
export function exportHotelPDF(
  columns: string[],
  rows: (string | number)[][],
  filename: string,
  title: string,
  optionsOrSubtitle?: string | HotelExportOptions,
  summaryCardsOld?: { label: string; value: string }[]
) {
  let options: HotelExportOptions = {};
  if (typeof optionsOrSubtitle === 'string') {
    options = {
      subtitle: optionsOrSubtitle,
      summaryCards: summaryCardsOld,
    };
  } else if (optionsOrSubtitle) {
    options = optionsOrSubtitle;
  }

  const hotelName = options.hotelName || 'Grand Luxury Hotel & Resort';
  const hotelAddress = options.hotelAddress || 'Executive Hotel PMS & Revenue System';
  const generatedBy = options.generatedBy || 'Admin / General Manager';
  const dateRange = options.dateRangeFormatted || options.subtitle || `Period: ${new Date().toLocaleDateString('en-IN')}`;
  const summaryCards = options.summaryCards || [];

  const doc = new jsPDF({ orientation: columns.length > 6 ? 'landscape' : 'portrait' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const cleanTitle = sanitizePDFString(title);
  const cleanHotelName = sanitizePDFString(hotelName);
  const cleanHotelAddress = sanitizePDFString(hotelAddress);
  const cleanGeneratedBy = sanitizePDFString(generatedBy);
  const cleanDateRange = sanitizePDFString(dateRange);
  const cleanColumns = columns.map((c) => sanitizePDFString(c));
  const cleanRows = rows.map((r) => r.map((cell) => sanitizePDFString(cell)));

  // Top Indigo Brand Bar
  doc.setFillColor(...HOTEL_INDIGO);
  doc.rect(0, 0, pageWidth, 24, 'F');

  // Brand Name & Tagline
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(cleanHotelName.toUpperCase(), 14, 11);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(224, 231, 255);
  doc.text(cleanHotelAddress, 14, 18);

  // Right Top Metadata
  const dateNowStr = new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(`Generated: ${dateNowStr}`, pageWidth - 14, 11, { align: 'right' });

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(224, 231, 255);
  doc.text(`Prepared by: ${cleanGeneratedBy}`, pageWidth - 14, 18, { align: 'right' });

  // Report Title Box
  doc.setTextColor(...POS_DARK);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(cleanTitle, 14, 35);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Report Period: ${cleanDateRange}`, 14, 42);

  let startY = 48;

  // Render Metric Summary Cards
  if (summaryCards.length > 0) {
    const cardGap = 4;
    const cardWidth = Math.min(55, (pageWidth - 28 - (summaryCards.length - 1) * cardGap) / summaryCards.length);
    summaryCards.forEach((card, idx) => {
      const cardX = 14 + idx * (cardWidth + cardGap);
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(cardX, startY, cardWidth, 15, 2, 2, 'FD');

      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'bold');
      doc.text(sanitizePDFString(card.label).toUpperCase(), cardX + 3, startY + 5);

      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...POS_DARK);
      doc.text(sanitizePDFString(card.value), cardX + 3, startY + 11.5);
    });
    startY += 21;
  }

  // Draw Data Table
  autoTable(doc, {
    startY,
    head: [cleanColumns],
    body: cleanRows,
    theme: 'grid',
    headStyles: {
      fillColor: HOTEL_INDIGO,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 3.5,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
      cellPadding: 3,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    styles: {
      overflow: 'linebreak',
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
    },
    didDrawPage: (data) => {
      // Footer on each page
      const pageCount = doc.getNumberOfPages();
      const pageStr = `Page ${data.pageNumber} of ${pageCount}`;
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Confidential · ${cleanHotelName} · Powered by GuestFlow Hotel PMS`,
        14,
        pageHeight - 8
      );
      doc.text(pageStr, pageWidth - 14, pageHeight - 8, { align: 'right' });
    },
  });

  doc.save(`${filename}.pdf`);
}

/**
 * Enterprise Branded Hotel PMS CSV Exporter with Metadata Header & Summary
 */
export function exportHotelCSV(
  columns: string[],
  rows: (string | number)[][],
  filename: string,
  title: string,
  options?: HotelExportOptions
) {
  const hotelName = options?.hotelName || 'Grand Luxury Hotel & Resort';
  const generatedBy = options?.generatedBy || 'Admin / General Manager';
  const dateRange = options?.dateRangeFormatted || options?.subtitle || `Period: ${new Date().toLocaleDateString('en-IN')}`;
  const dateNowStr = new Date().toLocaleString('en-IN');

  const metaHeader = [
    `"================================================================================"`,
    `"HOTEL PROPERTY","${hotelName.replace(/"/g, '""')}"`,
    `"REPORT TITLE","${title.replace(/"/g, '""')}"`,
    `"DATE RANGE / PERIOD","${dateRange.replace(/"/g, '""')}"`,
    `"PREPARED BY","${generatedBy.replace(/"/g, '""')}"`,
    `"GENERATED ON","${dateNowStr}"`,
    `"================================================================================"`,
    `""`,
  ];

  const tableHeader = columns.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',');
  const tableRows = rows.map((row) =>
    row
      .map((cell) => {
        const val = String(cell ?? '');
        return `"${val.replace(/"/g, '""')}"`;
      })
      .join(',')
  );

  const summarySection: string[] = [];
  if (options?.summaryCards && options.summaryCards.length > 0) {
    summarySection.push(
      `""`,
      `"--------------------------------------------------------------------------------"`,
      `"SUMMARY METRICS"`
    );
    options.summaryCards.forEach((sc) => {
      summarySection.push(`"${sc.label}","${sc.value}"`);
    });
    summarySection.push(
      `"--------------------------------------------------------------------------------"`
    );
  }

  const csvFullContent = [
    ...metaHeader,
    tableHeader,
    ...tableRows,
    ...summarySection,
  ].join('\n');

  const blob = new Blob([csvFullContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Basic CSV Exporter
 */
export function exportToCSV(
  rows: Record<string, string | number | null | undefined>[],
  filename: string
) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csvRows = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = row[h] ?? '';
          return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
        })
        .join(',')
    ),
  ];
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
