import { differenceInMonths, format, parseISO } from 'date-fns';

export function computeLeaseDuration(startDate: string, endDate: string): string {
  const months = differenceInMonths(parseISO(endDate), parseISO(startDate));
  if (months <= 0) return '—';
  if (months === 1) return '1 month';
  if (months % 12 === 0) {
    const years = months / 12;
    return years === 1 ? '1 year' : `${years} years`;
  }
  return `${months} months`;
}

export function formatAgreementDate(date: Date): string {
  return format(date, 'MMMM d, yyyy');
}

export function formatGeneratedTimestamp(date: Date): string {
  return format(date, 'MMMM d, yyyy h:mm a');
}

export const PROPERTY_TYPE_LABELS: Record<string, string> = {
  dormitory: 'Dormitory',
  apartment: 'Apartment',
  condominium: 'Condominium',
  boarding_house: 'Boarding House',
  house: 'House',
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Cash',
  bank_transfer: 'Bank Transfer',
  gcash: 'GCash',
  maya: 'Maya',
  other: 'Other',
};

export const TENANT_UTILITY_LABELS: Record<string, string> = {
  electricity: 'Electricity',
  water: 'Water',
  internet: 'Internet',
  parking: 'Parking Fee',
  association_dues: 'Association Dues',
  other: 'Other',
};
