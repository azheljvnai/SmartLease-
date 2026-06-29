import type { MaintenanceRequest } from '../types';
import {
  exportReportToExcel,
  exportReportToPdf,
  type ReportExportPayload,
} from './report-export.service';
import { formatCurrency, formatDate } from '../lib/format';
import {
  maintenancePriorityLabel,
  maintenanceStatusLabel,
  normalizeMaintenanceStatus,
} from '../lib/maintenance-labels';
import { computeTotalCost, formatRequestId } from '../lib/maintenance-utils';
import { getResolutionDays, listMaintenanceRequests } from './maintenance.service';
import { getTechnicianPerformance } from './maintenance-analytics.service';

export type MaintenanceReportKind =
  | 'summary'
  | 'technician_performance'
  | 'costs'
  | 'property_history'
  | 'monthly'
  | 'outstanding';

function baseRow(r: MaintenanceRequest): (string | number)[] {
  return [
    formatRequestId(r),
    r.issue,
    r.propertyName ?? r.propertyId,
    r.unitLabel,
    r.tenantName,
    r.category,
    maintenancePriorityLabel(r.priority),
    maintenanceStatusLabel(r.status),
    r.assignedTo ?? 'Unassigned',
    formatDate(r.submitted),
    r.completedDate ? formatDate(r.completedDate) : '—',
    computeTotalCost(r),
    r.paymentStatus ?? 'unpaid',
  ];
}

const BASE_HEADERS = [
  'Work Order',
  'Issue',
  'Property',
  'Unit',
  'Tenant',
  'Category',
  'Priority',
  'Status',
  'Technician',
  'Submitted',
  'Completed',
  'Total Cost',
  'Payment',
];

async function buildPayload(
  kind: MaintenanceReportKind,
  propertyId?: string,
): Promise<ReportExportPayload> {
  const requests = await listMaintenanceRequests();
  const now = new Date().toISOString().split('T')[0];

  switch (kind) {
    case 'summary': {
      const open = requests.filter(
        (r) => !['completed', 'closed'].includes(normalizeMaintenanceStatus(r.status)),
      );
      const emergency = open.filter((r) => r.priority === 'emergency');
      const totalCost = requests.reduce((s, r) => s + computeTotalCost(r), 0);
      return {
        title: 'Maintenance Summary Report',
        generatedAt: now,
        kpis: [
          { label: 'Total Requests', value: String(requests.length) },
          { label: 'Open Work Orders', value: String(open.length) },
          { label: 'Emergency Open', value: String(emergency.length) },
          { label: 'Total Maintenance Cost', value: formatCurrency(totalCost) },
        ],
        headers: BASE_HEADERS,
        rows: requests.map(baseRow),
      };
    }
    case 'technician_performance': {
      const perf = await getTechnicianPerformance();
      return {
        title: 'Technician Performance Report',
        generatedAt: now,
        headers: ['Technician', 'Completed Jobs', 'Avg Resolution (days)', 'Avg Cost'],
        rows: perf.map((p) => [p.name, p.completed, p.avgDays, formatCurrency(p.avgCost)]),
      };
    }
    case 'costs': {
      const withCosts = requests.filter((r) => computeTotalCost(r) > 0);
      const total = withCosts.reduce((s, r) => s + computeTotalCost(r), 0);
      return {
        title: 'Maintenance Costs Report',
        generatedAt: now,
        kpis: [
          { label: 'Requests with Costs', value: String(withCosts.length) },
          { label: 'Total Spend', value: formatCurrency(total) },
          {
            label: 'Average per Request',
            value: formatCurrency(withCosts.length ? total / withCosts.length : 0),
          },
        ],
        headers: [
          ...BASE_HEADERS.slice(0, 5),
          'Labor',
          'Materials',
          'Additional',
          'Total',
          'Payment Status',
        ],
        rows: withCosts.map((r) => [
          formatRequestId(r),
          r.issue,
          r.propertyName ?? '',
          r.unitLabel,
          r.tenantName,
          r.laborCost ?? 0,
          r.materialsCost ?? 0,
          r.additionalCharges ?? 0,
          computeTotalCost(r),
          r.paymentStatus ?? 'unpaid',
        ]),
      };
    }
    case 'property_history': {
      const filtered = propertyId
        ? requests.filter((r) => r.propertyId === propertyId)
        : requests;
      const propertyName = filtered[0]?.propertyName ?? 'All Properties';
      return {
        title: `Property Maintenance History — ${propertyName}`,
        generatedAt: now,
        headers: BASE_HEADERS,
        rows: filtered.map(baseRow),
      };
    }
    case 'monthly': {
      const monthStart = new Date();
      monthStart.setDate(1);
      const start = monthStart.toISOString().split('T')[0];
      const monthly = requests.filter((r) => r.submitted >= start);
      return {
        title: 'Monthly Maintenance Report',
        generatedAt: now,
        kpis: [
          { label: 'Requests This Month', value: String(monthly.length) },
          {
            label: 'Completed This Month',
            value: String(
              monthly.filter((r) =>
                ['completed', 'closed'].includes(normalizeMaintenanceStatus(r.status)),
              ).length,
            ),
          },
        ],
        headers: BASE_HEADERS,
        rows: monthly.map(baseRow),
      };
    }
    case 'outstanding': {
      const outstanding = requests.filter(
        (r) => !['completed', 'closed'].includes(normalizeMaintenanceStatus(r.status)),
      );
      return {
        title: 'Outstanding Work Orders',
        generatedAt: now,
        kpis: [{ label: 'Outstanding Count', value: String(outstanding.length) }],
        headers: [...BASE_HEADERS, 'Days Open'],
        rows: outstanding.map((r) => {
          const days = Math.max(
            1,
            Math.round(
              (Date.now() - new Date(r.submitted).getTime()) / (1000 * 60 * 60 * 24),
            ),
          );
          return [...baseRow(r), days];
        }),
      };
    }
    default:
      return {
        title: 'Maintenance Report',
        generatedAt: now,
        headers: BASE_HEADERS,
        rows: requests.map(baseRow),
      };
  }
}

export async function exportMaintenanceReportPdf(
  kind: MaintenanceReportKind,
  propertyId?: string,
): Promise<void> {
  const payload = await buildPayload(kind, propertyId);
  await exportReportToPdf(payload, 'maintenance');
}

export async function exportMaintenanceReportExcel(
  kind: MaintenanceReportKind,
  propertyId?: string,
): Promise<void> {
  const payload = await buildPayload(kind, propertyId);
  exportReportToExcel(payload, 'maintenance');
}

export function buildMaintenanceCostSummary(requests: MaintenanceRequest[]) {
  const total = requests.reduce((s, r) => s + computeTotalCost(r), 0);
  const resolved = requests.filter((r) => getResolutionDays(r) != null);
  const avgDays =
    resolved.length > 0
      ? resolved.reduce((s, r) => s + (getResolutionDays(r) ?? 0), 0) / resolved.length
      : 0;
  return { total, avgDays, count: requests.length };
}
