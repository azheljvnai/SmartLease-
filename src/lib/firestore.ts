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

/** Recursively omit undefined values — Firestore rejects undefined field values. */
export function stripUndefined<T>(value: T): T {
  if (value === undefined) return value;
  if (value === null || typeof value !== 'object') return value;
  if (value instanceof Date || value instanceof Timestamp) return value;

  if (Array.isArray(value)) {
    return value.map((item) => stripUndefined(item)) as T;
  }

  const result: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (entry !== undefined) {
      result[key] = stripUndefined(entry);
    }
  }
  return result as T;
}
