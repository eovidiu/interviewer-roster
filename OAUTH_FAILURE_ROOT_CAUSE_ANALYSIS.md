# OAuth Login Failure - Root Cause Analysis & Fixes

## Executive Summary

The OAuth `auth_failed` error was caused by **ephemeral database storage in Railway**. The SQLite database was not persisted across deployments, causing failures when users attempted to log in after redeployment.

## Root Causes Identified

### 1. **Critical Issue: Ephemeral Database (PRIMARY CAUSE)**

**Problem:**
- Railway deployments use ephemeral file systems by default
- The SQLite database at `./data/interviewer-roster.db` was created fresh on each deployment
- User data and sessions were lost after every redeploy or restart
- OAuth callback handlers attempting to create/query users would fail intermittently

**Evidence:**
- Deployment logs show fresh database initialization each time
- No persistent volume was configured in Railway
- `server/railway.toml` was using NIXPACKS without volume mounts

**Fix Applied:**
```toml
[build]
builder = "DOCKERFILE"

[deploy]
startCommand = "npm start"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10

[[deploy.volumes]]
mountPath = "/app/data"
name = "interviewer-roster-data"
```

### 2. **Secondary Issue: Inadequate Error Handling**

**Problem:**
- Database errors weren't being properly caught and logged
- Audit log insertion failure would crash the entire OAuth flow
- Generic `auth_failed` error provided no visibility into actual failure point

**Fixes Applied:**

a) **Granular Database Error Handling:**
   - Wrapped `findByEmail()` in try-catch to catch query failures
   - Wrapped `create()` in try-catch to catch creation failures
   - Added specific error logging for each database operation

b) **Resilient Audit Logging:**
   - Made audit log insertion non-blocking (wrapped in try-catch)
   - Audit log failures now log warnings but don't break OAuth flow
   - This prevents database write issues from failing authentication

c) **Enhanced Error Logging:**
   - Added structured logging with context variables:
     - Environment variable status (SET/NOT_SET)
     - Database path for debugging
     - Full error stack traces
     - Error code and name
   - Helps identify exact failure point in production

## Code Changes

### File: `server/railway.toml`
- Changed builder from NIXPACKS to DOCKERFILE
- Added persistent volume mount for database
- Volume name: `interviewer-roster-data`
- Mount path: `/app/data`

### File: `server/src/features/auth/routes.js`
- Added try-catch around `findByEmail()` call (line 113-117)
- Added try-catch around `create()` call (line 125-134)
- Made audit logging non-fatal (line 138-155)
- Enhanced error logging with structured context (line 206-224)
- Removed noisy console.error calls, kept structured logging

## Testing

All OAuth tests pass:
```
PASS src/features/auth/__tests__/routes.test.js
Tests: 23 passed, 23 total
```

Test coverage includes:
- OAuth initiation with state parameter
- Google callback with authorization code
- User creation on first login
- User update on subsequent logins
- Error handling for missing email, token exchange failures
- Admin role assignment for eovidiu@gmail.com
- Viewer role redirection to /schedule

## Environment Variables Verified

All required OAuth environment variables are properly set in Railway:
- `GOOGLE_CLIENT_ID`: Set
- `GOOGLE_CLIENT_SECRET`: Set (corrected value)
- `GOOGLE_REDIRECT_URI`: https://backend-production-269a.up.railway.app/api/auth/google/callback
- `CORS_ORIGIN`: https://interviewers.up.railway.app
- `JWT_SECRET`: Set
- `DATABASE_PATH`: ./data/interviewer-roster.db
- `NODE_ENV`: production

## Deployment Notes

**Next Steps:**
1. Deploy code with persistent volume configuration
2. Wait for deployment to complete (watch logs for "Server listening at http://0.0.0.0:3000")
3. Test OAuth flow:
   - Click "Sign in with Google" on frontend
   - Complete Google authentication
   - Should redirect to callback with JWT token
   - Check Railway logs for any errors in `error` or `warn` level messages

**Monitoring:**
- Watch for "OAuth callback error details" messages in logs (will show exact failure point)
- Check audit log creation logs - failures are non-fatal but logged as warnings
- Database path should be `/app/data/interviewer-roster.db` (mounted from persistent volume)

## Prevention

To prevent similar issues in the future:

1. **Database Persistence:** Always configure volume mounts for stateful data (databases, file uploads)
2. **Error Resilience:** Make non-critical operations (logging, auditing) non-blocking
3. **Structured Logging:** Include context and environment state in error messages
4. **Testing:** Include integration tests that verify database operations during OAuth flow

## Deployment Architecture Diagram

```
Frontend (Vite on Caddy)     Backend (Fastify)
https://interviewers.up.railway.app  https://backend-production-269a.up.railway.app
                                  |
                                  v
                        Node.js Container
                        ├── src/server.js
                        ├── src/features/auth/
                        └── data/ (MOUNTED VOLUME)
                            └── interviewer-roster.db (persistent SQLite)
                                        |
                                        v
                            Users Table (persists)
                            - email (PK)
                            - name, role
                            - picture, last_login_at
```

## Security Considerations

- Database volume is encrypted at rest by Railway
- No sensitive data is stored in logs (client secrets are masked with "SET"/"NOT_SET")
- JWT tokens generated with 7-day expiration
- Database queries use prepared statements (no SQL injection risk)

## Verification Commands

After deployment, verify the fix:

```bash
# Check that volume is mounted
railway logs --service backend | grep "data"

# Check that database exists and is accessible
railway run --service backend -- ls -la data/

# Monitor OAuth attempts
railway logs --service backend --filter "OAuth"
```
