import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DownloadIcon,
  FileTextIcon,
  UsersIcon,
  CalendarIcon,
} from "lucide-react";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userRole: "viewer" | "talent" | "admin";
  onExport: (type: string, anonymize: boolean) => void;
}

type ExportTypeOption = "interviewers" | "events" | "audit_logs";

export function ExportDialog({
  open,
  onOpenChange,
  userRole,
  onExport,
}: ExportDialogProps) {
  const [exportType, setExportType] =
    useState<ExportTypeOption>("interviewers");
  const [anonymize, setAnonymize] = useState(false);

  const handleExportTypeChange = (value: string) => {
    if (
      value === "interviewers" ||
      value === "events" ||
      value === "audit_logs"
    ) {
      setExportType(value);
    }
  };

  const handleExport = () => {
    onExport(exportType, anonymize);
    onOpenChange(false);
  };

  const canExportAuditLogs = userRole === "admin";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Export Data</DialogTitle>
          <DialogDescription>
            Export data to CSV format (RFC 4180 compliant)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <Label>Select Data to Export</Label>
            <RadioGroup
              value={exportType}
              onValueChange={handleExportTypeChange}
            >
              <div className="flex items-center space-x-2 p-3 border border-border rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="interviewers" id="interviewers" />

                <Label
                  htmlFor="interviewers"
                  className="flex items-center gap-2 cursor-pointer flex-1"
                >
                  <UsersIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />

                  <div>
                    <div className="font-medium">Interviewers</div>
                    <div className="text-xs text-muted-foreground">
                      Export interviewer roster with skills and availability
                    </div>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-3 border border-border rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="events" id="events" />

                <Label
                  htmlFor="events"
                  className="flex items-center gap-2 cursor-pointer flex-1"
                >
                  <CalendarIcon className="h-4 w-4 text-green-600 dark:text-green-400" />

                  <div>
                    <div className="font-medium">Interview Events</div>
                    <div className="text-xs text-muted-foreground">
                      Export scheduled interviews with attendance status
                    </div>
                  </div>
                </Label>
              </div>

              {canExportAuditLogs && (
                <div className="flex items-center space-x-2 p-3 border border-border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="audit_logs" id="audit_logs" />

                  <Label
                    htmlFor="audit_logs"
                    className="flex items-center gap-2 cursor-pointer flex-1"
                  >
                    <FileTextIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />

                    <div>
                      <div className="font-medium">Audit Logs</div>
                      <div className="text-xs text-muted-foreground">
                        Export system audit trail (Admin only)
                      </div>
                    </div>
                  </Label>
                </div>
              )}
            </RadioGroup>
          </div>

          {userRole === "viewer" && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex gap-2">
                <div className="text-yellow-800 dark:text-yellow-200 text-sm">
                  <strong>Note:</strong> As a Viewer, exported data will be
                  automatically anonymized to protect privacy.
                </div>
              </div>
            </div>
          )}

          {userRole !== "viewer" && (
            <div className="flex items-center space-x-2 p-3 border border-border rounded-lg">
              <Checkbox
                id="anonymize"
                checked={anonymize}
                onCheckedChange={(checked) => setAnonymize(checked === true)}
              />

              <Label htmlFor="anonymize" className="cursor-pointer flex-1">
                <div className="font-medium">Anonymize Data</div>
                <div className="text-xs text-muted-foreground">
                  Remove personally identifiable information from export
                </div>
              </Label>
            </div>
          )}

          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="text-sm font-medium">Export Details</div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>• Format: CSV (RFC 4180)</div>
              <div>• Encoding: UTF-8</div>
              <div>• Date Format: ISO 8601</div>
              {(userRole === "viewer" || anonymize) && (
                <div>• Privacy: Anonymized</div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport}>
            <DownloadIcon className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
