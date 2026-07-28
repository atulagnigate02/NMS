import { Suspense, lazy, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { Loader } from "@/components/ui/Loader";
const DashboardPage = lazy(() => import("@/pages/DashboardPage").then((m) => ({ default: m.DashboardPage })));
const DevicesPage = lazy(() => import("@/pages/DevicesPage").then((m) => ({ default: m.DevicesPage })));
const DiscoveryPage = lazy(() => import("@/pages/DiscoveryPage").then((m) => ({ default: m.DiscoveryPage })));
const AlertsPage = lazy(() => import("@/pages/AlertsPage").then((m) => ({ default: m.AlertsPage })));
const ReportsPage = lazy(() => import("@/pages/ReportsPage").then((m) => ({ default: m.ReportsPage })));
const UserRolesPage = lazy(() => import("@/pages/UserRolesPage").then((m) => ({ default: m.UserRolesPage })));
const OrganizationsPage = lazy(() => import("@/pages/OrganizationsPage").then((m) => ({ default: m.OrganizationsPage })));
const SitesPage = lazy(() => import("@/pages/SitesPage").then((m) => ({ default: m.SitesPage })));
const VendorsPage = lazy(() => import("@/pages/VendorsPage").then((m) => ({ default: m.VendorsPage })));
const DeviceTypesPage = lazy(() => import("@/pages/DeviceTypesPage").then((m) => ({ default: m.DeviceTypesPage })));
const ThresholdsPage = lazy(() => import("@/pages/ThresholdsPage").then((m) => ({ default: m.ThresholdsPage })));
const AuditLogsPage = lazy(() => import("@/pages/AuditLogsPage").then((m) => ({ default: m.AuditLogsPage })));
const MonitoringPage = lazy(() => import("@/pages/MonitoringPage").then((m) => ({ default: m.MonitoringPage })));
const MonitoringDetailPage = lazy(() => import("@/pages/MonitoringDetailPage").then((m) => ({ default: m.MonitoringDetailPage })));
const pageTitles = {
  "/": "Dashboard",
  "/devices": "Devices",
  "/discovery": "Discovery",
  "/alerts": "Alerts",
  "/reports": "Reports",
  "/users-roles": "Users & Roles",
  "/organizations": "Organizations",
  "/sites": "Sites",
  "/vendors": "Vendors",
  "/device-types": "Device Types",
  "/thresholds": "Thresholds",
  "/audit-logs": "Audit Logs",
  "/monitoring": "Device Monitoring",
  "/monitoring/:deviceId": "Device History"
};
function AppShell({ onLogout }) {
  const location = useLocation();
  const currentPage = pageTitles[location.pathname] ?? "Command Center";
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  return (
    <div className={`app-shell ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar onLogout={onLogout} isCollapsed={isSidebarCollapsed} setIsCollapsed={setIsSidebarCollapsed} />
      <main className="main-content">
        <Navbar title={currentPage} onLogout={onLogout} />
        <div className="page-shell">
          <Suspense fallback={<Loader fullPage label="Loading module..." />}>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/devices" element={<DevicesPage />} />
              <Route path="/discovery" element={<DiscoveryPage />} />
              <Route path="/alerts" element={<AlertsPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/users-roles" element={<UserRolesPage />} />
              <Route path="/organizations" element={<OrganizationsPage />} />
              <Route path="/sites" element={<SitesPage />} />
              <Route path="/vendors" element={<VendorsPage />} />
              <Route path="/device-types" element={<DeviceTypesPage />} />
              <Route path="/thresholds" element={<ThresholdsPage />} />
              <Route path="/audit-logs" element={<AuditLogsPage />} />
              <Route path="/monitoring" element={<MonitoringPage />} />
              <Route path="/monitoring/:deviceId" element={<MonitoringDetailPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </div>
        <Footer />
      </main>
    </div>
  );
}
export {
  AppShell
};
