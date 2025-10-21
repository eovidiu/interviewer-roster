# Quick Start - Full Stack Application

**Status**: ✅ READY TO USE

---

## Start the Application (2 Terminals)

### Terminal 1: Backend
```bash
cd server
npm run dev
```
✅ Backend running at **http://localhost:3000**

### Terminal 2: Frontend
```bash
npm run dev
```
✅ Frontend running at **http://localhost:5173**

---

## Access the App

**Open in browser**: http://localhost:5173

1. Click **"Sign in with Google"**
2. You're logged in as **Admin User**
3. Dashboard shows real data from backend database
4. All CRUD operations work via API

---

## What's Working

✅ **Authentication** - Backend JWT tokens
✅ **Interviewers** - Full CRUD via API
✅ **Events** - Full CRUD via API
✅ **Audit Logs** - Read from API
✅ **Dashboard** - Data from database
✅ **Security** - JWT in memory (not localStorage)

---

## API Documentation

**Swagger UI**: http://localhost:3000/docs

Interactive API docs with "Try it out" buttons for all 17 endpoints.

---

## Architecture

```
Frontend (React)  →  Backend (Fastify)  →  SQLite Database
Port 5173            Port 3000               data/interviewer-roster.db
```

**Data Flow**:
1. Login → Get JWT token
2. All requests include JWT
3. Backend verifies & processes
4. Data saved/retrieved from SQLite
5. Audit logs created automatically

---

## Files to Know

**Frontend**:
- `src/lib/api-client.ts` - HTTP client with JWT
- `src/polymet/data/api-database-service.ts` - API integration
- `src/polymet/data/auth-context.tsx` - Login/logout

**Backend**:
- `server/src/app.js` - Main application
- `server/src/features/auth/` - Login endpoints
- `server/src/features/interviewers/` - Interviewers API
- `server/src/features/events/` - Events API
- `server/src/features/audit-logs/` - Audit logs API

---

## Common Tasks

### Reset Backend Database
```bash
cd server
npm run db:reset
```

### View API Logs
Backend terminal shows all requests in real-time.

### Test API Endpoint
```bash
# Get JWT token
curl -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","name":"Admin User"}'

# Use token to get interviewers
curl -H 'Authorization: Bearer <token>' http://localhost:3000/api/interviewers
```

---

## GitHub Issues

**Closed** (Core integration complete):
- ✅ #37 - API Client
- ✅ #38 - Database Service
- ✅ #39 - Auth Flow
- ✅ #24 - Security Fix

**Open** (Optional enhancements):
- #40 - Component UI improvements
- #41 - Test updates
- #42 - E2E testing

---

## Documentation

- **INTEGRATION_COMPLETE_SUMMARY.md** - Full implementation details
- **INTEGRATION_PROGRESS.md** - Progress report
- **server/IMPLEMENTATION_COMPLETE.md** - Backend details
- **server/ARCHITECTURE.md** - Architecture deep dive
- **FULL_STACK_SETUP.md** - Detailed setup guide

---

## Success!

🎉 The application is fully integrated and ready to use!

**Frontend**: http://localhost:5173
**Backend API**: http://localhost:3000
**API Docs**: http://localhost:3000/docs
