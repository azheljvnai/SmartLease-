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

export type LeaseStatus = 'active' | 'expired' | 'pending' | 'terminated' | 'renewed';

/** User-facing document lifecycle (derived from status + documentStatus). */
export type LeaseLifecycleStatus =
  | 'draft'
  | 'pending_signature'
  | 'pending_verification'
  | 'verified'
  | 'signed'
  | 'active'
  | 'expired'
  | 'terminated'
  | 'renewed'
  | 'rejected';

export type LeaseType =
  | 'fixed_term'
  | 'month_to_month'
  | 'short_term'
  | 'commercial'
  | 'residential';

/** Workflow status for lease agreement documents (manual signing path). */
export type LeaseDocumentStatus =
  | 'draft'
  | 'lease_agreement_generated'
  | 'awaiting_signed_copy'
  | 'pending_verification'
  | 'verified'
  | 'rejected'
  /** @deprecated Use `verified` — kept for existing records */
  | 'signed_lease_uploaded'
  | 'active_lease';

/** User-facing lease document status shown in tenant and admin portals. */
export type LeaseDisplayStatus =
  | 'draft'
  | 'pending_signature'
  | 'pending_verification'
  | 'verified'
  | 'active'
  | 'expired'
  | 'renewed'
  | 'terminated'
  | 'rejected';

export interface LeaseSignedVerification {
  uploadedBy: 'admin' | 'tenant';
  uploadedAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
}

export interface LeaseHistoryEntry {
  id: string;
  action: string;
  details?: string;
  performedBy?: string;
  createdAt: FirestoreTimestamp;
}

export type PaymentSchedule = 'monthly' | 'quarterly' | 'semi-annual' | 'annual';

export type PropertyType =
  | 'dormitory'
  | 'apartment'
  | 'condominium'
  | 'boarding_house'
  | 'house';

export type LeasePaymentMethod =
  | 'cash'
  | 'bank_transfer'
  | 'gcash'
  | 'maya'
  | 'other';

export type TenantUtility =
  | 'electricity'
  | 'water'
  | 'internet'
  | 'parking'
  | 'association_dues'
  | 'other';

