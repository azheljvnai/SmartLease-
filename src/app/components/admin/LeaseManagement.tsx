import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Check, User, Home, FileText, Upload, CheckCircle2 } from 'lucide-react';
import { PageLoader } from '../common/LoadingSpinner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { listProperties } from '../../../services/properties.service';
import { listVacantUnitsByProperty } from '../../../services/units.service';
import { createTenant } from '../../../services/tenants.service';
import {
  activateLease,
  createLeaseDraft,
  deleteLease,
  generateLeaseAgreement,
  getLease,
  listLeases,
  markLeaseAwaitingSignedCopy,
  previewLeasePdf,
  regenerateLeaseAgreement,
  renewLease,
  sendLeaseByEmail,
  subscribeLeases,
  syncLeaseStatuses,
  terminateLease,
  uploadSignedLeaseAgreement,
} from '../../../services/leases.service';
import { downloadLeaseDocument } from '../../../services/storage.service';
import type { Property, Unit, Lease, LeaseAgreementFormData } from '../../../types';
import { getFirebaseErrorMessage } from '../../../lib/firebase-errors';
import { focusFirstFieldError } from '../../../lib/form-validation';
import { formatCurrency } from '../../../lib/format';
import {
  LeaseInformationForm,
  defaultLeaseAgreementForm,
  validateLeaseAgreementForm,
} from '../lease/LeaseInformationForm';
import { LeaseDocumentPanel } from '../lease/LeaseDocumentPanel';
import { canActivateLease } from '../../../lib/lease-documents';
import { LeaseListView } from './leases/LeaseListView';
import { LeaseDetailView } from './leases/LeaseDetailView';
import type { LeaseAction } from './leases/LeaseActionsMenu';

const steps = [
  { id: 1, name: 'Tenant & Unit', icon: User },
  { id: 2, name: 'Lease Details', icon: Home },
  { id: 3, name: 'Generate PDF', icon: FileText },
  { id: 4, name: 'Signed Upload', icon: Upload },
  { id: 5, name: 'Complete', icon: CheckCircle2 },
];

type View = 'list' | 'create' | 'detail';

