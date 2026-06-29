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

import type {

  Lease,

  LeaseAgreementFormData,

  LeaseDocumentFile,

  LeaseDocumentStatus,

  LeaseHistoryEntry,

  LeaseStatus,

  LeaseType,

} from '../types';

import {

  docToData,

  serializeTimestamp,

  serverTimestamps,

  stripUndefined,

  toTimestamp,

} from '../lib/firestore';

import { assignUnit, releaseUnit } from './units.service';

import { createActivity } from './activities.service';

import { notifyTenantUser } from './notifications.service';

import { generateLeaseAgreementPdf } from './lease-pdf.service';

import { previewLeaseDocument, uploadLeasePdf, uploadSignedLeasePdf } from './storage.service';

import { sendEmail, isEmailConfigured } from './email.service';

import { getTenant } from './tenants.service';

import { getCompanyBranding } from '../lib/company';

import { isLeaseExpiredByDate } from '../lib/lease-utils';

import { formatCurrency, formatDate } from '../lib/format';



const col = collection(db, COLLECTIONS.leases);



function historyCol(leaseId: string) {

  return collection(db, COLLECTIONS.leases, leaseId, 'history');

}



function agreementToLeaseFields(agreement: LeaseAgreementFormData) {

  return stripUndefined({

    tenantName: agreement.lessee.name,

    propertyName: agreement.property.propertyName,

    unitLabel: `Unit ${agreement.property.unitNumber}`,

    startDate: agreement.terms.startDate,

    endDate: agreement.terms.endDate,

    rent: agreement.terms.rent,

    deposit: agreement.terms.deposit,

    leaseType: agreement.terms.leaseType,

    agreement,

  });

}



async function logLeaseHistory(

  leaseId: string,

  action: string,

  details?: string,

  performedBy = 'admin',

): Promise<void> {

  await addDoc(historyCol(leaseId), {
    action,
    details,
    performedBy,
    ...serverTimestamps(),
  });
}



export async function listLeaseHistory(leaseId: string): Promise<LeaseHistoryEntry[]> {

  const snap = await getDocs(query(historyCol(leaseId), orderBy('createdAt', 'desc')));

  return snap.docs.map((d) => docToData<LeaseHistoryEntry>(d));

}



export function subscribeLeases(callback: (leases: Lease[]) => void): () => void {

  return onSnapshot(query(col, orderBy('createdAt', 'desc')), (snap) => {

    callback(snap.docs.map((d) => docToData<Lease>(d)));

  });

}



export async function listLeases(): Promise<Lease[]> {

  const snap = await getDocs(query(col, orderBy('createdAt', 'desc')));

  return snap.docs.map((d) => docToData<Lease>(d));

}



export async function listLeasesByTenant(tenantId: string): Promise<Lease[]> {

  const snap = await getDocs(query(col, where('tenantId', '==', tenantId)));

  return snap.docs.map((d) => docToData<Lease>(d));

}



export async function getLease(id: string): Promise<Lease | null> {

  const snap = await getDoc(doc(db, COLLECTIONS.leases, id));

  if (!snap.exists()) return null;

  const data = snap.data();

  return {

    id: snap.id,

    ...data,

    createdAt: serializeTimestamp(data.createdAt),

    updatedAt: serializeTimestamp(data.updatedAt),

  } as Lease;

}



export async function getActiveLeaseByTenant(tenantId: string): Promise<Lease | null> {

  const snap = await getDocs(

    query(col, where('tenantId', '==', tenantId), where('status', '==', 'active')),

  );

  if (snap.empty) return null;

  return docToData<Lease>(snap.docs[0]);

}



