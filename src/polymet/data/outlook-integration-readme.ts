/**
 * OUTLOOK 365 CALENDAR INTEGRATION DOCUMENTATION
 * ================================================
 *
 * This file documents the Outlook 365 calendar integration for the Interview Roster App.
 * The integration uses Microsoft Graph API and Azure AD OAuth 2.0.
 *
 * ## OVERVIEW
 *
 * The Outlook 365 integration allows the system to:
 * - Read calendar entries from shared interviewer calendars
 * - Automatically import interview events from Outlook
 * - Check availability based on Outlook free/busy status
 * - Track interviewer schedules without manual entry
 *
 * **IMPORTANT**: This integration is READ-ONLY. It does NOT:
 * - Schedule interviews in Outlook
 * - Create calendar events
 * - Modify existing calendar entries
 * - Send calendar invites
 *
 * ## ARCHITECTURE
 *
 * ### Components
 * 1. **Azure AD App Registration** - OAuth 2.0 authentication
 * 2. **Microsoft Graph API** - Calendar access and management
 * 3. **Calendar Sync Service** - Background sync process
 * 4. **Settings Page** - Admin configuration interface
 *
 * ### Authentication Flow
 * 1. User clicks "Connect Outlook Calendar" button
 * 2. Redirect to Microsoft login page
 * 3. User grants calendar permissions
 * 4. Receive OAuth token and refresh token
 * 5. Store tokens securely in database
 * 6. Use tokens to access Microsoft Graph API
 *
 * ## AZURE AD SETUP
 *
 * ### Step 1: Register Application in Azure Portal
 * 1. Go to https://portal.azure.com
 * 2. Navigate to "Azure Active Directory" > "App registrations"
 * 3. Click "New registration"
 * 4. Configure:
 *    - Name: "Interview Roster Calendar Sync"
 *    - Supported account types: "Accounts in this organizational directory only"
 *    - Redirect URI: "Web" - "http://localhost:3000/auth/outlook/callback"
 *
 * ### Step 2: Configure API Permissions
 * Required Microsoft Graph API permissions:
 * - `Calendars.Read` - Read shared calendars (READ-ONLY)
 * - `Calendars.Read.Shared` - Read shared calendars from other users
 * - `User.Read` - Read user profile
 * - `offline_access` - Maintain access via refresh token
 *
 * **Note**: We do NOT need `Calendars.ReadWrite` since this is a read-only integration.
 *
 * Grant admin consent for these permissions.
 *
 * ### Step 3: Create Client Secret
 * 1. Go to "Certificates & secrets"
 * 2. Click "New client secret"
 * 3. Add description: "Interview Roster Integration"
 * 4. Set expiration (recommended: 24 months)
 * 5. Copy the secret value immediately (shown only once)
 *
 * ### Step 4: Note Configuration Values
 * From the app registration overview page, copy:
 * - **Application (client) ID** - Used in OAuth flow
 * - **Directory (tenant) ID** - Your organization's tenant ID
 * - **Client secret value** - From step 3
 *
 * ## MICROSOFT GRAPH API ENDPOINTS
 *
 * ### Base URL
 * ```
 * https://graph.microsoft.com/v1.0
 * ```
 *
 * ### Key Endpoints
 *
 * #### Get User's Calendars
 * ```
 * GET /me/calendars
 * ```
 *
 * #### Get Shared Calendar Events (READ-ONLY)
 * ```
 * GET /users/{interviewer-email}/calendar/events
 * Query parameters:
 *   - $filter: startDateTime ge '2024-01-01T00:00:00Z'
 *   - $select: subject,start,end,location,attendees,isCancelled
 *   - $orderby: start/dateTime
 *   - $top: 100
 * ```
 *
 * #### Get Events from Specific Shared Calendar
 * ```
 * GET /users/{interviewer-email}/calendars/{calendar-id}/events
 * Query parameters:
 *   - $filter: startDateTime ge '2024-01-01T00:00:00Z'
 *   - $select: subject,start,end,location,attendees,isCancelled
 *   - $orderby: start/dateTime
 * ```
 *
 * #### Get Free/Busy Schedule
 * ```
 * POST /me/calendar/getSchedule
 * Body: {
 *   "schedules": ["interviewer@company.com"],
 *   "startTime": {
 *     "dateTime": "2024-03-25T00:00:00",
 *     "timeZone": "Pacific Standard Time"
 *   },
 *   "endTime": {
 *     "dateTime": "2024-03-25T23:59:59",
 *     "timeZone": "Pacific Standard Time"
 *   },
 *   "availabilityViewInterval": 60
 * }
 * ```
 *
 * ## OAUTH 2.0 FLOW
 *
 * ### Authorization Request
 * ```
 * https://login.microsoftonline.com/{tenant-id}/oauth2/v2.0/authorize?
 *   client_id={client-id}
 *   &response_type=code
 *   &redirect_uri={redirect-uri}
 *   &response_mode=query
 *   &scope=https://graph.microsoft.com/Calendars.Read https://graph.microsoft.com/Calendars.Read.Shared offline_access
 *   &state={random-state-string}
 * ```
 *
 * ### Token Request
 * ```
 * POST https://login.microsoftonline.com/{tenant-id}/oauth2/v2.0/token
 * Body:
 *   client_id={client-id}
 *   &scope=https://graph.microsoft.com/Calendars.Read https://graph.microsoft.com/Calendars.Read.Shared
 *   &code={authorization-code}
 *   &redirect_uri={redirect-uri}
 *   &grant_type=authorization_code
 *   &client_secret={client-secret}
 * ```
 *
 * ### Refresh Token Request
 * ```
 * POST https://login.microsoftonline.com/{tenant-id}/oauth2/v2.0/token
 * Body:
 *   client_id={client-id}
 *   &scope=https://graph.microsoft.com/Calendars.Read https://graph.microsoft.com/Calendars.Read.Shared
 *   &refresh_token={refresh-token}
 *   &grant_type=refresh_token
 *   &client_secret={client-secret}
 * ```
 *
 * ## DATABASE SCHEMA ADDITIONS
 *
 * ### Outlook Tokens Table
 * ```sql
 * CREATE TABLE outlook_tokens (
 *   id TEXT PRIMARY KEY,
 *   user_email TEXT UNIQUE NOT NULL,
 *   access_token TEXT NOT NULL,
 *   refresh_token TEXT NOT NULL,
 *   token_expires_at TEXT NOT NULL,
 *   scope TEXT NOT NULL,
 *   created_at TEXT NOT NULL,
 *   updated_at TEXT NOT NULL,
 *   FOREIGN KEY (user_email) REFERENCES interviewers(email) ON DELETE CASCADE
 * );
 * ```
 *
 * ### Calendar Sync Status Table
 * ```sql
 * CREATE TABLE calendar_sync_status (
 *   id TEXT PRIMARY KEY,
 *   user_email TEXT UNIQUE NOT NULL,
 *   last_sync_at TEXT,
 *   last_sync_status TEXT, -- 'success', 'failed', 'in_progress'
 *   sync_error_message TEXT,
 *   events_synced_count INTEGER DEFAULT 0,
 *   next_sync_at TEXT,
 *   FOREIGN KEY (user_email) REFERENCES interviewers(email) ON DELETE CASCADE
 * );
 * ```
 *
 * ## IMPLEMENTATION CHECKLIST
 *
 * ### Backend Implementation
 * - [ ] Create Azure AD app registration
 * - [ ] Configure API permissions and admin consent
 * - [ ] Generate and store client secret securely
 * - [ ] Implement OAuth 2.0 authorization flow
 * - [ ] Create token storage and refresh mechanism
 * - [ ] Implement Microsoft Graph API client
 * - [ ] Create calendar sync service
 * - [ ] Add webhook support for real-time updates (optional)
 * - [ ] Implement error handling and retry logic
 * - [ ] Add logging and monitoring
 *
 * ### Frontend Implementation
 * - [x] Update Settings page with Outlook configuration
 * - [ ] Create "Connect Outlook Calendar" button
 * - [ ] Implement OAuth callback handler
 * - [ ] Add calendar sync status indicator
 * - [ ] Create manual sync trigger button
 * - [ ] Add calendar disconnect functionality
 * - [ ] Show last sync timestamp
 * - [ ] Display sync errors to users
 *
 * ### Database Updates
 * - [ ] Add outlook_tokens table
 * - [ ] Add calendar_sync_status table
 * - [ ] Update interviewers table with Outlook-specific fields
 * - [ ] Create indexes for performance
 *
 * ### Testing
 * - [ ] Test OAuth flow with real Outlook account
 * - [ ] Test calendar event creation
 * - [ ] Test calendar event updates
 * - [ ] Test free/busy status retrieval
 * - [ ] Test token refresh mechanism
 * - [ ] Test error scenarios (expired token, revoked access, etc.)
 * - [ ] Test sync with multiple interviewers
 * - [ ] Performance test with large calendar datasets
 *
 * ## SECURITY CONSIDERATIONS
 *
 * ### Token Storage
 * - Store access tokens and refresh tokens encrypted in database
 * - Never expose tokens in client-side code
 * - Use environment variables for client secret
 * - Implement token rotation
 *
 * ### API Security
 * - Validate all OAuth callbacks
 * - Use state parameter to prevent CSRF attacks
 * - Implement rate limiting for API calls
 * - Log all calendar access for audit trail
 *
 * ### Data Privacy
 * - Only read from designated shared calendars
 * - Respect calendar privacy settings
 * - Allow admins to disconnect calendar sync at any time
 * - Delete tokens when sync is disconnected
 * - Comply with data retention policies
 * - Never write to or modify Outlook calendars
 *
 * ## SYNC STRATEGY (READ-ONLY)
 *
 * ### Initial Sync
 * 1. Admin configures shared calendar access
 * 2. System fetches events from last 30 days and next 90 days
 * 3. Import events into local database as read-only records
 * 4. Match events with existing interview records (if any)
 * 5. Update sync status
 *
 * ### Incremental Sync (Every 15 minutes)
 * 1. Check if token needs refresh
 * 2. Fetch events modified since last sync from shared calendars
 * 3. Update local records with changes from Outlook
 * 4. Import new events from Outlook
 * 5. Mark cancelled events in local database
 * 6. Update last sync timestamp
 *
 * ### Real-time Sync (Optional - using webhooks)
 * 1. Subscribe to shared calendar change notifications
 * 2. Receive webhook when calendar changes
 * 3. Fetch specific changed events
 * 4. Update local database immediately
 *
 * **Important**: All syncing is ONE-WAY (Outlook → Local Database).
 * Changes made in the roster system do NOT sync back to Outlook.
 *
 * ## ERROR HANDLING
 *
 * ### Common Errors
 * - **401 Unauthorized** - Token expired, refresh token
 * - **403 Forbidden** - Insufficient permissions, prompt re-authorization
 * - **404 Not Found** - Calendar or event deleted
 * - **429 Too Many Requests** - Rate limited, implement exponential backoff
 * - **500 Server Error** - Microsoft service issue, retry later
 *
 * ### Retry Strategy
 * - Exponential backoff: 1s, 2s, 4s, 8s, 16s
 * - Maximum 5 retry attempts
 * - Log failures for monitoring
 * - Notify admin if sync fails repeatedly
 *
 * ## MONITORING & LOGGING
 *
 * ### Metrics to Track
 * - Sync success rate
 * - Sync duration
 * - API call count and rate
 * - Token refresh frequency
 * - Error rates by type
 * - Number of events synced
 *
 * ### Logging
 * - Log all OAuth flows
 * - Log all API calls with response codes
 * - Log sync start/end with results
 * - Log errors with full context
 * - Log token refresh events
 *
 * ## RESOURCES
 *
 * ### Documentation
 * - Microsoft Graph API: https://docs.microsoft.com/en-us/graph/
 * - Calendar API: https://docs.microsoft.com/en-us/graph/api/resources/calendar
 * - OAuth 2.0: https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-auth-code-flow
 *
 * ### SDKs
 * - Microsoft Graph JavaScript SDK: @microsoft/microsoft-graph-client
 * - MSAL for authentication: @azure/msal-node
 *
 * ## EXAMPLE CODE SNIPPETS
 *
 * ### Initialize Graph Client
 * ```typescript
 * import { Client } from '@microsoft/microsoft-graph-client';
 *
 * const client = Client.init({
 *   authProvider: (done) => {
 *     done(null, accessToken);
 *   }
 * });
 * ```
 *
 * ### Fetch Shared Calendar Events (READ-ONLY)
 * ```typescript
 * // Fetch events from a specific interviewer's shared calendar
 * const events = await client
 *   .api(`/users/${interviewerEmail}/calendar/events`)
 *   .select('subject,start,end,location,attendees,isCancelled')
 *   .filter(`start/dateTime ge '${startDate}'`)
 *   .orderby('start/dateTime')
 *   .top(100)
 *   .get();
 * ```
 *
 * ### List Available Shared Calendars
 * ```typescript
 * // Get list of calendars shared with the app
 * const calendars = await client
 *   .api(`/users/${interviewerEmail}/calendars`)
 *   .select('id,name,canShare,canViewPrivateItems,owner')
 *   .get();
 * ```
 */

export const OUTLOOK_INTEGRATION_STATUS = {
  configured: false,
  lastUpdated: new Date().toISOString(),
  version: "1.0.0",
};

export default OUTLOOK_INTEGRATION_STATUS;
