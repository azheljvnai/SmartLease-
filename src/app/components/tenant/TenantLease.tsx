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
import { PageLoader } from '../common/LoadingSpinner';
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
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/40">
      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-sm mt-0.5 ${highlight ? 'font-semibold text-foreground' : 'font-medium'}`}>
          {value}
        </p>
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

  if (loading) return <PageLoader />;

  if (!tenant) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground">No tenant profile linked to your account.</p>
      </Card>
    );
  }

  if (!lease) {
    return (
      <div className="space-y-4 max-w-4xl">
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold mb-1">My Lease</h1>
          <p className="text-sm text-muted-foreground">{tenant.unitLabel}</p>
        </div>
        <Card className="p-8 text-center">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium">No lease on file yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Contact your property manager when a lease agreement is ready for you.
          </p>
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
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold mb-1">My Lease</h1>
          <p className="text-sm text-muted-foreground">
            {lease.propertyName} · {lease.unitLabel}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant={lifecycleStatusVariant(lifecycle)}>
            {LEASE_LIFECYCLE_LABELS[lifecycle]}
          </Badge>
          <Badge variant={leaseDisplayStatusVariant(displayStatus)}>
            {LEASE_DISPLAY_STATUS_LABELS[displayStatus]}
          </Badge>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-5 py-4 border-b">
          <h2 className="font-semibold text-lg">Lease Summary</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Your current rental agreement details
          </p>
        </div>
        <div className="p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SummaryItem
              icon={Building2}
              label="Property"
              value={lease.propertyName}
            />
            <SummaryItem
              icon={Home}
              label="Unit"
              value={lease.unitLabel}
            />
            {propertyAddress && (
              <SummaryItem
                icon={Building2}
                label="Address"
                value={propertyAddress}
              />
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
            <SummaryItem
              icon={User}
              label="Lessor"
              value={lessorName}
            />
            <SummaryItem
              icon={FileText}
              label="Lease Type"
              value={leaseType}
            />
          </div>

          {lease.terminationReason && (
            <div className="mt-4 p-3 rounded-lg bg-destructive/10 text-sm">
              <p className="font-medium text-destructive">Termination reason</p>
              <p className="text-muted-foreground mt-1">{lease.terminationReason}</p>
            </div>
          )}
        </div>
      </Card>

      <LeaseDocumentPanel lease={lease} role="tenant" onUpdated={handleUpdated} />

      <LeaseHistoryPanel leaseId={lease.id} refreshKey={`${lease.updatedAt}-${refreshKey}`} />
    </div>
  );
};
