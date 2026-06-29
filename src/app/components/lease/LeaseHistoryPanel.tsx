import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { History } from 'lucide-react';
import { Card } from '../ui/card';
import type { LeaseHistoryEntry } from '../../../types';
import { listLeaseHistory } from '../../../services/leases.service';
import { formatRelativeTime } from '../../../lib/format';
import { serializeTimestamp } from '../../../lib/firestore';

interface Props {
  leaseId: string;
  refreshKey?: string;
}

export function LeaseHistoryPanel({ leaseId, refreshKey }: Props) {
  const [history, setHistory] = useState<LeaseHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    listLeaseHistory(leaseId)
      .then(setHistory)
      .catch(() => toast.error('Failed to load document history'))
      .finally(() => setLoading(false));
  }, [leaseId, refreshKey]);

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <History className="w-4 h-4 text-primary" />
        <h3 className="font-semibold">Document History</h3>
      </div>
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading history...</p>
      ) : history.length === 0 ? (
        <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
      ) : (
        <ul className="space-y-2 max-h-72 overflow-y-auto">
          {history.map((entry) => {
            const created = serializeTimestamp(entry.createdAt);
            const date =
              created instanceof Date
                ? created
                : typeof created === 'string'
                  ? new Date(created)
                  : new Date();
            return (
              <li
                key={entry.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-sm py-2 border-b last:border-0"
              >
                <div>
                  <p className="font-medium">{entry.action}</p>
                  {entry.details && (
                    <p className="text-xs text-muted-foreground">{entry.details}</p>
                  )}
                  {entry.performedBy && entry.performedBy !== 'admin' && (
                    <p className="text-xs text-muted-foreground">By {entry.performedBy}</p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatRelativeTime(date)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
