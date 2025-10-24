import { InterviewEvent } from "@/polymet/data/mock-interview-events-data";
import { sortEventsByTime } from "@/lib/time-utils";
import { ReadOnlyInterviewStatusEntry } from "./readonly-interview-status-entry";

interface ReadOnlyInterviewDayCellProps {
  interviewerEmail: string;
  date: Date;
  events: InterviewEvent[]; // Already filtered for this interviewer + day
}

/**
 * Read-only day cell for viewing interview schedules
 * Shows 0-3 interview slots sorted by time
 * No editing, adding, or deleting capabilities
 */
export function ReadOnlyInterviewDayCell({
  events,
}: ReadOnlyInterviewDayCellProps) {
  const sortedEvents = sortEventsByTime(events);
  const hasEntries = sortedEvents.length > 0;

  return (
    <div className="relative min-h-[100px] p-2 border-r border-b last:border-r-0">
      {/* Entry Rows */}
      {hasEntries && (
        <div className="space-y-1 mt-1">
          {sortedEvents.map((event) => (
            <ReadOnlyInterviewStatusEntry key={event.id} event={event} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!hasEntries && (
        <div className="flex items-center justify-center h-full min-h-[80px]">
          <div className="text-xs text-gray-400">No interviews</div>
        </div>
      )}
    </div>
  );
}
