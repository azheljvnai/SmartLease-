import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router';
import { toast } from 'sonner';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { CreditCard, Smartphone, Wallet, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { PageLoader } from '../common/LoadingSpinner';
import {
  loadCheckoutSession,
  clearCheckoutSession,
  type PayMongoCheckoutSession,
} from '../../../payments/checkout-session';
import { completeSimulatedPayMongoPayment } from '../../../services/payments.service';
import { formatCurrency } from '../../../lib/format';
import { getFirebaseErrorMessage } from '../../../lib/firebase-errors';

const METHOD_ICONS = {
  gcash: Smartphone,
  paymaya: Wallet,
  card: CreditCard,
} as const;

export const PayMongoCheckout = () => {
  const { tenant } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [session, setSession] = useState<PayMongoCheckoutSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Invalid checkout link.');
      setLoading(false);
      return;
    }
    const loaded = loadCheckoutSession(token);
    if (!loaded) {
      setError('This checkout session has expired or is invalid.');
      setLoading(false);
      return;
    }
    if (tenant && loaded.tenantId !== tenant.id) {
      setError('This checkout does not belong to your account.');
      setLoading(false);
      return;
    }
    setSession(loaded);
    setLoading(false);
  }, [token, tenant]);

  const handlePay = async () => {
    if (!session || !token) return;
    setPaying(true);
    try {
      await new Promise((r) => setTimeout(r, 1500));
      await completeSimulatedPayMongoPayment(session);
      clearCheckoutSession(token);
      navigate('/tenant/payments?status=success', { replace: true });
    } catch (err) {
      toast.error(getFirebaseErrorMessage(err));
      setPaying(false);
    }
  };

  const handleCancel = () => {
    if (token) clearCheckoutSession(token);
    navigate('/tenant/payments');
  };

  if (loading) return <PageLoader />;

  if (error || !session) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-6 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-destructive mx-auto" />
          <h1 className="text-lg font-semibold">Checkout unavailable</h1>
          <p className="text-sm text-muted-foreground">{error ?? 'Something went wrong.'}</p>
          <Button asChild variant="primary">
            <Link to="/tenant/payments">Back to Payments</Link>
          </Button>
        </Card>
      </div>
    );
  }

  const MethodIcon = METHOD_ICONS[session.paymentMethodType] ?? CreditCard;

  return (
    <div className="min-h-[80vh] flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4 bg-muted/30">
        <Card className="w-full max-w-md overflow-hidden shadow-lg border-0">
          <div className="bg-[#1a1f36] text-white px-6 py-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6" />
              <span className="text-xl font-bold tracking-tight">PayMongo</span>
            </div>
            <p className="text-white/70 text-sm mt-1">Secure payment checkout</p>
          </div>

          <div className="p-6 space-y-5">
            <div className="text-center pb-4 border-b">
              <p className="text-sm text-muted-foreground mb-1">SmartLease Property Management</p>
              <p className="text-3xl font-bold">{formatCurrency(session.amount)}</p>
              <p className="text-xs text-muted-foreground mt-1">{session.invoiceNumber}</p>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
              <MethodIcon className="w-8 h-8 text-primary shrink-0" />
              <div>
                <p className="text-sm font-medium">{session.method}</p>
                <p className="text-xs text-muted-foreground">Selected payment method</p>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                loading={paying}
                onClick={handlePay}
              >
                Pay {formatCurrency(session.amount)}
              </Button>
              <Button variant="outline" className="w-full" disabled={paying} onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
