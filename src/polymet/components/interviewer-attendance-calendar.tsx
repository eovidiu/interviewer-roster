import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  MinusIcon,
  CheckIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface InterviewDay {
  date: string;
  count: number;
}

interface InterviewerAttendanceCalendarProps {
  interviewerName: string;
  interviewerEmail: string;
  initialData?: InterviewDay[];
  onSave?: (data: InterviewDay[]) => void;
}

export function InterviewerAttendanceCalendar({
  interviewerName,
  interviewerEmail,
  initialData = [],
  onSave,
}: InterviewerAttendanceCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [attendanceData, setAttendanceData] = useState<Map<string, number>>(
    new Map(initialData.map((d) => [d.date, d.count]))
  );
  const [hasChanges, setHasChanges] = useState(false);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const formatDate = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };

  const { daysInMonth, startingDayOfWeek, year, month } =
    getDaysInMonth(currentDate);

  const previousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  const incrementCount = (dateStr: string) => {
    const newData = new Map(attendanceData);
    const currentCount = newData.get(dateStr) || 0;
    newData.set(dateStr, currentCount + 1);
    setAttendanceData(newData);
    setHasChanges(true);
  };

  const decrementCount = (dateStr: string) => {
    const newData = new Map(attendanceData);
    const currentCount = newData.get(dateStr) || 0;
    if (currentCount > 0) {
      if (currentCount === 1) {
        newData.delete(dateStr);
      } else {
        newData.set(dateStr, currentCount - 1);
      }
      setAttendanceData(newData);
      setHasChanges(true);
    }
  };

  const handleSave = () => {
    const data: InterviewDay[] = Array.from(attendanceData.entries()).map(
      ([date, count]) => ({
        date,
        count,
      })
    );
    onSave?.(data);
    setHasChanges(false);
  };

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const totalInterviews = Array.from(attendanceData.values()).reduce(
    (sum, count) => sum + count,
    0
  );
  const daysWithInterviews = attendanceData.size;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">{interviewerName}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {interviewerEmail}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm text-muted-foreground">
                Total Interviews
              </div>
              <div className="text-2xl font-bold">{totalInterviews}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Days Active</div>
              <div className="text-2xl font-bold">{daysWithInterviews}</div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Month Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={previousMonth}>
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
          <h3 className="text-lg font-semibold">
            {monthNames[month]} {year}
          </h3>
          <Button variant="outline" size="sm" onClick={nextMonth}>
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </div>

        {/* Calendar Grid */}
        <div className="border border-border rounded-lg overflow-hidden">
          {/* Week day headers */}
          <div className="grid grid-cols-7 bg-muted">
            {weekDays.map((day) => (
              <div
                key={day}
                className="p-2 text-center text-sm font-medium text-muted-foreground border-r border-border last:border-r-0"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7">
            {/* Empty cells for days before month starts */}
            {Array.from({ length: startingDayOfWeek }).map((_, index) => (
              <div
                key={`empty-${index}`}
                className="aspect-square border-r border-b border-border bg-muted/30"
              />
            ))}

            {/* Actual days of the month */}
            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1;
              const dateStr = formatDate(year, month, day);
              const count = attendanceData.get(dateStr) || 0;
              const hasInterviews = count > 0;

              return (
                <div
                  key={day}
                  className={cn(
                    "aspect-square border-r border-b border-border p-2 relative group hover:bg-muted/50 transition-colors",
                    hasInterviews && "bg-primary/5"
                  )}
                >
                  <div className="flex flex-col h-full">
                    <div className="text-sm font-medium mb-1">{day}</div>

                    {hasInterviews ? (
                      <div className="flex-1 flex flex-col items-center justify-center gap-1">
                        <Badge variant="default" className="text-xs">
                          {count} {count === 1 ? "interview" : "interviews"}
                        </Badge>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 w-6 p-0"
                            onClick={() => decrementCount(dateStr)}
                          >
                            <MinusIcon className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 w-6 p-0"
                            onClick={() => incrementCount(dateStr)}
                          >
                            <PlusIcon className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => incrementCount(dateStr)}
                        >
                          <PlusIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Save Button */}
        {hasChanges && (
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setAttendanceData(
                  new Map(initialData.map((d) => [d.date, d.count]))
                );
                setHasChanges(false);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <CheckIcon className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
