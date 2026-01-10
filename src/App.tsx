import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { RBACProvider } from "@/contexts/RBACContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import "@/i18n";

import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Properties from "./pages/Properties";
import Units from "./pages/Units";
import Tenants from "./pages/Tenants";
import Billing from "./pages/Billing";
import Maintenance from "./pages/Maintenance";
import Messages from "./pages/Messages";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Help from "./pages/Help";
import Notifications from "./pages/Notifications";
import AuditLogs from "./pages/AuditLogs";
import TenantPortal from "./pages/TenantPortal";
import EmployeePortal from "./pages/EmployeePortal";
import AdminPortal from "./pages/AdminPortal";
import UserNotifications from "./pages/UserNotifications";
import WaterData from "./pages/WaterData";
import Employees from "./pages/Employees";
import NotificationLogs from "./pages/NotificationLogs";
import PropertyDetail from "./pages/PropertyDetail";
import Onboarding from "./pages/Onboarding";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <RBACProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/auth/verify-otp" element={<Auth />} />
                <Route path="/onboarding" element={<Onboarding />} />

                {/* Super Admin only routes */}
                <Route path="/admin-portal" element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <AdminPortal />
                  </ProtectedRoute>
                } />

                {/* Landlord and Super Admin routes */}
                <Route path="/dashboard" element={
                  <ProtectedRoute allowedRoles={['super_admin', 'landlord']}>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/properties" element={
                  <ProtectedRoute allowedRoles={['super_admin', 'landlord']}>
                    <Properties />
                  </ProtectedRoute>
                } />
                <Route path="/properties/:id" element={
                  <ProtectedRoute allowedRoles={['super_admin', 'landlord']}>
                    <PropertyDetail />
                  </ProtectedRoute>
                } />
                <Route path="/units" element={
                  <ProtectedRoute allowedRoles={['super_admin', 'landlord', 'employee']}>
                    <Units />
                  </ProtectedRoute>
                } />
                <Route path="/tenants" element={
                  <ProtectedRoute allowedRoles={['super_admin', 'landlord', 'employee']}>
                    <Tenants />
                  </ProtectedRoute>
                } />
                <Route path="/billing" element={
                  <ProtectedRoute allowedRoles={['super_admin', 'landlord']}>
                    <Billing />
                  </ProtectedRoute>
                } />
                <Route path="/employees" element={
                  <ProtectedRoute allowedRoles={['super_admin', 'landlord']}>
                    <Employees />
                  </ProtectedRoute>
                } />
                <Route path="/water-data" element={
                  <ProtectedRoute allowedRoles={['super_admin', 'landlord']}>
                    <WaterData />
                  </ProtectedRoute>
                } />
                <Route path="/reports" element={
                  <ProtectedRoute allowedRoles={['super_admin', 'landlord']}>
                    <Reports />
                  </ProtectedRoute>
                } />
                <Route path="/notifications" element={
                  <ProtectedRoute allowedRoles={['super_admin', 'landlord']}>
                    <Notifications />
                  </ProtectedRoute>
                } />
                <Route path="/audit-logs" element={
                  <ProtectedRoute allowedRoles={['super_admin', 'landlord']}>
                    <AuditLogs />
                  </ProtectedRoute>
                } />
                <Route path="/notification-logs" element={
                  <ProtectedRoute allowedRoles={['super_admin', 'landlord']}>
                    <NotificationLogs />
                  </ProtectedRoute>
                } />

                {/* Landlord, Employee routes */}
                <Route path="/maintenance" element={
                  <ProtectedRoute allowedRoles={['super_admin', 'landlord', 'employee']}>
                    <Maintenance />
                  </ProtectedRoute>
                } />

                {/* All authenticated users */}
                <Route path="/messages" element={
                  <ProtectedRoute allowedRoles={['super_admin', 'landlord', 'employee', 'tenant']}>
                    <Messages />
                  </ProtectedRoute>
                } />
                <Route path="/settings" element={
                  <ProtectedRoute allowedRoles={['super_admin', 'landlord', 'employee', 'tenant']}>
                    <Settings />
                  </ProtectedRoute>
                } />
                <Route path="/help" element={
                  <ProtectedRoute allowedRoles={['super_admin', 'landlord', 'employee', 'tenant']}>
                    <Help />
                  </ProtectedRoute>
                } />
                <Route path="/user-notifications" element={
                  <ProtectedRoute allowedRoles={['super_admin', 'landlord', 'employee', 'tenant']}>
                    <UserNotifications />
                  </ProtectedRoute>
                } />

                {/* Employee only routes */}
                <Route path="/employee-portal" element={
                  <ProtectedRoute allowedRoles={['employee']}>
                    <EmployeePortal />
                  </ProtectedRoute>
                } />

                {/* Tenant only routes */}
                <Route path="/tenant-portal" element={
                  <ProtectedRoute allowedRoles={['tenant']}>
                    <TenantPortal />
                  </ProtectedRoute>
                } />

                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </RBACProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
