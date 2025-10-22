# Issue: Race Condition in Mark Interviews Checkbox State Management

## Type
Bug - Race Condition

## Priority
High

## Status
In Progress

## Description

### Goal
Enable users to click checkboxes on the "Mark Interviews" page to record that interviewers conducted interviews on specific days. The system should:
- Save changes automatically to the database
- Maintain checkbox state during user interaction (no flicker)
- Persist checkbox state across page reloads
- Allow users to select 1, 2, or 3 interviews per day
- Load fresh data when navigating between weeks

### Current Problem
Checkboxes flicker and cannot be selected or unselected consistently. Despite multiple implementation attempts, the UI state is not stable during save operations.

## Technical Details

### Architecture
- **Frontend**: React component with TypeScript (`editable-weekly-calendar.tsx`)
- **Backend**: Fastify API with SQLite database
- **State Management**: React useState/useEffect hooks
- **Save Strategy**: Optimistic UI updates with background database saves

### Root Cause
Race condition between:
1. User clicking checkbox (optimistic UI update)
2. Background save to database
3. Parent component receiving updated events prop
4. useEffect recalculating counts from potentially stale data
5. Checkbox state being reset before save completes

## Attempts Made

### Attempt 1: Backend Schema Fix
**Date**: Initial attempt
**Problem**: `table interview_events has no column named candidate_email`
**Solution**: Updated `/server/src/features/events/repository.js` to use correct schema columns
**Result**: ✅ Saves started working, but retrieval broken

### Attempt 2: Parent Page Reload
**Date**: After saves working
**Problem**: Saved interviews not showing after page reload
**Solution**: Added `await loadData()` to `handleSave` callback in `mark-interviews-page.tsx`
**Result**: ❌ Made race condition worse - checkbox immediately de-selected after click

### Attempt 3: Remove getEventsForDay Dependency
**Date**: After checkbox de-selection issue
**Problem**: useEffect depending on `getEventsForDay` causing extra renders
**Solution**:
- Removed `getEventsForDay` from useEffect dependencies
- Added `if (isSaving) return;` check in useEffect
- Removed parent page reload
**Result**: ❌ Still flickering - checkboxes cannot be selected or unselected

### Attempt 4: Re-add Dependencies with isSaving Guard
**Date**: After persistent flicker
**Problem**: Removing dependencies broke reactivity
**Solution**:
- Re-added all dependencies including `events` and `getEventsForDay`
- Kept `isSaving` check to prevent recalculation during save
- Added `previousValue` tracking for error rollback
**Result**: ❌ Still flickering - isSaving flag not effectively blocking useEffect

### Attempt 5: Separate Local State (CURRENT)
**Date**: Latest attempt
**Problem**: useEffect recalculates whenever events prop changes
**Solution**:
- Added `localEvents` state separate from parent prop
- Added `currentWeekRef` to track actual week changes
- Refactored useEffect to ONLY reload on initial mount or week change
- Load fresh events from database in useEffect
- Remove dependency on parent `events` prop changes
- Created `filterEventsByDay` helper function (not a hook)
**Result**: 🔄 IN TESTING

## Code Changes

### Key Files Modified

#### `/server/src/features/events/repository.js`
- Fixed INSERT statement to use: `calendar_event_id, scheduled_date, duration_minutes, notes, marked_by, marked_at`
- Removed non-existent columns: `candidate_email, feedback, rating, created_by`

#### `/Users/oeftimie/work/ai/interviewer-roster/src/polymet/components/editable-weekly-calendar.tsx`
**Current Implementation** (lines 45-157):
```typescript
// State management
const [interviewCounts, setInterviewCounts] = useState<Record<string, Record<string, number>>>({});
const [localEvents, setLocalEvents] = useState<InterviewEvent[]>(events);
const initializedRef = useRef(false);
const currentWeekRef = useRef(currentWeekStart.toISOString());

// Helper function to filter events (doesn't trigger re-renders)
const filterEventsByDay = (allEvents, interviewerEmail, date) => { ... }

// Main useEffect - only runs on mount or week change
useEffect(() => {
  const weekChanged = currentWeekRef.current !== currentWeekStart.toISOString();

  if (!initializedRef.current || weekChanged) {
    const loadAndCalculate = async () => {
      // Load fresh events from database
      const freshEvents = await db.getInterviewEvents();

      // Calculate counts from fresh events
      const counts = { ... };

      // Update state with fresh data
      setLocalEvents(freshEvents);
      setInterviewCounts(counts);
      setHasChanges(false);
      initializedRef.current = true;
      currentWeekRef.current = weekString;
    };

    loadAndCalculate();
  }
}, [currentWeekStart, interviewers]);
```

