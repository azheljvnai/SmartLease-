import { useState } from 'react';
import { toast } from 'sonner';
import {
  X,
  Building2,
  User,
  Wrench,
  Calendar,
  DollarSign,
  Paperclip,
  ChevronRight,
  MessageSquarePlus,
  AlertCircle,
} from 'lucide-react';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Badge } from '../../ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../ui/alert-dialog';
import { MaintenanceTimeline } from './MaintenanceTimeline';
import type {
  MaintenancePaymentStatus,
  MaintenancePriority,
  MaintenanceRequest,
  MaintenanceUpdate,
  Technician,
} from '../../../../types';
import {
  getNextStatuses,
  maintenanceCategoryIcon,
  maintenancePriorityLabel,
  maintenancePriorityVariant,
  maintenanceStatusLabel,
  maintenanceStatusVariant,
  normalizeMaintenanceStatus,
} from '../../../../lib/maintenance-labels';
import { formatCurrency, formatDate } from '../../../../lib/format';
import { computeTotalCost, formatRequestId } from '../../../../lib/maintenance-utils';
import {
  addMaintenanceAttachment,
  addMaintenanceNote,
  assignTechnician,
  cancelMaintenanceRequest,
  closeMaintenanceRequest,
  completeMaintenanceRequest,
  requestAdditionalInfo,
  scheduleMaintenance,
  transitionMaintenanceStatus,
  updateMaintenanceCosts,
  updateMaintenancePriority,
} from '../../../../services/maintenance.service';
import { fileToDataUrl } from '../../../../lib/file-upload';
import { getFirebaseErrorMessage } from '../../../../lib/firebase-errors';
import {
  clearFieldError,
  focusFirstFieldError,
  validateFormFields,
} from '../../../../lib/form-validation';
import { Textarea } from '../../ui/textarea';

interface Props {
  request: MaintenanceRequest;
  updates: MaintenanceUpdate[];
  technicians: Technician[];
  authorName: string;
  onClose: () => void;
  onRefreshUpdates: () => void;
  propertyHistory: MaintenanceRequest[];
}

