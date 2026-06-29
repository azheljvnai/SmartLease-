import type { PaymentGateway, PaymentInput, PaymentResult } from './types';

const PAYMONGO_METHOD_MAP = {
  gcash: 'gcash',
  paymaya: 'paymaya',
  card: 'card',
} as const;

export class PayMongoPaymentGateway implements PaymentGateway {
  async processPayment(input: PaymentInput): Promise<PaymentResult> {
    const methodType = input.paymentMethodType ?? 'gcash';
    const apiBase = import.meta.env.VITE_PAYMONGO_API_URL ?? '/.netlify/functions/paymongo-checkout';

    try {
      const res = await fetch(apiBase, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: input.invoiceId,
          tenantId: input.tenantId,
          amount: input.amount,
          tenantName: input.tenantName,
          method: PAYMONGO_METHOD_MAP[methodType],
          returnUrl: `${window.location.origin}/tenant/payments?status=success`,
        }),
      });

      const data = (await res.json()) as { checkoutUrl?: string; error?: string };
      if (!res.ok || !data.checkoutUrl) {
        return {
          success: false,
          error: data.error ?? 'Could not start PayMongo checkout. Configure PAYMONGO_SECRET_KEY on Netlify.',
        };
      }

      return { success: true, redirectUrl: data.checkoutUrl };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'PayMongo checkout failed',
      };
    }
  }
}
