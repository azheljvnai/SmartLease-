import { useMemo } from 'react';
import {
  Archive,
  Calendar,
  CheckCircle2,
  FileText,
  Paperclip,
  Wrench,
} from 'lucide-react';
import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { EmptyState } from '../../common/EmptyState';
import type { MaintenanceRequest } from '../../../../types';
import {
  isCompletedMaintenanceStatus,
  maintenanceCategoryIcon,
  maintenanceStatusLabel,
  maintenanceStatusVariant,
} from '../../../../lib/maintenance-labels';
import { formatCurrency, formatDate } from '../../../../lib/format';
import { computeTotalCost, formatRequestId } from '../../../../lib/maintenance-utils';
import { cn } from '../../ui/utils';

interface Props {
  requests: MaintenanceRequest[];
  onSelectRequest: (request: MaintenanceRequest) => void;
}

export function TenantMaintenanceHistory({ requests, onSelectRequest }: Props) {
  const completed = useMemo(
    () =>
      requests
        .filter((r) => isCompletedMaintenanceStatus(r.status))
        .sort((a, b) => (b.completedDate ?? b.submitted).localeCompare(a.completedDate ?? a.submitted)),
    [requests],
  );

  const allDocuments = useMemo(() => {
    const docs: Array<{
      requestId: string;
      requestIssue: string;
      name: string;
      url: string;
      type: string;
      date: string;
    }> = [];
    for (const r of completed) {
      r.attachments?.forEach((a) => {
        docs.push({
          requestId: r.id,
          requestIssue: r.issue,
          name: a.name,
          url: a.url,
          type: a.type,
          date: a.uploadedAt,
        });
      });
      if (r.invoiceUrl) {
        docs.push({
          requestId: r.id,
          requestIssue: r.issue,
          name: 'Invoice',
          url: r.invoiceUrl,
          type: 'invoice',
          date: r.completedDate ?? r.submitted,
        });
      }
    }
    return docs.sort((a, b) => b.date.localeCompare(a.date));
  }, [completed]);

  const stats = useMemo(
    () => ({
      total: completed.length,
      totalCost: completed.reduce((sum, r) => sum + computeTotalCost(r), 0),
      withDocs: allDocuments.length,
    }),
    [completed, allDocuments],
  );

  if (completed.length === 0) {
    return (
      <EmptyState
        icon={Archive}
        title="No maintenance history yet"
        description="Completed and closed requests will appear here along with any documents or invoices."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          <p className="text-xs text-muted-foreground">Completed repairs</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{stats.withDocs}</p>
          <p className="text-xs text-muted-foreground">Documents</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold text-foreground">
            {stats.totalCost > 0 ? formatCurrency(stats.totalCost) : '—'}
          </p>
          <p className="text-xs text-muted-foreground">Total costs</p>
        </Card>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          Past Requests
        </h3>
        <div className="space-y-2">
          {completed.map((request) => {
            const CategoryIcon = maintenanceCategoryIcon(request.category);
            const cost = computeTotalCost(request);
            return (
              <button
                key={request.id}
                type="button"
                onClick={() => onSelectRequest(request)}
                className="w-full text-left rounded-xl border bg-card p-4 hover:border-primary/30 hover:shadow-sm transition-all"
              >
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <CategoryIcon className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-mono text-muted-foreground">
                          {formatRequestId(request)}
                        </p>
                        <h4 className="font-medium text-sm truncate">{request.issue}</h4>
                      </div>
                      <Badge variant={maintenanceStatusVariant(request.status)} className="shrink-0">
                        {maintenanceStatusLabel(request.status)}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {request.completedDate
                          ? `Completed ${formatDate(request.completedDate)}`
                          : `Submitted ${formatDate(request.submitted)}`}
                      </span>
                      <span>{request.category}</span>
                      {request.assignedTo && (
                        <span className="flex items-center gap-1">
                          <Wrench className="w-3 h-3" />
                          {request.assignedTo}
                        </span>
                      )}
                      {cost > 0 && <span>{formatCurrency(cost)}</span>}
                      {(request.attachments?.length ?? 0) > 0 && (
                        <span className="flex items-center gap-1">
                          <Paperclip className="w-3 h-3" />
                          {request.attachments!.length} file
                          {request.attachments!.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {allDocuments.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
            <FileText className="w-4 h-4" />
            Documents & Invoices
          </h3>
          <div className="rounded-xl border divide-y overflow-hidden">
            {allDocuments.map((doc, i) => (
              <a
                key={`${doc.requestId}-${i}`}
                href={doc.url}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  'flex items-center gap-3 p-3 hover:bg-accent/50 transition-colors',
                )}
              >
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{doc.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {doc.requestIssue} · {formatDate(doc.date)}
                  </p>
                </div>
                <Badge variant="outline" className="shrink-0 capitalize text-xs">
                  {doc.type}
                </Badge>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
