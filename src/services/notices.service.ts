import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { db } from '../firebase/app';
import { COLLECTIONS } from '../firebase/config';
import type { Notice } from '../types';
import { docToData } from '../lib/firestore';

export async function listNoticesForProperty(propertyId?: string): Promise<Notice[]> {
  const col = collection(db, COLLECTIONS.notices);
  const q = propertyId
    ? query(col, where('propertyId', '==', propertyId), orderBy('effectiveDate', 'desc'))
    : query(col, orderBy('effectiveDate', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToData<Notice>(d));
}
