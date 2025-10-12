/**
 * IMPORT DATA FORMAT EXAMPLE
 * =========================
 *
 * This file shows the expected JSON format for importing data into the Interview Roster database.
 * You can export your current database to see the exact format, or create a new file following this structure.
 *
 * All fields are optional - you can import just interviewers, just events, or all data types.
 * The import process will skip duplicates based on email (for interviewers) and id (for events/logs).
 */

export const importFormatExample = {
  // ==================== INTERVIEWERS ====================
  // Array of interviewer objects
  // Duplicates are detected by 'email' field
  interviewers: [
    {
      id: "int_001", // Unique identifier (auto-generated if not provided)
      name: "Sarah Chen", // Full name of the interviewer
      email: "sarah.chen@company.com", // Email (must be unique)
      role: "Senior Software Engineer", // Job role/title
      skills: ["React", "TypeScript", "System Design"], // Array of skills
      is_active: true, // Whether the interviewer is currently active
      calendar_sync_enabled: true, // Whether calendar sync is enabled
      created_at: "2024-01-15T10:00:00Z", // ISO timestamp (auto-generated if not provided)
      updated_at: "2024-01-15T10:00:00Z", // ISO timestamp (auto-updated on import)
    },
    {
      id: "int_002",
      name: "Michael Rodriguez",
      email: "michael.rodriguez@company.com",
      role: "Engineering Manager",
      skills: ["Leadership", "Architecture", "Node.js"],
      is_active: true,
      calendar_sync_enabled: false,
      created_at: "2024-01-16T10:00:00Z",
      updated_at: "2024-01-16T10:00:00Z",
    },
  ],

  // ==================== INTERVIEW EVENTS ====================
  // Array of interview event objects
  // Duplicates are detected by 'id' field
  events: [
    {
      id: "evt_001", // Unique identifier (auto-generated if not provided)
      interviewer_email: "sarah.chen@company.com", // Must match an interviewer email
      candidate_name: "Alex Johnson", // Name of the candidate
      position: "Senior Frontend Developer", // Position being interviewed for
      scheduled_date: "2024-10-15T14:00:00Z", // ISO timestamp of the interview
      duration_minutes: 60, // Duration in minutes
      status: "attended", // Status: "pending" | "attended" | "ghosted" | "cancelled"
      notes: "Great technical skills, strong React knowledge", // Optional notes
      created_at: "2024-10-10T10:00:00Z", // ISO timestamp (auto-generated if not provided)
      updated_at: "2024-10-15T15:00:00Z", // ISO timestamp (auto-updated on import)
    },
    {
      id: "evt_002",
      interviewer_email: "michael.rodriguez@company.com",
      candidate_name: "Emma Davis",
      position: "Backend Engineer",
      scheduled_date: "2024-10-16T10:00:00Z",
      duration_minutes: 45,
      status: "pending",
      notes: null, // Notes can be null
      created_at: "2024-10-12T10:00:00Z",
      updated_at: "2024-10-12T10:00:00Z",
    },
  ],

  // ==================== AUDIT LOGS ====================
  // Array of audit log objects
  // Duplicates are detected by 'id' field
  auditLogs: [
    {
      id: "log_001", // Unique identifier (auto-generated if not provided)
      user_email: "admin@company.com", // Email of the user who performed the action
      user_name: "Admin User", // Name of the user
      action: "create_interviewer", // Action performed (e.g., "create_interviewer", "update_event", etc.)
      entity_type: "interviewer", // Type of entity affected (e.g., "interviewer", "event", "database")
      entity_id: "int_001", // ID of the affected entity
      changes: {
        // Object containing the changes made
        name: "Sarah Chen",
        email: "sarah.chen@company.com",
      },
      timestamp: "2024-01-15T10:00:00Z", // ISO timestamp of the action
    },
  ],
};

/**
 * IMPORT RULES
 * ============
 *
 * 1. **File Format**: Must be valid JSON
 * 2. **Optional Fields**: You can include only the data types you want to import
 * 3. **Duplicate Handling**:
 *    - Interviewers: Duplicates detected by 'email' field
 *    - Events: Duplicates detected by 'id' field
 *    - Audit Logs: Duplicates detected by 'id' field
 * 4. **Timestamps**: Use ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ)
 * 5. **Status Values**: For events, use only: "pending", "attended", "ghosted", or "cancelled"
 * 6. **Foreign Keys**: Event 'interviewer_email' must match an existing interviewer email
 *
 * MINIMAL EXAMPLE
 * ===============
 * You can import just one type of data:
 *
 * {
 *   "interviewers": [
 *     {
 *       "name": "John Doe",
 *       "email": "john.doe@company.com",
 *       "role": "Software Engineer",
 *       "skills": ["JavaScript", "Python"],
 *       "is_active": true,
 *       "calendar_sync_enabled": false
 *     }
 *   ]
 * }
 *
 * EXPORT TO GET CURRENT FORMAT
 * ============================
 * The easiest way to see the exact format is to:
 * 1. Go to Database Management page
 * 2. Click "Export Backup"
 * 3. Open the downloaded JSON file
 * 4. Use it as a template for your imports
 */
