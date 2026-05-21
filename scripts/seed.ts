import 'dotenv/config';
import { readFileSync, existsSync } from 'fs';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import {
  SEED_ACTIVITIES,
  SEED_INVOICES,
  SEED_MAINTENANCE,
  SEED_NOTICES,
  SEED_PROPERTIES,
  SEED_TECHNICIANS,
  SEED_TENANTS,
  SEED_UNITS,
  SEED_USERS,
} from './seed-data.js';

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

const auth = getAuth();
const db = getFirestore();
const now = Timestamp.now();

async function upsertAuthUser(user: (typeof SEED_USERS)[0]): Promise<string> {
  let uid: string;
  try {
    const existing = await auth.getUserByEmail(user.email);
    uid = existing.uid;
    await auth.updateUser(uid, { password: user.password });
  } catch {
    const created = await auth.createUser({
      email: user.email,
      password: user.password,
      displayName: `${user.firstName} ${user.lastName}`,
    });
    uid = created.uid;
  }

  await auth.setCustomUserClaims(uid, { role: user.role });

  const userDoc: Record<string, unknown> = {
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    role: user.role,
    notificationEmail: true,
    notificationSms: false,
    twoFactorEnabled: false,
    updatedAt: now,
    createdAt: now,
  };

  if ('tenantKey' in user && user.tenantKey) {
    userDoc.tenantId = `tenant-${user.tenantKey}`;
  }

  await db.collection('users').doc(uid).set(userDoc, { merge: true });
  return uid;
}

async function seed() {
  console.log('Seeding SmartLease database...');

  for (const p of SEED_PROPERTIES) {
    await db.collection('properties').doc(p.id).set({ ...p, createdAt: now, updatedAt: now });
  }
  console.log(`  Properties: ${SEED_PROPERTIES.length}`);

  for (const u of SEED_UNITS) {
    const { tenantKey, ...unit } = u;
    await db.collection('units').doc(u.id).set({
      propertyId: unit.propertyId,
      unitNumber: unit.unitNumber,
      status: unit.status,
      tenantId: tenantKey ? `tenant-${tenantKey}` : null,
      createdAt: now,
      updatedAt: now,
    });
  }
  console.log(`  Units: ${SEED_UNITS.length}`);

  for (const t of SEED_TENANTS) {
    const { key, ...tenant } = t;
    await db.collection('tenants').doc(t.id).set({
      ...tenant,
      userId: null,
      createdAt: now,
      updatedAt: now,
    });
  }
  console.log(`  Tenants: ${SEED_TENANTS.length}`);

  const uidByTenantKey: Record<string, string> = {};
  for (const user of SEED_USERS) {
    const uid = await upsertAuthUser(user);
    console.log(`  User: ${user.email} (${uid})`);
    if ('tenantKey' in user && user.tenantKey) {
      uidByTenantKey[user.tenantKey] = uid;
      await db.collection('tenants').doc(`tenant-${user.tenantKey}`).set(
        { userId: uid, updatedAt: now },
        { merge: true },
      );
    }
  }

  await db.collection('leases').doc('lease-john-2026').set({
    tenantId: 'tenant-john',
    propertyId: 'prop-sunset',
    unitId: 'unit-sunset-101',
    tenantName: 'John Smith',
    propertyName: 'Sunset Apartments',
    unitLabel: 'Unit 101',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    rent: 1200,
    deposit: 2400,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  });

  for (const inv of SEED_INVOICES) {
    const tenant = SEED_TENANTS.find((t) => t.key === inv.tenantKey)!;
    await db.collection('invoices').doc(inv.id).set({
      invoiceNumber: inv.invoiceNumber,
      tenantId: tenant.id,
      tenantName: tenant.name,
      unitId: tenant.unitId,
      unitLabel: inv.unitLabel,
      propertyId: tenant.propertyId,
      amount: inv.amount,
      dueDate: inv.dueDate,
      paidDate: inv.paidDate,
      status: inv.status,
      method: inv.method,
      lateFee: inv.lateFee ?? null,
      createdAt: now,
      updatedAt: now,
    });
  }

  await db.collection('payments').doc('pay-john-apr').set({
    tenantId: 'tenant-john',
    invoiceId: 'inv-001',
    amount: 1200,
    method: 'Bank Transfer',
    status: 'completed',
    gateway: 'demo',
    monthLabel: 'April 2026',
    createdAt: now,
  });

  await db.collection('payments').doc('pay-john-mar').set({
    tenantId: 'tenant-john',
    invoiceId: 'inv-001',
    amount: 1200,
    method: 'Bank Transfer',
    status: 'completed',
    gateway: 'demo',
    monthLabel: 'March 2026',
    createdAt: Timestamp.fromDate(new Date('2026-03-01')),
  });

  for (const m of SEED_MAINTENANCE) {
    const tenant = SEED_TENANTS.find((t) => t.key === m.tenantKey)!;
    await db.collection('maintenanceRequests').doc(m.id).set({
      tenantId: tenant.id,
      tenantName: tenant.name,
      unitId: tenant.unitId,
      unitLabel: m.unitLabel,
      propertyId: tenant.propertyId,
      issue: m.issue,
      category: m.category,
      priority: m.priority,
      status: m.status,
      submitted: m.submitted,
      assignedTo: m.assignedTo,
      createdAt: now,
      updatedAt: now,
    });

    await db
      .collection('maintenanceRequests')
      .doc(m.id)
      .collection('updates')
      .doc('update-1')
      .set({
        date: m.submitted,
        message: 'Request submitted',
        status: 'submitted',
        createdAt: now,
      });
  }

  for (const tech of SEED_TECHNICIANS) {
    await db.collection('technicians').doc(tech.id).set(tech);
  }

  for (let i = 0; i < SEED_ACTIVITIES.length; i++) {
    const a = SEED_ACTIVITIES[i];
    const tenant = SEED_TENANTS.find((t) => t.key === a.tenantKey)!;
    await db.collection('activities').doc(`activity-${i + 1}`).set({
      type: a.type,
      tenantId: tenant.id,
      tenantName: tenant.name,
      action: a.action,
      amount: a.amount ?? null,
      status: a.status,
      time: 'recently',
      createdAt: Timestamp.fromDate(new Date(Date.now() - i * 3600000)),
    });
  }

  for (const n of SEED_NOTICES) {
    await db.collection('notices').doc(n.id).set({ ...n, createdAt: now });
  }

  await db.collection('paymentMethods').doc('pm-john-default').set({
    tenantId: 'tenant-john',
    type: 'card',
    label: 'Visa ending in 4242',
    last4: '4242',
    isDefault: true,
  });

  console.log('\nSeed complete!');
  console.log('\nDemo accounts:');
  console.log('  Admin:  admin@smartlease.demo / Admin123!');
  console.log('  Tenant: john.smith@demo.com / Tenant123!');
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
