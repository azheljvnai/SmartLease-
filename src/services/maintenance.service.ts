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
  MaintenanceAttachment,
  MaintenanceCostBreakdown,
  MaintenancePriority,
  MaintenanceRequest,
  MaintenanceStatus,
  MaintenanceUpdate,
  MaintenanceUpdateType,
  Technician,
} from '../types';
import { docToData, serverTimestamps, stripUndefined, toTimestamp } from '../lib/firestore';
import { createActivity } from './activities.service';
import { listAdminUsers } from './auth.service';
import { notifyTenantUser, notifyUser } from './notifications.service';
import {
  isOpenMaintenanceStatus,
  maintenanceStatusLabel,
  normalizeMaintenanceStatus,
} from '../lib/maintenance-labels';
import { computeTotalCost } from '../lib/maintenance-utils';
import { ensureMaintenanceChargeInvoice } from './invoices.service';

const col = collection(db, COLLECTIONS.maintenanceRequests);
const techCol = collection(db, COLLECTIONS.technicians);

function generateRequestNumber(): string {
  const year = new Date().getFullYear();
  const seq = Date.now().toString(36).toUpperCase().slice(-5);
  return `WO-${year}-${seq}`;
}

export async function listMaintenanceRequests(): Promise<MaintenanceRequest[]> {
  const snap = await getDocs(query(col, orderBy('submitted', 'desc')));
  return snap.docs.map((d) => docToData<MaintenanceRequest>(d));
}

export function subscribeMaintenanceRequests(
  callback: (requests: MaintenanceRequest[]) => void,
): () => void {
  return onSnapshot(query(col, orderBy('submitted', 'desc')), (snap) => {
    callback(snap.docs.map((d) => docToData<MaintenanceRequest>(d)));
  });
}

export async function listMaintenanceByTenant(tenantId: string): Promise<MaintenanceRequest[]> {
  const snap = await getDocs(
    query(col, where('tenantId', '==', tenantId), orderBy('submitted', 'desc')),
  );
  return snap.docs.map((d) => docToData<MaintenanceRequest>(d));
}

export async function forceDeleteMaintenanceRequest(requestId: string): Promise<void> {
  const updatesCol = collection(db, COLLECTIONS.maintenanceRequests, requestId, 'updates');
  const updatesSnap = await getDocs(updatesCol);
  await Promise.all(updatesSnap.docs.map((d) => deleteDoc(d.ref)));
  await deleteDoc(doc(db, COLLECTIONS.maintenanceRequests, requestId));
}

export async function listMaintenanceByProperty(propertyId: string): Promise<MaintenanceRequest[]> {
  const snap = await getDocs(
    query(col, where('propertyId', '==', propertyId), orderBy('submitted', 'desc')),
  );
  return snap.docs.map((d) => docToData<MaintenanceRequest>(d));
}

export async function listMaintenanceByUnit(unitId: string): Promise<MaintenanceRequest[]> {
  const snap = await getDocs(
    query(col, where('unitId', '==', unitId), orderBy('submitted', 'desc')),
  );
  return snap.docs.map((d) => docToData<MaintenanceRequest>(d));
}

export function subscribeMaintenanceByTenant(
  tenantId: string,
  callback: (requests: MaintenanceRequest[]) => void,
  onError?: (error: Error) => void,
): () => void {
  return onSnapshot(
    query(col, where('tenantId', '==', tenantId), orderBy('submitted', 'desc')),
    (snap) => callback(snap.docs.map((d) => docToData<MaintenanceRequest>(d))),
    (error) => {
      console.error('Maintenance subscription error:', error);
      callback([]);
      onError?.(error);
    },
  );
}

async function addMaintenanceUpdate(
  requestId: string,
  update: {
    message: string;
    status: string;
    type?: MaintenanceUpdateType;
    author?: string;
    authorRole?: MaintenanceUpdate['authorRole'];
  },
): Promise<void> {
  const updatesCol = collection(db, COLLECTIONS.maintenanceRequests, requestId, 'updates');
  await addDoc(updatesCol, {
    date: new Date().toISOString(),
    message: update.message,
    status: update.status,
    type: update.type ?? 'note',
    author: update.author,
    authorRole: update.authorRole ?? 'system',
    createdAt: toTimestamp(),
  });
}

async function getRequestOrThrow(requestId: string) {
  const snap = await getDoc(doc(db, COLLECTIONS.maintenanceRequests, requestId));
  if (!snap.exists()) throw new Error('Request not found');
  return snap.data();
}

