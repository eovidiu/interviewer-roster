import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { ReactNode, lazy, Suspense } from "react";
import { AuthProvider } from "@/polymet/data/auth-context";
import { DashboardLayout } from "@/polymet/layouts/dashboard-layout";
import { useAuth } from "@/polymet/data/auth-context";
import { ErrorBoundary } from "@/components/error-boundary";

// Lazy load page components for better performance
const DashboardPage = lazy(() => import("@/polymet/pages/dashboard-page").then(module => ({ default: module.DashboardPage })));
const InterviewersPage = lazy(() => import("@/polymet/pages/interviewers-page").then(module => ({ default: module.InterviewersPage })));
const EventsPage = lazy(() => import("@/polymet/pages/events-page").then(module => ({ default: module.EventsPage })));
const SchedulePage = lazy(() => import("@/polymet/pages/schedule-page").then(module => ({ default: module.SchedulePage })));
const MarkInterviewsPage = lazy(() => import("@/polymet/pages/mark-interviews-page").then(module => ({ default: module.MarkInterviewsPage })));
const SettingsPage = lazy(() => import("@/polymet/pages/settings-page").then(module => ({ default: module.SettingsPage })));
const DatabaseManagementPage = lazy(() => import("@/polymet/pages/database-management-page").then(module => ({ default: module.DatabaseManagementPage })));
const AuditLogsPage = lazy(() => import("@/polymet/pages/audit-logs-page").then(module => ({ default: module.AuditLogsPage })));
const UserManagementPage = lazy(() => import("@/polymet/pages/user-management-page").then(module => ({ default: module.UserManagementPage })));
const LoginPage = lazy(() => import("@/polymet/pages/login-page").then(module => ({ default: module.LoginPage })));

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

// Loading component for route transitions
function RouteLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-muted-foreground">Loading...</div>
    </div>
  );
}

export default function InterviewRosterApp() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Suspense fallback={<RouteLoading />}>
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
              <ProtectedRoute allowedRoles={["talent", "admin"]}>
                <DashboardLayout>
                  <InterviewersPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/events"
            element={
              <ProtectedRoute allowedRoles={["talent", "admin"]}>
                <DashboardLayout>
                  <EventsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/schedule"
            element={
              <ProtectedRoute allowedRoles={["talent", "admin"]}>
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

          <Route
            path="/users"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <DashboardLayout>
                  <UserManagementPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </Suspense>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}