export function MaintenanceDetailPanel({
  request,
  updates,
  technicians,
  authorName,
  onClose,
  onRefreshUpdates,
  propertyHistory,
}: Props) {
  const [noteText, setNoteText] = useState('');
  const [internalNote, setInternalNote] = useState(request.internalNotes ?? '');
  const [scheduleForm, setScheduleForm] = useState({
    date: request.scheduledDate ?? '',
    time: request.scheduledTime ?? '',
    estimatedCompletion: request.estimatedCompletionDate ?? '',
  });
  const [costForm, setCostForm] = useState({
    estimatedCost: String(request.estimatedCost ?? ''),
    laborCost: String(request.laborCost ?? ''),
    materialsCost: String(request.materialsCost ?? ''),
    additionalCharges: String(request.additionalCharges ?? ''),
    materialsUsed: request.materialsUsed ?? '',
    paymentStatus: (request.paymentStatus ?? 'unpaid') as MaintenancePaymentStatus,
  });
  const [completeForm, setCompleteForm] = useState({ adminNotes: '' });
  const [cancelOpen, setCancelOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [infoMessage, setInfoMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const CategoryIcon = maintenanceCategoryIcon(request.category);
  const normalized = normalizeMaintenanceStatus(request.status);
  const nextStatuses = getNextStatuses(request.status);
  const totalCost = computeTotalCost(request);

  const run = async (fn: () => Promise<void>, success: string) => {
    setBusy(true);
    try {
      await fn();
      onRefreshUpdates();
      toast.success(success);
    } catch (err) {
      toast.error(getFirebaseErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleAddNote = () =>
    run(async () => {
      if (!noteText.trim()) return;
      await addMaintenanceNote(request.id, noteText.trim(), authorName);
      setNoteText('');
    }, 'Note added');

  const handleSaveCosts = () =>
    run(async () => {
      await updateMaintenanceCosts(
        request.id,
        {
          estimatedCost: costForm.estimatedCost ? parseFloat(costForm.estimatedCost) : undefined,
          laborCost: costForm.laborCost ? parseFloat(costForm.laborCost) : undefined,
          materialsCost: costForm.materialsCost ? parseFloat(costForm.materialsCost) : undefined,
          additionalCharges: costForm.additionalCharges
            ? parseFloat(costForm.additionalCharges)
            : undefined,
          materialsUsed: costForm.materialsUsed || undefined,
          paymentStatus: costForm.paymentStatus as never,
          actualCost:
            (parseFloat(costForm.laborCost) || 0) +
            (parseFloat(costForm.materialsCost) || 0) +
            (parseFloat(costForm.additionalCharges) || 0) || undefined,
        },
        authorName,
      );
    }, 'Costs updated');

  const handleSchedule = () => {
    const result = validateFormFields({
      'schedule.date': { value: scheduleForm.date, label: 'Schedule date', required: true },
    });
    if (!result.valid) {
      setFieldErrors(result.errors);
      focusFirstFieldError(result.errors);
      toast.error(result.message ?? 'Please fix the highlighted fields');
      return;
    }
    setFieldErrors({});
    run(async () => {
      await scheduleMaintenance(
        request.id,
        {
          scheduledDate: scheduleForm.date,
          scheduledTime: scheduleForm.time || undefined,
          estimatedCompletionDate: scheduleForm.estimatedCompletion || undefined,
        },
        authorName,
      );
    }, 'Repair scheduled');
  };

  const handleComplete = () =>
    run(async () => {
      await completeMaintenanceRequest(request.id, {
        laborCost: costForm.laborCost ? parseFloat(costForm.laborCost) : undefined,
        materialsCost: costForm.materialsCost ? parseFloat(costForm.materialsCost) : undefined,
        additionalCharges: costForm.additionalCharges
          ? parseFloat(costForm.additionalCharges)
          : undefined,
        materialsUsed: costForm.materialsUsed || undefined,
        adminNotes: completeForm.adminNotes || undefined,
        author: authorName,
      });
    }, 'Work order completed');

  const handleAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const url = await fileToDataUrl(file);
      await addMaintenanceAttachment(
        request.id,
        { name: file.name, url, type: file.type.includes('pdf') ? 'invoice' : 'document' },
        authorName,
      );
      onRefreshUpdates();
      toast.success('Document attached');
    } catch (err) {
      toast.error(getFirebaseErrorMessage(err));
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  };

  return (
    <Card className="flex flex-col h-full max-h-[calc(100vh-8rem)] overflow-hidden">
      <div className="p-4 border-b shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex gap-3 min-w-0">
            <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <CategoryIcon className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-mono text-muted-foreground">{formatRequestId(request)}</p>
              <h2 className="font-semibold text-lg leading-tight">{request.issue}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">{request.category}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-md hover:bg-accent shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          <Badge variant={maintenanceStatusVariant(request.status)}>
            {maintenanceStatusLabel(request.status)}
          </Badge>
          <Badge variant={maintenancePriorityVariant(request.priority)}>
            {maintenancePriorityLabel(request.priority)}
          </Badge>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {request.description && (
          <section>
            <h3 className="text-sm font-medium mb-1">Description</h3>
            <p className="text-sm text-muted-foreground bg-muted/40 rounded-md p-3">{request.description}</p>
          </section>
        )}

        {request.photoUrls && request.photoUrls.length > 0 && (
          <section>
            <h3 className="text-sm font-medium mb-2">Tenant Photos</h3>
            <div className="flex flex-wrap gap-2">
              {request.photoUrls.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noreferrer">
                  <img src={url} alt={`Issue ${i + 1}`} className="h-24 w-24 object-cover rounded-md border" />
                </a>
              ))}
            </div>
          </section>
        )}

        <div className="grid sm:grid-cols-2 gap-3">
          <section className="rounded-lg border p-3 space-y-2">
            <h3 className="text-sm font-medium flex items-center gap-1"><Building2 className="w-4 h-4" />Property</h3>
            <p className="text-sm">{request.propertyName ?? request.propertyId}</p>
            <p className="text-sm text-muted-foreground">Unit {request.unitLabel}</p>
          </section>
          <section className="rounded-lg border p-3 space-y-2">
            <h3 className="text-sm font-medium flex items-center gap-1"><User className="w-4 h-4" />Tenant</h3>
            <p className="text-sm">{request.tenantName}</p>
            <p className="text-xs text-muted-foreground">Submitted {formatDate(request.submitted)}</p>
          </section>
        </div>

        <section className="rounded-lg border p-3 space-y-3">
          <h3 className="text-sm font-medium flex items-center gap-1"><Wrench className="w-4 h-4" />Technician</h3>
          <p className="text-sm">{request.assignedTo ?? 'Unassigned'}</p>
          <div className="flex flex-wrap gap-1.5">
            {technicians.map((t) => (
              <Button
                key={t.id}
                size="sm"
                variant={request.technicianId === t.id ? 'primary' : 'outline'}
                disabled={busy}
                onClick={() =>
                  run(() => assignTechnician(request.id, t, authorName), `Assigned to ${t.name}`)
                }
              >
                {t.name}
              </Button>
            ))}
          </div>
        </section>

        <section className="rounded-lg border p-3 space-y-3">
          <h3 className="text-sm font-medium flex items-center gap-1"><Calendar className="w-4 h-4" />Schedule</h3>
          <div className="grid sm:grid-cols-3 gap-2">
            <Input
              label="Schedule Date"
              type="date"
              required
              fieldKey="schedule.date"
              error={fieldErrors['schedule.date']}
              value={scheduleForm.date}
              onChange={(e) => {
                setScheduleForm({ ...scheduleForm, date: e.target.value });
                setFieldErrors((prev) => clearFieldError(prev, 'schedule.date'));
              }}
            />
            <Input
              label="Time"
              type="time"
              fieldKey="schedule.time"
              value={scheduleForm.time}
              onChange={(e) => setScheduleForm({ ...scheduleForm, time: e.target.value })}
            />
            <Input
              label="Est. Completion"
              type="date"
              fieldKey="schedule.estimatedCompletion"
              value={scheduleForm.estimatedCompletion}
              onChange={(e) => setScheduleForm({ ...scheduleForm, estimatedCompletion: e.target.value })}
            />
          </div>
          <Button size="sm" variant="outline" disabled={busy} onClick={handleSchedule}>Save Schedule</Button>
        </section>

        <section className="rounded-lg border p-3 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium flex items-center gap-1"><DollarSign className="w-4 h-4" />Cost Tracking</h3>
            <span className="text-sm font-semibold">Total: {formatCurrency(totalCost)}</span>
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            <Input label="Estimated" type="number" fieldKey="cost.estimatedCost" value={costForm.estimatedCost} onChange={(e) => setCostForm({ ...costForm, estimatedCost: e.target.value })} />
            <Input label="Labor" type="number" fieldKey="cost.laborCost" value={costForm.laborCost} onChange={(e) => setCostForm({ ...costForm, laborCost: e.target.value })} />
            <Input label="Materials" type="number" fieldKey="cost.materialsCost" value={costForm.materialsCost} onChange={(e) => setCostForm({ ...costForm, materialsCost: e.target.value })} />
            <Input label="Additional" type="number" fieldKey="cost.additionalCharges" value={costForm.additionalCharges} onChange={(e) => setCostForm({ ...costForm, additionalCharges: e.target.value })} />
          </div>
          <Input label="Materials Used" fieldKey="cost.materialsUsed" value={costForm.materialsUsed} onChange={(e) => setCostForm({ ...costForm, materialsUsed: e.target.value })} />
          <select
            className="w-full h-9 border rounded-md px-3 text-sm bg-background"
            value={costForm.paymentStatus}
            onChange={(e) =>
              setCostForm({
                ...costForm,
                paymentStatus: e.target.value as MaintenancePaymentStatus,
              })
            }
          >
            <option value="unpaid">Unpaid</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="waived">Waived</option>
          </select>
          <Button size="sm" variant="outline" disabled={busy} onClick={handleSaveCosts}>Save Costs</Button>
        </section>

        <section className="rounded-lg border p-3 space-y-2">
          <h3 className="text-sm font-medium">Internal Notes</h3>
          <textarea
            className="w-full min-h-16 border rounded-md p-2 text-sm bg-background"
            value={internalNote}
            onChange={(e) => setInternalNote(e.target.value)}
            placeholder="Staff-only notes..."
          />
        </section>

        {(request.attachments?.length ?? 0) > 0 && (
          <section>
            <h3 className="text-sm font-medium mb-2 flex items-center gap-1"><Paperclip className="w-4 h-4" />Attachments</h3>
            <div className="space-y-1">
              {request.attachments!.map((a) => (
                <a key={a.id} href={a.url} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline block">
                  {a.name}
                </a>
              ))}
            </div>
          </section>
        )}

        <section>
          <h3 className="text-sm font-medium mb-2">Activity Timeline</h3>
          <MaintenanceTimeline updates={updates} />
          <div className="flex gap-2 mt-3">
            <Input placeholder="Add note..." value={noteText} onChange={(e) => setNoteText(e.target.value)} />
            <Button size="sm" variant="outline" disabled={busy} onClick={handleAddNote}>
              <MessageSquarePlus className="w-4 h-4" />
            </Button>
          </div>
        </section>

        {propertyHistory.filter((h) => h.id !== request.id).length > 0 && (
          <section>
            <h3 className="text-sm font-medium mb-2">Property History</h3>
            <div className="space-y-1">
              {propertyHistory.filter((h) => h.id !== request.id).slice(0, 5).map((h) => (
                <div key={h.id} className="flex justify-between text-sm text-muted-foreground">
                  <span className="truncate">{h.issue}</span>
                  <span>{maintenanceStatusLabel(h.status)}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <div className="p-4 border-t shrink-0 space-y-3 bg-muted/20">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-muted-foreground">Workflow:</span>
          {nextStatuses.map((s) => (
            <Button
              key={s}
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() =>
                run(
                  () => transitionMaintenanceStatus(request.id, s, authorName),
                  `Moved to ${maintenanceStatusLabel(s)}`,
                )
              }
            >
              {maintenanceStatusLabel(s)} <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            className="h-8 border rounded-md px-2 text-sm bg-background"
            value={request.priority}
            onChange={(e) =>
              run(
                () => updateMaintenancePriority(request.id, e.target.value as MaintenancePriority, authorName),
                'Priority updated',
              )
            }
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="emergency">Emergency</option>
          </select>

          <label className="cursor-pointer">
            <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleAttach} disabled={busy} />
            <span className="inline-flex items-center justify-center h-8 rounded-md border px-3 text-sm font-medium hover:bg-accent">
              <Paperclip className="w-4 h-4 mr-1" />Attach
            </span>
          </label>

          <Button size="sm" variant="outline" disabled={busy} onClick={() => setInfoOpen(true)}>
            <AlertCircle className="w-4 h-4 mr-1" />Request Info
          </Button>

          {normalized !== 'completed' && normalized !== 'closed' && (
            <>
              <Button size="sm" variant="primary" disabled={busy} onClick={handleComplete}>
                Complete
              </Button>
              <Button size="sm" variant="outline" disabled={busy} onClick={() => setCancelOpen(true)}>
                Cancel
              </Button>
            </>
          )}

          {normalized === 'completed' && (
            <Button
              size="sm"
              variant="primary"
              disabled={busy}
              onClick={() => run(() => closeMaintenanceRequest(request.id, authorName), 'Work order closed')}
            >
              Close Work Order
            </Button>
          )}
        </div>
      </div>

      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel work order?</AlertDialogTitle>
            <AlertDialogDescription>
              This will close the work order. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep open</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                run(() => cancelMaintenanceRequest(request.id, 'Cancelled by admin', authorName), 'Cancelled')
              }
            >
              Cancel order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={infoOpen} onOpenChange={setInfoOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Request additional information</AlertDialogTitle>
            <AlertDialogDescription>
              The tenant will be notified in-app and by email.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            label="Message"
            required
            fieldKey="infoMessage"
            error={fieldErrors.infoMessage}
            value={infoMessage}
            onChange={(e) => {
              setInfoMessage(e.target.value);
              setFieldErrors((prev) => clearFieldError(prev, 'infoMessage'));
            }}
            placeholder="What information do you need?"
            rows={4}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const result = validateFormFields({
                  infoMessage: { value: infoMessage, label: 'Message', required: true },
                });
                if (!result.valid) {
                  setFieldErrors(result.errors);
                  focusFirstFieldError(result.errors);
                  toast.error(result.message ?? 'Please fix the highlighted fields');
                  return;
                }
                run(async () => {
                  await requestAdditionalInfo(request.id, infoMessage.trim(), authorName);
                  setInfoMessage('');
                  setFieldErrors({});
                  setInfoOpen(false);
                }, 'Information requested');
              }}
            >
              Send request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
