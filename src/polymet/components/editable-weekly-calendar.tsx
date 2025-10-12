import { useState, useEffect, useCallback, useRef } from "react";
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
  SaveIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface EditableWeeklyCalendarProps {
  interviewers?: Interviewer[];
  events?: InterviewEvent[];
  onSave?: (data: Record<string, Record<string, number>>) => void;
}

export function EditableWeeklyCalendar({
  interviewers = mockInterviewers,
  events = mockInterviewEvents,
  onSave,
}: EditableWeeklyCalendarProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = day === 0 ? -6 : 1 - day; // Get Monday
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  // State to store interview counts: { interviewerEmail: { dateString: count } }
  const [interviewCounts, setInterviewCounts] = useState<
    Record<string, Record<string, number>>
  >({});

  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get the 5 weekdays (Mon-Fri)
  const weekDays = Array.from({ length: 5 }, (_, i) => {
    const date = new Date(currentWeekStart);
    date.setDate(currentWeekStart.getDate() + i);
    return date;
  });

  // Get events for a specific interviewer and date
  const getEventsForDay = useCallback(
    (interviewerEmail: string, date: Date) => {
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
    },
    [events]
  );

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

  // Initialize counts from events
  useEffect(() => {
    const counts: Record<string, Record<string, number>> = {};
    const days = Array.from({ length: 5 }, (_, i) => {
      const date = new Date(currentWeekStart);
      date.setDate(currentWeekStart.getDate() + i);
      return date;
    });

    interviewers.forEach((interviewer) => {
      counts[interviewer.email] = {};
      days.forEach((date) => {
        const dateString = formatDateString(date);
        const dayEvents = getEventsForDay(interviewer.email, date);
        counts[interviewer.email][dateString] = dayEvents.length;
      });
    });

    setInterviewCounts(counts);
    setHasChanges(false);
  }, [currentWeekStart, interviewers, getEventsForDay]);

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

  // Handle input change
  const handleCountChange = (
    interviewerEmail: string,
    dateString: string,
    value: string
  ) => {
    const numValue = value === "" ? 0 : parseInt(value, 10);
    if (isNaN(numValue) || numValue < 0) return;

    setInterviewCounts((prev) => ({
      ...prev,
      [interviewerEmail]: {
        ...prev[interviewerEmail],
        [dateString]: numValue,
      },
    }));
    setHasChanges(true);
  };

  // Auto-save function with debouncing
  const autoSave = useCallback(async () => {
    if (!hasChanges) return;

    try {
      setIsSaving(true);

      // Save interview counts to database
      // We'll update events based on the counts
      for (const [interviewerEmail, dateCounts] of Object.entries(
        interviewCounts
      )) {
        for (const [dateString, count] of Object.entries(dateCounts)) {
          // Get existing events for this interviewer and date
          const allEvents =
            await db.getInterviewEventsByInterviewer(interviewerEmail);
          const date = new Date(dateString);
          const dayStart = new Date(date);
          dayStart.setHours(0, 0, 0, 0);
          const dayEnd = new Date(date);
          dayEnd.setHours(23, 59, 59, 999);

          const existingEvents = allEvents.filter((event) => {
            const eventDate = new Date(event.start_time);
            return eventDate >= dayStart && eventDate <= dayEnd;
          });

          const currentCount = existingEvents.length;
          const targetCount = count;

          // Add or remove events to match the count
          if (targetCount > currentCount) {
            // Add new events
            for (let i = 0; i < targetCount - currentCount; i++) {
              const startTime = new Date(date);
              startTime.setHours(9 + i, 0, 0, 0);

              await db.createInterviewEvent({
                interviewer_email: interviewerEmail,
                candidate_name: `Candidate ${Date.now()}-${i}`,
                position: "Position TBD",
                start_time: startTime.toISOString(),
                duration_minutes: 60,
                status: "pending",
                notes: "Added via Mark Interviews page",
              });
            }
          } else if (targetCount < currentCount) {
            // Remove excess events (remove pending ones first)
            const eventsToRemove = existingEvents
              .sort((a, b) => {
                if (a.status === "pending" && b.status !== "pending") return -1;
                if (a.status !== "pending" && b.status === "pending") return 1;
                return 0;
              })
              .slice(0, currentCount - targetCount);

            for (const event of eventsToRemove) {
              await db.deleteInterviewEvent(event.id);
            }
          }
        }
      }

      setLastSynced(new Date());
      setHasChanges(false);

      if (onSave) {
        onSave(interviewCounts);
      }
    } catch (error) {
      console.error("Failed to auto-save:", error);
    } finally {
      setIsSaving(false);
    }
  }, [interviewCounts, hasChanges, onSave]);

  // Debounced auto-save effect
  useEffect(() => {
    if (hasChanges) {
      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Set new timeout for auto-save (2 seconds after last change)
      saveTimeoutRef.current = setTimeout(() => {
        autoSave();
      }, 2000);
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [hasChanges, autoSave]);

  // Handle manual save
  const handleSave = () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    autoSave();
  };

  // Calculate total for the week
  const getWeekTotal = (interviewerEmail: string) => {
    const counts = interviewCounts[interviewerEmail] || {};
    return Object.values(counts).reduce((sum, count) => sum + count, 0);
  };

  return (
    <div className="space-y-4">
      {/* Header with navigation */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Mark Interviews</h2>
          <p className="text-sm text-muted-foreground">{formatWeekRange()}</p>
        </div>
        <div className="flex items-center gap-2">
          {lastSynced && (
            <span className="text-sm text-muted-foreground">
              Last synced: {lastSynced.toLocaleTimeString()}
            </span>
          )}
          {isSaving && (
            <span className="text-sm text-blue-600 dark:text-blue-400">
              Saving...
            </span>
          )}
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
          {hasChanges && (
            <Button onClick={handleSave} className="gap-2" disabled={isSaving}>
              <SaveIcon className="h-4 w-4" />
              Save Changes
            </Button>
          )}
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-900 dark:text-blue-100">
          Enter the number of interviews conducted by each interviewer for each
          day. Changes are highlighted and can be saved.
        </p>
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
                      const dateString = formatDateString(date);
                      const count =
                        interviewCounts[interviewer.email]?.[dateString] || 0;
                      return (
                        <td
                          key={dayIndex}
                          className={`border-r border-border p-2 text-center ${
                            isToday(date)
                              ? "bg-blue-50/50 dark:bg-blue-950/10"
                              : ""
                          }`}
                        >
                          <Input
                            type="number"
                            min="0"
                            value={count}
                            onChange={(e) =>
                              handleCountChange(
                                interviewer.email,
                                dateString,
                                e.target.value
                              )
                            }
                            className="w-16 h-9 text-center mx-auto"
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
          Showing {interviewers.filter((i) => i.is_active).length} active
          interviewers
        </span>
        {hasChanges && (
          <span className="text-orange-600 dark:text-orange-400 font-medium">
            You have unsaved changes
          </span>
        )}
      </div>
    </div>
  );
}
