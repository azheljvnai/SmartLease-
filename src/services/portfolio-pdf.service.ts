import type { PortfolioReportData } from '../types';
import { formatCurrency } from '../lib/format';
import {
  addFootersToAllPages,
  CONTENT_WIDTH,
  createContext,
  createPdfDocument,
  drawBulletList,
  drawCoverHeader,
  drawKpiGrid,
  drawPageHeader,
  drawSectionTitle,
  ensureSpace,
  MARGIN,
  type KpiCard,
} from '../lib/pdf-layout';
import { drawBarChart, drawChartRow, drawDonutChart, drawLineChart } from '../lib/pdf-charts';
import { drawPropertyTable } from '../lib/pdf-table';

export async function generatePortfolioSummaryPdf(data: PortfolioReportData): Promise<Uint8Array> {
  const { pdfDoc, font, bold, companyName } = await createPdfDocument();
  const ctx = createContext(pdfDoc, font, bold, companyName);

  drawCoverHeader(ctx, data.title, data.reportingPeriod, data.generatedAt);

  drawSectionTitle(ctx, 'Executive Summary');
  const kpiCards: KpiCard[] = [
    { label: 'Total Revenue', value: formatCurrency(data.kpis.totalRevenue), accent: 'positive' },
    { label: 'Revenue This Month', value: formatCurrency(data.kpis.revenueThisMonth), accent: 'positive' },
    {
      label: 'Outstanding Balance',
      value: formatCurrency(data.kpis.outstandingBalance),
      accent: data.kpis.outstandingBalance > 0 ? 'negative' : 'neutral',
    },
    {
      label: 'Occupancy Rate',
      value: `${data.kpis.occupancyRate}%`,
      accent: data.kpis.occupancyRate >= 80 ? 'positive' : 'warning',
    },
    { label: 'Active Leases', value: String(data.kpis.activeLeases), accent: 'neutral' },
    {
      label: 'Vacant Units',
      value: String(data.kpis.vacantUnits),
      accent: data.kpis.vacantUnits > 0 ? 'warning' : 'positive',
    },
    {
      label: 'Open Maintenance',
      value: String(data.kpis.openMaintenance),
      accent: data.kpis.openMaintenance > 0 ? 'warning' : 'positive',
    },
  ];
  drawKpiGrid(ctx, kpiCards);

  ensureSpace(ctx, 200);
  ctx.page = ctx.pdfDoc.addPage([595.28, 841.89]);
  drawPageHeader(ctx);
  ctx.y = 841.89 - 56;

  drawSectionTitle(ctx, 'Visual Analytics');

  drawChartRow(ctx, [
    {
      draw: (x, topY, width) =>
        drawBarChart(ctx, x, topY, width, 'Revenue by Property', data.revenueByProperty, {
          formatValue: (v) => (v >= 1000 ? `₱${Math.round(v / 1000)}K` : `₱${v}`),
        }),
    },
    {
      draw: (x, topY, width) =>
        drawLineChart(
          ctx,
          x,
          topY,
          width,
          'Monthly Revenue Trend',
          data.monthlyRevenue.map((p) => ({ label: p.month, value: p.value })),
        ),
    },
  ]);

  ensureSpace(ctx, 180);
  drawChartRow(ctx, [
    {
      draw: (x, topY, width) =>
        drawBarChart(ctx, x, topY, width, 'Occupancy Rate per Property', data.occupancyByProperty, {
          maxValue: 100,
          valueSuffix: '%',
          formatValue: (v) => `${v}%`,
        }),
    },
    {
      draw: (x, topY, width) =>
        drawDonutChart(
          ctx,
          x,
          topY,
          width,
          'Occupancy Distribution',
          data.occupancyDistribution.map((s) => ({ name: s.name, value: s.value, color: s.color })),
        ),
    },
  ]);

  if (data.leaseStatus.length > 0 || data.maintenanceStatus.length > 0) {
    ensureSpace(ctx, 180);
    const charts: { draw: (x: number, topY: number, width: number) => number }[] = [];

    if (data.leaseStatus.length > 0) {
      charts.push({
        draw: (x, topY, width) =>
          drawDonutChart(
            ctx,
            x,
            topY,
            width,
            'Lease Status Distribution',
            data.leaseStatus.map((s) => ({ name: s.name, value: s.value, color: s.color })),
          ),
      });
    }

    if (data.maintenanceStatus.length > 0) {
      charts.push({
        draw: (x, topY, width) =>
          drawDonutChart(
            ctx,
            x,
            topY,
            width,
            'Maintenance Status Distribution',
            data.maintenanceStatus.map((s) => ({ name: s.name, value: s.value, color: s.color })),
          ),
      });
    }

    if (charts.length === 1) {
      const width = CONTENT_WIDTH;
      const bottom = charts[0].draw(MARGIN, ctx.y, width);
      ctx.y = bottom - 16;
    } else {
      drawChartRow(ctx, charts);
    }
  }

  ensureSpace(ctx, 80);
  if (ctx.y < 200) {
    ctx.page = ctx.pdfDoc.addPage([595.28, 841.89]);
    drawPageHeader(ctx);
    ctx.y = 841.89 - 56;
  }

  drawSectionTitle(ctx, 'Property Performance');
  drawPropertyTable(ctx, data.properties);

  ensureSpace(ctx, 60);
  if (ctx.y < 120) {
    ctx.page = ctx.pdfDoc.addPage([595.28, 841.89]);
    drawPageHeader(ctx);
    ctx.y = 841.89 - 56;
  }

  drawSectionTitle(ctx, 'Financial Insights');
  drawBulletList(ctx, data.insights);

  addFootersToAllPages(ctx);

  return pdfDoc.save();
}
