# Implementation Plan: Interview Status Tracking with Time Slots

## Executive Summary

This plan transforms the existing "Mark Interviews" page from a simple count-based system to a detailed time-slotted status tracking system. The current implementation already has 90% of the required infrastructure in place.

## Current State Analysis

### ✅ What We Already Have
1. **Database Schema** - `interview_events` table has all required fields:
   - `start_time` (TEXT) - stores ISO datetime
   - `end_time` (TEXT) - stores ISO datetime
   - `status` (TEXT) - CHECK constraint for: pending, attended, ghosted, cancelled
   - `interviewer_email` (TEXT) - FK to interviewers
   - `marked_by`, `marked_at` - audit trail fields
   - `notes` (TEXT) - for additional information

2. **Authentication & Authorization**:
   - User roles: viewer, talent (TA), admin
   - OAuth integration with Google
   - JWT token-based auth
   - Role checks available via `useAuth()` hook

3. **Backend API**:
   - CRUD operations for interview_events
   - Repository pattern in place
   - Audit logging infrastructure
   - Fastify server with TypeBox validation

4. **Frontend Infrastructure**:
   - React + TypeScript
   - EditableWeeklyCalendar component exists
   - Database service layer (`db.ts`)
   - Week navigation working
   - Real-time save operations

5. **UI Components** (shadcn/ui):
   - Button, Input, Badge components
   - Toast notification system available

### 🔄 What Needs to Change

**Current Behavior**: Cells show numeric counts (0, 1, 2, 3)
**Target Behavior**: Cells show time-slotted entries with status buttons (A/P/G/C)

The transformation is primarily **UI/UX** - the data layer is already correct!

## Implementation Phases

---

## Phase 1: Data Layer Adjustments (Minimal Changes)

### 1.1 Update TypeScript Interfaces
**File**: `/src/polymet/data/mock-interview-events-data.ts`

**Changes**:
- Interface already correct! No changes needed.
- Status enum already has: "pending" | "attended" | "ghosted" | "cancelled"

**Status**: ✅ Already complete

### 1.2 Add Helper Functions
**File**: `/src/lib/time-utils.ts` (NEW)

```typescript
/**
 * Extracts HH:MM from ISO datetime string
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
 * Example: Date(2024-03-18), "14:30" → "2024-03-18T14:30:00Z"
 */
export function createISOFromTime(date: Date, time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const newDate = new Date(date);
  newDate.setHours(hours, minutes, 0, 0);
  return newDate.toISOString();
}

/**
 * Validates time is in HH:MM format and within 09:00-20:00
 */
export function validateInterviewTime(time: string): { valid: boolean; error?: string } {
  const timeRegex = /^([0-1][0-9]|2[0]):([0-5][0-9])$/;

  if (!timeRegex.test(time)) {
    return { valid: false, error: 'Invalid time format. Use HH:MM' };
  }

  const [hours, minutes] = time.split(':').map(Number);

  if (hours < 9 || hours > 20) {
    return { valid: false, error: 'Interview time must be between 09:00 and 20:00' };
  }

  return { valid: true };
}

/**
 * Sorts interview events by start time (earliest first)
 */
export function sortEventsByTime(events: InterviewEvent[]): InterviewEvent[] {
  return [...events].sort((a, b) =>
    new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );
}
```

**Effort**: 1 hour

---

## Phase 2: Component Refactor - Core Structure

### 2.1 New Component: InterviewStatusEntry
**File**: `/src/polymet/components/interview-status-entry.tsx` (NEW)

This represents a single time-slotted row within a day cell.

