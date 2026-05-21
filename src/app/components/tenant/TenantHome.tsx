import { useEffect, useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Link, useNavigate } from 'react-router';
import { DollarSign, FileText, Wrench, Calendar, Home, CreditCard, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { PageLoader } from '../common/LoadingSpinner';
import { getActiveLeaseByTenant } from '../../../services/leases.service';
import { listInvoicesByTenant } from '../../../services/invoices.service';
import { subscribeMaintenanceByTenant } from '../../../services/maintenance.service';
import { listNoticesForProperty } from '../../../services/notices.service';
import type { Invoice, Lease, MaintenanceRequest, Notice } from '../../../types';
import { formatCurrency, formatDate } from '../../../lib/format';

export const TenantHome = () => {
  const navigate = useNavigate();
  const { profile, tenant } = useAuth();
  const [lease, setLease] = useState<Lease | null>(null);
  const [nextInvoice, setNextInvoice] = useState<Invoice | null>(null);
  const [maintenance, setMaintenance] = useState<MaintenanceRequest[]>([]);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenant) {
      setLoading(false);
      return;
    }
    Promise.all([
      getActiveLeaseByTenant(tenant.id),
      listInvoicesByTenant(tenant.id),
      listNoticesForProperty(tenant.propertyId),
    ]).then(([l, invoices, notices]) => {
      setLease(l);
      const pending = invoices.find((i) => i.status === 'pending' || i.status === 'overdue');
      setNextInvoice(pending ?? invoices[0] ?? null);
      setNotice(notices[0] ?? null);
      setLoading(false);
    });

    const unsub = subscribeMaintenanceByTenant(tenant.id, (reqs) => {
      setMaintenance(reqs.filter((r) => r.status !== 'completed').slice(0, 2));
    });
    return unsub;
  }, [tenant]);

  if (loading) return <PageLoader />;
  if (!tenant) {
    return (
      <Card>
        <p className="text-muted-foreground">No tenant profile linked to your account. Contact your property manager.</p>
      </Card>
    );
  }

  const firstName = profile?.firstName ?? tenant.name.split(' ')[0];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl lg:text-3xl font-semibold text-foreground mb-1">Welcome back, {firstName}!</h1>
        <p className="text-sm text-muted-foreground">Here&apos;s your rental overview</p>
      </div>

      <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0 relative overflow-hidden">
        <div className="relative">
          <p className="text-primary-foreground/80 text-sm mb-1">Current Rent Due</p>
          <h2 className="text-4xl lg:text-5xl font-bold mb-2">
            {nextInvoice ? formatCurrency(nextInvoice.amount) : formatCurrency(tenant.rent)}
          </h2>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4" />
            <span>Due: {nextInvoice ? formatDate(nextInvoice.dueDate) : '—'}</span>
          </div>
          <Button
            variant="secondary"
            size="lg"
            className="w-full mt-4 bg-white text-primary hover:bg-white/90"
            onClick={() => navigate('/tenant/payments')}
          >
            <CreditCard className="w-5 h-5 mr-2" />
            Pay Now
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Link to="/tenant/payments">
          <Card padding={false} className="p-4 hover:shadow-lg transition-all cursor-pointer">
            <FileText className="w-6 h-6 text-primary mb-2" />
            <p className="font-semibold text-sm">View Lease</p>
          </Card>
        </Link>
        <Link to="/tenant/maintenance">
          <Card padding={false} className="p-4 hover:shadow-lg transition-all cursor-pointer">
            <Wrench className="w-6 h-6 text-primary mb-2" />
            <p className="font-semibold text-sm">Request Service</p>
          </Card>
        </Link>
      </div>

      <Card>
        <div className="flex items-start gap-3 mb-4">
          <Home className="w-6 h-6 text-primary" />
          <div>
            <h3 className="font-semibold">Your Unit</h3>
            <p className="text-sm text-muted-foreground">{tenant.unitLabel}</p>
          </div>
        </div>
        {lease && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><p className="text-muted-foreground">Lease Period</p><p>{formatDate(lease.startDate)} – {formatDate(lease.endDate)}</p></div>
            <div><p className="text-muted-foreground">Monthly Rent</p><p className="font-semibold">{formatCurrency(lease.rent)}</p></div>
            <div><Badge variant="success">Active</Badge></div>
          </div>
        )}
      </Card>

      {notice && (
        <Card className="border-primary/30 bg-primary/5">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-primary flex-shrink-0" />
            <div>
              <h3 className="font-semibold">{notice.title}</h3>
              <p className="text-sm text-muted-foreground">{notice.body}</p>
            </div>
          </div>
        </Card>
      )}

      {maintenance.length > 0 && (
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Maintenance Updates</h3>
            <Link to="/tenant/maintenance" className="text-sm text-primary flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {maintenance.map((req) => (
            <div key={req.id} className="p-3 bg-muted/50 rounded-lg mb-2">
              <p className="font-medium">{req.issue}</p>
              <Badge variant="warning" className="mt-1">{req.status}</Badge>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
};
