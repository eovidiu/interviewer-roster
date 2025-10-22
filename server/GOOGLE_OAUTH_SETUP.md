# Google OAuth 2.0 Setup Guide

This guide explains how to set up Google OAuth 2.0 authentication for the Interview Roster application (Issue #55).

## Prerequisites

- Google account
- Access to Google Cloud Console
- Node.js and npm installed
- Backend server configured

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown in the top navigation bar
3. Click "New Project"
4. Enter a project name (e.g., "Interview Roster")
5. Click "Create"

## Step 2: Enable Google+ API

1. In the Google Cloud Console, navigate to "APIs & Services" > "Library"
2. Search for "Google+ API"
3. Click on it and click "Enable"
4. Also enable "Google Identity Services"

## Step 3: Configure OAuth Consent Screen

1. Navigate to "APIs & Services" > "OAuth consent screen"
2. Select "External" user type (for testing with any Google account)
3. Click "Create"
4. Fill in the required fields:
   - **App name**: Interview Roster
   - **User support email**: Your email address
   - **Developer contact information**: Your email address
5. Click "Save and Continue"
6. On the "Scopes" page, you don't need to add any sensitive scopes (the default scopes are sufficient)
7. Click "Save and Continue"
8. On "Test users" page (if in testing mode):
   - Add your Google account email as a test user
   - Add any other accounts you want to test with
9. Click "Save and Continue"

## Step 4: Create OAuth 2.0 Credentials

1. Navigate to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Select "Web application" as the application type
4. Configure the OAuth client:
   - **Name**: Interview Roster Web Client
   - **Authorized JavaScript origins**:
     - `http://localhost:5173` (for frontend development)
   - **Authorized redirect URIs**:
     - `http://localhost:3000/api/auth/google/callback` (for backend OAuth callback)
5. Click "Create"
6. **IMPORTANT**: Copy your client ID and client secret immediately
   - Client secrets are only shown once in 2025+ Google Cloud Console
   - Store them securely

## Step 5: Configure Environment Variables

1. Navigate to the `server` directory
2. Open the `.env` file (create it if it doesn't exist by copying `.env.example`)
3. Add the Google OAuth credentials:

```bash
# Google OAuth 2.0 (Issue #55)
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

4. Make sure the following environment variables are also set:
```bash
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

## Step 6: Install Dependencies

The required npm packages should already be installed:

```bash
cd server
npm install
```

Key packages:
- `google-auth-library` - Google's official OAuth library
- `@fastify/jwt` - JWT authentication for Fastify

## Step 7: Test the OAuth Flow

1. Start the backend server:
```bash
cd server
npm start
```

2. Start the frontend (in a separate terminal):
```bash
npm run dev
```

3. Open your browser to `http://localhost:5173/login`
4. Click "Sign in with Google"
5. You should be redirected to Google's login page
6. Sign in with your Google account
7. Grant the requested permissions
8. You should be redirected back to the application and logged in

## OAuth Flow Diagram

```
User clicks "Sign in with Google"
    ↓
Frontend redirects to: /api/auth/google
    ↓
Backend generates OAuth URL and redirects to Google
    ↓
User authenticates with Google
    ↓
Google redirects to: /api/auth/google/callback?code=...
    ↓
Backend exchanges code for tokens
    ↓
Backend verifies ID token
    ↓
Backend creates/updates user in database
    ↓
Backend generates JWT token
    ↓
Backend redirects to: /auth/callback?token=...
    ↓
Frontend extracts JWT and stores in memory
    ↓
User is logged in
```

## Security Features

- **CSRF Protection**: State parameter with timestamp
- **Token Verification**: ID tokens verified server-side
- **Secure Storage**: JWT stored in memory only (not localStorage per Issue #24)
- **Role-Based Access**: Admin role for `eovidiu@gmail.com`, viewer role for others
- **Audit Logging**: All user creations logged

## User Roles

When users sign in via Google OAuth, they are automatically assigned roles:

- `eovidiu@gmail.com` → **admin** role (full access)
- All other users → **viewer** role (read-only dashboard access)

Admins can change user roles via the User Management page (`/users`).

## Production Deployment

For production deployment:

1. Update the OAuth consent screen to "Production" mode
2. Add production domains to:
   - Authorized JavaScript origins: `https://your-domain.com`
   - Authorized redirect URIs: `https://your-domain.com/api/auth/google/callback`
3. Update environment variables:
   ```bash
   GOOGLE_REDIRECT_URI=https://your-domain.com/api/auth/google/callback
   CORS_ORIGIN=https://your-domain.com
   NODE_ENV=production
   ```
4. Use a strong JWT secret (generate using `openssl rand -base64 32`)

## Troubleshooting

### Error: "redirect_uri_mismatch"
- Check that the redirect URI in Google Cloud Console exactly matches `GOOGLE_REDIRECT_URI` in `.env`
- Make sure there are no trailing slashes

### Error: "access_denied"
- User denied access during OAuth flow
- Check that user is added as a test user if OAuth app is in testing mode

### Error: "invalid_client"
- Client ID or Client Secret is incorrect
- Verify credentials in `.env` match Google Cloud Console

### Error: "Failed to decode JWT token"
- Token may be malformed or expired
- Check backend logs for more details

## API Endpoints

### `GET /api/auth/google`
Initiates the Google OAuth flow.

**Query Parameters:**
- `returnUrl` (optional): URL to redirect to after successful login

### `GET /api/auth/google/callback`
Handles the OAuth callback from Google.

**Query Parameters:**
- `code`: Authorization code from Google
- `state`: State parameter for CSRF protection

### `GET /api/auth/me`
Returns the currently authenticated user.

**Headers:**
- `Authorization: Bearer <jwt-token>`

## Related Issues

- Issue #55: Google OAuth Integration
- Issue #24: Token Storage Security
- Issue #53: Database-driven User Management
- Issue #54: User Management Page

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review backend logs (`server/logs`)
3. Check frontend console for errors
4. Verify environment variables are correct
