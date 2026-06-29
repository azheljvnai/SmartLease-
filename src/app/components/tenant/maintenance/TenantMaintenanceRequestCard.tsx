import { Badge } from '../../ui/badge';
import type { MaintenanceRequest } from '../../../../types';
import {
  maintenanceCategoryIcon,
  maintenancePriorityColor,
  maintenancePriorityLabel,
  maintenanceStatusLabel,
  maintenanceStatusVariant,
} from '../../../../lib/maintenance-labels';
import { formatDate, formatRelativeTime } from '../../../../lib/format';
import { formatRequestId, getUpdatedAtIso } from '../../../../lib/maintenance-utils';
import { Building2, Calendar, Clock, User, Wrench } from 'lucide-react';
import { cn } from '../../ui/utils';
import { MaintenanceProgressTracker } from '../../maintenance/MaintenanceProgressTracker';

interface Props {
  request: MaintenanceRequest;
  selected: boolean;
  onSelect: () => void;
}

export function TenantMaintenanceRequestCard({ request, selected, onSelect }: Props) {
  const CategoryIcon = maintenanceCategoryIcon(request.category);
  const priorityStyle = maintenancePriorityColor(request.priority);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full text-left rounded-xl border bg-card p-4 transition-all hover:shadow-sm hover:border-primary/30',
        selected && 'ring-2 ring-primary border-primary/50 shadow-sm',
        `border-l-4 ${priorityStyle.border}`,
      )}
    >
      <div className="flex gap-3">
        <div
          className={cn(
            'w-11 h-11 rounded-xl flex items-center justify-center shrink-0',
            priorityStyle.bg,
          )}
        >
          <CategoryIcon className={cn('w-5 h-5', priorityStyle.text)} />
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-mono text-muted-foreground">{formatRequestId(request)}</p>
              <h3 className="font-semibold text-sm leading-snug line-clamp-2">{request.issue}</h3>
            </div>
            <Badge variant={maintenanceStatusVariant(request.status)} className="shrink-0">
              {maintenanceStatusLabel(request.status)}
            </Badge>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline" className="text-xs font-normal">
              {request.category}
            </Badge>
            <Badge className={cn(priorityStyle.bg, priorityStyle.text, 'border-0 text-xs')}>
              {maintenancePriorityLabel(request.priority)}
            </Badge>
          </div>

          <div className="grid grid-cols-1 gap-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5 truncate">
              <Building2 className="w-3.5 h-3.5 shrink-0" />
              {request.propertyName ?? 'Property'} · Unit {request.unitLabel}
            </span>
            <span className="flex items-center gap-1.5 truncate">
              <User className="w-3.5 h-3.5 shrink-0" />
              {request.assignedTo ? (
                <>
                  <Wrench className="w-3 h-3 shrink-0" />
                  {request.assignedTo}
                </>
              ) : (
                'Awaiting technician assignment'
              )}
            </span>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Submitted {formatDate(request.submitted)}
              </span>
              {request.scheduledDate && (
                <span className="flex items-center gap-1 text-primary">
                  <Clock className="w-3.5 h-3.5" />
                  Scheduled {formatDate(request.scheduledDate)}
                  {request.scheduledTime ? ` ${request.scheduledTime}` : ''}
                </span>
              )}
              <span className="text-muted-foreground/80">
                Updated {formatRelativeTime(getUpdatedAtIso(request))}
              </span>
            </div>
          </div>

          <MaintenanceProgressTracker status={request.status} compact />
        </div>
      </div>
    </button>
  );
}
