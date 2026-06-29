import { Calendar, Clock, MapPin, User } from 'lucide-react';
import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';
import type { MaintenanceRequest } from '../../../../types';
import { formatDate } from '../../../../lib/format';
import { formatRequestId } from '../../../../lib/maintenance-utils';
import { maintenancePriorityLabel, maintenanceStatusLabel, maintenanceStatusVariant } from '../../../../lib/maintenance-labels';

interface Props {
  scheduled: MaintenanceRequest[];
}

export function MaintenanceSchedule({ scheduled }: Props) {
  const grouped = scheduled.reduce<Record<string, MaintenanceRequest[]>>((acc, r) => {
    const key = r.scheduledDate ?? 'Unscheduled';
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  const dates = Object.keys(grouped).sort();

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Upcoming Schedule</h2>
        <p className="text-sm text-muted-foreground">
          Scheduled repairs and assigned work orders
        </p>
      </div>

      {dates.length === 0 && (
        <Card className="p-8 text-center text-muted-foreground">
          <Calendar className="w-10 h-10 mx-auto mb-2 opacity-40" />
          No upcoming scheduled maintenance
        </Card>
      )}

      {dates.map((date) => (
        <div key={date}>
          <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {date === 'Unscheduled' ? 'Unscheduled' : formatDate(date)}
            <span className="text-xs">({grouped[date].length})</span>
          </h3>
          <div className="space-y-2">
            {grouped[date].map((r) => (
              <Card key={r.id} className="p-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-mono text-muted-foreground">{formatRequestId(r)}</p>
                    <p className="font-medium truncate">{r.issue}</p>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {r.propertyName} · {r.unitLabel}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {r.assignedTo ?? 'Unassigned'}
                      </span>
                      {r.scheduledTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {r.scheduledTime}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 shrink-0">
                    <Badge variant={maintenanceStatusVariant(r.status)}>
                      {maintenanceStatusLabel(r.status)}
                    </Badge>
                    <Badge variant="outline">{maintenancePriorityLabel(r.priority)}</Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
