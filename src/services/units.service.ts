import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../firebase/app';
import { COLLECTIONS } from '../firebase/config';
import type { Unit, UnitStatus } from '../types';
import { docToData, serverTimestamps, toTimestamp } from '../lib/firestore';
import { recalcPropertyStats } from './properties.service';

const col = collection(db, COLLECTIONS.units);

export async function listUnitsByProperty(propertyId: string): Promise<Unit[]> {
  const snap = await getDocs(query(col, where('propertyId', '==', propertyId)));
  return snap.docs.map((d) => docToData<Unit>(d));
}

export async function listAllUnits(): Promise<Unit[]> {
  const snap = await getDocs(col);
  return snap.docs.map((d) => docToData<Unit>(d));
}

export async function createUnit(data: {
  propertyId: string;
  unitNumber: string;
  status?: UnitStatus;
}): Promise<string> {
  const ref = await addDoc(col, {
    propertyId: data.propertyId,
    unitNumber: data.unitNumber,
    status: data.status ?? 'vacant',
    ...serverTimestamps(),
  });
  await recalcPropertyStats(data.propertyId);
  return ref.id;
}

export async function assignUnit(
  unitId: string,
  propertyId: string,
  tenantId: string,
  leaseId?: string,
): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.units, unitId), {
    status: 'occupied',
    tenantId,
    leaseId: leaseId ?? null,
    updatedAt: toTimestamp(),
  });
  await recalcPropertyStats(propertyId);
}

export async function releaseUnit(unitId: string, propertyId: string): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.units, unitId), {
    status: 'vacant',
    tenantId: null,
    leaseId: null,
    updatedAt: toTimestamp(),
  });
  await recalcPropertyStats(propertyId);
}
