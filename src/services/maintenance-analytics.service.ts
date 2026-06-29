import { format, parseISO, subMonths } from 'date-fns';
import type {
  MaintenanceCategoryStat,
  MaintenanceChartPoint,
  MaintenanceDashboardStats,
  MaintenanceRequest,
} from '../types';
import {
  isOpenMaintenanceStatus,
  normalizeMaintenanceStatus,
} from '../lib/maintenance-labels';
import { computeTotalCost } from '../lib/maintenance-utils';
import {
  getResolutionDays,
  listMaintenanceRequests,
  listTechnicians,
} from './maintenance.service';

const CATEGORY_COLORS: Record<string, string> = {
  Plumbing: '#3b82f6',
  HVAC: '#f59e0b',
  Electrical: '#8b5cf6',
  Appliance: '#06b6d4',
  Structural: '#64748b',
  'Pest Control': '#84cc16',
  General: '#10b981',
};

function monthKey(date: string): string {
  return format(parseISO(date), 'yyyy-MM');
}

function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number);
  return format(new Date(y, m - 1, 1), 'MMM yyyy');
}

function lastNMonths(n: number): { key: string; label: string }[] {
  const result: { key: string; label: string }[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = subMonths(now, i);
    const key = format(d, 'yyyy-MM');
    result.push({ key, label: format(d, 'MMM yyyy') });
  }
  return result;
}

export async function getMaintenanceDashboardStats(): Promise<MaintenanceDashboardStats> {
  const [requests, technicians] = await Promise.all([
    listMaintenanceRequests(),
    listTechnicians(),
  ]);

  const now = new Date();
  const monthStart = format(new Date(now.getFullYear(), now.getMonth(), 1), 'yyyy-MM-dd');

  const openRequests = requests.filter((r) => isOpenMaintenanceStatus(r.status));
  const completedThisMonth = requests.filter(
    (r) =>
      r.completedDate &&
      r.completedDate >= monthStart &&
      ['completed', 'closed'].includes(normalizeMaintenanceStatus(r.status)),
  );

  const resolved = requests.filter((r) => getResolutionDays(r) != null);
  const avgResolution =
    resolved.length > 0
      ? resolved.reduce((s, r) => s + (getResolutionDays(r) ?? 0), 0) / resolved.length
      : 0;

  const withCost = requests.filter((r) => computeTotalCost(r) > 0);
  const avgCost =
    withCost.length > 0
      ? withCost.reduce((s, r) => s + computeTotalCost(r), 0) / withCost.length
      : 0;

  const byCategory = aggregateByField(requests, 'category');
  const byProperty = aggregateByProperty(requests);
  const byMonth = buildMonthlyChart(requests);
  const statusDistribution = aggregateByStatus(requests);
  const resolutionTrend = buildResolutionTrend(requests);

  const technicianWorkload = technicians.map((tech) => {
    const assigned = requests.filter((r) => r.technicianId === tech.id);
    return {
      technicianId: tech.id,
      name: tech.name,
      openCount: assigned.filter((r) => isOpenMaintenanceStatus(r.status)).length,
      inProgressCount: assigned.filter(
        (r) =>
          normalizeMaintenanceStatus(r.status) === 'in_progress' ||
          normalizeMaintenanceStatus(r.status) === 'waiting_parts',
      ).length,
      completedCount: assigned.filter(
        (r) =>
          normalizeMaintenanceStatus(r.status) === 'completed' ||
          normalizeMaintenanceStatus(r.status) === 'closed',
      ).length,
      scheduledCount: assigned.filter(
        (r) => normalizeMaintenanceStatus(r.status) === 'scheduled',
      ).length,
    };
  });

  return {
    openRequests: openRequests.length,
    assignedRequests: requests.filter(
      (r) => normalizeMaintenanceStatus(r.status) === 'assigned',
    ).length,
    inProgress: requests.filter((r) =>
      ['in_progress', 'waiting_parts'].includes(normalizeMaintenanceStatus(r.status)),
    ).length,
    completedThisMonth: completedThisMonth.length,
    emergencyRequests: openRequests.filter((r) => r.priority === 'emergency').length,
    averageResolutionDays: Math.round(avgResolution * 10) / 10,
    averageCost: Math.round(avgCost),
    technicianWorkload,
    byCategory,
    byProperty,
    byMonth,
    statusDistribution,
    resolutionTrend,
  };
}

