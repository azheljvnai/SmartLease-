import { Card } from '../../ui/card';
import type { LeaseSummaryStats } from '../../../../lib/lease-utils';
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  PenLine,
  XCircle,
} from 'lucide-react';

interface Props {
  stats: LeaseSummaryStats;
}

function KpiCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  accent?: string;
}) {
  return (
    <Card className="p-3 lg:p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground truncate">{label}</p>
          <p className={`text-xl lg:text-2xl font-semibold mt-0.5 ${accent ?? ''}`}>{value}</p>
        </div>
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-primary" />
        </div>
      </div>
    </Card>
  );
}

export function LeaseSummaryCards({ stats }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 lg:gap-3">
      <KpiCard label="Total Leases" value={stats.total} icon={FileText} />
      <KpiCard label="Active" value={stats.active} icon={CheckCircle2} accent="text-emerald-600" />
      <KpiCard label="Expiring Soon" value={stats.expiringSoon} icon={Clock} accent="text-amber-600" />
      <KpiCard label="Expired" value={stats.expired} icon={AlertTriangle} accent="text-orange-600" />
      <KpiCard label="Pending Signature" value={stats.pendingSignature} icon={PenLine} accent="text-blue-600" />
      <KpiCard label="Terminated" value={stats.terminated} icon={XCircle} accent="text-red-600" />
    </div>
  );
}