async function notifyRequestTenant(
  requestId: string,
  data: { title: string; body: string; subject?: string },
): Promise<void> {
  const request = await getRequestOrThrow(requestId);
  if (request?.tenantId) {
    await notifyTenantUser(request.tenantId as string, { ...data, type: 'maintenance' });
  }
}

export async function createMaintenanceRequest(
  data: Omit<MaintenanceRequest, 'id' | 'createdAt' | 'updatedAt' | 'requestNumber'>,
): Promise<string> {
  const status =
    data.status === 'submitted' || data.status === 'pending' ? 'requested' : data.status;

  const ref = await addDoc(col, {
    ...data,
    status,
    requestNumber: generateRequestNumber(),
    paymentStatus: data.paymentStatus ?? 'unpaid',
    ...serverTimestamps(),
  });

  await addMaintenanceUpdate(ref.id, {
    message: 'Request submitted',
    status,
    type: 'submission',
    author: data.tenantName,
    authorRole: 'tenant',
  });

  await createActivity({
    type: 'maintenance',
    tenantId: data.tenantId,
    tenantName: data.tenantName,
    action: 'Submitted maintenance request',
    status: 'pending',
  });

  try {
    const admins = await listAdminUsers();
    await Promise.all(
      admins.map((admin) =>
        notifyUser(admin.id, {
          title: 'New maintenance request',
          body: `${data.tenantName} submitted "${data.issue}" at ${data.unitLabel}.`,
          type: 'maintenance',
          subject: 'New maintenance request',
        }),
      ),
    );
  } catch {
    // non-blocking
  }

  return ref.id;
}

export async function updateMaintenanceRequest(
  id: string,
  data: Partial<MaintenanceRequest>,
  options?: {
    author?: string;
    authorRole?: MaintenanceUpdate['authorRole'];
    skipAutoUpdate?: boolean;
    updateType?: MaintenanceUpdateType;
    updateMessage?: string;
  },
): Promise<void> {
  const { id: _id, createdAt, ...rest } = data;
  await updateDoc(
    doc(db, COLLECTIONS.maintenanceRequests, id),
    stripUndefined({
      ...rest,
      updatedAt: toTimestamp(),
    }),
  );

  if (data.status && !options?.skipAutoUpdate) {
    await addMaintenanceUpdate(id, {
      message:
        options?.updateMessage ??
        `Status changed to ${maintenanceStatusLabel(data.status)}`,
      status: data.status,
      type: options?.updateType ?? 'status_change',
      author: options?.author,
      authorRole: options?.authorRole ?? 'admin',
    });

    await notifyRequestTenant(id, {
      title: 'Maintenance update',
      body: `Your request status is now ${maintenanceStatusLabel(data.status)}.`,
      subject: 'Maintenance status update',
    });
  }
}

export async function transitionMaintenanceStatus(
  requestId: string,
  newStatus: MaintenanceStatus,
  author: string,
  note?: string,
): Promise<void> {
  const request = await getRequestOrThrow(requestId);
  const today = new Date().toISOString().split('T')[0];
  const patch: Partial<MaintenanceRequest> = { status: newStatus };

  if (newStatus === 'completed') patch.completedDate = today;
  if (newStatus === 'closed') patch.closedDate = today;

  await updateMaintenanceRequest(requestId, patch, {
    author,
    authorRole: 'admin',
    updateType: 'status_change',
    updateMessage: note ?? `Status changed to ${maintenanceStatusLabel(newStatus)}`,
  });

  if (newStatus === 'completed') {
    await notifyRequestTenant(requestId, {
      title: 'Repair completed',
      body: `Your maintenance request "${request.issue}" has been completed.`,
      subject: 'Maintenance completed',
    });
  }
}

export async function assignTechnician(
  requestId: string,
  technician: Technician,
  author?: string,
): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  await updateMaintenanceRequest(
    requestId,
    {
      status: 'assigned',
      assignedTo: technician.name,
      technicianId: technician.id,
      assignedDate: today,
    },
    { skipAutoUpdate: true },
  );

  await addMaintenanceUpdate(requestId, {
    message: `Assigned to ${technician.name}`,
    status: 'assigned',
    type: 'assignment',
    author: author ?? 'Admin',
    authorRole: 'admin',
  });

  const request = await getRequestOrThrow(requestId);
  if (request?.tenantId) {
    await notifyTenantUser(request.tenantId as string, {
      title: 'Technician assigned',
      body: `${technician.name} has been assigned to your request "${request.issue}".`,
      type: 'maintenance',
      subject: 'Technician assigned',
    });
  }
}

