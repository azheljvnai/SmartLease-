import { Input } from '../ui/input';
import type {
  LeaseAgreementFormData,
  LeasePaymentMethod,
  LeaseType,
  PropertyType,
  TenantUtility,
} from '../../../types';

export const defaultLeaseAgreementForm = (): LeaseAgreementFormData => ({
  lessor: { name: '', email: '', phone: '', address: '' },
  lessee: {
    name: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    civilStatus: '',
    nationality: 'Filipino',
    emergencyContactName: '',
    emergencyContactPhone: '',
  },
  property: { propertyName: '', address: '', unitNumber: '', description: '', propertyType: undefined },
  terms: {
    startDate: '',
    endDate: '',
    rent: 0,
    deposit: 0,
    advanceRent: 0,
    leaseType: 'fixed_term' as LeaseType,
    renewable: true,
    paymentSchedule: 'monthly',
    paymentDueDay: 1,
    paymentMethods: [],
    paymentMethodsOther: '',
    tenantUtilities: [],
    utilitiesOther: '',
    utilityBillingNotes: '',
    maxOccupants: 1,
    authorizedOccupants: ['', '', ''],
    lateFee: undefined,
    utilitiesIncluded: false,
    petPolicy: '',
    additionalTerms: '',
  },
});

const PAYMENT_METHOD_OPTIONS: { value: LeasePaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'gcash', label: 'GCash' },
  { value: 'maya', label: 'Maya' },
  { value: 'other', label: 'Other' },
];

const UTILITY_OPTIONS: { value: TenantUtility; label: string }[] = [
  { value: 'electricity', label: 'Electricity' },
  { value: 'water', label: 'Water' },
  { value: 'internet', label: 'Internet' },
  { value: 'parking', label: 'Parking Fee' },
  { value: 'association_dues', label: 'Association Dues' },
  { value: 'other', label: 'Other' },
];

const PROPERTY_TYPE_OPTIONS: { value: PropertyType; label: string }[] = [
  { value: 'dormitory', label: 'Dormitory' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'condominium', label: 'Condominium' },
  { value: 'boarding_house', label: 'Boarding House' },
  { value: 'house', label: 'House' },
];

const LEASE_TYPE_OPTIONS: { value: LeaseType; label: string }[] = [
  { value: 'fixed_term', label: 'Fixed Term' },
  { value: 'month_to_month', label: 'Month-to-Month' },
  { value: 'short_term', label: 'Short Term' },
  { value: 'residential', label: 'Residential' },
  { value: 'commercial', label: 'Commercial' },
];

const CIVIL_STATUS_OPTIONS = ['Single', 'Married', 'Widowed', 'Separated', 'Divorced'];

type Props = {
  value: LeaseAgreementFormData;
  onChange: (value: LeaseAgreementFormData) => void;
  /** When true, locks name/email/phone captured in the wizard's first step. */
  lockLesseeContact?: boolean;
};

function toggleArrayItem<T extends string>(items: T[] | undefined, item: T): T[] {
  const list = items ?? [];
  return list.includes(item) ? list.filter((i) => i !== item) : [...list, item];
}

