import { createBrowserRouter, Navigate } from "react-router";
import { RootLayout } from "./components/layouts/RootLayout";
import { AdminLayout } from "./components/layouts/AdminLayout";
import { TenantLayout } from "./components/layouts/TenantLayout";
import { Login } from "./components/auth/Login";
import { Register } from "./components/auth/Register";
import { ForgotPassword } from "./components/auth/ForgotPassword";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AdminDashboard } from "./components/admin/AdminDashboard";
import { PropertyManagement } from "./components/admin/PropertyManagement";
import { TenantManagement } from "./components/admin/TenantManagement";
import { LeaseManagement } from "./components/admin/LeaseManagement";
import { BillingPayments } from "./components/admin/BillingPayments";
import { Maintenance } from "./components/admin/Maintenance";
import { Reports } from "./components/admin/Reports";
import { NoticesAdmin } from "./components/admin/NoticesAdmin";
import { TenantHome } from "./components/tenant/TenantHome";
import { TenantPayments } from "./components/tenant/TenantPayments";
import { PayMongoCheckout } from "./components/tenant/PayMongoCheckout";
import { TenantMaintenance } from "./components/tenant/TenantMaintenance";
import { TenantProfile } from "./components/tenant/TenantProfile";
import { TenantLease } from "./components/tenant/TenantLease";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: Login },
      { path: "login", Component: Login },
      { path: "register", Component: Register },
      { path: "forgot-password", Component: ForgotPassword },
    ],
  },
  {
    path: "/admin",
    element: <ProtectedRoute allowedRole="admin" />,
    children: [
      {
        Component: AdminLayout,
        children: [
          { index: true, Component: AdminDashboard },
          { path: "properties", Component: PropertyManagement },
          { path: "tenants", Component: TenantManagement },
          { path: "leases", Component: LeaseManagement },
          { path: "billing", Component: BillingPayments },
          { path: "maintenance", Component: Maintenance },
          { path: "reports", Component: Reports },
          { path: "notices", Component: NoticesAdmin },
        ],
      },
    ],
  },
  {
    path: "/tenant",
    element: <ProtectedRoute allowedRole="tenant" />,
    children: [
      {
        Component: TenantLayout,
        children: [
          { index: true, Component: TenantHome },
          { path: "lease", Component: TenantLease },
          { path: "payments", Component: TenantPayments },
          { path: "payments/checkout", Component: PayMongoCheckout },
          { path: "maintenance", Component: TenantMaintenance },
          { path: "profile", Component: TenantProfile },
        ],
      },
    ],
  },
  { path: "*", element: <Navigate to="/login" replace /> },
]);
