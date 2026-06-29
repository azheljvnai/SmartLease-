import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { ArrowRight } from 'lucide-react';
import { cn } from '../../ui/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../ui/card';

type TenantSectionProps = {
  title: string;
  description?: string;
  action?: { label: string; href: string };
  children: ReactNode;
  className?: string;
  padding?: boolean;
};

export function TenantSection({
  title,
  description,
  action,
  children,
  className,
  padding = true,
}: TenantSectionProps) {
  return (
    <Card padding={false} className={cn('overflow-hidden', className)}>
      <CardHeader className="border-b bg-muted/30 px-4 py-3 sm:px-5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base font-semibold">{title}</CardTitle>
            {description && (
              <CardDescription className="text-xs sm:text-sm">{description}</CardDescription>
            )}
          </div>
          {action && (
            <Link
              to={action.href}
              className="flex shrink-0 items-center gap-1 text-xs font-medium text-primary hover:underline sm:text-sm"
            >
              {action.label}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent className={cn(padding && 'p-4 sm:p-5')}>{children}</CardContent>
    </Card>
  );
}