**Key Features**:
- ✅ Separate `localEvents` state (independent of parent prop)
- ✅ Only loads fresh data on mount or week navigation
- ✅ Uses refs to prevent unnecessary re-renders
- ✅ Direct database queries (not relying on parent state)

#### `/Users/oeftimie/work/ai/interviewer-roster/src/polymet/pages/mark-interviews-page.tsx`
- Removed data reload from `handleSave` to prevent triggering race condition
- Calendar component now fully self-contained

## Database Schema

### `interview_events` Table Structure
```sql
id TEXT PRIMARY KEY
interviewer_email TEXT NOT NULL
calendar_event_id TEXT
start_time TEXT NOT NULL
end_time TEXT NOT NULL
skills_assessed TEXT (JSON array)
candidate_name TEXT
position TEXT
scheduled_date TEXT
duration_minutes INTEGER
status TEXT CHECK(status IN ('pending','attended','ghosted','cancelled'))
notes TEXT
marked_by TEXT
marked_at TEXT
created_at TEXT DEFAULT CURRENT_TIMESTAMP
updated_at TEXT DEFAULT CURRENT_TIMESTAMP
created_by TEXT
updated_by TEXT
```

## Testing Evidence

### Database Queries Confirm Saves Work
```sql
SELECT * FROM interview_events WHERE date(start_time) = '2025-10-19';
```
Shows events ARE being created and deleted correctly.

### API Logs Show Successful Operations
```
[21:31:43] POST /api/events → 201 Created
[21:32:00] DELETE /api/events/:id → 204 No Content
```

### Problem is UI State, Not Data Persistence
- ✅ Data saves to database successfully
- ✅ Data persists across sessions
- ✅ Data can be queried correctly
- ❌ UI checkbox state flickers during save
- ❌ UI doesn't stay in sync with user actions

## Reproduction Steps

1. Navigate to "Mark Interviews" page
2. Click checkbox for any interviewer on any day
3. Observe: Checkbox checks then immediately unchecks (flicker)
4. Try clicking "1", "2", or "3" buttons
5. Observe: Count changes but flickers
6. Reload page
7. Observe: Data may or may not be persisted (race condition timing-dependent)

## Expected Behavior

1. User clicks checkbox
2. Checkbox immediately checks (optimistic update)
3. Save happens in background
4. Checkbox stays checked
5. Page reload shows checkbox still checked
6. Week navigation loads fresh data correctly

## Next Steps / Potential Solutions

### Option A: Use Refs for Save Tracking
Replace `isSaving` state with a ref so it doesn't trigger re-renders:
```typescript
const savingRef = useRef(false);
```

### Option B: Debounce useEffect
Add debouncing to prevent immediate recalculation:
```typescript
useEffect(() => {
  const timer = setTimeout(() => { /* recalculate */ }, 300);
  return () => clearTimeout(timer);
}, [events]);
```

### Option C: Event-Based State Sync
Instead of useEffect, use explicit event handlers to sync state only when needed.

### Option D: Zustand or Redux
Move to external state management to completely separate UI state from data loading.

### Option E: React Query
Use React Query to manage server state separately from UI state with built-in caching and optimistic updates.

## Dependencies

- React 18.x
- TypeScript 5.x
- Fastify (backend)
- SQLite (database)
- better-sqlite3 (Node.js driver)

## Related Files

- `/src/polymet/components/editable-weekly-calendar.tsx` (main component)
- `/src/polymet/pages/mark-interviews-page.tsx` (parent page)
- `/src/polymet/data/database-service.ts` (frontend DB service)
- `/server/src/features/events/repository.js` (backend repository)
- `/server/src/features/events/routes.js` (API endpoints)
- `/server/data/interviewer-roster.db` (SQLite database)

## Environment

- Node.js: Latest
- Frontend dev server: Vite (http://localhost:5173)
- Backend API server: Fastify (http://localhost:3000)
- Database: SQLite with WAL mode enabled

## Notes

- This issue has consumed significant debugging time across multiple sessions
- Data persistence layer is working correctly
- Issue is specifically in React state management and useEffect timing
- Consider consulting React patterns documentation for managing derived state
- May need architectural refactor to completely solve

## Labels
`bug` `race-condition` `frontend` `state-management` `high-priority` `react` `typescript`

## Created
2025-10-22

## Last Updated
2025-10-22