export async function getCurrentLeaseByTenant(tenantId: string): Promise<Lease | null> {
  const leases = await listLeasesByTenant(tenantId);
  if (leases.length === 0) return null;

  const sorted = [...leases].sort((a, b) => {
    const aMs = new Date(serializeTimestamp(a.createdAt)).getTime();
    const bMs = new Date(serializeTimestamp(b.createdAt)).getTime();
    return bMs - aMs;
  });

  return (
    sorted.find((l) => l.status === 'active') ??
    sorted.find((l) => l.documentStatus !== 'active_lease') ??
    sorted[0]
  );
}



export async function syncLeaseStatuses(): Promise<void> {

  const leases = await listLeases();

  const today = new Date().toISOString().split('T')[0];



  await Promise.all(

    leases

      .filter((l) => l.status === 'active' && isLeaseExpiredByDate(l))

      .map(async (lease) => {

        await updateDoc(doc(db, COLLECTIONS.leases, lease.id), {

          status: 'expired' as LeaseStatus,

          updatedAt: toTimestamp(),

        });

        await logLeaseHistory(

          lease.id,

          'Lease marked expired',

          `End date ${lease.endDate} passed on ${today}`,

          'system',

        );

      }),

  );

}



export async function createLeaseDraft(data: {

  tenantId: string;

  propertyId: string;

  unitId: string;

  agreement: LeaseAgreementFormData;

  previousLeaseId?: string;

  leaseType?: LeaseType;

}): Promise<string> {

  const ref = await addDoc(col, {

    tenantId: data.tenantId,

    propertyId: data.propertyId,

    unitId: data.unitId,

    status: 'pending' as LeaseStatus,

    documentStatus: 'draft' as LeaseDocumentStatus,

    previousLeaseId: data.previousLeaseId,

    ...agreementToLeaseFields(data.agreement),

    ...serverTimestamps(),

  });



  await assignUnit(data.unitId, data.propertyId, data.tenantId, ref.id);



  await logLeaseHistory(ref.id, 'Lease draft created', data.previousLeaseId ? 'Renewal draft' : undefined);



  await createActivity({

    type: 'lease',

    tenantId: data.tenantId,

    tenantName: data.agreement.lessee.name,

    action: 'Lease draft created',

    status: 'pending',

  });



  await notifyTenantUser(data.tenantId, {

    title: 'New lease created',

    body: `A new lease has been created for ${data.agreement.property.propertyName}, Unit ${data.agreement.property.unitNumber}.`,

    type: 'lease',

    subject: 'New lease — SmartLease',

  });



  return ref.id;

}



/** @deprecated Use createLeaseDraft + generateLeaseAgreement */

export async function createLease(data: {

  tenantId: string;

  propertyId: string;

  unitId: string;

  tenantName: string;

  propertyName: string;

  unitLabel: string;

  startDate: string;

  endDate: string;

  rent: number;

  deposit: number;

  status?: LeaseStatus;

  documentPath?: string;

}): Promise<string> {

  const agreement: LeaseAgreementFormData = {

    lessor: { name: 'Property Owner', email: '', phone: '' },

    lessee: { name: data.tenantName, email: '', phone: '' },

    property: {

      propertyName: data.propertyName,

      address: '',

      unitNumber: data.unitLabel.replace(/^Unit\s*/i, ''),

    },

    terms: {

      startDate: data.startDate,

      endDate: data.endDate,

      rent: data.rent,

      deposit: data.deposit,

      paymentSchedule: 'monthly',

      paymentDueDay: 1,

      leaseType: 'fixed_term',

    },

  };



  const leaseId = await createLeaseDraft({

    tenantId: data.tenantId,

    propertyId: data.propertyId,

    unitId: data.unitId,

    agreement,

  });



  await generateLeaseAgreement(leaseId);

  await activateLease(leaseId);

  return leaseId;

}



export async function updateLeaseAgreement(

  id: string,

  agreement: LeaseAgreementFormData,

): Promise<void> {

  await updateDoc(doc(db, COLLECTIONS.leases, id), {

    ...agreementToLeaseFields(agreement),

    updatedAt: toTimestamp(),

  });

  await logLeaseHistory(id, 'Lease agreement updated');

}



