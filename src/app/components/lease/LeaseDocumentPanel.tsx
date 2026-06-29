import { useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  Download,
  FileUp,
  FileText,
  Mail,
  Eye,
  RefreshCw,
  Printer,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import type { Lease, LeaseDocumentFile } from '../../../types';
import {
  LEASE_DISPLAY_STATUS_LABELS,
  SIGNED_LEASE_ACCEPT,
  canActivateLease,
  canDownloadVerifiedSignedLease,
  canRegeneratePdf,
  canUploadSignedCopy,
  canVerifySignedLease,
  getLeaseDisplayStatus,
  leaseDisplayStatusVariant,
} from '../../../lib/lease-documents';
import { getLeaseLifecycleStatus, LEASE_LIFECYCLE_LABELS, lifecycleStatusVariant } from '../../../lib/lease-utils';
import {
  downloadLeaseDocument,
  previewLeaseDocument,
  printLeaseDocument,
  usesInlineDocumentStorage,
  maxSignedLeaseUploadBytes,
} from '../../../services/storage.service';
import {
  activateLease,
  approveSignedLease,
  generateLeaseAgreement,
  markLeaseAwaitingSignedCopy,
  regenerateLeaseAgreement,
  rejectSignedLease,
  sendLeaseByEmail,
  uploadSignedLeaseAgreement,
} from '../../../services/leases.service';
import { getFirebaseErrorMessage } from '../../../lib/firebase-errors';
import { isEmailConfigured } from '../../../services/email.service';
import { formatDate, formatDateTime } from '../../../lib/format';
import { serializeTimestamp } from '../../../lib/firestore';

type Props = {
  lease: Lease;
  role: 'admin' | 'tenant';
  onUpdated?: () => void;
};

function formatDocTimestamp(value: LeaseDocumentFile['uploadedAt'] | string | undefined): string {
  if (!value) return '—';
  const serialized = typeof value === 'string' ? value : serializeTimestamp(value);
  if (serialized instanceof Date) return formatDateTime(serialized);
  if (typeof serialized === 'string') return formatDateTime(new Date(serialized));
  return '—';
}

function DocumentActions({
  file,
  leaseId,
  label,
}: {
  file: LeaseDocumentFile;
  leaseId: string;
  label: string;
}) {
  const handleDownload = async () => {
    try {
      await downloadLeaseDocument(file, leaseId);
    } catch (err) {
      toast.error(getFirebaseErrorMessage(err));
    }
  };

  const handlePreview = async () => {
    try {
      await previewLeaseDocument(file, leaseId);
    } catch (err) {
      toast.error(getFirebaseErrorMessage(err));
    }
  };

  const handlePrint = async () => {
    try {
      await printLeaseDocument(file, leaseId);
    } catch (err) {
      toast.error(getFirebaseErrorMessage(err));
    }
  };

  return (
    <div className="flex flex-wrap gap-1">
      <Button variant="outline" size="sm" onClick={handlePreview} title={`Preview ${label}`}>
        <Eye className="w-4 h-4" />
        <span className="hidden sm:inline ml-1">Preview</span>
      </Button>
      <Button variant="outline" size="sm" onClick={handleDownload} title={`Download ${label}`}>
        <Download className="w-4 h-4" />
        <span className="hidden sm:inline ml-1">Download</span>
      </Button>
      <Button variant="outline" size="sm" onClick={handlePrint} title={`Print ${label}`}>
        <Printer className="w-4 h-4" />
        <span className="hidden sm:inline ml-1">Print</span>
      </Button>
    </div>
  );
}

export function LeaseDocumentPanel({ lease, role, onUpdated }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [activating, setActivating] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [emailing, setEmailing] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  const displayStatus = getLeaseDisplayStatus(lease);
  const lifecycle = getLeaseLifecycleStatus(lease);
  const unsigned = lease.documents?.unsigned;
  const signed = lease.documents?.signed;
  const verification = lease.signedVerification;
  const showSignedDoc =
    Boolean(signed) &&
    (role === 'admin' ||
      displayStatus === 'pending_verification' ||
      displayStatus === 'verified' ||
      displayStatus === 'active' ||
      displayStatus === 'expired' ||
      displayStatus === 'terminated' ||
      displayStatus === 'rejected' ||
      canDownloadVerifiedSignedLease(lease));

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      await uploadSignedLeaseAgreement(lease.id, file, role);
      toast.success(
        role === 'tenant'
          ? 'Signed lease submitted for verification'
          : 'Signed lease uploaded',
      );
      onUpdated?.();
    } catch (err) {
      toast.error(getFirebaseErrorMessage(err));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleActivate = async () => {
    setActivating(true);
    try {
      await activateLease(lease.id);
      toast.success('Lease activated');
      onUpdated?.();
    } catch (err) {
      toast.error(getFirebaseErrorMessage(err));
    } finally {
      setActivating(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await generateLeaseAgreement(lease.id);
      await markLeaseAwaitingSignedCopy(lease.id);
      toast.success('Lease agreement PDF generated');
      onUpdated?.();
    } catch (err) {
      toast.error(getFirebaseErrorMessage(err));
    } finally {
      setGenerating(false);
    }
  };

  const handleRegenerate = async () => {
    setGenerating(true);
    try {
      await regenerateLeaseAgreement(lease.id);
      toast.success('Lease agreement regenerated');
      onUpdated?.();
    } catch (err) {
      toast.error(getFirebaseErrorMessage(err));
    } finally {
      setGenerating(false);
    }
  };

  const handleEmail = async () => {
    setEmailing(true);
    try {
      const result = await sendLeaseByEmail(lease.id);
      if (result === 'sent') toast.success('Lease agreement emailed to tenant');
      else if (result === 'skipped') toast.warning('Email not configured — set EmailJS env vars');
      else toast.error('Failed to send email');
    } catch (err) {
      toast.error(getFirebaseErrorMessage(err));
    } finally {
      setEmailing(false);
    }
  };

  const handleApprove = async () => {
    setVerifying(true);
    try {
      await approveSignedLease(lease.id);
      toast.success('Signed lease verified');
      onUpdated?.();
    } catch (err) {
      toast.error(getFirebaseErrorMessage(err));
    } finally {
      setVerifying(false);
    }
  };

  const handleReject = async () => {
    setRejecting(true);
    try {
      await rejectSignedLease(lease.id, rejectReason);
      toast.success('Signed lease rejected — tenant notified');
      setShowRejectForm(false);
      setRejectReason('');
      onUpdated?.();
    } catch (err) {
      toast.error(getFirebaseErrorMessage(err));
    } finally {
      setRejecting(false);
    }
  };

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <h4 className="font-semibold">Lease Documents</h4>
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

      {displayStatus === 'rejected' && verification?.rejectionReason && (
        <div className="flex gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm">
          <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-destructive">Signed lease rejected</p>
            <p className="text-muted-foreground mt-1">{verification.rejectionReason}</p>
            {verification.rejectedAt && (
              <p className="text-xs text-muted-foreground mt-2">
                Rejected on {formatDate(verification.rejectedAt)}
              </p>
            )}
            {role === 'tenant' && (
              <p className="text-xs mt-2">Please upload a corrected signed copy below.</p>
            )}
          </div>
        </div>
      )}

      {displayStatus === 'pending_verification' && (
        <div className="flex gap-3 p-3 rounded-lg bg-warning/10 border border-warning/20 text-sm">
          <Clock className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Pending verification</p>
            <p className="text-muted-foreground mt-1">
              {role === 'tenant'
                ? 'Your signed lease has been submitted and is awaiting review by your property manager.'
                : 'Review the uploaded signed lease and approve or reject it.'}
            </p>
            {verification?.uploadedAt && (
              <p className="text-xs text-muted-foreground mt-2">
                Uploaded on {formatDateTime(new Date(verification.uploadedAt))}
                {verification.uploadedBy === 'tenant' ? ' by tenant' : ''}
              </p>
            )}
          </div>
        </div>
      )}

      {displayStatus === 'verified' && verification?.verifiedAt && (
        <div className="flex gap-3 p-3 rounded-lg bg-success/10 border border-success/20 text-sm">
          <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-success">Signed lease verified</p>
            <p className="text-xs text-muted-foreground mt-1">
              Verified on {formatDateTime(new Date(verification.verifiedAt))}
            </p>
          </div>
        </div>
      )}

      <div className="space-y-3 text-sm">
        <div className="flex flex-col gap-3 p-4 rounded-lg border bg-muted/30">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium">Lease Agreement (Unsigned)</p>
              <p className="text-muted-foreground text-xs mt-0.5">
                Latest agreement generated by your property manager
              </p>
              {unsigned?.uploadedAt && (
                <p className="text-xs text-muted-foreground mt-1">
                  Generated {formatDocTimestamp(unsigned.uploadedAt)}
                </p>
              )}
            </div>
            {unsigned ? (
              <DocumentActions file={unsigned} leaseId={lease.id} label="unsigned lease" />
            ) : (
              <span className="text-muted-foreground text-xs self-center">Not generated yet</span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 p-4 rounded-lg border bg-muted/30">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium">Signed Lease Agreement</p>
              <p className="text-muted-foreground text-xs mt-0.5">
                Physically signed copy (PDF or image)
              </p>
              {signed?.uploadedAt && (
                <p className="text-xs text-muted-foreground mt-1">
                  Uploaded {formatDocTimestamp(signed.uploadedAt)}
                  {signed.fileName ? ` · ${signed.fileName}` : ''}
                </p>
              )}
              {verification?.verifiedAt && (
                <p className="text-xs text-muted-foreground">
                  Verified {formatDateTime(new Date(verification.verifiedAt))}
                </p>
              )}
            </div>
            {showSignedDoc && signed ? (
              <DocumentActions file={signed} leaseId={lease.id} label="signed lease" />
            ) : (
              <span className="text-muted-foreground text-xs self-center">Not uploaded yet</span>
            )}
          </div>
        </div>
      </div>

      {role === 'admin' && (
        <div className="flex flex-wrap gap-2">
          {!unsigned && displayStatus === 'draft' && (
            <Button variant="primary" size="sm" loading={generating} onClick={handleGenerate}>
              Generate PDF
            </Button>
          )}
          {unsigned && canRegeneratePdf(lease.documentStatus) && (
            <Button variant="outline" size="sm" loading={generating} onClick={handleRegenerate}>
              <RefreshCw className="w-4 h-4" />
              Regenerate
            </Button>
          )}
          {unsigned && isEmailConfigured() && (
            <Button variant="outline" size="sm" loading={emailing} onClick={handleEmail}>
              <Mail className="w-4 h-4" />
              Email Tenant
            </Button>
          )}
        </div>
      )}

      {role === 'admin' && canVerifySignedLease(lease) && (
        <div className="space-y-3 p-4 rounded-lg border border-primary/20 bg-primary/5">
          <p className="text-sm font-medium">Verify signed lease</p>
          {!showRejectForm ? (
            <div className="flex flex-wrap gap-2">
              <Button variant="primary" size="sm" loading={verifying} onClick={handleApprove}>
                <CheckCircle2 className="w-4 h-4" />
                Approve & Verify
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowRejectForm(true)}>
                <XCircle className="w-4 h-4" />
                Reject
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <textarea
                className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Reason for rejection (shown to tenant)..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  loading={rejecting}
                  disabled={!rejectReason.trim()}
                  onClick={handleReject}
                >
                  Confirm Rejection
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowRejectForm(false);
                    setRejectReason('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {canUploadSignedCopy(lease, role) && (
        <div className="border-2 border-dashed border-border rounded-lg p-4 text-center space-y-3">
          <FileUp className="w-8 h-8 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">
            {role === 'tenant'
              ? 'Print the agreement, sign in person, then upload a scanned PDF or photo of the signed document.'
              : 'Upload the executed signed lease (PDF or image).'}
          </p>
          {usesInlineDocumentStorage() && (
            <p className="text-xs text-muted-foreground">
              Spark plan: files are stored in Firestore (max ~{Math.round(maxSignedLeaseUploadBytes() / 1024)}KB).
              Use a compressed PDF or a smaller photo if upload fails.
            </p>
          )}
          <input
            ref={fileRef}
            type="file"
            accept={SIGNED_LEASE_ACCEPT}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
            }}
          />
          <Button
            variant={role === 'tenant' ? 'primary' : 'outline'}
            size="sm"
            loading={uploading}
            onClick={() => fileRef.current?.click()}
          >
            <FileUp className="w-4 h-4" />
            Upload Signed Copy
          </Button>
        </div>
      )}

      {role === 'admin' && canActivateLease(lease) && (
        <Button variant="primary" loading={activating} onClick={handleActivate} className="w-full sm:w-auto">
          Activate Lease
        </Button>
      )}
    </Card>
  );
}
