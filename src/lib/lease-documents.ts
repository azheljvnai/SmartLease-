import type { LeaseDocumentStatus } from '../types';

export const LEASE_DOCUMENT_STATUS_LABELS: Record<LeaseDocumentStatus, string> = {
  draft: 'Draft',
  lease_agreement_generated: 'Agreement Generated',
  awaiting_signed_copy: 'Awaiting Signature',
  signed_lease_uploaded: 'Signed Copy Uploaded',
  active_lease: 'Active',
};

export const PAYMENT_SCHEDULE_LABELS: Record<string, string> = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  'semi-annual': 'Semi-Annual',
  annual: 'Annual',
};

export function leaseDocumentStatusVariant(
  status: LeaseDocumentStatus,
): 'default' | 'success' | 'warning' | 'danger' | 'info' {
  switch (status) {
    case 'active_lease':
    case 'signed_lease_uploaded':
      return 'success';
    case 'awaiting_signed_copy':
    case 'lease_agreement_generated':
      return 'warning';
    case 'draft':
      return 'default';
    default:
      return 'default';
  }
}

export function canUploadSignedCopy(status: LeaseDocumentStatus): boolean {
  return (
    status === 'lease_agreement_generated' ||
    status === 'awaiting_signed_copy' ||
    status === 'signed_lease_uploaded'
  );
}

export function canActivateLease(status: LeaseDocumentStatus): boolean {
  return status === 'signed_lease_uploaded';
}

export function canGeneratePdf(status: LeaseDocumentStatus): boolean {
  return status === 'draft' || status === 'lease_agreement_generated' || status === 'awaiting_signed_copy';
}

export function canRegeneratePdf(status: LeaseDocumentStatus): boolean {
  return status !== 'active_lease';
}
