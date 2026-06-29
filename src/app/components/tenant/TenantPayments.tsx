import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useSearchParams } from 'react-router';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Calendar,
  X,
  CreditCard,
  Smartphone,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Banknote,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { PageLoader } from '../common/LoadingSpinner';
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

  if (loading) return <PageLoader />;
  if (!tenant) {
    return (
      <Card>
        <p>No tenant profile linked. Register with the same email your property manager used.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold text-foreground">Payments</h1>
          <p className="text-sm text-muted-foreground">Pay rent securely via PayMongo</p>
        </div>
        {payableInvoices.length > 0 && (
          <Button variant="primary" onClick={() => openPayModal()}>
            <CreditCard className="w-4 h-4 mr-2" />
            Pay Now
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <Card className="p-3 sm:p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <AlertCircle className="w-4 h-4" />
            <span className="text-xs">Outstanding Balance</span>
          </div>
          <p className="text-lg sm:text-xl font-bold">{formatCurrency(summary.outstanding)}</p>
        </Card>
        <Card className="p-3 sm:p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Calendar className="w-4 h-4" />
            <span className="text-xs">This Month&apos;s Rent</span>
          </div>
          <p className="text-lg sm:text-xl font-bold">{formatCurrency(summary.currentMonthRent)}</p>
        </Card>
        <Card className="p-3 sm:p-4 col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-xs">Total Payments Made</span>
          </div>
          <p className="text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(summary.totalPaid)}
          </p>
        </Card>
      </div>

      {payableInvoices.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Banknote className="w-4 h-4" />
            Bills to Pay
          </h3>
          <div className="space-y-2">
            {payableInvoices.map((inv) => {
              const status = effectiveInvoiceStatus(inv);
              const isMaintenance = inv.invoiceType === 'maintenance';
              return (
                <div
                  key={inv.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border bg-card"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold">{inv.invoiceNumber}</p>
                      {isMaintenance && <Badge variant="info">Maintenance</Badge>}
                      <Badge variant={status === 'overdue' ? 'danger' : 'warning'}>
                        {status === 'overdue' ? 'Overdue' : 'Due'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {inv.notes ?? formatBillingPeriod(inv.billingPeriodStart, inv.billingPeriodEnd)}
                    </p>
                    <p className="text-xs text-muted-foreground">Due {formatDate(inv.dueDate)}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <p className="text-lg font-bold">{formatCurrency(getInvoiceTotalDue(inv))}</p>
                    <Button size="sm" variant="primary" onClick={() => openPayModal(inv)}>
                      Pay
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <Card className="p-4">
        <h3 className="font-semibold mb-3">Payment History</h3>
        {payments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No payments yet.</p>
        ) : (
          <div className="overflow-x-auto -mx-4 px-4">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-3 font-medium">Invoice</th>
                  <th className="pb-2 pr-3 font-medium">Period</th>
                  <th className="pb-2 pr-3 font-medium text-right">Amount</th>
                  <th className="pb-2 pr-3 font-medium">Method</th>
                  <th className="pb-2 pr-3 font-medium">Date</th>
                  <th className="pb-2 pr-3 font-medium">Reference</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b last:border-0">
                    <td className="py-2.5 pr-3 font-medium">{payment.invoiceNumber ?? '—'}</td>
                    <td className="py-2.5 pr-3 text-muted-foreground text-xs">
                      {formatBillingPeriod(payment.billingPeriodStart, payment.billingPeriodEnd)}
                    </td>
                    <td className="py-2.5 pr-3 text-right font-medium">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="py-2.5 pr-3">{formatManualPaymentMethod(payment.method)}</td>
                    <td className="py-2.5 pr-3">
                      {payment.paymentDate
                        ? formatDate(payment.paymentDate)
                        : formatDate(
                            payment.createdAt instanceof Date
                              ? payment.createdAt.toISOString().split('T')[0]
                              : String(payment.createdAt).split('T')[0],
                          )}
                    </td>
                    <td className="py-2.5 pr-3 font-mono text-xs">
                      {payment.referenceNumber ?? '—'}
                    </td>
                    <td className="py-2.5">
                      <Badge variant={payment.status === 'completed' ? 'success' : 'warning'}>
                        {payment.status === 'completed' ? 'Paid' : payment.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showPaymentModal && payInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-5">
            <div className="flex justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Pay Invoice</h3>
                <p className="text-sm text-muted-foreground">{payInvoice.invoiceNumber}</p>
              </div>
              <button type="button" onClick={() => setShowPaymentModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-2xl font-bold mb-4">{formatCurrency(getInvoiceTotalDue(payInvoice))}</p>

            <p className="text-sm text-muted-foreground mb-4">
              You will be redirected to PayMongo to complete payment securely.
            </p>

            <div className="flex flex-col gap-2 mb-4">
              <Button
                variant={paymentMethod === 'gcash' ? 'primary' : 'outline'}
                onClick={() => setPaymentMethod('gcash')}
                className="justify-start"
              >
                <Smartphone className="w-4 h-4 mr-2" /> GCash
              </Button>
              <Button
                variant={paymentMethod === 'paymaya' ? 'primary' : 'outline'}
                onClick={() => setPaymentMethod('paymaya')}
                className="justify-start"
              >
                <Wallet className="w-4 h-4 mr-2" /> Maya
              </Button>
              <Button
                variant={paymentMethod === 'card' ? 'primary' : 'outline'}
                onClick={() => setPaymentMethod('card')}
                className="justify-start"
              >
                <CreditCard className="w-4 h-4 mr-2" /> Credit / Debit Card
              </Button>
            </div>

            <div className="flex gap-2 mt-6">
              <Button variant="outline" className="flex-1" onClick={() => setShowPaymentModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" className="flex-1" loading={submitting} onClick={handlePay}>
                Continue to PayMongo
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
