import { useEffect, useState } from 'react';

import { toast } from 'sonner';

import { Card } from '../ui/card';

import { Button } from '../ui/button';

import { Download, FileSpreadsheet, FileText, BarChart3 } from 'lucide-react';

import {

  LineChart,

  Line,

  BarChart,

  Bar,

  PieChart,

  Pie,

  Cell,

  XAxis,

  YAxis,

  CartesianGrid,

  Tooltip,

  ResponsiveContainer,

  Legend,

} from 'recharts';

import { PageLoader } from '../common/LoadingSpinner';

import {

  getReportKpis,

  getMonthlyReportData,

  getPropertyPerformance,

  getMaintenanceByCategory,

  getMaintenanceStatusBreakdown,

  getPortfolioReportData,

  getRevenueReport,

  getOccupancyReport,

  getLeaseStatusReport,

  getPaymentHistoryReport,

  getOutstandingBalancesReport,

  getMaintenanceReport,

  getTenantReport,

} from '../../../services/analytics.service';

import {

  exportReportToCsv,

  exportReportToExcel,

  exportReportToPdf,

  exportPortfolioSummaryPdf,

  type ReportExportPayload,

  type ReportType,

} from '../../../services/report-export.service';

import type {

  LeaseReportRow,

  MaintenanceCategoryStat,

  MaintenanceReportRow,

  MonthlyChartPoint,

  OccupancyReportRow,

  OutstandingBalanceRow,

  PaymentHistoryRow,

  PropertyPerformance,

  ReportKpis,

  RevenueReportRow,

  TenantReportRow,

} from '../../../types';

import { formatCurrency } from '../../../lib/format';

import {

  Select,

  SelectContent,

  SelectItem,

  SelectTrigger,

  SelectValue,

} from '../ui/select';



type TabId = ReportType | 'summary';



const TABS: { id: TabId; label: string }[] = [

  { id: 'summary', label: 'Overview' },

  { id: 'revenue', label: 'Revenue' },

  { id: 'occupancy', label: 'Occupancy' },

  { id: 'leases', label: 'Leases' },

  { id: 'payments', label: 'Payments' },

  { id: 'outstanding', label: 'Outstanding' },

  { id: 'maintenance', label: 'Maintenance' },

  { id: 'tenants', label: 'Tenants' },

];



