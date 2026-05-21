import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../firebase/app';
import { COLLECTIONS } from '../firebase/config';
import type { PaymentStatus, Tenant, TenantStatus } from '../types';
import { docToData, serverTimestamps, toTimestamp } from '../lib/firestore';

const col = collection(db, COLLECTIONS.tenants);

export async function listTenants(): Promise<Tenant[]> {
  const snap = await getDocs(query(col, orderBy('name')));
  return snap.docs.map((d) => docToData<Tenant>(d));
}

export function subscribeTenants(callback: (tenants: Tenant[]) => void): () => void {
  return onSnapshot(query(col, orderBy('name')), (snap) => {
    callback(snap.docs.map((d) => docToData<Tenant>(d)));
  });
}

export async function getTenant(id: string): Promise<Tenant | null> {
  const snap = await getDoc(doc(db, COLLECTIONS.tenants, id));
  if (!snap.exists()) return null;
  return docToData<Tenant>(snap as never);
}

export async function getTenantByUserId(userId: string): Promise<Tenant | null> {
  const snap = await getDocs(query(col, where('userId', '==', userId)));
  if (snap.empty) return null;
  return docToData<Tenant>(snap.docs[0]);
}

export async function createTenant(data: {
  name: string;
  email: string;
  phone: string;
  propertyId: string;
  unitId: string;
  propertyName: string;
  unitLabel: string;
  rent: number;
  userId?: string;
  status?: TenantStatus;
  paymentStatus?: PaymentStatus;
}): Promise<string> {
  const ref = await addDoc(col, {
    ...data,
    status: data.status ?? 'active',
    paymentStatus: data.paymentStatus ?? 'pending',
    ...serverTimestamps(),
  });
  return ref.id;
}

export async function updateTenant(id: string, data: Partial<Tenant>): Promise<void> {
  const { id: _id, createdAt, ...rest } = data;
  await updateDoc(doc(db, COLLECTIONS.tenants, id), {
    ...rest,
    updatedAt: toTimestamp(),
  });
}

export async function deleteTenant(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.tenants, id));
}

export async function updateTenantPaymentStatus(
  tenantId: string,
  paymentStatus: PaymentStatus,
): Promise<void> {
  await updateTenant(tenantId, { paymentStatus });
}
