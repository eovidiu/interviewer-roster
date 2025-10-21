-- Add additional fields to users table for Issue #53
-- Adds picture URL and last_login_at tracking

-- Add picture field for user avatars (from Google OAuth)
ALTER TABLE users ADD COLUMN picture TEXT;

-- Add last_login_at to track login activity
ALTER TABLE users ADD COLUMN last_login_at TEXT;

-- Create index for login activity queries
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login_at);
