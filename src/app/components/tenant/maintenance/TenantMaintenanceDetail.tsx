import { useState } from 'react';
import { toast } from 'sonner';
import {
  Building2,
  Calendar,
  Clock,
  FileText,
  MessageSquare,
  Paperclip,
  RotateCcw,
  ThumbsUp,
  User,
  Wrench,
} from 'lucide-react';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Textarea } from '../../ui/textarea';
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
import { MaintenanceTimeline } from '../../admin/maintenance/MaintenanceTimeline';
import { MaintenanceProgressTracker } from '../../maintenance/MaintenanceProgressTracker';
import type { MaintenanceRequest, MaintenanceUpdate } from '../../../../types';
import {
  maintenanceCategoryIcon,
  maintenancePriorityLabel,
  maintenancePriorityVariant,
  maintenanceStatusLabel,
  maintenanceStatusVariant,
  normalizeMaintenanceStatus,
} from '../../../../lib/maintenance-labels';
import { formatDate } from '../../../../lib/format';
import { formatRequestId } from '../../../../lib/maintenance-utils';
import {
  tenantAddComment,
  tenantConfirmCompletion,
  tenantReopenRequest,
} from '../../../../services/maintenance.service';
import { getFirebaseErrorMessage } from '../../../../lib/firebase-errors';
import { Skeleton } from '../../ui/skeleton';

interface Props {
  request: MaintenanceRequest;
  updates: MaintenanceUpdate[];
  updatesLoading: boolean;
  tenantName: string;
  onRefreshUpdates: () => void;
  onClose?: () => void;
}

