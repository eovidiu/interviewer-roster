# Functional Specification: Read-Only Schedule Calendar View

## Overview
Upgrade the Schedule page's calendar view to match the Mark Interviews page pattern while maintaining read-only access. Users can view detailed interview schedules but cannot add, edit, or delete entries.

## Current State vs. Desired State

### Current Implementation (WeeklyCalendarView)
- Shows status badges only (A/P/G/C) in calendar cells
- Tooltips show time and status on hover
- No time display in cells
- Basic badge-based visualization
- Limited detail at a glance

### Desired Implementation (ReadOnlyWeeklyCalendar)
- Shows interview times (HH:MM format) with status buttons
- Displays 0-3 interview slots per day (just like Mark Interviews)
- Color-coded status buttons (A/P/G/C) but **disabled/non-interactive**
- Search functionality for interviewers
- Weekly totals per interviewer
- No add/edit/delete capabilities
- **Exact same visual layout as Mark Interviews, but read-only**

## Visual Comparison

### Before (Current WeeklyCalendarView)
```
┌─────────────┬─────┬─────┬─────┬─────┬─────┐
│ Interviewer │ Mon │ Tue │ Wed │ Thu │ Fri │
├─────────────┼─────┼─────┼─────┼─────┼─────┤
│ gigi pigi   │ A G │  P  │ A P │  -  │  C  │
└─────────────┴─────┴─────┴─────┴─────┴─────┘
(Just badges, tooltips show time)
```

### After (New ReadOnlyWeeklyCalendar)
```
┌─────────────┬──────────────┬──────────────┬──────────────┬──────────────┬──────────────┬───────┐
│ Interviewer │     Mon      │     Tue      │     Wed      │     Thu      │     Fri      │ Total │
├─────────────┼──────────────┼──────────────┼──────────────┼──────────────┼──────────────┼───────┤
│ gigi pigi   │ 09:00 [A][P] │ 10:00 [P]    │ 09:00 [A][P] │      -       │ 11:00 [C]    │   6   │
│ pigp@fdsd   │ [G][C]       │              │ [G][C]       │              │              │       │
│             │              │              │              │              │              │       │
│             │ (no +button) │ (no buttons) │ (no editing) │ (view only)  │ (read-only)  │       │
└─────────────┴──────────────┴──────────────┴──────────────┴──────────────┴──────────────┴───────┘
```

## User Stories

### US-1: View Interview Schedule
**As a** user (any role)
**I want to** see the weekly interview schedule with times and statuses
**So that** I can understand when interviews are happening and their current status

**Acceptance Criteria:**
- ✅ Calendar displays Mon-Fri for current week
- ✅ Each cell shows 0-3 interview slots
- ✅ Each slot shows: time (HH:MM) + status buttons (A/P/G/C)
- ✅ Status buttons are color-coded but disabled
- ✅ Weekly total column shows interview count per interviewer
- ✅ Only active interviewers are shown

### US-2: Navigate Between Weeks
**As a** user
**I want to** navigate to previous/next weeks or jump to current week
**So that** I can view interview schedules across different time periods

**Acceptance Criteria:**
- ✅ Previous/Next week buttons (← →)
- ✅ "Today" button to jump to current week
- ✅ Week range displayed (e.g., "Oct 20 - Oct 24")
- ✅ Today's date highlighted in column header

### US-3: Search Interviewers
**As a** user
**I want to** search for specific interviewers by name or email
**So that** I can quickly find and view their schedule

**Acceptance Criteria:**
- ✅ Search input with icon
- ✅ Minimum 3 characters to trigger filter
- ✅ Searches: first name, last name, full name, email
- ✅ Real-time filtering
- ✅ Result count displayed
- ✅ Case-insensitive matching

### US-4: Read-Only Enforcement
**As a** system
**I want to** prevent any modifications to interview data
**So that** the Schedule page remains view-only

**Acceptance Criteria:**
- ❌ No + button to add interviews
- ❌ No delete button (−)
- ❌ Time input is read-only text (not editable input)
- ❌ Status buttons are disabled (no onClick handlers)
- ❌ No hover effects on status buttons (cursor: default)
- ✅ Visual distinction from Mark Interviews (e.g., different header text)

## Component Architecture

