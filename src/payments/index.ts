import { DemoPaymentGateway } from './demo-gateway';
import { StripePaymentGateway } from './stripe-gateway';
import type { PaymentGateway } from './types';

export function getPaymentGateway(): PaymentGateway {
  const gateway = import.meta.env.VITE_PAYMENT_GATEWAY ?? 'demo';
  if (gateway === 'stripe') return new StripePaymentGateway();
  return new DemoPaymentGateway();
}

export * from './types';
