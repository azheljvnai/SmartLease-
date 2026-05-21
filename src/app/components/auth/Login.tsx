import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Building2, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { signIn } from '../../../services/auth.service';
import { getFirebaseErrorMessage } from '../../../lib/firebase-errors';

export const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const profile = await signIn(email, password);
      toast.success('Welcome back!');
      navigate(profile.role === 'admin' ? '/admin' : '/tenant');
    } catch (err) {
      toast.error(getFirebaseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-secondary/20">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        <div className="hidden lg:block">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
                <Building2 className="w-10 h-10 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-foreground">SmartLease</h1>
                <p className="text-muted-foreground">Property Management Platform</p>
              </div>
            </div>
            <div className="space-y-4 mt-12">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Manage Properties</h3>
                  <p className="text-sm text-muted-foreground">
                    Efficiently manage all your properties and units in one place
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Stay Connected</h3>
                  <p className="text-sm text-muted-foreground">
                    Seamless communication between landlords and tenants
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Lock className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Secure & Reliable</h3>
                  <p className="text-sm text-muted-foreground">
                    Enterprise-grade security for your data and transactions
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Card className="w-full max-w-md mx-auto">
          <div className="text-center mb-8">
            <div className="lg:hidden flex justify-center mb-4">
              <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center">
                <Building2 className="w-8 h-8 text-primary-foreground" />
              </div>
            </div>
            <h2 className="text-2xl font-semibold text-foreground mb-2">Welcome Back</h2>
            <p className="text-muted-foreground">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              type="email"
              label="Email Address"
              placeholder="admin@smartlease.demo"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                label="Password"
                placeholder="Enter your password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-input accent-primary" />
                <span className="text-muted-foreground">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-primary hover:underline">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" variant="primary" size="lg" className="w-full" loading={loading}>
              Sign In
            </Button>
          </form>

          <p className="text-xs text-muted-foreground text-center mt-4">
            Demo: admin@smartlease.demo / Admin123! or john.smith@demo.com / Tenant123!
          </p>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Don&apos;t have an account? </span>
            <Link to="/register" className="text-primary hover:underline font-medium">
              Sign up
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
