import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Search, AlertCircle, Clock, CheckCircle2, Wrench } from 'lucide-react';
import { PageLoader } from '../common/LoadingSpinner';
import {
  subscribeMaintenanceRequests,
  updateMaintenanceRequest,
  listTechnicians,
} from '../../../services/maintenance.service';
import type { MaintenanceRequest, MaintenanceStatus } from '../../../types';

export const Maintenance = () => {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [technicians, setTechnicians] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const unsub = subscribeMaintenanceRequests(setRequests);
    listTechnicians().then(setTechnicians).finally(() => setLoading(false));
    return unsub;
  }, []);

  const filtered = requests.filter((r) => {
    const matchSearch =
      r.tenantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.issue.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted': return <Badge variant="info">Submitted</Badge>;
      case 'assigned': return <Badge variant="warning">Assigned</Badge>;
      case 'in_progress': return <Badge variant="warning">In Progress</Badge>;
      case 'completed': return <Badge variant="success">Completed</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const handleAssign = async (id: string, name: string) => {
    await updateMaintenanceRequest(id, { status: 'assigned', assignedTo: name });
    toast.success('Technician assigned');
  };

  const handleStatus = async (id: string, status: MaintenanceStatus) => {
    await updateMaintenanceRequest(id, { status });
    toast.success('Status updated');
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-4 lg:space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-semibold text-foreground mb-1">Maintenance</h1>
        <p className="text-sm text-muted-foreground">Manage maintenance requests</p>
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input placeholder="Search requests..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
          </div>
          <select className="h-9 rounded-md border px-3" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="submitted">Submitted</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </Card>

      <div className="space-y-4">
        {filtered.map((request) => (
          <Card key={request.id}>
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Wrench className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="flex flex-wrap gap-2 mb-1">
                    {getStatusBadge(request.status)}
                    <Badge variant={request.priority === 'high' ? 'danger' : 'warning'}>{request.priority}</Badge>
                  </div>
                  <h3 className="font-semibold">{request.issue}</h3>
                  <p className="text-sm text-muted-foreground">{request.tenantName} · {request.unitLabel} · {request.category}</p>
                  <p className="text-xs text-muted-foreground mt-1">Submitted {request.submitted}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {technicians.map((t) => (
                  <Button key={t.id} variant="outline" size="sm" onClick={() => handleAssign(request.id, t.name)}>{t.name}</Button>
                ))}
                {request.status !== 'in_progress' && request.status !== 'completed' && (
                  <Button variant="primary" size="sm" onClick={() => handleStatus(request.id, 'in_progress')}>Start</Button>
                )}
                {request.status !== 'completed' && (
                  <Button variant="primary" size="sm" onClick={() => handleStatus(request.id, 'completed')}>Complete</Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
