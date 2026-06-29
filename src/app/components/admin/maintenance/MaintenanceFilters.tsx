import { Search, Filter, X } from 'lucide-react';
import { Card } from '../../ui/card';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { MAINTENANCE_CATEGORIES } from '../../../../lib/maintenance-labels';
import type { MaintenanceFilterState } from '../../../../lib/maintenance-utils';
import { DEFAULT_MAINTENANCE_FILTERS } from '../../../../lib/maintenance-utils';
import type { Property, Technician, Tenant, Unit } from '../../../../types';
import { MAINTENANCE_WORKFLOW, maintenanceStatusLabel } from '../../../../lib/maintenance-labels';

interface Props {
  filters: MaintenanceFilterState;
  onChange: (filters: MaintenanceFilterState) => void;
  properties: Property[];
  units: Unit[];
  tenants: Tenant[];
  technicians: Technician[];
  resultCount: number;
  showAdvanced: boolean;
  onToggleAdvanced: () => void;
}

export function MaintenanceFilters({
  filters,
  onChange,
  properties,
  units,
  tenants,
  technicians,
  resultCount,
  showAdvanced,
  onToggleAdvanced,
}: Props) {
  const set = (patch: Partial<MaintenanceFilterState>) => onChange({ ...filters, ...patch });

  const filteredUnits =
    filters.propertyId === 'all'
      ? units
      : units.filter((u) => u.propertyId === filters.propertyId);

  const activeFilterCount = Object.entries(filters).filter(([key, val]) => {
    const def = DEFAULT_MAINTENANCE_FILTERS[key as keyof MaintenanceFilterState];
    return val !== def && val !== '' && val !== false;
  }).length;

  return (
    <Card className="p-3 lg:p-4 space-y-3">
      <div className="flex flex-col lg:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search work orders, tenants, properties..."
            value={filters.search}
            onChange={(e) => set({ search: e.target.value })}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            className="h-9 rounded-md border bg-background px-3 text-sm min-w-[120px]"
            value={filters.status}
            onChange={(e) => set({ status: e.target.value })}
          >
            <option value="all">All Status</option>
            {MAINTENANCE_WORKFLOW.map((s) => (
              <option key={s} value={s}>
                {maintenanceStatusLabel(s)}
              </option>
            ))}
          </select>
          <select
            className="h-9 rounded-md border bg-background px-3 text-sm"
            value={filters.priority}
            onChange={(e) => set({ priority: e.target.value })}
          >
            <option value="all">All Priority</option>
            <option value="emergency">Emergency</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select
            className="h-9 rounded-md border bg-background px-3 text-sm min-w-[130px]"
            value={filters.propertyId}
            onChange={(e) => set({ propertyId: e.target.value, unitId: 'all' })}
          >
            <option value="all">All Properties</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <Button variant="outline" size="sm" onClick={onToggleAdvanced}>
            <Filter className="w-4 h-4 mr-1" />
            Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
          </Button>
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onChange(DEFAULT_MAINTENANCE_FILTERS)}
            >
              <X className="w-4 h-4 mr-1" />Clear
            </Button>
          )}
        </div>
      </div>

      {showAdvanced && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-2 pt-2 border-t">
          <select
            className="h-9 rounded-md border bg-background px-3 text-sm"
            value={filters.unitId}
            onChange={(e) => set({ unitId: e.target.value })}
          >
            <option value="all">All Units</option>
            {filteredUnits.map((u) => (
              <option key={u.id} value={u.id}>
                {u.unitNumber}
              </option>
            ))}
          </select>
          <select
            className="h-9 rounded-md border bg-background px-3 text-sm"
            value={filters.tenantId}
            onChange={(e) => set({ tenantId: e.target.value })}
          >
            <option value="all">All Tenants</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <select
            className="h-9 rounded-md border bg-background px-3 text-sm"
            value={filters.technicianId}
            onChange={(e) => set({ technicianId: e.target.value })}
          >
            <option value="all">All Technicians</option>
            <option value="unassigned">Unassigned</option>
            {technicians.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <select
            className="h-9 rounded-md border bg-background px-3 text-sm"
            value={filters.category}
            onChange={(e) => set({ category: e.target.value })}
          >
            <option value="all">All Categories</option>
            {MAINTENANCE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <Input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => set({ dateFrom: e.target.value })}
            placeholder="From"
          />
          <Input
            type="date"
            value={filters.dateTo}
            onChange={(e) => set({ dateTo: e.target.value })}
            placeholder="To"
          />
          <Input
            type="number"
            placeholder="Min cost"
            value={filters.costMin}
            onChange={(e) => set({ costMin: e.target.value })}
          />
          <Input
            type="number"
            placeholder="Max cost"
            value={filters.costMax}
            onChange={(e) => set({ costMax: e.target.value })}
          />
          <label className="flex items-center gap-2 text-sm px-2">
            <input
              type="checkbox"
              checked={filters.recentlyUpdated}
              onChange={(e) => set({ recentlyUpdated: e.target.checked })}
            />
            Recently updated
          </label>
        </div>
      )}

      <p className="text-xs text-muted-foreground">{resultCount} work order(s)</p>
    </Card>
  );
}
