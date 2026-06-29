import type { LucideIcon } from 'lucide-react';
import { cn } from '../../ui/utils';
import { Card } from '../../ui/card';

type TenantStatCardProps = {
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'primary';
  className?: string;
};

const iconVariants = {
  default: 'bg-muted text-muted-foreground',
  success: 'bg-emerald-500/10 text-emerald-600',
  warning: 'bg-amber-500/10 text-amber-600',
  danger: 'bg-red-500/10 text-red-600',
  primary: 'bg-primary/10 text-primary',
};

const valueVariants = {
  default: 'text-foreground',
  success: 'text-emerald-600',
  warning: 'text-amber-600',
  danger: 'text-red-600',
  primary: 'text-primary',
};

export function TenantStatCard({
  label,
  value,
  icon: Icon,
  trend,
  variant = 'default',
  className,
}: TenantStatCardProps) {
  return (
    <Card padding={false} hover className={cn('p-4', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className={cn('mt-1 text-xl font-bold tracking-tight sm:text-2xl', valueVariants[variant])}>
            {value}
          </p>
          {trend && <p className="mt-0.5 text-xs text-muted-foreground">{trend}</p>}
        </div>
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
            iconVariants[variant],
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}
