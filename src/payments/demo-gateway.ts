import { createPayment } from '../services/payments.service';
import { markInvoicePaid } from '../services/invoices.service';
import { createActivity } from '../services/activities.service';
import { formatCurrency } from '../lib/format';
import type { PaymentGateway, PaymentInput, PaymentResult } from './types';

export class DemoPaymentGateway implements PaymentGateway {
  async processPayment(input: PaymentInput): Promise<PaymentResult> {
    try {
      const paidDate = new Date().toISOString().split('T')[0];
      const paymentId = await createPayment({
        tenantId: input.tenantId,
        invoiceId: input.invoiceId,
        amount: input.amount,
        method: input.method,
        gateway: 'demo',
        monthLabel: input.monthLabel,
      });

      await markInvoicePaid(input.invoiceId, input.tenantId, input.method, paidDate);

      await createActivity({
        type: 'payment',
        tenantId: input.tenantId,
        tenantName: input.tenantName,
        action: 'Paid rent',
        amount: formatCurrency(input.amount),
        status: 'success',
      });

      return { success: true, paymentId };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment failed',
      };
    }
  }
}
