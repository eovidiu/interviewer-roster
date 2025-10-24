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
import type { AuditContext } from "@/polymet/data/database-service";

interface EditableWeeklyCalendarProps {
  interviewers?: Interviewer[];
  events?: InterviewEvent[];
  onSave?: (data: Record<string, Record<string, number>>) => void;
  auditContext?: AuditContext;
}

export function EditableWeeklyCalendar({
  interviewers = mockInterviewers,
  events = mockInterviewEvents,
  onSave,
  auditContext,
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

  // Local state for events - load fresh data when needed
  const [localEvents, setLocalEvents] = useState<InterviewEvent[]>(events);

  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initializedRef = useRef(false);
  const currentWeekRef = useRef(currentWeekStart.toISOString());

  // Get the 5 weekdays (Mon-Fri)
  const weekDays = Array.from({ length: 5 }, (_, i) => {
    const date = new Date(currentWeekStart);
    date.setDate(currentWeekStart.getDate() + i);
    return date;
  });

  // Helper function to filter events by day (not a hook, so it doesn't cause re-renders)
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

  // Get events for a specific interviewer and date (for use during saves)
  const getEventsForDay = useCallback(
    (interviewerEmail: string, date: Date) => {
      return filterEventsByDay(localEvents, interviewerEmail, date);
    },
    [localEvents]
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

  // Load events and calculate counts ONLY on initial load or week change
  // Do NOT recalculate when localEvents changes (which happens during async loads)
  useEffect(() => {
    const weekString = currentWeekStart.toISOString();
    const weekChanged = currentWeekRef.current !== weekString;

    // Only reload and recalculate if:
    // 1. First time loading (not initialized)
    // 2. Week changed
    if (!initializedRef.current || weekChanged) {
      const loadAndCalculate = async () => {
        try {
          // Load fresh events from database
          const freshEvents = await db.getInterviewEvents();

          // Calculate counts from fresh events
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
              const dayEvents = filterEventsByDay(
                freshEvents,
                interviewer.email,
                date
              );
              counts[interviewer.email][dateString] = dayEvents.length;
            });
          });

          // Update state with fresh data
          setLocalEvents(freshEvents);
          setInterviewCounts(counts);
          setHasChanges(false);
          initializedRef.current = true;
          currentWeekRef.current = weekString;
        } catch (error) {
          console.error("Failed to load events:", error);
        }
      };

      loadAndCalculate();
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

  // Handle input change
  const handleCountChange = async (
    interviewerEmail: string,
    dateString: string,
    value: string
  ) => {
    const numValue = value === "" ? 0 : parseInt(value, 10);
    if (isNaN(numValue) || numValue < 0) return;

    // Store previous value for rollback on error
    const previousValue = interviewCounts[interviewerEmail]?.[dateString] || 0;

    // Update UI immediately (optimistic update)
    setInterviewCounts((prev) => ({
      ...prev,
      [interviewerEmail]: {
        ...prev[interviewerEmail],
        [dateString]: numValue,
      },
    }));

    // Save to database
    await saveInterviewCount(interviewerEmail, dateString, numValue, previousValue);
  };

  // Save a single interview count for a specific interviewer and date
  const saveInterviewCount = async (
    interviewerEmail: string,
    dateString: string,
    targetCount: number,
    previousValue: number
  ) => {
    try {
      setIsSaving(true);

      // Get existing events for this interviewer and date
      const allEvents = await db.getInterviewEventsByInterviewer(interviewerEmail);
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

      // Add or remove events to match the count
      if (targetCount > currentCount) {
        // Add new events
        const newEvents: InterviewEvent[] = [];
        for (let i = 0; i < targetCount - currentCount; i++) {
          const startTime = new Date(date);
          startTime.setHours(9 + i, 0, 0, 0);

          const endTime = new Date(startTime);
          endTime.setMinutes(endTime.getMinutes() + 60);

          const newEvent = await db.createInterviewEvent({
              interviewer_email: interviewerEmail,
              candidate_name: `Candidate ${Date.now()}-${i}`,
              position: "Position TBD",
              start_time: startTime.toISOString(),
              end_time: endTime.toISOString(),
              duration_minutes: 60,
              status: "pending",
              notes: "Added via Mark Interviews page",
            }, auditContext);

          if (newEvent) {
            newEvents.push(newEvent);
          }
        }

        // Update localEvents with newly created events
        setLocalEvents((prev) => [...prev, ...newEvents]);
      } else if (targetCount < currentCount) {
        // Remove excess events (remove pending ones first)
        const eventsToRemove = existingEvents
          .sort((a, b) => {
            if (a.status === "pending" && b.status !== "pending") return -1;
            if (a.status !== "pending" && b.status === "pending") return 1;
            return 0;
          })
          .slice(0, currentCount - targetCount);

        const removedIds = new Set<string>();
        for (const event of eventsToRemove) {
          await db.deleteInterviewEvent(event.id, auditContext);
          removedIds.add(event.id);
        }

        // Update localEvents by removing deleted events
        setLocalEvents((prev) => prev.filter(event => !removedIds.has(event.id)));
      }

      setLastSynced(new Date());
    } catch (error) {
      console.error("Failed to save interview count:", error);
      // On error, revert the UI state to previous value
      setInterviewCounts((prev) => ({
        ...prev,
        [interviewerEmail]: {
          ...prev[interviewerEmail],
          [dateString]: previousValue,
        },
      }));
    } finally {
      setIsSaving(false);
    }
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
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-900 dark:text-blue-100">
          <strong>How to mark interviews:</strong> Check the box for days when an interviewer conducted interviews.
          By default, checking a box counts as 1 interview. Click "2" or "3" to specify multiple interviews for that day.
          Changes save automatically.
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
                      const isChecked = count > 0;

                      return (
                        <td
                          key={dayIndex}
                          className={`border-r border-border p-2 text-center ${
                            isToday(date)
                              ? "bg-blue-50/50 dark:bg-blue-950/10"
                              : ""
                          }`}
                        >
                          <div className="flex flex-col items-center gap-1">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                const newValue = e.target.checked ? "1" : "0";
                                handleCountChange(
                                  interviewer.email,
                                  dateString,
                                  newValue
                                );
                              }}
                              className="h-4 w-4 cursor-pointer"
                            />
                            <div className="flex gap-1">
                              {[1, 2, 3].map((num) => (
                                <button
                                  key={num}
                                  type="button"
                                  onClick={() => {
                                    handleCountChange(
                                      interviewer.email,
                                      dateString,
                                      num.toString()
                                    );
                                  }}
                                  disabled={!isChecked}
                                  className={`
                                    w-6 h-6 text-xs font-medium rounded
                                    transition-colors cursor-pointer
                                    ${isChecked ? 'hover:bg-primary/20' : 'cursor-not-allowed opacity-40'}
                                    ${count === num && isChecked
                                      ? 'bg-primary text-primary-foreground'
                                      : 'bg-muted text-muted-foreground'
                                    }
                                  `}
                                >
                                  {num}
                                </button>
                              ))}
                            </div>
                          </div>
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
      </div>
    </div>
  );
}
