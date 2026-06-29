import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../firebase/app';
import { COLLECTIONS } from '../firebase/config';
import type { PaymentRecord, PaymentVerificationStatus } from '../types';
import type { PayMongoCheckoutSession } from '../payments/checkout-session';
import { docToData, serverTimestamps, stripUndefined } from '../lib/firestore';
import { markInvoicePaid, getInvoice, isInvoicePayable } from './invoices.service';
import { createActivity } from './activities.service';
import { updateMaintenanceRequest } from './maintenance.service';
import { formatCurrency } from '../lib/format';

const col = collection(db, COLLECTIONS.payments);

function generatePaymentReference(): string {
  const seq = Math.floor(Math.random() * 900000) + 100000;
  return `PM-${seq}`;
}

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

export async function getPayment(id: string): Promise<PaymentRecord | null> {
  const snap = await getDoc(doc(db, COLLECTIONS.payments, id));
  if (!snap.exists()) return null;
  return docToData<PaymentRecord>(snap as never);
}

export async function completeSimulatedPayMongoPayment(
  session: PayMongoCheckoutSession,
): Promise<string> {
  if (session.expiresAt < Date.now()) {
    throw new Error('Checkout session has expired. Please start again.');
  }

  const invoice = await getInvoice(session.invoiceId);
  if (!invoice) throw new Error('Invoice not found.');
  if (invoice.tenantId !== session.tenantId) {
    throw new Error('This checkout does not belong to your account.');
  }
  if (!isInvoicePayable(invoice)) {
    throw new Error('This invoice is no longer payable.');
  }

  const paidDate = new Date().toISOString().split('T')[0];
  const amountDue = invoice.amount + (invoice.lateFee ?? 0);
  const referenceNumber = generatePaymentReference();

  const paymentId = await createPayment({
    tenantId: session.tenantId,
    tenantName: session.tenantName,
    invoiceId: session.invoiceId,
    invoiceNumber: invoice.invoiceNumber,
    billingPeriodStart: invoice.billingPeriodStart,
    billingPeriodEnd: invoice.billingPeriodEnd,
    amountDue,
    amount: session.amount,
    method: session.method,
    referenceNumber,
    paymentDate: paidDate,
    status: 'completed',
    gateway: 'paymongo',
    verificationStatus: 'approved',
    monthLabel: session.monthLabel,
  });

  await markInvoicePaid(session.invoiceId, session.tenantId, session.method, paidDate);

  if (invoice.maintenanceRequestId) {
    await updateMaintenanceRequest(
      invoice.maintenanceRequestId,
      { paymentStatus: 'paid' },
      { skipAutoUpdate: true },
    );
  }

  await createActivity({
    type: 'payment',
    tenantId: session.tenantId,
    tenantName: session.tenantName,
    action: 'Paid via PayMongo',
    amount: formatCurrency(session.amount),
    status: 'success',
  });

  return paymentId;
}

export async function createPayment(data: {
  tenantId: string;
  tenantName?: string;
  invoiceId: string;
  amount: number;
  method: string;
  status?: PaymentRecord['status'];
  gateway?: PaymentRecord['gateway'];
  monthLabel?: string;
  referenceNumber?: string;
  paymentDate?: string;
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
      gateway: data.gateway ?? 'paymongo',
      verificationStatus: data.verificationStatus ?? 'approved',
      ...serverTimestamps(),
    }),
  );
  return ref.id;
}

export async function deletePayment(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.payments, id));
}
