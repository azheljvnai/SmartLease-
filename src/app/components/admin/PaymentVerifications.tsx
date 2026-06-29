import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { CheckCircle2, XCircle, Eye, X } from 'lucide-react';
import {
  listPendingVerifications,
  approvePayment,
  rejectPayment,
} from '../../../services/payments.service';
import type { PaymentRecord } from '../../../types';
import { formatCurrency, formatDate } from '../../../lib/format';
import { formatBillingPeriod, formatManualPaymentMethod } from '../../../lib/payment-utils';
import { getFirebaseErrorMessage } from '../../../lib/firebase-errors';
import { resolveDocumentUrl } from '../../../services/storage.service';
import { useAuth } from '../../contexts/AuthContext';

export function PaymentVerifications() {
  const { profile } = useAuth();
  const [pending, setPending] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [remarks, setRemarks] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const load = async () => {
    const data = await listPendingVerifications();
    setPending(data);
  };

  useEffect(() => {
    load()
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleApprove = async (payment: PaymentRecord) => {
    setActionId(payment.id);
    try {
      const name = profile ? `${profile.firstName} ${profile.lastName}`.trim() : 'Admin';
      await approvePayment(payment.id, name);
      toast.success('Payment approved.');
      await load();
    } catch (err) {
      toast.error(getFirebaseErrorMessage(err));
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectId) return;
    setActionId(rejectId);
    try {
      const name = profile ? `${profile.firstName} ${profile.lastName}`.trim() : 'Admin';
      await rejectPayment(rejectId, name, remarks);
      toast.success('Payment rejected.');
      setRejectId(null);
      setRemarks('');
      await load();
    } catch (err) {
      toast.error(getFirebaseErrorMessage(err));
    } finally {
      setActionId(null);
    }
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading verifications...</p>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Pending Payment Verifications</h2>
        <p className="text-sm text-muted-foreground">
          Review tenant payment submissions and approve or reject with optional remarks.
        </p>
      </div>

      {pending.length === 0 ? (
        <Card className="p-6 text-center text-muted-foreground text-sm">
          No payments awaiting verification.
        </Card>
      ) : (
        <div className="space-y-3">
          {pending.map((payment) => {
            const receiptUrl = payment.receiptFile
              ? resolveDocumentUrl(payment.receiptFile)
              : null;
            return (
              <Card key={payment.id} className="p-4">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="space-y-2 text-sm flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{payment.tenantName ?? 'Tenant'}</span>
                      <Badge variant="warning">Pending Verification</Badge>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1">
                      <p>
                        <span className="text-muted-foreground">Invoice: </span>
                        {payment.invoiceNumber ?? payment.invoiceId}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Period: </span>
                        {formatBillingPeriod(payment.billingPeriodStart, payment.billingPeriodEnd)}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Amount due: </span>
                        {payment.amountDue != null ? formatCurrency(payment.amountDue) : '—'}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Amount paid: </span>
                        <span className="font-semibold">{formatCurrency(payment.amount)}</span>
                      </p>
                      <p>
                        <span className="text-muted-foreground">Method: </span>
                        {formatManualPaymentMethod(payment.method)}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Payment date: </span>
                        {payment.paymentDate ? formatDate(payment.paymentDate) : '—'}
                      </p>
                      <p className="sm:col-span-2">
                        <span className="text-muted-foreground">Reference: </span>
                        <span className="font-mono">{payment.referenceNumber ?? '—'}</span>
                      </p>
                    </div>
                    {receiptUrl && (
                      <button
                        type="button"
                        onClick={() => setPreviewUrl(receiptUrl)}
                        className="inline-flex items-center gap-1 text-primary text-sm hover:underline"
                      >
                        <Eye className="w-4 h-4" />
                        View receipt
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      variant="primary"
                      size="sm"
                      loading={actionId === payment.id && !rejectId}
                      onClick={() => handleApprove(payment)}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setRejectId(payment.id);
                        setRemarks('');
                      }}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {rejectId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-4">
            <div className="flex justify-between mb-3">
              <h3 className="font-semibold">Reject Payment</h3>
              <button type="button" onClick={() => setRejectId(null)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <Textarea
              label="Remarks (optional)"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={3}
              placeholder="Explain why the payment was rejected..."
            />
            <div className="flex gap-2 mt-4">
              <Button variant="outline" className="flex-1" onClick={() => setRejectId(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                loading={actionId === rejectId}
                onClick={handleReject}
              >
                Reject Payment
              </Button>
            </div>
          </Card>
        </div>
      )}

      {previewUrl && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewUrl(null)}
        >
          <Card className="max-w-2xl max-h-[90vh] overflow-auto p-2" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-2 border-b mb-2">
              <span className="font-medium text-sm">Receipt</span>
              <button type="button" onClick={() => setPreviewUrl(null)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            {previewUrl.includes('application/pdf') ? (
              <iframe src={previewUrl} title="Receipt" className="w-full h-[70vh] rounded" />
            ) : (
              <img src={previewUrl} alt="Receipt" className="max-w-full h-auto mx-auto rounded" />
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
