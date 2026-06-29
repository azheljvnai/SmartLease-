import {
  ArrowRight,
  Camera,
  CheckCircle2,
  DollarSign,
  FileText,
  MessageSquare,
  UserPlus,
  Wrench,
} from 'lucide-react';
import type { MaintenanceUpdate } from '../../../../types';
import { formatDate, formatRelativeTime } from '../../../../lib/format';
import { maintenanceStatusLabel } from '../../../../lib/maintenance-labels';
import { cn } from '../../ui/utils';

interface Props {
  updates: MaintenanceUpdate[];
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  submission: Wrench,
  status_change: ArrowRight,
  assignment: UserPlus,
  schedule: CheckCircle2,
  note: MessageSquare,
  photo: Camera,
  cost: DollarSign,
  completion: CheckCircle2,
  info_request: MessageSquare,
  priority_change: ArrowRight,
};

function updateIcon(update: MaintenanceUpdate) {
  if (update.type && TYPE_ICONS[update.type]) return TYPE_ICONS[update.type];
  if (update.status === 'priority_change') return ArrowRight;
  return MessageSquare;
}

export function MaintenanceTimeline({ updates }: Props) {
  if (updates.length === 0) {
    return <p className="text-sm text-muted-foreground py-4 text-center">No activity yet</p>;
  }

  return (
    <div className="space-y-0">
      {[...updates].reverse().map((update, idx) => {
        const Icon = updateIcon(update);
        const isLast = idx === updates.length - 1;
        const ts = update.createdAt instanceof Date
          ? update.createdAt.toISOString()
          : String(update.date);

        return (
          <div key={update.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              {!isLast && <div className="w-px flex-1 bg-border min-h-4 my-1" />}
            </div>
            <div className={cn('pb-4 flex-1 min-w-0', isLast && 'pb-0')}>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                <span>{formatDate(ts)}</span>
                <span>·</span>
                <span>{formatRelativeTime(ts)}</span>
                {update.author && (
                  <>
                    <span>·</span>
                    <span className="font-medium text-foreground">{update.author}</span>
                    {update.authorRole && (
                      <span className="capitalize">({update.authorRole})</span>
                    )}
                  </>
                )}
              </div>
              <p className="text-sm mt-0.5">{update.message}</p>
              {update.status && update.type === 'status_change' && (
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  {maintenanceStatusLabel(update.status)}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
