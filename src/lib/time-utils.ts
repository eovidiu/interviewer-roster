import { InterviewEvent } from "@/polymet/data/mock-interview-events-data";

/**
 * Extracts HH:MM time from ISO datetime string
 * Example: "2024-03-18T14:30:00Z" → "14:30"
 */
export function extractTimeFromISO(isoString: string): string {
  const date = new Date(isoString);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Creates ISO datetime from date and HH:MM time
 * Example: Date(2024-03-18), "14:30" → "2024-03-18T14:30:00.000Z"
 */
export function createISOFromTime(date: Date, time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const newDate = new Date(date);
  newDate.setHours(hours, minutes, 0, 0);
  return newDate.toISOString();
}

/**
 * Validates time is in HH:MM format and within 09:00-20:00 range
 * Returns validation result with optional error message
 */
export function validateInterviewTime(time: string): {
  valid: boolean;
  error?: string
} {
  // Check format: HH:MM
  const timeRegex = /^([0-1][0-9]|2[0]):([0-5][0-9])$/;

  if (!timeRegex.test(time)) {
    return {
      valid: false,
      error: 'Invalid time format. Use HH:MM'
    };
  }

  const [hours, minutes] = time.split(':').map(Number);

  // Check range: 09:00 to 20:00
  if (hours < 9 || hours > 20) {
    return {
      valid: false,
      error: 'Interview time must be between 09:00 and 20:00'
    };
  }

  // Edge case: 20:01 and beyond are invalid
  if (hours === 20 && minutes > 0) {
    return {
      valid: false,
      error: 'Interview time must be between 09:00 and 20:00'
    };
  }

  return { valid: true };
}

/**
 * Sorts interview events by start time (earliest first)
 */
export function sortEventsByTime(events: InterviewEvent[]): InterviewEvent[] {
  return [...events].sort((a, b) => {
    const timeA = new Date(a.start_time).getTime();
    const timeB = new Date(b.start_time).getTime();
    return timeA - timeB;
  });
}

/**
 * Checks if a time already exists in a list of events
 * Used to prevent duplicate time slots
 */
export function isDuplicateTime(
  time: string,
  existingEvents: InterviewEvent[],
  excludeEventId?: string
): boolean {
  return existingEvents.some(event => {
    // Skip the event we're editing
    if (excludeEventId && event.id === excludeEventId) {
      return false;
    }
    return extractTimeFromISO(event.start_time) === time;
  });
}

/**
 * Gets status display properties for UI
 * Returns label, color class, and whether status is active
 */
export function getStatusDisplay(status: InterviewEvent['status']) {
  const statusMap = {
    attended: {
      label: 'A',
      fullLabel: 'Attended',
      colorClass: 'bg-green-500 hover:bg-green-600 text-white',
      outlineClass: 'border-green-500 text-green-700 hover:bg-green-50',
    },
    pending: {
      label: 'P',
      fullLabel: 'Pending',
      colorClass: 'bg-yellow-500 hover:bg-yellow-600 text-white',
      outlineClass: 'border-yellow-500 text-yellow-700 hover:bg-yellow-50',
    },
    ghosted: {
      label: 'G',
      fullLabel: 'Ghosted',
      colorClass: 'bg-red-500 hover:bg-red-600 text-white',
      outlineClass: 'border-red-500 text-red-700 hover:bg-red-50',
    },
    cancelled: {
      label: 'C',
      fullLabel: 'Cancelled',
      colorClass: 'bg-gray-500 hover:bg-gray-600 text-white',
      outlineClass: 'border-gray-500 text-gray-700 hover:bg-gray-50',
    },
  };

  return statusMap[status];
}

/**
 * Creates end time by adding duration to start time
 * Default duration is 60 minutes (1 hour)
 */
export function createEndTime(date: Date, startTime: string, durationMinutes: number = 60): string {
  const startISO = createISOFromTime(date, startTime);
  const endDate = new Date(startISO);
  endDate.setMinutes(endDate.getMinutes() + durationMinutes);
  return endDate.toISOString();
}
