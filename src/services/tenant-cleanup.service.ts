import { deleteActivity, listActivitiesByTenant } from './activities.service';
import { unlinkTenantFromUser } from './auth.service';
import { deleteInvoice, listInvoicesByTenant } from './invoices.service';
import { forceDeleteLease, listLeasesByTenant } from './leases.service';
import { forceDeleteMaintenanceRequest, listMaintenanceByTenant } from './maintenance.service';
import { deletePaymentMethod, listPaymentMethods } from './payment-methods.service';
import { deletePayment, listPaymentsByTenant } from './payments.service';

export async function cascadeDeleteTenantData(
  tenantId: string,
  tenantUserId?: string,
): Promise<void> {
  const leases = await listLeasesByTenant(tenantId);
  await Promise.all(leases.map((lease) => forceDeleteLease(lease.id, tenantId)));

  const invoices = await listInvoicesByTenant(tenantId);
  await Promise.all(invoices.map((invoice) => deleteInvoice(invoice.id)));

  const payments = await listPaymentsByTenant(tenantId);
  await Promise.all(payments.map((payment) => deletePayment(payment.id)));

  const maintenance = await listMaintenanceByTenant(tenantId);
  await Promise.all(
    maintenance.map((request) => forceDeleteMaintenanceRequest(request.id)),
  );

  const paymentMethods = await listPaymentMethods(tenantId);
  await Promise.all(paymentMethods.map((method) => deletePaymentMethod(method.id)));

  const activities = await listActivitiesByTenant(tenantId);
  await Promise.all(activities.map((activity) => deleteActivity(activity.id)));

  if (tenantUserId) {
    await unlinkTenantFromUser(tenantUserId);
  }
}
