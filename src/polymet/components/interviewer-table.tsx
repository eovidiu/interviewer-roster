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
  FilterIcon,
  XIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Migration 003 filters
  const [orgFilter, setOrgFilter] = useState<string>("all");
  const [managerFilter, setManagerFilter] = useState<string>("all");
  const [profileFilter, setProfileFilter] = useState<string>("all");
  const [onboardingFilter, setOnboardingFilter] = useState<string>("all");
  const [remoteFilter, setRemoteFilter] = useState<string>("all");
  const [minLevelFilter, setMinLevelFilter] = useState<string>("");

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

      // Migration 003 filters
      const matchesOrg = orgFilter === "all" || interviewer.org === orgFilter;
      const matchesManager = managerFilter === "all" || interviewer.manager === managerFilter;

      const matchesProfile = profileFilter === "all" || (() => {
        switch (profileFilter) {
          case "backend": return interviewer.profile_backend;
          case "frontend": return interviewer.profile_frontend;
          case "fullstack": return interviewer.profile_fullstack;
          case "sre": return interviewer.profile_sre;
          case "big_data": return interviewer.profile_big_data;
          case "cse": return interviewer.profile_cse;
          case "ml": return interviewer.profile_ml;
          case "em": return interviewer.profile_em;
          default: return true;
        }
      })();

      const matchesOnboarding = onboardingFilter === "all" ||
        (onboardingFilter === "completed" && interviewer.onboarding_completed) ||
        (onboardingFilter === "pending" && !interviewer.onboarding_completed);

      const matchesRemote = remoteFilter === "all" ||
        (remoteFilter === "remote" && interviewer.is_remote) ||
        (remoteFilter === "onsite" && !interviewer.is_remote);

      const matchesMinLevel = !minLevelFilter ||
        (interviewer.max_level !== null && interviewer.max_level !== undefined &&
         interviewer.max_level >= parseInt(minLevelFilter));

      return matchesSearch && matchesRole && matchesOrg && matchesManager &&
             matchesProfile && matchesOnboarding && matchesRemote && matchesMinLevel;
    });
  }, [interviewers, searchQuery, roleFilter, orgFilter, managerFilter,
      profileFilter, onboardingFilter, remoteFilter, minLevelFilter]);

  const canEdit = userRole === "admin" || userRole === "talent";
  const canDelete = userRole === "admin";

  // Extract unique values for dropdowns
  const uniqueOrgs = useMemo(() => {
    const orgs = new Set(interviewers.map(i => i.org).filter(Boolean));
    return Array.from(orgs).sort();
  }, [interviewers]);

  const uniqueManagers = useMemo(() => {
    const managers = new Set(interviewers.map(i => i.manager).filter(Boolean));
    return Array.from(managers).sort();
  }, [interviewers]);

  const hasActiveFilters = orgFilter !== "all" || managerFilter !== "all" ||
    profileFilter !== "all" || onboardingFilter !== "all" ||
    remoteFilter !== "all" || minLevelFilter !== "";

  const clearAllFilters = () => {
    setOrgFilter("all");
    setManagerFilter("all");
    setProfileFilter("all");
    setOnboardingFilter("all");
    setRemoteFilter("all");
    setMinLevelFilter("");
  };

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
        <div className="flex gap-2">
          <Button
            variant={showAdvancedFilters ? "default" : "outline"}
            size="sm"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          >
            <FilterIcon className="h-4 w-4 mr-2" />
            Filters
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2 px-1.5 py-0.5 text-xs">
                {[orgFilter, managerFilter, profileFilter, onboardingFilter, remoteFilter, minLevelFilter]
                  .filter(f => f && f !== "all" && f !== "").length}
              </Badge>
            )}
          </Button>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
            >
              <XIcon className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {showAdvancedFilters && (
        <div className="p-4 border border-border rounded-md bg-muted/30 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="org-filter" className="text-xs font-medium">
                Organization
              </Label>
              <Select value={orgFilter} onValueChange={setOrgFilter}>
                <SelectTrigger id="org-filter" className="h-9">
                  <SelectValue placeholder="All organizations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All organizations</SelectItem>
                  {uniqueOrgs.map((org) => (
                    <SelectItem key={org} value={org}>
                      {org}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="manager-filter" className="text-xs font-medium">
                Manager
              </Label>
              <Select value={managerFilter} onValueChange={setManagerFilter}>
                <SelectTrigger id="manager-filter" className="h-9">
                  <SelectValue placeholder="All managers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All managers</SelectItem>
                  {uniqueManagers.map((manager) => (
                    <SelectItem key={manager} value={manager}>
                      {manager}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-filter" className="text-xs font-medium">
                Interview Profile
              </Label>
              <Select value={profileFilter} onValueChange={setProfileFilter}>
                <SelectTrigger id="profile-filter" className="h-9">
                  <SelectValue placeholder="All profiles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All profiles</SelectItem>
                  <SelectItem value="backend">Backend</SelectItem>
                  <SelectItem value="frontend">Frontend</SelectItem>
                  <SelectItem value="fullstack">Fullstack</SelectItem>
                  <SelectItem value="sre">SRE</SelectItem>
                  <SelectItem value="big_data">Big Data</SelectItem>
                  <SelectItem value="cse">CSE</SelectItem>
                  <SelectItem value="ml">Machine Learning</SelectItem>
                  <SelectItem value="em">Engineering Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="onboarding-filter" className="text-xs font-medium">
                Onboarding Status
              </Label>
              <Select value={onboardingFilter} onValueChange={setOnboardingFilter}>
                <SelectTrigger id="onboarding-filter" className="h-9">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="remote-filter" className="text-xs font-medium">
                Work Location
              </Label>
              <Select value={remoteFilter} onValueChange={setRemoteFilter}>
                <SelectTrigger id="remote-filter" className="h-9">
                  <SelectValue placeholder="All locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All locations</SelectItem>
                  <SelectItem value="remote">Remote</SelectItem>
                  <SelectItem value="onsite">On-site</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="level-filter" className="text-xs font-medium">
                Minimum Level
              </Label>
              <Input
                id="level-filter"
                type="number"
                placeholder="Enter min level"
                value={minLevelFilter}
                onChange={(e) => setMinLevelFilter(e.target.value)}
                className="h-9"
                min="0"
              />
            </div>
          </div>
        </div>
      )}

      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Skills</TableHead>
              <TableHead>Profiles</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInterviewers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
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
                      {interviewer.manager && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          Manager: {interviewer.manager}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {interviewer.org ? (
                        <Badge variant="outline" className="text-xs">
                          {interviewer.org}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {interviewer.skills.slice(0, 2).map((skill) => (
                        <Badge
                          key={skill}
                          variant="secondary"
                          className="text-xs"
                        >
                          {skill}
                        </Badge>
                      ))}
                      {interviewer.skills.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{interviewer.skills.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[120px]">
                      {interviewer.profile_backend && (
                        <Badge variant="outline" className="text-xs">BE</Badge>
                      )}
                      {interviewer.profile_frontend && (
                        <Badge variant="outline" className="text-xs">FE</Badge>
                      )}
                      {interviewer.profile_fullstack && (
                        <Badge variant="outline" className="text-xs">FS</Badge>
                      )}
                      {interviewer.profile_sre && (
                        <Badge variant="outline" className="text-xs">SRE</Badge>
                      )}
                      {interviewer.profile_big_data && (
                        <Badge variant="outline" className="text-xs">Data</Badge>
                      )}
                      {interviewer.profile_cse && (
                        <Badge variant="outline" className="text-xs">CSE</Badge>
                      )}
                      {interviewer.profile_ml && (
                        <Badge variant="outline" className="text-xs">ML</Badge>
                      )}
                      {interviewer.profile_em && (
                        <Badge variant="outline" className="text-xs">EM</Badge>
                      )}
                      {!interviewer.profile_backend &&
                       !interviewer.profile_frontend &&
                       !interviewer.profile_fullstack &&
                       !interviewer.profile_sre &&
                       !interviewer.profile_big_data &&
                       !interviewer.profile_cse &&
                       !interviewer.profile_ml &&
                       !interviewer.profile_em && (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {interviewer.max_level ? (
                        <span className="font-medium">{interviewer.max_level}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
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
                      {interviewer.is_remote && (
                        <Badge variant="outline" className="text-xs">
                          Remote
                        </Badge>
                      )}
                      {interviewer.is_shadowing && (
                        <Badge variant="outline" className="text-xs">
                          Shadowing
                        </Badge>
                      )}
                      {interviewer.onboarding_completed === false && (
                        <Badge variant="outline" className="text-xs text-yellow-700 dark:text-yellow-400">
                          Onboarding
                        </Badge>
                      )}
                      {interviewer.pause_until && (
                        <Badge variant="outline" className="text-xs text-orange-700 dark:text-orange-400">
                          Paused
                        </Badge>
                      )}
                    </div>
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
