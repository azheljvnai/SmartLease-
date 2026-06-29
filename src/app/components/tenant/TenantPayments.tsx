import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useSearchParams } from 'react-router';
import {
  Calendar,
  CreditCard,
  Smartphone,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Banknote,
  Receipt,
  Clock,
} from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { EmptyState } from '../common/EmptyState';
import { TenantPageHeader } from './shared/TenantPageHeader';
import { TenantStatCard } from './shared/TenantStatCard';
import { TenantSection } from './shared/TenantSection';
import { TenantPageSkeleton } from './shared/TenantPageSkeleton';
import {
  listInvoicesByTenant,
  isInvoicePayable,
  effectiveInvoiceStatus,
} from '../../../services/invoices.service';
import { listPaymentsByTenant } from '../../../services/payments.service';
import { getPaymentGateway } from '../../../payments';
import type { Invoice, PaymentRecord } from '../../../types';
import { formatCurrency, formatDate, toMonthLabel } from '../../../lib/format';
import {
  formatBillingPeriod,
  formatManualPaymentMethod,
  getInvoiceTotalDue,
} from '../../../lib/payment-utils';

type PayMethod = 'gcash' | 'paymaya' | 'card';

export const TenantPayments = () => {
  const { tenant } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PayMethod>('gcash');
  const [submitting, setSubmitting] = useState(false);
  const [payInvoice, setPayInvoice] = useState<Invoice | null>(null);

  const payableInvoices = useMemo(
    () => invoices.filter((i) => isInvoicePayable(i)),
    [invoices],
  );

  const refreshData = async () => {
    if (!tenant) return;
    const [inv, pay] = await Promise.all([
      listInvoicesByTenant(tenant.id),
      listPaymentsByTenant(tenant.id),
    ]);
    setInvoices(inv);
    setPayments(pay);
  };

  useEffect(() => {
    if (!tenant) {
      setLoading(false);
      return;
    }
    refreshData()
      .catch((err) => console.error('Failed to load payments:', err))
      .finally(() => setLoading(false));
  }, [tenant]);

  useEffect(() => {
    if (searchParams.get('status') === 'success') {
      toast.success('Payment completed successfully!');
      setSearchParams({});
      refreshData();
    }
  }, [searchParams, setSearchParams]);

  const summary = useMemo(() => {
    const outstanding = payableInvoices.reduce((s, i) => s + getInvoiceTotalDue(i), 0);
    const now = new Date();
    const currentMonthRent = invoices
      .filter((i) => {
        if (!i.billingPeriodStart) return false;
        const d = new Date(i.billingPeriodStart);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((s, i) => s + (isInvoicePayable(i) ? getInvoiceTotalDue(i) : 0), 0);
    const totalPaid = payments
      .filter((p) => p.status === 'completed')
      .reduce((s, p) => s + p.amount, 0);
    return { outstanding, currentMonthRent, totalPaid };
  }, [invoices, payableInvoices, payments]);

  const nextDue = payableInvoices[0];
  const daysLeft = nextDue
    ? differenceInDays(parseISO(nextDue.dueDate), new Date())
    : null;

  const openPayModal = (invoice?: Invoice) => {
    const inv = invoice ?? payableInvoices[0];
    if (!inv) {
      toast.error('No payable invoice found.');
      return;
    }
    setPayInvoice(inv);
    setPaymentMethod('gcash');
    setShowPaymentModal(true);
  };

  const handlePay = async () => {
    if (!tenant || !payInvoice) return;
    setSubmitting(true);
    const gateway = getPaymentGateway();
    const methodLabels = { gcash: 'GCash', paymaya: 'Maya', card: 'Credit Card' };
    const amount = getInvoiceTotalDue(payInvoice);
    const result = await gateway.processPayment({
      tenantId: tenant.id,
      invoiceId: payInvoice.id,
      invoiceNumber: payInvoice.invoiceNumber,
      amount,
      method: methodLabels[paymentMethod],
      tenantName: tenant.name,
      monthLabel: toMonthLabel(payInvoice.dueDate),
      paymentMethodType: paymentMethod,
    });
    setSubmitting(false);

    if (result.redirectUrl) {
      window.location.href = result.redirectUrl;
      return;
    }

    if (result.success) {
      toast.success('Payment processed successfully!');
      setShowPaymentModal(false);
      await refreshData();
    } else {
      toast.error(result.error ?? 'Payment failed');
    }
  };

  if (loading) return <TenantPageSkeleton />;
  if (!tenant) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground">
          No tenant profile linked. Register with the same email your property manager used.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <TenantPageHeader
        title="Payments"
        description="View bills, pay rent, and track payment history"
        actions={
          payableInvoices.length > 0 ? (
            <Button variant="primary" onClick={() => openPayModal()}>
              <CreditCard className="mr-2 h-4 w-4" />
              Pay Now
            </Button>
          ) : undefined
        }
      />

      {/* Outstanding hero */}
      <Card
        padding={false}
        className={
          summary.outstanding === 0
            ? 'overflow-hidden border-emerald-200 bg-gradient-to-r from-emerald-50 to-emerald-100/50'
            : 'overflow-hidden border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50'
        }
      >
        <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                summary.outstanding === 0 ? 'bg-emerald-500/15' : 'bg-amber-500/15'
              }`}
            >
              {summary.outstanding === 0 ? (
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              ) : (
                <AlertCircle className="h-6 w-6 text-amber-600" />
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Outstanding Balance</p>
              <p className="text-2xl font-bold tracking-tight sm:text-3xl">
                {formatCurrency(summary.outstanding)}
              </p>
              {nextDue && summary.outstanding > 0 && daysLeft !== null && (
                <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {daysLeft < 0
                    ? `${Math.abs(daysLeft)} days overdue`
                    : daysLeft === 0
                      ? 'Due today'
                      : `Due in ${daysLeft} days`}
                  {' · '}
                  {formatDate(nextDue.dueDate)}
                </p>
              )}
              {summary.outstanding === 0 && (
                <p className="mt-0.5 text-sm text-emerald-700">All bills are paid. You&apos;re all set!</p>
              )}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <TenantStatCard
          label="Outstanding"
          value={formatCurrency(summary.outstanding)}
          icon={AlertCircle}
          variant={summary.outstanding > 0 ? 'warning' : 'success'}
        />
        <TenantStatCard
          label="This Month"
          value={formatCurrency(summary.currentMonthRent)}
          icon={Calendar}
          variant="primary"
        />
        <TenantStatCard
          label="Total Paid"
          value={formatCurrency(summary.totalPaid)}
          icon={CheckCircle2}
          variant="success"
          className="col-span-2 lg:col-span-1"
        />
      </div>

      {payableInvoices.length > 0 ? (
        <TenantSection title="Bills to Pay" description="Outstanding invoices requiring payment">
          <div className="space-y-2">
            {payableInvoices.map((inv) => {
              const status = effectiveInvoiceStatus(inv);
              const isMaintenance = inv.invoiceType === 'maintenance';
              return (
                <div
                  key={inv.id}
                  className="flex flex-col gap-3 rounded-xl border bg-card p-4 transition-shadow hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{inv.invoiceNumber}</p>
                      {isMaintenance && <Badge variant="info">Maintenance</Badge>}
                      <Badge variant={status === 'overdue' ? 'danger' : 'warning'}>
                        {status === 'overdue' ? 'Overdue' : 'Due'}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground truncate">
                      {inv.notes ?? formatBillingPeriod(inv.billingPeriodStart, inv.billingPeriodEnd)}
                    </p>
                    <p className="text-xs text-muted-foreground">Due {formatDate(inv.dueDate)}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <p className="text-xl font-bold">{formatCurrency(getInvoiceTotalDue(inv))}</p>
                    <Button size="sm" variant="primary" onClick={() => openPayModal(inv)}>
                      Pay
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </TenantSection>
      ) : (
        <Card className="p-0 overflow-hidden">
          <EmptyState
            icon={Banknote}
            title="No bills due"
            description="You have no outstanding invoices. Your account is up to date."
          />
        </Card>
      )}

      <TenantSection title="Payment History" description="All completed and pending payments">
        {payments.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No payments yet"
            description="Your payment history will appear here once you make your first payment."
            actionLabel={payableInvoices.length > 0 ? 'Pay Now' : undefined}
            onAction={payableInvoices.length > 0 ? () => openPayModal() : undefined}
          />
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead className="hidden sm:table-cell">Period</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="hidden md:table-cell">Method</TableHead>
                  <TableHead className="hidden lg:table-cell">Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">{payment.invoiceNumber ?? '—'}</TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground text-xs">
                      {formatBillingPeriod(payment.billingPeriodStart, payment.billingPeriodEnd)}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(payment.amount)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {formatManualPaymentMethod(payment.method)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">
                      {payment.paymentDate
                        ? formatDate(payment.paymentDate)
                        : formatDate(
                            payment.createdAt instanceof Date
                              ? payment.createdAt.toISOString().split('T')[0]
                              : String(payment.createdAt).split('T')[0],
                          )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={payment.status === 'completed' ? 'success' : 'warning'}>
                        {payment.status === 'completed' ? 'Paid' : payment.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </TenantSection>

      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pay Invoice</DialogTitle>
            <DialogDescription>{payInvoice?.invoiceNumber}</DialogDescription>
          </DialogHeader>

          {payInvoice && (
            <>
              <p className="text-3xl font-bold tracking-tight">
                {formatCurrency(getInvoiceTotalDue(payInvoice))}
              </p>
              <p className="text-sm text-muted-foreground">
                You will be redirected to PayMongo to complete payment securely via GCash, Maya, or
                card.
              </p>

              <div className="flex flex-col gap-2">
                {(
                  [
                    { id: 'gcash' as const, label: 'GCash', icon: Smartphone },
                    { id: 'paymaya' as const, label: 'Maya', icon: Wallet },
                    { id: 'card' as const, label: 'Credit / Debit Card', icon: CreditCard },
                  ] as const
                ).map(({ id, label, icon: Icon }) => (
                  <Button
                    key={id}
                    variant={paymentMethod === id ? 'primary' : 'outline'}
                    onClick={() => setPaymentMethod(id)}
                    className="justify-start"
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {label}
                  </Button>
                ))}
              </div>
            </>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowPaymentModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" loading={submitting} onClick={handlePay}>
              Continue to PayMongo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
