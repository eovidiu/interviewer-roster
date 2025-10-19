import { useState, useMemo } from "react";
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
  MoreHorizontalIcon,
  SearchIcon,
  CheckCircle2Icon,
  XCircleIcon,
  CalendarIcon,
  EditIcon,
  TrashIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Interviewer } from "@/polymet/data/mock-interviewers-data";

interface InterviewerTableProps {
  interviewers: Interviewer[];
  userRole: "viewer" | "talent" | "admin";
  onEdit?: (interviewer: Interviewer) => void;
  onDelete?: (interviewer: Interviewer) => void;
  onToggleActive?: (interviewer: Interviewer) => void;
  onViewSchedule?: (interviewer: Interviewer) => void;
}

export function InterviewerTable({
  interviewers,
  userRole,
  onEdit,
  onDelete,
  onToggleActive,
  onViewSchedule,
}: InterviewerTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  // Memoize filtered interviewers to avoid re-filtering on every render
  const filteredInterviewers = useMemo(() => {
    return interviewers.filter((interviewer) => {
      const matchesSearch =
        interviewer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        interviewer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        interviewer.skills.some((skill) =>
          skill.toLowerCase().includes(searchQuery.toLowerCase())
        );

      const matchesRole = roleFilter === "all" || interviewer.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [interviewers, searchQuery, roleFilter]);

  const canEdit = userRole === "admin" || userRole === "talent";
  const canDelete = userRole === "admin";

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

          <Input
            placeholder="Search by name, email, or skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={roleFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setRoleFilter("all")}
          >
            All
          </Button>
          <Button
            variant={roleFilter === "admin" ? "default" : "outline"}
            size="sm"
            onClick={() => setRoleFilter("admin")}
          >
            Admin
          </Button>
          <Button
            variant={roleFilter === "talent" ? "default" : "outline"}
            size="sm"
            onClick={() => setRoleFilter("talent")}
          >
            TA
          </Button>
          <Button
            variant={roleFilter === "viewer" ? "default" : "outline"}
            size="sm"
            onClick={() => setRoleFilter("viewer")}
          >
            Viewer
          </Button>
        </div>
      </div>

      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Skills</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInterviewers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-muted-foreground py-8"
                >
                  No interviewers found
                </TableCell>
              </TableRow>
            ) : (
              filteredInterviewers.map((interviewer) => (
                <TableRow key={interviewer.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{interviewer.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {interviewer.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {interviewer.skills.slice(0, 3).map((skill) => (
                        <Badge
                          key={skill}
                          variant="secondary"
                          className="text-xs"
                        >
                          {skill}
                        </Badge>
                      ))}
                      {interviewer.skills.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{interviewer.skills.length - 3}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={interviewer.is_active ? "default" : "secondary"}
                      className={
                        interviewer.is_active
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800"
                          : ""
                      }
                    >
                      {interviewer.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" aria-label="Open actions menu">
                          <MoreHorizontalIcon className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                          onClick={() => onViewSchedule?.(interviewer)}
                        >
                          <CalendarIcon className="h-4 w-4 mr-2" />
                          View Schedule
                        </DropdownMenuItem>
                        {canEdit && (
                          <>
                            <DropdownMenuItem
                              onClick={() => onEdit?.(interviewer)}
                            >
                              <EditIcon className="h-4 w-4 mr-2" />
                              Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onToggleActive?.(interviewer)}
                            >
                              {interviewer.is_active ? (
                                <>
                                  <XCircleIcon className="h-4 w-4 mr-2" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <CheckCircle2Icon className="h-4 w-4 mr-2" />
                                  Activate
                                </>
                              )}
                            </DropdownMenuItem>
                          </>
                        )}
                        {canDelete && (
                          <>
                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                              className="text-red-600 dark:text-red-400"
                              onClick={() => onDelete?.(interviewer)}
                            >
                              <TrashIcon className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-muted-foreground">
        Showing {filteredInterviewers.length} of {interviewers.length}{" "}
        interviewers
      </div>
    </div>
  );
}
