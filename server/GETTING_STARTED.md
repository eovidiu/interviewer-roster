# Getting Started with Interviewer Roster Backend

Complete guide to get the Fastify backend running in 5 minutes.

## Prerequisites

- Node.js 20+ installed
- npm 10+ installed
- Terminal/command line

## Step-by-Step Setup

### 1. Install Dependencies

```bash
cd server
npm install
```

**Expected output:**
```
added 234 packages in 15s
```

### 2. Initialize Database

```bash
# Run migrations (creates tables)
npm run db:migrate

# Seed with mock data
npm run db:seed
```

**Expected output:**
```
📊 Running migrations on: ./data/interviewer-roster.db
✅ Executed statement 1/15
✅ Executed statement 2/15
...
✅ Migrations completed successfully

🌱 Seeding database: ./data/interviewer-roster.db
🗑️  Cleared existing data
✅ Seeded 2 users
✅ Seeded 6 interviewers
✅ Seeded 3 interview events
✅ Seeded 2 audit logs
🎉 Database seeding completed successfully
```

### 3. Start Development Server

```bash
npm run dev
```

**Expected output:**
```
[17:30:42] INFO: Server listening on http://0.0.0.0:3000
[17:30:42] INFO: API documentation available at http://localhost:3000/docs
[17:30:42] INFO: Database connected
[17:30:42] INFO: JWT authentication plugin registered
[17:30:42] INFO: Swagger UI enabled
[17:30:42] INFO: Interviewers feature registered
```

### 4. Test the API

Open your browser or use curl:

```bash
# Health check (no auth required)
curl http://localhost:3000/api/health
```

**Expected output:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-19T17:30:00.000Z",
  "uptime": 42.5
}
```

## API Documentation

Visit: **http://localhost:3000/docs**

You'll see Swagger UI with:
- All API endpoints
- Request/response schemas
- Interactive "Try it out" buttons
- Example requests

## Testing with JWT

### Option 1: Get JWT from Mock Login (TODO)

```bash
# POST /api/auth/login endpoint (to be implemented)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com"}'
```

### Option 2: Generate JWT Manually

```bash
# In the server directory, create a test script:
node -e "
const jwt = require('@fastify/jwt');
const token = jwt.sign({ email: 'admin@example.com', name: 'Admin User', role: 'admin' }, 'super-secret-change-in-production-12345');
console.log(token);
"
```

### Option 3: Use Swagger UI

1. Go to http://localhost:3000/docs
2. Click "Authorize" button
3. Enter: `Bearer <your-jwt-token>`
4. Try the endpoints!

## Testing Endpoints

### Get All Interviewers

```bash
# Get your JWT token first (see above)
TOKEN="your-jwt-token-here"

curl http://localhost:3000/api/interviewers \
  -H "Authorization: Bearer $TOKEN"
