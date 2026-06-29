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
import type { Notice } from '../types';
import { docToData, serverTimestamps } from '../lib/firestore';
import { listTenants } from './tenants.service';
import { notifyUser } from './notifications.service';

const col = collection(db, COLLECTIONS.notices);

export async function listNoticesForProperty(propertyId?: string): Promise<Notice[]> {
  const q = propertyId
    ? query(col, where('propertyId', '==', propertyId), orderBy('effectiveDate', 'desc'))
    : query(col, orderBy('effectiveDate', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToData<Notice>(d));
}

export async function listAllNotices(): Promise<Notice[]> {
  const snap = await getDocs(query(col, orderBy('effectiveDate', 'desc')));
  return snap.docs.map((d) => docToData<Notice>(d));
}

export async function createNotice(data: {
  title: string;
  body: string;
  propertyId?: string;
  effectiveDate: string;
}): Promise<string> {
  const ref = await addDoc(col, {
    ...data,
    ...serverTimestamps(),
  });

  const tenants = await listTenants();
  const targets = data.propertyId
    ? tenants.filter((t) => t.propertyId === data.propertyId && t.userId)
    : tenants.filter((t) => t.userId);

  await Promise.all(
    targets.map((t) =>
      notifyUser(t.userId!, {
        title: data.title,
        body: data.body,
        type: 'notice',
        subject: data.title,
      }),
    ),
  );

  return ref.id;
}
