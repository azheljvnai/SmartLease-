export interface CompanyBranding {
  name: string;
  address: string;
  phone: string;
  email: string;
  paymentInstructions: string;
}

export function getCompanyBranding(): CompanyBranding {
  return {
    name: (import.meta.env.VITE_COMPANY_NAME as string) || 'SmartLease Property Management',
    address: (import.meta.env.VITE_COMPANY_ADDRESS as string) || '',
    phone: (import.meta.env.VITE_COMPANY_PHONE as string) || '',
    email: (import.meta.env.VITE_COMPANY_EMAIL as string) || '',
    paymentInstructions:
      (import.meta.env.VITE_PAYMENT_INSTRUCTIONS as string) ||
      'Please remit payment via bank transfer, GCash, or Maya. Contact the property manager for account details and reference your invoice number.',
  };
}
