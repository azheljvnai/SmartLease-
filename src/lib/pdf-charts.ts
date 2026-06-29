import { rgb } from 'pdf-lib';
import { formatCurrencyCompact } from './format';
import {
  BRAND,
  BORDER,
  CONTENT_WIDTH,
  MARGIN,
  TEXT_MUTED,
  TEXT_PRIMARY,
  truncateText,
  hexToRgb,
  type PdfContext,
} from './pdf-layout';

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface DonutSegment {
  name: string;
  value: number;
  color: string;
}

const CHART_HEIGHT = 155;
const CHART_GAP = 16;
const CHART_WIDTH = (CONTENT_WIDTH - CHART_GAP) / 2;

function drawChartTitle(ctx: PdfContext, title: string, x: number, y: number, width: number): number {
  ctx.page.drawText(truncateText(title, ctx.bold, 9, width), {
    x,
    y,
    size: 9,
    font: ctx.bold,
    color: TEXT_PRIMARY,
  });
  return y - 14;
}

function drawEmptyChart(ctx: PdfContext, x: number, y: number, width: number, height: number): void {
  ctx.page.drawRectangle({
    x,
    y: y - height,
    width,
    height,
    color: rgb(0.98, 0.98, 0.99),
    borderColor: BORDER,
    borderWidth: 0.5,
  });
  const msg = 'No data available';
  const msgW = ctx.font.widthOfTextAtSize(msg, 8);
  ctx.page.drawText(msg, {
    x: x + (width - msgW) / 2,
    y: y - height / 2,
    size: 8,
    font: ctx.font,
    color: TEXT_MUTED,
  });
}

export function drawBarChart(
  ctx: PdfContext,
  x: number,
  topY: number,
  width: number,
  title: string,
  data: ChartDataPoint[],
  options: { maxValue?: number; valueSuffix?: string; formatValue?: (v: number) => string } = {},
): number {
  let y = drawChartTitle(ctx, title, x, topY, width);
  const plotH = CHART_HEIGHT - 30;
  const plotY = y - plotH;

  if (data.length === 0) {
    drawEmptyChart(ctx, x, y, width, plotH);
    return plotY - 8;
  }

  const maxVal = options.maxValue ?? Math.max(...data.map((d) => d.value), 1);
  const barGap = 4;
  const barW = Math.min(28, (width - 20 - barGap * (data.length - 1)) / data.length);
  const totalBarsW = data.length * barW + (data.length - 1) * barGap;
  const startX = x + (width - totalBarsW) / 2;

  ctx.page.drawRectangle({
    x,
    y: plotY,
    width,
    height: plotH,
    color: rgb(0.99, 0.99, 1),
    borderColor: BORDER,
    borderWidth: 0.5,
  });

  // Grid lines
  for (let i = 0; i <= 4; i++) {
    const gy = plotY + (plotH * i) / 4;
    ctx.page.drawLine({
      start: { x: x + 4, y: gy },
      end: { x: x + width - 4, y: gy },
      thickness: 0.3,
      color: BORDER,
    });
  }

  data.forEach((d, i) => {
    const barH = maxVal > 0 ? (d.value / maxVal) * (plotH - 16) : 0;
    const bx = startX + i * (barW + barGap);
    const color = d.color ? hexToRgb(d.color) : BRAND;
    ctx.page.drawRectangle({
      x: bx,
      y: plotY + 8,
      width: barW,
      height: barH,
      color,
    });

    const label = truncateText(d.label, ctx.font, 6, barW + 8);
    const labelW = ctx.font.widthOfTextAtSize(label, 6);
    ctx.page.drawText(label, {
      x: bx + (barW - labelW) / 2,
      y: plotY - 2,
      size: 6,
      font: ctx.font,
      color: TEXT_MUTED,
    });
  });

  const formatVal = options.formatValue ?? ((v: number) => formatCurrencyCompact(v));
  const topLabel = formatVal(maxVal) + (options.valueSuffix ?? '');
  ctx.page.drawText(topLabel, { x: x + 4, y: plotY + plotH - 8, size: 6, font: ctx.font, color: TEXT_MUTED });

  return plotY - 8;
}

