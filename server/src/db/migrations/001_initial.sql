-- Interviewer Roster Database Schema
-- SQLite3 compatible

-- Interviewers table
CREATE TABLE IF NOT EXISTS interviewers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('viewer', 'talent', 'admin')),
  skills TEXT NOT NULL, -- JSON array stored as TEXT
  is_active INTEGER NOT NULL DEFAULT 1,
  calendar_sync_enabled INTEGER NOT NULL DEFAULT 0,
  timezone TEXT,
  calendar_sync_consent_at TEXT,
  last_synced_at TEXT,
  created_by TEXT,
  modified_at TEXT,
  modified_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Interview Events table
CREATE TABLE IF NOT EXISTS interview_events (
  id TEXT PRIMARY KEY,
  interviewer_email TEXT NOT NULL,
  calendar_event_id TEXT,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  skills_assessed TEXT, -- JSON array stored as TEXT
  candidate_name TEXT,
  position TEXT,
  scheduled_date TEXT,
  duration_minutes INTEGER,
  status TEXT NOT NULL CHECK (status IN ('pending', 'attended', 'ghosted', 'cancelled')),
  notes TEXT,
  marked_by TEXT,
  marked_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (interviewer_email) REFERENCES interviewers(email) ON DELETE CASCADE
);

-- Audit Logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  changes TEXT NOT NULL, -- JSON object stored as TEXT
  timestamp TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Users table (for authentication)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('viewer', 'talent', 'admin')),
  google_id TEXT UNIQUE,
  password_hash TEXT, -- For local auth (optional)
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_interviewers_email ON interviewers(email);
CREATE INDEX IF NOT EXISTS idx_interviewers_is_active ON interviewers(is_active);
CREATE INDEX IF NOT EXISTS idx_events_interviewer_email ON interview_events(interviewer_email);
CREATE INDEX IF NOT EXISTS idx_events_status ON interview_events(status);
CREATE INDEX IF NOT EXISTS idx_events_start_time ON interview_events(start_time);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Trigger to update updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_interviewers_timestamp
AFTER UPDATE ON interviewers
FOR EACH ROW
BEGIN
  UPDATE interviewers SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_events_timestamp
AFTER UPDATE ON interview_events
FOR EACH ROW
BEGIN
  UPDATE interview_events SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_users_timestamp
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
  UPDATE users SET updated_at = datetime('now') WHERE id = NEW.id;
END;
