import { Button } from "@/components/ui/button";
import { InterviewEvent } from "@/polymet/data/mock-interview-events-data";
import { sortEventsByTime } from "@/lib/time-utils";
import { InterviewStatusEntry } from "./interview-status-entry";
import { PlusIcon } from "lucide-react";

interface InterviewDayCellProps {
  interviewerEmail: string;
  date: Date;
  events: InterviewEvent[]; // Already filtered for this interviewer + day
  onAddEntry: (interviewerEmail: string, date: Date) => Promise<void>;
  onTimeChange: (eventId: string, newTime: string) => Promise<void>;
  onStatusChange: (
    eventId: string,
    newStatus: InterviewEvent["status"]
  ) => Promise<void>;
  onDelete: (eventId: string) => Promise<void>;
  canEdit: boolean; // Based on user role (talent or admin)
  isAdding?: boolean; // Loading state for add operation
}

export function InterviewDayCell({
  interviewerEmail,
  date,
  events,
  onAddEntry,
  onTimeChange,
  onStatusChange,
  onDelete,
  canEdit,
  isAdding = false,
}: InterviewDayCellProps) {
  const sortedEvents = sortEventsByTime(events);
  const canAddMore = sortedEvents.length < 3;
  const hasEntries = sortedEvents.length > 0;

  const handleAddClick = () => {
    if (!canEdit || !canAddMore || isAdding) return;
    onAddEntry(interviewerEmail, date);
  };

  return (
    <div className="relative min-h-[100px] p-2 border-r border-b last:border-r-0 hover:bg-gray-50/50 transition-colors">
      {/* Add Button (top right corner) */}
      {canEdit && canAddMore && (
        <Button
          size="sm"
          variant="ghost"
          onClick={handleAddClick}
          disabled={isAdding}
          className="absolute top-1 right-1 w-6 h-6 p-0 text-gray-400 hover:text-gray-700 hover:bg-gray-200"
          title="Add interview slot"
        >
          {isAdding ? (
            <span className="text-xs">...</span>
          ) : (
            <PlusIcon className="h-4 w-4" />
          )}
        </Button>
      )}

      {/* Entry Rows */}
      {hasEntries && (
        <div className="space-y-1 mt-1">
          {sortedEvents.map((event) => (
            <InterviewStatusEntry
              key={event.id}
              event={event}
              onTimeChange={onTimeChange}
              onStatusChange={onStatusChange}
              onDelete={onDelete}
              disabled={!canEdit}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!hasEntries && (
        <div className="flex items-center justify-center h-full min-h-[80px]">
          {canEdit ? (
            <div className="text-xs text-gray-400 text-center">
              {canAddMore && (
                <span>Click + to add<br />interview slot</span>
              )}
            </div>
          ) : (
            <div className="text-xs text-gray-400">
              No interviews
            </div>
          )}
        </div>
      )}

      {/* Max Capacity Indicator */}
      {sortedEvents.length === 3 && canEdit && (
        <div className="mt-1 text-[10px] text-gray-400 text-center">
          Max 3 slots
        </div>
      )}
    </div>
  );
}
