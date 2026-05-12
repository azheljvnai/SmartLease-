import { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Search, Plus, AlertCircle, Clock, CheckCircle2, Wrench } from 'lucide-react';

const maintenanceRequests = [
  {
    id: 'MNT-001',
    tenant: 'Sarah Johnson',
    unit: 'Unit 205',
    issue: 'Leaking faucet in kitchen',
    priority: 'medium',
    status: 'in_progress',
    submitted: '2026-05-05',
    assignedTo: 'Mike Williams',
    category: 'Plumbing',
  },
  {
    id: 'MNT-002',
    tenant: 'John Smith',
    unit: 'Unit 101',
    issue: 'AC not cooling properly',
    priority: 'high',
    status: 'submitted',
    submitted: '2026-05-06',
    assignedTo: null,
    category: 'HVAC',
  },
  {
    id: 'MNT-003',
    tenant: 'Michael Brown',
    unit: 'Unit 312',
    issue: 'Light fixture replacement',
    priority: 'low',
    status: 'assigned',
    submitted: '2026-05-04',
    assignedTo: 'Tom Anderson',
    category: 'Electrical',
  },
  {
    id: 'MNT-004',
    tenant: 'Emily Davis',
    unit: 'Unit 108',
    issue: 'Broken window lock',
    priority: 'medium',
    status: 'completed',
    submitted: '2026-05-01',
    assignedTo: 'Steve Rogers',
    category: 'General',
  },
];

export const Maintenance = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredRequests = maintenanceRequests.filter(request => {
    const matchesSearch = request.tenant.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         request.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         request.issue.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return <Badge variant="info">Submitted</Badge>;
      case 'assigned':
        return <Badge variant="warning">Assigned</Badge>;
      case 'in_progress':
        return <Badge variant="warning">In Progress</Badge>;
      case 'completed':
        return <Badge variant="success">Completed</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="danger">High</Badge>;
      case 'medium':
        return <Badge variant="warning">Medium</Badge>;
      case 'low':
        return <Badge variant="default">Low</Badge>;
      default:
        return <Badge variant="default">{priority}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted':
        return <AlertCircle className="w-5 h-5 text-primary" />;
      case 'assigned':
        return <Clock className="w-5 h-5 text-warning" />;
      case 'in_progress':
        return <Wrench className="w-5 h-5 text-warning" />;
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-success" />;
      default:
        return <AlertCircle className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const statusCounts = {
    submitted: maintenanceRequests.filter(r => r.status === 'submitted').length,
    assigned: maintenanceRequests.filter(r => r.status === 'assigned').length,
    in_progress: maintenanceRequests.filter(r => r.status === 'in_progress').length,
    completed: maintenanceRequests.filter(r => r.status === 'completed').length,
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold text-foreground mb-1">Maintenance</h1>
          <p className="text-sm lg:text-base text-muted-foreground">Track and manage maintenance requests</p>
        </div>
        <Button variant="primary" className="flex items-center gap-2 w-full sm:w-auto">
          <Plus className="w-5 h-5" />
          New Request
        </Button>
      </div>

      {/* Status overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding={false} className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xl lg:text-2xl font-semibold text-foreground">{statusCounts.submitted}</p>
              <p className="text-sm text-muted-foreground">Submitted</p>
            </div>
          </div>
        </Card>

        <Card padding={false} className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-xl lg:text-2xl font-semibold text-foreground">{statusCounts.assigned}</p>
              <p className="text-sm text-muted-foreground">Assigned</p>
            </div>
          </div>
        </Card>

        <Card padding={false} className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
              <Wrench className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-xl lg:text-2xl font-semibold text-foreground">{statusCounts.in_progress}</p>
              <p className="text-sm text-muted-foreground">In Progress</p>
            </div>
          </div>
        </Card>

        <Card padding={false} className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-xl lg:text-2xl font-semibold text-foreground">{statusCounts.completed}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search and filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search requests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-input-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Status</option>
            <option value="submitted">Submitted</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </Card>

      {/* Requests list - Card view for all devices */}
      <div className="space-y-3 lg:space-y-4">
        {filteredRequests.map((request) => (
          <Card key={request.id} hover>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                {getStatusIcon(request.status)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">{request.id}</h3>
                      {getPriorityBadge(request.priority)}
                    </div>
                    <p className="text-foreground mb-1">{request.issue}</p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span>{request.tenant}</span>
                      <span>•</span>
                      <span>{request.unit}</span>
                      <span>•</span>
                      <span>{request.category}</span>
                    </div>
                  </div>
                  {getStatusBadge(request.status)}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>Submitted: {request.submitted}</span>
                  </div>
                  {request.assignedTo && (
                    <div className="flex items-center gap-2">
                      <Wrench className="w-4 h-4" />
                      <span>Assigned to: {request.assignedTo}</span>
                    </div>
                  )}
                </div>

                {/* Progress timeline */}
                <div className="flex items-center gap-2 mb-4">
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full ${
                    ['submitted', 'assigned', 'in_progress', 'completed'].includes(request.status)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className={`h-0.5 flex-1 ${
                    ['assigned', 'in_progress', 'completed'].includes(request.status)
                      ? 'bg-primary'
                      : 'bg-muted'
                  }`} />
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full ${
                    ['assigned', 'in_progress', 'completed'].includes(request.status)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className={`h-0.5 flex-1 ${
                    ['in_progress', 'completed'].includes(request.status)
                      ? 'bg-primary'
                      : 'bg-muted'
                  }`} />
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full ${
                    ['in_progress', 'completed'].includes(request.status)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className={`h-0.5 flex-1 ${
                    request.status === 'completed'
                      ? 'bg-primary'
                      : 'bg-muted'
                  }`} />
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full ${
                    request.status === 'completed'
                      ? 'bg-success text-success-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                    View Details
                  </Button>
                  {request.status !== 'completed' && (
                    <>
                      {!request.assignedTo && (
                        <Button variant="primary" size="sm" className="flex-1 sm:flex-none">
                          Assign Technician
                        </Button>
                      )}
                      {request.status === 'in_progress' && (
                        <Button variant="primary" size="sm" className="flex-1 sm:flex-none">
                          Mark Complete
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
