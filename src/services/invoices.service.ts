import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../firebase/app';
import { COLLECTIONS } from '../firebase/config';
import type { Invoice, InvoiceStatus } from '../types';
import { docToData, serverTimestamps, toTimestamp } from '../lib/firestore';
import { updateTenantPaymentStatus } from './tenants.service';

const col = collection(db, COLLECTIONS.invoices);

export async function listInvoices(): Promise<Invoice[]> {
  const snap = await getDocs(query(col, orderBy('dueDate', 'desc')));
  return snap.docs.map((d) => docToData<Invoice>(d));
}

export function subscribeInvoices(callback: (invoices: Invoice[]) => void): () => void {
  return onSnapshot(query(col, orderBy('dueDate', 'desc')), (snap) => {
    callback(snap.docs.map((d) => docToData<Invoice>(d)));
  });
}

export async function listInvoicesByTenant(tenantId: string): Promise<Invoice[]> {
  const snap = await getDocs(
    query(col, where('tenantId', '==', tenantId), orderBy('dueDate', 'desc')),
  );
  return snap.docs.map((d) => docToData<Invoice>(d));
}

export async function createInvoice(data: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const ref = await addDoc(col, {
    ...data,
    ...serverTimestamps(),
  });
  return ref.id;
}

export async function updateInvoice(id: string, data: Partial<Invoice>): Promise<void> {
  const { id: _id, createdAt, ...rest } = data;
  await updateDoc(doc(db, COLLECTIONS.invoices, id), {
    ...rest,
    updatedAt: toTimestamp(),
  });

  if (data.status && data.tenantId) {
    const paymentStatus =
      data.status === 'paid' ? 'paid' : data.status === 'overdue' ? 'overdue' : 'pending';
    await updateTenantPaymentStatus(data.tenantId, paymentStatus);
  }
}

export async function markInvoicePaid(
  invoiceId: string,
  tenantId: string,
  method: string,
  paidDate: string,
): Promise<void> {
  await updateInvoice(invoiceId, {
    status: 'paid',
    paidDate,
    method,
    tenantId,
  });
  await updateTenantPaymentStatus(tenantId, 'paid');
}

export async function deleteInvoice(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.invoices, id));
}
