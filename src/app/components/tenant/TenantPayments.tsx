import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { FormSelect } from '../ui/form-select';
import {
  Calendar,
  X,
  Wallet,
  QrCode,
  Clock,
  CheckCircle2,
  AlertCircle,
  Receipt,
  Eye,
  Banknote,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { PageLoader } from '../common/LoadingSpinner';
import { FileDropzone } from '../common/FileDropzone';
import {
  listInvoicesByTenant,
  isInvoicePayable,
  effectiveInvoiceStatus,
} from '../../../services/invoices.service';
import { listPaymentsByTenant, submitManualPayment } from '../../../services/payments.service';
import {
  getPaymentInstructions,
  getDefaultPaymentInstructions,
  resolveQrImageUrl,
} from '../../../services/payment-settings.service';
import type {
  Invoice,
  ManualPaymentMethod,
  PaymentInstructionEntry,
  PaymentInstructionsSettings,
  PaymentRecord,
} from '../../../types';
import { formatCurrency, formatDate } from '../../../lib/format';
import {
  formatBillingPeriod,
  formatManualPaymentMethod,
  getInvoiceTotalDue,
  getPaymentVerificationStatus,
  verificationStatusLabel,
} from '../../../lib/payment-utils';
import { getFirebaseErrorMessage } from '../../../lib/firebase-errors';
import { resolveDocumentUrl } from '../../../services/storage.service';

const METHOD_OPTIONS: { value: ManualPaymentMethod; label: string }[] = [
  { value: 'qrph', label: 'QR Ph' },
  { value: 'gcash', label: 'GCash' },
  { value: 'maya', label: 'Maya' },
];

function VerificationBadge({ payment }: { payment: PaymentRecord }) {
  const status = getPaymentVerificationStatus(payment);
  const variant =
    status === 'approved' ? 'success' : status === 'rejected' ? 'danger' : 'warning';
  return <Badge variant={variant}>{verificationStatusLabel(status)}</Badge>;
}

function QrCard({
  title,
  entry,
  icon: Icon,
}: {
  title: string;
  entry: PaymentInstructionEntry;
  icon: typeof QrCode;
}) {
  const qrUrl = resolveQrImageUrl(entry);
  return (
    <Card className="p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-primary shrink-0" />
        <h4 className="font-semibold text-sm">{title}</h4>
      </div>
      {qrUrl ? (
        <div className="flex justify-center bg-white rounded-lg p-2 border">
          <img src={qrUrl} alt={`${title} QR code`} className="max-h-36 w-auto object-contain" />
        </div>
      ) : (
        <div className="flex items-center justify-center h-28 rounded-lg bg-muted/50 border border-dashed">
          <p className="text-xs text-muted-foreground text-center px-2">QR code not configured yet</p>
        </div>
      )}
      <div className="space-y-1 text-sm">
        {entry.accountName && (
          <p>
            <span className="text-muted-foreground">Account name: </span>
            <span className="font-medium">{entry.accountName}</span>
          </p>
        )}
        {entry.accountNumber && (
          <p>
            <span className="text-muted-foreground">Account no.: </span>
            <span className="font-medium font-mono">{entry.accountNumber}</span>
          </p>
        )}
        {entry.instructions && (
          <p className="text-xs text-muted-foreground leading-relaxed">{entry.instructions}</p>
        )}
      </div>
    </Card>
  );
}

export const TenantPayments = () => {
  const { tenant } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [instructions, setInstructions] = useState<PaymentInstructionsSettings>(
    getDefaultPaymentInstructions,
  );
  const [loading, setLoading] = useState(true);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [previewReceipt, setPreviewReceipt] = useState<string | null>(null);

  const [form, setForm] = useState({
    invoiceId: '',
    method: 'gcash' as ManualPaymentMethod,
    amount: '',
    referenceNumber: '',
    paymentDate: new Date().toISOString().split('T')[0],
    receipt: null as File | null,
  });

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
    const instr = await getPaymentInstructions();
    setInstructions(instr);
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
    const pendingVerification = payments
      .filter((p) => getPaymentVerificationStatus(p) === 'pending_verification')
      .reduce((s, p) => s + p.amount, 0);
    const totalPaid = payments
      .filter((p) => getPaymentVerificationStatus(p) === 'approved')
      .reduce((s, p) => s + p.amount, 0);
    return { outstanding, currentMonthRent, pendingVerification, totalPaid };
  }, [invoices, payableInvoices, payments]);

  const selectedInvoice = invoices.find((i) => i.id === form.invoiceId);

  const openSubmitModal = (invoiceId?: string) => {
    const inv = invoiceId
      ? invoices.find((i) => i.id === invoiceId)
      : payableInvoices[0];
    if (!inv) {
      toast.error('No payable invoice found.');
      return;
    }
    setForm({
      invoiceId: inv.id,
      method: 'gcash',
      amount: String(getInvoiceTotalDue(inv)),
      referenceNumber: '',
      paymentDate: new Date().toISOString().split('T')[0],
      receipt: null,
    });
    setShowSubmitModal(true);
  };

  const handleSubmit = async () => {
    if (!tenant || !selectedInvoice) return;
    if (!form.referenceNumber.trim()) {
      toast.error('Enter the reference or transaction number.');
      return;
    }
    if (!form.receipt) {
      toast.error('Upload your payment receipt.');
      return;
    }
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) {
      toast.error('Enter a valid amount.');
      return;
    }

    setSubmitting(true);
    try {
      await submitManualPayment({
        tenantId: tenant.id,
        tenantName: tenant.name,
        invoice: selectedInvoice,
        amount,
        method: form.method,
        referenceNumber: form.referenceNumber,
        paymentDate: form.paymentDate,
        receiptFile: form.receipt,
      });
      toast.success('Payment submitted for verification.');
      setShowSubmitModal(false);
      await refreshData();
    } catch (err) {
      toast.error(getFirebaseErrorMessage(err));
    } finally {
      setSubmitting(false);
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
          <p className="text-sm text-muted-foreground">Pay via QR and submit your receipt for verification</p>
        </div>
        {payableInvoices.length > 0 && (
          <Button variant="primary" onClick={() => openSubmitModal()}>
            <Receipt className="w-4 h-4 mr-2" />
            Submit Payment
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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
        <Card className="p-3 sm:p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-xs">Pending Verification</span>
          </div>
          <p className="text-lg sm:text-xl font-bold text-amber-600 dark:text-amber-400">
            {formatCurrency(summary.pendingVerification)}
          </p>
        </Card>
        <Card className="p-3 sm:p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-xs">Total Payments Made</span>
          </div>
          <p className="text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(summary.totalPaid)}
          </p>
        </Card>
      </div>

      <div>
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <QrCode className="w-4 h-4" />
          Payment Instructions
        </h3>
        <p className="text-sm text-muted-foreground mb-3">
          Scan a QR code or send payment to the account below, then submit your receipt for verification.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <QrCard title="QR Ph" entry={instructions.qrph} icon={QrCode} />
          <QrCard title="GCash" entry={instructions.gcash} icon={Wallet} />
          <QrCard title="Maya" entry={instructions.maya} icon={Wallet} />
        </div>
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
                    <Button size="sm" variant="primary" onClick={() => openSubmitModal(inv.id)}>
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
          <p className="text-sm text-muted-foreground">No payment submissions yet.</p>
        ) : (
          <div className="overflow-x-auto -mx-4 px-4">
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-3 font-medium">Invoice</th>
                  <th className="pb-2 pr-3 font-medium">Period</th>
                  <th className="pb-2 pr-3 font-medium text-right">Due</th>
                  <th className="pb-2 pr-3 font-medium text-right">Paid</th>
                  <th className="pb-2 pr-3 font-medium">Method</th>
                  <th className="pb-2 pr-3 font-medium">Date</th>
                  <th className="pb-2 pr-3 font-medium">Reference</th>
                  <th className="pb-2 pr-3 font-medium">Receipt</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => {
                  const receiptUrl = payment.receiptFile
                    ? resolveDocumentUrl(payment.receiptFile)
                    : null;
                  return (
                    <tr key={payment.id} className="border-b last:border-0">
                      <td className="py-2.5 pr-3 font-medium">{payment.invoiceNumber ?? '—'}</td>
                      <td className="py-2.5 pr-3 text-muted-foreground text-xs">
                        {formatBillingPeriod(payment.billingPeriodStart, payment.billingPeriodEnd)}
                      </td>
                      <td className="py-2.5 pr-3 text-right">
                        {payment.amountDue != null ? formatCurrency(payment.amountDue) : '—'}
                      </td>
                      <td className="py-2.5 pr-3 text-right font-medium">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="py-2.5 pr-3">{formatManualPaymentMethod(payment.method)}</td>
                      <td className="py-2.5 pr-3">
                        {payment.paymentDate ? formatDate(payment.paymentDate) : '—'}
                      </td>
                      <td className="py-2.5 pr-3 font-mono text-xs">
                        {payment.referenceNumber ?? '—'}
                      </td>
                      <td className="py-2.5 pr-3">
                        {receiptUrl ? (
                          <button
                            type="button"
                            onClick={() => setPreviewReceipt(receiptUrl)}
                            className="inline-flex items-center gap-1 text-primary hover:underline text-xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View
                          </button>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-2.5">
                        <div className="space-y-1">
                          <VerificationBadge payment={payment} />
                          {payment.remarks && (
                            <p className="text-xs text-muted-foreground max-w-[140px] truncate" title={payment.remarks}>
                              {payment.remarks}
                            </p>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showSubmitModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-5">
            <div className="flex justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Submit Payment</h3>
                <p className="text-sm text-muted-foreground">{selectedInvoice.invoiceNumber}</p>
              </div>
              <button type="button" onClick={() => setShowSubmitModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <FormSelect
                label="Bill / Invoice"
                value={form.invoiceId}
                onChange={(e) => {
                  const inv = invoices.find((i) => i.id === e.target.value);
                  setForm((f) => ({
                    ...f,
                    invoiceId: e.target.value,
                    amount: inv ? String(getInvoiceTotalDue(inv)) : f.amount,
                  }));
                }}
              >
                {payableInvoices.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.invoiceNumber} — {formatCurrency(getInvoiceTotalDue(inv))}
                    {inv.invoiceType === 'maintenance' ? ' (Maintenance)' : ''}
                  </option>
                ))}
              </FormSelect>

              <div className="grid grid-cols-3 gap-2">
                {METHOD_OPTIONS.map((m) => (
                  <Button
                    key={m.value}
                    type="button"
                    size="sm"
                    variant={form.method === m.value ? 'primary' : 'outline'}
                    onClick={() => setForm((f) => ({ ...f, method: m.value }))}
                  >
                    {m.label}
                  </Button>
                ))}
              </div>

              <Input
                label="Amount Paid"
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              />

              <Input
                label="Reference / Transaction No."
                value={form.referenceNumber}
                onChange={(e) => setForm((f) => ({ ...f, referenceNumber: e.target.value }))}
                placeholder="e.g. GCash ref. number"
              />

              <Input
                label="Payment Date"
                type="date"
                value={form.paymentDate}
                onChange={(e) => setForm((f) => ({ ...f, paymentDate: e.target.value }))}
              />

              <FileDropzone
                value={form.receipt}
                onChange={(file) => setForm((f) => ({ ...f, receipt: file }))}
                label="Payment Receipt"
              />
            </div>

            <div className="flex gap-2 mt-5">
              <Button variant="outline" className="flex-1" onClick={() => setShowSubmitModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" className="flex-1" loading={submitting} onClick={handleSubmit}>
                Submit for Verification
              </Button>
            </div>
          </Card>
        </div>
      )}

      {previewReceipt && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewReceipt(null)}
        >
          <Card className="max-w-2xl max-h-[90vh] overflow-auto p-2" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-2 border-b mb-2">
              <span className="font-medium text-sm">Receipt Preview</span>
              <button type="button" onClick={() => setPreviewReceipt(null)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            {previewReceipt.includes('application/pdf') || previewReceipt.endsWith('.pdf') ? (
              <iframe src={previewReceipt} title="Receipt" className="w-full h-[70vh] rounded" />
            ) : (
              <img src={previewReceipt} alt="Payment receipt" className="max-w-full h-auto mx-auto rounded" />
            )}
          </Card>
        </div>
      )}
    </div>
  );
};
