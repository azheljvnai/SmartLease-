import { DemoPaymentGateway } from './demo-gateway';
import { PayMongoPaymentGateway } from './paymongo-gateway';
import { StripePaymentGateway } from './stripe-gateway';
import type { PaymentGateway } from './types';

export function getPaymentGateway(): PaymentGateway {
  const gateway = import.meta.env.VITE_PAYMENT_GATEWAY ?? 'demo';
  if (gateway === 'paymongo') return new PayMongoPaymentGateway();
  if (gateway === 'stripe') return new StripePaymentGateway();
  return new DemoPaymentGateway();
}

export * from './types';
