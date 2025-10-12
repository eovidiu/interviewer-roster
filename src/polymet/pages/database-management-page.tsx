import { useState, useEffect } from "react";
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

export function DatabaseManagementPage() {
  const [stats, setStats] = useState({
    interviewers: 0,
    events: 0,
    auditLogs: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

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

      // Log audit
      await db.createAuditLog({
        user_email: "admin@company.com",
        user_name: "Admin",
        action: "export_data",
        entity_type: "database",
        entity_id: "full_export",
        changes: { exported_at: new Date().toISOString() },
      });

      await loadStats();
    } catch (error) {
      console.error("Failed to export data:", error);
      alert("Failed to export data. Please try again.");
    }
  };

  const handleImport = async () => {
    try {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".json";
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const data = JSON.parse(event.target?.result as string);

            // Validate data structure
            if (!data.interviewers && !data.events && !data.auditLogs) {
              alert(
                "Invalid backup file format. File must contain at least one of: interviewers, events, or auditLogs."
              );
              return;
            }

            // Import data
            const result = await db.importData(data);

            // Log audit
            await db.createAuditLog({
              user_email: "admin@company.com",
              user_name: "Admin",
              action: "import_data",
              entity_type: "database",
              entity_id: "full_import",
              changes: {
                imported: result.imported,
                skipped: result.skipped,
                imported_at: new Date().toISOString(),
              },
            });

            await loadStats();

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
        reader.readAsText(file);
      };
      input.click();
    } catch (error) {
      console.error("Failed to import data:", error);
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
        user_email: "admin@company.com",
        user_name: "Admin",
        action: "import_mock_data",
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
        <Button onClick={handleImport} variant="outline">
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
    </div>
  );
}
