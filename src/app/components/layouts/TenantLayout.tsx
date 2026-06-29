import { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import {
  ChevronLeft,
  ChevronRight,
  Home,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { NotificationBell } from '../common/NotificationBell';
import { useAuth } from '../../contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { cn } from '../ui/utils';
import { TenantBreadcrumb } from '../tenant/shared/TenantBreadcrumb';
import { TENANT_NAV, isTenantNavActive } from '../tenant/shared/tenant-nav';

const SIDEBAR_KEY = 'tenant-sidebar-collapsed';

export const TenantLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, tenant, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_KEY, String(collapsed));
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const initials =
    tenant?.name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() ?? 'TN';

  const displayName = tenant?.name ?? profile?.firstName ?? 'Tenant';

  const sidebarContent = (isMobile = false) => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div
        className={cn(
          'flex h-14 items-center border-b border-sidebar-border',
          collapsed && !isMobile ? 'justify-center px-2' : 'gap-3 px-4',
        )}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary shadow-sm">
          <Home className="h-5 w-5 text-primary-foreground" />
        </div>
        {(!collapsed || isMobile) && (
          <div className="min-w-0">
            <span className="text-base font-semibold text-foreground">SmartLease</span>
            <p className="text-[11px] text-muted-foreground leading-tight">Tenant Portal</p>
          </div>
        )}
        {isMobile && (
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="ml-auto rounded-lg p-1.5 hover:bg-accent"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2" aria-label="Main navigation">
        <TooltipProvider delayDuration={0}>
          {TENANT_NAV.map((item) => {
            const Icon = item.icon;
            const active = isTenantNavActive(location.pathname, item.href);
            const link = (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                  collapsed && !isMobile && 'justify-center px-2',
                  active
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground',
                )}
                aria-current={active ? 'page' : undefined}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary-foreground/80" />
                )}
                <Icon className="h-5 w-5 shrink-0" />
                {(!collapsed || isMobile) && <span>{item.name}</span>}
              </Link>
            );

            if (collapsed && !isMobile) {
              return (
                <Tooltip key={item.name}>
                  <TooltipTrigger asChild>{link}</TooltipTrigger>
                  <TooltipContent side="right">{item.name}</TooltipContent>
                </Tooltip>
              );
            }
            return link;
          })}
        </TooltipProvider>
      </nav>

      {/* User section */}
      <div className="border-t border-sidebar-border p-2">
        {(!collapsed || isMobile) ? (
          <div className="rounded-lg bg-muted/50 p-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                {profile?.photoUrl && <AvatarImage src={profile.photoUrl} alt="" />}
                <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{displayName}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {tenant?.unitLabel ?? profile?.email}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="mt-2 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </div>
        ) : (
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center justify-center rounded-lg p-2.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                  aria-label="Sign out"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Sign out</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile overlay sidebar */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-72 border-r border-sidebar-border bg-sidebar transition-transform duration-300 lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {sidebarContent(true)}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-40 hidden h-full border-r border-sidebar-border bg-sidebar transition-[width] duration-300 lg:block',
          collapsed ? 'w-[4.5rem]' : 'w-64',
        )}
      >
        {sidebarContent()}
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="absolute -right-3 top-[4.5rem] z-50 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card shadow-sm hover:bg-accent"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5" />
          )}
        </button>
      </aside>

      {/* Main area */}
      <div
        className={cn(
          'flex min-h-screen flex-col transition-[padding] duration-300',
          collapsed ? 'lg:pl-[4.5rem]' : 'lg:pl-64',
        )}
      >
        {/* Top header */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card/80 px-4 backdrop-blur-sm lg:px-6">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 hover:bg-accent lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="hidden min-w-0 flex-1 lg:block">
            <TenantBreadcrumb />
          </div>

          <div className="flex flex-1 items-center justify-end gap-2 lg:flex-none">
            <NotificationBell />
            <div className="hidden items-center gap-2 sm:flex lg:hidden">
              <Avatar className="h-8 w-8">
                {profile?.photoUrl && <AvatarImage src={profile.photoUrl} alt="" />}
                <AvatarFallback className="bg-primary/10 text-xs text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 pb-20 lg:p-6 lg:pb-6">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-card/95 backdrop-blur-sm lg:hidden"
        aria-label="Mobile navigation"
      >
        <div className="grid grid-cols-5">
          {TENANT_NAV.map((item) => {
            const Icon = item.icon;
            const active = isTenantNavActive(location.pathname, item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground',
                )}
                aria-current={active ? 'page' : undefined}
              >
                <span
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-xl transition-colors',
                    active && 'bg-primary/10',
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                {item.name}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
