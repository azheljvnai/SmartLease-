import { useState } from 'react';
import { toast } from 'sonner';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Badge } from '../../ui/badge';
import { UserPlus, Phone, Mail, Wrench, X } from 'lucide-react';
import type { Property, Technician } from '../../../../types';
import { createTechnician, updateTechnician } from '../../../../services/maintenance.service';
import { countOpenByTechnician } from '../../../../lib/maintenance-utils';
import type { MaintenanceRequest } from '../../../../types';
import { getFirebaseErrorMessage } from '../../../../lib/firebase-errors';

interface Props {
  technicians: Technician[];
  properties: Property[];
  requests: MaintenanceRequest[];
  onRefresh: () => void;
}

const AVAILABILITY_LABELS = {
  available: { label: 'Available', variant: 'success' as const },
  busy: { label: 'Busy', variant: 'warning' as const },
  off_duty: { label: 'Off Duty', variant: 'default' as const },
};

export function TechnicianManagement({ technicians, properties, requests, onRefresh }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    specialties: '',
    availability: 'available' as Technician['availability'],
    propertyIds: [] as string[],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createTechnician({
        name: form.name,
        email: form.email || undefined,
        phone: form.phone || undefined,
        specialties: form.specialties.split(',').map((s) => s.trim()).filter(Boolean),
        availability: form.availability,
        assignedPropertyIds: form.propertyIds,
      });
      toast.success('Technician added');
      setShowForm(false);
      setForm({ name: '', email: '', phone: '', specialties: '', availability: 'available', propertyIds: [] });
      onRefresh();
    } catch (err) {
      toast.error(getFirebaseErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const toggleProperty = (id: string) => {
    setForm((f) => ({
      ...f,
      propertyIds: f.propertyIds.includes(id)
        ? f.propertyIds.filter((p) => p !== id)
        : [...f.propertyIds, id],
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Technicians</h2>
          <p className="text-sm text-muted-foreground">Manage staff, workload, and availability</p>
        </div>
        <Button variant="outline" onClick={() => setShowForm(true)}>
          <UserPlus className="w-4 h-4 mr-2" />Add Technician
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {technicians.length === 0 && (
          <Card className="p-8 text-center text-muted-foreground col-span-full">
            No technicians yet. Add your first technician to start assigning work orders.
          </Card>
        )}
        {technicians.map((tech) => {
          const open = countOpenByTechnician(requests, tech.id);
          const completed = requests.filter(
            (r) =>
              r.technicianId === tech.id &&
              (['completed', 'closed'].includes(r.status) || Boolean(r.completedDate)),
          ).length;
          const avail = AVAILABILITY_LABELS[tech.availability ?? 'available'];
          const assignedProps = (tech.assignedPropertyIds ?? [])
            .map((id) => properties.find((p) => p.id === id)?.name)
            .filter(Boolean);

          return (
            <Card key={tech.id} className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{tech.name}</h3>
                  <Badge variant={avail.variant}>{avail.label}</Badge>
                </div>
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Wrench className="w-5 h-5 text-primary" />
                </div>
              </div>

              <div className="text-sm space-y-1 text-muted-foreground">
                {tech.phone && (
                  <p className="flex items-center gap-1"><Phone className="w-3 h-3" />{tech.phone}</p>
                )}
                {tech.email && (
                  <p className="flex items-center gap-1"><Mail className="w-3 h-3" />{tech.email}</p>
                )}
                <p>Specialties: {tech.specialties.join(', ') || 'General'}</p>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <div className="rounded-md bg-muted/50 p-2">
                  <p className="font-semibold text-foreground">{open}</p>
                  <p className="text-xs text-muted-foreground">Open</p>
                </div>
                <div className="rounded-md bg-muted/50 p-2">
                  <p className="font-semibold text-foreground">{completed}</p>
                  <p className="text-xs text-muted-foreground">Done</p>
                </div>
                <div className="rounded-md bg-muted/50 p-2">
                  <p className="font-semibold text-foreground">{tech.completedJobs ?? completed}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>

              {assignedProps.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Properties: {assignedProps.join(', ')}
                </p>
              )}

              <select
                className="w-full h-8 border rounded-md px-2 text-sm bg-background"
                value={tech.availability ?? 'available'}
                onChange={async (e) => {
                  try {
                    await updateTechnician(tech.id, {
                      availability: e.target.value as Technician['availability'],
                    });
                    onRefresh();
                    toast.success('Availability updated');
                  } catch (err) {
                    toast.error(getFirebaseErrorMessage(err));
                  }
                }}
              >
                <option value="available">Available</option>
                <option value="busy">Busy</option>
                <option value="off_duty">Off Duty</option>
              </select>
            </Card>
          );
        })}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between mb-4">
              <h3 className="font-semibold">Add Technician</h3>
              <button type="button" onClick={() => setShowForm(false)}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <Input label="Specialties (comma-separated)" value={form.specialties} onChange={(e) => setForm({ ...form, specialties: e.target.value })} placeholder="Plumbing, HVAC" />
              <div>
                <label className="text-sm font-medium">Assigned Properties</label>
                <div className="mt-2 space-y-1 max-h-32 overflow-y-auto border rounded-md p-2">
                  {properties.map((p) => (
                    <label key={p.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={form.propertyIds.includes(p.id)}
                        onChange={() => toggleProperty(p.id)}
                      />
                      {p.name}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" variant="primary" loading={submitting}>Add</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
