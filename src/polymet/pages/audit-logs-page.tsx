import { AuditLogTable } from "@/polymet/components/audit-log-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DownloadIcon,
  FileTextIcon,
  PlusCircleIcon,
  EditIcon,
  TrashIcon,
} from "lucide-react";
import { mockAuditLogs } from "@/polymet/data/mock-audit-logs-data";

export function AuditLogsPage() {
  const totalLogs = mockAuditLogs.length;
  const createActions = mockAuditLogs.filter(
    (l) => l.action === "CREATE"
  ).length;
  const updateActions = mockAuditLogs.filter(
    (l) => l.action === "UPDATE"
  ).length;
  const deleteActions = mockAuditLogs.filter(
    (l) => l.action === "DELETE"
  ).length;

  const handleExport = () => {
    console.log("Export audit logs");
    // In real app, generate and download CSV
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Audit Logs</h1>
          <p className="text-muted-foreground mt-2">
            View system activity and changes (Admin only)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <DownloadIcon className="h-4 w-4 mr-2" />
            Export Logs
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
            <FileTextIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLogs}</div>
            <p className="text-xs text-muted-foreground mt-1">
              All recorded actions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Create Actions
            </CardTitle>
            <PlusCircleIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{createActions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              New records created
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Update Actions
            </CardTitle>
            <EditIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{updateActions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Records modified
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Delete Actions
            </CardTitle>
            <TrashIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deleteActions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Records deleted
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Security Notice */}
      <Card className="border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <FileTextIcon className="h-5 w-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />

            <div className="space-y-1">
              <div className="font-medium text-purple-900 dark:text-purple-100">
                Security & Compliance
              </div>
              <div className="text-sm text-purple-800 dark:text-purple-200">
                All system changes are logged with user identity, timestamp, and
                IP address. Logs are retained for 90 days and automatically
                backed up daily. Only Super Admins can access audit logs.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>System Activity Log</CardTitle>
        </CardHeader>
        <CardContent>
          <AuditLogTable logs={mockAuditLogs} />
        </CardContent>
      </Card>
    </div>
  );
}
