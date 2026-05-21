import { useEffect, useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Download } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PageLoader } from '../common/LoadingSpinner';
import {
  getMonthlyReportData,
  getPropertyPerformance,
  getMaintenanceByCategory,
} from '../../../services/analytics.service';
import type { MonthlyChartPoint, PropertyPerformance, MaintenanceCategoryStat } from '../../../types';
import { formatCurrency } from '../../../lib/format';

export const Reports = () => {
  const [monthlyData, setMonthlyData] = useState<MonthlyChartPoint[]>([]);
  const [propertyPerformance, setPropertyPerformance] = useState<PropertyPerformance[]>([]);
  const [maintenanceByCategory, setMaintenanceByCategory] = useState<MaintenanceCategoryStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getMonthlyReportData(),
      getPropertyPerformance(),
      getMaintenanceByCategory(),
    ]).then(([m, p, c]) => {
      setMonthlyData(m);
      setPropertyPerformance(p);
      setMaintenanceByCategory(c.length ? c : [{ name: 'General', value: 1, color: '#6b7280' }]);
      setLoading(false);
    });
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold text-foreground mb-1">Reports</h1>
          <p className="text-sm text-muted-foreground">Analytics and performance insights</p>
        </div>
        <Button variant="primary"><Download className="w-4 h-4 mr-2" />Export Report</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-semibold mb-4">Revenue vs Expenses</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" stroke="#6C4CF1" strokeWidth={2} />
              <Line type="monotone" dataKey="expenses" stroke="#E9E4FF" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <h3 className="font-semibold mb-4">Occupancy Trend</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="occupancy" fill="#6C4CF1" radius={[8, 8, 0, 0]} />
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
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={120} />
              <Tooltip />
              <Bar dataKey="revenue" fill="#6C4CF1" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <h3 className="font-semibold mb-4">Maintenance by Category</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={maintenanceByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                {maintenanceByCategory.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card padding={false} className="overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left px-6 py-4 text-sm text-muted-foreground">Property</th>
              <th className="text-left px-6 py-4 text-sm text-muted-foreground">Revenue</th>
              <th className="text-left px-6 py-4 text-sm text-muted-foreground">Occupancy</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {propertyPerformance.map((p) => (
              <tr key={p.name}>
                <td className="px-6 py-4 font-medium">{p.name}</td>
                <td className="px-6 py-4">{formatCurrency(p.revenue)}</td>
                <td className="px-6 py-4">{p.occupancy}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};
