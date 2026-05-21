import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Search, Download, DollarSign, AlertCircle, CheckCircle2 } from 'lucide-react';
import { PageLoader } from '../common/LoadingSpinner';
import { subscribeInvoices, markInvoicePaid } from '../../../services/invoices.service';
import type { Invoice } from '../../../types';
import { formatCurrency } from '../../../lib/format';

export const BillingPayments = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const unsub = subscribeInvoices((data) => {
      setInvoices(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  const filtered = invoices.filter((inv) => {
    const matchSearch =
      inv.tenantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalRevenue = invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.amount, 0);
  const pendingAmount = invoices.filter((i) => i.status === 'pending').reduce((s, i) => s + i.amount, 0);
  const overdueAmount = invoices.filter((i) => i.status === 'overdue').reduce((s, i) => s + i.amount + (i.lateFee || 0), 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid': return <Badge variant="success">Paid</Badge>;
      case 'pending': return <Badge variant="warning">Pending</Badge>;
      case 'overdue': return <Badge variant="danger">Overdue</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const handleMarkPaid = async (inv: Invoice) => {
    try {
      await markInvoicePaid(inv.id, inv.tenantId, 'Bank Transfer', new Date().toISOString().split('T')[0]);
      toast.success('Invoice marked as paid');
    } catch {
      toast.error('Failed to update invoice');
    }
  };

  const exportCsv = () => {
    const headers = ['Invoice', 'Tenant', 'Amount', 'Due', 'Status'];
    const rows = filtered.map((i) => [i.invoiceNumber, i.tenantName, i.amount, i.dueDate, i.status]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'invoices.csv';
    a.click();
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold text-foreground mb-1">Billing & Payments</h1>
          <p className="text-sm text-muted-foreground">Track invoices and payment status</p>
        </div>
        <Button variant="outline" onClick={exportCsv}><Download className="w-4 h-4 mr-2" />Export</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><div className="flex items-center gap-3"><CheckCircle2 className="w-8 h-8 text-emerald-600" /><div><p className="text-sm text-muted-foreground">Collected</p><p className="text-xl font-semibold">{formatCurrency(totalRevenue)}</p></div></div></Card>
        <Card><div className="flex items-center gap-3"><DollarSign className="w-8 h-8 text-amber-600" /><div><p className="text-sm text-muted-foreground">Pending</p><p className="text-xl font-semibold">{formatCurrency(pendingAmount)}</p></div></div></Card>
        <Card><div className="flex items-center gap-3"><AlertCircle className="w-8 h-8 text-red-600" /><div><p className="text-sm text-muted-foreground">Overdue</p><p className="text-xl font-semibold">{formatCurrency(overdueAmount)}</p></div></div></Card>
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input placeholder="Search invoices..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
          </div>
          <select className="h-9 rounded-md border px-3" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </Card>

      <Card padding={false} className="overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left px-6 py-4 text-sm text-muted-foreground">Invoice</th>
              <th className="text-left px-6 py-4 text-sm text-muted-foreground">Tenant</th>
              <th className="text-left px-6 py-4 text-sm text-muted-foreground">Amount</th>
              <th className="text-left px-6 py-4 text-sm text-muted-foreground">Due</th>
              <th className="text-left px-6 py-4 text-sm text-muted-foreground">Status</th>
              <th className="text-left px-6 py-4 text-sm text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((inv) => (
              <tr key={inv.id} className="hover:bg-accent/50">
                <td className="px-6 py-4 font-medium">{inv.invoiceNumber}</td>
                <td className="px-6 py-4">{inv.tenantName}<br /><span className="text-xs text-muted-foreground">{inv.unitLabel}</span></td>
                <td className="px-6 py-4">{formatCurrency(inv.amount)}</td>
                <td className="px-6 py-4 text-sm">{inv.dueDate}</td>
                <td className="px-6 py-4">{getStatusBadge(inv.status)}</td>
                <td className="px-6 py-4">
                  {inv.status !== 'paid' && (
                    <Button variant="ghost" size="sm" onClick={() => handleMarkPaid(inv)}>Mark Paid</Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};
