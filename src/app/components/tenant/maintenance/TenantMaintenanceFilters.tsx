import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { FormSelect } from '../../ui/form-select';
import {
  MAINTENANCE_CATEGORIES,
  maintenanceStatusLabel,
  TENANT_PROGRESS_STAGES,
} from '../../../../lib/maintenance-labels';
import type { TenantMaintenanceFilterState } from '../../../../lib/maintenance-utils';

interface Props {
  filters: TenantMaintenanceFilterState;
  onChange: (filters: TenantMaintenanceFilterState) => void;
  resultCount: number;
  showAdvanced: boolean;
  onToggleAdvanced: () => void;
}

export function TenantMaintenanceFilters({
  filters,
  onChange,
  resultCount,
  showAdvanced,
  onToggleAdvanced,
}: Props) {
  const set = (patch: Partial<TenantMaintenanceFilterState>) =>
    onChange({ ...filters, ...patch });

  const hasActiveFilters =
    filters.status !== 'all' ||
    filters.priority !== 'all' ||
    filters.category !== 'all' ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.search;

  const clearFilters = () =>
    onChange({
      ...filters,
      search: '',
      status: 'all',
      priority: 'all',
      category: 'all',
      dateFrom: '',
      dateTo: '',
    });

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search requests..."
            value={filters.search}
            onChange={(e) => set({ search: e.target.value })}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <FormSelect
            label=""
            fieldKey="sortBy"
            value={filters.sortBy}
            onChange={(e) => set({ sortBy: e.target.value as TenantMaintenanceFilterState['sortBy'] })}
            className="w-36"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="priority">Priority</option>
            <option value="updated">Recently updated</option>
            <option value="scheduled">Scheduled date</option>
          </FormSelect>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onToggleAdvanced}
            className="shrink-0"
          >
            <SlidersHorizontal className="w-4 h-4 mr-1.5" />
            Filters
          </Button>
        </div>
      </div>

      {showAdvanced && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 rounded-xl border bg-muted/30">
          <FormSelect
            label="Status"
            fieldKey="status"
            value={filters.status}
            onChange={(e) => set({ status: e.target.value })}
          >
            <option value="all">All statuses</option>
            {TENANT_PROGRESS_STAGES.map((s) => (
              <option key={s.key} value={s.key}>
                {maintenanceStatusLabel(s.key)}
              </option>
            ))}
          </FormSelect>
          <FormSelect
            label="Priority"
            fieldKey="priority"
            value={filters.priority}
            onChange={(e) => set({ priority: e.target.value })}
          >
            <option value="all">All priorities</option>
            <option value="emergency">Emergency</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </FormSelect>
          <FormSelect
            label="Category"
            fieldKey="category"
            value={filters.category}
            onChange={(e) => set({ category: e.target.value })}
          >
            <option value="all">All categories</option>
            {MAINTENANCE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </FormSelect>
          <div className="col-span-2 sm:col-span-4 grid grid-cols-2 gap-2">
            <Input
              label="From date"
              type="date"
              fieldKey="dateFrom"
              value={filters.dateFrom}
              onChange={(e) => set({ dateFrom: e.target.value })}
            />
            <Input
              label="To date"
              type="date"
              fieldKey="dateTo"
              value={filters.dateTo}
              onChange={(e) => set({ dateTo: e.target.value })}
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {resultCount} request{resultCount !== 1 ? 's' : ''}
        </span>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <X className="w-3 h-3" />
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
