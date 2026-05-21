import { useEffect, useState } from 'react';
import { Card } from '../ui/Card';
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
import { PageLoader } from '../common/LoadingSpinner';
import { getDashboardStats, getRevenueChartData, getOccupancyChartData } from '../../../services/analytics.service';
import { subscribeActivities } from '../../../services/activities.service';
import type { Activity, DashboardStats, MonthlyChartPoint } from '../../../types';
import { formatCurrency, formatCurrencyCompact } from '../../../lib/format';

export const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenueData, setRevenueData] = useState<MonthlyChartPoint[]>([]);
  const [occupancyData, setOccupancyData] = useState<MonthlyChartPoint[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getDashboardStats(), getRevenueChartData(), getOccupancyChartData()])
      .then(([s, r, o]) => {
        setStats(s);
        setRevenueData(r);
        setOccupancyData(o);
      })
      .finally(() => setLoading(false));

    const unsub = subscribeActivities(setActivities);
    return unsub;
  }, []);

  if (loading || !stats) return <PageLoader />;


  return (
    <div className="space-y-4 lg:space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-semibold text-foreground mb-1">Dashboard</h1>
        <p className="text-sm lg:text-base text-muted-foreground">Welcome back! Here&apos;s what&apos;s happening today.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Properties</p>
              <h3 className="text-2xl lg:text-3xl font-semibold text-foreground mb-2">{stats.totalProperties}</h3>
              <div className="flex items-center gap-1 text-sm text-emerald-600">
                <ArrowUpRight className="w-4 h-4" />
                <span>Portfolio active</span>
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
              <h3 className="text-2xl lg:text-3xl font-semibold text-foreground mb-2">{stats.activeTenants}</h3>
              <div className="flex items-center gap-1 text-sm text-emerald-600">
                <ArrowUpRight className="w-4 h-4" />
                <span>Currently leased</span>
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
              <h3 className="text-2xl lg:text-3xl font-semibold text-foreground mb-2">{formatCurrencyCompact(stats.monthlyRevenue)}</h3>
              <div className="flex items-center gap-1 text-sm text-emerald-600">
                <ArrowUpRight className="w-4 h-4" />
                <span>From paid invoices</span>
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
              <h3 className="text-2xl lg:text-3xl font-semibold text-foreground mb-2">{stats.occupancyRate}%</h3>
              <div className="flex items-center gap-1 text-sm text-destructive">
                <ArrowDownRight className="w-4 h-4" />
                <span>Portfolio average</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
          </div>
        </Card>
      </div>

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
              <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #E5E7EB', borderRadius: '8px' }} />
              <Bar dataKey="revenue" fill="#6C4CF1" radius={[8, 8, 0, 0]} />
              <Bar dataKey="expenses" fill="#E9E4FF" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
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
              <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #E5E7EB', borderRadius: '8px' }} />
              <Area type="monotone" dataKey="rate" stroke="#6C4CF1" fill="url(#colorRate)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-foreground mb-1">Recent Activity</h3>
          <p className="text-sm text-muted-foreground">Latest updates from your properties</p>
        </div>
        <div className="space-y-3">
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No recent activity</p>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent transition-colors">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  activity.status === 'success' ? 'bg-emerald-500/10' :
                  activity.status === 'danger' ? 'bg-destructive/10' : 'bg-amber-500/10'
                }`}>
                  {activity.status === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : activity.status === 'danger' ? (
                    <AlertCircle className="w-5 h-5 text-destructive" />
                  ) : (
                    <Clock className="w-5 h-5 text-amber-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-1">
                    <div>
                      <p className="font-medium text-foreground">{activity.tenantName}</p>
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
            ))
          )}
        </div>
      </Card>
    </div>
  );
};
