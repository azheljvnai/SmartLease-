import {
  Home,
  FileText,
  CreditCard,
  Wrench,
  User,
  type LucideIcon,
} from 'lucide-react';

export type TenantNavItem = {
  name: string;
  href: string;
  icon: LucideIcon;
  description?: string;
};

export const TENANT_NAV: TenantNavItem[] = [
  { name: 'Home', href: '/tenant', icon: Home, description: 'Dashboard overview' },
  { name: 'Lease', href: '/tenant/lease', icon: FileText, description: 'Agreement & documents' },
  { name: 'Payments', href: '/tenant/payments', icon: CreditCard, description: 'Bills & history' },
  { name: 'Maintenance', href: '/tenant/maintenance', icon: Wrench, description: 'Service requests' },
  { name: 'Profile', href: '/tenant/profile', icon: User, description: 'Account settings' },
];

export const TENANT_ROUTE_LABELS: Record<string, string> = {
  '/tenant': 'Home',
  '/tenant/lease': 'Lease',
  '/tenant/payments': 'Payments',
  '/tenant/payments/checkout': 'Checkout',
  '/tenant/maintenance': 'Maintenance',
  '/tenant/profile': 'Profile',
};

export function isTenantNavActive(pathname: string, href: string): boolean {
  if (href === '/tenant') return pathname === href;
  return pathname.startsWith(href);
}
