import type { Invoice, PaymentRecord, PaymentVerificationStatus } from '../types';

export function getInvoiceTotalDue(invoice: Invoice): number {
  return invoice.amount + (invoice.lateFee ?? 0);
}

export function formatManualPaymentMethod(method: string): string {
  const labels: Record<string, string> = {
    qrph: 'QR Ph',
    gcash: 'GCash',
    maya: 'Maya',
    'QR Ph': 'QR Ph',
    GCash: 'GCash',
    Maya: 'Maya',
  };
  return labels[method] ?? method;
}

export function getPaymentVerificationStatus(
  payment: PaymentRecord,
): PaymentVerificationStatus {
  if (payment.verificationStatus) return payment.verificationStatus;
  if (payment.status === 'pending_verification') return 'pending_verification';
  if (payment.status === 'completed') return 'approved';
  return 'pending_verification';
}

export function verificationStatusLabel(status: PaymentVerificationStatus): string {
  switch (status) {
    case 'pending_verification':
      return 'Pending Verification';
    case 'approved':
      return 'Approved';
    case 'rejected':
      return 'Rejected';
    default:
      return status;
  }
}

export function formatBillingPeriod(
  start?: string,
  end?: string,
): string {
  if (!start || !end) return '—';
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${fmt(start)} – ${fmt(end)}`;
}

export const DEFAULT_PAYMENT_INSTRUCTIONS = {
  qrph: {
    accountName: '',
    accountNumber: '',
    instructions: 'Scan the QR Ph code using your bank app or e-wallet, then enter the exact amount due.',
  },
  gcash: {
    accountName: '',
    accountNumber: '',
    instructions: 'Send payment via GCash to the number below. Use your invoice number as reference.',
  },
  maya: {
    accountName: '',
    accountNumber: '',
    instructions: 'Send payment via Maya to the account below. Include your invoice number in the notes.',
  },
} as const;
