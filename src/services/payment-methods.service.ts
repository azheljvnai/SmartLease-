import { collection, deleteDoc, doc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/app';
import { COLLECTIONS } from '../firebase/config';
import type { PaymentMethod } from '../types';
import { docToData } from '../lib/firestore';

const col = collection(db, COLLECTIONS.paymentMethods);

export async function listPaymentMethods(tenantId: string): Promise<PaymentMethod[]> {
  const snap = await getDocs(query(col, where('tenantId', '==', tenantId)));
  return snap.docs.map((d) => docToData<PaymentMethod>(d));
}

export async function listAllPaymentMethods(): Promise<PaymentMethod[]> {
  const snap = await getDocs(col);
  return snap.docs.map((d) => docToData<PaymentMethod>(d));
}

export async function deletePaymentMethod(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.paymentMethods, id));
}
