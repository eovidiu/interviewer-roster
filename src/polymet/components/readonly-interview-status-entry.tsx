import { Button } from "@/components/ui/button";
import { InterviewEvent } from "@/polymet/data/mock-interview-events-data";
import { extractTimeFromISO, getStatusDisplay } from "@/lib/time-utils";

interface ReadOnlyInterviewStatusEntryProps {
  event: InterviewEvent;
}

/**
 * Read-only display of interview time and status
 * Shows time as text and disabled status buttons
 * No editing or deletion capabilities
 */
export function ReadOnlyInterviewStatusEntry({
  event,
}: ReadOnlyInterviewStatusEntryProps) {
  const time = extractTimeFromISO(event.start_time);
  const statuses: Array<InterviewEvent["status"]> = [
    "attended",
    "pending",
    "ghosted",
    "cancelled",
  ];

  return (
    <div className="flex items-center gap-2 py-1 px-1 border-b last:border-0">
      {/* Time Display (text, not input) */}
      <span className="w-20 text-sm font-mono text-gray-700">{time}</span>

      {/* Status Buttons (disabled, non-interactive) */}
      <div className="flex gap-1">
        {statuses.map((status) => {
          const display = getStatusDisplay(status);
          const isActive = event.status === status;

          return (
            <Button
              key={status}
              size="sm"
              variant={isActive ? "default" : "outline"}
              disabled={true}
              className={`w-8 h-8 p-0 text-xs font-semibold pointer-events-none opacity-80 cursor-default ${
                isActive ? display.colorClass : display.outlineClass
              }`}
              title={display.fullLabel}
            >
              {display.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
