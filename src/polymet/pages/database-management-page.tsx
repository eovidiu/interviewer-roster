import { useState, useEffect, useRef, type ChangeEvent } from "react";
import { db } from "@/polymet/data/database-service";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DatabaseIcon,
  RefreshCwIcon,
  DownloadIcon,
  UploadIcon,
  TrashIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  UsersIcon,
  CalendarIcon,
  FileTextIcon,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/polymet/data/auth-context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  mapCsvRowsToAuditLogs,
  mapCsvRowsToEvents,
  mapCsvRowsToInterviewers,
  parseCsvFile,
} from "@/lib/csv-utils";

export function DatabaseManagementPage() {
  const [stats, setStats] = useState({
    interviewers: 0,
    events: 0,
    auditLogs: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showImportGuide, setShowImportGuide] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { user } = useAuth();
  const auditUserEmail = user?.email ?? "admin@company.com";
  const auditUserName = user?.name ?? "Admin";
  const csvGuides = [
    {
      key: "interviewers",
      title: "Interviewers CSV",
      description:
        "Seeds roster data including roles, skills, and availability flags.",
      columns: [
        "id (optional, auto-generated when omitted)",
        "name (required)",
        "email (required, must be unique)",
        "role (viewer | talent | admin)",
        "skills (semicolon separated list)",
        "is_active (true | false)",
        "timezone (IANA identifier)",
        "calendar_sync_enabled (true | false)",
        "calendar_sync_consent_at (ISO timestamp, optional)",
        "last_synced_at (ISO timestamp, optional)",
        "created_at (ISO timestamp, optional)",
        "updated_at (ISO timestamp, optional)",
        "created_by (email, optional)",
        "modified_at (ISO timestamp, optional)",
        "modified_by (email, optional)",
      ],
      sample:
        'int-demo-001,Sarah Chen,sarah.chen@company.com,admin,"React;TypeScript",true,America/Los_Angeles,true,2024-01-15T10:30:00Z,2024-03-20T14:22:00Z,2024-01-10T09:00:00Z,2024-03-20T14:22:00Z,system@company.com,2024-03-15T11:20:00Z,sarah.chen@company.com',
      samplePath: "/samples/interviewers-sample.csv",
    },
    {
      key: "events",
      title: "Interview Events CSV",
      description:
        "Imports scheduled interviews, attendance status, and metadata.",
      columns: [
        "id (optional, auto-generated when omitted)",
        "interviewer_email (required, must reference an existing interviewer)",
        "candidate_name (optional)",
        "position (optional)",
        "start_time (required, ISO timestamp)",
        "end_time (required, ISO timestamp)",
        "status (pending | attended | ghosted | cancelled)",
        "skills_assessed (semicolon separated list)",
        "notes (optional)",
        "marked_by (email, optional)",
        "marked_at (ISO timestamp, optional)",
        "created_at (ISO timestamp, optional)",
        "updated_at (ISO timestamp, optional)",
        "duration_minutes (integer, optional)",
      ],
      sample:
        'evt-demo-001,sarah.chen@company.com,Jane Smith,Frontend Developer,2024-02-15T10:00:00Z,2024-02-15T11:00:00Z,pending,"React;System Design","Initial technical screen",,,"2024-02-01T09:00:00Z","2024-02-01T09:00:00Z",60',
      samplePath: "/samples/events-sample.csv",
    },
    {
      key: "auditLogs",
      title: "Audit Logs CSV",
      description:
        "Replays audit history with optional change payloads for compliance.",
      columns: [
        "id (optional, auto-generated when omitted)",
        "timestamp (required, ISO timestamp)",
        "user_name (required)",
        "user_email (required)",
        "action (required, e.g. CREATE_INTERVIEWER)",
        "entity_type (required, e.g. interviewer)",
        "entity_id (required)",
        "changes (JSON string describing before/after values)",
      ],
      sample:
        'log-demo-001,2024-03-01T12:00:00Z,Sarah Chen,sarah.chen@company.com,UPDATE_INTERVIEWER,interviewer,int-demo-002,"{\\"is_active\\":{\\"from\\":true,\\"to\\":false}}"',
      samplePath: "/samples/audit-logs-sample.csv",
    },
  ];

  useEffect(() => {
    // Ensure database is initialized before loading stats
    const initAndLoad = async () => {
      await db.initialize();
      await loadStats();
    };
    initAndLoad();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const [interviewers, events, auditLogs] = await Promise.all([
        db.getInterviewers(),
        db.getInterviewEvents(),
        db.getAuditLogs(),
      ]);

      setStats({
        interviewers: interviewers.length,
        events: events.length,
        auditLogs: auditLogs.length,
      });
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to load stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const data = await db.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `interview-roster-backup-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);

      await db.createAuditLog({
        user_email: auditUserEmail,
        user_name: auditUserName,
        action: "EXPORT_DATA",
        entity_type: "database",
        entity_id: "full_export",
        changes: { exported_at: new Date().toISOString(), format: "json" },
      });

      await loadStats();
      alert("Backup exported successfully.");
    } catch (error) {
      console.error("Failed to export data:", error);
      alert("Failed to export data. Please try again.");
    }
  };

  const openFilePicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleFileSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      if (file.name.toLowerCase().endsWith(".csv")) {
        const { dataset, rows } = await parseCsvFile(file);
        let message = "";

        if (dataset === "interviewers") {
          const interviewers = mapCsvRowsToInterviewers(rows);
          const result = await db.importData({ interviewers });

          await db.createAuditLog({
            user_email: auditUserEmail,
            user_name: auditUserName,
            action: "IMPORT_INTERVIEWERS_CSV",
            entity_type: "database",
            entity_id: "interviewers_csv_import",
            changes: {
              imported: result.imported.interviewers,
              skipped: result.skipped.interviewers,
              imported_at: new Date().toISOString(),
              file: file.name,
            },
          });

          message =
            `Imported interviewers: ${result.imported.interviewers}` +
            ` (skipped: ${result.skipped.interviewers})`;
        } else if (dataset === "events") {
          const events = mapCsvRowsToEvents(rows);
          const result = await db.importData({ events });

          await db.createAuditLog({
            user_email: auditUserEmail,
            user_name: auditUserName,
            action: "IMPORT_EVENTS_CSV",
            entity_type: "database",
            entity_id: "events_csv_import",
            changes: {
              imported: result.imported.events,
              skipped: result.skipped.events,
              imported_at: new Date().toISOString(),
              file: file.name,
            },
          });

          message =
            `Imported events: ${result.imported.events}` +
            ` (skipped: ${result.skipped.events})`;
        } else {
          const auditLogs = mapCsvRowsToAuditLogs(rows);
          const result = await db.importData({ auditLogs });

          await db.createAuditLog({
            user_email: auditUserEmail,
            user_name: auditUserName,
            action: "IMPORT_AUDIT_LOGS_CSV",
            entity_type: "database",
            entity_id: "audit_logs_csv_import",
            changes: {
              imported: result.imported.auditLogs,
              skipped: result.skipped.auditLogs,
              imported_at: new Date().toISOString(),
              file: file.name,
            },
          });

          message =
            `Imported audit logs: ${result.imported.auditLogs}` +
            ` (skipped: ${result.skipped.auditLogs})`;
        }

        await loadStats();
        setShowImportGuide(false);
        alert(`CSV import completed:\n\n${message}`);
        return;
      }

      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.interviewers && !data.events && !data.auditLogs) {
        alert(
          "Invalid backup file format. File must contain at least one of: interviewers, events, or auditLogs."
        );
        return;
      }

      const result = await db.importData(data);

      await db.createAuditLog({
        user_email: auditUserEmail,
        user_name: auditUserName,
        action: "IMPORT_DATA",
        entity_type: "database",
        entity_id: "full_import",
        changes: {
          imported: result.imported,
          skipped: result.skipped,
          imported_at: new Date().toISOString(),
          file: file.name,
          format: "json",
        },
      });

      await loadStats();
      setShowImportGuide(false);

      alert(
        `Import completed!\n\n` +
          `Imported:\n` +
          `- Interviewers: ${result.imported.interviewers}\n` +
          `- Events: ${result.imported.events}\n` +
          `- Audit Logs: ${result.imported.auditLogs}\n\n` +
          `Skipped (duplicates):\n` +
          `- Interviewers: ${result.skipped.interviewers}\n` +
          `- Events: ${result.skipped.events}\n` +
          `- Audit Logs: ${result.skipped.auditLogs}`
      );
    } catch (error) {
      console.error("Failed to import data:", error);
      alert("Failed to import data. Please check the file format.");
    }
  };

  const handleReset = async () => {
    try {
      // Clear the database completely (empty state)
      await db.clearDatabase();

      // Close dialog
      setShowResetDialog(false);

      // Refresh stats to show the empty database
      await loadStats();

      // Show success message after UI updates
      setTimeout(() => {
        alert("Database cleared successfully! All data has been removed.");
      }, 100);
    } catch (error) {
      console.error("Failed to clear database:", error);
      alert("Failed to clear database. Please try again.");
    }
  };

  const handleImportMockData = async () => {
    try {
      console.log("Import Mock Data button clicked");

      // Show confirmation dialog
      const confirmed = window.confirm(
        "This will clear all existing data and import fresh mock data. Are you sure you want to continue?"
      );

      console.log("User confirmation:", confirmed);

      if (!confirmed) {
        console.log("User cancelled import");
        return;
      }

      console.log("Starting import process...");

      // Import mock data (this clears everything first)
      await db.importMockData();

      console.log("Mock data imported, creating audit log...");

      // Log audit AFTER import (so it doesn't get wiped)
      await db.createAuditLog({
        user_email: auditUserEmail,
        user_name: auditUserName,
        action: "IMPORT_MOCK_DATA",
        entity_type: "database",
        entity_id: "mock_import",
        changes: {
          imported_at: new Date().toISOString(),
        },
      });

      console.log("Audit log created, refreshing stats...");

      // Refresh stats to show the new data
      await loadStats();

      console.log("Stats refreshed, showing success message");

      // Show success message after UI updates
      setTimeout(() => {
        alert(
          "Mock data imported successfully! Database has been reinitialized with fresh mock data."
        );
      }, 100);
    } catch (error) {
      console.error("Failed to import mock data:", error);
      alert(`Failed to import mock data: ${error}`);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const estimatedSize = () => {
    // Rough estimation based on record counts
    const avgInterviewerSize = 500; // bytes
    const avgEventSize = 300;
    const avgLogSize = 200;

    const total =
      stats.interviewers * avgInterviewerSize +
      stats.events * avgEventSize +
      stats.auditLogs * avgLogSize;

    return formatBytes(total);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Database Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage your interview roster database, export backups, and monitor
          system health
        </p>
      </div>

      {/* Action Buttons */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.csv"
        className="hidden"
        onChange={handleFileSelected}
      />
      <div className="flex flex-wrap gap-3">
        <Button onClick={loadStats} disabled={loading} variant="outline">
          <RefreshCwIcon
            className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          Refresh Stats
        </Button>
        <Button onClick={handleExport} variant="outline">
          <DownloadIcon className="w-4 h-4 mr-2" />
          Export Backup
        </Button>
        <Button onClick={() => setShowImportGuide(true)} variant="outline">
          <UploadIcon className="w-4 h-4 mr-2" />
          Import Data
        </Button>
        <Button onClick={handleImportMockData} variant="outline">
          <DatabaseIcon className="w-4 h-4 mr-2" />
          Import Mock Data
        </Button>
        <Button onClick={() => setShowResetDialog(true)} variant="destructive">
          <TrashIcon className="w-4 h-4 mr-2" />
          Clear Database
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UsersIcon className="w-5 h-5 text-blue-500" />
              Interviewers
            </CardTitle>
            <CardDescription>Total interviewers in database</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{stats.interviewers}</p>
            <p className="text-sm text-muted-foreground mt-2">
              Active and inactive interviewers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarIcon className="w-5 h-5 text-green-500" />
              Interview Events
            </CardTitle>
            <CardDescription>Total events tracked</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{stats.events}</p>
            <p className="text-sm text-muted-foreground mt-2">
              All interview events
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileTextIcon className="w-5 h-5 text-purple-500" />
              Audit Logs
            </CardTitle>
            <CardDescription>System activity logs</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{stats.auditLogs}</p>
            <p className="text-sm text-muted-foreground mt-2">
              Tracked system changes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Database Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DatabaseIcon className="w-5 h-5 text-blue-500" />
            Database Information
          </CardTitle>
          <CardDescription>Current database status and details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5" />

              <div>
                <p className="font-medium">Status</p>
                <p className="text-sm text-muted-foreground">
                  {loading ? "Loading..." : "Connected & Operational"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <DatabaseIcon className="w-5 h-5 text-blue-500 mt-0.5" />

              <div>
                <p className="font-medium">Storage Type</p>
                <p className="text-sm text-muted-foreground">
                  Browser localStorage
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <FileTextIcon className="w-5 h-5 text-purple-500 mt-0.5" />

              <div>
                <p className="font-medium">Estimated Size</p>
                <p className="text-sm text-muted-foreground">
                  {estimatedSize()}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <RefreshCwIcon className="w-5 h-5 text-orange-500 mt-0.5" />

              <div>
                <p className="font-medium">Last Updated</p>
                <p className="text-sm text-muted-foreground">
                  {lastUpdated ? lastUpdated.toLocaleString() : "Never"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Operations Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Database Operations Guide</CardTitle>
          <CardDescription>
            How to manage your interview roster database
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <DownloadIcon className="w-5 h-5 text-blue-500 mt-0.5" />

              <div>
                <p className="font-medium">Export Backup</p>
                <p className="text-sm text-muted-foreground">
                  Download a complete backup of your database as a JSON file.
                  This includes all interviewers, events, and audit logs.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <UploadIcon className="w-5 h-5 text-green-500 mt-0.5" />

              <div>
                <p className="font-medium">Import Data</p>
                <p className="text-sm text-muted-foreground">
                  Restore data from a previously exported backup file. This will
                  merge with existing data (duplicates are skipped).
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <DatabaseIcon className="w-5 h-5 text-blue-500 mt-0.5" />

              <div>
                <p className="font-medium">Import Mock Data</p>
                <p className="text-sm text-muted-foreground">
                  Clear all existing data and import fresh mock data from the
                  static file. This is useful for testing and demos.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <TrashIcon className="w-5 h-5 text-red-500 mt-0.5" />

              <div>
                <p className="font-medium">Clear Database</p>
                <p className="text-sm text-muted-foreground">
                  Permanently delete all data from the database. This will empty
                  the database completely. This action cannot be undone - export
                  a backup first!
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <AlertTriangleIcon className="w-5 h-5 text-orange-500 mt-0.5" />

              <div>
                <p className="font-medium">Important Notes</p>
                <p className="text-sm text-muted-foreground">
                  • Data is stored in browser localStorage
                  <br />
                  • Clearing browser data will delete the database
                  <br />
                  • Regular backups are recommended
                  <br />• Export before making major changes
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangleIcon className="w-5 h-5 text-red-500" />
              Clear All Database Data?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete ALL data from the database
              (interviewers, events, and audit logs). The database will be
              completely empty. This action cannot be undone.
              <br />
              <br />
              <strong>Make sure to export a backup before proceeding!</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReset}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Clear All Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showImportGuide} onOpenChange={setShowImportGuide}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Import CSV Guide</DialogTitle>
            <DialogDescription>
              Review the required headers before importing CSV backups. You can
              also select a JSON backup exported from this page.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {csvGuides.map((guide) => (
              <Card key={guide.key}>
                <CardHeader>
                  <CardTitle className="text-lg">{guide.title}</CardTitle>
                  <CardDescription>{guide.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium">Columns</p>
                    <ul className="mt-2 space-y-1 list-disc list-inside text-sm text-muted-foreground">
                      {guide.columns.map((column) => (
                        <li key={column}>{column}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Sample row</p>
                    <code className="mt-2 block rounded bg-muted p-2 text-xs text-muted-foreground break-all">
                      {guide.sample}
                    </code>
                  </div>
                  <div>
                    <Button variant="outline" size="sm" asChild>
                      <a href={guide.samplePath} download>
                        <DownloadIcon className="h-4 w-4" />
                        Download sample
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <DialogFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Tip: CSV imports merge by email or id. JSON backups restore the
              full dataset exactly as exported.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowImportGuide(false)}
              >
                Cancel
              </Button>
              <Button onClick={openFilePicker}>
                <UploadIcon className="w-4 h-4 mr-2" />
                Select File
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