export interface LeasePartyInfo {
  name: string;
  email: string;
  phone: string;
  address?: string;
  dateOfBirth?: string;
  civilStatus?: string;
  nationality?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export interface LeasePropertyDetails {
  propertyName: string;
  address: string;
  unitNumber: string;
  description?: string;
  propertyType?: PropertyType;
}

export interface LeaseTerms {
  leaseType?: LeaseType;
  startDate: string;
  endDate: string;
  rent: number;
  deposit: number;
  advanceRent?: number;
  renewable?: boolean;
  paymentSchedule: PaymentSchedule;
  paymentDueDay: number;
  paymentMethods?: LeasePaymentMethod[];
  paymentMethodsOther?: string;
  tenantUtilities?: TenantUtility[];
  utilitiesOther?: string;
  utilityBillingNotes?: string;
  maxOccupants?: number;
  authorizedOccupants?: string[];
  lateFee?: number;
  utilitiesIncluded?: boolean;
  petPolicy?: string;
  additionalTerms?: string;
}

export interface LeasePdfMetadata {
  leaseId: string;
  tenantId: string;
  propertyId: string;
  generatedAt: Date;
}

export interface LeaseDocumentFile {
  storagePath: string;
  downloadUrl?: string;
  fileName: string;
  uploadedAt: FirestoreTimestamp;
  contentType?: string;
  /** Inline base64 fallback when Firebase Storage is unavailable (Spark plan). */
  inlineData?: string;
  /** Points to `leases/{leaseId}/documentFiles/{id}` when inline data is stored separately. */
  inlineStorageId?: 'unsigned' | 'signed';
}

export interface LeaseDocuments {
  unsigned?: LeaseDocumentFile;
  signed?: LeaseDocumentFile;
}

/** Collected lease agreement form data; extensible for future e-signature metadata. */
export interface LeaseAgreementFormData {
  lessor: LeasePartyInfo;
  lessee: LeasePartyInfo;
  property: LeasePropertyDetails;
  terms: LeaseTerms;
}

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
  leaseType?: LeaseType;
  status: LeaseStatus;
  documentStatus: LeaseDocumentStatus;
  signedVerification?: LeaseSignedVerification;
  agreement?: LeaseAgreementFormData;
  documents?: LeaseDocuments;
  previousLeaseId?: string;
  renewedToLeaseId?: string;
  terminatedAt?: string;
  terminationReason?: string;
  /** @deprecated Use documents.unsigned */
  documentPath?: string;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export type InvoiceStatus = 'paid' | 'pending' | 'overdue';
export type InvoiceEmailStatus = 'not_sent' | 'sent' | 'failed' | 'skipped';

export interface InvoiceDocumentFile {
  storagePath: string;
  downloadUrl?: string;
  fileName: string;
  generatedAt: string;
  inlineData?: string;
}

export interface InvoiceDeliveryRecord {
  sentAt: string;
  method: 'email';
  status: 'sent' | 'failed' | 'skipped';
  error?: string;
  regenerated?: boolean;
}

export type InvoiceType = 'rent' | 'maintenance' | 'other';

export interface InvoiceLineItem {
  label: string;
  amount: number;
  maintenanceRequestId?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  tenantId: string;
  tenantName: string;
  unitId: string;
  unitLabel: string;
  propertyId: string;
  propertyName?: string;
  propertyAddress?: string;
  amount: number;
  dueDate: string;
  paidDate: string | null;
  status: InvoiceStatus;
  method: string | null;
  lateFee?: number;
  billingPeriodStart?: string;
  billingPeriodEnd?: string;
  notes?: string;
  invoiceType?: InvoiceType;
  maintenanceRequestId?: string;
  lineItems?: InvoiceLineItem[];
  paymentLinkUrl?: string;
  pdfFile?: InvoiceDocumentFile;
  emailStatus?: InvoiceEmailStatus;
  lastEmailSentAt?: string;
  deliveryHistory?: InvoiceDeliveryRecord[];
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export type ManualPaymentMethod = 'qrph' | 'gcash' | 'maya';
export type PaymentVerificationStatus = 'pending_verification' | 'approved' | 'rejected';
export type PaymentRecordStatus =
  | 'completed'
  | 'failed'
  | 'pending'
  | 'pending_verification';

export interface PaymentReceiptFile {
  fileName: string;
  downloadUrl?: string;
  inlineData?: string;
  contentType?: string;
}

export interface PaymentRecord {
  id: string;
  tenantId: string;
  tenantName?: string;
  invoiceId: string;
  invoiceNumber?: string;
  billingPeriodStart?: string;
  billingPeriodEnd?: string;
  amountDue?: number;
  amount: number;
  method: string;
  referenceNumber?: string;
  paymentDate?: string;
  receiptFile?: PaymentReceiptFile;
  verificationStatus?: PaymentVerificationStatus;
  remarks?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  status: PaymentRecordStatus;
  gateway?: 'manual' | 'paymongo' | 'demo';
  monthLabel?: string;
  createdAt: FirestoreTimestamp;
}

export type PaymentInstructionMethod = ManualPaymentMethod;

export interface PaymentInstructionEntry {
  accountName: string;
  accountNumber: string;
  instructions: string;
  qrImageUrl?: string;
  qrInlineData?: string;
}

export interface PaymentInstructionsSettings {
  qrph: PaymentInstructionEntry;
  gcash: PaymentInstructionEntry;
  maya: PaymentInstructionEntry;
  updatedAt?: string;
}

export type MaintenancePriority = 'low' | 'medium' | 'high' | 'emergency';

export type MaintenanceCategory =
  | 'Plumbing'
  | 'Electrical'
  | 'HVAC'
  | 'Appliance'
  | 'Structural'
  | 'Pest Control'
  | 'General';

export type MaintenanceStatus =
  | 'requested'
  | 'under_review'
  | 'assigned'
  | 'scheduled'
  | 'in_progress'
  | 'waiting_parts'
  | 'completed'
  | 'closed'
  | 'cancelled'
  /** @deprecated use requested */
  | 'pending'
  /** @deprecated use requested */
  | 'submitted';

export type MaintenancePaymentStatus = 'unpaid' | 'pending' | 'paid' | 'waived';

export type MaintenanceUpdateType =
  | 'submission'
  | 'status_change'
  | 'assignment'
  | 'schedule'
  | 'note'
  | 'photo'
  | 'cost'
  | 'completion'
  | 'info_request'
  | 'priority_change';

export interface MaintenanceAttachment {
  id: string;
  name: string;
  url: string;
  type: 'invoice' | 'document' | 'photo';
  uploadedAt: string;
  uploadedBy?: string;
}

export interface MaintenanceCostBreakdown {
  estimatedCost?: number;
  laborCost?: number;
  materialsCost?: number;
  additionalCharges?: number;
  actualCost?: number;
  materialsUsed?: string;
  paymentStatus?: MaintenancePaymentStatus;
  invoiceUrl?: string;
}

export interface MaintenanceRequest {
  id: string;
  requestNumber?: string;
  tenantId: string;
  tenantName: string;
  unitId: string;
  unitLabel: string;
  propertyId: string;
  propertyName?: string;
  issue: string;
  description?: string;
  category: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  submitted: string;
  assignedTo: string | null;
  technicianId?: string | null;
  assignedDate?: string | null;
  scheduledDate?: string | null;
  scheduledTime?: string | null;
  estimatedCompletionDate?: string | null;
  completedDate?: string | null;
  closedDate?: string | null;
  estimatedCost?: number;
  laborCost?: number;
  materialsCost?: number;
  additionalCharges?: number;
  actualCost?: number;
  materialsUsed?: string;
  paymentStatus?: MaintenancePaymentStatus;
  invoiceUrl?: string;
  linkedInvoiceId?: string;
  adminNotes?: string;
  internalNotes?: string;
  photoUrls?: string[];
  attachments?: MaintenanceAttachment[];
  preferredScheduleDate?: string | null;
  preferredScheduleTime?: string | null;
  tenantConfirmedAt?: string | null;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export interface MaintenanceUpdate {
  id: string;
  date: string;
  message: string;
  status: string;
  type?: MaintenanceUpdateType;
  author?: string;
  authorRole?: 'admin' | 'technician' | 'tenant' | 'system';
  createdAt: FirestoreTimestamp;
}

export interface TechnicianWorkload {
  technicianId: string;
  name: string;
  openCount: number;
  inProgressCount: number;
  completedCount: number;
  scheduledCount: number;
}

export interface MaintenanceChartPoint {
  month: string;
  value: number;
}

export interface MaintenanceDashboardStats {
  openRequests: number;
  assignedRequests: number;
  inProgress: number;
  completedThisMonth: number;
  emergencyRequests: number;
  averageResolutionDays: number;
  averageCost: number;
  technicianWorkload: TechnicianWorkload[];
  byCategory: MaintenanceCategoryStat[];
  byProperty: MaintenanceCategoryStat[];
  byMonth: MaintenanceChartPoint[];
  statusDistribution: MaintenanceCategoryStat[];
  resolutionTrend: MaintenanceChartPoint[];
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
  email?: string;
  phone?: string;
  specialties: string[];
  assignedPropertyIds?: string[];
  availability?: 'available' | 'busy' | 'off_duty';
  completedJobs?: number;
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
  invoiced?: number;
}

export interface PropertyPerformance {
  name: string;
  revenue: number;
  occupancy: number;
}

export interface PortfolioPropertyRow {
  name: string;
  totalUnits: number;
  occupied: number;
  vacant: number;
  occupancyRate: number;
  revenue: number;
  outstandingBalance: number;
  openMaintenance: number;
  status: string;
}

export interface PortfolioKpis {
  totalRevenue: number;
  revenueThisMonth: number;
  outstandingBalance: number;
  occupancyRate: number;
  activeLeases: number;
  vacantUnits: number;
  openMaintenance: number;
}

export interface PortfolioReportData {
  title: string;
  reportingPeriod: string;
  generatedAt: string;
  kpis: PortfolioKpis;
  revenueByProperty: { label: string; value: number }[];
  monthlyRevenue: { month: string; value: number }[];
  occupancyByProperty: { label: string; value: number }[];
  occupancyDistribution: MaintenanceCategoryStat[];
  leaseStatus: MaintenanceCategoryStat[];
  maintenanceStatus: MaintenanceCategoryStat[];
  properties: PortfolioPropertyRow[];
  insights: string[];
}

export interface MaintenanceCategoryStat {
  name: string;
  value: number;
  color: string;
}

export interface ReportKpis {
  totalRevenue: number;
  collectedThisMonth: number;
  outstandingBalance: number;
  overdueCount: number;
  occupancyRate: number;
  activeLeases: number;
  openMaintenance: number;
  totalTenants: number;
}

export interface RevenueReportRow {
  month: string;
  invoiced: number;
  collected: number;
  outstanding: number;
  overdue: number;
}

export interface OccupancyReportRow {
  property: string;
  totalUnits: number;
  occupied: number;
  vacant: number;
  occupancyRate: number;
}

export interface LeaseReportRow {
  tenant: string;
  property: string;
  unit: string;
  startDate: string;
  endDate: string;
  rent: number;
  status: string;
}

export interface PaymentHistoryRow {
  date: string;
  tenant: string;
  invoiceNumber: string;
  amount: number;
  method: string;
  status: string;
}

export interface OutstandingBalanceRow {
  tenant: string;
  property: string;
  unit: string;
  invoiceNumber: string;
  amount: number;
  lateFee: number;
  totalDue: number;
  dueDate: string;
  daysOverdue: number;
}

export interface MaintenanceReportRow {
  issue: string;
  property: string;
  unit: string;
  category: string;
  priority: string;
  status: string;
  assignedTo: string;
  submitted: string;
  completedDate: string;
  actualCost: number;
}

export interface TenantReportRow {
  name: string;
  email: string;
  property: string;
  unit: string;
  rent: number;
  status: string;
  paymentStatus: string;
}

export type NotificationType = 'payment' | 'maintenance' | 'lease' | 'notice' | 'general';

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  read: boolean;
  type: NotificationType;
  createdAt: FirestoreTimestamp;
}
