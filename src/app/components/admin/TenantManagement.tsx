import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { User, Plus, Search, Mail, Phone, Home } from 'lucide-react';
import { PageLoader } from '../common/LoadingSpinner';
import { EmptyState } from '../common/EmptyState';
import { subscribeTenants, createTenant, deleteTenant } from '../../../services/tenants.service';
import { listProperties } from '../../../services/properties.service';
import { listVacantUnitsByProperty } from '../../../services/units.service';
import type { Property, Tenant, Unit } from '../../../types';
import { getFirebaseErrorMessage } from '../../../lib/firebase-errors';
import {
  clearFieldError,
  focusFirstFieldError,
  validateFormFields,
} from '../../../lib/form-validation';
import { FormSelect } from '../ui/form-select';
import { formatCurrency } from '../../../lib/format';
import { ConfirmDialog } from '../common/ConfirmDialog';

export const TenantManagement = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [propertyUnits, setPropertyUnits] = useState<Unit[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', propertyId: '', unitId: '', rent: '',
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const unsub = subscribeTenants(setTenants);
    listProperties().then((p) => {
      setProperties(p);
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!form.propertyId) {
      setPropertyUnits([]);
      return;
    }
    const property = properties.find((p) => p.id === form.propertyId);
    if (!property) return;

    setLoadingUnits(true);
    listVacantUnitsByProperty(property.id, property.units)
      .then(setPropertyUnits)
      .catch(() => {
        setPropertyUnits([]);
        toast.error('Failed to load units');
      })
      .finally(() => setLoadingUnits(false));
  }, [form.propertyId, properties]);

  const filtered = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = validateFormFields({
      name: { value: form.name, label: 'Full name', required: true },
      email: { value: form.email, label: 'Email', required: true },
      rent: { value: form.rent, label: 'Monthly rent', required: true },
      propertyId: { value: form.propertyId, label: 'Property', required: true },
      unitId: { value: form.unitId, label: 'Unit', required: true },
    });
    if (!result.valid) {
      setFieldErrors(result.errors);
      focusFirstFieldError(result.errors);
      toast.error(result.message ?? 'Please fix the highlighted fields');
      return;
    }
    setFieldErrors({});
    const property = properties.find((p) => p.id === form.propertyId);
    const unit = propertyUnits.find((u) => u.id === form.unitId);
    if (!property || !unit) {
      toast.error('Select property and unit');
      return;
    }
    setSubmitting(true);
    try {
      await createTenant({
        name: form.name,
        email: form.email,
        phone: form.phone,
        propertyId: property.id,
        unitId: unit.id,
        propertyName: property.name,
        unitLabel: `${property.name} - Unit ${unit.unitNumber}`,
        rent: parseFloat(form.rent) || 0,
      });
      toast.success('Tenant created');
      setShowForm(false);
    } catch (err) {
      toast.error(getFirebaseErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case 'paid': return <Badge variant="success">Paid</Badge>;
      case 'pending': return <Badge variant="warning">Pending</Badge>;
      case 'overdue': return <Badge variant="danger">Overdue</Badge>;
      default: return <Badge variant="default">{status}</Badge>;
    }
  };

  const handleDeleteTenant = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteTenant(deleteId);
      toast.success('Tenant and related records deleted');
      setDeleteId(null);
    } catch (err) {
      toast.error(getFirebaseErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold text-foreground mb-1">Tenants</h1>
          <p className="text-sm lg:text-base text-muted-foreground">Manage tenant information and leases</p>
        </div>
        <Button variant="primary" className="flex items-center gap-2" onClick={() => setShowForm(true)}>
          <Plus className="w-5 h-5" /> Add Tenant
        </Button>
      </div>

      {showForm && (
        <Card>
          <form onSubmit={handleCreate} className="space-y-4 grid sm:grid-cols-2 gap-4">
            <Input label="Full Name" required fieldKey="name" error={fieldErrors.name} value={form.name} onChange={(e) => { setForm({ ...form, name: e.target.value }); setFieldErrors((p) => clearFieldError(p, 'name')); }} />
            <Input label="Email" type="email" required fieldKey="email" error={fieldErrors.email} value={form.email} onChange={(e) => { setForm({ ...form, email: e.target.value }); setFieldErrors((p) => clearFieldError(p, 'email')); }} />
            <Input label="Phone" fieldKey="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Input label="Monthly Rent" type="number" required fieldKey="rent" error={fieldErrors.rent} value={form.rent} onChange={(e) => { setForm({ ...form, rent: e.target.value }); setFieldErrors((p) => clearFieldError(p, 'rent')); }} />
            <FormSelect
              label="Property"
              required
              fieldKey="propertyId"
              error={fieldErrors.propertyId}
              value={form.propertyId}
              onChange={(e) => {
                setForm({ ...form, propertyId: e.target.value, unitId: '' });
                setFieldErrors((p) => clearFieldError(p, 'propertyId'));
              }}
            >
              <option value="">Select property</option>
              {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </FormSelect>
            <FormSelect
              label="Unit"
              required
              fieldKey="unitId"
              error={fieldErrors.unitId}
              value={form.unitId}
              onChange={(e) => {
                setForm({ ...form, unitId: e.target.value });
                setFieldErrors((p) => clearFieldError(p, 'unitId'));
              }}
              disabled={!form.propertyId || loadingUnits}
            >
              <option value="">{loadingUnits ? 'Loading units...' : 'Select unit'}</option>
              {propertyUnits.map((u) => <option key={u.id} value={u.id}>Unit {u.unitNumber}</option>)}
            </FormSelect>
            {form.propertyId && !loadingUnits && propertyUnits.length === 0 && (
              <p className="text-xs text-muted-foreground sm:col-span-2">
                No vacant units for this property. All units are occupied or none exist yet.
              </p>
            )}
            <div className="sm:col-span-2 flex gap-2">
              <Button type="submit" variant="primary" loading={submitting}>Save</Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input placeholder="Search tenants..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState title="No tenants" actionLabel="Add Tenant" onAction={() => setShowForm(true)} />
      ) : (
        <>
          <Card padding={false} className="hidden lg:block overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left px-6 py-4 text-sm text-muted-foreground">Tenant</th>
                  <th className="text-left px-6 py-4 text-sm text-muted-foreground">Contact</th>
                  <th className="text-left px-6 py-4 text-sm text-muted-foreground">Unit</th>
                  <th className="text-left px-6 py-4 text-sm text-muted-foreground">Rent</th>
                  <th className="text-left px-6 py-4 text-sm text-muted-foreground">Payment</th>
                  <th className="text-left px-6 py-4 text-sm text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-accent/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center"><User className="w-5 h-5 text-primary" /></div>
                        <div>
                          <p className="font-medium">{tenant.name}</p>
                          <Badge variant={tenant.status === 'active' ? 'success' : 'default'} className="mt-1">{tenant.status}</Badge>
                          {tenant.userId ? (
                            <Badge variant="success" className="mt-1 ml-1">Linked</Badge>
                          ) : (
                            <Badge variant="warning" className="mt-1 ml-1">Awaiting signup</Badge>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-1"><Mail className="w-4 h-4" />{tenant.email}</div>
                      <div className="flex items-center gap-1 mt-1"><Phone className="w-4 h-4" />{tenant.phone}</div>
                    </td>
                    <td className="px-6 py-4 text-sm"><Home className="w-4 h-4 inline mr-1" />{tenant.unitLabel}</td>
                    <td className="px-6 py-4 font-medium">{formatCurrency(tenant.rent)}</td>
                    <td className="px-6 py-4">{getPaymentBadge(tenant.paymentStatus)}</td>
                    <td className="px-6 py-4">
                      <Button variant="ghost" size="sm" onClick={() => setDeleteId(tenant.id)}>Delete</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <div className="lg:hidden space-y-4">
            {filtered.map((tenant) => (
              <Card key={tenant.id}>
                <p className="font-semibold">{tenant.name}</p>
                <p className="text-sm text-muted-foreground">{tenant.unitLabel}</p>
                <p className="font-medium mt-2">{formatCurrency(tenant.rent)}/mo</p>
                <div className="mt-2">{getPaymentBadge(tenant.paymentStatus)}</div>
              </Card>
            ))}
          </div>
        </>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && !deleting && setDeleteId(null)}
        title="Delete tenant?"
        description="This permanently deletes the tenant and all related leases, invoices, payments, and maintenance requests. This cannot be undone."
        destructive
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleDeleteTenant}
      />
    </div>
  );
};
