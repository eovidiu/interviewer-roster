import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/polymet/data/auth-context";
import { DashboardLayout } from "@/polymet/layouts/dashboard-layout";
import { DashboardPage } from "@/polymet/pages/dashboard-page";
import { InterviewersPage } from "@/polymet/pages/interviewers-page";
import { EventsPage } from "@/polymet/pages/events-page";
import { SchedulePage } from "@/polymet/pages/schedule-page";
import { MarkInterviewsPage } from "@/polymet/pages/mark-interviews-page";
import { SettingsPage } from "@/polymet/pages/settings-page";
import { DatabaseManagementPage } from "@/polymet/pages/database-management-page";

export default function InterviewRosterApp() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route
            path="/"
            element={
              <DashboardLayout>
                <DashboardPage />
              </DashboardLayout>
            }
          />

          <Route
            path="/interviewers"
            element={
              <DashboardLayout>
                <InterviewersPage />
              </DashboardLayout>
            }
          />

          <Route
            path="/events"
            element={
              <DashboardLayout>
                <EventsPage />
              </DashboardLayout>
            }
          />

          <Route
            path="/schedule"
            element={
              <DashboardLayout>
                <SchedulePage />
              </DashboardLayout>
            }
          />

          <Route
            path="/mark-interviews"
            element={
              <DashboardLayout>
                <MarkInterviewsPage />
              </DashboardLayout>
            }
          />

          <Route
            path="/settings"
            element={
              <DashboardLayout>
                <SettingsPage />
              </DashboardLayout>
            }
          />

          <Route
            path="/database"
            element={
              <DashboardLayout>
                <DatabaseManagementPage />
              </DashboardLayout>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