export function LeaseInformationForm({ value, onChange, lockLesseeContact }: Props) {
  const set = <K extends keyof LeaseAgreementFormData>(
    section: K,
    patch: Partial<LeaseAgreementFormData[K]>,
  ) => {
    onChange({ ...value, [section]: { ...value[section], ...patch } });
  };

  const setTerms = (patch: Partial<LeaseAgreementFormData['terms']>) => {
    onChange({ ...value, terms: { ...value.terms, ...patch } });
  };

  const setOccupant = (index: number, name: string) => {
    const occupants = [...(value.terms.authorizedOccupants ?? ['', '', ''])];
    occupants[index] = name;
    setTerms({ authorizedOccupants: occupants });
  };

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Lessor Information</h3>
          <p className="text-sm text-muted-foreground">Property owner / landlord details</p>
        </div>
        <Input label="Full Name" value={value.lessor.name} onChange={(e) => set('lessor', { name: e.target.value })} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Email" type="email" value={value.lessor.email} onChange={(e) => set('lessor', { email: e.target.value })} />
          <Input label="Phone" type="tel" value={value.lessor.phone} onChange={(e) => set('lessor', { phone: e.target.value })} />
        </div>
        <Input label="Address" value={value.lessor.address ?? ''} onChange={(e) => set('lessor', { address: e.target.value })} />
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Lessee Information</h3>
          <p className="text-sm text-muted-foreground">Tenant details</p>
        </div>
        <Input label="Full Name *" value={value.lessee.name} disabled={lockLesseeContact} onChange={(e) => set('lessee', { name: e.target.value })} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Date of Birth *" type="date" value={value.lessee.dateOfBirth ?? ''} onChange={(e) => set('lessee', { dateOfBirth: e.target.value })} />
          <div>
            <label className="block mb-2 text-sm font-medium text-foreground">Civil Status *</label>
            <select
              value={value.lessee.civilStatus ?? ''}
              onChange={(e) => set('lessee', { civilStatus: e.target.value })}
              className="w-full px-4 py-2.5 bg-input-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select civil status</option>
              {CIVIL_STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
        <Input label="Nationality *" value={value.lessee.nationality ?? ''} onChange={(e) => set('lessee', { nationality: e.target.value })} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Email *" type="email" value={value.lessee.email} disabled={lockLesseeContact} onChange={(e) => set('lessee', { email: e.target.value })} />
          <Input label="Phone" type="tel" value={value.lessee.phone} disabled={lockLesseeContact} onChange={(e) => set('lessee', { phone: e.target.value })} />
        </div>
        <Input label="Current Address" value={value.lessee.address ?? ''} onChange={(e) => set('lessee', { address: e.target.value })} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Emergency Contact Name *" value={value.lessee.emergencyContactName ?? ''} onChange={(e) => set('lessee', { emergencyContactName: e.target.value })} />
          <Input label="Emergency Contact Number *" type="tel" value={value.lessee.emergencyContactPhone ?? ''} onChange={(e) => set('lessee', { emergencyContactPhone: e.target.value })} />
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Property Details</h3>
        </div>
        <Input label="Property Name" value={value.property.propertyName} onChange={(e) => set('property', { propertyName: e.target.value })} />
        <div>
          <label className="block mb-2 text-sm font-medium text-foreground">Property Type</label>
          <select
            value={value.property.propertyType ?? ''}
            onChange={(e) => set('property', { propertyType: e.target.value as PropertyType })}
            className="w-full px-4 py-2.5 bg-input-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Select property type</option>
            {PROPERTY_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <Input label="Property Address" value={value.property.address} onChange={(e) => set('property', { address: e.target.value })} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Unit / Room Number" value={value.property.unitNumber} onChange={(e) => set('property', { unitNumber: e.target.value })} />
          <Input label="Unit Description (optional)" value={value.property.description ?? ''} onChange={(e) => set('property', { description: e.target.value })} />
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Lease Terms</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Start Date" type="date" value={value.terms.startDate} onChange={(e) => setTerms({ startDate: e.target.value })} />
          <Input label="End Date" type="date" value={value.terms.endDate} onChange={(e) => setTerms({ endDate: e.target.value })} />
        </div>
        <div>
          <label className="block mb-2 text-sm font-medium text-foreground">Lease Type</label>
          <select
            value={value.terms.leaseType ?? 'fixed_term'}
            onChange={(e) => setTerms({ leaseType: e.target.value as LeaseType })}
            className="w-full px-4 py-2.5 bg-input-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {LEASE_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input label="Monthly Rent" type="number" value={value.terms.rent || ''} onChange={(e) => setTerms({ rent: parseFloat(e.target.value) || 0 })} />
          <Input label="Security Deposit" type="number" value={value.terms.deposit || ''} onChange={(e) => setTerms({ deposit: parseFloat(e.target.value) || 0 })} />
          <Input label="Advance Rental" type="number" value={value.terms.advanceRent ?? ''} onChange={(e) => setTerms({ advanceRent: parseFloat(e.target.value) || 0 })} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block mb-2 text-sm font-medium text-foreground">Payment Schedule</label>
            <select
              value={value.terms.paymentSchedule}
              onChange={(e) => setTerms({ paymentSchedule: e.target.value as LeaseAgreementFormData['terms']['paymentSchedule'] })}
              className="w-full px-4 py-2.5 bg-input-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="semi-annual">Semi-Annual</option>
              <option value="annual">Annual</option>
            </select>
          </div>
          <Input label="Payment Due Day (1–28)" type="number" min={1} max={28} value={value.terms.paymentDueDay} onChange={(e) => setTerms({ paymentDueDay: parseInt(e.target.value, 10) || 1 })} />
        </div>
        <div>
          <label className="block mb-2 text-sm font-medium text-foreground">Renewable</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="renewable" checked={value.terms.renewable === true} onChange={() => setTerms({ renewable: true })} />
              Yes
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="renewable" checked={value.terms.renewable === false} onChange={() => setTerms({ renewable: false })} />
              No
            </label>
          </div>
        </div>
        <Input label="Late Fee (optional)" type="number" value={value.terms.lateFee ?? ''} onChange={(e) => setTerms({ lateFee: e.target.value ? parseFloat(e.target.value) : undefined })} />
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Payment Methods</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {PAYMENT_METHOD_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={(value.terms.paymentMethods ?? []).includes(opt.value)}
                onChange={() => setTerms({ paymentMethods: toggleArrayItem(value.terms.paymentMethods, opt.value) })}
                className="rounded border-input"
              />
              {opt.label}
            </label>
          ))}
        </div>
        {(value.terms.paymentMethods ?? []).includes('other') && (
          <Input label="Other Payment Method" value={value.terms.paymentMethodsOther ?? ''} onChange={(e) => setTerms({ paymentMethodsOther: e.target.value })} />
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Utilities</h3>
          <p className="text-sm text-muted-foreground">Utilities the lessee is responsible for</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {UTILITY_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={(value.terms.tenantUtilities ?? []).includes(opt.value)}
                onChange={() => setTerms({ tenantUtilities: toggleArrayItem(value.terms.tenantUtilities, opt.value) })}
                className="rounded border-input"
              />
              {opt.label}
            </label>
          ))}
        </div>
        {(value.terms.tenantUtilities ?? []).includes('other') && (
          <Input label="Other Utility" value={value.terms.utilitiesOther ?? ''} onChange={(e) => setTerms({ utilitiesOther: e.target.value })} />
        )}
        <div>
          <label className="block mb-2 text-sm font-medium text-foreground">Utility Billing Arrangement</label>
          <textarea
            value={value.terms.utilityBillingNotes ?? ''}
            onChange={(e) => setTerms({ utilityBillingNotes: e.target.value })}
            rows={3}
            className="w-full px-4 py-2.5 bg-input-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Describe how utilities are billed..."
          />
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Occupancy</h3>
        </div>
        <Input label="Maximum Number of Occupants" type="number" min={1} value={value.terms.maxOccupants ?? ''} onChange={(e) => setTerms({ maxOccupants: parseInt(e.target.value, 10) || 1 })} />
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">Authorized Occupants</label>
          {[0, 1, 2].map((i) => (
            <Input
              key={i}
              label={`Occupant ${i + 1}`}
              value={value.terms.authorizedOccupants?.[i] ?? ''}
              onChange={(e) => setOccupant(i, e.target.value)}
            />
          ))}
        </div>
        <Input label="Pet Policy (optional)" value={value.terms.petPolicy ?? ''} onChange={(e) => setTerms({ petPolicy: e.target.value })} />
        <div>
          <label className="block mb-2 text-sm font-medium text-foreground">Additional Terms (optional)</label>
          <textarea
            value={value.terms.additionalTerms ?? ''}
            onChange={(e) => setTerms({ additionalTerms: e.target.value })}
            rows={4}
            className="w-full px-4 py-2.5 bg-input-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Any additional clauses or conditions..."
          />
        </div>
      </section>
    </div>
  );
}