export async function generateLeaseAgreement(leaseId: string): Promise<void> {

  const lease = await getLease(leaseId);

  if (!lease?.agreement) {

    throw new Error('Lease agreement form data is missing.');

  }



  const pdfBytes = await generateLeaseAgreementPdf(lease.agreement, {

    leaseId,

    tenantId: lease.tenantId,

    propertyId: lease.propertyId,

    generatedAt: new Date(),

  });

  const uploaded = await uploadLeasePdf(leaseId, 'unsigned', pdfBytes);



  const unsigned: LeaseDocumentFile = stripUndefined({

    storagePath: uploaded.storagePath,

    downloadUrl: uploaded.downloadUrl || undefined,

    inlineStorageId: uploaded.inlineStorageId,

    fileName: `lease-agreement-${leaseId}.pdf`,

    uploadedAt: new Date().toISOString(),

  });



  await updateDoc(doc(db, COLLECTIONS.leases, leaseId), {

    documents: stripUndefined({ ...lease.documents, unsigned }),

    documentStatus: 'lease_agreement_generated',

    updatedAt: toTimestamp(),

  });



  await logLeaseHistory(leaseId, 'Lease agreement PDF generated');



  await createActivity({

    type: 'lease',

    tenantId: lease.tenantId,

    tenantName: lease.tenantName,

    action: 'Lease agreement PDF generated',

    status: 'success',

  });



  await notifyTenantUser(lease.tenantId, {

    title: 'Lease agreement ready',

    body: 'Your lease agreement is ready. Please print, sign in person, and upload the signed copy.',

    type: 'lease',

  });

}



export async function regenerateLeaseAgreement(leaseId: string): Promise<void> {

  const lease = await getLease(leaseId);

  if (!lease) throw new Error('Lease not found.');

  if (lease.documentStatus === 'active_lease') {

    throw new Error('Cannot regenerate PDF for an active lease.');

  }

  await generateLeaseAgreement(leaseId);

  await markLeaseAwaitingSignedCopy(leaseId);

  await logLeaseHistory(leaseId, 'Lease agreement PDF regenerated');

}



export async function uploadSignedLeaseAgreement(

  leaseId: string,

  file: File,

  uploadedBy: 'admin' | 'tenant' = 'admin',

): Promise<void> {

  const lease = await getLease(leaseId);

  if (!lease) throw new Error('Lease not found.');



  const uploaded = await uploadSignedLeasePdf(leaseId, file);

  const signed: LeaseDocumentFile = stripUndefined({

    storagePath: uploaded.storagePath,

    downloadUrl: uploaded.downloadUrl || undefined,

    inlineStorageId: uploaded.inlineStorageId,

    fileName: file.name || `signed-lease-${leaseId}.pdf`,

    uploadedAt: new Date().toISOString(),

  });



  await updateDoc(doc(db, COLLECTIONS.leases, leaseId), {

    documents: stripUndefined({ ...lease.documents, signed }),

    documentStatus: 'signed_lease_uploaded',

    updatedAt: toTimestamp(),

  });



  await logLeaseHistory(leaseId, `Signed lease uploaded by ${uploadedBy}`);



  await createActivity({

    type: 'lease',

    tenantId: lease.tenantId,

    tenantName: lease.tenantName,

    action: `Signed lease uploaded by ${uploadedBy}`,

    status: 'success',

  });



  await notifyTenantUser(lease.tenantId, {

    title: 'Signed lease received',

    body: 'A signed copy of your lease agreement has been uploaded.',

    type: 'lease',

  });

}



export async function markLeaseAwaitingSignedCopy(leaseId: string): Promise<void> {

  await updateDoc(doc(db, COLLECTIONS.leases, leaseId), {

    documentStatus: 'awaiting_signed_copy',

    updatedAt: toTimestamp(),

  });

  await logLeaseHistory(leaseId, 'Marked awaiting signed copy');

}



