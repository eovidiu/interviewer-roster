import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { InterviewEvent } from "@/polymet/data/mock-interview-events-data";
import { CheckCircle2Icon, XCircleIcon, BanIcon } from "lucide-react";

interface MarkAttendanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: InterviewEvent | null;
  onSubmit: (
    eventId: string,
    status: "attended" | "ghosted" | "cancelled",
    notes: string
  ) => void;
}

export function MarkAttendanceDialog({
  open,
  onOpenChange,
  event,
  onSubmit,
}: MarkAttendanceDialogProps) {
  const [status, setStatus] = useState<"attended" | "ghosted" | "cancelled">(
    "attended"
  );
  const [notes, setNotes] = useState("");

  const handleSubmit = () => {
    if (!event) return;
    onSubmit(event.id, status, notes);
    setNotes("");
    setStatus("attended");
    onOpenChange(false);
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!event) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Mark Attendance</DialogTitle>
          <DialogDescription>
            Update the attendance status for this interview event
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="text-sm font-medium">Event Details</div>
            <div className="bg-muted p-3 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Interviewer:</span>
                <span className="font-medium">{event.interviewer_email}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Date & Time:</span>
                <span className="font-medium">
                  {formatDateTime(event.start_time)}
                </span>
              </div>
              {event.skills_assessed && event.skills_assessed.length > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Skills:</span>
                  <span className="font-medium">
                    {event.skills_assessed.join(", ")}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <Label>Attendance Status</Label>
            <RadioGroup
              value={status}
              onValueChange={(value) => setStatus(value as any)}
            >
              <div className="flex items-center space-x-2 p-3 border border-border rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="attended" id="attended" />

                <Label
                  htmlFor="attended"
                  className="flex items-center gap-2 cursor-pointer flex-1"
                >
                  <CheckCircle2Icon className="h-4 w-4 text-green-600 dark:text-green-400" />

                  <div>
                    <div className="font-medium">Attended</div>
                    <div className="text-xs text-muted-foreground">
                      Candidate showed up for the interview
                    </div>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-3 border border-border rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="ghosted" id="ghosted" />

                <Label
                  htmlFor="ghosted"
                  className="flex items-center gap-2 cursor-pointer flex-1"
                >
                  <XCircleIcon className="h-4 w-4 text-red-600 dark:text-red-400" />

                  <div>
                    <div className="font-medium">No Show</div>
                    <div className="text-xs text-muted-foreground">
                      Candidate did not show up
                    </div>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-3 border border-border rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="cancelled" id="cancelled" />

                <Label
                  htmlFor="cancelled"
                  className="flex items-center gap-2 cursor-pointer flex-1"
                >
                  <BanIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />

                  <div>
                    <div className="font-medium">Cancelled</div>
                    <div className="text-xs text-muted-foreground">
                      Interview was cancelled
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any relevant notes about the interview..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
