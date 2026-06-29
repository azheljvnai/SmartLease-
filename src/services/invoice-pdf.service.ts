import { PDFDocument, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import type { Invoice, Tenant } from '../types';
import { formatCurrencyForPdf, formatDate } from '../lib/format';
import { loadPdfFonts, sanitizePdfText } from '../lib/pdf-fonts';
import { getCompanyBranding } from '../lib/company';

const MARGIN = 50;
const LINE_HEIGHT = 14;
const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const BRAND_COLOR = rgb(0.42, 0.3, 0.95);

export interface InvoicePdfContext {
  invoice: Invoice;
  tenant: Tenant;
  propertyName: string;
  propertyAddress: string;
}

type DrawContext = {
  pdfDoc: PDFDocument;
  font: PDFFont;
  bold: PDFFont;
  page: PDFPage;
  y: number;
};

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(test, size) <= maxWidth) {
      current = test;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [''];
}

export async function generateInvoicePdf(ctx: InvoicePdfContext): Promise<Uint8Array> {
  const { invoice, tenant, propertyName, propertyAddress } = ctx;
  const company = getCompanyBranding();
  const generatedAt = new Date();

  const pdfDoc = await PDFDocument.create();
  const { font, bold, compact } = await loadPdfFonts(pdfDoc);
  const money = (amount: number) => formatCurrencyForPdf(amount, compact);

  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  const drawCtx: DrawContext = { pdfDoc, font, bold, page, y };

  const ensureSpace = (needed: number) => {
    if (drawCtx.y < MARGIN + needed) {
      drawCtx.page = drawCtx.pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      drawCtx.y = PAGE_HEIGHT - MARGIN;
    }
  };

  const drawText = (
    text: string,
    opts: { size?: number; bold?: boolean; indent?: number; color?: ReturnType<typeof rgb> } = {},
  ) => {
    const size = opts.size ?? 10;
    const usedFont = opts.bold ? bold : font;
    const indent = opts.indent ?? 0;
    const color = opts.color ?? rgb(0.1, 0.1, 0.1);
    const lines = wrapText(sanitizePdfText(text, compact), usedFont, size, CONTENT_WIDTH - indent);

    for (const line of lines) {
      ensureSpace(size + 4);
      drawCtx.page.drawText(line, {
        x: MARGIN + indent,
        y: drawCtx.y,
        size,
        font: usedFont,
        color,
      });
      drawCtx.y -= LINE_HEIGHT;
    }
  };

  const blank = (n = 1) => {
    drawCtx.y -= LINE_HEIGHT * n;
  };

  const drawRow = (label: string, value: string, valueBold = false) => {
    ensureSpace(16);
    drawCtx.page.drawText(label, { x: MARGIN, y: drawCtx.y, size: 10, font, color: rgb(0.4, 0.4, 0.4) });
    drawCtx.page.drawText(value, {
      x: MARGIN + 180,
      y: drawCtx.y,
      size: 10,
      font: valueBold ? bold : font,
      color: rgb(0.1, 0.1, 0.1),
    });
    drawCtx.y -= LINE_HEIGHT;
  };

  // Header bar
  drawCtx.page.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - 80,
    width: PAGE_WIDTH,
    height: 80,
    color: BRAND_COLOR,
  });
  drawCtx.page.drawText(company.name, {
    x: MARGIN,
    y: PAGE_HEIGHT - 45,
    size: 18,
    font: bold,
    color: rgb(1, 1, 1),
  });
  drawCtx.page.drawText('BILLING STATEMENT / INVOICE', {
    x: MARGIN,
    y: PAGE_HEIGHT - 65,
    size: 10,
    font,
    color: rgb(0.92, 0.9, 1),
  });
  drawCtx.y = PAGE_HEIGHT - 110;

  // Invoice meta (right-aligned block via manual positioning)
  const metaX = PAGE_WIDTH - MARGIN - 150;
  const metaY = PAGE_HEIGHT - 110;
  const metaLines = [
    ['Invoice #', invoice.invoiceNumber],
    ['Date', formatDate(generatedAt)],
    ['Due Date', formatDate(invoice.dueDate)],
    ['Status', invoice.status.toUpperCase()],
  ];
  metaLines.forEach(([label, value], i) => {
    drawCtx.page.drawText(`${label}:`, { x: metaX, y: metaY - i * 14, size: 9, font, color: rgb(0.4, 0.4, 0.4) });
    drawCtx.page.drawText(value, { x: metaX + 70, y: metaY - i * 14, size: 9, font: bold, color: rgb(0.1, 0.1, 0.1) });
  });

  blank(2);
  drawText('Bill To', { size: 11, bold: true });
  drawText(tenant.name, { bold: true });
  drawText(tenant.email);
  if (tenant.phone) drawText(tenant.phone);
  blank();

  drawText('Property', { size: 11, bold: true });
  drawText(propertyName, { bold: true });
  if (propertyAddress) drawText(propertyAddress);
  drawText(`Unit: ${invoice.unitLabel}`);
  blank();

  if (invoice.billingPeriodStart && invoice.billingPeriodEnd) {
    drawRow('Billing Period', `${formatDate(invoice.billingPeriodStart)} – ${formatDate(invoice.billingPeriodEnd)}`);
  }

  blank();
  drawText('Charges', { size: 12, bold: true, color: BRAND_COLOR });
  blank(0.5);

  // Table header
  ensureSpace(20);
  drawCtx.page.drawRectangle({
    x: MARGIN,
    y: drawCtx.y - 4,
    width: CONTENT_WIDTH,
    height: 18,
    color: rgb(0.95, 0.93, 1),
  });
  drawCtx.page.drawText('Description', { x: MARGIN + 8, y: drawCtx.y, size: 9, font: bold, color: rgb(0.3, 0.3, 0.3) });
  drawCtx.page.drawText('Amount', {
    x: PAGE_WIDTH - MARGIN - 70,
    y: drawCtx.y,
    size: 9,
    font: bold,
    color: rgb(0.3, 0.3, 0.3),
  });
  drawCtx.y -= 20;

  const periodLabel =
    invoice.billingPeriodStart && invoice.billingPeriodEnd
      ? `Monthly Rent (${formatDate(invoice.billingPeriodStart)} – ${formatDate(invoice.billingPeriodEnd)})`
      : 'Monthly Rent';

  ensureSpace(16);
  drawCtx.page.drawText(periodLabel, { x: MARGIN + 8, y: drawCtx.y, size: 10, font });
  drawCtx.page.drawText(money(invoice.amount), {
    x: PAGE_WIDTH - MARGIN - 70,
    y: drawCtx.y,
    size: 10,
    font,
  });
  drawCtx.y -= LINE_HEIGHT;

  if (invoice.lateFee && invoice.lateFee > 0) {
    ensureSpace(16);
    drawCtx.page.drawText('Late Payment Penalty', { x: MARGIN + 8, y: drawCtx.y, size: 10, font });
    drawCtx.page.drawText(money(invoice.lateFee), {
      x: PAGE_WIDTH - MARGIN - 70,
      y: drawCtx.y,
      size: 10,
      font,
    });
    drawCtx.y -= LINE_HEIGHT;
  }

  const totalDue = invoice.amount + (invoice.lateFee ?? 0);
  blank();
  ensureSpace(24);
  drawCtx.page.drawLine({
    start: { x: MARGIN, y: drawCtx.y },
    end: { x: PAGE_WIDTH - MARGIN, y: drawCtx.y },
    thickness: 1,
    color: rgb(0.85, 0.85, 0.85),
  });
  drawCtx.y -= 16;
  drawCtx.page.drawText('Total Amount Due', { x: MARGIN + 8, y: drawCtx.y, size: 12, font: bold });
  drawCtx.page.drawText(money(totalDue), {
    x: PAGE_WIDTH - MARGIN - 70,
    y: drawCtx.y,
    size: 12,
    font: bold,
    color: BRAND_COLOR,
  });
  drawCtx.y -= LINE_HEIGHT * 2;

  if (invoice.status === 'paid' && invoice.paidDate) {
    drawRow('Payment Received', formatDate(invoice.paidDate));
    if (invoice.method) drawRow('Payment Method', invoice.method);
    blank();
  }

  blank();
  drawText('Payment Instructions', { size: 11, bold: true, color: BRAND_COLOR });
  drawText(company.paymentInstructions);
  blank();

  if (company.address || company.phone || company.email) {
    drawText('Contact', { size: 11, bold: true });
    if (company.address) drawText(company.address);
    if (company.phone) drawText(`Phone: ${company.phone}`);
    if (company.email) drawText(`Email: ${company.email}`);
    blank();
  }

  if (invoice.notes) {
    drawText('Notes', { size: 11, bold: true });
    drawText(invoice.notes);
    blank();
  }

  drawText(
    `Reference invoice number ${invoice.invoiceNumber} when making payment. Generated ${formatDate(generatedAt)}.`,
    { size: 8, color: rgb(0.5, 0.5, 0.5) },
  );

  return pdfDoc.save({ useObjectStreams: true });
}
