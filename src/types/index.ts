import type { Timestamp } from 'firebase/firestore';

export type UserRole = 'admin' | 'tenant';

export type FirestoreTimestamp = Timestamp | Date | string;

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  tenantId?: string;
  photoUrl?: string;
  notificationEmail?: boolean;
  notificationSms?: boolean;
  twoFactorEnabled?: boolean;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export type PropertyStatus = 'active' | 'maintenance';

export interface Property {
  id: string;
  name: string;
  address: string;
  slug: string;
  units: number;
  occupied: number;
  revenue: number;
  status: PropertyStatus;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export type UnitStatus = 'vacant' | 'occupied' | 'maintenance';

export interface Unit {
  id: string;
  propertyId: string;
  unitNumber: string;
  status: UnitStatus;
  tenantId?: string;
  leaseId?: string;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export type TenantStatus = 'active' | 'inactive';
export type PaymentStatus = 'paid' | 'pending' | 'overdue';

export interface Tenant {
  id: string;
  userId?: string;
  name: string;
  email: string;
  phone: string;
  propertyId: string;
  unitId: string;
  propertyName: string;
  unitLabel: string;
  rent: number;
  status: TenantStatus;
  paymentStatus: PaymentStatus;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export type LeaseStatus = 'active' | 'expired' | 'pending' | 'terminated';

export interface Lease {
  id: string;
  tenantId: string;
  propertyId: string;
  unitId: string;
  tenantName: string;
  propertyName: string;
  unitLabel: string;
  startDate: string;
  endDate: string;
  rent: number;
  deposit: number;
  status: LeaseStatus;
  documentPath?: string;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export type InvoiceStatus = 'paid' | 'pending' | 'overdue';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  tenantId: string;
  tenantName: string;
  unitId: string;
  unitLabel: string;
  propertyId: string;
  amount: number;
  dueDate: string;
  paidDate: string | null;
  status: InvoiceStatus;
  method: string | null;
  lateFee?: number;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export type PaymentRecordStatus = 'completed' | 'failed' | 'pending';
export type PaymentGateway = 'demo' | 'stripe';

export interface PaymentRecord {
  id: string;
  tenantId: string;
  invoiceId: string;
  amount: number;
  method: string;
  status: PaymentRecordStatus;
  gateway: PaymentGateway;
  monthLabel?: string;
  createdAt: FirestoreTimestamp;
}

export type MaintenancePriority = 'low' | 'medium' | 'high';
export type MaintenanceStatus = 'submitted' | 'assigned' | 'in_progress' | 'completed';

export interface MaintenanceRequest {
  id: string;
  tenantId: string;
  tenantName: string;
  unitId: string;
  unitLabel: string;
  propertyId: string;
  issue: string;
  description?: string;
  category: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  submitted: string;
  assignedTo: string | null;
  photoUrls?: string[];
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export interface MaintenanceUpdate {
  id: string;
  date: string;
  message: string;
  status: string;
  createdAt: FirestoreTimestamp;
}

export type ActivityType = 'payment' | 'maintenance' | 'lease';
export type ActivityStatus = 'success' | 'pending' | 'danger';

export interface Activity {
  id: string;
  type: ActivityType;
  tenantId?: string;
  tenantName: string;
  action: string;
  amount?: string;
  time: string;
  status: ActivityStatus;
  createdAt: FirestoreTimestamp;
}

export interface Notice {
  id: string;
  title: string;
  body: string;
  propertyId?: string;
  effectiveDate: string;
  createdAt: FirestoreTimestamp;
}

export interface Technician {
  id: string;
  name: string;
  specialties: string[];
  active: boolean;
}

export interface PaymentMethod {
  id: string;
  tenantId: string;
  type: 'card' | 'gcash' | 'bank';
  label: string;
  last4?: string;
  isDefault: boolean;
}

export interface DashboardStats {
  totalProperties: number;
  activeTenants: number;
  monthlyRevenue: number;
  occupancyRate: number;
}

export interface MonthlyChartPoint {
  month: string;
  revenue: number;
  expenses: number;
  occupancy?: number;
  rate?: number;
}

export interface PropertyPerformance {
  name: string;
  revenue: number;
  occupancy: number;
}

export interface MaintenanceCategoryStat {
  name: string;
  value: number;
  color: string;
}
