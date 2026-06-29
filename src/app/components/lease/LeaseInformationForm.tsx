import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { FieldLabel } from '../ui/field-label';
import { fieldElementId } from '../../../lib/form-validation';
import type { FormValidationResult } from '../../../lib/form-validation';
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
  errors?: Record<string, string>;
};

function toggleArrayItem<T extends string>(items: T[] | undefined, item: T): T[] {
  const list = items ?? [];
  return list.includes(item) ? list.filter((i) => i !== item) : [...list, item];
}

export function LeaseInformationForm({ value, onChange, lockLesseeContact, errors = {} }: Props) {
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
        <Input
          label="Full Name"
          required
          fieldKey="lessor.name"
          error={errors['lessor.name']}
          value={value.lessor.name}
          onChange={(e) => set('lessor', { name: e.target.value })}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Email"
            type="email"
            required
            fieldKey="lessor.email"
            error={errors['lessor.email']}
            value={value.lessor.email}
            onChange={(e) => set('lessor', { email: e.target.value })}
          />
          <Input label="Phone" type="tel" fieldKey="lessor.phone" value={value.lessor.phone} onChange={(e) => set('lessor', { phone: e.target.value })} />
        </div>
        <Input label="Address" fieldKey="lessor.address" value={value.lessor.address ?? ''} onChange={(e) => set('lessor', { address: e.target.value })} />
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Lessee Information</h3>
          <p className="text-sm text-muted-foreground">Tenant details</p>
        </div>
        <Input
          label="Full Name"
          required
          fieldKey="lessee.name"
          error={errors['lessee.name']}
          value={value.lessee.name}
          disabled={lockLesseeContact}
          onChange={(e) => set('lessee', { name: e.target.value })}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Date of Birth"
            type="date"
            required
            fieldKey="lessee.dateOfBirth"
            error={errors['lessee.dateOfBirth']}
            value={value.lessee.dateOfBirth ?? ''}
            onChange={(e) => set('lessee', { dateOfBirth: e.target.value })}
          />
          <div>
            <FieldLabel htmlFor={fieldElementId('lessee.civilStatus')} label="Civil Status" required />
            <select
              id={fieldElementId('lessee.civilStatus')}
              value={value.lessee.civilStatus ?? ''}
              onChange={(e) => set('lessee', { civilStatus: e.target.value })}
              aria-invalid={!!errors['lessee.civilStatus']}
              className="w-full px-4 py-2.5 bg-input-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary aria-invalid:border-destructive"
            >
              <option value="">Select civil status</option>
              {CIVIL_STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            {errors['lessee.civilStatus'] && (
              <p className="text-xs text-destructive mt-1">{errors['lessee.civilStatus']}</p>
            )}
          </div>
        </div>
        <Input
          label="Nationality"
          required
          fieldKey="lessee.nationality"
          error={errors['lessee.nationality']}
          value={value.lessee.nationality ?? ''}
          onChange={(e) => set('lessee', { nationality: e.target.value })}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Email"
            type="email"
            required
            fieldKey="lessee.email"
            error={errors['lessee.email']}
            value={value.lessee.email}
            disabled={lockLesseeContact}
            onChange={(e) => set('lessee', { email: e.target.value })}
          />
          <Input label="Phone" type="tel" fieldKey="lessee.phone" value={value.lessee.phone} disabled={lockLesseeContact} onChange={(e) => set('lessee', { phone: e.target.value })} />
        </div>
        <Input label="Current Address" fieldKey="lessee.address" value={value.lessee.address ?? ''} onChange={(e) => set('lessee', { address: e.target.value })} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Emergency Contact Name"
            required
            fieldKey="lessee.emergencyContactName"
            error={errors['lessee.emergencyContactName']}
            value={value.lessee.emergencyContactName ?? ''}
            onChange={(e) => set('lessee', { emergencyContactName: e.target.value })}
          />
          <Input
            label="Emergency Contact Number"
            type="tel"
            required
            fieldKey="lessee.emergencyContactPhone"
            error={errors['lessee.emergencyContactPhone']}
            value={value.lessee.emergencyContactPhone ?? ''}
            onChange={(e) => set('lessee', { emergencyContactPhone: e.target.value })}
          />
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Property Details</h3>
        </div>
        <Input
          label="Property Name"
          required
          fieldKey="property.propertyName"
          error={errors['property.propertyName']}
          value={value.property.propertyName}
          onChange={(e) => set('property', { propertyName: e.target.value })}
        />
        <div>
          <FieldLabel htmlFor={fieldElementId('property.propertyType')} label="Property Type" required />
          <select
            id={fieldElementId('property.propertyType')}
            value={value.property.propertyType ?? ''}
            onChange={(e) => set('property', { propertyType: e.target.value as PropertyType })}
            aria-invalid={!!errors['property.propertyType']}
            className="w-full px-4 py-2.5 bg-input-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary aria-invalid:border-destructive"
          >
            <option value="">Select property type</option>
            {PROPERTY_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {errors['property.propertyType'] && (
            <p className="text-xs text-destructive mt-1">{errors['property.propertyType']}</p>
          )}
        </div>
        <Input
          label="Property Address"
          required
          fieldKey="property.address"
          error={errors['property.address']}
          value={value.property.address}
          onChange={(e) => set('property', { address: e.target.value })}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Unit / Room Number"
            required
            fieldKey="property.unitNumber"
            error={errors['property.unitNumber']}
            value={value.property.unitNumber}
            onChange={(e) => set('property', { unitNumber: e.target.value })}
          />
          <Input label="Unit Description" fieldKey="property.description" value={value.property.description ?? ''} onChange={(e) => set('property', { description: e.target.value })} />
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Lease Terms</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Start Date"
            type="date"
            required
            fieldKey="terms.startDate"
            error={errors['terms.startDate']}
            value={value.terms.startDate}
            onChange={(e) => setTerms({ startDate: e.target.value })}
          />
          <Input
            label="End Date"
            type="date"
            required
            fieldKey="terms.endDate"
            error={errors['terms.endDate']}
            value={value.terms.endDate}
            onChange={(e) => setTerms({ endDate: e.target.value })}
          />
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
          <Input
            label="Monthly Rent"
            type="number"
            required
            fieldKey="terms.rent"
            error={errors['terms.rent']}
            value={value.terms.rent || ''}
            onChange={(e) => setTerms({ rent: parseFloat(e.target.value) || 0 })}
          />
          <Input label="Security Deposit" type="number" value={value.terms.deposit || ''} onChange={(e) => setTerms({ deposit: parseFloat(e.target.value) || 0 })} />
          <Input
            label="Advance Rental"
            type="number"
            required
            fieldKey="terms.advanceRent"
            error={errors['terms.advanceRent']}
            value={value.terms.advanceRent ?? ''}
            onChange={(e) => setTerms({ advanceRent: parseFloat(e.target.value) || 0 })}
          />
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
          <Input
            label="Payment Due Day (1–28)"
            type="number"
            min={1}
            max={28}
            required
            fieldKey="terms.paymentDueDay"
            error={errors['terms.paymentDueDay']}
            value={value.terms.paymentDueDay}
            onChange={(e) => setTerms({ paymentDueDay: parseInt(e.target.value, 10) || 1 })}
          />
        </div>
        <div id={fieldElementId('terms.renewable')}>
          <FieldLabel label="Renewable" required />
          <div className="flex gap-4 mt-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="renewable" checked={value.terms.renewable === true} onChange={() => setTerms({ renewable: true })} />
              Yes
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="renewable" checked={value.terms.renewable === false} onChange={() => setTerms({ renewable: false })} />
              No
            </label>
          </div>
          {errors['terms.renewable'] && (
            <p className="text-xs text-destructive mt-1">{errors['terms.renewable']}</p>
          )}
        </div>
        <Input label="Late Fee" type="number" fieldKey="terms.lateFee" value={value.terms.lateFee ?? ''} onChange={(e) => setTerms({ lateFee: e.target.value ? parseFloat(e.target.value) : undefined })} />
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Payment Methods</h3>
        </div>
        <div id={fieldElementId('terms.paymentMethods')}>
          <FieldLabel label="Accepted Payment Methods" required />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
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
          {errors['terms.paymentMethods'] && (
            <p className="text-xs text-destructive mt-1">{errors['terms.paymentMethods']}</p>
          )}
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
          <Textarea
            label="Utility Billing Arrangement"
            fieldKey="terms.utilityBillingNotes"
            value={value.terms.utilityBillingNotes ?? ''}
            onChange={(e) => setTerms({ utilityBillingNotes: e.target.value })}
            rows={3}
            placeholder="Describe how utilities are billed..."
          />
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Occupancy</h3>
        </div>
        <Input
          label="Maximum Number of Occupants"
          type="number"
          min={1}
          required
          fieldKey="terms.maxOccupants"
          error={errors['terms.maxOccupants']}
          value={value.terms.maxOccupants ?? ''}
          onChange={(e) => setTerms({ maxOccupants: parseInt(e.target.value, 10) || 1 })}
        />
        <div className="space-y-2">
          <FieldLabel label="Authorized Occupants" showOptional />
          {[0, 1, 2].map((i) => (
            <Input
              key={i}
              label={`Occupant ${i + 1}`}
              showOptional={false}
              value={value.terms.authorizedOccupants?.[i] ?? ''}
              onChange={(e) => setOccupant(i, e.target.value)}
            />
          ))}
        </div>
        <Input label="Pet Policy" fieldKey="terms.petPolicy" value={value.terms.petPolicy ?? ''} onChange={(e) => setTerms({ petPolicy: e.target.value })} />
        <div>
          <Textarea
            label="Additional Terms"
            fieldKey="terms.additionalTerms"
            value={value.terms.additionalTerms ?? ''}
            onChange={(e) => setTerms({ additionalTerms: e.target.value })}
            rows={4}
            placeholder="Any additional clauses or conditions..."
          />
        </div>
      </section>
    </div>
  );
}

export function validateLeaseAgreementForm(data: LeaseAgreementFormData): FormValidationResult {
  const errors: Record<string, string> = {};

  if (!data.lessor.name.trim()) errors['lessor.name'] = 'Lessor name is required';
  if (!data.lessor.email.trim()) errors['lessor.email'] = 'Lessor email is required';
  if (!data.lessee.name.trim()) errors['lessee.name'] = 'Lessee name is required';
  if (!data.lessee.email.trim()) errors['lessee.email'] = 'Lessee email is required';
  if (!data.lessee.dateOfBirth) errors['lessee.dateOfBirth'] = 'Date of birth is required';
  if (!data.lessee.civilStatus?.trim()) errors['lessee.civilStatus'] = 'Civil status is required';
  if (!data.lessee.nationality?.trim()) errors['lessee.nationality'] = 'Nationality is required';
  if (!data.lessee.emergencyContactName?.trim()) {
    errors['lessee.emergencyContactName'] = 'Emergency contact name is required';
  }
  if (!data.lessee.emergencyContactPhone?.trim()) {
    errors['lessee.emergencyContactPhone'] = 'Emergency contact number is required';
  }
  if (!data.property.propertyName.trim()) errors['property.propertyName'] = 'Property name is required';
  if (!data.property.address.trim()) errors['property.address'] = 'Property address is required';
  if (!data.property.unitNumber.trim()) errors['property.unitNumber'] = 'Unit number is required';
  if (!data.property.propertyType) errors['property.propertyType'] = 'Property type is required';
  if (!data.terms.startDate) errors['terms.startDate'] = 'Lease start date is required';
  if (!data.terms.endDate) errors['terms.endDate'] = 'Lease end date is required';
  if (!data.terms.rent || data.terms.rent <= 0) {
    errors['terms.rent'] = 'Monthly rent must be greater than zero';
  }
  if (data.terms.advanceRent == null || data.terms.advanceRent < 0) {
    errors['terms.advanceRent'] = 'Advance rental is required';
  }
  if (data.terms.renewable == null) errors['terms.renewable'] = 'Please specify whether the lease is renewable';
  if (!data.terms.paymentMethods?.length) {
    errors['terms.paymentMethods'] = 'Select at least one payment method';
  }
  if (!data.terms.maxOccupants || data.terms.maxOccupants < 1) {
    errors['terms.maxOccupants'] = 'Maximum occupants must be at least 1';
  }
  if (data.terms.paymentDueDay < 1 || data.terms.paymentDueDay > 28) {
    errors['terms.paymentDueDay'] = 'Payment due day must be between 1 and 28';
  }

  const firstField = Object.keys(errors)[0] ?? null;
  return {
    valid: firstField === null,
    errors,
    firstField,
    message: firstField ? errors[firstField] : null,
  };
}
