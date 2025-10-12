/**
 * SQLite Database Schema for Interview Roster App
 *
 * This file defines the database structure and provides initialization functions
 */

export interface DatabaseSchema {
  interviewers: InterviewerRecord;
  interview_events: InterviewEventRecord;
  audit_logs: AuditLogRecord;
  user_settings: UserSettingRecord;
}

export interface InterviewerRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  skills: string; // JSON string array
  is_active: number; // SQLite boolean (0 or 1)
  calendar_sync_enabled: number; // SQLite boolean (0 or 1)
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
}

export interface InterviewEventRecord {
  id: string;
  interviewer_email: string;
  candidate_name: string;
  position: string;
  scheduled_date: string; // ISO date string
  duration_minutes: number;
  status: "pending" | "attended" | "ghosted" | "cancelled";
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLogRecord {
  id: string;
  user_email: string;
  user_name: string;
  action: string;
  entity_type: string;
  entity_id: string;
  changes: string; // JSON string
  timestamp: string;
}

export interface UserSettingRecord {
  id: string;
  user_email: string;
  setting_key: string;
  setting_value: string;
  updated_at: string;
}

/**
 * SQL statements for creating tables
 */
export const CREATE_TABLES_SQL = {
  interviewers: `
    CREATE TABLE IF NOT EXISTS interviewers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL,
      skills TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      calendar_sync_enabled INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `,

  interview_events: `
    CREATE TABLE IF NOT EXISTS interview_events (
      id TEXT PRIMARY KEY,
      interviewer_email TEXT NOT NULL,
      candidate_name TEXT NOT NULL,
      position TEXT NOT NULL,
      scheduled_date TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('pending', 'attended', 'ghosted', 'cancelled')),
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (interviewer_email) REFERENCES interviewers(email) ON DELETE CASCADE
    )
  `,

  audit_logs: `
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_email TEXT NOT NULL,
      user_name TEXT NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      changes TEXT NOT NULL,
      timestamp TEXT NOT NULL
    )
  `,

  user_settings: `
    CREATE TABLE IF NOT EXISTS user_settings (
      id TEXT PRIMARY KEY,
      user_email TEXT NOT NULL,
      setting_key TEXT NOT NULL,
      setting_value TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(user_email, setting_key)
    )
  `,
};

/**
 * SQL statements for creating indexes
 */
export const CREATE_INDEXES_SQL = [
  "CREATE INDEX IF NOT EXISTS idx_interviewers_email ON interviewers(email)",
  "CREATE INDEX IF NOT EXISTS idx_interviewers_active ON interviewers(is_active)",
  "CREATE INDEX IF NOT EXISTS idx_events_interviewer ON interview_events(interviewer_email)",
  "CREATE INDEX IF NOT EXISTS idx_events_date ON interview_events(scheduled_date)",
  "CREATE INDEX IF NOT EXISTS idx_events_status ON interview_events(status)",
  "CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp)",
  "CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_email)",
  "CREATE INDEX IF NOT EXISTS idx_settings_user ON user_settings(user_email)",
];

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get current ISO timestamp
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}
