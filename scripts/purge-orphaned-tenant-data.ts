import 'dotenv/config';
import { readFileSync, existsSync } from 'fs';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (!projectId) {
  console.error('Set FIREBASE_PROJECT_ID or VITE_FIREBASE_PROJECT_ID');
  process.exit(1);
}

if (!credPath || !existsSync(credPath)) {
  console.error('Set GOOGLE_APPLICATION_CREDENTIALS to your service account JSON path');
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(credPath, 'utf8'));

if (getApps().length === 0) {
  initializeApp({ credential: cert(serviceAccount), projectId });
}

const db = getFirestore();

function isOrphan(tenantId: string | undefined, validTenantIds: Set<string>): boolean {
  return Boolean(tenantId && !validTenantIds.has(tenantId));
}

async function deleteLeaseWithSubcollections(
  leaseId: string,
  tenantId: string,
): Promise<void> {
  const leaseRef = db.collection('leases').doc(leaseId);
  const leaseSnap = await leaseRef.get();
  if (!leaseSnap.exists) return;

  const lease = leaseSnap.data()!;

  const historySnap = await leaseRef.collection('history').get();
  if (!historySnap.empty) {
    const batch = db.batch();
    historySnap.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  }

  const docFilesSnap = await leaseRef.collection('documentFiles').get();
  if (!docFilesSnap.empty) {
    const batch = db.batch();
    docFilesSnap.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  }

  if (lease.unitId && lease.propertyId) {
    const unitRef = db.collection('units').doc(lease.unitId as string);
    const unitSnap = await unitRef.get();
    if (unitSnap.exists && unitSnap.data()?.tenantId === tenantId) {
      await unitRef.update({
        status: 'vacant',
        tenantId: null,
        leaseId: null,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  }

  await leaseRef.delete();
}

async function deleteMaintenanceWithSubcollections(requestId: string): Promise<void> {
  const requestRef = db.collection('maintenanceRequests').doc(requestId);

  const updatesSnap = await requestRef.collection('updates').get();
  if (!updatesSnap.empty) {
    const batch = db.batch();
    updatesSnap.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  }

  await requestRef.delete();
}

async function purgeOrphanedTenantReferences(): Promise<number> {
  const tenantsSnap = await db.collection('tenants').get();
  const validTenantIds = new Set(tenantsSnap.docs.map((doc) => doc.id));
  let removed = 0;

  const leasesSnap = await db.collection('leases').get();
  for (const leaseDoc of leasesSnap.docs) {
    const tenantId = leaseDoc.data().tenantId as string | undefined;
    if (!isOrphan(tenantId, validTenantIds)) continue;
    await deleteLeaseWithSubcollections(leaseDoc.id, tenantId!);
    removed++;
    console.log(`  Deleted orphan lease: ${leaseDoc.id} (tenant: ${tenantId})`);
  }

  const invoicesSnap = await db.collection('invoices').get();
  for (const invoiceDoc of invoicesSnap.docs) {
    const tenantId = invoiceDoc.data().tenantId as string | undefined;
    if (!isOrphan(tenantId, validTenantIds)) continue;
    await invoiceDoc.ref.delete();
    removed++;
    console.log(`  Deleted orphan invoice: ${invoiceDoc.id} (tenant: ${tenantId})`);
  }

  const paymentsSnap = await db.collection('payments').get();
  for (const paymentDoc of paymentsSnap.docs) {
    const tenantId = paymentDoc.data().tenantId as string | undefined;
    if (!isOrphan(tenantId, validTenantIds)) continue;
    await paymentDoc.ref.delete();
    removed++;
    console.log(`  Deleted orphan payment: ${paymentDoc.id} (tenant: ${tenantId})`);
  }

  const maintenanceSnap = await db.collection('maintenanceRequests').get();
  for (const requestDoc of maintenanceSnap.docs) {
    const tenantId = requestDoc.data().tenantId as string | undefined;
    if (!isOrphan(tenantId, validTenantIds)) continue;
    await deleteMaintenanceWithSubcollections(requestDoc.id);
    removed++;
    console.log(`  Deleted orphan maintenance: ${requestDoc.id} (tenant: ${tenantId})`);
  }

  const paymentMethodsSnap = await db.collection('paymentMethods').get();
  for (const methodDoc of paymentMethodsSnap.docs) {
    const tenantId = methodDoc.data().tenantId as string | undefined;
    if (!isOrphan(tenantId, validTenantIds)) continue;
    await methodDoc.ref.delete();
    removed++;
    console.log(`  Deleted orphan payment method: ${methodDoc.id} (tenant: ${tenantId})`);
  }

  const activitiesSnap = await db.collection('activities').get();
  for (const activityDoc of activitiesSnap.docs) {
    const tenantId = activityDoc.data().tenantId as string | undefined;
    if (!isOrphan(tenantId, validTenantIds)) continue;
    await activityDoc.ref.delete();
    removed++;
    console.log(`  Deleted orphan activity: ${activityDoc.id} (tenant: ${tenantId})`);
  }

  const usersSnap = await db.collection('users').get();
  for (const userDoc of usersSnap.docs) {
    const tenantId = userDoc.data().tenantId as string | undefined;
    if (!isOrphan(tenantId, validTenantIds)) continue;
    await userDoc.ref.update({
      tenantId: FieldValue.delete(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    removed++;
    console.log(`  Unlinked orphan tenantId from user: ${userDoc.id} (tenant: ${tenantId})`);
  }

  return removed;
}

async function main() {
  console.log('Purging orphaned tenant references...\n');
  const removed = await purgeOrphanedTenantReferences();
  console.log(`\nDone. Removed ${removed} orphaned record${removed === 1 ? '' : 's'}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
