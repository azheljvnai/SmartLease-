import type { MaintenanceRequest } from '../types';
import { isOpenMaintenanceStatus, normalizeMaintenanceStatus } from './maintenance-labels';

export function formatRequestId(request: MaintenanceRequest): string {
  if (request.requestNumber) return request.requestNumber;
  return `WO-${request.id.slice(-6).toUpperCase()}`;
}

export function computeTotalCost(request: MaintenanceRequest): number {
  if (request.actualCost != null && request.actualCost > 0) return request.actualCost;
  return (
    (request.laborCost ?? 0) +
    (request.materialsCost ?? 0) +
    (request.additionalCharges ?? 0)
  );
}

export function getUpdatedAtIso(request: MaintenanceRequest): string {
  const u = request.updatedAt;
  if (u instanceof Date) return u.toISOString();
  if (typeof u === 'string') return u;
  return request.submitted;
}

export interface MaintenanceFilterState {
  search: string;
  status: string;
  priority: string;
  propertyId: string;
  unitId: string;
  tenantId: string;
  technicianId: string;
  category: string;
  dateFrom: string;
  dateTo: string;
  costMin: string;
  costMax: string;
  recentlyUpdated: boolean;
}

export const DEFAULT_MAINTENANCE_FILTERS: MaintenanceFilterState = {
  search: '',
  status: 'all',
  priority: 'all',
  propertyId: 'all',
  unitId: 'all',
  tenantId: 'all',
  technicianId: 'all',
  category: 'all',
  dateFrom: '',
  dateTo: '',
  costMin: '',
  costMax: '',
  recentlyUpdated: false,
};

export function filterMaintenanceRequests(
  requests: MaintenanceRequest[],
  filters: MaintenanceFilterState,
): MaintenanceRequest[] {
  const q = filters.search.toLowerCase().trim();
  const costMin = filters.costMin ? parseFloat(filters.costMin) : null;
  const costMax = filters.costMax ? parseFloat(filters.costMax) : null;
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  return requests.filter((r) => {
    const normalized = normalizeMaintenanceStatus(r.status);
    const totalCost = computeTotalCost(r);
    const updatedAt = new Date(getUpdatedAtIso(r)).getTime();

    if (q) {
      const haystack = [
        r.issue,
        r.tenantName,
        r.propertyName,
        r.unitLabel,
        r.category,
        r.assignedTo,
        formatRequestId(r),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    if (filters.status !== 'all' && normalized !== filters.status && r.status !== filters.status) {
      return false;
    }
    if (filters.priority !== 'all' && r.priority !== filters.priority) return false;
    if (filters.propertyId !== 'all' && r.propertyId !== filters.propertyId) return false;
    if (filters.unitId !== 'all' && r.unitId !== filters.unitId) return false;
    if (filters.tenantId !== 'all' && r.tenantId !== filters.tenantId) return false;
    if (filters.technicianId !== 'all') {
      if (filters.technicianId === 'unassigned' && r.technicianId) return false;
      if (filters.technicianId !== 'unassigned' && r.technicianId !== filters.technicianId) {
        return false;
      }
    }
    if (filters.category !== 'all' && r.category !== filters.category) return false;
    if (filters.dateFrom && r.submitted < filters.dateFrom) return false;
    if (filters.dateTo && r.submitted > filters.dateTo) return false;
    if (costMin != null && totalCost < costMin) return false;
    if (costMax != null && totalCost > costMax) return false;
    if (filters.recentlyUpdated && updatedAt < weekAgo) return false;

    return true;
  });
}

export function countOpenByTechnician(
  requests: MaintenanceRequest[],
  technicianId: string,
): number {
  return requests.filter(
    (r) => r.technicianId === technicianId && isOpenMaintenanceStatus(r.status),
  ).length;
}

export type TenantMaintenanceSortBy =
  | 'newest'
  | 'oldest'
  | 'priority'
  | 'updated'
  | 'scheduled';

const PRIORITY_ORDER: Record<string, number> = {
  emergency: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export interface TenantMaintenanceFilterState {
  search: string;
  status: string;
  priority: string;
  category: string;
  dateFrom: string;
  dateTo: string;
  sortBy: TenantMaintenanceSortBy;
}

export const DEFAULT_TENANT_MAINTENANCE_FILTERS: TenantMaintenanceFilterState = {
  search: '',
  status: 'all',
  priority: 'all',
  category: 'all',
  dateFrom: '',
  dateTo: '',
  sortBy: 'newest',
};

export function filterTenantMaintenanceRequests(
  requests: MaintenanceRequest[],
  filters: TenantMaintenanceFilterState,
): MaintenanceRequest[] {
  const q = filters.search.toLowerCase().trim();

  return requests.filter((r) => {
    const normalized = normalizeMaintenanceStatus(r.status);

    if (q) {
      const haystack = [r.issue, r.category, r.assignedTo, r.description, formatRequestId(r)]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    if (filters.status !== 'all' && normalized !== filters.status && r.status !== filters.status) {
      return false;
    }
    if (filters.priority !== 'all' && r.priority !== filters.priority) return false;
    if (filters.category !== 'all' && r.category !== filters.category) return false;
    if (filters.dateFrom && r.submitted < filters.dateFrom) return false;
    if (filters.dateTo && r.submitted > filters.dateTo) return false;
    return true;
  });
}

export function sortTenantMaintenanceRequests(
  requests: MaintenanceRequest[],
  sortBy: TenantMaintenanceSortBy,
): MaintenanceRequest[] {
  const sorted = [...requests];
  switch (sortBy) {
    case 'oldest':
      return sorted.sort((a, b) => a.submitted.localeCompare(b.submitted));
    case 'priority':
      return sorted.sort(
        (a, b) =>
          (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9) ||
          b.submitted.localeCompare(a.submitted),
      );
    case 'updated':
      return sorted.sort((a, b) =>
        getUpdatedAtIso(b).localeCompare(getUpdatedAtIso(a)),
      );
    case 'scheduled':
      return sorted.sort((a, b) => {
        const aDate = a.scheduledDate ?? '9999';
        const bDate = b.scheduledDate ?? '9999';
        return aDate.localeCompare(bDate);
      });
    case 'newest':
    default:
      return sorted.sort((a, b) => b.submitted.localeCompare(a.submitted));
  }
}
