import type { LucideIcon } from 'lucide-react';
import {
  Droplets,
  Zap,
  Wind,
  Refrigerator,
  Building2,
  Bug,
  Wrench,
} from 'lucide-react';
import type { MaintenancePriority, MaintenanceStatus } from '../types';

const LEGACY_STATUS_MAP: Record<string, MaintenanceStatus> = {
  pending: 'requested',
  submitted: 'requested',
  cancelled: 'closed',
};

export function normalizeMaintenanceStatus(status: MaintenanceStatus | string): MaintenanceStatus {
  return (LEGACY_STATUS_MAP[status] ?? status) as MaintenanceStatus;
}

export const MAINTENANCE_WORKFLOW: MaintenanceStatus[] = [
  'requested',
  'under_review',
  'assigned',
  'scheduled',
  'in_progress',
  'waiting_parts',
  'completed',
  'closed',
];

export function maintenanceStatusLabel(status: MaintenanceStatus | string): string {
  const normalized = normalizeMaintenanceStatus(status);
  const labels: Record<MaintenanceStatus, string> = {
    requested: 'Requested',
    under_review: 'Under Review',
    assigned: 'Assigned',
    scheduled: 'Scheduled',
    in_progress: 'In Progress',
    waiting_parts: 'Waiting for Parts',
    completed: 'Completed',
    closed: 'Closed',
    cancelled: 'Closed',
    pending: 'Requested',
    submitted: 'Requested',
  };
  return labels[normalized] ?? String(status);
}

export function maintenanceStatusVariant(
  status: MaintenanceStatus | string,
): 'default' | 'info' | 'warning' | 'success' | 'danger' {
  const normalized = normalizeMaintenanceStatus(status);
  switch (normalized) {
    case 'requested':
      return 'info';
    case 'under_review':
      return 'info';
    case 'assigned':
    case 'scheduled':
      return 'warning';
    case 'in_progress':
    case 'waiting_parts':
      return 'warning';
    case 'completed':
      return 'success';
    case 'closed':
      return 'default';
    default:
      return 'default';
  }
}

export function maintenancePriorityLabel(priority: MaintenancePriority): string {
  const labels: Record<MaintenancePriority, string> = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    emergency: 'Emergency',
  };
  return labels[priority] ?? priority;
}

export function maintenancePriorityVariant(
  priority: MaintenancePriority,
): 'default' | 'info' | 'warning' | 'danger' {
  switch (priority) {
    case 'emergency':
      return 'danger';
    case 'high':
      return 'warning';
    case 'medium':
      return 'warning';
    case 'low':
      return 'info';
    default:
      return 'default';
  }
}

export function maintenancePriorityColor(priority: MaintenancePriority): {
  bg: string;
  text: string;
  border: string;
  dot: string;
} {
  switch (priority) {
    case 'emergency':
      return {
        bg: 'bg-red-500/10',
        text: 'text-red-700 dark:text-red-400',
        border: 'border-red-500/30',
        dot: 'bg-red-500',
      };
    case 'high':
      return {
        bg: 'bg-orange-500/10',
        text: 'text-orange-700 dark:text-orange-400',
        border: 'border-orange-500/30',
        dot: 'bg-orange-500',
      };
    case 'medium':
      return {
        bg: 'bg-yellow-500/10',
        text: 'text-yellow-700 dark:text-yellow-400',
        border: 'border-yellow-500/30',
        dot: 'bg-yellow-500',
      };
    case 'low':
      return {
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-700 dark:text-emerald-400',
        border: 'border-emerald-500/30',
        dot: 'bg-emerald-500',
      };
    default:
      return {
        bg: 'bg-muted',
        text: 'text-muted-foreground',
        border: 'border-border',
        dot: 'bg-muted-foreground',
      };
  }
}

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Plumbing: Droplets,
  Electrical: Zap,
  HVAC: Wind,
  Appliance: Refrigerator,
  Structural: Building2,
  'Pest Control': Bug,
  General: Wrench,
};

export function maintenanceCategoryIcon(category: string): LucideIcon {
  return CATEGORY_ICONS[category] ?? Wrench;
}

export const MAINTENANCE_CATEGORIES = [
  'Plumbing',
  'Electrical',
  'HVAC',
  'Appliance',
  'Structural',
  'Pest Control',
  'General',
] as const;

export function getNextStatuses(current: MaintenanceStatus | string): MaintenanceStatus[] {
  const normalized = normalizeMaintenanceStatus(current);
  const idx = MAINTENANCE_WORKFLOW.indexOf(normalized);
  if (idx === -1) return [];
  const next: MaintenanceStatus[] = [];
  if (idx < MAINTENANCE_WORKFLOW.length - 1) {
    next.push(MAINTENANCE_WORKFLOW[idx + 1]);
  }
  if (normalized === 'in_progress') {
    next.push('waiting_parts');
  }
  if (normalized === 'waiting_parts') {
    next.push('in_progress');
  }
  if (normalized !== 'closed' && normalized !== 'completed') {
    next.push('completed');
  }
  if (normalized === 'completed') {
    next.push('closed');
  }
  return [...new Set(next)];
}

export function isOpenMaintenanceStatus(status: MaintenanceStatus | string): boolean {
  const normalized = normalizeMaintenanceStatus(status);
  return normalized !== 'completed' && normalized !== 'closed';
}
