import { useMemo, useState } from 'react';
import { Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Badge } from '../../ui/badge';
import { EmptyState } from '../../common/EmptyState';
import type { Lease, Property } from '../../../../types';
import { formatCurrency, formatDate } from '../../../../lib/format';
import {
  LEASE_DOCUMENT_STATUS_LABELS,
} from '../../../../lib/lease-documents';
import {
  computeLeaseStats,
  defaultLeaseFilters,
  filterLeases,
  getLeaseLifecycleStatus,
  LEASE_LIFECYCLE_LABELS,
  LEASE_PAGE_SIZE,
  LEASE_STATUS_LABELS,
  LEASE_TYPE_LABELS,
  lifecycleStatusVariant,
  leaseStatusVariant,
  resolveLeaseType,
  sortLeases,
  type LeaseFilters,
  type LeaseSortDir,
  type LeaseSortKey,
} from '../../../../lib/lease-utils';
import { LeaseSummaryCards } from './LeaseSummaryCards';
import { LeaseActionsMenu, type LeaseAction } from './LeaseActionsMenu';

interface Props {
  leases: Lease[];
  properties: Property[];
  onAction: (action: LeaseAction, lease: Lease) => void;
  actionLoadingId?: string | null;
}

function SortHeader({
  label,
  sortKey,
  current,
  dir,
  onSort,
}: {
  label: string;
  sortKey: LeaseSortKey;
  current: LeaseSortKey;
  dir: LeaseSortDir;
  onSort: (key: LeaseSortKey) => void;
}) {
  const active = current === sortKey;
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      onClick={() => onSort(sortKey)}
    >
      {label}
      {active ? (
        dir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
      ) : null}
    </button>
  );
}

export function LeaseListView({ leases, properties, onAction, actionLoadingId }: Props) {
  const [filters, setFilters] = useState<LeaseFilters>(defaultLeaseFilters());
  const [sortKey, setSortKey] = useState<LeaseSortKey>('createdAt');
  const [sortDir, setSortDir] = useState<LeaseSortDir>('desc');
  const [page, setPage] = useState(1);

  const stats = useMemo(() => computeLeaseStats(leases), [leases]);

  const filtered = useMemo(() => {
    const result = filterLeases(leases, filters);
    return sortLeases(result, sortKey, sortDir);
  }, [leases, filters, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / LEASE_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (currentPage - 1) * LEASE_PAGE_SIZE,
    currentPage * LEASE_PAGE_SIZE,
  );

  const handleSort = (key: LeaseSortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const updateFilter = (patch: Partial<LeaseFilters>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  };

  return (
    <div className="space-y-3 lg:space-y-4">
      <LeaseSummaryCards stats={stats} />

      <Card className="p-3 lg:p-4 space-y-3">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search tenant, property, unit..."
              value={filters.search}
              onChange={(e) => updateFilter({ search: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            <select
              className="h-9 rounded-md border px-2 text-sm bg-background"
              value={filters.propertyId}
              onChange={(e) => updateFilter({ propertyId: e.target.value })}
            >
              <option value="all">All properties</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <select
              className="h-9 rounded-md border px-2 text-sm bg-background"
              value={filters.status}
              onChange={(e) => updateFilter({ status: e.target.value })}
            >
              <option value="all">All statuses</option>
              {Object.entries(LEASE_STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <select
              className="h-9 rounded-md border px-2 text-sm bg-background"
              value={filters.lifecycle}
              onChange={(e) => updateFilter({ lifecycle: e.target.value })}
            >
              <option value="all">All document stages</option>
              {Object.entries(LEASE_LIFECYCLE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <Input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => updateFilter({ dateFrom: e.target.value })}
              className="text-sm"
            />
            <Input
              type="date"
              value={filters.dateTo}
              onChange={(e) => updateFilter({ dateTo: e.target.value })}
              className="text-sm"
            />
          </div>
        </div>
        {(filters.search || filters.propertyId !== 'all' || filters.status !== 'all' || filters.lifecycle !== 'all' || filters.dateFrom || filters.dateTo) && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{filtered.length} of {leases.length} leases</span>
            <Button variant="ghost" size="sm" onClick={() => { setFilters(defaultLeaseFilters()); setPage(1); }}>
              Clear filters
            </Button>
          </div>
        )}
      </Card>

      <Card padding={false} className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-3 py-3">
                  <SortHeader label="Tenant" sortKey="tenantName" current={sortKey} dir={sortDir} onSort={handleSort} />
                </th>
                <th className="text-left px-3 py-3 text-sm text-muted-foreground">Status</th>
                <th className="text-left px-3 py-3 text-sm text-muted-foreground">Type</th>
                <th className="text-left px-3 py-3">
                  <SortHeader label="Property" sortKey="propertyName" current={sortKey} dir={sortDir} onSort={handleSort} />
                </th>
                <th className="text-left px-3 py-3">
                  <SortHeader label="Start" sortKey="startDate" current={sortKey} dir={sortDir} onSort={handleSort} />
                </th>
                <th className="text-left px-3 py-3">
                  <SortHeader label="End" sortKey="endDate" current={sortKey} dir={sortDir} onSort={handleSort} />
                </th>
                <th className="text-left px-3 py-3">
                  <SortHeader label="Rent" sortKey="rent" current={sortKey} dir={sortDir} onSort={handleSort} />
                </th>
                <th className="text-left px-3 py-3 text-sm text-muted-foreground">Deposit</th>
                <th className="text-left px-3 py-3 text-sm text-muted-foreground">Document</th>
                <th className="text-left px-3 py-3 text-sm text-muted-foreground w-12">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paginated.map((lease) => {
                const lifecycle = getLeaseLifecycleStatus(lease);
                return (
                  <tr key={lease.id} className="hover:bg-accent/50">
                    <td className="px-3 py-3">
                      <p className="font-medium text-sm">{lease.tenantName}</p>
                      <p className="text-xs text-muted-foreground">{lease.unitLabel}</p>
                    </td>
                    <td className="px-3 py-3">
                      <Badge variant={leaseStatusVariant(lease.status)}>
                        {LEASE_STATUS_LABELS[lease.status]}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 text-sm">{LEASE_TYPE_LABELS[resolveLeaseType(lease)]}</td>
                    <td className="px-3 py-3 text-sm">{lease.propertyName}</td>
                    <td className="px-3 py-3 text-sm whitespace-nowrap">{formatDate(lease.startDate)}</td>
                    <td className="px-3 py-3 text-sm whitespace-nowrap">{formatDate(lease.endDate)}</td>
                    <td className="px-3 py-3 text-sm font-medium">{formatCurrency(lease.rent)}</td>
                    <td className="px-3 py-3 text-sm">{formatCurrency(lease.deposit)}</td>
                    <td className="px-3 py-3">
                      <div className="flex flex-col gap-1">
                        <Badge variant={lifecycleStatusVariant(lifecycle)} className="text-xs">
                          {LEASE_LIFECYCLE_LABELS[lifecycle]}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {LEASE_DOCUMENT_STATUS_LABELS[lease.documentStatus] ?? lease.documentStatus}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <LeaseActionsMenu
                        lease={lease}
                        onAction={onAction}
                        loading={actionLoadingId === lease.id}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <EmptyState
            title="No leases found"
            description="Try adjusting your filters or create a new lease."
          />
        )}

        {filtered.length > 0 && (
          <div className="flex items-center justify-between px-3 py-3 border-t text-sm">
            <span className="text-muted-foreground">
              Page {currentPage} of {totalPages} ({filtered.length} leases)
            </span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
