import { PDFDocument, rgb, type PDFFont, type PDFPage, type RGB } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { getCompanyBranding } from './company';
import regularFontUrl from '../assets/fonts/NotoSans-Regular.ttf?url';
import boldFontUrl from '../assets/fonts/NotoSans-Bold.ttf?url';

export const PAGE_WIDTH = 595.28;
export const PAGE_HEIGHT = 841.89;
export const MARGIN = 40;
export const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
export const FOOTER_HEIGHT = 28;
export const LINE_HEIGHT = 14;

export const BRAND = rgb(0.424, 0.302, 0.945); // #6C4CF1
export const BRAND_LIGHT = rgb(0.95, 0.93, 1);
export const TEXT_PRIMARY = rgb(0.1, 0.1, 0.1);
export const TEXT_MUTED = rgb(0.42, 0.45, 0.5);
export const TEXT_LIGHT = rgb(0.92, 0.9, 1);
export const SUCCESS = rgb(0.063, 0.725, 0.506); // #10B981
export const WARNING = rgb(0.961, 0.62, 0.043); // #F59E0B
export const DANGER = rgb(0.937, 0.267, 0.267); // #EF4444
export const ROW_ALT = rgb(0.976, 0.98, 0.984); // #F9FAFB
export const BORDER = rgb(0.898, 0.906, 0.914);

export type KpiAccent = 'positive' | 'warning' | 'negative' | 'neutral';

export interface PdfContext {
  pdfDoc: PDFDocument;
  font: PDFFont;
  bold: PDFFont;
  page: PDFPage;
  y: number;
  companyName: string;
}

export function hexToRgb(hex: string): RGB {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return rgb(r, g, b);
}

export async function createPdfDocument(): Promise<{
  pdfDoc: PDFDocument;
  font: PDFFont;
  bold: PDFFont;
  companyName: string;
}> {
  const company = getCompanyBranding();
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const [regularBytes, boldBytes] = await Promise.all([
    fetch(regularFontUrl).then((r) => r.arrayBuffer()),
    fetch(boldFontUrl).then((r) => r.arrayBuffer()),
  ]);
  const font = await pdfDoc.embedFont(regularBytes);
  const bold = await pdfDoc.embedFont(boldBytes);

  return { pdfDoc, font, bold, companyName: company.name };
}

export function createContext(
  pdfDoc: PDFDocument,
  font: PDFFont,
  bold: PDFFont,
  companyName: string,
): PdfContext {
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  return { pdfDoc, font, bold, page, y: PAGE_HEIGHT - MARGIN, companyName };
}

export function ensureSpace(ctx: PdfContext, needed: number, withHeader = false): void {
  const minY = MARGIN + FOOTER_HEIGHT + (withHeader ? 50 : 0);
  if (ctx.y < minY + needed) {
    ctx.page = ctx.pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    ctx.y = PAGE_HEIGHT - MARGIN;
    if (withHeader) {
      drawPageHeader(ctx);
    }
  }
}

export function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
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

