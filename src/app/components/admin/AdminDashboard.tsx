import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import {
  Building2,
  Users,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const revenueData = [
  { month: 'Jan', revenue: 45000, expenses: 28000 },
  { month: 'Feb', revenue: 52000, expenses: 30000 },
  { month: 'Mar', revenue: 48000, expenses: 29000 },
  { month: 'Apr', revenue: 61000, expenses: 31000 },
  { month: 'May', revenue: 55000, expenses: 29500 },
  { month: 'Jun', revenue: 67000, expenses: 32000 },
];

const occupancyData = [
  { month: 'Jan', rate: 92 },
  { month: 'Feb', rate: 88 },
  { month: 'Mar', rate: 95 },
  { month: 'Apr', rate: 98 },
  { month: 'May', rate: 96 },
  { month: 'Jun', rate: 94 },
];

const recentActivities = [
  { id: 1, type: 'payment', tenant: 'John Smith', action: 'Paid rent', amount: '$1,200', time: '2 hours ago', status: 'success' },
  { id: 2, type: 'maintenance', tenant: 'Sarah Johnson', action: 'Submitted maintenance request', time: '4 hours ago', status: 'pending' },
  { id: 3, type: 'lease', tenant: 'Michael Brown', action: 'Lease renewed', time: '1 day ago', status: 'success' },
  { id: 4, type: 'payment', tenant: 'Emily Davis', action: 'Payment overdue', amount: '$950', time: '2 days ago', status: 'danger' },
];

export const AdminDashboard = () => {
  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-semibold text-foreground mb-1">Dashboard</h1>
        <p className="text-sm lg:text-base text-muted-foreground">Welcome back! Here's what's happening today.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Properties</p>
              <h3 className="text-2xl lg:text-3xl font-semibold text-foreground mb-2">24</h3>
              <div className="flex items-center gap-1 text-sm text-success">
                <ArrowUpRight className="w-4 h-4" />
                <span>12% from last month</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Active Tenants</p>
              <h3 className="text-2xl lg:text-3xl font-semibold text-foreground mb-2">186</h3>
              <div className="flex items-center gap-1 text-sm text-success">
                <ArrowUpRight className="w-4 h-4" />
                <span>8% from last month</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Monthly Revenue</p>
              <h3 className="text-2xl lg:text-3xl font-semibold text-foreground mb-2">$67K</h3>
              <div className="flex items-center gap-1 text-sm text-success">
                <ArrowUpRight className="w-4 h-4" />
                <span>22% from last month</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Occupancy Rate</p>
              <h3 className="text-2xl lg:text-3xl font-semibold text-foreground mb-2">94%</h3>
              <div className="flex items-center gap-1 text-sm text-destructive">
                <ArrowDownRight className="w-4 h-4" />
                <span>2% from last month</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <Card>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-foreground mb-1">Revenue & Expenses</h3>
            <p className="text-sm text-muted-foreground">Monthly comparison for the last 6 months</p>
          </div>
          <ResponsiveContainer width="100%" height={250} className="sm:!h-[300px]">
            <BarChart data={revenueData}>
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
              <Bar dataKey="revenue" fill="#6C4CF1" radius={[8, 8, 0, 0]} />
              <Bar dataKey="expenses" fill="#E9E4FF" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-primary rounded-full" />
              <span className="text-sm text-muted-foreground">Revenue</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-secondary rounded-full" />
              <span className="text-sm text-muted-foreground">Expenses</span>
            </div>
          </div>
        </Card>

        <Card>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-foreground mb-1">Occupancy Trend</h3>
            <p className="text-sm text-muted-foreground">Occupancy rate over time</p>
          </div>
          <ResponsiveContainer width="100%" height={250} className="sm:!h-[300px]">
            <AreaChart data={occupancyData}>
              <defs>
                <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6C4CF1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6C4CF1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" stroke="#6B7280" />
              <YAxis stroke="#6B7280" domain={[80, 100]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                }}
              />
              <Area
                type="monotone"
                dataKey="rate"
                stroke="#6C4CF1"
                fill="url(#colorRate)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-foreground mb-1">Recent Activity</h3>
          <p className="text-sm text-muted-foreground">Latest updates from your properties</p>
        </div>
        <div className="space-y-3">
          {recentActivities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                activity.status === 'success' ? 'bg-success/10' :
                activity.status === 'danger' ? 'bg-destructive/10' : 'bg-warning/10'
              }`}>
                {activity.status === 'success' ? (
                  <CheckCircle2 className={`w-5 h-5 ${activity.status === 'success' ? 'text-success' : ''}`} />
                ) : activity.status === 'danger' ? (
                  <AlertCircle className="w-5 h-5 text-destructive" />
                ) : (
                  <Clock className="w-5 h-5 text-warning" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-1">
                  <div>
                    <p className="font-medium text-foreground">{activity.tenant}</p>
                    <p className="text-sm text-muted-foreground">{activity.action}</p>
                  </div>
                  {activity.amount && (
                    <p className="font-semibold text-foreground whitespace-nowrap">{activity.amount}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
