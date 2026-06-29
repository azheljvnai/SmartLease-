import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../firebase/app';
import { COLLECTIONS } from '../firebase/config';
import type { Activity, ActivityStatus, ActivityType } from '../types';
import { docToData, serverTimestamps, serializeTimestamp } from '../lib/firestore';
import { formatRelativeTime } from '../lib/format';

const col = collection(db, COLLECTIONS.activities);

export async function listRecentActivities(count = 10): Promise<Activity[]> {
  const snap = await getDocs(query(col, orderBy('createdAt', 'desc'), limit(count)));
  return snap.docs.map((d) => {
    const activity = docToData<Activity>(d);
    const created = serializeTimestamp(activity.createdAt);
    return {
      ...activity,
      time:
        activity.time ||
        formatRelativeTime(created instanceof Date ? created : new Date(created)),
    };
  });
}

export function subscribeActivities(
  callback: (activities: Activity[]) => void,
  count = 10,
): () => void {
  return onSnapshot(query(col, orderBy('createdAt', 'desc'), limit(count)), (snap) => {
    callback(
      snap.docs.map((d) => {
        const activity = docToData<Activity>(d);
        const created = serializeTimestamp(activity.createdAt);
        return {
          ...activity,
          time:
            activity.time ||
            formatRelativeTime(created instanceof Date ? created : new Date(created)),
        };
      }),
    );
  });
}

export async function createActivity(data: {
  type: ActivityType;
  tenantId?: string;
  tenantName: string;
  action: string;
  amount?: string;
  status: ActivityStatus;
}): Promise<void> {
  await addDoc(col, {
    ...data,
    time: 'just now',
    ...serverTimestamps(),
  });
}

export async function listActivitiesByTenant(tenantId: string): Promise<Activity[]> {
  const snap = await getDocs(query(col, where('tenantId', '==', tenantId)));
  return snap.docs.map((d) => docToData<Activity>(d));
}

export async function deleteActivity(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.activities, id));
}
