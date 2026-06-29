import type {
  Lease,
  LeaseDocumentStatus,
  LeaseLifecycleStatus,
  LeaseStatus,
  LeaseType,
} from '../types';
import { getLeaseDisplayStatus } from './lease-documents';
import { parseISO, differenceInDays, isBefore, isAfter } from 'date-fns';

export const LEASE_TYPE_LABELS: Record<LeaseType, string> = {
  fixed_term: 'Fixed Term',
  month_to_month: 'Month-to-Month',
  short_term: 'Short Term',
  commercial: 'Commercial',
  residential: 'Residential',
};

export const LEASE_STATUS_LABELS: Record<LeaseStatus, string> = {
  active: 'Active',
  expired: 'Expired',
  pending: 'Pending',
  terminated: 'Terminated',
  renewed: 'Renewed',
};

export const LEASE_LIFECYCLE_LABELS: Record<LeaseLifecycleStatus, string> = {
  draft: 'Draft',
  pending_signature: 'Pending Signature',
  pending_verification: 'Pending Verification',
  verified: 'Verified',
  signed: 'Verified',
  active: 'Active',
  expired: 'Expired',
  terminated: 'Terminated',
  renewed: 'Renewed',
  rejected: 'Rejected',
};

export const EXPIRING_SOON_DAYS = 30;
export const LEASE_PAGE_SIZE = 10;

export type LeaseSortKey =
  | 'tenantName'
  | 'propertyName'
  | 'startDate'
  | 'endDate'
  | 'rent'
  | 'status'
  | 'documentStatus'
  | 'createdAt';

export type LeaseSortDir = 'asc' | 'desc';

export interface LeaseFilters {
  search: string;
  propertyId: string;
  status: string;
  documentStatus: string;
  lifecycle: string;
  dateFrom: string;
  dateTo: string;
}

export const defaultLeaseFilters = (): LeaseFilters => ({
  search: '',
  propertyId: 'all',
  status: 'all',
  documentStatus: 'all',
  lifecycle: 'all',
  dateFrom: '',
  dateTo: '',
});

export function resolveLeaseType(lease: Lease): LeaseType {
  return (
    lease.leaseType ??
    lease.agreement?.terms.leaseType ??
    'fixed_term'
  );
}

export function getLeaseLifecycleStatus(lease: Lease): LeaseLifecycleStatus {
  const display = getLeaseDisplayStatus(lease);
  if (display === 'rejected') return 'rejected';
  if (display === 'pending_verification') return 'pending_verification';
  if (display === 'verified') return 'verified';
  if (display === 'pending_signature') return 'pending_signature';
  if (display === 'active') return 'active';
  if (display === 'expired') return 'expired';
  if (display === 'terminated') return 'terminated';
  if (display === 'renewed') return 'renewed';
  return 'draft';
}

export function isLeaseExpiringSoon(lease: Lease, withinDays = EXPIRING_SOON_DAYS): boolean {
  if (lease.status !== 'active') return false;
  try {
    const end = parseISO(lease.endDate);
    const days = differenceInDays(end, new Date());
    return days >= 0 && days <= withinDays;
  } catch {
    return false;
  }
}

export function isLeaseExpiredByDate(lease: Lease): boolean {
  if (lease.status === 'terminated' || lease.status === 'renewed') return false;
  try {
    const end = parseISO(lease.endDate);
    return isBefore(end, new Date()) && lease.status === 'active';
  } catch {
    return false;
  }
}

export interface LeaseSummaryStats {
  total: number;
  active: number;
  expiringSoon: number;
  expired: number;
  pendingSignature: number;
  terminated: number;
}

export function computeLeaseStats(leases: Lease[]): LeaseSummaryStats {
  return leases.reduce(
    (acc, lease) => {
      acc.total += 1;
      const lifecycle = getLeaseLifecycleStatus(lease);
      if (lifecycle === 'active') acc.active += 1;
      if (isLeaseExpiringSoon(lease)) acc.expiringSoon += 1;
      if (lifecycle === 'expired' || lease.status === 'expired') acc.expired += 1;
      if (lifecycle === 'pending_signature') acc.pendingSignature += 1;
      if (lifecycle === 'terminated') acc.terminated += 1;
      return acc;
    },
    { total: 0, active: 0, expiringSoon: 0, expired: 0, pendingSignature: 0, terminated: 0 },
  );
}