export function truncateText(text: string, font: PDFFont, size: number, maxWidth: number): string {
  if (font.widthOfTextAtSize(text, size) <= maxWidth) return text;
  let truncated = text;
  while (truncated.length > 1 && font.widthOfTextAtSize(`${truncated}…`, size) > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return `${truncated}…`;
}

export function drawProgrammaticLogo(ctx: PdfContext, x: number, y: number): void {
  const size = 36;
  ctx.page.drawRectangle({ x, y: y - size, width: size, height: size, color: rgb(1, 1, 1), borderWidth: 0 });
  ctx.page.drawRectangle({ x: x + 2, y: y - size + 2, width: size - 4, height: size - 4, color: BRAND });
  ctx.page.drawText('SL', {
    x: x + 7,
    y: y - size + 11,
    size: 14,
    font: ctx.bold,
    color: rgb(1, 1, 1),
  });
}

export function drawCoverHeader(
  ctx: PdfContext,
  title: string,
  reportingPeriod: string,
  generatedAt: string,
): void {
  const headerHeight = 100;
  ctx.page.drawRectangle({ x: 0, y: PAGE_HEIGHT - headerHeight, width: PAGE_WIDTH, height: headerHeight, color: BRAND });

  drawProgrammaticLogo(ctx, MARGIN, PAGE_HEIGHT - 30);

  ctx.page.drawText('SmartLease', {
    x: MARGIN + 46,
    y: PAGE_HEIGHT - 38,
    size: 11,
    font: ctx.bold,
    color: TEXT_LIGHT,
  });

  ctx.page.drawText(ctx.companyName, {
    x: MARGIN + 46,
    y: PAGE_HEIGHT - 52,
    size: 8,
    font: ctx.font,
    color: rgb(0.85, 0.82, 1),
  });

  ctx.page.drawText(title, {
    x: MARGIN,
    y: PAGE_HEIGHT - 72,
    size: 16,
    font: ctx.bold,
    color: rgb(1, 1, 1),
  });

  const metaX = PAGE_WIDTH - MARGIN - 160;
  ctx.page.drawText('Reporting Period', {
    x: metaX,
    y: PAGE_HEIGHT - 38,
    size: 8,
    font: ctx.font,
    color: TEXT_LIGHT,
  });
  ctx.page.drawText(reportingPeriod, {
    x: metaX,
    y: PAGE_HEIGHT - 50,
    size: 9,
    font: ctx.bold,
    color: rgb(1, 1, 1),
  });
  ctx.page.drawText('Generated', {
    x: metaX,
    y: PAGE_HEIGHT - 66,
    size: 8,
    font: ctx.font,
    color: TEXT_LIGHT,
  });
  ctx.page.drawText(generatedAt, {
    x: metaX,
    y: PAGE_HEIGHT - 78,
    size: 8,
    font: ctx.font,
    color: rgb(1, 1, 1),
  });

  ctx.y = PAGE_HEIGHT - headerHeight - 20;
}

export function drawPageHeader(ctx: PdfContext): void {
  const headerHeight = 36;
  ctx.page.drawRectangle({ x: 0, y: PAGE_HEIGHT - headerHeight, width: PAGE_WIDTH, height: headerHeight, color: BRAND });
  ctx.page.drawText('Portfolio Summary Report', {
    x: MARGIN,
    y: PAGE_HEIGHT - 24,
    size: 10,
    font: ctx.bold,
    color: rgb(1, 1, 1),
  });
  ctx.y = PAGE_HEIGHT - headerHeight - 16;
}

export function drawSectionTitle(ctx: PdfContext, title: string): void {
  ensureSpace(ctx, 30);
  ctx.page.drawText(title, { x: MARGIN, y: ctx.y, size: 13, font: ctx.bold, color: TEXT_PRIMARY });
  ctx.y -= 6;
  ctx.page.drawLine({
    start: { x: MARGIN, y: ctx.y },
    end: { x: PAGE_WIDTH - MARGIN, y: ctx.y },
    thickness: 1.5,
    color: BRAND,
  });
  ctx.y -= 18;
}

function accentColor(accent: KpiAccent): RGB {
  switch (accent) {
    case 'positive':
      return SUCCESS;
    case 'warning':
      return WARNING;
    case 'negative':
      return DANGER;
    default:
      return BRAND;
  }
}

export interface KpiCard {
  label: string;
  value: string;
  accent?: KpiAccent;
}

export function drawKpiGrid(ctx: PdfContext, cards: KpiCard[]): void {
  const cols = 4;
  const gap = 10;
  const cardW = (CONTENT_WIDTH - gap * (cols - 1)) / cols;
  const cardH = 52;
  const totalRows = Math.ceil(cards.length / cols);

  ensureSpace(ctx, totalRows * (cardH + gap) + 10);

  const startY = ctx.y;

  for (let i = 0; i < cards.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = MARGIN + col * (cardW + gap);
    const y = startY - row * (cardH + gap) - cardH;
    const card = cards[i];
    const accent = accentColor(card.accent ?? 'neutral');

    ctx.page.drawRectangle({
      x,
      y,
      width: cardW,
      height: cardH,
      color: BRAND_LIGHT,
      borderColor: BORDER,
      borderWidth: 0.5,
    });
    ctx.page.drawRectangle({ x, y, width: 3, height: cardH, color: accent });

    ctx.page.drawText(card.label, {
      x: x + 10,
      y: y + cardH - 16,
      size: 8,
      font: ctx.font,
      color: TEXT_MUTED,
    });
    ctx.page.drawText(truncateText(card.value, ctx.bold, 13, cardW - 16), {
      x: x + 10,
      y: y + cardH - 34,
      size: 13,
      font: ctx.bold,
      color: TEXT_PRIMARY,
    });
  }

  ctx.y = startY - totalRows * (cardH + gap) - 10;
}

export function drawBulletList(ctx: PdfContext, items: string[]): void {
  for (const item of items) {
    const lines = wrapText(item, ctx.font, 9, CONTENT_WIDTH - 16);
    ensureSpace(ctx, lines.length * 13 + 4);
    for (let i = 0; i < lines.length; i++) {
      if (i === 0) {
        ctx.page.drawText('•', { x: MARGIN, y: ctx.y, size: 10, font: ctx.bold, color: BRAND });
      }
      ctx.page.drawText(lines[i], { x: MARGIN + 14, y: ctx.y, size: 9, font: ctx.font, color: TEXT_PRIMARY });
      ctx.y -= 13;
    }
    ctx.y -= 4;
  }
}

export function addFootersToAllPages(ctx: PdfContext): void {
  const pages = ctx.pdfDoc.getPages();
  const total = pages.length;
  pages.forEach((page, index) => {
    const pageNum = index + 1;
    page.drawLine({
      start: { x: MARGIN, y: MARGIN + FOOTER_HEIGHT - 6 },
      end: { x: PAGE_WIDTH - MARGIN, y: MARGIN + FOOTER_HEIGHT - 6 },
      thickness: 0.5,
      color: BORDER,
    });
    page.drawText(ctx.companyName, {
      x: MARGIN,
      y: MARGIN + 6,
      size: 7,
      font: ctx.font,
      color: TEXT_MUTED,
    });
    const pageText = `Page ${pageNum} of ${total}`;
    const textWidth = ctx.font.widthOfTextAtSize(pageText, 7);
    page.drawText(pageText, {
      x: PAGE_WIDTH - MARGIN - textWidth,
      y: MARGIN + 6,
      size: 7,
      font: ctx.font,
      color: TEXT_MUTED,
    });
  });
}
