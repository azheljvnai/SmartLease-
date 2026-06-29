import { useEffect, useState } from 'react';

import { toast } from 'sonner';

import { Card } from '../ui/card';

import { Button } from '../ui/button';

import { Input } from '../ui/input';

import { Badge } from '../ui/badge';

import {

  Search,

  Download,

  DollarSign,

  AlertCircle,

  CheckCircle2,

  Plus,

  FileText,

  Mail,

  RefreshCw,

  History,

  X,

} from 'lucide-react';

import { PageLoader } from '../common/LoadingSpinner';

import {

  subscribeInvoices,

  markInvoicePaid,

  createInvoice,

  syncOverdueInvoices,

  generateInvoiceNumber,

  downloadStoredInvoicePdf,

  generateAndStoreInvoicePdf,

  sendInvoiceByEmail,

  generateAndSendInvoice,

} from '../../../services/invoices.service';

import { listTenants } from '../../../services/tenants.service';

import type { Invoice, InvoiceEmailStatus, Tenant } from '../../../types';

import { formatCurrency, formatDate } from '../../../lib/format';

import { getFirebaseErrorMessage } from '../../../lib/firebase-errors';
import {
  clearFieldError,
  focusFirstFieldError,
  validateFormFields,
} from '../../../lib/form-validation';
import { FormSelect } from '../ui/form-select';
import { Textarea } from '../ui/textarea';

import { isEmailConfigured } from '../../../services/email.service';



function defaultBillingPeriod(dueDate: string) {

  const due = new Date(dueDate);

  const start = new Date(due.getFullYear(), due.getMonth() - 1, 1);

  const end = new Date(due.getFullYear(), due.getMonth(), 0);

  return {

    start: start.toISOString().split('T')[0],

    end: end.toISOString().split('T')[0],

  };

}



function emailStatusBadge(status?: InvoiceEmailStatus) {

  switch (status) {

    case 'sent':

      return <Badge variant="success">Emailed</Badge>;

    case 'failed':

      return <Badge variant="danger">Email Failed</Badge>;

    case 'skipped':

      return <Badge variant="warning">Not Configured</Badge>;

    default:

      return <Badge variant="info">Not Sent</Badge>;

  }

}



