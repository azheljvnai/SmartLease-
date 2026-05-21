import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { User, Plus, Search, Mail, Phone, Home } from 'lucide-react';
import { PageLoader } from '../common/LoadingSpinner';
import { EmptyState } from '../common/EmptyState';
import { subscribeTenants, createTenant, deleteTenant } from '../../../services/tenants.service';
import { listProperties } from '../../../services/properties.service';
import { listAllUnits } from '../../../services/units.service';
import type { Property, Tenant, Unit } from '../../../types';
import { getFirebaseErrorMessage } from '../../../lib/firebase-errors';
import { formatCurrency } from '../../../lib/format';
import { ConfirmDialog } from '../common/ConfirmDialog';

export const TenantManagement = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', propertyId: '', unitId: '', rent: '',
  });

  useEffect(() => {
    const unsub = subscribeTenants(setTenants);
    Promise.all([listProperties(), listAllUnits()]).then(([p, u]) => {
      setProperties(p);
      setUnits(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  const filtered = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const propertyUnits = units.filter((u) => u.propertyId === form.propertyId);

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case 'paid': return <Badge variant="success">Paid</Badge>;
      case 'pending': return <Badge variant="warning">Pending</Badge>;
      case 'overdue': return <Badge variant="danger">Overdue</Badge>;
      default: return <Badge variant="default">{status}</Badge>;
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const property = properties.find((p) => p.id === form.propertyId);
    const unit = units.find((u) => u.id === form.unitId);
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
            <Input label="Full Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input label="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Input label="Monthly Rent" type="number" required value={form.rent} onChange={(e) => setForm({ ...form, rent: e.target.value })} />
            <div>
              <label className="text-sm font-medium">Property</label>
              <select className="w-full mt-1 h-9 rounded-md border px-3" value={form.propertyId} onChange={(e) => setForm({ ...form, propertyId: e.target.value, unitId: '' })} required>
                <option value="">Select property</option>
                {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Unit</label>
              <select className="w-full mt-1 h-9 rounded-md border px-3" value={form.unitId} onChange={(e) => setForm({ ...form, unitId: e.target.value })} required>
                <option value="">Select unit</option>
                {propertyUnits.map((u) => <option key={u.id} value={u.id}>Unit {u.unitNumber}</option>)}
              </select>
            </div>
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

      <ConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} title="Delete tenant?" description="This cannot be undone." destructive confirmLabel="Delete" onConfirm={async () => { if (deleteId) { await deleteTenant(deleteId); toast.success('Deleted'); setDeleteId(null); } }} />
    </div>
  );
};
