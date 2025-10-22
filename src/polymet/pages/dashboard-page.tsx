import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { KpiMetricCard } from "@/polymet/components/kpi-metric-card";
import { StatusBadge } from "@/polymet/components/status-badge";
import { AddInterviewerDialog } from "@/polymet/components/add-interviewer-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ActivityIcon,
  CalendarIcon,
  UsersIcon,
  TrendingUpIcon,
  ClockIcon,
  AlertCircleIcon,
} from "lucide-react";
import { db } from "@/polymet/data/database-service";
import { useAuth } from "@/polymet/data/auth-context";
import type { InterviewEvent } from "@/polymet/data/mock-interview-events-data";
import type { Interviewer } from "@/polymet/data/mock-interviewers-data";

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [interviewEvents, setInterviewEvents] = useState<InterviewEvent[]>([]);
  const [interviewers, setInterviewers] = useState<Interviewer[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const userRole = user?.role ?? "viewer";
  const canAddInterviewer = userRole === "admin" || userRole === "talent";
  const auditContext = user
    ? { userEmail: user.email, userName: user.name }
    : undefined;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [eventsData, interviewersData] = await Promise.all([
        db.getInterviewEvents(),
        db.getInterviewers(),
      ]);
      setInterviewEvents(eventsData);
      setInterviewers(interviewersData);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddInterviewer = async (data: Partial<Interviewer>) => {
    try {
      await db.createInterviewer(
        data as Omit<Interviewer, "id" | "created_at" | "updated_at">,
        auditContext
      );
      await loadData(); // Reload data to show new interviewer
      setAddDialogOpen(false);
    } catch (error) {
      console.error("Failed to add interviewer:", error);
    }
  };

  // Memoize KPI calculations to avoid recalculating on every render
  // Must be before conditional returns to follow Rules of Hooks
  const kpiMetrics = useMemo(() => {
    const totalEvents = interviewEvents.length;
    const attendedEvents = interviewEvents.filter(
      (e) => e.status === "attended"
    ).length;
    const ghostedEvents = interviewEvents.filter(
      (e) => e.status === "ghosted"
    ).length;
    const pendingEvents = interviewEvents.filter(
      (e) => e.status === "pending"
    ).length;
    const noShowRate =
      totalEvents > 0 ? ((ghostedEvents / totalEvents) * 100).toFixed(1) : "0.0";

    const activeInterviewers = interviewers.filter((i) => i.is_active).length;
    const calendarSyncEnabled = interviewers.filter(
      (i) => i.calendar_sync_enabled
    ).length;

    const interviewsPerWeek =
      activeInterviewers > 0
        ? (totalEvents / activeInterviewers / 4).toFixed(1)
        : "0.0";

    return {
      totalEvents,
      attendedEvents,
      ghostedEvents,
      pendingEvents,
      noShowRate,
      activeInterviewers,
      calendarSyncEnabled,
      interviewsPerWeek,
    };
  }, [interviewEvents, interviewers]);

  // Memoize recent events sorting to avoid re-sorting on every render
  const recentEvents = useMemo(
    () =>
      [...interviewEvents]
        .sort(
          (a, b) =>
            new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
        )
        .slice(0, 5),
    [interviewEvents]
  );

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Loading dashboard data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Overview of interview scheduling and roster management
        </p>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiMetricCard
          title="No-Show Rate"
          value={`${kpiMetrics.noShowRate}%`}
          target="< 2%"
          trend={parseFloat(kpiMetrics.noShowRate) < 2 ? "down" : "up"}
          trendValue="0.6%"
          icon={ActivityIcon}
          status={parseFloat(kpiMetrics.noShowRate) < 2 ? "success" : "danger"}
          description="vs last month"
        />

        <KpiMetricCard
          title="Interviews per Week"
          value={kpiMetrics.interviewsPerWeek}
          target="3-5"
          trend="up"
          trendValue="0.8"
          icon={CalendarIcon}
          status={
            parseFloat(kpiMetrics.interviewsPerWeek) >= 3 &&
            parseFloat(kpiMetrics.interviewsPerWeek) <= 5
              ? "success"
              : "warning"
          }
          description="per interviewer"
        />

        <KpiMetricCard
          title="Active Interviewers"
          value={kpiMetrics.activeInterviewers}
          icon={UsersIcon}
          status="neutral"
          description={`${kpiMetrics.calendarSyncEnabled} with calendar sync`}
        />

        <KpiMetricCard
          title="System Uptime"
          value="99.8%"
          target="> 99.5%"
          trend="neutral"
          icon={TrendingUpIcon}
          status="success"
          description="Last 30 days"
        />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Interviews
            </CardTitle>
            <ClockIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiMetrics.pendingEvents}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Require attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Completed This Month
            </CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiMetrics.attendedEvents}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Successfully conducted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">No Shows</CardTitle>
            <AlertCircleIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiMetrics.ghostedEvents}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Candidates didn't attend
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Events */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Interview Events</CardTitle>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="space-y-1">
                  <div className="font-medium">{event.interviewer_email}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatDateTime(event.start_time)}
                  </div>
                  {event.skills_assessed &&
                    event.skills_assessed.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        Skills: {event.skills_assessed.join(", ")}
                      </div>
                    )}
                </div>
                <StatusBadge status={event.status} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      {canAddInterviewer && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                className="w-full"
                onClick={() => setAddDialogOpen(true)}
              >
                <UsersIcon className="h-4 w-4 mr-2" />
                Add Interviewer
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate('/audit-logs')}
              >
                <ActivityIcon className="h-4 w-4 mr-2" />
                View Reports
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Interviewer Dialog */}
      <AddInterviewerDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        userRole={userRole}
        onSubmit={handleAddInterviewer}
      />
    </div>
  );
}
