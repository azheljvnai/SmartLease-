import { useEffect, useState } from 'react';
import { Card } from '../ui/card';
import { PageLoader } from '../common/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { getCurrentLeaseByTenant } from '../../../services/leases.service';
import type { Lease } from '../../../types';
import { formatCurrency, formatDate } from '../../../lib/format';
import { LeaseDocumentPanel } from '../lease/LeaseDocumentPanel';
import {
  LEASE_DOCUMENT_STATUS_LABELS,
  leaseDocumentStatusVariant,
} from '../../../lib/lease-documents';
import { Badge } from '../ui/badge';

export const TenantLease = () => {
  const { tenant } = useAuth();
  const [lease, setLease] = useState<Lease | null>(null);
  const [loading, setLoading] = useState(true);

  const loadLease = async () => {
    if (!tenant) return;
    try {
      const l = await getCurrentLeaseByTenant(tenant.id);
      setLease(l);
    } catch (err) {
      console.error('Failed to load lease:', err);
      setLease(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!tenant) {
      setLoading(false);
      return;
    }
    loadLease();
  }, [tenant]);

  if (loading) return <PageLoader />;
  if (!tenant) {
    return (
      <Card>
        <p className="text-muted-foreground">No tenant profile linked to your account.</p>
      </Card>
    );
  }

  if (!lease) {
    return (
      <Card>
        <p className="text-muted-foreground">No lease on file yet. Contact your property manager.</p>
      </Card>
    );
  }

  const docStatus = lease.documentStatus ?? 'draft';

  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h1 className="text-2xl lg:text-3xl font-semibold mb-1">My Lease</h1>
        <p className="text-sm text-muted-foreground">{tenant.unitLabel}</p>
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h2 className="font-semibold">Lease Summary</h2>
          <Badge variant={leaseDocumentStatusVariant(docStatus)}>
            {LEASE_DOCUMENT_STATUS_LABELS[docStatus]}
          </Badge>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Lease Period</p>
            <p>{formatDate(lease.startDate)} – {formatDate(lease.endDate)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Monthly Rent</p>
            <p className="font-semibold">{formatCurrency(lease.rent)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Security Deposit</p>
            <p>{formatCurrency(lease.deposit)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Lessor</p>
            <p>{lease.agreement?.lessor.name ?? '—'}</p>
          </div>
        </div>
      </Card>

      <LeaseDocumentPanel lease={lease} role="tenant" onUpdated={loadLease} />
    </div>
  );
};