### New Component: `ReadOnlyWeeklyCalendar.tsx`
```typescript
interface ReadOnlyWeeklyCalendarProps {
  interviewers: Interviewer[];
  events: InterviewEvent[];
}

// Reuses existing child components from Mark Interviews:
// - ReadOnlyInterviewDayCell (new, simplified version of InterviewDayCell)
// - ReadOnlyInterviewStatusEntry (new, simplified version of InterviewStatusEntry)
```

### Component Hierarchy
```
ReadOnlyWeeklyCalendar
├── Header (Week Navigation - same as Mark Interviews)
├── Status Legend (A/P/G/C - same as Mark Interviews)
├── Search Filter (name/email search - same as Mark Interviews)
└── Table
    └── InterviewerRow (for each interviewer)
        └── ReadOnlyInterviewDayCell (for each day)
            └── ReadOnlyInterviewStatusEntry[] (0-3 entries)
                ├── Time Display (text, not input)
                └── Status Buttons (disabled, color-coded)
```

## Technical Specifications

### 1. ReadOnlyWeeklyCalendar Component

**Props:**
```typescript
interface ReadOnlyWeeklyCalendarProps {
  interviewers: Interviewer[];
  events: InterviewEvent[];
}
```

**State:**
```typescript
const [currentWeekStart, setCurrentWeekStart] = useState<Date>(); // Monday
const [searchQuery, setSearchQuery] = useState<string>("");
```

**Features:**
- Week navigation (previous/next/today)
- Search filter (min 3 chars)
- Weekly total calculation (current week only)
- Sorted interview slots by time
- Active interviewers only

### 2. ReadOnlyInterviewDayCell Component

**Props:**
```typescript
interface ReadOnlyInterviewDayCellProps {
  interviewerEmail: string;
  date: Date;
  events: InterviewEvent[]; // Already filtered for this day
}
```

**Rendering:**
- Shows 0-3 interview slots (sorted by time)
- Empty state: "No interviews" text
- No + button
- No interactive elements

### 3. ReadOnlyInterviewStatusEntry Component

**Props:**
```typescript
interface ReadOnlyInterviewStatusEntryProps {
  event: InterviewEvent;
}
```

**Rendering:**
- Time displayed as **text** (not input): `<span className="text-sm font-mono">09:00</span>`
- 4 status buttons (A/P/G/C):
  - Color-coded (green/yellow/red/gray)
  - Current status highlighted
  - All buttons **disabled** (no onClick)
  - No hover effects
- No delete button

### 4. Data Flow

```
SchedulePage (parent)
  ↓ (fetches data)
db.getInterviewers() + db.getInterviewEvents()
  ↓ (passes as props)
ReadOnlyWeeklyCalendar
  ↓ (filters by week + search)
filteredInterviewers + weeklyEvents
  ↓ (maps to rows)
ReadOnlyInterviewDayCell
  ↓ (filters by day)
dayEvents (0-3 per cell)
  ↓ (maps to entries)
ReadOnlyInterviewStatusEntry
  ↓ (displays)
Time (text) + Status buttons (disabled)
```

## UI/UX Specifications

### Color Scheme (Same as Mark Interviews)
- **Attended (A)**: `bg-green-500 text-white` (active) / `border-green-500 text-green-700` (inactive)
- **Pending (P)**: `bg-yellow-500 text-white` (active) / `border-yellow-500 text-yellow-700` (inactive)
- **Ghosted (G)**: `bg-red-500 text-white` (active) / `border-red-500 text-red-700` (inactive)
- **Cancelled (C)**: `bg-gray-500 text-white` (active) / `border-gray-500 text-gray-700` (inactive)

### Disabled Button Styling
```css
.status-button-disabled {
  opacity: 0.8;
  cursor: default;
  pointer-events: none;
}
```

### Layout Specifications
- **Table**: Same as Mark Interviews
- **Cell height**: Min 100px (to fit 3 entries)
- **Time display**: 20px width, monospace font
- **Status buttons**: 32px × 32px each
- **Gap between entries**: 4px (space-y-1)

### Empty State
```
┌──────────────┐
│              │
│ No interviews│
│              │
└──────────────┘
```

### Header Text
```
"View Schedule" (instead of "Mark Interviews")
"Oct 20 - Oct 24"
```

## Differences from Mark Interviews

