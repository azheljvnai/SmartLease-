import { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Download, TrendingUp, DollarSign, Users, Building2 } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const monthlyData = [
  { month: 'Jan', revenue: 45000, expenses: 28000, occupancy: 92 },
  { month: 'Feb', revenue: 52000, expenses: 30000, occupancy: 88 },
  { month: 'Mar', revenue: 48000, expenses: 29000, occupancy: 95 },
  { month: 'Apr', revenue: 61000, expenses: 31000, occupancy: 98 },
  { month: 'May', revenue: 55000, expenses: 29500, occupancy: 96 },
  { month: 'Jun', revenue: 67000, expenses: 32000, occupancy: 94 },
];

const propertyPerformance = [
  { name: 'Sunset Apartments', revenue: 28800, occupancy: 92 },
  { name: 'Downtown Plaza', revenue: 32400, occupancy: 100 },
  { name: 'Riverside Condos', revenue: 42000, occupancy: 88 },
  { name: 'Garden Heights', revenue: 19200, occupancy: 88 },
];

const maintenanceByCategory = [
  { name: 'Plumbing', value: 35, color: '#6C4CF1' },
  { name: 'Electrical', value: 25, color: '#8B5CF6' },
  { name: 'HVAC', value: 20, color: '#A78BFA' },
  { name: 'General', value: 20, color: '#C4B5FD' },
];

export const Reports = () => {
  const [dateRange, setDateRange] = useState('6months');

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold text-foreground mb-1">Reports & Analytics</h1>
          <p className="text-sm lg:text-base text-muted-foreground">Comprehensive insights into your portfolio performance</p>
        </div>
        <div className="flex gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 bg-input-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="1month">Last Month</option>
            <option value="3months">Last 3 Months</option>
            <option value="6months">Last 6 Months</option>
            <option value="1year">Last Year</option>
          </select>
          <Button variant="primary" className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            <span className="hidden sm:inline">Export Report</span>
          </Button>
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
              <h3 className="text-xl lg:text-2xl font-semibold text-foreground mb-2">$328K</h3>
              <div className="flex items-center gap-1 text-sm text-success">
                <TrendingUp className="w-4 h-4" />
                <span>+12.5% vs last period</span>
              </div>
            </div>
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-primary" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Avg Occupancy</p>
              <h3 className="text-xl lg:text-2xl font-semibold text-foreground mb-2">93.8%</h3>
              <p className="text-sm text-muted-foreground">Across all properties</p>
            </div>
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Active Tenants</p>
              <h3 className="text-xl lg:text-2xl font-semibold text-foreground mb-2">186</h3>
              <p className="text-sm text-muted-foreground">84 units occupied</p>
            </div>
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Net Profit</p>
              <h3 className="text-xl lg:text-2xl font-semibold text-foreground mb-2">$148K</h3>
              <p className="text-sm text-muted-foreground">45% margin</p>
            </div>
            <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Revenue vs Expenses */}
        <Card>
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground mb-1">Revenue vs Expenses</h3>
            <p className="text-sm text-muted-foreground">Monthly comparison over time</p>
          </div>
          <ResponsiveContainer width="100%" height={250} className="sm:!h-[300px]">
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#6C4CF1" strokeWidth={2} name="Revenue" />
              <Line type="monotone" dataKey="expenses" stroke="#F59E0B" strokeWidth={2} name="Expenses" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Occupancy Trend */}
        <Card>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-foreground mb-1">Occupancy Rate Trend</h3>
            <p className="text-sm text-muted-foreground">Track occupancy over time</p>
          </div>
          <ResponsiveContainer width="100%" height={250} className="sm:!h-[300px]">
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" stroke="#6B7280" />
              <YAxis stroke="#6B7280" domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="occupancy" fill="#6C4CF1" radius={[8, 8, 0, 0]} name="Occupancy %" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Property Performance */}
        <Card>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-foreground mb-1">Property Performance</h3>
            <p className="text-sm text-muted-foreground">Revenue by property</p>
          </div>
          <ResponsiveContainer width="100%" height={250} className="sm:!h-[300px]">
            <BarChart data={propertyPerformance} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis type="number" stroke="#6B7280" />
              <YAxis dataKey="name" type="category" stroke="#6B7280" width={150} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="revenue" fill="#6C4CF1" radius={[0, 8, 8, 0]} name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Maintenance Categories */}
        <Card>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-foreground mb-1">Maintenance by Category</h3>
            <p className="text-sm text-muted-foreground">Distribution of maintenance requests</p>
          </div>
          <ResponsiveContainer width="100%" height={250} className="sm:!h-[300px]">
            <PieChart>
              <Pie
                data={maintenanceByCategory}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {maintenanceByCategory.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Property comparison table */}
      <Card>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-foreground mb-1">Property Comparison</h3>
          <p className="text-sm text-muted-foreground">Detailed performance metrics by property</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Property</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Revenue</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Occupancy</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Avg Rent</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Units</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {propertyPerformance.map((property) => (
                <tr key={property.name} className="hover:bg-accent/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{property.name}</td>
                  <td className="px-4 py-3 text-foreground">${property.revenue.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-full max-w-[100px] bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${property.occupancy}%` }}
                        />
                      </div>
                      <span className="text-sm text-foreground">{property.occupancy}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-foreground">$1,200</td>
                  <td className="px-4 py-3 text-foreground">24</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
