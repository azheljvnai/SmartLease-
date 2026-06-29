import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/app';
import { COLLECTIONS } from '../firebase/config';
import type { PaymentInstructionEntry, PaymentInstructionsSettings } from '../types';
import { stripUndefined } from '../lib/firestore';
import { DEFAULT_PAYMENT_INSTRUCTIONS } from '../lib/payment-utils';
import { uploadPaymentQrImage } from './storage.service';

const SETTINGS_DOC = 'paymentInstructions';

export type PaymentMethodKey = 'qrph' | 'gcash' | 'maya';
function defaultSettings(): PaymentInstructionsSettings {
  return {
    qrph: { ...DEFAULT_PAYMENT_INSTRUCTIONS.qrph },
    gcash: { ...DEFAULT_PAYMENT_INSTRUCTIONS.gcash },
    maya: { ...DEFAULT_PAYMENT_INSTRUCTIONS.maya },
  };
}

export function getDefaultPaymentInstructions(): PaymentInstructionsSettings {
  return defaultSettings();
}

export async function getPaymentInstructions(): Promise<PaymentInstructionsSettings> {
  try {
    const snap = await getDoc(doc(db, COLLECTIONS.settings, SETTINGS_DOC));
    if (!snap.exists()) return defaultSettings();
    const data = snap.data() as PaymentInstructionsSettings;
    return {
      ...defaultSettings(),
      ...data,
      qrph: { ...defaultSettings().qrph, ...data.qrph },
      gcash: { ...defaultSettings().gcash, ...data.gcash },
      maya: { ...defaultSettings().maya, ...data.maya },
    };
  } catch (err) {
    console.warn('Could not load payment instructions from Firestore:', err);
    return defaultSettings();
  }
}

export async function updatePaymentInstruction(
  method: PaymentMethodKey,
  entry: Partial<PaymentInstructionEntry>,
): Promise<void> {
  const current = await getPaymentInstructions();
  const payload: PaymentInstructionsSettings = {
    qrph: method === 'qrph' ? { ...current.qrph, ...entry } : current.qrph,
    gcash: method === 'gcash' ? { ...current.gcash, ...entry } : current.gcash,
    maya: method === 'maya' ? { ...current.maya, ...entry } : current.maya,
    updatedAt: new Date().toISOString(),
  };
  await setDoc(
    doc(db, COLLECTIONS.settings, SETTINGS_DOC),
    stripUndefined(payload),
    { merge: true },
  );
}

export async function uploadPaymentQrCode(
  method: PaymentMethodKey,
  file: File,
): Promise<void> {
  const { downloadUrl, inlineData } = await uploadPaymentQrImage(method, file);
  await updatePaymentInstruction(method, {
    qrImageUrl: downloadUrl || undefined,
    qrInlineData: inlineData,
  });
}
export function resolveQrImageUrl(entry: PaymentInstructionEntry): string | null {
  if (entry.qrImageUrl) return entry.qrImageUrl;
  if (entry.qrInlineData) return entry.qrInlineData;
  return null;
}
