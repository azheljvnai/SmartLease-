import {

  addDoc,

  collection,

  doc,

  onSnapshot,

  orderBy,

  query,

  updateDoc,

  where,

} from 'firebase/firestore';

import { db } from '../firebase/app';

import { COLLECTIONS } from '../firebase/config';

import type { AppNotification, NotificationType } from '../types';

import { docToData, serverTimestamps } from '../lib/firestore';

import { getTenant } from './tenants.service';

import { getUserProfile } from './auth.service';

import { sendEmail } from './email.service';



const col = collection(db, COLLECTIONS.notifications);



export async function createNotification(data: {

  userId: string;

  title: string;

  body: string;

  type: NotificationType;

}): Promise<string> {

  const ref = await addDoc(col, {

    ...data,

    read: false,

    ...serverTimestamps(),

  });

  return ref.id;

}



async function maybeSendEmailNotification(

  userId: string,

  data: { title: string; body: string; subject?: string },

): Promise<void> {

  try {

    const profile = await getUserProfile(userId);

    if (!profile?.notificationEmail) return;



    await sendEmail({

      to_email: profile.email,

      to_name: `${profile.firstName} ${profile.lastName}`.trim(),

      subject: data.subject ?? data.title,

      message: data.body,

    });

  } catch (err) {

    console.warn('Email notification failed:', err);

  }

}



export async function notifyUser(

  userId: string,

  data: { title: string; body: string; type: NotificationType; subject?: string },

): Promise<void> {

  await createNotification({ userId, title: data.title, body: data.body, type: data.type });

  await maybeSendEmailNotification(userId, data);

}



export function subscribeNotifications(

  userId: string,

  callback: (notifications: AppNotification[]) => void,

): () => void {

  return onSnapshot(

    query(col, where('userId', '==', userId), orderBy('createdAt', 'desc')),

    (snap) => callback(snap.docs.map((d) => docToData<AppNotification>(d))),

  );

}



export async function markNotificationRead(id: string): Promise<void> {

  await updateDoc(doc(db, COLLECTIONS.notifications, id), { read: true });

}



export async function markAllNotificationsRead(userId: string, notifications: AppNotification[]): Promise<void> {

  const unread = notifications.filter((n) => !n.read);

  await Promise.all(unread.map((n) => markNotificationRead(n.id)));

}



export async function notifyTenantUser(

  tenantId: string,

  data: { title: string; body: string; type: NotificationType; subject?: string },

): Promise<void> {

  const tenant = await getTenant(tenantId);

  if (tenant?.userId) {

    await notifyUser(tenant.userId, data);

  }

}



export async function notifyAdmins(

  adminUserIds: string[],

  data: { title: string; body: string; type: NotificationType },

): Promise<void> {

  await Promise.all(adminUserIds.map((userId) => createNotification({ userId, ...data })));

}