export const Reports = () => {

  const [activeTab, setActiveTab] = useState<TabId>('summary');

  const [loading, setLoading] = useState(true);

  const [exporting, setExporting] = useState(false);

  const [kpis, setKpis] = useState<ReportKpis | null>(null);

  const [monthlyData, setMonthlyData] = useState<MonthlyChartPoint[]>([]);

  const [propertyPerformance, setPropertyPerformance] = useState<PropertyPerformance[]>([]);

  const [maintenanceByCategory, setMaintenanceByCategory] = useState<MaintenanceCategoryStat[]>([]);

  const [maintenanceByStatus, setMaintenanceByStatus] = useState<MaintenanceCategoryStat[]>([]);

  const [revenueReport, setRevenueReport] = useState<RevenueReportRow[]>([]);

  const [occupancyReport, setOccupancyReport] = useState<OccupancyReportRow[]>([]);

  const [leaseReport, setLeaseReport] = useState<LeaseReportRow[]>([]);

  const [paymentReport, setPaymentReport] = useState<PaymentHistoryRow[]>([]);

  const [outstandingReport, setOutstandingReport] = useState<OutstandingBalanceRow[]>([]);

  const [maintenanceReport, setMaintenanceReport] = useState<MaintenanceReportRow[]>([]);

  const [tenantReport, setTenantReport] = useState<TenantReportRow[]>([]);



  useEffect(() => {

    Promise.all([

      getReportKpis(),

      getMonthlyReportData(),

      getPropertyPerformance(),

      getMaintenanceByCategory(),

      getMaintenanceStatusBreakdown(),

      getRevenueReport(),

      getOccupancyReport(),

      getLeaseStatusReport(),

      getPaymentHistoryReport(),

      getOutstandingBalancesReport(),

      getMaintenanceReport(),

      getTenantReport(),

    ]).then(([

      k, m, p, c, ms, rev, occ, leases, payments, outstanding, maint, tenants,

    ]) => {

      setKpis(k);

      setMonthlyData(m);

      setPropertyPerformance(p);

      setMaintenanceByCategory(c.length ? c : [{ name: 'General', value: 0, color: '#6b7280' }]);

      setMaintenanceByStatus(ms.length ? ms : [{ name: 'None', value: 0, color: '#6b7280' }]);

      setRevenueReport(rev);

      setOccupancyReport(occ);

      setLeaseReport(leases);

      setPaymentReport(payments);

      setOutstandingReport(outstanding);

      setMaintenanceReport(maint);

      setTenantReport(tenants);

      setLoading(false);

    });

  }, []);



  const buildPayload = (tab: TabId): ReportExportPayload => {

    const generatedAt = new Date().toLocaleString();

    const kpiItems = kpis

      ? [

          { label: 'Total Revenue', value: formatCurrency(kpis.totalRevenue) },

          { label: 'Collected This Month', value: formatCurrency(kpis.collectedThisMonth) },

          { label: 'Outstanding Balance', value: formatCurrency(kpis.outstandingBalance) },

          { label: 'Occupancy Rate', value: `${kpis.occupancyRate}%` },

          { label: 'Active Leases', value: String(kpis.activeLeases) },

          { label: 'Open Maintenance', value: String(kpis.openMaintenance) },

        ]

      : undefined;



    switch (tab) {

      case 'revenue':

        return {

          title: 'Revenue & Income Report',

          generatedAt,

          kpis: kpiItems,

          headers: ['Month', 'Invoiced', 'Collected', 'Outstanding', 'Overdue'],

          rows: revenueReport.map((r) => [r.month, r.invoiced, r.collected, r.outstanding, r.overdue]),

        };

      case 'occupancy':

        return {

          title: 'Occupancy Report',

          generatedAt,

          kpis: kpiItems,

          headers: ['Property', 'Total Units', 'Occupied', 'Vacant', 'Occupancy %'],

          rows: occupancyReport.map((r) => [r.property, r.totalUnits, r.occupied, r.vacant, `${r.occupancyRate}%`]),

        };

      case 'leases':

        return {

          title: 'Lease Status Report',

          generatedAt,

          headers: ['Tenant', 'Property', 'Unit', 'Start', 'End', 'Rent', 'Status'],

          rows: leaseReport.map((r) => [r.tenant, r.property, r.unit, r.startDate, r.endDate, r.rent, r.status]),

        };

      case 'payments':

        return {

          title: 'Payment History Report',

          generatedAt,

          headers: ['Date', 'Tenant', 'Invoice', 'Amount', 'Method', 'Status'],

          rows: paymentReport.map((r) => [r.date, r.tenant, r.invoiceNumber, r.amount, r.method, r.status]),

        };

      case 'outstanding':

        return {

          title: 'Outstanding Balances Report',

          generatedAt,

          kpis: kpiItems?.filter((k) => k.label.includes('Outstanding')),

          headers: ['Tenant', 'Property', 'Unit', 'Invoice', 'Amount', 'Late Fee', 'Total Due', 'Due Date', 'Days Overdue'],

          rows: outstandingReport.map((r) => [

            r.tenant, r.property, r.unit, r.invoiceNumber, r.amount, r.lateFee, r.totalDue, r.dueDate, r.daysOverdue,

          ]),

        };

      case 'maintenance':

        return {

          title: 'Maintenance Report',

          generatedAt,

          headers: ['Issue', 'Property', 'Unit', 'Category', 'Priority', 'Status', 'Assigned To', 'Submitted', 'Completed', 'Cost'],

          rows: maintenanceReport.map((r) => [

            r.issue, r.property, r.unit, r.category, r.priority, r.status, r.assignedTo, r.submitted, r.completedDate, r.actualCost,

          ]),

        };

      case 'tenants':

        return {

          title: 'Tenant Report',

          generatedAt,

          headers: ['Name', 'Email', 'Property', 'Unit', 'Rent', 'Status', 'Payment Status'],

          rows: tenantReport.map((r) => [r.name, r.email, r.property, r.unit, r.rent, r.status, r.paymentStatus]),

        };

      default:

        return {

          title: 'Portfolio Summary Report',

          generatedAt,

          kpis: kpiItems,

          headers: ['Property', 'Revenue', 'Occupancy %'],

          rows: propertyPerformance.map((p) => [p.name, p.revenue, `${p.occupancy}%`]),

          summary: 'This report summarizes portfolio performance including revenue trends, occupancy, and maintenance activity.',

        };

    }

  };



  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {

    const reportType: ReportType = activeTab === 'summary' ? 'summary' : activeTab;

    setExporting(true);

    try {

      if (format === 'pdf' && activeTab === 'summary') {

        const data = await getPortfolioReportData();

        await exportPortfolioSummaryPdf(data);

      } else if (format === 'pdf') {

        await exportReportToPdf(buildPayload(activeTab), reportType);

      } else if (format === 'excel') {

        exportReportToExcel(buildPayload(activeTab), reportType);

      } else {

        exportReportToCsv(buildPayload(activeTab), reportType);

      }

      toast.success(`Report exported as ${format.toUpperCase()}`);

    } catch {

      toast.error('Export failed');

    } finally {

      setExporting(false);

    }

  };



  if (loading || !kpis) return <PageLoader />;



  return (

    <div className="space-y-4 lg:space-y-6">

      <div className="flex flex-col sm:flex-row justify-between gap-4">

        <div>

          <h1 className="text-2xl lg:text-3xl font-semibold text-foreground mb-1">Reports & Analytics</h1>

          <p className="text-sm text-muted-foreground">Business insights with PDF, Excel, and CSV export</p>

        </div>

        <div className="flex gap-2 flex-wrap">

          <Button variant="outline" loading={exporting} onClick={() => handleExport('csv')}>

            <Download className="w-4 h-4 mr-2" />CSV

          </Button>

          <Button variant="outline" loading={exporting} onClick={() => handleExport('excel')}>

            <FileSpreadsheet className="w-4 h-4 mr-2" />Excel

          </Button>

          <Button variant="primary" loading={exporting} onClick={() => handleExport('pdf')}>

            <FileText className="w-4 h-4 mr-2" />PDF

          </Button>

        </div>

      </div>



      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">

        {[

          { label: 'Total Revenue', value: formatCurrency(kpis.totalRevenue) },

          { label: 'This Month', value: formatCurrency(kpis.collectedThisMonth) },

          { label: 'Outstanding', value: formatCurrency(kpis.outstandingBalance) },

          { label: 'Overdue', value: String(kpis.overdueCount) },

          { label: 'Occupancy', value: `${kpis.occupancyRate}%` },

          { label: 'Active Leases', value: String(kpis.activeLeases) },

          { label: 'Open Maint.', value: String(kpis.openMaintenance) },

          { label: 'Tenants', value: String(kpis.totalTenants) },

        ].map((kpi) => (

          <Card key={kpi.label}>

            <p className="text-xs text-muted-foreground">{kpi.label}</p>

            <p className="text-lg font-semibold">{kpi.value}</p>

          </Card>

        ))}

      </div>



      <div className="flex flex-col sm:flex-row sm:items-end gap-3">

        <div className="flex-1 max-w-xs">

          <label htmlFor="report-type" className="text-xs text-muted-foreground mb-1.5 block">

            Report type

          </label>

          <Select value={activeTab} onValueChange={(v) => setActiveTab(v as TabId)}>

            <SelectTrigger id="report-type" className="w-full">

              <SelectValue placeholder="Select report" />

            </SelectTrigger>

            <SelectContent>

              {TABS.map((tab) => (

                <SelectItem key={tab.id} value={tab.id}>

                  {tab.label}

                </SelectItem>

              ))}

            </SelectContent>

          </Select>

        </div>

      </div>



      {activeTab === 'summary' && (

        <>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            <Card>

              <h3 className="font-semibold mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4" />Revenue vs Expenses</h3>

              <ResponsiveContainer width="100%" height={280}>

                <LineChart data={monthlyData}>

                  <CartesianGrid strokeDasharray="3 3" />

                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />

                  <YAxis tick={{ fontSize: 11 }} />

                  <Tooltip formatter={(v: number) => formatCurrency(v)} />

                  <Legend />

                  <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#6C4CF1" strokeWidth={2} />

                  <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#94a3b8" strokeWidth={2} />

                </LineChart>

              </ResponsiveContainer>

            </Card>

            <Card>

              <h3 className="font-semibold mb-4">Occupancy Trend</h3>

              <ResponsiveContainer width="100%" height={280}>

                <BarChart data={monthlyData}>

                  <CartesianGrid strokeDasharray="3 3" />

                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />

                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />

                  <Tooltip />

                  <Bar dataKey="occupancy" name="Occupancy %" fill="#6C4CF1" radius={[8, 8, 0, 0]} />

                </BarChart>

              </ResponsiveContainer>

            </Card>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            <Card>

              <h3 className="font-semibold mb-4">Property Performance</h3>

              <ResponsiveContainer width="100%" height={280}>

                <BarChart data={propertyPerformance} layout="vertical">

                  <CartesianGrid strokeDasharray="3 3" />

                  <XAxis type="number" tick={{ fontSize: 11 }} />

                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />

                  <Tooltip formatter={(v: number) => formatCurrency(v)} />

                  <Bar dataKey="revenue" fill="#6C4CF1" />

                </BarChart>

              </ResponsiveContainer>

            </Card>

            <Card>

              <h3 className="font-semibold mb-4">Maintenance by Status</h3>

              <ResponsiveContainer width="100%" height={280}>

                <PieChart>

                  <Pie data={maintenanceByStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>

                    {maintenanceByStatus.map((entry) => (

                      <Cell key={entry.name} fill={entry.color} />

                    ))}

                  </Pie>

                  <Tooltip />

                </PieChart>

              </ResponsiveContainer>

            </Card>

          </div>

        </>

      )}



      {activeTab === 'revenue' && (

        <Card padding={false} className="overflow-x-auto">

          <table className="w-full">

            <thead className="bg-muted/50 border-b">

              <tr>

                {['Month', 'Invoiced', 'Collected', 'Outstanding', 'Overdue'].map((h) => (

                  <th key={h} className="text-left px-4 py-3 text-sm text-muted-foreground">{h}</th>

                ))}

              </tr>

            </thead>

            <tbody className="divide-y">

              {revenueReport.map((r) => (

                <tr key={r.month}>

                  <td className="px-4 py-3 font-medium">{r.month}</td>

                  <td className="px-4 py-3">{formatCurrency(r.invoiced)}</td>

                  <td className="px-4 py-3 text-emerald-600">{formatCurrency(r.collected)}</td>

                  <td className="px-4 py-3">{formatCurrency(r.outstanding)}</td>

                  <td className="px-4 py-3 text-red-600">{formatCurrency(r.overdue)}</td>

                </tr>

              ))}

            </tbody>

          </table>

        </Card>

      )}



      {activeTab === 'occupancy' && (

        <Card padding={false} className="overflow-x-auto">

          <table className="w-full">

            <thead className="bg-muted/50 border-b">

              <tr>

                {['Property', 'Total Units', 'Occupied', 'Vacant', 'Occupancy'].map((h) => (

                  <th key={h} className="text-left px-4 py-3 text-sm text-muted-foreground">{h}</th>

                ))}

              </tr>

            </thead>

            <tbody className="divide-y">

              {occupancyReport.map((r) => (

                <tr key={r.property}>

                  <td className="px-4 py-3 font-medium">{r.property}</td>

                  <td className="px-4 py-3">{r.totalUnits}</td>

                  <td className="px-4 py-3">{r.occupied}</td>

                  <td className="px-4 py-3">{r.vacant}</td>

                  <td className="px-4 py-3">{r.occupancyRate}%</td>

                </tr>

              ))}

            </tbody>

          </table>

        </Card>

      )}



      {activeTab === 'leases' && (

        <Card padding={false} className="overflow-x-auto">

          <table className="w-full min-w-[700px]">

            <thead className="bg-muted/50 border-b">

              <tr>

                {['Tenant', 'Property', 'Unit', 'Start', 'End', 'Rent', 'Status'].map((h) => (

                  <th key={h} className="text-left px-4 py-3 text-sm text-muted-foreground">{h}</th>

                ))}

              </tr>

            </thead>

            <tbody className="divide-y">

              {leaseReport.map((r, i) => (

                <tr key={i}>

                  <td className="px-4 py-3 font-medium">{r.tenant}</td>

                  <td className="px-4 py-3">{r.property}</td>

                  <td className="px-4 py-3">{r.unit}</td>

                  <td className="px-4 py-3 text-sm">{r.startDate}</td>

                  <td className="px-4 py-3 text-sm">{r.endDate}</td>

                  <td className="px-4 py-3">{formatCurrency(r.rent)}</td>

                  <td className="px-4 py-3 capitalize">{r.status}</td>

                </tr>

              ))}

            </tbody>

          </table>

        </Card>

      )}



      {activeTab === 'payments' && (

        <Card padding={false} className="overflow-x-auto">

          <table className="w-full min-w-[600px]">

            <thead className="bg-muted/50 border-b">

              <tr>

                {['Date', 'Tenant', 'Invoice', 'Amount', 'Method', 'Status'].map((h) => (

                  <th key={h} className="text-left px-4 py-3 text-sm text-muted-foreground">{h}</th>

                ))}

              </tr>

            </thead>

            <tbody className="divide-y">

              {paymentReport.map((r, i) => (

                <tr key={i}>

                  <td className="px-4 py-3 text-sm">{r.date}</td>

                  <td className="px-4 py-3">{r.tenant}</td>

                  <td className="px-4 py-3">{r.invoiceNumber}</td>

                  <td className="px-4 py-3">{formatCurrency(r.amount)}</td>

                  <td className="px-4 py-3">{r.method}</td>

                  <td className="px-4 py-3 capitalize">{r.status}</td>

                </tr>

              ))}

            </tbody>

          </table>

        </Card>

      )}



      {activeTab === 'outstanding' && (

        <Card padding={false} className="overflow-x-auto">

          <table className="w-full min-w-[800px]">

            <thead className="bg-muted/50 border-b">

              <tr>

                {['Tenant', 'Invoice', 'Amount', 'Late Fee', 'Total Due', 'Due Date', 'Days Overdue'].map((h) => (

                  <th key={h} className="text-left px-4 py-3 text-sm text-muted-foreground">{h}</th>

                ))}

              </tr>

            </thead>

            <tbody className="divide-y">

              {outstandingReport.map((r, i) => (

                <tr key={i}>

                  <td className="px-4 py-3 font-medium">{r.tenant}<br /><span className="text-xs text-muted-foreground">{r.unit}</span></td>

                  <td className="px-4 py-3">{r.invoiceNumber}</td>

                  <td className="px-4 py-3">{formatCurrency(r.amount)}</td>

                  <td className="px-4 py-3">{formatCurrency(r.lateFee)}</td>

                  <td className="px-4 py-3 font-semibold text-red-600">{formatCurrency(r.totalDue)}</td>

                  <td className="px-4 py-3 text-sm">{r.dueDate}</td>

                  <td className="px-4 py-3">{r.daysOverdue > 0 ? r.daysOverdue : '—'}</td>

                </tr>

              ))}

            </tbody>

          </table>

        </Card>

      )}



      {activeTab === 'maintenance' && (

        <>

          <Card>

            <h3 className="font-semibold mb-4">Maintenance by Category</h3>

            <ResponsiveContainer width="100%" height={220}>

              <PieChart>

                <Pie data={maintenanceByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>

                  {maintenanceByCategory.map((entry) => (

                    <Cell key={entry.name} fill={entry.color} />

                  ))}

                </Pie>

                <Tooltip />

              </PieChart>

            </ResponsiveContainer>

          </Card>

          <Card padding={false} className="overflow-x-auto">

            <table className="w-full min-w-[900px]">

              <thead className="bg-muted/50 border-b">

                <tr>

                  {['Issue', 'Property', 'Priority', 'Status', 'Assigned', 'Submitted', 'Cost'].map((h) => (

                    <th key={h} className="text-left px-4 py-3 text-sm text-muted-foreground">{h}</th>

                  ))}

                </tr>

              </thead>

              <tbody className="divide-y">

                {maintenanceReport.map((r, i) => (

                  <tr key={i}>

                    <td className="px-4 py-3 font-medium">{r.issue}</td>

                    <td className="px-4 py-3">{r.property} · {r.unit}</td>

                    <td className="px-4 py-3">{r.priority}</td>

                    <td className="px-4 py-3">{r.status}</td>

                    <td className="px-4 py-3">{r.assignedTo}</td>

                    <td className="px-4 py-3 text-sm">{r.submitted}</td>

                    <td className="px-4 py-3">{r.actualCost ? formatCurrency(r.actualCost) : '—'}</td>

                  </tr>

                ))}

              </tbody>

            </table>

          </Card>

        </>

      )}



      {activeTab === 'tenants' && (

        <Card padding={false} className="overflow-x-auto">

          <table className="w-full min-w-[700px]">

            <thead className="bg-muted/50 border-b">

              <tr>

                {['Name', 'Email', 'Property', 'Unit', 'Rent', 'Status', 'Payment'].map((h) => (

                  <th key={h} className="text-left px-4 py-3 text-sm text-muted-foreground">{h}</th>

                ))}

              </tr>

            </thead>

            <tbody className="divide-y">

              {tenantReport.map((r, i) => (

                <tr key={i}>

                  <td className="px-4 py-3 font-medium">{r.name}</td>

                  <td className="px-4 py-3 text-sm">{r.email}</td>

                  <td className="px-4 py-3">{r.property}</td>

                  <td className="px-4 py-3">{r.unit}</td>

                  <td className="px-4 py-3">{formatCurrency(r.rent)}</td>

                  <td className="px-4 py-3 capitalize">{r.status}</td>

                  <td className="px-4 py-3 capitalize">{r.paymentStatus}</td>

                </tr>

              ))}

            </tbody>

          </table>

        </Card>

      )}

    </div>

  );

};