export async function reassignTechnician(
  requestId: string,
  technician: Technician,
  author?: string,
): Promise<void> {
  await assignTechnician(requestId, technician, author);
  await addMaintenanceUpdate(requestId, {
    message: `Reassigned to ${technician.name}`,
    status: 'assigned',
    type: 'assignment',
    author: author ?? 'Admin',
    authorRole: 'admin',
  });
}

export async function scheduleMaintenance(
  requestId: string,
  schedule: {
    scheduledDate: string;
    scheduledTime?: string;
    estimatedCompletionDate?: string;
  },
  author?: string,
): Promise<void> {
  await updateMaintenanceRequest(
    requestId,
    {
      status: 'scheduled',
      scheduledDate: schedule.scheduledDate,
      scheduledTime: schedule.scheduledTime ?? null,
      estimatedCompletionDate: schedule.estimatedCompletionDate ?? null,
    },
    { skipAutoUpdate: true },
  );

  const timeLabel = schedule.scheduledTime ? ` at ${schedule.scheduledTime}` : '';
  await addMaintenanceUpdate(requestId, {
    message: `Repair scheduled for ${schedule.scheduledDate}${timeLabel}`,
    status: 'scheduled',
    type: 'schedule',
    author: author ?? 'Admin',
    authorRole: 'admin',
  });

  await notifyRequestTenant(requestId, {
    title: 'Repair scheduled',
    body: `Your maintenance repair is scheduled for ${schedule.scheduledDate}${timeLabel}.`,
    subject: 'Maintenance scheduled',
  });
}

export async function addMaintenanceNote(
  requestId: string,
  message: string,
  author: string,
  authorRole: MaintenanceUpdate['authorRole'] = 'admin',
  type: MaintenanceUpdateType = 'note',
): Promise<void> {
  const request = await getRequestOrThrow(requestId);
  await addMaintenanceUpdate(requestId, {
    message,
    status: String(request.status),
    type,
    author,
    authorRole,
  });
}

export async function requestAdditionalInfo(
  requestId: string,
  message: string,
  author: string,
): Promise<void> {
  await updateMaintenanceRequest(requestId, { status: 'under_review' }, { skipAutoUpdate: true });
  await addMaintenanceNote(requestId, message, author, 'admin', 'info_request');
  await notifyRequestTenant(requestId, {
    title: 'Additional information needed',
    body: message,
    subject: 'Maintenance — information needed',
  });
}

async function syncMaintenanceBilling(requestId: string): Promise<void> {
  const snap = await getDoc(doc(db, COLLECTIONS.maintenanceRequests, requestId));
  if (!snap.exists()) return;
  const request = docToData<MaintenanceRequest>(snap as never);
  const total = computeTotalCost(request);
  if (total <= 0) return;
  if (request.paymentStatus === 'paid' || request.paymentStatus === 'waived') return;

  const invoiceId = await ensureMaintenanceChargeInvoice(request);
  if (invoiceId && invoiceId !== request.linkedInvoiceId) {
    await updateDoc(doc(db, COLLECTIONS.maintenanceRequests, requestId), {
      linkedInvoiceId: invoiceId,
      paymentStatus: request.paymentStatus ?? 'unpaid',
      updatedAt: toTimestamp(),
    });
  }
}

export async function updateMaintenanceCosts(
  requestId: string,
  costs: MaintenanceCostBreakdown,
  author?: string,
): Promise<void> {
  await updateMaintenanceRequest(requestId, costs, { skipAutoUpdate: true });

  const parts: string[] = [];
  if (costs.estimatedCost != null) parts.push(`Estimated: ₱${costs.estimatedCost}`);
  if (costs.laborCost != null) parts.push(`Labor: ₱${costs.laborCost}`);
  if (costs.materialsCost != null) parts.push(`Materials: ₱${costs.materialsCost}`);
  if (costs.additionalCharges != null) parts.push(`Additional: ₱${costs.additionalCharges}`);
  if (costs.actualCost != null) parts.push(`Total: ₱${costs.actualCost}`);
  if (costs.paymentStatus) parts.push(`Payment: ${costs.paymentStatus}`);

  await addMaintenanceUpdate(requestId, {
    message: `Cost updated — ${parts.join(', ')}`,
    status: 'cost',
    type: 'cost',
    author: author ?? 'Admin',
    authorRole: 'admin',
  });

  await syncMaintenanceBilling(requestId);
}

