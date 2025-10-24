import { useState, useEffect } from "react";
import { InterviewerScheduleCard } from "@/polymet/components/interviewer-schedule-card";
import { ReadOnlyWeeklyCalendar } from "@/polymet/components/readonly-weekly-calendar";
import { db } from "@/polymet/data/database-service";
import type { Interviewer } from "@/polymet/data/mock-interviewers-data";
import type { InterviewEvent } from "@/polymet/data/mock-interview-events-data";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  SearchIcon,
  CalendarIcon,
  LayoutGridIcon,
  CalendarDaysIcon,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function SchedulePage() {
  const [interviewers, setInterviewers] = useState<Interviewer[]>([]);
  const [events, setEvents] = useState<InterviewEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const [viewMode, setViewMode] = useState<"cards" | "calendar">("calendar");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [interviewersData, eventsData] = await Promise.all([
        db.getInterviewers(),
        db.getInterviewEvents(),
      ]);
      setInterviewers(interviewersData);
      setEvents(eventsData);
    } catch (error) {
      console.error("Failed to load schedule data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Group events by interviewer
  const interviewerSchedules = interviewers.map((interviewer) => {
    const interviewerEvents = events.filter(
      (event) => event.interviewer_email === interviewer.email
    );

    const now = new Date();
    const upcomingCount = interviewerEvents.filter(
      (event) => new Date(event.start_time) > now
    ).length;

    return {
      interviewer,
      events: interviewerEvents,
      upcomingCount,
    };
  });

  // Apply filters
  const filteredSchedules = interviewerSchedules.filter((schedule) => {
    const matchesSearch =
      schedule.interviewer.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      schedule.interviewer.email
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      schedule.interviewer.skills.some((skill) =>
        skill.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && schedule.interviewer.is_active) ||
      (statusFilter === "inactive" && !schedule.interviewer.is_active) ||
      (statusFilter === "has-upcoming" && schedule.upcomingCount > 0) ||
      (statusFilter === "no-upcoming" && schedule.upcomingCount === 0);

    return matchesSearch && matchesStatus;
  });

  // Apply sorting
  const sortedSchedules = [...filteredSchedules].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.interviewer.name.localeCompare(b.interviewer.name);
      case "upcoming-desc":
        return b.upcomingCount - a.upcomingCount;
      case "upcoming-asc":
        return a.upcomingCount - b.upcomingCount;
      case "total-desc":
        return b.events.length - a.events.length;
      case "total-asc":
        return a.events.length - b.events.length;
      default:
        return 0;
    }
  });

  // Calculate last week's data (previous Monday-Sunday)
  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const daysToLastMonday = currentDay === 0 ? 6 : currentDay - 1; // Days since this week's Monday

  // Get last week's Monday
  const lastWeekStart = new Date(now);
  lastWeekStart.setDate(now.getDate() - daysToLastMonday - 7);
  lastWeekStart.setHours(0, 0, 0, 0);

  // Get last week's Sunday
  const lastWeekEnd = new Date(lastWeekStart);
  lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
  lastWeekEnd.setHours(23, 59, 59, 999);

  const lastWeekEvents = events.filter((event) => {
    const eventDate = new Date(event.start_time);
    return eventDate >= lastWeekStart && eventDate <= lastWeekEnd;
  });

  const totalInterviewsLastWeek = lastWeekEvents.length;

  // Calculate this week's total interviews (current Monday-Sunday)
  const thisWeekStart = new Date(now);
  const daysToThisMonday = currentDay === 0 ? 6 : currentDay - 1;
  thisWeekStart.setDate(now.getDate() - daysToThisMonday);
  thisWeekStart.setHours(0, 0, 0, 0);

  const thisWeekEnd = new Date(thisWeekStart);
  thisWeekEnd.setDate(thisWeekStart.getDate() + 6);
  thisWeekEnd.setHours(23, 59, 59, 999);

  const thisWeekEvents = events.filter((event) => {
    const eventDate = new Date(event.start_time);
    return eventDate >= thisWeekStart && eventDate <= thisWeekEnd;
  });

  const totalInterviewsThisWeek = thisWeekEvents.length;

  const totalUpcoming = interviewerSchedules.reduce(
    (sum, schedule) => sum + schedule.upcomingCount,
    0
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Interview Schedules</h1>
          <p className="text-muted-foreground mt-2">Loading schedules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Interview Schedules</h1>
          <p className="text-muted-foreground mt-2">
            View and manage interview schedules per interviewer
          </p>
        </div>
        <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
          <Button
            variant={viewMode === "calendar" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("calendar")}
            className="gap-2"
          >
            <CalendarDaysIcon className="h-4 w-4" />
            Calendar
          </Button>
          <Button
            variant={viewMode === "cards" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("cards")}
            className="gap-2"
          >
            <LayoutGridIcon className="h-4 w-4" />
            Cards
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <CalendarIcon className="h-4 w-4" />

            <span>Total Interviews (Last Week)</span>
          </div>
          <p className="text-2xl font-bold">{totalInterviewsLastWeek}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-sm mb-1">
            <CalendarIcon className="h-4 w-4" />

            <span>Upcoming</span>
          </div>
          <p className="text-2xl font-bold">{totalUpcoming}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <CalendarIcon className="h-4 w-4" />

            <span>This Week's Total</span>
          </div>
          <p className="text-2xl font-bold">{totalInterviewsThisWeek}</p>
        </div>
      </div>

      {/* Calendar View */}
      {viewMode === "calendar" ? (
        <ReadOnlyWeeklyCalendar interviewers={interviewers} events={events} />
      ) : (
        <>
          {/* Filters */}
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Interviewers</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
                <SelectItem value="has-upcoming">Has Upcoming</SelectItem>
                <SelectItem value="no-upcoming">No Upcoming</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name (A-Z)</SelectItem>
                <SelectItem value="upcoming-desc">Most Upcoming</SelectItem>
                <SelectItem value="upcoming-asc">Least Upcoming</SelectItem>
                <SelectItem value="total-desc">Most Total</SelectItem>
                <SelectItem value="total-asc">Least Total</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Schedule Cards */}
          {sortedSchedules.length === 0 ? (
            <div className="text-center py-12 bg-muted/30 rounded-lg border border-border">
              <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />

              <h3 className="text-lg font-semibold mb-2">No schedules found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filter criteria
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {sortedSchedules.map((schedule) => (
                  <InterviewerScheduleCard
                    key={schedule.interviewer.id}
                    interviewer={schedule.interviewer}
                    events={schedule.events}
                    onViewEvent={(event) => console.log("View event:", event)}
                  />
                ))}
              </div>

              <div className="text-sm text-muted-foreground text-center">
                Showing {sortedSchedules.length} of{" "}
                {interviewerSchedules.length} interviewers
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
