import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytes,
} from 'firebase/storage';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { app, db } from '../firebase/app';
import { COLLECTIONS, isFirebaseStorageEnabled } from '../firebase/config';

const MAX_INLINE_BYTES = 900_000;

export function isStorageEnabled(): boolean {
  return isFirebaseStorageEnabled();
}

function getFirebaseStorage() {
  if (!isFirebaseStorageEnabled()) {
    throw new Error(
      'Firebase Storage is not enabled. Set VITE_USE_FIREBASE_STORAGE=true after enabling Storage in the Firebase console (Blaze plan).',
    );
  }
  return getStorage(app);
}

export function leaseDocumentPath(
  leaseId: string,
  type: 'unsigned' | 'signed',
): string {
  return `leases/${leaseId}/${type}/agreement.pdf`;
}

export function invoiceDocumentPath(invoiceId: string): string {
  return `invoices/${invoiceId}/statement.pdf`;
}

function leaseInlineDocRef(leaseId: string, type: 'unsigned' | 'signed') {
  return doc(db, COLLECTIONS.leases, leaseId, 'documentFiles', type);
}

export async function saveLeaseInlineDocument(
  leaseId: string,
  type: 'unsigned' | 'signed',
  inlineData: string,
  fileName: string,
): Promise<void> {
  await setDoc(leaseInlineDocRef(leaseId, type), { inlineData, fileName });
}

export async function getLeaseInlineDocument(
  leaseId: string,
  type: 'unsigned' | 'signed',
): Promise<{ inlineData: string; fileName: string } | null> {
  const snap = await getDoc(leaseInlineDocRef(leaseId, type));
  if (!snap.exists()) return null;
  const data = snap.data();
  if (!data.inlineData) return null;
  return { inlineData: data.inlineData as string, fileName: (data.fileName as string) || 'lease.pdf' };
}

async function storePdfBlob(
  path: string,
  blob: Blob,
): Promise<{ storagePath: string; downloadUrl: string; inlineData?: string }> {
  if (isFirebaseStorageEnabled()) {
    try {
      const storageRef = ref(getFirebaseStorage(), path);
      await uploadBytes(storageRef, blob, { contentType: 'application/pdf' });
      const downloadUrl = await getDownloadURL(storageRef);
      return { storagePath: path, downloadUrl };
    } catch (err) {
      console.warn('Firebase Storage upload failed; using inline Firestore storage.', err);
    }
  }

  if (blob.size > MAX_INLINE_BYTES) {
    throw new Error(
      `PDF is too large (${Math.round(blob.size / 1024)}KB). Enable Firebase Storage (Blaze plan), set VITE_USE_FIREBASE_STORAGE=true, and deploy storage rules — or upload a smaller file.`,
    );
  }

  const inlineData = await blobToBase64(blob);
  return { storagePath: path, downloadUrl: '', inlineData };
}

export async function uploadInvoicePdf(
  invoiceId: string,
  pdfBytes: Uint8Array,
): Promise<{ storagePath: string; downloadUrl: string; inlineData?: string }> {
  const path = invoiceDocumentPath(invoiceId);
  const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
  return storePdfBlob(path, blob);
}

export async function downloadInvoicePdf(file: {
  downloadUrl?: string;
  inlineData?: string;
  fileName: string;
}): Promise<void> {
  return downloadLeaseDocument(file);
}

export async function uploadLeasePdf(
  leaseId: string,
  type: 'unsigned' | 'signed',
  pdfBytes: Uint8Array,
): Promise<{
  storagePath: string;
  downloadUrl: string;
  inlineData?: string;
  inlineStorageId?: 'unsigned' | 'signed';
}> {
  const path = leaseDocumentPath(leaseId, type);
  const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
  const result = await storePdfBlob(path, blob);

  if (result.inlineData) {
    await saveLeaseInlineDocument(leaseId, type, result.inlineData, `lease-agreement-${leaseId}.pdf`);
    return {
      storagePath: result.storagePath,
      downloadUrl: result.downloadUrl,
      inlineStorageId: type,
    };
  }

  return result;
}

export async function uploadSignedLeasePdf(
  leaseId: string,
  file: File,
): Promise<{
  storagePath: string;
  downloadUrl: string;
  inlineData?: string;
  inlineStorageId?: 'unsigned' | 'signed';
}> {
  if (file.type !== 'application/pdf') {
    throw new Error('Signed lease must be a PDF file.');
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const path = leaseDocumentPath(leaseId, 'signed');
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const result = await storePdfBlob(path, blob);

  if (result.inlineData) {
    await saveLeaseInlineDocument(leaseId, 'signed', result.inlineData, file.name || `signed-lease-${leaseId}.pdf`);
    return {
      storagePath: result.storagePath,
      downloadUrl: result.downloadUrl,
      inlineStorageId: 'signed',
    };
  }

  return { ...result, storagePath: path };
}

export function resolveDocumentUrl(file: {
  downloadUrl?: string;
  inlineData?: string;
}): string | null {
  if (file.downloadUrl) return file.downloadUrl;
  if (file.inlineData) return file.inlineData;
  return null;
}

export async function downloadLeaseDocument(
  file: {
    downloadUrl?: string;
    inlineData?: string;
    inlineStorageId?: 'unsigned' | 'signed';
    fileName: string;
  },
  leaseId?: string,
): Promise<void> {
  let url = resolveDocumentUrl(file);

  if (!url && file.inlineStorageId && leaseId) {
    const inline = await getLeaseInlineDocument(leaseId, file.inlineStorageId);
    if (inline) url = inline.inlineData;
  }

  if (!url) throw new Error('Document is not available for download.');

  const link = document.createElement('a');
  link.href = url;
  link.download = file.fileName;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function previewLeaseDocument(
  file: {
    downloadUrl?: string;
    inlineData?: string;
    inlineStorageId?: 'unsigned' | 'signed';
    fileName: string;
  },
  leaseId?: string,
): Promise<void> {
  let url = resolveDocumentUrl(file);

  if (!url && file.inlineStorageId && leaseId) {
    const inline = await getLeaseInlineDocument(leaseId, file.inlineStorageId);
    if (inline) url = inline.inlineData;
  }

  if (!url) throw new Error('Document is not available for preview.');

  window.open(url, '_blank', 'noopener,noreferrer');
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsDataURL(blob);
  });
}
