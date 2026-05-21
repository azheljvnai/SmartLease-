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
import type { MaintenanceRequest, MaintenanceUpdate } from '../../../types';

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
    priority: 'medium' as const,
  });

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
    switch (status) {
      case 'submitted': return <Badge variant="info">Submitted</Badge>;
      case 'assigned': return <Badge variant="warning">Assigned</Badge>;
      case 'in_progress': return <Badge variant="warning">In Progress</Badge>;
      case 'completed': return <Badge variant="success">Completed</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;
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
        status: 'submitted',
        submitted: new Date().toISOString().split('T')[0],
        assignedTo: null,
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
            <h3 className="font-semibold">{req.issue}</h3>
            {getStatusBadge(req.status)}
          </div>
          <p className="text-sm text-muted-foreground">{req.category} · {req.submitted}</p>
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
              <Input label="Issue Summary" required value={newRequest.issue} onChange={(e) => setNewRequest({ ...newRequest, issue: e.target.value })} />
              <div>
                <label className="text-sm font-medium">Category</label>
                <select className="w-full mt-1 h-9 border rounded-md px-3" value={newRequest.category} onChange={(e) => setNewRequest({ ...newRequest, category: e.target.value })}>
                  <option>Plumbing</option><option>HVAC</option><option>Electrical</option><option>General</option>
                </select>
              </div>
              <textarea
                className="w-full min-h-24 border rounded-md p-3 text-sm"
                placeholder="Detailed description..."
                value={newRequest.description}
                onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
              />
              <div>
                <label className="text-sm font-medium text-foreground">Photo (optional)</label>
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
