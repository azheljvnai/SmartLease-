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

import type { Invoice, InvoiceDeliveryRecord, InvoiceEmailStatus } from '../types';

import { docToData, serverTimestamps, stripUndefined, toTimestamp } from '../lib/firestore';

import { updateTenantPaymentStatus, getTenant } from './tenants.service';

import { notifyTenantUser } from './notifications.service';

import { getProperty } from './properties.service';

import { generateInvoicePdf } from './invoice-pdf.service';

import { downloadInvoicePdf, uploadInvoicePdf } from './storage.service';

import { sendEmail, isEmailConfigured } from './email.service';

import { formatCurrency, formatDate } from '../lib/format';

import { getCompanyBranding } from '../lib/company';



const col = collection(db, COLLECTIONS.invoices);



export async function listInvoices(): Promise<Invoice[]> {

  const snap = await getDocs(query(col, orderBy('dueDate', 'desc')));

  return snap.docs.map((d) => docToData<Invoice>(d));

}



export function subscribeInvoices(callback: (invoices: Invoice[]) => void): () => void {

  return onSnapshot(query(col, orderBy('dueDate', 'desc')), (snap) => {

    callback(snap.docs.map((d) => docToData<Invoice>(d)));

  });

}



export async function getInvoice(id: string): Promise<Invoice | null> {

  const snap = await getDoc(doc(db, COLLECTIONS.invoices, id));

  if (!snap.exists()) return null;

  return docToData<Invoice>(snap as never);

}



export async function listInvoicesByTenant(tenantId: string): Promise<Invoice[]> {

  const snap = await getDocs(

    query(col, where('tenantId', '==', tenantId), orderBy('dueDate', 'desc')),

  );

  return snap.docs.map((d) => docToData<Invoice>(d));

}



function defaultBillingPeriod(dueDate: string): { start: string; end: string } {

  const due = new Date(dueDate);

  const start = new Date(due.getFullYear(), due.getMonth() - 1, 1);

  const end = new Date(due.getFullYear(), due.getMonth(), 0);

  return {

    start: start.toISOString().split('T')[0],

    end: end.toISOString().split('T')[0],

  };

}



