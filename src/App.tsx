import * as React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppSettingsProvider } from "@/contexts/AppSettingsContext";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Documents from "./pages/Documents";
import CommissionSummary from "./pages/CommissionSummary";
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
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
                <Locations />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/leads"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Leads />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/maintenance"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Maintenance />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/documents"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Documents />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/commission-summary"
          element={
            <ProtectedRoute>
              <AppLayout>
                <CommissionSummary />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory"
          element={
            <ProtectedRoute>
              <AppLayout>
                <InventoryTracker />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/revenue"
          element={
            <ProtectedRoute>
              <AppLayout>
                <RevenueTracker />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/mileage"
          element={
            <ProtectedRoute>
              <AppLayout>
                <MileageTracker />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/receipts"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Receipts />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Reports />
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
                <Team />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
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
                {/* Public reporting route with /report prefix - e.g., /report/downtown-pizza/claw-1 */}
                <Route path="/report/:locationSlug/:unitCode" element={<ReportIssue />} />
                {/* Legacy UUID route for existing QR codes - e.g., /m/77ad0e7c-8304-4dbf-9506-6085d8148255 */}
                <Route path="/m/:machineId" element={<ReportIssue />} />
               {/* Password reset route - public, handles recovery token */}
               <Route path="/reset-password" element={<ResetPassword />} />
                {/* All other routes go through AuthProvider */}
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
