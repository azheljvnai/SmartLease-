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

export async function ensurePropertyUnits(
  propertyId: string,
  expectedCount: number,
): Promise<void> {
  const target = Math.max(1, expectedCount);
  const existing = await listUnitsByProperty(propertyId);
  if (existing.length >= target) return;

  const usedNumbers = new Set(existing.map((u) => u.unitNumber));
  let nextNum = 1;
  let created = 0;
  const toCreate = target - existing.length;

  while (created < toCreate) {
    while (usedNumbers.has(String(nextNum))) nextNum++;
    await createUnit({ propertyId, unitNumber: String(nextNum) });
    usedNumbers.add(String(nextNum));
    nextNum++;
    created++;
  }
}

export async function listVacantUnitsByProperty(
  propertyId: string,
  expectedCount: number,
): Promise<Unit[]> {
  await ensurePropertyUnits(propertyId, expectedCount);
  const all = await listUnitsByProperty(propertyId);
  return all.filter((u) => u.status === 'vacant');
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