export function validateLeaseAgreementForm(data: LeaseAgreementFormData): string | null {
  if (!data.lessor.name.trim() || !data.lessor.email.trim()) return 'Lessor name and email are required.';
  if (!data.lessee.name.trim() || !data.lessee.email.trim()) return 'Lessee name and email are required.';
  if (!data.lessee.dateOfBirth) return 'Lessee date of birth is required.';
  if (!data.lessee.civilStatus?.trim()) return 'Lessee civil status is required.';
  if (!data.lessee.nationality?.trim()) return 'Lessee nationality is required.';
  if (!data.lessee.emergencyContactName?.trim() || !data.lessee.emergencyContactPhone?.trim()) {
    return 'Lessee emergency contact name and number are required.';
  }
  if (!data.property.propertyName.trim() || !data.property.address.trim() || !data.property.unitNumber.trim()) {
    return 'Property name, address, and unit number are required.';
  }
  if (!data.property.propertyType) return 'Property type is required.';
  if (!data.terms.startDate || !data.terms.endDate) return 'Lease start and end dates are required.';
  if (!data.terms.rent || data.terms.rent <= 0) return 'Monthly rent must be greater than zero.';
  if (data.terms.advanceRent == null || data.terms.advanceRent < 0) return 'Advance rental is required.';
  if (data.terms.renewable == null) return 'Please specify whether the lease is renewable.';
  if (!data.terms.paymentMethods?.length) return 'Select at least one payment method.';
  if (!data.terms.maxOccupants || data.terms.maxOccupants < 1) return 'Maximum occupants must be at least 1.';
  if (data.terms.paymentDueDay < 1 || data.terms.paymentDueDay > 28) return 'Payment due day must be between 1 and 28.';
  return null;
}
