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
  SearchIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { AuditContext } from "@/polymet/data/database-service";
import { InterviewDayCell } from "./interview-day-cell";
import { createISOFromTime, createEndTime, isDuplicateTime, extractTimeFromISO } from "@/lib/time-utils";
import { toast } from "sonner";
import { useAuth } from "@/polymet/data/auth-context";

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

  // Get current user for role-based access
  const { user } = useAuth();
  const canEdit = user?.role === 'talent' || user?.role === 'admin';

  // Local state for events - load fresh data when needed
  const [localEvents, setLocalEvents] = useState<InterviewEvent[]>(events);

  const [isSaving, setIsSaving] = useState(false);
  const [addingCell, setAddingCell] = useState<string | null>(null); // Track which cell is adding
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
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

  // Find next available time slot for a day (09:00-20:00 range)
  const findNextAvailableTime = (dayEvents: InterviewEvent[]): string => {
    // Extract existing times and sort them
    const existingTimes = dayEvents.map(e => extractTimeFromISO(e.start_time)).sort();

    // Start from 09:00 and increment by 1 hour until we find a free slot
    for (let hour = 9; hour <= 20; hour++) {
      const timeString = `${hour.toString().padStart(2, '0')}:00`;
      if (!existingTimes.includes(timeString)) {
        return timeString;
      }
    }

    // Fallback to 09:00 (shouldn't reach here due to max capacity check)
    return '09:00';
  };

  // Add new interview entry (defaults: next available hour, status: pending, 1 hour duration)
  const handleAddEntry = async (interviewerEmail: string, date: Date) => {
    const cellKey = `${interviewerEmail}-${formatDateString(date)}`;
    setAddingCell(cellKey);

    try {
      const dayEvents = filterEventsByDay(localEvents, interviewerEmail, date);

      // Check max capacity first
      if (dayEvents.length >= 3) {
        toast.error('Maximum 3 interview slots per day');
        return;
      }

      // Find next available time slot
      const nextAvailableTime = findNextAvailableTime(dayEvents);

      const startTime = createISOFromTime(date, nextAvailableTime);
      const endTime = createEndTime(date, nextAvailableTime, 60);

      const newEvent = await db.createInterviewEvent({
        interviewer_email: interviewerEmail,
        start_time: startTime,
        end_time: endTime,
        status: 'pending',
        notes: 'Added via Mark Interviews page',
        duration_minutes: 60,
      }, auditContext);

      if (newEvent) {
        setLocalEvents(prev => [...prev, newEvent]);
        toast.success('Interview slot added');
        setLastSynced(new Date());
      }
    } catch (error) {
      console.error('Failed to add interview:', error);
      toast.error('Failed to add interview slot');
    } finally {
      setAddingCell(null);
    }
  };

  // Update interview time
  const handleTimeChange = async (eventId: string, newTime: string) => {
    try {
      const event = localEvents.find(e => e.id === eventId);
      if (!event) throw new Error('Event not found');

      const date = new Date(event.start_time);
      const dayEvents = filterEventsByDay(localEvents, event.interviewer_email, date);

      // Check for duplicate time (excluding current event)
      if (isDuplicateTime(newTime, dayEvents, eventId)) {
        throw new Error('This time slot is already booked for this interviewer');
      }

      const newStartTime = createISOFromTime(date, newTime);
      const newEndTime = createEndTime(date, newTime, 60);

      const updatedEvent = await db.updateInterviewEvent(eventId, {
        start_time: newStartTime,
        end_time: newEndTime,
      }, auditContext);

      if (updatedEvent) {
        setLocalEvents(prev => prev.map(e => e.id === eventId ? updatedEvent : e));
        setLastSynced(new Date());
      }
    } catch (error) {
      console.error('Failed to update time:', error);
      throw error; // Re-throw to let component handle UI feedback
    }
  };

  // Update interview status
  const handleStatusChange = async (eventId: string, newStatus: InterviewEvent['status']) => {
    try {
      const updatedEvent = await db.updateInterviewEvent(eventId, {
        status: newStatus,
        marked_by: auditContext.userEmail,
        marked_at: new Date().toISOString(),
      }, auditContext);

      if (updatedEvent) {
        setLocalEvents(prev => prev.map(e => e.id === eventId ? updatedEvent : e));
        toast.success(`Status updated to ${newStatus}`);
        setLastSynced(new Date());
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      throw error;
    }
  };

  // Delete interview entry
  const handleDelete = async (eventId: string) => {
    try {
      await db.deleteInterviewEvent(eventId, auditContext);
      setLocalEvents(prev => prev.filter(e => e.id !== eventId));
      toast.success('Interview slot deleted');
      setLastSynced(new Date());
    } catch (error) {
      console.error('Failed to delete interview:', error);
      throw error;
    }
  };

  // Calculate total interviews for the current week per interviewer
  const getWeekTotal = (interviewerEmail: string) => {
    const weekStart = new Date(currentWeekStart);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 4); // Friday (Mon + 4 days)
    weekEnd.setHours(23, 59, 59, 999);

    return localEvents.filter(event => {
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
    const nameParts = fullName.split(' ');

    return (
      fullName.includes(query) ||
      email.includes(query) ||
      nameParts.some(part => part.includes(query))
    );
  });

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

      {/* Status Legend */}
      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-900 dark:text-blue-100 mb-2">
          <strong>How to use:</strong> Click the + button to add interview slots. Enter time (HH:MM format, 09:00-20:00) and select status.
          Changes save automatically.
        </p>
        <div className="flex gap-4 text-xs text-blue-800 dark:text-blue-200">
          <span><strong className="bg-green-500 text-white px-2 py-0.5 rounded">A</strong> = Attended</span>
          <span><strong className="bg-yellow-500 text-white px-2 py-0.5 rounded">P</strong> = Pending</span>
          <span><strong className="bg-red-500 text-white px-2 py-0.5 rounded">G</strong> = Ghosted</span>
          <span><strong className="bg-gray-500 text-white px-2 py-0.5 rounded">C</strong> = Cancelled</span>
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
            Showing {filteredInterviewers.length} of {interviewers.filter(i => i.is_active).length} interviewers
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
                      const dayEvents = filterEventsByDay(localEvents, interviewer.email, date);
                      const cellKey = `${interviewer.email}-${dateString}`;

                      return (
                        <td
                          key={dayIndex}
                          className={`border-r border-border p-0 ${
                            isToday(date)
                              ? "bg-blue-50/50 dark:bg-blue-950/10"
                              : ""
                          }`}
                        >
                          <InterviewDayCell
                            interviewerEmail={interviewer.email}
                            date={date}
                            events={dayEvents}
                            onAddEntry={handleAddEntry}
                            onTimeChange={handleTimeChange}
                            onStatusChange={handleStatusChange}
                            onDelete={handleDelete}
                            canEdit={canEdit}
                            isAdding={addingCell === cellKey}
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
          Showing {filteredInterviewers.length} active interviewer{filteredInterviewers.length !== 1 ? 's' : ''}
          {searchQuery.length >= 3 && ` (filtered from ${interviewers.filter((i) => i.is_active).length})`}
        </span>
      </div>
    </div>
  );
}
