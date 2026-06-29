import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  Home,
  Megaphone,
  Plus,
  TrendingUp,
  User,
  Wrench,
} from 'lucide-react';
import { Bar, BarChart, XAxis, YAxis } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart';
import { TenantPageHeader } from './shared/TenantPageHeader';
import { TenantStatCard } from './shared/TenantStatCard';
import { TenantSection } from './shared/TenantSection';
import { TenantPageSkeleton } from './shared/TenantPageSkeleton';
import {
  getLeaseDisplayStatus,
  LEASE_DISPLAY_STATUS_LABELS,
  leaseDisplayStatusVariant,
} from '../../../lib/lease-documents';
import { getActiveLeaseByTenant } from '../../../services/leases.service';
import { listInvoicesByTenant, isInvoicePayable } from '../../../services/invoices.service';
import { listPaymentsByTenant } from '../../../services/payments.service';
import { subscribeMaintenanceByTenant } from '../../../services/maintenance.service';
import { listNoticesForProperty } from '../../../services/notices.service';
import type { Invoice, Lease, MaintenanceRequest, Notice, PaymentRecord } from '../../../types';
import { formatCurrency, formatDate, formatRelativeTime } from '../../../lib/format';
import { getInvoiceTotalDue } from '../../../lib/payment-utils';
import { maintenanceStatusLabel, maintenanceStatusVariant } from '../../../lib/maintenance-labels';
import { differenceInDays, parseISO } from 'date-fns';

const paymentChartConfig = {
  amount: { label: 'Paid', color: 'var(--color-primary)' },
};

function daysUntilDue(dueDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return differenceInDays(parseISO(dueDate), today);
}

