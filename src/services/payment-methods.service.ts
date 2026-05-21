import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/app';
import { COLLECTIONS } from '../firebase/config';
import type { PaymentMethod } from '../types';
import { docToData } from '../lib/firestore';

export async function listPaymentMethods(tenantId: string): Promise<PaymentMethod[]> {
  const snap = await getDocs(
    query(collection(db, COLLECTIONS.paymentMethods), where('tenantId', '==', tenantId)),
  );
  return snap.docs.map((d) => docToData<PaymentMethod>(d));
}
