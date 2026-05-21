export interface PaymentInput {
  tenantId: string;
  invoiceId: string;
  amount: number;
  method: string;
  tenantName: string;
  monthLabel?: string;
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  error?: string;
}

export interface PaymentGateway {
  processPayment(input: PaymentInput): Promise<PaymentResult>;
}
