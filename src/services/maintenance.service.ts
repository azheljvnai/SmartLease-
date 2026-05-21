import {
  addDoc,
  collection,
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
import type { MaintenanceRequest, MaintenanceStatus, MaintenanceUpdate } from '../types';
import { docToData, serverTimestamps, toTimestamp } from '../lib/firestore';
import { createActivity } from './activities.service';

const col = collection(db, COLLECTIONS.maintenanceRequests);

export async function listMaintenanceRequests(): Promise<MaintenanceRequest[]> {
  const snap = await getDocs(query(col, orderBy('submitted', 'desc')));
  return snap.docs.map((d) => docToData<MaintenanceRequest>(d));
}

export function subscribeMaintenanceRequests(
  callback: (requests: MaintenanceRequest[]) => void,
): () => void {
  return onSnapshot(query(col, orderBy('submitted', 'desc')), (snap) => {
    callback(snap.docs.map((d) => docToData<MaintenanceRequest>(d)));
  });
}

export async function listMaintenanceByTenant(
  tenantId: string,
): Promise<MaintenanceRequest[]> {
  const snap = await getDocs(
    query(col, where('tenantId', '==', tenantId), orderBy('submitted', 'desc')),
  );
  return snap.docs.map((d) => docToData<MaintenanceRequest>(d));
}

export function subscribeMaintenanceByTenant(
  tenantId: string,
  callback: (requests: MaintenanceRequest[]) => void,
): () => void {
  return onSnapshot(
    query(col, where('tenantId', '==', tenantId), orderBy('submitted', 'desc')),
    (snap) => callback(snap.docs.map((d) => docToData<MaintenanceRequest>(d))),
  );
}

export async function createMaintenanceRequest(
  data: Omit<MaintenanceRequest, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<string> {
  const ref = await addDoc(col, {
    ...data,
    ...serverTimestamps(),
  });

  const updatesCol = collection(db, COLLECTIONS.maintenanceRequests, ref.id, 'updates');
  await addDoc(updatesCol, {
    date: data.submitted,
    message: 'Request submitted',
    status: 'submitted',
    createdAt: toTimestamp(),
  });

  await createActivity({
    type: 'maintenance',
    tenantId: data.tenantId,
    tenantName: data.tenantName,
    action: 'Submitted maintenance request',
    status: 'pending',
  });

  return ref.id;
}

export async function updateMaintenanceRequest(
  id: string,
  data: Partial<MaintenanceRequest>,
): Promise<void> {
  const { id: _id, createdAt, ...rest } = data;
  await updateDoc(doc(db, COLLECTIONS.maintenanceRequests, id), {
    ...rest,
    updatedAt: toTimestamp(),
  });

  if (data.status) {
    const updatesCol = collection(db, COLLECTIONS.maintenanceRequests, id, 'updates');
    await addDoc(updatesCol, {
      date: new Date().toISOString().split('T')[0],
      message: `Status updated to ${data.status}`,
      status: data.status,
      createdAt: toTimestamp(),
    });
  }
}

export async function listMaintenanceUpdates(
  requestId: string,
): Promise<MaintenanceUpdate[]> {
  const snap = await getDocs(
    query(
      collection(db, COLLECTIONS.maintenanceRequests, requestId, 'updates'),
      orderBy('createdAt', 'asc'),
    ),
  );
  return snap.docs.map((d) => docToData<MaintenanceUpdate>(d));
}

export async function listTechnicians(): Promise<{ id: string; name: string; specialties?: string[]; active?: boolean }[]> {
  const snap = await getDocs(collection(db, COLLECTIONS.technicians));
  return snap.docs.map((d) => ({ id: d.id, name: String(d.data().name ?? ''), ...d.data() } as { id: string; name: string }));
}
