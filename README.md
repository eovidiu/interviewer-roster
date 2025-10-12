# Interviewer Roster

Local-first interview scheduling dashboard built with React, TypeScript, and Vite.

## Development Quickstart

```bash
npm ci
npm run dev
```

The dev server runs at http://localhost:5173. Log in with the mock Google button to explore the dashboard.

## Local Data

- The database service waits for its bootstrap to finish before resolving queries, so first-run sessions immediately show the mock interviewers and events.
- Use **Database → Import Mock Data** in the UI to reload the demo dataset; the confirmation dialog ensures you do not accidentally overwrite custom data.
- Clearing the store via **Database → Clear Database** leaves the UI empty until you import mock data or load a backup.
- Data persists per browser profile; clear the `localStorage` key `interview_roster_db` to simulate a brand new browser profile.

## Useful Scripts

```bash
npm run lint
npm run build
```

Linting currently surfaces a handful of warnings from generated shadcn/ui components; errors must still be resolved before merging.