export const LeaseManagement = () => {
  const [view, setView] = useState<View>('list');
  const [detailMode, setDetailMode] = useState<'view' | 'edit'>('view');
  const [leases, setLeases] = useState<Lease[]>([]);
  const [selectedLease, setSelectedLease] = useState<Lease | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [properties, setProperties] = useState<Property[]>([]);
  const [propertyUnits, setPropertyUnits] = useState<Unit[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [createdLeaseId, setCreatedLeaseId] = useState<string | null>(null);
  const [propertyId, setPropertyId] = useState('');
  const [unitId, setUnitId] = useState('');
  const [agreement, setAgreement] = useState(defaultLeaseAgreementForm());
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [confirmTerminate, setConfirmTerminate] = useState<Lease | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Lease | null>(null);
  const [confirmRenew, setConfirmRenew] = useState<Lease | null>(null);
  const [terminateReason, setTerminateReason] = useState('');

  const uploadRef = useRef<HTMLInputElement>(null);
  const uploadLeaseIdRef = useRef<string | null>(null);

  useEffect(() => {
    syncLeaseStatuses().catch(() => {});
    listProperties().then(setProperties);
    const unsub = subscribeLeases((data) => {
      setLeases(data);
      setLoading(false);
      setSelectedLease((prev) => (prev ? data.find((l) => l.id === prev.id) ?? prev : null));
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!propertyId) {
      setPropertyUnits([]);
      return;
    }
    const property = properties.find((p) => p.id === propertyId);
    if (!property) return;

    setLoadingUnits(true);
    listVacantUnitsByProperty(property.id, property.units)
      .then(setPropertyUnits)
      .catch(() => {
        setPropertyUnits([]);
        toast.error('Failed to load units');
      })
      .finally(() => setLoadingUnits(false));
  }, [propertyId, properties]);

  const refreshLeases = () => listLeases().then(setLeases);

  const refreshSelectedLease = async (id: string) => {
    const updated = await getLease(id);
    if (updated) setSelectedLease(updated);
    await refreshLeases();
  };

  const selectedProperty = properties.find((p) => p.id === propertyId);
  const selectedUnit = propertyUnits.find((u) => u.id === unitId);

  const resetWizard = () => {
    setCurrentStep(1);
    setPropertyUnits([]);
    setPropertyId('');
    setUnitId('');
    setAgreement(defaultLeaseAgreementForm());
    setCreatedLeaseId(null);
  };

  const prefillAgreementFromSelection = () => {
    if (!selectedProperty || !selectedUnit) return;
    setAgreement((prev: LeaseAgreementFormData) => ({
      ...prev,
      property: {
        propertyName: selectedProperty.name,
        address: selectedProperty.address,
        unitNumber: selectedUnit.unitNumber,
        description: prev.property.description,
        propertyType: prev.property.propertyType,
      },
      terms: {
        ...prev.terms,
        rent: prev.terms.rent || 0,
      },
    }));
  };

  const handleCreateDraft = async () => {
    const property = selectedProperty;
    const unit = selectedUnit;
    if (!property || !unit) {
      toast.error('Select a property and unit');
      return;
    }

    const validation = validateLeaseAgreementForm(agreement);
    if (!validation.valid) {
      setFieldErrors(validation.errors);
      focusFirstFieldError(validation.errors);
      toast.error(validation.message ?? 'Please fix the highlighted fields');
      return;
    }
    setFieldErrors({});

    setSubmitting(true);
    try {
      const tenantId = await createTenant({
        name: agreement.lessee.name,
        email: agreement.lessee.email,
        phone: agreement.lessee.phone,
        propertyId: property.id,
        unitId: unit.id,
        propertyName: property.name,
        unitLabel: `${property.name} - Unit ${unit.unitNumber}`,
        rent: agreement.terms.rent,
      });

      const leaseId = await createLeaseDraft({
        tenantId,
        propertyId: property.id,
        unitId: unit.id,
        agreement,
      });

      setCreatedLeaseId(leaseId);
      setCurrentStep(3);
      toast.success('Lease draft saved');
      await refreshLeases();
    } catch (err) {
      toast.error(getFirebaseErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGeneratePdf = async () => {
    if (!createdLeaseId) return;
    setSubmitting(true);
    try {
      await generateLeaseAgreement(createdLeaseId);
      await markLeaseAwaitingSignedCopy(createdLeaseId);
      setCurrentStep(4);
      toast.success('Lease agreement PDF generated');
      await refreshLeases();
    } catch (err) {
      toast.error(getFirebaseErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleActivateFromWizard = async () => {
    if (!createdLeaseId) return;
    setSubmitting(true);
    try {
      await activateLease(createdLeaseId);
      setCurrentStep(5);
      toast.success('Lease activated');
      await refreshLeases();
    } catch (err) {
      toast.error(getFirebaseErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!agreement.lessee.name.trim() || !agreement.lessee.email.trim()) {
        toast.error('Enter lessee name and email');
        return;
      }
      if (!propertyId || !unitId) {
        toast.error('Select a property and unit');
        return;
      }
      prefillAgreementFromSelection();
    }
    if (currentStep === 2) {
      handleCreateDraft();
      return;
    }
    if (currentStep === 3) {
      handleGeneratePdf();
      return;
    }
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1 && currentStep < 5) {
      setCurrentStep(currentStep - 1);
    }
  };

  const runLeaseAction = async (action: LeaseAction, lease: Lease) => {
    setActionLoadingId(lease.id);
    try {
      switch (action) {
        case 'view':
          setSelectedLease(lease);
          setDetailMode('view');
          setView('detail');
          break;
        case 'edit':
          setSelectedLease(lease);
          setDetailMode('edit');
          setView('detail');
          break;
        case 'generatePdf':
          await generateLeaseAgreement(lease.id);
          await markLeaseAwaitingSignedCopy(lease.id);
          toast.success('PDF generated');
          await refreshLeases();
          break;
        case 'preview':
          await previewLeasePdf(lease, lease.documents?.signed ? 'signed' : 'unsigned');
          break;
        case 'download': {
          const file = lease.documents?.signed ?? lease.documents?.unsigned;
          if (!file) throw new Error('No document available');
          await downloadLeaseDocument(file, lease.id);
          break;
        }
        case 'regenerate':
          await regenerateLeaseAgreement(lease.id);
          toast.success('PDF regenerated');
          await refreshLeases();
          break;
        case 'email': {
          const result = await sendLeaseByEmail(lease.id);
          if (result === 'sent') toast.success('Lease emailed');
          else if (result === 'skipped') toast.warning('Email not configured');
          else toast.error('Email failed');
          break;
        }
        case 'uploadSigned':
          uploadLeaseIdRef.current = lease.id;
          uploadRef.current?.click();
          break;
        case 'renew':
          setConfirmRenew(lease);
          break;
        case 'terminate':
          setTerminateReason('');
          setConfirmTerminate(lease);
          break;
        case 'delete':
          setConfirmDelete(lease);
          break;
      }
    } catch (err) {
      toast.error(getFirebaseErrorMessage(err));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleTerminateConfirm = async () => {
    if (!confirmTerminate) return;
    setSubmitting(true);
    try {
      await terminateLease(confirmTerminate.id, terminateReason);
      toast.success('Lease terminated');
      setConfirmTerminate(null);
      if (selectedLease?.id === confirmTerminate.id) {
        await refreshSelectedLease(confirmTerminate.id);
      }
      await refreshLeases();
    } catch (err) {
      toast.error(getFirebaseErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDelete) return;
    setSubmitting(true);
    try {
      await deleteLease(confirmDelete.id);
      toast.success('Lease deleted');
      setConfirmDelete(null);
      if (selectedLease?.id === confirmDelete.id) {
        setSelectedLease(null);
        setView('list');
      }
      await refreshLeases();
    } catch (err) {
      toast.error(getFirebaseErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRenewConfirm = async () => {
    if (!confirmRenew) return;
    setSubmitting(true);
    try {
      const newId = await renewLease(confirmRenew.id);
      toast.success('Renewal lease created');
      setConfirmRenew(null);
      const newLease = await getLease(newId);
      if (newLease) {
        setSelectedLease(newLease);
        setDetailMode('edit');
        setView('detail');
      }
      await refreshLeases();
    } catch (err) {
      toast.error(getFirebaseErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const currentLease = createdLeaseId
    ? leases.find((l) => l.id === createdLeaseId) ?? null
    : null;

  const renderStepper = (vertical = false) => (
    <div className={vertical ? 'space-y-4' : 'flex items-center justify-between'}>
      {steps.map((step, index) => {
        const Icon = step.icon;
        const isCompleted = step.id < currentStep;
        const isCurrent = step.id === currentStep;

        if (vertical) {
          return (
            <div key={step.id} className="flex items-center gap-4">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isCompleted || isCurrent ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}
              >
                {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
              </div>
              <p className={`font-medium ${isCurrent ? 'text-primary' : ''}`}>{step.name}</p>
            </div>
          );
        }

        return (
          <div key={step.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  isCompleted || isCurrent ? 'bg-primary text-primary-foreground ring-4 ring-primary/20' : 'bg-muted text-muted-foreground'
                }`}
              >
                {isCompleted ? <Check className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
              </div>
              <p className={`mt-2 text-sm font-medium ${isCurrent ? 'text-primary' : ''}`}>{step.name}</p>
            </div>
            {index < steps.length - 1 && (
              <div className="flex-1 h-0.5 bg-border relative -top-5 mx-4">
                <div className={`h-full ${isCompleted ? 'bg-primary' : 'bg-transparent'}`} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-4 lg:space-y-5 max-w-7xl mx-auto">
      <input
        ref={uploadRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          const leaseId = uploadLeaseIdRef.current;
          if (!file || !leaseId) return;
          setActionLoadingId(leaseId);
          try {
            await uploadSignedLeaseAgreement(leaseId, file);
            toast.success('Signed lease uploaded');
            if (selectedLease?.id === leaseId) await refreshSelectedLease(leaseId);
            await refreshLeases();
          } catch (err) {
            toast.error(getFirebaseErrorMessage(err));
          } finally {
            setActionLoadingId(null);
            uploadLeaseIdRef.current = null;
            if (uploadRef.current) uploadRef.current.value = '';
          }
        }}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold text-foreground">Leases</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage lease agreements, documents, renewals, and terminations
          </p>
        </div>
        {view !== 'create' && (
          <Button
            variant="primary"
            onClick={() => { setView('create'); resetWizard(); }}
          >
            Create Lease
          </Button>
        )}
      </div>

      {view === 'list' && (
        <LeaseListView
          leases={leases}
          properties={properties}
          onAction={runLeaseAction}
          actionLoadingId={actionLoadingId}
        />
      )}

      {view === 'detail' && selectedLease && (
        <LeaseDetailView
          lease={selectedLease}
          mode={detailMode}
          onBack={() => { setView('list'); setSelectedLease(null); setDetailMode('view'); }}
          onUpdated={(updated) => refreshSelectedLease(updated.id)}
          onModeChange={setDetailMode}
        />
      )}

      {view === 'create' && (
        <>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Create New Lease</h2>
              <p className="text-sm text-muted-foreground">
                Complete all steps to generate and activate the lease agreement
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => { setView('list'); resetWizard(); }}>
              Cancel
            </Button>
          </div>

          <Card className="hidden lg:block p-4">{renderStepper()}</Card>
          <Card className="lg:hidden p-4">{renderStepper(true)}</Card>

          <Card className="p-4 lg:p-6">
            {currentStep === 1 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">Tenant & Unit</h3>
                  <p className="text-sm text-muted-foreground">Select the unit and enter lessee contact info</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1.5 text-sm font-medium">Property</label>
                    <select
                      value={propertyId}
                      onChange={(e) => { setPropertyId(e.target.value); setUnitId(''); }}
                      className="w-full px-3 py-2 bg-input-background border border-input rounded-lg text-sm"
                    >
                      <option value="">Choose a property</option>
                      {properties.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1.5 text-sm font-medium">Unit</label>
                    <select
                      value={unitId}
                      onChange={(e) => setUnitId(e.target.value)}
                      disabled={!propertyId || loadingUnits}
                      className="w-full px-3 py-2 bg-input-background border border-input rounded-lg text-sm disabled:opacity-50"
                    >
                      <option value="">{loadingUnits ? 'Loading...' : 'Choose a unit'}</option>
                      {propertyUnits.map((u) => (
                        <option key={u.id} value={u.id}>Unit {u.unitNumber}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block mb-1.5 text-sm font-medium">Lessee Name</label>
                    <input
                      className="w-full px-3 py-2 bg-input-background border border-input rounded-lg text-sm"
                      value={agreement.lessee.name}
                      onChange={(e) => setAgreement({ ...agreement, lessee: { ...agreement.lessee, name: e.target.value } })}
                    />
                  </div>
                  <div>
                    <label className="block mb-1.5 text-sm font-medium">Email</label>
                    <input
                      type="email"
                      className="w-full px-3 py-2 bg-input-background border border-input rounded-lg text-sm"
                      value={agreement.lessee.email}
                      onChange={(e) => setAgreement({ ...agreement, lessee: { ...agreement.lessee, email: e.target.value } })}
                    />
                  </div>
                  <div>
                    <label className="block mb-1.5 text-sm font-medium">Phone</label>
                    <input
                      className="w-full px-3 py-2 bg-input-background border border-input rounded-lg text-sm"
                      value={agreement.lessee.phone}
                      onChange={(e) => setAgreement({ ...agreement, lessee: { ...agreement.lessee, phone: e.target.value } })}
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <LeaseInformationForm
                value={agreement}
                onChange={(v) => {
                  setAgreement(v);
                  setFieldErrors({});
                }}
                errors={fieldErrors}
                lockLesseeContact
              />
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">Generate Lease Agreement</h3>
                  <p className="text-sm text-muted-foreground">
                    Review the summary, then generate the unsigned PDF for printing and signing.
                  </p>
                </div>
                <Card className="bg-accent/50 p-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Lessor</span><span>{agreement.lessor.name || '—'}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Lessee</span><span>{agreement.lessee.name}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Property</span><span>{agreement.property.propertyName}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Rent</span><span>{formatCurrency(agreement.terms.rent)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Deposit</span><span>{formatCurrency(agreement.terms.deposit)}</span></div>
                  </div>
                </Card>
              </div>
            )}

            {currentStep === 4 && currentLease && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">Upload Signed Copy</h3>
                  <p className="text-sm text-muted-foreground">
                    Print the agreement, sign face-to-face, then upload the executed PDF.
                  </p>
                </div>
                <LeaseDocumentPanel
                  lease={currentLease}
                  role="admin"
                  onUpdated={async () => {
                    await refreshLeases();
                  }}
                />
                {currentLease && canActivateLease(currentLease) && (
                  <Button
                    variant="primary"
                    loading={submitting}
                    onClick={async () => {
                      await handleActivateFromWizard();
                    }}
                  >
                    Activate Lease
                  </Button>
                )}
              </div>
            )}

            {currentStep === 5 && (
              <div className="space-y-4 text-center py-6">
                <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10 text-success" />
                </div>
                <h3 className="text-xl font-semibold">Lease Activated</h3>
                <p className="text-sm text-muted-foreground">
                  The signed lease is on file. The tenant can register with {agreement.lessee.email} to access the portal.
                </p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <Button variant="outline" onClick={() => { setView('list'); resetWizard(); }}>View All Leases</Button>
                  <Button variant="primary" onClick={resetWizard}>Create Another</Button>
                </div>
              </div>
            )}
          </Card>

          {currentStep < 5 && currentStep !== 4 && (
            <div className="flex justify-between gap-3">
              <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 1}>
                Previous
              </Button>
              <Button variant="primary" onClick={handleNext} loading={submitting}>
                {currentStep === 2 ? 'Save & Continue' : currentStep === 3 ? 'Generate PDF' : 'Next'}
              </Button>
            </div>
          )}
        </>
      )}

      <AlertDialog open={Boolean(confirmTerminate)} onOpenChange={(open) => !open && setConfirmTerminate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Terminate lease?</AlertDialogTitle>
            <AlertDialogDescription>
              This will end the lease for {confirmTerminate?.tenantName}, release the unit, and notify the tenant.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div>
            <label className="block text-sm font-medium mb-1.5">Reason (optional)</label>
            <textarea
              className="w-full px-3 py-2 border rounded-lg text-sm min-h-[80px] bg-background"
              value={terminateReason}
              onChange={(e) => setTerminateReason(e.target.value)}
              placeholder="e.g. Tenant requested early termination"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={submitting}
              className="bg-destructive hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                handleTerminateConfirm();
              }}
            >
              {submitting ? 'Please wait...' : 'Terminate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
        title="Delete lease draft?"
        description={`Permanently delete the draft lease for ${confirmDelete?.tenantName ?? 'this tenant'}? Only draft leases without signed documents can be deleted.`}
        confirmLabel="Delete"
        destructive
        loading={submitting}
        onConfirm={handleDeleteConfirm}
      />

      <ConfirmDialog
        open={Boolean(confirmRenew)}
        onOpenChange={(open) => !open && setConfirmRenew(null)}
        title="Renew lease?"
        description={`Create a new lease draft for ${confirmRenew?.tenantName ?? 'this tenant'} based on the current agreement? The existing lease will be marked as renewed.`}
        confirmLabel="Create Renewal"
        loading={submitting}
        onConfirm={handleRenewConfirm}
      />
    </div>
  );
};
