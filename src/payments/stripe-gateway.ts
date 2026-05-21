import type { PaymentGateway, PaymentInput, PaymentResult } from './types';

export class StripePaymentGateway implements PaymentGateway {
  async processPayment(_input: PaymentInput): Promise<PaymentResult> {
    return {
      success: false,
      error:
        'Stripe is not configured. Set VITE_STRIPE_PUBLISHABLE_KEY and implement Stripe integration.',
    };
  }
}
