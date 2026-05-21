import { useState } from 'react';
import { Link } from 'react-router';
import { Building2, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { resetPassword } from '../../../services/auth.service';
import { getFirebaseErrorMessage } from '../../../lib/firebase-errors';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
      toast.success('Password reset email sent');
    } catch (err) {
      toast.error(getFirebaseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-secondary/20">
      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center">
              <Building2 className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <h2 className="text-2xl font-semibold text-foreground mb-2">Reset Password</h2>
          <p className="text-muted-foreground">
            {sent
              ? 'Check your inbox for reset instructions.'
              : 'Enter your email to receive a reset link.'}
          </p>
        </div>

        {!sent ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
            <Button type="submit" variant="primary" className="w-full" loading={loading}>
              Send Reset Link
            </Button>
          </form>
        ) : (
          <div className="flex justify-center">
            <Mail className="w-12 h-12 text-primary" />
          </div>
        )}

        <p className="text-center text-sm text-muted-foreground mt-6">
          <Link to="/login" className="text-primary hover:underline">
            Back to login
          </Link>
        </p>
      </Card>
    </div>
  );
};
