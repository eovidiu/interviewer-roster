import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/polymet/components/status-badge";
import { Interviewer } from "@/polymet/data/mock-interviewers-data";
import { InterviewEvent } from "@/polymet/data/mock-interview-events-data";
import {
  CalendarIcon,
  ClockIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CheckCircle2Icon,
  XCircleIcon,
} from "lucide-react";
import { useState } from "react";

interface InterviewerScheduleCardProps {
  interviewer: Interviewer;
  events: InterviewEvent[];
  onViewEvent?: (event: InterviewEvent) => void;
}

export function InterviewerScheduleCard({
  interviewer,
  events,
  onViewEvent,
}: InterviewerScheduleCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Sort events by start time
  const sortedEvents = [...events].sort(
    (a, b) =>
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );

  const now = new Date();
  const upcomingEvents = sortedEvents.filter(
    (event) => new Date(event.start_time) > now
  );
  const pastEvents = sortedEvents.filter(
    (event) => new Date(event.start_time) <= now
  );

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      time: date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
    };
  };

  const formatDuration = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const durationMs = endDate.getTime() - startDate.getTime();
    const durationMin = Math.round(durationMs / (1000 * 60));
    return `${durationMin} min`;
  };

  const displayEvents = isExpanded ? sortedEvents : upcomingEvents.slice(0, 3);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold">
              {interviewer.name}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {interviewer.email}
            </p>
            <div className="flex flex-wrap gap-1 mt-2">
              {interviewer.skills.slice(0, 3).map((skill) => (
                <Badge key={skill} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
              {interviewer.skills.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{interviewer.skills.length - 3}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge
              variant={interviewer.is_active ? "default" : "secondary"}
              className={
                interviewer.is_active
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800"
                  : ""
              }
            >
              {interviewer.is_active ? "Active" : "Inactive"}
            </Badge>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {interviewer.calendar_sync_enabled ? (
                <>
                  <CheckCircle2Icon className="h-3 w-3 text-green-600 dark:text-green-400" />

                  <span>Synced</span>
                </>
              ) : (
                <>
                  <XCircleIcon className="h-3 w-3" />

                  <span>Not synced</span>
                </>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-muted-foreground">
              <CalendarIcon className="h-4 w-4" />

              <span>{events.length} total</span>
            </div>
            <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
              <ClockIcon className="h-4 w-4" />

              <span>{upcomingEvents.length} upcoming</span>
            </div>
          </div>
        </div>

        {displayEvents.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            No scheduled interviews
          </div>
        ) : (
          <div className="space-y-2">
            {displayEvents.map((event) => {
              const { date, time } = formatDateTime(event.start_time);
              const duration = formatDuration(event.start_time, event.end_time);

              return (
                <div
                  key={event.id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => onViewEvent?.(event)}
                >
                  <div className="flex-shrink-0 pt-0.5">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium">{date}</span>
                          <span className="text-xs text-muted-foreground">
                            {time}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            • {duration}
                          </span>
                        </div>
                        {event.skills_assessed &&
                          event.skills_assessed.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {event.skills_assessed.map((skill) => (
                                <Badge
                                  key={skill}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          )}
                      </div>
                      <StatusBadge status={event.status} />
                    </div>
                    {event.notes && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        {event.notes}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {(upcomingEvents.length > 3 || pastEvents.length > 0) && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <>
                <ChevronUpIcon className="h-4 w-4 mr-2" />
                Show less
              </>
            ) : (
              <>
                <ChevronDownIcon className="h-4 w-4 mr-2" />
                Show all {events.length} events
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
