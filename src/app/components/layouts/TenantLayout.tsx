import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import { Home, CreditCard, Wrench, User, Bell, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const TenantLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, tenant, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const navigation = [
    { name: 'Home', href: '/tenant', icon: Home },
    { name: 'Payments', href: '/tenant/payments', icon: CreditCard },
    { name: 'Maintenance', href: '/tenant/maintenance', icon: Wrench },
    { name: 'Profile', href: '/tenant/profile', icon: User },
  ];

  const isActive = (href: string) => {
    if (href === '/tenant') {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-background pb-16 lg:pb-0">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed top-0 left-0 h-full w-64 bg-card border-r border-border z-40">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center gap-3 px-6 border-b border-border">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Home className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <span className="text-xl font-semibold text-foreground">SmartLease</span>
              <p className="text-xs text-muted-foreground">Tenant Portal</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors
                    ${
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-primary">
                  {tenant?.name?.split(' ').map((n) => n[0]).join('') ?? 'TN'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{tenant?.name ?? profile?.firstName}</p>
                <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar for desktop */}
        <header className="hidden lg:flex h-14 bg-card border-b border-border items-center justify-between px-6">
          <div className="flex-1" />
          <div className="flex items-center gap-4">
            <button className="relative p-2 hover:bg-accent rounded-lg transition-colors">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
            </button>
          </div>
        </header>

        {/* Mobile Header */}
        <header className="lg:hidden bg-card border-b border-border px-4 py-3 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Home className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">SmartLease</h1>
              <p className="text-xs text-muted-foreground">Tenant Portal</p>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8 max-w-full">
          <div className="lg:max-w-[1400px] lg:mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Bottom navigation for mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border lg:hidden">
        <div className="grid grid-cols-4">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`
                  flex flex-col items-center justify-center py-2 transition-colors
                  ${active ? 'text-primary' : 'text-muted-foreground'}
                `}
              >
                <Icon className="w-5 h-5 mb-0.5" />
                <span className="text-xs">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
