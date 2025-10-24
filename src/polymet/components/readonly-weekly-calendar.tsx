import { useState, useEffect, useRef } from "react";
import {
  mockInterviewers,
  Interviewer,
} from "@/polymet/data/mock-interviewers-data";
import {
  mockInterviewEvents,
  InterviewEvent,
} from "@/polymet/data/mock-interview-events-data";
import { db } from "@/polymet/data/database-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarIcon,
  SearchIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ReadOnlyInterviewDayCell } from "./readonly-interview-day-cell";
import { toast } from "sonner";

interface ReadOnlyWeeklyCalendarProps {
  interviewers?: Interviewer[];
  events?: InterviewEvent[];
}

/**
 * Read-only weekly calendar for viewing interview schedules
 * Displays Mon-Fri schedule with time-slotted interviews
 * Includes search and week navigation, but no editing capabilities
 */
export function ReadOnlyWeeklyCalendar({
  interviewers = mockInterviewers,
  events = mockInterviewEvents,
}: ReadOnlyWeeklyCalendarProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = day === 0 ? -6 : 1 - day; // Get Monday
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  // Local state for events - load fresh data when needed
  const [localEvents, setLocalEvents] = useState<InterviewEvent[]>(events);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const initializedRef = useRef(false);
  const currentWeekRef = useRef(currentWeekStart.toISOString());

  // Get the 5 weekdays (Mon-Fri)
  const weekDays = Array.from({ length: 5 }, (_, i) => {
    const date = new Date(currentWeekStart);
    date.setDate(currentWeekStart.getDate() + i);
    return date;
  });

  // Helper function to filter events by day
  const filterEventsByDay = (
    allEvents: InterviewEvent[],
    interviewerEmail: string,
    date: Date
  ) => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    return allEvents.filter((event) => {
      const eventDate = new Date(event.start_time);
      return (
        event.interviewer_email === interviewerEmail &&
        eventDate >= dayStart &&
        eventDate <= dayEnd
      );
    });
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const formatDateString = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  // Load events ONLY on initial load or week change
  useEffect(() => {
    const weekString = currentWeekStart.toISOString();
    const weekChanged = currentWeekRef.current !== weekString;

    // Only reload if:
    // 1. First time loading (not initialized)
    // 2. Week changed
    if (!initializedRef.current || weekChanged) {
      const loadEvents = async () => {
        try {
          // Load fresh events from database
          const freshEvents = await db.getInterviewEvents();
          setLocalEvents(freshEvents);
          initializedRef.current = true;
          currentWeekRef.current = weekString;
        } catch (error) {
          console.error("Failed to load events:", error);
          toast.error("Failed to load interview data");
        }
      };

      loadEvents();
    }
  }, [currentWeekStart, interviewers]);

  // Navigate weeks
  const goToPreviousWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeekStart(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeekStart(newDate);
  };

  const goToCurrentWeek = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    setCurrentWeekStart(monday);
  };

  const formatWeekRange = () => {
    const endDate = new Date(currentWeekStart);
    endDate.setDate(endDate.getDate() + 4);
    return `${formatDate(currentWeekStart)} - ${formatDate(endDate)}`;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Calculate total interviews for the current week per interviewer
  const getWeekTotal = (interviewerEmail: string) => {
    const weekStart = new Date(currentWeekStart);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 4); // Friday (Mon + 4 days)
    weekEnd.setHours(23, 59, 59, 999);

    return localEvents.filter((event) => {
      if (event.interviewer_email !== interviewerEmail) return false;

      const eventDate = new Date(event.start_time);
      return eventDate >= weekStart && eventDate <= weekEnd;
    }).length;
  };

  // Filter interviewers based on search query (min 3 characters)
  const filteredInterviewers = interviewers.filter((interviewer) => {
    if (!interviewer.is_active) return false;

    // Only filter if search query has at least 3 characters
    if (searchQuery.length < 3) return true;

    const query = searchQuery.toLowerCase();
    const fullName = interviewer.name.toLowerCase();
    const email = interviewer.email.toLowerCase();

    // Split name into parts to search first name and last name separately
    const nameParts = fullName.split(" ");

    return (
      fullName.includes(query) ||
      email.includes(query) ||
      nameParts.some((part) => part.includes(query))
    );
  });

  return (
    <div className="space-y-4">
      {/* Header with navigation */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">View Schedule</h2>
          <p className="text-sm text-muted-foreground">{formatWeekRange()}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToCurrentWeek}>
            <CalendarIcon className="h-4 w-4 mr-2" />
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={goToNextWeek}>
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Status Legend */}
      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-900 dark:text-blue-100 mb-2">
          <strong>View-only schedule:</strong> Interview times and statuses are
          displayed for reference. Use the Mark Interviews page to make changes.
        </p>
        <div className="flex gap-4 text-xs text-blue-800 dark:text-blue-200">
          <span>
            <strong className="bg-green-500 text-white px-2 py-0.5 rounded">
              A
            </strong>{" "}
            = Attended
          </span>
          <span>
            <strong className="bg-yellow-500 text-white px-2 py-0.5 rounded">
              P
            </strong>{" "}
            = Pending
          </span>
          <span>
            <strong className="bg-red-500 text-white px-2 py-0.5 rounded">
              G
            </strong>{" "}
            = Ghosted
          </span>
          <span>
            <strong className="bg-gray-500 text-white px-2 py-0.5 rounded">
              C
            </strong>{" "}
            = Cancelled
          </span>
        </div>
      </div>

      {/* Search Filter */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search interviewers (min 3 letters)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        {searchQuery.length >= 3 && (
          <span className="text-sm text-muted-foreground">
            Showing {filteredInterviewers.length} of{" "}
            {interviewers.filter((i) => i.is_active).length} interviewers
          </span>
        )}
      </div>

      {/* Calendar Grid */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-muted/50">
                <th className="sticky left-0 z-10 bg-muted/50 border-r border-border p-3 text-left font-semibold min-w-[200px]">
                  Interviewer
                </th>
                {weekDays.map((date, index) => (
                  <th
                    key={index}
                    className={`border-r border-border p-3 text-center font-semibold min-w-[100px] ${
                      isToday(date) ? "bg-blue-50 dark:bg-blue-950/30" : ""
                    }`}
                  >
                    <div className="text-sm">
                      {date.toLocaleDateString("en-US", { weekday: "short" })}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(date)}
                    </div>
                  </th>
                ))}
                <th className="border-r border-border p-3 text-center font-semibold min-w-[80px] bg-muted/70">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredInterviewers.map((interviewer) => (
                <tr
                  key={interviewer.id}
                  className="border-t border-border hover:bg-muted/30"
                >
                  <td className="sticky left-0 z-10 bg-background border-r border-border p-3">
                    <div>
                      <div className="font-medium text-sm">
                        {interviewer.name}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {interviewer.email}
                      </div>
                    </div>
                  </td>
                  {weekDays.map((date, dayIndex) => {
                    const dateString = formatDateString(date);
                    const dayEvents = filterEventsByDay(
                      localEvents,
                      interviewer.email,
                      date
                    );

                    return (
                      <td
                        key={dayIndex}
                        className={`border-r border-border p-0 ${
                          isToday(date)
                            ? "bg-blue-50/50 dark:bg-blue-950/10"
                            : ""
                        }`}
                      >
                        <ReadOnlyInterviewDayCell
                          interviewerEmail={interviewer.email}
                          date={date}
                          events={dayEvents}
                        />
                      </td>
                    );
                  })}
                  <td className="border-r border-border p-3 text-center bg-muted/30">
                    <Badge variant="secondary" className="font-semibold">
                      {getWeekTotal(interviewer.email)}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {filteredInterviewers.length} active interviewer
          {filteredInterviewers.length !== 1 ? "s" : ""}
          {searchQuery.length >= 3 &&
            ` (filtered from ${
              interviewers.filter((i) => i.is_active).length
            })`}
        </span>
      </div>
    </div>
  );
}
