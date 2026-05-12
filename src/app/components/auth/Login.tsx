import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Building2, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';

export const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [userType, setUserType] = useState<'admin' | 'tenant'>('admin');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (userType === 'admin') {
      navigate('/admin');
    } else {
      navigate('/tenant');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-secondary/20">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Branding (hidden on mobile) */}
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

        {/* Right side - Login form */}
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

          {/* User type selector */}
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => setUserType('admin')}
              className={`
                flex-1 py-2.5 rounded-lg text-sm font-medium transition-all
                ${
                  userType === 'admin'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }
              `}
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => setUserType('tenant')}
              className={`
                flex-1 py-2.5 rounded-lg text-sm font-medium transition-all
                ${
                  userType === 'tenant'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }
              `}
            >
              Tenant
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              type="email"
              label="Email Address"
              placeholder="you@example.com"
              required
            />

            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                label="Password"
                placeholder="Enter your password"
                required
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
              <a href="#" className="text-primary hover:underline">
                Forgot password?
              </a>
            </div>

            <Button type="submit" variant="primary" size="lg" className="w-full">
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Don't have an account? </span>
            <Link to="/register" className="text-primary hover:underline font-medium">
              Sign up
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
