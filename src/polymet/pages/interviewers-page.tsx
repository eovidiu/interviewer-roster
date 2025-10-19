import { useState, useEffect } from "react";
import { InterviewerTable } from "@/polymet/components/interviewer-table";
import { AddInterviewerDialog } from "@/polymet/components/add-interviewer-dialog";
import { ExportDialog } from "@/polymet/components/export-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ErrorAlert } from "@/components/ui/error-alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PlusIcon,
  DownloadIcon,
  UsersIcon,
  CheckCircle2Icon,
} from "lucide-react";
import { db } from "@/polymet/data/database-service";
import {
  exportAuditLogsCsv,
  exportEventsCsv,
  exportInterviewersCsv,
} from "@/lib/csv-utils";
import type { ExportTypeOption } from "@/polymet/components/export-dialog";
import type { Interviewer } from "@/polymet/data/mock-interviewers-data";
import { useAuth } from "@/polymet/data/auth-context";

export function InterviewersPage() {
  const [interviewers, setInterviewers] = useState<Interviewer[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [editingInterviewer, setEditingInterviewer] =
    useState<Interviewer | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [interviewerToDelete, setInterviewerToDelete] =
    useState<Interviewer | null>(null);
  const [errorAlertOpen, setErrorAlertOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { user } = useAuth();
  const userRole = user?.role ?? "viewer";
  const auditContext = user
    ? { userEmail: user.email, userName: user.name }
    : undefined;

  useEffect(() => {
    loadInterviewers();
  }, []);

  const loadInterviewers = async () => {
    try {
      setLoading(true);
      const data = await db.getInterviewers();
      setInterviewers(data);
    } catch (error) {
      console.error("Failed to load interviewers:", error);
    } finally {
      setLoading(false);
    }
  };

  const activeInterviewers = interviewers.filter((i) => i.is_active).length;

  const totalSkills = new Set(interviewers.flatMap((i) => i.skills)).size;

  const handleEdit = (interviewer: Interviewer) => {
    setEditingInterviewer(interviewer);
    setAddDialogOpen(true);
  };

  const handleDelete = (interviewer: Interviewer) => {
    setInterviewerToDelete(interviewer);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!interviewerToDelete) return;

    try {
      await db.deleteInterviewer(interviewerToDelete.email, auditContext);
      await loadInterviewers();
    } catch (error) {
      console.error("Failed to delete interviewer:", error);
      setErrorMessage("Failed to delete interviewer");
      setErrorAlertOpen(true);
    } finally {
      setInterviewerToDelete(null);
    }
  };

  const handleToggleActive = async (interviewer: Interviewer) => {
    try {
      await db.updateInterviewer(
        interviewer.email,
        {
          is_active: !interviewer.is_active,
        },
        auditContext
      );
      await loadInterviewers();
    } catch (error) {
      console.error("Failed to toggle interviewer status:", error);
      setErrorMessage("Failed to update interviewer status");
      setErrorAlertOpen(true);
    }
  };

  const handleAddInterviewer = async (data: Partial<Interviewer>) => {
    try {
      if (editingInterviewer) {
        await db.updateInterviewer(
          editingInterviewer.email,
          data,
          auditContext
        );
      } else {
        await db.createInterviewer(
          data as Omit<Interviewer, "id" | "created_at" | "updated_at">,
          auditContext
        );
      }
      await loadInterviewers();
      setEditingInterviewer(null);
      setAddDialogOpen(false);
    } catch (error) {
      console.error("Failed to save interviewer:", error);
      setErrorMessage("Failed to save interviewer");
      setErrorAlertOpen(true);
    }
  };

  const handleExport = async (type: ExportTypeOption) => {
    try {
      if (type === "interviewers") {
        if (interviewers.length === 0) {
          setErrorMessage("No interviewers available to export.");
          setErrorAlertOpen(true);
          return;
        }
        exportInterviewersCsv(interviewers);
        return;
      }

      if (type === "events") {
        const allEvents = await db.getInterviewEvents();
        if (allEvents.length === 0) {
          setErrorMessage("No interview events available to export.");
          setErrorAlertOpen(true);
          return;
        }
        exportEventsCsv(allEvents);
        return;
      }

      if (type === "audit_logs") {
        const logs = await db.getAuditLogs();
        if (logs.length === 0) {
          setErrorMessage("No audit logs available to export.");
          setErrorAlertOpen(true);
          return;
        }
        exportAuditLogsCsv(logs);
        return;
      }

      setErrorMessage("Unsupported export type selected.");
      setErrorAlertOpen(true);
    } catch (error) {
      console.error("Failed to export data:", error);
      setErrorMessage("Failed to export data. Please try again.");
      setErrorAlertOpen(true);
    }
  };

  const canAddEdit = userRole === "admin" || userRole === "talent";

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Interviewers</h1>
          <p className="text-muted-foreground mt-2">Loading interviewers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Interviewers</h1>
          <p className="text-muted-foreground mt-2">
            Manage interviewer roster and availability
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setExportDialogOpen(true)}>
            <DownloadIcon className="h-4 w-4 mr-2" />
            Export
          </Button>
          {canAddEdit && (
            <Button
              onClick={() => {
                setEditingInterviewer(null);
                setAddDialogOpen(true);
              }}
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Interviewer
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Interviewers
            </CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{interviewers.length}</div>
            <p className="text-xs text-muted-foreground mt-1">In the roster</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle2Icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeInterviewers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Available for scheduling
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Skills</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSkills}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Unique skill areas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Interviewers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Interviewer Roster</CardTitle>
        </CardHeader>
        <CardContent>
          <InterviewerTable
            interviewers={interviewers}
            userRole={userRole}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleActive={handleToggleActive}
          />
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AddInterviewerDialog
        open={addDialogOpen}
        onOpenChange={(open) => {
          setAddDialogOpen(open);
          if (!open) setEditingInterviewer(null);
        }}
        interviewer={editingInterviewer}
        userRole={userRole}
        onSubmit={handleAddInterviewer}
      />

      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        userRole={userRole}
        onExport={handleExport}
      />

      {/* Accessible Confirm Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Confirm Deletion"
        description={`Are you sure you want to delete ${interviewerToDelete?.name}? This action cannot be undone.`}
        onConfirm={confirmDelete}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />

      {/* Accessible Error Alert */}
      <ErrorAlert
        open={errorAlertOpen}
        onOpenChange={setErrorAlertOpen}
        message={errorMessage}
      />
    </div>
  );
}
