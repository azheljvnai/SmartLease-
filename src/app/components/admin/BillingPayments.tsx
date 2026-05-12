import { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Search, Download, DollarSign, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';

const invoices = [
  {
    id: 'INV-001',
    tenant: 'John Smith',
    unit: 'Unit 101',
    amount: 1200,
    dueDate: '2026-05-01',
    paidDate: '2026-04-28',
    status: 'paid',
    method: 'Bank Transfer',
  },
  {
    id: 'INV-002',
    tenant: 'Sarah Johnson',
    unit: 'Unit 205',
    amount: 1800,
    dueDate: '2026-05-01',
    paidDate: '2026-05-01',
    status: 'paid',
    method: 'Credit Card',
  },
  {
    id: 'INV-003',
    tenant: 'Michael Brown',
    unit: 'Unit 312',
    amount: 1500,
    dueDate: '2026-05-01',
    paidDate: null,
    status: 'pending',
    method: null,
  },
  {
    id: 'INV-004',
    tenant: 'Emily Davis',
    unit: 'Unit 108',
    amount: 950,
    dueDate: '2026-04-25',
    paidDate: null,
    status: 'overdue',
    method: null,
    lateFee: 50,
  },
  {
    id: 'INV-005',
    tenant: 'Robert Taylor',
    unit: 'Unit 403',
    amount: 1350,
    dueDate: '2026-05-05',
    paidDate: null,
    status: 'pending',
    method: null,
  },
];

export const BillingPayments = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.tenant.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         invoice.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalRevenue = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0);
  const pendingAmount = invoices.filter(inv => inv.status === 'pending').reduce((sum, inv) => sum + inv.amount, 0);
  const overdueAmount = invoices.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + inv.amount + (inv.lateFee || 0), 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="success">Paid</Badge>;
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'overdue':
        return <Badge variant="danger">Overdue</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-semibold text-foreground mb-1">Billing & Payments</h1>
        <p className="text-sm lg:text-base text-muted-foreground">Track invoices, payments, and revenue</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Collected This Month</p>
              <h3 className="text-xl lg:text-2xl font-semibold text-foreground mb-2">${totalRevenue.toLocaleString()}</h3>
              <div className="flex items-center gap-1 text-sm text-success">
                <TrendingUp className="w-4 h-4" />
                <span>On track</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-success" />
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Pending Payments</p>
              <h3 className="text-xl lg:text-2xl font-semibold text-foreground mb-2">${pendingAmount.toLocaleString()}</h3>
              <p className="text-sm text-muted-foreground">
                {invoices.filter(inv => inv.status === 'pending').length} invoices
              </p>
            </div>
            <div className="w-12 h-12 bg-warning/10 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-warning" />
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Overdue Amount</p>
              <h3 className="text-xl lg:text-2xl font-semibold text-foreground mb-2">${overdueAmount.toLocaleString()}</h3>
              <p className="text-sm text-muted-foreground">
                {invoices.filter(inv => inv.status === 'overdue').length} invoices
              </p>
            </div>
            <div className="w-12 h-12 bg-destructive/10 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
          </div>
        </Card>
      </div>

      {/* Search and filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search invoices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-input-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
            </select>
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Desktop table view */}
      <Card padding={false} className="hidden lg:block overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Invoice ID</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Tenant</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Unit</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Amount</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Due Date</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-accent/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-foreground">{invoice.id}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-foreground">{invoice.tenant}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-foreground">{invoice.unit}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-foreground">${invoice.amount.toLocaleString()}</p>
                      {invoice.lateFee && (
                        <p className="text-xs text-destructive">+${invoice.lateFee} late fee</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm text-foreground">{invoice.dueDate}</p>
                      {invoice.paidDate && (
                        <p className="text-xs text-muted-foreground">Paid: {invoice.paidDate}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(invoice.status)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">View</Button>
                      {invoice.status !== 'paid' && (
                        <Button variant="outline" size="sm">Send Reminder</Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Mobile card view */}
      <div className="lg:hidden space-y-4">
        {filteredInvoices.map((invoice) => (
          <Card key={invoice.id} hover className="cursor-pointer">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-semibold text-foreground mb-1">{invoice.id}</p>
                <p className="text-sm text-muted-foreground">{invoice.tenant}</p>
                <p className="text-sm text-muted-foreground">{invoice.unit}</p>
              </div>
              {getStatusBadge(invoice.status)}
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Amount</span>
                <div className="text-right">
                  <p className="font-semibold text-foreground">${invoice.amount.toLocaleString()}</p>
                  {invoice.lateFee && (
                    <p className="text-xs text-destructive">+${invoice.lateFee} late fee</p>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Due Date</span>
                <span className="text-sm text-foreground">{invoice.dueDate}</span>
              </div>
              {invoice.paidDate && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Paid Date</span>
                  <span className="text-sm text-foreground">{invoice.paidDate}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1">View</Button>
              {invoice.status !== 'paid' && (
                <Button variant="primary" size="sm" className="flex-1">Send Reminder</Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
