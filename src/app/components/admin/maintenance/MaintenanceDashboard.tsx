import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card } from '../../ui/card';
import { formatCurrency, formatCurrencyCompact } from '../../../../lib/format';
import type { MaintenanceDashboardStats } from '../../../../types';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  UserCheck,
  Wrench,
} from 'lucide-react';

interface Props {
  stats: MaintenanceDashboardStats;
  compact?: boolean;
}

function KpiCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
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

export function MaintenanceDashboard({ stats, compact }: Props) {
  if (compact) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        <KpiCard label="Open" value={stats.openRequests} icon={Wrench} />
        <KpiCard label="Assigned" value={stats.assignedRequests} icon={UserCheck} />
        <KpiCard label="In Progress" value={stats.inProgress} icon={Clock} />
        <KpiCard label="Done (Month)" value={stats.completedThisMonth} icon={CheckCircle2} />
        <KpiCard label="Emergency" value={stats.emergencyRequests} icon={AlertTriangle} accent="text-red-600" />
        <KpiCard label="Avg Cost" value={formatCurrencyCompact(stats.averageCost)} icon={DollarSign} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 lg:gap-3">
        <KpiCard label="Open Requests" value={stats.openRequests} icon={Wrench} />
        <KpiCard label="Assigned" value={stats.assignedRequests} icon={UserCheck} />
        <KpiCard label="In Progress" value={stats.inProgress} icon={Clock} />
        <KpiCard label="Completed (Month)" value={stats.completedThisMonth} icon={CheckCircle2} />
        <KpiCard label="Emergency" value={stats.emergencyRequests} icon={AlertTriangle} accent="text-red-600" />
        <KpiCard label="Avg Resolution" value={`${stats.averageResolutionDays}d`} icon={Clock} />
        <KpiCard label="Avg Cost" value={formatCurrency(stats.averageCost)} icon={DollarSign} />
        <KpiCard
          label="Technicians"
          value={stats.technicianWorkload.length}
          icon={UserCheck}
        />
      </div>

      <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-3">
        <Card className="p-4">
          <h3 className="text-sm font-medium mb-3">Requests by Month</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.byMonth}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Requests" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-medium mb-3">By Category</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.byCategory}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  label={({ name, percent }) =>
                    percent > 0.08 ? `${name}` : ''
                  }
                >
                  {stats.byCategory.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-medium mb-3">Status Distribution</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.statusDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                >
                  {stats.statusDistribution.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-medium mb-3">Technician Workload</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.technicianWorkload} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="openCount" stackId="a" fill="#f59e0b" name="Open" />
                <Bar dataKey="inProgressCount" stackId="a" fill="#3b82f6" name="In Progress" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-medium mb-3">Avg Resolution Trend (days)</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.resolutionTrend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="Days" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-medium mb-3">By Property</h3>
          <div className="h-48 overflow-y-auto space-y-2 pr-1">
            {stats.byProperty.length === 0 && (
              <p className="text-sm text-muted-foreground">No data yet</p>
            )}
            {stats.byProperty.map((p) => (
              <div key={p.name} className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
                <span className="flex-1 truncate">{p.name}</span>
                <span className="font-medium">{p.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
