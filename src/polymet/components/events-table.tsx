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
import { StatusBadge } from "@/polymet/components/status-badge";
import {
  MoreHorizontalIcon,
  SearchIcon,
  CheckCircle2Icon,
  CalendarIcon,
  ClockIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InterviewEvent } from "@/polymet/data/mock-interview-events-data";

interface EventsTableProps {
  events: InterviewEvent[];
  userRole: "viewer" | "talent" | "admin";
  onMarkAttendance?: (event: InterviewEvent) => void;
  onViewDetails?: (event: InterviewEvent) => void;
}

export function EventsTable({
  events,
  userRole,
  onMarkAttendance,
  onViewDetails,
}: EventsTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.interviewer_email
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      event.skills_assessed?.some((skill) =>
        skill.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesStatus =
      statusFilter === "all" || event.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const canMarkAttendance = userRole === "admin" || userRole === "talent";

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
      }),
    };
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

          <Input
            placeholder="Search by interviewer or skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={statusFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("all")}
          >
            All
          </Button>
          <Button
            variant={statusFilter === "pending" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("pending")}
          >
            Pending
          </Button>
          <Button
            variant={statusFilter === "attended" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("attended")}
          >
            Attended
          </Button>
          <Button
            variant={statusFilter === "ghosted" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("ghosted")}
          >
            No Show
          </Button>
          <Button
            variant={statusFilter === "cancelled" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("cancelled")}
          >
            Cancelled
          </Button>
        </div>
      </div>

      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date & Time</TableHead>
              <TableHead>Interviewer</TableHead>
              <TableHead>Skills Assessed</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEvents.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground py-8"
                >
                  No events found
                </TableCell>
              </TableRow>
            ) : (
              filteredEvents.map((event) => {
                const startDateTime = formatDateTime(event.start_time);
                const endDateTime = formatDateTime(event.end_time);

                return (
                  <TableRow key={event.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <CalendarIcon className="h-3 w-3 text-muted-foreground" />

                          {startDateTime.date}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <ClockIcon className="h-3 w-3" />
                          {startDateTime.time} - {endDateTime.time}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{event.interviewer_email}</div>
                    </TableCell>
                    <TableCell>
                      {event.skills_assessed &&
                      event.skills_assessed.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {event.skills_assessed.slice(0, 2).map((skill) => (
                            <Badge
                              key={skill}
                              variant="secondary"
                              className="text-xs"
                            >
                              {skill}
                            </Badge>
                          ))}
                          {event.skills_assessed.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{event.skills_assessed.length - 2}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={event.status} />
                    </TableCell>
                    <TableCell>
                      {event.notes ? (
                        <div
                          className="text-sm max-w-xs truncate"
                          title={event.notes}
                        >
                          {event.notes}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontalIcon className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            onClick={() => onViewDetails?.(event)}
                          >
                            <CalendarIcon className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          {canMarkAttendance && event.status === "pending" && (
                            <DropdownMenuItem
                              onClick={() => onMarkAttendance?.(event)}
                            >
                              <CheckCircle2Icon className="h-4 w-4 mr-2" />
                              Mark Attendance
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-muted-foreground">
        Showing {filteredEvents.length} of {events.length} events
      </div>
    </div>
  );
}
