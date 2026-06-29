import { useEffect, useMemo, useState } from 'react';
import { ClipboardList, History, Plus, Wrench } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { EmptyState } from '../common/EmptyState';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Sheet, SheetContent } from '../ui/sheet';
import { TenantPageHeader } from './shared/TenantPageHeader';
import { TenantStatCard } from './shared/TenantStatCard';
import { TenantPageSkeleton } from './shared/TenantPageSkeleton';
import { TenantMaintenanceRequestCard } from './maintenance/TenantMaintenanceRequestCard';
import { TenantMaintenanceFilters } from './maintenance/TenantMaintenanceFilters';
import { TenantMaintenanceDetail } from './maintenance/TenantMaintenanceDetail';
import { TenantMaintenanceHistory } from './maintenance/TenantMaintenanceHistory';
import { TenantNewRequestDialog } from './maintenance/TenantNewRequestDialog';
import {
  subscribeMaintenanceByTenant,
  listMaintenanceUpdates,
} from '../../../services/maintenance.service';
import type { MaintenanceRequest, MaintenanceUpdate } from '../../../types';
import {
  DEFAULT_TENANT_MAINTENANCE_FILTERS,
  filterTenantMaintenanceRequests,
  sortTenantMaintenanceRequests,
} from '../../../lib/maintenance-utils';
import { isCompletedMaintenanceStatus, isOpenMaintenanceStatus } from '../../../lib/maintenance-labels';

export const TenantMaintenance = () => {
  const { tenant } = useAuth();
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<MaintenanceRequest | null>(null);
  const [updates, setUpdates] = useState<MaintenanceUpdate[]>([]);
  const [updatesLoading, setUpdatesLoading] = useState(false);
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_TENANT_MAINTENANCE_FILTERS);
  const [activeTab, setActiveTab] = useState('active');

  useEffect(() => {
    if (!tenant) {
      setLoading(false);
      return;
    }
    const unsub = subscribeMaintenanceByTenant(
      tenant.id,
      (reqs) => {
        setRequests(reqs);
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, [tenant]);

  useEffect(() => {
    if (!selected) {
      setUpdates([]);
      return;
    }
    const updated = requests.find((r) => r.id === selected.id);
    if (updated) setSelected(updated);

    setUpdatesLoading(true);
    listMaintenanceUpdates(selected.id)
      .then(setUpdates)
      .catch(() => setUpdates([]))
      .finally(() => setUpdatesLoading(false));
  }, [selected?.id, requests]);

  const activeRequests = useMemo(
    () => requests.filter((r) => isOpenMaintenanceStatus(r.status)),
    [requests],
  );

  const filteredActive = useMemo(() => {
    const filtered = filterTenantMaintenanceRequests(activeRequests, filters);
    return sortTenantMaintenanceRequests(filtered, filters.sortBy);
  }, [activeRequests, filters]);

  const openCount = activeRequests.length;
  const completedCount = requests.filter((r) => isCompletedMaintenanceStatus(r.status)).length;

  const handleSelect = (request: MaintenanceRequest) => {
    setSelected(request);
    if (window.innerWidth < 1024) setMobileDetailOpen(true);
  };

  const refreshUpdates = () => {
    if (!selected) return;
    listMaintenanceUpdates(selected.id).then(setUpdates);
  };

  if (loading) return <TenantPageSkeleton />;
  if (!tenant) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground">No tenant profile linked.</p>
      </Card>
    );
  }

  const tenantName = tenant.name;

  return (
    <div className="space-y-5">
      <TenantPageHeader
        title="Maintenance"
        description="Submit requests, track repairs, and view history"
        actions={
          <Button variant="primary" onClick={() => setShowNewRequest(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Request
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <TenantStatCard
          label="Active requests"
          value={String(openCount)}
          icon={Wrench}
          variant={openCount > 0 ? 'warning' : 'default'}
        />
        <TenantStatCard
          label="Completed"
          value={String(completedCount)}
          icon={ClipboardList}
          variant="success"
        />
        <TenantStatCard
          label="Total requests"
          value={String(requests.length)}
          icon={History}
          variant="primary"
          className="col-span-2 sm:col-span-1"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="active" className="gap-1.5">
            <Wrench className="w-4 h-4" />
            Active
            {openCount > 0 && (
              <span className="ml-1 rounded-full bg-primary/20 text-primary text-xs px-1.5 py-0.5 font-medium">
                {openCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5">
            <History className="w-4 h-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4 space-y-4">
          <TenantMaintenanceFilters
            filters={filters}
            onChange={setFilters}
            resultCount={filteredActive.length}
            showAdvanced={showAdvancedFilters}
            onToggleAdvanced={() => setShowAdvancedFilters((v) => !v)}
          />

          <div className="grid lg:grid-cols-5 gap-4 min-h-[480px]">
            <div className="lg:col-span-2 space-y-2 max-h-[calc(100vh-16rem)] overflow-y-auto pr-0.5">
              {filteredActive.length === 0 ? (
                <Card className="p-0 overflow-hidden">
                  <EmptyState
                    icon={Wrench}
                    title={activeRequests.length === 0 ? 'No active requests' : 'No matching requests'}
                    description={
                      activeRequests.length === 0
                        ? 'Submit a maintenance request when something needs attention in your unit.'
                        : 'Try adjusting your search or filters.'
                    }
                    actionLabel={activeRequests.length === 0 ? 'New Request' : undefined}
                    onAction={
                      activeRequests.length === 0 ? () => setShowNewRequest(true) : undefined
                    }
                  />
                </Card>
              ) : (
                filteredActive.map((request) => (
                  <TenantMaintenanceRequestCard
                    key={request.id}
                    request={request}
                    selected={selected?.id === request.id}
                    onSelect={() => handleSelect(request)}
                  />
                ))
              )}
            </div>

            <div className="hidden lg:block lg:col-span-3">
              {selected ? (
                <TenantMaintenanceDetail
                  request={selected}
                  updates={updates}
                  updatesLoading={updatesLoading}
                  tenantName={tenantName}
                  onRefreshUpdates={refreshUpdates}
                />
              ) : (
                <Card className="h-full flex items-center justify-center p-8 text-center text-muted-foreground min-h-[480px]">
                  <div>
                    <Wrench className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium text-foreground mb-1">Select a request</p>
                    <p className="text-sm">
                      Choose a request to view progress, timeline, and messages
                    </p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <div className="grid lg:grid-cols-5 gap-4">
            <div className={selected && activeTab === 'history' ? 'lg:col-span-2' : 'lg:col-span-5'}>
              <TenantMaintenanceHistory
                requests={requests}
                onSelectRequest={(request) => {
                  setSelected(request);
                  if (window.innerWidth < 1024) setMobileDetailOpen(true);
                }}
              />
            </div>
            {selected && activeTab === 'history' && (
              <div className="hidden lg:block lg:col-span-3">
                <TenantMaintenanceDetail
                  request={selected}
                  updates={updates}
                  updatesLoading={updatesLoading}
                  tenantName={tenantName}
                  onRefreshUpdates={refreshUpdates}
                />
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Sheet open={mobileDetailOpen} onOpenChange={setMobileDetailOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg p-0 overflow-hidden">
          {selected && (
            <TenantMaintenanceDetail
              request={selected}
              updates={updates}
              updatesLoading={updatesLoading}
              tenantName={tenantName}
              onRefreshUpdates={refreshUpdates}
            />
          )}
        </SheetContent>
      </Sheet>

      <TenantNewRequestDialog
        open={showNewRequest}
        onOpenChange={setShowNewRequest}
        tenant={tenant}
      />
    </div>
  );
};