export async function addMaintenanceAttachment(
  requestId: string,
  attachment: Omit<MaintenanceAttachment, 'id' | 'uploadedAt'>,
  author?: string,
): Promise<void> {
  const snap = await getDoc(doc(db, COLLECTIONS.maintenanceRequests, requestId));
  const existing = (snap.data()?.attachments as MaintenanceAttachment[]) ?? [];
  const newAttachment: MaintenanceAttachment = {
    ...attachment,
    id: `att-${Date.now()}`,
    uploadedAt: new Date().toISOString(),
    uploadedBy: author,
  };
  await updateMaintenanceRequest(requestId, { attachments: [...existing, newAttachment] }, {
    skipAutoUpdate: true,
  });
  await addMaintenanceUpdate(requestId, {
    message: `Document attached: ${attachment.name}`,
    status: 'attachment',
    type: 'photo',
    author,
    authorRole: 'admin',
  });
}

export async function completeMaintenanceRequest(
  requestId: string,
  data: {
    actualCost?: number;
    laborCost?: number;
    materialsCost?: number;
    additionalCharges?: number;
    materialsUsed?: string;
    adminNotes?: string;
    author?: string;
  },
): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const total =
    data.actualCost ??
    (data.laborCost ?? 0) + (data.materialsCost ?? 0) + (data.additionalCharges ?? 0);

  await updateMaintenanceRequest(
    requestId,
    {
      status: 'completed',
      completedDate: today,
      actualCost: total || undefined,
      laborCost: data.laborCost,
      materialsCost: data.materialsCost,
      additionalCharges: data.additionalCharges,
      materialsUsed: data.materialsUsed,
      adminNotes: data.adminNotes,
    },
    { author: data.author, authorRole: 'admin', updateType: 'completion' },
  );

  if (data.materialsUsed) {
    await addMaintenanceUpdate(requestId, {
      message: `Materials used: ${data.materialsUsed}`,
      status: 'completed',
      type: 'note',
      author: data.author ?? 'Admin',
      authorRole: 'admin',
    });
  }

  await syncMaintenanceBilling(requestId);
}

export async function closeMaintenanceRequest(
  requestId: string,
  author?: string,
): Promise<void> {
  await transitionMaintenanceStatus(requestId, 'closed', author ?? 'Admin', 'Work order closed');
}

export async function cancelMaintenanceRequest(
  requestId: string,
  reason: string,
  author?: string,
): Promise<void> {
  await updateMaintenanceRequest(requestId, { status: 'closed' }, { skipAutoUpdate: true });
  await addMaintenanceUpdate(requestId, {
    message: reason || 'Request cancelled',
    status: 'closed',
    type: 'status_change',
    author: author ?? 'Admin',
    authorRole: 'admin',
  });
}

export async function updateMaintenancePriority(
  requestId: string,
  priority: MaintenancePriority,
  author?: string,
): Promise<void> {
  await updateMaintenanceRequest(requestId, { priority }, { skipAutoUpdate: true });
  await addMaintenanceUpdate(requestId, {
    message: `Priority changed to ${priority}`,
    status: 'priority_change',
    type: 'priority_change',
    author: author ?? 'Admin',
    authorRole: 'admin',
  });
}

export async function startMaintenanceWork(
  requestId: string,
  author?: string,
): Promise<void> {
  await updateMaintenanceRequest(
    requestId,
    { status: 'in_progress' },
    { author, authorRole: 'technician', updateType: 'status_change' },
  );
}

export async function listMaintenanceUpdates(requestId: string): Promise<MaintenanceUpdate[]> {
  const snap = await getDocs(
    query(
      collection(db, COLLECTIONS.maintenanceRequests, requestId, 'updates'),
      orderBy('createdAt', 'asc'),
    ),
  );
  return snap.docs.map((d) => docToData<MaintenanceUpdate>(d));
}

export async function listTechnicians(): Promise<Technician[]> {
  const snap = await getDocs(query(techCol, orderBy('name')));
  return snap.docs.map((d) => docToData<Technician>(d));
}

export async function createTechnician(data: {
  name: string;
  email?: string;
  phone?: string;
  specialties: string[];
  assignedPropertyIds?: string[];
  availability?: Technician['availability'];
}): Promise<string> {
  const ref = await addDoc(techCol, {
    name: data.name,
    email: data.email ?? null,
    phone: data.phone ?? null,
    specialties: data.specialties,
    assignedPropertyIds: data.assignedPropertyIds ?? [],
    availability: data.availability ?? 'available',
    completedJobs: 0,
    active: true,
  });
  return ref.id;
}

export async function updateTechnician(
  id: string,
  data: Partial<
    Pick<
      Technician,
      'name' | 'email' | 'phone' | 'specialties' | 'active' | 'assignedPropertyIds' | 'availability'
    >
  >,
): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.technicians, id), stripUndefined(data));
}

