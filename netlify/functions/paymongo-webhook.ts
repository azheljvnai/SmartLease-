import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

function getDb() {
  if (getApps().length === 0) {
    const projectId = process.env.FIREBASE_PROJECT_ID ?? process.env.VITE_FIREBASE_PROJECT_ID;
    const cred = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!projectId || !cred) {
      throw new Error('FIREBASE_PROJECT_ID and FIREBASE_SERVICE_ACCOUNT_JSON required');
    }
    initializeApp({ credential: cert(JSON.parse(cred)), projectId });
  }
  return getFirestore();
}

export const handler = async (event: {
  httpMethod: string;
  body?: string | null;
  headers: Record<string, string | undefined>;
}) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const webhookSecret = process.env.PAYMONGO_WEBHOOK_SECRET;
  const signature = event.headers['paymongo-signature'];
  if (webhookSecret && signature !== webhookSecret) {
    return { statusCode: 401, body: 'Invalid signature' };
  }

  try {
    const payload = JSON.parse(event.body ?? '{}') as {
      data?: {
        attributes?: {
          type?: string;
          data?: {
            attributes?: {
              status?: string;
              metadata?: { invoiceId?: string; tenantId?: string };
              payments?: { attributes?: { type?: string } }[];
            };
          };
        };
      };
    };

    const eventType = payload.data?.attributes?.type;
    const paymentData = payload.data?.attributes?.data?.attributes;
    if (eventType !== 'payment.paid' || paymentData?.status !== 'paid') {
      return { statusCode: 200, body: 'Ignored' };
    }

    const invoiceId = paymentData.metadata?.invoiceId;
    const tenantId = paymentData.metadata?.tenantId;
    if (!invoiceId || !tenantId) {
      return { statusCode: 400, body: 'Missing metadata' };
    }

    const methodType = paymentData.payments?.[0]?.attributes?.type ?? 'paymongo';
    const paidDate = new Date().toISOString().split('T')[0];
    const db = getDb();
    const now = Timestamp.now();

    await db.collection('invoices').doc(invoiceId).update({
      status: 'paid',
      paidDate,
      method: methodType,
      updatedAt: now,
    });

    await db.collection('tenants').doc(tenantId).update({
      paymentStatus: 'paid',
      updatedAt: now,
    });

    const invoiceSnap = await db.collection('invoices').doc(invoiceId).get();
    const amount = invoiceSnap.data()?.amount ?? 0;

    await db.collection('payments').add({
      tenantId,
      invoiceId,
      amount,
      method: methodType,
      status: 'completed',
      gateway: 'paymongo',
      createdAt: now,
    });

    await db.collection('activities').add({
      type: 'payment',
      tenantId,
      tenantName: invoiceSnap.data()?.tenantName ?? 'Tenant',
      action: 'Paid rent via PayMongo',
      amount: `₱${amount.toLocaleString()}`,
      status: 'success',
      createdAt: now,
    });

    const tenantSnap = await db.collection('tenants').doc(tenantId).get();
    const userId = tenantSnap.data()?.userId;
    if (userId) {
      await db.collection('notifications').add({
        userId,
        title: 'Payment received',
        body: `Your payment for invoice ${invoiceSnap.data()?.invoiceNumber ?? invoiceId} was successful.`,
        read: false,
        type: 'payment',
        createdAt: now,
      });
    }

    return { statusCode: 200, body: 'OK' };
  } catch (err) {
    return {
      statusCode: 500,
      body: err instanceof Error ? err.message : 'Webhook error',
    };
  }
};
