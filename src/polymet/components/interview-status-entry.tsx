import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InterviewEvent } from "@/polymet/data/mock-interview-events-data";
import {
  extractTimeFromISO,
  validateInterviewTime,
  getStatusDisplay,
} from "@/lib/time-utils";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface InterviewStatusEntryProps {
  event: InterviewEvent;
  onTimeChange: (eventId: string, newTime: string) => Promise<void>;
  onStatusChange: (
    eventId: string,
    newStatus: InterviewEvent["status"]
  ) => Promise<void>;
  onDelete: (eventId: string) => Promise<void>;
  disabled?: boolean;
}

export function InterviewStatusEntry({
  event,
  onTimeChange,
  onStatusChange,
  onDelete,
  disabled = false,
}: InterviewStatusEntryProps) {
  const [time, setTime] = useState(extractTimeFromISO(event.start_time));
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleTimeBlur = async () => {
    setIsEditing(false);

    // If time hasn't changed, do nothing
    const currentTime = extractTimeFromISO(event.start_time);
    if (time === currentTime) {
      return;
    }

    // Validate time
    const validation = validateInterviewTime(time);
    if (!validation.valid) {
      toast.error(validation.error);
      setTime(currentTime); // Revert to original
      return;
    }

    // Save new time
    setIsSaving(true);
    try {
      await onTimeChange(event.id, time);
      toast.success("Time updated");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update time";
      toast.error(errorMessage);
      setTime(currentTime); // Revert to original
    } finally {
      setIsSaving(false);
    }
  };

  const handleTimeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur(); // Trigger blur event to save
    } else if (e.key === "Escape") {
      setTime(extractTimeFromISO(event.start_time)); // Revert
      e.currentTarget.blur();
    }
  };

  const handleStatusClick = async (newStatus: InterviewEvent["status"]) => {
    if (newStatus === event.status || disabled || isSaving) {
      return;
    }

    setIsSaving(true);
    try {
      await onStatusChange(event.id, newStatus);
      // Success toast handled by parent component
    } catch (error) {
      toast.error("Failed to update status");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (disabled || isSaving || isDeleting) {
      return;
    }

    setIsDeleting(true);
    try {
      await onDelete(event.id);
      // Success toast handled by parent component
    } catch (error) {
      toast.error("Failed to delete entry");
      setIsDeleting(false);
    }
  };

  const statuses: Array<InterviewEvent["status"]> = [
    "attended",
    "pending",
    "ghosted",
    "cancelled",
  ];

  return (
    <div className="flex items-center gap-2 py-1 px-1 border-b last:border-0 hover:bg-gray-50 transition-colors">
      {/* Time Input */}
      <div className="relative">
        <Input
          type="text"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          onFocus={() => setIsEditing(true)}
          onBlur={handleTimeBlur}
          onKeyDown={handleTimeKeyDown}
          disabled={disabled || isSaving || isDeleting}
          className="w-20 h-8 text-sm font-mono"
          placeholder="HH:MM"
          title="Enter time in HH:MM format (09:00-20:00)"
        />
        {isSaving && (
          <Loader2 className="absolute right-2 top-2 h-4 w-4 animate-spin text-gray-400" />
        )}
      </div>

      {/* Status Buttons */}
      <div className="flex gap-1">
        {statuses.map((status) => {
          const display = getStatusDisplay(status);
          const isActive = event.status === status;

          return (
            <Button
              key={status}
              size="sm"
              variant={isActive ? "default" : "outline"}
              onClick={() => handleStatusClick(status)}
              disabled={disabled || isSaving || isDeleting}
              className={`w-8 h-8 p-0 text-xs font-semibold ${
                isActive ? display.colorClass : display.outlineClass
              }`}
              title={display.fullLabel}
            >
              {display.label}
            </Button>
          );
        })}
      </div>

      {/* Delete Button */}
      <Button
        size="sm"
        variant="ghost"
        onClick={handleDelete}
        disabled={disabled || isSaving || isDeleting}
        className="ml-auto w-6 h-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
        title="Delete this interview slot"
      >
        {isDeleting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <span className="text-lg leading-none">−</span>
        )}
      </Button>
    </div>
  );
}