export async function activateLease(leaseId: string): Promise<void> {

  const lease = await getLease(leaseId);

  if (!lease) throw new Error('Lease not found.');

  if (!lease.documents?.signed) {

    throw new Error('Upload the signed lease agreement before activation.');

  }



  await updateDoc(doc(db, COLLECTIONS.leases, leaseId), {

    status: 'active' as LeaseStatus,

    documentStatus: 'active_lease' as LeaseDocumentStatus,

    updatedAt: toTimestamp(),

  });



  await logLeaseHistory(leaseId, 'Lease activated');



  await createActivity({

    type: 'lease',

    tenantId: lease.tenantId,

    tenantName: lease.tenantName,

    action: 'Lease activated',

    status: 'success',

  });



  await notifyTenantUser(lease.tenantId, {

    title: 'Lease active',

    body: `Your lease at ${lease.propertyName} (${lease.unitLabel}) is now active.`,

    type: 'lease',

  });

}



export async function terminateLease(

  leaseId: string,

  reason?: string,

): Promise<void> {

  const lease = await getLease(leaseId);

  if (!lease) throw new Error('Lease not found.');



  await updateDoc(doc(db, COLLECTIONS.leases, leaseId), {

    status: 'terminated' as LeaseStatus,

    terminatedAt: new Date().toISOString().split('T')[0],

    terminationReason: reason?.trim() || undefined,

    updatedAt: toTimestamp(),

  });



  await releaseUnit(lease.unitId, lease.propertyId);

  await logLeaseHistory(leaseId, 'Lease terminated', reason);



  await createActivity({

    type: 'lease',

    tenantId: lease.tenantId,

    tenantName: lease.tenantName,

    action: 'Lease terminated',

    status: 'danger',

  });



  await notifyTenantUser(lease.tenantId, {

    title: 'Lease terminated',

    body: reason

      ? `Your lease at ${lease.propertyName} has been terminated. Reason: ${reason}`

      : `Your lease at ${lease.propertyName} has been terminated.`,

    type: 'lease',

  });

}



export async function renewLease(

  oldLeaseId: string,

  agreementUpdates?: Partial<LeaseAgreementFormData>,

): Promise<string> {

  const oldLease = await getLease(oldLeaseId);

  if (!oldLease?.agreement) throw new Error('Original lease not found or missing agreement data.');



  const agreement: LeaseAgreementFormData = {

    ...oldLease.agreement,

    ...agreementUpdates,

    lessee: { ...oldLease.agreement.lessee, ...agreementUpdates?.lessee },

    lessor: { ...oldLease.agreement.lessor, ...agreementUpdates?.lessor },

    property: { ...oldLease.agreement.property, ...agreementUpdates?.property },

    terms: { ...oldLease.agreement.terms, ...agreementUpdates?.terms },

  };



  const newLeaseId = await createLeaseDraft({

    tenantId: oldLease.tenantId,

    propertyId: oldLease.propertyId,

    unitId: oldLease.unitId,

    agreement,

    previousLeaseId: oldLeaseId,

  });



  await updateDoc(doc(db, COLLECTIONS.leases, oldLeaseId), {

    status: 'renewed' as LeaseStatus,

    renewedToLeaseId: newLeaseId,

    updatedAt: toTimestamp(),

  });



  await logLeaseHistory(oldLeaseId, 'Lease renewed', `New lease: ${newLeaseId}`);

  await logLeaseHistory(newLeaseId, 'Created as renewal', `Previous lease: ${oldLeaseId}`);



  return newLeaseId;

}



