import { format, formatDistanceToNow, parseISO } from 'date-fns';

const PHP_FORMATTER = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 0,
});

export function formatCurrency(amount: number): string {
  return PHP_FORMATTER.format(amount);
}

/** Compact label for large amounts, e.g. ₱67K */
export function formatCurrencyCompact(amount: number): string {
  if (amount >= 1_000_000) {
    return `₱${(amount / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (amount >= 1_000) {
    return `₱${Math.round(amount / 1_000)}K`;
  }
  return formatCurrency(amount);
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'MMM d, yyyy');
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

export function toMonthLabel(date: string): string {
  return format(parseISO(date), 'MMMM yyyy');
}