```typescript
interface InterviewStatusEntryProps {
  event: InterviewEvent;
  onTimeChange: (eventId: string, newTime: string) => Promise<void>;
  onStatusChange: (eventId: string, newStatus: InterviewEvent['status']) => Promise<void>;
  onDelete: (eventId: string) => Promise<void>;
  disabled?: boolean;
}

export function InterviewStatusEntry({
  event,
  onTimeChange,
  onStatusChange,
  onDelete,
  disabled = false
}: InterviewStatusEntryProps) {
  const [time, setTime] = useState(extractTimeFromISO(event.start_time));
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleTimeBlur = async () => {
    setIsEditing(false);
    const validation = validateInterviewTime(time);

    if (!validation.valid) {
      toast.error(validation.error);
      setTime(extractTimeFromISO(event.start_time)); // Revert
      return;
    }

    setIsSaving(true);
    try {
      await onTimeChange(event.id, time);
    } catch (error) {
      toast.error('Failed to update time');
      setTime(extractTimeFromISO(event.start_time)); // Revert
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-2 py-1 border-b last:border-0">
      {/* Time Input */}
      <Input
        type="text"
        value={time}
        onChange={(e) => setTime(e.target.value)}
        onFocus={() => setIsEditing(true)}
        onBlur={handleTimeBlur}
        disabled={disabled || isSaving}
        className="w-20 text-sm"
        placeholder="HH:MM"
      />

      {/* Status Buttons */}
      <div className="flex gap-1">
        {(['attended', 'pending', 'ghosted', 'cancelled'] as const).map((status) => (
          <Button
            key={status}
            size="sm"
            variant={event.status === status ? 'default' : 'outline'}
            onClick={() => onStatusChange(event.id, status)}
            disabled={disabled || isSaving}
            className="w-8 h-8 p-0"
          >
            {status[0].toUpperCase()}
          </Button>
        ))}
      </div>

      {/* Delete Button */}
      <Button
        size="sm"
        variant="ghost"
        onClick={() => onDelete(event.id)}
        disabled={disabled || isSaving}
        className="ml-auto text-red-500 hover:text-red-700"
      >
        −
      </Button>
    </div>
  );
}
```

**Effort**: 3 hours

### 2.2 New Component: InterviewDayCell
**File**: `/src/polymet/components/interview-day-cell.tsx` (NEW)

This represents a single cell (interviewer × day intersection).

```typescript
interface InterviewDayCellProps {
  interviewerEmail: string;
  date: Date;
  events: InterviewEvent[]; // Filtered for this interviewer + day
  onAddEntry: (interviewerEmail: string, date: Date) => Promise<void>;
  onTimeChange: (eventId: string, newTime: string) => Promise<void>;
  onStatusChange: (eventId: string, newStatus: InterviewEvent['status']) => Promise<void>;
  onDelete: (eventId: string) => Promise<void>;
  canEdit: boolean; // Based on user role
}

export function InterviewDayCell({
  interviewerEmail,
  date,
  events,
  onAddEntry,
  onTimeChange,
  onStatusChange,
  onDelete,
  canEdit
}: InterviewDayCellProps) {
  const sortedEvents = sortEventsByTime(events);
  const canAddMore = sortedEvents.length < 3;

  return (
    <div className="relative min-h-[80px] p-2 border border-gray-200 hover:bg-gray-50">
      {/* Add Button (top right) */}
      {canEdit && canAddMore && (
        <Button
          size="sm"
          variant="ghost"
          className="absolute top-1 right-1 w-6 h-6 p-0"
          onClick={() => onAddEntry(interviewerEmail, date)}
        >
          +
        </Button>
      )}

      {/* Entry Rows */}
      <div className="space-y-1">
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

      {/* Empty State */}
      {sortedEvents.length === 0 && !canEdit && (
        <div className="text-xs text-gray-400 text-center py-4">
          No interviews
        </div>
      )}
    </div>
  );
}
```

**Effort**: 2 hours

---

## Phase 3: Refactor EditableWeeklyCalendar

### 3.1 Update State Management
**File**: `/src/polymet/components/editable-weekly-calendar.tsx`

**Current State**:
```typescript
const [interviewCounts, setInterviewCounts] = useState<Record<string, Record<string, number>>>({});
```

**Remove** count-based state entirely. The component will work directly with `localEvents`.

**New State**:
```typescript
// Keep existing localEvents state
const [localEvents, setLocalEvents] = useState<InterviewEvent[]>(events);

// Add loading/saving state
const [isSaving, setIsSaving] = useState(false);
```

### 3.2 Add CRUD Handlers

