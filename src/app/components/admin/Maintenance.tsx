import { useEffect, useMemo, useState } from 'react';
import { BarChart3, Calendar, ClipboardList, FileBarChart, Users, Wrench } from 'lucide-react';
import { PageLoader } from '../common/LoadingSpinner';
import { Card } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { MaintenanceDashboard } from './maintenance/MaintenanceDashboard';
import { MaintenanceFilters } from './maintenance/MaintenanceFilters';
import { MaintenanceRequestCard } from './maintenance/MaintenanceRequestCard';
import { MaintenanceDetailPanel } from './maintenance/MaintenanceDetailPanel';
import { TechnicianManagement } from './maintenance/TechnicianManagement';
import { MaintenanceSchedule } from './maintenance/MaintenanceSchedule';
import { MaintenanceReports } from './maintenance/MaintenanceReports';
import {
  subscribeMaintenanceRequests,
  listTechnicians,
  listMaintenanceUpdates,
  listMaintenanceByProperty,
  getScheduledMaintenance,
} from '../../../services/maintenance.service';
import { getMaintenanceDashboardStats } from '../../../services/maintenance-analytics.service';
import { listProperties } from '../../../services/properties.service';
import { listTenants } from '../../../services/tenants.service';
import { listAllUnits } from '../../../services/units.service';
import { useAuth } from '../../contexts/AuthContext';
import type { MaintenanceDashboardStats, MaintenanceRequest, MaintenanceUpdate } from '../../../types';
import {
  DEFAULT_MAINTENANCE_FILTERS,
  filterMaintenanceRequests,
  type MaintenanceFilterState,
} from '../../../lib/maintenance-utils';

