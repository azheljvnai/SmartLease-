import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../firebase/app';
import { COLLECTIONS } from '../firebase/config';
import type { PaymentGateway, PaymentRecord, PaymentRecordStatus } from '../types';
import { docToData, serverTimestamps } from '../lib/firestore';

const col = collection(db, COLLECTIONS.payments);

export async function listPaymentsByTenant(tenantId: string): Promise<PaymentRecord[]> {
  const snap = await getDocs(
    query(col, where('tenantId', '==', tenantId), orderBy('createdAt', 'desc')),
  );
  return snap.docs.map((d) => docToData<PaymentRecord>(d));
}

export async function createPayment(data: {
  tenantId: string;
  invoiceId: string;
  amount: number;
  method: string;
  status?: PaymentRecordStatus;
  gateway?: PaymentGateway;
  monthLabel?: string;
}): Promise<string> {
  const ref = await addDoc(col, {
    ...data,
    status: data.status ?? 'completed',
    gateway: data.gateway ?? 'demo',
    ...serverTimestamps(),
  });
  return ref.id;
}
