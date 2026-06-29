import type {

  DashboardStats,

  LeaseReportRow,

  MaintenanceCategoryStat,

  MaintenanceReportRow,

  MonthlyChartPoint,

  OccupancyReportRow,

  OutstandingBalanceRow,

  PaymentHistoryRow,

  PortfolioPropertyRow,

  PortfolioReportData,

  PropertyPerformance,

  ReportKpis,

  RevenueReportRow,

  TenantReportRow,

} from '../types';

import { listInvoices } from './invoices.service';

import { listProperties } from './properties.service';

import { listTenants } from './tenants.service';

import { listMaintenanceRequests } from './maintenance.service';

import { listLeases } from './leases.service';

import { listPayments } from './payments.service';

import { normalizeMaintenanceStatus, maintenanceStatusLabel, maintenancePriorityLabel } from '../lib/maintenance-labels';



const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];



function monthKey(dateStr: string): string {

  const d = new Date(dateStr);

  if (Number.isNaN(d.getTime())) return '';

  return `${d.getFullYear()}-${d.getMonth()}`;

}



function lastNMonths(n: number): { key: string; label: string }[] {

  const result: { key: string; label: string }[] = [];

  const now = new Date();

  for (let i = n - 1; i >= 0; i--) {

    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);

    result.push({

      key: `${d.getFullYear()}-${d.getMonth()}`,

      label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`,

    });

  }

  return result;

}



function daysBetween(dateStr: string): number {

  const due = new Date(dateStr);

  const today = new Date();

  today.setHours(0, 0, 0, 0);

  due.setHours(0, 0, 0, 0);

  return Math.max(0, Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)));

}



export async function getDashboardStats(): Promise<DashboardStats> {

  const [properties, tenants, invoices] = await Promise.all([

    listProperties(),

    listTenants(),

    listInvoices(),

  ]);



  const activeTenants = tenants.filter((t) => t.status === 'active').length;

  const totalUnits = properties.reduce((s, p) => s + p.units, 0);

  const occupied = properties.reduce((s, p) => s + p.occupied, 0);

  const currentMonth = monthKey(new Date().toISOString());

  const monthlyRevenue = invoices

    .filter((i) => i.status === 'paid' && monthKey(i.paidDate ?? i.dueDate) === currentMonth)

    .reduce((s, i) => s + i.amount + (i.lateFee ?? 0), 0);



  return {

    totalProperties: properties.length,

    activeTenants,

    monthlyRevenue,

    occupancyRate: totalUnits > 0 ? Math.round((occupied / totalUnits) * 100) : 0,

  };

}



export async function getReportKpis(): Promise<ReportKpis> {

  const [properties, tenants, invoices, leases, maintenance] = await Promise.all([

    listProperties(),

    listTenants(),

    listInvoices(),

    listLeases(),

    listMaintenanceRequests(),

  ]);



  const currentMonth = monthKey(new Date().toISOString());

  const totalUnits = properties.reduce((s, p) => s + p.units, 0);

  const occupied = properties.reduce((s, p) => s + p.occupied, 0);



  const collectedThisMonth = invoices

    .filter((i) => i.status === 'paid' && monthKey(i.paidDate ?? i.dueDate) === currentMonth)

    .reduce((s, i) => s + i.amount + (i.lateFee ?? 0), 0);



  const outstanding = invoices

    .filter((i) => i.status === 'pending' || i.status === 'overdue')

    .reduce((s, i) => s + i.amount + (i.lateFee ?? 0), 0);



  const openMaintenance = maintenance.filter((r) => {

    const s = normalizeMaintenanceStatus(r.status);

    return s !== 'completed' && s !== 'cancelled';

  }).length;



  return {

    totalRevenue: invoices

      .filter((i) => i.status === 'paid')

      .reduce((s, i) => s + i.amount + (i.lateFee ?? 0), 0),

    collectedThisMonth,

    outstandingBalance: outstanding,

    overdueCount: invoices.filter((i) => i.status === 'overdue').length,

    occupancyRate: totalUnits > 0 ? Math.round((occupied / totalUnits) * 100) : 0,

    activeLeases: leases.filter((l) => l.status === 'active').length,

    openMaintenance,

    totalTenants: tenants.filter((t) => t.status === 'active').length,

  };

}



export async function getRevenueChartData(): Promise<MonthlyChartPoint[]> {

  const invoices = await listInvoices();

  const months = lastNMonths(6);



  return months.map(({ key, label }) => {

    const monthInvoices = invoices.filter((i) => monthKey(i.dueDate) === key);

    const monthPaid = invoices.filter(

      (i) => i.status === 'paid' && monthKey(i.paidDate ?? i.dueDate) === key,

    );

    const invoiced = monthInvoices.reduce((s, inv) => s + inv.amount, 0);

    const revenue = monthPaid.reduce((s, inv) => s + inv.amount + (inv.lateFee ?? 0), 0);

    return {

      month: label,

      revenue,

      expenses: Math.round(revenue * 0.35),

      invoiced,

    };

  });

}



export async function getOccupancyChartData(): Promise<MonthlyChartPoint[]> {

  const properties = await listProperties();

  const total = properties.reduce((s, p) => s + p.units, 0);

  const occupied = properties.reduce((s, p) => s + p.occupied, 0);

  const baseRate = total > 0 ? Math.round((occupied / total) * 100) : 0;

  const months = lastNMonths(6);



  return months.map(({ label }) => ({

    month: label,

    rate: baseRate,

    occupancy: baseRate,

    revenue: 0,

    expenses: 0,

  }));

}



export async function getMonthlyReportData(): Promise<MonthlyChartPoint[]> {

  const revenue = await getRevenueChartData();

  const occupancy = await getOccupancyChartData();

  return revenue.map((r, i) => ({

    month: r.month,

    revenue: r.revenue,

    expenses: r.expenses,

    occupancy: occupancy[i].rate ?? 0,

    invoiced: r.invoiced,

  }));

}



export async function getPropertyPerformance(): Promise<PropertyPerformance[]> {

  const properties = await listProperties();

  return properties.map((p) => ({

    name: p.name,

    revenue: p.revenue,

    occupancy: p.units > 0 ? Math.round((p.occupied / p.units) * 100) : 0,

  }));

}



export async function getMaintenanceByCategory(): Promise<MaintenanceCategoryStat[]> {

  const requests = await listMaintenanceRequests();

  const colors: Record<string, string> = {

    Plumbing: '#3b82f6',

    HVAC: '#f59e0b',

    Electrical: '#8b5cf6',

    General: '#10b981',

  };

  const counts: Record<string, number> = {};

  requests.forEach((r) => {

    counts[r.category] = (counts[r.category] ?? 0) + 1;

  });

  return Object.entries(counts).map(([name, value]) => ({

    name,

    value,

    color: colors[name] ?? '#6b7280',

  }));

}



export async function getRevenueReport(): Promise<RevenueReportRow[]> {

  const invoices = await listInvoices();

  const months = lastNMonths(12);



  return months.map(({ key, label }) => {

    const monthInvoices = invoices.filter((i) => monthKey(i.dueDate) === key);

    const collected = invoices

      .filter((i) => i.status === 'paid' && monthKey(i.paidDate ?? i.dueDate) === key)

      .reduce((s, i) => s + i.amount + (i.lateFee ?? 0), 0);

    const outstanding = monthInvoices

      .filter((i) => i.status === 'pending' || i.status === 'overdue')

      .reduce((s, i) => s + i.amount + (i.lateFee ?? 0), 0);

    const overdue = monthInvoices

      .filter((i) => i.status === 'overdue')

      .reduce((s, i) => s + i.amount + (i.lateFee ?? 0), 0);



    return {

      month: label,

      invoiced: monthInvoices.reduce((s, i) => s + i.amount, 0),

      collected,

      outstanding,

      overdue,

    };

  });

}



export async function getOccupancyReport(): Promise<OccupancyReportRow[]> {

  const properties = await listProperties();

  return properties.map((p) => ({

    property: p.name,

    totalUnits: p.units,

    occupied: p.occupied,

    vacant: Math.max(0, p.units - p.occupied),

    occupancyRate: p.units > 0 ? Math.round((p.occupied / p.units) * 100) : 0,

  }));

}



export async function getLeaseStatusReport(): Promise<LeaseReportRow[]> {

  const leases = await listLeases();

  return leases.map((l) => ({

    tenant: l.tenantName,

    property: l.propertyName,

    unit: l.unitLabel,

    startDate: l.startDate,

    endDate: l.endDate,

    rent: l.rent,

    status: l.status,

  }));

}



export async function getPaymentHistoryReport(): Promise<PaymentHistoryRow[]> {

  const payments = await listPayments();

  const invoices = await listInvoices();

  const tenants = await listTenants();

  const invoiceMap = new Map(invoices.map((i) => [i.id, i]));

  const tenantMap = new Map(tenants.map((t) => [t.id, t]));



  return payments.map((p) => {

    const inv = invoiceMap.get(p.invoiceId);

    const tenant = tenantMap.get(p.tenantId);

    const date =

      typeof p.createdAt === 'object' && p.createdAt && 'toDate' in p.createdAt

        ? (p.createdAt as { toDate: () => Date }).toDate().toISOString().split('T')[0]

        : String(p.createdAt).split('T')[0];

    return {

      date,

      tenant: tenant?.name ?? p.tenantId,

      invoiceNumber: inv?.invoiceNumber ?? p.invoiceId,

      amount: p.amount,

      method: p.method,

      status: p.status,

    };

  });

}



export async function getOutstandingBalancesReport(): Promise<OutstandingBalanceRow[]> {

  const invoices = await listInvoices();

  return invoices

    .filter((i) => i.status === 'pending' || i.status === 'overdue')

    .map((i) => ({

      tenant: i.tenantName,

      property: i.propertyName ?? '',

      unit: i.unitLabel,

      invoiceNumber: i.invoiceNumber,

      amount: i.amount,

      lateFee: i.lateFee ?? 0,

      totalDue: i.amount + (i.lateFee ?? 0),

      dueDate: i.dueDate,

      daysOverdue: i.status === 'overdue' ? daysBetween(i.dueDate) : 0,

    }));

}



export async function getMaintenanceReport(): Promise<MaintenanceReportRow[]> {

  const requests = await listMaintenanceRequests();

  return requests.map((r) => ({

    issue: r.issue,

    property: r.propertyName ?? '',

    unit: r.unitLabel,

    category: r.category,

    priority: maintenancePriorityLabel(r.priority),

    status: maintenanceStatusLabel(r.status),

    assignedTo: r.assignedTo ?? '—',

    submitted: r.submitted,

    completedDate: r.completedDate ?? '—',

    actualCost: r.actualCost ?? 0,

  }));

}



export async function getTenantReport(): Promise<TenantReportRow[]> {

  const tenants = await listTenants();

  return tenants.map((t) => ({

    name: t.name,

    email: t.email,

    property: t.propertyName,

    unit: t.unitLabel,

    rent: t.rent,

    status: t.status,

    paymentStatus: t.paymentStatus,

  }));

}



export async function getMaintenanceStatusBreakdown(): Promise<MaintenanceCategoryStat[]> {

  const requests = await listMaintenanceRequests();

  const colors: Record<string, string> = {

    Pending: '#f59e0b',

    Assigned: '#3b82f6',

    'In Progress': '#8b5cf6',

    Completed: '#10b981',

    Cancelled: '#6b7280',

  };

  const counts: Record<string, number> = {};

  requests.forEach((r) => {

    const label = maintenanceStatusLabel(r.status);

    counts[label] = (counts[label] ?? 0) + 1;

  });

  return Object.entries(counts).map(([name, value]) => ({

    name,

    value,

    color: colors[name] ?? '#6b7280',

  }));

}



const LEASE_STATUS_COLORS: Record<string, string> = {

  active: '#10b981',

  pending: '#f59e0b',

  expired: '#ef4444',

  terminated: '#6b7280',

};



function buildPortfolioInsights(

  properties: PortfolioPropertyRow[],

  kpis: PortfolioReportData['kpis'],

  occupiedUnits: number,

): string[] {

  const insights: string[] = [];

  if (properties.length === 0) {

    insights.push('No properties in the portfolio yet. Add properties to begin tracking performance.');

    return insights;

  }

  const byRevenue = [...properties].sort((a, b) => b.revenue - a.revenue);

  const top = byRevenue[0];

  const bottom = byRevenue[byRevenue.length - 1];

  if (top) {

    insights.push(

      `Highest-performing property: ${top.name} with ${top.revenue > 0 ? `₱${top.revenue.toLocaleString('en-PH')}` : '₱0'} in collected revenue.`,

    );

  }

  if (bottom && properties.length > 1) {

    insights.push(

      `Lowest-performing property by revenue: ${bottom.name} (${bottom.revenue > 0 ? `₱${bottom.revenue.toLocaleString('en-PH')}` : '₱0'}).`,

    );

  }

  insights.push(

    `Overall occupancy is ${kpis.occupancyRate}% across the portfolio — ${occupiedUnits} occupied units and ${kpis.vacantUnits} vacant.`,

  );

  insights.push(

    `Total outstanding receivables: ₱${kpis.outstandingBalance.toLocaleString('en-PH')}${kpis.outstandingBalance > 0 ? ' requiring collection follow-up.' : '.'}`,

  );

  if (occupiedUnits > 0) {

    const avgPerUnit = Math.round(kpis.totalRevenue / occupiedUnits);

    insights.push(`Average revenue per occupied unit: ₱${avgPerUnit.toLocaleString('en-PH')}.`);

  }

  const attention = properties.filter(

    (p) => p.occupancyRate < 80 || p.outstandingBalance > 0 || p.openMaintenance > 0,

  );

  if (attention.length > 0) {

    const names = attention.map((p) => p.name).join(', ');

    insights.push(`Properties requiring management attention: ${names}.`);

  } else {

    insights.push('All properties are performing within normal thresholds — no immediate attention required.');

  }

  return insights;

}



export async function getPortfolioReportData(): Promise<PortfolioReportData> {

  const [properties, invoices, maintenance, leases, monthlyData, maintenanceStatus] = await Promise.all([

    listProperties(),

    listInvoices(),

    listMaintenanceRequests(),

    listLeases(),

    getMonthlyReportData(),

    getMaintenanceStatusBreakdown(),

  ]);



  const months = lastNMonths(6);

  const reportingPeriod =

    months.length >= 2

      ? `${months[0].label} – ${months[months.length - 1].label}`

      : months[0]?.label ?? 'Current Period';



  const totalUnits = properties.reduce((s, p) => s + p.units, 0);

  const occupiedUnits = properties.reduce((s, p) => s + p.occupied, 0);

  const vacantUnits = Math.max(0, totalUnits - occupiedUnits);



  const totalRevenue = invoices

    .filter((i) => i.status === 'paid')

    .reduce((s, i) => s + i.amount + (i.lateFee ?? 0), 0);



  const currentMonth = monthKey(new Date().toISOString());

  const revenueThisMonth = invoices

    .filter((i) => i.status === 'paid' && monthKey(i.paidDate ?? i.dueDate) === currentMonth)

    .reduce((s, i) => s + i.amount + (i.lateFee ?? 0), 0);



  const outstandingBalance = invoices

    .filter((i) => i.status === 'pending' || i.status === 'overdue')

    .reduce((s, i) => s + i.amount + (i.lateFee ?? 0), 0);



  const openMaintenance = maintenance.filter((r) => {

    const s = normalizeMaintenanceStatus(r.status);

    return s !== 'completed' && s !== 'cancelled';

  }).length;



  const outstandingByProperty = new Map<string, number>();

  invoices

    .filter((i) => i.status === 'pending' || i.status === 'overdue')

    .forEach((i) => {

      const prev = outstandingByProperty.get(i.propertyId) ?? 0;

      outstandingByProperty.set(i.propertyId, prev + i.amount + (i.lateFee ?? 0));

    });



  const maintenanceByProperty = new Map<string, number>();

  maintenance.forEach((r) => {

    const s = normalizeMaintenanceStatus(r.status);

    if (s === 'completed' || s === 'cancelled') return;

    const prev = maintenanceByProperty.get(r.propertyId) ?? 0;

    maintenanceByProperty.set(r.propertyId, prev + 1);

  });



  const propertyRows: PortfolioPropertyRow[] = properties.map((p) => ({

    name: p.name,

    totalUnits: p.units,

    occupied: p.occupied,

    vacant: Math.max(0, p.units - p.occupied),

    occupancyRate: p.units > 0 ? Math.round((p.occupied / p.units) * 100) : 0,

    revenue: p.revenue,

    outstandingBalance: outstandingByProperty.get(p.id) ?? 0,

    openMaintenance: maintenanceByProperty.get(p.id) ?? 0,

    status: p.status,

  }));



  const leaseCounts: Record<string, number> = {};

  leases.forEach((l) => {

    leaseCounts[l.status] = (leaseCounts[l.status] ?? 0) + 1;

  });

  const leaseStatus = Object.entries(leaseCounts).map(([name, value]) => ({

    name: name.charAt(0).toUpperCase() + name.slice(1),

    value,

    color: LEASE_STATUS_COLORS[name] ?? '#6b7280',

  }));



  const kpis = {

    totalRevenue,

    revenueThisMonth,

    outstandingBalance,

    occupancyRate: totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0,

    activeLeases: leases.filter((l) => l.status === 'active').length,

    vacantUnits,

    openMaintenance,

  };



  return {

    title: 'Portfolio Summary Report',

    reportingPeriod,

    generatedAt: new Date().toLocaleString(),

    kpis,

    revenueByProperty: propertyRows.map((p) => ({ label: p.name, value: p.revenue })),

    monthlyRevenue: monthlyData.map((m) => ({ month: m.month, value: m.revenue })),

    occupancyByProperty: propertyRows.map((p) => ({ label: p.name, value: p.occupancyRate })),

    occupancyDistribution: [

      { name: 'Occupied', value: occupiedUnits, color: '#10b981' },

      { name: 'Vacant', value: vacantUnits, color: '#f59e0b' },

    ],

    leaseStatus,

    maintenanceStatus,

    properties: propertyRows,

    insights: buildPortfolioInsights(propertyRows, kpis, occupiedUnits),

  };

}


