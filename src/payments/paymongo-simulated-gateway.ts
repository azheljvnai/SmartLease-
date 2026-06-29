import type { PaymentGateway, PaymentInput, PaymentResult } from './types';
import { createCheckoutSession } from './checkout-session';

const METHOD_LABELS = {
  gcash: 'GCash',
  paymaya: 'Maya',
  card: 'Credit Card',
} as const;

export class PayMongoSimulatedGateway implements PaymentGateway {
  async processPayment(input: PaymentInput): Promise<PaymentResult> {
    try {
      const methodType = input.paymentMethodType ?? 'gcash';
      const session = createCheckoutSession({
        invoiceId: input.invoiceId,
        invoiceNumber: input.invoiceNumber ?? input.invoiceId,
        tenantId: input.tenantId,
        tenantName: input.tenantName,
        amount: input.amount,
        method: METHOD_LABELS[methodType],
        paymentMethodType: methodType,
        monthLabel: input.monthLabel,
      });

      const redirectUrl = `/tenant/payments/checkout?token=${encodeURIComponent(session.token)}`;
      return { success: true, redirectUrl };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Could not start checkout',
      };
    }
  }
}