export const Maintenance = () => {
  const { profile } = useAuth();
  const authorName = profile ? `${profile.firstName} ${profile.lastName}`.trim() || 'Admin' : 'Admin';

  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [technicians, setTechnicians] = useState<Awaited<ReturnType<typeof listTechnicians>>>([]);
  const [properties, setProperties] = useState<Awaited<ReturnType<typeof listProperties>>>([]);
  const [tenants, setTenants] = useState<Awaited<ReturnType<typeof listTenants>>>([]);
  const [units, setUnits] = useState<Awaited<ReturnType<typeof listAllUnits>>>([]);
  const [dashboardStats, setDashboardStats] = useState<MaintenanceDashboardStats | null>(null);
  const [scheduled, setScheduled] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<MaintenanceFilterState>(DEFAULT_MAINTENANCE_FILTERS);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showFullDashboard, setShowFullDashboard] = useState(false);
  const [selected, setSelected] = useState<MaintenanceRequest | null>(null);
  const [updates, setUpdates] = useState<MaintenanceUpdate[]>([]);
  const [propertyHistory, setPropertyHistory] = useState<MaintenanceRequest[]>([]);

  const refreshMeta = async () => {
    const [techs, props, tnts, unts, stats, sched] = await Promise.all([
      listTechnicians(),
      listProperties(),
      listTenants(),
      listAllUnits(),
      getMaintenanceDashboardStats(),
      getScheduledMaintenance(),
    ]);
    setTechnicians(techs.filter((t) => t.active !== false));
    setProperties(props);
    setTenants(tnts);
    setUnits(unts);
    setDashboardStats(stats);
    setScheduled(sched);
  };

  useEffect(() => {
    const unsub = subscribeMaintenanceRequests((reqs) => {
      setRequests(reqs);
      setLoading(false);
    });
    refreshMeta().finally(() => setLoading(false));
    return unsub;
  }, []);

  useEffect(() => {
    if (!selected) return;
    listMaintenanceUpdates(selected.id).then(setUpdates);
    listMaintenanceByProperty(selected.propertyId).then(setPropertyHistory);
    const updated = requests.find((r) => r.id === selected.id);
    if (updated) setSelected(updated);
  }, [selected?.id, requests]);

  const filtered = useMemo(
    () => filterMaintenanceRequests(requests, filters),
    [requests, filters],
  );

  const refreshUpdates = () => {
    if (selected) listMaintenanceUpdates(selected.id).then(setUpdates);
    refreshMeta();
  };

  if (loading && !dashboardStats) return <PageLoader />;

  return (
    <div className="space-y-4 h-full">
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold text-foreground">Maintenance CMMS</h1>
          <p className="text-sm text-muted-foreground">
            Work order management — from request to completion
          </p>
        </div>
      </div>

      <Tabs defaultValue="workorders" className="space-y-4">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="workorders" className="gap-1.5">
            <ClipboardList className="w-4 h-4" />Work Orders
          </TabsTrigger>
          <TabsTrigger value="technicians" className="gap-1.5">
            <Users className="w-4 h-4" />Technicians
          </TabsTrigger>
          <TabsTrigger value="schedule" className="gap-1.5">
            <Calendar className="w-4 h-4" />Schedule
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1.5">
            <BarChart3 className="w-4 h-4" />Analytics
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-1.5">
            <FileBarChart className="w-4 h-4" />Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="workorders" className="space-y-4 mt-0">
          {dashboardStats && <MaintenanceDashboard stats={dashboardStats} compact />}

          <MaintenanceFilters
            filters={filters}
            onChange={setFilters}
            properties={properties}
            units={units}
            tenants={tenants}
            technicians={technicians}
            resultCount={filtered.length}
            showAdvanced={showAdvancedFilters}
            onToggleAdvanced={() => setShowAdvancedFilters((v) => !v)}
          />

          <div className="grid lg:grid-cols-5 gap-4 min-h-[520px]">
            <div className="lg:col-span-2 flex flex-col gap-2 max-h-[calc(100vh-14rem)] overflow-y-auto pr-1">
              {filtered.length === 0 ? (
                <Card className="p-8 text-center text-muted-foreground">
                  <Wrench className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  No work orders match your filters
                </Card>
              ) : (
                filtered.map((request) => (
                  <MaintenanceRequestCard
                    key={request.id}
                    request={request}
                    selected={selected?.id === request.id}
                    onSelect={() => setSelected(request)}
                  />
                ))
              )}
            </div>

            <div className="lg:col-span-3 lg:sticky lg:top-4 lg:self-start">
              {selected ? (
                <MaintenanceDetailPanel
                  request={selected}
                  updates={updates}
                  technicians={technicians}
                  authorName={authorName}
                  onClose={() => setSelected(null)}
                  onRefreshUpdates={refreshUpdates}
                  propertyHistory={propertyHistory}
                />
              ) : (
                <Card className="flex flex-col items-center justify-center py-16 px-6 text-center text-muted-foreground min-h-[400px]">
                  <Wrench className="w-12 h-12 mb-3 opacity-30" />
                  <p className="font-medium text-foreground">Select a work order</p>
                  <p className="text-sm mt-1 max-w-sm">
                    Choose a request from the list to view details, assign technicians, schedule repairs, and track costs.
                  </p>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="technicians" className="mt-0">
          <TechnicianManagement
            technicians={technicians}
            properties={properties}
            requests={requests}
            onRefresh={refreshMeta}
          />
        </TabsContent>

        <TabsContent value="schedule" className="mt-0">
          <MaintenanceSchedule scheduled={scheduled} />
        </TabsContent>

        <TabsContent value="analytics" className="mt-0">
          {dashboardStats ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Maintenance Analytics</h2>
                <button
                  type="button"
                  className="text-sm text-primary hover:underline"
                  onClick={() => setShowFullDashboard((v) => !v)}
                >
                  {showFullDashboard ? 'Show compact view' : 'Show all charts'}
                </button>
              </div>
              <MaintenanceDashboard stats={dashboardStats} compact={!showFullDashboard} />
            </div>
          ) : (
            <PageLoader />
          )}
        </TabsContent>

        <TabsContent value="reports" className="mt-0">
          <MaintenanceReports properties={properties} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
