import { createBrowserRouter } from "react-router";
import { RootLayout } from "./components/layouts/RootLayout";
import { AdminLayout } from "./components/layouts/AdminLayout";
import { TenantLayout } from "./components/layouts/TenantLayout";
import { Login } from "./components/auth/Login";
import { Register } from "./components/auth/Register";
import { AdminDashboard } from "./components/admin/AdminDashboard";
import { PropertyManagement } from "./components/admin/PropertyManagement";
import { TenantManagement } from "./components/admin/TenantManagement";
import { LeaseManagement } from "./components/admin/LeaseManagement";
import { BillingPayments } from "./components/admin/BillingPayments";
import { Maintenance } from "./components/admin/Maintenance";
import { Reports } from "./components/admin/Reports";
import { TenantHome } from "./components/tenant/TenantHome";
import { TenantPayments } from "./components/tenant/TenantPayments";
import { TenantMaintenance } from "./components/tenant/TenantMaintenance";
import { TenantProfile } from "./components/tenant/TenantProfile";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: Login },
      { path: "login", Component: Login },
      { path: "register", Component: Register },
    ],
  },
  {
    path: "/admin",
    Component: AdminLayout,
    children: [
      { index: true, Component: AdminDashboard },
      { path: "properties", Component: PropertyManagement },
      { path: "tenants", Component: TenantManagement },
      { path: "leases", Component: LeaseManagement },
      { path: "billing", Component: BillingPayments },
      { path: "maintenance", Component: Maintenance },
      { path: "reports", Component: Reports },
    ],
  },
  {
    path: "/tenant",
    Component: TenantLayout,
    children: [
      { index: true, Component: TenantHome },
      { path: "payments", Component: TenantPayments },
      { path: "maintenance", Component: TenantMaintenance },
      { path: "profile", Component: TenantProfile },
    ],
  },
]);