```typescript
// Add new entry (defaults: 09:00, status: pending)
const handleAddEntry = async (interviewerEmail: string, date: Date) => {
  const defaultTime = '09:00';
  const startTime = createISOFromTime(date, defaultTime);
  const endTime = createISOFromTime(date, '10:00'); // 1 hour duration

  // Check for duplicate time on this day for this interviewer
  const existingTimes = getEventsForDay(interviewerEmail, date)
    .map(e => extractTimeFromISO(e.start_time));

  if (existingTimes.includes(defaultTime)) {
    toast.error('This time slot is already booked for this interviewer');
    return;
  }

  setIsSaving(true);
  try {
    const newEvent = await db.createInterviewEvent({
      interviewer_email: interviewerEmail,
      start_time: startTime,
      end_time: endTime,
      status: 'pending',
      notes: 'Added via Mark Interviews page',
    }, auditContext);

    if (newEvent) {
      setLocalEvents(prev => [...prev, newEvent]);
      toast.success('Interview slot added');
    }
  } catch (error) {
    toast.error('Failed to add interview slot');
  } finally {
    setIsSaving(false);
  }
};

// Update time
const handleTimeChange = async (eventId: string, newTime: string) => {
  const event = localEvents.find(e => e.id === eventId);
  if (!event) return;

  const date = new Date(event.start_time);
  const newStartTime = createISOFromTime(date, newTime);

  // Check for duplicate time
  const dayEvents = getEventsForDay(event.interviewer_email, date);
  const duplicateExists = dayEvents.some(e =>
    e.id !== eventId && extractTimeFromISO(e.start_time) === newTime
  );

  if (duplicateExists) {
    throw new Error('This time slot is already booked for this interviewer');
  }

  // Calculate new end time (maintain duration)
  const duration = (new Date(event.end_time).getTime() - new Date(event.start_time).getTime()) / 60000;
  const newEndTime = createISOFromTime(date, newTime);
  new Date(newEndTime).setMinutes(new Date(newEndTime).getMinutes() + duration);

  const updatedEvent = await db.updateInterviewEvent(eventId, {
    start_time: newStartTime,
    end_time: new Date(newEndTime).toISOString(),
  }, auditContext);

  if (updatedEvent) {
    setLocalEvents(prev => prev.map(e => e.id === eventId ? updatedEvent : e));
  }
};

// Update status
const handleStatusChange = async (eventId: string, newStatus: InterviewEvent['status']) => {
  const updatedEvent = await db.updateInterviewEvent(eventId, {
    status: newStatus,
    marked_by: auditContext.userEmail,
    marked_at: new Date().toISOString(),
  }, auditContext);

  if (updatedEvent) {
    setLocalEvents(prev => prev.map(e => e.id === eventId ? updatedEvent : e));
    toast.success(`Status updated to ${newStatus}`);
  }
};

// Delete entry
const handleDelete = async (eventId: string) => {
  setIsSaving(true);
  try {
    await db.deleteInterviewEvent(eventId, auditContext);
    setLocalEvents(prev => prev.filter(e => e.id !== eventId));
    toast.success('Interview slot deleted');
  } catch (error) {
    toast.error('Failed to delete interview slot');
  } finally {
    setIsSaving(false);
  }
};
```

### 3.3 Update Render Logic

**Replace** the current count-based cells with InterviewDayCell components:

```typescript
return (
  <div className="space-y-4">
    {/* Header with navigation - keep as is */}
    <div className="flex items-center justify-between">
      {/* ... existing navigation ... */}
    </div>

    {/* Status Legend */}
    <div className="flex gap-4 text-sm">
      <span><strong>A</strong> = Attended</span>
      <span><strong>P</strong> = Pending</span>
      <span><strong>G</strong> = Ghosted</span>
      <span><strong>C</strong> = Cancelled</span>
    </div>

    {/* Calendar Grid */}
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="border p-2">Interviewer</th>
            {weekDays.map((date) => (
              <th key={date.toISOString()} className="border p-2">
                {formatDate(date)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {interviewers.map((interviewer) => (
            <tr key={interviewer.email}>
              <td className="border p-2">
                {interviewer.name}
                <br />
                <span className="text-xs text-gray-500">{interviewer.email}</span>
              </td>
              {weekDays.map((date) => {
                const dateString = formatDateString(date);
                const dayEvents = filterEventsByDay(localEvents, interviewer.email, date);

                return (
                  <td key={dateString} className="border p-0">
                    <InterviewDayCell
                      interviewerEmail={interviewer.email}
                      date={date}
                      events={dayEvents}
                      onAddEntry={handleAddEntry}
                      onTimeChange={handleTimeChange}
                      onStatusChange={handleStatusChange}
                      onDelete={handleDelete}
                      canEdit={user?.role === 'talent' || user?.role === 'admin'}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);
```

**Effort**: 4 hours

---

## Phase 4: Backend Validation

### 4.1 Add Uniqueness Validation
**File**: `/server/src/features/events/repository.js`

Add method to check for duplicate times:

