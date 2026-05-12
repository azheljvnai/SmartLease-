import { Outlet, Link, useLocation } from 'react-router';
import { useState } from 'react';
import {
  LayoutDashboard,
  Building2,
  Users,
  FileText,
  CreditCard,
  Wrench,
  BarChart3,
  Bell,
  Menu,
  X,
  LogOut,
} from 'lucide-react';

export const AdminLayout = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Properties', href: '/admin/properties', icon: Building2 },
    { name: 'Tenants', href: '/admin/tenants', icon: Users },
    { name: 'Leases', href: '/admin/leases', icon: FileText },
    { name: 'Billing', href: '/admin/billing', icon: CreditCard },
    { name: 'Maintenance', href: '/admin/maintenance', icon: Wrench },
    { name: 'Reports', href: '/admin/reports', icon: BarChart3 },
  ];

  const isActive = (href: string) => {
    if (href === '/admin') {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-card border-b border-border flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold text-foreground">SmartLease</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 hover:bg-accent rounded-lg"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-card border-r border-border z-40
          transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-14 lg:h-16 flex items-center gap-3 px-4 lg:px-6 border-b border-border">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold text-foreground">SmartLease</span>
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
                  onClick={() => setSidebarOpen(false)}
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
          <div className="p-3 lg:p-4 border-t border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-primary">AD</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">Admin User</p>
                <p className="text-xs text-muted-foreground truncate">admin@smartlease.com</p>
              </div>
            </div>
            <Link
              to="/login"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="lg:pl-64 pt-14 lg:pt-0">
        {/* Top bar */}
        <header className="hidden lg:flex h-14 bg-card border-b border-border items-center justify-between px-6">
          <div className="flex-1" />
          <div className="flex items-center gap-4">
            <button className="relative p-2 hover:bg-accent rounded-lg transition-colors">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8 max-w-full">
          <div className="lg:max-w-[1400px] lg:mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
