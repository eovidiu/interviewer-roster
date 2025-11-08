# Railway Deployment Guide

This guide explains how to deploy the Interviewer Roster application to Railway and configure Google OAuth authentication for production.

## Overview

The application is deployed at: **https://interviewers.up.railway.app**

## Required Environment Variables

### Backend Environment Variables (Railway Service)

Configure these environment variables in your Railway service settings:

```bash
# Server Configuration
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
LOG_LEVEL=info

# Database
DATABASE_PATH=./data/interviewer-roster.db

# JWT Authentication
JWT_SECRET=<generate-a-strong-random-secret>
JWT_EXPIRES_IN=7d

# CORS - CRITICAL: Must match your Railway frontend URL
CORS_ORIGIN=https://interviewers.up.railway.app

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_TIME_WINDOW=60000

# API Documentation
SWAGGER_ENABLED=true

# Google OAuth 2.0 - CRITICAL for OAuth to work
GOOGLE_CLIENT_ID=<your-client-id>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<your-client-secret>
GOOGLE_REDIRECT_URI=https://interviewers.up.railway.app/api/auth/google/callback
```

### Frontend Environment Variables (Railway Service)

If your frontend and backend are in the same Railway service, configure:

```bash
# CRITICAL: Must match your Railway backend URL
VITE_API_URL=https://interviewers.up.railway.app
```

## Google Cloud Console Configuration

To fix the OAuth redirect issue, you **must** update your Google Cloud Console settings:

### 1. Navigate to Google Cloud Console
Go to: https://console.cloud.google.com/apis/credentials

### 2. Select Your OAuth 2.0 Client ID
Find and click on the OAuth 2.0 Client ID you're using for this application.

### 3. Update Authorized JavaScript Origins
Add the following to **Authorized JavaScript origins**:
- `https://interviewers.up.railway.app`

**Note:** Keep `http://localhost:5173` for local development.

### 4. Update Authorized Redirect URIs
Add the following to **Authorized redirect URIs**:
- `https://interviewers.up.railway.app/api/auth/google/callback`

**Note:** Keep `http://localhost:3000/api/auth/google/callback` for local development.

### 5. Save Changes
Click the **Save** button at the bottom of the page.

## Common Issues and Solutions

### Issue: "redirect_uri_mismatch" Error

**Cause:** The redirect URI in your request doesn't match the ones configured in Google Cloud Console.

**Solution:**
1. Verify `GOOGLE_REDIRECT_URI` environment variable in Railway matches exactly: `https://interviewers.up.railway.app/api/auth/google/callback`
2. Verify this exact URL is in your Google Cloud Console Authorized redirect URIs
3. Wait a few minutes for Google's changes to propagate

### Issue: Redirecting to localhost:3000 Instead of Production URL

**Cause:** The `CORS_ORIGIN` environment variable is still set to `http://localhost:5173`.

**Solution:**
1. Set `CORS_ORIGIN=https://interviewers.up.railway.app` in Railway
2. Redeploy your application

### Issue: CORS Errors When Logging In

**Cause:** The frontend is trying to call an API with a different origin than what's configured in CORS.

**Solution:**
1. Ensure `CORS_ORIGIN` matches your Railway frontend URL exactly
2. Ensure `VITE_API_URL` is set correctly in frontend environment variables
3. Redeploy both frontend and backend

### Issue: "Invalid JWT Token" After Login

**Cause:** The `JWT_SECRET` is different between deployments or not set.

**Solution:**
1. Set a consistent `JWT_SECRET` in Railway environment variables
2. Use a strong random string (at least 32 characters)
3. Never change this in production unless you want to invalidate all existing sessions

## Deployment Checklist

- [ ] Railway environment variables configured (see above)
- [ ] Google Cloud Console Authorized JavaScript origins updated
- [ ] Google Cloud Console Authorized redirect URIs updated
- [ ] Application redeployed after environment variable changes
- [ ] Test OAuth login flow with Railway URL
- [ ] Verify no localhost URLs in production logs

## OAuth Flow in Production

1. User clicks "Sign in with Google" → Frontend redirects to: `https://interviewers.up.railway.app/api/auth/google`
2. Backend generates OAuth URL and redirects to Google login
3. User authenticates with Google
4. Google redirects back to: `https://interviewers.up.railway.app/api/auth/google/callback?code=...`
5. Backend exchanges code for tokens and creates JWT
6. Backend redirects to: `https://interviewers.up.railway.app/auth/callback?token=...`
7. Frontend stores JWT and redirects to dashboard

## Testing the Deployment

1. Open https://interviewers.up.railway.app
2. Click "Sign in with Google"
3. Verify you're redirected to Google (not localhost)
4. Complete Google authentication
5. Verify you're redirected back to https://interviewers.up.railway.app (not localhost)
6. Verify you're logged in successfully

## Additional Notes

- **Database:** The SQLite database is stored in the Railway volume at `./data/interviewer-roster.db`
- **JWT Tokens:** Stored in memory only (not localStorage) for security
- **Token Expiry:** Default is 7 days, configurable via `JWT_EXPIRES_IN`
- **CORS:** Only the origin specified in `CORS_ORIGIN` can access the API

## Support

For more information on Google OAuth setup, see: `/home/user/interviewer-roster/server/GOOGLE_OAUTH_SETUP.md`
