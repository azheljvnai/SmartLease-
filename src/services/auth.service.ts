import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  type User,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/app';
import { COLLECTIONS } from '../firebase/config';
import type { UserProfile, UserRole } from '../types';
import { docToData, serverTimestamps, toTimestamp } from '../lib/firestore';

export async function signUp(params: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
}): Promise<UserProfile> {
  const credential = await createUserWithEmailAndPassword(
    auth,
    params.email,
    params.password,
  );

  const profile: Omit<UserProfile, 'id'> = {
    email: params.email,
    firstName: params.firstName,
    lastName: params.lastName,
    phone: params.phone,
    role: params.role,
    notificationEmail: true,
    notificationSms: false,
    twoFactorEnabled: false,
    ...serverTimestamps(),
  };

  await setDoc(doc(db, COLLECTIONS.users, credential.user.uid), profile);

  return { id: credential.user.uid, ...profile };
}

export async function signIn(email: string, password: string): Promise<UserProfile> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const profile = await getUserProfile(credential.user.uid);
  if (!profile) throw new Error('User profile not found. Please contact support.');
  return profile;
}

export async function logOut(): Promise<void> {
  await signOut(auth);
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export async function changePassword(user: User, newPassword: string): Promise<void> {
  await updatePassword(user, newPassword);
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, COLLECTIONS.users, uid));
  if (!snap.exists()) return null;
  return docToData<UserProfile>(snap as never);
}

export async function updateUserProfile(
  uid: string,
  data: Partial<UserProfile>,
): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.users, uid), {
    ...data,
    updatedAt: toTimestamp(),
  });
}