export async function createInvoice(data: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {

  const period =

    data.billingPeriodStart && data.billingPeriodEnd

      ? { start: data.billingPeriodStart, end: data.billingPeriodEnd }

      : defaultBillingPeriod(data.dueDate);



  const ref = await addDoc(col, stripUndefined({

    ...data,

    billingPeriodStart: period.start,

    billingPeriodEnd: period.end,

    emailStatus: 'not_sent' as InvoiceEmailStatus,

    deliveryHistory: [],

    ...serverTimestamps(),

  }));



  const tenant = await getTenant(data.tenantId);

  if (tenant?.userId) {

    await notifyTenantUser(data.tenantId, {

      title: 'New invoice',

      body: `Invoice ${data.invoiceNumber} for ${formatCurrency(data.amount)} is due ${formatDate(data.dueDate)}.`,

      type: 'payment',

      subject: `New invoice ${data.invoiceNumber}`,

    });

  }



  return ref.id;

}



export async function updateInvoice(id: string, data: Partial<Invoice>): Promise<void> {

  const { id: _id, createdAt, ...rest } = data;

  await updateDoc(doc(db, COLLECTIONS.invoices, id), stripUndefined({

    ...rest,

    updatedAt: toTimestamp(),

  }));



  if (data.status && data.tenantId) {

    const paymentStatus =

      data.status === 'paid' ? 'paid' : data.status === 'overdue' ? 'overdue' : 'pending';

    await updateTenantPaymentStatus(data.tenantId, paymentStatus);

  }

}



export async function markInvoicePaid(

  invoiceId: string,

  tenantId: string,

  method: string,

  paidDate: string,

): Promise<void> {

  await updateInvoice(invoiceId, {

    status: 'paid',

    paidDate,

    method,

    tenantId,

  });

  await updateTenantPaymentStatus(tenantId, 'paid');



  await notifyTenantUser(tenantId, {

    title: 'Payment received',

    body: `Your invoice was marked paid on ${formatDate(paidDate)} via ${method}.`,

    type: 'payment',

    subject: 'Payment received — SmartLease',

  });

}



export async function deleteInvoice(id: string): Promise<void> {

  await deleteDoc(doc(db, COLLECTIONS.invoices, id));

}



export async function syncOverdueInvoices(): Promise<number> {

  const today = new Date().toISOString().split('T')[0];

  const invoices = await listInvoices();

  const overdue = invoices.filter((i) => i.status === 'pending' && i.dueDate < today);

  await Promise.all(

    overdue.map((i) => updateInvoice(i.id, { status: 'overdue', tenantId: i.tenantId })),

  );

  return overdue.length;

}



export function generateInvoiceNumber(): string {

  const now = new Date();

  const y = now.getFullYear();

  const m = String(now.getMonth() + 1).padStart(2, '0');

  const r = Math.floor(Math.random() * 9000) + 1000;

  return `INV-${y}${m}-${r}`;

}



export async function generateAndStoreInvoicePdf(

  invoiceId: string,

  options?: { regenerate?: boolean },

): Promise<Invoice> {

  const invoice = await getInvoice(invoiceId);

  if (!invoice) throw new Error('Invoice not found');



  const tenant = await getTenant(invoice.tenantId);

  if (!tenant) throw new Error('Tenant not found');



  const property = await getProperty(invoice.propertyId);

  const propertyName = invoice.propertyName ?? property?.name ?? tenant.propertyName;

  const propertyAddress = invoice.propertyAddress ?? property?.address ?? '';



  const pdfBytes = await generateInvoicePdf({

    invoice,

    tenant,

    propertyName,

    propertyAddress,

  });



  const uploaded = await uploadInvoicePdf(invoiceId, pdfBytes);

  const generatedAt = new Date().toISOString();

  const fileName = `${invoice.invoiceNumber}.pdf`;



  const pdfFile = {

    storagePath: uploaded.storagePath,

    downloadUrl: uploaded.downloadUrl || undefined,

    fileName,

    generatedAt,

    inlineData: uploaded.inlineData,

  };



  await updateInvoice(invoiceId, {

    pdfFile,

    propertyName,

    propertyAddress,

    tenantId: invoice.tenantId,

  });



  const history: InvoiceDeliveryRecord[] = [

    ...(invoice.deliveryHistory ?? []),

    {

      sentAt: generatedAt,

      method: 'email',

      status: 'skipped',

      regenerated: options?.regenerate ?? false,

    },

  ];



  await updateDoc(doc(db, COLLECTIONS.invoices, invoiceId), {

    deliveryHistory: history,

    updatedAt: toTimestamp(),

  });



  const updated = await getInvoice(invoiceId);

  return updated!;

}



export async function downloadStoredInvoicePdf(invoice: Invoice): Promise<void> {

  if (!invoice.pdfFile) {

    const updated = await generateAndStoreInvoicePdf(invoice.id);

    if (!updated.pdfFile) throw new Error('Could not generate invoice PDF');

    await downloadInvoicePdf(updated.pdfFile);

    return;

  }

  await downloadInvoicePdf(invoice.pdfFile);

}



export async function sendInvoiceByEmail(invoiceId: string): Promise<InvoiceEmailStatus> {

  const invoice = await getInvoice(invoiceId);

  if (!invoice) throw new Error('Invoice not found');



  let current = invoice;

  if (!current.pdfFile) {

    current = await generateAndStoreInvoicePdf(invoiceId);

  }



  const tenant = await getTenant(current.tenantId);

  if (!tenant) throw new Error('Tenant not found');



  const company = getCompanyBranding();

  const totalDue = current.amount + (current.lateFee ?? 0);

  const pdfLink = current.pdfFile?.downloadUrl;

  const linkNote = pdfLink

    ? `\n\nDownload your invoice PDF: ${pdfLink}`

    : '\n\nYour invoice PDF is available in the SmartLease tenant portal under Payments.';



  const message = [

    `Dear ${tenant.name},`,

    '',

    `Please find your billing statement details below:`,

    '',

    `Invoice Number: ${current.invoiceNumber}`,

    `Property: ${current.propertyName ?? tenant.propertyName}`,

    `Unit: ${current.unitLabel}`,

    `Billing Period: ${current.billingPeriodStart ? formatDate(current.billingPeriodStart) : '—'} – ${current.billingPeriodEnd ? formatDate(current.billingPeriodEnd) : '—'}`,

    `Amount Due: ${formatCurrency(totalDue)}`,

    `Due Date: ${formatDate(current.dueDate)}`,

    `Status: ${current.status.toUpperCase()}`,

    '',

    'Payment Instructions:',

    company.paymentInstructions,

    linkNote,

    '',

    `Thank you,`,

    company.name,

  ].join('\n');



  const sentAt = new Date().toISOString();

  let emailStatus: InvoiceEmailStatus = 'skipped';

  let error: string | undefined;



  if (!isEmailConfigured()) {

    emailStatus = 'skipped';

    error = 'EmailJS is not configured';

  } else {

    try {

      await sendEmail({

        to_email: tenant.email,

        to_name: tenant.name,

        subject: `Invoice ${current.invoiceNumber} — ${formatCurrency(totalDue)} due ${formatDate(current.dueDate)}`,

        message,

      });

      emailStatus = 'sent';

    } catch (err) {

      emailStatus = 'failed';

      error = err instanceof Error ? err.message : 'Email delivery failed';

    }

  }



  const record: InvoiceDeliveryRecord = {

    sentAt,

    method: 'email',

    status: emailStatus === 'sent' ? 'sent' : emailStatus === 'failed' ? 'failed' : 'skipped',

    error,

  };



  const deliveryHistory = [...(current.deliveryHistory ?? []), record];



  await updateInvoice(invoiceId, {

    emailStatus,

    lastEmailSentAt: sentAt,

    deliveryHistory,

    tenantId: current.tenantId,

  });



  if (emailStatus === 'sent' && tenant.userId) {

    await notifyTenantUser(current.tenantId, {

      title: 'Invoice sent',

      body: `Invoice ${current.invoiceNumber} was emailed to ${tenant.email}.`,

      type: 'payment',

    });

  }



  return emailStatus;

}



export async function generateAndSendInvoice(invoiceId: string): Promise<InvoiceEmailStatus> {

  await generateAndStoreInvoicePdf(invoiceId, { regenerate: true });

  return sendInvoiceByEmail(invoiceId);

}


