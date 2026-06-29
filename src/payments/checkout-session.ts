export type CheckoutPaymentMethodType = 'gcash' | 'paymaya' | 'card';

export interface PayMongoCheckoutSession {
  token: string;
  invoiceId: string;
  invoiceNumber: string;
  tenantId: string;
  tenantName: string;
  amount: number;
  method: string;
  paymentMethodType: CheckoutPaymentMethodType;
  monthLabel?: string;
  expiresAt: number;
}

const SESSION_PREFIX = 'paymongo_checkout_';
const SESSION_TTL_MS = 30 * 60 * 1000;

export function createCheckoutSession(
  data: Omit<PayMongoCheckoutSession, 'token' | 'expiresAt'>,
): PayMongoCheckoutSession {
  const token = crypto.randomUUID();
  const session: PayMongoCheckoutSession = {
    ...data,
    token,
    expiresAt: Date.now() + SESSION_TTL_MS,
  };
  sessionStorage.setItem(`${SESSION_PREFIX}${token}`, JSON.stringify(session));
  return session;
}

export function loadCheckoutSession(token: string): PayMongoCheckoutSession | null {
  const raw = sessionStorage.getItem(`${SESSION_PREFIX}${token}`);
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as PayMongoCheckoutSession;
    if (session.expiresAt < Date.now()) {
      clearCheckoutSession(token);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function clearCheckoutSession(token: string): void {
  sessionStorage.removeItem(`${SESSION_PREFIX}${token}`);
}
