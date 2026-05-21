import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Calendar, CheckCircle2, X, CreditCard, Smartphone } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { PageLoader } from '../common/LoadingSpinner';
import { listInvoicesByTenant } from '../../../services/invoices.service';
import { listPaymentsByTenant } from '../../../services/payments.service';
import { listPaymentMethods } from '../../../services/payment-methods.service';
import { getPaymentGateway } from '../../../payments';
import type { Invoice, PaymentMethod, PaymentRecord } from '../../../types';
import { formatCurrency, formatDate, toMonthLabel } from '../../../lib/format';

export const TenantPayments = () => {
  const { tenant } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'gcash'>('card');
  const [submitting, setSubmitting] = useState(false);

  const dueInvoice = invoices.find((i) => i.status === 'pending' || i.status === 'overdue');

  useEffect(() => {
    if (!tenant) {
      setLoading(false);
      return;
    }
    Promise.all([
      listInvoicesByTenant(tenant.id),
      listPaymentsByTenant(tenant.id),
      listPaymentMethods(tenant.id),
    ]).then(([inv, pay, meth]) => {
      setInvoices(inv);
      setPayments(pay);
      setMethods(meth);
      setLoading(false);
    });
  }, [tenant]);

  const handlePay = async () => {
    if (!tenant || !dueInvoice) return;
    setSubmitting(true);
    const gateway = getPaymentGateway();
    const result = await gateway.processPayment({
      tenantId: tenant.id,
      invoiceId: dueInvoice.id,
      amount: dueInvoice.amount + (dueInvoice.lateFee ?? 0),
      method: paymentMethod === 'card' ? 'Credit Card' : 'GCash',
      tenantName: tenant.name,
      monthLabel: toMonthLabel(dueInvoice.dueDate),
    });
    setSubmitting(false);
    if (result.success) {
      toast.success('Payment processed successfully!');
      setShowPaymentModal(false);
      const [inv, pay] = await Promise.all([
        listInvoicesByTenant(tenant.id),
        listPaymentsByTenant(tenant.id),
      ]);
      setInvoices(inv);
      setPayments(pay);
    } else {
      toast.error(result.error ?? 'Payment failed');
    }
  };

  if (loading) return <PageLoader />;
  if (!tenant) return <Card><p>No tenant profile linked.</p></Card>;

  return (
    <div className="space-y-4 lg:space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-semibold text-foreground mb-1">Payments</h1>
        <p className="text-sm text-muted-foreground">Manage your rent payments</p>
      </div>

      {dueInvoice && (
        <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0">
          <div className="text-center mb-4">
            <p className="text-primary-foreground/80 text-sm mb-2">{dueInvoice.invoiceNumber}</p>
            <h2 className="text-5xl font-bold mb-3">
              {formatCurrency(dueInvoice.amount + (dueInvoice.lateFee ?? 0))}
            </h2>
            <div className="flex items-center justify-center gap-2 text-sm">
              <Calendar className="w-4 h-4" />
              <span>Due: {formatDate(dueInvoice.dueDate)}</span>
            </div>
          </div>
          <Button
            variant="secondary"
            size="lg"
            className="w-full bg-white text-primary"
            onClick={() => setShowPaymentModal(true)}
          >
            <CreditCard className="w-5 h-5 mr-2" />
            Pay Now
          </Button>
        </Card>
      )}

      <div className="lg:grid lg:grid-cols-5 lg:gap-6 space-y-4">
        <Card className="lg:col-span-2">
          <h3 className="font-semibold mb-4">Payment Methods</h3>
          {methods.length === 0 ? (
            <p className="text-sm text-muted-foreground">No saved payment methods</p>
          ) : (
            methods.map((m) => (
              <div key={m.id} className="flex justify-between p-4 border rounded-xl mb-2">
                <span>{m.label}</span>
                {m.isDefault && <Badge variant="success">Default</Badge>}
              </div>
            ))
          )}
        </Card>

        <Card className="lg:col-span-3">
          <h3 className="font-semibold mb-4">Payment History</h3>
          <div className="space-y-2">
            {payments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No payments yet</p>
            ) : (
              payments.map((payment) => (
                <div key={payment.id} className="flex justify-between p-4 border rounded-xl">
                  <div>
                    <p className="font-semibold">{payment.monthLabel ?? 'Payment'}</p>
                    <p className="text-xs text-muted-foreground">{payment.method}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(payment.amount)}</p>
                    <Badge variant="success">Paid</Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {showPaymentModal && dueInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between mb-4">
              <h3 className="text-lg font-semibold">Pay Rent</h3>
              <button type="button" onClick={() => setShowPaymentModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <p className="text-2xl font-bold mb-4">{formatCurrency(dueInvoice.amount)}</p>
            <div className="flex gap-2 mb-4">
              <Button variant={paymentMethod === 'card' ? 'primary' : 'outline'} onClick={() => setPaymentMethod('card')} className="flex-1">
                <CreditCard className="w-4 h-4 mr-2" /> Card
              </Button>
              <Button variant={paymentMethod === 'gcash' ? 'primary' : 'outline'} onClick={() => setPaymentMethod('gcash')} className="flex-1">
                <Smartphone className="w-4 h-4 mr-2" /> GCash
              </Button>
            </div>
            {paymentMethod === 'card' ? (
              <div className="space-y-3">
                <Input label="Card Number" placeholder="1234 5678 9012 3456" />
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Expiry" placeholder="MM/YY" />
                  <Input label="CVV" placeholder="123" />
                </div>
              </div>
            ) : (
              <Input label="GCash Number" placeholder="09XX XXX XXXX" />
            )}
            <div className="flex gap-2 mt-6">
              <Button variant="outline" className="flex-1" onClick={() => setShowPaymentModal(false)}>Cancel</Button>
              <Button variant="primary" className="flex-1" loading={submitting} onClick={handlePay}>Confirm Payment</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
