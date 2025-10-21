# Full Stack Setup Guide - Interviewer Roster

Complete guide to run both frontend (React) and backend (Fastify) together.

## Quick Start (TL;DR)

```bash
# Terminal 1: Start Backend
cd server
npm install
npm run db:reset
npm run dev

# Terminal 2: Start Frontend
cd ..  # back to root
npm install
npm run dev

# Open browser
open http://localhost:5173
```

---

## Detailed Setup Instructions

### Prerequisites

- ✅ Node.js 20+ installed
- ✅ npm 10+ installed
- ✅ Two terminal windows/tabs

---

## Step 1: Start the Backend Server

### 1.1 Install Backend Dependencies

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install
```

**Expected output:**
```
added 234 packages in 15s
```

### 1.2 Initialize Database

```bash
# Create database and seed with mock data
npm run db:reset
```

**Expected output:**
```
📊 Running migrations on: ./data/interviewer-roster.db
✅ Migrations completed successfully
🌱 Seeding database
✅ Seeded 2 users
✅ Seeded 6 interviewers
✅ Seeded 3 interview events
🎉 Database seeding completed successfully
```

### 1.3 Start Backend Server

```bash
npm run dev
```

**Expected output:**
```
[17:30:42] INFO: Server listening on http://0.0.0.0:3000
[17:30:42] INFO: API documentation available at http://localhost:3000/docs
[17:30:42] INFO: Database connected
[17:30:42] INFO: Interviewers feature registered
```

**✅ Backend is now running on http://localhost:3000**

**Test it:**
```bash
# In a new terminal
curl http://localhost:3000/api/health
```

Should return:
```json
{"status":"ok","timestamp":"2025-01-19T...","uptime":5.2}
```

---

## Step 2: Start the Frontend App

**Open a NEW terminal** (keep backend running in the first one!)

### 2.1 Navigate to Frontend

```bash
# From project root
cd /Users/oeftimie/work/ai/interviewer-roster

# Or if you're in server/ directory:
cd ..
```

### 2.2 Install Frontend Dependencies

```bash
npm install
```

**Expected output:**
```
added 567 packages in 25s
```

### 2.3 Start Frontend Dev Server

```bash
npm run dev
```

**Expected output:**
```
  VITE v6.0.0  ready in 1234 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

**✅ Frontend is now running on http://localhost:5173**

---

## Step 3: Access the Application

### Open Your Browser

Navigate to: **http://localhost:5173**

You should see the **Interviewer Roster** login page.

### Login

Click **"Sign in with Google"** button

This is a **mock OAuth flow** for development. It will:
- Create a session with admin role
- Store auth in localStorage
- Redirect you to the dashboard

### You're In! 🎉

You should now see:
- **Dashboard** with KPI cards
- **Navigation menu** (Interviewers, Events, Schedule, etc.)
- **Mock data** from the backend

---

## Step 4: Connect Frontend to Backend

Currently, your frontend uses **localStorage**. Let's connect it to the **backend API**.

### Option A: Hybrid Mode (Recommended for Testing)

Keep frontend on localStorage but test backend separately:

1. **Frontend**: http://localhost:5173 (uses localStorage)
2. **Backend API**: http://localhost:3000/api (test with Swagger)
3. **Swagger UI**: http://localhost:3000/docs (interactive API testing)

This lets you develop backend independently while frontend works.

### Option B: Full Integration (Production Mode)

Update frontend to call backend API instead of localStorage.

