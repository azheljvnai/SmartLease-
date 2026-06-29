import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import * as XLSX from 'xlsx';
import { getCompanyBranding } from '../lib/company';
import { formatCurrency } from '../lib/format';
import type { PortfolioReportData } from '../types';
import { generatePortfolioSummaryPdf } from './portfolio-pdf.service';
import regularFontUrl from '../assets/fonts/NotoSans-Regular.ttf?url';
import boldFontUrl from '../assets/fonts/NotoSans-Bold.ttf?url';

export type ReportType =
  | 'revenue'
  | 'occupancy'
  | 'leases'
  | 'payments'
  | 'outstanding'
  | 'maintenance'
  | 'tenants'
  | 'summary';

export interface ReportExportPayload {
  title: string;
  generatedAt: string;
  kpis?: { label: string; value: string }[];
  headers: string[];
  rows: (string | number)[][];
  summary?: string;
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportReportToExcel(payload: ReportExportPayload, reportType: ReportType): void {
  const wb = XLSX.utils.book_new();

  if (payload.kpis?.length) {
    const kpiSheet = XLSX.utils.aoa_to_sheet([
      ['Key Performance Indicators'],
      ...payload.kpis.map((k) => [k.label, k.value]),
    ]);
    XLSX.utils.book_append_sheet(wb, kpiSheet, 'KPIs');
  }

  const dataSheet = XLSX.utils.aoa_to_sheet([payload.headers, ...payload.rows]);
  XLSX.utils.book_append_sheet(wb, dataSheet, 'Data');

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  downloadBlob(blob, `smartlease-${reportType}-report.xlsx`);
}

function wrapPdfText(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (test.length <= maxChars) current = test;
    else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [''];
}

export async function exportReportToPdf(payload: ReportExportPayload, reportType: ReportType): Promise<void> {
  const company = getCompanyBranding();
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const [regularBytes, boldBytes] = await Promise.all([
    fetch(regularFontUrl).then((r) => r.arrayBuffer()),
    fetch(boldFontUrl).then((r) => r.arrayBuffer()),
  ]);
  const font = await pdfDoc.embedFont(regularBytes);
  const bold = await pdfDoc.embedFont(boldBytes);

  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 50;
  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const brandColor = rgb(0.42, 0.3, 0.95);

  page.drawRectangle({ x: 0, y: pageHeight - 70, width: pageWidth, height: 70, color: brandColor });
  page.drawText(company.name, { x: margin, y: pageHeight - 40, size: 16, font: bold, color: rgb(1, 1, 1) });
  page.drawText(payload.title, { x: margin, y: pageHeight - 58, size: 10, font, color: rgb(0.92, 0.9, 1) });
  y = pageHeight - 90;

  page.drawText(`Generated: ${payload.generatedAt}`, { x: margin, y, size: 9, font, color: rgb(0.5, 0.5, 0.5) });
  y -= 24;

  if (payload.kpis?.length) {
    page.drawText('Summary', { x: margin, y, size: 12, font: bold, color: rgb(0.1, 0.1, 0.1) });
    y -= 16;
    for (const kpi of payload.kpis) {
      page.drawText(`${kpi.label}:`, { x: margin, y, size: 10, font, color: rgb(0.4, 0.4, 0.4) });
      page.drawText(kpi.value, { x: margin + 160, y, size: 10, font: bold, color: rgb(0.1, 0.1, 0.1) });
      y -= 14;
    }
    y -= 10;
  }

  const colCount = payload.headers.length;
  const colWidth = (pageWidth - margin * 2) / colCount;

  const drawTableHeader = () => {
    page.drawRectangle({ x: margin, y: y - 4, width: pageWidth - margin * 2, height: 18, color: rgb(0.95, 0.93, 1) });
    payload.headers.forEach((header, i) => {
      const text = header.length > 14 ? `${header.slice(0, 12)}…` : header;
      page.drawText(text, { x: margin + i * colWidth + 4, y, size: 8, font: bold, color: rgb(0.3, 0.3, 0.3) });
    });
    y -= 20;
  };

  drawTableHeader();

  for (const row of payload.rows) {
    if (y < margin + 30) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
      drawTableHeader();
    }
    row.forEach((cell, i) => {
      const text = String(cell).length > 18 ? `${String(cell).slice(0, 16)}…` : String(cell);
      page.drawText(text, { x: margin + i * colWidth + 4, y, size: 8, font, color: rgb(0.15, 0.15, 0.15) });
    });
    y -= 14;
  }

  if (payload.summary) {
    y -= 10;
    if (y < margin + 40) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }
    for (const line of wrapPdfText(payload.summary, 90)) {
      page.drawText(line, { x: margin, y, size: 9, font, color: rgb(0.4, 0.4, 0.4) });
      y -= 12;
    }
  }

  const bytes = await pdfDoc.save();
  const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
  downloadBlob(blob, `smartlease-${reportType}-report.pdf`);
}

export async function exportPortfolioSummaryPdf(data: PortfolioReportData): Promise<void> {
  const bytes = await generatePortfolioSummaryPdf(data);
  const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
  downloadBlob(blob, 'smartlease-portfolio-summary.pdf');
}

export function exportReportToCsv(payload: ReportExportPayload, reportType: ReportType): void {
  const csv = [payload.headers, ...payload.rows]
    .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  downloadBlob(blob, `smartlease-${reportType}-report.csv`);
}