export function filterLeases(leases: Lease[], filters: LeaseFilters): Lease[] {
  const q = filters.search.trim().toLowerCase();

  return leases.filter((lease) => {
    if (q) {
      const haystack = [
        lease.tenantName,
        lease.propertyName,
        lease.unitLabel,
        LEASE_TYPE_LABELS[resolveLeaseType(lease)],
        LEASE_STATUS_LABELS[lease.status],
        LEASE_LIFECYCLE_LABELS[getLeaseLifecycleStatus(lease)],
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    if (filters.propertyId !== 'all' && lease.propertyId !== filters.propertyId) return false;
    if (filters.status !== 'all' && lease.status !== filters.status) return false;
    if (filters.documentStatus !== 'all' && lease.documentStatus !== filters.documentStatus) {
      return false;
    }
    if (filters.lifecycle !== 'all' && getLeaseLifecycleStatus(lease) !== filters.lifecycle) {
      return false;
    }

    if (filters.dateFrom) {
      try {
        if (isBefore(parseISO(lease.endDate), parseISO(filters.dateFrom))) return false;
      } catch {
        /* ignore invalid dates */
      }
    }
    if (filters.dateTo) {
      try {
        if (isAfter(parseISO(lease.startDate), parseISO(filters.dateTo))) return false;
      } catch {
        /* ignore invalid dates */
      }
    }

    return true;
  });
}

function compareStrings(a: string, b: string): number {
  return a.localeCompare(b, undefined, { sensitivity: 'base' });
}

function compareNumbers(a: number, b: number): number {
  return a - b;
}

export function sortLeases(
  leases: Lease[],
  sortKey: LeaseSortKey,
  dir: LeaseSortDir,
): Lease[] {
  const sorted = [...leases].sort((a, b) => {
    let cmp = 0;
    switch (sortKey) {
      case 'tenantName':
        cmp = compareStrings(a.tenantName, b.tenantName);
        break;
      case 'propertyName':
        cmp = compareStrings(a.propertyName, b.propertyName);
        break;
      case 'startDate':
        cmp = compareStrings(a.startDate, b.startDate);
        break;
      case 'endDate':
        cmp = compareStrings(a.endDate, b.endDate);
        break;
      case 'rent':
        cmp = compareNumbers(a.rent, b.rent);
        break;
      case 'status':
        cmp = compareStrings(a.status, b.status);
        break;
      case 'documentStatus':
        cmp = compareStrings(a.documentStatus ?? 'draft', b.documentStatus ?? 'draft');
        break;
      case 'createdAt':
        cmp = compareStrings(String(a.createdAt), String(b.createdAt));
        break;
      default:
        cmp = 0;
    }
    return dir === 'asc' ? cmp : -cmp;
  });
  return sorted;
}

export function lifecycleStatusVariant(
  status: LeaseLifecycleStatus,
): 'default' | 'success' | 'warning' | 'danger' | 'info' {
  switch (status) {
    case 'active':
    case 'verified':
    case 'signed':
      return 'success';
    case 'pending_signature':
    case 'pending_verification':
      return 'warning';
    case 'rejected':
    case 'expired':
    case 'terminated':
      return 'danger';
    case 'renewed':
      return 'info';
    default:
      return 'default';
  }
}

export function leaseStatusVariant(status: LeaseStatus): 'default' | 'success' | 'warning' | 'danger' | 'info' {
  switch (status) {
    case 'active':
      return 'success';
    case 'pending':
      return 'warning';
    case 'expired':
    case 'terminated':
      return 'danger';
    case 'renewed':
      return 'info';
    default:
      return 'default';
  }
}

export function mapLifecycleToDocumentStatuses(
  lifecycle: LeaseLifecycleStatus,
): LeaseDocumentStatus[] | null {
  switch (lifecycle) {
    case 'draft':
      return ['draft'];
    case 'pending_signature':
      return ['lease_agreement_generated', 'awaiting_signed_copy'];
    case 'pending_verification':
      return ['pending_verification'];
    case 'verified':
    case 'signed':
      return ['verified', 'signed_lease_uploaded'];
    case 'rejected':
      return ['rejected'];
    case 'active':
      return ['active_lease'];
    default:
      return null;
  }
}
