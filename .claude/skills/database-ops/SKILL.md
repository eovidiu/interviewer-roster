---
name: database-ops
description: Use when working with the SQLite database, running migrations, seeding data, or resetting the interviewer roster database. Handles all database-related tasks.
---

## Database Commands

All database operations run from the `server/` directory:

```bash
cd server
npm run db:migrate   # Create schema
npm run db:seed      # Add seed data
npm run db:reset     # Migrate + seed (recommended)
```

## Database Location

- **Path:** `server/data/interviewer-roster.db`
- **Schema includes:** interviewers, events, audit_logs, users

## When to Use

- After fresh clone (database won't exist)
- When schema changes are made
- When testing with fresh data
- When data gets corrupted or inconsistent
- When adding new seed data

## Database Schema

The database includes the following main tables:

- **users:** Authentication and role-based access (viewer, talent, admin)
- **interviewers:** Roster of interviewers with skills and availability
- **events:** Interview events with status tracking
- **audit_logs:** Change history and activity tracking

## Important Notes

- Reset clears all existing data
- Seed data includes admin user and sample interviewers (Sarah Chen, Priya Patel, etc.)
- Frontend also supports localStorage mode for demos without backend
- Database file is gitignored to prevent committing local data

## Verification

After database operations, verify setup:

```bash
# Check database file exists
ls -la server/data/interviewer-roster.db

# Start backend and check logs
cd server && npm run dev
```

Then test via frontend at http://localhost:5173 or directly test API endpoints at http://localhost:3000.