| Feature | Mark Interviews | Read-Only Schedule |
|---------|----------------|-------------------|
| **Add button** | ✅ Yes (+ icon) | ❌ No |
| **Time input** | ✅ Editable input | ❌ Read-only text |
| **Status buttons** | ✅ Clickable | ❌ Disabled |
| **Delete button** | ✅ Yes (− icon) | ❌ No |
| **Search** | ✅ Yes | ✅ Yes |
| **Week navigation** | ✅ Yes | ✅ Yes |
| **Weekly totals** | ✅ Yes | ✅ Yes |
| **Role-based access** | ✅ talent/admin only | ✅ All roles (read-only) |

## Code Reuse Strategy

### Reusable from Mark Interviews:
1. ✅ Week calculation logic (Monday-Friday)
2. ✅ Date formatting utilities
3. ✅ Search filtering logic
4. ✅ Weekly total calculation
5. ✅ Status color mapping (`getStatusDisplay()`)
6. ✅ Time extraction (`extractTimeFromISO()`)
7. ✅ Event sorting (`sortEventsByTime()`)

### New Components (Simplified Read-Only Versions):
1. `ReadOnlyWeeklyCalendar.tsx` (based on EditableWeeklyCalendar)
2. `ReadOnlyInterviewDayCell.tsx` (based on InterviewDayCell)
3. `ReadOnlyInterviewStatusEntry.tsx` (based on InterviewStatusEntry)

## Implementation Plan

### Phase 1: Create ReadOnlyInterviewStatusEntry Component
**Estimated Time:** 30 minutes

- [ ] Create component file
- [ ] Display time as text (not input)
- [ ] Render 4 disabled status buttons (A/P/G/C)
- [ ] Apply color coding based on current status
- [ ] No delete button
- [ ] Add proper styling (same layout as editable version)

### Phase 2: Create ReadOnlyInterviewDayCell Component
**Estimated Time:** 20 minutes

- [ ] Create component file
- [ ] Accept date + events props
- [ ] Sort events by time
- [ ] Map to ReadOnlyInterviewStatusEntry components
- [ ] Show empty state when no events
- [ ] No + button
- [ ] Cell styling consistent with Mark Interviews

### Phase 3: Create ReadOnlyWeeklyCalendar Component
**Estimated Time:** 45 minutes

- [ ] Create component file
- [ ] Copy week navigation logic from EditableWeeklyCalendar
- [ ] Copy search filter logic
- [ ] Copy weekly total calculation
- [ ] Integrate ReadOnlyInterviewDayCell
- [ ] Add header with "View Schedule" title
- [ ] Add status legend
- [ ] Add result count display

### Phase 4: Integrate into SchedulePage
**Estimated Time:** 15 minutes

- [ ] Update SchedulePage imports
- [ ] Replace WeeklyCalendarView with ReadOnlyWeeklyCalendar
- [ ] Pass interviewers and events props
- [ ] Test integration

### Phase 5: Testing & Polish
**Estimated Time:** 30 minutes

- [ ] Test week navigation
- [ ] Test search functionality
- [ ] Verify status colors display correctly
- [ ] Verify totals calculate correctly
- [ ] Test with different data sets
- [ ] Verify no interactive elements work
- [ ] Visual QA (compare to Mark Interviews)

**Total Estimated Time:** 2.5 hours

## Success Criteria

### Functional Requirements
- ✅ Displays time-slotted interviews (0-3 per day)
- ✅ Shows times in HH:MM format
- ✅ Displays color-coded status buttons (A/P/G/C)
- ✅ All editing capabilities disabled
- ✅ Week navigation works
- ✅ Search filter works (min 3 chars)
- ✅ Weekly totals accurate
- ✅ Responsive design

### Visual Requirements
- ✅ Matches Mark Interviews layout exactly
- ✅ Clear visual distinction (header text, no buttons)
- ✅ Status colors consistent
- ✅ Proper spacing and alignment
- ✅ Today's date highlighted

### Performance Requirements
- ✅ No API calls for modifications
- ✅ Fast filtering and navigation
- ✅ Efficient rendering (no unnecessary re-renders)

## Future Enhancements (Out of Scope)

- Click on interview to see details modal
- Export schedule to PDF/CSV
- Print view
- Multi-week view
- Interviewer availability indicators

---

**Document Version:** 1.0
**Created:** 2025-10-24
**Author:** Implementation Team
**Status:** Ready for Implementation
