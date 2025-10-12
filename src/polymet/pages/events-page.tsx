import { useState, useEffect } from "react";
import { EventsTable } from "@/polymet/components/events-table";
import { MarkAttendanceDialog } from "@/polymet/components/mark-attendance-dialog";
import { ExportDialog } from "@/polymet/components/export-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DownloadIcon,
  CalendarIcon,
  CheckCircle2Icon,
  XCircleIcon,
  ClockIcon,
} from "lucide-react";
import { db } from "@/polymet/data/database-service";
import {
  exportAuditLogsCsv,
  exportEventsCsv,
  exportInterviewersCsv,
} from "@/lib/csv-utils";
import type { InterviewEvent } from "@/polymet/data/mock-interview-events-data";
import { useAuth } from "@/polymet/data/auth-context";

export function EventsPage() {
  const [events, setEvents] = useState<InterviewEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [markAttendanceDialogOpen, setMarkAttendanceDialogOpen] =
    useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<InterviewEvent | null>(
    null
  );
  const { user } = useAuth();
  const userRole = user?.role ?? "viewer";
  const auditContext = user
    ? { userEmail: user.email, userName: user.name }
    : undefined;

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await db.getInterviewEvents();
      setEvents(data);
    } catch (error) {
      console.error("Failed to load events:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalEvents = events.length;
  const pendingEvents = events.filter((e) => e.status === "pending").length;
  const attendedEvents = events.filter((e) => e.status === "attended").length;
  const ghostedEvents = events.filter((e) => e.status === "ghosted").length;

  const handleMarkAttendance = (event: InterviewEvent) => {
    setSelectedEvent(event);
    setMarkAttendanceDialogOpen(true);
  };

  const handleViewDetails = (event: InterviewEvent) => {
    console.log("View details:", event);
    // In real app, show event details dialog
  };

  const handleSubmitAttendance = async (
    eventId: string,
    status: "attended" | "ghosted" | "cancelled",
    notes: string
  ) => {
    try {
      await db.updateInterviewEvent(
        eventId,
        {
          status,
          notes,
          marked_by: user?.email,
          marked_at: new Date().toISOString(),
        },
        auditContext
      );
      await loadEvents();
      setMarkAttendanceDialogOpen(false);
    } catch (error) {
      console.error("Failed to update attendance:", error);
      alert("Failed to update attendance");
    }
  };

  const handleExport = async (type: string) => {
    try {
      if (type === "events") {
        exportEventsCsv(events);
        return;
      }

      if (type === "interviewers") {
        const roster = await db.getInterviewers();
        exportInterviewersCsv(roster);
        return;
      }

      if (type === "audit_logs") {
        const logs = await db.getAuditLogs();
        exportAuditLogsCsv(logs);
        return;
      }

      alert("Unsupported export type selected.");
    } catch (error) {
      console.error("Failed to export data:", error);
      alert("Failed to export data. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Interview Events</h1>
          <p className="text-muted-foreground mt-2">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Interview Events</h1>
          <p className="text-muted-foreground mt-2">
            Track and manage interview schedules and attendance
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setExportDialogOpen(true)}>
            <DownloadIcon className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEvents}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <ClockIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingEvents}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting attendance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attended</CardTitle>
            <CheckCircle2Icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendedEvents}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Successfully completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">No Shows</CardTitle>
            <XCircleIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ghostedEvents}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Candidate didn't attend
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Events Table */}
      <Card>
        <CardHeader>
          <CardTitle>Interview Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <EventsTable
            events={events}
            userRole={userRole}
            onMarkAttendance={handleMarkAttendance}
            onViewDetails={handleViewDetails}
          />
        </CardContent>
      </Card>

      {/* Dialogs */}
      <MarkAttendanceDialog
        open={markAttendanceDialogOpen}
        onOpenChange={setMarkAttendanceDialogOpen}
        event={selectedEvent}
        onSubmit={handleSubmitAttendance}
      />

      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        userRole={userRole}
        onExport={handleExport}
      />
    </div>
  );
}
