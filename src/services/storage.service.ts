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
const MAX_SIGNED_LEASE_STORAGE_BYTES = 10 * 1024 * 1024;

/** Max signed-lease upload size: ~900KB inline on Spark, 10MB when Firebase Storage is enabled. */
export function maxSignedLeaseUploadBytes(): number {
  return isFirebaseStorageEnabled() ? MAX_SIGNED_LEASE_STORAGE_BYTES : MAX_INLINE_BYTES;
}

export function usesInlineDocumentStorage(): boolean {
  return !isFirebaseStorageEnabled();
}

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
      `PDF is too large (${Math.round(blob.size / 1024)}KB). On the Spark (free) plan, files are stored in Firestore with a ~900KB limit — use a smaller or compressed PDF.`,
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
  contentType: string;
}> {
  return uploadSignedLeaseFile(leaseId, file);
}

const SIGNED_LEASE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
];

export async function uploadSignedLeaseFile(
  leaseId: string,
  file: File,
): Promise<{
  storagePath: string;
  downloadUrl: string;
  inlineData?: string;
  inlineStorageId?: 'unsigned' | 'signed';
  contentType: string;
}> {
  if (!SIGNED_LEASE_TYPES.includes(file.type)) {
    throw new Error('Signed lease must be a PDF or image (JPEG, PNG, WebP).');
  }

  const maxBytes = maxSignedLeaseUploadBytes();
  if (file.size > maxBytes) {
    const limitKb = Math.round(maxBytes / 1024);
    throw new Error(
      usesInlineDocumentStorage()
        ? `Signed lease must be under ${limitKb}KB on the Spark plan. Use a compressed PDF or a smaller photo.`
        : `Signed lease file must be under ${Math.round(maxBytes / (1024 * 1024))}MB.`,
    );
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_') || `signed-lease-${leaseId}`;
  const path = `leases/${leaseId}/signed/${safeName}`;
  const blob = new Blob([await file.arrayBuffer()], { type: file.type });

  const inlineLimit = usesInlineDocumentStorage() ? MAX_INLINE_BYTES : MAX_SIGNED_LEASE_STORAGE_BYTES;

  let result: { storagePath: string; downloadUrl: string; inlineData?: string };
  if (file.type === 'application/pdf') {
    result = await storePdfBlob(path, blob);
  } else {
    result = await storeFileBlob(path, blob, file.type, inlineLimit);
  }

  if (result.inlineData) {
    await saveLeaseInlineDocument(leaseId, 'signed', result.inlineData, safeName);
    return {
      storagePath: result.storagePath,
      downloadUrl: result.downloadUrl,
      inlineStorageId: 'signed',
      contentType: file.type,
    };
  }

  return { ...result, storagePath: path, contentType: file.type };
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

async function resolveLeaseDocumentUrl(
  file: {
    downloadUrl?: string;
    inlineData?: string;
    inlineStorageId?: 'unsigned' | 'signed';
    fileName: string;
  },
  leaseId?: string,
): Promise<string> {
  let url = resolveDocumentUrl(file);

  if (!url && file.inlineStorageId && leaseId) {
    const inline = await getLeaseInlineDocument(leaseId, file.inlineStorageId);
    if (inline) url = inline.inlineData;
  }

  if (!url) throw new Error('Document is not available.');
  return url;
}

export async function printLeaseDocument(
  file: {
    downloadUrl?: string;
    inlineData?: string;
    inlineStorageId?: 'unsigned' | 'signed';
    fileName: string;
    contentType?: string;
  },
  leaseId?: string,
): Promise<void> {
  const url = await resolveLeaseDocumentUrl(file, leaseId);
  const isPdf = file.contentType === 'application/pdf' || file.fileName.toLowerCase().endsWith('.pdf');

  if (isPdf) {
    const printWindow = window.open(url, '_blank', 'noopener,noreferrer');
    if (printWindow) {
      printWindow.addEventListener('load', () => {
        printWindow.focus();
        printWindow.print();
      });
    }
    return;
  }

  const printWindow = window.open('', '_blank', 'noopener,noreferrer');
  if (!printWindow) throw new Error('Pop-up blocked. Allow pop-ups to print this document.');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head><title>${file.fileName}</title></head>
      <body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;">
        <img src="${url}" alt="Lease document" style="max-width:100%;height:auto;" onload="window.print();" />
      </body>
    </html>
  `);
  printWindow.document.close();
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsDataURL(blob);
  });
}

const MAX_RECEIPT_BYTES = 2_000_000;
const MAX_QR_BYTES = 1_000_000;

const RECEIPT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

export function paymentReceiptPath(paymentId: string, fileName: string): string {
  return `payments/${paymentId}/${fileName}`;
}

export function paymentQrPath(method: string): string {
  return `settings/payment-qr/${method}`;
}

async function storeFileBlob(
  path: string,
  blob: Blob,
  contentType: string,
  maxInlineBytes: number,
): Promise<{ storagePath: string; downloadUrl: string; inlineData?: string; contentType: string; fileName: string }> {
  const fileName = path.split('/').pop() ?? 'file';

  if (isFirebaseStorageEnabled()) {
    try {
      const storageRef = ref(getFirebaseStorage(), path);
      await uploadBytes(storageRef, blob, { contentType });
      const downloadUrl = await getDownloadURL(storageRef);
      return { storagePath: path, downloadUrl, contentType, fileName };
    } catch (err) {
      console.warn('Firebase Storage upload failed; using inline storage.', err);
    }
  }

  if (blob.size > maxInlineBytes) {
    throw new Error(
      usesInlineDocumentStorage()
        ? `File is too large (${Math.round(blob.size / 1024)}KB). Spark plan stores files in Firestore (~${Math.round(maxInlineBytes / 1024)}KB max) — use a smaller or compressed file.`
        : `File is too large (${Math.round(blob.size / 1024)}KB). Use a smaller file.`,
    );
  }

  const inlineData = await blobToBase64(blob);
  return { storagePath: path, downloadUrl: '', inlineData, contentType, fileName };
}

export async function uploadPaymentReceipt(
  paymentId: string,
  file: File,
): Promise<{ fileName: string; downloadUrl?: string; inlineData?: string; contentType: string }> {
  if (!RECEIPT_TYPES.includes(file.type)) {
    throw new Error('Receipt must be a JPEG, PNG, WebP image, or PDF.');
  }
  if (file.size > MAX_RECEIPT_BYTES) {
    throw new Error('Receipt must be under 2MB.');
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = paymentReceiptPath(paymentId, safeName);
  const blob = new Blob([await file.arrayBuffer()], { type: file.type });
  const result = await storeFileBlob(path, blob, file.type, MAX_RECEIPT_BYTES);
  return {
    fileName: safeName,
    downloadUrl: result.downloadUrl || undefined,
    inlineData: result.inlineData,
    contentType: file.type,
  };
}

export async function uploadPaymentQrImage(
  method: string,
  file: File,
): Promise<{ downloadUrl: string; inlineData?: string }> {
  if (!file.type.startsWith('image/')) {
    throw new Error('QR code must be an image file.');
  }
  if (file.size > MAX_QR_BYTES) {
    throw new Error('QR image must be under 1MB.');
  }

  const ext = file.name.split('.').pop() ?? 'png';
  const path = `${paymentQrPath(method)}.${ext}`;
  const blob = new Blob([await file.arrayBuffer()], { type: file.type });
  const result = await storeFileBlob(path, blob, file.type, MAX_QR_BYTES);
  return { downloadUrl: result.downloadUrl, inlineData: result.inlineData };
}