**Example change** (you'll do this later):

```typescript
// Before (localStorage):
// src/polymet/data/database-service.ts
const data = localStorage.getItem('interview_roster_db')

// After (API):
const response = await fetch('http://localhost:3000/api/interviewers', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
const data = await response.json()
```

---

## Architecture Overview

```
┌─────────────────────────────────────────┐
│  Browser: http://localhost:5173         │
│  ┌────────────────────────────────┐     │
│  │  React Frontend (Vite)         │     │
│  │  - Dashboard                   │     │
│  │  - Interviewers Page           │     │
│  │  - Events Page                 │     │
│  └────────────────────────────────┘     │
└────────────┬────────────────────────────┘
             │
             │ HTTP Requests
             │ (fetch/axios)
             ↓
┌─────────────────────────────────────────┐
│  Backend: http://localhost:3000         │
│  ┌────────────────────────────────┐     │
│  │  Fastify Server                │     │
│  │  - JWT Authentication          │     │
│  │  - REST API                    │     │
│  │  - OpenAPI/Swagger             │     │
│  └────────────────────────────────┘     │
│             ↓                            │
│  ┌────────────────────────────────┐     │
│  │  SQLite Database               │     │
│  │  ./server/data/*.db            │     │
│  └────────────────────────────────┘     │
└─────────────────────────────────────────┘
```

---

## Testing the Full Stack

### Test 1: Health Check

**Backend API:**
```bash
curl http://localhost:3000/api/health
```

**Expected:** `{"status":"ok",...}`

### Test 2: Frontend Access

**Browser:** http://localhost:5173

**Expected:** Login page appears

### Test 3: Swagger UI (Backend API Docs)

**Browser:** http://localhost:3000/docs

**Expected:** Interactive API documentation

### Test 4: Get Interviewers (API)

**Using Swagger UI:**
1. Go to http://localhost:3000/docs
2. Expand `GET /api/interviewers`
3. Click "Try it out"
4. You'll need a JWT token (see below)

**Using curl:**
```bash
# You need a JWT token first
TOKEN="your-jwt-token"

curl http://localhost:3000/api/interviewers \
  -H "Authorization: Bearer $TOKEN"
```

---

## Authentication Flow

### Current Setup (Development)

**Frontend (Mock OAuth):**
- Click "Sign in with Google"
- Stores mock user in localStorage: `auth_user`
- User has admin role

**Backend (JWT):**
- Requires JWT token in Authorization header
- Verifies token signature
- Checks user role for permissions

### Getting a JWT Token (for API testing)

#### Option 1: Create Test Script

```bash
# In server/ directory
node -e "
const jwt = require('jsonwebtoken');
const token = jwt.sign(
  { email: 'admin@example.com', name: 'Admin User', role: 'admin' },
  'super-secret-change-in-production-12345'
);
console.log(token);
"
```

Copy the output token and use it:

```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl http://localhost:3000/api/interviewers \
  -H "Authorization: Bearer $TOKEN"
```

#### Option 2: Use Swagger UI

1. Go to http://localhost:3000/docs
2. Click **"Authorize"** button (top right)
3. Enter: `Bearer <your-token>`
4. Click "Authorize"
5. Now you can test all endpoints!

---

## Development Workflow

### Typical Development Session

**Terminal 1: Backend**
```bash
cd server
npm run dev
# Leave running
```

**Terminal 2: Frontend**
```bash
npm run dev
# Leave running
```

**Browser:**
- Frontend: http://localhost:5173
- Backend API Docs: http://localhost:3000/docs

### Making Changes

**Frontend changes:**
- Edit files in `src/`
- Vite auto-reloads browser
- See changes instantly

**Backend changes:**
- Edit files in `server/src/`
- Node auto-restarts server (--watch flag)
- Test in Swagger UI or curl

---

## Troubleshooting

### Problem: "Port 3000 already in use"

**Solution:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or change backend port
cd server
# Edit .env: PORT=3001
npm run dev
```

### Problem: "Port 5173 already in use"

**Solution:**
```bash
# Kill process on port 5173
lsof -ti:5173 | xargs kill -9

# Vite will auto-find next available port
npm run dev
```

### Problem: Frontend can't connect to backend

**Check:**
1. Backend is running: http://localhost:3000/api/health
2. CORS is configured: Check `server/.env` → `CORS_ORIGIN=http://localhost:5173`
3. Frontend is on correct port: http://localhost:5173

**Fix CORS:**
```bash
# server/.env
CORS_ORIGIN=http://localhost:5173
```

Restart backend server.

### Problem: "Database locked"

**Solution:**
```bash
# Close any SQLite browser connections
# Then restart backend
cd server
npm run dev
```

### Problem: Frontend still uses localStorage

**This is expected!** Frontend hasn't been migrated to use backend API yet.

**To migrate (later):**
1. Replace `database-service.ts` calls with `fetch()` calls
2. Add JWT token to requests
3. Handle API responses
4. Update error handling

---

## Ports Reference

| Service | Port | URL | Purpose |
|---------|------|-----|---------|
| **Frontend** | 5173 | http://localhost:5173 | React app (Vite) |
| **Backend API** | 3000 | http://localhost:3000/api | REST API |
| **API Docs** | 3000 | http://localhost:3000/docs | Swagger UI |
| **Health Check** | 3000 | http://localhost:3000/api/health | Server status |

---

## Features Available

### Frontend (http://localhost:5173)

✅ **Working Now:**
- Login (mock Google OAuth)
- Dashboard with KPIs
- Interviewers list/create/edit/delete
- Interview events list
- Schedule calendar view
- Audit logs (admin only)
- Database management (admin only)
- Role-based access control

**Data Source:** localStorage (browser)

### Backend API (http://localhost:3000/api)

✅ **Working Now:**
- Health check endpoint
- **Interviewers CRUD** (with auth)
- **Events CRUD** (with auth) ✨ NEW
- **Audit Logs API** (read-only) ✨ NEW
- JWT authentication
- Role-based authorization
- Automatic audit logging
- OpenAPI/Swagger documentation
- Statistics endpoints (events, audit logs)

**Data Source:** SQLite database (server/data/interviewer-roster.db)

🚧 **Optional Future Enhancements:**
- Auth/login endpoint (currently uses JWT directly)
- Google OAuth integration
- Calendar sync endpoints
- Email notifications

---

## Next Steps

### Immediate (Test Everything Works)

1. ✅ Backend running on http://localhost:3000
2. ✅ Frontend running on http://localhost:5173
3. ✅ Login to frontend
4. ✅ Browse dashboard, interviewers, events
5. ✅ Open Swagger UI http://localhost:3000/docs
6. ✅ Test API with generated JWT token

### Short Term (Complete Backend)

1. **Implement Events API**
   - Copy `server/src/features/interviewers/` pattern
   - Create events routes, service, repository
   - Test in Swagger UI

2. **Implement Audit Logs API**
   - Read-only endpoints
   - Filtering by entity type

3. **Add Auth Endpoints**
   - POST `/api/auth/login`
   - POST `/api/auth/refresh`
   - Mock Google OAuth for development

### Long Term (Full Integration)

1. **Migrate Frontend to Use Backend API**
   - Replace localStorage calls with fetch()
   - Add JWT token management
   - Handle API errors
   - Update loading states

2. **Real Authentication**
   - Implement Google OAuth on backend
   - Update frontend OAuth flow
   - Store JWT securely (memory, not localStorage)

3. **Production Deployment**
   - Deploy backend (Railway, Fly.io, Heroku)
   - Deploy frontend (Vercel, Netlify)
   - Configure production environment variables

---

## Quick Reference Commands

```bash
# BACKEND (Terminal 1)
cd server
npm install              # First time only
npm run db:reset         # Reset database
npm run dev              # Start backend
# Visit: http://localhost:3000/docs

# FRONTEND (Terminal 2)
npm install              # First time only
npm run dev              # Start frontend
# Visit: http://localhost:5173

# TESTING
curl http://localhost:3000/api/health        # Backend health
curl http://localhost:5173                   # Frontend (HTML)

# STOP SERVERS
Ctrl+C in each terminal
```

---

## URLs at a Glance

| What | URL | Auth Required |
|------|-----|---------------|
| **Frontend App** | http://localhost:5173 | Mock login |
| **API Health** | http://localhost:3000/api/health | No |
| **API Docs (Swagger)** | http://localhost:3000/docs | No |
| **Get Interviewers** | http://localhost:3000/api/interviewers | JWT token |
| **Create Interviewer** | http://localhost:3000/api/interviewers (POST) | JWT + admin/talent |

---

## Visual Guide

### Starting Backend
```
┌─────────────────────────────────────┐
│ Terminal 1: Backend                 │
├─────────────────────────────────────┤
│ $ cd server                         │
│ $ npm install                       │
│ $ npm run db:reset                  │
│ $ npm run dev                       │
│                                     │
│ ✅ Server listening on :3000        │
│ ✅ API docs at /docs                │
└─────────────────────────────────────┘
```

### Starting Frontend
```
┌─────────────────────────────────────┐
│ Terminal 2: Frontend                │
├─────────────────────────────────────┤
│ $ npm install                       │
│ $ npm run dev                       │
│                                     │
│ ✅ Local: http://localhost:5173    │
└─────────────────────────────────────┘
```

### Browser Access
```
┌──────────────────────────────────────────┐
│ Browser                                   │
├──────────────────────────────────────────┤
│                                           │
│ Tab 1: http://localhost:5173             │
│ → Interviewer Roster App                 │
│ → Login → Dashboard → Interviewers       │
│                                           │
│ Tab 2: http://localhost:3000/docs        │
│ → Swagger UI                              │
│ → Test API endpoints                      │
│                                           │
└──────────────────────────────────────────┘
```

---

## Success Criteria ✅

You've successfully set up the full stack when:

- [ ] Backend server running on port 3000
- [ ] Frontend app running on port 5173
- [ ] Can access frontend in browser
- [ ] Can login to frontend
- [ ] Can see dashboard with mock data
- [ ] Swagger UI loads at /docs
- [ ] Can test API endpoints with JWT
- [ ] Both servers auto-reload on changes

---

## Need Help?

1. **Backend issues**: See `server/README.md` or `server/GETTING_STARTED.md`
2. **Frontend issues**: See root `README.md`
3. **Architecture questions**: See `server/ARCHITECTURE.md`
4. **API documentation**: http://localhost:3000/docs (when server is running)

---

**You're all set! 🚀**

Open http://localhost:5173 in your browser to use the app!
