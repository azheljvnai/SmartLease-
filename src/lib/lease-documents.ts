import type { Lease, LeaseDisplayStatus, LeaseDocumentStatus } from '../types';

export const LEASE_DOCUMENT_STATUS_LABELS: Record<LeaseDocumentStatus, string> = {
  draft: 'Draft',
  lease_agreement_generated: 'Agreement Generated',
  awaiting_signed_copy: 'Pending Signature',
  pending_verification: 'Pending Verification',
  verified: 'Verified',
  rejected: 'Rejected',
  signed_lease_uploaded: 'Verified',
  active_lease: 'Active',
};

export const LEASE_DISPLAY_STATUS_LABELS: Record<LeaseDisplayStatus, string> = {
  draft: 'Draft',
  pending_signature: 'Pending Signature',
  pending_verification: 'Pending Verification',
  verified: 'Verified',
  active: 'Active',
  expired: 'Expired',
  renewed: 'Renewed',
  terminated: 'Terminated',
  rejected: 'Rejected',
};

export const PAYMENT_SCHEDULE_LABELS: Record<string, string> = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  'semi-annual': 'Semi-Annual',
  annual: 'Annual',
};

export function getLeaseDisplayStatus(lease: Lease): LeaseDisplayStatus {
  if (lease.status === 'renewed') return 'renewed';
  if (lease.status === 'terminated') return 'terminated';
  if (lease.status === 'expired') return 'expired';
  if (lease.status === 'active' || lease.documentStatus === 'active_lease') return 'active';

  const doc = lease.documentStatus ?? 'draft';
  if (doc === 'rejected') return 'rejected';
  if (doc === 'pending_verification') return 'pending_verification';
  if (doc === 'verified' || doc === 'signed_lease_uploaded') return 'verified';
  if (doc === 'lease_agreement_generated' || doc === 'awaiting_signed_copy') {
    return 'pending_signature';
  }
  return 'draft';
}

export function leaseDisplayStatusVariant(
  status: LeaseDisplayStatus,
): 'default' | 'success' | 'warning' | 'danger' | 'info' {
  switch (status) {
    case 'active':
    case 'verified':
      return 'success';
    case 'pending_signature':
    case 'pending_verification':
      return 'warning';
    case 'rejected':
    case 'expired':
    case 'terminated':
      return 'danger';
    case 'renewed':
      return 'info';
    default:
      return 'default';
  }
}

export function leaseDocumentStatusVariant(
  status: LeaseDocumentStatus,
): 'default' | 'success' | 'warning' | 'danger' | 'info' {
  return leaseDisplayStatusVariant(getLeaseDisplayStatus({ documentStatus: status, status: 'pending' } as Lease));
}

export function canUploadSignedCopy(
  lease: Lease,
  role: 'admin' | 'tenant',
): boolean {
  if (role === 'admin') {
    const doc = lease.documentStatus ?? 'draft';
    return doc !== 'active_lease' && doc !== 'pending_verification';
  }

  const display = getLeaseDisplayStatus(lease);
  return display === 'pending_signature' || display === 'rejected';
}

export function canActivateLease(lease: Lease): boolean {
  const doc = lease.documentStatus ?? 'draft';
  return doc === 'verified' || doc === 'signed_lease_uploaded';
}

export function canVerifySignedLease(lease: Lease): boolean {
  return lease.documentStatus === 'pending_verification' && Boolean(lease.documents?.signed);
}

export function canDownloadVerifiedSignedLease(lease: Lease): boolean {
  const display = getLeaseDisplayStatus(lease);
  return (
    Boolean(lease.documents?.signed) &&
    (display === 'verified' || display === 'active' || display === 'expired' || display === 'terminated')
  );
}

export function canGeneratePdf(status: LeaseDocumentStatus): boolean {
  return status === 'draft' || status === 'lease_agreement_generated' || status === 'awaiting_signed_copy';
}

export function canRegeneratePdf(status: LeaseDocumentStatus): boolean {
  return status !== 'active_lease';
}

export const SIGNED_LEASE_ACCEPT =
  'application/pdf,image/jpeg,image/png,image/webp,image/heic,image/heif';
