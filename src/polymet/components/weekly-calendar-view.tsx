import { useState } from "react";
import {
  mockInterviewers,
  Interviewer,
} from "@/polymet/data/mock-interviewers-data";
import {
  mockInterviewEvents,
  InterviewEvent,
} from "@/polymet/data/mock-interview-events-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface WeeklyCalendarViewProps {
  interviewers?: Interviewer[];
  events?: InterviewEvent[];
}

export function WeeklyCalendarView({
  interviewers = mockInterviewers,
  events = mockInterviewEvents,
}: WeeklyCalendarViewProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = day === 0 ? -6 : 1 - day; // Get Monday
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  // Get the 5 weekdays (Mon-Fri)
  const weekDays = Array.from({ length: 5 }, (_, i) => {
    const date = new Date(currentWeekStart);
    date.setDate(currentWeekStart.getDate() + i);
    return date;
  });

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

  // Get events for a specific interviewer and date
  const getEventsForDay = (interviewerEmail: string, date: Date) => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    return events.filter((event) => {
      const eventDate = new Date(event.start_time);
      return (
        event.interviewer_email === interviewerEmail &&
        eventDate >= dayStart &&
        eventDate <= dayEnd
      );
    });
  };

  // Get status code for display
  const getStatusCode = (status: string) => {
    switch (status) {
      case "attended":
        return "A";
      case "pending":
        return "P";
      case "ghosted":
        return "G";
      case "cancelled":
        return "C";
      default:
        return "?";
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "attended":
        return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700";
      case "pending":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700";
      case "ghosted":
        return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700";
      case "cancelled":
        return "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
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

  return (
    <div className="space-y-4">
      {/* Header with navigation */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Weekly Calendar</h2>
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

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs bg-muted/50 p-3 rounded-lg border border-border">
        <span className="font-medium">Status Codes:</span>
        <div className="flex items-center gap-1">
          <Badge
            variant="outline"
            className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700"
          >
            A
          </Badge>
          <span className="text-muted-foreground">Attended</span>
        </div>
        <div className="flex items-center gap-1">
          <Badge
            variant="outline"
            className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700"
          >
            P
          </Badge>
          <span className="text-muted-foreground">Pending</span>
        </div>
        <div className="flex items-center gap-1">
          <Badge
            variant="outline"
            className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700"
          >
            G
          </Badge>
          <span className="text-muted-foreground">Ghosted</span>
        </div>
        <div className="flex items-center gap-1">
          <Badge
            variant="outline"
            className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600"
          >
            C
          </Badge>
          <span className="text-muted-foreground">Cancelled</span>
        </div>
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
                    className={`border-r border-border p-3 text-center font-semibold min-w-[120px] ${
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
              </tr>
            </thead>
            <tbody>
              {interviewers
                .filter((interviewer) => interviewer.is_active)
                .map((interviewer) => (
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
                      const dayEvents = getEventsForDay(
                        interviewer.email,
                        date
                      );
                      return (
                        <td
                          key={dayIndex}
                          className={`border-r border-border p-2 text-center ${
                            isToday(date)
                              ? "bg-blue-50/50 dark:bg-blue-950/10"
                              : ""
                          }`}
                        >
                          {dayEvents.length > 0 ? (
                            <TooltipProvider>
                              <div className="flex flex-wrap gap-1 justify-center">
                                {dayEvents.map((event) => (
                                  <Tooltip key={event.id}>
                                    <TooltipTrigger>
                                      <Badge
                                        variant="outline"
                                        className={`text-xs font-bold ${getStatusColor(
                                          event.status
                                        )}`}
                                      >
                                        {getStatusCode(event.status)}
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <div className="text-xs space-y-1">
                                        <div className="font-semibold">
                                          {new Date(
                                            event.start_time
                                          ).toLocaleTimeString("en-US", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })}
                                        </div>
                                        <div className="capitalize">
                                          {event.status}
                                        </div>
                                        {event.skills_assessed &&
                                          event.skills_assessed.length > 0 && (
                                            <div className="text-muted-foreground">
                                              {event.skills_assessed.join(", ")}
                                            </div>
                                          )}
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                ))}
                              </div>
                            </TooltipProvider>
                          ) : (
                            <span className="text-muted-foreground text-xs">
                              -
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="text-sm text-muted-foreground text-center">
        Showing {interviewers.filter((i) => i.is_active).length} active
        interviewers
      </div>
    </div>
  );
}
