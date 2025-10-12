# Interviewer Roster

Local-first dashboard for managing interviewer availability, events, and audit history. The app runs entirely in the browser using `localStorage`, making it ideal for demos and rapid iteration without a backend.

## Overview
- React 19 + Vite 6 single-page app styled with Tailwind and shadcn/ui components.
- Local persistence seeded with realistic mock interviewers and events.
- Role-based navigation enforcing viewer, talent, and admin permissions.
- CSV import/export stubs to exercise future integrations.

## Prerequisites
- Node.js 20+ (tested with 20.x and 22.x)
- npm 10+

## Installation & Development
```bash
npm install          # install dependencies
npm run dev          # start Vite dev server on http://localhost:5173
```

Log in with the **Sign in with Google** button; the mock OAuth flow provisions an admin session (`auth_user` saved in `localStorage`) so every protected route is accessible.

### Available Scripts
- `npm run dev` – start the development server with HMR.
- `npm run build` – create an optimized production bundle under `dist/`.
- `npm run preview` – serve the production build locally.
- `npm run lint` – run ESLint on all TypeScript and TSX files.
- `npm test` – execute Vitest + React Testing Library smoke tests that mount the router and verify seeded data renders on the dashboard, interviewers, and events pages.

All commands should finish without errors before opening a pull request.

## Data Seeding & Persistence
- The app seeds `interview_roster_db` in `localStorage` the first time it loads (or whenever the database key is missing). Mock data lives in `src/polymet/data/mock-*.ts`.
- Authentication state is stored under the `auth_user` key. Clicking the Google mock button overwrites that entry with an admin user.
- To reset data manually, either clear those two keys in DevTools or use **Database → Import Mock Data** within the application. The UI also exposes explicit reset/clear actions on the database management screen.

## Roles & Route Access
- **viewer** – read-only access to dashboard, interviewers, events, and schedule.
- **talent** – inherits viewer privileges plus the **Mark Interviews** workflow.
- **admin** – full control, including **Settings**, **Database**, and **Audit Logs** pages.

The seeded admin session exercises the strictest path. To simulate other roles, adjust the stored `auth_user` JSON in DevTools.

## Manual Smoke Tests (until feature coverage grows)
1. `npm run dev` and log in via the Google mock button.
2. Confirm the dashboard renders KPI cards and a recent events list populated with mock data.
3. Navigate to **Interviewers**; verify the roster table lists people such as Sarah Chen and Priya Patel with skill badges.
4. Navigate to **Interview Events**; confirm upcoming events display statuses, skill chips, and emails.
5. Visit **Database → Import Mock Data** and trigger a reset; ensure counts update and tables refresh.
6. For admin-only screens (**Settings**, **Database**, **Audit Logs**), verify navigation enforces permissions by clearing `auth_user` or editing the stored role.

Document any additional manual checks in pull requests whenever automated tests cannot cover the change.

## Testing
The repository now includes Vitest + React Testing Library smoke tests. They mount the full router with seeded local data and assert core screens render without crashing.

```
npm test            # run once in CI mode
```

Add new tests alongside UI or hooks when behavior grows more complex.

## Project Layout Highlights
- `src/polymet/pages` – route-level views.
- `src/polymet/data` – local database service, mock data, and auth context.
- `src/components` – shared UI primitives.
- `src/test` – Vitest setup (`setup.ts`) and smoke suites.

Refer to `AGENTS.md` for broader contribution guidelines and workflow expectations.
