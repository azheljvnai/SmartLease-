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
import type { Property, PropertyStatus } from '../types';
import { docToData, serverTimestamps, toTimestamp } from '../lib/firestore';

const col = collection(db, COLLECTIONS.properties);

export async function listProperties(): Promise<Property[]> {
  const snap = await getDocs(query(col, orderBy('name')));
  return snap.docs.map((d) => docToData<Property>(d));
}

export function subscribeProperties(
  callback: (properties: Property[]) => void,
): () => void {
  return onSnapshot(query(col, orderBy('name')), (snap) => {
    callback(snap.docs.map((d) => docToData<Property>(d)));
  });
}

export async function getProperty(id: string): Promise<Property | null> {
  const snap = await getDoc(doc(db, COLLECTIONS.properties, id));
  if (!snap.exists()) return null;
  return docToData<Property>(snap as never);
}

export async function createProperty(data: {
  name: string;
  address: string;
  slug: string;
  units: number;
  status?: PropertyStatus;
}): Promise<string> {
  const ref = await addDoc(col, {
    ...data,
    occupied: 0,
    revenue: 0,
    status: data.status ?? 'active',
    ...serverTimestamps(),
  });
  return ref.id;
}

export async function updateProperty(
  id: string,
  data: Partial<Property>,
): Promise<void> {
  const { id: _id, createdAt, ...rest } = data;
  await updateDoc(doc(db, COLLECTIONS.properties, id), {
    ...rest,
    updatedAt: toTimestamp(),
  });
}

export async function deleteProperty(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.properties, id));
}

export async function recalcPropertyStats(propertyId: string): Promise<void> {
  const unitsSnap = await getDocs(
    query(collection(db, COLLECTIONS.units), where('propertyId', '==', propertyId)),
  );
  const units = unitsSnap.docs.map((d) => d.data());
  const occupied = units.filter((u) => u.status === 'occupied').length;
  const tenantsSnap = await getDocs(
    query(collection(db, COLLECTIONS.tenants), where('propertyId', '==', propertyId)),
  );
  const revenue = tenantsSnap.docs.reduce((sum, d) => sum + (d.data().rent ?? 0), 0);

  await updateDoc(doc(db, COLLECTIONS.properties, propertyId), {
    units: units.length,
    occupied,
    revenue,
    updatedAt: toTimestamp(),
  });
}
