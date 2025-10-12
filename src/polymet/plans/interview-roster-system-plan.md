# Interview Roster Management System

## User Request
Build a local-first interview scheduling and roster management system with:
- Role-based access control (Super Admin, TA, Viewer)
- Google Calendar integration
- SQLite database with audit logging
- Dashboard with KPI tracking
- Interviewer management with skills tracking
- Interview event tracking with attendance marking
- CSV export functionality

## Related Files
- @/polymet/data/mock-interviewers-data (to create) - Mock interviewer data
- @/polymet/data/mock-interview-events-data (to create) - Mock interview events
- @/polymet/data/mock-audit-logs-data (to create) - Mock audit logs
- @/polymet/components/interviewer-card (to create) - Individual interviewer card component
- @/polymet/components/event-card (to create) - Interview event card component
- @/polymet/components/kpi-metric-card (to create) - KPI display component
- @/polymet/components/role-badge (to create) - Role display badge
- @/polymet/components/status-badge (to create) - Event status badge
- @/polymet/components/interviewer-table (to create) - Interviewers table with actions
- @/polymet/components/events-table (to create) - Events table with filtering
- @/polymet/components/audit-log-table (to create) - Audit logs display
- @/polymet/components/add-interviewer-dialog (to create) - Add/edit interviewer dialog
- @/polymet/components/mark-attendance-dialog (to create) - Mark attendance dialog
- @/polymet/components/export-dialog (to create) - Export data dialog
- @/polymet/layouts/dashboard-layout (to create) - Main dashboard layout with navigation
- @/polymet/pages/dashboard-page (to create) - Main dashboard with KPIs
- @/polymet/pages/interviewers-page (to create) - Interviewer management page
- @/polymet/pages/events-page (to create) - Interview events page
- @/polymet/pages/audit-logs-page (to create) - Audit logs page (admin only)
- @/polymet/pages/settings-page (created) - Settings and role management
- @/polymet/pages/schedule-page (created) - Schedule view per interviewer with calendar and card views
- @/polymet/components/interviewer-schedule-card (created) - Individual interviewer schedule card
- @/polymet/components/weekly-calendar-view (created) - Weekly calendar grid view with status codes
- @/polymet/prototypes/interview-roster-app (created) - Main application prototype

## TODO List
- [x] Create mock data files (interviewers, events, audit logs)
- [x] Create utility components (badges, cards)
- [x] Create KPI metric card component
- [x] Create interviewer card and table components
- [x] Create event card and table components
- [x] Create audit log table component
- [x] Create dialog components (add interviewer, mark attendance, export)
- [x] Create dashboard layout with role-based navigation
- [x] Create dashboard page with KPI overview
- [x] Create interviewers management page
- [x] Create events management page
- [x] Create audit logs page
- [x] Create settings page
- [x] Create schedule page (per interviewer view)
- [x] Create weekly calendar view component with status codes (A/P/G/C)
- [x] Add view toggle between calendar and cards
- [x] Add schedule navigation link to dashboard layout
- [x] Create prototype with routing

## Important Notes
- System uses role-based access: Super Admin (all access), TA (edit interviewers/events), Viewer (read-only)
- Target KPIs: <2% no-show rate, 3-5 interviews/week per interviewer, -30% TA scheduling time, >99.5% uptime
- Local-first architecture with SQLite database
- Google OAuth 2.0 for authentication
- Calendar sync with consent tracking
- Audit logging for all changes
- CSV export functionality (RFC 4180)
- Security: AES-256 for tokens, JWT (8h), httpOnly cookies

  
## Plan Information
*This plan is created when the project is at iteration 0, and date 2025-10-09T08:02:31.455Z*
