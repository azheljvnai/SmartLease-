import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Download, FileUp, FileText, Mail, Eye, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import type { Lease } from '../../../types';
import {
  LEASE_DOCUMENT_STATUS_LABELS,
  canActivateLease,
  canRegeneratePdf,
  canUploadSignedCopy,
  leaseDocumentStatusVariant,
} from '../../../lib/lease-documents';
import { getLeaseLifecycleStatus, LEASE_LIFECYCLE_LABELS, lifecycleStatusVariant } from '../../../lib/lease-utils';
import { downloadLeaseDocument } from '../../../services/storage.service';
import {
  activateLease,
  generateLeaseAgreement,
  markLeaseAwaitingSignedCopy,
  previewLeasePdf,
  regenerateLeaseAgreement,
  sendLeaseByEmail,
  uploadSignedLeaseAgreement,
} from '../../../services/leases.service';
import { getFirebaseErrorMessage } from '../../../lib/firebase-errors';
import { isEmailConfigured } from '../../../services/email.service';

type Props = {
  lease: Lease;
  role: 'admin' | 'tenant';
  onUpdated?: () => void;
};

export function LeaseDocumentPanel({ lease, role, onUpdated }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [activating, setActivating] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [emailing, setEmailing] = useState(false);

  const status = lease.documentStatus ?? 'draft';
  const lifecycle = getLeaseLifecycleStatus(lease);
  const unsigned = lease.documents?.unsigned;
  const signed = lease.documents?.signed;

  const handleDownload = async (file: NonNullable<typeof unsigned>) => {
    try {
      await downloadLeaseDocument(file, lease.id);
    } catch (err) {
      toast.error(getFirebaseErrorMessage(err));
    }
  };

  const handlePreview = async (type: 'unsigned' | 'signed') => {
    try {
      await previewLeasePdf(lease, type);
    } catch (err) {
      toast.error(getFirebaseErrorMessage(err));
    }
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      await uploadSignedLeaseAgreement(lease.id, file, role);
      toast.success('Signed lease uploaded');
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
          <Badge variant={leaseDocumentStatusVariant(status)}>
            {LEASE_DOCUMENT_STATUS_LABELS[status] ?? status}
          </Badge>
        </div>
      </div>

      <div className="space-y-3 text-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-muted/50">
          <div>
            <p className="font-medium">Unsigned Lease Agreement</p>
            <p className="text-muted-foreground text-xs">System-generated template PDF</p>
          </div>
          <div className="flex flex-wrap gap-1">
            {unsigned ? (
              <>
                <Button variant="outline" size="sm" onClick={() => handlePreview('unsigned')}>
                  <Eye className="w-4 h-4" />
                  Preview
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDownload(unsigned)}>
                  <Download className="w-4 h-4" />
                  Download
                </Button>
              </>
            ) : (
              <span className="text-muted-foreground text-xs self-center">Not generated yet</span>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-muted/50">
          <div>
            <p className="font-medium">Signed Lease Agreement</p>
            <p className="text-muted-foreground text-xs">Executed copy with physical signatures</p>
          </div>
          <div className="flex flex-wrap gap-1">
            {signed ? (
              <>
                <Button variant="outline" size="sm" onClick={() => handlePreview('signed')}>
                  <Eye className="w-4 h-4" />
                  Preview
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDownload(signed)}>
                  <Download className="w-4 h-4" />
                  Download
                </Button>
              </>
            ) : (
              <span className="text-muted-foreground text-xs self-center">Not uploaded yet</span>
            )}
          </div>
        </div>
      </div>

      {role === 'admin' && (
        <div className="flex flex-wrap gap-2">
          {!unsigned && status === 'draft' && (
            <Button variant="primary" size="sm" loading={generating} onClick={handleGenerate}>
              Generate PDF
            </Button>
          )}
          {unsigned && canRegeneratePdf(status) && (
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

      {canUploadSignedCopy(status) && (
        <div className="border-2 border-dashed border-border rounded-lg p-4 text-center space-y-3">
          <FileUp className="w-8 h-8 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">
            Print the agreement, sign in person, then upload the scanned or photographed PDF.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
            }}
          />
          <Button
            variant="outline"
            size="sm"
            loading={uploading}
            onClick={() => fileRef.current?.click()}
          >
            Upload Signed PDF
          </Button>
        </div>
      )}

      {role === 'admin' && canActivateLease(status) && (
        <Button variant="primary" loading={activating} onClick={handleActivate} className="w-full sm:w-auto">
          Activate Lease
        </Button>
      )}
    </Card>
  );
}
