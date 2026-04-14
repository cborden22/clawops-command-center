import * as React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppSettingsProvider } from "@/contexts/AppSettingsContext";
import { TeamContextProvider } from "@/contexts/TeamContext";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { AppLayout } from "@/components/layout/AppLayout";
import { TrialPaywall } from "@/components/trial/TrialPaywall";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import Dashboard from "./pages/Dashboard";
import CalendarPage from "./pages/Calendar";
import InventoryTracker from "./pages/InventoryTracker";
import RevenueTracker from "./pages/RevenueTracker";
import MileageTracker from "./pages/MileageTracker";
import Locations from "./pages/Locations";
import Leads from "./pages/Leads";
import Maintenance from "./pages/Maintenance";
import Receipts from "./pages/Receipts";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Team from "./pages/Team";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import ReportIssue from "./pages/ReportIssue";
import ResetPassword from "./pages/ResetPassword";
import Sales from "./pages/Sales";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ children, allowDuringTrial }: { children: React.ReactNode; allowDuringTrial?: boolean }) {
  const { user, isLoading } = useAuth();
  const { requiresTrialCheckout, isLoading: subLoading } = useFeatureAccess();

  if (isLoading || subLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (requiresTrialCheckout && !allowDuringTrial) {
    return <TrialPaywall />;
  }

  return <>{children}</>;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function ProtectedAppRoutes() {
  return (
    <AuthProvider>
      <TeamContextProvider>
        <Routes>
        <Route
          path="/auth"
          element={
            <AuthRoute>
              <Auth />
            </AuthRoute>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Dashboard />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/locations"
          element={
            <ProtectedRoute>
              <AppLayout>
                <PermissionGuard requiredPermission="canViewLocations">
                  <Locations />
                </PermissionGuard>
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/leads"
          element={
            <ProtectedRoute>
              <AppLayout>
                <PermissionGuard requiredPermission="canViewLeads">
                  <Leads />
                </PermissionGuard>
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/maintenance"
          element={
            <ProtectedRoute>
              <AppLayout>
                <PermissionGuard requiredPermission="canViewMaintenance">
                  <Maintenance />
                </PermissionGuard>
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory"
          element={
            <ProtectedRoute>
              <AppLayout>
                <PermissionGuard requiredPermission="canViewInventory">
                  <InventoryTracker />
                </PermissionGuard>
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/revenue"
          element={
            <ProtectedRoute>
              <AppLayout>
                <PermissionGuard requiredPermission="canViewRevenue">
                  <RevenueTracker />
                </PermissionGuard>
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/mileage"
          element={
            <ProtectedRoute>
              <AppLayout>
                <PermissionGuard requiredPermission="canViewMileage">
                  <MileageTracker />
                </PermissionGuard>
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/receipts"
          element={
            <ProtectedRoute>
              <AppLayout>
                <PermissionGuard requiredPermission="canViewRevenue">
                  <Receipts />
                </PermissionGuard>
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <AppLayout>
                <PermissionGuard requiredPermission="canViewReports">
                  <Reports />
                </PermissionGuard>
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Settings />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/team"
          element={
            <ProtectedRoute>
              <AppLayout>
                <PermissionGuard requiredPermission="isOwner">
                  <Team />
                </PermissionGuard>
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/calendar"
          element={
            <ProtectedRoute>
              <AppLayout>
                <CalendarPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        {/* Redirect old routes to consolidated locations page */}
        <Route path="/map" element={<Navigate to="/locations" replace />} />
        <Route path="/documents" element={<Navigate to="/locations" replace />} />
        <Route path="/commission-summary" element={<Navigate to="/locations" replace />} />
        <Route path="/ar-preview" element={<Navigate to="/locations" replace />} />
        <Route path="*" element={<NotFound />} />
        </Routes>
      </TeamContextProvider>
    </AuthProvider>
  );
}

const App: React.FC = () => {
  console.log('App: Rendering App component');
  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <AppSettingsProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* Public reporting route */}
                <Route path="/report/:locationSlug/:unitCode" element={<ReportIssue />} />
                {/* Legacy UUID route */}
                <Route path="/m/:machineId" element={<ReportIssue />} />
                {/* Password reset */}
                <Route path="/reset-password" element={
                  <AuthProvider>
                    <ResetPassword />
                  </AuthProvider>
                } />
                {/* Public sales page */}
                <Route path="/sales" element={<Sales />} />
                {/* All other routes */}
                <Route path="/*" element={<ProtectedAppRoutes />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AppSettingsProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
};

export default App;
