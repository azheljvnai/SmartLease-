import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Plus, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { PageLoader } from '../common/LoadingSpinner';
import {
  subscribeMaintenanceByTenant,
  createMaintenanceRequest,
  listMaintenanceUpdates,
  updateMaintenanceRequest,
} from '../../../services/maintenance.service';
import { fileToDataUrl } from '../../../lib/file-upload';
import type { MaintenancePriority, MaintenanceRequest, MaintenanceUpdate } from '../../../types';
import {
  maintenanceStatusLabel,
  maintenancePriorityLabel,
  maintenancePriorityVariant,
  maintenanceStatusVariant,
  normalizeMaintenanceStatus,
} from '../../../lib/maintenance-labels';
import {
  clearFieldError,
  focusFirstFieldError,
  validateFormFields,
} from '../../../lib/form-validation';
import { FormSelect } from '../ui/form-select';
import { Textarea } from '../ui/textarea';

export const TenantMaintenance = () => {
  const { tenant } = useAuth();
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [updatesMap, setUpdatesMap] = useState<Record<string, MaintenanceUpdate[]>>({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [newRequest, setNewRequest] = useState({
    issue: '',
    category: 'General',
    description: '',
    priority: 'medium' as MaintenancePriority,
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!tenant) {
      setLoading(false);
      return;
    }
    const unsub = subscribeMaintenanceByTenant(tenant.id, async (reqs) => {
      setRequests(reqs);
      const map: Record<string, MaintenanceUpdate[]> = {};
      await Promise.all(
        reqs.map(async (r) => {
          map[r.id] = await listMaintenanceUpdates(r.id);
        }),
      );
      setUpdatesMap(map);
      setLoading(false);
    });
    return unsub;
  }, [tenant]);

  const getStatusBadge = (status: string) => {
    const normalized = normalizeMaintenanceStatus(status as never);
    return (
      <Badge variant={maintenanceStatusVariant(normalized)}>
        {maintenanceStatusLabel(status as never)}
      </Badge>
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;
    const result = validateFormFields({
      issue: { value: newRequest.issue, label: 'Issue summary', required: true },
    });
    if (!result.valid) {
      setFieldErrors(result.errors);
      focusFirstFieldError(result.errors);
      toast.error(result.message ?? 'Please fix the highlighted fields');
      return;
    }
    setFieldErrors({});
    setSubmitting(true);
    try {
      const requestId = await createMaintenanceRequest({
        tenantId: tenant.id,
        tenantName: tenant.name,
        unitId: tenant.unitId,
        unitLabel: tenant.unitLabel,
        propertyId: tenant.propertyId,
        issue: newRequest.issue,
        description: newRequest.description,
        category: newRequest.category,
        priority: newRequest.priority,
        status: 'requested',
        submitted: new Date().toISOString().split('T')[0],
        assignedTo: null,
        propertyName: tenant.propertyName,
      });

      if (photoFile) {
        const dataUrl = await fileToDataUrl(photoFile);
        await updateMaintenanceRequest(requestId, { photoUrls: [dataUrl] });
      }

      toast.success('Request submitted');
      setShowModal(false);
      setNewRequest({ issue: '', category: 'General', description: '', priority: 'medium' });
      setPhotoFile(null);
    } catch {
      toast.error('Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PageLoader />;
  if (!tenant) return <Card><p>No tenant profile linked.</p></Card>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Maintenance</h1>
          <p className="text-sm text-muted-foreground">Submit and track service requests</p>
        </div>
        <Button variant="primary" onClick={() => setShowModal(true)}><Plus className="w-4 h-4 mr-2" />New Request</Button>
      </div>

      {requests.map((req) => (
        <Card key={req.id}>
          <div className="flex justify-between mb-2">
            <div>
              <h3 className="font-semibold">{req.issue}</h3>
              <div className="flex gap-2 mt-1">
                <Badge variant={maintenancePriorityVariant(req.priority)}>{maintenancePriorityLabel(req.priority)}</Badge>
              </div>
            </div>
            {getStatusBadge(req.status)}
          </div>
          <p className="text-sm text-muted-foreground">{req.category} · {req.submitted}</p>
          {req.assignedTo && (
            <p className="text-sm text-primary mt-1">Assigned to: {req.assignedTo}</p>
          )}
          {req.description && <p className="text-sm mt-2 text-muted-foreground">{req.description}</p>}
          {updatesMap[req.id]?.map((u) => (
            <div key={u.id} className="mt-3 pl-4 border-l-2 border-primary/30 text-sm">
              <p className="text-muted-foreground">{u.date}</p>
              <p>{u.message}</p>
            </div>
          ))}
        </Card>
      ))}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <div className="flex justify-between mb-4">
              <h3 className="font-semibold">New Maintenance Request</h3>
              <button type="button" onClick={() => setShowModal(false)}><X /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Issue Summary"
                required
                fieldKey="issue"
                error={fieldErrors.issue}
                value={newRequest.issue}
                onChange={(e) => {
                  setNewRequest({ ...newRequest, issue: e.target.value });
                  setFieldErrors((p) => clearFieldError(p, 'issue'));
                }}
              />
              <FormSelect
                label="Category"
                fieldKey="category"
                value={newRequest.category}
                onChange={(e) => setNewRequest({ ...newRequest, category: e.target.value })}
              >
                <option>Plumbing</option><option>HVAC</option><option>Electrical</option><option>General</option>
              </FormSelect>
              <FormSelect
                label="Priority"
                fieldKey="priority"
                value={newRequest.priority}
                onChange={(e) => setNewRequest({ ...newRequest, priority: e.target.value as MaintenancePriority })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="emergency">Emergency</option>
              </FormSelect>
              <Textarea
                label="Description"
                fieldKey="description"
                placeholder="Detailed description..."
                value={newRequest.description}
                onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
                rows={4}
              />
              <div>
                <label className="text-sm font-medium text-foreground">Photo <span className="text-muted-foreground font-normal">(optional)</span></label>
                <p className="text-xs text-muted-foreground mb-1">Spark plan: images stored in Firestore (max 500KB), not Firebase Storage.</p>
                <input
                  type="file"
                  accept="image/*"
                  className="w-full text-sm"
                  onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
                />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary" loading={submitting}>Submit</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
