import {
  type DocumentData,
  type QueryDocumentSnapshot,
  Timestamp,
} from 'firebase/firestore';

export function docToData<T extends { id: string }>(
  snap: QueryDocumentSnapshot<DocumentData>,
): T {
  const data = snap.data();
  return {
    id: snap.id,
    ...data,
    createdAt: serializeTimestamp(data.createdAt),
    updatedAt: serializeTimestamp(data.updatedAt),
  } as unknown as T;
}

export function serializeTimestamp(value: unknown): Date | string {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  if (typeof value === 'string') return value;
  return new Date();
}

export function toTimestamp(date?: Date | string): Timestamp {
  if (!date) return Timestamp.now();
  if (typeof date === 'string') return Timestamp.fromDate(new Date(date));
  return Timestamp.fromDate(date);
}

export function serverTimestamps() {
  return {
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
}