export function drawLineChart(
  ctx: PdfContext,
  x: number,
  topY: number,
  width: number,
  title: string,
  data: { label: string; value: number }[],
): number {
  let y = drawChartTitle(ctx, title, x, topY, width);
  const plotH = CHART_HEIGHT - 30;
  const plotY = y - plotH;

  if (data.length === 0) {
    drawEmptyChart(ctx, x, y, width, plotH);
    return plotY - 8;
  }

  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const padX = 12;
  const plotW = width - padX * 2;

  ctx.page.drawRectangle({
    x,
    y: plotY,
    width,
    height: plotH,
    color: rgb(0.99, 0.99, 1),
    borderColor: BORDER,
    borderWidth: 0.5,
  });

  for (let i = 0; i <= 4; i++) {
    const gy = plotY + (plotH * i) / 4;
    ctx.page.drawLine({
      start: { x: x + padX, y: gy },
      end: { x: x + width - padX, y: gy },
      thickness: 0.3,
      color: BORDER,
    });
  }

  const points = data.map((d, i) => {
    const px = x + padX + (data.length === 1 ? plotW / 2 : (plotW * i) / (data.length - 1));
    const py = plotY + 8 + ((plotH - 24) * d.value) / maxVal;
    return { px, py, label: d.label };
  });

  for (let i = 1; i < points.length; i++) {
    ctx.page.drawLine({
      start: { x: points[i - 1].px, y: points[i - 1].py },
      end: { x: points[i].px, y: points[i].py },
      thickness: 2,
      color: BRAND,
    });
  }

  points.forEach((p, i) => {
    ctx.page.drawCircle({ x: p.px, y: p.py, size: 3, color: BRAND, borderColor: rgb(1, 1, 1), borderWidth: 1 });
    if (i % 2 === 0 || data.length <= 4) {
      const lbl = truncateText(p.label, ctx.font, 5, 36);
      const lw = ctx.font.widthOfTextAtSize(lbl, 5);
      ctx.page.drawText(lbl, { x: p.px - lw / 2, y: plotY - 2, size: 5, font: ctx.font, color: TEXT_MUTED });
    }
  });

  return plotY - 8;
}

export function drawDonutChart(
  ctx: PdfContext,
  x: number,
  topY: number,
  width: number,
  title: string,
  segments: DonutSegment[],
): number {
  let y = drawChartTitle(ctx, title, x, topY, width);
  const plotH = CHART_HEIGHT - 30;
  const plotY = y - plotH;
  const total = segments.reduce((s, seg) => s + seg.value, 0);

  if (total === 0 || segments.length === 0) {
    drawEmptyChart(ctx, x, y, width, plotH);
    return plotY - 8;
  }

  ctx.page.drawRectangle({
    x,
    y: plotY,
    width,
    height: plotH,
    color: rgb(0.99, 0.99, 1),
    borderColor: BORDER,
    borderWidth: 0.5,
  });

  const cx = x + width * 0.36;
  const cy = plotY + plotH / 2;
  const outerR = Math.min(40, plotH / 2 - 12);
  const innerR = outerR * 0.58;

  let angle = -Math.PI / 2;
  segments.forEach((seg) => {
    const slice = (seg.value / total) * Math.PI * 2;
    const color = hexToRgb(seg.color);
    const steps = Math.max(16, Math.ceil(slice / 0.08));
    for (let s = 0; s < steps; s++) {
      const a = angle + (slice * s) / steps;
      const x1 = cx + innerR * Math.cos(a);
      const y1 = cy + innerR * Math.sin(a);
      const x2 = cx + outerR * Math.cos(a);
      const y2 = cy + outerR * Math.sin(a);
      ctx.page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness: 2.5, color });
    }
    angle += slice;
  });

  const topSeg = [...segments].sort((a, b) => b.value - a.value)[0];
  const centerLabel = topSeg ? `${Math.round((topSeg.value / total) * 100)}%` : '';
  const cw = ctx.bold.widthOfTextAtSize(centerLabel, 9);
  ctx.page.drawText(centerLabel, { x: cx - cw / 2, y: cy - 4, size: 9, font: ctx.bold, color: TEXT_PRIMARY });

  let ly = plotY + plotH - 12;
  const lx = x + width * 0.6;
  segments.forEach((seg) => {
    ctx.page.drawRectangle({ x: lx, y: ly - 6, width: 8, height: 8, color: hexToRgb(seg.color) });
    const pct = Math.round((seg.value / total) * 100);
    const text = `${seg.name} (${seg.value}, ${pct}%)`;
    ctx.page.drawText(truncateText(text, ctx.font, 7, width * 0.38), {
      x: lx + 12,
      y: ly - 5,
      size: 7,
      font: ctx.font,
      color: TEXT_PRIMARY,
    });
    ly -= 14;
  });

  return plotY - 8;
}

export function drawChartRow(
  ctx: PdfContext,
  charts: { draw: (x: number, topY: number, width: number) => number }[],
): void {
  const topY = ctx.y;
  let minBottom = topY;

  charts.forEach((chart, i) => {
    const x = MARGIN + i * (CHART_WIDTH + CHART_GAP);
    const bottom = chart.draw(x, topY, CHART_WIDTH);
    minBottom = Math.min(minBottom, bottom);
  });

  ctx.y = minBottom - 16;
}

export { CHART_HEIGHT, CHART_WIDTH, CHART_GAP };
