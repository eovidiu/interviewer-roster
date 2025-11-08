---
name: fullstack-dev
description: Use when starting development on the interviewer roster app. Runs both Vite frontend (port 5173) and Fastify backend (port 3000) concurrently with proper setup checks.
---

## Development Workflow

When working on this full-stack application:

1. **Check dependencies** - Ensure both root and server/node_modules exist
2. **Verify database** - Check if server/data/interviewer-roster.db exists
3. **Start servers** - Use `npm run dev` to run both concurrently
4. **Database setup** - If database missing, run `cd server && npm run db:reset`

## Quick Commands

- `npm run dev` - Start both servers
- `npm run dev:frontend` - Frontend only (5173)
- `npm run dev:backend` - Backend only (3000)

## Tech Stack Context

- **Frontend:** React 19 + Vite 6 + Tailwind + shadcn/ui
- **Backend:** Fastify + SQLite
- **Testing:** Vitest + React Testing Library (frontend), Jest (backend)

## First-Time Setup

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd server
npm install

# Setup database
npm run db:reset

# Return to root and start dev servers
cd ..
npm run dev
```

## Troubleshooting

- **Port already in use:** Kill processes on 5173 or 3000
- **Database errors:** Run `cd server && npm run db:reset`
- **Missing dependencies:** Run `npm install` in both root and server directories