export async function deleteLease(leaseId: string): Promise<void> {

  const lease = await getLease(leaseId);

  if (!lease) throw new Error('Lease not found.');



  if (lease.status === 'active' || lease.documentStatus === 'active_lease') {

    throw new Error('Cannot delete an active lease. Terminate it first.');

  }

  if (lease.documents?.signed) {

    throw new Error('Cannot delete a lease with a signed document on file.');

  }



  await releaseUnit(lease.unitId, lease.propertyId);

  await logLeaseHistory(leaseId, 'Lease deleted');

  await deleteDoc(doc(db, COLLECTIONS.leases, leaseId));



  await createActivity({

    type: 'lease',

    tenantId: lease.tenantId,

    tenantName: lease.tenantName,

    action: 'Lease deleted',

    status: 'danger',

  });

}



export async function forceDeleteLease(leaseId: string, tenantId?: string): Promise<void> {

  const lease = await getLease(leaseId);

  if (!lease) return;



  const historySnap = await getDocs(historyCol(leaseId));

  await Promise.all(historySnap.docs.map((d) => deleteDoc(d.ref)));



  const docFilesCol = collection(db, COLLECTIONS.leases, leaseId, 'documentFiles');

  const docFilesSnap = await getDocs(docFilesCol);

  await Promise.all(docFilesSnap.docs.map((d) => deleteDoc(d.ref)));



  const targetTenantId = tenantId ?? lease.tenantId;

  if (lease.unitId && lease.propertyId) {

    const unitSnap = await getDoc(doc(db, COLLECTIONS.units, lease.unitId));

    if (unitSnap.exists() && unitSnap.data().tenantId === targetTenantId) {

      await releaseUnit(lease.unitId, lease.propertyId);

    }

  }



  await deleteDoc(doc(db, COLLECTIONS.leases, leaseId));

}



export async function previewLeasePdf(

  lease: Lease,

  type: 'unsigned' | 'signed' = 'unsigned',

): Promise<void> {

  const file = type === 'signed' ? lease.documents?.signed : lease.documents?.unsigned;

  if (!file) throw new Error(`${type === 'signed' ? 'Signed' : 'Unsigned'} lease document not found.`);

  await previewLeaseDocument(file, lease.id);

}



export async function sendLeaseByEmail(leaseId: string): Promise<'sent' | 'skipped' | 'failed'> {

  const lease = await getLease(leaseId);

  if (!lease) throw new Error('Lease not found.');



  const tenant = await getTenant(lease.tenantId);

  if (!tenant?.email) throw new Error('Tenant email not found.');



  if (!isEmailConfigured()) {

    await logLeaseHistory(leaseId, 'Lease email skipped', 'Email service not configured');

    return 'skipped';

  }



  const company = getCompanyBranding();

  const docFile = lease.documents?.unsigned ?? lease.documents?.signed;

  const linkNote = docFile?.downloadUrl

    ? `\n\nDownload your lease agreement: ${docFile.downloadUrl}`

    : '\n\nPlease log in to the tenant portal to download your lease agreement.';



  try {

    await sendEmail({

      to_email: tenant.email,

      to_name: tenant.name,

      subject: `Lease Agreement — ${lease.propertyName}`,

      message: `Dear ${tenant.name},



Your lease agreement for ${lease.propertyName} (${lease.unitLabel}) is ready.



Lease period: ${formatDate(lease.startDate)} – ${formatDate(lease.endDate)}

Monthly rent: ${formatCurrency(lease.rent)}

Security deposit: ${formatCurrency(lease.deposit)}${linkNote}



If you have questions, contact ${company.name}.



Thank you,

${company.name}`,

    });

    await logLeaseHistory(leaseId, 'Lease agreement emailed', tenant.email);

    return 'sent';

  } catch (err) {

    await logLeaseHistory(leaseId, 'Lease email failed', String(err));

    return 'failed';

  }

}



export async function updateLease(id: string, data: Partial<Lease>): Promise<void> {

  const { id: _id, createdAt, ...rest } = data;

  await updateDoc(doc(db, COLLECTIONS.leases, id), {

    ...rest,

    updatedAt: toTimestamp(),

  });

}