export const BillingPayments = () => {

  const [invoices, setInvoices] = useState<Invoice[]>([]);

  const [tenants, setTenants] = useState<Tenant[]>([]);

  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');

  const [statusFilter, setStatusFilter] = useState('all');

  const [showForm, setShowForm] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const [form, setForm] = useState({

    tenantId: '',

    amount: '',

    dueDate: '',

    lateFee: '',

    billingPeriodStart: '',

    billingPeriodEnd: '',

    notes: '',

    sendEmail: true,

  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});



  useEffect(() => {

    syncOverdueInvoices().catch(() => {});

    listTenants().then(setTenants);

    const unsub = subscribeInvoices((data) => {

      setInvoices(data);

      setLoading(false);

      setSelectedInvoice((prev) => (prev ? data.find((i) => i.id === prev.id) ?? prev : null));

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



  const totalRevenue = invoices

    .filter((i) => i.status === 'paid')

    .reduce((s, i) => s + i.amount + (i.lateFee ?? 0), 0);

  const pendingAmount = invoices

    .filter((i) => i.status === 'pending')

    .reduce((s, i) => s + i.amount + (i.lateFee ?? 0), 0);

  const overdueAmount = invoices

    .filter((i) => i.status === 'overdue')

    .reduce((s, i) => s + i.amount + (i.lateFee ?? 0), 0);



  const getStatusBadge = (status: string) => {

    switch (status) {

      case 'paid':

        return <Badge variant="success">Paid</Badge>;

      case 'pending':

        return <Badge variant="warning">Pending</Badge>;

      case 'overdue':

        return <Badge variant="danger">Overdue</Badge>;

      default:

        return <Badge>{status}</Badge>;

    }

  };



  const handleMarkPaid = async (inv: Invoice) => {

    try {

      await markInvoicePaid(

        inv.id,

        inv.tenantId,

        'Bank Transfer',

        new Date().toISOString().split('T')[0],

      );

      toast.success('Invoice marked as paid');

    } catch {

      toast.error('Failed to update invoice');

    }

  };



  const handleDueDateChange = (dueDate: string) => {

    const period = dueDate ? defaultBillingPeriod(dueDate) : { start: '', end: '' };

    setForm((f) => ({

      ...f,

      dueDate,

      billingPeriodStart: period.start,

      billingPeriodEnd: period.end,

    }));

  };



  const handleCreateInvoice = async (e: React.FormEvent) => {

    e.preventDefault();

    const result = validateFormFields({

      tenantId: { value: form.tenantId, label: 'Tenant', required: true },

      amount: { value: form.amount, label: 'Amount', required: true },

      dueDate: { value: form.dueDate, label: 'Due date', required: true },

    });

    if (!result.valid) {

      setFieldErrors(result.errors);

      focusFirstFieldError(result.errors);

      toast.error(result.message ?? 'Please fix the highlighted fields');

      return;

    }

    setFieldErrors({});

    const tenant = tenants.find((t) => t.id === form.tenantId);

    if (!tenant) {

      toast.error('Select a tenant');

      return;

    }

    setSubmitting(true);

    try {

      const period = form.billingPeriodStart && form.billingPeriodEnd

        ? { start: form.billingPeriodStart, end: form.billingPeriodEnd }

        : defaultBillingPeriod(form.dueDate);



      const invoiceNumber = generateInvoiceNumber();

      const invoiceId = await createInvoice({

        invoiceNumber,

        tenantId: tenant.id,

        tenantName: tenant.name,

        unitId: tenant.unitId,

        unitLabel: tenant.unitLabel,

        propertyId: tenant.propertyId,

        propertyName: tenant.propertyName,

        amount: parseFloat(form.amount) || tenant.rent,

        dueDate: form.dueDate,

        billingPeriodStart: period.start,

        billingPeriodEnd: period.end,

        lateFee: form.lateFee ? parseFloat(form.lateFee) : undefined,

        notes: form.notes || undefined,

        paidDate: null,

        status: 'pending',

        method: null,

        emailStatus: 'not_sent',

        deliveryHistory: [],

      });



      await generateAndStoreInvoicePdf(invoiceId);



      if (form.sendEmail) {

        const status = await sendInvoiceByEmail(invoiceId);

        if (status === 'sent') toast.success('Invoice created and emailed');

        else if (status === 'skipped') toast.success('Invoice created (email not configured)');

        else toast.warning('Invoice created but email failed');

      } else {

        toast.success('Invoice created with PDF');

      }



      setShowForm(false);

      setForm({

        tenantId: '',

        amount: '',

        dueDate: '',

        lateFee: '',

        billingPeriodStart: '',

        billingPeriodEnd: '',

        notes: '',

        sendEmail: true,

      });

    } catch (err) {

      toast.error(getFirebaseErrorMessage(err));

    } finally {

      setSubmitting(false);

    }

  };



  const runInvoiceAction = async (

    invoiceId: string,

    action: 'download' | 'generate' | 'email' | 'send',

    invoice: Invoice,

  ) => {

    setActionLoading(`${action}-${invoiceId}`);

    try {

      if (action === 'download') {

        await downloadStoredInvoicePdf(invoice);

        toast.success('Invoice PDF downloaded');

      } else if (action === 'generate') {

        await generateAndStoreInvoicePdf(invoiceId, { regenerate: true });

        toast.success('Invoice PDF regenerated');

      } else if (action === 'email') {

        const status = await sendInvoiceByEmail(invoiceId);

        if (status === 'sent') toast.success('Invoice emailed to tenant');

        else if (status === 'skipped') toast.warning('EmailJS is not configured');

        else toast.error('Failed to send invoice email');

      } else {

        const status = await generateAndSendInvoice(invoiceId);

        if (status === 'sent') toast.success('Invoice regenerated and emailed');

        else toast.warning('PDF generated; email delivery issue');

      }

    } catch (err) {

      toast.error(getFirebaseErrorMessage(err));

    } finally {

      setActionLoading(null);

    }

  };



  const exportCsv = () => {

    const headers = [

      'Invoice',

      'Tenant',

      'Property',

      'Unit',

      'Amount',

      'Late Fee',

      'Total',

      'Due',

      'Status',

      'Email Status',

      'PDF Generated',

    ];

    const rows = filtered.map((i) => [

      i.invoiceNumber,

      i.tenantName,

      i.propertyName ?? '',

      i.unitLabel,

      i.amount,

      i.lateFee ?? 0,

      i.amount + (i.lateFee ?? 0),

      i.dueDate,

      i.status,

      i.emailStatus ?? 'not_sent',

      i.pdfFile?.generatedAt ?? '',

    ]);

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

          <p className="text-sm text-muted-foreground">

            Generate PDF invoices, email statements, and track delivery history

          </p>

        </div>

        <div className="flex gap-2 flex-wrap">

          <Button variant="primary" onClick={() => setShowForm(true)}>

            <Plus className="w-4 h-4 mr-2" />New Invoice

          </Button>

          <Button variant="outline" onClick={exportCsv}>

            <Download className="w-4 h-4 mr-2" />Export CSV

          </Button>

        </div>

      </div>



      {!isEmailConfigured() && (

        <Card className="border-amber-200 bg-amber-50/50">

          <p className="text-sm text-amber-800">

            Email delivery is not configured. Set{' '}
            <code>VITE_EMAILJS_SERVICE_ID</code>, <code>VITE_EMAILJS_TEMPLATE_ID</code>, and{' '}
            <code>VITE_EMAILJS_PUBLIC_KEY</code> in Netlify environment variables (scoped to
            builds), then trigger a new deploy — Vite only reads these at build time.

          </p>

        </Card>

      )}



      {showForm && (

        <Card>

          <h3 className="font-semibold mb-4">Create Billing Statement</h3>

          <form onSubmit={handleCreateInvoice} className="grid sm:grid-cols-2 gap-4">

            <FormSelect

              label="Tenant"

              required

              fieldKey="tenantId"

              error={fieldErrors.tenantId}

              value={form.tenantId}

              onChange={(e) => {

                const t = tenants.find((x) => x.id === e.target.value);

                setForm({

                  ...form,

                  tenantId: e.target.value,

                  amount: t ? String(t.rent) : '',

                });

                setFieldErrors((p) => clearFieldError(p, 'tenantId'));

              }}

            >

              <option value="">Select tenant</option>

              {tenants.map((t) => (

                <option key={t.id} value={t.id}>

                  {t.name} — {t.unitLabel}

                </option>

              ))}

            </FormSelect>

            <Input

              label="Amount (PHP)"

              type="number"

              required

              fieldKey="amount"

              error={fieldErrors.amount}

              value={form.amount}

              onChange={(e) => {

                setForm({ ...form, amount: e.target.value });

                setFieldErrors((p) => clearFieldError(p, 'amount'));

              }}

            />

            <Input

              label="Due Date"

              type="date"

              required

              fieldKey="dueDate"

              error={fieldErrors.dueDate}

              value={form.dueDate}

              onChange={(e) => {

                handleDueDateChange(e.target.value);

                setFieldErrors((p) => clearFieldError(p, 'dueDate'));

              }}

            />

            <Input

              label="Late Fee"

              type="number"

              fieldKey="lateFee"

              value={form.lateFee}

              onChange={(e) => setForm({ ...form, lateFee: e.target.value })}

            />

            <Input

              label="Billing Period Start"

              type="date"

              fieldKey="billingPeriodStart"

              value={form.billingPeriodStart}

              onChange={(e) => setForm({ ...form, billingPeriodStart: e.target.value })}

            />

            <Input

              label="Billing Period End"

              type="date"

              fieldKey="billingPeriodEnd"

              value={form.billingPeriodEnd}

              onChange={(e) => setForm({ ...form, billingPeriodEnd: e.target.value })}

            />

            <div className="sm:col-span-2">

              <Textarea

                label="Notes"

                fieldKey="notes"

                value={form.notes}

                onChange={(e) => setForm({ ...form, notes: e.target.value })}

                placeholder="Additional billing notes for the statement..."

              />

            </div>

            <label className="sm:col-span-2 flex items-center gap-2 text-sm">

              <input

                type="checkbox"

                checked={form.sendEmail}

                onChange={(e) => setForm({ ...form, sendEmail: e.target.checked })}

              />

              Generate PDF and email to tenant after creation

            </label>

            <div className="sm:col-span-2 flex gap-2">

              <Button type="submit" variant="primary" loading={submitting}>

                Create Invoice

              </Button>

              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>

                Cancel

              </Button>

            </div>

          </form>

        </Card>

      )}



      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        <Card>

          <div className="flex items-center gap-3">

            <CheckCircle2 className="w-8 h-8 text-emerald-600" />

            <div>

              <p className="text-sm text-muted-foreground">Collected</p>

              <p className="text-xl font-semibold">{formatCurrency(totalRevenue)}</p>

            </div>

          </div>

        </Card>

        <Card>

          <div className="flex items-center gap-3">

            <DollarSign className="w-8 h-8 text-amber-600" />

            <div>

              <p className="text-sm text-muted-foreground">Pending</p>

              <p className="text-xl font-semibold">{formatCurrency(pendingAmount)}</p>

            </div>

          </div>

        </Card>

        <Card>

          <div className="flex items-center gap-3">

            <AlertCircle className="w-8 h-8 text-red-600" />

            <div>

              <p className="text-sm text-muted-foreground">Overdue</p>

              <p className="text-xl font-semibold">{formatCurrency(overdueAmount)}</p>

            </div>

          </div>

        </Card>

      </div>



      <Card>

        <div className="flex flex-col sm:flex-row gap-4">

          <div className="relative flex-1">

            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />

            <Input

              placeholder="Search invoices..."

              value={searchQuery}

              onChange={(e) => setSearchQuery(e.target.value)}

              className="pl-10"

            />

          </div>

          <select

            className="h-9 rounded-md border px-3"

            value={statusFilter}

            onChange={(e) => setStatusFilter(e.target.value)}

          >

            <option value="all">All Status</option>

            <option value="paid">Paid</option>

            <option value="pending">Pending</option>

            <option value="overdue">Overdue</option>

          </select>

        </div>

      </Card>



      <Card padding={false} className="overflow-x-auto">

        <table className="w-full min-w-[900px]">

          <thead className="bg-muted/50 border-b">

            <tr>

              <th className="text-left px-4 py-4 text-sm text-muted-foreground">Invoice</th>

              <th className="text-left px-4 py-4 text-sm text-muted-foreground">Tenant</th>

              <th className="text-left px-4 py-4 text-sm text-muted-foreground">Amount</th>

              <th className="text-left px-4 py-4 text-sm text-muted-foreground">Due</th>

              <th className="text-left px-4 py-4 text-sm text-muted-foreground">Status</th>

              <th className="text-left px-4 py-4 text-sm text-muted-foreground">Delivery</th>

              <th className="text-left px-4 py-4 text-sm text-muted-foreground">Actions</th>

            </tr>

          </thead>

          <tbody className="divide-y">

            {filtered.map((inv) => (

              <tr key={inv.id} className="hover:bg-accent/50">

                <td className="px-4 py-4 font-medium">{inv.invoiceNumber}</td>

                <td className="px-4 py-4">

                  {inv.tenantName}

                  <br />

                  <span className="text-xs text-muted-foreground">

                    {inv.propertyName ?? ''} · {inv.unitLabel}

                  </span>

                </td>

                <td className="px-4 py-4">

                  {formatCurrency(inv.amount)}

                  {(inv.lateFee ?? 0) > 0 && (

                    <span className="block text-xs text-red-600">

                      +{formatCurrency(inv.lateFee!)} late fee

                    </span>

                  )}

                </td>

                <td className="px-4 py-4 text-sm">{formatDate(inv.dueDate)}</td>

                <td className="px-4 py-4">{getStatusBadge(inv.status)}</td>

                <td className="px-4 py-4">

                  <div className="flex flex-col gap-1">

                    {emailStatusBadge(inv.emailStatus)}

                    {inv.pdfFile && (

                      <span className="text-xs text-muted-foreground flex items-center gap-1">

                        <FileText className="w-3 h-3" /> PDF ready

                      </span>

                    )}

                  </div>

                </td>

                <td className="px-4 py-4">

                  <div className="flex flex-wrap gap-1">

                    <Button

                      variant="ghost"

                      size="sm"

                      title="Download PDF"

                      loading={actionLoading === `download-${inv.id}`}

                      onClick={() => runInvoiceAction(inv.id, 'download', inv)}

                    >

                      <Download className="w-4 h-4" />

                    </Button>

                    <Button

                      variant="ghost"

                      size="sm"

                      title="Regenerate PDF"

                      loading={actionLoading === `generate-${inv.id}`}

                      onClick={() => runInvoiceAction(inv.id, 'generate', inv)}

                    >

                      <RefreshCw className="w-4 h-4" />

                    </Button>

                    <Button

                      variant="ghost"

                      size="sm"

                      title="Email invoice"

                      loading={actionLoading === `email-${inv.id}`}

                      onClick={() => runInvoiceAction(inv.id, 'email', inv)}

                    >

                      <Mail className="w-4 h-4" />

                    </Button>

                    <Button

                      variant="ghost"

                      size="sm"

                      title="Delivery history"

                      onClick={() => setSelectedInvoice(inv)}

                    >

                      <History className="w-4 h-4" />

                    </Button>

                    {inv.status !== 'paid' && (

                      <Button variant="ghost" size="sm" onClick={() => handleMarkPaid(inv)}>

                        Mark Paid

                      </Button>

                    )}

                  </div>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </Card>



      {selectedInvoice && (

        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">

          <Card className="w-full max-w-lg max-h-[80vh] overflow-y-auto">

            <div className="flex justify-between items-start mb-4">

              <div>

                <h3 className="font-semibold">Invoice {selectedInvoice.invoiceNumber}</h3>

                <p className="text-sm text-muted-foreground">Delivery & generation history</p>

              </div>

              <button type="button" onClick={() => setSelectedInvoice(null)}>

                <X className="w-5 h-5" />

              </button>

            </div>



            <div className="space-y-3 text-sm mb-4">

              <div className="flex justify-between">

                <span className="text-muted-foreground">Tenant</span>

                <span>{selectedInvoice.tenantName}</span>

              </div>

              <div className="flex justify-between">

                <span className="text-muted-foreground">Billing Period</span>

                <span>

                  {selectedInvoice.billingPeriodStart

                    ? `${formatDate(selectedInvoice.billingPeriodStart)} – ${formatDate(selectedInvoice.billingPeriodEnd!)}`

                    : '—'}

                </span>

              </div>

              <div className="flex justify-between">

                <span className="text-muted-foreground">Total Due</span>

                <span className="font-semibold">

                  {formatCurrency(selectedInvoice.amount + (selectedInvoice.lateFee ?? 0))}

                </span>

              </div>

              {selectedInvoice.pdfFile && (

                <div className="flex justify-between">

                  <span className="text-muted-foreground">PDF Generated</span>

                  <span>{formatDate(selectedInvoice.pdfFile.generatedAt)}</span>

                </div>

              )}

            </div>



            <h4 className="font-medium mb-2">History</h4>

            {(selectedInvoice.deliveryHistory ?? []).length === 0 ? (

              <p className="text-sm text-muted-foreground">No delivery records yet.</p>

            ) : (

              <div className="space-y-2">

                {[...(selectedInvoice.deliveryHistory ?? [])].reverse().map((record, idx) => (

                  <div key={idx} className="border-l-2 border-primary/30 pl-3 py-1 text-sm">

                    <p className="text-muted-foreground">{formatDate(record.sentAt)}</p>

                    <p>

                      {record.regenerated ? 'PDF regenerated' : record.status === 'sent' ? 'Emailed to tenant' : record.status === 'failed' ? 'Email failed' : 'PDF generated'}

                      {record.error && <span className="text-red-600"> — {record.error}</span>}

                    </p>

                  </div>

                ))}

              </div>

            )}



            <div className="flex gap-2 mt-4 flex-wrap">

              <Button

                variant="outline"

                size="sm"

                loading={actionLoading === `send-${selectedInvoice.id}`}

                onClick={() => runInvoiceAction(selectedInvoice.id, 'send', selectedInvoice)}

              >

                Regenerate & Send

              </Button>

              <Button variant="outline" size="sm" onClick={() => setSelectedInvoice(null)}>

                Close

              </Button>

            </div>

          </Card>

        </div>

      )}

    </div>

  );

};


