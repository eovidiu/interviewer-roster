import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { ReactNode } from "react";
import { AuthProvider } from "@/polymet/data/auth-context";
import { DashboardLayout } from "@/polymet/layouts/dashboard-layout";
import { DashboardPage } from "@/polymet/pages/dashboard-page";
import { InterviewersPage } from "@/polymet/pages/interviewers-page";
import { EventsPage } from "@/polymet/pages/events-page";
import { SchedulePage } from "@/polymet/pages/schedule-page";
import { MarkInterviewsPage } from "@/polymet/pages/mark-interviews-page";
import { SettingsPage } from "@/polymet/pages/settings-page";
import { DatabaseManagementPage } from "@/polymet/pages/database-management-page";
import { AuditLogsPage } from "@/polymet/pages/audit-logs-page";
import { LoginPage } from "@/polymet/pages/login-page";
import { useAuth } from "@/polymet/data/auth-context";

type Role = "viewer" | "talent" | "admin";

function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: ReactNode;
  allowedRoles?: Role[];
}) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Checking permissions...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default function InterviewRosterApp() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <DashboardPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/interviewers"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <InterviewersPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/events"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <EventsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/schedule"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <SchedulePage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/mark-interviews"
            element={
              <ProtectedRoute allowedRoles={["talent", "admin"]}>
                <DashboardLayout>
                  <MarkInterviewsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <DashboardLayout>
                  <SettingsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/database"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <DashboardLayout>
                  <DatabaseManagementPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/audit-logs"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <DashboardLayout>
                  <AuditLogsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
