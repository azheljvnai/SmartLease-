import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../firebase/app';
import { COLLECTIONS } from '../firebase/config';
import type {
  Invoice,
  ManualPaymentMethod,
  PaymentRecord,
  PaymentReceiptFile,
  PaymentVerificationStatus,
} from '../types';
import { docToData, serverTimestamps, stripUndefined, toTimestamp } from '../lib/firestore';
import { formatManualPaymentMethod } from '../lib/payment-utils';
import { notifyTenantUser, notifyAdmins } from './notifications.service';
import { listAdminUsers } from './auth.service';
import { markInvoicePaid, getInvoice } from './invoices.service';
import { createActivity } from './activities.service';
import { updateMaintenanceRequest } from './maintenance.service';
import { uploadPaymentReceipt } from './storage.service';
import { formatCurrency, formatDate } from '../lib/format';

const col = collection(db, COLLECTIONS.payments);

const METHOD_LABELS: Record<ManualPaymentMethod, string> = {
  qrph: 'QR Ph',
  gcash: 'GCash',
  maya: 'Maya',
};

export async function listPayments(): Promise<PaymentRecord[]> {
  const snap = await getDocs(query(col, orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => docToData<PaymentRecord>(d));
}

export async function listPaymentsByTenant(tenantId: string): Promise<PaymentRecord[]> {
  const snap = await getDocs(
    query(col, where('tenantId', '==', tenantId), orderBy('createdAt', 'desc')),
  );
  return snap.docs.map((d) => docToData<PaymentRecord>(d));
}

export async function listPendingVerifications(): Promise<PaymentRecord[]> {
  const snap = await getDocs(
    query(
      col,
      where('verificationStatus', '==', 'pending_verification'),
      orderBy('createdAt', 'desc'),
    ),
  );
  return snap.docs.map((d) => docToData<PaymentRecord>(d));
}

export async function getPayment(id: string): Promise<PaymentRecord | null> {
  const snap = await getDoc(doc(db, COLLECTIONS.payments, id));
  if (!snap.exists()) return null;
  return docToData<PaymentRecord>(snap as never);
}

export async function submitManualPayment(data: {
  tenantId: string;
  tenantName: string;
  invoice: Invoice;
  amount: number;
  method: ManualPaymentMethod;
  referenceNumber: string;
  paymentDate: string;
  receiptFile: File;
}): Promise<string> {
  const { invoice } = data;
  const amountDue = invoice.amount + (invoice.lateFee ?? 0);

  const receipt = await uploadPaymentReceipt(
    `${data.tenantId}-${Date.now()}`,
    data.receiptFile,
  );

  const ref = await addDoc(
    col,
    stripUndefined({
      tenantId: data.tenantId,
      tenantName: data.tenantName,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      billingPeriodStart: invoice.billingPeriodStart,
      billingPeriodEnd: invoice.billingPeriodEnd,
      amountDue,
      amount: data.amount,
      method: METHOD_LABELS[data.method],
      referenceNumber: data.referenceNumber.trim(),
      paymentDate: data.paymentDate,
      receiptFile: receipt,
      verificationStatus: 'pending_verification' as PaymentVerificationStatus,
      status: 'pending_verification',
      gateway: 'manual',
      monthLabel: invoice.billingPeriodStart
        ? new Date(invoice.billingPeriodStart).toLocaleDateString('en-PH', {
            month: 'long',
            year: 'numeric',
          })
        : undefined,
      ...serverTimestamps(),
    }),
  );

  const admins = await listAdminUsers();
  await notifyAdmins(
    admins.map((a) => a.id),
    {
      title: 'Payment submitted for verification',
      body: `${data.tenantName} submitted ${formatCurrency(data.amount)} for ${invoice.invoiceNumber} via ${METHOD_LABELS[data.method]}.`,
      type: 'payment',
    },
  );

  return ref.id;
}

export async function approvePayment(
  paymentId: string,
  verifiedBy: string,
): Promise<void> {
  const payment = await getPayment(paymentId);
  if (!payment) throw new Error('Payment not found.');
  if (payment.verificationStatus !== 'pending_verification') {
    throw new Error('Payment is not pending verification.');
  }

  const invoice = await getInvoice(payment.invoiceId);
  if (!invoice) throw new Error('Invoice not found.');

  const paidDate = payment.paymentDate ?? new Date().toISOString().split('T')[0];

  await updateDoc(
    doc(db, COLLECTIONS.payments, paymentId),
    stripUndefined({
      verificationStatus: 'approved',
      status: 'completed',
      verifiedAt: paidDate,
      verifiedBy,
      updatedAt: toTimestamp(),
    }),
  );

  if (invoice.status !== 'paid') {
    await markInvoicePaid(payment.invoiceId, payment.tenantId, payment.method, paidDate);
  }

  if (invoice.maintenanceRequestId) {
    await updateMaintenanceRequest(
      invoice.maintenanceRequestId,
      { paymentStatus: 'paid' },
      { skipAutoUpdate: true },
    );
  }

  await createActivity({
    type: 'payment',
    tenantId: payment.tenantId,
    tenantName: payment.tenantName ?? 'Tenant',
    action: `Payment approved: ${formatCurrency(payment.amount)} (${payment.invoiceNumber ?? payment.invoiceId})`,
    status: 'success',
  });

  await notifyTenantUser(payment.tenantId, {
    title: 'Payment verified',
    body: `Your payment of ${formatCurrency(payment.amount)} for ${payment.invoiceNumber ?? 'your invoice'} has been verified and approved.`,
    type: 'payment',
    subject: 'Payment verified — SmartLease',
  });
}

export async function rejectPayment(
  paymentId: string,
  verifiedBy: string,
  remarks?: string,
): Promise<void> {
  const payment = await getPayment(paymentId);
  if (!payment) throw new Error('Payment not found.');
  if (payment.verificationStatus !== 'pending_verification') {
    throw new Error('Payment is not pending verification.');
  }

  await updateDoc(
    doc(db, COLLECTIONS.payments, paymentId),
    stripUndefined({
      verificationStatus: 'rejected',
      status: 'failed',
      remarks: remarks?.trim() || undefined,
      verifiedAt: new Date().toISOString().split('T')[0],
      verifiedBy,
      updatedAt: toTimestamp(),
    }),
  );

  const remarkText = remarks?.trim()
    ? ` Reason: ${remarks.trim()}`
    : '';

  await notifyTenantUser(payment.tenantId, {
    title: 'Payment rejected',
    body: `Your payment submission for ${payment.invoiceNumber ?? 'your invoice'} was not accepted.${remarkText} Please review and resubmit if needed.`,
    type: 'payment',
    subject: 'Payment rejected — SmartLease',
  });
}

export async function createPayment(data: {
  tenantId: string;
  invoiceId: string;
  amount: number;
  method: string;
  status?: PaymentRecord['status'];
  gateway?: 'manual';
  monthLabel?: string;
  referenceNumber?: string;
  paymentDate?: string;
  receiptFile?: PaymentReceiptFile;
  verificationStatus?: PaymentVerificationStatus;
  invoiceNumber?: string;
  billingPeriodStart?: string;
  billingPeriodEnd?: string;
  amountDue?: number;
}): Promise<string> {
  const ref = await addDoc(
    col,
    stripUndefined({
      ...data,
      status: data.status ?? 'completed',
      gateway: data.gateway ?? 'manual',
      verificationStatus: data.verificationStatus ?? 'approved',
      ...serverTimestamps(),
    }),
  );
  return ref.id;
}

export async function deletePayment(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.payments, id));
}

export function getMethodLabel(method: ManualPaymentMethod): string {
  return METHOD_LABELS[method];
}

export { formatManualPaymentMethod };
