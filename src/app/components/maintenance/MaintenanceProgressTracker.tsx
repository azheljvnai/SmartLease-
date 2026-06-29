import { Check } from 'lucide-react';
import {
  getTenantProgressIndex,
  TENANT_PROGRESS_STAGES,
  normalizeMaintenanceStatus,
} from '../../../lib/maintenance-labels';
import type { MaintenanceStatus } from '../../../types';
import { cn } from '../ui/utils';

interface Props {
  status: MaintenanceStatus | string;
  compact?: boolean;
}

export function MaintenanceProgressTracker({ status, compact }: Props) {
  const normalized = normalizeMaintenanceStatus(status);
  const currentIndex = getTenantProgressIndex(status);
  const isCancelled = normalized === 'closed' && currentIndex === 6;

  if (compact) {
    return (
      <div className="flex items-center gap-1 w-full overflow-x-auto pb-1">
        {TENANT_PROGRESS_STAGES.map((stage, idx) => {
          const done = idx < currentIndex || (idx === currentIndex && normalized === 'closed');
          const active = idx === currentIndex;
          return (
            <div key={stage.key} className="flex items-center gap-1 shrink-0">
              <div
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium border-2 transition-colors',
                  done && 'bg-primary border-primary text-primary-foreground',
                  active && !done && 'border-primary bg-primary/10 text-primary',
                  !done && !active && 'border-muted-foreground/30 text-muted-foreground',
                )}
                title={stage.label}
              >
                {done ? <Check className="w-3 h-3" /> : idx + 1}
              </div>
              {idx < TENANT_PROGRESS_STAGES.length - 1 && (
                <div
                  className={cn(
                    'w-4 h-0.5 rounded',
                    idx < currentIndex ? 'bg-primary' : 'bg-muted-foreground/20',
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="hidden sm:flex items-start justify-between relative">
        <div className="absolute top-4 left-4 right-4 h-0.5 bg-muted-foreground/20" />
        <div
          className="absolute top-4 left-4 h-0.5 bg-primary transition-all duration-500"
          style={{
            width: `calc(${(currentIndex / (TENANT_PROGRESS_STAGES.length - 1)) * 100}% - 2rem)`,
          }}
        />
        {TENANT_PROGRESS_STAGES.map((stage, idx) => {
          const done = idx < currentIndex || (idx === currentIndex && isCancelled);
          const active = idx === currentIndex;
          return (
            <div key={stage.key} className="flex flex-col items-center relative z-10 flex-1 min-w-0">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors bg-background',
                  done && 'bg-primary border-primary text-primary-foreground',
                  active && !done && 'border-primary text-primary ring-4 ring-primary/20',
                  !done && !active && 'border-muted-foreground/30 text-muted-foreground',
                )}
              >
                {done ? <Check className="w-4 h-4" /> : idx + 1}
              </div>
              <span
                className={cn(
                  'text-[10px] sm:text-xs mt-1.5 text-center leading-tight px-0.5',
                  active ? 'font-semibold text-foreground' : 'text-muted-foreground',
                )}
              >
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="sm:hidden space-y-2">
        {TENANT_PROGRESS_STAGES.map((stage, idx) => {
          const done = idx < currentIndex || (idx === currentIndex && isCancelled);
          const active = idx === currentIndex;
          if (!done && !active) return null;
          return (
            <div
              key={stage.key}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2',
                active ? 'bg-primary/10 border border-primary/30' : 'opacity-60',
              )}
            >
              <div
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold',
                  done ? 'bg-primary text-primary-foreground' : 'border-2 border-primary text-primary',
                )}
              >
                {done ? <Check className="w-3.5 h-3.5" /> : idx + 1}
              </div>
              <span className={cn('text-sm', active && 'font-medium')}>{stage.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
