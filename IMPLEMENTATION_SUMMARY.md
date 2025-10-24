# Implementation Summary: Interview Status Tracking

## TL;DR

**Goal**: Transform the "Mark Interviews" page from showing counts (1, 2, 3) to showing time-slotted interview entries with status tracking (A/P/G/C buttons).

**Great News**: 90% of infrastructure already exists! This is primarily a UI/UX refactor.

## What Changes

### BEFORE (Current)
```
┌─────────────┬─────┬─────┬─────┬─────┬─────┐
│ Interviewer │ Mon │ Tue │ Wed │ Thu │ Fri │
├─────────────┼─────┼─────┼─────┼─────┼─────┤
│ Sarah Chen  │  2  │  1  │  0  │  3  │  1  │
└─────────────┴─────┴─────┴─────┴─────┴─────┘
```

### AFTER (Target)
```
┌─────────────┬─────────────────┬─────────────────┬─────┬─────┬─────┐
│ Interviewer │      Mon        │      Tue        │ Wed │ Thu │ Fri │
├─────────────┼─────────────────┼─────────────────┼─────┼─────┼─────┤
│ Sarah Chen  │ 09:00 [A][P][G][C] │ 14:00 [A][P][G][C] │  +  │     │     │
│             │ 14:30 [A][P][G][C] │                 │     │     │     │
└─────────────┴─────────────────┴─────────────────┴─────┴─────┴─────┘
                  ^       ^
                  │       └── Status buttons (one highlighted)
                  └── Editable time
```

## Key Features

✅ **Add Entry**: Click `+` button to add time slot (defaults to 09:00, status: Pending)
✅ **Edit Time**: Click time field, type new value (HH:MM format, 09:00-20:00)
✅ **Change Status**: Click A/P/G/C buttons (Attended/Pending/Ghosted/Cancelled)
✅ **Delete Entry**: Click `−` button to remove
✅ **Auto-Sort**: Entries automatically order by time (earliest first)
✅ **Max 3 per cell**: `+` button disappears when limit reached
✅ **Validation**: Prevents duplicate times, invalid formats, out-of-range values
✅ **Role-Based**: Only TA role can edit (viewers see read-only)

## What We Already Have ✅

- ✅ Database schema correct (`interview_events` table)
- ✅ Backend API endpoints (CRUD operations)
- ✅ Authentication & role management
- ✅ Week navigation working
- ✅ Real-time save operations
- ✅ UI components (shadcn/ui)
- ✅ Toast notifications

## What Needs Building 🔨

1. **New Components** (5 hours)
   - `InterviewStatusEntry` - Single time-slotted row
   - `InterviewDayCell` - Container for 0-3 entries per day
   - `time-utils.ts` - Helper functions for time validation

2. **Refactor Calendar** (4 hours)
   - Remove count-based UI
   - Use new components
   - Add CRUD handlers for entries

3. **Backend Validation** (2 hours)
   - Add uniqueness check (no duplicate times for same interviewer/day)

4. **Testing & Polish** (4 hours)
   - Manual testing all interactions
   - Edge case testing
   - UI animations and feedback

**Total: 15-17 hours (~3-4 days)**

## Implementation Phases

### Phase 1: Helper Functions (1 hour)
Create `/src/lib/time-utils.ts` with:
- `extractTimeFromISO()` - "2024-03-18T14:30:00Z" → "14:30"
- `createISOFromTime()` - Date + "14:30" → ISO string
- `validateInterviewTime()` - Check format and range
- `sortEventsByTime()` - Sort entries chronologically

### Phase 2: New Components (5 hours)
Create:
- `/src/polymet/components/interview-status-entry.tsx`
  - Time input field
  - 4 status buttons (A/P/G/C)
  - Delete button (−)
  - Handles edit/save/validation

- `/src/polymet/components/interview-day-cell.tsx`
  - Container for 0-3 entries
  - Add button (+) in top-right
  - Empty state
  - Auto-sorts entries by time

### Phase 3: Refactor Calendar (4 hours)
Update `/src/polymet/components/editable-weekly-calendar.tsx`:
- **Remove**: `interviewCounts` state
- **Remove**: `handleCountChange`, `saveInterviewCount` functions
- **Add**: CRUD handlers (add/edit/delete entries)
- **Replace**: Render logic to use `InterviewDayCell`

### Phase 4: Backend Validation (2 hours)
Update `/server/src/features/events/repository.js`:
- Add `checkTimeConflict()` method
- Validate before create/update
- Return clear error messages

### Phase 5: Testing (4 hours)
- Manual testing of all interactions
- Edge cases (rapid clicks, conflicts, errors)
- UI polish (loading states, animations)

### Phase 6: Cleanup (1 hour)
- Remove old count-based code
- Update documentation
- Git commit

## Risk Mitigation

**Rollback Plan**: Keep old code as backup, use feature flag to toggle

**Performance**: Already optimized (week-based loading, database indexes)

**Concurrent Edits**: Optimistic updates with rollback (already implemented)

## Timeline

| Day | Work | Hours |
|-----|------|-------|
| Day 1 | Phases 1-2: Utils + Components | 6 |
| Day 2 | Phase 3: Refactor Calendar | 6 |
| Day 3 | Phases 4-5: Validation + Testing | 6 |
| Day 4 | Buffer: Fixes + Polish | - |

## API Endpoints (No Changes Needed!)

All required endpoints already exist:
- `GET /api/events` ✅
- `POST /api/events` ✅
- `PUT /api/events/:id` ✅
- `DELETE /api/events/:id` ✅

## Dependencies (All Already Installed!)

- React 18+ ✅
- TypeScript 5+ ✅
- shadcn/ui ✅
- Lucide icons ✅

**No npm installs required!**

## Questions Before Starting

1. Time range: 09:00-20:00 correct for all timezones?
2. Max 3 entries per cell acceptable?
3. Default time: 09:00 or different?
4. Status colors: Want color-coded buttons?
5. Delete confirmation: "Are you sure?" dialog needed?
6. Duration: Always 1 hour (end_time = start_time + 60min)?

## Next Steps

1. **Review plan** with team/stakeholders
2. **Answer questions** above
3. **Start Phase 1** (time-utils.ts)
4. **Iterate** through phases 2-6

## Success Criteria

- ✅ TAs can add/edit/delete time slots without training
- ✅ No duplicate times possible
- ✅ Status changes are instant
- ✅ Data persists across page reloads
- ✅ < 500ms save operations
- ✅ Zero console errors

---

**Ready to start?** See full details in `IMPLEMENTATION_PLAN_interview_status_tracking.md`
