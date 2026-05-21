import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Building2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { signUp } from '../../../services/auth.service';
import { getFirebaseErrorMessage } from '../../../lib/firebase-errors';
import type { UserRole } from '../../../types';

export const Register = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [userType, setUserType] = useState<UserRole>('tenant');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signUp({
        ...form,
        role: userType,
      });
      toast.success('Account created! Please sign in.');
      navigate('/login');
    } catch (err) {
      toast.error(getFirebaseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-secondary/20">
      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center">
              <Building2 className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <h2 className="text-2xl font-semibold text-foreground mb-2">Create Account</h2>
          <p className="text-muted-foreground">Join SmartLease today</p>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => setUserType('admin')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              userType === 'admin'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Admin
          </button>
          <button
            type="button"
            onClick={() => setUserType('tenant')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              userType === 'tenant'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Tenant
          </button>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="text"
              label="First Name"
              placeholder="John"
              required
              value={form.firstName}
              onChange={(e) => update('firstName', e.target.value)}
            />
            <Input
              type="text"
              label="Last Name"
              placeholder="Doe"
              required
              value={form.lastName}
              onChange={(e) => update('lastName', e.target.value)}
            />
          </div>

          <Input
            type="email"
            label="Email Address"
            placeholder="you@example.com"
            required
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
          />

          <Input
            type="tel"
            label="Phone Number"
            placeholder="+1 (555) 000-0000"
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
          />

          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              label="Password"
              placeholder="Create a strong password"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <label className="flex items-start gap-2 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 mt-0.5 rounded border-input accent-primary" required />
            <span className="text-sm text-muted-foreground">
              I agree to the Terms of Service and Privacy Policy
            </span>
          </label>

          <Button type="submit" variant="primary" size="lg" className="w-full" loading={loading}>
            Create Account
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-muted-foreground">Already have an account? </span>
          <Link to="/login" className="text-primary hover:underline font-medium">
            Sign in
          </Link>
        </div>
      </Card>
    </div>
  );
};
