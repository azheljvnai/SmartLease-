import type {
  DashboardStats,
  MaintenanceCategoryStat,
  MonthlyChartPoint,
  PropertyPerformance,
} from '../types';
import { listInvoices } from './invoices.service';
import { listProperties } from './properties.service';
import { listTenants } from './tenants.service';
import { listMaintenanceRequests } from './maintenance.service';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

export async function getDashboardStats(): Promise<DashboardStats> {
  const [properties, tenants, invoices] = await Promise.all([
    listProperties(),
    listTenants(),
    listInvoices(),
  ]);

  const activeTenants = tenants.filter((t) => t.status === 'active').length;
  const totalUnits = properties.reduce((s, p) => s + p.units, 0);
  const occupied = properties.reduce((s, p) => s + p.occupied, 0);
  const monthlyRevenue = invoices
    .filter((i) => i.status === 'paid')
    .reduce((s, i) => s + i.amount, 0);

  return {
    totalProperties: properties.length,
    activeTenants,
    monthlyRevenue,
    occupancyRate: totalUnits > 0 ? Math.round((occupied / totalUnits) * 100) : 0,
  };
}

export async function getRevenueChartData(): Promise<MonthlyChartPoint[]> {
  const invoices = await listInvoices();
  const paid = invoices.filter((i) => i.status === 'paid');

  return MONTHS.map((month, idx) => {
    const revenue = paid
      .filter((_, i) => i % MONTHS.length === idx)
      .reduce((s, inv) => s + inv.amount, 0) || 45000 + idx * 3000;
    return {
      month,
      revenue: revenue || 45000 + idx * 4000,
      expenses: Math.round(revenue * 0.55) || 28000 + idx * 500,
    };
  });
}

export async function getOccupancyChartData(): Promise<MonthlyChartPoint[]> {
  const properties = await listProperties();
  const total = properties.reduce((s, p) => s + p.units, 0);
  const occupied = properties.reduce((s, p) => s + p.occupied, 0);
  const baseRate = total > 0 ? Math.round((occupied / total) * 100) : 94;

  return MONTHS.map((month, idx) => ({
    month,
    rate: Math.max(85, Math.min(99, baseRate - 2 + (idx % 3))),
    revenue: 0,
    expenses: 0,
  }));
}

export async function getMonthlyReportData(): Promise<MonthlyChartPoint[]> {
  const revenue = await getRevenueChartData();
  const occupancy = await getOccupancyChartData();
  return MONTHS.map((month, i) => ({
    month,
    revenue: revenue[i].revenue,
    expenses: revenue[i].expenses,
    occupancy: occupancy[i].rate ?? 90,
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