```javascript
/**
 * Check if an interview time slot is already taken
 */
checkTimeConflict(interviewerEmail, date, time, excludeEventId = null) {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  let query = `
    SELECT id FROM interview_events
    WHERE interviewer_email = ?
    AND start_time >= ?
    AND start_time < ?
    AND time(start_time) = ?
  `;

  const params = [
    interviewerEmail,
    dayStart.toISOString(),
    dayEnd.toISOString(),
    time
  ];

  if (excludeEventId) {
    query += ' AND id != ?';
    params.push(excludeEventId);
  }

  const result = this.db.prepare(query).get(...params);
  return !!result;
}
```

### 4.2 Update Create/Update Methods

Add validation before creating/updating:

```javascript
create(data, auditContext = {}) {
  // Extract time from ISO string
  const timeMatch = data.start_time.match(/T(\d{2}:\d{2})/);
  if (timeMatch) {
    const time = timeMatch[1];
    const date = data.start_time.split('T')[0];

    if (this.checkTimeConflict(data.interviewer_email, date, time)) {
      throw new Error('This time slot is already booked for this interviewer');
    }
  }

  // ... existing create logic ...
}

update(id, data, auditContext = {}) {
  if (data.start_time) {
    const event = this.findById(id);
    const timeMatch = data.start_time.match(/T(\d{2}:\d{2})/);

    if (timeMatch) {
      const time = timeMatch[1];
      const date = data.start_time.split('T')[0];

      if (this.checkTimeConflict(event.interviewer_email, date, time, id)) {
        throw new Error('This time slot is already booked for this interviewer');
      }
    }
  }

  // ... existing update logic ...
}
```

**Effort**: 2 hours

---

## Phase 5: Testing & Polish

### 5.1 Manual Testing Checklist
- [ ] Add entry (+ button)
- [ ] Add second entry (should sort chronologically)
- [ ] Add third entry (+ button should disappear)
- [ ] Delete entry when at capacity (+ button reappears)
- [ ] Edit time to earlier value (row moves up)
- [ ] Edit time to later value (row moves down)
- [ ] Try to create duplicate time (error displays)
- [ ] Change status (A, P, G, C buttons)
- [ ] Delete entry (- button)
- [ ] Navigate to different week (data loads correctly)
- [ ] Test with viewer role (no edit controls visible)
- [ ] Test with talent role (all edit controls visible)
- [ ] Page reload (data persists)

### 5.2 Edge Cases to Test
- [ ] Rapid clicking + button
- [ ] Changing time while another save in progress
- [ ] Network error during save
- [ ] Invalid time format (99:99, 25:00, abc)
- [ ] Time outside range (08:59, 20:01)
- [ ] Empty cell states
- [ ] Cell with exactly 3 entries

### 5.3 UI Polish
- [ ] Add loading spinners during save operations
- [ ] Add smooth animations for row reordering
- [ ] Improve hover states on buttons
- [ ] Add tooltips for status buttons (A = Attended, etc.)
- [ ] Responsive design for mobile (horizontal scroll)

**Effort**: 4 hours

---

## Phase 6: Migration & Cleanup

### 6.1 Data Migration
No migration needed! Existing `interview_events` records already have the correct structure.

### 6.2 Remove Old Code
**Files to clean up**:
- Remove count-based logic from `editable-weekly-calendar.tsx`
- Remove `interviewCounts` state
- Remove `handleCountChange` function
- Remove `saveInterviewCount` function

**Effort**: 1 hour

---

## Total Effort Estimate

| Phase | Description | Hours |
|-------|-------------|-------|
| 1 | Data Layer (time-utils.ts) | 1 |
| 2 | New Components (Entry + DayCell) | 5 |
| 3 | Refactor Calendar Component | 4 |
| 4 | Backend Validation | 2 |
| 5 | Testing & Polish | 4 |
| 6 | Migration & Cleanup | 1 |
| **Total** | | **17 hours** |

**Estimated Calendar Time**: 3-4 working days

---

## Implementation Order

### Day 1 (6 hours)
1. Create `time-utils.ts` with helper functions
2. Create `InterviewStatusEntry` component
3. Create `InterviewDayCell` component
4. Write unit tests for time-utils

### Day 2 (6 hours)
1. Refactor `EditableWeeklyCalendar` component
2. Remove count-based state
3. Add CRUD handlers
4. Update render logic
5. Test basic functionality

### Day 3 (5 hours)
1. Add backend validation for time conflicts
2. Comprehensive testing of all interactions
3. Test edge cases
4. UI polish (animations, loading states)