export function TenantMaintenanceDetail({
  request,
  updates,
  updatesLoading,
  tenantName,
  onRefreshUpdates,
}: Props) {
  const [comment, setComment] = useState('');
  const [reopenReason, setReopenReason] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reopenOpen, setReopenOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const CategoryIcon = maintenanceCategoryIcon(request.category);
  const normalized = normalizeMaintenanceStatus(request.status);
  const canConfirm = normalized === 'completed';
  const canReopen = normalized === 'completed' || normalized === 'closed';

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

  const handleComment = () =>
    run(async () => {
      if (!comment.trim()) return;
      await tenantAddComment(request.id, comment.trim(), tenantName);
      setComment('');
    }, 'Message sent');

  return (
    <Card className="flex flex-col h-full overflow-hidden border-0 shadow-none lg:border lg:shadow-sm">
      <div className="p-4 border-b shrink-0 bg-card">
        <div className="flex gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <CategoryIcon className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-mono text-muted-foreground">{formatRequestId(request)}</p>
            <h2 className="font-semibold text-lg leading-tight">{request.issue}</h2>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <Badge variant={maintenanceStatusVariant(request.status)}>
                {maintenanceStatusLabel(request.status)}
              </Badge>
              <Badge variant={maintenancePriorityVariant(request.priority)}>
                {maintenancePriorityLabel(request.priority)}
              </Badge>
              <Badge variant="outline">{request.category}</Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        <section>
          <h3 className="text-sm font-medium mb-3">Request Progress</h3>
          <MaintenanceProgressTracker status={request.status} />
        </section>

        {request.description && (
          <section>
            <h3 className="text-sm font-medium mb-1.5">Description</h3>
            <p className="text-sm text-muted-foreground bg-muted/40 rounded-lg p-3 leading-relaxed">
              {request.description}
            </p>
          </section>
        )}

        <div className="grid sm:grid-cols-2 gap-3">
          <section className="rounded-xl border p-3 space-y-1.5">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" />
              Property
            </h3>
            <p className="text-sm font-medium">{request.propertyName ?? 'Your property'}</p>
            <p className="text-sm text-muted-foreground">Unit {request.unitLabel}</p>
          </section>
          <section className="rounded-xl border p-3 space-y-1.5">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              Technician
            </h3>
            <p className="text-sm font-medium flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-muted-foreground" />
              {request.assignedTo ?? 'Not yet assigned'}
            </p>
            {request.assignedDate && (
              <p className="text-xs text-muted-foreground">
                Assigned {formatDate(request.assignedDate)}
              </p>
            )}
          </section>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <section className="rounded-xl border p-3 space-y-1">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Submitted
            </h3>
            <p className="text-sm">{formatDate(request.submitted)}</p>
            {(request.preferredScheduleDate || request.preferredScheduleTime) && (
              <p className="text-xs text-muted-foreground">
                Preferred:{' '}
                {request.preferredScheduleDate
                  ? formatDate(request.preferredScheduleDate)
                  : 'Any date'}
                {request.preferredScheduleTime ? ` at ${request.preferredScheduleTime}` : ''}
              </p>
            )}
          </section>
          {request.scheduledDate && (
            <section className="rounded-xl border p-3 space-y-1 border-primary/30 bg-primary/5">
              <h3 className="text-xs font-medium text-primary uppercase tracking-wide flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Scheduled Repair
              </h3>
              <p className="text-sm font-medium">
                {formatDate(request.scheduledDate)}
                {request.scheduledTime ? ` at ${request.scheduledTime}` : ''}
              </p>
              {request.estimatedCompletionDate && (
                <p className="text-xs text-muted-foreground">
                  Est. completion {formatDate(request.estimatedCompletionDate)}
                </p>
              )}
            </section>
          )}
        </div>

        {request.photoUrls && request.photoUrls.length > 0 && (
          <section>
            <h3 className="text-sm font-medium mb-2">Your Photos</h3>
            <div className="flex flex-wrap gap-2">
              {request.photoUrls.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noreferrer">
                  <img
                    src={url}
                    alt={`Issue photo ${i + 1}`}
                    className="h-20 w-20 object-cover rounded-lg border hover:opacity-90 transition-opacity"
                  />
                </a>
              ))}
            </div>
          </section>
        )}

        {(request.attachments?.length ?? 0) > 0 && (
          <section>
            <h3 className="text-sm font-medium mb-2 flex items-center gap-1">
              <Paperclip className="w-4 h-4" />
              Documents
            </h3>
            <div className="space-y-1.5">
              {request.attachments!.map((a) => (
                <a
                  key={a.id}
                  href={a.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline p-2 rounded-lg hover:bg-accent/50"
                >
                  <FileText className="w-4 h-4 shrink-0" />
                  {a.name}
                </a>
              ))}
            </div>
          </section>
        )}

        <section>
          <h3 className="text-sm font-medium mb-3 flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4" />
            Activity & Messages
          </h3>
          {updatesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <MaintenanceTimeline updates={updates} />
          )}

          <div className="mt-4 space-y-2">
            <Textarea
              placeholder="Send a message to your property manager..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
              fieldKey="tenantComment"
            />
            <Button
              size="sm"
              variant="outline"
              disabled={busy || !comment.trim()}
              onClick={handleComment}
            >
              <MessageSquare className="w-4 h-4 mr-1.5" />
              Send Message
            </Button>
          </div>
        </section>
      </div>

      {(canConfirm || canReopen) && (
        <div className="p-4 border-t shrink-0 bg-muted/20 space-y-2">
          {canConfirm && (
            <Button
              variant="primary"
              className="w-full"
              disabled={busy}
              onClick={() => setConfirmOpen(true)}
            >
              <ThumbsUp className="w-4 h-4 mr-2" />
              Confirm Repair Completed
            </Button>
          )}
          {canReopen && (
            <Button
              variant="outline"
              className="w-full"
              disabled={busy}
              onClick={() => setReopenOpen(true)}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Issue Persists — Reopen Request
            </Button>
          )}
        </div>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm repair completed?</AlertDialogTitle>
            <AlertDialogDescription>
              This confirms the issue has been resolved to your satisfaction. The request will be
              closed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Not yet</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                run(async () => {
                  await tenantConfirmCompletion(request.id, tenantName);
                  setConfirmOpen(false);
                }, 'Thank you! Request closed.')
              }
            >
              Yes, issue resolved
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={reopenOpen} onOpenChange={setReopenOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reopen this request?</AlertDialogTitle>
            <AlertDialogDescription>
              Let us know what still needs attention. Your property manager will be notified.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            label="What is still wrong?"
            fieldKey="reopenReason"
            placeholder="Describe the ongoing issue..."
            value={reopenReason}
            onChange={(e) => setReopenReason(e.target.value)}
            rows={3}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                run(async () => {
                  await tenantReopenRequest(request.id, reopenReason, tenantName);
                  setReopenReason('');
                  setReopenOpen(false);
                }, 'Request reopened')
              }
            >
              Reopen request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
