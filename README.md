# Interviewer Roster

Full-stack dashboard for managing interviewer availability, events, and audit history. The app features a React frontend with a Fastify backend API, supporting both local-first development and backend-integrated workflows.

## Overview
- React 19 + Vite 6 single-page app styled with Tailwind and shadcn/ui components.
- Fastify backend API with SQLite database for persistent storage.
- Local persistence option using `localStorage` for rapid prototyping.
- Role-based navigation enforcing viewer, talent, and admin permissions.
- Google OAuth integration for authentication (mock OAuth for development).
- CSV import/export functionality.

## Prerequisites
- Node.js 20+ (tested with 20.x and 22.x)
- npm 10+

## Installation & Development

### Quick Start (Frontend + Backend)
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..

# Start both frontend and backend servers
npm run dev          # Runs both servers concurrently
                     # Frontend: http://localhost:5173
                     # Backend:  http://localhost:3000
```

### Running Servers Individually
```bash
npm run dev:frontend # Start only Vite dev server (port 5173)
npm run dev:backend  # Start only Fastify backend (port 3000)
```

### Backend Setup
The backend requires initial database setup:

```bash
cd server
npm run db:migrate   # Create database schema
npm run db:seed      # Populate with seed data
# OR
npm run db:reset     # Run both migration and seeding
```

Log in with the **Sign in with Google** button; the OAuth flow provisions an admin session so every protected route is accessible.

### Available Scripts

**Root Project:**
- `npm run dev` – start both frontend and backend servers concurrently.
- `npm run dev:frontend` – start only the Vite dev server with HMR.
- `npm run dev:backend` – start only the Fastify backend API.
- `npm run build` – create an optimized production bundle under `dist/`.
- `npm run preview` – serve the production build locally.
- `npm run lint` – run ESLint on all TypeScript and TSX files.
- `npm test` – execute Vitest + React Testing Library tests.

**Backend (`server/`):**
- `npm run dev` – start backend with Node.js watch mode.
- `npm run start` – start backend in production mode.
- `npm run db:migrate` – create database schema.
- `npm run db:seed` – populate database with seed data.
- `npm run db:reset` – reset database (migrate + seed).
- `npm test` – run backend Jest tests.
- `npm run lint` – run ESLint on backend code.

## Data Persistence

The application supports two persistence modes:

### Backend API Mode (Default)
- Data is stored in SQLite database at `server/data/interviewer-roster.db`
- Run `npm run db:reset` in the `server/` directory to reset the database
- Authentication uses JWT tokens stored in memory (secure, but lost on refresh)
- Use **Database → Import Mock Data** in the UI to reload demo data

### LocalStorage Mode (Development/Demo)
- Data is stored in browser `localStorage` under `interview_roster_db` key
- First-run sessions automatically seed mock data
- Authentication state stored under `auth_user` key
- Clear localStorage keys in DevTools to reset data
- Ideal for demos and rapid iteration without backend

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
