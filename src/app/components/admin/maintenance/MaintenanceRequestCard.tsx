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
import { Building2, Calendar, User } from 'lucide-react';
import { cn } from '../../ui/utils';

interface Props {
  request: MaintenanceRequest;
  selected: boolean;
  onSelect: () => void;
}

export function MaintenanceRequestCard({ request, selected, onSelect }: Props) {
  const CategoryIcon = maintenanceCategoryIcon(request.category);
  const priorityStyle = maintenancePriorityColor(request.priority);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full text-left rounded-lg border bg-card p-3 transition-all hover:bg-accent/40',
        selected && 'ring-2 ring-primary border-primary/50 bg-accent/20',
        `border-l-4 ${priorityStyle.border}`,
      )}
    >
      <div className="flex gap-3">
        <div
          className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
            priorityStyle.bg,
          )}
        >
          <CategoryIcon className={cn('w-5 h-5', priorityStyle.text)} />
        </div>

        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-mono text-muted-foreground">{formatRequestId(request)}</p>
              <h3 className="font-semibold text-sm truncate">{request.issue}</h3>
            </div>
            <div className={cn('w-2 h-2 rounded-full shrink-0 mt-1.5', priorityStyle.dot)} title={maintenancePriorityLabel(request.priority)} />
          </div>

          <div className="flex flex-wrap gap-1">
            <Badge variant={maintenanceStatusVariant(request.status)}>
              {maintenanceStatusLabel(request.status)}
            </Badge>
            <Badge className={cn(priorityStyle.bg, priorityStyle.text, 'border-0')}>
              {maintenancePriorityLabel(request.priority)}
            </Badge>
          </div>

          <div className="grid grid-cols-1 gap-0.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1 truncate">
              <Building2 className="w-3 h-3 shrink-0" />
              {request.propertyName ?? 'Property'} · {request.unitLabel}
            </span>
            <span className="flex items-center gap-1 truncate">
              <User className="w-3 h-3 shrink-0" />
              {request.tenantName}
            </span>
            <span className="truncate">
              Tech: {request.assignedTo ?? 'Unassigned'}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground pt-0.5">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(request.submitted)}
            </span>
            <span title={formatDate(getUpdatedAtIso(request))}>
              Updated {formatRelativeTime(getUpdatedAtIso(request))}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}
