# Interviewer Roster

Local-first interview scheduling dashboard built with React, TypeScript, and Vite.

## Development Quickstart

```bash
npm ci
npm run dev
```

The dev server runs at http://localhost:5173. Log in with the mock Google button to explore the dashboard.

## Local Data

- On first load the app automatically seeds mock interviewers and events into `localStorage`.
- Use **Database → Import Mock Data** in the UI to re-seed after clearing the database or during demos.
- Data persists per browser profile; clear the `localStorage` key `interview_roster_db` to reset manually.

## Useful Scripts

```bash
npm run lint
npm run build
```

Linting currently surfaces a handful of warnings from generated shadcn/ui components; errors must still be resolved before merging.
