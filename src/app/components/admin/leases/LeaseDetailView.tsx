import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import type { Lease, LeaseAgreementFormData } from '../../../../types';
import { formatCurrency, formatDate } from '../../../../lib/format';
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
import { LeaseHistoryPanel } from '../../lease/LeaseHistoryPanel';
import {
  LeaseInformationForm,
  defaultLeaseAgreementForm,
  validateLeaseAgreementForm,
} from '../../lease/LeaseInformationForm';
import { updateLeaseAgreement } from '../../../../services/leases.service';
import { getFirebaseErrorMessage } from '../../../../lib/firebase-errors';
import { focusFirstFieldError } from '../../../../lib/form-validation';

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
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const lifecycle = getLeaseLifecycleStatus(lease);
  const canEdit = lease.status !== 'terminated' && lease.status !== 'renewed';

  useEffect(() => {
    setAgreement(lease.agreement ?? defaultLeaseAgreementForm());
  }, [lease]);

  const handleSave = async () => {
    const validation = validateLeaseAgreementForm(agreement);
    if (!validation.valid) {
      setFieldErrors(validation.errors);
      focusFirstFieldError(validation.errors);
      toast.error(validation.message ?? 'Please fix the highlighted fields');
      return;
    }
    setFieldErrors({});
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
          <LeaseInformationForm
            value={agreement}
            onChange={(v) => {
              setAgreement(v);
              setFieldErrors({});
            }}
            errors={fieldErrors}
            lockLesseeContact
          />
        </Card>
      ) : (
        <LeaseDocumentPanel
          lease={lease}
          role="admin"
          onUpdated={() => onUpdated(lease)}
        />
      )}

      <LeaseHistoryPanel leaseId={lease.id} refreshKey={String(lease.updatedAt)} />
    </div>
  );
}
