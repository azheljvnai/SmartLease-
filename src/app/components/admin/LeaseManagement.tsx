import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Check, User, Home, FileText, PenTool, CheckCircle2 } from 'lucide-react';
import { listProperties } from '../../../services/properties.service';
import { listAllUnits } from '../../../services/units.service';
import { createTenant } from '../../../services/tenants.service';
import { createLease } from '../../../services/leases.service';
import type { Property, Unit } from '../../../types';
import { getFirebaseErrorMessage } from '../../../lib/firebase-errors';
import { formatCurrency } from '../../../lib/format';

const steps = [
  { id: 1, name: 'Tenant Info', icon: User },
  { id: 2, name: 'Unit Assignment', icon: Home },
  { id: 3, name: 'Lease Terms', icon: FileText },
  { id: 4, name: 'Sign Contract', icon: PenTool },
  { id: 5, name: 'Complete', icon: CheckCircle2 },
];

export const LeaseManagement = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    tenantName: '',
    tenantEmail: '',
    tenantPhone: '',
    property: '',
    unit: '',
    startDate: '',
    endDate: '',
    rent: '',
    deposit: '',
  });

  useEffect(() => {
    Promise.all([listProperties(), listAllUnits()]).then(([p, u]) => {
      setProperties(p);
      setUnits(u);
    });
  }, []);

  const propertyUnits = units.filter((u) => u.propertyId === formData.property);

  const handleComplete = async () => {
    const property = properties.find((p) => p.id === formData.property);
    const unit = units.find((u) => u.id === formData.unit);
    if (!property || !unit || !formData.tenantName || !formData.startDate) {
      toast.error('Please complete all required fields');
      return;
    }
    setSubmitting(true);
    try {
      const tenantId = await createTenant({
        name: formData.tenantName,
        email: formData.tenantEmail,
        phone: formData.tenantPhone,
        propertyId: property.id,
        unitId: unit.id,
        propertyName: property.name,
        unitLabel: `${property.name} - Unit ${unit.unitNumber}`,
        rent: parseFloat(formData.rent) || 0,
      });
      await createLease({
        tenantId,
        propertyId: property.id,
        unitId: unit.id,
        tenantName: formData.tenantName,
        propertyName: property.name,
        unitLabel: `Unit ${unit.unitNumber}`,
        startDate: formData.startDate,
        endDate: formData.endDate,
        rent: parseFloat(formData.rent) || 0,
        deposit: parseFloat(formData.deposit) || 0,
      });
      setCurrentStep(5);
      toast.success('Lease created successfully');
    } catch (err) {
      toast.error(getFirebaseErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    if (currentStep === 4) {
      handleComplete();
      return;
    }
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <div className="space-y-4 lg:space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-semibold text-foreground mb-1">Create New Lease</h1>
        <p className="text-sm lg:text-base text-muted-foreground">Complete the steps below to create a new lease agreement</p>
      </div>

      {/* Stepper - Horizontal on desktop */}
      <Card className="hidden lg:block">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = step.id < currentStep;
            const isCurrent = step.id === currentStep;

            return (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`
                      w-12 h-12 rounded-full flex items-center justify-center transition-all
                      ${
                        isCompleted
                          ? 'bg-primary text-primary-foreground'
                          : isCurrent
                          ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                          : 'bg-muted text-muted-foreground'
                      }
                    `}
                  >
                    {isCompleted ? <Check className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                  </div>
                  <p
                    className={`mt-2 text-sm font-medium ${
                      isCurrent ? 'text-primary' : isCompleted ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {step.name}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className="flex-1 h-0.5 bg-border relative -top-5 mx-4">
                    <div
                      className={`h-full transition-all ${isCompleted ? 'bg-primary' : 'bg-transparent'}`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Stepper - Vertical on mobile */}
      <Card className="lg:hidden">
        <div className="space-y-4">
          {steps.map((step) => {
            const Icon = step.icon;
            const isCompleted = step.id < currentStep;
            const isCurrent = step.id === currentStep;

            return (
              <div key={step.id} className="flex items-center gap-4">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all
                    ${
                      isCompleted
                        ? 'bg-primary text-primary-foreground'
                        : isCurrent
                        ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                        : 'bg-muted text-muted-foreground'
                    }
                  `}
                >
                  {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <p
                    className={`font-medium ${
                      isCurrent ? 'text-primary' : isCompleted ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {step.name}
                  </p>
                  {isCurrent && <p className="text-sm text-muted-foreground">Current step</p>}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Form content */}
      <Card>
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Tenant Information</h3>
              <p className="text-sm text-muted-foreground">Enter the tenant's personal details</p>
            </div>
            <div className="space-y-4">
              <Input
                label="Full Name"
                type="text"
                placeholder="John Smith"
                value={formData.tenantName}
                onChange={(e) => handleInputChange('tenantName', e.target.value)}
              />
              <Input
                label="Email Address"
                type="email"
                placeholder="john@example.com"
                value={formData.tenantEmail}
                onChange={(e) => handleInputChange('tenantEmail', e.target.value)}
              />
              <Input
                label="Phone Number"
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={formData.tenantPhone}
                onChange={(e) => handleInputChange('tenantPhone', e.target.value)}
              />
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Unit Assignment</h3>
              <p className="text-sm text-muted-foreground">Select the property and unit for this lease</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-foreground">Select Property</label>
                <select
                  value={formData.property}
                  onChange={(e) => handleInputChange('property', e.target.value)}
                  className="w-full px-4 py-2.5 bg-input-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Choose a property</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-foreground">Select Unit</label>
                <select
                  value={formData.unit}
                  onChange={(e) => handleInputChange('unit', e.target.value)}
                  className="w-full px-4 py-2.5 bg-input-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Choose a unit</option>
                  {propertyUnits.map((u) => (
                    <option key={u.id} value={u.id}>Unit {u.unitNumber} - {u.status}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Lease Terms</h3>
              <p className="text-sm text-muted-foreground">Define the lease duration and financial terms</p>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Start Date"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                />
                <Input
                  label="End Date"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Monthly Rent"
                  type="number"
                  placeholder="1200"
                  value={formData.rent}
                  onChange={(e) => handleInputChange('rent', e.target.value)}
                />
                <Input
                  label="Security Deposit"
                  type="number"
                  placeholder="2400"
                  value={formData.deposit}
                  onChange={(e) => handleInputChange('deposit', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Contract Signing</h3>
              <p className="text-sm text-muted-foreground">Review and finalize the lease agreement</p>
            </div>
            <div className="space-y-4">
              <Card className="bg-accent/50">
                <h4 className="font-semibold text-foreground mb-4">Lease Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tenant:</span>
                    <span className="font-medium text-foreground">{formData.tenantName || 'Not set'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Property:</span>
                    <span className="font-medium text-foreground">{formData.property || 'Not set'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Unit:</span>
                    <span className="font-medium text-foreground">{formData.unit || 'Not set'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration:</span>
                    <span className="font-medium text-foreground">
                      {formData.startDate && formData.endDate
                        ? `${formData.startDate} to ${formData.endDate}`
                        : 'Not set'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monthly Rent:</span>
                    <span className="font-medium text-foreground">
                      {formData.rent ? formatCurrency(Number(formData.rent)) : formatCurrency(0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Security Deposit:</span>
                    <span className="font-medium text-foreground">
                      {formData.deposit ? formatCurrency(Number(formData.deposit)) : formatCurrency(0)}
                    </span>
                  </div>
                </div>
              </Card>
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <PenTool className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-2">Digital signature area</p>
                <Button variant="outline">Add Signature</Button>
              </div>
            </div>
          </div>
        )}

        {currentStep === 5 && (
          <div className="space-y-6 text-center py-8">
            <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-12 h-12 text-success" />
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-foreground mb-2">Lease Created Successfully!</h3>
              <p className="text-muted-foreground">
                The lease agreement has been created and sent to the tenant for review.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="outline">View Lease</Button>
              <Button variant="primary">Create Another Lease</Button>
            </div>
          </div>
        )}
      </Card>

      {/* Navigation buttons */}
      {currentStep < 5 && (
        <div className="flex justify-between gap-4">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="w-full sm:w-auto"
          >
            Previous
          </Button>
          <Button
            variant="primary"
            onClick={handleNext}
            loading={submitting}
            className="w-full sm:w-auto"
          >
            {currentStep === 4 ? 'Complete Lease' : 'Next Step'}
          </Button>
        </div>
      )}
    </div>
  );
};