function aggregateByField(
  requests: MaintenanceRequest[],
  field: 'category',
): MaintenanceCategoryStat[] {
  const counts: Record<string, number> = {};
  requests.forEach((r) => {
    const key = r[field] || 'Other';
    counts[key] = (counts[key] ?? 0) + 1;
  });
  return Object.entries(counts).map(([name, value]) => ({
    name,
    value,
    color: CATEGORY_COLORS[name] ?? '#6b7280',
  }));
}

function aggregateByProperty(requests: MaintenanceRequest[]): MaintenanceCategoryStat[] {
  const counts: Record<string, { name: string; value: number }> = {};
  requests.forEach((r) => {
    const name = r.propertyName ?? r.propertyId;
    if (!counts[r.propertyId]) counts[r.propertyId] = { name, value: 0 };
    counts[r.propertyId].value += 1;
  });
  const palette = ['#3b82f6', '#f59e0b', '#8b5cf6', '#10b981', '#ef4444', '#06b6d4'];
  return Object.values(counts).map((entry, i) => ({
    name: entry.name,
    value: entry.value,
    color: palette[i % palette.length],
  }));
}

function aggregateByStatus(requests: MaintenanceRequest[]): MaintenanceCategoryStat[] {
  const counts: Record<string, number> = {};
  requests.forEach((r) => {
    const label = normalizeMaintenanceStatus(r.status);
    counts[label] = (counts[label] ?? 0) + 1;
  });
  const statusColors: Record<string, string> = {
    requested: '#3b82f6',
    under_review: '#6366f1',
    assigned: '#f59e0b',
    scheduled: '#f97316',
    in_progress: '#eab308',
    waiting_parts: '#a855f7',
    completed: '#10b981',
    closed: '#6b7280',
  };
  return Object.entries(counts).map(([name, value]) => ({
    name,
    value,
    color: statusColors[name] ?? '#6b7280',
  }));
}

function buildMonthlyChart(requests: MaintenanceRequest[]): MaintenanceChartPoint[] {
  const months = lastNMonths(6);
  return months.map(({ key, label }) => ({
    month: label,
    value: requests.filter((r) => monthKey(r.submitted) === key).length,
  }));
}

function buildResolutionTrend(requests: MaintenanceRequest[]): MaintenanceChartPoint[] {
  const months = lastNMonths(6);
  return months.map(({ key, label }) => {
    const monthResolved = requests.filter(
      (r) => r.completedDate && monthKey(r.completedDate) === key,
    );
    const avg =
      monthResolved.length > 0
        ? monthResolved.reduce((s, r) => s + (getResolutionDays(r) ?? 0), 0) / monthResolved.length
        : 0;
    return { month: label, value: Math.round(avg * 10) / 10 };
  });
}

export async function getTechnicianPerformance(): Promise<
  Array<{ name: string; completed: number; avgDays: number; avgCost: number }>
> {
  const [requests, technicians] = await Promise.all([
    listMaintenanceRequests(),
    listTechnicians(),
  ]);

  return technicians.map((tech) => {
    const completed = requests.filter(
      (r) =>
        r.technicianId === tech.id &&
        ['completed', 'closed'].includes(normalizeMaintenanceStatus(r.status)),
    );
    const days = completed
      .map(getResolutionDays)
      .filter((d): d is number => d != null);
    const costs = completed.map(computeTotalCost).filter((c) => c > 0);
    return {
      name: tech.name,
      completed: completed.length,
      avgDays: days.length ? Math.round((days.reduce((a, b) => a + b, 0) / days.length) * 10) / 10 : 0,
      avgCost: costs.length ? Math.round(costs.reduce((a, b) => a + b, 0) / costs.length) : 0,
    };
  });
}
