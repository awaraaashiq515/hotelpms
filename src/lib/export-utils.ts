/**
 * OrderMint POS — Export Utilities
 * Universal Excel (XLSX) + PDF export for all report pages.
 */

import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─── Brand color for PDF headers ──────────────────────────────
const POS_RED: [number, number, number] = [220, 38, 38];
const POS_DARK: [number, number, number] = [15, 23, 42];

/**
 * Export data as an Excel (.xlsx) file.
 * @param rows         Array of flat objects (each key becomes a column)
 * @param filename     File name WITHOUT extension
 * @param sheetName    Name of the Excel sheet tab
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

function sanitizePDFString(str: string | number): string {
  if (str === null || str === undefined) return '';
  const s = String(str);
  return s
    .replace(/₹/g, 'Rs.')
    .replace(/→/g, 'to')
    .replace(/➔/g, 'to')
    .replace(/—/g, '-');
}

/**
 * Export a table as a PDF file.
 * @param columns   Column header labels array
 * @param rows      2D array — each inner array is one table row
 * @param filename  File name WITHOUT extension
 * @param title     Big title shown at top of the PDF
 * @param subtitle  Smaller subtitle (e.g. date range)
 */
export function exportToPDF(
  columns: string[],
  rows: (string | number)[][],
  filename: string,
  title: string,
  subtitle?: string
) {
  const doc = new jsPDF({ orientation: 'landscape' });

  // Sanitize all inputs to prevent character encoding issues (like ₹ showing as ' or !)
  const cleanTitle = sanitizePDFString(title);
  const cleanSubtitle = subtitle ? sanitizePDFString(subtitle) : undefined;
  const cleanColumns = columns.map(c => sanitizePDFString(c));
  const cleanRows = rows.map(r => r.map(cell => sanitizePDFString(cell)));

  // Header bar
  doc.setFillColor(...POS_RED);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 18, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('OrderMint POS', 14, 12);

  // Title
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

/**
 * Export data as a CSV file (plain text, lightest option).
 */
export function exportToCSV(
  rows: Record<string, string | number | null | undefined>[],
  filename: string
) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csvRows = [
    headers.join(','),
    ...rows.map(row =>
      headers.map(h => {
        const val = row[h] ?? '';
        return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
      }).join(',')
    )
  ];
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
