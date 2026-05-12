import { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import {
  Plus,
  Wrench,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Camera
} from 'lucide-react';

const maintenanceRequests = [
  {
    id: 'MNT-001',
    issue: 'AC not cooling properly',
    category: 'HVAC',
    status: 'in_progress',
    priority: 'high',
    submitted: '2026-05-04',
    assignedTo: 'Mike Williams',
    updates: [
      { date: '2026-05-04', message: 'Request submitted', status: 'submitted' },
      { date: '2026-05-05', message: 'Technician assigned', status: 'assigned' },
      { date: '2026-05-06', message: 'Technician en route', status: 'in_progress' },
    ],
  },
  {
    id: 'MNT-002',
    issue: 'Leaking faucet in bathroom',
    category: 'Plumbing',
    status: 'completed',
    priority: 'medium',
    submitted: '2026-04-28',
    assignedTo: 'Tom Anderson',
    updates: [
      { date: '2026-04-28', message: 'Request submitted', status: 'submitted' },
      { date: '2026-04-29', message: 'Technician assigned', status: 'assigned' },
      { date: '2026-04-30', message: 'Work completed', status: 'completed' },
    ],
  },
];

export const TenantMaintenance = () => {
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [newRequest, setNewRequest] = useState({
    issue: '',
    category: 'General',
    description: '',
    priority: 'medium',
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted':
        return <AlertCircle className="w-4 h-4 text-primary" />;
      case 'assigned':
        return <Clock className="w-4 h-4 text-warning" />;
      case 'in_progress':
        return <Wrench className="w-4 h-4 text-warning" />;
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-success" />;
      default:
        return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold text-foreground mb-1">Maintenance</h1>
          <p className="text-sm lg:text-base text-muted-foreground">Track your service requests</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          className="flex items-center gap-2"
          onClick={() => setShowNewRequestModal(true)}
        >
          <Plus className="w-4 h-4" />
          New
        </Button>
      </div>

      {/* Active requests */}
      <div className="space-y-3 lg:space-y-4">
        {maintenanceRequests.map((request) => (
          <Card key={request.id} hover className="hover:shadow-lg transition-all">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Wrench className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-semibold text-foreground">{request.issue}</h3>
                  {getStatusBadge(request.status)}
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {request.category} • {request.id}
                </p>
                {request.assignedTo && (
                  <p className="text-sm text-muted-foreground">
                    Assigned to: {request.assignedTo}
                  </p>
                )}
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-3 mb-4">
              {request.updates.map((update, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      index === request.updates.length - 1
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {getStatusIcon(update.status)}
                    </div>
                    {index < request.updates.length - 1 && (
                      <div className="w-0.5 h-8 bg-border mt-1" />
                    )}
                  </div>
                  <div className="flex-1 pt-0.5">
                    <p className="text-sm font-medium text-foreground">{update.message}</p>
                    <p className="text-xs text-muted-foreground">{update.date}</p>
                  </div>
                </div>
              ))}
            </div>

            {request.status === 'completed' && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => alert('Rate service functionality')}
              >
                Rate Service
              </Button>
            )}
          </Card>
        ))}
      </div>

      {/* New Request Modal */}
      {showNewRequestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-foreground">New Request</h3>
              <button
                onClick={() => setShowNewRequestModal(false)}
                className="p-2 hover:bg-accent rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <Input
                label="Issue Summary"
                type="text"
                placeholder="Brief description of the issue"
                value={newRequest.issue}
                onChange={(e) => setNewRequest({ ...newRequest, issue: e.target.value })}
              />

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Category</label>
                <select
                  value={newRequest.category}
                  onChange={(e) => setNewRequest({ ...newRequest, category: e.target.value })}
                  className="w-full px-4 py-2.5 bg-input-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="Plumbing">Plumbing</option>
                  <option value="Electrical">Electrical</option>
                  <option value="HVAC">HVAC</option>
                  <option value="Appliances">Appliances</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Priority</label>
                <select
                  value={newRequest.priority}
                  onChange={(e) => setNewRequest({ ...newRequest, priority: e.target.value })}
                  className="w-full px-4 py-2.5 bg-input-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Description</label>
                <textarea
                  value={newRequest.description}
                  onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
                  placeholder="Provide detailed information about the issue..."
                  rows={4}
                  className="w-full px-4 py-2.5 bg-input-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Photos (Optional)</label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                  <Camera className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">Add photos of the issue</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => alert('Photo upload functionality')}
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Choose Photos
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                size="lg"
                className="flex-1"
                onClick={() => setShowNewRequestModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="lg"
                className="flex-1"
                onClick={() => {
                  setShowNewRequestModal(false);
                  setNewRequest({ issue: '', category: 'General', description: '', priority: 'medium' });
                }}
              >
                Submit Request
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