export async function getMaintenanceStats(): Promise<{
  pending: number;
  assigned: number;
  inProgress: number;
  completed: number;
  emergency: number;
}> {
  const requests = await listMaintenanceRequests();
  return {
    pending: requests.filter((r) => normalizeMaintenanceStatus(r.status) === 'requested').length,
    assigned: requests.filter((r) => normalizeMaintenanceStatus(r.status) === 'assigned').length,
    inProgress: requests.filter(
      (r) =>
        normalizeMaintenanceStatus(r.status) === 'in_progress' ||
        normalizeMaintenanceStatus(r.status) === 'waiting_parts',
    ).length,
    completed: requests.filter(
      (r) =>
        normalizeMaintenanceStatus(r.status) === 'completed' ||
        normalizeMaintenanceStatus(r.status) === 'closed',
    ).length,
    emergency: requests.filter((r) => r.priority === 'emergency' && isOpenMaintenanceStatus(r.status))
      .length,
  };
}

export async function getTechnicianWorkload(): Promise<
  Array<Technician & { openCount: number; inProgressCount: number; scheduledCount: number }>
> {
  const [technicians, requests] = await Promise.all([listTechnicians(), listMaintenanceRequests()]);
  return technicians.map((tech) => {
    const assigned = requests.filter((r) => r.technicianId === tech.id);
    return {
      ...tech,
      openCount: assigned.filter((r) => isOpenMaintenanceStatus(r.status)).length,
      inProgressCount: assigned.filter(
        (r) =>
          normalizeMaintenanceStatus(r.status) === 'in_progress' ||
          normalizeMaintenanceStatus(r.status) === 'waiting_parts',
      ).length,
      scheduledCount: assigned.filter(
        (r) => normalizeMaintenanceStatus(r.status) === 'scheduled',
      ).length,
    };
  });
}

export async function getScheduledMaintenance(): Promise<MaintenanceRequest[]> {
  const requests = await listMaintenanceRequests();
  return requests
    .filter(
      (r) =>
        r.scheduledDate &&
        isOpenMaintenanceStatus(r.status) &&
        ['scheduled', 'assigned', 'in_progress'].includes(normalizeMaintenanceStatus(r.status)),
    )
    .sort((a, b) => (a.scheduledDate ?? '').localeCompare(b.scheduledDate ?? ''));
}

export function getResolutionDays(request: MaintenanceRequest): number | null {
  if (!request.completedDate) return null;
  const start = new Date(request.submitted).getTime();
  const end = new Date(request.completedDate).getTime();
  return Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
}

export function getRequestTotalCost(request: MaintenanceRequest): number {
  return computeTotalCost(request);
}

export async function tenantAddComment(
  requestId: string,
  message: string,
  tenantName: string,
): Promise<void> {
  await addMaintenanceNote(requestId, message, tenantName, 'tenant', 'note');
}

export async function tenantConfirmCompletion(
  requestId: string,
  tenantName: string,
): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  await updateMaintenanceRequest(
    requestId,
    { status: 'closed', closedDate: today, tenantConfirmedAt: today },
    {
      author: tenantName,
      authorRole: 'tenant',
      updateType: 'status_change',
      updateMessage: 'Tenant confirmed repair completed successfully',
    },
  );
}

export async function tenantReopenRequest(
  requestId: string,
  reason: string,
  tenantName: string,
): Promise<void> {
  const request = await getRequestOrThrow(requestId);
  await updateMaintenanceRequest(
    requestId,
    {
      status: 'requested',
      assignedTo: null,
      technicianId: null,
      assignedDate: null,
      scheduledDate: null,
      scheduledTime: null,
      completedDate: null,
      closedDate: null,
      tenantConfirmedAt: null,
    },
    { skipAutoUpdate: true },
  );

  await addMaintenanceUpdate(requestId, {
    message: reason.trim() || 'Tenant reopened — issue persists',
    status: 'requested',
    type: 'status_change',
    author: tenantName,
    authorRole: 'tenant',
  });

  try {
    const admins = await listAdminUsers();
    await Promise.all(
      admins.map((admin) =>
        notifyUser(admin.id, {
          title: 'Maintenance request reopened',
          body: `${tenantName} reopened "${request.issue as string}". ${reason.trim() || 'Issue persists.'}`,
          type: 'maintenance',
          subject: 'Maintenance reopened',
        }),
      ),
    );
  } catch {
    // non-blocking
  }
}
