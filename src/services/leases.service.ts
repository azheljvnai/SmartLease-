import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../firebase/app';
import { COLLECTIONS } from '../firebase/config';
import type { Lease, LeaseStatus } from '../types';
import { docToData, serverTimestamps, toTimestamp } from '../lib/firestore';
import { assignUnit } from './units.service';
import { createActivity } from './activities.service';

const col = collection(db, COLLECTIONS.leases);

export async function listLeases(): Promise<Lease[]> {
  const snap = await getDocs(query(col, orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => docToData<Lease>(d));
}

export async function getActiveLeaseByTenant(tenantId: string): Promise<Lease | null> {
  const snap = await getDocs(
    query(col, where('tenantId', '==', tenantId), where('status', '==', 'active')),
  );
  if (snap.empty) return null;
  return docToData<Lease>(snap.docs[0]);
}

export async function createLease(data: {
  tenantId: string;
  propertyId: string;
  unitId: string;
  tenantName: string;
  propertyName: string;
  unitLabel: string;
  startDate: string;
  endDate: string;
  rent: number;
  deposit: number;
  status?: LeaseStatus;
  documentPath?: string;
}): Promise<string> {
  const ref = await addDoc(col, {
    ...data,
    status: data.status ?? 'active',
    ...serverTimestamps(),
  });

  await assignUnit(data.unitId, data.propertyId, data.tenantId, ref.id);

  await createActivity({
    type: 'lease',
    tenantId: data.tenantId,
    tenantName: data.tenantName,
    action: 'New lease created',
    status: 'success',
  });

  return ref.id;
}

export async function updateLease(id: string, data: Partial<Lease>): Promise<void> {
  const { id: _id, createdAt, ...rest } = data;
  await updateDoc(doc(db, COLLECTIONS.leases, id), {
    ...rest,
    updatedAt: toTimestamp(),
  });
}
