import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  SearchIcon,
  FileTextIcon,
  PlusCircleIcon,
  EditIcon,
  TrashIcon,
  DownloadIcon,
} from "lucide-react";
import { AuditLog } from "@/polymet/data/mock-audit-logs-data";

interface AuditLogTableProps {
  logs: AuditLog[];
}

export function AuditLogTable({ logs }: AuditLogTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAction = actionFilter === "all" || log.action === actionFilter;

    return matchesSearch && matchesAction;
  });

  const getActionIcon = (action: string) => {
    switch (action) {
      case "CREATE":
        return PlusCircleIcon;
      case "UPDATE":
        return EditIcon;
      case "DELETE":
        return TrashIcon;
      case "EXPORT":
        return DownloadIcon;
      default:
        return FileTextIcon;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "CREATE":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800";
      case "UPDATE":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-800";
      case "DELETE":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-200 dark:border-red-800";
      case "EXPORT":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 border-purple-200 dark:border-purple-800";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700";
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      time: date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    };
  };

  const formatChanges = (changes: Record<string, any> | null) => {
    if (!changes) return "-";

    const entries = Object.entries(changes);
    if (entries.length === 0) return "-";

    return entries
      .map(([key, value]) => {
        if (
          typeof value === "object" &&
          value !== null &&
          "from" in value &&
          "to" in value
        ) {
          return `${key}: ${JSON.stringify(value.from)} → ${JSON.stringify(value.to)}`;
        }
        return `${key}: ${JSON.stringify(value)}`;
      })
      .join(", ");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

          <Input
            placeholder="Search by user, entity, or action..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={actionFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setActionFilter("all")}
          >
            All
          </Button>
          <Button
            variant={actionFilter === "CREATE" ? "default" : "outline"}
            size="sm"
            onClick={() => setActionFilter("CREATE")}
          >
            Create
          </Button>
          <Button
            variant={actionFilter === "UPDATE" ? "default" : "outline"}
            size="sm"
            onClick={() => setActionFilter("UPDATE")}
          >
            Update
          </Button>
          <Button
            variant={actionFilter === "DELETE" ? "default" : "outline"}
            size="sm"
            onClick={() => setActionFilter("DELETE")}
          >
            Delete
          </Button>
          <Button
            variant={actionFilter === "EXPORT" ? "default" : "outline"}
            size="sm"
            onClick={() => setActionFilter("EXPORT")}
          >
            Export
          </Button>
        </div>
      </div>

      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Changes</TableHead>
              <TableHead>IP Address</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground py-8"
                >
                  No audit logs found
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => {
                const dateTime = formatDateTime(log.timestamp);
                const ActionIcon = getActionIcon(log.action);

                return (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm font-medium">
                          {dateTime.date}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {dateTime.time}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{log.user_email}</div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={getActionColor(log.action)}
                      >
                        <ActionIcon className="w-3 h-3 mr-1" />

                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm font-medium capitalize">
                          {log.entity}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {log.entity_id}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div
                        className="text-sm max-w-md truncate"
                        title={formatChanges(log.changes)}
                      >
                        {formatChanges(log.changes)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {log.ip_address}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-muted-foreground">
        Showing {filteredLogs.length} of {logs.length} audit logs
      </div>
    </div>
  );
}
