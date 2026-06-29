import { rgb } from 'pdf-lib';
import { formatCurrency } from './format';
import {
  BRAND,
  BRAND_LIGHT,
  BORDER,
  CONTENT_WIDTH,
  FOOTER_HEIGHT,
  MARGIN,
  PAGE_HEIGHT,
  ROW_ALT,
  SUCCESS,
  TEXT_MUTED,
  TEXT_PRIMARY,
  truncateText,
  ensureSpace,
  drawPageHeader,
  type PdfContext,
} from './pdf-layout';
import type { PortfolioPropertyRow } from '../types';

const ROW_HEIGHT = 16;
const HEADER_HEIGHT = 20;

const COLUMNS: {
  key: keyof PortfolioPropertyRow | 'status';
  header: string;
  width: number;
  align: 'left' | 'right';
  format?: (row: PortfolioPropertyRow) => string;
}[] = [
  { key: 'name', header: 'Property', width: 88, align: 'left' },
  { key: 'totalUnits', header: 'Units', width: 32, align: 'right', format: (r) => String(r.totalUnits) },
  { key: 'occupied', header: 'Occ.', width: 32, align: 'right', format: (r) => String(r.occupied) },
  { key: 'vacant', header: 'Vac.', width: 32, align: 'right', format: (r) => String(r.vacant) },
  {
    key: 'occupancyRate',
    header: 'Occ. %',
    width: 38,
    align: 'right',
    format: (r) => `${r.occupancyRate}%`,
  },
  { key: 'revenue', header: 'Revenue', width: 62, align: 'right', format: (r) => formatCurrency(r.revenue) },
  {
    key: 'outstandingBalance',
    header: 'Outstanding',
    width: 68,
    align: 'right',
    format: (r) => formatCurrency(r.outstandingBalance),
  },
  {
    key: 'openMaintenance',
    header: 'Maint.',
    width: 36,
    align: 'right',
    format: (r) => String(r.openMaintenance),
  },
  { key: 'status', header: 'Status', width: 44, align: 'left', format: (r) => r.status },
];

function drawTableHeader(ctx: PdfContext): void {
  ctx.page.drawRectangle({
    x: MARGIN,
    y: ctx.y - 4,
    width: CONTENT_WIDTH,
    height: HEADER_HEIGHT,
    color: BRAND_LIGHT,
  });

  let x = MARGIN + 4;
  for (const col of COLUMNS) {
    const text = truncateText(col.header, ctx.bold, 7, col.width - 4);
    const textW = ctx.bold.widthOfTextAtSize(text, 7);
    const tx = col.align === 'right' ? x + col.width - textW - 4 : x;
    ctx.page.drawText(text, { x: tx, y: ctx.y, size: 7, font: ctx.bold, color: TEXT_MUTED });
    x += col.width;
  }
  ctx.y -= HEADER_HEIGHT + 2;
}

function drawTableRow(ctx: PdfContext, row: PortfolioPropertyRow, alt: boolean): void {
  if (alt) {
    ctx.page.drawRectangle({
      x: MARGIN,
      y: ctx.y - 3,
      width: CONTENT_WIDTH,
      height: ROW_HEIGHT,
      color: ROW_ALT,
    });
  }

  let x = MARGIN + 4;
  for (const col of COLUMNS) {
    const raw = col.format ? col.format(row) : String(row[col.key as keyof PortfolioPropertyRow] ?? '');
    const text = truncateText(raw, ctx.font, 7, col.width - 4);
    const textW = ctx.font.widthOfTextAtSize(text, 7);
    const tx = col.align === 'right' ? x + col.width - textW - 4 : x;

    let color = TEXT_PRIMARY;
    if (col.key === 'status') {
      color = row.status === 'active' ? SUCCESS : TEXT_MUTED;
    } else if (col.key === 'outstandingBalance' && row.outstandingBalance > 0) {
      color = rgb(0.8, 0.2, 0.2);
    }

    ctx.page.drawText(text, { x: tx, y: ctx.y, size: 7, font: ctx.font, color });
    x += col.width;
  }
  ctx.y -= ROW_HEIGHT;
}

export function drawPropertyTable(ctx: PdfContext, properties: PortfolioPropertyRow[]): void {
  const minY = MARGIN + FOOTER_HEIGHT + HEADER_HEIGHT + ROW_HEIGHT + 10;

  const ensureTableSpace = (rowsNeeded: number) => {
    if (ctx.y < minY + rowsNeeded * ROW_HEIGHT) {
      ctx.page = ctx.pdfDoc.addPage([595.28, PAGE_HEIGHT]);
      drawPageHeader(ctx);
      drawTableHeader(ctx);
    }
  };

  drawTableHeader(ctx);

  if (properties.length === 0) {
    ensureSpace(ctx, ROW_HEIGHT + 10);
    ctx.page.drawText('—', { x: MARGIN + 4, y: ctx.y, size: 8, font: ctx.font, color: TEXT_MUTED });
    ctx.y -= ROW_HEIGHT;
    return;
  }

  properties.forEach((row, i) => {
    ensureTableSpace(1);
    drawTableRow(ctx, row, i % 2 === 1);
  });

  ctx.y -= 8;
}
