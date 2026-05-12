import { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import {
  DollarSign,
  CreditCard,
  Calendar,
  CheckCircle2,
  X,
  Smartphone,
  Plus
} from 'lucide-react';

const paymentHistory = [
  { month: 'April 2026', amount: 1200, status: 'paid', date: '2026-04-01', method: 'Bank Transfer' },
  { month: 'March 2026', amount: 1200, status: 'paid', date: '2026-03-01', method: 'Credit Card' },
  { month: 'February 2026', amount: 1200, status: 'paid', date: '2026-02-01', method: 'Bank Transfer' },
  { month: 'January 2026', amount: 1200, status: 'paid', date: '2026-01-01', method: 'Credit Card' },
];

export const TenantPayments = () => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'gcash'>('card');

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-semibold text-foreground mb-1">Payments</h1>
        <p className="text-sm lg:text-base text-muted-foreground">Manage your rent payments</p>
      </div>

      {/* Current payment due */}
      <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16" />
        <div className="relative text-center mb-3 lg:mb-4">
          <p className="text-primary-foreground/80 text-sm mb-2">May 2026 Rent</p>
          <h2 className="text-5xl lg:text-6xl font-bold mb-3">$1,200</h2>
          <div className="flex items-center justify-center gap-2 text-sm mb-1">
            <Calendar className="w-4 h-4" />
            <span>Due: May 1, 2026</span>
          </div>
          <p className="text-primary-foreground/70 text-xs">3 days remaining</p>
        </div>
        <Button
          variant="secondary"
          size="lg"
          className="w-full bg-white text-primary hover:bg-white/90 shadow-lg font-semibold"
          onClick={() => setShowPaymentModal(true)}
        >
          <CreditCard className="w-5 h-5 mr-2" />
          Pay Now
        </Button>
      </Card>

      {/* Payment methods and history on desktop - grid layout */}
      <div className="lg:grid lg:grid-cols-5 lg:gap-6 space-y-4 lg:space-y-0">
        <Card className="hover:shadow-md transition-shadow lg:col-span-2">
          <h3 className="font-semibold text-foreground mb-4">Payment Methods</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">•••• 4242</p>
                  <p className="text-xs text-muted-foreground">Visa - Expires 12/27</p>
                </div>
              </div>
              <Badge variant="success">Default</Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => alert('Add payment method functionality')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Payment Method
            </Button>
          </div>
        </Card>

        {/* Payment history */}
        <Card className="hover:shadow-md transition-shadow lg:col-span-3">
          <h3 className="font-semibold text-foreground mb-4">Payment History</h3>
          <div className="space-y-2">
            {paymentHistory.map((payment, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-success/5 border border-success/20 rounded-xl hover:bg-success/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{payment.month}</p>
                    <p className="text-xs text-muted-foreground">
                      {payment.method} • {payment.date}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-foreground">${payment.amount.toLocaleString()}</p>
                  <Badge variant="success" className="mt-1">Paid</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-foreground">Complete Payment</h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-2 hover:bg-accent rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6">
              <div className="bg-accent/50 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Amount Due</span>
                  <span className="text-2xl font-bold text-foreground">$1,200</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Due Date</span>
                  <span className="text-sm text-foreground">May 1, 2026</span>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-foreground mb-3">Payment Method</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPaymentMethod('card')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      paymentMethod === 'card'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <CreditCard className="w-6 h-6 text-primary mx-auto mb-2" />
                    <p className="text-sm font-medium text-foreground">Card</p>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('gcash')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      paymentMethod === 'gcash'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <Smartphone className="w-6 h-6 text-primary mx-auto mb-2" />
                    <p className="text-sm font-medium text-foreground">GCash</p>
                  </button>
                </div>
              </div>

              {paymentMethod === 'card' && (
                <div className="space-y-3">
                  <Input
                    label="Card Number"
                    type="text"
                    placeholder="1234 5678 9012 3456"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Expiry"
                      type="text"
                      placeholder="MM/YY"
                    />
                    <Input
                      label="CVV"
                      type="text"
                      placeholder="123"
                    />
                  </div>
                </div>
              )}

              {paymentMethod === 'gcash' && (
                <div className="space-y-3">
                  <Input
                    label="GCash Number"
                    type="text"
                    placeholder="09XX XXX XXXX"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                size="lg"
                className="flex-1"
                onClick={() => setShowPaymentModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="lg"
                className="flex-1"
                onClick={() => {
                  alert('Payment processed successfully!');
                  setShowPaymentModal(false);
                }}
              >
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Confirm Payment
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
