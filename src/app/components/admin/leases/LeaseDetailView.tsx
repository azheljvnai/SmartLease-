import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ArrowLeft, History, Save } from 'lucide-react';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import type { Lease, LeaseAgreementFormData, LeaseHistoryEntry } from '../../../../types';
import { formatCurrency, formatDate, formatRelativeTime } from '../../../../lib/format';
import {
  getLeaseLifecycleStatus,
  LEASE_LIFECYCLE_LABELS,
  LEASE_STATUS_LABELS,
  LEASE_TYPE_LABELS,
  lifecycleStatusVariant,
  leaseStatusVariant,
  resolveLeaseType,
} from '../../../../lib/lease-utils';
import { LeaseDocumentPanel } from '../../lease/LeaseDocumentPanel';
import {
  LeaseInformationForm,
  defaultLeaseAgreementForm,
  validateLeaseAgreementForm,
} from '../../lease/LeaseInformationForm';
import { listLeaseHistory, updateLeaseAgreement } from '../../../../services/leases.service';
import { getFirebaseErrorMessage } from '../../../../lib/firebase-errors';
import { serializeTimestamp } from '../../../../lib/firestore';

interface Props {
  lease: Lease;
  mode: 'view' | 'edit';
  onBack: () => void;
  onUpdated: (lease: Lease) => void;
  onModeChange: (mode: 'view' | 'edit') => void;
}

export function LeaseDetailView({ lease, mode, onBack, onUpdated, onModeChange }: Props) {
  const [agreement, setAgreement] = useState<LeaseAgreementFormData>(
    lease.agreement ?? defaultLeaseAgreementForm(),
  );
  const [history, setHistory] = useState<LeaseHistoryEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const lifecycle = getLeaseLifecycleStatus(lease);
  const canEdit = lease.status !== 'terminated' && lease.status !== 'renewed';

  useEffect(() => {
    setAgreement(lease.agreement ?? defaultLeaseAgreementForm());
  }, [lease]);

  useEffect(() => {
    setLoadingHistory(true);
    listLeaseHistory(lease.id)
      .then(setHistory)
      .catch(() => toast.error('Failed to load history'))
      .finally(() => setLoadingHistory(false));
  }, [lease.id, lease.updatedAt]);

  const handleSave = async () => {
    const err = validateLeaseAgreementForm(agreement);
    if (err) {
      toast.error(err);
      return;
    }
    setSaving(true);
    try {
      await updateLeaseAgreement(lease.id, agreement);
      toast.success('Lease updated');
      onUpdated({ ...lease, agreement });
      onModeChange('view');
    } catch (e) {
      toast.error(getFirebaseErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
          Back to list
        </Button>
        {mode === 'view' && canEdit && (
          <Button variant="outline" size="sm" onClick={() => onModeChange('edit')}>
            Edit lease details
          </Button>
        )}
        {mode === 'edit' && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onModeChange('view')}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" loading={saving} onClick={handleSave}>
              <Save className="w-4 h-4" />
              Save changes
            </Button>
          </div>
        )}
      </div>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">{lease.tenantName}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {lease.propertyName} · {lease.unitLabel}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant={leaseStatusVariant(lease.status)}>
              {LEASE_STATUS_LABELS[lease.status]}
            </Badge>
            <Badge variant={lifecycleStatusVariant(lifecycle)}>
              {LEASE_LIFECYCLE_LABELS[lifecycle]}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Lease Type</p>
            <p className="font-medium">{LEASE_TYPE_LABELS[resolveLeaseType(lease)]}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Period</p>
            <p className="font-medium">{formatDate(lease.startDate)} – {formatDate(lease.endDate)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Monthly Rent</p>
            <p className="font-medium">{formatCurrency(lease.rent)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Security Deposit</p>
            <p className="font-medium">{formatCurrency(lease.deposit)}</p>
          </div>
        </div>

        {lease.terminationReason && (
          <div className="mt-3 p-3 rounded-lg bg-destructive/10 text-sm">
            <p className="font-medium text-destructive">Termination reason</p>
            <p className="text-muted-foreground">{lease.terminationReason}</p>
          </div>
        )}
      </Card>

      {mode === 'edit' ? (
        <Card className="p-4">
          <LeaseInformationForm value={agreement} onChange={setAgreement} lockLesseeContact />
        </Card>
      ) : (
        <LeaseDocumentPanel
          lease={lease}
          role="admin"
          onUpdated={() => onUpdated(lease)}
        />
      )}

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <History className="w-4 h-4 text-primary" />
          <h3 className="font-semibold">Activity History</h3>
        </div>
        {loadingHistory ? (
          <p className="text-sm text-muted-foreground">Loading history...</p>
        ) : history.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
        ) : (
          <ul className="space-y-2 max-h-64 overflow-y-auto">
            {history.map((entry) => {
              const created = serializeTimestamp(entry.createdAt);
              const date =
                created instanceof Date
                  ? created
                  : typeof created === 'string'
                    ? new Date(created)
                    : new Date();
              return (
                <li key={entry.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-sm py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">{entry.action}</p>
                    {entry.details && (
                      <p className="text-xs text-muted-foreground">{entry.details}</p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatRelativeTime(date)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
