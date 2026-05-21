import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Building2, Plus, Search, MapPin, ChevronRight } from 'lucide-react';
import { PageLoader } from '../common/LoadingSpinner';
import { EmptyState } from '../common/EmptyState';
import { ConfirmDialog } from '../common/ConfirmDialog';
import {
  subscribeProperties,
  createProperty,
  deleteProperty,
} from '../../../services/properties.service';
import type { Property } from '../../../types';
import { getFirebaseErrorMessage } from '../../../lib/firebase-errors';
import { formatCurrency, formatCurrencyCompact } from '../../../lib/format';

export const PropertyManagement = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', address: '', units: '24' });

  useEffect(() => {
    const unsub = subscribeProperties((data) => {
      setProperties(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  const filteredProperties = properties.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.address.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const slug = form.name.toLowerCase().replace(/\s+/g, '-').slice(0, 30);
      await createProperty({
        name: form.name,
        address: form.address,
        slug,
        units: parseInt(form.units, 10) || 1,
      });
      toast.success('Property created');
      setShowForm(false);
      setForm({ name: '', address: '', units: '24' });
    } catch (err) {
      toast.error(getFirebaseErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteProperty(deleteId);
      toast.success('Property deleted');
    } catch (err) {
      toast.error(getFirebaseErrorMessage(err));
    } finally {
      setDeleteId(null);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold text-foreground mb-1">Properties</h1>
          <p className="text-sm lg:text-base text-muted-foreground">Manage all your properties and units</p>
        </div>
        <Button variant="primary" className="flex items-center gap-2 w-full sm:w-auto" onClick={() => setShowForm(true)}>
          <Plus className="w-5 h-5" />
          Add Property
        </Button>
      </div>

      {showForm && (
        <Card>
          <form onSubmit={handleCreate} className="space-y-4">
            <h3 className="font-semibold text-foreground">New Property</h3>
            <Input label="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input label="Address" required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            <Input label="Units" type="number" required value={form.units} onChange={(e) => setForm({ ...form, units: e.target.value })} />
            <div className="flex gap-2">
              <Button type="submit" variant="primary" loading={submitting}>Save</Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search properties..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {filteredProperties.length === 0 ? (
        <EmptyState title="No properties found" description="Add your first property to get started." actionLabel="Add Property" onAction={() => setShowForm(true)} />
      ) : (
        <>
          <Card padding={false} className="hidden lg:block overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Property</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Location</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Units</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Occupancy</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Revenue/mo</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredProperties.map((property) => {
                    const occupancyRate = property.units > 0 ? Math.round((property.occupied / property.units) * 100) : 0;
                    return (
                      <tr key={property.id} className="hover:bg-accent/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                              <Building2 className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{property.name}</p>
                              <p className="text-sm text-muted-foreground">ID: {property.id.slice(0, 8)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-foreground">{property.address}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">{property.units} units</td>
                        <td className="px-6 py-4">
                          <p className="text-sm mb-1">{property.occupied}/{property.units}</p>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div className="bg-primary h-2 rounded-full" style={{ width: `${occupancyRate}%` }} />
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium">{formatCurrency(property.revenue)}</td>
                        <td className="px-6 py-4">
                          <Badge variant={property.status === 'active' ? 'success' : 'warning'}>{property.status}</Badge>
                        </td>
                        <td className="px-6 py-4">
                          <Button variant="ghost" size="sm" onClick={() => setDeleteId(property.id)}>Delete</Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="lg:hidden space-y-4">
            {filteredProperties.map((property) => {
              const occupancyRate = property.units > 0 ? Math.round((property.occupied / property.units) * 100) : 0;
              return (
                <Card key={property.id} hover className="cursor-pointer">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{property.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span className="truncate">{property.address}</span>
                      </div>
                    </div>
                    <Badge variant={property.status === 'active' ? 'success' : 'warning'}>{property.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">Occupancy: {occupancyRate}% · {formatCurrencyCompact(property.revenue)}/mo</p>
                  <Button variant="outline" size="sm" className="w-full justify-between" onClick={() => setDeleteId(property.id)}>
                    Delete <ChevronRight className="w-4 h-4" />
                  </Button>
                </Card>
              );
            })}
          </div>
        </>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete property?"
        description="This will permanently remove the property. Units and tenants must be unlinked first."
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
};