export const TenantHome = () => {
  const navigate = useNavigate();
  const { profile, tenant } = useAuth();
  const [lease, setLease] = useState<Lease | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRequest[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenant) {
      setLoading(false);
      return;
    }
    Promise.all([
      getActiveLeaseByTenant(tenant.id),
      listInvoicesByTenant(tenant.id),
      listPaymentsByTenant(tenant.id),
      listNoticesForProperty(tenant.propertyId),
    ])
      .then(([l, inv, pay, noticeList]) => {
        setLease(l);
        setInvoices(inv);
        setPayments(pay);
        setNotices(noticeList.slice(0, 3));
      })
      .catch((err) => console.error('Failed to load tenant home:', err))
      .finally(() => setLoading(false));

    const unsub = subscribeMaintenanceByTenant(tenant.id, (reqs) => {
      setMaintenance(reqs.filter((r) => r.status !== 'completed').slice(0, 3));
    });
    return unsub;
  }, [tenant]);

  const payableInvoices = useMemo(
    () => invoices.filter((i) => isInvoicePayable(i)),
    [invoices],
  );

  const nextInvoice = payableInvoices[0] ?? null;

  const outstanding = useMemo(
    () => payableInvoices.reduce((s, i) => s + getInvoiceTotalDue(i), 0),
    [payableInvoices],
  );

  const totalPaid = useMemo(
    () => payments.filter((p) => p.status === 'completed').reduce((s, p) => s + p.amount, 0),
    [payments],
  );

  const paymentChartData = useMemo(() => {
    const byMonth = new Map<string, number>();
    for (const p of payments.filter((p) => p.status === 'completed')) {
      const date = p.paymentDate ?? (p.createdAt instanceof Date ? p.createdAt.toISOString() : String(p.createdAt));
      const key = date.slice(0, 7);
      byMonth.set(key, (byMonth.get(key) ?? 0) + p.amount);
    }
    return Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, amount]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short' }),
        amount,
      }));
  }, [payments]);

  const recentPayments = useMemo(
    () =>
      payments
        .filter((p) => p.status === 'completed')
        .slice(0, 3),
    [payments],
  );

  if (loading) return <TenantPageSkeleton />;
  if (!tenant) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground">
          No tenant profile linked to your account. Contact your property manager.
        </p>
      </Card>
    );
  }

  const firstName = profile?.firstName ?? tenant.name.split(' ')[0];
  const allPaid = outstanding === 0;
  const daysLeft = nextInvoice ? daysUntilDue(nextInvoice.dueDate) : null;

  return (
    <div className="space-y-5">
      <TenantPageHeader
        title={`Welcome back, ${firstName}`}
        description={`${tenant.propertyName} · ${tenant.unitLabel}`}
        actions={
          <Button variant="outline" size="sm" onClick={() => navigate('/tenant/maintenance')}>
            <Plus className="mr-1.5 h-4 w-4" />
            New Request
          </Button>
        }
      />

      {/* Rent hero card */}
      <Card
        padding={false}
        className={
          allPaid
            ? 'overflow-hidden border-emerald-200 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white'
            : 'overflow-hidden border-0 bg-gradient-to-br from-primary via-primary to-primary/85 text-primary-foreground shadow-md'
        }
      >
        <div className="relative p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {allPaid ? (
                <>
                  <div className="mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="text-sm font-medium text-white/90">All caught up</span>
                  </div>
                  <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                    {formatCurrency(0)}
                  </h2>
                  <p className="mt-1 text-sm text-white/80">No outstanding balance</p>
                </>
              ) : (
                <>
                  <p className="mb-1 text-sm text-primary-foreground/80">Outstanding Balance</p>
                  <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                    {formatCurrency(outstanding)}
                  </h2>
                  {nextInvoice && (
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-primary-foreground/90">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" />
                        Due {formatDate(nextInvoice.dueDate)}
                      </span>
                      {daysLeft !== null && (
                        <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-medium">
                          <Clock className="h-3.5 w-3.5" />
                          {daysLeft < 0
                            ? `${Math.abs(daysLeft)} days overdue`
                            : daysLeft === 0
                              ? 'Due today'
                              : `${daysLeft} days left`}
                        </span>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
            {!allPaid && (
              <Button
                size="lg"
                className="w-full bg-white text-primary shadow-sm hover:bg-white/90 sm:w-auto"
                onClick={() => navigate('/tenant/payments')}
              >
                <CreditCard className="mr-2 h-5 w-5" />
                Pay Now
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <TenantStatCard
          label="Monthly Rent"
          value={formatCurrency(lease?.rent ?? tenant.rent)}
          icon={Home}
          variant="primary"
        />
        <TenantStatCard
          label="Outstanding"
          value={formatCurrency(outstanding)}
          icon={AlertCircle}
          variant={outstanding > 0 ? 'warning' : 'success'}
        />
        <TenantStatCard
          label="Total Paid"
          value={formatCurrency(totalPaid)}
          icon={TrendingUp}
          variant="success"
        />
        <TenantStatCard
          label="Open Requests"
          value={String(maintenance.length)}
          icon={Wrench}
          variant={maintenance.length > 0 ? 'warning' : 'default'}
          trend={maintenance.length > 0 ? 'Needs attention' : 'All clear'}
        />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'View Lease', icon: FileText, href: '/tenant/lease' },
          { label: 'Pay Rent', icon: CreditCard, href: '/tenant/payments' },
          { label: 'Maintenance', icon: Wrench, href: '/tenant/maintenance' },
          { label: 'Profile', icon: User, href: '/tenant/profile' },
        ].map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.label} to={action.href}>
              <Card
                padding={false}
                hover
                className="flex flex-col items-center gap-2 p-4 text-center transition-all"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <span className="text-xs font-medium sm:text-sm">{action.label}</span>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Lease summary */}
        <TenantSection
          title="Lease Summary"
          description="Your current rental agreement"
          action={{ label: 'View details', href: '/tenant/lease' }}
        >
          {lease ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{lease.propertyName}</p>
                  <p className="text-sm text-muted-foreground">{lease.unitLabel}</p>
                </div>
                <Badge variant={leaseDisplayStatusVariant(getLeaseDisplayStatus(lease))}>
                  {LEASE_DISPLAY_STATUS_LABELS[getLeaseDisplayStatus(lease)]}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Lease Period</p>
                  <p className="mt-0.5 font-medium">
                    {formatDate(lease.startDate)} – {formatDate(lease.endDate)}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Security Deposit</p>
                  <p className="mt-0.5 font-medium">{formatCurrency(lease.deposit)}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No active lease on file.</p>
          )}
        </TenantSection>

        {/* Payment chart or recent */}
        <TenantSection
          title="Payment History"
          description="Recent payment activity"
          action={{ label: 'View all', href: '/tenant/payments' }}
        >
          {paymentChartData.length > 0 ? (
            <ChartContainer config={paymentChartConfig} className="h-[180px] w-full">
              <BarChart data={paymentChartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="amount" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          ) : recentPayments.length > 0 ? (
            <div className="space-y-2">
              {recentPayments.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2.5 text-sm"
                >
                  <div>
                    <p className="font-medium">{p.invoiceNumber ?? 'Payment'}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.paymentDate ? formatDate(p.paymentDate) : '—'}
                    </p>
                  </div>
                  <p className="font-semibold text-emerald-600">{formatCurrency(p.amount)}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-sm text-muted-foreground">
              <CreditCard className="mx-auto mb-2 h-8 w-8 opacity-40" />
              No payment history yet
            </div>
          )}
        </TenantSection>
      </div>

      {/* Announcements */}
      {notices.length > 0 && (
        <TenantSection title="Announcements" description="Updates from your property manager">
          <div className="space-y-3">
            {notices.map((notice) => (
              <div
                key={notice.id}
                className="flex gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3"
              >
                <Megaphone className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="font-medium">{notice.title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">{notice.body}</p>
                </div>
              </div>
            ))}
          </div>
        </TenantSection>
      )}

      {/* Maintenance updates */}
      {maintenance.length > 0 && (
        <TenantSection
          title="Active Maintenance"
          description="Open service requests"
          action={{ label: 'View all', href: '/tenant/maintenance' }}
        >
          <div className="space-y-2">
            {maintenance.map((req) => (
              <button
                key={req.id}
                type="button"
                onClick={() => navigate('/tenant/maintenance')}
                className="flex w-full items-center justify-between rounded-lg bg-muted/40 p-3 text-left transition-colors hover:bg-muted/60"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-sm">{req.issue}</p>
                  <p className="text-xs text-muted-foreground">
                    Updated {formatRelativeTime(req.updatedAt ?? req.submitted)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant={maintenanceStatusVariant(req.status)}>
                    {maintenanceStatusLabel(req.status)}
                  </Badge>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </button>
            ))}
          </div>
        </TenantSection>
      )}
    </div>
  );
};