### Day 4 (Buffer)
- Final testing
- Bug fixes
- Documentation updates

---

## Risk Mitigation

### Risk 1: Breaking Existing Functionality
**Mitigation**:
- Keep old Mark Interviews page as backup
- Feature flag to toggle between old/new UI
- Can revert quickly if issues arise

### Risk 2: Performance with Many Entries
**Mitigation**:
- Load only current week (already implemented)
- Index on `start_time` and `interviewer_email` (already exists)
- Virtual scrolling if > 50 interviewers

### Risk 3: Concurrent Edits
**Mitigation**:
- Optimistic updates with rollback on error (already implemented)
- Toast notifications for conflicts
- Last-write-wins strategy (acceptable for this use case)

---

## Dependencies

### External Libraries (Already Installed)
- ✅ React 18+
- ✅ TypeScript 5+
- ✅ shadcn/ui components
- ✅ Lucide icons
- ✅ date-fns (or native Date)

### No New Dependencies Required!

---

## Rollout Plan

### Stage 1: Internal Testing (Week 1)
- Deploy to staging environment
- TA team testing
- Gather feedback

### Stage 2: Limited Rollout (Week 2)
- Enable for 20% of TA users
- Monitor for issues
- Collect usage metrics

### Stage 3: Full Rollout (Week 3)
- Enable for all users
- Remove old count-based UI
- Update documentation

---

## Success Metrics

### Functional Metrics
- [ ] All CRUD operations work reliably
- [ ] No data loss during edits
- [ ] < 500ms save operations
- [ ] Zero duplicate time conflicts in database

### User Experience Metrics
- [ ] TA users can add/edit/delete entries without training
- [ ] Status changes are intuitive (A/P/G/C buttons)
- [ ] Time editing is smooth (no jarring UI jumps)
- [ ] Error messages are clear and actionable

### Technical Metrics
- [ ] Zero console errors
- [ ] < 2s page load time
- [ ] 100% TypeScript type coverage
- [ ] All tests passing

---

## Post-Implementation Enhancements (Future)

These are NOT required for MVP but could be added later:

1. **Bulk Operations**: Select multiple slots and change status at once
2. **Time Picker**: Visual time picker instead of text input
3. **Interview Details Modal**: Click entry to see full details
4. **Candidate Names**: Add candidate name to each entry
5. **Color Coding**: Different colors for A/P/G/C statuses
6. **Export**: Download weekly report as CSV/PDF
7. **Analytics**: Dashboard showing interview statistics
8. **Notifications**: Email/Slack notifications for status changes
9. **Recurring Slots**: Template for common interview times
10. **Undo/Redo**: Undo accidental deletions

---

## Questions for Stakeholders

Before starting implementation, confirm:

1. **Time Range**: Is 09:00-20:00 the correct range for all regions/timezones?
2. **Max Entries**: Is 3 entries per cell the right limit?
3. **Default Time**: Should default be 09:00 or something else?
4. **Status Colors**: Do we want color-coded status buttons (green=A, yellow=P, etc.)?
5. **Delete Confirmation**: Should we add "Are you sure?" dialog before delete?
6. **Time Duration**: Should end_time always be start_time + 1 hour?

---

## Appendix: Component Hierarchy

```
EditableWeeklyCalendar
├── Header (Week Navigation)
├── Status Legend (A/P/G/C)
└── Table
    └── InterviewerRow (for each interviewer)
        └── InterviewDayCell (for each day)
            ├── Add Button (+)
            └── InterviewStatusEntry[] (0-3 entries)
                ├── Time Input
                ├── Status Buttons (A/P/G/C)
                └── Delete Button (-)
```

---

## Appendix: API Endpoints (Already Exist)

All required endpoints are already implemented:

- ✅ `GET /api/events` - List all events
- ✅ `GET /api/events?interviewer_email={email}` - Filter by interviewer
- ✅ `POST /api/events` - Create new event
- ✅ `PUT /api/events/:id` - Update event
- ✅ `DELETE /api/events/:id` - Delete event

No backend API changes needed!

---

## Conclusion

This implementation leverages 90% of existing infrastructure. The main work is **UI transformation** from count-based to time-slotted entries. The database schema, backend API, and authentication are already production-ready.

**Recommended Approach**: Start with Phase 1 and 2 (new components) to validate the design before refactoring the main calendar component.
