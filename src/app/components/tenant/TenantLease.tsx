import { useEffect, useState } from 'react';
import {
  Building2,
  Calendar,
  DollarSign,
  FileText,
  Home,
  Shield,
  User,
  type LucideIcon,
} from 'lucide-react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { useAuth } from '../../contexts/AuthContext';
import { subscribeCurrentLeaseByTenant } from '../../../services/leases.service';
import type { Lease } from '../../../types';
import { formatCurrency, formatDate } from '../../../lib/format';
import { LeaseDocumentPanel } from '../lease/LeaseDocumentPanel';
import { LeaseHistoryPanel } from '../lease/LeaseHistoryPanel';
import {
  getLeaseDisplayStatus,
  LEASE_DISPLAY_STATUS_LABELS,
  leaseDisplayStatusVariant,
} from '../../../lib/lease-documents';
import {
  getLeaseLifecycleStatus,
  LEASE_LIFECYCLE_LABELS,
  LEASE_TYPE_LABELS,
  lifecycleStatusVariant,
  resolveLeaseType,
} from '../../../lib/lease-utils';
import { TenantPageHeader } from './shared/TenantPageHeader';
import { TenantSection } from './shared/TenantSection';
import { TenantPageSkeleton } from './shared/TenantPageSkeleton';
import { EmptyState } from '../common/EmptyState';
import { differenceInDays, parseISO } from 'date-fns';

function SummaryItem({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border bg-muted/30 p-3 transition-colors hover:bg-muted/50">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p
          className={`mt-0.5 text-sm ${highlight ? 'font-semibold text-foreground' : 'font-medium'}`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function LeaseTimeline({ lease }: { lease: Lease }) {
  const today = new Date();
  const start = parseISO(lease.startDate);
  const end = parseISO(lease.endDate);
  const totalDays = Math.max(differenceInDays(end, start), 1);
  const elapsed = Math.min(Math.max(differenceInDays(today, start), 0), totalDays);
  const progress = Math.round((elapsed / totalDays) * 100);
  const daysRemaining = Math.max(differenceInDays(end, today), 0);

  const milestones = [
    { label: 'Start', date: lease.startDate, icon: Calendar },
    { label: 'Today', date: today.toISOString().split('T')[0], icon: Home, active: true },
    { label: 'End', date: lease.endDate, icon: Calendar },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Lease progress</span>
        <span className="font-medium">
          {daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Lease ended'}
        </span>
      </div>
      <div className="relative h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {milestones.map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.label}
              className={`rounded-lg p-2.5 text-center text-xs ${
                m.active ? 'bg-primary/10 ring-1 ring-primary/30' : 'bg-muted/40'
              }`}
            >
              <Icon className={`mx-auto mb-1 h-4 w-4 ${m.active ? 'text-primary' : 'text-muted-foreground'}`} />
              <p className="font-medium">{m.label}</p>
              <p className="text-muted-foreground">{formatDate(m.date)}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const TenantLease = () => {
  const { tenant } = useAuth();
  const [lease, setLease] = useState<Lease | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState('');

  useEffect(() => {
    if (!tenant) {
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeCurrentLeaseByTenant(tenant.id, (current) => {
      setLease(current);
      setLoading(false);
    });

    return unsubscribe;
  }, [tenant]);

  const handleUpdated = () => {
    setRefreshKey(String(Date.now()));
  };

  if (loading) return <TenantPageSkeleton />;

  if (!tenant) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground">No tenant profile linked to your account.</p>
      </Card>
    );
  }

  if (!lease) {
    return (
      <div className="space-y-5">
        <TenantPageHeader title="My Lease" description={tenant.unitLabel} />
        <Card className="overflow-hidden p-0">
          <EmptyState
            icon={FileText}
            title="No lease on file yet"
            description="Contact your property manager when a lease agreement is ready for you."
          />
        </Card>
      </div>
    );
  }

  const displayStatus = getLeaseDisplayStatus(lease);
  const lifecycle = getLeaseLifecycleStatus(lease);
  const propertyAddress = lease.agreement?.property.address;
  const lessorName = lease.agreement?.lessor.name ?? '—';
  const leaseType = LEASE_TYPE_LABELS[resolveLeaseType(lease)];

  return (
    <div className="space-y-5">
      <TenantPageHeader
        title="My Lease"
        description={`${lease.propertyName} · ${lease.unitLabel}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Badge variant={lifecycleStatusVariant(lifecycle)}>
              {LEASE_LIFECYCLE_LABELS[lifecycle]}
            </Badge>
            <Badge variant={leaseDisplayStatusVariant(displayStatus)}>
              {LEASE_DISPLAY_STATUS_LABELS[displayStatus]}
            </Badge>
          </div>
        }
      />

      <TenantSection title="Lease Timeline" description="Key dates and progress">
        <LeaseTimeline lease={lease} />
      </TenantSection>

      <TenantSection title="Lease Details" description="Your current rental agreement">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <SummaryItem icon={Building2} label="Property" value={lease.propertyName} />
          <SummaryItem icon={Home} label="Unit" value={lease.unitLabel} />
          {propertyAddress && (
            <SummaryItem icon={Building2} label="Address" value={propertyAddress} />
          )}
          <SummaryItem
            icon={Calendar}
            label="Lease Period"
            value={`${formatDate(lease.startDate)} – ${formatDate(lease.endDate)}`}
          />
          <SummaryItem
            icon={DollarSign}
            label="Monthly Rent"
            value={formatCurrency(lease.rent)}
            highlight
          />
          <SummaryItem
            icon={Shield}
            label="Security Deposit"
            value={formatCurrency(lease.deposit)}
          />
          <SummaryItem icon={User} label="Lessor" value={lessorName} />
          <SummaryItem icon={FileText} label="Lease Type" value={leaseType} />
        </div>

        {lease.terminationReason && (
          <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
            <p className="font-medium text-destructive">Termination reason</p>
            <p className="mt-1 text-muted-foreground">{lease.terminationReason}</p>
          </div>
        )}
      </TenantSection>

      <LeaseDocumentPanel lease={lease} role="tenant" onUpdated={handleUpdated} />

      <LeaseHistoryPanel leaseId={lease.id} refreshKey={`${lease.updatedAt}-${refreshKey}`} />
    </div>
  );
};