```

**Expected output:**
```json
{
  "data": [
    {
      "id": "abc123",
      "name": "Sarah Chen",
      "email": "sarah.chen@example.com",
      "role": "talent",
      "skills": ["React", "TypeScript", "System Design"],
      "is_active": true,
      "timezone": "America/Los_Angeles",
      "created_at": "2025-01-19T10:00:00.000Z"
    },
    ...
  ],
  "pagination": {
    "total": 6,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

### Create New Interviewer

```bash
curl -X POST http://localhost:3000/api/interviewers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "role": "talent",
    "skills": ["JavaScript", "Node.js"],
    "timezone": "America/New_York"
  }'
```

**Expected output:**
```json
{
  "id": "new-id-123",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "talent",
  "skills": ["JavaScript", "Node.js"],
  "is_active": true,
  "calendar_sync_enabled": false,
  "timezone": "America/New_York",
  "created_at": "2025-01-19T17:35:00.000Z",
  "updated_at": "2025-01-19T17:35:00.000Z"
}
```

## Database Management

### View Database

```bash
# Install SQLite browser (optional)
# macOS
brew install --cask db-browser-for-sqlite

# Then open
open data/interviewer-roster.db
```

Or use CLI:

```bash
sqlite3 data/interviewer-roster.db

# Run queries
sqlite> SELECT * FROM interviewers;
sqlite> .quit
```

### Reset Database

```bash
# Clear and reseed
npm run db:reset
```

### Backup Database

```bash
# SQLite is just a file - copy it!
cp data/interviewer-roster.db data/interviewer-roster.backup.db
```

## Connecting Frontend

Update your React frontend to call the backend:

```typescript
// Old (localStorage)
const interviewers = await db.getInterviewers()

// New (API)
const response = await fetch('http://localhost:3000/api/interviewers', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
const { data: interviewers } = await response.json()
```

## Environment Variables

Edit `.env` file:

```bash
# Server
PORT=3000                           # Change port
LOG_LEVEL=debug                     # More verbose logs

# CORS
CORS_ORIGIN=http://localhost:5173   # Your React app URL

# JWT
JWT_SECRET=change-this-secret       # Use strong secret in production
JWT_EXPIRES_IN=24h                  # Token expiration

# Swagger
SWAGGER_ENABLED=true                # Set false to disable docs
```

## Troubleshooting

### Port Already in Use

```bash
# Error: EADDRINUSE: address already in use :::3000
# Solution: Change PORT in .env or kill the process
lsof -ti:3000 | xargs kill -9
```

### Database Locked

```bash
# Error: database is locked
# Solution: Close any SQLite browser connections
# Or restart server
```

### JWT Verification Failed

```bash
# Error: jwt malformed / invalid signature
# Solution: Make sure JWT_SECRET in .env matches what was used to sign token
# Regenerate token with correct secret
```

### Module Not Found

```bash
# Error: Cannot find module 'fastify'
# Solution: Install dependencies
npm install
```

## Development Workflow

### 1. Make Code Changes

Edit files in `src/` directory. Server auto-reloads with `npm run dev`.

### 2. Test Changes

```bash
# Use Swagger UI
open http://localhost:3000/docs

# Or curl
curl http://localhost:3000/api/interviewers

# Or Postman/Insomnia
```

### 3. Check Logs

Terminal shows structured logs:

```
[17:30:42] INFO: Server listening
[17:31:15] INFO (reqId=req-1): incoming request
[17:31:15] INFO (reqId=req-1): request completed
```

### 4. Debug

Add console.log or use debugger:

```javascript
// In service.js
async create(data) {
  console.log('Creating interviewer:', data)
  debugger  // Node.js --inspect mode
  return this.repository.create(data)
}
```

## Next Steps

### Implement Remaining Features

Follow the same pattern as `features/interviewers/`:

1. **Events API**
   ```bash
   cp -r src/features/interviewers src/features/events
   # Edit schemas, repository, service, routes
   ```

2. **Audit Logs API**
   ```bash
   cp -r src/features/interviewers src/features/audit-logs
   # Make read-only (no POST/PUT/DELETE)
   ```

3. **Auth Routes**
   ```bash
   mkdir src/features/auth
   # Add login, refresh token endpoints
   ```

### Add Tests

```bash
# Create test file
touch tests/interviewers.test.js
```

```javascript
import { createApp } from '../src/app.js'

describe('Interviewers API', () => {
  let app

  beforeAll(async () => {
    app = await createApp()
  })

  afterAll(async () => {
    await app.close()
  })

  it('should list interviewers', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/interviewers',
      headers: { authorization: `Bearer ${token}` }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().data).toBeInstanceOf(Array)
  })
})
```

### Deploy

See `README.md` for Docker deployment instructions.

## Getting Help

- **API Docs**: http://localhost:3000/docs
- **Architecture**: See `ARCHITECTURE.md`
- **README**: See `README.md`
- **Fastify Docs**: https://fastify.dev/

## Quick Reference

```bash
# Start server
npm run dev

# Reset database
npm run db:reset

# Run tests
npm test

# Benchmark
npm run benchmark

# Format code
npm run format

# Lint code
npm run lint
```

---

🎉 **You're ready to build your backend!**

The Interviewers API is fully functional. Add Events and Audit Logs following the same pattern.
